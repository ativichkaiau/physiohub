"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, ScrubBar, type CurveSeries } from "@/components/widgets/primitives";
import { Highlighted } from "@/components/widgets/common/Highlighted";
import { parseNumber } from "@/components/widgets/widgetUtils";

export type TimelinePhase = {
  start: number;
  end: number;
  title: string;
  body: string;
};

export type TimelineLabConfig = {
  diagramId: string;
  title: string;
  duration: number;
  xLabel: string;
  yLabel: string;
  yDomain: [number, number];
  series: CurveSeries[];
  phases: TimelinePhase[];
  readout: (time: number) => Array<{ label: string; value: string }>;
  readingGuide?: string;
};

function parseTraces(value: string | null, series: CurveSeries[]) {
  const all = series.map((item) => item.id);
  if (!value) return new Set(all);
  const selected = new Set(value.split(",").filter((id) => all.includes(id)));
  return selected.size ? selected : new Set(all);
}

function traceKey(traces: Set<string>, series: CurveSeries[]) {
  return series.map((item) => item.id).filter((id) => traces.has(id)).join(",");
}

export function TimelineLabWidget({ config }: { config: TimelineLabConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const diagram = getDiagramById(config.diagramId);
  const [time, setTime] = useState(() => parseNumber(searchParams.get("t"), 0, 0, config.duration));
  const [speed, setSpeed] = useState(() => parseNumber(searchParams.get("speed"), 1, 0.5, 2));
  const [playing, setPlaying] = useState(false);
  const [traces, setTraces] = useState(() => parseTraces(searchParams.get("traces"), config.series));
  const urlTimer = useRef<number | undefined>(undefined);
  const traceList = traceKey(traces, config.series);
  const stateRef = useRef({ time, speed, traceList });

  useEffect(() => {
    stateRef.current = { time, speed, traceList };
  }, [speed, time, traceList]);

  useEffect(() => {
    const current = stateRef.current;
    const params = new URLSearchParams(currentQuery);
    const nextTime = parseNumber(params.get("t"), current.time, 0, config.duration);
    const nextSpeed = parseNumber(params.get("speed"), current.speed, 0.5, 2);
    const nextTraces = parseTraces(params.get("traces"), config.series);
    const nextTraceList = traceKey(nextTraces, config.series);
    if (Math.abs(nextTime - current.time) > 0.001) setTime(nextTime);
    if (Math.abs(nextSpeed - current.speed) > 0.001) setSpeed(nextSpeed);
    if (nextTraceList !== current.traceList) setTraces(nextTraces);
  }, [config.duration, config.series, currentQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("t", time.toFixed(2));
    params.set("traces", traceList);
    params.set("speed", String(speed));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [currentQuery, pathname, router, speed, time, traceList]);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setTime((current) => {
        const next = current + 0.02 * speed;
        if (next >= config.duration) {
          setPlaying(false);
          return config.duration;
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(interval);
  }, [config.duration, playing, speed]);

  const phase =
    time <= 0.002
      ? { title: "Start", body: "The timeline is pegged at the beginning. Press Play or drag the scrubber." }
      : time >= config.duration - 0.002
        ? { title: "End", body: "The timeline is pegged at the end. Restart to replay the sequence." }
        : config.phases.find((item) => time >= item.start && time < item.end) ?? config.phases[0];
  const visibleSeries = useMemo(
    () => config.series.map((item) => ({ ...item, visible: traces.has(item.id) })),
    [config.series, traces]
  );

  function toggleTrace(id: string, checked: boolean) {
    setTraces((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${diagram.title} timeline`}>
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-control-summary p-3">
              <p className="ph-section-label">{phase.title}</p>
              <p className="mt-1 text-sm text-ph-muted">{phase.body}</p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              {config.readout(time).map((readout) => (
                <span key={readout.label} className="ph-readout">
                  {readout.label} {readout.value}
                </span>
              ))}
            </div>
          </div>
          <Curve
            title={config.title}
            xDomain={[0, config.duration]}
            yDomain={config.yDomain}
            xLabel={config.xLabel}
            yLabel={config.yLabel}
            series={visibleSeries}
            cursorX={time}
            height={420}
          />
          {config.readingGuide ? (
            <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
              <span className="font-black uppercase tracking-[0.14em] text-ph-text">Reading the trace · </span>
              <Highlighted text={config.readingGuide} />
            </p>
          ) : null}
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel ph-control-deck p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <ScrubBar
              label="Timeline scrubber"
              value={time}
              duration={config.duration}
              step={0.01}
              playing={playing}
              speed={speed}
              onChange={(value) => {
                setPlaying(false);
                setTime(value);
              }}
              onPlayingChange={(nextPlaying) => {
                if (time >= config.duration) setTime(0);
                setPlaying(nextPlaying);
              }}
              onSpeedChange={setSpeed}
            />
            <div className="mt-5 grid gap-2">
              <p className="text-sm font-semibold">Traces</p>
              {config.series.map((item) => (
                <PerturbationToggle
                  key={item.id}
                  label={item.label}
                  checked={traces.has(item.id)}
                  onChange={(checked) => toggleTrace(item.id, checked)}
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
