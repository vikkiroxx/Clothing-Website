import { Router } from "express";
import { cashfreeWebhook, getPaymentStatus } from "@/controllers/payment.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

// Public — authenticated via provider webhook signature, not a customer JWT.
router.post("/webhooks/cashfree", cashfreeWebhook);

router.get("/status/:providerOrderId", requireAuth, getPaymentStatus);

export default router;
