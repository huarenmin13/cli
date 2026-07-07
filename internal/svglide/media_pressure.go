package svglide

import (
	"fmt"
	"path/filepath"
	"strings"
)

const mediaPressureReportPath = "receipts/media_pressure.json"

type MediaPressureReport struct {
	Status  string               `json:"status"`
	Metrics MediaPressureMetrics `json:"metrics"`
	Issues  []MediaPressureIssue `json:"issues"`
	Slides  []MediaPressureSlide `json:"slides"`
	Policy  MediaPressurePolicy  `json:"policy"`
}

type MediaPressureMetrics struct {
	Slides                         int `json:"slides"`
	RealImagePages                 int `json:"real_image_pages"`
	DominantRealImagePages         int `json:"dominant_real_image_pages"`
	CoverDominantRealImagePages    int `json:"cover_dominant_real_image_pages"`
	MaxConsecutiveInfographicPages int `json:"max_consecutive_infographic_pages"`
	UniqueRealImages               int `json:"unique_real_images"`
	IssueCount                     int `json:"issue_count"`
}

type MediaPressureIssue struct {
	Code     string `json:"code"`
	Path     string `json:"path"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type MediaPressureSlide struct {
	SlideID            string `json:"slide_id"`
	Path               string `json:"path"`
	VisualRole         string `json:"visual_role"`
	LargestImageAreaBP int    `json:"largest_image_area_bp"`
	RealImageCount     int    `json:"real_image_count"`
	DominantRealImage  bool   `json:"dominant_real_image"`
	InfographicOnly    bool   `json:"infographic_only"`
}

type MediaPressurePolicy struct {
	TopicArchetype                     string `json:"topic_archetype"`
	MinRealImagePages                  int    `json:"min_real_image_pages"`
	MinDominantRealImagePages          int    `json:"min_dominant_real_image_pages"`
	DominantImageMinAreaBP             int    `json:"dominant_image_min_area_bp"`
	RequireCoverDominantRealImage      bool   `json:"require_cover_dominant_real_image"`
	MaxConsecutiveInfographicOnlyPages int    `json:"max_consecutive_infographic_only_pages"`
	MinUniqueRealImages                int    `json:"min_unique_real_images"`
}

type mediaPressureContract struct {
	MinRealImagePages                  int  `json:"min_real_image_pages"`
	MinDominantRealImagePages          int  `json:"min_dominant_real_image_pages"`
	DominantImageMinAreaBP             int  `json:"dominant_image_min_area_bp"`
	RequireCoverDominantRealImage      bool `json:"require_cover_dominant_real_image"`
	MaxConsecutiveInfographicOnlyPages int  `json:"max_consecutive_infographic_only_pages"`
	MinUniqueRealImages                int  `json:"min_unique_real_images"`
}

func EvaluateMediaPressureRun(deck authorDeck, contract qualityVisualContract, imageUsage ImageUsageReport) MediaPressureReport {
	policy := resolveMediaPressurePolicy(deck, contract)
	report := MediaPressureReport{
		Status:  "passed",
		Metrics: MediaPressureMetrics{Slides: len(deck.Slides)},
		Issues:  []MediaPressureIssue{},
		Slides:  []MediaPressureSlide{},
		Policy:  policy,
	}
	usageBySlide := map[string]ImageUsageSlide{}
	uniqueImages := map[string]bool{}
	for _, slide := range imageUsage.Slides {
		usageBySlide[strings.TrimSpace(slide.SlideID)] = slide
		for _, asset := range slide.Assets {
			if strings.TrimSpace(asset.Path) != "" {
				uniqueImages[asset.Path] = true
			}
		}
	}
	report.Metrics.UniqueRealImages = len(uniqueImages)
	infographicRun := 0
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		usage := usageBySlide[id]
		stat := MediaPressureSlide{
			SlideID:    id,
			Path:       strings.TrimSpace(slide.Path),
			VisualRole: normalizedSlideVisualRole(slide),
		}
		for _, asset := range usage.Assets {
			stat.RealImageCount++
			if asset.AreaBP > stat.LargestImageAreaBP {
				stat.LargestImageAreaBP = asset.AreaBP
			}
		}
		if stat.RealImageCount > 0 {
			report.Metrics.RealImagePages++
		}
		stat.DominantRealImage = stat.LargestImageAreaBP >= policy.DominantImageMinAreaBP
		if stat.DominantRealImage {
			report.Metrics.DominantRealImagePages++
			if isCoverSlide(slide) {
				report.Metrics.CoverDominantRealImagePages++
			}
		}
		stat.InfographicOnly = !stat.DominantRealImage
		if stat.InfographicOnly {
			infographicRun++
			if infographicRun > report.Metrics.MaxConsecutiveInfographicPages {
				report.Metrics.MaxConsecutiveInfographicPages = infographicRun
			}
		} else {
			infographicRun = 0
		}
		report.Slides = append(report.Slides, stat)
	}
	addMediaPressureFailures(&report)
	if len(report.Issues) > 0 {
		report.Status = "failed"
		report.Metrics.IssueCount = len(report.Issues)
	}
	return report
}

func writeMediaPressureReport(safeRoot string, report MediaPressureReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, mediaPressureReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func resolveMediaPressurePolicy(deck authorDeck, contract qualityVisualContract) MediaPressurePolicy {
	policy := defaultMediaPressurePolicy(strings.TrimSpace(contract.TopicArchetype), len(deck.Slides))
	contractPolicy := contract.MediaPressure
	if contractPolicy.MinRealImagePages > 0 {
		policy.MinRealImagePages = contractPolicy.MinRealImagePages
	}
	if contractPolicy.MinDominantRealImagePages > 0 {
		policy.MinDominantRealImagePages = contractPolicy.MinDominantRealImagePages
	}
	if contractPolicy.DominantImageMinAreaBP > 0 {
		policy.DominantImageMinAreaBP = contractPolicy.DominantImageMinAreaBP
	}
	if contractPolicy.RequireCoverDominantRealImage {
		policy.RequireCoverDominantRealImage = true
	}
	if contractPolicy.MaxConsecutiveInfographicOnlyPages > 0 {
		policy.MaxConsecutiveInfographicOnlyPages = contractPolicy.MaxConsecutiveInfographicOnlyPages
	}
	if contractPolicy.MinUniqueRealImages > 0 {
		policy.MinUniqueRealImages = contractPolicy.MinUniqueRealImages
	}
	if policy.DominantImageMinAreaBP <= 0 {
		policy.DominantImageMinAreaBP = 3000
	}
	return policy
}

func defaultMediaPressurePolicy(archetype string, slides int) MediaPressurePolicy {
	policy := MediaPressurePolicy{
		TopicArchetype:         archetype,
		DominantImageMinAreaBP: 3000,
	}
	switch strings.TrimSpace(archetype) {
	case "financial_company_report", "named_company_report":
		policy.MinRealImagePages = minPositive(slides, 2)
		policy.MinDominantRealImagePages = minPositive(slides, 2)
		policy.RequireCoverDominantRealImage = true
		policy.MaxConsecutiveInfographicOnlyPages = 3
		policy.MinUniqueRealImages = minPositive(slides, 2)
	case "premium_product_brand", "brand_official_site":
		policy.MinRealImagePages = minPositive(slides, 4)
		policy.MinDominantRealImagePages = minPositive(slides, 4)
		policy.RequireCoverDominantRealImage = true
		policy.MaxConsecutiveInfographicOnlyPages = 2
		policy.MinUniqueRealImages = minPositive(slides, 3)
	case "sports_editorial", "event_editorial":
		policy.MinRealImagePages = minPositive(slides, 3)
		policy.MinDominantRealImagePages = minPositive(slides, 3)
		policy.RequireCoverDominantRealImage = true
		policy.MaxConsecutiveInfographicOnlyPages = 2
		policy.MinUniqueRealImages = minPositive(slides, 3)
	case "cultural_lifestyle_editorial", "food_beverage_culture":
		policy.MinRealImagePages = minPositive(slides, 4)
		policy.MinDominantRealImagePages = minPositive(slides, 3)
		policy.RequireCoverDominantRealImage = true
		policy.MaxConsecutiveInfographicOnlyPages = 2
		policy.MinUniqueRealImages = minPositive(slides, 4)
	}
	return policy
}

func addMediaPressureFailures(report *MediaPressureReport) {
	policy := report.Policy
	if policy.MinRealImagePages > 0 && report.Metrics.RealImagePages < policy.MinRealImagePages {
		addMediaPressureIssue(report, mediaPressureReportPath, "svglide.media_pressure.real_image_pages", fmt.Sprintf("media pressure requires at least %d real-image page(s), got %d", policy.MinRealImagePages, report.Metrics.RealImagePages))
	}
	if policy.MinDominantRealImagePages > 0 && report.Metrics.DominantRealImagePages < policy.MinDominantRealImagePages {
		addMediaPressureIssue(report, mediaPressureReportPath, "svglide.media_pressure.dominant_real_image_pages", fmt.Sprintf("media pressure requires at least %d dominant real-image page(s), got %d", policy.MinDominantRealImagePages, report.Metrics.DominantRealImagePages))
	}
	if policy.RequireCoverDominantRealImage && report.Metrics.CoverDominantRealImagePages == 0 {
		addMediaPressureIssue(report, "slides", "svglide.media_pressure.cover_dominant_real_image", "media pressure requires the cover to use a dominant real image")
	}
	if policy.MaxConsecutiveInfographicOnlyPages > 0 && report.Metrics.MaxConsecutiveInfographicPages > policy.MaxConsecutiveInfographicOnlyPages {
		addMediaPressureIssue(report, mediaPressureReportPath, "svglide.media_pressure.infographic_run", fmt.Sprintf("media pressure allows at most %d consecutive infographic-only page(s), got %d", policy.MaxConsecutiveInfographicOnlyPages, report.Metrics.MaxConsecutiveInfographicPages))
	}
	if policy.MinUniqueRealImages > 0 && report.Metrics.UniqueRealImages < policy.MinUniqueRealImages {
		addMediaPressureIssue(report, filepath.ToSlash(assetInventoryPath), "svglide.media_pressure.unique_real_images", fmt.Sprintf("media pressure requires at least %d unique real image(s), got %d", policy.MinUniqueRealImages, report.Metrics.UniqueRealImages))
	}
}

func addMediaPressureIssue(report *MediaPressureReport, path, code, message string) {
	report.Issues = append(report.Issues, MediaPressureIssue{
		Code:     code,
		Path:     path,
		Message:  message,
		Severity: "error",
	})
}

func minPositive(a, b int) int {
	if a <= 0 {
		return 0
	}
	if b <= 0 || a < b {
		return a
	}
	return b
}
