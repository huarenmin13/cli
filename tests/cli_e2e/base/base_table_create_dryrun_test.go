// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestBaseTableCreateDryRunRejectsUnknownFieldType(t *testing.T) {
	result := runBaseDryRun(t, 2,
		"base", "+table-create",
		"--base-token", "app_x",
		"--name", "Tasks",
		"--fields", `[{"name":"Generated","type":"future_generated"}]`,
	)

	require.Empty(t, result.Stdout)
	require.Equal(t, "validation", gjson.Get(result.Stderr, "error.type").String(), result.Stderr)
	require.Equal(t, "invalid_argument", gjson.Get(result.Stderr, "error.subtype").String(), result.Stderr)
	require.Equal(t, "--fields", gjson.Get(result.Stderr, "error.param").String(), result.Stderr)
	require.Contains(t, result.Stderr, `--fields.type \"future_generated\" is not supported`)
}
