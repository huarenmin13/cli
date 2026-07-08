# SVG Slides Local Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 SVG Slides 的本地生成与校验闭环，产出可被后续 `slides +create-svglide` 发布层消费的 local publish-ready bundle，但不实现真实发布。

**Architecture:** 生成层和校验层放在 `skills/lark-slides` 内：`references/svg-slides/source/full.debranded.md` 原样保存去品牌 prompt，`source/split-manifest.json` 记录原文 section 到拆分文档的映射，所有拆分文档通过 `## Source Coverage` 明确声明覆盖哪些原文 section。`references/svg-slides/` 保存 coverage-preserving rewrite 后的协议规则、authoring 规则、workflow、校验说明和最小样例；`scripts/` 提供静态协议 validator、bundle manifest 生成器、source coverage 检查器和可选浏览器文本边界检查。发布层保持隔离：本计划不新增 `slides +create-svglide` Go shortcut，不定义 live endpoint，不声明后端已接受 SVG payload。

**Tech Stack:** Markdown skill references, Node.js >=16 ESM scripts, `node --test`, `xmllint` when available, optional Playwright for local browser QA, existing `skills/lark-slides` skill layout.

## Global Constraints

- 所有新增长期文档必须放在 `skills/lark-slides/references/`；`docs/` 被 `.gitignore` 忽略，不作为交付位置。
- 只处理生成层和校验层；不新增或修改 `shortcuts/slides/*create_svglide*` Go 代码。
- `source/full.debranded.md` 必须是去品牌原文的字节级快照；拆分文档可以重组表达，但不能把原文中的规范、约束、流程门禁、工具语义摘要到不可执行。
- 每个 `references/svg-slides/*.md` 拆分文档都必须包含 `## Source Coverage` 小节，列出覆盖的 `split-manifest.json` section id。
- `split-manifest.json` 中每个 section id 必须被且只被一个拆分文档的 `## Source Coverage` 声明覆盖；允许 `README.md` 只覆盖 `title` 并承担路由职责。
- SVG Slides 画布固定为 `viewBox="0 0 960 540"`；它与现有 Lark Slides XML 共用 960x540 尺寸，但协议仍是 `slide:*` SVG，不是 SML XML。
- 每页必须是独立 `<svg slide:role="slide" xmlns:slide="https://slides.bytedance.com/ns">` 文件。
- 颜色只允许 `rgb(...)`、`rgba(...)`、`url(#id)`；禁止 hex、named color、`none` 作为 `fill` / `stroke` 值。
- 文本使用 `foreignObject slide:role="shape" slide:shape-type="text"`；直接子节点只允许 `p`、`ul`、`ol`、`h1`、`h2`、`h3`、`small`。
- 禁止 `<style>`、`class=`、`<div>`、`<section>`、SVG `<marker>`、SVG `<text>`。
- 本地 bundle 可以声明 `publish_ready=true`，但不能声明 `published=true`。
- 不新增 npm 依赖；浏览器 QA 脚本用动态导入 `playwright`，未安装时明确退出 2。

---

## File Structure

- Create `skills/lark-slides/references/svg-slides/README.md`: SVG Slides 文档族入口和按场景读取路线。
- Create `skills/lark-slides/references/svg-slides/source/full.debranded.md`: 去品牌原文快照。
- Create `skills/lark-slides/references/svg-slides/source/split-manifest.json`: 原文行号到拆分文件的映射。
- Create `skills/lark-slides/references/svg-slides/workflow.md`: 生成层阶段，覆盖 goal/audience/delivery、research、design brief、outline、slide_content、SVG authoring。
- Create `skills/lark-slides/references/svg-slides/protocol.md`: 硬协议规则。
- Create `skills/lark-slides/references/svg-slides/authoring-rules.md`: 写 SVG 时的禁止项、文本、颜色、group、image、chart 写法。
- Create `skills/lark-slides/references/svg-slides/design-brief.md`: `narrative_spine`、`depth`、`tone`、`visual_system` 的生成层职责。
- Create `skills/lark-slides/references/svg-slides/visual-design.md`: typography、layout freedom、视觉质量 bar。
- Create `skills/lark-slides/references/svg-slides/chart-workflow.md`: chart 生成和嵌入规则。
- Create `skills/lark-slides/references/svg-slides/editing-existing-decks.md`: 转换/续写已有 deck 的规则。
- Create `skills/lark-slides/references/svg-slides/validation.md`: 静态 validator、浏览器文本边界、bundle 判定。
- Create `skills/lark-slides/references/svg-slides/examples/minimal-slide.svg`: 最小合规页。
- Create `skills/lark-slides/references/svg-slides/examples/group-card.svg`: group + shape + text 样例。
- Create `skills/lark-slides/references/svg-slides/examples/chart-embed.svg`: chart 引用样例。
- Create `skills/lark-slides/scripts/validate_svg_deck.mjs`: 静态 SVG Slides 协议 validator。
- Create `skills/lark-slides/scripts/validate_svg_deck_test.mjs`: validator 单元测试。
- Create `skills/lark-slides/scripts/svg_slides_bundle.mjs`: manifest/receipt 生成器。
- Create `skills/lark-slides/scripts/svg_slides_bundle_test.mjs`: bundle 生成器测试。
- Create `skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs`: 检查 `split-manifest.json` 和拆分文档 `## Source Coverage` 是否一一对应。
- Create `skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs`: source coverage 检查器测试。
- Create `skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs`: 可选浏览器文本边界检查。
- Modify `skills/lark-slides/SKILL.md`: 加入 SVG Slides 本地生成与校验入口。
- Modify `skills/lark-slides/references/create-svglide-implementation-plan.zh.md`: 标注发布层计划依赖后端合同，先执行本计划。

---

### Task 1: Source Snapshot And Split Manifest

**Files:**
- Create: `skills/lark-slides/references/svg-slides/source/full.debranded.md`
- Create: `skills/lark-slides/references/svg-slides/source/split-manifest.json`

**Interfaces:**
- Consumes: `/Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/lark_doc_KnCLd7xr5ohWONxhKsncZ3Lxnvd/full.debranded.md`
- Produces: stable source snapshot and line mapping for all later reference docs

- [ ] **Step 1: Create the source directory**

Run:

```bash
mkdir -p skills/lark-slides/references/svg-slides/source
```

Expected result:

```text
skills/lark-slides/references/svg-slides/source exists
```

- [ ] **Step 2: Copy the debranded source snapshot**

Run:

```bash
cp /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/lark_doc_KnCLd7xr5ohWONxhKsncZ3Lxnvd/full.debranded.md \
  skills/lark-slides/references/svg-slides/source/full.debranded.md
```

Expected result:

```text
skills/lark-slides/references/svg-slides/source/full.debranded.md exists
```

- [ ] **Step 3: Write the split manifest**

Create `skills/lark-slides/references/svg-slides/source/split-manifest.json` with:

```json
{
  "version": "svg-slides.split-manifest.v1",
  "source": "skills/lark-slides/references/svg-slides/source/full.debranded.md",
  "source_export": "/Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/lark_doc_KnCLd7xr5ohWONxhKsncZ3Lxnvd/full.debranded.md",
  "source_role": "provenance_and_coverage_authority_not_default_runtime_context",
  "sections": [
    {"id": "title", "lines": [1, 1], "target": "README.md"},
    {"id": "system_prompt_workflow", "lines": [3, 196], "target": "workflow.md"},
    {"id": "svg_reference", "lines": [198, 865], "target": "protocol.md"},
    {"id": "resolve_design_brief", "lines": [867, 1080], "target": "design-brief.md"},
    {"id": "deck_design_reference_catalog", "lines": [1082, 1234], "target": "visual-design.md"},
    {"id": "slide_outline_tool", "lines": [1236, 1254], "target": "workflow.md"},
    {"id": "activate_slides_edit_tool", "lines": [1256, 1262], "target": "workflow.md"},
    {"id": "slides_edit_tool", "lines": [1264, 1281], "target": "authoring-rules.md"},
    {"id": "svg_document_rules", "lines": [1283, 1287], "target": "protocol.md"},
    {"id": "image_usage", "lines": [1289, 1291], "target": "authoring-rules.md"},
    {"id": "incremental_processing", "lines": [1293, 1331], "target": "workflow.md"},
    {"id": "finish_slides_edit_tool", "lines": [1333, 1339], "target": "validation.md"},
    {"id": "slide_organize_tool", "lines": [1341, 1347], "target": "editing-existing-decks.md"},
    {"id": "compute_custom_shape_bbox_tool", "lines": [1349, 1355], "target": "authoring-rules.md"},
    {"id": "generate_svg_chart_tool", "lines": [1357, 2356], "target": "chart-workflow.md"},
    {"id": "slides_convert_tool", "lines": [2358, 2395], "target": "editing-existing-decks.md"},
    {"id": "slides_parse_template_tool", "lines": [2397, 2420], "target": "editing-existing-decks.md"}
  ]
}
```

- [ ] **Step 4: Verify snapshot integrity**

Run:

```bash
cmp -s \
  /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/lark_doc_KnCLd7xr5ohWONxhKsncZ3Lxnvd/full.debranded.md \
  skills/lark-slides/references/svg-slides/source/full.debranded.md
if rg -n "AnyGen" skills/lark-slides/references/svg-slides/source/full.debranded.md; then
  echo "unexpected branded token in debranded source" >&2
  exit 1
fi
node -e 'const fs=require("fs"); JSON.parse(fs.readFileSync("skills/lark-slides/references/svg-slides/source/split-manifest.json","utf8")); console.log("manifest ok")'
```

Expected result:

```text
cmp exits 0
branded token check prints no matches
manifest ok
```

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add skills/lark-slides/references/svg-slides/source/full.debranded.md \
  skills/lark-slides/references/svg-slides/source/split-manifest.json
git commit -m "docs: add svg slides source snapshot"
```

---

### Task 2: Reference Family For Generation Workers

**Files:**
- Create: `skills/lark-slides/references/svg-slides/README.md`
- Create: `skills/lark-slides/references/svg-slides/workflow.md`
- Create: `skills/lark-slides/references/svg-slides/protocol.md`
- Create: `skills/lark-slides/references/svg-slides/authoring-rules.md`
- Create: `skills/lark-slides/references/svg-slides/design-brief.md`
- Create: `skills/lark-slides/references/svg-slides/visual-design.md`
- Create: `skills/lark-slides/references/svg-slides/chart-workflow.md`
- Create: `skills/lark-slides/references/svg-slides/editing-existing-decks.md`
- Create: `skills/lark-slides/references/svg-slides/validation.md`
- Create: `skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs`
- Create: `skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs`

**Interfaces:**
- Consumes: `source/full.debranded.md`, `source/split-manifest.json`, `outputs/fullmd_understanding_proof/fullmd_compliance_matrix.md`, `outputs/fullmd_understanding_proof/understanding_report.md`
- Produces: agent-readable, scenario-routed reference docs and a reusable source coverage checker

- [ ] **Step 1: Write the README routing table**

Create `skills/lark-slides/references/svg-slides/README.md` with these sections:

```markdown
# SVG Slides Local Generation

This reference family is for local SVG Slides generation and validation.

It is not the Lark Slides XML/SXSD workflow and it is not the publish shortcut.

## Read Routes

| Task | Read first | Then read |
|---|---|---|
| Generate a new SVG deck | `workflow.md` | `design-brief.md`, `protocol.md`, `authoring-rules.md`, `visual-design.md`, `validation.md` |
| Repair protocol failures | `validation.md` | `protocol.md`, `authoring-rules.md` |
| Improve visual quality | `visual-design.md` | `design-brief.md`, `workflow.md` |
| Use charts | `chart-workflow.md` | `protocol.md`, `validation.md` |
| Continue an existing deck | `editing-existing-decks.md` | `workflow.md`, `protocol.md` |
| Audit provenance | `source/split-manifest.json` | `source/full.debranded.md` |

## Boundary

Generation and validation produce a local publish-ready bundle.

Publishing that bundle to Lark Slides belongs to `slides +create-svglide` and is intentionally outside this reference family.

## Required Local Gates

1. `node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir> --json`
2. `node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title "<title>"`
3. Browser text-boundary check when Playwright is available.

## Source Coverage

- Covers manifest sections: title
- Coverage mode: routing entry; source text is preserved in `source/full.debranded.md`, while this file points workers to the coverage-preserving split docs.
```

- [ ] **Step 2: Write `workflow.md`**

Create `workflow.md` with these exact top-level headings:

```markdown
# SVG Slides Workflow

## Layer Boundary

## Phase 1: Understand Request

## Phase 2: Settle Goal Audience Delivery

## Phase 3: Build Source Material

## Phase 4: Resolve Design Brief

## Phase 5: Confirm Outline

## Phase 6: Write slide_content

## Phase 7: Lock Visual Direction And Plan Visuals

## Phase 8: Author SVG Pages

## Output Bundle

## Source Coverage

- Covers manifest sections: system_prompt_workflow, slide_outline_tool, activate_slides_edit_tool, incremental_processing
- Coverage mode: preserve workflow semantics from the source while replacing product-specific tool names with local generation stages.
```

Content requirements:

- State that the output bundle is local and not published.
- State that broad topic-only requests require full source material, not snippets or memory-only drafting.
- State that `design_brief` drives outline, density, tone, and `visual_system`.
- State that `slide_content` records claims/data/source references but not final page wording.
- State that `## Source Coverage` is a coverage claim, not a summary marker: all constraints from the listed manifest sections must remain actionable in this file or be explicitly routed to another split file.

- [ ] **Step 3: Write `protocol.md`**

Create `protocol.md` with these exact rules:

```markdown
# SVG Slides Protocol

## Canvas

- Each page is one standalone SVG file.
- Root must contain `xmlns="http://www.w3.org/2000/svg"`.
- Root must contain `xmlns:slide="https://slides.bytedance.com/ns"`.
- Root must contain `slide:role="slide"`.
- Root must contain an `id`.
- Root must contain `viewBox="0 0 960 540"`.

## Background

- Exactly one rendered background is required.
- Optional `<defs>` may appear first.
- The first rendered child after optional `<defs>` must be a `<rect>` or `<image>` with `slide:role="background"`.

## Text

- Text uses `foreignObject slide:role="shape" slide:shape-type="text"`.
- Text `foreignObject` needs numeric `x`, `y`, `width`, and `height`.
- The first direct XHTML child must be `p`, `ul`, `ol`, `h1`, `h2`, `h3`, or `small`.
- Text style belongs in `style`.
- `font-size` must include `px`.
- Text color must be `rgb(...)` or `rgba(...)`.

## Shapes And Groups

- Geometry needs `slide:role="shape"` and a meaningful `slide:shape-type`.
- Multi-element cards use `<g slide:role="group">`.
- Children inside a group still keep their own `slide:role`.

## Lines

- Lines use `<line slide:role="shape" slide:shape-type="line">`.
- Arrows use `slide:start-arrow` or `slide:end-arrow`.
- SVG marker arrows are forbidden.

## Colors

- Use `rgb(...)`, `rgba(...)`, or `url(#id)`.
- Do not use hex colors.
- Do not use named colors.
- Do not use `none` for `fill` or `stroke`; use `rgba(0,0,0,0)` for transparent fills.

## Source Coverage

- Covers manifest sections: svg_reference, svg_document_rules
- Coverage mode: preserve hard SVG protocol requirements from the source while applying the CLI canvas adaptation to 960x540; visual guidance belongs in `visual-design.md`, not here.
```

- [ ] **Step 4: Write the remaining reference docs**

Write the remaining files with these headings:

```markdown
# SVG Slides Authoring Rules

## Required Authoring Pattern
## Forbidden Constructs
## Text Boxes
## Image Elements
## Chart Embeds
## Custom Paths
## Grouped Cards
## Source Coverage

- Covers manifest sections: slides_edit_tool, image_usage, compute_custom_shape_bbox_tool
- Coverage mode: preserve authoring constraints and tool semantics that affect generated SVG structure.
```

```markdown
# SVG Slides Design Brief

## Inputs
## Output Contract
## narrative_spine
## depth
## tone
## visual_system
## How It Drives Generation
## Source Coverage

- Covers manifest sections: resolve_design_brief
- Coverage mode: preserve design brief inputs, output contract, and downstream influence on outline and page authoring.
```

```markdown
# SVG Slides Visual Design

## Typography
## Layout Freedom
## Visual Differentiation
## Density
## Anti-Patterns
## Remaining Human Judgment
## Source Coverage

- Covers manifest sections: deck_design_reference_catalog
- Coverage mode: preserve visual quality rules and examples as generation guidance; do not collapse them into generic style advice.
```

```markdown
# SVG Slides Chart Workflow

## When To Use A Chart
## When Not To Use A Chart
## Chart Sidecar Contract
## Embed Contract
## Validation Notes
## Source Coverage

- Covers manifest sections: generate_svg_chart_tool
- Coverage mode: preserve chart generation, data contract, rendering constraints, and validation expectations.
```

```markdown
# SVG Slides Editing Existing Decks

## Continue Existing Deck
## Preserve Existing Pages
## Add Or Delete Pages
## Template Reference Boundary
## PPTX Conversion Boundary
## Source Coverage

- Covers manifest sections: slide_organize_tool, slides_convert_tool, slides_parse_template_tool
- Coverage mode: preserve existing-deck continuation, conversion, and template parsing boundaries without turning them into publish behavior.
```

```markdown
# SVG Slides Validation

## Static Protocol Validator
## Browser Text Boundary Check
## Bundle Manifest
## Receipt Requirements
## What Passing Validation Does Not Prove
## Source Coverage

- Covers manifest sections: finish_slides_edit_tool
- Coverage mode: preserve finish/validation gates and explicitly separate protocol pass from visual quality pass.
```

- [ ] **Step 5: Add the source coverage checker**

Create `skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs`:

```js
#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootArg = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[1] && arg !== process.argv[0]);
const root = path.resolve(rootArg || "skills/lark-slides/references/svg-slides");
const json = process.argv.includes("--json");
const manifestPath = path.join(root, "source", "split-manifest.json");

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function coverageBlock(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "## Source Coverage");
  if (start === -1) return "";
  const block = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,2}\s+/.test(lines[i])) break;
    block.push(lines[i]);
  }
  return block.join("\n");
}

function coverageIds(block) {
  const match = block.match(/^- Covers manifest sections:\s*(.+)$/m);
  if (!match) return [];
  return match[1].split(",").map((value) => value.trim()).filter(Boolean);
}

const errors = [];
if (!fs.existsSync(manifestPath)) {
  errors.push(`missing manifest: ${manifestPath}`);
}

const manifest = errors.length === 0 ? JSON.parse(readText(manifestPath)) : { sections: [] };
const sectionsById = new Map(manifest.sections.map((section) => [section.id, section]));
const seen = new Map();

for (const entry of fs.readdirSync(root)) {
  if (!entry.endsWith(".md")) continue;
  const filePath = path.join(root, entry);
  const block = coverageBlock(readText(filePath));
  if (!block) {
    errors.push(`${entry}: missing ## Source Coverage`);
    continue;
  }
  const ids = coverageIds(block);
  if (ids.length === 0) {
    errors.push(`${entry}: missing "- Covers manifest sections:" line`);
    continue;
  }
  for (const id of ids) {
    const section = sectionsById.get(id);
    if (!section) {
      errors.push(`${entry}: unknown manifest section "${id}"`);
      continue;
    }
    if (section.target !== entry) {
      errors.push(`${entry}: section "${id}" belongs to ${section.target}`);
    }
    const files = seen.get(id) || [];
    files.push(entry);
    seen.set(id, files);
  }
}

for (const section of manifest.sections) {
  const files = seen.get(section.id) || [];
  if (files.length === 0) {
    errors.push(`${section.id}: not covered by ${section.target}`);
  }
  if (files.length > 1) {
    errors.push(`${section.id}: covered multiple times by ${files.join(", ")}`);
  }
}

const report = {
  root,
  manifest: manifestPath,
  sectionCount: manifest.sections.length,
  coveredCount: seen.size,
  errors,
};

if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (errors.length === 0) {
  console.log(`Source coverage OK: ${report.coveredCount}/${report.sectionCount} sections`);
} else {
  console.error(`Source coverage failed: ${errors.length} errors`);
  for (const error of errors) console.error(`- ${error}`);
}

process.exit(errors.length === 0 ? 0 : 1);
```

Create `skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs");

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-coverage-"));
  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  return root;
}

function writeManifest(root, sections) {
  fs.writeFileSync(path.join(root, "source", "split-manifest.json"), JSON.stringify({
    version: "svg-slides.split-manifest.v1",
    source: "source/full.debranded.md",
    sections,
  }, null, 2));
}

function run(root) {
  return spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
}

test("passes when each manifest section is covered by its target file", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "workflow", lines: [1, 10], target: "workflow.md" }]);
  fs.writeFileSync(path.join(root, "workflow.md"), `# Workflow\n\n## Source Coverage\n\n- Covers manifest sections: workflow\n`);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).errors.length, 0);
});

test("fails when a section is missing from Source Coverage", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "protocol", lines: [1, 10], target: "protocol.md" }]);
  fs.writeFileSync(path.join(root, "protocol.md"), `# Protocol\n\n## Source Coverage\n\n- Covers manifest sections: other\n`);
  const result = run(root);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.errors.some((error) => error.includes("unknown manifest section")));
  assert.ok(report.errors.some((error) => error.includes("not covered")));
});

test("fails when a section is declared by the wrong target file", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "visual", lines: [1, 10], target: "visual-design.md" }]);
  fs.writeFileSync(path.join(root, "workflow.md"), `# Workflow\n\n## Source Coverage\n\n- Covers manifest sections: visual\n`);
  const result = run(root);
  assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).errors.some((error) => error.includes("belongs to visual-design.md")));
});
```

- [ ] **Step 6: Verify source coverage, reference routing, and forbidden mixing**

Run:

```bash
node --test skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs
node skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs skills/lark-slides/references/svg-slides
if find skills/lark-slides/references/svg-slides -maxdepth 1 -type f -name '*.md' -print0 | \
  xargs -0 rg -n "SML|xml-schema-quick-ref|slides \\+create-svglide.*published|published=true"; then
  echo "unexpected XML or publish-layer wording in SVG Slides references" >&2
  exit 1
fi
find skills/lark-slides/references/svg-slides -maxdepth 1 -type f -name '*.md' -print0 | \
  xargs -0 rg -n "viewBox=\"0 0 960 540\"|validate_svg_deck|publish-ready|not published|slide:role=\"slide\""
```

Expected result:

```text
coverage test exits 0
coverage checker prints "Source coverage OK: 17/17 sections"
forbidden wording check scans split markdown files only and prints no matches
second rg prints matches in README.md, protocol.md, validation.md, or examples
```

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add skills/lark-slides/references/svg-slides \
  skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs \
  skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs
git commit -m "docs: split svg slides generation references"
```

---

### Task 3: Protocol Examples

**Files:**
- Create: `skills/lark-slides/references/svg-slides/examples/minimal-slide.svg`
- Create: `skills/lark-slides/references/svg-slides/examples/group-card.svg`
- Create: `skills/lark-slides/references/svg-slides/examples/chart-embed.svg`

**Interfaces:**
- Consumes: `protocol.md`
- Produces: known-good protocol examples for authors and tests

- [ ] **Step 1: Create the examples directory**

Run:

```bash
mkdir -p skills/lark-slides/references/svg-slides/examples
```

- [ ] **Step 2: Add `minimal-slide.svg`**

Create `minimal-slide.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="minimal_slide" viewBox="0 0 960 540">
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(248,250,252,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="760" height="92" style="font-size:42px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);font-weight:800;line-height:1.12;text-align:left;vertical-align:top;letter-spacing:0px;padding:0px">
    <h1 xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:42px;line-height:1.12;color:rgba(15,23,42,1);letter-spacing:0px">One protocol-compliant SVG slide</h1>
  </foreignObject>
</svg>
```

- [ ] **Step 3: Add `group-card.svg`**

Create `group-card.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="group_card" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="card_grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,1)"/>
      <stop offset="100%" stop-color="rgba(226,232,240,1)"/>
    </linearGradient>
  </defs>
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(241,245,249,1)"/>
  <g slide:role="group" id="card_primary">
    <rect slide:role="shape" slide:shape-type="round-rect" x="120" y="140" width="520" height="300" rx="24" ry="24" fill="url(#card_grad)" stroke="rgba(148,163,184,1)" stroke-width="1"/>
    <circle slide:role="shape" slide:shape-type="circle" cx="180" cy="206" r="26" fill="rgba(37,99,235,1)"/>
    <foreignObject slide:role="shape" slide:shape-type="text" x="224" y="178" width="340" height="50" style="font-size:28px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);font-weight:800;line-height:1.2;text-align:left;vertical-align:top;letter-spacing:0px;padding:0px">
      <h2 xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:28px;line-height:1.2;color:rgba(15,23,42,1);letter-spacing:0px">Grouped card</h2>
    </foreignObject>
    <foreignObject slide:role="shape" slide:shape-type="text" x="154" y="264" width="420" height="86" style="font-size:20px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(51,65,85,1);font-weight:500;line-height:1.38;text-align:left;vertical-align:top;letter-spacing:0px;padding:0px">
      <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:20px;line-height:1.38;color:rgba(51,65,85,1);letter-spacing:0px">A card is a group; every visual child still carries its own slide role.</p>
    </foreignObject>
  </g>
</svg>
```

- [ ] **Step 4: Add `chart-embed.svg`**

Create `chart-embed.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="chart_embed" viewBox="0 0 960 540">
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="56" width="680" height="72" style="font-size:36px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(17,24,39,1);font-weight:800;line-height:1.15;text-align:left;vertical-align:top;letter-spacing:0px;padding:0px">
    <h2 xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:36px;line-height:1.15;color:rgba(17,24,39,1);letter-spacing:0px">Chart is a referenced sidecar</h2>
  </foreignObject>
  <rect slide:role="chart" href="resources/charts/example_bar.svg" x="80" y="160" width="560" height="350"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="690" y="190" width="190" height="118" style="font-size:19px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(55,65,81,1);font-weight:500;line-height:1.38;text-align:left;vertical-align:top;letter-spacing:0px;padding:0px">
    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:19px;line-height:1.38;color:rgba(55,65,81,1);letter-spacing:0px">The chart payload lives outside the slide and is referenced by href.</p>
  </foreignObject>
</svg>
```

- [ ] **Step 5: Validate examples**

Run:

```bash
node /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/work/validate_svg_deck.mjs \
  skills/lark-slides/references/svg-slides/examples
```

Expected result:

```text
Slides: 3
Errors: 0
```

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add skills/lark-slides/references/svg-slides/examples
git commit -m "docs: add svg slides protocol examples"
```

---

### Task 4: Move Static Validator Into The Skill

**Files:**
- Create: `skills/lark-slides/scripts/validate_svg_deck.mjs`
- Create: `skills/lark-slides/scripts/validate_svg_deck_test.mjs`

**Interfaces:**
- Consumes: existing validator at `/Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/work/validate_svg_deck.mjs`
- Produces:
  - CLI: `node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir-or-slides-dir> [--json]`
  - JSON report shape: `{target, slidesDir, slideCount, totalErrors, results}`

- [ ] **Step 1: Copy the validator**

Run:

```bash
cp /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/work/validate_svg_deck.mjs \
  skills/lark-slides/scripts/validate_svg_deck.mjs
chmod +x skills/lark-slides/scripts/validate_svg_deck.mjs
```

- [ ] **Step 2: Adjust the usage string**

In `skills/lark-slides/scripts/validate_svg_deck.mjs`, change:

```js
console.error("Usage: node work/validate_svg_deck.mjs <deck-dir-or-slides-dir> [--json]");
```

to:

```js
console.error("Usage: node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir-or-slides-dir> [--json]");
```

- [ ] **Step 3: Add validator tests**

Create `skills/lark-slides/scripts/validate_svg_deck_test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/validate_svg_deck.mjs");

function tempDeck() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-validator-"));
  fs.mkdirSync(path.join(root, "slides"));
  return root;
}

function writeSlide(root, name, body) {
  fs.writeFileSync(path.join(root, "slides", name), body);
}

const validSlide = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="valid" viewBox="0 0 960 540">
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="600" height="80" style="font-size:32px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);line-height:1.2;letter-spacing:0px;padding:0px">
    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Valid</p>
  </foreignObject>
</svg>`;

test("valid SVG deck passes", () => {
  const root = tempDeck();
  writeSlide(root, "slide_01.svg", validSlide);
  const result = spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.slideCount, 1);
  assert.equal(report.totalErrors, 0);
});

test("hex color fails", () => {
  const root = tempDeck();
  writeSlide(root, "slide_01.svg", validSlide.replace("rgba(255,255,255,1)", "#ffffff"));
  const result = spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.totalErrors > 0, true);
  assert.equal(report.results[0].errors.some((item) => item.rule === "color.attr"), true);
});

test("div inside text foreignObject fails", () => {
  const root = tempDeck();
  writeSlide(root, "slide_01.svg", validSlide.replace(
    '<p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Valid</p>',
    '<div xmlns="http://www.w3.org/1999/xhtml"><p>Invalid</p></div>',
  ));
  const result = spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.results[0].errors.some((item) => item.rule === "forbid.div-wrapper"), true);
});
```

- [ ] **Step 4: Run validator tests and fixture checks**

Run:

```bash
node --test skills/lark-slides/scripts/validate_svg_deck_test.mjs
node skills/lark-slides/scripts/validate_svg_deck.mjs skills/lark-slides/references/svg-slides/examples
```

Expected result:

```text
node --test exits 0
examples: Errors: 0
```

- [ ] **Step 5: Verify old deck still fails**

Run:

```bash
node skills/lark-slides/scripts/validate_svg_deck.mjs /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/deepseek_v4_svg_ppt --json > /tmp/svg-slides-old-validation.json || true
node -e 'const r=require("/tmp/svg-slides-old-validation.json"); if (r.totalErrors <= 0) { console.error(r.totalErrors); process.exit(1) } console.log("old deck fails as expected", r.totalErrors)'
```

Expected result:

```text
old deck fails as expected
```

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add skills/lark-slides/scripts/validate_svg_deck.mjs \
  skills/lark-slides/scripts/validate_svg_deck_test.mjs
git commit -m "test: add svg slides validator"
```

---

### Task 5: Local Publish-Ready Bundle Builder

**Files:**
- Create: `skills/lark-slides/scripts/svg_slides_bundle.mjs`
- Create: `skills/lark-slides/scripts/svg_slides_bundle_test.mjs`
- Modify: `skills/lark-slides/references/svg-slides/validation.md`

**Interfaces:**
- Consumes: `validate_svg_deck.mjs`
- Produces:
  - CLI: `node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title <title>`
  - `manifest.json`
  - `receipts/validate_svg_deck.json`
  - `manifest.publish_ready = true`
  - `manifest.published = false`

- [ ] **Step 1: Add the bundle builder**

Create `skills/lark-slides/scripts/svg_slides_bundle.mjs`:

```js
#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

const args = process.argv.slice(2);
const deckArg = args.find((arg) => !arg.startsWith("--"));
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? args[titleIndex + 1] : "";

if (!deckArg || !title) {
  fail("Usage: node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title <title>");
}

const root = path.resolve(deckArg);
const slidesDir = fs.existsSync(path.join(root, "slides")) ? path.join(root, "slides") : root;
if (!fs.existsSync(slidesDir)) {
  fail(`Slides directory not found: ${slidesDir}`);
}

const validator = path.resolve("skills/lark-slides/scripts/validate_svg_deck.mjs");
const validate = spawnSync("node", [validator, root, "--json"], { encoding: "utf8" });
if (!validate.stdout.trim()) {
  process.stderr.write(validate.stderr);
  process.exit(validate.status || 1);
}

const receipt = JSON.parse(validate.stdout);
fs.mkdirSync(path.join(root, "receipts"), { recursive: true });
fs.writeFileSync(path.join(root, "receipts", "validate_svg_deck.json"), JSON.stringify(receipt, null, 2) + "\n");
if (receipt.totalErrors !== 0) {
  fail(`SVG deck is not publish-ready: ${receipt.totalErrors} validation error(s)`, 1);
}

const slideFiles = fs.readdirSync(slidesDir)
  .filter((file) => file.endsWith(".svg"))
  .sort();

const pages = slideFiles.map((file, index) => {
  const abs = path.join(slidesDir, file);
  const raw = fs.readFileSync(abs);
  return {
    id: path.basename(file, ".svg"),
    index: index + 1,
    file: path.relative(root, abs).split(path.sep).join("/"),
    sha256: crypto.createHash("sha256").update(raw).digest("hex"),
  };
});

const manifest = {
  version: "svglide.manifest.v1",
  protocol: "svg-slides.v1",
  title,
  size: { width: 960, height: 540 },
  publish_ready: true,
  published: false,
  pages,
  receipts: {
    validate_svg_deck: "receipts/validate_svg_deck.json",
  },
};

fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, manifest: path.join(root, "manifest.json"), pages: pages.length }, null, 2));
```

- [ ] **Step 2: Add bundle tests**

Create `skills/lark-slides/scripts/svg_slides_bundle_test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/svg_slides_bundle.mjs");

function tempDeck() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-bundle-"));
  fs.mkdirSync(path.join(root, "slides"));
  return root;
}

const validSlide = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="bundle_slide" viewBox="0 0 960 540">
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="600" height="80" style="font-size:32px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);line-height:1.2;letter-spacing:0px;padding:0px">
    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Bundle</p>
  </foreignObject>
</svg>`;

test("bundle builder writes manifest and validation receipt", () => {
  const root = tempDeck();
  fs.writeFileSync(path.join(root, "slides", "slide_01.svg"), validSlide);
  const result = spawnSync("node", [script, root, "--title", "Bundle Test"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.version, "svglide.manifest.v1");
  assert.equal(manifest.protocol, "svg-slides.v1");
  assert.equal(manifest.title, "Bundle Test");
  assert.deepEqual(manifest.size, { width: 960, height: 540 });
  assert.equal(manifest.publish_ready, true);
  assert.equal(manifest.published, false);
  assert.equal(manifest.pages.length, 1);
  assert.match(manifest.pages[0].sha256, /^[a-f0-9]{64}$/);
  const receipt = JSON.parse(fs.readFileSync(path.join(root, "receipts", "validate_svg_deck.json"), "utf8"));
  assert.equal(receipt.totalErrors, 0);
});

test("bundle builder rejects invalid SVG deck", () => {
  const root = tempDeck();
  fs.writeFileSync(path.join(root, "slides", "slide_01.svg"), validSlide.replace("rgba(255,255,255,1)", "#fff"));
  const result = spawnSync("node", [script, root, "--title", "Invalid"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not publish-ready/);
  assert.equal(fs.existsSync(path.join(root, "receipts", "validate_svg_deck.json")), true);
  assert.equal(fs.existsSync(path.join(root, "manifest.json")), false);
});
```

- [ ] **Step 3: Update validation docs with manifest contract**

Append this to `skills/lark-slides/references/svg-slides/validation.md`:

```markdown
## Local Publish-Ready Bundle

Run:

```bash
node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title "<deck title>"
```

The command writes:

- `manifest.json`
- `receipts/validate_svg_deck.json`

The manifest uses:

```json
{
  "version": "svglide.manifest.v1",
  "protocol": "svg-slides.v1",
  "size": {"width": 960, "height": 540},
  "publish_ready": true,
  "published": false
}
```

`publish_ready=true` means local static validation passed. It does not mean the deck was published to Lark Slides.
```

- [ ] **Step 4: Run bundle tests**

Run:

```bash
node --test skills/lark-slides/scripts/svg_slides_bundle_test.mjs
node skills/lark-slides/scripts/svg_slides_bundle.mjs skills/lark-slides/references/svg-slides/examples --title "SVG Slides Examples"
node -e 'const m=require("./skills/lark-slides/references/svg-slides/examples/manifest.json"); if (!m.publish_ready || m.published) process.exit(1); console.log(m.pages.length)'
```

Expected result:

```text
node --test exits 0
bundle command exits 0
node -e prints 3
```

- [ ] **Step 5: Remove generated example bundle from docs if not intended as fixture**

Run:

```bash
rm -f skills/lark-slides/references/svg-slides/examples/manifest.json
rm -rf skills/lark-slides/references/svg-slides/examples/receipts
git status --short skills/lark-slides/references/svg-slides/examples
```

Expected result:

```text
only the three SVG example files remain tracked or staged
```

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add skills/lark-slides/scripts/svg_slides_bundle.mjs \
  skills/lark-slides/scripts/svg_slides_bundle_test.mjs \
  skills/lark-slides/references/svg-slides/validation.md
git commit -m "feat: add svg slides local bundle builder"
```

---

### Task 6: Optional Browser Text Boundary Check

**Files:**
- Create: `skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs`
- Modify: `skills/lark-slides/references/svg-slides/validation.md`

**Interfaces:**
- Consumes: local SVG deck directory
- Produces: JSON `{status, problemCount, results}` to stdout or `--out <path>`

- [ ] **Step 1: Add browser text-boundary script**

Create `skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs`:

```js
#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

const args = process.argv.slice(2);
const targetArg = args.find((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : "";

if (!targetArg) {
  fail("Usage: node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs <deck-dir-or-slides-dir> [--out <json-path>]");
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  fail("playwright is not installed; install it in a dev environment before browser text-boundary QA", 2);
}

const target = path.resolve(targetArg);
const slidesDir = fs.existsSync(path.join(target, "slides")) ? path.join(target, "slides") : target;
const slideFiles = fs.readdirSync(slidesDir).filter((file) => file.endsWith(".svg")).sort();
if (!slideFiles.length) {
  fail(`No .svg files found in ${slidesDir}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
const results = [];

for (const file of slideFiles) {
  const abs = path.join(slidesDir, file);
  const svg = fs.readFileSync(abs, "utf8");
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: "load" });
  const problems = await page.evaluate(() => {
    return [...document.querySelectorAll("foreignObject[slide\\:role='shape'][slide\\:shape-type='text']")].flatMap((node, index) => {
      const box = node.getBoundingClientRect();
      const children = [...node.children];
      if (!children.length) {
        return [{ index: index + 1, reason: "empty_text_object" }];
      }
      return children.map((child) => {
        const childBox = child.getBoundingClientRect();
        const overflowX = childBox.left < box.left - 0.5 || childBox.right > box.right + 0.5;
        const overflowY = childBox.top < box.top - 0.5 || childBox.bottom > box.bottom + 0.5;
        if (!overflowX && !overflowY) return null;
        return {
          index: index + 1,
          reason: "text_bounds_overflow",
          box: { x: box.x, y: box.y, width: box.width, height: box.height },
          childBox: { x: childBox.x, y: childBox.y, width: childBox.width, height: childBox.height },
        };
      }).filter(Boolean);
    });
  });
  results.push({ file: path.relative(process.cwd(), abs), problemCount: problems.length, problems });
}

await browser.close();

const problemCount = results.reduce((sum, item) => sum + item.problemCount, 0);
const report = { status: problemCount === 0 ? "passed" : "failed", problemCount, results };
const json = JSON.stringify(report, null, 2) + "\n";
if (outPath) {
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, json);
}
process.stdout.write(json);
process.exit(problemCount === 0 ? 0 : 1);
```

- [ ] **Step 2: Document optional browser QA**

Append this to `validation.md`:

```markdown
## Browser Text Boundary QA

When Playwright is available in the development environment, run:

```bash
node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs <deck-dir> --out receipts/preview_text_bounds.json
```

Exit codes:

- `0`: no text-boundary problems.
- `1`: rendered text overflow was detected.
- `2`: the script could not run, for example Playwright is unavailable.

This browser check is a generation-quality gate. It is not a publish API proof.
```

- [ ] **Step 3: Verify missing Playwright behavior or real browser pass**

Run:

```bash
node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs skills/lark-slides/references/svg-slides/examples --out /tmp/svg-slides-text-bounds.json
```

Expected result when Playwright is unavailable:

```text
exit 2
stderr contains "playwright is not installed"
```

Expected result when Playwright is available:

```text
exit 0
/tmp/svg-slides-text-bounds.json contains "problemCount": 0
```

- [ ] **Step 4: Commit Task 6**

Run:

```bash
git add skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs \
  skills/lark-slides/references/svg-slides/validation.md
git commit -m "feat: add svg slides browser text bounds check"
```

---

### Task 7: Skill Routing And Boundary Docs

**Files:**
- Modify: `skills/lark-slides/SKILL.md`
- Modify: `skills/lark-slides/references/create-svglide-implementation-plan.zh.md`

**Interfaces:**
- Consumes: new `references/svg-slides/README.md`
- Produces: clear route from lark-slides skill into SVG Slides local generation without implying live publish

- [ ] **Step 1: Update the quick reference table**

In `skills/lark-slides/SKILL.md`, add this row after the "新建 PPT" row:

```markdown
| 本地生成或校验 SVG Slides / SVGlide 产物 | 先读 `references/svg-slides/README.md`，生成 local publish-ready bundle；发布层另走 `+create-svglide` 后续计划 | `references/svg-slides/README.md`、`scripts/validate_svg_deck.mjs`、`scripts/svg_slides_bundle.mjs` |
```

- [ ] **Step 2: Add a critical boundary note**

In `skills/lark-slides/SKILL.md`, add below the XML critical notes:

```markdown
**CRITICAL — SVG Slides / SVGlide 与当前 XML/SXSD 工作流是不同协议。两者都使用 960x540 画布，但 SVG Slides 使用 `viewBox="0 0 960 540"` 和 `slide:*` SVG 语义，XML/SXSD 使用 SML XML。处理 SVG Slides 生成或校验时，先读 [`references/svg-slides/README.md`](references/svg-slides/README.md)，不要把 SVG 规则写进 `xml-schema-quick-ref.md`。**
```

- [ ] **Step 3: Mark the publish plan as blocked by live contract**

At the top of `skills/lark-slides/references/create-svglide-implementation-plan.zh.md`, immediately after the title, add:

```markdown
> Status: publish-layer plan. Endpoint/body/response contract for live SVGlide publishing is not confirmed yet. Execute `svg-slides-local-generation-action-plan.zh.md` first to build the generation and validation bundle that this publish layer will consume.
```

- [ ] **Step 4: Verify route wording**

Run:

```bash
rg -n "SVG Slides|svg-slides|960x540|960x540|publish-layer plan" skills/lark-slides/SKILL.md skills/lark-slides/references/create-svglide-implementation-plan.zh.md
```

Expected result:

```text
SKILL.md contains SVG Slides route and protocol separation.
create-svglide-implementation-plan.zh.md contains publish-layer blocked status.
```

- [ ] **Step 5: Commit Task 7**

Run:

```bash
git add skills/lark-slides/SKILL.md \
  skills/lark-slides/references/create-svglide-implementation-plan.zh.md
git commit -m "docs: route svg slides local generation"
```

---

### Task 8: Final Verification

**Files:**
- Verify all files touched by Tasks 1-7

**Interfaces:**
- Consumes: completed reference family, scripts, and tests
- Produces: evidence that generation/validation layer is usable without publish contract

- [ ] **Step 1: Run Node tests**

Run:

```bash
node --test skills/lark-slides/scripts/validate_svg_deck_test.mjs
node --test skills/lark-slides/scripts/svg_slides_bundle_test.mjs
node --test skills/lark-slides/scripts/svg_slides_source_coverage_check_test.mjs
```

Expected result:

```text
all node --test commands exit 0
```

- [ ] **Step 2: Verify source coverage**

Run:

```bash
node skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs skills/lark-slides/references/svg-slides --json > /tmp/svg-slides-source-coverage.json
jq -e '.sectionCount == 17 and .coveredCount == 17 and (.errors | length) == 0' /tmp/svg-slides-source-coverage.json
```

Expected result:

```text
jq exits 0
```

- [ ] **Step 3: Validate committed examples**

Run:

```bash
node skills/lark-slides/scripts/validate_svg_deck.mjs skills/lark-slides/references/svg-slides/examples
```

Expected result:

```text
Slides: 3
Errors: 0
```

- [ ] **Step 4: Verify historical non-strict deck still fails**

Run:

```bash
node skills/lark-slides/scripts/validate_svg_deck.mjs /Users/bytedance/Documents/Codex/2026-07-01/https-bytedance-larkoffice-com-docx-kncld7xr5ohwonxhksncz3lxnvd/outputs/deepseek_v4_svg_ppt --json > /tmp/svg-slides-old-validation.json || true
node -e 'const old=require("/tmp/svg-slides-old-validation.json"); if (old.totalErrors <= 0) { console.error(old.totalErrors); process.exit(1) } console.log("old deck still fails", old.totalErrors)'
```

Expected result:

```text
old deck still fails with a positive error count
```

- [ ] **Step 5: Build a temporary publish-ready bundle**

Run:

```bash
tmp="$(mktemp -d)"
mkdir -p "$tmp/slides"
cp skills/lark-slides/references/svg-slides/examples/*.svg "$tmp/slides/"
node skills/lark-slides/scripts/svg_slides_bundle.mjs "$tmp" --title "SVG Slides Local Bundle"
jq -e '.version == "svglide.manifest.v1" and .protocol == "svg-slides.v1" and .publish_ready == true and .published == false and (.pages | length) == 3' "$tmp/manifest.json"
```

Expected result:

```text
bundle command exits 0
jq exits 0
```

- [ ] **Step 6: Run browser QA when available**

Run:

```bash
node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs skills/lark-slides/references/svg-slides/examples --out /tmp/svg-slides-text-bounds.json
```

Expected result:

```text
If Playwright is installed: exit 0 and problemCount is 0.
If Playwright is not installed: exit 2 and stderr explains that Playwright is unavailable.
```

- [ ] **Step 7: Check for accidental publish-layer work**

Run:

```bash
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD | rg '^(shortcuts/slides|internal/)' && exit 1 || true
if rg -n "ppe_svg_slides|x-tt-env|open.feishu-pre.cn|published=true|live_create|readback" skills/lark-slides/references/svg-slides skills/lark-slides/scripts; then
  echo "unexpected publish-layer or PPE wording in generation/validation layer" >&2
  exit 1
fi
```

Expected result:

```text
No shortcuts/internal files changed by this plan.
publish-layer wording check prints no matches.
```

- [ ] **Step 8: Run repository checks appropriate for docs/scripts**

Run:

```bash
git diff --check
go test ./shortcuts/slides -run TestNonExistentForDocsOnly -count=1
```

Expected result:

```text
git diff --check exits 0
go test exits 0 with warning "no tests to run" or package ok
```

- [ ] **Step 9: Commit final fixes**

Run:

```bash
git status --short
git add skills/lark-slides
git commit -m "docs: add svg slides local generation workflow"
```

Expected result:

```text
Only one final commit is created if Tasks 1-7 left uncommitted verification fixes.
```

---

## Non-Goals

- Do not implement `slides +create-svglide` Go shortcut in this plan.
- Do not call live Lark Slides APIs in this plan.
- Do not add PPE, Whistle, pre-release, or lane profile instructions to the SVG Slides reference family.
- Do not merge SVG Slides rules into `xml-schema-quick-ref.md`.
- Do not claim browser QA passed unless the Playwright script actually ran and returned `problemCount: 0`.

## Completion Criteria

- `references/svg-slides/README.md` routes SVG Slides generation tasks without loading the full source by default.
- `source/full.debranded.md` and `source/split-manifest.json` preserve provenance and define the source coverage authority.
- Every `split-manifest.json` section id is covered exactly once by a `## Source Coverage` block, and `svg_slides_source_coverage_check.mjs` exits 0.
- `validate_svg_deck.mjs` passes valid 960x540 examples and rejects the historical first deck with a positive error count.
- `svg_slides_bundle.mjs` writes `manifest.json` and `receipts/validate_svg_deck.json` for a valid local deck.
- `SKILL.md` explicitly separates the SVG Slides protocol from current SML XML while documenting that both use a 960x540 canvas.
- No publish-layer Go code or live API claim is introduced.

## Self-Review

- Spec coverage: source snapshot, coverage-preserving split, source coverage checker, validator migration, local bundle, optional browser QA, skill routing, and publish-layer separation are each assigned to a task.
- Unfinished marker scan: no implementation task depends on unspecified backend endpoint/body/response contracts.
- Type consistency: `svglide.manifest.v1`, `svg-slides.v1`, `validate_svg_deck.json`, `publish_ready`, and `published=false` are used consistently across manifest, docs, scripts, and tests.
