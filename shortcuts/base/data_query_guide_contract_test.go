package base

import (
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/vfs"
)

func TestDataQueryQuickGuideCoversCommonFiltersWithoutBecomingFullReference(t *testing.T) {
	const guidePath = "../../skills/lark-base/references/lark-base-data-query-guide.md"
	content, err := vfs.ReadFile(guidePath)
	if err != nil {
		t.Fatalf("read data-query quick guide: %v", err)
	}
	guide := string(content)

	for _, want := range []string{
		`"type":1`,
		`"conjunction":"and"`,
		`"conditions"`,
		"`is`, `isNot`",
		"`isLess`",
		"`isEmpty`",
		"`isNotEmpty`",
		`"value":[]`,
		`["Today"]`,
		`["ExactDate","<epoch_ms>"]`,
		`["<status_value>"]`,
		`"<date_field>"`,
		`"<status_field>"`,
		`"<status_value>"`,
		"[lark-base-data-query.md](lark-base-data-query.md)",
	} {
		if !strings.Contains(guide, want) {
			t.Fatalf("quick guide missing %q", want)
		}
	}

	if len(content) > 6*1024 {
		t.Fatalf("quick guide grew to %d bytes; keep full DSL details in lark-base-data-query.md", len(content))
	}

	for _, forbidden := range []string{
		"base_table_",
		"bytedance.larkoffice.com/base/",
	} {
		if strings.Contains(guide, forbidden) {
			t.Fatalf("quick guide must use generic placeholders, found %q", forbidden)
		}
	}
}
