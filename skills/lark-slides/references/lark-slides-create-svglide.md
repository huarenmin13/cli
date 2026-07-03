# slides +create-svglide

`slides +create-svglide` 是本地 SVGlide SVG Slides 运行目录工作台。第一版只创建和管理本地 run-dir，不创建在线飞书幻灯片，不调用 `slide_engine`，不做 SVG-to-SXSD 发布。

## AnyGen SVG prompt runtime 实验边界

`slides +create-svglide` 当前是 Codex 介入的 AnyGen SVG Slides 本地效果实验链路。它不发布到飞书 Slides，也不承诺完整 `.slides` runtime 等价。

prompt 模型采用接近 `ppt-master` 的资产化方式：

- prompt/reference assets 放在 `skills/lark-slides/references/anygen-svg/`。
- 本地 run 目录只保存生成产物、receipts、preview、schema、manifest 和 quality reports。
- Go 不负责设计判断或内容生成；Go 只负责 run-dir 创建、schema 检查、状态流转、SVG lint、本地 preview 和 quality gate。
- Codex 读取 skill/reference 文件，执行研究、design brief resolution、内容规划、资产准备和 SVG authoring。

本地 run 写入 `prompt_manifest.json`，记录本次 run 应使用哪些 prompt assets。它不再把完整 prompt 文本复制到 `prompts/`。

当前实验模式为 `experiment_unrestricted_assets`：为了优先验证内容完整度、视觉系统和 SVG preview 效果，资产路径允许宽松表达，包括远程图片 URL、临时路径或未来生成资产占位。生产化阶段需要重新收紧 asset contract、打包边界和发布前校验。

## AnyGen prompt assets

源快照：

- `docs/vendor/anygen-svg/source.full.md`
- `docs/vendor/anygen-svg/source.outline.md`
- `docs/vendor/anygen-svg/source.meta.json`

运行时 prompt/reference 文件：

- `skills/lark-slides/references/anygen-svg/mode_system_prompt_svg.md`
- `skills/lark-slides/references/anygen-svg/svg_reference.md`
- `skills/lark-slides/references/anygen-svg/tools/resolve_design_brief.md`
- `skills/lark-slides/references/anygen-svg/tools/slide_outline.md`
- `skills/lark-slides/references/anygen-svg/tools/slides_edit.md`
- `skills/lark-slides/references/anygen-svg/tools/generate_svg_chart.md`
- `skills/lark-slides/references/anygen-svg/tools/*.md`

## 第一阶段不承诺的能力

第一阶段不假装已经实现这些能力：

- native chart generation
- native table generation
- image crop / pan composition
- Feishu publish / `.slides` handover

如果 deck 需要这些能力，Codex 必须在 `content/slide_content.json` 和 `assets/assets_plan.json` 保留语义需求。当前可以用 `deferred` 或 unrestricted experiment asset 表达，不把它包装成已完成的生产能力。

## 推荐流程

初始化 run-dir：

```bash
lark-cli slides +create-svglide \
  --as user \
  --action init \
  --title "Demo" \
  --input ./source.md \
  --audience "产品负责人" \
  --delivery-mode self_read \
  --pages 8 \
  --out ./.lark-slides/svglide-runs/demo
```

查看下一步：

```bash
lark-cli slides +create-svglide --as user --action status --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
```

每个 stage 的循环：

```bash
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
# Codex 根据返回的 prompt_manifest / prompt_paths 读取 prompt assets 并填充当前 stage outputs
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
```

`outline`、`content`、`visual`、`assets` 就绪后，再生成基础 SVG author，支持文本、来源脚注和已规划图片资产：

```bash
lark-cli slides +create-svglide --as user --action author --run ./.lark-slides/svglide-runs/demo
```

最终校验、预览和质量门禁：

```bash
lark-cli slides +create-svglide --as user --action repair --run ./.lark-slides/svglide-runs/demo
```

必要时可单独定位校验或预览问题：

```bash
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action quality --run ./.lark-slides/svglide-runs/demo
```

`init` 只建立目录、`run.json`、`prompt_manifest.json`、schema 和 request 产物。Codex 按 `next` 返回的 `prompt_manifest` / `prompt_paths` 读取 prompt assets 并填充当前 stage 产物后，用 `complete` 校验并推进 stage。`repair` 会先执行 validate + preview + quality；只有三者都 passed 才最终 passed。deck 缺失、JSON 读取失败等不可自动修复的问题会通过命令错误、已有 `receipts/lint.json`、`receipts/preview.json` 和 `repair_queue.md` 暴露；`quality` 成功执行后才保证写出 `quality_report.json`。

## Action

| Action | 作用 | 主要产物 |
|--------|------|----------|
| `init` | 创建本地 run-dir | `run.json`、`request/request.json`、`prompt_manifest.json`、`schemas/*.json` |
| `status` | 查看当前 stage、缺失输入/输出和下一条命令 | JSON 状态报告 |
| `next` | 返回当前 stage 的 prompt manifest、prompt asset paths、输入和输出列表 | JSON task 报告 |
| `complete` | 校验当前 stage 输出并推进到下一 stage | `run.json`、`receipts/<stage>.json` |
| `author` | 基于 deck/content/visual/assets 生成基础 SVG author，支持文本、来源脚注和已规划图片资产 | `slides/*.svg`、`receipts/svg_author.json` |
| `validate` | 校验 `outline/deck.json` 中的 `slides/*.svg` | `receipts/lint.json`、`repair_queue.md` |
| `preview` | 生成本地 HTML 预览 | `preview.html`、`receipts/preview.json` |
| `quality` | 校验当前本地实验质量门禁：来源、引用、视觉需求、asset id/type 语义链路 | `quality_report.json` |
| `repair` | 执行 validate + preview + quality；仅当三者都 passed 时最终 passed | `receipts/validate_preview_repair.json`、`quality_report.json` |

## 运行目录

核心文件：

- `run.json`
- `prompt_manifest.json`
- `request/request.json`
- `request/source_manifest.json`
- `research/research_notes.md`
- `research/sources.json`
- `brief/design_brief.json`
- `brief/visual_system.json`
- `outline/deck.json`
- `content/slide_content.md`
- `content/slide_content.json`
- `assets/assets_plan.json`
- `quality_report.json`
- `slides/*.svg`
- `receipts/*.json`
- `repair_queue.md`
- `preview.html`

## 边界

- CLI 负责 run-dir 骨架、prompt manifest、schema、状态检查、SVG protocol 校验、当前本地实验 quality gate、repair queue 和 HTML preview。
- Codex 负责网页研究、完整页面读取、design brief、visual system、slide content、资产规划、生图/搜图结果落地、每页 source_refs/visuals 以及 SVG authoring 和修复。
- assets_plan 是先规划后写 SVG 的输入；当前实验模式要求写 `mode: "experiment_unrestricted_assets"`，允许 path 使用远程 URL、临时路径、本地路径或后续生成资产占位。生产化阶段再恢复可搬运的本地 asset contract。
- `quality` action 是当前本地实验质量门禁入口，覆盖来源、引用、视觉需求、asset id/type/status 语义链路；它不检查资产路径安全或文件是否已本地落地。`repair` 的 final quality gate 必须和 validate、preview 一起通过。
- 第一批功能等价适配不实现 native chart、native table、图片裁剪。遇到真实数据图表、表格或图片构图需求时，Codex 在内容层保留语义说明，并用 `deferred` 或 unrestricted experiment asset 表达，不伪装成已完成生产能力。
- 本命令不发布到 Feishu，不返回 `xml_presentation_id`，不创建 `.slides`，不调用 Slides OpenAPI。
- `preview` 只允许 deck slide path 使用 `slides/<file>.svg` 单层本地路径；不要引用远程 URL、上级目录、百分号编码路径或嵌套目录。
- `validate` 的 `ok=false` 表示内容校验失败，但命令仍会输出结构化报告；只有 run-dir 读取或本地写入失败才是命令异常。

## Codex 执行规则

1. 先运行 `status` 或 `next`，确认当前 stage 和缺失产物。
2. 按 `next` 返回的 `prompt_manifest` / `prompt_paths` 读取 AnyGen prompt assets，填充当前 stage 的输出，不跳 stage 写最终 SVG。
3. 每个 stage 输出就绪后运行 `complete`，让 CLI 校验当前 stage 并推进 `run.json`。
4. 写 `content/slide_content.md` 时为每页补齐 `source_refs` 和 `visuals`；写 `assets/assets_plan.json` 时显式包含 `mode: "experiment_unrestricted_assets"`，并保留图片、图表、表格、裁剪等视觉语义。
5. 当 `outline`、`content`、`visual`、`assets` 已存在时，可运行 `author` 生成包含文本、来源脚注和本地图片的基础 SVG。
6. 生成 SVG 时保持纯 SVG、`viewBox="0 0 960 540"`、可选中文本；当前实验模式允许 `<image href>` 使用远程或临时资产路径。
7. 最后运行 `repair`，形成 validate + preview + quality 三门禁和 final receipt；`repair` 只自动处理可由基础 `author` 覆盖的 lint 失败，deck 缺失、JSON 读取失败等问题会通过命令错误、已有 receipt 和 `repair_queue.md` 暴露；`quality` 成功执行后才保证写出 `quality_report.json`。
8. 不要把这个本地工作台描述成完整 12-agent 自动化系统；它是 Codex 协作的分阶段本地 runtime。

## 常见命令

```bash
# 查看下一步该做什么
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo

# 校验当前 stage 并推进
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo

# 基于已完成的 deck/content/visual/assets 生成文本、来源脚注和图片资产 SVG
lark-cli slides +create-svglide --as user --action author --run ./.lark-slides/svglide-runs/demo

# 只做 SVG 协议校验
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo

# 生成本地预览
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo

# 只做当前本地迁移质量门禁
lark-cli slides +create-svglide --as user --action quality --run ./.lark-slides/svglide-runs/demo

# 执行 validate，preview 和 quality
lark-cli slides +create-svglide --as user --action repair --run ./.lark-slides/svglide-runs/demo
```
