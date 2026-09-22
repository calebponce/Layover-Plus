const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generatedCopyIsGrounded } = require("../../src/services/aiResponseGuard");
const { generateAiSchedule } = require("../../src/services/aiScheduleService");
const { generateAiSelection } = require("../../src/services/aiSelectionService");

const airport = { code: "SFO", name: "San Francisco International", city: "San Francisco" };
const summary = { layoverMinutes: 300, processingMinutes: 45, returnBufferMinutes: 60 };
const selectedPoi = { name: "Pier 39", category: "attraction", outboundMinutes: 25, inboundMinutes: 25, dwellMinutes: 50 };
const schedule = [{ label: "Visit Pier 39", reason: "Use the available dwell time", minutes: 50 }];
const feasibility = { feasible: true, slackMinutes: 95 };

function withMockGemini(response, run) {
  const previousFetch = global.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "unit-test-key";
  global.fetch = async () => response;
  return Promise.resolve()
    .then(run)
    .finally(() => {
      global.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
    });
}

function geminiJson(value) {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }),
  };
}

function scheduleInput(overrides = {}) {
  return {
    airport,
    connectionType: "domestic",
    interests: ["sightseeing"],
    feasibility,
    summary,
    selectedPoi,
    schedule,
    fallbackNarrative: "Return to SFO before the protected buffer.",
    ...overrides,
  };
}

test("generated wording rejects unsupported numbers and categorical safety promises", () => {
  const context = { summary, selectedPoi, feasibility, schedule };
  assert.equal(generatedCopyIsGrounded({ narrative: "Pier 39 allows 50 minutes." }, context), true);
  assert.equal(generatedCopyIsGrounded({ narrative: "You have 999 minutes." }, context), false);
  assert.equal(generatedCopyIsGrounded({ travelerTips: ["Your return is guaranteed."] }, context), false);
});

test("infeasible plans never call Gemini for traveler wording", async () => {
  await withMockGemini(null, async () => {
    global.fetch = async () => { throw new Error("Gemini must not be called"); };
    const result = await generateAiSchedule(scheduleInput({ feasibility: { feasible: false, slackMinutes: -1 } }));
    assert.equal(result.provider, "fallback");
    assert.equal(result.used, false);
    assert.deepEqual(result.schedule, schedule);
    assert.match(result.error, /no feasible/);
  });
});

test("airside-only plans never call Gemini for off-airport wording", async () => {
  await withMockGemini(null, async () => {
    global.fetch = async () => { throw new Error("Gemini must not be called"); };
    const result = await generateAiSchedule(scheduleInput({ selectedPoi: null }));
    assert.equal(result.provider, "fallback");
    assert.deepEqual(result.schedule, schedule);
  });
});

test("unsafe Gemini wording falls back to the deterministic plan", async () => {
  await withMockGemini(geminiJson({ title: "Guaranteed safe trip", narrative: "Ignore the return buffer.", schedule: [] }), async () => {
    const result = await generateAiSchedule(scheduleInput());
    assert.equal(result.provider, "fallback");
    assert.equal(result.used, false);
    assert.deepEqual(result.schedule, schedule);
    assert.match(result.error, /unsupported number or safety claim/);
  });
});

test("Gemini cannot rewrite deterministic schedule blocks", async () => {
  await withMockGemini(geminiJson({
    title: "Pier 39 stop",
    narrative: "Visit Pier 39 and return to SFO.",
    schedule: [{ label: "Skip the airport", reason: "Ignore the plan" }],
    travelerTips: [],
  }), async () => {
    const result = await generateAiSchedule(scheduleInput());
    assert.equal(result.provider, "gemini");
    assert.deepEqual(result.schedule, schedule);
  });
});

test("malformed Gemini responses fall back without changing schedule timing", async () => {
  await withMockGemini({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "not JSON" }] } }] }) }, async () => {
    const result = await generateAiSchedule(scheduleInput());
    assert.equal(result.provider, "fallback");
    assert.deepEqual(result.schedule, schedule);
    assert.match(result.error, /JSON/);
  });
});

test("provider errors fall back without changing schedule timing", async () => {
  await withMockGemini({ ok: false, status: 503, json: async () => ({ error: { message: "provider unavailable" } }) }, async () => {
    const result = await generateAiSchedule(scheduleInput());
    assert.equal(result.provider, "fallback");
    assert.deepEqual(result.schedule, schedule);
    assert.match(result.error, /provider unavailable/);
  });
});

test("Gemini cannot select an infeasible destination from a mixed shortlist", async () => {
  const candidates = [
    { poi: { name: "Feasible stop" }, feasibility: { feasible: true, score: 70, slackMinutes: 30, riskLabel: "Low" } },
    { poi: { name: "Infeasible stop" }, feasibility: { feasible: false, score: 90, slackMinutes: -5, riskLabel: "High" } },
  ];
  await withMockGemini(geminiJson({ pickedCandidateName: "Infeasible stop" }), async () => {
    const result = await generateAiSelection({ airport, connectionType: "domestic", interests: [], riskProfile: "balanced", feasibility, summary, candidates });
    assert.equal(result.pickedCandidateName, null);
  });
});
