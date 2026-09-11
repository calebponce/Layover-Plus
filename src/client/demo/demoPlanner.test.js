import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_AIRPORTS, buildDemoPlan } from "./demoPlanner.js";

test("default SFO plan is feasible and protects the declared return buffer", () => {
  const plan = buildDemoPlan();
  assert.equal(plan.decision, "GO");
  assert.equal(plan.selected.feasible, true);
  assert.ok(plan.selected.slackMinutes >= 0);
  assert.ok(
    plan.selected.totalRequiredMinutes <= plan.layoverMinutes,
    "selected plan must fit inside the layover"
  );
});

test("short layovers produce a deterministic stay-airside decision", () => {
  for (const airportCode of Object.keys(DEMO_AIRPORTS)) {
    const first = buildDemoPlan({ airportCode, layoverHours: 2 });
    const second = buildDemoPlan({ airportCode, layoverHours: 2 });
    assert.equal(first.decision, "STAY AIRSIDE");
    assert.deepEqual(first, second);
  }
});

test("every candidate score and schedule stays within expected bounds", () => {
  for (const airportCode of Object.keys(DEMO_AIRPORTS)) {
    for (const connectionType of ["domestic", "international"]) {
      for (const riskProfile of ["conservative", "balanced", "explorer"]) {
        const plan = buildDemoPlan({
          airportCode,
          layoverHours: 6,
          connectionType,
          riskProfile,
        });
        assert.ok(plan.timeline.length >= 3);
        for (const candidate of plan.candidates) {
          assert.ok(candidate.score >= 0 && candidate.score <= 100);
          if (candidate.feasible) {
            assert.ok(candidate.totalRequiredMinutes <= plan.layoverMinutes);
          }
        }
      }
    }
  }
});
