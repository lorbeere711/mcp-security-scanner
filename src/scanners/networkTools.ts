import type { Finding, Scanner } from "../types.js";

const NETWORK_TOOL_KEYWORDS = [
  "fetch",
  "http",
  "url",
  "webhook",
  "download",
  "upload",
  "external api",
  "external endpoint",
  "remote api"
];

export const scanNetworkTools: Scanner = ({ rawConfig }) => {
  const config = asObject(rawConfig);
  const configHasAllowlist = hasDomainAllowlist(config);
  const findings: Finding[] = [];

  for (const tool of extractTools(config)) {
    if (!isNetworkTool(tool)) {
      continue;
    }

    const hasAllowlist = configHasAllowlist || hasDomainAllowlist(tool.raw);

    findings.push({
      id: "NET-001",
      severity: hasAllowlist ? "low" : "medium",
      title: hasAllowlist
        ? "Network tool constrained by domain allowlist"
        : "Network tool without domain allowlist",
      description: hasAllowlist
        ? `Tool "${tool.name}" appears network-capable and defines an outbound domain or host allowlist.`
        : `Tool "${tool.name}" appears network-capable but no outbound domain or host allowlist was detected.`,
      recommendation: hasAllowlist
        ? "Keep the outbound allowlist narrow and reject requests outside approved domains."
        : "Define explicit allowed domains or hosts before accepting arbitrary URLs or remote endpoints.",
      path: `tools.${tool.name}`
    });
  }

  return findings;
};

function extractTools(
  config: Record<string, unknown>
): Array<{ name: string; description: string; raw: Record<string, unknown> }> {
  const toolsRaw = config.tools;

  if (!Array.isArray(toolsRaw)) {
    return [];
  }

  return toolsRaw
    .filter((tool): tool is Record<string, unknown> => Boolean(tool) && typeof tool === "object")
    .map((tool, index) => ({
      name: String(tool.name ?? `tool_${index}`),
      description: typeof tool.description === "string" ? tool.description : "",
      raw: tool
    }));
}

function isNetworkTool(tool: { name: string; description: string }): boolean {
  const haystack = `${tool.name}\n${tool.description}`.toLowerCase();
  return NETWORK_TOOL_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function hasDomainAllowlist(config: Record<string, unknown>): boolean {
  const network = asObject(config.network);
  const candidates = [
    config.allowedHosts,
    config.allowedDomains,
    config.domainAllowlist,
    config.hostAllowlist,
    config.outboundAllowlist,
    network.allowedHosts,
    network.allowedDomains,
    network.domainAllowlist,
    network.hostAllowlist,
    network.outboundAllowlist
  ];

  return candidates.some(hasEntries);
}

function hasEntries(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return false;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
