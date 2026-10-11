import { Request, Response } from "express";
import { prisma } from "@/config/prisma";

export async function listProducts(req: Request, res: Response) {
  const { category, page = "1", limit = "20" } = req.query as Record<string, string | undefined>;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: { category: true, variants: true },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });

  res.json(products);
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug as string },
    include: { category: true, variants: true },
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
}

export async function createProduct(req: Request, res: Response) {
  const { name, slug, description, price, images, categoryId, attributes, variants } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      images,
      categoryId,
      attributes,
      variants: {
        create: variants ?? [],
      },
    },
    include: { variants: true },
  });

  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const product = await prisma.product.update({
    where: { id: req.params.id as string },
    data: req.body,
  });

  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  await prisma.product.update({
    where: { id: req.params.id as string },
    data: { isActive: false },
  });

  res.status(204).send();
}
