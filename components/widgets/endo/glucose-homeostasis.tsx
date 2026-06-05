"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "endo/glucose-homeostasis",
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
        { label: "Pancreatic beta cell", value: `Insulin ${insulin.toFixed(0)}%`, active: insulin > 35 },
        { label: "Liver", value: `Output ${hepaticOutput.toFixed(0)}%`, active: hepaticOutput > 55 },
        { label: "Muscle and adipose", value: `Uptake ${muscleUptake.toFixed(0)}%`, active: muscleUptake > 45 }
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
