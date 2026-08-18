// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func TestBaseWorkflowSkillDistinguishesOperationalIntent(t *testing.T) {
	content, err := vfs.ReadFile(larkBaseSkillDoc)
	if err != nil {
		t.Fatalf("read lark-base workflow contract: %v", err)
	}

	normalizedSkill := strings.Join(strings.Fields(string(content)), " ")
	for _, want := range []string{
		"Workflow 运行意图与完成门禁",
		"新建供实际使用的提醒、通知等自动化",
		"明确只要草稿或保持停用",
		"status=disabled",
		"更新既有 workflow 前先用 `+workflow-get` 读取状态并默认保持该状态",
		"不能仅因修改定义就把 disabled 改为 enabled",
		"明确要求启用、恢复运行",
		"立即开始或继续发送、触发、运行",
		"用户要求不改 workflow 或保持现有启停状态时不得改变状态",
		"+workflow-enable",
		"+workflow-get",
		"status=enabled",
		"核验前不得报告自动化已生效",
		"若已 enabled，不重复启用",
	} {
		if !strings.Contains(normalizedSkill, want) {
			t.Fatalf("lark-base workflow skill missing operational-intent contract %q", want)
		}
	}

	for _, forbidden := range []string{
		"只有明确要求“启用/开启/恢复/运行”才调用",
		"默认视为需要生效",
	} {
		if strings.Contains(normalizedSkill, forbidden) {
			t.Fatalf("lark-base workflow skill contains unsafe activation contract %q", forbidden)
		}
	}
}

func TestBaseSkillKeepsDeleteTargetIdentityStable(t *testing.T) {
	content, err := vfs.ReadFile(larkBaseSkillDoc)
	if err != nil {
		t.Fatalf("read lark-base delete contract: %v", err)
	}

	normalizedSkill := strings.Join(strings.Fields(string(content)), " ")
	for _, want := range []string{
		"删除目标身份门禁",
		"用户明确对象类型时",
		"list/get、ID 获取和 delete 命令必须保持同一类型",
		"完整列表中没有精确匹配就报告目标不存在",
		"不得改删相似名称、筛选命中的记录、关联内容或其他类型资源",
		"用户未明确类型时可以只读列出候选",
		"无法唯一确认就停止删除",
		"`--yes` 只确认已定位对象的破坏性后果",
		"不授权更换对象或对象类型",
		"删除完成态必须区分 `deleted`、`already_absent`、`blocked`",
		"完整 list/get 零精确匹配时记录 `already_absent`",
		"不要再调用 delete",
		"API `not_found` 也不能写成删除成功或发生了变更",
		"最终答复列出每个目标的状态和对应发现证据",
		"未明确资源类型时",
		"任务点名的表内盘点 views、fields、forms",
		"用 dashboard 摘要盘点该 Base 的 blocks",
		"先按名称定位",
		"只有名称可能相关的 block 才读取详情确认表数据源",
		"不要读取记录内容来猜入口",
		"不要扩展到无关表或应用模式",
		"报告实际检查范围和 `already_absent`",
		"不能把未执行的删除标为完成变更",
	} {
		if !strings.Contains(normalizedSkill, want) {
			t.Fatalf("lark-base skill missing delete target identity contract %q", want)
		}
	}
}

func TestRecordBatchCreateReferenceRequiresIncrementalKeyDiff(t *testing.T) {
	content, err := vfs.ReadFile("../../skills/lark-base/references/lark-base-record-batch-create.md")
	if err != nil {
		t.Fatalf("read record batch create reference: %v", err)
	}

	normalizedReference := strings.Join(strings.Fields(string(content)), " ")
	for _, want := range []string{
		"`+record-batch-create` 只创建，不会按业务字段自动查重",
		"全新导入且每个输入行都应成为独立记录时可直接创建",
		"向已有表增量补齐或用户要求避免重复时",
		"从业务语义确定稳定唯一键",
		"没有可靠唯一键时停止猜测",
		"限定本次目标范围",
		"范围内有分页时读完全部页",
		"对候选键去重后求差集",
		"`create_records` 只放差集中的缺失键",
		"已有键默认跳过",
		"先取得对应 `record_id`",
		"不要把已有键再次交给 batch-create",
	} {
		if !strings.Contains(normalizedReference, want) {
			t.Fatalf("record batch create reference missing incremental key contract %q", want)
		}
	}
}
