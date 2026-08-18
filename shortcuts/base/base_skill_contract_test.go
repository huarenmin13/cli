// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"
)

func TestBaseWorkflowSkillDistinguishesOperationalIntent(t *testing.T) {
	normalizedSkill := strings.Join(strings.Fields(readSkillContractFile(t, larkBaseSkillDoc)), " ")
	for _, want := range []string{
		"Workflow 定义与运行状态",
		"create 返回 `status=disabled`",
		"明确要求启用或恢复",
		"请求本身明确要求产生运行效果",
		"每周提醒我",
		"到期通知负责人",
		"满足条件自动更新",
		"仅创建或修改定义、草稿或模板",
		"不授权改变运行状态",
		"更新既有 Workflow 前先用 `+workflow-get` 读取并默认保持现有状态",
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
		"新建供实际使用",
		"默认视为需要生效",
	} {
		if strings.Contains(normalizedSkill, forbidden) {
			t.Fatalf("lark-base workflow skill contains unsafe activation contract %q", forbidden)
		}
	}
}

func TestBaseSkillKeepsDeleteTargetIdentityStable(t *testing.T) {
	normalizedSkill := strings.Join(strings.Fields(readSkillContractFile(t, larkBaseSkillDoc)), " ")
	for _, want := range []string{
		"删除前把每个请求目标绑定到用户表达的资源类型和 list/get 返回的真实 ID",
		"从发现、消歧到 delete 始终保持同一类型",
		"未唯一命中时停止",
		"不得用相似名称、筛选命中的记录、关联内容或其他类型资源替代",
		"`--yes` 只确认已绑定目标的破坏性后果",
		"UI 或展示语义只用于对 View、Form、Dashboard、Dashboard 内部 Block、Docx 等展示资源做只读候选发现",
		"除非用户明确说 Field/列、Record/数据",
		"Field 和 Record 不得作为删除候选",
		"候选类型或名称不唯一时将该目标报告为 `blocked`",
		"最终答复按请求目标报告操作结果 `deleted` / `already_absent` / `blocked`",
		"对应 list 已遍历全部分页且零精确匹配",
		"精确 get/delete 返回 `not_found`",
		"本轮未发生变更",
		"不得写成删除成功",
	} {
		if !strings.Contains(normalizedSkill, want) {
			t.Fatalf("lark-base skill missing delete target identity contract %q", want)
		}
	}

	if strings.Contains(normalizedSkill, "views、fields、forms") {
		t.Fatal("ambiguous UI nouns must not make fields a default deletion candidate")
	}
}

func TestRecordBatchCreateReferenceRequiresIncrementalKeyDiff(t *testing.T) {
	normalizedReference := strings.Join(strings.Fields(readSkillContractFile(t, "../../skills/lark-base/references/lark-base-record-batch-create.md")), " ")
	for _, want := range []string{
		"`+record-batch-create` 只创建，不会按业务字段自动查重",
		"全新导入且每个输入行都应成为独立记录时可直接创建",
		"向已有表增量补齐或用户要求避免重复时",
		"从业务语义确定稳定唯一键",
		"没有可靠唯一键时停止猜测",
		"限定本次目标范围",
		"范围内有分页时读完全部页",
		"没有规则时按原始类型和值精确比较",
		"候选键缺失、空值或无法规范化时将该行标记为 `blocked`",
		"不得放入 `create_records`",
		"现有记录存在无效键时停止写入并报告对应 `record_id`",
		"各字段值一致的重复候选才能去重为一条",
		"字段值不一致时停止并报告冲突",
		"多个现有记录共享同一键时视为已存在",
		"若用户要求更新，先报告冲突",
		"对有效候选键去重后求与现有键的差集",
		"`create_records` 只放差集中的缺失键",
		"已有键默认跳过",
		"先取得唯一对应的 `record_id`",
		"不要把已有键再次交给 batch-create",
	} {
		if !strings.Contains(normalizedReference, want) {
			t.Fatalf("record batch create reference missing incremental key contract %q", want)
		}
	}
	if strings.Contains(normalizedReference, "+record-search --filter-json") {
		t.Fatal("record-search requires keyword and search-field; do not document filter-json alone")
	}
}

func TestDashboardConfigVerificationIsScopedAndUsesMetadata(t *testing.T) {
	readNormalized := func(path string) string {
		t.Helper()
		return strings.Join(strings.Fields(readSkillContractFile(t, path)), " ")
	}

	skill := readNormalized(larkBaseSkillDoc)
	for _, want := range []string{
		"用户要求创建、更新或验证图表/看板",
		"在 Base 中长期展示统计口径",
		"Table/Field 的重命名、删除、类型变化可能影响既有 Dashboard 依赖",
		"一次性统计和仅读取已知 Block 结果不触发",
		"只核验相关组件",
		"目录、名称和 `+dashboard-block-get-data` 的计算结果都不能证明 `data_config` 正确",
	} {
		if !strings.Contains(skill, want) {
			t.Fatalf("lark-base skill missing dashboard verification contract %q", want)
		}
	}

	reference := readNormalized("../../skills/lark-base/references/lark-base-dashboard.md")
	for _, want := range []string{
		"不要扫描无关 Dashboard 或 Base 资源",
		"一次性统计时优先用 `+data-query`",
		"不自动触发配置盘点",
		"`has_more=true` 时携带 `page_token` 继续",
		"直到 `has_more=false`",
		"与用户目标或 schema 变更直接相关的组件",
		"没有读取 `data_config` 的相关组件只能标记为“未核验”",
	} {
		if !strings.Contains(reference, want) {
			t.Fatalf("dashboard guide missing scoped verification contract %q", want)
		}
	}
}
