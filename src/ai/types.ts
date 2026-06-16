import type { Finding } from "../types.js";

export type AiProviderName = "ollama" | "mock";

export interface AiReviewInput {
  target: string;
  config: unknown;
}

export interface AiReviewOptions {
  provider: AiProviderName;
  model: string;
  endpoint: string;
  timeoutMs: number;
}

export interface AiReviewProvider {
  review(input: AiReviewInput): Promise<Finding[]>;
}

export interface RawAiFinding {
  id?: unknown;
  severity?: unknown;
  confidence?: unknown;
  title?: unknown;
  description?: unknown;
  evidence?: unknown;
  recommendation?: unknown;
  path?: unknown;
}
