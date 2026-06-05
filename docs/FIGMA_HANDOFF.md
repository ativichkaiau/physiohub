# TR-VII PhysioHub Figma Handoff

This session does not have a Figma connector available. Use this handoff with `docs/UX_WIREFRAME.md` to recreate the Figma page directly.

## Page

Name: `TR-VII PhysioHub UX Wireframes`

Frames:

1. `01 Hub Home - 320/768/1440`
2. `02 System Page - Cardiovascular`
3. `03 Archetype - Scrubbable Timeline`
4. `04 Archetype - Perturbable Curve`
5. `05 Archetype - Feedback Loop`
6. `06 Archetype - Click to Mechanism`
7. `07 Archetype - Multi-variable Interaction`

## Layout Rules

- Mobile first at 320 px.
- Cards use 8 px radius or less.
- Diagram page regions are always present: header, concept, main, controls, references, report footer, share state indicator.
- At 320 px, controls collapse below main content and references follow controls.
- Header uses system breadcrumb, diagram title, and archetype tag.

## Tokens

Use the theme contract in `docs/THEME_CONTRACT.md`. The default visual direction is Williams Rothmans: charcoal surfaces, cyan signal, amber secondary emphasis, violet/rose tertiary curves, and neutral reference overlays.

## Primitive Reuse

The one-page primitive reuse map is in `docs/UX_WIREFRAME.md` section 11. No Figma component outside the six primitives should be introduced for diagram interactions without a note attached to the frame.

## Prototype Notes

- Timeline prototype: scrub bar drag changes cursor and value chips.
- Curve prototype: slider drag shifts current curve against baseline.
- Feedback prototype: perturbation button pulses node and edge, break-feedback toggle disables return edge.
- Mechanism prototype: stepper moves through discrete states; last state disables Next unless loop is on.
- Multi-variable prototype: multiple sliders reshape one plot and update live readouts.
