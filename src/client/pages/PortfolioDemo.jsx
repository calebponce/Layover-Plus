import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, Code2, MapPin, Plane, Route, ShieldCheck } from "lucide-react";

import { DEMO_AIRPORTS, RISK_PROFILES, buildDemoPlan } from "../demo/demoPlanner.js";
import "./PortfolioDemo.css";

const SOURCE_URL = "https://github.com/calebponce/Layover-Plus";
const HERO_IMAGE = `${import.meta.env.BASE_URL}travel_night_background_1778470083966.png`;

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="layover-demo__field">
      <span className="layover-demo__label">{label}</span>
      <div className="layover-demo__segments" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={value === option.value ? "is-active" : ""}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="layover-demo__metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

export default function PortfolioDemo() {
  const [airportCode, setAirportCode] = useState("SFO");
  const [layoverHours, setLayoverHours] = useState(5);
  const [connectionType, setConnectionType] = useState("domestic");
  const [riskProfile, setRiskProfile] = useState("balanced");
  const [selectedCandidateName, setSelectedCandidateName] = useState(null);

  const plan = useMemo(
    () =>
      buildDemoPlan({
        airportCode,
        layoverHours,
        connectionType,
        riskProfile,
        selectedCandidateName,
      }),
    [airportCode, connectionType, layoverHours, riskProfile, selectedCandidateName]
  );

  useEffect(() => {
    document.title = "LayoverPlus — Interactive Safety Planner";
    document.body.dataset.scene = "layover-portfolio";
    return () => {
      delete document.body.dataset.scene;
    };
  }, []);

  const updatePlanningInput = (setter) => (value) => {
    setSelectedCandidateName(null);
    setter(value);
  };

  const safetyMargin = plan.feasible ? Math.max(0, plan.selected.slackMinutes) : 0;

  return (
    <div className="layover-demo" id="top">
      <a className="layover-demo__skip" href="#planner">
        Skip to planner
      </a>

      <header className="layover-demo__header">
        <a className="layover-demo__brand" href="#top" aria-label="LayoverPlus demo home">
          <span className="layover-demo__mark" aria-hidden="true">
            <Plane size={20} strokeWidth={1.8} />
          </span>
          <span>
            <strong>LayoverPlus</strong>
            <small>Interactive reliability case study</small>
          </span>
        </a>
        <nav aria-label="Portfolio demo navigation">
          <a href="#planner">Planner</a>
          <a href="#engineering">Engineering</a>
          <a
            className="layover-demo__source-link"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={16} /> Source <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>

      <main>
        <section className="layover-demo__intro" aria-labelledby="layover-demo-title">
          <div>
            <span className="layover-demo__eyebrow">Risk engine · representative route data</span>
            <h1 id="layover-demo-title">
              Know when a layover is an opportunity—<em>not a gamble.</em>
            </h1>
          </div>
          <div className="layover-demo__intro-copy">
            <p>
              Change the airport, connection, risk tolerance, or available time. The deterministic
              planner recalculates the safety call, ranked stops, and departure-safe timeline in
              your browser.
            </p>
            <div className="layover-demo__proof-line" aria-label="Project proof">
              <span>3 airports</span>
              <span>3 risk models</span>
              <span>0 API keys</span>
            </div>
          </div>
        </section>

        <section className="layover-demo__workspace" id="planner" aria-labelledby="planner-title">
          <aside className="layover-demo__controls">
            <div className="layover-demo__control-heading">
              <span>Plan inputs</span>
              <strong id="planner-title">Your connection</strong>
            </div>

            <div className="layover-demo__field">
              <span className="layover-demo__label">Airport</span>
              <div className="layover-demo__airport-grid" role="radiogroup" aria-label="Airport">
                {Object.values(DEMO_AIRPORTS).map((airport) => (
                  <button
                    key={airport.code}
                    type="button"
                    role="radio"
                    aria-checked={airportCode === airport.code}
                    className={airportCode === airport.code ? "is-active" : ""}
                    onClick={() => updatePlanningInput(setAirportCode)(airport.code)}
                  >
                    <strong>{airport.code}</strong>
                    <span>{airport.city}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="layover-demo__field layover-demo__duration-field">
              <div className="layover-demo__range-copy">
                <label className="layover-demo__label" htmlFor="layover-duration">
                  Layover duration
                </label>
                <output htmlFor="layover-duration">{layoverHours.toFixed(1)} hours</output>
              </div>
              <input
                id="layover-duration"
                type="range"
                min="2"
                max="9"
                step="0.5"
                value={layoverHours}
                style={{ "--range-value": layoverHours }}
                onChange={(event) =>
                  updatePlanningInput(setLayoverHours)(Number(event.target.value))
                }
              />
              <div className="layover-demo__range-scale" aria-hidden="true">
                <span>2h</span>
                <span>9h</span>
              </div>
            </div>

            <SegmentedControl
              label="Connection"
              value={connectionType}
              onChange={updatePlanningInput(setConnectionType)}
              options={[
                { value: "domestic", label: "Domestic" },
                { value: "international", label: "International" },
              ]}
            />

            <div className="layover-demo__field">
              <span className="layover-demo__label">Risk tolerance</span>
              <div
                className="layover-demo__risk-list"
                role="radiogroup"
                aria-label="Risk tolerance"
              >
                {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={riskProfile === key}
                    className={riskProfile === key ? "is-active" : ""}
                    onClick={() => updatePlanningInput(setRiskProfile)(key)}
                  >
                    <span className="layover-demo__radio-dot" aria-hidden="true" />
                    <span>
                      <strong>{profile.label}</strong>
                      <small>{profile.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="layover-demo__guardrail">
              <ShieldCheck size={18} />
              <p>
                <strong>Hard guardrail</strong>A plan is never marked GO when required time exceeds
                the layover.
              </p>
            </div>
          </aside>

          <div className="layover-demo__results" aria-live="polite">
            <article className={`layover-demo__decision is-${plan.feasible ? "go" : "stay"}`}>
              <img src={HERO_IMAGE} alt="Airport terminal and runway at night" />
              <div className="layover-demo__decision-shade" aria-hidden="true" />
              <div className="layover-demo__decision-topline">
                <span>Live safety call</span>
                <span>
                  {plan.airport.code} · departure {plan.departureTime}
                </span>
              </div>
              <div className="layover-demo__decision-body">
                <div>
                  <span className="layover-demo__decision-label">
                    {plan.feasible ? "Safe to leave the airport" : "Time boundary reached"}
                  </span>
                  <strong className="layover-demo__decision-value">{plan.decision}</strong>
                  <p>
                    {plan.feasible
                      ? `${plan.selected.name} fits with ${safetyMargin} minutes of additional schedule slack.`
                      : `No off-airport stop fits after processing and the protected return buffer.`}
                  </p>
                </div>
                <div
                  className={`layover-demo__risk-badge is-${plan.selected.riskLabel.toLowerCase()}`}
                >
                  <span>Risk</span>
                  <strong>{plan.selected.riskLabel}</strong>
                  <small>{plan.selected.score}/100</small>
                </div>
              </div>
              <div className="layover-demo__metrics">
                <Metric label="Processing" value={formatDuration(plan.processingMinutes)} />
                <Metric
                  label="Round-trip travel"
                  value={formatDuration(plan.selected.travelMinutes * 2)}
                />
                <Metric
                  label="Experience time"
                  value={plan.feasible ? formatDuration(plan.selected.dwellMinutes) : "—"}
                />
                <Metric label="Return buffer" value={formatDuration(plan.returnBufferMinutes)} />
              </div>
            </article>

            <section className="layover-demo__candidate-section" aria-labelledby="candidate-title">
              <div className="layover-demo__section-heading">
                <div>
                  <span>Ranked alternatives</span>
                  <h2 id="candidate-title">Choose the tradeoff</h2>
                </div>
                <p>Selection updates the call and timeline as one state change.</p>
              </div>
              <div className="layover-demo__candidate-grid">
                {plan.candidates.map((candidate, index) => {
                  const isSelected = candidate.name === plan.selected.name;
                  return (
                    <button
                      key={candidate.name}
                      type="button"
                      className={isSelected ? "is-selected" : ""}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedCandidateName(candidate.name)}
                    >
                      <span className="layover-demo__candidate-rank">0{index + 1}</span>
                      <span className="layover-demo__candidate-copy">
                        <small>{candidate.category}</small>
                        <strong>{candidate.name}</strong>
                        <span>
                          <MapPin size={13} /> {candidate.address}
                        </span>
                      </span>
                      <span className="layover-demo__candidate-score">
                        <strong>{candidate.score}</strong>
                        <small>{candidate.feasible ? candidate.riskLabel : "No-go"}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="layover-demo__detail-grid">
              <section className="layover-demo__timeline" aria-labelledby="timeline-title">
                <div className="layover-demo__section-heading layover-demo__section-heading--compact">
                  <div>
                    <span>Departure-safe sequence</span>
                    <h2 id="timeline-title">Your timeline</h2>
                  </div>
                  <Clock3 size={20} />
                </div>
                <ol>
                  {plan.timeline.map((item, index) => (
                    <li key={`${item.time}-${item.label}`}>
                      <span className="layover-demo__timeline-index">{index + 1}</span>
                      <time>{item.time}</time>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="layover-demo__explanation" aria-labelledby="explanation-title">
                <div className="layover-demo__section-heading layover-demo__section-heading--compact">
                  <div>
                    <span>Why this result</span>
                    <h2 id="explanation-title">Inspectable math</h2>
                  </div>
                  <Route size={20} />
                </div>
                <div className="layover-demo__equation">
                  <span>{formatDuration(plan.layoverMinutes)} layover</span>
                  <i>−</i>
                  <span>{formatDuration(plan.processingMinutes)} processing</span>
                  <i>−</i>
                  <span>{formatDuration(plan.returnBufferMinutes)} return protection</span>
                </div>
                <div className="layover-demo__score-breakdown">
                  {Object.entries(plan.selected.scoreBreakdown).map(([key, value]) => (
                    <div key={key}>
                      <span>{key.replace("Component", "")}</span>
                      <div>
                        <i style={{ width: `${(value / 60) * 100}%` }} />
                      </div>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <p className="layover-demo__model-note">
                  AI may improve ranking and wording in the full product. It cannot override these
                  timing constraints or manufacture a GO decision.
                </p>
              </section>
            </div>
          </div>
        </section>

        <section
          className="layover-demo__engineering"
          id="engineering"
          aria-labelledby="engineering-title"
        >
          <div className="layover-demo__engineering-copy">
            <span className="layover-demo__eyebrow">Engineering evidence</span>
            <h2 id="engineering-title">Reliable when providers are not.</h2>
            <p>
              The complete React/Express application supports live place discovery, route estimates,
              optional Gemini ranking, authentication, and saved plans. The deterministic core and
              curated fallbacks keep the planner useful when those integrations are unavailable.
            </p>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              Review the full implementation <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="layover-demo__engineering-cards">
            <article>
              <span>01</span>
              <strong>Deterministic safety</strong>
              <p>
                Processing, transit, dwell, and return margins are computed before AI is involved.
              </p>
            </article>
            <article>
              <span>02</span>
              <strong>Graceful fallback</strong>
              <p>Curated places and conservative route assumptions preserve the primary journey.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Contract-tested sync</strong>
              <p>
                A selected stop updates the recommendation, timeline, and route as one decision.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="layover-demo__footer">
        <span>LayoverPlus · Representative planning data · No information is collected</span>
        <span>Caleb Ponce · AI and backend engineering</span>
      </footer>
    </div>
  );
}
