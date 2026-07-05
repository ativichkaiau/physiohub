"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "renal/potassium-handling";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Potassium homeostasis = two-pool problem:
 *   INTERNAL balance (minute-to-minute): insulin, β-agonists, acid-base,
 *     and aldosterone shift K between ICF and ECF.
 *   EXTERNAL balance (hours-to-days): kidney secretes K in the
 *     principal cell at the cortical collecting duct via ROMK,
 *     driven by aldosterone × distal Na delivery × tubular flow.
 *
 * Hyperkalemia (≥ 5.5 mEq/L): ECG → peaked T → wide QRS → sine wave →
 *   asystole. Treat: Ca gluconate (membrane), insulin + dextrose / β-2
 *   agonist (shift), kayexalate / patiromer / dialysis (remove).
 * Hypokalemia (< 3.5 mEq/L): U waves, T flattening, arrhythmia. Replace
 *   slowly; check Mg (K replacement won't work with low Mg).
 */
function renalExcretion(plasmaK: number, aldo: number, distalNa: number, flow: number) {
  // Principal cell K secretion ∝ aldosterone × Na delivery × flow.
  // Baseline excretion at K=4: 60 mEq/day (matches average intake).
  const aldoFactor = aldo / 100;
  const naFactor = distalNa / 100;
  const flowFactor = flow / 100;
  // Slope set so normal K (4 mEq/L) with normal aldo/Na/flow gives ~60 mEq/day
  // — matching average dietary K intake/excretion.
  const drive = (plasmaK - 3) * 60;
  return clamp(drive * aldoFactor * naFactor * flowFactor, 5, 350);
}

function effectivePlasmaK(servedK: number, insulin: number, beta: number, acidShift: number) {
  // Insulin and β-agonists drive K into cells (NaKATPase).
  const intoCell = (insulin / 100) * 0.6 + (beta / 100) * 0.4 - (acidShift / 100) * 0.6;
  return clamp(servedK - intoCell, 1.5, 9);
}

export default function PotassiumHandlingWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [servedK, setServedK] = useState(() => parseNumber(searchParams.get("k"), 4.2, 1.5, 9));
  const [aldo, setAldo] = useState(() => parseNumber(searchParams.get("aldo"), 100, 0, 300));
  const [distalNa, setDistalNa] = useState(() => parseNumber(searchParams.get("na"), 100, 10, 250));
  const [flow, setFlow] = useState(() => parseNumber(searchParams.get("flow"), 100, 20, 250));
  const [insulin, setInsulin] = useState(() => parseNumber(searchParams.get("ins"), 50, 0, 200));
  const [beta, setBeta] = useState(() => parseNumber(searchParams.get("beta"), 50, 0, 200));
  const [acidShift, setAcidShift] = useState(() => parseNumber(searchParams.get("acid"), 0, -100, 200));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("k", servedK.toFixed(1));
    params.set("aldo", String(Math.round(aldo)));
    params.set("na", String(Math.round(distalNa)));
    params.set("flow", String(Math.round(flow)));
    params.set("ins", String(Math.round(insulin)));
    params.set("beta", String(Math.round(beta)));
    params.set("acid", String(Math.round(acidShift)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [servedK, aldo, distalNa, flow, insulin, beta, acidShift, currentQuery, pathname, router]);

  const plasmaK = effectivePlasmaK(servedK, insulin, beta, acidShift);
  const excretion = renalExcretion(plasmaK, aldo, distalNa, flow);

  const series = useMemo<CurveSeries[]>(() => {
    const range = makeRange(2, 8, 0.05);
    return [
      {
        id: "current",
        label: "K excretion vs plasma K (current settings)",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: range.map((k) => ({ x: k, y: renalExcretion(k, aldo, distalNa, flow) }))
      },
      {
        id: "normal",
        label: "Normal handling (aldo 100, Na 100, flow 100)",
        colorVar: "var(--ph-curve-ref)",
        dashed: true,
        data: range.map((k) => ({ x: k, y: renalExcretion(k, 100, 100, 100) }))
      },
      {
        id: "balance",
        label: "Daily K intake ~60 mEq",
        colorVar: "var(--ph-curve-2)",
        dashed: true,
        data: [
          { x: 2, y: 60 },
          { x: 8, y: 60 }
        ]
      },
      {
        id: "marker",
        label: "Operating point",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2,
        data: [
          { x: plasmaK, y: 0 },
          { x: plasmaK, y: excretion }
        ]
      }
    ];
  }, [aldo, distalNa, flow, plasmaK, excretion]);

  const phenotype = (() => {
    // Emergencies first, then etiology-specific patterns, then generic mild
    // ranges — otherwise the specific labels (Conn's, Addison's) are unreachable.
    if (plasmaK >= 6) return "Severe hyperkalemia — emergent: Ca gluconate first (membrane), then insulin+dextrose / β-agonist (shift), then remove";
    if (plasmaK < 3) return "Severe hypokalemia — risk of arrhythmia, weakness, ileus; check Mg, replace K and Mg";
    if (aldo > 200 && plasmaK < 3.5) return "Hyperaldosteronism (Conn's) — HTN + hypokalemia + metabolic alkalosis";
    if (aldo < 25 && plasmaK > 5.5) return "Addison's pattern — hypotension + hyperkalemia + acidosis";
    if (acidShift > 50 && plasmaK > 5.0) return "Acidosis-driven K shift — protons move into cells in exchange for K (DKA, lactic acidosis)";
    if (insulin > 130 && plasmaK < 4) return "Insulin shift — K into cells (treat post-DKA, refeeding); watch for hypokalemia";
    if (plasmaK > 5.5) return "Hyperkalemia — check ECG, drugs (ACEi/ARB/spiro/NSAID), AKI";
    if (plasmaK < 3.5) return "Hypokalemia — most common cause: diuretics (loop / thiazide) or GI loss";
    return "Normokalemic, balanced handling";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Potassium handling">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Two pools: INTERNAL (insulin, β-agonists, acid-base shift K across cell membranes within minutes) and EXTERNAL (renal excretion via principal-cell ROMK, driven by aldosterone × distal Na delivery × flow). Disturb either and plasma [K] swings fast — ECG changes follow immediately.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Plasma K {plasmaK.toFixed(1)} mEq/L</span>
            <span className="ph-readout">Excretion {excretion.toFixed(0)} mEq/day</span>
            <span className="ph-readout">Shift Δ {(servedK - plasmaK).toFixed(2)}</span>
            <span className="ph-readout">Aldo {aldo.toFixed(0)}%</span>
            <span className="ph-readout">Na delivery {distalNa.toFixed(0)}%</span>
            <span className="ph-readout">Flow {flow.toFixed(0)}%</span>
            <span className="ph-readout">Insulin shift {insulin.toFixed(0)}%</span>
            <span className="ph-readout">Acid Δ {acidShift.toFixed(0)}</span>
          </div>

          {plasmaK >= 6.5 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: K ≥ 6.5 mEq/L — ECG changes likely (peaked T, prolonged PR, wide QRS). Immediate: IV calcium gluconate (or chloride if central line), then insulin + dextrose, β-agonist, ± dialysis.
            </p>
          ) : plasmaK < 2.5 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: K &lt; 2.5 mEq/L — U waves, T flattening, arrhythmia risk. Replace IV (no faster than 10–20 mEq/h via peripheral). Check and replace Mg or K won&apos;t hold.
            </p>
          ) : null}

          <Curve
            title="Renal K excretion vs plasma K (sigmoid)"
            xDomain={[2, 8]}
            yDomain={[0, 300]}
            xLabel="plasma [K⁺] (mEq/L)"
            yLabel="renal K excretion (mEq/day)"
            series={series}
            cursorX={plasmaK}
            annotations={[
              { x: 4.0, y: 60, label: "balance" },
              { x: plasmaK, y: excretion, label: "current" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Read plasma potassium left-to-right. Excretion is a steep sigmoid — small rises in plasma K (and the aldosterone they trigger) sharply increase distal secretion, so the kidney dumps potassium fast. The flat low end is why potassium falls slowly, while the steep middle is why hyperkalemia can be corrected quickly."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Served plasma K (before shift)" value={servedK} min={1.5} max={9} step={0.1} unit="mEq/L" defaultValue={4.2} onChange={setServedK} />
              <Slider label="Aldosterone" value={aldo} min={0} max={300} step={1} unit="% normal" defaultValue={100} onChange={setAldo} />
              <Slider label="Distal Na delivery" value={distalNa} min={10} max={250} step={1} unit="%" defaultValue={100} onChange={setDistalNa} />
              <Slider label="Tubular flow" value={flow} min={20} max={250} step={1} unit="%" defaultValue={100} onChange={setFlow} />
              <Slider label="Insulin" value={insulin} min={0} max={200} step={1} unit="%" defaultValue={50} onChange={setInsulin} />
              <Slider label="β-agonist" value={beta} min={0} max={200} step={1} unit="%" defaultValue={50} onChange={setBeta} />
              <Slider label="Acidosis Δ (negative = alkalosis)" value={acidShift} min={-100} max={200} step={1} unit="" defaultValue={0} onChange={setAcidShift} />
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
