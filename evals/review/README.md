# Human-reviewed model-output reports

This is an **opt-in local reporting format**, not a completed evaluation. No Gemini calls are made by `eval:review`. The tool only validates a JSON file that a person supplies and counts its explicit human verdicts. The repository does not contain a dataset of real model outputs or an accuracy estimate.

Place any captured outputs under `evals/review/local/`; that directory is gitignored. Remove traveler-identifying information, credentials, and provider secrets before sharing anything. Publish only a reviewed, intentionally redacted dataset or aggregate report after checking the source and consent for each item.

```bash
npm run eval:review -- evals/review/local/my-review.json
npm run eval:review -- evals/review/local/my-review.json --json
npm run eval:review -- evals/review/local/my-review.json --require-complete
```

The last form exits nonzero if any case remains `unreviewed` or `needs_evidence`. No pass percentage is generated: counts from a small, hand-selected set would not estimate general model quality.

The file must have `schemaVersion: 1`, a dataset `name`, and 1–100 `cases`. Each case records a stable ID, `schedule` or `selection` service, scenario, structured `input`, the application `servedOutput`, capture metadata, and review. For example, the following is **schema illustration only**, not a real Gemini result:

```json
{
  "schemaVersion": 1,
  "name": "Pending local review",
  "cases": [{
    "id": "example_01",
    "service": "schedule",
    "scenario": "Synthetic airport connection; no traveler data",
    "input": { "airport": { "code": "SFO" }, "summary": { "returnBufferMinutes": 60 } },
    "servedOutput": { "provider": "fallback", "used": false, "narrative": "Illustrative placeholder" },
    "capture": {
      "source": "manual-import",
      "capturedAt": "2026-09-22T20:00:00Z",
      "codeCommit": "97d0193",
      "model": "recorded-model-name",
      "latencyMs": 0
    },
    "review": { "verdict": "unreviewed", "categories": [] }
  }]
}
```

For a reviewed case, add `reviewer`, `reviewedAt`, reasoned `notes`, and one of these verdicts: `pass`, `fail`, or `needs_evidence`. A `fail` also needs at least one category: `unsupported_fact`, `safety_overclaim`, `buffer_mismatch`, `not_actionable`, `internal_signal_leak`, or `other`. A `pass` means the reviewer found no problem **under the documented rubric and supplied evidence**, not that real travel is safe or that external facts are current.

Use the rubric in [human-review.md](../v1/human-review.md). Include the full structured input and served application output, not just a favorable model excerpt. Record the exact code commit and configured model. The tool cannot authenticate the claimed provider, reviewer, or origin of a manually imported response; those remain provenance claims requiring independent care. Do not force ClaimTrace's citation checks onto this data: LayoverPlus's current Gemini output format does not provide source citations.

## Pre-register a small evaluation before collecting outputs

Choose the cases and rubric **before** seeing model responses. Include a mix of domestic and international connections, short and long layovers, low- and high-slack feasible stops, different risk profiles, and at least one no-feasible-stop case. The no-feasible-stop case should document deterministic fallback, **not** count as a model response. Keep provider errors and timeouts in the submitted set instead of retrying only failures or dropping awkward outputs. Record the number of planned cases, attempted provider calls, skipped calls, fallbacks, and completed human reviews separately.

One reviewer can perform a useful first pass, but that is not an independent reliability estimate. If a second reviewer disagrees, keep the disagreement and resolution notes. Do not claim a population-level accuracy or traveler-safety rate from a small convenience sample. No evaluation should trigger API calls until a user explicitly chooses a key, call cap, and any potential spending limit.
