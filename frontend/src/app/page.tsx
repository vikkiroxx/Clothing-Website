import { Suspense } from "react";
import Link from "next/link";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-6 py-10">
      <section className="bg-grid-lines relative overflow-hidden rounded-[var(--radius-card)] border border-border px-8 py-20 text-center">
        <p className="font-mono text-xs tracking-widest text-accent uppercase">
          New season / Online now
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Apparel, engineered.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-foreground-muted">
          Minimal construction, maximum movement. Shop the latest drops across every category.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft"
        >
          Shop all products
        </Link>
      </section>

      <Suspense fallback={<p className="font-mono text-sm text-foreground-muted">Loading categories…</p>}>
        <CategoryGrid />
      </Suspense>

      <Suspense fallback={<p className="font-mono text-sm text-foreground-muted">Loading drops…</p>}>
        <ProductCarousel />
      </Suspense>

      <section>
        <SectionHeading eyebrow="Full catalog" title="Shop All" viewAllHref="/products" />
        <Suspense fallback={<p className="font-mono text-sm text-foreground-muted">Loading products…</p>}>
          <ProductGrid limit={8} />
        </Suspense>
      </section>
    </main>
  );
}
