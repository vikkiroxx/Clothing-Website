import "express";

declare global {
  namespace Express {
    interface Request {
      // Captured by the express.json() verify hook in server.ts — needed to
      // verify the Cashfree webhook signature, which is computed over the
      // exact bytes received, not a re-serialized JSON.parse/stringify copy.
      rawBody?: string;
    }
  }
}
