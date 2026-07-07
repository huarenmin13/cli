package svglide

import (
	"fmt"
	"strings"
)

const editorialQualityReportPath = "receipts/editorial_quality.json"

type EditorialQualityReport struct {
	Status  string                  `json:"status"`
	Score   int                     `json:"score"`
	Metrics EditorialQualityMetrics `json:"metrics"`
	Issues  []EditorialQualityIssue `json:"issues"`
	Target  editorialQualityTarget  `json:"target"`
}

type EditorialQualityMetrics struct {
	Slides                         int `json:"slides"`
	MediaPressureIssueCount        int `json:"media_pressure_issue_count"`
	DominantRealImagePages         int `json:"dominant_real_image_pages"`
	MaxConsecutiveInfographicPages int `json:"max_consecutive_infographic_pages"`
	CardDominantRatioBP            int `json:"card_dominant_ratio_bp"`
	ShapeLanguageMaxRatioBP        int `json:"shape_language_max_ratio_bp"`
	CreativeErrorCount             int `json:"creative_error_count"`
	ContentPayloadIssueCount       int `json:"content_payload_issue_count"`
	SparseLabelListCount           int `json:"sparse_label_list_count"`
	MissingEvidencePayloadCount    int `json:"missing_evidence_payload_count"`
	MissingVisualDataItemsCount    int `json:"missing_visual_data_items_count"`
	IssueCount                     int `json:"issue_count"`
}

type EditorialQualityIssue struct {
	Code     string `json:"code"`
	Path     string `json:"path"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type editorialQualityTarget struct {
	MinimumScore                       int  `json:"minimum_score"`
	RequireMediaPressurePassed         bool `json:"require_media_pressure_passed"`
	RequireCoverDominantRealImage      bool `json:"require_cover_dominant_real_image"`
	MaxConsecutiveInfographicOnlyPages int  `json:"max_consecutive_infographic_only_pages"`
	MaxCardDominantRatioBP             int  `json:"max_card_dominant_ratio_bp"`
	MaxShapeLanguageMaxRatioBP         int  `json:"max_shape_language_max_ratio_bp"`
}

func EvaluateEditorialQualityRun(contract qualityVisualContract, media MediaPressureReport, creative CreativeQualityReport, contentPayloadReports ...ContentPayloadReport) EditorialQualityReport {
	target := resolveEditorialQualityTarget(contract)
	contentPayload := ContentPayloadReport{}
	if len(contentPayloadReports) > 0 {
		contentPayload = contentPayloadReports[0]
	}
	report := EditorialQualityReport{
		Status:  "passed",
		Score:   100,
		Metrics: editorialMetrics(media, creative, contentPayload),
		Issues:  []EditorialQualityIssue{},
		Target:  target,
	}
	if target.RequireMediaPressurePassed && media.Status != "passed" {
		report.Score -= 35
		addEditorialIssue(&report, mediaPressureReportPath, "svglide.editorial_quality.media_pressure", "media pressure must pass before the deck can be considered visually ready")
	}
	if target.RequireCoverDominantRealImage && media.Metrics.CoverDominantRealImagePages == 0 {
		report.Score -= 25
		addEditorialIssue(&report, mediaPressureReportPath, "svglide.editorial_quality.cover_hero", "topic archetype requires a cover-level dominant real image")
	}
	if target.MaxConsecutiveInfographicOnlyPages > 0 && media.Metrics.MaxConsecutiveInfographicPages > target.MaxConsecutiveInfographicOnlyPages {
		report.Score -= 20
		addEditorialIssue(&report, mediaPressureReportPath, "svglide.editorial_quality.infographic_run", fmt.Sprintf("consecutive infographic-only run is %d, want <= %d", media.Metrics.MaxConsecutiveInfographicPages, target.MaxConsecutiveInfographicOnlyPages))
	}
	if target.MaxCardDominantRatioBP > 0 && report.Metrics.CardDominantRatioBP > target.MaxCardDominantRatioBP {
		report.Score -= 15
		addEditorialIssue(&report, creativeQualityReportPath, "svglide.editorial_quality.card_overuse", fmt.Sprintf("card-dominant slide ratio is %d bp, want <= %d bp", report.Metrics.CardDominantRatioBP, target.MaxCardDominantRatioBP))
	}
	if target.MaxShapeLanguageMaxRatioBP > 0 && report.Metrics.ShapeLanguageMaxRatioBP > target.MaxShapeLanguageMaxRatioBP {
		report.Score -= 15
		addEditorialIssue(&report, creativeQualityReportPath, "svglide.editorial_quality.shape_language_overuse", fmt.Sprintf("shape language max ratio is %d bp, want <= %d bp", report.Metrics.ShapeLanguageMaxRatioBP, target.MaxShapeLanguageMaxRatioBP))
	}
	if creative.Status != "passed" {
		report.Score -= minPositive(creativeErrorCount(creative)*5, 25)
	}
	if contentPayload.Metrics.IssueCount > 0 {
		report.Score -= minPositive(contentPayload.Metrics.IssueCount*6, 30)
		if contentPayload.Metrics.SparseLabelListCount > 0 {
			addEditorialIssue(&report, contentPayloadReportPath, "svglide.editorial.content_sparse_label_list", fmt.Sprintf("sparse label-list slides: %d", contentPayload.Metrics.SparseLabelListCount))
		}
		if contentPayload.Metrics.MissingCentralClaimCount+contentPayload.Metrics.MissingSupportingPointsCount+contentPayload.Metrics.MissingSourceBoundFactCount+contentPayload.Metrics.SourceBindingIssueCount > 0 {
			addEditorialIssue(&report, contentPayloadReportPath, "svglide.editorial.content_missing_evidence_payload", "substantive slides need central claims, supporting points, and source-bound facts")
		}
		if contentPayload.Metrics.MissingVisualDataItemsCount > 0 {
			addEditorialIssue(&report, contentPayloadReportPath, "svglide.editorial.content_visual_data_mismatch", fmt.Sprintf("visual forms missing data items: %d", contentPayload.Metrics.MissingVisualDataItemsCount))
		}
	}
	if target.MinimumScore > 0 && report.Score < target.MinimumScore {
		addEditorialIssue(&report, editorialQualityReportPath, "svglide.editorial_quality.score", fmt.Sprintf("editorial quality score is %d, want >= %d", report.Score, target.MinimumScore))
	}
	if report.Score < 0 {
		report.Score = 0
	}
	report.Metrics.IssueCount = len(report.Issues)
	if report.Metrics.IssueCount > 0 {
		report.Status = "failed"
	}
	return report
}

func EvaluateEditorialQualityExecutionFailure(contract qualityVisualContract, media MediaPressureReport, err error) EditorialQualityReport {
	target := resolveEditorialQualityTarget(contract)
	report := EditorialQualityReport{
		Status: "failed",
		Score:  0,
		Metrics: EditorialQualityMetrics{
			Slides:                         media.Metrics.Slides,
			MediaPressureIssueCount:        media.Metrics.IssueCount,
			DominantRealImagePages:         media.Metrics.DominantRealImagePages,
			MaxConsecutiveInfographicPages: media.Metrics.MaxConsecutiveInfographicPages,
			CreativeErrorCount:             1,
			IssueCount:                     1,
		},
		Issues: []EditorialQualityIssue{{
			Code:     "svglide.editorial_quality.creative_unavailable",
			Path:     creativeQualityReportPath,
			Message:  err.Error(),
			Severity: "error",
		}},
		Target: target,
	}
	return report
}

func writeEditorialQualityReport(safeRoot string, report EditorialQualityReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, editorialQualityReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func resolveEditorialQualityTarget(contract qualityVisualContract) editorialQualityTarget {
	target := defaultEditorialQualityTarget(strings.TrimSpace(contract.TopicArchetype))
	explicit := contract.EditorialQualityTarget
	if explicit.MinimumScore > 0 {
		target.MinimumScore = explicit.MinimumScore
	}
	if explicit.RequireMediaPressurePassed {
		target.RequireMediaPressurePassed = true
	}
	if explicit.RequireCoverDominantRealImage {
		target.RequireCoverDominantRealImage = true
	}
	if explicit.MaxConsecutiveInfographicOnlyPages > 0 {
		target.MaxConsecutiveInfographicOnlyPages = explicit.MaxConsecutiveInfographicOnlyPages
	}
	if explicit.MaxCardDominantRatioBP > 0 {
		target.MaxCardDominantRatioBP = explicit.MaxCardDominantRatioBP
	}
	if explicit.MaxShapeLanguageMaxRatioBP > 0 {
		target.MaxShapeLanguageMaxRatioBP = explicit.MaxShapeLanguageMaxRatioBP
	}
	return target
}

func defaultEditorialQualityTarget(archetype string) editorialQualityTarget {
	switch archetype {
	case "financial_company_report", "named_company_report":
		return editorialQualityTarget{MinimumScore: 75, RequireMediaPressurePassed: true, RequireCoverDominantRealImage: true, MaxConsecutiveInfographicOnlyPages: 3, MaxCardDominantRatioBP: 5000, MaxShapeLanguageMaxRatioBP: 8000}
	case "premium_product_brand", "brand_official_site":
		return editorialQualityTarget{MinimumScore: 80, RequireMediaPressurePassed: true, RequireCoverDominantRealImage: true, MaxConsecutiveInfographicOnlyPages: 2, MaxCardDominantRatioBP: 3500, MaxShapeLanguageMaxRatioBP: 7500}
	case "sports_editorial", "event_editorial":
		return editorialQualityTarget{MinimumScore: 78, RequireMediaPressurePassed: true, RequireCoverDominantRealImage: true, MaxConsecutiveInfographicOnlyPages: 2, MaxCardDominantRatioBP: 4000, MaxShapeLanguageMaxRatioBP: 7000}
	default:
		return editorialQualityTarget{}
	}
}

func editorialMetrics(media MediaPressureReport, creative CreativeQualityReport, contentPayload ContentPayloadReport) EditorialQualityMetrics {
	slides := media.Metrics.Slides
	if slides == 0 {
		slides = creative.Metrics.Slides
	}
	cardRatio := 0
	if creative.Metrics.Slides > 0 {
		cardRatio = creative.Metrics.CardDominantSlideCount * 10000 / creative.Metrics.Slides
	}
	return EditorialQualityMetrics{
		Slides:                         slides,
		MediaPressureIssueCount:        media.Metrics.IssueCount,
		DominantRealImagePages:         media.Metrics.DominantRealImagePages,
		MaxConsecutiveInfographicPages: media.Metrics.MaxConsecutiveInfographicPages,
		CardDominantRatioBP:            cardRatio,
		ShapeLanguageMaxRatioBP:        creative.Metrics.ShapeLanguageMaxRatioBP,
		CreativeErrorCount:             creativeErrorCount(creative),
		ContentPayloadIssueCount:       contentPayload.Metrics.IssueCount,
		SparseLabelListCount:           contentPayload.Metrics.SparseLabelListCount,
		MissingEvidencePayloadCount:    contentPayload.Metrics.MissingCentralClaimCount + contentPayload.Metrics.MissingSupportingPointsCount + contentPayload.Metrics.MissingSourceBoundFactCount + contentPayload.Metrics.SourceBindingIssueCount,
		MissingVisualDataItemsCount:    contentPayload.Metrics.MissingVisualDataItemsCount,
	}
}

func creativeErrorCount(report CreativeQualityReport) int {
	count := 0
	for _, issue := range report.Issues {
		if issue.Severity == "error" {
			count++
		}
	}
	return count
}

func addEditorialIssue(report *EditorialQualityReport, path, code, message string) {
	report.Issues = append(report.Issues, EditorialQualityIssue{
		Code:     code,
		Path:     path,
		Message:  message,
		Severity: "error",
	})
}

func isZeroEditorialQualityTarget(target editorialQualityTarget) bool {
	return target.MinimumScore == 0 &&
		!target.RequireMediaPressurePassed &&
		!target.RequireCoverDominantRealImage &&
		target.MaxConsecutiveInfographicOnlyPages == 0 &&
		target.MaxCardDominantRatioBP == 0 &&
		target.MaxShapeLanguageMaxRatioBP == 0
}
