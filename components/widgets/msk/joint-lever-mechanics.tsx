"use client";

import { CurveLabWidget, type CurveLabConfig } from "@/components/widgets/common/CurveLabWidget";
import { clamp, makeRange } from "@/components/widgets/widgetUtils";

function muscleMomentArm(angle: number) {
  return clamp(3.2 + 1.6 * Math.sin((Math.PI * (angle - 25)) / 150), 1.4, 5.2);
}

function muscleTorque(angle: number, force: number) {
  const lengthFactor = 0.58 + 0.42 * Math.sin((Math.PI * angle) / 150);
  return (force * lengthFactor * muscleMomentArm(angle)) / 100;
}

function externalTorque(angle: number, load: number, handDistance: number) {
  return (load * handDistance * Math.sin((Math.PI * angle) / 180)) / 40;
}

const config: CurveLabConfig = {
  diagramId: "msk/joint-lever-mechanics",
  title: "Joint lever mechanics",
  xDomain: [0, 150],
  yDomain: [0, 90],
  xLabel: "joint angle (degrees)",
  yLabel: "torque",
  controls: [
    { key: "angle", label: "Joint angle marker", min: 0, max: 150, step: 1, defaultValue: 90, unit: "deg" },
    { key: "muscleForce", label: "Muscle force capacity", min: 200, max: 1800, step: 25, defaultValue: 900, unit: "N" },
    { key: "load", label: "External load", min: 0, max: 250, step: 5, defaultValue: 80, unit: "N" },
    { key: "distance", label: "Load distance", min: 10, max: 70, step: 1, defaultValue: 35, unit: "cm" }
  ],
  buildSeries: (values) => [
    {
      id: "muscle",
      label: "Muscle torque capacity",
      colorVar: "var(--ph-curve-1)",
      data: makeRange(0, 150, 2).map((angle) => ({ x: angle, y: muscleTorque(angle, values.muscleForce) }))
    },
    {
      id: "external",
      label: "External torque",
      colorVar: "var(--ph-curve-4)",
      data: makeRange(0, 150, 2).map((angle) => ({ x: angle, y: externalTorque(angle, values.load, values.distance) }))
    },
    {
      id: "moment",
      label: "Moment arm x10",
      colorVar: "var(--ph-curve-2)",
      dashed: true,
      data: makeRange(0, 150, 2).map((angle) => ({ x: angle, y: muscleMomentArm(angle) * 10 }))
    }
  ],
  buildAnnotations: (values) => [{ x: values.angle, y: muscleTorque(values.angle, values.muscleForce), label: "joint angle" }],
  getCursorX: (values) => values.angle,
  summarize: (values) => {
    const mt = muscleTorque(values.angle, values.muscleForce);
    const et = externalTorque(values.angle, values.load, values.distance);
    return {
      state: mt >= et ? "Torque reserve available" : "Load exceeds torque reserve",
      body: "Joint torque depends on muscle force, moment arm, and external load distance. The same load becomes harder as its moment arm grows relative to the muscle moment arm.",
      readouts: [
        { label: "Muscle T", value: `${mt.toFixed(1)}` },
        { label: "Load T", value: `${et.toFixed(1)}` },
        { label: "Reserve", value: `${(mt - et).toFixed(1)}` },
        { label: "Arm", value: `${muscleMomentArm(values.angle).toFixed(1)} cm` }
      ],
      warning: et > mt ? "Edge state: external torque exceeds available muscle torque; the joint will yield unless assistance or co-contraction changes the mechanics." : undefined
    };
  }
};

export default function JointLeverMechanicsWidget() {
  return <CurveLabWidget config={config} />;
}
