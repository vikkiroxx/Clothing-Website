import { Router } from "express";
import { addAddress, deleteAddress, getMe, updateMe } from "@/controllers/user.controller";
import { requireAuth } from "@/middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.post("/me/addresses", addAddress);
router.delete("/me/addresses/:id", deleteAddress);

export default router;
