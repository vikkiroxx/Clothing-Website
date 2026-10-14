import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { Product } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getProducts(): Promise<Product[]> {
  try {
    return await api.get<Product[]>("/products");
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: new Date(),
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/men`, lastModified: new Date() },
    { url: `${siteUrl}/women`, lastModified: new Date() },
    { url: `${siteUrl}/kids`, lastModified: new Date() },
    { url: `${siteUrl}/products`, lastModified: new Date() },
  ];

  return [...staticEntries, ...productEntries];
}
