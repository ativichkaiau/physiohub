"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function typeI(intensity: number, oxygen: number, duration: number) {
  return clamp(82 - intensity * 0.68 + oxygen * 0.22 + duration * 0.08, 4, 100);
}

function typeIIa(intensity: number, oxygen: number, duration: number) {
  return clamp(25 + 58 * Math.exp(-((intensity - 58) ** 2) / 850) + oxygen * 0.05 - duration * 0.04, 4, 100);
}

function typeIIx(intensity: number, oxygen: number, duration: number) {
  return clamp((intensity - 55) * 1.15 - oxygen * 0.18 - duration * 0.10, 0, 100);
}

function lactate(intensity: number, oxygen: number) {
  return clamp((intensity - 55) * 1.65 - oxygen * 0.34, 0, 120);
}

const config: CurveLabConfig = {
  diagramId: "msk/fiber-type-metabolism",
  title: "Muscle fiber type metabolism by exercise intensity",
  xDomain: [0, 100],
  yDomain: [0, 120],
  xLabel: "exercise intensity",
  yLabel: "relative contribution",
  controls: [
    { key: "intensity", label: "Intensity marker", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%" },
    { key: "oxygen", label: "Oxygen delivery", min: 20, max: 120, step: 1, defaultValue: 90, unit: "%" },
    { key: "duration", label: "Training duration", min: 0, max: 120, step: 1, defaultValue: 25, unit: "min" }
  ],
  buildSeries: (values) => [
    {
      id: "type-i",
      label: "Type I oxidative",
      colorVar: "var(--ph-curve-6)",
      data: makeRange(0, 100, 1).map((x) => ({ x, y: typeI(x, values.oxygen, values.duration) }))
    },
    {
      id: "type-iia",
      label: "Type IIa mixed",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 100, 1).map((x) => ({ x, y: typeIIa(x, values.oxygen, values.duration) }))
    },
    {
      id: "type-iix",
      label: "Type IIx glycolytic",
      colorVar: "var(--ph-curve-4)",
      data: makeRange(0, 100, 1).map((x) => ({ x, y: typeIIx(x, values.oxygen, values.duration) }))
    },
    {
      id: "lactate",
      label: "Lactate pressure",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(0, 100, 1).map((x) => ({ x, y: lactate(x, values.oxygen) }))
    }
  ],
  buildAnnotations: (values) => [{ x: values.intensity, y: typeIIa(values.intensity, values.oxygen, values.duration), label: "current effort" }],
  getCursorX: (values) => values.intensity,
  summarize: (values) => {
    const i = typeI(values.intensity, values.oxygen, values.duration);
    const iia = typeIIa(values.intensity, values.oxygen, values.duration);
    const iix = typeIIx(values.intensity, values.oxygen, values.duration);
    const lac = lactate(values.intensity, values.oxygen);
    return {
      state: lac > 70 ? "Anaerobic glycolytic bias" : i > iia && i > iix ? "Oxidative endurance bias" : "Mixed fiber recruitment",
      body: "Low-intensity work favors type I oxidative fibers; increasing drive recruits type IIa and then IIx units. Oxygen delivery and duration shift the same effort toward or away from lactate pressure.",
      readouts: [
        { label: "Type I", value: `${i.toFixed(0)}%` },
        { label: "IIa", value: `${iia.toFixed(0)}%` },
        { label: "IIx", value: `${iix.toFixed(0)}%` },
        { label: "Lactate", value: `${lac.toFixed(0)}%` }
      ],
      warning: values.oxygen < 40 && values.intensity > 65 ? "Edge state: low O2 delivery with high intensity accelerates lactate accumulation and fatigue." : undefined
    };
  }
};

export default function FiberTypeMetabolismWidget() {
  return <CurveLabWidget config={config} />;
}
