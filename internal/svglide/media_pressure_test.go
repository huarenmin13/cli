package svglide

import "testing"

func TestMediaPressureRejectsCompanyReportWithoutDominantRealHero(t *testing.T) {
	deck := authorDeck{Slides: []authorDeckSlide{
		{ID: "s1", Role: "cover", VisualRole: "hero_cover", Path: "slides/01.svg"},
		{ID: "s2", Role: "income", Path: "slides/02.svg"},
		{ID: "s3", Role: "peers", Path: "slides/03.svg"},
	}}
	contract := qualityVisualContract{
		TopicArchetype: "financial_company_report",
		MediaPressure: mediaPressureContract{
			MinDominantRealImagePages:          2,
			RequireCoverDominantRealImage:      true,
			MaxConsecutiveInfographicOnlyPages: 2,
		},
	}
	usage := ImageUsageReport{Status: "passed", Slides: []ImageUsageSlide{
		{SlideID: "s1", CanvasWidth: 960, CanvasHeight: 540, Assets: []ImageUsageAsset{}},
		{SlideID: "s2", CanvasWidth: 960, CanvasHeight: 540, Assets: []ImageUsageAsset{}},
		{SlideID: "s3", CanvasWidth: 960, CanvasHeight: 540, Assets: []ImageUsageAsset{}},
	}}

	report := EvaluateMediaPressureRun(deck, contract, usage)
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !mediaPressureIssueCodesContain(report.Issues, "svglide.media_pressure.cover_dominant_real_image") {
		t.Fatalf("issues = %+v, want cover dominant real image issue", report.Issues)
	}
	if !mediaPressureIssueCodesContain(report.Issues, "svglide.media_pressure.dominant_real_image_pages") {
		t.Fatalf("issues = %+v, want dominant image page issue", report.Issues)
	}
}

func TestMediaPressureAllowsConfiguredDominantImageRhythm(t *testing.T) {
	deck := authorDeck{Slides: []authorDeckSlide{
		{ID: "s1", Role: "cover", VisualRole: "hero_cover", Path: "slides/01.svg"},
		{ID: "s2", Role: "analysis", Path: "slides/02.svg"},
		{ID: "s3", Role: "moment", Path: "slides/03.svg"},
		{ID: "s4", Role: "closing", Path: "slides/04.svg"},
	}}
	contract := qualityVisualContract{
		TopicArchetype: "sports_editorial",
		MediaPressure: mediaPressureContract{
			MinRealImagePages:                  2,
			MinDominantRealImagePages:          2,
			RequireCoverDominantRealImage:      true,
			MaxConsecutiveInfographicOnlyPages: 2,
			MinUniqueRealImages:                2,
		},
	}
	usage := ImageUsageReport{Status: "passed", Slides: []ImageUsageSlide{
		{SlideID: "s1", Assets: []ImageUsageAsset{{Path: "assets/images/cover.jpg", AreaBP: 8000}}},
		{SlideID: "s2", Assets: []ImageUsageAsset{}},
		{SlideID: "s3", Assets: []ImageUsageAsset{{Path: "assets/images/moment.jpg", AreaBP: 4500}}},
		{SlideID: "s4", Assets: []ImageUsageAsset{}},
	}}

	report := EvaluateMediaPressureRun(deck, contract, usage)
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed: %+v", report.Status, report.Issues)
	}
	if report.Metrics.DominantRealImagePages != 2 || report.Metrics.MaxConsecutiveInfographicPages != 1 {
		t.Fatalf("metrics = %+v, want two dominant pages and max infographic run 1", report.Metrics)
	}
}

func TestMediaPressureDefaultPolicyRequiresCultureRealImages(t *testing.T) {
	deck := authorDeck{Slides: []authorDeckSlide{
		{ID: "s1", Role: "cover", VisualRole: "hero_cover", Path: "slides/01.svg"},
		{ID: "s2", Role: "taxonomy", Path: "slides/02.svg"},
		{ID: "s3", Role: "process", Path: "slides/03.svg"},
		{ID: "s4", Role: "closing", Path: "slides/04.svg"},
	}}
	contract := qualityVisualContract{
		TopicArchetype: "cultural_lifestyle_editorial",
	}
	usage := ImageUsageReport{Status: "passed", Slides: []ImageUsageSlide{
		{SlideID: "s1", Assets: []ImageUsageAsset{}},
		{SlideID: "s2", Assets: []ImageUsageAsset{}},
		{SlideID: "s3", Assets: []ImageUsageAsset{}},
		{SlideID: "s4", Assets: []ImageUsageAsset{}},
	}}

	report := EvaluateMediaPressureRun(deck, contract, usage)
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if report.Policy.MinRealImagePages == 0 || report.Policy.MinUniqueRealImages == 0 {
		t.Fatalf("policy = %+v, want culture default real-image pressure", report.Policy)
	}
	if !mediaPressureIssueCodesContain(report.Issues, "svglide.media_pressure.real_image_pages") {
		t.Fatalf("issues = %+v, want real_image_pages issue", report.Issues)
	}
}

func mediaPressureIssueCodesContain(issues []MediaPressureIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
