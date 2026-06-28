export type CurvePoint = {
  x: number;
  y: number;
};

export type CurveSeries = {
  id: string;
  label: string;
  data: CurvePoint[];
  colorVar?: string;
  strokeWidth?: number;
  dashed?: boolean;
  visible?: boolean;
  /** Opt out of spline smoothing — draw straight segments so sharp peaks
   * (ECG R wave, action-potential upstroke) stay needle-sharp. */
  sharp?: boolean;
};

export type CurveAnnotation = {
  x: number;
  y: number;
  label: string;
};

/**
 * A shaded band behind the plot. For PHYSIOLOGIC RANGES `tone` maps to the
 * traffic light: ok = physiologic (green), warn = suboptimal (amber), danger =
 * red. For relationship curves with no good/bad range, use tone "phase" to
 * frame the curve into named PHASES (neutral alternating tints + dividers).
 * `axis` is the axis the from/to range applies to (default "x").
 */
export type CurveBand = {
  axis?: "x" | "y";
  from: number;
  to: number;
  tone: "ok" | "warn" | "danger" | "phase";
  label?: string;
};

export type CurveProps = {
  title: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  series: CurveSeries[];
  referenceSeries?: CurveSeries[];
  annotations?: CurveAnnotation[];
  bands?: CurveBand[];
  cursorX?: number;
  height?: number;
};

type PlotBox = { left: number; right: number; top: number; bottom: number };

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scale(value: number, domain: [number, number], range: [number, number]) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  const ratio = (value - domainMin) / (domainMax - domainMin);
  return rangeMin + ratio * (rangeMax - rangeMin);
}

function chartDomId(title: string, height: number, xDomain: [number, number], yDomain: [number, number]) {
  return `curve-${title}-${height}-${xDomain.join("-")}-${yDomain.join("-")}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function trimNumber(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
}

function formatTick(value: number, domain: [number, number]) {
  const span = Math.abs(domain[1] - domain[0]);
  if (span <= 2) return trimNumber(value.toFixed(2));
  if (span <= 20) return trimNumber(value.toFixed(1));
  return trimNumber(value.toFixed(0));
}

function isMonotonicX(data: CurvePoint[]) {
  if (data.length < 2) return false;
  let rising = true;
  let falling = true;
  for (let index = 1; index < data.length; index += 1) {
    rising = rising && data[index].x >= data[index - 1].x;
    falling = falling && data[index].x <= data[index - 1].x;
  }
  return rising || falling;
}

type Pixel = { x: number; y: number };

function toPixels(data: CurvePoint[], xDomain: [number, number], yDomain: [number, number], plot: PlotBox): Pixel[] {
  return data.map((p) => ({
    x: scale(p.x, xDomain, [plot.left, plot.right]),
    y: scale(p.y, yDomain, [plot.bottom, plot.top])
  }));
}

function straightPath(pts: Pixel[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

// Monotone cubic Hermite spline (Fritsch–Carlson) → cubic Béziers. Smooth and
// guaranteed not to overshoot, so sigmoids/exponentials and sparse hand-drawn
// waveforms render as real curves rather than connected line segments.
function monotonePath(input: Pixel[]) {
  const pts = input[0].x <= input[input.length - 1].x ? input : [...input].reverse();
  const n = pts.length;
  if (n < 3) return straightPath(pts);
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1].x - pts[i].x;
    slope[i] = dx[i] !== 0 ? (pts[i + 1].y - pts[i].y) / dx[i] : 0;
  }
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    const c1x = pts[i].x + h;
    const c1y = pts[i].y + m[i] * h;
    const c2x = pts[i + 1].x - h;
    const c2y = pts[i + 1].y - m[i + 1] * h;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

// Uniform Catmull-Rom → cubic Béziers for non-monotonic data (loops such as the
// pressure–volume and flow–volume loops, where x is not a single-valued function).
function catmullRomPath(pts: Pixel[]) {
  const n = pts.length;
  if (n < 3) return straightPath(pts);
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function pathFromPoints(
  data: CurvePoint[],
  xDomain: [number, number],
  yDomain: [number, number],
  plot: PlotBox,
  sharp = false
) {
  if (data.length < 2) {
    if (data.length === 0) return "";
    const x = scale(data[0].x, xDomain, [plot.left, plot.right]);
    const y = scale(data[0].y, yDomain, [plot.bottom, plot.top]);
    return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  const pts = toPixels(data, xDomain, yDomain, plot);
  if (sharp) return straightPath(pts);
  return isMonotonicX(data) ? monotonePath(pts) : catmullRomPath(pts);
}

function areaPathFromPoints(
  data: CurvePoint[],
  xDomain: [number, number],
  yDomain: [number, number],
  plot: PlotBox
) {
  const path = pathFromPoints(data, xDomain, yDomain, plot);
  const first = data[0];
  const last = data[data.length - 1];
  const firstX = scale(first.x, xDomain, [plot.left, plot.right]);
  const lastX = scale(last.x, xDomain, [plot.left, plot.right]);
  return `${path} L ${lastX.toFixed(2)} ${plot.bottom.toFixed(2)} L ${firstX.toFixed(2)} ${plot.bottom.toFixed(2)} Z`;
}

function interpolateYAtX(data: CurvePoint[], cursorX: number) {
  if (data.length === 0) return undefined;
  if (data.length === 1) return data[0].y;
  const rising = data[1].x >= data[0].x;
  const ordered = rising ? data : [...data].reverse();
  if (cursorX < ordered[0].x || cursorX > ordered[ordered.length - 1].x) return undefined;

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (cursorX === previous.x) return previous.y;
    if (cursorX === current.x) return current.y;
    if (cursorX > previous.x && cursorX < current.x) {
      const ratio = (cursorX - previous.x) / (current.x - previous.x || 1);
      return previous.y + (current.y - previous.y) * ratio;
    }
  }
  return undefined;
}

function readableSeriesLabel(label: string) {
  return label.length > 22 ? `${label.slice(0, 19)}...` : label;
}

function labelWidth(label: string) {
  return Math.min(156, Math.max(58, label.length * 6.7 + 28));
}

export function Curve({
  title,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  series,
  referenceSeries = [],
  annotations = [],
  bands = [],
  cursorX,
  height = 260
}: CurveProps) {
  const width = 680;
  const plot = { left: 72, right: 642, top: 30, bottom: height - 62 };
  const chartId = chartDomId(title, height, xDomain, yDomain);
  const visibleSeries = series.filter((item) => item.visible !== false);
  const visibleReferenceSeries = referenceSeries.filter((item) => item.visible !== false);
  const tickRatios = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const xTicks = tickRatios.map((ratio) => xDomain[0] + (xDomain[1] - xDomain[0]) * ratio);
  const yTicks = tickRatios.map((ratio) => yDomain[0] + (yDomain[1] - yDomain[0]) * ratio);
  const cursorPosition =
    typeof cursorX === "number" ? scale(cursorX, xDomain, [plot.left, plot.right]) : undefined;
  const cursorLabel = typeof cursorX === "number" ? formatTick(cursorX, xDomain) : "";
  const cursorPillWidth = Math.max(66, cursorLabel.length * 7.2 + 28);
  const areaSeries = yDomain[0] >= 0 ? visibleSeries.find((item) => isMonotonicX(item.data) && !item.dashed) : undefined;
  const legendItems = [...visibleSeries, ...visibleReferenceSeries];
  const axisFontSize = height < 260 ? 11 : 12;
  const axisLabelSize = height < 260 ? 12 : 13;
  const cursorMarkers =
    typeof cursorX === "number"
      ? visibleSeries
          .filter((item) => isMonotonicX(item.data))
          .map((item, index) => {
            const yValue = interpolateYAtX(item.data, cursorX);
            if (typeof yValue !== "number") return undefined;
            return {
              id: item.id,
              color: item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`,
              y: scale(yValue, yDomain, [plot.bottom, plot.top])
            };
          })
          .filter((item): item is { id: string; color: string; y: number } => Boolean(item))
      : [];
  const endLabels = (() => {
    if (visibleSeries.length > 4 || height < 220) return [];
    const candidates = visibleSeries
      .filter((item) => isMonotonicX(item.data) && item.data.length > 1)
      .map((item, index) => {
        const last = item.data[item.data.length - 1];
        const label = readableSeriesLabel(item.label);
        return {
          id: item.id,
          color: item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`,
          label,
          x: scale(last.x, xDomain, [plot.left, plot.right]),
          y: clampNumber(scale(last.y, yDomain, [plot.bottom, plot.top]), plot.top + 16, plot.bottom - 16),
          width: labelWidth(label)
        };
      })
      .sort((a, b) => a.y - b.y);
    const gap = 24;
    for (let index = 1; index < candidates.length; index += 1) {
      candidates[index].y = Math.max(candidates[index].y, candidates[index - 1].y + gap);
    }
    for (let index = candidates.length - 2; index >= 0; index -= 1) {
      candidates[index].y = Math.min(candidates[index].y, candidates[index + 1].y - gap);
    }
    return candidates.map((item) => ({
      ...item,
      y: clampNumber(item.y, plot.top + 16, plot.bottom - 16),
      boxX: plot.right - item.width - 8
    }));
  })();

  return (
    <figure className="ph-curve-frame min-w-0 max-w-full p-3 sm:p-4">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="ph-section-label max-w-full truncate text-ph-text">{title}</span>
        {legendItems.length ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-ph-muted">
            {legendItems.map((item, index) => (
              <span key={`legend-${item.id}`} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-0 w-7 rounded-full border-t-[3px]"
                  style={{
                    borderColor: item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`,
                    borderStyle: item.dashed ? "dashed" : "solid",
                    opacity: item.dashed ? 0.78 : 1
                  }}
                />
                <span className={item.dashed ? "opacity-75" : undefined}>{item.label}</span>
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
      <div className="-mx-1 max-w-full overflow-x-auto pb-1">
        <svg
          role="img"
          aria-label={title}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full md:min-w-[620px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{title}</title>
          <desc>
            Plot of {title}
            {xLabel ? ` with ${xLabel} on the x axis` : ""}
            {yLabel ? ` and ${yLabel} on the y axis` : ""}.
          </desc>
          <defs>
            <linearGradient id={`${chartId}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--ph-accent), transparent 82%)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--ph-accent), transparent 98%)" />
            </linearGradient>
            <filter id={`${chartId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${chartId}-clip`}>
              <rect
                x={plot.left}
                y={plot.top}
                width={plot.right - plot.left}
                height={plot.bottom - plot.top}
                rx="10"
              />
            </clipPath>
          </defs>
          <rect x="0" y="0" width={width} height={height} rx="12" fill="var(--ph-surface)" />
          <rect
            x={plot.left}
            y={plot.top}
            width={plot.right - plot.left}
            height={plot.bottom - plot.top}
            rx="10"
            fill="color-mix(in srgb, var(--ph-surface), var(--ph-surface-2) 46%)"
            stroke="var(--ph-border-strong)"
          />
          {/* Range zones (green/amber/red) or named phases (neutral alternating tints) */}
          {bands.map((band, index) => {
            const axis = band.axis ?? "x";
            const isPhase = band.tone === "phase";
            const lo = Math.min(band.from, band.to);
            const hi = Math.max(band.from, band.to);
            const fill = isPhase
              ? `color-mix(in srgb, var(--ph-accent), transparent ${index % 2 === 0 ? 92 : 97}%)`
              : `color-mix(in srgb, var(--ph-${band.tone}), transparent 85%)`;
            const labelFill = isPhase ? "var(--ph-muted)" : `color-mix(in srgb, var(--ph-${band.tone}), var(--ph-text) 35%)`;
            const divider = "color-mix(in srgb, var(--ph-axis), transparent 60%)";
            if (axis === "x") {
              const x0 = scale(clampNumber(lo, xDomain[0], xDomain[1]), xDomain, [plot.left, plot.right]);
              const x1 = scale(clampNumber(hi, xDomain[0], xDomain[1]), xDomain, [plot.left, plot.right]);
              const left = Math.min(x0, x1);
              if (Math.abs(x1 - x0) < 0.5) return null;
              return (
                <g key={`zone-${index}`} clipPath={`url(#${chartId}-clip)`}>
                  <rect x={left} y={plot.top} width={Math.abs(x1 - x0)} height={plot.bottom - plot.top} fill={fill} />
                  {isPhase && index > 0 ? (
                    <line x1={left} y1={plot.top} x2={left} y2={plot.bottom} stroke={divider} strokeWidth="1" strokeDasharray="2 5" />
                  ) : null}
                  {band.label ? (
                    <text x={(x0 + x1) / 2} y={plot.top + 12} textAnchor="middle" fontSize="8.5" fontWeight="800" letterSpacing="0.4" fill={labelFill}>
                      {band.label.toUpperCase()}
                    </text>
                  ) : null}
                </g>
              );
            }
            const y0 = scale(clampNumber(lo, yDomain[0], yDomain[1]), yDomain, [plot.bottom, plot.top]);
            const y1 = scale(clampNumber(hi, yDomain[0], yDomain[1]), yDomain, [plot.bottom, plot.top]);
            const topEdge = Math.min(y0, y1);
            if (Math.abs(y1 - y0) < 0.5) return null;
            return (
              <g key={`zone-${index}`} clipPath={`url(#${chartId}-clip)`}>
                <rect x={plot.left} y={topEdge} width={plot.right - plot.left} height={Math.abs(y1 - y0)} fill={fill} />
                {isPhase && index > 0 ? (
                  <line x1={plot.left} y1={topEdge} x2={plot.right} y2={topEdge} stroke={divider} strokeWidth="1" strokeDasharray="2 5" />
                ) : null}
                {band.label ? (
                  <text x={plot.right - 8} y={(y0 + y1) / 2 + 3} textAnchor="end" fontSize="8.5" fontWeight="800" letterSpacing="0.4" fill={labelFill}>
                    {band.label.toUpperCase()}
                  </text>
                ) : null}
              </g>
            );
          })}
          {yTicks.slice(0, -1).map((tick, index) => {
            if (index % 2 !== 0) return null;
            const nextTick = yTicks[index + 1];
            const yTop = scale(nextTick, yDomain, [plot.bottom, plot.top]);
            const yBottom = scale(tick, yDomain, [plot.bottom, plot.top]);
            return (
              <rect
                key={`band-${tick}`}
                x={plot.left}
                y={yTop}
                width={plot.right - plot.left}
                height={yBottom - yTop}
                fill="color-mix(in srgb, var(--ph-surface-2), transparent 42%)"
                opacity="0.42"
              />
            );
          })}
          {xTicks.map((tick) => {
            const x = scale(tick, xDomain, [plot.left, plot.right]);
            return (
              <g key={`x-${tick}`}>
                <line x1={x} y1={plot.top} x2={x} y2={plot.bottom} stroke="var(--ph-grid)" strokeWidth="1.2" strokeDasharray="3 8" vectorEffect="non-scaling-stroke" />
                <line x1={x} y1={plot.bottom} x2={x} y2={plot.bottom + 7} stroke="var(--ph-axis)" opacity="0.8" vectorEffect="non-scaling-stroke" />
                <text x={x} y={height - 26} textAnchor="middle" fill="var(--ph-muted)" fontSize={axisFontSize} fontWeight="800">
                  {formatTick(tick, xDomain)}
                </text>
              </g>
            );
          })}
          {yTicks.map((tick) => {
            const y = scale(tick, yDomain, [plot.bottom, plot.top]);
            return (
              <g key={`y-${tick}`}>
                <line x1={plot.left} y1={y} x2={plot.right} y2={y} stroke="var(--ph-grid)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <line x1={plot.left - 7} y1={y} x2={plot.left} y2={y} stroke="var(--ph-axis)" opacity="0.8" vectorEffect="non-scaling-stroke" />
                <text x={plot.left - 12} y={y + 4} textAnchor="end" fill="var(--ph-muted)" fontSize={axisFontSize} fontWeight="800">
                  {formatTick(tick, yDomain)}
                </text>
              </g>
            );
          })}
          <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} stroke="var(--ph-axis)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} stroke="var(--ph-axis)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {xLabel ? (
            <text x={(plot.left + plot.right) / 2} y={height - 7} textAnchor="middle" fill="var(--ph-axis)" fontSize={axisLabelSize} fontWeight="900">
              {xLabel}
            </text>
          ) : null}
          {yLabel ? (
            <text
              x="18"
              y={(plot.top + plot.bottom) / 2}
              textAnchor="middle"
              fill="var(--ph-axis)"
              fontSize={axisLabelSize}
              fontWeight="900"
              transform={`rotate(-90 18 ${(plot.top + plot.bottom) / 2})`}
            >
              {yLabel}
            </text>
          ) : null}
          <g clipPath={`url(#${chartId}-clip)`}>
            {areaSeries ? (
              <path
                d={areaPathFromPoints(areaSeries.data, xDomain, yDomain, plot)}
                fill={`url(#${chartId}-area)`}
                opacity="0.62"
              />
            ) : null}
            {visibleReferenceSeries.map((item) => (
              <path
                key={item.id}
                d={pathFromPoints(item.data, xDomain, yDomain, plot, item.sharp)}
                fill="none"
                stroke={item.colorVar ?? "var(--ph-curve-ref)"}
                strokeDasharray={item.dashed ? "8 7" : "4 5"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={item.strokeWidth ?? 2.6}
                opacity="0.86"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {visibleSeries.map((item, index) => {
              const stroke = item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`;
              const d = pathFromPoints(item.data, xDomain, yDomain, plot, item.sharp);
              return (
                <g key={item.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={(item.strokeWidth ?? 4) + 4}
                    strokeDasharray={item.dashed ? "8 7" : undefined}
                    opacity="0.18"
                    filter={`url(#${chartId}-glow)`}
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={item.strokeWidth ?? 4}
                    strokeDasharray={item.dashed ? "8 7" : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>
          {endLabels.map((item) => (
            <g key={`end-label-${item.id}`}>
              <line
                x1={clampNumber(item.x, plot.left, plot.right)}
                y1={item.y}
                x2={item.boxX + 8}
                y2={item.y}
                stroke={item.color}
                strokeWidth="1.4"
                opacity="0.7"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={item.boxX}
                y={item.y - 11}
                width={item.width}
                height="22"
                rx="7"
                fill="color-mix(in srgb, var(--ph-surface), transparent 8%)"
                stroke={item.color}
                strokeOpacity="0.62"
              />
              <text x={item.boxX + item.width / 2} y={item.y + 4} textAnchor="middle" fill="var(--ph-text)" fontSize="11" fontWeight="900">
                {item.label}
              </text>
            </g>
          ))}
          {typeof cursorPosition === "number" ? (
            <g>
              <line
                x1={cursorPosition}
                y1={plot.top}
                x2={cursorPosition}
                y2={plot.bottom}
                stroke="var(--ph-accent)"
                strokeWidth="2.4"
                strokeDasharray="6 6"
                opacity="0.88"
                vectorEffect="non-scaling-stroke"
              />
              {cursorMarkers.map((marker) => (
                <circle
                  key={`cursor-${marker.id}`}
                  cx={cursorPosition}
                  cy={marker.y}
                  r="5.5"
                  fill={marker.color}
                  stroke="var(--ph-surface)"
                  strokeWidth="2.4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <rect
                x={clampNumber(cursorPosition - cursorPillWidth / 2, plot.left + 6, plot.right - cursorPillWidth - 6)}
                y={plot.top + 9}
                width={cursorPillWidth}
                height="24"
                rx="8"
                fill="color-mix(in srgb, var(--ph-accent), transparent 78%)"
                stroke="color-mix(in srgb, var(--ph-accent), transparent 36%)"
              />
              <text
                x={clampNumber(cursorPosition, plot.left + cursorPillWidth / 2 + 6, plot.right - cursorPillWidth / 2 - 6)}
                y={plot.top + 25}
                textAnchor="middle"
                fill="var(--ph-text)"
                fontSize="12"
                fontWeight="900"
              >
                x {cursorLabel}
              </text>
            </g>
          ) : null}
          {annotations.map((annotation) => {
            const x = clampNumber(scale(annotation.x, xDomain, [plot.left, plot.right]), plot.left + 6, plot.right - 6);
            const y = clampNumber(scale(annotation.y, yDomain, [plot.bottom, plot.top]), plot.top + 6, plot.bottom - 6);
            const annotationWidth = labelWidth(annotation.label);
            const labelRight = x < plot.right - annotationWidth - 18;
            const labelX = labelRight ? x + 14 : x - 14;
            const labelY = clampNumber(y - 22, plot.top + 14, plot.bottom - 12);
            const rectX = labelRight ? labelX - 6 : labelX - annotationWidth + 6;
            return (
              <g key={`${annotation.label}-${annotation.x}-${annotation.y}`}>
                <line x1={x} y1={y} x2={labelX} y2={labelY} stroke="var(--ph-accent-2)" opacity="0.82" vectorEffect="non-scaling-stroke" />
                <circle cx={x} cy={y} r="5" fill="var(--ph-accent-2)" stroke="var(--ph-surface)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                <rect
                  x={rectX}
                  y={labelY - 14}
                  width={annotationWidth}
                  height="22"
                  rx="7"
                  fill="color-mix(in srgb, var(--ph-surface-2), black 5%)"
                  stroke="var(--ph-border-strong)"
                />
                <text
                  x={labelRight ? labelX : labelX}
                  y={labelY + 1}
                  textAnchor={labelRight ? "start" : "end"}
                  fill="var(--ph-text)"
                  fontSize="11.5"
                  fontWeight="900"
                >
                  {annotation.label}
                </text>
              </g>
            );
          })}
          {!visibleSeries.length && !visibleReferenceSeries.length ? (
            <text x={width / 2} y={height / 2} textAnchor="middle" fill="var(--ph-muted)" fontSize="13">
              No visible traces
            </text>
          ) : null}
        </svg>
      </div>
    </figure>
  );
}
