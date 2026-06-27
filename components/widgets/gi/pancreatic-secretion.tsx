"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "gi/pancreatic-secretion";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Pancreatic exocrine output has two components:
 *   ACINAR cells — enzymes (amylase, lipase, proteases as zymogens, RNase).
 *     Driven by CCK + vagal ACh (cephalic phase). Secretion is small volume,
 *     enzyme-rich, low HCO3.
 *   DUCTAL cells — HCO3 + water. Driven by SECRETIN (from S-cells in
 *     response to duodenal acid pH < 4.5). Secretion is large volume,
 *     enzyme-poor, high HCO3 (up to 145 mEq/L at max flow).
 *
 * As flow rate rises, [HCO3] rises and [Cl-] falls (the Cl/HCO3 exchanger
 * in the ductal lumen has less time to swap HCO3 back for Cl). This is
 * Cl ↔ HCO3 reciprocal regulation — classic medical school chart.
 */
function enzymeOutput(cck: number, vagal: number) {
  return clamp(20 + cck * 0.7 + vagal * 0.4, 0, 220);
}

function bicarbOutput(secretin: number, ductalFunction: number) {
  return clamp((secretin * 0.9 + 10) * (ductalFunction / 100), 0, 220);
}

function flowRate(secretin: number, cck: number, ductalFunction: number) {
  return clamp(((secretin * 0.7 + cck * 0.2 + 5) * (ductalFunction / 100)) * 0.05, 0, 6);
}

function bicarbAtFlow(flow: number) {
  // Sigmoid: low flow → ~30 mEq/L (close to plasma); high flow → ~140 mEq/L.
  return clamp(30 + 110 * (flow / (flow + 0.8)), 25, 145);
}

function chlorideAtFlow(flow: number) {
  return clamp(150 - bicarbAtFlow(flow), 5, 130);
}

export default function PancreaticSecretionWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [cck, setCck] = useState(() => parseNumber(searchParams.get("cck"), 30, 0, 200));
  const [secretin, setSecretin] = useState(() => parseNumber(searchParams.get("sec"), 30, 0, 200));
  const [vagal, setVagal] = useState(() => parseNumber(searchParams.get("vagal"), 50, 0, 200));
  const [ductalFunction, setDuctalFunction] = useState(() => parseNumber(searchParams.get("duct"), 100, 0, 130));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("cck", String(Math.round(cck)));
    params.set("sec", String(Math.round(secretin)));
    params.set("vagal", String(Math.round(vagal)));
    params.set("duct", String(Math.round(ductalFunction)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [cck, secretin, vagal, ductalFunction, currentQuery, pathname, router]);

  const enzymes = enzymeOutput(cck, vagal);
  const bicarb = bicarbOutput(secretin, ductalFunction);
  const flow = flowRate(secretin, cck, ductalFunction);

  const series = useMemo<CurveSeries[]>(() => {
    const range = makeRange(0, 5, 0.05);
    return [
      {
        id: "hco3",
        label: "[HCO₃⁻] (mEq/L)",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: range.map((f) => ({ x: f, y: bicarbAtFlow(f) }))
      },
      {
        id: "cl",
        label: "[Cl⁻] (mEq/L)",
        colorVar: "var(--ph-curve-4)",
        strokeWidth: 3,
        data: range.map((f) => ({ x: f, y: chlorideAtFlow(f) }))
      },
      {
        id: "current",
        label: "Operating point (flow)",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2,
        dashed: true,
        data: [
          { x: flow, y: 0 },
          { x: flow, y: 160 }
        ]
      }
    ];
  }, [flow]);

  const phenotype = (() => {
    if (ductalFunction < 30) return "Chronic pancreatitis / CF — ↓ductal flow + ↓HCO₃⁻ → acid duodenal pH inactivates enzymes";
    if (cck > 130 && secretin > 130) return "Fed mixed meal — both axes engaged (HCO₃⁻ + enzymes high)";
    if (cck > 130 && secretin < 60) return "Protein/fat meal predominant — CCK-driven enzyme phase";
    if (secretin > 130 && cck < 60) return "Acid-driven secretin phase — HCO₃⁻ neutralisation dominant";
    if (vagal > 120 && cck < 30) return "Cephalic phase — vagal priming, small enzyme output";
    return "Inter-prandial baseline";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Pancreatic secretion HCO3 vs Cl reciprocal">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Acinar cells make enzymes (CCK + vagal); ductal cells make HCO₃⁻ (secretin). As flow rises, [HCO₃⁻] rises and [Cl⁻] falls reciprocally — the duct&apos;s Cl⁻/HCO₃⁻ exchanger has less time to swap HCO₃⁻ back at high flow.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Flow {flow.toFixed(2)} mL/min</span>
            <span className="ph-readout">Enzymes {enzymes.toFixed(0)}</span>
            <span className="ph-readout">[HCO₃⁻] {bicarbAtFlow(flow).toFixed(0)} mEq/L</span>
            <span className="ph-readout">[Cl⁻] {chlorideAtFlow(flow).toFixed(0)} mEq/L</span>
            <span className="ph-readout">CCK {cck.toFixed(0)}</span>
            <span className="ph-readout">Secretin {secretin.toFixed(0)}</span>
            <span className="ph-readout">Vagal {vagal.toFixed(0)}</span>
            <span className="ph-readout">Ductal fn {ductalFunction.toFixed(0)}%</span>
          </div>

          {ductalFunction < 25 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: ductal function &lt; 25% — steatorrhea, fat-soluble vitamin deficiency, acid duodenum prevents micelle formation. Treat with enzyme replacement + PPI.
            </p>
          ) : null}

          <Curve
            title="[HCO₃⁻] and [Cl⁻] vs flow rate — reciprocal relationship"
            xDomain={[0, 5]}
            yDomain={[0, 160]}
            xLabel="flow rate (mL/min)"
            yLabel="concentration (mEq/L)"
            series={series}
            cursorX={flow}
            annotations={[
              { x: 0, y: 30, label: "low flow" },
              { x: 4.5, y: 140, label: "max HCO₃⁻" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="CCK (fat / protein in duodenum)" value={cck} min={0} max={200} step={1} unit="% basal" defaultValue={30} onChange={setCck} />
              <Slider label="Secretin (acid in duodenum)" value={secretin} min={0} max={200} step={1} unit="% basal" defaultValue={30} onChange={setSecretin} />
              <Slider label="Vagal tone (cephalic phase)" value={vagal} min={0} max={200} step={1} unit="%" defaultValue={50} onChange={setVagal} />
              <Slider label="Ductal function" value={ductalFunction} min={0} max={130} step={1} unit="% normal" defaultValue={100} onChange={setDuctalFunction} />
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
