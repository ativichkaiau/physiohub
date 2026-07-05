"use client";
import { Highlighted } from "@/components/widgets/common/Highlighted";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { PerturbationToggle, Slider } from "@/components/widgets/primitives";
import { clamp, parseBoolean, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "resp/aa-gradient-hypoxemia";
const diagram = getDiagramById(DIAGRAM_ID);

const PB = 760; // sea-level barometric pressure (mmHg)
const PH2O = 47; // water vapour pressure at 37 °C
const R = 0.8; // respiratory quotient

export default function AaGradientHypoxemiaWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [fio2, setFio2] = useState(() => parseNumber(searchParams.get("fio2"), 21, 21, 100));
  const [vent, setVent] = useState(() => parseNumber(searchParams.get("vent"), 100, 30, 150)); // alveolar ventilation %
  const [shunt, setShunt] = useState(() => parseNumber(searchParams.get("shunt"), 0, 0, 40)); // %
  const [vq, setVq] = useState(() => parseNumber(searchParams.get("vq"), 0, 0, 40)); // V/Q mismatch index
  const [give100, setGive100] = useState(() => parseBoolean(searchParams.get("o2"), false));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("fio2", String(Math.round(fio2)));
    params.set("vent", String(Math.round(vent)));
    params.set("shunt", String(Math.round(shunt)));
    params.set("vq", String(Math.round(vq)));
    params.set("o2", give100 ? "1" : "0");
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [fio2, vent, shunt, vq, give100, pathname, router, searchParams]);

  const effFio2 = give100 ? 100 : fio2;
  // Hypoventilation raises PaCO2 (inverse to alveolar ventilation).
  const paco2 = clamp(40 * (100 / vent), 20, 100);
  // Alveolar gas equation
  const pAO2 = (effFio2 / 100) * (PB - PH2O) - paco2 / R;
  // A-a gradient: small baseline + shunt + V/Q. On 100% O2, V/Q corrects but
  // shunt does NOT (blood bypasses ventilated alveoli entirely).
  const aaBase = 8;
  const vqContribution = give100 ? vq * 0.15 : vq * 0.9;
  const shuntContribution = give100 ? shunt * 2.6 : shunt * 1.7; // shunt worsens / persists on O2
  const aaGradient = clamp(aaBase + vqContribution + shuntContribution, 4, 600);
  const paO2 = clamp(pAO2 - aaGradient, 20, 660);
  const sao2 = clamp(100 / (1 + Math.exp(-(paO2 - 26.6) / 12)), 30, 100);

  const cause = (() => {
    if (effFio2 < 21 + 1 && fio2 <= 21 && pAO2 < 100 && aaGradient < 18 && paco2 <= 42 && vent >= 95 && shunt < 4 && vq < 4) return "Low inspired O₂ / altitude — ↓PAO₂, NORMAL A-a gradient";
    if (paco2 > 48 && aaGradient < 18) return "Hypoventilation — ↑PaCO₂, NORMAL A-a gradient (corrects with O₂)";
    if (shunt > 12 && aaGradient > 30) return "Right-to-left shunt — ↑A-a gradient, does NOT correct with 100% O₂";
    if (vq > 12 && aaGradient > 25) return "V/Q mismatch — ↑A-a gradient, CORRECTS with 100% O₂ (most common cause)";
    if (aaGradient > 25) return "Diffusion / mixed defect — widened A-a gradient";
    return "Normal gas exchange";
  })();

  const warning = (() => {
    if (paO2 < 40) return "Edge state: PaO₂ < 40 mmHg — severe hypoxemia, tissue hypoxia; SaO₂ on the steep part of the curve.";
    if (shunt > 25 && give100 && paO2 < 200) return "Edge state: large shunt unresponsive to 100% O₂ — the defining test for shunt physiology (ARDS, atelectasis, intracardiac).";
    if (paco2 > 70) return "Edge state: PaCO₂ > 70 mmHg — hypercapnic respiratory failure; watch CO₂ narcosis and acidosis.";
    return undefined;
  })();

  const readouts = [
    { label: "PaO₂", value: `${paO2.toFixed(0)} mmHg` },
    { label: "PAO₂", value: `${pAO2.toFixed(0)} mmHg` },
    { label: "A-a", value: `${aaGradient.toFixed(0)} mmHg` },
    { label: "PaCO₂", value: `${paco2.toFixed(0)} mmHg` },
    { label: "SaO₂", value: `${sao2.toFixed(0)}%` },
    { label: "FiO₂", value: `${effFio2.toFixed(0)}%` }
  ];

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="A-a gradient and hypoxemia">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{cause}</p>
            <p className="mt-1.5 text-sm text-ph-muted">
              Alveolar gas equation: PAO₂ = FiO₂·(P_B − 47) − PaCO₂/0.8. The A-a gradient (PAO₂ − PaO₂) separates the causes of hypoxemia: low FiO₂ and hypoventilation give a NORMAL A-a gradient; shunt, V/Q mismatch, and diffusion impairment WIDEN it. The 100% O₂ test is the key discriminator — V/Q mismatch corrects, a true shunt does not.
            </p>
          </div>

          <div aria-live="polite" className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {readouts.map((r) => <span key={r.label} className="ph-readout">{r.label} {r.value}</span>)}
          </div>

          {warning ? (
            <p className="mb-3 rounded-ph border border-[color-mix(in_srgb,var(--ph-warn),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-warn),transparent_88%)] px-3 py-2 text-sm text-ph-text">{warning}</p>
          ) : null}

          {/* simple PaO2 bar */}
          <div className="ph-clay-well p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ph-muted">PaO₂ ladder</p>
            <div className="h-4 overflow-hidden rounded-full ph-clay-track">
              <div className="h-full rounded-full transition-all" style={{ width: `${clamp((paO2 / 600) * 100, 3, 100)}%`, background: paO2 < 60 ? "var(--ph-danger)" : paO2 < 80 ? "var(--ph-warn)" : "var(--ph-ok)" }} />
            </div>
            <p className="mt-1 text-xs text-ph-muted tabular-nums">normal ~95 · hypoxemia &lt;80 · severe &lt;60 mmHg</p>
          </div>
          <p className="ph-clay-well mt-3 px-3 py-2 text-xs leading-relaxed text-ph-muted">
            <span className="font-black uppercase tracking-[0.14em] text-ph-text">How to read · </span>
            <Highlighted text={"Two numbers sort out hypoxemia: the A-a gradient and the response to 100% oxygen. A NORMAL gradient means hypoventilation or low inspired oxygen (the lung itself is fine). A WIDE gradient means V/Q mismatch or shunt — and 100% oxygen separates them: V/Q mismatch corrects, a true shunt does NOT. Work the controls and watch the gradient."} />
          </p>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Controls</h2>
            <div className="grid gap-4">
              <Slider label="FiO₂ (inspired O₂)" value={fio2} min={21} max={100} step={1} unit="%" defaultValue={21} onChange={setFio2} />
              <Slider label="Alveolar ventilation" value={vent} min={30} max={150} step={1} unit="%" defaultValue={100} onChange={setVent} />
              <Slider label="Shunt fraction" value={shunt} min={0} max={40} step={1} unit="%" defaultValue={0} onChange={setShunt} />
              <Slider label="V/Q mismatch" value={vq} min={0} max={40} step={1} unit="index" defaultValue={0} onChange={setVq} />
              <PerturbationToggle label="Give 100% O₂ (shunt vs V/Q test)" checked={give100} onChange={setGive100} />
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
