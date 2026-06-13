"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Hormone (or drug) dose–response. Hill / sigmoid:
 *   Response = Emax · [D]^n / (EC50^n + [D]^n)
 * Three phenomena are explored side-by-side:
 *   - Full agonist alone — the canonical sigmoid.
 *   - Competitive antagonist — shifts the curve RIGHTWARD; Emax preserved.
 *   - Non-competitive (allosteric) antagonist — DROPS the Emax ceiling.
 *   - Partial agonist — has lower intrinsic activity; even at saturating
 *     dose it cannot reach full Emax, and competes with full agonist.
 * Hill coefficient (n) controls steepness; n > 1 = positive cooperativity
 * (e.g., haemoglobin O2 binding); n = 1 = independent binding sites.
 */
function response(dose: number, emax: number, ec50: number, hill: number) {
  const d = Math.max(dose, 0.0001);
  return (emax * Math.pow(d, hill)) / (Math.pow(ec50, hill) + Math.pow(d, hill));
}

const config: CurveLabConfig = {
  diagramId: "endo/hormone-dose-response",
  title: "Hormone dose–response (sigmoid / Hill)",
  xDomain: [-2, 3],
  yDomain: [0, 110],
  xLabel: "log [dose] (× EC50, log10)",
  yLabel: "Response (% of max)",
  bands: [
    { axis: "x", from: -2, to: -1, tone: "phase", label: "sub-threshold" },
    { axis: "x", from: -1, to: 1, tone: "phase", label: "responsive (linear)" },
    { axis: "x", from: 1, to: 3, tone: "phase", label: "saturated" }
  ],
  controls: [
    { key: "ec50", label: "EC50 (potency)", min: 0.1, max: 50, step: 0.1, defaultValue: 1, unit: "× normal" },
    { key: "hill", label: "Hill coefficient (n)", min: 0.5, max: 4, step: 0.1, defaultValue: 1, unit: "" },
    { key: "compAntagonist", label: "Competitive antagonist", min: 0, max: 100, step: 1, defaultValue: 0, unit: "% block" },
    { key: "nonCompAntagonist", label: "Non-competitive antagonist", min: 0, max: 90, step: 1, defaultValue: 0, unit: "% block" }
  ],
  buildSeries: (values) => {
    const apparentEc50 = values.ec50 * (1 + values.compAntagonist / 25);
    const emax = 100 * (1 - values.nonCompAntagonist / 100);
    return [
      {
        id: "current",
        label: "Current",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: makeRange(-2, 3, 0.05).map((logDose) => {
          const dose = Math.pow(10, logDose) * values.ec50;
          return { x: logDose, y: clamp(response(dose, emax, apparentEc50, values.hill), 0, 110) };
        })
      }
    ];
  },
  buildReferenceSeries: () => [
    {
      id: "fullAgonist",
      label: "Full agonist (reference)",
      colorVar: "var(--ph-curve-6)",
      dashed: true,
      data: makeRange(-2, 3, 0.05).map((logDose) => {
        const dose = Math.pow(10, logDose);
        return { x: logDose, y: clamp(response(dose, 100, 1, 1), 0, 110) };
      })
    },
    {
      id: "partial",
      label: "Partial agonist (Emax = 55%)",
      colorVar: "var(--ph-curve-3)",
      dashed: true,
      data: makeRange(-2, 3, 0.05).map((logDose) => {
        const dose = Math.pow(10, logDose);
        return { x: logDose, y: clamp(response(dose, 55, 1, 1), 0, 110) };
      })
    },
    {
      id: "competitive",
      label: "+ Competitive antag (rightshift)",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(-2, 3, 0.05).map((logDose) => {
        const dose = Math.pow(10, logDose);
        return { x: logDose, y: clamp(response(dose, 100, 3, 1), 0, 110) };
      })
    },
    {
      id: "nonCompetitive",
      label: "+ Non-competitive antag (↓Emax)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(-2, 3, 0.05).map((logDose) => {
        const dose = Math.pow(10, logDose);
        return { x: logDose, y: clamp(response(dose, 50, 1, 1), 0, 110) };
      })
    }
  ],
  buildAnnotations: (values) => {
    const apparentEc50 = values.ec50 * (1 + values.compAntagonist / 25);
    const emax = 100 * (1 - values.nonCompAntagonist / 100);
    return [
      { x: 0, y: emax / 2, label: "EC50 (current)" },
      { x: 2.8, y: emax, label: `Emax ${emax.toFixed(0)}%` }
    ];
  },
  summarize: (values) => {
    const apparentEc50 = values.ec50 * (1 + values.compAntagonist / 25);
    const emax = 100 * (1 - values.nonCompAntagonist / 100);
    const shift = Math.log10(apparentEc50 / values.ec50);
    return {
      state:
        values.nonCompAntagonist > 50
          ? "Non-competitive block — Emax depressed"
          : values.compAntagonist > 70
            ? "Heavy competitive antagonism — large rightshift"
            : values.hill > 2.5
              ? "Cooperativity dominant — switch-like response"
              : values.hill < 0.8
                ? "Negative cooperativity / heterogeneous receptors"
                : "Sigmoid agonist response",
      body: "Hill equation: Response = Emax · [D]^n / (EC50^n + [D]^n). Competitive antagonists shift the curve RIGHTWARD (apparent EC50 ↑, Emax preserved). Non-competitive antagonists DROP Emax (the ceiling). Partial agonists have lower intrinsic activity — can act as functional antagonists in the presence of a full agonist.",
      readouts: [
        { label: "EC50 (true)", value: `${values.ec50.toFixed(2)}×` },
        { label: "EC50 (apparent)", value: `${apparentEc50.toFixed(2)}×` },
        { label: "Shift", value: `${shift.toFixed(2)} log` },
        { label: "Emax", value: `${emax.toFixed(0)}%` },
        { label: "Hill n", value: values.hill.toFixed(1) },
        { label: "Comp block", value: `${values.compAntagonist.toFixed(0)}%` }
      ],
      warning:
        values.nonCompAntagonist > 80
          ? "Edge state: > 80% non-competitive block — even saturating agonist cannot overcome (unlike competitive)."
          : values.hill > 3 && values.hill < 4
            ? "Edge state: very steep cooperativity (n > 3) — therapeutic window narrows toward all-or-none."
            : undefined
    };
  }
};

export default function HormoneDoseResponseWidget() {
  return <CurveLabWidget config={config} />;
}
