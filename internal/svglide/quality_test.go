package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestCheckQualityAllowsExplicitLocalSourceWithoutFullPageWebSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"local1","path":"source.md","title":"Local Source","excerpt":"Input","usage":"Support","retrieval":"local_file"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["local1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only slide; no image assets required"}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityRejectsTopicDeckWithoutFullPageWebOrExplicitLocalSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"source1","path":"source.md","title":"Weak Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["source1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
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
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

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

func TestCheckQualityAllowsExperimentAssetsAndDeferredUnsupportedVisuals(t *testing.T) {
	t.Chdir(t.TempDir())
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/report","title":"Report","excerpt":"Full page excerpt","usage":"evidence","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"main_title":"Demo Deck","style_instruction":{"aesthetic_direction":"Editorial report","color_palette":{},"typography":{}},"slides":[{"id":"s1","title":"Chart claim","summary":"Needs chart later","role":"content","key_message":"Chart is deferred","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Chart-backed point","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use a remote hero image"},{"id":"chart1","type":"chart","instruction":"Use a real chart when chart generation is enabled"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/hero.png","usage":"Hero image","status":"ready"},{"id":"chart1","slide_id":"s1","type":"chart","path":"","usage":"Deferred chart generation","status":"deferred"}]}`)
	mustWriteQualitySlideWithImage(t, "https://example.com/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityAllowsAbsoluteReadyAssetPathInExperiment(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	outside := filepath.Join(t.TempDir(), "hero.png")
	if err := os.WriteFile(outside, []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+outside+`","usage":"Hero image","status":"ready"}]}`)
	mustWriteQualitySlideWithImage(t, outside)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityRejectsEmptyVisuals(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.visuals") {
		t.Fatalf("issues = %+v, want svglide.quality.visuals", report.Issues)
	}
}

func TestCheckQualityRejectsVisualAssetTypeMismatch(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"diagram","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
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
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset") {
		t.Fatalf("issues = %+v, want svglide.quality.asset", report.Issues)
	}
}

func TestAnyGenSemanticReportRejectsAllDiagramWithoutNoImageReason(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Movie Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Movie hook","path":"slides/01.svg"},{"id":"s2","title":"Context","summary":"Context summary","role":"content","key_message":"Movie context","path":"slides/02.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/movie","title":"Movie Source","excerpt":"Movie excerpt","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening","source_refs":["web1"],"visuals":[{"id":"diagram1","type":"diagram","instruction":"Diagram fallback"}]},{"id":"s2","content":"Context","source_refs":["web1"],"visuals":[{"id":"diagram2","type":"diagram","instruction":"Diagram fallback"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"diagram1","slide_id":"s1","type":"diagram","path":"assets/images/diagram1.svg","usage":"Diagram fallback","status":"ready"},{"id":"diagram2","slide_id":"s2","type":"diagram","path":"assets/images/diagram2.svg","usage":"Diagram fallback","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/images/diagram1.svg", `<svg/>`)
	mustWriteTestFile(t, "demo/assets/images/diagram2.svg", `<svg/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want semantic failure for all-diagram fallback without no_image_reason; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainRule(report.Findings, "no_silent_all_diagram_fallback") {
		t.Fatalf("findings = %+v, want no_silent_all_diagram_fallback", report.Findings)
	}
	if _, err := os.Stat(filepath.Join("demo", "anygen_semantic_report.json")); err != nil {
		t.Fatalf("missing anygen_semantic_report.json: %v", err)
	}
}

func semanticFindingsContainRule(findings []SemanticFinding, ruleID string) bool {
	for _, finding := range findings {
		if finding.RuleID == ruleID {
			return true
		}
	}
	return false
}

func TestAnyGenSemanticReportRejectsUnsafeReadyImageAssetPaths(t *testing.T) {
	tests := []struct {
		name       string
		assetPath  string
		setupAsset func(t *testing.T)
	}{
		{
			name:      "file url",
			assetPath: "file:///tmp/secret.png",
		},
		{
			name:      "absolute path",
			assetPath: "/Users/example/secret.png",
		},
		{
			name:      "missing local asset",
			assetPath: "assets/images/missing.png",
		},
		{
			name:      "symlink local asset",
			assetPath: "assets/images/hero.png",
			setupAsset: func(t *testing.T) {
				t.Helper()
				if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile("outside-hero.png", []byte("png"), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.Symlink(filepath.Join("..", "..", "outside-hero.png"), filepath.Join("demo", "assets", "images", "hero.png")); err != nil {
					t.Fatal(err)
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			if tt.setupAsset != nil {
				tt.setupAsset(t)
			}
			writeSemanticImageDeck(t, tt.assetPath)

			report, err := EvaluateAnyGenSemantics("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.Status != "failed" {
				t.Fatalf("status = %q, want failed for unsafe ready image asset path %q; findings=%+v", report.Status, tt.assetPath, report.Findings)
			}
			if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_path") {
				t.Fatalf("findings = %+v, want svglide.semantic.asset_path", report.Findings)
			}
		})
	}
}

func TestAnyGenSemanticReportAllowsRegisteredChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, "assets/charts/revenue.svg")
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed for registered chart href; findings=%+v", report.Status, report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsUnregisteredChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[]}`, "assets/charts/revenue.svg")

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for unregistered chart href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.unregistered_href") {
		t.Fatalf("findings = %+v, want svglide.semantic.unregistered_href", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsUnsafeReadyChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"file:///tmp/secret.svg","usage":"Revenue chart","status":"ready"}]}`, "file:///tmp/secret.svg")

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for unsafe chart href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_path") {
		t.Fatalf("findings = %+v, want svglide.semantic.asset_path", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsChartAssetUsedAsImageHref(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)
	writeSemanticDeckWithSlideBody(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, `<image slide:role="image" href="assets/charts/revenue.svg" x="80" y="80" width="640" height="360"/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for chart asset used as image href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_type") {
		t.Fatalf("findings = %+v, want svglide.semantic.asset_type", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsExternalUseHref(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)
	writeSemanticDeckWithSlideBody(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, `<use href="assets/charts/revenue.svg" x="80" y="80" width="640" height="360"/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for external use href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_type") {
		t.Fatalf("findings = %+v, want svglide.semantic.asset_type", report.Findings)
	}
}

func semanticFindingsContainCode(findings []SemanticFinding, code string) bool {
	for _, finding := range findings {
		if finding.Code == code {
			return true
		}
	}
	return false
}

func writeSemanticImageDeck(t *testing.T, assetPath string) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Image Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Image hook","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening","source_refs":[],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+assetPath+`","usage":"Hero image","status":"ready"}]}`)
	mustWriteQualitySlideWithImage(t, assetPath)
}

func writeSemanticChartDeck(t *testing.T, assetsPlan string, chartHref string) {
	t.Helper()
	writeSemanticDeckWithSlideBody(t, assetsPlan, `<rect slide:role="chart" href="`+chartHref+`" x="80" y="80" width="640" height="360"/>`)
}

func writeSemanticDeckWithSlideBody(t *testing.T, assetsPlan string, slideBody string) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Chart Deck","slides":[{"id":"s1","title":"Revenue","summary":"Revenue summary","role":"content","key_message":"Revenue changed","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Revenue changed","source_refs":[],"visuals":[{"id":"chart1","type":"chart","instruction":"Revenue chart"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", assetsPlan)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/>`+slideBody+`<text x="48" y="500">Revenue</text></svg>`)
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
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

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

func TestCheckQualityAllowsSymlinkReadyAssetPathInExperiment(t *testing.T) {
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
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
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
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only slide; no image assets required"}`)

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

func mustWriteQualitySlideWithImage(t *testing.T, href string) {
	t.Helper()
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><image slide:role="image" href="`+href+`" x="40" y="40" width="320" height="180"/><text x="48" y="260">Claim</text></svg>`)
}

func qualityIssueCodesContain(issues []QualityIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
