import { Product } from "@/types";

const NEW_WINDOW_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export type ProductBadge = "NEW" | "LOW STOCK" | "SOLD OUT" | null;

export function getProductBadge(product: Product): ProductBadge {
  const totalStock = getTotalStock(product);

  if (totalStock === 0) return "SOLD OUT";
  if (totalStock <= LOW_STOCK_THRESHOLD) return "LOW STOCK";

  const ageMs = Date.now() - new Date(product.createdAt).getTime();
  if (ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000) return "NEW";

  return null;
}
