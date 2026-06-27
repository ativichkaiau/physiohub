"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, makeRange } from "@/components/widgets/widgetUtils";

const duration = 120;

const membrane = makeRange(0, duration, 2).map((t) => {
  const spike = 135 * Math.exp(-((t - 10) ** 2) / 28);
  const afterHyper = -12 * Math.exp(-((t - 28) ** 2) / 120);
  return { x: t, y: -80 + spike + afterHyper };
});

const calcium = makeRange(0, duration, 2).map((t) => {
  const rise = 100 / (1 + Math.exp(-(t - 18) / 3));
  const fall = 100 / (1 + Math.exp((t - 62) / 10));
  return { x: t, y: rise * fall };
});

const troponin = makeRange(0, duration, 2).map((t) => ({
  x: t,
  y: 92 / (1 + Math.exp(-(t - 26) / 6)) * (1 / (1 + Math.exp((t - 78) / 13)))
}));

const tension = makeRange(0, duration, 2).map((t) => {
  const activation = 100 / (1 + Math.exp(-(t - 38) / 8));
  const relaxation = 100 / (1 + Math.exp((t - 96) / 15));
  return { x: t, y: (activation * relaxation) / 100 };
});

const config: TimelineLabConfig = {
  diagramId: "msk/excitation-contraction",
  title: "Excitation-contraction coupling timeline",
  duration,
  xLabel: "time (ms)",
  yLabel: "relative signal",
  readingGuide:
    "Scrub to watch the cascade fire in order: action potential → T-tubule depolarization → Ca²⁺ release from the SR → cross-bridge force. Force always LAGS the calcium, which lags the action potential — that delay is excitation–contraction coupling. Relaxation waits for Ca²⁺ to be pumped back.",
  yDomain: [-90, 120],
  series: [
    { id: "vm", label: "Sarcolemma AP", data: membrane, colorVar: "var(--ph-curve-4)" },
    { id: "ca", label: "SR Ca release", data: calcium, colorVar: "var(--ph-curve-1)" },
    { id: "tnc", label: "Troponin C binding", data: troponin, colorVar: "var(--ph-curve-6)" },
    { id: "force", label: "Twitch force", data: tension, colorVar: "var(--ph-curve-2)" }
  ],
  phases: [
    { start: 0, end: 8, title: "Neuromuscular trigger", body: "End-plate depolarization reaches threshold and the sarcolemma action potential begins." },
    { start: 8, end: 18, title: "T-tubule depolarization", body: "The action potential invades T-tubules; DHPR mechanically couples to RyR1." },
    { start: 18, end: 34, title: "SR calcium release", body: "RyR1 opens and Ca rises rapidly around myofilaments." },
    { start: 34, end: 70, title: "Cross-bridge activation", body: "Calcium binds troponin C, tropomyosin moves, and cross-bridge cycling develops force." },
    { start: 70, end: duration, title: "SERCA relaxation", body: "SERCA pumps Ca back into SR; troponin releases Ca and twitch force falls." }
  ],
  readout: (time) => [
    { label: "t", value: `${time.toFixed(0)} ms` },
    { label: "Vm", value: `${interpolate(membrane, time).toFixed(0)} mV` },
    { label: "Ca", value: `${interpolate(calcium, time).toFixed(0)}%` },
    { label: "Force", value: `${interpolate(tension, time).toFixed(0)}%` }
  ]
};

export default function ExcitationContractionWidget() {
  return <TimelineLabWidget config={config} />;
}
