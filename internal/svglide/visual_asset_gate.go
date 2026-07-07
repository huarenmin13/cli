package svglide

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

type VisualAssetGateInput struct {
	RequestText             string
	EntityKind              string
	Slides                  int
	RealImageAssets         int
	OfficialImageAssets     int
	SlidesWithRealImages    int
	CoverRealHeroImage      bool
	NoImageReason           string
	ExplicitChartOnly       bool
	ThemeRequiresRealImages bool
}

type VisualAssetGateResult struct {
	Status                string             `json:"status"`
	Required              bool               `json:"required"`
	CoverRealHeroRequired bool               `json:"cover_real_hero_required"`
	CoverRealHeroPresent  bool               `json:"cover_real_hero_present"`
	IssueCount            int                `json:"issue_count"`
	Issues                []VisualAssetIssue `json:"issues"`
}

type VisualAssetIssue struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func EvaluateVisualAssetGate(input VisualAssetGateInput) VisualAssetGateResult {
	required := visualAssetRequired(input)
	result := VisualAssetGateResult{
		Status:                "passed",
		Required:              required,
		CoverRealHeroRequired: required,
		CoverRealHeroPresent:  input.CoverRealHeroImage,
		Issues:                []VisualAssetIssue{},
	}
	if !required {
		return result
	}
	if input.RealImageAssets == 0 || input.SlidesWithRealImages == 0 {
		result.Issues = append(result.Issues, VisualAssetIssue{
			Code:    "svglide.visual_asset.real_image_missing",
			Message: "entity-driven deck requires at least one real image asset; charts and typography are not enough",
		})
	}
	if strings.TrimSpace(input.NoImageReason) != "" && invalidRealImageNoImageReason(input.NoImageReason) {
		result.Issues = append(result.Issues, VisualAssetIssue{
			Code:    "svglide.visual_asset.no_image_reason_invalid",
			Message: "no_image_reason cannot override required real/evidence imagery; provide searched evidence assets or mark the run blocked",
		})
	}
	if !input.CoverRealHeroImage {
		result.Issues = append(result.Issues, VisualAssetIssue{
			Code:    "svglide.visual_asset.cover_real_hero_missing",
			Message: "entity-driven deck requires a real cover hero image or strong subject visual",
		})
	}
	if len(result.Issues) > 0 {
		result.Status = "failed"
		result.IssueCount = len(result.Issues)
	}
	return result
}

func visualAssetRequired(input VisualAssetGateInput) bool {
	if input.ThemeRequiresRealImages {
		return true
	}
	if input.ExplicitChartOnly {
		return false
	}
	kind := strings.ToLower(strings.TrimSpace(input.EntityKind))
	switch kind {
	case "company", "brand", "product", "person", "place", "location", "team", "event", "film", "book", "paper", "technical_paper", "technical_paper_topic", "research_report":
		return true
	}
	text := strings.ToLower(input.RequestText)
	for _, hint := range []string{
		"financial report for ", "nvidia", "apple", "leica", "kaneko", "world cup", "olympic",
		"公司", "品牌", "产品", "球队", "队", "球员", "城市", "地点", "电影", "论文", "深度解析", "研究报告",
		"company", "brand", "product", "team", "player", "city", "museum", "restaurant", "paper", "technical report", "arxiv", "deep dive", "research report",
	} {
		if strings.Contains(text, hint) {
			return true
		}
	}
	return false
}

func invalidRealImageNoImageReason(reason string) bool {
	reason = strings.ToLower(strings.TrimSpace(reason))
	if reason == "" {
		return false
	}
	return !containsAny(reason, []string{"explicit_vector_only", "user_requested_no_images", "用户明确要求不要图片", "纯向量", "不要图片", "no images", "no photos", "vector-only", "chart-only"})
}

func qualityRequestText(root string) string {
	var req struct {
		Title  string `json:"title"`
		Input  string `json:"input"`
		Topic  string `json:"topic"`
		Prompt string `json:"prompt"`
	}
	_ = readJSONIfExists(filepath.Join(root, "request", "request.json"), &req)
	text := strings.TrimSpace(strings.Join([]string{req.Title, req.Input, req.Topic, req.Prompt}, " "))
	if text != "" {
		return text
	}
	_, run, err := readRun(root)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(strings.Join([]string{run.Title, run.Input, run.Intent.Topic, run.Intent.Input}, " "))
}

func qualityEntityKind(root string) string {
	entity := readQualityEntityResolution(root)
	if value := strings.TrimSpace(entity.ResolvedEntity.Type); value != "" {
		return value
	}
	var raw struct {
		Kind string `json:"kind"`
		Type string `json:"type"`
	}
	_ = readJSONIfExists(filepath.Join(root, "request", "entity_resolution.json"), &raw)
	if raw.Kind != "" {
		return raw.Kind
	}
	return raw.Type
}

func qualityNoImageReason(root string) string {
	var plan struct {
		NoImageReason string `json:"no_image_reason"`
	}
	_ = readJSONIfExists(filepath.Join(root, assetsPlanPath), &plan)
	if strings.TrimSpace(plan.NoImageReason) != "" {
		return plan.NoImageReason
	}
	assets, err := readDeckAssetsArtifact(root, assetsManifestPath)
	if err != nil {
		return ""
	}
	return assets.NoImageReason
}

func qualityRequestExplicitChartOnly(root string) bool {
	text := strings.ToLower(strings.Join([]string{qualityRequestText(root), qualityNoImageReason(root)}, " "))
	return strings.Contains(text, "chart-only") ||
		strings.Contains(text, "vector-only") ||
		strings.Contains(text, "no photos") ||
		strings.Contains(text, "no raster") ||
		strings.Contains(text, "仅图表") ||
		strings.Contains(text, "不要图片")
}

func qualityThemeRequiresRealImages(root string) bool {
	theme, present, err := readThemeContract(root)
	return present && err == nil && themeContractEnforcesQuality(theme) && theme.ThemeContract.AssetNeeds.RequiresRealImages
}

func qualityDeliveryRequiresRealImages(root string) bool {
	_, run, err := readRun(root)
	if err != nil {
		return false
	}
	contract, _, err := readDeliveryContract(root, run)
	return err == nil && contract.RequiresRealImages
}

func readJSONIfExists(path string, dst any) error {
	raw, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, dst)
}

func visualAssetIssuesContain(issues []VisualAssetIssue, code string) bool {
	for _, issue := range issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}
