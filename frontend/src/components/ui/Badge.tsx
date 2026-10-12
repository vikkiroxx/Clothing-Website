import { ProductBadge } from "@/lib/product-helpers";

const STYLES: Record<NonNullable<ProductBadge>, string> = {
  NEW: "border-accent/40 text-accent bg-accent-soft",
  "LOW STOCK": "border-accent-2/40 text-accent-2 bg-accent-2/10",
  "SOLD OUT": "border-danger/40 text-danger bg-danger/10",
};

export function Badge({ label }: { label: NonNullable<ProductBadge> }) {
  return (
    <span
      className={`inline-block rounded-[var(--radius-card)] border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ${STYLES[label]}`}
    >
      {label}
    </span>
  );
}
