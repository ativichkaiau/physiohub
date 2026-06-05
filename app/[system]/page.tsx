import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { getDiagramPath, getSystem, getSystemEmoji, getSystems } from "@/lib/registry";

export function generateStaticParams() {
  return getSystems().map((system) => ({ system: system.id }));
}

export function generateMetadata({ params }: { params: { system: string } }): Metadata {
  const system = getSystem(params.system);
  if (!system) {
    return {};
  }

  return {
    title: system.name,
    description: system.teaser
  };
}

export default function SystemPage({ params }: { params: { system: string } }) {
  const system = getSystem(params.system);
  if (!system) {
    notFound();
  }
  const referenceCount = system.diagrams.filter((diagram) => diagram.status === "reference").length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8">
      <section className="ph-hero mb-6 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="focus-ring inline-flex items-center gap-1 rounded-ph text-sm font-medium text-ph-muted hover:text-ph-text">
              ← All systems
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span aria-hidden="true" className="text-4xl leading-none sm:text-5xl">
                {getSystemEmoji(system.id)}
              </span>
              <div>
                <p className="ph-kicker">{system.shortName}</p>
                <h1 className="mt-1.5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{system.name}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-base text-ph-muted">{system.teaser}</p>
          </div>
          <dl className="grid grid-cols-3 gap-x-8 gap-y-2 sm:min-w-[280px]">
            <div>
              <dt className="ph-kicker">📊 Diagrams</dt>
              <dd className="mt-1.5 text-2xl font-bold tabular-nums">{system.diagrams.length}</dd>
            </div>
            <div>
              <dt className="ph-kicker">✅ Live</dt>
              <dd className="mt-1.5 text-2xl font-bold tabular-nums" style={{ color: "var(--ph-ok)" }}>{referenceCount}</dd>
            </div>
            <div>
              <dt className="ph-kicker">🚧 Pending</dt>
              <dd className="mt-1.5 text-2xl font-bold tabular-nums text-ph-muted">{system.diagrams.length - referenceCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ph-kicker">📂 Diagrams</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Open a widget</h2>
        </div>
        <p className="text-xs text-ph-muted">
          Click any card to launch · all state syncs to the URL
        </p>
      </section>

      <section aria-label={`${system.name} diagrams`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {system.diagrams.map((diagram) => (
          <Link
            key={diagram.id}
            href={getDiagramPath(system.id, diagram.slug)}
            className="focus-ring ph-panel group relative block min-h-52 overflow-hidden p-4 no-underline transition duration-200 hover:-translate-y-0.5 hover:border-[var(--ph-border-strong)] hover:bg-ph-surface2 hover:shadow-[0_8px_28px_-12px_color-mix(in_srgb,var(--ph-accent),transparent_75%)] sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ArchetypeBadge archetype={diagram.archetype} compact />
              <span
                className={
                  diagram.status === "reference"
                    ? "inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--ph-ok),transparent_60%)] bg-[color-mix(in_srgb,var(--ph-ok),transparent_90%)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    : "inline-flex items-center gap-1 rounded-full border border-[var(--ph-border)] bg-ph-surface2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ph-muted"
                }
                style={diagram.status === "reference" ? { color: "var(--ph-ok)" } : undefined}
              >
                <span aria-hidden="true">{diagram.status === "reference" ? "🟢" : "🛠️"}</span>
                {diagram.status === "reference" ? "Live" : "In dev"}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold leading-tight tracking-tight transition-colors group-hover:text-ph-accent">
              {diagram.title}
            </h3>
            <p className="mt-2 text-sm text-ph-muted">{diagram.teaser}</p>
            <div className="mt-5 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.12em] text-ph-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-ph-accent" />
                URL synced
              </span>
              <span className="text-ph-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
