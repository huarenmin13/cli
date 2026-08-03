// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

// TestBaseCapabilityGuidance pins behavior-bearing agent guidance shipped with
// the CLI, not Markdown formatting.
func TestBaseCapabilityGuidance(t *testing.T) {
	read := func(path string) string {
		t.Helper()
		content, err := vfs.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		return strings.Join(strings.Fields(string(content)), " ")
	}
	require := func(text, want, failure string) {
		t.Helper()
		if !strings.Contains(text, want) {
			t.Fatal(failure)
		}
	}

	skill := read("../../skills/lark-base/SKILL.md")
	fieldJSON := read("../../skills/lark-base/references/lark-base-field-json.md")

	require(skill, "当前不支持视图行高、冻结列、列宽等 UI-only 外观设置", "lark-base skill missing the unsupported view appearance boundary")
	require(skill, "说明能力边界并停止", "lark-base skill missing the unsupported view stop behavior")
	require(skill, "不要猜测未文档化参数或改走 raw API", "lark-base skill missing the raw API refusal behavior")
	require(skill, "请求字段类型不在 reference 已支持类型目录中时", "lark-base skill missing the unsupported field type boundary")
	require(skill, "说明当前 CLI 不支持并停止", "lark-base skill missing the unsupported field stop behavior")
	require(fieldJSON, "直接说明 Base CLI 当前不支持并停止", "field JSON reference missing the unsupported field stop behavior")
	require(fieldJSON, "不要猜测未注册的字段 JSON、service 或 schema，也不要用其他字段类型冒充目标能力", "field JSON reference missing the unsupported field refusal behavior")
}
