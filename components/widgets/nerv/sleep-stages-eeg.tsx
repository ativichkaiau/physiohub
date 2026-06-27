"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportError } from "@/components/ReportError";
import { getDiagramById } from "@/lib/registry";
import { ScrubBar } from "@/components/widgets/primitives";
import { clamp, parseNumber } from "@/components/widgets/widgetUtils";

const DIAGRAM_ID = "nerv/sleep-stages-eeg";
const diagram = getDiagramById(DIAGRAM_ID);

// One idealised ~90-minute sleep cycle, scrubbed 0..1 (early night).
const DURATION = 1;

type Stage = {
  key: string;
  name: string;
  band: string;
  freqHz: string;
  features: string;
  clinical: string;
  amp: number; // EEG amplitude (relative)
  freq: number; // EEG cycles across the strip
  colorVar: string;
};

const STAGES: Stage[] = [
  {
    key: "awake",
    name: "Awake (eyes closed)",
    band: "Alpha → Beta",
    freqHz: "8–13 Hz (alpha) · >13 Hz (beta)",
    features: "Alpha when relaxed with eyes closed (occipital); beta when alert/eyes open. High frequency, low amplitude.",
    clinical: "Beta dominance persists with benzodiazepines and barbiturates. Alpha intrusion into sleep is seen in fibromyalgia and depression.",
    amp: 8,
    freq: 26,
    colorVar: "var(--ph-curve-2)"
  },
  {
    key: "n1",
    name: "N1 (light sleep)",
    band: "Theta",
    freqHz: "4–7 Hz",
    features: "Transition from wake to sleep. Slow rolling eye movements, hypnic jerks. Easily aroused; people often deny being asleep.",
    clinical: "First stage entered. Increased N1 fragmentation in sleep apnea and insomnia.",
    amp: 11,
    freq: 16,
    colorVar: "var(--ph-curve-5)"
  },
  {
    key: "n2",
    name: "N2",
    band: "Theta + spindles + K-complexes",
    freqHz: "Sleep spindles 11–16 Hz; K-complexes",
    features: "Defined by SLEEP SPINDLES (thalamocortical bursts) and K-COMPLEXES (large biphasic waves). The bulk of total sleep time.",
    clinical: "Spindles gate sensory input and support memory consolidation. Bruxism (teeth grinding) arises here.",
    amp: 14,
    freq: 12,
    colorVar: "var(--ph-curve-1)"
  },
  {
    key: "n3",
    name: "N3 (slow-wave / deep sleep)",
    band: "Delta",
    freqHz: "0.5–4 Hz, high amplitude",
    features: "Delta-dominant slow-wave sleep. Hardest to arouse; greatest in the first third of the night. Restorative, growth-hormone release.",
    clinical: "Source of the NON-REM parasomnias: sleepwalking, night terrors, and bedwetting (all arise from N3, all in children). Decreases with age.",
    amp: 26,
    freq: 4,
    colorVar: "var(--ph-curve-3)"
  },
  {
    key: "rem",
    name: "REM (paradoxical sleep)",
    band: "Beta-like, low-voltage, sawtooth",
    freqHz: "Mixed, wake-like; sawtooth waves",
    features: "EEG looks awake (low-voltage, fast) yet the body is paralysed (skeletal atonia). Rapid eye movements, vivid dreams, ↑variable autonomics, penile/clitoral tumescence. Longer REM periods toward morning.",
    clinical: "REM sleep behaviour disorder (loss of atonia → acting out dreams) predicts Parkinson disease. REM rebound after alcohol/REM-suppressant withdrawal. Sildenafil & morning erections relate to REM tumescence.",
    amp: 9,
    freq: 22,
    colorVar: "var(--ph-curve-4)"
  }
];

// Hypnogram-ordered traversal across the night: Awake → N1 → N2 → N3 → N2 → REM.
const TIMELINE: Array<{ from: number; to: number; stage: number }> = [
  { from: 0.0, to: 0.08, stage: 0 }, // awake
  { from: 0.08, to: 0.18, stage: 1 }, // N1
  { from: 0.18, to: 0.42, stage: 2 }, // N2
  { from: 0.42, to: 0.66, stage: 3 }, // N3
  { from: 0.66, to: 0.82, stage: 2 }, // back to N2
  { from: 0.82, to: 1.0, stage: 4 } // REM
];

function stageAt(t: number) {
  const seg = TIMELINE.find((s) => t >= s.from && t < s.to) ?? TIMELINE[TIMELINE.length - 1];
  return STAGES[seg.stage];
}

function eegPath(stage: Stage, width: number, midY: number) {
  const pts: string[] = [];
  const n = 240;
  for (let i = 0; i <= n; i += 1) {
    const x = (i / n) * width;
    // base sinusoid + a little noise-like harmonic for realism
    let y = Math.sin((i / n) * stage.freq * Math.PI * 2) * stage.amp;
    y += Math.sin((i / n) * stage.freq * Math.PI * 2 * 2.3) * stage.amp * 0.25;
    // N2: inject a spindle burst + K-complex midway
    if (stage.key === "n2") {
      if (i > n * 0.45 && i < n * 0.6) y += Math.sin((i / n) * 60 * Math.PI * 2) * 8;
      if (Math.abs(i - n * 0.7) < 4) y += 22;
    }
    // REM: sawtooth notches
    if (stage.key === "rem" && i % 28 < 3) y += 10;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(midY - y).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function SleepStagesEegWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [time, setTime] = useState(() => parseNumber(searchParams.get("t"), 0.3, 0, DURATION));
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
    urlTimer.current = window.setTimeout(() => {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }, 180);
    return () => window.clearTimeout(urlTimer.current);
  }, [time, speed, pathname, router, searchParams]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTime((t) => {
        const nt = t + 0.01 * speed;
        if (nt >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return nt;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const stage = stageAt(time);
  const W = 720;
  const H = 200;
  const midY = 90;

  return (
    <section className="ph-widget-shell">
      <section className="ph-concept-panel p-4">
        <p className="ph-section-label">Concept scan</p>
        <p className="mt-2 max-w-5xl text-sm font-medium text-ph-muted">{diagram.concept}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="ph-panel ph-chart-stage p-4" aria-label="Sleep EEG by stage">
          <div aria-live="polite" className="mb-3 ph-clay-well p-3">
            <p className="ph-section-label">{stage.name} · {stage.band} ({stage.freqHz})</p>
            <p className="mt-1.5 text-sm text-ph-muted">{stage.features}</p>
            <p className="mt-2 text-sm"><span className="font-bold text-ph-text">Clinical:</span> <span className="text-ph-muted">{stage.clinical}</span></p>
          </div>

          <svg role="img" aria-label={`EEG during ${stage.name}`} viewBox={`0 0 ${W} ${H}`} className="ph-pathway-canvas h-auto w-full">
            <line x1="0" y1={midY} x2={W} y2={midY} stroke="var(--ph-axis)" strokeWidth="0.6" opacity="0.4" />
            <path d={eegPath(stage, W, midY)} fill="none" stroke={stage.colorVar} strokeWidth="2.2" strokeLinejoin="round" />

            {/* Hypnogram strip */}
            <g transform={`translate(0 ${H - 28})`}>
              {TIMELINE.map((seg, i) => (
                <rect key={i} x={seg.from * W} y="0" width={(seg.to - seg.from) * W} height="18" rx="3"
                  fill={STAGES[seg.stage].key === stage.key ? STAGES[seg.stage].colorVar : `color-mix(in srgb, ${STAGES[seg.stage].colorVar}, transparent 72%)`} />
              ))}
              <line x1={time * W} y1="-6" x2={time * W} y2="24" stroke="var(--ph-text)" strokeWidth="2" />
            </g>
            <text x="4" y={H - 2} fontSize="9" fontWeight="700" fill="var(--ph-muted)">HYPNOGRAM · early night (Awake → N1 → N2 → N3 → N2 → REM)</text>
          </svg>

          <div aria-live="polite" className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span className="ph-readout">Stage {stage.name.split(" ")[0]}</span>
            <span className="ph-readout">Band {stage.band.split(" ")[0]}</span>
            <span className="ph-readout">Night {(time * 100).toFixed(0)}%</span>
            <span className="ph-readout">Cycle ~90 min</span>
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="ph-panel p-4" aria-label="Controls">
            <h2 className="ph-section-label mb-4">Scrub the night</h2>
            <ScrubBar
              label="Time through one sleep cycle"
              value={time}
              duration={DURATION}
              step={0.01}
              playing={playing}
              speed={speed}
              onChange={(v) => { setPlaying(false); setTime(clamp(v, 0, DURATION)); }}
              onPlayingChange={(p) => { if (time >= DURATION) setTime(0); setPlaying(p); }}
              onSpeedChange={setSpeed}
            />
            <div className="mt-4 grid gap-2">
              {STAGES.map((s, i) => {
                const seg = TIMELINE.find((t) => t.stage === i);
                return (
                  <button key={s.key} type="button" onClick={() => seg && setTime((seg.from + seg.to) / 2)}
                    className={`focus-ring inline-flex items-center gap-2.5 rounded-ph border px-3 py-2 text-left text-sm transition ${
                      s.key === stage.key
                        ? "border-[color-mix(in_srgb,var(--ph-accent),transparent_45%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_85%)] text-ph-accent"
                        : "ph-clay-button text-ph-muted"
                    }`}>
                    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.colorVar }} />
                    <span className="font-bold">{s.name.split(" ")[0]}</span>
                    <span className="truncate text-xs">{s.band}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ph-panel p-4" aria-label="References">
            <h2 className="ph-section-label mb-3">References</h2>
            <ul className="grid gap-2 text-sm text-ph-muted">
              {diagram.references.map((reference) => (
                <li key={`${reference.source}-${reference.pages}`}>{reference.source}{reference.pages ? `, ${reference.pages}` : ""}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ReportError diagramId={DIAGRAM_ID} />
    </section>
  );
}
