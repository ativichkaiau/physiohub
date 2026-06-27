"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

function pH(hco3: number, paco2: number) {
  return 6.1 + Math.log10(hco3 / (0.03 * paco2));
}

const config: FeedbackLabConfig = {
  diagramId: "resp/respiratory-acid-base",
  readingGuide:
    "PaCO2 sets the respiratory side of pH. More CO2 (more production or less ventilation) means acidosis, so chemoreceptors drive ventilation UP to blow it off; the kidney then slowly trims bicarbonate to compensate. Follow the loop from CO2 to pH to ventilatory drive — fast lungs, slow kidney.",
  loop: {
    guideSteps: [
      { title: "1 Disturb pH", verb: "CO2 load, ventilation, and HCO3 set Henderson-Hasselbalch" },
      { title: "2 Buffer/compensate", verb: "bicarbonate stores and kidney change the base term" },
      { title: "3 Ventilate", verb: "alveolar ventilation shifts PaCO2 and pH" }
    ],
    guideSummary: "Respiratory and renal arms compensate different sides of the same pH equation: PaCO2 and HCO3.",
    feedbackStepTitle: "4 Compensate",
    nodeRoles: ["Acid/base input", "Kidney/buffer", "Ventilation"],
    forwardHeader: "CO2 / HCO3 EFFECT",
    feedbackHeader: "RENAL COMPENSATION",
    forwardLabels: ["CO2 load", "pH response"],
    feedbackLabel: "HCO3 adjust",
    feedbackGuideTitle: "Renal bicarbonate compensation",
    feedbackVerbActive: "kidney shifts HCO3 to oppose chronic PaCO2 change",
    feedbackVerbInactive: "HCO3 is fixed; pH moves more with PaCO2",
    feedbackStatusActive: "Renal comp on",
    feedbackStatusInactive: "Renal comp off",
    feedbackOffLabel: "renal comp OFF",
    legendForward: "CO2 and HCO3 set pH",
    legendFeedback: "renal HCO3 compensation opposes pH drift"
  },
  controls: [
    { key: "co2Production", label: "CO2 production", min: 100, max: 500, step: 10, defaultValue: 200, unit: "mL/min" },
    { key: "alveolarVentilation", label: "Alveolar ventilation", min: 1.5, max: 12, step: 0.1, defaultValue: 4.2, unit: "L/min" },
    { key: "bicarbonate", label: "Bicarbonate", min: 8, max: 44, step: 1, defaultValue: 24, unit: "mEq/L" }
  ],
  toggles: [{ key: "renalComp", label: "Renal compensation present", defaultValue: true }],
  evaluate: (values, toggles) => {
    const paco2 = clamp(40 * (values.co2Production / 200) / Math.max(values.alveolarVentilation / 4.2, 0.2), 12, 100);
    // Chronic renal compensation ≈ 3.5 mEq/L of HCO3 per 10 mmHg change in
    // PaCO2 (0.35 per mmHg) — the standard for chronic respiratory acid-base.
    const compensatedHco3 = toggles.renalComp
      ? clamp(values.bicarbonate + (paco2 - 40) * 0.35, 6, 48)
      : values.bicarbonate;
    const phValue = pH(compensatedHco3, paco2);
    const drive = clamp(50 + (paco2 - 40) * 1.8 + (7.4 - phValue) * 110, 10, 160);
    return {
      state:
        phValue < 7.35
          ? paco2 > 45
            ? "Respiratory acidosis"
            : "Metabolic acidosis pattern"
          : phValue > 7.45
            ? paco2 < 35
              ? "Respiratory alkalosis"
              : "Metabolic alkalosis pattern"
            : "Compensated pH",
      body: "PaCO2 is set by CO2 production divided by alveolar ventilation. Bicarbonate buffering and renal compensation determine how far pH moves for a given CO2 load.",
      warning:
        phValue < 7.2 || phValue > 7.58
          ? "Edge state: pH is outside a typical survivable clinical range."
          : paco2 > 70
            ? "Edge state: severe hypercapnia; ventilatory failure is likely."
            : undefined,
      nodes: [
        { label: "CO2 load", value: `${values.co2Production.toFixed(0)} mL/min`, active: values.co2Production > 260 },
        { label: "Buffer / kidney", value: `HCO3 ${compensatedHco3.toFixed(0)}`, active: toggles.renalComp || values.bicarbonate !== 24 },
        { label: "Ventilation", value: `VA ${values.alveolarVentilation.toFixed(1)}`, active: Math.abs(values.alveolarVentilation - 4.2) > 1 }
      ],
      readouts: [
        { label: "pH", value: phValue.toFixed(2) },
        { label: "PaCO2", value: `${paco2.toFixed(0)}` },
        { label: "HCO3", value: `${compensatedHco3.toFixed(0)}` },
        { label: "Drive", value: `${drive.toFixed(0)}%` }
      ],
      feedbackActive: toggles.renalComp,
      forwardActive: Math.abs(paco2 - 40) > 6 || Math.abs(phValue - 7.4) > 0.04
    };
  }
};

export default function RespiratoryAcidBaseWidget() {
  return <FeedbackLabWidget config={config} />;
}
