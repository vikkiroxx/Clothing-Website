import { buildPaymentProvider } from "@/payments/factory";

// Called once at server boot (see server.ts). Fails fast and loudly rather
// than letting a misconfigured payment setup surface as a confusing 500 on
// the first checkout attempt.
export function validateEnv() {
  buildPaymentProvider();

  if (
    process.env.CASHFREE_ENVIRONMENT?.toUpperCase() === "PRODUCTION" &&
    !process.env.BACKEND_PUBLIC_URL?.startsWith("https://")
  ) {
    throw new Error(
      "BACKEND_PUBLIC_URL must be an https:// URL when CASHFREE_ENVIRONMENT=PRODUCTION " +
        "(Cashfree requires notify_url to be HTTPS in production).",
    );
  }
}
