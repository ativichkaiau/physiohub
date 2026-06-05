"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function starlingPoint(filling: number, contractility: number, afterload: number) {
  // Stroke volume rises asymptotically with ventricular filling and must pass
  // through (0, 0) — no filling, no ejection. Plateau ~95 mL at normal
  // contractility / afterload; lifts with inotropy, depresses with afterload.
  // At LVEDP = 10 mmHg (normal), SV ≈ 67 mL.
  const plateau = 95 * contractility - (afterload - 80) * 0.25;
  return clamp(plateau * (1 - Math.exp(-filling / 8.3)), 0, 145);
}

const config: CurveLabConfig = {
  diagramId: "cv/frank-starling",
  title: "Frank-Starling curve",
  xDomain: [0, 20],
  yDomain: [0, 150],
  xLabel: "Ventricular filling pressure",
  yLabel: "Stroke volume",
  controls: [
    { key: "preload", label: "Preload marker", min: 0, max: 20, step: 1, defaultValue: 10, unit: "mmHg" },
    { key: "contractility", label: "Contractility", min: 0.5, max: 1.8, step: 0.01, defaultValue: 1 },
    { key: "afterload", label: "Afterload", min: 50, max: 130, step: 1, defaultValue: 80, unit: "mmHg" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 20, 0.5).map((x) => ({ x, y: starlingPoint(x, values.contractility, values.afterload) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 20, 0.5).map((x) => ({ x, y: starlingPoint(x, 1, 80) }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.preload,
      y: starlingPoint(values.preload, values.contractility, values.afterload),
      label: "operating point"
    }
  ],
  getCursorX: (values) => values.preload,
  summarize: (values) => {
    const sv = starlingPoint(values.preload, values.contractility, values.afterload);
    return {
      state: values.contractility > 1.15 ? "Inotropy increased" : values.afterload > 105 ? "Afterload stress" : "Preload response",
      body: "Slide preload along the curve and perturb contractility or afterload to see how stroke volume changes at the operating point.",
      readouts: [
        { label: "SV", value: `${sv.toFixed(0)} mL` },
        { label: "Preload", value: `${values.preload.toFixed(0)} mmHg` },
        { label: "Inotropy", value: `${values.contractility.toFixed(2)}x` },
        { label: "Afterload", value: `${values.afterload.toFixed(0)} mmHg` }
      ],
      warning: values.contractility <= 0.55 ? "Edge state: contractility is very low, so the curve flattens toward pump failure." : undefined
    };
  }
};

export default function FrankStarlingWidget() {
  return <CurveLabWidget config={config} />;
}
