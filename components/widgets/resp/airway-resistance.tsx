"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function resistance(radius: number, lungVolume: number, flow: number) {
  const radial = 9 / Math.pow(Math.max(radius, 0.25), 4);
  const tethering = clamp(1.45 - lungVolume * 0.18, 0.55, 1.7);
  const turbulent = flow > 3 ? 1 + Math.pow(flow - 3, 1.35) * 0.18 : 1;
  return radial * tethering * turbulent;
}

const config: CurveLabConfig = {
  diagramId: "resp/airway-resistance",
  title: "Airway resistance vs radius",
  xDomain: [0.5, 8],
  yDomain: [0, 55],
  xLabel: "airway radius (mm)",
  yLabel: "relative resistance",
  readingGuide:
    "Resistance rises with the fourth power of falling radius (Poiseuille), so the curve climbs steeply as airways narrow — small changes in bronchial caliber dominate the work of breathing. Normally most resistance sits in medium bronchi, not the tiny ones, because they are arranged in parallel.",
  controls: [
    { key: "radius", label: "Airway radius", min: 0.5, max: 8, step: 0.1, defaultValue: 3, unit: "mm" },
    { key: "lungVolume", label: "Lung volume", min: 1, max: 6, step: 0.1, defaultValue: 3, unit: "L" },
    { key: "flow", label: "Flow demand", min: 0.5, max: 8, step: 0.1, defaultValue: 2, unit: "L/s" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0.5, 8, 0.08).map((r) => ({
        x: r,
        y: clamp(resistance(r, values.lungVolume, values.flow), 0, 58)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal volume / quiet flow",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0.5, 8, 0.08).map((r) => ({ x: r, y: clamp(resistance(r, 3, 2), 0, 58) }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.radius,
      y: clamp(resistance(values.radius, values.lungVolume, values.flow), 0, 58),
      label: "operating point"
    }
  ],
  getCursorX: (values) => values.radius,
  summarize: (values) => {
    const r = resistance(values.radius, values.lungVolume, values.flow);
    const halfRadius = resistance(values.radius / 2, values.lungVolume, values.flow);
    return {
      state:
        values.radius < 1.4
          ? "Severely narrowed airway"
          : values.flow > 5
            ? "Turbulent high-flow regime"
            : values.lungVolume > 4.8
              ? "Radial traction lowers resistance"
              : "Laminar resistance regime",
      body: "Airway resistance is dominated by radius, then modified by lung-volume tethering and high-flow turbulence. Small radius losses rapidly overwhelm other compensations.",
      readouts: [
        { label: "R", value: r.toFixed(1) },
        { label: "Radius", value: `${values.radius.toFixed(1)} mm` },
        { label: "R if r/2", value: `${(halfRadius / Math.max(r, 0.01)).toFixed(1)}x` },
        { label: "Flow", value: `${values.flow.toFixed(1)} L/s` }
      ],
      warning:
        values.radius < 0.9
          ? "Edge state: radius is near critical narrowing; work of breathing rises steeply."
          : values.flow > 7
            ? "Edge state: turbulent losses dominate, so resistance is no longer purely laminar."
            : undefined
    };
  }
};

export default function AirwayResistanceWidget() {
  return <CurveLabWidget config={config} />;
}
