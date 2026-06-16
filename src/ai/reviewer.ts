import type { Finding } from "../types.js";
import { OllamaAiReviewProvider } from "./providers/ollama.js";
import { MockAiReviewProvider } from "./providers/mock.js";
import type { AiReviewInput, AiReviewOptions, AiReviewProvider } from "./types.js";

export const DEFAULT_AI_PROVIDER = "ollama";
export const DEFAULT_AI_MODEL = "qwen3:1.7b";
export const DEFAULT_AI_ENDPOINT = "http://localhost:11434";
export const DEFAULT_AI_TIMEOUT_MS = 30000;

export function createAiReviewProvider(options: AiReviewOptions): AiReviewProvider {
  if (options.provider === "mock") {
    return new MockAiReviewProvider();
  }

  return new OllamaAiReviewProvider({
    endpoint: options.endpoint,
    model: options.model,
    timeoutMs: options.timeoutMs
  });
}

export async function runAiReview(
  input: AiReviewInput,
  options: AiReviewOptions
): Promise<Finding[]> {
  const provider = createAiReviewProvider(options);
  return provider.review(input);
}
