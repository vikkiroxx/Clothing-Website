"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AccountLink() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Link
      href={user ? "/profile" : "/login"}
      className="font-mono text-xs tracking-widest text-foreground-muted uppercase hover:text-foreground"
    >
      {user ? user.name.split(" ")[0] : "Login"}
    </Link>
  );
}
