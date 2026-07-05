package svglide

import (
	"encoding/xml"
	"fmt"
	"io"
	"strings"
)

type SemanticMetrics struct {
	SlideCount              int `json:"slide_count"`
	SlidesWithSlideRole     int `json:"slides_with_slide_role"`
	ImageCount              int `json:"image_count"`
	TextCount               int `json:"text_count"`
	NoteCount               int `json:"note_count"`
	SourceRefCount          int `json:"source_ref_count"`
	MissingAssetCount       int `json:"missing_asset_count"`
	SlidesWithoutSourceRefs int `json:"slides_without_source_refs"`
	VisibleLeakCount        int `json:"visible_leak_count"`
	FontTokenCount          int `json:"font_token_count"`
	MissingFontTokenCount   int `json:"missing_font_token_count"`
}

func MissingAssetCountForRun(safeRoot string, run Run) int {
	metrics, err := ComputeSemanticMetrics(safeRoot, run)
	if err != nil {
		return 0
	}
	return metrics.MissingAssetCount
}

func ComputeSemanticMetrics(safeRoot string, run Run) (SemanticMetrics, error) {
	var metrics SemanticMetrics
	deck, err := readAuthorDeck(safeRoot, semanticDeckPath(run))
	if err != nil {
		return metrics, err
	}
	metrics.SlideCount = len(deck.Slides)

	content, err := readQualityContent(safeRoot)
	if err == nil {
		sourceRefBySlideID := make(map[string]int, len(content.Slides))
		for _, slide := range content.Slides {
			count := 0
			for _, ref := range slide.SourceRefs {
				if strings.TrimSpace(ref) != "" {
					count++
				}
			}
			sourceRefBySlideID[strings.TrimSpace(slide.ID)] = count
			metrics.SourceRefCount += count
		}
		for _, slide := range deck.Slides {
			if sourceRefBySlideID[strings.TrimSpace(slide.ID)] == 0 {
				metrics.SlidesWithoutSourceRefs++
			}
		}
	}

	readyAssets := map[string]deckAsset{}
	if assets, err := readAssetsManifest(safeRoot); err == nil {
		for _, asset := range assets.Assets {
			if assetStatus(asset) != "ready" {
				continue
			}
			path := assetPath(asset)
			if path != "" {
				readyAssets[path] = asset
			}
		}
	}

	for _, slide := range deck.Slides {
		slidePath, err := previewSlideObjectPath(slide.Path)
		if err != nil {
			continue
		}
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			continue
		}
		svg := string(raw)
		metrics.VisibleLeakCount += countVisibleLeakMarkers(svg)
		fontTokens := countFontTokens(svg)
		metrics.FontTokenCount += fontTokens
		if fontTokens < 4 {
			metrics.MissingFontTokenCount += 4 - fontTokens
		}
		if strings.Contains(svg, `slide:role="slide"`) || strings.Contains(svg, `slide:role='slide'`) {
			metrics.SlidesWithSlideRole++
		}
		metrics.TextCount += strings.Count(svg, "<text")
		metrics.TextCount += strings.Count(svg, `slide:shape-type="text"`)
		metrics.NoteCount += strings.Count(svg, "<slide:note")
		for _, ref := range activeSVGAssetRefs(svg) {
			switch ref.Kind {
			case "image":
				metrics.ImageCount++
			}
			resolvedHref, hrefErr := svgHrefRunPath(slidePath, ref.Href)
			if hrefErr != nil {
				metrics.MissingAssetCount++
				continue
			}
			asset, ok := readyAssets[resolvedHref]
			if !ok {
				metrics.MissingAssetCount++
				continue
			}
			if err := readyAssetLocalAvailability(safeRoot, run, asset); err != nil {
				metrics.MissingAssetCount++
			}
		}
	}
	return metrics, nil
}

func countVisibleLeakMarkers(svg string) int {
	count := 0
	lower := strings.ToLower(visibleSemanticText(svg))
	for _, marker := range []string{
		"sources:",
		"source note",
		"production_instruction",
		"图片要完整",
		"必须让眼镜完整出现",
		"不要裁切",
		"来源来自官网",
	} {
		count += strings.Count(lower, strings.ToLower(marker))
	}
	return count
}

func visibleSemanticText(svg string) string {
	decoder := xml.NewDecoder(strings.NewReader(svg))
	var builder strings.Builder
	excludedDepth := 0
	for {
		token, err := decoder.Token()
		if err != nil {
			if err == io.EOF {
				return builder.String()
			}
			return svg
		}
		switch typed := token.(type) {
		case xml.StartElement:
			if excludedDepth > 0 || semanticTextExcludedElement(typed) {
				excludedDepth++
			}
		case xml.CharData:
			if excludedDepth == 0 {
				builder.WriteByte(' ')
				builder.Write(typed)
			}
		case xml.EndElement:
			if excludedDepth > 0 {
				excludedDepth--
			}
		}
	}
}

func semanticTextExcludedElement(start xml.StartElement) bool {
	if start.Name.Space == slideNamespace && start.Name.Local == "note" {
		return true
	}
	switch start.Name.Local {
	case "defs", "style", "script", "metadata", "title", "desc":
		return true
	default:
		return false
	}
}

func countFontTokens(svg string) int {
	count := 0
	for _, token := range []string{"--font-display", "--font-body", "--font-number", "--font-label"} {
		if strings.Contains(svg, token) {
			count++
		}
	}
	return count
}

func readyAssetLocalAvailability(safeRoot string, run Run, asset deckAsset) error {
	path := assetPath(asset)
	if strings.HasPrefix(path, "https://") {
		if normalizedRouteProfile(run.RouteProfile) == RouteProfileLocalSVGDeck {
			return fmt.Errorf("local_svg_deck ready image asset path %q must be a local assets/images/<file>", path)
		}
		return nil
	}
	info, _, exists, err := lstatRunPath(safeRoot, path)
	if err != nil {
		return err
	}
	if !exists || !info.Mode().IsRegular() {
		return fmt.Errorf("asset path %q is missing or not a regular file", path)
	}
	return nil
}
