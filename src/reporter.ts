import type { Finding, ScanResult } from "./types.js";

const severityWeight: Record<Finding["severity"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export type ReportFormat = "text" | "json" | "sarif";

export function formatReport(result: ScanResult): string {
  const sorted = [...result.findings].sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
  );

  const lines = [
    `MCP Security Scan Report`,
    `Target: ${result.target}`,
    `Scanned At: ${result.scannedAt}`,
    `Findings: ${sorted.length}`,
    ""
  ];

  if (sorted.length === 0) {
    lines.push("No findings detected.");
    return lines.join("\n");
  }

  sorted.forEach((f, idx) => {
    lines.push(
      `${idx + 1}. [${f.severity.toUpperCase()}] ${f.title}`,
      `   ID: ${f.id}`,
      `   Description: ${f.description}`,
      `   Recommendation: ${f.recommendation}`
    );

    if (f.path) {
      lines.push(`   Path: ${f.path}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

export function formatJsonReport(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatSarifReport(result: ScanResult): string {
  const sarif = {
    $schema:
      "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "mcp-security-scanner",
            informationUri: "https://github.com/example/mcp-security-scanner",
            rules: buildRules(result.findings)
          }
        },
        results: result.findings.map((finding) => ({
          ruleId: finding.id,
          level: sarifLevel(finding.severity),
          message: {
            text: `${finding.title}: ${finding.description}`
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: result.target
                },
                region: {
                  snippet: {
                    text: finding.path ?? "root"
                  }
                }
              }
            }
          ]
        }))
      }
    ]
  };

  return JSON.stringify(sarif, null, 2);
}

function sarifLevel(severity: Finding["severity"]): "note" | "warning" | "error" {
  if (severity === "critical" || severity === "high") {
    return "error";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "note";
}

function buildRules(findings: Finding[]) {
  const byId = new Map<string, Finding>();
  findings.forEach((finding) => {
    if (!byId.has(finding.id)) {
      byId.set(finding.id, finding);
    }
  });

  return [...byId.values()].map((finding) => ({
    id: finding.id,
    shortDescription: {
      text: finding.title
    },
    fullDescription: {
      text: finding.description
    },
    help: {
      text: finding.recommendation
    }
  }));
}
