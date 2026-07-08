# SVG Slides Protocol

## Canvas

- Each page is one standalone SVG file.
- Root must contain `xmlns="http://www.w3.org/2000/svg"`.
- Root must contain `xmlns:slide="https://slides.bytedance.com/ns"`.
- Root must contain `slide:role="slide"`.
- Root must contain an `id`.
- Root must contain `viewBox="0 0 960 540"`.
- Child coordinates are in viewBox units.
- Do not rely on HTML document behavior. SVG nodes use SVG semantics; XHTML appears only inside approved `foreignObject` children.
- This 960x540 canvas is the CLI adaptation target. The preserved source snapshot may mention other defaults, but generated local bundles must use 960x540.

## Background

- Exactly one rendered background is required.
- Optional `<defs>` may appear first.
- The first rendered child after optional `<defs>` must be a `<rect>` or `<image>` with `slide:role="background"`.
- Background must cover the full canvas.
- Gradient backgrounds must reference gradients declared in the same slide's `<defs>`.
- A full-bleed image background should be an `<image slide:role="background">`.
- Text scrims over image backgrounds are normal shape overlays after the background, not additional backgrounds.

## Text

- Plain text uses `foreignObject slide:role="shape" slide:shape-type="text"`.
- Text `foreignObject` needs numeric `x`, `y`, `width`, and `height`.
- The first direct XHTML child must be `p`, `ul`, `ol`, `h1`, `h2`, `h3`, or `small`.
- Do not wrap text in `div` or `section`.
- Do not put bare text directly under `foreignObject`.
- Text style belongs in `style`.
- `font-size` must include `px`.
- Text color must be `rgb(...)` or `rgba(...)`.
- Text boxes must be sized to fit; static validation does not prove rendered wrapping.

## Shapes And Groups

- Geometry needs `slide:role="shape"` and a meaningful `slide:shape-type`.
- Common geometry includes `rect`, `ellipse`, `circle`, `path`, and `line`.
- Multi-element cards use `<g slide:role="group">`.
- Children inside a group still keep their own `slide:role`.
- A shape-with-text group is only for one geometry plus one text block. Cards with badges, icons, charts, or multiple text blocks must be regular groups.
- Custom paths must declare a meaningful `slide:width` and `slide:height` that match the path's real bounding box.

## Lines

- Lines use `<line slide:role="shape" slide:shape-type="line">`.
- Arrows use `slide:start-arrow` or `slide:end-arrow`.
- SVG marker arrows are forbidden.

## Images

- Images use `<image slide:role="image" slide:shape-type="image" href="...">`.
- Informational images preserve source aspect ratio.
- Do not wrap a single image in a group unless it is truly part of a larger multi-element composition.
- Borders and shadows belong on the image element itself when used.

## Charts

- Charts use `<rect slide:role="chart" href="..." x="..." y="..." width="..." height="...">`.
- The rect is a chart placeholder; it is not a drawn rectangle.
- Place charts at top level or inside `<g slide:role="group">`.
- Preserve chart `href` verbatim unless the user asks to change chart data, type, emphasis, theme, or source.

## Notes

- Speaker notes are optional and do not render on canvas.
- At most one `<slide:note>` may appear.
- Notes contain direct paragraph children.

## Colors

- Use `rgb(...)`, `rgba(...)`, or `url(#id)`.
- Do not use hex colors.
- Do not use named colors.
- Do not use `none` for `fill` or `stroke`; use `rgba(0,0,0,0)` for transparent fills.

## Animation

- Animation is part of delivery, not decoration.
- Most slides should be static.
- Presented decks may use progressive reveal for complex steps, charts, processes, timelines, or comparisons.
- Self-read, formal, board, or consulting decks should read fully without clicks.
- Use at most three builds on a slide.
- Use one effect type per slide.
- Animated elements need explicit `id`.
- Animate top-level elements or top-level groups.
- Use one deck-level page transition when needed; do not vary transition style slide by slide.

## Source Coverage

- Covers manifest sections: svg_reference, svg_document_rules
- Coverage mode: preserve hard SVG protocol requirements from the source while applying the CLI canvas adaptation to 960x540; visual guidance belongs in `visual-design.md`, not here.
