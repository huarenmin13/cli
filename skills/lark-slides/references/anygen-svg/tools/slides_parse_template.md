<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slides_parse_template

解析模板元数据。tool_parse_template.go.tmpl

```text
Parse and preprocess a SXSD XML template for template-based slide generation.

This tool takes an XML template file and produces a processed version (tmpl.xml) optimized for template-based generation:
- Extracts embedded images to sandbox filesystem
- Normalizes coordinate precision and formatting
- Prepares the template structure for layout replication

IMPORTANT: This tool only accepts .xml files.
- If user uploads a .pptx file and wants to use it as a template, you MUST first call slides_convert to convert it, then use the returned xml_path as input to this tool.

INPUT:
- folder_name: folder name for storing template files (e.g., 'my_template'). Will be placed under /home/user/workspace/slides/template/
- file_path: path to the XML template file (must be .xml, typically the xml_path returned by slides_convert)

OUTPUT:
- tmpl_path: absolute path to processed template XML '{folder}/tmpl.xml'

After parsing, read tmpl.xml to understand the template's layout patterns, then replicate those layouts when writing SML with slide_edit.
```
