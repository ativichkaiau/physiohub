"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

// Classic Gordon–Huxley–Julian active length–tension: a flat PLATEAU of
// optimal actin–myosin overlap (~2.0–2.25 µm), a steep ascending limb below,
// and a linear descending limb to zero force at ~3.65 µm (no overlap).
function activeOverlap(length: number) {
  if (length <= 1.27) return 0;            // double overlap, no active force
  if (length < 1.67) return ((length - 1.27) / (1.67 - 1.27)) * 0.84;
  if (length < 2.0) return 0.84 + ((length - 1.67) / (2.0 - 1.67)) * 0.16; // ascending limb + shoulder
  if (length <= 2.25) return 1.0;          // plateau — maximal overlap
  if (length < 3.65) return 1 - (length - 2.25) / (3.65 - 2.25);           // descending limb
  return 0;
}

function activeTension(length: number, calcium: number) {
  return 100 * activeOverlap(length) * (calcium / 100);
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
  bands: [
    { axis: "x", from: 1.2, to: 2.0, tone: "phase", label: "ascending limb" },
    { axis: "x", from: 2.0, to: 2.25, tone: "phase", label: "plateau" },
    { axis: "x", from: 2.25, to: 3.6, tone: "phase", label: "descending limb" }
  ],
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
