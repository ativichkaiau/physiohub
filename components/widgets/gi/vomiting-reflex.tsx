"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Vomiting reflex. Four converging afferent streams:
 *   - Visceral / vagal afferents (gut distension, mucosal toxin) — 5-HT3
 *     from enterochromaffin cells is dominant. Block: ondansetron.
 *   - Chemoreceptor trigger zone (CTZ, area postrema) — OUTSIDE the
 *     blood-brain barrier, so it senses blood-borne toxins, opioids,
 *     chemo. Receptors: D2, 5-HT3, NK1. Block: metoclopramide (D2),
 *     ondansetron (5-HT3), aprepitant (NK1).
 *   - Vestibular nuclei — motion sickness. Receptors: H1, M.
 *     Block: meclizine, scopolamine.
 *   - Higher cortical — anticipatory nausea, fear, smell.
 *
 * All converge on the VOMITING CENTRE (nucleus tractus solitarius, dorsal
 * motor nucleus of vagus) which drives stereotyped output: reverse
 * peristalsis, retroperistalsis, glottic closure, abdominal contraction,
 * lower esophageal sphincter relaxation.
 */
const config: FeedbackLabConfig = {
  diagramId: "gi/vomiting-reflex",
  controls: [
    { key: "vagal", label: "Vagal / visceral afferent (gut)", min: 0, max: 200, step: 1, defaultValue: 20, unit: "%" },
    { key: "ctz", label: "CTZ stimulus (toxins, chemo, opioids)", min: 0, max: 200, step: 1, defaultValue: 0, unit: "%" },
    { key: "vestibular", label: "Vestibular input (motion)", min: 0, max: 200, step: 1, defaultValue: 0, unit: "%" }
  ],
  toggles: [{ key: "antiemetic", label: "Antiemetic blockade active", defaultValue: false }],
  evaluate: (values, toggles) => {
    // Antiemetic dampens net afferent drive into the centre.
    const damping = toggles.antiemetic ? 0.35 : 1;
    const drive = clamp((values.vagal + values.ctz + values.vestibular) * damping * 0.4, 0, 240);
    const centreFiring = drive;
    // Output behaviours scale with centre firing.
    const nausea = clamp(centreFiring * 0.85, 0, 200);
    const retching = clamp(centreFiring - 60, 0, 200);
    const vomiting = clamp(centreFiring - 110, 0, 200);
    const dominantAfferent = (() => {
      const max = Math.max(values.vagal, values.ctz, values.vestibular);
      if (max < 30) return "balanced / sub-threshold";
      if (max === values.vagal) return "vagal (gut)";
      if (max === values.ctz) return "CTZ (blood-borne)";
      return "vestibular (motion)";
    })();

    const phenotype = (() => {
      if (vomiting > 40) return "Active emesis — abdominal contraction + reverse peristalsis";
      if (retching > 30) return "Retching — diaphragmatic spasms, no expulsion yet";
      if (nausea > 80) return "Severe nausea — vagally mediated salivation, pallor, sweating";
      if (values.ctz > 80 && toggles.antiemetic) return "CTZ surge dampened by 5-HT3 / D2 / NK1 blockade";
      if (centreFiring < 20) return "Baseline — no active emetic drive";
      return "Sub-threshold nausea";
    })();

    return {
      state: phenotype,
      body: "Four afferent streams (vagal, CTZ, vestibular, cortical) converge on the medullary vomiting centre. Each stream has its own receptor signature, which is why antiemetic choice depends on the cause: ondansetron (5-HT3) for chemo + gut, scopolamine / meclizine (M1, H1) for motion, aprepitant (NK1) for delayed chemo-induced, metoclopramide (D2 + 5-HT3) for gastroparesis. Pregnancy-related nausea responds best to pyridoxine + doxylamine.",
      warning:
        vomiting > 100
          ? "Edge state: severe protracted vomiting — hypokalemic hypochloremic metabolic alkalosis, Mallory–Weiss tear risk, dehydration."
          : values.ctz > 150
            ? "Edge state: massive CTZ stimulus (high-dose cisplatin, uremia) — triple antiemetic regimen indicated (5-HT3 + dexamethasone + NK1)."
            : values.vestibular > 150
              ? "Edge state: vestibular dominance with cortical reinforcement — anticipatory motion sickness."
              : undefined,
      nodes: [
        { label: `Afferents (${dominantAfferent})`, value: `Drive ${(values.vagal + values.ctz + values.vestibular).toFixed(0)}`, active: values.vagal + values.ctz + values.vestibular > 80 },
        { label: "Vomiting centre (NTS / DMV)", value: `Firing ${centreFiring.toFixed(0)}`, active: centreFiring > 50 },
        { label: "Output: nausea → retching → emesis", value: vomiting > 30 ? "EMESIS" : retching > 20 ? "Retching" : nausea > 40 ? "Nausea" : "—", active: nausea > 30 }
      ],
      readouts: [
        { label: "Centre drive", value: centreFiring.toFixed(0) },
        { label: "Nausea", value: nausea.toFixed(0) },
        { label: "Retching", value: retching.toFixed(0) },
        { label: "Vomiting", value: vomiting.toFixed(0) },
        { label: "Dominant", value: dominantAfferent },
        { label: "Antiemetic", value: toggles.antiemetic ? "on" : "off" }
      ],
      feedbackActive: !toggles.antiemetic,
      forwardActive: centreFiring > 40
    };
  }
};

export default function VomitingReflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
