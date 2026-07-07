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
    "delivery_target": {"type": "string"},
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
		"delivery_contract.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["delivery_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "delivery_contract": {
      "type": "object",
      "additionalProperties": false,
      "required": ["delivery_target", "requires_online_slide", "requires_local_preview", "requires_real_images", "reason", "detected_signals"],
      "properties": {
        "delivery_target": {"type": "string", "enum": ["local_preview", "online_slide", "both"]},
        "requires_online_slide": {"type": "boolean"},
        "requires_local_preview": {"type": "boolean"},
        "requires_real_images": {"type": "boolean"},
        "reason": {"type": "string"},
        "detected_signals": {"type": "array", "items": {"type": "string"}}
      }
    }
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
	    "requires_research_confirmation": {"type": "boolean"},
	    "identifiers": {
	      "type": "array",
	      "items": {
	        "type": "object",
	        "additionalProperties": false,
	        "required": ["type", "value", "confidence_bp", "reason"],
	        "properties": {
	          "type": {"type": "string", "enum": ["ticker", "official_url", "product_model", "paper_doi", "law_code", "place_name", "event_name", "person_name", "company_name", "topic_phrase"]},
	          "value": {"type": "string"},
	          "market_hint": {"type": "string"},
	          "confidence_bp": {"type": "integer"},
	          "reason": {"type": "string"}
	        }
	      }
	    },
	    "visual_quality_contract": {
	      "type": "object",
	      "additionalProperties": false,
	      "properties": {
	        "profile": {"type": "string", "enum": ["brand_official_site", "product_official_site", "place_official_site", "film_or_media_entity", "data_report", "sports_editorial", "event_editorial", "text_only"]},
	        "requires_real_images": {"type": "boolean"},
	        "min_image_coverage_bp": {"type": "integer"},
	        "min_unique_images": {"type": "integer"},
	        "min_official_images": {"type": "integer"},
	        "allow_repeated_hero_only": {"type": "boolean"},
	        "cover_requires_real_hero_image": {"type": "boolean"},
	        "required_chart_renderer": {"type": "string", "enum": ["none", "vega-lite"]},
	        "min_chart_svg_assets": {"type": "integer"},
	        "min_vega_lite_specs": {"type": "integer"},
	        "typography_contract_required": {"type": "boolean"},
	        "forbid_preview_wrapper_images_as_real_images": {"type": "boolean"},
	        "reason": {"type": "string"},
	        "mode": {"type": "string", "enum": ["benchmark", "default_floor"]},
	        "benchmark_available": {"type": "boolean"},
	        "benchmark_usage": {"type": "string", "enum": ["quality_floor_only"]},
	        "deck_type": {"type": "string"},
	        "topic_archetype": {"type": "string", "enum": ["", "financial_company_report", "named_company_report", "premium_product_brand", "brand_official_site", "sports_editorial", "event_editorial", "cultural_lifestyle_editorial", "food_beverage_culture", "education_explainer"]},
	        "theme_dimensions_ref": {"type": "string"},
	        "media_pressure": {"type": "object"},
	        "editorial_quality_target": {"type": "object"},
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
		"theme_contract.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "theme_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "theme_contract": {
      "type": "object",
      "additionalProperties": false,
      "required": ["content_type", "subject_type", "delivery_format", "evidence_type", "asset_needs", "layout_rhythm", "typography_identity", "quality_floor", "rationale"],
      "properties": {
        "content_type": {"type": "object"},
        "subject_type": {"type": "object"},
        "delivery_format": {"type": "object"},
        "evidence_type": {"type": "object"},
        "asset_needs": {"type": "object"},
        "layout_rhythm": {"type": "object"},
        "typography_identity": {"type": "object"},
        "quality_floor": {"type": "object"},
        "rationale": {"type": "string"}
      }
    }
  }
}
`,
		"visual_quality_contract.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["visual_quality_contract"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "visual_quality_contract": {"type": "object"}
  }
	}
`,
		"research_plan.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "entity", "identifiers", "evidence_needs", "source_ladders", "minimum_coverage", "failure_policy"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "entity": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "type", "requires_confirmation"],
      "properties": {
        "name": {"type": "string"},
        "type": {"type": "string"},
        "requires_confirmation": {"type": "boolean"}
      }
    },
    "identifiers": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "type", "value", "confidence_bp", "reason"],
        "properties": {
          "id": {"type": "string"},
          "type": {"type": "string", "enum": ["ticker", "official_url", "product_model", "paper_doi", "law_code", "place_name", "event_name", "person_name", "company_name", "topic_phrase"]},
          "value": {"type": "string"},
          "market_hint": {"type": "string"},
          "confidence_bp": {"type": "integer"},
          "reason": {"type": "string"}
        }
      }
    },
    "evidence_needs": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "type", "required"],
        "properties": {
          "id": {"type": "string"},
          "type": {"type": "string", "enum": ["identity", "facts", "data", "visuals", "context", "timeline", "comparison", "process", "geography", "quotes"]},
          "required": {"type": "boolean"}
        }
      }
    },
    "source_ladders": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["identifier_id", "evidence_need_id", "required_source_classes", "fallback_source_classes", "forbidden_only_source_classes"],
        "properties": {
          "identifier_id": {"type": "string"},
          "evidence_need_id": {"type": "string"},
          "required_source_classes": {"type": "array", "items": {"type": "string"}},
          "fallback_source_classes": {"type": "array", "items": {"type": "string"}},
          "forbidden_only_source_classes": {"type": "array", "items": {"type": "string"}}
        }
      }
    },
    "minimum_coverage": {
      "type": "object",
      "additionalProperties": false,
      "required": ["min_retrieved_sources", "identity_source_required", "all_required_source_classes_attempted"],
      "properties": {
        "min_retrieved_sources": {"type": "integer"},
        "identity_source_required": {"type": "boolean"},
        "all_required_source_classes_attempted": {"type": "boolean"}
      }
    },
    "failure_policy": {
      "type": "object",
      "additionalProperties": false,
      "required": ["block_if_required_source_class_missing", "block_if_only_general_search", "clarify_if_identity_unconfirmed_after_ladder"],
      "properties": {
        "block_if_required_source_class_missing": {"type": "boolean"},
        "block_if_only_general_search": {"type": "boolean"},
        "clarify_if_identity_unconfirmed_after_ladder": {"type": "boolean"}
      }
    }
  }
}
`,
		"research_queries.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "queries"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "queries": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "plan_identifier_id", "source_class", "method", "query_or_url", "purpose", "status", "retrieved_source_ids"],
        "properties": {
          "id": {"type": "string"},
          "plan_identifier_id": {"type": "string"},
          "source_class": {"type": "string", "enum": ["finance_quote", "issuer_site", "exchange_or_regulator", "official_site", "authority_database", "official_event_site", "sports_stats", "museum_archive", "academic_source", "map_source", "trusted_financial_media", "trusted_news", "image_source", "general_web_search"]},
          "method": {"type": "string", "enum": ["direct_url", "search_query", "finance_quote", "regulator_search", "official_site_fetch", "local_file", "user_provided"]},
          "query_or_url": {"type": "string"},
          "purpose": {"type": "string", "enum": ["identity", "facts", "data", "visuals", "context", "timeline", "comparison", "process", "geography", "quotes"]},
          "status": {"type": "string", "enum": ["planned", "retrieved", "failed", "unavailable"]},
          "retrieved_source_ids": {"type": "array", "items": {"type": "string"}}
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
        "required": ["id", "path", "title", "excerpt", "usage", "retrieval", "query_id", "source_class", "authority_tier"],
        "properties": {
          "id": {"type": "string"},
          "path": {"type": "string"},
          "title": {"type": "string"},
          "excerpt": {"type": "string"},
          "usage": {"type": "string"},
          "retrieval": {"type": "string", "enum": ["full_page", "local_file", "user_provided"]},
          "query_id": {"type": "string"},
          "source_class": {"type": "string"},
          "authority_tier": {"type": "string", "enum": ["official", "market_data", "regulator", "database", "academic", "trusted_media", "general"]}
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
        "typography_identity": {"type": "object"},
        "shape_language_budget": {"type": "object"},
        "chart_posture": {"type": "object"},
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
  "required": ["prompt_contract", "profile", "selected_moods", "font_source", "roles", "rules"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "profile": {"type": "string"},
    "selected_moods": {"type": "array", "minItems": 1, "items": {"type": "string"}},
    "font_source": {"type": "string", "enum": ["slide_font_theme_presets"]},
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
        "required": ["id", "content", "central_claim", "audience_takeaway", "supporting_points", "source_bound_facts", "source_refs", "visuals", "so_what"],
        "properties": {
          "id": {"type": "string"},
          "content": {"type": "string"},
          "role": {"type": "string"},
          "title": {"type": "string"},
          "central_claim": {"type": "string", "minLength": 12},
          "audience_takeaway": {"type": "string", "minLength": 12},
          "supporting_points": {
            "type": "array",
            "minItems": 2,
            "maxItems": 5,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["text", "source_refs"],
              "properties": {
                "text": {"type": "string", "minLength": 12},
                "source_refs": {"type": "array", "minItems": 1, "items": {"type": "string"}}
              }
            }
          },
          "source_bound_facts": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["fact", "source_ref", "usage"],
              "properties": {
                "fact": {"type": "string", "minLength": 8},
                "source_ref": {"type": "string", "minLength": 1},
                "usage": {"type": "string", "enum": ["claim", "evidence", "comparison", "visual_data", "context"]}
              }
            }
          },
          "examples_or_parameters": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["label", "explanation"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "value": {"type": "string"},
                "explanation": {"type": "string", "minLength": 8},
                "source_ref": {"type": "string"}
              }
            },
            "default": []
          },
          "visual_data_items": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["label", "role", "explanation"],
              "properties": {
                "label": {"type": "string", "minLength": 1},
                "value": {"type": "string"},
                "role": {"type": "string", "enum": ["node", "step", "axis", "metric", "callout", "map_anchor", "comparison", "annotation"]},
                "explanation": {"type": "string", "minLength": 8},
                "source_ref": {"type": "string"}
              }
            },
            "default": []
          },
          "so_what": {"type": "string", "minLength": 12},
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
                "type": {"type": "string", "enum": ["image", "diagram", "map", "icon", "illustration", "chart", "table", "crop", "none"]},
                "instruction": {"type": "string"},
                "visual_form": {"type": "string", "enum": ["four_quadrant", "spectrum", "map_route", "process_flow", "parameter_matrix", "sensory_wheel", "object_callout", "generic"]}
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
		"image_candidates.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "candidates"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "requires_real_images": {"type": "boolean"},
    "no_image_reason": {"type": "string"},
    "attempted_sources": {"type": "array", "items": {"type": "string"}},
    "failure_reason_code": {"type": "string"},
    "candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "query", "source_url", "source_class", "format", "width", "height", "has_alpha", "asset_role", "fit_role", "score_bp", "selected", "selection_reason", "rejection_reason"],
        "properties": {
          "id": {"type": "string"},
          "query": {"type": "string"},
          "source_url": {"type": "string"},
          "source_class": {"type": "string", "enum": ["official", "press", "media", "web", "user_provided", "unknown"]},
          "format": {"type": "string", "enum": ["png", "jpg", "jpeg", "webp", "avif", "svg", "unknown"]},
          "width": {"type": "integer"},
          "height": {"type": "integer"},
          "has_alpha": {"type": "boolean"},
          "asset_role": {"type": "string", "enum": ["hero_photo", "scene_photo", "factory_photo", "store_photo", "people_photo", "transparent_subject", "floating_product", "logo", "chip_device", "ui_screenshot", "product_screen", "paper_screenshot", "paper_figure", "repo_screenshot", "official_logo", "source_page_screenshot", "chart", "other"]},
          "fit_role": {"type": "string", "enum": ["full_bleed", "split_panel", "floating_subject", "annotation_base", "thumbnail", "logo_lockup", "chart_embed", "other"]},
          "local_path": {"type": "string"},
          "score_bp": {"type": "integer"},
          "selected": {"type": "boolean"},
          "selection_reason": {"type": "string"},
          "format_exception_reason": {"type": "string"},
          "rejection_reason": {"type": "string"},
          "evidence_role": {"type": "string"}
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
          "avoid_reason": {"type": "string"},
          "format": {"type": "string", "enum": ["png", "jpg", "jpeg", "webp", "avif", "svg", "unknown"]},
          "has_alpha": {"type": "boolean"},
          "asset_role": {"type": "string", "enum": ["hero_photo", "scene_photo", "factory_photo", "store_photo", "people_photo", "transparent_subject", "floating_product", "logo", "chip_device", "ui_screenshot", "product_screen", "paper_screenshot", "paper_figure", "repo_screenshot", "official_logo", "source_page_screenshot", "chart", "other"]},
          "fit_role": {"type": "string", "enum": ["full_bleed", "split_panel", "floating_subject", "annotation_base", "thumbnail", "logo_lockup", "chart_embed", "other"]},
          "candidate_id": {"type": "string"},
          "selection_reason": {"type": "string"},
          "format_exception_reason": {"type": "string"}
        }
      }
    }
  }
}
`,
		"chart_briefs.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["prompt_contract", "charts"],
  "properties": {
    "prompt_contract": {"type": "object"},
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "purpose", "takeaway", "renderer", "data_source_ids", "unit"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "purpose": {"type": "string"},
          "takeaway": {"type": "string"},
          "renderer": {"type": "string", "enum": ["vega-lite"]},
          "data_source_ids": {"type": "array", "minItems": 1, "items": {"type": "string"}},
          "unit": {"type": "string"},
          "min_width": {"type": "integer"},
          "min_height": {"type": "integer"},
          "fallback_policy": {"type": "string"}
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
    "renderer": {"type": "string", "enum": ["none", "vega-lite", "legacy-imported"]},
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "renderer", "svg_path"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "renderer": {"type": "string", "enum": ["vega-lite", "legacy-imported"]},
          "brief_id": {"type": "string"},
          "spec_path": {"type": "string"},
          "svg_path": {"type": "string"},
          "source_id": {"type": "string"},
          "unit": {"type": "string"},
          "takeaway": {"type": "string"},
          "render_receipt": {"type": "string"},
          "title": {"type": "string"},
          "why_chart_is_needed": {"type": "string"}
        }
      }
    }
  }
}
`,
		"chart_render.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "renderer", "charts", "issues"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "renderer": {"type": "string", "enum": ["node-vega-lite"]},
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "spec_path", "svg_path", "spec_sha256", "svg_sha256", "command"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "spec_path": {"type": "string"},
          "svg_path": {"type": "string"},
          "spec_sha256": {"type": "string"},
          "svg_sha256": {"type": "string"},
          "command": {"type": "string"}
        }
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["code", "message"],
        "properties": {
          "code": {"type": "string"},
          "path": {"type": "string"},
          "message": {"type": "string"}
        }
      }
    }
  }
}
`,
		"chart_quality.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "metrics", "issues", "charts"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["charts", "vega_lite_charts", "missing_axis_count", "missing_unit_count", "missing_source_count", "missing_direct_label_count", "decorative_chart_count"],
      "properties": {
        "charts": {"type": "integer"},
        "vega_lite_charts": {"type": "integer"},
        "missing_axis_count": {"type": "integer"},
        "missing_unit_count": {"type": "integer"},
        "missing_source_count": {"type": "integer"},
        "missing_direct_label_count": {"type": "integer"},
        "decorative_chart_count": {"type": "integer"}
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
          "code": {"type": "string"},
          "message": {"type": "string"},
          "severity": {"type": "string"}
        }
      }
    },
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "renderer", "svg_path"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "renderer": {"type": "string"},
          "svg_path": {"type": "string"},
          "spec_path": {"type": "string"}
        }
      }
    }
  }
}
`,
		"chart_usage.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "charts", "issues"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "charts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "slide_id", "svg_path", "reference_count"],
        "properties": {
          "id": {"type": "string"},
          "slide_id": {"type": "string"},
          "svg_path": {"type": "string"},
          "reference_count": {"type": "integer"}
        }
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["code", "message"],
        "properties": {
          "code": {"type": "string"},
          "path": {"type": "string"},
          "message": {"type": "string"}
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
    "content_payload": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "metrics"],
      "properties": {
        "status": {"type": "string", "enum": ["passed", "failed"]},
        "metrics": {"type": "object"},
        "issues": {"type": "array", "items": {"type": "object"}}
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
	        "rendered_visual_container_text_overflow_count": {"type": "integer"},
	        "rendered_visual_container_padding_risk_count": {"type": "integer"},
	        "rendered_visual_foreign_object_overlap_count": {"type": "integer"},
	        "rendered_visual_tight_line_height_count": {"type": "integer"},
	        "rendered_visual_bold_overuse_count": {"type": "integer"},
	        "rendered_visual_small_text_padding_risk_count": {"type": "integer"},
	        "theme_contract_present": {"type": "boolean"},
	        "theme_asset_needs_applied": {"type": "boolean"},
	        "visual_asset_required": {"type": "boolean"},
	        "visual_asset_issue_count": {"type": "integer"},
	        "cover_real_hero_required": {"type": "boolean"},
	        "cover_real_hero_present": {"type": "boolean"},
	        "image_candidate_count": {"type": "integer"},
	        "selected_image_candidate_count": {"type": "integer"},
	        "image_role_format_issue_count": {"type": "integer"},
	        "transparent_subject_assets": {"type": "integer"},
	        "selected_images_referenced": {"type": "integer"},
	        "selected_images_unreferenced": {"type": "integer"},
	        "image_usage_issue_count": {"type": "integer"},
	        "cover_hero_area_bp": {"type": "integer"},
	        "full_bleed_image_usage_count": {"type": "integer"},
	        "media_pressure_issue_count": {"type": "integer"},
	        "dominant_real_image_pages": {"type": "integer"},
	        "max_consecutive_infographic_pages": {"type": "integer"},
	        "chart_usage_issue_count": {"type": "integer"},
	        "content_payload_issue_count": {"type": "integer"},
	        "sparse_label_list_count": {"type": "integer"},
	        "missing_evidence_payload_count": {"type": "integer"},
	        "missing_visual_data_items_count": {"type": "integer"}
	      }
	    }
	  }
}
`,
		"content_payload.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "metrics"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slides", "substantive_slides", "sparse_label_list_count", "missing_central_claim_count", "missing_supporting_points_count", "missing_source_bound_fact_count", "missing_visual_data_items_count", "source_binding_issue_count", "issue_count"],
      "properties": {
        "slides": {"type": "integer"},
        "substantive_slides": {"type": "integer"},
        "sparse_label_list_count": {"type": "integer"},
        "missing_central_claim_count": {"type": "integer"},
        "missing_supporting_points_count": {"type": "integer"},
        "missing_source_bound_fact_count": {"type": "integer"},
        "missing_visual_data_items_count": {"type": "integer"},
        "source_binding_issue_count": {"type": "integer"},
        "issue_count": {"type": "integer"}
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["code", "message"],
        "properties": {
          "code": {"type": "string"},
          "slide_id": {"type": "string"},
          "message": {"type": "string"}
        }
      }
    }
  }
}
`,
		"image_usage.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "slides", "issues"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["slide_id", "canvas_width", "canvas_height", "assets"],
        "properties": {
          "slide_id": {"type": "string"},
          "canvas_width": {"type": "number"},
          "canvas_height": {"type": "number"},
          "assets": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["asset_id", "path", "href", "asset_role", "fit_role", "x", "y", "width", "height", "area_bp", "usage_status"],
              "properties": {
                "asset_id": {"type": "string"},
                "path": {"type": "string"},
                "href": {"type": "string"},
                "asset_role": {"type": "string"},
                "fit_role": {"type": "string"},
                "x": {"type": "number"},
                "y": {"type": "number"},
                "width": {"type": "number"},
                "height": {"type": "number"},
                "area_bp": {"type": "integer"},
                "usage_status": {"type": "string", "enum": ["matched", "missing", "role_mismatch", "area_too_small"]}
              }
            }
          }
        }
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["code", "path", "message"],
        "properties": {
          "code": {"type": "string"},
          "path": {"type": "string"},
          "message": {"type": "string"}
        }
      }
    }
  }
}
`,
		"media_pressure.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "metrics", "issues", "slides", "policy"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "metrics": {"type": "object"},
    "issues": {"type": "array", "items": {"type": "object"}},
    "slides": {"type": "array", "items": {"type": "object"}},
    "policy": {"type": "object"}
  }
}
`,
		"screenshot_evidence.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "metrics", "issues", "slides"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "metrics": {"type": "object"},
    "issues": {"type": "array", "items": {"type": "object"}},
    "slides": {"type": "array", "items": {"type": "object"}}
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
      "required": ["slides", "issue_count", "out_of_canvas_count", "text_overflow_count", "text_collision_count", "unsafe_edge_count", "container_text_overflow_count", "container_padding_risk_count", "foreign_object_overlap_count", "tight_line_height_count", "bold_overuse_count", "small_text_padding_risk_count"],
      "properties": {
        "slides": {"type": "integer"},
        "issue_count": {"type": "integer"},
        "out_of_canvas_count": {"type": "integer"},
        "text_overflow_count": {"type": "integer"},
        "text_collision_count": {"type": "integer"},
        "unsafe_edge_count": {"type": "integer"},
        "container_text_overflow_count": {"type": "integer"},
        "container_padding_risk_count": {"type": "integer"},
        "foreign_object_overlap_count": {"type": "integer"},
        "tight_line_height_count": {"type": "integer"},
        "bold_overuse_count": {"type": "integer"},
        "small_text_padding_risk_count": {"type": "integer"}
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
      "required": ["slide_count", "slides_with_slide_role", "image_count", "text_count", "note_count", "source_ref_count", "missing_asset_count", "slides_without_source_refs", "visible_leak_count", "font_token_count", "missing_font_token_count", "parser_unsafe_count"],
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
        "missing_font_token_count": {"type": "integer"},
        "parser_unsafe_count": {"type": "integer"}
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
        "required": ["slide_id", "story_job", "layout_family", "layout_archetype", "layout_signature", "thumbnail_job", "visual_center", "topic_fit_claim", "information_density_plan", "page_difference_from_previous", "primary_asset", "asset_role", "font_role_usage", "composition_intent", "data_visual_rationale", "source_evidence", "container_fit_plan", "container_decision", "text_carrier", "typography_role_usage", "shape_language", "card_budget", "chart_receipt", "fusion_spec", "qa_expectations"],
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
          "container_fit_plan": {"type": "string"},
          "container_decision": {"type": "string"},
          "text_carrier": {"type": "string", "enum": ["open_grid", "image_dark_zone", "line_annotation", "axis_annotation", "card_group", "metric_panel"]},
          "typography_role_usage": {"type": "object"},
          "shape_language": {"type": "string"},
          "card_budget": {
            "type": "object",
            "additionalProperties": false,
            "required": ["card_count", "why_cards_are_needed"],
            "properties": {
              "card_count": {"type": "integer"},
              "why_cards_are_needed": {"type": "string"}
            }
          },
          "chart_receipt": {
            "type": "object",
            "additionalProperties": false,
            "required": ["chart_id", "renderer", "unit", "source", "why_chart_is_needed"],
            "properties": {
              "chart_id": {"type": "string"},
              "renderer": {"type": "string", "enum": ["vega-lite", "none", "legacy-imported"]},
              "unit": {"type": "string"},
              "source": {"type": "string"},
              "why_chart_is_needed": {"type": "string"}
            }
          },
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
	      "required": ["slides", "visual_receipts", "missing_visual_receipts", "process_leak_count", "generic_font_slide_count", "distinct_layout_family_count", "distinct_layout_archetype_count", "layout_archetype_max_ratio_bp", "adjacent_layout_archetype_count", "left_right_chart_archetype_count", "layout_signature_max_ratio_bp", "adjacent_layout_repetition_count", "fusion_slide_count", "fusion_adjacent_count", "weak_slide_count", "chart_without_evidence_count", "pseudo_analysis_diagram_count", "warning_count"],
      "properties": {
        "slides": {"type": "integer"},
        "visual_receipts": {"type": "integer"},
        "missing_visual_receipts": {"type": "integer"},
        "process_leak_count": {"type": "integer"},
        "generic_font_slide_count": {"type": "integer"},
        "topic_typography_mismatch_count": {"type": "integer"},
        "typography_role_collapse_count": {"type": "integer"},
        "distinct_layout_family_count": {"type": "integer"},
        "distinct_layout_archetype_count": {"type": "integer"},
        "layout_archetype_max_ratio_bp": {"type": "integer"},
        "adjacent_layout_archetype_count": {"type": "integer"},
        "left_right_chart_archetype_count": {"type": "integer"},
        "layout_signature_max_ratio_bp": {"type": "integer"},
        "adjacent_layout_repetition_count": {"type": "integer"},
        "card_dominant_slide_count": {"type": "integer"},
        "dark_card_template_slide_count": {"type": "integer"},
        "shape_language_max_ratio_bp": {"type": "integer"},
        "visual_skeleton_max_ratio_bp": {"type": "integer"},
        "adjacent_visual_skeleton_count": {"type": "integer"},
        "visual_intent_mismatch_count": {"type": "integer"},
        "decorative_image_only_count": {"type": "integer"},
        "weak_cover_visual_impact_count": {"type": "integer"},
        "default_card_text_container_count": {"type": "integer"},
        "open_text_carrier_slide_count": {"type": "integer"},
        "fusion_slide_count": {"type": "integer"},
        "fusion_adjacent_count": {"type": "integer"},
        "weak_slide_count": {"type": "integer"},
        "chart_without_evidence_count": {"type": "integer"},
        "pseudo_analysis_diagram_count": {"type": "integer"},
        "warning_count": {"type": "integer"}
      }
    }
	}
}
`,
		"editorial_quality.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "score", "metrics", "issues", "target"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "score": {"type": "integer"},
    "metrics": {"type": "object"},
    "issues": {"type": "array", "items": {"type": "object"}},
    "target": {"type": "object"}
  }
}
`,
		"online_slide.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "slide_count", "publisher"],
  "properties": {
    "status": {"type": "string"},
    "presentation_id": {"type": "string"},
    "url": {"type": "string"},
    "slide_count": {"type": "integer"},
    "publisher": {"type": "string"},
    "blocked_reason_code": {"type": "string"},
    "message": {"type": "string"}
  }
}
`,
		"svg_publish_request_evidence.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "content_type", "slide_count", "slides", "forbidden_format_detected", "issues", "created_at"],
  "properties": {
    "status": {"type": "string"},
    "content_type": {"type": "string", "enum": ["svg"]},
    "title": {"type": "string"},
    "slide_count": {"type": "integer"},
    "forbidden_format_detected": {"type": "boolean"},
    "created_at": {"type": "string"},
    "issues": {"type": "array", "items": {"type": "object"}},
    "slides": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["path", "content_root", "sha256", "content_bytes", "content_prefix"],
        "properties": {
          "path": {"type": "string"},
          "content_root": {"type": "string"},
          "sha256": {"type": "string"},
          "content_bytes": {"type": "integer"},
          "content_prefix": {"type": "string"}
        }
      }
    }
  }
}
`,
		"publish_online.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["stage", "status", "report", "created_at"],
  "properties": {
    "stage": {"type": "string"},
    "status": {"type": "string"},
    "created_at": {"type": "string"},
    "report": {"type": "object"}
  }
}
`,
		"delivery.schema.json": `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "delivery_target", "route_profile", "orchestrator", "runtime_binding", "deck", "slides_dir", "slides", "preview", "online_slide", "real_asset_evidence", "quality_report", "anygen_semantic_report", "visual_receipts", "creative_quality_report", "editorial_quality_report", "semantic_metrics", "stage_status", "full_chain_evidence", "legacy_runtime_executed", "legacy_tool_ids", "legacy_artifact_matches", "core_prompt_ids", "observed_prompt_ids", "blocked_prompt_ids"],
  "properties": {
    "status": {"type": "string", "enum": ["ready", "needs_repair", "blocked"]},
    "delivery_target": {"type": "string", "enum": ["local_preview", "online_slide", "both"]},
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
    "online_slide": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "publisher"],
      "properties": {
        "status": {"type": "string"},
        "presentation_id": {"type": "string"},
        "url": {"type": "string"},
        "slide_count": {"type": "integer"},
        "publisher": {"type": "string"},
        "blocked_reason_code": {"type": "string"},
        "message": {"type": "string"}
      }
    },
    "real_asset_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["required", "satisfied", "selected_real_images"],
      "properties": {
        "required": {"type": "boolean"},
        "satisfied": {"type": "boolean"},
        "selected_real_images": {"type": "integer"}
      }
    },
    "quality_report": {"type": "string"},
    "anygen_semantic_report": {"type": "string"},
    "visual_receipts": {"type": "string"},
    "creative_quality_report": {"type": "string"},
    "editorial_quality_report": {"type": "string"},
    "semantic_metrics": {"type": "object"},
    "stage_status": {"type": "object"},
    "legacy_runtime_executed": {"type": "boolean"},
    "legacy_tool_ids": {"type": "array", "items": {"type": "string"}},
    "legacy_artifact_matches": {"type": "array", "items": {"type": "string"}},
    "core_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "observed_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "blocked_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "full_chain_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["run_json", "prompt_manifest", "prompt_context_receipts", "request", "source_manifest", "entity_resolution", "theme_contract", "research_notes", "sources", "research_coverage", "design_brief", "visual_system", "typography_contract", "outline", "slide_content", "asset_manifest", "rendered_visual", "media_pressure_report", "quality_report", "creative_quality_report", "editorial_quality_report", "chart_render_report", "chart_usage_report", "chart_quality_report", "delivery", "stage_receipts", "screenshot_evidence", "manual_patch"],
      "properties": {
        "run_json": {"type": "string"},
        "prompt_manifest": {"type": "string"},
        "prompt_context_receipts": {"type": "object"},
        "request": {"type": "string"},
        "source_manifest": {"type": "string"},
        "delivery_contract": {"type": "string"},
        "entity_resolution": {"type": "string"},
        "theme_contract": {"type": "string"},
        "research_notes": {"type": "string"},
        "sources": {"type": "string"},
        "research_coverage": {"type": "string"},
        "design_brief": {"type": "string"},
        "visual_system": {"type": "string"},
        "typography_contract": {"type": "string"},
        "outline": {"type": "string"},
        "slide_content": {"type": "string"},
        "asset_manifest": {"type": "string"},
        "rendered_visual": {"type": "string"},
        "media_pressure_report": {"type": "string"},
        "quality_report": {"type": "string"},
        "creative_quality_report": {"type": "string"},
        "editorial_quality_report": {"type": "string"},
        "chart_render_report": {"type": "string"},
        "chart_usage_report": {"type": "string"},
        "chart_quality_report": {"type": "string"},
        "svg_publish_request_evidence": {"type": "string"},
        "online_slide": {"type": "string"},
        "delivery": {"type": "string"},
        "stage_receipts": {"type": "object"},
        "screenshot_evidence": {"type": "array", "items": {"type": "string"}},
        "manual_patch": {
          "type": "object",
          "additionalProperties": false,
          "required": ["applied", "files"],
          "properties": {
            "applied": {"type": "boolean"},
            "files": {"type": "array", "items": {"type": "string"}},
            "reason": {"type": "string"}
          }
        }
      }
    }
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
