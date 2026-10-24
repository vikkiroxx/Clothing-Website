import Link from "next/link";
import { getCategories } from "@/lib/categories";

const COPYRIGHT_YEAR = 2026;

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <p className="text-sm font-bold tracking-widest text-foreground uppercase">
            The Off<span className="text-accent">-</span>Grid
          </p>

          {categories.length > 0 && (
            <div>
              <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
                Shop
              </p>
              <ul className="mt-3 space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="text-sm text-foreground-muted hover:text-accent"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
              Support
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-foreground-muted hover:text-accent">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs text-foreground-muted">
          © {COPYRIGHT_YEAR} The Off-Grid.
        </p>
      </div>
    </footer>
  );
}

export function FooterFallback() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm font-bold tracking-widest text-foreground uppercase">
          The Off<span className="text-accent">-</span>Grid
        </p>
        <Link
          href="/contact"
          className="mt-4 block w-fit font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-accent"
        >
          Contact Us
        </Link>
        <p className="mt-10 font-mono text-xs text-foreground-muted">
          © {COPYRIGHT_YEAR} The Off-Grid.
        </p>
      </div>
    </footer>
  );
}
