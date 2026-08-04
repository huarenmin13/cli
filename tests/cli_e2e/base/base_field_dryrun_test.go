// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"testing"
	"time"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestBaseFieldCreateDryRunArrayCompat(t *testing.T) {
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{
			"base", "+field-create",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--json", `[{"name":"A","type":"text"},{"name":"B","type":"text"}]`,
			"--dry-run",
		},
		DefaultAs: "bot",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 0)

	out := result.Stdout
	require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_x/fields", clie2e.DryRunGet(out, "api.0.url").String(), out)
	require.Equal(t, "POST", clie2e.DryRunGet(out, "api.0.method").String(), out)
	require.Equal(t, "A", clie2e.DryRunGet(out, "api.0.body.name").String(), out)
	require.Equal(t, "text", clie2e.DryRunGet(out, "api.0.body.type").String(), out)

	require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_x/fields", clie2e.DryRunGet(out, "api.1.url").String(), out)
	require.Equal(t, "POST", clie2e.DryRunGet(out, "api.1.method").String(), out)
	require.Equal(t, "B", clie2e.DryRunGet(out, "api.1.body.name").String(), out)
	require.Equal(t, "text", clie2e.DryRunGet(out, "api.1.body.type").String(), out)
}

func TestBaseFieldGetDryRun(t *testing.T) {
	result := runBaseDryRun(t, 0,
		"base", "+field-get",
		"--base-token", "app_x",
		"--table-id", "tbl_x",
		"--field-id", "Status",
	)
	require.Equal(t, "GET", clie2e.DryRunGet(result.Stdout, "api.0.method").String(), result.Stdout)
	require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_x/fields/Status", clie2e.DryRunGet(result.Stdout, "api.0.url").String(), result.Stdout)
}

func TestBaseFieldCreateDryRunRejectsUnknownType(t *testing.T) {
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{
			"base", "+field-create",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--json", `{"name":"Generated","type":"future_generated"}`,
			"--dry-run",
		},
		DefaultAs: "bot",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 2)

	require.Empty(t, result.Stdout)
	require.Equal(t, "validation", gjson.Get(result.Stderr, "error.type").String(), result.Stderr)
	require.Equal(t, "invalid_argument", gjson.Get(result.Stderr, "error.subtype").String(), result.Stderr)
	require.Equal(t, "--json", gjson.Get(result.Stderr, "error.param").String(), result.Stderr)
	require.Contains(t, result.Stderr, `--json.type \"future_generated\" is not supported`)
	require.Contains(t, result.Stderr, "Allowed field types")
	require.Contains(t, result.Stderr, "report it as unsupported")
	require.Contains(t, result.Stderr, "do not substitute another field type")
	require.Contains(t, result.Stderr, "explicit user approval")
}
