import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  ProviderId,
  RefundInput,
  RefundResult,
  VerifiedWebhookEvent,
} from "@/payments/types";

// Every gateway adapter implements exactly this. Checkout, order management,
// and the frontend only ever talk to PaymentsService, which only ever talks
// to this interface — never to a provider SDK directly.
export interface PaymentProvider {
  readonly id: ProviderId;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult>;

  /**
   * Verifies the raw webhook body/signature and returns a normalized event.
   * Must throw WebhookSignatureError (never silently return a "failed" status)
   * if verification fails — callers rely on the throw to reject the request.
   */
  verifyWebhook(args: {
    rawBody: string;
    signature: string;
    timestamp: string;
  }): Promise<VerifiedWebhookEvent>;

  refundPayment(input: RefundInput): Promise<RefundResult>;
}
