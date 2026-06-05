import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { getDiagramPath, getSystem, getSystemPath, getSystems } from "@/lib/registry";

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
      <section className="ph-grid-panel mb-5 rounded-[24px] px-5 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="focus-ring inline-flex rounded-ph text-sm font-semibold text-slate-300 hover:text-white">
              All systems
            </Link>
            <p className="ph-kicker mt-5">{system.shortName} operating deck</p>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{system.name}</h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-slate-300">{system.teaser}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
            <div className="rounded-ph border border-white/10 bg-black/18 p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Diagrams</p>
              <p className="mt-2 text-2xl font-black">{system.diagrams.length}</p>
            </div>
            <div className="rounded-ph border border-white/10 bg-black/18 p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Reference</p>
              <p className="mt-2 text-2xl font-black">{referenceCount}</p>
            </div>
            <div className="rounded-ph border border-white/10 bg-black/18 p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mode</p>
              <p className="mt-2 text-xl font-black">TR-VII</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ph-accent">Diagram manifest</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Launch a widget</h2>
        </div>
        <Link
          href={getSystemPath(system.id)}
          className="focus-ring hidden rounded-ph border border-[var(--ph-border)] bg-ph-surface px-3 py-2 text-sm font-semibold text-ph-muted sm:inline-flex"
          aria-current="page"
        >
          Current deck
        </Link>
      </section>

      <section aria-label={`${system.name} diagrams`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {system.diagrams.map((diagram) => (
          <Link
            key={diagram.id}
            href={getDiagramPath(system.id, diagram.slug)}
            className="focus-ring ph-panel group block min-h-52 p-4 no-underline transition hover:-translate-y-0.5 hover:border-[var(--ph-border-strong)] hover:bg-ph-surface2 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ArchetypeBadge archetype={diagram.archetype} compact />
              <span
                className={
                  diagram.status === "reference"
                    ? "rounded-ph border border-[color-mix(in_srgb,var(--ph-accent),transparent_55%)] bg-[color-mix(in_srgb,var(--ph-accent),transparent_88%)] px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-ph-accent"
                    : "rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-ph-muted"
                }
              >
                {diagram.status === "reference" ? "Reference" : "STR build"}
              </span>
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight">{diagram.title}</h3>
            <p className="mt-3 text-sm text-ph-muted">{diagram.teaser}</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ph-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ph-accent" />
              URL synced
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
