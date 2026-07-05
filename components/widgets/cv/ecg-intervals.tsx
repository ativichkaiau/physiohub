"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "cv/ecg-intervals";
const diagram = getDiagramById(DIAGRAM_ID);

type EventId = "p" | "pr" | "qrs" | "st" | "t";

type EcgEvent = {
  id: EventId;
  label: string;
  startMs: number;
  endMs: number;
  conduction: string;
  body: string;
  pathology: string;
  // Signature highlight colour per event so the strip reads as five distinct
  // conduction events at a glance, not as one undifferentiated waveform.
  colorVar: string;
};

// One ECG cycle over 800 ms (HR ≈ 75 bpm). Times are conventional adult values.
const EVENTS: EcgEvent[] = [
  {
    id: "p",
    label: "P wave",
    startMs: 50,
    endMs: 130,
    conduction: "Atrial depolarization",
    colorVar: "var(--ph-curve-2)",
    body: "The SA node fires (rate set by phase-4 If current) and the wavefront sweeps across both atria via internodal tracts and Bachmann's bundle. Duration normally 80–120 ms; amplitude < 2.5 mm in II. In lead II (used here), P is upright; inversion suggests an ectopic atrial or junctional rhythm.",
    pathology: "Peaked P (> 2.5 mm in II) — P pulmonale → right atrial enlargement. Broad / notched P (> 120 ms) — P mitrale → left atrial enlargement. Absent P with irregularly irregular RR = atrial fibrillation. Sawtooth at ~300 bpm = atrial flutter."
  },
  {
    id: "pr",
    label: "PR interval",
    startMs: 50,
    endMs: 170,
    conduction: "AV nodal delay",
    colorVar: "var(--ph-curve-3)",
    body: "Measured from the start of P to the start of QRS. Normal 120–200 ms (3–5 small boxes). The AV node deliberately delays conduction (~80 ms) so atrial systole finishes before ventricular contraction begins. Decremental conduction protects ventricles from atrial tachyarrhythmias.",
    pathology: "PR > 200 ms = first-degree AV block (typically benign). Progressive PR lengthening then dropped beat = Mobitz I (Wenckebach, AV-node block). Fixed PR with intermittent dropped beat = Mobitz II (infranodal, risk of complete block). Short PR (< 120 ms) with delta wave = WPW pre-excitation."
  },
  {
    id: "qrs",
    label: "QRS complex",
    startMs: 170,
    endMs: 260,
    conduction: "Ventricular depolarization (His–Purkinje)",
    colorVar: "var(--ph-curve-1)",
    body: "Rapid spread through the His bundle → bundle branches → Purkinje network → ventricular myocardium. Duration normally < 120 ms (< 3 small boxes). The dominant LV mass drives the vector toward I, V5–V6 (upright R). Q waves in lateral / inferior leads should be < 40 ms wide and < 25% of the R wave amplitude.",
    pathology: "QRS > 120 ms = bundle branch block (RBBB has rSR' in V1, LBBB has wide R in V5–V6) or ventricular escape / VT. Poor R-wave progression V1–V4 = prior anteroseptal MI. Pathologic Q waves (>40 ms, > 25% of R) = transmural infarct. Low voltage = pericardial effusion / amyloid."
  },
  {
    id: "st",
    label: "ST segment",
    startMs: 260,
    endMs: 320,
    conduction: "Ventricular plateau (AP phase 2)",
    colorVar: "var(--ph-curve-6)",
    body: "Both ventricles fully depolarized; calcium plateau of the action potential. The J point marks the QRS–ST junction. Isoelectric in health — measured 60–80 ms after J point. ST in lead II should sit on the TP baseline.",
    pathology: "ST elevation ≥ 1 mm in two contiguous limb leads (≥ 2 mm in V2–V3) = transmural ischaemia (STEMI) — emergent reperfusion. Horizontal / down-sloping ST depression ≥ 1 mm = subendocardial ischaemia. Diffuse concave-up ST elevation with PR depression = pericarditis. Saddle-back ST in V1–V2 = Brugada pattern (Na-channelopathy)."
  },
  {
    id: "t",
    label: "T wave",
    startMs: 320,
    endMs: 525,
    conduction: "Ventricular repolarization (AP phase 3)",
    colorVar: "var(--ph-curve-4)",
    body: "Net repolarization vector. Normally concordant with QRS (upright in I, II, V3–V6; inverted in aVR). QT interval (Q → end of T) reflects total ventricular AP duration; it shortens at fast HR. Bazett-corrected QTc = QT / √RR (normal ≤ 440 ms men, ≤ 460 ms women).",
    pathology: "Peaked symmetric T (≥ 2/3 R) = hyperkalaemia (K > 5.5). Inverted T = ischaemia / strain. Biphasic T in V1–V4 = Wellens' syndrome (LAD critical lesion). QTc > 500 ms = high torsades-de-pointes risk (drug-induced, congenital LQTS — KCNQ1/HERG mutations, ↓Mg, ↓K, ↓Ca). U waves prominent in hypokalaemia."
  }
];

// One ECG beat sampled as (ms, mV).
const ECG_POINTS: Array<[number, number]> = [
  [0, 0], [40, 0],
  [60, 0.06], [80, 0.18], [100, 0.06], [130, 0],
  [165, 0],
  [175, -0.12], [185, 0.30], [195, 0.95], [205, -0.25], [215, -0.08], [235, 0],
  [260, 0],
  [300, 0.03], [330, 0.05],
  [370, 0.16], [430, 0.42], [485, 0.28], [525, 0],
  [800, 0]
];

function buildPath(points: Array<[number, number]>, scaleX: (ms: number) => number, scaleY: (mv: number) => number) {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${scaleX(x).toFixed(1)} ${scaleY(y).toFixed(1)}`)
    .join(" ");
}

export default function EcgIntervalsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const initial = searchParams.get("event");
  const initialId: EventId = (EVENTS.find((e) => e.id === initial)?.id ?? "qrs");
  const [selectedId, setSelectedId] = useState<EventId>(initialId);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    params.set("event", selectedId);
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [currentQuery, pathname, router, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const next = params.get("event") as EventId | null;
    if (!next || !EVENTS.find((e) => e.id === next)) return;
    setSelectedId((current) => (next === current ? current : next));
  }, [currentQuery]);

  const selected = EVENTS.find((e) => e.id === selectedId)!;

  // SVG layout
  const W = 760;
  const H = 240;
  const PAD = { l: 36, r: 16, t: 30, b: 32 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const X = (ms: number) => PAD.l + (ms / 800) * plotW;
  const Y = (mv: number) => PAD.t + plotH - ((mv + 0.35) / 1.6) * plotH;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Interactive ECG strip">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{selected.label} — {selected.conduction}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{selected.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Pathology:</span>{" "}
              <span className="text-ph-muted">{selected.pathology}</span>
            </p>
          </div>

          <svg
            role="img"
            aria-label="One ECG cycle with five clickable intervals"
            viewBox={`0 0 ${W} ${H}`}
            className="ph-pathway-canvas h-auto w-full"
          >
            {/* Major grid lines every 200 ms */}
            {[0, 200, 400, 600, 800].map((ms) => (
              <line key={`v${ms}`} x1={X(ms)} y1={PAD.t} x2={X(ms)} y2={PAD.t + plotH} stroke="var(--ph-grid)" strokeWidth="1" />
            ))}
            {/* Minor grid lines every 40 ms */}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`vm${i}`} x1={X((i + 1) * 40)} y1={PAD.t} x2={X((i + 1) * 40)} y2={PAD.t + plotH} stroke="var(--ph-grid)" strokeWidth="0.4" opacity="0.6" />
            ))}
            {/* Baseline */}
            <line x1={PAD.l} y1={Y(0)} x2={PAD.l + plotW} y2={Y(0)} stroke="var(--ph-axis)" strokeWidth="0.7" opacity="0.55" />

            {/* Highlight rectangles — selected event gets full accent, others are clickable */}
            {EVENTS.map((ev) => {
              const isSelected = ev.id === selectedId;
              return (
                <g key={ev.id}>
                  <rect
                    x={X(ev.startMs)}
                    y={PAD.t}
                    width={X(ev.endMs) - X(ev.startMs)}
                    height={plotH}
                    fill={
                      isSelected
                        ? `color-mix(in srgb, ${ev.colorVar}, transparent 78%)`
                        : `color-mix(in srgb, ${ev.colorVar}, transparent 94%)`
                    }
                    stroke={
                      isSelected
                        ? `color-mix(in srgb, ${ev.colorVar}, transparent 40%)`
                        : "transparent"
                    }
                    strokeWidth={isSelected ? 1.6 : 1}
                    rx="6"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedId(ev.id)}
                    role="button"
                    aria-label={`Select ${ev.label}`}
                  />
                  {isSelected ? (
                    <text
                      x={(X(ev.startMs) + X(ev.endMs)) / 2}
                      y={PAD.t - 8}
                      textAnchor="middle"
                      fill={ev.colorVar}
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.5"
                    >
                      {ev.label.toUpperCase()}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* ECG trace */}
            <path d={buildPath(ECG_POINTS, X, Y)} fill="none" stroke="var(--ph-curve-1)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

            {/* Axis labels */}
            <text x={PAD.l} y={H - 8} fontSize="10" fill="var(--ph-muted)">0</text>
            <text x={X(400)} y={H - 8} fontSize="10" fill="var(--ph-muted)" textAnchor="middle">400 ms</text>
            <text x={X(800)} y={H - 8} fontSize="10" fill="var(--ph-muted)" textAnchor="end">800 ms</text>
            <text x={6} y={Y(1) + 4} fontSize="10" fill="var(--ph-muted)">1 mV</text>
            <text x={6} y={Y(0) + 4} fontSize="10" fill="var(--ph-muted)">0</text>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Each piece of the ECG is one electrical event. Click P (atrial depolarization), the PR segment (AV-node delay), QRS (ventricular depolarization), the ST segment (plateau), and T (repolarization). A long PR is nodal delay; a wide QRS is slow ventricular spread — read the tracing as a timeline of conduction."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Conduction events">
            <h2 className="ph-section-label mb-4">Click an event</h2>
            <div className="grid gap-2">
              {EVENTS.map((ev) => {
                const isSelected = ev.id === selectedId;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedId(ev.id)}
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ev.colorVar }}
                    />
                    <span className="font-bold">{ev.label}</span>
                    <span className="text-xs">{ev.conduction}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>
                  {reference.source}
                  {reference.pages ? `, ${reference.pages}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
