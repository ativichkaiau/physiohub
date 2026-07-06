"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Strength–duration curve (Lapicque/Weiss) for an excitable membrane:
 *   threshold current  I(t) = rheobase · (1 + chronaxie / t)
 *   - RHEOBASE: the minimum current that fires the cell given an infinitely long
 *     pulse (the horizontal asymptote).
 *   - CHRONAXIE: the pulse duration needed at TWICE rheobase — an index of
 *     excitability. Short in myelinated nerve (~0.1–0.7 ms), long in denervated
 *     muscle (a diagnostic of lower-motor-neuron lesions).
 * Brief pulses need much larger currents; there is no fixed "threshold voltage"
 * independent of how long the stimulus lasts.
 */
function threshold(duration: number, rheobase: number, chronaxie: number) {
  return clamp(rheobase * (1 + chronaxie / Math.max(0.01, duration)), 0, 40);
}

const config: CurveLabConfig = {
  diagramId: "nerv/strength-duration-curve",
  title: "Strength–duration curve",
  xDomain: [0.05, 10],
  yDomain: [0, 12],
  xLabel: "Stimulus duration (ms)",
  yLabel: "Threshold current (mA)",
  readingGuide:
    "The curve is the minimum current that fires the cell at each pulse duration. Long pulses need only the RHEOBASE (the flat right-hand tail); brief pulses need far more current (the steep left rise). CHRONAXIE — the duration at twice rheobase — is the excitability yardstick: short for nerve, long for denervated muscle.",
  bands: [
    { axis: "y", from: 0, to: 12, tone: "phase", label: "fires above the line" }
  ],
  controls: [
    { key: "duration", label: "Pulse duration marker", min: 0.05, max: 10, step: 0.05, defaultValue: 0.3, unit: "ms" },
    { key: "rheobase", label: "Rheobase", min: 0.3, max: 4, step: 0.1, defaultValue: 1, unit: "mA" },
    { key: "chronaxie", label: "Chronaxie", min: 0.05, max: 3, step: 0.05, defaultValue: 0.3, unit: "ms" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Threshold",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0.05, 10, 0.05).map((t) => ({ x: t, y: threshold(t, values.rheobase, values.chronaxie) }))
    }
  ],
  buildReferenceSeries: (values) => [
    {
      id: "rheobase",
      label: "Rheobase (asymptote)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0.05, 10, 0.05).map((t) => ({ x: t, y: values.rheobase }))
    },
    {
      id: "denervated",
      label: "Denervated muscle (long chronaxie)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(0.05, 10, 0.05).map((t) => ({ x: t, y: threshold(t, values.rheobase, 2.4) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.chronaxie, y: 2 * values.rheobase, label: "chronaxie @ 2× rheobase" },
    { x: values.duration, y: threshold(values.duration, values.rheobase, values.chronaxie), label: "operating point" }
  ],
  getCursorX: (values) => values.duration,
  summarize: (values) => {
    const need = threshold(values.duration, values.rheobase, values.chronaxie);
    return {
      state:
        values.chronaxie > 1.2
          ? "Long chronaxie — low excitability (denervated / immature muscle)"
          : values.chronaxie < 0.2
            ? "Short chronaxie — highly excitable (large myelinated nerve)"
            : values.duration < 0.1
              ? "Very brief pulse — large current required"
              : "Normal excitability window",
      body: "Threshold current = rheobase·(1 + chronaxie/t). Rheobase is the long-pulse minimum; chronaxie (duration at twice rheobase) indexes excitability. Denervated muscle has a long chronaxie — the basis of the classic strength-duration test for lower-motor-neuron lesions.",
      readouts: [
        { label: "Threshold", value: `${need.toFixed(2)} mA` },
        { label: "Rheobase", value: `${values.rheobase.toFixed(1)} mA` },
        { label: "Chronaxie", value: `${values.chronaxie.toFixed(2)} ms` },
        { label: "Duration", value: `${values.duration.toFixed(2)} ms` }
      ],
      warning:
        values.duration < 0.08
          ? "Edge state: sub-0.1 ms pulses demand very high currents — accessory-tissue stimulation and charge-density limits become the safety constraint."
          : undefined
    };
  }
};

export default function StrengthDurationCurveWidget() {
  return <CurveLabWidget config={config} />;
}
