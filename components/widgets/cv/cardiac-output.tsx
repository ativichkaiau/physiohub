"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

// Cardiac output curve (Guyton): a sigmoid that PLATEAUS, not a straight
// line. CO falls to zero at very low RAP (~-4 mmHg, where filling collapses),
// rises through ~5 L/min at RAP ≈ 0 (normal physiology), and approaches a
// plateau near 14 L/min in the normal heart. Contractility scales the plateau.
function coCurve(rap: number, contractility: number) {
  const plateau = 14 * contractility;
  const drive = Math.max(0, rap + 4);
  return clamp(plateau * (1 - Math.exp(-drive / 9)), 0, 18);
}

// Venous return curve (Guyton). Linear segment with slope = 1/R for
// RAP > collapse point (≈ -2 mmHg); BELOW that, the great veins collapse
// against subatmospheric transmural pressure and VR PLATEAUS. The previous
// model let VR rise indefinitely with negative RAP, which doesn't happen.
// Resistance to venous return ≈ 1.4 mmHg·min/L (Guyton: RVR = Pmsf/CO = 7/5),
// so the normal VR curve passes through (RAP 0, 5 L/min) and intersects the CO
// curve at Guyton's canonical operating point (CO 5, RAP 0).
function vrCurve(rap: number, volume: number, resistance: number) {
  const meanSystemicFilling = 7 + (volume - 50) * 0.1;
  const collapsePoint = -2;
  const effectiveRap = Math.max(rap, collapsePoint);
  return clamp((meanSystemicFilling - effectiveRap) / resistance, 0, 18);
}

function operatingPoint(volume: number, contractility: number, resistance: number) {
  let bestRap = 0;
  let bestFlow = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  makeRange(-4, 12, 0.1).forEach((rap) => {
    const co = coCurve(rap, contractility);
    const vr = vrCurve(rap, volume, resistance);
    const delta = Math.abs(co - vr);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestRap = rap;
      bestFlow = (co + vr) / 2;
    }
  });
  return { rap: bestRap, flow: bestFlow };
}

const config: CurveLabConfig = {
  diagramId: "cv/cardiac-output",
  title: "Cardiac output and venous return curves",
  xDomain: [-4, 12],
  yDomain: [0, 16],
  xLabel: "Right atrial pressure",
  yLabel: "Flow",
  readingGuide:
    "The heart can only pump what the veins return, so the circulation settles where the two curves cross — that intersection is the actual cardiac output (height) and right atrial pressure (position). More blood volume slides venous return up and to the right; stronger contractility lifts the cardiac-output curve; the operating dot tracks wherever they now meet.",
  bands: [
    { axis: "y", from: 4, to: 8, tone: "ok", label: "normal CO" },
    { axis: "y", from: 2.5, to: 4, tone: "warn" },
    { axis: "y", from: 0, to: 2.5, tone: "danger" }
  ],
  controls: [
    { key: "volume", label: "Blood volume", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%" },
    { key: "contractility", label: "Contractility", min: 0.5, max: 1.8, step: 0.01, defaultValue: 1 },
    { key: "resistance", label: "Venous resistance", min: 0.7, max: 2.2, step: 0.01, defaultValue: 1.4 }
  ],
  buildSeries: (values) => [
    {
      id: "co",
      label: "Cardiac output",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(-4, 12, 0.3).map((x) => ({ x, y: coCurve(x, values.contractility) }))
    },
    {
      id: "vr",
      label: "Venous return",
      colorVar: "var(--ph-curve-2)",
      data: makeRange(-4, 12, 0.3).map((x) => ({ x, y: vrCurve(x, values.volume, values.resistance) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal-co",
      label: "Normal CO",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(-4, 12, 0.3).map((x) => ({ x, y: coCurve(x, 1) }))
    },
    {
      id: "normal-vr",
      label: "Normal VR",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(-4, 12, 0.3).map((x) => ({ x, y: vrCurve(x, 50, 1.4) }))
    }
  ],
  buildAnnotations: (values) => {
    const point = operatingPoint(values.volume, values.contractility, values.resistance);
    return [{ x: point.rap, y: point.flow, label: "operating point" }];
  },
  summarize: (values) => {
    const point = operatingPoint(values.volume, values.contractility, values.resistance);
    const msfp = 7 + (values.volume - 50) * 0.1;
    const ci = point.flow / 1.73; // Cardiac index, assuming average adult BSA 1.73 m²
    // Map operating-point coordinates to canonical shock / failure phenotypes.
    const phenotype =
      point.flow < 2.5
        ? "Cardiogenic / hypovolemic shock pattern"
        : values.volume < 30 && values.contractility >= 0.85
          ? "Hypovolemic pattern — ↓MSFP shifts VR left"
          : values.contractility < 0.75 && point.rap > 5
            ? "Cardiogenic pattern — CO curve depressed, RAP rises"
            : values.volume > 75 && values.contractility >= 0.9
              ? "Volume overload — CHF or iatrogenic resuscitation"
              : values.contractility > 1.25
                ? "Hyperdynamic (β-stim / dobutamine / early sepsis warm phase)"
                : "Balanced intersection — normal physiology";
    return {
      state: phenotype,
      body: "The circulation settles where the CO curve crosses the VR curve. Volume sets MSFP (VR x-intercept); contractility scales the CO plateau; venous resistance changes the VR slope. The intersection point IS the steady-state cardiac output.",
      readouts: [
        { label: "CO", value: `${point.flow.toFixed(1)} L/min` },
        { label: "CI", value: `${ci.toFixed(1)} L/min/m²` },
        { label: "RAP", value: `${point.rap.toFixed(1)} mmHg` },
        { label: "MSFP", value: `${msfp.toFixed(1)} mmHg` },
        { label: "Volume", value: `${values.volume.toFixed(0)}%` },
        { label: "Resistance", value: `${values.resistance.toFixed(2)}×` }
      ],
      warning:
        point.flow < 2.2
          ? "Edge state: CI < 1.3 L/min/m² — frank cardiogenic shock with end-organ hypoperfusion."
          : point.rap > 10 && values.contractility < 0.8
            ? "Edge state: high RAP plus depressed pump — right-heart congestion (peripheral edema, hepatic stretch)."
            : msfp < 3
              ? "Edge state: MSFP < 3 mmHg — severe volume contraction, VR collapse imminent."
              : undefined
    };
  }
};

export default function CardiacOutputWidget() {
  return <CurveLabWidget config={config} />;
}
