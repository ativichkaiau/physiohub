"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "resp/west-zones";
const diagram = getDiagramById(DIAGRAM_ID);

type ZoneId = "zone1" | "zone2" | "zone3" | "apexbase";

type Zone = {
  id: ZoneId;
  shortName: string;
  fullName: string;
  relation: string;
  body: string;
  clinical: string;
  colorVar: string;
};

const ZONES: Zone[] = [
  {
    id: "zone1", shortName: "Zone 1", fullName: "Zone 1 (apex) — PA > Pa > Pv",
    relation: "Alveolar pressure > arterial > venous",
    body: "At the lung apex, gravity makes arterial pressure low; if alveolar pressure exceeds it, the capillaries are SQUASHED FLAT → no flow (alveolar dead space). Zone 1 barely exists in a healthy upright person but appears when arterial pressure falls or alveolar pressure rises.",
    clinical: "Zone 1 expands in haemorrhage / hypotension (↓Pa) and positive-pressure ventilation with high PEEP (↑PA) → wasted ventilation (dead space). Massive PE also creates dead space.",
    colorVar: "var(--ph-curve-4)"
  },
  {
    id: "zone2", shortName: "Zone 2", fullName: "Zone 2 (middle) — Pa > PA > Pv",
    relation: "Arterial > alveolar > venous",
    body: "Flow is driven by the ARTERIAL–ALVEOLAR pressure difference (not arterial–venous), because alveolar pressure pinches the venous end of the capillary (a Starling resistor / 'waterfall' effect). Flow rises down this zone as arterial pressure climbs.",
    clinical: "The classic 'waterfall' or sluice-gate zone — downstream venous pressure doesn't matter as long as it's below alveolar pressure.",
    colorVar: "var(--ph-curve-2)"
  },
  {
    id: "zone3", shortName: "Zone 3", fullName: "Zone 3 (base) — Pa > Pv > PA",
    relation: "Arterial > venous > alveolar",
    body: "At the base, gravity makes both arterial and venous pressures exceed alveolar pressure → capillaries stay fully open and flow is driven by the normal arterial–venous gradient. The highest blood flow in the lung.",
    clinical: "Recruitment and distension of capillaries here accommodate increased cardiac output (e.g., exercise) and keep pulmonary vascular resistance low.",
    colorVar: "var(--ph-curve-1)"
  },
  {
    id: "apexbase", shortName: "Apex vs base V/Q", fullName: "Apex-to-base V/Q gradient",
    relation: "Both ventilation and perfusion rise toward the base — perfusion more steeply",
    body: "Gravity increases BOTH ventilation and perfusion from apex to base, but perfusion increases MORE. So the apex has a HIGH V/Q (~3, more ventilation than perfusion — higher PO₂, lower PCO₂) and the base has a LOW V/Q (~0.6 — lower PO₂, higher PCO₂).",
    clinical: "TB favours the high-O₂ apex (obligate aerobe). Most blood flow and most gas exchange happen at the base. Apical V/Q approaches dead space; basal V/Q approaches shunt — both reduce efficiency vs an ideal V/Q of 1.",
    colorVar: "var(--ph-curve-6)"
  }
];

export default function WestZonesWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = (ZONES.find((z) => z.id === searchParams.get("zone"))?.id ?? "zone3") as ZoneId;
  const [selectedId, setSelectedId] = useState<ZoneId>(initial);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zone", selectedId);
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("zone") as ZoneId | null;
    if (next && ZONES.find((z) => z.id === next)) setSelectedId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sel = ZONES.find((z) => z.id === selectedId)!;
  const W = 360, H = 340;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="West lung zones">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{sel.fullName}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-ph-accent">{sel.relation}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{sel.body}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{sel.clinical}</span></p>
          </div>

          <svg role="img" aria-label="Lung zones" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas mx-auto h-auto w-full max-w-[420px]">
            {/* lung outline */}
            <path d="M 180 24 C 110 30 70 120 76 220 C 80 290 140 320 180 320 C 220 320 280 290 284 220 C 290 120 250 30 180 24 Z"
              fill="color-mix(in srgb, var(--ph-curve-3), transparent 88%)" stroke="var(--ph-border-strong)" strokeWidth="2" />
            <text x="300" y="40" textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)">apex ↑</text>
            <text x="300" y="312" textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ph-muted)">base ↓</text>

            {[
              { id: "zone1" as ZoneId, label: "Zone 1 · PA > Pa > Pv", y: 70 },
              { id: "zone2" as ZoneId, label: "Zone 2 · Pa > PA > Pv", y: 150 },
              { id: "zone3" as ZoneId, label: "Zone 3 · Pa > Pv > PA", y: 245 }
            ].map((z) => {
              const isSel = selectedId === z.id || (selectedId === "apexbase");
              return (
                <g key={z.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(z.id)} role="button" aria-label={z.label}>
                  <rect x="86" y={z.y - 26} width="188" height="52" rx="8"
                    fill={selectedId === z.id ? "color-mix(in srgb, var(--ph-accent), transparent 78%)" : isSel ? "color-mix(in srgb, var(--ph-accent), transparent 90%)" : "transparent"}
                    stroke={selectedId === z.id ? "var(--ph-accent)" : "var(--ph-border)"} strokeWidth={selectedId === z.id ? 2.5 : 1} />
                  <text x="180" y={z.y - 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--ph-text)">{z.label.split(" · ")[0]}</text>
                  <text x="180" y={z.y + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-muted)">{z.label.split(" · ")[1]}</text>
                </g>
              );
            })}
            {/* flow gradient arrow */}
            <text x="40" y="180" fontSize="10" fontWeight="800" fill="var(--ph-curve-1)" transform="rotate(-90 40 180)">blood flow ↑ toward base</text>
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Click each zone from apex to base of the upright lung. Gravity stacks the pressures: at the APEX (zone 1) alveolar pressure can exceed arterial and pinch the capillaries (high V/Q, wasted ventilation); at the BASE (zone 3) blood flow is highest (low V/Q). That apex-to-base V/Q gradient is why the top behaves like dead space and the bottom like shunt."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Zone selector">
            <h2 className="ph-section-label mb-4">Click a zone</h2>
            <div className="grid gap-2">
              {ZONES.map((z) => (
                <button key={z.id} type="button" onClick={() => setSelectedId(z.id)}
                  className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                    z.id === selectedId
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "ph-clay-button text-ph-muted"
                  }`}>
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: z.colorVar }} />
                  <span className="font-bold">{z.shortName}</span>
                  <span className="truncate text-xs">{z.fullName.split(" — ")[1] ?? ""}</span>
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
