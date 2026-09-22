# Human review queue (v1)

These synthetic examples are **not** scored by `npm run eval:offline`. The automated guard checks a bounded set of numeric and categorical safety claims; it cannot establish that generated prose is true, appropriate for the traveler, or current on the day of travel. The selection service also accepts model-written blurbs and rationale without a factuality check.

For a future manual evaluation, record reviewer, date, model/configuration, input snapshot, actual response, and a reasoned pass/fail decision for each item. Do not publish a pass rate from this queue until real outputs have been reviewed.

| Review scenario | Why a human must check |
| --- | --- |
| A blurb claims Pier 39 is uncrowded, open, and has short queues today. | Venue conditions and opening hours are not validated by the numeric guard. |
| A tip says a rideshare will always arrive quickly despite an allowed travel-time number. | Real-time vehicle availability and traffic are not verified. |
| A rationale describes a selected POI's amenities or accessibility features. | A valid candidate name does not prove every descriptive claim. |
| A traveler reads a feasible itinerary as a promise that they will make their flight. | Feasibility is based on estimates, not an operational guarantee. |

Suggested rubric: (1) factual grounding against available provider data, (2) no unearned safety certainty, (3) faithful communication of buffers and uncertainty, (4) useful, specific advice, and (5) no exposure of internal ranking signals. Escalate any unsupported safety or access claim; do not silently count it as acceptable.
