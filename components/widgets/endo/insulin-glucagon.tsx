"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "endo/insulin-glucagon";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Insulin and glucagon are reciprocally regulated by plasma glucose at the
 * pancreatic islet. The ratio (not the absolute level) sets hepatic glucose
 * output, peripheral uptake, lipolysis, and ketogenesis.
 *
 * Fed:    high glucose → high insulin / low glucagon → net glucose disposal
 * Fasted: low glucose → low insulin / high glucagon → hepatic glucose output
 * T1DM:   no β-cell insulin → unopposed glucagon → DKA
 * T2DM:   insulin resistance + late β-cell failure
 */

function betaResponse(glucose: number, betaFn: number) {
  // β-cell insulin secretion: sigmoidal with K_m ~7 mM (~125 mg/dL).
  // Threshold ~ 100 mg/dL; saturates ~ 250.
  return clamp((betaFn / 100) * 130 / (1 + Math.exp(-(glucose - 125) / 18)), 0, 220);
}

function alphaResponse(glucose: number, alphaFn: number) {
  // α-cell glucagon secretion: inverse sigmoid, baseline ~80 pg/mL at euglycemia,
  // 250+ in hypoglycemia.
  return clamp((alphaFn / 100) * (40 + 220 / (1 + Math.exp((glucose - 80) / 14))), 0, 320);
}

function insulinAction(insulin: number, insulinSens: number) {
  // Effective insulin signal at peripheral tissues.
  return insulin * (insulinSens / 100);
}

function hepaticGlucoseOutput(insulin: number, glucagon: number, insulinSens: number) {
  // Net hepatic glucose output (mg/min). Liver releases ~150 mg/min in fast;
  // suppressed below 0 (net uptake) when insulin dominates.
  const insulinEff = insulinAction(insulin, insulinSens);
  const ratio = glucagon / Math.max(1, insulinEff);
  return clamp(80 * (ratio - 1.2), -180, 280);
}

function peripheralUptake(insulin: number, insulinSens: number, glucose: number) {
  // GLUT4 translocation in muscle + adipose. Scales with insulin·sensitivity·glucose.
  const insulinEff = insulinAction(insulin, insulinSens);
  return clamp((insulinEff / 100) * (glucose / 100) * 220, 0, 400);
}

export default function InsulinGlucagonWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [glucose, setGlucose] = useState(() => parseNumber(searchParams.get("glu"), 95, 30, 500));
  const [betaFn, setBetaFn] = useState(() => parseNumber(searchParams.get("beta"), 100, 0, 130));
  const [alphaFn, setAlphaFn] = useState(() => parseNumber(searchParams.get("alpha"), 100, 0, 150));
  const [insulinSens, setInsulinSens] = useState(() => parseNumber(searchParams.get("sens"), 100, 20, 150));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("glu", String(Math.round(glucose)));
    params.set("beta", String(Math.round(betaFn)));
    params.set("alpha", String(Math.round(alphaFn)));
    params.set("sens", String(Math.round(insulinSens)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [glucose, betaFn, alphaFn, insulinSens, currentQuery, pathname, router]);

  const insulin = betaResponse(glucose, betaFn);
  const glucagon = alphaResponse(glucose, alphaFn);
  const insulinEff = insulinAction(insulin, insulinSens);
  const ratio = insulinEff > 0 ? insulin / Math.max(1, glucagon) : 0;
  const hgo = hepaticGlucoseOutput(insulin, glucagon, insulinSens);
  const uptake = peripheralUptake(insulin, insulinSens, glucose);

  // Ketogenesis proxy — glucagon dominant + low insulin → β-oxidation → ketones.
  const ketones = clamp((glucagon - insulinEff) * 0.02 + (insulinEff < 5 && glucagon > 150 ? 4 : 0), 0, 10);

  const series = useMemo<CurveSeries[]>(() => {
    const range = makeRange(30, 500, 4);
    return [
      {
        id: "insulin",
        label: "Insulin",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: range.map((g) => ({ x: g, y: betaResponse(g, betaFn) }))
      },
      {
        id: "glucagon",
        label: "Glucagon",
        colorVar: "var(--ph-curve-2)",
        strokeWidth: 3,
        data: range.map((g) => ({ x: g, y: alphaResponse(g, alphaFn) }))
      },
      {
        id: "hgo",
        label: "Hepatic glucose output",
        colorVar: "var(--ph-curve-4)",
        strokeWidth: 2,
        dashed: true,
        data: range.map((g) => ({
          x: g,
          y: clamp(120 + hepaticGlucoseOutput(betaResponse(g, betaFn), alphaResponse(g, alphaFn), insulinSens) * 0.6, 0, 280)
        }))
      },
      {
        id: "uptake",
        label: "Peripheral uptake",
        colorVar: "var(--ph-curve-6)",
        strokeWidth: 2,
        dashed: true,
        data: range.map((g) => ({
          x: g,
          y: clamp(peripheralUptake(betaResponse(g, betaFn), insulinSens, g) * 0.6, 0, 280)
        }))
      }
    ];
  }, [betaFn, alphaFn, insulinSens]);

  const phenotype = (() => {
    if (betaFn < 10 && glucose > 180) return "Type 1 DM — no β-cell insulin, unopposed glucagon → DKA risk";
    if (insulinSens < 60 && betaFn > 90 && glucose > 130) return "Insulin resistance (T2DM early) — hyperinsulinemia with hyperglycemia";
    if (insulinSens < 60 && betaFn < 60 && glucose > 200) return "T2DM with β-cell exhaustion — both insulin secretion and sensitivity impaired";
    if (alphaFn < 30 && glucose < 60) return "Glucagonopenia — impaired counter-regulation, severe hypoglycemia risk";
    if (glucose < 50) return "Severe hypoglycemia (Whipple's triad criteria) — sympathoadrenal + neuroglycopenic Sx";
    if (glucose > 250 && insulin < 5) return "Diabetic ketoacidosis territory — glucagon : insulin > 5";
    if (glucose < 80 && glucagon > 180) return "Fasted state — α-cell dominant, hepatic gluconeogenesis active";
    if (glucose > 140 && insulin > 80) return "Post-prandial fed state — β-cell dominant, peripheral glucose disposal";
    return "Euglycemia — balanced islet output";
  })();

  const warning = (() => {
    if (glucose > 350 && ketones > 5) return "Edge state: DKA / HHS spectrum — IV insulin + fluids + K⁺ replacement; correct osmolality slowly.";
    if (glucose < 50) return "Edge state: serum glucose < 50 mg/dL — neuroglycopenia; IV dextrose or glucagon (IM/SC) immediately.";
    if (ratio > 8 && glucose < 70 && insulinSens > 80) return "Edge state: insulinoma profile — fasting hypoglycemia + inappropriately high insulin + C-peptide.";
    return undefined;
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Insulin-glucagon dual regulation">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Insulin (β-cells) and glucagon (α-cells) are RECIPROCALLY regulated by plasma glucose at the islet. The RATIO sets hepatic glucose output, peripheral uptake, lipolysis, and ketogenesis — not the absolute level. Insulin dominates after meals (anabolic); glucagon dominates between meals (catabolic). T1DM = no insulin; T2DM = insulin resistance + late β-cell failure.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Glucose {glucose.toFixed(0)} mg/dL</span>
            <span className="ph-readout">Insulin {insulin.toFixed(0)} μU/mL</span>
            <span className="ph-readout">Glucagon {glucagon.toFixed(0)} pg/mL</span>
            <span className="ph-readout">I:G ratio {ratio.toFixed(2)}</span>
            <span className="ph-readout">HGO {hgo.toFixed(0)} mg/min</span>
            <span className="ph-readout">Uptake {uptake.toFixed(0)}</span>
            <span className="ph-readout">Effective I {insulinEff.toFixed(0)}</span>
            <span className="ph-readout">Ketones {ketones.toFixed(1)} mmol/L</span>
          </div>

          {warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {warning}
            </p>
          ) : null}

          <Curve
            title="Insulin · Glucagon · Hepatic output · Peripheral uptake vs plasma glucose"
            xDomain={[30, 500]}
            yDomain={[0, 320]}
            xLabel="plasma glucose (mg/dL)"
            yLabel="hormone / flux"
            series={series}
            cursorX={glucose}
            annotations={[
              { x: 95, y: 60, label: "fasting" },
              { x: glucose, y: insulin, label: "I" },
              { x: glucose, y: glucagon, label: "G" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Plasma glucose" value={glucose} min={30} max={500} step={1} unit="mg/dL" defaultValue={95} onChange={setGlucose} />
              <Slider label="β-cell function" value={betaFn} min={0} max={130} step={1} unit="%" defaultValue={100} onChange={setBetaFn} />
              <Slider label="α-cell function" value={alphaFn} min={0} max={150} step={1} unit="%" defaultValue={100} onChange={setAlphaFn} />
              <Slider label="Insulin sensitivity" value={insulinSens} min={20} max={150} step={1} unit="%" defaultValue={100} onChange={setInsulinSens} />
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
