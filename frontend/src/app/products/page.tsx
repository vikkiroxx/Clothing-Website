import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/categories";
import { ProductGrid } from "@/components/product/ProductGrid";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse the full catalog — t-shirts, hoodies, cargo pants, jackets, and more.",
};

// Category filter bar depends on searchParams, which is per-request — not worth prerendering.
export const instant = false;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Full catalog</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">All Products</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-[var(--radius-card)] border px-4 py-2 font-mono text-xs tracking-widest uppercase ${
            !category
              ? "border-accent text-accent"
              : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`rounded-[var(--radius-card)] border px-4 py-2 font-mono text-xs tracking-widest uppercase ${
              category === c.slug
                ? "border-accent text-accent"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <Suspense fallback={<p className="font-mono text-sm text-foreground-muted">Loading products…</p>}>
        <ProductGrid category={category} />
      </Suspense>
    </main>
  );
}
