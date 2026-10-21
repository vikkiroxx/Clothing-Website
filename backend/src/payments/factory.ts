import { PaymentProvider } from "@/payments/provider.interface";
import { CashfreeProvider } from "@/payments/providers/cashfree/cashfree.provider";

export const SUPPORTED_PROVIDERS = ["cashfree"] as const;
export type SupportedProviderKey = (typeof SUPPORTED_PROVIDERS)[number];

// Fails loudly and synchronously (at import/startup time, not on the first
// request) if PAYMENT_PROVIDER is unset, unsupported, or missing credentials.
// Call this once at server boot — see server.ts.
export function buildPaymentProvider(): PaymentProvider {
  const key = (process.env.PAYMENT_PROVIDER ?? "").toLowerCase();

  if (!key) {
    throw new Error(
      `PAYMENT_PROVIDER is not set. Supported values: ${SUPPORTED_PROVIDERS.join(", ")}`,
    );
  }

  if (!(SUPPORTED_PROVIDERS as readonly string[]).includes(key)) {
    throw new Error(
      `Unsupported PAYMENT_PROVIDER "${key}". Supported values: ${SUPPORTED_PROVIDERS.join(", ")}`,
    );
  }

  switch (key as SupportedProviderKey) {
    case "cashfree":
      return buildCashfreeProvider();
  }
}

function buildCashfreeProvider(): CashfreeProvider {
  const environment = (process.env.CASHFREE_ENVIRONMENT ?? "SANDBOX").toUpperCase();
  if (environment !== "SANDBOX" && environment !== "PRODUCTION") {
    throw new Error('CASHFREE_ENVIRONMENT must be "SANDBOX" or "PRODUCTION"');
  }

  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET must both be set when PAYMENT_PROVIDER=cashfree",
    );
  }

  return new CashfreeProvider({
    environment,
    clientId,
    clientSecret,
    apiVersion: process.env.CASHFREE_API_VERSION ?? "2026-01-01",
  });
}

let cached: PaymentProvider | null = null;

// Lazily resolved + memoized so importing this module never triggers
// validation as a side effect — only calling getPaymentProvider() does.
export function getPaymentProvider(): PaymentProvider {
  if (!cached) {
    cached = buildPaymentProvider();
  }
  return cached;
}
