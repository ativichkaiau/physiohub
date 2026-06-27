"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Monosynaptic (Ia) stretch reflex with descending modulation.
 *   Muscle stretch  → Ia afferent  → α-motor neuron  → muscle contraction
 *   Descending UMN tracts (corticospinal + reticulospinal) tonically inhibit
 *   the segmental loop. UMN lesions release this inhibition → hyperreflexia,
 *   clonus, positive Babinski. LMN lesions remove the effector → hyporeflexia,
 *   atrophy, fasciculations.
 */
const config: FeedbackLabConfig = {
  diagramId: "nerv/reflex-arc",
  readingGuide:
    "Trace signal flow around the stretch reflex: stretch → Ia afferent → spinal cord → alpha motor neuron → contraction. An inhibitory interneuron simultaneously RELAXES the antagonist (reciprocal inhibition). Watch the agonist excitation and antagonist inhibition that together shape a clean movement.",
  loop: {
    guideSteps: [
      { title: "1 Stretch", verb: "muscle spindle Ia afferents fire" },
      { title: "2 Synapse", verb: "segmental cord activates alpha motor neurons" },
      { title: "3 Contract", verb: "extrafusal muscle shortens and resists stretch" }
    ],
    guideSummary: "The stretch reflex is a segmental arc modulated by descending UMN inhibition.",
    feedbackStepTitle: "4 Modulate",
    nodeRoles: ["Ia afferent", "Spinal cord", "LMN/muscle"],
    forwardHeader: "Ia → ALPHA MOTOR",
    feedbackHeader: "DESCENDING CONTROL",
    forwardLabels: ["Ia afferent", "alpha motor"],
    feedbackLabel: "UMN restraint",
    feedbackGuideTitle: "Descending UMN modulation",
    feedbackVerbActive: "descending tracts modulate segmental reflex gain",
    feedbackVerbInactive: "descending restraint is absent or the reflex arc is severed",
    feedbackStatusActive: "UMN linked",
    feedbackStatusInactive: "UMN/arc off",
    feedbackOffLabel: "UMN OFF",
    legendForward: "Ia afferent excites alpha motor neuron",
    legendFeedback: "descending control tunes reflex gain"
  },
  controls: [
    { key: "stretch", label: "Muscle stretch (stimulus)", min: 0, max: 200, step: 1, defaultValue: 100, unit: "% MVC" },
    { key: "descending", label: "Descending UMN inhibition", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" },
    { key: "motorPool", label: "α-motor neuron pool (LMN)", min: 0, max: 150, step: 1, defaultValue: 100, unit: "% normal" }
  ],
  toggles: [{ key: "loop", label: "Reflex loop intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Ia afferent firing scales with spindle stretch.
    const afferentFiring = clamp(values.stretch * 0.6, 0, 120);
    // Effective reflex gain = afferent input minus descending inhibition,
    // gated by α-motor neuron pool availability.
    const inhibition = (values.descending / 100) * 0.5;
    const motorPoolGain = (values.motorPool / 100);
    const reflexOutput = toggles.loop
      ? clamp(afferentFiring * (1 - inhibition) * motorPoolGain, 0, 150)
      : 0;
    // Clinical 0–4+ grading
    const drtGrade = (() => {
      if (reflexOutput < 8) return "0 (absent)";
      if (reflexOutput < 25) return "1+ (hypoactive)";
      if (reflexOutput < 60) return "2+ (normal)";
      if (reflexOutput < 95) return "3+ (brisk)";
      return "4+ (clonus)";
    })();

    const phenotype = (() => {
      if (!toggles.loop) return "Areflexia — loop severed (peripheral neuropathy / spinal shock)";
      if (values.motorPool < 30) return "Lower motor neuron lesion — hyporeflexia, atrophy, fasciculations";
      if (values.descending < 30 && values.motorPool >= 80) return "Upper motor neuron lesion — hyperreflexia, clonus, ↑tone";
      if (values.descending > 150) return "Heavy descending inhibition — areflexia (e.g., cerebellar hypotonia)";
      if (reflexOutput > 95) return "Pathologic hyperreflexia — UMN syndrome";
      if (reflexOutput < 25) return "Hyporeflexia";
      return "Physiologic 2+ stretch reflex";
    })();

    return {
      state: phenotype,
      body: "Stretching the muscle spindle excites Ia afferents, which synapse directly on α-motor neurons (monosynaptic). Descending UMN tracts tonically inhibit the loop; remove them and you get hyperreflexia + clonus + Babinski (UMN syndrome). Damage the motor neuron itself and you get hyporeflexia + atrophy + fasciculations (LMN syndrome). Both at once = ALS.",
      warning:
        reflexOutput > 95
          ? "Edge state: sustained clonus (4+) — repetitive, rhythmic contractions on stretch suggest spinal cord injury, MS, or stroke."
          : !toggles.loop && values.stretch > 100
            ? "Edge state: loop severed and afferent input present — central recovery alone will not restore the reflex without re-innervation."
            : values.motorPool < 15
              ? "Edge state: motor pool < 15% — only fragmented twitches remain (severe denervation, e.g., polio late-stage)."
              : undefined,
      nodes: [
        { label: "Muscle spindle (Ia)", value: `${afferentFiring.toFixed(0)} Hz`, active: values.stretch > 110 || values.stretch < 60 },
        { label: "Spinal cord interneuron", value: toggles.loop ? "open" : "blocked", active: toggles.loop },
        { label: "α-motor neuron + muscle", value: `${reflexOutput.toFixed(0)}% MVC`, active: reflexOutput > 60 || reflexOutput < 20 }
      ],
      readouts: [
        { label: "Stretch", value: `${values.stretch.toFixed(0)}%` },
        { label: "Output", value: `${reflexOutput.toFixed(0)}%` },
        { label: "DTR grade", value: drtGrade },
        { label: "UMN inhibition", value: `${values.descending.toFixed(0)}%` }
      ],
      feedbackActive: toggles.loop && values.descending > 20,
      forwardActive: values.stretch > 110 || values.stretch < 60
    };
  }
};

export default function ReflexArcWidget() {
  return <FeedbackLabWidget config={config} />;
}
