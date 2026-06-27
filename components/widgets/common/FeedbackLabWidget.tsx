"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import {
  FeedbackLoopGuide,
  type FeedbackGuideReturnKind,
  type FeedbackGuideStep
} from "@/components/widgets/common/FeedbackLoopGuide";
import { FeedbackDynamicsTrack } from "@/components/widgets/common/FeedbackDynamicsTrack";
import {
  FeedbackLoopEdge,
  FeedbackLoopNode,
  PerturbationToggle,
  Slider
} from "@/components/widgets/primitives";
import { parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";
import type { CurveLabControl } from "./CurveLabWidget";

export type FeedbackToggle = {
  key: string;
  label: string;
  defaultValue: boolean;
};

export type FeedbackLabState = {
  state: string;
  body: string;
  warning?: string;
  nodes: [
    { label: string; value: string; active?: boolean },
    { label: string; value: string; active?: boolean },
    { label: string; value: string; active?: boolean }
  ];
  readouts: Array<{ label: string; value: string }>;
  feedbackActive: boolean;
  forwardActive?: boolean;
};

export type FeedbackLoopMeta = {
  guideSteps?: [FeedbackGuideStep, FeedbackGuideStep, FeedbackGuideStep];
  guideSummary?: string;
  feedbackKind?: FeedbackGuideReturnKind;
  feedbackStepTitle?: string;
  nodeRoles?: [string, string, string];
  forwardHeader?: string;
  feedbackHeader?: string;
  forwardLabels?: [string, string];
  feedbackLabel?: string;
  feedbackGuideTitle?: string;
  feedbackVerbActive?: string;
  feedbackVerbInactive?: string;
  feedbackStatusActive?: string;
  feedbackStatusInactive?: string;
  feedbackOffLabel?: string;
  legendForward?: string;
  legendFeedback?: string;
  controlledLabel?: string;
};

export type FeedbackLabConfig = {
  diagramId: string;
  readingGuide?: string;
  controls: CurveLabControl[];
  toggles: FeedbackToggle[];
  loop?: FeedbackLoopMeta;
  evaluate: (values: Record<string, number>, toggles: Record<string, boolean>) => FeedbackLabState;
};

function initialValues(controls: CurveLabControl[], searchParams: URLSearchParams) {
  return Object.fromEntries(
    controls.map((control) => [
      control.key,
      parseNumber(searchParams.get(control.key), control.defaultValue, control.min, control.max)
    ])
  );
}

function initialToggles(toggles: FeedbackToggle[], searchParams: URLSearchParams) {
  return Object.fromEntries(
    toggles.map((toggle) => [toggle.key, parseBoolean(searchParams.get(toggle.key), toggle.defaultValue)])
  );
}

function changed<T extends number | boolean>(a: Record<string, T>, b: Record<string, T>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return true;
    }
  }
  return false;
}

export function FeedbackLabWidget({ config }: { config: FeedbackLabConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const diagram = getDiagramById(config.diagramId);
  const [values, setValues] = useState(() => initialValues(config.controls, searchParams));
  const [toggles, setToggles] = useState(() => initialToggles(config.toggles, searchParams));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ values, toggles });

  useEffect(() => {
    stateRef.current = { values, toggles };
  }, [toggles, values]);

  useEffect(() => {
    const current = stateRef.current;
    const params = new URLSearchParams(currentQuery);
    const nextValues = initialValues(config.controls, params);
    const nextToggles = initialToggles(config.toggles, params);
    if (changed(nextValues, current.values)) setValues(nextValues);
    if (changed(nextToggles, current.toggles)) setToggles(nextToggles);
  }, [config.controls, config.toggles, currentQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    config.controls.forEach((control) => {
      params.set(control.key, values[control.key].toFixed(control.step < 1 ? 2 : 0));
    });
    config.toggles.forEach((toggle) => {
      params.set(toggle.key, toggles[toggle.key] ? "1" : "0");
    });
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [config.controls, config.toggles, currentQuery, pathname, router, toggles, values]);

  const model = config.evaluate(values, toggles);
  const safeSvgId = config.diagramId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const loop = config.loop ?? {};
  const nodeRoles = loop.nodeRoles ?? ["Sense", "Integrate", "Respond"];
  const forwardLabels = loop.forwardLabels ?? ["signal", "signal"];
  const feedbackLabel = loop.feedbackLabel ?? "return arm";
  const feedbackKind = loop.feedbackKind ?? "inhibit";
  const feedbackColor = feedbackKind === "stimulate" ? "var(--ph-ok)" : "var(--ph-danger)";
  const feedbackLegend = loop.legendFeedback ?? (feedbackKind === "stimulate" ? "return signal (reinforces upstream drive)" : "feedback brake (reduces upstream drive)");
  const feedbackSign = feedbackKind === "stimulate" ? "+" : "−";

  function updateValue(key: string, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateToggle(key: string, value: boolean) {
    setToggles((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${diagram.title} feedback loop`}>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-control-summary p-3">
              <p className="ph-section-label">{model.state}</p>
              <p className="mt-1 text-sm text-ph-muted">{model.body}</p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              {model.readouts.map((readout) => (
                <span key={readout.label} className="ph-readout">
                  {readout.label} {readout.value}
                </span>
              ))}
            </div>
          </div>
          {model.warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {model.warning}
            </p>
          ) : null}
          <FeedbackDynamicsTrack
            feedbackActive={model.feedbackActive}
            feedbackKind={feedbackKind}
            variableLabel={loop.controlledLabel}
          />
          <FeedbackLoopGuide
            nodes={model.nodes}
            feedbackActive={model.feedbackActive}
            steps={loop.guideSteps}
            summary={loop.guideSummary}
            feedbackKind={feedbackKind}
            feedbackStepTitle={loop.feedbackStepTitle}
            feedbackTitle={loop.feedbackGuideTitle ?? feedbackLabel}
            feedbackVerbActive={loop.feedbackVerbActive}
            feedbackVerbInactive={loop.feedbackVerbInactive}
            feedbackStatusActive={loop.feedbackStatusActive}
            feedbackStatusInactive={loop.feedbackStatusInactive}
          />
          <svg role="img" aria-label={`${diagram.title} feedback loop`} viewBox="0 0 760 600" className="ph-pathway-canvas h-auto w-full">
            {/* Column headers: forward path on the right, feedback on the left */}
            <g>
              <text x="150" y="34" textAnchor="middle" fill={feedbackColor} fontSize="11" fontWeight="800" letterSpacing="1.4">
                ◀ {loop.feedbackHeader ?? "RETURN ARM"}
              </text>
              <text x="600" y="34" textAnchor="middle" fill="var(--ph-ok)" fontSize="11" fontWeight="800" letterSpacing="1.4">
                {loop.forwardHeader ?? "FORWARD ARM"} ▼
              </text>
            </g>

            {/* Forward (stimulatory) edges — green, top to bottom */}
            <FeedbackLoopEdge
              id={`${safeSvgId}-edge-1`}
              kind="stimulate"
              from={{ x: 420, y: 131 }}
              to={{ x: 420, y: 227 }}
              label={forwardLabels[0]}
              active={model.forwardActive}
              labelPosition={{ x: 530, y: 179 }}
            />
            <FeedbackLoopEdge
              id={`${safeSvgId}-edge-2`}
              kind="stimulate"
              from={{ x: 420, y: 301 }}
              to={{ x: 420, y: 397 }}
              label={forwardLabels[1]}
              active={model.forwardActive}
              labelPosition={{ x: 530, y: 349 }}
            />

            {/* Return arm: inhibitory brakes use blunt terminals; positive loops use arrows. */}
            <FeedbackLoopEdge
              id={`${safeSvgId}-feedback-1`}
              kind={feedbackKind}
              from={{ x: 305, y: 432 }}
              to={{ x: 305, y: 92 }}
              via={[
                { x: 140, y: 432 },
                { x: 140, y: 92 }
              ]}
              label={feedbackLabel}
              active={model.feedbackActive}
              labelPosition={{ x: 140, y: 262 }}
            />
            {/* Secondary feedback branch onto the middle node */}
            <FeedbackLoopEdge
              id={`${safeSvgId}-feedback-2`}
              kind={feedbackKind}
              from={{ x: 305, y: 432 }}
              to={{ x: 305, y: 262 }}
              via={[
                { x: 215, y: 432 },
                { x: 215, y: 262 }
              ]}
              active={model.feedbackActive}
            />

            <FeedbackLoopNode id={`${safeSvgId}-node-1`} index={1} role={nodeRoles[0]} label={model.nodes[0].label} value={model.nodes[0].value} x={420} y={92} active={model.nodes[0].active} />
            <FeedbackLoopNode id={`${safeSvgId}-node-2`} index={2} role={nodeRoles[1]} label={model.nodes[1].label} value={model.nodes[1].value} x={420} y={262} active={model.nodes[1].active} />
            <FeedbackLoopNode id={`${safeSvgId}-node-3`} index={3} role={nodeRoles[2]} label={model.nodes[2].label} value={model.nodes[2].value} x={420} y={432} active={model.nodes[2].active} />

            {!model.feedbackActive ? (
              <g>
                <rect x="60" y="250" width="150" height="26" rx="8" fill="color-mix(in srgb, var(--ph-warn), transparent 86%)" stroke="color-mix(in srgb, var(--ph-warn), transparent 50%)" />
                <text x="135" y="268" textAnchor="middle" fill="var(--ph-warn)" fontSize="12" fontWeight="800">
                  {loop.feedbackOffLabel ?? (feedbackKind === "stimulate" ? "return OFF" : "feedback OFF")}
                </text>
              </g>
            ) : null}

            {/* Legend */}
            <g transform="translate(40 520)">
              <rect x="0" y="0" width="680" height="58" rx="10" fill="color-mix(in srgb, var(--ph-surface-2), transparent 25%)" stroke="var(--ph-border)" />
              <text x="16" y="22" fill="var(--ph-muted)" fontSize="10" fontWeight="800" letterSpacing="1.4">HOW TO READ</text>
              {/* stimulate key */}
              <line x1="16" y1="42" x2="52" y2="42" stroke="var(--ph-ok)" strokeWidth="3.4" strokeLinecap="round" markerEnd={`url(#${safeSvgId}-legend-arrow)`} />
              <defs>
                <marker id={`${safeSvgId}-legend-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ph-ok)" />
                </marker>
                <marker id={`${safeSvgId}-legend-feedback-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={feedbackColor} />
                </marker>
              </defs>
              <text x="62" y="46" fill="var(--ph-text)" fontSize="12" fontWeight="700">
                <tspan fontWeight="900" fill="var(--ph-ok)">+ </tspan>{loop.legendForward ?? "forward signal (drives the next step)"}
              </text>
              {/* inhibit key */}
              <line
                x1="392"
                y1="42"
                x2="424"
                y2="42"
                stroke={feedbackColor}
                strokeWidth="3.4"
                strokeDasharray={feedbackKind === "inhibit" ? "7 5" : undefined}
                strokeLinecap="round"
                markerEnd={feedbackKind === "stimulate" ? `url(#${safeSvgId}-legend-feedback-arrow)` : undefined}
              />
              {feedbackKind === "inhibit" ? (
                <line x1="424" y1="35" x2="424" y2="49" stroke={feedbackColor} strokeWidth="4" strokeLinecap="round" />
              ) : null}
              <text x="434" y="46" fill="var(--ph-text)" fontSize="12" fontWeight="700">
                <tspan fontWeight="900" fill={feedbackColor}>{feedbackSign} </tspan>{feedbackLegend}
              </text>
            </g>
          </svg>
          {config.readingGuide ? (
            <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
              <span className="font-black uppercase tracking-[0.14em] text-ph-text">In plain terms · </span>
              {config.readingGuide}
            </p>
          ) : null}
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel ph-control-deck p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              {config.controls.map((control) => (
                <Slider
                  key={control.key}
                  label={control.label}
                  value={values[control.key]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  unit={control.unit}
                  defaultValue={control.defaultValue}
                  onChange={(value) => updateValue(control.key, value)}
                />
              ))}
              {config.toggles.map((toggle) => (
                <PerturbationToggle
                  key={toggle.key}
                  label={toggle.label}
                  checked={toggles[toggle.key]}
                  onChange={(value) => updateToggle(toggle.key, value)}
                />
              ))}
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

      <ReportError diagramId={config.diagramId} />
    </section>
  );
}
