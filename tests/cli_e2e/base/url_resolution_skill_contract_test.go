// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func TestBaseSkillDocumentsVersionIndependentURLRouting(t *testing.T) {
	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller could not locate the test file")
	}

	skillPath := filepath.Join(
		filepath.Dir(testFile),
		"..", "..", "..",
		"skills", "lark-base", "SKILL.md",
	)
	content, err := vfs.ReadFile(skillPath)
	if err != nil {
		t.Fatalf("read Base skill: %v", err)
	}

	skill := string(content)
	contracts := []struct {
		name string
		text string
	}{
		{name: "plain Base URL shape", text: "URL path 恰好是 `/base/<base_token>`"},
		{name: "plain URL excludes coordinates", text: "URL 不含 query 参数或 fragment"},
		{name: "direct token path", text: "直接使用该 path segment 作为 `base_token`"},
		{name: "skip unnecessary resolver", text: "不要为这个无歧义路径调用 `+url-resolve`"},
		{name: "documented shortcuts skip help", text: "本 Skill 已明确列出的 `+...` shortcut 可直接调用"},
		{name: "complex link directly uses resolver", text: "直接调用 `lark-cli base +url-resolve --url \"<url>\" --as user`"},
		{name: "complex link skips help", text: "不要先运行 `lark-cli base --help`"},
		{name: "coordinate URL uses resolver", text: "query 坐标的 Base URL 必须走 resolver"},
		{name: "unknown resolver command stops", text: "resolver 返回 unknown command / unknown subcommand"},
		{name: "missing command recovery", text: "停止并建议用户运行 `lark-cli update`"},
		{name: "do not build missing command", text: "不要尝试 `go run`、重新构建或搜索源码"},
		{name: "do not guess grouped command", text: "不要猜测 `lark-cli base workflow`"},
		{name: "do not guess complex-link token", text: "不要把 wiki/share/form token 猜成 `base_token`"},
	}

	for _, contract := range contracts {
		t.Run(contract.name, func(t *testing.T) {
			if !strings.Contains(skill, contract.text) {
				t.Errorf("Base skill must contain %q", contract.text)
			}
		})
	}

	for _, forbidden := range []string{
		"先运行 `lark-cli base --help`；只有",
		"只有 help 中列出 `+url-resolve` 时才调用",
	} {
		if strings.Contains(skill, forbidden) {
			t.Errorf("Base skill must not require a resolver help preflight: %q", forbidden)
		}
	}
}
