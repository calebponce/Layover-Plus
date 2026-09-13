const assert = require("node:assert/strict");
const test = require("node:test");

const { calculateFeasibility } = require("../../src/services/feasibilityService");

const BASE_INPUT = {
  outboundMinutes: 20,
  dwellMinutes: 60,
  inboundMinutes: 20,
  processingMinutes: 30,
  returnBufferMinutes: 120,
  maxTravelMinutesOneWay: 28,
  recommendedDwellMinutes: 60,
};

test("the feasibility boundary is inclusive and rejects a one-minute overrun", () => {
  const exactFit = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 250 });
  const oneMinuteShort = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 249 });

  assert.equal(exactFit.totalRequiredMinutes, 250);
  assert.equal(exactFit.slackMinutes, 0);
  assert.equal(exactFit.feasible, true);
  assert.equal(oneMinuteShort.slackMinutes, -1);
  assert.equal(oneMinuteShort.feasible, false);
});

test("risk labels reflect protected slack thresholds", () => {
  const high = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 250 });
  const medium = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 270 });
  const low = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 350 });

  assert.equal(high.riskLabel, "High");
  assert.equal(medium.riskLabel, "Medium");
  assert.equal(low.riskLabel, "Low");
  assert.ok(high.score <= medium.score);
  assert.ok(medium.score <= low.score);
});

test("scores are bounded and asymmetric travel applies a transparent penalty", () => {
  const symmetric = calculateFeasibility({ ...BASE_INPUT, layoverMinutes: 320 });
  const asymmetric = calculateFeasibility({
    ...BASE_INPUT,
    layoverMinutes: 320,
    outboundMinutes: 12,
    inboundMinutes: 48,
  });

  for (const result of [symmetric, asymmetric]) {
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(Number.isInteger(result.score));
    assert.ok(Number.isInteger(result.scoreBreakdown.slackComponent));
    assert.ok(Number.isInteger(result.scoreBreakdown.travelComponent));
  }

  assert.equal(symmetric.scoreBreakdown.variabilityPenalty, 0);
  assert.equal(asymmetric.scoreBreakdown.variabilityPenalty, 8);
  assert.ok(asymmetric.score < symmetric.score);
});
