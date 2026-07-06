package svglide

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

const (
	visualReceiptsPath        = "visual_receipts.json"
	creativeQualityReportPath = "creative_quality_report.json"
)

type CreativeQualityReport struct {
	Status  string                 `json:"status"`
	Issues  []CreativeQualityIssue `json:"issues"`
	Metrics CreativeQualityMetrics `json:"metrics"`
}

type CreativeQualityIssue struct {
	Path     string `json:"path"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type CreativeQualityMetrics struct {
	Slides                        int `json:"slides"`
	VisualReceipts                int `json:"visual_receipts"`
	MissingVisualReceipts         int `json:"missing_visual_receipts"`
	ProcessLeakCount              int `json:"process_leak_count"`
	GenericFontSlideCount         int `json:"generic_font_slide_count"`
	TopicTypographyMismatchCount  int `json:"topic_typography_mismatch_count"`
	TypographyRoleCollapseCount   int `json:"typography_role_collapse_count"`
	DistinctLayoutFamilyCount     int `json:"distinct_layout_family_count"`
	DistinctLayoutArchetypeCount  int `json:"distinct_layout_archetype_count"`
	LayoutArchetypeMaxRatioBP     int `json:"layout_archetype_max_ratio_bp"`
	AdjacentLayoutArchetypeCount  int `json:"adjacent_layout_archetype_count"`
	LeftRightChartArchetypeCount  int `json:"left_right_chart_archetype_count"`
	LayoutSignatureMaxRatioBP     int `json:"layout_signature_max_ratio_bp"`
	AdjacentLayoutRepetitionCount int `json:"adjacent_layout_repetition_count"`
	CardDominantSlideCount        int `json:"card_dominant_slide_count"`
	DarkCardTemplateSlideCount    int `json:"dark_card_template_slide_count"`
	ShapeLanguageMaxRatioBP       int `json:"shape_language_max_ratio_bp"`
	DecorativeImageOnlyCount      int `json:"decorative_image_only_count"`
	WeakCoverVisualImpactCount    int `json:"weak_cover_visual_impact_count"`
	DefaultCardTextContainerCount int `json:"default_card_text_container_count"`
	OpenTextCarrierSlideCount     int `json:"open_text_carrier_slide_count"`
	FusionSlideCount              int `json:"fusion_slide_count"`
	FusionAdjacentCount           int `json:"fusion_adjacent_count"`
	WeakSlideCount                int `json:"weak_slide_count"`
	ChartWithoutEvidenceCount     int `json:"chart_without_evidence_count"`
	WarningCount                  int `json:"warning_count"`
}

type visualReceiptsFile struct {
	Slides []visualReceipt `json:"slides"`
}

type visualReceipt struct {
	SlideID                    string              `json:"slide_id"`
	StoryJob                   string              `json:"story_job"`
	LayoutFamily               string              `json:"layout_family"`
	LayoutArchetype            string              `json:"layout_archetype"`
	LayoutSignature            string              `json:"layout_signature"`
	ThumbnailJob               string              `json:"thumbnail_job"`
	VisualCenter               string              `json:"visual_center"`
	TopicFitClaim              string              `json:"topic_fit_claim"`
	InformationDensityPlan     string              `json:"information_density_plan"`
	PageDifferenceFromPrevious string              `json:"page_difference_from_previous"`
	PrimaryAsset               string              `json:"primary_asset"`
	AssetRole                  string              `json:"asset_role"`
	FontRoleUsage              map[string]string   `json:"font_role_usage"`
	TypographyRoleUsage        map[string]string   `json:"typography_role_usage"`
	CompositionIntent          string              `json:"composition_intent"`
	DataVisualRationale        string              `json:"data_visual_rationale"`
	SourceEvidence             []string            `json:"source_evidence"`
	ContainerFitPlan           string              `json:"container_fit_plan"`
	ContainerDecision          string              `json:"container_decision"`
	TextCarrier                string              `json:"text_carrier"`
	ShapeLanguage              string              `json:"shape_language"`
	CardBudget                 visualCardBudget    `json:"card_budget"`
	ChartReceipt               visualChartReceipt  `json:"chart_receipt"`
	FusionSpec                 visualFusionReceipt `json:"fusion_spec"`
	QAExpectations             []string            `json:"qa_expectations"`
}

type visualCardBudget struct {
	CardCount         int    `json:"card_count"`
	WhyCardsAreNeeded string `json:"why_cards_are_needed"`
}

type visualChartReceipt struct {
	ChartID          string `json:"chart_id"`
	Renderer         string `json:"renderer"`
	Unit             string `json:"unit"`
	Source           string `json:"source"`
	WhyChartIsNeeded string `json:"why_chart_is_needed"`
}

type visualFusionReceipt struct {
	Enabled       bool   `json:"enabled"`
	SeamSide      string `json:"seam_side"`
	SampledColor  string `json:"sampled_color"`
	PanelColor    string `json:"panel_color"`
	FadeWidth     int    `json:"fade_width"`
	SubjectSafety string `json:"subject_safety"`
}

func CheckCreativeQuality(root string) (CreativeQualityReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return CreativeQualityReport{}, err
	}
	deckPath := "outline/deck.json"
	deck, err := readAuthorDeck(safeRoot, deckPath)
	if err != nil {
		return CreativeQualityReport{}, err
	}
	mode := normalizedVisualQualityMode(run.VisualQualityMode)
	report := CreativeQualityReport{
		Status:  "passed",
		Issues:  []CreativeQualityIssue{},
		Metrics: CreativeQualityMetrics{Slides: len(deck.Slides)},
	}

	receipts, receiptErr := readVisualReceipts(safeRoot)
	if receiptErr != nil {
		addCreativeIssue(&report, mode, visualReceiptsPath, "svglide.creative.missing_visual_receipts", receiptErr.Error(), "error")
	}
	report.Metrics.VisualReceipts = len(receipts.Slides)
	receiptBySlide := make(map[string]visualReceipt, len(receipts.Slides))
	for _, receipt := range receipts.Slides {
		id := strings.TrimSpace(receipt.SlideID)
		if id != "" {
			receiptBySlide[id] = receipt
		}
	}

	if contract, present, contractErr := readTypographyContract(safeRoot); present {
		if contractErr != nil {
			addCreativeIssue(&report, mode, typographyContractPath, "svglide.typography.identity.invalid_contract", contractErr.Error(), "error")
		} else {
			deckType := strings.Join([]string{run.Title, run.Intent.Topic, deck.Title, contract.Profile}, " ")
			identity := evaluateTypographyIdentity(contract, deckType)
			if identity.GenericFallbackOnly {
				addCreativeIssue(&report, mode, typographyContractPath, "svglide.typography.identity.too_generic", "typography contract uses only generic/browser fallback font stacks", "error")
			}
			if identity.RepeatedDefaultStack {
				report.Metrics.TypographyRoleCollapseCount++
				addCreativeIssue(&report, mode, typographyContractPath, "svglide.typography.identity.role_collapse", "typography contract must keep display, body, and numeric/label roles distinct enough to carry visual identity", "error")
			}
			if identity.ProfileMismatch {
				report.Metrics.TopicTypographyMismatchCount++
				addCreativeIssue(&report, mode, typographyContractPath, "svglide.typography.identity.profile_mismatch", "typography contract does not match the deck topic/profile identity", "error")
			}
		}
	}

	familyCounts := make(map[string]int)
	archetypeCounts := make(map[string]int)
	layoutCounts := make(map[string]int)
	shapeLanguageCounts := make(map[string]int)
	var previousLayout string
	var previousArchetype string
	var previousFamily string
	var previousDarkCardTemplate bool
	for i, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		receipt, hasReceipt := receiptBySlide[id]
		if !hasReceipt {
			report.Metrics.MissingVisualReceipts++
			addCreativeIssue(&report, mode, visualReceiptsPath, "svglide.creative.missing_visual_receipt", fmt.Sprintf("slide %q has no visual receipt", id), "error")
		}
		layoutFamily := firstNonEmpty(slide.LayoutFamily, receipt.LayoutFamily)
		layoutArchetype := firstNonEmpty(slide.LayoutArchetype, receipt.LayoutArchetype, inferAuthorLayoutArchetype(layoutFamily, firstNonEmpty(slide.LayoutSignature, receipt.LayoutSignature)))
		layoutSignature := firstNonEmpty(slide.LayoutSignature, receipt.LayoutSignature)
		if strings.TrimSpace(layoutFamily) == "" || strings.TrimSpace(layoutSignature) == "" || strings.TrimSpace(layoutArchetype) == "" {
			addCreativeIssue(&report, mode, deckPath, "svglide.creative.missing_layout_fields", fmt.Sprintf("slide %q must declare layout_family, layout_archetype, and layout_signature", id), "error")
		}
		if layoutFamily != "" {
			familyCounts[layoutFamily]++
		}
		if layoutArchetype != "" {
			archetypeCounts[layoutArchetype]++
			if i > 0 && layoutArchetype == previousArchetype {
				report.Metrics.AdjacentLayoutArchetypeCount++
				addCreativeIssue(&report, mode, deckPath, "svglide.creative.adjacent_layout_archetype", fmt.Sprintf("slide %q repeats adjacent layout_archetype %q", id, layoutArchetype), "error")
			}
			if isLeftRightChartArchetype(layoutArchetype, layoutSignature, receipt) {
				report.Metrics.LeftRightChartArchetypeCount++
			}
			previousArchetype = layoutArchetype
		}
		if layoutSignature != "" {
			layoutCounts[layoutSignature]++
			if i > 0 && layoutSignature == previousLayout {
				report.Metrics.AdjacentLayoutRepetitionCount++
				addCreativeIssue(&report, mode, deckPath, "svglide.creative.adjacent_layout_repetition", fmt.Sprintf("slide %q repeats adjacent layout_signature %q", id, layoutSignature), "error")
			}
			previousLayout = layoutSignature
		}
		if layoutFamily == "image_text_fusion_split" {
			report.Metrics.FusionSlideCount++
			if i > 0 && previousFamily == "image_text_fusion_split" {
				report.Metrics.FusionAdjacentCount++
				addCreativeIssue(&report, mode, deckPath, "svglide.creative.adjacent_fusion", fmt.Sprintf("slide %q repeats image_text_fusion_split after another fusion slide", id), "error")
			}
			if hasReceipt {
				checkFusionReceipt(&report, mode, id, receipt)
			}
		}
		previousFamily = layoutFamily

		slidePath, err := previewSlideObjectPath(slide.Path)
		if err != nil {
			addCreativeIssue(&report, mode, deckPath, "svglide.creative.invalid_slide_path", err.Error(), "error")
			continue
		}
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.missing_slide_svg", err.Error(), "error")
			continue
		}
		svg := string(raw)
		shapeSummary := analyzeShapeLanguage(svg)
		shapeLanguage := firstNonEmpty(receipt.ShapeLanguage, shapeLanguageSignature(shapeSummary, receipt))
		if shapeLanguage != "" {
			shapeLanguageCounts[shapeLanguage]++
		}
		if isCardDominantSlide(shapeSummary) {
			report.Metrics.CardDominantSlideCount++
		}
		darkCardTemplate := isDarkCardTemplateSlide(shapeSummary)
		if darkCardTemplate {
			report.Metrics.DarkCardTemplateSlideCount++
			if previousDarkCardTemplate {
				addCreativeIssue(&report, mode, slidePath, "svglide.creative.dark_card_template_repetition", fmt.Sprintf("slide %q repeats the adjacent dark rounded-card template", id), "error")
			}
		}
		previousDarkCardTemplate = darkCardTemplate
		textCarrier := classifyTextCarrier(svg, receipt)
		if isOpenTextCarrier(textCarrier) {
			report.Metrics.OpenTextCarrierSlideCount++
		}
		if hasReceipt && isDefaultCardTextContainer(shapeSummary, textCarrier, receipt) {
			report.Metrics.DefaultCardTextContainerCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.default_card_text_container", fmt.Sprintf("slide %q uses rounded cards as the default text container without a content reason", id), "error")
		}
		if hasReceipt && isDecorativeImageOnlySlide(svg, receipt) {
			report.Metrics.DecorativeImageOnlyCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.decorative_image_only", fmt.Sprintf("slide %q uses imagery as decoration rather than a topic visual", id), "error")
		}
		if hasReceipt && isCoverSlide(slide) && !hasStrongCoverVisualImpact(svg, receipt) {
			report.Metrics.WeakCoverVisualImpactCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.weak_cover_visual_impact", fmt.Sprintf("slide %q cover lacks a strong topic-specific visual", id), "error")
		}
		leaks := countCreativeProcessLeaks(svg)
		if leaks > 0 {
			report.Metrics.ProcessLeakCount += leaks
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.process_leak", fmt.Sprintf("slide %q exposes process/source/prompt language in visible text", id), "error")
		}
		if svgHasGenericFontProblem(svg) {
			report.Metrics.GenericFontSlideCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.generic_fonts", fmt.Sprintf("slide %q uses generic/browser font roles instead of concrete deck typography", id), "error")
		}
		if hasReceipt && isWeakCreativeSlide(svg, receipt, layoutFamily) {
			report.Metrics.WeakSlideCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.weak_slide", fmt.Sprintf("slide %q lacks enough visual center, topic fit, differentiation, or information density", id), "error")
		}
		if hasDataVisualIntent(svg, layoutFamily, receipt) && !hasNumericSourceEvidence(receipt) {
			report.Metrics.ChartWithoutEvidenceCount++
			addCreativeIssue(&report, mode, slidePath, "svglide.creative.chart_without_evidence", fmt.Sprintf("slide %q uses data/chart visual language without numeric source_evidence", id), "error")
		}
	}

	report.Metrics.DistinctLayoutFamilyCount = len(familyCounts)
	report.Metrics.DistinctLayoutArchetypeCount = len(archetypeCounts)
	report.Metrics.LayoutArchetypeMaxRatioBP = maxLayoutSignatureRatioBP(archetypeCounts, len(deck.Slides))
	report.Metrics.LayoutSignatureMaxRatioBP = maxLayoutSignatureRatioBP(layoutCounts, len(deck.Slides))
	report.Metrics.ShapeLanguageMaxRatioBP = maxLayoutSignatureRatioBP(shapeLanguageCounts, len(deck.Slides))
	if len(deck.Slides) >= 8 && report.Metrics.DistinctLayoutArchetypeCount < minDistinctLayoutArchetypes(len(deck.Slides)) {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.layout_archetype_diversity", fmt.Sprintf("deck has %d distinct layout_archetype values, want >= %d", report.Metrics.DistinctLayoutArchetypeCount, minDistinctLayoutArchetypes(len(deck.Slides))), "error")
	}
	if len(deck.Slides) >= 5 && report.Metrics.LayoutArchetypeMaxRatioBP > maxArchetypeRatioBP(len(deck.Slides)) {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.layout_archetype_overuse", fmt.Sprintf("most common layout_archetype ratio is %d bp, want <= %d bp", report.Metrics.LayoutArchetypeMaxRatioBP, maxArchetypeRatioBP(len(deck.Slides))), "error")
	}
	if report.Metrics.LeftRightChartArchetypeCount > maxLeftRightChartArchetypes(len(deck.Slides)) {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.left_right_chart_overuse", fmt.Sprintf("left/right chart archetype count is %d, want <= %d", report.Metrics.LeftRightChartArchetypeCount, maxLeftRightChartArchetypes(len(deck.Slides))), "error")
	}
	if len(deck.Slides) >= 8 && report.Metrics.LayoutSignatureMaxRatioBP > 3000 {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.layout_overuse", fmt.Sprintf("most common layout_signature ratio is %d bp, want <= 3000 bp", report.Metrics.LayoutSignatureMaxRatioBP), "error")
	}
	if limit := maxFusionSlides(len(deck.Slides)); report.Metrics.FusionSlideCount > limit {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.fusion_overuse", fmt.Sprintf("image_text_fusion_split count is %d, want <= %d", report.Metrics.FusionSlideCount, limit), "error")
	}
	if len(deck.Slides) >= 8 && report.Metrics.CardDominantSlideCount*10000/len(deck.Slides) > 3500 {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.card_dominant_overuse", fmt.Sprintf("card-dominant slide ratio is %d bp, want <= 3500 bp", report.Metrics.CardDominantSlideCount*10000/len(deck.Slides)), "error")
	}
	if len(deck.Slides) >= 8 && report.Metrics.OpenTextCarrierSlideCount*10000/len(deck.Slides) < 4000 {
		addCreativeIssue(&report, mode, deckPath, "svglide.creative.open_text_carrier_underuse", fmt.Sprintf("open text carrier ratio is %d bp, want >= 4000 bp", report.Metrics.OpenTextCarrierSlideCount*10000/len(deck.Slides)), "error")
	}

	for _, issue := range report.Issues {
		if issue.Severity == "warning" {
			report.Metrics.WarningCount++
		}
		if issue.Severity == "error" {
			report.Status = "failed"
		}
	}
	return report, nil
}

func readVisualReceipts(safeRoot string) (visualReceiptsFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, visualReceiptsPath)
	if err != nil {
		return visualReceiptsFile{}, fmt.Errorf("%s: read artifact: %w", visualReceiptsPath, err)
	}
	var receipts visualReceiptsFile
	if err := json.Unmarshal(raw, &receipts); err != nil {
		return visualReceiptsFile{}, fmt.Errorf("%s: invalid JSON: %w", visualReceiptsPath, err)
	}
	return receipts, nil
}

func addCreativeIssue(report *CreativeQualityReport, mode, path, code, message, severity string) {
	severity = strings.TrimSpace(severity)
	if severity == "" {
		severity = "error"
	}
	if mode == VisualQualityModeWarn && severity == "error" {
		severity = "warning"
	}
	report.Issues = append(report.Issues, CreativeQualityIssue{
		Path:     path,
		Code:     code,
		Message:  message,
		Severity: severity,
	})
}

func normalizedVisualQualityMode(value string) string {
	switch strings.TrimSpace(value) {
	case VisualQualityModeWarn:
		return VisualQualityModeWarn
	default:
		return VisualQualityModeStrict
	}
}

func checkFusionReceipt(report *CreativeQualityReport, mode, slideID string, receipt visualReceipt) {
	if !receipt.FusionSpec.Enabled {
		addCreativeIssue(report, mode, visualReceiptsPath, "svglide.creative.fusion_missing_spec", fmt.Sprintf("slide %q uses image_text_fusion_split but fusion_spec.enabled is false", slideID), "error")
		return
	}
	if strings.TrimSpace(receipt.FusionSpec.SeamSide) == "" || strings.TrimSpace(receipt.FusionSpec.SampledColor) == "" || strings.TrimSpace(receipt.FusionSpec.PanelColor) == "" {
		addCreativeIssue(report, mode, visualReceiptsPath, "svglide.creative.fusion_missing_spec", fmt.Sprintf("slide %q fusion_spec must include seam_side, sampled_color, and panel_color", slideID), "error")
	}
	if receipt.FusionSpec.FadeWidth < 80 || receipt.FusionSpec.FadeWidth > 180 {
		addCreativeIssue(report, mode, visualReceiptsPath, "svglide.creative.fusion_bad_fade", fmt.Sprintf("slide %q fusion fade_width must be 80-180 px, got %d", slideID, receipt.FusionSpec.FadeWidth), "error")
	}
	if strings.TrimSpace(receipt.FusionSpec.SubjectSafety) == "" {
		addCreativeIssue(report, mode, visualReceiptsPath, "svglide.creative.subject_safety_warning", fmt.Sprintf("slide %q fusion_spec lacks subject safety judgment", slideID), "warning")
	}
	if ok, delta := CheckSeamDelta(receipt.FusionSpec.SampledColor, receipt.FusionSpec.PanelColor); !ok {
		addCreativeIssue(report, mode, visualReceiptsPath, "svglide.creative.fusion_seam_delta", fmt.Sprintf("slide %q seam color delta is %d, want <= 45", slideID, delta), "warning")
	}
}

func maxFusionSlides(slides int) int {
	if slides <= 0 {
		return 0
	}
	limit := slides * 30 / 100
	if limit < 1 {
		limit = 1
	}
	if limit > 3 {
		limit = 3
	}
	return limit
}

func isLeftRightChartArchetype(archetype string, signature string, receipt visualReceipt) bool {
	value := strings.ToLower(strings.TrimSpace(archetype + " " + signature + " " + receipt.CompositionIntent))
	if strings.Contains(value, "left_text_right_chart") {
		return true
	}
	if strings.Contains(value, "left text right chart") {
		return true
	}
	return strings.Contains(value, "split") && strings.Contains(value, "chart")
}

func minDistinctLayoutArchetypes(slides int) int {
	switch {
	case slides >= 8:
		return 5
	case slides >= 5:
		return 3
	case slides >= 3:
		return 2
	default:
		return 1
	}
}

func maxArchetypeRatioBP(slides int) int {
	if slides >= 8 {
		return 2500
	}
	return 5000
}

func maxLeftRightChartArchetypes(slides int) int {
	if slides >= 8 {
		return 2
	}
	return 1
}

func countCreativeProcessLeaks(svg string) int {
	visible := strings.ToLower(visibleSemanticText(svg))
	count := 0
	for _, marker := range []string{
		"sources:",
		"source note",
		"prompt",
		"slide:note",
		"production_instruction",
		"素材说明",
		"制作说明",
		"接缝",
		"取色",
		"渐变遮罩",
		"source ref",
	} {
		count += strings.Count(visible, strings.ToLower(marker))
	}
	return count
}

var fontRolePattern = regexp.MustCompile(`--font-(display|body|number|label)\s*:\s*([^;"}]+)`)

func svgHasGenericFontProblem(svg string) bool {
	matches := fontRolePattern.FindAllStringSubmatch(svg, -1)
	if len(matches) == 0 {
		return false
	}
	roles := make(map[string]bool)
	genericRoles := 0
	for _, match := range matches {
		if len(match) != 3 {
			continue
		}
		role := strings.TrimSpace(match[1])
		if roles[role] {
			continue
		}
		roles[role] = true
		if isGenericOrBrowserFontStack(match[2]) {
			genericRoles++
		}
	}
	if len(roles) >= 4 && genericRoles == len(roles) {
		return true
	}
	visible := visibleSemanticText(svg)
	if containsCJK(visible) && !hasConcreteCJKFont(svg) {
		return true
	}
	return false
}

func isGenericOrBrowserFontStack(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.Trim(value, `"'`)
	for _, token := range []string{",", " "} {
		value = strings.ReplaceAll(value, token, "")
	}
	if value == "" {
		return true
	}
	for _, concrete := range []string{"inter", "roboto", "georgia", "avenir", "sfpro", "noto", "sourcehan", "pingfang", "hiragino", "microsoftyahei", "songtisc"} {
		if strings.Contains(value, concrete) {
			return false
		}
	}
	for _, generic := range []string{"arial", "helvetica", "sans-serif", "serif", "system-ui", "ui-sans-serif"} {
		value = strings.ReplaceAll(value, generic, "")
	}
	return value == ""
}

func containsCJK(text string) bool {
	for _, r := range text {
		if (r >= 0x4e00 && r <= 0x9fff) || (r >= 0x3400 && r <= 0x4dbf) {
			return true
		}
	}
	return false
}

func hasConcreteCJKFont(svg string) bool {
	lower := strings.ToLower(svg)
	for _, token := range []string{
		"noto sans cjk", "noto serif cjk", "source han sans", "source han serif",
		"pingfang", "hiragino sans gb", "microsoft yahei", "songti sc",
		"思源黑体", "思源宋体", "微软雅黑", "黑体", "宋体",
	} {
		if strings.Contains(lower, strings.ToLower(token)) {
			return true
		}
	}
	return false
}

func isWeakCreativeSlide(svg string, receipt visualReceipt, layoutFamily string) bool {
	score := 0
	if strings.TrimSpace(receipt.VisualCenter) == "" {
		score++
	}
	if strings.TrimSpace(receipt.TopicFitClaim) == "" {
		score++
	}
	if weakReceiptText(receipt.InformationDensityPlan) {
		score++
	}
	if weakReceiptText(receipt.PageDifferenceFromPrevious) {
		score++
	}
	if countSVGImageElements(svg) == 0 && !hasDataVisualIntent(svg, layoutFamily, receipt) {
		score++
	}
	if countRoundedTextPanels(svg) >= 3 && countSVGImageElements(svg) == 0 {
		score++
	}
	return score >= 3
}

func weakReceiptText(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return true
	}
	for _, marker := range []string{"same", "similar", "tbd", "none", "无", "同上", "相同"} {
		if value == marker || strings.Contains(value, marker) {
			return true
		}
	}
	return false
}

var roundedRectPattern = regexp.MustCompile(`(?is)<rect\b[^>]*(\brx\s*=|\bry\s*=)`)
var svgRectTagForCreativePattern = regexp.MustCompile(`(?is)<rect\b[^>]*>`)
var svgTextBlockForCreativePattern = regexp.MustCompile(`(?is)<(?:text|foreignObject)\b`)
var svgFillForCreativePattern = regexp.MustCompile(`(?i)\bfill\s*=\s*"([^"]+)"`)
var svgStrokeForCreativePattern = regexp.MustCompile(`(?i)\bstroke\s*=\s*"([^"]+)"`)

type shapeLanguageSummary struct {
	RectCount          int
	RoundedCardCount   int
	LargePanelCount    int
	DarkFillCount      int
	StrokePanelCount   int
	ImageCount         int
	ImageAreaBP        int
	LargestImageAreaBP int
	TextBlockCount     int
}

type textCarrierKind string

const (
	textCarrierOpenGrid       textCarrierKind = "open_grid"
	textCarrierImageDarkZone  textCarrierKind = "image_dark_zone"
	textCarrierLineAnnotation textCarrierKind = "line_annotation"
	textCarrierAxisAnnotation textCarrierKind = "axis_annotation"
	textCarrierCardGroup      textCarrierKind = "card_group"
	textCarrierMetricPanel    textCarrierKind = "metric_panel"
)

func countRoundedTextPanels(svg string) int {
	return len(roundedRectPattern.FindAllStringIndex(svg, -1))
}

func analyzeShapeLanguage(svg string) shapeLanguageSummary {
	width, height := svgViewBoxSize(svg)
	if width <= 0 {
		width = defaultSlideWidth
	}
	if height <= 0 {
		height = defaultSlideHeight
	}
	canvasArea := width * height
	if canvasArea <= 0 {
		canvasArea = defaultSlideWidth * defaultSlideHeight
	}
	summary := shapeLanguageSummary{
		ImageCount:     countSVGImageElements(svg),
		TextBlockCount: len(svgTextBlockForCreativePattern.FindAllStringIndex(svg, -1)),
	}
	for _, tag := range svgRectTagForCreativePattern.FindAllString(svg, -1) {
		summary.RectCount++
		attrs := svgNumericAttrs(tag)
		areaBP := creativeAreaBP(attrs["width"], attrs["height"], canvasArea)
		isBackground := areaBP >= 9000 && attrs["x"] <= 1 && attrs["y"] <= 1
		if !isBackground && rectTagHasRoundedCorners(tag) && areaBP >= 300 {
			summary.RoundedCardCount++
		}
		if !isBackground && areaBP >= 1200 {
			summary.LargePanelCount++
		}
		if !isBackground && isDarkCreativeFill(rectCreativeAttr(tag, svgFillForCreativePattern)) {
			summary.DarkFillCount++
		}
		if !isBackground && rectCreativeAttr(tag, svgStrokeForCreativePattern) != "" {
			summary.StrokePanelCount++
		}
	}
	for _, tag := range svgImageTagPattern.FindAllString(svg, -1) {
		attrs := svgNumericAttrs(tag)
		areaBP := creativeAreaBP(attrs["width"], attrs["height"], canvasArea)
		summary.ImageAreaBP += areaBP
		if areaBP > summary.LargestImageAreaBP {
			summary.LargestImageAreaBP = areaBP
		}
	}
	if summary.ImageAreaBP > 10000 {
		summary.ImageAreaBP = 10000
	}
	return summary
}

func isCardDominantSlide(summary shapeLanguageSummary) bool {
	if summary.TextBlockCount == 0 {
		return false
	}
	if summary.RoundedCardCount >= 3 && summary.ImageCount == 0 {
		return true
	}
	return summary.RoundedCardCount >= 2 && summary.LargePanelCount >= 2 && summary.ImageAreaBP < 2000
}

func isDarkCardTemplateSlide(summary shapeLanguageSummary) bool {
	return summary.RoundedCardCount >= 2 && summary.DarkFillCount >= 2 && summary.TextBlockCount > 0
}

func isDecorativeImageOnlySlide(svg string, receipt visualReceipt) bool {
	if countSVGImageElements(svg) == 0 {
		return false
	}
	summary := analyzeShapeLanguage(svg)
	if summary.LargestImageAreaBP >= 1000 {
		return false
	}
	return containsAny(strings.ToLower(strings.Join([]string{receipt.AssetRole, receipt.CompositionIntent}, " ")), []string{"decorative", "ornament", "texture", "background", "装饰", "纹理"})
}

func hasStrongCoverVisualImpact(svg string, receipt visualReceipt) bool {
	if !receiptRequiresStrongCoverVisual(receipt) {
		return true
	}
	if strings.TrimSpace(receipt.PrimaryAsset+receipt.AssetRole) == "" {
		return true
	}
	if hasFullBleedImage(svg) {
		return true
	}
	summary := analyzeShapeLanguage(svg)
	return summary.LargestImageAreaBP >= 4500
}

func receiptRequiresStrongCoverVisual(receipt visualReceipt) bool {
	haystack := strings.ToLower(strings.Join([]string{
		receipt.LayoutFamily,
		receipt.LayoutArchetype,
		receipt.LayoutSignature,
		receipt.ShapeLanguage,
		receipt.ContainerDecision,
		receipt.CompositionIntent,
		receipt.AssetRole,
		strings.Join(receipt.QAExpectations, " "),
	}, " "))
	return containsAny(haystack, []string{
		"full_bleed", "full-bleed", "hero_cover", "cover hero", "strong cover", "strong visual",
		"主视觉", "强视觉", "封面大图", "全屏图", "封面主视觉",
	})
}

func classifyTextCarrier(svg string, receipt visualReceipt) textCarrierKind {
	if carrier := parseReceiptTextCarrier(receipt.TextCarrier); carrier != "" {
		return carrier
	}
	shape := analyzeShapeLanguage(svg)
	haystack := strings.ToLower(strings.Join([]string{receipt.ContainerDecision, receipt.CompositionIntent, receipt.LayoutFamily, receipt.LayoutArchetype, receipt.LayoutSignature}, " "))
	switch {
	case containsAny(haystack, []string{"axis", "annotation", "坐标"}):
		return textCarrierAxisAnnotation
	case containsAny(haystack, []string{"line annotation", "callout", "rule", "标注", "引线"}):
		return textCarrierLineAnnotation
	case containsAny(haystack, []string{"metric", "scoreboard", "kpi", "指标"}):
		return textCarrierMetricPanel
	case shape.RoundedCardCount > 0 && shape.TextBlockCount > 0:
		return textCarrierCardGroup
	case shape.ImageCount > 0 && shape.DarkFillCount > 0:
		return textCarrierImageDarkZone
	default:
		return textCarrierOpenGrid
	}
}

func parseReceiptTextCarrier(value string) textCarrierKind {
	switch textCarrierKind(strings.TrimSpace(value)) {
	case textCarrierOpenGrid, textCarrierImageDarkZone, textCarrierLineAnnotation, textCarrierAxisAnnotation, textCarrierCardGroup, textCarrierMetricPanel:
		return textCarrierKind(strings.TrimSpace(value))
	default:
		return ""
	}
}

func isOpenTextCarrier(kind textCarrierKind) bool {
	switch kind {
	case textCarrierOpenGrid, textCarrierImageDarkZone, textCarrierLineAnnotation, textCarrierAxisAnnotation:
		return true
	default:
		return false
	}
}

func isDefaultCardTextContainer(summary shapeLanguageSummary, carrier textCarrierKind, receipt visualReceipt) bool {
	if carrier != textCarrierCardGroup || summary.RoundedCardCount == 0 || summary.TextBlockCount == 0 {
		return false
	}
	if receiptJustifiesCards(receipt) {
		return false
	}
	if summary.ImageAreaBP >= 2500 || hasDataVisualIntent("", receipt.LayoutFamily, receipt) {
		return false
	}
	return true
}

func receiptJustifiesCards(receipt visualReceipt) bool {
	if receipt.CardBudget.CardCount > 0 && strings.TrimSpace(receipt.CardBudget.WhyCardsAreNeeded) != "" {
		return true
	}
	haystack := strings.ToLower(strings.Join([]string{
		receipt.ContainerDecision,
		receipt.CompositionIntent,
		receipt.InformationDensityPlan,
		receipt.DataVisualRationale,
		receipt.AssetRole,
	}, " "))
	return containsAny(haystack, []string{
		"comparison", "compare", "metric", "kpi", "scoreboard", "quote", "control", "panel", "table", "chart", "group",
		"比较", "对比", "指标", "引用", "面板", "表格", "图表", "分组", "复杂背景", "background complexity",
	})
}

func shapeLanguageSignature(summary shapeLanguageSummary, receipt visualReceipt) string {
	switch {
	case strings.TrimSpace(receipt.ShapeLanguage) != "":
		return strings.TrimSpace(receipt.ShapeLanguage)
	case summary.ImageAreaBP >= 4500:
		return "image_forward"
	case summary.RoundedCardCount >= 3:
		return "card_grid"
	case summary.RoundedCardCount > 0:
		return "card_text_panel"
	case hasDataVisualIntent("", receipt.LayoutFamily, receipt):
		return "chart_forward"
	case summary.StrokePanelCount > 0:
		return "rule_annotation"
	default:
		return "open_text"
	}
}

func rectTagHasRoundedCorners(tag string) bool {
	return roundedRectPattern.MatchString(tag)
}

func rectCreativeAttr(tag string, pattern *regexp.Regexp) string {
	match := pattern.FindStringSubmatch(tag)
	if len(match) != 2 {
		return ""
	}
	return strings.TrimSpace(match[1])
}

func creativeAreaBP(width float64, height float64, canvasArea float64) int {
	if width <= 0 || height <= 0 || canvasArea <= 0 {
		return 0
	}
	return int(width * height * 10000 / canvasArea)
}

func isDarkCreativeFill(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" || value == "none" || strings.HasPrefix(value, "url(") {
		return false
	}
	switch value {
	case "black", "#000", "#000000", "#111", "#111111", "#101010", "#101319":
		return true
	}
	if strings.HasPrefix(value, "#") {
		hex := strings.TrimPrefix(value, "#")
		if len(hex) == 3 {
			hex = strings.Repeat(hex[0:1], 2) + strings.Repeat(hex[1:2], 2) + strings.Repeat(hex[2:3], 2)
		}
		if len(hex) != 6 {
			return false
		}
		r := parseHexByte(hex[0:2])
		g := parseHexByte(hex[2:4])
		b := parseHexByte(hex[4:6])
		return r+g+b < 180
	}
	return strings.Contains(value, "rgb(0") || strings.Contains(value, "rgb(16") || strings.Contains(value, "rgb(17")
}

func parseHexByte(value string) int {
	out := 0
	for _, r := range value {
		out *= 16
		switch {
		case r >= '0' && r <= '9':
			out += int(r - '0')
		case r >= 'a' && r <= 'f':
			out += int(r-'a') + 10
		case r >= 'A' && r <= 'F':
			out += int(r-'A') + 10
		default:
			return 255
		}
	}
	return out
}

func hasDataVisualIntent(svg string, layoutFamily string, receipt visualReceipt) bool {
	if strings.TrimSpace(layoutFamily) == "data_scoreboard" {
		return true
	}
	if strings.TrimSpace(receipt.DataVisualRationale) != "" {
		return true
	}
	lower := strings.ToLower(svg)
	for _, marker := range []string{"chart", "axis", "bar", "line-chart", "vega", "data-score", "scoreboard"} {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
}

func hasNumericSourceEvidence(receipt visualReceipt) bool {
	if containsDigit(receipt.DataVisualRationale) {
		return true
	}
	for _, value := range receipt.SourceEvidence {
		if containsDigit(value) {
			return true
		}
	}
	return false
}

func containsDigit(value string) bool {
	for _, r := range value {
		if r >= '0' && r <= '9' {
			return true
		}
	}
	return false
}

func writeCreativeQualityReport(safeRoot string, report CreativeQualityReport) error {
	return writeJSON(filepath.Join(safeRoot, creativeQualityReportPath), report)
}
