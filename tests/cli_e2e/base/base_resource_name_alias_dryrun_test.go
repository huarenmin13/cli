// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"testing"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
)

func TestBaseLocalResourceNameAliasesDryRun(t *testing.T) {
	tests := []struct {
		name    string
		args    []string
		wantURL string
	}{
		{
			name:    "table get name",
			args:    []string{"base", "+table-get", "--base-token", "app_x", "--name", "Tasks"},
			wantURL: "/open-apis/base/v3/bases/app_x/tables/Tasks",
		},
		{
			name:    "field get field name",
			args:    []string{"base", "+field-get", "--base-token", "app_x", "--table-id", "tbl_x", "--field-name", "Status"},
			wantURL: "/open-apis/base/v3/bases/app_x/tables/tbl_x/fields/Status",
		},
		{
			name:    "view list table name",
			args:    []string{"base", "+view-list", "--base-token", "app_x", "--table-name", "Tasks"},
			wantURL: "/open-apis/base/v3/bases/app_x/tables/Tasks/views",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := runBaseDryRun(t, 0, test.args...)
			require.Equal(t, "GET", clie2e.DryRunGet(result.Stdout, "api.0.method").String(), result.Stdout)
			require.Equal(t, test.wantURL, clie2e.DryRunGet(result.Stdout, "api.0.url").String(), result.Stdout)
		})
	}
}
