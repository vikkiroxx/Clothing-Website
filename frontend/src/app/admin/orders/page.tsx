"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { STATUS_STYLES } from "@/lib/order-helpers";
import { Order } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<Order[]>("/admin/orders")
      .then(setOrders)
      .catch((err) => setError((err as Error).message));
  }, []);

  const filtered = orders?.filter((o) =>
    `${o.id} ${o.user?.name ?? ""} ${o.user?.email ?? ""} ${o.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Orders
        </h1>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by order id, customer, or status…"
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      {!orders ? (
        <p className="font-mono text-sm text-foreground-muted">Loading…</p>
      ) : filtered!.length === 0 ? (
        <p className="font-mono text-sm text-foreground-muted">No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] tracking-widest text-foreground-muted uppercase">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered!.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{order.user?.name ?? "—"}</p>
                    <p className="font-mono text-[10px] text-foreground-muted">
                      {order.user?.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground-muted">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground-muted">
                    ₹{order.totalAmount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-[var(--radius-card)] border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ${
                        STATUS_STYLES[order.status] ?? "border-border text-foreground-muted"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-[10px] tracking-widest text-accent uppercase hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
