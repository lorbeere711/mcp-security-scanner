# Ready-to-Open Issues

Copy these into GitHub issues to make the project easier to contribute to.

## Add Configurable Rule Suppressions

Labels: `enhancement`, `good first issue`

Allow users to suppress specific findings in a config file, for example:

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

Acceptance criteria:

- Suppressions work by rule id and target/location.
- Suppressed findings are still available in JSON output with `suppressed: true`.
- Text output hides suppressed findings by default.

## Improve SARIF Locations

Labels: `enhancement`, `help wanted`, `sarif`

Improve SARIF output so GitHub code scanning points to the most useful config path or package metadata location.

Acceptance criteria:

- SARIF includes stable rule ids.
- Findings include file URI and region when scanning local files.
- Tests cover JSON and YAML input.

## Add MCP Registry Scanner

Labels: `enhancement`, `help wanted`

Add support for scanning MCP server metadata from a registry or package list.

Acceptance criteria:

- User can pass a package list or registry export.
- Scanner reports aggregate risk counts.
- Output supports text and JSON.

## Add Domain Allowlist Detection

Labels: `enhancement`, `good first issue`, `security`

Network-capable MCP tools should be less risky when they define a clear domain allowlist.

Acceptance criteria:

- Detect whether network tools define domain allowlists.
- Downgrade severity when allowlists are present.
- Add tests for arbitrary URL access vs allowlisted access.

## Add Real-World MCP Fixtures

Labels: `documentation`, `good first issue`

Add sanitized fixtures based on real MCP server configs.

Acceptance criteria:

- Fixtures contain no real secrets.
- Each fixture has expected findings.
- Tests include at least one safe and one unsafe fixture.

## Publish "20 MCP Servers" Research Report

Labels: `research`, `help wanted`

Create a short markdown report summarizing common MCP security patterns found across real-world MCP servers.

Acceptance criteria:

- Include methodology.
- Include aggregate counts, not personal secrets or private configs.
- Link findings back to scanner rules.
