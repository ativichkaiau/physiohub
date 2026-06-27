"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "gi/gastric-acid",
  readingGuide:
    "Parietal-cell acid is the output, driven by three stimulators (vagus/ACh, gastrin, histamine) and reined in by two brakes (somatostatin and low luminal pH). Trace the drivers down to the proton pump, then the negative feedback up — acid itself triggers somatostatin, which shuts secretion off.",
  loop: {
    guideSteps: [
      { title: "1 Stimulate", verb: "meal and vagus activate G cells" },
      { title: "2 Amplify", verb: "gastrin recruits ECL histamine" },
      { title: "3 Secrete acid", verb: "parietal H/K ATPase raises luminal H+" }
    ],
    guideSummary: "Gastrin and histamine amplify acid output; low pH activates D-cell somatostatin as the brake.",
    feedbackStepTitle: "4 Suppress",
    nodeRoles: ["G cell/vagus", "ECL", "Parietal"],
    forwardHeader: "GASTRIN → HISTAMINE",
    feedbackHeader: "SOMATOSTATIN BRAKE",
    forwardLabels: ["gastrin", "histamine"],
    feedbackLabel: "SST brake",
    feedbackGuideTitle: "D-cell somatostatin brake",
    feedbackVerbActive: "low luminal pH suppresses gastrin and acid drive",
    feedbackVerbInactive: "low-pH somatostatin brake is removed",
    feedbackStatusActive: "Acid brake on",
    feedbackStatusInactive: "Brake off",
    feedbackOffLabel: "SST OFF",
    legendForward: "gastrin/histamine stimulate parietal acid",
    legendFeedback: "somatostatin suppresses upstream drive"
  },
  controls: [
    { key: "meal", label: "Meal stimulation", min: 0, max: 100, step: 1, defaultValue: 45, unit: "%" },
    { key: "ph", label: "Luminal pH", min: 1, max: 6, step: 0.1, defaultValue: 3 }
  ],
  toggles: [{ key: "feedback", label: "Somatostatin feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const gastrin = clamp(12 + values.meal * 0.62 - (toggles.feedback && values.ph < 2 ? 28 : 0), 2, 90);
    const histamine = clamp(10 + gastrin * 0.55, 2, 70);
    const acid = clamp(8 + values.meal * 0.35 + gastrin * 0.55 + histamine * 0.35, 2, 120);
    const somatostatin = toggles.feedback ? clamp((2.6 - values.ph) * 28, 0, 80) : 0;
    return {
      state: values.meal > 65 ? "Fed phase" : values.ph < 2 ? "Acid brake" : "Basal secretion",
      body: "Vagal, gastrin, and histamine drive parietal cell acid output. Low luminal pH recruits somatostatin as the brake.",
      warning: !toggles.feedback && acid > 85 ? "Edge state: feedback is disabled while acid drive is high." : undefined,
      nodes: [
        { label: "G cell / vagus", value: `Gastrin ${gastrin.toFixed(0)}%`, active: gastrin > 45 },
        { label: "ECL cell", value: `Histamine ${histamine.toFixed(0)}%`, active: histamine > 35 },
        { label: "Parietal cell", value: `Acid ${acid.toFixed(0)}%`, active: acid > 65 }
      ],
      readouts: [
        { label: "Acid", value: `${acid.toFixed(0)}%` },
        { label: "Gastrin", value: `${gastrin.toFixed(0)}%` },
        { label: "SST", value: `${somatostatin.toFixed(0)}%` },
        { label: "pH", value: values.ph.toFixed(1) }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: values.meal > 25
    };
  }
};

export default function GastricAcidWidget() {
  return <FeedbackLabWidget config={config} />;
}
