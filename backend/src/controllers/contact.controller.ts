import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  comment: z.string().min(1),
});

export async function submitContactMessage(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const message = await prisma.contactMessage.create({ data: parsed.data });
  res.status(201).json(message);
}
