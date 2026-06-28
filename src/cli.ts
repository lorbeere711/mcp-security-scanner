#!/usr/bin/env node

import { Command } from "commander";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import yaml from "js-yaml";
import {
  formatJsonReport,
  formatMarkdownReport,
  formatReport,
  formatSarifReport,
  type ReportFormat
} from "./reporter.js";
import { applySuppressions, scanMcpConfig } from "./index.js";
import {
  exitCodeForFindings,
  parseFailOnThreshold,
  type FailOnThreshold
} from "./failOn.js";
import {
  DEFAULT_AI_ENDPOINT,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_TIMEOUT_MS,
  runAiReview
} from "./ai/reviewer.js";
import type { AiProviderName, AiReviewOptions } from "./ai/types.js";

const program = new Command();
const require = createRequire(import.meta.url);

program
  .name("mcp-security-scanner")
  .description("The npm-audit for MCP servers")
  .version("0.2.0");

registerScanLikeCommand("scan", "Scan an MCP config file or server package");
registerScanLikeCommand("audit", "Audit MCP risk posture with explainable findings");

program.parse();

function registerScanLikeCommand(name: string, description: string): void {
  program
    .command(name)
    .description(description)
    .argument("[configPath]", "Path to MCP config (JSON or YAML)")
    .option("-s, --server <package>", "NPM package name of an MCP server")
    .option("-f, --format <format>", "Output format: text|json|sarif|markdown", "text")
    .option("-o, --output <file>", "Write report to file")
    .option(
      "--fail-on <severity>",
      "Fail with exit code 2 for findings at or above: critical|high|medium|low|none",
      parseFailOnThreshold,
      "high"
    )
    .option("--ai-review", "Run experimental local AI semantic review")
    .option("--ai-provider <provider>", "AI provider: ollama|mock", DEFAULT_AI_PROVIDER)
    .option("--ai-model <model>", "Local AI model name", DEFAULT_AI_MODEL)
    .option("--ai-endpoint <url>", "Local AI provider endpoint", DEFAULT_AI_ENDPOINT)
    .option("--ai-timeout-ms <ms>", "AI review timeout in milliseconds", String(DEFAULT_AI_TIMEOUT_MS))
    .action(
      async (
        configPath: string | undefined,
        options: {
          server?: string;
          format: string;
          output?: string;
          failOn: FailOnThreshold;
          aiReview?: boolean;
          aiProvider: string;
          aiModel: string;
          aiEndpoint: string;
          aiTimeoutMs: string;
        }
      ) => {
        try {
          const input = loadTarget(configPath, options.server);
          const result = scanMcpConfig(input.target, input.config);

          if (options.aiReview) {
            try {
              const findings = await runAiReview(
                {
                  target: input.target,
                  config: input.config
                },
                parseAiReviewOptions(options)
              );
              result.findings.push(...findings);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.error(`Warning: AI review failed: ${message}`);
            }
          }

          result.findings = applySuppressions(result.findings, input.config);

          const format = parseFormat(options.format);
          const output = renderByFormat(format, result);

          if (options.output) {
            const outPath = path.resolve(process.cwd(), options.output);
            fs.writeFileSync(outPath, output, "utf8");
            console.log(`Report written to ${options.output}`);
          } else {
            console.log(output);
          }

          process.exitCode = exitCodeForFindings(
            result.findings.filter((finding) => !finding.suppressed),
            options.failOn
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Scan failed: ${message}`);
          process.exitCode = 1;
        }
      }
    );
}

function parseAiReviewOptions(options: {
  aiProvider: string;
  aiModel: string;
  aiEndpoint: string;
  aiTimeoutMs: string;
}): AiReviewOptions {
  const timeoutMs = Number.parseInt(options.aiTimeoutMs, 10);

  return {
    provider: parseAiProvider(options.aiProvider),
    model: options.aiModel,
    endpoint: options.aiEndpoint,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_AI_TIMEOUT_MS
  };
}

function parseAiProvider(input: string): AiProviderName {
  if (input === "ollama" || input === "mock") {
    return input;
  }

  throw new Error(`Unsupported AI provider: ${input}. Use ollama or mock.`);
}

function parseConfig(filePath: string, raw: string): unknown {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".yaml" || ext === ".yml") {
    return yaml.load(raw);
  }

  return JSON.parse(raw) as unknown;
}

function loadTarget(
  configPath: string | undefined,
  serverPackage: string | undefined
): { target: string; config: unknown } {
  if (configPath && serverPackage) {
    throw new Error("Use either [configPath] or --server, not both.");
  }

  if (!configPath && !serverPackage) {
    throw new Error("Provide [configPath] or --server <package>.");
  }

  if (serverPackage) {
    return loadServerPackage(serverPackage);
  }

  const absolutePath = path.resolve(process.cwd(), configPath as string);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const config = parseConfig(absolutePath, raw);
  return { target: configPath as string, config };
}

function loadServerPackage(serverPackage: string): { target: string; config: unknown } {
  const packageJsonPath = require.resolve(`${serverPackage}/package.json`, {
    paths: [process.cwd()]
  });
  const packageDir = path.dirname(packageJsonPath);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as Record<
    string,
    unknown
  >;

  const embeddedConfig = loadEmbeddedConfig(packageDir);
  const readmePath = path.join(packageDir, "README.md");
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : undefined;

  return {
    target: `server:${serverPackage}`,
    config: {
      ...packageJson,
      ...embeddedConfig,
      readme
    }
  };
}

function loadEmbeddedConfig(packageDir: string): Record<string, unknown> {
  const candidates = [
    "mcp.json",
    "mcp.config.json",
    "server.json",
    "mcp.yaml",
    "mcp.yml"
  ];

  for (const fileName of candidates) {
    const fullPath = path.join(packageDir, fileName);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = parseConfig(fullPath, raw);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
      return {};
    }
  }

  return {};
}

function parseFormat(input: string): ReportFormat {
  if (input === "text" || input === "json" || input === "sarif" || input === "markdown") {
    return input;
  }

  throw new Error(`Unsupported format: ${input}. Use text, json, sarif, or markdown.`);
}

function renderByFormat(format: ReportFormat, result: ReturnType<typeof scanMcpConfig>): string {
  if (format === "json") {
    return formatJsonReport(result);
  }

  if (format === "sarif") {
    return formatSarifReport(result);
  }

  if (format === "markdown") {
    return formatMarkdownReport(result);
  }

  return formatReport(result);
}
