# slides +create-svglide

`slides +create-svglide` 是本地 SVGlide SVG Slides 运行目录工作台。第一版只创建和管理本地 run-dir，不创建在线飞书幻灯片，不调用 `slide_engine`，不做 SVG-to-SXSD 发布。

## AnyGen 标准迁移边界

`slides +create-svglide` 是本地 AnyGen SVG Slides 工作台，不是 Feishu 发布链路。

CLI 负责：
- 初始化 run-dir
- 生成 prompts/schemas
- 推进阶段
- 校验 schema
- 校验 SVG protocol
- 生成 preview
- 在 quality 成功执行后生成 quality_report.json

Codex 负责：
- 网页研究和完整页面读取
- 生成 research_notes.md 与 sources.json
- 生成 design_brief.json 与 visual_system.json
- 生成 slide_content.md 与 slide_content.json
- 搜图/生图并写入 assets/images/*
- 编写或修复 slides/*.svg

第一阶段不支持：
- chart 自动生成
- table 语义渲染
- image crop / pan
- Feishu Slides 发布

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
# Codex 根据返回的 prompt 填充当前 stage outputs
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
```

`outline`、`content`、`visual`、`assets` 就绪后，再生成基础 SVG author，支持文本、来源脚注和已准备本地图片：

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

`init` 只建立目录、`run.json`、prompt、schema 和 request 产物。Codex 按 `next` 返回的 prompt 填充当前 stage 产物后，用 `complete` 校验并推进 stage。`repair` 会先执行 validate + preview + quality；只有三者都 passed 才最终 passed。deck 缺失、JSON 读取失败等不可自动修复的问题会通过命令错误、已有 `receipts/lint.json`、`receipts/preview.json` 和 `repair_queue.md` 暴露；`quality` 成功执行后才保证写出 `quality_report.json`。

## Action

| Action | 作用 | 主要产物 |
|--------|------|----------|
| `init` | 创建本地 run-dir | `run.json`、`request/request.json`、`prompts/*.task.md`、`schemas/*.json` |
| `status` | 查看当前 stage、缺失输入/输出和下一条命令 | JSON 状态报告 |
| `next` | 返回当前 stage 的 prompt、输入和输出列表 | JSON task 报告 |
| `complete` | 校验当前 stage 输出并推进到下一 stage | `run.json`、`receipts/<stage>.json` |
| `author` | 基于 deck/content/visual/assets 生成基础 SVG author，支持文本、来源脚注和已准备本地图片 | `slides/*.svg`、`receipts/svg_author.json` |
| `validate` | 校验 `outline/deck.json` 中的 `slides/*.svg` | `receipts/lint.json`、`repair_queue.md` |
| `preview` | 生成本地 HTML 预览 | `preview.html`、`receipts/preview.json` |
| `quality` | 校验当前本地迁移质量门禁：来源、引用、视觉需求和本地资产路径 | `quality_report.json` |
| `repair` | 执行 validate + preview + quality；仅当三者都 passed 时最终 passed | `receipts/validate_preview_repair.json`、`quality_report.json` |

## 运行目录

核心文件：

- `run.json`
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

- CLI 负责 run-dir 骨架、prompt/schema、状态检查、SVG protocol 校验、当前本地迁移 quality gate、repair queue 和 HTML preview。
- Codex 负责网页研究、完整页面读取、design brief、visual system、slide content、资产规划、生图/搜图结果落地、每页 source_refs/visuals 以及 SVG authoring 和修复。
- assets_plan 是先规划后写 SVG 的输入；Codex 应先写 assets_plan，再落地 `assets/images/*`，最后让 `author` 或 `repair` 消费这些本地资产。
- `quality` action 是当前本地迁移质量门禁入口，覆盖来源、引用、视觉需求和本地资产路径；`repair` 的 final quality gate 必须和 validate、preview 一起通过。
- 第一批功能等价适配不实现 chart、table、图片裁剪。遇到真实数据图表、表格或图片构图需求时，Codex 在内容层保留语义说明，CLI 基础 `author` 用文本和形状占位表达，不伪装成 native chart、native table 或 image crop。
- 本命令不发布到 Feishu，不返回 `xml_presentation_id`，不创建 `.slides`，不调用 Slides OpenAPI。
- `preview` 只允许 deck slide path 使用 `slides/<file>.svg` 单层本地路径；不要引用远程 URL、上级目录、百分号编码路径或嵌套目录。
- `validate` 的 `ok=false` 表示内容校验失败，但命令仍会输出结构化报告；只有 run-dir 读取或本地写入失败才是命令异常。

## Codex 执行规则

1. 先运行 `status` 或 `next`，确认当前 stage 和缺失产物。
2. 按 `prompts/*.task.md` 填充当前 stage 的输出，不跳 stage 写最终 SVG。
3. 每个 stage 输出就绪后运行 `complete`，让 CLI 校验当前 stage 并推进 `run.json`。
4. 写 `content/slide_content.md` 时为每页补齐 `source_refs` 和 `visuals`；写 `assets/assets_plan.json` 后再落地 `assets/images/*` 本地资产。
5. 当 `outline`、`content`、`visual`、`assets` 已存在时，可运行 `author` 生成包含文本、来源脚注和本地图片的基础 SVG。
6. 生成 SVG 时保持纯 SVG、`viewBox="0 0 960 540"`、可选中文本、无远程资源。
7. 最后运行 `repair`，形成 validate + preview + quality 三门禁和 final receipt；`repair` 只自动处理可由基础 `author` 覆盖的 lint 失败，deck 缺失、JSON 读取失败等问题会通过命令错误、已有 receipt 和 `repair_queue.md` 暴露；`quality` 成功执行后才保证写出 `quality_report.json`。
8. 不要把这个本地工作台描述成完整 12-agent 自动化系统；它是 Codex 协作的分阶段本地 runtime。

## 常见命令

```bash
# 查看下一步该做什么
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo

# 校验当前 stage 并推进
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo

# 基于已完成的 deck/content/visual/assets 生成文本、来源脚注和本地图片 SVG
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
