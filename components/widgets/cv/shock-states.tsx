"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/shock-states";
const diagram = getDiagramById(DIAGRAM_ID);

type ShockId = "hypovolemic" | "cardiogenic" | "distributive" | "obstructive";

type HemodynamicState = {
  co: number;
  svr: number;
  cvp: number;
  pcwp: number;
  svo2: number;
  lactate: number;
};

type ShockProfile = {
  id: ShockId;
  label: string;
  mechanism: string;
  exam: string;
  base: HemodynamicState;
};

const normal: HemodynamicState = {
  co: 5,
  svr: 1000,
  cvp: 5,
  pcwp: 8,
  svo2: 75,
  lactate: 1.1
};

const profiles: ShockProfile[] = [
  {
    id: "hypovolemic",
    label: "Hypovolemic",
    mechanism: "Low preload from hemorrhage or fluid loss. CO falls; SVR rises through sympathetic compensation.",
    exam: "Low CVP / PCWP, narrow pulse pressure, cool extremities, tachycardia.",
    base: { co: 2.4, svr: 1700, cvp: 1, pcwp: 3, svo2: 48, lactate: 4.8 }
  },
  {
    id: "cardiogenic",
    label: "Cardiogenic",
    mechanism: "Pump failure. Filling pressures rise while forward CO collapses; SVR rises reflexively.",
    exam: "High PCWP, pulmonary edema, cool extremities, low pulse pressure.",
    base: { co: 2.1, svr: 1600, cvp: 13, pcwp: 24, svo2: 46, lactate: 5.2 }
  },
  {
    id: "distributive",
    label: "Distributive",
    mechanism: "Loss of vascular tone, classically sepsis or anaphylaxis. SVR falls and CO may be high early.",
    exam: "Warm extremities early, wide pulse pressure, low SVR, high or normal CO.",
    base: { co: 7.2, svr: 430, cvp: 4, pcwp: 7, svo2: 82, lactate: 3.8 }
  },
  {
    id: "obstructive",
    label: "Obstructive",
    mechanism: "Mechanical block to filling or ejection, such as tamponade, massive PE, or tension pneumothorax.",
    exam: "High CVP with low CO; PCWP depends on the obstruction site. JVP is often prominent.",
    base: { co: 2.5, svr: 1500, cvp: 18, pcwp: 8, svo2: 45, lactate: 4.5 }
  }
];

function getProfile(id: string | null) {
  return profiles.find((profile) => profile.id === id) ?? profiles[0];
}

function mix(a: number, b: number, ratio: number) {
  return a + (b - a) * ratio;
}

function calculateState(profile: ShockProfile, severity: number, fluids: number, pressor: number, inotropy: number): HemodynamicState {
  const s = severity / 100;
  const f = fluids / 100;
  const p = pressor / 100;
  const i = inotropy / 100;

  const state: HemodynamicState = {
    co: mix(normal.co, profile.base.co, s),
    svr: mix(normal.svr, profile.base.svr, s),
    cvp: mix(normal.cvp, profile.base.cvp, s),
    pcwp: mix(normal.pcwp, profile.base.pcwp, s),
    svo2: mix(normal.svo2, profile.base.svo2, s),
    lactate: mix(normal.lactate, profile.base.lactate, s)
  };

  if (profile.id === "hypovolemic") {
    state.co += f * 1.8 + i * 0.4;
    state.cvp += f * 5;
    state.pcwp += f * 4;
    state.svr += p * 180;
  }

  if (profile.id === "cardiogenic") {
    state.co += i * 1.5 - p * 0.25;
    state.cvp += f * 2;
    state.pcwp += f * 5;
    state.svr += p * 220;
  }

  if (profile.id === "distributive") {
    state.co += f * 0.6 + i * 0.4;
    state.svr += p * 620;
    state.cvp += f * 3;
    state.pcwp += f * 2;
  }

  if (profile.id === "obstructive") {
    state.co += f * 0.35 + i * 0.35;
    state.cvp += f * 2;
    state.svr += p * 190;
  }

  const delivery = state.co * 1.34 * 13.5 * 0.98;
  state.svo2 = clamp(state.svo2 + (delivery - 90) * 0.35 + f * 5 + i * 4 - p * 1.5, 25, 92);
  state.lactate = clamp(state.lactate - f * 0.7 - i * 0.8 - (profile.id === "distributive" ? p * 0.4 : 0), 0.8, 9);

  return {
    co: clamp(state.co, 0.8, 10),
    svr: clamp(state.svr, 250, 2300),
    cvp: clamp(state.cvp, 0, 25),
    pcwp: clamp(state.pcwp, 2, 35),
    svo2: clamp(state.svo2, 25, 92),
    lactate: clamp(state.lactate, 0.8, 9)
  };
}

function mapFromState(state: HemodynamicState) {
  return clamp((state.co * state.svr) / 80, 35, 155);
}

function stateLabel(state: HemodynamicState, profile: ShockProfile) {
  const map = mapFromState(state);
  if (map < 60 || state.lactate > 5.5) return "Decompensated shock";
  if (profile.id === "distributive" && state.svr < 650) return "Vasodilatory shock";
  if (profile.id === "cardiogenic" && state.pcwp > 20) return "Congested low-output shock";
  if (profile.id === "obstructive" && state.cvp > 14) return "Obstructed preload / outflow";
  if (profile.id === "hypovolemic" && state.cvp < 3) return "Volume-depleted shock";
  return "Partially compensated";
}

export default function ShockStatesWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [profile, setProfile] = useState(() => getProfile(searchParams.get("type")));
  const [severity, setSeverity] = useState(() => parseNumber(searchParams.get("severity"), 65, 0, 100));
  const [fluids, setFluids] = useState(() => parseNumber(searchParams.get("fluids"), 0, 0, 100));
  const [pressor, setPressor] = useState(() => parseNumber(searchParams.get("pressor"), 0, 0, 100));
  const [inotropy, setInotropy] = useState(() => parseNumber(searchParams.get("inotropy"), 0, 0, 100));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const nextProfile = getProfile(searchParams.get("type"));
    if (nextProfile.id !== profile.id) setProfile(nextProfile);
    const nextSeverity = parseNumber(searchParams.get("severity"), severity, 0, 100);
    const nextFluids = parseNumber(searchParams.get("fluids"), fluids, 0, 100);
    const nextPressor = parseNumber(searchParams.get("pressor"), pressor, 0, 100);
    const nextInotropy = parseNumber(searchParams.get("inotropy"), inotropy, 0, 100);
    if (Math.abs(nextSeverity - severity) > 0.1) setSeverity(nextSeverity);
    if (Math.abs(nextFluids - fluids) > 0.1) setFluids(nextFluids);
    if (Math.abs(nextPressor - pressor) > 0.1) setPressor(nextPressor);
    if (Math.abs(nextInotropy - inotropy) > 0.1) setInotropy(nextInotropy);
  }, [fluids, inotropy, pressor, profile.id, searchParams, severity]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("type", profile.id);
    params.set("severity", String(Math.round(severity)));
    params.set("fluids", String(Math.round(fluids)));
    params.set("pressor", String(Math.round(pressor)));
    params.set("inotropy", String(Math.round(inotropy)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [currentQuery, fluids, inotropy, pathname, pressor, profile.id, router, severity]);

  const state = calculateState(profile, severity, fluids, pressor, inotropy);
  const untreated = calculateState(profile, severity, 0, 0, 0);
  const map = mapFromState(state);
  const trajectory: CurveSeries[] = useMemo(
    () => [
      {
        id: "trajectory",
        label: "Current trajectory",
        colorVar: "var(--ph-curve-1)",
        data: [
          { x: normal.svr, y: normal.co },
          { x: untreated.svr, y: untreated.co },
          { x: state.svr, y: state.co }
        ]
      },
      {
        id: "normal",
        label: "Normal",
        colorVar: "var(--ph-curve-ref)",
        dashed: true,
        data: [
          { x: normal.svr - 1, y: normal.co },
          { x: normal.svr + 1, y: normal.co }
        ]
      }
    ],
    [state.co, state.svr, untreated.co, untreated.svr]
  );

  const warning =
    map < 55
      ? "Edge state: MAP is critically low. This model is showing a decompensated shock state."
      : state.lactate > 5
        ? "Edge state: lactate remains high, suggesting persistent oxygen debt despite compensation."
        : undefined;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${profile.label} shock state space`}>
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{profile.label} — {stateLabel(state, profile)}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{profile.mechanism}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Bedside pattern:</span>{" "}
              <span className="text-ph-muted">{profile.exam}</span>
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">MAP {map.toFixed(0)} mmHg</span>
            <span className="ph-readout">CO {state.co.toFixed(1)} L/min</span>
            <span className="ph-readout">SVR {state.svr.toFixed(0)}</span>
            <span className="ph-readout">SvO2 {state.svo2.toFixed(0)}%</span>
            <span className="ph-readout">CVP {state.cvp.toFixed(0)}</span>
            <span className="ph-readout">PCWP {state.pcwp.toFixed(0)}</span>
            <span className="ph-readout">Lactate {state.lactate.toFixed(1)}</span>
          </div>

          {warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {warning}
            </p>
          ) : null}

          <Curve
            title="Shock hemodynamic state space"
            xDomain={[250, 2300]}
            yDomain={[0, 10]}
            xLabel="SVR (dyn·s/cm5)"
            yLabel="Cardiac output (L/min)"
            series={trajectory}
            annotations={[
              { x: normal.svr, y: normal.co, label: "normal" },
              { x: state.svr, y: state.co, label: profile.label }
            ]}
            height={430}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Shock phenotype">
            <h2 className="ph-section-label mb-4">Shock phenotype</h2>
            <div className="grid gap-2">
              {profiles.map((item) => {
                const selected = item.id === profile.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProfile(item)}
                    className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Shock severity" value={severity} min={0} max={100} step={1} unit="%" defaultValue={65} onChange={setSeverity} />
              <Slider label="Fluids" value={fluids} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setFluids} />
              <Slider label="Vasopressor" value={pressor} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setPressor} />
              <Slider label="Inotropy" value={inotropy} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setInotropy} />
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
