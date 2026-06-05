"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function coCurve(rap: number, contractility: number) {
  return clamp(contractility * (2.8 + 0.55 * (rap + 2)), 0, 12);
}

function vrCurve(rap: number, volume: number, resistance: number) {
  const meanSystemicFilling = 7 + (volume - 50) * 0.1;
  return clamp((meanSystemicFilling - rap) / resistance, 0, 12);
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
  yDomain: [0, 12],
  xLabel: "Right atrial pressure",
  yLabel: "Flow",
  controls: [
    { key: "volume", label: "Blood volume", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%" },
    { key: "contractility", label: "Contractility", min: 0.5, max: 1.8, step: 0.01, defaultValue: 1 },
    { key: "resistance", label: "Venous resistance", min: 0.7, max: 2.2, step: 0.01, defaultValue: 1.2 }
  ],
  buildSeries: (values) => [
    {
      id: "co",
      label: "Cardiac output",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(-4, 12, 0.4).map((x) => ({ x, y: coCurve(x, values.contractility) }))
    },
    {
      id: "vr",
      label: "Venous return",
      colorVar: "var(--ph-curve-2)",
      data: makeRange(-4, 12, 0.4).map((x) => ({ x, y: vrCurve(x, values.volume, values.resistance) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal-co",
      label: "Normal CO",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(-4, 12, 0.4).map((x) => ({ x, y: coCurve(x, 1) }))
    },
    {
      id: "normal-vr",
      label: "Normal VR",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(-4, 12, 0.4).map((x) => ({ x, y: vrCurve(x, 50, 1.2) }))
    }
  ],
  buildAnnotations: (values) => {
    const point = operatingPoint(values.volume, values.contractility, values.resistance);
    return [{ x: point.rap, y: point.flow, label: "operating point" }];
  },
  summarize: (values) => {
    const point = operatingPoint(values.volume, values.contractility, values.resistance);
    return {
      state: values.volume > 70 ? "Volume expanded" : values.contractility > 1.2 ? "Cardiac curve lifted" : "Balanced intersection",
      body: "The circulation settles where cardiac output equals venous return. Move volume, contractility, and venous resistance to shift the intersection.",
      readouts: [
        { label: "CO", value: `${point.flow.toFixed(1)} L/min` },
        { label: "RAP", value: `${point.rap.toFixed(1)} mmHg` },
        { label: "Volume", value: `${values.volume.toFixed(0)}%` },
        { label: "Resistance", value: `${values.resistance.toFixed(2)}x` }
      ],
      warning: point.flow < 2.5 ? "Edge state: the intersection has collapsed toward low-flow shock." : undefined
    };
  }
};

export default function CardiacOutputWidget() {
  return <CurveLabWidget config={config} />;
}
