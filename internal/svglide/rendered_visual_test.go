package svglide

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRenderedVisualGateDetectsAppleSubtitleOverflow(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><text x="92" y="318" font-size="25">Revenue declined 4.3% year over year, but gross margin reached 46.6% and diluted EPS set a March-quarter record.</text></svg>`
	report := evaluateRenderedVisualSVG("slides/01.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.text_overflow") {
		t.Fatalf("report = %+v, want text_overflow", report)
	}
}

func TestRenderedVisualGateDetectsForeignObjectClip(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><foreignObject x="370" y="58" width="820" height="58" style="font-size:48px;line-height:1.16"><h2 xmlns="http://www.w3.org/1999/xhtml" style="margin:0">这支美国队的优势在结构，不只在星味</h2></foreignObject></svg>`
	report := evaluateRenderedVisualSVG("slides/02.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.text_box_overflow") {
		t.Fatalf("report = %+v, want text_box_overflow", report)
	}
}

func TestRenderedVisualGateDetectsTimelineCollision(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><g font-size="46"><text x="984" y="338">2022</text><text x="1160" y="338" text-anchor="end">2024</text></g></svg>`
	report := evaluateRenderedVisualSVG("slides/03.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.text_collision") {
		t.Fatalf("report = %+v, want text_collision", report)
	}
}

func TestRenderedVisualGateDetectsMetricCardInternalOverflow(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<rect x="930" y="134" width="190" height="118" rx="10" fill="#202420" stroke="#3d443f"/>
<foreignObject x="950" y="239" width="150" height="129" style="font-size:16px">
  <div xmlns="http://www.w3.org/1999/xhtml">current assets / liabilities</div>
</foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/05-ratios-peers.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.container_text_overflow") {
		t.Fatalf("report = %+v, want container_text_overflow", report)
	}
}

func TestRenderedVisualGateDetectsPathPanelInternalOverflow(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<path id="panel" d="M 930 134 H 1120 V 252 H 930 Z" fill="#202420" stroke="#3d443f"/>
<foreignObject x="950" y="239" width="150" height="129" style="font-size:16px">
  <div xmlns="http://www.w3.org/1999/xhtml">current assets / liabilities</div>
</foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/05-ratios-peers.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.container_text_overflow") {
		t.Fatalf("report = %+v, want container_text_overflow for path panel", report)
	}
}

func TestRenderedVisualGateDetectsForeignObjectWrapperPaddingRisk(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<foreignObject x="100" y="100" width="260" height="120" style="background-color:#202420;font-size:15px">
  <div xmlns="http://www.w3.org/1999/xhtml">Text starts at the visual wrapper edge instead of respecting inner padding.</div>
</foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/06.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.container_padding_risk") {
		t.Fatalf("report = %+v, want container_padding_risk for foreignObject wrapper", report)
	}
}

func TestRenderedVisualGateAllowsTextInsideCardPadding(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<rect x="100" y="100" width="280" height="150" rx="10" fill="#202420" stroke="#3d443f"/>
<foreignObject x="124" y="126" width="220" height="84" style="font-size:18px">
  <div xmlns="http://www.w3.org/1999/xhtml">A fitted note with room.</div>
</foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/01.svg", []byte(svg))
	if report.Status != "passed" {
		t.Fatalf("report = %+v, want passed", report)
	}
}

func TestRenderedVisualGateDoesNotTreatChartBarsAsTextContainers(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<rect x="120" y="160" width="280" height="320" class="mark-bar" fill="#76b900"/>
<text x="132" y="188" font-size="22">$22.1B</text>
</svg>`
	report := evaluateRenderedVisualSVG("slides/chart.svg", []byte(svg))
	if report.Status != "passed" {
		t.Fatalf("report = %+v, want passed for chart mark label", report)
	}
}

func TestRenderedVisualGateDetectsForeignObjectOverlap(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<foreignObject x="120" y="120" width="260" height="80" style="font-size:22px"><p xmlns="http://www.w3.org/1999/xhtml">First label</p></foreignObject>
<foreignObject x="180" y="150" width="260" height="80" style="font-size:22px"><p xmlns="http://www.w3.org/1999/xhtml">Second label</p></foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/02.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.foreign_object_collision") {
		t.Fatalf("report = %+v, want foreign_object_collision", report)
	}
}

func TestRenderedVisualGateDetectsTightLineHeight(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<foreignObject x="120" y="120" width="420" height="90" style="font-size:20px;line-height:20px"><p xmlns="http://www.w3.org/1999/xhtml">Dense label copy with enough words to wrap into two lines.</p></foreignObject>
</svg>`
	report := evaluateRenderedVisualSVG("slides/03.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.tight_line_height") {
		t.Fatalf("report = %+v, want tight_line_height", report)
	}
}

func TestRenderedVisualGateDetectsBoldOveruse(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide">
<text x="100" y="120" font-size="34" font-weight="800">Revenue acceleration is the story</text>
<text x="100" y="180" font-size="28" font-weight="800">Margins expand while supply stays tight</text>
<text x="100" y="236" font-size="24" font-weight="800">Every sentence should not be bold</text>
</svg>`
	report := evaluateRenderedVisualSVG("slides/04.svg", []byte(svg))
	if report.Status != "failed" || !renderedVisualHasCode(report, "svglide.rendered_visual.bold_overuse") {
		t.Fatalf("report = %+v, want bold_overuse", report)
	}
}

func TestRenderedVisualGateAllowsFittedText(t *testing.T) {
	svg := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><text x="92" y="120" font-size="24">Short title</text><foreignObject x="92" y="180" width="520" height="90" style="font-size:24px"><p xmlns="http://www.w3.org/1999/xhtml">One fitted sentence.</p></foreignObject></svg>`
	report := evaluateRenderedVisualSVG("slides/01.svg", []byte(svg))
	if report.Status != "passed" {
		t.Fatalf("report = %+v, want passed", report)
	}
}

func TestRenderedVisualGateRegressionFixtures(t *testing.T) {
	tests := []struct {
		name string
		file string
		code string
	}{
		{"apple subtitle", "apple_subtitle_overflow.svg", "svglide.rendered_visual.text_overflow"},
		{"apple cashflow", "apple_cashflow_callout_overflow.svg", "svglide.rendered_visual.text_overflow"},
		{"leica timeline", "leica_timeline_collision.svg", "svglide.rendered_visual.text_collision"},
		{"sports title", "sports_foreign_object_clip.svg", "svglide.rendered_visual.text_box_overflow"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			raw, err := os.ReadFile(filepath.Join("..", "..", "testdata", "svglide", "rendered_visual", tt.file))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}
			report := evaluateRenderedVisualSVG(tt.file, raw)
			if report.Status != "failed" || !renderedVisualHasCode(report, tt.code) {
				t.Fatalf("report = %+v, want %s", report, tt.code)
			}
		})
	}
}

func renderedVisualHasCode(report RenderedVisualReport, code string) bool {
	for _, issue := range report.Issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}
