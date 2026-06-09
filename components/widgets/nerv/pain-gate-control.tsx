"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Pain transmission and the gate-control theory.
 *   Nociceptor (Aδ sharp, C dull) → dorsal horn projection neuron →
 *   spinothalamic tract → thalamus → cortex (perception).
 *   GATE: large Aβ touch fibres excite inhibitory interneurons in the
 *   substantia gelatinosa that PRESYNAPTICALLY inhibit the projection
 *   neuron — "rubbing it makes it feel better".
 *   DESCENDING MODULATION: periaqueductal grey → raphe (serotonin) +
 *   locus coeruleus (norepinephrine) → enkephalin interneurons that
 *   close the gate. Opioids act here and presynaptically.
 */
const config: FeedbackLabConfig = {
  diagramId: "nerv/pain-gate-control",
  loop: {
    guideSteps: [
      { title: "1 Nociceptor", verb: "Aδ/C fibres fire to noxious stimulus" },
      { title: "2 Dorsal horn", verb: "projection neuron relays up the spinothalamic tract" },
      { title: "3 Brain", verb: "thalamus and cortex build the pain percept" }
    ],
    guideSummary: "Noxious input ascends — but a spinal gate and descending control can turn the volume down before it reaches the brain.",
    nodeRoles: ["Afferent", "Dorsal horn", "Brain"],
    forwardHeader: "NOCICEPTION → PERCEPTION",
    feedbackHeader: "GATE + DESCENDING CONTROL",
    forwardLabels: ["spinothalamic", "thalamocortical"],
    feedbackLabel: "gate (Aβ + opioid)",
    feedbackGuideTitle: "Pain gate",
    feedbackVerbActive: "Aβ touch + descending PAG/opioid close the gate, damping the projection neuron",
    feedbackVerbInactive: "gate open — nociceptive drive passes unchecked (think neuropathic pain)",
    feedbackStatusActive: "Gate closing",
    feedbackStatusInactive: "Gate open",
    feedbackOffLabel: "gate open",
    legendForward: "nociceptor drive ascends to the cortex",
    legendFeedback: "touch + descending opioids inhibit the dorsal-horn relay"
  },
  controls: [
    { key: "noxious", label: "Noxious stimulus intensity", min: 0, max: 200, step: 1, defaultValue: 80, unit: "%" },
    { key: "tactile", label: "Aβ tactile input (rub the area)", min: 0, max: 200, step: 1, defaultValue: 20, unit: "%" },
    { key: "descending", label: "Descending modulation / opioid", min: 0, max: 200, step: 1, defaultValue: 20, unit: "%" }
  ],
  toggles: [{ key: "gate", label: "Gate + descending control intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const gateClosure = toggles.gate ? clamp((values.tactile * 0.25 + values.descending * 0.45) / 100, 0, 0.92) : 0;
    const projection = clamp((values.noxious * 0.7) * (1 - gateClosure), 0, 200);
    const perception = clamp(projection * 0.9, 0, 200);

    const phenotype = (() => {
      if (!toggles.gate && values.noxious > 60) return "Gate disabled — unchecked nociception (neuropathic / central sensitisation)";
      if (values.descending > 110) return "Strong descending analgesia — opioid / stress-induced (PAG, raphe, locus coeruleus)";
      if (gateClosure > 0.5 && values.tactile > values.descending) return "Gate closed by touch — counter-stimulation (TENS, rubbing) analgesia";
      if (perception > 110) return "Severe pain — high nociceptor drive overwhelms the gate";
      if (perception < 20) return "Minimal pain — gate effectively closed";
      return "Moderate pain — partial gating";
    })();

    return {
      state: phenotype,
      body: "Gate-control theory: large Aβ touch fibres and descending pathways recruit inhibitory interneurons in the dorsal horn that presynaptically silence the pain projection neuron. This is why rubbing a bump, TENS units, and acupuncture relieve pain, and why the periaqueductal grey → raphe/locus coeruleus → enkephalin system underlies stress-induced and opioid analgesia. Loss of inhibition (nerve injury, central sensitisation) opens the gate → allodynia and hyperalgesia.",
      warning:
        !toggles.gate && values.noxious > 100
          ? "Edge state: gate open with strong drive — central sensitisation / allodynia; even light touch is painful."
          : values.descending > 150
            ? "Edge state: maximal opioid/descending drive — profound analgesia but watch respiratory depression with exogenous opioids."
            : undefined,
      nodes: [
        { label: "Nociceptor (Aδ / C)", value: `${(values.noxious * 0.7).toFixed(0)}% drive`, active: values.noxious > 30 },
        { label: "Dorsal horn projection", value: `${projection.toFixed(0)}% relay`, active: projection > 30 },
        { label: "Thalamus → cortex", value: `Pain ${perception.toFixed(0)}%`, active: perception > 30 }
      ],
      readouts: [
        { label: "Noxious", value: `${values.noxious.toFixed(0)}%` },
        { label: "Gate closure", value: `${(gateClosure * 100).toFixed(0)}%` },
        { label: "Relay", value: `${projection.toFixed(0)}%` },
        { label: "Perceived pain", value: `${perception.toFixed(0)}%` },
        { label: "Aβ touch", value: `${values.tactile.toFixed(0)}%` },
        { label: "Descending", value: `${values.descending.toFixed(0)}%` }
      ],
      feedbackActive: toggles.gate && gateClosure > 0.1,
      forwardActive: projection > 20
    };
  }
};

export default function PainGateControlWidget() {
  return <FeedbackLabWidget config={config} />;
}
