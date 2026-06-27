"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * Capillary Starling forces.
 *   Jv = Kf · [ (Pc − Pi) − σ · (πc − πi) ]
 * Capillary hydrostatic pressure Pc falls linearly from the arterial end
 * (~35 mmHg) to the venous end (~17 mmHg); oncotic forces are roughly
 * constant along the vessel. Net result: filtration at the arterial end,
 * absorption at the venous end, with a switch point in between. Edema is
 * the failure to clear net filtration through lymphatics.
 */
function capillaryHydrostatic(fraction: number, pcArt: number) {
  const pcVen = Math.max(pcArt - 18, 5);
  return pcArt + (pcVen - pcArt) * fraction;
}

function netJv(
  fraction: number,
  pcArt: number,
  pi: number,
  oncoticPlasma: number,
  oncoticInterstitial: number
) {
  const pc = capillaryHydrostatic(fraction, pcArt);
  const sigma = 0.95;
  return (pc - pi) - sigma * (oncoticPlasma - oncoticInterstitial);
}

const config: CurveLabConfig = {
  diagramId: "cv/capillary-starling",
  title: "Net fluid flux along the capillary",
  xDomain: [0, 1],
  yDomain: [-25, 25],
  xLabel: "distance along capillary (arterial → venous)",
  yLabel: "Net Jv (mmHg equivalent)",
  readingGuide:
    "Two forces compete along the capillary: hydrostatic pressure pushes fluid OUT (the steeper, falling line) while oncotic pressure pulls it back IN (the flatter line). Net flux starts outward at the arterial end and crosses below zero near the venous end — the 'switch point' is where filtration becomes reabsorption.",
  controls: [
    { key: "pcArt", label: "Pc — arterial end", min: 20, max: 55, step: 1, defaultValue: 35, unit: "mmHg" },
    { key: "pi", label: "Pi — interstitial hydrostatic", min: -5, max: 10, step: 1, defaultValue: 0, unit: "mmHg" },
    { key: "oncoticPlasma", label: "πc — plasma oncotic", min: 10, max: 35, step: 1, defaultValue: 25, unit: "mmHg" },
    { key: "oncoticInterstitial", label: "πi — interstitial oncotic", min: 0, max: 12, step: 1, defaultValue: 3, unit: "mmHg" }
  ],
  buildSeries: (values) => {
    const sigma = 0.95;
    return [
      {
        // Capillary hydrostatic pressure profile (Pc − Pi) — falls along the capillary.
        id: "hydrostatic",
        label: "Pc − Pi (outward)",
        colorVar: "var(--ph-curve-4)",
        data: makeRange(0, 1, 0.02).map((x) => ({
          x,
          y: capillaryHydrostatic(x, values.pcArt) - values.pi
        }))
      },
      {
        // Net oncotic gradient σ(πc − πi) — mostly constant; opposes filtration.
        id: "oncotic",
        label: "σ(πc − πi) (inward)",
        colorVar: "var(--ph-curve-6)",
        data: makeRange(0, 1, 0.02).map((x) => ({
          x,
          y: sigma * (values.oncoticPlasma - values.oncoticInterstitial)
        }))
      },
      {
        // The resultant — net fluid flux. The eye-catcher.
        id: "current",
        label: "Net Jv",
        colorVar: "var(--ph-curve-1)",
        strokeWidth: 3,
        data: makeRange(0, 1, 0.02).map((x) => ({
          x,
          y: clamp(netJv(x, values.pcArt, values.pi, values.oncoticPlasma, values.oncoticInterstitial), -30, 30)
        }))
      },
      {
        id: "zero",
        label: "Zero flux",
        colorVar: "var(--ph-curve-ref)",
        dashed: true,
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        ]
      }
    ];
  },
  buildReferenceSeries: () => [
    {
      id: "normal",
      label: "Normal (Pc=35, Pi=0, πc=25, πi=3)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 1, 0.02).map((x) => ({
        x,
        y: clamp(netJv(x, 35, 0, 25, 3), -30, 30)
      }))
    }
  ],
  buildAnnotations: (values) => {
    // Find the switch point where Jv crosses zero, if any.
    const samples = makeRange(0, 1, 0.005);
    let crossing: number | null = null;
    for (let i = 1; i < samples.length; i += 1) {
      const a = netJv(samples[i - 1], values.pcArt, values.pi, values.oncoticPlasma, values.oncoticInterstitial);
      const b = netJv(samples[i], values.pcArt, values.pi, values.oncoticPlasma, values.oncoticInterstitial);
      if (a > 0 && b < 0) {
        crossing = samples[i - 1] + (samples[i] - samples[i - 1]) * (a / (a - b));
        break;
      }
    }
    return crossing != null ? [{ x: crossing, y: 0, label: "switch point" }] : [];
  },
  summarize: (values) => {
    const jvArt = netJv(0, values.pcArt, values.pi, values.oncoticPlasma, values.oncoticInterstitial);
    const jvVen = netJv(1, values.pcArt, values.pi, values.oncoticPlasma, values.oncoticInterstitial);
    const oncoticGap = values.oncoticPlasma - values.oncoticInterstitial;
    // Integrate Jv along the capillary to get net daily filtration. Mean Jv
    // is the trapezoid of arterial and venous endpoints over the length.
    const meanJv = (jvArt + jvVen) / 2;
    // Daily net filtration capacity ~ 20 L/day enters interstitium normally,
    // 17 L re-absorbed, 3 L cleared by lymphatics. We scale mean Jv (in mmHg)
    // to L/day using a normalisation tuned so default settings give ~3 L/day net.
    const netFiltrationLday = meanJv * 0.45;
    const lymphCapacity = 4.5; // L/day clearance capacity in healthy tissue
    const edemaMargin = lymphCapacity - netFiltrationLday;
    // Identify named clinical states by which force is misaligned.
    const phenotype =
      values.oncoticPlasma < 16
        ? "Hypo-oncotic edema — nephrotic syndrome / liver failure / kwashiorkor"
        : values.pcArt > 45 && values.pi >= 0
          ? "Hydrostatic (congestive) edema — heart failure / venous obstruction"
          : values.oncoticInterstitial > 8
            ? "High-protein interstitial fluid — lymphatic obstruction (lymphedema)"
            : values.pi < -2
              ? "Negative Pi — dry interstitium (early dehydration, gravity-dependent)"
              : "Normal filtration → absorption balance";
    return {
      state: phenotype,
      body: "Starling balance along one capillary, modulated by lymphatic clearance. Net filtration ≈ 3 L/day in health, cleared by lymphatics (capacity ~4–5 L/day). Edema = sustained filtration in excess of lymph clearance. The reflection coefficient σ ≈ 0.95 means the endothelium is ~95% impermeable to plasma proteins.",
      readouts: [
        { label: "Jv (art)", value: `${jvArt.toFixed(1)} mmHg` },
        { label: "Jv (ven)", value: `${jvVen.toFixed(1)} mmHg` },
        { label: "Net Jv", value: `${netFiltrationLday.toFixed(1)} L/day` },
        { label: "Lymph margin", value: `${edemaMargin.toFixed(1)} L/day` },
        { label: "πc − πi", value: `${oncoticGap.toFixed(1)} mmHg` },
        { label: "Pc art", value: `${values.pcArt.toFixed(0)} mmHg` }
      ],
      warning:
        netFiltrationLday > lymphCapacity
          ? "Edge state: net filtration exceeds lymphatic clearance — interstitial edema accumulates."
          : jvVen > 4
            ? "Edge state: net filtration persists through the venous end (no reabsorption phase) — lymphatic margin is razor-thin."
            : values.oncoticPlasma < 14
              ? "Edge state: severe hypoalbuminemia (πc < 14 mmHg, [Alb] < 2 g/dL) — generalised edema expected."
              : values.oncoticInterstitial > 8
                ? "Edge state: protein-rich interstitium → lymphatic obstruction (lymphedema). Diuretics won't help; manual / surgical lymph drainage required."
                : undefined
    };
  }
};

export default function CapillaryStarlingWidget() {
  return <CurveLabWidget config={config} />;
}
