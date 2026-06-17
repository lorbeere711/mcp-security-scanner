#!/usr/bin/env node

import fs from "node:fs";

const marker = "<!-- mcp-security-scanner-pr-comment -->";
const severityOrder = ["critical", "high", "medium", "low"];

export function formatPrComment(report) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const counts = countBySeverity(findings);
  const total = findings.length;

  const lines = [
    marker,
    "## MCP Security Scanner",
    "",
    `Target: \`${report.target ?? "unknown"}\``,
    `Findings: **${total}**`,
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    ...severityOrder.map((severity) => `| ${label(severity)} | ${counts[severity]} |`),
    ""
  ];

  if (total === 0) {
    lines.push("No findings detected.");
    return lines.join("\n");
  }

  lines.push("### Top Findings", "");

  for (const finding of sortFindings(findings).slice(0, 10)) {
    lines.push(
      `- **${label(finding.severity)}** \`${finding.id ?? "UNKNOWN"}\`: ${sanitizeInline(
        finding.title ?? "Untitled finding"
      )}`
    );

    if (finding.path) {
      lines.push(`  - Path: \`${sanitizeInline(finding.path)}\``);
    }

    if (finding.recommendation) {
      lines.push(`  - Recommendation: ${sanitizeInline(finding.recommendation)}`);
    }
  }

  if (total > 10) {
    lines.push("", `Showing 10 of ${total} findings. Check the workflow logs for the full report.`);
  }

  return lines.join("\n");
}

function countBySeverity(findings) {
  const counts = Object.fromEntries(severityOrder.map((severity) => [severity, 0]));

  for (const finding of findings) {
    if (finding?.severity in counts) {
      counts[finding.severity] += 1;
    }
  }

  return counts;
}

function sortFindings(findings) {
  const rank = Object.fromEntries(severityOrder.map((severity, index) => [severity, index]));

  return [...findings].sort((a, b) => {
    const severityDiff = (rank[a?.severity] ?? 99) - (rank[b?.severity] ?? 99);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
  });
}

function label(severity) {
  return String(severity ?? "unknown").toUpperCase();
}

function sanitizeInline(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reportPath, outputPath] = process.argv.slice(2);

  if (!reportPath || !outputPath) {
    console.error("Usage: node scripts/format-pr-comment.mjs <report.json> <comment.md>");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  fs.writeFileSync(outputPath, `${formatPrComment(report)}\n`, "utf8");
}
