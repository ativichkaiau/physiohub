"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

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
  // Signature colour per lesion — pressure overload (AS) crimson, volume
  // overload (AR) purple, filling failure (MS) amber, regurgitation (MR) teal.
  colorVar: string;
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
    colorVar: "var(--ph-curve-1)",
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
    fullName: "Aortic stenosis (severe, AVA < 1 cm²)",
    colorVar: "var(--ph-curve-4)",
    edv: 120, esv: 60, peakP: 200, aorticDiastolic: 75, endSystolicP: 150, endDiastolicP: 16,
    hasIVC: true, hasIVR: true,
    murmur: "Crescendo–decrescendo systolic ejection murmur — late peak in severe disease",
    timing: "Systolic; late peak + soft/absent A2 = severe (paradoxical splitting)",
    location: "Right 2nd intercostal space; radiates to carotids (delayed, attenuated pulse — pulsus parvus et tardus)",
    hemodynamics: "AHA grading: mild gradient < 20 mmHg / AVA > 1.5 cm²; moderate 20–40 / 1.0–1.5; SEVERE > 40 mmHg / AVA < 1.0 cm² / Vmax > 4 m/s. Triad: angina, syncope, HF — once symptomatic, median survival 2–5 years without AVR / TAVR.",
    body: "Aortic stenosis: fixed outflow obstruction → peak LV pressure rises far above aortic. The loop becomes tall and narrow; the trans-valvular gradient (peak LV − peak aortic) IS the lesion. Chronic pressure overload drives concentric LVH → ↑ LVEDP → exertional dyspnoea."
  },
  {
    id: "AR",
    shortName: "AR",
    fullName: "Aortic regurgitation (chronic severe)",
    colorVar: "var(--ph-curve-3)",
    edv: 200, esv: 80, peakP: 140, aorticDiastolic: 45, endSystolicP: 95, endDiastolicP: 14,
    hasIVC: false, hasIVR: true,
    murmur: "Early decrescendo diastolic blowing murmur; Austin Flint mid-diastolic rumble if severe",
    timing: "Early diastolic — best at end-expiration, sitting forward",
    location: "Left lower sternal border (Erb's point); aetiology-specific signs (Corrigan's pulse, de Musset's head bobbing, Quincke's nail pulsations)",
    hemodynamics: "Severity by regurgitant volume: mild < 30 mL/beat; moderate 30–60; severe > 60 mL. Wide pulse pressure (often > 80 mmHg) and water-hammer pulse are bedside hallmarks. Chronic AR → eccentric LV dilation; acute AR (endocarditis, dissection) → catastrophic LVEDP rise, flash pulmonary edema.",
    body: "Aortic regurgitation: the AV doesn't close, so the LV continues to fill from the aorta during diastole. There is no true isovolumic contraction — LV pressure starts rising against ongoing AV leak. Chronic volume overload → massive EDV (LV can reach 400+ mL)."
  },
  {
    id: "MS",
    shortName: "MS",
    fullName: "Mitral stenosis (severe, MVA < 1.5 cm²)",
    colorVar: "var(--ph-curve-2)",
    edv: 80, esv: 40, peakP: 115, aorticDiastolic: 80, endSystolicP: 90, endDiastolicP: 5,
    hasIVC: true, hasIVR: true,
    murmur: "Mid-diastolic low-pitched rumble with opening snap; loud S1 if mobile valve",
    timing: "Diastolic — after S2 → OS → rumble (shorter S2-OS interval = more severe)",
    location: "Apex, left lateral decubitus, bell of stethoscope",
    hemodynamics: "Severity by valve area: mild MVA > 1.5 cm²; moderate 1.0–1.5; SEVERE < 1.0 cm² (with mean gradient > 10 mmHg). Almost always rheumatic. Sequelae: ↑ LA pressure → AF (30%), pulmonary HTN, RV failure, systemic thromboembolism.",
    body: "Mitral stenosis: a narrowed MV chronically underfills the LV → small EDV, small forward SV. The LV loop just shrinks; the dramatic findings are upstream (LA dilation, pulmonary congestion, AF). Pregnancy or tachycardia (less diastolic filling time) unmasks symptoms."
  },
  {
    id: "MR",
    shortName: "MR",
    fullName: "Mitral regurgitation (chronic severe)",
    colorVar: "var(--ph-curve-5)",
    edv: 170, esv: 50, peakP: 110, aorticDiastolic: 80, endSystolicP: 95, endDiastolicP: 11,
    hasIVC: false, hasIVR: true,
    murmur: "Holosystolic blowing murmur; S3 gallop with severe regurgitant volume",
    timing: "Holosystolic — begins with S1, extends through A2",
    location: "Apex, radiates to axilla (posterior leaflet) or back (anterior leaflet prolapse)",
    hemodynamics: "Severity by regurgitant fraction: mild < 30%; moderate 30–49%; SEVERE ≥ 50% (or effective regurgitant orifice ≥ 0.40 cm²). Reduced effective afterload (LA is a low-pressure 'pop-off') → LV emptying is initially preserved. Eventual eccentric LV dilation + LA volume overload → AF and pulmonary HTN.",
    body: "Mitral regurgitation: the MV leaks during systole. As LV pressure exceeds LA pressure, ejection into the LA begins immediately — no isovolumic contraction phase. Forward SV may be normal early (total SV ↑) but exercise capacity falls as LV dilation progresses."
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
  const currentQuery = searchParams.toString();
  const initialId = (LESIONS.find((l) => l.id === searchParams.get("lesion"))?.id ?? "normal") as LesionId;
  const [selectedId, setSelectedId] = useState<LesionId>(initialId);
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);
    params.set("lesion", selectedId);
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
    const next = params.get("lesion") as LesionId | null;
    if (!next || !LESIONS.find((l) => l.id === next)) return;
    setSelectedId((current) => (next === current ? current : next));
  }, [currentQuery]);

  const selected = LESIONS.find((l) => l.id === selectedId)!;
  const normal = LESIONS[0];

  const series = useMemo(
    () => [{ id: "current", label: selected.fullName, data: loopPoints(selected), colorVar: selected.colorVar, strokeWidth: 3 }],
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
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
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
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">Reading the trace · </span>
            <Highlighted text={"Each valve lesion deforms the pressure-volume loop in a signature way. Toggle a lesion: aortic stenosis raises ejection pressure (a tall loop), aortic regurgitation widens it (volume overload), mitral stenosis starves filling (a small loop), mitral regurgitation leaks during systole (no true isovolumetric phase). Watch forward stroke volume shrink."} />
          </p>
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
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: lesion.colorVar }}
                    />
                    <span className="font-bold">{lesion.shortName}</span>
                    <span className="text-xs">{lesion.fullName}</span>
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
