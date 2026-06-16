import { InvalidArgumentError } from "commander";
import type { Finding, Severity } from "./types.js";

export type FailOnThreshold = Severity | "none";

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const failOnThresholds = new Set<FailOnThreshold>([
  "critical",
  "high",
  "medium",
  "low",
  "none"
]);

export function parseFailOnThreshold(input: string): FailOnThreshold {
  if (failOnThresholds.has(input as FailOnThreshold)) {
    return input as FailOnThreshold;
  }

  throw new InvalidArgumentError(
    `Unsupported fail-on threshold: ${input}. Use critical, high, medium, low, or none.`
  );
}

export function findingMeetsThreshold(
  finding: Pick<Finding, "severity">,
  threshold: FailOnThreshold
): boolean {
  if (threshold === "none") {
    return false;
  }

  return severityRank[finding.severity] >= severityRank[threshold];
}

export function exitCodeForFindings(
  findings: Array<Pick<Finding, "severity">>,
  threshold: FailOnThreshold
): 0 | 2 {
  return findings.some((finding) => findingMeetsThreshold(finding, threshold))
    ? 2
    : 0;
}
