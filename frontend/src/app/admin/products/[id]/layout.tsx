import type { ReactNode } from "react";

// Client-rendered dynamic segment (fetches the product by id, no static
// params) — can't produce a static shell, so opt out like /orders/[id].
export const instant = false;

export default function AdminProductLayout({ children }: { children: ReactNode }) {
  return children;
}
