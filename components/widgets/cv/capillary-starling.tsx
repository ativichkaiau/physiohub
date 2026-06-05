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
  controls: [
    { key: "pcArt", label: "Pc — arterial end", min: 20, max: 55, step: 1, defaultValue: 35, unit: "mmHg" },
    { key: "pi", label: "Pi — interstitial hydrostatic", min: -5, max: 10, step: 1, defaultValue: 0, unit: "mmHg" },
    { key: "oncoticPlasma", label: "πc — plasma oncotic", min: 10, max: 35, step: 1, defaultValue: 25, unit: "mmHg" },
    { key: "oncoticInterstitial", label: "πi — interstitial oncotic", min: 0, max: 12, step: 1, defaultValue: 3, unit: "mmHg" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Net Jv",
      colorVar: "var(--ph-curve-1)",
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
  ],
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
    return {
      state:
        values.oncoticPlasma < 16
          ? "Hypo-oncotic edema (low πc)"
          : values.pi < -2
            ? "Negative interstitial pressure — drying tissue"
            : values.pcArt > 45
              ? "Elevated Pc — congestive edema"
              : "Normal filtration → absorption",
      body: "Starling balance along one capillary. The four sliders set the hydrostatic and oncotic forces at each end; the curve crosses zero where filtration switches to absorption. When net filtration exceeds lymphatic clearance, edema develops.",
      readouts: [
        { label: "Jv (art)", value: `${jvArt.toFixed(1)}` },
        { label: "Jv (ven)", value: `${jvVen.toFixed(1)}` },
        { label: "πc − πi", value: `${oncoticGap.toFixed(1)} mmHg` },
        { label: "Pc art", value: `${values.pcArt.toFixed(0)} mmHg` }
      ],
      warning:
        jvVen > 4
          ? "Edge state: net filtration persists through the venous end — lymphatics will be overwhelmed → interstitial edema."
          : values.oncoticPlasma < 14
            ? "Edge state: severe hypoalbuminemia — generalised edema expected."
            : undefined
    };
  }
};

export default function CapillaryStarlingWidget() {
  return <CurveLabWidget config={config} />;
}
