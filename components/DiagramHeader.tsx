import Link from "next/link";
import { Suspense } from "react";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { ShareStateIndicator } from "@/components/ShareStateIndicator";
import type { DiagramMeta } from "@/lib/registry";

export function DiagramHeader({ diagram }: { diagram: DiagramMeta }) {
  return (
    <section className="border-b border-[var(--ph-border)] bg-[color-mix(in_srgb,var(--ph-surface),transparent_4%)]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ph-muted">
            <Link className="focus-ring rounded-ph hover:text-ph-text" href="/">
              Systems
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="focus-ring rounded-ph hover:text-ph-text" href={`/${diagram.systemId}`}>
              {diagram.systemName}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{diagram.title}</h1>
            <ArchetypeBadge archetype={diagram.archetype} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="focus-ring rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2 text-sm font-semibold text-ph-muted hover:border-[var(--ph-border-strong)] hover:text-ph-text"
            href={`/${diagram.systemId}`}
          >
            Back
          </Link>
          <Suspense
            fallback={
              <span className="inline-flex rounded-ph border border-[var(--ph-border)] bg-ph-surface2 px-3 py-2 text-sm text-ph-muted">
                URL synced
              </span>
            }
          >
            <ShareStateIndicator />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
