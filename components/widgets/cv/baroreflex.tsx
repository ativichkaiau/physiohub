"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

// Carotid + aortic arch baroreceptors fire as a SIGMOID of arterial pressure.
// Threshold ≈ 50 mmHg (below: near-zero firing → reflex fails at extreme
// hypotension). Set point ≈ 95 mmHg → 50% firing. Saturation ≈ 180 mmHg →
// firing maxes out and further pressure rise produces little additional
// reflex (the physiology behind why severe hypertension cannot be reflexively
// compensated indefinitely). The previous linear model missed both edges.
function baroreceptorFiring(map: number) {
  return clamp(100 / (1 + Math.exp(-(map - 95) / 18)), 0, 100);
}

const SET_POINT_FIRING = baroreceptorFiring(95); // ≈ 50

const config: FeedbackLabConfig = {
  diagramId: "cv/baroreflex",
  controls: [
    { key: "map", label: "Mean arterial pressure", min: 55, max: 180, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "gain", label: "Reflex gain", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Autonomic feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const firing = baroreceptorFiring(values.map);
    const firingError = firing - SET_POINT_FIRING;
    const reflex = toggles.feedback ? (values.gain / 100) * firingError : 0;
    // Asymmetric reflex gain — bradycardic responses (high BP → ↑PNS) are
    // stronger than tachycardic ones (low BP → ↑SNS). This is the clinically
    // observed direction of baroreflex sensitivity.
    const hrChange = reflex > 0 ? -reflex * 0.55 : -reflex * 0.35;
    const heartRate = clamp(72 + hrChange, 35, 160);
    const tone = clamp(50 - reflex * 0.65, 0, 100);
    const parasympatheticDominant = reflex > 8;
    const sympatheticDominant = reflex < -8;

    return {
      state: !toggles.feedback
        ? "Loop opened"
        : values.map > 120
          ? "Parasympathetic dominance"
          : values.map < 75
            ? "Sympathetic compensation"
            : "Set point tracking",
      body: "Arterial baroreceptors fire as a sigmoid of pressure (set point ≈ 95 mmHg). The medullary cardiovascular center inverts the error and shifts the balance of vagal vs sympathetic outflow to the SA node and vasculature.",
      warning: !toggles.feedback && Math.abs(values.map - 95) > 30
        ? "Edge state: pressure is far from set point and the reflex arm is disabled — no compensation."
        : values.map < 60
          ? "Edge state: receptor firing approaches threshold; reflex gain falls toward zero."
          : values.map > 170
            ? "Edge state: receptor firing saturates; further pressure rise produces little additional reflex."
            : undefined,
      nodes: [
        { label: "Carotid + aortic baroreceptors", value: `Firing ${firing.toFixed(0)}%`, active: Math.abs(firingError) > 8 },
        { label: "Medullary CV center (NTS)", value: `Gain ${values.gain.toFixed(0)}%`, active: toggles.feedback },
        { label: "Heart + vasculature", value: `HR ${heartRate.toFixed(0)} bpm`, active: parasympatheticDominant || sympatheticDominant }
      ],
      readouts: [
        { label: "MAP", value: `${values.map.toFixed(0)} mmHg` },
        { label: "HR", value: `${heartRate.toFixed(0)} bpm` },
        { label: "SNS tone", value: `${tone.toFixed(0)}%` },
        { label: "Firing", value: `${firing.toFixed(0)}%` }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: Math.abs(firingError) > 5
    };
  }
};

export default function BaroreflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
