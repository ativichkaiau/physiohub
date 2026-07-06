"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Laplace's law for the ventricle (thick-walled sphere):
 *   wall stress σ = (P · r) / (2h)
 * Dilation (↑r) and pressure overload (↑P) both raise wall stress and therefore
 * myocardial O2 demand. The heart compensates by thickening the wall (↑h):
 *   - Pressure overload → concentric hypertrophy (↑h, r held) → normalises stress.
 *   - Volume overload → eccentric hypertrophy (↑r and ↑h) → stress creeps up.
 */
function wallStress(radius: number, pressure: number, thickness: number) {
  return clamp((pressure * radius) / (2 * Math.max(0.2, thickness)), 0, 600);
}

const config: CurveLabConfig = {
  diagramId: "cv/laplace-wall-stress",
  title: "Laplace wall stress vs ventricular radius",
  xDomain: [1.5, 4.5],
  yDomain: [0, 400],
  xLabel: "LV internal radius (cm)",
  yLabel: "Wall stress (mmHg·cm)",
  readingGuide:
    "Wall stress is pressure times radius over twice the wall thickness. As the ventricle DILATES (moves right) stress climbs, raising oxygen demand — which is why a big, thin, high-pressure ventricle is metabolically expensive. Thickening the wall (the dashed hypertrophy curve) drops the whole line back down.",
  bands: [
    { axis: "y", from: 0, to: 180, tone: "ok", label: "tolerable stress" },
    { axis: "y", from: 180, to: 280, tone: "warn" },
    { axis: "y", from: 280, to: 400, tone: "danger" }
  ],
  controls: [
    { key: "radius", label: "LV radius marker", min: 1.5, max: 4.5, step: 0.05, defaultValue: 2.5, unit: "cm" },
    { key: "pressure", label: "LV systolic pressure", min: 60, max: 260, step: 5, defaultValue: 120, unit: "mmHg" },
    { key: "thickness", label: "Wall thickness", min: 0.4, max: 2.2, step: 0.05, defaultValue: 1.0, unit: "cm" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current wall",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(1.5, 4.5, 0.05).map((r) => ({ x: r, y: wallStress(r, values.pressure, values.thickness) }))
    }
  ],
  buildReferenceSeries: (values) => [
    {
      id: "hypertrophy",
      label: "With concentric hypertrophy (+50% wall)",
      colorVar: "var(--ph-curve-5)",
      dashed: true,
      data: makeRange(1.5, 4.5, 0.05).map((r) => ({ x: r, y: wallStress(r, values.pressure, values.thickness * 1.5) }))
    },
    {
      id: "normal",
      label: "Normal loading (120 mmHg, 1.0 cm)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(1.5, 4.5, 0.05).map((r) => ({ x: r, y: wallStress(r, 120, 1.0) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.radius, y: wallStress(values.radius, values.pressure, values.thickness), label: "operating point" }
  ],
  getCursorX: (values) => values.radius,
  summarize: (values) => {
    const stress = wallStress(values.radius, values.pressure, values.thickness);
    const relDemand = stress / wallStress(2.5, 120, 1.0);
    return {
      state:
        values.radius > 3.4
          ? "Dilated ventricle — high wall stress (eccentric remodelling / DCM)"
          : values.pressure > 170 && values.thickness < 1.1
            ? "Pressure overload, undercompensated — stress high (early HTN / AS)"
            : values.thickness > 1.4
              ? "Concentric hypertrophy — wall stress normalised at a cost (↓compliance, ischaemia risk)"
              : stress > 200
                ? "Elevated wall stress"
                : "Normal wall stress",
      body: "Wall stress (σ = P·r / 2h) sets myocardial O2 demand. Dilation and pressure overload raise it; wall thickening lowers it. Concentric hypertrophy normalises stress in pressure overload but stiffens the ventricle and outstrips its coronary supply.",
      readouts: [
        { label: "Wall stress", value: `${stress.toFixed(0)} mmHg·cm` },
        { label: "vs normal", value: `${relDemand.toFixed(1)}×` },
        { label: "Radius", value: `${values.radius.toFixed(2)} cm` },
        { label: "Pressure", value: `${values.pressure.toFixed(0)} mmHg` },
        { label: "Thickness", value: `${values.thickness.toFixed(2)} cm` }
      ],
      warning:
        stress > 300
          ? "Edge state: very high wall stress — O2 demand outstrips supply; subendocardial ischaemia and progressive dilation (a failing-heart spiral)."
          : values.thickness > 1.8
            ? "Edge state: severe hypertrophy — diastolic dysfunction, microvascular ischaemia, arrhythmia risk despite 'normal' stress."
            : undefined
    };
  }
};

export default function LaplaceWallStressWidget() {
  return <CurveLabWidget config={config} />;
}
