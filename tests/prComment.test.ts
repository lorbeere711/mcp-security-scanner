import { describe, expect, it } from "vitest";
import { formatPrComment } from "../scripts/format-pr-comment.mjs";

describe("formatPrComment", () => {
  it("formats a deduplicated PR comment summary with severity counts", () => {
    const body = formatPrComment({
      target: "examples/insecure.json",
      findings: [
        {
          id: "PERM-001",
          severity: "high",
          title: "Dangerous permission detected",
          recommendation: "Remove broad permissions.",
          path: "permissions"
        },
        {
          id: "EXFIL-001",
          severity: "critical",
          title: "Potential sensitive data exfiltration path",
          recommendation: "Gate outbound requests."
        }
      ]
    });

    expect(body).toContain("<!-- mcp-security-scanner-pr-comment -->");
    expect(body).toContain("Target: `examples/insecure.json`");
    expect(body).toContain("Findings: **2**");
    expect(body).toContain("| CRITICAL | 1 |");
    expect(body).toContain("| HIGH | 1 |");
    expect(body).toContain("**CRITICAL** `EXFIL-001`");
    expect(body).toContain("**HIGH** `PERM-001`");
  });

  it("formats a clean report", () => {
    const body = formatPrComment({
      target: "safe.json",
      findings: []
    });

    expect(body).toContain("Findings: **0**");
    expect(body).toContain("No findings detected.");
  });
});
