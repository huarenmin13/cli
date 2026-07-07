package svglide

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const imageUsageReportPath = "receipts/image_usage.json"

type ImageUsageReport struct {
	Status string            `json:"status"`
	Slides []ImageUsageSlide `json:"slides"`
	Issues []ImageUsageIssue `json:"issues"`
}

type ImageUsageSlide struct {
	SlideID      string            `json:"slide_id"`
	CanvasWidth  float64           `json:"canvas_width"`
	CanvasHeight float64           `json:"canvas_height"`
	Assets       []ImageUsageAsset `json:"assets"`
}

type ImageUsageAsset struct {
	AssetID     string  `json:"asset_id"`
	Path        string  `json:"path"`
	Href        string  `json:"href"`
	AssetRole   string  `json:"asset_role"`
	FitRole     string  `json:"fit_role"`
	X           float64 `json:"x"`
	Y           float64 `json:"y"`
	Width       float64 `json:"width"`
	Height      float64 `json:"height"`
	AreaBP      int     `json:"area_bp"`
	UsageStatus string  `json:"usage_status"`
}

type ImageUsageIssue struct {
	Code    string `json:"code"`
	Path    string `json:"path"`
	Message string `json:"message"`
}

func EvaluateImageUsageRun(safeRoot string, deck authorDeck, manifest deckAssetsFile, inventory assetInventoryFile) ImageUsageReport {
	report := ImageUsageReport{Status: "passed", Slides: []ImageUsageSlide{}, Issues: []ImageUsageIssue{}}
	inventoryByPath := inventoryItemByPath(inventory)
	readyAssetsByPath := readyAssetsByPath(manifest)
	usageByPath := map[string]ImageUsageAsset{}
	for _, slide := range deck.Slides {
		slideUsage := ImageUsageSlide{SlideID: strings.TrimSpace(slide.ID), Assets: []ImageUsageAsset{}}
		raw, err := readRunRegularArtifact(safeRoot, strings.TrimSpace(slide.Path))
		if err != nil {
			report.Status = "failed"
			report.Issues = append(report.Issues, ImageUsageIssue{Code: "svglide.image_usage.read_slide", Path: slide.Path, Message: err.Error()})
			report.Slides = append(report.Slides, slideUsage)
			continue
		}
		canvasWidth, canvasHeight := imageUsageCanvasSize(raw)
		slideUsage.CanvasWidth = canvasWidth
		slideUsage.CanvasHeight = canvasHeight
		usages, issues := extractSlideImageUsages(slide.Path, raw, canvasWidth, canvasHeight, readyAssetsByPath, inventoryByPath)
		if len(issues) > 0 {
			report.Status = "failed"
			report.Issues = append(report.Issues, issues...)
		}
		for _, usage := range usages {
			usageByPath[usage.Path] = usage
			slideUsage.Assets = append(slideUsage.Assets, usage)
		}
		report.Slides = append(report.Slides, slideUsage)
	}
	for _, asset := range manifest.Assets {
		if !isRasterImageAsset(asset) {
			continue
		}
		path := assetPath(asset)
		if issue, ok := validateReadyRasterImageAsset(safeRoot, asset); ok {
			report.Status = "failed"
			report.Issues = append(report.Issues, issue)
		}
		item, ok := inventoryByPath[path]
		if !ok {
			continue
		}
		usage, used := usageByPath[path]
		if !used {
			report.Status = "failed"
			report.Issues = append(report.Issues, ImageUsageIssue{Code: "svglide.quality.image_usage_missing", Path: path, Message: fmt.Sprintf("ready image asset %q is not referenced by any slide SVG", assetID(asset))})
			continue
		}
		if item.FitRole == "full_bleed" && usage.AreaBP < 4500 {
			report.Status = "failed"
			report.Issues = append(report.Issues, ImageUsageIssue{Code: "svglide.quality.image_usage_area", Path: path, Message: fmt.Sprintf("asset %q fit_role=full_bleed but SVG area is only %d bp", assetID(asset), usage.AreaBP)})
		}
	}
	return report
}

func validateReadyRasterImageAsset(safeRoot string, asset deckAsset) (ImageUsageIssue, bool) {
	path := assetPath(asset)
	if !shouldDecodeReadyRasterImagePath(path) {
		return ImageUsageIssue{}, false
	}
	if strings.TrimSpace(path) == "" {
		return ImageUsageIssue{
			Code:    "svglide.quality.image_asset_not_decodable",
			Path:    path,
			Message: fmt.Sprintf("ready image asset %q has an empty local path", assetID(asset)),
		}, true
	}
	raw, err := readRunRegularArtifact(safeRoot, path)
	if err != nil {
		if isRunSymlink(safeRoot, path) {
			return ImageUsageIssue{}, false
		}
		return ImageUsageIssue{
			Code:    "svglide.quality.image_asset_not_decodable",
			Path:    path,
			Message: fmt.Sprintf("ready image asset %q cannot be read or decoded: %v", assetID(asset), err),
		}, true
	}
	if err := validateRasterImageBytes(path, raw); err != nil {
		return ImageUsageIssue{
			Code:    "svglide.quality.image_asset_not_decodable",
			Path:    path,
			Message: fmt.Sprintf("ready image asset %q is not a decodable image: %v", assetID(asset), err),
		}, true
	}
	return ImageUsageIssue{}, false
}

func shouldDecodeReadyRasterImagePath(path string) bool {
	path = strings.TrimSpace(path)
	if path == "" {
		return true
	}
	lower := strings.ToLower(path)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") || strings.HasPrefix(lower, "data:") {
		return false
	}
	if isAbsoluteRunPath(path) {
		return false
	}
	return true
}

func isRunSymlink(safeRoot string, rel string) bool {
	path, err := safeRunPath(safeRoot, rel)
	if err != nil {
		return false
	}
	info, err := os.Lstat(path)
	if err != nil {
		return false
	}
	return info.Mode()&os.ModeSymlink != 0
}

func validateRasterImageBytes(path string, raw []byte) error {
	if len(raw) < 16 {
		return fmt.Errorf("file is only %d bytes", len(raw))
	}
	ext := strings.ToLower(filepath.Ext(strings.TrimSpace(path)))
	switch ext {
	case ".webp":
		if isWebPImage(raw) {
			return nil
		}
	case ".avif":
		if isAVIFImage(raw) {
			return nil
		}
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil {
		return err
	}
	if cfg.Width <= 0 || cfg.Height <= 0 {
		return fmt.Errorf("decoded dimensions are %dx%d", cfg.Width, cfg.Height)
	}
	return nil
}

func isWebPImage(raw []byte) bool {
	return len(raw) >= 12 && string(raw[:4]) == "RIFF" && string(raw[8:12]) == "WEBP"
}

func isAVIFImage(raw []byte) bool {
	if len(raw) < 12 {
		return false
	}
	brand := string(raw[4:12])
	return strings.HasPrefix(brand, "ftypavif") || strings.HasPrefix(brand, "ftypavis")
}

func writeImageUsageReport(safeRoot string, report ImageUsageReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, imageUsageReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func extractSlideImageUsages(slidePath string, raw []byte, canvasWidth float64, canvasHeight float64, readyAssetsByPath map[string]deckAsset, inventoryByPath map[string]assetInventoryItem) ([]ImageUsageAsset, []ImageUsageIssue) {
	out := []ImageUsageAsset{}
	issues := []ImageUsageIssue{}
	decoder := xml.NewDecoder(strings.NewReader(string(raw)))
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		start, ok := token.(xml.StartElement)
		if !ok || start.Name.Local != "image" {
			continue
		}
		attrs := parseSVGAttrs(start.Attr)
		href := attrs["href"]
		normalized := normalizeSlideAssetHref(slidePath, href)
		asset, assetOK := readyAssetsByPath[normalized]
		if !assetOK {
			issues = append(issues, ImageUsageIssue{
				Code:    "svglide.quality.image_usage_unregistered",
				Path:    strings.TrimSpace(slidePath),
				Message: fmt.Sprintf("slide SVG image href %q resolves to %q, which is not registered as a ready asset", href, normalized),
			})
			continue
		}
		if !isRasterImageAsset(asset) {
			continue
		}
		item, ok := inventoryByPath[normalized]
		if !ok {
			issues = append(issues, ImageUsageIssue{
				Code:    "svglide.quality.image_usage_missing_inventory",
				Path:    normalized,
				Message: fmt.Sprintf("ready image asset %q is referenced by SVG but missing from asset_inventory", assetID(asset)),
			})
			continue
		}
		width := parseImageUsageFloatAttr(attrs["width"])
		height := parseImageUsageFloatAttr(attrs["height"])
		out = append(out, ImageUsageAsset{
			AssetID:     item.ID,
			Path:        normalized,
			Href:        href,
			AssetRole:   item.AssetRole,
			FitRole:     item.FitRole,
			X:           parseImageUsageFloatAttr(attrs["x"]),
			Y:           parseImageUsageFloatAttr(attrs["y"]),
			Width:       width,
			Height:      height,
			AreaBP:      areaBPForCanvas(width, height, canvasWidth, canvasHeight),
			UsageStatus: "matched",
		})
	}
	return out, issues
}

func imageUsageCanvasSize(raw []byte) (float64, float64) {
	width, height := svgViewBoxSize(string(raw))
	if width <= 0 {
		width = defaultSlideWidth
	}
	if height <= 0 {
		height = defaultSlideHeight
	}
	return width, height
}

func parseSVGAttrs(attrs []xml.Attr) map[string]string {
	out := map[string]string{}
	for _, attr := range attrs {
		out[attr.Name.Local] = attr.Value
		if attr.Name.Space != "" {
			out[attr.Name.Space+":"+attr.Name.Local] = attr.Value
		}
	}
	return out
}

func normalizeSlideAssetHref(slidePath, href string) string {
	href = strings.TrimSpace(href)
	if href == "" || strings.HasPrefix(href, "http://") || strings.HasPrefix(href, "https://") || filepath.IsAbs(href) {
		return strings.TrimPrefix(filepath.ToSlash(href), "./")
	}
	base := filepath.Dir(filepath.ToSlash(slidePath))
	normalized := filepath.Clean(filepath.Join(base, href))
	return strings.TrimPrefix(filepath.ToSlash(normalized), "./")
}

func parseImageUsageFloatAttr(raw string) float64 {
	raw = strings.TrimSpace(strings.TrimSuffix(raw, "px"))
	value, _ := strconv.ParseFloat(raw, 64)
	return value
}

func areaBP(width, height float64) int {
	return areaBPForCanvas(width, height, 1280, 720)
}

func areaBPForCanvas(width, height float64, canvasWidth float64, canvasHeight float64) int {
	if width <= 0 || height <= 0 {
		return 0
	}
	if canvasWidth <= 0 {
		canvasWidth = defaultSlideWidth
	}
	if canvasHeight <= 0 {
		canvasHeight = defaultSlideHeight
	}
	canvasArea := canvasWidth * canvasHeight
	if canvasArea <= 0 {
		return 0
	}
	return int(width * height * 10000 / canvasArea)
}

func readyAssetsByPath(manifest deckAssetsFile) map[string]deckAsset {
	out := map[string]deckAsset{}
	for _, asset := range manifest.Assets {
		if assetStatus(asset) != "ready" {
			continue
		}
		if path := strings.TrimSpace(assetPath(asset)); path != "" {
			out[path] = asset
		}
	}
	return out
}
