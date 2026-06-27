"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "endo/calcium-homeostasis";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Calcium homeostasis revolves around a tight set point (~9.5 mg/dL ionised
 * calcium ≈ 10 mg/dL total) defended by three hormones:
 *   - PTH (parathyroid, fast): rises steeply as Ca falls. Bone resorption,
 *     renal Ca reabsorption (DCT), renal PO4 excretion, and 1α-hydroxylation
 *     of vit D in the kidney.
 *   - Calcitriol (1,25-(OH)2-D, slower): rises with PTH; ↑gut Ca and PO4 absorption.
 *   - Calcitonin (parafollicular C cells, weak / pharmacologic): rises with Ca;
 *     inhibits osteoclasts. Therapeutic in some hypercalcaemia but the loop is
 *     redundant — thyroidectomy doesn't cause hypocalcaemia.
 * FGF23 from bone keeps phosphate in check and inhibits calcitriol.
 */

// PTH curve: steep sigmoid centred on the Ca set point. Adjusted by vit D
// (CYP27B1 / 24-OHase autoregulation) and CKD (FGF23 + reduced kidney mass
// → secondary HPTH).
function pthAt(ca: number, vitD: number, ckd: number) {
  // ca in mg/dL; vitD as % of normal 25-OH-D; ckd as % loss of kidney function 0–90.
  const setPoint = 9.5 - (vitD < 60 ? (60 - vitD) * 0.02 : 0) + ckd * 0.012;
  const slope = 6;
  const basal = 30 + ckd * 1.8;
  return clamp(basal + 250 * (1 / (1 + Math.exp((ca - setPoint) * slope))), 5, 1200);
}

function calcitoninAt(ca: number) {
  // Calcitonin: weak sigmoid rising with Ca above ~9 mg/dL.
  return clamp(8 + 80 / (1 + Math.exp(-(ca - 10) * 4)), 5, 90);
}

function calcitriolAt(ca: number, vitD: number, ckd: number) {
  // Calcitriol depends on PTH (↑1α-hydroxylase), 25-OH-D substrate, and kidney mass.
  const pth = pthAt(ca, vitD, ckd);
  const substrate = vitD / 100;
  const kidneyFactor = 1 - ckd / 100;
  return clamp(35 * substrate * kidneyFactor * (1 + pth / 200), 0, 90);
}

export default function CalciumHomeostasisWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [serumCa, setSerumCa] = useState(() => parseNumber(searchParams.get("ca"), 9.5, 5, 14));
  const [vitD, setVitD] = useState(() => parseNumber(searchParams.get("vitd"), 100, 10, 200));
  const [diet, setDiet] = useState(() => parseNumber(searchParams.get("diet"), 100, 0, 300));
  const [ckd, setCkd] = useState(() => parseNumber(searchParams.get("ckd"), 0, 0, 90));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("ca", serumCa.toFixed(1));
    params.set("vitd", String(Math.round(vitD)));
    params.set("diet", String(Math.round(diet)));
    params.set("ckd", String(Math.round(ckd)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [serumCa, vitD, diet, ckd, currentQuery, pathname, router]);

  const pth = pthAt(serumCa, vitD, ckd);
  const calcitonin = calcitoninAt(serumCa);
  const calcitriol = calcitriolAt(serumCa, vitD, ckd);
  // FGF23: rises with phosphate and CKD; opposes calcitriol.
  const fgf23 = clamp(50 + ckd * 6 + (serumCa < 8 ? 0 : (serumCa - 9) * -8), 30, 1200);
  // Net Ca fluxes (qualitative directions in mg/day, scaled for display):
  const gutAbsorption = clamp(150 + (calcitriol - 35) * 8 + (diet - 100) * 0.8, 0, 800);
  const renalReabsorption = clamp(95 + (pth - 50) * 0.05, 70, 99.5); // percentage
  const boneResorption = clamp(50 + (pth - 50) * 1.2, 0, 600);
  // Net flux into ECF (mg/day proxy):
  const netInto = gutAbsorption + boneResorption - (diet < 60 ? 250 : 200);

  const series = useMemo<CurveSeries[]>(() => {
    const data = (fn: (ca: number) => number) => makeRange(5, 14, 0.1).map((x) => ({ x, y: fn(x) }));
    return [
      {
        id: "pth",
        label: "PTH",
        colorVar: "var(--ph-curve-4)",
        strokeWidth: 3,
        data: data((ca) => pthAt(ca, vitD, ckd))
      },
      {
        id: "calcitriol",
        label: "Calcitriol (1,25-(OH)₂-D)",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2.5,
        data: data((ca) => calcitriolAt(ca, vitD, ckd))
      },
      {
        id: "calcitonin",
        label: "Calcitonin",
        colorVar: "var(--ph-curve-5)",
        strokeWidth: 2,
        data: data((ca) => calcitoninAt(ca))
      }
    ];
  }, [vitD, ckd]);

  const phenotype = (() => {
    if (serumCa < 8 && pth < 30) return "Hypoparathyroidism — ↓Ca with inappropriately low PTH (post-thyroidectomy, DiGeorge)";
    if (serumCa < 8.5 && pth > 80 && calcitriol < 25) return "Vitamin D deficiency / osteomalacia — ↓Ca, ↑PTH, ↓calcitriol";
    if (serumCa > 10.5 && pth > 70) return "Primary hyperparathyroidism — ↑Ca with INAPPROPRIATE ↑PTH";
    if (serumCa < 9 && ckd > 50 && pth > 100) return "Secondary hyperparathyroidism (CKD-MBD) — ↓Ca + retained PO4 + ↓calcitriol";
    if (serumCa > 11.5 && pth < 25) return "PTH-independent hypercalcaemia (malignancy / granuloma / vit D toxicity)";
    if (serumCa > 11) return "Hypercalcaemia — bones, stones, groans, psychiatric overtones";
    if (serumCa < 8.5) return "Hypocalcaemia — perioral / Chvostek / Trousseau / QT prolongation";
    return "Normocalcaemia — set point defended";
  })();

  const warning = (() => {
    if (serumCa > 13) return "Edge state: Ca > 13 mg/dL — hypercalcaemic crisis. IV saline + furosemide + bisphosphonate + calcitonin.";
    if (serumCa < 7) return "Edge state: Ca < 7 mg/dL — risk of tetany, laryngospasm, seizures, prolonged QT → torsades.";
    if (ckd > 75 && pth > 600) return "Edge state: tertiary hyperparathyroidism territory — autonomous parathyroid hyperplasia post-CKD.";
    return undefined;
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Calcium hormonal response curves">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Three hormones defend a ~10 mg/dL set point. PTH (fast, steep) rises as Ca falls — bone resorption + DCT reabsorption + renal 1α-hydroxylation of vit D. Calcitriol takes hours and amplifies gut absorption. Calcitonin rises with Ca but is therapeutically and physiologically weak. FGF23 from bone counter-regulates phosphate and calcitriol.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Ca {serumCa.toFixed(1)} mg/dL</span>
            <span className="ph-readout">PTH {pth.toFixed(0)} pg/mL</span>
            <span className="ph-readout">Calcitriol {calcitriol.toFixed(0)} pg/mL</span>
            <span className="ph-readout">Calcitonin {calcitonin.toFixed(0)} pg/mL</span>
            <span className="ph-readout">FGF23 {fgf23.toFixed(0)} RU/mL</span>
            <span className="ph-readout">Gut Ca {gutAbsorption.toFixed(0)} mg/d</span>
            <span className="ph-readout">Bone Ca {boneResorption.toFixed(0)} mg/d</span>
            <span className="ph-readout">DCT reabs {renalReabsorption.toFixed(1)}%</span>
          </div>

          {warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {warning}
            </p>
          ) : null}

          <Curve
            title="PTH · Calcitriol · Calcitonin response to serum calcium"
            xDomain={[5, 14]}
            yDomain={[0, 350]}
            xLabel="serum Ca (mg/dL)"
            yLabel="hormone level"
            series={series}
            cursorX={serumCa}
            annotations={[
              { x: 9.5, y: 60, label: "set point" },
              { x: serumCa, y: pth, label: "PTH op." },
              { x: serumCa, y: calcitriol, label: "calcitriol" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Read serum calcium left-to-right. As calcium FALLS, PTH rises to pull it back up — freeing bone calcium, reclaiming it in the kidney, and switching on calcitriol to absorb more from gut. As calcium climbs too HIGH, calcitonin opposes. The hormones are mirror-image guardians that clamp calcium in a narrow band."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Serum Ca (operating point)" value={serumCa} min={5} max={14} step={0.1} unit="mg/dL" defaultValue={9.5} onChange={setSerumCa} />
              <Slider label="25-OH-vitamin D" value={vitD} min={10} max={200} step={1} unit="% normal" defaultValue={100} onChange={setVitD} />
              <Slider label="Dietary Ca intake" value={diet} min={0} max={300} step={1} unit="% RDA" defaultValue={100} onChange={setDiet} />
              <Slider label="CKD severity (% renal loss)" value={ckd} min={0} max={90} step={1} unit="%" defaultValue={0} onChange={setCkd} />
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
