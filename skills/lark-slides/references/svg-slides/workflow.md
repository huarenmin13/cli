# SVG Slides Workflow

## Layer Boundary

This workflow owns local SVG deck generation and local validation. It does not call live APIs, choose a PPE lane, or prove backend acceptance of the generated payload.

The output is a local publish-ready bundle: standalone SVG slide files, source notes, optional assets, validation receipts, and a manifest. It is not published.

## Phase 1: Understand Request

Decide whether the user wants a new deck, a continuation of an existing deck, a repair pass, or a visual-quality pass. Clarify only when the target file, target slides, audience, delivery mode, or requested outcome is genuinely ambiguous.

Audience means the final viewer, not the creator. A specific audience can drive density and evidence style directly. Generic labels such as "users", "clients", or "team" are not specific enough for broad generation unless the user asks not to be interrupted.

## Phase 2: Settle Goal Audience Delivery

Settle three values before designing slides:

- `goal`: what the presentation should make the viewer understand or decide.
- `audience`: who will read or watch it.
- `delivery_mode`: `presented` when a speaker talks over it, `self_read` when it must stand alone.

Do not ask the user to pick tone, palette, density, or style. Those are inferred later by the design brief.

## Phase 3: Build Source Material

Broad topic-only requests require real source material. Search snippets, memory, and internal knowledge are not enough.

Collect full source text before drafting claims. Save a local research file with data points, claims, caveats, and source references. Every important claim or number used later must be traceable from `slide_content.md` back to this source material.

## Phase 4: Resolve Design Brief

Create a design brief after goal, audience, delivery mode, language, page count, and source material are known.

The brief must include:

- `narrative_spine`: the sequence logic and discipline of the deck.
- `depth`: altitude, density, include/exclude rules, and main points per slide.
- `tone`: writing and evidence style.
- `visual_system`: color, typography, layout, imagery, material, and decoration direction.

The design brief is authoritative for the generated deck. Do not override it with generic taste while authoring pages.

## Phase 5: Confirm Outline

For broad topics, create an actual slide sequence, not a chapter list. Use the user's explicit page count when given. Otherwise use 8-12 substantive slides for normal decks, unless the user explicitly asked for a short deck.

When the user gave a detailed outline, use it. When the user reorders, removes, adds, or rewrites slides, the user's outline wins over the brief's `narrative_spine`.

## Phase 6: Write slide_content

Write `slide_content.md` before SVG authoring.

`slide_content.md` records the structure, slide roles, key material, data points, claims, quotes, and source references. It does not lock exact final sentences, image paths, chart layout, or final page composition.

## Phase 7: Lock Visual Direction And Plan Visuals

Translate `visual_system` into concrete deck-level style:

- `aesthetic_direction`: the design language and mood from the brief.
- `color_palette`: consistent deck palette, expressed later as `rgb(...)` / `rgba(...)`.
- `typography`: a stable display/body pairing that matches the brief's category and treatment.
- `visual_assets`: per-slide image and chart needs, including aspect ratio and placement intent.

Unless the user explicitly requests no images, cover, section divider, and closing pages default to a high-impact hero image or generated visual. Record the intended asset, crop/aspect ratio, placement, and text-readability overlay treatment in `visual_assets`; do not leave these page roles as text-only by default.

Plan charts before writing slides. Any real quantitative series that supports a slide's point should use the chart workflow rather than a hand-drawn fake chart.

## Phase 8: Author SVG Pages

Each page is a complete standalone SVG document. Compose freely for the page's content logic. Do not stamp out a fixed template pattern.

For each page, record authoring intent before writing:

- the central idea;
- the layout relationship being encoded;
- visual assets used;
- animation decision, or `static`;
- expected validation risks.

Do not regenerate the whole deck structure after slide files have been authored. Add or remove pages through the existing-deck workflow.

## Output Bundle

The local bundle should contain:

- `slides/*.svg`: one standalone SVG slide per page;
- `slide_content.md`: source-backed content plan;
- `research_notes.md` when source material was gathered;
- `resources/` for chart/image sidecars;
- `manifest.json` from `svg_slides_bundle.mjs`;
- `receipts/validate_svg_deck.json` from the static validator;
- optional browser text-boundary receipt.

## Source Coverage

- Covers manifest sections: system_prompt_workflow, slide_outline_tool, activate_slides_edit_tool, incremental_processing
- Coverage mode: preserve workflow semantics from the source while replacing product-specific tool names with local generation stages.
