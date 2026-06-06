"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Appetite regulation at the arcuate nucleus.
 *   Adipose tissue secretes LEPTIN proportional to fat mass (long-term satiety).
 *   Stomach secretes GHRELIN inversely to gastric stretch (short-term hunger).
 *   Both converge on the arcuate nucleus:
 *     - POMC / CART neurons: anorexigenic (↓appetite, ↑energy expenditure)
 *     - NPY / AgRP neurons:  orexigenic (↑appetite, ↓energy expenditure)
 *   Net hypothalamic drive then sets food intake and metabolic rate.
 *
 * Leptin resistance (most obese humans): ARC neurons under-respond to leptin
 * despite high circulating levels — the long-term satiety signal fails to
 * suppress hunger.
 */
const config: FeedbackLabConfig = {
  diagramId: "endo/leptin-ghrelin-appetite",
  controls: [
    { key: "bodyFat", label: "Body fat (% of normal)", min: 30, max: 250, step: 1, defaultValue: 100, unit: "%" },
    { key: "gastricStretch", label: "Gastric stretch (recent meal)", min: 0, max: 100, step: 1, defaultValue: 50, unit: "%" },
    { key: "leptinSensitivity", label: "Leptin sensitivity", min: 10, max: 100, step: 1, defaultValue: 100, unit: "%" }
  ],
  toggles: [{ key: "loop", label: "Hypothalamic integration intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    // Plasma leptin scales with fat mass (truly proportional in lean / mid range,
    // saturating in obesity).
    const leptin = clamp(values.bodyFat * 0.4, 5, 120);
    // Ghrelin rises with empty stomach. Halved by recent meal.
    const ghrelin = clamp(100 - values.gastricStretch * 0.85, 5, 120);
    // Effective satiety signal accounts for leptin resistance.
    const leptinEffect = toggles.loop ? leptin * (values.leptinSensitivity / 100) : 50;
    const orexigenicDrive = toggles.loop ? clamp(ghrelin - leptinEffect + 50, 0, 150) : 50;
    const energyExpenditure = clamp(100 + (leptinEffect - 50) * 0.4 - (ghrelin - 50) * 0.1, 60, 140);
    const meals = clamp(orexigenicDrive / 30, 0, 8);

    const phenotype = (() => {
      if (!toggles.loop) return "Open loop — appetite drive fixed at midline";
      if (values.bodyFat > 180 && values.leptinSensitivity < 60) return "Leptin resistance — obesity with high leptin but failed satiety";
      if (values.bodyFat < 50 && leptin < 25) return "Leptin deficiency — starvation / anorexia nervosa drive to refeed";
      if (values.gastricStretch < 20 && ghrelin > 90) return "Pre-prandial ghrelin surge — hunger";
      if (values.gastricStretch > 80 && ghrelin < 30) return "Post-prandial satiety";
      if (orexigenicDrive > 100) return "NPY / AgRP dominant — net hunger";
      if (orexigenicDrive < 40) return "POMC / CART dominant — net satiety";
      return "Balanced — between meals";
    })();

    return {
      state: phenotype,
      body: "Leptin (adipose, long-term) and ghrelin (gastric, short-term) integrate at arcuate nucleus POMC and NPY neurons. Leptin signals 'enough fat stored — stop eating'; ghrelin signals 'stomach empty — start eating.' In leptin-resistant obesity, the long-term satiety signal fails despite high circulating leptin — like insulin resistance for appetite.",
      warning:
        values.bodyFat > 200 && values.leptinSensitivity < 50
          ? "Edge state: severe leptin resistance — pharmacologic leptin replacement does not fix this (cf. lipodystrophy where it does)."
          : values.bodyFat < 40
            ? "Edge state: critically low fat mass — leptin floor; amenorrhea, hypothalamic hypogonadism."
            : undefined,
      nodes: [
        { label: "Adipose · leptin", value: `${leptin.toFixed(0)} ng/mL`, active: leptin > 50 || leptin < 20 },
        { label: "Arcuate nucleus integrator", value: `Drive ${orexigenicDrive.toFixed(0)}`, active: toggles.loop },
        { label: "Stomach · ghrelin", value: `${ghrelin.toFixed(0)} pg/mL`, active: ghrelin > 80 || ghrelin < 30 }
      ],
      readouts: [
        { label: "Leptin", value: `${leptin.toFixed(0)} ng/mL` },
        { label: "Ghrelin", value: `${ghrelin.toFixed(0)} pg/mL` },
        { label: "Orexigenic drive", value: orexigenicDrive.toFixed(0) },
        { label: "EE", value: `${energyExpenditure.toFixed(0)}% BMR` },
        { label: "Meals", value: `${meals.toFixed(1)} /day` },
        { label: "Body fat", value: `${values.bodyFat.toFixed(0)}%` }
      ],
      feedbackActive: toggles.loop,
      forwardActive: Math.abs(orexigenicDrive - 60) > 25
    };
  }
};

export default function LeptinGhrelinAppetiteWidget() {
  return <FeedbackLabWidget config={config} />;
}
