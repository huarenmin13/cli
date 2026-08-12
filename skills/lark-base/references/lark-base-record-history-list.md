# base +record-history-list

查询单条记录的变更历史。它返回历史事件，不返回记录当前值，也不支持整表审计扫描。

## 使用前置：必须先确认唯一行

`+record-history-list` 的目标始终是一条由用户确认的记录。调用前必须同时具备同一张表的 `table_id` 和以下任一行选择器：

- URL 解析直接返回的 `record_id`；
- 用户明确提供并确认的 `record_id`；
- 用户明确确认可唯一定位该行的主字段值、自动编号、序号或唯一筛选条件；
- 用户明确指定带 `view_id` 的当前视图位置（例如“第 N 行”）。位置选择器必须先用 `+record-list --view-id <view_id> --offset N-1 --limit 1` 配合最少字段解析成唯一 `record_id`，不能直接把“第 N 行”传给本命令。

如果只有 Base/Wiki/表/视图链接，或 `+url-resolve` 只定位到表/视图而没有 `record_id`，且用户没有明确给出位置、字段值或其它唯一筛选条件，先向用户索取或确认行选择器。可以用最少字段的 `+record-list` 展示候选摘要来辅助提问，但在用户选定前不得调用本命令。用户明确说“当前视图第 N 行”时，按上面的 offset 规则确定性解析；这不是默认选择第一条。

在用户没有明确指定位置时，禁止把当前视图第一条、最新一条、任意候选或默认排序的记录当作目标。也不要把一个单记录请求自行扩展成批量或整表扫描；用户明确要求多条记录时，先确认目标范围，再对每条记录分别调用本命令。

### 正例与反例

可以：用户提供包含 `record_id` 的记录链接，或从候选摘要中明确确认某一条记录，再使用该 `record_id` 查询历史。

可以：用户明确要求当前视图第 N 行，且解析结果有 `view_id`；先用 `+record-list --view-id <view_id> --offset N-1 --limit 1` 读取顶层 `_record_id` 元数据，再查询该行历史。`_record_id` 不是业务字段，不要猜测或投影名为“记录 ID”的字段。

不可以：用户只给 Base/Wiki/表/视图链接、没有指定行时，运行 `+url-resolve` 后用 `+record-list --limit 1` 取首条并直接调用 `+record-history-list`；也不可以因缺少行选择器而自行扫描整表历史。

## 推荐命令

```bash
lark-cli base +record-history-list \
  --base-token <base_token> \
  --table-id <table_id> \
  --record-id <record_id>

lark-cli base +record-history-list \
  --base-token <base_token> \
  --table-id <table_id> \
  --record-id <record_id> \
  --page-size 30 \
  --max-version <next_max_version>

lark-cli base +record-history-list \
  --base-token <base_token> \
  --table-id <table_id> \
  --record-id <record_id> \
  --format pretty
```

## 返回解释

- 历史条目通常按版本号降序返回，最新在前。
- 每条历史包含版本号、操作人、操作时间、操作类型和字段变更。
- 默认 JSON 中的 `create_time` 是秒级 Unix 时间戳；`--format pretty` 会将其转换为带 UTC 偏移的本地时间，并和操作人、字段变化放在同一行。
- `field_changes` 描述字段变更，重点看字段名/字段类型、`before` 和 `after`。
- `--format pretty` 中空的 `before` 或 `after` 显示为 `-`；默认 JSON 保留原始值。
- `activity_type` 常见值：`create`（创建记录）、`update`（编辑记录）、`delete`（删除记录）。

以下字段类型的变化可能不会出现在 `field_changes` 中：

- 计算字段：`formula`、`lookup`
- 系统字段：自动编号、创建时间、创建人、修改时间、修改人

## 翻页

- 首次请求不传 `--max-version`。
- 如果返回 `has_more=true`，取返回中的 `next_max_version` 作为下一次请求的 `--max-version`。
- `--page-size` 默认 30，最大 50。

## 注意

- `table-id` 和 `record-id` 必须来自同一张表。
- 这是单条记录历史，不是表级审计；用户明确要求多条记录时，先确认目标范围，再分别调用。
