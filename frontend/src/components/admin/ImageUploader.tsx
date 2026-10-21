"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await api.post<{ url: string }>("/uploads", formData);
      onChange([...images, result.url]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput("");
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
        Images
      </label>

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded-[var(--radius-card)] border border-accent/40 bg-accent-soft px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-accent uppercase">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label="Remove image"
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background/90 font-mono text-xs text-foreground-muted hover:border-danger hover:text-danger"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="image-upload-input"
        />
        <label
          htmlFor="image-upload-input"
          className={`cursor-pointer rounded-[var(--radius-card)] border border-border px-4 py-2 font-mono text-xs tracking-widest text-foreground-muted uppercase hover:border-accent hover:text-accent ${
            uploading ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {uploading ? "Uploading…" : "Upload image"}
        </label>

        <span className="font-mono text-[10px] tracking-widest text-foreground-muted uppercase">
          or
        </span>

        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste an image URL"
          className="min-w-0 flex-1 rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="rounded-[var(--radius-card)] border border-border px-4 py-2 font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-2 font-mono text-xs text-danger">{error}</p>}
    </div>
  );
}
