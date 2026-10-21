"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Audience, Category, Product } from "@/types";

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  priceDelta: string;
}

const AUDIENCE_OPTIONS: Audience[] = ["MEN", "WOMEN", "KIDS", "UNISEX"];

const EMPTY_VARIANT: VariantRow = { size: "", color: "", sku: "", stock: "0", priceDelta: "0" };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function variantRowsFrom(product: Product): VariantRow[] {
  return product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: String(v.stock),
    priceDelta: v.priceDelta,
  }));
}

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[] | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [audience, setAudience] = useState<Audience>(product?.audience ?? "MEN");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [variants, setVariants] = useState<VariantRow[]>(
    product ? variantRowsFrom(product) : [{ ...EMPTY_VARIANT }],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((cats) => {
        setCategories(cats);
        setCategoryId((current) => current || cats[0]?.id || "");
      })
      .catch(() => setCategories([]));
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addVariant() {
    setVariants((rows) => [...rows, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      slug,
      description,
      price: Number(price),
      audience,
      categoryId,
      images,
      variants: variants
        .filter((v) => v.size && v.color && v.sku)
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: Number(v.stock) || 0,
          priceDelta: Number(v.priceDelta) || 0,
        })),
    };

    try {
      if (mode === "create") {
        await api.post("/products", payload);
      } else {
        await api.patch(`/products/${product!.id}`, { ...payload, isActive });
      }
      router.push("/admin/products");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Slug
          </label>
          <input
            id="slug"
            type="text"
            required
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            title="Lowercase letters, numbers, and hyphens only"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
        >
          Description
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full resize-none rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label
            htmlFor="price"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Price (₹)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="audience"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Audience
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="category"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Category
          </label>
          <select
            id="category"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!categories}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-50"
          >
            {!categories && <option>Loading…</option>}
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "edit" && (
        <label className="flex items-center gap-2 font-mono text-xs tracking-widest text-foreground-muted uppercase">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-accent"
          />
          Active (visible in the storefront)
        </label>
      )}

      <ImageUploader images={images} onChange={setImages} />

      <div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
            Variants
          </p>
          <button
            type="button"
            onClick={addVariant}
            className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline"
          >
            + Add variant
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {variants.map((variant, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 rounded-[var(--radius-card)] border border-border p-3 sm:grid-cols-6"
            >
              <input
                type="text"
                placeholder="Size"
                required
                value={variant.size}
                onChange={(e) => updateVariant(i, "size", e.target.value)}
                className="rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Color"
                required
                value={variant.color}
                onChange={(e) => updateVariant(i, "color", e.target.value)}
                className="rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="SKU"
                required
                value={variant.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                className="rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                required
                value={variant.stock}
                onChange={(e) => updateVariant(i, "stock", e.target.value)}
                className="rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price delta"
                value={variant.priceDelta}
                onChange={(e) => updateVariant(i, "priceDelta", e.target.value)}
                className="rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={variants.length === 1}
                className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {mode === "edit" && (
          <p className="mt-2 font-mono text-[10px] text-foreground-muted">
            Removing a variant that already has order history will be rejected — set its stock to
            0 instead.
          </p>
        )}
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-[var(--radius-card)] border border-border px-6 py-3 font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
