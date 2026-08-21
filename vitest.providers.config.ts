import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  test: {
    environment: "node",
    include: ["server/routers/live-search-secret.test.ts", "server/routers/product-provider-secret.test.ts", "server/routers/specExtraction.firecrawl.test.ts"],
  },
});
