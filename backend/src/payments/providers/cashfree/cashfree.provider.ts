import { Cashfree, CFEnvironment } from "cashfree-pg";
import type { AxiosError } from "axios";
import {
  CreatePaymentInput,
  CreatePaymentResult,
  NormalizedPaymentStatus,
  NormalizedRefundStatus,
  PaymentProviderError,
  PaymentStatusResult,
  RefundInput,
  RefundResult,
  VerifiedWebhookEvent,
  WebhookSignatureError,
} from "@/payments/types";
import { PaymentProvider } from "@/payments/provider.interface";

// Payment-gateway webhook types we actually act on. Cashfree also sends
// REFUND_* and DISPUTE_* webhooks — those are intentionally not handled here;
// see PAYMENTS.md for why and what that means in practice.
const HANDLED_WEBHOOK_TYPES = new Set([
  "PAYMENT_SUCCESS_WEBHOOK",
  "PAYMENT_FAILED_WEBHOOK",
  "PAYMENT_USER_DROPPED_WEBHOOK",
]);

export class UnhandledWebhookEventError extends Error {
  constructor(public readonly type: string) {
    super(`Unhandled Cashfree webhook type: ${type}`);
    this.name = "UnhandledWebhookEventError";
  }
}

// Cashfree's payment_status -> our normalized status.
function mapPaymentStatus(status: string | undefined): NormalizedPaymentStatus {
  switch (status) {
    case "SUCCESS":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    case "USER_DROPPED":
    case "VOID":
    case "CANCELLED":
      return "CANCELLED";
    case "PENDING":
      return "PROCESSING";
    case "NOT_ATTEMPTED":
    default:
      return "PENDING";
  }
}

function mapRefundStatus(status: string | undefined): NormalizedRefundStatus {
  switch (status) {
    case "SUCCESS":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    case "PENDING":
    case "ONHOLD":
    default:
      return "PENDING";
  }
}

function toProviderError(err: unknown, context: string): PaymentProviderError {
  const axiosErr = err as AxiosError<{ message?: string }>;
  const message = axiosErr?.response?.data?.message ?? (err as Error)?.message ?? "Unknown error";
  return new PaymentProviderError(`Cashfree ${context} failed: ${message}`, "CASHFREE_ERROR", err);
}

export interface CashfreeConfig {
  environment: "SANDBOX" | "PRODUCTION";
  clientId: string;
  clientSecret: string;
  apiVersion: string;
}

export class CashfreeProvider implements PaymentProvider {
  readonly id = "CASHFREE" as const;
  private client: Cashfree;

  constructor(config: CashfreeConfig) {
    this.client = new Cashfree(
      config.environment === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      config.clientId,
      config.clientSecret,
    );
    this.client.XApiVersion = config.apiVersion;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const res = await this.client.PGCreateOrder(
        {
          order_id: input.providerOrderId,
          order_amount: input.amount,
          order_currency: input.currency,
          customer_details: {
            customer_id: input.customer.id,
            customer_name: input.customer.name,
            customer_email: input.customer.email,
            customer_phone: input.customer.phone,
          },
          order_meta: {
            return_url: input.returnUrl,
            notify_url: input.notifyUrl,
          },
        },
        undefined,
        input.idempotencyKey,
      );

      const sessionId = res.data.payment_session_id;
      if (!sessionId) {
        throw new PaymentProviderError(
          "Cashfree did not return a payment_session_id",
          "CASHFREE_NO_SESSION",
        );
      }

      return {
        providerOrderId: input.providerOrderId,
        providerRefId: res.data.cf_order_id ?? null,
        sessionId,
      };
    } catch (err) {
      if (err instanceof PaymentProviderError) throw err;
      throw toProviderError(err, "create order");
    }
  }

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    try {
      const paymentsRes = await this.client.PGOrderFetchPayments(providerOrderId);
      const payments = paymentsRes.data ?? [];

      // Multiple payment methods can be attempted against one Cashfree order
      // (e.g. a failed card attempt followed by a successful UPI one) — a
      // successful one always wins; otherwise take the most recent attempt.
      const succeeded = payments.find((p) => p.payment_status === "SUCCESS");
      const latest = succeeded ?? payments[payments.length - 1];

      if (!latest) {
        // No payment attempt has reached Cashfree yet — check the order itself
        // to distinguish "still waiting" from "expired/terminated".
        const orderRes = await this.client.PGFetchOrder(providerOrderId);
        const orderStatus = orderRes.data.order_status;
        const status: NormalizedPaymentStatus =
          orderStatus === "EXPIRED" || orderStatus === "TERMINATED" ? "CANCELLED" : "PENDING";
        return {
          providerOrderId,
          providerPaymentId: null,
          status,
          amount: orderRes.data.order_amount ?? null,
          currency: orderRes.data.order_currency ?? null,
        };
      }

      return {
        providerOrderId,
        providerPaymentId: latest.cf_payment_id ?? null,
        status: mapPaymentStatus(latest.payment_status),
        amount: latest.payment_amount ?? null,
        currency: latest.payment_currency ?? null,
        failureCode: latest.error_details?.error_code ?? null,
        failureMessage: latest.error_details?.error_description ?? null,
      };
    } catch (err) {
      throw toProviderError(err, "fetch payment status");
    }
  }

  async verifyWebhook(args: {
    rawBody: string;
    signature: string;
    timestamp: string;
  }): Promise<VerifiedWebhookEvent> {
    let event;
    try {
      event = this.client.PGVerifyWebhookSignature(args.signature, args.rawBody, args.timestamp);
    } catch (err) {
      throw new WebhookSignatureError((err as Error)?.message);
    }

    if (!HANDLED_WEBHOOK_TYPES.has(event.type)) {
      throw new UnhandledWebhookEventError(event.type);
    }

    const payload = event.object as {
      data?: {
        order?: { order_id?: string };
        payment?: {
          cf_payment_id?: string;
          payment_status?: string;
          payment_amount?: number;
          payment_currency?: string;
          payment_message?: string;
        };
      };
    };

    const orderId = payload.data?.order?.order_id;
    if (!orderId) {
      throw new PaymentProviderError(
        "Webhook payload missing data.order.order_id",
        "CASHFREE_MALFORMED_WEBHOOK",
      );
    }

    const payment = payload.data?.payment;

    return {
      rawType: event.type,
      providerOrderId: orderId,
      providerPaymentId: payment?.cf_payment_id ?? null,
      status: mapPaymentStatus(payment?.payment_status),
      amount: payment?.payment_amount ?? null,
      currency: payment?.payment_currency ?? null,
      failureMessage: payment?.payment_message ?? null,
    };
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    try {
      const res = await this.client.PGOrderCreateRefund(input.providerOrderId, {
        refund_amount: input.amount,
        refund_id: input.refundRef,
        refund_note: input.reason,
      });

      return {
        providerRefundId: res.data.cf_refund_id ?? null,
        status: mapRefundStatus(res.data.refund_status),
      };
    } catch (err) {
      throw toProviderError(err, "create refund");
    }
  }
}
