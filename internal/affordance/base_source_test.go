// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package affordance

import (
	"os"
	"slices"
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/meta"
)

func TestBaseAffordanceRecordGuidance(t *testing.T) {
	prev := mdSource
	t.Cleanup(func() { SetSource(prev) })
	SetSource(os.DirFS("../../affordance"))

	if got, ok := DomainSkill("base"); !ok || got != "lark-base" {
		t.Fatalf("DomainSkill(base) = (%q, %v), want (lark-base, true)", got, ok)
	}

	recordList := parsedBaseAffordance(t, "+record-list")
	if len(recordList.Examples) != 1 || !strings.Contains(recordList.Examples[0].Command, `--field-id "Project Owner"`) {
		t.Fatalf("record-list examples = %#v, want quoted field-name guidance", recordList.Examples)
	}

	history := parsedBaseAffordance(t, "+record-history-list")
	if !containsItem(history.Prerequisites, "record_id") || !containsItem(history.Prerequisites, "+record-list") {
		t.Fatalf("record-history prerequisites must point to explicit record selection: %v", history.Prerequisites)
	}
	if !containsItem(history.Tips, "one record's history") || !containsItem(history.Tips, "--format pretty") {
		t.Fatalf("record-history tips must preserve scope and pretty-output guidance: %v", history.Tips)
	}
	if !slices.Contains(history.Skills, "lark-base/references/lark-base-record-history-list.md") {
		t.Fatalf("record-history skills = %v, want detailed history reference", history.Skills)
	}

	source, err := os.ReadFile("../../affordance/base.md")
	if err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{"user-confirmed", "top-level _record_id"} {
		if strings.Contains(string(source), forbidden) {
			t.Errorf("base affordance must not claim %q", forbidden)
		}
	}
}

func parsedBaseAffordance(t *testing.T, method string) meta.Affordance {
	t.Helper()
	raw, ok := For("base", method)
	if !ok {
		t.Fatalf("For(base, %s) ok=false", method)
	}
	a, ok := (meta.Method{Affordance: raw}).ParsedAffordance()
	if !ok {
		t.Fatalf("base %s affordance did not parse", method)
	}
	return a
}
