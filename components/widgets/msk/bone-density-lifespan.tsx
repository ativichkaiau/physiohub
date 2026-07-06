"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Bone mineral density (BMD) across the lifespan, expressed as a T-score
 * (SDs from the young-adult peak).
 *   - Accrual: BMD climbs through childhood/adolescence to PEAK BONE MASS
 *     around age 25–30 (genetics, calcium, vitamin D, weight-bearing exercise).
 *   - Age-related loss: a slow decline thereafter (~0.5%/yr).
 *   - Menopause: oestrogen withdrawal accelerates loss (~2–3%/yr) for ~5–8 yr.
 * WHO thresholds: T ≥ −1 normal · −1 to −2.5 osteopenia · ≤ −2.5 osteoporosis.
 */
function tScore(age: number, peakPct: number, menopauseAccel: number, riskLoad: number) {
  // BMD as % of a reference young-adult peak (100%).
  let pct: number;
  if (age <= 30) {
    // accrual from ~40% at age 10 to peakPct at 30
    pct = 40 + (peakPct - 40) * clamp((age - 10) / 20, 0, 1);
  } else {
    pct = peakPct;
    const baselineLoss = (age - 30) * 0.45; // ~0.45%/yr age-related
    // menopausal acceleration between ~50 and ~58
    const menoWindow = clamp((Math.min(age, 58) - 50) / 8, 0, 1);
    const menoLoss = (menopauseAccel / 100) * 14 * menoWindow;
    const riskLoss = (riskLoad / 100) * 0.6 * Math.max(0, age - 30);
    pct = pct - baselineLoss - menoLoss - riskLoss;
  }
  // ~12% of peak ≈ 1 SD → T-score
  return clamp((pct - 100) / 12, -4, 1.6);
}

const config: CurveLabConfig = {
  diagramId: "msk/bone-density-lifespan",
  title: "Bone density across the lifespan",
  xDomain: [10, 90],
  yDomain: [-3.5, 1.5],
  xLabel: "Age (years)",
  yLabel: "Bone density (T-score)",
  readingGuide:
    "Bone mass climbs to a PEAK near age 30, then slowly falls. Oestrogen loss at menopause bends the curve down sharply for several years. Read the T-score against the bands: above −1 is normal, −1 to −2.5 is osteopenia, below −2.5 is osteoporosis. A higher peak buys decades of protection.",
  bands: [
    { axis: "y", from: -1, to: 1.5, tone: "ok", label: "normal" },
    { axis: "y", from: -2.5, to: -1, tone: "warn", label: "osteopenia" },
    { axis: "y", from: -3.5, to: -2.5, tone: "danger", label: "osteoporosis" }
  ],
  controls: [
    { key: "age", label: "Age marker", min: 10, max: 90, step: 1, defaultValue: 45, unit: "yr" },
    { key: "peakPct", label: "Peak bone mass", min: 78, max: 115, step: 1, defaultValue: 100, unit: "% ref" },
    { key: "menopauseAccel", label: "Menopausal loss (oestrogen ↓)", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%" },
    { key: "riskLoad", label: "Risk load (steroids / smoking)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(10, 90, 1).map((x) => ({ x, y: tScore(x, values.peakPct, values.menopauseAccel, values.riskLoad) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "protected",
      label: "High peak, no accelerators",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(10, 90, 1).map((x) => ({ x, y: tScore(x, 110, 0, 0) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: 30, y: tScore(30, values.peakPct, values.menopauseAccel, values.riskLoad), label: "peak bone mass" },
    { x: values.age, y: tScore(values.age, values.peakPct, values.menopauseAccel, values.riskLoad), label: "current age" }
  ],
  getCursorX: (values) => values.age,
  summarize: (values) => {
    const t = tScore(values.age, values.peakPct, values.menopauseAccel, values.riskLoad);
    const category = t >= -1 ? "Normal" : t >= -2.5 ? "Osteopenia" : "Osteoporosis";
    return {
      state:
        t < -2.5
          ? "Osteoporosis — fragility-fracture risk (DEXA T ≤ −2.5)"
          : t < -1
            ? "Osteopenia — low bone mass, modifiable"
            : values.age < 25
              ? "Accrual phase — building peak bone mass"
              : "Normal bone density",
      body: "Peak bone mass (~age 30) minus lifetime loss sets fracture risk. Weight-bearing exercise, calcium, and vitamin D raise the peak; oestrogen deficiency, glucocorticoids, and smoking accelerate loss. T-score ≤ −2.5 defines osteoporosis.",
      readouts: [
        { label: "T-score", value: t.toFixed(1) },
        { label: "Category", value: category },
        { label: "Age", value: `${values.age.toFixed(0)} yr` },
        { label: "Peak", value: `${values.peakPct.toFixed(0)}% ref` }
      ],
      warning:
        t < -3
          ? "Edge state: T-score < −3 — severe osteoporosis; high risk of hip / vertebral fracture. Treat (bisphosphonate / denosumab) and address falls."
          : values.riskLoad > 60 && values.age > 50
            ? "Edge state: high glucocorticoid / smoking load past 50 — steepening loss; screen with DEXA and start bone protection early."
            : undefined
    };
  }
};

export default function BoneDensityLifespanWidget() {
  return <CurveLabWidget config={config} />;
}
