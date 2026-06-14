import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scanMcpConfig } from "../src/index.js";

interface FixtureExpectation {
  id: string;
  path: string;
  classification: "safe" | "unsafe";
  expectedFindingIds: string[];
  mustMissFindingIds: string[];
  notes: string;
}

interface FixtureManifest {
  schemaVersion: string;
  fixtures: FixtureExpectation[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesRoot = path.resolve(__dirname, "../examples/fixtures");
const manifestPath = path.join(fixturesRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as FixtureManifest;

describe("adversarial fixture benchmark", () => {
  it("has a non-empty fixture manifest", () => {
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(manifest.fixtures.length).toBeGreaterThan(0);
  });

  for (const fixture of manifest.fixtures) {
    it(`enforces expected behavior for ${fixture.id}`, () => {
      const fixturePath = path.join(fixturesRoot, fixture.path);
      const raw = fs.readFileSync(fixturePath, "utf8");
      const config = JSON.parse(raw) as unknown;
      const result = scanMcpConfig(fixture.path, config);
      const findingIds = new Set(result.findings.map((finding) => finding.id));

      for (const expectedId of fixture.expectedFindingIds) {
        expect(
          findingIds.has(expectedId),
          `${fixture.id} should contain finding ${expectedId}`
        ).toBe(true);
      }

      for (const mustMissId of fixture.mustMissFindingIds) {
        expect(
          findingIds.has(mustMissId),
          `${fixture.id} should keep known miss ${mustMissId} explicit`
        ).toBe(false);
      }

      if (fixture.classification === "safe" && fixture.expectedFindingIds.length === 0) {
        expect(result.findings.length).toBe(0);
      }
    });
  }
});
