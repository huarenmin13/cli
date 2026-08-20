// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"
)

const baseRecordAnalysisSOP = "../../skills/lark-base/references/lark-base-record-query-and-analysis-sop.md"
const baseRecordAnalysisCloudSOP = "../../skills/lark-base/references/lark-base-record-query-and-analysis-cloud-sop.md"
const baseSkillContract = "../../skills/lark-base/SKILL.md"

func TestBaseSkillScopesPrimaryResultIsolationToCompetingContracts(t *testing.T) {
	doc := readSkillContractFile(t, baseSkillContract)
	for _, contract := range []string{
		"存在会实质改变结论的多个候选口径",
		"先固定主计算合同",
		"最终结论只从已验收的主结果派生",
		"补充口径不得改写",
	} {
		if !strings.Contains(doc, contract) {
			t.Errorf("base skill must contain %q", contract)
		}
	}
}

func TestBaseRecordAnalysisSkillContractPreservesPrimaryCalculation(t *testing.T) {
	doc := readSkillContractFile(t, baseRecordAnalysisSOP)
	start := strings.Index(doc, "### 确定性计算合同")
	end := strings.Index(doc, "### NDJSON 读取示例")
	if start < 0 || end <= start {
		t.Fatalf("missing deterministic calculation contract in %s", baseRecordAnalysisSOP)
	}

	section := doc[start:end]
	for _, contract := range []string{
		"目标粒度和分组维度",
		"主分组维度组合",
		"比率必须写成 `分子 / 分母`",
		"不得静默从分母排除",
		"不能覆盖主口径",
		"不得为了让它与另一字段或另一张表的总额一致而自行缩放、换算或分摊",
		"总量守恒是发现冲突的校验，不是发明转换的依据",
		"先生成范围内的完整时间轴",
		"`0 / 0` 时标记 `N/A`",
		"不能以结果更新、数值更大或更符合直觉为由让后算出的结果推翻",
		"不得用它给出相反的主趋势判断",
	} {
		if !strings.Contains(section, contract) {
			t.Errorf("calculation contract must contain %q", contract)
		}
	}
}

func TestBaseRecordAnalysisSkillContractRequiresProofGates(t *testing.T) {
	doc := readSkillContractFile(t, baseRecordAnalysisSOP)
	start := strings.Index(doc, "### 两次验收门禁")
	end := strings.Index(doc, "### NDJSON 读取示例")
	if start < 0 || end <= start {
		t.Fatalf("missing analysis proof gates in %s", baseRecordAnalysisSOP)
	}

	section := doc[start:end]
	for _, contract := range []string{
		"需要覆盖完整查询范围",
		"最后一页 Record manifest 明示 `has_more=false`",
		"`has_more=true` 或状态未知就停止",
		"不能用另一项的完成状态代替",
		"前 N 条或预览样本",
		"结果不得外推",
		"不要求表尾 `has_more=false`",
		"`+data-query` 已在云端完成聚合、排序或限制时，不要求 Record manifest",
		"用户任务、计算合同、计算结果和候选回答",
		"真实 schema 字段或公式",
		"范围与完整时间轴",
		"不按“惯例”指定权威字段",
		"并列展示候选结果并标明未消歧",
		"输出真实字段名及各值计数",
		"不把多个真实值改写为推断的总括标签",
	} {
		if !strings.Contains(section, contract) {
			t.Errorf("analysis proof gates must contain %q", contract)
		}
	}
}

func TestBaseRecordAnalysisSkillContractKeepsPrimaryResultOptional(t *testing.T) {
	doc := readSkillContractFile(t, baseRecordAnalysisSOP)
	start := strings.Index(doc, "### 主结果隔离（存在竞争口径时）")
	end := strings.Index(doc, "### 两次验收门禁")
	if start < 0 || end <= start {
		t.Fatalf("missing scoped primary result contract in %s", baseRecordAnalysisSOP)
	}

	section := doc[start:end]
	for _, contract := range []string{
		"不同选择会实质改变结论",
		"简单、单一口径统计",
		"不要求额外包装",
		"`primary_result.contract`",
		"`primary_result.rows`",
		"废弃旧对象并重新计算",
		"不得在现有对象上换名",
		"比率任务才保存分子、分母与比率",
		"`primary_result.total`",
		"只在度量互斥且可加时",
		"`total.status=not_applicable`",
		"`total.numerator == sum(rows[].numerator)`",
		"`total.denominator == sum(rows[].denominator)`",
		"`primary_result.trend`",
		"只在任务要求趋势且轴有序时",
		"`trend.status=not_applicable`",
		"`trend == trend(rows[].rate)`",
		"`N/A` 比较时排除",
		"在内部完整保留以供验收",
		"最终回答只按用户请求投影",
		"不默认展开高基数明细",
		"`alternatives`",
		"不得输出一个由任一替代结果驱动的无条件单一趋势结论",
	} {
		if !strings.Contains(section, contract) {
			t.Errorf("immutable primary result contract must contain %q", contract)
		}
	}

	proofStart := strings.Index(doc, "### 两次验收门禁")
	proofEnd := strings.Index(doc, "### NDJSON 读取示例")
	if proofStart < 0 || proofEnd <= proofStart {
		t.Fatalf("missing analysis proof gates in %s", baseRecordAnalysisSOP)
	}
	proofGates := doc[proofStart:proofEnd]
	for _, contract := range []string{
		"使用 `primary_result` 时",
		"简单、单一口径统计则从已验收的计算结果按合同投影",
	} {
		if !strings.Contains(proofGates, contract) {
			t.Errorf("analysis proof gates must preserve optional primary result contract %q", contract)
		}
	}
}

func TestBaseRecordAnalysisSkillContractKeepsCloudAggregationIndependentOfRecordPagination(t *testing.T) {
	recordSOP := readSkillContractFile(t, baseRecordAnalysisSOP)
	cloudSOP := readSkillContractFile(t, baseRecordAnalysisCloudSOP)

	for _, contract := range []string{
		"`+data-query` 已在云端完成聚合、排序或限制时，不要求 Record manifest",
		"若随后回查逐条原始记录，回查产生的 NDJSON 仍按前述完整性门禁验收",
	} {
		if !strings.Contains(recordSOP, contract) {
			t.Errorf("record analysis SOP must contain %q", contract)
		}
	}

	for _, contract := range []string{
		"`pagination.limit` 是 Base 云端查询服务中的结果限制，不是本地分页扫描",
		"`+data-query` 已在云端完成聚合、排序和限制时",
	} {
		if !strings.Contains(cloudSOP, contract) {
			t.Errorf("cloud analysis SOP must contain %q", contract)
		}
	}
}
