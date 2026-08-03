# 视图创建与能力边界

## 支持范围

- `+view-create` 支持 `grid`、`kanban`、`gallery`、`calendar` 和 `gantt`。
- 创建后可用对应的 `+view-set-filter`、`+view-set-sort`、`+view-set-group`、`+view-set-timebar`、`+view-set-card` 和 `+view-set-visible-fields` 配置。
- `visible_fields` 只控制字段可见性和顺序，不控制冻结列、行高或列宽。当前 CLI 没有这些 UI 布局属性的命令；遇到此类请求时明确说明不支持且不写入，不要猜测子命令、raw API 端点或 `freeze` / `frozen` / `property` 字段。

## 新建语义

1. 用户明确要求“新建/新增/创建”时，必须调用 `+view-create`；执行前已有同名视图不能替代本次创建。
2. 只使用本次响应中的 `views[].id` 作为后续配置的 `--view-id`。没有新 ID 就不能宣称新建成功。
3. 同名冲突表示本次没有创建。停止并说明冲突，等待用户选择新名称或明确改为复用；不得改写旧视图冒充新视图。
4. 一次创建多个视图时逐个调用，避免后项失败后无法判断前项状态。后项失败不代表前项未创建，不要重试已成功的项。
5. 仅当用户表达“确保存在/若不存在则创建”时，才可在确认已有资源满足要求后 no-op。

配置甘特视图时，先拿到本次新 `view_id`，再按用户要求设置 filter、sort、group 和 timebar；每一步都指向该新 ID。
