const { readFileSync } = require("node:fs");
const { summarizeReviewDataset } = require("./report");

function main(args) {
  const file = args.find((arg) => !arg.startsWith("--"));
  const flags = args.filter((arg) => arg.startsWith("--"));
  if (!file || flags.some((flag) => !["--json", "--require-complete"].includes(flag)) || args.filter((arg) => !arg.startsWith("--")).length !== 1) {
    throw new Error("Usage: npm run eval:review -- <dataset.json> [--json] [--require-complete]");
  }
  const report = summarizeReviewDataset(JSON.parse(readFileSync(file, "utf8")));
  if (flags.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${report.dataset}: ${report.total} submitted cases\n`);
    process.stdout.write(`Human verdicts: ${Object.entries(report.verdicts).map(([key, value]) => `${key}=${value}`).join(", ")}\n`);
    process.stdout.write(`Failure categories: ${Object.entries(report.categories).filter(([, count]) => count).map(([key, count]) => `${key}=${count}`).join(", ") || "none recorded"}\n`);
    process.stdout.write(`${report.reviewComplete ? "Review complete for this submitted set." : "Review incomplete; no quality estimate should be made."}\n`);
    process.stdout.write(`${report.limitations.join(" ")}\n`);
  }
  if (flags.includes("--require-complete") && !report.reviewComplete) process.exitCode = 2;
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
