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

func TestBaseRecordHistoryListDryRunUsesExplicitRecordID(t *testing.T) {
	result := runBaseDryRun(t, 0,
		"base", "+record-history-list",
		"--base-token", "app_x",
		"--table-id", "tbl_x",
		"--record-id", "rec_confirmed",
		"--page-size", "10",
	)

	out := result.Stdout
	require.Equal(t, "GET", gjson.Get(out, "data.api.0.method").String(), out)
	require.Equal(t, "/open-apis/base/v3/bases/app_x/record_history", gjson.Get(out, "data.api.0.url").String(), out)
	require.Equal(t, "app_x", gjson.Get(out, "data.base_token").String(), out)
	require.Equal(t, "tbl_x", gjson.Get(out, "data.api.0.params.table_id").String(), out)
	require.Equal(t, "rec_confirmed", gjson.Get(out, "data.api.0.params.record_id").String(), out)
	require.Equal(t, int64(10), gjson.Get(out, "data.api.0.params.page_size").Int(), out)
}

func TestBaseRecordHistoryListDryRunRejectsNonPositiveMaxVersion(t *testing.T) {
	for _, value := range []string{"0", "-1"} {
		t.Run(value, func(t *testing.T) {
			result := runBaseDryRun(t, 2,
				"base", "+record-history-list",
				"--base-token", "app_x",
				"--table-id", "tbl_x",
				"--record-id", "rec_confirmed",
				"--max-version", value,
			)

			require.Equal(t, "validation", gjson.Get(result.Stderr, "error.type").String(), result.Stderr)
			require.Equal(t, "invalid_argument", gjson.Get(result.Stderr, "error.subtype").String(), result.Stderr)
			require.Equal(t, "--max-version", gjson.Get(result.Stderr, "error.param").String(), result.Stderr)
			require.Contains(t, gjson.Get(result.Stderr, "error.message").String(), "must be greater than 0")
			require.Empty(t, result.Stdout)
		})
	}
}

func TestBaseRecordHistoryListHelpShowsConfirmedRowGuard(t *testing.T) {
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args:      []string{"base", "+record-history-list", "--help"},
		DefaultAs: "bot",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 0)

	require.Contains(t, result.Stdout, "record ID for one user-confirmed row")
	require.Contains(t, result.Stdout, "never infers a row from list order")
	require.Contains(t, result.Stdout, "--view-id <view_id> --offset N-1 --limit 1")
	require.Contains(t, result.Stdout, "take the top-level _record_id metadata")
	require.Contains(t, result.Stdout, "never expand a single-record request into a multi-record scan")
	require.Contains(t, result.Stdout, "Use --format pretty for human-readable local timestamps")
	require.Contains(t, result.Stdout, "including the UTC offset")
	require.Contains(t, result.Stdout, "default JSON output remains unchanged")
	require.Contains(t, result.Stdout, "+record-list")
}
