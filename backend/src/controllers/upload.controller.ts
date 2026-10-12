import { Request, Response } from "express";
import { cloudinary } from "@/config/cloudinary";

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "clothing-store/products" },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(uploadResult);
        },
      );
      stream.end(req.file!.buffer);
    },
  );

  res.status(201).json({ url: result.secure_url, publicId: result.public_id });
}
