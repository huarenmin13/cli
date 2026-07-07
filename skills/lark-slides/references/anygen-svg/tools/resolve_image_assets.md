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
  - request/theme_contract.json
  - research/sources.json
  - outline/deck.json
  - content/slide_content.json
  - brief/visual_system.json
  - brief/visual_quality_contract.json
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

1. Read `request/theme_contract.json`, then `brief/visual_quality_contract.json` and slide visual intent.
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

## Technical Paper / Research Report Evidence

Technical paper and research report decks are not no-image scenarios by default. If the user asks for a paper deep dive, technical analysis, model report, financial report, or other sourced real-world report, plan visible evidence assets:

- `paper_screenshot`: arXiv, PDF first page, title page, or official paper page screenshot.
- `paper_figure`: a figure directly tied to the core mechanism or evidence claim.
- `source_page_screenshot`: official project page, GitHub/repo page, model page, company IR page, or source page used as evidence.
- `official_logo`: company, model, institution, or project logo when it anchors the subject.

Only when the user explicitly asks for pure vector/chart-only/no-image output may `requires_real_images=false`. Otherwise, if required evidence images cannot be obtained, write searched candidates and a blocked reason; do not replace evidence assets with decorative SVG diagrams.

## Candidate requirements

For entity-driven decks that require real images:

- Select enough images to satisfy `media_pressure.min_real_image_pages`, `media_pressure.min_dominant_real_image_pages`, and `media_pressure.min_unique_real_images`.
- For `media_pressure.require_cover_dominant_real_image=true`, the cover candidate must be safe for dominant placement: `fit_role=full_bleed` or another role whose planned SVG area can reach at least `dominant_image_min_area_bp`.
- For `financial_company_report`, search official company, product, data-center, AI infrastructure, chip/device, or executive/event imagery as appropriate. Charts do not replace the required real subject image.
- For `premium_product_brand` / `brand_official_site`, select product/detail/usage/store/factory images across different slide roles; do not reuse one hero image as the only photo source.
- For `sports_editorial` / `event_editorial`, select real team/event/player/action images for cover and key narrative pages; stat graphics alone do not satisfy media pressure.
- For `cultural_lifestyle_editorial` / `food_beverage_culture`, search real material and scene evidence. For Chinese tea, roles include `tea_mountain`, `tea_leaf_macro`, `brewing_process`, `tea_ware`, `tea_soup`, and `tea_table_scene`. Do not satisfy this with abstract ink textures, generic leaves, or pure SVG diagrams.
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
- `brief/visual_quality_contract.json` requires media pressure and selected assets cannot satisfy it.
- Cover image is selected without `fit_role=full_bleed` or `large_ok=true`, unless a concrete selection exception is written.
- A `transparent_subject`, `floating_product`, `logo`, or `chip_device` selected image is not PNG with alpha or SVG logo and has no concrete `format_exception_reason`.
- `assets_manifest.json` contains a ready image that has no matching selected candidate or inventory entry.
