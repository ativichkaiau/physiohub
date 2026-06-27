"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { Curve, PerturbationToggle, Slider, type CurvePoint, type CurveSeries } from "@/components/widgets/primitives";
import { clamp, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "nerv/receptive-fields";
const diagram = getDiagramById(DIAGRAM_ID);

// 1-D visual field, x in degrees of visual angle.
const X_MIN = -40;
const X_MAX = 40;
const SAMPLES = 161;

function gaussian(x: number, mu: number, sigma: number) {
  return Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma));
}

// Difference-of-Gaussians receptive field — Mexican-hat profile.
// On-center: positive narrow Gaussian (center) minus broader inhibitory Gaussian (surround).
// Off-center: negate the result.
function dogRF(x: number, sigmaCenter: number, sigmaSurround: number, surroundStrength: number, onCenter: boolean) {
  const center = gaussian(x, 0, sigmaCenter) / sigmaCenter;
  const surround = (surroundStrength * gaussian(x, 0, sigmaSurround)) / sigmaSurround;
  const value = center - surround;
  return onCenter ? value : -value;
}

// Stimulus: rectangular bar centred at `position` with given width and intensity.
function stimulus(x: number, position: number, width: number, intensity: number) {
  return Math.abs(x - position) <= width / 2 ? intensity : 0;
}

// Discrete convolution → response at each cell.
function responseAt(
  cellPosition: number,
  stimPos: number,
  stimWidth: number,
  stimIntensity: number,
  sigmaCenter: number,
  sigmaSurround: number,
  surroundStrength: number,
  onCenter: boolean
) {
  let sum = 0;
  const step = (X_MAX - X_MIN) / (SAMPLES - 1);
  for (let i = 0; i < SAMPLES; i += 1) {
    const xs = X_MIN + i * step;
    const s = stimulus(xs, stimPos, stimWidth, stimIntensity);
    const rf = dogRF(xs - cellPosition, sigmaCenter, sigmaSurround, surroundStrength, onCenter);
    sum += s * rf * step;
  }
  return sum;
}

export default function ReceptiveFieldsWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [stimPos, setStimPos] = useState(() => parseNumber(searchParams.get("pos"), 0, X_MIN, X_MAX));
  const [stimWidth, setStimWidth] = useState(() => parseNumber(searchParams.get("width"), 8, 1, 60));
  const [stimIntensity, setStimIntensity] = useState(() => parseNumber(searchParams.get("intensity"), 100, 0, 200));
  const [surround, setSurround] = useState(() => parseNumber(searchParams.get("surround"), 70, 0, 150));
  const [onCenter, setOnCenter] = useState(() => parseBoolean(searchParams.get("on"), true));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("pos", String(Math.round(stimPos)));
    params.set("width", String(Math.round(stimWidth)));
    params.set("intensity", String(Math.round(stimIntensity)));
    params.set("surround", String(Math.round(surround)));
    params.set("on", onCenter ? "1" : "0");
    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [stimPos, stimWidth, stimIntensity, surround, onCenter, currentQuery, pathname, router]);

  const sigmaCenter = 3;
  const sigmaSurround = 9;
  const surroundStrength = surround / 100;

  const series = useMemo<CurveSeries[]>(() => {
    const step = (X_MAX - X_MIN) / (SAMPLES - 1);
    const stimulusData: CurvePoint[] = [];
    const rfData: CurvePoint[] = [];
    const responseData: CurvePoint[] = [];
    for (let i = 0; i < SAMPLES; i += 1) {
      const x = X_MIN + i * step;
      stimulusData.push({ x, y: stimulus(x, stimPos, stimWidth, stimIntensity) });
      rfData.push({ x, y: 50 + dogRF(x, sigmaCenter, sigmaSurround, surroundStrength, onCenter) * 200 });
      responseData.push({
        x,
        y: clamp(40 + responseAt(x, stimPos, stimWidth, stimIntensity, sigmaCenter, sigmaSurround, surroundStrength, onCenter) * 0.6, -50, 200)
      });
    }
    return [
      { id: "stim", label: "Stimulus", colorVar: "var(--ph-curve-2)", data: stimulusData, strokeWidth: 2 },
      { id: "rf", label: `Receptive field (${onCenter ? "on-centre" : "off-centre"})`, colorVar: "var(--ph-curve-3)", data: rfData, dashed: true, strokeWidth: 1.5 },
      { id: "resp", label: "Firing-rate response", colorVar: "var(--ph-curve-1)", data: responseData, strokeWidth: 3 }
    ];
  }, [stimPos, stimWidth, stimIntensity, surroundStrength, onCenter]);

  const peakResp = Math.max(...series[2].data.map((p) => p.y));
  const minResp = Math.min(...series[2].data.map((p) => p.y));
  const overshoot = Math.abs(peakResp - 40) > 1 || Math.abs(minResp - 40) > 1;
  const edgeEnhancement = (peakResp - 40) + (40 - minResp);

  const state = (() => {
    if (stimWidth > 40) return "Uniform field — DoG response ≈ 0 (lateral inhibition cancels)";
    if (surround < 20) return "Surround weak — broad response with little edge enhancement";
    if (surround > 110) return "Strong surround — sharp Mach-band edge response";
    if (stimWidth < 4) return "Punctate stimulus — peaked centre response";
    return onCenter ? "On-centre DoG — bright bar elicits central excitation, surround inhibition" : "Off-centre DoG — bright bar inhibits centre, surround facilitates";
  })();

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Receptive field response">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{state}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Retinal ganglion (and LGN, V1) cells have antagonistic centre–surround receptive fields modelled as a Difference of Gaussians. A bright bar excites on-centre cells whose centres it covers and INHIBITS the cells whose surrounds it falls in — producing edge enhancement and Mach bands. Strong lateral inhibition sharpens edges at the cost of contrast sensitivity in uniform regions.
            </p>
          </div>

          <div aria-live="polite" className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Peak {peakResp.toFixed(0)}</span>
            <span className="ph-readout">Trough {minResp.toFixed(0)}</span>
            <span className="ph-readout">Edge Δ {edgeEnhancement.toFixed(0)}</span>
            <span className="ph-readout">RF type {onCenter ? "on-centre" : "off-centre"}</span>
          </div>

          {!overshoot ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">
              Edge state: response ≈ baseline everywhere — the stimulus and surround cancel (uniform field illusion, basis of Troxler fading).
            </p>
          ) : null}

          <Curve
            title="Stimulus · receptive field · response across cell positions"
            xDomain={[X_MIN, X_MAX]}
            yDomain={[-30, 200]}
            xLabel="visual position (°)"
            yLabel="intensity / firing rate"
            series={series}
            annotations={[
              { x: stimPos, y: stimIntensity, label: "stimulus" },
              { x: 0, y: 50 + dogRF(0, sigmaCenter, sigmaSurround, surroundStrength, onCenter) * 200, label: "RF centre" }
            ]}
            height={420}
          />
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            Read firing across positions in space. A center-surround field fires hardest when light hits its center and is silenced by light in the surround — so a small spot on the center peaks the response while diffuse light barely moves it. That is why these cells report CONTRAST and edges, not absolute brightness.
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="Stimulus position" value={stimPos} min={X_MIN} max={X_MAX} step={1} unit="°" defaultValue={0} onChange={setStimPos} />
              <Slider label="Stimulus width" value={stimWidth} min={1} max={60} step={1} unit="°" defaultValue={8} onChange={setStimWidth} />
              <Slider label="Stimulus intensity" value={stimIntensity} min={0} max={200} step={1} unit="%" defaultValue={100} onChange={setStimIntensity} />
              <Slider label="Lateral inhibition (surround)" value={surround} min={0} max={150} step={1} unit="%" defaultValue={70} onChange={setSurround} />
              <PerturbationToggle label="On-centre receptive field (off if disabled)" checked={onCenter} onChange={setOnCenter} />
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
