import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DiagramHeader } from "@/components/DiagramHeader";
import { WidgetLoader } from "@/components/widgets/WidgetLoader";
import { getAllDiagrams, getDiagramByRoute } from "@/lib/registry";

export function generateStaticParams() {
  return getAllDiagrams().map((diagram) => ({
    system: diagram.systemId,
    diagram: diagram.slug
  }));
}

export function generateMetadata({ params }: { params: { system: string; diagram: string } }): Metadata {
  const diagram = getDiagramByRoute(params.system, params.diagram);
  if (!diagram) {
    return {};
  }

  return {
    title: diagram.title,
    description: diagram.teaser
  };
}

export default function DiagramPage({ params }: { params: { system: string; diagram: string } }) {
  const diagram = getDiagramByRoute(params.system, params.diagram);
  if (!diagram) {
    notFound();
  }

  return (
    <>
      <DiagramHeader diagram={diagram} />
      <Suspense
        fallback={
          <section className="ph-widget-shell">
            <div className="ph-panel h-64 animate-pulse" />
          </section>
        }
      >
        <WidgetLoader diagramId={diagram.id} />
      </Suspense>
    </>
  );
}
