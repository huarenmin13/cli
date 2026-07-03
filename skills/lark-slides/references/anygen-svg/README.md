# AnyGen SVG Prompt Assets

本目录保存从 AnyGen Slides SVG Prompt 迁移来的 prompt/reference 资产。它们是 `slides +create-svglide` 生成语义的权威来源。

## Source Snapshot

- `docs/vendor/anygen-svg/source.full.md`
- `docs/vendor/anygen-svg/source.outline.md`
- `docs/vendor/anygen-svg/source.meta.json`

## Authority

当本目录的 prompt/reference 与 SVGlide adapter 文档或 Go CLI 行为描述冲突时：

1. 设计语义、角色职责、页面质量、SVG 协议要求，以本目录 md 为准。
2. 本地目录、action、receipt、preview、schema 等机械行为，以 `lark-slides-create-svglide.md` 和 Go CLI 为准。
3. Go 不补写 AnyGen 规则，只负责把本目录文件暴露给 Codex runtime。

## Entry Files

- `mode_system_prompt_svg.md`: SVG Slides 模式的系统级生成要求。
- `svg_reference.md`: SVG 协议、元素、角色和约束的权威参考。

## Tool Prompts

- `tools/resolve_design_brief.md`: design brief resolution。
- `tools/slide_outline.md`: deck outline planning。
- `tools/slide_organize.md`: slide organization。
- `tools/activate_slides_edit.md`: slide edit session activation。
- `tools/slides_edit.md`: slide authoring/editing。
- `tools/finish_slides_edit.md`: finishing and validation。
- `tools/compute_custom_shape_bbox.md`: custom shape bbox calculation。
- `tools/generate_svg_chart.md`: chart generation prompt asset; current SVGlide phase keeps native chart implementation deferred.
- `tools/slides_convert.md`: conversion helper prompt.
- `tools/slides_parse_template.md`: template parsing prompt.

## SVGlide Runtime Use

`slides +create-svglide --action next` must surface relevant paths from this directory. Codex reads these md files first, then uses the local adapter only to understand where artifacts should be written in the run directory.
