import Link from "next/link";
import { archetypeMeta, getDiagramById, getSystemEmoji, type DiagramMeta } from "@/lib/registry";

/**
 * "See also" rail — turns the catalog into a concept web. Renders the diagrams
 * listed in the current diagram's `related` field (see data/physiohub_diagrams.json).
 */
export function RelatedDiagrams({ diagramId }: { diagramId: string }) {
  let current: DiagramMeta;
  try {
    current = getDiagramById(diagramId);
  } catch {
    return null;
  }
  const ids = current.related ?? [];
  const related = ids
    .map((id) => {
      try {
        return getDiagramById(id);
      } catch {
        return null;
      }
    })
    .filter((d): d is DiagramMeta => d !== null);

  if (!related.length) return null;

  return (
    <section
      className="ph-related-rail mx-auto mt-6 w-full max-w-[1500px] px-4 sm:px-6"
      aria-label="Related diagrams"
    >
      <div className="ph-panel p-4 sm:p-5">
        <p className="ph-kicker">🔗 See also</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((d) => (
            <Link
              key={d.id}
              href={`/${d.systemId}/${d.slug}`}
              className="focus-ring ph-clay-button group flex items-center gap-3 rounded-ph px-3 py-2.5 no-underline"
            >
              <span aria-hidden="true" className="text-lg leading-none">{getSystemEmoji(d.systemId)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ph-text transition-colors group-hover:text-ph-accent">
                  {d.title}
                </span>
                <span className="block truncate text-xs text-ph-muted">{d.systemName}</span>
              </span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ph-muted-2">
                {archetypeMeta[d.archetype].shortLabel}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
