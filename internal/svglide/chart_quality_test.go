package svglide

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestChartQualityRequiresUnitsSourcesAndLabels(t *testing.T) {
	initStatusTestRun(t)
	copyChartQualityTestData(t, "weak_financial_chart", "demo")

	report, err := CheckChartQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if report.Metrics.Charts != 1 || report.Metrics.VegaLiteCharts != 1 {
		t.Fatalf("metrics = %+v, want one Vega-Lite chart", report.Metrics)
	}
	if report.Metrics.MissingUnitCount != 1 {
		t.Fatalf("missing unit count = %d, want 1", report.Metrics.MissingUnitCount)
	}
	if report.Metrics.MissingSourceCount != 1 {
		t.Fatalf("missing source count = %d, want 1", report.Metrics.MissingSourceCount)
	}
	if report.Metrics.MissingAxisCount != 1 || report.Metrics.MissingDirectLabelCount != 1 {
		t.Fatalf("label metrics = %+v, want missing axis and direct label", report.Metrics)
	}
	if report.Metrics.DecorativeChartCount != 1 {
		t.Fatalf("decorative chart count = %d, want 1", report.Metrics.DecorativeChartCount)
	}
	for _, code := range []string{
		"svglide.chart_quality.missing_unit",
		"svglide.chart_quality.missing_source",
		"svglide.chart_quality.missing_labeling",
		"svglide.chart_quality.decorative_chart",
	} {
		if !chartQualityIssueCodesContain(report.Issues, code) {
			t.Fatalf("issues = %+v, want %s", report.Issues, code)
		}
	}
}

func TestChartQualityDoesNotTreatCompanyComparisonAsSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"vega-lite","charts":[{"id":"peer","slide_id":"s1","renderer":"vega-lite","spec_path":"assets/charts/specs/peer.vl.json","svg_path":"assets/charts/peer.svg"}]}`)
	mustWriteTestFile(t, "demo/assets/charts/peer.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><g role="axis"><text>FY2024</text></g><text>Company comparison</text><text>$22.1B</text><rect width="120" height="160"/></svg>`)

	report, err := CheckChartQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for missing source", report.Status)
	}
	if report.Metrics.MissingSourceCount != 1 {
		t.Fatalf("missing source count = %d, want 1", report.Metrics.MissingSourceCount)
	}
	if !chartQualityIssueCodesContain(report.Issues, "svglide.chart_quality.missing_source") {
		t.Fatalf("issues = %+v, want missing source", report.Issues)
	}
}

func copyChartQualityTestData(t *testing.T, name string, root string) {
	t.Helper()
	srcRoot := chartQualityTestDataRoot(t, name)
	err := filepath.WalkDir(srcRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(srcRoot, path)
		if err != nil {
			return err
		}
		raw, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		target := filepath.Join(root, rel)
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		return os.WriteFile(target, raw, 0o644)
	})
	if err != nil {
		t.Fatal(err)
	}
}

func chartQualityTestDataRoot(t *testing.T, name string) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Join(filepath.Dir(file), "testdata", "chart_quality", name)
}

func chartQualityIssueCodesContain(issues []ChartQualityIssue, code string) bool {
	for _, issue := range issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}
