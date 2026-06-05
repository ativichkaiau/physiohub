"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, Slider, type CurvePoint } from "@/components/widgets/primitives";
import { clamp, lineSeries, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/pv-loop";
const diagram = getDiagramById(DIAGRAM_ID);

type Hemodynamics = {
  edv: number;
  esv: number;
  sv: number;
  ef: number;
  peakPressure: number;
  endDiastolicPressure: number;
  cardiacOutput: number;
};

function computeLoop(preload: number, afterload: number, contractility: number, heartRate: number): Hemodynamics {
  const edv = preload;
  const esv = clamp(92 - contractility * 35 + (afterload - 80) * 0.5, 25, edv - 6);
  const sv = Math.max(0, edv - esv);
  const ef = edv > 0 ? (sv / edv) * 100 : 0;
  const peakPressure = clamp(afterload + 36 * contractility, 60, 165);
  const endDiastolicPressure = clamp(4 + ((edv - 90) ** 2) / 380, 4, 28);
  const cardiacOutput = (sv * heartRate) / 1000;
  return { edv, esv, sv, ef, peakPressure, endDiastolicPressure, cardiacOutput };
}

function loopPoints(values: Hemodynamics): CurvePoint[] {
  const { edv, esv, peakPressure, endDiastolicPressure } = values;
  return lineSeries([
    [esv, 8],
    [edv - 18, endDiastolicPressure + 1],
    [edv, endDiastolicPressure],
    [edv, peakPressure * 0.62],
    [edv - 8, peakPressure],
    [esv + 12, peakPressure * 0.9],
    [esv, peakPressure * 0.45],
    [esv, 8]
  ]);
}

function espvr(contractility: number): CurvePoint[] {
  const slope = 1.05 * contractility;
  return lineSeries([
    [45, 0],
    [145, clamp((145 - 45) * slope, 20, 160)]
  ]);
}

function edpvr(): CurvePoint[] {
  return lineSeries([
    [45, 3],
    [75, 4],
    [105, 7],
    [135, 15],
    [175, 35]
  ]);
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
            <span className="ph-readout">Peak {values.peakPressure.toFixed(0)} mmHg</span>
          </div>
          {edgeState ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: the loop is approaching failed ejection or extreme afterload.
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
              { x: values.edv, y: values.peakPressure * 0.62, label: "AV opens" },
              { x: values.esv, y: values.peakPressure * 0.45, label: "MV opens" }
            ]}
            height={480}
          />
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
