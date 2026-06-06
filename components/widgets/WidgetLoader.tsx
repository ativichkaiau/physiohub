"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const widgetMap: Record<string, ComponentType> = {
  "cv/wiggers": dynamic(() => import("@/components/widgets/cv/wiggers"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/frank-starling": dynamic(() => import("@/components/widgets/cv/frank-starling"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/pv-loop": dynamic(() => import("@/components/widgets/cv/pv-loop"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/baroreflex": dynamic(() => import("@/components/widgets/cv/baroreflex"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/cardiac-output": dynamic(() => import("@/components/widgets/cv/cardiac-output"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/cardiac-action-potentials": dynamic(() => import("@/components/widgets/cv/cardiac-action-potentials"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/coronary-perfusion": dynamic(() => import("@/components/widgets/cv/coronary-perfusion"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/vascular-compliance": dynamic(() => import("@/components/widgets/cv/vascular-compliance"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/poiseuille-flow": dynamic(() => import("@/components/widgets/cv/poiseuille-flow"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/capillary-starling": dynamic(() => import("@/components/widgets/cv/capillary-starling"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/microcirculation-autoregulation": dynamic(
    () => import("@/components/widgets/cv/microcirculation-autoregulation"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "cv/ecg-intervals": dynamic(() => import("@/components/widgets/cv/ecg-intervals"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/valvular-lesions": dynamic(() => import("@/components/widgets/cv/valvular-lesions"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/shock-states": dynamic(() => import("@/components/widgets/cv/shock-states"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "cv/fetal-circulation-transition": dynamic(
    () => import("@/components/widgets/cv/fetal-circulation-transition"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "resp/o2-hb": dynamic(() => import("@/components/widgets/resp/o2-hb"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/vq-matching": dynamic(() => import("@/components/widgets/resp/vq-matching"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/lung-volumes": dynamic(() => import("@/components/widgets/resp/lung-volumes"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/airway-resistance": dynamic(() => import("@/components/widgets/resp/airway-resistance"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/ventilation-control": dynamic(() => import("@/components/widgets/resp/ventilation-control"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/diffusion-limitation": dynamic(() => import("@/components/widgets/resp/diffusion-limitation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/compliance-pressure-volume": dynamic(
    () => import("@/components/widgets/resp/compliance-pressure-volume"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "resp/dead-space-ventilation": dynamic(() => import("@/components/widgets/resp/dead-space-ventilation"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/oxygen-content": dynamic(() => import("@/components/widgets/resp/oxygen-content"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "resp/respiratory-acid-base": dynamic(() => import("@/components/widgets/resp/respiratory-acid-base"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "nerv/action-potential": dynamic(() => import("@/components/widgets/nerv/action-potential"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/cross-bridge": dynamic(() => import("@/components/widgets/msk/cross-bridge"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "msk/length-tension": dynamic(() => import("@/components/widgets/msk/length-tension"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "gi/gastric-acid": dynamic(() => import("@/components/widgets/gi/gastric-acid"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/hpa-axis": dynamic(() => import("@/components/widgets/endo/hpa-axis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/glucose-homeostasis": dynamic(
    () => import("@/components/widgets/endo/glucose-homeostasis"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "endo/hpt-axis": dynamic(() => import("@/components/widgets/endo/hpt-axis"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/leptin-ghrelin-appetite": dynamic(
    () => import("@/components/widgets/endo/leptin-ghrelin-appetite"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "endo/adrenal-medulla": dynamic(() => import("@/components/widgets/endo/adrenal-medulla"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "endo/hormone-dose-response": dynamic(
    () => import("@/components/widgets/endo/hormone-dose-response"),
    {
      loading: () => <WidgetLoading />,
      ssr: false
    }
  ),
  "nerv/reflex-arc": dynamic(() => import("@/components/widgets/nerv/reflex-arc"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "nerv/synaptic-transmission": dynamic(
    () => import("@/components/widgets/nerv/synaptic-transmission"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/phototransduction": dynamic(
    () => import("@/components/widgets/nerv/phototransduction"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/thyroid-hormone-synthesis": dynamic(
    () => import("@/components/widgets/endo/thyroid-hormone-synthesis"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/pituitary-hormone-map": dynamic(
    () => import("@/components/widgets/endo/pituitary-hormone-map"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/calcium-homeostasis": dynamic(
    () => import("@/components/widgets/endo/calcium-homeostasis"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "endo/insulin-glucagon": dynamic(
    () => import("@/components/widgets/endo/insulin-glucagon"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "nerv/receptive-fields": dynamic(
    () => import("@/components/widgets/nerv/receptive-fields"),
    { loading: () => <WidgetLoading />, ssr: false }
  ),
  "renal/raas": dynamic(() => import("@/components/widgets/renal/raas"), {
    loading: () => <WidgetLoading />,
    ssr: false
  }),
  "repro/menstrual-cycle": dynamic(() => import("@/components/widgets/repro/menstrual-cycle"), {
    loading: () => <WidgetLoading />,
    ssr: false
  })
};

const PendingWidget = dynamic(() => import("@/components/widgets/PendingWidget"), {
  loading: () => <WidgetLoading />,
  ssr: false
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
