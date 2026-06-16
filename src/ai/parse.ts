import type { Finding, Severity } from "../types.js";
import type { RawAiFinding } from "./types.js";

const severities = new Set<Severity>(["low", "medium", "high", "critical"]);
const confidences = new Set(["low", "medium", "high"]);

export function parseAiReviewResponse(content: string): Finding[] {
  const parsed = JSON.parse(stripJsonFences(content)) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI review response must be a JSON object.");
  }

  const findings = (parsed as { findings?: unknown }).findings;
  if (!Array.isArray(findings)) {
    throw new Error("AI review response must contain a findings array.");
  }

  return findings.map((finding, index) => normalizeFinding(finding, index));
}

function stripJsonFences(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

function normalizeFinding(value: unknown, index: number): Finding {
  if (!value || typeof value !== "object") {
    throw new Error(`AI finding at index ${index} must be an object.`);
  }

  const raw = value as RawAiFinding;
  const severity = normalizeSeverity(raw.severity);
  const confidence = normalizeConfidence(raw.confidence);
  const evidence = normalizeEvidence(raw.evidence);

  return {
    id: normalizeString(raw.id, `AI-${String(index + 1).padStart(3, "0")}`),
    severity,
    source: "ai",
    confidence,
    title: normalizeString(raw.title, "AI review finding"),
    description: normalizeString(raw.description, "Local AI review flagged this for human review."),
    evidence,
    recommendation: normalizeString(
      raw.recommendation,
      "Review this behavior manually and add explicit allowlists or constraints."
    ),
    ...(typeof raw.path === "string" && raw.path.length > 0 ? { path: raw.path } : {})
  };
}

function normalizeSeverity(value: unknown): Severity {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (severities.has(normalized as Severity)) {
      return normalized as Severity;
    }
  }

  return "medium";
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (confidences.has(normalized)) {
      return normalized as "low" | "medium" | "high";
    }
  }

  return "low";
}

function normalizeEvidence(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string").slice(0, 8);
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}
