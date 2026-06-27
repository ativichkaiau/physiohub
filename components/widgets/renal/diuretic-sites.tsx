"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "renal/diuretic-sites";
const diagram = getDiagramById(DIAGRAM_ID);

type DrugId = "cai" | "osmotic" | "loop" | "thiazide" | "spiro" | "amiloride" | "vaptan";

type Drug = {
  id: DrugId;
  shortName: string;
  fullName: string;
  examples: string;
  segment: string;
  mechanism: string;
  electrolytes: string;
  uses: string;
  toxicity: string;
  colorVar: string;
  cx: number;
  cy: number;
};

const DRUGS: Drug[] = [
  {
    id: "cai",
    shortName: "CAI",
    fullName: "Carbonic anhydrase inhibitors",
    examples: "Acetazolamide · methazolamide · dorzolamide (topical, glaucoma)",
    segment: "Proximal convoluted tubule",
    mechanism: "Block carbonic anhydrase II (cytoplasmic) and IV (apical) → can't reabsorb HCO₃⁻ → urinary HCO₃⁻ loss → mild diuresis with hyperchloremic metabolic acidosis.",
    electrolytes: "Mild diuresis · ↓K⁺ (acidosis shifts K⁺ out + ↑distal Na⁺ delivery) · ↓HCO₃⁻ (loss) · ↑Cl⁻",
    uses: "Glaucoma (↓aqueous humour formation), high-altitude sickness prophylaxis (induces acidosis → respiratory drive), urinary alkalinisation, NREM pseudotumor cerebri.",
    toxicity: "Hyperchloremic metabolic acidosis, sulfa allergy cross-reactivity, NH₃ accumulation in hepatic encephalopathy.",
    colorVar: "var(--ph-curve-2)",
    cx: 180,
    cy: 110
  },
  {
    id: "osmotic",
    shortName: "Osmotic",
    fullName: "Osmotic diuretics",
    examples: "Mannitol · urea (historical) · glycerol",
    segment: "Proximal tubule + thin descending limb (water-permeable segments)",
    mechanism: "Freely filtered, not reabsorbed → hold water in the lumen by osmosis. Acts wherever the tubule is water-permeable.",
    electrolytes: "Pulls water out of cells INTO blood first (initial ↑ECV, ↑Na dilution), then large free-water diuresis. Can cause hypernatremia if free-water is lost in excess.",
    uses: "Acute reduction of intracranial / intra-ocular pressure (mannitol). Rhabdomyolysis (controversial). NOT for CHF — initial volume expansion is dangerous.",
    toxicity: "Pulmonary edema in CHF (initial intravascular pull), hypernatremia after diuresis, rebound ↑ICP if BBB compromised.",
    colorVar: "var(--ph-curve-3)",
    cx: 280,
    cy: 110
  },
  {
    id: "loop",
    shortName: "Loop",
    fullName: "Loop diuretics",
    examples: "Furosemide · bumetanide · torsemide · ethacrynic acid (non-sulfa)",
    segment: "Thick ascending limb of Henle",
    mechanism: "Block apical Na⁺-K⁺-2Cl⁻ cotransporter (NKCC2). Largest natriuresis of all diuretic classes (~25% of filtered Na⁺ delivered here). Also abolishes lumen-positive voltage → ↓paracellular Ca²⁺ and Mg²⁺ reabsorption.",
    electrolytes: "Massive Na⁺, water diuresis · ↓K⁺ (↑distal flow + acid-base) · ↓Ca²⁺ (urinary loss) · ↓Mg²⁺ · ↓Cl⁻ · metabolic alkalosis",
    uses: "Acute pulmonary edema, refractory CHF, hypercalcaemia, edematous states (cirrhosis, nephrotic). Hyperkalaemia adjunct. Highest ceiling effect.",
    toxicity: "OH-DANG mnemonic: Ototoxicity (transient, dose-related) · Hypokalemic alkalosis · Dehydration · Allergy (sulfa, ethacrynic acid is the alternative) · Nephritis (interstitial) · Gout. Also hyperuricemia, hyperglycemia.",
    colorVar: "var(--ph-curve-1)",
    cx: 380,
    cy: 290
  },
  {
    id: "thiazide",
    shortName: "Thiazide",
    fullName: "Thiazide diuretics",
    examples: "Hydrochlorothiazide · chlorthalidone (longer t½) · indapamide · metolazone (works in CKD)",
    segment: "Distal convoluted tubule",
    mechanism: "Block apical Na⁺-Cl⁻ cotransporter (NCC). Modest natriuresis (~5%) but enough to lower BP. Paradoxically INCREASE Ca²⁺ reabsorption (Na⁺ depletion → ↑PCT Na/Ca exchange).",
    electrolytes: "Modest Na⁺ + water loss · ↓K⁺ · ↓Mg²⁺ · ↑Ca²⁺ (hypocalciuria) · ↑uric acid · ↑glucose · ↑lipids · metabolic alkalosis",
    uses: "First-line essential hypertension (ALLHAT). Idiopathic hypercalciuric stones. Nephrogenic DI (paradoxical effect — induces volume depletion → ↑PCT Na/water reabsorption → ↓distal delivery → less polyuria).",
    toxicity: "Hyper GLUC (Glucose, Lipids, Uric acid, Ca) + Hypo K, Mg, Na (older patients). Sulfa allergy. Pancreatitis.",
    colorVar: "var(--ph-curve-6)",
    cx: 500,
    cy: 110
  },
  {
    id: "spiro",
    shortName: "MRA",
    fullName: "Mineralocorticoid receptor antagonists",
    examples: "Spironolactone (also AR antagonist) · eplerenone (more selective) · finerenone (non-steroidal)",
    segment: "Collecting duct — principal cells",
    mechanism: "Block aldosterone receptor → ↓ENaC + ↓ROMK + ↓Na⁺-K⁺ ATPase synthesis. Mild diuresis, but K⁺-SPARING.",
    electrolytes: "Mild Na⁺ loss · ↑K⁺ (sparing) · ↓H⁺ secretion → metabolic acidosis · neutral Ca²⁺",
    uses: "Primary aldosteronism (Conn's), refractory CHF (RALES trial — survival benefit), cirrhosis with ascites (FIRST-LINE — high aldo from RAAS), resistant hypertension. Spironolactone for acne / hirsutism / PCOS (anti-androgen).",
    toxicity: "Hyperkalemia (especially with ACEi / ARB). Spironolactone: gynecomastia (AR cross-reactivity), menstrual irregularities. Eplerenone avoids these.",
    colorVar: "var(--ph-curve-4)",
    cx: 580,
    cy: 290
  },
  {
    id: "amiloride",
    shortName: "ENaC blockers",
    fullName: "ENaC channel blockers (K-sparing)",
    examples: "Amiloride · triamterene",
    segment: "Collecting duct — principal cells",
    mechanism: "Directly block apical ENaC channel (no receptor mediator) → ↓Na⁺ reabsorption + ↓K⁺ secretion (lose driving force).",
    electrolytes: "Mild Na⁺ loss · ↑K⁺ (sparing) · ↓H⁺ → mild metabolic acidosis",
    uses: "Liddle syndrome (the disease IS ENaC gain-of-function). Lithium-induced nephrogenic DI (lithium enters via ENaC). Adjunct with loops / thiazides to spare K.",
    toxicity: "Hyperkalemia (especially with ACEi / ARB / spiro — never combine). Triamterene: kidney stones, megaloblastic anemia (weak folate antagonist).",
    colorVar: "var(--ph-curve-7)",
    cx: 640,
    cy: 380
  },
  {
    id: "vaptan",
    shortName: "Vaptans",
    fullName: "Vasopressin (V2) receptor antagonists",
    examples: "Tolvaptan (oral) · conivaptan (IV, also V1a) · demeclocycline (off-label, tetracycline)",
    segment: "Collecting duct — principal cells (V2 receptor)",
    mechanism: "Block V2 receptor → no Gs → no cAMP → no AQP2 insertion → AQUARESIS (water without solutes).",
    electrolytes: "Free water loss · ↑serum Na⁺ · K⁺ neutral. Does NOT cause volume depletion in the same way as Na⁺-losing diuretics.",
    uses: "Euvolemic and hypervolemic hyponatremia (SIADH, CHF). ADPKD (tolvaptan slows cyst growth). NOT for hypovolemic hyponatremia.",
    toxicity: "Hypernatremia (correct slowly — risk of osmotic demyelination, central pontine myelinolysis). Tolvaptan hepatotoxicity. Cost.",
    colorVar: "var(--ph-curve-5)",
    cx: 700,
    cy: 380
  }
];

export default function DiureticSitesWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (DRUGS.find((d) => d.id === searchParams.get("drug"))?.id ?? "loop") as DrugId;
  const [selectedId, setSelectedId] = useState<DrugId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("drug", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("drug") as DrugId | null;
    if (next && DRUGS.find((d) => d.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = DRUGS.find((d) => d.id === selectedId)!;
  const W = 780;
  const H = 460;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Diuretic site map">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{selected.fullName} — {selected.segment}</p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p><span className="font-bold text-ph-text">Examples:</span> <span className="text-ph-muted">{selected.examples}</span></p>
              <p><span className="font-bold text-ph-text">Mechanism:</span> <span className="text-ph-muted">{selected.mechanism}</span></p>
              <p><span className="font-bold text-ph-text">Electrolytes:</span> <span className="text-ph-muted">{selected.electrolytes}</span></p>
              <p><span className="font-bold text-ph-text">Uses:</span> <span className="text-ph-muted">{selected.uses}</span></p>
              <p><span className="font-bold text-ph-text">Toxicity:</span> <span className="text-ph-muted">{selected.toxicity}</span></p>
            </div>
          </div>

          <svg role="img" aria-label="Diuretic site map" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Cortex / medulla divider */}
            <line x1={40} y1={200} x2={W - 20} y2={200} stroke="var(--ph-axis)" strokeWidth={1} strokeDasharray="6 6" opacity="0.4" />
            <text x={50} y={50} fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">CORTEX</text>
            <text x={50} y={220} fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">MEDULLA</text>

            {/* Tubule schematic */}
            <path
              d="M 100 110 L 260 110 Q 310 110 340 150 L 380 290 L 470 290 Q 510 270 540 220 L 540 110 L 660 110 L 660 380 L 740 380"
              fill="none"
              stroke="var(--ph-axis)"
              strokeWidth={4}
              opacity="0.4"
            />

            {/* Segment labels */}
            <text x={180} y={86} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-muted)">PCT</text>
            <text x={380} y={310} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-muted)">TAL</text>
            <text x={530} y={86} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-muted)">DCT</text>
            <text x={660} y={86} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-muted)">CD</text>

            {/* Drug site markers */}
            {DRUGS.map((d) => {
              const isSelected = d.id === selectedId;
              return (
                <g key={d.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(d.id)} role="button" aria-label={`Select ${d.fullName}`}>
                  <circle
                    cx={d.cx}
                    cy={d.cy}
                    r={isSelected ? 28 : 22}
                    fill={isSelected ? d.colorVar : `color-mix(in srgb, ${d.colorVar}, transparent 65%)`}
                    stroke={d.colorVar}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text x={d.cx} y={d.cy + 4} textAnchor="middle" fontSize={isSelected ? "11" : "10"} fontWeight="800" fill={isSelected ? "white" : "var(--ph-text)"}>
                    {d.shortName}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Click a drug class to land it on its nephron segment, because location predicts effect. Proximal (acetazolamide) wastes bicarbonate; the loop (furosemide) blocks Na-K-2Cl for the biggest natriuresis; the distal tubule (thiazide) trades sodium for calcium retention; the collecting duct (ENaC blockers, spironolactone) is potassium-SPARING. Segment predicts the potassium effect.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Drug selector">
            <h2 className="ph-section-label mb-4">Click a class</h2>
            <div className="grid gap-2">
              {DRUGS.map((d) => {
                const isSelected = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}
                  >
                    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.colorVar }} />
                    <span className="font-bold">{d.shortName}</span>
                    <span className="text-xs">{d.fullName}</span>
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
