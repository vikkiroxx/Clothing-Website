"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
    >
      Cart
      {count > 0 && (
        <span className="absolute -top-2.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-black">
          {count}
        </span>
      )}
    </Link>
  );
}
