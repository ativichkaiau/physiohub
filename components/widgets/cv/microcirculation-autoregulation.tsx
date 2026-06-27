"use client";

import { FeedbackLabWidget, type FeedbackLabConfig } from "@/components/widgets/common/FeedbackLabWidget";
import { clamp } from "@/components/widgets/widgetUtils";

/**
 * Local blood flow autoregulation. Two arms keep tissue perfusion constant
 * across a wide range of perfusion pressures:
 *   - Myogenic: arteriolar smooth muscle contracts when stretched → tone ↑
 *     when perfusion pressure ↑, holding flow constant.
 *   - Metabolic: tissue O₂ demand / metabolite accumulation dilates the
 *     arteriole → tone ↓ when demand ↑, increasing flow to match.
 * Together they hold tissue flow on a flat plateau roughly 60–160 mmHg
 * (autoregulatory range). Outside the plateau, flow becomes pressure-passive.
 */
// Tissue presets — each bed has its own autoregulatory range and dominant
// regulator. Cerebral: tight 60–160 mmHg plateau, CO₂ co-dominant. Coronary:
// 60–140 mmHg, metabolic (adenosine) dominant. Renal: 80–180 mmHg, myogenic +
// tubuloglomerular feedback. Skin: minimal autoregulation, thermoregulatory.
type TissueId = "cerebral" | "coronary" | "renal" | "skeletal-muscle";

const TISSUE_PARAMS: Record<TissueId, { lower: number; upper: number; myogenicWeight: number; metabolicWeight: number }> = {
  cerebral: { lower: 60, upper: 160, myogenicWeight: 0.55, metabolicWeight: 0.30 },
  coronary: { lower: 60, upper: 140, myogenicWeight: 0.30, metabolicWeight: 0.65 },
  renal: { lower: 80, upper: 180, myogenicWeight: 0.65, metabolicWeight: 0.20 },
  "skeletal-muscle": { lower: 50, upper: 170, myogenicWeight: 0.25, metabolicWeight: 0.70 }
};

const config: FeedbackLabConfig = {
  diagramId: "cv/microcirculation-autoregulation",
  readingGuide:
    "Tissue blood flow is defended locally. When metabolism rises or pressure falls, metabolites build up and arterioles DILATE to restore flow; when pressure surges, myogenic stretch CONSTRICTS them. Follow the loop from demand to vessel caliber to flow — it holds delivery nearly constant across a wide pressure range.",
  loop: {
    guideSteps: [
      { title: "1 Detect", verb: "stretch, PO2, CO2, and metabolites change" },
      { title: "2 Set tone", verb: "smooth muscle integrates myogenic + metabolic drive" },
      { title: "3 Hold flow", verb: "arteriolar radius stabilizes capillary perfusion" }
    ],
    guideSummary: "Autoregulation is local: pressure/demand cues set arteriolar tone, keeping tissue flow near a plateau.",
    feedbackStepTitle: "4 Stabilize",
    nodeRoles: ["Local cue", "Arteriole", "Tissue bed"],
    forwardHeader: "LOCAL FLOW CONTROL",
    feedbackHeader: "FLOW PLATEAU",
    forwardLabels: ["cue signal", "radius change"],
    feedbackLabel: "stabilizes flow",
    feedbackGuideTitle: "Autoregulatory plateau",
    feedbackVerbActive: "flow correction reduces the original metabolic or stretch error",
    feedbackVerbInactive: "flow becomes pressure-passive outside local control",
    feedbackStatusActive: "Plateau active",
    feedbackStatusInactive: "Pressure-passive",
    feedbackOffLabel: "pressure passive",
    legendForward: "local cue changes arteriolar radius",
    legendFeedback: "flow stabilization reduces the error"
  },
  controls: [
    { key: "pressure", label: "Perfusion pressure", min: 30, max: 220, step: 1, defaultValue: 90, unit: "mmHg" },
    { key: "demand", label: "Tissue O₂ demand", min: 20, max: 250, step: 1, defaultValue: 80, unit: "% of resting" },
    { key: "tissue", label: "Tissue (0=cere, 1=cor, 2=ren, 3=skm)", min: 0, max: 3, step: 1, defaultValue: 0 }
  ],
  toggles: [{ key: "autoreg", label: "Autoregulation intact", defaultValue: true }],
  evaluate: (values, toggles) => {
    const tissueIdList: TissueId[] = ["cerebral", "coronary", "renal", "skeletal-muscle"];
    const tissue = tissueIdList[Math.max(0, Math.min(3, Math.round(values.tissue)))];
    const params = TISSUE_PARAMS[tissue];
    const inRange = values.pressure >= params.lower && values.pressure <= params.upper;
    const myogenic = toggles.autoreg && inRange ? (values.pressure - 90) * params.myogenicWeight : 0;
    const metabolic = toggles.autoreg ? -(values.demand - 80) * params.metabolicWeight : 0;
    const tone = clamp(50 + myogenic + metabolic, 0, 100);
    const resistance = 1 + tone / 50;
    const passiveFlow = (values.pressure / 90) * 100;
    const regulatedFlow = (values.pressure / 90 / resistance) * 150;
    const flow = toggles.autoreg ? clamp(regulatedFlow * (values.demand / 80), 0, 320) : passiveFlow;
    // Tissue-specific failure thresholds: cerebral ischaemia below CPP 50, coronary subendocardial ischaemia below 40.
    const ischaemicThreshold = tissue === "cerebral" ? 50 : tissue === "coronary" ? 40 : 55;

    return {
      state: !toggles.autoreg
        ? "Loop opened — pressure-passive (autoreg disabled)"
        : values.pressure < ischaemicThreshold
          ? `${tissue} ischaemia — perfusion below autoreg threshold (${ischaemicThreshold} mmHg)`
          : !inRange
            ? values.pressure < params.lower
              ? `Below ${tissue} autoreg plateau (${params.lower} mmHg) — hypoperfusion`
              : `Above ${tissue} autoreg plateau (${params.upper} mmHg) — hyperperfusion / BBB breach risk`
            : values.demand > 150
              ? `${tissue} hyperaemia — metabolic vasodilation dominant`
              : values.pressure > params.upper - 30 && values.demand < 80
                ? "Myogenic constriction dominant — pressure-loaded plateau"
                : `${tissue} flow held on plateau`,
      body: `Four tissue presets exercise the same loop: myogenic (stretch → constriction) and metabolic (demand → dilation). Cerebral: tight 60–160 mmHg, CO₂-co-regulated. Coronary: 60–140, metabolite-dominant (adenosine). Renal: 80–180, myogenic + tubuloglomerular feedback. Skeletal muscle: 50–170, demand-driven. Selected: ${tissue} — plateau ${params.lower}–${params.upper} mmHg.`,
      warning: !toggles.autoreg
        ? "Edge state: autoregulation disabled — flow is pressure-passive. Cerebral edema (high pressure) or stroke (low pressure) imminent."
        : !inRange && values.pressure < ischaemicThreshold
          ? `Edge state: perfusion below ${tissue} ischaemic threshold — irreversible injury after ~5 min (brain), ~20 min (myocardium), ~60 min (kidney).`
          : !inRange && values.pressure > params.upper + 25
            ? "Edge state: chronic supra-plateau pressures damage endothelium → hypertensive encephalopathy / nephrosclerosis."
            : undefined,
      nodes: [
        { label: "Tissue O₂ / metabolites", value: `Demand ${values.demand.toFixed(0)}%`, active: values.demand > 110 || values.demand < 50 },
        { label: "Arteriolar smooth muscle", value: `Tone ${tone.toFixed(0)}%`, active: toggles.autoreg && (Math.abs(myogenic) > 8 || Math.abs(metabolic) > 8) },
        { label: `${tissue} capillary bed`, value: `Flow ${flow.toFixed(0)}%`, active: Math.abs(flow - 100) > 25 }
      ],
      readouts: [
        { label: "Pressure", value: `${values.pressure.toFixed(0)} mmHg` },
        { label: "Tissue", value: tissue },
        { label: "Tone", value: `${tone.toFixed(0)}%` },
        { label: "Flow", value: `${flow.toFixed(0)}%` },
        { label: "Plateau", value: `${params.lower}–${params.upper} mmHg` },
        { label: "Demand", value: `${values.demand.toFixed(0)}%` }
      ],
      feedbackActive: toggles.autoreg,
      forwardActive: Math.abs(values.pressure - 90) > 18 || Math.abs(values.demand - 80) > 25
    };
  }
};

export default function MicrocirculationAutoregulationWidget() {
  return <FeedbackLabWidget config={config} />;
}
