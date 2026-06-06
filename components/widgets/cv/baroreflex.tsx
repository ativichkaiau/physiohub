"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

// Carotid + aortic arch baroreceptors fire as a SIGMOID of arterial pressure
// centred on the operating set point. Threshold ≈ 50 mmHg (below: near-zero
// firing → reflex fails at extreme hypotension). Saturation ≈ 180 mmHg → firing
// maxes out and further pressure rise produces little additional reflex.
//
// Chronic resetting: in sustained hypertension the receptors / brainstem reset
// the operating set point upward over days–weeks, so the same MAP no longer
// triggers full reflex bradycardia. The "Set point" slider models this.

const config: FeedbackLabConfig = {
  diagramId: "cv/baroreflex",
  controls: [
    { key: "map", label: "Mean arterial pressure", min: 55, max: 180, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "setPoint", label: "Set-point (chronic resetting)", min: 75, max: 130, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "gain", label: "Reflex gain", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Autonomic feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Chronic resetting: in sustained hypertension the operating set point shifts
    // upward over days–weeks, so the same MAP no longer triggers full reflex
    // bradycardia. Modelled by re-centring the sigmoid on the user's set point.
    const firing = clamp(100 / (1 + Math.exp(-(values.map - values.setPoint) / 18)), 0, 100);
    const firingError = firing - 50; // 50% is the new operating midpoint
    const reflex = toggles.feedback ? (values.gain / 100) * firingError : 0;
    // Asymmetric reflex gain — bradycardic responses (high BP → ↑PNS) are
    // stronger than tachycardic ones (low BP → ↑SNS). This is the clinically
    // observed direction of baroreflex sensitivity.
    const hrChange = reflex > 0 ? -reflex * 0.55 : -reflex * 0.35;
    const heartRate = clamp(72 + hrChange, 35, 160);
    const tone = clamp(50 - reflex * 0.65, 0, 100);
    // Baroreflex sensitivity (BRS) in ms/mmHg — Δ(RR-interval) per Δ(MAP).
    // Healthy young adults: ~15–25 ms/mmHg. Low BRS predicts mortality post-MI.
    const brs = toggles.feedback ? (values.gain / 100) * 22 : 0;
    const parasympatheticDominant = reflex > 8;
    const sympatheticDominant = reflex < -8;
    const chronicallyReset = Math.abs(values.setPoint - 95) > 8;

    return {
      state: !toggles.feedback
        ? "Loop opened — pressure-passive HR"
        : chronicallyReset && values.setPoint > 110
          ? "Chronic HTN — set point reset upward"
          : chronicallyReset && values.setPoint < 85
            ? "Chronic hypotension — set point reset downward"
            : values.map > values.setPoint + 25
              ? "Parasympathetic dominance — reflex bradycardia"
              : values.map < values.setPoint - 20
                ? "Sympathetic compensation — reflex tachycardia"
                : "Set point tracking — flat HR response",
      body: "Arterial baroreceptors fire as a sigmoid of pressure. The medullary cardiovascular center (NTS) inverts the error and balances vagal vs sympathetic outflow. Sustained pressure changes RESET the set point upward (chronic HTN) or downward (orthostatic training) over days to weeks — the reflex still works, but around a new midline.",
      warning: !toggles.feedback && Math.abs(values.map - values.setPoint) > 30
        ? "Edge state: pressure is far from set point and the reflex arm is disabled — no compensation."
        : values.map < 60
          ? "Edge state: receptor firing approaches threshold (~50 mmHg); reflex gain falls toward zero."
          : values.map > 170
            ? "Edge state: receptor firing saturates near 100% — further pressure rise produces little additional reflex."
            : undefined,
      nodes: [
        { label: "Carotid + aortic baroreceptors", value: `Firing ${firing.toFixed(0)}%`, active: Math.abs(firingError) > 8 },
        { label: "Medullary CV center (NTS)", value: `Gain ${values.gain.toFixed(0)}% · BRS ${brs.toFixed(0)}`, active: toggles.feedback },
        { label: "Heart + vasculature", value: `HR ${heartRate.toFixed(0)} bpm`, active: parasympatheticDominant || sympatheticDominant }
      ],
      readouts: [
        { label: "MAP", value: `${values.map.toFixed(0)} mmHg` },
        { label: "HR", value: `${heartRate.toFixed(0)} bpm` },
        { label: "SNS tone", value: `${tone.toFixed(0)}%` },
        { label: "Set point", value: `${values.setPoint.toFixed(0)} mmHg` },
        { label: "Firing", value: `${firing.toFixed(0)}%` },
        { label: "BRS", value: `${brs.toFixed(0)} ms/mmHg` }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: Math.abs(firingError) > 5
    };
  }
};

export default function BaroreflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
