// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/larksuite/cli/internal/vfs"
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

func TestWorkflowSchemaDocumentsAgentContracts(t *testing.T) {
	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller could not locate the test file")
	}

	schemaPath := filepath.Join(
		filepath.Dir(testFile),
		"..", "..", "..",
		"skills", "lark-base", "references", "lark-base-workflow-schema.md",
	)
	content, err := vfs.ReadFile(schemaPath)
	if err != nil {
		t.Fatalf("read workflow schema: %v", err)
	}

	schema := string(content)
	contracts := []struct {
		name string
		text string
	}{
		{name: "message receiver required", text: "| `receiver` | 是 | 非空 ValueInfo[] |"},
		{name: "send to everyone optional", text: "| `send_to_everyone` | 否 | 是否发送给所有人；省略时按 `false` 处理 |"},
		{name: "message content required", text: "| `content` | 是 | 非空 TextRefItem[] 消息内容 |"},
		{name: "button list optional", text: "| `btn_list` | 否 | 按钮列表；不需要时可省略"},
		{name: "unsupported step type", text: "workflow 不支持 `DeleteRecordTrigger`"},
		{name: "dry-run limitation", text: "`--dry-run` 只预览最终请求，不能证明服务端支持"},
		{name: "stop before mutation", text: "先报告不支持并停止写入"},
		{name: "alternative is proposal only", text: "只能作为备选方案提出，不能静默代替"},
		{name: "explicit selection gate", text: "明确选择**软删除/状态触发方案后"},
		{name: "forbid unauthorized field and workflow writes", text: "在明确选择前，不得执行这些写入"},
		{name: "no-question is not consent", text: "不代表同意替代方案"},
		{name: "separate delete authorization", text: "删除本身需要独立的明确授权"},
		{name: "no guessed substitution", text: "不要用 `TimerTrigger`、`Delay` 或其他 step 猜测替代"},
	}

	for _, contract := range contracts {
		t.Run(contract.name, func(t *testing.T) {
			if !strings.Contains(schema, contract.text) {
				t.Errorf("workflow schema must contain %q", contract.text)
			}
		})
	}
}
