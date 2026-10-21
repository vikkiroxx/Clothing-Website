// Provider-independent payment domain types. Nothing outside src/payments
// should ever import a provider SDK type directly — only these.

export type ProviderId = "CASHFREE";

// Mirrors the Prisma PaymentStatus enum deliberately (not imported from
// @prisma/client) so this module has zero compile-time dependency on the ORM.
export type NormalizedPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type NormalizedRefundStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface PaymentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CreatePaymentInput {
  /** Our own Payment.id — not sent to the provider, just for logging/tracing. */
  paymentId: string;
  /** The order_id (or equivalent) we send the provider for this attempt. */
  providerOrderId: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  customer: PaymentCustomer;
  /** Where the provider should send the customer back after checkout. */
  returnUrl: string;
  /** Where the provider should send server-to-server webhook calls. */
  notifyUrl: string;
}

export interface CreatePaymentResult {
  providerOrderId: string;
  /** The provider's own reference for the order, if it returns one up front. */
  providerRefId: string | null;
  /** Opaque token/URL the frontend needs to launch the provider's checkout UI. */
  sessionId: string;
}

export interface PaymentStatusResult {
  providerOrderId: string;
  providerPaymentId: string | null;
  status: NormalizedPaymentStatus;
  amount: number | null;
  currency: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export interface VerifiedWebhookEvent {
  /** Raw provider event type string (e.g. "PAYMENT_SUCCESS_WEBHOOK"), kept for logging. */
  rawType: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  status: NormalizedPaymentStatus;
  amount: number | null;
  currency: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export interface RefundInput {
  providerOrderId: string;
  refundRef: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string | null;
  status: NormalizedRefundStatus;
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string = "PROVIDER_ERROR",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PaymentProviderError";
  }
}

export class WebhookSignatureError extends Error {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "WebhookSignatureError";
  }
}
