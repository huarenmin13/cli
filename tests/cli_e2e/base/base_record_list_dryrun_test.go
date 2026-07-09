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

func TestBaseRecordListDryRunAcceptsFieldsAlias(t *testing.T) {
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{
			"base", "+record-list",
			"--base-token", "app_x",
			"--table-id", "tbl_x",
			"--fields", `["Name","Age"]`,
			"--limit", "3",
			"--dry-run",
		},
		DefaultAs: "user",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 0)

	out := result.Stdout
	require.Equal(t, "GET", gjson.Get(out, "api.0.method").String(), out)
	require.Equal(t, "/open-apis/base/v3/bases/app_x/tables/tbl_x/records?field_id=Name&field_id=Age&limit=3&offset=0", gjson.Get(out, "api.0.url").String(), out)
}
