"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  function load() {
    api
      .get<Product[]>("/admin/products")
      .then(setProducts)
      .catch((err) => setError((err as Error).message));
  }

  useEffect(load, []);

  async function toggleActive(product: Product) {
    if (product.isActive && !window.confirm(`Remove "${product.name}" from the storefront?`)) {
      return;
    }
    setPendingId(product.id);
    try {
      await api.patch(`/products/${product.id}`, { isActive: !product.isActive });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  const filtered = products?.filter((p) =>
    `${p.name} ${p.category.name} ${p.audience}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Products
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-[var(--radius-card)] border border-accent px-4 py-2 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft"
        >
          + New product
        </Link>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by name, category, or audience…"
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {!products ? (
        <p className="font-mono text-sm text-foreground-muted">Loading…</p>
      ) : filtered!.length === 0 ? (
        <p className="font-mono text-sm text-foreground-muted">No products found.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] tracking-widest text-foreground-muted uppercase">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered!.map((product) => {
                const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={product.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
                          {product.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{product.category.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground-muted uppercase">
                      {product.audience}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground-muted">₹{product.price}</td>
                    <td className="px-4 py-3 font-mono text-foreground-muted">{stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-[var(--radius-card)] border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ${
                          product.isActive
                            ? "border-accent/40 bg-accent-soft text-accent"
                            : "border-danger/40 bg-danger/10 text-danger"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleActive(product)}
                          disabled={pendingId === product.id}
                          className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase hover:text-foreground disabled:opacity-50"
                        >
                          {product.isActive ? "Delete" : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
