"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramByRoute } from "@/lib/registry";
import { FeedbackLoopGuide, type FeedbackGuideNode } from "@/components/widgets/common/FeedbackLoopGuide";
import {
  Curve,
  FeedbackLoopEdge,
  FeedbackLoopNode,
  PerturbationToggle,
  ScrubBar,
  Slider,
  type CurvePoint
} from "@/components/widgets/primitives";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

const baselineCurve: CurvePoint[] = [
  { x: 0, y: 8 },
  { x: 1, y: 18 },
  { x: 2, y: 42 },
  { x: 3, y: 70 },
  { x: 4, y: 86 },
  { x: 5, y: 94 }
];

function shiftedCurve(value: number): CurvePoint[] {
  return baselineCurve.map((point) => ({
    x: point.x,
    y: clamp(point.y + value * (point.x - 2), 0, 110)
  }));
}

export default function PendingWidget() {
  const params = useParams<{ system: string; diagram: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagram = getDiagramByRoute(params.system, params.diagram);
  const [value, setValue] = useState(() => parseNumber(searchParams.get("preview"), 50, 0, 100));
  const [enabled, setEnabled] = useState(searchParams.get("overlay") !== "0");
  const stateRef = useRef({ value, enabled });

  useEffect(() => {
    stateRef.current = { value, enabled };
  }, [enabled, value]);

  useEffect(() => {
    const current = stateRef.current;
    const nextValue = parseNumber(searchParams.get("preview"), current.value, 0, 100);
    if (Math.abs(nextValue - current.value) > 0.1) {
      setValue(nextValue);
    }
    const nextEnabled = searchParams.get("overlay") !== "0";
    if (nextEnabled !== current.enabled) {
      setEnabled(nextEnabled);
    }
  }, [searchParams]);

  useEffect(() => {
    const paramsNext = new URLSearchParams(searchParams.toString());
    paramsNext.set("preview", String(Math.round(value)));
    paramsNext.set("overlay", enabled ? "1" : "0");
    const nextQuery = paramsNext.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }
    const timer = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [enabled, pathname, router, searchParams, value]);

  const currentCurve = useMemo(() => shiftedCurve((value - 50) / 8), [value]);

  if (!diagram) {
    return null;
  }
  const previewNodes: [FeedbackGuideNode, FeedbackGuideNode, FeedbackGuideNode] = [
    { label: "Sensor", value: `${Math.round(value)}%`, active: value > 60 },
    { label: "Integrator", value: "set point", active: value > 60 },
    { label: "Effector", value: enabled ? "feedback on" : "feedback off", active: enabled }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${diagram.title} template preview`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="ph-section-label">Template preview</h2>
            <span className="rounded-ph border border-[var(--ph-border)] px-2 py-1 text-xs uppercase text-ph-muted">
              In development
            </span>
          </div>
          {diagram.archetype === "feedback-loop" ? (
            <>
              <FeedbackLoopGuide nodes={previewNodes} feedbackActive={enabled} />
              <svg role="img" aria-label="Feedback loop template" viewBox="0 0 760 600" className="ph-pathway-canvas h-auto w-full">
                <text x="150" y="34" textAnchor="middle" fill="var(--ph-danger)" fontSize="11" fontWeight="800" letterSpacing="1.4">
                  ◀ OUTPUT BRAKE
                </text>
                <text x="600" y="34" textAnchor="middle" fill="var(--ph-ok)" fontSize="11" fontWeight="800" letterSpacing="1.4">
                  FORWARD SIGNAL ▼
                </text>
                <FeedbackLoopEdge id="edge-a" kind="stimulate" from={{ x: 420, y: 131 }} to={{ x: 420, y: 227 }} label="activates" active={value > 60} labelPosition={{ x: 530, y: 179 }} />
                <FeedbackLoopEdge id="edge-b" kind="stimulate" from={{ x: 420, y: 301 }} to={{ x: 420, y: 397 }} label="activates" active={value > 60} labelPosition={{ x: 530, y: 349 }} />
                <FeedbackLoopEdge
                  id="edge-c"
                  kind="inhibit"
                  from={{ x: 305, y: 432 }}
                  to={{ x: 305, y: 92 }}
                  via={[
                    { x: 140, y: 432 },
                    { x: 140, y: 92 }
                  ]}
                  label="brakes upstream"
                  active={enabled}
                  labelPosition={{ x: 140, y: 262 }}
                />
                <FeedbackLoopNode id="node-a" index={1} role="Sense" label={previewNodes[0].label} value={previewNodes[0].value} x={420} y={92} active={previewNodes[0].active} />
                <FeedbackLoopNode id="node-b" index={2} role="Integrate" label={previewNodes[1].label} value={previewNodes[1].value} x={420} y={262} active={previewNodes[1].active} />
                <FeedbackLoopNode id="node-c" index={3} role="Respond" label={previewNodes[2].label} value={previewNodes[2].value} x={420} y={432} active={previewNodes[2].active} />
              </svg>
            </>
          ) : (
            <Curve
              title={`${diagram.title} template curve`}
              xDomain={[0, 5]}
              yDomain={[0, 110]}
              xLabel="input"
              yLabel="output"
              series={[
                {
                  id: "current",
                  label: "Current",
                  data: currentCurve,
                  colorVar: "var(--ph-curve-1)"
                }
              ]}
              referenceSeries={
                enabled
                  ? [
                      {
                        id: "baseline",
                        label: "Baseline",
                        data: baselineCurve,
                        colorVar: "var(--ph-curve-ref)",
                        dashed: true
                      }
                    ]
                  : []
              }
              cursorX={diagram.archetype === "scrubbable-timeline" || diagram.archetype === "click-to-mechanism" ? value / 20 : undefined}
              height={360}
            />
          )}
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            {diagram.archetype === "scrubbable-timeline" || diagram.archetype === "click-to-mechanism" ? (
              <ScrubBar
                label={diagram.archetype === "click-to-mechanism" ? "Mechanism step" : "Timeline position"}
                value={value / 20}
                duration={5}
                step={diagram.archetype === "click-to-mechanism" ? 1 : 0.1}
                onChange={(nextValue) => setValue(nextValue * 20)}
              />
            ) : (
              <Slider
                label={diagram.archetype === "feedback-loop" ? "Perturbation magnitude" : "Primary parameter"}
                value={value}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={50}
                onChange={setValue}
              />
            )}
            <div className="mt-4">
              <PerturbationToggle
                label={diagram.archetype === "feedback-loop" ? "Feedback arm enabled" : "Show baseline overlay"}
                checked={enabled}
                onChange={setEnabled}
              />
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

      <ReportError diagramId={diagram.id} />
    </section>
  );
}
