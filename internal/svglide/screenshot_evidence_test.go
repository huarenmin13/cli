package svglide

import "testing"

func TestScreenshotEvidenceRejectsViewportCanvasMismatch(t *testing.T) {
	initStatusTestRun(t)
	deck := authorDeck{Slides: []authorDeckSlide{{ID: "s1", Path: "slides/01.svg"}}}
	mustWriteTestFile(t, "demo/screenshots/01.png", "png")
	report := ScreenshotEvidenceReport{
		Status: "passed",
		Slides: []ScreenshotEvidenceSlide{{
			SlideID:        "s1",
			SlidePath:      "slides/01.svg",
			ScreenshotPath: "screenshots/01.png",
			CanvasWidth:    1280,
			CanvasHeight:   720,
			ViewportWidth:  960,
			ViewportHeight: 540,
			PixelWidth:     960,
			PixelHeight:    540,
			Scale:          1,
			Status:         "passed",
		}},
	}

	got := validateScreenshotEvidenceReport("demo", deck, report)
	if got.Status != "failed" {
		t.Fatalf("status = %q, want failed", got.Status)
	}
	if got.Metrics.CanvasMismatchCount != 1 {
		t.Fatalf("canvas mismatch count = %d, want 1", got.Metrics.CanvasMismatchCount)
	}
	if !screenshotIssueCodesContain(got.Issues, "svglide.screenshot_evidence.canvas_mismatch") {
		t.Fatalf("issues = %+v, want canvas mismatch", got.Issues)
	}
}

func TestScreenshotEvidenceAcceptsCanvasMatchedScreenshot(t *testing.T) {
	initStatusTestRun(t)
	deck := authorDeck{Slides: []authorDeckSlide{{ID: "s1", Path: "slides/01.svg"}}}
	mustWriteTestFile(t, "demo/screenshots/01.png", "png")
	report := ScreenshotEvidenceReport{
		Status: "passed",
		Slides: []ScreenshotEvidenceSlide{{
			SlideID:        "s1",
			SlidePath:      "slides/01.svg",
			ScreenshotPath: "screenshots/01.png",
			CanvasWidth:    1280,
			CanvasHeight:   720,
			ViewportWidth:  1280,
			ViewportHeight: 720,
			PixelWidth:     1280,
			PixelHeight:    720,
			Scale:          1,
			Status:         "passed",
		}},
	}

	got := validateScreenshotEvidenceReport("demo", deck, report)
	if got.Status != "passed" {
		t.Fatalf("status = %q, want passed: %+v", got.Status, got.Issues)
	}
	if got.Metrics.Screenshots != 1 {
		t.Fatalf("screenshots = %d, want 1", got.Metrics.Screenshots)
	}
}

func screenshotIssueCodesContain(issues []ScreenshotEvidenceIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
