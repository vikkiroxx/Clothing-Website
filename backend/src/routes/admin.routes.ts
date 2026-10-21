import { Router } from "express";
import { getAdminProduct, listAdminProducts } from "@/controllers/product.controller";
import { getAdminOrder, listAdminOrders, updateAdminOrder } from "@/controllers/order.controller";
import {
  deleteAdminMessage,
  listAdminMessages,
  updateAdminMessage,
} from "@/controllers/contact.controller";
import { createAdminRefund } from "@/controllers/payment.controller";
import { requireAdmin, requireAuth } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/products", listAdminProducts);
router.get("/products/:id", getAdminProduct);
router.get("/orders", listAdminOrders);
router.get("/orders/:id", getAdminOrder);
router.patch("/orders/:id", updateAdminOrder);
router.post("/orders/:id/refund", createAdminRefund);
router.get("/messages", listAdminMessages);
router.patch("/messages/:id", updateAdminMessage);
router.delete("/messages/:id", deleteAdminMessage);

export default router;
