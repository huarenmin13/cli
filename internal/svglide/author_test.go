package svglide

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAuthorSlidesWritesVisibleSVGForEachDeckSlide(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"},{"id":"s2","title":"Second claim","summary":"Second summary","role":"content","key_message":"Second key message","path":"slides/02.svg"}]}`)
	writeAuthorInputsWithAnyGenContracts(t, `{"assets":[]}`)

	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	writeStatusTestRunFile(t, run)

	report, err := AuthorSlides("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != StatusDone {
		t.Fatalf("Status = %q, want %q", report.Status, StatusDone)
	}
	if len(report.Slides) != 2 {
		t.Fatalf("Slides len = %d, want 2: %+v", len(report.Slides), report.Slides)
	}
	receipt := readAuthorReceiptForTest(t)
	if receipt["stage"] != StageSVGAuthor {
		t.Fatalf("receipt stage = %v, want %q", receipt["stage"], StageSVGAuthor)
	}
	if receipt["status"] != StatusDone {
		t.Fatalf("receipt status = %v, want %q", receipt["status"], StatusDone)
	}
	if _, ok := receipt["artifacts"].([]any); !ok {
		t.Fatalf("receipt artifacts = %T, want array", receipt["artifacts"])
	}
	if _, ok := receipt["generated_at"]; ok {
		t.Fatalf("receipt contains generated_at, want StageReceipt-compatible schema: %+v", receipt)
	}

	for _, rel := range []string{"slides/01.svg", "slides/02.svg"} {
		raw, err := os.ReadFile(filepath.Join("demo", rel))
		if err != nil {
			t.Fatalf("missing %s: %v", rel, err)
		}
		svg := string(raw)
		for _, want := range []string{
			`slide:role="slide"`,
			`viewBox="0 0 960 540"`,
			`foreignObject`,
			`slide:role="shape"`,
			`slide:shape-type="text"`,
		} {
			if !strings.Contains(svg, want) {
				t.Fatalf("%s missing %q:\n%s", rel, want, svg)
			}
		}
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false, issues: %+v", validation.Issues)
	}
}

func TestAuthorSlidesFallsBackForUnsafeColorTokens(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"url(https://example.com/bg.svg)","ink":"red;background:url(https://example.com/x)","muted":"not-a-color","accent":"#abc"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	svg := string(raw)
	for _, banned := range []string{"url(", "https://example.com", "red;background", "not-a-color"} {
		if strings.Contains(svg, banned) {
			t.Fatalf("SVG contains unsafe color token %q:\n%s", banned, svg)
		}
	}
	for _, want := range []string{`fill="#FFFFFF"`, `color:#111827`, `color:#6B7280`, `fill="#abc"`, `color:#abc`} {
		if !strings.Contains(svg, want) {
			t.Fatalf("SVG missing normalized/default color %q:\n%s", want, svg)
		}
	}
}

func TestAuthorSlidesPreflightsSlidePathsBeforeWriting(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"},{"id":"s2","title":"Second claim","summary":"Second summary","role":"content","key_message":"Second key message","path":"slides/../02.svg"}]}`,
	)

	if _, err := AuthorSlides("demo"); err == nil {
		t.Fatal("expected invalid second slide path to fail")
	}
	if _, err := os.Stat(filepath.Join("demo", "slides", "01.svg")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("first slide output exists after preflight failure, stat err = %v", err)
	}
}

func TestAuthorSlidesRejectsMissingContentBeforeWriting(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"},{"id":"s2","title":"Second claim","summary":"Second summary","role":"content","key_message":"Second key message","path":"slides/02.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line"}]}`)

	if _, err := AuthorSlides("demo"); err == nil {
		t.Fatal("expected missing slide content to fail")
	}
	for _, rel := range []string{"slides/01.svg", "receipts/svg_author.json"} {
		if _, err := os.Stat(filepath.Join("demo", rel)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("%s exists after content preflight failure, stat err = %v", rel, err)
		}
	}
}

func TestAuthorSlidesRejectsDuplicateContentID(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":[],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]},{"id":"s1","content":"Duplicate body line","source_refs":[],"visuals":[{"id":"none-s1b","type":"none","instruction":"Text-only"}]}]}`)

	if _, err := AuthorSlides("demo"); err == nil {
		t.Fatal("expected duplicate slide content id to fail")
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "svg_author.json")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("svg_author receipt exists after duplicate content id failure, stat err = %v", err)
	}
}

func TestAuthorSlidesDoesNotRenderImageForNoneVisualDespiteReadyAsset(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), `<image slide:role="image"`) {
		t.Fatalf("visual type none should not render image:\n%s", string(raw))
	}
}

func TestAuthorSlidesDoesNotRenderImageForMismatchedVisualID(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the prepared hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"other","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), `<image slide:role="image"`) {
		t.Fatalf("mismatched visual id should not render image:\n%s", string(raw))
	}
}

func TestAuthorSlidesSkipsUnsafeOrUnsupportedReadyImageAssets(t *testing.T) {
	tests := []struct {
		name  string
		asset string
	}{
		{
			name:  "remote",
			asset: `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/hero.png","usage":"Hero image","status":"ready"}]}`,
		},
		{
			name:  "escape",
			asset: `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"../hero.png","usage":"Hero image","status":"ready"}]}`,
		},
		{
			name:  "diagram",
			asset: `{"assets":[{"id":"hero","slide_id":"s1","type":"diagram","path":"assets/images/hero.png","usage":"Hero diagram","status":"ready"}]}`,
		},
		{
			name:  "missing",
			asset: `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"missing"}]}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initAuthorDemoRun(t,
				`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
				`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
			)
			mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the prepared hero image"}]}]}`)
			mustWriteTestFile(t, "demo/assets/assets_plan.json", tt.asset)
			if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
				t.Fatal(err)
			}

			if _, err := AuthorSlides("demo"); err != nil {
				t.Fatal(err)
			}

			raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
			if err != nil {
				t.Fatal(err)
			}
			if strings.Contains(string(raw), `<image slide:role="image"`) {
				t.Fatalf("unsafe or unsupported asset should not render image:\n%s", string(raw))
			}
		})
	}
}

func initAuthorDemoRun(t *testing.T, visualSystem string, deck string) {
	t.Helper()
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", visualSystem)
	mustWriteTestFile(t, "demo/outline/deck.json", deck)
	writeAuthorInputsWithAnyGenContracts(t, `{"assets":[]}`)
	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	writeStatusTestRunFile(t, run)
}

func TestAuthorSlidesRendersSourceFootnotes(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","notes":"Speaker note","source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	writeStatusTestRunFile(t, run)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	svg := string(raw)
	for _, want := range []string{
		`来源`,
		`web1`,
		`slide:role="shape"`,
	} {
		if !strings.Contains(svg, want) {
			t.Fatalf("source footnote missing %q:\n%s", want, svg)
		}
	}
}

func TestAuthorSlidesRendersPreparedImageAsset(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Hero slide","summary":"Hero summary","role":"cover","key_message":"Hero key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line\nThird body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the prepared hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	writeStatusTestRunFile(t, run)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	svg := string(raw)
	for _, want := range []string{
		`<image slide:role="image"`,
		`slide:shape-type="image"`,
		`href="assets/images/hero.png"`,
	} {
		if !strings.Contains(svg, want) {
			t.Fatalf("prepared image asset missing %q:\n%s", want, svg)
		}
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false, issues: %+v", validation.Issues)
	}
}

func TestAuthorSlidesRendersImageFootnoteAndMultilineBodyWithValidation(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Hero slide","summary":"Hero summary","role":"cover","key_message":"Hero key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line\nThird body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the prepared hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	writeStatusTestRunFile(t, run)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false, issues: %+v", validation.Issues)
	}
}

func writeAuthorInputsWithAnyGenContracts(t *testing.T, assets string) {
	t.Helper()
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line","notes":"Speaker note","source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]},{"id":"s2","content":"Point A\nPoint B\nPoint C","source_refs":["web1"],"visuals":[{"id":"none-s2","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", assets)
}

func readAuthorReceiptForTest(t *testing.T) map[string]any {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "svg_author.json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	return receipt
}

func mustWriteTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
