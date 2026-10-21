"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get<Product>(`/admin/products/${id}`)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="space-y-4">
        <p className="font-mono text-sm text-foreground-muted">Product not found.</p>
        <Link
          href="/admin/products"
          className="font-mono text-xs tracking-widest text-accent uppercase hover:underline"
        >
          Back to products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
        Loading…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin / Products</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Edit {product.name}
        </h1>
      </div>
      <ProductForm mode="edit" product={product} />
    </div>
  );
}
