"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "repro/sexual-differentiation";
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
    shortName: "SRY",
    title: "1. SRY gene (Y chromosome) → testis-determining factor",
    body: "The default body plan is female. The SRY gene on the short arm of the Y chromosome encodes testis-determining factor (TDF), which switches the bipotential gonad toward a testis. No SRY → ovary.",
    clinical: "Swyer syndrome (46,XY gonadal dysgenesis): SRY mutation → streak gonads, female external genitalia, no puberty. SRY translocation onto an X → 46,XX male. The gonad's fate, not the karyotype, drives downstream anatomy."
  },
  {
    id: 2,
    shortName: "Gonad",
    title: "2. Bipotential gonad → testis or ovary",
    body: "With TDF, the medulla becomes a testis (Sertoli + Leydig cells); without it, the cortex becomes an ovary. The gonad then dictates the internal and external genitalia through its hormone output (or lack of it).",
    clinical: "Turner syndrome (45,XO): only one X → streak ovaries, no functional germ cells, primary amenorrhea, short stature, webbed neck. Ovarian development needs two X chromosomes."
  },
  {
    id: 3,
    shortName: "AMH",
    title: "3. Sertoli cells → AMH → Müllerian regression",
    body: "Sertoli cells secrete anti-Müllerian hormone (AMH, a.k.a. Müllerian inhibiting substance). AMH causes the Müllerian (paramesonephric) ducts to REGRESS. Without AMH (the female default), the Müllerian ducts persist → fallopian tubes, uterus, upper vagina.",
    clinical: "Persistent Müllerian duct syndrome: AMH or AMH-receptor defect in a 46,XY male → uterus and tubes alongside male structures; often presents as cryptorchidism or hernia containing a uterus."
  },
  {
    id: 4,
    shortName: "Testosterone",
    title: "4. Leydig cells → testosterone → Wolffian development",
    body: "Leydig cells make testosterone, which stabilises and develops the Wolffian (mesonephric) ducts into the epididymis, vas deferens, and seminal vesicles. Without testosterone, the Wolffian ducts regress (female default).",
    clinical: "Complete androgen insensitivity syndrome (CAIS): 46,XY with a defective androgen receptor → testes present (and AMH works, so no uterus) but no response to testosterone → female external phenotype, blind vaginal pouch, primary amenorrhea, breast development from aromatised estrogen."
  },
  {
    id: 5,
    shortName: "DHT",
    title: "5. 5α-reductase → DHT → external genitalia + prostate",
    body: "Testosterone is converted by 5α-reductase to dihydrotestosterone (DHT), which masculinises the EXTERNAL genitalia (penis, scrotum) and forms the prostate. Without DHT, the external default is clitoris, labia, lower vagina.",
    clinical: "5α-reductase deficiency: 46,XY with normal testosterone but no DHT → female-appearing external genitalia at birth, then virilisation at puberty when the testosterone surge takes over ('penis at 12'). Wolffian (internal) structures are normal because they need testosterone, not DHT."
  },
  {
    id: 6,
    shortName: "Default ♀",
    title: "6. Default female pathway (no SRY, no androgen)",
    body: "Absent TDF, AMH, and androgens, development proceeds female by default: ovaries, persistent Müllerian ducts (uterus, tubes, upper vagina), and feminine external genitalia. Female differentiation is the constitutive program — it does not require ovarian hormones in utero.",
    clinical: "Congenital adrenal hyperplasia (21-hydroxylase deficiency): a 46,XX fetus exposed to excess adrenal androgens → virilised external genitalia (ambiguous), but normal ovaries and uterus internally. The most common cause of ambiguous genitalia in newborns."
  }
];

export default function SexualDifferentiationWidget() {
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
  const W = 740;
  const H = 320;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Sexual differentiation pathway">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span>
            </p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            {/* Bipotential start */}
            <rect x="40" y="130" width="120" height="60" rx="12" fill="color-mix(in srgb, var(--ph-curve-3), transparent 70%)" stroke="var(--ph-curve-3)" strokeWidth={stepId <= 2 ? 3 : 1.3} />
            <text x="100" y="155" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-text)">Bipotential</text>
            <text x="100" y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)">gonad</text>

            {/* Male branch (top) */}
            <line x1="160" y1="150" x2="220" y2="90" stroke={stepId >= 1 && stepId <= 5 ? "var(--ph-curve-1)" : "var(--ph-axis)"} strokeWidth="2" />
            <text x="300" y="40" textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="1.2" fill="var(--ph-curve-1)">SRY+ → MALE</text>
            {[
              { id: 1, label: "SRY/TDF", x: 250 },
              { id: 3, label: "AMH", x: 380 },
              { id: 4, label: "T → Wolffian", x: 520 },
              { id: 5, label: "DHT → ext.", x: 660 }
            ].map((n) => (
              <g key={n.id} style={{ cursor: "pointer" }} onClick={() => setStepId(n.id as StepId)} role="button" aria-label={`Step ${n.id}`}>
                <rect x={n.x - 56} y="62" width="112" height="46" rx="9" fill={stepId === n.id ? "var(--ph-curve-1)" : "color-mix(in srgb, var(--ph-curve-1), transparent 72%)"} stroke="var(--ph-curve-1)" strokeWidth={stepId === n.id ? 3 : 1.2} />
                <text x={n.x} y="90" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={stepId === n.id ? "white" : "var(--ph-text)"}>{n.label}</text>
              </g>
            ))}

            {/* Female branch (bottom) */}
            <line x1="160" y1="170" x2="220" y2="240" stroke={stepId === 2 || stepId === 6 ? "var(--ph-curve-7)" : "var(--ph-axis)"} strokeWidth="2" />
            <text x="300" y="290" textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="1.2" fill="var(--ph-curve-7)">DEFAULT → FEMALE</text>
            {[
              { id: 2, label: "Ovary", x: 250 },
              { id: 6, label: "Müllerian + ext.", x: 470 }
            ].map((n) => (
              <g key={n.id} style={{ cursor: "pointer" }} onClick={() => setStepId(n.id as StepId)} role="button" aria-label={`Step ${n.id}`}>
                <rect x={n.x - 70} y="215" width="140" height="46" rx="9" fill={stepId === n.id ? "var(--ph-curve-7)" : "color-mix(in srgb, var(--ph-curve-7), transparent 72%)"} stroke="var(--ph-curve-7)" strokeWidth={stepId === n.id ? 3 : 1.2} />
                <text x={n.x} y="243" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={stepId === n.id ? "white" : "var(--ph-text)"}>{n.label}</text>
              </g>
            ))}
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the pathway</h2>
            <div className="grid gap-2">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStepId(s.id)}
                  className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                    s.id === stepId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}
                >
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
