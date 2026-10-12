import Link from "next/link";
import { getCategories } from "@/lib/categories";
import { SectionHeading } from "@/components/ui/SectionHeading";

export async function CategoryGrid() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section>
      <SectionHeading eyebrow="Browse" title="Shop by Category" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group corner-brackets card-hover-glow relative block aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated"
          >
            {category.image && (
              <img
                src={category.image}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-background via-background/40 to-transparent p-4">
              <p className="text-sm font-semibold tracking-wide text-foreground uppercase">
                {category.name}
              </p>
              <span className="font-mono text-xs tracking-widest text-accent uppercase">
                Shop now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
