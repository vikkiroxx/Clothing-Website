import { beforeEach, describe, expect, it, vi } from "vitest";
// vitest hoists vi.mock() calls above all imports in this file (even this
// static one), so @/config/prisma and @/payments/factory are already mocked
// by the time @/payments/service's own top-level imports resolve them.
import {
  RefundNotAllowedError,
  handleWebhook,
  reconcilePaymentStatus,
  refundPayment,
} from "@/payments/service";

// A minimal in-memory stand-in for the slice of Prisma this module uses.
// Real end-to-end behavior (actual Postgres, actual Cashfree sandbox calls)
// was verified manually — see PAYMENTS.md — this covers the business rules
// in isolation, independent of any database or network.
interface FakeOrder {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingAddress: unknown;
}
interface FakePayment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  idempotencyKey: string;
  sessionId: string | null;
  failureMessage?: string | null;
}

// vi.mock() factories are hoisted above *all* other top-level code in this
// file, including plain `const`/`function` declarations — so the fake DB
// they reference has to be built inside vi.hoisted(), which vitest hoists to
// that same position, instead of a later top-level `createFakeDb()` call.
function createFakeDb() {
  const orders = new Map<string, FakeOrder>();
  const payments = new Map<string, FakePayment>();
  const refunds = new Map<string, { id: string; paymentId: string; amount: number; status: string }>();
  const webhookEvents = new Map<string, { provider: string; paymentId: string | null; type: string; bodyHash: string }>();

  const client: Record<string, unknown> = {
    order: {
      findFirst: vi.fn(async ({ where, include }: { where: { id: string; userId?: string }; include?: Record<string, unknown> }) => {
        const o = orders.get(where.id);
        if (!o) return null;
        if (where.userId && o.userId !== where.userId) return null;
        const result: Record<string, unknown> = { ...o };
        if (include?.payments) {
          result.payments = [...payments.values()]
            .filter((p) => p.orderId === o.id)
            .sort((a, b) => b.id.localeCompare(a.id));
        }
        if (include?.user) result.user = { id: o.userId, name: "Test User", email: "t@example.com" };
        return result;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => orders.get(where.id) ?? null),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; status?: string }; data: Partial<FakeOrder> }) => {
        const o = orders.get(where.id);
        if (!o || (where.status && o.status !== where.status)) return { count: 0 };
        Object.assign(o, data);
        return { count: 1 };
      }),
    },
    payment: {
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { id?: string; provider_providerOrderId?: { provider: string; providerOrderId: string } };
          include?: { order?: boolean };
        }) => {
          let found: FakePayment | null = null;
          if (where.id) found = payments.get(where.id) ?? null;
          if (where.provider_providerOrderId) {
            const { provider, providerOrderId } = where.provider_providerOrderId;
            found =
              [...payments.values()].find((p) => p.provider === provider && p.providerOrderId === providerOrderId) ??
              null;
          }
          if (!found) return null;
          if (include?.order) return { ...found, order: orders.get(found.orderId) ?? null };
          return found;
        },
      ),
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
        const p = payments.get(where.id);
        if (!p) throw new Error("Payment not found");
        return p;
      }),
      findFirst: vi.fn(async ({ where }: { where: { orderId: string; status?: { in: string[] } } }) => {
        const match = [...payments.values()].find(
          (p) => p.orderId === where.orderId && (!where.status || where.status.in.includes(p.status)),
        );
        return match
          ? { ...match, refunds: [...refunds.values()].filter((r) => r.paymentId === match.id) }
          : null;
      }),
      create: vi.fn(async ({ data }: { data: FakePayment }) => {
        const p = { ...data };
        payments.set(p.id, p);
        return p;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakePayment> }) => {
        const p = payments.get(where.id)!;
        Object.assign(p, data);
        return p;
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id?: string | { not: string }; status?: string | { in: string[] }; orderId?: string };
          data: Partial<FakePayment>;
        }) => {
          let count = 0;
          for (const p of payments.values()) {
            if (where.orderId && p.orderId !== where.orderId) continue;
            if (typeof where.id === "string" && p.id !== where.id) continue;
            if (where.id && typeof where.id === "object" && p.id === where.id.not) continue;
            if (typeof where.status === "string" && p.status !== where.status) continue;
            if (where.status && typeof where.status === "object" && !where.status.in.includes(p.status)) continue;
            Object.assign(p, data);
            count++;
          }
          return { count };
        },
      ),
    },
    refund: {
      create: vi.fn(async ({ data }: { data: { paymentId: string; amount: number } }) => {
        const r = { id: `refund_${refunds.size + 1}`, status: "PENDING", ...data };
        refunds.set(r.id, r);
        return r;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const r = refunds.get(where.id)!;
        Object.assign(r, data);
        return r;
      }),
    },
    paymentWebhookEvent: {
      findUnique: vi.fn(async ({ where }: { where: { provider_bodyHash: { provider: string; bodyHash: string } } }) => {
        const key = `${where.provider_bodyHash.provider}:${where.provider_bodyHash.bodyHash}`;
        return webhookEvents.get(key) ?? null;
      }),
      create: vi.fn(async ({ data }: { data: { provider: string; paymentId: string | null; type: string; bodyHash: string } }) => {
        webhookEvents.set(`${data.provider}:${data.bodyHash}`, data);
        return data;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(client)),
  };

  return { client, orders, payments, refunds, webhookEvents };
}

const db = vi.hoisted(() => createFakeDb());

vi.mock("@/config/prisma", () => ({ prisma: db.client }));

const mockProvider = vi.hoisted(() => ({
  id: "CASHFREE" as const,
  createPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  verifyWebhook: vi.fn(),
  refundPayment: vi.fn(),
}));
vi.mock("@/payments/factory", () => ({ getPaymentProvider: () => mockProvider }));

function seedOrderWithPayment(opts: {
  orderId: string;
  paymentId: string;
  amount: number;
  status: string;
  orderStatus?: string;
}) {
  db.orders.set(opts.orderId, {
    id: opts.orderId,
    userId: "user1",
    status: opts.orderStatus ?? "PENDING",
    totalAmount: opts.amount,
    shippingAddress: {},
  });
  db.payments.set(opts.paymentId, {
    id: opts.paymentId,
    orderId: opts.orderId,
    provider: "CASHFREE",
    providerOrderId: `pay_${opts.paymentId}`,
    providerPaymentId: null,
    amount: opts.amount,
    currency: "INR",
    status: opts.status,
    idempotencyKey: `idem_${opts.paymentId}`,
    sessionId: null,
  });
}

describe("payments service", () => {
  beforeEach(() => {
    db.orders.clear();
    db.payments.clear();
    db.refunds.clear();
    db.webhookEvents.clear();
    vi.clearAllMocks();
  });

  describe("handleWebhook", () => {
    it("marks the payment SUCCEEDED and the order PAID on a verified success event", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_SUCCESS_WEBHOOK",
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "SUCCEEDED",
        amount: 500,
        currency: "INR",
      });

      const result = await handleWebhook({
        rawBody: "{}",
        signature: "sig",
        timestamp: "1",
        bodyHash: "hash1",
      });

      expect(result).toEqual({ duplicate: false, handled: true });
      expect(db.payments.get("p1")!.status).toBe("SUCCEEDED");
      expect(db.orders.get("o1")!.status).toBe("PAID");
    });

    it("cancels sibling payment attempts once one succeeds", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      seedOrderWithPayment({ orderId: "o1", paymentId: "p2", amount: 500, status: "PENDING" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_SUCCESS_WEBHOOK",
        providerOrderId: "pay_p2",
        providerPaymentId: "cfp2",
        status: "SUCCEEDED",
        amount: 500,
        currency: "INR",
      });

      await handleWebhook({ rawBody: "{}", signature: "sig", timestamp: "1", bodyHash: "hash1" });

      expect(db.payments.get("p2")!.status).toBe("SUCCEEDED");
      expect(db.payments.get("p1")!.status).toBe("CANCELLED");
    });

    it("rejects a webhook whose amount does not match the stored payment", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_SUCCESS_WEBHOOK",
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "SUCCEEDED",
        amount: 1, // attacker/bug claiming a far smaller amount was paid
        currency: "INR",
      });

      await expect(
        handleWebhook({ rawBody: "{}", signature: "sig", timestamp: "1", bodyHash: "hash1" }),
      ).rejects.toThrow(/amount mismatch/);

      expect(db.payments.get("p1")!.status).toBe("PENDING");
      expect(db.orders.get("o1")!.status).toBe("PENDING");
    });

    it("does not record the event when processing fails, so a retry gets a real second attempt", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_SUCCESS_WEBHOOK",
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "SUCCEEDED",
        amount: 1,
        currency: "INR",
      });

      await expect(
        handleWebhook({ rawBody: "{}", signature: "sig", timestamp: "1", bodyHash: "hash1" }),
      ).rejects.toThrow();

      const retry = await handleWebhook({
        rawBody: "{}",
        signature: "sig",
        timestamp: "1",
        bodyHash: "hash1",
      }).catch((e) => e);
      // Still a genuine retry attempt (another thrown mismatch), not a
      // silently-swallowed "duplicate" response.
      expect(retry).toBeInstanceOf(Error);
    });

    it("ignores a duplicate delivery of an already-processed event", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_SUCCESS_WEBHOOK",
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "SUCCEEDED",
        amount: 500,
        currency: "INR",
      });

      await handleWebhook({ rawBody: "{}", signature: "sig", timestamp: "1", bodyHash: "hash1" });
      const second = await handleWebhook({
        rawBody: "{}",
        signature: "sig",
        timestamp: "1",
        bodyHash: "hash1",
      });

      expect(second).toEqual({ duplicate: true, handled: false });
      expect(mockProvider.verifyWebhook).toHaveBeenCalledTimes(1);
    });

    it("does not let a late/out-of-order failure regress an already-succeeded payment", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "SUCCEEDED", orderStatus: "PAID" });
      mockProvider.verifyWebhook.mockResolvedValue({
        rawType: "PAYMENT_FAILED_WEBHOOK",
        providerOrderId: "pay_p1",
        providerPaymentId: "cfp1",
        status: "FAILED",
        amount: 500,
        currency: "INR",
      });

      const result = await handleWebhook({
        rawBody: "{}",
        signature: "sig",
        timestamp: "1",
        bodyHash: "hash-late",
      });

      expect(result).toEqual({ duplicate: false, handled: true });
      expect(db.payments.get("p1")!.status).toBe("SUCCEEDED");
      expect(db.orders.get("o1")!.status).toBe("PAID");
    });
  });

  describe("reconcilePaymentStatus", () => {
    it("rejects a customer looking up another customer's payment", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "PENDING" });
      await expect(reconcilePaymentStatus("pay_p1", "someone-else")).rejects.toThrow(
        "Payment not found",
      );
    });
  });

  describe("refundPayment", () => {
    it("rejects when no successful payment exists for the order", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "FAILED" });
      await expect(refundPayment("o1", 100, undefined)).rejects.toBeInstanceOf(RefundNotAllowedError);
    });

    it("rejects a refund amount exceeding the refundable balance", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "SUCCEEDED", orderStatus: "PAID" });
      await expect(refundPayment("o1", 501, undefined)).rejects.toThrow(/must be between/);
    });

    it("accepts a valid partial refund and marks the payment PARTIALLY_REFUNDED", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "SUCCEEDED", orderStatus: "PAID" });
      mockProvider.refundPayment.mockResolvedValue({ providerRefundId: "rfd1", status: "SUCCEEDED" });

      await refundPayment("o1", 200, "customer request");

      expect(db.payments.get("p1")!.status).toBe("PARTIALLY_REFUNDED");
    });

    it("prevents a second refund from exceeding what remains after a prior one", async () => {
      seedOrderWithPayment({ orderId: "o1", paymentId: "p1", amount: 500, status: "SUCCEEDED", orderStatus: "PAID" });
      mockProvider.refundPayment.mockResolvedValue({ providerRefundId: "rfd1", status: "SUCCEEDED" });
      await refundPayment("o1", 300, undefined);

      // payment is now PARTIALLY_REFUNDED with 300 already refunded; only 200 left
      await expect(refundPayment("o1", 201, undefined)).rejects.toThrow(/must be between/);
    });
  });
});
