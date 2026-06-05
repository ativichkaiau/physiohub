"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "cv/baroreflex",
  controls: [
    { key: "map", label: "Mean arterial pressure", min: 55, max: 170, step: 1, defaultValue: 93, unit: "mmHg" },
    { key: "gain", label: "Reflex gain", min: 0, max: 100, step: 1, defaultValue: 70, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Autonomic feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const pressureError = values.map - 93;
    const firing = clamp(45 + pressureError * 0.65, 0, 100);
    const reflex = toggles.feedback ? (values.gain / 100) * pressureError : 0;
    const heartRate = clamp(72 - reflex * 0.45, 35, 150);
    const tone = clamp(50 - reflex * 0.5, 0, 100);
    return {
      state: toggles.feedback ? (values.map > 115 ? "Pressure buffered" : values.map < 75 ? "Compensatory tachycardia" : "Set point tracking") : "Loop opened",
      body: "Baroreceptor firing changes autonomic output to adjust heart rate and vascular tone around the arterial pressure set point.",
      warning: !toggles.feedback && Math.abs(pressureError) > 35 ? "Edge state: pressure is far from set point and the reflex arm is disabled." : undefined,
      nodes: [
        { label: "Carotid sinus", value: `Firing ${firing.toFixed(0)}%`, active: Math.abs(pressureError) > 18 },
        { label: "Medullary centers", value: `Gain ${values.gain.toFixed(0)}%`, active: toggles.feedback },
        { label: "Heart and vessels", value: `HR ${heartRate.toFixed(0)} bpm`, active: Math.abs(reflex) > 10 }
      ],
      readouts: [
        { label: "MAP", value: `${values.map.toFixed(0)}` },
        { label: "HR", value: `${heartRate.toFixed(0)}` },
        { label: "Tone", value: `${tone.toFixed(0)}%` },
        { label: "Firing", value: `${firing.toFixed(0)}%` }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: Math.abs(pressureError) > 10
    };
  }
};

export default function BaroreflexWidget() {
  return <FeedbackLabWidget config={config} />;
}
