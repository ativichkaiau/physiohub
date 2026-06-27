"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function lungVolume(pressure: number, elastance: number, surfactant: number, chestWallLoad: number) {
  const compliance = clamp((1.25 * surfactant) / elastance, 0.25, 3.5);
  const openingPressure = -1 + chestWallLoad * 1.4 + (1 - surfactant) * 5;
  const vMin = 0.7;
  const vMax = clamp(6.2 - chestWallLoad * 0.45, 3.4, 6.8);
  return vMin + (vMax - vMin) / (1 + Math.exp(-(pressure - openingPressure) * compliance * 0.22));
}

const config: CurveLabConfig = {
  diagramId: "resp/compliance-pressure-volume",
  title: "Static pressure-volume curve",
  xDomain: [-5, 30],
  yDomain: [0, 7],
  xLabel: "transpulmonary pressure (cm H2O)",
  yLabel: "lung volume (L)",
  readingGuide:
    "The slope is compliance (ΔV/ΔP). Inflation and deflation trace different paths (hysteresis) because surfactant lowers surface tension. A stiff fibrotic lung is flat (low compliance); an emphysematous lung is steep and over-distended. The foot of the curve is where collapsed alveoli pop open.",
  controls: [
    { key: "elastance", label: "Elastance", min: 0.4, max: 3, step: 0.05, defaultValue: 1, unit: "x" },
    { key: "surfactant", label: "Surfactant effect", min: 0.2, max: 1.4, step: 0.05, defaultValue: 1, unit: "x" },
    { key: "chestWallLoad", label: "Chest wall load", min: 0, max: 2, step: 0.05, defaultValue: 0, unit: "x" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(-5, 30, 0.5).map((p) => ({
        x: p,
        y: lungVolume(p, values.elastance, values.surfactant, values.chestWallLoad)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(-5, 30, 0.5).map((p) => ({ x: p, y: lungVolume(p, 1, 1, 0) }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: 10,
      y: lungVolume(10, values.elastance, values.surfactant, values.chestWallLoad),
      label: "mid-range compliance"
    }
  ],
  summarize: (values) => {
    const v10 = lungVolume(10, values.elastance, values.surfactant, values.chestWallLoad);
    const v15 = lungVolume(15, values.elastance, values.surfactant, values.chestWallLoad);
    const compliance = (v15 - v10) / 5;
    return {
      state:
        values.elastance > 1.8
          ? "Fibrosis-like low compliance"
          : values.elastance < 0.7
            ? "Emphysema-like high compliance"
            : values.surfactant < 0.55
              ? "Surfactant loss"
              : "Normal compliance zone",
      body: "The slope of the pressure-volume curve is compliance. High elastance flattens the curve; surfactant loss raises opening pressure and increases work at low lung volumes.",
      readouts: [
        { label: "V at 10", value: `${v10.toFixed(1)} L` },
        { label: "Slope", value: `${compliance.toFixed(2)} L/cm` },
        { label: "Elastance", value: `${values.elastance.toFixed(2)}x` },
        { label: "Surfactant", value: `${values.surfactant.toFixed(2)}x` }
      ],
      warning:
        values.surfactant < 0.35
          ? "Edge state: very low surfactant raises opening pressure and favors atelectasis."
          : values.elastance > 2.6
            ? "Edge state: very stiff lung; tidal breathing would require much higher pressure swings."
            : undefined
    };
  }
};

export default function CompliancePressureVolumeWidget() {
  return <CurveLabWidget config={config} />;
}
