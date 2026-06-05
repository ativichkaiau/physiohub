"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Local blood flow autoregulation. Two arms keep tissue perfusion constant
 * across a wide range of perfusion pressures:
 *   - Myogenic: arteriolar smooth muscle contracts when stretched → tone ↑
 *     when perfusion pressure ↑, holding flow constant.
 *   - Metabolic: tissue O₂ demand / metabolite accumulation dilates the
 *     arteriole → tone ↓ when demand ↑, increasing flow to match.
 * Together they hold tissue flow on a flat plateau roughly 60–160 mmHg
 * (autoregulatory range). Outside the plateau, flow becomes pressure-passive.
 */
const config: FeedbackLabConfig = {
  diagramId: "cv/microcirculation-autoregulation",
  controls: [
    { key: "pressure", label: "Perfusion pressure", min: 30, max: 200, step: 1, defaultValue: 90, unit: "mmHg" },
    { key: "demand", label: "Tissue O₂ demand", min: 20, max: 200, step: 1, defaultValue: 80, unit: "% of resting" }
  ],
  toggles: [{ key: "autoreg", label: "Autoregulation intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const inRange = values.pressure >= 60 && values.pressure <= 160;
    const myogenic = toggles.autoreg && inRange ? (values.pressure - 90) * 0.45 : 0;
    const metabolic = toggles.autoreg ? -(values.demand - 80) * 0.35 : 0;
    const baseTone = 50;
    const tone = clamp(baseTone + myogenic + metabolic, 0, 100);
    // Flow falls as tone rises (resistance ∝ 1 + tone/50). Without autoreg,
    // flow is pressure-passive: Q ∝ P.
    const resistance = 1 + tone / 50;
    const passiveFlow = (values.pressure / 90) * 100;
    const regulatedFlow = (values.pressure / 90 / resistance) * 150;
    const flow = toggles.autoreg ? clamp(regulatedFlow * (values.demand / 80), 0, 280) : passiveFlow;

    return {
      state: !toggles.autoreg
        ? "Loop opened — pressure-passive"
        : !inRange
          ? values.pressure < 60
            ? "Below autoregulatory range — hypoperfusion"
            : "Above autoregulatory range — hyperperfusion"
          : values.demand > 130
            ? "Metabolic dilation dominant"
            : values.pressure > 110
              ? "Myogenic constriction dominant"
              : "Flow held on plateau",
      body: "Two arms compete to hold tissue flow constant: myogenic (stretch → constriction) and metabolic (demand / metabolite buildup → dilation). The plateau holds across ~60–160 mmHg perfusion pressure.",
      warning: !toggles.autoreg
        ? "Edge state: autoregulation disabled — flow is pressure-passive. Tissue ischaemia or hyperaemia follows perfusion pressure directly."
        : !inRange
          ? "Edge state: perfusion pressure is outside the autoregulatory range — flow becomes pressure-passive."
          : undefined,
      nodes: [
        { label: "Tissue O₂ / metabolites", value: `Demand ${values.demand.toFixed(0)}%`, active: values.demand > 110 || values.demand < 50 },
        { label: "Arteriolar smooth muscle", value: `Tone ${tone.toFixed(0)}%`, active: toggles.autoreg && (Math.abs(myogenic) > 8 || Math.abs(metabolic) > 8) },
        { label: "Capillary bed", value: `Flow ${flow.toFixed(0)}%`, active: Math.abs(flow - 100) > 25 }
      ],
      readouts: [
        { label: "Pressure", value: `${values.pressure.toFixed(0)} mmHg` },
        { label: "Tone", value: `${tone.toFixed(0)}%` },
        { label: "Flow", value: `${flow.toFixed(0)}%` },
        { label: "Demand", value: `${values.demand.toFixed(0)}%` }
      ],
      feedbackActive: toggles.autoreg,
      forwardActive: Math.abs(values.pressure - 90) > 18 || Math.abs(values.demand - 80) > 25
    };
  }
};

export default function MicrocirculationAutoregulationWidget() {
  return <FeedbackLabWidget config={config} />;
}
