import { describe, expect, it } from "vitest";
import { scanMcpConfig } from "../src/index.js";

describe("scanFilesystemOverPermission", () => {
  it("flags filesystem:all without allowlist", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      permissions: ["filesystem:all"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeDefined();
    expect(fsFinding?.severity).toBe("high");
    expect(fsFinding?.title).toBe(
      "Broad filesystem permission without path allowlist"
    );
  });

  it("flags filesystem:write without allowlist", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      permissions: ["filesystem:write"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeDefined();
    expect(fsFinding?.severity).toBe("high");
  });

  it("flags broad filesystem permission in capabilities array", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      capabilities: ["shell", "filesystem:all"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeDefined();
  });

  it("does not flag when allowedPaths allowlist is configured", () => {
    const result = scanMcpConfig("test.json", {
      name: "safe-server",
      permissions: ["filesystem:all"],
      allowedPaths: ["/workspace"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeUndefined();
  });

  it("does not flag when allowlist is under filesystem key", () => {
    const result = scanMcpConfig("test.json", {
      name: "safe-server",
      permissions: ["filesystem:all"],
      filesystem: {
        allowlist: ["/workspace", "/tmp"]
      }
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeUndefined();
  });

  it("does not flag when roots is configured", () => {
    const result = scanMcpConfig("test.json", {
      name: "safe-server",
      permissions: ["filesystem:write"],
      roots: ["/workspace"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeUndefined();
  });

  it("flags read-only access without allowlist as medium severity", () => {
    const result = scanMcpConfig("test.json", {
      name: "read-only-server",
      permissions: ["filesystem:read"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-002");
    expect(fsFinding).toBeDefined();
    expect(fsFinding?.severity).toBe("medium");
  });

  it("only flags FS-001 when broad + read exist (read subsumed by all)", () => {
    const result = scanMcpConfig("test.json", {
      name: "full-access-server",
      permissions: ["filesystem:all", "filesystem:read"]
    });

    const fs001 = result.findings.filter((f) => f.id === "FS-001");
    const fs002 = result.findings.filter((f) => f.id === "FS-002");
    expect(fs001).toHaveLength(1);
    expect(fs002).toHaveLength(0);
  });

  it("handles empty config gracefully", () => {
    const result = scanMcpConfig("test.json", {});
    const fsFindings = result.findings.filter(
      (f) => f.id.startsWith("FS-")
    );
    expect(fsFindings).toHaveLength(0);
  });

  it("handles null config gracefully", () => {
    const result = scanMcpConfig("test.json", null as unknown);
    const fsFindings = result.findings.filter(
      (f) => f.id.startsWith("FS-")
    );
    expect(fsFindings).toHaveLength(0);
  });

  it("handles case-insensitive permission matching", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      permissions: ["FILESYSTEM:ALL"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding).toBeDefined();
  });

  it("includes remediation text in recommendation", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      permissions: ["filesystem:write"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding?.recommendation).toContain("allowedPaths");
    expect(fsFinding?.recommendation).toContain("allowlist");
    expect(fsFinding?.recommendation).toContain("roots");
  });

  it("includes descriptive text mentioning both permission types", () => {
    const result = scanMcpConfig("test.json", {
      name: "test-server",
      permissions: ["filesystem:all"]
    });

    const fsFinding = result.findings.find((f) => f.id === "FS-001");
    expect(fsFinding?.description).toContain("filesystem:all");
    expect(fsFinding?.description).toContain("filesystem:write");
  });
});
