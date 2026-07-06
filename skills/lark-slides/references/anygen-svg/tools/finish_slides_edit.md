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
  - slides/*.svg
produces:
  - receipts/lint.json
  - receipts/preview.json
  - receipts/rendered_visual.json
  - receipts/image_usage.json
  - receipts/chart_usage.json
  - quality_report.json
  - anygen_semantic_report.json
  - visual_receipts.json
  - creative_quality_report.json
  - receipts/chart_quality.json
completion_gate:
  - validate_preview_rendered_visual_quality_semantic_creative_chart_passed
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

The local SVGlide runtime must include `receipts/rendered_visual.json`, `receipts/image_usage.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, and `receipts/chart_quality.json`. Delivery is blocked when any of these receipts has `status=failed`, even if lint, semantic, creative, and quality reports otherwise pass.

Delivery is also blocked when `quality_report.json` contains a visual asset issue, such as missing real imagery or a missing real cover hero for an entity-driven deck.

Delivery is blocked when `receipts/image_usage.json` reports:
- a ready selected image asset not referenced by any slide SVG;
- a cover/full-bleed hero image used as a small thumbnail;
- a foreground subject image used only as a decorative background.

Before finishing, inspect every slide as an image:
- No visible text crosses a card, panel, metric box, or image dark-zone boundary.
- Secondary labels and footnotes do not touch borders or sit on unsafe edges.
- The cover has one strong topic-specific visual, not only title text.
- Adjacent slides do not share the same black-card or rounded-panel template.
- Typography roles are visibly different and topic-appropriate.
- Data charts have units, sources, labels or readable axes, and a conclusion-oriented title.
- Vega-Lite appears only where the slide needs a quantitative relationship; it is not used as a per-page default.
- Standard charts are embedded by `<rect slide:role="chart">`; `<image slide:role="chart">`, `<g slide:role="chart">`, hand-drawn chart primitives, and tiny unreadable chart slots fail chart usage.
- Visual receipts include `container_fit_plan`, `container_decision`, `text_carrier`, `card_budget`, and `chart_receipt` for each slide.

If any item fails, edit the SVG and update `visual_receipts.json` before producing `preview.html`.

Completion is not a full local SVGlide chain unless the run directory contains `run.json`, stage receipts, `quality_report.json`, `receipts/rendered_visual.json`, `receipts/image_usage.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, `receipts/chart_quality.json`, screenshot evidence such as `contact-sheet.png` or `screenshots/slide-*.png`, and `receipts/delivery.json`. If final slides/assets/preview were manually edited, delivery evidence must mark `manual_patch.applied=true` with the file list and reason.
```
