import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scanMcpConfig } from "../src/index.js";

const fixtureSecretPattern =
  /(sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9_]{16,}|xox[baprs]-[A-Za-z0-9-]+|AKIA[0-9A-Z]{16})/;

function readFixture(fileName: string): string {
  return readFileSync(new URL(`../examples/fixtures/${fileName}`, import.meta.url), "utf8");
}

function loadFixture(fileName: string): unknown {
  return JSON.parse(readFixture(fileName)) as unknown;
}

function uniqueFindingIds(fileName: string): string[] {
  const result = scanMcpConfig(fileName, loadFixture(fileName));
  return [...new Set(result.findings.map((finding) => finding.id))].sort();
}

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

  it("keeps the sanitized safe fixture clean", () => {
    const fixtureName = "real-world-safe-filesystem.json";
    const expectedFindings = loadFixture("expected-findings.json") as Record<
      string,
      string[]
    >;

    expect(readFixture(fixtureName)).not.toMatch(fixtureSecretPattern);
    expect(uniqueFindingIds(fixtureName)).toEqual(expectedFindings[fixtureName]);
  });

  it("reports expected findings for the sanitized unsafe fixture", () => {
    const fixtureName = "real-world-unsafe-shell-exfil.json";
    const expectedFindings = loadFixture("expected-findings.json") as Record<
      string,
      string[]
    >;

    expect(readFixture(fixtureName)).not.toMatch(fixtureSecretPattern);
    expect(uniqueFindingIds(fixtureName)).toEqual([...expectedFindings[fixtureName]].sort());
  });
});
