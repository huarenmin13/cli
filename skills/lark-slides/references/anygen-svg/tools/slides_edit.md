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

## Image usage
- NEVER reference a non-existent or non-local image. Always use absolute paths for images, fonts, and other resources.
- Use ONLY the image path(s) prepared for the slide (to avoid duplicates). Place content images with concrete subjects (UI mockups, illustrations) as `<image slide:role="shape" slide:shape-type="image">` in a split or side layout — do not fade them to low opacity and use as full-screen backgrounds, which creates ghost-like visual noise behind foreground content.

## Incremental processing
- Slides are written and displayed as soon as each one is complete.
- Include up to 5 slides per call (more risks output truncation); split larger decks into multiple calls.
- NEVER call this tool in parallel — always sequentially (wait for one call to finish before the next).
</core_technical_requirements>

<layout_and_design>
Compose every slide's layout from scratch to fit its specific content and the deck's aesthetic direction — follow "Design Thinking", "Aesthetic Guidelines", and "Layout Freedom" in `<svg_reference>`. Do NOT rotate through a fixed menu of canned patterns, and do NOT apply formulaic "diagram" templates — that produces the template-stamped feel we are avoiding. Favor unexpected, asymmetric, content-specific composition: overlap, diagonal flow, grid-breaking elements, a single dominant hero element, generous negative space. Vary the structural arrangement between adjacent slides while keeping the deck's background, card-surface style, and decoration density CONSTANT across the whole deck.

Use visual elements (shapes, lines, icons, accent bars, gradients) to break up text and build hierarchy; apply the accent color sparingly for emphasis; maintain white space and contrast. When text sits on a background image, overlay the image with a semi-transparent shape first so the text stays readable.
</layout_and_design>

<prohibited_practices>
- NEVER use the same "title + bullet list" layout on every slide.
- Don't overflow the 720px target height; don't stack images or charts vertically.
- Never reference non-existent or non-local image paths.
- Avoid walls of text without visual breaks.
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
</quality_standards>
```

