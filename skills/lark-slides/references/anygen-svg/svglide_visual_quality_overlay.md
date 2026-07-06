---
id: svglide_visual_quality_overlay
role: runtime_binding
invocation: reference
profiles:
  - local_svg_deck
exposure: runtime
---

# SVGlide Visual Quality Overlay

This is a local SVGlide runtime overlay. It extends the native AnyGen SVG prompt for local HTML/SVG preview quality without modifying `docs/vendor/anygen-svg/source.full.md` or source-snapshot prompt bodies.

## SVGlide visual generation contract

You are generating a real local SVGlide / SVG PPT for final preview quality. Structural completeness is not enough. The deck must make topic-specific visual decisions before SVG authoring.

Research and image sourcing:
- Use the user's supplied site or files as primary context, but do not treat one uploaded image as the only visual source unless the user explicitly asks for a single-image deck.
- For real-world topics, collect typed sources: `identity`, `facts`, `visuals`, and `context`.
- Each visual asset must declare its semantic role: `cover_hero`, `person_subject`, `product_detail`, `place_scene`, `evidence_image`, `texture`, or `source_capture`.
- Reject low-relevance, low-resolution, repeated-subject, visibly stretched, or upsampled images.
- If enough real images are unavailable, use SVG-native visual explanation instead of pretending the deck has real photo coverage.

Page families:
- Page families are a vocabulary, not a rotation template. Choose the composition from story and available assets first, then select the closest family.
- Content decides the carrier. Decide what the slide must express first, then choose open grid, image dark zone, annotation, axis/table structure, metric panel, or card. Do not draw a card first and force text into it.
- Every slide must choose one `layout_family` before SVG authoring.
- Valid families: `full_bleed_hero`, `image_text_fusion_split`, `evidence_board`, `timeline_route`, `data_scoreboard`, `character_product_focus`, `quiet_synthesis`.
- `image_text_fusion_split` may appear on at most 30% of slides, capped at 3 slides in a 10-slide deck, and must not appear on adjacent slides.
- The cover must use `full_bleed_hero` or `character_product_focus` unless the topic has no usable real visual asset.
- Each slide must have one dominant visual center; do not stack multiple competing hero treatments.
- Every slide must state how its composition differs from the previous slide.
- The cover must be designed for thumbnail reading: one clear subject, high contrast, direct topic recognition.

Layout rhythm hard gate:
- Every slide must declare `layout_archetype` in addition to `layout_family` and `layout_signature`.
- `layout_family` is the broad family, `layout_archetype` is the visible skeleton, and `layout_signature` is the page-specific implementation.
- Valid `layout_archetype` values: `full_bleed_photo_title`, `poster_stat_lockup`, `image_argument_split`, `annotated_image`, `evidence_collage`, `timeline_path`, `data_scoreboard`, `statement_ledger`, `waterfall_bridge`, `peer_bubble_field`, `risk_radar`, `closing_poster`.
- For decks with 8-12 slides, use at least 5 distinct `layout_archetype` values.
- No `layout_archetype` may appear on adjacent slides.
- No single `layout_archetype` may exceed 25% of slides in decks with 8 or more slides.
- `image_argument_split` and any `left_text_right_chart`-style skeleton may appear at most 2 times in a 10-slide deck and never on adjacent slides.
- Financial/report decks may use more charts, but chart pages must vary the skeleton: use `statement_ledger`, `waterfall_bridge`, `data_scoreboard`, `peer_bubble_field`, `timeline_path`, or `risk_radar` instead of repeating one left-text/right-chart composition.
- If a slide uses a chart, its archetype must explain the chart's narrative job. Do not use charts as the default right-side filler.
- Before SVG authoring, inspect the storyboard. If slides 2-9 can be described by the same sentence, revise the storyboard first.

Image-text fusion:
- Use `image_text_fusion_split` only when the page has one strong image and one core claim.
- The image edge next to the text panel must contain a low-luminance, low-texture, low-information region.
- Sample the seam-side edge, not the whole image average. Use 20-80px from the seam side.
- The text panel background must match the sampled seam color or a lightly denoised variant.
- Add an 80-180px same-color transparent gradient over the seam.
- Do not place faces, product details, badges, scores, or key actions inside the seam fade area.
- Keep text density to one claim, one short explanation, and two to four high-value metrics.
- Text does not default into cards. Use a card only when it frames a real comparison, metric group, quote, or control-like panel, or when a complex background needs a readability surface.
- Do not write process language such as `seam`, `sampling`, `prompt`, `source note`, `取色`, `接缝`, or `制作说明` into visible slide text.

Typography:
- Declare `font_display`, `font_body`, `font_number`, and `font_label` for every deck.
- Typography is a topic identity system, not a checkbox. Finance, sports, luxury, product, and cultural decks must not reuse one generic default stack.
- Do not set all font roles to `Arial, Helvetica, sans-serif`.
- For Chinese decks, every visible role must include a concrete CJK font from the supported taxonomy, with generic fallback last.
- Display and body stacks must differ unless the requested output is a plain operational report.
- If the topic is financial, numeric/table roles must be explicit. If the topic is sports, display and score roles must feel athletic/editorial. If the topic is premium brand/product, display typography must carry brand/editorial character.
- State how title, body, number, and label differ by family, weight, size range, and usage.

Data visuals:
- Do not add charts or data visuals unless the slide has numeric evidence in `source_evidence`.
- Every chart/data visual must declare `data_visual_rationale` and the exact source refs that support it.
- Vega-Lite is not a per-page default. Use it only for quantitative comparison, trend, composition, distribution, or another explicit data relationship.
- Data visuals are not decorative fillers. If the story does not need a chart, use photo, typography, map, timeline, or SVG-native composition instead.

Visual receipts:
- Before writing SVG, prepare one receipt per slide with `slide_id`, `story_job`, `layout_family`, `layout_archetype`, `layout_signature`, `thumbnail_job`, `visual_center`, `topic_fit_claim`, `information_density_plan`, `page_difference_from_previous`, `primary_asset`, `asset_role`, `font_role_usage`, `composition_intent`, `data_visual_rationale`, `source_evidence`, `container_fit_plan`, `container_decision`, `text_carrier`, `shape_language`, `card_budget`, `chart_receipt`, `fusion_spec`, and `qa_expectations`.
- `container_decision` must explain why the slide does or does not need a card/panel. `card_budget` is a limit, not encouragement to add cards.
- The receipt is debug/output data only. Do not render receipt fields as visible page text.
- If visual QA fails, repair the specific failed slide and update its receipt.
