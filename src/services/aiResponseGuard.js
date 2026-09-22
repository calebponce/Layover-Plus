// Model copy is optional. Reject unsupported numeric claims and categorical
// safety promises before any generated wording reaches a traveler.
const UNSAFE_SAFETY_CLAIM =
  /\b(?:guaranteed|risk[ -]?free|no risk|zero risk|ignore (?:the )?(?:buffer|security)|skip (?:the )?(?:return buffer|security)|plenty of time)\b/i;

function numbersIn(value) {
  return String(value || "").match(/-?\d+(?:\.\d+)?/g) || [];
}

function allowedNumbers({ summary, feasibility, selectedPoi, schedule }) {
  const values = [
    summary?.layoverMinutes,
    summary?.processingMinutes,
    summary?.returnBufferMinutes,
    selectedPoi?.outboundMinutes,
    selectedPoi?.inboundMinutes,
    selectedPoi?.dwellMinutes,
    feasibility?.slackMinutes,
    ...(Array.isArray(schedule) ? schedule.map((block) => block.minutes) : []),
  ];
  const allowed = new Set(values.filter(Number.isFinite).map(String));

  // A place name such as "Pier 39" is supplied by the place provider.
  for (const number of numbersIn(selectedPoi?.name)) allowed.add(number);
  return allowed;
}

function generatedCopyIsGrounded(value, context) {
  const allowed = allowedNumbers(context);
  const fields = [value?.title, value?.narrative, ...(value?.travelerTips || [])];
  if (Array.isArray(value?.schedule)) {
    for (const block of value.schedule) fields.push(block?.label, block?.reason);
  }

  return fields.every((field) => {
    if (typeof field !== "string") return true;
    if (UNSAFE_SAFETY_CLAIM.test(field)) return false;
    return numbersIn(field).every((number) => allowed.has(number));
  });
}

module.exports = { generatedCopyIsGrounded };
