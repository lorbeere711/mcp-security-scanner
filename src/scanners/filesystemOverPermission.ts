import type { Finding, Scanner } from "../types.js";

/**
 * Detects broad filesystem permissions (filesystem:all, filesystem:write)
 * when no explicit path allowlist is configured.
 *
 * This is a dedicated scanner that provides a focused, well-documented rule
 * for the filesystem over-permission pattern. It complements the general
 * permissions scanner by surfacing this specific risk with clear remediation.
 */

const BROAD_FILESYSTEM_PERMISSIONS = ["filesystem:all", "filesystem:write"];

export const scanFilesystemOverPermission: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];

  const permissions = extractPermissions(rawConfig);
  const config = asObject(rawConfig);

  // Check for broad filesystem permissions in the permissions array
  const hasBroadFsPermission = permissions.some((entry) =>
    BROAD_FILESYSTEM_PERMISSIONS.includes(entry.toLowerCase())
  );

  // Also check capabilities array (some configs use "capabilities" instead of "permissions")
  const capabilities = extractCapabilities(rawConfig);
  const hasBroadFsCapability = capabilities.some((entry) =>
    BROAD_FILESYSTEM_PERMISSIONS.includes(entry.toLowerCase())
  );

  if (hasBroadFsPermission || hasBroadFsCapability) {
    // Check if a path allowlist is configured
    if (!hasPathAllowlist(config)) {
      findings.push({
        id: "FS-001",
        severity: "high",
        title: "Broad filesystem permission without path allowlist",
        description:
          "The MCP server requests broad filesystem access (filesystem:all or filesystem:write) without configuring an explicit path allowlist. This grants the server unrestricted read/write access to the entire filesystem, which could lead to unauthorized data access or modification.",
        recommendation:
          "Restrict filesystem access to specific directories using the allowedPaths, allowlist, or roots configuration field. For example: set allowedPaths to [\"/workspace\"] to limit access to only the workspace directory.",
        path: "permissions"
      });
    }
  }

  // Check for filesystem:read with no allowlist — less severe but still worth flagging
  // when the server also has write or all permissions elsewhere
  const hasReadPermission = permissions.some((entry) =>
    entry.toLowerCase() === "filesystem:read"
  );
  const hasReadCapability = capabilities.some((entry) =>
    entry.toLowerCase() === "filesystem:read"
  );

  if (
    (hasReadPermission || hasReadCapability) &&
    !hasBroadFsPermission &&
    !hasBroadFsCapability &&
    !hasPathAllowlist(config)
  ) {
    findings.push({
      id: "FS-002",
      severity: "medium",
      title: "Filesystem read access without path allowlist",
      description:
        "The MCP server requests filesystem read access without a path allowlist. While read-only access is lower risk than write access, it still exposes the full filesystem to potential data leakage.",
        recommendation:
          "Restrict read access to specific directories using the allowedPaths, allowlist, or roots configuration field.",
        path: "permissions"
    });
  }

  return findings;
};

function extractPermissions(config: unknown): string[] {
  if (!config || typeof config !== "object") return [];

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

function extractCapabilities(config: unknown): string[] {
  if (!config || typeof config !== "object") return [];

  const maybeCapabilities = (config as Record<string, unknown>).capabilities;

  if (Array.isArray(maybeCapabilities)) {
    return maybeCapabilities.map(String);
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
