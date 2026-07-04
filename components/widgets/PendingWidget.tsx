"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramByRoute } from "@/lib/registry";
import {
  FeedbackLoopGuide,
  type FeedbackGuideNode,
  type FeedbackGuideReturnKind,
  type FeedbackGuideStep
} from "@/components/widgets/common/FeedbackLoopGuide";
import {
  Curve,
  FeedbackLoopEdge,
  FeedbackLoopNode,
  PerturbationToggle,
  ScrubBar,
  Slider,
  type CurvePoint
} from "@/components/widgets/primitives";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value: string | null, fallback: number, min: number, max: number) {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

const baselineCurve: CurvePoint[] = [
  { x: 0, y: 8 },
  { x: 1, y: 18 },
  { x: 2, y: 42 },
  { x: 3, y: 70 },
  { x: 4, y: 86 },
  { x: 5, y: 94 }
];

type PendingFeedbackTemplate = {
  steps: [FeedbackGuideStep, FeedbackGuideStep, FeedbackGuideStep];
  summary: string;
  feedbackKind?: FeedbackGuideReturnKind;
  feedbackStepTitle: string;
  feedbackTitle: string;
  feedbackVerbActive: string;
  feedbackVerbInactive: string;
  feedbackStatusActive: string;
  feedbackStatusInactive: string;
  nodeRoles: [string, string, string];
  nodeLabels: [string, string, string];
  nodeValues?: (value: number, enabled: boolean) => [string, string, string];
  activeNodes?: (value: number, enabled: boolean) => [boolean, boolean, boolean];
  forwardHeader: string;
  feedbackHeader: string;
  forwardLabels: [string, string];
  feedbackLabel: string;
};

const defaultFeedbackTemplate: PendingFeedbackTemplate = {
  steps: [
    { title: "1 Input", verb: "replace with the real sensor or afferent signal" },
    { title: "2 Controller", verb: "replace with the nucleus, gland, or local controller" },
    { title: "3 Effector", verb: "replace with the output tissue or hormone target" }
  ],
  summary: "Template only: replace input, controller, effector, and return arm with diagram-specific physiology.",
  feedbackStepTitle: "4 Return",
  feedbackTitle: "Return arm",
  feedbackVerbActive: "return arm is connected to the upstream controller",
  feedbackVerbInactive: "return arm is disconnected for the preview state",
  feedbackStatusActive: "Return connected",
  feedbackStatusInactive: "Return open",
  nodeRoles: ["Input", "Controller", "Effector"],
  nodeLabels: ["Physiology input", "Controller", "Effector"],
  forwardHeader: "FORWARD ARM",
  feedbackHeader: "RETURN ARM",
  forwardLabels: ["input signal", "output signal"],
  feedbackLabel: "return arm"
};

const feedbackTemplates: Record<string, PendingFeedbackTemplate> = {
  "msk/bone-remodeling": {
    steps: [
      { title: "1 Sense load", verb: "osteocytes detect strain, microdamage, and PTH context" },
      { title: "2 Couple cells", verb: "RANKL/OPG tunes osteoclast recruitment" },
      { title: "3 Rebuild matrix", verb: "osteoblasts refill and mineralize the packet" }
    ],
    summary: "Low strain or microdamage raises osteocyte remodeling signals; restored mineralized matrix quenches the local stimulus.",
    feedbackStepTitle: "4 Quench",
    feedbackTitle: "Local remodeling stop",
    feedbackVerbActive: "restored load and mineral matrix reduce the remodeling signal",
    feedbackVerbInactive: "remodeling signal persists without the local stop cue",
    feedbackStatusActive: "Packet closing",
    feedbackStatusInactive: "Packet open",
    nodeRoles: ["Osteocyte", "BMU control", "Bone cells"],
    nodeLabels: ["Strain / microdamage", "RANKL-OPG balance", "Osteoclast -> osteoblast"],
    nodeValues: (value, enabled) => [`Stimulus ${Math.round(value)}%`, "RANKL/OPG set", enabled ? "coupled" : "uncoupled"],
    activeNodes: (value, enabled) => [value > 55, value > 55, enabled],
    forwardHeader: "OSTEOCYTE SIGNAL",
    feedbackHeader: "LOAD RESTORED",
    forwardLabels: ["RANKL signal", "coupled formation"],
    feedbackLabel: "load restored"
  },
  "msk/muscle-spindle": {
    steps: [
      { title: "1 Stretch", verb: "intrafusal fibers raise Ia afferent firing" },
      { title: "2 Segmental relay", verb: "spinal cord excites alpha motor neurons" },
      { title: "3 Contract", verb: "extrafusal muscle shortens against the stretch" }
    ],
    summary: "Stretch raises Ia firing; alpha motor output contracts the same muscle and reduces the original stretch. Gamma drive sets spindle gain.",
    feedbackStepTitle: "4 Shorten",
    feedbackTitle: "Length correction",
    feedbackVerbActive: "muscle shortening reduces spindle stretch",
    feedbackVerbInactive: "stretch signal remains uncorrected in the preview",
    feedbackStatusActive: "Reflex closed",
    feedbackStatusInactive: "Return open",
    nodeRoles: ["Spindle", "Spinal cord", "Alpha MN"],
    nodeLabels: ["Muscle spindle", "Ia synapse", "Extrafusal muscle"],
    nodeValues: (value, enabled) => [`Stretch ${Math.round(value)}%`, "monosynaptic", enabled ? "contracts" : "no return"],
    activeNodes: (value, enabled) => [value > 45, value > 45, enabled],
    forwardHeader: "Ia -> ALPHA MOTOR",
    feedbackHeader: "LENGTH RETURN",
    forwardLabels: ["Ia afferent", "alpha drive"],
    feedbackLabel: "shortens muscle"
  },
  "repro/lactation": {
    steps: [
      { title: "1 Suckling", verb: "nipple mechanoreceptors fire afferents to hypothalamus" },
      { title: "2 Hormone pulse", verb: "posterior pituitary releases oxytocin; prolactin supports production" },
      { title: "3 Milk transfer", verb: "myoepithelial contraction ejects milk" }
    ],
    summary: "This is positive feedback: milk removal sustains suckling input, which reinforces oxytocin and prolactin pulses.",
    feedbackKind: "stimulate",
    feedbackStepTitle: "4 Reinforce",
    feedbackTitle: "Positive feedback",
    feedbackVerbActive: "milk removal sustains nipple afferents and hormone release",
    feedbackVerbInactive: "return input is absent, so hormone pulses fade",
    feedbackStatusActive: "Reinforced",
    feedbackStatusInactive: "Return absent",
    nodeRoles: ["Afferent", "Hypothalamus", "Breast"],
    nodeLabels: ["Nipple suckling", "Oxytocin / prolactin", "Milk ejection"],
    nodeValues: (value, enabled) => [`Suckling ${Math.round(value)}%`, "pulsatile", enabled ? "let-down" : "fading"],
    activeNodes: (value, enabled) => [value > 25, enabled, enabled && value > 25],
    forwardHeader: "OXYTOCIN / PROLACTIN",
    feedbackHeader: "SUCKLING RETURN",
    forwardLabels: ["hypothalamic", "milk ejection"],
    feedbackLabel: "more suckling"
  },
  "repro/erection-ejaculation": {
    steps: [
      { title: "1 Arousal", verb: "psychogenic and tactile afferents enter spinal centers" },
      { title: "2 Autonomic switch", verb: "parasympathetic erection gives way to sympathetic emission" },
      { title: "3 Tissue response", verb: "NO/cGMP fills erectile tissue; pudendal output drives expulsion" }
    ],
    summary: "Keep erection, emission, and expulsion separate: parasympathetic NO/cGMP opens filling; sympathetic and somatic reflexes complete ejaculation.",
    feedbackStepTitle: "4 Detumesce",
    feedbackTitle: "Sympathetic gate",
    feedbackVerbActive: "sympathetic tone and PDE5 close the erection response",
    feedbackVerbInactive: "detumescence gate is disabled for the preview state",
    feedbackStatusActive: "Gate closed",
    feedbackStatusInactive: "Gate open",
    nodeRoles: ["Afferents", "Spinal centers", "Effectors"],
    nodeLabels: ["Tactile / cortical input", "S2-S4 + T11-L2", "Vascular + somatic output"],
    nodeValues: (value, enabled) => [`Drive ${Math.round(value)}%`, "NO then SNS", enabled ? "detumescence" : "sustained"],
    activeNodes: (value, enabled) => [value > 35, value > 35, enabled],
    forwardHeader: "PARASYMPATHETIC DRIVE",
    feedbackHeader: "DETUMESCENCE GATE",
    forwardLabels: ["S2-S4 NO", "cGMP relax"],
    feedbackLabel: "sym tone/PDE5"
  }
};

function previewNodeValues(template: PendingFeedbackTemplate, value: number, enabled: boolean): [string, string, string] {
  return template.nodeValues?.(value, enabled) ?? [`${Math.round(value)}%`, "set point", enabled ? "return on" : "return off"];
}

function previewNodeActivity(template: PendingFeedbackTemplate, value: number, enabled: boolean): [boolean, boolean, boolean] {
  return template.activeNodes?.(value, enabled) ?? [value > 60, value > 60, enabled];
}

function previewNodes(template: PendingFeedbackTemplate, value: number, enabled: boolean): [FeedbackGuideNode, FeedbackGuideNode, FeedbackGuideNode] {
  const values = previewNodeValues(template, value, enabled);
  const active = previewNodeActivity(template, value, enabled);
  return [
    { label: template.nodeLabels[0], value: values[0], active: active[0] },
    { label: template.nodeLabels[1], value: values[1], active: active[1] },
    { label: template.nodeLabels[2], value: values[2], active: active[2] }
  ];
}

function shiftedCurve(value: number): CurvePoint[] {
  return baselineCurve.map((point) => ({
    x: point.x,
    y: clamp(point.y + value * (point.x - 2), 0, 110)
  }));
}

export default function PendingWidget() {
  const params = useParams<{ system: string; diagram: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagram = getDiagramByRoute(params.system, params.diagram);
  const [value, setValue] = useState(() => parseNumber(searchParams.get("preview"), 50, 0, 100));
  const [enabled, setEnabled] = useState(searchParams.get("overlay") !== "0");
  const stateRef = useRef({ value, enabled });

  useEffect(() => {
    stateRef.current = { value, enabled };
  }, [enabled, value]);

  useEffect(() => {
    const current = stateRef.current;
    const nextValue = parseNumber(searchParams.get("preview"), current.value, 0, 100);
    if (Math.abs(nextValue - current.value) > 0.1) {
      setValue(nextValue);
    }
    const nextEnabled = searchParams.get("overlay") !== "0";
    if (nextEnabled !== current.enabled) {
      setEnabled(nextEnabled);
    }
  }, [searchParams]);

  useEffect(() => {
    const paramsNext = new URLSearchParams(searchParams.toString());
    paramsNext.set("preview", String(Math.round(value)));
    paramsNext.set("overlay", enabled ? "1" : "0");
    const nextQuery = paramsNext.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }
    const timer = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [enabled, pathname, router, searchParams, value]);

  const currentCurve = useMemo(() => shiftedCurve((value - 50) / 8), [value]);

  if (!diagram) {
    return null;
  }
  const feedbackTemplate = feedbackTemplates[diagram.id] ?? defaultFeedbackTemplate;
  const feedbackKind = feedbackTemplate.feedbackKind ?? "inhibit";
  const feedbackColor = feedbackKind === "stimulate" ? "var(--ph-ok)" : "var(--ph-danger)";
  const pathwayNodes = previewNodes(feedbackTemplate, value, enabled);

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${diagram.title} template preview`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="ph-section-label">Signal preview</h2>
            <span className="ph-clay-chip inline-flex items-center gap-1.5 px-2 py-1 text-xs uppercase text-ph-muted">
              <span className="ph-live-dot" aria-hidden="true" style={{ background: "var(--ph-warn)" }} />
              Acquiring signal
            </span>
          </div>
          {diagram.archetype === "feedback-loop" ? (
            <>
              <FeedbackLoopGuide
                nodes={pathwayNodes}
                feedbackActive={enabled}
                steps={feedbackTemplate.steps}
                summary={feedbackTemplate.summary}
                feedbackKind={feedbackKind}
                feedbackStepTitle={feedbackTemplate.feedbackStepTitle}
                feedbackTitle={feedbackTemplate.feedbackTitle}
                feedbackVerbActive={feedbackTemplate.feedbackVerbActive}
                feedbackVerbInactive={feedbackTemplate.feedbackVerbInactive}
                feedbackStatusActive={feedbackTemplate.feedbackStatusActive}
                feedbackStatusInactive={feedbackTemplate.feedbackStatusInactive}
              />
              <svg role="img" aria-label="Feedback loop template" viewBox="0 0 760 600" className="ph-pathway-canvas h-auto w-full">
                <text x="150" y="34" textAnchor="middle" fill={feedbackColor} fontSize="11" fontWeight="800" letterSpacing="1.4">
                  ◀ {feedbackTemplate.feedbackHeader}
                </text>
                <text x="600" y="34" textAnchor="middle" fill="var(--ph-ok)" fontSize="11" fontWeight="800" letterSpacing="1.4">
                  {feedbackTemplate.forwardHeader} ▼
                </text>
                <FeedbackLoopEdge id="edge-a" kind="stimulate" from={{ x: 420, y: 131 }} to={{ x: 420, y: 227 }} label={feedbackTemplate.forwardLabels[0]} active={pathwayNodes[0].active} labelPosition={{ x: 530, y: 179 }} />
                <FeedbackLoopEdge id="edge-b" kind="stimulate" from={{ x: 420, y: 301 }} to={{ x: 420, y: 397 }} label={feedbackTemplate.forwardLabels[1]} active={pathwayNodes[1].active} labelPosition={{ x: 530, y: 349 }} />
                <FeedbackLoopEdge
                  id="edge-c"
                  kind={feedbackKind}
                  from={{ x: 305, y: 432 }}
                  to={{ x: 305, y: 92 }}
                  via={[
                    { x: 140, y: 432 },
                    { x: 140, y: 92 }
                  ]}
                  label={feedbackTemplate.feedbackLabel}
                  active={enabled}
                  labelPosition={{ x: 140, y: 262 }}
                />
                <FeedbackLoopNode id="node-a" index={1} role={feedbackTemplate.nodeRoles[0]} label={pathwayNodes[0].label} value={pathwayNodes[0].value} x={420} y={92} active={pathwayNodes[0].active} />
                <FeedbackLoopNode id="node-b" index={2} role={feedbackTemplate.nodeRoles[1]} label={pathwayNodes[1].label} value={pathwayNodes[1].value} x={420} y={262} active={pathwayNodes[1].active} />
                <FeedbackLoopNode id="node-c" index={3} role={feedbackTemplate.nodeRoles[2]} label={pathwayNodes[2].label} value={pathwayNodes[2].value} x={420} y={432} active={pathwayNodes[2].active} />
              </svg>
            </>
          ) : (
            <Curve
              title={`${diagram.title} template curve`}
              xDomain={[0, 5]}
              yDomain={[0, 110]}
              xLabel="input"
              yLabel="output"
              series={[
                {
                  id: "current",
                  label: "Current",
                  data: currentCurve,
                  colorVar: "var(--ph-curve-1)"
                }
              ]}
              referenceSeries={
                enabled
                  ? [
                      {
                        id: "baseline",
                        label: "Baseline",
                        data: baselineCurve,
                        colorVar: "var(--ph-curve-ref)",
                        dashed: true
                      }
                    ]
                  : []
              }
              cursorX={diagram.archetype === "scrubbable-timeline" || diagram.archetype === "click-to-mechanism" ? value / 20 : undefined}
              height={360}
            />
          )}
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            {diagram.archetype === "scrubbable-timeline" || diagram.archetype === "click-to-mechanism" ? (
              <ScrubBar
                label={diagram.archetype === "click-to-mechanism" ? "Mechanism step" : "Timeline position"}
                value={value / 20}
                duration={5}
                step={diagram.archetype === "click-to-mechanism" ? 1 : 0.1}
                onChange={(nextValue) => setValue(nextValue * 20)}
              />
            ) : (
              <Slider
                label={diagram.archetype === "feedback-loop" ? "Perturbation magnitude" : "Primary parameter"}
                value={value}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={50}
                onChange={setValue}
              />
            )}
            <div className="mt-4">
              <PerturbationToggle
                label={diagram.archetype === "feedback-loop" ? "Feedback arm enabled" : "Show baseline overlay"}
                checked={enabled}
                onChange={setEnabled}
              />
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>
                  {reference.source}
                  {reference.pages ? `, ${reference.pages}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={diagram.id} />
    </section>
  );
}
