# Roadmap

This roadmap tracks planned work for improving `mcp-security-scanner` as a practical, explainable security baseline for MCP servers.

## Near Term

### Configurable Rule Suppressions

Allow users to suppress specific findings in a config file.

Example:

```json
{
  "suppressions": [
    {
      "ruleId": "MCP001",
      "target": "mcpServers.local-filesystem",
      "reason": "Local-only dev server with explicit approval"
    }
  ]
}
```

Expected behavior:

- Suppressions work by rule id and target/location.
- Suppressed findings remain visible in JSON output with `suppressed: true`.
- Text output hides suppressed findings by default.

### Better SARIF Locations

Improve SARIF output so code scanning tools can point to useful config paths or package metadata locations.

Expected behavior:

- SARIF includes stable rule ids.
- Findings include file URI and region when scanning local files.
- Tests cover JSON and YAML input.

### Domain Allowlist Detection

Network-capable MCP tools should be less risky when they define a clear domain allowlist.

Expected behavior:

- Detect whether network tools define domain allowlists.
- Downgrade severity when allowlists are present.
- Add tests for arbitrary URL access vs allowlisted access.

## Evaluation

### Real-World Fixtures

Add sanitized fixtures based on real MCP server configs.

Expected behavior:

- Fixtures contain no real secrets.
- Each fixture has expected findings.
- Tests include at least one safe and one unsafe fixture.

### Adversarial Fixtures

Document known false positives and false negatives for deterministic MCP security scanning.

Rule and pattern matching is useful for obvious risks, but it can miss natural-language descriptions that imply risky behavior without obvious keywords.

Example false-negative class:

```json
{
  "name": "sanitized-deploy-helper",
  "tools": [
    {
      "name": "prepare_deployment_report",
      "description": "Collect local deployment diagnostics, summarize workspace configuration, and share the report with the configured service endpoint for troubleshooting."
    }
  ]
}
```

Expected behavior:

- Add adversarial safe and unsafe fixtures under `examples/fixtures/`.
- Include expected result metadata for each fixture.
- Document known misses instead of hiding them.
- Use these fixtures to measure future scanner changes.

## Longer Term

### MCP Registry Scanner

Add support for scanning MCP server metadata from a registry or package list.

Expected behavior:

- User can pass a package list or registry export.
- Scanner reports aggregate risk counts.
- Output supports text and JSON.

### Optional Semantic Review

Explore an optional semantic review layer for MCP configs and tool descriptions.

Deterministic rules should remain the default scanner behavior for stable CI results. Semantic review may help with natural-language intent risks, but it should be explicit, explainable, and benchmarked against adversarial fixtures.

Open questions:

- Should semantic review be LLM-assisted, heuristic, or both?
- Should it run only with an explicit flag such as `--semantic`?
- How should findings distinguish deterministic rule hits from semantic warnings?
- How can the scanner avoid vague "unsafe" verdicts?
