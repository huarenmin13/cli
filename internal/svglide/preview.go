package svglide

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"path/filepath"
	"strings"

	"github.com/larksuite/cli/internal/validate"
)

const defaultPreviewPath = "preview.html"
const previewReceiptPath = "receipts/preview.json"

type PreviewReport struct {
	Status string               `json:"status"`
	Slides []PreviewSlideReport `json:"slides"`
}

type PreviewSlideReport struct {
	Path     string `json:"path"`
	Rendered bool   `json:"rendered"`
	Message  string `json:"message,omitempty"`
}

type previewDeck struct {
	Title  string             `json:"title"`
	Slides []previewDeckSlide `json:"slides"`
}

type previewDeckSlide struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Summary    string `json:"summary"`
	Role       string `json:"role"`
	KeyMessage string `json:"key_message"`
	Path       string `json:"path"`
}

type previewPageData struct {
	Title         string
	Status        string
	SlideCount    int
	RenderedCount int
	Slides        []previewPageSlide
}

type previewPageSlide struct {
	Number     int
	ID         string
	Title      string
	Summary    string
	Role       string
	KeyMessage string
	Path       string
	Rendered   bool
	Message    string
}

func WritePreview(root string) (PreviewReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return PreviewReport{}, err
	}

	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		return writeFailedPreview(safeRoot, run, "", "deck artifact path is empty")
	}
	deckRaw, err := readRunRegularArtifact(safeRoot, deckPath)
	if err != nil {
		return writeFailedPreview(safeRoot, run, deckPath, fmt.Sprintf("deck %q: %v", deckPath, err))
	}
	var deck previewDeck
	if err := json.Unmarshal(deckRaw, &deck); err != nil {
		return writeFailedPreview(safeRoot, run, deckPath, fmt.Sprintf("deck %q contains invalid JSON: %v", deckPath, err))
	}
	if len(deck.Slides) == 0 {
		return writeFailedPreview(safeRoot, run, deckPath, fmt.Sprintf("deck %q contains no slides", deckPath))
	}

	report := PreviewReport{Slides: make([]PreviewSlideReport, 0, len(deck.Slides))}
	pageSlides := make([]previewPageSlide, 0, len(deck.Slides))
	for i, slide := range deck.Slides {
		slidePath, pathErr := previewSlideObjectPath(slide.Path)
		pageSlide := previewPageSlide{
			Number:     i + 1,
			ID:         strings.TrimSpace(slide.ID),
			Title:      strings.TrimSpace(slide.Title),
			Summary:    strings.TrimSpace(slide.Summary),
			Role:       strings.TrimSpace(slide.Role),
			KeyMessage: strings.TrimSpace(slide.KeyMessage),
			Path:       slidePath,
		}
		item := PreviewSlideReport{Path: slidePath}
		if pathErr != nil {
			item.Message = pathErr.Error()
		} else if slidePath == "" {
			item.Path = "(slide)"
			pageSlide.Path = item.Path
			item.Message = "slide path must not be empty"
		} else if _, err := readRunRegularArtifact(safeRoot, slidePath); err != nil {
			item.Message = err.Error()
		} else {
			item.Rendered = true
			pageSlide.Rendered = true
		}
		pageSlide.Message = item.Message
		report.Slides = append(report.Slides, item)
		pageSlides = append(pageSlides, pageSlide)
	}
	report = normalizePreviewReport(report)

	if err := writePreviewArtifacts(safeRoot, run, deck.Title, report, pageSlides); err != nil {
		return report, err
	}
	return report, nil
}

func writeFailedPreview(safeRoot string, run Run, path string, message string) (PreviewReport, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		path = "(deck)"
	}
	report := normalizePreviewReport(PreviewReport{
		Slides: []PreviewSlideReport{{
			Path:     path,
			Rendered: false,
			Message:  message,
		}},
	})
	pageSlides := []previewPageSlide{{
		Number:   1,
		Title:    "Preview failed",
		Path:     path,
		Rendered: false,
		Message:  message,
	}}
	if err := writePreviewArtifacts(safeRoot, run, run.Title, report, pageSlides); err != nil {
		return report, err
	}
	return report, nil
}

func normalizePreviewReport(report PreviewReport) PreviewReport {
	if report.Slides == nil {
		report.Slides = []PreviewSlideReport{}
	}
	report.Status = "passed"
	for i := range report.Slides {
		report.Slides[i].Path = strings.TrimSpace(report.Slides[i].Path)
		if report.Slides[i].Path == "" {
			report.Slides[i].Path = "(slide)"
		}
		if !report.Slides[i].Rendered {
			report.Status = "failed"
		}
	}
	return report
}

func previewSlideObjectPath(path string) (string, error) {
	raw := strings.TrimSpace(path)
	if raw == "" {
		return "", fmt.Errorf("slide path must not be empty")
	}
	if strings.Contains(raw, `\`) {
		return "", fmt.Errorf("slide path %q must use forward slashes", raw)
	}
	if strings.Contains(raw, "%") {
		return "", fmt.Errorf("slide path %q must not contain percent encoding", raw)
	}
	if strings.Contains(raw, ":") || strings.Contains(raw, "//") {
		return "", fmt.Errorf("slide path %q must be a local slides/*.svg path", raw)
	}
	parts := strings.Split(raw, "/")
	if len(parts) != 2 || parts[0] != "slides" {
		return "", fmt.Errorf("slide path %q must match slides/<file>.svg", raw)
	}
	fileName := parts[1]
	if fileName == "" || fileName == "." || fileName == ".." {
		return "", fmt.Errorf("slide path %q must include a slide file name", raw)
	}
	if strings.Contains(fileName, "/") || strings.Contains(fileName, `\`) {
		return "", fmt.Errorf("slide path %q must not contain nested directories", raw)
	}
	if strings.HasPrefix(fileName, ".") || strings.Contains(fileName, "..") {
		return "", fmt.Errorf("slide path %q must not contain dot segments", raw)
	}
	if strings.ToLower(filepath.Ext(fileName)) != ".svg" {
		return "", fmt.Errorf("slide path %q must end with .svg", raw)
	}
	cleaned := filepath.ToSlash(filepath.Clean(raw))
	if cleaned != raw {
		return "", fmt.Errorf("slide path %q must already be normalized", raw)
	}
	return raw, nil
}

func writePreviewArtifacts(safeRoot string, run Run, title string, report PreviewReport, slides []previewPageSlide) error {
	report = normalizePreviewReport(report)
	previewPath := strings.TrimSpace(run.Artifacts.Preview)
	if previewPath == "" {
		previewPath = defaultPreviewPath
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, previewPath)
	if err != nil {
		return err
	}
	htmlRaw, err := renderPreviewHTML(title, report, slides)
	if err != nil {
		return err
	}
	if err := validate.AtomicWrite(target, htmlRaw, 0o644); err != nil {
		return err
	}
	receiptTarget, err := ensureRunFileTargetForWrite(safeRoot, previewReceiptPath)
	if err != nil {
		return err
	}
	raw, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}
	raw = append(raw, '\n')
	return validate.AtomicWrite(receiptTarget, raw, 0o644)
}

func renderPreviewHTML(title string, report PreviewReport, slides []previewPageSlide) ([]byte, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		title = "SVGlide Preview"
	}
	var rendered int
	for _, slide := range slides {
		if slide.Rendered {
			rendered++
		}
	}
	data := previewPageData{
		Title:         title,
		Status:        report.Status,
		SlideCount:    len(slides),
		RenderedCount: rendered,
		Slides:        slides,
	}
	var b bytes.Buffer
	if err := previewTemplate.Execute(&b, data); err != nil {
		return nil, err
	}
	return b.Bytes(), nil
}

var previewTemplate = template.Must(template.New("preview").Parse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.Title}} - SVGlide Preview</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --ink: #1f2933;
      --muted: #657286;
      --line: #d8dee8;
      --accent: #1d7a62;
      --warn: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      border-bottom: 1px solid var(--line);
      background: rgba(255,255,255,.94);
      backdrop-filter: blur(10px);
    }
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 18px 24px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 650;
      letter-spacing: 0;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
      white-space: nowrap;
    }
    .status {
      color: #fff;
      background: var(--accent);
      border-radius: 999px;
      padding: 3px 9px;
      font-weight: 650;
    }
    .status.failed { background: var(--warn); }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 22px 24px 48px;
    }
    .deck {
      display: grid;
      gap: 18px;
    }
    .slide {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 16px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 16px;
      box-shadow: 0 12px 24px rgba(31,41,51,.06);
    }
    .frame {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
    }
    object {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
    }
    .missing {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      padding: 24px;
      color: var(--warn);
      text-align: center;
      font-size: 14px;
    }
    .details {
      min-width: 0;
      display: grid;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
    }
    .details h2 {
      margin: 0;
      color: var(--ink);
      font-size: 16px;
      font-weight: 650;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .label {
      color: var(--ink);
      font-weight: 650;
    }
    .path {
      overflow-wrap: anywhere;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
    }
    .message { color: var(--warn); overflow-wrap: anywhere; }
    @media (max-width: 860px) {
      .bar { align-items: flex-start; flex-direction: column; gap: 8px; }
      .meta { flex-wrap: wrap; white-space: normal; }
      .slide { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <h1>{{.Title}}</h1>
      <div class="meta">
        <span class="status {{.Status}}">{{.Status}}</span>
        <span>{{.RenderedCount}} / {{.SlideCount}} rendered</span>
      </div>
    </div>
  </header>
  <main>
    <section class="deck">
      {{range .Slides}}
      <article class="slide">
        <div class="frame">
          {{if .Rendered}}
          <object data="{{.Path}}" type="image/svg+xml" aria-label="{{.Title}}"></object>
          {{else}}
          <div class="missing">{{.Message}}</div>
          {{end}}
        </div>
        <div class="details">
          <h2>{{printf "%02d" .Number}}. {{.Title}}</h2>
          {{if .Summary}}<div><span class="label">Summary</span><br>{{.Summary}}</div>{{end}}
          {{if .KeyMessage}}<div><span class="label">Key Message</span><br>{{.KeyMessage}}</div>{{end}}
          {{if .Role}}<div><span class="label">Role</span><br>{{.Role}}</div>{{end}}
          <div><span class="label">Path</span><br><span class="path">{{.Path}}</span></div>
          {{if .Message}}<div class="message">{{.Message}}</div>{{end}}
        </div>
      </article>
      {{end}}
    </section>
  </main>
</body>
</html>
`))
