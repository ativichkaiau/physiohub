"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, lineSeries } from "@/components/widgets/widgetUtils";

const hcg = lineSeries([
  [0, 0],
  [4, 18],
  [8, 110],
  [10, 120],
  [14, 52],
  [24, 32],
  [40, 25]
]);

const progesterone = lineSeries([
  [0, 12],
  [8, 26],
  [12, 45],
  [20, 72],
  [30, 98],
  [40, 118]
]);

const estrogen = lineSeries([
  [0, 8],
  [10, 18],
  [18, 42],
  [28, 78],
  [36, 112],
  [40, 120]
]);

const relaxin = lineSeries([
  [0, 4],
  [8, 46],
  [14, 22],
  [28, 28],
  [40, 42]
]);

const config: TimelineLabConfig = {
  diagramId: "repro/pregnancy-hormones",
  title: "Pregnancy hormone timeline",
  duration: 40,
  xLabel: "gestational age (weeks)",
  yLabel: "relative level",
  yDomain: [0, 130],
  series: [
    { id: "hcg", label: "hCG", data: hcg, colorVar: "var(--ph-curve-3)" },
    { id: "p4", label: "Progesterone", data: progesterone, colorVar: "var(--ph-curve-2)" },
    { id: "e2", label: "Estrogen", data: estrogen, colorVar: "var(--ph-curve-1)" },
    { id: "relaxin", label: "Relaxin", data: relaxin, colorVar: "var(--ph-curve-6)" }
  ],
  phases: [
    { start: 0, end: 4, title: "Implantation signal", body: "Trophoblast hCG begins supporting the corpus luteum before the placenta can make enough steroid." },
    { start: 4, end: 10, title: "hCG peak", body: "hCG rises rapidly and peaks near weeks 9-10; nausea is often worst here." },
    { start: 10, end: 14, title: "Luteal-placental shift", body: "Placenta takes over progesterone production; corpus luteum dependence fades." },
    { start: 14, end: 34, title: "Placental steroid rise", body: "Progesterone maintains uterine quiescence while estrogen supports uterine and breast growth." },
    { start: 34, end: 40, title: "Term preparation", body: "Estrogen, relaxin, prostaglandins, and oxytocin responsiveness prepare cervix, myometrium, and pelvis for labor." }
  ],
  readout: (time) => [
    { label: "Week", value: time.toFixed(1) },
    { label: "hCG", value: `${interpolate(hcg, time).toFixed(0)}` },
    { label: "P4", value: `${interpolate(progesterone, time).toFixed(0)}` },
    { label: "E2", value: `${interpolate(estrogen, time).toFixed(0)}` }
  ]
};

export default function PregnancyHormonesWidget() {
  return <TimelineLabWidget config={config} />;
}
