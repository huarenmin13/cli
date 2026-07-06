package svglide

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"
)

const chartQualityReportPath = "receipts/chart_quality.json"

type ChartQualityReport struct {
	Status  string              `json:"status"`
	Metrics ChartQualityMetrics `json:"metrics"`
	Issues  []ChartQualityIssue `json:"issues"`
	Charts  []ChartQualityChart `json:"charts"`
}

type ChartQualityMetrics struct {
	Charts                  int `json:"charts"`
	VegaLiteCharts          int `json:"vega_lite_charts"`
	MissingAxisCount        int `json:"missing_axis_count"`
	MissingUnitCount        int `json:"missing_unit_count"`
	MissingSourceCount      int `json:"missing_source_count"`
	MissingDirectLabelCount int `json:"missing_direct_label_count"`
	DecorativeChartCount    int `json:"decorative_chart_count"`
}

type ChartQualityIssue struct {
	Path     string `json:"path"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type ChartQualityChart struct {
	ID       string `json:"id"`
	SlideID  string `json:"slide_id"`
	Renderer string `json:"renderer"`
	SVGPath  string `json:"svg_path"`
	SpecPath string `json:"spec_path,omitempty"`
}

func CheckChartQuality(root string) (ChartQualityReport, error) {
	safeRoot, _, err := readRun(root)
	if err != nil {
		return ChartQualityReport{}, err
	}
	manifest, present, err := readChartManifest(safeRoot)
	if err != nil {
		return ChartQualityReport{}, err
	}
	report := ChartQualityReport{
		Status: "passed",
		Issues: []ChartQualityIssue{},
		Charts: []ChartQualityChart{},
	}
	if !present {
		if err := writeChartQualityReport(safeRoot, report); err != nil {
			return report, err
		}
		return report, nil
	}
	sourceIDs, sourceErr := readKnownSourceIDs(safeRoot)
	if sourceErr != nil {
		addChartQualityIssue(&report, "research/sources.json", "svglide.chart_quality.sources_unreadable", sourceErr.Error())
		sourceIDs = map[string]bool{}
	}
	renderReport, renderErr := readChartRenderReport(safeRoot)
	if renderErr != nil {
		addChartQualityIssue(&report, chartRenderReceiptPath, "svglide.chart_quality.missing_render_receipt", renderErr.Error())
	}
	renderByID := chartRenderEntriesByID(renderReport)
	for _, chart := range manifest.Charts {
		renderer := normalizedRequiredChartRenderer(chartEntryRenderer(manifest, chart))
		svgPath := strings.TrimSpace(chart.SVGPath)
		item := ChartQualityChart{
			ID:       strings.TrimSpace(chart.ID),
			SlideID:  strings.TrimSpace(chart.SlideID),
			Renderer: renderer,
			SVGPath:  svgPath,
			SpecPath: strings.TrimSpace(chart.SpecPath),
		}
		report.Charts = append(report.Charts, item)
		report.Metrics.Charts++
		if renderer == requiredChartRendererVegaLite {
			report.Metrics.VegaLiteCharts++
			validateVegaLiteChartQuality(&report, safeRoot, chart, sourceIDs, renderByID, renderErr == nil)
		}
		if svgPath == "" {
			addChartQualityIssue(&report, chartManifestPath, "svglide.chart_quality.missing_svg", fmt.Sprintf("chart %q has no svg_path", chart.ID))
			continue
		}
		raw, err := readRunRegularArtifact(safeRoot, svgPath)
		if err != nil {
			addChartQualityIssue(&report, svgPath, "svglide.chart_quality.missing_svg", fmt.Sprintf("chart %q SVG cannot be read: %v", chart.ID, err))
			continue
		}
		checkChartSVGQuality(&report, svgPath, string(raw))
	}
	if len(report.Issues) > 0 {
		report.Status = "failed"
	}
	if err := writeChartQualityReport(safeRoot, report); err != nil {
		return report, err
	}
	return report, nil
}

func validateVegaLiteChartQuality(report *ChartQualityReport, safeRoot string, chart chartManifestEntry, sourceIDs map[string]bool, renderByID map[string]ChartRenderEntry, hasRenderReceipt bool) {
	id := strings.TrimSpace(chart.ID)
	if id == "" {
		id = strings.TrimSpace(chart.SVGPath)
	}
	for _, required := range []struct {
		value string
		code  string
		name  string
	}{
		{strings.TrimSpace(chart.BriefID), "svglide.chart_quality.missing_brief_id", "brief_id"},
		{strings.TrimSpace(chart.SpecPath), "svglide.chart_quality.missing_spec_path", "spec_path"},
		{strings.TrimSpace(chart.SVGPath), "svglide.chart_quality.missing_svg", "svg_path"},
		{strings.TrimSpace(chart.SourceID), "svglide.chart_quality.missing_source", "source_id"},
		{strings.TrimSpace(chart.Unit), "svglide.chart_quality.missing_unit", "unit"},
		{strings.TrimSpace(chart.Takeaway), "svglide.chart_quality.missing_takeaway", "takeaway"},
		{strings.TrimSpace(chart.RenderReceipt), "svglide.chart_quality.missing_render_receipt", "render_receipt"},
	} {
		if required.value == "" {
			addChartQualityIssue(report, chartManifestPath, required.code, fmt.Sprintf("chart %q is missing %s", id, required.name))
		}
	}
	if chart.RenderReceipt != "" && chart.RenderReceipt != chartRenderReceiptPath {
		addChartQualityIssue(report, chartManifestPath, "svglide.chart_quality.missing_render_receipt", fmt.Sprintf("chart %q render_receipt = %q, want %q", id, chart.RenderReceipt, chartRenderReceiptPath))
	}
	if sourceID := strings.TrimSpace(chart.SourceID); sourceID != "" && !sourceIDs[sourceID] {
		addChartQualityIssue(report, chartManifestPath, "svglide.chart_quality.unknown_source_id", fmt.Sprintf("chart %q references unknown source_id %q", id, sourceID))
	}
	validateVegaLiteSpec(report, safeRoot, chart)
	if !hasRenderReceipt {
		return
	}
	renderEntry, ok := renderByID[id]
	if !ok {
		addChartQualityIssue(report, chartRenderReceiptPath, "svglide.chart_quality.render_receipt_missing_chart", fmt.Sprintf("render receipt has no entry for chart %q", id))
		return
	}
	if strings.TrimSpace(chart.SpecPath) != "" {
		raw, err := readRunRegularArtifact(safeRoot, chart.SpecPath)
		if err != nil {
			addChartQualityIssue(report, chart.SpecPath, "svglide.chart_quality.missing_spec_path", err.Error())
		} else if got := sha256Hex(raw); got != renderEntry.SpecSHA256 {
			addChartQualityIssue(report, chart.SpecPath, "svglide.chart_quality.spec_hash_mismatch", fmt.Sprintf("chart %q spec hash %s, want %s", id, got, renderEntry.SpecSHA256))
		}
	}
	if strings.TrimSpace(chart.SVGPath) != "" {
		raw, err := readRunRegularArtifact(safeRoot, chart.SVGPath)
		if err != nil {
			addChartQualityIssue(report, chart.SVGPath, "svglide.chart_quality.missing_svg", err.Error())
		} else if got := sha256Hex(raw); got != renderEntry.SVGSHA256 {
			addChartQualityIssue(report, chart.SVGPath, "svglide.chart_quality.svg_hash_mismatch", fmt.Sprintf("chart %q SVG hash %s, want %s", id, got, renderEntry.SVGSHA256))
		}
	}
}

func validateVegaLiteSpec(report *ChartQualityReport, safeRoot string, chart chartManifestEntry) {
	specPath := strings.TrimSpace(chart.SpecPath)
	if specPath == "" {
		return
	}
	raw, err := readRunRegularArtifact(safeRoot, specPath)
	if err != nil {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.missing_spec_path", err.Error())
		return
	}
	var spec map[string]json.RawMessage
	if err := json.Unmarshal(raw, &spec); err != nil {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.invalid_spec_json", err.Error())
		return
	}
	if len(spec["$schema"]) == 0 {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.spec_missing_schema", "Vega-Lite spec must include $schema")
	}
	if len(spec["mark"]) == 0 {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.spec_missing_mark", "Vega-Lite spec must include mark")
	}
	if len(spec["encoding"]) == 0 {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.spec_missing_encoding", "Vega-Lite spec must include encoding")
	}
	if !vegaLiteSpecHasData(spec) {
		addChartQualityIssue(report, specPath, "svglide.chart_quality.spec_missing_data", "Vega-Lite spec must include data.values or a local data reference")
	}
}

func vegaLiteSpecHasData(spec map[string]json.RawMessage) bool {
	raw := spec["data"]
	if len(raw) == 0 {
		return false
	}
	var data map[string]json.RawMessage
	if err := json.Unmarshal(raw, &data); err != nil {
		return false
	}
	if len(data["values"]) > 0 {
		return true
	}
	var urlValue string
	if err := json.Unmarshal(data["url"], &urlValue); err == nil && strings.HasPrefix(urlValue, "assets/charts/data/") {
		return true
	}
	return false
}

func readChartRenderReport(safeRoot string) (ChartRenderReport, error) {
	raw, err := readRunRegularArtifact(safeRoot, chartRenderReceiptPath)
	if err != nil {
		return ChartRenderReport{}, err
	}
	var report ChartRenderReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return ChartRenderReport{}, fmt.Errorf("%s: invalid JSON: %w", chartRenderReceiptPath, err)
	}
	return report, nil
}

func chartRenderEntriesByID(report ChartRenderReport) map[string]ChartRenderEntry {
	out := map[string]ChartRenderEntry{}
	for _, entry := range report.Charts {
		if id := strings.TrimSpace(entry.ID); id != "" {
			out[id] = entry
		}
	}
	return out
}

func checkChartSVGQuality(report *ChartQualityReport, path, svg string) {
	visible := strings.ToLower(visibleSemanticText(svg))
	raw := strings.ToLower(svg)
	if !chartHasUnit(visible) {
		report.Metrics.MissingUnitCount++
		addChartQualityIssue(report, path, "svglide.chart_quality.missing_unit", "chart must include a visible unit such as $, %, bps, billion, million, points, goals, or score")
	}
	if !chartHasSource(visible) {
		report.Metrics.MissingSourceCount++
		addChartQualityIssue(report, path, "svglide.chart_quality.missing_source", "chart must include a visible source note or source label")
	}
	hasAxis := chartHasAxis(raw, visible)
	hasDirectLabel := chartHasDirectLabel(raw, visible)
	if !hasAxis {
		report.Metrics.MissingAxisCount++
	}
	if !hasDirectLabel {
		report.Metrics.MissingDirectLabelCount++
	}
	if !hasAxis || !hasDirectLabel {
		addChartQualityIssue(report, path, "svglide.chart_quality.missing_labeling", "chart must include readable axes or direct labels")
	}
	if chartLooksDecorative(raw, visible) {
		report.Metrics.DecorativeChartCount++
		addChartQualityIssue(report, path, "svglide.chart_quality.decorative_chart", "chart looks decorative: it lacks enough labels, axes, units, or source context")
	}
}

func writeChartQualityReport(safeRoot string, report ChartQualityReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, chartQualityReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func addChartQualityIssue(report *ChartQualityReport, path, code, message string) {
	report.Issues = append(report.Issues, ChartQualityIssue{
		Path:     filepath.ToSlash(path),
		Code:     code,
		Message:  message,
		Severity: "error",
	})
}

func chartHasUnit(visible string) bool {
	for _, token := range []string{"$", "%", "bps", "bp", "points", "point", "score", "goals", "goal", "usd", "rmb", "billion", "million", "bn", "分", "美元", "亿元", "亿", "倍"} {
		if strings.Contains(visible, token) {
			return true
		}
	}
	return false
}

func chartHasSource(visible string) bool {
	normalized := strings.NewReplacer("：", ":", "﹕", ":", "：", ":", "\n", " ").Replace(visible)
	for _, token := range []string{
		"source:",
		"sources:",
		"data source:",
		"source note:",
		"来源:",
		"数据源:",
		"资料来源:",
		"数据来源:",
		"sec 10-k",
		"sec 10-q",
		"company filings",
		"company filing",
		"annual report",
		"quarterly report",
		"official statistics",
		"official data",
		"fifa official",
		"olympics official",
		"年报",
		"财报",
	} {
		if strings.Contains(normalized, token) {
			return true
		}
	}
	return false
}

func chartHasAxis(raw, visible string) bool {
	if strings.Contains(raw, "role=\"axis\"") || strings.Contains(raw, "aria-label=\"axis") || strings.Contains(raw, "class=\"axis") {
		return true
	}
	for _, token := range []string{"x-axis", "y-axis", "axis", "year", "quarter", "fy", "q1", "q2", "q3", "q4", "年度", "季度"} {
		if strings.Contains(raw, token) || strings.Contains(visible, token) {
			return true
		}
	}
	return false
}

func chartHasDirectLabel(raw, visible string) bool {
	if strings.Contains(raw, "direct-label") || strings.Contains(raw, "data-label") || strings.Contains(raw, "mark-text") {
		return true
	}
	return strings.Count(raw, "<text") >= 2 && containsDigit(visible)
}

func chartLooksDecorative(raw, visible string) bool {
	barCount := strings.Count(raw, "<rect") + strings.Count(raw, "<path")
	textCount := strings.Count(raw, "<text")
	return barCount >= 2 && (textCount == 0 || !containsDigit(visible) || !chartHasUnit(visible) || !chartHasSource(visible))
}
