# SVGlide Artboard Layout Collision 修复计划（Diff 级 TDD）

## 0. 目标与边界

目标：把 SVGlide artboard/Satori 生成链路中的布局碰撞问题变成可测试、可阻断、可回修的工程闭环。

最终效果：

- `generate_svg` 之后自动检查 raw artboard 的文本重叠、文本越界、正文与 CTA 碰撞。
- collision failed 时阻断 `contract_compile`、`prepare`、`publish`，不让坏视觉继续流入后续节点。
- 真正修复发生在 template renderer 或 page-family mapping，不在检测器、receipt、`contract_compile`、`prepare` 中偷偷挪元素。
- 34 套 beautiful template 都能跑完整 smoke deck，失败项明确指向对应 renderer/page role。
- 只有通过 full smoke deck、layout-collision、visual_contract、fidelity/review、renderer receipt 的模板，才能进入 `production/default_selectable`。

非目标：

- 不让 layout collision 检测器动态改布局。
- 不通过修改 manifest/receipt/JSON 字段伪装通过。
- 不把一次性样例坐标写成长期规则。
- 不因为某个 renderer 文件存在就自动提升 production/default_selectable。

## 1. 团队与并行方式

### 1.1 角色

- `TDD Plan Owner`：维护本计划，确保每个改动都有 Red diff、Green diff、验证命令和防偏移审查点。
- `Collision Gate Owner`：实现/维护 `svglide_artboard_layout_collision.py`、runner 接入、current/hash 校验。
- `Renderer Repair Owner`：修 beautiful template renderer，确保失败来自 renderer/mapping 时回到正确 owner。
- `Template Smoke Owner`：生成 34 套 smoke deck，沉淀每套模板的 collision 结果和待修项。
- `Skill Owner`：把可复用规则同步到 `svglide-template-visual-repair` 与 `svglide-template-page-family-implementer`。
- `Independent Reviewer`：反向审查是否混淆检测与修复职责、是否允许伪装通过、是否误升 production。

### 1.2 并行节奏

```text
Wave 1：Collision Gate Owner 与 Renderer Repair Owner 并行写 Red 测试。
Wave 2：Collision Gate Owner 实现检测和 runner 门禁；Renderer Repair Owner 修目标 renderer。
Wave 3：Template Smoke Owner 批量跑 34 套 current deck + collision scan。
Wave 4：Skill Owner 沉淀长期规则；Independent Reviewer 审计划、代码和 skill 口径。
```

## 2. M1：新增 raw artboard layout collision 检测

### 2.1 修改文件

```text
skills/lark-slides/scripts/svglide_artboard_layout_collision.py
skills/lark-slides/scripts/svglide_artboard_layout_collision_test.py
```

### 2.2 输入输出

输入：

```text
04-artboard/raw/manifest.json
04-artboard/raw/page-###.node-layout-map.json
04-artboard/raw/page-###.canvas-spec.json
```

输出：

```text
04-artboard/raw/layout-collision.json
receipts/artboard-layout-collision.json
```

### 2.3 Red diff

新增测试必须先失败：

- 中文长 subtitle 与 CTA bbox 距离小于 14px 时，输出 `status=failed`，issue code 为 `subtitle_cta_overlap`。
- 任意两个非 intentional 的文本 bbox 交叠时，输出 `text_text_overlap`。
- 文本 bbox 超出 canvas 或安全区时，输出 `text_canvas_overflow`。
- `layout-collision.json` 与 `receipts/artboard-layout-collision.json` 都必须生成。
- 检测器不得修改 `page-###.visual.svg`、`page-###.canvas-spec.json`、`page-###.node-layout-map.json`。

### 2.4 Green diff

实现检测器：

- 读取 raw artboard manifest，逐页加载 node layout map 和 canvas spec。
- 基于 bbox 判断 text/text overlap、text canvas overflow、subtitle/CTA 最小间距。
- 输出页级 issues，至少包含：

```text
page
page_role
page_variant_id
code
element_id
text_excerpt
bbox
related_element_id
related_bbox
min_gap
actual_gap
suggested_owner
```

- CLI 返回码：
  - `passed` 返回 0。
  - `failed` 返回 1。
  - 输入缺失或格式错误返回 1，并写清楚错误。

### 2.5 验证命令

```bash
python3 skills/lark-slides/scripts/svglide_artboard_layout_collision_test.py
python3 skills/lark-slides/scripts/svglide_artboard_layout_collision.py --project <project> --pretty
```

## 3. M2：接入 `generate_svg` 强制门禁

### 3.1 修改文件

```text
skills/lark-slides/scripts/svglide_project_runner.py
skills/lark-slides/scripts/svglide_project_runner_test.py
```

### 3.2 Red diff

新增/更新 runner 测试：

- `artboard_satori` 模式下，`generate_svg` 完成 raw render 后必须运行 layout collision。
- collision failed 时，`generate_svg` receipt status 必须 failed，错误码为 `artboard_layout_collision_failed`。
- collision failed 时，runner 不允许进入 `contract_compile`。
- `require_generated_svg_current()` 必须拒绝：
  - collision receipt 缺失。
  - collision status 不是 `passed`。
  - collision hash stale。
  - collision stage receipt hash stale。

### 3.3 Green diff

在 `run_generate_svg_stage()` 中接入：

```text
artboard render
-> write raw manifest/node-layout-map
-> run svglide_artboard_layout_collision.check_project(write=True)
-> append layout-collision receipts and hashes to generate_svg receipt
-> failed then raise RunnerError before contract_compile
```

`receipts/generate_svg.json` 增加：

```json
{
  "artboard_layout_collision": "04-artboard/raw/layout-collision.json",
  "artboard_layout_collision_receipt": "receipts/artboard-layout-collision.json",
  "artboard_layout_collision_sha256": "...",
  "artboard_layout_collision_receipt_sha256": "..."
}
```

### 3.4 验证命令

```bash
python3 skills/lark-slides/scripts/svglide_project_runner_test.py
```

## 4. M3：修复 renderer，不在后处理节点修视觉

### 4.1 修改文件

按具体 family 定位 renderer，例如：

```text
skills/lark-slides/scripts/artboard_renderer/templates/beautiful/<runtime_template_id>.mjs
skills/lark-slides/scripts/artboard_renderer/dist/render.mjs
```

### 4.2 Red diff

先构造失败 fixture 或真实 project：

- closing 页：长中文 subtitle + CTA，旧固定坐标应触发 `subtitle_cta_overlap`。
- card 页：长正文不能溢出 card 或压住标题。
- timeline/process 页：label 与 marker/正文不能互相覆盖。
- chart/data 页：label 与 bar/axis/legend 不能互相覆盖。

### 4.3 Green diff

修 renderer 原则：

- 用 layout stack、grid、measured spacing 或 role token 约束布局，不依赖后处理。
- 对 CJK 长文本设置可预测 max width、line height、max lines、fallback font size。
- CTA、contact、caption 等关键元素必须有最小间距。
- Intentional overlap 必须能从 source screenshot 证明，并在 visual gap/receipt 中记录。
- 修改 renderer source 后必须 rebuild `artboard_renderer/dist/render.mjs`。

### 4.4 验证命令

```bash
python3 skills/lark-slides/scripts/svglide_artboard_renderer_test.py
python3 skills/lark-slides/scripts/svglide_artboard_template_golden_test.py
npm --prefix skills/lark-slides/scripts/artboard_renderer run build
```

## 5. M4：34 套模板 full smoke deck 扫描

### 5.1 输入 family

从以下注册表或 matrix 获取 beautiful family 列表：

```text
skills/lark-slides/references/beautiful-template-executable-matrix.json
skills/lark-slides/references/beautiful-html-template-families.json
```

### 5.2 每套必须覆盖的页面角色

```text
cover
agenda
dashboard/content
data/chart
split/comparison
quote
timeline/process
detail
closing
```

如果源模板没有某一角色，需要写明缺失原因，不能用 cover 页冒充。

### 5.3 Red diff

新增或更新 smoke 测试/脚本：

- 每个 family 都要生成 current deck SVG、PNG、canvas spec、manifest、receipt。
- 每个 family 都要跑 layout collision。
- 任一 page role collision failed 时，该 family smoke 不能通过。
- 不允许只渲染单页封面就标记 full smoke deck passed。

### 5.4 Green diff

生成并记录每套结果：

```text
family_id
runtime_template_id
renderer_module
page
page_role
page_variant_id
status
issue_code
bbox
related_bbox
suggested_owner
```

### 5.5 验证命令

```bash
python3 skills/lark-slides/scripts/beautiful_template_current_deck_render.py --family <family_id> --pretty --workers 4 --receipt /tmp/svglide-<family_id>-current-deck-receipt.json
python3 skills/lark-slides/scripts/svglide_artboard_layout_collision.py --project <project> --pretty
python3 skills/lark-slides/scripts/beautiful_template_current_deck_render_test.py
python3 skills/lark-slides/scripts/beautiful_template_production_review_gallery_test.py
```

## 6. M5：production/default_selectable 收紧

### 6.1 修改文件

按当前代码实际选择：

```text
skills/lark-slides/references/beautiful-template-executable-matrix.json
skills/lark-slides/scripts/beautiful_template_runtime.py
skills/lark-slides/scripts/beautiful_template_page_family_smoke.py
skills/lark-slides/scripts/svglide_theme_template_selector.py
skills/lark-slides/scripts/svglide_quality_gate.py
```

### 6.2 Red diff

新增测试：

- 没有 full smoke deck receipt 的 family 不能 `default_selectable=true`。
- layout-collision failed 的 family 不能 production/default_selectable。
- visual_contract 缺失或 failed 的 family 不能 production/default_selectable。
- fidelity/review receipt 缺失或 failed 的 family 不能 production/default_selectable。
- renderer receipt 缺失时，不能仅凭字段升 production。

### 6.3 Green diff

promotion gate 必须检查：

```text
full smoke deck passed
layout-collision passed
visual_contract passed
fidelity/review passed
renderer receipt exists and fresh
selector/gate/production review passed
```

未通过的 family 保持：

```text
needs_review
experimental
legacy_debug
```

## 7. M6：沉淀到 Codex skill

### 7.1 修改文件

```text
/Users/bytedance/.codex/skills/svglide-template-visual-repair/SKILL.md
/Users/bytedance/.codex/skills/svglide-template-visual-repair/references/visual-repair-checklist.md
/Users/bytedance/.codex/skills/svglide-template-page-family-implementer/SKILL.md
/Users/bytedance/.codex/skills/svglide-template-page-family-implementer/references/renderer-contract.md
```

### 7.2 `svglide-template-visual-repair` 要沉淀

- layout collision receipt 是视觉验收证据。
- `text_text_overlap`、`text_canvas_overflow`、`subtitle_cta_overlap` 是 blocker，除非 source screenshot 明确证明是 intentional overlap。
- visual-repair 负责检测、证据、归因、验收，不负责实现 renderer。
- failed 后必须定位到 renderer、page-family mapping、typography contract 或 gallery evidence，不能只改 receipt/manifest。

### 7.3 `svglide-template-page-family-implementer` 要沉淀

- 新增/修改 renderer 后必须跑 layout collision。
- renderer 必须主动处理 generated-content 的长文本、CJK、CTA、card、timeline、chart label 边界。
- renderer 不得依赖 `contract_compile`、`prepare`、preview 或 publish 节点修复布局。
- production/default_selectable 必须以 full smoke deck + layout-collision passed + visual_contract + fidelity/review + renderer receipt 为前置条件。

### 7.4 不要沉淀

- 不写入一次性坐标值。
- 不写入某个单次项目名作为长期规则。
- 不把检测器描述成自动布局修复器。

## 8. 独立审查者 P0 防偏移点

独立审查必须阻断以下情况：

- 检测器移动元素或改视觉文件。
- collision failed 后通过改 receipt、manifest、matrix 字段伪装通过。
- renderer 问题被归因到 `contract_compile`、`prepare`、preview 或 publish。
- 只跑单页 sample 就声称 full smoke deck passed。
- 没有真实 renderer/golden/fidelity/review evidence 就升 production/default_selectable。
- 34 套模板复用同一套 cover-like fallback 冒充 page-family implementation。
- skill 写入大量一次性实现细节，导致长期复用时误导 agent。

## 9. 最小验证命令

```bash
python3 skills/lark-slides/scripts/svglide_artboard_layout_collision_test.py
python3 skills/lark-slides/scripts/svglide_project_runner_test.py
python3 skills/lark-slides/scripts/svglide_artboard_renderer_test.py
python3 skills/lark-slides/scripts/svglide_artboard_template_golden_test.py
python3 skills/lark-slides/scripts/beautiful_template_current_deck_render_test.py
python3 skills/lark-slides/scripts/beautiful_template_production_review_gallery_test.py
git diff --check
```

如果某条命令因历史无关问题失败，必须在汇报中区分：

```text
new blocker from this plan
existing unrelated blocker
not run and why
```

## 10. 完成标准

- 本计划具备 Red diff、Green diff、验证命令、修改文件清单、防偏移审查点。
- `generate_svg` 产出并消费 layout collision receipt。
- collision failed 不能进入 `contract_compile`。
- 目标 renderer 修复后，真实 project 的 collision status 为 passed。
- 34 套 beautiful template 有 full smoke deck 扫描计划和可执行命令。
- 两个 Codex skill 都沉淀了长期规则，并且没有混入一次性坐标细节。
- production/default_selectable 不因字段补齐自动增加，只能由真实证据逐套提升。
