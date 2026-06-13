import type { Finding, Scanner } from "../types.js";

export const scanMetadata: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];
  const config = asObject(rawConfig);

  const hasName = typeof config.name === "string" && config.name.trim().length > 0;
  const hasLicense = typeof config.license === "string" && config.license.trim().length > 0;

  if (!hasName) {
    findings.push({
      id: "META-001",
      severity: "low",
      title: "Missing server metadata name",
      description: "No top-level server name metadata was found.",
      recommendation: "Add a clear name field to improve inventory and audit traceability.",
      path: "name"
    });
  }

  if (!hasLicense) {
    findings.push({
      id: "META-002",
      severity: "low",
      title: "Missing server license metadata",
      description: "No top-level license metadata was found.",
      recommendation: "Declare a license to support governance and supply-chain reviews.",
      path: "license"
    });
  }

  return findings;
};

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}
