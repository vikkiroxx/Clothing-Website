"use client";

import { useEffect, useRef } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

export function CarouselTrack({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Looping needs more than one item, and relies on 3 identical copies laid
  // out back-to-back so there's always content to scroll into either side.
  const loop = products.length > 1;
  const items = loop ? [...products, ...products, ...products] : products;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;

    const copyWidth = track.scrollWidth / 3;
    track.scrollLeft = copyWidth;

    function handleScroll() {
      if (!track) return;
      // Once scrolled deep enough into a cloned copy, snap back to the
      // equivalent spot in the middle copy — instant, so it's invisible.
      if (track.scrollLeft < copyWidth * 0.5) {
        track.scrollLeft += copyWidth;
      } else if (track.scrollLeft > copyWidth * 1.5) {
        track.scrollLeft -= copyWidth;
      }
    }

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [loop, products.length]);

  function scroll(direction: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const step = track.clientWidth * 0.8;
    track.scrollBy({ left: direction === "next" ? step : -step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto"
      >
        {items.map((product, i) => (
          <div key={`${product.id}-${i}`} className="w-40 shrink-0 snap-start sm:w-52">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous products"
        onClick={() => scroll("prev")}
        className="absolute top-1/2 left-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background-elevated/90 text-foreground-muted backdrop-blur hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="M10 2.5 4.5 8l5.5 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next products"
        onClick={() => scroll("next")}
        className="absolute top-1/2 right-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background-elevated/90 text-foreground-muted backdrop-blur hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
          <path
            d="m6 2.5 5.5 5.5L6 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
