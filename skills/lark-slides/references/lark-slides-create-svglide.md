# slides +create-svglide

`slides +create-svglide` 是本地 SVGlide SVG Slides 运行目录工作台。第一版只创建和管理本地 run-dir，不创建在线飞书幻灯片，不调用 `slide_engine`，不做 SVG-to-SXSD 发布。

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

`outline`、`content`、`visual`、`assets` 就绪后，再生成基础文本 SVG：

```bash
lark-cli slides +create-svglide --as user --action author --run ./.lark-slides/svglide-runs/demo
```

最终校验和预览：

```bash
lark-cli slides +create-svglide --as user --action repair --run ./.lark-slides/svglide-runs/demo
```

必要时可单独定位校验或预览问题：

```bash
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo
```

`init` 只建立目录、`run.json`、prompt、schema 和 request 产物。Codex 按 `next` 返回的 prompt 填充当前 stage 产物后，用 `complete` 校验并推进 stage。`repair` 会先执行 validate；只有 lint 失败且失败项可由基础 `author` 覆盖修复时才会重新 author，再生成 preview。deck 缺失、JSON 错误等不可自动修复的问题会保留在 `receipts/lint.json` 和 `repair_queue.md`，由 Codex 手动修复后再运行校验。

## Action

| Action | 作用 | 主要产物 |
|--------|------|----------|
| `init` | 创建本地 run-dir | `run.json`、`request/request.json`、`prompts/*.task.md`、`schemas/*.json` |
| `status` | 查看当前 stage、缺失输入/输出和下一条命令 | JSON 状态报告 |
| `next` | 返回当前 stage 的 prompt、输入和输出列表 | JSON task 报告 |
| `complete` | 校验当前 stage 输出并推进到下一 stage | `run.json`、`receipts/<stage>.json` |
| `author` | 基于 deck/content/visual/assets 生成基础文本 SVG | `slides/*.svg`、`receipts/svg_author.json` |
| `validate` | 校验 `outline/deck.json` 中的 `slides/*.svg` | `receipts/lint.json`、`repair_queue.md` |
| `preview` | 生成本地 HTML 预览 | `preview.html`、`receipts/preview.json` |
| `repair` | 执行 validate；仅在 lint 失败且可由基础 author 覆盖修复时重新 author，再 preview | `receipts/validate_preview_repair.json` |

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
- `slides/*.svg`
- `receipts/*.json`
- `repair_queue.md`
- `preview.html`

## 边界

- CLI 负责 run-dir 骨架、prompt/schema、状态检查、SVG lint、repair queue 和 HTML preview。
- Codex 负责自动研究、设计 brief、slide content、资产规划、生图/搜图结果落地、SVG authoring 和修复。
- 第一批功能等价适配不实现 chart、table、图片裁剪。遇到真实数据图表、表格或图片构图需求时，Codex 在内容层保留语义说明，CLI 基础 `author` 用文本和形状占位表达，不伪装成 native chart、native table 或 image crop。
- 本命令不发布到 Feishu，不返回 `xml_presentation_id`，不创建 `.slides`，不调用 Slides OpenAPI。
- `preview` 只允许 deck slide path 使用 `slides/<file>.svg` 单层本地路径；不要引用远程 URL、上级目录、百分号编码路径或嵌套目录。
- `validate` 的 `ok=false` 表示内容校验失败，但命令仍会输出结构化报告；只有 run-dir 读取或本地写入失败才是命令异常。

## Codex 执行规则

1. 先运行 `status` 或 `next`，确认当前 stage 和缺失产物。
2. 按 `prompts/*.task.md` 填充当前 stage 的输出，不跳 stage 写最终 SVG。
3. 每个 stage 输出就绪后运行 `complete`，让 CLI 校验当前 stage 并推进 `run.json`。
4. 当 `outline`、`content`、`visual`、`assets` 已存在时，可运行 `author` 生成基础文本 SVG。
5. 生成 SVG 时保持纯 SVG、`viewBox="0 0 960 540"`、可选中文本、无远程资源。
6. 最后运行 `repair`，形成 validate + preview + final receipt；`repair` 只自动处理可由基础 `author` 覆盖的 lint 失败，deck 缺失、JSON 错误等问题会保留 `receipts/lint.json` / `repair_queue.md` 供 Codex 手动修复。
7. 不要把这个本地工作台描述成完整 12-agent 自动化系统；它是 Codex 协作的分阶段本地 runtime。

## 常见命令

```bash
# 查看下一步该做什么
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo

# 校验当前 stage 并推进
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo

# 基于已完成的 deck/content/visual/assets 生成基础文本 SVG
lark-cli slides +create-svglide --as user --action author --run ./.lark-slides/svglide-runs/demo

# 只做 SVG 协议校验
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo

# 生成本地预览
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo

# 执行 validate，必要时重新 author，再生成 preview
lark-cli slides +create-svglide --as user --action repair --run ./.lark-slides/svglide-runs/demo
```
