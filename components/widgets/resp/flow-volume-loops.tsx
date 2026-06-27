"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, type CurvePoint } from "@/components/widgets/primitives";

const DIAGRAM_ID = "resp/flow-volume-loops";
const diagram = getDiagramById(DIAGRAM_ID);

type PatternId = "normal" | "obstructive" | "restrictive" | "fixed" | "extrathoracic" | "intrathoracic";

type Pattern = {
  id: PatternId;
  shortName: string;
  fullName: string;
  body: string;
  clinical: string;
  colorVar: string;
  loop: CurvePoint[]; // [volume L, flow L/s]; expiration positive, inspiration negative
};

const N = (pts: Array<[number, number]>): CurvePoint[] => pts.map(([x, y]) => ({ x, y }));

const PATTERNS: Pattern[] = [
  {
    id: "normal", shortName: "Normal", fullName: "Normal flow–volume loop", colorVar: "var(--ph-curve-1)",
    body: "Forced expiration rockets to a peak flow early, then declines linearly to residual volume (the effort-INDEPENDENT portion is set by airway calibre and elastic recoil). The inspiratory limb is a smooth symmetric dome.",
    clinical: "TLC ~6 L, RV ~1.2 L. The reference shape against which obstructive and restrictive patterns are judged.",
    loop: N([[6, 0], [5.5, 9], [4, 6.5], [2.5, 3.8], [1.2, 0], [2.5, -4.8], [4, -5.2], [5.5, -4], [6, 0]])
  },
  {
    id: "obstructive", shortName: "Obstructive", fullName: "Obstructive (COPD / asthma)", colorVar: "var(--ph-curve-4)",
    body: "Hyperinflation shifts the whole loop to higher volumes (↑TLC, ↑RV). Peak flow is reduced and the expiratory limb is SCOOPED / coved (concave upward) from early airway collapse. ↓FEV1/FVC ratio.",
    clinical: "Air trapping raises RV. Asthma is reversible with bronchodilator; COPD is not (or only partially). The scooped expiratory limb is the signature.",
    loop: N([[7.6, 0], [7, 5], [6, 3], [5, 1.9], [4, 1.1], [3, 0], [4.2, -4], [5.5, -4.3], [6.8, -3.2], [7.6, 0]])
  },
  {
    id: "restrictive", shortName: "Restrictive", fullName: "Restrictive (fibrosis)", colorVar: "var(--ph-curve-6)",
    body: "Small, narrow loop shifted to LOW volumes (↓TLC, ↓RV). Flows are preserved or even high for the reduced volume → a tall, narrow 'witch's hat'. FEV1/FVC ratio is normal or increased.",
    clinical: "Pulmonary fibrosis, sarcoid, chest-wall disease, neuromuscular weakness. The key is reduced TOTAL lung capacity with a preserved ratio.",
    loop: N([[4, 0], [3.7, 7], [3, 5], [2, 3], [1, 0], [2, -5], [3, -5.2], [3.7, -3.5], [4, 0]])
  },
  {
    id: "fixed", shortName: "Fixed obstruction", fullName: "Fixed upper-airway obstruction", colorVar: "var(--ph-curve-7)",
    body: "A rigid narrowing (does not change with the respiratory cycle) caps flow on BOTH limbs → a plateau on inspiration AND expiration (a 'box' loop).",
    clinical: "Tracheal stenosis, a large goitre, a fixed tumour. Plateau on both limbs = fixed lesion.",
    loop: N([[6, 0], [5.5, 3.4], [4, 3.4], [2.5, 3.4], [1.2, 0], [2.5, -3.4], [4, -3.4], [5.5, -3.4], [6, 0]])
  },
  {
    id: "extrathoracic", shortName: "Var. extrathoracic", fullName: "Variable EXTRAthoracic obstruction", colorVar: "var(--ph-curve-2)",
    body: "A lesion outside the thorax (vocal cord paralysis, laryngeal lesion). On INSPIRATION the negative airway pressure sucks the lesion closed → flattened INSPIRATORY limb. Expiration is normal.",
    clinical: "Flattened inspiratory limb = variable extrathoracic. Think vocal-cord dysfunction or supraglottic lesions.",
    loop: N([[6, 0], [5.5, 9], [4, 6.5], [2.5, 3.8], [1.2, 0], [2.5, -2.5], [4, -2.5], [5.5, -2.5], [6, 0]])
  },
  {
    id: "intrathoracic", shortName: "Var. intrathoracic", fullName: "Variable INTRAthoracic obstruction", colorVar: "var(--ph-curve-3)",
    body: "A lesion inside the thorax (tracheomalacia, intrathoracic mass). On EXPIRATION the rising pleural pressure compresses the airway → flattened EXPIRATORY limb. Inspiration is normal.",
    clinical: "Flattened expiratory limb (but a sharper peak than COPD) = variable intrathoracic obstruction.",
    loop: N([[6, 0], [5.5, 3], [4, 3], [2.5, 3], [1.2, 0], [2.5, -4.8], [4, -5.2], [5.5, -4], [6, 0]])
  }
];

export default function FlowVolumeLoopsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (PATTERNS.find((p) => p.id === searchParams.get("pattern"))?.id ?? "normal") as PatternId;
  const [selectedId, setSelectedId] = useState<PatternId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pattern", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("pattern") as PatternId | null;
    if (next && PATTERNS.find((p) => p.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sel = PATTERNS.find((p) => p.id === selectedId)!;
  const normal = PATTERNS[0];
  const series = useMemo(() => [{ id: "current", label: sel.fullName, data: sel.loop, colorVar: sel.colorVar, strokeWidth: 3 }], [sel]);
  const referenceSeries = selectedId === "normal" ? [] : [{ id: "normal", label: "Normal", data: normal.loop, colorVar: "var(--ph-curve-ref)", dashed: true }];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${sel.fullName} flow-volume loop`}>
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{sel.fullName}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{sel.body}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{sel.clinical}</span></p>
          </div>
          <Curve
            title="Flow–volume loop (expiration ↑, inspiration ↓)"
            xDomain={[0, 8]}
            yDomain={[-7, 10]}
            xLabel="Volume (L)"
            yLabel="Flow (L/s)"
            series={series}
            referenceSeries={referenceSeries}
            annotations={[
              { x: sel.loop[1].x, y: sel.loop[1].y, label: "peak expiratory flow" },
              { x: 0.6, y: -6, label: "inspiration" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Pattern selector">
            <h2 className="ph-section-label mb-4">Choose a pattern</h2>
            <div className="grid gap-2">
              {PATTERNS.map((p) => (
                <button key={p.id} type="button" onClick={() => setSelectedId(p.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    p.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}>
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.colorVar }} />
                  <span className="font-bold">{p.shortName}</span>
                  <span className="truncate text-xs">{p.fullName}</span>
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
