import type { Finding, Scanner } from "../types.js";

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /do\s+anything\s+now/i,
  /reveal\s+secrets?/i,
  /bypass\s+(policy|guardrails?)/i
];

export const scanPromptInjection: Scanner = ({ rawConfig }) => {
  const findings: Finding[] = [];
  const joined = deepCollectStrings(rawConfig).join("\n");

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(joined)) {
      findings.push({
        id: "PROMPT-001",
        severity: "critical",
        title: "Prompt injection indicator found",
        description: `Pattern \"${pattern.source}\" was found in server config/prompts.`,
        recommendation:
          "Harden prompts with strict boundaries and remove jailbreak-like instructions.",
        path: "prompts"
      });
    }
  }

  return dedupeById(findings);
};

function deepCollectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(deepCollectStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(deepCollectStrings);
  }
  return [];
}

function dedupeById(findings: Finding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const finding of findings) {
    if (!map.has(finding.id)) map.set(finding.id, finding);
  }
  return [...map.values()];
}
