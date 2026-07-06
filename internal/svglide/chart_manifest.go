package svglide

import (
	"encoding/json"
	"fmt"
	"strings"
)

const chartManifestPath = "assets/charts/chart_manifest.json"

type chartManifestFile struct {
	Renderer       string               `json:"renderer"`
	PromptContract json.RawMessage      `json:"prompt_contract,omitempty"`
	Charts         []chartManifestEntry `json:"charts"`
}

type chartManifestEntry struct {
	ID            string `json:"id"`
	SlideID       string `json:"slide_id"`
	Renderer      string `json:"renderer"`
	BriefID       string `json:"brief_id,omitempty"`
	SpecPath      string `json:"spec_path"`
	SVGPath       string `json:"svg_path"`
	SourceID      string `json:"source_id"`
	Unit          string `json:"unit,omitempty"`
	Takeaway      string `json:"takeaway,omitempty"`
	RenderReceipt string `json:"render_receipt,omitempty"`
}

func readChartManifest(safeRoot string) (chartManifestFile, bool, error) {
	exists, err := runRegularFileExists(safeRoot, chartManifestPath)
	if err != nil {
		return chartManifestFile{}, false, err
	}
	if !exists {
		return chartManifestFile{}, false, nil
	}
	raw, err := readRunRegularArtifact(safeRoot, chartManifestPath)
	if err != nil {
		return chartManifestFile{}, false, err
	}
	var file chartManifestFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return chartManifestFile{}, true, fmt.Errorf("%s: invalid JSON: %w", chartManifestPath, err)
	}
	return file, true, nil
}

func chartEntryRenderer(file chartManifestFile, entry chartManifestEntry) string {
	if value := strings.TrimSpace(entry.Renderer); value != "" {
		return value
	}
	return strings.TrimSpace(file.Renderer)
}

func countVegaLiteSpecEntries(file chartManifestFile) int {
	count := 0
	for _, entry := range file.Charts {
		if chartEntryRenderer(file, entry) == requiredChartRendererVegaLite && strings.TrimSpace(entry.SpecPath) != "" {
			count++
		}
	}
	return count
}

func countChartSVGEntries(file chartManifestFile) int {
	count := 0
	for _, entry := range file.Charts {
		if strings.TrimSpace(entry.SVGPath) != "" {
			count++
		}
	}
	return count
}
