export type FeedbackLoopNodeProps = {
  id: string;
  label: string;
  value?: string;
  x: number;
  y: number;
  active?: boolean;
  index?: number;
  role?: string;
};

export type FeedbackEdgeKind = "stimulate" | "inhibit";

export type FeedbackLoopEdgeProps = {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  /** Back-compat alias: inhibitory === kind "inhibit". */
  inhibitory?: boolean;
  kind?: FeedbackEdgeKind;
  active?: boolean;
  via?: Array<{ x: number; y: number }>;
  labelPosition?: { x: number; y: number };
};

const nodeWidth = 238;
const nodeHeight = 82;

function labelWidth(label: string) {
  return Math.min(176, Math.max(64, label.length * 6.6 + 30));
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }, via: Array<{ x: number; y: number }> = []) {
  if (via.length) {
    // Rounded-corner orthogonal routing for clarity.
    const points = [from, ...via, to];
    const r = 14;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const inDir = { x: Math.sign(curr.x - prev.x), y: Math.sign(curr.y - prev.y) };
      const outDir = { x: Math.sign(next.x - curr.x), y: Math.sign(next.y - curr.y) };
      const p1 = { x: curr.x - inDir.x * r, y: curr.y - inDir.y * r };
      const p2 = { x: curr.x + outDir.x * r, y: curr.y + outDir.y * r };
      d += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  const dx = to.x - from.x;
  if (Math.abs(dx) < 6) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const dy = to.y - from.y;
  const control1 = { x: from.x + dx * 0.55, y: from.y };
  const control2 = { x: to.x, y: to.y - dy * 0.42 };
  return `M ${from.x} ${from.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${to.x} ${to.y}`;
}

export function FeedbackLoopNode({ id, label, value, x, y, active = false, index, role }: FeedbackLoopNodeProps) {
  const displayLabel = label.length > 30 ? `${label.slice(0, 27)}...` : label;
  const displayValue = value && value.length > 28 ? `${value.slice(0, 25)}...` : value;
  const labelY = role ? 0 : -8;
  const valueY = role ? 24 : 16;

  return (
    <g id={id} transform={`translate(${x} ${y})`} role="img" aria-label={`${label}${value ? ` ${value}` : ""}`}>
      {active ? (
        <rect
          x={-nodeWidth / 2 - 8}
          y={-nodeHeight / 2 - 8}
          width={nodeWidth + 16}
          height={nodeHeight + 16}
          rx="16"
          fill="color-mix(in srgb, var(--ph-accent), transparent 88%)"
        />
      ) : null}
      <rect
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
        width={nodeWidth}
        height={nodeHeight}
        rx="12"
        fill={active ? "color-mix(in srgb, var(--ph-accent), transparent 86%)" : "var(--ph-surface)"}
        stroke={active ? "var(--ph-accent)" : "var(--ph-border-strong)"}
        strokeWidth={active ? 2.2 : 1.3}
        filter="drop-shadow(0 6px 14px rgba(0,0,0,0.14))"
      />
      {/* Sequence badge */}
      {typeof index === "number" ? (
        <g transform={`translate(${-nodeWidth / 2 + 22} 0)`}>
          <circle r="13" fill={active ? "var(--ph-accent)" : "color-mix(in srgb, var(--ph-muted-2), transparent 40%)"} />
          <text x="0" y="4" textAnchor="middle" fill={active ? "white" : "var(--ph-surface)"} fontSize="13" fontWeight="800">
            {index}
          </text>
        </g>
      ) : null}
      {role ? (
        <text
          x={typeof index === "number" ? 20 : 0}
          y="-20"
          textAnchor="middle"
          fill="var(--ph-muted)"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="1.5"
        >
          {role.toUpperCase()}
        </text>
      ) : null}
      <text x={typeof index === "number" ? 20 : 0} y={labelY} textAnchor="middle" fill="var(--ph-text)" fontSize="13.5" fontWeight="800">
        {displayLabel}
      </text>
      {displayValue ? (
        <text
          x={typeof index === "number" ? 20 : 0}
          y={valueY}
          textAnchor="middle"
          fill={active ? "var(--ph-text)" : "var(--ph-muted)"}
          fontSize="12.5"
          fontWeight="700"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {displayValue}
        </text>
      ) : null}
    </g>
  );
}

export function FeedbackLoopEdge({
  id,
  from,
  to,
  label,
  inhibitory = false,
  kind,
  active = false,
  via = [],
  labelPosition
}: FeedbackLoopEdgeProps) {
  const resolvedKind: FeedbackEdgeKind = kind ?? (inhibitory ? "inhibit" : "stimulate");
  const isInhibit = resolvedKind === "inhibit";

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const labelPoint = labelPosition ?? (via.length ? via[Math.max(0, Math.floor(via.length / 2) - 1)] : undefined);
  const curved = !via.length && Math.abs(dx) > 6;
  const midX = labelPoint?.x ?? (curved ? from.x + dx * 0.72 : (from.x + to.x) / 2);
  const midY = labelPoint?.y ?? (curved ? from.y + dy * 0.52 : (from.y + to.y) / 2);
  const width = label ? labelWidth(label) : 0;
  const terminalFrom = via[via.length - 1] ?? from;
  const terminalDx = to.x - terminalFrom.x;
  const terminalDy = to.y - terminalFrom.y;
  const length = Math.hypot(terminalDx, terminalDy) || 1;
  const normal = { x: -terminalDy / length, y: terminalDx / length };
  const path = edgePath(from, to, via);

  // Colour: green for stimulation, red for inhibition. A basal forward signal
  // stays visibly green; only disabled feedback fades to grey.
  const activeColor = isInhibit ? "var(--ph-danger)" : "var(--ph-ok)";
  const basalColor = isInhibit ? "color-mix(in srgb, var(--ph-axis), transparent 55%)" : "color-mix(in srgb, var(--ph-ok), var(--ph-axis) 48%)";
  const stroke = active ? activeColor : basalColor;
  const labelText = active ? "var(--ph-text)" : "var(--ph-muted)";
  const labelFill = active
    ? `color-mix(in srgb, ${activeColor}, transparent 84%)`
    : isInhibit
      ? "var(--ph-surface)"
      : "color-mix(in srgb, var(--ph-ok), transparent 93%)";
  const labelStroke = active
    ? `color-mix(in srgb, ${activeColor}, transparent 45%)`
    : isInhibit
      ? "var(--ph-border)"
      : "color-mix(in srgb, var(--ph-ok), transparent 72%)";

  return (
    <g id={id} aria-label={`${label ?? ""} ${resolvedKind}`}>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
      </defs>
      {/* Soft glow under active edges */}
      <path
        d={path}
        fill="none"
        stroke={active ? `color-mix(in srgb, ${activeColor}, transparent 74%)` : "transparent"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="11"
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 3.4 : 2.2}
        strokeDasharray={isInhibit ? "7 5" : undefined}
        markerEnd={isInhibit ? undefined : `url(#${id}-arrow)`}
      />
      {isInhibit ? (
        // Blunt ⊣ inhibition terminal.
        <line
          x1={to.x - normal.x * 15}
          y1={to.y - normal.y * 15}
          x2={to.x + normal.x * 15}
          y2={to.y + normal.y * 15}
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : null}
      {label ? (
        <g>
          <rect x={midX - width / 2} y={midY - 12} width={width} height="24" rx="8" fill={labelFill} stroke={labelStroke} strokeWidth="1.2" />
          {/* sign glyph */}
          <text x={midX - width / 2 + 13} y={midY + 4} textAnchor="middle" fill={active ? activeColor : "var(--ph-muted)"} fontSize="13" fontWeight="900">
            {isInhibit ? "−" : "+"}
          </text>
          <text x={midX + 7} y={midY + 4} textAnchor="middle" fill={labelText} fontSize="11" fontWeight="800">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}
