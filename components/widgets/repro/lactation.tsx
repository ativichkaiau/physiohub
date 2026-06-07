"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "repro/lactation",
  loop: {
    guideSteps: [
      { title: "1 Suckling", verb: "nipple mechanoreceptors send afferents to hypothalamus" },
      { title: "2 Hormone pulse", verb: "oxytocin drives letdown; prolactin supports production" },
      { title: "3 Empty alveoli", verb: "myoepithelial contraction transfers milk" }
    ],
    guideSummary: "Lactation is a positive feedback loop: effective milk removal sustains suckling and reinforces oxytocin/prolactin pulses.",
    feedbackKind: "stimulate",
    feedbackStepTitle: "4 Reinforce",
    nodeRoles: ["Afferent", "Pituitary", "Breast"],
    forwardHeader: "OXYTOCIN / PROLACTIN",
    feedbackHeader: "SUCKLING RETURN",
    forwardLabels: ["hypothalamic", "milk ejection"],
    feedbackLabel: "more suckling",
    feedbackGuideTitle: "Positive feedback",
    feedbackVerbActive: "milk removal sustains nipple afferents and hormone release",
    feedbackVerbInactive: "poor latch or interrupted suckling lets hormone pulses fade",
    feedbackStatusActive: "Reinforced",
    feedbackStatusInactive: "Return absent",
    feedbackOffLabel: "return absent",
    legendForward: "oxytocin and prolactin drive breast response",
    legendFeedback: "milk transfer sustains suckling input"
  },
  controls: [
    { key: "suckling", label: "Suckling stimulus", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%" },
    { key: "latch", label: "Latch / milk removal", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%" },
    { key: "prolactin", label: "Prolactin support", min: 20, max: 140, step: 1, defaultValue: 95, unit: "%" }
  ],
  toggles: [{ key: "reflex", label: "Neuroendocrine reflex intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const afferent = toggles.reflex ? clamp(values.suckling * values.latch / 80, 0, 130) : 0;
    const oxytocin = clamp(afferent * 0.9, 0, 120);
    const production = clamp(values.prolactin * 0.55 + afferent * 0.25, 0, 130);
    const transfer = clamp(oxytocin * 0.62 + values.latch * 0.35, 0, 120);
    return {
      state: !toggles.reflex ? "Reflex interrupted" : transfer > 75 ? "Effective letdown" : values.latch < 35 ? "Poor milk removal" : "Building lactation signal",
      body: "Oxytocin contracts myoepithelial cells for milk ejection; prolactin supports milk synthesis. Emptying the breast is the key reinforcement signal.",
      warning: values.latch < 25 && values.prolactin > 80 ? "Edge state: hormone support is present but poor milk removal can still downshift supply." : undefined,
      nodes: [
        { label: "Nipple mechanoreceptors", value: `Afferent ${afferent.toFixed(0)}`, active: afferent > 35 },
        { label: "Hypothalamus / pituitary", value: `Oxy ${oxytocin.toFixed(0)}`, active: oxytocin > 35 },
        { label: "Alveoli + myoepithelium", value: `Transfer ${transfer.toFixed(0)}%`, active: transfer > 45 }
      ],
      readouts: [
        { label: "Oxy", value: `${oxytocin.toFixed(0)}%` },
        { label: "Prolactin", value: `${values.prolactin.toFixed(0)}%` },
        { label: "Transfer", value: `${transfer.toFixed(0)}%` },
        { label: "Supply", value: `${production.toFixed(0)}%` }
      ],
      feedbackActive: toggles.reflex && values.latch > 20,
      forwardActive: afferent > 25
    };
  }
};

export default function LactationWidget() {
  return <FeedbackLabWidget config={config} />;
}
