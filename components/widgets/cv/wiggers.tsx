"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import {
  Curve,
  type CurvePoint,
  type CurveSeries,
  PerturbationToggle,
  ScrubBar
} from "@/components/widgets/primitives";

const DIAGRAM_ID = "cv/wiggers";
const DURATION = 0.8;
const DEFAULT_SPEED = 1;
const TRACE_IDS = ["ao", "lv", "la", "vol", "ecg"] as const;
type TraceId = (typeof TRACE_IDS)[number];

const diagram = getDiagramById(DIAGRAM_ID);

const pressureTraces: Record<"ao" | "lv" | "la", CurvePoint[]> = {
  ao: [
    { x: 0, y: 82 },
    { x: 0.1, y: 80 },
    { x: 0.16, y: 80 },
    { x: 0.22, y: 105 },
    { x: 0.32, y: 122 },
    { x: 0.42, y: 104 },
    { x: 0.45, y: 92 },
    { x: 0.47, y: 98 },
    { x: 0.55, y: 86 },
    { x: 0.8, y: 82 }
  ],
  lv: [
    { x: 0, y: 8 },
    { x: 0.08, y: 12 },
    { x: 0.14, y: 12 },
    { x: 0.2, y: 88 },
    { x: 0.3, y: 122 },
    { x: 0.41, y: 94 },
    { x: 0.49, y: 9 },
    { x: 0.8, y: 8 }
  ],
  la: [
    { x: 0, y: 6 },
    { x: 0.07, y: 13 },
    { x: 0.12, y: 8 },
    { x: 0.24, y: 6 },
    { x: 0.42, y: 14 },
    { x: 0.53, y: 7 },
    { x: 0.8, y: 6 }
  ]
};

const volumeTrace: CurvePoint[] = [
  { x: 0, y: 118 },
  { x: 0.1, y: 130 },
  { x: 0.2, y: 130 },
  { x: 0.3, y: 104 },
  { x: 0.42, y: 70 },
  { x: 0.5, y: 70 },
  { x: 0.65, y: 104 },
  { x: 0.8, y: 118 }
];

const ecgTrace: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 0.04, y: 0 },
  { x: 0.06, y: 0.35 },
  { x: 0.08, y: 0 },
  { x: 0.13, y: 0 },
  { x: 0.145, y: -0.55 },
  { x: 0.16, y: 1 },
  { x: 0.18, y: -0.35 },
  { x: 0.22, y: 0 },
  { x: 0.34, y: 0 },
  { x: 0.39, y: 0.55 },
  { x: 0.45, y: 0 },
  { x: 0.8, y: 0 }
];

const traceLabels: Record<TraceId, string> = {
  ao: "Aortic pressure",
  lv: "LV pressure",
  la: "LA pressure",
  vol: "LV volume",
  ecg: "ECG"
};

const phases = [
  {
    start: 0,
    end: 0.1,
    title: "Atrial systole",
    body: "Atrial contraction tops off ventricular filling; LV volume rises toward EDV."
  },
  {
    start: 0.1,
    end: 0.2,
    title: "Isovolumic contraction",
    body: "Both valves are closed. LV pressure rises while volume stays constant."
  },
  {
    start: 0.2,
    end: 0.43,
    title: "Ejection",
    body: "The aortic valve opens. LV and aortic pressures rise together as LV volume falls."
  },
  {
    start: 0.43,
    end: 0.5,
    title: "Isovolumic relaxation",
    body: "The aortic valve closes at the dicrotic notch; both valves are closed again."
  },
  {
    start: 0.5,
    end: DURATION,
    title: "Ventricular filling",
    body: "The mitral valve opens. LV pressure stays low while volume recovers."
  }
];

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

function parseTraces(value: string | null) {
  if (!value) {
    return new Set<TraceId>(TRACE_IDS);
  }
  const next = new Set<TraceId>();
  value.split(",").forEach((trace) => {
    if (TRACE_IDS.includes(trace as TraceId)) {
      next.add(trace as TraceId);
    }
  });
  return next.size ? next : new Set<TraceId>(TRACE_IDS);
}

function traceKey(traces: Set<TraceId>) {
  return TRACE_IDS.filter((trace) => traces.has(trace)).join(",");
}

function interpolate(data: CurvePoint[], x: number) {
  const first = data[0];
  const last = data[data.length - 1];
  if (x <= first.x) {
    return first.y;
  }
  if (x >= last.x) {
    return last.y;
  }
  for (let index = 1; index < data.length; index += 1) {
    const current = data[index];
    const previous = data[index - 1];
    if (x <= current.x) {
      const ratio = (x - previous.x) / (current.x - previous.x);
      return previous.y + ratio * (current.y - previous.y);
    }
  }
  return last.y;
}

function getPhase(time: number) {
  if (time <= 0.002) {
    return {
      title: "Cycle start",
      body: "The trace is pegged at the beginning of the cycle. Press Play or drag the scrubber to enter the sequence."
    };
  }
  if (time >= DURATION - 0.002) {
    return {
      title: "Cycle end",
      body: "The trace is pegged at the end of the cycle. Restart returns to atrial systole."
    };
  }
  return phases.find((phase) => time >= phase.start && time < phase.end) ?? phases[0];
}

function buildPressureSeries(traces: Set<TraceId>): CurveSeries[] {
  return [
    {
      id: "ao",
      label: traceLabels.ao,
      data: pressureTraces.ao,
      colorVar: "var(--ph-curve-1)",
      visible: traces.has("ao")
    },
    {
      id: "lv",
      label: traceLabels.lv,
      data: pressureTraces.lv,
      colorVar: "var(--ph-curve-2)",
      visible: traces.has("lv")
    },
    {
      id: "la",
      label: traceLabels.la,
      data: pressureTraces.la,
      colorVar: "var(--ph-curve-3)",
      visible: traces.has("la")
    }
  ];
}

export default function WiggersWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [time, setTime] = useState(() => parseNumber(searchParams.get("t"), 0, 0, DURATION));
  const [speed, setSpeed] = useState(() => parseNumber(searchParams.get("speed"), DEFAULT_SPEED, 0.5, 2));
  const [playing, setPlaying] = useState(false);
  const [traces, setTraces] = useState<Set<TraceId>>(() => parseTraces(searchParams.get("traces")));
  const urlTimer = useRef<number | undefined>(undefined);

  const enabledTraceKey = traceKey(traces);
  const stateRef = useRef({ time, speed, traceKey: enabledTraceKey });
  const phase = getPhase(time);

  useEffect(() => {
    stateRef.current = { time, speed, traceKey: enabledTraceKey };
  }, [enabledTraceKey, speed, time]);

  useEffect(() => {
    const current = stateRef.current;
    const nextTime = parseNumber(searchParams.get("t"), current.time, 0, DURATION);
    const nextSpeed = parseNumber(searchParams.get("speed"), current.speed, 0.5, 2);
    const nextTraces = parseTraces(searchParams.get("traces"));

    if (Math.abs(nextTime - current.time) > 0.001) {
      setTime(nextTime);
    }
    if (nextSpeed !== current.speed) {
      setSpeed(nextSpeed);
    }
    if (traceKey(nextTraces) !== current.traceKey) {
      setTraces(nextTraces);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    params.set("t", time.toFixed(2));
    params.set("traces", enabledTraceKey);
    params.set("speed", String(speed));
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) {
      return;
    }
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [currentQuery, enabledTraceKey, pathname, router, speed, time]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    const interval = window.setInterval(() => {
      setTime((current) => {
        const next = current + 0.01 * speed;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(interval);
  }, [playing, speed]);

  const pressureSeries = useMemo(() => buildPressureSeries(traces), [traces]);
  const volumeSeries = useMemo<CurveSeries[]>(
    () => [
      {
        id: "vol",
        label: traceLabels.vol,
        data: volumeTrace,
        colorVar: "var(--ph-curve-4)",
        visible: traces.has("vol")
      }
    ],
    [traces]
  );
  const ecgSeries = useMemo<CurveSeries[]>(
    () => [
      {
        id: "ecg",
        label: traceLabels.ecg,
        data: ecgTrace,
        colorVar: "var(--ph-accent)",
        visible: traces.has("ecg")
      }
    ],
    [traces]
  );

  const readout = {
    ao: Math.round(interpolate(pressureTraces.ao, time)),
    lv: Math.round(interpolate(pressureTraces.lv, time)),
    la: Math.round(interpolate(pressureTraces.la, time)),
    vol: Math.round(interpolate(volumeTrace, time))
  };

  function setTrace(trace: TraceId, checked: boolean) {
    setTraces((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(trace);
      } else {
        next.delete(trace);
      }
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
        <section className="ph-panel ph-chart-stage p-3 sm:p-4" aria-label="Wiggers interactive plot">
          <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div aria-live="polite" className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
              <p className="ph-section-label">{phase.title}</p>
              <p className="mt-1 text-sm text-ph-muted">{phase.body}</p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">Ao {readout.ao} mmHg</span>
              <span className="ph-readout">LV {readout.lv} mmHg</span>
              <span className="ph-readout">LA {readout.la} mmHg</span>
              <span className="ph-readout">LVV {readout.vol} mL</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Curve
              title="Aortic, left ventricular, and left atrial pressure over one cardiac cycle"
              xDomain={[0, DURATION]}
              yDomain={[0, 130]}
              xLabel="time"
              yLabel="mmHg"
              series={pressureSeries}
              cursorX={time}
              annotations={[
                { x: 0.16, y: 12, label: "QRS" },
                { x: 0.46, y: 96, label: "dicrotic notch" }
              ]}
              height={250}
            />
            <Curve
              title="Left ventricular volume over one cardiac cycle"
              xDomain={[0, DURATION]}
              yDomain={[50, 140]}
              xLabel="time"
              yLabel="mL"
              series={volumeSeries}
              cursorX={time}
              height={170}
            />
            <Curve
              title="ECG over one cardiac cycle"
              xDomain={[0, DURATION]}
              yDomain={[-1, 1]}
              xLabel="time"
              yLabel="ECG"
              series={ecgSeries}
              cursorX={time}
              annotations={[
                { x: 0.06, y: 0.36, label: "P" },
                { x: 0.16, y: 1, label: "QRS" },
                { x: 0.39, y: 0.55, label: "T" }
              ]}
              height={150}
            />
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <ScrubBar
              label="Cardiac cycle scrubber"
              value={time}
              duration={DURATION}
              step={0.01}
              playing={playing}
              speed={speed}
              onChange={(value) => {
                setPlaying(false);
                setTime(value);
              }}
              onPlayingChange={(nextPlaying) => {
                if (time >= DURATION) {
                  setTime(0);
                }
                setPlaying(nextPlaying);
              }}
              onSpeedChange={setSpeed}
            />

            <div className="mt-5 grid gap-2">
              <p className="text-sm font-semibold">Traces</p>
              {TRACE_IDS.map((trace) => (
                <PerturbationToggle
                  key={trace}
                  label={traceLabels[trace]}
                  checked={traces.has(trace)}
                  onChange={(checked) => setTrace(trace, checked)}
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

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
