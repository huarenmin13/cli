package svglide

import (
	"errors"
	"testing"
)

func TestEditorialQualityRejectsPassedMechanicalGateWithoutMediaPressure(t *testing.T) {
	contract := qualityVisualContract{TopicArchetype: "financial_company_report"}
	media := MediaPressureReport{
		Status:  "failed",
		Metrics: MediaPressureMetrics{Slides: 5, IssueCount: 2, DominantRealImagePages: 0, CoverDominantRealImagePages: 0, MaxConsecutiveInfographicPages: 5},
		Issues:  []MediaPressureIssue{{Code: "svglide.media_pressure.cover_dominant_real_image", Severity: "error"}},
		Policy:  defaultMediaPressurePolicy("financial_company_report", 5),
	}
	creative := CreativeQualityReport{
		Status:  "passed",
		Metrics: CreativeQualityMetrics{Slides: 5, ShapeLanguageMaxRatioBP: 10000},
	}

	report := EvaluateEditorialQualityRun(contract, media, creative)
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !editorialIssueCodesContain(report.Issues, "svglide.editorial_quality.media_pressure") {
		t.Fatalf("issues = %+v, want media pressure issue", report.Issues)
	}
	if !editorialIssueCodesContain(report.Issues, "svglide.editorial_quality.cover_hero") {
		t.Fatalf("issues = %+v, want cover hero issue", report.Issues)
	}
}

func TestEditorialQualityPassesWhenArchetypeFloorIsMet(t *testing.T) {
	contract := qualityVisualContract{TopicArchetype: "sports_editorial"}
	media := MediaPressureReport{
		Status:  "passed",
		Metrics: MediaPressureMetrics{Slides: 8, IssueCount: 0, DominantRealImagePages: 3, CoverDominantRealImagePages: 1, MaxConsecutiveInfographicPages: 2},
		Policy:  defaultMediaPressurePolicy("sports_editorial", 8),
	}
	creative := CreativeQualityReport{
		Status:  "passed",
		Metrics: CreativeQualityMetrics{Slides: 8, CardDominantSlideCount: 2, ShapeLanguageMaxRatioBP: 6250},
	}

	report := EvaluateEditorialQualityRun(contract, media, creative)
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed: %+v", report.Status, report.Issues)
	}
	if report.Score < report.Target.MinimumScore {
		t.Fatalf("score = %d, want >= %d", report.Score, report.Target.MinimumScore)
	}
}

func TestEditorialQualityExecutionFailureWritesActionableIssue(t *testing.T) {
	contract := qualityVisualContract{TopicArchetype: "financial_company_report"}
	media := MediaPressureReport{
		Status:  "passed",
		Metrics: MediaPressureMetrics{Slides: 3, IssueCount: 0, DominantRealImagePages: 2, CoverDominantRealImagePages: 1},
	}

	report := EvaluateEditorialQualityExecutionFailure(contract, media, errors.New("creative report missing"))
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if report.Metrics.CreativeErrorCount != 1 {
		t.Fatalf("creative errors = %d, want 1", report.Metrics.CreativeErrorCount)
	}
	if !editorialIssueCodesContain(report.Issues, "svglide.editorial_quality.creative_unavailable") {
		t.Fatalf("issues = %+v, want creative unavailable issue", report.Issues)
	}
}

func TestEditorialQualityFailsContentPayloadIssues(t *testing.T) {
	contract := qualityVisualContract{}
	media := MediaPressureReport{
		Status:  "passed",
		Metrics: MediaPressureMetrics{Slides: 3, IssueCount: 0},
	}
	creative := CreativeQualityReport{
		Status:  "passed",
		Metrics: CreativeQualityMetrics{Slides: 3},
	}
	payload := ContentPayloadReport{
		Status: "failed",
		Metrics: ContentPayloadMetrics{
			Slides:                       3,
			SubstantiveSlides:            2,
			SparseLabelListCount:         1,
			MissingSupportingPointsCount: 1,
			MissingSourceBoundFactCount:  1,
			MissingVisualDataItemsCount:  1,
			IssueCount:                   4,
		},
	}

	report := EvaluateEditorialQualityRun(contract, media, creative, payload)
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if report.Metrics.SparseLabelListCount != 1 {
		t.Fatalf("sparse count = %d, want 1", report.Metrics.SparseLabelListCount)
	}
	if !editorialIssueCodesContain(report.Issues, "svglide.editorial.content_sparse_label_list") {
		t.Fatalf("issues = %+v, want content_sparse_label_list", report.Issues)
	}
	if !editorialIssueCodesContain(report.Issues, "svglide.editorial.content_visual_data_mismatch") {
		t.Fatalf("issues = %+v, want content_visual_data_mismatch", report.Issues)
	}
}

func editorialIssueCodesContain(issues []EditorialQualityIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
