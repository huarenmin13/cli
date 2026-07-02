# `slides +create-svglide` Codex Runtime Design

Date: 2026-07-02
Branch: `feat-svglide-07`
Scope: first local-only version of `lark-cli slides +create-svglide`

## Result

Build `slides +create-svglide` as a staged local runtime for AnyGen SVG Slides. The command creates and manages a run directory that Codex can fill with generated content, assets, and SVG slides. The CLI owns state, prompts, schemas, validation, preview, receipts, and recovery. Codex owns LLM reasoning, web research, image/search execution, chart design, and SVG authoring.

The first version does not publish to Feishu Slides. It must produce a local, inspectable SVG deck workbench.

## Context

`feat-svglide-07` currently starts from the latest `origin/main` and has only the existing Slides XML shortcut surface. There is no current `+create-svglide` implementation on this branch.

The AnyGen SVG Slides prompt should be reused as contracts and workflow rules, not pasted as one large prompt. Its value is split across request interpretation, research, design brief, outline, `slide_content.md`, asset planning, SVG authoring, protocol validation, preview, and repair.

## Goals

- Add a staged `slides +create-svglide` command group.
- Create a local run directory under a user-specified `--out` path, usually `.lark-slides/svglide-runs/<run-id>`.
- Generate prompt task files that tell Codex exactly what to produce for each stage.
- Generate JSON schemas for stage outputs.
- Track stage state in `run.json`.
- Validate JSON outputs, SVG protocol basics, asset href existence, slide count, placeholder slides, and preview generation.
- Generate `preview.html` for local inspection.
- Write receipts and `repair_queue.md` so failed runs can resume from the current stage.

## Non-Goals

- No online Feishu Slides creation.
- No `slide_engine` or `slide` server changes.
- No SVG-to-SXSD conversion.
- No built-in model API provider.
- No built-in web search, image generation, or image search client.
- No complete 12-agent process runner.
- No PPTX import/edit workflow.

## Command Surface

```bash
lark-cli slides +create-svglide init --title "Demo" --input ./source.md --audience "..." --delivery-mode self_read --pages 8 --out ./.lark-slides/svglide-runs/demo
lark-cli slides +create-svglide next <run-dir>
lark-cli slides +create-svglide status <run-dir>
lark-cli slides +create-svglide validate <run-dir>
lark-cli slides +create-svglide preview <run-dir>
```

`init` creates the run directory, writes the initial request files, schemas, stage prompts, and `run.json`.

`next` reads `run.json`, finds the next stage, verifies required inputs, renders or refreshes that stage's Codex task prompt, and reports the exact files Codex must create. It must not pretend LLM work is complete.

`status` checks declared outputs and receipts for each stage, then prints the current stage, missing files, and next useful command.

`validate` runs deterministic checks and writes validation receipts.

`preview` writes `preview.html` from `outline/deck.json` and `slides/*.svg`.

## Run Directory Contract

```text
<run-dir>/
  run.json
  README.md
  request/request.json
  request/source_manifest.json
  research/research_notes.md
  research/sources.json
  brief/design_brief.json
  brief/visual_system.json
  outline/deck.json
  content/slide_content.md
  content/slide_content.json
  assets/assets_plan.json
  assets/images/
  assets/charts/
  slides/*.svg
  prompts/*.task.md
  schemas/*.schema.json
  receipts/*.json
  receipts/generation_summary.md
  repair_queue.md
  preview.html
```

The run directory is local agent state. It should not be committed by default.

## State Model

`run.json` stores:

- version
- runtime, always `codex` in v1
- command name
- title
- created and updated timestamps
- current stage
- stage list with status, inputs, outputs, and receipt path
- important artifact paths
- policy flags: `publish_enabled=false`, `network_by_codex=true`, `image_generation_by_codex=true`, `overwrite=false`

Stage statuses:

```text
pending
ready
in_progress
done
failed
blocked
needs_repair
```

## Stage Design

### 1. request

Role: Request Interpreter

Input: CLI flags and local source path.

Output: `request/request.json`, `request/source_manifest.json`.

Validation: title, audience, delivery mode, page count, and source references must be explicit or marked missing.

### 2. research

Role: Researcher

Input: request files and source files.

Output: `research/research_notes.md`, `research/sources.json`.

Validation: key facts need source references. Codex may perform web research, but the CLI only validates resulting files.

### 3. design_brief

Role: Design Brief Resolver and Visual System Planner

Input: request and research outputs.

Output: `brief/design_brief.json`, `brief/visual_system.json`.

Validation: narrative spine, depth, tone, and visual system dimensions must be present.

### 4. outline

Role: Outline Planner

Input: design brief.

Output: `outline/deck.json`.

Validation: page count matches request; each slide has id, title, summary, role, and key message.

### 5. slide_content

Role: Content Builder

Input: deck outline and research notes.

Output: `content/slide_content.md`, `content/slide_content.json`.

Validation: every slide has key material, content blocks, and source notes. This is content planning, not final layout.

### 6. assets

Role: Asset Planner and Chart Generator

Input: slide content and visual system.

Output: `assets/assets_plan.json`, optional `assets/images/*`, optional `assets/charts/*.svg`.

Validation: every planned asset has purpose plus either a local path or a fallback. Chart takeaway must be written before chart type.

### 7. svg_author

Role: SVG Author

Input: deck, slide content, visual system, and assets.

Output: `slides/*.svg`.

Validation: each slide must contain more than a background. Each slide needs a background, title, visible content or visual element, semantic id, and valid SVG root.

### 8. validate_preview_repair

Role: Protocol Validator, Preview Agent, and Repair Agent

Input: generated slides.

Output: `receipts/lint.json`, `receipts/preview.json`, `repair_queue.md`, `preview.html`.

Validation: SVG protocol lint, local href checks, slide count match, preview write success, and unresolved issues recorded in the repair queue.

## Code Layout

```text
shortcuts/slides/
  slides_create_svglide.go
  slides_create_svglide_test.go

internal/svglide/
  run.go
  init.go
  stage.go
  prompt.go
  schema.go
  validate.go
  preview.go
  receipt.go
```

The shortcut package should stay thin. State, prompt rendering, validation, and preview logic belong in `internal/svglide` so they can be tested without a Cobra/runtime-heavy command harness.

## Skill Documentation

Update `skills/lark-slides/SKILL.md` and add a focused reference file for the local SVG runtime. The skill should explain that `+create-svglide` is local-only in v1, requires Codex to fill stage outputs, and must not be described as an online publish path.

## Error Handling

- Missing required inputs block the stage and write a receipt.
- Invalid JSON or schema mismatch marks the stage failed.
- Invalid SVG marks `needs_repair` and writes `repair_queue.md`.
- Existing output paths are not overwritten unless an explicit overwrite policy is enabled.
- Partially completed stages remain inspectable; reruns resume from the current stage.

## Tests

Unit tests:

- `init` creates the expected directory tree and `run.json`.
- `init` refuses to overwrite an existing run directory by default.
- `status` identifies missing outputs.
- `next` renders the correct stage prompt and does not mark Codex-only stages done.
- `validate` catches invalid SVG, missing hrefs, placeholder slides, and slide count mismatch.
- `preview` writes HTML that references generated SVG files.

Fixtures:

- `testdata/svglide_run_valid/`
- `testdata/svglide_run_invalid/`

No live end-to-end test is required for v1 because this version does not call Feishu APIs.

## Acceptance Criteria

- A user can initialize a run directory from local input.
- Codex can follow generated task prompts stage by stage.
- The CLI can report status and missing artifacts.
- The CLI can validate a completed local SVG deck.
- The CLI can generate local preview HTML.
- Failed validation produces actionable repair output.
- No online presentation is created.

## Further Judgment

This design deliberately optimizes for artifact contracts rather than agent-count symmetry. Once the local runtime is stable, individual stages can be split into fuller agents without changing the run directory contract.
