package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWritePreviewWritesHTMLAndReceipt(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())

	report, err := WritePreview("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}
	if len(report.Slides) != 1 || !report.Slides[0].Rendered || report.Slides[0].Path != "slides/01.svg" {
		t.Fatalf("Slides = %+v, want rendered slides/01.svg", report.Slides)
	}

	htmlRaw, err := os.ReadFile(filepath.Join("demo", "preview.html"))
	if err != nil {
		t.Fatal(err)
	}
	html := string(htmlRaw)
	for _, want := range []string{"Demo - SVGlide Preview", `<link rel="icon" href="data:,">`, `data="slides/01.svg"`, "01. Slide", "Key Message"} {
		if !strings.Contains(html, want) {
			t.Fatalf("preview.html missing %q:\n%s", want, html)
		}
	}

	receipt := readPreviewReceipt(t)
	if receipt.Status != "passed" || len(receipt.Slides) != 1 || !receipt.Slides[0].Rendered {
		t.Fatalf("preview receipt = %+v, want passed rendered slide", receipt)
	}
}

func TestWritePreviewReportsMissingAssetsFromSVGAndManifest(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><image slide:role="image" href="assets/images/missing.png"/></svg>`)
	writeValidateTestFile(t, filepath.Join("demo", "assets", "assets_manifest.json"), `{"assets":[{"id":"hero","slide_id":"slide-1","kind":"image","local_path":"assets/images/missing.png","usage":"Hero image","status":"ready"}]}`)

	report, err := WritePreview("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.MissingAssetCount != 1 {
		t.Fatalf("MissingAssetCount = %d, want 1", report.MissingAssetCount)
	}

	receipt := readPreviewReceipt(t)
	if receipt.MissingAssetCount != 1 {
		t.Fatalf("receipt MissingAssetCount = %d, want 1", receipt.MissingAssetCount)
	}
}

func TestWritePreviewFailsOnRenderedVisualOverflow(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 1280 720"><text x="92" y="318" font-size="25">Revenue declined 4.3% year over year, but gross margin reached 46.6% and diluted EPS set a March-quarter record.</text></svg>`)

	report, err := WritePreview("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if report.RenderedVisual != renderedVisualReceiptPath || report.RenderedVisualIssueCount == 0 {
		t.Fatalf("rendered visual fields = %q/%d, want receipt and issues", report.RenderedVisual, report.RenderedVisualIssueCount)
	}
	var visual RenderedVisualReport
	raw, err := os.ReadFile(filepath.Join("demo", renderedVisualReceiptPath))
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(raw, &visual); err != nil {
		t.Fatal(err)
	}
	if visual.Status != "failed" || !renderedVisualHasCode(visual, "svglide.rendered_visual.text_overflow") {
		t.Fatalf("visual = %+v, want text overflow failure", visual)
	}
}

func TestWritePreviewEscapesDeckText(t *testing.T) {
	initValidateTestRun(t)
	writeDeckAt(t, filepath.Join("demo", "outline", "deck.json"), previewDeck{
		Title: `<Deck & Demo>`,
		Slides: []previewDeckSlide{{
			ID:         "cover",
			Title:      `<Cover & One>`,
			Summary:    `Summary <script>bad()</script>`,
			Role:       "cover",
			KeyMessage: `Message & context`,
			Path:       "slides/01.svg",
		}},
	})
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())

	if _, err := WritePreview("demo"); err != nil {
		t.Fatal(err)
	}

	htmlRaw, err := os.ReadFile(filepath.Join("demo", "preview.html"))
	if err != nil {
		t.Fatal(err)
	}
	html := string(htmlRaw)
	if strings.Contains(html, "<script>bad()</script>") {
		t.Fatalf("preview.html contains unescaped script:\n%s", html)
	}
	if !strings.Contains(html, "&lt;script&gt;bad()&lt;/script&gt;") || !strings.Contains(html, "&lt;Deck &amp; Demo&gt;") {
		t.Fatalf("preview.html missing escaped deck text:\n%s", html)
	}
}

func TestWritePreviewUsesRunArtifactDeckAndPreviewPath(t *testing.T) {
	initValidateTestRun(t)
	run := readValidateTestRunFile(t)
	run.Artifacts.Deck = "custom/deck.json"
	run.Artifacts.Preview = "public/deck.html"
	writeValidateTestRunFile(t, run)
	writeMinimalDeck(t, "demo", "slides/missing.svg")
	writeMinimalDeckAt(t, filepath.Join("demo", "custom", "deck.json"), "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())

	report, err := WritePreview("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}
	if _, err := os.Stat(filepath.Join("demo", "public", "deck.html")); err != nil {
		t.Fatalf("missing custom preview path: %v", err)
	}
	if _, err := os.Stat(filepath.Join("demo", "preview.html")); !os.IsNotExist(err) {
		t.Fatalf("default preview should not be written when artifact path is custom, stat err=%v", err)
	}
}

func TestWritePreviewReportsUnsafeSlidePath(t *testing.T) {
	tests := []struct {
		name        string
		slidePath   string
		filePath    string
		wantMessage string
	}{
		{
			name:        "escape",
			slidePath:   "../outside.svg",
			filePath:    "outside.svg",
			wantMessage: "slides/<file>.svg",
		},
		{
			name:        "remote scheme",
			slidePath:   "https:/evil.example/a.svg",
			filePath:    filepath.Join("demo", "https:", "evil.example", "a.svg"),
			wantMessage: "local slides/*.svg",
		},
		{
			name:        "encoded dot segment",
			slidePath:   "slides/%2e%2e.svg",
			filePath:    filepath.Join("demo", "slides", "%2e%2e.svg"),
			wantMessage: "percent encoding",
		},
		{
			name:        "nested directory",
			slidePath:   "slides/nested/01.svg",
			filePath:    filepath.Join("demo", "slides", "nested", "01.svg"),
			wantMessage: "slides/<file>.svg",
		},
		{
			name:        "backslash",
			slidePath:   `slides\01.svg`,
			filePath:    filepath.Join("demo", `slides\01.svg`),
			wantMessage: "forward slashes",
		},
		{
			name:        "wrong extension",
			slidePath:   "slides/01.png",
			filePath:    filepath.Join("demo", "slides", "01.png"),
			wantMessage: ".svg",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", tt.slidePath)
			writeValidateTestFile(t, tt.filePath, visibleTextSVG())

			report, err := WritePreview("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.Status != "failed" {
				t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
			}
			if len(report.Slides) != 1 || report.Slides[0].Rendered {
				t.Fatalf("Slides = %+v, want unrendered slide", report.Slides)
			}
			if !strings.Contains(report.Slides[0].Message, tt.wantMessage) {
				t.Fatalf("Message = %q, want %q", report.Slides[0].Message, tt.wantMessage)
			}
			receipt := readPreviewReceipt(t)
			if receipt.Status != "failed" || len(receipt.Slides) != 1 || receipt.Slides[0].Rendered {
				t.Fatalf("preview receipt = %+v, want failed unrendered slide", receipt)
			}
			htmlRaw, err := os.ReadFile(filepath.Join("demo", "preview.html"))
			if err != nil {
				t.Fatal(err)
			}
			if strings.Contains(string(htmlRaw), `data="`) {
				t.Fatalf("preview should not embed unsafe slide path:\n%s", string(htmlRaw))
			}
		})
	}
}

func TestWritePreviewWritesFailureArtifactsForDeckReadFailures(t *testing.T) {
	initValidateTestRun(t)
	if err := os.Remove(filepath.Join("demo", "outline", "deck.json")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}

	report, err := WritePreview("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if _, err := os.Stat(filepath.Join("demo", "preview.html")); err != nil {
		t.Fatalf("missing preview.html for failed deck read: %v", err)
	}
	receipt := readPreviewReceipt(t)
	if receipt.Status != "failed" || len(receipt.Slides) != 1 || receipt.Slides[0].Path != "outline/deck.json" {
		t.Fatalf("preview receipt = %+v, want failed deck report", receipt)
	}
}

func TestWritePreviewRejectsPreviewSymlink(t *testing.T) {
	cwd := initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
	outside := filepath.Join(filepath.Dir(cwd), "outside-preview.html")
	if err := os.WriteFile(outside, []byte("outside"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join("demo", "preview.html")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "preview.html")); err != nil {
		t.Fatal(err)
	}

	if _, err := WritePreview("demo"); err == nil {
		t.Fatal("expected preview symlink write refusal")
	}
	raw, err := os.ReadFile(outside)
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "outside" {
		t.Fatalf("outside preview overwritten: %q", string(raw))
	}
}

func TestWritePreviewRejectsPreviewReceiptSymlink(t *testing.T) {
	cwd := initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
	outside := filepath.Join(filepath.Dir(cwd), "outside-preview.json")
	if err := os.WriteFile(outside, []byte("outside"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(filepath.Join("demo", "receipts", "preview.json")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "receipts", "preview.json")); err != nil {
		t.Fatal(err)
	}

	if _, err := WritePreview("demo"); err == nil {
		t.Fatal("expected preview receipt symlink write refusal")
	}
	raw, err := os.ReadFile(outside)
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "outside" {
		t.Fatalf("outside preview receipt overwritten: %q", string(raw))
	}
}

func TestWritePreviewRejectsPreviewReceiptsDirectorySymlink(t *testing.T) {
	cwd := initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
	if err := os.RemoveAll(filepath.Join("demo", "receipts")); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(filepath.Dir(cwd), "outside-preview-receipts")
	if err := os.MkdirAll(outside, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "receipts")); err != nil {
		t.Fatal(err)
	}

	if _, err := WritePreview("demo"); err == nil {
		t.Fatal("expected preview receipts directory symlink write refusal")
	}
	if _, err := os.Stat(filepath.Join(outside, "preview.json")); !os.IsNotExist(err) {
		t.Fatalf("preview receipt should not be written outside run root, stat err=%v", err)
	}
}

func readPreviewReceipt(t *testing.T) PreviewReport {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "preview.json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt PreviewReport
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	return receipt
}

func writeDeckAt(t *testing.T, path string, deck previewDeck) {
	t.Helper()
	raw, err := json.MarshalIndent(deck, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	writeValidateTestFile(t, path, string(raw))
}
