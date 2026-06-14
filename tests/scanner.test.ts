import { describe, expect, it } from "vitest";
import { scanMcpConfig, SCHEMA_VERSION } from "../src/index.js";

describe("scanMcpConfig", () => {
  it("finds dangerous permissions", () => {
    const result = scanMcpConfig("sample.json", {
      permissions: ["shell", "filesystem:read"],
      name: "dangerous-server",
      license: "MIT"
    });

    expect(result.findings.some((f) => f.id === "PERM-001")).toBe(true);
  });

  it("returns no findings for safe config", () => {
    const result = scanMcpConfig("safe.json", {
      permissions: ["filesystem:read"],
      name: "safe-server",
      license: "MIT",
      allowedPaths: ["/workspace"],
      tools: [{ name: "search", description: "Search local index with validation." }]
    });

    expect(result.findings.length).toBe(0);
  });

  it("includes schemaVersion in result", () => {
    const result = scanMcpConfig("test.json", {
      permissions: [],
      name: "test-server",
      license: "MIT"
    });

    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
