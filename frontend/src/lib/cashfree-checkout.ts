// The only file in the frontend allowed to import the Cashfree SDK. Nothing
// else should reference "@cashfreepayments/cashfree-js" directly — if the
// provider changes, only this file (and its backend counterpart) need to.
import { load } from "@cashfreepayments/cashfree-js";

let cashfreePromise: ReturnType<typeof load> | null = null;

function getCashfree() {
  if (!cashfreePromise) {
    const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox";
    cashfreePromise = load({ mode });
  }
  return cashfreePromise;
}

// Redirects the browser to the provider's hosted checkout. Resolves only if
// the SDK itself fails to launch — a normal redirect never returns here.
export async function launchCheckout(sessionId: string): Promise<void> {
  const cashfree = await getCashfree();
  if (!cashfree) {
    throw new Error("Could not load the payment SDK. Check your connection and try again.");
  }
  await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
}
