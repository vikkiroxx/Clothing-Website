"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactMessage, Order, Product } from "@/types";

const LOW_STOCK_THRESHOLD = 5;
const REVENUE_STATUSES = new Set(["PAID", "SHIPPED", "DELIVERED"]);

interface Summary {
  totalOrders: number;
  paidRevenue: number;
  productCount: number;
  lowStockCount: number;
  unreadMessages: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Order[]>("/admin/orders"),
      api.get<Product[]>("/admin/products"),
      api.get<ContactMessage[]>("/admin/messages"),
    ])
      .then(([orders, products, messages]) => {
        const paidRevenue = orders
          .filter((o) => REVENUE_STATUSES.has(o.status))
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);

        const lowStockCount = products.filter((p) => {
          const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
        }).length;

        setSummary({
          totalOrders: orders.length,
          paidRevenue,
          productCount: products.length,
          lowStockCount,
          unreadMessages: messages.filter((m) => !m.isRead).length,
        });
      })
      .catch(() => setSummary(null));
  }, []);

  const cards = [
    { label: "Total Orders", value: summary?.totalOrders, href: "/admin/orders" },
    {
      label: "Paid Revenue",
      value: summary ? `₹${summary.paidRevenue.toFixed(2)}` : undefined,
      href: "/admin/orders",
    },
    { label: "Products", value: summary?.productCount, href: "/admin/products" },
    { label: "Low Stock", value: summary?.lowStockCount, href: "/admin/products" },
    { label: "Unread Messages", value: summary?.unreadMessages, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm text-foreground-muted">
          {user ? `Welcome back, ${user.name}.` : ""} Products, categories, orders, and messages
          are all live.
        </p>
      </div>

      <section>
        <SectionHeading eyebrow="Overview" title="Store Summary" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="card-hover-glow rounded-[var(--radius-card)] border border-border px-4 py-5"
            >
              <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{card.value ?? "—"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
