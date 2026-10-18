import type { ReactNode } from "react";

// This route is fully client-rendered (auth-gated, fetched by order id at
// request time), so it can't produce a static shell — opt out of prerendering.
export const instant = false;

export default function OrderLayout({ children }: { children: ReactNode }) {
  return children;
}
