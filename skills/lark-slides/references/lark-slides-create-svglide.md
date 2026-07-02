# slides +create-svglide

`slides +create-svglide` 是本地 SVGlide SVG Slides 运行目录工作台。第一版只创建和管理本地 run-dir，不创建在线飞书幻灯片，不调用 `slide_engine`，不做 SVG-to-SXSD 发布。

## 推荐流程

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

lark-cli slides +create-svglide --as user --action status --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo
```

`init` 只建立目录、`run.json`、prompt、schema 和 request 产物。后续研究、设计 brief、内容、资产、SVG authoring 和 repair 由 Codex 按 `next` 返回的 prompt 执行。

## Action

| Action | 作用 | 主要产物 |
|--------|------|----------|
| `init` | 创建本地 run-dir | `run.json`、`request/request.json`、`prompts/*.task.md`、`schemas/*.json` |
| `status` | 查看当前 stage、缺失输入/输出和下一条命令 | JSON 状态报告 |
| `next` | 返回当前 stage 的 prompt、输入和输出列表 | JSON task 报告 |
| `validate` | 校验 `outline/deck.json` 中的 `slides/*.svg` | `receipts/lint.json`、`repair_queue.md` |
| `preview` | 生成本地 HTML 预览 | `preview.html`、`receipts/preview.json` |

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
- 本命令不发布到 Feishu，不返回 `xml_presentation_id`，不创建 `.slides`，不调用 Slides OpenAPI。
- `preview` 只允许 deck slide path 使用 `slides/<file>.svg` 单层本地路径；不要引用远程 URL、上级目录、百分号编码路径或嵌套目录。
- `validate` 的 `ok=false` 表示内容校验失败，但命令仍会输出结构化报告；只有 run-dir 读取或本地写入失败才是命令异常。

## Codex 执行规则

1. 先运行 `status` 或 `next`，确认当前 stage 和缺失产物。
2. 按 `prompts/*.task.md` 填充当前 stage 的输出，不跳 stage 写最终 SVG。
3. 生成 SVG 时保持纯 SVG、`viewBox="0 0 960 540"`、可选中文本、无远程资源。
4. 先运行 `validate`，如果 `repair_queue.md` 有问题，修复后再次 validate。
5. 再运行 `preview`，检查 `preview.html` 不是白屏，并确认每页都来自 `slides/*.svg`。
6. 不要把这个本地工作台描述成完整 12-agent 自动化系统；它是 Codex 协作的分阶段本地 runtime。

## 常见命令

```bash
# 查看下一步该做什么
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo

# 只做 SVG 协议校验
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo

# 生成本地预览
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo
```
