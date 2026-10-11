import { Router } from "express";
import { createOrder, getOrder, listOrders } from "@/controllers/order.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
