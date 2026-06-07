"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { interpolate, makeRange } from "@/components/widgets/widgetUtils";

const duration = 1000;

function twitchAt(time: number, stimulus: number) {
  const dt = time - stimulus;
  if (dt < 0) return 0;
  return 88 * (1 - Math.exp(-dt / 34)) * Math.exp(-dt / 185);
}

function train(time: number, interval: number) {
  let value = 0;
  for (let stimulus = 60; stimulus < duration; stimulus += interval) {
    value += twitchAt(time, stimulus);
  }
  return Math.min(130, value);
}

const singleTwitch = makeRange(0, duration, 10).map((t) => ({ x: t, y: twitchAt(t, 120) }));
const waveSummation = makeRange(0, duration, 10).map((t) => ({ x: t, y: train(t, 170) }));
const tetanus = makeRange(0, duration, 10).map((t) => ({ x: t, y: train(t, 42) }));
const calcium = makeRange(0, duration, 10).map((t) => {
  const pulses = train(t, 42);
  return { x: t, y: Math.min(120, pulses * 0.9 + 8) };
});

const config: TimelineLabConfig = {
  diagramId: "msk/twitch-summation",
  title: "Twitch summation and tetanus",
  duration,
  xLabel: "time (ms)",
  yLabel: "relative force / Ca",
  yDomain: [0, 140],
  series: [
    { id: "single", label: "Single twitch", data: singleTwitch, colorVar: "var(--ph-curve-ref)" },
    { id: "summation", label: "Wave summation", data: waveSummation, colorVar: "var(--ph-curve-1)" },
    { id: "tetanus", label: "Fused tetanus", data: tetanus, colorVar: "var(--ph-curve-2)" },
    { id: "ca", label: "Cytosolic Ca", data: calcium, colorVar: "var(--ph-curve-6)" }
  ],
  phases: [
    { start: 0, end: 120, title: "First stimulus", body: "A single action potential releases Ca and starts a twitch after a short latent period." },
    { start: 120, end: 360, title: "Incomplete relaxation", body: "A second stimulus arrives before Ca is fully resequestered, so forces summate." },
    { start: 360, end: 700, title: "Unfused tetanus", body: "High-frequency stimulation keeps Ca elevated but still allows small force oscillations." },
    { start: 700, end: duration, title: "Fused tetanus", body: "Very high stimulation frequency produces near-sustained Ca and maximal cross-bridge recruitment." }
  ],
  readout: (time) => [
    { label: "t", value: `${time.toFixed(0)} ms` },
    { label: "Single", value: `${interpolate(singleTwitch, time).toFixed(0)}%` },
    { label: "Summed", value: `${interpolate(waveSummation, time).toFixed(0)}%` },
    { label: "Tetanus", value: `${interpolate(tetanus, time).toFixed(0)}%` }
  ]
};

export default function TwitchSummationWidget() {
  return <TimelineLabWidget config={config} />;
}
