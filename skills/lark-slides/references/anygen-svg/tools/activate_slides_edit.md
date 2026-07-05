---
id: activate_slides_edit
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: svg_author
order: 30
cardinality: once
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - before_slide_edit
consumes:
  - outline/deck.json
  - content/slide_content.json
  - assets/assets_manifest.json
produces:
  - receipts/tool_calls/svg_author/activate_slides_edit.json
completion_gate:
  - edit_session_active
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## activate_slides_edit

进入快速写图模型。工具描述

```text
Activate slide edit mode. Call this AFTER slide_outline and BEFORE slide_edit. This switches to a faster model optimized for writing slides. Pass project_dir.
```
