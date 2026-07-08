"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isInDeck, toggleDeck } from "@/lib/deck";

/**
 * Bookmark the current diagram AND its exact state (the URL query encodes every
 * slider/toggle) into the personal deck. Saved states are surfaced in the ⌘K
 * command palette.
 */
export function SaveToDeck({ title, systemId }: { title: string; systemId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const url = query ? `${pathname}?${query}` : pathname;
  const [saved, setSaved] = useState(false);

  const sync = useCallback(() => setSaved(isInDeck(url)), [url]);

  useEffect(() => {
    sync();
    window.addEventListener("ph:deck-changed", sync);
    return () => window.removeEventListener("ph:deck-changed", sync);
  }, [sync]);

  const onClick = () => {
    setSaved(toggleDeck({ url, title, systemId, hasState: query.length > 0 }));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from deck" : "Save to deck"}
      className={`focus-ring ph-clay-button inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${
        saved ? "text-ph-accent" : "text-ph-muted"
      }`}
      title={saved ? "Saved to your deck" : "Save this state to your deck"}
    >
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
