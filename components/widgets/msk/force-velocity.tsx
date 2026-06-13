"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function velocity(load: number, activation: number) {
  const fmax = activation;
  if (load >= fmax) {
    // Eccentric (lengthening) — negative velocity; force exceeds Fmax.
    return clamp(-0.55 * (load - fmax) / Math.max(20, fmax), -0.6, 0);
  }
  // Hill hyperbola: V = b·(Fmax − F)/(F + a) with a/Fmax ≈ 0.25. Vmax occurs
  // only at zero load (~1.6 here) and declines monotonically — no flat top.
  return clamp((0.4 * (fmax - load)) / (load + 0.25 * fmax), 0, 1.8);
}

const config: CurveLabConfig = {
  diagramId: "msk/force-velocity",
  title: "Skeletal muscle force-velocity curve",
  xDomain: [0, 160],
  yDomain: [-0.7, 1.8],
  xLabel: "external load (% maximal isometric force)",
  yLabel: "velocity (relative)",
  bands: [
    { axis: "x", from: 0, to: 100, tone: "phase", label: "concentric (shortening)" },
    { axis: "x", from: 100, to: 160, tone: "phase", label: "eccentric (lengthening)" }
  ],
  controls: [
    { key: "load", label: "Load marker", min: 0, max: 160, step: 1, defaultValue: 65, unit: "% Fmax" },
    { key: "activation", label: "Activation / recruitment", min: 45, max: 150, step: 1, defaultValue: 100, unit: "% normal" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 160, 2).map((load) => ({ x: load, y: velocity(load, values.activation) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal activation",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 160, 2).map((load) => ({ x: load, y: velocity(load, 100) }))
    }
  ],
  buildAnnotations: (values) => [{ x: values.load, y: velocity(values.load, values.activation), label: "operating load" }],
  getCursorX: (values) => values.load,
  summarize: (values) => {
    const v = velocity(values.load, values.activation);
    const power = Math.max(0, values.load * v);
    return {
      state: v < 0 ? "Eccentric lengthening" : v < 0.08 ? "Isometric boundary" : values.load < 35 ? "Fast unloaded shortening" : "Concentric shortening",
      body: "Shortening velocity falls as load rises. Maximum mechanical power sits at an intermediate load, while eccentric contractions generate high force during lengthening.",
      readouts: [
        { label: "Velocity", value: `${v.toFixed(2)}` },
        { label: "Load", value: `${values.load.toFixed(0)}%` },
        { label: "Activation", value: `${values.activation.toFixed(0)}%` },
        { label: "Power", value: `${power.toFixed(0)}` }
      ],
      warning: values.load > values.activation + 25 ? "Edge state: load exceeds active capacity; the muscle lengthens eccentrically." : undefined
    };
  }
};

export default function ForceVelocityWidget() {
  return <CurveLabWidget config={config} />;
}
