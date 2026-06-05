"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function pao2(ratio: number, fio2: number) {
  return clamp(42 + fio2 * 2.2 * (ratio / (ratio + 0.38)), 35, 155);
}

function paco2(ratio: number) {
  return clamp(48 / (ratio + 0.22), 12, 72);
}

const config: CurveLabConfig = {
  diagramId: "resp/vq-matching",
  title: "Ventilation-perfusion matching",
  xDomain: [0, 4],
  yDomain: [0, 160],
  xLabel: "V/Q ratio",
  yLabel: "Alveolar gas",
  controls: [
    { key: "ventilation", label: "Ventilation", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%" },
    { key: "perfusion", label: "Perfusion", min: 5, max: 100, step: 1, defaultValue: 50, unit: "%" },
    { key: "fio2", label: "Inspired O2", min: 21, max: 60, step: 1, defaultValue: 21, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "pao2",
      label: "PAO2",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 4, 0.1).map((x) => ({ x, y: pao2(x, values.fio2) }))
    },
    {
      id: "paco2",
      label: "PACO2",
      colorVar: "var(--ph-curve-2)",
      data: makeRange(0, 4, 0.1).map((x) => ({ x, y: paco2(x) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal-o2",
      label: "Normal PAO2",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 4, 0.1).map((x) => ({ x, y: pao2(x, 21) }))
    }
  ],
  getCursorX: (values) => values.ventilation / values.perfusion,
  buildAnnotations: (values) => {
    const ratio = values.ventilation / values.perfusion;
    return [{ x: ratio, y: pao2(ratio, values.fio2), label: `V/Q ${ratio.toFixed(2)}` }];
  },
  summarize: (values) => {
    const ratio = values.ventilation / values.perfusion;
    return {
      state: ratio < 0.35 ? "Shunt-like" : ratio > 2 ? "Dead-space-like" : "Matched unit",
      body: "Move ventilation and perfusion to place a lung unit along the V/Q curve. Watch oxygen rise and carbon dioxide fall as ventilation dominates.",
      readouts: [
        { label: "V/Q", value: ratio.toFixed(2) },
        { label: "PAO2", value: `${pao2(ratio, values.fio2).toFixed(0)}` },
        { label: "PACO2", value: `${paco2(ratio).toFixed(0)}` },
        { label: "FiO2", value: `${values.fio2.toFixed(0)}%` }
      ],
      warning: ratio < 0.15 || ratio > 3.5 ? "Edge state: this unit is near shunt or dead space, so gas exchange is severely inefficient." : undefined
    };
  }
};

export default function VqMatchingWidget() {
  return <CurveLabWidget config={config} />;
}
