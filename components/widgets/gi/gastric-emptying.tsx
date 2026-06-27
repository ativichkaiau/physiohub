"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "gi/gastric-emptying";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Gastric emptying — first-order exponential decay for liquids; sigmoidal
 * (lag + linear) for solids. Rate set by:
 *   ANTRAL pump strength (vagal + intrinsic),
 *   PYLORIC sphincter tone,
 *   DUODENAL feedback (CCK from fat / aa; secretin from acid; GIP; PYY).
 *
 * Fat is the slowest macronutrient to empty — CCK delays emptying and
 * stimulates pancreatic + biliary secretion to handle it. Liquids empty
 * fastest because no triturition required.
 *
 * Gastroparesis (diabetic, post-vagotomy, idiopathic): half-emptying time
 * > 90 min on solid scintigraphy.
 */
function emptyingFraction(time: number, halfTime: number, lagPhase: number) {
  if (time <= lagPhase) return 1;
  const t = time - lagPhase;
  return Math.exp(-Math.log(2) * (t / halfTime));
}

function halfTime(antralPump: number, pyloric: number, duoFeedback: number, fatPercent: number) {
  // Normal liquid t1/2 ≈ 12 min, solid ≈ 45 min. Fat extends solid to 60–90.
  const base = 45 + fatPercent * 0.45;
  return clamp(
    base * (100 / Math.max(20, antralPump)) * (1 + pyloric / 200) * (1 + duoFeedback / 150),
    8,
    200
  );
}

export default function GastricEmptyingWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [fatPercent, setFatPercent] = useState(() => parseNumber(searchParams.get("fat"), 30, 0, 100));
  const [antralPump, setAntralPump] = useState(() => parseNumber(searchParams.get("pump"), 100, 10, 150));
  const [pyloric, setPyloric] = useState(() => parseNumber(searchParams.get("pyloric"), 50, 0, 200));
  const [duoFeedback, setDuoFeedback] = useState(() => parseNumber(searchParams.get("duo"), 50, 0, 200));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("fat", String(Math.round(fatPercent)));
    params.set("pump", String(Math.round(antralPump)));
    params.set("pyloric", String(Math.round(pyloric)));
    params.set("duo", String(Math.round(duoFeedback)));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [fatPercent, antralPump, pyloric, duoFeedback, currentQuery, pathname, router]);

  const t12 = halfTime(antralPump, pyloric, duoFeedback, fatPercent);
  const lagPhase = clamp(15 + (fatPercent - 30) * 0.2, 0, 30);

  const series = useMemo<CurveSeries[]>(() => {
    const range = makeRange(0, 240, 2);
    const liquid = halfTime(antralPump, 30, 30, 0);
    return [
      {
        id: "current",
        label: "Current meal",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: range.map((t) => ({ x: t, y: emptyingFraction(t, t12, lagPhase) * 100 }))
      },
      {
        id: "liquid",
        label: "Liquid only (reference)",
        colorVar: "var(--ph-curve-5)",
        dashed: true,
        data: range.map((t) => ({ x: t, y: emptyingFraction(t, liquid, 0) * 100 }))
      },
      {
        id: "gastroparesis",
        label: "Gastroparesis (t½ = 150 min)",
        colorVar: "var(--ph-curve-4)",
        dashed: true,
        data: range.map((t) => ({ x: t, y: emptyingFraction(t, 150, 25) * 100 }))
      }
    ];
  }, [t12, lagPhase, antralPump]);

  const phenotype = (() => {
    if (t12 > 120) return "Delayed gastric emptying — gastroparesis territory (diabetic, post-vagotomy, idiopathic)";
    if (t12 < 20) return "Rapid emptying — dumping syndrome risk (post-gastrectomy, fundoplication)";
    if (fatPercent > 70) return "High-fat meal — CCK-driven prolonged emptying";
    if (fatPercent < 15 && antralPump > 110) return "Lean liquid meal — rapid first-order decay";
    return "Normal mixed-meal emptying";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Gastric emptying curve">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Liquid emptying is first-order (exponential). Solid emptying has a lag phase (trituration to &lt; 2 mm particles) then near-linear. Fat is the SLOWEST macronutrient — CCK delays emptying so downstream lipase + bile have time to handle it. Half-emptying time (t½) is the clinical scintigraphic readout.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">t½ {t12.toFixed(0)} min</span>
            <span className="ph-readout">Lag {lagPhase.toFixed(0)} min</span>
            <span className="ph-readout">At 60&apos; {(emptyingFraction(60, t12, lagPhase) * 100).toFixed(0)}%</span>
            <span className="ph-readout">At 120&apos; {(emptyingFraction(120, t12, lagPhase) * 100).toFixed(0)}%</span>
            <span className="ph-readout">Fat {fatPercent.toFixed(0)}%</span>
            <span className="ph-readout">Pump {antralPump.toFixed(0)}%</span>
            <span className="ph-readout">Pyloric {pyloric.toFixed(0)}%</span>
            <span className="ph-readout">Duo fb {duoFeedback.toFixed(0)}%</span>
          </div>

          {t12 > 130 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: t½ &gt; 130 min — gastroparesis. Diabetic (autonomic neuropathy), post-vagotomy, or idiopathic. Treat: metoclopramide / erythromycin (motilin agonist), small low-fat meals, glucose control.
            </p>
          ) : t12 < 15 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: t½ &lt; 15 min — dumping syndrome. Early (15–30 min, osmotic + hypovolemic) vs late (1–3 h, reactive hypoglycemia). Treat: small frequent meals, acarbose, octreotide.
            </p>
          ) : null}

          <Curve
            title="Gastric emptying — % retained vs time"
            xDomain={[0, 240]}
            yDomain={[0, 105]}
            xLabel="time (min)"
            yLabel="% retained in stomach"
            series={series}
            annotations={[
              { x: t12 + lagPhase, y: 50, label: "t½" },
              { x: lagPhase, y: 100, label: "end lag" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Follow the curve down: the stomach empties what remains in proportion to how full it is, so retention falls roughly exponentially. Fats, acid, and hypertonic chyme trigger duodenal brakes that flatten the curve (slower emptying); liquids empty faster than solids. Half-emptying time is where the curve crosses 50%.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Meal fat content" value={fatPercent} min={0} max={100} step={1} unit="%" defaultValue={30} onChange={setFatPercent} />
              <Slider label="Antral pump strength" value={antralPump} min={10} max={150} step={1} unit="%" defaultValue={100} onChange={setAntralPump} />
              <Slider label="Pyloric sphincter tone" value={pyloric} min={0} max={200} step={1} unit="%" defaultValue={50} onChange={setPyloric} />
              <Slider label="Duodenal feedback (CCK / GIP)" value={duoFeedback} min={0} max={200} step={1} unit="%" defaultValue={50} onChange={setDuoFeedback} />
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
