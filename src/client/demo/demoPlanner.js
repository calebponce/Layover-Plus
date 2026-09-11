const START_MINUTES = 8 * 60 + 30;

export const RISK_PROFILES = {
  conservative: {
    label: "Conservative",
    description: "More time at the airport",
    processingDelta: 10,
    returnBufferDelta: 20,
    maxTravelDelta: -6,
    dwellDelta: -10,
  },
  balanced: {
    label: "Balanced",
    description: "Practical margin and time out",
    processingDelta: 0,
    returnBufferDelta: 0,
    maxTravelDelta: 0,
    dwellDelta: 0,
  },
  explorer: {
    label: "Explorer",
    description: "More experience, less margin",
    processingDelta: -5,
    returnBufferDelta: -15,
    maxTravelDelta: 6,
    dwellDelta: 15,
  },
};

export const DEMO_AIRPORTS = {
  SFO: {
    code: "SFO",
    name: "San Francisco International",
    city: "San Francisco",
    processingMinutes: { domestic: 30, international: 55 },
    returnBufferMinutes: { domestic: 85, international: 140 },
    recommendedTripMinutes: { domestic: 80, international: 60 },
    maxTravelMinutesOneWay: { domestic: 28, international: 18 },
    candidates: [
      {
        name: "Millbrae Pancake House",
        category: "Food",
        address: "El Camino Real · Millbrae",
        travelMinutes: 12,
        notability: 5,
      },
      {
        name: "Burlingame Avenue",
        category: "Local district",
        address: "Burlingame Avenue · Burlingame",
        travelMinutes: 16,
        notability: 6,
      },
      {
        name: "Coyote Point Recreation Area",
        category: "Outdoors",
        address: "Coyote Point Drive · San Mateo",
        travelMinutes: 20,
        notability: 6,
      },
    ],
  },
  LAX: {
    code: "LAX",
    name: "Los Angeles International",
    city: "Los Angeles",
    processingMinutes: { domestic: 35, international: 60 },
    returnBufferMinutes: { domestic: 90, international: 150 },
    recommendedTripMinutes: { domestic: 75, international: 60 },
    maxTravelMinutesOneWay: { domestic: 30, international: 20 },
    candidates: [
      {
        name: "The Proud Bird",
        category: "Food",
        address: "Aviation Boulevard · Los Angeles",
        travelMinutes: 13,
        notability: 5,
      },
      {
        name: "Automobile Driving Museum",
        category: "Culture",
        address: "Lairport Street · El Segundo",
        travelMinutes: 16,
        notability: 6,
      },
      {
        name: "Manhattan Beach Pier",
        category: "Sightseeing",
        address: "Manhattan Beach Boulevard",
        travelMinutes: 24,
        notability: 7,
      },
    ],
  },
  JFK: {
    code: "JFK",
    name: "John F. Kennedy International",
    city: "New York City",
    processingMinutes: { domestic: 40, international: 65 },
    returnBufferMinutes: { domestic: 95, international: 155 },
    recommendedTripMinutes: { domestic: 75, international: 55 },
    maxTravelMinutesOneWay: { domestic: 30, international: 18 },
    candidates: [
      {
        name: "New Park Pizza",
        category: "Food",
        address: "Cross Bay Boulevard · Howard Beach",
        travelMinutes: 21,
        notability: 5,
      },
      {
        name: "Jamaica Bay Wildlife Refuge",
        category: "Outdoors",
        address: "Cross Bay Boulevard · Queens",
        travelMinutes: 24,
        notability: 7,
      },
      {
        name: "Rockaway Beach Boardwalk",
        category: "Sightseeing",
        address: "Shore Front Parkway · Queens",
        travelMinutes: 28,
        notability: 7,
      },
    ],
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function slackPoints(slackMinutes) {
  if (slackMinutes >= 60) return 60;
  if (slackMinutes >= 0) return Math.round(28 + (slackMinutes / 60) * 32);
  if (slackMinutes >= -30) return Math.round(Math.max(0, 28 + (slackMinutes / 30) * 28));
  return 0;
}

function travelPoints(oneWayMinutes, maxTravelMinutesOneWay) {
  const threshold = Math.max(1, maxTravelMinutesOneWay);
  const ratio = oneWayMinutes / threshold;
  if (ratio <= 1) return Math.round(26 - ratio * 4);
  if (ratio <= 1.35) return Math.round(22 - ((ratio - 1) / 0.35) * 16);
  if (ratio <= 1.8) return Math.round(6 - ((ratio - 1.35) / 0.45) * 6);
  return 0;
}

function dwellPoints(dwellMinutes, recommendedDwellMinutes) {
  const recommended = Math.max(20, recommendedDwellMinutes);
  const ratio = clamp(dwellMinutes / recommended, 0, 1.35);
  if (ratio >= 1) return 14;
  if (ratio >= 0.75) return Math.round(9 + ((ratio - 0.75) / 0.25) * 5);
  if (ratio >= 0.5) return Math.round(4 + ((ratio - 0.5) / 0.25) * 5);
  return Math.round(ratio * 8);
}

function calculateFeasibility({
  layoverMinutes,
  travelMinutes,
  dwellMinutes,
  processingMinutes,
  returnBufferMinutes,
  maxTravelMinutesOneWay,
  recommendedDwellMinutes,
}) {
  const totalRequiredMinutes =
    processingMinutes + travelMinutes * 2 + dwellMinutes + returnBufferMinutes;
  const slackMinutes = layoverMinutes - totalRequiredMinutes;
  const slackComponent = slackPoints(slackMinutes);
  const travelComponent = travelPoints(travelMinutes, maxTravelMinutesOneWay);
  const dwellComponent = dwellPoints(dwellMinutes, recommendedDwellMinutes);
  const score = clamp(slackComponent + travelComponent + dwellComponent, 0, 100);
  const feasible = slackMinutes >= 0;

  let riskLabel = "High";
  if (feasible && slackMinutes >= 35 && score >= 72) riskLabel = "Low";
  else if (feasible && slackMinutes >= 10 && score >= 52) riskLabel = "Medium";

  return {
    feasible,
    score,
    riskLabel,
    slackMinutes,
    totalRequiredMinutes,
    scoreBreakdown: { slackComponent, travelComponent, dwellComponent },
  };
}

function formatClock(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function riskRank(label) {
  return { Low: 0, Medium: 1, High: 2 }[label] ?? 3;
}

function buildTimeline(plan) {
  const departureMinutes = START_MINUTES + plan.layoverMinutes;
  if (!plan.feasible) {
    const terminalMinutes = Math.max(
      0,
      plan.layoverMinutes - plan.processingMinutes - plan.returnBufferMinutes
    );
    return [
      {
        time: formatClock(START_MINUTES),
        label: "Land and clear arrival",
        detail: `${plan.processingMinutes} min processing allowance`,
      },
      {
        time: formatClock(START_MINUTES + plan.processingMinutes),
        label: "Stay inside the terminal",
        detail: `${terminalMinutes} min available airside`,
      },
      {
        time: formatClock(departureMinutes - plan.returnBufferMinutes),
        label: "Begin departure buffer",
        detail: `${plan.returnBufferMinutes} min protected`,
      },
    ];
  }

  const clearAirport = START_MINUTES + plan.processingMinutes;
  const arriveAtStop = clearAirport + plan.selected.travelMinutes;
  const leaveStop = arriveAtStop + plan.selected.dwellMinutes;
  const returnAirport = leaveStop + plan.selected.travelMinutes;
  return [
    {
      time: formatClock(START_MINUTES),
      label: "Land and clear arrival",
      detail: `${plan.processingMinutes} min processing allowance`,
    },
    {
      time: formatClock(clearAirport),
      label: `Depart for ${plan.selected.name}`,
      detail: `${plan.selected.travelMinutes} min estimated ride`,
    },
    {
      time: formatClock(arriveAtStop),
      label: "Experience window",
      detail: `${plan.selected.dwellMinutes} min on location`,
    },
    {
      time: formatClock(leaveStop),
      label: "Return to the airport",
      detail: `Back by ${formatClock(returnAirport)}`,
    },
    {
      time: formatClock(returnAirport),
      label: "Protected departure margin",
      detail: `${plan.returnBufferMinutes + plan.selected.slackMinutes} min before takeoff`,
    },
  ];
}

export function buildDemoPlan({
  airportCode = "SFO",
  layoverHours = 5,
  connectionType = "domestic",
  riskProfile = "balanced",
  selectedCandidateName = null,
} = {}) {
  const airport = DEMO_AIRPORTS[airportCode] || DEMO_AIRPORTS.SFO;
  const profile = RISK_PROFILES[riskProfile] || RISK_PROFILES.balanced;
  const connection = connectionType === "international" ? "international" : "domestic";
  const layoverMinutes = Math.round(clamp(Number(layoverHours) || 5, 2, 9) * 60);
  const processingMinutes = Math.max(
    10,
    airport.processingMinutes[connection] + profile.processingDelta
  );
  const returnBufferMinutes = Math.max(
    45,
    airport.returnBufferMinutes[connection] + profile.returnBufferDelta
  );
  const recommendedDwellMinutes = Math.max(
    20,
    airport.recommendedTripMinutes[connection] + profile.dwellDelta
  );
  const maxTravelMinutesOneWay = Math.max(
    8,
    airport.maxTravelMinutesOneWay[connection] + profile.maxTravelDelta
  );

  const candidates = airport.candidates
    .map((candidate) => {
      const availableForDwell =
        layoverMinutes - processingMinutes - returnBufferMinutes - candidate.travelMinutes * 2;
      const dwellMinutes = Math.max(20, Math.min(recommendedDwellMinutes, availableForDwell));
      const feasibility = calculateFeasibility({
        layoverMinutes,
        travelMinutes: candidate.travelMinutes,
        dwellMinutes,
        processingMinutes,
        returnBufferMinutes,
        maxTravelMinutesOneWay,
        recommendedDwellMinutes,
      });
      return { ...candidate, dwellMinutes, ...feasibility };
    })
    .sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      if (riskRank(a.riskLabel) !== riskRank(b.riskLabel)) {
        return riskRank(a.riskLabel) - riskRank(b.riskLabel);
      }
      if (b.score !== a.score) return b.score - a.score;
      return b.notability - a.notability;
    });

  const requested = candidates.find((candidate) => candidate.name === selectedCandidateName);
  const selected = requested || candidates[0];
  const feasible = selected?.feasible === true;
  const plan = {
    airport,
    connectionType: connection,
    riskProfile,
    profile,
    layoverMinutes,
    processingMinutes,
    returnBufferMinutes,
    recommendedDwellMinutes,
    maxTravelMinutesOneWay,
    candidates,
    selected,
    feasible,
    departureTime: formatClock(START_MINUTES + layoverMinutes),
    decision: feasible ? "GO" : "STAY AIRSIDE",
  };

  return { ...plan, timeline: buildTimeline(plan) };
}
