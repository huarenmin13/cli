package svglide

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const chartRenderReceiptPath = "receipts/chart_render.json"

type ChartRenderReport struct {
	Status   string             `json:"status"`
	Renderer string             `json:"renderer"`
	Charts   []ChartRenderEntry `json:"charts"`
	Issues   []ChartRenderIssue `json:"issues"`
}

type ChartRenderEntry struct {
	ID         string `json:"id"`
	SlideID    string `json:"slide_id"`
	SpecPath   string `json:"spec_path"`
	SVGPath    string `json:"svg_path"`
	SpecSHA256 string `json:"spec_sha256"`
	SVGSHA256  string `json:"svg_sha256"`
	Command    string `json:"command"`
}

type ChartRenderIssue struct {
	Code    string `json:"code"`
	Path    string `json:"path,omitempty"`
	Message string `json:"message"`
}

func RenderVegaLiteCharts(root string) (ChartRenderReport, error) {
	safeRoot, _, err := readRun(root)
	if err != nil {
		return ChartRenderReport{}, err
	}
	report := ChartRenderReport{
		Status:   "passed",
		Renderer: "node-vega-lite",
		Charts:   []ChartRenderEntry{},
		Issues:   []ChartRenderIssue{},
	}
	manifest, present, err := readChartManifest(safeRoot)
	if err != nil {
		return ChartRenderReport{}, err
	}
	if !present || len(manifest.Charts) == 0 {
		return report, writeChartRenderReport(safeRoot, report)
	}
	nodePath, err := exec.LookPath("node")
	if err != nil {
		report.Status = "failed"
		report.Issues = append(report.Issues, ChartRenderIssue{
			Code:    "svglide.chart_render.missing_node",
			Message: "node executable is not available in PATH",
		})
		return report, writeChartRenderReport(safeRoot, report)
	}
	rendererScript, err := findNodeChartRendererScript()
	if err != nil {
		report.Status = "failed"
		report.Issues = append(report.Issues, ChartRenderIssue{
			Code:    "svglide.chart_render.missing_node_dependencies",
			Path:    "internal/svglide/chart_renderer",
			Message: err.Error(),
		})
		return report, writeChartRenderReport(safeRoot, report)
	}
	if err := validateNodeChartRendererDependencies(rendererScript); err != nil {
		report.Status = "failed"
		report.Issues = append(report.Issues, ChartRenderIssue{
			Code:    "svglide.chart_render.missing_node_dependencies",
			Path:    "internal/svglide/chart_renderer",
			Message: err.Error(),
		})
		return report, writeChartRenderReport(safeRoot, report)
	}
	for _, chart := range manifest.Charts {
		if chartEntryRenderer(manifest, chart) != requiredChartRendererVegaLite {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{
				Code:    "svglide.chart_render.unsupported_renderer",
				Path:    chartManifestPath,
				Message: fmt.Sprintf("chart %q renderer must be vega-lite for local SVG deck", chart.ID),
			})
			continue
		}
		specPath := strings.TrimSpace(chart.SpecPath)
		svgPath := strings.TrimSpace(chart.SVGPath)
		if specPath == "" || svgPath == "" {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{
				Code:    "svglide.chart_render.missing_path",
				Path:    chartManifestPath,
				Message: fmt.Sprintf("chart %q must include spec_path and svg_path", chart.ID),
			})
			continue
		}
		specAbs, err := safeRunPath(safeRoot, specPath)
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{Code: "svglide.chart_render.invalid_spec_path", Path: specPath, Message: err.Error()})
			continue
		}
		svgAbs, err := safeRunPath(safeRoot, svgPath)
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{Code: "svglide.chart_render.invalid_svg_path", Path: svgPath, Message: err.Error()})
			continue
		}
		if err := os.MkdirAll(filepath.Dir(svgAbs), 0o755); err != nil {
			return report, err
		}
		cmd := exec.Command(nodePath, rendererScript, "--input", specAbs, "--output", svgAbs)
		output, err := cmd.CombinedOutput()
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{
				Code:    "svglide.chart_render.node_renderer_failed",
				Path:    specPath,
				Message: strings.TrimSpace(string(output)),
			})
			continue
		}
		specRaw, err := readRunRegularArtifact(safeRoot, specPath)
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{Code: "svglide.chart_render.read_spec", Path: specPath, Message: err.Error()})
			continue
		}
		svgRaw, err := readRunRegularArtifact(safeRoot, svgPath)
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ChartRenderIssue{Code: "svglide.chart_render.read_svg", Path: svgPath, Message: err.Error()})
			continue
		}
		report.Charts = append(report.Charts, ChartRenderEntry{
			ID:         strings.TrimSpace(chart.ID),
			SlideID:    strings.TrimSpace(chart.SlideID),
			SpecPath:   specPath,
			SVGPath:    svgPath,
			SpecSHA256: sha256Hex(specRaw),
			SVGSHA256:  sha256Hex(svgRaw),
			Command:    "node internal/svglide/chart_renderer/render-vegalite.mjs --input " + specPath + " --output " + svgPath,
		})
	}
	return report, writeChartRenderReport(safeRoot, report)
}

func writeChartRenderReport(safeRoot string, report ChartRenderReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, chartRenderReceiptPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func sha256Hex(raw []byte) string {
	sum := sha256.Sum256(raw)
	return "sha256:" + hex.EncodeToString(sum[:])
}

func findNodeChartRendererScript() (string, error) {
	if _, file, _, ok := runtime.Caller(0); ok {
		candidate := filepath.Join(filepath.Dir(file), "chart_renderer", "render-vegalite.mjs")
		if info, statErr := os.Stat(candidate); statErr == nil && info.Mode().IsRegular() {
			return candidate, nil
		}
	}
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for dir := cwd; ; dir = filepath.Dir(dir) {
		for _, rel := range []string{
			filepath.Join("internal", "svglide", "chart_renderer", "render-vegalite.mjs"),
			filepath.Join("chart_renderer", "render-vegalite.mjs"),
		} {
			candidate := filepath.Join(dir, rel)
			if info, statErr := os.Stat(candidate); statErr == nil && info.Mode().IsRegular() {
				return candidate, nil
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
	}
	return "", fmt.Errorf("cannot locate internal/svglide/chart_renderer/render-vegalite.mjs from %s", cwd)
}

func validateNodeChartRendererDependencies(scriptPath string) error {
	root := filepath.Dir(scriptPath)
	for _, rel := range []string{
		filepath.Join("node_modules", "vega", "package.json"),
		filepath.Join("node_modules", "vega-lite", "package.json"),
	} {
		path := filepath.Join(root, rel)
		if info, err := os.Stat(path); err != nil || !info.Mode().IsRegular() {
			return fmt.Errorf("missing %s; run npm --prefix internal/svglide/chart_renderer install", filepath.ToSlash(rel))
		}
	}
	return nil
}
