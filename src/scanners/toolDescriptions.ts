import type { Finding, Scanner } from "../types.js";

const UNSAFE_DESC_MARKERS = [
  "execute arbitrary",
  "run any command",
  "full file system access",
  "without validation",
  "accepts raw user input"
];

export const scanToolDescriptions: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];

  const tools = extractTools(rawConfig);
  for (const tool of tools) {
    const description = (tool.description ?? "").toLowerCase();
    const marker = UNSAFE_DESC_MARKERS.find((m) => description.includes(m));

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
  }

  return findings;
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
