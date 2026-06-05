const docs = [
  {
    title: "UX Wireframes",
    path: "docs/UX_WIREFRAME.md",
    description: "Seven wireframes, interaction notes, states, and primitive reuse map."
  },
  {
    title: "Figma Handoff",
    path: "docs/FIGMA_HANDOFF.md",
    description: "Frame list and recreation notes for Figma."
  },
  {
    title: "Theme Contract",
    path: "docs/THEME_CONTRACT.md",
    description: "Williams Rothmans CSS variable contract."
  },
  {
    title: "Primitive README",
    path: "components/widgets/primitives/README.md",
    description: "Prop types and examples for the six shared widget primitives."
  }
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-3 text-xs font-semibold uppercase text-ph-accent">Handoff docs</p>
      <h1 className="text-3xl font-semibold leading-tight">Wireframe and build documentation</h1>
      <p className="mt-3 max-w-2xl text-ph-muted">
        These files live in the workspace for product, Figma, and STR implementation handoff.
      </p>
      <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Documentation links">
        {docs.map((doc) => (
          <div key={doc.path} className="ph-panel p-5">
            <h2 className="text-lg font-semibold">{doc.title}</h2>
            <p className="mt-2 text-sm text-ph-muted">{doc.description}</p>
            <code className="mt-4 inline-flex max-w-full break-all rounded-ph bg-ph-surface2 px-2 py-1 text-sm text-ph-accent">
              {doc.path}
            </code>
          </div>
        ))}
      </section>
    </div>
  );
}
