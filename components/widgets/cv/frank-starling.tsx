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
      id: "hyperdynamic",
      label: "Hyperdynamic (sympathetic / inotropes)",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(0, 20, 0.5).map((x) => ({ x, y: starlingPoint(x, 1.5, 80) }))
    },
    {
      id: "normal",
      label: "Normal (c=1, afterload=80)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 20, 0.5).map((x) => ({ x, y: starlingPoint(x, 1, 80) }))
    },
    {
      id: "hf",
      label: "Heart failure (c=0.6)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(0, 20, 0.5).map((x) => ({ x, y: starlingPoint(x, 0.6, 80) }))
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
    const co5 = (sv * 72) / 1000; // CO at HR 72 bpm
    const ef = sv / Math.max(60, sv + 40) * 100; // estimate EF assuming ESV ≈ 40-50 mL at this SV
    return {
      state:
        values.contractility <= 0.7
          ? "Failing heart — descending limb risk at high preload"
          : values.contractility >= 1.3
            ? "Hyperdynamic (β-adrenergic / dobutamine)"
            : values.afterload > 110
              ? "Afterload mismatch — concentric remodelling pattern"
              : values.preload < 4
                ? "Underfilled — preload reserve available"
                : "Normal Frank–Starling regime",
      body: "Stroke volume rises asymptotically with end-diastolic filling pressure. Inotropy lifts the entire curve (steeper); afterload depresses it (shallower). The healthy LV operates on the steep ascending limb (LVEDP ≈ 5–12 mmHg).",
      readouts: [
        { label: "SV", value: `${sv.toFixed(0)} mL` },
        { label: "CO @72", value: `${co5.toFixed(1)} L/min` },
        { label: "Preload", value: `${values.preload.toFixed(0)} mmHg` },
        { label: "Inotropy", value: `${values.contractility.toFixed(2)}×` },
        { label: "Afterload", value: `${values.afterload.toFixed(0)} mmHg` },
        { label: "Est. EF", value: `${ef.toFixed(0)}%` }
      ],
      warning:
        values.contractility <= 0.55
          ? "Edge state: contractility ≤ 0.55× normal — pump approaching cardiogenic shock; rising preload no longer recruits stroke volume."
          : values.preload > 18 && values.contractility < 0.85
            ? "Edge state: high LVEDP in a failing ventricle → pulmonary congestion likely (PCWP ≈ LVEDP)."
            : undefined
    };
  }
};

export default function FrankStarlingWidget() {
  return <CurveLabWidget config={config} />;
}
