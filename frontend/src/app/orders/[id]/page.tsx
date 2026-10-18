"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ORDER_STEPS, STATUS_STYLES, isExceptionStatus, orderStepIndex } from "@/lib/order-helpers";
import { Order } from "@/types";

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    // Resetting to the loading state for a fresh fetch, not deriving from a prop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [user, id]);

  if (authLoading || !user || loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
          Loading…
        </p>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-mono text-sm text-foreground-muted">Order not found.</p>
        <Link
          href="/profile"
          className="mt-4 inline-block font-mono text-xs tracking-widest text-accent uppercase hover:underline"
        >
          Back to profile
        </Link>
      </main>
    );
  }

  const exception = isExceptionStatus(order.status);
  const stepIndex = orderStepIndex(order.status);

  return (
    <main className="mx-auto max-w-3xl space-y-12 px-6 py-10">
      <div>
        <Link
          href="/profile"
          className="font-mono text-xs tracking-widest text-accent uppercase hover:underline"
        >
          ← Back to profile
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
              Order #{order.id.slice(0, 8)}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Track Your Order
            </h1>
          </div>
          <span
            className={`inline-block rounded-[var(--radius-card)] border px-3 py-1 font-mono text-xs tracking-widest uppercase ${
              STATUS_STYLES[order.status] ?? "border-border text-foreground-muted"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <section>
        {exception ? (
          <div
            className={`rounded-[var(--radius-card)] border px-6 py-5 ${STATUS_STYLES[order.status]}`}
          >
            <p className="font-mono text-sm">
              {order.status === "CANCELLED"
                ? "This order was cancelled."
                : "This order was refunded."}
            </p>
          </div>
        ) : (
          <div className="flex items-center">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[10px] ${
                      i <= stepIndex
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-foreground-muted"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <p
                    className={`mt-2 font-mono text-[10px] tracking-widest uppercase ${
                      i <= stepIndex ? "text-foreground" : "text-foreground-muted"
                    }`}
                  >
                    {step}
                  </p>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`mx-2 h-px flex-1 ${i < stepIndex ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
          Courier &amp; Tracking
        </p>
        {order.trackingNumber ? (
          <div className="mt-3 rounded-[var(--radius-card)] border border-border px-5 py-4">
            <p className="text-sm text-foreground">
              {order.courier ?? "Courier"} · {order.trackingNumber}
            </p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-xs tracking-widest text-accent uppercase hover:underline"
              >
                Track package →
              </a>
            )}
          </div>
        ) : (
          <p className="mt-3 font-mono text-sm text-foreground-muted">
            {exception
              ? "No tracking information for this order."
              : "Tracking details will appear here once your order ships."}
          </p>
        )}
      </section>

      <section>
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">Items</p>
        <ul className="mt-3 space-y-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-[var(--radius-card)] border border-border p-4"
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-background-elevated">
                {item.variant.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.variant.product.images[0]}
                    alt={item.variant.product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.variant.product.name}</p>
                <p className="font-mono text-xs text-foreground-muted uppercase">
                  {item.variant.size} / {item.variant.color} × {item.quantity}
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">₹{item.price}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-mono text-sm">
          <span className="text-foreground-muted">Total</span>
          <span className="text-foreground">₹{order.totalAmount}</span>
        </div>
      </section>

      <section>
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
          Shipping Address
        </p>
        <div className="mt-3 rounded-[var(--radius-card)] border border-border px-5 py-4 text-sm text-foreground-muted">
          <p className="text-foreground">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          </p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </p>
          <p>{order.shippingAddress.phone}</p>
        </div>
      </section>
    </main>
  );
}
