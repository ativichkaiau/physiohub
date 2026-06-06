"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "gi/colon-water-electrolyte";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Colonic water + electrolyte handling.
 *   ~1.5 L of fluid enters the colon daily; ~150 mL excreted in stool.
 *   Surface epithelium ENaC (aldosterone-regulated) drives electrogenic Na
 *     reabsorption. Water follows osmotically.
 *   Crypts SECRETE Cl via CFTR — basis of cholera and CF (in CF, opposite —
 *     intestine retains Cl/water).
 *   K is SECRETED in the distal colon via BK channels and ENaC-driven
 *     electrochemical gradient.
 *   Short-chain fatty acids (acetate, propionate, butyrate) from bacterial
 *     fermentation are absorbed via MCT1 — butyrate is the colonocyte's
 *     primary fuel.
 */
function reabsorption(input: number, aldosterone: number, enacDensity: number, motility: number) {
  // Higher motility → less contact time → less reabsorbed.
  const baseEfficiency = 0.92;
  const aldoBoost = ((aldosterone - 100) / 100) * 0.05;
  const enacBoost = ((enacDensity - 100) / 100) * 0.04;
  const motilityPenalty = ((motility - 100) / 100) * 0.20;
  const efficiency = clamp(baseEfficiency + aldoBoost + enacBoost - motilityPenalty, 0.2, 0.99);
  return input * efficiency;
}

function stoolVolume(input: number, aldosterone: number, enacDensity: number, motility: number, cftrActivation: number) {
  const reabsorbed = reabsorption(input, aldosterone, enacDensity, motility);
  const secreted = (cftrActivation / 100) * 500; // ml/day at full CFTR activation (cholera)
  return clamp(input - reabsorbed + secreted, 50, 6000);
}

function stoolK(motility: number, aldosterone: number, stoolVol: number) {
  // K secretion ∝ aldosterone × Na delivery × distal flow.
  return clamp(((aldosterone / 100) * 12 + (motility / 100) * 18) * (stoolVol / 150), 5, 220);
}

export default function ColonWaterElectrolyteWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [input, setInput] = useState(() => parseNumber(searchParams.get("in"), 1500, 200, 6000));
  const [aldosterone, setAldosterone] = useState(() => parseNumber(searchParams.get("aldo"), 100, 0, 250));
  const [enacDensity, setEnacDensity] = useState(() => parseNumber(searchParams.get("enac"), 100, 0, 200));
  const [motility, setMotility] = useState(() => parseNumber(searchParams.get("mot"), 100, 30, 250));
  const [cftrActivation, setCftrActivation] = useState(() => parseNumber(searchParams.get("cftr"), 0, 0, 100));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("in", String(Math.round(input)));
    params.set("aldo", String(Math.round(aldosterone)));
    params.set("enac", String(Math.round(enacDensity)));
    params.set("mot", String(Math.round(motility)));
    params.set("cftr", String(Math.round(cftrActivation)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [input, aldosterone, enacDensity, motility, cftrActivation, currentQuery, pathname, router]);

  const stoolVol = stoolVolume(input, aldosterone, enacDensity, motility, cftrActivation);
  const naReabsorbed = reabsorption(input, aldosterone, enacDensity, motility) * 0.13; // Na ~130 mEq/L proxy
  const kInStool = stoolK(motility, aldosterone, stoolVol);

  const series = useMemo<CurveSeries[]>(() => {
    const range = makeRange(0, 250, 5);
    return [
      {
        id: "aldo-effect",
        label: "Stool volume vs aldosterone",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: range.map((a) => ({ x: a, y: stoolVolume(input, a, enacDensity, motility, cftrActivation) }))
      },
      {
        id: "marker",
        label: "Operating point",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2,
        dashed: true,
        data: [
          { x: aldosterone, y: 0 },
          { x: aldosterone, y: stoolVol }
        ]
      },
      {
        id: "normal",
        label: "Normal stool ~150 mL/day",
        colorVar: "var(--ph-curve-5)",
        dashed: true,
        data: [
          { x: 0, y: 150 },
          { x: 250, y: 150 }
        ]
      }
    ];
  }, [input, enacDensity, motility, cftrActivation, aldosterone, stoolVol]);

  const phenotype = (() => {
    if (cftrActivation > 60) return "Secretory diarrhea — cholera / VIPoma / ETEC pattern";
    if (motility > 200 && cftrActivation < 20) return "High-motility diarrhea — IBS-D, hyperthyroid, post-cholecystectomy";
    if (input > 3500) return "Osmotic / volume-driven diarrhea — laxative abuse, lactose intolerance";
    if (aldosterone < 30 && stoolVol > 300) return "Addison's pattern — Na wasting, hyperkalemia, volume depletion";
    if (aldosterone > 180 && kInStool > 80) return "Hyperaldosteronism / Conn's pattern — K wasting in stool";
    if (stoolVol < 100) return "Hypomotile constipation — opioids, hypothyroid, low-fibre diet";
    return "Normal colonic water + electrolyte balance";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Colon water and electrolyte handling">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              The colon receives ~1.5 L/day and excretes ~150 mL. Aldosterone-regulated ENaC drives Na (and water) reabsorption; K is SECRETED distally; crypts secrete Cl via CFTR (overactivated in cholera, deficient in CF). Bacterial fermentation of fibre → SCFAs (butyrate is the colonocyte&apos;s main fuel).
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Stool {stoolVol.toFixed(0)} mL/day</span>
            <span className="ph-readout">Na reabs {naReabsorbed.toFixed(0)} mEq</span>
            <span className="ph-readout">K stool {kInStool.toFixed(0)} mEq</span>
            <span className="ph-readout">CFTR {cftrActivation.toFixed(0)}%</span>
            <span className="ph-readout">Aldo {aldosterone.toFixed(0)}%</span>
            <span className="ph-readout">ENaC {enacDensity.toFixed(0)}%</span>
            <span className="ph-readout">Motility {motility.toFixed(0)}%</span>
            <span className="ph-readout">In {input.toFixed(0)} mL/day</span>
          </div>

          {stoolVol > 1000 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: stool &gt; 1 L/day — dehydration, hypovolemia, AKI risk. Cholera can produce 1 L/h. Aggressive ORS / IV resuscitation.
            </p>
          ) : null}

          <Curve
            title="Stool volume vs aldosterone — colon's volume-defending lever"
            xDomain={[0, 250]}
            yDomain={[0, 2000]}
            xLabel="aldosterone (% normal)"
            yLabel="stool volume (mL/day)"
            series={series}
            annotations={[
              { x: 100, y: 150, label: "normal" },
              { x: aldosterone, y: stoolVol, label: "current" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Fluid entering colon" value={input} min={200} max={6000} step={50} unit="mL/day" defaultValue={1500} onChange={setInput} />
              <Slider label="Aldosterone (RAAS)" value={aldosterone} min={0} max={250} step={1} unit="% normal" defaultValue={100} onChange={setAldosterone} />
              <Slider label="ENaC density" value={enacDensity} min={0} max={200} step={1} unit="%" defaultValue={100} onChange={setEnacDensity} />
              <Slider label="Colonic motility" value={motility} min={30} max={250} step={1} unit="%" defaultValue={100} onChange={setMotility} />
              <Slider label="CFTR Cl⁻ secretion (cholera)" value={cftrActivation} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setCftrActivation} />
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
