"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "msk/bone-remodeling",
  loop: {
    guideSteps: [
      { title: "1 Sense strain", verb: "osteocytes detect load, disuse, and microdamage" },
      { title: "2 Couple BMU", verb: "RANKL/OPG sets osteoclast recruitment" },
      { title: "3 Rebuild matrix", verb: "osteoclast resorption is followed by osteoblast formation" }
    ],
    guideSummary: "Bone remodeling is a coupled basic multicellular unit: resorb damaged/underloaded bone, then refill with osteoid and mineral.",
    feedbackStepTitle: "4 Quench",
    nodeRoles: ["Osteocyte", "RANKL/OPG", "BMU"],
    forwardHeader: "REMODELING SIGNAL",
    feedbackHeader: "LOAD / MATRIX RETURN",
    forwardLabels: ["RANKL", "coupling"],
    feedbackLabel: "matrix restored",
    feedbackGuideTitle: "Local stop signal",
    feedbackVerbActive: "restored mineralized matrix and strain reduce the remodeling drive",
    feedbackVerbInactive: "coupling is broken; resorption and formation drift apart",
    feedbackStatusActive: "Coupled",
    feedbackStatusInactive: "Uncoupled",
    feedbackOffLabel: "uncoupled",
    legendForward: "osteocyte signal recruits BMU activity",
    legendFeedback: "restored matrix reduces local drive"
  },
  controls: [
    { key: "load", label: "Mechanical loading", min: 0, max: 200, step: 1, defaultValue: 90, unit: "%" },
    { key: "damage", label: "Microdamage signal", min: 0, max: 100, step: 1, defaultValue: 25, unit: "%" },
    { key: "pth", label: "PTH tone", min: 0, max: 200, step: 1, defaultValue: 80, unit: "%" }
  ],
  toggles: [{ key: "coupled", label: "Osteoblast coupling intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const disuse = clamp(100 - values.load, 0, 100);
    const osteocyteDrive = clamp(values.damage * 0.8 + disuse * 0.55 + Math.max(0, values.pth - 100) * 0.25, 0, 140);
    const rankl = clamp(20 + osteocyteDrive * 0.75 + values.pth * 0.16, 0, 160);
    const osteoclast = clamp(rankl * 0.72, 0, 120);
    const osteoblast = toggles.coupled ? clamp(18 + osteoclast * 0.72 + values.load * 0.12, 0, 120) : clamp(values.load * 0.2, 0, 40);
    const balance = osteoblast - osteoclast;
    return {
      state: !toggles.coupled ? "Uncoupled resorption" : balance < -25 ? "Net bone loss" : balance > 20 ? "Net formation" : "Balanced remodeling",
      body: "Osteocytes translate strain and microdamage into RANKL/OPG balance. Osteoclast resorption must be coupled to osteoblast refilling; chronic uncoupling produces fragility.",
      warning: balance < -45 ? "Edge state: resorption greatly exceeds formation, as in high-turnover osteoporosis or prolonged disuse." : undefined,
      nodes: [
        { label: "Osteocyte network", value: `Drive ${osteocyteDrive.toFixed(0)}%`, active: osteocyteDrive > 50 },
        { label: "RANKL / OPG gate", value: `RANKL ${rankl.toFixed(0)}%`, active: rankl > 70 },
        { label: "Osteoclast -> osteoblast BMU", value: `Bal ${balance.toFixed(0)}`, active: Math.abs(balance) > 20 }
      ],
      readouts: [
        { label: "Oclast", value: `${osteoclast.toFixed(0)}%` },
        { label: "Oblast", value: `${osteoblast.toFixed(0)}%` },
        { label: "Balance", value: `${balance.toFixed(0)}` },
        { label: "Load", value: `${values.load.toFixed(0)}%` }
      ],
      feedbackActive: toggles.coupled,
      forwardActive: osteocyteDrive > 35
    };
  }
};

export default function BoneRemodelingWidget() {
  return <FeedbackLabWidget config={config} />;
}
