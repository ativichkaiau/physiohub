"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { ScrubBar } from "@/components/widgets/primitives";
import { clamp, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "cv/jvp-waveform";
const diagram = getDiagramById(DIAGRAM_ID);
const DURATION = 1; // one cardiac cycle, normalised

type Wave = { key: string; name: string; from: number; to: number; body: string; pathology: string };

const WAVES: Wave[] = [
  {
    key: "a",
    name: "a wave",
    from: 0.0,
    to: 0.16,
    body: "Right ATRIAL CONTRACTION pushes blood backward into the jugular vein (the atrium has no valve at the venous inlet). The first positive deflection, just before the carotid pulse and S1.",
    pathology: "Large a waves: anything the atrium contracts against — tricuspid stenosis, pulmonary hypertension, RV hypertrophy. CANNON a waves: atrium contracts against a closed tricuspid valve — complete (3rd-degree) AV block, AVNRT, VT. ABSENT a wave: atrial fibrillation (no organised atrial contraction)."
  },
  {
    key: "c",
    name: "c wave",
    from: 0.16,
    to: 0.3,
    body: "Tricuspid valve bulges back into the right atrium as the RV begins isovolumic CONTRACTION. A small positive deflection riding on the downslope of the a wave.",
    pathology: "The c wave coincides with the carotid upstroke (the 'c' is also a useful mnemonic for Carotid). Rarely altered in isolation."
  },
  {
    key: "x",
    name: "x descent",
    from: 0.3,
    to: 0.5,
    body: "Atrial RELAXATION plus downward pull of the tricuspid annulus as the ventricle ejects — the atrium enlarges and pressure falls. The most prominent downslope in health.",
    pathology: "PROMINENT x descent: cardiac tamponade (the only time the RA can fill is during ventricular ejection). LOSS of x descent: tricuspid regurgitation (systolic backflow fills the atrium instead)."
  },
  {
    key: "v",
    name: "v wave",
    from: 0.5,
    to: 0.72,
    body: "Right atrial FILLING from venous return while the tricuspid valve is still CLOSED (ventricle in systole). Pressure climbs to the second positive peak.",
    pathology: "GIANT (cv / 'sail') v waves: tricuspid regurgitation — systolic regurgitant flow merges the c and v waves into one large systolic wave."
  },
  {
    key: "y",
    name: "y descent",
    from: 0.72,
    to: 1.0,
    body: "Tricuspid valve OPENS and blood rushes from the atrium into the ventricle — pressure falls rapidly (early diastolic filling).",
    pathology: "STEEP / sharp y descent: constrictive pericarditis (rapid early filling that then abruptly stops — the M/W pattern). BLUNTED / absent y descent: cardiac tamponade (filling is impaired throughout diastole)."
  }
];

// Synthesised JVP pressure (mmHg above ~3 baseline), 0..1 cycle.
const POINTS: Array<[number, number]> = [
  [0, 2], [0.06, 7], [0.12, 8], [0.16, 5],        // a wave
  [0.22, 6.5], [0.3, 5],                           // c wave
  [0.42, 1.5],                                     // x descent trough
  [0.55, 5.5], [0.66, 8], [0.72, 7.5],             // v wave
  [0.86, 1], [1.0, 2]                              // y descent
];

function interp(t: number) {
  for (let i = 1; i < POINTS.length; i += 1) {
    if (t <= POINTS[i][0]) {
      const [x0, y0] = POINTS[i - 1];
      const [x1, y1] = POINTS[i];
      const f = (t - x0) / (x1 - x0 || 1);
      return y0 + f * (y1 - y0);
    }
  }
  return POINTS[POINTS.length - 1][1];
}

function waveAt(t: number) {
  return WAVES.find((w) => t >= w.from && t < w.to) ?? WAVES[WAVES.length - 1];
}

export default function JvpWaveformWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [time, setTime] = useState(() => parseNumber(searchParams.get("t"), 0.08, 0, DURATION));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => parseNumber(searchParams.get("speed"), 1, 0.5, 2));
  const urlTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("t", time.toFixed(2));
    params.set("speed", String(speed));
    const next = params.toString();
    if (next === searchParams.toString()) return;
    window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => router.replace(`${pathname}?${next}`, { scroll: false }), 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [time, speed, pathname, router, searchParams]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((t) => {
        const nt = t + 0.01 * speed;
        if (nt >= DURATION) { setPlaying(false); return DURATION; }
        return nt;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const wave = waveAt(time);
  const W = 720, H = 220, padL = 40, padR = 16, padT = 16, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const X = (t: number) => padL + t * plotW;
  const Y = (p: number) => padT + plotH - (p / 10) * plotH;
  const path = POINTS.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(" ");

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Jugular venous pressure waveform">
          <div aria-live="polite" className="mb-3 rounded-ph border border-[var(--ph-border)] bg-ph-surface2 p-3">
            <p className="ph-section-label">{wave.name}</p>
            <p className="mt-1.5 text-sm text-ph-muted">{wave.body}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Pathology:</span> <span className="text-ph-muted">{wave.pathology}</span></p>
          </div>

          <svg role="img" aria-label="JVP waveform" viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <line x1={padL} y1={Y(0)} x2={W - padR} y2={Y(0)} stroke="var(--ph-axis)" strokeWidth="0.6" opacity="0.4" />
            {/* highlight current wave window */}
            <rect x={X(wave.from)} y={padT} width={X(wave.to) - X(wave.from)} height={plotH} fill="color-mix(in srgb, var(--ph-accent), transparent 90%)" />
            <path d={path} fill="none" stroke="var(--ph-curve-1)" strokeWidth="2.4" strokeLinejoin="round" />
            {/* wave labels */}
            {WAVES.map((w) => {
              const mid = (w.from + w.to) / 2;
              return <text key={w.key} x={X(mid)} y={padT + 12} textAnchor="middle" fontSize="12" fontWeight="800" fill={w.key === wave.key ? "var(--ph-accent)" : "var(--ph-muted)"}>{w.key}</text>;
            })}
            {/* cursor */}
            <line x1={X(time)} y1={padT} x2={X(time)} y2={padT + plotH} stroke="var(--ph-text)" strokeWidth="1.6" />
            <text x={padL} y={H - 8} fontSize="9" fontWeight="700" fill="var(--ph-muted)">JVP (mmHg) · a–c–x–v–y across one cardiac cycle</text>
          </svg>

          <div aria-live="polite" className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Wave {wave.name.split(" ")[0]}</span>
            <span className="ph-readout">JVP {interp(time).toFixed(1)} mmHg</span>
            <span className="ph-readout">Cycle {(time * 100).toFixed(0)}%</span>
            <span className="ph-readout">{time < 0.5 ? "Systole" : "Diastole"}</span>
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Scrub the waveform</h2>
            <ScrubBar label="Cardiac cycle" value={time} duration={DURATION} step={0.01} playing={playing} speed={speed}
              onChange={(v) => { setPlaying(false); setTime(clamp(v, 0, DURATION)); }}
              onPlayingChange={(p) => { if (time >= DURATION) setTime(0); setPlaying(p); }}
              onSpeedChange={setSpeed} />
            <div className="mt-4 grid gap-2">
              {WAVES.map((w) => (
                <button key={w.key} type="button" onClick={() => setTime((w.from + w.to) / 2)}
                  className={`focus-ring rounded-ph border px-3 py-2 text-left text-sm transition ${
                    w.key === wave.key
                      ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                      : "border-[var(--ph-border)] bg-ph-surface2 text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
                  }`}>
                  <span className="font-bold">{w.name}</span>
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
