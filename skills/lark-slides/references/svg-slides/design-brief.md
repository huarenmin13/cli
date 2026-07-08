# SVG Slides Design Brief

## Inputs

Resolve the design brief after these inputs are known:

- topic and goal;
- audience;
- delivery mode;
- language;
- page count when known;
- source material;
- user-fixed brand, color, or content constraints;
- one to three short visual-direction phrases.

Do not ask the user to choose tone, density, palette, or typography unless they volunteered hard constraints.

## Output Contract

The brief must produce:

- `narrative_spine`;
- `depth`;
- `tone`;
- `visual_system`.

These outputs govern outline, content density, wording, asset choices, typography, color, layout, and decoration.

## narrative_spine

`narrative_spine` defines the slide sequence discipline. It is the default source of order, sectioning, and narrative movement.

The user can override it by giving or editing an outline. After that point, the user outline wins.

## depth

`depth` decides altitude and density:

- how much context each slide carries;
- what to include and exclude;
- how many main points per slide;
- how source evidence should appear;
- whether a page should split instead of cram.

## tone

`tone` controls writing style and evidence posture. It should reflect the audience and delivery mode.

Presented decks can use shorter on-slide wording because the speaker carries context. Self-read decks need more complete explanatory text but still must avoid walls of text.

## visual_system

`visual_system` is the authority for look and feel. It should include:

- color logic;
- typography category and treatment;
- layout grammar;
- imagery or material direction;
- page-role imagery defaults for cover, section divider, and closing pages;
- decoration and motif rules;
- constraints to avoid.

Unless the user explicitly requests no images, `visual_system` must specify how cover, section divider, and closing pages use a high-impact hero image or generated visual. The brief should describe the imagery subject, treatment, crop attitude, and how foreground text stays readable.

Font mapping must preserve the same category and treatment. Do not swap serif and sans, ignore uppercase treatment, or pick generic fonts when the brief calls for a distinctive style.

## How It Drives Generation

Use the brief in this order:

1. Shape the outline from `narrative_spine`.
2. Size the content from `depth`.
3. Write titles and evidence from `tone`.
4. Build the deck-level style from `visual_system`.
5. Author each slide's layout from the content logic plus the visual system.

## Source Coverage

- Covers manifest sections: resolve_design_brief
- Coverage mode: preserve design brief inputs, output contract, and downstream influence on outline and page authoring.
