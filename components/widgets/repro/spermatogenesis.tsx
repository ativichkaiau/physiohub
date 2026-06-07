"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { PerturbationToggle, Slider } from "@/components/widgets/primitives";
import { clamp, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "repro/spermatogenesis";
const diagram = getDiagramById(DIAGRAM_ID);

type StepId = 1 | 2 | 3 | 4 | 5 | 6;

type Stage = {
  id: StepId;
  shortName: string;
  title: string;
  body: string;
  site: string;
};

const stages: Stage[] = [
  {
    id: 1,
    shortName: "Spermatogonia",
    title: "1. Spermatogonia renew on the basement membrane",
    body: "Type A spermatogonia self-renew; type B spermatogonia commit to meiosis. Sertoli cells support the germinal epithelium and maintain the blood-testis barrier.",
    site: "Basal compartment"
  },
  {
    id: 2,
    shortName: "Primary spermatocyte",
    title: "2. Primary spermatocytes cross into the adluminal compartment",
    body: "Primary spermatocytes are diploid but have replicated DNA. They pass through tight junctions between Sertoli cells before meiosis.",
    site: "Adluminal entry"
  },
  {
    id: 3,
    shortName: "Meiosis I",
    title: "3. Meiosis I produces secondary spermatocytes",
    body: "Homologous chromosomes separate. Secondary spermatocytes are haploid, but each chromosome still has sister chromatids.",
    site: "Adluminal compartment"
  },
  {
    id: 4,
    shortName: "Meiosis II",
    title: "4. Meiosis II produces round spermatids",
    body: "Sister chromatids separate, producing haploid round spermatids. These are not motile yet.",
    site: "Near lumen"
  },
  {
    id: 5,
    shortName: "Spermiogenesis",
    title: "5. Spermiogenesis remodels spermatids",
    body: "Round spermatids form an acrosome, condense nuclei, build flagella, shed residual cytoplasm, and align for release.",
    site: "Luminal edge"
  },
  {
    id: 6,
    shortName: "Epididymis",
    title: "6. Epididymal maturation enables motility and storage",
    body: "Sperm released from Sertoli cells are carried to the epididymis, where they gain motility and fertilizing capacity.",
    site: "Epididymis"
  }
];

function stageFor(id: number) {
  return stages.find((stage) => stage.id === id) ?? stages[0];
}

export default function SpermatogenesisWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const [step, setStep] = useState<StepId>(() => stageFor(Math.round(parseNumber(searchParams.get("step"), 1, 1, 6))).id);
  const [fsh, setFsh] = useState(() => parseNumber(searchParams.get("fsh"), 90, 0, 150));
  const [testosterone, setTestosterone] = useState(() => parseNumber(searchParams.get("t"), 100, 0, 160));
  const [barrier, setBarrier] = useState(() => parseBoolean(searchParams.get("barrier"), true));
  const urlTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef({ step, fsh, testosterone, barrier });

  useEffect(() => {
    stateRef.current = { step, fsh, testosterone, barrier };
  }, [barrier, fsh, step, testosterone]);

  useEffect(() => {
    const current = stateRef.current;
    const nextStep = stageFor(Math.round(parseNumber(searchParams.get("step"), current.step, 1, 6))).id;
    const nextFsh = parseNumber(searchParams.get("fsh"), current.fsh, 0, 150);
    const nextT = parseNumber(searchParams.get("t"), current.testosterone, 0, 160);
    const nextBarrier = parseBoolean(searchParams.get("barrier"), current.barrier);
    if (nextStep !== current.step) setStep(nextStep);
    if (Math.abs(nextFsh - current.fsh) > 0.1) setFsh(nextFsh);
    if (Math.abs(nextT - current.testosterone) > 0.1) setTestosterone(nextT);
    if (nextBarrier !== current.barrier) setBarrier(nextBarrier);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("step", String(step));
    params.set("fsh", String(Math.round(fsh)));
    params.set("t", String(Math.round(testosterone)));
    params.set("barrier", barrier ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [barrier, currentQuery, fsh, pathname, router, step, testosterone]);

  const stage = stageFor(step);
  const sertoliSupport = clamp(fsh * 0.52 + testosterone * 0.36 + (barrier ? 14 : -20), 0, 130);
  const meioticSupport = clamp(testosterone * 0.55 + fsh * 0.25 + (barrier ? 10 : -25), 0, 130);
  const output = clamp((sertoliSupport + meioticSupport) / 2 - (barrier ? 0 : 18), 0, 120);
  const state =
    !barrier
      ? "Barrier disruption"
      : output < 45
        ? "Subfertile support"
        : testosterone < 45
          ? "Low intratesticular testosterone"
          : "Spermatogenesis supported";

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Spermatogenesis mechanism">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
              <p className="ph-section-label">{stage.title}</p>
              <p className="mt-1 text-sm text-ph-muted">{stage.body}</p>
            </div>
            <div aria-live="polite" className="grid grid-cols-2 gap-2 text-sm">
              <span className="ph-readout">Site {stage.site}</span>
              <span className="ph-readout">FSH {fsh.toFixed(0)}%</span>
              <span className="ph-readout">T {testosterone.toFixed(0)}%</span>
              <span className="ph-readout">Output {output.toFixed(0)}%</span>
            </div>
          </div>

          {!barrier ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: blood-testis barrier disruption exposes adluminal germ cells to immune attack and impairs meiosis.
            </p>
          ) : null}

          <svg role="img" aria-label={stage.title} viewBox="0 0 760 520" className="ph-pathway-canvas h-auto w-full">
            <rect x="52" y="56" width="656" height="388" rx="26" fill="color-mix(in srgb, var(--ph-surface), var(--ph-surface-2) 42%)" stroke="var(--ph-border-strong)" />
            <ellipse cx="380" cy="252" rx="232" ry="156" fill="color-mix(in srgb, var(--ph-curve-1), transparent 94%)" stroke="var(--ph-border-strong)" strokeWidth="2" />
            <ellipse cx="380" cy="252" rx="94" ry="60" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="2" />
            <text x="380" y="257" textAnchor="middle" fontSize="12" fontWeight="900" fill="var(--ph-muted)" letterSpacing="1.4">LUMEN</text>

            <path d="M150 112 C250 76 510 76 610 112" fill="none" stroke="var(--ph-axis)" strokeDasharray={barrier ? "0" : "7 7"} strokeWidth={barrier ? 3 : 2} opacity={barrier ? 0.9 : 0.45} />
            <text x="380" y="96" textAnchor="middle" fontSize="11" fontWeight="900" fill={barrier ? "var(--ph-axis)" : "var(--ph-warn)"} letterSpacing="1.3">
              BLOOD-TESTIS BARRIER
            </text>

            {stages.map((item, index) => {
              const angle = -145 + index * 58;
              const radius = item.id === 6 ? 278 : 178 - index * 18;
              const x = item.id === 6 ? 645 : 380 + Math.cos((angle * Math.PI) / 180) * radius;
              const y = item.id === 6 ? 366 : 252 + Math.sin((angle * Math.PI) / 180) * radius;
              const active = item.id === step;
              const fill = active ? "var(--ph-accent)" : item.id <= 2 ? "var(--ph-curve-6)" : item.id <= 4 ? "var(--ph-curve-2)" : "var(--ph-curve-3)";
              return (
                <g key={item.id}>
                  {index > 0 ? (
                    <line
                      x1={item.id === 6 ? 555 : x - 34}
                      y1={item.id === 6 ? 346 : y - 24}
                      x2={x - 10}
                      y2={y - 6}
                      stroke="var(--ph-grid)"
                      strokeWidth="2"
                    />
                  ) : null}
                  <circle cx={x} cy={y} r={active ? 28 : 22} fill={fill} opacity={active ? 1 : 0.78} stroke={active ? "var(--ph-text)" : "var(--ph-surface)"} strokeWidth={active ? 3 : 2} />
                  <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill="white">{item.id}</text>
                  <text x={x} y={y + 42} textAnchor="middle" fontSize="10" fontWeight="800" fill={active ? "var(--ph-text)" : "var(--ph-muted)"}>
                    {item.shortName}
                  </text>
                </g>
              );
            })}

            <g transform="translate(88 392)">
              <rect x="0" y="0" width="250" height="62" rx="10" fill="var(--ph-surface)" stroke="var(--ph-border)" />
              <text x="16" y="22" fontSize="10" fontWeight="900" fill="var(--ph-muted)" letterSpacing="1.3">HORMONAL SUPPORT</text>
              <text x="16" y="44" fontSize="12" fontWeight="800" fill="var(--ph-text)">FSH → Sertoli · LH → Leydig → T</text>
            </g>
            <g transform="translate(436 392)">
              <rect x="0" y="0" width="210" height="62" rx="10" fill="var(--ph-surface)" stroke="var(--ph-border)" />
              <text x="16" y="22" fontSize="10" fontWeight="900" fill="var(--ph-muted)" letterSpacing="1.3">CURRENT STATE</text>
              <text x="16" y="44" fontSize="12" fontWeight="800" fill="var(--ph-text)">{state}</text>
            </g>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Stage controls">
            <h2 className="ph-section-label mb-4">Stages</h2>
            <div className="grid gap-2">
              {stages.map((item) => {
                const selected = item.id === step;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setStep(item.id)}
                    className={
                      selected
                        ? "focus-ring rounded-ph border border-[color-mix(in_srgb,var(--ph-accent),transparent_40%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] px-3 py-2 text-left text-sm font-bold text-ph-accent"
                        : "focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2 text-left text-sm font-semibold text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                    }
                  >
                    {item.id}. {item.shortName}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-4">
              <Slider label="FSH / Sertoli support" value={fsh} min={0} max={150} step={1} unit="%" defaultValue={90} onChange={setFsh} />
              <Slider label="Intratesticular testosterone" value={testosterone} min={0} max={160} step={1} unit="%" defaultValue={100} onChange={setTestosterone} />
              <PerturbationToggle label="Blood-testis barrier intact" checked={barrier} onChange={setBarrier} />
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
