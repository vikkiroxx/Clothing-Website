import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middleware/auth";

export async function getCart(req: AuthRequest, res: Response) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.id },
    include: { variant: { include: { product: true } } },
  });

  res.json(items);
}

export async function addToCart(req: AuthRequest, res: Response) {
  const { variantId, quantity = 1 } = req.body;

  const item = await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: req.user!.id, variantId } },
    update: { quantity: { increment: quantity } },
    create: { userId: req.user!.id, variantId, quantity },
  });

  res.status(201).json(item);
}

export async function updateCartItem(req: AuthRequest, res: Response) {
  const { quantity } = req.body;

  const item = await prisma.cartItem.update({
    where: { id: req.params.id as string },
    data: { quantity },
  });

  res.json(item);
}

export async function removeFromCart(req: AuthRequest, res: Response) {
  await prisma.cartItem.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
}
