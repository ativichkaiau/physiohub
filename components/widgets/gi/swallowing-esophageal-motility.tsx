"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";

/**
 * Three phases of swallowing:
 *   ORAL (0–1 s, voluntary): tongue pushes bolus into pharynx.
 *   PHARYNGEAL (1–2 s, reflex via CN IX, X): soft palate elevates, larynx
 *     elevates and closes, UES relaxes, pharyngeal constrictors fire.
 *     Fastest phase — apnea + airway protection.
 *   ESOPHAGEAL (2–10 s, peristaltic): primary peristaltic wave traverses
 *     ~25 cm at 3–4 cm/s. LES (lower esophageal sphincter) relaxes to
 *     receive bolus into stomach.
 */
const DURATION = 10;

const ues = Array.from({ length: 101 }).map((_, i) => {
  const t = i / 10;
  // UES tonically contracted at 30 mmHg; relaxes during pharyngeal phase
  if (t < 1) return { x: t, y: 30 };
  if (t < 2) return { x: t, y: 30 - (t - 1) * 28 };
  if (t < 2.3) return { x: t, y: 2 };
  if (t < 2.8) return { x: t, y: 2 + (t - 2.3) * 56 };
  return { x: t, y: 30 };
});

const peristalticWave = Array.from({ length: 101 }).map((_, i) => {
  const t = i / 10;
  // Wave position along esophagus (0 = UES, 25 = LES)
  if (t < 2) return { x: t, y: 0 };
  if (t < 9) return { x: t, y: ((t - 2) / 7) * 25 };
  return { x: t, y: 25 };
});

const les = Array.from({ length: 101 }).map((_, i) => {
  const t = i / 10;
  // LES tonically contracted at 20 mmHg; relaxes ahead of bolus (receptive relaxation)
  if (t < 2.5) return { x: t, y: 20 };
  if (t < 4) return { x: t, y: 20 - (t - 2.5) * 12 };
  if (t < 8.5) return { x: t, y: 2 };
  if (t < 9.2) return { x: t, y: 2 + (t - 8.5) * 26 };
  return { x: t, y: 20 };
});

const bolusInEsophagus = Array.from({ length: 101 }).map((_, i) => {
  const t = i / 10;
  // 100 = full bolus volume, 0 = bolus delivered to stomach
  if (t < 2) return { x: t, y: 100 };
  if (t < 9) return { x: t, y: 100 - ((t - 2) / 7) * 100 };
  return { x: t, y: 0 };
});

const config: TimelineLabConfig = {
  diagramId: "gi/swallowing-esophageal-motility",
  title: "Swallowing & esophageal peristalsis — UES · wave · LES",
  duration: DURATION,
  xLabel: "time (s)",
  yLabel: "pressure (mmHg) · position (cm)",
  yDomain: [-5, 50],
  series: [
    { id: "ues", label: "UES pressure (mmHg)", data: ues, colorVar: "var(--ph-curve-4)" },
    { id: "les", label: "LES pressure (mmHg)", data: les, colorVar: "var(--ph-curve-2)" },
    { id: "wave", label: "Peristaltic wave position (cm)", data: peristalticWave, colorVar: "var(--ph-curve-1)" },
    { id: "bolus", label: "Bolus remaining (%)", data: bolusInEsophagus, colorVar: "var(--ph-curve-6)" }
  ],
  phases: [
    { start: 0, end: 1, title: "Oral phase (voluntary)", body: "Tongue compresses bolus against hard palate and pushes it posteriorly. CN V, VII, XII. Only phase under voluntary control." },
    { start: 1, end: 2, title: "Pharyngeal phase (reflex)", body: "Soft palate elevates (closes nasopharynx); vocal cords adduct + epiglottis flips (airway); UES relaxes; pharyngeal constrictors fire sequentially. CN IX, X. ~1 second of apnea." },
    { start: 2, end: 5, title: "Primary peristalsis — upper esophagus", body: "Striated muscle in upper 1/3 driven by vagal LOWER MOTOR neurons (somatic). Wave propagates at ~3–4 cm/s. LES begins receptive relaxation." },
    { start: 5, end: 9, title: "Primary peristalsis — lower esophagus", body: "Smooth muscle in lower 2/3 — myenteric plexus + vagal preganglionics. Wave delivers bolus toward stomach." },
    { start: 9, end: DURATION, title: "Bolus in stomach + sphincters re-tone", body: "LES re-contracts to prevent reflux. UES re-tone (~30 mmHg). Secondary peristalsis would clear any residual bolus." }
  ],
  readout: (time) => {
    const u = ues.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 30;
    const l = les.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 20;
    const w = peristalticWave.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 0;
    const b = bolusInEsophagus.find((p) => Math.abs(p.x - time) < 0.06)?.y ?? 100;
    return [
      { label: "UES", value: `${u.toFixed(0)} mmHg` },
      { label: "LES", value: `${l.toFixed(0)} mmHg` },
      { label: "Wave", value: `${w.toFixed(0)} cm` },
      { label: "Bolus", value: `${b.toFixed(0)}%` }
    ];
  }
};

export default function SwallowingEsophagealMotilityWidget() {
  return <TimelineLabWidget config={config} />;
}
