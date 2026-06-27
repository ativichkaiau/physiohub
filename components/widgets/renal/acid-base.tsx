"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "renal/acid-base";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Davenport diagram — pH on x, [HCO3-] on y, with PaCO2 isobars.
 * Henderson-Hasselbalch: pH = 6.10 + log10([HCO3]/(0.03 × PaCO2))
 *
 * Plot the four primary disturbances around the normal point (pH 7.40,
 * [HCO3] 24, PaCO2 40):
 *   metabolic acidosis: low [HCO3] (lactic, DKA, RTA, diarrhoea)
 *   metabolic alkalosis: high [HCO3] (vomiting, diuretics, Conn's)
 *   respiratory acidosis: high PaCO2 (hypoventilation)
 *   respiratory alkalosis: low PaCO2 (hyperventilation)
 *
 * Compensation moves the point along an isobar (renal) or off it (respiratory),
 * never fully back to normal pH.
 */
function ph(hco3: number, paco2: number) {
  return 6.10 + Math.log10(Math.max(0.5, hco3) / (0.03 * Math.max(8, paco2)));
}

function classify(hco3: number, paco2: number, anionGap: number, vomiting: number) {
  const p = ph(hco3, paco2);
  const labels: string[] = [];
  if (p < 7.35) labels.push("Acidemia");
  if (p > 7.45) labels.push("Alkalemia");
  // Identify the primary disturbance.
  if (hco3 < 22) {
    labels.push(anionGap > 14 ? "Anion-gap metabolic acidosis" : "Non-AG (hyperchloremic) metabolic acidosis");
  }
  if (hco3 > 26 || vomiting > 40) labels.push("Metabolic alkalosis");
  if (paco2 > 45) labels.push("Respiratory acidosis");
  if (paco2 < 35) labels.push("Respiratory alkalosis");
  return labels.length ? labels.join(" + ") : "Normal";
}

function deltaDelta(hco3: number, anionGap: number) {
  const deltaAG = anionGap - 12;
  const deltaHCO3 = 24 - hco3;
  if (deltaHCO3 <= 0) return null;
  return deltaAG / deltaHCO3;
}

export default function AcidBaseWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [hco3, setHco3] = useState(() => parseNumber(searchParams.get("hco3"), 24, 5, 50));
  const [paco2, setPaco2] = useState(() => parseNumber(searchParams.get("paco2"), 40, 10, 80));
  const [anionGap, setAnionGap] = useState(() => parseNumber(searchParams.get("ag"), 12, 5, 35));
  const [vomiting, setVomiting] = useState(() => parseNumber(searchParams.get("vom"), 0, 0, 100));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("hco3", hco3.toFixed(0));
    params.set("paco2", paco2.toFixed(0));
    params.set("ag", anionGap.toFixed(0));
    params.set("vom", vomiting.toFixed(0));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [hco3, paco2, anionGap, vomiting, currentQuery, pathname, router]);

  const currentPh = ph(hco3, paco2);
  const phenotype = classify(hco3, paco2, anionGap, vomiting);
  const dDelta = deltaDelta(hco3, anionGap);

  // Build PaCO2 isobars across the pH-HCO3 plane.
  const series = useMemo<CurveSeries[]>(() => {
    const phRange = makeRange(7.0, 7.7, 0.01);
    const isobarValues = [20, 40, 60, 80];
    const isobars: CurveSeries[] = isobarValues.map((co2, i) => ({
      id: `isobar-${co2}`,
      label: `PaCO₂ ${co2} mmHg`,
      colorVar: i === 1 ? "var(--ph-curve-ref)" : "var(--ph-curve-3)",
      dashed: i !== 1,
      data: phRange.map((p) => ({ x: p, y: 0.03 * co2 * Math.pow(10, p - 6.10) }))
    }));
    return [
      ...isobars,
      {
        id: "current",
        label: "Current",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 4,
        data: [
          { x: currentPh - 0.005, y: hco3 - 0.5 },
          { x: currentPh + 0.005, y: hco3 + 0.5 }
        ]
      }
    ];
  }, [currentPh, hco3]);

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Davenport diagram">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{phenotype}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Davenport plot: PaCO₂ isobars cross the pH/[HCO₃⁻] plane. Metabolic disturbances move you along an isobar; respiratory disturbances move you across them. Compensation is partial — pH never fully returns to 7.40 with single-system compensation. Δ/Δ &gt; 2 → concurrent metabolic alkalosis; &lt; 1 → concurrent non-AG acidosis.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">pH {currentPh.toFixed(2)}</span>
            <span className="ph-readout">[HCO₃⁻] {hco3.toFixed(0)} mEq/L</span>
            <span className="ph-readout">PaCO₂ {paco2.toFixed(0)} mmHg</span>
            <span className="ph-readout">AG {anionGap.toFixed(0)}</span>
            <span className="ph-readout">Δ/Δ {dDelta != null ? dDelta.toFixed(1) : "—"}</span>
            <span className="ph-readout">Winters {(1.5 * hco3 + 8).toFixed(0)}</span>
            <span className="ph-readout">[H⁺] {Math.round(24 * paco2 / Math.max(0.5, hco3))} nM</span>
            <span className="ph-readout">Compensation {paco2 > 45 ? "↑PaCO₂" : paco2 < 35 ? "↓PaCO₂" : "—"}</span>
          </div>

          {currentPh < 7.20 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: pH &lt; 7.20 — severe acidemia. Risk of cardiovascular collapse, hyperkalemia, depressed contractility. Bicarbonate replacement controversial except in severe non-AG and TCA toxicity.
            </p>
          ) : currentPh > 7.55 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: pH &gt; 7.55 — severe alkalemia. Tetany, seizures, arrhythmia, decreased cerebral perfusion (vasoconstriction).
            </p>
          ) : null}

          <Curve
            title="Davenport — pH × [HCO₃⁻] with PaCO₂ isobars"
            xDomain={[7.0, 7.7]}
            yDomain={[0, 50]}
            xLabel="pH"
            yLabel="[HCO₃⁻] (mEq/L)"
            series={series}
            annotations={[
              { x: 7.4, y: 24, label: "normal" },
              { x: currentPh, y: hco3, label: "current" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Serum [HCO₃⁻]" value={hco3} min={5} max={50} step={1} unit="mEq/L" defaultValue={24} onChange={setHco3} />
              <Slider label="PaCO₂" value={paco2} min={10} max={80} step={1} unit="mmHg" defaultValue={40} onChange={setPaco2} />
              <Slider label="Anion gap (Na − Cl − HCO₃)" value={anionGap} min={5} max={35} step={1} unit="mEq/L" defaultValue={12} onChange={setAnionGap} />
              <Slider label="Vomiting (acid loss proxy)" value={vomiting} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setVomiting} />
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
