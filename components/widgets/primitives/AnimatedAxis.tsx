"use client";

import { motion, useReducedMotion } from "framer-motion";

export type AnimatedAxisProps = {
  orientation: "x" | "y";
  start: { x: number; y: number };
  end: { x: number; y: number };
  ticks?: Array<{ value: string; x: number; y: number }>;
  label?: string;
};

export function AnimatedAxis({ orientation, start, end, ticks = [], label }: AnimatedAxisProps) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" };

  return (
    <g aria-label={label ?? `${orientation}-axis`}>
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="var(--ph-axis)"
        strokeWidth="1.5"
        initial={false}
        animate={{ x1: start.x, y1: start.y, x2: end.x, y2: end.y }}
        transition={transition}
      />
      {ticks.map((tick) => (
        <motion.g
          key={`${tick.value}-${tick.x}-${tick.y}`}
          initial={false}
          animate={{ x: tick.x, y: tick.y }}
          transition={transition}
        >
          <line
            x1={orientation === "x" ? 0 : -4}
            y1={orientation === "x" ? 4 : 0}
            x2={orientation === "x" ? 0 : 4}
            y2={orientation === "x" ? -4 : 0}
            stroke="var(--ph-axis)"
          />
          <text
            x={orientation === "x" ? 0 : -8}
            y={orientation === "x" ? 18 : 4}
            textAnchor={orientation === "x" ? "middle" : "end"}
            fill="var(--ph-muted)"
            fontSize="11"
          >
            {tick.value}
          </text>
        </motion.g>
      ))}
      {label ? (
        <text
          x={(start.x + end.x) / 2}
          y={(start.y + end.y) / 2 + (orientation === "x" ? 28 : -28)}
          textAnchor="middle"
          fill="var(--ph-muted)"
          fontSize="12"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
