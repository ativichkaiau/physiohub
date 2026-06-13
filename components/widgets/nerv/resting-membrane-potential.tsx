"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Resting membrane potential via the Goldman–Hodgkin–Katz (GHK) equation.
 *   Vm = (RT/F) · ln( (P_K[K]o + P_Na[Na]o) / (P_K[K]i + P_Na[Na]i) )
 * (Cl⁻ omitted — the standard teaching simplification.) RT/F ≈ 26.7 mV at 37 °C.
 *
 * The classic teaching curve is Vm vs extracellular [K⁺]: raising [K]o
 * depolarises the cell (hyperkalemia), and the resting Vm sits ABOVE E_K
 * because of the small but non-zero Na⁺ leak (P_Na/P_K ≈ 0.03–0.04).
 */
const RT_F = 26.7; // mV at 37 °C
const NA_O = 145;  // mM, fixed
const NA_I = 14;   // mM, fixed

function ghkVm(ko: number, ki: number, ratio: number) {
  const num = ko + ratio * NA_O;
  const den = ki + ratio * NA_I;
  return RT_F * Math.log(num / den);
}

function nernstK(ko: number, ki: number) {
  return RT_F * Math.log(ko / ki);
}

const config: CurveLabConfig = {
  diagramId: "nerv/resting-membrane-potential",
  title: "Resting membrane potential vs extracellular K⁺ (GHK)",
  xDomain: [0.5, 12],
  yDomain: [-110, -20],
  xLabel: "Extracellular [K⁺]ₒ (mM)",
  yLabel: "Membrane potential Vm (mV)",
  controls: [
    { key: "ko", label: "Extracellular K⁺ (cursor)", min: 0.5, max: 12, step: 0.1, defaultValue: 4, unit: "mM" },
    { key: "ratio", label: "P_Na / P_K (Na⁺ leak)", min: 0.01, max: 0.3, step: 0.005, defaultValue: 0.04, unit: "" },
    { key: "ki", label: "Intracellular K⁺", min: 100, max: 160, step: 1, defaultValue: 140, unit: "mM" }
  ],
  buildSeries: (values) => [
    {
      id: "ghk",
      label: "Resting Vm (GHK)",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0.5, 12, 0.1).map((x) => ({ x, y: clamp(ghkVm(x, values.ki, values.ratio), -110, -20) }))
    }
  ],
  buildReferenceSeries: (values) => [
    {
      id: "ek",
      label: "E_K (pure K⁺, Nernst)",
      colorVar: "var(--ph-curve-3)",
      dashed: true,
      data: makeRange(0.5, 12, 0.1).map((x) => ({ x, y: clamp(nernstK(x, values.ki), -110, -20) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.ko, y: ghkVm(values.ko, values.ki, values.ratio), label: "operating point" },
    // Normal resting Vm sits ABOVE E_K (~ −90) because of the Na+ leak — mark it
    // at the GHK value (~ −71), not at E_K.
    { x: 4, y: ghkVm(4, 140, 0.04), label: "normal rest" }
  ],
  getCursorX: (values) => values.ko,
  summarize: (values) => {
    const vm = ghkVm(values.ko, values.ki, values.ratio);
    const ek = nernstK(values.ko, values.ki);
    const leak = vm - ek; // how far above E_K the resting potential sits
    return {
      state:
        values.ko > 6.5
          ? "Severe hyperkalemia — membrane depolarised, Na channels inactivate → weakness, peaked T waves"
          : values.ko > 5.2
            ? "Hyperkalemia — partial depolarisation raises excitability then blocks it"
            : values.ko < 3
              ? "Hypokalemia — hyperpolarised, U waves, arrhythmia risk"
              : values.ratio > 0.12
                ? "High Na⁺ leak — Vm pulled well above E_K toward threshold"
                : "Normal resting potential",
      body: "The Goldman equation weights each ion by its permeability. K⁺ dominates at rest, so Vm tracks E_K — but the small Na⁺ leak (P_Na/P_K) holds Vm ~20 mV positive to E_K. Raising extracellular K⁺ collapses the K⁺ gradient and depolarises the cell: the basis of hyperkalemic cardiac toxicity and why depolarised cells eventually lose excitability (Na⁺ channel inactivation).",
      readouts: [
        { label: "Vm", value: `${vm.toFixed(0)} mV` },
        { label: "E_K", value: `${ek.toFixed(0)} mV` },
        { label: "Vm − E_K", value: `${leak.toFixed(0)} mV` },
        { label: "[K]ₒ", value: `${values.ko.toFixed(1)} mM` },
        { label: "P_Na/P_K", value: values.ratio.toFixed(3) },
        { label: "[K]ᵢ", value: `${values.ki.toFixed(0)} mM` }
      ],
      warning:
        values.ko > 7.5
          ? "Edge state: [K]ₒ > 7.5 mM — life-threatening hyperkalemia; sine-wave ECG, asystole risk. Give calcium gluconate to stabilise the membrane."
          : values.ko < 2.2
            ? "Edge state: [K]ₒ < 2.2 mM — severe hypokalemia; risk of torsades, rhabdomyolysis, paralysis."
            : undefined
    };
  }
};

export default function RestingMembranePotentialWidget() {
  return <CurveLabWidget config={config} />;
}
