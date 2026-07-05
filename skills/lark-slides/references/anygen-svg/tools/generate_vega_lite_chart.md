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
produces:
  - assets/charts/specs/*.vl.json
  - assets/charts/*.svg
  - assets/charts/chart_manifest.json
  - receipts/tool_calls/assets/generate_vega_lite_chart.json
completion_gate:
  - vega_lite_spec_ready
  - rendered_svg_ready
  - chart_manifest_ready
---

## generate_vega_lite_chart

当 `visual_quality_contract.required_chart_renderer` 为 `vega-lite` 时，核心数据可视化必须走本工具语义，不得用手写 SVG chart 冒充。

执行顺序：

1. 为每个核心 chart 写 Vega-Lite JSON spec 到 `assets/charts/specs/<chart-id>.vl.json`。
2. 用该 spec 渲染 SVG 到 `assets/charts/<chart-id>.svg`。
3. 写入或更新 `assets/charts/chart_manifest.json`，登记 `renderer=vega-lite`、`spec_path`、`svg_path`、`slide_id`、`source_id`。
4. 在 `assets/assets_manifest.json` 中登记同一个 chart 资产，`kind=chart`，`local_path=assets/charts/<chart-id>.svg`。
5. 图表必须能静态阅读：优先直标、少用 legend、不依赖 hover、轴标签和数值标签不能重叠。
6. 每个 chart 的数据来源必须能回到 `research/sources.json` 或 `visual_receipts.json.source_evidence`。

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
      "spec_path": "assets/charts/specs/revenue_trend.vl.json",
      "svg_path": "assets/charts/revenue_trend.svg",
      "source_id": "nvidia-fy2024-10k"
    }
  ]
}
```

失败语义：

- 只有 `.svg` 没有 `.vl.json`：失败。
- manifest renderer 不是 `vega-lite`：失败。
- spec 或 svg 文件不可读：失败。
- 用 `generate_svg_chart` 手写核心图表：失败。
