import type { Finding, Scanner } from "../types.js";

const DANGEROUS_PERMISSIONS = [
  "shell",
  "exec",
  "spawn",
  "network:all",
  "filesystem:write",
  "filesystem:all",
  "process:env",
  "sudo"
];

export const scanPermissions: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];

  const permissions = extractPermissions(rawConfig);
  for (const entry of permissions) {
    const normalized = String(entry).toLowerCase();
    if (DANGEROUS_PERMISSIONS.some((flag) => normalized.includes(flag))) {
      findings.push({
        id: "PERM-001",
        severity: "high",
        title: "Dangerous permission detected",
        description: `Permission \"${entry}\" can enable high-impact actions.`,
        recommendation:
          "Apply least-privilege and remove broad runtime/system permissions.",
        path: "permissions"
      });
    }
  }

  return findings;
};

function extractPermissions(config: unknown): string[] {
  if (!config || typeof config !== "object") {
    return [];
  }

  const maybePermissions = (config as Record<string, unknown>).permissions;

  if (Array.isArray(maybePermissions)) {
    return maybePermissions.map(String);
  }

  if (maybePermissions && typeof maybePermissions === "object") {
    return Object.entries(maybePermissions)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
  }

  return [];
}
