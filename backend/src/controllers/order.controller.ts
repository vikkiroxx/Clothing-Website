import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthRequest } from "@/middleware/auth";

export async function createOrder(req: AuthRequest, res: Response) {
  const { shippingAddress } = req.body;
  const userId = req.user!.id;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { variant: { include: { product: true } } },
  });

  if (cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      for (const item of cartItems) {
        if (item.variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for SKU ${item.variant.sku}`);
        }
        const unitPrice = Number(item.variant.product.price) + Number(item.variant.priceDelta);
        totalAmount += unitPrice * item.quantity;
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(item.variant.product.price) + Number(item.variant.priceDelta),
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cartItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(409).json({ message: (err as Error).message });
  }
}

export async function listOrders(req: AuthRequest, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: { include: { variant: { include: { product: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders);
}

export async function getOrder(req: AuthRequest, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
}
