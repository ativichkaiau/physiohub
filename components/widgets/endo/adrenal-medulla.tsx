"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Sympathoadrenal axis — fight-or-flight.
 *   Hypothalamus / brainstem → sympathetic preganglionic (T5–T9) → adrenal
 *   medulla chromaffin cells → epinephrine (≈80%) + norepinephrine (≈20%).
 *   Effects: ↑HR, ↑contractility, bronchodilation (β2), gluconeogenesis (β2,
 *   liver), lipolysis (β3), pupil dilation, piloerection, sweat (sympathetic
 *   cholinergic exception).
 *
 * The chromaffin cell is a modified post-ganglionic sympathetic neuron — it
 * synthesises catecholamines via the same Tyr → DOPA → DA → NE pathway, plus
 * an extra step (PNMT, induced by cortisol) that methylates NE → Epi.
 *
 * Pheochromocytoma: chromaffin-cell tumor producing catecholamines
 * episodically and independently of CNS drive.
 */
const config: FeedbackLabConfig = {
  diagramId: "endo/adrenal-medulla",
  loop: {
    guideSteps: [
      { title: "1 Command", verb: "brainstem/hypothalamus sets sympathetic outflow" },
      { title: "2 Secrete", verb: "preganglionic ACh drives chromaffin catecholamines" },
      { title: "3 Mobilize", verb: "Epi/NE raise HR, BP, bronchodilation, and glucose" }
    ],
    guideSummary: "This is a sympathoadrenal effector chain with vagal/baroreflex restraint, not a classic endocrine set-point loop.",
    feedbackStepTitle: "4 Restrain",
    nodeRoles: ["CNS drive", "Chromaffin", "Targets"],
    forwardHeader: "ACh → CATECHOLAMINES",
    feedbackHeader: "VAGAL RESTRAINT",
    forwardLabels: ["preganglionic ACh", "Epi / NE"],
    feedbackLabel: "vagal restraint",
    feedbackGuideTitle: "Baroreflex/vagal restraint",
    feedbackVerbActive: "high pressure can restrain HR through vagal tone",
    feedbackVerbInactive: "counter-regulation is absent; catecholamine effects run hotter",
    feedbackStatusActive: "Counter-reg on",
    feedbackStatusInactive: "Counter-reg off",
    feedbackOffLabel: "counter-reg OFF",
    legendForward: "sympathetic ACh drives chromaffin secretion",
    legendFeedback: "vagal restraint limits the response"
  },
  controls: [
    { key: "stressor", label: "Stressor intensity", min: 0, max: 200, step: 1, defaultValue: 20, unit: "%" },
    { key: "cortisol", label: "Cortisol (PNMT induction)", min: 30, max: 200, step: 1, defaultValue: 100, unit: "% normal" },
    { key: "tumor", label: "Pheo / paraganglioma activity", min: 0, max: 200, step: 1, defaultValue: 0, unit: "% basal" }
  ],
  toggles: [{ key: "feedback", label: "Vagal counter-regulation", defaultValue: true }],
  evaluate: (values, toggles) => {
    // CNS drive scaled by stressor intensity.
    const cnsDrive = clamp(20 + values.stressor * 0.9, 0, 220);
    // PNMT activity converts NE to Epi; cortisol induces PNMT (the anatomic
    // reason medullary chromaffin cells make Epi while extra-adrenal
    // paraganglia make mostly NE — they're outside the cortisol drainage).
    const pnmt = values.cortisol / 100;
    // Catecholamine output from regulated (sympathoadrenal) path.
    const regulated = cnsDrive;
    // Tumor adds unregulated output, biased toward NE for pheo of medullary origin.
    const tumorOutput = values.tumor;
    const totalEpi = clamp(regulated * 0.8 * pnmt + tumorOutput * 0.3, 0, 400);
    const totalNE = clamp(regulated * 0.2 + tumorOutput * 0.7, 0, 400);
    // Hemodynamic readouts. Epi at low dose: β-dominant (↑HR, ↑CO, ↓SVR via β2).
    // Epi at high dose + NE: α-dominant (↑BP, reflex ↓HR if NE alone).
    const hr = toggles.feedback
      ? clamp(75 + totalEpi * 0.25 - totalNE * 0.1, 45, 180)
      : clamp(75 + totalEpi * 0.35 + totalNE * 0.05, 45, 220);
    const sbp = clamp(120 + totalEpi * 0.1 + totalNE * 0.4, 70, 240);
    const glucose = clamp(95 + totalEpi * 0.25 + totalNE * 0.1, 60, 280);

    const phenotype = (() => {
      if (values.tumor > 80) return "Pheochromocytoma episode — paroxysmal ↑BP, headache, palpitations, diaphoresis";
      if (cnsDrive > 180) return "Acute sympathoadrenal surge (fight-or-flight)";
      if (values.cortisol < 50 && cnsDrive > 60) return "Adrenal insufficiency pattern — low PNMT, NE-dominant response, hypotension";
      if (cnsDrive < 30 && values.tumor < 10) return "Rest / parasympathetic dominance";
      if (cnsDrive > 80) return "Active stress response";
      return "Basal sympathoadrenal tone";
    })();

    return {
      state: phenotype,
      body: "The chromaffin cell is a hormone-secreting modified neuron. Cortisol from the surrounding cortex perfuses the medulla via a portal system and induces PNMT — that's why adrenal medulla makes Epi (≈80%) while extra-adrenal paraganglia make mostly NE. Pheo is the great mimic — diagnose with plasma metanephrines (Epi + NE breakdown products), not catecholamines themselves.",
      warning:
        sbp > 200
          ? "Edge state: hypertensive crisis (SBP > 200) — risk of intracerebral haemorrhage, aortic dissection. α-blocker BEFORE β-blocker if pheo (unopposed α otherwise)."
          : values.tumor > 100 && cnsDrive < 60
            ? "Edge state: tumor-driven catecholamine output without proportional CNS drive — pathognomonic for paraganglioma / pheo."
            : glucose > 220
              ? "Edge state: stress hyperglycemia — epinephrine drives hepatic glycogenolysis and gluconeogenesis."
              : undefined,
      nodes: [
        { label: "CNS · sympathetic drive", value: `${cnsDrive.toFixed(0)}%`, active: cnsDrive > 100 },
        { label: "Preganglionic ACh → chromaffin", value: `PNMT ${pnmt.toFixed(2)}×`, active: true },
        { label: "Catecholamines (Epi + NE)", value: `${(totalEpi + totalNE).toFixed(0)} pg/mL`, active: totalEpi + totalNE > 200 }
      ],
      readouts: [
        { label: "Epi", value: `${totalEpi.toFixed(0)} pg/mL` },
        { label: "NE", value: `${totalNE.toFixed(0)} pg/mL` },
        { label: "HR", value: `${hr.toFixed(0)} bpm` },
        { label: "SBP", value: `${sbp.toFixed(0)} mmHg` },
        { label: "Glucose", value: `${glucose.toFixed(0)} mg/dL` },
        { label: "Epi : NE", value: totalNE > 0 ? `${(totalEpi / totalNE).toFixed(1)} : 1` : "—" }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: cnsDrive > 80 || values.tumor > 20
    };
  }
};

export default function AdrenalMedullaWidget() {
  return <FeedbackLabWidget config={config} />;
}
