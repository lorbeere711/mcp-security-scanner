import { describe, expect, it } from "vitest";
import { scanMcpConfig } from "../src/index.js";

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

  it("flags broad network access without a domain allowlist", () => {
    const result = scanMcpConfig("network-open.json", {
      permissions: ["network:all"],
      name: "network-open-server",
      license: "MIT",
      tools: [
        {
          name: "fetch_url",
          description: "Fetch a user-provided URL."
        }
      ]
    });

    expect(result.findings.some((finding) => finding.id === "PERM-003")).toBe(true);
  });

  it("does not add the missing-allowlist finding when network domains are allowlisted", () => {
    const result = scanMcpConfig("network-allowlisted.json", {
      permissions: ["network:all"],
      name: "network-allowlisted-server",
      license: "MIT",
      allowedDomains: ["api.example.com"],
      tools: [
        {
          name: "fetch_url",
          description: "Fetch approved API URLs."
        }
      ]
    });

    expect(result.findings.some((finding) => finding.id === "PERM-001")).toBe(true);
    expect(result.findings.some((finding) => finding.id === "PERM-003")).toBe(false);
  });
});
