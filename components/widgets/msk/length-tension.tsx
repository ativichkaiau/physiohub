"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function activeTension(length: number, calcium: number) {
  const overlap = Math.exp(-((length - 2.2) ** 2) / 0.22);
  return 100 * overlap * (calcium / 100);
}

function passiveTension(length: number) {
  return length < 2.2 ? 0 : (Math.exp((length - 2.2) * 1.8) - 1) * 12;
}

const config: CurveLabConfig = {
  diagramId: "msk/length-tension",
  title: "Muscle length-tension relationship",
  xDomain: [1.2, 3.6],
  yDomain: [0, 160],
  xLabel: "Sarcomere length",
  yLabel: "Tension",
  controls: [
    { key: "length", label: "Sarcomere length", min: 1.2, max: 3.6, step: 0.01, defaultValue: 2.2, unit: "um" },
    { key: "calcium", label: "Calcium availability", min: 0, max: 100, step: 1, defaultValue: 100, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "active",
      label: "Active tension",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(1.2, 3.6, 0.04).map((x) => ({ x, y: activeTension(x, values.calcium) }))
    },
    {
      id: "passive",
      label: "Passive tension",
      colorVar: "var(--ph-curve-2)",
      data: makeRange(1.2, 3.6, 0.04).map((x) => ({ x, y: passiveTension(x) }))
    },
    {
      id: "total",
      label: "Total tension",
      colorVar: "var(--ph-curve-3)",
      data: makeRange(1.2, 3.6, 0.04).map((x) => ({ x, y: activeTension(x, values.calcium) + passiveTension(x) }))
    }
  ],
  getCursorX: (values) => values.length,
  buildAnnotations: (values) => [
    { x: values.length, y: activeTension(values.length, values.calcium) + passiveTension(values.length), label: "current length" }
  ],
  summarize: (values) => {
    const active = activeTension(values.length, values.calcium);
    const passive = passiveTension(values.length);
    return {
      state: values.length < 1.6 ? "Over-compressed" : values.length > 3 ? "Over-stretched" : "Overlap zone",
      body: "Active force peaks near optimal actin-myosin overlap while passive tension rises as elastic elements stretch.",
      readouts: [
        { label: "Active", value: `${active.toFixed(0)}` },
        { label: "Passive", value: `${passive.toFixed(0)}` },
        { label: "Total", value: `${(active + passive).toFixed(0)}` },
        { label: "Ca", value: `${values.calcium.toFixed(0)}%` }
      ],
      warning: values.length < 1.35 || values.length > 3.4 ? "Edge state: filament overlap is poor or passive stretch dominates." : undefined
    };
  }
};

export default function LengthTensionWidget() {
  return <CurveLabWidget config={config} />;
}
