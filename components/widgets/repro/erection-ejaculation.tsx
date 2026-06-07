"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "repro/erection-ejaculation",
  loop: {
    guideSteps: [
      { title: "1 Arousal", verb: "cortical and tactile afferents enter spinal centers" },
      { title: "2 Autonomic switch", verb: "parasympathetic NO/cGMP supports erection; sympathetic drive mediates emission" },
      { title: "3 Tissue output", verb: "vascular filling, emission, and pudendal expulsion are coordinated" }
    ],
    guideSummary: "Separate erection from ejaculation: parasympathetic NO/cGMP fills erectile tissue; sympathetic and somatic outputs coordinate emission and expulsion.",
    feedbackStepTitle: "4 Detumesce",
    nodeRoles: ["Afferents", "S2-S4/T11-L2", "Effectors"],
    forwardHeader: "PSNS → NO/cGMP",
    feedbackHeader: "SNS / PDE GATE",
    forwardLabels: ["pelvic NO", "vascular fill"],
    feedbackLabel: "detumescence",
    feedbackGuideTitle: "Sympathetic detumescence gate",
    feedbackVerbActive: "sympathetic tone and PDE activity close the erection response after emission",
    feedbackVerbInactive: "detumescence gate is weak; filling response persists",
    feedbackStatusActive: "Gate active",
    feedbackStatusInactive: "Gate relaxed",
    feedbackOffLabel: "gate relaxed",
    legendForward: "parasympathetic NO/cGMP supports erection",
    legendFeedback: "sympathetic/PDE tone closes filling response"
  },
  controls: [
    { key: "arousal", label: "Arousal / tactile drive", min: 0, max: 100, step: 1, defaultValue: 55, unit: "%" },
    { key: "sns", label: "Sympathetic emission drive", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%" },
    { key: "pde", label: "PDE5 activity", min: 0, max: 140, step: 1, defaultValue: 90, unit: "%" }
  ],
  toggles: [{ key: "spinal", label: "Spinal autonomic reflexes intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const parasymp = toggles.spinal ? clamp(values.arousal * 1.05 - values.sns * 0.28, 0, 120) : 0;
    const cgmp = clamp(parasymp * (140 - values.pde) / 90, 0, 130);
    const erection = clamp(cgmp * 0.75 + values.arousal * 0.25, 0, 120);
    const emission = toggles.spinal ? clamp(values.sns * 1.05 + Math.max(0, values.arousal - 70) * 0.45, 0, 120) : 0;
    const expulsion = clamp(emission * 0.72, 0, 110);
    return {
      state: !toggles.spinal ? "Spinal reflex interrupted" : emission > 75 ? "Emission/ejaculation phase" : erection > 65 ? "Erection phase" : "Low filling response",
      body: "Erection is parasympathetic (S2-S4) through NO/cGMP and cavernosal smooth muscle relaxation. Ejaculation requires sympathetic emission plus somatic pudendal expulsion.",
      warning: values.sns > 80 && erection < 35 ? "Edge state: high sympathetic tone suppresses erection while promoting emission physiology." : undefined,
      nodes: [
        { label: "Cortical + tactile afferents", value: `Drive ${values.arousal.toFixed(0)}%`, active: values.arousal > 45 },
        { label: "Spinal autonomic centers", value: `PSNS ${parasymp.toFixed(0)} / SNS ${values.sns.toFixed(0)}`, active: toggles.spinal },
        { label: "Corpora + ducts + pelvic floor", value: emission > 75 ? "emission" : `fill ${erection.toFixed(0)}%`, active: erection > 45 || emission > 60 }
      ],
      readouts: [
        { label: "cGMP", value: `${cgmp.toFixed(0)}%` },
        { label: "Erection", value: `${erection.toFixed(0)}%` },
        { label: "Emission", value: `${emission.toFixed(0)}%` },
        { label: "Expulsion", value: `${expulsion.toFixed(0)}%` }
      ],
      feedbackActive: values.sns > 35 || values.pde > 95,
      forwardActive: toggles.spinal && values.arousal > 25
    };
  }
};

export default function ErectionEjaculationWidget() {
  return <FeedbackLabWidget config={config} />;
}
