"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "nerv/phototransduction";
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
    shortName: "Photon → rhodopsin",
    title: "1. Photon absorbed by rhodopsin",
    body: "11-cis retinal (the chromophore) isomerises to all-trans retinal in < 200 fs — the fastest event in biology. The conformational change opens rhodopsin to its active form, metarhodopsin II (MII). A single photon can activate one rhodopsin reliably.",
    clinical: "Vitamin A deficiency (retinol → retinal precursor) — nyctalopia (night blindness), Bitot's spots, eventual xerophthalmia and blindness. Treated promptly with high-dose retinol."
  },
  {
    id: 2,
    shortName: "Transducin (Gt)",
    title: "2. Metarhodopsin II activates transducin",
    body: "MII catalyses GDP → GTP exchange on the Gα subunit of transducin (Gt). Each MII can activate hundreds of Gt molecules before being phosphorylated by rhodopsin kinase and capped by arrestin — built-in amplification stage 1.",
    clinical: "Mutations in rhodopsin or transducin cause autosomal-dominant retinitis pigmentosa — progressive bone-spicule pigmentation and rod-then-cone degeneration starting peripherally."
  },
  {
    id: 3,
    shortName: "PDE activated",
    title: "3. Gα-GTP activates phosphodiesterase (PDE)",
    body: "Each Gα-GTP binds and removes the inhibitory γ-subunit from cGMP-PDE, freeing the catalytic α/β subunits. One active PDE hydrolyses thousands of cGMP per second — amplification stage 2. Net gain across the cascade ≈ 10⁵–10⁶.",
    clinical: "Sildenafil (Viagra) inhibits PDE5 — different isoform, mainly vascular, but cross-inhibition of retinal PDE6 at high dose causes BLUE-TINTED vision (cyanopsia) and photophobia."
  },
  {
    id: 4,
    shortName: "cGMP falls",
    title: "4. PDE hydrolyses cGMP → 5'-GMP",
    body: "Cytosolic [cGMP] drops within ~100 ms of the photon. In the DARK, [cGMP] is high (~4 μM) and keeps CNG channels open — this is the 'dark current'. Light is the SIGNAL TO STOP — the photoreceptor is unique in that stimulation inhibits its baseline activity.",
    clinical: "Mutations in CNG channel subunits cause achromatopsia — total color blindness from birth, photophobia, nystagmus. Cone CNG is more affected than rod."
  },
  {
    id: 5,
    shortName: "Channels close",
    title: "5. cGMP-gated Na⁺ / Ca²⁺ channels close",
    body: "CNG channels lose their cGMP ligand and close. Na⁺ and Ca²⁺ influx STOPS — the dark current is extinguished. The membrane HYPERPOLARISES from −40 mV (depolarised rest in dark) toward −70 mV.",
    clinical: "The high resting [Ca²⁺]ᵢ in the dark also provides recovery: when channels close, [Ca²⁺]ᵢ falls → guanylyl cyclase activity rises (via GCAP) → cGMP regenerated → channels re-open → adaptation. This is why your eyes adjust after a flash."
  },
  {
    id: 6,
    shortName: "↓ glutamate",
    title: "6. Hyperpolarisation → reduced glutamate release",
    body: "Less depolarisation = fewer voltage-gated Ca²⁺ channels open at the synaptic terminal → LESS glutamate released onto bipolar cells. ON-bipolars (with mGluR6 sign-inverting receptors) are released from inhibition; OFF-bipolars are simply less excited.",
    clinical: "Retinitis pigmentosa eventually obliterates this output. Gene therapy (voretigene neparvovec for RPE65 mutations) and retinal prostheses (Argus II) try to substitute. Stargardt disease (ABCA4) accumulates all-trans retinal in RPE → macular degeneration."
  }
];

export default function PhototransductionWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = Number(searchParams.get("step") ?? 1) as StepId;
  const [stepId, setStepId] = useState<StepId>(STEPS.some((s) => s.id === initial) ? initial : 1);
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
    const next = Number(searchParams.get("step") ?? 1) as StepId;
    if (STEPS.some((s) => s.id === next)) setStepId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const step = STEPS.find((s) => s.id === stepId)!;
  const W = 720;
  const H = 460;
  const isLight = stepId >= 1;
  const channelsOpen = stepId < 5;
  const vm = channelsOpen ? -40 : -70;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Phototransduction cascade">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Clinical:</span>{" "}
              <span className="text-ph-muted">{step.clinical}</span>
            </p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Outer-segment disc (top) — rhodopsin embedded */}
            <g>
              <rect
                x={60}
                y={40}
                width={420}
                height={140}
                rx={14}
                fill="color-mix(in srgb, var(--ph-curve-3), transparent 90%)"
                stroke="color-mix(in srgb, var(--ph-curve-3), transparent 55%)"
                strokeWidth={1.5}
              />
              <text x={270} y={62} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
                ROD OUTER SEGMENT · DISC MEMBRANE
              </text>

              {/* Rhodopsin */}
              <g>
                <circle
                  cx={130}
                  cy={120}
                  r={26}
                  fill={stepId === 1 ? "var(--ph-curve-2)" : "color-mix(in srgb, var(--ph-curve-2), transparent 75%)"}
                  stroke={stepId === 1 ? "var(--ph-curve-2)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 1 ? 3 : 1.5}
                />
                <text x={130} y={124} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-bg)">
                  R*
                </text>
                <text x={130} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-curve-2)">
                  rhodopsin
                </text>
                {stepId === 1 ? (
                  <g>
                    <text x={80} y={80} fontSize="22" fontWeight="800" fill="var(--ph-curve-2)">
                      ☀
                    </text>
                    <line x1={92} y1={92} x2={120} y2={110} stroke="var(--ph-curve-2)" strokeWidth={2} markerEnd="url(#photo-arrow)" />
                  </g>
                ) : null}
              </g>

              <defs>
                <marker id="photo-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0L10 5L0 10z" fill="var(--ph-curve-2)" />
                </marker>
              </defs>

              {/* Transducin */}
              <g>
                <circle
                  cx={230}
                  cy={120}
                  r={22}
                  fill={stepId === 2 ? "var(--ph-curve-1)" : "color-mix(in srgb, var(--ph-curve-1), transparent 80%)"}
                  stroke={stepId === 2 ? "var(--ph-curve-1)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 2 ? 3 : 1.2}
                />
                <text x={230} y={124} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
                  Gt
                </text>
                <text x={230} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-curve-1)">
                  transducin
                </text>
                {stepId === 2 ? <text x={230} y={100} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--ph-curve-1)">GDP → GTP</text> : null}
              </g>

              {/* PDE */}
              <g>
                <rect
                  x={300}
                  y={102}
                  width={50}
                  height={36}
                  rx={4}
                  fill={stepId === 3 ? "var(--ph-curve-4)" : "color-mix(in srgb, var(--ph-curve-4), transparent 80%)"}
                  stroke={stepId === 3 ? "var(--ph-curve-4)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 3 ? 3 : 1.2}
                />
                <text x={325} y={124} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
                  PDE
                </text>
                <text x={325} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-curve-4)">
                  PDE6
                </text>
              </g>

              {/* cGMP molecules */}
              <g>
                <text x={400} y={108} fontSize="11" fontWeight="700" fill="var(--ph-muted)">
                  cGMP pool
                </text>
                {Array.from({ length: stepId < 4 ? 8 : 1 }).map((_, i) => {
                  const cx = 395 + (i % 4) * 18;
                  const cy = 118 + Math.floor(i / 4) * 16;
                  return <circle key={i} cx={cx} cy={cy} r={4.5} fill="var(--ph-curve-6)" />;
                })}
                {stepId >= 4 ? (
                  <text x={395} y={158} fontSize="10" fontWeight="800" fill="var(--ph-curve-6)">
                    ↓ hydrolysed → 5&apos;-GMP
                  </text>
                ) : null}
              </g>
            </g>

            {/* Plasma membrane + CNG channels (bottom) */}
            <line x1={40} y1={250} x2={680} y2={250} stroke="var(--ph-axis)" strokeWidth={1.5} />
            <line x1={40} y1={266} x2={680} y2={266} stroke="var(--ph-axis)" strokeWidth={1.5} />
            <text x={680} y={244} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
              PLASMA MEMBRANE
            </text>

            {[150, 250, 350, 450, 550].map((cx, i) => (
              <g key={`cng-${i}`}>
                <rect
                  x={cx - 16}
                  y={240}
                  width={32}
                  height={36}
                  rx={4}
                  fill={channelsOpen ? "var(--ph-curve-6)" : "var(--ph-surface)"}
                  stroke={stepId === 5 ? "var(--ph-curve-4)" : channelsOpen ? "var(--ph-curve-6)" : "var(--ph-axis)"}
                  strokeWidth={stepId === 5 ? 2.5 : 1.2}
                />
                <text x={cx} y={262} textAnchor="middle" fontSize="9" fontWeight="800" fill={channelsOpen ? "white" : "var(--ph-muted)"}>
                  CNG
                </text>
                <text x={cx} y={296} textAnchor="middle" fontSize="14" fontWeight="800" fill={channelsOpen ? "var(--ph-curve-6)" : "var(--ph-axis)"}>
                  {channelsOpen ? "↓" : "✕"}
                </text>
                {channelsOpen && i === 0 ? (
                  <text x={cx} y={232} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-curve-6)">
                    Na⁺/Ca²⁺
                  </text>
                ) : null}
              </g>
            ))}

            {/* Membrane potential trace */}
            <g>
              <rect x={60} y={325} width={600} height={100} fill="color-mix(in srgb, var(--ph-surface), black 5%)" stroke="var(--ph-border)" strokeWidth={1} rx={6} />
              <text x={70} y={345} fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
                MEMBRANE POTENTIAL
              </text>
              <line x1={70} y1={385} x2={650} y2={385} stroke="var(--ph-axis)" strokeWidth={0.6} strokeDasharray="3 4" />
              <text x={668} y={388} fontSize="9" fill="var(--ph-muted)">
                −70 mV
              </text>
              <line x1={70} y1={365} x2={650} y2={365} stroke="var(--ph-axis)" strokeWidth={0.6} strokeDasharray="3 4" />
              <text x={668} y={368} fontSize="9" fill="var(--ph-muted)">
                −40 mV
              </text>
              <path
                d={`M 70 365 L 350 365 ${channelsOpen ? "L 650 365" : "L 380 365 C 410 365 430 385 470 385 L 650 385"}`}
                fill="none"
                stroke={channelsOpen ? "var(--ph-curve-6)" : "var(--ph-curve-1)"}
                strokeWidth={2.5}
              />
              <text x={350} y={415} textAnchor="middle" fontSize="11" fontWeight="800" fill={channelsOpen ? "var(--ph-curve-6)" : "var(--ph-curve-1)"}>
                {channelsOpen ? `Dark current ON · Vm ≈ ${vm} mV` : `Hyperpolarised · Vm ≈ ${vm} mV → ↓ glutamate`}
              </text>
            </g>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the cascade</h2>
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
