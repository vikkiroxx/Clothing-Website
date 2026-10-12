import { Request, Response } from "express";
import { prisma } from "@/config/prisma";

export async function listCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { images: true },
      },
    },
  });

  res.json(
    categories.map(({ products, ...category }) => ({
      ...category,
      image: products[0]?.images[0] ?? null,
    })),
  );
}

export async function createCategory(req: Request, res: Response) {
  const { name, slug } = req.body;
  const category = await prisma.category.create({ data: { name, slug } });
  res.status(201).json(category);
}
