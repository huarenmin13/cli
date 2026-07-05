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
