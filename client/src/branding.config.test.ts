import { describe, expect, it } from "vitest";

describe("managed application branding configuration", () => {
  it("exposes Specanic as the configured frontend application title", () => {
    expect(import.meta.env.VITE_APP_TITLE ?? process.env.VITE_APP_TITLE).toBe("Specanic");
  });
});
