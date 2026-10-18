"use client";

import { useState } from "react";
import { SearchBar } from "@/components/product/SearchBar";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="m14 14-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

export function HeaderSearch() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products"
        className="text-foreground-muted hover:text-foreground"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SearchBar autoFocus className="w-36 sm:w-52" onSubmitted={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className="font-mono text-xs text-foreground-muted uppercase hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}
