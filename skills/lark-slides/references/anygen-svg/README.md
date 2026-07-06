---
id: anygen_svg_readme
role: reference_index
invocation: reference
stage: all
order: 0
cardinality: once
condition: always
trigger:
  - asset_index_lookup
consumes:
  - prompt_manifest.json
produces:
  - prompt_context_assets_index
completion_gate:
  - prompt_assets_indexed
---

# AnyGen SVG Prompt Assets

本目录保存从 AnyGen Slides SVG Prompt 迁移来的 prompt/reference 资产。它们是 `slides +create-svglide` 生成语义的权威来源。

## Source Snapshot

- `docs/vendor/anygen-svg/source.full.md`
- `docs/vendor/anygen-svg/source.outline.md`
- `docs/vendor/anygen-svg/source.meta.json`

这些文件只用于迁移 provenance、人工审计和 `prompt_manifest.json` hash 追踪。它们不是每个 stage 的必读 prompt；agent 不应绕过 `next.agent_task.prompt_context.assets` 去读取完整 source snapshot。

## Authority

当本目录的 prompt/reference 与 SVGlide adapter 文档或 Go CLI 行为描述冲突时：

1. 设计语义、角色职责、页面质量、SVG 协议要求，以本目录 md 为准。
2. 本地目录、action、receipt、preview、schema 等机械行为，以 `lark-slides-create-svglide.md` 和 Go CLI 为准。
3. Go 不补写 AnyGen 规则，只负责把本目录文件通过 CLI runtime protocol 暴露给任意 agent。

## Entry Files

- `mode_system_prompt_svg.md`: SVG Slides 模式的系统级生成要求。
- `svg_reference.md`: SVG 协议、元素、角色和约束的权威参考。
- `semantic_contract.md`: 本地 semantic gate 使用的机器可读规则实例。

## Tool Prompts

- `tools/resolve_design_brief.md`: design brief resolution。
- `tools/slide_outline.md`: deck outline planning。
- `tools/slide_organize.md`: slide organization。
- `tools/activate_slides_edit.md`: slide edit session activation。
- `tools/slides_edit.md`: slide authoring/editing。
- `tools/finish_slides_edit.md`: final finishing and validation gate。
- `tools/compute_custom_shape_bbox.md`: custom shape bbox calculation。
- `tools/generate_vega_lite_chart.md`: standard chart spec prompt; Node renderer owns SVG output.
- `tools/generate_svg_chart.md`: legacy/reference-only chart prompt; not a standard local SVG deck chart producer.
- `tools/slides_convert.md`: conversion helper prompt.
- `tools/slides_parse_template.md`: template parsing prompt.

## SVGlide Runtime Use

`slides +create-svglide --action next` must surface relevant paths from this directory through `next.agent_task.prompt_context.assets`.

Agent 只能把 `next.agent_task.prompt_context.assets` 作为当前 stage 的必读 Markdown 清单。不要自行扫描 repo、README、SKILL.md 或 tools 目录来推导执行链；直接读取 Markdown 只是上下文动作，stage 能否完成由 `complete` 的 receipt 和 gate 判定。

每个 asset entry 至少应表达 `id`、`role`、`path`、`sha256` 和 `required`。当 prompt hash 漂移时，agent 必须重新调用 `next`，按新的 prompt context 修正产物。顶层 legacy `prompt_paths` 不是读取入口。

## Invocation Roles

- `anygen_source_full`: source snapshot，只作为 AnyGen 原始语义快照和 manifest provenance，不作为 stage prompt context asset。
- `mode_system_prompt_svg`: 唯一 orchestrator，负责组织阶段和工具关系。
- `svg_reference`: 唯一 protocol authority，负责 SVG 协议和设计规范。
- `tools/*.md`: tool prompt，由 `mode_system_prompt_svg` 编排。
- `anygen_semantic_contract`: semantic contract，提供可由 Go 执行的稳定规则实例。
