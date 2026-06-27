"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ShareStateIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 420);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  async function copyState() {
    const query = searchParams.toString();
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      className="focus-ring ph-share-state ph-clay-button inline-flex items-center gap-2 px-3 py-2 text-sm text-ph-muted"
      onClick={copyState}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-ph-accent data-[pulse=true]:animate-ping"
        data-pulse={pulse}
      />
      <span aria-live="polite">{copied ? "Copied" : "URL synced"}</span>
    </button>
  );
}
