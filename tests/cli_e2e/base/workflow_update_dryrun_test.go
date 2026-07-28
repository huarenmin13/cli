// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"testing"
	"time"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
	"github.com/stretchr/testify/require"
)

func TestBaseWorkflowUpdateDryRun(t *testing.T) {
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{
			"base", "+workflow-update",
			"--base-token", "app_x",
			"--workflow-id", "wkf_x",
			"--json", `{"title":"Reminder","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}]}}]}`,
			"--dry-run",
		},
		DefaultAs: "bot",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 0)

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
	setBaseDryRunConfigEnv(t)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	t.Cleanup(cancel)

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{
			"base", "+workflow-create",
			"--base-token", "app_x",
			"--json", `{"title":"Reminder","client_token":"create_1","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Review the request"}]}}]}`,
			"--dry-run",
		},
		DefaultAs: "bot",
	})
	require.NoError(t, err)
	result.AssertExitCode(t, 0)

	out := result.Stdout
	require.Equal(t, "/open-apis/base/v3/bases/app_x/workflows", clie2e.DryRunGet(out, "api.0.url").String(), out)
	require.Equal(t, "POST", clie2e.DryRunGet(out, "api.0.method").String(), out)
	require.Equal(t, "create_1", clie2e.DryRunGet(out, "api.0.body.client_token").String(), out)
	require.Equal(t, "ou_x", clie2e.DryRunGet(out, "api.0.body.steps.0.data.receiver.0.value.id").String(), out)
	require.Equal(t, "Review the request", clie2e.DryRunGet(out, "api.0.body.steps.0.data.content.0.value").String(), out)
	require.False(t, clie2e.DryRunGet(out, "api.0.body.steps.0.data.btn_list").Exists(), out)
}
