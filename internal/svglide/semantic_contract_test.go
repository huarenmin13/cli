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

func TestDefaultPromptManifestIncludesVisualQualityOverlay(t *testing.T) {
	manifest := DefaultPromptManifest()
	for _, entry := range manifest.Entries {
		if entry.Name != "svglide_visual_quality_overlay" {
			continue
		}
		if entry.Path != "skills/lark-slides/references/anygen-svg/svglide_visual_quality_overlay.md" {
			t.Fatalf("visual overlay path = %q, want svglide_visual_quality_overlay.md", entry.Path)
		}
		if !entry.Always || entry.Role != "runtime_binding" {
			t.Fatalf("visual overlay entry = %+v, want always runtime_binding", entry)
		}
		return
	}
	t.Fatalf("prompt manifest missing svglide_visual_quality_overlay: %+v", manifest.Entries)
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

func TestAnyGenSemanticReportIncludesMetrics(t *testing.T) {
	initValidateTestRun(t)
	writeDefaultSemanticContractForTest(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "content", "slide_content.json"), `{"slides":[{"id":"slide-1","content":"Claim","notes":"Speaker note","source_refs":["s1"],"visuals":[{"id":"hero","type":"image","instruction":"Use hero"}]}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "assets_manifest.json"), `{"assets":[{"id":"hero","slide_id":"slide-1","kind":"image","local_path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "images", "hero.png"), "png")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<slide:note>Speaker note</slide:note><image slide:role="image" href="../assets/images/hero.png"/><text x="1" y="1">Claim</text></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Metrics.SlideCount != 1 || report.Metrics.ImageCount != 1 || report.Metrics.NoteCount != 1 || report.Metrics.SourceRefCount != 1 {
		t.Fatalf("metrics = %+v, want slide/image/note/source counts", report.Metrics)
	}
	if report.Metrics.MissingAssetCount != 0 {
		t.Fatalf("MissingAssetCount = %d, want 0", report.Metrics.MissingAssetCount)
	}
	if report.Metrics.VisibleLeakCount != 0 || report.Metrics.FontTokenCount != 4 || report.Metrics.MissingFontTokenCount != 0 {
		t.Fatalf("metrics = %+v, want no visible leaks and all font tokens", report.Metrics)
	}
}

func TestAnyGenSemanticReportRejectsRemoteReadyImageForLocalProfile(t *testing.T) {
	initValidateTestRun(t)
	writeDefaultSemanticContractForTest(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "content", "slide_content.json"), `{"slides":[{"id":"slide-1","content":"Claim","source_refs":["s1"],"visuals":[{"id":"hero","type":"image","instruction":"Use hero"}]}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "assets_manifest.json"), `{"assets":[{"id":"hero","slide_id":"slide-1","kind":"image","local_path":"https://example.com/hero.png","usage":"Hero image","status":"ready"}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="https://example.com/hero.png"/><text x="1" y="1">Claim</text></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed: %+v", report.Status, report)
	}
	if !semanticFindingsContain(report.Findings, "local_svg_deck ready image asset path") {
		t.Fatalf("findings = %+v, want local_svg_deck remote ready asset rejection", report.Findings)
	}
	if report.Metrics.MissingAssetCount != 1 {
		t.Fatalf("MissingAssetCount = %d, want 1 for remote ready asset in local profile", report.Metrics.MissingAssetCount)
	}
}

func TestAnyGenSemanticReportRejectsVisibleInstructionLeak(t *testing.T) {
	initValidateTestRun(t)
	writeDefaultSemanticContractForTest(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "content", "slide_content.json"), `{"slides":[{"id":"slide-1","content":"Claim","source_refs":["s1"],"visuals":[{"id":"none","type":"none","instruction":"Text only"}]}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "assets_manifest.json"), `{"assets":[],"no_image_reason":"Text-only deck"}`)
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<text x="1" y="1">Sources: https://example.com</text><text x="1" y="40">产品页必须让眼镜完整出现</text></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed: %+v", report.Status, report)
	}
	if !semanticFindingsContain(report.Findings, "visible leak") {
		t.Fatalf("findings = %+v, want visible leak finding", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsMissingFontTokens(t *testing.T) {
	initValidateTestRun(t)
	writeDefaultSemanticContractForTest(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "content", "slide_content.json"), `{"slides":[{"id":"slide-1","content":"Claim","source_refs":["s1"],"visuals":[{"id":"none","type":"none","instruction":"Text only"}]}]}`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "assets_manifest.json"), `{"assets":[],"no_image_reason":"Text-only deck"}`)
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><text x="1" y="1">Claim</text></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed: %+v", report.Status, report)
	}
	if !semanticFindingsContain(report.Findings, "font token") {
		t.Fatalf("findings = %+v, want font token finding", report.Findings)
	}
}

func semanticFindingsContain(findings []SemanticFinding, needle string) bool {
	for _, finding := range findings {
		if strings.Contains(finding.Message, needle) {
			return true
		}
	}
	return false
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
