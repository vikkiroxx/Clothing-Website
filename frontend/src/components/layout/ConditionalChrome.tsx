"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ConditionalChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

// The admin area renders its own shell (sidebar/header), so the storefront
// Header/Footer — rendered once in the root layout — are skipped there.
export function ConditionalChrome({ header, footer, children }: ConditionalChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <div className="flex-1">{children}</div>
      {footer}
    </>
  );
}
