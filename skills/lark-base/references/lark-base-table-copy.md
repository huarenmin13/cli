# 单表复制

当用户要求在同一个 Base 中复制一个数据表时使用本流程。`+base-copy` 会复制整个 Base，不能代替单表复制；当前没有 `+table-copy` 原子命令。

## 完成条件

- 本次 `+table-create` 返回了新的 `table_id`。
- 需要复制记录时，所有分页均已处理且写入新表。
- 需要新视图时，本次 `+view-create` 返回了新的 `view_id`，后续配置均指向该 ID。
- 执行前已存在的同名表、同名视图或正确的最终配置都不是本次复制证据，不得复用或改写后宣称复制成功。

## 固定流程

1. 用 `+table-get --table-id <source>` 读取源表的真实 `table_id`、字段和视图。
2. 读取 [lark-base-field-json.md](lark-base-field-json.md)，把源字段投影为可创建的字段 JSON。不要把读取响应原样提交。
3. 如果必需字段不能忠实重建，停止并说明限制，不要创建部分副本。`formula`、`lookup` 和系统字段不能作为普通记录值复制；关联字段需要目标 record ID 映射，附件需要附件复制路径。只有用户明确接受省略范围后才继续。
4. 用 `+table-create --name <new> --fields <mapped-fields>` 创建新表，并保存本次返回的新 `table_id`。同名冲突表示本次未创建；不要改写或复用旧表。
5. 需要记录时，使用 `+record-list --format json --limit 200 --offset 0` 读取第一页，只投影已映射字段。按当页 `field_id_list` 重排值后，用 `+record-batch-create` 串行写入新表；每次按实际返回条数增加 `--offset`，直到 `has_more=false`。单批不得超过 200 条。
6. 需要视图时，用 `+view-create` 在新 `table_id` 下创建视图，再用本次返回的新 `view_id` 设置 filter、sort、group、timebar 或 visible fields。创建甘特视图时，依次执行 create、filter、sort、group、timebar。
7. 写入返回不足或用户明确要求核验时，回读新表和新视图，检查新 ID、记录数量与配置。不要用源表或旧同名资源完成核验。

任何步骤失败都必须保留已创建资源的真实状态并报告失败位置；不要从头重跑整个流程，以免重复创建表或记录。
