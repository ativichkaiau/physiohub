"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";
import { StepWalker } from "@/components/widgets/common/StepWalker";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";

const DIAGRAM_ID = "cv/fetal-circulation-transition";
const diagram = getDiagramById(DIAGRAM_ID);

type StageId = "fetal" | "first-breath" | "da-closing" | "adult";

type ShuntState = "active" | "closed";
type ShuntDirection = "RtoL" | "LtoR" | "none";

type Stage = {
  id: StageId;
  shortName: string;
  fullName: string;
  highlight: string;
  body: string;
  pressures: {
    ra: number; rv: number; pa: number;
    la: number; lv: number; aorta: number;
  };
  fo: { state: ShuntState; direction: ShuntDirection };
  da: { state: ShuntState; direction: ShuntDirection };
  dv: { state: ShuntState };
  placentaVisible: boolean;
  keyTransitions: string;
};

const STAGES: Stage[] = [
  {
    id: "fetal",
    shortName: "Fetal",
    fullName: "Fetal circulation (in utero)",
    highlight: "All three fetal shunts active",
    body: "The placenta is the gas exchanger. Oxygenated blood from the umbilical vein bypasses the liver via the ductus venosus, joins the IVC, and crosses the foramen ovale to the left atrium so the brain gets the best-oxygenated blood. Lungs are collapsed and pulmonary vascular resistance is very high — RV output takes the right-to-left path through the ductus arteriosus into the descending aorta.",
    pressures: { ra: 5, rv: 70, pa: 70, la: 4, lv: 65, aorta: 65 },
    fo: { state: "active", direction: "RtoL" },
    da: { state: "active", direction: "RtoL" },
    dv: { state: "active" },
    placentaVisible: true,
    keyTransitions: "PVR very high; SVR (placenta) very low. RV pressure ≈ LV pressure. Brain gets oxygenated blood via FO → LV → ascending aorta."
  },
  {
    id: "first-breath",
    shortName: "First breath",
    fullName: "First breath — lungs expand",
    highlight: "FO functionally closed · DA still patent",
    body: "Lung expansion plus rising arterial O₂ trigger pulmonary vasodilation; PVR falls roughly 5-fold within minutes. Pulmonary venous return to the LA surges, so LA pressure rises above RA. The flap-like foramen ovale presses shut — functional closure. Umbilical cord clamping removes the placenta from the circuit; the ductus venosus loses its driving flow.",
    pressures: { ra: 4, rv: 25, pa: 25, la: 8, lv: 75, aorta: 75 },
    fo: { state: "closed", direction: "none" },
    da: { state: "active", direction: "LtoR" },
    dv: { state: "closed" },
    placentaVisible: false,
    keyTransitions: "PVR falls 5× within minutes; SVR rises after cord clamp; LA > RA pressure closes FO; DA flow reverses (now Ao → PA)."
  },
  {
    id: "da-closing",
    shortName: "DA closing",
    fullName: "Ductus arteriosus closing",
    highlight: "DA functionally closed",
    body: "Rising arterial O₂ inhibits prostaglandin E₂ and constricts the ductus smooth muscle. Functional closure follows within 24–48 hours of birth; anatomic obliteration (ligamentum arteriosum) takes several weeks. With both shunts shut down, the circulation is now adult-pattern: pulmonary in series with systemic.",
    pressures: { ra: 4, rv: 22, pa: 22, la: 8, lv: 100, aorta: 100 },
    fo: { state: "closed", direction: "none" },
    da: { state: "closed", direction: "none" },
    dv: { state: "closed" },
    placentaVisible: false,
    keyTransitions: "↑PaO₂ constricts DA smooth muscle; ↓PGE₂ removes the patent stimulus; series circulation established."
  },
  {
    id: "adult",
    shortName: "Adult",
    fullName: "Adult-pattern circulation",
    highlight: "All shunts permanently closed",
    body: "All fetal shunts are now anatomic remnants: foramen ovale → fossa ovalis, ductus arteriosus → ligamentum arteriosum, ductus venosus → ligamentum venosum, umbilical vein → ligamentum teres. The right and left circulations run in series with no mixing.",
    pressures: { ra: 4, rv: 25, pa: 25, la: 8, lv: 120, aorta: 120 },
    fo: { state: "closed", direction: "none" },
    da: { state: "closed", direction: "none" },
    dv: { state: "closed" },
    placentaVisible: false,
    keyTransitions: "Pediatric LV pressure approaches adult ≈ 120 mmHg over months. Persistent patency → PDA (DA), ASD (FO), or — entirely separately — VSD."
  }
];

function colorActive(state: ShuntState) {
  return state === "active" ? "var(--ph-curve-1)" : "color-mix(in srgb, var(--ph-axis), transparent 65%)";
}

export default function FetalCirculationTransitionWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const initialId = (STAGES.find((s) => s.id === searchParams.get("stage"))?.id ?? "fetal") as StageId;
  const [selectedId, setSelectedId] = useState<StageId>(initialId);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    params.set("stage", selectedId);
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [currentQuery, pathname, router, selectedId]);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    const next = params.get("stage") as StageId | null;
    if (!next || !STAGES.find((s) => s.id === next)) return;
    setSelectedId((current) => (next === current ? current : next));
  }, [currentQuery]);

  const selected = STAGES.find((s) => s.id === selectedId)!;

  // SVG layout
  const W = 700;
  const H = 500;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${selected.fullName} schematic`}>
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{selected.fullName} — {selected.highlight}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{selected.body}</p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-ph-text">Key transitions:</span>{" "}
              <span className="text-ph-muted">{selected.keyTransitions}</span>
            </p>
          </div>

          <svg
            role="img"
            aria-label={`${selected.fullName} circulation schematic`}
            viewBox={`0 0 ${W} ${H}`}
            className="ph-pathway-canvas h-auto w-full"
          >
            <defs>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ph-curve-1)" />
              </marker>
              <marker id="arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="color-mix(in srgb, var(--ph-axis), transparent 55%)" />
              </marker>
            </defs>

            {/* Lungs */}
            <g>
              <rect x="270" y="20" width="160" height="55" rx="10"
                fill="color-mix(in srgb, var(--ph-curve-3), transparent 88%)"
                stroke="color-mix(in srgb, var(--ph-curve-3), transparent 50%)" strokeWidth="1.5" />
              <text x="350" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ph-text)">LUNGS</text>
              <text x="350" y="62" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">
                {selected.id === "fetal" ? "high PVR · collapsed" : "low PVR · expanded"}
              </text>
            </g>

            {/* Chambers — RA, LA on top row; RV, LV below */}
            <g>
              {/* RA */}
              <rect x="80" y="130" width="150" height="80" rx="10" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.5" />
              <text x="155" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-text)">RIGHT ATRIUM</text>
              <text x="155" y="183" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {selected.pressures.ra}
              </text>
              <text x="155" y="200" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">mmHg</text>

              {/* LA */}
              <rect x="470" y="130" width="150" height="80" rx="10" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.5" />
              <text x="545" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-text)">LEFT ATRIUM</text>
              <text x="545" y="183" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {selected.pressures.la}
              </text>
              <text x="545" y="200" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">mmHg</text>

              {/* RV */}
              <rect x="80" y="240" width="150" height="80" rx="10" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.5" />
              <text x="155" y="265" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-text)">RIGHT VENTRICLE</text>
              <text x="155" y="293" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {selected.pressures.rv}
              </text>
              <text x="155" y="310" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">mmHg</text>

              {/* LV */}
              <rect x="470" y="240" width="150" height="80" rx="10" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.5" />
              <text x="545" y="265" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-text)">LEFT VENTRICLE</text>
              <text x="545" y="293" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>
                {selected.pressures.lv}
              </text>
              <text x="545" y="310" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">mmHg</text>

              {/* PA */}
              <rect x="100" y="350" width="110" height="50" rx="8" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.2" />
              <text x="155" y="370" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-text)">PA</text>
              <text x="155" y="389" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>{selected.pressures.pa}</text>

              {/* Aorta */}
              <rect x="490" y="350" width="110" height="50" rx="8" fill="var(--ph-surface)" stroke="var(--ph-axis)" strokeWidth="1.2" />
              <text x="545" y="370" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ph-text)">AORTA</text>
              <text x="545" y="389" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-curve-1)" style={{ fontVariantNumeric: "tabular-nums" }}>{selected.pressures.aorta}</text>
            </g>

            {/* Series circulation arrows (always present in the active stage) */}
            <g stroke="var(--ph-curve-1)" strokeWidth="2" fill="none" markerEnd="url(#arrow-active)">
              <line x1="155" y1="210" x2="155" y2="237" />
              <line x1="545" y1="210" x2="545" y2="237" />
              <line x1="155" y1="320" x2="155" y2="347" />
              <line x1="545" y1="320" x2="545" y2="347" />
            </g>

            {/* PA → Lungs and Lungs → LA, modulated by lungs-active stage */}
            <g
              stroke={selected.id === "fetal" ? "color-mix(in srgb, var(--ph-axis), transparent 60%)" : "var(--ph-curve-1)"}
              strokeWidth="2"
              fill="none"
              markerEnd={selected.id === "fetal" ? "url(#arrow-muted)" : "url(#arrow-active)"}
            >
              <path d="M 155 350 C 200 280 240 100 305 75" />
              <path d="M 395 75 C 460 100 500 280 545 350" />
            </g>

            {/* Foramen Ovale — between RA and LA */}
            <g>
              <line
                x1="230"
                y1="170"
                x2="470"
                y2="170"
                stroke={colorActive(selected.fo.state)}
                strokeDasharray={selected.fo.state === "closed" ? "5 5" : undefined}
                strokeWidth="2.5"
                markerEnd={selected.fo.state === "active" && selected.fo.direction === "RtoL" ? "url(#arrow-active)" : undefined}
                markerStart={selected.fo.state === "active" && selected.fo.direction === "LtoR" ? "url(#arrow-active)" : undefined}
              />
              <text
                x="350"
                y="162"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={selected.fo.state === "active" ? "var(--ph-curve-1)" : "var(--ph-muted)"}
              >
                FORAMEN OVALE
              </text>
              <text x="350" y="187" textAnchor="middle" fontSize="9" fill="var(--ph-muted)">
                {selected.fo.state === "active" ? (selected.fo.direction === "RtoL" ? "R → L flow" : "L → R flow") : "closed"}
              </text>
            </g>

            {/* Ductus Arteriosus — between PA and Aorta */}
            <g>
              <line
                x1="210"
                y1="375"
                x2="490"
                y2="375"
                stroke={colorActive(selected.da.state)}
                strokeDasharray={selected.da.state === "closed" ? "5 5" : undefined}
                strokeWidth="2.5"
                markerEnd={selected.da.state === "active" && selected.da.direction === "RtoL" ? "url(#arrow-active)" : undefined}
                markerStart={selected.da.state === "active" && selected.da.direction === "LtoR" ? "url(#arrow-active)" : undefined}
              />
              <text
                x="350"
                y="367"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={selected.da.state === "active" ? "var(--ph-curve-1)" : "var(--ph-muted)"}
              >
                DUCTUS ARTERIOSUS
              </text>
              <text x="350" y="392" textAnchor="middle" fontSize="9" fill="var(--ph-muted)">
                {selected.da.state === "active" ? (selected.da.direction === "RtoL" ? "PA → Ao (R→L)" : "Ao → PA (L→R)") : "closed → lig. arteriosum"}
              </text>
            </g>

            {/* Placenta + ductus venosus — only when active */}
            {selected.placentaVisible ? (
              <g>
                <rect x="220" y="440" width="260" height="45" rx="10"
                  fill="color-mix(in srgb, var(--ph-curve-2), transparent 86%)"
                  stroke="color-mix(in srgb, var(--ph-curve-2), transparent 50%)" strokeWidth="1.5" />
                <text x="350" y="462" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ph-text)">PLACENTA</text>
                <text x="350" y="478" textAnchor="middle" fontSize="10" fill="var(--ph-muted)">
                  gas exchange · ductus venosus → IVC
                </text>
                <path
                  d="M 240 440 C 200 410 100 280 120 215"
                  stroke="var(--ph-curve-2)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrow-active)"
                  strokeLinecap="round"
                />
                <text
                  x="60"
                  y="350"
                  fontSize="10"
                  fontWeight="700"
                  fill="var(--ph-curve-2)"
                  transform="rotate(-12 60 350)"
                >
                  DV → IVC
                </text>
              </g>
            ) : null}
          </svg>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">Reading the trace · </span>
            <Highlighted text={"Click through the switch from placenta to lungs. In utero, oxygen-rich blood bypasses the lungs through the ductus venosus, foramen ovale, and ductus arteriosus. The first breath drops pulmonary resistance and raises left-heart pressure, which reverses flow and snaps the shunts shut — follow each pressure reversal."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <StepWalker
            label="Step through the transition"
            steps={STAGES}
            value={selectedId}
            onChange={(id) => setSelectedId(id as StageId)}
          />

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
