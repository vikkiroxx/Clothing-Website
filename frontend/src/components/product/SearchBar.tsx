"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  extraParams?: Record<string, string | undefined>;
  onSubmitted?: () => void;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search products…",
  autoFocus,
  className = "",
  extraParams,
  onSubmitted,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(extraParams ?? {})) {
      if (val) params.set(key, val);
    }
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);

    const query = params.toString();
    router.push(`/products${query ? `?${query}` : ""}`);
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search products"
        className="w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
      />
    </form>
  );
}
