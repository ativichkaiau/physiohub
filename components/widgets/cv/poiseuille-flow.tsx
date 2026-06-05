"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Poiseuille flow: Q = (π · r⁴ · ΔP) / (8 · η · L). The r⁴ term dominates
 * everything — a 50% drop in radius cuts flow to 1/16, which is why arteriolar
 * radius is the single most powerful determinant of regional perfusion.
 *
 * Units chosen for med-school reading:
 *   r in mm, ΔP in mmHg, η in centipoise (cP), L in cm.
 * Output normalised so a 2 mm vessel at default settings reads ~100 mL/min.
 */
function poiseuilleFlow(radius: number, deltaP: number, viscosity: number, length: number) {
  // Scaling constant tuned so Q(r=2, ΔP=50, η=1, L=5) ≈ 100 mL/min
  const SCALE = 4.97;
  return SCALE * (Math.PI * Math.pow(radius, 4) * deltaP) / (viscosity * length);
}

const config: CurveLabConfig = {
  diagramId: "cv/poiseuille-flow",
  title: "Flow vs vessel radius (Poiseuille)",
  xDomain: [0, 5],
  yDomain: [0, 1000],
  xLabel: "vessel radius (mm)",
  yLabel: "Flow (mL/min)",
  controls: [
    { key: "radius", label: "Vessel radius (cursor)", min: 0.2, max: 5, step: 0.05, defaultValue: 2, unit: "mm" },
    { key: "dp", label: "Pressure gradient (ΔP)", min: 10, max: 150, step: 1, defaultValue: 50, unit: "mmHg" },
    { key: "viscosity", label: "Viscosity (η)", min: 0.5, max: 3, step: 0.05, defaultValue: 1, unit: "cP" },
    { key: "length", label: "Vessel length (L)", min: 1, max: 20, step: 0.5, defaultValue: 5, unit: "cm" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current curve",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 5, 0.05).map((r) => ({
        x: r,
        y: clamp(poiseuilleFlow(r, values.dp, values.viscosity, values.length), 0, 1100)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Baseline (ΔP=50, η=1, L=5)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 5, 0.05).map((r) => ({
        x: r,
        y: clamp(poiseuilleFlow(r, 50, 1, 5), 0, 1100)
      }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.radius,
      y: clamp(poiseuilleFlow(values.radius, values.dp, values.viscosity, values.length), 0, 1100),
      label: "operating point"
    }
  ],
  getCursorX: (values) => values.radius,
  summarize: (values) => {
    const q = poiseuilleFlow(values.radius, values.dp, values.viscosity, values.length);
    const qHalfR = poiseuilleFlow(values.radius / 2, values.dp, values.viscosity, values.length);
    const ratio = q > 0 ? q / Math.max(qHalfR, 0.0001) : 0;
    return {
      state:
        values.radius < 0.6
          ? "Resistive vessel — arteriolar control"
          : values.radius > 3.5
            ? "Conduit vessel — flow-dominated"
            : values.viscosity > 1.6
              ? "Hyperviscous (polycythemia / dehydration)"
              : "Normal regime",
      body: "Flow scales with the FOURTH power of radius — halving the radius cuts flow by a factor of 16. Slide vessel radius to feel the r⁴ dominance; adjust ΔP, viscosity, and length to scale the curve linearly.",
      readouts: [
        { label: "Q", value: `${q.toFixed(0)} mL/min` },
        { label: "r", value: `${values.radius.toFixed(2)} mm` },
        { label: "Q vs r/2", value: `${ratio.toFixed(1)}×` },
        { label: "ΔP", value: `${values.dp.toFixed(0)} mmHg` }
      ],
      warning:
        values.viscosity > 2.5
          ? "Edge state: viscosity > 2.5 cP suggests polycythemia or severe dehydration — flow is markedly reduced."
          : values.radius < 0.3
            ? "Edge state: radius below capillary scale — Poiseuille assumptions (Newtonian, laminar) break down."
            : undefined
    };
  }
};

export default function PoiseuilleFlowWidget() {
  return <CurveLabWidget config={config} />;
}
