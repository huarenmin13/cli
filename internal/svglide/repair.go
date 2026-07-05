package svglide

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/larksuite/cli/internal/validate"
)

type RepairReport struct {
	Status     string `json:"status"`
	LintOK     bool   `json:"lint_ok"`
	Preview    string `json:"preview"`
	Quality    string `json:"quality"`
	Creative   string `json:"creative"`
	Semantic   string `json:"semantic"`
	Reauthored bool   `json:"reauthored"`
}

type DeliveryReceipt struct {
	Status                string                  `json:"status"`
	RouteProfile          string                  `json:"route_profile"`
	Orchestrator          string                  `json:"orchestrator"`
	RuntimeBinding        string                  `json:"runtime_binding"`
	Deck                  string                  `json:"deck"`
	SlidesDir             string                  `json:"slides_dir"`
	Slides                []string                `json:"slides"`
	Preview               DeliveryPreviewEvidence `json:"preview"`
	QualityReport         string                  `json:"quality_report"`
	AnyGenSemanticReport  string                  `json:"anygen_semantic_report"`
	VisualReceipts        string                  `json:"visual_receipts"`
	CreativeQualityReport string                  `json:"creative_quality_report"`
	SemanticMetrics       SemanticMetrics         `json:"semantic_metrics"`
	StageStatus           map[string]string       `json:"stage_status"`
	LegacyRuntimeExecuted bool                    `json:"legacy_runtime_executed"`
	LegacyToolIDs         []string                `json:"legacy_tool_ids"`
	LegacyArtifactMatches []string                `json:"legacy_artifact_matches"`
	CorePromptIDs         []string                `json:"core_prompt_ids"`
	ObservedPromptIDs     []string                `json:"observed_prompt_ids"`
	BlockedPromptIDs      []string                `json:"blocked_prompt_ids"`
}

type DeliveryPreviewEvidence struct {
	Path              string `json:"path"`
	Status            string `json:"status"`
	MissingAssetCount int    `json:"missing_asset_count"`
}

func RepairRun(root string) (RepairReport, error) {
	return repairRun(root, EvaluateAnyGenSemantics)
}

func RepairRunWithSemanticContractFile(root string, contractPath string) (RepairReport, error) {
	contract, err := LoadSemanticContractFile(contractPath)
	if err != nil {
		return RepairReport{}, err
	}
	return RepairRunWithSemanticContract(root, contract)
}

func RepairRunWithSemanticContract(root string, contract SemanticContract) (RepairReport, error) {
	return repairRun(root, func(root string) (AnyGenSemanticReport, error) {
		return EvaluateAnyGenSemanticsWithContract(root, contract)
	})
}

func repairRun(root string, evaluateSemantic func(string) (AnyGenSemanticReport, error)) (RepairReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return RepairReport{}, err
	}

	lint, validateErr := ValidateRun(root)
	if validateErr != nil {
		return RepairReport{}, validateErr
	}

	reauthored := false
	if !lint.OK {
		repairPaths, ok := authorRepairPaths(lint)
		if ok {
			if _, err := authorSlides(root, repairPaths); err != nil {
				return RepairReport{}, err
			}
			reauthored = true
			lint, validateErr = ValidateRun(root)
		}
		if validateErr != nil {
			return RepairReport{}, validateErr
		}
	}

	preview, err := WritePreview(root)
	if err != nil {
		return RepairReport{}, err
	}
	quality, err := CheckQuality(root)
	if err != nil {
		return RepairReport{}, err
	}
	if quality.Status != "passed" {
		if err := writeQualityRepairQueue(safeRoot, quality); err != nil {
			return RepairReport{}, err
		}
	}
	semantic, err := evaluateSemantic(root)
	if err != nil {
		return RepairReport{}, err
	}

	report := RepairReport{
		Status:     "failed",
		LintOK:     lint.OK,
		Preview:    preview.Status,
		Quality:    quality.Status,
		Creative:   creativeStatusFromQuality(safeRoot),
		Semantic:   semantic.Status,
		Reauthored: reauthored,
	}
	if report.LintOK && report.Preview == "passed" && report.Quality == "passed" && report.Creative == "passed" && report.Semantic == "passed" {
		report.Status = "passed"
	}

	previewPath := strings.TrimSpace(run.Artifacts.Preview)
	if previewPath == "" {
		previewPath = defaultPreviewPath
	}
	artifacts := []string{
		"receipts/lint.json",
		"receipts/preview.json",
		"quality_report.json",
		anyGenSemanticReportPath,
		visualReceiptsPath,
		creativeQualityReportPath,
		"repair_queue.md",
		previewPath,
	}
	if report.Status == "passed" {
		if _, err := writeDeliveryReceiptWithStatus(safeRoot, run, StatusReady); err != nil {
			return report, err
		}
		artifacts = append(artifacts, deliveryReceiptPath)
	} else if report.LintOK && report.Preview == "passed" {
		if _, err := writeDeliveryReceiptWithStatus(safeRoot, run, StatusNeedsRepair); err != nil {
			return report, err
		}
		artifacts = append(artifacts, deliveryReceiptPath)
	}
	if err := writeStageReceipt(safeRoot, StageReceipt{
		Stage:     StageValidatePreviewRepair,
		Status:    report.Status,
		Message:   repairReceiptMessage(report),
		Artifacts: artifacts,
	}); err != nil {
		return report, err
	}

	return report, nil
}

const deliveryReceiptPath = "receipts/delivery.json"

func writeDeliveryReceipt(safeRoot string, run Run) (DeliveryReceipt, error) {
	return writeDeliveryReceiptWithStatus(safeRoot, run, StatusReady)
}

func writeDeliveryReceiptWithStatus(safeRoot string, run Run, status string) (DeliveryReceipt, error) {
	receipt, err := generateDeliveryReceiptWithStatus(safeRoot, run, status)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	if err := ValidateDeliveryReceiptAgainstRun(receipt, run); err != nil {
		return DeliveryReceipt{}, err
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, deliveryReceiptPath)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	if err := writeJSON(target, receipt); err != nil {
		return DeliveryReceipt{}, err
	}
	return receipt, nil
}

func GenerateDeliveryReceipt(safeRoot string, run Run) (DeliveryReceipt, error) {
	return generateDeliveryReceiptWithStatus(safeRoot, run, StatusReady)
}

func generateDeliveryReceiptWithStatus(safeRoot string, run Run, status string) (DeliveryReceipt, error) {
	status = strings.TrimSpace(status)
	if status == "" {
		status = StatusReady
	}
	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		deckPath = "outline/deck.json"
	}
	deck, err := readAuthorDeck(safeRoot, deckPath)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	slides := make([]string, 0, len(deck.Slides))
	for _, slide := range deck.Slides {
		slidePath, err := previewSlideObjectPath(slide.Path)
		if err != nil {
			return DeliveryReceipt{}, err
		}
		if _, err := readRunRegularArtifact(safeRoot, slidePath); err != nil {
			return DeliveryReceipt{}, err
		}
		slides = append(slides, slidePath)
	}
	previewPath := strings.TrimSpace(run.Artifacts.Preview)
	if previewPath == "" {
		previewPath = defaultPreviewPath
	}
	requiredReports := []string{previewPath, "quality_report.json", anyGenSemanticReportPath, creativeQualityReportPath}
	if status == StatusReady {
		requiredReports = append(requiredReports, visualReceiptsPath)
	}
	for _, rel := range requiredReports {
		if _, err := readRunRegularArtifact(safeRoot, rel); err != nil {
			return DeliveryReceipt{}, err
		}
	}
	slidesDir := strings.TrimSpace(run.Artifacts.SlidesDir)
	if slidesDir == "" {
		slidesDir = "slides"
	}
	preview, err := readDeliveryPreviewEvidence(safeRoot, previewPath)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	semantic, err := readDeliverySemanticReport(safeRoot)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	legacy, err := ScanLegacyRuntimeEvidence(safeRoot, run)
	if err != nil {
		return DeliveryReceipt{}, err
	}
	receipt := DeliveryReceipt{
		Status:                status,
		RouteProfile:          normalizedRouteProfile(run.RouteProfile),
		Orchestrator:          "mode_system_prompt_svg",
		RuntimeBinding:        "svglide_local_runtime_binding",
		Deck:                  deckPath,
		SlidesDir:             slidesDir,
		Slides:                slides,
		Preview:               preview,
		QualityReport:         "quality_report.json",
		AnyGenSemanticReport:  anyGenSemanticReportPath,
		VisualReceipts:        visualReceiptsPath,
		CreativeQualityReport: creativeQualityReportPath,
		SemanticMetrics:       semantic.Metrics,
		StageStatus:           deliveryStageStatus(run),
		LegacyRuntimeExecuted: legacy.LegacyRuntimeExecuted,
		LegacyToolIDs:         legacy.LegacyToolIDs,
		LegacyArtifactMatches: legacy.LegacyArtifactMatches,
		CorePromptIDs:         []string{"mode_system_prompt_svg", "svg_reference", "svglide_local_runtime_binding"},
		ObservedPromptIDs:     legacy.ObservedPromptIDs,
		BlockedPromptIDs:      legacy.BlockedPromptIDs,
	}
	return receipt, nil
}

func creativeStatusFromQuality(safeRoot string) string {
	raw, err := readRunRegularArtifact(safeRoot, creativeQualityReportPath)
	if err != nil {
		return "missing"
	}
	var report CreativeQualityReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return "invalid"
	}
	return strings.TrimSpace(report.Status)
}

func ValidateDeliveryReceiptAgainstRun(receipt DeliveryReceipt, run Run) error {
	if normalizedRouteProfile(run.RouteProfile) == RouteProfileLocalSVGDeck && receipt.LegacyRuntimeExecuted {
		return fmt.Errorf("legacy runtime evidence found for local_svg_deck: tools=%s artifacts=%s", strings.Join(receipt.LegacyToolIDs, ","), strings.Join(receipt.LegacyArtifactMatches, ","))
	}
	return nil
}

type LegacyRuntimeEvidence struct {
	LegacyRuntimeExecuted bool     `json:"legacy_runtime_executed"`
	LegacyToolIDs         []string `json:"legacy_tool_ids"`
	LegacyArtifactMatches []string `json:"legacy_artifact_matches"`
	ObservedPromptIDs     []string `json:"observed_prompt_ids"`
	BlockedPromptIDs      []string `json:"blocked_prompt_ids"`
}

func ScanLegacyRuntimeEvidence(safeRoot string, run Run) (LegacyRuntimeEvidence, error) {
	legacyIDs, blockedIDs, err := legacyPromptIDSets(run)
	if err != nil {
		return LegacyRuntimeEvidence{}, err
	}
	evidence := LegacyRuntimeEvidence{
		LegacyToolIDs:         []string{},
		LegacyArtifactMatches: []string{},
		ObservedPromptIDs:     []string{},
		BlockedPromptIDs:      sortedKeys(blockedIDs),
	}

	toolMatches, err := filepath.Glob(filepath.Join(safeRoot, "receipts", "tool_calls", "*", "*.json"))
	if err != nil {
		return LegacyRuntimeEvidence{}, err
	}
	for _, path := range toolMatches {
		id := strings.TrimSuffix(filepath.Base(path), ".json")
		if !legacyIDs[id] {
			continue
		}
		evidence.LegacyToolIDs = appendUnique(evidence.LegacyToolIDs, id)
		if rel, err := filepath.Rel(safeRoot, path); err == nil {
			evidence.LegacyArtifactMatches = appendUnique(evidence.LegacyArtifactMatches, filepath.ToSlash(rel))
		}
	}

	contextMatches, err := filepath.Glob(filepath.Join(safeRoot, "receipts", "prompt_context", "*.json"))
	if err != nil {
		return LegacyRuntimeEvidence{}, err
	}
	for _, path := range contextMatches {
		raw, err := os.ReadFile(path)
		if err != nil {
			return LegacyRuntimeEvidence{}, err
		}
		var receipt PromptContextReceipt
		if err := json.Unmarshal(raw, &receipt); err != nil {
			return LegacyRuntimeEvidence{}, fmt.Errorf("%s: invalid prompt context JSON: %w", filepath.ToSlash(path), err)
		}
		rel := filepath.ToSlash(path)
		if localRel, err := filepath.Rel(safeRoot, path); err == nil {
			rel = filepath.ToSlash(localRel)
		}
		for id := range promptIDsFromReceipt(receipt) {
			evidence.ObservedPromptIDs = appendUnique(evidence.ObservedPromptIDs, id)
			if blockedIDs[id] {
				evidence.LegacyArtifactMatches = appendUnique(evidence.LegacyArtifactMatches, rel+"#"+id)
			}
		}
	}
	artifactMatches, err := scanLegacyRunArtifacts(safeRoot)
	if err != nil {
		return LegacyRuntimeEvidence{}, err
	}
	for _, match := range artifactMatches {
		evidence.LegacyArtifactMatches = appendUnique(evidence.LegacyArtifactMatches, match)
	}

	sort.Strings(evidence.LegacyToolIDs)
	sort.Strings(evidence.LegacyArtifactMatches)
	sort.Strings(evidence.ObservedPromptIDs)
	evidence.LegacyRuntimeExecuted = len(evidence.LegacyToolIDs) > 0 || len(artifactMatches) > 0 || legacyPromptObserved(evidence.LegacyArtifactMatches, blockedIDs)
	return evidence, nil
}

func scanLegacyRunArtifacts(safeRoot string) ([]string, error) {
	var matches []string
	err := filepath.WalkDir(safeRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path == safeRoot {
			return nil
		}
		rel, err := filepath.Rel(safeRoot, path)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		if legacyRunArtifactMatch(rel) {
			matches = appendUnique(matches, rel)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(matches)
	return matches, nil
}

func legacyRunArtifactMatch(rel string) bool {
	lower := strings.ToLower(filepath.ToSlash(rel))
	base := strings.ToLower(filepath.Base(lower))
	ext := strings.ToLower(filepath.Ext(base))
	switch ext {
	case ".slides", ".pptx", ".sxsd", ".xml":
		return true
	}
	switch base {
	case "converted_pptx_manifest.json",
		"template_manifest.json",
		"sxsd_manifest.json",
		"editor_session.json",
		"publish_receipt.json",
		"readback_receipt.json",
		"live_create_receipt.json":
		return true
	}
	if strings.Contains(lower, "sxsd") || strings.Contains(lower, "legacy_editor") {
		return true
	}
	return false
}

func legacyPromptObserved(matches []string, blockedIDs map[string]bool) bool {
	for _, match := range matches {
		for id := range blockedIDs {
			if strings.HasSuffix(match, "#"+id) {
				return true
			}
		}
	}
	return false
}

func legacyPromptIDSets(run Run) (map[string]bool, map[string]bool, error) {
	assets, err := LoadAnyGenPromptAssets()
	if err != nil {
		return nil, nil, err
	}
	legacyIDs := map[string]bool{}
	blockedIDs := map[string]bool{}
	profile := normalizedRouteProfile(run.RouteProfile)
	for _, asset := range assets {
		if asset.Exposure != "legacy" {
			continue
		}
		legacyIDs[asset.ID] = true
		if !promptAssetAllowedForProfile(asset.Profiles, profile) {
			blockedIDs[asset.ID] = true
		}
	}
	return legacyIDs, blockedIDs, nil
}

func readDeliveryPreviewEvidence(safeRoot string, previewPath string) (DeliveryPreviewEvidence, error) {
	raw, err := readRunRegularArtifact(safeRoot, previewReceiptPath)
	if err != nil {
		return DeliveryPreviewEvidence{}, err
	}
	var report PreviewReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return DeliveryPreviewEvidence{}, fmt.Errorf("%s: invalid JSON: %w", previewReceiptPath, err)
	}
	return DeliveryPreviewEvidence{
		Path:              previewPath,
		Status:            report.Status,
		MissingAssetCount: report.MissingAssetCount,
	}, nil
}

func readDeliverySemanticReport(safeRoot string) (AnyGenSemanticReport, error) {
	raw, err := readRunRegularArtifact(safeRoot, anyGenSemanticReportPath)
	if err != nil {
		return AnyGenSemanticReport{}, err
	}
	var report AnyGenSemanticReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return AnyGenSemanticReport{}, fmt.Errorf("%s: invalid JSON: %w", anyGenSemanticReportPath, err)
	}
	return report, nil
}

func deliveryStageStatus(run Run) map[string]string {
	status := make(map[string]string, len(run.Stages))
	for _, stage := range run.Stages {
		status[stage.Name] = stage.Status
	}
	return status
}

func normalizedRouteProfile(profile string) string {
	profile = strings.TrimSpace(profile)
	if profile == "" {
		return RouteProfileLocalSVGDeck
	}
	return profile
}

func sortedKeys(values map[string]bool) []string {
	out := make([]string, 0, len(values))
	for value := range values {
		out = append(out, value)
	}
	sort.Strings(out)
	return out
}

func canRepairByAuthoring(report ValidationReport) bool {
	_, ok := authorRepairPaths(report)
	return ok
}

func authorRepairPaths(report ValidationReport) (map[string]bool, bool) {
	if report.OK || len(report.Issues) == 0 {
		return nil, false
	}
	paths := make(map[string]bool)
	for _, issue := range report.Issues {
		path, ok := repairIssueAuthorPath(issue)
		if !ok {
			return nil, false
		}
		paths[path] = true
	}
	if len(paths) == 0 {
		return nil, false
	}
	return paths, true
}

func canRepairIssueByAuthoring(issue ValidationIssue) bool {
	_, ok := repairIssueAuthorPath(issue)
	return ok
}

func repairIssueAuthorPath(issue ValidationIssue) (string, bool) {
	path := strings.TrimSpace(issue.Path)
	slidePath, err := previewSlideObjectPath(path)
	if err != nil {
		return "", false
	}

	switch strings.TrimSpace(issue.Code) {
	case "svglide.path":
		return slidePath, strings.Contains(issue.Message, "missing or not a regular file")
	case "svglide.xml", "svglide.root", "svglide.slide_role", "svglide.viewbox", "svglide.visible_content":
		return slidePath, true
	default:
		return "", false
	}
}

func repairReceiptMessage(report RepairReport) string {
	if report.Status == "passed" {
		if report.Reauthored {
			return "lint, preview, quality, creative, and semantic report passed after reauthoring"
		}
		return "lint, preview, quality, creative, and semantic report passed"
	}
	if report.LintOK && report.Preview == "passed" && report.Quality != "passed" {
		return "quality gate failed"
	}
	if report.LintOK && report.Preview == "passed" && report.Quality == "passed" && report.Creative != "passed" {
		return "creative quality gate failed"
	}
	if report.LintOK && report.Preview == "passed" && report.Quality == "passed" && report.Creative == "passed" && report.Semantic != "passed" {
		return "semantic gate failed"
	}
	if report.Reauthored {
		return "repair reauthored slides but lint or preview still failed"
	}
	return "lint or preview failed"
}

func writeQualityRepairQueue(safeRoot string, report QualityReport) error {
	queuePath, err := ensureRunFileTargetForWrite(safeRoot, "repair_queue.md")
	if err != nil {
		return err
	}
	return validate.AtomicWrite(queuePath, []byte(renderQualityRepairQueue(report)), 0o644)
}

func renderQualityRepairQueue(report QualityReport) string {
	if report.Status == "passed" || len(report.Issues) == 0 {
		return "No repair needed.\n"
	}
	var b strings.Builder
	b.WriteString("# SVGlide Repair Queue\n\n")
	for _, issue := range report.Issues {
		fmt.Fprintf(&b, "- `%s` [%s]: %s\n", issue.Path, issue.Code, issue.Message)
		if suggestion := qualityRepairSuggestion(issue.Code); suggestion != "" {
			fmt.Fprintf(&b, "  - Repair: %s\n", suggestion)
		}
	}
	return b.String()
}

func qualityRepairSuggestion(code string) string {
	switch strings.TrimSpace(code) {
	case "svglide.quality.weak_cover":
		return "Rebuild cover with a full-bleed hero image or poster-style composition, reducing copy to one title and one subtitle."
	case "svglide.quality.low_evidence_density":
		return "Add a dense evidence grid or process image matrix using semantically relevant assets."
	case "svglide.quality.repetitive_layout":
		return "Vary slide rhythm across hero, thesis, evidence, detail, comparison, and closing layouts."
	case "svglide.quality.low_semantic_image_coverage":
		return "Replace decorative or generic visuals with images that prove the slide message."
	default:
		return ""
	}
}
