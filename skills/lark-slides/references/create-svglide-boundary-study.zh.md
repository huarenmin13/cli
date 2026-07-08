# create-svglide 边界研究

## 目标

把 `slides +create` 作为 `slides +create-svglide` 的设计约束样本。

核心规则是：

```text
slides +create 是已经写好的 slide XML 的薄发布器。
slides +create-svglide 也应该是已经生成好的 SVGlide 产物的薄发布器。
```

本文档以证据为先，区分现有 shortcut 真实承担的职责，以及 `lark-slides` skill 中描述的更宽泛的生成与验证工作。

## 研究范围

| 范围 | 文件 | 作用 |
| --- | --- | --- |
| Go shortcut 实现 | `shortcuts/slides/slides_create.go`、`shortcuts/slides/helpers.go`、`shortcuts/slides/slides_media_upload.go`、`shortcuts/slides/shortcuts.go` | 确认 `slides +create` 的真实运行时边界。 |
| 单元测试 | `shortcuts/slides/slides_create_test.go` | 确认可被测试锁定、不能随意漂移的行为。 |
| E2E 证明 | `tests/cli_e2e/slides/slides_create_workflow_test.go`、`tests/cli_e2e/slides/coverage.md` | 确认哪些证明发生在 shortcut 外部。 |
| Skill 与 references | `skills/lark-slides/SKILL.md`、`skills/lark-slides/references/lark-slides-create.md`、`xml-schema-quick-ref.md`、`validation-checklist.md`、`troubleshooting.md` | 确认哪些工作属于 agent 指导或脚本，而不是 Go shortcut。 |

## `slides +create` 职责矩阵

| 职责 | 证据 | 边界含义 |
| --- | --- | --- |
| 注册一个名为 `slides +create` 的写操作 shortcut，支持 user 和 bot 身份 | `shortcuts/slides/slides_create.go:24-43`、`shortcuts/slides/shortcuts.go:8-17` | 这是 shortcut 封装，不是通用幻灯片生成系统。 |
| 构造最小 presentation XML 外壳 | `shortcuts/slides/slides_create.go:224-241` | shortcut 只创建 deck 容器：标题和 960x540 presentation 元数据。 |
| 创建在线 XML presentation | `shortcuts/slides/slides_create.go:125-148` | 第一个真实 API 调用是创建 presentation。 |
| 接收可选 `--slides`，格式为 `<slide>` XML 字符串 JSON 数组 | `shortcuts/slides/slides_create.go:40-52` | 页面内容由调用方以最终 XML 字符串形式提供。 |
| 限制一次内联提交最多 10 页 slide XML | `shortcuts/slides/slides_create.go:50-52` | 更大的 deck 应先创建容器，再用底层 page-create API 追加页面。 |
| 检测已提交 XML 里的本地图片占位符 | `shortcuts/slides/helpers.go:113-153` | shortcut 只理解一个很窄的 XML 约定：`<img src="@path">`。 |
| 创建 presentation 前校验占位符文件 | `shortcuts/slides/slides_create.go:53-67` | 避免因为本地图片缺失或超限而创建孤儿 deck。 |
| 上传占位符图片并替换为 file token | `shortcuts/slides/slides_create.go:163-177`、`shortcuts/slides/slides_media_upload.go:119-138`、`shortcuts/slides/helpers.go:283-309` | 图片上传是发布边界上的 helper 编排，不是内容生成。 |
| 把每个调用方提供的 slide XML 字符串提交给 page-create API | `shortcuts/slides/slides_create.go:179-200` | shortcut 把调用方写好的 XML 转交给后端。 |
| 页面创建失败时报告部分进度 | `shortcuts/slides/slides_create.go:194-196`、`shortcuts/slides/slides_create_test.go:354-420` | 不回滚；告诉调用方从哪里恢复。 |
| 输出机器可读的创建结果 | `shortcuts/slides/slides_create.go:150-219` | 输出是 API 编排回执。 |
| bot 创建 deck 后可选尝试给当前用户授权 | `shortcuts/slides/slides_create.go:215-217`、`shortcuts/slides/slides_create_test.go:66-198` | bot grant 是创建后的便利动作，不属于内容语义。 |

## 测试锁定的行为

| 行为 | 证据 | 边界含义 |
| --- | --- | --- |
| user 模式创建返回 `xml_presentation_id`、`title`、`url`，不返回 `permission_grant` | `shortcuts/slides/slides_create_test.go:23-63` | user 模式输出是创建回执，不是验证报告。 |
| 省略 `--title` 时，dry-run 和真实执行都归一为 `Untitled` | `shortcuts/slides/slides_create_test.go:200-253` | 标题归一是适合放在 shortcut 内的小型确定性便利。 |
| `--slides` 会先创建 deck，再添加页面，最后返回 `slide_ids` 和 `slides_added` | `shortcuts/slides/slides_create_test.go:285-352` | 页面创建是容器创建后的编排。 |
| `--slides []` 等价于不传 slides | `shortcuts/slides/slides_create_test.go:532-570` | 空产物列表应是明确的无追加操作，不应触发特殊生成逻辑。 |
| 非法 JSON 和超过 10 个内联 slides 会以 `Param == "--slides"` 的校验错误失败 | `shortcuts/slides/slides_create_test.go:422-505` | 输入契约错误必须结构化，便于调用方路由处理。 |
| 后端缺少 `xml_presentation_id` 时失败 | `shortcuts/slides/slides_create_test.go:255-283` | 创建成功必须拿到可用资源 id。 |
| URL fallback 在本地构造，不调用 Drive metas 或 batch query | `shortcuts/slides/slides_create_test.go:649-688` | 能用本地回执构造的内容，不应增加额外 API 依赖。 |
| 图片占位符按唯一路径上传一次，并在页面创建前完成替换 | `shortcuts/slides/slides_create_test.go:751-854` | 素材处理是发布边界的管道能力，不是设计工作。 |
| 本地占位符文件缺失时，在任何 API 调用前失败 | `shortcuts/slides/slides_create_test.go:856-877` | 本地产物存在性是发布前置条件。 |
| Dry-run 暴露 API 计划形状和占位 id | `shortcuts/slides/slides_create_test.go:572-602`、`shortcuts/slides/slides_create_test.go:879-900` | Dry-run 应描述编排计划，而不是执行重型校验副作用。 |
| Readback 在 E2E 中作为单独 follow-up 调用证明 | `tests/cli_e2e/slides/slides_create_workflow_test.go:32-85`、`tests/cli_e2e/slides/coverage.md:9-16` | Readback 是测试和交付证据，不是默认 `Execute` 行为。 |
| Bot 授权是非致命三态：granted、skipped、failed | `shortcuts/slides/slides_create_test.go:66-198` | 便利性的后置动作不应把创建成功升级成失败。 |

## `slides +create` 不负责的事情

| 非职责 | 证据 | 对 `+create-svglide` 的设计含义 |
| --- | --- | --- |
| 不从 prompt 生成 slide XML | `shortcuts/slides/slides_create.go:40-43`、`shortcuts/slides/slides_create.go:158-205` | `+create-svglide` 不能变成 `--topic -> deck`。 |
| 不深度校验 slide XML 语义 | `shortcuts/slides/slides_create.go:44-69` | shortcut 内只应放发布阻塞级的最小校验。 |
| 不预览或修复布局 | `shortcuts/slides/slides_create.go:125-221` | preview 和 repair 属于发布前的 skill/scripts 或 runner。 |
| 不在 `Execute` 内做 readback | `shortcuts/slides/slides_create.go:125-221`、`tests/cli_e2e/slides/slides_create_workflow_test.go:68-85` | Readback 是测试/证明步骤，不是默认 shortcut 行为。 |
| 不保证原子创建 | `shortcuts/slides/slides_create.go:194-196`、`shortcuts/slides/slides_create_test.go:354-420` | 新发布类 shortcut 应提供恢复上下文，而不是隐藏部分成功。 |
| 不处理超过 10 个内联页面 | `shortcuts/slides/slides_create.go:18-21`、`shortcuts/slides/slides_create_test.go:441-465` | 第一版应设边界，而不是一开始实现复杂批处理器。 |
| 不负责视觉质量 | `skills/lark-slides/SKILL.md:91-127`、`skills/lark-slides/SKILL.md:153-160` | 视觉质量门禁应发生在 shortcut 消费产物之前。 |

## 反例

| 诱人的需求 | 为什么看起来合理 | `slides +create` 给出的约束 |
| --- | --- | --- |
| 默认加入 readback | E2E 用 readback 证明持久化。 | E2E 是创建后另调 get API；`Execute` 输出创建结果后即结束。Readback 应保持可选或放在 MVP 外。 |
| 调后端前语义校验每一页 | 本地错误更友好。 | `+create` 只校验 JSON 形状、页数、本地占位符文件；XML 解析由后端负责。SVGlide 也只校验发布路由必需字段。 |
| 运行 preview lint 并自动 repair | SVGlide 有 preview 工具链。 | `+create` 不做布局判断。Preview lint 和 repair 应留在发布前工具链。 |
| 接受 prompt 并生成 deck | 高层 UX 很吸引人。 | `+create` 消费最终提交物。Prompt-to-deck runner 应是另一层命令或脚本。 |
| 通过自动重试/重建隐藏部分失败 | 看起来更友好。 | `+create` 暴露部分进度。恢复应该显式、可续跑。 |

## `slides +create-svglide` 允许新增的职责

`+create-svglide` 只能在 SVGlide 输入契约强制要求的地方比 `+create` 稍重。新增工作仍必须属于发布边界，而不是生成边界。

| 额外职责 | 允许原因 | 限制 |
| --- | --- | --- |
| 读取 SVGlide manifest 或 run directory | 与 `--slides` 不同，SVGlide 产物是文件型产物。 | 立即归一化为一个 manifest 模型；不要推断设计意图。 |
| 校验 manifest schema 和页序 | 需要知道要发布什么。 | 只校验形状和必填字段。 |
| 校验页面文件存在性和路径安全 | 等价于 `+create` 校验 `@path` 占位符。 | 不检查美观度或文本质量。 |
| 校验发布必需的 SVGlide 字段 | 目标发布 API 或 parser 可能需要 namespace、contract/version、尺寸或 role 才能接收页面。 | 只检查必需标记；不要在 shortcut 中把普通 SVG 重写成协议 SVG。 |
| 上传声明的本地素材 | 等价于 `+create` 上传 `@path` 图片。 | 只做上传和 token 替换；不做素材搜索或生成。 |
| 把 SVGlide 页面提交给目标发布 API | 等价于 `+create` 提交每个 slide XML 字符串。 | 保持输出和部分进度语义明确；如果后端能直接消费 SVGlide，不要假设 CLI 必须转 XML。 |

## `slides +create-svglide` 必须不拥有的职责

| 职责 | 所属边界 |
| --- | --- |
| research、outline、design brief、slide content planning | `skills/lark-slides` 指导和外部 runner/scripts |
| SVG authoring | agent 或 runner，在发布前完成 |
| preview rendering、preview lint、repair loop | skill scripts 或 runner，在发布前完成 |
| 视觉质量评分 | skill/scripts/quality gate，不属于 shortcut `Execute` |
| readback 作为默认成功标准 | E2E 或可选验证 flag |
| PPE/Whistle 路由进入核心命名 | 只能属于环境/profile 层 |

## MVP 范围

推荐第一版实现：

```bash
lark-cli slides +create-svglide --manifest ./svglide-run/manifest.json --as user
```

MVP 行为：

1. 解析 manifest。
2. 校验必填字段、页序、文件存在性、路径安全、尺寸、最小 SVGlide contract 标记。
3. 创建 presentation 外壳。
4. 上传 manifest 声明的本地素材。
5. 把页面提交给后端。
6. 输出 `xml_presentation_id`、`url`、`page_ids` 或 `slide_ids`、上传素材数量，以及失败时的部分进度上下文。

MVP 排除项：

1. 不接受 prompt 输入。
2. 不包含生成阶段。
3. 不做 preview repair。
4. 不默认 readback。
5. 不在命令名、目录名或类型名中包含 PPE。

## `+create-svglide` 测试边界

第一版测试应镜像 `slides +create` 的测试形状，而不是证明完整 SVGlide 生成流水线。

| 测试范围 | 必须证明 |
| --- | --- |
| 输入契约 | 非法 manifest、缺失页面文件、不安全路径、不支持的页数以结构化 param 失败。 |
| Dry-run | 展示 create、asset upload、page publish 步骤，包含占位 presentation id 和确定性的 step label。 |
| 素材处理 | 重复本地素材只上传一次；页面 payload 在发布前引用已上传 token。 |
| 部分失败 | deck 已存在但第 N 页失败时，错误包含 presentation id、失败页序号、已成功发布页数。 |
| Bot grant | 继承 `slides +create` 的 user/bot 输出行为；grant 失败不升级成 create 失败。 |
| E2E | 先断言 create/publish 结果；可选 readback 作为单独证明步骤，除非命令显式加入 `--readback` 契约。 |

## Team 结论

适合研究这个边界的 team 是：

| 角色 | 范围 |
| --- | --- |
| Code Reader | 从 Go 实现中抽取运行时职责。 |
| Test Reader | 抽取行为锁定点，并证明哪些行为不在 `Execute` 内。 |
| Skill Boundary Reader | 区分 agent/script 职责和 shortcut 职责。 |
| Architect/Skeptic | 拒绝过宽 scope，只把已被 `+create` 证明的模式映射到 `+create-svglide`。 |

这个 team 的证明标准不是“读过文件”，而是：

```text
每一个 proposed +create-svglide 职责都必须映射到：
1. 一个已有 +create 职责；或
2. 一个由 SVGlide 产物输入形态强制产生的最小额外职责。
```
