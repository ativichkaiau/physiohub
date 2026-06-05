export type FeedbackLoopNodeProps = {
  id: string;
  label: string;
  value?: string;
  x: number;
  y: number;
  active?: boolean;
};

export type FeedbackLoopEdgeProps = {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  inhibitory?: boolean;
  active?: boolean;
};

const nodeWidth = 206;
const nodeHeight = 68;

function labelWidth(label: string) {
  return Math.min(142, Math.max(54, label.length * 7 + 22));
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 6) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const control1 = { x: from.x + dx * 0.55, y: from.y };
  const control2 = { x: to.x, y: to.y - dy * 0.42 };
  return `M ${from.x} ${from.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${to.x} ${to.y}`;
}

export function FeedbackLoopNode({ id, label, value, x, y, active = false }: FeedbackLoopNodeProps) {
  return (
    <g id={id} transform={`translate(${x} ${y})`} role="img" aria-label={`${label}${value ? ` ${value}` : ""}`}>
      {active ? (
        <rect
          x={-nodeWidth / 2 - 9}
          y={-nodeHeight / 2 - 9}
          width={nodeWidth + 18}
          height={nodeHeight + 18}
          rx="14"
          fill="color-mix(in srgb, var(--ph-accent), transparent 88%)"
          opacity="0.78"
        />
      ) : null}
      <rect
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
        width={nodeWidth}
        height={nodeHeight}
        rx="8"
        fill={active ? "color-mix(in srgb, var(--ph-accent), transparent 86%)" : "color-mix(in srgb, var(--ph-surface-2), black 5%)"}
        stroke={active ? "var(--ph-accent)" : "var(--ph-border-strong)"}
        strokeWidth={active ? 2 : 1.2}
        filter={active ? undefined : "drop-shadow(0 10px 18px rgba(0,0,0,0.18))"}
      />
      <rect
        x={-nodeWidth / 2 + 1}
        y={-nodeHeight / 2 + 1}
        width={nodeWidth - 2}
        height="22"
        rx="7"
        fill={active ? "color-mix(in srgb, var(--ph-accent), transparent 78%)" : "color-mix(in srgb, white, transparent 95%)"}
      />
      <circle
        cx={-nodeWidth / 2 + 15}
        cy={-nodeHeight / 2 + 13}
        r="4"
        fill={active ? "var(--ph-accent)" : "var(--ph-muted-2)"}
      />
      <text x="0" y="-16" textAnchor="middle" fill="var(--ph-text)" fontSize="13" fontWeight="800">
        {label}
      </text>
      {value ? (
        <>
          <rect
            x="-82"
            y="6"
            width="164"
            height="24"
            rx="6"
            fill="color-mix(in srgb, var(--ph-surface), transparent 18%)"
            stroke="var(--ph-border)"
          />
          <text x="0" y="22" textAnchor="middle" fill={active ? "var(--ph-text)" : "var(--ph-muted)"} fontSize="12" fontWeight="700">
            {value}
          </text>
        </>
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
  active = false
}: FeedbackLoopEdgeProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const curved = Math.abs(dx) > 6;
  const midX = curved ? from.x + dx * 0.72 : (from.x + to.x) / 2;
  const midY = curved ? from.y + dy * 0.52 : (from.y + to.y) / 2;
  const width = label ? labelWidth(label) : 0;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const path = edgePath(from, to);
  const stroke = active ? "var(--ph-accent)" : "color-mix(in srgb, var(--ph-axis), transparent 22%)";

  return (
    <g id={id} aria-label={label}>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={active ? "color-mix(in srgb, var(--ph-accent), transparent 72%)" : "transparent"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 3.2 : 2}
        strokeDasharray={inhibitory ? "6 5" : undefined}
        markerEnd={inhibitory ? undefined : `url(#${id}-arrow)`}
      />
      {inhibitory ? (
        <g>
          <circle cx={to.x} cy={to.y} r="4" fill={stroke} />
          <line
            x1={to.x - normal.x * 13}
            y1={to.y - normal.y * 13}
            x2={to.x + normal.x * 13}
            y2={to.y + normal.y * 13}
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {label ? (
        <g>
          <rect
            x={midX - width / 2}
            y={midY - 22}
            width={width}
            height="22"
            rx="7"
            fill={active ? "color-mix(in srgb, var(--ph-accent), transparent 82%)" : "color-mix(in srgb, var(--ph-surface-2), black 4%)"}
            stroke={active ? "color-mix(in srgb, var(--ph-accent), transparent 42%)" : "var(--ph-border)"}
          />
          <text x={midX} y={midY - 7} textAnchor="middle" fill={active ? "var(--ph-text)" : "var(--ph-muted)"} fontSize="11" fontWeight="800">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}
