export const ORDER_STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"] as const;

export const ALL_STATUSES = [...ORDER_STEPS, "CANCELLED", "REFUNDED"] as const;

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-accent-2/40 text-accent-2 bg-accent-2/10",
  PAID: "border-accent/40 text-accent bg-accent-soft",
  SHIPPED: "border-accent/40 text-accent bg-accent-soft",
  DELIVERED: "border-accent/40 text-accent bg-accent-soft",
  CANCELLED: "border-danger/40 text-danger bg-danger/10",
  REFUNDED: "border-danger/40 text-danger bg-danger/10",
};

export function isExceptionStatus(status: string): boolean {
  return status === "CANCELLED" || status === "REFUNDED";
}

export function orderStepIndex(status: string): number {
  return ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
}
