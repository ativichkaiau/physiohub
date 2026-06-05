"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import {
  FeedbackLoopEdge,
  FeedbackLoopNode,
  PerturbationToggle,
  Slider
} from "@/components/widgets/primitives";
import { clamp, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "endo/hpa-axis";
const diagram = getDiagramById(DIAGRAM_ID);

function computeAxis(stress: number, acthBolus: number, feedback: boolean, dexamethasone: boolean) {
  const dexEffect = dexamethasone ? 14 : 0;
  const feedbackBrake = feedback ? dexEffect + 0.28 * acthBolus : 0;
  const crh = clamp(8 + stress * 0.18 - feedbackBrake, 1, 28);
  const acth = clamp(20 + crh * 2.2 + acthBolus - (feedback ? dexEffect * 3 : 0), 4, 130);
  const cortisol = clamp(12 + acth * 0.14 + stress * 0.05 + (dexamethasone ? 10 : 0), 4, 44);
  const suppression = feedback ? clamp(cortisol / 44, 0, 1) : 0;
  return { crh, acth, cortisol, suppression };
}

export default function HpaAxisWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [stress, setStress] = useState(() => parseNumber(searchParams.get("stress"), 35, 0, 100));
  const [acthBolus, setActhBolus] = useState(() => parseNumber(searchParams.get("acth"), 0, 0, 100));
  const [feedback, setFeedback] = useState(() => parseBoolean(searchParams.get("feedback"), true));
  const [dexamethasone, setDexamethasone] = useState(() => parseBoolean(searchParams.get("dex"), false));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ stress, acthBolus, feedback, dexamethasone });

  useEffect(() => {
    stateRef.current = { stress, acthBolus, feedback, dexamethasone };
  }, [acthBolus, dexamethasone, feedback, stress]);

  useEffect(() => {
    const current = stateRef.current;
    const next = {
      stress: parseNumber(searchParams.get("stress"), current.stress, 0, 100),
      acthBolus: parseNumber(searchParams.get("acth"), current.acthBolus, 0, 100),
      feedback: parseBoolean(searchParams.get("feedback"), current.feedback),
      dexamethasone: parseBoolean(searchParams.get("dex"), current.dexamethasone)
    };
    if (Math.abs(next.stress - current.stress) > 0.1) setStress(next.stress);
    if (Math.abs(next.acthBolus - current.acthBolus) > 0.1) setActhBolus(next.acthBolus);
    if (next.feedback !== current.feedback) setFeedback(next.feedback);
    if (next.dexamethasone !== current.dexamethasone) setDexamethasone(next.dexamethasone);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("stress", String(Math.round(stress)));
    params.set("acth", String(Math.round(acthBolus)));
    params.set("feedback", feedback ? "1" : "0");
    params.set("dex", dexamethasone ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [acthBolus, currentQuery, dexamethasone, feedback, pathname, router, stress]);

  const axis = computeAxis(stress, acthBolus, feedback, dexamethasone);
  const brokenFeedback = !feedback && (stress > 55 || acthBolus > 40);
  const axisState = dexamethasone
    ? "Dexamethasone suppression"
    : brokenFeedback
      ? "Feedback broken"
      : stress > 65 || acthBolus > 35
        ? "Perturbed"
        : "Steady state";

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="HPA axis feedback loop">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
              <p className="ph-section-label">{axisState}</p>
              <p className="mt-1 text-sm text-ph-muted">
                {brokenFeedback
                  ? "Cortisol is elevated without an intact negative feedback arm."
                  : dexamethasone
                    ? "Exogenous glucocorticoid suppresses upstream CRH and ACTH when feedback is intact."
                    : "Pulse strength follows stress and ACTH perturbation, then feeds back on the hypothalamus and pituitary."}
              </p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">CRH {axis.crh.toFixed(1)}</span>
              <span className="ph-readout">ACTH {axis.acth.toFixed(0)}</span>
              <span className="ph-readout">Cortisol {axis.cortisol.toFixed(1)}</span>
              <span className="ph-readout">Brake {(axis.suppression * 100).toFixed(0)}%</span>
            </div>
          </div>
          {brokenFeedback ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: negative feedback is disabled, so cortisol stays high after perturbation.
            </p>
          ) : null}
          <svg role="img" aria-label="HPA axis node graph" viewBox="0 0 700 520" className="ph-pathway-canvas h-auto w-full">
            <text x="28" y="36" fill="var(--ph-muted)" fontSize="11" fontWeight="800" letterSpacing="2.4">
              HORMONE AXIS
            </text>
            <text x="672" y="36" textAnchor="end" fill="var(--ph-muted)" fontSize="11" fontWeight="800" letterSpacing="2.4">
              CORTISOL BRAKE
            </text>
            <FeedbackLoopEdge id="hpa-crh" from={{ x: 350, y: 115 }} to={{ x: 350, y: 190 }} label="CRH" active={stress > 35} />
            <FeedbackLoopEdge id="hpa-acth" from={{ x: 350, y: 255 }} to={{ x: 350, y: 330 }} label="ACTH" active={acthBolus > 0 || stress > 45} />
            <FeedbackLoopEdge id="hpa-cortisol" from={{ x: 350, y: 395 }} to={{ x: 142, y: 88 }} label="negative feedback" inhibitory active={feedback} />
            <FeedbackLoopEdge id="hpa-pit-feedback" from={{ x: 350, y: 395 }} to={{ x: 152, y: 228 }} label="pituitary brake" inhibitory active={feedback} />
            <FeedbackLoopNode id="hypothalamus" label="Hypothalamus" value={`CRH ${axis.crh.toFixed(1)} pg/mL`} x={350} y={80} active={stress > 50 && feedback} />
            <FeedbackLoopNode id="pituitary" label="Anterior pituitary" value={`ACTH ${axis.acth.toFixed(0)} pg/mL`} x={350} y={220} active={axis.acth > 60} />
            <FeedbackLoopNode id="adrenal" label="Adrenal cortex" value={`Cortisol ${axis.cortisol.toFixed(1)} ug/dL`} x={350} y={360} active={axis.cortisol > 22} />
            {!feedback ? (
              <g>
                <rect x="262" y="455" width="176" height="30" rx="8" fill="color-mix(in srgb, var(--ph-warn), transparent 86%)" stroke="color-mix(in srgb, var(--ph-warn), transparent 50%)" />
                <text x="350" y="475" textAnchor="middle" fill="var(--ph-warn)" fontSize="13" fontWeight="800">
                  Feedback arm disabled
                </text>
              </g>
            ) : null}
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Stress drive" value={stress} min={0} max={100} step={1} unit="%" defaultValue={35} onChange={setStress} />
              <Slider label="ACTH injection" value={acthBolus} min={0} max={100} step={1} unit="%" defaultValue={0} onChange={setActhBolus} />
              <PerturbationToggle label="Negative feedback intact" checked={feedback} onChange={setFeedback} />
              <PerturbationToggle label="Dexamethasone present" checked={dexamethasone} onChange={setDexamethasone} />
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
