package svglide

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
)

const screenshotEvidenceReportPath = "receipts/screenshot_evidence.json"

type ScreenshotEvidenceReport struct {
	Status  string                    `json:"status"`
	Metrics ScreenshotEvidenceMetrics `json:"metrics"`
	Issues  []ScreenshotEvidenceIssue `json:"issues"`
	Slides  []ScreenshotEvidenceSlide `json:"slides"`
}

type ScreenshotEvidenceMetrics struct {
	Slides              int `json:"slides"`
	Screenshots         int `json:"screenshots"`
	MissingScreenshots  int `json:"missing_screenshots"`
	CanvasMismatchCount int `json:"canvas_mismatch_count"`
	IssueCount          int `json:"issue_count"`
}

type ScreenshotEvidenceIssue struct {
	Code     string `json:"code"`
	Path     string `json:"path"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type ScreenshotEvidenceSlide struct {
	SlideID        string  `json:"slide_id"`
	SlidePath      string  `json:"slide_path"`
	ScreenshotPath string  `json:"screenshot_path"`
	CanvasWidth    float64 `json:"canvas_width"`
	CanvasHeight   float64 `json:"canvas_height"`
	ViewportWidth  int     `json:"viewport_width"`
	ViewportHeight int     `json:"viewport_height"`
	PixelWidth     int     `json:"pixel_width"`
	PixelHeight    int     `json:"pixel_height"`
	Scale          float64 `json:"scale"`
	Status         string  `json:"status"`
}

func readScreenshotEvidenceReport(safeRoot string) (ScreenshotEvidenceReport, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, screenshotEvidenceReportPath)
	if err != nil {
		return ScreenshotEvidenceReport{}, false, nil
	}
	var report ScreenshotEvidenceReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return ScreenshotEvidenceReport{}, true, fmt.Errorf("%s: invalid JSON: %w", screenshotEvidenceReportPath, err)
	}
	return report, true, nil
}

func validateScreenshotEvidenceRun(safeRoot string, deck authorDeck) (ScreenshotEvidenceReport, error) {
	report, present, err := readScreenshotEvidenceReport(safeRoot)
	if err != nil {
		return report, err
	}
	if !present {
		return ScreenshotEvidenceReport{
			Status:  "failed",
			Metrics: ScreenshotEvidenceMetrics{Slides: len(deck.Slides), MissingScreenshots: len(deck.Slides), IssueCount: 1},
			Issues: []ScreenshotEvidenceIssue{{
				Code:     "svglide.screenshot_evidence.missing_report",
				Path:     screenshotEvidenceReportPath,
				Message:  "screenshot evidence report is required",
				Severity: "error",
			}},
			Slides: []ScreenshotEvidenceSlide{},
		}, nil
	}
	return validateScreenshotEvidenceReport(safeRoot, deck, report), nil
}

func validateScreenshotEvidenceReport(safeRoot string, deck authorDeck, report ScreenshotEvidenceReport) ScreenshotEvidenceReport {
	validated := report
	validated.Issues = append([]ScreenshotEvidenceIssue{}, report.Issues...)
	validated.Metrics.Slides = len(deck.Slides)
	bySlide := map[string]ScreenshotEvidenceSlide{}
	for _, slide := range report.Slides {
		bySlide[strings.TrimSpace(slide.SlideID)] = slide
	}
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		evidence, ok := bySlide[id]
		if !ok {
			validated.Metrics.MissingScreenshots++
			addScreenshotEvidenceIssue(&validated, strings.TrimSpace(slide.Path), "svglide.screenshot_evidence.missing_slide", fmt.Sprintf("slide %q has no screenshot evidence", id))
			continue
		}
		if strings.TrimSpace(evidence.ScreenshotPath) == "" {
			validated.Metrics.MissingScreenshots++
			addScreenshotEvidenceIssue(&validated, strings.TrimSpace(slide.Path), "svglide.screenshot_evidence.missing_path", fmt.Sprintf("slide %q has empty screenshot_path", id))
			continue
		}
		if _, err := readRunRegularArtifact(safeRoot, evidence.ScreenshotPath); err != nil {
			validated.Metrics.MissingScreenshots++
			addScreenshotEvidenceIssue(&validated, evidence.ScreenshotPath, "svglide.screenshot_evidence.read_screenshot", err.Error())
			continue
		}
		validated.Metrics.Screenshots++
		if !screenshotCanvasMatches(evidence) {
			validated.Metrics.CanvasMismatchCount++
			addScreenshotEvidenceIssue(&validated, evidence.ScreenshotPath, "svglide.screenshot_evidence.canvas_mismatch", fmt.Sprintf("slide %q screenshot viewport/pixels %dx%d/%dx%d do not match canvas %.0fx%.0f at scale %.2f", id, evidence.ViewportWidth, evidence.ViewportHeight, evidence.PixelWidth, evidence.PixelHeight, evidence.CanvasWidth, evidence.CanvasHeight, evidence.Scale))
		}
	}
	validated.Metrics.IssueCount = len(validated.Issues)
	if validated.Metrics.IssueCount > 0 || strings.TrimSpace(validated.Status) == "failed" {
		validated.Status = "failed"
	} else {
		validated.Status = "passed"
	}
	return validated
}

func writeScreenshotEvidenceReport(safeRoot string, report ScreenshotEvidenceReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, screenshotEvidenceReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func screenshotEvidencePathsFromReport(safeRoot string) ([]string, error) {
	report, present, err := readScreenshotEvidenceReport(safeRoot)
	if err != nil {
		return nil, err
	}
	if !present || report.Status != "passed" {
		return []string{}, nil
	}
	paths := []string{}
	for _, slide := range report.Slides {
		path := strings.TrimSpace(slide.ScreenshotPath)
		if path == "" {
			continue
		}
		if _, err := readRunRegularArtifact(safeRoot, path); err != nil {
			return nil, err
		}
		paths = appendUnique(paths, path)
	}
	return paths, nil
}

func screenshotCanvasMatches(slide ScreenshotEvidenceSlide) bool {
	scale := slide.Scale
	if scale <= 0 {
		scale = 1
	}
	wantViewportW := int(math.Round(slide.CanvasWidth * scale))
	wantViewportH := int(math.Round(slide.CanvasHeight * scale))
	if wantViewportW <= 0 || wantViewportH <= 0 {
		return false
	}
	if slide.ViewportWidth != wantViewportW || slide.ViewportHeight != wantViewportH {
		return false
	}
	if slide.PixelWidth > 0 && slide.PixelWidth != wantViewportW {
		return false
	}
	if slide.PixelHeight > 0 && slide.PixelHeight != wantViewportH {
		return false
	}
	return true
}

func addScreenshotEvidenceIssue(report *ScreenshotEvidenceReport, path, code, message string) {
	report.Issues = append(report.Issues, ScreenshotEvidenceIssue{
		Code:     code,
		Path:     path,
		Message:  message,
		Severity: "error",
	})
}
