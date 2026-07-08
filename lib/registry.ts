import registryJson from "@/data/physiohub_diagrams.json";
import { z } from "zod";

export const ArchetypeSchema = z.enum([
  "scrubbable-timeline",
  "perturbable-curve",
  "feedback-loop",
  "click-to-mechanism",
  "multi-variable-interaction"
]);

const ReferenceSchema = z.object({
  source: z.string().min(1),
  pages: z.string().optional()
});

const DiagramSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  archetype: ArchetypeSchema,
  status: z.enum(["reference", "planned"]),
  teaser: z.string().min(1),
  concept: z.string().min(1),
  references: z.array(ReferenceSchema).min(1),
  related: z.array(z.string()).optional()
});

const SystemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  status: z.enum(["live", "planned"]),
  teaser: z.string().min(1),
  diagrams: z.array(DiagramSchema).min(5).max(20)
});

const RegistrySchema = z.object({
  reportEmail: z.string().email(),
  systems: z.array(SystemSchema).length(8)
});

export type Archetype = z.infer<typeof ArchetypeSchema>;
export type DiagramReference = z.infer<typeof ReferenceSchema>;
export type DiagramMeta = z.infer<typeof DiagramSchema> & {
  systemId: string;
  systemName: string;
  systemShortName: string;
};
export type SystemMeta = z.infer<typeof SystemSchema>;

const parsedRegistry = RegistrySchema.parse(registryJson);

export const registry = parsedRegistry;

export const archetypeMeta: Record<
  Archetype,
  { label: string; shortLabel: string; glyph: string; emoji: string }
> = {
  "scrubbable-timeline": {
    label: "Scrubbable Timeline",
    shortLabel: "Timeline",
    glyph: "T",
    emoji: "⏱️"
  },
  "perturbable-curve": {
    label: "Perturbable Curve",
    shortLabel: "Curve",
    glyph: "C",
    emoji: "📈"
  },
  "feedback-loop": {
    label: "Feedback Loop",
    shortLabel: "Loop",
    glyph: "F",
    emoji: "🔄"
  },
  "click-to-mechanism": {
    label: "Click-to-Mechanism",
    shortLabel: "Mechanism",
    glyph: "M",
    emoji: "⚙️"
  },
  "multi-variable-interaction": {
    label: "Multi-variable Interaction",
    shortLabel: "Multi-var",
    glyph: "V",
    emoji: "🎛️"
  }
};

// System-level emojis. Lives next to the registry so any surface (homepage,
// system page, diagram chrome) gets the same icon for the same system.
export const systemEmoji: Record<string, string> = {
  cv: "❤️",
  resp: "🫁",
  nerv: "🧠",
  msk: "💪",
  gi: "🍽️",
  endo: "⚖️",
  renal: "🫘",
  repro: "🌱"
};

export function getSystemEmoji(systemId: string) {
  return systemEmoji[systemId] ?? "🔬";
}

const systemsById = new Map(parsedRegistry.systems.map((system) => [system.id, system]));

const diagrams = parsedRegistry.systems.flatMap((system) =>
  system.diagrams.map((diagram) => ({
    ...diagram,
    systemId: system.id,
    systemName: system.name,
    systemShortName: system.shortName
  }))
);

const diagramsById = new Map(diagrams.map((diagram) => [diagram.id, diagram]));
const diagramsByRoute = new Map(diagrams.map((diagram) => [`${diagram.systemId}/${diagram.slug}`, diagram]));

export function getSystems() {
  return parsedRegistry.systems;
}

export function getSystem(systemId: string) {
  return systemsById.get(systemId);
}

export function getDiagramById(id: string): DiagramMeta {
  const diagram = diagramsById.get(id);
  if (!diagram) {
    throw new Error(`Unknown PhysioHub diagram id: ${id}`);
  }
  return diagram;
}

export function getDiagramByRoute(systemId: string, slug: string) {
  return diagramsByRoute.get(`${systemId}/${slug}`);
}

export function getAllDiagrams() {
  return diagrams;
}

export function getReferenceDiagramCount(system: SystemMeta) {
  return system.diagrams.filter((diagram) => diagram.status === "reference").length;
}

export function getDiagramPath(systemId: string, slug: string) {
  return `/${systemId}/${slug}`;
}

export function getSystemPath(systemId: string) {
  return `/${systemId}`;
}
