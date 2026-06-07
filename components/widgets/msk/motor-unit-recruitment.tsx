"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function recruitment(drive: number, fatigue: number) {
  const slowUnits = 35 / (1 + Math.exp(-(drive - 18) / 6));
  const fastResistant = 38 / (1 + Math.exp(-(drive - 47) / 8));
  const fastFatigable = 32 / (1 + Math.exp(-(drive - 72) / 7));
  return clamp((slowUnits + fastResistant + fastFatigable) * (1 - fatigue * 0.0022), 0, 110);
}

function rateForce(drive: number, rateGain: number) {
  return clamp((drive - 18) * 0.45 * (rateGain / 100), 0, 58);
}

const config: CurveLabConfig = {
  diagramId: "msk/motor-unit-recruitment",
  title: "Motor unit recruitment and rate coding",
  xDomain: [0, 100],
  yDomain: [0, 150],
  xLabel: "descending drive",
  yLabel: "relative force contribution",
  controls: [
    { key: "drive", label: "Descending drive", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%" },
    { key: "rateGain", label: "Rate-coding gain", min: 30, max: 160, step: 1, defaultValue: 100, unit: "%" },
    { key: "fatigue", label: "Fatigue", min: 0, max: 100, step: 1, defaultValue: 15, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "recruitment",
      label: "Recruitment",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 100, 1).map((drive) => ({ x: drive, y: recruitment(drive, values.fatigue) }))
    },
    {
      id: "rate",
      label: "Rate coding",
      colorVar: "var(--ph-curve-2)",
      data: makeRange(0, 100, 1).map((drive) => ({ x: drive, y: rateForce(drive, values.rateGain) }))
    },
    {
      id: "total",
      label: "Total force",
      colorVar: "var(--ph-curve-3)",
      data: makeRange(0, 100, 1).map((drive) => ({
        x: drive,
        y: clamp(recruitment(drive, values.fatigue) + rateForce(drive, values.rateGain), 0, 150)
      }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.drive,
      y: clamp(recruitment(values.drive, values.fatigue) + rateForce(values.drive, values.rateGain), 0, 150),
      label: "current drive"
    }
  ],
  getCursorX: (values) => values.drive,
  summarize: (values) => {
    const recruited = recruitment(values.drive, values.fatigue);
    const rate = rateForce(values.drive, values.rateGain);
    const total = clamp(recruited + rate, 0, 150);
    return {
      state: values.drive < 25 ? "Low-threshold type I units" : values.drive < 65 ? "Recruiting IIa units" : "High-threshold IIx units",
      body: "Henneman size principle: small fatigue-resistant units recruit first; high-threshold fast units join as descending drive rises. Rate coding then boosts force within active units.",
      readouts: [
        { label: "Units", value: `${recruited.toFixed(0)}%` },
        { label: "Rate", value: `${rate.toFixed(0)}%` },
        { label: "Force", value: `${total.toFixed(0)}%` },
        { label: "Fatigue", value: `${values.fatigue.toFixed(0)}%` }
      ],
      warning: values.fatigue > 75 ? "Edge state: fatigue reduces force despite high recruitment drive." : undefined
    };
  }
};

export default function MotorUnitRecruitmentWidget() {
  return <CurveLabWidget config={config} />;
}
