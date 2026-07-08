# SVG Slides Authoring Rules

## Required Authoring Pattern

Write complete slide files. A slide edit is not a fragment, patch, or HTML page.

Use this order:

1. Optional `<defs>`.
2. One background as the first rendered child.
3. Top-level shapes, images, charts, groups, and optional notes.

Every rendered element that the slide engine must understand needs the appropriate `slide:role`. Do not depend on generic browser rendering when the protocol has an explicit semantic role.

## Forbidden Constructs

Do not use:

- `<style>` blocks;
- `class=`;
- `<div>` or `<section>` wrappers in text `foreignObject`;
- bare text under `foreignObject`;
- SVG `<text>`;
- SVG `<marker>`;
- hex colors;
- named colors;
- `none` for `fill` or `stroke`;
- role-less primitives in the rendered slide body.

## Text Boxes

Use plain text boxes for text-only content:

```xml
<foreignObject slide:role="shape" slide:shape-type="text" x="96" y="96" width="640" height="120" style="font-size:32px;color:rgba(15,23,42,1);line-height:1.2">
  <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Main argument</p>
</foreignObject>
```

Use shape-with-text only when the object is truly one styled box with one text block. If the card has multiple parts, use `<g slide:role="group">`.

## Image Elements

Use images when there is a real image asset or generated visual. The SVG file references the local asset path.

Informational images such as charts, diagrams, screenshots, and infographics must preserve their original ratio. Decorative images may be composed more freely, but should still fit the resolved design brief.

Unless the user explicitly requests no images, cover, section divider, and closing pages should use a large hero image or generated visual. Full-bleed image backgrounds use `<image slide:role="background">`; large non-background images use `<image slide:role="image" slide:shape-type="image">`.

When text sits on an image, place a semi-transparent `<rect slide:role="shape" slide:shape-type="shape">` scrim or a solid text zone after the image and before the text. Do not use SVG `<mask>` for this readability layer.

Generated cover, section divider, or closing images must not contain baked-in text. Render text as slide text on top of the image.

## Chart Embeds

A chart is an external SVG sidecar referenced by:

```xml
<rect slide:role="chart" href="resources/charts/example.svg" x="120" y="180" width="800" height="500"/>
```

Do not hand-draw a chart from primitives when the slide's point depends on a real quantitative data series. Use the chart workflow to generate the sidecar first.

## Custom Paths

Custom paths require accurate bounds. `slide:width` and `slide:height` describe the real extent of the path data, not the full canvas.

If a path has not been normalized, measure its bounding box before writing the final slide. Oversized path boxes make selection, hit testing, and layout misleading.

## Grouped Cards

Use `<g slide:role="group">` for a multi-element cluster: card background, badge, icon, title, body, chart, image, or connector. Each child still carries its own role.

Do not use `<g slide:role="shape">` as a generic container. It is only for the shape-with-text form.

## Source Coverage

- Covers manifest sections: slides_edit_tool, image_usage, compute_custom_shape_bbox_tool
- Coverage mode: preserve authoring constraints and tool semantics that affect generated SVG structure.
