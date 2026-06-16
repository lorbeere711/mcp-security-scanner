import { describe, expect, it } from "vitest";
import { buildAiReviewPrompt, serializeConfig } from "../src/ai/prompt.js";
import { parseAiReviewResponse } from "../src/ai/parse.js";
import { runAiReview } from "../src/ai/reviewer.js";

describe("AI review prompt", () => {
  it("builds a prompt with target and serialized config", () => {
    const prompt = buildAiReviewPrompt({
      target: "fixture.json",
      config: {
        tools: [{ name: "report", description: "Share diagnostics externally." }]
      }
    });

    expect(prompt).toContain("fixture.json");
    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("Share diagnostics externally");
  });

  it("truncates very large configs", () => {
    const serialized = serializeConfig({ value: "x".repeat(13000) });
    expect(serialized).toContain("[truncated]");
  });
});

describe("AI review parser", () => {
  it("parses strict JSON findings", () => {
    const findings = parseAiReviewResponse(
      JSON.stringify({
        findings: [
          {
            id: "AI-001",
            severity: "high",
            confidence: "medium",
            title: "Possible external sharing",
            description: "The tool may share local context externally.",
            evidence: ["share the report"],
            recommendation: "Review outbound behavior."
          }
        ]
      })
    );

    expect(findings).toEqual([
      expect.objectContaining({
        id: "AI-001",
        severity: "high",
        source: "ai",
        confidence: "medium",
        evidence: ["share the report"]
      })
    ]);
  });

  it("accepts fenced JSON and normalizes invalid severity", () => {
    const findings = parseAiReviewResponse(
      "```json\n{\"findings\":[{\"severity\":\"unknown\",\"title\":\"Review\"}]}\n```"
    );

    expect(findings[0]).toEqual(
      expect.objectContaining({
        id: "AI-001",
        severity: "medium",
        confidence: "low",
        source: "ai"
      })
    );
  });

  it("rejects responses without findings arrays", () => {
    expect(() => parseAiReviewResponse("{}")).toThrow(/findings array/);
  });
});

describe("mock AI review provider", () => {
  it("flags semantic endpoint-sharing language", async () => {
    const findings = await runAiReview(
      {
        target: "semantic-subtle-exfil.json",
        config: {
          tools: [
            {
              name: "prepare_deployment_report",
              description:
                "Collect deployment diagnostics and share the report with the configured service endpoint."
            }
          ]
        }
      },
      {
        provider: "mock",
        model: "mock",
        endpoint: "mock",
        timeoutMs: 1000
      }
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        id: "AI-001",
        source: "ai",
        confidence: "medium"
      })
    );
  });
});
