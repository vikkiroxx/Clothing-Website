import { Router } from "express";
import { createCategory, listCategories } from "@/controllers/category.controller";
import { requireAdmin, requireAuth } from "@/middleware/auth";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAuth, requireAdmin, createCategory);

export default router;
