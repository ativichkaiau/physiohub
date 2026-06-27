import type { FeedbackGuideReturnKind } from "@/components/widgets/common/FeedbackLoopGuide";

/**
 * Dynamic "controlled variable vs. set point" trace. The static loop diagram
 * shows the wiring; this shows the *behaviour* — and it is what makes the
 * feedback toggle finally do something visible:
 *   - negative loop ON  → a disturbance is sensed and corrected back to the set point.
 *   - negative loop OFF → nothing opposes the disturbance, so the variable drifts.
 *   - positive loop ON  → a small trigger self-amplifies to completion.
 *   - positive loop OFF → the trigger fizzles out.
 * The trace is a schematic time course (not a per-widget numeric model); it
 * teaches the regulatory concept that boxes-and-arrows alone cannot convey.
 */

type FeedbackDynamicsTrackProps = {
  feedbackActive: boolean;
  feedbackKind: FeedbackGuideReturnKind;
  variableLabel?: string;
};

const W = 480;
const H = 172;
const X0 = 14;
const X1 = 388;
const Y_MID = 96;
const SCALE = 34;
const TOP = 26;
const BOT = 142;
const T0 = 0.18; // perturbation onset (fraction of the timeline)
const N = 72;

function clampY(y: number) {
  return Math.max(TOP, Math.min(BOT, y));
}

export function FeedbackDynamicsTrack({
  feedbackActive,
  feedbackKind,
  variableLabel = "Controlled variable"
}: FeedbackDynamicsTrackProps) {
  const positive = feedbackKind === "stimulate";

  // value() returns deflection from the set point, in units where 1 ≈ the size
  // of the initial disturbance. The set point sits at 0.
  function value(f: number) {
    if (f < T0) return 0;
    const u = (f - T0) / (1 - T0); // 0..1 after the perturbation hits
    if (!positive) {
      // Negative feedback: ON decays the disturbance back to 0; OFF lets it drift.
      return feedbackActive ? Math.exp(-3.4 * u) : 1 + 0.85 * u;
    }
    // Positive feedback: ON self-amplifies (sigmoid runaway); OFF fizzles.
    return feedbackActive ? 1.62 / (1 + Math.exp(-9 * (u - 0.4))) : Math.exp(-3.4 * u);
  }

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    pts.push({ x: X0 + f * (X1 - X0), y: clampY(Y_MID - value(f) * SCALE) });
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const end = pts[pts.length - 1];

  const traceColor = positive
    ? feedbackActive
      ? "var(--ph-ok)"
      : "var(--ph-warn)"
    : feedbackActive
      ? "var(--ph-ok)"
      : "var(--ph-danger)";

  const caption = positive
    ? feedbackActive
      ? "Feedback ON — a small trigger self-amplifies until the response runs to completion."
      : "Feedback OFF — the trigger dies out instead of building on itself."
    : feedbackActive
      ? "Feedback ON — the disturbance is sensed and corrected back toward the set point."
      : "Feedback OFF — nothing opposes the disturbance, so the variable drifts away.";

  const bandTop = Y_MID - 0.24 * SCALE;
  const bandBot = Y_MID + 0.24 * SCALE;
  const distX = X0 + T0 * (X1 - X0);

  return (
    <div className="mb-4 ph-clay-well p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="ph-section-label">What the loop does over time</h2>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ color: traceColor, background: `color-mix(in srgb, ${traceColor}, transparent 88%)` }}
        >
          {feedbackActive ? "feedback ON" : "feedback OFF"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Time course with ${feedbackActive ? "feedback on" : "feedback off"}`}>
        {/* physiologic set-point band */}
        <rect
          x={X0}
          y={bandTop}
          width={X1 - X0}
          height={bandBot - bandTop}
          fill="color-mix(in srgb, var(--ph-ok), transparent 86%)"
        />
        {/* set-point line */}
        <line x1={X0} y1={Y_MID} x2={X1} y2={Y_MID} stroke="color-mix(in srgb, var(--ph-ok), transparent 30%)" strokeWidth={1.5} strokeDasharray="6 5" />
        <text x={X1 + 8} y={Y_MID + 4} fill="var(--ph-muted)" fontSize="11" fontWeight="700">
          set point
        </text>
        {/* disturbance / trigger marker */}
        <line x1={distX} y1={TOP - 4} x2={distX} y2={BOT} stroke="color-mix(in srgb, var(--ph-muted), transparent 72%)" strokeWidth={1} strokeDasharray="3 4" />
        <text x={distX} y={H - 5} textAnchor="middle" fill="var(--ph-muted)" fontSize="10" fontWeight="700">
          {positive ? "trigger" : "disturbance"}
        </text>
        {/* the trace — keyed so it re-draws when the toggle flips */}
        <path
          key={`${feedbackKind}-${feedbackActive}`}
          className="ph-trace-draw"
          d={d}
          fill="none"
          stroke={traceColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
        <circle cx={end.x} cy={end.y} r={4.5} fill={traceColor} />
        {/* axes hints */}
        <text x={X0} y={H - 5} fill="var(--ph-muted)" fontSize="10" fontWeight="700">
          time →
        </text>
        <text x={X0} y={TOP - 9} fill="var(--ph-muted)" fontSize="10" fontWeight="700">
          ↑ {variableLabel}
        </text>
      </svg>
      <p className="mt-1 text-xs text-ph-muted">{caption}</p>
    </div>
  );
}
