// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func TestBaseCapabilityGuidance(t *testing.T) {
	read := func(path string) string {
		t.Helper()
		content, err := vfs.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		return strings.Join(strings.Fields(string(content)), " ")
	}

	skill := read("../../skills/lark-base/SKILL.md")
	fieldJSON := read("../../skills/lark-base/references/lark-base-field-json.md")

	if !strings.Contains(skill, "当前不支持视图行高、冻结列、列宽等 UI-only 外观设置") {
		t.Fatal("lark-base skill missing the unsupported view appearance boundary")
	}
	if !strings.Contains(skill, "当前没有 `+table-copy`；按用户要求的复制范围（schema、records、views）组合现有命令，验证遵循统一的“写入返回优先”规则") {
		t.Fatal("lark-base skill missing the single-table copy boundary")
	}
	if !strings.Contains(skill, "请求字段类型不在 reference 已支持类型目录中时") ||
		!strings.Contains(fieldJSON, "不要猜测未注册的字段 JSON、service 或 schema，也不要用其他字段类型冒充目标能力") {
		t.Fatal("lark-base guidance missing the unsupported field type boundary")
	}
}
