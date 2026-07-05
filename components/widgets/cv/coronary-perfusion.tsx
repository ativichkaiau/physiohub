"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/coronary-perfusion";
const diagram = getDiagramById(DIAGRAM_ID);

const WINDOW_SECONDS = 2.0;

type Params = {
  aoSys: number;       // aortic systolic pressure (mmHg)
  aoDia: number;       // aortic diastolic pressure (mmHg)
  lvedp: number;       // LV end-diastolic pressure (mmHg)
  hr: number;          // heart rate (bpm)
  stenosis: number;    // 0-90% — % luminal narrowing
};

function aorticPressure(t: number, p: Params) {
  const T = 60 / p.hr;
  const ts = 0.32 * T;
  const tCycle = t % T;
  if (tCycle < ts) {
    const x = tCycle / ts;
    return p.aoDia + (p.aoSys - p.aoDia) * Math.sin(Math.PI * x);
  }
  const td = tCycle - ts;
  const notchP = p.aoDia + (p.aoSys - p.aoDia) * 0.30;
  return p.aoDia + (notchP - p.aoDia) * Math.exp(-td / (T * 0.18));
}

function lvPressure(t: number, p: Params) {
  const T = 60 / p.hr;
  const ts = 0.32 * T;
  const tCycle = t % T;
  const ivc = ts * 0.08;
  if (tCycle < ivc) {
    // Isovolumic contraction — LV pressure ramps from LVEDP to ~aortic diastolic.
    return p.lvedp + (p.aoDia - p.lvedp) * (tCycle / ivc);
  }
  if (tCycle < ts) {
    const x = (tCycle - ivc) / (ts - ivc);
    return p.aoDia + (p.aoSys * 1.02 - p.aoDia) * Math.sin(Math.PI * x);
  }
  const td = tCycle - ts;
  const ivrEnd = ts + T * 0.08;
  if (t % T < ivrEnd) {
    // Isovolumic relaxation — pressure decays toward LVEDP.
    const ivrTd = tCycle - ts;
    return Math.max(p.lvedp, p.aoSys * 0.6 * Math.exp(-ivrTd / (T * 0.04)));
  }
  // Filling — slow rise toward LVEDP
  return p.lvedp;
}

// Coronary flow ∝ (Aortic − tissue) / R_coronary.
// Tissue (intramyocardial) pressure tracks LV pressure: high in systole, ~zero in diastole.
// Stenosis adds fixed resistance that caps maximum flow.
function coronaryFlow(t: number, p: Params) {
  const aoP = aorticPressure(t, p);
  const lvP = lvPressure(t, p);
  const drivingPressure = Math.max(0, aoP - 0.85 * lvP);
  const stenosisFactor = 1 / Math.max(0.05, 1 - p.stenosis / 100);
  return clamp(drivingPressure / stenosisFactor * 1.6, 0, 320);
}

function meanFlow(p: Params, samples = 200) {
  const T = 60 / p.hr;
  let sum = 0;
  for (let i = 0; i < samples; i += 1) {
    sum += coronaryFlow((i / samples) * T, p);
  }
  return sum / samples;
}

function perfusionPressure(p: Params) {
  return Math.max(0, p.aoDia - p.lvedp);
}

function maxAttainableFlow(p: Params) {
  // CFR baseline: same params at 0% stenosis — defines maximal possible mean flow.
  return meanFlow({ ...p, stenosis: 0 }) * 4.5;
}

function cfr(p: Params) {
  const max = maxAttainableFlow(p);
  const baseline = meanFlow(p);
  return baseline > 0 ? max / baseline : 0;
}

export default function CoronaryPerfusionWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [aoSys, setAoSys] = useState(() => parseNumber(searchParams.get("aoSys"), 120, 80, 200));
  const [aoDia, setAoDia] = useState(() => parseNumber(searchParams.get("aoDia"), 80, 40, 130));
  const [lvedp, setLvedp] = useState(() => parseNumber(searchParams.get("lvedp"), 8, 2, 35));
  const [hr, setHr] = useState(() => parseNumber(searchParams.get("hr"), 75, 40, 180));
  const [stenosis, setStenosis] = useState(() => parseNumber(searchParams.get("stenosis"), 0, 0, 90));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("aoSys", String(Math.round(aoSys)));
    params.set("aoDia", String(Math.round(aoDia)));
    params.set("lvedp", String(Math.round(lvedp)));
    params.set("hr", String(Math.round(hr)));
    params.set("stenosis", String(Math.round(stenosis)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [aoSys, aoDia, lvedp, hr, stenosis, currentQuery, pathname, router]);

  const p = useMemo<Params>(
    () => ({ aoSys, aoDia, lvedp, hr, stenosis }),
    [aoDia, aoSys, hr, lvedp, stenosis]
  );

  const series: CurveSeries[] = useMemo(() => {
    const ao: { x: number; y: number }[] = [];
    const lv: { x: number; y: number }[] = [];
    for (let t = 0; t <= WINDOW_SECONDS; t += 0.01) {
      ao.push({ x: t, y: aorticPressure(t, p) });
      lv.push({ x: t, y: lvPressure(t, p) });
    }
    return [
      { id: "ao", label: "Aortic pressure", colorVar: "var(--ph-curve-1)", data: ao },
      { id: "lv", label: "LV pressure", colorVar: "var(--ph-curve-2)", data: lv }
    ];
  }, [p]);

  const flowSeries: CurveSeries[] = useMemo(() => {
    const flow: { x: number; y: number }[] = [];
    const flowNoStenosis: { x: number; y: number }[] = [];
    const baseline = { ...p, stenosis: 0 } as Params;
    for (let t = 0; t <= WINDOW_SECONDS; t += 0.01) {
      flow.push({ x: t, y: coronaryFlow(t, p) });
      flowNoStenosis.push({ x: t, y: coronaryFlow(t, baseline) });
    }
    return [
      { id: "flow", label: "Coronary flow", colorVar: "var(--ph-curve-3)", data: flow },
      { id: "flowBaseline", label: "No stenosis", colorVar: "var(--ph-curve-ref)", dashed: true, data: flowNoStenosis }
    ];
  }, [p]);

  const meanQ = meanFlow(p);
  const cfrValue = cfr(p);
  const perfP = perfusionPressure(p);
  const T = 60 / hr;
  const diastoleSeconds = T * 0.68;
  // Rate-pressure product (Robinson index) — clinical bedside proxy for MVO₂.
  // Normal at rest: ~7000–9000; ischemic threshold often quoted ~25,000–30,000.
  const rpp = hr * aoSys;
  // Fractional flow reserve (FFR) proxy: distal-to-aortic pressure ratio at hyperaemia.
  // We approximate FFR ≈ 1 − stenosis fraction (linear simplification).
  const ffr = clamp(1 - stenosis / 100, 0.1, 1);

  // Severity grading (AHA/ESC angiographic categories — simplified):
  const stenosisGrade =
    stenosis < 30
      ? "minor (< 30%)"
      : stenosis < 50
        ? "mild (30–50%)"
        : stenosis < 70
          ? "moderate (50–70%)"
          : stenosis < 90
            ? "severe (70–90%)"
            : "critical (≥ 90%)";

  const state =
    stenosis >= 90
      ? `Critical stenosis (${stenosisGrade}) — FFR ≪ 0.80, ischaemia at rest`
      : ffr < 0.80
        ? `Hemodynamically significant stenosis (FFR ${ffr.toFixed(2)} < 0.80) — revascularization indicated`
        : hr > 130 && lvedp > 18
          ? "Demand ischaemia — tachycardia + high LVEDP collapse diastolic perfusion window"
          : hr > 130
            ? "Tachycardia — diastolic time compressed (every +10 bpm steals ~30 ms of perfusion)"
            : lvedp > 22
              ? "Elevated LVEDP — subendocardial ischaemia risk; LV-Ao gradient reversed in late diastole"
              : aoDia < 50
                ? "Diastolic hypotension — coronary driving pressure collapsed (look for AR / sepsis)"
                : `Normal coronary perfusion (${stenosisGrade})`;

  const warning =
    cfrValue < 2
      ? `Edge state: CFR ${cfrValue.toFixed(1)}× — minimal reserve to increase flow on demand (CFR < 2 predicts MACE).`
      : perfP < 40
        ? "Edge state: coronary perfusion pressure < 40 mmHg — subendocardial ischaemia within minutes."
        : rpp > 30000
          ? "Edge state: rate-pressure product > 30,000 — myocardial O₂ demand exceeds normal supply capacity."
          : ffr < 0.75
            ? `Edge state: FFR ${ffr.toFixed(2)} below the < 0.75 ischaemia threshold — revascularization indicated.`
            : undefined;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Coronary perfusion plots">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{state}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Coronary flow ∝ (aortic − intramyocardial pressure) / resistance. LV systolic pressure compresses intramural vessels, so most coronary flow happens in diastole — and tachycardia, high LVEDP, and stenosis all attack that diastolic perfusion window.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Mean Q {meanQ.toFixed(0)}</span>
            <span className="ph-readout">CFR {cfrValue.toFixed(1)}×</span>
            <span className="ph-readout">FFR {ffr.toFixed(2)}</span>
            <span className="ph-readout">CPP {perfP.toFixed(0)} mmHg</span>
            <span className="ph-readout">RPP {rpp.toFixed(0)}</span>
            <span className="ph-readout">Diastole {(diastoleSeconds * 1000).toFixed(0)} ms</span>
          </div>

          {warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {warning}
            </p>
          ) : null}

          <div className="grid gap-3">
            <Curve
              title="Aortic and LV pressure over the cardiac cycle"
              xDomain={[0, WINDOW_SECONDS]}
              yDomain={[0, 220]}
              xLabel="time (s)"
              yLabel="Pressure (mmHg)"
              series={series}
              height={220}
            />
            <Curve
              title="Coronary flow waveform"
              xDomain={[0, WINDOW_SECONDS]}
              yDomain={[0, 320]}
              xLabel="time (s)"
              yLabel="Flow (arbitrary)"
              series={flowSeries}
              height={200}
            />
          </div>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Line up the two stacked traces in time. During systole the contracting ventricle squeezes its own vessels, so left-coronary flow (bottom) dips even while aortic pressure (top) is high — most perfusion happens in diastole. Anything that shortens diastole (tachycardia) or drops diastolic pressure starves the subendocardium first."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Aortic systolic" value={aoSys} min={80} max={200} step={1} unit="mmHg" defaultValue={120} onChange={setAoSys} />
              <Slider label="Aortic diastolic" value={aoDia} min={40} max={130} step={1} unit="mmHg" defaultValue={80} onChange={setAoDia} />
              <Slider label="LV end-diastolic P" value={lvedp} min={2} max={35} step={1} unit="mmHg" defaultValue={8} onChange={setLvedp} />
              <Slider label="Heart rate" value={hr} min={40} max={180} step={1} unit="bpm" defaultValue={75} onChange={setHr} />
              <Slider label="Stenosis severity" value={stenosis} min={0} max={90} step={1} unit="%" defaultValue={0} onChange={setStenosis} />
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
