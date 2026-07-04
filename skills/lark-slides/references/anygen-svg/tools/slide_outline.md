---
id: slide_outline
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: outline
order: 20
cardinality: once
requires:
  - mode_system_prompt_svg
condition: always
trigger:
  - create_project_structure
consumes:
  - brief/design_brief.json
  - brief/visual_system.json
produces:
  - outline/deck.json
  - receipts/tool_calls/outline/slide_outline.json
completion_gate:
  - deck_outline_schema_valid
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slide_outline

创建大纲 / 项目结构。tool_outline_svg.go.tmpl

```text
Create the project structure with outline metadata, style settings, and empty slide files.

<instructions>
- Use this tool AFTER preparing the slide content draft (slide_content.md)
- The outline defines: page ids, titles, summaries (structural metadata), NOT the detailed content
- This tool creates: project directory, outline.json, a style file, and empty `.svg` slide placeholders
- Each slide's actual content will be written later using slides_edit based on the content draft
- Follow the user's confirmed slide count. If they confirmed a range (e.g., "8-12"), aim for the middle of that range. If no count was specified, default to an 8-12 slide deck. Unless the user explicitly asked for a short / concise deck, never create fewer than 8 slides. Remember that structural slides (cover, agenda, section dividers, closing) consume pages too — factor them into your total so content slides don't get squeezed
</instructions>

<recommended_usage>
- Use to define the presentation structure and style before writing individual slides
</recommended_usage>
```
