"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, ScrubBar, type CurvePoint, type CurveSeries } from "@/components/widgets/primitives";
import { parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/cardiac-action-potentials";
const diagram = getDiagramById(DIAGRAM_ID);

const DURATION = 1.0;

type CellId = "ventricle" | "sa-nodal";

// Voltage as a function of time (s) for two canonical cardiac cells.
// Ventricular: fast Na+ upstroke, prominent calcium plateau, ~300 ms AP.
function ventricularAP(t: number) {
  const ms = t * 1000;
  if (ms < 0) return -90;
  if (ms < 2) return -90 + (120 / 2) * ms;                 // phase 0
  if (ms < 5) return 30 - ((30 - 10) / 3) * (ms - 2);      // phase 1 notch
  if (ms < 200) return 10 - ((10 - 5) / 195) * (ms - 5);   // phase 2 plateau
  if (ms < 320) return 5 - ((5 - -90) / 120) * (ms - 200); // phase 3 repol
  return -90;                                              // phase 4 rest
}

// SA nodal: NO fast Na+. Slow diastolic depolarization (phase 4) → I_Ca-L upstroke (phase 0) → repol (phase 3).
function saNodalAP(t: number) {
  const ms = t * 1000;
  if (ms < 0) return -60;
  if (ms < 400) return -60 + (20 / 400) * ms;              // phase 4 → threshold
  if (ms < 460) return -40 + (50 / 60) * (ms - 400);       // phase 0 — slow Ca upstroke
  if (ms < 700) return 10 - (70 / 240) * (ms - 460);       // phase 3
  return -60 + (20 / 300) * (ms - 700);                    // phase 4 starts again
}

type Phase = { id: string; title: string; ions: string; body: string };

function ventricularPhase(t: number): Phase {
  const ms = t * 1000;
  if (ms < 2)
    return {
      id: "0",
      title: "Phase 0 — fast Na⁺ upstroke",
      ions: "INa (fast voltage-gated Na⁺) opens; membrane depolarizes −90 → +30 mV in < 2 ms.",
      body: "Voltage-gated Na⁺ channels open, driving rapid depolarization. The QRS complex on the surface ECG reflects this bulk-myocardium wavefront."
    };
  if (ms < 5)
    return {
      id: "1",
      title: "Phase 1 — transient outward",
      ions: "Ito (transient outward K⁺) briefly hyperpolarizes; INa inactivates.",
      body: "Small notch after the upstroke. INa inactivates; a brief outward K⁺ current returns the membrane partway toward 0 mV."
    };
  if (ms < 200)
    return {
      id: "2",
      title: "Phase 2 — calcium plateau",
      ions: "ICa-L (L-type Ca²⁺) inward balances IKr / IKs outward.",
      body: "The hallmark cardiac plateau. Sustained L-type Ca²⁺ influx triggers calcium-induced calcium release from the SR — the contraction signal. Long refractory period prevents tetany."
    };
  if (ms < 320)
    return {
      id: "3",
      title: "Phase 3 — repolarization",
      ions: "IKr and IKs dominate; Ca²⁺ channels close.",
      body: "Delayed-rectifier K⁺ currents drive repolarization. Inscribes the T wave. Long-QT syndromes mutate these channels (HERG → IKr)."
    };
  return {
    id: "4",
    title: "Phase 4 — resting",
    ions: "IK1 (inward rectifier) holds Vm ≈ −90 mV.",
    body: "Resting membrane potential maintained by IK1. Cell awaits the next propagated wavefront."
  };
}

function nodalPhase(t: number): Phase {
  const ms = t * 1000;
  if (ms < 400)
    return {
      id: "4",
      title: "Phase 4 — pacemaker depolarization",
      ions: "If (funny current) + ICa-T drive gradual rise from −60 to threshold (~ −40 mV).",
      body: "If is the molecular basis of autorhythmicity. β-adrenergic tone steepens phase 4 (↑HR); vagal tone flattens it (↓HR). The cell that depolarises fastest is the dominant pacemaker."
    };
  if (ms < 460)
    return {
      id: "0",
      title: "Phase 0 — calcium upstroke",
      ions: "ICa-L drives the upstroke — there is NO fast INa in nodal cells.",
      body: "Threshold reached → L-type Ca²⁺ channels open. The upstroke is much slower than in ventricular cells (~60 ms vs < 2 ms) — explains the deliberate AV nodal delay."
    };
  if (ms < 700)
    return {
      id: "3",
      title: "Phase 3 — repolarization",
      ions: "IK opens; Ca²⁺ channels close.",
      body: "Voltage-gated K⁺ currents repolarize back to ~ −60 mV. No true plateau in nodal cells."
    };
  return {
    id: "4",
    title: "Phase 4 — pacemaker depolarization",
    ions: "If + ICa-T begin diastolic depolarization.",
    body: "Cycle restarts. Spontaneous phase 4 slope sets the cell's intrinsic firing rate."
  };
}

const phaseFn: Record<CellId, (t: number) => Phase> = {
  ventricle: ventricularPhase,
  "sa-nodal": nodalPhase
};

function buildSeries(): CurveSeries[] {
  const ventricularData: CurvePoint[] = [];
  const nodalData: CurvePoint[] = [];
  for (let ms = 0; ms <= 1000; ms += 2) {
    const t = ms / 1000;
    ventricularData.push({ x: t, y: ventricularAP(t) });
    nodalData.push({ x: t, y: saNodalAP(t) });
  }
  return [
    { id: "ventricle", label: "Ventricular AP", colorVar: "var(--ph-curve-1)", data: ventricularData },
    { id: "sa-nodal", label: "SA nodal AP", colorVar: "var(--ph-curve-2)", data: nodalData }
  ];
}

const ALL_TRACES: CellId[] = ["ventricle", "sa-nodal"];

export default function CardiacActionPotentialsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [time, setTime] = useState(() => parseNumber(searchParams.get("t"), 0.15, 0, DURATION));
  const [speed, setSpeed] = useState(() => parseNumber(searchParams.get("speed"), 1, 0.5, 2));
  const [playing, setPlaying] = useState(false);
  const initialFocus = (ALL_TRACES.includes(searchParams.get("focus") as CellId)
    ? (searchParams.get("focus") as CellId)
    : "ventricle") as CellId;
  const [focus, setFocus] = useState<CellId>(initialFocus);
  const [showVent, setShowVent] = useState(() => parseBoolean(searchParams.get("vent"), true));
  const [showNodal, setShowNodal] = useState(() => parseBoolean(searchParams.get("nodal"), true));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("t", time.toFixed(2));
    params.set("speed", String(speed));
    params.set("focus", focus);
    params.set("vent", showVent ? "1" : "0");
    params.set("nodal", showNodal ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [time, speed, focus, showVent, showNodal, currentQuery, pathname, router]);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setTime((current) => {
        const next = current + 0.02 * speed;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(interval);
  }, [playing, speed]);

  const allSeries = useMemo(buildSeries, []);
  const visibleSeries = useMemo(
    () =>
      allSeries.map((series) => ({
        ...series,
        visible: (series.id === "ventricle" && showVent) || (series.id === "sa-nodal" && showNodal)
      })),
    [allSeries, showVent, showNodal]
  );

  const ventV = ventricularAP(time);
  const nodalV = saNodalAP(time);
  const phase = phaseFn[focus](time);

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Cardiac action potentials">
          <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div aria-live="polite" className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
              <p className="ph-section-label">{phase.title}</p>
              <p className="mt-1.5 text-sm text-ph-muted">{phase.body}</p>
              <p className="mt-2 text-sm">
                <span className="font-bold text-ph-text">Ions:</span>{" "}
                <span className="text-ph-muted">{phase.ions}</span>
              </p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">Vent {ventV.toFixed(0)} mV</span>
              <span className="ph-readout">SA {nodalV.toFixed(0)} mV</span>
              <span className="ph-readout">t {(time * 1000).toFixed(0)} ms</span>
              <span className="ph-readout">Phase {phase.id}</span>
            </div>
          </div>

          <Curve
            title="Ventricular vs SA nodal action potential"
            xDomain={[0, DURATION]}
            yDomain={[-100, 40]}
            xLabel="time (s)"
            yLabel="Vm (mV)"
            series={visibleSeries}
            cursorX={time}
            annotations={[
              { x: 0.0, y: -90, label: "rest" },
              { x: 0.1, y: 5, label: "plateau" },
              { x: 0.4, y: -40, label: "nodal threshold" }
            ]}
            height={400}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <ScrubBar
              label="Time scrubber"
              value={time}
              duration={DURATION}
              step={0.005}
              playing={playing}
              speed={speed}
              onChange={(value) => {
                setPlaying(false);
                setTime(value);
              }}
              onPlayingChange={(nextPlaying) => {
                if (time >= DURATION) setTime(0);
                setPlaying(nextPlaying);
              }}
              onSpeedChange={setSpeed}
            />

            <div className="mt-5 grid gap-2">
              <p className="text-sm font-bold">Phase callout cell</p>
              {ALL_TRACES.map((cellId) => (
                <button
                  key={cellId}
                  type="button"
                  onClick={() => setFocus(cellId)}
                  className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                    cellId === focus
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                  }`}
                >
                  <span className="font-bold">{cellId === "ventricle" ? "Ventricular" : "SA nodal"}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              <p className="text-sm font-bold">Traces</p>
              <PerturbationToggle label="Ventricular AP" checked={showVent} onChange={setShowVent} />
              <PerturbationToggle label="SA nodal AP" checked={showNodal} onChange={setShowNodal} />
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
