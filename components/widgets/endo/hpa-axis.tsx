"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { FeedbackLoopGuide, type FeedbackGuideNode } from "@/components/widgets/common/FeedbackLoopGuide";
import { FeedbackDynamicsTrack } from "@/components/widgets/common/FeedbackDynamicsTrack";
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

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const nextStress = parseNumber(params.get("stress"), 35, 0, 100);
    const nextActh = parseNumber(params.get("acth"), 0, 0, 100);
    const nextFeedback = parseBoolean(params.get("feedback"), true);
    const nextDex = parseBoolean(params.get("dex"), false);
    setStress((current) => (Math.abs(nextStress - current) > 0.1 ? nextStress : current));
    setActhBolus((current) => (Math.abs(nextActh - current) > 0.1 ? nextActh : current));
    setFeedback((current) => (nextFeedback !== current ? nextFeedback : current));
    setDexamethasone((current) => (nextDex !== current ? nextDex : current));
  }, [currentQuery]);

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
  const hpaNodes: [FeedbackGuideNode, FeedbackGuideNode, FeedbackGuideNode] = [
    { label: "Hypothalamus", value: `CRH ${axis.crh.toFixed(1)} pg/mL`, active: stress > 50 || axis.crh > 16 },
    { label: "Anterior pituitary", value: `ACTH ${axis.acth.toFixed(0)} pg/mL`, active: axis.acth > 60 },
    { label: "Adrenal cortex", value: `Cortisol ${axis.cortisol.toFixed(1)} ug/dL`, active: axis.cortisol > 22 }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="HPA axis feedback loop">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-clay-well p-3">
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
          <FeedbackDynamicsTrack feedbackActive={feedback} feedbackKind="inhibit" variableLabel="Cortisol" />
          <FeedbackLoopGuide
            nodes={hpaNodes}
            feedbackActive={feedback}
            steps={[
              { title: "1 Stress drive", verb: "hypothalamus converts stress input into CRH" },
              { title: "2 ACTH relay", verb: "pituitary corticotrophs relay CRH as ACTH" },
              { title: "3 Cortisol output", verb: "adrenal cortex secretes glucocorticoid" }
            ]}
            summary="CRH → ACTH → cortisol is the forward axis; cortisol suppresses CRH and ACTH upstream."
            feedbackStepTitle="4 Suppress"
            feedbackTitle="Cortisol brake"
            feedbackVerbActive="cortisol suppresses hypothalamus and anterior pituitary"
            feedbackVerbInactive="cortisol cannot suppress upstream CRH/ACTH drive"
            feedbackStatusActive="Axis closed"
            feedbackStatusInactive="Feedback open"
          />
          <svg role="img" aria-label="HPA axis feedback loop" viewBox="0 0 760 600" className="ph-pathway-canvas h-auto w-full">
            <text x="150" y="34" textAnchor="middle" fill="var(--ph-danger)" fontSize="11" fontWeight="800" letterSpacing="1.4">
              ◀ CORTISOL BRAKE
            </text>
            <text x="600" y="34" textAnchor="middle" fill="var(--ph-ok)" fontSize="11" fontWeight="800" letterSpacing="1.4">
              HORMONE AXIS ▼
            </text>
            <FeedbackLoopEdge
              id="hpa-crh"
              kind="stimulate"
              from={{ x: 420, y: 131 }}
              to={{ x: 420, y: 227 }}
              label="CRH"
              active={stress > 35}
              labelPosition={{ x: 524, y: 179 }}
            />
            <FeedbackLoopEdge
              id="hpa-acth"
              kind="stimulate"
              from={{ x: 420, y: 301 }}
              to={{ x: 420, y: 397 }}
              label="ACTH"
              active={acthBolus > 0 || stress > 45}
              labelPosition={{ x: 524, y: 349 }}
            />
            <FeedbackLoopEdge
              id="hpa-cortisol"
              kind="inhibit"
              from={{ x: 305, y: 432 }}
              to={{ x: 305, y: 92 }}
              via={[
                { x: 140, y: 432 },
                { x: 140, y: 92 }
              ]}
              label="cortisol brake"
              active={feedback}
              labelPosition={{ x: 140, y: 262 }}
            />
            <FeedbackLoopEdge
              id="hpa-pit-feedback"
              kind="inhibit"
              from={{ x: 305, y: 432 }}
              to={{ x: 305, y: 262 }}
              via={[
                { x: 215, y: 432 },
                { x: 215, y: 262 }
              ]}
              active={feedback}
            />
            <FeedbackLoopNode id="hypothalamus" index={1} role="Drive" label={hpaNodes[0].label} value={hpaNodes[0].value} x={420} y={92} active={hpaNodes[0].active} />
            <FeedbackLoopNode id="pituitary" index={2} role="Relay" label={hpaNodes[1].label} value={hpaNodes[1].value} x={420} y={262} active={hpaNodes[1].active} />
            <FeedbackLoopNode id="adrenal" index={3} role="Output" label={hpaNodes[2].label} value={hpaNodes[2].value} x={420} y={432} active={hpaNodes[2].active} />
            {!feedback ? (
              <g>
                <rect x="60" y="250" width="150" height="26" rx="8" fill="color-mix(in srgb, var(--ph-warn), transparent 86%)" stroke="color-mix(in srgb, var(--ph-warn), transparent 50%)" />
                <text x="135" y="268" textAnchor="middle" fill="var(--ph-warn)" fontSize="12" fontWeight="800">
                  feedback OFF
                </text>
              </g>
            ) : null}

            <g transform="translate(40 520)">
              <rect x="0" y="0" width="680" height="58" rx="10" fill="color-mix(in srgb, var(--ph-surface-2), transparent 25%)" stroke="var(--ph-border)" />
              <text x="16" y="22" fill="var(--ph-muted)" fontSize="10" fontWeight="800" letterSpacing="1.4">HOW TO READ</text>
              <line x1="16" y1="42" x2="52" y2="42" stroke="var(--ph-ok)" strokeWidth="3.4" strokeLinecap="round" markerEnd="url(#hpa-legend-arrow)" />
              <defs>
                <marker id="hpa-legend-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ph-ok)" />
                </marker>
              </defs>
              <text x="62" y="46" fill="var(--ph-text)" fontSize="12" fontWeight="700">
                <tspan fontWeight="900" fill="var(--ph-ok)">+ </tspan>hormone signal (drives the next gland)
              </text>
              <line x1="392" y1="42" x2="424" y2="42" stroke="var(--ph-danger)" strokeWidth="3.4" strokeDasharray="7 5" strokeLinecap="round" />
              <line x1="424" y1="35" x2="424" y2="49" stroke="var(--ph-danger)" strokeWidth="4" strokeLinecap="round" />
              <text x="434" y="46" fill="var(--ph-text)" fontSize="12" fontWeight="700">
                <tspan fontWeight="900" fill="var(--ph-danger)">− </tspan>cortisol brake (suppresses upstream drive)
              </text>
            </g>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">In plain terms · </span>
            <Highlighted text={"Cortisol is the controlled variable. Stress drives the hypothalamus (CRH) and pituitary (ACTH), the adrenal cortex makes cortisol, and cortisol then BRAKES CRH and ACTH. Dexamethasone tests the brake — it suppresses a normal axis but not an autonomous tumor. Toggle feedback off to watch cortisol stay high after a perturbation."} />
          </p>
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
