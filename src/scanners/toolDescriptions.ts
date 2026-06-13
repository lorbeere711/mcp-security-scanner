import type { Finding, Scanner } from "../types.js";

const UNSAFE_DESC_MARKERS = [
  "execute arbitrary",
  "run any command",
  "full file system access",
  "without validation",
  "accepts raw user input"
];

const CAPABILITY_KEYWORDS = [
  "exec",
  "shell",
  "read_file",
  "write_file",
  "delete",
  "env",
  "token",
  "browser",
  "http"
];

export const scanToolDescriptions: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];

  const tools = extractTools(rawConfig);
  for (const tool of tools) {
    const name = tool.name.toLowerCase();
    const description = (tool.description ?? "").toLowerCase();
    const marker = UNSAFE_DESC_MARKERS.find((m) => description.includes(m));
    const capability = CAPABILITY_KEYWORDS.find(
      (keyword) => name.includes(keyword) || description.includes(keyword)
    );

    if (marker) {
      findings.push({
        id: "TOOLS-001",
        severity: "high",
        title: "Unsafe tool description",
        description: `Tool \"${tool.name}\" contains risky phrase: \"${marker}\".`,
        recommendation:
          "Constrain capabilities, define strict input schema, and describe safe behavior only.",
        path: `tools.${tool.name}`
      });
    }

    if (capability) {
      findings.push({
        id: "TOOLS-002",
        severity: capability === "exec" || capability === "shell" ? "high" : "medium",
        title: "Potentially dangerous tool capability",
        description:
          `Tool \"${tool.name}\" references sensitive capability keyword \"${capability}\".`,
        recommendation:
          "Add strict authorization checks, validation, and least-privilege constraints for this tool.",
        path: `tools.${tool.name}`
      });
    }
  }

  return dedupeByFingerprint(findings);
};

function extractTools(
  config: unknown
): Array<{ name: string; description?: string }> {
  if (!config || typeof config !== "object") {
    return [];
  }

  const obj = config as Record<string, unknown>;
  const toolsRaw = obj.tools;

  if (!Array.isArray(toolsRaw)) {
    return [];
  }

  return toolsRaw
    .filter((tool) => tool && typeof tool === "object")
    .map((tool, index) => {
      const t = tool as Record<string, unknown>;
      return {
        name: String(t.name ?? `tool_${index}`),
        description: typeof t.description === "string" ? t.description : undefined
      };
    });
}

function dedupeByFingerprint(findings: Finding[]): Finding[] {
  const map = new Map<string, Finding>();

  for (const finding of findings) {
    const key = `${finding.id}:${finding.path ?? ""}:${finding.description}`;
    if (!map.has(key)) {
      map.set(key, finding);
    }
  }

  return [...map.values()];
}
