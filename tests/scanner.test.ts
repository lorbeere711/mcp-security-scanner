import { describe, expect, it } from "vitest";
import { scanMcpConfig } from "../src/index.js";

describe("scanMcpConfig", () => {
  it("finds dangerous permissions", () => {
    const result = scanMcpConfig("sample.json", {
      permissions: ["shell", "filesystem:read"]
    });

    expect(result.findings.some((f) => f.id === "PERM-001")).toBe(true);
  });

  it("returns no findings for safe config", () => {
    const result = scanMcpConfig("safe.json", {
      permissions: ["filesystem:read"],
      tools: [{ name: "search", description: "Search local index with validation." }]
    });

    expect(result.findings.length).toBe(0);
  });
});
