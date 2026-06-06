"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Bile flow regulation.
 *   Hepatocytes secrete bile continuously into canaliculi → bile ducts.
 *   Between meals: sphincter of Oddi is closed; bile diverts into the
 *     gallbladder where it concentrates 5–20×.
 *   After a fatty meal: I-cells in the duodenum release CCK in response
 *     to long-chain fatty acids and amino acids. CCK → gallbladder
 *     contraction + sphincter of Oddi relaxation → bile flows into
 *     the duodenum and emulsifies fat for pancreatic lipase.
 *
 * Bile acids are also reabsorbed in the terminal ileum and return to the
 * liver via the portal vein (enterohepatic circulation) — recycled ~6x per
 * day. Loss of terminal ileum (Crohn's, resection) → bile acid diarrhoea +
 * impaired fat absorption.
 */
const config: FeedbackLabConfig = {
  diagramId: "gi/bile-flow",
  loop: {
    guideSteps: [
      { title: "1 Detect meal", verb: "duodenal I-cells sense fat and amino acids" },
      { title: "2 Empty bile", verb: "CCK contracts gallbladder and relaxes Oddi" },
      { title: "3 Recycle pool", verb: "terminal ileum returns bile acids to liver" }
    ],
    guideSummary: "CCK controls post-meal delivery; enterohepatic recycling controls the bile-acid pool size.",
    feedbackKind: "stimulate",
    feedbackStepTitle: "4 Recycle",
    nodeRoles: ["I-cell", "Gallbladder", "Ileum/liver"],
    forwardHeader: "CCK → BILE DELIVERY",
    feedbackHeader: "ENTEROHEPATIC RETURN",
    forwardLabels: ["CCK", "bile delivery"],
    feedbackLabel: "ileal return",
    feedbackGuideTitle: "Enterohepatic recycling",
    feedbackVerbActive: "ileal bile-acid return preserves the hepatic bile pool",
    feedbackVerbInactive: "bile acids are lost; hepatic synthesis cannot fully compensate",
    feedbackStatusActive: "Recycling intact",
    feedbackStatusInactive: "Pool depleted",
    feedbackOffLabel: "recycling OFF",
    legendForward: "CCK drives gallbladder/Oddi coordination",
    legendFeedback: "ileal bile-acid return restores the pool"
  },
  controls: [
    { key: "fattyMeal", label: "Fatty meal stimulus (CCK drive)", min: 0, max: 200, step: 1, defaultValue: 30, unit: "%" },
    { key: "sphincterTone", label: "Sphincter of Oddi tone", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" },
    { key: "ileumLoss", label: "Terminal ileum loss (Crohn's / resection)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Enterohepatic recycling intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // CCK release scales with luminal fat / protein stimulus.
    const cck = clamp(values.fattyMeal * 0.9 + 5, 5, 220);
    // Hepatic bile synthesis up-regulates when enterohepatic return is lost.
    const ileumReturn = toggles.feedback ? clamp(100 - values.ileumLoss, 0, 100) : 0;
    const hepaticSynthesis = clamp(100 + (100 - ileumReturn) * 0.8, 100, 350);
    // Gallbladder emptying: CCK-driven, opposed by residual sphincter tone.
    const gbEmptying = clamp((cck / 200) * (1 - values.sphincterTone / 250) * 100, 0, 100);
    // Net bile flow into duodenum.
    const duodenalBile = clamp(hepaticSynthesis * 0.4 + gbEmptying * 1.5, 30, 400);

    const phenotype = (() => {
      if (values.ileumLoss > 60) return "Bile-acid diarrhoea + fat malabsorption — Crohn's / ileal resection";
      if (values.sphincterTone > 160 && cck > 100) return "Sphincter of Oddi dysfunction — pain, pancreatitis risk";
      if (values.fattyMeal < 20 && values.sphincterTone > 80) return "Fasted — bile diverted to gallbladder concentration";
      if (values.fattyMeal > 100) return "Postprandial — gallbladder emptying into duodenum";
      if (!toggles.feedback) return "Open loop — no enterohepatic recycling, hepatic synthesis up-regulated";
      return "Inter-prandial bile pool turnover";
    })();

    return {
      state: phenotype,
      body: "Bile flow has two phases. Inter-prandial: closed Oddi → gallbladder concentrates bile 5–20×. Postprandial: duodenal fat releases CCK → gallbladder contracts + Oddi relaxes → bile emulsifies fat for pancreatic lipase. Enterohepatic recirculation (terminal ileum → portal vein → liver) recycles bile acids ~6×/day. Lose the terminal ileum → bile-acid diarrhoea and fat malabsorption.",
      warning:
        values.ileumLoss > 80
          ? "Edge state: severe ileal disease — fat-soluble vitamin deficiency (A, D, E, K), oxalate kidney stones (oxalate normally bound by Ca, freed when Ca binds unabsorbed fat)."
          : values.sphincterTone > 170 && cck > 120
            ? "Edge state: high-pressure sphincter with strong CCK drive — pancreatitis risk from backflow."
            : undefined,
      nodes: [
        { label: "Duodenum · CCK release", value: `CCK ${cck.toFixed(0)} pg/mL`, active: cck > 80 },
        { label: "Gallbladder + Oddi", value: `Emptying ${gbEmptying.toFixed(0)}%`, active: gbEmptying > 30 },
        { label: "Bile delivery + ileal return", value: `${duodenalBile.toFixed(0)} mL/h`, active: duodenalBile > 200 || ileumReturn < 70 }
      ],
      readouts: [
        { label: "CCK", value: `${cck.toFixed(0)} pg/mL` },
        { label: "Hepatic synth", value: `${hepaticSynthesis.toFixed(0)}%` },
        { label: "GB emptying", value: `${gbEmptying.toFixed(0)}%` },
        { label: "Bile to duo", value: `${duodenalBile.toFixed(0)} mL/h` },
        { label: "Ileal return", value: `${ileumReturn.toFixed(0)}%` },
        { label: "Recycling/day", value: toggles.feedback ? "~6×" : "0" }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: cck > 60 || gbEmptying > 20
    };
  }
};

export default function BileFlowWidget() {
  return <FeedbackLabWidget config={config} />;
}
