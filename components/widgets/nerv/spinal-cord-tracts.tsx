"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "nerv/spinal-cord-tracts";
const diagram = getDiagramById(DIAGRAM_ID);

type TractId = "dcml" | "spinothalamic" | "corticospinal" | "brownsequard" | "syringomyelia";

type Tract = {
  id: TractId;
  shortName: string;
  fullName: string;
  modality: string;
  decussation: string;
  lesion: string;
  pearl: string;
  colorVar: string;
  /** Position in the cord cross-section, 0-100 x/y (used for the schematic dot). */
  pos?: { x: number; y: number };
};

const TRACTS: Tract[] = [
  {
    id: "dcml",
    shortName: "DCML",
    fullName: "Dorsal column–medial lemniscus",
    modality: "Fine touch, vibration, proprioception, two-point discrimination.",
    decussation: "Ascends IPSILATERAL in the cord; decussates in the CAUDAL MEDULLA (internal arcuate fibres) → medial lemniscus.",
    lesion: "Cord lesion → IPSILATERAL loss of vibration/proprioception below the level. Positive Romberg (falls with eyes closed).",
    pearl: "Fasciculus gracilis (legs, medial) vs cuneatus (arms, lateral). Tabes dorsalis (neurosyphilis) and subacute combined degeneration (B12 deficiency) target the dorsal columns.",
    colorVar: "var(--ph-curve-1)",
    pos: { x: 50, y: 24 }
  },
  {
    id: "spinothalamic",
    shortName: "Spinothalamic",
    fullName: "Anterolateral / spinothalamic tract",
    modality: "Pain, temperature, crude touch.",
    decussation: "Decussates in the CORD via the anterior white commissure, within 1–2 segments of entry, then ascends contralateral.",
    lesion: "Cord lesion → CONTRALATERAL loss of pain/temperature, starting ~2 levels BELOW the lesion.",
    pearl: "Because it crosses at the cord, a hemisection produces contralateral pain/temp loss (vs ipsilateral DCML loss) — the crux of Brown-Séquard. First-order neuron synapses in the dorsal horn (substantia gelatinosa).",
    colorVar: "var(--ph-curve-4)",
    pos: { x: 22, y: 64 }
  },
  {
    id: "corticospinal",
    shortName: "Corticospinal",
    fullName: "Lateral corticospinal tract",
    modality: "Voluntary motor control (UMN axons).",
    decussation: "Most fibres decussate at the MEDULLARY PYRAMIDS (pyramidal decussation), then descend contralateral in the lateral cord.",
    lesion: "Cord lesion → IPSILATERAL UMN signs below the level (weakness, hyperreflexia, spasticity, Babinski).",
    pearl: "Already crossed in the medulla, so a cord lesion gives ipsilateral motor loss. UMN above the lesion, LMN signs at the exact level (anterior horn). ALS = combined UMN + LMN with NO sensory loss.",
    colorVar: "var(--ph-curve-6)",
    pos: { x: 30, y: 40 }
  },
  {
    id: "brownsequard",
    shortName: "Brown-Séquard",
    fullName: "Cord hemisection (Brown-Séquard syndrome)",
    modality: "Combined lesion of all three tracts on one side.",
    decussation: "Integrates the three crossing patterns.",
    lesion: "Below the lesion: IPSILATERAL motor loss (corticospinal) + IPSILATERAL vibration/proprioception loss (DCML) + CONTRALATERAL pain/temperature loss (spinothalamic). At the level: ipsilateral LMN signs and a band of anaesthesia.",
    pearl: "The classic teaching lesion: 'ipsilateral everything except pain and temperature, which are contralateral.' Causes: penetrating trauma, lateral cord tumour, MS plaque.",
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "syringomyelia",
    shortName: "Syringomyelia",
    fullName: "Central cord / syringomyelia",
    modality: "Selective interruption of the crossing spinothalamic fibres.",
    decussation: "A central cavity (syrinx) expands and severs the anterior white commissure where pain/temp fibres cross.",
    lesion: "BILATERAL 'cape' loss of pain and temperature over the shoulders/arms, with PRESERVED fine touch and proprioception (dorsal columns spared) — dissociated sensory loss.",
    pearl: "Classically C8–T1, associated with Chiari I malformation. As the syrinx grows it hits anterior horns (LMN weakness/atrophy of hands) then dorsal columns. Patients get painless burns on the hands.",
    colorVar: "var(--ph-curve-2)"
  }
];

export default function SpinalCordTractsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (TRACTS.find((t) => t.id === searchParams.get("tract"))?.id ?? "dcml") as TractId;
  const [selectedId, setSelectedId] = useState<TractId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tract", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("tract") as TractId | null;
    if (next && TRACTS.find((t) => t.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = TRACTS.find((t) => t.id === selectedId)!;
  const W = 360;
  const H = 340;
  const cx = 180;
  const cy = 175;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Spinal cord cross-section">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{selected.fullName}</p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p><span className="font-bold text-ph-text">Modality:</span> <span className="text-ph-muted">{selected.modality}</span></p>
              <p><span className="font-bold text-ph-text">Decussation:</span> <span className="text-ph-muted">{selected.decussation}</span></p>
              <p><span className="font-bold text-ph-text">Lesion below:</span> <span className="text-ph-muted">{selected.lesion}</span></p>
              <p><span className="font-bold text-ph-text">Pearl:</span> <span className="text-ph-muted">{selected.pearl}</span></p>
            </div>
          </div>

          <svg role="img" aria-label="Spinal cord cross section" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas mx-auto h-auto w-full max-w-[420px]">
            <text x="180" y="26" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="1.2" fill="var(--ph-muted)">CORD CROSS-SECTION (posterior up)</text>
            {/* cord outline */}
            <ellipse cx={cx} cy={cy} rx="135" ry="120" fill="color-mix(in srgb, var(--ph-surface-2), transparent 20%)" stroke="var(--ph-border-strong)" strokeWidth="2" />
            {/* central grey matter butterfly */}
            <path d={`M ${cx} ${cy - 70} C ${cx - 55} ${cy - 60}, ${cx - 60} ${cy - 10}, ${cx - 40} ${cy} C ${cx - 60} ${cy + 12}, ${cx - 52} ${cy + 62}, ${cx} ${cy + 60} C ${cx + 52} ${cy + 62}, ${cx + 60} ${cy + 12}, ${cx + 40} ${cy} C ${cx + 60} ${cy - 10}, ${cx + 55} ${cy - 60}, ${cx} ${cy - 70} Z`}
              fill="color-mix(in srgb, var(--ph-curve-3), transparent 80%)" stroke="color-mix(in srgb, var(--ph-curve-3), transparent 40%)" strokeWidth="1.5" />
            {/* central canal */}
            <circle cx={cx} cy={cy} r="5" fill="var(--ph-surface)" stroke="var(--ph-muted)" strokeWidth="1" />

            {/* tract markers (paired L/R) */}
            {TRACTS.filter((t) => t.pos).map((t) => {
              const isSel = t.id === selectedId || (selectedId === "brownsequard") || (selectedId === "syringomyelia" && t.id === "spinothalamic");
              const dx = (t.pos!.x / 100) * 135;
              const dy = ((t.pos!.y - 50) / 100) * 240;
              return (
                <g key={t.id}>
                  {[-1, 1].map((side) => (
                    <g key={side} style={{ cursor: "pointer" }} onClick={() => setSelectedId(t.id)} role="button" aria-label={t.fullName}>
                      <circle cx={cx + side * dx} cy={cy + dy} r={t.id === selectedId ? 14 : 10} fill={isSel ? t.colorVar : `color-mix(in srgb, ${t.colorVar}, transparent 70%)`} stroke={t.colorVar} strokeWidth={t.id === selectedId ? 3 : 1.2} />
                    </g>
                  ))}
                </g>
              );
            })}
            {/* hemisection line for Brown-Séquard */}
            {selectedId === "brownsequard" ? (
              <line x1={cx} y1={cy - 118} x2={cx} y2={cy + 118} stroke="var(--ph-danger)" strokeWidth="3" strokeDasharray="6 5" />
            ) : null}
            {selectedId === "syringomyelia" ? (
              <ellipse cx={cx} cy={cy} rx="22" ry="34" fill="none" stroke="var(--ph-danger)" strokeWidth="2.5" strokeDasharray="5 4" />
            ) : null}
            <text x="180" y="320" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ph-muted)">DCML dorsal · corticospinal lateral · spinothalamic anterolateral</text>
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Tract selector">
            <h2 className="ph-section-label mb-4">Click a tract / lesion</h2>
            <div className="grid gap-2">
              {TRACTS.map((t) => (
                <button key={t.id} type="button" onClick={() => setSelectedId(t.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    t.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                  }`}>
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.colorVar }} />
                  <span className="font-bold">{t.shortName}</span>
                  <span className="truncate text-xs">{t.fullName}</span>
                </button>
              ))}
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
