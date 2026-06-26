# SVGlide 线上可编辑协议元素穿透报告

生成时间：2026-06-26  
目标仓库：`/Users/bytedance/bd-projects/workspaces/SVGlide/.worktrees/cli-svglide-svg-private`  
目标分支：`feat/svglide-artboard-satori`  
关联 slide 仓库：`/Users/bytedance/bd-projects/workspaces/SVGlide/.worktrees/slide-svglide-chart-direct-snapshot`  
关联 slide 分支：`feat/svglide-chart-direct-snapshot`

## 1. 本次目标

把问题重新锚定在 **SVGlide `+create-svg` 链路**：确认 raw Satori / contract SVG 如何提交到 slide 后端，并定义如何从“视觉保真但全页图片”升级为“线上真正可编辑的协议元素”。

本报告不把 XML 全页图片 fallback 作为目标方案。XML 全页图片只能作为诊断或临时视觉兜底；SVGlide 的目标是让 slide 后端 parser 把 SVG 协议节点转换为可编辑 blocks。

## 2. 团队设置

| 角色 | 职责 | 本次输出 |
|---|---|---|
| CLI 契约审查者 | 检查 `generate_svg -> contract_compile -> prepare -> +create-svg` 之间哪里丢失可编辑性 | 定位到 `prepare` 当前把 `artboard_satori` 默认包成整页 PNG |
| slide parser 审查者 | 检查 slide 后端实际支持的 SVGlide SVG 协议元素 | 确认 `<text slide:role="text">`、shape、line、image、chart marker 等 direct parser 路径存在 |
| E2E 验收审查者 | 设计线上可编辑的验收矩阵和阻断规则 | 提出 `editability_gate`，与 `snapshot_visual_fidelity` 并列为 P0 |

## 3. 当前事实

### 3.1 CLI 侧当前链路

当前链路不是直接把 raw Satori SVG 提交到线上：

```text
generate_svg
  -> 04-artboard/raw/page-###.visual.svg
  -> 04-artboard/raw/page-###.visual.png
contract_compile
  -> 04-svg/page-###.svg
prepare
  -> 04-svg/prepared/page-###.svg
+create-svg
  -> slide 后端创建线上文档
```

`contract_compile` 已经能把 raw Satori 节点 lower 成协议 SVG：

- raw `<text>` -> `<text slide:role="text" data-svglide-text-style-id="...">`
- raw shape -> `slide:role="shape"`
- raw image -> `slide:role="image"`
- metadata -> `svglide-satori-text-style/v1`

但 `prepare` 在 `generation_mode == "artboard_satori"` 时，当前默认不是提交 `04-svg/page-###.svg`，而是写成整页图片 wrapper：

```xml
<svg ... slide:role="slide" ...>
  <image slide:role="image" href="@./04-artboard/raw/page-###.visual.png"
         x="0" y="0" width="960" height="540" />
</svg>
```

receipt 也明确记录：

```text
submission_compatibility.mode = full_page_raster_submission
tradeoff = online text is not editable
```

所以当前线上产物“全是图片”的直接原因不是 slide 后端天然不支持 SVGlide，而是 CLI 的 `prepare` 阶段主动选择了整页 raster submission。

### 3.2 slide 侧当前 parser 能力

slide 侧并不是只能吃整页图片。当前 SVGlide SVG 会先被识别为 `<svg slide:role="slide">`，再进入 `BlockSVGParserService.parse` 和 direct SVG parser，最后插入线上可编辑 blocks。

已确认的支持面：

| 输入协议元素 | 线上目标 block | 备注 |
|---|---|---|
| `<text slide:role="text">` | Text shape / editable text | 支持 Satori text style manifest |
| `<foreignObject slide:role="text">` | Text shape / editable text | 支持递归抽取文本与部分 CSS |
| `<foreignObject slide:role="shape" slide:shape-type="text">` | Text shape / editable text | 当前协议文档中的文本 shape 路径 |
| `rect/circle/ellipse/path/polygon/polyline` | Shape block | path 只支持 MVP 命令 `M/L/H/V/C/Q/Z` |
| `line` | Line block | 不应伪装为普通 leaf shape |
| `image` | Image block | 必须有完整 file meta 或 assets metadata |
| 普通 `g` | 容器 | 递归展开 children，传递 transform/style |
| `g slide:role="chart"` | Chart/embed block | 需要 chart metadata 和 preparedCharts |

主要限制：

- 不支持完整浏览器 HTML/CSS 布局。
- `table` 不支持，应走局部 raster 或重写为 shape/text。
- path 的 `A/S/T` 等命令会被拒绝。
- `filter/mask/clipPath/pattern/use/symbol/marker/animate` 等复杂效果不能静默通过，必须降级、局部 raster 或阻断。
- image 必须有 file token metadata，不能只提交本地路径、HTTP URL 或 data URL。

## 4. 核心结论

当前真正的矛盾不是“线上只能支持图片”，而是：

1. slide parser 已经有 direct editable SVG 路径；
2. CLI 的 `contract_compile` 已经在向 raw Satori lowering 方向走；
3. 但 `prepare` 为了确保线上创建成功，把 artboard 输出改成了整页图片；
4. 现有 `quality_gate/readback/snapshot_visual_fidelity` 只证明“能创建、能看、像不像”，没有证明“线上可编辑”；
5. 因此需要恢复 SVGlide 可编辑提交路径，并新增 readback 后的 `editability_gate`。

## 5. 目标链路

目标链路应为：

```text
用户需求 / 参考资产
  -> planner / theme-template selection
  -> canvas spec
  -> raw Satori visual SVG
  -> contract_compile: raw Satori lowering
  -> prepare: asset token 注入 + 协议校验 + 必要局部降级
  -> +create-svg: 提交 SVGlide protocol SVG
  -> slide direct parser: 生成 editable text/shape/line/image/chart blocks
  -> readback
  -> editability_gate
  -> snapshot_visual_fidelity
```

`prepare` 不应再抢 `contract_compile` 的视觉/协议工作。它的职责应该收缩为：

- 注入或校验图片资产 metadata/token；
- 校验 root protocol、hash、manifest freshness；
- 对 slide parser 不支持的局部节点做显式降级；
- 记录 loss notes；
- 在可编辑 profile 下拒绝整页 raster fallback。

## 6. P0 防偏移原则

1. 不把 XML 全页图片方案当作 SVGlide 目标方案。
2. 不允许 `artboard_satori` 默认产物是 full-page raster submission。
3. 不允许视觉 fidelity 通过来覆盖 editability 失败。
4. 不允许没有 readback block type 证据就宣称“线上可编辑”。
5. 不允许把 `semantic_map` 重画作为 raw Satori 的默认视觉来源。
6. 不允许 unsupported nodes 静默消失；必须 `degraded/dropped/blocked` 并写 receipt。
7. 不允许没有 file metadata 的 image 进入线上提交。

## 7. 必须新增的验收指标

| 指标 | 含义 | 通过标准 |
|---|---|---|
| `full_page_raster_count` | 覆盖页面 >= 90% 的 image block 数量 | 可编辑线上提交必须为 `0` |
| `editable_text_count` | readback 中可编辑 text shape 数量 | 有文本页面必须 `>= 1`，smoke fixture 用精确值 |
| `editable_shape_count` | readback 中非文本 shape 数量 | 内容页建议 `>= 2`，fixture 用精确值 |
| `editable_line_count` | readback 中 line block 数量 | 与 fixture 预期一致 |
| `raster_area_ratio` | image block 面积 / 页面面积 | 无声明图片页 `<= 0.05`，有图片资产页建议 `<= 0.20` |
| `image_only_page_count` | 只有 image block 的页面数量 | 可编辑提交必须为 `0` |
| `snapshot_visual_fidelity` | 视觉相似度 | 继续保留，但不能替代 editability |

最终线上可提交定义：

```text
quality_gate passed
+ dry_run current
+ live_create passed
+ readback passed
+ editability_gate passed
+ snapshot_visual_fidelity passed
```

## 8. Diff 级执行计划

### M1. 建立 editable online profile

Red：

- `svglide_prepare_test.py` 新增：`artboard_satori + editable_online` 下，`full_page_raster_submission` 必须失败。
- `svg_preflight_test.py` 新增：可编辑 profile 下，整页 image wrapper 必须失败。
- `svglide_project_runner_test.py` 新增：live-create 前如果 receipt 是 `full_page_raster_submission`，必须阻断。

Green：

- 在 `svglide_prepare.py` 增加 `editable_svg` 提交模式。
- 默认或 production profile 下，把 `04-svg/page-###.svg` 作为 prepared 输出。
- 只有显式 `--allow-visual-fallback` 或 debug profile 才允许 full-page raster。

### M2. 统一文本协议路径

Red：

- CLI fixture 覆盖 `<text slide:role="text"> + svglide-satori-text-style/v1`。
- slide dispatch fixture 覆盖同一 SVG，断言最终是 `ShapeBlockType + ShapeType.Text`，且文本 payload 非空。
- 加一个 `foreignObject text` fallback fixture，确认差异。

Green：

- 以 slide parser 当前真实支持路径为准，统一 `svglide-artboard-satori.contract.md` 与 `svg-protocol.md`。
- 若采用 `<text slide:role="text">`，则 `prepare/preflight/+create-svg` 都不能再要求转成 `foreignObject`。
- 若线上环境只接受 `foreignObject`，则 `contract_compile` 负责 text lowering，而不是 `prepare` 临时重写。

### M3. 修正 prepare 职责边界

Red：

- prepared SVG 与 contract SVG 的 text/shape/path/image retention 低于阈值时失败。
- `prepare` 不允许生成 generic content-card 或整页 image。
- unsupported support nodes 必须进入 `loss_notes` 或 `unsupported_support_nodes`。

Green：

- `prepare` 只做 token 注入、metadata 补齐、hash/manifest freshness、显式局部降级。
- 局部 raster island 必须有 bbox、原因、面积占比、source refs。
- 默认禁用整页 raster。

### M4. 新增 editability_gate

Red：

- readback 只有一个整页 `ImageBlockType` 时，即使视觉 fidelity 通过也失败。
- source/prepared 有文本，但 readback `editable_text_count == 0` 时失败。
- 任一页只有 image blocks 时失败。
- chart 页面允许 chart/embed block，但不能用整页 image 代替全部内容。

Green：

- 新增 `svglide_editability_gate.py` 或扩展 `svglide_readback.py`。
- 输出 `editability-report.json`。
- runner 在 `live_create -> readback -> snapshot_visual_fidelity` 之间插入 `editability_gate`。

### M5. 建立最小线上可编辑 smoke deck

Red：

- `editable_native_minimal`：2 页，每页至少 2 个 text、3 个 shape、1 个 line、0 整页 image。
- `editable_satori_text_style`：覆盖 Satori style manifest。
- `raster_island_allowed`：只允许小 logo/photo raster。
- `full_page_raster_negative`：必须失败。

Green：

- 用 `+create-svg` 真实创建线上 deck。
- readback 统计 block types。
- 截图对比 raw/contract/prepared/online。

## 9. 预期收益

完成后，SVGlide 链路会从“能把 Satori 视觉作为图片发上去”升级为：

- 文本可在线编辑；
- 基础形状、线条可在线编辑；
- 图片以真实 image block 存在，而不是整页截图；
- chart marker 可走 chart/embed block；
- 视觉保真和可编辑性分别验收，互不遮蔽；
- `prepare` 不再破坏 `contract_compile` 已经做好的协议 lowering；
- 后续 beautiful template 的高保真复刻可以真正进入线上可编辑链路。

## 10. 当前剩余风险

1. slide parser 单测支持不等于当前线上 PPE/生产部署一定已支持，需要 live probe 验证。
2. Satori `<text>` 的浏览器排版与 slide text shape 的排版模型不同，可能出现换行、字距、行高偏差。
3. 复杂 CSS 效果仍需要局部 raster island，不能全部转为 editable block。
4. path 命令需要清洗或近似，否则 `A/S/T` 等会被 slide parser 拒绝。
5. image 资产必须走 token/metadata 链路，不能用本地路径伪装。

## 11. 下一步建议目标

建议下一个 goal：

```text
按 TDD 恢复 SVGlide artboard_satori 的线上可编辑提交路径：
先建立 editable_online profile 和 editability_gate，
再让 prepare 默认提交 contract SVG 而不是整页 raster，
最后用最小 smoke deck 跑通 +create-svg live create、readback、editable block 统计和视觉对比。
```

