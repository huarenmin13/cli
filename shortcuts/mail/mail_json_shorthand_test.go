// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package mail

import (
	"strings"
	"testing"
)

// help 契约（spec §6.1）
func TestMailTriageHelpListsJSONShorthand(t *testing.T) {
	f, stdout, _, _ := mailShortcutTestFactory(t)
	if err := runMountedMailShortcutWithCobraOutput(t, MailTriage, []string{"+triage", "-h"}, f, stdout); err != nil {
		t.Fatalf("help returned error: %v", err)
	}
	if !strings.Contains(stdout.String(), "shorthand for --format json") {
		t.Fatalf("triage help missing --json shorthand\n%s", stdout.String())
	}
}

func TestMailWatchHelpListsJSONShorthand(t *testing.T) {
	f, stdout, _, _ := mailShortcutTestFactory(t)
	if err := runMountedMailShortcutWithCobraOutput(t, MailWatch, []string{"+watch", "-h"}, f, stdout); err != nil {
		t.Fatalf("help returned error: %v", err)
	}
	if !strings.Contains(stdout.String(), "shorthand for --format json") {
		t.Fatalf("watch help missing --json shorthand\n%s", stdout.String())
	}
}

// 行为契约（spec §6.2.2）：--json 走 JSON 输出路径，不输出 table read hint
func TestMailTriageJSONShorthandDoesNotEmitReadHint(t *testing.T) {
	f, stdout, stderr, reg := mailShortcutTestFactory(t)
	registerTriageReadHintStubs(reg)

	err := runMountedMailShortcut(t, MailTriage, []string{"+triage", "--json", "--max", "1"}, f, stdout)
	if err != nil {
		t.Fatalf("triage --json returned error: %v", err)
	}
	reg.Verify(t)
	if strings.Contains(stderr.String(), "tip: read full content:") {
		t.Fatalf("--json must follow the JSON path, got table hint\nstderr=%s", stderr.String())
	}
	if !strings.Contains(stdout.String(), `"messages"`) {
		t.Fatalf("--json stdout missing JSON payload\n%s", stdout.String())
	}
}

// 行为契约（spec §6.2.1）：--json 与 --format json 的 dry-run 输出一致
func TestMailTriageJSONShorthandDryRunEquivalence(t *testing.T) {
	f1, stdout1, _, _ := mailShortcutTestFactory(t)
	if err := runMountedMailShortcut(t, MailTriage, []string{"+triage", "--json", "--max", "1", "--dry-run"}, f1, stdout1); err != nil {
		t.Fatalf("--json --dry-run error: %v", err)
	}
	f2, stdout2, _, _ := mailShortcutTestFactory(t)
	if err := runMountedMailShortcut(t, MailTriage, []string{"+triage", "--format", "json", "--max", "1", "--dry-run"}, f2, stdout2); err != nil {
		t.Fatalf("--format json --dry-run error: %v", err)
	}
	if stdout1.String() != stdout2.String() {
		t.Fatalf("dry-run outputs differ:\n--json:\n%s\n--format json:\n%s", stdout1.String(), stdout2.String())
	}
}

// 优先级契约（spec §6.2.5）：显式 --format table 优先，--json 让位 → 仍走 table 路径
func TestMailTriageExplicitTableWinsOverJSONShorthand(t *testing.T) {
	f, stdout, stderr, reg := mailShortcutTestFactory(t)
	registerTriageReadHintStubs(reg)

	err := runMountedMailShortcut(t, MailTriage, []string{"+triage", "--format", "table", "--json", "--max", "1"}, f, stdout)
	if err != nil {
		t.Fatalf("triage returned error: %v", err)
	}
	if !strings.Contains(stderr.String(), "tip: read full content:") {
		t.Fatalf("explicit --format table must win over --json (expected table hint)\nstderr=%s", stderr.String())
	}
}

// 错误契约（spec §6.3.2）：Enum 硬校验
func TestMailTriageEnumRejectsUnknownFormat(t *testing.T) {
	f, stdout, _, _ := mailShortcutTestFactory(t)
	err := runMountedMailShortcut(t, MailTriage, []string{"+triage", "--format", "bogus", "--max", "1", "--dry-run"}, f, stdout)
	if err == nil {
		t.Fatal("expected validation error for --format bogus")
	}
	if !strings.Contains(err.Error(), `invalid value "bogus" for --format`) {
		t.Fatalf("error = %v, want enum validation message", err)
	}
	if !strings.Contains(err.Error(), "table, json, data") {
		t.Fatalf("error = %v, want allowed values list", err)
	}
}
