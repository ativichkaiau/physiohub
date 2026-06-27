"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "gi/intestinal-absorption";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5;

type Step = {
  id: StepId;
  shortName: string;
  title: string;
  body: string;
  nutrients: string;
  transporters: string;
  clinical: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    shortName: "Stomach",
    title: "1. Stomach — minimal absorption",
    body: "The stomach is for digestion (HCl pepsinogen → pepsin) and storage, not absorption. Almost no nutrient crosses the gastric mucosa. The major exception is INTRINSIC FACTOR — parietal cells secrete IF, which binds B12 in the small intestine for terminal-ileum uptake.",
    nutrients: "Water (small amounts) · ethanol · NSAIDs · aspirin (acid trapping in mucosa explains ulcer pathogenesis)",
    transporters: "Apical H⁺/K⁺ ATPase (parietal cells, target of PPIs). Pepsinogen secretion from chief cells.",
    clinical: "Pernicious anemia: autoimmune destruction of parietal cells → no IF → B12 malabsorption (despite intact ileum). Atrophic gastritis (autoimmune or H. pylori) → ↓HCl + ↓IF → both iron and B12 deficient. PPIs chronically can cause B12 and Mg deficiency."
  },
  {
    id: 2,
    shortName: "Duodenum",
    title: "2. Duodenum — iron, calcium, folate",
    body: "The duodenum receives chyme + pancreatic juice (HCO₃⁻ neutralisation, enzymes) + bile (emulsification). It's the primary site for IRON (DMT1 apical, ferroportin basolateral, ferritin storage) and CALCIUM (active TRPV6, vitamin-D regulated). Folate also enters here via PCFT.",
    nutrients: "Iron (Fe²⁺ via DMT1; heme via HCP1) · Ca²⁺ (TRPV6, calbindin, PMCA) · folate (PCFT) · most monosaccharides + amino acids start here",
    transporters: "Apical: DMT1 (Fe), HCP1 (heme), TRPV6 (Ca, vit-D-driven), PCFT (folate), SGLT1, PepT1. Basolateral: ferroportin + hephaestin (Fe export to plasma), Ca²⁺ ATPase + NCX1.",
    clinical: "Celiac disease: anti-transglutaminase → duodenal villous atrophy → iron, folate, fat-soluble vitamin malabsorption + diarrhoea. Hereditary hemochromatosis: HFE mutation → unregulated DMT1 / ferroportin → iron overload. Vitamin D deficiency → impaired Ca absorption + rickets / osteomalacia."
  },
  {
    id: 3,
    shortName: "Jejunum",
    title: "3. Jejunum — main absorptive surface",
    body: "The jejunum is the workhorse: longest segment with the densest villi and microvilli. Absorbs the bulk of carbohydrates, proteins, fats, and water-soluble vitamins. Iso-osmotic transport — water follows solutes.",
    nutrients: "Carbs (glucose, galactose via SGLT1; fructose via GLUT5; basolateral exit via GLUT2) · proteins (di / tri-peptides via PepT1, amino acids via various Na⁺-coupled transporters) · water-soluble vitamins · fats (after micelle formation) · most water",
    transporters: "Apical: SGLT1 (glucose, galactose; one of the few Na-coupled sugar transporters; basis of ORS), GLUT5 (fructose), PepT1 (H⁺-coupled di / tri-peptides), AA cotransporters, SMVT (biotin, pantothenate). Basolateral: GLUT2 (sugars exit), Na⁺-K⁺ ATPase (drives everything).",
    clinical: "Oral rehydration solution (ORS) exploits SGLT1: glucose + Na⁺ + water at the right osmolality drives bulk water reabsorption — saves lives in cholera. Whipple disease: Tropheryma whipplei invades macrophages → blocks lymphatic drainage from jejunum → fat malabsorption + arthralgia + CNS. Disaccharidase deficiency (lactase) → bloating, osmotic diarrhoea after dairy."
  },
  {
    id: 4,
    shortName: "Ileum",
    title: "4. Ileum — bile salts, vitamin B12",
    body: "The terminal ileum has two unique absorptive jobs: BILE SALTS (apical ASBT, basolateral OSTα/β → portal blood → liver → re-secreted; cycles ~6×/day) and VITAMIN B12 (cubam receptor on enterocyte recognises the IF-B12 complex from the stomach).",
    nutrients: "Bile salts (95% reclaimed) · vitamin B12 · some Na⁺, K⁺, Cl⁻ continuing from jejunum",
    transporters: "Apical: ASBT (bile salts; Na-coupled), cubam complex (cubilin-amnionless for IF-B12). Basolateral: OSTα/β (bile salts → portal), MRP for B12-transcobalamin.",
    clinical: "Terminal ileal disease (Crohn's, resection, radiation): BOTH bile-salt diarrhoea (osmotic effect of unreabsorbed bile salts colonically; treat with cholestyramine) AND fat malabsorption (depleted bile pool, since liver can't keep up) AND B12 deficiency. Tropical sprue + bacterial overgrowth also impair B12 and folate."
  },
  {
    id: 5,
    shortName: "Colon",
    title: "5. Colon — water, electrolytes, SCFA",
    body: "The colon's main job is RECLAIMING WATER and Na⁺ from the 1-2 L of fluid that enters daily (out of the ~9 L total intestinal secretion). ENaC channels in the surface epithelium are aldosterone-sensitive. Bacterial fermentation of dietary fibre produces SHORT-CHAIN FATTY ACIDS (acetate, propionate, butyrate) — butyrate is the colonocyte's primary fuel.",
    nutrients: "Water · Na⁺ (ENaC, aldosterone-sensitive) · short-chain fatty acids (butyrate, propionate, acetate) · K⁺ secreted (not absorbed) · NO further glucose / AA absorption",
    transporters: "Apical: ENaC (electrogenic Na uptake; aldosterone induces) + Cl⁻/HCO₃⁻ exchanger + Na⁺/H⁺ exchanger. SCFA absorbed by MCT1 (monocarboxylate transporter). Basolateral Na⁺-K⁺ ATPase.",
    clinical: "Cholera: massive Cl⁻ secretion via overactivated CFTR → water follows → ORS works because SGLT1 still functions. Hirschsprung disease: aganglionic distal colon → impaired motility → enterocolitis risk. Ulcerative colitis: butyrate deficiency hypothesis — diversion colitis improves with SCFA enemas. Pseudomembranous colitis (C. diff toxin) → secretory diarrhoea + fever."
  }
];

export default function IntestinalAbsorptionWidget() {
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
  const H = 380;
  const segments = [
    { id: 1 as StepId, label: "Stomach", x: 100, w: 110, color: "var(--ph-curve-4)" },
    { id: 2 as StepId, label: "Duodenum", x: 230, w: 110, color: "var(--ph-curve-2)" },
    { id: 3 as StepId, label: "Jejunum", x: 360, w: 150, color: "var(--ph-curve-1)" },
    { id: 4 as StepId, label: "Ileum", x: 530, w: 110, color: "var(--ph-curve-6)" },
    { id: 5 as StepId, label: "Colon", x: 660, w: 110, color: "var(--ph-curve-3)" }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Intestinal absorption schematic">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <div className="mt-2 grid gap-1 text-sm">
              <p><span className="font-bold text-ph-text">Nutrients:</span> <span className="text-ph-muted">{step.nutrients}</span></p>
              <p><span className="font-bold text-ph-text">Transporters:</span> <span className="text-ph-muted">{step.transporters}</span></p>
              <p><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span></p>
            </div>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <text x={40} y={50} fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">GI TRACT (proximal → distal)</text>

            {/* Segment blocks */}
            {segments.map((seg) => {
              const isSelected = seg.id === stepId;
              return (
                <g key={seg.id} style={{ cursor: "pointer" }} onClick={() => setStepId(seg.id)} role="button" aria-label={`Select ${seg.label}`}>
                  <rect
                    x={seg.x}
                    y={120}
                    width={seg.w}
                    height={100}
                    rx={12}
                    fill={isSelected ? seg.color : `color-mix(in srgb, ${seg.color}, transparent 75%)`}
                    stroke={seg.color}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text x={seg.x + seg.w / 2} y={155} textAnchor="middle" fontSize="13" fontWeight="800" fill={isSelected ? "white" : "var(--ph-text)"}>
                    {seg.label}
                  </text>
                  <text x={seg.x + seg.w / 2} y={180} textAnchor="middle" fontSize="11" fontWeight="700" fill={isSelected ? "white" : "var(--ph-muted)"}>
                    {seg.id === 1 ? "HCl · IF" : seg.id === 2 ? "Fe · Ca · folate" : seg.id === 3 ? "carbs · protein · fat" : seg.id === 4 ? "bile salts · B12" : "water · SCFA"}
                  </text>
                  {isSelected ? <text x={seg.x + seg.w / 2} y={205} textAnchor="middle" fontSize="9" fontWeight="800" fill="white">SELECTED</text> : null}
                </g>
              );
            })}

            {/* Flow arrow */}
            <line x1={80} y1={290} x2={760} y2={290} stroke="var(--ph-axis)" strokeWidth={2} markerEnd="url(#flow-arrow)" />
            <defs>
              <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0L10 5L0 10z" fill="var(--ph-axis)" />
              </marker>
            </defs>
            <text x={420} y={310} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
              CHYME FLOW
            </text>

            {/* Total absorption stats */}
            <text x={40} y={350} fontSize="10" fontWeight="700" fill="var(--ph-muted)">
              Daily fluid balance: ~9 L enters small bowel · ~7 L reabsorbed proximally · ~1.5 L enters colon · ~150 mL excreted in stool
            </text>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Click each transporter to follow nutrients from lumen to blood. The engine is the basolateral sodium pump: it keeps intracellular sodium low, so the inward sodium gradient powers secondary-active uptake of glucose (SGLT1), amino acids, and more at the apical side. No sodium gradient means no coupled absorption.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the gut</h2>
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
                        : "ph-clay-button text-ph-muted"
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
                className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => stepId < 5 && setStepId((stepId + 1) as StepId)}
                disabled={stepId === 5}
                className="focus-ring ph-clay-button px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ph-muted disabled:opacity-40 hover:border-[var(--ph-border-strong)] hover:text-ph-text"
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
