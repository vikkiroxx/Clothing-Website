import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kids' Wear — Coming Soon",
  description: "The kids' line is in the works. Check back soon.",
};

function KidMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-6 w-6 text-amber-200" fill="none">
      <circle cx="8" cy="4" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 6.3v3M5.5 7.8h5M8 9.3 6 12.5M8 9.3l2 3.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KidsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="bg-grid-lines corner-brackets relative overflow-hidden rounded-[var(--radius-card)] border border-border px-8 py-28 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-amber-200/40">
          <KidMark />
        </div>
        <p className="mt-5 font-mono text-xs tracking-widest text-amber-200 uppercase">
          Kids&rsquo; Wear / Coming Soon
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Small sizes, same engineering.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-foreground-muted">
          We&rsquo;re cutting the kids&rsquo; line down to size — t-shirts, hoodies, cargo
          pants, and more. Still in the lab. Check back soon.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/men"
            className="rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft"
          >
            Shop Men
          </Link>
          <Link
            href="/women"
            className="rounded-[var(--radius-card)] border border-accent-2 px-6 py-3 font-mono text-xs tracking-widest text-accent-2 uppercase hover:bg-accent-2/10"
          >
            Shop Women
          </Link>
        </div>
      </section>
    </main>
  );
}
