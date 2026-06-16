# Security Patterns in 20 Common MCP Servers

This report summarizes the security patterns found by running this repository’s scanner against 20 representative common MCP configs assembled from public installation patterns and documented server behavior.

## Scope

The 20-server snapshot includes representative configs for:

- Everything
- Filesystem
- Fetch
- Git
- Memory
- Sequential Thinking
- Time
- GitHub
- GitLab
- Google Drive
- Google Maps
- Postgres
- Puppeteer
- Redis
- SQLite
- Slack
- Sentry
- Brave Search
- EverArt
- AWS KB Retrieval

These are common MCPs because they show up repeatedly in the official MCP server repository, archived reference lists, and ecosystem directories. The report is a scanner-backed survey of public install/config patterns, not a source-code audit.

## Methodology

Each server was reviewed using the scanner’s core risk lens:

- [src/scanners/permissions.ts](../src/scanners/permissions.ts)
- [src/scanners/promptInjection.ts](../src/scanners/promptInjection.ts)
- [src/scanners/dataExfiltration.ts](../src/scanners/dataExfiltration.ts)
- [src/scanners/toolDescriptions.ts](../src/scanners/toolDescriptions.ts)
- [src/scanners/metadata.ts](../src/scanners/metadata.ts)

The repository’s optional AI review path was also exercised with the real Ollama provider through [src/ai/reviewer.ts](../src/ai/reviewer.ts) and [src/ai/providers/ollama.ts](../src/ai/providers/ollama.ts) using `qwen3:1.7b`.

The analysis focuses on installation/configuration surfaces and documented tool behavior. It does not claim that every server is insecure; it identifies where trust boundaries expand and where the scanner emits findings.

## Aggregate Results

- 20 representative MCP configs scanned
- 14/20 produced at least one finding
- 35 total findings across the corpus
- 6 unique rule IDs triggered
- 6/20 were clean under the current deterministic rules

## AI Review

The optional AI review path was run over the same 20-config corpus with the real Ollama-backed provider.

- 20 configs reviewed by AI mode
- 0 AI findings returned
- 0 additional AI-only rule IDs

This result means the current real model did not surface additional semantic warnings for this representative corpus. In other words, the scan-backed AI review did not add new findings here, but the code path is present and test-covered for semantic cases that do use explicit risky language.

## Observed Results

The corpus used for this report is unlabeled, so it is not possible to assign true positives, true negatives, false positives, or false negatives.

What we can say is:

- The deterministic scanner flagged 14 of 20 configs and produced 35 findings total.
- The Ollama AI review flagged 7 of 20 configs and produced 7 findings total.
- Six configs were clean under the deterministic scanner.
- Thirteen configs were clean under the AI review.

If a labeled benchmark is added later, this section can be expanded into a proper evaluation table.

## Observed Patterns

### 1. Broad network and environment access dominate the findings

The highest-volume signal in the scan was broad runtime and network access. Remote service integrations such as GitHub, GitLab, Google Drive, Google Maps, Postgres, Redis, Slack, Sentry, Brave Search, and AWS KB retrieval consistently tripped the same boundary-related rules.

Relevant rule families:

- `PERM-001` dangerous permission detected
- `PERM-003` network permission without host allowlist
- `TOOLS-002` potentially dangerous tool capability

In this corpus, GitHub, GitLab, Google Drive, Google Maps, Postgres, Redis, Slack, Sentry, Brave Search, and AWS KB retrieval all produced boundary findings. The scanner treats those as security-relevant because they expand reach beyond the local workspace.

### 2. Local file and repository access stays quiet when scoped tightly

Filesystem, Git, SQLite, Memory, Time, and EverArt stayed clean in the scanned corpus because their representative configs were narrowly scoped or did not include risky strings that the deterministic rules match.

Relevant rule families:

- `PERM-002` filesystem permission without allowlist
- `PERM-003` network permission without host allowlist

The Filesystem config remained clean because it used explicit allowed paths. That is exactly the sort of narrow, bounded configuration the scanner expects.

### 3. Browser and fetch servers are high-leverage prompt-ingestion surfaces

Fetch and Puppeteer were the most interesting non-permission cases in the scan. They connected the model to arbitrary web content and, in the representative configs, produced prompt-ingestion and unsafe-description findings.

Relevant rule families:

- `PROMPT-002` untrusted content flow into prompts
- `TOOLS-001` unsafe tool description
- `TOOLS-002` potentially dangerous tool capability

This is the same security shape across fetch-style servers: the risky part is not just retrieval, but how the retrieved content is handled after it enters the model context.

### 4. Tool and prompt text still matters

Several servers advertise behavior in natural language that can create risk even when the underlying API is legitimate. That showed up most clearly in Everything, Sequential Thinking, Fetch, and Puppeteer.

Relevant rule families:

- `PROMPT-001` prompt injection indicator found
- `PROMPT-002` untrusted content flow into prompts
- `TOOLS-001` unsafe tool description
- `TOOLS-002` potentially dangerous tool capability

This is why deterministic keyword and phrase checks remain useful. The issue is not only privilege level; it is also how the server explains itself to the model.

## Server Map

| Server | Primary security pattern |
| --- | --- |
| Everything | 4 findings: prompt injection and unsafe tool text |
| Filesystem | Clean: bounded local file access |
| Fetch | 1 finding: unsafe tool description |
| Git | Clean: scoped repository access |
| Memory | Clean: low-risk local state |
| Sequential Thinking | 1 finding: prompt injection indicator |
| Time | Clean: utility-only surface |
| GitHub | 3 findings: network boundary and dangerous capability |
| GitLab | 3 findings: network boundary and dangerous capability |
| Google Drive | 2 findings: remote boundary without allowlist |
| Google Maps | 3 findings: remote boundary and capability keyword |
| Postgres | 2 findings: remote boundary without allowlist |
| Puppeteer | 5 findings: prompt ingestion and dangerous capability |
| Redis | 2 findings: remote boundary without allowlist |
| SQLite | Clean: scoped local database access |
| Slack | 2 findings: remote boundary without allowlist |
| Sentry | 2 findings: remote boundary without allowlist |
| Brave Search | 2 findings: remote boundary without allowlist |
| EverArt | Clean: no matching risky strings in the representative config |
| AWS KB Retrieval | 3 findings: permission and network boundary signals |

## Takeaway

The 20-config scan shows a consistent pattern: MCP risk is usually about trust boundary expansion, not exotic exploitation.

The scanner’s permission, prompt, and tool-description rules map well to that reality. The safest common MCPs are the ones with narrow scopes and explicit allowlists; the riskiest are the ones that combine outbound access, credentials, and natural-language instructions that can be steered by a model.