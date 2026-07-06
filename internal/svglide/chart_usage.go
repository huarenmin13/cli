package svglide

import (
	"encoding/xml"
	"fmt"
	"strconv"
	"strings"
)

const chartUsageReceiptPath = "receipts/chart_usage.json"

type ChartUsageReport struct {
	Status string            `json:"status"`
	Charts []ChartUsageChart `json:"charts"`
	Issues []ChartUsageIssue `json:"issues"`
}

type ChartUsageChart struct {
	ID             string `json:"id"`
	SlideID        string `json:"slide_id"`
	SVGPath        string `json:"svg_path"`
	ReferenceCount int    `json:"reference_count"`
}

type ChartUsageIssue struct {
	Code    string `json:"code"`
	Path    string `json:"path,omitempty"`
	Message string `json:"message"`
}

type chartUsageReference struct {
	SlideID string
	Path    string
	Href    string
	Width   float64
	Height  float64
}

func EvaluateChartUsageRun(safeRoot string, deck authorDeck, manifest chartManifestFile, briefs chartBriefFile) ChartUsageReport {
	report := ChartUsageReport{Status: "passed", Charts: []ChartUsageChart{}, Issues: []ChartUsageIssue{}}
	refsByPath := map[string][]chartUsageReference{}
	rawBySlide := map[string]string{}
	for _, slide := range deck.Slides {
		slidePath := strings.TrimSpace(slide.Path)
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.read_slide", Path: slidePath, Message: err.Error()})
			continue
		}
		rawText := string(raw)
		rawBySlide[strings.TrimSpace(slide.ID)] = rawText
		refs, issues := extractChartUsageReferences(strings.TrimSpace(slide.ID), slidePath, rawText)
		if len(issues) > 0 {
			report.Status = "failed"
			report.Issues = append(report.Issues, issues...)
		}
		for _, ref := range refs {
			refsByPath[ref.Path] = append(refsByPath[ref.Path], ref)
		}
	}
	briefByID := chartBriefByID(briefs)
	expectedSlideIDs := map[string]bool{}
	for _, chart := range manifest.Charts {
		id := strings.TrimSpace(chart.ID)
		slideID := strings.TrimSpace(chart.SlideID)
		svgPath := strings.TrimSpace(chart.SVGPath)
		expectedSlideIDs[slideID] = true
		refs := refsByPath[svgPath]
		report.Charts = append(report.Charts, ChartUsageChart{ID: id, SlideID: slideID, SVGPath: svgPath, ReferenceCount: len(refs)})
		if len(refs) == 0 {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.not_referenced", Path: svgPath, Message: fmt.Sprintf("chart %q is not referenced by a <rect slide:role=\"chart\">", id)})
			continue
		}
		if len(refs) > 1 {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.duplicate_reference", Path: svgPath, Message: fmt.Sprintf("chart %q has %d references; expected exactly one", id, len(refs))})
		}
		minWidth, minHeight := chartUsageMinSize(briefByID[strings.TrimSpace(chart.BriefID)])
		for _, ref := range refs {
			if ref.SlideID != slideID {
				report.Status = "failed"
				report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.wrong_slide", Path: svgPath, Message: fmt.Sprintf("chart %q referenced on slide %q, want %q", id, ref.SlideID, slideID)})
			}
			if ref.Width < float64(minWidth) || ref.Height < float64(minHeight) {
				report.Status = "failed"
				report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.too_small", Path: svgPath, Message: fmt.Sprintf("chart %q rendered at %.0fx%.0f, minimum is %dx%d", id, ref.Width, ref.Height, minWidth, minHeight)})
			}
		}
	}
	for slideID := range expectedSlideIDs {
		hasValidRef := false
		for _, refs := range refsByPath {
			for _, ref := range refs {
				if ref.SlideID == slideID {
					hasValidRef = true
					break
				}
			}
		}
		if !hasValidRef && chartSlideLooksHandDrawn(rawBySlide[slideID]) {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartUsageIssue{Code: "svglide.chart_usage.hand_drawn_chart", Path: slideID, Message: "slide appears to hand-draw chart primitives instead of embedding a rendered chart asset"})
		}
	}
	return report
}

func writeChartUsageReport(safeRoot string, report ChartUsageReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, chartUsageReceiptPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func extractChartUsageReferences(slideID, slidePath, svg string) ([]chartUsageReference, []ChartUsageIssue) {
	refs := []chartUsageReference{}
	issues := []ChartUsageIssue{}
	decoder := xml.NewDecoder(strings.NewReader(svg))
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		start, ok := token.(xml.StartElement)
		if !ok {
			continue
		}
		attrs := parseSVGAttrs(start.Attr)
		if strings.TrimSpace(attrs["role"]) != "chart" {
			continue
		}
		if start.Name.Local != "rect" {
			issues = append(issues, ChartUsageIssue{Code: "svglide.chart_usage.invalid_chart_element", Path: slidePath, Message: fmt.Sprintf("<%s slide:role=\"chart\"> is invalid; use <rect slide:role=\"chart\">", start.Name.Local)})
			continue
		}
		href := strings.TrimSpace(attrs["href"])
		refs = append(refs, chartUsageReference{
			SlideID: slideID,
			Path:    normalizeChartHref(slidePath, href),
			Href:    href,
			Width:   parseChartUsageFloatAttr(attrs["width"]),
			Height:  parseChartUsageFloatAttr(attrs["height"]),
		})
	}
	return refs, issues
}

func normalizeChartHref(slidePath, href string) string {
	href = strings.TrimSpace(href)
	if strings.HasPrefix(href, "assets/charts/") {
		return href
	}
	return normalizeSlideAssetHref(slidePath, href)
}

func parseChartUsageFloatAttr(raw string) float64 {
	raw = strings.TrimSpace(strings.TrimSuffix(raw, "px"))
	value, _ := strconv.ParseFloat(raw, 64)
	return value
}

func chartBriefByID(briefs chartBriefFile) map[string]chartBriefEntry {
	out := map[string]chartBriefEntry{}
	for _, brief := range briefs.Charts {
		if id := strings.TrimSpace(brief.ID); id != "" {
			out[id] = brief
		}
	}
	return out
}

func chartUsageMinSize(brief chartBriefEntry) (int, int) {
	minWidth := 480
	minHeight := 260
	if brief.MinWidth > minWidth {
		minWidth = brief.MinWidth
	}
	if brief.MinHeight > minHeight {
		minHeight = brief.MinHeight
	}
	return minWidth, minHeight
}

func chartSlideLooksHandDrawn(svg string) bool {
	raw := strings.ToLower(svg)
	rects := strings.Count(raw, "<rect") - strings.Count(raw, `slide:role="chart"`)
	circles := strings.Count(raw, "<circle")
	lines := strings.Count(raw, "<line")
	paths := strings.Count(raw, "<path")
	texts := strings.Count(raw, "<text")
	return rects >= 4 || circles >= 6 || (lines >= 2 && (rects+paths+circles) >= 4) || (texts >= 5 && (rects+paths+circles+lines) >= 4)
}
