"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin / Products</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          New Product
        </h1>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
