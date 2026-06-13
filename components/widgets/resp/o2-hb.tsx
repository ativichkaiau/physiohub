"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, Slider, type CurvePoint } from "@/components/widgets/primitives";
import { clamp, makeRange, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "resp/o2-hb";
const diagram = getDiagramById(DIAGRAM_ID);

function saturation(po2: number, p50: number) {
  const n = 2.7;
  return 100 * (po2 ** n / (p50 ** n + po2 ** n));
}

function computeP50(ph: number, pco2: number, temp: number, bpg: number) {
  // Bohr effect: Δlog(P50)/ΔpH ≈ −0.48, so a 0.2-unit pH fall raises P50 by
  // ~5–6 mmHg → ≈25 mmHg per pH unit near the set point. CO2 contributes a
  // smaller direct (carbamino) shift; temperature ≈ +1.3 mmHg/°C; 2,3-BPG
  // ≈ +4.5 mmHg per unit. Normal P50 ≈ 26.8 mmHg.
  return clamp(26.8 + (7.4 - ph) * 25 + (pco2 - 40) * 0.1 + (temp - 37) * 1.3 + (bpg - 1) * 4.5, 15, 52);
}

function buildCurve(p50: number): CurvePoint[] {
  return makeRange(0, 100, 2).map((po2) => ({ x: po2, y: saturation(po2, p50) }));
}

export default function O2HbWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [ph, setPh] = useState(() => parseNumber(searchParams.get("ph"), 7.4, 6.8, 7.8));
  const [pco2, setPco2] = useState(() => parseNumber(searchParams.get("pco2"), 40, 20, 80));
  const [temp, setTemp] = useState(() => parseNumber(searchParams.get("temp"), 37, 33, 41));
  const [bpg, setBpg] = useState(() => parseNumber(searchParams.get("bpg"), 1, 0.5, 2.5));
  const [overlay, setOverlay] = useState(() => parseBoolean(searchParams.get("overlay"), true));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const next = {
      ph: parseNumber(params.get("ph"), 7.4, 6.8, 7.8),
      pco2: parseNumber(params.get("pco2"), 40, 20, 80),
      temp: parseNumber(params.get("temp"), 37, 33, 41),
      bpg: parseNumber(params.get("bpg"), 1, 0.5, 2.5),
      overlay: parseBoolean(params.get("overlay"), true)
    };
    setPh((current) => (Math.abs(next.ph - current) > 0.001 ? next.ph : current));
    setPco2((current) => (Math.abs(next.pco2 - current) > 0.1 ? next.pco2 : current));
    setTemp((current) => (Math.abs(next.temp - current) > 0.1 ? next.temp : current));
    setBpg((current) => (Math.abs(next.bpg - current) > 0.001 ? next.bpg : current));
    setOverlay((current) => (next.overlay !== current ? next.overlay : current));
  }, [currentQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("ph", ph.toFixed(2));
    params.set("pco2", String(Math.round(pco2)));
    params.set("temp", temp.toFixed(1));
    params.set("bpg", bpg.toFixed(2));
    params.set("overlay", overlay ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [bpg, currentQuery, overlay, pathname, pco2, ph, router, temp]);

  const p50 = computeP50(ph, pco2, temp, bpg);
  const normalP50 = 26.8;
  const currentCurve = useMemo(() => buildCurve(p50), [p50]);
  const normalCurve = useMemo(() => buildCurve(normalP50), []);
  const rightShift = p50 > normalP50 + 0.6;
  const leftShift = p50 < normalP50 - 0.6;
  const outOfRange = ph < 7.0 || ph > 7.6 || pco2 > 65 || temp > 40 || bpg > 2.2;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="O2-Hb dissociation interactive curve">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
              <p className="ph-section-label">
                {rightShift ? "Right shift" : leftShift ? "Left shift" : "Normal affinity"}
              </p>
              <p className="mt-1 text-sm text-ph-muted">
                {rightShift
                  ? "Oxygen unloading is favored as P50 rises."
                  : leftShift
                    ? "Oxygen loading is favored as P50 falls."
                    : "Current conditions sit close to the normal reference curve."}
              </p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">P50 {p50.toFixed(1)} mmHg</span>
              <span className="ph-readout">Delta {(p50 - normalP50).toFixed(1)}</span>
              <span className="ph-readout">SaO2@40 {saturation(40, p50).toFixed(0)}%</span>
              <span className="ph-readout">SaO2@100 {saturation(100, p50).toFixed(0)}%</span>
            </div>
          </div>
          {outOfRange ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: one or more variables are outside ordinary physiologic range; the curve still renders for comparison.
            </p>
          ) : null}
          <Curve
            title="Oxygen hemoglobin dissociation curve"
            xDomain={[0, 100]}
            yDomain={[0, 100]}
            xLabel="PO2 (mmHg)"
            yLabel="SaO2 (%)"
            series={[{ id: "current", label: "Current", data: currentCurve, colorVar: "var(--ph-curve-1)" }]}
            referenceSeries={
              overlay ? [{ id: "normal", label: "Normal", data: normalCurve, colorVar: "var(--ph-curve-ref)", dashed: true }] : []
            }
            cursorX={p50}
            annotations={[{ x: p50, y: saturation(p50, p50), label: `P50 ${p50.toFixed(1)}` }]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="pH" value={ph} min={6.8} max={7.8} step={0.01} defaultValue={7.4} onChange={setPh} />
              <Slider label="PaCO2" value={pco2} min={20} max={80} step={1} unit="mmHg" defaultValue={40} onChange={setPco2} />
              <Slider label="Temperature" value={temp} min={33} max={41} step={0.1} unit="C" defaultValue={37} onChange={setTemp} />
              <Slider label="2,3-BPG" value={bpg} min={0.5} max={2.5} step={0.01} defaultValue={1} onChange={setBpg} />
              <PerturbationToggle label="Show baseline overlay" checked={overlay} onChange={setOverlay} />
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
