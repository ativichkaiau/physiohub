"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";

/**
 * Peristaltic reflex — coordinated by the enteric nervous system (Auerbach's
 * myenteric plexus). A bolus distends the gut and triggers:
 *   ABOVE the bolus: substance P / ACh from ascending interneurons → smooth
 *     muscle contraction (orad). This pushes the bolus aboral.
 *   BELOW the bolus: VIP + NO from descending interneurons → smooth muscle
 *     relaxation (receptive). The lumen widens to receive the bolus.
 *
 * Net result: a peristaltic wave that carries the bolus distally at
 * ~2–25 cm/s depending on segment (slowest in the colon).
 */
const DURATION = 6;

const oradContraction = Array.from({ length: 61 }).map((_, i) => {
  const t = i / 10;
  // Substance P / ACh-driven contraction wave, peaks 1.5–2.5 s
  const intensity = 100 * Math.exp(-Math.pow(t - 2, 2) / 0.7) * (t > 0.3 ? 1 : t / 0.3);
  return { x: t, y: intensity };
});

const caudadRelaxation = Array.from({ length: 61 }).map((_, i) => {
  const t = i / 10;
  // VIP / NO-mediated relaxation — drops below baseline
  const drop = -55 * Math.exp(-Math.pow(t - 2.8, 2) / 1.2) * (t > 0.4 ? 1 : t / 0.4);
  return { x: t, y: 50 + drop };
});

const bolusPosition = Array.from({ length: 61 }).map((_, i) => {
  const t = i / 10;
  // Bolus travels distally as the wave passes
  return { x: t, y: 10 + t * 14 };
});

const config: TimelineLabConfig = {
  diagramId: "gi/peristalsis",
  title: "Peristaltic wave — orad contraction · caudad relaxation · bolus position",
  duration: DURATION,
  xLabel: "time (s)",
  yLabel: "intensity (% / cm)",
  readingGuide:
    "Scrub the bolus down the gut. Just ahead of it the wall relaxes (receptive, caudad) while just behind it contracts (orad) — that contract-above / relax-below pattern is the peristaltic reflex, and it is what drives the bolus forward. Watch the two waves travel together.",
  yDomain: [-20, 110],
  series: [
    { id: "orad", label: "Orad contraction (Sub-P, ACh)", data: oradContraction, colorVar: "var(--ph-curve-4)" },
    { id: "caudad", label: "Caudad relaxation (VIP, NO)", data: caudadRelaxation, colorVar: "var(--ph-curve-6)" },
    { id: "bolus", label: "Bolus position (cm)", data: bolusPosition, colorVar: "var(--ph-curve-1)" }
  ],
  phases: [
    { start: 0, end: 0.5, title: "Distention sensed", body: "Mechanoreceptors in the mucosa detect stretch and serotonin release from enterochromaffin cells. Reflex circuit engages." },
    { start: 0.5, end: 1.5, title: "Ascending excitation primed", body: "Interneurons synapse on orad smooth muscle. ACh + substance P begin contraction above the bolus." },
    { start: 1.5, end: 3.0, title: "Peak peristaltic wave", body: "Coordinated orad contraction + caudad relaxation propel the bolus aboral. This is the iconic peristaltic wave." },
    { start: 3.0, end: 4.5, title: "Wave propagation", body: "The circuit slides distally — what was 'below the bolus' becomes 'above' for the next segment. Slow wave continues." },
    { start: 4.5, end: DURATION, title: "Refractory + recovery", body: "Local segment refractory. Bolus continues into the next reflex unit. Migrating motor complex (MMC) in fasted state, segmentation in fed state." }
  ],
  readout: (time) => {
    const orad = oradContraction.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 0;
    const caud = caudadRelaxation.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 50;
    const bol = bolusPosition.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 10;
    return [
      { label: "Orad", value: `${orad.toFixed(0)}%` },
      { label: "Caudad", value: `${caud.toFixed(0)}%` },
      { label: "Bolus", value: `${bol.toFixed(0)} cm` },
      { label: "t", value: `${time.toFixed(1)} s` }
    ];
  }
};

export default function PeristalsisWidget() {
  return <TimelineLabWidget config={config} />;
}
