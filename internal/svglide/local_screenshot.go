package svglide

import (
	"context"
	"fmt"
	"html"
	"image"
	_ "image/png"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

func CaptureScreenshots(root string) (ScreenshotEvidenceReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return ScreenshotEvidenceReport{}, err
	}
	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		deckPath = "outline/deck.json"
	}
	deck, err := readAuthorDeck(safeRoot, deckPath)
	if err != nil {
		return ScreenshotEvidenceReport{}, err
	}
	chrome, err := findChromeExecutable()
	if err != nil {
		report := screenshotErrorReport(len(deck.Slides), screenshotEvidenceReportPath, "svglide.screenshot_evidence.missing_chrome", err.Error())
		_ = writeScreenshotEvidenceReport(safeRoot, report)
		return report, err
	}
	report := ScreenshotEvidenceReport{
		Status:  "passed",
		Metrics: ScreenshotEvidenceMetrics{Slides: len(deck.Slides)},
		Issues:  []ScreenshotEvidenceIssue{},
		Slides:  []ScreenshotEvidenceSlide{},
	}
	for _, slide := range deck.Slides {
		evidence, err := captureSlideScreenshot(safeRoot, chrome, slide)
		if err != nil {
			addScreenshotEvidenceIssue(&report, strings.TrimSpace(slide.Path), "svglide.screenshot_evidence.capture_failed", err.Error())
			continue
		}
		report.Slides = append(report.Slides, evidence)
	}
	report = validateScreenshotEvidenceReport(safeRoot, deck, report)
	if err := writeScreenshotEvidenceReport(safeRoot, report); err != nil {
		return report, err
	}
	if report.Status != "passed" {
		return report, fmt.Errorf("%s status is %q, want passed", screenshotEvidenceReportPath, report.Status)
	}
	return report, nil
}

func captureSlideScreenshot(safeRoot string, chrome string, slide authorDeckSlide) (ScreenshotEvidenceSlide, error) {
	slidePath, err := previewSlideObjectPath(slide.Path)
	if err != nil {
		return ScreenshotEvidenceSlide{}, err
	}
	raw, err := readRunRegularArtifact(safeRoot, slidePath)
	if err != nil {
		return ScreenshotEvidenceSlide{}, err
	}
	canvasWidth, canvasHeight := imageUsageCanvasSize(raw)
	viewportWidth := int(canvasWidth)
	viewportHeight := int(canvasHeight)
	if viewportWidth <= 0 || viewportHeight <= 0 {
		return ScreenshotEvidenceSlide{}, fmt.Errorf("invalid canvas %.0fx%.0f for %s", canvasWidth, canvasHeight, slidePath)
	}
	screenshotPath := filepath.ToSlash(filepath.Join("screenshots", strings.TrimSuffix(filepath.Base(slidePath), filepath.Ext(slidePath))+".png"))
	target, err := ensureRunFileTargetForWrite(safeRoot, screenshotPath)
	if err != nil {
		return ScreenshotEvidenceSlide{}, err
	}
	htmlPath, err := writeSlideScreenshotHTML(safeRoot, slidePath, raw, viewportWidth, viewportHeight)
	if err != nil {
		return ScreenshotEvidenceSlide{}, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := runChromeScreenshot(ctx, chrome, htmlPath, target, viewportWidth, viewportHeight); err != nil {
		return ScreenshotEvidenceSlide{}, err
	}
	pixelWidth, pixelHeight := pngDimensions(target)
	return ScreenshotEvidenceSlide{
		SlideID:        strings.TrimSpace(slide.ID),
		SlidePath:      slidePath,
		ScreenshotPath: screenshotPath,
		CanvasWidth:    canvasWidth,
		CanvasHeight:   canvasHeight,
		ViewportWidth:  viewportWidth,
		ViewportHeight: viewportHeight,
		PixelWidth:     pixelWidth,
		PixelHeight:    pixelHeight,
		Scale:          1,
		Status:         "passed",
	}, nil
}

func writeSlideScreenshotHTML(safeRoot string, slidePath string, raw []byte, width int, height int) (string, error) {
	htmlPath := filepath.Join(safeRoot, "screenshots", "."+strings.TrimSuffix(filepath.Base(slidePath), filepath.Ext(slidePath))+".html")
	if err := os.MkdirAll(filepath.Dir(htmlPath), 0o755); err != nil {
		return "", err
	}
	body := `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:` + fmt.Sprint(width) + `px;height:` + fmt.Sprint(height) + `px;overflow:hidden;background:#fff}svg{display:block;width:` + fmt.Sprint(width) + `px;height:` + fmt.Sprint(height) + `px}</style></head><body>` + string(raw) + `</body></html>`
	if strings.Contains(strings.ToLower(string(raw)), "<script") {
		body = `<!doctype html><html><body><pre>` + html.EscapeString(string(raw)) + `</pre></body></html>`
	}
	if err := os.WriteFile(htmlPath, []byte(body), 0o644); err != nil {
		return "", err
	}
	return htmlPath, nil
}

func runChromeScreenshot(ctx context.Context, chrome string, htmlPath string, target string, width int, height int) error {
	args := []string{
		"--headless=new",
		"--disable-gpu",
		"--hide-scrollbars",
		"--no-first-run",
		"--no-default-browser-check",
		fmt.Sprintf("--window-size=%d,%d", width, height),
		"--screenshot=" + target,
		localFileURL(htmlPath),
	}
	cmd := exec.CommandContext(ctx, chrome, args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("chrome screenshot failed: %w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}

func findChromeExecutable() (string, error) {
	candidates := []string{}
	if env := strings.TrimSpace(os.Getenv("SVGLIDE_CHROME")); env != "" {
		candidates = append(candidates, env)
	}
	switch runtime.GOOS {
	case "darwin":
		candidates = append(candidates,
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			filepath.Join(os.Getenv("HOME"), "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
		)
	default:
		candidates = append(candidates, "google-chrome", "chromium", "chromium-browser")
	}
	for _, candidate := range candidates {
		if strings.Contains(candidate, string(os.PathSeparator)) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				return candidate, nil
			}
			continue
		}
		if path, err := exec.LookPath(candidate); err == nil {
			return path, nil
		}
	}
	return "", fmt.Errorf("Chrome/Chromium executable not found; set SVGLIDE_CHROME")
}

func pngDimensions(path string) (int, int) {
	file, err := os.Open(path)
	if err != nil {
		return 0, 0
	}
	defer file.Close()
	cfg, _, err := image.DecodeConfig(file)
	if err != nil {
		return 0, 0
	}
	return cfg.Width, cfg.Height
}

func localFileURL(path string) string {
	abs, err := filepath.Abs(path)
	if err != nil {
		abs = path
	}
	return (&url.URL{Scheme: "file", Path: filepath.ToSlash(abs)}).String()
}

func screenshotErrorReport(slides int, path, code, message string) ScreenshotEvidenceReport {
	return ScreenshotEvidenceReport{
		Status:  "failed",
		Metrics: ScreenshotEvidenceMetrics{Slides: slides, MissingScreenshots: slides, IssueCount: 1},
		Issues: []ScreenshotEvidenceIssue{{
			Code:     code,
			Path:     path,
			Message:  message,
			Severity: "error",
		}},
		Slides: []ScreenshotEvidenceSlide{},
	}
}
