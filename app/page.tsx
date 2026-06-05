import Link from "next/link";
import { archetypeMeta } from "@/lib/registry";
import { getSystemPath, getSystems } from "@/lib/registry";

export default function HomePage() {
  const systems = getSystems();
  const diagramCount = systems.reduce((total, system) => total + system.diagrams.length, 0);
  const referenceCount = systems.reduce(
    (total, system) => total + system.diagrams.filter((diagram) => diagram.status === "reference").length,
    0
  );
  const archetypeCount = Object.keys(archetypeMeta).length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8">
      <section className="ph-grid-panel mb-5 rounded-[28px] px-5 py-7 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div className="max-w-4xl">
            <p className="ph-kicker">Physiology operating system</p>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Explore the body through live physiology diagrams.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
              A unified med-school command center for scrubbable timelines, perturbable curves, feedback loops, mechanisms, and multi-variable interactions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#systems"
                className="focus-ring rounded-ph bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 no-underline transition hover:bg-[color-mix(in_srgb,white,var(--ph-accent)_12%)]"
              >
                Start exploring
              </a>
              <Link
                href="/cv"
                className="focus-ring rounded-ph border border-white/18 bg-white/7 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white no-underline transition hover:bg-white/12"
              >
                Open CV deck
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span>Med school</span>
              <span>URL-synced</span>
              <span>STR-ready</span>
              <span>Williams Rothmans</span>
            </div>
          </div>

          <aside className="rounded-ph border border-white/12 bg-[#111827]/88 p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Live command</p>
                <h2 className="mt-2 text-2xl font-black">Diagram Console</h2>
              </div>
              <span className="rounded-ph bg-[color-mix(in_srgb,var(--ph-accent),transparent_78%)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                Day cycle
              </span>
            </div>
            <div className="mt-5 rounded-ph bg-slate-200 p-4 text-slate-950">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Catalog status</p>
                <p className="text-sm font-bold text-slate-500">TR-VII</p>
              </div>
              <p className="mt-6 text-3xl font-black">{diagramCount} diagrams</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {referenceCount} reference widgets live; the rest are routed STR build surfaces.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-ph border border-white/10 bg-black/16 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Systems</p>
                <p className="mt-2 text-2xl font-black">{systems.length}</p>
              </div>
              <div className="rounded-ph border border-white/10 bg-black/16 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Modes</p>
                <p className="mt-2 text-2xl font-black">{archetypeCount}</p>
              </div>
              <div className="rounded-ph border border-white/10 bg-black/16 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</p>
                <p className="mt-2 text-xl font-black">Ready</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="systems" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ph-accent">Systems deck</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Choose a physiological system</h2>
        </div>
        <p className="max-w-xl text-sm font-medium text-ph-muted">
          Each card opens a routed system page with reference widgets and STR build surfaces.
        </p>
      </section>

      <section aria-label="Physiology systems" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {systems.map((system) => (
          <Link
            key={system.id}
            href={getSystemPath(system.id)}
            className="focus-ring ph-panel group block min-h-48 p-4 no-underline transition hover:-translate-y-0.5 hover:border-[var(--ph-border-strong)] hover:bg-ph-surface2 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-ph border border-[var(--ph-border)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_90%)] px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-ph-accent">
                Live
              </span>
              <span className="text-xs font-bold text-ph-muted">{system.diagrams.length} diagrams</span>
            </div>
            <h3 className="mt-6 text-xl font-black tracking-tight">{system.name}</h3>
            <p className="mt-2 text-sm text-ph-muted">{system.teaser}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ph-surface2">
              <div
                className="h-full rounded-full bg-ph-accent transition-all group-hover:bg-ph-accent2"
                style={{ width: `${Math.max(22, (system.diagrams.filter((diagram) => diagram.status === "reference").length / system.diagrams.length) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-ph-muted">
              {system.diagrams.filter((diagram) => diagram.status === "reference").length} reference widgets
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
