"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Hypothalamic–Pituitary–Thyroid (HPT) axis.
 *   Hypothalamus  → TRH → Anterior pituitary → TSH → Thyroid → T3, T4
 *   Negative feedback: T3 / T4  → ↓TRH and ↓TSH (the latter is the dominant
 *   loop; TSH is the most sensitive single biomarker of thyroid status).
 *
 * Levothyroxine slider: exogenous T4 replacement. The loop should suppress
 * endogenous TSH proportionally — over-replacement gives ↓↓TSH with normal /
 * high free T4 (iatrogenic hyperthyroidism).
 *
 * Primary defect slider: scales the thyroid's ability to make hormone.
 *   - Low values model Hashimoto's (autoimmune destruction) — primary hypothyroid.
 *   - High values model Graves' (autoantibody-driven over-production) — primary hyperthyroid.
 */
const config: FeedbackLabConfig = {
  diagramId: "endo/hpt-axis",
  readingGuide:
    "Free thyroid hormone is the controlled variable. The hypothalamus (TRH) and pituitary (TSH) drive the thyroid; thyroid hormone then BRAKES TRH and TSH. Read the loop downward, then the brake upward — a failing gland lets TSH climb (primary hypothyroidism), while pituitary failure drops TSH instead.",
  loop: {
    guideSteps: [
      { title: "1 Drive", verb: "hypothalamic TRH sets pituitary demand" },
      { title: "2 Relay", verb: "TSH tells thyroid follicles to synthesize hormone" },
      { title: "3 Output", verb: "T4/T3 raise circulating thyroid hormone tone" }
    ],
    guideSummary: "TRH → TSH → T4/T3 is a hormonal axis; free T4/T3 suppress TRH and especially TSH.",
    feedbackStepTitle: "4 Suppress",
    nodeRoles: ["TRH drive", "TSH relay", "T4/T3 output"],
    forwardHeader: "TRH → TSH → T4",
    feedbackHeader: "T4/T3 BRAKE",
    forwardLabels: ["TRH", "TSH"],
    feedbackLabel: "T4/T3 brake",
    feedbackGuideTitle: "Free T4/T3 brake",
    feedbackVerbActive: "thyroid hormone suppresses TRH and predominantly TSH",
    feedbackVerbInactive: "TSH no longer responds to thyroid hormone status",
    feedbackStatusActive: "Axis closed",
    feedbackStatusInactive: "Feedback open",
    feedbackOffLabel: "feedback open",
    legendForward: "hypothalamic-pituitary-thyroid drive",
    legendFeedback: "T4/T3 suppress upstream drive"
  },
  controls: [
    { key: "thyroidFn", label: "Thyroid output", min: 10, max: 200, step: 1, defaultValue: 100, unit: "% of normal" },
    { key: "levothyroxine", label: "Levothyroxine (T4) dose", min: 0, max: 200, step: 1, defaultValue: 0, unit: "μg/day equiv." },
    { key: "trhDrive", label: "Hypothalamic TRH drive", min: 50, max: 200, step: 1, defaultValue: 100, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Negative feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Endogenous T4 production from the thyroid (% of normal).
    const endogenousT4 = (values.thyroidFn / 100) * 100; // baseline normalised to 100
    // Exogenous T4 contributes directly to circulating T4.
    const exogenousT4 = values.levothyroxine * 0.6;
    const freeT4 = clamp(endogenousT4 + exogenousT4, 0, 280);
    // Free T4 → free T3 via peripheral 5'-deiodinase (~80% of circulating T3).
    const freeT3 = clamp(freeT4 * 0.95, 0, 280);
    // TSH set by hypothalamic drive minus feedback from T4 (sigmoidal, but
    // approximated linearly within ±2 SD of the set point).
    const feedback = toggles.feedback ? Math.max(0, freeT4 - 100) * 0.045 : 0;
    const compensatory = toggles.feedback ? Math.max(0, 100 - freeT4) * 0.06 : 0;
    const tsh = clamp(values.trhDrive / 100 * 2 * (1 - feedback) + compensatory * 5, 0.05, 100);

    const phenotype = (() => {
      if (!toggles.feedback) return "Open-loop — TSH set by hypothalamus only";
      if (values.levothyroxine > 130 && tsh < 0.3) return "Iatrogenic hyperthyroidism (over-replacement) — ↓↓TSH, ↑fT4";
      if (values.thyroidFn < 40 && tsh > 4 && freeT4 < 75) return "Primary hypothyroidism (Hashimoto's) — ↑TSH, ↓fT4";
      if (values.thyroidFn > 150 && freeT4 > 130) return "Primary hyperthyroidism (Graves') — ↓TSH, ↑fT4";
      if (values.trhDrive < 60 && tsh < 0.4 && freeT4 < 80) return "Central (secondary) hypothyroidism — ↓TSH, ↓fT4";
      if (values.thyroidFn > 80 && values.thyroidFn < 130 && tsh > 4 && freeT4 > 80) return "Subclinical hypothyroidism — ↑TSH, normal fT4";
      return "Euthyroid";
    })();

    return {
      state: phenotype,
      body: "Hypothalamic TRH stimulates pituitary thyrotrophs to release TSH; TSH drives thyroidal T4 and T3 production. Free T4 closes the loop by suppressing TRH and (predominantly) TSH. TSH is the single most sensitive marker of HPT-axis status — when TSH and free T4 disagree, suspect drug effect, central disease, or NTIS.",
      warning:
        tsh < 0.05
          ? "Edge state: TSH suppressed to detection limit — over-replacement or Graves'. Watch for AF, osteopenia, heat intolerance."
          : tsh > 20 && freeT4 < 50
            ? "Edge state: severe primary hypothyroidism with myxoedema risk — slow recovery; start low and titrate."
            : !toggles.feedback && Math.abs(freeT4 - 100) > 40
              ? "Edge state: feedback disabled and T4 far from target — endogenous correction is absent."
              : undefined,
      nodes: [
        { label: "Hypothalamus · TRH", value: `${values.trhDrive.toFixed(0)}%`, active: Math.abs(values.trhDrive - 100) > 20 },
        { label: "Anterior pituitary · TSH", value: `${tsh.toFixed(2)} mIU/L`, active: toggles.feedback },
        { label: "Thyroid · T4 / T3", value: `fT4 ${freeT4.toFixed(0)}%`, active: Math.abs(freeT4 - 100) > 20 }
      ],
      readouts: [
        { label: "TSH", value: `${tsh.toFixed(2)} mIU/L` },
        { label: "free T4", value: `${freeT4.toFixed(0)}% norm` },
        { label: "free T3", value: `${freeT3.toFixed(0)}% norm` },
        { label: "L-T4 dose", value: `${values.levothyroxine.toFixed(0)} μg` }
      ],
      feedbackActive: toggles.feedback,
      forwardActive: Math.abs(values.trhDrive - 100) > 15 || Math.abs(freeT4 - 100) > 15
    };
  }
};

export default function HptAxisWidget() {
  return <FeedbackLabWidget config={config} />;
}
