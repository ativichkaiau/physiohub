# PhysioHub TR-VII

Next.js 14 App Router shell for the PhysioHub physiology diagram system. The app reads `data/physiohub_diagrams.json`, renders eight system pages, lazy-loads diagram widgets, and ships reference implementations for all five widget archetypes.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

The project is Vercel-ready as a standard Next.js app. Deployment requires a Vercel project/account token outside this local workspace.

## STR Widget Integration

Each STR unit adds one widget at:

```txt
components/widgets/{system}/{diagram}.tsx
```

Widget requirements:

- Default export a React component with no required props.
- Read metadata with `getDiagramById("{system}/{slug}")`.
- Compose only the six primitives in `components/widgets/primitives`.
- Hydrate initial state from `useSearchParams`.
- Debounce updates with `router.replace(pathname + "?" + query, { scroll: false })`.
- Include `<ReportError diagramId="{system}/{slug}" />` after the reference panel.
- Keep domain physics local to the widget; do not add backend, auth, analytics, or new theme liveries.

Register the widget in `components/widgets/WidgetLoader.tsx`:

```tsx
const widgetMap = {
  "cv/wiggers": dynamic(() => import("@/components/widgets/cv/wiggers")),
  "resp/o2-hb": dynamic(() => import("@/components/widgets/resp/o2-hb"))
};
```

Add or update metadata in `data/physiohub_diagrams.json`. The Zod accessor in `lib/registry.ts` validates eight systems and five to fifteen diagrams per system during build.

Current reference widgets:

- `cv/wiggers`: scrubbable timeline
- `cv/frank-starling`: perturbable curve
- `cv/pv-loop`: multi-variable interaction
- `cv/baroreflex`: feedback loop
- `cv/cardiac-output`: multi-variable interaction
- `resp/o2-hb`: perturbable curve
- `resp/vq-matching`: multi-variable interaction
- `nerv/action-potential`: scrubbable timeline
- `endo/hpa-axis`: feedback loop
- `endo/glucose-homeostasis`: feedback loop
- `msk/cross-bridge`: click-to-mechanism
- `msk/length-tension`: perturbable curve
- `gi/gastric-acid`: feedback loop
- `renal/raas`: feedback loop
- `repro/menstrual-cycle`: scrubbable timeline

## Deliverables

- Hub home: `app/page.tsx`
- System route: `app/[system]/page.tsx`
- Diagram route: `app/[system]/[diagram]/page.tsx`
- Theme contract: `docs/THEME_CONTRACT.md`
- UX wireframes and primitive reuse map: `docs/UX_WIREFRAME.md`
- Figma handoff: `docs/FIGMA_HANDOFF.md`
- Primitive docs: `components/widgets/primitives/README.md`
