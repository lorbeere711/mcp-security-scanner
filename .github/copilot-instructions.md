# Copilot Instructions

`mcp-security-scanner` is a deterministic security scanner for MCP server configs and metadata.

Project goals:

- Keep default scanning deterministic and explainable.
- Prefer stable rule IDs and actionable remediation text.
- Avoid vague safe/unsafe verdicts.
- Treat semantic or LLM-assisted review as optional future work, not default CI behavior.
- Document known limitations, especially false positives and false negatives.

Development guidelines:

- Add tests for every new scanner rule.
- Keep fixtures sanitized and free of real secrets.
- Preserve JSON and SARIF output stability.
- Run `npm run lint`, `npm run test`, `npm run typecheck`, and `npm run build` before merging.
