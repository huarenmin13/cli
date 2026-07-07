# slides +create-svglide

`slides +create-svglide` 是 AnyGen SVG Slides 的 agent runtime adapter。它不是 Codex-only workbench；Codex 只是 `agent.runtime=codex` 的一种实现，其他 agent 也必须通过同一套 CLI runtime protocol 执行。

本文档只定义 adapter 协议边界、run-dir 结构、receipt、schema、preview、quality、semantic gate 和 delivery receipt。它不复制 AnyGen prompt 正文，不负责创意生成本身，不接入真实图片 provider，不进入 Feishu/SXSD/live-create 链路。若用户请求线上交付但当前 runtime 没有真实 publisher，必须写出 `publish/online_slide.json.status=blocked`，不能用本地 HTML 或截图冒充线上 slide。

## 权威顺序

1. AnyGen reference index：`skills/lark-slides/references/anygen-svg/README.md`
2. AnyGen orchestrator：`skills/lark-slides/references/anygen-svg/mode_system_prompt_svg.md`
3. SVG protocol authority：`skills/lark-slides/references/anygen-svg/svg_reference.md`
4. Semantic contract：`skills/lark-slides/references/anygen-svg/semantic_contract.md`
5. Runtime adapter：`skills/lark-slides/references/lark-slides-create-svglide.md`
6. Go CLI：`internal/svglide/*`

生成语义、角色职责、页面质量、SVG 协议和语义规则实例来自 AnyGen Markdown 资产。Go 只执行稳定的 runtime protocol 和有限的机械 gate。

## AnyGen 编排树

- `mode_system_prompt_svg` 是唯一 orchestrator。
- `svg_reference` 是唯一 protocol authority。
- `resolve_delivery_contract`：required tool prompt，stage=`request_resolution`，把本地预览、线上交付、真实素材要求写入 `request/delivery_contract.json`。
- `resolve_design_brief`：required tool prompt，stage=`design_brief`。
- `slide_outline`：required tool prompt，stage=`outline`。
- `activate_slides_edit` -> `slides_edit`：required tool prompt chain，stage=`svg_author`。
- `finish_slides_edit`：required tool prompt，stage=`validate_preview_repair`，对应最终 validate、preview、quality、semantic gate。
- `publish_online`：required tool prompt，仅当 run 包含 `publish_online` stage 时出现；没有真实 Lark Slides publisher 时必须阻塞。
- `slide_organize`：conditional tool prompt，条件为 outline 创建后的增删页或重排。
- `compute_custom_shape_bbox`：conditional tool prompt，条件为 SVG 含 custom path。
- `generate_vega_lite_chart`：conditional tool prompt，条件为 standard quantitative chart required；agent 写 `assets/charts/chart_briefs.json`、Vega-Lite specs 和 chart manifest。
- Node chart renderer：StageAssets completion 调用的本地确定性 renderer，使用 `vega-lite` + `vega` 将 `assets/charts/specs/*.vl.json` 转成 `assets/charts/*.svg`，并写 `receipts/chart_render.json`。
- `generate_svg_chart`：legacy/reference-only；不是本地 SVG deck 的标准 chart producer。
- `slides_convert`：conditional tool prompt，条件为输入是 PPTX。
- `slides_parse_template`：conditional tool prompt，条件为 PPTX/template 解析链路。

没有独立 tool prompt 的阶段由 `mode_system_prompt_svg` 的章节锚点承载：`research` 对应 Phase 3，`slide_content` 对应 Phase 6，`assets` 图片规划对应 Phase 7 和 `<visuals>`。

## Adapter 边界

adapter 负责：

- 创建和维护本地 run-dir。
- 写入 `request/request.json`、`request/source_manifest.json`、`prompt_manifest.json` 和 `schemas/*.json`。
- 通过 `next` 返回 `agent_task`、`prompt_context`、`tool_invocation_contract`、inputs、outputs 和 `completion_gate`。
- 校验 `receipts/tool_calls/<stage>/`、stage artifact 的 `prompt_contract`、schema、SVG lint、preview、quality、semantic report。
- 在 `repair` 通过后写出 `receipts/delivery.json`。

adapter 不负责：

- 改写 AnyGen prompt 正文或替 agent 做创意判断。
- 自动研究、自动搜图、自动生图或接入真实图片 provider。
- 静默发布到 Feishu、创建 `.slides`、返回 `xml_presentation_id`、调用 `slide_engine`、SXSD 或 Slides OpenAPI。线上交付只能通过显式 `publish_online` stage 记录真实发布结果；无 publisher 时记录 blocked。
- 原生实现 chart、table、图片裁剪；这些需求必须通过 AnyGen 语义和本地 artifact 显式表达。

`author` action 只是诊断和占位能力，用于 smoke、协议调试或缺失 SVG 补齐；它不是 AnyGen authoring 的等价实现。

## Agent Runtime Protocol

标准循环是：

```text
init -> complete(request bootstrap) -> [next -> agent_task -> prompt_context -> tool_calls -> artifact -> complete]* -> next(final gate) -> repair -> complete -> [publish when delivery_target=online_slide|both] -> delivery
```

`init` 只建立 run-dir、请求、manifest 和 schema，并已写好 `request/request.json`、`request/source_manifest.json` 与 `request/delivery_contract.json`。`request` stage 是 bootstrap 校验阶段，不需要 agent 再生成 request 产物。`agent.runtime` 记录执行者，例如 `codex`、`claude`、`cursor`、`fake-agent`；runtime protocol 本身不因 agent 名称改变。

`next` 是每个 stage 的唯一调度入口。agent 必须先调用 `next`，再按 `next.agent_task` 写 tool call receipt 和 stage artifact。`complete` 只接受当前 stage 的产物；跨 stage 复用旧 `prompt_context` 必须 fail-closed。

## Markdown 读取边界

agent 只能以 `next.agent_task.prompt_context.assets` 作为当前 stage 的必读 Markdown 清单。

禁止行为：

- 自行扫描 repo、README、SKILL.md 或 `tools/` 目录来推导当前 stage 应读哪些 AnyGen Markdown。
- 用历史记忆、全局 prompt paths、顶层 legacy `prompt_paths`、未由当前 stage 下发的迁移/归档素材或手工猜测替代当前 `prompt_context.assets`。
- 在 prompt hash 漂移后继续使用旧产物或旧 receipt。

允许行为：

- 按 `prompt_context.assets[*].path` 读取当前 stage 必需 Markdown。
- 用 `prompt_context.assets[*].id`、`role`、`sha256` 写入 prompt context receipt。
- 如果发现 hash 漂移或 asset 缺失，重新调用 `next`，按新的 prompt context 修正产物。

直接读取 Markdown 只是上下文动作。stage 能否完成，由 `complete` 校验 prompt context receipt、tool call receipt、artifact `prompt_contract` 和 stage gate 决定。

## next 输出协议

`next` 返回的 task 至少应表达：

```json
{
  "agent_task": {
    "stage": "svg_author",
    "prompt_context": {
      "read_policy": "read_required_assets_before_authoring",
      "authority": "cli_runtime_protocol",
      "assets": [
        {
          "id": "mode_system_prompt_svg",
          "role": "orchestrator",
          "path": "skills/lark-slides/references/anygen-svg/mode_system_prompt_svg.md",
          "sha256": "...",
          "required": true
        },
        {
          "id": "svg_reference",
          "role": "protocol_reference",
          "path": "skills/lark-slides/references/anygen-svg/svg_reference.md",
          "sha256": "...",
          "required": true
        }
      ]
    },
    "tool_invocation_contract": {
      "required": ["activate_slides_edit", "slides_edit"],
      "conditional": ["compute_custom_shape_bbox"]
    },
    "inputs": ["outline/deck.json", "content/slide_content.json", "assets/assets_plan.json"],
    "outputs": ["slides/*.svg"],
    "completion_gate": ["svg_protocol_valid", "slide_matches_outline_content_assets"]
  }
}
```

`prompt_context` 是 Markdown 读取边界；`tool_invocation_contract` 是 tool prompt 调用边界；`completion_gate` 是 `complete` 的验收边界。三者都来自 CLI runtime，不由 agent 自行推导。

## Tool Call Receipts

每个被调用的 required 或 conditional tool prompt 都必须写入 `receipts/tool_calls/<stage>/<call>.json`。receipt 至少包含：

```json
{
  "stage": "svg_author",
  "prompt_id": "slides_edit",
  "orchestrated_by": "mode_system_prompt_svg",
  "order": 40,
  "cardinality": "once_or_more",
  "prompt_context_receipt": "receipts/prompt_context/svg_author.json",
  "input_artifacts": ["outline/deck.json", "content/slide_content.json", "assets/assets_plan.json"],
  "output_artifacts": ["slides/slide-01.svg"],
  "status": "passed"
}
```

required tool prompt 缺 receipt 时，`complete` 必须失败。conditional tool prompt 只有在条件命中时要求 receipt；条件未命中时，agent 不应伪造空调用。

## Stage Artifacts

每个 stage artifact 必须声明 `prompt_contract`，把产物绑定回本次 `next` 输出：

```json
{
  "prompt_contract": {
    "stage": "svg_author",
    "orchestrator": "mode_system_prompt_svg",
    "protocol_reference": "svg_reference",
    "context_receipt": "receipts/prompt_context/svg_author.json",
    "required_prompt_ids": ["mode_system_prompt_svg", "svg_reference", "slides_edit"]
  }
}
```

缺少 `prompt_contract`、stage 不匹配、orchestrator 不匹配、protocol reference 不匹配，均应 fail-closed。

## 本地 Gate

- `complete` 校验当前 stage 的 prompt context、tool call receipt、artifact contract 和 schema。
- `validate` 校验 SVG protocol。
- `preview` 生成本地 HTML 预览。
- `quality` 校验本地结构和产物链路。
- `repair` 聚合 validate、preview、quality 和 semantic report；只有全部 passed 才通过。
- `semantic_contract.md` 提供 semantic rule 实例；Go 只按稳定 `kind` 执行。

`preview` 只允许 deck slide path 使用 `slides/<file>.svg` 单层本地路径；不要引用远程 URL、上级目录、百分号编码路径或嵌套目录。`validate` 的 `ok=false` 表示内容校验失败，但命令仍会输出结构化报告；只有 run-dir 读取或本地写入失败才是命令异常。

## Final Delivery

`repair` passed 后必须写出 `receipts/delivery.json`。delivery receipt 至少应能指向：

- `request/delivery_contract.json` 中的目标。
- run-dir。
- `slides/*.svg`。
- `publish/online_slide.json`，当 `delivery_target=online_slide|both` 时必须存在且 `status=passed`。
- `preview.html`。
- `receipts/lint.json`、`receipts/preview.json`、`quality_report.json`、`anygen_semantic_report.json`。

agent 的最终回复必须返回可追踪 artifact 路径和报告状态，不允许只总结流程。

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
- `slides/*.svg`
- `receipts/prompt_context/<stage>.json`
- `receipts/tool_calls/<stage>/*.json`
- `receipts/delivery.json`
- `quality_report.json`
- `anygen_semantic_report.json`
- `repair_queue.md`
- `preview.html`

## 常见命令

topic-only 初始化，并显式声明 agent runtime：

```bash
lark-cli slides +create-svglide \
  --as user \
  --action init \
  --title "电影介绍" \
  --topic "介绍《给阿嬷的情书》这部电影" \
  --language zh \
  --agent-runtime fake-agent \
  --out ./.lark-slides/svglide-runs/dear-you-film-intro
```

带本地输入初始化：

```bash
lark-cli slides +create-svglide \
  --as user \
  --action init \
  --title "Demo" \
  --input ./source.md \
  --audience "产品负责人" \
  --delivery-mode self_read \
  --pages 8 \
  --agent-runtime codex \
  --out ./.lark-slides/svglide-runs/demo
```

初始化后先推进 bootstrap request stage；它只校验 `init` 已写好的 request 产物：

```bash
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo
```

普通 agent stage 按 runtime protocol 循环推进：

```bash
lark-cli slides +create-svglide --as user --action status --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
# agent 按 next.agent_task.prompt_context.assets 读取 Markdown，写 receipt 和当前 stage artifact
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo
```

最终 gate stage 先取一次 final task，再运行 `repair` 生成 validate、preview、quality、semantic 和 delivery receipt，最后 `complete`：

```bash
lark-cli slides +create-svglide --as user --action next --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action repair --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action complete --run ./.lark-slides/svglide-runs/demo
```

单独定位本地 gate：

```bash
lark-cli slides +create-svglide --as user --action validate --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action preview --run ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide --as user --action quality --run ./.lark-slides/svglide-runs/demo
```
