"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "nerv/synaptic-transmission";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5 | 6;

type Step = {
  id: StepId;
  shortName: string;
  title: string;
  body: string;
  clinical: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    shortName: "AP arrives",
    title: "1. Action potential arrives at the presynaptic terminal",
    body: "The propagated wavefront depolarises the bouton. Within ~1 ms the membrane potential swings from −70 mV to +30 mV, recruiting voltage-gated ion channels in the active zone.",
    clinical: "Conduction-velocity diseases (demyelination → MS, Guillain–Barré) slow the wavefront, prolonging synaptic delay. Local-anesthetic Na⁺-channel block prevents the AP arriving at all."
  },
  {
    id: 2,
    shortName: "Ca²⁺ enters",
    title: "2. Voltage-gated Ca²⁺ channels open",
    body: "P/Q-type and N-type Cav channels gate open between −30 and +20 mV. The cleft-facing surface has a ~100-fold Ca²⁺ gradient — influx is steep and brief. Local [Ca²⁺]ᵢ at the active zone rises from ~100 nM to ~10 μM.",
    clinical: "Lambert–Eaton myasthenic syndrome: autoantibodies against P/Q-type Cav channels reduce presynaptic Ca²⁺ entry → weakness that IMPROVES with repeat use (post-tetanic facilitation). Often paraneoplastic (small-cell lung CA)."
  },
  {
    id: 3,
    shortName: "Vesicle fusion",
    title: "3. Vesicles dock and fuse via the SNARE complex",
    body: "Synaptotagmin (the Ca²⁺ sensor) triggers the SNARE proteins synaptobrevin (v-SNARE) and syntaxin / SNAP-25 (t-SNARE) to zip the vesicle membrane into the plasma membrane. Fusion takes < 200 μs once Ca²⁺ binds — fastest exocytosis in biology.",
    clinical: "Botulinum toxin cleaves SNAP-25 / synaptobrevin → no ACh release → flaccid paralysis. Tetanospasmin cleaves the SAME SNAREs but in INHIBITORY (GABA/glycine) interneurons → spastic paralysis."
  },
  {
    id: 4,
    shortName: "NT released",
    title: "4. Neurotransmitter released into the cleft",
    body: "Each vesicle (~5,000 NT molecules) is a 'quantum'. Many vesicles fuse per AP. Diffusion across the 20-nm cleft takes ~50 μs.",
    clinical: "Quantal analysis underlies the original miniature end-plate potential (mEPP) experiments. Black-widow venom (α-latrotoxin) forces massive vesicle release → flaccid paralysis after initial twitches."
  },
  {
    id: 5,
    shortName: "Receptor binds",
    title: "5. Neurotransmitter binds postsynaptic receptors",
    body: "Two receptor classes: IONOTROPIC (ligand-gated channels — open in ms, fast EPSP / IPSP, e.g., nAChR, GABA-A, NMDA, AMPA) and METABOTROPIC (G-protein-coupled, slower second-messenger cascades, e.g., mAChR, GABA-B, dopamine, 5-HT₁/₂).",
    clinical: "Myasthenia gravis: autoantibodies against the postsynaptic nicotinic ACh receptor → weakness that WORSENS with use (the opposite of LEMS). Edrophonium (short-acting AChE inhibitor) transiently improves it — Tensilon test."
  },
  {
    id: 6,
    shortName: "Termination",
    title: "6. Signal terminated — reuptake, degradation, or diffusion",
    body: "Three exit routes: REUPTAKE (SERT, DAT, NET take serotonin / dopamine / NE back into the presynaptic terminal); ENZYMATIC DEGRADATION (AChE hydrolyses ACh in the cleft within 1 ms; MAO and COMT degrade catecholamines intracellularly); DIFFUSION away from the cleft.",
    clinical: "SSRIs block SERT → ↑synaptic serotonin (depression, anxiety). Cocaine blocks DAT/NET → euphoria + sympathomimetic. Organophosphates / sarin inhibit AChE → cholinergic crisis (DUMBBELSS). MAOIs treat depression / Parkinson disease."
  }
];

export default function SynapticTransmissionWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step") ?? 1) as StepId;
  const [stepId, setStepId] = useState<StepId>(STEPS.some((s) => s.id === initialStep) ? initialStep : 1);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", String(stepId));
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [stepId, pathname, router, searchParams]);

  useEffect(() => {
    // External URL change (back/forward) → sync state. Local state changes are
    // ignored here because stepId is intentionally out of the dep array — that
    // is what stopped the effect from reverting the click before the debounced
    // URL write landed.
    const next = Number(searchParams.get("step") ?? 1) as StepId;
    if (STEPS.some((s) => s.id === next)) setStepId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const step = STEPS.find((s) => s.id === stepId)!;
  const W = 720;
  const H = 460;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Synapse schematic">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Clinical:</span>{" "}
              <span className="text-ph-muted">{step.clinical}</span>
            </p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <defs>
              <marker id="syn-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0L10 5L0 10z" fill="var(--ph-curve-1)" />
              </marker>
            </defs>

            {/* Presynaptic terminal — bulbous bouton at top */}
            <path
              d="M 100 30 C 100 30 240 -10 360 30 C 480 -10 620 30 620 30 L 620 200 C 620 230 580 250 520 250 L 200 250 C 140 250 100 230 100 200 Z"
              fill={stepId === 1 ? "color-mix(in srgb, var(--ph-curve-1), transparent 78%)" : "color-mix(in srgb, var(--ph-surface), black 4%)"}
              stroke={stepId === 1 ? "var(--ph-curve-1)" : "var(--ph-axis)"}
              strokeWidth={stepId === 1 ? 2.5 : 1.5}
            />
            <text x={360} y={60} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
              PRESYNAPTIC TERMINAL
            </text>
            {stepId === 1 ? (
              <text x={360} y={110} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--ph-curve-1)">
                ⚡ AP arriving
              </text>
            ) : null}

            {/* Ca2+ channels along bottom membrane */}
            {[180, 280, 380, 480].map((cx, i) => (
              <g key={`ca-${i}`}>
                <rect
                  x={cx - 12}
                  y={240}
                  width={24}
                  height={20}
                  rx={4}
                  fill={stepId >= 2 && stepId <= 3 ? "var(--ph-curve-2)" : "var(--ph-surface)"}
                  stroke={stepId === 2 ? "var(--ph-curve-2)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 2 ? 2.5 : 1}
                />
                {stepId === 2 ? (
                  <>
                    <text x={cx} y={228} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-curve-2)">
                      Ca²⁺
                    </text>
                    <text x={cx} y={285} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--ph-curve-2)">
                      ↓
                    </text>
                  </>
                ) : null}
              </g>
            ))}
            <text x={50} y={250} fontSize="10" fontWeight="700" fill="var(--ph-muted)">
              Cav
            </text>

            {/* Vesicles in the terminal */}
            {[
              { cx: 200, cy: 130, docked: false },
              { cx: 280, cy: 110, docked: false },
              { cx: 360, cy: 130, docked: false },
              { cx: 440, cy: 110, docked: false },
              { cx: 520, cy: 130, docked: false },
              { cx: 240, cy: 215, docked: true },
              { cx: 380, cy: 215, docked: true },
              { cx: 500, cy: 215, docked: true }
            ].map((v, i) => {
              const isDocked = v.docked;
              const fused = stepId >= 4 && isDocked;
              return (
                <g key={`v-${i}`}>
                  <circle
                    cx={v.cx}
                    cy={v.cy}
                    r={fused ? 4 : 14}
                    fill={fused ? "transparent" : isDocked && stepId === 3 ? "var(--ph-curve-3)" : "color-mix(in srgb, var(--ph-curve-3), transparent 65%)"}
                    stroke={isDocked && stepId === 3 ? "var(--ph-curve-3)" : "var(--ph-curve-3)"}
                    strokeWidth={isDocked && stepId === 3 ? 2.5 : 1.3}
                  />
                  {fused
                    ? Array.from({ length: 6 }).map((_, j) => {
                        const angle = (j * 60 * Math.PI) / 180;
                        return (
                          <circle
                            key={j}
                            cx={v.cx + Math.cos(angle) * 18}
                            cy={v.cy + Math.sin(angle) * 8 + 12}
                            r={2.5}
                            fill="var(--ph-curve-3)"
                          />
                        );
                      })
                    : null}
                </g>
              );
            })}

            {/* Synaptic cleft — labelled space */}
            <rect x={100} y={260} width={520} height={40} fill="color-mix(in srgb, var(--ph-curve-3), transparent 92%)" />
            <text x={580} y={285} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
              SYNAPTIC CLEFT · 20 nm
            </text>

            {/* Neurotransmitter dots floating in cleft (step 4 onward) */}
            {stepId >= 4 && stepId <= 5
              ? Array.from({ length: 20 }).map((_, i) => {
                  const cx = 130 + i * 25 + (i % 3) * 5;
                  const cy = 268 + (i % 5) * 6;
                  return <circle key={`nt-${i}`} cx={cx} cy={cy} r={2.5} fill="var(--ph-curve-3)" />;
                })
              : null}

            {/* Postsynaptic membrane + receptors */}
            <path
              d="M 100 300 L 620 300 L 620 360 C 620 380 580 400 520 400 L 200 400 C 140 400 100 380 100 360 Z"
              fill={stepId === 5 ? "color-mix(in srgb, var(--ph-curve-6), transparent 82%)" : "color-mix(in srgb, var(--ph-surface), black 4%)"}
              stroke={stepId === 5 ? "var(--ph-curve-6)" : "var(--ph-axis)"}
              strokeWidth={stepId === 5 ? 2.5 : 1.5}
            />
            <text x={360} y={395} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
              POSTSYNAPTIC NEURON
            </text>

            {/* Receptors along the top of the postsynaptic membrane */}
            {[180, 280, 380, 480].map((cx, i) => (
              <g key={`r-${i}`}>
                <path
                  d={`M ${cx - 14} 300 L ${cx - 14} 320 L ${cx - 6} 330 L ${cx + 6} 330 L ${cx + 14} 320 L ${cx + 14} 300`}
                  fill={stepId === 5 ? "var(--ph-curve-6)" : "var(--ph-surface)"}
                  stroke={stepId === 5 ? "var(--ph-curve-6)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 5 ? 2.5 : 1.2}
                />
                {stepId === 5 ? (
                  <text x={cx} y={355} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-curve-6)">
                    bound
                  </text>
                ) : null}
              </g>
            ))}

            {/* Reuptake transporter (step 6) */}
            {stepId === 6 ? (
              <g>
                <rect x={544} y={245} width={28} height={20} rx={4} fill="var(--ph-curve-4)" stroke="var(--ph-curve-4)" strokeWidth={2} />
                <text x={558} y={232} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-curve-4)">
                  SERT
                </text>
                <text x={558} y={285} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--ph-curve-4)">
                  ↑
                </text>
                <circle cx={150} cy={278} r={3} fill="var(--ph-curve-4)" />
                <text x={150} y={295} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-curve-4)">
                  AChE
                </text>
              </g>
            ) : null}
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the synapse</h2>
            <div className="grid gap-2">
              {STEPS.map((s) => {
                const isSelected = s.id === stepId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStepId(s.id)}
                    className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                    }`}
                  >
                    <span className="font-bold tabular-nums">{s.id}.</span> <span className="font-bold">{s.shortName}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => stepId > 1 && setStepId((stepId - 1) as StepId)}
                disabled={stepId === 1}
                className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => stepId < 6 && setStepId((stepId + 1) as StepId)}
                disabled={stepId === 6}
                className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text"
              >
                Next →
              </button>
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

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
