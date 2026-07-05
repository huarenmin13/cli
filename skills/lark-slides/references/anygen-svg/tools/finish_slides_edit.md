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
  - quality_report.json
  - anygen_semantic_report.json
  - visual_receipts.json
  - creative_quality_report.json
completion_gate:
  - validate_preview_rendered_visual_quality_semantic_creative_passed
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

The local SVGlide runtime must include `receipts/rendered_visual.json`. Delivery is blocked when this receipt has `status=failed`, even if lint, semantic, creative, and quality reports otherwise pass.

Delivery is also blocked when `quality_report.json` contains a visual asset issue, such as missing real imagery or a missing real cover hero for an entity-driven deck.
```
