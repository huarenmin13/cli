package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestCheckQualityRejectsTopicDeckWithoutFullPageWebSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"local1","path":"source.md","title":"Local Source","excerpt":"Input","usage":"Support","retrieval":"local_file"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["local1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.research") {
		t.Fatalf("issues = %+v, want svglide.quality.research", report.Issues)
	}
}

func TestCheckQualityRejectsSlideContentWithoutSourceRefs(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":[],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.source_refs") {
		t.Fatalf("issues = %+v, want svglide.quality.source_refs", report.Issues)
	}
}

func TestCheckQualityRejectsMissingVisualAsset(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset") {
		t.Fatalf("issues = %+v, want svglide.quality.asset", report.Issues)
	}
}

func TestCheckQualityPassesAnyGenReadyRun(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if len(report.Issues) != 0 {
		t.Fatalf("issues = %+v, want empty", report.Issues)
	}
	if report.Metrics.Slides != 1 || report.Metrics.Sources != 1 || report.Metrics.WebSources != 1 || report.Metrics.Assets != 1 || report.Metrics.SlidesWithSourceRef != 1 || report.Metrics.SlidesWithVisuals != 1 {
		t.Fatalf("metrics = %+v, want all ones", report.Metrics)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "quality_report.json"))
	if err != nil {
		t.Fatalf("missing quality_report.json: %v", err)
	}
	var written QualityReport
	if err := json.Unmarshal(raw, &written); err != nil {
		t.Fatal(err)
	}
	if written.Status != "passed" {
		t.Fatalf("written status = %q, want passed", written.Status)
	}
}

func TestCheckQualityRejectsMissingAbsoluteReadyAssetPath(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	missing := filepath.Join(t.TempDir(), "missing.png")
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+missing+`","usage":"Hero image","status":"ready"}]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset_path") {
		t.Fatalf("issues = %+v, want svglide.quality.asset_path", report.Issues)
	}
}

func TestCheckQualityCountsSlidesWithVisualsPerPage(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"},{"id":"logo","type":"diagram","instruction":"Support diagram"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"},{"id":"logo","slide_id":"s1","type":"diagram","path":"assets/images/logo.svg","usage":"Support diagram","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "logo.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if report.Metrics.SlidesWithVisuals != 1 {
		t.Fatalf("metrics.slides_with_visuals = %d, want 1", report.Metrics.SlidesWithVisuals)
	}
}

func TestCheckQualityRejectsSymlinkReadyAssetPath(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("outside-hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(filepath.Join("..", "..", "outside-hero.png"), filepath.Join("demo", "assets", "images", "hero.png")); err != nil {
		t.Fatal(err)
	}

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset_path") {
		t.Fatalf("issues = %+v, want svglide.quality.asset_path", report.Issues)
	}
}

func TestCheckQualityUsesOutlineDeckNotRunArtifactDeck(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.Artifacts.Deck = "custom/deck.json"
	writeStatusTestRunFile(t, run)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "custom"), 0o755); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/custom/deck.json", `{"title":"Custom Deck","slides":[{"id":"c1","title":"Custom 1","summary":"Custom summary 1","role":"cover","key_message":"Custom key 1","path":"slides/01.svg"},{"id":"c2","title":"Custom 2","summary":"Custom summary 2","role":"content","key_message":"Custom key 2","path":"slides/02.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]},{"id":"c1","content":"Custom claim 1","source_refs":["web1"],"visuals":[{"id":"v2","type":"none","instruction":"Text-only"}]},{"id":"c2","content":"Custom claim 2","source_refs":["web1"],"visuals":[{"id":"v3","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if report.Metrics.Slides != 1 {
		t.Fatalf("metrics.slides = %d, want 1 from outline/deck.json", report.Metrics.Slides)
	}
}

func qualityIssueCodesContain(issues []QualityIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
