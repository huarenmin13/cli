package svglide

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"
)

const chartBriefsPath = "assets/charts/chart_briefs.json"

type chartBriefFile struct {
	PromptContract json.RawMessage   `json:"prompt_contract,omitempty"`
	Charts         []chartBriefEntry `json:"charts"`
}

type chartBriefEntry struct {
	ID             string   `json:"id"`
	SlideID        string   `json:"slide_id"`
	Purpose        string   `json:"purpose"`
	Takeaway       string   `json:"takeaway"`
	Renderer       string   `json:"renderer"`
	SourceIDs      []string `json:"data_source_ids"`
	Unit           string   `json:"unit"`
	MinWidth       int      `json:"min_width,omitempty"`
	MinHeight      int      `json:"min_height,omitempty"`
	FallbackPolicy string   `json:"fallback_policy,omitempty"`
}

func readChartBriefs(safeRoot string) (chartBriefFile, bool, error) {
	exists, err := runRegularFileExists(safeRoot, chartBriefsPath)
	if err != nil {
		return chartBriefFile{}, false, err
	}
	if !exists {
		return chartBriefFile{}, false, nil
	}
	raw, err := readRunRegularArtifact(safeRoot, chartBriefsPath)
	if err != nil {
		return chartBriefFile{}, true, err
	}
	var file chartBriefFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return chartBriefFile{}, true, fmt.Errorf("%s: invalid JSON: %w", chartBriefsPath, err)
	}
	return file, true, nil
}

func ensureEmptyChartBriefsForNoChartDeck(safeRoot string) error {
	if exists, err := runRegularFileExists(safeRoot, chartBriefsPath); err != nil {
		return err
	} else if exists {
		return nil
	}
	content, err := readQualityContent(safeRoot)
	if err != nil {
		return err
	}
	if slideContentHasChartVisual(content) {
		return nil
	}
	run, err := readRunFile(safeRoot)
	if err != nil {
		return err
	}
	contract, err := RequiredPromptContractForStage(StageAssets, run)
	if err != nil {
		return err
	}
	rawContract, err := json.Marshal(contract)
	if err != nil {
		return err
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, chartBriefsPath)
	if err != nil {
		return err
	}
	return writeJSON(target, chartBriefFile{
		PromptContract: rawContract,
		Charts:         []chartBriefEntry{},
	})
}

func ValidateChartBriefsGate(safeRoot string) error {
	content, err := readQualityContent(safeRoot)
	if err != nil {
		return err
	}
	briefs, present, err := readChartBriefs(safeRoot)
	if err != nil {
		return err
	}
	hasChartVisual := slideContentHasChartVisual(content)
	if !present {
		if hasChartVisual {
			return fmt.Errorf("chart_briefs_gate: chart visual exists but %s is missing", chartBriefsPath)
		}
		return nil
	}
	if hasChartVisual && len(briefs.Charts) == 0 {
		return fmt.Errorf("chart_briefs_gate: chart visual exists but %s has no chart briefs", chartBriefsPath)
	}
	for _, entry := range briefs.Charts {
		id := strings.TrimSpace(entry.ID)
		if id == "" {
			return fmt.Errorf("chart_briefs_gate: chart brief id must not be empty")
		}
		if renderer := strings.TrimSpace(entry.Renderer); renderer != requiredChartRendererVegaLite {
			return fmt.Errorf("chart_briefs_gate: chart brief %q renderer = %q, want %q", id, renderer, requiredChartRendererVegaLite)
		}
		if strings.TrimSpace(entry.SlideID) == "" {
			return fmt.Errorf("chart_briefs_gate: chart brief %q slide_id must not be empty", id)
		}
		if strings.TrimSpace(entry.Takeaway) == "" {
			return fmt.Errorf("chart_briefs_gate: chart brief %q takeaway must not be empty", id)
		}
		if len(entry.SourceIDs) == 0 {
			return fmt.Errorf("chart_briefs_gate: chart brief %q data_source_ids must not be empty", id)
		}
	}
	return nil
}

func slideContentHasChartVisual(content qualityContentFile) bool {
	for _, slide := range content.Slides {
		for _, visual := range slide.Visuals {
			if strings.TrimSpace(visual.Type) == "chart" {
				return true
			}
		}
	}
	return false
}

func chartSpecPathForBrief(id string) string {
	return filepath.ToSlash(filepath.Join("assets", "charts", "specs", strings.TrimSpace(id)+".vl.json"))
}

func chartSVGPathForBrief(id string) string {
	return filepath.ToSlash(filepath.Join("assets", "charts", strings.TrimSpace(id)+".svg"))
}
