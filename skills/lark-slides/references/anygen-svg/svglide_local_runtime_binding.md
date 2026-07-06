---
id: svglide_local_runtime_binding
role: runtime_binding
invocation: reference
profiles:
  - local_svg_deck
exposure: runtime
---

# SVGlide Local Runtime Binding

This file binds native AnyGen SVG Slides concepts to the local SVGlide run directory. It does not replace `mode_system_prompt_svg` or `svg_reference`.

| Native AnyGen concept | SVGlide local runtime artifact |
|-|-|
| `.slides project` | run directory, `preview.html`, `receipts/delivery.json` |
| `ToolResolveDesignBrief` | `brief/design_brief.json`, `brief/visual_system.json`, `brief/typography_contract.json` |
| `ToolSlideOutline` | `outline/deck.json` |
| `ToolResolveImageAssets` | `assets/image_candidates.json`, `assets/assets_manifest.json`, `assets/asset_inventory.json`, and `receipts/tool_calls/assets/resolve_image_assets.json` |
| `ToolSlideEdit` | `slides/*.svg` plus a tool-call receipt |
| `ToolFinishSlidesEdit` | lint, preview, quality, semantic, and repair artifacts |
| `show_form` | automatic CLI inference; low confidence writes a blocker before research |
| `handover` | Go-generated `receipts/delivery.json` |
| `slide_copy_plan` | local `content/slide_copy_plan.json`; only `audience_copy` may enter visible SVG text |
| `image_candidates` | local `assets/image_candidates.json`; searched candidates, selected/rejected decisions, role/format fit, and source URLs |
| `asset_inventory` | local `assets/asset_inventory.json`; real objects and external images must be inventoried before visual generation |
| `chart_briefs` / `chart_manifest` | local `assets/charts/chart_briefs.json` and `assets/charts/chart_manifest.json`; agent writes chart intent/spec metadata, runtime renders SVG assets |
| `visual_quality_contract` | local `request/entity_resolution.json` or `brief/visual_quality_contract.json`; quality gates enforce the visual floor before delivery |
| `visual_receipts.json` | author-side per-slide design decision receipt: layout family, asset role, text carrier, container decision, card budget, chart receipt, fusion spec, QA expectations |
| `receipts/rendered_visual.json` | deterministic rendered visual gate: text-fit, canvas bounds, label collision, and unsafe edge checks |
| `receipts/image_usage.json` | deterministic image usage gate: selected ready images must be referenced by slide SVGs and full-bleed hero images must be visually dominant |
| `receipts/chart_render.json` | deterministic Node renderer receipt: Vega-Lite specs are rendered by local `vega-lite` + `vega`, with spec/SVG hashes |
| `receipts/chart_usage.json` | deterministic chart usage gate: standard charts must be embedded as `<rect slide:role="chart">` and not hand-drawn in slide SVG |
| `receipts/chart_quality.json` | deterministic chart gate: units, source notes, labels or axes, Vega-Lite registration, and decorative-chart rejection |
| `creative_quality_report.json` | runtime-side deterministic gate: typography, layout rhythm, asset/source reuse, research coverage, process leakage, fusion checks, weak pages |
| production-only instructions | local gates reject visible `production_instruction`, `Sources:`, source-note text, and layout instructions |

For `local_svg_deck`, the runtime must not execute PPTX conversion, SXSD/editor publishing, or `.slides` live-create paths. Those concepts may appear in the native source snapshot, but this profile completes only through local SVG artifacts and machine-checked receipts.

## Real Entity / Official Site Visual Floor

When `request/entity_resolution.json.visual_quality_contract.profile` is `brand_official_site`, `product_official_site`, `place_official_site`, or `film_or_media_entity`:

- Treat official images as first-class source material, not decoration.
- Cover may use a user-provided hero image, but interior pages must use page-specific official/source images when available.
- Do not set most slides to `type:none` or pure vector diagrams unless `visual_quality_contract.requires_real_images=false`.
- For 8-10 slide decks, target at least 70% slides with real image assets and at least 6 unique images.
- Factory, product, store, people, place, film, and object pages should prefer real images over abstract diagrams.
- If official images cannot be downloaded or used, write `no_image_reason` with the concrete blocker and let quality fail unless the contract allows text-only output.

Even when no explicit visual contract is present, the quality gate derives a default visual asset floor from the request. Company, brand, product, person, place, team, event, film, book, and financial-report company decks require real subject imagery and a real cover hero image unless the user explicitly requested chart-only/vector-only output.

## General Visual Quality Contract

Strict visual contract execution order:

1. Resolve `request/entity_resolution.json.visual_quality_contract`.
2. Write `brief/typography_contract.json` during design brief resolution.
3. Run `ToolResolveImageAssets`: write `assets/image_candidates.json`; if real images are required, download/copy and inventory raster image assets before SVG authoring.
4. If `required_chart_renderer=vega-lite`, write `assets/charts/chart_briefs.json`, `assets/charts/specs/*.vl.json`, and `assets/charts/chart_manifest.json`; StageAssets completion invokes the local Node renderer (`vega-lite` + `vega`) to create `assets/charts/*.svg` and `receipts/chart_render.json`.
5. Author `slides/*.svg` only after required visual artifacts exist.
6. Run lint, preview, rendered visual, image usage, chart render, chart usage, chart quality, semantic, creative, and quality gates.
7. During quality, enforce the visual asset gate: entity-driven decks need real subject imagery and a real cover hero image unless the user explicitly requested chart-only/vector-only output.
8. Do not call delivery ready unless `receipts/rendered_visual.json.status=passed`, `receipts/image_usage.json.status=passed`, `receipts/chart_render.json.status=passed`, `receipts/chart_usage.json.status=passed`, `receipts/chart_quality.json.status=passed`, and `quality_report.json.status=passed`.
9. If any strict gate fails, delivery status is `needs_repair`; do not present the deck as complete.

## Complete Chain Evidence

A complete local SVGlide generation must be launched through the unified runtime entrypoint and must leave a run directory evidence chain:

`request -> research -> design_brief -> outline -> slide_content -> resolve_image_assets/chart_briefs/chart_specs -> node_chart_render -> svg_author -> validate/preview/repair -> rendered_visual -> image_usage -> chart_usage -> chart_quality -> quality_report -> delivery`.

Minimum evidence:

- `run.json` exists and names the local SVG deck route.
- Stage receipts exist for request, request resolution, research, design brief, outline, slide content, assets, SVG authoring, and validate/preview/repair.
- Core artifacts exist: `request/request.json`, `research/sources.json`, `brief/design_brief.json`, `brief/visual_system.json`, `brief/typography_contract.json`, `outline/deck.json`, `content/slide_content.json`, `content/slide_copy_plan.json`, `assets/image_candidates.json`, `assets/assets_manifest.json`, `assets/asset_inventory.json`, `assets/charts/chart_briefs.json`, `assets/charts/chart_manifest.json`, `slides/*.svg`, `preview.html`, `receipts/rendered_visual.json`, `receipts/image_usage.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, `receipts/chart_quality.json`, `creative_quality_report.json`, `quality_report.json`, `visual_receipts.json`, and `receipts/delivery.json`.
- Screenshot evidence such as `contact-sheet.png` or `screenshots/slide-*.png` must be present before claiming screenshot-level quality.
- Manual edits are allowed only when delivery evidence marks `manual_patch.applied=true`, lists the touched files, and explains the reason.

Without `run.json`, it is not a complete chain. Without stage receipts, it is not a complete chain. Without `quality_report.json`, `receipts/image_usage.json`, `receipts/chart_render.json`, `receipts/chart_usage.json`, `receipts/chart_quality.json`, rendered visual evidence, and screenshot evidence, it is not a complete chain. Manual repairs without `manual_patch` evidence must not be described as an unattended complete-chain result.

When a user provides a benchmark deck, screenshot, reference site, or previous generated output, treat it as `quality_floor_only`. Extract reusable quality dimensions, but do not copy source HTML, SVG markup, exact coordinates, or proprietary assets.

When no benchmark exists, the local runtime still expects a default visual floor:

- `strong_cover`: cover has a full-bleed hero image, poster-scale type, or another deliberate first-impression treatment.
- `semantic_image_coverage_min_bp`: images support slide claims instead of acting as decoration.
- `evidence_page_min_visuals`: process, craft, product, research, or data evidence pages have enough visual proof density.
- `max_repeated_layout_ratio_bp`: the deck should vary rhythm across hero, thesis, evidence, detail, comparison, and closing pages.
- `visual_roles_required`: outline should expose roles such as `hero_cover` and `evidence_grid` when the topic has visual depth.

## Visual Generation Overlay Duties

`brief/design_brief.json` must include `deck_visual_system`:

- `visual_keywords`: 4-8 topic-specific visual words.
- `palette`: background, surface, accent_primary, accent_secondary, text_primary, text_muted.
- `fonts`: concrete `font_display`, `font_body`, `font_number`, `font_label` stacks.
- `page_family_budget`: max counts for `full_bleed_hero`, `image_text_fusion_split`, `evidence_board`, `timeline_route`, `data_scoreboard`, `character_product_focus`, `quiet_synthesis`.
- `asset_strategy`: required image families, minimum distinct visual subjects, and max reuse per asset.
- `recurring_hero_rationale`: required only when the same real image is intentionally reused more than twice.
- `single_source_rationale`: required only when one source URL contributes more than 40% of visual assets.

Every outline item must include:

- `layout_family`: one of the approved page families.
- `layout_archetype`: the visible skeleton used by creative quality gates to detect repeated page construction. It is coarser than `layout_signature`; for example, `income_statement_horizontal_bar_ledger` and `balance_sheet_horizontal_bar_ledger` can share `statement_ledger`, but they cannot dominate the deck.
- `layout_signature`: the concrete structural skeleton, for example `full_bleed_poster`, `split_photo_argument`, `route_map`, `tactical_field`, `data_ledger`, `timeline_arc`, `evidence_collage`, `quote_commentary`, `closing_poster`.
- `story_function`: `hook`, `turning_point`, `proof`, `mechanism`, `contrast`, `consequence`, `next_steps`, or `synthesis`.
- `primary_asset_role`: how the main asset proves, clarifies, or anchors the slide.
- `fusion_candidate`: boolean, true only when the image has a safe seam side and one core claim.

Every visual receipt must also include:

- `container_fit_plan`: how visible text stays inside panels, cards, image dark zones, or open grid boundaries.
- `text_carrier`: `open_grid`, `image_dark_zone`, `line_annotation`, `axis_annotation`, `card_group`, or `metric_panel`.
- `container_decision`: why this slide does or does not need a card/panel.
- `shape_language`: the dominant visual device, such as `full_bleed_photo`, `annotated_image`, `chart_forward`, `editorial_split`, `sparse_quote`, `timeline`, `table_report`, or `metric_dashboard`.
- `card_budget`: `card_count` plus `why_cards_are_needed`; use it to limit card use, not to encourage cards.
- `chart_receipt`: chart id, renderer, unit, source, and why the chart is needed; `renderer=none` when the slide has no chart.

Do not deliver:

- a deck where `requires_real_images=true` is satisfied by generated SVG, chart SVG, preview wrapper images, or pure vector diagrams;
- a cover that lacks a real raster hero image when `cover_requires_real_hero_image=true`;
- an entity-driven company, brand, product, person, place, team, event, film, book, or financial-report company deck with zero real image assets unless the user explicitly requested chart-only/vector-only output;
- a deck with out-of-canvas text, clipped `foreignObject` text, collided timeline/axis labels, or important content outside the safe area;
- a core chart hand-written as SVG when `required_chart_renderer=vega-lite`;
- a deck that requires typography contract but lacks `brief/typography_contract.json`;
- a deck whose visible pages contain process words: `Sources:`, `source note`, `prompt`, `slide:note`, `接缝`, `取色`, `渐变遮罩`, `素材说明`, `制作说明`;
- a deck where all typography roles resolve to generic browser stacks, or a Chinese deck has no concrete CJK font in visible roles;
- a deck where the same real photo appears on more than two slides without `recurring_hero_rationale`;
- a deck where a single source URL provides more than 40% of visual assets without `single_source_rationale`;
- an `image_text_fusion_split` page without seam-side color choice, fade width, subject safety judgment, and reduced text density;
- a chart or data visual without `data_visual_rationale` and numeric `source_evidence`;
- a chart inserted because charts are available rather than because the slide needs quantitative comparison, trend, composition, or distribution;
- a deck where pages 2-9 repeat the same visible skeleton even if chart data or text changes;
- a deck with fewer than 5 distinct `layout_archetype` values when it has 8-12 slides;
- a financial report where most analysis pages are `left_text_right_chart` or equivalent split compositions.
