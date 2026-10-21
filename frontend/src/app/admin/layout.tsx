import type { ReactNode } from "react";
import { AdminAccessGate } from "@/components/admin/AdminAccessGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAccessGate>
      <div className="flex min-h-screen flex-col sm:flex-row">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AdminAccessGate>
  );
}
