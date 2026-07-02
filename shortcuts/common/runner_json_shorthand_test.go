// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package common

import (
	"context"
	"testing"

	"github.com/spf13/cobra"

	"github.com/larksuite/cli/internal/cmdutil"
)

const jsonShorthandUsage = "shorthand for --format json"

func mountTestShortcut(t *testing.T, s Shortcut) *cobra.Command {
	t.Helper()
	f, _, _, _ := cmdutil.TestFactory(t, nil)
	parent := &cobra.Command{Use: "root"}
	s.Mount(parent, f)
	cmd, _, err := parent.Find([]string{s.Command})
	if err != nil {
		t.Fatalf("Find() error = %v", err)
	}
	return cmd
}

// 自定义 format 且 Enum 含 json → 注册简写（本次修复的核心行为）
func TestJSONShorthand_CustomFormatWithJSONEnum_Registered(t *testing.T) {
	cmd := mountTestShortcut(t, Shortcut{
		Service: "mail", Command: "+fake-triage", Description: "x",
		Flags:   []Flag{{Name: "format", Default: "table", Enum: []string{"table", "json", "data"}, Desc: "fmt"}},
		Execute: func(context.Context, *RuntimeContext) error { return nil },
	})
	fl := cmd.Flags().Lookup("json")
	if fl == nil {
		t.Fatal("--json not registered for custom-format shortcut whose Enum contains json")
	}
	if fl.Usage != jsonShorthandUsage {
		t.Errorf("usage = %q, want %q", fl.Usage, jsonShorthandUsage)
	}
	// 默认输出格式不被改变
	if def := cmd.Flags().Lookup("format").DefValue; def != "table" {
		t.Errorf("format default = %q, want table", def)
	}
}

// 自定义 format 但 Enum 不含 json → 不注册
func TestJSONShorthand_CustomFormatWithoutJSONEnum_NotRegistered(t *testing.T) {
	cmd := mountTestShortcut(t, Shortcut{
		Service: "x", Command: "+no-json", Description: "x",
		Flags:   []Flag{{Name: "format", Default: "csv", Enum: []string{"csv", "table"}, Desc: "fmt"}},
		Execute: func(context.Context, *RuntimeContext) error { return nil },
	})
	if cmd.Flags().Lookup("json") != nil {
		t.Fatal("--json must NOT be registered when format Enum lacks json")
	}
}

// 自定义 format 但无 Enum（现状 triage 形态）→ 不注册（Enum 是判定依据）
func TestJSONShorthand_CustomFormatNoEnum_NotRegistered(t *testing.T) {
	cmd := mountTestShortcut(t, Shortcut{
		Service: "x", Command: "+legacy", Description: "x",
		Flags:   []Flag{{Name: "format", Default: "table", Desc: "fmt"}},
		Execute: func(context.Context, *RuntimeContext) error { return nil },
	})
	if cmd.Flags().Lookup("json") != nil {
		t.Fatal("--json must NOT be registered when format has no Enum metadata")
	}
}

// 自声明 json flag（subscribe 的 pretty / record-search 的请求体）→ 不覆盖、不 panic、语义保留
func TestJSONShorthand_SelfDeclaredJSON_Preserved(t *testing.T) {
	cmd := mountTestShortcut(t, Shortcut{
		Service: "event", Command: "+fake-subscribe", Description: "x",
		Flags: []Flag{
			{Name: "json", Type: "bool", Desc: "pretty-print JSON instead of NDJSON"},
		},
		Execute: func(context.Context, *RuntimeContext) error { return nil },
	})
	fl := cmd.Flags().Lookup("json")
	if fl == nil {
		t.Fatal("self-declared --json missing")
	}
	if fl.Usage != "pretty-print JSON instead of NDJSON" {
		t.Errorf("self-declared --json usage overwritten: %q", fl.Usage)
	}
}

// 无自定义 format（普通命令）→ 注入默认 format + 简写（现状回归）
func TestJSONShorthand_DefaultInjectedFormat_StillRegistered(t *testing.T) {
	cmd := mountTestShortcut(t, Shortcut{
		Service: "im", Command: "+plain", Description: "x",
		Execute: func(context.Context, *RuntimeContext) error { return nil },
	})
	fl := cmd.Flags().Lookup("json")
	if fl == nil {
		t.Fatal("--json missing on default-format shortcut (regression)")
	}
	if fl.Usage != jsonShorthandUsage {
		t.Errorf("usage = %q, want %q", fl.Usage, jsonShorthandUsage)
	}
}
