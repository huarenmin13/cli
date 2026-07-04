package svglide

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDefaultPromptManifestIncludesSemanticContract(t *testing.T) {
	manifest := DefaultPromptManifest()
	for _, entry := range manifest.Entries {
		if entry.Name == "anygen_semantic_contract" {
			if entry.Path != "skills/lark-slides/references/anygen-svg/semantic_contract.md" {
				t.Fatalf("semantic contract path = %q, want semantic_contract.md", entry.Path)
			}
			if !entry.Always {
				t.Fatalf("semantic contract entry = %+v, want always in prompt context", entry)
			}
			return
		}
	}
	t.Fatalf("prompt manifest missing anygen_semantic_contract: %+v", manifest.Entries)
}

func TestSemanticContractRejectsUnknownRuleField(t *testing.T) {
	path := writeSemanticContractFixture(t, `---
id: anygen_semantic_contract
role: semantic_contract
rules:
  - id: bad_rule
    kind: artifact_exists
    artifact: outline/deck.json
    severity: error
    unknown_field: should_fail
---
# bad
`)
	_, err := LoadSemanticContractFile(path)
	if err == nil {
		t.Fatal("expected unknown rule field to be rejected")
	}
	if !strings.Contains(err.Error(), "unknown_field") {
		t.Fatalf("error = %v, want unknown_field", err)
	}
}

func TestSemanticContractRejectsRuleMissingIDKindOrSeverity(t *testing.T) {
	for _, tc := range []struct {
		name string
		rule string
		want string
	}{
		{name: "id", rule: "kind: artifact_exists\n    artifact: outline/deck.json\n    severity: error", want: "missing id"},
		{name: "kind", rule: "id: missing_kind\n    artifact: outline/deck.json\n    severity: error", want: "missing kind"},
		{name: "severity", rule: "id: missing_severity\n    kind: artifact_exists\n    artifact: outline/deck.json", want: "missing severity"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := writeSemanticContractFixture(t, `---
id: anygen_semantic_contract
role: semantic_contract
rules:
  - `+tc.rule+`
---
# bad
`)
			_, err := LoadSemanticContractFile(path)
			if err == nil {
				t.Fatalf("expected %s to be rejected", tc.name)
			}
			if !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("error = %v, want %q", err, tc.want)
			}
		})
	}
}

func TestSemanticContractRejectsUnsupportedSeverity(t *testing.T) {
	path := writeSemanticContractFixture(t, `---
id: anygen_semantic_contract
role: semantic_contract
rules:
  - id: bad_severity
    kind: artifact_exists
    artifact: outline/deck.json
    severity: errror
---
# bad
`)
	_, err := LoadSemanticContractFile(path)
	if err == nil {
		t.Fatal("expected unsupported severity to be rejected")
	}
	if !strings.Contains(err.Error(), "unsupported severity") {
		t.Fatalf("error = %v, want unsupported severity", err)
	}
}

func promptManifestHasSemanticContract() bool {
	for _, entry := range DefaultPromptManifest().Entries {
		if entry.Name == "anygen_semantic_contract" {
			return true
		}
	}
	return false
}

func writeSemanticContractFixture(t *testing.T, content string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "semantic_contract.md")
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}
