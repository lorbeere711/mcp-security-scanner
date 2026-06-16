import { buildAiReviewPrompt } from "../prompt.js";
import { parseAiReviewResponse } from "../parse.js";
import type { AiReviewInput, AiReviewProvider } from "../types.js";
import type { Finding } from "../../types.js";

interface OllamaProviderOptions {
  endpoint: string;
  model: string;
  timeoutMs: number;
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

export class OllamaAiReviewProvider implements AiReviewProvider {
  constructor(private readonly options: OllamaProviderOptions) {}

  async review(input: AiReviewInput): Promise<Finding[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.endpoint.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.options.model,
          stream: false,
          format: "json",
          think: false,
          messages: [
            {
              role: "user",
              content: buildAiReviewPrompt(input)
            }
          ],
          options: {
            temperature: 0,
            num_predict: 768
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content;

      if (!content) {
        throw new Error("Ollama response did not include message content.");
      }

      return parseAiReviewResponse(content);
    } finally {
      clearTimeout(timeout);
    }
  }
}
