import Link from "next/link";
import { getCategories } from "@/lib/categories";
import { CategoryDropdown } from "@/components/layout/CategoryDropdown";

export async function Header() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-widest text-foreground uppercase">
          Clothing<span className="text-accent">{"//"}</span>Store
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
          >
            All Products
          </Link>
          {categories.length > 0 && <CategoryDropdown categories={categories} />}
        </nav>
      </div>
    </header>
  );
}

export function HeaderFallback() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-widest text-foreground uppercase">
          Clothing<span className="text-accent">{"//"}</span>Store
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
          >
            All Products
          </Link>
        </nav>
      </div>
    </header>
  );
}
