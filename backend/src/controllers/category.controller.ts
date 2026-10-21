import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { audienceWhere, parseAudience } from "@/lib/audience";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens only"),
});

const updateCategorySchema = categorySchema.partial();

export async function listCategories(req: Request, res: Response) {
  const { audience } = req.query as Record<string, string | undefined>;
  const audienceFilter = parseAudience(audience);

  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { isActive: true, ...audienceWhere(audienceFilter) },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { images: true },
      },
      _count: { select: { products: true } },
    },
  });

  res.json(
    categories.map(({ products, _count, ...category }) => ({
      ...category,
      image: products[0]?.images[0] ?? null,
      productCount: _count.products,
    })),
  );
}

export async function createCategory(req: Request, res: Response) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ message: "A category with that name or slug already exists" });
    }
    throw err;
  }
}

export async function updateCategory(req: Request, res: Response) {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  try {
    const category = await prisma.category.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });
    res.json(category);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res
          .status(409)
          .json({ message: "A category with that name or slug already exists" });
      }
      if (err.code === "P2025") {
        return res.status(404).json({ message: "Category not found" });
      }
    }
    throw err;
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    await prisma.category.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ message: "Category not found" });
    }

    // Postgres surfaces the RESTRICT foreign-key violation as a raw "unknown"
    // query error (no structured Prisma code) — match on the constraint name.
    const isRestricted = err instanceof Error && err.message.includes("Product_categoryId_fkey");
    if (isRestricted) {
      return res.status(409).json({
        message:
          "Can't delete a category that still has products assigned to it — reassign or remove those products first.",
      });
    }

    throw err;
  }
}
