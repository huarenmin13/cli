---
id: slides_convert
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: conditional
stage: research
order: 90
cardinality: zero_or_more
requires:
  - mode_system_prompt_svg
condition: input_is_pptx
trigger:
  - uploaded_pptx_edit_or_analysis
consumes:
  - request/source_manifest.json
produces:
  - research/converted_pptx_manifest.json
  - receipts/tool_calls/research/slides_convert.json
completion_gate:
  - pptx_converted_to_editable_deck
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slides_convert

把上传 PPTX 导入成可编辑 deck（两协议共用；SVG 下产出 .svg）。tool_convert_pptx.go.tmpl

```text
Convert and parse a user-uploaded PPTX file to editable .slides format.

This is the ONLY tool for reading/parsing/converting PPTX files. It converts the user's PPTX file into an editable .slides presentation with individual XML files for each slide.

IMPORTANT: NEVER use python-pptx, node-pptx, or write your own script to parse PPTX files. Always use this tool instead.

USE CASES:
- User wants to edit/modify their existing PPTX presentation
- User wants to convert PPTX to editable format for manual editing
- User needs to view their PowerPoint file in the slides editor
- User wants to read/understand the content of a PPTX file (convert first, then read the XML files)
- User wants to summarize or analyze a PPTX presentation

WORKFLOW:
1) Parse the PPTX file and convert to SXSD XML format via RPC
2) Extract each slide into individual XML files (slide_1.xml, slide_2.xml, etc.)
3) Create a .slides manifest file for the editor to render
4) Store converted.xml as reference (hidden file)

INPUT:
- file_path: path to the PPTX file to convert (must be a .pptx file)
- directory: sandbox path to store the converted files (e.g., '/home/user/workspace/slides/my_presentation')

OUTPUT:
- slides_path: absolute path to the .slides manifest file ('{directory}.slides') - use this path for slides_update
- slide_count: number of slides extracted from the PPTX
- directory: directory containing individual slide XML files

IMPORTANT:
- After conversion, use slides_update tool with the slides_path to modify the presentation
- The original PPTX content is preserved exactly in the converted .slides file
- If user wants to use PPTX as a STYLE REFERENCE for new slides, use slides_parse_template instead
```
