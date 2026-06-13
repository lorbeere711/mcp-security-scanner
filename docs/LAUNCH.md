# Launch Kit

Use this as the public launch plan for `mcp-security-scanner`.

## One-Line Pitch

Before installing an MCP server, run one command and see what it can actually do.

## Short Description

`mcp-security-scanner` is a lightweight CLI and GitHub Action that scans MCP servers for dangerous tools, broad permissions, prompt-injection indicators, data-exfiltration paths, and weak metadata before you connect them to Claude, Codex, Cursor, or other AI agents.

## GitHub Topics

Set these in the repository settings:

```text
mcp
model-context-protocol
security
ai-agents
claude
anthropic
prompt-injection
developer-tools
static-analysis
sarif
```

## Hacker News

Title:

```text
Show HN: MCP Security Scanner - npm-audit for MCP servers
```

Body:

```text
I built a lightweight scanner for MCP servers before connecting them to AI agents.

It checks for broad filesystem access, shell execution tools, prompt-injection indicators, risky network/data-exfiltration paths, weak metadata, and produces JSON/SARIF output for CI.

The goal is simple: before installing an MCP server, run one command and see what it can actually do.

Repo: https://github.com/lorbeere711/mcp-security-scanner

Feedback from MCP builders, security engineers, and agent-tooling people would be very welcome.
```

## X / LinkedIn

```text
I built mcp-security-scanner: a lightweight CLI to scan MCP servers before connecting them to AI agents.

It checks for:
- broad filesystem access
- shell execution tools
- prompt-injection indicators
- risky network/data-exfiltration paths
- missing metadata
- SARIF/JSON output for CI

Repo: https://github.com/lorbeere711/mcp-security-scanner

Feedback from MCP builders welcome.
```

## Reddit

Suggested communities:

- `r/ClaudeAI`
- `r/LocalLLaMA`
- `r/opensource`
- `r/programming`
- `r/cybersecurity`

Post:

```text
I built an open-source MCP security scanner.

The idea: before you connect a new MCP server to Claude, Codex, Cursor, or another AI agent, scan it for risky capabilities.

Current checks include broad filesystem access, shell execution tools, prompt-injection indicators, network/data-exfiltration paths, metadata issues, and JSON/SARIF output for CI.

Repo: https://github.com/lorbeere711/mcp-security-scanner

I would love feedback from people building or installing MCP servers.
```

## First Content Campaign

Publish a short report:

```text
I scanned 20 MCP servers. Here are the security patterns I found.
```

Recommended structure:

1. What MCP servers commonly expose
2. The most common risky capabilities
3. Examples of safe patterns
4. What scanner rules caught
5. What rules should be added next

This gives people a reason to share the project beyond the project existing.
