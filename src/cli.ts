#!/usr/bin/env node

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import {
  formatJsonReport,
  formatReport,
  formatSarifReport,
  type ReportFormat
} from "./reporter.js";
import { scanMcpConfig } from "./index.js";

const program = new Command();

program
  .name("mcp-security-scanner")
  .description("Scan MCP server configs for security risks")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan an MCP server configuration file")
  .argument("<configPath>", "Path to MCP config (JSON or YAML)")
  .option("-f, --format <format>", "Output format: text|json|sarif", "text")
  .option("-o, --output <file>", "Write report to file")
  .action(
    (
      configPath: string,
      options: {
        format: string;
        output?: string;
      }
    ) => {
    try {
      const absolutePath = path.resolve(process.cwd(), configPath);
      const raw = fs.readFileSync(absolutePath, "utf8");
      const config = parseConfig(absolutePath, raw);
      const result = scanMcpConfig(configPath, config);
      const format = parseFormat(options.format);
      const output = renderByFormat(format, result);

      if (options.output) {
        const outPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outPath, output, "utf8");
        console.log(`Report written to ${options.output}`);
      } else {
        console.log(output);
      }

      const hasHighOrCritical = result.findings.some((f) =>
        ["high", "critical"].includes(f.severity)
      );
      process.exitCode = hasHighOrCritical ? 2 : 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Scan failed: ${message}`);
      process.exitCode = 1;
    }
    }
  );

program.parse();

function parseConfig(filePath: string, raw: string): unknown {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".yaml" || ext === ".yml") {
    return yaml.load(raw);
  }

  return JSON.parse(raw) as unknown;
}

function parseFormat(input: string): ReportFormat {
  if (input === "text" || input === "json" || input === "sarif") {
    return input;
  }

  throw new Error(`Unsupported format: ${input}. Use text, json, or sarif.`);
}

function renderByFormat(format: ReportFormat, result: ReturnType<typeof scanMcpConfig>): string {
  if (format === "json") {
    return formatJsonReport(result);
  }

  if (format === "sarif") {
    return formatSarifReport(result);
  }

  return formatReport(result);
}
