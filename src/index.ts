import { scanDataExfiltration } from "./scanners/dataExfiltration.js";
import { scanMetadata } from "./scanners/metadata.js";
import { scanPermissions } from "./scanners/permissions.js";
import { scanPromptInjection } from "./scanners/promptInjection.js";
import { scanToolDescriptions } from "./scanners/toolDescriptions.js";
import type { ScanResult, Scanner } from "./types.js";

const scanners: Scanner[] = [
  scanPermissions,
  scanPromptInjection,
  scanToolDescriptions,
  scanDataExfiltration,
  scanMetadata
];

export const SCHEMA_VERSION = "1.0.0";

export function scanMcpConfig(target: string, config: unknown): ScanResult {
  const findings = scanners.flatMap((scanner) => scanner({ rawConfig: config }));

  return {
    schemaVersion: SCHEMA_VERSION,
    target,
    findings,
    scannedAt: new Date().toISOString()
  };
}
