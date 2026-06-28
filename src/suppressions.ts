import type { Finding, Suppression } from "./types.js";

export function applySuppressions(findings: Finding[], rawConfig: unknown): Finding[] {
  const suppressions = extractSuppressions(rawConfig);

  if (suppressions.length === 0) {
    return findings;
  }

  return findings.map((finding) =>
    suppressions.some((suppression) => matchesSuppression(finding, suppression))
      ? { ...finding, suppressed: true }
      : finding
  );
}

function extractSuppressions(rawConfig: unknown): Suppression[] {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return [];
  }

  const suppressions = (rawConfig as Record<string, unknown>).suppressions;

  if (!Array.isArray(suppressions)) {
    return [];
  }

  return suppressions.filter(isSuppression);
}

function isSuppression(value: unknown): value is Suppression {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.ruleId === "string" && record.ruleId.trim().length > 0;
}

function matchesSuppression(finding: Finding, suppression: Suppression): boolean {
  if (suppression.ruleId !== finding.id) {
    return false;
  }

  const location = suppression.target ?? suppression.path ?? suppression.location;

  if (!location) {
    return true;
  }

  return matchesLocation(finding.path, location);
}

function matchesLocation(findingPath: string | undefined, suppressionLocation: string): boolean {
  if (!findingPath) {
    return false;
  }

  return (
    findingPath === suppressionLocation ||
    findingPath.startsWith(`${suppressionLocation}.`) ||
    suppressionLocation.startsWith(`${findingPath}.`)
  );
}
