"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function alveolarVentilation(tidalVolume: number, rate: number, deadSpace: number) {
  return Math.max(tidalVolume - deadSpace, 0) * rate / 1000;
}

function paco2(co2Production: number, va: number) {
  return clamp(40 * (co2Production / 200) / Math.max(va / 4.2, 0.25), 18, 95);
}

const config: CurveLabConfig = {
  diagramId: "resp/dead-space-ventilation",
  title: "Alveolar ventilation vs tidal volume",
  xDomain: [150, 1000],
  yDomain: [0, 14],
  xLabel: "tidal volume (mL)",
  yLabel: "alveolar ventilation (L/min)",
  controls: [
    { key: "tidalVolume", label: "Tidal volume", min: 150, max: 1000, step: 10, defaultValue: 500, unit: "mL" },
    { key: "rate", label: "Respiratory rate", min: 4, max: 40, step: 1, defaultValue: 12, unit: "/min" },
    { key: "deadSpace", label: "Dead space", min: 50, max: 450, step: 10, defaultValue: 150, unit: "mL" },
    { key: "co2Production", label: "CO2 production", min: 100, max: 500, step: 10, defaultValue: 200, unit: "mL/min" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current rate/dead space",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(150, 1000, 10).map((vt) => ({
        x: vt,
        y: alveolarVentilation(vt, values.rate, values.deadSpace)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal RR 12 / VD 150",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(150, 1000, 10).map((vt) => ({ x: vt, y: alveolarVentilation(vt, 12, 150) }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.tidalVolume,
      y: alveolarVentilation(values.tidalVolume, values.rate, values.deadSpace),
      label: "current breath"
    }
  ],
  getCursorX: (values) => values.tidalVolume,
  summarize: (values) => {
    const ve = (values.tidalVolume * values.rate) / 1000;
    const va = alveolarVentilation(values.tidalVolume, values.rate, values.deadSpace);
    const vdvt = values.deadSpace / Math.max(values.tidalVolume, 1);
    const co2 = paco2(values.co2Production, va);
    return {
      state:
        vdvt > 0.55
          ? "Rapid shallow / high dead space"
          : co2 > 50
            ? "Hypoventilation"
            : co2 < 30
              ? "Hyperventilation"
              : "Effective alveolar ventilation",
      body: "Minute ventilation is not the same as alveolar ventilation. Dead space is paid on every breath, so shallow breathing can waste most of total ventilation.",
      readouts: [
        { label: "VE", value: `${ve.toFixed(1)} L/min` },
        { label: "VA", value: `${va.toFixed(1)} L/min` },
        { label: "VD/VT", value: `${(vdvt * 100).toFixed(0)}%` },
        { label: "PaCO2", value: `${co2.toFixed(0)}` }
      ],
      warning:
        vdvt > 0.65
          ? "Edge state: most of each breath is dead space, so CO2 clearance can collapse despite a high rate."
          : undefined
    };
  }
};

export default function DeadSpaceVentilationWidget() {
  return <CurveLabWidget config={config} />;
}
