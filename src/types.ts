export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  path?: string;
}

export interface ScanResult {
  target: string;
  findings: Finding[];
  scannedAt: string;
}

export interface ScannerContext {
  rawConfig: unknown;
}

export type Scanner = (context: ScannerContext) => Finding[];
