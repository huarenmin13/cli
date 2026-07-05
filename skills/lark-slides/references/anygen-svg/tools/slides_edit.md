---
id: slides_edit
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: svg_author
profiles:
  - local_svg_deck
  - imported_pptx
  - template_reference
exposure: runtime
order: 40
cardinality: once_or_more
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - initial_deck_generation
  - slide_revision
consumes:
  - outline/deck.json
  - content/slide_content.json
  - content/slide_copy_plan.json
  - brief/visual_system.json
  - assets/assets_manifest.json
  - assets/asset_inventory.json
produces:
  - slides/*.svg
  - receipts/tool_calls/svg_author/slides_edit.json
completion_gate:
  - svg_protocol_valid
  - slide_matches_outline_content_assets
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slides_edit

写单页 SVG 文档。tool_edit_svg.go.tmpl

```text
Write the SVG document for one or more slide pages in a presentation project. The `slides` parameter is an array — each item edits one slide file independently. Slides are processed and displayed incrementally as each one completes.

This tool is the only way to make slide content visible to the user. It writes content into the .slides manifest and triggers frontend rendering. The .slides manifest is the source of truth, and only this tool updates it — writing files through any other method (sandbox_write_file, sandbox_exec_command, etc.) has no effect on the final presentation.

<slide_quality_mindset>
Each slide will be projected in front of an audience. Before writing, ask:
- Would I be proud to present this in a Fortune 500 boardroom?
- If there's data, is it in a chart or buried in text?
- If there's a concept, is there an image or just words on a background?

A text-only slide with decorative shapes signals skipped preparation. It is rarely the right solution.
</slide_quality_mindset>

<core_technical_requirements>
## SVG document
- Each slide item's `svg_code` parameter MUST contain a single `<svg slide:role="slide" ...>` element as the root — a standard SVG document carrying private `slide:*` attributes. See `<svg_reference>` for the full element/attribute schema.
- This is SVG, NOT HTML and NOT any XML DSL. Use only the elements and attributes documented in `<svg_reference>`.
- DO NOT wrap with `<presentation>` — each item edits one slide at a time.
- The slide's `id` should match the filename (e.g., `slide_01_cover.svg` uses `id="cover"`).
- Local SVGlide binding: only render `audience_copy` into visible SVG text. Never render `production_instruction`, `Sources:`, `source note`, asset selection rationale, or layout instructions as visible audience copy.

## Image usage
- NEVER reference a non-existent or non-local image. Always use absolute paths for images, fonts, and other resources.
- Use ONLY the image path(s) prepared for the slide (to avoid duplicates). Place content images with concrete subjects (UI mockups, illustrations) as `<image slide:role="shape" slide:shape-type="image">` in a split or side layout — do not fade them to low opacity and use as full-screen backgrounds, which creates ghost-like visual noise behind foreground content.
- When `assets_plan` contains real image assets for a slide, the SVG must reference them with `<image slide:role="image" slide:shape-type="image" ...>`.
- When the visual contract requires real images, authoring six or more `type:none` slides in an 8-page deck is a quality failure unless the contract explicitly allows text-only output.
- If the deck is about a company, brand, product, person, place, team, event, film, book, or financial-report company, use at least one real, source-traceable subject image in the deck. Charts alone are not sufficient for these subjects.
- For entity-driven decks, the cover must use a real cover hero image or a strong real subject visual. Examples: product/device photo, official company/brand image, venue/place photo, team/event photo, or chip/hardware photo for semiconductor reports.
- A `no_image_reason` is valid only for explicitly chart-only, vector-only, or abstract data requests. Do not use "this is a data report" to bypass real imagery for a named company or brand.
- Resolve image hrefs relative to the SVG file location. If slides live in `slides/*.svg` and assets live in `assets/...`, use `../assets/...` inside each slide SVG.

## Incremental processing
- Slides are written and displayed as soon as each one is complete.
- Include up to 5 slides per call (more risks output truncation); split larger decks into multiple calls.
- NEVER call this tool in parallel — always sequentially (wait for one call to finish before the next).
</core_technical_requirements>

<layout_and_design>
Compose every slide's layout from scratch to fit its specific content and the deck's aesthetic direction — follow "Design Thinking", "Aesthetic Guidelines", and "Layout Freedom" in `<svg_reference>`. Do NOT rotate through a fixed menu of canned patterns, and do NOT apply formulaic "diagram" templates — that produces the template-stamped feel we are avoiding. Favor unexpected, asymmetric, content-specific composition: overlap, diagonal flow, grid-breaking elements, a single dominant hero element, generous negative space. Vary the structural arrangement between adjacent slides while keeping the deck's background, surface treatment, and decoration density coherent across the whole deck.

Use visual elements (shapes, lines, icons, accent bars, gradients, masks, image crops, timelines, maps, pitch diagrams, evidence grids, and typographic scale shifts) to break up text and build hierarchy; apply the accent color sparingly for emphasis; maintain white space and contrast. When text sits on a background image, prefer a full-bleed gradient veil, dark/light scrim, edge fade, or local contrast patch that belongs to the image composition. A bordered rounded text card is allowed only when it represents a distinct object such as a score bug, quote card, stat badge, callout label, or grouped comparison item.

### Layout rhythm discipline

- Use the outline's `layout_archetype` as a hard input. Do not silently replace it with the same split layout used on neighboring pages.
- Before writing each SVG, compare this slide's `layout_archetype` and `layout_signature` with the previous and next slide.
- If the current composition is still visually equivalent to a previous slide, change the SVG structure before writing final markup.
- For chart slides, vary the composition: chart can be the hero, the axis can become a route, a statement can become a ledger, peers can become a field, and cash flow can become a bridge. Do not repeatedly place text on the left and a chart on the right.
- `content_thinking.Layout` must include `layout_archetype`, `layout_signature`, and a one-sentence difference from the adjacent slide.

### Text container discipline

- Text containers are a last-mile readability device, not the default layout language.
- Do not place the main message of most slides inside floating rounded rectangles.
- A deck may repeat a small surface style, but it must not repeat the same "dark rounded box with title/value/body" construction as the dominant object across pages.
- For every slide, first choose a content-specific visual structure: full-bleed editorial cover, split-image argument, tactical field, route map, timeline, evidence collage, annotated photograph, stat wall, chart page, or closing poster. Use cards only after that structure is clear.
- If a slide uses multiple boxes, vary the family intentionally: borderless labels, direct-on-image type, connected nodes, table rows, image captions, or single large stat. Do not make every fact its own boxed panel.

### Rendered visual safety discipline

- Treat the SVG viewBox as a hard canvas. Keep meaningful text, charts, labels, and non-bleed imagery inside a 48px safe area unless the element is an intentional full-bleed image/background.
- Every title, subtitle, label, and metric must pass text-fit before delivery. If estimated text length exceeds its container, reduce font size, increase container size, wrap deliberately, or split the message.
- `foreignObject` text boxes must have enough height for the planned line count. Do not rely on clipping or hidden overflow.
- Standalone `<text>` must be used only for short labels or numbers. Long prose must use a fitted `foreignObject` or multiple manually placed lines.
- Timeline labels and axis labels must have non-overlapping estimated boxes. If adjacent labels collide, stagger them, reduce type, or move one label to a callout.
- Before finalizing each SVG, perform a manual canvas check: no visible text cut at the right/bottom edge, no labels glued together, and no important object partly outside the slide unless it is an intentional image bleed.
</layout_and_design>

<prohibited_practices>
- NEVER use the same "title + bullet list" layout on every slide.
- Don't overflow the 720px target height; don't stack images or charts vertically.
- Never reference non-existent or non-local image paths.
- Avoid walls of text without visual breaks.
- Avoid decks where repeated rounded text boxes become the primary visual system.
- Avoid converting every score, person, or takeaway into a bordered card when a direct label, image annotation, axis, route marker, or typographic lockup would carry the message better.
- Do not deliver any SVG that would fail the rendered visual gate: out-of-canvas text, clipped foreignObject text, collided timeline/axis labels, or important content outside the safe area.
- Do not deliver an entity-driven deck with zero real image assets or a cover without a real subject visual unless the user explicitly requested chart-only/vector-only output.
</prohibited_practices>

<visualization_requirements>
- Incorporate charts when data is available; use large stat numbers for key metrics (e.g., "$150B" as a prominent element).
- Each column may contain at most one chart/graph/image.
- Only chart real, source-verified data — never fabricate numerical data.
</visualization_requirements>

<thinking_process_instructions>
Before writing the SVG, use the `content_thinking` parameter to document:
1. **Visual assets**: which images/charts you will use (list file paths). If none are available, the slide is missing preparation — go prepare visuals first.
2. **Layout**: what composition best fits this content, and how it differs from adjacent slides.
3. **Key message**: the ONE takeaway, and how typography and spacing emphasize it.
4. **Data visualization**: can any content be shown as a chart or large stat number instead of text?
5. **Composition**: how you distribute elements across the canvas to avoid empty space.
</thinking_process_instructions>

<quality_standards>
- All content must be verifiable — never use fabricated data or present subjective assessments as fact.
- Stay consistent with the style_instruction provided in slide_outline.
- Do not deliver a deck when the cover looks like a report card instead of a deliberate first impression.
- Do not deliver a deck when most slides use the same card layout without rhythm variation.
- Do not deliver a deck when more than one third of the slides are dominated by generic boxed text panels, unless the user explicitly asked for an operational dashboard/report.
- Do not deliver a deck when images are present but do not prove or clarify the slide message.
- Do not deliver a deck when process/craft/product evidence is compressed into too few visuals.
- Do not deliver a real brand/product/place/person deck that uses mostly abstract decoration.
- Do not deliver a deck whose visual hierarchy is weaker than a user-provided benchmark.
- When any of these weaknesses appear, revise the SVGs before final delivery. Prefer stronger hero composition, fewer words, denser evidence pages, and more semantically specific images.
- When a benchmark exists and the current deck is weaker, repair toward the benchmark's quality dimensions: match or exceed image pressure, evidence density, typography hierarchy, and page rhythm while preserving factual correctness and source provenance.
- Do not repair by copying benchmark SVG markup or exact layout coordinates.
</quality_standards>
```
