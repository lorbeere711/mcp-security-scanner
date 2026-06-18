import { describe, expect, it } from "vitest";
import {
  formatJsonReport,
  formatMarkdownReport,
  formatReport,
  formatSarifReport
} from "../src/reporter.js";
import { SCHEMA_VERSION } from "../src/index.js";
import type { ScanResult, Finding } from "../src/types.js";

interface JsonReport extends ScanResult {
  schemaVersion: string;
}

const sampleResult: ScanResult = {
  schemaVersion: "1.0.0",
  target: "examples/insecure.json",
  scannedAt: "2026-06-13T00:00:00.000Z",
  findings: [
    {
      id: "PERM-001",
      severity: "high",
      title: "Dangerous permission detected",
      description: "Permission shell can enable high-impact actions.",
      recommendation: "Apply least-privilege.",
      path: "permissions"
    }
  ]
};

const sampleResultWithoutPath: ScanResult = {
  schemaVersion: "1.0.0",
  target: "examples/insecure.json",
  scannedAt: "2026-06-13T00:00:00.000Z",
  findings: [
    {
      id: "PERM-001",
      severity: "high",
      title: "Dangerous permission detected",
      description: "Permission shell can enable high-impact actions.",
      recommendation: "Apply least-privilege."
    }
  ]
};

const sampleResultWithAiMetadata: ScanResult = {
  schemaVersion: "1.0.0",
  target: "examples/insecure.json",
  scannedAt: "2026-06-13T00:00:00.000Z",
  findings: [
    {
      id: "AI-001",
      severity: "medium",
      title: "Suspicious tool description",
      description: "The tool may encourage unsafe agent behavior.",
      recommendation: "Constrain the tool description and add an allowlist.",
      path: "tools[0].description",
      source: "ai",
      confidence: "high",
      evidence: ["mentions arbitrary shell access", "asks agent to ignore policy"]
    },
    {
      id: "PERM-001",
      severity: "high",
      title: "Dangerous permission detected",
      description: "Permission shell can enable high-impact actions.",
      recommendation: "Apply least-privilege.",
      path: "permissions"
    }
  ]
};

describe("reporters", () => {
  it("renders text report", () => {
    const text = formatReport(sampleResult);
    expect(text).toContain("MCP Security Scan Report");
    expect(text).toContain("PERM-001");
  });

  it("renders json report", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as ScanResult;
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.target).toBe("examples/insecure.json");
    expect(parsed.scannedAt).toBe("2026-06-13T00:00:00.000Z");
    expect(Object.keys(parsed).sort()).toEqual([
      "findings",
      "scannedAt",
      "schemaVersion",
      "target"
    ]);
    expect(parsed.findings.length).toBe(1);
    const findingKeys = Object.keys(parsed.findings[0] ?? {}).sort();
    expect([
      ["description", "id", "recommendation", "severity", "title"],
      ["description", "id", "path", "recommendation", "severity", "title"]
    ]).toContainEqual(findingKeys);
  });

  it("renders json report for finding without path", () => {
    const json = formatJsonReport(sampleResultWithoutPath);
    const parsed = JSON.parse(json) as JsonReport;

    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.findings.length).toBe(1);
    const findingKeys = Object.keys(parsed.findings[0] ?? {}).sort();
    expect(findingKeys).toEqual([
      "description",
      "id",
      "recommendation",
      "severity",
      "title"
    ]);
  });

  it("renders sarif report", () => {
    const sarif = formatSarifReport(sampleResult);
    const parsed = JSON.parse(sarif) as {
      version: string;
      runs: Array<{ results: Array<{ ruleId: string }> }>;
    };

    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs[0]?.results[0]?.ruleId).toBe("PERM-001");
  });

  it("renders markdown report with severity counts and AI metadata", () => {
    const markdown = formatMarkdownReport(sampleResultWithAiMetadata);

    expect(markdown).toContain("# MCP Security Scan Report");
    expect(markdown).toContain("Target: `examples/insecure.json`");
    expect(markdown).toContain("| high | 1 |");
    expect(markdown).toContain("| medium | 1 |");
    expect(markdown).toContain(
      "| medium | AI-001 | Suspicious tool description | The tool may encourage unsafe agent behavior. | tools[0].description | Constrain the tool description and add an allowlist. | ai | high | mentions arbitrary shell access; asks agent to ignore policy |"
    );
  });

  it("keeps duplicate markdown findings distinguishable by description", () => {
    const markdown = formatMarkdownReport({
      schemaVersion: SCHEMA_VERSION,
      target: "examples/insecure.json",
      scannedAt: "2026-06-14T00:00:00.000Z",
      findings: [
        {
          id: "PERM-001",
          severity: "high",
          title: "Dangerous permission detected",
          description: "Permission shell can enable high-impact actions.",
          recommendation: "Apply least-privilege.",
          path: "permissions"
        },
        {
          id: "PERM-001",
          severity: "high",
          title: "Dangerous permission detected",
          description: "Permission filesystem:all can enable high-impact actions.",
          recommendation: "Apply least-privilege.",
          path: "permissions"
        }
      ]
    });

    expect(markdown).toContain(
      "| high | PERM-001 | Dangerous permission detected | Permission shell can enable high-impact actions. | permissions | Apply least-privilege. | - | - | - |"
    );
    expect(markdown).toContain(
      "| high | PERM-001 | Dangerous permission detected | Permission filesystem:all can enable high-impact actions. | permissions | Apply least-privilege. | - | - | - |"
    );
  });

  it("renders markdown report for empty findings", () => {
    const markdown = formatMarkdownReport({
      schemaVersion: SCHEMA_VERSION,
      target: "safe.json",
      scannedAt: "2026-06-14T00:00:00.000Z",
      findings: []
    });

    expect(markdown).toContain("| critical | 0 |");
    expect(markdown).toContain("No findings detected.");
  });
});

describe("JSON report schema", () => {
  it("includes schemaVersion as a top-level field", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty("schemaVersion");
    expect(typeof parsed.schemaVersion).toBe("string");
  });

  it("schemaVersion matches the exported SCHEMA_VERSION constant", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as ScanResult;
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("contains all required top-level fields", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty("schemaVersion");
    expect(parsed).toHaveProperty("target");
    expect(parsed).toHaveProperty("scannedAt");
    expect(parsed).toHaveProperty("findings");
  });

  it("findings have the required shape", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as ScanResult;
    const finding: Finding = parsed.findings[0]!;

    expect(typeof finding.id).toBe("string");
    expect(["low", "medium", "high", "critical"]).toContain(finding.severity);
    expect(typeof finding.title).toBe("string");
    expect(typeof finding.description).toBe("string");
    expect(typeof finding.recommendation).toBe("string");
  });

  it("empty findings array is valid", () => {
    const emptyResult: ScanResult = {
      schemaVersion: SCHEMA_VERSION,
      target: "safe.json",
      scannedAt: "2026-06-14T00:00:00.000Z",
      findings: []
    };
    const json = formatJsonReport(emptyResult);
    const parsed = JSON.parse(json) as ScanResult;

    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.findings).toEqual([]);
  });
});
