import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("payment provider factory", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws clearly when PAYMENT_PROVIDER is unset", async () => {
    delete process.env.PAYMENT_PROVIDER;
    const { buildPaymentProvider } = await import("@/payments/factory");
    expect(() => buildPaymentProvider()).toThrow(/PAYMENT_PROVIDER is not set/);
  });

  it("throws clearly for an unsupported provider", async () => {
    process.env.PAYMENT_PROVIDER = "razorpay";
    const { buildPaymentProvider } = await import("@/payments/factory");
    expect(() => buildPaymentProvider()).toThrow(/Unsupported PAYMENT_PROVIDER "razorpay"/);
  });

  it("throws clearly when cashfree credentials are missing", async () => {
    process.env.PAYMENT_PROVIDER = "cashfree";
    delete process.env.CASHFREE_CLIENT_ID;
    delete process.env.CASHFREE_CLIENT_SECRET;
    const { buildPaymentProvider } = await import("@/payments/factory");
    expect(() => buildPaymentProvider()).toThrow(
      /CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET must both be set/,
    );
  });

  it("rejects an invalid CASHFREE_ENVIRONMENT value", async () => {
    process.env.PAYMENT_PROVIDER = "cashfree";
    process.env.CASHFREE_CLIENT_ID = "id";
    process.env.CASHFREE_CLIENT_SECRET = "secret";
    process.env.CASHFREE_ENVIRONMENT = "STAGING";
    const { buildPaymentProvider } = await import("@/payments/factory");
    expect(() => buildPaymentProvider()).toThrow(/CASHFREE_ENVIRONMENT must be/);
  });

  it("resolves a CashfreeProvider when fully configured", async () => {
    process.env.PAYMENT_PROVIDER = "cashfree";
    process.env.CASHFREE_CLIENT_ID = "test-id";
    process.env.CASHFREE_CLIENT_SECRET = "test-secret";
    const { buildPaymentProvider } = await import("@/payments/factory");
    const provider = buildPaymentProvider();
    expect(provider.id).toBe("CASHFREE");
  });

  it("getPaymentProvider memoizes across calls", async () => {
    process.env.PAYMENT_PROVIDER = "cashfree";
    process.env.CASHFREE_CLIENT_ID = "test-id";
    process.env.CASHFREE_CLIENT_SECRET = "test-secret";
    const { getPaymentProvider } = await import("@/payments/factory");
    expect(getPaymentProvider()).toBe(getPaymentProvider());
  });
});
