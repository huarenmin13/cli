// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"testing"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestBaseLocalResourceNameAliasesDryRun(t *testing.T) {
	t.Run("table get name", func(t *testing.T) {
		result := runBaseDryRun(t, 0,
			"base", "+table-get",
			"--base-token", "app_x",
			"--name", "Tasks",
		)

		require.Equal(t, "GET", clie2e.DryRunGet(result.Stdout, "api.0.method").String(), result.Stdout)
		require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/Tasks", clie2e.DryRunGet(result.Stdout, "api.0.url").String(), result.Stdout)
	})

	t.Run("field get field name", func(t *testing.T) {
		result := runBaseDryRun(t, 0,
			"base", "+field-get",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--field-name", "Status",
		)

		require.Equal(t, "GET", clie2e.DryRunGet(result.Stdout, "api.0.method").String(), result.Stdout)
		require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_x/fields/Status", clie2e.DryRunGet(result.Stdout, "api.0.url").String(), result.Stdout)
	})

	t.Run("view list table name", func(t *testing.T) {
		result := runBaseDryRun(t, 0,
			"base", "+view-list",
			"--base-token", "app_x",
			"--table-name", "Tasks",
		)

		require.Equal(t, "GET", clie2e.DryRunGet(result.Stdout, "api.0.method").String(), result.Stdout)
		require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/Tasks/views", clie2e.DryRunGet(result.Stdout, "api.0.url").String(), result.Stdout)
	})

	t.Run("canonical and alias conflict", func(t *testing.T) {
		result := runBaseDryRun(t, 2,
			"base", "+view-list",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--table-name", "Tasks",
		)

		require.Empty(t, result.Stdout)
		require.Equal(t, "validation", gjson.Get(result.Stderr, "error.type").String(), result.Stderr)
		require.Equal(t, "invalid_argument", gjson.Get(result.Stderr, "error.subtype").String(), result.Stderr)
		require.Equal(t, "--table-id", gjson.Get(result.Stderr, "error.param").String(), result.Stderr)
		require.Contains(t, result.Stderr, "--table-id and --table-name are mutually exclusive")
	})

	t.Run("aliases preserve resource name bytes", func(t *testing.T) {
		tableCanonical := runBaseDryRun(t, 0,
			"base", "+table-get",
			"--base-token", "app_x",
			"--table-id", " Tasks ",
		)
		tableAlias := runBaseDryRun(t, 0,
			"base", "+table-get",
			"--base-token", "app_x",
			"--name", " Tasks ",
		)
		require.Equal(t,
			clie2e.DryRunGet(tableCanonical.Stdout, "api.0.url").String(),
			clie2e.DryRunGet(tableAlias.Stdout, "api.0.url").String(),
		)
		require.Contains(t, clie2e.DryRunGet(tableAlias.Stdout, "api.0.url").String(), "%20Tasks%20")

		fieldCanonical := runBaseDryRun(t, 0,
			"base", "+field-get",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--field-id", " Status ",
		)
		fieldAlias := runBaseDryRun(t, 0,
			"base", "+field-get",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--field-name", " Status ",
		)
		require.Equal(t,
			clie2e.DryRunGet(fieldCanonical.Stdout, "api.0.url").String(),
			clie2e.DryRunGet(fieldAlias.Stdout, "api.0.url").String(),
		)
		require.Contains(t, clie2e.DryRunGet(fieldAlias.Stdout, "api.0.url").String(), "%20Status%20")
	})
}
