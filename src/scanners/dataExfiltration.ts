import type { Finding, Scanner } from "../types.js";

const EXFIL_KEYWORDS = [
  "webhook",
  "upload",
  "external api",
  "http post",
  "send data",
  "exfiltrate"
];

const SENSITIVE_KEYWORDS = ["secret", "token", "apikey", "password", "credential"];

export const scanDataExfiltration: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];
  const strings = deepCollectStrings(rawConfig).map((s) => s.toLowerCase());
  const blob = strings.join("\n");

  const hasExfilBehavior = EXFIL_KEYWORDS.some((k) => blob.includes(k));
  const handlesSensitiveData = SENSITIVE_KEYWORDS.some((k) => blob.includes(k));

  if (hasExfilBehavior && handlesSensitiveData) {
    findings.push({
      id: "EXFIL-001",
      severity: "critical",
      title: "Potential sensitive data exfiltration path",
      description:
        "The configuration suggests both sensitive data handling and external transmission behavior.",
      recommendation:
        "Gate outbound requests, redact secrets, and enforce explicit allowlists for egress destinations.",
      path: "tools"
    });
  }

  return findings;
};

function deepCollectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(deepCollectStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(deepCollectStrings);
  }
  return [];
}
