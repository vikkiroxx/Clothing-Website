import { api } from "@/lib/api";
import { Product } from "@/types";
import Link from "next/link";

async function getProducts(): Promise<Product[]> {
  try {
    return await api.get<Product[]>("/products");
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-black">
      <h1 className="mb-8 text-2xl font-semibold text-black dark:text-white">
        New Arrivals
      </h1>

      {products.length === 0 ? (
        <p className="text-zinc-500">
          No products yet. Add one via the backend API, or check the backend is running.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group block"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-black dark:text-white">
                {product.name}
              </p>
              <p className="text-sm text-zinc-500">₹{product.price}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
