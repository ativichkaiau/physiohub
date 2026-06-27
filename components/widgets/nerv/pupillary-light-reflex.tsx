"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Pupillary light reflex — a true negative-feedback loop.
 *   Light → retina → optic nerve (CN II, afferent) → pretectal nucleus →
 *   BILATERAL Edinger–Westphal nuclei → CN III (parasympathetic, efferent) →
 *   ciliary ganglion → pupillary sphincter → CONSTRICTION.
 *   Constriction reduces the light reaching the retina → negative feedback
 *   that stabilises retinal illumination.
 *
 * Lesions:
 *   - Afferent (optic nerve / retina): Marcus Gunn pupil (RAPD) — swinging
 *     flashlight test shows paradoxical dilation of the affected eye.
 *   - Efferent (CN III): fixed dilated pupil, "down-and-out" eye, ptosis.
 *   - Pretectal: light–near dissociation (Argyll Robertson, dorsal midbrain).
 */
const config: FeedbackLabConfig = {
  diagramId: "nerv/pupillary-light-reflex",
  readingGuide:
    "Pupil size is the controlled variable. Light → CN II afferent → midbrain → CN III efferent → constriction → less retinal light: negative feedback. Trace each limb; an afferent (CN II) lesion gives a relative afferent defect (RAPD), while an efferent (CN III) lesion leaves a fixed dilated pupil.",
  loop: {
    guideSteps: [
      { title: "1 Detect", verb: "retina encodes light into optic-nerve firing" },
      { title: "2 Relay", verb: "pretectum drives both Edinger–Westphal nuclei" },
      { title: "3 Constrict", verb: "CN III parasympathetics narrow the pupil" }
    ],
    guideSummary: "Brighter light constricts the pupil, which then admits less light — a self-stabilising negative feedback on retinal illumination.",
    feedbackStepTitle: "4 Less light",
    nodeRoles: ["Afferent CN II", "Midbrain", "Efferent CN III"],
    forwardHeader: "LIGHT → CONSTRICTION",
    feedbackHeader: "LESS LIGHT IN",
    forwardLabels: ["pretectal relay", "ciliary ganglion"],
    feedbackLabel: "less light on retina",
    feedbackGuideTitle: "Illumination feedback",
    feedbackVerbActive: "constriction reduces light hitting the retina",
    feedbackVerbInactive: "arc broken — pupil no longer self-regulates light",
    feedbackStatusActive: "Loop closed",
    feedbackStatusInactive: "Loop open",
    feedbackOffLabel: "reflex OFF",
    legendForward: "light drives parasympathetic constriction",
    legendFeedback: "a smaller pupil admits less light"
  },
  controls: [
    { key: "light", label: "Ambient light intensity", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%" },
    { key: "afferent", label: "Afferent integrity (CN II / retina)", min: 0, max: 100, step: 1, defaultValue: 100, unit: "%" },
    { key: "efferent", label: "Efferent integrity (CN III / sphincter)", min: 0, max: 100, step: 1, defaultValue: 100, unit: "%" }
  ],
  toggles: [{ key: "reflex", label: "Reflex arc intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const afferentDrive = toggles.reflex ? (values.light / 100) * (values.afferent / 100) * 100 : 0;
    const ewDrive = afferentDrive; // pretectum → bilateral EW
    const constriction = clamp(ewDrive * (values.efferent / 100), 0, 100);
    // Pupil diameter: ~8 mm fully dilated, ~2 mm fully constricted.
    const diameter = clamp(8 - (constriction / 100) * 6, 2, 8);
    // Retinal illumination after the pupil acts (area ∝ d²) — the feedback signal.
    const retinalLux = clamp((values.light) * Math.pow(diameter / 8, 2), 0, 100);

    const phenotype = (() => {
      if (!toggles.reflex) return "Arc severed — pupil fixed, no light response";
      if (values.afferent < 30 && values.efferent > 70) return "Afferent defect (RAPD / Marcus Gunn) — weak direct, intact consensual";
      if (values.efferent < 30 && values.afferent > 70) return "Efferent defect (CN III palsy) — fixed dilated pupil, ptosis";
      if (values.afferent < 30 && values.efferent < 30) return "Combined afferent + efferent loss — unreactive pupil";
      if (values.light > 70) return "Bright light — brisk constriction (miosis)";
      if (values.light < 20) return "Dim light — dilation (mydriasis)";
      return "Normal light response";
    })();

    return {
      state: phenotype,
      body: "Light on one retina constricts BOTH pupils (direct + consensual) because the pretectum projects to both Edinger–Westphal nuclei. The swinging-flashlight test exploits this: in an afferent defect, swinging the light to the bad eye makes both pupils paradoxically dilate (relative afferent pupillary defect, RAPD). An efferent CN III lesion gives a fixed dilated pupil with ptosis and a down-and-out eye — a surgical 'blown pupil' from uncal herniation until proven otherwise.",
      warning:
        !toggles.reflex
          ? "Edge state: fixed pupils — in an unconscious patient think herniation, severe hypoxia, or barbiturate/anticholinergic toxicity."
          : values.efferent < 20 && values.light > 50
            ? "Edge state: blown pupil with preserved consciousness — compressive CN III lesion (PCom aneurysm) until imaging excludes it."
            : undefined,
      nodes: [
        { label: "Retina · optic nerve (CN II)", value: `Afferent ${afferentDrive.toFixed(0)}%`, active: afferentDrive > 25 },
        { label: "Pretectum → Edinger–Westphal", value: toggles.reflex ? "relaying" : "no input", active: ewDrive > 25 },
        { label: "Ciliary ganglion → sphincter", value: `Pupil ${diameter.toFixed(1)} mm`, active: constriction > 25 }
      ],
      readouts: [
        { label: "Light in", value: `${values.light.toFixed(0)}%` },
        { label: "Constriction", value: `${constriction.toFixed(0)}%` },
        { label: "Pupil", value: `${diameter.toFixed(1)} mm` },
        { label: "Retinal lux", value: `${retinalLux.toFixed(0)}%` },
        { label: "Afferent", value: `${values.afferent.toFixed(0)}%` },
        { label: "Efferent", value: `${values.efferent.toFixed(0)}%` }
      ],
      feedbackActive: toggles.reflex && constriction > 15,
      forwardActive: afferentDrive > 20
    };
  }
};

export default function PupillaryLightReflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
