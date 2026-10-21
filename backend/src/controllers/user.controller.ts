import { Response } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middleware/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().min(1).optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  phone: z.string().min(1),
  isDefault: z.boolean().optional(),
});

const SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  addresses: true,
} as const;

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: SELECT,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
}

export async function updateMe(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  if (parsed.data.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: SELECT,
  });

  res.json(user);
}

export async function addAddress(req: AuthRequest, res: Response) {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const userId = req.user!.id;
  const existingCount = await prisma.address.count({ where: { userId } });
  const isDefault = parsed.data.isDefault ?? existingCount === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { ...parsed.data, isDefault, userId } });
  });

  res.status(201).json(address);
}

export async function deleteAddress(req: AuthRequest, res: Response) {
  const address = await prisma.address.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });

  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  await prisma.address.delete({ where: { id: address.id } });
  res.status(204).send();
}
