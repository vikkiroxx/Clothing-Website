import { api } from "@/lib/api";
import { Audience, Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductGridProps {
  category?: string;
  audience?: Audience;
  limit?: number;
}

async function getProducts({ category, audience, limit }: ProductGridProps): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (audience) params.set("audience", audience);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();

  try {
    return await api.get<Product[]>(`/products${query ? `?${query}` : ""}`);
  } catch {
    return [];
  }
}

export async function ProductGrid({ category, audience, limit }: ProductGridProps) {
  const products = await getProducts({ category, audience, limit });

  if (products.length === 0) {
    return (
      <p className="font-mono text-sm text-foreground-muted">
        No products found{category ? " in this category" : ""}.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
