"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Hypoxic pulmonary vasoconstriction (HPV) — unique to the lung: alveolar
 * hypoxia constricts the LOCAL pulmonary arteriole (opposite of the systemic
 * circulation). Below ~ alveolar PO2 70 mmHg, pulmonary vascular resistance
 * rises steeply.
 *   - LOCAL hypoxia (pneumonia, mucus plug): diverts blood from poorly
 *     ventilated alveoli → improves V/Q matching.
 *   - GLOBAL hypoxia (altitude, COPD, hypoventilation): whole-lung constriction
 *     → pulmonary hypertension → RV pressure overload → cor pulmonale.
 * Acidosis potentiates HPV; alkalosis, O2, CCBs, and inhaled NO blunt it.
 */
function pvr(paO2: number, acidosis: number, vasodilator: number) {
  // Baseline PVR = 1 (relative). Sigmoid rise as alveolar PO2 falls below ~60.
  const potentiation = 1 + acidosis / 140; // acidosis steepens/left-shifts response
  const blunt = 1 - vasodilator / 130; // O2 / CCB / iNO blunt the constriction
  const hpv = (2.8 / (1 + Math.exp((paO2 - 52) / 7))) * potentiation * Math.max(0.15, blunt);
  return clamp(1 + hpv, 0.6, 5);
}

const config: CurveLabConfig = {
  diagramId: "resp/hypoxic-pulmonary-vasoconstriction",
  title: "Hypoxic pulmonary vasoconstriction",
  xDomain: [20, 150],
  yDomain: [0, 5],
  xLabel: "Alveolar PO₂ (mmHg)",
  yLabel: "Pulmonary vascular resistance (×normal)",
  readingGuide:
    "Read alveolar oxygen right-to-left. Above ~70 mmHg the pulmonary vessels sit at rest; below it they CONSTRICT and resistance climbs steeply. Locally that shunts blood away from a sick alveolus (good for V/Q); globally it loads the right heart (altitude, COPD → pulmonary hypertension).",
  bands: [
    { axis: "x", from: 70, to: 150, tone: "ok", label: "vessels at rest" },
    { axis: "x", from: 45, to: 70, tone: "warn" },
    { axis: "x", from: 20, to: 45, tone: "danger" }
  ],
  controls: [
    { key: "paO2", label: "Alveolar PO₂ marker", min: 20, max: 150, step: 1, defaultValue: 100, unit: "mmHg" },
    { key: "acidosis", label: "Acidosis (potentiates)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" },
    { key: "vasodilator", label: "O₂ / CCB / iNO (blunts)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(20, 150, 2).map((x) => ({ x, y: pvr(x, values.acidosis, values.vasodilator) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal responsiveness",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(20, 150, 2).map((x) => ({ x, y: pvr(x, 0, 0) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.paO2, y: pvr(values.paO2, values.acidosis, values.vasodilator), label: "operating point" }
  ],
  getCursorX: (values) => values.paO2,
  summarize: (values) => {
    const resistance = pvr(values.paO2, values.acidosis, values.vasodilator);
    return {
      state:
        values.paO2 < 45
          ? "Strong HPV — marked pulmonary vasoconstriction"
          : values.paO2 < 70
            ? "Rising HPV — arteriolar tone increasing"
            : values.vasodilator > 50
              ? "HPV blunted — pharmacologic vasodilation"
              : "Vessels at rest — normal pulmonary tone",
      body: "Alveolar hypoxia constricts pulmonary arterioles (the lung is opposite to the systemic circulation). Locally it improves V/Q matching by diverting flow; globally (altitude, chronic lung disease) it drives pulmonary hypertension and right-heart strain.",
      readouts: [
        { label: "PVR", value: `${resistance.toFixed(2)}× normal` },
        { label: "Alveolar PO₂", value: `${values.paO2.toFixed(0)} mmHg` },
        { label: "Acidosis", value: `${values.acidosis.toFixed(0)}%` },
        { label: "Vasodilator", value: `${values.vasodilator.toFixed(0)}%` }
      ],
      warning:
        resistance > 3 && values.acidosis > 40
          ? "Edge state: global hypoxia + acidosis — severe pulmonary vasoconstriction; acute cor pulmonale / high-altitude pulmonary oedema risk."
          : values.paO2 < 40
            ? "Edge state: alveolar PO₂ < 40 mmHg — near-maximal HPV; sustained → fixed pulmonary hypertension and RV failure."
            : undefined
    };
  }
};

export default function HypoxicPulmonaryVasoconstrictionWidget() {
  return <CurveLabWidget config={config} />;
}
