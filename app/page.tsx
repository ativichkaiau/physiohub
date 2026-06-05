import Link from "next/link";
import { archetypeMeta, getSystemPath, getSystems } from "@/lib/registry";

export default function HomePage() {
  const systems = getSystems();
  const diagramCount = systems.reduce((total, system) => total + system.diagrams.length, 0);
  const referenceCount = systems.reduce(
    (total, system) => total + system.diagrams.filter((diagram) => diagram.status === "reference").length,
    0
  );
  const archetypeCount = Object.keys(archetypeMeta).length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-10">
      <section className="ph-hero mb-8 px-6 py-10 sm:px-10 sm:py-14">
        <p className="ph-kicker">Interactive physiology</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Build a working model of the body, one diagram at a time.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ph-muted sm:text-lg">
          A unified atlas of scrubbable timelines, perturbable curves, feedback loops, click-to-mechanism walks, and multi-variable interactions — every diagram shareable by URL.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#systems"
            className="focus-ring rounded-ph bg-ph-accent px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:opacity-90"
          >
            Browse systems
          </a>
          <Link
            href="/cv"
            className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface px-5 py-2.5 text-sm font-semibold text-ph-text no-underline transition hover:border-[var(--ph-border-strong)]"
          >
            Cardiovascular →
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 sm:max-w-2xl">
          <div>
            <dt className="ph-kicker">Systems</dt>
            <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{systems.length}</dd>
          </div>
          <div>
            <dt className="ph-kicker">Diagrams</dt>
            <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{diagramCount}</dd>
          </div>
          <div>
            <dt className="ph-kicker">Live</dt>
            <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{referenceCount}</dd>
          </div>
          <div>
            <dt className="ph-kicker">Archetypes</dt>
            <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{archetypeCount}</dd>
          </div>
        </dl>
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
