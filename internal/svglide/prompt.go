package svglide

func DefaultSchemas() map[string]string {
	return map[string]string{
		"request.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["title"],
  "properties": {
    "title": {"type": "string"},
    "input": {"type": "string"},
    "topic": {"type": "string"},
    "purpose": {"type": "string"},
    "audience": {"type": "string"},
    "delivery_mode": {"type": "string"},
    "language": {"type": "string"},
    "template": {"type": "boolean"},
    "template_requested": {"type": "boolean"},
    "intent": {"type": "object"},
    "agent": {"type": "object"},
    "pages": {"type": "integer"},
    "visual_style_query": {"type": "array", "items": {"type": "string"}}
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
        "required": ["type"],
        "properties": {
          "path": {"type": "string"},
          "topic": {"type": "string"},
          "type": {"type": "string", "enum": ["local", "topic"]}
        }
      }
    }
  }
}
`,
		"sources.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["sources", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "path", "title", "excerpt", "usage", "retrieval"],
        "properties": {
          "id": {"type": "string"},
          "path": {"type": "string"},
          "title": {"type": "string"},
          "excerpt": {"type": "string"},
          "usage": {"type": "string"},
          "retrieval": {"type": "string", "enum": ["full_page", "local_file", "user_provided"]}
        }
      }
    }
  }
}
`,
		"design_brief.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["narrative_spine", "depth", "tone", "visual_system", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "design_rationale": {"type": "string"},
    "narrative_spine": {"type": "object"},
    "depth": {"type": "object"},
    "tone": {"type": "string"},
    "visual_system": {
      "type": "object",
      "required": ["color_system", "typography", "layout_language"],
      "properties": {
        "color_system": {"type": "object"},
        "typography": {"type": "object"},
        "layout_language": {"type": "object"},
        "imagery_treatment": {"type": "object"},
        "material_texture": {"type": "object"},
        "decoration_language": {"type": "object"},
        "mood_coordinates": {"type": "object"}
      }
    }
  }
}
`,
		"visual_system.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["color_system", "typography", "layout_language", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "color_system": {"type": "object"},
    "typography": {"type": "object"},
    "layout_language": {"type": "object"},
    "imagery_treatment": {"type": "object"},
    "material_texture": {"type": "object"},
    "decoration_language": {"type": "object"},
    "mood_coordinates": {"type": "object"}
  }
}
`,
		"deck.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["main_title", "style_instruction", "slides", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "main_title": {"type": "string"},
    "title": {"type": "string"},
    "style_instruction": {
      "type": "object",
      "required": ["aesthetic_direction", "color_palette", "typography"],
      "properties": {
        "aesthetic_direction": {"type": "string"},
        "color_palette": {"type": "object"},
        "typography": {"type": "object"}
      }
    },
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
          "page_title": {"type": "string"},
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
  "required": ["slides", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "content", "source_refs", "visuals"],
        "properties": {
          "id": {"type": "string"},
          "content": {"type": "string"},
          "notes": {"type": "string"},
          "source_refs": {"type": "array", "items": {"type": "string"}},
          "visuals": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["id", "type", "instruction"],
              "properties": {
                "id": {"type": "string"},
                "type": {"type": "string", "enum": ["image", "diagram", "icon", "chart", "table", "crop", "none"]},
                "instruction": {"type": "string"}
              }
            }
          }
        }
      }
    }
  }
}
`,
		"assets_plan.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["mode", "assets", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "no_image_reason": {"type": "string"},
    "mode": {"type": "string", "enum": ["experiment_unrestricted_assets"]},
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "type", "path", "usage", "status"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "type": {"type": "string", "enum": ["image", "diagram", "icon", "chart", "table", "crop"]},
          "path": {"type": "string"},
          "usage": {"type": "string"},
          "status": {"type": "string", "enum": ["ready", "missing", "deferred"]}
        }
      }
    }
  }
}
`,
		"quality.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "issues", "metrics"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "code", "message", "severity"],
        "properties": {
          "path": {"type": "string"},
          "code": {"type": "string"},
          "message": {"type": "string"},
          "severity": {"type": "string"}
        }
      }
    },
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slides", "sources", "web_sources", "assets", "slides_with_source_refs", "slides_with_visuals"],
      "properties": {
        "slides": {"type": "integer"},
        "sources": {"type": "integer"},
        "web_sources": {"type": "integer"},
        "assets": {"type": "integer"},
        "slides_with_source_refs": {"type": "integer"},
        "slides_with_visuals": {"type": "integer"}
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
		"anygen_semantic_report.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "contract", "findings"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "contract": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "role", "path", "sha256", "rules"],
      "properties": {
        "id": {"type": "string"},
        "role": {"type": "string"},
        "path": {"type": "string"},
        "sha256": {"type": "string"},
        "rules": {"type": "integer"}
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["rule_id", "kind", "severity", "code", "message"],
        "properties": {
          "rule_id": {"type": "string"},
          "kind": {"type": "string"},
          "severity": {"type": "string"},
          "code": {"type": "string"},
          "artifact": {"type": "string"},
          "field": {"type": "string"},
          "message": {"type": "string"},
          "path": {"type": "string"},
          "value": {"type": "string"}
        }
      }
    }
  }
}
`,
		"delivery.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "deck", "slides_dir", "slides", "preview", "quality_report", "anygen_semantic_report"],
  "properties": {
    "status": {"type": "string", "enum": ["ready"]},
    "deck": {"type": "string"},
    "slides_dir": {"type": "string"},
    "slides": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "preview": {"type": "string"},
    "quality_report": {"type": "string"},
    "anygen_semantic_report": {"type": "string"}
  }
}
`,
		"prompt_context.schema.json": `{
  "type": "object",
  "additionalProperties": true,
  "required": ["stage", "protocol", "agent_task", "prompt_contract", "tool_invocation_contract", "asset_hashes"],
  "properties": {
    "stage": {"type": "string"},
    "protocol": {"type": "string"},
    "agent_task": {"type": "object"},
    "prompt_contract": {"type": "object"},
    "tool_invocation_contract": {"type": "object"},
    "asset_hashes": {"type": "object"}
  }
}
`,
		"tool_call_receipt.schema.json": `{
  "type": "object",
  "additionalProperties": true,
  "required": ["stage", "prompt_id", "status"],
  "properties": {
    "stage": {"type": "string"},
    "prompt_id": {"type": "string"},
    "status": {"type": "string"},
    "consumed": {"type": "array", "items": {"type": "string"}},
    "produced": {"type": "array", "items": {"type": "string"}}
  }
}
`,
	}
}
