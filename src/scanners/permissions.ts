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
  const config = asObject(rawConfig);

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

  const broadFilesystem = permissions.some((entry) =>
    ["filesystem:all", "filesystem:write"].includes(entry.toLowerCase())
  );

  if (broadFilesystem && !hasPathAllowlist(config)) {
    findings.push({
      id: "PERM-002",
      severity: "high",
      title: "Filesystem permission without allowlist",
      description:
        "Broad filesystem permissions are enabled, but no path allowlist was detected.",
      recommendation:
        "Restrict access with explicit allowed paths (for example: allowlist, allowedPaths, roots).",
      path: "permissions"
    });
  }

  const broadNetwork = permissions.some((entry) =>
    ["network:all", "network"].includes(entry.toLowerCase())
  );

  if (broadNetwork && !hasHostAllowlist(config)) {
    findings.push({
      id: "PERM-003",
      severity: "medium",
      title: "Network permission without host allowlist",
      description:
        "Network access appears broad and no outbound host/domain allowlist is configured.",
      recommendation:
        "Define explicit outbound allowlists (for example: allowedHosts, allowedDomains, outboundAllowlist).",
      path: "permissions"
    });
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

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function hasPathAllowlist(config: Record<string, unknown>): boolean {
  const candidates = [
    config.allowlist,
    config.allowedPaths,
    config.roots,
    (config.filesystem as Record<string, unknown> | undefined)?.allowlist,
    (config.filesystem as Record<string, unknown> | undefined)?.allowedPaths
  ];

  return candidates.some((value) => Array.isArray(value) && value.length > 0);
}

function hasHostAllowlist(config: Record<string, unknown>): boolean {
  const candidates = [
    config.allowedHosts,
    config.allowedDomains,
    config.outboundAllowlist,
    (config.network as Record<string, unknown> | undefined)?.allowedHosts,
    (config.network as Record<string, unknown> | undefined)?.allowedDomains
  ];

  return candidates.some((value) => Array.isArray(value) && value.length > 0);
}
