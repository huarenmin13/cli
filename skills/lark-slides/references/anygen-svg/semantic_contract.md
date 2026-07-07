---
id: anygen_semantic_contract
role: semantic_contract
invocation: reference
stage: validate_preview_repair
order: 110
cardinality: once
condition: always
trigger:
  - semantic_gate_validation
rules:
  - id: no_silent_all_diagram_fallback
    kind: explicit_reason_required
    when: deck_has_zero_image_assets
    artifact: assets/assets_manifest.json
    field: no_image_reason
    severity: error
  - id: image_visual_requires_image_asset
    kind: visual_asset_type_match
    visual_type: image
    asset_type: image
    severity: error
  - id: ready_image_and_active_asset_refs_must_render
    kind: svg_contains_asset_href
    asset_type: image
    asset_status: ready
    svg_selector: '<image slide:role="image"'
    severity: error
---

# AnyGen Semantic Contract

本文件是 `slides +create-svglide` 本地 semantic gate 的机器可读规则来源。Go 只实现有限、稳定、可测试的 `kind`；规则实例来自上方 frontmatter，不从 AnyGen prompt 正文或本文正文推导。

当前 frontmatter 规则覆盖三条本地 fail-closed 语义：

1. deck 没有任何 image asset 时，`assets/assets_manifest.json` 必须给出 `no_image_reason`，禁止静默退化为全 diagram。
2. `visual_type: image` 的视觉需求必须匹配 `asset_type: image`。
3. `ready` 状态的 image asset 必须在 SVG 中通过 `<image slide:role="image"` 引用；SVG 中 active external href 必须登记为 ready asset 并通过对应类型的路径安全校验：`<image>` 只能引用 image asset，`<rect slide:role="chart">` 只能引用 chart asset，`<use>` 只允许内部 `#fragment`，不允许外部 asset href。

本文正文只解释 frontmatter 的用途；运行时以 frontmatter 为准。

补充的 strict visual contract 由 Go quality gate 执行，不通过 frontmatter 扩展未实现的 `kind`：

4. `requires_real_images=true` 时，真实图片只统计 raster image 资产：`png`、`jpg`、`jpeg`、`webp`、`avif`。`generated_svg`、chart SVG、slide preview wrapper image 不计入真实图片。
5. `cover_requires_real_hero_image=true` 时，封面必须有真实 raster image 资产，并以 `<image slide:role="image">` 形成可见 hero。
6. `required_chart_renderer=vega-lite` 时，核心 chart 必须同时有 `assets/charts/chart_briefs.json`、Vega-Lite spec、Node renderer 生成的 SVG、`receipts/chart_render.json`、`receipts/chart_usage.json`、以及 `assets/charts/chart_manifest.json` 记录；本地 SVG deck 不允许用手写 SVG chart 冒充标准 chart。
7. `typography_contract_required=true` 时，必须有 `brief/typography_contract.json`，并定义 display/body/number/label 四类字体角色。
8. `parser_unsafe_count>0` 时，delivery 必须失败。parser-safe SVG 禁止 native `<text>/<tspan>`、root `<style>`、CSS `class`、CSS variables、非 960×540 根画布、前景几何缺失 parser `slide:shape-type`，以及 text `foreignObject` 的 direct `<div>` 包装。
