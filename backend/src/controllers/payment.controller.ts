import { Request, Response } from "express";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middleware/auth";
import { PaymentProviderError } from "@/payments/types";
import {
  OrderNotPayableError,
  PaymentNotFoundError,
  RefundNotAllowedError,
  WebhookSignatureError,
  handleWebhook,
  reconcilePaymentStatus,
  refundPayment,
  startPayment,
} from "@/payments/service";

export async function initiatePayment(req: AuthRequest, res: Response) {
  const orderId = req.params.orderId as string;

  try {
    const payment = await startPayment(orderId, req.user!.id);
    res.status(201).json({
      paymentId: payment.id,
      providerOrderId: payment.providerOrderId,
      sessionId: payment.sessionId,
      status: payment.status,
    });
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    if (err instanceof OrderNotPayableError) {
      return res.status(409).json({ message: err.message });
    }
    if (err instanceof PaymentProviderError) {
      return res.status(502).json({ message: err.message });
    }
    throw err;
  }
}

export async function getPaymentStatus(req: AuthRequest, res: Response) {
  const providerOrderId = req.params.providerOrderId as string;

  try {
    const payment = await reconcilePaymentStatus(providerOrderId, req.user!.id);
    res.json({
      orderId: payment.orderId,
      providerOrderId: payment.providerOrderId,
      status: payment.status,
      failureMessage: payment.failureMessage,
    });
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (err instanceof PaymentProviderError) {
      return res.status(502).json({ message: err.message });
    }
    throw err;
  }
}

export async function cashfreeWebhook(req: Request & { rawBody?: string }, res: Response) {
  const signature = req.headers["x-webhook-signature"] as string | undefined;
  const timestamp = req.headers["x-webhook-timestamp"] as string | undefined;
  const rawBody = req.rawBody;

  if (!signature || !timestamp || !rawBody) {
    return res.status(400).json({ message: "Missing webhook signature headers or body" });
  }

  try {
    const bodyHash = createHash("sha256").update(rawBody).digest("hex");
    const result = await handleWebhook({ rawBody, signature, timestamp, bodyHash });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
    // Any other failure (DB hiccup, amount mismatch, etc.) — return 5xx so
    // the provider retries later rather than silently dropping the event.
    console.error("Cashfree webhook processing failed:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
}

const refundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().min(1).optional(),
});

export async function createAdminRefund(req: AuthRequest, res: Response) {
  const parsed = refundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const orderId = req.params.id as string;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  try {
    const refund = await refundPayment(orderId, parsed.data.amount, parsed.data.reason);
    res.status(201).json(refund);
  } catch (err) {
    if (err instanceof RefundNotAllowedError) {
      return res.status(409).json({ message: err.message });
    }
    if (err instanceof PaymentProviderError) {
      return res.status(502).json({ message: err.message });
    }
    throw err;
  }
}
