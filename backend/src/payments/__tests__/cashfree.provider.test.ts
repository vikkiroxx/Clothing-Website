import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateOrder = vi.fn();
const mockFetchOrder = vi.fn();
const mockFetchPayments = vi.fn();
const mockCreateRefund = vi.fn();
const mockVerifySignature = vi.fn();

vi.mock("cashfree-pg", () => ({
  CFEnvironment: { SANDBOX: 1, PRODUCTION: 2 },
  // Must be a real function (not an arrow function) — the provider
  // constructs it with `new`, and arrow functions can never be constructors.
  Cashfree: vi.fn().mockImplementation(function MockCashfree() {
    return {
      PGCreateOrder: mockCreateOrder,
      PGFetchOrder: mockFetchOrder,
      PGOrderFetchPayments: mockFetchPayments,
      PGOrderCreateRefund: mockCreateRefund,
      PGVerifyWebhookSignature: mockVerifySignature,
    };
  }),
}));

import { CashfreeProvider, UnhandledWebhookEventError } from "@/payments/providers/cashfree/cashfree.provider";
import { PaymentProviderError, WebhookSignatureError } from "@/payments/types";

function makeProvider() {
  return new CashfreeProvider({
    environment: "SANDBOX",
    clientId: "id",
    clientSecret: "secret",
    apiVersion: "2026-01-01",
  });
}

const CUSTOMER = { id: "u1", name: "Test", email: "t@example.com", phone: "9999999999" };

describe("CashfreeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPayment", () => {
    it("maps a successful order creation to CreatePaymentResult", async () => {
      mockCreateOrder.mockResolvedValue({
        data: { payment_session_id: "sess_123", cf_order_id: "cford_1" },
      });

      const result = await makeProvider().createPayment({
        paymentId: "p1",
        providerOrderId: "pay_p1",
        idempotencyKey: "idem1",
        amount: 100,
        currency: "INR",
        customer: CUSTOMER,
        returnUrl: "https://example.com/result",
        notifyUrl: "https://example.com/webhook",
      });

      expect(result).toEqual({
        providerOrderId: "pay_p1",
        providerRefId: "cford_1",
        sessionId: "sess_123",
      });
    });

    it("throws PaymentProviderError when Cashfree returns no session id", async () => {
      mockCreateOrder.mockResolvedValue({ data: {} });

      await expect(
        makeProvider().createPayment({
          paymentId: "p1",
          providerOrderId: "pay_p1",
          idempotencyKey: "idem1",
          amount: 100,
          currency: "INR",
          customer: CUSTOMER,
          returnUrl: "https://example.com/result",
          notifyUrl: "https://example.com/webhook",
        }),
      ).rejects.toBeInstanceOf(PaymentProviderError);
    });

    it("wraps a Cashfree API error with its message", async () => {
      mockCreateOrder.mockRejectedValue({ response: { data: { message: "authentication Failed" } } });

      await expect(
        makeProvider().createPayment({
          paymentId: "p1",
          providerOrderId: "pay_p1",
          idempotencyKey: "idem1",
          amount: 100,
          currency: "INR",
          customer: CUSTOMER,
          returnUrl: "https://example.com/result",
          notifyUrl: "https://example.com/webhook",
        }),
      ).rejects.toThrow(/authentication Failed/);
    });
  });

  describe("getPaymentStatus", () => {
    it("maps Cashfree's SUCCESS payment_status to SUCCEEDED", async () => {
      mockFetchPayments.mockResolvedValue({
        data: [
          {
            cf_payment_id: "cfp1",
            payment_status: "SUCCESS",
            payment_amount: 100,
            payment_currency: "INR",
          },
        ],
      });

      const status = await makeProvider().getPaymentStatus("pay_p1");
      expect(status.status).toBe("SUCCEEDED");
      expect(status.providerPaymentId).toBe("cfp1");
    });

    it("maps USER_DROPPED to CANCELLED", async () => {
      mockFetchPayments.mockResolvedValue({
        data: [{ cf_payment_id: "cfp2", payment_status: "USER_DROPPED" }],
      });
      const status = await makeProvider().getPaymentStatus("pay_p1");
      expect(status.status).toBe("CANCELLED");
    });

    it("prefers a SUCCESS attempt over a later FAILED one in the list", async () => {
      mockFetchPayments.mockResolvedValue({
        data: [
          { cf_payment_id: "cfp1", payment_status: "SUCCESS" },
          { cf_payment_id: "cfp2", payment_status: "FAILED" },
        ],
      });
      const status = await makeProvider().getPaymentStatus("pay_p1");
      expect(status.status).toBe("SUCCEEDED");
      expect(status.providerPaymentId).toBe("cfp1");
    });

    it("falls back to the order status when no payment attempt exists yet", async () => {
      mockFetchPayments.mockResolvedValue({ data: [] });
      mockFetchOrder.mockResolvedValue({
        data: { order_status: "EXPIRED", order_amount: 100, order_currency: "INR" },
      });
      const status = await makeProvider().getPaymentStatus("pay_p1");
      expect(status.status).toBe("CANCELLED");
      expect(status.providerPaymentId).toBeNull();
    });

    it("treats an ACTIVE order with no payment attempt as still PENDING", async () => {
      mockFetchPayments.mockResolvedValue({ data: [] });
      mockFetchOrder.mockResolvedValue({ data: { order_status: "ACTIVE" } });
      const status = await makeProvider().getPaymentStatus("pay_p1");
      expect(status.status).toBe("PENDING");
    });
  });

  describe("verifyWebhook", () => {
    it("throws WebhookSignatureError when the SDK rejects the signature", async () => {
      mockVerifySignature.mockImplementation(() => {
        throw new Error("signature mismatch");
      });

      await expect(
        makeProvider().verifyWebhook({ rawBody: "{}", signature: "bad", timestamp: "1" }),
      ).rejects.toBeInstanceOf(WebhookSignatureError);
    });

    it("throws UnhandledWebhookEventError for a non-payment event type", async () => {
      mockVerifySignature.mockReturnValue({ type: "REFUND_STATUS_WEBHOOK", raw: "{}", object: {} });

      await expect(
        makeProvider().verifyWebhook({ rawBody: "{}", signature: "x", timestamp: "1" }),
      ).rejects.toBeInstanceOf(UnhandledWebhookEventError);
    });

    it("normalizes a verified PAYMENT_SUCCESS_WEBHOOK event", async () => {
      mockVerifySignature.mockReturnValue({
        type: "PAYMENT_SUCCESS_WEBHOOK",
        raw: "{}",
        object: {
          data: {
            order: { order_id: "pay_p1" },
            payment: {
              cf_payment_id: "cfp1",
              payment_status: "SUCCESS",
              payment_amount: 100,
              payment_currency: "INR",
            },
          },
        },
      });

      const event = await makeProvider().verifyWebhook({
        rawBody: "{}",
        signature: "x",
        timestamp: "1",
      });

      expect(event).toMatchObject({
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "SUCCEEDED",
        amount: 100,
        currency: "INR",
      });
    });

    it("throws when a payment webhook is missing the order id", async () => {
      mockVerifySignature.mockReturnValue({
        type: "PAYMENT_FAILED_WEBHOOK",
        raw: "{}",
        object: { data: { payment: { payment_status: "FAILED" } } },
      });

      await expect(
        makeProvider().verifyWebhook({ rawBody: "{}", signature: "x", timestamp: "1" }),
      ).rejects.toBeInstanceOf(PaymentProviderError);
    });
  });

  describe("refundPayment", () => {
    it("maps a pending refund response", async () => {
      mockCreateRefund.mockResolvedValue({ data: { cf_refund_id: "rfd1", refund_status: "PENDING" } });
      const result = await makeProvider().refundPayment({
        providerOrderId: "pay_p1",
        refundRef: "r1",
        amount: 50,
      });
      expect(result).toEqual({ providerRefundId: "rfd1", status: "PENDING" });
    });
  });
});
