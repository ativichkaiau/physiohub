"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, lineSeries } from "@/components/widgets/widgetUtils";

// One 24-hour day, hour 0 = midnight. Cortisol (µg/dL), ACTH (pg/mL, scaled),
// and melatonin (relative) — the HPA axis runs on a strong diurnal clock.
const cortisol = lineSeries([
  [0, 5],
  [2, 4],
  [3, 6],
  [5, 12],
  [7, 18],
  [8, 19],
  [10, 14],
  [12, 11],
  [15, 8],
  [18, 6],
  [21, 5],
  [24, 5]
]);

const acth = lineSeries([
  [0, 12],
  [3, 14],
  [5, 30],
  [6.5, 42],
  [8, 34],
  [11, 22],
  [15, 16],
  [20, 12],
  [24, 12]
]);

const melatonin = lineSeries([
  [0, 62],
  [2, 68],
  [4, 55],
  [6, 22],
  [8, 8],
  [12, 4],
  [18, 6],
  [20, 18],
  [22, 42],
  [24, 62]
]);

const config: TimelineLabConfig = {
  diagramId: "endo/cortisol-circadian-rhythm",
  title: "Cortisol circadian rhythm",
  duration: 24,
  xLabel: "time of day (h)",
  yLabel: "hormone level (scaled)",
  readingGuide:
    "Scrub across one day. ACTH drives cortisol, which peaks in the early morning (~8 am) and bottoms out near midnight — so timing matters: a 'high' cortisol at 8 am is normal, the same value at midnight is not. Melatonin runs the opposite way, rising for sleep. Loss of this rhythm (a high midnight cortisol) is a hallmark of Cushing syndrome.",
  yDomain: [0, 75],
  series: [
    { id: "cortisol", label: "Cortisol (µg/dL)", data: cortisol, colorVar: "var(--ph-curve-2)" },
    { id: "acth", label: "ACTH (pg/mL)", data: acth, colorVar: "var(--ph-curve-1)" },
    { id: "melatonin", label: "Melatonin (rel.)", data: melatonin, colorVar: "var(--ph-curve-6)" }
  ],
  phases: [
    { start: 0, end: 3, title: "Midnight nadir", body: "Cortisol is at its lowest — the quiet HPA window. A late-night salivary cortisol that is NOT low suggests Cushing syndrome." },
    { start: 3, end: 6, title: "Pre-waking surge", body: "ACTH climbs and drives the cortisol awakening response before you get up, mobilising fuel for the day." },
    { start: 6, end: 9, title: "Morning peak", body: "Cortisol tops out around 8 am — the standard time to draw a morning cortisol and to time replacement dosing." },
    { start: 9, end: 18, title: "Daytime decline", body: "Cortisol tapers steadily through the day as ACTH drive falls." },
    { start: 18, end: 24, title: "Evening trough", body: "Cortisol settles low while melatonin rises to initiate sleep." }
  ],
  readout: (time) => [
    { label: "Time", value: `${time.toFixed(1)} h` },
    { label: "Cortisol", value: `${interpolate(cortisol, time).toFixed(0)} µg/dL` },
    { label: "ACTH", value: `${interpolate(acth, time).toFixed(0)} pg/mL` },
    { label: "Melatonin", value: `${interpolate(melatonin, time).toFixed(0)}` }
  ]
};

export default function CortisolCircadianRhythmWidget() {
  return <TimelineLabWidget config={config} />;
}
