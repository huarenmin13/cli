---
id: resolve_theme_contract
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: request_resolution
order: 5
cardinality: once
requires:
  - mode_system_prompt_svg
condition: always
trigger:
  - phase_1_theme_dimension_resolution
consumes:
  - request/request.json
  - request/source_manifest.json
  - request/entity_resolution.json
produces:
  - request/theme_contract.json
  - receipts/tool_calls/request_resolution/resolve_theme_contract.json
completion_gate:
  - theme_contract_schema_valid
  - theme_contract_gate_valid
---

# Resolve Theme Contract

Before research or design, classify the requested deck by composable dimensions. Do not try to enumerate every possible topic. The output is `request/theme_contract.json`, and every later stage must consume it.

## Required Dimensions

- `content_type`: what kind of presentation this is, for example financial report, cultural lifestyle editorial, product introduction, sports event analysis, education explainer, strategy memo. Use a specific `primary` string and optional `secondary` strings.
- `subject_type`: what the deck is about: named company, product, team, event, place, person, cultural practice, food/beverage category, abstract idea, or another explicit subject. Set `named_entity=true` only for a specific real-world entity.
- `delivery_format`: self-read, presented, handout, report, pitch, teaching deck, or another concrete delivery mode.
- `evidence_type`: which evidence must appear: audited financial data, sourced research, taxonomy, process, region/geography, comparison, timeline, quote, image proof, or chart proof.
- `asset_needs`: whether real images are required, which roles are required, and minimum counts.
- `layout_rhythm`: minimum slide count, required page roles, and layout diversity floor.
- `typography_identity`: topic-specific font direction, not generic browser fonts.
- `quality_floor`: the minimum visual bar for this topic.

## Non-Negotiable Rules

- `topic_archetype` is only a compatibility hint. The dimensions above are authoritative.
- If the topic is a real-world entity or material culture / lifestyle / food / beverage / travel / place / sports / product deck, decide real visual evidence explicitly.
- If the user asks for a chart-only/vector-only deck, set `asset_needs.requires_real_images=false` and explain why in `quality_floor.reason`.
- Cultural and lifestyle decks must not degrade into generic abstract SVGs. They need real material, place, process, object, or scene evidence unless the user forbids images.
- The output must be valid JSON matching `schemas/theme_contract.schema.json`.

## Example: 品中国茶

Use this shape for a Chinese tea deck:

```json
{
  "prompt_contract": {},
  "theme_contract": {
    "content_type": {"primary": "cultural_lifestyle_editorial", "secondary": ["food_beverage_culture", "education_explainer"]},
    "subject_type": {"primary": "culture_practice", "named_entity": false, "entity_name": "中国茶"},
    "delivery_format": {"primary": "self_read", "density": "medium_high"},
    "evidence_type": {"primary": "taxonomy_process_region", "requires_sources": true},
    "asset_needs": {
      "requires_real_images": true,
      "required_roles": ["tea_mountain", "tea_leaf_macro", "brewing_process", "tea_ware", "tea_soup", "tea_table_scene"],
      "min_real_image_pages": 4,
      "min_dominant_real_image_pages": 3,
      "min_unique_real_images": 4,
      "cover_requires_dominant_real_image": true
    },
    "layout_rhythm": {
      "min_slide_count": 9,
      "min_distinct_layout_archetypes": 6,
      "max_adjacent_same_archetype": 0,
      "required_page_roles": ["cover", "taxonomy", "region_map", "craft_process", "tasting_method", "brewing_parameters", "teaware", "modern_consumption", "closing"]
    },
    "typography_identity": {
      "profile": "guochao_culture",
      "display_category": "serif_or_songti",
      "body_category": "songti_or_reading",
      "number_category": "sans_or_mono"
    },
    "quality_floor": {"profile": "culture_editorial", "reason": "Tea culture decks need real material, process, region, and tasting evidence."},
    "rationale": "The request is an open cultural/lifestyle topic and cannot be handled by existing finance/brand/sports archetype defaults."
  }
}
```
