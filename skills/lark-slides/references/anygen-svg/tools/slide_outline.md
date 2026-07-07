---
id: slide_outline
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: outline
order: 20
cardinality: once
requires:
  - mode_system_prompt_svg
condition: always
trigger:
  - create_project_structure
consumes:
  - request/theme_contract.json
  - brief/design_brief.json
  - brief/visual_system.json
  - brief/typography_contract.json
  - brief/visual_quality_contract.json
produces:
  - outline/deck.json
  - receipts/tool_calls/outline/slide_outline.json
completion_gate:
  - deck_outline_schema_valid
---

<!--
Source snapshot: docs/vendor/anygen-svg/source.full.md
Remote source: https://bytedance.larkoffice.com/docx/KnCLd7xr5ohWONxhKsncZ3Lxnvd
Use: AnyGen SVG Slides prompt/reference asset for slides +create-svglide.
Rule: Do not edit semantics without refreshing the local source snapshot first.
-->

## slide_outline

创建大纲 / 项目结构。tool_outline_svg.go.tmpl

```text
Create the project structure with outline metadata, style settings, and empty slide files.

<instructions>
- Use this tool AFTER preparing the slide content draft (slide_content.md)
- The outline defines: page ids, titles, summaries (structural metadata), NOT the detailed content
- This tool creates: project directory, outline.json, a style file, and empty `.svg` slide placeholders
- Each slide's actual content will be written later using slides_edit based on the content draft
- Follow the user's confirmed slide count. If they confirmed a range (e.g., "8-12"), aim for the middle of that range. If no count was specified, default to an 8-12 slide deck. Unless the user explicitly asked for a short / concise deck, never create fewer than 8 slides. Remember that structural slides (cover, agenda, section dividers, closing) consume pages too — factor them into your total so content slides don't get squeezed

For official-site brand decks, preserve the website's visual/content families:
- factory pages should split major factories or process families when the source exposes them;
- product pages should use product-line imagery instead of generic material diagrams;
- shop/retail pages should use store imagery when the source exposes shops;
- a single "factory matrix" page is insufficient when the source has multiple factory sections and gallery assets.

Visual role assignment:
- For each slide, assign a `visual_role` in addition to the content role:
  - `hero_cover`: high-impact first impression, minimal copy, strong image or poster composition
  - `thesis`: one core judgment, one supporting visual
  - `evidence_grid`: dense proof page using multiple images, data points, or artifacts
  - `process_detail`: step or craft page with visible process evidence
  - `product_compare`: side-by-side visual comparison
  - `scene_or_retail`: real-world usage or endpoint experience
- The outline should include at least one high-impact cover and at least one evidence-rich page when the topic has process, craft, product, research, or factual depth.
- Each slide outline item should include `visual_intent`, explaining how the visual supports the message. Weak intents such as "add a relevant image" are not acceptable. The intent must say what the image proves or clarifies.
- Each slide outline item should also avoid generic "card grid" as the visual plan unless the user requested a dashboard/report. Name the page-specific visual structure instead: poster cover, route map, annotated photograph, field diagram, image-led comparison, evidence collage, chart page, or closing poster.
- Across the deck, do not let rounded text panels become the dominant visual rhythm. If several slides need facts or metrics, assign different structures before slides_edit starts.

Media pressure rhythm:
- Read `brief/visual_quality_contract.json` before finalizing the outline.
- If `media_pressure.min_dominant_real_image_pages` is set, reserve enough slide roles for dominant real imagery before planning charts/diagrams.
- If `media_pressure.max_consecutive_infographic_only_pages` is set, do not schedule a longer run of chart/table/diagram-only pages.
- For `financial_company_report`, the cover must be a real company/product/infrastructure hero page; at least one interior page should also use real subject imagery, not only charts.
- Do not plan tactical maps, pitch diagrams, risk radars, or coordinate analyses unless the research stage has source-backed geometry or event data. If only scores, biographies, or generic context are available, plan a real-image evidence page, timeline, evidence collage, or editorial statement page instead.
- For `premium_product_brand` / `brand_official_site`, product/detail/usage/source photos should appear across the deck, not only on cover and closing.
- For `sports_editorial` / `event_editorial`, alternate analysis pages with real event/team/player photo pages so the deck reads like editorial coverage, not a stat dashboard.
- Each outline item should make `visual_intent` concrete enough to support media pressure, e.g. "dominant data-center/GPU image proves the AI infrastructure subject" rather than "use a relevant image".

Theme contract rhythm:
- Read `request/theme_contract.json`.
- Reserve all `layout_rhythm.required_page_roles` before choosing decorative sectioning.
- Do not map different required roles to the same visible skeleton.
- If `layout_rhythm.min_slide_count` exceeds the user's unspecified default, use the theme floor.
- For cultural / food / beverage / lifestyle topics, include concrete material pages such as taxonomy, region/place, process/craft, tasting/use method, object/tool, modern adoption, and closing synthesis.

Layout storyboard assignment:
- Before finalizing `outline/deck.json`, create a layout storyboard for all slides.
- Every slide item must include `layout_family`, `layout_archetype`, and `layout_signature`.
- `layout_archetype` must describe the visible skeleton, not the content topic. Examples: `statement_ledger`, `waterfall_bridge`, `peer_bubble_field`.
- `layout_signature` must be more specific than the archetype. Examples: `income_statement_horizontal_bar_ledger`, `cash_flow_positive_negative_bridge`, `peer_margin_bubble_field`.
- For 8-12 slide decks, ensure at least 5 distinct archetypes before calling the outline complete.
- Do not assign the same archetype to adjacent slides.
- If the deck is a financial report, do not make every analysis page a chart page. Use a deliberate rhythm such as: `full_bleed_photo_title`, `poster_stat_lockup`, `statement_ledger`, `evidence_collage`, `waterfall_bridge`, `data_scoreboard`, `peer_bubble_field`, `risk_radar`, `closing_poster`.
</instructions>

<recommended_usage>
- Use to define the presentation structure and style before writing individual slides
</recommended_usage>
```
