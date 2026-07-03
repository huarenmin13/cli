package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateRunRejectsBackgroundOnlySVGAndWritesRepairArtifacts(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), backgroundOnlySVG())

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}

	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if len(report.Issues) == 0 {
		t.Fatal("expected background-only SVG issue")
	}
	if !validationIssuesContain(report.Issues, "background") {
		t.Fatalf("Issues = %+v, want background/placeholder issue", report.Issues)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "lint.json"))
	if err != nil {
		t.Fatalf("missing lint receipt: %v", err)
	}
	var receipt ValidationReport
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatalf("lint receipt is not ValidationReport JSON: %v", err)
	}
	if receipt.OK || len(receipt.Issues) == 0 {
		t.Fatalf("lint receipt = %+v, want failing issues", receipt)
	}
	var lintReceipt validationLintReceipt
	if err := json.Unmarshal(raw, &lintReceipt); err != nil {
		t.Fatalf("lint receipt is not schema-compatible JSON: %v", err)
	}
	if lintReceipt.Status != "failed" {
		t.Fatalf("lint receipt status = %q, want failed", lintReceipt.Status)
	}
	if lintReceipt.Issues[0].Code == "" || lintReceipt.Issues[0].Severity == "" {
		t.Fatalf("lint receipt issue = %+v, want code and severity", lintReceipt.Issues[0])
	}

	queue, err := os.ReadFile(filepath.Join("demo", "repair_queue.md"))
	if err != nil {
		t.Fatalf("missing repair queue: %v", err)
	}
	if !strings.Contains(string(queue), "slides/01.svg") {
		t.Fatalf("repair queue = %q, want slide path", string(queue))
	}
}

func TestValidateRunPassesVisibleTextSVG(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}

	if !report.OK {
		t.Fatalf("OK = false, issues = %+v", report.Issues)
	}
	if len(report.Issues) != 0 {
		t.Fatalf("Issues = %+v, want empty", report.Issues)
	}
	queue, err := os.ReadFile(filepath.Join("demo", "repair_queue.md"))
	if err != nil {
		t.Fatalf("missing repair queue: %v", err)
	}
	if strings.TrimSpace(string(queue)) != "No repair needed." {
		t.Fatalf("repair queue = %q, want no repair text", string(queue))
	}
}

func TestValidateRunRejectsEscapingSlidePath(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "../outside.svg")
	writeValidateTestFile(t, "outside.svg", visibleTextSVG())

	report, err := ValidateRun("demo")
	if err == nil && report.OK {
		t.Fatalf("ValidateRun OK with escaping slide path: %+v", report)
	}
}

func TestValidateRunRejectsSlideSymlinks(t *testing.T) {
	tests := []struct {
		name      string
		deckPath  string
		setupLink func(t *testing.T, outside string)
	}{
		{
			name:     "file symlink",
			deckPath: "slides/01.svg",
			setupLink: func(t *testing.T, outside string) {
				if err := os.Symlink(filepath.Join(outside, "01.svg"), filepath.Join("demo", "slides", "01.svg")); err != nil {
					t.Fatal(err)
				}
			},
		},
		{
			name:     "intermediate symlink",
			deckPath: "slides/link/01.svg",
			setupLink: func(t *testing.T, outside string) {
				if err := os.Symlink(outside, filepath.Join("demo", "slides", "link")); err != nil {
					t.Fatal(err)
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cwd := initValidateTestRun(t)
			writeMinimalDeck(t, "demo", tt.deckPath)
			outside := filepath.Join(filepath.Dir(cwd), "outside")
			if err := os.MkdirAll(outside, 0o755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join(outside, "01.svg"), []byte(visibleTextSVG()), 0o644); err != nil {
				t.Fatal(err)
			}
			tt.setupLink(t, outside)

			report, err := ValidateRun("demo")
			if err == nil && report.OK {
				t.Fatalf("ValidateRun OK with symlinked slide path: %+v", report)
			}
		})
	}
}

func TestValidateRunRejectsDeckSymlinks(t *testing.T) {
	tests := []struct {
		name      string
		deckPath  string
		setupLink func(t *testing.T, outside string)
	}{
		{
			name:     "file symlink",
			deckPath: filepath.Join("demo", "outline", "deck.json"),
			setupLink: func(t *testing.T, outside string) {
				if err := os.Remove(filepath.Join("demo", "outline", "deck.json")); err != nil {
					t.Fatal(err)
				}
				if err := os.Symlink(filepath.Join(outside, "deck.json"), filepath.Join("demo", "outline", "deck.json")); err != nil {
					t.Fatal(err)
				}
			},
		},
		{
			name:     "intermediate symlink",
			deckPath: filepath.Join("demo", "outline_link", "deck.json"),
			setupLink: func(t *testing.T, outside string) {
				run := readValidateTestRunFile(t)
				run.Artifacts.Deck = "outline_link/deck.json"
				writeValidateTestRunFile(t, run)
				if err := os.Symlink(outside, filepath.Join("demo", "outline_link")); err != nil {
					t.Fatal(err)
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cwd := initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
			outside := filepath.Join(filepath.Dir(cwd), "outside")
			if err := os.MkdirAll(outside, 0o755); err != nil {
				t.Fatal(err)
			}
			writeMinimalDeckAt(t, filepath.Join(outside, "deck.json"), "slides/01.svg")
			tt.setupLink(t, outside)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.OK {
				t.Fatalf("ValidateRun OK with symlinked deck path %q: %+v", tt.deckPath, report)
			}
		})
	}
}

func TestValidateRunRejectsEmptyDeck(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo")

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	assertValidationFailureArtifacts(t, "demo", report, "no slides")
}

func TestValidateRunWritesRepairArtifactsForDeckReadFailures(t *testing.T) {
	tests := []struct {
		name    string
		setup   func(t *testing.T)
		wantErr string
	}{
		{
			name: "missing deck",
			setup: func(t *testing.T) {
				if err := os.Remove(filepath.Join("demo", "outline", "deck.json")); err != nil {
					t.Fatal(err)
				}
			},
			wantErr: "deck",
		},
		{
			name: "invalid deck json",
			setup: func(t *testing.T) {
				writeValidateTestFile(t, filepath.Join("demo", "outline", "deck.json"), `{`)
			},
			wantErr: "deck",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			tt.setup(t)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			assertValidationFailureArtifacts(t, "demo", report, tt.wantErr)
		})
	}
}

func TestValidateRunReadsDeckFromRunArtifacts(t *testing.T) {
	initValidateTestRun(t)
	run := readValidateTestRunFile(t)
	run.Artifacts.Deck = "custom/deck.json"
	writeValidateTestRunFile(t, run)
	writeMinimalDeck(t, "demo", "slides/bad.svg")
	writeMinimalDeckAt(t, filepath.Join("demo", "custom", "deck.json"), "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !report.OK {
		t.Fatalf("OK = false, issues = %+v", report.Issues)
	}
}

func TestValidateRunReportsInvalidXML(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg><text>broken`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}

	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContain(report.Issues, "XML") && !validationIssuesContain(report.Issues, "xml") {
		t.Fatalf("Issues = %+v, want XML parse issue", report.Issues)
	}
}

func TestValidateRunRequiresSVGRootSlideRoleAndViewBox(t *testing.T) {
	tests := []struct {
		name string
		svg  string
		want string
	}{
		{
			name: "non svg root",
			svg:  `<html><body>not svg</body></html>`,
			want: "<svg>",
		},
		{
			name: "wrong svg namespace",
			svg:  `<svg xmlns="https://wrong.example/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><text>hello</text></svg>`,
			want: "<svg>",
		},
		{
			name: "missing slide role",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><text>hello</text></svg>`,
			want: `slide:role`,
		},
		{
			name: "missing viewBox",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide"><text>hello</text></svg>`,
			want: `viewBox`,
		},
		{
			name: "wrong namespaced slide role",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:foo="https://wrong.example" foo:role="slide" viewBox="0 0 960 540"><text>hello</text></svg>`,
			want: `slide:role`,
		},
		{
			name: "unbound slide prefix role",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" slide:role="slide" viewBox="0 0 960 540"><text>hello</text></svg>`,
			want: `slide:role`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), tt.svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.OK {
				t.Fatalf("OK = true, want false")
			}
			if !validationIssuesContain(report.Issues, tt.want) {
				t.Fatalf("Issues = %+v, want %q", report.Issues, tt.want)
			}
		})
	}
}

func TestValidateRunRejectsInvalidViewBox(t *testing.T) {
	tests := []struct {
		name string
		svg  string
	}{
		{
			name: "bad viewBox with text",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="bad"><text>hello</text></svg>`,
		},
		{
			name: "bad viewBox origin fields",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="bad bad 960 540"><text>hello</text></svg>`,
		},
		{
			name: "nan viewBox width",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 NaN 540"><text>hello</text></svg>`,
		},
		{
			name: "zero viewBox with text",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 0 540"><text>hello</text></svg>`,
		},
		{
			name: "bad viewBox with full page rect",
			svg:  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="bad"><rect width="960" height="540" fill="#fff"/></svg>`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), tt.svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.OK {
				t.Fatalf("OK = true, want false")
			}
			if !validationIssuesContain(report.Issues, "viewBox") {
				t.Fatalf("Issues = %+v, want viewBox issue", report.Issues)
			}
		})
	}
}

func TestValidateRunIgnoresNonVisibleContent(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{
			name: "text in defs",
			body: `<defs><text>hidden template</text></defs>`,
		},
		{
			name: "display none text",
			body: `<text display="none">hidden</text>`,
		},
		{
			name: "visibility hidden text",
			body: `<text visibility="hidden">hidden</text>`,
		},
		{
			name: "style display none text",
			body: `<text style="display:none">hidden</text>`,
		},
		{
			name: "style visibility hidden text",
			body: `<text style="visibility:hidden">hidden</text>`,
		},
		{
			name: "opacity zero text",
			body: `<text opacity="0">hidden</text>`,
		},
		{
			name: "style opacity zero text",
			body: `<text style="opacity:0">hidden</text>`,
		},
		{
			name: "empty text",
			body: `<text>   </text>`,
		},
		{
			name: "image without href",
			body: `<image slide:role="image" width="120" height="80"/>`,
		},
		{
			name: "use without href",
			body: `<use x="10" y="10"/>`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">` + tt.body + `</svg>`
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.OK {
				t.Fatalf("OK = true, want false")
			}
			if !validationIssuesContain(report.Issues, "background") && !validationIssuesContain(report.Issues, "placeholder") {
				t.Fatalf("Issues = %+v, want placeholder issue", report.Issues)
			}
		})
	}
}

func TestValidateRunRejectsWrongNamespaceVisibleContent(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{
			name: "wrong namespace path",
			body: `<bad:path xmlns:bad="https://wrong.example/svg" d="M10 10h20v20z"/>`,
		},
		{
			name: "wrong namespace text",
			body: `<bad:text xmlns:bad="https://wrong.example/svg">hidden by namespace</bad:text>`,
		},
		{
			name: "wrong namespace image href",
			body: `<image xmlns:bad="https://wrong.example/svg" bad:href="asset.png" width="120" height="80"/>`,
		},
		{
			name: "wrong namespace viewBox",
			body: `<text>hello</text>`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			viewBox := `viewBox="0 0 960 540"`
			if tt.name == "wrong namespace viewBox" {
				viewBox = `bad:viewBox="0 0 960 540" xmlns:bad="https://wrong.example/svg"`
			}
			svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" ` + viewBox + `>` + tt.body + `</svg>`
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.OK {
				t.Fatalf("OK = true, want false")
			}
			if tt.name == "wrong namespace viewBox" {
				if !validationIssuesContain(report.Issues, "viewBox") {
					t.Fatalf("Issues = %+v, want viewBox issue", report.Issues)
				}
				return
			}
			if !validationIssuesContain(report.Issues, "background") && !validationIssuesContain(report.Issues, "placeholder") {
				t.Fatalf("Issues = %+v, want placeholder issue", report.Issues)
			}
		})
	}
}

func TestValidateRunAcceptsNamespacedXLinkHref(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" xmlns:xlink="http://www.w3.org/1999/xlink" slide:role="slide" viewBox="0 0 960 540"><image slide:role="image" xlink:href="asset.png" width="120" height="80"/></svg>`
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), svg)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !report.OK {
		t.Fatalf("OK = false, issues = %+v", report.Issues)
	}
}

func TestValidateRunRejectsNegativeElementDimensions(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <foreignObject x="10" y="10" width="100" height="-4" slide:role="shape" slide:shape-type="text">
    <div xmlns="http://www.w3.org/1999/xhtml">Bad size</div>
  </foreignObject>
</svg>`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContainCode(report.Issues, "svglide.geometry") {
		t.Fatalf("issues = %+v, want geometry issue", report.Issues)
	}
}

func TestValidateRunRejectsRemoteImageHref(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <image slide:role="image" slide:shape-type="image" href="https://example.com/hero.png" x="10" y="10" width="200" height="120"/>
</svg>`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContainCode(report.Issues, "svglide.remote_asset") {
		t.Fatalf("issues = %+v, want remote asset issue", report.Issues)
	}
}

func TestValidateRunRejectsRemoteImageHrefCaseInsensitive(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <image slide:role="image" slide:shape-type="image" href="HTTPS://example.com/hero.png" x="10" y="10" width="200" height="120"/>
</svg>`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContainCode(report.Issues, "svglide.remote_asset") {
		t.Fatalf("issues = %+v, want remote asset issue", report.Issues)
	}
}

func TestValidateRunRejectsImageWithoutImageRole(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <image href="assets/images/hero.png" x="10" y="10" width="200" height="120"/>
</svg>`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContainCode(report.Issues, "svglide.image_role") {
		t.Fatalf("issues = %+v, want image role issue", report.Issues)
	}
}

func TestValidateRunIgnoresProtocolLintInsideExcludedContent(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{
			name: "defs image",
			body: `<defs><image href="https://example.com/defs.png" width="-4px" height="120"/></defs><text x="48" y="80">Hello</text>`,
		},
		{
			name: "pattern image",
			body: `<pattern id="p"><image href="https://example.com/pattern.png" width="120" height="0%"/></pattern><text x="48" y="80">Hello</text>`,
		},
		{
			name: "mask image",
			body: `<mask id="m"><image href="https://example.com/mask.png" width="auto" height="-4px"/></mask><text x="48" y="80">Hello</text>`,
		},
		{
			name: "display none image",
			body: `<g display="none"><image href="https://example.com/hidden.png" width="-4px" height="120"/></g><text x="48" y="80">Hello</text>`,
		},
		{
			name: "visibility hidden image",
			body: `<g visibility="hidden"><image href="https://example.com/hidden.png" width="120" height="-4px"/></g><text x="48" y="80">Hello</text>`,
		},
		{
			name: "marker image role",
			body: `<marker id="mk"><image href="https://example.com/marker.png" width="120" height="80"/></marker><text x="48" y="80">Hello</text>`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">` + tt.body + `</svg>`
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if !report.OK {
				t.Fatalf("OK = false, issues = %+v", report.Issues)
			}
			if validationIssuesContainCode(report.Issues, "svglide.geometry") {
				t.Fatalf("issues = %+v, want no geometry issue", report.Issues)
			}
			if validationIssuesContainCode(report.Issues, "svglide.remote_asset") {
				t.Fatalf("issues = %+v, want no remote asset issue", report.Issues)
			}
			if validationIssuesContainCode(report.Issues, "svglide.image_role") {
				t.Fatalf("issues = %+v, want no image role issue", report.Issues)
			}
		})
	}
}

func TestValidateRunRejectsRemoteImageHrefWithXLink(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 960 540" slide:role="slide">
  <image slide:role="image" xlink:href="https://example.com/hero.png" x="10" y="10" width="200" height="120"/>
</svg>`)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if !validationIssuesContainCode(report.Issues, "svglide.remote_asset") {
		t.Fatalf("issues = %+v, want remote asset issue", report.Issues)
	}
}

func TestValidateRunRejectsDimensionUnits(t *testing.T) {
	tests := []struct {
		name string
		svg  string
		want bool
	}{
		{
			name: "negative px",
			svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <foreignObject x="10" y="10" width="100" height="-4px" slide:role="shape" slide:shape-type="text">
    <div xmlns="http://www.w3.org/1999/xhtml">Bad size</div>
  </foreignObject>
</svg>`,
			want: true,
		},
		{
			name: "zero percent",
			svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <foreignObject x="10" y="10" width="0%" height="20" slide:role="shape" slide:shape-type="text">
    <div xmlns="http://www.w3.org/1999/xhtml">Bad size</div>
  </foreignObject>
</svg>`,
			want: true,
		},
		{
			name: "auto width",
			svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">
  <foreignObject x="10" y="10" width="auto" height="20" slide:role="shape" slide:shape-type="text">
    <div xmlns="http://www.w3.org/1999/xhtml">Fine</div>
  </foreignObject>
  <text x="48" y="80">Hello</text>
</svg>`,
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initValidateTestRun(t)
			writeMinimalDeck(t, "demo", "slides/01.svg")
			writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), tt.svg)

			report, err := ValidateRun("demo")
			if err != nil {
				t.Fatal(err)
			}
			if tt.want {
				if !validationIssuesContainCode(report.Issues, "svglide.geometry") {
					t.Fatalf("issues = %+v, want geometry issue", report.Issues)
				}
				return
			}
			if validationIssuesContainCode(report.Issues, "svglide.geometry") {
				t.Fatalf("issues = %+v, want no geometry issue", report.Issues)
			}
			if !report.OK {
				t.Fatalf("OK = false, issues = %+v", report.Issues)
			}
		})
	}
}

func TestValidateRunAcceptsPlainHref(t *testing.T) {
	initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><image slide:role="image" href="asset.png" width="120" height="80"/></svg>`
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), svg)

	report, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !report.OK {
		t.Fatalf("OK = false, issues = %+v", report.Issues)
	}
}

func TestValidateRunRejectsReceiptSymlink(t *testing.T) {
	cwd := initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
	if err := os.RemoveAll(filepath.Join("demo", "receipts")); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(filepath.Dir(cwd), "outside-receipts")
	if err := os.MkdirAll(outside, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "receipts")); err != nil {
		t.Fatal(err)
	}

	if _, err := ValidateRun("demo"); err == nil {
		t.Fatal("expected receipt symlink write refusal")
	}
	if _, err := os.Stat(filepath.Join(outside, "lint.json")); !os.IsNotExist(err) {
		t.Fatalf("lint receipt should not be written outside run root, stat err=%v", err)
	}
}

func TestValidateRunRejectsLintReceiptFileSymlink(t *testing.T) {
	cwd := initValidateTestRun(t)
	writeMinimalDeck(t, "demo", "slides/01.svg")
	writeValidateTestFile(t, filepath.Join("demo", "slides", "01.svg"), visibleTextSVG())
	if err := os.Remove(filepath.Join("demo", "receipts", "lint.json")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	outside := filepath.Join(filepath.Dir(cwd), "outside-lint.json")
	if err := os.WriteFile(outside, []byte("outside"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "receipts", "lint.json")); err != nil {
		t.Fatal(err)
	}

	if _, err := ValidateRun("demo"); err == nil {
		t.Fatal("expected lint receipt file symlink write refusal")
	}
	raw, err := os.ReadFile(outside)
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != "outside" {
		t.Fatalf("outside file was overwritten: %q", string(raw))
	}
}

func initValidateTestRun(t *testing.T) string {
	t.Helper()
	cwd := t.TempDir()
	t.Chdir(cwd)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := InitRun("demo", InitOptions{Title: "Demo", Input: "source.md"}); err != nil {
		t.Fatal(err)
	}
	return cwd
}

func writeMinimalDeck(t *testing.T, root string, slidePaths ...string) {
	t.Helper()
	writeMinimalDeckAt(t, filepath.Join(root, "outline", "deck.json"), slidePaths...)
}

func writeMinimalDeckAt(t *testing.T, path string, slidePaths ...string) {
	t.Helper()
	slides := make([]map[string]string, 0, len(slidePaths))
	for i, path := range slidePaths {
		slides = append(slides, map[string]string{
			"id":          "slide-" + string(rune('1'+i)),
			"title":       "Slide",
			"summary":     "Summary",
			"role":        "content",
			"key_message": "Message",
			"path":        path,
		})
	}
	raw, err := json.MarshalIndent(map[string]any{
		"title":  "Demo",
		"slides": slides,
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	writeValidateTestFile(t, path, string(raw))
}

func readValidateTestRunFile(t *testing.T) Run {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		t.Fatal(err)
	}
	return run
}

func writeValidateTestRunFile(t *testing.T, run Run) {
	t.Helper()
	raw, err := json.MarshalIndent(run, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	if err := os.WriteFile(filepath.Join("demo", "run.json"), raw, 0o644); err != nil {
		t.Fatal(err)
	}
}

func writeValidateTestFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func backgroundOnlySVG() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/></svg>`
}

func visibleTextSVG() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><text x="48" y="80">Hello</text></svg>`
}

func validationIssuesContain(issues []ValidationIssue, needle string) bool {
	for _, issue := range issues {
		if strings.Contains(issue.Path, needle) || strings.Contains(issue.Message, needle) {
			return true
		}
	}
	return false
}

func validationIssuesContainCode(issues []ValidationIssue, code string) bool {
	for _, issue := range issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}

func assertValidationFailureArtifacts(t *testing.T, root string, report ValidationReport, needle string) {
	t.Helper()
	if report.OK {
		t.Fatalf("OK = true, want false")
	}
	if len(report.Issues) == 0 {
		t.Fatal("expected validation issue")
	}
	if !validationIssuesContain(report.Issues, needle) {
		t.Fatalf("Issues = %+v, want %q", report.Issues, needle)
	}

	raw, err := os.ReadFile(filepath.Join(root, "receipts", "lint.json"))
	if err != nil {
		t.Fatalf("missing lint receipt: %v", err)
	}
	var receipt ValidationReport
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatalf("lint receipt is not ValidationReport JSON: %v", err)
	}
	if receipt.OK || !validationIssuesContain(receipt.Issues, needle) {
		t.Fatalf("lint receipt = %+v, want failing issue containing %q", receipt, needle)
	}

	queue, err := os.ReadFile(filepath.Join(root, "repair_queue.md"))
	if err != nil {
		t.Fatalf("missing repair queue: %v", err)
	}
	if !strings.Contains(string(queue), needle) {
		t.Fatalf("repair queue = %q, want %q", string(queue), needle)
	}
}
