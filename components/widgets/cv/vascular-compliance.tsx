"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Two-element Windkessel: arterial compliance C damps the pulse, peripheral
 * resistance R sets mean pressure and the diastolic-decay time constant τ = R·C.
 * - Systole (≈32% of cycle): smooth ejection pulse from diastolic baseline up to
 *   a peak determined by stroke volume / compliance.
 * - Diastole: pressure decays exponentially from the dicrotic notch toward the
 *   end-diastolic baseline with time constant τ.
 */
function aorticPressure(t: number, hr: number, compliance: number, resistance: number) {
  const T = 60 / hr;
  const tCycle = t % T;
  const ts = 0.32 * T;
  const meanP = 70 + (resistance - 1) * 35;     // MAP rises with R
  const pulse = clamp(48 / compliance, 18, 90); // pulse pressure inverse to C
  const peakP = meanP + pulse / 2;
  const endDiastolicP = meanP - pulse / 2;
  const tau = resistance * compliance * 0.6;    // s — physiologic τ ≈ 1.5 s at normal R·C

  if (tCycle < ts) {
    // Systolic half-sine ejection from endDiastolicP up to peakP and back to notch
    const x = tCycle / ts;
    return endDiastolicP + (peakP - endDiastolicP) * Math.sin(Math.PI * x);
  }
  const td = tCycle - ts;
  const notchP = endDiastolicP + (peakP - endDiastolicP) * 0.92;
  return endDiastolicP + (notchP - endDiastolicP) * Math.exp(-td / tau);
}

const config: CurveLabConfig = {
  diagramId: "cv/vascular-compliance",
  title: "Arterial pressure waveform — Windkessel model",
  xDomain: [0, 2],
  yDomain: [30, 180],
  xLabel: "time (s)",
  yLabel: "Arterial pressure (mmHg)",
  controls: [
    { key: "compliance", label: "Arterial compliance", min: 0.4, max: 3, step: 0.05, defaultValue: 1.5, unit: "× normal" },
    { key: "resistance", label: "Peripheral resistance", min: 0.6, max: 2.2, step: 0.05, defaultValue: 1, unit: "× normal" },
    { key: "hr", label: "Heart rate", min: 50, max: 130, step: 1, defaultValue: 72, unit: "bpm" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 2, 0.01).map((t) => ({
        x: t,
        y: aorticPressure(t, values.hr, values.compliance, values.resistance)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal (C=1.5, R=1, HR=72)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 2, 0.01).map((t) => ({ x: t, y: aorticPressure(t, 72, 1.5, 1) }))
    }
  ],
  summarize: (values) => {
    const meanP = 70 + (values.resistance - 1) * 35;
    const pulse = clamp(48 / values.compliance, 18, 90);
    const tau = values.resistance * values.compliance * 0.6;
    return {
      state:
        values.compliance < 0.8
          ? "Stiff vessels — wide pulse pressure"
          : values.resistance > 1.6
            ? "High afterload — elevated MAP"
            : values.compliance > 2.2
              ? "Compliant vessels — narrow pulse"
              : "Normal Windkessel",
      body: "Compliance damps the pulse; resistance sets mean pressure and τ = R·C. Slide compliance to widen or narrow the pulse pressure; slide resistance to shift MAP and slow the diastolic decay.",
      readouts: [
        { label: "MAP", value: `${meanP.toFixed(0)} mmHg` },
        { label: "Pulse P", value: `${pulse.toFixed(0)} mmHg` },
        { label: "τ (R·C)", value: `${tau.toFixed(2)} s` },
        { label: "HR", value: `${values.hr.toFixed(0)} bpm` }
      ],
      warning:
        values.compliance < 0.55
          ? "Edge state: vessels are extremely stiff (e.g. aged aorta) — pulse pressure exceeds 80 mmHg."
          : values.resistance > 2.0
            ? "Edge state: very high systemic vascular resistance — MAP > 130 mmHg."
            : undefined
    };
  }
};

export default function VascularComplianceWidget() {
  return <CurveLabWidget config={config} />;
}
