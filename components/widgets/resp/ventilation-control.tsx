"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "resp/ventilation-control",
  controls: [
    { key: "paco2", label: "PaCO2", min: 20, max: 80, step: 1, defaultValue: 40, unit: "mmHg" },
    { key: "pao2", label: "PaO2", min: 35, max: 120, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "ph", label: "Arterial pH", min: 7.1, max: 7.6, step: 0.01, defaultValue: 7.4 },
    { key: "metabolicRate", label: "Metabolic CO2 load", min: 50, max: 200, step: 1, defaultValue: 100, unit: "%" }
  ],
  toggles: [{ key: "chemoreflex", label: "Chemoreflex intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const central = Math.max(0, values.paco2 - 40) * 2.2 + Math.max(0, 7.4 - values.ph) * 120;
    const peripheral = Math.max(0, 60 - values.pao2) * 1.8 + Math.max(0, values.paco2 - 45) * 0.6;
    const load = (values.metabolicRate - 100) * 0.25;
    const drive = toggles.chemoreflex ? clamp(35 + central + peripheral + load, 10, 180) : 35 + load;
    const minuteVentilation = clamp(5 + drive / 11, 2, 22);
    const predictedPaco2 = clamp((40 * values.metabolicRate) / Math.max(minuteVentilation / 6, 0.4) / 100, 18, 90);
    return {
      state: !toggles.chemoreflex
        ? "Open loop"
        : values.paco2 > 55
          ? "Hypercapnic drive"
          : values.pao2 < 60
            ? "Hypoxic peripheral drive"
            : values.ph < 7.32
              ? "Acidemic drive"
              : "Stable chemical control",
      body: "Central chemoreceptors dominate CO2/H+ sensing, while carotid bodies become much more important when PaO2 falls below about 60 mmHg.",
      warning: !toggles.chemoreflex
        ? "Edge state: chemical feedback is disabled; ventilation no longer corrects PaCO2."
        : values.pao2 < 45 || values.paco2 > 70
          ? "Edge state: severe hypoxemia or hypercapnia produces a high ventilatory drive."
          : undefined,
      nodes: [
        { label: "Arterial gases", value: `CO2 ${values.paco2.toFixed(0)} / O2 ${values.pao2.toFixed(0)}`, active: values.paco2 > 45 || values.pao2 < 60 },
        { label: "Chemoreceptors", value: `Drive ${drive.toFixed(0)}%`, active: toggles.chemoreflex && drive > 55 },
        { label: "Ventilatory pump", value: `${minuteVentilation.toFixed(1)} L/min`, active: minuteVentilation > 8 || minuteVentilation < 4 }
      ],
      readouts: [
        { label: "Drive", value: `${drive.toFixed(0)}%` },
        { label: "VE", value: `${minuteVentilation.toFixed(1)} L/min` },
        { label: "Pred CO2", value: `${predictedPaco2.toFixed(0)}` },
        { label: "Load", value: `${values.metabolicRate.toFixed(0)}%` }
      ],
      feedbackActive: toggles.chemoreflex,
      forwardActive: Math.abs(values.paco2 - 40) > 5 || values.pao2 < 70 || values.ph < 7.35
    };
  }
};

export default function VentilationControlWidget() {
  return <FeedbackLabWidget config={config} />;
}
