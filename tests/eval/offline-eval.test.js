const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { generateAiSchedule } = require("../../src/services/aiScheduleService");
const { generateAiSelection } = require("../../src/services/aiSelectionService");

const fixturePath = join(__dirname, "../../evals/v1/fixtures.json");
const fixtureSet = JSON.parse(readFileSync(fixturePath, "utf8"));

function mockResponse(spec) {
  if (spec.kind === "json" || spec.kind === "raw") {
    const text = spec.kind === "json" ? JSON.stringify(spec.body) : spec.body;
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    };
  }
  if (spec.kind === "httpError") {
    return {
      ok: false,
      status: spec.status,
      json: async () => ({ error: { message: spec.message } }),
    };
  }
  throw new Error(`Unknown response kind: ${spec.kind}`);
}

function rejectOnAbort(signal) {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

async function evaluate(fixture) {
  const input = { ...structuredClone(fixtureSet.context), ...structuredClone(fixture.inputOverrides || {}) };
  const previousFetch = global.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  const previousTimeout = process.env.GEMINI_REQUEST_TIMEOUT_MS;
  let fetchCalls = 0;
  process.env.GEMINI_API_KEY = "offline-evaluation-fixture-key";
  if (["hang", "bodyHang"].includes(fixture.response.kind)) {
    process.env.GEMINI_REQUEST_TIMEOUT_MS = "100";
  }
  global.fetch = async (_url, options) => {
    fetchCalls += 1;
    if (fixture.response.kind === "mustNotCall") {
      throw new Error("Provider must not be called for this fixture");
    }
    if (fixture.response.kind === "hang") return rejectOnAbort(options.signal);
    if (fixture.response.kind === "bodyHang") {
      return { ok: true, json: () => rejectOnAbort(options.signal) };
    }
    return mockResponse(fixture.response);
  };

  try {
    const result = fixture.service === "schedule"
      ? await generateAiSchedule(input)
      : await generateAiSelection(input);
    const expectedCalls = fixture.response.kind === "mustNotCall" ? 0 : 1;
    assert.equal(fetchCalls, expectedCalls, "unexpected provider-call count");
    assert.equal(result.provider, fixture.expect.provider);
    assert.equal(result.used, fixture.expect.used);
    if (fixture.expect.scheduleUnchanged) {
      assert.deepEqual(result.schedule, input.schedule, "model output changed deterministic schedule");
    }
    if (Object.hasOwn(fixture.expect, "pickedCandidateName")) {
      assert.equal(result.pickedCandidateName, fixture.expect.pickedCandidateName);
    }
    if (fixture.expect.errorIncludes === null) {
      assert.equal(result.error, null);
    } else {
      assert.match(result.error || "", new RegExp(fixture.expect.errorIncludes, "i"));
    }
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousTimeout === undefined) delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
    else process.env.GEMINI_REQUEST_TIMEOUT_MS = previousTimeout;
  }
}

test("offline Gemini boundary fixtures v1", async (t) => {
  assert.equal(fixtureSet.schemaVersion, 1);
  assert.ok(Array.isArray(fixtureSet.cases) && fixtureSet.cases.length > 0);
  const ids = fixtureSet.cases.map((fixture) => fixture.id);
  assert.equal(new Set(ids).size, ids.length, "fixture IDs must be unique");
  for (const fixture of fixtureSet.cases) {
    assert.ok(["schedule", "selection"].includes(fixture.service), fixture.id);
    await t.test(fixture.id, () => evaluate(fixture));
  }
});
