"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "msk/muscle-spindle",
  readingGuide:
    "The spindle reports muscle stretch. Lengthening fires the Ia afferent, which excites the alpha motor neuron to contract the muscle and oppose the stretch. Gamma drive pre-tightens the spindle so it stays sensitive even as the muscle shortens — follow length → spindle → alpha output, with gamma setting the gain.",
  loop: {
    guideSteps: [
      { title: "1 Stretch", verb: "intrafusal fibers increase Ia firing" },
      { title: "2 Set gain", verb: "spinal cord integrates Ia input and gamma bias" },
      { title: "3 Contract", verb: "alpha motor neurons shorten extrafusal muscle" }
    ],
    guideSummary: "The spindle loop resists stretch; gamma motor neurons preload intrafusal fibers so the sensor stays sensitive during contraction.",
    feedbackStepTitle: "4 Shorten",
    nodeRoles: ["Spindle", "Cord", "Alpha MN"],
    forwardHeader: "Ia AFFERENT → ALPHA",
    feedbackHeader: "LENGTH ERROR RETURN",
    forwardLabels: ["Ia firing", "alpha drive"],
    feedbackLabel: "shortens muscle",
    feedbackGuideTitle: "Stretch correction",
    feedbackVerbActive: "extrafusal shortening reduces the original stretch signal",
    feedbackVerbInactive: "arc is interrupted; stretch signal cannot be corrected",
    feedbackStatusActive: "Loop closed",
    feedbackStatusInactive: "Loop open",
    feedbackOffLabel: "arc open",
    legendForward: "Ia afferent excites alpha motor output",
    legendFeedback: "muscle shortening reduces spindle stretch"
  },
  controls: [
    { key: "stretch", label: "Muscle stretch", min: 0, max: 200, step: 1, defaultValue: 70, unit: "%" },
    { key: "gamma", label: "Gamma motor gain", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" },
    { key: "descending", label: "Descending inhibition", min: 0, max: 160, step: 1, defaultValue: 70, unit: "%" }
  ],
  toggles: [{ key: "arc", label: "Ia-alpha reflex arc intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const spindle = clamp(values.stretch * 0.62 + values.gamma * 0.36, 0, 200);
    const spinalGain = clamp(1.15 - values.descending / 220, 0.25, 1.3);
    const alpha = toggles.arc ? clamp(spindle * spinalGain, 0, 180) : 0;
    const correctedLength = clamp(values.stretch - alpha * 0.34, 0, 200);
    return {
      state: !toggles.arc ? "Areflexic arc" : values.gamma > 145 ? "Gamma-biased high sensitivity" : values.descending < 30 ? "Released hyperreflexia" : "Stretch reflex tuned",
      body: "Ia afferents from muscle spindle endings monosynaptically excite alpha motor neurons. Gamma motor drive adjusts intrafusal tension and therefore sensitivity.",
      warning: values.descending < 20 && alpha > 110 ? "Edge state: low descending restraint with strong spindle drive produces brisk reflexes/clonus-like behavior." : undefined,
      nodes: [
        { label: "Muscle spindle Ia ending", value: `Ia ${spindle.toFixed(0)}`, active: spindle > 70 },
        { label: "Spinal alpha motor pool", value: `Gain ${spinalGain.toFixed(2)}x`, active: toggles.arc },
        { label: "Extrafusal muscle", value: `Length ${correctedLength.toFixed(0)}%`, active: alpha > 50 }
      ],
      readouts: [
        { label: "Ia", value: `${spindle.toFixed(0)}` },
        { label: "Alpha", value: `${alpha.toFixed(0)}` },
        { label: "Length", value: `${correctedLength.toFixed(0)}%` },
        { label: "Gamma", value: `${values.gamma.toFixed(0)}%` }
      ],
      feedbackActive: toggles.arc,
      forwardActive: spindle > 50 && toggles.arc
    };
  }
};

export default function MuscleSpindleWidget() {
  return <FeedbackLabWidget config={config} />;
}
