import { randomUUID } from "crypto";
import { Order, Payment } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { getPaymentProvider } from "@/payments/factory";
import {
  NormalizedPaymentStatus,
  PaymentCustomer,
  PaymentProviderError,
  VerifiedWebhookEvent,
  WebhookSignatureError,
} from "@/payments/types";
import { UnhandledWebhookEventError } from "@/payments/providers/cashfree/cashfree.provider";

const ACTIVE_STATUSES = ["PENDING", "PROCESSING"] as const;
const TERMINAL_STATUSES = ["SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"];
const REFUND_OPEN_STATUSES = ["PENDING", "SUCCEEDED"];

function frontendUrl() {
  return process.env.FRONTEND_URL ?? "http://localhost:3000";
}

function backendUrl() {
  return process.env.BACKEND_PUBLIC_URL ?? "http://localhost:5000";
}

function buildReturnUrl() {
  // {order_id} is a literal placeholder Cashfree substitutes before redirecting —
  // not a template to fill in ourselves.
  return `${frontendUrl()}/checkout/result?order_id={order_id}`;
}

function buildNotifyUrl() {
  return `${backendUrl()}/api/payments/webhooks/cashfree`;
}

function extractPhone(order: Order): string | undefined {
  const addr = order.shippingAddress as { phone?: string } | null;
  return addr?.phone;
}

export class OrderNotPayableError extends Error {}
export class PaymentNotFoundError extends Error {}
export class RefundNotAllowedError extends Error {}

// Starts a new payment attempt for an order, or — if one is already in
// flight — asks the provider to refresh it rather than creating a duplicate
// (stock was already decremented once, at order creation; this never touches
// stock again).
export async function startPayment(orderId: string, requestingUserId: string): Promise<Payment> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: requestingUserId },
    include: { payments: { orderBy: { createdAt: "desc" } }, user: true },
  });

  if (!order) throw new PaymentNotFoundError("Order not found");
  if (order.status !== "PENDING") {
    throw new OrderNotPayableError(`Order is ${order.status.toLowerCase()}, not payable`);
  }

  const provider = getPaymentProvider();
  const customer: PaymentCustomer = {
    id: order.user.id,
    name: order.user.name,
    email: order.user.email,
    phone: extractPhone(order) ?? "9999999999",
  };

  const active = order.payments.find((p) =>
    (ACTIVE_STATUSES as readonly string[]).includes(p.status),
  );

  if (active) {
    const result = await provider.createPayment({
      paymentId: active.id,
      providerOrderId: active.providerOrderId,
      idempotencyKey: active.idempotencyKey,
      amount: Number(active.amount),
      currency: active.currency,
      customer,
      returnUrl: buildReturnUrl(),
      notifyUrl: buildNotifyUrl(),
    });
    return prisma.payment.update({
      where: { id: active.id },
      data: { sessionId: result.sessionId, providerRefId: result.providerRefId },
    });
  }

  const paymentId = randomUUID();
  const providerOrderId = `pay_${paymentId}`;
  const idempotencyKey = randomUUID();

  const created = await prisma.payment.create({
    data: {
      id: paymentId,
      orderId: order.id,
      provider: provider.id,
      providerOrderId,
      idempotencyKey,
      amount: order.totalAmount,
      currency: "INR",
      status: "PENDING",
    },
  });

  try {
    const result = await provider.createPayment({
      paymentId,
      providerOrderId,
      idempotencyKey,
      amount: Number(order.totalAmount),
      currency: "INR",
      customer,
      returnUrl: buildReturnUrl(),
      notifyUrl: buildNotifyUrl(),
    });

    return await prisma.payment.update({
      where: { id: created.id },
      data: { sessionId: result.sessionId, providerRefId: result.providerRefId },
    });
  } catch (err) {
    await prisma.payment.update({
      where: { id: created.id },
      data: {
        status: "FAILED",
        failureMessage:
          err instanceof PaymentProviderError ? err.message : "Could not start payment",
      },
    });
    throw err;
  }
}

// The single trusted entry point for recording a payment outcome, called
// from both the webhook handler and the customer-facing status-reconcile
// endpoint. Idempotent: safe to call twice with the same (or stale) result,
// and safe under concurrent calls (the update is guarded on the status it
// read, so only one concurrent caller can win the transition).
async function applyVerifiedResult(
  payment: Payment,
  result: {
    status: NormalizedPaymentStatus;
    providerPaymentId: string | null;
    amount: number | null;
    currency: string | null;
    failureMessage?: string | null;
  },
): Promise<{ applied: boolean; payment: Payment }> {
  if (TERMINAL_STATUSES.includes(payment.status)) {
    return { applied: false, payment };
  }

  if (result.amount != null && Math.abs(result.amount - Number(payment.amount)) > 0.01) {
    throw new Error(
      `Refusing to apply payment result: amount mismatch (expected ${payment.amount}, got ${result.amount})`,
    );
  }
  if (result.currency && result.currency !== payment.currency) {
    throw new Error(
      `Refusing to apply payment result: currency mismatch (expected ${payment.currency}, got ${result.currency})`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.payment.updateMany({
      where: { id: payment.id, status: payment.status },
      data: {
        status: result.status,
        providerPaymentId: result.providerPaymentId ?? payment.providerPaymentId,
        failureMessage: result.failureMessage ?? undefined,
      },
    });

    if (updateResult.count === 0) {
      // A concurrent call already moved this payment on — idempotent no-op.
      const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      return { applied: false, payment: current };
    }

    if (result.status === "SUCCEEDED") {
      await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: { status: "PAID" },
      });
      // Any sibling attempt (e.g. an abandoned first try) is now moot.
      await tx.payment.updateMany({
        where: {
          orderId: payment.orderId,
          id: { not: payment.id },
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: { status: "CANCELLED" },
      });
    }

    const updated = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    return { applied: true, payment: updated };
  });
}

export async function reconcilePaymentStatus(
  providerOrderId: string,
  requestingUserId: string,
): Promise<Payment> {
  const provider = getPaymentProvider();
  const payment = await prisma.payment.findUnique({
    where: { provider_providerOrderId: { provider: provider.id, providerOrderId } },
    include: { order: true },
  });

  if (!payment || payment.order.userId !== requestingUserId) {
    throw new PaymentNotFoundError("Payment not found");
  }

  if (TERMINAL_STATUSES.includes(payment.status)) {
    return payment;
  }

  const status = await provider.getPaymentStatus(providerOrderId);
  const { payment: result } = await applyVerifiedResult(payment, status);
  return result;
}

export async function handleWebhook(args: {
  rawBody: string;
  signature: string;
  timestamp: string;
  bodyHash: string;
}): Promise<{ duplicate: boolean; handled: boolean }> {
  const provider = getPaymentProvider();

  const existingEvent = await prisma.paymentWebhookEvent.findUnique({
    where: { provider_bodyHash: { provider: provider.id, bodyHash: args.bodyHash } },
  });
  if (existingEvent) {
    return { duplicate: true, handled: false };
  }

  const recordEvent = (paymentId: string | null, type: string) =>
    prisma.paymentWebhookEvent.create({
      data: { provider: provider.id, paymentId, type, bodyHash: args.bodyHash },
    });

  let event: VerifiedWebhookEvent;
  try {
    event = await provider.verifyWebhook(args);
  } catch (err) {
    if (err instanceof UnhandledWebhookEventError) {
      // Not a webhook type we act on (e.g. a refund/dispute event) — safe to
      // record immediately, since there's nothing to ever retry here.
      await recordEvent(null, err.type);
      return { duplicate: false, handled: false };
    }
    throw err;
  }

  const payment = await prisma.payment.findUnique({
    where: { provider_providerOrderId: { provider: provider.id, providerOrderId: event.providerOrderId } },
  });

  if (!payment) {
    // Unrecognized order_id — nothing we can reconcile against, and this
    // won't change on retry either. Ack so the provider stops retrying.
    await recordEvent(null, event.rawType);
    return { duplicate: false, handled: false };
  }

  // Record the dedup event only *after* successfully applying it — if
  // applyVerifiedResult throws (amount mismatch, transient DB error), this
  // event is deliberately left unrecorded so a provider retry of the same
  // body gets a genuine second attempt instead of being swallowed as a
  // "duplicate" of a failed attempt.
  await applyVerifiedResult(payment, event);
  await recordEvent(payment.id, event.rawType);
  return { duplicate: false, handled: true };
}

// Admin-triggered only (enforced by the controller/route, not here) — a
// deliberate action, never an automatic side effect of changing order status.
export async function refundPayment(
  orderId: string,
  amount: number,
  reason: string | undefined,
) {
  const payment = await prisma.payment.findFirst({
    where: { orderId, status: { in: ["SUCCEEDED", "PARTIALLY_REFUNDED"] } },
    include: { refunds: true },
  });

  if (!payment) {
    throw new RefundNotAllowedError("No successful payment found for this order");
  }

  const alreadyRefunded = payment.refunds
    .filter((r) => REFUND_OPEN_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const refundable = Number(payment.amount) - alreadyRefunded;

  if (amount <= 0 || amount > refundable + 0.01) {
    throw new RefundNotAllowedError(
      `Refund amount must be between 0.01 and ${refundable.toFixed(2)} (already refunded: ${alreadyRefunded.toFixed(2)})`,
    );
  }

  const refundRef = `rfd_${randomUUID()}`;
  const refund = await prisma.refund.create({
    data: { paymentId: payment.id, refundRef, amount, reason, status: "PENDING" },
  });

  const provider = getPaymentProvider();
  try {
    const result = await provider.refundPayment({
      providerOrderId: payment.providerOrderId,
      refundRef,
      amount,
      reason,
    });

    const updatedRefund = await prisma.refund.update({
      where: { id: refund.id },
      data: { status: result.status, providerRefundId: result.providerRefundId },
    });

    if (REFUND_OPEN_STATUSES.includes(updatedRefund.status)) {
      const totalRefunded = alreadyRefunded + amount;
      const paymentStatus =
        totalRefunded >= Number(payment.amount) - 0.01 ? "REFUNDED" : "PARTIALLY_REFUNDED";
      await prisma.payment.update({ where: { id: payment.id }, data: { status: paymentStatus } });
    }

    return updatedRefund;
  } catch (err) {
    await prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
    throw err;
  }
}

export { WebhookSignatureError };
