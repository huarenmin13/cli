---
id: svg_reference
role: protocol_reference
invocation: required
stage: all
order: 2
cardinality: once
requires:
  - mode_system_prompt_svg
condition: always
trigger:
  - svg_protocol_authoring
  - svg_protocol_validation
consumes:
  - outline/deck.json
  - content/slide_content.json
  - assets/assets_plan.json
produces:
  - slides/*.svg
completion_gate:
  - svg_protocol_valid
  - slide_roles_valid
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

# SVG reference（协议 schema + 设计规范 / svg_reference）

````text
<design_excellence>
Beyond schema-correctness, the bar for SVG-protocol slides is visual EXCELLENCE: every deck must look intentionally, distinctively designed — never generic "AI slop." Treat the schema below as the medium, and the guidance here as how to wield it.

{{if not .RuntimeFontCandidates}}
## Typography — fonts that actually render

### Font Pairing Rule
Every `fontFamily` lists an English/Latin font FIRST, then a Chinese/CJK font, then a generic fallback — comma-separated. The engine selects per character: Latin renders in the English font, CJK falls through to the CJK font.
- `fontFamily="Playfair Display, 寒蝉锦书宋, serif"`  — correct (serif pairing)
- `fontFamily="DM Sans, 黑体, sans-serif"`            — correct (sans pairing)
- `fontFamily="钟齐流江毛草, cursive"`                 — WRONG (no English font)
- `fontFamily="黑体, DM Sans, sans-serif"`            — WRONG (Chinese first)

Use a DISPLAY value on titles/hero numbers and a BODY value on prose — two different `fontFamily` strings, both held consistent across every slide.

### English fonts
- Serif / editorial / premium — PREFER for titles: `Playfair Display` · `EB Garamond` · `Lora` · `Libre Baskerville` · `PT Serif` · `Merriweather` · `Crimson Text` · `Vollkorn` · `Bitter`
- Display / impact titles: `Anton` · `Bebas Neue` · `Oswald` · `Abril Fatface` · `Fjalla One` · `Archivo Narrow`
- Refined sans body: `DM Sans` · `Montserrat` · `Poppins` · `Raleway` · `Work Sans` · `Questrial`

### Chinese fonts (title font sets the tone; body font ensures readability)
- Body (both langs): `黑体` neutral sans · `宋体` neutral serif · `思源宋体` elegant serif, 7 weights
- Serif / editorial / 高级感 (titles + body): `寒蝉端黑宋` hei-song hybrid, precise · `寒蝉锦书宋` classical song-ti · `思源宋体` best for long reading
- 楷书 / 书法 / cultural (titles only): `马善政毛笔楷体` traditional brush kai-shu · `有字库龙藏体` hard-pen handwriting · `钟齐流江毛草` wild cursive (wuxia only) · `钟齐志莽行书` running script (wuxia only)
- Tech / brand / clean (titles + body): `寒蝉德黑体` DIN-style industrial · `标小智无界黑` esports impact · `寒蝉云墨黑` ink-textured hei · `黑体` neutral modern
- Creative / personality (titles only): `站酷庆科黄油体` butter-like fullness · `荆南缘默体` unique artistic · `抖音美好体` high brand recognition · `寒蝉团圆体 黑体` rounded hei · `站酷小薇体` delicate serif
- Rounded / warm / cute (titles + body): `寒蝉全圆体` most rounded · `寒蝉团圆体 圆体` warm rounded · `资源圆体` Japanese-style rounded · `霞鹜 975 圆体` gentle healing

Suggested pairings: `Playfair Display` + `寒蝉锦书宋` (editorial/premium) · `EB Garamond` + `马善政毛笔楷体` (literary/cultural) · `Oswald` + `寒蝉德黑体` (bold/impact) · `DM Sans` + `黑体` (tech) · `Montserrat` + `抖音美好体` (corporate/brand).
{{end}}

## Layout Freedom

In the SVG protocol you have FULL, unconstrained control over layout — use it. For every slide, first read the LOGICAL RELATIONSHIP in the content (comparison, sequence / process, timeline, cycle, hierarchy, matrix / quadrant, funnel, part-to-whole, cause→effect, …), then design a bespoke visual structure that makes that relationship instantly legible — freely and artistically, never stamped from a fixed template. The layout itself should carry the logic: use position, alignment, grouping, scale, and flow direction to encode how the ideas relate. Push SVG to its limits — hand-build every element with `<rect>` / `<circle>` / `<ellipse>` / `<line>` / `<path>` / `<foreignObject>` and `<g>` grouping, and exploit the full toolkit to express the structure: gradients and `<filter>` effects (via `<defs>`), connectors and arrowheads (`<line>` + `slide:start-arrow` / `slide:end-arrow`), `transform` rotate/scale, and layered depth. A layout invented for THIS content's specific logic always beats a canned diagram.
</design_excellence>

<svg_reference>
AnyGen Slides uses an **SVG-based protocol**: each slide is a standard SVG document with a minimal set of private `slide:*` attributes (declared via the `xmlns:slide="https://slides.bytedance.com/ns"` namespace) that carry slide-specific semantics. The document is valid SVG; the private attributes are transparently ignored by any SVG renderer.

IMPORTANT: This is NOT HTML. It uses standard SVG elements with their standard SVG semantics. The only extensions are the `slide:*` attributes and a tiny set of private elements (`<slide:note>`, optionally `<presentation>` for multi-slide bundles). Always follow the element definitions in this document — do not assume HTML/CSS behavior on SVG nodes.

<svg_element_taxonomy>
The protocol has four element categories. Each category has a fixed role — elements from one category cannot do the job of another.

1. Slide root — `<svg slide:role="slide" id="..." viewBox="0 0 W H">`
   - One slide page per SVG document
   - viewBox defines the slide canvas size; child element coordinates are in this coordinate system

2. Page elements — standard SVG primitives placed on the slide
   - Geometric shapes (no text): `<rect>`, `<ellipse>`, `<circle>`, `<path>`, `<line>` with `slide:role="shape"` and `slide:shape-type="..."`
   - Plain text boxes (no fill): `<foreignObject slide:role="shape" slide:shape-type="text"/>` containing xhtml `<p>`, `<ul>`, `<ol>`, etc.
   - Shapes WITH text (colored/bordered box + text): `<g slide:role="shape" slide:shape-type="..."/>` wrapping a geometry element + a `<foreignObject>` (see Text form B)
   - Images: `<image slide:role="image" slide:shape-type="image" href="..."/>`
   - Charts: `<rect slide:role="chart" href="..." x="" y="" width="" height=""/>` (a chart is referenced by file; the engine renders the chart SVG inside the rect)
   - Video / Audio: `<foreignObject slide:role="video"|"audio"/>` wrapping a native xhtml `<video>`/`<audio src="<token>">` (only with a prepared media token — see Video / Audio below)

3. Inline rich-text content — lives only inside `<foreignObject>`
   - Container attributes (fontSize / fontFamily / color / bold / italic / textAlign / verticalAlign / padding / lineSpacing) are set on the `<foreignObject>` element itself via `style="..."`; they are not standard SVG attributes but are interpreted by the slide engine.
   - Body uses standard xhtml: `<p>`, `<ul>`, `<ol>`, `<li><p>...</p></li>`, `<span>`, `<br/>`, `<strong>`, `<em>`, `<u>`, `<del>`, `<a>` — placed as DIRECT children of the `<foreignObject>` (no `<div>`/`<section>` wrapper).

4. Visual properties — set as attributes directly on the shape element
   - `fill="rgba(...)"` for solid color, or `fill="url(#grad-1)"` referencing a `<defs><linearGradient/></defs>` for gradients
   - `stroke="..."`, `stroke-width="..."`, `stroke-dasharray="..."` for borders
   - `opacity="0.5"` for alpha
   - `filter="url(#shadow-1)"` referencing a `<defs><filter/></defs>` for shadows

Color: rgb(r,g,b) or rgba(r,g,b,a). No hex, no named colors.
</svg_element_taxonomy>

<core_rules>
- ONLY use elements and attributes explicitly defined in this document. Undocumented combinations will cause validation errors.
- Canvas Size: {{.CanvasWidth}}px width x {{.CanvasHeight}}px height
  - Default sizes (when not using a template): 16:9 = 1280×720, 4:3 = 1280×960, 3:4 = 960×1280, 21:9 = 1400×600, 9:16 = 720×1280, 1:1 = 960×960
  - When using a template: Inherit the template's canvas size exactly
  - Express canvas size via the root `<svg>` element's `viewBox="0 0 W H"`. The element's `width`/`height` may be omitted.
- Coordinate System: Origin (0,0) at top-left; X increases rightward, Y increases downward. All positioning uses viewBox units (treated as pixels).
- Naming: element names follow standard SVG/xhtml casing (lowercase). Private attributes use the `slide:` prefix and camelCase suffix (e.g., `slide:shape-type`, `slide:icon-name`). Enum values are kebab-case.
- Font Size (calibrated for a reading-oriented 1280×720 deck; the canvas size is intended to carry MORE content per page, NOT to host bigger typography — calibrate content-page text toward the lower-mid of each range, reserve the upper bound for cover titles and key-metric anchors only):
  - Cover title: 40-56px · Slide title: 28-40px · Subtitle: 20-26px · Body L1: 16-20px · Body L2: 13-16px · Caption / source: 11-13px · Hero stat / key number: 80-140px
  - **Title-dominant pages** (title-cover / section-divider / chapter / closing where the title IS the entire page content): bump primary title to **64-96px** to maintain visual weight on the 1280×720 canvas. The standard 40-56 cover-title range only applies when the cover also carries subtitle, speaker info, or other text — once the page is reduced to one or two title lines on a near-empty canvas, scale up so the title still owns the page.
  - Hard limits: Max 56px for prose text (overflow risk above), Min 11px (readability floor); only hero stats and title-dominant page titles may exceed 56px
  - Do NOT inflate font size to fill an empty canvas — oversized type on a sparse page is the most common cause of the "big and bare" look. If a page feels empty, add meaningful content or compose the existing content with stronger edge alignment; don't scale text past these ranges.
- Rendering Order: Elements render in document order (first = bottom layer, last = top layer). Place decorative shapes BEFORE text so they don't obscure content.
- Document Structure: a single slide is a single `<svg>` document. Multiple slides in one project use a private `<presentation xmlns:slide="...">` wrapper that contains multiple `<svg>` children. The wrapper exists only for multi-slide bundles; standalone slide files start with `<svg>`.
</core_rules>

<available_components>
Root Container (multi-slide bundles only): `<presentation xmlns:slide="https://slides.bytedance.com/ns" slide:width="W" slide:height="H">`
- Wraps multiple `<svg slide:role="slide">` documents
- Single-slide files MAY omit this wrapper and use `<svg slide:role="slide">` directly
- Child Elements: `<svg slide:role="slide">` (one per slide page)

Slide Container: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="..." viewBox="0 0 W H">`
- A single slide page
- Required Attributes:
  - `xmlns="http://www.w3.org/2000/svg"` — the SVG namespace declaration
  - `xmlns:slide="https://slides.bytedance.com/ns"` — the private slide namespace declaration
  - `slide:role="slide"` — marks this as the slide root (vs. an inline svg)
  - `id="..."` — slide identifier
  - `viewBox="0 0 W H"` — canvas size; child coordinates are in this system
- Child Elements (in document order):
  - `<defs>` (optional, at most one): collects gradient and filter definitions referenced by `fill`/`stroke`/`filter` attributes elsewhere
  - Slide background (optional) — the page background. Defaults to white when omitted; omit entirely for a transparent background.
    - **MUST be the FIRST child element** (immediately after the optional `<defs>`, before any page element).
    - **The background is exactly ONE fill — solid color, gradient, OR image — they are mutually exclusive. Pick ONE; never stack them.** The background always renders at the very back (behind every page element), so it can NOT be used as an overlay on top of an image.
      - Solid color: `<rect slide:role="background" width="W" height="H" fill="rgba(...)"/>`
      - Gradient: `<rect slide:role="background" width="W" height="H" fill="url(#bg-grad)"/>` — declare `<linearGradient>`/`<radialGradient>` in this slide's `<defs>` (opaque stops only — see IMPORTANT below).
      - Image: `<image slide:role="background" href="<image path>" width="W" height="H"/>` — fills the whole page with the image.
    - To put text legibly over a full-bleed image, do NOT add a gradient background "scrim" (it would render behind the image and be invisible). Instead use the image as the background and place a normal semi-transparent overlay shape on top: a `<rect slide:role="shape" slide:shape-type="rect" fill="url(#scrim-grad)"/>` (or solid `fill="rgba(...,.5)"`) positioned over the text area, AFTER the image in document order.
    - IMPORTANT — the background is an EVEN BASE, not a light source, and it is composited over the slide's **WHITE page canvas**. Because of that white backing, a translucent stop (alpha < 1) does NOT darken — the white shows through and the fill renders as a bright pale wash, the opposite of the subtle dark glow you picture (this is why a `rgba(0,240,255,0.1)` "dark glow" comes out as a blown-out white-cyan haze). So EVERY background stop must be fully opaque (alpha = 1): make the background a solid deep color, or a gentle gradient between two near-adjacent opaque tones (e.g. `rgba(11,15,25,1)`). Never a bright-center or translucent radial — over white it becomes a spotlight / "monitor glow" wash.
      - For a "glowing / back-lit / neon / screen-native" look, the glow lives on ELEMENTS over that flat base — neon strokes, glowing wireframe `<line>`/`<path>`, a small glow shape (a `slide:role="shape"` `<ellipse>` with a radial fill that fades to transparent) behind a focal element, placed AFTER the background. A glowing interface = glowing elements on a flat base, never a glowing base.
      - Don't stack full-page `<rect>`s to fake depth (no PPTX equivalent; opaque ones blank the page) — bake any tint into the one background fill. For texture, draw a few real `<line>`/`<circle>` primitives. (A full-page semi-transparent scrim is allowed only over a background IMAGE, per above.)
  - Page-element children (shape / image / chart / line / icon) — see below
  - `<slide:note>` (optional, at most one): speaker notes
    - Structure: `<slide:note><p>Plain text</p></slide:note>` — the note holds `<p>` paragraphs DIRECTLY (no `<content>` or `<foreignObject>` wrapper).
    - NO formatting allowed inside note: no bold, italic, lists, or any other elements — only plain-text `<p>`
    - Notes are displayed below the slide editor; they do not render on the slide canvas

Geometric Shape (no text): `<rect>`, `<ellipse>`, `<circle>`, `<path>`, `<line>`
- Required Attributes: `slide:role="shape"`, `slide:shape-type="..."`
- Use these only for **pure geometric decoration** with no text content. For a shape that ALSO holds text (colored box + label), use the `<g>` wrapper form (see Text form B below) — never put text-bearing `<foreignObject>` geometry attributes like `fill`/`rx` on a foreignObject.
- Standard SVG geometry attributes:
  - `<rect x="" y="" width="" height="" rx="" ry=""/>` — `rx`/`ry` give rounded corners (use instead of separate `round-rect` type)
  - `<ellipse cx="" cy="" rx="" ry=""/>`
  - `<circle cx="" cy="" r=""/>`
  - `<path d="M..." slide:width="W" slide:height="H"/>` — `d` is the path data in a local `0..W × 0..H` box; `slide:width`/`slide:height` MUST equal the path's real bounding box (max−min of the `d` coordinates), NOT the slide/canvas size. The path is drawn at its raw coordinates inside this box (it is NOT stretched to fill it), so an oversized box makes the selection far larger than the shape. Call `compute_custom_shape_bbox` to get the normalized `d` + correct W/H + translate offset.
  - `<line x1="" y1="" x2="" y2=""/>` — requires `stroke` for visibility
- Common shape-types (set via `slide:shape-type`):
  - `rect`, `round-rect`, `ellipse`, `circle`, `triangle`, `diamond`, `parallelogram`, `donut`, `arc`, `block-arc`, `chord`, `pie`, `pie-wedge`, `trapezoid`, `chevron`, `right-arrow`, `up-arrow`
  - `custom` — freeform shape defined by a `d` path string. REQUIRED for `<path>` elements; ONLY allowed when shape-type="custom".
- Visual attributes (any of these may be omitted):
  - `fill="rgba(...)"` or `fill="url(#grad-id)"` (gradient) — omit for no fill
  - `stroke="..."`, `stroke-width="..."`, `stroke-dasharray="..."` — omit for no border
  - `opacity="0.5"` — alpha
  - `filter="url(#shadow-id)"` — shadow effect
- Transforms:
  - `transform="rotate(30 cx cy)"` for rotation around center (cx, cy)
  - `transform="scale(-1,1)"` for horizontal flip
  - Always use `transform` for SVG-native geometric operations.
- Private attributes:
  - `slide:width="..."` / `slide:height="..."` — for `<path slide:shape-type="custom">` only. Declares the path's bounding box and MUST equal the real extent of the `d` coordinates (max−min). The path is placed at its raw coordinates inside this box, NOT stretched to fill it; an oversized box (e.g. the canvas size) bloats the selection box. Use `compute_custom_shape_bbox` to compute the right values.

Text — TWO forms depending on whether the text sits on a colored/bordered shape:

A. Text Box (plain text, NO fill/border): flat `<foreignObject slide:role="shape" slide:shape-type="text" x="" y="" width="" height="" style="...">`
   - Use for headings, labels, paragraphs, list blocks — text with no background box. For a title / subtitle / caption block, tag it semantically with `<h1>`/`<h2>`/`<h3>`/`<small>` instead of a plain `<p>` (see "Semantic text role" under Rich Text Content).
   - Required on the `<foreignObject>`: `slide:role="shape"`, `slide:shape-type="text"`, `x`/`y`/`width`/`height` (bounding box in viewBox units — must fit the wrapped text, see Sizing Rule).
   - Children: xhtml only — the DIRECT children ARE the `<p>`/`<ul>`/`<ol>` themselves. A text foreignObject has NO wrapper element: do NOT enclose the paragraphs in a `<div>` (or `<section>`/`<span>`). Multiple paragraphs are SIBLING `<p>` elements, never a single element containing several `<p>`.
   - Multi-paragraph example — two SIBLING `<p>`, no wrapper:
     `<foreignObject slide:role="shape" slide:shape-type="text" x="180" y="265" width="380" height="200" style="font-size:14px; color:rgba(100,105,108,1); line-height:1.75; vertical-align:top"><p xmlns="http://www.w3.org/1999/xhtml" style="margin-top:0"><strong style="font-size:18px">First point</strong><br/>Supporting sentence for the first point.</p><p xmlns="http://www.w3.org/1999/xhtml"><strong style="font-size:18px">Second point</strong><br/>Supporting sentence for the second point.</p></foreignObject>`
   - WRONG (do NOT do this): `<foreignObject slide:shape-type="text" ...><div><p>...</p><p>...</p></div></foreignObject>` — the `<div>` wrapper is invalid here; promote the `<p>` elements to direct children of the `<foreignObject>`.
   - ALSO WRONG (bare text, no `<p>`): `<foreignObject slide:shape-type="text" ...>Label</foreignObject>` — bare text is silently dropped (only `<p>`/`<ul>`/`<ol>` children are read); write `<p>Label</p>`.

B. Shape WITH text (colored/rounded/bordered box that also holds text): `<g slide:role="shape" slide:shape-type="X" transform="translate(x,y)" slide:width="W" slide:height="H">` wrapping a geometry element + a `<foreignObject>`.
   - `<foreignObject>` is NOT a geometric box — in standard SVG it has no `fill`/`rx`/`ry`/`filter`. A shape with both a fill AND text MUST use this `<g>` form. NEVER put `fill`/`rx`/`ry` on a `<foreignObject>`.
   - Coordinates live on the `<g>` ONLY (same convention as groups): position via `transform="translate(x,y)"`, size via private `slide:width`/`slide:height`. The two children sit in the `<g>` local coordinate system and default to filling `(0,0,W,H)` when they omit `x/y/width/height`.
   - Geometry child (`<rect>`/`<ellipse>`/`<path>`/…): carries `fill`/`stroke`/`rx`/`ry`/`filter`/`d`. Its tag must match `slide:shape-type` on the `<g>`.
   - Text child (`<foreignObject style="...">`): carries the text (xhtml + CSS), nothing geometric.
   - Order: geometry element FIRST, `<foreignObject>` SECOND (text paints on top).
   - Rotation/flip/opacity go on the `<g>`: `transform="translate(x,y) rotate(deg W/2 H/2)"`, `opacity="..."`.
   - Holds EXACTLY one geometry + one `<foreignObject>` — a single styled box with one text block, NOT a container. Any extra child (a chart, image, icon, a second geometry/badge, or a second `<foreignObject>`) is dropped, leaving the card blank/partial; for a card with more pieces use `<g slide:role="group">` (see Group).
   - Example (CTA pill):
     `<g slide:role="shape" slide:shape-type="round-rect" transform="translate(640,320)" slide:width="160" slide:height="32"><rect rx="16" ry="16" fill="rgba(31,109,137,1)"/><foreignObject style="vertical-align:middle"><p xmlns="http://www.w3.org/1999/xhtml" style="font-size:14px; color:rgba(255,255,255,1); text-align:center">Status: Active</p></foreignObject></g>`

- Text styling (BOTH forms) — put EVERYTHING in `style="..."` (CSS, semicolon-separated). For form A on the `<foreignObject>`; for form B on the `<foreignObject>` and/or the inner `<p>`/`<span>`. The slide engine reads CSS directly:
  - `font-size:20px` — base font size in pixels (REQUIRED; always include the `px` suffix)
  - `font-family:Arial, 黑体, sans-serif` — font family stack
  - `color:rgba(...)` — text color (defaults to black; set explicitly on non-white backgrounds)
  - `font-weight:700` (bold) / `font-style:italic` / `text-decoration:underline` / `text-decoration:line-through` — decorations
  - `text-align:center` — left / center / right / justify
  - `vertical-align:middle` — top / middle / bottom (defaults to middle; set `top` for cards and content blocks anchoring to the top)
  - `letter-spacing:0px`, `line-height:1.5` (unitless = multiplier) or `line-height:20px` (fixed)
  - `padding:8px` (1/2/4 values) or `padding-top:` / `padding-right:` / `padding-bottom:` / `padding-left:` — defaults: 0 on shape-type="text", 5px elsewhere
- DO NOT write any text visual property as a bare attribute (no `fontSize="20"`, no `color="..."`, no `bold="true"`). All text visual properties go into `style="..."`.
- Sizing Rule (content drives dimensions):
  When text doesn't fit, the renderer silently SHRINKS both font-size (down to 25% of original) AND line-height (up to 20% tighter). Fix content first, then size the box.
  Height invariant: `height ≥ max_fontSize × k × n_lines + paddingTop + paddingBottom + geometric_inset_v` where k = 1.5 for default `line-height:1.5`.
  Geometric inset (extra to padding, applies even when padding=0):
  - shape-type="ellipse": text fits in the INSCRIBED rectangle ≈ 0.7×w × 0.7×h
  - other non-rectangular types (triangle, diamond, pentagon, hexagon, pie, donut, ...): similar inscribed-rectangle inset
  - round-rect: small inset (~1–4 px per side), usually negligible
  - rect, text: no geometric inset
  Three archetypes — copy the safe numbers:
  - Title / heading bar (`shape-type="text"`, padding=0): height ≥ fontSize × 1.5. A 36px bar fits font-size ≤ 24px, NOT 28px.
  - Pill / tag / chip (`shape-type="round-rect"`, ~20–30px tall): set `style="padding:0; ..."`. Then with default line-height, fontSize ≤ ⌊height / 1.5⌋. E.g. height=24 → fontSize ≤ 16.
  - Number / icon badge (`shape-type="ellipse"`, both axes ≤ 30): set `style="padding:0; ..."` — geometric inset still applies. With default line-height, fontSize ≤ ⌊0.47 × height⌋. E.g. 24×24 → fontSize ≤ 11.
- One foreignObject = one text block. For style variations within the same text block, use `<span style="...">` (or HTML semantic tags `<strong>`/`<em>`/...) inside `<p>` — not multiple foreignObjects. Use separate foreignObjects only when text blocks sit at genuinely different spatial positions.

Image: `<image slide:role="image" slide:shape-type="image" href="..." x="" y="" width="" height="">`
- Required Attributes:
  - `slide:role="image"`, `slide:shape-type="image"` (an image is its own role — NOT `slide:role="shape"`)
  - `href="..."` — Complete image file path (absolute, e.g., `/home/user/workspace/resources/images/foo.jpg`). This MUST be one of the prepared image paths; the engine resolves it to the real file. Use `href`, not the legacy `xlink:href`.
  - `x`, `y`, `width`, `height` — placement and size in viewBox units
- Optional Attributes:
  - `transform="rotate(angle cx cy)"` for rotation
  - `transform="scale(-1,1)"` etc. for flip
  - `opacity="..."` — alpha
  - `alt="..."` — accessibility alt text (private; not native SVG)
- The image is ONE self-contained `<image>` element — do NOT wrap it in a `<g>`.
  - For border/shadow on an image, set the attrs directly on the `<image>`: `stroke="..."`, `stroke-width="..."`, `slide:shadow-*` (see Styling Attributes).
  - For image crop SHAPE, use native SVG `clip-path` (standard-first — the shape geometry is expressible in plain SVG/CSS, so do NOT invent private attributes). Either form works:
    - CSS basic-shape directly on the `<image>`: `clip-path="circle(50%)"` or `clip-path="ellipse(50% 50%)"` (round/oval — profile photos & avatars); `clip-path="inset(0 round 16px)"` (rounded corners); `clip-path="path('M ... Z')"` (custom silhouette). Geometry is the image's local box `[0,0,width,height]`.
    - Or reference a `<clipPath>` in `<defs>`: `clip-path="url(#crop-1)"` with `<clipPath id="crop-1"><ellipse cx="150" cy="150" rx="150" ry="150"/></clipPath>` (or `<rect rx ry/>` / `<path d/>`). You may let the engine manage ids — both forms are accepted.
    - Plain rectangular images (no shape crop) → omit `clip-path`.
  - For image crop OFFSET (pan/inset to show a specific part of the source), use private attributes on the `<image>` (no native equivalent):
    - `slide:crop-left`, `slide:crop-right`, `slide:crop-top`, `slide:crop-bottom` — inset offsets in pixels (after the image is scaled to cover the container)
  - RECOMMENDATION: Use rounded corners for a modern, polished appearance — default to `clip-path="inset(0 round 16px)"` for most images; use `clip-path="circle(50%)"` (or `ellipse(50% 50%)`) for profile photos / avatars.
- Preserving Aspect Ratio:
  - Informational images (charts, diagrams, screenshots): MUST preserve original ratio — extract dimensions from filename pattern `image_w{W}_h{H}_...` (e.g., `chart_w1920_h1080_sales.png` → 1920×1080)
  - Decorative images (photos): can crop freely based on layout needs
  - Exception: always honor user's explicit "no distortion" requests

Chart: `<rect slide:role="chart" href="..." x="" y="" width="" height="">`
- A chart is a `<rect>` placeholder that references a chart file by `href`; the engine renders the chart SVG inside the rect's bounds (it is NOT a drawn rectangle).
- `slide:role="chart"` (NOT `slide:role="shape"`, and NOT `<image>`); `x`/`y`/`width`/`height` are the chart's placement and size in viewBox units.
- Place a chart at top level or inside `<g slide:role="group">`; NEVER inside `<g slide:role="shape">` (it would be dropped — see Text form B). For a chart on a background card, make the card `<rect slide:role="shape">` and the `<rect slide:role="chart">` siblings (both top-level with absolute coords, or both in one `<g slide:role="group">`).
- `href` points to the chart file: `.svg` (generated by `generate_svg_chart`; preferred for all new charts) or legacy `.chart` (imported PPTX; preserve as-is unless the user asks to change).
- IMPORTANT: Do NOT truncate or modify the href path. If the user's request does not explicitly touch the chart, preserve the entire `<rect slide:role="chart">` element verbatim.

Video / Audio: `<foreignObject slide:role="video"|"audio" x="" y="" width="" height="">` wrapping a native xhtml `<video>`/`<audio>`.
- Media (video/audio) is NOT expressible as native SVG, so it rides in a `<foreignObject>` (escape hatch) carrying one native HTML `<video>` or `<audio>` element.
- The OUTER `<foreignObject>` is the only dispatch key (like a table — `slide:role="video"` or `slide:role="audio"`, NOT `slide:role="shape"`).
  - Geometry on the `<foreignObject>`: `x`/`y`/`width`/`height` (placement/size in viewBox units), `transform="rotate(...)/scale(...)"`. Audio also supports `opacity`; **video does NOT support opacity** (no alpha).
  - **Audio renders as a fixed circular play-button icon (NOT a wide player bar), so its `<foreignObject>` MUST be SQUARE — set `width` == `height` (a small square, ~56–72px, e.g. 64×64).** A rectangular audio box leaves the round icon mis-centered with empty space. Video keeps its real aspect ratio (e.g. 16:9).
- The INNER element carries the media source + metadata:
  - `src="<token>"` — the media token/path. This MUST be a prepared media token (the engine resolves it to the playable file); like images, you canNOT invent a media source out of thin air.
  - Video only: `width`/`height` = the source video's intrinsic resolution.
  - Audio only: `loop` (native HTML boolean) for looping; `slide:cross-slide-stop="true|false"` for stop-on-slide-change.
  - Private metadata (editor state, no clean native form): `slide:mime-type`, `slide:size` (bytes), `slide:name` (file name), `slide:play-mode="click"|"auto"`, `slide:status`.
- Examples:
  - `<foreignObject slide:role="video" x="100" y="80" width="640" height="360"><video xmlns="http://www.w3.org/1999/xhtml" src="<token>" width="1920" height="1080" slide:mime-type="video/mp4" slide:play-mode="click"/></foreignObject>`
  - `<foreignObject slide:role="audio" x="100" y="500" width="64" height="64"><audio xmlns="http://www.w3.org/1999/xhtml" src="<token>" loop slide:mime-type="audio/mpeg" slide:play-mode="auto"/></foreignObject>` (square — audio is a round icon)
- IMPORTANT: Only emit video/audio when a real media token is available. If editing a slide that already contains a `slide:role="video"/"audio"` block and the request does not touch it, preserve the entire `<foreignObject>` (and its inner `<video>`/`<audio src>`) verbatim.

Line: `<line slide:role="shape" slide:shape-type="line" x1="" y1="" x2="" y2="" stroke="..." stroke-width="...">`
- Required Attributes:
  - `slide:role="shape"`, `slide:shape-type="line"`
  - `x1`, `y1`, `x2`, `y2` — start and end points in viewBox units
  - `stroke="rgba(...)"` and `stroke-width="..."` — REQUIRED for visibility
- Optional Attributes:
  - `stroke-dasharray="..."` — dash pattern (see Border below for values)
  - `opacity="..."`
  - `filter="url(#shadow-id)"`
- Arrowheads — set the private attrs DIRECTLY on the `<line>` (do NOT use SVG `<marker>` / `marker-start` / `marker-end`; the engine ignores those on lines):
  - `slide:start-arrow="..."` — arrowhead at the start point `(x1,y1)`
  - `slide:end-arrow="..."` — arrowhead at the end point `(x2,y2)`
  - Values: `none` (default), `arrow`, `solid-triangle`, `empty-triangle`, `solid-circle`, `empty-circle`, `solid-diamond`, `empty-diamond`
  - Example: `<line slide:role="shape" slide:shape-type="line" x1="100" y1="100" x2="300" y2="100" stroke="rgba(20,20,20,1)" stroke-width="2" slide:end-arrow="solid-triangle"/>`

Icon: `<g slide:role="icon" slide:icon-name="..." slide:width="" slide:height="" transform="translate(x,y)"/>`
- Renders an IconPark icon as a standalone visual object (NOT text)
- Required Attributes:
  - `slide:role="icon"`
  - `slide:icon-name="comma,separated,en,keywords"` — 3-5 keywords; the engine looks up the best-matching icon and resolves it to a concrete icon
  - `slide:width`, `slide:height` — icon size (private attrs; `<g>` has no native width/height)
  - `transform="translate(x,y)"` — top-left placement
- Optional Attributes:
  - `opacity`, `fill` (fill applies to the icon glyph); append `rotate(deg cx cy)` to `transform` to rotate
- Example keywords: correct, plus-cross, error, code-brackets, like, tips, check, people, refresh, close, search, tool, thinking-problem, plus, go-ahead, dislike, trending-up, local, peoples-two, brain, lightning, robot, book-open, star, bookmark, volume-notice, pennant, ...

Group: `<g slide:role="group"> ...children... </g>`
- A `<g>` is a GROUP: a standard SVG container that bundles multiple child elements into one logical, movable unit — e.g. a hand-built chart (axis line + data path + point circles + labels), a labeled diagram node, an icon+text pair, or **a CARD that holds more than one box of content** (a background card + a chart, a number/icon badge + title + body, two stacked text blocks). Mark it `slide:role="group"` (a role-less `<g>` is also accepted and treated as a group). **A group renders every child — so ANY card with more than one piece of content is a group, never a `<g slide:role="shape">`.**
- **Card content sits at the top, not the middle**: a card's content box is almost always taller than its text, and a text box centers its content vertically by default — so a card's title/body will float to the card's vertical center unless you set `vertical-align:top` on that content `<foreignObject>`. Give every card's content box `vertical-align:top`; then content starts just below the card top and a row of sibling cards lines up regardless of how much text each holds. `vertical-align:middle` is ONLY for a lone single line of text centered inside a small shape (a badge number, a pill, a button) — never for a card that stacks a heading + body or a number + label, even when every card in the row happens to hold the same number of lines. If the content box has more than one line or more than one `<p>`, it is `top`.
- Position/orient the WHOLE cluster with the standard SVG `transform` attribute — `translate`, `rotate(deg cx cy)`, `scale` — applied to the group's coordinate system, exactly like any SVG `<g>`. Children are authored in the group's LOCAL coordinates (so a child placed at the group's translate-relative origin renders at the translated position on the slide).
- **CRITICAL — children still need their own `slide:role`**: being inside a `<g>` does NOT exempt a child from the dispatch rules. Every block child carries the same `slide:role` (and `slide:shape-type` for shapes) it would have at the top level — `<circle slide:role="shape" slide:shape-type="ellipse" .../>`, `<foreignObject slide:role="shape" slide:shape-type="text" .../>`, `<image slide:role="image" .../>`, a nested `<g slide:role="icon">`, etc. (`<line>`/`<polyline>` are role-less by nature.) The ONLY thing exempt from `slide:role` is the xhtml content INSIDE a `<foreignObject>` (`<p>`/`<span>`/`<ul>`/`<li>`/`<td>`). A block child missing its required `slide:role` will NOT render.
- Example: `<g slide:role="group" transform="translate(280,380)"><circle slide:role="shape" slide:shape-type="ellipse" cx="0" cy="0" r="10" fill="rgba(169,169,169,1)"/><foreignObject slide:role="shape" slide:shape-type="text" x="-30" y="20" width="60" height="30" style="font-size:16px; color:rgba(255,255,255,1); text-align:center"><p xmlns="http://www.w3.org/1999/xhtml">水星</p></foreignObject></g>`. Groups may nest.
- Example (a multi-piece card = background + badge + text — use GROUP, never a shape `<g>`): `<g slide:role="group" transform="translate(100,200)"><rect slide:role="shape" slide:shape-type="rect" width="300" height="320" rx="16" ry="16" fill="rgba(255,255,255,1)"/><rect slide:role="shape" slide:shape-type="rect" x="24" y="24" width="48" height="48" rx="12" fill="rgba(0,97,255,1)"/><foreignObject slide:role="shape" slide:shape-type="text" x="24" y="24" width="48" height="48" style="text-align:center; vertical-align:middle"><p xmlns="http://www.w3.org/1999/xhtml" style="color:rgba(255,255,255,1)">1</p></foreignObject><foreignObject slide:role="shape" slide:shape-type="text" x="24" y="96" width="252" height="200" style="vertical-align:top"><p xmlns="http://www.w3.org/1999/xhtml" style="font-size:22px; font-weight:700">Card title</p><p xmlns="http://www.w3.org/1999/xhtml" style="font-size:16px">Supporting body text.</p></foreignObject></g>` — every child carries its own `slide:role`, so background, badge, badge-number and body all render. The body block sets `vertical-align:top` so its content anchors to the top of the card.
- The group's only positioning attribute is the standard `transform`; its size is the children's bounding box (not authored), and it needs no other private attr. `opacity`/`filter`/`clip-path` are NOT honored on the `<g>` (they would composite the whole group, which the engine does not support) — put any such effect on the individual child elements instead.
- Use a group only for genuinely multi-element clusters (2+ children). Do NOT wrap a single element, and never wrap an `<image>` in a `<g>` (see Image above).

Rich Text Content (inside `<foreignObject>`): xhtml subset
- Container attributes are on the parent `<foreignObject>` (fontSize, fontFamily, color, textAlign, verticalAlign, padding*, lineSpacing). See Text Shape above.
- Valid xhtml children: `<p>`, `<ul>`, `<ol>` — the DIRECT children of the `<foreignObject>`. Do NOT add a `<div>`/`<section>` wrapper — there is no wrapper element inside a text foreignObject; sibling `<p>` sit directly under it.
- Vertical Spacing inside a single foreignObject:
  - Valid approaches:
    1. `beforeLineSpacing`/`afterLineSpacing` on `<p>` (format: "fixed:N", e.g. `<p beforeLineSpacing="fixed:10">`). EXCEPTION: cannot use inside `<li>`.
    2. Separate `<p>` elements — creates a default small gap automatically
    3. Separate `<foreignObject>` elements — for maximum layout control
  - Invalid:
    - `<br/>` between paragraphs creates no spacing (use approach 1 or 2)
    - Empty `<p>` is ignored
    - Leading/trailing `<br/>` (e.g. `<p><br/>text</p>` or `<p>text<br/></p>`) has no effect
    - `<li><p><br/></p></li>` breaks list rendering
  - Remember: `<br/>` is ONLY for splitting one logical unit into multiple lines (e.g., "Name<br/>Job Title"), NOT for creating gaps

Paragraph: `<p style="text-align:..; line-height:..; ...">`
- A structural paragraph separator. Controls text flow, NOT text appearance.
- Paragraph-level styling — put EVERYTHING in `style="..."` (CSS, semicolon-separated):
  - `text-align:left / center / right / justify`. `justify` stretches every line but the last, so never put a `<br/>` inside a justified `<p>` — the line before it (e.g. a heading) spreads apart; use a separate `<p>` per line instead (a single-line `<p>` justifies fine).
  - `letter-spacing:Npx`
  - `line-height:1.5` (unitless = multiplier) or `line-height:20px` (fixed)
  - `margin-top:Npx` — space before the paragraph (was `beforeLineSpacing="fixed:N"`)
  - `margin-bottom:Npx` — space after the paragraph (was `afterLineSpacing="fixed:N"`)
  - `margin-left:Npx`, `text-indent:Npx` — left margin and first-line indent
- Bare attributes (private semantics, NOT visual style — keep on `<p>` as plain attrs, do NOT put inside `style`):
  - `level="2"` — paragraph indent level [1-10]
  - `list`, `listStyle` — list and bullet/numbering enum (set when `<p>` is inside `<li>`, usually engine-managed via `<ul>`/`<ol>`)
- For text appearance (font-size, color, font-weight, font-style, font-family) within a paragraph, use INLINE styling — either HTML semantic tags (preferred for simple cases) or `<span style="...">`:
  - Just bold: `<p>Plain <strong>bold</strong> text</p>`
  - Just italic: `<p>Plain <em>italic</em> text</p>`
  - Bold + color: `<p>Plain <strong style="color:rgba(31,109,137,1)">bold colored</strong> text</p>`
  - Big size + color: `<p>Plain <span style="font-size:22px; color:rgba(31,109,137,1)">styled</span> text</p>`
- Valid Children: Plain text, inline elements (`<span>`, `<br/>`, `<strong>`, `<em>`, `<u>`, `<del>`, `<a>`, and `<span slide:role="math">` for inline equations)
- Always wrap text in `<p>` even for single-line content

Semantic text role (placeholder type) — use HTML-native block tags to mark WHAT a text block is, not just how it looks:
- A text foreignObject's block tag declares its slide placeholder type (the same five roles a PPT layout exposes). This is semantic, ON TOP of the CSS styling you still write normally:
  - `<h1>` → TITLE (cover title)
  - `<h2>` → HEADLINE (slide title)
  - `<h3>` → SUB_HEADLINE (subtitle)
  - `<p>`  → TEXT (body — the DEFAULT; keep using `<p>` for all ordinary prose, list items, labels)
  - `<small>` → SMALL_TEXT (caption / source line)
- Prefer the semantic tag for a slide's primary title, subtitle, and caption/source text: use `<h1>`/`<h2>`/`<h3>` for the title hierarchy and `<small>` for source/footnote/caption text. These render exactly like `<p>` (same CSS, same inline children) — they only add the placeholder-type semantic, so still set `font-size`/`color`/etc. in `style="..."` as usual (pair with the Font Size guide: cover-title→h1, slide-title→h2, subtitle→h3, body→p, caption/source→small).
- Rules:
  - ONLY as a DIRECT child of the text `<foreignObject>` (a sibling of `<p>`). `<small>` is also a valid INLINE tag — inside a `<p>` (e.g. `<p>¥99 <small>incl. tax</small></p>`) it stays inline small text and does NOT become a placeholder.
  - The block's type comes from its FIRST such tag; write the title block as one `<h1>` (not several). Mixed prose stays in `<p>`.
  - `<h4>`–`<h6>` carry no special type — they fall back to body `<p>`. Use only `<h1>`/`<h2>`/`<h3>`/`<small>`.
- Example (title + subtitle + source, three sibling blocks in one cover text box):
  `<foreignObject slide:role="shape" slide:shape-type="text" x="80" y="240" width="1120" height="220" style="color:rgba(20,20,20,1)"><h1 xmlns="http://www.w3.org/1999/xhtml" style="font-size:52px; font-weight:700">2025 Annual Review</h1><h3 xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px; color:rgba(110,110,110,1)">Growth, resilience, and what comes next</h3><small xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px; color:rgba(150,150,150,1)">Source: FY2025 audited report</small></foreignObject>`

Inline Styling — HTML semantic tags are PREFERRED over `<span>` for simple decorations:
- `<strong>text</strong>` — bold (semantic). Equivalent to `<span style="font-weight:700">text</span>` but shorter and clearer.
- `<em>text</em>` — italic. Equivalent to `<span style="font-style:italic">text</span>`.
- `<u>text</u>` — underline. Equivalent to `<span style="text-decoration:underline">text</span>`.
- `<del>text</del>` — strikethrough. Equivalent to `<span style="text-decoration:line-through">text</span>`.
- `<a href="https://...">link text</a>` — hyperlink. Use the HTML-native `href` attribute (NOT `slide:href`).
- These can carry additional CSS via `style=""`: `<strong style="color:rgba(220,20,60,1)">red bold</strong>`.

Inline Styled Text: `<span style="...">` — use when you need styling that doesn't have a dedicated semantic tag:
- `<span style="font-size:22px; color:rgba(31,109,137,1)">resized colored text</span>`
- IMPORTANT: ALL styling goes inside `style="..."`. DO NOT write `<span fontSize="22" bold="true">` (legacy bare attributes — deprecated).
- IMPORTANT: NEVER use Markdown syntax (`**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`) for text styling. Use the HTML tags above.
- CSS properties supported inside `style="..."`:
  - `font-size:Npx`, `font-family:..., ..., serif`
  - `color:rgba(...)`, `background-color:rgba(...)`
  - `font-weight:700` (bold), `font-style:italic`, `text-decoration:underline` / `text-decoration:line-through` / `text-decoration:underline line-through`
- Bare attribute kept on `<span>` for private editor semantics (NOT a CSS property — leave outside `style`):
  - `baseline="6"` — vertical offset in px (positive = superscript, negative = subscript)

Inline Math: `<span slide:role="math">LATEX</span>` — render a LaTeX equation inline within a paragraph (KaTeX).
- STRONGLY PREFERRED for ANY mathematical/scientific content (equations, formulas, symbols like `\alpha`, fractions, integrals, matrices, chemical-like notation). Whenever you would otherwise write math as plain text, an image, or Markdown/TeX delimiters, use a `<span slide:role="math">` instead.
- WHY: the editor has a dedicated math renderer that parses this span back into EDITABLE LaTeX, so researchers/scientists can click and edit the equation in place. Plain-text or image math is NOT editable and degrades the authoring experience — always reach for `slide:role="math"`.
- The span's text content is the raw LaTeX source. Do NOT include delimiters (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`) — write the bare LaTeX, e.g. `<span slide:role="math">E = mc^2</span>`.
- `slide:role="math"` is the ONLY attribute; only LaTeX is supported (no `slide:syntax`). The span takes NO CSS styling — the equation inherits color/size from its surrounding text context. This is the only inline element that carries a `slide:role`.
- XML-escape LaTeX special characters so the SVG stays valid XML: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`. Do NOT use CDATA (use entities). Examples: inequality `<span slide:role="math">x &lt; y</span>`, alignment `<span slide:role="math">a &amp;= b</span>`.
- Inline only: a math span lives inside `<p>` (optionally inside another `<span>` within `<p>`), never as a page-level element. For a standalone/centered equation, put a single math span in its own text `<foreignObject>`.
- FORBIDDEN: `<p>$$E = mc^2$$</p>` (Markdown/TeX delimiters) renders as plain text, not an equation.
- Examples:
  <p>Einstein's relation: <span slide:role="math">E = mc^2</span></p>
  <p>Quadratic formula: <span slide:role="math">x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</span></p>

Line Break: `<br/>` (self-closing)
- Splits ONE logical unit into multiple display lines within the same paragraph
- ONLY exists inside `<p>` elements, for cases like:
  - Splitting a name and title: `<p>John Smith<br/>CEO</p>`
  - Separating title and description in one list item: `<li><p><span bold="true">Title</span><br/>Description</p></li>`
- FORBIDDEN: paragraph separation, leading/trailing breaks, logical section separation (use separate `<p>` or `<foreignObject>` instead)

Lists: `<ul>` and `<ol>`
- Each `<ul>`/`<ol>` accepts only one attribute: `listStyle`. No other attributes.
  - `<ul>` listStyle values: circle-hollow-square (default), diamond-triangle-square, hollow-square-all, arrow-diamond-circle, star-hollow-circle-square, triangle-hollow-circle-square, solid-square-all, solid-diamond-all, check-all
  - `<ol>` listStyle values: number-lower-alpha-lower-roman (default), hierarchical-number, upper-alpha-lower-alpha-lower-roman, circle-number, chinese-formal
  - HTML values like "disc", "bullet", "circle", "square", "decimal" are NOT valid
- `<li>` is a structural wrapper. Accepts no styling attributes. Its ONLY valid child is exactly one `<p>`.
  - Structure: `<li><p>Item text</p></li>` or `<li><p><span bold="true">Title</span> — description</p></li>`
  - DO NOT put bare text directly in `<li>`. DO NOT use empty `<li>` for spacing.
- `<li>` automatically creates bullet points or numbering — don't add them manually
- To control spacing between list items: use `lineSpacing` on the parent `<foreignObject>`

Table: `<foreignObject slide:role="table" x="" y="" width="" height="">`
- Tables use `slide:role="table"` (NOT `slide:role="shape" slide:shape-type="table"` — table is its own block role, not a shape variant).
- Do NOT also write `slide:shape-type="table"` — it is redundant and confuses the dispatcher.
- Tables are rendered as xhtml `<table>` inside a `<foreignObject>`. Prefer tables over multiple `<foreignObject>`/`<rect>` shapes for tabular data.
- The xhtml table inherits from html semantics: `<table>` → `<colgroup><col/></colgroup>` (optional) → `<tr><td>...</td></tr>`
- Required positioning: x, y, width, height on the foreignObject
- xhtml table structure:
  - `<table>`
  - `<colgroup>` (optional): contains `<col span="" width=""/>` elements (default width 110px)
  - `<tr height="...">` (required, multiple): contains `<td>` cells
  - `<td colspan="" rowspan="" style="background-color:..; border:..; padding:..">`: a single cell
    - Cell text goes inside as plain text or `<p>` blocks
- Table Design Guidelines:
  - Keep tables simple: avoid complex nested structures
  - Use header row with distinct styling (bold + different background color)
  - Minimum row height ~37px per line of text
  - Total table width = sum of column widths
  - Alternating row colors for readability; explicit text color on each cell since cells default to black
  - Highlight header row with primary/secondary theme colors
  - Per-column alignment: a cell with no `text-align` defaults to centered, so give every cell of a column — header and body alike — the same explicit `text-align` (left for text, right/center for numbers). Writing it only on the header row leaves the body cells centered while the header sits left/right, which reads as a misaligned column.

Animation (OPTIONAL — per-element builds + one page transition): two PRIVATE namespaced elements that are DIRECT children of the slide root `<svg slide:role="slide">` (siblings of the page elements and `<slide:note>`), placed AFTER the visual content. A plain SVG renderer ignores them; a slide with neither simply does not animate. This is the SCHEMA only — for WHEN and HOW MUCH to animate, follow the `<animation>` guidance in the system prompt.
- Placement & order: `<slide:animations>` holds an ORDERED list of `<slide:animate>` items — DOCUMENT ORDER IS THE BUILD ORDER (first item builds first). At most ONE `<slide:transition>` per slide.
- Use tokens from the catalog below, spelled exactly. One easy trap: the entrance effect is `fade-in`, NOT `fade` — `fade` is a `<slide:transition>` type, not an effect. (e.g., trigger `after-prev`, direction `from-bottom`.)

`<slide:animate target="..." effect="..." .../>` — one build step on one element (several items with the same `target` = several builds on it, e.g. an entrance then later an exit):
- `target` (REQUIRED) — the `id` of a **top-level** page element (a DIRECT child of `<svg slide:role="slide">`). It can be a shape or a `<g>` group. **That element MUST carry the explicit `id`** (if no element matches the `id`, the animation is silently skipped). Note: A `<g>` group is ONE animation unit. The engine ignores animations on elements nested inside a `<g>`. To reveal logical parts sequentially (e.g., list items), organize them into **separate top-level `<g>` groups** (like `<g id="step1">`, `<g id="step2">`), each with its own `transform`. Do not flatten complex shapes just for animation.
- `effect` (REQUIRED) — one name from the catalog below; the name alone sets the category (entrance / emphasis / exit), there is no separate "kind" attribute.
- `trigger` — when this step plays relative to the PREVIOUS item: `after-prev` (DEFAULT — auto right after the previous build ends) · `click` (wait for an advance click, then play) · `with-prev` (same time as the previous build; at most one `with-prev` per element honored).
- `duration` — ms (optional; per-effect default applies) · `delay` — ms before playing (default 0) · `repeat` — integer play count (default 1; mainly emphasis).
- `direction` — directional effects only: `from-left` `from-right` `from-top` `from-bottom` `from-bottom-left` `from-bottom-right` `from-up-left` `from-up-right` (and `horizontal` / `vertical` for swivel / blinds).
- `scale` — `grow-shrink` only (target percent, e.g. `150`=grow to 150%, `50`=shrink) · `rotate` — `spin` only (degrees, e.g. `360`) · `spoke` — `wheel-in` / `wheel-out` only (`1` `2` `3` `4` `8`, default 1).
Effect catalog (the name implies the category):
- Entrance: `appear` `fade-in` `fly-in` `float-in` `expand` `swivel-in` `zoom-in` `grow-turn` `rise-up` `spinner-in` `basic-zoom-in` `stretch-in` `boomerang-in` `basic-swivel-in` `wipe-in` `wheel-in` `blinds-in`
- Emphasis: `grow-shrink` `spin` `pulse` `transparency` `teeter` `flash`
- Exit: `disappear` `fade-out` `fly-out` `float-out` `contract` `swivel-out` `zoom-out` `shrink-turn` `sink-down` `spinner-out` `basic-zoom-out` `stretch-out` `boomerang-out` `basic-swivel-out` `wipe-out` `wheel-out` `blinds-out`

`<slide:transition type="..." .../>` — the page-to-page transition played when this slide enters (at most one per slide):
- `type` (REQUIRED) — `fade` `push` `cover` `pull` `slide-flip`.
- `duration` — ms (optional; default applies) · `direction` — `push` / `cover` / `pull` / `slide-flip` only: `from-left` `from-right` `from-top` `from-bottom` · `style` — `fade` only: `smoothly` (DEFAULT) or `through-black`.
</available_components>

<styling_attributes>
All styling is via SVG-standard attributes directly on shape elements, with two extensions:
1. Gradients / patterns / filters use `<defs>` and `url(#id)` references.
2. Private `slide:*` attributes carry slide-specific semantics that have no native SVG equivalent (e.g., `slide:border-compound`).

Fill: `fill="..."` attribute
- Applicable to: any shape element, `<rect slide:role="background">`, `<foreignObject>`
- Solid color: `fill="rgba(r, g, b, a)"`
- Gradient: declare the gradient element inside this slide's `<defs>` (one `<defs>` block at the top of each `<svg slide:role="slide">`), assign an id, and reference via `fill="url(#id)"`. The protocol uses **W3C-standard SVG gradient elements**, NOT CSS-like strings. Ids are slide-local (each slide has its own defs scope).
  - Linear gradient:
    ```
    <defs>
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(100, 150, 200, 1)"/>
        <stop offset="100%" stop-color="rgba(50, 100, 150, 1)"/>
      </linearGradient>
    </defs>
    <rect ... fill="url(#bg-grad)"/>
    ```
  - Radial gradient — for a LOCALIZED glow drawn as a SHAPE on top of the background (translucent stops are correct here); NEVER as a `slide:role="background"` fill (see Slide background):
    ```
    <defs>
      <radialGradient id="shape-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(118, 185, 0, 0.35)"/>
        <stop offset="60%" stop-color="rgba(118, 185, 0, 0.08)"/>
        <stop offset="100%" stop-color="rgba(118, 185, 0, 0)"/>
      </radialGradient>
    </defs>
    <ellipse slide:role="shape" slide:shape-type="ellipse" ... fill="url(#shape-glow)"/>   <!-- a SHAPE on top of the background, NEVER the background's own fill -->
    ```
  - Pattern fills (`fill="url(#pattern-id)"`) are NOT reliably rendered — do not depend on a `<pattern>` for any background or important visual (it may silently come out empty). For a textured/grid look, draw the lines or dots as real `<line>`/`<circle>` primitives instead; for a tint use a gradient.
  - Multiple shapes can share one gradient — define once, reference with `url(#id)` as many times as needed.
  - Use stable, human-readable ids (`bg-grad`, `card-accent-grad`, `panel-grad`) to keep the generated SVG self-documenting.
- Omit `fill` entirely for transparent (no fill)

Border (stroke):
- Applicable to: any shape element, `<foreignObject>`
- Standard SVG attributes:
  - `stroke="rgba(...)"` — color
  - `stroke-width="..."` — width in viewBox units
  - `stroke-dasharray="..."` — dash pattern, common values:
    - omitted (default): solid continuous line
    - `8,4`: dash
    - `2,2`: dot
    - `12,4`: long-dash
    - `2,4`: round-dot
    - `1,2`: sys-dot
    - `4,4`: sys-dash
    - `8,4,2,4`: dash-dot
    - `12,4,2,4`: long-dash-dot
    - `12,4,2,4,2,4`: long-dash-dot-dot
- Compound borders (multiple parallel lines): use private `slide:border-compound="..."` attribute
  - Values: single (default), double, thin-thick, thick-thin, three

Shadow: use private `slide:shadow-*` attributes — the engine emits the corresponding `<defs><filter/></defs>` automatically. You do NOT need to manage filter ids.
- Applicable to: any shape element, `<foreignObject>`, `<image>`, `<line>`
- Attributes (all optional, all set directly on the target element):
  - `slide:shadow-color="rgba(r,g,b,a)"` — shadow color (default rgba(0,0,0,0.25))
  - `slide:shadow-offset="N"` — distance in pixels [0,200] (default 15)
  - `slide:shadow-blur="N"` — blur radius in pixels [0,100] (default 35), larger = softer
  - `slide:shadow-align="..."` — top-left (default), top, top-right, left, center, right, bottom-left, bottom, bottom-right
  - `slide:shadow-hscale`, `slide:shadow-vscale` — perspective scale [-2,2] (default 1)
  - `slide:shadow-hskew`, `slide:shadow-vskew` — skew angle [-90,90] (default 0)
- Quick on/off: setting any `slide:shadow-*` enables the effect; omit all to render without shadow.

Transform: `transform="..."`
- Standard SVG transform list
- Rotation: `transform="rotate(angle cx cy)"` — angle in degrees, around point (cx, cy)
- Flip: `transform="scale(-1, 1)"` (horizontal), `"scale(1, -1)"` (vertical)
- Multiple: space-separated, applied left-to-right

Opacity: `opacity="..."` — value in [0, 1]
</styling_attributes>

<about_icons>
The `<g slide:role="icon">` element renders an IconPark icon as a standalone visual object (NOT text).

Key characteristics of our icons:
- UI-style glyphs: simple, single-color, product-like icons
- Consistent visual language: stable style across the whole deck
- Neutral semantics: best for functional or structural meaning (navigation, category, concept markers), not for emotion or tone
- Precise layout control: icons are placed by `transform="translate(x,y)"` and sized by `slide:width`/`slide:height`, so they align well with grids and UI-like layouts

Icon vs Emoji:
- In some cases, using an emoji character is preferable to introducing an icon element
- Use icon when you want a clean, consistent UI symbol that fits professional or neutral slides and needs crisp alignment
- Use emojis when you want colorful, expressive, lively tone cues inside text, including representing human facial expressions, moods, or emotions

Typical Use Cases of Icons and Emojis:
- Visual Markers: Bullet point alternatives or list markers
- Section Headers: Pair section titles with relevant icons or emojis
- Emphasis: Add emotional context or highlight key points
- Metadata Display: Place alongside keywords or key information
</about_icons>

<canonical_examples>
Minimal slide (white background, title + body):
```
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide" id="slide-1"
     viewBox="0 0 1280 720">
  <rect slide:role="background" width="1280" height="720" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" id="title"
                 x="80" y="80" width="1120" height="64"
                 style="font-size:48px; color:rgba(20,20,20,1); font-weight:700">
    <p xmlns="http://www.w3.org/1999/xhtml">Slide Title Goes Here</p>
  </foreignObject>
  <foreignObject slide:role="shape" slide:shape-type="text" id="body"
                 x="80" y="180" width="1120" height="480"
                 style="font-size:20px; color:rgba(60,60,60,1); line-height:1.6">
    <p xmlns="http://www.w3.org/1999/xhtml">Body paragraph with key takeaway.</p>
    <ul xmlns="http://www.w3.org/1999/xhtml">
      <li><p>First supporting point</p></li>
      <li><p>Second supporting point</p></li>
    </ul>
  </foreignObject>
</svg>
```

Card with text overlay (rect background + foreignObject text):
```
<rect slide:role="shape" slide:shape-type="rect" id="card-bg"
      x="100" y="200" width="380" height="220"
      fill="rgba(245,247,250,1)" stroke="rgba(220,220,220,1)" stroke-width="1" rx="12" ry="12"/>
<foreignObject slide:role="shape" slide:shape-type="text" id="card-text"
               x="120" y="220" width="340" height="180"
               style="font-size:18px; color:rgba(50,50,50,1); vertical-align:top">
  <p xmlns="http://www.w3.org/1999/xhtml"><strong>Card Heading</strong></p>
  <p xmlns="http://www.w3.org/1999/xhtml">Card description text wraps inside the 340-pixel-wide box.</p>
</foreignObject>
```

Single shape with text inside (round-rect "pill"):
```
<foreignObject slide:role="shape" slide:shape-type="round-rect" id="pill-1"
               x="640" y="320" width="160" height="32"
               fill="rgba(31,109,137,1)" rx="16" ry="16"
               style="font-size:14px; color:rgba(255,255,255,1); text-align:center; padding:0">
  <p xmlns="http://www.w3.org/1999/xhtml">Status: Active</p>
</foreignObject>
```

Custom-path donut segment (note `slide:width`/`slide:height` = the path's REAL bbox, and the `d` lives in a `0..W × 0..H` box with `transform="translate(...)"` placing it on the slide — get these from `compute_custom_shape_bbox`; never use the canvas size):
```
<path slide:role="shape" slide:shape-type="custom" id="seg-1"
      d="M 0 26 C 70 0 152 9 212 53 L 80 133 C 47 133 18 152 0 181 Z"
      slide:width="212" slide:height="181"
      transform="translate(562,175)"
      fill="rgba(31,109,137,1)"/>
```

Image:
```
<image slide:role="image" slide:shape-type="image" id="img-1"
       x="100" y="100" width="320" height="200"
       href="/home/user/workspace/resources/images/hero.jpg"/>
```

Gradient-filled card (declare in slide-local `<defs>`, reference via url):
```
<defs>
  <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgba(31,109,137,1)"/>
    <stop offset="100%" stop-color="rgba(80,160,200,1)"/>
  </linearGradient>
</defs>
<rect slide:role="shape" slide:shape-type="rect" id="hero-bg"
      x="80" y="80" width="1120" height="200" rx="16" ry="16"
      fill="url(#hero-grad)"/>
```

Shape with shadow:
```
<rect slide:role="shape" slide:shape-type="rect" id="card-shadow"
      x="200" y="200" width="280" height="160" rx="8" ry="8"
      fill="rgba(255,255,255,1)"
      slide:shadow-color="rgba(0,0,0,0.15)" slide:shadow-offset="8" slide:shadow-blur="20"/>
```

Table (header row + alternating row colors + highlighted row):
```
<foreignObject slide:role="table" id="region-table"
               x="64" y="386" width="1152" height="226">
  <table xmlns="http://www.w3.org/1999/xhtml">
    <colgroup>
      <col width="300"/>
      <col width="200"/>
      <col width="326"/>
      <col width="326"/>
    </colgroup>
    <tr height="40">
      <td style="background-color:rgba(0,51,102,1); border:1px solid rgba(255,255,255,1); padding:10px 14px; color:rgba(255,255,255,1); font-weight:700; text-align:left">Region</td>
      <td style="background-color:rgba(0,51,102,1); border:1px solid rgba(255,255,255,1); padding:10px 14px; color:rgba(255,255,255,1); font-weight:700; text-align:right">Revenue $B</td>
      <td style="background-color:rgba(0,51,102,1); border:1px solid rgba(255,255,255,1); padding:10px 14px; color:rgba(255,255,255,1); font-weight:700; text-align:right">YoY</td>
      <td style="background-color:rgba(0,51,102,1); border:1px solid rgba(255,255,255,1); padding:10px 14px; color:rgba(255,255,255,1); font-weight:700; text-align:right">% of Total</td>
    </tr>
    <tr height="40">
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:left">North America</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">12.4</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">+8%</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">41%</td>
    </tr>
    <tr height="40">
      <td style="background-color:rgba(0,51,102,0.06); border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:left">EMEA</td>
      <td style="background-color:rgba(0,51,102,0.06); border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">9.1</td>
      <td style="background-color:rgba(0,51,102,0.06); border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">+5%</td>
      <td style="background-color:rgba(0,51,102,0.06); border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">30%</td>
    </tr>
    <tr height="40">
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:left">APAC</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">8.7</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">+12%</td>
      <td style="border:1px solid rgba(221,221,221,1); padding:10px 14px; color:rgba(40,40,40,1); text-align:right">29%</td>
    </tr>
  </table>
</foreignObject>
```
Notes for the table example:
- Outer attribute is `slide:role="table"` ONLY. NEVER write `slide:role="shape" slide:shape-type="table"`.
- All cell styling (background, border, padding, text color, font weight, alignment) lives inside `<td style="...">` as CSS. NEVER write `<td bgcolor="..." border="..."> ` or use legacy presentational child elements (`<borderTop>`, `<fill>`, `<content>`).
- `colspan`/`rowspan` are HTML-native — don't prefix them with `slide:`.
- Use rgba colors with decimal alpha (e.g., `rgba(0,110,186,0.10)`) to highlight rows; the parser handles alpha correctly.
- Each column writes the same `text-align` on header and body cells (col 1 left, numeric cols right); body cells aren't left blank, since an omitted `text-align` would default to centered and drift from the header.

Inline styling — prefer HTML semantic tags over `<span style="...">` for simple decorations:
```
<p xmlns="http://www.w3.org/1999/xhtml">
  Plain text, <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <del>strikethrough</del>,
  <strong style="color:rgba(220,20,60,1)">bold colored</strong>,
  <span style="font-size:22px; color:rgba(31,109,137,1)">resized colored</span>,
  and a <a href="https://example.com">link</a>.
</p>
```

Slide with animation (private `<slide:animations>` + one `<slide:transition>` as the LAST children of the slide root; each `target` references a page element's `id`; document order = build order):
```
<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="slide-3" viewBox="0 0 1280 720">
  <rect slide:role="background" width="1280" height="720" fill="rgba(255,255,255,1)"/>
  <foreignObject xmlns="http://www.w3.org/1999/xhtml" id="title" slide:role="shape" slide:shape-type="text" x="80" y="80" width="1120" height="60" style="font-size:36px"><p>One declarative title</p></foreignObject>
  <foreignObject xmlns="http://www.w3.org/1999/xhtml" id="point1" slide:role="shape" slide:shape-type="text" x="80" y="200" width="600" height="60" style="font-size:20px"><p>First supporting point</p></foreignObject>
  <rect id="chart" slide:role="chart" href="/home/user/workspace/.../chart.svg" x="720" y="200" width="480" height="300"/>

  <slide:transition type="push" direction="from-right"/>
  <slide:animations>
    <slide:animate target="title"  effect="fade-in" trigger="after-prev"/>
    <slide:animate target="point1" effect="wipe-in" trigger="click" direction="from-left"/>
    <slide:animate target="chart"  effect="zoom-in" trigger="click"/>
  </slide:animations>
</svg>
```
</canonical_examples>
</svg_reference>
````
