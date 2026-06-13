# MCP Security Scanner

CLI tool to scan MCP server configurations for common security risks:

- Dangerous permissions
- Prompt injection indicators
- Unsafe tool descriptions
- Potential data exfiltration paths

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
mcp-security-scanner scan ./mcp-server-config.json --format json
mcp-security-scanner scan ./mcp-server-config.json --format sarif --output report.sarif
```

Formats:

- `text`: human-readable report (default)
- `json`: machine-readable full scan result
- `sarif`: SARIF 2.1.0 report for code scanning tools

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

## Publish Preparation

```bash
npm run prepublishOnly
npm run pack:check
```

If checks pass, publish from a trusted environment with npm credentials configured.

## Roadmap

- Rule config and suppressions
- CI integration helpers
- Expanded MCP schema awareness

## License

MIT
