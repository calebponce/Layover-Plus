const CATEGORIES = new Set([
  "unsupported_fact",
  "safety_overclaim",
  "buffer_mismatch",
  "not_actionable",
  "internal_signal_leak",
  "other",
]);
const VERDICTS = new Set(["pass", "fail", "needs_evidence", "unreviewed"]);

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value) {
  return nonempty(value) && !Number.isNaN(Date.parse(value));
}

function validateReviewDataset(dataset) {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset) || dataset.schemaVersion !== 1) {
    throw new Error("Review dataset must use schemaVersion 1.");
  }
  if (!nonempty(dataset.name)) throw new Error("Review dataset needs a name.");
  if (!Array.isArray(dataset.cases) || dataset.cases.length === 0 || dataset.cases.length > 100) {
    throw new Error("Review dataset must contain 1–100 cases.");
  }

  const seen = new Set();
  for (const item of dataset.cases) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        !nonempty(item.id) || !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(item.id)) {
      throw new Error("Each case needs a short, stable ID.");
    }
    if (seen.has(item.id)) throw new Error(`Duplicate case ID: ${item.id}.`);
    seen.add(item.id);
    if (!["schedule", "selection"].includes(item.service)) {
      throw new Error(`${item.id}: service must be schedule or selection.`);
    }
    if (!nonempty(item.scenario) || !item.input || typeof item.input !== "object" ||
        Array.isArray(item.input) || Object.keys(item.input).length === 0) {
      throw new Error(`${item.id}: scenario and structured input are required.`);
    }
    if (!item.servedOutput || typeof item.servedOutput !== "object" || Array.isArray(item.servedOutput) ||
        !nonempty(item.servedOutput.provider) || typeof item.servedOutput.used !== "boolean") {
      throw new Error(`${item.id}: servedOutput must include the application's provider and used fields.`);
    }

    const capture = item.capture;
    if (!capture || !["provider-run", "manual-import"].includes(capture.source) ||
        !validDate(capture.capturedAt) || !/^[0-9a-f]{7,40}$/i.test(capture.codeCommit) ||
        !nonempty(capture.model) || !Number.isFinite(capture.latencyMs) || capture.latencyMs < 0) {
      throw new Error(`${item.id}: capture needs source, date, commit, model, and nonnegative latency.`);
    }

    const review = item.review;
    if (!review || !VERDICTS.has(review.verdict)) {
      throw new Error(`${item.id}: review verdict is invalid.`);
    }
    if (!Array.isArray(review.categories) || review.categories.some((category) => !CATEGORIES.has(category)) ||
        new Set(review.categories).size !== review.categories.length) {
      throw new Error(`${item.id}: review categories must be unique known labels.`);
    }
    if (review.verdict === "unreviewed") {
      if (review.categories.length) throw new Error(`${item.id}: unreviewed cases cannot have failure categories.`);
    } else if (!nonempty(review.reviewer) || !validDate(review.reviewedAt) || !nonempty(review.notes)) {
      throw new Error(`${item.id}: reviewed cases need reviewer, review date, and reasoned notes.`);
    }
    if (review.verdict === "pass" && review.categories.length) {
      throw new Error(`${item.id}: passing cases cannot have failure categories.`);
    }
    if (review.verdict === "fail" && !review.categories.length) {
      throw new Error(`${item.id}: failures need a category.`);
    }
  }
  return dataset;
}

function summarizeReviewDataset(input) {
  const dataset = validateReviewDataset(input);
  const verdicts = { pass: 0, fail: 0, needs_evidence: 0, unreviewed: 0 };
  const categories = Object.fromEntries([...CATEGORIES].map((category) => [category, 0]));
  for (const item of dataset.cases) {
    verdicts[item.review.verdict] += 1;
    for (const category of item.review.categories) categories[category] += 1;
  }
  return {
    schemaVersion: 1,
    dataset: dataset.name,
    total: dataset.cases.length,
    verdicts,
    categories,
    reviewComplete: verdicts.unreviewed === 0 && verdicts.needs_evidence === 0,
    limitations: [
      "Counts reflect submitted human labels, not independently verified model accuracy.",
      "Provider origin and reviewer identity are recorded metadata, not authenticated by this tool.",
      "No travel-safety or real-time venue claim follows from this report.",
    ],
  };
}

module.exports = { summarizeReviewDataset, validateReviewDataset };
