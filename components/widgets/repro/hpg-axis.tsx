"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Hypothalamic–Pituitary–Gonadal (HPG) axis.
 *   Hypothalamus → PULSATILE GnRH → anterior pituitary → LH + FSH → gonad
 *   → sex steroids (testosterone / estradiol) + inhibin.
 *   Negative feedback: steroids suppress GnRH/LH; inhibin selectively
 *   suppresses FSH. (Mid-cycle estradiol switches to POSITIVE feedback to
 *   trigger the LH surge — noted in the body text.)
 *
 * Key pharmacology: GnRH must be PULSATILE. Continuous GnRH agonist
 * (leuprolide) paradoxically DOWN-regulates the pituitary → chemical
 * castration (prostate cancer, precocious puberty, endometriosis).
 */
const config: FeedbackLabConfig = {
  diagramId: "repro/hpg-axis",
  loop: {
    guideSteps: [
      { title: "1 GnRH", verb: "hypothalamus fires pulsatile GnRH" },
      { title: "2 LH/FSH", verb: "gonadotrophs release LH and FSH" },
      { title: "3 Steroids", verb: "gonad makes testosterone/estradiol + inhibin" }
    ],
    guideSummary: "Pulsatile GnRH drives LH/FSH and gonadal steroids, which feed back to restrain the axis.",
    nodeRoles: ["Hypothalamus", "Pituitary", "Gonad"],
    forwardHeader: "GnRH → LH/FSH → STEROIDS",
    feedbackHeader: "STEROID + INHIBIN FEEDBACK",
    forwardLabels: ["GnRH (pulsatile)", "LH / FSH"],
    feedbackLabel: "steroid + inhibin",
    feedbackGuideTitle: "Negative feedback",
    feedbackVerbActive: "testosterone/estradiol suppress GnRH+LH; inhibin suppresses FSH",
    feedbackVerbInactive: "feedback removed — gonadotropins run high",
    feedbackStatusActive: "Feedback on",
    feedbackStatusInactive: "Feedback off",
    feedbackOffLabel: "feedback OFF",
    legendForward: "GnRH pulses drive gonadotropin and steroid output",
    legendFeedback: "steroids + inhibin restrain the hypothalamus and pituitary"
  },
  controls: [
    { key: "gnrhPulse", label: "GnRH pulse frequency", min: 0, max: 200, step: 1, defaultValue: 100, unit: "%" },
    { key: "gonadFn", label: "Gonadal function", min: 0, max: 150, step: 1, defaultValue: 100, unit: "%" },
    { key: "exogSteroid", label: "Exogenous steroid (AAS / OCP)", min: 0, max: 200, step: 1, defaultValue: 0, unit: "%" }
  ],
  toggles: [{ key: "feedback", label: "Negative feedback intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Pulsatile drive: peak gonadotropin output near physiologic pulse rate.
    // Continuous / supraphysiologic GnRH (>160%) paradoxically desensitises.
    const pulse = values.gnrhPulse;
    const pulseEffectiveness = pulse > 160 ? clamp(1 - (pulse - 160) / 60, 0.1, 1) : clamp(pulse / 100, 0, 1.2);
    const steroidFeedback = toggles.feedback
      ? (values.gonadFn / 100) * 0.5 + (values.exogSteroid / 100) * 0.7
      : 0;
    const lh = clamp(40 * pulseEffectiveness * (1 - steroidFeedback) + 4, 0.5, 90);
    // Inhibin (from gonad) selectively brakes FSH on top of steroid feedback.
    const inhibin = toggles.feedback ? (values.gonadFn / 100) * 0.35 : 0;
    const fsh = clamp(35 * pulseEffectiveness * (1 - steroidFeedback - inhibin) + 4, 0.5, 90);
    const sexSteroid = clamp((values.gonadFn / 100) * (lh / 40) * 100 + values.exogSteroid * 0.6, 0, 220);

    const phenotype = (() => {
      if (pulse > 160) return "Continuous GnRH agonist — paradoxical pituitary down-regulation (chemical castration)";
      if (values.exogSteroid > 80) return "Exogenous steroid suppression (anabolic steroids / OCP) — ↓LH/FSH, gonadal atrophy";
      if (values.gonadFn < 25 && lh > 40) return "Primary hypogonadism (hypergonadotropic) — ↑↑LH/FSH, ↓steroid (Klinefelter / Turner / menopause)";
      if (pulse < 25 && lh < 8) return "Hypogonadotropic hypogonadism — ↓GnRH (Kallmann, functional, hyperprolactinemia)";
      if (!toggles.feedback) return "Open loop — unrestrained gonadotropin drive";
      return "Eugonadal axis — balanced feedback";
    })();

    return {
      state: phenotype,
      body: "GnRH must be PULSATILE. Physiologic pulses drive LH and FSH; continuous high-dose GnRH agonist (leuprolide) desensitises the pituitary and SHUTS the axis down — exploited to treat prostate cancer, central precocious puberty, and endometriosis. Sex steroids and inhibin provide negative feedback (inhibin selectively suppresses FSH). The exception: mid-cycle estradiol flips to POSITIVE feedback and triggers the ovulatory LH surge.",
      warning:
        values.exogSteroid > 120
          ? "Edge state: high exogenous androgen — suppressed LH/FSH → testicular atrophy, azoospermia, infertility (classic anabolic-steroid effect)."
          : values.gonadFn < 15
            ? "Edge state: gonadal failure with very high gonadotropins — primary hypogonadism; karyotype + FSH/LH confirm."
            : pulse > 180
              ? "Edge state: maximal continuous GnRH — full pituitary desensitisation, gonadotropins fall toward castrate levels."
              : undefined,
      nodes: [
        { label: "Hypothalamus · GnRH", value: pulse > 160 ? "continuous (desens.)" : `${pulse.toFixed(0)}% pulse`, active: pulseEffectiveness > 0.4 && pulse <= 160 },
        { label: "Pituitary · LH / FSH", value: `LH ${lh.toFixed(0)} · FSH ${fsh.toFixed(0)}`, active: lh > 30 },
        { label: "Gonad · steroid + inhibin", value: `Steroid ${sexSteroid.toFixed(0)}%`, active: sexSteroid > 60 }
      ],
      readouts: [
        { label: "LH", value: `${lh.toFixed(0)} IU/L` },
        { label: "FSH", value: `${fsh.toFixed(0)} IU/L` },
        { label: "Sex steroid", value: `${sexSteroid.toFixed(0)}%` },
        { label: "GnRH pulse", value: `${pulse.toFixed(0)}%` },
        { label: "Inhibin brake", value: `${(inhibin * 100).toFixed(0)}%` },
        { label: "Feedback", value: toggles.feedback ? "on" : "off" }
      ],
      feedbackActive: toggles.feedback && (steroidFeedback > 0.1 || inhibin > 0.05),
      forwardActive: lh > 12 && pulse <= 160
    };
  }
};

export default function HpgAxisWidget() {
  return <FeedbackLabWidget config={config} />;
}
