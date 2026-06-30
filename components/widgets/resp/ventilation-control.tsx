"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "resp/ventilation-control",
  readingGuide:
    "Minute ventilation is the output, set by chemoreceptors. Rising CO2 (plus falling O2 and falling pH) drives central and peripheral receptors to INCREASE ventilation, which blows off CO2 and pulls the drive back down — negative feedback. CO2 is the dominant minute-to-minute stimulus; trace it to ventilation and back.",
  loop: {
    guideSteps: [
      { title: "1 Sense gases", verb: "central and carotid chemoreceptors read CO2/H+, O2" },
      { title: "2 Set drive", verb: "brainstem respiratory centers integrate chemical drive" },
      { title: "3 Ventilate", verb: "respiratory muscles change VA and PaCO2" }
    ],
    guideSummary: "Chemoreflex control is a gas-homeostasis loop: ventilation changes PaCO2/O2, which changes chemoreceptor drive.",
    feedbackStepTitle: "4 Correct gases",
    nodeRoles: ["Chemistry", "Brainstem", "Pump"],
    forwardHeader: "CHEMOREFLEX DRIVE",
    feedbackHeader: "GAS CORRECTION",
    forwardLabels: ["afferent drive", "motor drive"],
    feedbackLabel: "corrects gases",
    feedbackGuideTitle: "PaCO2/O2 correction",
    feedbackVerbActive: "changed ventilation feeds back by correcting PaCO2 and O2",
    feedbackVerbInactive: "chemical sensing is disabled; ventilation no longer tracks gases",
    feedbackStatusActive: "Chemoreflex closed",
    feedbackStatusInactive: "Chemoreflex open",
    feedbackOffLabel: "chemo open",
    legendForward: "chemoreceptors drive respiratory muscles",
    legendFeedback: "corrected gases reduce chemoreceptor drive"
  },
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
    // PaCO2 = 40 × (CO2 production / ventilation), each normalised to baseline
    // (metabolic 100 %, VE ≈ 8.2 L/min) so a normal state predicts ~40 mmHg.
    // (Dividing VE by 6 made the normal default predict ~29 — spurious hypocapnia.)
    const predictedPaco2 = clamp((40 * (values.metabolicRate / 100)) / Math.max(minuteVentilation / 8.2, 0.3), 18, 90);
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
