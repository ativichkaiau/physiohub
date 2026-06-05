"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

const config: FeedbackLabConfig = {
  diagramId: "renal/raas",
  controls: [
    { key: "perfusion", label: "Renal perfusion", min: 45, max: 130, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "nacl", label: "Macula densa NaCl", min: 10, max: 100, step: 1, defaultValue: 55, unit: "%" }
  ],
  toggles: [{ key: "ace", label: "ACE available", defaultValue: true }],
  evaluate: (values, toggles) => {
    const lowPressureDrive = clamp((95 - values.perfusion) * 1.1, 0, 90);
    const lowSaltDrive = clamp((55 - values.nacl) * 0.9, 0, 70);
    const renin = clamp(15 + lowPressureDrive + lowSaltDrive, 5, 120);
    const angII = toggles.ace ? clamp(renin * 0.82, 4, 100) : clamp(renin * 0.22, 2, 35);
    const aldosterone = clamp(8 + angII * 0.55, 4, 70);
    return {
      state: values.perfusion < 75 || values.nacl < 35 ? "RAAS activated" : toggles.ace ? "Low basal RAAS" : "ACE blocked",
      body: "Low renal perfusion or low macula densa NaCl increases renin, which raises angiotensin II and aldosterone when ACE is available.",
      warning: values.perfusion < 55 && toggles.ace ? "Edge state: severe renal hypoperfusion strongly activates RAAS." : undefined,
      nodes: [
        { label: "Juxtaglomerular cell", value: `Renin ${renin.toFixed(0)}%`, active: renin > 45 },
        { label: "Angiotensin system", value: `Ang II ${angII.toFixed(0)}%`, active: angII > 40 },
        { label: "Adrenal cortex", value: `Aldosterone ${aldosterone.toFixed(0)}%`, active: aldosterone > 35 }
      ],
      readouts: [
        { label: "Renin", value: `${renin.toFixed(0)}%` },
        { label: "Ang II", value: `${angII.toFixed(0)}%` },
        { label: "Aldo", value: `${aldosterone.toFixed(0)}%` },
        { label: "Perf", value: `${values.perfusion.toFixed(0)}` }
      ],
      feedbackActive: toggles.ace,
      forwardActive: renin > 35
    };
  }
};

export default function RaasWidget() {
  return <FeedbackLabWidget config={config} />;
}
