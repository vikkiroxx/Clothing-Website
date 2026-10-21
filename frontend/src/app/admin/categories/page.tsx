"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/lib/api";
import { Category } from "@/types";

interface CategoryFormState {
  name: string;
  slug: string;
}

const EMPTY_FORM: CategoryFormState = { name: "", slug: "" };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [createSlugTouched, setCreateSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function load() {
    api
      .get<Category[]>("/categories")
      .then(setCategories)
      .catch((err) => setError((err as Error).message));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/categories", createForm);
      setCreateForm(EMPTY_FORM);
      setCreateSlugTouched(false);
      setCreating(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditForm({ name: category.name, slug: category.slug });
  }

  async function handleSaveEdit(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await api.patch(`/categories/${id}`, editForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setPendingId(category.id);
    setError(null);
    try {
      await api.delete(`/categories/${category.id}`);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Categories
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-[var(--radius-card)] border border-accent px-4 py-2 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft"
        >
          {creating ? "Cancel" : "+ New category"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-border p-4"
        >
          <div>
            <label className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
              Name
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setCreateForm((f) => ({
                  name,
                  slug: createSlugTouched ? f.slug : slugify(name),
                }));
              }}
              className="mt-2 rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
              Slug
            </label>
            <input
              type="text"
              required
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              title="Lowercase letters, numbers, and hyphens only"
              value={createForm.slug}
              onChange={(e) => {
                setCreateSlugTouched(true);
                setCreateForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className="mt-2 rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-card)] border border-accent px-4 py-2 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </form>
      )}

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {!categories ? (
        <p className="font-mono text-sm text-foreground-muted">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="font-mono text-sm text-foreground-muted">No categories yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] tracking-widest text-foreground-muted uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                return (
                  <tr key={category.id} className="border-b border-border last:border-b-0">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, name: e.target.value }))
                            }
                            className="w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                            value={editForm.slug}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, slug: e.target.value }))
                            }
                            className="w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground-muted">
                          {category.productCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(category.id)}
                              disabled={pendingId === category.id}
                              className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-foreground">{category.name}</td>
                        <td className="px-4 py-3 font-mono text-foreground-muted">
                          {category.slug}
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground-muted">
                          {category.productCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              disabled={pendingId === category.id}
                              className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase hover:text-danger disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
