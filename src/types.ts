export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  path?: string;
  suppressed?: boolean;
  source?: "deterministic" | "ai";
  confidence?: "low" | "medium" | "high";
  evidence?: string[];
}

export interface Suppression {
  ruleId: string;
  target?: string;
  path?: string;
  location?: string;
  reason?: string;
}

export interface ScanResult {
  schemaVersion: string;
  target: string;
  findings: Finding[];
  scannedAt: string;
}

export interface ScannerContext {
  rawConfig: unknown;
}

export type Scanner = (context: ScannerContext) => Finding[];
