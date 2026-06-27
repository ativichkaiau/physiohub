"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Reproductive aging: hormone trajectories across age.
 *   - AMH / antral follicle count: falls steadily from peak (~25) toward zero
 *     at menopause — the earliest, most reliable ovarian-reserve marker.
 *   - Inhibin B: falls in the late reproductive years, releasing FSH.
 *   - FSH: rises FIRST and most dramatically (loss of inhibin/estradiol
 *     feedback) — the clinical marker of the menopausal transition (>25 IU/L).
 *   - Estradiol: holds, fluctuates in perimenopause, then falls last →
 *     vasomotor symptoms, urogenital atrophy, accelerated bone loss.
 *
 * The "menopause age" slider models premature ovarian insufficiency (<40),
 * smoking (~2 yr earlier), and late menopause.
 */
function reserve(age: number, menoAge: number) {
  // Sigmoid decline of follicle reserve, reaching ~0 at menopause age.
  return clamp(100 / (1 + Math.exp((age - (menoAge - 4)) / 2.2)), 0, 100);
}
function fshAt(age: number, menoAge: number) {
  const r = reserve(age, menoAge);
  return clamp(6 + (100 - r) * 0.9, 5, 120); // rises as reserve falls
}
function estradiolAt(age: number, menoAge: number) {
  const r = reserve(age, menoAge);
  // Holds while reserve > ~25%, perimenopausal wobble, then collapses.
  return clamp(20 + r * 1.0, 12, 120);
}
function inhibinAt(age: number, menoAge: number) {
  // Falls earlier than estradiol (a few years before menopause).
  return clamp(reserve(age, menoAge + 2) * 1.1, 2, 110);
}

const config: CurveLabConfig = {
  diagramId: "repro/menopause-transition",
  title: "Reproductive hormones across age",
  xDomain: [20, 60],
  yDomain: [0, 130],
  xLabel: "Age (years)",
  yLabel: "Relative hormone level",
  readingGuide:
    "Read across the lifespan. Estrogen holds through the reproductive years then falls at menopause as ovarian follicles run out; with the negative-feedback brake gone, FSH and LH climb sharply. The crossover — estrogen down, gonadotropins up — is the hormonal signature of menopause.",
  controls: [
    { key: "age", label: "Age (cursor)", min: 20, max: 60, step: 0.5, defaultValue: 48, unit: "yr" },
    { key: "menoAge", label: "Menopause age", min: 38, max: 58, step: 1, defaultValue: 51, unit: "yr" }
  ],
  buildSeries: (values) => [
    {
      id: "fsh",
      label: "FSH",
      colorVar: "var(--ph-curve-4)",
      strokeWidth: 3,
      data: makeRange(20, 60, 0.5).map((x) => ({ x, y: fshAt(x, values.menoAge) }))
    },
    {
      id: "estradiol",
      label: "Estradiol",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(20, 60, 0.5).map((x) => ({ x, y: estradiolAt(x, values.menoAge) }))
    },
    {
      id: "inhibin",
      label: "Inhibin B",
      colorVar: "var(--ph-curve-2)",
      strokeWidth: 2,
      data: makeRange(20, 60, 0.5).map((x) => ({ x, y: inhibinAt(x, values.menoAge) }))
    },
    {
      id: "amh",
      label: "AMH / follicle reserve",
      colorVar: "var(--ph-curve-6)",
      strokeWidth: 2,
      dashed: true,
      data: makeRange(20, 60, 0.5).map((x) => ({ x, y: reserve(x, values.menoAge) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.menoAge, y: 8, label: "menopause" },
    { x: values.age, y: fshAt(values.age, values.menoAge), label: "FSH now" }
  ],
  getCursorX: (values) => values.age,
  summarize: (values) => {
    const fsh = fshAt(values.age, values.menoAge);
    const e2 = estradiolAt(values.age, values.menoAge);
    const r = reserve(values.age, values.menoAge);
    const phase =
      values.age >= values.menoAge + 1
        ? "Postmenopause — low estradiol, high FSH"
        : Math.abs(values.age - values.menoAge) <= 4
          ? "Perimenopause (menopausal transition) — rising FSH, fluctuating estradiol"
          : values.menoAge < 40
            ? "Premature ovarian insufficiency trajectory (<40)"
            : "Reproductive years — stable cycling";
    return {
      state: phase,
      body: "FSH rises FIRST and is the clinical marker of the transition (a persistently elevated FSH > 25 IU/L with amenorrhea defines menopause). AMH and inhibin B fall earliest (best ovarian-reserve markers); estradiol falls LAST, which is why vasomotor symptoms, urogenital atrophy, and accelerated bone loss cluster around and after the final menstrual period. Menopause < 40 = premature ovarian insufficiency; smoking advances it ~2 years.",
      readouts: [
        { label: "Age", value: `${values.age.toFixed(0)} yr` },
        { label: "FSH", value: `${fsh.toFixed(0)} IU/L` },
        { label: "Estradiol", value: `${e2.toFixed(0)}` },
        { label: "Reserve", value: `${r.toFixed(0)}%` },
        { label: "Menopause", value: `${values.menoAge.toFixed(0)} yr` }
      ],
      warning:
        values.menoAge < 40
          ? "Edge state: menopause < 40 = premature ovarian insufficiency — evaluate for Turner/fragile-X/autoimmune; estrogen therapy to protect bone + cardiovascular health."
          : values.age > values.menoAge + 2 && e2 < 25
            ? "Edge state: sustained hypoestrogenism — osteoporosis and cardiovascular risk rise; weigh menopausal hormone therapy."
            : undefined
    };
  }
};

export default function MenopauseTransitionWidget() {
  return <CurveLabWidget config={config} />;
}
