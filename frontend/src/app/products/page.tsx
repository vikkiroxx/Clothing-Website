import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Audience } from "@/types";
import { getCategories } from "@/lib/categories";
import { ProductGrid } from "@/components/product/ProductGrid";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse the full catalog — t-shirts, hoodies, cargo pants, jackets, and more.",
};

// Category/audience filter bar depends on searchParams, which is per-request — not worth prerendering.
export const instant = false;

const AUDIENCE_OPTIONS: { key: Audience; label: string }[] = [
  { key: "MEN", label: "Men's Wear" },
  { key: "WOMEN", label: "Women's Wear" },
  { key: "KIDS", label: "Kids' Wear" },
];

function buildHref(audience?: Audience, category?: string): string {
  const params = new URLSearchParams();
  if (audience) params.set("audience", audience);
  if (category) params.set("category", category);
  const query = params.toString();
  return `/products${query ? `?${query}` : ""}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; audience?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const audience = AUDIENCE_OPTIONS.some((a) => a.key === params.audience)
    ? (params.audience as Audience)
    : undefined;

  const categories = await getCategories(audience);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Full catalog</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">All Products</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(undefined, category)}
          className={`rounded-[var(--radius-card)] border px-4 py-2 font-mono text-xs tracking-widest uppercase ${
            !audience
              ? "border-accent text-accent"
              : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          All
        </Link>
        {AUDIENCE_OPTIONS.map((a) => (
          <Link
            key={a.key}
            href={buildHref(a.key, category)}
            className={`rounded-[var(--radius-card)] border px-4 py-2 font-mono text-xs tracking-widest uppercase ${
              audience === a.key
                ? "border-accent text-accent"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(audience, undefined)}
          className={`rounded-[var(--radius-card)] border px-4 py-2 font-mono text-xs tracking-widest uppercase ${
            !category
              ? "border-accent text-accent"
              : "border-border text-foreground-muted hover:text-foreground"
          }`}
        >
          All Categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(audience, c.slug)}
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
        <ProductGrid audience={audience} category={category} />
      </Suspense>
    </main>
  );
}
