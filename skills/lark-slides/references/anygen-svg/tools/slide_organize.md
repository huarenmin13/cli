---
id: slide_organize
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: conditional
stage: outline
order: 60
cardinality: zero_or_more
requires:
  - mode_system_prompt_svg
condition: outline_changed_after_initial_generation
trigger:
  - add_delete_or_reorder_pages_after_outline
consumes:
  - outline/deck.json
produces:
  - outline/deck.json
  - receipts/tool_calls/outline/slide_organize.json
completion_gate:
  - deck_structure_valid
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slide_organize

大纲创建后增删页。工具描述

```text
Add or delete slide pages in an existing presentation project. Use this instead of calling slide_outline again when you need to modify the page structure after the initial outline is created. Operations are executed in order.
```
