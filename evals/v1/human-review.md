# Human review queue (v1)

These synthetic examples are **not** scored by `npm run eval:offline`. The automated guard checks a bounded set of numeric and categorical safety claims; it cannot establish that generated prose is true, appropriate for the traveler, or current on the day of travel. The selection service also accepts model-written blurbs and rationale without a factuality check.

For a future manual evaluation, record reviewer, date, model/configuration, input snapshot, actual response, and a reasoned pass/fail decision for each item. Do not publish a pass rate from this queue until real outputs have been reviewed.

The [local review-report format](../review/README.md) now records these fields and counts explicit verdicts. It does not contain or collect real model responses by itself.

| Review scenario | Why a human must check |
| --- | --- |
| A blurb claims Pier 39 is uncrowded, open, and has short queues today. | Venue conditions and opening hours are not validated by the numeric guard. |
| A tip says a rideshare will always arrive quickly despite an allowed travel-time number. | Real-time vehicle availability and traffic are not verified. |
| A rationale describes a selected POI's amenities or accessibility features. | A valid candidate name does not prove every descriptive claim. |
| A traveler reads a feasible itinerary as a promise that they will make their flight. | Feasibility is based on estimates, not an operational guarantee. |

Suggested rubric: (1) factual grounding against available provider data, (2) no unearned safety certainty, (3) faithful communication of buffers and uncertainty, (4) useful, specific advice, and (5) no exposure of internal ranking signals. Escalate any unsupported safety or access claim; do not silently count it as acceptable.

For each captured case, read the full structured input and the **served** application output. Mark `pass` only when each rubric item is supported by the evidence available to the reviewer, and write down why. Mark `fail` with a category and the exact problematic claim when evidence contradicts the output. Mark `needs_evidence` when a claim cannot be checked with the supplied input or a current authoritative source; do not convert missing evidence into a pass. A reviewer should not infer that a mathematically feasible route is safe in real-world conditions.
