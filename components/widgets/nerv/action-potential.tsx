"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, lineSeries } from "@/components/widgets/widgetUtils";

const voltage = lineSeries([
  [0, -70],
  [1.0, -70],
  [1.35, -55],
  [1.65, 35],
  [2.2, -20],
  [2.8, -82],
  [3.7, -74],
  [5, -70]
]);

const sodium = lineSeries([
  [0, 0],
  [1.1, 0],
  [1.45, 18],
  [1.75, 38],
  [2.1, 10],
  [2.6, 2],
  [5, 0]
]);

const potassium = lineSeries([
  [0, 0],
  [1.4, 0],
  [2.0, 10],
  [2.6, 28],
  [3.2, 22],
  [4.2, 6],
  [5, 0]
]);

const config: TimelineLabConfig = {
  diagramId: "nerv/action-potential",
  title: "Action potential timeline",
  duration: 5,
  xLabel: "time (ms)",
  yLabel: "mV / relative conductance",
  readingGuide:
    "Scrub through the spike and watch the conductances drive the voltage. Fast Na⁺ channels open → rapid upstroke; they inactivate as slower K⁺ channels open → repolarization; lingering K⁺ conductance → the after-hyperpolarization. The refractory period is the window where Na⁺ channels are still inactivated.",
  yDomain: [-100, 50],
  series: [
    { id: "vm", label: "Membrane voltage", data: voltage, colorVar: "var(--ph-curve-1)", sharp: true },
    { id: "na", label: "Na conductance", data: sodium, colorVar: "var(--ph-curve-2)" },
    { id: "k", label: "K conductance", data: potassium, colorVar: "var(--ph-curve-3)" }
  ],
  phases: [
    { start: 0, end: 1.25, title: "Resting state", body: "Voltage-gated channels are mostly closed; leak conductance holds the membrane near rest." },
    { start: 1.25, end: 1.75, title: "Depolarization", body: "Voltage-gated sodium channels open rapidly and drive the upstroke." },
    { start: 1.75, end: 2.7, title: "Repolarization", body: "Sodium channels inactivate while potassium conductance rises." },
    { start: 2.7, end: 3.8, title: "After-hyperpolarization", body: "Potassium channels close slowly, pulling the membrane below rest." },
    { start: 3.8, end: 5, title: "Recovery", body: "Conductances return toward baseline and excitability recovers." }
  ],
  readout: (time) => [
    { label: "Vm", value: `${interpolate(voltage, time).toFixed(0)} mV` },
    { label: "Na", value: `${interpolate(sodium, time).toFixed(0)}` },
    { label: "K", value: `${interpolate(potassium, time).toFixed(0)}` },
    { label: "t", value: `${time.toFixed(2)} ms` }
  ]
};

export default function ActionPotentialWidget() {
  return <TimelineLabWidget config={config} />;
}
