"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, lineSeries } from "@/components/widgets/widgetUtils";

const estrogen = lineSeries([
  [1, 18],
  [6, 35],
  [10, 72],
  [13, 105],
  [15, 45],
  [21, 70],
  [28, 22]
]);

const progesterone = lineSeries([
  [1, 8],
  [12, 10],
  [15, 22],
  [21, 95],
  [26, 55],
  [28, 12]
]);

const lh = lineSeries([
  [1, 10],
  [12, 18],
  [14, 115],
  [15, 35],
  [28, 10]
]);

const fsh = lineSeries([
  [1, 28],
  [7, 18],
  [14, 50],
  [18, 16],
  [28, 22]
]);

const endometrium = lineSeries([
  [1, 12],
  [5, 10],
  [10, 45],
  [14, 62],
  [21, 92],
  [27, 100],
  [28, 26]
]);

const config: TimelineLabConfig = {
  diagramId: "repro/menstrual-cycle",
  title: "Menstrual cycle hormone timeline",
  duration: 28,
  xLabel: "cycle day",
  yLabel: "relative level",
  yDomain: [0, 120],
  series: [
    { id: "e2", label: "Estrogen", data: estrogen, colorVar: "var(--ph-curve-1)" },
    { id: "p4", label: "Progesterone", data: progesterone, colorVar: "var(--ph-curve-2)" },
    { id: "lh", label: "LH", data: lh, colorVar: "var(--ph-curve-3)" },
    { id: "fsh", label: "FSH", data: fsh, colorVar: "var(--ph-curve-4)" },
    { id: "endo", label: "Endometrium", data: endometrium, colorVar: "var(--ph-curve-ref)" }
  ],
  phases: [
    { start: 0, end: 5, title: "Menses", body: "Progesterone and estrogen are low; the functional endometrium is shed." },
    { start: 5, end: 13, title: "Follicular phase", body: "Follicular estrogen rises and proliferates the endometrium." },
    { start: 13, end: 15, title: "Ovulation", body: "The LH surge triggers ovulation near mid-cycle." },
    { start: 15, end: 26, title: "Luteal phase", body: "Progesterone from the corpus luteum supports secretory endometrium." },
    { start: 26, end: 28, title: "Late luteal fall", body: "Hormone withdrawal destabilizes the endometrium and resets the cycle." }
  ],
  readout: (time) => [
    { label: "Day", value: time.toFixed(1) },
    { label: "E2", value: `${interpolate(estrogen, time).toFixed(0)}` },
    { label: "P4", value: `${interpolate(progesterone, time).toFixed(0)}` },
    { label: "LH", value: `${interpolate(lh, time).toFixed(0)}` }
  ]
};

export default function MenstrualCycleWidget() {
  return <TimelineLabWidget config={config} />;
}
