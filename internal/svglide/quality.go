package svglide

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type QualityReport struct {
	Status  string         `json:"status"`
	Issues  []QualityIssue `json:"issues"`
	Metrics QualityMetrics `json:"metrics"`
}

type QualityIssue struct {
	Path     string `json:"path"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

type QualityMetrics struct {
	Slides              int `json:"slides"`
	Sources             int `json:"sources"`
	WebSources          int `json:"web_sources"`
	Assets              int `json:"assets"`
	SlidesWithSourceRef int `json:"slides_with_source_refs"`
	SlidesWithVisuals   int `json:"slides_with_visuals"`
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

type qualityAssetsFile struct {
	Assets []qualityAsset `json:"assets"`
}

type qualityAsset struct {
	ID      string `json:"id"`
	SlideID string `json:"slide_id"`
	Type    string `json:"type"`
	Path    string `json:"path"`
	Usage   string `json:"usage"`
	Status  string `json:"status"`
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

	report := QualityReport{
		Status:  "passed",
		Issues:  []QualityIssue{},
		Metrics: QualityMetrics{},
	}
	report.Metrics.Slides = len(deck.Slides)
	report.Metrics.Sources = len(sources.Sources)
	report.Metrics.Assets = len(assets.Assets)

	sourceIDs := make(map[string]bool, len(sources.Sources))
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
	}
	if report.Metrics.WebSources == 0 {
		report.Issues = append(report.Issues, qualityIssue(
			"research/sources.json",
			"svglide.quality.research",
			"topic decks need at least one full_page web source",
		))
	}

	assetsBySlideAndID := make(map[string]bool, len(assets.Assets))
	for _, asset := range assets.Assets {
		if strings.TrimSpace(asset.Status) != "ready" {
			continue
		}
		if err := validateQualityAssetPath(safeRoot, asset); err != nil {
			report.Issues = append(report.Issues, qualityIssue("assets/assets_plan.json", "svglide.quality.asset_path", err.Error()))
			continue
		}
		key := strings.TrimSpace(asset.SlideID) + "/" + strings.TrimSpace(asset.ID)
		assetsBySlideAndID[key] = true
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

		hasVisual := false
		for _, visual := range item.Visuals {
			if strings.TrimSpace(visual.Type) == "none" {
				continue
			}
			hasVisual = true
			key := id + "/" + strings.TrimSpace(visual.ID)
			if !assetsBySlideAndID[key] {
				report.Issues = append(report.Issues, qualityIssue(
					"assets/assets_plan.json",
					"svglide.quality.asset",
					fmt.Sprintf("slide %q visual %q has no ready asset", id, visual.ID),
				))
			}
		}
		if hasVisual {
			report.Metrics.SlidesWithVisuals++
		}
	}

	if len(report.Issues) > 0 {
		report.Status = "failed"
	}

	if err := writeJSON(filepath.Join(safeRoot, "quality_report.json"), report); err != nil {
		return report, err
	}
	return report, nil
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
	raw, err := readRunRegularArtifact(safeRoot, "assets/assets_plan.json")
	if err != nil {
		return qualityAssetsFile{}, err
	}
	var file qualityAssetsFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return qualityAssetsFile{}, fmt.Errorf("read assets plan %q: %w", "assets/assets_plan.json", err)
	}
	return file, nil
}

func validateQualityAssetPath(safeRoot string, asset qualityAsset) error {
	if strings.TrimSpace(asset.Status) != "ready" {
		return nil
	}
	path := strings.TrimSpace(asset.Path)
	if path == "" {
		return fmt.Errorf("asset %q path is empty", strings.TrimSpace(asset.ID))
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return fmt.Errorf("asset %q uses remote URL", strings.TrimSpace(asset.ID))
	}
	if filepath.IsAbs(path) {
		info, err := os.Stat(path)
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("asset %q path is not a regular file", strings.TrimSpace(asset.ID))
		}
		f, err := os.Open(path)
		if err != nil {
			return err
		}
		return f.Close()
	}
	if _, err := readRunRegularArtifact(safeRoot, path); err != nil {
		return err
	}
	return nil
}

func qualityIssue(path, code, message string) QualityIssue {
	return QualityIssue{
		Path:     path,
		Code:     code,
		Message:  message,
		Severity: "error",
	}
}
