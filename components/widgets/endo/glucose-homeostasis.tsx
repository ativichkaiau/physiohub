"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "endo/glucose-homeostasis",
  readingGuide:
    "Plasma glucose is the controlled variable, defended from both sides. After a meal, insulin pushes glucose INTO liver, muscle, and fat; during fasting, glucagon pulls it back OUT of the liver. Follow the loop from glucose sensor to hormone to tissue flux, and toggle a limb to watch glucose drift off its set point.",
  loop: {
    guideSteps: [
      { title: "1 Sense glucose", verb: "beta cells sample rising plasma glucose" },
      { title: "2 Release insulin", verb: "islets convert glucose signal into insulin output" },
      { title: "3 Store fuel", verb: "muscle/adipose uptake rises and hepatic output falls" }
    ],
    guideSummary: "Insulin closes a substrate feedback loop: when glucose falls toward target, beta-cell insulin drive falls too.",
    feedbackStepTitle: "4 Normalize",
    nodeRoles: ["Sensor", "Hormone", "Effectors"],
    forwardHeader: "INSULIN ACTION",
    feedbackHeader: "GLUCOSE RETURN",
    forwardLabels: ["insulin release", "uptake / storage"],
    feedbackLabel: "lowers glucose",
    feedbackGuideTitle: "Glucose normalization",
    feedbackVerbActive: "falling glucose reduces further insulin secretion",
    feedbackVerbInactive: "insulin output is absent; glucose remains unbuffered",
    feedbackStatusActive: "Insulin loop closed",
    feedbackStatusInactive: "Insulin absent",
    feedbackOffLabel: "insulin absent",
    legendForward: "insulin drives uptake and storage",
    legendFeedback: "lower glucose reduces beta-cell drive"
  },
  controls: [
    { key: "meal", label: "Meal glucose load", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%" },
    { key: "sensitivity", label: "Insulin sensitivity", min: 20, max: 120, step: 1, defaultValue: 80, unit: "%" }
  ],
  toggles: [{ key: "insulin", label: "Insulin secretion intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const glucose = clamp(82 + values.meal * 1.1 - (toggles.insulin ? values.sensitivity * 0.42 : 0), 55, 260);
    const insulin = toggles.insulin ? clamp((glucose - 75) * 0.75, 0, 110) : 0;
    const hepaticOutput = clamp(70 - insulin * 0.45, 5, 90);
    const muscleUptake = clamp(insulin * (values.sensitivity / 100), 0, 120);
    return {
      state: !toggles.insulin ? "Insulin absent" : glucose > 150 ? "Post-prandial hyperglycemia" : "Glucose buffered",
      body: "Pancreatic insulin drives muscle uptake and suppresses hepatic glucose output after a meal.",
      warning: glucose > 190 ? "Edge state: glucose remains very high despite the current controls." : undefined,
      nodes: [
        { label: "Plasma glucose + beta cell", value: `Glucose ${glucose.toFixed(0)}`, active: glucose > 120 || glucose < 70 },
        { label: "Pancreatic insulin", value: `Insulin ${insulin.toFixed(0)}%`, active: insulin > 35 },
        { label: "Liver + muscle + adipose", value: `Uptake ${muscleUptake.toFixed(0)}%`, active: muscleUptake > 45 || hepaticOutput > 55 }
      ],
      readouts: [
        { label: "Glucose", value: `${glucose.toFixed(0)}` },
        { label: "Insulin", value: `${insulin.toFixed(0)}%` },
        { label: "Uptake", value: `${muscleUptake.toFixed(0)}%` },
        { label: "Liver", value: `${hepaticOutput.toFixed(0)}%` }
      ],
      feedbackActive: toggles.insulin,
      forwardActive: values.meal > 15
    };
  }
};

export default function GlucoseHomeostasisWidget() {
  return <FeedbackLabWidget config={config} />;
}
