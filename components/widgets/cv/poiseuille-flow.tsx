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
  readingGuide:
    "Flow rises with the fourth power of radius, so the curve rockets upward — doubling the radius multiplies flow about 16×. That steepness near small radii is why arteriolar tone, not the big arteries, sets resistance. Pressure gradient and viscosity only slide the whole curve up or down.",
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
    },
    {
      id: "hyperviscous",
      label: "Hyperviscous (η=2.0 — polycythemia)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(0, 5, 0.05).map((r) => ({
        x: r,
        y: clamp(poiseuilleFlow(r, 50, 2.0, 5), 0, 1100)
      }))
    },
    {
      id: "hypotensive",
      label: "Hypotensive (ΔP=25 — shock)",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(0, 5, 0.05).map((r) => ({
        x: r,
        y: clamp(poiseuilleFlow(r, 25, 1, 5), 0, 1100)
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
    // Mean velocity (cm/s) from Q (mL/min) and area (πr² mm² → cm²).
    const areaCm2 = Math.PI * Math.pow(values.radius / 10, 2);
    const velocity = areaCm2 > 0 ? (q / 60) / areaCm2 : 0;
    // Reynolds number: Re = ρ · v · D / η. Blood density ≈ 1.06 g/mL.
    // Critical Re ≈ 2000 (laminar → transitional → turbulent in vessels).
    const diameterCm = (2 * values.radius) / 10;
    const re = (1.06 * velocity * diameterCm) / (values.viscosity * 0.01);
    // Resistance per unit length: R ∝ η / r⁴. Normalised to 1.0 at default.
    const resistance = (values.viscosity * values.length) / Math.pow(values.radius, 4);
    return {
      state:
        values.radius < 0.05
          ? "Capillary scale — single-file RBCs, plug flow"
          : values.radius < 0.3
            ? "Arteriole — primary resistance vessel of the circulation"
            : values.radius < 1.5
              ? "Small artery — distributive vessel"
              : values.radius > 3.5
                ? "Conduit artery (aorta-scale) — flow-dominated, low resistance"
                : values.viscosity > 1.6
                  ? "Hyperviscous regime (polycythemia / dehydration / cryoglobulinemia)"
                  : "Normal arterial regime",
      body: "Flow scales with the FOURTH power of radius — halving the radius cuts flow by 16×. Arteriolar tone (smooth muscle radius control) is the single most powerful determinant of regional perfusion. Reynolds number > ~2000 → turbulence (audible bruit / murmur).",
      readouts: [
        { label: "Q", value: `${q.toFixed(0)} mL/min` },
        { label: "r", value: `${values.radius.toFixed(2)} mm` },
        { label: "v̄", value: `${velocity.toFixed(1)} cm/s` },
        { label: "Re", value: `${re.toFixed(0)}` },
        { label: "Q vs r/2", value: `${ratio.toFixed(1)}×` },
        { label: "R (× normal)", value: `${resistance.toFixed(2)}×` }
      ],
      warning:
        re > 2000
          ? "Edge state: Re > 2000 — flow becomes turbulent; Poiseuille's equation no longer holds. Clinically: bruit / murmur audible at this site."
          : values.viscosity > 2.5
            ? "Edge state: viscosity > 2.5 cP — polycythemia vera, severe dehydration, or hyperproteinemia. Flow markedly reduced; thrombosis risk rises."
            : values.radius < 0.03
              ? "Edge state: radius below RBC diameter (~4 µm) — non-Newtonian behaviour (Fåhraeus–Lindqvist effect) takes over."
              : undefined
    };
  }
};

export default function PoiseuilleFlowWidget() {
  return <CurveLabWidget config={config} />;
}
