---
id: generate_vega_lite_chart
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: conditional
stage: assets
profiles:
  - local_svg_deck
  - imported_pptx
  - template_reference
exposure: runtime
order: 79
cardinality: zero_or_more
requires:
  - mode_system_prompt_svg
  - svg_reference
condition: required_chart_renderer_vega_lite
trigger:
  - visual_quality_contract.required_chart_renderer=vega-lite
  - financial_report_chart_required
  - data_report_chart_required
consumes:
  - content/slide_content.json
  - research/sources.json
  - assets/assets_manifest.json
  - assets/charts/chart_briefs.json
produces:
  - assets/charts/specs/*.vl.json
  - assets/charts/chart_manifest.json
  - receipts/tool_calls/assets/generate_vega_lite_chart.json
completion_gate:
  - vega_lite_spec_ready
  - chart_manifest_ready
---

## generate_vega_lite_chart

当 `visual_quality_contract.required_chart_renderer` 为 `vega-lite` 时，核心数据可视化必须走本工具语义，不得用手写 SVG chart 冒充。

Vega-Lite 是数据关系表达工具，不是页面装饰工具。只在 slide 需要表达定量比较、趋势、构成、分布或明确的数据关系时使用；不要为了显得专业而给每一页都加图表。

执行顺序：

1. 先读取 `assets/charts/chart_briefs.json`，只为其中 `renderer=vega-lite` 的 brief 生成 spec。
2. 为每个核心 chart 写 Vega-Lite JSON spec 到 `assets/charts/specs/<chart-id>.vl.json`。
3. 写入或更新 `assets/charts/chart_manifest.json`，登记 `renderer=vega-lite`、`brief_id`、`spec_path`、`svg_path`、`slide_id`、`source_id`、`unit`、`takeaway`、`render_receipt=receipts/chart_render.json`。
4. 不要写 `assets/charts/*.svg`。本地 SVGlide runtime 会在 StageAssets completion 调用 Node renderer (`vega-lite` + `vega`) 渲染 SVG，并写 `receipts/chart_render.json`。
5. 图表必须能静态阅读：优先直标、少用 legend、不依赖 hover、轴标签和数值标签不能重叠。
6. 每个 chart 的数据来源必须能回到 `research/sources.json`。
7. 每个 chart 必须有单位、来源、直接标签或可读坐标轴，以及结论导向标题；标题写“说明了什么”，不是字段名。
8. Slide 里只能通过 `<rect slide:role="chart" href="assets/charts/<chart-id>.svg">` 嵌入渲染后的 chart asset，不得在 slide 中重新手画任意柱条来冒充 Vega-Lite 输出。
9. `visual_receipts.json.chart_receipt` 必须记录 `chart_id`、`renderer`、`unit`、`source`、`why_chart_is_needed`；无图表页写 `renderer=none`。

`assets/charts/chart_manifest.json` 示例：

```json
{
  "prompt_contract": {},
  "renderer": "vega-lite",
  "charts": [
    {
      "id": "revenue_trend",
      "slide_id": "s3",
      "renderer": "vega-lite",
      "brief_id": "revenue_trend",
      "spec_path": "assets/charts/specs/revenue_trend.vl.json",
      "svg_path": "assets/charts/revenue_trend.svg",
      "source_id": "nvidia-fy2024-10k",
      "unit": "$B",
      "takeaway": "Data center revenue became the growth driver",
      "render_receipt": "receipts/chart_render.json"
    }
  ]
}
```

失败语义：

- 只有 `.svg` 没有 `.vl.json`：失败。
- manifest renderer 不是 `vega-lite`：失败。
- spec 或 svg 文件不可读：失败。
- 用 `generate_svg_chart` 手写核心图表：失败。
- agent 直接写 `assets/charts/*.svg` 冒充 Node renderer 输出：失败。
- 图表无单位、无来源、无结论导向标题，或无法说明为什么这一页需要 chart：失败。
