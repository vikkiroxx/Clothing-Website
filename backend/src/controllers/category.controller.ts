import { Request, Response } from "express";
import { prisma } from "@/config/prisma";

export async function listCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany();
  res.json(categories);
}

export async function createCategory(req: Request, res: Response) {
  const { name, slug } = req.body;
  const category = await prisma.category.create({ data: { name, slug } });
  res.status(201).json(category);
}
