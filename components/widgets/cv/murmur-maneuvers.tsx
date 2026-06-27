"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Slider } from "@/components/widgets/primitives";
import { clamp, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/murmur-maneuvers";
const diagram = getDiagramById(DIAGRAM_ID);

/**
 * Bedside maneuvers change preload and afterload; murmur intensity follows.
 * Most murmurs get LOUDER with more flow across the lesion. The two
 * exceptions are HCM and MVP, which get louder with LESS LV volume.
 *
 * preload, afterload sliders are % of normal (50–150). Each murmur's
 * intensity is a function of LV filling and outflow load.
 */
type Murmur = { key: string; name: string; intensity: (preload: number, afterload: number) => number; note: string };

const MURMURS: Murmur[] = [
  {
    key: "as", name: "Aortic stenosis",
    intensity: (pre) => 40 + (pre - 100) * 0.5, // more preload → more flow → louder
    note: "Flow murmur: louder with ↑preload (more SV across the valve). Softer with Valsalva."
  },
  {
    key: "mr", name: "Mitral regurgitation",
    intensity: (pre, aft) => 40 + (aft - 100) * 0.6 + (pre - 100) * 0.2, // afterload drives regurgitant fraction
    note: "Louder with ↑afterload (handgrip) — more blood takes the low-resistance path back into the LA."
  },
  {
    key: "ar", name: "Aortic regurgitation",
    intensity: (pre, aft) => 40 + (aft - 100) * 0.6, // afterload increases regurgitation
    note: "Louder with ↑afterload (handgrip, squatting) — raises the diastolic regurgitant gradient."
  },
  {
    key: "vsd", name: "Ventricular septal defect",
    intensity: (pre, aft) => 40 + (aft - 100) * 0.6,
    note: "Louder with ↑afterload — more left-to-right shunting across the defect."
  },
  {
    key: "hcm", name: "HCM (dynamic LVOT)",
    intensity: (pre, aft) => 40 - (pre - 100) * 0.7 - (aft - 100) * 0.4, // LESS volume → more obstruction → louder
    note: "EXCEPTION: louder with ↓LV volume (Valsalva strain, standing) — the outflow tract narrows. Softer with squatting/handgrip."
  },
  {
    key: "mvp", name: "Mitral valve prolapse",
    intensity: (pre) => 40 - (pre - 100) * 0.7, // less volume → earlier click, longer/louder murmur
    note: "EXCEPTION: ↓LV volume (Valsalva, standing) → earlier click + longer murmur. Squatting delays the click."
  }
];

function maneuverName(preload: number, afterload: number) {
  if (preload < 70 && afterload < 95) return "Valsalva strain / standing (↓preload)";
  if (preload > 120 && afterload > 115) return "Squatting (↑preload + ↑afterload)";
  if (afterload > 125) return "Handgrip (↑afterload)";
  if (preload > 130) return "Passive leg raise (↑preload)";
  if (preload < 80) return "Standing (↓preload)";
  return "Resting hemodynamics";
}

export default function MurmurManeuversWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [preload, setPreload] = useState(() => parseNumber(searchParams.get("preload"), 100, 50, 150));
  const [afterload, setAfterload] = useState(() => parseNumber(searchParams.get("afterload"), 100, 50, 150));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("preload", String(Math.round(preload)));
    params.set("afterload", String(Math.round(afterload)));
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [preload, afterload, pathname, router, searchParams]);

  const maneuver = maneuverName(preload, afterload);
  const rows = MURMURS.map((m) => ({ ...m, value: clamp(m.intensity(preload, afterload), 5, 95) }));

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Murmur intensity by maneuver">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{maneuver}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Most murmurs get LOUDER with more flow across the lesion. The classic exceptions are HCM and MVP, which get LOUDER with LESS LV volume (Valsalva strain, standing). Squatting and handgrip raise LV volume/afterload and do the opposite — the bedside trick to separate HCM/MVP from aortic stenosis.
            </p>
          </div>

          <div className="grid gap-3">
            {rows.map((r) => {
              const isException = r.key === "hcm" || r.key === "mvp";
              return (
                <div key={r.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-ph-text">{r.name}{isException ? " ★" : ""}</span>
                    <span className="ph-readout tabular-nums">{r.value.toFixed(0)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full ph-clay-track">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, background: isException ? "var(--ph-curve-4)" : "var(--ph-curve-1)" }} />
                  </div>
                  <p className="mt-1 text-xs text-ph-muted">{r.note}</p>
                </div>
              );
            })}
            <p className="text-xs text-ph-muted">★ = louder with reduced LV volume (HCM, MVP)</p>
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Maneuver levers</h2>
            <div className="grid gap-4">
              <Slider label="Preload (LV filling)" value={preload} min={50} max={150} step={1} unit="%" defaultValue={100} onChange={setPreload} />
              <Slider label="Afterload (SVR)" value={afterload} min={50} max={150} step={1} unit="%" defaultValue={100} onChange={setAfterload} />
            </div>
            <p className="mt-3 text-xs text-ph-muted">Valsalva strain & standing ↓preload. Squatting ↑preload + ↑afterload. Handgrip ↑afterload. Leg raise ↑preload.</p>
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
