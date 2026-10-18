"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/types";

export function AddToCart({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const variants = product.variants;
  const [selectedId, setSelectedId] = useState<string | null>(
    variants.find((v) => v.stock > 0)?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  async function handleAdd() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!selected) return;

    setAdding(true);
    setError(null);
    setAdded(false);
    try {
      await addToCart(selected.id, quantity);
      setAdded(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  if (variants.length === 0) {
    return (
      <p className="mt-8 border-t border-border pt-6 font-mono text-xs tracking-widest text-foreground-muted uppercase">
        No options available
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
        Select an option
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            disabled={variant.stock === 0}
            onClick={() => {
              setSelectedId(variant.id);
              setQuantity(1);
              setAdded(false);
            }}
            className={`rounded-[var(--radius-card)] border px-3 py-2 font-mono text-xs uppercase ${
              variant.id === selectedId
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-foreground-muted hover:text-foreground"
            } ${variant.stock === 0 ? "cursor-not-allowed opacity-40" : ""}`}
          >
            {variant.size} / {variant.color}
            {variant.stock === 0 && " · Sold out"}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center rounded-[var(--radius-card)] border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 font-mono text-foreground-muted hover:text-foreground"
          >
            −
          </button>
          <span className="w-8 text-center font-mono text-sm text-foreground">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 1, q + 1))}
            className="px-3 py-2 font-mono text-foreground-muted hover:text-foreground"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected || selected.stock === 0 || adding}
          className="flex-1 rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "Adding…" : added ? "Added to cart ✓" : user ? "Add to cart" : "Log in to add"}
        </button>
      </div>

      {error && <p className="mt-3 font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}
