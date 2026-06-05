"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, type CurvePoint } from "@/components/widgets/primitives";

const DIAGRAM_ID = "cv/valvular-lesions";
const diagram = getDiagramById(DIAGRAM_ID);

type LesionId = "normal" | "AS" | "AR" | "MS" | "MR";

type Lesion = {
  id: LesionId;
  shortName: string;
  fullName: string;
  edv: number;
  esv: number;
  peakP: number;
  aorticDiastolic: number;
  endSystolicP: number;
  endDiastolicP: number;
  hasIVC: boolean;
  hasIVR: boolean;
  murmur: string;
  timing: string;
  location: string;
  hemodynamics: string;
  body: string;
};

const LESIONS: Lesion[] = [
  {
    id: "normal",
    shortName: "Normal",
    fullName: "Normal valves",
    edv: 120, esv: 50, peakP: 120, aorticDiastolic: 80, endSystolicP: 90, endDiastolicP: 7,
    hasIVC: true, hasIVR: true,
    murmur: "—",
    timing: "—",
    location: "—",
    hemodynamics: "EDV 120, ESV 50, SV 70 mL, EF ≈ 58%, both isovolumic phases present.",
    body: "Healthy reference loop. Mitral and aortic valves close at clear corners; the loop has both vertical isovolumic phases."
  },
  {
    id: "AS",
    shortName: "AS",
    fullName: "Aortic stenosis",
    edv: 120, esv: 60, peakP: 200, aorticDiastolic: 75, endSystolicP: 150, endDiastolicP: 16,
    hasIVC: true, hasIVR: true,
    murmur: "Crescendo–decrescendo systolic ejection murmur",
    timing: "Systolic, peaks mid-systole",
    location: "Right 2nd intercostal space; radiates to carotids",
    hemodynamics: "Fixed outflow obstruction → LV must generate very high pressure to eject. Chronic pressure overload → concentric hypertrophy → ↑ LVEDP.",
    body: "Aortic stenosis: peak LV pressure rises far above aortic. The loop becomes tall and narrow; the LV–aorta gradient (peak − aortic) is the hallmark."
  },
  {
    id: "AR",
    shortName: "AR",
    fullName: "Aortic regurgitation",
    edv: 200, esv: 80, peakP: 140, aorticDiastolic: 45, endSystolicP: 95, endDiastolicP: 14,
    hasIVC: false, hasIVR: true,
    murmur: "Early decrescendo diastolic blowing murmur",
    timing: "Early diastolic",
    location: "Left lower sternal border, leaning forward",
    hemodynamics: "Diastolic backflow → LV volume overload → eccentric hypertrophy → large EDV. Wide pulse pressure: low aortic diastolic + bounding systolic.",
    body: "Aortic regurgitation: the aortic valve never fully closes, so the LV refills via both the mitral valve and the incompetent AV — no true isovolumic contraction phase."
  },
  {
    id: "MS",
    shortName: "MS",
    fullName: "Mitral stenosis",
    edv: 80, esv: 40, peakP: 115, aorticDiastolic: 80, endSystolicP: 90, endDiastolicP: 5,
    hasIVC: true, hasIVR: true,
    murmur: "Mid-diastolic low-pitched rumble after opening snap",
    timing: "Diastolic (after S2 + OS)",
    location: "Apex, left lateral decubitus, bell of stethoscope",
    hemodynamics: "Narrowed MV → impaired LV filling → small EDV → small forward SV. LA pressure ↑ → atrial fibrillation, pulmonary congestion.",
    body: "Mitral stenosis: the LV is chronically underfilled, so the loop is small. The dramatic finding is on the LA / pulmonary side (high LA pressure) — the LV loop itself just shrinks."
  },
  {
    id: "MR",
    shortName: "MR",
    fullName: "Mitral regurgitation",
    edv: 170, esv: 50, peakP: 110, aorticDiastolic: 80, endSystolicP: 95, endDiastolicP: 11,
    hasIVC: false, hasIVR: true,
    murmur: "Holosystolic blowing murmur",
    timing: "Holosystolic",
    location: "Apex, radiates to axilla",
    hemodynamics: "Systolic backflow into LA → effective afterload ↓, total SV ↑ but forward SV ↓. Chronic volume overload → eccentric hypertrophy.",
    body: "Mitral regurgitation: the MV leaks during systole, so as soon as LV pressure exceeds LA pressure, ejection into the LA already begins — no isovolumic contraction phase."
  }
];

function edpvrAt(volume: number) {
  return Math.max(3, 4 + Math.pow(volume - 90, 2) / 380);
}

function loopPoints(lesion: Lesion): CurvePoint[] {
  const { edv, esv, peakP, aorticDiastolic, endSystolicP, endDiastolicP, hasIVC, hasIVR } = lesion;
  const filling: CurvePoint[] = [];
  const fillingSteps = 4;
  for (let i = 1; i <= fillingSteps; i += 1) {
    const v = esv + ((edv - esv) * i) / fillingSteps;
    filling.push({ x: v, y: edpvrAt(v) });
  }
  const startP = hasIVR ? edpvrAt(esv) : endDiastolicP * 0.6;
  const topRightP = hasIVC ? aorticDiastolic : peakP * 0.55;
  return [
    { x: esv, y: startP },
    ...filling,
    { x: edv, y: endDiastolicP },
    { x: edv, y: topRightP },
    { x: edv - (edv - esv) * 0.2, y: peakP },
    { x: edv - (edv - esv) * 0.55, y: peakP },
    { x: esv + (edv - esv) * 0.18, y: peakP * 0.94 },
    { x: esv, y: endSystolicP },
    { x: esv, y: startP }
  ];
}

export default function ValvularLesionsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialId = (LESIONS.find((l) => l.id === searchParams.get("lesion"))?.id ?? "normal") as LesionId;
  const [selectedId, setSelectedId] = useState<LesionId>(initialId);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesion", selectedId);
    const nextQuery = params.toString();
    if (nextQuery === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [selectedId, pathname, router, searchParams]);

  useEffect(() => {
    const next = searchParams.get("lesion") as LesionId | null;
    if (next && LESIONS.find((l) => l.id === next) && next !== selectedId) {
      setSelectedId(next);
    }
  }, [searchParams, selectedId]);

  const selected = LESIONS.find((l) => l.id === selectedId)!;
  const normal = LESIONS[0];

  const series = useMemo(
    () => [{ id: "current", label: selected.fullName, data: loopPoints(selected), colorVar: "var(--ph-curve-1)" }],
    [selected]
  );
  const referenceSeries = useMemo(
    () =>
      selected.id === "normal"
        ? []
        : [{ id: "normal", label: "Normal", data: loopPoints(normal), colorVar: "var(--ph-curve-ref)", dashed: true }],
    [selected, normal]
  );

  const sv = selected.edv - selected.esv;
  const ef = selected.edv > 0 ? (sv / selected.edv) * 100 : 0;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label={`${selected.fullName} pressure-volume loop`}>
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{selected.fullName}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{selected.body}</p>
            {selected.id !== "normal" ? (
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="font-bold text-ph-text">Murmur:</span> <span className="text-ph-muted">{selected.murmur}</span></p>
                <p><span className="font-bold text-ph-text">Timing:</span> <span className="text-ph-muted">{selected.timing}</span></p>
                <p className="sm:col-span-2"><span className="font-bold text-ph-text">Best heard:</span> <span className="text-ph-muted">{selected.location}</span></p>
                <p className="sm:col-span-2"><span className="font-bold text-ph-text">Hemodynamics:</span> <span className="text-ph-muted">{selected.hemodynamics}</span></p>
              </div>
            ) : null}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">EDV {selected.edv} mL</span>
            <span className="ph-readout">ESV {selected.esv} mL</span>
            <span className="ph-readout">SV {sv} mL</span>
            <span className="ph-readout">EF {ef.toFixed(0)}%</span>
            <span className="ph-readout">Peak {selected.peakP} mmHg</span>
            <span className="ph-readout">LVEDP {selected.endDiastolicP} mmHg</span>
          </div>

          <Curve
            title={`Left ventricular PV loop — ${selected.fullName}`}
            xDomain={[20, 230]}
            yDomain={[0, 220]}
            xLabel="Volume (mL)"
            yLabel="Pressure (mmHg)"
            series={series}
            referenceSeries={referenceSeries}
            annotations={[
              { x: selected.edv, y: selected.endDiastolicP, label: "MV closes" },
              { x: selected.esv, y: selected.endSystolicP, label: "AV closes" }
            ]}
            height={420}
          />
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Lesion selector">
            <h2 className="ph-section-label mb-4">Step through lesions</h2>
            <div className="grid gap-2">
              {LESIONS.map((lesion) => {
                const isSelected = lesion.id === selectedId;
                return (
                  <button
                    key={lesion.id}
                    type="button"
                    onClick={() => setSelectedId(lesion.id)}
                    className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                    }`}
                  >
                    <span className="font-bold">{lesion.shortName}</span>
                    <span className="ml-2 text-xs">{lesion.fullName}</span>
                  </button>
                );
              })}
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
