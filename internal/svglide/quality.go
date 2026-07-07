package svglide

import (
	"encoding/json"
	"fmt"
	"net/url"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type QualityReport struct {
	Status         string                `json:"status"`
	Issues         []QualityIssue        `json:"issues"`
	Metrics        QualityMetrics        `json:"metrics"`
	ContentPayload *ContentPayloadReport `json:"content_payload,omitempty"`
}

type QualityIssue struct {
	Path     string `json:"path"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type QualityMetrics struct {
	Slides                                   int  `json:"slides"`
	Sources                                  int  `json:"sources"`
	WebSources                               int  `json:"web_sources"`
	Assets                                   int  `json:"assets"`
	SlidesWithSourceRef                      int  `json:"slides_with_source_refs"`
	SlidesWithVisuals                        int  `json:"slides_with_visuals"`
	SlidesWithImageAssets                    int  `json:"slides_with_image_assets"`
	ImageCoverageBP                          int  `json:"image_coverage_bp"`
	UniqueImageAssets                        int  `json:"unique_image_assets"`
	OfficialImageAssets                      int  `json:"official_image_assets"`
	RealImageAssets                          int  `json:"real_image_assets"`
	SlidesWithRealImageAssets                int  `json:"slides_with_real_image_assets"`
	GeneratedSVGAssets                       int  `json:"generated_svg_assets"`
	ChartSVGAssets                           int  `json:"chart_svg_assets"`
	VegaLiteSpecAssets                       int  `json:"vega_lite_spec_assets"`
	PreviewWrapperImageCount                 int  `json:"preview_wrapper_image_count"`
	CoverRealHeroImage                       bool `json:"cover_real_hero_image"`
	TypographyContractPresent                bool `json:"typography_contract_present"`
	TotalImageRefs                           int  `json:"total_image_refs"`
	StrongCover                              bool `json:"strong_cover"`
	EvidencePageMaxVisuals                   int  `json:"evidence_page_max_visuals"`
	RepeatedLayoutRatioBP                    int  `json:"repeated_layout_ratio_bp"`
	VisualRoleCoverageBP                     int  `json:"visual_role_coverage_bp"`
	RenderedVisualIssueCount                 int  `json:"rendered_visual_issue_count"`
	RenderedVisualTextOverflowCount          int  `json:"rendered_visual_text_overflow_count"`
	RenderedVisualTextCollisionCount         int  `json:"rendered_visual_text_collision_count"`
	RenderedVisualOutOfCanvasCount           int  `json:"rendered_visual_out_of_canvas_count"`
	RenderedVisualContainerTextOverflowCount int  `json:"rendered_visual_container_text_overflow_count"`
	RenderedVisualContainerPaddingRiskCount  int  `json:"rendered_visual_container_padding_risk_count"`
	RenderedVisualForeignObjectOverlapCount  int  `json:"rendered_visual_foreign_object_overlap_count"`
	RenderedVisualTightLineHeightCount       int  `json:"rendered_visual_tight_line_height_count"`
	RenderedVisualBoldOveruseCount           int  `json:"rendered_visual_bold_overuse_count"`
	RenderedVisualSmallTextPaddingRiskCount  int  `json:"rendered_visual_small_text_padding_risk_count"`
	ThemeContractPresent                     bool `json:"theme_contract_present"`
	ThemeAssetNeedsApplied                   bool `json:"theme_asset_needs_applied"`
	VisualAssetRequired                      bool `json:"visual_asset_required"`
	VisualAssetIssueCount                    int  `json:"visual_asset_issue_count"`
	CoverRealHeroRequired                    bool `json:"cover_real_hero_required"`
	CoverRealHeroPresent                     bool `json:"cover_real_hero_present"`
	ImageCandidateCount                      int  `json:"image_candidate_count"`
	SelectedImageCandidateCount              int  `json:"selected_image_candidate_count"`
	ImageRoleFormatIssueCount                int  `json:"image_role_format_issue_count"`
	TransparentSubjectAssets                 int  `json:"transparent_subject_assets"`
	SelectedImagesReferenced                 int  `json:"selected_images_referenced"`
	SelectedImagesUnreferenced               int  `json:"selected_images_unreferenced"`
	ImageUsageIssueCount                     int  `json:"image_usage_issue_count"`
	CoverHeroAreaBP                          int  `json:"cover_hero_area_bp"`
	FullBleedImageUsageCount                 int  `json:"full_bleed_image_usage_count"`
	MediaPressureIssueCount                  int  `json:"media_pressure_issue_count"`
	DominantRealImagePages                   int  `json:"dominant_real_image_pages"`
	MaxConsecutiveInfographicPages           int  `json:"max_consecutive_infographic_pages"`
	ChartUsageIssueCount                     int  `json:"chart_usage_issue_count"`
	ContentPayloadIssueCount                 int  `json:"content_payload_issue_count"`
	SparseLabelListCount                     int  `json:"sparse_label_list_count"`
	MissingEvidencePayloadCount              int  `json:"missing_evidence_payload_count"`
	MissingVisualDataItemsCount              int  `json:"missing_visual_data_items_count"`
}

type qualitySourcesFile struct {
	Sources []qualitySource `json:"sources"`
}

type qualitySource struct {
	ID        string `json:"id"`
	Path      string `json:"path"`
	Title     string `json:"title"`
	Excerpt   string `json:"excerpt"`
	Usage     string `json:"usage"`
	Retrieval string `json:"retrieval"`
}

type qualityContentFile struct {
	Slides []qualityContentSlide `json:"slides"`
}

type qualityContentSlide struct {
	ID         string          `json:"id"`
	Content    string          `json:"content"`
	SourceRefs []string        `json:"source_refs"`
	Visuals    []qualityVisual `json:"visuals"`
}

type qualityVisual struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Instruction string `json:"instruction"`
}

type qualityAssetsFile = deckAssetsFile
type qualityAsset = deckAsset

type qualityEntityResolutionFile struct {
	ResolvedEntity struct {
		Type string `json:"type"`
	} `json:"resolved_entity"`
	VisualQualityContract qualityVisualContract `json:"visual_quality_contract"`
}

type qualityVisualContract struct {
	Profile                                string                 `json:"profile"`
	RequiresRealImages                     bool                   `json:"requires_real_images"`
	MinImageCoverageBP                     int                    `json:"min_image_coverage_bp"`
	MinUniqueImages                        int                    `json:"min_unique_images"`
	MinOfficialImages                      int                    `json:"min_official_images"`
	AllowRepeatedHeroOnly                  bool                   `json:"allow_repeated_hero_only"`
	CoverRequiresRealHeroImage             bool                   `json:"cover_requires_real_hero_image"`
	RequiredChartRenderer                  string                 `json:"required_chart_renderer"`
	MinChartSVGAssets                      int                    `json:"min_chart_svg_assets"`
	MinVegaLiteSpecs                       int                    `json:"min_vega_lite_specs"`
	TypographyContractRequired             bool                   `json:"typography_contract_required"`
	ForbidPreviewWrapperImagesAsRealImages bool                   `json:"forbid_preview_wrapper_images_as_real_images"`
	Reason                                 string                 `json:"reason"`
	Mode                                   string                 `json:"mode"`
	BenchmarkAvailable                     bool                   `json:"benchmark_available"`
	BenchmarkUsage                         string                 `json:"benchmark_usage"`
	DeckType                               string                 `json:"deck_type"`
	TopicArchetype                         string                 `json:"topic_archetype"`
	MediaPressure                          mediaPressureContract  `json:"media_pressure"`
	EditorialQualityTarget                 editorialQualityTarget `json:"editorial_quality_target"`
	MustHave                               qualityVisualMustHave  `json:"must_have"`
}

type qualityVisualMustHave struct {
	StrongCover                bool     `json:"strong_cover"`
	SemanticImageCoverageMinBP int      `json:"semantic_image_coverage_min_bp"`
	EvidencePageMinVisuals     int      `json:"evidence_page_min_visuals"`
	MaxRepeatedLayoutRatioBP   int      `json:"max_repeated_layout_ratio_bp"`
	VisualRolesRequired        []string `json:"visual_roles_required"`
	TotalImageRefsMin          int      `json:"total_image_refs_min"`
}

type qualityVisualContractFile struct {
	VisualQualityContract qualityVisualContract `json:"visual_quality_contract"`
}

type qualitySlideVisualStats struct {
	ImageRefs      int
	FullBleedImage bool
	StrongCover    bool
	VisualRole     string
}

func CheckQuality(root string) (QualityReport, error) {
	safeRoot, _, err := readRun(root)
	if err != nil {
		return QualityReport{}, err
	}

	deck, err := readAuthorDeck(safeRoot, "outline/deck.json")
	if err != nil {
		return QualityReport{}, err
	}
	sources, err := readQualitySources(safeRoot)
	if err != nil {
		return QualityReport{}, err
	}
	content, err := readQualityContent(safeRoot)
	if err != nil {
		return QualityReport{}, err
	}
	assets, err := readQualityAssets(safeRoot)
	if err != nil {
		return QualityReport{}, err
	}
	entity := readQualityEntityResolution(safeRoot)
	visualContract := readQualityVisualContract(safeRoot, entity.VisualQualityContract)
	themeContract, themeContractPresent, themeContractErr := readThemeContract(safeRoot)
	themeContractApplies := themeContractPresent && themeContractErr == nil && themeContractEnforcesQuality(themeContract)
	if themeContractApplies {
		visualContract = applyThemeContractToVisualContract(visualContract, themeContract)
	}
	inventory := readQualityAssetInventory(safeRoot)
	chartManifest, chartManifestPresent, chartManifestErr := readChartManifest(safeRoot)
	typographyContract, typographyContractPresent, typographyContractErr := readTypographyContract(safeRoot)
	renderedVisual, renderedVisualPresent, renderedVisualErr := readRenderedVisualReport(safeRoot)
	if renderedVisualErr == nil && !renderedVisualPresent {
		renderedVisual = EvaluateRenderedVisualRun(safeRoot, previewDeckFromAuthorDeck(deck))
		if err := writeRenderedVisualReport(safeRoot, renderedVisual); err != nil {
			return QualityReport{}, err
		}
		renderedVisualPresent = true
	}

	report := QualityReport{
		Status:  "passed",
		Issues:  []QualityIssue{},
		Metrics: QualityMetrics{},
	}
	contentPayload, contentPayloadErr := evaluateContentPayloadAtRoot(safeRoot)
	if contentPayloadErr != nil {
		report.Issues = append(report.Issues, qualityIssue(
			"content/slide_content.json",
			"svglide.quality.content_payload",
			fmt.Sprintf("content payload cannot be evaluated: %v", contentPayloadErr),
		))
	} else {
		if err := writeContentPayloadReport(safeRoot, contentPayload); err != nil {
			return QualityReport{}, err
		}
		report.ContentPayload = &contentPayload
		report.Metrics.ContentPayloadIssueCount = contentPayload.Metrics.IssueCount
		report.Metrics.SparseLabelListCount = contentPayload.Metrics.SparseLabelListCount
		report.Metrics.MissingEvidencePayloadCount = contentPayload.Metrics.MissingCentralClaimCount + contentPayload.Metrics.MissingSupportingPointsCount + contentPayload.Metrics.MissingSourceBoundFactCount + contentPayload.Metrics.SourceBindingIssueCount
		report.Metrics.MissingVisualDataItemsCount = contentPayload.Metrics.MissingVisualDataItemsCount
		if contentPayload.Status != "passed" {
			report.Issues = append(report.Issues, qualityIssue(
				contentPayloadReportPath,
				"svglide.quality.content_payload_failed",
				fmt.Sprintf("content payload contract failed: %s", summarizeContentPayloadIssues(contentPayload.Issues)),
			))
		}
	}
	report.Metrics.Slides = len(deck.Slides)
	report.Metrics.Sources = len(sources.Sources)
	report.Metrics.Assets = len(assets.Assets)
	report.Metrics.ThemeContractPresent = themeContractPresent
	if themeContractApplies && themeContract.ThemeContract.AssetNeeds.RequiresRealImages {
		report.Metrics.ThemeAssetNeedsApplied = true
	}
	if themeContractPresent && themeContractErr != nil {
		report.Issues = append(report.Issues, qualityIssue(
			themeContractPath,
			"svglide.quality.theme_contract",
			fmt.Sprintf("theme contract cannot be read: %v", themeContractErr),
		))
	}

	sourceIDs := make(map[string]bool, len(sources.Sources))
	hasLocalOrUserProvidedSource := false
	for _, source := range sources.Sources {
		id := strings.TrimSpace(source.ID)
		if id != "" {
			sourceIDs[id] = true
		}
		retrieval := strings.TrimSpace(source.Retrieval)
		path := strings.TrimSpace(source.Path)
		if retrieval == "full_page" && (strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://")) {
			report.Metrics.WebSources++
		}
		if retrieval == "local_file" || retrieval == "user_provided" {
			hasLocalOrUserProvidedSource = true
		}
	}

	slideStats := readQualitySlideVisualStats(safeRoot, deck)
	visualRoleSlides := 0
	visualRoles := make(map[string]bool)
	layoutSignatureCounts := make(map[string]int)
	for _, slide := range deck.Slides {
		stat := slideStats[strings.TrimSpace(slide.ID)]
		report.Metrics.TotalImageRefs += stat.ImageRefs
		if stat.ImageRefs > report.Metrics.EvidencePageMaxVisuals && isEvidenceVisualRole(stat.VisualRole) {
			report.Metrics.EvidencePageMaxVisuals = stat.ImageRefs
		}
		if strings.TrimSpace(stat.VisualRole) != "" {
			visualRoleSlides++
			visualRoles[strings.TrimSpace(stat.VisualRole)] = true
		}
		if isCoverSlide(slide) && stat.StrongCover {
			report.Metrics.StrongCover = true
		}
		layoutSignatureCounts[layoutSignatureForStats(stat)]++
	}
	if report.Metrics.Slides > 0 {
		report.Metrics.VisualRoleCoverageBP = visualRoleSlides * 10000 / report.Metrics.Slides
		report.Metrics.RepeatedLayoutRatioBP = maxLayoutSignatureRatioBP(layoutSignatureCounts, report.Metrics.Slides)
	}
	for _, requiredRole := range visualContract.MustHave.VisualRolesRequired {
		requiredRole = strings.TrimSpace(requiredRole)
		if requiredRole == "" || visualRoles[requiredRole] {
			continue
		}
		report.Issues = append(report.Issues, qualityIssue(
			"outline/deck.json",
			"svglide.quality.visual_roles",
			fmt.Sprintf("visual contract requires visual_role %q", requiredRole),
		))
	}
	if report.Metrics.WebSources == 0 && !hasLocalOrUserProvidedSource {
		report.Issues = append(report.Issues, qualityIssue(
			"research/sources.json",
			"svglide.quality.research",
			"topic decks need at least one full_page web source or explicit local/user-provided source",
		))
	}

	assetsBySlideAndID := make(map[string]qualityAsset, len(assets.Assets))
	deferredBySlideAndID := make(map[string]qualityAsset, len(assets.Assets))
	for _, asset := range assets.Assets {
		status := assetStatus(asset)
		key := assetSlideID(asset) + "/" + assetID(asset)
		if status == "deferred" || status == "needs_generation" {
			deferredBySlideAndID[key] = asset
			continue
		}
		if status != "ready" {
			continue
		}
		assetsBySlideAndID[key] = asset
	}

	contentByID := make(map[string]qualityContentSlide, len(content.Slides))
	for _, slide := range content.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			continue
		}
		contentByID[id] = slide
	}

	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		item, ok := contentByID[id]
		if !ok {
			report.Issues = append(report.Issues, qualityIssue(
				"content/slide_content.json",
				"svglide.quality.content",
				fmt.Sprintf("deck slide %q is missing content", id),
			))
			continue
		}
		if len(item.SourceRefs) > 0 {
			report.Metrics.SlidesWithSourceRef++
		} else {
			report.Issues = append(report.Issues, qualityIssue(
				"content/slide_content.json",
				"svglide.quality.source_refs",
				fmt.Sprintf("slide %q has no source_refs", id),
			))
		}
		for _, ref := range item.SourceRefs {
			ref = strings.TrimSpace(ref)
			if ref == "" || !sourceIDs[ref] {
				report.Issues = append(report.Issues, qualityIssue(
					"content/slide_content.json",
					"svglide.quality.source_refs",
					fmt.Sprintf("slide %q references unknown source %q", id, ref),
				))
			}
		}

		if len(item.Visuals) == 0 {
			report.Issues = append(report.Issues, qualityIssue(
				"content/slide_content.json",
				"svglide.quality.visuals",
				fmt.Sprintf("slide %q has no visuals; use a type=none sentinel when no visual asset is needed", id),
			))
		}

		hasVisual := false
		for _, visual := range item.Visuals {
			visualType := strings.TrimSpace(visual.Type)
			if visualType == "none" {
				continue
			}
			hasVisual = true
			if visualType == "chart" && chartManifestPresent && chartManifestHasSlideVisual(chartManifest, id, visual.ID) {
				continue
			}
			key := id + "/" + strings.TrimSpace(visual.ID)
			asset, ok := assetsBySlideAndID[key]
			if !ok && visualTypeIsDeferredOnly(visualType) {
				if deferredAsset, deferred := deferredBySlideAndID[key]; deferred {
					asset = deferredAsset
					ok = true
				}
			}
			if !ok {
				report.Issues = append(report.Issues, qualityIssue(
					assetsManifestPath,
					"svglide.quality.asset",
					fmt.Sprintf("slide %q visual %q has no ready asset", id, visual.ID),
				))
				continue
			}
			assetType := assetType(asset)
			if assetType != visualType {
				report.Issues = append(report.Issues, qualityIssue(
					assetsManifestPath,
					"svglide.quality.asset",
					fmt.Sprintf("slide %q visual %q type %q has ready asset type %q", id, visual.ID, visualType, assetType),
				))
			}
		}
		if hasVisual {
			report.Metrics.SlidesWithVisuals++
		}
	}

	realImageSlides := make(map[string]bool)
	uniqueRealImages := make(map[string]bool)
	officialRealImages := make(map[string]bool)
	officialHosts := officialSourceHosts(sources.Sources)
	inventorySources := inventorySourceURLByPath(inventory)
	for _, asset := range assets.Assets {
		if assetStatus(asset) != "ready" {
			continue
		}
		if isPreviewWrapperImageAsset(asset) {
			report.Metrics.PreviewWrapperImageCount++
		}
		if isGeneratedSVGAsset(asset) {
			report.Metrics.GeneratedSVGAssets++
		}
		if isChartSVGAsset(asset) {
			report.Metrics.ChartSVGAssets++
		}
		if !isRasterImageAsset(asset) {
			continue
		}
		path := assetPath(asset)
		if path == "" {
			continue
		}
		uniqueRealImages[path] = true
		if slideID := assetSlideID(asset); slideID != "" {
			realImageSlides[slideID] = true
		}
		if sourceURLHostMatchesAny(inventorySources[path], officialHosts) || sourceURLHostMatchesAny(asset.SourceURL, officialHosts) {
			officialRealImages[path] = true
		}
	}
	report.Metrics.SlidesWithImageAssets = len(realImageSlides)
	report.Metrics.UniqueImageAssets = len(uniqueRealImages)
	report.Metrics.OfficialImageAssets = len(officialRealImages)
	report.Metrics.RealImageAssets = len(uniqueRealImages)
	report.Metrics.SlidesWithRealImageAssets = len(realImageSlides)
	if report.Metrics.Slides > 0 {
		report.Metrics.ImageCoverageBP = report.Metrics.SlidesWithRealImageAssets * 10000 / report.Metrics.Slides
	}
	if candidates, err := readImageCandidates(safeRoot); err == nil {
		report.Metrics.ImageCandidateCount = len(candidates.Candidates)
		for _, candidate := range candidates.Candidates {
			if candidate.Selected {
				report.Metrics.SelectedImageCandidateCount++
			}
		}
	}
	coverHasRealImageAsset := false
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if isCoverSlide(slide) && realImageSlides[id] {
			coverHasRealImageAsset = true
			if slideStats[id].FullBleedImage {
				report.Metrics.CoverRealHeroImage = true
			}
		}
	}
	enforceImageRoleFormat(&report, inventory)
	imageUsage := EvaluateImageUsageRun(safeRoot, deck, assets, inventory)
	if err := writeImageUsageReport(safeRoot, imageUsage); err != nil {
		return QualityReport{}, err
	}
	for _, slide := range imageUsage.Slides {
		for _, used := range slide.Assets {
			report.Metrics.SelectedImagesReferenced++
			if used.FitRole == "full_bleed" {
				report.Metrics.FullBleedImageUsageCount++
			}
			if isCoverSlideID(deck, slide.SlideID) && used.FitRole == "full_bleed" && used.AreaBP > report.Metrics.CoverHeroAreaBP {
				report.Metrics.CoverHeroAreaBP = used.AreaBP
			}
		}
	}
	for _, issue := range imageUsage.Issues {
		report.Metrics.ImageUsageIssueCount++
		if issue.Code == "svglide.quality.image_usage_missing" {
			report.Metrics.SelectedImagesUnreferenced++
		}
		report.Issues = append(report.Issues, qualityIssue(issue.Path, issue.Code, issue.Message))
	}
	mediaPressure := EvaluateMediaPressureRun(deck, visualContract, imageUsage)
	if err := writeMediaPressureReport(safeRoot, mediaPressure); err != nil {
		return QualityReport{}, err
	}
	report.Metrics.MediaPressureIssueCount = mediaPressure.Metrics.IssueCount
	report.Metrics.DominantRealImagePages = mediaPressure.Metrics.DominantRealImagePages
	report.Metrics.MaxConsecutiveInfographicPages = mediaPressure.Metrics.MaxConsecutiveInfographicPages
	for _, issue := range mediaPressure.Issues {
		report.Issues = append(report.Issues, qualityIssue(issue.Path, issue.Code, issue.Message))
	}
	if chartManifestPresent {
		if manifestChartCount := countChartSVGEntries(chartManifest); manifestChartCount > report.Metrics.ChartSVGAssets {
			report.Metrics.ChartSVGAssets = manifestChartCount
		}
		report.Metrics.VegaLiteSpecAssets = countVegaLiteSpecEntries(chartManifest)
		enforceChartManifest(&report, safeRoot, visualContract, chartManifest)
		chartBriefs, _, chartBriefErr := readChartBriefs(safeRoot)
		if chartBriefErr != nil {
			report.Issues = append(report.Issues, qualityIssue(
				chartBriefsPath,
				"svglide.quality.chart_briefs",
				fmt.Sprintf("chart briefs cannot be read: %v", chartBriefErr),
			))
		}
		chartUsage := EvaluateChartUsageRun(safeRoot, deck, chartManifest, chartBriefs)
		if err := writeChartUsageReport(safeRoot, chartUsage); err != nil {
			return QualityReport{}, err
		}
		for _, issue := range chartUsage.Issues {
			report.Metrics.ChartUsageIssueCount++
			report.Issues = append(report.Issues, qualityIssue(issue.Path, issue.Code, issue.Message))
		}
	} else if visualContractRequiresChartManifest(visualContract) {
		message := "visual contract requires chart manifest"
		if chartManifestErr != nil {
			message = fmt.Sprintf("visual contract requires chart manifest: %v", chartManifestErr)
		}
		report.Issues = append(report.Issues, qualityIssue(
			chartManifestPath,
			"svglide.quality.missing_chart_manifest",
			message,
		))
		if err := writeChartUsageReport(safeRoot, ChartUsageReport{Status: "passed", Charts: []ChartUsageChart{}, Issues: []ChartUsageIssue{}}); err != nil {
			return QualityReport{}, err
		}
	} else {
		if err := writeChartUsageReport(safeRoot, ChartUsageReport{Status: "passed", Charts: []ChartUsageChart{}, Issues: []ChartUsageIssue{}}); err != nil {
			return QualityReport{}, err
		}
	}
	enforceChartQualityReport(&report, root, visualContract)
	if typographyContractPresent && typographyContractHasRequiredRoles(typographyContract) {
		report.Metrics.TypographyContractPresent = true
	} else if typographyContractErr != nil && visualContractRequiresTypography(visualContract) {
		report.Issues = append(report.Issues, qualityIssue(
			typographyContractPath,
			"svglide.quality.missing_typography_contract",
			fmt.Sprintf("visual contract requires typography contract: %v", typographyContractErr),
		))
	} else if typographyContractPresent && visualContractRequiresTypography(visualContract) {
		report.Issues = append(report.Issues, qualityIssue(
			typographyContractPath,
			"svglide.quality.typography_contract",
			"typography contract must define display, body, number, and label roles with concrete font families",
		))
	}
	enforceVisualQualityContract(&report, visualContract)
	enforceRequestDerivedVisualAssetGate(&report, safeRoot, coverHasRealImageAsset)
	enforceRenderedVisualQualityGate(&report, renderedVisual, renderedVisualPresent, renderedVisualErr)

	if len(report.Issues) > 0 {
		report.Status = "failed"
	}

	semantic, semanticErr := EvaluateAnyGenQualitySemantics(root)
	if semanticErr != nil {
		report.Issues = append(report.Issues, QualityIssue{
			Path:     anyGenSemanticReportPath,
			Code:     "svglide.semantic.contract",
			Message:  semanticErr.Error(),
			Severity: "error",
		})
		report.Status = "failed"
	} else if semantic.Status != "passed" {
		for _, finding := range semantic.Findings {
			if !semanticFindingFails(finding) {
				continue
			}
			path := strings.TrimSpace(finding.Artifact)
			if path == "" {
				path = anyGenSemanticReportPath
			}
			code := strings.TrimSpace(finding.Code)
			if code == "" {
				code = "svglide.semantic." + strings.TrimSpace(finding.RuleID)
			}
			report.Issues = append(report.Issues, QualityIssue{
				Path:     path,
				Code:     code,
				Message:  finding.Message,
				Severity: "error",
			})
		}
		report.Status = "failed"
	}

	creative, creativeErr := CheckCreativeQuality(root)
	if creativeErr != nil {
		report.Issues = append(report.Issues, QualityIssue{
			Path:     creativeQualityReportPath,
			Code:     "svglide.creative_quality.execution",
			Message:  creativeErr.Error(),
			Severity: "error",
		})
		report.Status = "failed"
		editorial := EvaluateEditorialQualityExecutionFailure(visualContract, mediaPressure, creativeErr)
		if err := writeEditorialQualityReport(safeRoot, editorial); err != nil {
			return report, err
		}
	} else {
		if err := writeJSON(filepath.Join(safeRoot, creativeQualityReportPath), creative); err != nil {
			return report, err
		}
		if creative.Status != "passed" {
			for _, issue := range creative.Issues {
				if issue.Severity != "error" {
					continue
				}
				report.Issues = append(report.Issues, QualityIssue{
					Path:     issue.Path,
					Code:     issue.Code,
					Message:  issue.Message,
					Severity: "error",
				})
			}
			report.Status = "failed"
		}
		editorial := EvaluateEditorialQualityRun(visualContract, mediaPressure, creative, contentPayload)
		if err := writeEditorialQualityReport(safeRoot, editorial); err != nil {
			return report, err
		}
		if editorial.Status != "passed" {
			for _, issue := range editorial.Issues {
				if issue.Severity != "error" {
					continue
				}
				report.Issues = append(report.Issues, QualityIssue{
					Path:     issue.Path,
					Code:     issue.Code,
					Message:  issue.Message,
					Severity: "error",
				})
			}
			report.Status = "failed"
		}
	}

	if err := writeJSON(filepath.Join(safeRoot, "quality_report.json"), report); err != nil {
		return report, err
	}
	return report, nil
}

func enforceImageRoleFormat(report *QualityReport, inventory assetInventoryFile) {
	for _, item := range inventory.Items {
		role := strings.TrimSpace(item.AssetRole)
		format := strings.ToLower(strings.TrimSpace(item.Format))
		needsAlpha := role == "transparent_subject" || role == "floating_product" || role == "logo" || role == "chip_device"
		if needsAlpha {
			report.Metrics.TransparentSubjectAssets++
		}
		if !needsAlpha {
			continue
		}
		if item.HasAlpha || format == "svg" {
			continue
		}
		if strings.TrimSpace(item.FormatExceptionReason) != "" {
			continue
		}
		report.Metrics.ImageRoleFormatIssueCount++
		report.Issues = append(report.Issues, qualityIssue(
			assetInventoryPath,
			"svglide.quality.image_role_format",
			fmt.Sprintf("asset %q role %q should prefer transparent PNG/SVG or provide format_exception_reason", item.ID, role),
		))
	}
}

func isCoverSlideID(deck authorDeck, slideID string) bool {
	for _, slide := range deck.Slides {
		if strings.TrimSpace(slide.ID) == strings.TrimSpace(slideID) {
			return isCoverSlide(slide)
		}
	}
	return false
}

func enforceRenderedVisualQualityGate(report *QualityReport, renderedVisual RenderedVisualReport, present bool, readErr error) {
	if readErr != nil {
		report.Issues = append(report.Issues, qualityIssue(
			renderedVisualReceiptPath,
			"svglide.quality.rendered_visual",
			fmt.Sprintf("cannot read rendered visual report: %v", readErr),
		))
		return
	}
	if !present {
		report.Issues = append(report.Issues, qualityIssue(
			renderedVisualReceiptPath,
			"svglide.quality.rendered_visual",
			"rendered visual report is required before quality can pass",
		))
		return
	}
	report.Metrics.RenderedVisualIssueCount = renderedVisual.Metrics.IssueCount
	report.Metrics.RenderedVisualTextOverflowCount = renderedVisual.Metrics.TextOverflowCount
	report.Metrics.RenderedVisualTextCollisionCount = renderedVisual.Metrics.TextCollisionCount
	report.Metrics.RenderedVisualOutOfCanvasCount = renderedVisual.Metrics.OutOfCanvasCount
	report.Metrics.RenderedVisualContainerTextOverflowCount = renderedVisual.Metrics.ContainerTextOverflowCount
	report.Metrics.RenderedVisualContainerPaddingRiskCount = renderedVisual.Metrics.ContainerPaddingRiskCount
	report.Metrics.RenderedVisualForeignObjectOverlapCount = renderedVisual.Metrics.ForeignObjectOverlapCount
	report.Metrics.RenderedVisualTightLineHeightCount = renderedVisual.Metrics.TightLineHeightCount
	report.Metrics.RenderedVisualBoldOveruseCount = renderedVisual.Metrics.BoldOveruseCount
	report.Metrics.RenderedVisualSmallTextPaddingRiskCount = renderedVisual.Metrics.SmallTextPaddingRiskCount
	if renderedVisual.Status != "passed" {
		report.Issues = append(report.Issues, qualityIssue(
			renderedVisualReceiptPath,
			"svglide.quality.rendered_visual",
			fmt.Sprintf("rendered visual gate failed with %d issue(s)", renderedVisual.Metrics.IssueCount),
		))
	}
}

func chartManifestHasSlideVisual(manifest chartManifestFile, slideID string, visualID string) bool {
	slideID = strings.TrimSpace(slideID)
	visualID = strings.TrimSpace(visualID)
	for _, chart := range manifest.Charts {
		if strings.TrimSpace(chart.SlideID) == slideID && strings.TrimSpace(chart.ID) == visualID {
			return true
		}
	}
	return false
}

func enforceChartQualityReport(report *QualityReport, root string, contract qualityVisualContract) {
	chartReport, err := CheckChartQuality(root)
	if err != nil {
		if visualContractRequiresChartManifest(contract) {
			report.Issues = append(report.Issues, qualityIssue(
				chartQualityReportPath,
				"svglide.quality.chart_quality",
				fmt.Sprintf("cannot compute chart quality report: %v", err),
			))
		}
		return
	}
	if normalizedRequiredChartRenderer(contract.RequiredChartRenderer) != requiredChartRendererVegaLite {
		return
	}
	if chartReport.Metrics.VegaLiteCharts < contract.MinVegaLiteSpecs {
		report.Issues = append(report.Issues, qualityIssue(
			chartQualityReportPath,
			"svglide.quality.chart_quality",
			fmt.Sprintf("visual contract requires at least %d Vega-Lite chart(s), got %d", contract.MinVegaLiteSpecs, chartReport.Metrics.VegaLiteCharts),
		))
	}
	if chartReport.Status == "passed" {
		return
	}
	for _, issue := range chartReport.Issues {
		if issue.Severity != "error" {
			continue
		}
		report.Issues = append(report.Issues, QualityIssue{
			Path:     issue.Path,
			Code:     issue.Code,
			Message:  issue.Message,
			Severity: "error",
		})
	}
}

func enforceRequestDerivedVisualAssetGate(report *QualityReport, safeRoot string, coverHasRealImageAsset bool) {
	assetGate := EvaluateVisualAssetGate(VisualAssetGateInput{
		RequestText:             qualityRequestText(safeRoot),
		EntityKind:              qualityEntityKind(safeRoot),
		Slides:                  report.Metrics.Slides,
		RealImageAssets:         report.Metrics.RealImageAssets,
		OfficialImageAssets:     report.Metrics.OfficialImageAssets,
		SlidesWithRealImages:    report.Metrics.SlidesWithRealImageAssets,
		CoverRealHeroImage:      report.Metrics.CoverRealHeroImage || coverHasRealImageAsset,
		NoImageReason:           qualityNoImageReason(safeRoot),
		ExplicitChartOnly:       qualityRequestExplicitChartOnly(safeRoot),
		ThemeRequiresRealImages: qualityThemeRequiresRealImages(safeRoot) || qualityDeliveryRequiresRealImages(safeRoot),
	})
	report.Metrics.VisualAssetRequired = assetGate.Required
	report.Metrics.VisualAssetIssueCount = assetGate.IssueCount
	report.Metrics.CoverRealHeroRequired = assetGate.CoverRealHeroRequired
	report.Metrics.CoverRealHeroPresent = assetGate.CoverRealHeroPresent
	for _, issue := range assetGate.Issues {
		report.Issues = append(report.Issues, qualityIssue(
			assetInventoryPath,
			"svglide.quality."+strings.TrimPrefix(issue.Code, "svglide."),
			issue.Message,
		))
	}
}

func visualTypeIsDeferredOnly(value string) bool {
	switch strings.TrimSpace(value) {
	case "chart", "table", "crop", "diagram", "map", "icon", "illustration":
		return true
	default:
		return false
	}
}

func readQualitySources(safeRoot string) (qualitySourcesFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, "research/sources.json")
	if err != nil {
		return qualitySourcesFile{}, err
	}
	var file qualitySourcesFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return qualitySourcesFile{}, fmt.Errorf("read sources %q: %w", "research/sources.json", err)
	}
	return file, nil
}

func readQualityContent(safeRoot string) (qualityContentFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, "content/slide_content.json")
	if err != nil {
		return qualityContentFile{}, err
	}
	var file qualityContentFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return qualityContentFile{}, fmt.Errorf("read slide content %q: %w", "content/slide_content.json", err)
	}
	return file, nil
}

func readQualityAssets(safeRoot string) (qualityAssetsFile, error) {
	return readAssetsManifest(safeRoot)
}

func readQualityEntityResolution(safeRoot string) qualityEntityResolutionFile {
	raw, err := readRunRegularArtifact(safeRoot, "request/entity_resolution.json")
	if err != nil {
		return qualityEntityResolutionFile{}
	}
	var file qualityEntityResolutionFile
	_ = json.Unmarshal(raw, &file)
	return file
}

func readQualityVisualContract(safeRoot string, fallback qualityVisualContract) qualityVisualContract {
	raw, err := readRunRegularArtifact(safeRoot, "brief/visual_quality_contract.json")
	if err != nil {
		return fallback
	}
	var file qualityVisualContractFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return fallback
	}
	if isZeroVisualContract(file.VisualQualityContract) {
		return fallback
	}
	return file.VisualQualityContract
}

func isZeroVisualContract(contract qualityVisualContract) bool {
	return strings.TrimSpace(contract.Profile) == "" &&
		strings.TrimSpace(contract.Mode) == "" &&
		strings.TrimSpace(contract.BenchmarkUsage) == "" &&
		strings.TrimSpace(contract.DeckType) == "" &&
		!contract.RequiresRealImages &&
		!contract.CoverRequiresRealHeroImage &&
		!contract.TypographyContractRequired &&
		!contract.MustHave.StrongCover &&
		contract.MinImageCoverageBP == 0 &&
		contract.MinUniqueImages == 0 &&
		contract.MinOfficialImages == 0 &&
		contract.MinChartSVGAssets == 0 &&
		contract.MinVegaLiteSpecs == 0 &&
		strings.TrimSpace(contract.RequiredChartRenderer) == "" &&
		strings.TrimSpace(contract.TopicArchetype) == "" &&
		isZeroMediaPressureContract(contract.MediaPressure) &&
		isZeroEditorialQualityTarget(contract.EditorialQualityTarget) &&
		contract.MustHave.SemanticImageCoverageMinBP == 0 &&
		contract.MustHave.EvidencePageMinVisuals == 0 &&
		contract.MustHave.MaxRepeatedLayoutRatioBP == 0 &&
		contract.MustHave.TotalImageRefsMin == 0 &&
		len(contract.MustHave.VisualRolesRequired) == 0
}

func isZeroMediaPressureContract(contract mediaPressureContract) bool {
	return contract.MinRealImagePages == 0 &&
		contract.MinDominantRealImagePages == 0 &&
		contract.DominantImageMinAreaBP == 0 &&
		!contract.RequireCoverDominantRealImage &&
		contract.MaxConsecutiveInfographicOnlyPages == 0 &&
		contract.MinUniqueRealImages == 0
}

func readQualityAssetInventory(safeRoot string) assetInventoryFile {
	inventory, err := readAssetInventory(safeRoot)
	if err != nil {
		return assetInventoryFile{}
	}
	return inventory
}

func inventorySourceURLByPath(inventory assetInventoryFile) map[string]string {
	out := make(map[string]string, len(inventory.Items))
	for _, item := range inventory.Items {
		path := strings.TrimSpace(item.Path)
		if path == "" {
			continue
		}
		out[path] = strings.TrimSpace(item.SourceURL)
	}
	return out
}

func officialSourceHosts(sources []qualitySource) map[string]bool {
	hosts := make(map[string]bool)
	for _, source := range sources {
		if strings.TrimSpace(source.Retrieval) != "full_page" {
			continue
		}
		host := normalizedURLHost(source.Path)
		if host != "" {
			hosts[host] = true
		}
	}
	return hosts
}

func sourceURLHostMatchesAny(raw string, hosts map[string]bool) bool {
	host := normalizedURLHost(raw)
	return host != "" && hosts[host]
}

func normalizedURLHost(raw string) string {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return ""
	}
	switch parsed.Scheme {
	case "http", "https":
	default:
		return ""
	}
	host := strings.ToLower(strings.TrimSpace(parsed.Hostname()))
	return strings.TrimPrefix(host, "www.")
}

func readQualitySlideVisualStats(safeRoot string, deck authorDeck) map[string]qualitySlideVisualStats {
	out := make(map[string]qualitySlideVisualStats, len(deck.Slides))
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			continue
		}
		stat := qualitySlideVisualStats{VisualRole: normalizedSlideVisualRole(slide)}
		slidePath, err := previewSlideObjectPath(slide.Path)
		if err != nil {
			out[id] = stat
			continue
		}
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			out[id] = stat
			continue
		}
		svg := string(raw)
		stat.ImageRefs = countSVGImageElements(svg)
		stat.FullBleedImage = hasFullBleedImage(svg)
		stat.StrongCover = stat.FullBleedImage || hasPosterScaleText(svg)
		out[id] = stat
	}
	return out
}

func normalizedSlideVisualRole(slide authorDeckSlide) string {
	if role := strings.TrimSpace(slide.VisualRole); role != "" {
		return role
	}
	haystack := strings.ToLower(strings.Join([]string{
		slide.Role,
		slide.Title,
		slide.Summary,
		slide.KeyMessage,
		slide.Path,
	}, " "))
	switch {
	case strings.Contains(haystack, "cover") || strings.Contains(haystack, "封面"):
		return "hero_cover"
	case strings.Contains(haystack, "process") || strings.Contains(haystack, "工艺") || strings.Contains(haystack, "流程"):
		return "process_detail"
	case strings.Contains(haystack, "evidence") || strings.Contains(haystack, "gallery") || strings.Contains(haystack, "证据"):
		return "evidence_grid"
	case strings.Contains(haystack, "product") || strings.Contains(haystack, "产品") || strings.Contains(haystack, "compare"):
		return "product_compare"
	case strings.Contains(haystack, "retail") || strings.Contains(haystack, "shop") || strings.Contains(haystack, "scene") || strings.Contains(haystack, "门店"):
		return "scene_or_retail"
	case strings.Contains(haystack, "thesis") || strings.Contains(haystack, "判断"):
		return "thesis"
	default:
		return ""
	}
}

func isCoverSlide(slide authorDeckSlide) bool {
	role := normalizedSlideVisualRole(slide)
	if role == "hero_cover" {
		return true
	}
	haystack := strings.ToLower(strings.Join([]string{slide.Role, slide.Title, slide.Path}, " "))
	return strings.Contains(haystack, "cover") || strings.Contains(haystack, "封面")
}

func isEvidenceVisualRole(role string) bool {
	switch strings.TrimSpace(role) {
	case "evidence_grid", "process_detail", "product_compare":
		return true
	default:
		return false
	}
}

var svgImageElementPattern = regexp.MustCompile(`(?i)<image\b`)
var svgImageTagPattern = regexp.MustCompile(`(?is)<image\b[^>]*>`)
var svgNumberAttrPattern = regexp.MustCompile(`(?i)\b(x|y|width|height)\s*=\s*"([^"]+)"`)
var svgFontSizePattern = regexp.MustCompile(`(?i)font-size\s*[:=]\s*"?([0-9]+)`)

func countSVGImageElements(svg string) int {
	return len(svgImageElementPattern.FindAllStringIndex(svg, -1))
}

func hasFullBleedImage(svg string) bool {
	viewWidth, viewHeight := svgViewBoxSize(svg)
	if viewWidth <= 0 {
		viewWidth = 960
	}
	if viewHeight <= 0 {
		viewHeight = 540
	}
	for _, tag := range svgImageTagPattern.FindAllString(svg, -1) {
		attrs := svgNumericAttrs(tag)
		if attrs["x"] <= 1 && attrs["y"] <= 1 && attrs["width"] >= viewWidth*0.9 && attrs["height"] >= viewHeight*0.9 {
			return true
		}
	}
	return false
}

func svgViewBoxSize(svg string) (float64, float64) {
	idx := strings.Index(svg, "viewBox=")
	if idx < 0 {
		return 0, 0
	}
	rest := svg[idx+len("viewBox="):]
	if len(rest) == 0 {
		return 0, 0
	}
	quote := rest[0]
	if quote != '"' && quote != '\'' {
		return 0, 0
	}
	end := strings.IndexByte(rest[1:], quote)
	if end < 0 {
		return 0, 0
	}
	parts := strings.Fields(rest[1 : 1+end])
	if len(parts) != 4 {
		return 0, 0
	}
	width, _ := strconv.ParseFloat(parts[2], 64)
	height, _ := strconv.ParseFloat(parts[3], 64)
	return width, height
}

func svgNumericAttrs(tag string) map[string]float64 {
	out := make(map[string]float64)
	for _, match := range svgNumberAttrPattern.FindAllStringSubmatch(tag, -1) {
		if len(match) != 3 {
			continue
		}
		value := strings.TrimSpace(strings.TrimSuffix(match[2], "px"))
		parsed, err := strconv.ParseFloat(value, 64)
		if err != nil {
			continue
		}
		out[strings.ToLower(match[1])] = parsed
	}
	return out
}

func hasPosterScaleText(svg string) bool {
	for _, match := range svgFontSizePattern.FindAllStringSubmatch(svg, -1) {
		if len(match) != 2 {
			continue
		}
		size, err := strconv.Atoi(match[1])
		if err == nil && size >= 48 {
			return true
		}
	}
	return false
}

func layoutSignatureForStats(stat qualitySlideVisualStats) string {
	switch {
	case stat.ImageRefs == 0:
		return "no_image"
	case stat.ImageRefs == 1:
		return "single_image"
	case stat.ImageRefs <= 4:
		return "few_images"
	default:
		return "dense_images"
	}
}

func maxLayoutSignatureRatioBP(counts map[string]int, total int) int {
	if total <= 0 {
		return 0
	}
	maxCount := 0
	for _, count := range counts {
		if count > maxCount {
			maxCount = count
		}
	}
	return maxCount * 10000 / total
}

func enforceVisualQualityContract(report *QualityReport, contract qualityVisualContract) {
	if contract.ForbidPreviewWrapperImagesAsRealImages && report.Metrics.PreviewWrapperImageCount > 0 {
		report.Issues = append(report.Issues, qualityIssue(
			assetsManifestPath,
			"svglide.quality.preview_wrapper_image",
			fmt.Sprintf("preview slide SVG wrappers do not count as real images; got %d wrapper image assets", report.Metrics.PreviewWrapperImageCount),
		))
	}
	if contract.CoverRequiresRealHeroImage && !report.Metrics.CoverRealHeroImage {
		report.Issues = append(report.Issues, qualityIssue(
			"slides",
			"svglide.quality.cover_real_hero_image",
			"visual contract requires the cover to use a full-bleed real raster hero image",
		))
	}
	if visualContractRequiresTypography(contract) && !report.Metrics.TypographyContractPresent {
		report.Issues = append(report.Issues, qualityIssue(
			typographyContractPath,
			"svglide.quality.typography_contract",
			"visual contract requires a typography contract with concrete display/body/number/label roles",
		))
	}
	if contract.MinChartSVGAssets > 0 && report.Metrics.ChartSVGAssets < contract.MinChartSVGAssets {
		report.Issues = append(report.Issues, qualityIssue(
			chartManifestPath,
			"svglide.quality.chart_svg_assets",
			fmt.Sprintf("visual contract requires at least %d chart SVG assets, got %d", contract.MinChartSVGAssets, report.Metrics.ChartSVGAssets),
		))
	}
	if contract.MinVegaLiteSpecs > 0 && report.Metrics.VegaLiteSpecAssets < contract.MinVegaLiteSpecs {
		report.Issues = append(report.Issues, qualityIssue(
			chartManifestPath,
			"svglide.quality.vega_lite_specs",
			fmt.Sprintf("visual contract requires at least %d Vega-Lite specs, got %d", contract.MinVegaLiteSpecs, report.Metrics.VegaLiteSpecAssets),
		))
	}
	if !contract.RequiresRealImages {
		enforceGenericVisualQualityContract(report, contract)
		return
	}
	profile := strings.TrimSpace(contract.Profile)
	if profile == "" {
		profile = "unspecified"
	}
	if contract.MinImageCoverageBP > 0 && report.Metrics.ImageCoverageBP < contract.MinImageCoverageBP {
		report.Issues = append(report.Issues, qualityIssue(
			"quality_report.json",
			"svglide.quality.image_coverage",
			fmt.Sprintf("visual profile %q requires image coverage >= %d bp, got %d bp", profile, contract.MinImageCoverageBP, report.Metrics.ImageCoverageBP),
		))
	}
	if contract.MinUniqueImages > 0 && report.Metrics.UniqueImageAssets < contract.MinUniqueImages {
		report.Issues = append(report.Issues, qualityIssue(
			assetsManifestPath,
			"svglide.quality.unique_images",
			fmt.Sprintf("visual profile %q requires at least %d unique image assets, got %d", profile, contract.MinUniqueImages, report.Metrics.UniqueImageAssets),
		))
	}
	if contract.MinOfficialImages > 0 && report.Metrics.OfficialImageAssets < contract.MinOfficialImages {
		report.Issues = append(report.Issues, qualityIssue(
			assetInventoryPath,
			"svglide.quality.official_images",
			fmt.Sprintf("visual profile %q requires at least %d official image assets, got %d", profile, contract.MinOfficialImages, report.Metrics.OfficialImageAssets),
		))
	}
	if !contract.AllowRepeatedHeroOnly && report.Metrics.SlidesWithImageAssets > 1 && report.Metrics.UniqueImageAssets == 1 {
		report.Issues = append(report.Issues, qualityIssue(
			assetsManifestPath,
			"svglide.quality.repeated_hero_only",
			"multiple image slides reuse one unique image; official-site decks need page-specific imagery",
		))
	}
	enforceGenericVisualQualityContract(report, contract)
}

func enforceChartManifest(report *QualityReport, safeRoot string, contract qualityVisualContract, manifest chartManifestFile) {
	if normalizedRequiredChartRenderer(contract.RequiredChartRenderer) == requiredChartRendererVegaLite && strings.TrimSpace(manifest.Renderer) != requiredChartRendererVegaLite {
		report.Issues = append(report.Issues, qualityIssue(
			chartManifestPath,
			"svglide.quality.chart_renderer",
			fmt.Sprintf("visual contract requires chart renderer %q, got %q", requiredChartRendererVegaLite, strings.TrimSpace(manifest.Renderer)),
		))
	}
	for _, entry := range manifest.Charts {
		id := strings.TrimSpace(entry.ID)
		if id == "" {
			id = strings.TrimSpace(entry.SVGPath)
		}
		if normalizedRequiredChartRenderer(contract.RequiredChartRenderer) == requiredChartRendererVegaLite {
			if chartEntryRenderer(manifest, entry) != requiredChartRendererVegaLite {
				report.Issues = append(report.Issues, qualityIssue(
					chartManifestPath,
					"svglide.quality.chart_renderer",
					fmt.Sprintf("chart %q must use Vega-Lite renderer", id),
				))
			}
			if strings.TrimSpace(entry.SpecPath) == "" {
				report.Issues = append(report.Issues, qualityIssue(
					chartManifestPath,
					"svglide.quality.vega_lite_spec",
					fmt.Sprintf("chart %q is missing spec_path", id),
				))
			}
		}
		for _, rel := range []struct {
			path string
			code string
			kind string
		}{
			{strings.TrimSpace(entry.SpecPath), "svglide.quality.vega_lite_spec", "Vega-Lite spec"},
			{strings.TrimSpace(entry.SVGPath), "svglide.quality.chart_svg", "chart SVG"},
		} {
			if rel.path == "" {
				continue
			}
			if _, err := readRunRegularArtifact(safeRoot, rel.path); err != nil {
				report.Issues = append(report.Issues, qualityIssue(
					chartManifestPath,
					rel.code,
					fmt.Sprintf("chart %q %s %q is not readable: %v", id, rel.kind, rel.path, err),
				))
			}
		}
	}
}

func enforceGenericVisualQualityContract(report *QualityReport, contract qualityVisualContract) {
	if contract.MustHave.StrongCover && !report.Metrics.StrongCover {
		report.Issues = append(report.Issues, qualityIssue(
			"slides",
			"svglide.quality.weak_cover",
			"visual contract requires a strong cover; use a full-bleed hero image or poster-scale composition with minimal copy",
		))
	}
	if contract.MustHave.SemanticImageCoverageMinBP > 0 && report.Metrics.ImageCoverageBP < contract.MustHave.SemanticImageCoverageMinBP {
		report.Issues = append(report.Issues, qualityIssue(
			"quality_report.json",
			"svglide.quality.low_semantic_image_coverage",
			fmt.Sprintf("visual contract requires semantic image coverage >= %d bp, got %d bp", contract.MustHave.SemanticImageCoverageMinBP, report.Metrics.ImageCoverageBP),
		))
	}
	if contract.MustHave.EvidencePageMinVisuals > 0 && report.Metrics.EvidencePageMaxVisuals < contract.MustHave.EvidencePageMinVisuals {
		report.Issues = append(report.Issues, qualityIssue(
			"outline/deck.json",
			"svglide.quality.low_evidence_density",
			fmt.Sprintf("visual contract requires an evidence/process page with at least %d image refs, got %d", contract.MustHave.EvidencePageMinVisuals, report.Metrics.EvidencePageMaxVisuals),
		))
	}
	if contract.MustHave.MaxRepeatedLayoutRatioBP > 0 && report.Metrics.RepeatedLayoutRatioBP > contract.MustHave.MaxRepeatedLayoutRatioBP {
		report.Issues = append(report.Issues, qualityIssue(
			"outline/deck.json",
			"svglide.quality.repetitive_layout",
			fmt.Sprintf("visual contract requires repeated layout ratio <= %d bp, got %d bp", contract.MustHave.MaxRepeatedLayoutRatioBP, report.Metrics.RepeatedLayoutRatioBP),
		))
	}
	if contract.MustHave.TotalImageRefsMin > 0 && report.Metrics.TotalImageRefs < contract.MustHave.TotalImageRefsMin {
		report.Issues = append(report.Issues, qualityIssue(
			"slides",
			"svglide.quality.low_evidence_density",
			fmt.Sprintf("visual contract requires at least %d total image refs, got %d", contract.MustHave.TotalImageRefsMin, report.Metrics.TotalImageRefs),
		))
	}
}

func qualityIssue(path, code, message string) QualityIssue {
	return QualityIssue{
		Path:     path,
		Code:     code,
		Message:  message,
		Severity: "error",
	}
}
