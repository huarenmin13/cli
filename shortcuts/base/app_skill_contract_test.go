// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

const larkBaseSkillDoc = "../../skills/lark-base/SKILL.md"

func readSkillContractFile(t *testing.T, path string) string {
	t.Helper()
	raw, err := vfs.ReadFile(path)
	if err != nil {
		t.Fatalf("read skill doc %s: %v", path, err)
	}
	return string(raw)
}

func TestBaseSkillContract_ReusedBlockConfigPreservesExplicitIntent(t *testing.T) {
	doc := readSkillContractFile(t, larkBaseSkillDoc)
	start := strings.Index(doc, "- BaseApp（应用模式）")
	end := strings.Index(doc, "- 应用页面的 block")
	if start < 0 || end <= start {
		t.Fatalf("missing BaseApp routing section in %s", larkBaseSkillDoc)
	}
	section := doc[start:end]
	for _, contract := range []string{
		"只能作为结构模板",
		"首次 Create/Update 前仍要逐项对齐用户显式要求",
		"`group_by[].sort.order`",
		"顶层 `sort.order`",
		"不能用旧配置省略的方向",
		"`get-data` 结果顺序代替",
	} {
		if !strings.Contains(section, contract) {
			t.Fatalf("BaseApp routing must contain %q:\n%s", contract, section)
		}
	}
}

func TestBaseSkillContract_AppModeConceptsAndDataConfigRelationship(t *testing.T) {
	skill := readSkillContractFile(t, larkBaseSkillDoc)
	for _, contract := range []string{
		"## 应用模式与 Workspace 心智模型",
		"Workspace 是组织 Base 和 BaseApp 的空间容器",
		"Workspace 负责资源归属，App 负责页面和组件，Base 负责数据",
	} {
		if !strings.Contains(skill, contract) {
			t.Fatalf("Base skill must contain %q", contract)
		}
	}

	appConfig := readSkillContractFile(t, "../../skills/lark-base/references/lark-base-app-block-data-config.md")
	for _, contract := range []string{
		"复用 [Dashboard Block 配置](lark-base-dashboard-block-config.md)",
		"列表组件是 App 独有协议",
		"所有列表 subtype 均可使用",
		"不能把 `filter` 提到顶层",
	} {
		if !strings.Contains(appConfig, contract) {
			t.Fatalf("App block config reference must contain %q", contract)
		}
	}

	dashboardConfig := readSkillContractFile(t, "../../skills/lark-base/references/lark-base-dashboard-block-config.md")
	for _, contract := range []string{
		"复用本文的字段取值、筛选、分组、排序及规范化规则",
		"`isGreaterEqual` / `isLessEqual` 不是全局不支持",
		"可用于 `number`，但不能用于 `datetime`",
	} {
		if !strings.Contains(dashboardConfig, contract) {
			t.Fatalf("Dashboard block config reference must contain %q", contract)
		}
	}
}

func TestBaseSkillContract_FormulaGuideBeforeUnsupportedFallback(t *testing.T) {
	skill := readSkillContractFile(t, larkBaseSkillDoc)
	start := strings.Index(skill, "### Field")
	end := strings.Index(skill, "### Record")
	if start < 0 || end <= start {
		t.Fatalf("missing Field routing section in %s", larkBaseSkillDoc)
	}
	fieldSection := skill[start:end]
	for _, contract := range []string{
		"[Formula guide](references/lark-base-field-formula.md)",
		"明确请求 Formula 创建或更新时",
		"说明不支持或改用其他字段类型前",
		"`[SourceTable].[NumericField]` 是 List",
		"`SUM([SourceTable].[NumericField])`",
	} {
		if !strings.Contains(fieldSection, contract) {
			t.Fatalf("Formula routing must contain %q:\n%s", contract, fieldSection)
		}
	}

	formulaGuide := readSkillContractFile(t, "../../skills/lark-base/references/lark-base-field-formula.md")
	if !strings.Contains(formulaGuide, "returns `tables[].name`") {
		t.Fatalf("Formula guide must describe the actual +table-list response shape")
	}
	if strings.Contains(formulaGuide, "items[].table_name") {
		t.Fatalf("Formula guide must not advertise the obsolete +table-list response shape")
	}
}

func TestBaseSkillContract_FormulaActionRequestsExecuteAndReadBack(t *testing.T) {
	skill := readSkillContractFile(t, larkBaseSkillDoc)
	start := strings.Index(skill, "### Field")
	end := strings.Index(skill, "### Record")
	if start < 0 || end <= start {
		t.Fatalf("missing Field routing section in %s", larkBaseSkillDoc)
	}
	fieldSection := skill[start:end]
	for _, contract := range []string{
		"用户已提供 Base 并明确要求创建或更新 Formula 字段时",
		"指定结果写入的目标表并要求用 Formula 产出结果时",
		"即使未使用“创建/更新”字样",
		"除非用户明确只要解释",
		"先完整阅读 [Formula guide](references/lark-base-field-formula.md)",
		"完成表/字段发现后",
		"按用户语句中的语法角色区分写入目标和引用来源",
		"`+field-create` / `+field-update`",
		"`+field-get`",
		"`+record-list`",
		"只给公式建议不算完成",
	} {
		if !strings.Contains(fieldSection, contract) {
			t.Fatalf("Formula action routing must contain %q:\n%s", contract, fieldSection)
		}
	}

	formulaGuide := readSkillContractFile(t, "../../skills/lark-base/references/lark-base-field-formula.md")
	for _, contract := range []string{
		"## Action requests and operand roles",
		"names the destination table and asks Formula to produce a result",
		"even if the request does not literally say create or update",
		"destination table",
		"source table and field",
		"Do not swap these roles",
		"read back the final Formula field with `+field-get`",
		"read a representative computed value with `+record-list`",
	} {
		if !strings.Contains(formulaGuide, contract) {
			t.Fatalf("Formula guide must contain %q", contract)
		}
	}
}
