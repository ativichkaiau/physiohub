"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "renal/countercurrent";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Countercurrent multiplier (loop of Henle) builds a corticomedullary
 * gradient that the collecting duct exploits to concentrate urine.
 *
 * KEY DETERMINANTS:
 *   - Thick ascending limb (TAL) NKCC2 pump → puts NaCl into interstitium
 *   - Urea recycling: inner medullary CD → urea into interstitium (ADH-driven UT-A1)
 *   - Vasa recta hairpin → preserves gradient via countercurrent EXCHANGE
 *   - ADH (AVP, vasopressin) → AQP2 insertion in CD principal cells
 *
 * The gradient reaches ~1200 mOsm/kg at the papillary tip in maximally
 * concentrating kidneys (humans). Without ADH, urine osmolality stays near
 * 50–100 mOsm/kg even with normal medulla.
 */
function medullaryOsmolality(depth: number, talFunction: number, ureaRecycling: number, vasaRectaFlow: number) {
  // depth 0 = cortex (300 mOsm), 1 = papillary tip
  const talContribution = 600 * (talFunction / 100);
  const ureaContribution = 300 * (ureaRecycling / 100);
  const maxOsm = 300 + talContribution + ureaContribution;
  // Vasa recta washout: high flow → reduced gradient.
  const washout = clamp(1 - (vasaRectaFlow - 100) / 200, 0.3, 1);
  return 300 + (maxOsm - 300) * Math.pow(depth, 1.3) * washout;
}

function urineOsmolality(adh: number, medullaryGradient: number) {
  // No ADH (DI): urine ~ 60 mOsm/kg (cortex). Max ADH: urine = medullary tip.
  return 60 + (medullaryGradient - 60) * (adh / 100);
}

export default function CountercurrentWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [adh, setAdh] = useState(() => parseNumber(searchParams.get("adh"), 100, 0, 200));
  const [talFunction, setTalFunction] = useState(() => parseNumber(searchParams.get("tal"), 100, 0, 130));
  const [ureaRecycling, setUreaRecycling] = useState(() => parseNumber(searchParams.get("urea"), 100, 0, 130));
  const [vasaRectaFlow, setVasaRectaFlow] = useState(() => parseNumber(searchParams.get("vr"), 100, 50, 250));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("adh", String(Math.round(adh)));
    params.set("tal", String(Math.round(talFunction)));
    params.set("urea", String(Math.round(ureaRecycling)));
    params.set("vr", String(Math.round(vasaRectaFlow)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [adh, talFunction, ureaRecycling, vasaRectaFlow, currentQuery, pathname, router]);

  const tipOsm = medullaryOsmolality(1, talFunction, ureaRecycling, vasaRectaFlow);
  const urineOsm = urineOsmolality(adh, tipOsm);

  const series = useMemo<CurveSeries[]>(() => {
    const depths = makeRange(0, 1, 0.02);
    return [
      {
        id: "medullary",
        label: "Medullary gradient (current)",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: depths.map((d) => ({ x: d, y: medullaryOsmolality(d, talFunction, ureaRecycling, vasaRectaFlow) }))
      },
      {
        id: "normal",
        label: "Normal (TAL 100%, urea 100%, VR 100%)",
        colorVar: "var(--ph-curve-ref)",
        dashed: true,
        data: depths.map((d) => ({ x: d, y: medullaryOsmolality(d, 100, 100, 100) }))
      },
      {
        id: "max",
        label: "Maximum concentrating capacity (theoretical)",
        colorVar: "var(--ph-curve-2)",
        dashed: true,
        data: depths.map((d) => ({ x: d, y: medullaryOsmolality(d, 130, 130, 60) }))
      },
      {
        id: "urine",
        label: "Final urine osmolality (after ADH)",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2,
        data: [
          { x: 0, y: urineOsm },
          { x: 1, y: urineOsm }
        ]
      }
    ];
  }, [talFunction, ureaRecycling, vasaRectaFlow, urineOsm]);

  const phenotype = (() => {
    if (adh < 15 && tipOsm > 700) return "Central / nephrogenic DI — gradient intact but ADH or AQP2 not working → polyuria, dilute urine";
    if (adh > 150 && tipOsm < 700) return "SIADH-like with washout — high ADH but medullary gradient blunted (loops, vasa recta flow up)";
    if (talFunction < 40) return "Loop diuretic effect / Bartter — NKCC2 blocked, gradient collapses, dilute urine";
    if (vasaRectaFlow > 180) return "Medullary washout — diabetic / sickle, high blood flow → gradient lost";
    if (adh > 130 && tipOsm > 900) return "Maximally concentrating — water deprivation / dehydration";
    if (adh < 30) return "Water diuresis — ADH suppressed, dilute urine";
    return "Normal concentrating capacity";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Countercurrent multiplier">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              The corticomedullary gradient (300 → ~1200 mOsm/kg) is built by the TAL pump (NKCC2) and urea recycling (ADH-driven UT-A1). Vasa recta hairpins preserve it via countercurrent EXCHANGE. ADH translocates AQP2 in the collecting duct, letting water exit until urine osmolality equals the medulla.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Tip osm {tipOsm.toFixed(0)} mOsm/kg</span>
            <span className="ph-readout">Urine osm {urineOsm.toFixed(0)} mOsm/kg</span>
            <span className="ph-readout">ADH {adh.toFixed(0)}%</span>
            <span className="ph-readout">TAL {talFunction.toFixed(0)}%</span>
            <span className="ph-readout">Urea {ureaRecycling.toFixed(0)}%</span>
            <span className="ph-readout">Vasa recta {vasaRectaFlow.toFixed(0)}%</span>
            <span className="ph-readout">USG ~{(1 + urineOsm / 30000).toFixed(3)}</span>
            <span className="ph-readout">FF water {((1 - 60 / Math.max(60, urineOsm)) * 100).toFixed(0)}%</span>
          </div>

          {tipOsm < 500 && adh > 100 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: ADH high but medullary gradient collapsed — concentrating capacity lost despite ADH. Look for loop diuretic, papillary necrosis, or chronic interstitial disease.
            </p>
          ) : null}

          <Curve
            title="Medullary osmolality from cortex (0) to papillary tip (1)"
            xDomain={[0, 1]}
            yDomain={[0, 1500]}
            xLabel="depth (cortex → tip)"
            yLabel="osmolality (mOsm/kg)"
            series={series}
            annotations={[
              { x: 1, y: tipOsm, label: "tip" },
              { x: 0.5, y: urineOsm, label: "urine" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Read across the medulla, cortex on the left and papillary tip on the right. Osmolality climbs from about 300 at the cortex to about 1200 at the tip — the gradient the loop of Henle builds and the vasa recta preserve. The steeper this curve, the more concentrated the urine that ADH can produce."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="ADH (AQP2 insertion)" value={adh} min={0} max={200} step={1} unit="% normal" defaultValue={100} onChange={setAdh} />
              <Slider label="TAL NKCC2 function" value={talFunction} min={0} max={130} step={1} unit="%" defaultValue={100} onChange={setTalFunction} />
              <Slider label="Urea recycling (UT-A1)" value={ureaRecycling} min={0} max={130} step={1} unit="%" defaultValue={100} onChange={setUreaRecycling} />
              <Slider label="Vasa recta blood flow" value={vasaRectaFlow} min={50} max={250} step={1} unit="%" defaultValue={100} onChange={setVasaRectaFlow} />
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
