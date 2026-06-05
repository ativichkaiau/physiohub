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

export type FeedbackLabConfig = {
  diagramId: string;
  controls: CurveLabControl[];
  toggles: FeedbackToggle[];
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
            <div className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
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
          <svg role="img" aria-label={`${diagram.title} node graph`} viewBox="0 0 700 520" className="ph-pathway-canvas h-auto w-full">
            <text x="28" y="36" fill="var(--ph-muted)" fontSize="11" fontWeight="800" letterSpacing="2.4">
              SIGNAL PATHWAY
            </text>
            <text x="672" y="36" textAnchor="end" fill="var(--ph-muted)" fontSize="11" fontWeight="800" letterSpacing="2.4">
              NEGATIVE FEEDBACK
            </text>
            <FeedbackLoopEdge id={`${safeSvgId}-edge-1`} from={{ x: 350, y: 115 }} to={{ x: 350, y: 190 }} label="drive" active={model.forwardActive} />
            <FeedbackLoopEdge id={`${safeSvgId}-edge-2`} from={{ x: 350, y: 255 }} to={{ x: 350, y: 330 }} label="response" active={model.forwardActive} />
            <FeedbackLoopEdge id={`${safeSvgId}-feedback-1`} from={{ x: 350, y: 395 }} to={{ x: 142, y: 88 }} label="feedback" inhibitory active={model.feedbackActive} />
            <FeedbackLoopEdge id={`${safeSvgId}-feedback-2`} from={{ x: 350, y: 395 }} to={{ x: 152, y: 228 }} label="set point brake" inhibitory active={model.feedbackActive} />
            <FeedbackLoopNode id={`${safeSvgId}-node-1`} label={model.nodes[0].label} value={model.nodes[0].value} x={350} y={80} active={model.nodes[0].active} />
            <FeedbackLoopNode id={`${safeSvgId}-node-2`} label={model.nodes[1].label} value={model.nodes[1].value} x={350} y={220} active={model.nodes[1].active} />
            <FeedbackLoopNode id={`${safeSvgId}-node-3`} label={model.nodes[2].label} value={model.nodes[2].value} x={350} y={360} active={model.nodes[2].active} />
            {!model.feedbackActive ? (
              <g>
                <rect x="258" y="455" width="184" height="30" rx="8" fill="color-mix(in srgb, var(--ph-warn), transparent 86%)" stroke="color-mix(in srgb, var(--ph-warn), transparent 50%)" />
                <text x="350" y="475" textAnchor="middle" fill="var(--ph-warn)" fontSize="13" fontWeight="800">
                  Feedback path inactive
                </text>
              </g>
            ) : null}
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
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
