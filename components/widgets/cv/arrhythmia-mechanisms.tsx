"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "cv/arrhythmia-mechanisms";
const diagram = getDiagramById(DIAGRAM_ID);

type MechId = "automaticity" | "ead" | "dad" | "reentry" | "avnrt" | "wpw" | "afib";

type Mech = {
  id: MechId;
  shortName: string;
  fullName: string;
  category: string;
  mechanism: string;
  examples: string;
  clinical: string;
  colorVar: string;
};

const MECHS: Mech[] = [
  {
    id: "automaticity", shortName: "↑ Automaticity", fullName: "Enhanced / abnormal automaticity",
    category: "Abnormal impulse FORMATION",
    mechanism: "A focus depolarises faster than the SA node (steeper phase-4 slope) and seizes pacemaker control — either an enhanced normal pacemaker or an ectopic focus in normally quiescent tissue.",
    examples: "Sinus tachycardia, ectopic atrial tachycardia, accelerated idioventricular rhythm, multifocal atrial tachycardia (COPD).",
    clinical: "Catecholamines, hypokalemia, ischemia, and digoxin all enhance automaticity. Treated by removing the trigger; β-blockers slow phase 4.",
    colorVar: "var(--ph-curve-1)"
  },
  {
    id: "ead", shortName: "EADs", fullName: "Early afterdepolarisations",
    category: "Triggered activity",
    mechanism: "A depolarisation during phase 2/3 of a PROLONGED action potential (long QT). Reactivation of L-type Ca²⁺ channels before repolarisation completes → a second upstroke.",
    examples: "Torsades de pointes from long QT (congenital, drugs, ↓K⁺/↓Mg²⁺/↓Ca²⁺, bradycardia).",
    clinical: "Favoured by SLOW rates and long QT. Treat torsades with IV magnesium; overdrive pacing or isoproterenol shortens the QT.",
    colorVar: "var(--ph-curve-4)"
  },
  {
    id: "dad", shortName: "DADs", fullName: "Delayed afterdepolarisations",
    category: "Triggered activity",
    mechanism: "A depolarisation AFTER repolarisation (phase 4), driven by intracellular Ca²⁺ OVERLOAD → spontaneous SR Ca²⁺ release → Na⁺/Ca²⁺ exchanger inward current.",
    examples: "Digoxin toxicity, catecholaminergic polymorphic VT (CPVT), reperfusion arrhythmias.",
    clinical: "Favoured by FAST rates and Ca²⁺ loading. Digoxin (blocks Na/K ATPase → Ca²⁺ overload) is the classic cause.",
    colorVar: "var(--ph-curve-7)"
  },
  {
    id: "reentry", shortName: "Reentry", fullName: "Reentry (circus movement)",
    category: "Abnormal impulse CONDUCTION",
    mechanism: "Requires (1) two pathways, (2) unidirectional block in one, and (3) slow conduction so the blocked path recovers in time to be re-excited → a self-sustaining loop. The mechanism behind MOST clinically important tachyarrhythmias.",
    examples: "Atrial flutter (cavotricuspid isthmus), monomorphic VT around scar, AVNRT, AVRT.",
    clinical: "Anatomic or functional circuits. Ablation cures by interrupting the loop; class I/III drugs alter conduction/refractoriness.",
    colorVar: "var(--ph-curve-6)"
  },
  {
    id: "avnrt", shortName: "AVNRT", fullName: "AV nodal reentrant tachycardia",
    category: "Reentry (within the AV node)",
    mechanism: "Dual AV-nodal pathways (slow + fast). A premature beat blocks in the fast path, goes down the slow path, then back up the recovered fast path → micro-reentry in/near the node.",
    examples: "The most common paroxysmal SVT; regular narrow-complex tachycardia ~150–250 bpm, often with a pseudo-R' in V1.",
    clinical: "Terminate with vagal maneuvers or adenosine (blocks the AV node). Definitive: slow-pathway ablation.",
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "wpw", shortName: "WPW / AVRT", fullName: "Accessory pathway (WPW) reentry",
    category: "Reentry (using an accessory pathway)",
    mechanism: "An accessory bundle (Kent) bypasses the AV node → pre-excitation (delta wave, short PR). A reentrant circuit forms between the node and the accessory pathway (orthodromic = narrow, antidromic = wide).",
    examples: "WPW syndrome; AVRT. Atrial fibrillation conducting down the accessory pathway → dangerously fast ventricular rates.",
    clinical: "In WPW + AFib, AVOID AV-nodal blockers (adenosine, β-blockers, Ca-channel blockers, digoxin) — they can accelerate accessory conduction → VF. Use procainamide; ablate the pathway.",
    colorVar: "var(--ph-curve-2)"
  },
  {
    id: "afib", shortName: "AFib", fullName: "Atrial fibrillation",
    category: "Multiple reentrant wavelets / ectopic foci",
    mechanism: "Chaotic atrial activation from multiple reentrant wavelets and ectopic foci (often the pulmonary vein ostia). The AV node filters the bombardment → irregularly irregular ventricular response.",
    examples: "Most common sustained arrhythmia; risk rises with age, hypertension, valvular disease, hyperthyroidism, alcohol.",
    clinical: "Rate vs rhythm control + anticoagulation by CHA₂DS₂-VASc (stasis in the left atrial appendage → embolic stroke). Pulmonary-vein isolation ablation for refractory cases.",
    colorVar: "var(--ph-curve-5)"
  }
];

export default function ArrhythmiaMechanismsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (MECHS.find((m) => m.id === searchParams.get("mech"))?.id ?? "reentry") as MechId;
  const [selectedId, setSelectedId] = useState<MechId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mech", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("mech") as MechId | null;
    if (next && MECHS.find((m) => m.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sel = MECHS.find((m) => m.id === selectedId)!;
  const isReentry = ["reentry", "avnrt", "wpw", "afib"].includes(selectedId);
  const W = 720, H = 220;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Arrhythmia mechanism">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{sel.fullName} · {sel.category}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{sel.mechanism}</p>
            <div className="mt-2 grid gap-1 text-sm">
              <p><span className="font-bold text-ph-text">Examples:</span> <span className="text-ph-muted">{sel.examples}</span></p>
              <p><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{sel.clinical}</span></p>
            </div>
          </div>

          <svg role="img" aria-label={sel.fullName} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {isReentry ? (
              // Reentry loop schematic
              <g>
                <text x="360" y="30" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="1.2" fill="var(--ph-muted)">REENTRY CIRCUIT</text>
                <ellipse cx="360" cy="120" rx="150" ry="70" fill="none" stroke={sel.colorVar} strokeWidth="3" />
                {/* unidirectional block */}
                <rect x="345" y="46" width="30" height="12" rx="3" fill="var(--ph-danger)" />
                <text x="360" y="40" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-danger)">unidirectional block</text>
                {/* slow limb */}
                <text x="195" y="125" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">slow path</text>
                <text x="525" y="125" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">fast path</text>
                {/* circulating arrow */}
                <path d="M 360 190 A 150 70 0 0 1 210 120" fill="none" stroke="var(--ph-ok)" strokeWidth="3" markerEnd="url(#arr-circ)" />
                <defs><marker id="arr-circ" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ph-ok)" /></marker></defs>
                <text x="360" y="125" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-accent)">circus movement</text>
              </g>
            ) : (
              // Action-potential schematic with the offending afterdepolarisation
              <g>
                <text x="360" y="30" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="1.2" fill="var(--ph-muted)">{sel.category.toUpperCase()}</text>
                <line x1="40" y1="170" x2="680" y2="170" stroke="var(--ph-axis)" strokeWidth="0.6" opacity="0.4" />
                {/* AP shape */}
                <path d={
                  selectedId === "automaticity"
                    ? "M 60 165 L 120 150 L 150 60 L 200 70 L 260 150 L 300 130 L 360 60 L 410 70 L 470 150 L 510 132 L 570 64"
                    : selectedId === "ead"
                      ? "M 60 165 L 110 60 L 230 90 L 250 64 L 300 110 L 360 165"
                      : "M 60 165 L 110 60 L 240 100 L 360 162 L 420 120 L 470 165"
                } fill="none" stroke={sel.colorVar} strokeWidth="3" strokeLinejoin="round" />
                {selectedId === "ead" ? <text x="250" y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-danger)">EAD (phase 2/3)</text> : null}
                {selectedId === "dad" ? <text x="420" y="108" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-danger)">DAD (phase 4)</text> : null}
                {selectedId === "automaticity" ? <text x="360" y="50" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-accent)">steep phase-4 slope → faster firing</text> : null}
              </g>
            )}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Three ways rhythms go wrong, one click each. Abnormal AUTOMATICITY is a site firing on its own; TRIGGERED activity is afterdepolarizations (EADs in long QT, DADs in digoxin or calcium overload) riding on the prior beat; REENTRY is a wave circling a fixed obstacle. Click a mechanism to see its cellular basis and the rhythms it produces."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Mechanism selector">
            <h2 className="ph-section-label mb-4">Click a mechanism</h2>
            <div className="grid gap-2">
              {MECHS.map((m) => (
                <button key={m.id} type="button" onClick={() => setSelectedId(m.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    m.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}>
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.colorVar }} />
                  <span className="font-bold">{m.shortName}</span>
                  <span className="truncate text-xs">{m.fullName}</span>
                </button>
              ))}
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
