"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "repro/contraception-methods";
const diagram = getDiagramById(DIAGRAM_ID);

type MethodId = "combined" | "progestin" | "implant" | "dmpa" | "cuiud" | "lngiud" | "emergency" | "barrier" | "sterilization";

type Method = {
  id: MethodId;
  shortName: string;
  fullName: string;
  site: string;
  mechanism: string;
  efficacy: string;
  pearl: string;
  colorVar: string;
};

const METHODS: Method[] = [
  {
    id: "combined",
    shortName: "Combined OCP",
    fullName: "Combined estrogen + progestin pill",
    site: "Hypothalamic–pituitary axis (+ cervix, endometrium)",
    mechanism: "Estrogen + progestin suppress GnRH → ↓FSH/LH → NO LH surge → no ovulation. Progestin thickens cervical mucus and thins the endometrium.",
    efficacy: "~93% typical, >99% perfect use.",
    pearl: "Estrogen is prothrombotic — avoid in migraine WITH aura, smokers > 35, history of VTE, or < 21 days postpartum. Non-contraceptive benefits: ↓ovarian + endometrial cancer, lighter cycles, acne.",
    colorVar: "var(--ph-curve-1)"
  },
  {
    id: "progestin",
    shortName: "Progestin-only",
    fullName: "Progestin-only pill (minipill)",
    site: "Cervix + endometrium (variable ovulation suppression)",
    mechanism: "Primarily thickens cervical mucus + thins endometrium; suppresses ovulation only inconsistently. Must be taken at the same time daily (3-hour window).",
    efficacy: "~93% typical use.",
    pearl: "No estrogen → safe in breastfeeding, VTE history, migraine with aura, and smokers > 35. The default choice when estrogen is contraindicated.",
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "implant",
    shortName: "Implant",
    fullName: "Etonogestrel subdermal implant",
    site: "Hypothalamic axis + cervix",
    mechanism: "Steady progestin → suppresses the LH surge (inhibits ovulation) + thickens mucus. Lasts ~3 years.",
    efficacy: ">99% (LARC — long-acting reversible contraception).",
    pearl: "Most effective reversible method (failure < 0.1%). Irregular bleeding is the main reason for discontinuation. No user adherence required.",
    colorVar: "var(--ph-curve-6)"
  },
  {
    id: "dmpa",
    shortName: "DMPA shot",
    fullName: "Depot medroxyprogesterone acetate injection",
    site: "Hypothalamic axis",
    mechanism: "High-dose depot progestin every 3 months → strongly suppresses the LH surge → no ovulation; also thickens mucus.",
    efficacy: "~96% typical use.",
    pearl: "Reversible BUT delayed return to fertility (up to 9–12 months). Causes reversible bone density loss (black-box warning) and weight gain. Good when daily adherence is hard.",
    colorVar: "var(--ph-curve-2)"
  },
  {
    id: "cuiud",
    shortName: "Copper IUD",
    fullName: "Copper intrauterine device",
    site: "Uterine cavity (local, non-hormonal)",
    mechanism: "Copper ions are spermicidal and trigger a sterile inflammatory reaction toxic to sperm and ova → fertilisation is prevented. No hormones, no effect on ovulation.",
    efficacy: ">99%, lasts up to 10–12 years.",
    pearl: "The most effective EMERGENCY contraception (insert within 5 days). Side effect: heavier, crampier menses — avoid in menorrhagia. The only highly effective non-hormonal long-acting method.",
    colorVar: "var(--ph-curve-7)"
  },
  {
    id: "lngiud",
    shortName: "LNG IUD",
    fullName: "Levonorgestrel intrauterine device",
    site: "Endometrium + cervix (local progestin)",
    mechanism: "Local progestin profoundly thins the endometrium and thickens cervical mucus; ovulation often continues. Minimal systemic absorption.",
    efficacy: ">99%, lasts 3–8 years.",
    pearl: "REDUCES menstrual bleeding (treats menorrhagia, protects endometrium during estrogen therapy). Opposite menstrual effect to the copper IUD.",
    colorVar: "var(--ph-curve-5)"
  },
  {
    id: "emergency",
    shortName: "Emergency",
    fullName: "Emergency contraception (levonorgestrel / ulipristal)",
    site: "Hypothalamic axis (delays ovulation)",
    mechanism: "Levonorgestrel or ulipristal acetate DELAY or inhibit ovulation. They do NOT disrupt an established pregnancy and are not abortifacients. Most effective the sooner they are taken.",
    efficacy: "Ulipristal > levonorgestrel; copper IUD is the most effective EC of all.",
    pearl: "Ulipristal (a selective progesterone receptor modulator) works later in the cycle than levonorgestrel and is more effective at higher BMI. Take ASAP within 72–120 hours.",
    colorVar: "var(--ph-curve-4)"
  },
  {
    id: "barrier",
    shortName: "Barrier",
    fullName: "Condom / diaphragm (barrier)",
    site: "Physical barrier at the cervix",
    mechanism: "Physically blocks sperm from reaching the egg. Condoms additionally reduce STI transmission.",
    efficacy: "~87% typical use (condom).",
    pearl: "The ONLY method that also prevents STIs — recommend alongside hormonal/LARC methods (dual protection). User-dependent, so typical-use efficacy is modest.",
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "sterilization",
    shortName: "Sterilization",
    fullName: "Tubal ligation / vasectomy",
    site: "Fallopian tube / vas deferens",
    mechanism: "Surgical/mechanical interruption of the tube (egg–sperm meeting) or vas deferens (sperm transport). Intended to be permanent.",
    efficacy: ">99%.",
    pearl: "Vasectomy is simpler, safer, and cheaper than tubal ligation — but needs ~3 months / 20 ejaculations and a confirmatory semen analysis before it is reliable. Counsel as permanent.",
    colorVar: "var(--ph-curve-1)"
  }
];

export default function ContraceptionMethodsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (METHODS.find((m) => m.id === searchParams.get("method"))?.id ?? "combined") as MethodId;
  const [selectedId, setSelectedId] = useState<MethodId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("method", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("method") as MethodId | null;
    if (next && METHODS.find((m) => m.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = METHODS.find((m) => m.id === selectedId)!;
  const W = 720;
  const H = 360;

  // Anatomical sites mapped to vertical bands.
  const siteBand = (id: MethodId) => {
    if (["combined", "implant", "dmpa", "emergency"].includes(id)) return { y: 60, label: "Hypothalamus / pituitary — block ovulation" };
    if (["progestin"].includes(id)) return { y: 130, label: "Cervix — thicken mucus" };
    if (["cuiud", "lngiud"].includes(id)) return { y: 200, label: "Uterus — endometrium / spermicidal" };
    if (["barrier"].includes(id)) return { y: 270, label: "Cervix — physical barrier" };
    return { y: 320, label: "Tube / vas — interrupt transport" };
  };
  const band = siteBand(selectedId);

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Contraception sites of action">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{selected.fullName}</p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p><span className="font-bold text-ph-text">Site:</span> <span className="text-ph-muted">{selected.site}</span></p>
              <p><span className="font-bold text-ph-text">Mechanism:</span> <span className="text-ph-muted">{selected.mechanism}</span></p>
              <p><span className="font-bold text-ph-text">Efficacy:</span> <span className="text-ph-muted">{selected.efficacy}</span></p>
              <p><span className="font-bold text-ph-text">Pearl:</span> <span className="text-ph-muted">{selected.pearl}</span></p>
            </div>
          </div>

          <svg role="img" aria-label="Sites of contraceptive action" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Axis from brain (top) to gonad/tract (bottom) */}
            <line x1="120" y1="40" x2="120" y2="340" stroke="var(--ph-axis)" strokeWidth="2.5" opacity="0.5" />
            {[
              { y: 60, label: "Hypothalamus / pituitary" },
              { y: 130, label: "Cervix (mucus)" },
              { y: 200, label: "Uterus (endometrium)" },
              { y: 270, label: "Cervix (barrier)" },
              { y: 320, label: "Tube / vas" }
            ].map((s) => {
              const isActive = Math.abs(s.y - band.y) < 5;
              return (
                <g key={s.y}>
                  <circle cx="120" cy={s.y} r={isActive ? 11 : 7} fill={isActive ? "var(--ph-accent)" : "color-mix(in srgb, var(--ph-axis), transparent 40%)"} />
                  <text x="142" y={s.y + 4} fontSize="12" fontWeight={isActive ? "800" : "600"} fill={isActive ? "var(--ph-text)" : "var(--ph-muted)"}>{s.label}</text>
                </g>
              );
            })}
            <text x="420" y="328" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-accent)">{band.label}</text>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Click a method to see WHERE it acts, because mechanism predicts efficacy and contraindications. Combined hormones block ovulation, progestins also thicken cervical mucus and thin the endometrium, the copper IUD is spermicidal, and barriers block transport. The most reliable methods remove user error (IUD, implant)."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Method selector">
            <h2 className="ph-section-label mb-4">Click a method</h2>
            <div className="grid gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    m.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}
                >
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
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>
                  {reference.source}{reference.pages ? `, ${reference.pages}` : ""}
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
