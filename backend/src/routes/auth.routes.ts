import { Router } from "express";
import { login, requestSignupOtp, verifySignupOtp } from "@/controllers/auth.controller";

const router = Router();

router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/login", login);

export default router;
