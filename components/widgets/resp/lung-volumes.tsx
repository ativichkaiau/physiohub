"use client";

import { TimelineLabWidget, type TimelineLabConfig } from "@/components/widgets/common/TimelineLabWidget";
import { makeRange } from "@/components/widgets/widgetUtils";

function volumeAt(t: number) {
  if (t <= 2) return 2.5 + 0.35 * Math.sin(Math.PI * t);
  if (t <= 3.2) return 2.5 + (5.8 - 2.5) * ((t - 2) / 1.2);
  if (t <= 4.6) {
    const x = (t - 3.2) / 1.4;
    return 5.8 - (5.8 - 1.2) * (1 - Math.exp(-4 * x)) / (1 - Math.exp(-4));
  }
  return 1.2 + (2.5 - 1.2) * ((t - 4.6) / 1.4);
}

function flowAt(t: number) {
  const dt = 0.01;
  return (volumeAt(Math.min(6, t + dt)) - volumeAt(Math.max(0, t - dt))) / (2 * dt);
}

const times = makeRange(0, 6, 0.03);

const config: TimelineLabConfig = {
  diagramId: "resp/lung-volumes",
  title: "Spirometry maneuver",
  duration: 6,
  xLabel: "time (s)",
  yLabel: "volume (L) / flow (L/s)",
  yDomain: [-4.5, 6.5],
  series: [
    {
      id: "volume",
      label: "Lung volume",
      colorVar: "var(--ph-curve-1)",
      data: times.map((t) => ({ x: t, y: volumeAt(t) }))
    },
    {
      id: "flow",
      label: "Flow",
      colorVar: "var(--ph-curve-2)",
      data: times.map((t) => ({ x: t, y: flowAt(t) }))
    },
    {
      id: "rv",
      label: "Residual volume",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: [
        { x: 0, y: 1.2 },
        { x: 6, y: 1.2 }
      ]
    },
    {
      id: "tlc",
      label: "Total lung capacity",
      colorVar: "var(--ph-curve-ref)",
      dashed: true,
      data: [
        { x: 0, y: 5.8 },
        { x: 6, y: 5.8 }
      ]
    }
  ],
  phases: [
    {
      start: 0,
      end: 2,
      title: "Quiet tidal breathing",
      body: "Tidal volume oscillates around functional residual capacity while flow crosses zero at end inspiration and end expiration."
    },
    {
      start: 2,
      end: 3.2,
      title: "Maximal inspiration",
      body: "The subject inspires from FRC toward total lung capacity, recruiting inspiratory reserve volume."
    },
    {
      start: 3.2,
      end: 4.6,
      title: "Forced expiration",
      body: "Volume falls rapidly at first, then slows as dynamic airway compression limits expiratory flow."
    },
    {
      start: 4.6,
      end: 6,
      title: "Recovery inspiration",
      body: "The maneuver returns toward FRC, leaving residual volume below the spirometry trace."
    }
  ],
  readout: (time) => {
    const volume = volumeAt(time);
    const flow = flowAt(time);
    const vc = 5.8 - 1.2;
    return [
      { label: "Volume", value: `${volume.toFixed(1)} L` },
      { label: "Flow", value: `${flow.toFixed(1)} L/s` },
      { label: "FRC", value: "2.5 L" },
      { label: "VC", value: `${vc.toFixed(1)} L` }
    ];
  }
};

export default function LungVolumesWidget() {
  return <TimelineLabWidget config={config} />;
}
