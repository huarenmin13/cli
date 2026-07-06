package svglide

import (
	"encoding/json"
	"fmt"
	"net/url"
	"path/filepath"
	"strings"
)

const (
	assetsPlanPath     = "assets/assets_plan.json"
	assetsManifestPath = "assets/assets_manifest.json"
	assetInventoryPath = "assets/asset_inventory.json"
)

type deckAssetsFile struct {
	Assets        []deckAsset `json:"assets"`
	NoImageReason string      `json:"no_image_reason"`
	Mode          string      `json:"mode"`
}

type deckAsset struct {
	ID            string `json:"id"`
	SlideID       string `json:"slide_id"`
	VisualID      string `json:"visual_id"`
	Type          string `json:"type"`
	Kind          string `json:"kind"`
	Path          string `json:"path"`
	LocalPath     string `json:"local_path"`
	SourceURL     string `json:"source_url"`
	Status        string `json:"status"`
	Usage         string `json:"usage"`
	MissingReason string `json:"missing_reason"`
}

type assetInventoryFile struct {
	Items []assetInventoryItem `json:"items"`
}

type assetInventoryItem struct {
	ID                    string `json:"id"`
	Path                  string `json:"path"`
	SourceURL             string `json:"source_url"`
	Width                 int    `json:"width"`
	Height                int    `json:"height"`
	SemanticType          string `json:"semantic_type"`
	LargeOK               bool   `json:"large_ok"`
	FullBleedOK           bool   `json:"full_bleed_ok"`
	RecommendedUse        string `json:"recommended_use"`
	AvoidReason           string `json:"avoid_reason"`
	Format                string `json:"format"`
	HasAlpha              bool   `json:"has_alpha"`
	AssetRole             string `json:"asset_role"`
	FitRole               string `json:"fit_role"`
	CandidateID           string `json:"candidate_id"`
	SelectionReason       string `json:"selection_reason"`
	FormatExceptionReason string `json:"format_exception_reason"`
}

func readDeckAssetsArtifact(safeRoot string, path string) (deckAssetsFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, path)
	if err != nil {
		return deckAssetsFile{}, err
	}
	var file deckAssetsFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return deckAssetsFile{}, fmt.Errorf("read assets artifact %q: %w", path, err)
	}
	return file, nil
}

func readAssetInventory(safeRoot string) (assetInventoryFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, assetInventoryPath)
	if err != nil {
		return assetInventoryFile{}, fmt.Errorf("read asset inventory %q: %w", assetInventoryPath, err)
	}
	var inventory assetInventoryFile
	if err := json.Unmarshal(raw, &inventory); err != nil {
		return assetInventoryFile{}, fmt.Errorf("%s: invalid JSON: %w", assetInventoryPath, err)
	}
	return inventory, nil
}

func readAssetsManifest(safeRoot string) (deckAssetsFile, error) {
	file, err := readDeckAssetsArtifact(safeRoot, assetsManifestPath)
	if err != nil {
		return deckAssetsFile{}, fmt.Errorf("read assets manifest %q: %w", assetsManifestPath, err)
	}
	return file, nil
}

func assetType(asset deckAsset) string {
	if value := strings.TrimSpace(asset.Kind); value != "" {
		return value
	}
	return strings.TrimSpace(asset.Type)
}

func assetPath(asset deckAsset) string {
	if value := strings.TrimSpace(asset.LocalPath); value != "" {
		return value
	}
	return strings.TrimSpace(asset.Path)
}

func assetStatus(asset deckAsset) string {
	return strings.TrimSpace(asset.Status)
}

func assetSlideID(asset deckAsset) string {
	return strings.TrimSpace(asset.SlideID)
}

func assetID(asset deckAsset) string {
	return strings.TrimSpace(asset.ID)
}

func assetExt(asset deckAsset) string {
	raw := assetPath(asset)
	if raw == "" {
		raw = strings.TrimSpace(asset.SourceURL)
	}
	raw = strings.TrimSpace(raw)
	if parsed, err := url.Parse(raw); err == nil && parsed.Path != "" {
		raw = parsed.Path
	}
	if i := strings.IndexAny(raw, "?#"); i >= 0 {
		raw = raw[:i]
	}
	return strings.ToLower(filepath.Ext(raw))
}

func isRasterImageAsset(asset deckAsset) bool {
	if assetStatus(asset) != "ready" || assetType(asset) != "image" {
		return false
	}
	switch assetExt(asset) {
	case ".png", ".jpg", ".jpeg", ".webp", ".avif":
		return true
	default:
		return false
	}
}

func isGeneratedSVGAsset(asset deckAsset) bool {
	if assetStatus(asset) != "ready" {
		return false
	}
	if assetType(asset) == "generated_svg" {
		return true
	}
	return assetExt(asset) == ".svg" && assetType(asset) != "chart"
}

func isChartSVGAsset(asset deckAsset) bool {
	if assetStatus(asset) != "ready" {
		return false
	}
	return assetType(asset) == "chart" && assetExt(asset) == ".svg"
}

func isPreviewWrapperImageAsset(asset deckAsset) bool {
	if assetStatus(asset) != "ready" || assetType(asset) != "image" {
		return false
	}
	normalized := strings.TrimPrefix(filepath.ToSlash(strings.TrimSpace(assetPath(asset))), "./")
	return strings.HasPrefix(normalized, "slides/") && assetExt(asset) == ".svg"
}
