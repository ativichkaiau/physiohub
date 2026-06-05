"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getDiagramById, registry } from "@/lib/registry";

export function ReportError({ diagramId }: { diagramId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState("");
  const diagram = getDiagramById(diagramId);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const href = useMemo(() => {
    const query = searchParams.toString();
    const currentUrl = `${origin}${pathname}${query ? `?${query}` : ""}`;
    const subject = `[Errata] ${diagram.id} - ${diagram.title}`;
    const body = `URL: ${currentUrl}\n\nDescribe the error:\n`;
    return `mailto:${registry.reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [diagram.id, diagram.title, origin, pathname, searchParams]);

  return (
    <footer className="mt-4 border-t border-[var(--ph-border)] pt-4 text-sm text-ph-muted">
      <a className="focus-ring inline-flex rounded-ph hover:text-ph-text" href={href}>
        Report an error in this diagram
      </a>
    </footer>
  );
}
