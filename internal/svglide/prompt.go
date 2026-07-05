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
		"entity_resolution.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "input_text", "resolved_entity", "ambiguity", "research_required", "clarification_question"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "input_text": {"type": "string"},
    "resolved_entity": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "type", "confidence_bp", "confidence_band", "reason"],
      "properties": {
        "name": {"type": "string"},
        "type": {"type": "string"},
        "confidence_bp": {"type": "integer"},
        "confidence_band": {"type": "string", "enum": ["high", "medium", "low"]},
        "reason": {"type": "string"}
      }
    },
    "ambiguity": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "candidates"],
      "properties": {
        "status": {"type": "string", "enum": ["resolved", "needs_clarification", "unknown"]},
        "candidates": {"type": "array", "items": {"type": "string"}}
      }
	    },
	    "research_required": {"type": "boolean"},
	    "visual_quality_contract": {
	      "type": "object",
	      "additionalProperties": false,
	      "properties": {
	        "profile": {"type": "string", "enum": ["brand_official_site", "product_official_site", "place_official_site", "film_or_media_entity", "data_report", "text_only"]},
	        "requires_real_images": {"type": "boolean"},
	        "min_image_coverage_bp": {"type": "integer"},
	        "min_unique_images": {"type": "integer"},
	        "min_official_images": {"type": "integer"},
	        "allow_repeated_hero_only": {"type": "boolean"},
	        "cover_requires_real_hero_image": {"type": "boolean"},
	        "required_chart_renderer": {"type": "string", "enum": ["none", "svg", "vega-lite"]},
	        "min_chart_svg_assets": {"type": "integer"},
	        "min_vega_lite_specs": {"type": "integer"},
	        "typography_contract_required": {"type": "boolean"},
	        "forbid_preview_wrapper_images_as_real_images": {"type": "boolean"},
	        "reason": {"type": "string"},
	        "mode": {"type": "string", "enum": ["benchmark", "default_floor"]},
	        "benchmark_available": {"type": "boolean"},
	        "benchmark_usage": {"type": "string", "enum": ["quality_floor_only"]},
	        "deck_type": {"type": "string"},
	        "must_have": {
	          "type": "object",
	          "additionalProperties": false,
	          "properties": {
	            "strong_cover": {"type": "boolean"},
	            "semantic_image_coverage_min_bp": {"type": "integer"},
	            "evidence_page_min_visuals": {"type": "integer"},
	            "max_repeated_layout_ratio_bp": {"type": "integer"},
	            "visual_roles_required": {"type": "array", "items": {"type": "string"}},
	            "total_image_refs_min": {"type": "integer"}
	          }
	        }
	      }
	    },
	    "clarification_question": {"type": "string"}
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
		"research_coverage.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "entity", "queries", "sources", "coverage"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "entity": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "type"],
      "properties": {
        "name": {"type": "string"},
        "type": {"type": "string"}
      }
    },
    "queries": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["query", "purpose"],
        "properties": {
          "query": {"type": "string"},
          "purpose": {"type": "string", "enum": ["entity_disambiguation", "facts", "visuals", "context"]}
        }
      }
    },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "title", "url", "retrieved_at", "usage", "status"],
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "url": {"type": "string"},
          "retrieved_at": {"type": "string"},
          "usage": {"type": "string", "enum": ["identity", "plot", "context", "visual_reference", "data"]},
          "status": {"type": "string", "enum": ["retrieved", "failed", "unavailable"]}
        }
      }
    },
    "coverage": {
      "type": "object",
      "additionalProperties": false,
      "required": ["identity_confirmed", "has_reliable_source", "minimum_source_count_met", "source_count", "topic_only_rationale"],
      "properties": {
        "identity_confirmed": {"type": "boolean"},
        "has_reliable_source": {"type": "boolean"},
        "minimum_source_count_met": {"type": "boolean"},
        "source_count": {"type": "integer"},
        "topic_only_rationale": {"type": "string"}
      }
    }
  }
}
`,
		"design_brief.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["narrative_spine", "depth", "tone", "visual_system", "deck_visual_system", "prompt_contract"],
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
    },
    "deck_visual_system": {
      "type": "object",
      "additionalProperties": false,
      "required": ["visual_keywords", "palette", "fonts", "page_family_budget", "asset_strategy"],
      "properties": {
        "visual_keywords": {"type": "array", "minItems": 1, "items": {"type": "string"}},
        "palette": {"type": "object"},
        "fonts": {
          "type": "object",
          "additionalProperties": false,
          "required": ["font_display", "font_body", "font_number", "font_label"],
          "properties": {
            "font_display": {"type": "string"},
            "font_body": {"type": "string"},
            "font_number": {"type": "string"},
            "font_label": {"type": "string"}
          }
        },
        "page_family_budget": {"type": "object"},
        "asset_strategy": {"type": "object"},
        "recurring_hero_rationale": {"type": "string"},
        "single_source_rationale": {"type": "string"}
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
        "required": ["id", "title", "summary", "role", "key_message", "layout_family", "layout_archetype", "layout_signature", "story_function", "primary_asset_role", "fusion_candidate", "path"],
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "page_title": {"type": "string"},
          "summary": {"type": "string"},
          "role": {"type": "string"},
          "visual_role": {"type": "string"},
          "visual_intent": {"type": "string"},
          "key_message": {"type": "string"},
          "layout_family": {"type": "string", "enum": ["full_bleed_hero", "image_text_fusion_split", "evidence_board", "timeline_route", "data_scoreboard", "character_product_focus", "quiet_synthesis"]},
          "layout_archetype": {"type": "string", "enum": ["full_bleed_photo_title", "poster_stat_lockup", "image_argument_split", "annotated_image", "evidence_collage", "timeline_path", "data_scoreboard", "statement_ledger", "waterfall_bridge", "peer_bubble_field", "risk_radar", "closing_poster"]},
          "layout_signature": {"type": "string"},
          "story_function": {"type": "string"},
          "primary_asset_role": {"type": "string"},
          "fusion_candidate": {"type": "boolean"},
          "path": {"type": "string", "pattern": "^slides/[^/]+\\.svg$"}
        }
      }
    }
  }
}
`,
		"typography_contract.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "profile", "roles", "rules"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "profile": {"type": "string"},
    "rules": {"type": "array", "items": {"type": "string"}},
    "roles": {
      "type": "object",
      "additionalProperties": false,
      "required": ["display", "body", "number", "label"],
      "properties": {
        "display": {"type": "object"},
        "body": {"type": "object"},
        "number": {"type": "object"},
        "label": {"type": "object"}
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
          "source_refs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
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
		"slide_copy_plan.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "slides"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "slides": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "audience_copy", "production_instruction"],
        "properties": {
          "id": {"type": "string"},
          "audience_copy": {
            "type": "object",
            "additionalProperties": false,
            "required": ["title", "body", "labels"],
            "properties": {
              "title": {"type": "string"},
              "body": {"type": "string"},
              "labels": {"type": "array", "items": {"type": "string"}}
            }
          },
          "production_instruction": {
            "type": "object",
            "additionalProperties": false,
            "required": ["layout", "asset_ids"],
            "properties": {
              "layout": {"type": "string"},
              "asset_ids": {"type": "array", "items": {"type": "string"}}
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
		"assets_manifest.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["assets", "prompt_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "no_image_reason": {"type": "string"},
    "mode": {"type": "string"},
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "kind", "status", "usage"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "visual_id": {"type": "string"},
          "kind": {"type": "string", "enum": ["image", "chart", "diagram", "icon", "generated_svg", "table", "crop"]},
          "local_path": {"type": "string"},
          "source_url": {"type": "string"},
          "status": {"type": "string", "enum": ["ready", "unavailable", "needs_generation", "deferred", "missing"]},
          "usage": {"type": "string"},
          "missing_reason": {"type": "string"}
        }
      }
    }
  }
}
`,
		"asset_inventory.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "items"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "path", "source_url", "width", "height", "semantic_type", "large_ok", "full_bleed_ok", "recommended_use", "avoid_reason"],
        "properties": {
          "id": {"type": "string"},
          "path": {"type": "string"},
          "source_url": {"type": "string"},
          "width": {"type": "integer"},
          "height": {"type": "integer"},
          "semantic_type": {"type": "string"},
          "large_ok": {"type": "boolean"},
          "full_bleed_ok": {"type": "boolean"},
          "recommended_use": {"type": "string"},
          "avoid_reason": {"type": "string"}
        }
      }
    }
  }
}
`,
		"chart_manifest.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "renderer", "charts"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "renderer": {"type": "string", "enum": ["none", "svg", "vega-lite"]},
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "renderer", "svg_path"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "renderer": {"type": "string", "enum": ["svg", "vega-lite"]},
          "spec_path": {"type": "string"},
          "svg_path": {"type": "string"},
          "source_id": {"type": "string"}
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
	      "required": ["slides", "sources", "web_sources", "assets", "slides_with_source_refs", "slides_with_visuals", "slides_with_image_assets", "image_coverage_bp", "unique_image_assets", "official_image_assets"],
	      "properties": {
	        "slides": {"type": "integer"},
	        "sources": {"type": "integer"},
	        "web_sources": {"type": "integer"},
	        "assets": {"type": "integer"},
	        "slides_with_source_refs": {"type": "integer"},
	        "slides_with_visuals": {"type": "integer"},
	        "slides_with_image_assets": {"type": "integer"},
	        "image_coverage_bp": {"type": "integer"},
	        "unique_image_assets": {"type": "integer"},
	        "official_image_assets": {"type": "integer"},
	        "real_image_assets": {"type": "integer"},
	        "slides_with_real_image_assets": {"type": "integer"},
	        "generated_svg_assets": {"type": "integer"},
	        "chart_svg_assets": {"type": "integer"},
	        "vega_lite_spec_assets": {"type": "integer"},
	        "preview_wrapper_image_count": {"type": "integer"},
	        "cover_real_hero_image": {"type": "boolean"},
	        "typography_contract_present": {"type": "boolean"},
	        "total_image_refs": {"type": "integer"},
	        "strong_cover": {"type": "boolean"},
	        "evidence_page_max_visuals": {"type": "integer"},
	        "repeated_layout_ratio_bp": {"type": "integer"},
	        "visual_role_coverage_bp": {"type": "integer"},
	        "rendered_visual_issue_count": {"type": "integer"},
	        "rendered_visual_text_overflow_count": {"type": "integer"},
	        "rendered_visual_text_collision_count": {"type": "integer"},
	        "rendered_visual_out_of_canvas_count": {"type": "integer"},
	        "visual_asset_required": {"type": "boolean"},
	        "visual_asset_issue_count": {"type": "integer"},
	        "cover_real_hero_required": {"type": "boolean"},
	        "cover_real_hero_present": {"type": "boolean"}
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
  "required": ["status", "missing_asset_count", "slides"],
	  "properties": {
	    "status": {"type": "string"},
	    "missing_asset_count": {"type": "integer"},
	    "browser_missing_asset_count": {"type": "integer"},
	    "rendered_visual": {"type": "string"},
	    "rendered_visual_issue_count": {"type": "integer"},
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
		"rendered_visual.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "metrics", "issues", "slides"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slides", "issue_count", "out_of_canvas_count", "text_overflow_count", "text_collision_count", "unsafe_edge_count"],
      "properties": {
        "slides": {"type": "integer"},
        "issue_count": {"type": "integer"},
        "out_of_canvas_count": {"type": "integer"},
        "text_overflow_count": {"type": "integer"},
        "text_collision_count": {"type": "integer"},
        "unsafe_edge_count": {"type": "integer"}
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "code", "message", "severity"],
        "properties": {
          "path": {"type": "string"},
          "slide_id": {"type": "string"},
          "element_id": {"type": "string"},
          "code": {"type": "string"},
          "message": {"type": "string"},
          "severity": {"type": "string"},
          "x": {"type": "number"},
          "y": {"type": "number"},
          "width": {"type": "number"},
          "height": {"type": "number"}
        }
      }
    },
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "status", "issue_count"],
        "properties": {
          "path": {"type": "string"},
          "status": {"type": "string", "enum": ["passed", "failed"]},
          "issue_count": {"type": "integer"}
        }
      }
    }
  }
}
`,
		"anygen_semantic_report.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "contract", "metrics", "findings"],
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
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slide_count", "slides_with_slide_role", "image_count", "text_count", "note_count", "source_ref_count", "missing_asset_count", "slides_without_source_refs", "visible_leak_count", "font_token_count", "missing_font_token_count"],
      "properties": {
        "slide_count": {"type": "integer"},
        "slides_with_slide_role": {"type": "integer"},
        "image_count": {"type": "integer"},
        "text_count": {"type": "integer"},
        "note_count": {"type": "integer"},
        "source_ref_count": {"type": "integer"},
        "missing_asset_count": {"type": "integer"},
        "slides_without_source_refs": {"type": "integer"},
        "visible_leak_count": {"type": "integer"},
        "font_token_count": {"type": "integer"},
        "missing_font_token_count": {"type": "integer"}
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
		"visual_receipts.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["slides"],
  "properties": {
    "slides": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["slide_id", "story_job", "layout_family", "layout_archetype", "layout_signature", "thumbnail_job", "visual_center", "topic_fit_claim", "information_density_plan", "page_difference_from_previous", "primary_asset", "asset_role", "font_role_usage", "composition_intent", "data_visual_rationale", "source_evidence", "fusion_spec", "qa_expectations"],
        "properties": {
          "slide_id": {"type": "string"},
          "story_job": {"type": "string"},
          "layout_family": {"type": "string"},
          "layout_archetype": {"type": "string"},
          "layout_signature": {"type": "string"},
          "thumbnail_job": {"type": "string"},
          "visual_center": {"type": "string"},
          "topic_fit_claim": {"type": "string"},
          "information_density_plan": {"type": "string"},
          "page_difference_from_previous": {"type": "string"},
          "primary_asset": {"type": "string"},
          "asset_role": {"type": "string"},
          "font_role_usage": {"type": "object"},
          "composition_intent": {"type": "string"},
          "data_visual_rationale": {"type": "string"},
          "source_evidence": {"type": "array", "items": {"type": "string"}},
          "fusion_spec": {"type": "object"},
          "qa_expectations": {"type": "array", "items": {"type": "string"}}
        }
      }
    }
  }
}
`,
		"creative_quality.schema.json": `{
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
      "required": ["slides", "visual_receipts", "missing_visual_receipts", "process_leak_count", "generic_font_slide_count", "distinct_layout_family_count", "distinct_layout_archetype_count", "layout_archetype_max_ratio_bp", "adjacent_layout_archetype_count", "left_right_chart_archetype_count", "layout_signature_max_ratio_bp", "adjacent_layout_repetition_count", "fusion_slide_count", "fusion_adjacent_count", "weak_slide_count", "chart_without_evidence_count", "warning_count"],
      "properties": {
        "slides": {"type": "integer"},
        "visual_receipts": {"type": "integer"},
        "missing_visual_receipts": {"type": "integer"},
        "process_leak_count": {"type": "integer"},
        "generic_font_slide_count": {"type": "integer"},
        "distinct_layout_family_count": {"type": "integer"},
        "distinct_layout_archetype_count": {"type": "integer"},
        "layout_archetype_max_ratio_bp": {"type": "integer"},
        "adjacent_layout_archetype_count": {"type": "integer"},
        "left_right_chart_archetype_count": {"type": "integer"},
        "layout_signature_max_ratio_bp": {"type": "integer"},
        "adjacent_layout_repetition_count": {"type": "integer"},
        "fusion_slide_count": {"type": "integer"},
        "fusion_adjacent_count": {"type": "integer"},
        "weak_slide_count": {"type": "integer"},
        "chart_without_evidence_count": {"type": "integer"},
        "warning_count": {"type": "integer"}
      }
    }
  }
}
`,
		"delivery.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "route_profile", "orchestrator", "runtime_binding", "deck", "slides_dir", "slides", "preview", "quality_report", "anygen_semantic_report", "visual_receipts", "creative_quality_report", "semantic_metrics", "stage_status", "legacy_runtime_executed", "legacy_tool_ids", "legacy_artifact_matches", "core_prompt_ids", "observed_prompt_ids", "blocked_prompt_ids"],
  "properties": {
    "status": {"type": "string", "enum": ["ready", "needs_repair"]},
    "route_profile": {"type": "string"},
    "orchestrator": {"type": "string"},
    "runtime_binding": {"type": "string"},
    "deck": {"type": "string"},
    "slides_dir": {"type": "string"},
    "slides": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "preview": {
      "type": "object",
      "additionalProperties": false,
      "required": ["path", "status", "missing_asset_count"],
      "properties": {
        "path": {"type": "string"},
        "status": {"type": "string"},
        "missing_asset_count": {"type": "integer"}
      }
    },
    "quality_report": {"type": "string"},
    "anygen_semantic_report": {"type": "string"},
    "visual_receipts": {"type": "string"},
    "creative_quality_report": {"type": "string"},
    "semantic_metrics": {"type": "object"},
    "stage_status": {"type": "object"},
    "legacy_runtime_executed": {"type": "boolean"},
    "legacy_tool_ids": {"type": "array", "items": {"type": "string"}},
    "legacy_artifact_matches": {"type": "array", "items": {"type": "string"}},
    "core_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "observed_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "blocked_prompt_ids": {"type": "array", "items": {"type": "string"}}
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
