"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * GFR is held nearly constant across a wide range of mean arterial pressure
 * (~80–180 mmHg) by two intrarenal mechanisms:
 *   - MYOGENIC: afferent arteriole contracts when stretched (↑MAP → ↑tone → ↓flow).
 *   - TUBULOGLOMERULAR FEEDBACK (TGF): macula densa in the DCT senses
 *     [NaCl]. ↑filtered load → ↑NaCl at MD → adenosine → afferent
 *     arteriolar constriction → ↓GFR → ↓filtered load. Closed loop.
 *
 * Pharmacology that breaks autoregulation:
 *   - NSAIDs: block afferent PROSTAGLANDIN-mediated DILATION → unopposed
 *     myogenic + TGF tone → AKI especially during hypotension / hypovolemia.
 *   - ACE inhibitors / ARBs: block efferent angiotensin II → efferent dilates
 *     → ↓glomerular pressure → ↓GFR. Critical in BILATERAL RENAL ARTERY STENOSIS
 *     where efferent vasoconstriction maintains GFR.
 */
function gfrAt(map: number, nsaid: number, acei: number) {
  const lower = 80 - acei * 0.3 + nsaid * 0.5;
  const upper = 180 - nsaid * 0.3;
  let gfr: number;
  if (map < lower - 5) {
    gfr = 125 * Math.pow((map / lower), 1.4);
  } else if (map > upper + 5) {
    gfr = 125 + (map - upper) * 0.8;
  } else {
    gfr = 125 - Math.max(0, nsaid * 0.2);
  }
  // ACEi blunts efferent vasoconstriction → some GFR loss across the plateau.
  gfr -= acei * 0.25;
  return clamp(gfr, 0, 260);
}

const config: CurveLabConfig = {
  diagramId: "renal/gfr-autoregulation",
  title: "GFR vs MAP — myogenic + tubuloglomerular feedback",
  xDomain: [40, 220],
  yDomain: [0, 220],
  xLabel: "Mean arterial pressure (mmHg)",
  yLabel: "GFR (mL/min)",
  controls: [
    { key: "map", label: "MAP marker", min: 40, max: 220, step: 1, defaultValue: 95, unit: "mmHg" },
    { key: "nsaid", label: "NSAID (PGE2 block)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" },
    { key: "acei", label: "ACE inhibitor / ARB", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(40, 220, 2).map((x) => ({ x, y: gfrAt(x, values.nsaid, values.acei) }))
    }
  ],
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Healthy autoregulation",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(40, 220, 2).map((x) => ({ x, y: gfrAt(x, 0, 0) }))
    },
    {
      id: "nsaid",
      label: "Full NSAID block",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(40, 220, 2).map((x) => ({ x, y: gfrAt(x, 100, 0) }))
    },
    {
      id: "acei",
      label: "Full ACEi / ARB",
      colorVar: "var(--ph-curve-3)",
      dashed: true,
      data: makeRange(40, 220, 2).map((x) => ({ x, y: gfrAt(x, 0, 100) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.map, y: gfrAt(values.map, values.nsaid, values.acei), label: "operating point" },
    { x: 80, y: 125, label: "plateau lower" },
    { x: 180, y: 125, label: "plateau upper" }
  ],
  getCursorX: (values) => values.map,
  summarize: (values) => {
    const gfr = gfrAt(values.map, values.nsaid, values.acei);
    const lower = 80 - values.acei * 0.3 + values.nsaid * 0.5;
    const upper = 180 - values.nsaid * 0.3;
    const onPlateau = values.map >= lower && values.map <= upper;
    return {
      state:
        values.acei > 60 && values.map < 80
          ? "ACEi / ARB AKI risk — afferent stenosis or pre-renal state"
          : values.nsaid > 60 && values.map < 90
            ? "NSAID AKI — afferent PG-mediated dilation blocked"
            : values.map < lower
              ? "Below autoregulatory plateau — pressure-passive ↓GFR"
              : values.map > upper
                ? "Above autoregulatory plateau — pressure-passive ↑GFR"
                : "On plateau — GFR defended by myogenic + TGF",
      body: "Myogenic and TGF mechanisms together hold GFR flat across MAP 80–180 mmHg in a healthy kidney. NSAIDs block afferent vasodilatory prostaglandins → AKI when MAP drops. ACEi / ARBs block efferent constriction → drop GFR especially in bilateral renal artery stenosis (the kidney was relying on AT II to maintain glomerular pressure).",
      readouts: [
        { label: "GFR", value: `${gfr.toFixed(0)} mL/min` },
        { label: "MAP", value: `${values.map.toFixed(0)} mmHg` },
        { label: "Plateau", value: `${lower.toFixed(0)}–${upper.toFixed(0)} mmHg` },
        { label: "On plateau", value: onPlateau ? "yes" : "no" }
      ],
      warning:
        gfr < 30
          ? "Edge state: GFR < 30 mL/min — CKD stage 4. Consider drug dose adjustments and avoid contrast / nephrotoxins."
          : values.acei > 70 && values.nsaid > 50
            ? "Edge state: triple-whammy — ACEi + NSAID + dehydration → severe AKI risk (add diuretic and you have all four)."
            : values.map < 60
              ? "Edge state: MAP < 60 mmHg — autoregulation can no longer compensate; GFR collapses."
              : undefined
    };
  }
};

export default function GfrAutoregulationWidget() {
  return <CurveLabWidget config={config} />;
}
