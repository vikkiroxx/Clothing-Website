"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const RESEND_COOLDOWN_SECONDS = 30;

export default function SignupPage() {
  const { requestSignupOtp, verifySignupOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestSignupOtp(name, email, password);
      setStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifySignupOtp(email, code);
      router.push("/profile");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await requestSignupOtp(name, email, password);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (step === "otp") {
    return (
      <main className="mx-auto max-w-sm px-6 py-20">
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Account / Verify</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Enter the code</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          We sent a 6-digit code to <span className="text-foreground">{email}</span>.
        </p>

        <form onSubmit={handleOtpSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="code"
              className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
            >
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-center text-lg tracking-[0.3em] text-foreground outline-none focus:border-accent"
            />
          </div>

          {error && <p className="font-mono text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify & create account"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setCode("");
              setError(null);
            }}
            className="text-foreground-muted hover:underline"
          >
            Edit details
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <p className="font-mono text-xs tracking-widest text-accent uppercase">Account / Sign up</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Create account</h1>

      <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-5">
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
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="font-mono text-xs tracking-widest text-foreground-muted uppercase"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {error && <p className="font-mono text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[var(--radius-card)] border border-accent px-6 py-3 font-mono text-xs tracking-widest text-accent uppercase hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Sending code…" : "Send verification code"}
        </button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
