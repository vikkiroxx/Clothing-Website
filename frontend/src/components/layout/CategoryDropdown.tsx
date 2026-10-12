"use client";

import { useState } from "react";
import Link from "next/link";
import { Category } from "@/types";

export function CategoryDropdown({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
      >
        Categories
      </button>

      {open && (
        <div className="absolute top-full left-0 z-10 mt-2 min-w-40 rounded-[var(--radius-card)] border border-border bg-background-elevated p-2 shadow-[0_0_24px_rgba(0,0,0,0.5)]">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="block rounded-[var(--radius-card)] px-3 py-2 text-sm text-foreground hover:bg-accent-soft hover:text-accent"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
