package svglide

import (
	"encoding/base64"
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
	for _, callID := range []string{"activate_slides_edit", "slides_edit"} {
		toolReceipt := readAuthorToolCallReceiptForTest(t, callID)
		if toolReceipt["stage"] != StageSVGAuthor || toolReceipt["call_id"] != callID || toolReceipt["status"] != StatusDone {
			t.Fatalf("%s receipt = %+v, want svg_author done receipt", callID, toolReceipt)
		}
		if toolReceipt["condition_matched"] != true {
			t.Fatalf("%s condition_matched = %v, want true", callID, toolReceipt["condition_matched"])
		}
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

func TestAuthorSlidesAcceptsRichVisualSystemContract(t *testing.T) {
	initAuthorDemoRun(t,
		`{"prompt_contract":{"stage":"design_brief"},"color_system":{"backgrounds":["#F4EFE4","#0F1510"],"ink":"#172019","body":"#3B3F38","tea_amber":"#B97832"},"typography":{"display":"Songti SC, Noto Serif SC, STSong, serif","body":"Noto Sans SC, Noto Sans SC, Microsoft YaHei, sans-serif"},"layout_language":{"grid":"960x540","container_policy":"content decides container"}}`,
		`{"title":"品中国茶","slides":[{"id":"s1","title":"品中国茶","summary":"Tea summary","role":"cover","key_message":"从一片叶子进入山水、工艺与时间。","path":"slides/01.svg"}]}`,
	)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	svg := string(raw)
	for _, want := range []string{`fill="#F4EFE4"`, `color:#172019`, `color:#B97832`} {
		if !strings.Contains(svg, want) {
			t.Fatalf("rich visual system output missing %q:\n%s", want, svg)
		}
	}
}

func TestAuthorUsesStructuredAudiencePayloadBeforeRawContent(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"品中国茶","slides":[{"id":"s1","title":"六大茶类","summary":"Tea summary","role":"content","key_message":"分类来自工艺","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"白茶\n绿茶\n黄茶\n乌龙\n红茶\n黑茶","central_claim":"六大茶类的核心差异来自氧化程度和工艺路径。","audience_takeaway":"观众能把茶名、工艺和风味联系起来。","supporting_points":[{"text":"绿茶通过杀青固定鲜爽风味，因此呈现低氧化特征。","source_refs":["web1"]},{"text":"乌龙茶处在半氧化区间，香气和焙火层次更复杂。","source_refs":["web1"]}],"source_bound_facts":[{"fact":"茶类划分和加工方式直接相关。","source_ref":"web1","usage":"evidence"}],"examples_or_parameters":[{"label":"氧化程度","value":"低到高","explanation":"用同一条尺度解释主要茶类差异。","source_ref":"web1"}],"visual_data_items":[],"source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}],"so_what":"这页应把分类从名词列表变成可理解的风味地图。"}]}`)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	svg := string(raw)
	for _, want := range []string{"六大茶类的核心差异来自氧化程度和工艺路径", "绿茶通过杀青固定鲜爽风味"} {
		if !strings.Contains(svg, want) {
			t.Fatalf("SVG missing structured payload %q:\n%s", want, svg)
		}
	}
	if strings.Contains(svg, "白茶\n绿茶\n黄茶") {
		t.Fatalf("SVG rendered raw label-list content as body:\n%s", svg)
	}
}

func TestAuthorInlineDiagramVisualFormsRenderDistinctSkeletons(t *testing.T) {
	theme := authorTheme{
		Background: "#F4EFE4",
		Ink:        "#172019",
		Muted:      "#6B7280",
		Accent:     "#B97832",
		TitleSize:  36,
		BodySize:   16,
	}
	content := authorSlideContent{
		ID:      "s1",
		Content: "绿茶 / 乌龙 / 红茶 / 白茶 / 黑茶 / 黄茶",
	}
	forms := []string{
		authorVisualFormFourQuadrant,
		authorVisualFormSpectrum,
		authorVisualFormMapRoute,
		authorVisualFormProcessFlow,
		authorVisualFormParameterMatrix,
		authorVisualFormSensoryWheel,
		authorVisualFormObjectCallout,
	}
	seen := map[string]string{}
	for _, form := range forms {
		var b strings.Builder
		renderAuthorInlineDiagram(&b, authorSlideVisual{ID: form, Type: "diagram", Instruction: form, VisualForm: form}, content, 80, 80, 420, 260, theme)
		svg := `<svg xmlns="http://www.w3.org/2000/svg">` + b.String() + `</svg>`
		skeleton := visualSkeletonSignature(analyzeVisualSkeleton(svg))
		if !strings.Contains(skeleton, "diagram:"+form+"|") {
			t.Fatalf("form %s skeleton = %q, want diagram form marker; svg=%s", form, skeleton, svg)
		}
		if previous, exists := seen[skeleton]; exists {
			t.Fatalf("forms %s and %s rendered the same skeleton %q", previous, form, skeleton)
		}
		seen[skeleton] = form
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

func TestAuthorSlidesRendersExperimentRemoteImageAsset(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Hero slide","summary":"Hero summary","role":"cover","key_message":"Hero key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the remote hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/hero.png","usage":"Hero image","status":"ready"}]}`)

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
		`href="https://example.com/hero.png"`,
	} {
		if !strings.Contains(svg, want) {
			t.Fatalf("experiment remote image missing %q:\n%s", want, svg)
		}
	}
}

func TestAuthorSlidesSkipsUnsupportedReadyImageAssets(t *testing.T) {
	tests := []struct {
		name  string
		asset string
	}{
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
				t.Fatalf("unsupported asset should not render image:\n%s", string(raw))
			}
		})
	}
}

func TestAuthorSlidesRendersExistingAbsoluteImageAssetInExperiment(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	outside := filepath.Join(t.TempDir(), "hero.png")
	if err := os.WriteFile(outside, []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the prepared hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+outside+`","usage":"Hero image","status":"ready"}]}`)

	if _, err := AuthorSlides("demo"); err != nil {
		t.Fatal(err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(raw), outside) || !strings.Contains(string(raw), `<image slide:role="image"`) {
		t.Fatalf("absolute asset should render image in experiment mode:\n%s", string(raw))
	}
}

func initAuthorDemoRun(t *testing.T, visualSystem string, deck string) {
	t.Helper()
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", visualSystem)
	mustWriteTestFile(t, "demo/brief/typography_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"profile":"editorial_report","roles":{"display":{"family":"Noto Serif SC","weight":"700","size":"42","usage":"title"},"body":{"family":"Noto Sans SC","weight":"400","size":"18","usage":"body"},"number":{"family":"Roboto Mono","weight":"700","size":"34","usage":"numbers"},"label":{"family":"Noto Sans SC","weight":"600","size":"13","usage":"labels"}},"rules":["test typography"]}`)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"visual_quality_contract":{"profile":"text_only","requires_real_images":false,"topic_archetype":"","media_pressure":{},"editorial_quality_target":{},"reason":"author fixture"}}`)
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
		`href="../assets/images/hero.png"`,
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

func TestAuthorSlidesReadsAssetsManifestAndSerializesNotes(t *testing.T) {
	initStatusTestRun(t)

	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line","notes":"Speaker note","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use the manifest hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	mustWriteTestPNGFile(t, "demo/assets/images/hero.png")

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
		`<slide:note>Speaker note`,
		`来源：web1</slide:note>`,
		`<image slide:role="image"`,
		`href="../assets/images/hero.png"`,
	} {
		if !strings.Contains(svg, want) {
			t.Fatalf("SVG missing %q:\n%s", want, svg)
		}
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
	if strings.Contains(assets, `"assets":[]`) && !strings.Contains(assets, `"no_image_reason"`) {
		assets = strings.TrimSuffix(strings.TrimSpace(assets), "}") + `,"no_image_reason":"Text-only deck; no image assets required"}`
	}
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"First claim","body":"First body line\nSecond body line","labels":[]},"production_instruction":{"layout":"Text-only","asset_ids":[]}},{"id":"s2","audience_copy":{"title":"Second claim","body":"Point A\nPoint B\nPoint C","labels":[]},"production_instruction":{"layout":"Text-only","asset_ids":[]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line","notes":"Speaker note","source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]},{"id":"s2","content":"Point A\nPoint B\nPoint C","source_refs":["web1"],"visuals":[{"id":"none-s2","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", assets)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", assets)
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

func readAuthorToolCallReceiptForTest(t *testing.T, callID string) map[string]any {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "tool_calls", StageSVGAuthor, callID+".json"))
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
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if filepath.ToSlash(path) == "demo/research/sources.json" {
		content = testResearchSourcesJSON(content)
	}
	if filepath.ToSlash(path) == "demo/brief/typography_contract.json" {
		content = testTypographyContractJSON(content)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	if filepath.ToSlash(path) == "demo/research/sources.json" {
		mustWriteDefaultResearchPlanForTest(t, path, content)
	}
	if strings.HasSuffix(filepath.ToSlash(path), assetsPlanPath) {
		manifestPath := filepath.Join(filepath.Dir(path), filepath.Base(assetsManifestPath))
		if err := os.WriteFile(manifestPath, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
		candidatesPath := filepath.Join(filepath.Dir(path), filepath.Base(imageCandidatesPath))
		if _, err := os.Stat(candidatesPath); os.IsNotExist(err) {
			if err := os.WriteFile(candidatesPath, []byte(testImageCandidatesJSON(content)), 0o644); err != nil {
				t.Fatal(err)
			}
		} else if err != nil {
			t.Fatal(err)
		}
		inventoryPath := filepath.Join(filepath.Dir(path), filepath.Base(assetInventoryPath))
		if err := os.WriteFile(inventoryPath, []byte(testAssetInventoryJSON(content)), 0o644); err != nil {
			t.Fatal(err)
		}
		chartManifestPath := filepath.Join(filepath.Dir(path), "charts", "chart_manifest.json")
		if err := os.MkdirAll(filepath.Dir(chartManifestPath), 0o755); err != nil {
			t.Fatal(err)
		}
		chartBriefsPath := filepath.Join(filepath.Dir(path), "charts", "chart_briefs.json")
		if err := os.WriteFile(chartBriefsPath, []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"charts":[]}`), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(chartManifestPath, []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"none","charts":[]}`), 0o644); err != nil {
			t.Fatal(err)
		}
		chartRenderPath := filepath.Join(filepath.Dir(filepath.Dir(path)), chartRenderReceiptPath)
		if err := os.MkdirAll(filepath.Dir(chartRenderPath), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(chartRenderPath, []byte(`{"status":"passed","renderer":"node-vega-lite","charts":[],"issues":[]}`), 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func testResearchSourcesJSON(content string) string {
	var file struct {
		PromptContract json.RawMessage            `json:"prompt_contract,omitempty"`
		Sources        []map[string]any           `json:"sources"`
		Extra          map[string]json.RawMessage `json:"-"`
	}
	if err := json.Unmarshal([]byte(content), &file); err != nil || len(file.Sources) == 0 {
		return content
	}
	for i := range file.Sources {
		id, _ := file.Sources[i]["id"].(string)
		if strings.TrimSpace(id) == "" {
			id = "src1"
		}
		if _, ok := file.Sources[i]["query_id"]; !ok {
			file.Sources[i]["query_id"] = "q_" + id
		}
		if _, ok := file.Sources[i]["source_class"]; !ok {
			file.Sources[i]["source_class"] = "general_web_search"
		}
		if _, ok := file.Sources[i]["authority_tier"]; !ok {
			file.Sources[i]["authority_tier"] = "general"
		}
	}
	if len(file.PromptContract) == 0 {
		file.PromptContract = json.RawMessage(promptContractJSON(StageResearch))
	}
	raw, err := json.Marshal(map[string]any{
		"prompt_contract": file.PromptContract,
		"sources":         file.Sources,
	})
	if err != nil {
		return content
	}
	return string(raw)
}

func mustWriteDefaultResearchPlanForTest(t *testing.T, path string, sourcesJSON string) {
	t.Helper()
	researchDir := filepath.Dir(path)
	planPath := filepath.Join(researchDir, "research_plan.json")
	queriesPath := filepath.Join(researchDir, "queries.json")
	if _, err := os.Stat(planPath); err == nil {
		return
	} else if err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	var sources struct {
		Sources []struct {
			ID          string `json:"id"`
			QueryID     string `json:"query_id"`
			SourceClass string `json:"source_class"`
			Usage       string `json:"usage"`
		} `json:"sources"`
	}
	if err := json.Unmarshal([]byte(sourcesJSON), &sources); err != nil || len(sources.Sources) == 0 {
		return
	}
	entityName, entityType := readTestResolvedEntityForResearchPlan()
	identityRequired := false
	sourceClass := strings.TrimSpace(sources.Sources[0].SourceClass)
	if sourceClass == "" {
		sourceClass = "general_web_search"
	}
	queryID := strings.TrimSpace(sources.Sources[0].QueryID)
	if queryID == "" {
		queryID = "q_" + strings.TrimSpace(sources.Sources[0].ID)
	}
	requiredClasses := []string{sourceClass}
	planRaw, err := json.Marshal(map[string]any{
		"prompt_contract": json.RawMessage(promptContractJSON(StageResearch)),
		"entity": map[string]any{
			"name":                  entityName,
			"type":                  entityType,
			"requires_confirmation": identityRequired,
		},
		"identifiers": []map[string]any{{
			"id":            "id_topic",
			"type":          "topic_phrase",
			"value":         entityName,
			"confidence_bp": 9000,
			"reason":        "test fixture default research plan",
		}},
		"evidence_needs": []map[string]any{{
			"id":       "need_context",
			"type":     "context",
			"required": true,
		}},
		"source_ladders": []map[string]any{{
			"identifier_id":                 "id_topic",
			"evidence_need_id":              "need_context",
			"required_source_classes":       requiredClasses,
			"fallback_source_classes":       []string{},
			"forbidden_only_source_classes": []string{},
		}},
		"minimum_coverage": map[string]any{
			"min_retrieved_sources":                 1,
			"identity_source_required":              identityRequired,
			"all_required_source_classes_attempted": true,
		},
		"failure_policy": map[string]any{
			"block_if_required_source_class_missing":       true,
			"block_if_only_general_search":                 false,
			"clarify_if_identity_unconfirmed_after_ladder": true,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(planPath, rawWithNewline(planRaw), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(queriesPath); err == nil {
		return
	} else if err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	queries := make([]map[string]any, 0, len(sources.Sources))
	for _, source := range sources.Sources {
		id := strings.TrimSpace(source.ID)
		queryID := strings.TrimSpace(source.QueryID)
		if queryID == "" {
			queryID = "q_" + id
		}
		sourceClass := strings.TrimSpace(source.SourceClass)
		if sourceClass == "" {
			sourceClass = "general_web_search"
		}
		purpose := "context"
		if strings.TrimSpace(source.Usage) == "identity" {
			purpose = "identity"
		}
		queries = append(queries, map[string]any{
			"id":                   queryID,
			"plan_identifier_id":   "id_topic",
			"source_class":         sourceClass,
			"method":               "search_query",
			"query_or_url":         entityName,
			"purpose":              purpose,
			"status":               "retrieved",
			"retrieved_source_ids": []string{id},
		})
	}
	queryRaw, err := json.Marshal(map[string]any{
		"prompt_contract": json.RawMessage(promptContractJSON(StageResearch)),
		"queries":         queries,
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(queriesPath, rawWithNewline(queryRaw), 0o644); err != nil {
		t.Fatal(err)
	}
}

func readTestResolvedEntityForResearchPlan() (string, string) {
	raw, err := os.ReadFile(filepath.Join("demo", "request", "entity_resolution.json"))
	if err != nil {
		return "给阿嬷的情书", "topic"
	}
	var resolution entityResolutionArtifact
	if err := json.Unmarshal(raw, &resolution); err != nil {
		return "给阿嬷的情书", "topic"
	}
	name := strings.TrimSpace(resolution.ResolvedEntity.Name)
	if name == "" {
		name = "给阿嬷的情书"
	}
	entityType := strings.TrimSpace(resolution.ResolvedEntity.Type)
	if entityType == "" {
		entityType = "topic"
	}
	return name, entityType
}

func rawWithNewline(raw []byte) []byte {
	return append(raw, '\n')
}

func testTypographyContractJSON(content string) string {
	var file struct {
		PromptContract json.RawMessage               `json:"prompt_contract,omitempty"`
		Profile        string                        `json:"profile"`
		SelectedMoods  []string                      `json:"selected_moods,omitempty"`
		FontSource     string                        `json:"font_source,omitempty"`
		Roles          map[string]typographyFontRole `json:"roles"`
		Rules          []string                      `json:"rules"`
	}
	if err := json.Unmarshal([]byte(content), &file); err != nil || len(file.Roles) == 0 {
		return content
	}
	wasOldFixture := strings.TrimSpace(file.FontSource) == "" || len(file.SelectedMoods) == 0
	if len(file.PromptContract) == 0 {
		file.PromptContract = json.RawMessage(promptContractJSON(StageDesignBrief))
	}
	if strings.TrimSpace(file.Profile) == "" {
		file.Profile = "editorial_report"
	}
	if wasOldFixture {
		mood, roleFamilies := testTypographyPresetForProfile(file.Profile)
		file.FontSource = typographyFontSourcePreset
		file.SelectedMoods = []string{mood}
		for role, family := range roleFamilies {
			font := file.Roles[role]
			font.Family = family
			file.Roles[role] = font
		}
	}
	raw, err := json.Marshal(file)
	if err != nil {
		return content
	}
	return string(raw)
}

func testTypographyPresetForProfile(profile string) (string, map[string]string) {
	lower := strings.ToLower(profile)
	switch {
	case containsAny(lower, []string{"sport", "sports", "score"}):
		return "sports_broadcast", map[string]string{
			"display": "Anton",
			"body":    "Barlow Condensed",
			"number":  "Anton",
			"label":   "Oswald",
		}
	case containsAny(lower, []string{"finance", "financial", "data"}):
		return "finance_institutional", map[string]string{
			"display": "IBM Plex Sans",
			"body":    "IBM Plex Sans",
			"number":  "Roboto Mono",
			"label":   "IBM Plex Sans",
		}
	case containsAny(lower, []string{"luxury", "premium", "brand"}):
		return "luxury_editorial", map[string]string{
			"display": "Playfair Display",
			"body":    "Lora",
			"number":  "Montserrat",
			"label":   "Josefin Sans",
		}
	case containsAny(lower, []string{"culture", "heritage", "tea"}):
		return "culture_heritage", map[string]string{
			"display": "ChillJinshuSongMedium",
			"body":    "Noto Serif SC",
			"number":  "Noto Sans SC",
			"label":   "ChillDuanHeiSong_CompactRegular",
		}
	default:
		return "corporate_neutral", map[string]string{
			"display": "Montserrat",
			"body":    "Inter",
			"number":  "Roboto Mono",
			"label":   "Inter",
		}
	}
}

func mustWriteTestPNGFile(t *testing.T, path string) {
	t.Helper()
	raw, err := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, raw, 0o644); err != nil {
		t.Fatal(err)
	}
}

func testAssetInventoryJSON(assets string) string {
	var file deckAssetsFile
	if err := json.Unmarshal([]byte(assets), &file); err != nil {
		return `{"prompt_contract":` + promptContractJSON(StageAssets) + `,"items":[]}`
	}
	items := make([]map[string]any, 0, len(file.Assets))
	for _, asset := range file.Assets {
		if assetStatus(asset) != "ready" {
			continue
		}
		format := strings.TrimPrefix(assetExt(asset), ".")
		if format == "" {
			format = "unknown"
		}
		items = append(items, map[string]any{
			"id":               assetID(asset),
			"path":             assetPath(asset),
			"source_url":       strings.TrimSpace(asset.SourceURL),
			"width":            960,
			"height":           540,
			"semantic_type":    assetType(asset),
			"large_ok":         true,
			"full_bleed_ok":    true,
			"recommended_use":  strings.TrimSpace(asset.Usage),
			"avoid_reason":     "",
			"format":           format,
			"has_alpha":        assetExt(asset) == ".png",
			"asset_role":       "hero_photo",
			"fit_role":         "split_panel",
			"candidate_id":     "cand-" + assetID(asset),
			"selection_reason": "test fixture selected image",
		})
	}
	raw, err := json.Marshal(map[string]any{
		"prompt_contract": json.RawMessage(promptContractJSON(StageAssets)),
		"items":           items,
	})
	if err != nil {
		return `{"prompt_contract":` + promptContractJSON(StageAssets) + `,"items":[]}`
	}
	return string(raw)
}

func testImageCandidatesJSON(assets string) string {
	var file deckAssetsFile
	if err := json.Unmarshal([]byte(assets), &file); err != nil {
		return `{"prompt_contract":` + promptContractJSON(StageAssets) + `,"requires_real_images":false,"no_image_reason":"invalid test asset fixture; no image candidates","candidates":[]}`
	}
	candidates := make([]map[string]any, 0, len(file.Assets))
	for _, asset := range file.Assets {
		if !isRasterImageAsset(asset) {
			continue
		}
		path := assetPath(asset)
		sourceURL := strings.TrimSpace(asset.SourceURL)
		if sourceURL == "" {
			sourceURL = strings.TrimSpace(asset.Path)
		}
		format := strings.TrimPrefix(assetExt(asset), ".")
		if format == "" {
			format = "unknown"
		}
		candidates = append(candidates, map[string]any{
			"id":                      "cand-" + assetID(asset),
			"query":                   strings.TrimSpace(asset.Usage),
			"source_url":              sourceURL,
			"source_class":            "user_provided",
			"format":                  format,
			"width":                   960,
			"height":                  540,
			"has_alpha":               assetExt(asset) == ".png",
			"asset_role":              "hero_photo",
			"fit_role":                "split_panel",
			"local_path":              path,
			"score_bp":                9000,
			"selected":                true,
			"selection_reason":        "test fixture selected image",
			"format_exception_reason": "",
			"rejection_reason":        "",
		})
	}
	payload := map[string]any{
		"prompt_contract":      json.RawMessage(promptContractJSON(StageAssets)),
		"requires_real_images": len(candidates) > 0,
		"candidates":           candidates,
	}
	if len(candidates) == 0 {
		payload["no_image_reason"] = "test fixture has no real raster image assets"
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return `{"prompt_contract":` + promptContractJSON(StageAssets) + `,"requires_real_images":false,"no_image_reason":"test fixture has no real raster image assets","candidates":[]}`
	}
	return string(raw)
}
