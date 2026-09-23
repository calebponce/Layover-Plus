const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeReviewDataset } = require("../../evals/review/report");

function sampleCase(id, verdict, categories = [], notes = "Reviewed the structured input and served response.") {
  return {
    id,
    service: "schedule",
    scenario: "Synthetic SFO connection for rubric testing",
    input: { airport: { code: "SFO" }, summary: { returnBufferMinutes: 60 } },
    servedOutput: { provider: "gemini", used: true, narrative: "Example output for schema tests." },
    capture: {
      source: "manual-import",
      capturedAt: "2026-09-22T20:00:00Z",
      codeCommit: "97d0193",
      model: "recorded-model-name",
      latencyMs: 123,
    },
    review: {
      verdict,
      categories,
      notes,
      ...(verdict === "unreviewed" ? {} : { reviewer: "Example reviewer", reviewedAt: "2026-09-22T21:00:00Z" }),
    },
  };
}

test("summarizes human labels without inventing an accuracy rate", () => {
  const report = summarizeReviewDataset({
    schemaVersion: 1,
    name: "Synthetic report-format test",
    cases: [
      sampleCase("reviewed_pass", "pass"),
      sampleCase("reviewed_fail", "fail", ["unsupported_fact", "safety_overclaim"], "The wording promises a safe return."),
      sampleCase("pending", "unreviewed"),
    ],
  });
  assert.equal(report.total, 3);
  assert.deepEqual(report.verdicts, { pass: 1, fail: 1, needs_evidence: 0, unreviewed: 1 });
  assert.equal(report.categories.safety_overclaim, 1);
  assert.equal(report.reviewComplete, false);
  assert.equal(Object.hasOwn(report, "accuracy"), false);
});

test("rejects undocumented failure judgments and duplicate cases", () => {
  const failure = sampleCase("failure", "fail", []);
  assert.throws(() => summarizeReviewDataset({ schemaVersion: 1, name: "test", cases: [failure] }), /need a category/);
  const repeated = sampleCase("same", "pass");
  assert.throws(() => summarizeReviewDataset({ schemaVersion: 1, name: "test", cases: [repeated, repeated] }), /Duplicate case ID/);
});

test("requires provenance and explanation when evidence is insufficient", () => {
  const pending = sampleCase("pending", "needs_evidence", [], "");
  assert.throws(() => summarizeReviewDataset({ schemaVersion: 1, name: "test", cases: [pending] }), /reasoned notes/);
  pending.review.notes = "Opening hours need a source checked by the reviewer.";
  pending.capture.codeCommit = "not-a-commit";
  assert.throws(() => summarizeReviewDataset({ schemaVersion: 1, name: "test", cases: [pending] }), /capture needs/);
});
