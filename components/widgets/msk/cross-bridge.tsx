"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { PerturbationToggle, ScrubBar } from "@/components/widgets/primitives";
import { clamp, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "msk/cross-bridge";
const diagram = getDiagramById(DIAGRAM_ID);

const steps = [
  {
    id: 1,
    title: "Attached",
    label: "Rigor-like attachment",
    body: "Myosin is attached to actin. Without ATP, the head remains bound."
  },
  {
    id: 2,
    title: "ATP binds",
    label: "Detachment",
    body: "ATP binding weakens the actin-myosin interaction and the head detaches."
  },
  {
    id: 3,
    title: "Hydrolysis",
    label: "Cocked head",
    body: "ATP hydrolysis stores energy in the cocked myosin head as ADP and Pi remain bound."
  },
  {
    id: 4,
    title: "Rebind",
    label: "Actin target found",
    body: "The cocked head binds actin one position forward while ADP and Pi are still present."
  },
  {
    id: 5,
    title: "Power stroke",
    label: "Force generated",
    body: "Pi release triggers the power stroke; ADP then leaves and the cycle is ready to repeat."
  }
];

function stepMeta(step: number) {
  return steps[step - 1] ?? steps[0];
}

function headTransform(step: number) {
  if (step === 1) return "translate(330 160) rotate(0)";
  if (step === 2) return "translate(315 120) rotate(-16)";
  if (step === 3) return "translate(285 112) rotate(-28)";
  if (step === 4) return "translate(245 126) rotate(-20)";
  return "translate(245 162) rotate(10)";
}

export default function CrossBridgeWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [step, setStep] = useState(() => Math.round(parseNumber(searchParams.get("step"), 1, 1, 5)));
  const [autoplay, setAutoplay] = useState(() => parseBoolean(searchParams.get("autoplay"), false));
  const [speed, setSpeed] = useState(() => parseNumber(searchParams.get("speed"), 1, 0.5, 2));
  const [labels, setLabels] = useState(() => parseBoolean(searchParams.get("labels"), true));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ step, autoplay, speed, labels });
  const meta = stepMeta(step);

  useEffect(() => {
    stateRef.current = { step, autoplay, speed, labels };
  }, [autoplay, labels, speed, step]);

  useEffect(() => {
    const current = stateRef.current;
    const next = {
      step: Math.round(parseNumber(searchParams.get("step"), current.step, 1, 5)),
      autoplay: parseBoolean(searchParams.get("autoplay"), current.autoplay),
      speed: parseNumber(searchParams.get("speed"), current.speed, 0.5, 2),
      labels: parseBoolean(searchParams.get("labels"), current.labels)
    };
    if (next.step !== current.step) setStep(next.step);
    if (next.autoplay !== current.autoplay) setAutoplay(next.autoplay);
    if (Math.abs(next.speed - current.speed) > 0.001) setSpeed(next.speed);
    if (next.labels !== current.labels) setLabels(next.labels);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("step", String(step));
    params.set("autoplay", autoplay ? "1" : "0");
    params.set("speed", String(speed));
    params.set("labels", labels ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [autoplay, currentQuery, labels, pathname, router, speed, step]);

  useEffect(() => {
    if (!autoplay) return;
    const interval = window.setInterval(() => {
      setStep((current) => (current >= 5 ? 1 : current + 1));
    }, 1100 / speed);
    return () => window.clearInterval(interval);
  }, [autoplay, speed]);

  const attached = step === 1 || step === 4 || step === 5;
  const edgeState = step === 5 && !autoplay;

  function setSafeStep(next: number) {
    setStep(clamp(next, 1, 5));
  }

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Cross-bridge cycle mechanism">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="ph-clay-well p-3">
              <p className="ph-section-label">Step {step} / 5 - {meta.title}</p>
              <p className="mt-1 text-sm text-ph-muted">{meta.body}</p>
            </div>
            <div aria-live="polite" className="grid gap-2 text-sm">
              <span className="ph-readout">{meta.label}</span>
              <span className="ph-readout">{attached ? "Attached to actin" : "Detached from actin"}</span>
            </div>
          </div>
          {edgeState ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: final step reached. Next restarts the cycle unless autoplay is enabled.
            </p>
          ) : null}
          <svg role="img" aria-label="Cross-bridge cycle schematic" viewBox="0 0 720 430" className="ph-pathway-canvas h-auto w-full">
            <line x1="70" y1="300" x2="650" y2="300" stroke="var(--ph-axis)" strokeWidth="18" strokeLinecap="round" />
            {[120, 190, 260, 330, 400, 470, 540, 610].map((x) => (
              <circle key={x} cx={x} cy="300" r="17" fill="var(--ph-surface-2)" stroke="var(--ph-curve-2)" strokeWidth="2" />
            ))}
            <path d="M 360 350 C 350 308, 342 252, 330 204" fill="none" stroke="var(--ph-curve-ref)" strokeWidth="16" strokeLinecap="round" />
            <g transform={headTransform(step)}>
              <rect x="-58" y="-34" width="116" height="68" rx="18" fill="var(--ph-surface-2)" stroke="var(--ph-accent)" strokeWidth="3" />
              <circle cx="0" cy="0" r="17" fill="color-mix(in srgb, var(--ph-accent), transparent 76%)" />
              {labels ? (
                <text x="0" y="5" textAnchor="middle" fill="var(--ph-text)" fontSize="13" fontWeight="600">
                  Myosin
                </text>
              ) : null}
            </g>
            {attached ? (
              <line x1={step === 1 ? "330" : step === 4 ? "245" : "255"} y1={step === 5 ? "196" : "176"} x2={step === 1 ? "330" : "260"} y2="282" stroke="var(--ph-accent)" strokeWidth="4" strokeLinecap="round" />
            ) : (
              <text x="310" y="235" textAnchor="middle" fill="var(--ph-warn)" fontSize="28">
                x
              </text>
            )}
            {labels ? (
              <>
                <text x="360" y="333" textAnchor="middle" fill="var(--ph-muted)" fontSize="14">Actin filament</text>
                <text x="510" y="110" fill="var(--ph-muted)" fontSize="14">
                  {step === 2 ? "ATP bound" : step === 3 || step === 4 ? "ADP + Pi" : step === 5 ? "Pi released" : "low-energy state"}
                </text>
              </>
            ) : null}
            <g transform="translate(120 382)">
              {steps.map((item, index) => (
                <g key={item.id} transform={`translate(${index * 110} 0)`}>
                  <circle cx="0" cy="0" r="12" fill={item.id === step ? "var(--ph-accent)" : "var(--ph-surface-2)"} stroke="var(--ph-border-strong)" />
                  <text x="0" y="31" textAnchor="middle" fill="var(--ph-muted)" fontSize="12">{item.id}</text>
                </g>
              ))}
            </g>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <ScrubBar
              label="Cycle step"
              value={step - 1}
              duration={4}
              step={1}
              playing={autoplay}
              speed={speed}
              onChange={(value) => {
                setAutoplay(false);
                setSafeStep(Math.round(value) + 1);
              }}
              onPlayingChange={setAutoplay}
              onSpeedChange={setSpeed}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="focus-ring ph-clay-button px-3 py-2 text-sm disabled:opacity-45"
                disabled={step === 1}
                onClick={() => setSafeStep(step - 1)}
              >
                Prev
              </button>
              <button
                type="button"
                className="focus-ring ph-clay-button px-3 py-2 text-sm"
                onClick={() => setSafeStep(step === 5 ? 1 : step + 1)}
              >
                {step === 5 ? "Restart" : "Next"}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {steps.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={item.id === step}
                  className="focus-ring ph-clay-button px-3 py-2 text-sm text-ph-muted data-[active=true]:border-[var(--ph-accent)] data-[active=true]:text-ph-text"
                  data-active={item.id === step}
                  onClick={() => {
                    setAutoplay(false);
                    setStep(item.id);
                  }}
                >
                  {item.id}. {item.title}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <PerturbationToggle label="Show molecular labels" checked={labels} onChange={setLabels} />
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>{reference.source}{reference.pages ? `, ${reference.pages}` : ""}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
