"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";

/**
 * Ureteral peristalsis: smooth-muscle waves originating from PACEMAKER cells
 * in the renal pelvis (calyceal-pelvic junction) propagate distally at
 * 2–6 cm/s, generating pressures of 20–80 cm H₂O to deliver urine boluses
 * to the bladder. Rate ~2–6 contractions/minute.
 *
 * Outflow obstruction (stone, tumor, retroperitoneal fibrosis) raises
 * proximal pressures behind the block → hydronephrosis if sustained.
 */
const DURATION = 12;

// Proximal ureter pressure waveform
const proximal = Array.from({ length: 121 }).map((_, i) => {
  const t = i / 10;
  const phase = (t % 6) - 0.5;
  const pressure = 8 + 55 * Math.exp(-Math.pow(phase - 1.5, 2) / 0.4) * (phase > 0 ? 1 : 0);
  return { x: t, y: pressure };
});

// Mid ureter — same wave delayed
const mid = Array.from({ length: 121 }).map((_, i) => {
  const t = i / 10;
  const phase = (t % 6) - 1.7;
  const pressure = 6 + 50 * Math.exp(-Math.pow(phase - 1.5, 2) / 0.4) * (phase > 0 ? 1 : 0);
  return { x: t, y: pressure };
});

// Distal / intramural ureter — further delayed
const distal = Array.from({ length: 121 }).map((_, i) => {
  const t = i / 10;
  const phase = (t % 6) - 2.9;
  const pressure = 5 + 45 * Math.exp(-Math.pow(phase - 1.5, 2) / 0.4) * (phase > 0 ? 1 : 0);
  return { x: t, y: pressure };
});

// Bladder jet — urine arriving in pulses
const bladderJet = Array.from({ length: 121 }).map((_, i) => {
  const t = i / 10;
  const phase = (t % 6) - 4.0;
  const jet = 80 * Math.exp(-Math.pow(phase - 0.8, 2) / 0.3) * (phase > 0 ? 1 : 0);
  return { x: t, y: jet };
});

const config: TimelineLabConfig = {
  diagramId: "renal/ureteral-peristalsis",
  title: "Ureteral peristalsis — pacemaker wave from pelvis to bladder",
  duration: DURATION,
  xLabel: "time (s)",
  yLabel: "pressure (cm H₂O) · jet velocity",
  readingGuide:
    "Scrub the pacemaker wave from renal pelvis to bladder. A contraction sweeps urine down as a bolus, pressure peaks travel in sequence, and the ureterovesical jet fires when the wave reaches the bladder. An obstructing stone backs pressure up behind the block — watch the proximal pressure climb.",
  yDomain: [-10, 100],
  series: [
    { id: "proximal", label: "Proximal ureter (pelvis)", data: proximal, colorVar: "var(--ph-curve-4)" },
    { id: "mid", label: "Mid ureter", data: mid, colorVar: "var(--ph-curve-2)" },
    { id: "distal", label: "Distal ureter (intramural)", data: distal, colorVar: "var(--ph-curve-1)" },
    { id: "jet", label: "Ureteral jet into bladder", data: bladderJet, colorVar: "var(--ph-curve-6)" }
  ],
  phases: [
    { start: 0, end: 1, title: "Pacemaker depolarisation", body: "Interstitial cells of Cajal-like pacemaker cells at the pelvi-ureteric junction generate spontaneous action potentials." },
    { start: 1, end: 3, title: "Propagation — proximal ureter", body: "Wave depolarises ureteral smooth muscle distally at 2–6 cm/s. Calcium-dependent contraction generates 50–80 cm H₂O pressure proximally." },
    { start: 3, end: 5, title: "Propagation — mid ureter + bolus formation", body: "Pressure wave traps urine into a discrete bolus, isolated from the pelvis by a closed segment behind." },
    { start: 5, end: 7, title: "Distal arrival + UVJ opening", body: "Intramural ureteric tunnel (Waldeyer's sheath) flap-valve mechanism opens with the bolus. Ureterovesical junction (UVJ) opens transiently." },
    { start: 7, end: 9, title: "Bolus ejected into bladder", body: "Bolus enters bladder as a ureteral JET (audible on cystoscopy, visible on Doppler). Velocity ~10–30 cm/s." },
    { start: 9, end: DURATION, title: "Refractory + next wave priming", body: "Smooth muscle refractory. Pacemaker re-primes for next contraction (cycle ~6 s = 10/min rate)." }
  ],
  readout: (time) => {
    const p = proximal.find((q) => Math.abs(q.x - time) < 0.06)?.y ?? 8;
    const m = mid.find((q) => Math.abs(q.x - time) < 0.06)?.y ?? 6;
    const d = distal.find((q) => Math.abs(q.x - time) < 0.06)?.y ?? 5;
    const j = bladderJet.find((q) => Math.abs(q.x - time) < 0.06)?.y ?? 0;
    return [
      { label: "Proximal", value: `${p.toFixed(0)} cm H₂O` },
      { label: "Mid", value: `${m.toFixed(0)} cm H₂O` },
      { label: "Distal", value: `${d.toFixed(0)} cm H₂O` },
      { label: "Jet", value: `${j.toFixed(0)}` }
    ];
  }
};

export default function UreteralPeristalsisWidget() {
  return <TimelineLabWidget config={config} />;
}
