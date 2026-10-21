"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AdminLink() {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="font-mono text-xs tracking-widest text-accent uppercase hover:underline"
    >
      Admin
    </Link>
  );
}
