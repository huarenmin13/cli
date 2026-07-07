---
id: finish_slides_edit
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: validate_preview_repair
order: 50
cardinality: once
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - after_all_slide_edit_calls
consumes:
  - request/theme_contract.json
  - slides/*.svg
produces:
  - receipts/lint.json
  - receipts/preview.json
  - receipts/rendered_visual.json
  - receipts/image_usage.json
  - receipts/media_pressure.json
  - receipts/chart_usage.json
  - quality_report.json
  - anygen_semantic_report.json
  - visual_receipts.json
  - creative_quality_report.json
  - receipts/editorial_quality.json
  - receipts/screenshot_evidence.json
  - receipts/chart_quality.json
completion_gate:
  - validate_preview_rendered_visual_quality_semantic_creative_editorial_screenshot_chart_passed
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## finish_slides_edit

退出编辑模式并校验无占位页。工具描述

```text
Finish slide edit mode. Call this AFTER all slide_edit calls are completed. This restores the original model. The tool will verify that all slides have been edited — if any placeholder slides remain, the call will fail and you must edit them first.

The local SVGlide runtime must include `receipts/rendered_visual.json`, `receipts/image_usage.json`, `receipts/media_pressure.json`, `receipts/screenshot_evidence.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, `receipts/chart_quality.json`, and `receipts/editorial_quality.json`. Delivery is blocked when any of these receipts has `status=failed`, even if lint, semantic, creative, and quality reports otherwise pass.

Delivery is blocked when parser-safe lint fails. Local browser rendering is not enough: online slide creation must preserve text, assets, and foreground geometry through the slide parser. Reject SVGs with native `<text>/<tspan>`, root `<style>`, `class`, CSS variables, non-960×540 canvas, foreground geometry missing parser `slide:shape-type`, or text `foreignObject` direct `<div>` wrappers. `anygen_semantic_report.json.metrics.parser_unsafe_count` must be `0`.

Delivery is also blocked when `quality_report.json` contains a visual asset issue, such as missing real imagery or a missing real cover hero for an entity-driven deck.

Delivery is blocked when `request/theme_contract.json` is not reflected downstream: `outline/deck.json` must include the required page roles, asset manifests must cover required real-image roles when `asset_needs.requires_real_images=true`, and `visual_receipts.json` must describe how each slide executes the theme contract.

Delivery is blocked when `request/delivery_contract.json` is not satisfied. If `delivery_target=online_slide` or `both`, `publish/online_slide.json.status` must be `passed`; local `preview.html`, screenshots, uploaded HTML, or a PDF file do not count as online slide creation. If `requires_real_images=true`, selected real/evidence image assets must exist in `asset_inventory.json` and be referenced by slide SVGs.

Delivery is blocked when `receipts/image_usage.json` reports:
- a ready selected image asset not referenced by any slide SVG;
- a cover/full-bleed hero image used as a small thumbnail;
- a foreground subject image used only as a decorative background.

Delivery is blocked when `receipts/media_pressure.json` reports:
- too few dominant real-image pages for the topic archetype;
- a missing dominant real cover image when required;
- too many consecutive infographic-only pages;
- too few unique real images.

Delivery is blocked when `receipts/screenshot_evidence.json` is missing or its canvas metadata does not match the SVG viewBox. Screenshot evidence must record per-slide canvas size, viewport size, pixel size, scale, and screenshot path. A loose `contact-sheet.png` alone is not sufficient.

Delivery is blocked when `receipts/editorial_quality.json` fails. This catches decks that pass mechanical checks but still miss the visual floor for the topic.

Before finishing, inspect every slide as an image:
- The SVG source is parser-safe: 960×540 root, text as direct XHTML inside `foreignObject`, no native SVG text, no root CSS, no CSS variables, and foreground geometry has parser `slide:shape-type`.
- No visible text crosses a card, panel, metric box, or image dark-zone boundary.
- Secondary labels and footnotes do not touch borders or sit on unsafe edges.
- The cover has one strong topic-specific visual, not only title text.
- Adjacent slides do not share the same black-card or rounded-panel template.
- Typography roles are visibly different and topic-appropriate.
- Data charts have units, sources, labels or readable axes, and a conclusion-oriented title.
- Vega-Lite appears only where the slide needs a quantitative relationship; it is not used as a per-page default.
- Standard charts are embedded by `<rect slide:role="chart">`; `<image slide:role="chart">`, `<g slide:role="chart">`, hand-drawn chart primitives, and tiny unreadable chart slots fail chart usage.
- Tactical maps, risk radars, coordinate diagrams, pitch diagrams, and analytical fields have source-bound geometry. If the source only proves a score, biography, or generic context, the diagram is fake analysis and fails.
- Any diagram made only of decorative curves, bubbles, lanes, or axes must be replaced with a real image, sourced timeline, evidence collage, or properly sourced data/geometry visual before delivery.
- Visual receipts include `container_fit_plan`, `container_decision`, `text_carrier`, `card_budget`, and `chart_receipt` for each slide.

If any item fails, edit the SVG and update `visual_receipts.json` before producing `preview.html`.

Completion is not a full local SVGlide chain unless the run directory contains `run.json`, stage receipts, `quality_report.json`, `receipts/rendered_visual.json`, `receipts/image_usage.json`, `receipts/media_pressure.json`, `receipts/screenshot_evidence.json`, `receipts/editorial_quality.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, `receipts/chart_quality.json`, canvas-matched screenshot files referenced by screenshot evidence, and `receipts/delivery.json`. If final slides/assets/preview were manually edited, delivery evidence must mark `manual_patch.applied=true` with the file list and reason.
```
