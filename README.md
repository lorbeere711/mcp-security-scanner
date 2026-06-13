# MCP Security Scanner

The npm-audit for MCP servers.

Scan MCP servers for dangerous tools, prompt-injection risks, excessive permissions, and unsafe agent capabilities before you connect them to Claude, Codex, Cursor, or other AI agents.

## Positioning

`mcp-security-scanner` focuses on fast, explainable, install-time risk checks for MCP servers.

This project is intentionally different from runtime sandboxing and broad research efforts:

- It is a lightweight CLI you can run in CI and pre-install workflows.
- It reports concrete, explainable findings with actionable remediation text.
- It produces machine-readable output (`json`, `sarif`) for security tooling.

## What It Scans (MVP 0.1)

- Dangerous permissions
- Prompt injection indicators
- Unsafe tool descriptions
- Potential data exfiltration paths
- Missing metadata signals (name/license)
- Broad filesystem/network permissions without allowlists
- Risk score (`0-100`) with severity-oriented report output

## Why

MCP adoption is growing quickly, while security checks are often ad hoc. This scanner provides a practical baseline for CI pipelines and local hardening reviews.

## Install

Use with npx:

```bash
npx mcp-security-scanner scan ./mcp-server-config.json
```

Or install locally for development:

```bash
npm install
npm run build
```

## Usage

```bash
mcp-security-scanner scan ./mcp-server-config.json
mcp-security-scanner scan ./mcp-server-config.yaml
mcp-security-scanner scan --server @modelcontextprotocol/server-filesystem
mcp-security-scanner audit ./mcp-server-config.json --format sarif
mcp-security-scanner scan ./mcp-server-config.json --format json
mcp-security-scanner scan ./mcp-server-config.json --format sarif --output report.sarif
```

Formats:

- `text`: human-readable report (default)
- `json`: machine-readable full scan result
- `sarif`: SARIF 2.1.0 report for code scanning tools

Example output:

```text
HIGH  filesystem tool exposes /Users without allowlist
MED   tool "fetch_url" can retrieve arbitrary external content
LOW   missing server metadata / license
```

Exit codes:

- `0`: no high or critical findings
- `1`: scanner/runtime error
- `2`: high or critical findings detected

## Development

```bash
npm run dev -- scan ./examples/insecure.json
npm run lint
npm run test
npm run build
npm run pack:check
```

## GitHub Action

```yaml
- uses: lorbeere711/mcp-security-scanner@v0
	with:
		target: ./mcp.json
		format: sarif
```

Or scan a server package:

```yaml
- uses: lorbeere711/mcp-security-scanner@v0
	with:
		server: @modelcontextprotocol/server-filesystem
		format: sarif
```

## Publish Preparation

```bash
npm run prepublishOnly
npm run pack:check
```

If checks pass, publish from a trusted environment with npm credentials configured.

## Contribution Ideas

- good first issue: add detector for filesystem over-permission
- good first issue: add JSON output enhancements and stable schema docs
- help wanted: improve SARIF mapping for GitHub code scanning UX
- help wanted: add MCP server registry scanner support
- research: map known MCP vulnerabilities to detector rules

## Roadmap

- Rule config and suppressions
- CI integration helpers
- Expanded MCP schema awareness

## License

MIT
