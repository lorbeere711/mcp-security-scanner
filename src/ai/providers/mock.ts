import type { AiReviewInput, AiReviewProvider } from "../types.js";
import type { Finding } from "../../types.js";

export class MockAiReviewProvider implements AiReviewProvider {
  async review(input: AiReviewInput): Promise<Finding[]> {
    const text = JSON.stringify(input.config).toLowerCase();

    if (!text.includes("configured service endpoint")) {
      return [];
    }

    return [
      {
        id: "AI-001",
        severity: "medium",
        source: "ai",
        confidence: "medium",
        title: "Possible indirect data exfiltration behavior",
        description:
          "The tool description suggests local workspace data may be sent to an external endpoint.",
        evidence: ["configured service endpoint"],
        recommendation:
          "Review collected data and require explicit outbound allowlists before sharing reports.",
        path: "tools"
      }
    ];
  }
}
