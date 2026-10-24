"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Placeholder brand details — swap these for the real values.
const MANUFACTURER = "The Off-Grid Pvt. Ltd.";
const ADDRESS_LINES = ["123 Fashion Street, Bandra West", "Mumbai, Maharashtra 400050", "India"];
const INSTAGRAM_HANDLE = "@clothingstore";
const INSTAGRAM_URL = "https://instagram.com/clothingstore";
const CONTACT_EMAIL = "hello@clothingstore.com";

const EMPTY_FORM = { name: "", email: "", phone: "", comment: "" };

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const phone = user.addresses?.find((a) => a.isDefault)?.phone ?? user.addresses?.[0]?.phone;
    // Prefill from the logged-in profile, but never clobber anything already typed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || phone || f.phone,
      comment: f.comment,
    }));
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/contact", form);
      setSubmitted(true);
      setForm((f) => ({ ...f, comment: "" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-16 px-6 py-10">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Get in touch</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Contact Us
        </h1>
      </div>

      <section className="bg-grid-lines relative overflow-hidden rounded-[var(--radius-card)] border border-border px-8 py-10">
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
          Manufactured and Packed By
        </p>
        <p className="mt-1 text-xl font-semibold text-foreground">{MANUFACTURER}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
              Address
            </p>
            <address className="mt-1 text-sm not-italic text-foreground-muted">
              {ADDRESS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
                Instagram
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm text-accent hover:underline"
              >
                {INSTAGRAM_HANDLE}
              </a>
            </div>

            <div>
              <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
                Email
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 block text-sm text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Questions or feedback" title="Send Us a Message" />

        {submitted ? (
          <div className="rounded-[var(--radius-card)] border border-accent/40 bg-accent-soft px-6 py-5">
            <p className="font-mono text-sm text-accent">
              Thanks — your message has been received. We&rsquo;ll get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-3 font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
              >
                Comment
              </label>
              <textarea
                id="comment"
                required
                rows={5}
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                className="mt-2 w-full resize-none rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>

            {error && <p className="font-mono text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
