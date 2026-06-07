"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Axonal conduction velocity vs fibre diameter.
 *   - Myelinated fibres: velocity ∝ diameter (saltatory conduction).
 *     Rule of thumb ≈ 6 m/s per µm  → a 20 µm Aα fibre ≈ 120 m/s.
 *   - Unmyelinated fibres: velocity ∝ √diameter (continuous conduction),
 *     much slower → C fibres ~0.5–2 m/s.
 *   - Temperature: Q10 ≈ 1.3 — cooling slows conduction (nerve block on ice).
 *
 * The myelination slider blends between the two regimes, modelling
 * demyelination (MS, Guillain–Barré): a large fibre that loses myelin
 * collapses from the fast linear curve toward the slow √ curve — or blocks
 * entirely.
 */
function velocity(diameter: number, myelination: number, temp: number) {
  const myelinatedV = 6 * diameter;            // m/s
  const unmyelinatedV = 2 * Math.sqrt(diameter); // m/s
  const frac = myelination / 100;
  const base = unmyelinatedV + (myelinatedV - unmyelinatedV) * frac;
  const q10 = Math.pow(1.3, (temp - 37) / 10);
  return clamp(base * q10, 0, 140);
}

const config: CurveLabConfig = {
  diagramId: "nerv/nerve-conduction-velocity",
  title: "Conduction velocity vs axon diameter",
  xDomain: [0.2, 20],
  yDomain: [0, 140],
  xLabel: "Axon diameter (µm)",
  yLabel: "Conduction velocity (m/s)",
  controls: [
    { key: "diameter", label: "Axon diameter (cursor)", min: 0.2, max: 20, step: 0.1, defaultValue: 12, unit: "µm" },
    { key: "myelination", label: "Myelination", min: 0, max: 100, step: 1, defaultValue: 100, unit: "%" },
    { key: "temp", label: "Temperature", min: 20, max: 42, step: 0.5, defaultValue: 37, unit: "°C" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current fibre",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0.2, 20, 0.2).map((x) => ({ x, y: velocity(x, values.myelination, values.temp) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "myelinated",
      label: "Fully myelinated (37 °C)",
      colorVar: "var(--ph-curve-6)",
      dashed: true,
      data: makeRange(0.2, 20, 0.2).map((x) => ({ x, y: velocity(x, 100, 37) }))
    },
    {
      id: "unmyelinated",
      label: "Unmyelinated (37 °C)",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(0.2, 20, 0.2).map((x) => ({ x, y: velocity(x, 0, 37) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.diameter, y: velocity(values.diameter, values.myelination, values.temp), label: "operating point" }
  ],
  getCursorX: (values) => values.diameter,
  summarize: (values) => {
    const v = velocity(values.diameter, values.myelination, values.temp);
    const fibreClass = (() => {
      if (values.myelination > 60 && values.diameter > 12) return "Aα — proprioception, α-motor (fastest)";
      if (values.myelination > 60 && values.diameter > 5) return "Aβ — touch, pressure";
      if (values.myelination > 40 && values.diameter > 1) return "Aδ — fast (sharp) pain, cold";
      if (values.myelination > 40) return "B — preganglionic autonomic";
      return "C — slow (dull) pain, warmth, postganglionic autonomic";
    })();
    return {
      state:
        values.myelination < 30 && values.diameter > 8
          ? "Demyelinated large fibre — conduction slowed or blocked (MS / GBS)"
          : values.temp < 30
            ? "Cooled nerve — conduction slowed (cryo-analgesia, hypothermia)"
            : fibreClass,
      body: "Velocity rises with diameter, but myelin changes the LAW: myelinated fibres conduct in proportion to diameter via saltatory jumps between nodes of Ranvier, while unmyelinated fibres crawl in proportion to √diameter. Demyelination drops a fast Aα/Aβ fibre onto the slow √ curve — clinically, slowed conduction velocity and conduction block on nerve studies (MS, Guillain–Barré, Charcot–Marie–Tooth).",
      readouts: [
        { label: "Velocity", value: `${v.toFixed(1)} m/s` },
        { label: "Diameter", value: `${values.diameter.toFixed(1)} µm` },
        { label: "Myelin", value: `${values.myelination.toFixed(0)}%` },
        { label: "Temp", value: `${values.temp.toFixed(1)} °C` }
      ],
      warning:
        values.myelination < 15 && values.diameter > 10
          ? "Edge state: near-complete demyelination of a large fibre — conduction block; clinically weakness / sensory loss despite an intact axon."
          : values.temp < 24
            ? "Edge state: < 24 °C — marked conduction slowing; the basis of ice-pack nerve block and cold-induced areflexia."
            : undefined
    };
  }
};

export default function NerveConductionVelocityWidget() {
  return <CurveLabWidget config={config} />;
}
