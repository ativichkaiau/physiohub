"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "nerv/autonomic-nervous-system";
const diagram = getDiagramById(DIAGRAM_ID);

type OrganId = "eye" | "salivary" | "heart" | "lungs" | "gi" | "bladder" | "vessels" | "sweat" | "adrenal";

type Organ = {
  id: OrganId;
  shortName: string;
  fullName: string;
  symReceptor: string;
  symEffect: string;
  parReceptor: string;
  parEffect: string;
  pearl: string;
  colorVar: string;
  cx: number;
  cy: number;
};

const ORGANS: Organ[] = [
  {
    id: "eye",
    shortName: "Eye",
    fullName: "Eye (pupil + ciliary muscle)",
    symReceptor: "α1 (radial muscle)",
    symEffect: "Mydriasis (pupil dilation); slight far-vision focus.",
    parReceptor: "M3 (sphincter + ciliary)",
    parEffect: "Miosis (constriction) + accommodation for near vision.",
    pearl: "Phenylephrine (α1) dilates for fundoscopy without cycloplegia. Atropine (anti-M) dilates + paralyses accommodation. Horner syndrome = lost sympathetics → miosis, ptosis, anhidrosis.",
    colorVar: "var(--ph-curve-3)",
    cx: 150,
    cy: 90
  },
  {
    id: "salivary",
    shortName: "Saliva",
    fullName: "Salivary glands",
    symReceptor: "α1 / β",
    symEffect: "Scant, thick, viscous secretion.",
    parReceptor: "M3",
    parEffect: "Copious, watery, enzyme-rich secretion.",
    pearl: "Anticholinergics (atropine, antihistamines, TCAs) → dry mouth. Pilocarpine (M agonist) treats xerostomia in Sjögren's.",
    colorVar: "var(--ph-curve-5)",
    cx: 150,
    cy: 175
  },
  {
    id: "heart",
    shortName: "Heart",
    fullName: "Heart (SA/AV node + myocardium)",
    symReceptor: "β1 (β2 minor)",
    symEffect: "↑ Heart rate, ↑ contractility, ↑ AV conduction.",
    parReceptor: "M2 (vagus)",
    parEffect: "↓ Heart rate, ↓ AV conduction (vagal brake).",
    pearl: "β1-blockers (metoprolol) slow HR + reduce O₂ demand. Atropine (anti-M2) treats symptomatic bradycardia. Resting HR is set by tonic vagal dominance — a transplanted (denervated) heart runs ~100 bpm.",
    colorVar: "var(--ph-curve-4)",
    cx: 360,
    cy: 120
  },
  {
    id: "lungs",
    shortName: "Lungs",
    fullName: "Bronchial smooth muscle + glands",
    symReceptor: "β2",
    symEffect: "Bronchodilation; ↓ secretions.",
    parReceptor: "M3 (vagus)",
    parEffect: "Bronchoconstriction; ↑ secretions.",
    pearl: "β2-agonists (albuterol) + antimuscarinics (ipratropium, tiotropium) are the two bronchodilator classes. Note: airways have NO direct sympathetic innervation — β2 responds to circulating adrenaline.",
    colorVar: "var(--ph-curve-6)",
    cx: 360,
    cy: 205
  },
  {
    id: "gi",
    shortName: "GI",
    fullName: "GI tract (motility, secretion, sphincters)",
    symReceptor: "α2 / β2 (+ α1 sphincters)",
    symEffect: "↓ Motility, ↓ secretion, CONTRACT sphincters.",
    parReceptor: "M3 (vagus + sacral)",
    parEffect: "↑ Motility, ↑ secretion, RELAX sphincters.",
    pearl: "'Rest and digest' — parasympathetic drives the gut. Anticholinergics cause constipation + ileus. The enteric nervous system can run motility autonomously, but the ANS tunes it.",
    colorVar: "var(--ph-curve-2)",
    cx: 360,
    cy: 290
  },
  {
    id: "bladder",
    shortName: "Bladder",
    fullName: "Bladder (detrusor + sphincters)",
    symReceptor: "β3 detrusor + α1 sphincter",
    symEffect: "RELAX detrusor + CONTRACT internal sphincter = storage.",
    parReceptor: "M3 (pelvic)",
    parEffect: "CONTRACT detrusor + relax sphincter = voiding.",
    pearl: "Mnemonic: sympathetic Stores, parasympathetic Pees. β3-agonist (mirabegron) + antimuscarinics (oxybutynin) treat overactive bladder. α1-blockers (tamsulosin) relax the outlet in BPH.",
    colorVar: "var(--ph-curve-1)",
    cx: 360,
    cy: 375
  },
  {
    id: "vessels",
    shortName: "Vessels",
    fullName: "Blood vessels (vascular smooth muscle)",
    symReceptor: "α1 (skin/splanchnic) · β2 (muscle)",
    symEffect: "α1 vasoconstriction; β2 vasodilation in skeletal muscle.",
    parReceptor: "— (almost none)",
    parEffect: "Most vessels have NO parasympathetic supply.",
    pearl: "Vascular tone is a sympathetic monopoly (except genital erectile tissue, M3/NO). α1-agonists (norepinephrine, phenylephrine) raise SVR in shock; α1-blockers cause orthostatic hypotension.",
    colorVar: "var(--ph-curve-7)",
    cx: 570,
    cy: 150
  },
  {
    id: "sweat",
    shortName: "Sweat",
    fullName: "Sweat glands (thermoregulatory)",
    symReceptor: "M3 (sympathetic CHOLINERGIC!)",
    symEffect: "Thermoregulatory sweating via ACh — the great exception.",
    parReceptor: "— (none)",
    parEffect: "No parasympathetic supply.",
    pearl: "Eccrine sweat glands are sympathetic but use ACETYLCHOLINE on muscarinic receptors — the one sympathetic post-ganglionic exception. Hence anticholinergics cause anhidrosis + hyperthermia ('dry as a bone, hot as a hare').",
    colorVar: "var(--ph-curve-5)",
    cx: 570,
    cy: 235
  },
  {
    id: "adrenal",
    shortName: "Adrenal",
    fullName: "Adrenal medulla",
    symReceptor: "Nicotinic (Nn) — preganglionic",
    symEffect: "Preganglionic sympathetic fibre → releases Epi (80%) + NE.",
    parReceptor: "— (none)",
    parEffect: "No parasympathetic supply.",
    pearl: "The adrenal medulla is a modified sympathetic ganglion: preganglionic fibres synapse directly on chromaffin cells via NICOTINIC receptors (no postganglionic neuron). Pheochromocytoma = catecholamine-secreting tumour of these cells.",
    colorVar: "var(--ph-curve-4)",
    cx: 570,
    cy: 320
  }
];

export default function AutonomicNervousSystemWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (ORGANS.find((o) => o.id === searchParams.get("organ"))?.id ?? "heart") as OrganId;
  const [selectedId, setSelectedId] = useState<OrganId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("organ", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("organ") as OrganId | null;
    if (next && ORGANS.find((o) => o.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = ORGANS.find((o) => o.id === selectedId)!;
  const W = 720;
  const H = 440;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Autonomic target map">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{selected.fullName}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-ph border border-[color-mix(in_srgb,var(--ph-danger),transparent_60%)] bg-[color-mix(in_srgb,var(--ph-danger),transparent_92%)] p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-ph-danger">Sympathetic</p>
                <p className="mt-1 text-xs font-bold text-ph-text">{selected.symReceptor}</p>
                <p className="mt-0.5 text-xs text-ph-muted">{selected.symEffect}</p>
              </div>
              <div className="rounded-ph border border-[color-mix(in_srgb,var(--ph-ok),transparent_60%)] bg-[color-mix(in_srgb,var(--ph-ok),transparent_92%)] p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-ph-ok">Parasympathetic</p>
                <p className="mt-1 text-xs font-bold text-ph-text">{selected.parReceptor}</p>
                <p className="mt-0.5 text-xs text-ph-muted">{selected.parEffect}</p>
              </div>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Pearl:</span> <span className="text-ph-muted">{selected.pearl}</span>
            </p>
          </div>

          <svg role="img" aria-label="Autonomic nervous system target organs" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Two outflow spines */}
            <text x="60" y="34" fill="var(--ph-danger)" fontSize="11" fontWeight="900" letterSpacing="1.2">SYMPATHETIC (T1–L2)</text>
            <text x={W - 60} y="34" textAnchor="end" fill="var(--ph-ok)" fontSize="11" fontWeight="900" letterSpacing="1.2">PARASYMPATHETIC (CN + S2–4)</text>
            <line x1="40" y1="52" x2="40" y2={H - 30} stroke="var(--ph-danger)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
            <line x1={W - 40} y1="52" x2={W - 40} y2={H - 30} stroke="var(--ph-ok)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

            {ORGANS.map((o) => {
              const isSelected = o.id === selectedId;
              return (
                <g key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(o.id)} role="button" aria-label={`Select ${o.fullName}`}>
                  {/* connectors to both spines */}
                  <line x1="40" y1={o.cy} x2={o.cx - 30} y2={o.cy} stroke="var(--ph-danger)" strokeWidth={isSelected ? 2 : 1} opacity={isSelected ? 0.7 : 0.3} />
                  <line x1={W - 40} y1={o.cy} x2={o.cx + 30} y2={o.cy} stroke="var(--ph-ok)" strokeWidth={isSelected ? 2 : 1} opacity={isSelected ? 0.7 : 0.3} />
                  <rect
                    x={o.cx - 46}
                    y={o.cy - 18}
                    width="92"
                    height="36"
                    rx="9"
                    fill={isSelected ? o.colorVar : `color-mix(in srgb, ${o.colorVar}, transparent 70%)`}
                    stroke={o.colorVar}
                    strokeWidth={isSelected ? 3 : 1.3}
                  />
                  <text x={o.cx} y={o.cy + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={isSelected ? "white" : "var(--ph-text)"}>
                    {o.shortName}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">Reading the trace · </span>
            <Highlighted text={"Click a target organ to compare the two divisions and their receptors. Sympathetic and parasympathetic usually oppose each other, but watch the exceptions: sweat glands are sympathetic yet cholinergic, the adrenal medulla is a modified sympathetic ganglion, and most blood vessels take sympathetic tone only."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Organ selector">
            <h2 className="ph-section-label mb-4">Click a target organ</h2>
            <div className="grid gap-2">
              {ORGANS.map((o) => {
                const isSelected = o.id === selectedId;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}
                  >
                    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.colorVar }} />
                    <span className="font-bold">{o.shortName}</span>
                    <span className="truncate text-xs">{o.fullName}</span>
                  </button>
                );
              })}
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
