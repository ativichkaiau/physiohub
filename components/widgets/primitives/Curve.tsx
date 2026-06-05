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
};

export type CurveAnnotation = {
  x: number;
  y: number;
  label: string;
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
  cursorX?: number;
  height?: number;
};

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

function pathFromPoints(
  data: CurvePoint[],
  xDomain: [number, number],
  yDomain: [number, number],
  plot: { left: number; right: number; top: number; bottom: number }
) {
  return data
    .map((point, index) => {
      const x = scale(point.x, xDomain, [plot.left, plot.right]);
      const y = scale(point.y, yDomain, [plot.bottom, plot.top]);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPathFromPoints(
  data: CurvePoint[],
  xDomain: [number, number],
  yDomain: [number, number],
  plot: { left: number; right: number; top: number; bottom: number }
) {
  const path = pathFromPoints(data, xDomain, yDomain, plot);
  const first = data[0];
  const last = data[data.length - 1];
  const firstX = scale(first.x, xDomain, [plot.left, plot.right]);
  const lastX = scale(last.x, xDomain, [plot.left, plot.right]);
  return `${path} L ${lastX.toFixed(2)} ${plot.bottom.toFixed(2)} L ${firstX.toFixed(2)} ${plot.bottom.toFixed(2)} Z`;
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
  cursorX,
  height = 260
}: CurveProps) {
  const width = 640;
  const plot = { left: 54, right: 612, top: 24, bottom: height - 48 };
  const chartId = chartDomId(title, height, xDomain, yDomain);
  const visibleSeries = series.filter((item) => item.visible !== false);
  const visibleReferenceSeries = referenceSeries.filter((item) => item.visible !== false);
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => xDomain[0] + (xDomain[1] - xDomain[0]) * ratio);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yDomain[0] + (yDomain[1] - yDomain[0]) * ratio);
  const cursorPosition =
    typeof cursorX === "number" ? scale(cursorX, xDomain, [plot.left, plot.right]) : undefined;
  const cursorLabel = typeof cursorX === "number" ? formatTick(cursorX, xDomain) : "";
  const areaSeries = yDomain[0] >= 0 ? visibleSeries.find((item) => isMonotonicX(item.data) && !item.dashed) : undefined;
  const legendItems = [...visibleSeries, ...visibleReferenceSeries];

  return (
    <figure className="rounded-ph border border-[var(--ph-border)] bg-[color-mix(in_srgb,var(--ph-surface),black_7%)] p-3 shadow-[inset_0_1px_0_color-mix(in_srgb,white,transparent_94%)]">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="ph-section-label max-w-full truncate">{title}</span>
        {legendItems.length ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-ph-muted">
            {legendItems.map((item, index) => (
              <span key={`legend-${item.id}`} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-0.5 w-5 rounded-full"
                  style={{
                    backgroundColor: item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`,
                    opacity: item.dashed ? 0.7 : 1
                  }}
                />
                <span className={item.dashed ? "opacity-75" : undefined}>{item.label}</span>
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{title}</title>
        <defs>
          <linearGradient id={`${chartId}-plot-bg`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--ph-accent), transparent 92%)" />
            <stop offset="55%" stopColor="var(--ph-surface)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--ph-curve-3), transparent 94%)" />
          </linearGradient>
          <linearGradient id={`${chartId}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--ph-accent), transparent 76%)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--ph-accent), transparent 98%)" />
          </linearGradient>
          <filter id={`${chartId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
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
          fill={`url(#${chartId}-plot-bg)`}
          stroke="var(--ph-border)"
        />
        {xTicks.map((tick) => {
          const x = scale(tick, xDomain, [plot.left, plot.right]);
          return (
            <g key={`x-${tick}`}>
              <line x1={x} y1={plot.top} x2={x} y2={plot.bottom} stroke="var(--ph-grid)" strokeDasharray="2 7" />
              <line x1={x} y1={plot.bottom} x2={x} y2={plot.bottom + 5} stroke="var(--ph-axis)" opacity="0.7" />
              <text x={x} y={height - 20} textAnchor="middle" fill="var(--ph-muted)" fontSize="11" fontWeight="600">
                {formatTick(tick, xDomain)}
              </text>
            </g>
          );
        })}
        {yTicks.map((tick) => {
          const y = scale(tick, yDomain, [plot.bottom, plot.top]);
          return (
            <g key={`y-${tick}`}>
              <line x1={plot.left} y1={y} x2={plot.right} y2={y} stroke="var(--ph-grid)" />
              <line x1={plot.left - 5} y1={y} x2={plot.left} y2={y} stroke="var(--ph-axis)" opacity="0.7" />
              <text x={plot.left - 10} y={y + 4} textAnchor="end" fill="var(--ph-muted)" fontSize="11" fontWeight="600">
                {formatTick(tick, yDomain)}
              </text>
            </g>
          );
        })}
        <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} stroke="var(--ph-axis)" strokeWidth="1.6" />
        <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} stroke="var(--ph-axis)" strokeWidth="1.6" />
        {xLabel ? (
          <text x={(plot.left + plot.right) / 2} y={height - 4} textAnchor="middle" fill="var(--ph-muted)" fontSize="12" fontWeight="600">
            {xLabel}
          </text>
        ) : null}
        {yLabel ? (
          <text
            x="14"
            y={(plot.top + plot.bottom) / 2}
            textAnchor="middle"
            fill="var(--ph-muted)"
            fontSize="12"
            fontWeight="600"
            transform={`rotate(-90 14 ${(plot.top + plot.bottom) / 2})`}
          >
            {yLabel}
          </text>
        ) : null}
        <g clipPath={`url(#${chartId}-clip)`}>
          {areaSeries ? (
            <path
              d={areaPathFromPoints(areaSeries.data, xDomain, yDomain, plot)}
              fill={`url(#${chartId}-area)`}
              opacity="0.9"
            />
          ) : null}
          {visibleReferenceSeries.map((item) => (
            <path
              key={item.id}
              d={pathFromPoints(item.data, xDomain, yDomain, plot)}
              fill="none"
              stroke={item.colorVar ?? "var(--ph-curve-ref)"}
              strokeDasharray={item.dashed ? "7 7" : "4 5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth ?? 2.2}
              opacity="0.75"
            />
          ))}
          {visibleSeries.map((item, index) => {
            const stroke = item.colorVar ?? `var(--ph-curve-${Math.min(index + 1, 4)})`;
            const d = pathFromPoints(item.data, xDomain, yDomain, plot);
            return (
              <g key={item.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={(item.strokeWidth ?? 3.2) + 3}
                  strokeDasharray={item.dashed ? "7 7" : undefined}
                  opacity="0.16"
                  filter={`url(#${chartId}-glow)`}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={item.strokeWidth ?? 3.2}
                  strokeDasharray={item.dashed ? "7 7" : undefined}
                />
              </g>
            );
          })}
        </g>
        {typeof cursorPosition === "number" ? (
          <g>
            <line
              x1={cursorPosition}
              y1={plot.top}
              x2={cursorPosition}
              y2={plot.bottom}
              stroke="var(--ph-accent)"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.78"
            />
            <rect
              x={Math.max(plot.left + 4, Math.min(cursorPosition - 27, plot.right - 58))}
              y={plot.top + 8}
              width="54"
              height="20"
              rx="6"
              fill="color-mix(in srgb, var(--ph-accent), transparent 78%)"
              stroke="color-mix(in srgb, var(--ph-accent), transparent 40%)"
            />
            <text
              x={Math.max(plot.left + 31, Math.min(cursorPosition, plot.right - 31))}
              y={plot.top + 22}
              textAnchor="middle"
              fill="var(--ph-text)"
              fontSize="11"
              fontWeight="700"
            >
              {cursorLabel}
            </text>
          </g>
        ) : null}
        {annotations.map((annotation) => {
          const x = scale(annotation.x, xDomain, [plot.left, plot.right]);
          const y = scale(annotation.y, yDomain, [plot.bottom, plot.top]);
          const labelWidth = Math.min(150, Math.max(44, annotation.label.length * 7 + 12));
          const labelRight = x < plot.right - labelWidth - 12;
          const labelX = labelRight ? x + 10 : x - 10;
          const rectX = labelRight ? labelX - 5 : labelX - labelWidth + 5;
          return (
            <g key={`${annotation.label}-${annotation.x}-${annotation.y}`}>
              <line x1={x} y1={y} x2={labelX} y2={y - 14} stroke="var(--ph-accent-2)" opacity="0.72" />
              <circle cx={x} cy={y} r="4" fill="var(--ph-accent-2)" stroke="var(--ph-surface)" strokeWidth="2" />
              <rect
                x={rectX}
                y={y - 28}
                width={labelWidth}
                height="18"
                rx="5"
                fill="color-mix(in srgb, var(--ph-surface-2), black 8%)"
                stroke="var(--ph-border)"
              />
              <text
                x={labelRight ? labelX : labelX}
                y={y - 15}
                textAnchor={labelRight ? "start" : "end"}
                fill="var(--ph-text)"
                fontSize="11"
                fontWeight="700"
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
    </figure>
  );
}
