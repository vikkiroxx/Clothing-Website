import { Router } from "express";
import { createOrder, getOrder, listOrders } from "@/controllers/order.controller";
import { initiatePayment } from "@/controllers/payment.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:orderId/pay", initiatePayment);

export default router;
