"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * The pituitary decodes GnRH PULSE FREQUENCY, not just amount:
 *   - FAST pulses (~1/hr) favour LH.
 *   - SLOW pulses (~1 every 2–4 hr) favour FSH.
 *   - CONTINUOUS (non-pulsatile) GnRH DOWN-REGULATES the receptor → both fall.
 * That paradox is therapeutic: GnRH agonists given continuously (leuprolide)
 * suppress the axis for prostate cancer, endometriosis, precocious puberty, and
 * IVF down-regulation — the opposite of what a "stimulating" hormone should do.
 */
function gonadotropins(freq: number, continuous: number) {
  const downreg = 1 - continuous / 110; // continuous exposure desensitises the gonadotroph
  const lh = clamp(92 * (freq / (freq + 0.5)) * downreg, 0, 100);
  const fsh = clamp((8 + 88 * (0.6 / (freq + 0.6))) * downreg, 0, 100);
  return { lh, fsh };
}

const config: CurveLabConfig = {
  diagramId: "repro/gnrh-pulsatility",
  title: "GnRH pulse frequency decoding (LH vs FSH)",
  xDomain: [0.1, 2],
  yDomain: [0, 100],
  xLabel: "GnRH pulse frequency (pulses/hour)",
  yLabel: "Gonadotropin output (% max)",
  readingGuide:
    "Read pulse frequency left-to-right. SLOW pulses (left) favour FSH; FAST pulses (right) favour LH — the pituitary reads the rhythm, not just the dose. Turn the 'continuous GnRH' control up and BOTH curves collapse: steady exposure desensitises the receptor, which is exactly how GnRH-agonist drugs suppress the axis.",
  bands: [
    { axis: "x", from: 0.1, to: 0.55, tone: "phase", label: "slow → FSH" },
    { axis: "x", from: 0.55, to: 2, tone: "phase", label: "fast → LH" }
  ],
  controls: [
    { key: "freq", label: "Pulse frequency marker", min: 0.1, max: 2, step: 0.05, defaultValue: 1, unit: "/hr" },
    { key: "continuous", label: "Continuous GnRH (agonist Rx)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "lh",
      label: "LH",
      colorVar: "var(--ph-curve-3)",
      strokeWidth: 3,
      data: makeRange(0.1, 2, 0.05).map((f) => ({ x: f, y: gonadotropins(f, values.continuous).lh }))
    },
    {
      id: "fsh",
      label: "FSH",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0.1, 2, 0.05).map((f) => ({ x: f, y: gonadotropins(f, values.continuous).fsh }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "lh-ref",
      label: "LH (pulsatile, no drug)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0.1, 2, 0.05).map((f) => ({ x: f, y: gonadotropins(f, 0).lh }))
    }
  ],
  buildAnnotations: (values) => {
    const g = gonadotropins(values.freq, values.continuous);
    return [
      { x: values.freq, y: g.lh, label: "LH" },
      { x: values.freq, y: g.fsh, label: "FSH" }
    ];
  },
  getCursorX: (values) => values.freq,
  summarize: (values) => {
    const g = gonadotropins(values.freq, values.continuous);
    const ratio = g.fsh > 0 ? g.lh / g.fsh : 0;
    return {
      state:
        values.continuous > 55
          ? "Continuous GnRH — receptor down-regulation, axis suppressed (agonist therapy)"
          : values.freq > 1.1
            ? "Fast pulses — LH-dominant (mid-cycle / ovulatory drive)"
            : values.freq < 0.5
              ? "Slow pulses — FSH-dominant (early folliculogenesis)"
              : "Balanced pulse frequency",
      body: "The gonadotroph decodes GnRH pulse frequency: fast → LH, slow → FSH. Continuous (non-pulsatile) exposure desensitises the receptor and shuts the axis down — the basis of GnRH-agonist therapy and of hypothalamic amenorrhoea when pulsatility is lost.",
      readouts: [
        { label: "LH", value: `${g.lh.toFixed(0)}%` },
        { label: "FSH", value: `${g.fsh.toFixed(0)}%` },
        { label: "LH:FSH", value: ratio.toFixed(2) },
        { label: "Frequency", value: `${values.freq.toFixed(2)} /hr` }
      ],
      warning:
        values.continuous > 70
          ? "Edge state: sustained continuous GnRH — deep suppression (medical castration). Note the initial 'flare' of LH/testosterone before down-regulation sets in."
          : values.freq < 0.25
            ? "Edge state: very slow / absent pulses — hypothalamic hypogonadism (stress, low energy availability, anorexia); amenorrhoea and low bone density follow."
            : undefined
    };
  }
};

export default function GnrhPulsatilityWidget() {
  return <CurveLabWidget config={config} />;
}
