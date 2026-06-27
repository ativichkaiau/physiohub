"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "resp/co2-transport";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5 | 6;
type Step = { id: StepId; shortName: string; title: string; body: string; clinical: string };

const STEPS: Step[] = [
  {
    id: 1, shortName: "CO₂ load", title: "1. Tissue CO₂ enters the blood",
    body: "Metabolising tissue produces CO₂, which diffuses down its gradient into the plasma and then into red blood cells. CO₂ is carried three ways: ~70% as BICARBONATE, ~23% bound to haemoglobin (carbamino), ~7% dissolved.",
    clinical: "The Haldane effect: deoxygenated haemoglobin (in the tissues, having just unloaded O₂) carries MORE CO₂ and H⁺ — so giving up O₂ primes Hb to pick up CO₂."
  },
  {
    id: 2, shortName: "Carbamino", title: "2. CO₂ binds haemoglobin (carbamino)",
    body: "About a quarter of CO₂ binds directly to the N-terminal amino groups of globin chains (NOT the heme — that carries O₂). This is carbaminohaemoglobin. Deoxy-Hb binds it preferentially (Haldane).",
    clinical: "Distinct from carboxyhaemoglobin (CO poisoning), which binds the heme iron with 200–250× the affinity of O₂ and shifts the O₂ curve left."
  },
  {
    id: 3, shortName: "CA → HCO₃⁻", title: "3. Carbonic anhydrase: CO₂ + H₂O → H⁺ + HCO₃⁻",
    body: "Inside the RBC, carbonic anhydrase rapidly hydrates CO₂ to carbonic acid, which dissociates to H⁺ and bicarbonate. This is the bulk pathway (~70% of CO₂ transport) and the link between respiration and acid–base balance.",
    clinical: "Acetazolamide inhibits carbonic anhydrase → bicarbonate wasting (metabolic acidosis), used for glaucoma, altitude sickness, and alkalosis. CA is also why blood pCO₂ couples tightly to pH (pH ∝ HCO₃⁻ / pCO₂)."
  },
  {
    id: 4, shortName: "Chloride shift", title: "4. Chloride shift (Hamburger shift)",
    body: "Bicarbonate is exported from the RBC into plasma via the band-3 anion exchanger (AE1) in exchange for Cl⁻ moving IN — keeping the cell electrically neutral. This 'chloride shift' lets plasma carry most of the bicarbonate.",
    clinical: "Venous RBCs are slightly more swollen and chloride-rich than arterial ones because of this shift. The reverse happens in the lung."
  },
  {
    id: 5, shortName: "H⁺ buffered", title: "5. H⁺ buffered by haemoglobin",
    body: "The H⁺ generated in step 3 is buffered by haemoglobin (histidine residues). Deoxy-Hb is a better proton buffer than oxy-Hb — another face of the Haldane effect — so unloading O₂ in the tissues lets Hb mop up the acid load.",
    clinical: "This buffering is why a large CO₂ load only modestly changes venous pH. It also underlies the isohydric transport of CO₂ as bicarbonate."
  },
  {
    id: 6, shortName: "Lung reversal", title: "6. In the lung — everything runs backward",
    body: "At the alveolus, O₂ binds Hb → oxy-Hb DUMPS its CO₂ and H⁺ (Haldane). Bicarbonate moves back INTO the RBC (Cl⁻ out), recombines with H⁺ → carbonic acid → CO₂ + H₂O, and CO₂ is exhaled.",
    clinical: "The reciprocal Bohr (O₂ unloading favoured by CO₂/H⁺) and Haldane (CO₂ loading favoured by deoxygenation) effects make gas exchange self-reinforcing at both the tissue and the lung."
  }
];

export default function Co2TransportWidget() {
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
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [stepId, pathname, router, searchParams]);

  useEffect(() => {
    const next = Number(searchParams.get("step") ?? 1) as StepId;
    if (STEPS.some((s) => s.id === next)) setStepId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const step = STEPS.find((s) => s.id === stepId)!;
  const W = 720, H = 230;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="CO2 transport in the red cell">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span></p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* RBC */}
            <ellipse cx="360" cy="120" rx="180" ry="80" fill="color-mix(in srgb, var(--ph-curve-4), transparent 86%)" stroke="color-mix(in srgb, var(--ph-curve-4), transparent 50%)" strokeWidth="1.5" />
            <text x="360" y="36" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="1.2" fill="var(--ph-muted)">RED BLOOD CELL</text>
            <text x="80" y="120" fontSize="10" fontWeight="700" fill="var(--ph-muted)">plasma</text>

            {/* distribution chips */}
            {[
              { id: 2, label: "Hb·CO₂ ~23%", x: 250, color: "var(--ph-curve-2)" },
              { id: 3, label: "HCO₃⁻ ~70%", x: 400, color: "var(--ph-curve-6)" },
              { id: 1, label: "dissolved ~7%", x: 360, color: "var(--ph-curve-3)" }
            ].map((c) => (
              <g key={c.id}>
                <rect x={c.x - 52} y={c.id === 1 ? 150 : 96} width="104" height="26" rx="7"
                  fill={stepId === c.id ? c.color : `color-mix(in srgb, ${c.color}, transparent 72%)`} stroke={c.color} strokeWidth={stepId === c.id ? 2.5 : 1} />
                <text x={c.x} y={c.id === 1 ? 167 : 113} textAnchor="middle" fontSize="11" fontWeight="800" fill={stepId === c.id ? "white" : "var(--ph-text)"}>{c.label}</text>
              </g>
            ))}

            {/* CA enzyme */}
            {stepId === 3 ? <text x="400" y="86" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-curve-6)">carbonic anhydrase</text> : null}
            {/* chloride shift arrows */}
            {stepId === 4 ? (
              <g>
                <line x1="540" y1="108" x2="600" y2="108" stroke="var(--ph-curve-6)" strokeWidth="2.5" markerEnd="url(#co2-arr)" />
                <line x1="600" y1="132" x2="540" y2="132" stroke="var(--ph-curve-1)" strokeWidth="2.5" markerEnd="url(#co2-arr2)" />
                <text x="612" y="112" fontSize="10" fontWeight="800" fill="var(--ph-curve-6)">HCO₃⁻ out</text>
                <text x="612" y="136" fontSize="10" fontWeight="800" fill="var(--ph-curve-1)">Cl⁻ in</text>
                <text x="540" y="92" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-muted)">band-3 (AE1)</text>
                <defs>
                  <marker id="co2-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ph-curve-6)" /></marker>
                  <marker id="co2-arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ph-curve-1)" /></marker>
                </defs>
              </g>
            ) : null}
            {stepId === 6 ? <text x="360" y="210" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-accent)">at the lung: O₂ in → CO₂ + H⁺ released (Haldane) → exhaled</text> : null}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Click the journey of CO2 from tissue to lung. Most of it rides as bicarbonate: carbonic anhydrase in the red cell converts CO2 to bicarbonate, which leaves in exchange for chloride (the chloride shift); some binds hemoglobin as carbamino. In the lung it all reverses. The Haldane effect: oxygenated blood carries LESS CO2, so loading oxygen helps unload CO2."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk CO₂ transport</h2>
            <div className="grid gap-2">
              {STEPS.map((s) => (
                <button key={s.id} type="button" onClick={() => setStepId(s.id)}
                  className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                    s.id === stepId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}>
                  <span className="font-bold tabular-nums">{s.id}.</span> <span className="font-bold">{s.shortName}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <button type="button" onClick={() => stepId > 1 && setStepId((stepId - 1) as StepId)} disabled={stepId === 1}
                className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text">← Prev</button>
              <button type="button" onClick={() => stepId < 6 && setStepId((stepId + 1) as StepId)} disabled={stepId === 6}
                className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text">Next →</button>
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((r) => <li key={`${r.source}-${r.pages}`}>{r.source}{r.pages ? `, ${r.pages}` : ""}</li>)}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
