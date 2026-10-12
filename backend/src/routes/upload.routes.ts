import { NextFunction, Request, Response, Router } from "express";
import { uploadImage } from "@/controllers/upload.controller";
import { requireAdmin, requireAuth } from "@/middleware/auth";
import { upload } from "@/middleware/upload";

const router = Router();

function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : "Invalid upload" });
    }
    next();
  });
}

router.post("/", requireAuth, requireAdmin, handleUpload, uploadImage);

export default router;
