"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const widgetMap: Record<string, ComponentType> = {
  "cv/wiggers": dynamic(() => import("@/components/widgets/cv/wiggers"), {
    loading: () => <WidgetLoading />
  }),
  "cv/frank-starling": dynamic(() => import("@/components/widgets/cv/frank-starling"), {
    loading: () => <WidgetLoading />
  }),
  "cv/pv-loop": dynamic(() => import("@/components/widgets/cv/pv-loop"), {
    loading: () => <WidgetLoading />
  }),
  "cv/baroreflex": dynamic(() => import("@/components/widgets/cv/baroreflex"), {
    loading: () => <WidgetLoading />
  }),
  "cv/cardiac-output": dynamic(() => import("@/components/widgets/cv/cardiac-output"), {
    loading: () => <WidgetLoading />
  }),
  "resp/o2-hb": dynamic(() => import("@/components/widgets/resp/o2-hb"), {
    loading: () => <WidgetLoading />
  }),
  "resp/vq-matching": dynamic(() => import("@/components/widgets/resp/vq-matching"), {
    loading: () => <WidgetLoading />
  }),
  "nerv/action-potential": dynamic(() => import("@/components/widgets/nerv/action-potential"), {
    loading: () => <WidgetLoading />
  }),
  "msk/cross-bridge": dynamic(() => import("@/components/widgets/msk/cross-bridge"), {
    loading: () => <WidgetLoading />
  }),
  "msk/length-tension": dynamic(() => import("@/components/widgets/msk/length-tension"), {
    loading: () => <WidgetLoading />
  }),
  "gi/gastric-acid": dynamic(() => import("@/components/widgets/gi/gastric-acid"), {
    loading: () => <WidgetLoading />
  }),
  "endo/hpa-axis": dynamic(() => import("@/components/widgets/endo/hpa-axis"), {
    loading: () => <WidgetLoading />
  }),
  "endo/glucose-homeostasis": dynamic(() => import("@/components/widgets/endo/glucose-homeostasis"), {
    loading: () => <WidgetLoading />
  }),
  "renal/raas": dynamic(() => import("@/components/widgets/renal/raas"), {
    loading: () => <WidgetLoading />
  }),
  "repro/menstrual-cycle": dynamic(() => import("@/components/widgets/repro/menstrual-cycle"), {
    loading: () => <WidgetLoading />
  })
};

const PendingWidget = dynamic(() => import("@/components/widgets/PendingWidget"), {
  loading: () => <WidgetLoading />
});

function WidgetLoading() {
  return (
    <section className="ph-widget-shell">
      <div className="ph-panel h-64 animate-pulse" />
    </section>
  );
}

export function WidgetLoader({ diagramId }: { diagramId: string }) {
  const Widget = widgetMap[diagramId] ?? PendingWidget;
  return <Widget />;
}
