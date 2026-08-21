import { describe, expect, it } from "vitest";
import { serializeProviderAuditMetadata } from "./db";

describe("provider audit metadata privacy", () => {
  it("records only bounded operational metadata and excludes untyped raw content", () => {
    const value = JSON.parse(serializeProviderAuditMetadata({ inputLength: 9000, category: "laptop".repeat(30), issueCount: 99, resultCount: 99, rawBrief: "do not persist me", apiKey: "do not persist me" } as never));
    expect(value).toEqual({ inputLength: 4000, category: "laptop".repeat(30).slice(0, 80), issueCount: 20, resultCount: 10 });
    expect(value).not.toHaveProperty("rawBrief");
    expect(value).not.toHaveProperty("apiKey");
  });
});
