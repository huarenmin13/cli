package svglide

import (
	"os"
	"path/filepath"
	"testing"
)

func TestChartRenderRendersVegaLiteSpecWithNodeRenderer(t *testing.T) {
	if script, err := findNodeChartRendererScript(); err != nil {
		t.Skip(err)
	} else if err := validateNodeChartRendererDependencies(script); err != nil {
		t.Skip(err)
	}
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"vega-lite","charts":[{"id":"revenue","slide_id":"s1","renderer":"vega-lite","brief_id":"revenue","spec_path":"assets/charts/specs/revenue.vl.json","svg_path":"assets/charts/revenue.svg","source_id":"web1","unit":"$","takeaway":"Revenue increased","render_receipt":"receipts/chart_render.json"}]}`)
	mustWriteTestFile(t, "demo/assets/charts/specs/revenue.vl.json", minimalVegaLiteSpecForTest())

	report, err := RenderVegaLiteCharts("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, issues = %+v", report.Status, report.Issues)
	}
	if report.Renderer != "node-vega-lite" {
		t.Fatalf("renderer = %q, want node-vega-lite", report.Renderer)
	}
	if len(report.Charts) != 1 || report.Charts[0].SpecSHA256 == "" || report.Charts[0].SVGSHA256 == "" {
		t.Fatalf("render report = %+v, want one hashed chart", report)
	}
	if info, err := os.Stat(filepath.Join("demo", "assets", "charts", "revenue.svg")); err != nil || info.Size() == 0 {
		t.Fatalf("rendered SVG missing or empty, info=%+v err=%v", info, err)
	}
}

func TestChartRenderWritesEmptyReceiptForNoChartManifest(t *testing.T) {
	initStatusTestRun(t)

	report, err := RenderVegaLiteCharts("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" || len(report.Charts) != 0 {
		t.Fatalf("report = %+v, want passed empty report", report)
	}
}

func minimalVegaLiteSpecForTest() string {
	return `{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 640,
  "height": 320,
  "data": {
    "values": [
      {"quarter": "Q1", "revenue": 2},
      {"quarter": "Q2", "revenue": 5}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "quarter", "type": "nominal", "title": "Quarter"},
    "y": {"field": "revenue", "type": "quantitative", "title": "Revenue ($B)"}
  }
}`
}
