import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/controllers/category.controller";
import { requireAdmin, requireAuth } from "@/middleware/auth";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAuth, requireAdmin, createCategory);
router.patch("/:id", requireAuth, requireAdmin, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

export default router;
