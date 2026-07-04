import Link from "next/link";
import { PhysiologyIntro } from "@/components/PhysiologyIntro";
import { SystemSignal } from "@/components/SystemSignal";
import { archetypeMeta, getDiagramPath, getSystemEmoji, getSystemPath, getSystems } from "@/lib/registry";

const howto = [
  {
    icon: "🎚",
    title: "Clamp a variable",
    body: "Drag a slider to set preload, an ion concentration, or a drug dose. The model recomputes the instant you move it."
  },
  {
    icon: "🔀",
    title: "Perturb & compare",
    body: "Flip a toggle to block a receptor, cut a nerve, or disable a reflex, then read the result against the dashed reference trace."
  },
  {
    icon: "⏱",
    title: "Scrub the timeline",
    body: "On time-based diagrams — the cardiac cycle, an action potential — drag the scrub bar to step through each phase."
  },
  {
    icon: "🚦",
    title: "Read the zones",
    body: "Bands grade the axes: green is physiologic, amber suboptimal, red dangerous. Phase bands name each region of a curve."
  },
  {
    icon: "🔁",
    title: "Trace the loop",
    body: "Feedback widgets plot the controlled variable over time — switch the loop off to watch it drift, on to watch it correct."
  },
  {
    icon: "🔗",
    title: "Share by URL",
    body: "Every control writes to the address bar. Copy the link to reopen the identical state for a lecture or a classmate."
  }
];

export default function HomePage() {
  const systems = getSystems();
  const diagramCount = systems.reduce((total, system) => total + system.diagrams.length, 0);
  const referenceCount = systems.reduce(
    (total, system) => total + system.diagrams.filter((diagram) => diagram.status === "reference").length,
    0
  );
  const archetypeCount = Object.keys(archetypeMeta).length;

  // Featured = first live (reference) diagram in the catalog.
  const featured = systems
    .flatMap((s) => s.diagrams.map((d) => ({ ...d, systemId: s.id })))
    .find((d) => d.status === "reference");

  // Pharmacology entry points — drugs act on the same live models.
  const drugLinks = [
    { label: "💊 Dose–response", href: getDiagramPath("endo", "hormone-dose-response") },
    { label: "💧 Diuretic sites", href: getDiagramPath("renal", "diuretic-sites") },
    { label: "⚡ Autonomic receptors", href: getDiagramPath("nerv", "autonomic-nervous-system") },
    { label: "🔬 Nephron drug targets", href: getDiagramPath("renal", "nephron-handling") }
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10">
      <section className="ph-cockpit mb-10 px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          {/* Left — marquee */}
          <div className="max-w-4xl">
            <span className="ph-cockpit-kicker">Live physiology monitor</span>
            <h1 className="mt-7 text-4xl font-black leading-[0.98] text-ph-text sm:text-5xl lg:text-[64px]">
              Perturb a system. Watch <span className="ph-cockpit-accent ph-phosphor">the trace</span> answer back.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-ph-muted sm:text-lg">
              A live monitor for pressure, flow, gases, filtrate, hormones, impulse, and contraction. Scrub time, perturb a trace, follow the loop, and lock the exact reading to a URL.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#systems"
                className="focus-ring ph-clay-button inline-flex w-full items-center justify-center rounded-ph px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] no-underline sm:w-auto"
              >
                Go live
              </a>
              <PhysiologyIntro autoOpen launcherClassName="w-full sm:w-auto" />
              <Link
                href="/cv"
                className="focus-ring ph-clay-button inline-flex w-full items-center justify-center rounded-ph px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] no-underline sm:w-auto"
              >
                Cardiovascular
              </Link>
            </div>
            <div className="ph-cockpit-bullets mt-10">
              <span className="ph-cockpit-bullet">Pressure</span>
              <span className="ph-cockpit-bullet">Gas exchange</span>
              <span className="ph-cockpit-bullet">Transport</span>
              <span className="ph-cockpit-bullet">Feedback</span>
              <span className="ph-cockpit-bullet">Excitability</span>
            </div>
          </div>

          {/* Right — atlas console */}
          <aside className="ph-cockpit-console p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ph-muted">Live channels</p>
                <h2 className="mt-1.5 text-2xl font-black text-ph-text">Monitor console</h2>
              </div>
              <span
                className="ph-clay-chip px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ph-accent"
              >
                <span className="ph-mode-day">Day mode</span>
                <span className="ph-mode-night">Night mode</span>
              </span>
            </div>

            {featured ? (
              <div className="ph-system-theme mt-5" data-system={featured.systemId}>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="ph-clay-stat grid h-10 w-10 shrink-0 place-items-center text-xl leading-none"
                  >
                    {getSystemEmoji(featured.systemId)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ph-muted">
                      On the monitor
                    </p>
                    <p className="mt-0.5 truncate text-lg font-black">{featured.title}</p>
                  </div>
                </div>
                <SystemSignal systemId={featured.systemId} className="mt-4 h-28" />
                <p className="mt-4 text-sm leading-relaxed text-ph-muted">{featured.teaser}</p>
                <Link
                  href={getDiagramPath(featured.systemId, featured.slug)}
                  className="focus-ring ph-clay-button mt-4 inline-flex rounded-ph px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] no-underline"
                >
                  View trace
                </Link>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ph-muted">Systems</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-ph-text">{systems.length}</p>
              </div>
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ph-muted">Traces</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-ph-text">{diagramCount}</p>
              </div>
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ph-muted">Live</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-ph-text">{referenceCount}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-label="How to use the bench" className="mb-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ph-kicker">🩺 How to read the monitor</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Work the monitor</h2>
          </div>
          <p className="max-w-xl text-sm text-ph-muted">
            Every trace is a live model — move a control, read the response, and lock the exact reading to a URL. No sign-in, nothing to install.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {howto.map((item) => (
            <div key={item.title} className="ph-panel p-4">
              <span className="ph-clay-stat grid h-10 w-10 place-items-center text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <h3 className="mt-3 text-base font-bold tracking-tight">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ph-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="ph-panel mt-3 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="ph-kicker">💊 Pharmacology built in</p>
              <p className="mt-2 max-w-xl text-sm text-ph-muted">
                Drugs act on the very same models — titrate a dose, block a receptor, or pick a nephron target and watch the curve move.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {drugLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="focus-ring ph-clay-button inline-flex rounded-ph px-3 py-1.5 text-xs font-bold no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="systems" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ph-kicker">📡 Channels</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Select a channel</h2>
        </div>
        <p className="max-w-xl text-sm text-ph-muted">
          Each channel opens its trace list. Live traces respond in real time; the rest are still acquiring signal.
        </p>
      </section>

      <section aria-label="Physiology systems" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {systems.map((system) => {
          const ref = system.diagrams.filter((d) => d.status === "reference").length;
          const pct = Math.max(8, (ref / system.diagrams.length) * 100);
          const allLive = ref === system.diagrams.length;
          return (
            <Link
              key={system.id}
              href={getSystemPath(system.id)}
              data-system={system.id}
              className="focus-ring ph-panel ph-system-card group relative block min-h-64 overflow-hidden p-4 no-underline transition duration-200"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-ph-accent opacity-80"
              />
              <div className="relative">
                <SystemSignal systemId={system.id} className="h-28 transition duration-200 group-hover:border-[var(--ph-border-strong)]" />
                <div className="flex items-start justify-between gap-3">
                  <span className="mt-4 inline-flex ph-clay-chip px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ph-accent">
                    {system.shortName}
                  </span>
                  <div className="mt-4 flex flex-col items-end gap-1">
                    <span
                      className={
                        allLive
                          ? "rounded-full border border-[color-mix(in_srgb,var(--ph-ok),transparent_60%)] bg-[color-mix(in_srgb,var(--ph-ok),transparent_90%)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                          : "rounded-full border border-[color-mix(in_srgb,var(--ph-accent),transparent_60%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_92%)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ph-accent"
                      }
                      style={allLive ? { color: "var(--ph-ok)" } : undefined}
                    >
                      {allLive ? "All live" : "Live"}
                    </span>
                    <span className="text-xs text-ph-muted tabular-nums">{system.diagrams.length} traces</span>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight transition-colors group-hover:text-ph-accent">
                  {system.name}
                </h3>
                <p className="mt-2 text-sm text-ph-muted">{system.teaser}</p>
                <div className="mt-5 h-1 overflow-hidden rounded-full ph-clay-track">
                  <div
                    className="h-full rounded-full bg-ph-accent transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ph-muted tabular-nums">
                  {ref} live · {system.diagrams.length - ref} acquiring
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
