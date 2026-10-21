import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  comment: z.string().min(1),
});

const updateMessageSchema = z.object({
  isRead: z.boolean(),
});

export async function submitContactMessage(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const message = await prisma.contactMessage.create({ data: parsed.data });
  res.status(201).json(message);
}

export async function listAdminMessages(req: Request, res: Response) {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  res.json(messages);
}

export async function updateAdminMessage(req: Request, res: Response) {
  const parsed = updateMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  try {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });
    res.json(message);
  } catch {
    res.status(404).json({ message: "Message not found" });
  }
}

export async function deleteAdminMessage(req: Request, res: Response) {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Message not found" });
  }
}
