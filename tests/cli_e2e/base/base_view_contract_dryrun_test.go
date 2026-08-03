// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"testing"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
)

func TestBaseViewContractDryRun(t *testing.T) {
	t.Run("create gantt view", func(t *testing.T) {
		result := runBaseDryRun(t, 0,
			"base", "+view-create",
			"--base-token", "app_x",
			"--table-id", "tbl_new",
			"--json", `{"name":"Schedule","type":"gantt"}`,
		)

		out := result.Stdout
		require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_new/views", clie2e.DryRunGet(out, "api.0.url").String(), out)
		require.Equal(t, "POST", clie2e.DryRunGet(out, "api.0.method").String(), out)
		require.Equal(t, "Schedule", clie2e.DryRunGet(out, "api.0.body.name").String(), out)
		require.Equal(t, "gantt", clie2e.DryRunGet(out, "api.0.body.type").String(), out)
	})

	t.Run("set visible fields", func(t *testing.T) {
		result := runBaseDryRun(t, 0,
			"base", "+view-set-visible-fields",
			"--base-token", "app_x",
			"--table-id", "tbl_new",
			"--view-id", "vew_new",
			"--json", `{"visible_fields":["Title","Status"]}`,
		)

		out := result.Stdout
		require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_new/views/vew_new/visible_fields", clie2e.DryRunGet(out, "api.0.url").String(), out)
		require.Equal(t, "PUT", clie2e.DryRunGet(out, "api.0.method").String(), out)
		require.Equal(t, "Title", clie2e.DryRunGet(out, "api.0.body.visible_fields.0").String(), out)
		require.Equal(t, "Status", clie2e.DryRunGet(out, "api.0.body.visible_fields.1").String(), out)
		require.False(t, clie2e.DryRunGet(out, "api.0.body.freeze").Exists(), out)
		require.False(t, clie2e.DryRunGet(out, "api.0.body.frozen").Exists(), out)
	})
}
