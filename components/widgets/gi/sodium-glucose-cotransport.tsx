"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

/**
 * SGLT1 in the enterocyte brush border cotransports glucose WITH sodium
 * (2 Na⁺ : 1 glucose), and water follows the absorbed solute osmotically. This
 * is why oral rehydration solution (ORS) works even in secretory diarrhoea:
 * cholera toxin locks CFTR open and pours Cl⁻/water into the lumen, but the
 * glucose–Na cotransporter is INTACT, so glucose + salt still drive net water
 * absorption. Glucose alone (no Na) or Na alone (no glucose) does far less.
 */
function netWaterAbsorption(glucose: number, sodium: number, sglt1: number, secretion: number) {
  // Coupled uptake ∝ SGLT1 activity × (glucose saturation) × (Na availability).
  const km = 6; // mM, brush-border SGLT1 affinity for glucose
  const glucoseSat = glucose / (glucose + km);
  const naFactor = sodium / (sodium + 25);
  const uptake = (sglt1 / 100) * 100 * glucoseSat * naFactor; // absorptive drive
  const secreted = (secretion / 100) * 85; // CFTR-driven fluid loss into lumen
  return clamp(uptake - secreted, -80, 100);
}

const config: CurveLabConfig = {
  diagramId: "gi/sodium-glucose-cotransport",
  title: "Na⁺–glucose cotransport and oral rehydration",
  xDomain: [0, 140],
  yDomain: [-80, 100],
  xLabel: "Luminal glucose (mM)",
  yLabel: "Net water absorption (relative)",
  readingGuide:
    "SGLT1 pulls glucose and sodium in together, and water follows. Slide luminal glucose up and net absorption rises toward a plateau — but only if sodium is present. In secretory diarrhoea (cholera) the curve sits lower because CFTR is dumping fluid out, yet glucose + salt still pull the line back above zero: the rationale for oral rehydration.",
  bands: [
    { axis: "y", from: 0, to: 100, tone: "ok", label: "net absorption" },
    { axis: "y", from: -80, to: 0, tone: "danger", label: "net secretion (fluid loss)" }
  ],
  controls: [
    { key: "glucose", label: "Luminal glucose marker", min: 0, max: 140, step: 1, defaultValue: 75, unit: "mM" },
    { key: "sodium", label: "Luminal sodium", min: 0, max: 140, step: 1, defaultValue: 90, unit: "mM" },
    { key: "sglt1", label: "SGLT1 activity", min: 0, max: 120, step: 1, defaultValue: 100, unit: "%" },
    { key: "secretion", label: "Secretory load (cholera / CFTR)", min: 0, max: 100, step: 1, defaultValue: 0, unit: "%" }
  ],
  buildSeries: (values) => [
    {
      id: "current",
      label: "Current",
      colorVar: "var(--ph-curve-1)",
      strokeWidth: 3,
      data: makeRange(0, 140, 2).map((g) => ({ x: g, y: netWaterAbsorption(g, values.sodium, values.sglt1, values.secretion) }))
    }
  ],
  buildReferenceSeries: (values) => [
    {
      id: "no-na",
      label: "Sugar only (no salt)",
      colorVar: "var(--ph-curve-4)",
      dashed: true,
      data: makeRange(0, 140, 2).map((g) => ({ x: g, y: netWaterAbsorption(g, 5, values.sglt1, values.secretion) }))
    },
    {
      id: "healthy",
      label: "Healthy gut (no secretion)",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: makeRange(0, 140, 2).map((g) => ({ x: g, y: netWaterAbsorption(g, values.sodium, values.sglt1, 0) }))
    }
  ],
  buildAnnotations: (values) => [
    { x: values.glucose, y: netWaterAbsorption(values.glucose, values.sodium, values.sglt1, values.secretion), label: "operating point" }
  ],
  getCursorX: (values) => values.glucose,
  summarize: (values) => {
    const net = netWaterAbsorption(values.glucose, values.sodium, values.sglt1, values.secretion);
    return {
      state:
        values.secretion > 50 && net > 0
          ? "Secretory diarrhoea rescued — ORS still absorbs (SGLT1 intact)"
          : net < 0
            ? "Net secretion — losing fluid to the lumen"
            : values.sodium < 20
              ? "Sugar without salt — weak cotransport, little water gain"
              : "Net absorption — glucose + Na pulling water in",
      body: "SGLT1 cotransports glucose with Na⁺, and water follows osmotically. ORS pairs glucose with sodium so absorption continues even when cholera toxin (via CFTR) is driving secretion — the transporter it exploits is untouched by the toxin.",
      readouts: [
        { label: "Net water", value: net.toFixed(0) },
        { label: "Glucose", value: `${values.glucose.toFixed(0)} mM` },
        { label: "Sodium", value: `${values.sodium.toFixed(0)} mM` },
        { label: "Secretion", value: `${values.secretion.toFixed(0)}%` }
      ],
      warning:
        net < -30
          ? "Edge state: heavy secretion outpacing absorption — ongoing dehydration; escalate ORS volume or move to IV fluids."
          : values.glucose > 120 && values.sodium < 40
            ? "Edge state: very sugary, low-salt fluid — a hyperosmolar drink can WORSEN osmotic diarrhoea. ORS is deliberately near-isotonic."
            : undefined
    };
  }
};

export default function SodiumGlucoseCotransportWidget() {
  return <CurveLabWidget config={config} />;
}
