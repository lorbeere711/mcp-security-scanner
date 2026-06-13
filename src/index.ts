import { scanDataExfiltration } from "./scanners/dataExfiltration.js";
import { scanPermissions } from "./scanners/permissions.js";
import { scanPromptInjection } from "./scanners/promptInjection.js";
import { scanToolDescriptions } from "./scanners/toolDescriptions.js";
import type { ScanResult, Scanner } from "./types.js";

const scanners: Scanner[] = [
  scanPermissions,
  scanPromptInjection,
  scanToolDescriptions,
  scanDataExfiltration
];

export function scanMcpConfig(target: string, config: unknown): ScanResult {
  const findings = scanners.flatMap((scanner) => scanner({ rawConfig: config }));

  return {
    target,
    findings,
    scannedAt: new Date().toISOString()
  };
}
