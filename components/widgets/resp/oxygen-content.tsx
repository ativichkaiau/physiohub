"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, Slider, type CurveSeries } from "@/components/widgets/primitives";
import { makeRange, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "resp/oxygen-content";
const diagram = getDiagramById(DIAGRAM_ID);

function caO2(hb: number, saturation: number, pao2: number) {
  return 1.34 * hb * (saturation / 100) + 0.003 * pao2;
}

function delivery(cao2: number, cardiacOutput: number) {
  return cao2 * cardiacOutput * 10;
}

export default function OxygenContentWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [hb, setHb] = useState(() => parseNumber(searchParams.get("hb"), 15, 5, 22));
  const [sat, setSat] = useState(() => parseNumber(searchParams.get("sat"), 97, 50, 100));
  const [pao2, setPao2] = useState(() => parseNumber(searchParams.get("pao2"), 95, 25, 650));
  const [co, setCo] = useState(() => parseNumber(searchParams.get("co"), 5, 2, 12));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const nextHb = parseNumber(params.get("hb"), 15, 5, 22);
    const nextSat = parseNumber(params.get("sat"), 97, 50, 100);
    const nextPao2 = parseNumber(params.get("pao2"), 95, 25, 650);
    const nextCo = parseNumber(params.get("co"), 5, 2, 12);
    setHb((current) => (Math.abs(nextHb - current) > 0.01 ? nextHb : current));
    setSat((current) => (Math.abs(nextSat - current) > 0.01 ? nextSat : current));
    setPao2((current) => (Math.abs(nextPao2 - current) > 0.01 ? nextPao2 : current));
    setCo((current) => (Math.abs(nextCo - current) > 0.01 ? nextCo : current));
  }, [currentQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("hb", hb.toFixed(1));
    params.set("sat", sat.toFixed(0));
    params.set("pao2", pao2.toFixed(0));
    params.set("co", co.toFixed(1));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [co, currentQuery, hb, pao2, pathname, router, sat]);

  const content = caO2(hb, sat, pao2);
  const dissolved = 0.003 * pao2;
  const do2 = delivery(content, co);
  const normalContent = caO2(15, 97, 95);
  const series: CurveSeries[] = useMemo(
    () => [
      {
        id: "current",
        label: "Current Hb",
        colorVar: "var(--ph-curve-1)",
        data: makeRange(50, 100, 1).map((s) => ({ x: s, y: caO2(hb, s, pao2) }))
      }
    ],
    [hb, pao2]
  );
  const referenceSeries: CurveSeries[] = useMemo(
    () => [
      {
        id: "normal",
        label: "Hb 15 / PaO2 95",
        colorVar: "var(--ph-curve-ref)",
        dashed: true,
        data: makeRange(50, 100, 1).map((s) => ({ x: s, y: caO2(15, s, 95) }))
      }
    ],
    []
  );
  const state =
    hb < 9
      ? "Anemic oxygen content"
      : sat < 88
        ? "Hypoxemic saturation loss"
        : do2 < 700
          ? "Low systemic delivery"
          : "Normal oxygen delivery reserve";

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Oxygen content and delivery">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-clay-well p-3">
              <p className="ph-section-label">{state}</p>
              <p className="mt-1 text-sm text-ph-muted">
                Most oxygen content is bound to hemoglobin. PaO2 has a small dissolved contribution, but it strongly determines saturation upstream.
              </p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">CaO2 {content.toFixed(1)}</span>
              <span className="ph-readout">DO2 {do2.toFixed(0)}</span>
              <span className="ph-readout">Dissolved {dissolved.toFixed(2)}</span>
              <span className="ph-readout">Delta {(content - normalContent).toFixed(1)}</span>
            </div>
          </div>
          {do2 < 550 ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: oxygen delivery is critically low; extraction reserve may be exhausted.
            </p>
          ) : null}
          <Curve
            title="Arterial oxygen content vs saturation"
            xDomain={[50, 100]}
            yDomain={[0, 24]}
            xLabel="SaO2 (%)"
            yLabel="CaO2 (mL/dL)"
            series={series}
            referenceSeries={referenceSeries}
            cursorX={sat}
            annotations={[{ x: sat, y: content, label: `CaO2 ${content.toFixed(1)}` }]}
            bands={[
              { axis: "y", from: 16, to: 24, tone: "ok", label: "normal content" },
              { axis: "y", from: 10, to: 16, tone: "warn" },
              { axis: "y", from: 0, to: 10, tone: "danger" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Oxygen content is almost all hemoglobin-bound, not dissolved — so content rides with saturation and hemoglobin level. Anemia drops the whole line even when PO2 and saturation are normal, which is why a pink, well-saturated patient can still be oxygen-starved. Read content on the y-axis to judge delivery, not PO2 alone.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Hemoglobin" value={hb} min={5} max={22} step={0.1} unit="g/dL" defaultValue={15} onChange={setHb} />
              <Slider label="SaO2" value={sat} min={50} max={100} step={1} unit="%" defaultValue={97} onChange={setSat} />
              <Slider label="PaO2" value={pao2} min={25} max={650} step={5} unit="mmHg" defaultValue={95} onChange={setPao2} />
              <Slider label="Cardiac output" value={co} min={2} max={12} step={0.1} unit="L/min" defaultValue={5} onChange={setCo} />
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
