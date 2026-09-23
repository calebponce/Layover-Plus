const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

test("review CLI reports submitted counts and can require complete review", () => {
  const directory = mkdtempSync(join(tmpdir(), "layover-review-"));
  const file = join(directory, "pending.json");
  const cli = join(__dirname, "../../evals/review/cli.js");
  const dataset = {
    schemaVersion: 1,
    name: "Synthetic CLI contract example",
    cases: [{
      id: "pending_01",
      service: "schedule",
      scenario: "Illustrative input, not a model evaluation",
      input: { airport: { code: "SFO" } },
      servedOutput: { provider: "fallback", used: false },
      capture: {
        source: "manual-import",
        capturedAt: "2026-09-22T20:00:00Z",
        codeCommit: "97d0193",
        model: "example-only",
        latencyMs: 0,
      },
      review: { verdict: "unreviewed", categories: [] },
    }],
  };
  try {
    writeFileSync(file, JSON.stringify(dataset));
    const plain = spawnSync(process.execPath, [cli, file], { encoding: "utf8" });
    assert.equal(plain.status, 0, plain.stderr);
    assert.match(plain.stdout, /unreviewed=1/);
    assert.match(plain.stdout, /Review incomplete/);
    const gated = spawnSync(process.execPath, [cli, file, "--require-complete"], { encoding: "utf8" });
    assert.equal(gated.status, 2);
    const json = spawnSync(process.execPath, [cli, file, "--json"], { encoding: "utf8" });
    assert.equal(json.status, 0, json.stderr);
    assert.equal(JSON.parse(json.stdout).reviewComplete, false);
  } finally {
    unlinkSync(file);
    rmdirSync(directory);
  }
});
