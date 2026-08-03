// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func readBaseSkillFile(t *testing.T, path ...string) string {
	t.Helper()
	_, currentFile, _, ok := runtime.Caller(0)
	require.True(t, ok)

	skillDir := filepath.Join(filepath.Dir(currentFile), "..", "..", "..", "skills", "lark-base")
	skillPath := filepath.Join(append([]string{skillDir}, path...)...)
	content, err := vfs.ReadFile(skillPath)
	require.NoError(t, err)
	return string(content)
}

func TestBaseSkillRoutesFileImportExportToDrive(t *testing.T) {
	skill := readBaseSkillFile(t, "SKILL.md")
	require.Contains(t, skill, "文件导入/导出转 lark-drive")
	require.Contains(t, skill, "本地文件与 Base 之间的导入/导出转 `lark-drive`")
	require.Contains(t, skill, "在线复制走 `+base-copy`")
	require.NotContains(t, skill, "--only-schema")
	require.NotContains(t, skill, "--output-dir")
	require.NotContains(t, skill, "/tmp/")
}

func TestBaseFieldTypeReferenceMatchesRuntimeCatalog(t *testing.T) {
	doc := readBaseSkillFile(t, "references", "lark-base-field-json.md")
	start := strings.Index(doc, "## 2. 字段速查")
	end := strings.Index(doc, "## 3. 各类型写法")
	require.GreaterOrEqual(t, start, 0, "field JSON reference is missing its type catalog section")
	require.Greater(t, end, start, "field JSON reference is missing its type catalog section")

	documented := make(map[string]struct{})
	for _, line := range strings.Split(doc[start:end], "\n") {
		columns := strings.Split(line, "|")
		if len(columns) < 3 {
			continue
		}
		cell := columns[1]
		for {
			open := strings.IndexByte(cell, '`')
			if open < 0 {
				break
			}
			cell = cell[open+1:]
			close := strings.IndexByte(cell, '`')
			require.GreaterOrEqual(t, close, 0, "unclosed field type marker in catalog row %q", line)
			fieldType := cell[:close]
			_, duplicate := documented[fieldType]
			require.False(t, duplicate, "duplicate field type %q in reference catalog", fieldType)
			documented[fieldType] = struct{}{}
			cell = cell[close+1:]
		}
	}
	documentedTypes := make([]string, 0, len(documented))
	for fieldType := range documented {
		documentedTypes = append(documentedTypes, fieldType)
	}
	sort.Strings(documentedTypes)

	result := runBaseDryRun(t, 2,
		"base", "+field-create",
		"--base-token", "app_x",
		"--table-id", "tbl_x",
		"--json", `{"name":"Generated","type":"future_generated"}`,
	)
	hint := gjson.Get(result.Stderr, "error.hint").String()
	const prefix = "Allowed field types: "
	require.True(t, strings.HasPrefix(hint, prefix), hint)
	runtimeCatalog, _, found := strings.Cut(strings.TrimPrefix(hint, prefix), ". If the requested capability")
	require.True(t, found, hint)
	runtimeTypes := strings.Split(runtimeCatalog, ", ")
	sort.Strings(runtimeTypes)

	require.Equal(t, documentedTypes, runtimeTypes)
}
