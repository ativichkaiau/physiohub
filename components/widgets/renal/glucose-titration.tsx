"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Renal glucose titration.
 *   filtered  = GFR × plasma glucose        (a straight line)
 *   reabsorbed = filtered up to a transport maximum (Tm ≈ 375 mg/min), with a
 *               SPLAY near the threshold because nephrons vary
 *   excreted   = filtered − reabsorbed       (zero until the threshold ~200 mg/dL)
 * SGLT2 inhibitors lower the effective Tm, so glucosuria appears at normal
 * plasma glucose — the mechanism behind the glucosuric diabetes drugs.
 */
function rates(plasma: number, gfrMlMin: number, tm: number) {
  const gfrDl = gfrMlMin / 100; // mL/min → dL/min so filtered comes out in mg/min
  const filtered = plasma * gfrDl;
  // Soft-plus gives the physiologic splay: excretion eases in around Tm.
  const splay = 45;
  const excreted = splay * Math.log(1 + Math.exp((filtered - tm) / splay));
  const reabsorbed = filtered - excreted;
  return { filtered, reabsorbed: clamp(reabsorbed, 0, filtered), excreted: clamp(excreted, 0, filtered) };
}

const config: CurveLabConfig = {
  diagramId: "renal/glucose-titration",
  title: "Renal glucose titration (Tm, threshold, splay)",
  xDomain: [0, 600],
  yDomain: [0, 800],
  xLabel: "Plasma glucose (mg/dL)",
  yLabel: "Rate (mg/min)",
  readingGuide:
    "Filtered glucose (the straight line) rises with plasma glucose. Below the THRESHOLD every bit is reabsorbed, so excretion is flat at zero. Once the filtered load nears the transport maximum (Tm), reabsorption plateaus and glucose spills into the urine — the curved 'splay' is because nephrons saturate at slightly different points. SGLT2 inhibitors lower Tm and shift spillage left.",
  bands: [
    { axis: "x", from: 0, to: 200, tone: "ok", label: "all reabsorbed" },
    { axis: "x", from: 200, to: 350, tone: "warn", label: "splay / threshold" },
    { axis: "x", from: 350, to: 600, tone: "danger", label: "glucosuria" }
  ],
  controls: [
    { key: "plasma", label: "Plasma glucose marker", min: 0, max: 600, step: 5, defaultValue: 100, unit: "mg/dL" },
    { key: "gfr", label: "GFR", min: 60, max: 180, step: 5, defaultValue: 125, unit: "mL/min" },
    { key: "tm", label: "Reabsorption Tm (SGLT2)", min: 120, max: 450, step: 5, defaultValue: 375, unit: "mg/min" }
  ],
  buildSeries: (values) => [
    {
      id: "filtered",
      label: "Filtered",
      colorVar: "var(--ph-curve-5)",
      strokeWidth: 2.5,
      data: makeRange(0, 600, 5).map((p) => ({ x: p, y: rates(p, values.gfr, values.tm).filtered }))
    },
    {
      id: "reabsorbed",
      label: "Reabsorbed",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0, 600, 5).map((p) => ({ x: p, y: rates(p, values.gfr, values.tm).reabsorbed }))
    },
    {
      id: "excreted",
      label: "Excreted",
      colorVar: "var(--ph-curve-4)",
      strokeWidth: 3,
      data: makeRange(0, 600, 5).map((p) => ({ x: p, y: rates(p, values.gfr, values.tm).excreted }))
    }
  ],
  buildAnnotations: (values) => {
    const r = rates(values.plasma, values.gfr, values.tm);
    return [
      { x: values.plasma, y: r.filtered, label: "filtered" },
      { x: values.plasma, y: r.excreted, label: "excreted" }
    ];
  },
  getCursorX: (values) => values.plasma,
  summarize: (values) => {
    const r = rates(values.plasma, values.gfr, values.tm);
    const glucosuria = r.excreted > 5;
    return {
      state:
        glucosuria
          ? "Glucosuria — filtered load exceeds reabsorptive capacity"
          : values.plasma > 160
            ? "Approaching threshold — splay region"
            : "All filtered glucose reabsorbed",
      body: "Reabsorption follows filtration until the transport maximum saturates; beyond the threshold (~200 mg/dL at normal Tm and GFR) glucose is excreted. Lowering Tm — pharmacologically with SGLT2 inhibitors, or in pregnancy — produces glucosuria at lower plasma glucose.",
      readouts: [
        { label: "Filtered", value: `${r.filtered.toFixed(0)} mg/min` },
        { label: "Reabsorbed", value: `${r.reabsorbed.toFixed(0)} mg/min` },
        { label: "Excreted", value: `${r.excreted.toFixed(0)} mg/min` },
        { label: "Glucosuria", value: glucosuria ? "yes" : "no" }
      ],
      warning:
        values.plasma > 400 && r.excreted > 150
          ? "Edge state: heavy glucosuria — osmotic diuresis drives polyuria, dehydration, and electrolyte loss (the classic DKA / HHS picture)."
          : values.tm < 200 && r.excreted > 5 && values.plasma < 150
            ? "Edge state: low Tm (SGLT2 inhibitor) — glucosuria at normal glucose; expect volume loss and a genital-mycotic-infection risk."
            : undefined
    };
  }
};

export default function GlucoseTitrationWidget() {
  return <CurveLabWidget config={config} />;
}
