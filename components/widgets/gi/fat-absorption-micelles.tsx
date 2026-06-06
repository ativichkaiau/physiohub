"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "gi/fat-absorption-micelles";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Step = {
  id: StepId;
  shortName: string;
  title: string;
  body: string;
  key: string;
  clinical: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    shortName: "Gastric prep",
    title: "1. Gastric and lingual lipase — pre-emulsification",
    body: "Mechanical mixing in the stomach and the modest activity of lingual + gastric lipase (acid-stable) cleave ~10% of dietary triglycerides into 1,2-diglycerides + free fatty acids. The stomach also slows lipid delivery to the duodenum (gastric emptying of fat is the slowest) so it doesn't overwhelm downstream processing.",
    key: "Gastric lipase acts on short- and medium-chain TG. Long-chain TG (most of dietary fat) needs pancreatic lipase + bile salts in the duodenum.",
    clinical: "Cystic fibrosis pancreatic insufficiency: thick secretions block pancreatic ducts → no lipase delivery → severe fat malabsorption from infancy. Treat with pancreatic enzyme replacement + PPI (acid degrades the enzymes)."
  },
  {
    id: 2,
    shortName: "Bile emulsifies",
    title: "2. CCK release → bile salts emulsify",
    body: "Fat (and protein) in the duodenum triggers I-cells to release CCK. CCK contracts the gallbladder and relaxes the sphincter of Oddi → bile flows into the duodenum. BILE SALTS (amphipathic — hydrophilic head, hydrophobic tail) coat large lipid droplets, breaking them into smaller emulsion droplets and massively increasing surface area for lipase.",
    key: "Emulsification is mechanical / surfactant action — no chemistry yet. Goes from one big lipid droplet (~1 mm) to thousands of small droplets (~1 μm).",
    clinical: "Cholestasis (intra- or extra-hepatic obstruction, PBC, PSC): bile doesn't reach the duodenum → can't emulsify fat → steatorrhea + fat-soluble vitamin deficiency. Pale, foul-smelling stools that float."
  },
  {
    id: 3,
    shortName: "Lipase cleaves",
    title: "3. Pancreatic lipase + colipase cleave triglycerides",
    body: "Pancreatic lipase needs COLIPASE (also pancreatic) to anchor it to the emulsion-droplet surface against the displacing effect of bile salts. The enzyme cleaves the sn-1 and sn-3 ester bonds of triglycerides → 2-monoacylglycerol + 2 free fatty acids.",
    key: "Products: 2-MAG + 2 FFA per triglyceride. NOT broken to glycerol — 2-MAG is the absorbed form. Cholesterol esters → cholesterol + FFA by cholesterol esterase. Phospholipids → lyso-PL + FFA by phospholipase A2.",
    clinical: "Orlistat (Xenical, Alli): irreversible pancreatic + gastric lipase inhibitor → undigested TG → fat stays in stool. Side effects: oily steatorrhea, flatulence, fat-soluble vitamin malabsorption. Pancreatic insufficiency (chronic pancreatitis, CF): mimics this iatrogenically."
  },
  {
    id: 4,
    shortName: "Micelles form",
    title: "4. Mixed micelles — bile salts + FFA + 2-MAG + cholesterol",
    body: "The cleavage products (2-MAG, FFA, cholesterol, fat-soluble vitamins) are still hydrophobic — they can't cross the unstirred water layer next to the brush border on their own. BILE SALTS gather them into MIXED MICELLES — tiny (~5 nm) particles with bile-salt heads outward and the lipids hidden in the core. Micelles diffuse across the unstirred layer 100× faster than free droplets.",
    key: "Micelles are the shuttle that delivers products across the unstirred layer. Without bile salts → no micelles → fats stay in the lumen.",
    clinical: "Terminal ileal disease (Crohn's, resection): bile salts not reabsorbed → bile pool shrinks → fewer micelles → fat malabsorption. This is WHY ileal resection causes both diarrhea AND steatorrhea. Bacterial overgrowth (SIBO): bacteria deconjugate bile salts early → premature reabsorption → reduced micelle availability in the distal small bowel."
  },
  {
    id: 5,
    shortName: "Brush border",
    title: "5. Brush border absorption — micelles disgorge their cargo",
    body: "At the apical membrane of jejunal enterocytes, micelles release their contents in the local acidic microclimate (luminal H⁺ from NHE3 protonates FFA → become more lipophilic). The lipid products diffuse passively across the lipid bilayer (or via specific transporters: FATP4 for long-chain FA, NPC1L1 for cholesterol). Bile salts STAY in the lumen and continue downstream toward the terminal ileum.",
    key: "Lipid products enter the cell; bile salts continue to the ileum for reabsorption (enterohepatic recycling).",
    clinical: "Ezetimibe selectively blocks NPC1L1 → ↓dietary cholesterol absorption → modest LDL reduction, often combined with a statin. Abetalipoproteinemia: defective apoB-48 synthesis in enterocytes → fat accumulates intracellularly, cannot be exported → fat malabsorption + acanthocytes + spinocerebellar degeneration."
  },
  {
    id: 6,
    shortName: "Re-esterify + package",
    title: "6. Re-esterify in SER → chylomicron assembly",
    body: "Inside the enterocyte, FFA + 2-MAG are RE-ESTERIFIED to triglyceride in the smooth ER (monoacylglycerol pathway). The reassembled TG, along with cholesterol esters and phospholipids, is wrapped around APO B-48 (intestinal isoform of apoB) by MTP (microsomal triglyceride transfer protein) to form a CHYLOMICRON. The chylomicron buds off the rER into vesicles → Golgi → exocytosis at the basolateral membrane.",
    key: "ApoB-48 + MTP + lipids = chylomicron. Without apoB-48 (abetalipoproteinemia), this step fails and lipids accumulate intracellularly.",
    clinical: "Abetalipoproteinemia (MTP loss-of-function): no chylomicron assembly → severe fat malabsorption + fat-soluble vitamin deficiency (especially E and K) + acanthocytes + retinitis pigmentosa + spinocerebellar ataxia. Treated with high-dose vitamins E and A."
  },
  {
    id: 7,
    shortName: "Lacteal → blood",
    title: "7. Chylomicrons exit via lacteal → thoracic duct → systemic vein",
    body: "Chylomicrons are too large for the capillary fenestrae (~80 nm) so they exit the enterocyte basolateral membrane and enter the LACTEAL (central lymphatic of the villus). Lacteals drain via mesenteric lymphatics → cisterna chyli → thoracic duct → LEFT SUBCLAVIAN VEIN. This bypasses the portal circulation — chylomicrons reach the systemic circulation directly. ApoC-II (acquired in blood from HDL) activates lipoprotein lipase on endothelium → TG hydrolysed → FFA taken up by adipose / muscle.",
    key: "Chylomicrons bypass the portal vein. Short- and medium-chain FA, on the other hand, ARE absorbed into portal blood directly (don't need micelles or chylomicrons).",
    clinical: "Whipple disease and intestinal lymphangiectasia: lacteal / lymphatic obstruction → chylomicrons can't leave → fat malabsorption + protein-losing enteropathy + steatorrhea. MCT (medium-chain triglyceride) supplementation BYPASSES the lacteal route (goes via portal) — useful in lymphangiectasia and ileal disease."
  }
];

export default function FatAbsorptionMicellesWidget() {
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
    if (STEPS.some((s) => s.id === next) && next !== stepId) setStepId(next);
  }, [searchParams, stepId]);

  const step = STEPS.find((s) => s.id === stepId)!;
  const W = 780;
  const H = 440;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Fat absorption schematic">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Key:</span> <span className="text-ph-muted">{step.key}</span>
            </p>
            <p className="mt-1 text-sm">
              <span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span>
            </p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Lumen band (top) */}
            <rect x={40} y={30} width={700} height={140} rx={10} fill="color-mix(in srgb, var(--ph-curve-2), transparent 92%)" stroke="color-mix(in srgb, var(--ph-curve-2), transparent 55%)" strokeWidth={1.5} />
            <text x={56} y={50} fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">INTESTINAL LUMEN</text>

            {/* Lipid droplet → emulsion → micelles progression */}
            <g>
              {/* Big droplet (step 1-2) */}
              <circle cx={150} cy={110} r={stepId === 1 ? 38 : stepId === 2 ? 26 : 16} fill={stepId === 1 ? "var(--ph-curve-2)" : "color-mix(in srgb, var(--ph-curve-2), transparent 70%)"} stroke="var(--ph-curve-2)" strokeWidth={stepId === 1 ? 3 : 1.5} />
              <text x={150} y={114} textAnchor="middle" fontSize="10" fontWeight="800" fill={stepId === 1 ? "white" : "var(--ph-curve-2)"}>TG</text>
              <text x={150} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">droplet</text>

              {/* Emulsion (step 2-3) */}
              {stepId >= 2 ? Array.from({ length: 6 }).map((_, i) => (
                <circle key={i} cx={250 + (i % 3) * 18} cy={95 + Math.floor(i / 3) * 22} r={9} fill="color-mix(in srgb, var(--ph-curve-2), transparent 60%)" stroke="var(--ph-curve-2)" strokeWidth={1} />
              )) : null}
              <text x={290} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">emulsion (bile)</text>

              {/* Lipase action (step 3) */}
              {stepId === 3 ? <text x={380} y={80} fontSize="13" fontWeight="800" fill="var(--ph-curve-4)">✂ lipase</text> : null}

              {/* Micelles (step 4-5) */}
              {stepId >= 4 ? Array.from({ length: 12 }).map((_, i) => (
                <g key={`mic-${i}`}>
                  <circle cx={400 + (i % 6) * 24} cy={90 + Math.floor(i / 6) * 30} r={6} fill="var(--ph-curve-6)" />
                  <circle cx={400 + (i % 6) * 24} cy={90 + Math.floor(i / 6) * 30} r={9} fill="none" stroke="var(--ph-curve-6)" strokeWidth={0.6} strokeDasharray="2 2" />
                </g>
              )) : null}
              <text x={470} y={155} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">mixed micelles</text>
            </g>

            {/* Brush border */}
            <line x1={40} y1={180} x2={740} y2={180} stroke="var(--ph-axis)" strokeWidth={2} />
            <text x={744} y={172} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1">
              BRUSH BORDER
            </text>

            {/* Enterocyte */}
            <rect x={40} y={190} width={700} height={150} rx={10} fill="color-mix(in srgb, var(--ph-surface), black 4%)" stroke="var(--ph-axis)" strokeWidth={1.5} />
            <text x={56} y={208} fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">ENTEROCYTE</text>

            {/* SER + chylomicron assembly (step 6) */}
            {stepId >= 6 ? (
              <g>
                <rect x={200} y={230} width={140} height={70} rx={10} fill={stepId === 6 ? "color-mix(in srgb, var(--ph-curve-1), transparent 75%)" : "color-mix(in srgb, var(--ph-curve-1), transparent 88%)"} stroke="var(--ph-curve-1)" strokeWidth={stepId === 6 ? 2.5 : 1.2} />
                <text x={270} y={255} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-text)">SER · Golgi</text>
                <text x={270} y={278} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">apoB-48 + MTP</text>
                <text x={270} y={293} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">→ chylomicron</text>

                {/* Chylomicrons leaving */}
                {stepId >= 7 ? Array.from({ length: 4 }).map((_, i) => (
                  <g key={`cm-${i}`}>
                    <circle cx={400 + i * 30} cy={265} r={9} fill="var(--ph-curve-5)" />
                    <text x={400 + i * 30} y={268} textAnchor="middle" fontSize="8" fontWeight="800" fill="white">CM</text>
                  </g>
                )) : null}
              </g>
            ) : null}

            {/* Basolateral membrane */}
            <line x1={40} y1={340} x2={740} y2={340} stroke="var(--ph-axis)" strokeWidth={1.5} />

            {/* Lacteal vs portal vein (step 7) */}
            <g>
              <rect x={40} y={350} width={340} height={70} rx={10} fill={stepId === 7 ? "color-mix(in srgb, var(--ph-curve-5), transparent 78%)" : "color-mix(in srgb, var(--ph-curve-5), transparent 90%)"} stroke="var(--ph-curve-5)" strokeWidth={stepId === 7 ? 2.5 : 1} />
              <text x={210} y={375} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-text)">LACTEAL · thoracic duct</text>
              <text x={210} y={395} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">chylomicrons → L. subclavian vein</text>
              <text x={210} y={412} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-muted)">(long-chain FA only)</text>

              <rect x={400} y={350} width={340} height={70} rx={10} fill="color-mix(in srgb, var(--ph-curve-4), transparent 90%)" stroke="color-mix(in srgb, var(--ph-curve-4), transparent 65%)" strokeWidth={1} />
              <text x={570} y={375} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-text)">PORTAL VEIN → liver</text>
              <text x={570} y={395} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">short / medium-chain FA</text>
              <text x={570} y={412} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ph-muted)">(bypasses micelle / chylomicron)</text>
            </g>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk fat absorption</h2>
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
                onClick={() => stepId < 7 && setStepId((stepId + 1) as StepId)}
                disabled={stepId === 7}
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
