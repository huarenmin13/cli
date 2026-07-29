// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"strings"
	"testing"
	"time"

	clie2e "github.com/larksuite/cli/tests/cli_e2e"
)

func TestWorkflowSkillDeliveryRegression(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{"skills", "read", "lark-base", "references/lark-base-workflow-guide.md"},
	})
	if err != nil {
		t.Fatalf("read embedded workflow guide: %v", err)
	}
	result.AssertExitCode(t, 0)

	for _, contract := range []string{
		"创建/更新时重点构造 `title` 和 `steps`",
		"`status` 通过 `+workflow-enable` 或 `+workflow-disable` 单独管理",
	} {
		if !strings.Contains(result.Stdout, contract) {
			t.Errorf("embedded workflow guide must contain %q", contract)
		}
	}
	if strings.Contains(result.Stdout, "创建/更新时重点构造 `title`、`status` 和 `steps`") {
		t.Error("embedded workflow guide must not include status in the create/update body contract")
	}
}

func TestWorkflowSchemaDeliveryRegression(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := clie2e.RunCmd(ctx, clie2e.Request{
		Args: []string{"skills", "read", "lark-base", "references/lark-base-workflow-schema.md"},
	})
	if err != nil {
		t.Fatalf("read embedded workflow schema: %v", err)
	}
	result.AssertExitCode(t, 0)

	contracts := []struct {
		name string
		text string
	}{
		{name: "message receiver required", text: "| `receiver` | 是 | 非空 ValueInfo[] |"},
		{name: "message content required", text: "| `content` | 是 | 非空 TextRefItem[] 消息内容 |"},
		{name: "send to everyone type", text: "| `send_to_everyone` | 否 | boolean；"},
		{name: "button list type", text: "| `btn_list` | 否 | ButtonConfig[]；"},
		{name: "unsupported capability", text: "`DeleteRecordTrigger`"},
		{name: "explicit semantic selection", text: "明确选择该替代语义"},
	}

	for _, contract := range contracts {
		t.Run(contract.name, func(t *testing.T) {
			if !strings.Contains(result.Stdout, contract.text) {
				t.Errorf("embedded workflow schema must contain %q", contract.text)
			}
		})
	}
}
