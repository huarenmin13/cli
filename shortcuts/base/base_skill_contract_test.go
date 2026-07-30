// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func TestBaseSkillKeepsCreateSemanticsLiteralAndGeneric(t *testing.T) {
	const skillPath = "../../skills/lark-base/SKILL.md"
	content, err := vfs.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("read lark-base skill: %v", err)
	}

	skill := string(content)
	normalizedSkill := strings.Join(strings.Fields(skill), " ")
	for _, want := range []string{
		"用户要求“新增/创建”时",
		"本轮 create 返回的对象、ID 或数量",
		"同名目标已存在时报告冲突",
		"不能把已有资源算作本轮新增",
		"不能静默复用或更新",
		"对每类资源只做一次必要盘点",
		"支持批量时使用批量创建",
		"继续配置本轮返回的 ID",
		"明确要求确保存在、复用或更新",
	} {
		if !strings.Contains(normalizedSkill, want) {
			t.Fatalf("lark-base skill missing %q", want)
		}
	}

	for _, forbidden := range []string{
		"base_table_",
		"larkoffice.com/base/",
		"grading_pass_rate",
	} {
		if strings.Contains(skill, forbidden) {
			t.Fatalf("lark-base skill must remain generic, found %q", forbidden)
		}
	}
}
