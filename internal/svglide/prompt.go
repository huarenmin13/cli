package svglide

type PromptFile struct {
	Name    string
	Content string
}

func DefaultPromptFiles() []PromptFile {
	return []PromptFile{
		{Name: "01_request.task.md", Content: `# request

Inputs:
- request/request.json
- request/source_manifest.json

Outputs:
- request/request.json
- request/source_manifest.json

Receipt:
- receipts/request.json

Acceptance:
- title/input 必须存在且与本地源一致。
- source_manifest.sources 必须列出本地输入源路径和 type=local。

Do not:
- 不要联网发布或修改 slides 目录。
`},
		{Name: "02_research.task.md", Content: `# research

Inputs:
- request/request.json
- request/source_manifest.json
- local input source

Outputs:
- research/research_notes.md
- research/sources.json

Receipt:
- receipts/research.json

Acceptance:
- 结论必须能追溯到本地输入源。
- sources.json 必须保留来源路径和摘录用途。

Do not:
- 不要编造外部来源。
`},
		{Name: "03_design_brief.task.md", Content: `# design_brief

Inputs:
- request/request.json
- research/research_notes.md

Outputs:
- brief/design_brief.json
- brief/visual_system.json

Receipt:
- receipts/design_brief.json

Acceptance:
- design_brief.json 必须包含 narrative_spine/depth/tone。
- visual_system.json 必须包含 color_system/typography/layout_language。

Do not:
- 不要提前生成最终 SVG。
`},
		{Name: "04_outline.task.md", Content: `# outline

Inputs:
- brief/design_brief.json
- brief/visual_system.json

Outputs:
- outline/deck.json

Receipt:
- receipts/outline.json

Acceptance:
- 每页必须有 id/title/summary/role/key_message/path。
- deck.slides 顺序就是最终页序。

Do not:
- 不要把正文长文塞进 outline。
`},
		{Name: "05_slide_content.task.md", Content: `# slide_content

Inputs:
- outline/deck.json
- research/research_notes.md

Outputs:
- content/slide_content.md
- content/slide_content.json

Receipt:
- receipts/slide_content.json

Acceptance:
- slide_content.json 必须按 deck.slides 的 id 对齐。
- 每页内容必须支持对应 key_message。

Do not:
- 不要写最终 SVG。
`},
		{Name: "06_assets.task.md", Content: `# assets

Inputs:
- content/slide_content.json
- brief/visual_system.json

Outputs:
- assets/assets_plan.json
- assets/charts/*.svg when charts are required
- assets/images/* when local images are required

Receipt:
- receipts/assets.json

Acceptance:
- assets_plan.json 必须说明每个资产的 id/type/path/usage。
- 图表资产必须写入本地 assets/charts/*.svg。

Do not:
- 不要在 slides/*.svg 中引用远程 URL。
`},
		{Name: "07_svg_author.task.md", Content: `# svg_author

Inputs:
- outline/deck.json
- content/slide_content.json
- brief/visual_system.json
- assets/assets_plan.json
- assets/charts/*.svg
- assets/images/*

Outputs:
- slides/*.svg

Receipt:
- receipts/svg_author.json

Acceptance:
- 每个 deck slide 的 path 必须对应一个 slides/*.svg。
- 必须读取 deck、content、visual_system、assets 后再生成 SVG。
- 必须遵守 AnyGen SVG protocol 基本点：纯 SVG、960x540 viewBox、文本可选中、图形语义清晰、无远程资源引用。

Do not:
- 禁止只写背景。
- 不要把整页内容栅格化成单张图片。
- 不要发布到 Feishu Slides。
`},
		{Name: "08_repair.task.md", Content: `# validate_preview_repair

Inputs:
- slides/*.svg

Outputs:
- receipts/lint.json
- receipts/preview.json
- repair_queue.md
- preview.html

Receipt:
- receipts/validate_preview_repair.json

Acceptance:
- 先运行或触发本地 validate + preview，产出 receipts/lint.json、receipts/preview.json、repair_queue.md、preview.html。
- 如果 repair_queue.md 有修复项，再基于 repair_queue.md 与 receipts/lint.json 修复 slides/*.svg。
- 修复后再次确认 SVG 保持纯 SVG、可编辑、无远程资源引用。
- 最后写 receipts/validate_preview_repair.json，记录 validate、preview、repair 的状态和产物路径。

Do not:
- 不要通过删除内容来绕过检查。
- 不要跳过 lint/preview 直接写最终 receipt。
`},
	}
}

func DefaultSchemas() map[string]string {
	return map[string]string{
		"request.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "input"],
  "properties": {
    "title": {"type": "string"},
    "input": {"type": "string"},
    "audience": {"type": "string"},
    "delivery_mode": {"type": "string"},
    "pages": {"type": "integer"}
  }
}
`,
		"source_manifest.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["sources"],
  "properties": {
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "type"],
        "properties": {
          "path": {"type": "string"},
          "type": {"type": "string", "enum": ["local"]}
        }
      }
    }
  }
}
`,
		"sources.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["sources"],
  "properties": {
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "excerpt", "usage"],
        "properties": {
          "path": {"type": "string"},
          "excerpt": {"type": "string"},
          "usage": {"type": "string"}
        }
      }
    }
  }
}
`,
		"design_brief.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["narrative_spine", "depth", "tone"],
  "properties": {
    "narrative_spine": {"type": "string"},
    "depth": {"type": "string"},
    "tone": {"type": "string"}
  }
}
`,
		"visual_system.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["color_system", "typography", "layout_language"],
  "properties": {
    "color_system": {"type": "object"},
    "typography": {"type": "object"},
    "layout_language": {"type": "string"}
  }
}
`,
		"deck.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "slides"],
  "properties": {
    "title": {"type": "string"},
    "slides": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "title", "summary", "role", "key_message", "path"],
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "summary": {"type": "string"},
          "role": {"type": "string"},
          "key_message": {"type": "string"},
          "path": {"type": "string", "pattern": "^slides/[^/]+\\.svg$"}
        }
      }
    }
  }
}
`,
		"slide_content.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["slides"],
  "properties": {
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "content"],
        "properties": {
          "id": {"type": "string"},
          "content": {"type": "string"},
          "notes": {"type": "string"}
        }
      }
    }
  }
}
`,
		"assets_plan.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["assets"],
  "properties": {
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "type", "path", "usage"],
        "properties": {
          "id": {"type": "string"},
          "type": {"type": "string"},
          "path": {"type": "string"},
          "usage": {"type": "string"}
        }
      }
    }
  }
}
`,
		"receipt.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["stage", "status"],
  "properties": {
    "stage": {"type": "string"},
    "status": {"type": "string"},
    "message": {"type": "string"},
    "artifacts": {"type": "array", "items": {"type": "string"}}
  }
}
`,
		"lint.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "issues"],
  "properties": {
    "status": {"type": "string"},
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "code", "message"],
        "properties": {
          "path": {"type": "string"},
          "code": {"type": "string"},
          "message": {"type": "string"},
          "severity": {"type": "string"}
        }
      }
    }
  }
}
`,
		"preview.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "slides"],
  "properties": {
    "status": {"type": "string"},
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "rendered"],
        "properties": {
          "path": {"type": "string"},
          "rendered": {"type": "boolean"},
          "message": {"type": "string"}
        }
      }
    }
  }
}
`,
	}
}
