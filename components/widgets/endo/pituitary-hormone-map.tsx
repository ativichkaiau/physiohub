"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "endo/pituitary-hormone-map";
const diagram = getDiagramById(DIAGRAM_ID);

type HormoneId = "gh" | "prl" | "tsh" | "acth" | "fshlh" | "adh" | "oxy";

type Hormone = {
  id: HormoneId;
  shortName: string;
  fullName: string;
  lobe: "anterior" | "posterior";
  cellType: string;
  hypothalamicControl: string;
  target: string;
  effect: string;
  pathology: string;
  cx: number;
  cy: number;
  colorVar: string;
};

const HORMONES: Hormone[] = [
  {
    id: "gh",
    shortName: "GH",
    fullName: "Growth hormone (somatotropin)",
    lobe: "anterior",
    cellType: "Somatotrophs (~50% of anterior pit)",
    hypothalamicControl: "Stimulated by GHRH; inhibited by somatostatin (SST). Ghrelin (gastric) also stimulates.",
    target: "Liver (→ IGF-1) and direct effects on bone, muscle, adipose.",
    effect: "Long bone growth (via IGF-1 at epiphyseal plates); ↑lipolysis; ↑gluconeogenesis (anti-insulin); ↑protein synthesis.",
    pathology: "Excess in children = GIGANTISM; excess in adults (post-fusion) = ACROMEGALY (jaw/hand/foot enlargement, sleep apnea, cardiomyopathy). Deficiency in children = short stature, midline defects.",
    cx: 220,
    cy: 280,
    colorVar: "var(--ph-curve-1)"
  },
  {
    id: "prl",
    shortName: "PRL",
    fullName: "Prolactin",
    lobe: "anterior",
    cellType: "Lactotrophs",
    hypothalamicControl: "TONICALLY INHIBITED by dopamine (PIF) — the only anterior pit hormone with predominantly inhibitory control. TRH and breast suckling stimulate.",
    target: "Mammary gland.",
    effect: "Milk synthesis during lactation; inhibits GnRH → lactational amenorrhea (a natural contraceptive of nursing).",
    pathology: "Prolactinoma (most common functioning pituitary adenoma) → galactorrhea, amenorrhea (women), erectile dysfunction (men), bitemporal hemianopsia. Treated with DOPAMINE AGONISTS (cabergoline, bromocriptine).",
    cx: 280,
    cy: 280,
    colorVar: "var(--ph-curve-7)"
  },
  {
    id: "tsh",
    shortName: "TSH",
    fullName: "Thyroid-stimulating hormone (thyrotropin)",
    lobe: "anterior",
    cellType: "Thyrotrophs",
    hypothalamicControl: "Stimulated by TRH. Suppressed by free T4 / T3 (negative feedback).",
    target: "Thyroid follicular cells.",
    effect: "Stimulates NIS, TPO, Tg synthesis, endocytosis of colloid → ↑T4 / T3 output. Trophic effects on follicle size.",
    pathology: "Primary hypothyroidism: ↑TSH, ↓fT4 (Hashimoto's). Primary hyperthyroidism: ↓TSH, ↑fT4 (Graves'). Secondary / central hypothyroid: ↓TSH and ↓fT4 (pituitary disease). TSH is the single most sensitive screening test.",
    cx: 340,
    cy: 280,
    colorVar: "var(--ph-curve-6)"
  },
  {
    id: "acth",
    shortName: "ACTH",
    fullName: "Adrenocorticotropic hormone",
    lobe: "anterior",
    cellType: "Corticotrophs",
    hypothalamicControl: "Stimulated by CRH (and AVP). Cortisol negative feedback to both pituitary and hypothalamus. Diurnal rhythm — peak ~6 AM.",
    target: "Adrenal cortex (zona fasciculata + reticularis).",
    effect: "Cortisol + androgen synthesis. Cleaved from POMC, which also yields α-MSH (skin pigmentation) and β-endorphin.",
    pathology: "Cushing's DISEASE = pituitary ACTH adenoma → hypercortisolism + skin hyperpigmentation. Addison's (primary adrenal failure) = ↓cortisol → ↑ACTH → hyperpigmentation. Secondary adrenal insufficiency (pituitary disease) = ↓ACTH, no hyperpigmentation.",
    cx: 400,
    cy: 280,
    colorVar: "var(--ph-curve-2)"
  },
  {
    id: "fshlh",
    shortName: "FSH/LH",
    fullName: "Follicle-stimulating + luteinizing hormone",
    lobe: "anterior",
    cellType: "Gonadotrophs",
    hypothalamicControl: "PULSATILE GnRH (frequency-coded — fast pulses favor LH, slow pulses favor FSH). Continuous GnRH paradoxically suppresses (basis of leuprolide therapy).",
    target: "Gonads (ovary, testis).",
    effect: "Women: FSH → follicle growth + granulosa-cell estrogen synthesis; LH surge → ovulation + corpus luteum progesterone. Men: FSH → Sertoli cells → spermatogenesis; LH → Leydig cells → testosterone.",
    pathology: "Primary gonadal failure: ↑↑FSH, ↑LH, ↓gonadal steroids (Klinefelter, Turner, premature ovarian failure). Hypogonadotropic hypogonadism: ↓FSH/LH (Kallmann syndrome — GnRH neuron failure + anosmia).",
    cx: 460,
    cy: 280,
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "adh",
    shortName: "ADH",
    fullName: "Antidiuretic hormone (vasopressin, AVP)",
    lobe: "posterior",
    cellType: "Supraoptic nucleus magnocellular neurons → posterior pit",
    hypothalamicControl: "Stimulated by ↑plasma osmolality (osmoreceptors), ↓effective circulating volume (baroreceptors), and angiotensin II.",
    target: "Renal collecting duct principal cells (V2 receptor → aquaporin-2 insertion) and vascular smooth muscle (V1 → vasoconstriction).",
    effect: "Water reabsorption → concentrated urine, free water retention. V1 vasoconstriction at high doses.",
    pathology: "Diabetes insipidus: central (↓ADH from pit/hypothalamus — head trauma, idiopathic) or nephrogenic (kidney unresponsive — lithium, hypercalcaemia). Polyuria, dilute urine. SIADH (excess ADH) → hyponatraemia (small-cell lung CA, drugs, CNS injury).",
    cx: 540,
    cy: 280,
    colorVar: "var(--ph-curve-5)"
  },
  {
    id: "oxy",
    shortName: "Oxytocin",
    fullName: "Oxytocin",
    lobe: "posterior",
    cellType: "Paraventricular nucleus magnocellular neurons → posterior pit",
    hypothalamicControl: "Stimulated by uterine cervical stretch (Ferguson reflex) and breast suckling (positive feedback in both — rare in physiology).",
    target: "Uterine smooth muscle and breast myoepithelial cells.",
    effect: "Uterine contraction (parturition); milk let-down (ejection) reflex during nursing. Some prosocial / pair-bonding effects in CNS.",
    pathology: "Pharmacologic Pitocin used for labor induction and post-partum hemorrhage. Uterine rupture risk if overused with prior C-section. No defined clinical deficiency state.",
    cx: 600,
    cy: 280,
    colorVar: "var(--ph-curve-4)"
  }
];

export default function PituitaryHormoneMapWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialId = (HORMONES.find((h) => h.id === searchParams.get("hormone"))?.id ?? "gh") as HormoneId;
  const [selectedId, setSelectedId] = useState<HormoneId>(initialId);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("hormone", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("hormone") as HormoneId | null;
    if (next && HORMONES.find((h) => h.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = HORMONES.find((h) => h.id === selectedId)!;
  const W = 760;
  const H = 440;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Pituitary hormone map">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">
              {selected.fullName} · {selected.lobe} pituitary
            </p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p>
                <span className="font-bold text-ph-text">Cell:</span>{" "}
                <span className="text-ph-muted">{selected.cellType}</span>
              </p>
              <p>
                <span className="font-bold text-ph-text">Hypothalamic control:</span>{" "}
                <span className="text-ph-muted">{selected.hypothalamicControl}</span>
              </p>
              <p>
                <span className="font-bold text-ph-text">Target:</span>{" "}
                <span className="text-ph-muted">{selected.target}</span>
              </p>
              <p>
                <span className="font-bold text-ph-text">Effect:</span>{" "}
                <span className="text-ph-muted">{selected.effect}</span>
              </p>
              <p>
                <span className="font-bold text-ph-text">Pathology:</span>{" "}
                <span className="text-ph-muted">{selected.pathology}</span>
              </p>
            </div>
          </div>

          <svg role="img" aria-label="Pituitary hormone map" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Hypothalamus */}
            <g>
              <rect x={120} y={30} width={520} height={80} rx={14} fill="color-mix(in srgb, var(--ph-curve-3), transparent 88%)" stroke="color-mix(in srgb, var(--ph-curve-3), transparent 50%)" strokeWidth={1.5} />
              <text x={380} y={60} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--ph-text)">HYPOTHALAMUS</text>
              <text x={380} y={82} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ph-muted)">
                GHRH · SST · TRH · CRH · GnRH · dopamine (PIF) → portal blood
              </text>
              <text x={380} y={100} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ph-muted)">
                Supraoptic + paraventricular nuclei → axonal transport
              </text>
            </g>

            {/* Portal stalk */}
            <g>
              <rect x={350} y={110} width={60} height={80} fill="color-mix(in srgb, var(--ph-curve-3), transparent 90%)" stroke="color-mix(in srgb, var(--ph-curve-3), transparent 60%)" strokeWidth={1} />
              <text x={420} y={155} fontSize="9" fontWeight="700" fill="var(--ph-muted)">stalk</text>
            </g>

            {/* Anterior pituitary */}
            <g>
              <ellipse cx={340} cy={250} rx={210} ry={70} fill="color-mix(in srgb, var(--ph-curve-1), transparent 90%)" stroke="color-mix(in srgb, var(--ph-curve-1), transparent 55%)" strokeWidth={1.5} />
              <text x={340} y={210} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
                ANTERIOR PITUITARY (adenohypophysis)
              </text>
            </g>

            {/* Posterior pituitary */}
            <g>
              <ellipse cx={570} cy={250} rx={90} ry={70} fill="color-mix(in srgb, var(--ph-curve-5), transparent 90%)" stroke="color-mix(in srgb, var(--ph-curve-5), transparent 55%)" strokeWidth={1.5} />
              <text x={570} y={210} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)" letterSpacing="1.5">
                POSTERIOR PIT.
              </text>
              <text x={570} y={345} textAnchor="middle" fontSize="9" fill="var(--ph-muted)">(neurohypophysis)</text>
            </g>

            {/* Hormone buttons */}
            {HORMONES.map((h) => {
              const isSelected = h.id === selectedId;
              return (
                <g key={h.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(h.id)} role="button" aria-label={`Select ${h.fullName}`}>
                  <circle
                    cx={h.cx}
                    cy={h.cy}
                    r={isSelected ? 30 : 24}
                    fill={isSelected ? h.colorVar : `color-mix(in srgb, ${h.colorVar}, transparent 65%)`}
                    stroke={h.colorVar}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text x={h.cx} y={h.cy + 5} textAnchor="middle" fontSize={isSelected ? "13" : "11"} fontWeight="800" fill={isSelected ? "white" : "var(--ph-text)"}>
                    {h.shortName}
                  </text>
                </g>
              );
            })}

            {/* Target arrows from selected hormone */}
            <g>
              <line
                x1={selected.cx}
                y1={selected.cy + 30}
                x2={selected.cx}
                y2={H - 60}
                stroke={selected.colorVar}
                strokeWidth={2.5}
                strokeDasharray="6 4"
              />
              <text x={selected.cx} y={H - 40} textAnchor="middle" fontSize="11" fontWeight="800" fill={selected.colorVar}>
                → {selected.target.split(" ")[0]}
              </text>
            </g>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Click each axis to trace hypothalamus → pituitary → target → feedback. Most anterior-pituitary hormones run trophic loops where the target hormone brakes upstream. The posterior pituitary is different — ADH and oxytocin are made in the hypothalamus and simply RELEASED neurally, with no trophic gland in between.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Hormone selector">
            <h2 className="ph-section-label mb-4">Click a hormone</h2>
            <div className="grid gap-2">
              {HORMONES.map((h) => {
                const isSelected = h.id === selectedId;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: h.colorVar }}
                    />
                    <span className="font-bold">{h.shortName}</span>
                    <span className="text-xs">{h.fullName}</span>
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
