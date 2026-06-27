"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Cystometrogram (CMG): intravesical pressure as a function of volume.
 *   Phase I (filling, ≤ ~150 mL): pressure barely rises. The bladder accommodates
 *     via receptive relaxation — viscoelastic detrusor with low resting tone.
 *   Phase II (mid-filling, 150–400 mL): pressure rises slowly. First sensation
 *     of fullness around 150 mL. Normal desire to void ~300–400 mL.
 *   Phase III (capacity reached): pressure rises sharply as detrusor stretches
 *     past compliance limit.
 *   Phase IV (voiding): coordinated detrusor contraction + sphincter relaxation.
 *
 * Compliance C = ΔV / ΔP. Normal > 30 mL/cm H₂O. Stiff bladder (radiation,
 * neurogenic, chronic outlet obstruction): low C, dangerous pressures at low
 * volume → upper tract damage.
 */
function bladderPressure(volume: number, compliance: number, capacity: number, dsd: number) {
  // Base curve — exponential rise toward capacity.
  const normalised = Math.max(0, volume) / Math.max(50, capacity);
  const linearPart = (volume / Math.max(20, compliance)) * 0.6;
  const exponentialPart = 70 * Math.pow(normalised, 4);
  // Detrusor over-activity / dyssynergia adds spiky tone.
  const dsdRise = (dsd / 100) * Math.max(0, volume - 100) * 0.04;
  return clamp(linearPart + exponentialPart + dsdRise + 4, 0, 130);
}

const config: CurveLabConfig = {
  diagramId: "renal/bladder-pressure-volume",
  title: "Cystometrogram — bladder pressure vs volume",
  xDomain: [0, 800],
  yDomain: [0, 120],
  xLabel: "Bladder volume (mL)",
  yLabel: "Intravesical pressure (cm H₂O)",
  readingGuide:
    "Follow filling left-to-right: pressure stays low and flat over a wide volume range thanks to receptive relaxation (compliance) — the bladder accommodates without rising pressure. The steep rise at the end is the limit; a stiff, low-compliance bladder rises early and threatens back-pressure on the kidneys.",
  bands: [
    { axis: "y", from: 0, to: 30, tone: "ok", label: "safe storage" },
    { axis: "y", from: 30, to: 40, tone: "warn" },
    { axis: "y", from: 40, to: 120, tone: "danger", label: "upper-tract risk" }
  ],
  controls: [
    { key: "volume", label: "Volume marker", min: 0, max: 800, step: 5, defaultValue: 300, unit: "mL" },
    { key: "compliance", label: "Detrusor compliance", min: 5, max: 80, step: 1, defaultValue: 40, unit: "mL/cm H₂O" },
    { key: "capacity", label: "Functional capacity", min: 100, max: 800, step: 5, defaultValue: 500, unit: "mL" },
    { key: "dsd", label: "Detrusor over-activity / DSD", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0, 800, 5).map((x) => ({
        x,
        y: bladderPressure(x, values.compliance, values.capacity, values.dsd)
      }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Healthy adult (C=40, cap=500)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 800, 5).map((x) => ({ x, y: bladderPressure(x, 40, 500, 0) }))
    },
    {
      id: "neurogenic",
      label: "Neurogenic / stiff (C=10)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(0, 800, 5).map((x) => ({ x, y: bladderPressure(x, 10, 350, 0) }))
    },
    {
      id: "oab",
      label: "Overactive bladder (DSD=60, cap=300)",
      colorVar: "var(--ph-curve-7)",
      dashed: true,
      data: makeRange(0, 800, 5).map((x) => ({ x, y: bladderPressure(x, 25, 300, 60) }))
    }
  ],
  buildAnnotations: (values) => [
    {
      x: values.volume,
      y: bladderPressure(values.volume, values.compliance, values.capacity, values.dsd),
      label: "operating point"
    },
    { x: 150, y: 8, label: "first sensation" },
    { x: values.capacity, y: bladderPressure(values.capacity, values.compliance, values.capacity, values.dsd), label: "capacity" }
  ],
  getCursorX: (values) => values.volume,
  summarize: (values) => {
    const p = bladderPressure(values.volume, values.compliance, values.capacity, values.dsd);
    const safe = p < 40;
    return {
      state:
        values.compliance < 15 && p > 40
          ? "Low-compliance bladder — upper tract at risk"
          : values.dsd > 50
            ? "Detrusor overactivity — urgency, frequency, incontinence"
            : values.capacity < 200
              ? "Reduced functional capacity — small contracted bladder (chronic infection, radiation)"
              : values.volume > values.capacity
                ? "Above functional capacity — strong urgency, leakage risk"
                : values.volume < 100
                  ? "Phase I accommodation — receptive relaxation"
                  : "Normal filling phase",
      body: "Healthy bladder fills at very low pressure (compliance > 30 mL/cm H₂O) thanks to receptive relaxation. Compliance falls in chronic obstruction (BPH), radiation, neurogenic disease (spinal cord), and chronic inflammation. The key clinical number: sustained pressure > 40 cm H₂O drives vesicoureteral reflux and upper-tract injury — that's why neurogenic bladder programs aim to keep pressures below this threshold (catheterisation, anticholinergics, or augmentation cystoplasty).",
      readouts: [
        { label: "Pressure", value: `${p.toFixed(0)} cm H₂O` },
        { label: "Volume", value: `${values.volume.toFixed(0)} mL` },
        { label: "Compliance", value: `${values.compliance.toFixed(0)} mL/cm H₂O` },
        { label: "Capacity", value: `${values.capacity.toFixed(0)} mL` },
        { label: "Above 40?", value: safe ? "no" : "yes" },
        { label: "DSD", value: `${values.dsd.toFixed(0)}%` }
      ],
      warning:
        p > 40
          ? "Edge state: detrusor pressure > 40 cm H₂O — vesicoureteric reflux likely, hydronephrosis risk."
          : values.compliance < 10
            ? "Edge state: compliance < 10 mL/cm H₂O — severely stiff bladder; consider augmentation or chronic catheterisation."
            : values.dsd > 70 && p > 30
              ? "Edge state: detrusor-sphincter dyssynergia with sustained high pressure — spinal cord injury pattern, urgent urology referral."
              : undefined
    };
  }
};

export default function BladderPressureVolumeWidget() {
  return <CurveLabWidget config={config} />;
}
