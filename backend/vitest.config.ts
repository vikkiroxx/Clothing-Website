import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // factory.test.ts dynamically re-imports modules per test (vi.resetModules
    // + await import) to exercise different env-var combinations — each cold
    // re-evaluation is normally fast, but can occasionally exceed the 5s
    // default under load, so give it more headroom.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
