import Link from "next/link";
import { archetypeMeta, getDiagramPath, getSystemPath, getSystems } from "@/lib/registry";

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

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-10">
      <section className="ph-cockpit mb-8 px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          {/* Left — marquee */}
          <div className="max-w-4xl">
            <span className="ph-cockpit-kicker">Interactive physiology atlas</span>
            <h1 className="mt-7 text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-[64px]">
              Build a working model of <span className="ph-cockpit-accent">the body</span>, one diagram at a time.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
              A unified atlas of scrubbable timelines, perturbable curves, feedback loops, click-to-mechanism walks, and multi-variable interactions — every diagram shareable by URL.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#systems"
                className="focus-ring rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 no-underline transition hover:bg-[color-mix(in_srgb,white,var(--cockpit-accent)_14%)]"
              >
                Start exploring
              </a>
              <Link
                href="/cv"
                className="focus-ring rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white no-underline transition hover:bg-white/10"
              >
                Cardiovascular ↗
              </Link>
            </div>
            <div className="ph-cockpit-bullets mt-10">
              <span className="ph-cockpit-bullet">Timeline</span>
              <span className="ph-cockpit-bullet">Curve</span>
              <span className="ph-cockpit-bullet">Loop</span>
              <span className="ph-cockpit-bullet">Mechanism</span>
              <span className="ph-cockpit-bullet">Multi-var</span>
            </div>
          </div>

          {/* Right — atlas console */}
          <aside className="ph-cockpit-console p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Live catalog</p>
                <h2 className="mt-1.5 text-2xl font-black text-white">Atlas Console</h2>
              </div>
              <span
                className="rounded-full border border-[color-mix(in_srgb,var(--cockpit-accent),transparent_55%)] bg-[color-mix(in_srgb,var(--cockpit-accent),transparent_82%)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "color-mix(in srgb, var(--cockpit-accent), white 18%)" }}
              >
                <span className="ph-mode-day">Day mode</span>
                <span className="ph-mode-night">Night mode</span>
              </span>
            </div>

            {featured ? (
              <div className="mt-5 rounded-[14px] bg-slate-100 p-5 text-slate-950">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-slate-100"
                  >
                    ◎
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Featured widget</p>
                    <p className="mt-0.5 truncate text-lg font-black">{featured.title}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{featured.teaser}</p>
                <Link
                  href={getDiagramPath(featured.systemId, featured.slug)}
                  className="focus-ring mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white no-underline transition hover:bg-slate-800"
                >
                  Open widget →
                </Link>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Systems</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-white">{systems.length}</p>
              </div>
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Diagrams</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-white">{diagramCount}</p>
              </div>
              <div className="ph-cockpit-stat">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Live</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-white">{referenceCount}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="systems" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ph-kicker">Catalog</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose a system</h2>
        </div>
        <p className="max-w-xl text-sm text-ph-muted">
          Each card opens that system&rsquo;s diagram list. Live widgets are interactive; the rest are in development.
        </p>
      </section>

      <section aria-label="Physiology systems" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {systems.map((system) => {
          const ref = system.diagrams.filter((d) => d.status === "reference").length;
          const pct = Math.max(8, (ref / system.diagrams.length) * 100);
          return (
            <Link
              key={system.id}
              href={getSystemPath(system.id)}
              className="focus-ring ph-panel group block min-h-44 p-5 no-underline transition hover:-translate-y-0.5 hover:border-[var(--ph-border-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-ph border border-[color-mix(in_srgb,var(--ph-accent),transparent_70%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_92%)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ph-accent">
                  Live
                </span>
                <span className="text-xs text-ph-muted tabular-nums">{system.diagrams.length} diagrams</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{system.name}</h3>
              <p className="mt-2 text-sm text-ph-muted">{system.teaser}</p>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-ph-surface2">
                <div className="h-full rounded-full bg-ph-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-ph-muted tabular-nums">
                {ref} live · {system.diagrams.length - ref} in development
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
