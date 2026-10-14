import { Request, Response } from "express";
import { Audience } from "@prisma/client";
import { prisma } from "@/config/prisma";

const AUDIENCES = new Set(Object.values(Audience));

export async function listCategories(req: Request, res: Response) {
  const { audience } = req.query as Record<string, string | undefined>;
  const audienceFilter = audience && AUDIENCES.has(audience as Audience) ? (audience as Audience) : undefined;

  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { isActive: true, ...(audienceFilter ? { audience: audienceFilter } : {}) },
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
