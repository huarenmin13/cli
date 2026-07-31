// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func readCapabilityContract(t *testing.T, path string) string {
	t.Helper()

	content, err := vfs.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return strings.Join(strings.Fields(string(content)), " ")
}

func TestBaseSkillDocumentsCapabilityBoundaries(t *testing.T) {
	skill := readCapabilityContract(t, "../../skills/lark-base/SKILL.md")

	for _, want := range []string{
		"Base 视图写能力只覆盖 name、filter、sort、group、card、timebar 和 visible_fields",
		"UI-only 外观设置不支持",
		"当前没有单表复制原子 shortcut",
		"只有用户同时要求新建视图时",
		"请求字段类型不在 reference 已支持类型目录中时",
		"不要猜测未注册的字段 JSON、service 或 schema",
	} {
		if !strings.Contains(skill, want) {
			t.Fatalf("lark-base skill missing %q", want)
		}
	}

	for _, forbidden := range []string{
		"base_table_",
		"--on-name-conflict=rename",
		"lark-cli schema translation",
		"lark-cli service",
	} {
		if strings.Contains(skill, forbidden) {
			t.Fatalf("lark-base skill contains specialized guidance %q", forbidden)
		}
	}
}

func TestBaseFieldJSONDocumentsUnsupportedFieldBoundary(t *testing.T) {
	fieldJSON := readCapabilityContract(t, "../../skills/lark-base/references/lark-base-field-json.md")

	for _, want := range []string{
		"翻译 / AI 翻译 / `translation` 字段暂时也没有被 CLI 支持",
		"不要猜测未注册的字段 JSON、service 或 schema",
		"不要用其他字段类型冒充目标能力",
	} {
		if !strings.Contains(fieldJSON, want) {
			t.Fatalf("field JSON reference missing %q", want)
		}
	}
}
