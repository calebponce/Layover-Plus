# Two-minute engineering walkthrough

This is a recording script, **not a recorded video or a live-model evaluation**. Use the [public zero-key demo](https://calebponce.github.io/Layover-Plus/) and this repository at the same commit when recording. The Pages demo uses representative route data and the browser-side deterministic planner; it does not call Gemini. The synthetic failure example below runs through the real server-side selection/schedule service with a mocked provider response.

## Before recording

1. Open the public demo with SFO, a 5-hour domestic connection, and Balanced risk tolerance. Open this repository to [`evals/v1/fixtures.json`](../evals/v1/fixtures.json) at `schedule-unsupported-time` and [`src/services/aiScheduleService.js`](../src/services/aiScheduleService.js).
2. In a terminal at the repository root, have `npm run eval:offline` ready. Do not show an API key, `.env`, personal itinerary, or provider response from a real traveler.
3. Confirm the demo and tests still behave as described. If a label or behavior changes, revise the narration rather than recording an inaccurate claim.

| Time | Show | Say (adapt to your own voice) |
| --- | --- | --- |
| 0:00–0:20 | Demo planner at the default SFO case; point to processing, round-trip travel, experience time, and return buffer. | “LayoverPlus asks whether an off-airport stop fits inside a connection. I worked on the AI and backend in a three-person university team. This public demo is representative data, not live flight advice.” |
| 0:20–0:43 | Move the **Layover duration** slider to 2 hours. Show `STAY AIRSIDE` and the updated timeline. | “The decision comes from explicit timing constraints. At two hours, no stop fits after processing and the protected return buffer, so the planner stays airside. A model cannot turn this into a go decision.” |
| 0:43–1:03 | Return the slider to 5 hours. Select another ranked stop and point to the decision and timeline changing together. | “When I choose a destination, the score, feasibility, and timeline recalculate as one state change. A browser test also covers destination synchronization in the full application.” |
| 1:03–1:34 | Show `schedule-unsupported-time` in the fixture file, then the service guard where `generatedCopyIsGrounded` rejects unsupported wording and returns fallback. | “Here is a **synthetic** model response claiming 999 minutes at a stop. The service checks generated copy against structured timing; this example is rejected and deterministic wording is returned. The model does not own the schedule. These checks are limited safeguards, not proof that every generated statement is factual.” |
| 1:34–1:52 | Run `npm run eval:offline`; point to the `schedule-unsupported-time` case and the overall passing result. | “This offline suite exercises 17 mocked-provider boundary cases, including malformed responses, infeasible picks, and timeouts. Passing means these contracts hold for the fixtures—not that we measured real Gemini accuracy.” |
| 1:52–2:00 | Return to the demo or README. | “Next I’m collecting human-reviewed real outputs under a pre-registered protocol. That result is pending, and I won’t claim it until it exists.” |

## Evidence and claim boundaries

- The zero-key Pages demo is an interactive case study; the full React/Express application and optional provider path are in this repository.
- The `schedule-unsupported-time` fixture is **synthetic**. It is appropriate to demonstrate a guardrail, not to report a model failure rate.
- `GO`, `STAY AIRSIDE`, risk labels, and buffers in this prototype rely on modeled assumptions. They are not traveler-safety guarantees or current airport/traffic data.
- Caleb's documented original ownership is AI and backend; the project began as a three-person team effort. Avoid narrating the full UI or planning system as solo work.
- A finished recording should include the repo link, demo link, commit SHA, and recording date in its description. Add a video link to the README only after checking the uploaded recording and its permissions.
