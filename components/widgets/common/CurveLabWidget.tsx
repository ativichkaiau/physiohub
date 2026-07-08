"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import {
  Curve,
  PerturbationToggle,
  Slider,
  type CurveAnnotation,
  type CurveBand,
  type CurveSeries
} from "@/components/widgets/primitives";
import { parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";
import { Highlighted } from "@/components/widgets/common/Highlighted";

export type CurveLabControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
};

export type CurveLabSummary = {
  state: string;
  body: string;
  readouts: Array<{ label: string; value: string }>;
  warning?: string;
};

export type CurveLabConfig = {
  diagramId: string;
  title: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  controls: CurveLabControl[];
  overlayLabel?: string;
  readingGuide?: string;
  bands?: CurveBand[];
  buildSeries: (values: Record<string, number>) => CurveSeries[];
  buildReferenceSeries?: (values: Record<string, number>) => CurveSeries[];
  buildAnnotations?: (values: Record<string, number>) => CurveAnnotation[];
  getCursorX?: (values: Record<string, number>) => number | undefined;
  summarize: (values: Record<string, number>) => CurveLabSummary;
};

function initialValues(controls: CurveLabControl[], searchParams: URLSearchParams) {
  return Object.fromEntries(
    controls.map((control) => [
      control.key,
      parseNumber(searchParams.get(control.key), control.defaultValue, control.min, control.max)
    ])
  );
}

function valuesChanged(a: Record<string, number>, b: Record<string, number>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (Math.abs((a[key] ?? 0) - (b[key] ?? 0)) > 0.001) {
      return true;
    }
  }
  return false;
}

export function CurveLabWidget({ config }: { config: CurveLabConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const diagram = getDiagramById(config.diagramId);
  const [values, setValues] = useState(() => initialValues(config.controls, searchParams));
  const [overlay, setOverlay] = useState(() => parseBoolean(searchParams.get("overlay"), true));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ values, overlay });

  useEffect(() => {
    stateRef.current = { values, overlay };
  }, [overlay, values]);

  useEffect(() => {
    const current = stateRef.current;
    const params = new URLSearchParams(currentQuery);
    const nextValues = initialValues(config.controls, params);
    const nextOverlay = parseBoolean(params.get("overlay"), current.overlay);
    if (valuesChanged(nextValues, current.values)) {
      setValues(nextValues);
    }
    if (nextOverlay !== current.overlay) {
      setOverlay(nextOverlay);
    }
  }, [config.controls, currentQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    config.controls.forEach((control) => {
      params.set(control.key, values[control.key].toFixed(control.step < 1 ? 2 : 0));
    });
    params.set("overlay", overlay ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [config.controls, currentQuery, overlay, pathname, router, values]);

  const summary = config.summarize(values);
  const series = useMemo(() => config.buildSeries(values), [config, values]);
  const referenceSeries = useMemo(
    () => (overlay && config.buildReferenceSeries ? config.buildReferenceSeries(values) : []),
    [config, overlay, values]
  );

  // Snapshot compare: freeze the current curve as a ghost overlay, then perturb
  // the controls to see before/after (e.g. normal vs shock) on the same axes.
  const [pinned, setPinned] = useState<{ series: CurveSeries[]; caption: string } | null>(null);

  const chartReference = useMemo(
    () => (pinned ? [...pinned.series, ...referenceSeries] : referenceSeries),
    [pinned, referenceSeries]
  );

  function pinSnapshot() {
    const snap = series.map((s) => ({
      ...s,
      id: `pin-${s.id}`,
      label: `📌 ${s.label}`,
      dashed: true,
      strokeWidth: 2,
      data: s.data.map((p) => ({ ...p }))
    }));
    const caption = config.controls
      .map((c) => `${c.label} ${values[c.key].toFixed(c.step < 1 ? 2 : 0)}${c.unit ? ` ${c.unit}` : ""}`)
      .join(" · ");
    setPinned({ series: snap, caption });
  }

  function updateValue(key: string, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${diagram.title} interactive curve`}>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-control-summary p-3">
              <p className="ph-section-label">{summary.state}</p>
              <p className="mt-1 text-sm text-ph-muted">{summary.body}</p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              {summary.readouts.map((readout) => (
                <span key={readout.label} className="ph-readout">
                  {readout.label} {readout.value}
                </span>
              ))}
            </div>
          </div>
          {summary.warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              {summary.warning}
            </p>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={pinned ? () => setPinned(null) : pinSnapshot}
              aria-pressed={pinned != null}
              className="focus-ring ph-clay-button inline-flex items-center gap-1.5 rounded-ph px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ph-muted hover:text-ph-text"
            >
              {pinned ? "✕ Clear pin" : "📌 Pin snapshot"}
            </button>
            {pinned ? (
              <span
                className="ph-clay-chip inline-flex max-w-full truncate px-2.5 py-1 text-[11px] text-ph-muted"
                title={pinned.caption}
              >
                Comparing vs pinned · {pinned.caption}
              </span>
            ) : (
              <span className="text-[11px] text-ph-muted-2">Freeze this curve, then perturb the controls to compare.</span>
            )}
          </div>
          <Curve
            title={config.title}
            xDomain={config.xDomain}
            yDomain={config.yDomain}
            xLabel={config.xLabel}
            yLabel={config.yLabel}
            series={series}
            referenceSeries={chartReference}
            annotations={config.buildAnnotations?.(values) ?? []}
            bands={config.bands}
            cursorX={config.getCursorX?.(values)}
            height={420}
          />
          {config.readingGuide ? (
            <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
              <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
              <Highlighted text={config.readingGuide} />
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
              {config.buildReferenceSeries ? (
                <PerturbationToggle
                  label={config.overlayLabel ?? "Show baseline overlay"}
                  checked={overlay}
                  onChange={setOverlay}
                />
              ) : null}
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
