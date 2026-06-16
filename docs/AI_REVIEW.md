# Local AI Review

`mcp-security-scanner` includes an experimental, opt-in AI review mode for semantic risks that deterministic rules may miss.

Deterministic scanning remains the default and does not call a model:

```bash
mcp-security-scanner scan ./mcp.json
```

AI review must be requested explicitly:

```bash
mcp-security-scanner scan ./mcp.json --ai-review
```

## Runtime

The first supported runtime is local Ollama.

Default settings:

```bash
mcp-security-scanner scan ./mcp.json \
  --ai-review \
  --ai-provider ollama \
  --ai-model qwen3:1.7b \
  --ai-endpoint http://localhost:11434
```

Setup:

```bash
ollama pull qwen3:1.7b
ollama serve
```

For weaker machines or CI smoke tests, use:

```bash
ollama pull qwen3:0.6b
mcp-security-scanner scan ./mcp.json --ai-review --ai-model qwen3:0.6b
```

Local CPU inference can be slow. Increase `--ai-timeout-ms` if a model needs more time.

## What It Does

AI review asks a local model to flag review-worthy semantic risks such as:

- indirect data exfiltration
- hidden instruction-following behavior
- prompt injection
- external transmission of local context
- ambiguous tool descriptions that deserve human review

AI findings are marked with:

```json
{
  "source": "ai",
  "confidence": "medium",
  "evidence": ["share the report with the configured service endpoint"]
}
```

## Limits

AI review is not a proof that a server is safe or malicious.

It may produce false positives and false negatives. Findings should be treated as review prompts, not verdicts.

## CI

Normal CI should not download or run a model. Use deterministic scans, parser tests, prompt tests, and the mock provider.

An optional manual workflow can run a local-model smoke test with `qwen3:0.6b`.
