"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, Slider, type CurvePoint } from "@/components/widgets/primitives";
import { clamp, lineSeries, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/pv-loop";
const diagram = getDiagramById(DIAGRAM_ID);

// ESPVR (end-systolic P–V relationship): straight line P = Ees · (V − V0).
// V0 ≈ 15 mL puts the volume-axis intercept in the clinically normal range;
// Ees scales with contractility around a baseline of 2.5 mmHg/mL.
const ESPVR_V0 = 15;
const ESPVR_BASE_SLOPE = 2.5;

// EDPVR (end-diastolic P–V relationship): passive filling pressure rises
// quadratically with volume above ~90 mL. Same formula is used both for the
// reference line and for the loop's MV-closes corner, so they always touch.
function edpvrAt(volume: number) {
  return clamp(4 + ((volume - 90) ** 2) / 380, 3, 50);
}

type Hemodynamics = {
  edv: number;
  esv: number;
  sv: number;
  ef: number;
  peakPressure: number;
  endDiastolicPressure: number;
  endSystolicPressure: number;
  aorticDiastolic: number;
  cardiacOutput: number;
};

function computeLoop(preload: number, afterload: number, contractility: number, heartRate: number): Hemodynamics {
  // ESV is where the ESPVR line meets the end-systolic pressure (≈ aortic
  // pressure at the instant of AV closure ≈ afterload). This pins the loop's
  // top-left corner to the ESPVR by construction.
  const slope = ESPVR_BASE_SLOPE * contractility;
  const edv = preload;
  const aorticDiastolic = afterload;
  const endSystolicPressure = afterload;
  const esv = clamp(ESPVR_V0 + endSystolicPressure / slope, 20, edv - 6);
  const sv = Math.max(0, edv - esv);
  const ef = edv > 0 ? (sv / edv) * 100 : 0;
  // Peak LV pressure during ejection sits above aortic diastolic — this is
  // the systolic blood pressure students recognise on a cuff reading.
  const peakPressure = clamp(afterload * 1.5, 60, 170);
  const endDiastolicPressure = edpvrAt(edv);
  const cardiacOutput = (sv * heartRate) / 1000;
  return {
    edv, esv, sv, ef,
    peakPressure, endDiastolicPressure, endSystolicPressure, aorticDiastolic,
    cardiacOutput
  };
}

function loopPoints(values: Hemodynamics): CurvePoint[] {
  // Walks counterclockwise around the loop:
  //   MV opens (bottom-left) → filling along EDPVR → MV closes (bottom-right)
  //   → IVC (vertical, at EDV) → AV opens (top-right) → ejection arc
  //   → AV closes (top-left, on ESPVR) → IVR (vertical, at ESV) → back to MV opens.
  const { edv, esv, peakPressure, endSystolicPressure, aorticDiastolic } = values;
  const filling: CurvePoint[] = [];
  const steps = 4;
  for (let i = 1; i <= steps; i += 1) {
    const v = esv + ((edv - esv) * i) / steps;
    filling.push({ x: v, y: edpvrAt(v) });
  }
  return [
    { x: esv, y: edpvrAt(esv) },                              // MV opens (bottom-left)
    ...filling,                                               // filling along EDPVR
    { x: edv, y: aorticDiastolic },                           // AV opens (top-right, after IVC)
    { x: edv - (edv - esv) * 0.20, y: peakPressure },         // early peak ejection
    { x: edv - (edv - esv) * 0.55, y: peakPressure },         // peak plateau
    { x: esv + (edv - esv) * 0.20, y: peakPressure * 0.95 },  // late ejection
    { x: esv, y: endSystolicPressure },                       // AV closes (top-left, on ESPVR)
    { x: esv, y: edpvrAt(esv) }                               // IVR back to MV opens
  ];
}

function espvr(contractility: number): CurvePoint[] {
  // Straight line P = slope · (V − V0), drawn from V0 up to the chart top.
  const slope = ESPVR_BASE_SLOPE * contractility;
  const yMax = 170;
  const vMax = Math.min(190, ESPVR_V0 + yMax / slope);
  return lineSeries([
    [ESPVR_V0, 0],
    [vMax, Math.min(yMax, slope * (vMax - ESPVR_V0))]
  ]);
}

function edpvr(): CurvePoint[] {
  // Sampled along edpvrAt so the loop's MV-closes corner sits exactly on this line.
  const samples: Array<[number, number]> = [];
  for (let v = 40; v <= 190; v += 10) {
    samples.push([v, edpvrAt(v)]);
  }
  return lineSeries(samples);
}

export default function PvLoopWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [preload, setPreload] = useState(() => parseNumber(searchParams.get("preload"), 120, 60, 180));
  const [afterload, setAfterload] = useState(() => parseNumber(searchParams.get("afterload"), 80, 50, 130));
  const [contractility, setContractility] = useState(() => parseNumber(searchParams.get("contractility"), 1, 0.5, 2));
  const [heartRate, setHeartRate] = useState(() => parseNumber(searchParams.get("hr"), 72, 40, 180));
  const [baseline, setBaseline] = useState(() => parseBoolean(searchParams.get("baseline"), true));
  const [lines, setLines] = useState(() => parseBoolean(searchParams.get("lines"), true));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ preload, afterload, contractility, heartRate, baseline, lines });

  useEffect(() => {
    stateRef.current = { preload, afterload, contractility, heartRate, baseline, lines };
  }, [afterload, baseline, contractility, heartRate, lines, preload]);

  useEffect(() => {
    const current = stateRef.current;
    const next = {
      preload: parseNumber(searchParams.get("preload"), current.preload, 60, 180),
      afterload: parseNumber(searchParams.get("afterload"), current.afterload, 50, 130),
      contractility: parseNumber(searchParams.get("contractility"), current.contractility, 0.5, 2),
      heartRate: parseNumber(searchParams.get("hr"), current.heartRate, 40, 180),
      baseline: parseBoolean(searchParams.get("baseline"), current.baseline),
      lines: parseBoolean(searchParams.get("lines"), current.lines)
    };
    if (Math.abs(next.preload - current.preload) > 0.1) setPreload(next.preload);
    if (Math.abs(next.afterload - current.afterload) > 0.1) setAfterload(next.afterload);
    if (Math.abs(next.contractility - current.contractility) > 0.001) setContractility(next.contractility);
    if (Math.abs(next.heartRate - current.heartRate) > 0.1) setHeartRate(next.heartRate);
    if (next.baseline !== current.baseline) setBaseline(next.baseline);
    if (next.lines !== current.lines) setLines(next.lines);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("preload", String(Math.round(preload)));
    params.set("afterload", String(Math.round(afterload)));
    params.set("contractility", contractility.toFixed(2));
    params.set("hr", String(Math.round(heartRate)));
    params.set("baseline", baseline ? "1" : "0");
    params.set("lines", lines ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [afterload, baseline, contractility, currentQuery, heartRate, lines, pathname, preload, router]);

  const values = computeLoop(preload, afterload, contractility, heartRate);
  const normal = computeLoop(120, 80, 1, 72);
  const series = useMemo(() => [{ id: "current", label: "Current loop", data: loopPoints(values), colorVar: "var(--ph-curve-1)" }], [values]);
  const referenceSeries = [
    ...(baseline ? [{ id: "baseline", label: "Normal loop", data: loopPoints(normal), colorVar: "var(--ph-curve-ref)", dashed: true }] : []),
    ...(lines
      ? [
          { id: "espvr", label: "ESPVR", data: espvr(contractility), colorVar: "var(--ph-curve-2)", dashed: true },
          { id: "edpvr", label: "EDPVR", data: edpvr(), colorVar: "var(--ph-curve-3)", dashed: true }
        ]
      : [])
  ];
  const edgeState = contractility <= 0.55 || values.sv < 15 || afterload >= 125;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Pressure-volume loop interactive plot">
          <div aria-live="polite" className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">EDV {values.edv.toFixed(0)} mL</span>
            <span className="ph-readout">ESV {values.esv.toFixed(0)} mL</span>
            <span className="ph-readout">SV {values.sv.toFixed(0)} mL</span>
            <span className="ph-readout">EF {values.ef.toFixed(0)}%</span>
            <span className="ph-readout">CO {values.cardiacOutput.toFixed(1)} L/min</span>
            <span className="ph-readout">CI {(values.cardiacOutput / 1.73).toFixed(1)} L/min/m²</span>
            <span className="ph-readout">Peak LV {values.peakPressure.toFixed(0)} mmHg</span>
            <span className="ph-readout">LVEDP {values.endDiastolicPressure.toFixed(0)} mmHg</span>
            {/* Stroke work = SV × MAP proxy = SV × peakP × 0.85, in mL·mmHg → J × 0.000133 */}
            <span className="ph-readout">SW {(values.sv * values.peakPressure * 0.85 * 0.000133).toFixed(2)} J</span>
            {/* MVO2 proxy ≈ HR × peakP × 0.0001 (rate-pressure product) */}
            <span className="ph-readout">RPP {(heartRate * values.peakPressure).toFixed(0)}</span>
            <span className="ph-readout">Ees {(2.5 * contractility).toFixed(1)} mmHg/mL</span>
          </div>
          {edgeState ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {values.sv < 15
                ? "Edge state: SV < 15 mL — cardiogenic shock (CI < 1.5 L/min/m²)."
                : afterload >= 125
                  ? "Edge state: afterload ≥ 125 mmHg — sustained pressure overload drives concentric hypertrophy."
                  : "Edge state: contractility ≤ 0.55 — failing pump on the descending limb of Frank–Starling."}
            </p>
          ) : null}
          <Curve
            title="Left ventricular pressure-volume loop"
            xDomain={[40, 190]}
            yDomain={[0, 170]}
            xLabel="Volume (mL)"
            yLabel="Pressure (mmHg)"
            series={series}
            referenceSeries={referenceSeries}
            annotations={[
              { x: values.edv, y: values.endDiastolicPressure, label: "MV closes" },
              { x: values.edv, y: values.aorticDiastolic, label: "AV opens" },
              { x: values.esv, y: values.endSystolicPressure, label: "AV closes" },
              { x: values.esv, y: edpvrAt(values.esv), label: "MV opens" }
            ]}
            height={480}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"The loop runs counter-clockwise: fill along the bottom (mitral valve open) → squeeze up the right side at fixed volume (isovolumetric contraction) → eject across the top (aortic valve open) → relax down the left side (isovolumetric relaxation). The loop’s width is stroke volume and the enclosed area is stroke work; the ESPVR line is the contractility ceiling each beat reaches."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Preload" value={preload} min={60} max={180} step={1} unit="mL" defaultValue={120} onChange={setPreload} />
              <Slider label="Afterload" value={afterload} min={50} max={130} step={1} unit="mmHg" defaultValue={80} onChange={setAfterload} />
              <Slider label="Contractility" value={contractility} min={0.5} max={2} step={0.01} defaultValue={1} onChange={setContractility} />
              <Slider label="Heart rate" value={heartRate} min={40} max={180} step={1} unit="bpm" defaultValue={72} onChange={setHeartRate} />
              <PerturbationToggle label="Show baseline loop" checked={baseline} onChange={setBaseline} />
              <PerturbationToggle label="Show ESPVR / EDPVR" checked={lines} onChange={setLines} />
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>{reference.source}{reference.pages ? `, ${reference.pages}` : ""}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
