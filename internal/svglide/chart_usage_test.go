package svglide

import "testing"

func TestChartUsageAcceptsRectChartReference(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<rect slide:role="chart" href="../assets/charts/revenue.svg" x="120" y="120" width="640" height="320"/>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("s1"), chartUsageBriefsForTest())

	if report.Status != "passed" {
		t.Fatalf("report = %+v, want passed", report)
	}
}

func TestChartUsageRejectsImageRoleChart(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<image slide:role="chart" href="../assets/charts/revenue.svg" x="120" y="120" width="640" height="320"/>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("s1"), chartUsageBriefsForTest())

	if !chartUsageIssuesContain(report.Issues, "svglide.chart_usage.invalid_chart_element") {
		t.Fatalf("issues = %+v, want invalid_chart_element", report.Issues)
	}
}

func TestChartUsageRejectsGroupRoleChart(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<g slide:role="chart" href="../assets/charts/revenue.svg"></g>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("s1"), chartUsageBriefsForTest())

	if !chartUsageIssuesContain(report.Issues, "svglide.chart_usage.invalid_chart_element") {
		t.Fatalf("issues = %+v, want invalid_chart_element", report.Issues)
	}
}

func TestChartUsageRejectsWrongSlide(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<rect slide:role="chart" href="../assets/charts/revenue.svg" x="120" y="120" width="640" height="320"/>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("other-slide"), chartUsageBriefsForTest())

	if !chartUsageIssuesContain(report.Issues, "svglide.chart_usage.wrong_slide") {
		t.Fatalf("issues = %+v, want wrong_slide", report.Issues)
	}
}

func TestChartUsageRejectsTinyChart(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<rect slide:role="chart" href="../assets/charts/revenue.svg" x="120" y="120" width="240" height="120"/>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("s1"), chartUsageBriefsForTest())

	if !chartUsageIssuesContain(report.Issues, "svglide.chart_usage.too_small") {
		t.Fatalf("issues = %+v, want too_small", report.Issues)
	}
}

func TestChartUsageRejectsHandDrawnChart(t *testing.T) {
	initStatusTestRun(t)
	deck := writeChartUsageDeckForTest(t, `<line x1="100" y1="420" x2="700" y2="420"/><line x1="100" y1="100" x2="100" y2="420"/><rect x="150" y="320" width="60" height="100"/><rect x="250" y="260" width="60" height="160"/><rect x="350" y="210" width="60" height="210"/><rect x="450" y="180" width="60" height="240"/><text x="150" y="450">$2B</text><text x="250" y="450">$5B</text><text x="350" y="450">$8B</text><text x="450" y="450">$9B</text>`)
	report := EvaluateChartUsageRun("demo", deck, chartUsageManifestForTest("s1"), chartUsageBriefsForTest())

	if !chartUsageIssuesContain(report.Issues, "svglide.chart_usage.hand_drawn_chart") {
		t.Fatalf("issues = %+v, want hand_drawn_chart", report.Issues)
	}
}

func TestQualityWritesChartUsageReceipt(t *testing.T) {
	initStatusTestRun(t)
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[],"no_image_reason":"Chart usage receipt smoke does not exercise raster image selection."}`)

	if _, err := CheckQuality("demo"); err != nil {
		t.Fatal(err)
	}
	if _, err := readRunRegularArtifact("demo", chartUsageReceiptPath); err != nil {
		t.Fatalf("missing chart usage receipt: %v", err)
	}
}

func writeChartUsageDeckForTest(t *testing.T, body string) authorDeck {
	t.Helper()
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide">`+body+`</svg>`)
	return authorDeck{Slides: []authorDeckSlide{{ID: "s1", Path: "slides/01.svg"}}}
}

func chartUsageManifestForTest(slideID string) chartManifestFile {
	return chartManifestFile{
		Renderer: "vega-lite",
		Charts: []chartManifestEntry{{
			ID:            "revenue",
			SlideID:       slideID,
			Renderer:      "vega-lite",
			BriefID:       "revenue",
			SpecPath:      "assets/charts/specs/revenue.vl.json",
			SVGPath:       "assets/charts/revenue.svg",
			SourceID:      "web1",
			Unit:          "$",
			Takeaway:      "Revenue increased",
			RenderReceipt: chartRenderReceiptPath,
		}},
	}
}

func chartUsageBriefsForTest() chartBriefFile {
	return chartBriefFile{Charts: []chartBriefEntry{{
		ID:        "revenue",
		SlideID:   "s1",
		Purpose:   "trend",
		Takeaway:  "Revenue increased",
		Renderer:  "vega-lite",
		SourceIDs: []string{"web1"},
		Unit:      "$",
	}}}
}

func chartUsageIssuesContain(issues []ChartUsageIssue, code string) bool {
	for _, issue := range issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}
