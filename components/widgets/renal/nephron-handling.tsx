"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "renal/nephron-handling";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5 | 6;

type Step = {
  id: StepId;
  shortName: string;
  title: string;
  body: string;
  transporters: string;
  reabsorbed: string;
  clinical: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    shortName: "Glomerulus",
    title: "1. Glomerular filtration",
    body: "Plasma is filtered at 125 mL/min (180 L/day) through three layers — fenestrated endothelium, GBM (heparan-sulphate, negatively charged), and podocyte slit diaphragm (nephrin / podocin). Small solutes pass freely; albumin (66 kDa, anionic) is largely retained.",
    transporters: "Size + charge barrier. No active transport — bulk Starling flow.",
    reabsorbed: "Initial composition matches plasma minus protein. Na⁺ 140, K⁺ 4, HCO₃⁻ 24, glucose 100, Cl⁻ 105 — all measured in mEq/L (mM).",
    clinical: "Minimal change disease: loss of foot processes → massive proteinuria. Anti-PLA2R antibodies cause membranous nephropathy. Diabetic nephropathy thickens GBM + mesangial expansion → microalbuminuria → frank proteinuria."
  },
  {
    id: 2,
    shortName: "PCT",
    title: "2. Proximal convoluted tubule",
    body: "The workhorse. ~65% of filtered Na⁺, water, and Cl⁻; 90% of HCO₃⁻; ALL glucose and amino acids; all phosphate (PTH-regulated). Iso-osmotic reabsorption — water follows Na⁺ proximally so tubular fluid stays at ~300 mOsm.",
    transporters: "Apical: Na⁺/H⁺ exchanger (NHE3), Na⁺/glucose (SGLT2 — 90%, SGLT1 — 10%), Na⁺/AA cotransporters, Na⁺/PO₄. Basolateral: Na⁺-K⁺ ATPase (drives the whole system) + GLUT2. Carbonic anhydrase II + IV reclaim HCO₃⁻.",
    reabsorbed: "Na⁺ 65% · H₂O 65% · HCO₃⁻ 90% · glucose 100% · amino acids 100% · phosphate 80% (PTH-modulated)",
    clinical: "SGLT2 inhibitors (empagliflozin) block PCT glucose reabsorption → glycosuria + osmotic diuresis + cardiorenal benefit. Fanconi syndrome: generalised PCT dysfunction (cystinosis, multiple myeloma, tenofovir) → glucosuria, aminoaciduria, phosphaturia, type 2 RTA. Acetazolamide inhibits carbonic anhydrase → HCO₃⁻ wasting → metabolic acidosis."
  },
  {
    id: 3,
    shortName: "Thin loop",
    title: "3. Thin descending limb of Henle",
    body: "Water-permeable, salt-IMPERMEABLE. As fluid descends into the hypertonic medulla, water leaves passively → tubular fluid CONCENTRATES toward ~1200 mOsm at the loop tip.",
    transporters: "Apical AQP1 (water channel); no active solute transport.",
    reabsorbed: "Water (~15% of filtered) by osmosis into the medullary interstitium. Concentrates the lumen.",
    clinical: "The countercurrent multiplier needs both limbs working. Damage to the tip (analgesic nephropathy, renal papillary necrosis from NSAIDs + sickle cell) destroys the concentrating machinery → polyuria, low USG."
  },
  {
    id: 4,
    shortName: "TAL",
    title: "4. Thick ascending limb",
    body: "Salt-permeable, water-IMPERMEABLE — the 'diluting segment'. Reabsorbs ~25% of filtered Na⁺ via NKCC2 (Na⁺-K⁺-2Cl⁻ symporter). The lumen-positive charge from K⁺ recycling drives PARACELLULAR Ca²⁺ and Mg²⁺ reabsorption.",
    transporters: "Apical NKCC2 (target of loop diuretics) + ROMK (K⁺ recycling). Basolateral Na⁺-K⁺ ATPase + ClC-Kb. Paracellular Ca²⁺ and Mg²⁺ via paracellin-1 (claudin-16).",
    reabsorbed: "Na⁺ 25% · K⁺ · Cl⁻ · Ca²⁺ · Mg²⁺. Generates the medullary osmotic gradient that the descending limb exploits.",
    clinical: "Furosemide / bumetanide block NKCC2 → biggest diuresis, Ca²⁺ and Mg²⁺ wasting. Bartter syndrome: loss-of-function in NKCC2, ROMK, or ClC-Kb → metabolic alkalosis + hypokalemia + hypercalciuria (mimics chronic furosemide). Loop diuretics + ototoxicity (aminoglycosides synergise) because NKCC isoforms also exist in the stria vascularis."
  },
  {
    id: 5,
    shortName: "DCT",
    title: "5. Distal convoluted tubule",
    body: "Reabsorbs ~5–7% of filtered Na⁺ via NCC (Na⁺-Cl⁻ cotransporter). Apical TRPV5 channels reabsorb Ca²⁺ — PTH-regulated, calcium-sparing (unlike the TAL).",
    transporters: "Apical NCC (target of thiazides) + TRPV5 (Ca²⁺). Basolateral NCX1 (Na⁺/Ca²⁺ exchanger) and PMCA1b (Ca²⁺ ATPase).",
    reabsorbed: "Na⁺ 5–7% · Cl⁻ · Ca²⁺ (PTH-sensitive, opposite to loop)",
    clinical: "Thiazides block NCC → modest diuresis but INCREASED Ca²⁺ reabsorption (paradox — Na⁺ depletion → ↑PCT Na/Ca reabsorption → hypocalciuria). Used for calcium stone prevention. Gitelman syndrome: loss-of-function NCC → mimics thiazide use (hypokalemia, alkalosis, hypocalciuria, hypomagnesemia)."
  },
  {
    id: 6,
    shortName: "Collecting duct",
    title: "6. Collecting duct — principal + intercalated cells",
    body: "Final tuning. PRINCIPAL CELLS: reabsorb Na⁺ via ENaC (aldosterone-regulated) + secrete K⁺ via ROMK + reabsorb water via AQP2 (ADH-regulated). α-INTERCALATED cells secrete H⁺ via H⁺-ATPase + H⁺/K⁺ ATPase → urine acidification + bicarbonate regeneration. β-INTERCALATED cells do the opposite (alkalosis correction).",
    transporters: "Principal: ENaC (apical) + Na/K ATPase (BL) + ROMK + AQP2 (ADH-induced). α-IC: H⁺ ATPase + Cl/HCO3 (pendrin). β-IC: pendrin apical.",
    reabsorbed: "Na⁺ 2–5% (aldosterone) · water (ADH) · H⁺ secretion · K⁺ secretion (aldosterone)",
    clinical: "Aldosterone antagonists (spironolactone) block mineralocorticoid receptor → K-sparing diuresis. Amiloride / triamterene block ENaC directly. Liddle syndrome: gain-of-function ENaC → looks like 1° hyperaldosteronism but renin AND aldo are low. SIADH: too much ADH → free-water retention → hyponatremia. Central / nephrogenic DI: too little ADH or unresponsive AQP2 → dilute polyuria."
  }
];

export default function NephronHandlingWidget() {
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
  const W = 780;
  const H = 480;

  const segments = [
    { id: 1 as StepId, label: "Glomerulus", x: 70, y: 80, color: "var(--ph-curve-3)" },
    { id: 2 as StepId, label: "PCT", x: 220, y: 80, color: "var(--ph-curve-1)" },
    { id: 3 as StepId, label: "TDL", x: 380, y: 220, color: "var(--ph-curve-5)" },
    { id: 4 as StepId, label: "TAL", x: 510, y: 220, color: "var(--ph-curve-2)" },
    { id: 5 as StepId, label: "DCT", x: 640, y: 80, color: "var(--ph-curve-6)" },
    { id: 6 as StepId, label: "CD", x: 640, y: 380, color: "var(--ph-curve-7)" }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Nephron schematic">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <div className="mt-2 grid gap-1 text-sm">
              <p><span className="font-bold text-ph-text">Transporters:</span> <span className="text-ph-muted">{step.transporters}</span></p>
              <p><span className="font-bold text-ph-text">Reabsorbed:</span> <span className="text-ph-muted">{step.reabsorbed}</span></p>
              <p><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span></p>
            </div>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <defs>
              <marker id="neph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0L10 5L0 10z" fill="var(--ph-curve-1)" />
              </marker>
            </defs>

            {/* Cortex / medulla labels */}
            <line x1={40} y1={170} x2={W - 20} y2={170} stroke="var(--ph-axis)" strokeWidth={1} strokeDasharray="6 6" opacity="0.5" />
            <text x={W - 24} y={158} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">CORTEX</text>
            <text x={W - 24} y={184} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">MEDULLA</text>

            {/* Tubule path */}
            <path
              d="M 100 80 L 280 80 Q 320 80 350 110 L 400 220 L 380 320 L 430 320 L 510 220 Q 540 180 580 130 L 640 130 L 640 380 L 720 380"
              fill="none"
              stroke="var(--ph-axis)"
              strokeWidth={3}
              opacity="0.5"
            />

            {/* Glomerulus */}
            <g>
              <circle
                cx={segments[0].x}
                cy={segments[0].y}
                r={stepId === 1 ? 34 : 26}
                fill={stepId === 1 ? segments[0].color : `color-mix(in srgb, ${segments[0].color}, transparent 70%)`}
                stroke={segments[0].color}
                strokeWidth={stepId === 1 ? 3 : 1.5}
              />
              <text x={segments[0].x} y={segments[0].y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">G</text>
              <text x={segments[0].x} y={segments[0].y + 50} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-text)">Glomerulus</text>
            </g>

            {/* PCT */}
            <g>
              <rect
                x={segments[1].x - 50}
                y={segments[1].y - 25}
                width={120}
                height={50}
                rx={10}
                fill={stepId === 2 ? segments[1].color : `color-mix(in srgb, ${segments[1].color}, transparent 75%)`}
                stroke={segments[1].color}
                strokeWidth={stepId === 2 ? 3 : 1.5}
              />
              <text x={segments[1].x + 10} y={segments[1].y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">PCT · 65%</text>
            </g>

            {/* TDL */}
            <g>
              <rect
                x={segments[2].x - 28}
                y={segments[2].y - 50}
                width={50}
                height={100}
                rx={8}
                fill={stepId === 3 ? segments[2].color : `color-mix(in srgb, ${segments[2].color}, transparent 78%)`}
                stroke={segments[2].color}
                strokeWidth={stepId === 3 ? 3 : 1.5}
              />
              <text x={segments[2].x - 3} y={segments[2].y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">TDL</text>
              <text x={segments[2].x - 3} y={segments[2].y + 70} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-muted)">H₂O ↓</text>
            </g>

            {/* TAL */}
            <g>
              <rect
                x={segments[3].x - 22}
                y={segments[3].y - 50}
                width={50}
                height={100}
                rx={8}
                fill={stepId === 4 ? segments[3].color : `color-mix(in srgb, ${segments[3].color}, transparent 78%)`}
                stroke={segments[3].color}
                strokeWidth={stepId === 4 ? 3 : 1.5}
              />
              <text x={segments[3].x + 3} y={segments[3].y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">TAL</text>
              <text x={segments[3].x + 3} y={segments[3].y + 70} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-muted)">NaCl ↑</text>
            </g>

            {/* DCT */}
            <g>
              <rect
                x={segments[4].x - 40}
                y={segments[4].y - 25}
                width={90}
                height={50}
                rx={10}
                fill={stepId === 5 ? segments[4].color : `color-mix(in srgb, ${segments[4].color}, transparent 78%)`}
                stroke={segments[4].color}
                strokeWidth={stepId === 5 ? 3 : 1.5}
              />
              <text x={segments[4].x + 5} y={segments[4].y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">DCT</text>
            </g>

            {/* CD */}
            <g>
              <rect
                x={segments[5].x - 30}
                y={segments[5].y - 40}
                width={80}
                height={80}
                rx={10}
                fill={stepId === 6 ? segments[5].color : `color-mix(in srgb, ${segments[5].color}, transparent 78%)`}
                stroke={segments[5].color}
                strokeWidth={stepId === 6 ? 3 : 1.5}
              />
              <text x={segments[5].x + 10} y={segments[5].y - 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">CD</text>
              <text x={segments[5].x + 10} y={segments[5].y + 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="white">ENaC · AQP2</text>
            </g>

            {/* Output to bladder */}
            <text x={W - 60} y={380} fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1">→ Urine</text>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the nephron</h2>
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
