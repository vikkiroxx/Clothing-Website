"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function GateMessage({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">{text}</p>
    </main>
  );
}

// Client-side route guard for the admin shell. This is a UX convenience only —
// every admin API route independently enforces requireAuth/requireAdmin on the
// backend, which is the real security boundary.
export function AdminAccessGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/profile");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <GateMessage text="Checking access…" />;
  }

  // Not authenticated, or authenticated but not an admin: a redirect is in
  // flight above — render nothing so protected content never flashes.
  if (!user || user.role !== "ADMIN") {
    return <GateMessage text="Redirecting…" />;
  }

  return <>{children}</>;
}
