"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function endCapillaryPressure(time: number, values: Record<string, number>) {
  const alveolar = 104;
  const venous = 40;
  const transit = 0.75 / (values.cardiacOutput / 5);
  const conductance = (values.surfaceArea / 100) * values.gasDiffusivity / values.thickness;
  const tau = clamp(0.18 / Math.max(conductance, 0.08), 0.05, 1.4);
  const t = Math.min(time, transit);
  return venous + (alveolar - venous) * (1 - Math.exp(-t / tau));
}

const config: CurveLabConfig = {
  diagramId: "resp/diffusion-limitation",
  title: "End-capillary gas equilibration",
  xDomain: [0, 0.75],
  yDomain: [35, 110],
  xLabel: "capillary transit time (s)",
  yLabel: "capillary PO2 equivalent",
  controls: [
    { key: "thickness", label: "Membrane thickness", min: 0.5, max: 4, step: 0.05, defaultValue: 1, unit: "x" },
    { key: "surfaceArea", label: "Surface area", min: 20, max: 120, step: 1, defaultValue: 100, unit: "%" },
    { key: "cardiacOutput", label: "Cardiac output", min: 3, max: 12, step: 0.1, defaultValue: 5, unit: "L/min" },
    { key: "gasDiffusivity", label: "Gas diffusivity", min: 0.15, max: 2.5, step: 0.05, defaultValue: 1, unit: "x O2" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current gas",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 0.75, 0.01).map((t) => ({ x: t, y: endCapillaryPressure(t, values) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal O2",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 0.75, 0.01).map((t) => ({
        x: t,
        y: endCapillaryPressure(t, { thickness: 1, surfaceArea: 100, cardiacOutput: 5, gasDiffusivity: 1 })
      }))
    }
  ],
  buildAnnotations: (values) => {
    const transit = 0.75 / (values.cardiacOutput / 5);
    return [{ x: Math.min(transit, 0.75), y: endCapillaryPressure(transit, values), label: "RBC exit" }];
  },
  getCursorX: (values) => Math.min(0.75 / (values.cardiacOutput / 5), 0.75),
  summarize: (values) => {
    const transit = 0.75 / (values.cardiacOutput / 5);
    const exit = endCapillaryPressure(transit, values);
    const gradient = 104 - exit;
    return {
      state:
        gradient > 18
          ? "Diffusion-limited"
          : values.cardiacOutput > 9
            ? "Exercise transit challenge"
            : values.thickness > 2
              ? "Reduced diffusion reserve"
              : "Perfusion-limited reserve",
      body: "Normal oxygen equilibrates early in the capillary, leaving reserve for exercise. Thickened membrane, lost area, low diffusivity, or short transit time can leave a persistent alveolar-capillary gradient.",
      readouts: [
        { label: "Exit PO2", value: `${exit.toFixed(0)}` },
        { label: "A-c grad", value: `${gradient.toFixed(0)}` },
        { label: "Transit", value: `${transit.toFixed(2)} s` },
        { label: "Area", value: `${values.surfaceArea.toFixed(0)}%` }
      ],
      warning:
        gradient > 25
          ? "Edge state: capillary blood exits before equilibration; diffusion reserve is exhausted."
          : undefined
    };
  }
};

export default function DiffusionLimitationWidget() {
  return <CurveLabWidget config={config} />;
}
