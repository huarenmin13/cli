// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"testing"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestBaseWorkflowUpdateDryRun(t *testing.T) {
	result := runBaseDryRun(t, 0,
		"base", "+workflow-update",
		"--base-token", "app_x",
		"--workflow-id", "wkf_x",
		"--json", `{"title":"Reminder","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}]}}]}`,
	)

	out := result.Stdout
	require.Equal(t, "/open-apis/base/v3/bases/app_x/workflows/wkf_x", clie2e.DryRunGet(out, "api.0.url").String(), out)
	require.Equal(t, "PUT", clie2e.DryRunGet(out, "api.0.method").String(), out)
	require.Equal(t, "Reminder", clie2e.DryRunGet(out, "api.0.body.title").String(), out)
	require.Equal(t, "LarkMessageAction", clie2e.DryRunGet(out, "api.0.body.steps.0.type").String(), out)
	require.Equal(t, "ou_x", clie2e.DryRunGet(out, "api.0.body.steps.0.data.receiver.0.value.id").String(), out)
	require.Equal(t, "Review the request", clie2e.DryRunGet(out, "api.0.body.steps.0.data.content.0.value").String(), out)
	require.False(t, clie2e.DryRunGet(out, "api.0.body.steps.0.data.btn_list").Exists(), out)
}

func TestBaseWorkflowCreateDryRun(t *testing.T) {
	result := runBaseDryRun(t, 0,
		"base", "+workflow-create",
		"--base-token", "app_x",
		"--json", `{"title":"Reminder","client_token":"create_1","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}]}}]}`,
	)

	out := result.Stdout
	require.Equal(t, "/open-apis/base/v3/bases/app_x/workflows", clie2e.DryRunGet(out, "api.0.url").String(), out)
	require.Equal(t, "POST", clie2e.DryRunGet(out, "api.0.method").String(), out)
	require.Equal(t, "create_1", clie2e.DryRunGet(out, "api.0.body.client_token").String(), out)
	require.Equal(t, "ou_x", clie2e.DryRunGet(out, "api.0.body.steps.0.data.receiver.0.value.id").String(), out)
	require.Equal(t, "Review the request", clie2e.DryRunGet(out, "api.0.body.steps.0.data.content.0.value").String(), out)
	require.False(t, clie2e.DryRunGet(out, "api.0.body.steps.0.data.btn_list").Exists(), out)
}

func TestBaseWorkflowDryRunRejectsInvalidDefinitions(t *testing.T) {
	for _, tt := range []struct {
		name        string
		args        []string
		wantSubtype string
		wantPath    string
	}{
		{
			name: "unsupported trigger",
			args: []string{
				"base", "+workflow-update",
				"--base-token", "app_x",
				"--workflow-id", "wkf_x",
				"--json", `{"title":"Archive workflow","steps":[{"type":"DeleteRecordTrigger","data":{"table_id":"tbl_x"}}]}`,
			},
			wantSubtype: "failed_precondition",
			wantPath:    "steps[0].type",
		},
		{
			name: "invalid optional message field",
			args: []string{
				"base", "+workflow-create",
				"--base-token", "app_x",
				"--json", `{"title":"Reminder","client_token":"create_1","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}],"send_to_everyone":"yes"}}]}`,
			},
			wantSubtype: "invalid_argument",
			wantPath:    "send_to_everyone",
		},
		{
			name: "mis-cased update field",
			args: []string{
				"base", "+workflow-update",
				"--base-token", "app_x",
				"--workflow-id", "wkf_x",
				"--json", `{"title":"Reminder","Steps":[]}`,
			},
			wantSubtype: "invalid_argument",
			wantPath:    "steps",
		},
		{
			name: "mis-cased optional message field",
			args: []string{
				"base", "+workflow-create",
				"--base-token", "app_x",
				"--json", `{"title":"Reminder","client_token":"create_1","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}],"Send_To_Everyone":false}}]}`,
			},
			wantSubtype: "invalid_argument",
			wantPath:    "send_to_everyone",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			result := runBaseDryRun(t, 2, tt.args...)
			require.Equal(t, "validation", gjson.Get(result.Stderr, "error.type").String(), result.Stderr)
			require.Equal(t, tt.wantSubtype, gjson.Get(result.Stderr, "error.subtype").String(), result.Stderr)
			require.Equal(t, "--json", gjson.Get(result.Stderr, "error.param").String(), result.Stderr)
			require.Contains(t, gjson.Get(result.Stderr, "error.message").String(), tt.wantPath, result.Stderr)
			require.Empty(t, result.Stdout)
		})
	}
}
