"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "cv/heart-sounds";
const diagram = getDiagramById(DIAGRAM_ID);

type SoundId = "s1" | "s2" | "physiologic" | "wide" | "fixed" | "paradoxical" | "s3" | "s4";

type Sound = {
  id: SoundId;
  shortName: string;
  fullName: string;
  timing: string;
  mechanism: string;
  clinical: string;
  colorVar: string;
};

const SOUNDS: Sound[] = [
  {
    id: "s1", shortName: "S1", fullName: "First heart sound (S1)",
    timing: "Onset of systole",
    mechanism: "Closure of the mitral then tricuspid valves (M1 before T1). Marks the start of ventricular contraction.",
    clinical: "Loud S1: mitral stenosis (mobile valve), short PR, tachycardia. Soft S1: mitral regurgitation, long PR, poor contractility.",
    colorVar: "var(--ph-curve-1)"
  },
  {
    id: "s2", shortName: "S2", fullName: "Second heart sound (S2)",
    timing: "End of systole",
    mechanism: "Closure of the aortic (A2) then pulmonic (P2) valves. A2 normally precedes P2; the gap widens with inspiration.",
    clinical: "Loud A2: systemic hypertension. Loud P2: pulmonary hypertension. Soft A2: aortic stenosis. The SPLITTING of S2 is the high-yield finding — see the splitting patterns.",
    colorVar: "var(--ph-curve-2)"
  },
  {
    id: "physiologic", shortName: "Physiologic split", fullName: "Physiologic splitting of S2",
    timing: "Inspiration",
    mechanism: "Inspiration ↑ venous return to the RV → delays P2 (prolonged RV ejection) and ↓ LV filling → A2 slightly earlier. The A2–P2 gap WIDENS with inspiration, narrows on expiration.",
    clinical: "Normal finding. The reference against which all abnormal splits are judged.",
    colorVar: "var(--ph-curve-6)"
  },
  {
    id: "wide", shortName: "Wide split", fullName: "Wide (but variable) split S2",
    timing: "Widens further with inspiration",
    mechanism: "Anything that DELAYS P2: pulmonic stenosis, RIGHT bundle branch block (delayed RV depolarisation). Still moves with respiration.",
    clinical: "RBBB and pulmonic stenosis are the classics. The split is wide at baseline but still respiratory-variable.",
    colorVar: "var(--ph-curve-3)"
  },
  {
    id: "fixed", shortName: "Fixed split", fullName: "Fixed split S2",
    timing: "Wide and UNCHANGING with respiration",
    mechanism: "An ATRIAL SEPTAL DEFECT equalises L–R atrial filling so inspiration no longer changes the relative RV/LV stroke timing → the split stays wide and fixed.",
    clinical: "Fixed split S2 = ASD until proven otherwise. The single most specific auscultatory sign for ASD.",
    colorVar: "var(--ph-curve-4)"
  },
  {
    id: "paradoxical", shortName: "Paradoxical split", fullName: "Paradoxical (reversed) split S2",
    timing: "Splits on EXPIRATION, single on inspiration",
    mechanism: "P2 comes BEFORE A2 because A2 is delayed: aortic stenosis, LEFT bundle branch block, HOCM. Inspiration delays P2 toward A2 → the split paradoxically narrows/disappears.",
    clinical: "Paradoxical split → think delayed LV ejection: severe AS or LBBB. Opposite respiratory behaviour to normal.",
    colorVar: "var(--ph-curve-7)"
  },
  {
    id: "s3", shortName: "S3 gallop", fullName: "Third heart sound (S3)",
    timing: "Early diastole (after S2)",
    mechanism: "Rapid passive ventricular filling into a compliant or volume-overloaded ventricle ('ventricular gallop'). Low-pitched, heard with the bell at the apex.",
    clinical: "Normal in children and young adults / pregnancy. Pathologic in older adults: heart failure, dilated cardiomyopathy, mitral regurgitation (volume overload). 'Kentucky' (S1-S2-S3).",
    colorVar: "var(--ph-curve-5)"
  },
  {
    id: "s4", shortName: "S4 gallop", fullName: "Fourth heart sound (S4)",
    timing: "Late diastole (just before S1)",
    mechanism: "Atrial contraction (kick) against a STIFF, non-compliant ventricle ('atrial gallop'). Requires organised atrial contraction.",
    clinical: "Pathologic — concentric LVH, hypertension, aortic stenosis, HOCM, ischaemia (diastolic dysfunction). NEVER heard in atrial fibrillation (no atrial kick). 'Tennessee' (S4-S1-S2).",
    colorVar: "var(--ph-curve-2)"
  }
];

export default function HeartSoundsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (SOUNDS.find((s) => s.id === searchParams.get("sound"))?.id ?? "s1") as SoundId;
  const [selectedId, setSelectedId] = useState<SoundId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sound", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("sound") as SoundId | null;
    if (next && SOUNDS.find((s) => s.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sel = SOUNDS.find((s) => s.id === selectedId)!;
  const W = 720, H = 200;
  // Phonocardiogram markers (x positions across one cycle): S1, S2 (A2/P2), S3, S4
  const showS3 = selectedId === "s3";
  const showS4 = selectedId === "s4";
  const splitGap = selectedId === "wide" ? 46 : selectedId === "fixed" ? 50 : selectedId === "paradoxical" ? 34 : selectedId === "physiologic" ? 28 : 16;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Heart sounds phonocardiogram">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{sel.fullName} · {sel.timing}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{sel.mechanism}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{sel.clinical}</span></p>
          </div>

          <svg role="img" aria-label="Phonocardiogram" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <line x1="20" y1="120" x2={W - 20} y2="120" stroke="var(--ph-axis)" strokeWidth="0.7" opacity="0.4" />
            {/* S1 */}
            <g>
              <rect x="150" y="70" width="10" height="50" rx="3" fill="var(--ph-curve-1)" />
              <text x="155" y="142" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-curve-1)">S1</text>
            </g>
            {/* S2 (A2 + P2 with split gap) */}
            <g>
              <rect x="470" y="62" width="9" height="58" rx="3" fill="var(--ph-curve-2)" />
              <rect x={470 + splitGap} y="70" width="8" height="50" rx="3" fill="var(--ph-curve-3)" />
              <text x="474" y="54" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-curve-2)">A2</text>
              <text x={474 + splitGap} y="54" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ph-curve-3)">P2</text>
              <text x={474 + splitGap / 2} y="142" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-muted)">S2</text>
            </g>
            {/* S3 */}
            {showS3 ? (<g><rect x="560" y="92" width="7" height="28" rx="2" fill="var(--ph-curve-5)" /><text x="563" y="142" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-curve-5)">S3</text></g>) : null}
            {/* S4 */}
            {showS4 ? (<g><rect x="118" y="96" width="7" height="24" rx="2" fill="var(--ph-curve-2)" /><text x="121" y="142" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-curve-2)">S4</text></g>) : null}
            <text x="312" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)">— systole —</text>
            <text x={600} y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)">diastole</text>
            {["physiologic","wide","fixed","paradoxical"].includes(selectedId) ? (
              <text x={474 + splitGap / 2} y="172" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ph-accent)">
                {selectedId === "fixed" ? "split unchanged by respiration" : selectedId === "paradoxical" ? "splits on EXPIRATION (reversed)" : "A2–P2 gap widens with inspiration"}
              </text>
            ) : null}
          </svg>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Sound selector">
            <h2 className="ph-section-label mb-4">Click a sound</h2>
            <div className="grid gap-2">
              {SOUNDS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSelectedId(s.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    s.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                  }`}>
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.colorVar }} />
                  <span className="font-bold">{s.shortName}</span>
                  <span className="truncate text-xs">{s.fullName}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((r) => <li key={`${r.source}-${r.pages}`}>{r.source}{r.pages ? `, ${r.pages}` : ""}</li>)}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
