"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "nerv/cochlear-transduction";
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
    shortName: "Sound → TM",
    title: "1. Sound waves vibrate the tympanic membrane",
    body: "Airborne pressure waves funnel down the external auditory canal and vibrate the tympanic membrane (eardrum). The canal resonance amplifies speech frequencies (~3 kHz).",
    clinical: "Conductive hearing loss begins here: cerumen impaction, otitis media (effusion behind the drum), tympanic perforation. On exam, Weber test lateralises TO the affected ear and Rinne shows bone > air conduction."
  },
  {
    id: 2,
    shortName: "Ossicles",
    title: "2. Ossicles (malleus → incus → stapes) — impedance matching",
    body: "The three middle-ear bones lever the vibration from the large tympanic membrane onto the much smaller oval window. This impedance matching (area ratio ~17:1 plus lever action) overcomes the air-to-fluid mismatch — without it, ~99.9% of sound energy would reflect off the cochlear fluid.",
    clinical: "Otosclerosis fixes the stapes footplate to the oval window → conductive loss, often in young adults; treated with stapedectomy. The stapedius (CN VII) and tensor tympani (CN V3) dampen loud sounds (acoustic reflex)."
  },
  {
    id: 3,
    shortName: "Oval window",
    title: "3. Stapes drives the oval window → cochlear fluid wave",
    body: "The stapes footplate pushes the oval window, launching a pressure wave through the perilymph of the scala vestibuli and scala tympani. The round window bulges to relieve the pressure (fluid is incompressible).",
    clinical: "The cochlea is a coiled, fluid-filled tube. Endolymph (scala media) is uniquely high in K⁺ — the endocochlear potential (+80 mV) is the battery that drives hair-cell transduction."
  },
  {
    id: 4,
    shortName: "Basilar membrane",
    title: "4. Basilar membrane — tonotopic traveling wave",
    body: "The traveling wave peaks at different positions by frequency: the stiff, narrow BASE responds to HIGH frequencies; the floppy, wide APEX responds to LOW frequencies. This tonotopic map is preserved all the way to the auditory cortex.",
    clinical: "Noise-induced and age-related hearing loss (presbycusis) hit the high-frequency BASE first — patients lose consonants before vowels. Aminoglycosides and cisplatin are ototoxic to basal hair cells (high-frequency loss first)."
  },
  {
    id: 5,
    shortName: "Hair cells",
    title: "5. Hair cells — mechanotransduction",
    body: "Basilar membrane movement shears the stereocilia against the tectorial membrane. Tip links open K⁺ channels → K⁺ influx from endolymph DEPOLARISES the hair cell → Ca²⁺ entry → glutamate release. INNER hair cells (one row) are the true sensory receptors; OUTER hair cells (three rows) are the cochlear amplifier (prestin-driven electromotility).",
    clinical: "Outer hair cells produce otoacoustic emissions — measurable echoes used in newborn hearing screening. Loss of OHCs (noise, ototoxicity) abolishes the amplifier → sensorineural loss with recruitment (loudness grows abnormally fast)."
  },
  {
    id: 6,
    shortName: "CN VIII",
    title: "6. Spiral ganglion → cochlear nerve (CN VIII) → brainstem",
    body: "Glutamate from inner hair cells excites spiral ganglion neurons, whose axons form the cochlear division of CN VIII → cochlear nuclei → (bilateral) superior olive → lateral lemniscus → inferior colliculus → medial geniculate → auditory cortex. Bilateral pathways mean unilateral cortical lesions do NOT cause deafness.",
    clinical: "Vestibular schwannoma (acoustic neuroma, CN VIII at the cerebellopontine angle) → unilateral sensorineural loss + tinnitus; bilateral schwannomas suggest NF2. Sensorineural loss: Weber lateralises AWAY from the bad ear, Rinne air > bone (normal pattern) bilaterally."
  }
];

export default function CochlearTransductionWidget() {
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
  const H = 300;
  const stations = [
    { id: 1 as StepId, label: "TM", x: 70 },
    { id: 2 as StepId, label: "Ossicles", x: 190 },
    { id: 3 as StepId, label: "Oval window", x: 320 },
    { id: 4 as StepId, label: "Basilar memb.", x: 460 },
    { id: 5 as StepId, label: "Hair cells", x: 590 },
    { id: 6 as StepId, label: "CN VIII", x: 690 }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Cochlear transduction pathway">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{step.title}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{step.body}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{step.clinical}</span></p>
          </div>

          <svg role="img" aria-label={step.title} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <text x="40" y="40" fontSize="11" fontWeight="800" letterSpacing="1.4" fill="var(--ph-muted)">AIR → BONE → FLUID → NERVE</text>
            {/* schematic cochlea spiral hint */}
            <path d="M 440 160 q 60 -50 110 0 q -45 70 -100 30 q -30 -30 10 -50" fill="none" stroke="color-mix(in srgb, var(--ph-curve-3), transparent 60%)" strokeWidth="2" />
            <text x="595" y="120" fontSize="9" fontWeight="700" fill="var(--ph-muted)">base=high · apex=low</text>

            {/* connecting line */}
            <line x1="70" y1="190" x2="690" y2="190" stroke="var(--ph-axis)" strokeWidth="2" opacity="0.4" />
            {stations.map((s, i) => {
              const isSel = s.id === stepId;
              return (
                <g key={s.id} style={{ cursor: "pointer" }} onClick={() => setStepId(s.id)} role="button" aria-label={`Step ${s.id}`}>
                  {i < stations.length - 1 ? (
                    <line x1={s.x + 18} y1="190" x2={stations[i + 1].x - 18} y2="190" stroke={s.id < stepId ? "var(--ph-ok)" : "var(--ph-axis)"} strokeWidth="2.5" opacity={s.id < stepId ? 0.8 : 0.35} />
                  ) : null}
                  <circle cx={s.x} cy="190" r={isSel ? 22 : 16} fill={isSel ? "var(--ph-accent)" : "color-mix(in srgb, var(--ph-accent), transparent 72%)"} stroke="var(--ph-accent)" strokeWidth={isSel ? 3 : 1.2} />
                  <text x={s.x} y="195" textAnchor="middle" fontSize="11" fontWeight="800" fill={isSel ? "white" : "var(--ph-text)"}>{s.id}</text>
                  <text x={s.x} y="240" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={isSel ? "var(--ph-text)" : "var(--ph-muted)"}>{s.label}</text>
                </g>
              );
            })}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Click each station as sound becomes signal: eardrum → ossicles (impedance matching) → cochlear fluid → basilar membrane, which is TONOTOPIC (base codes high pitch, apex low) → hair cells → CN VIII. Outer-ear or ossicle problems give conductive loss; hair-cell or nerve problems give sensorineural loss."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Step selector">
            <h2 className="ph-section-label mb-4">Walk the cochlea</h2>
            <div className="grid gap-2">
              {STEPS.map((s) => (
                <button key={s.id} type="button" onClick={() => setStepId(s.id)}
                  className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                    s.id === stepId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}>
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
                <li key={`${reference.source}-${reference.pages}`}>{reference.source}{reference.pages ? `, ${reference.pages}` : ""}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
