<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## compute_custom_shape_bbox

SVG 专属：算 custom path 真实包围盒。工具描述

```text
Compute the exact bounding box of one or more SVG custom-shape paths. You CANNOT eyeball a path's real size, so before writing any <path slide:role="shape" slide:shape-type="custom"> call this with each path's `d`. For each path it returns the true width/height, a normalized `d` (shifted to the (0,0) origin) and an (offsetX, offsetY). Author the element as: <path slide:shape-type="custom" d="<returned d>" slide:width="<width>" slide:height="<height>" transform="translate(<offsetX>,<offsetY>)" .../> — never set slide:width/slide:height to the slide/canvas size.
```

