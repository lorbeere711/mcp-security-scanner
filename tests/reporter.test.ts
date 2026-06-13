import { describe, expect, it } from "vitest";
import {
  formatJsonReport,
  formatReport,
  formatSarifReport
} from "../src/reporter.js";
import type { ScanResult } from "../src/types.js";

const sampleResult: ScanResult = {
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

describe("reporters", () => {
  it("renders text report", () => {
    const text = formatReport(sampleResult);
    expect(text).toContain("MCP Security Scan Report");
    expect(text).toContain("PERM-001");
  });

  it("renders json report", () => {
    const json = formatJsonReport(sampleResult);
    const parsed = JSON.parse(json) as ScanResult & { schemaVersion: string };
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.target).toBe("examples/insecure.json");
    expect(parsed.findings.length).toBe(1);
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
});
