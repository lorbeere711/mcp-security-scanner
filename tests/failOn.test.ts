import { describe, expect, it } from "vitest";
import {
  exitCodeForFindings,
  findingMeetsThreshold,
  parseFailOnThreshold,
  type FailOnThreshold
} from "../src/failOn.js";
import type { Severity } from "../src/types.js";

const severities: Severity[] = ["low", "medium", "high", "critical"];

describe("fail-on threshold", () => {
  it.each<{
    threshold: FailOnThreshold;
    matchingSeverities: Severity[];
  }>([
    { threshold: "critical", matchingSeverities: ["critical"] },
    { threshold: "high", matchingSeverities: ["high", "critical"] },
    { threshold: "medium", matchingSeverities: ["medium", "high", "critical"] },
    {
      threshold: "low",
      matchingSeverities: ["low", "medium", "high", "critical"]
    },
    { threshold: "none", matchingSeverities: [] }
  ])(
    "matches findings at or above the $threshold threshold",
    ({ threshold, matchingSeverities }) => {
      for (const severity of severities) {
        expect(findingMeetsThreshold({ severity }, threshold)).toBe(
          matchingSeverities.includes(severity)
        );
      }
    }
  );

  it.each<{
    threshold: FailOnThreshold;
    findings: Severity[];
    exitCode: 0 | 2;
  }>([
    { threshold: "critical", findings: ["high"], exitCode: 0 },
    { threshold: "critical", findings: ["critical"], exitCode: 2 },
    { threshold: "high", findings: ["medium"], exitCode: 0 },
    { threshold: "high", findings: ["high"], exitCode: 2 },
    { threshold: "medium", findings: ["low"], exitCode: 0 },
    { threshold: "medium", findings: ["medium"], exitCode: 2 },
    { threshold: "low", findings: ["low"], exitCode: 2 },
    { threshold: "none", findings: ["critical"], exitCode: 0 }
  ])(
    "returns exit code $exitCode for $threshold threshold with $findings findings",
    ({ threshold, findings, exitCode }) => {
      expect(
        exitCodeForFindings(
          findings.map((severity) => ({ severity })),
          threshold
        )
      ).toBe(exitCode);
    }
  );

  it("returns zero when there are no findings", () => {
    expect(exitCodeForFindings([], "low")).toBe(0);
  });

  it("parses valid thresholds", () => {
    for (const threshold of [
      "critical",
      "high",
      "medium",
      "low",
      "none"
    ] as const) {
      expect(parseFailOnThreshold(threshold)).toBe(threshold);
    }
  });

  it("rejects invalid thresholds with a clear error", () => {
    expect(() => parseFailOnThreshold("severe")).toThrow(
      "Unsupported fail-on threshold: severe. Use critical, high, medium, low, or none."
    );
  });
});
