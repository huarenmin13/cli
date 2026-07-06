---
id: resolve_image_assets
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: assets
profiles:
  - local_svg_deck
  - imported_pptx
  - template_reference
exposure: runtime
order: 75
cardinality: once
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: always
trigger:
  - after_slide_content
consumes:
  - request/request.json
  - request/entity_resolution.json
  - research/sources.json
  - outline/deck.json
  - content/slide_content.json
  - brief/visual_system.json
produces:
  - assets/image_candidates.json
  - assets/assets_plan.json
  - assets/assets_manifest.json
  - assets/asset_inventory.json
  - receipts/tool_calls/assets/resolve_image_assets.json
completion_gate:
  - image_candidates_recorded
  - selected_images_have_source_url
  - selected_images_have_role_fit_reason
---

# Resolve Image Assets

Use this prompt when a SVGlide deck needs real visual assets. It turns image search and selection into auditable local artifacts. The adapter does not provide an image provider; the agent must use available browsing, search, or local-file capabilities, then write the artifacts below.

## Decision order

1. Read `visual_quality_contract` and slide visual intent.
2. Decide an `asset_role` for each needed image before searching.
3. Search candidates with role-specific queries.
4. Keep selected and rejected candidates in `assets/image_candidates.json`.
5. Download or copy selected images into `assets/images/`.
6. Register selected images in `assets/assets_plan.json`, `assets/assets_manifest.json`, and `assets/asset_inventory.json`.
7. If the deck does not require real images, still write `assets/image_candidates.json` with `requires_real_images=false`, `candidates=[]`, and a concrete `no_image_reason`.

## Role-specific format rules

- `logo`, `transparent_subject`, `floating_product`, `chip_device`: prefer transparent PNG or SVG logo. If the selected asset is JPG/WebP without alpha, write a concrete `format_exception_reason`.
- `hero_photo`, `scene_photo`, `factory_photo`, `store_photo`, `people_photo`: prefer high-resolution real photography from official or source-traceable pages. Do not prefer PNG solely because it is PNG.
- `ui_screenshot`, `product_screen`: prefer PNG when available, but reject low-resolution or blurry PNG files.
- `chart`: use chart tools. Chart SVGs do not count as real image assets.

## Candidate requirements

For entity-driven decks that require real images:

- Keep at least 3 candidates for the cover hero unless the user supplied the only usable image.
- Keep at least 2 candidates for each important product/person/place/process image role where search is possible.
- Keep at least one rejected candidate for every searched role unless only one source exists.
- Prefer official sources first, then press/media sources, then general web sources.
- Do not use preview wrapper screenshots, generated SVG diagrams, chart SVGs, or tiny logos as real hero photos.

Each candidate must include:

```json
{
  "id": "cand-cover-01",
  "query": "NVIDIA H100 GPU official photo",
  "source_url": "https://...",
  "source_class": "official",
  "format": "jpg",
  "width": 1600,
  "height": 900,
  "has_alpha": false,
  "asset_role": "hero_photo",
  "fit_role": "full_bleed",
  "local_path": "assets/images/nvidia-h100-hero.jpg",
  "score_bp": 9400,
  "selected": true,
  "selection_reason": "official high-resolution product photo; safe for full-bleed crop",
  "format_exception_reason": "",
  "rejection_reason": ""
}
```

Rejected candidates must keep `selected=false` and explain the reason, for example low resolution, unsafe crop, generic stock look, weak relevance, duplicate image, missing source, or wrong format for role.

## Delivery blockers

Do not finish StageAssets when:

- `requires_real_images=true` but no real selected image candidate exists.
- Cover image is selected without `fit_role=full_bleed` or `large_ok=true`, unless a concrete selection exception is written.
- A `transparent_subject`, `floating_product`, `logo`, or `chip_device` selected image is not PNG with alpha or SVG logo and has no concrete `format_exception_reason`.
- `assets_manifest.json` contains a ready image that has no matching selected candidate or inventory entry.
