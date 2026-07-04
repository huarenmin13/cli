package svglide

import (
	"strings"
)

type RepairReport struct {
	Status     string `json:"status"`
	LintOK     bool   `json:"lint_ok"`
	Preview    string `json:"preview"`
	Quality    string `json:"quality"`
	Semantic   string `json:"semantic"`
	Reauthored bool   `json:"reauthored"`
}

type DeliveryReceipt struct {
	Status               string   `json:"status"`
	Deck                 string   `json:"deck"`
	SlidesDir            string   `json:"slides_dir"`
	Slides               []string `json:"slides"`
	Preview              string   `json:"preview"`
	QualityReport        string   `json:"quality_report"`
	AnyGenSemanticReport string   `json:"anygen_semantic_report"`
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
	semantic, err := evaluateSemantic(root)
	if err != nil {
		return RepairReport{}, err
	}

	report := RepairReport{
		Status:     "failed",
		LintOK:     lint.OK,
		Preview:    preview.Status,
		Quality:    quality.Status,
		Semantic:   semantic.Status,
		Reauthored: reauthored,
	}
	if report.LintOK && report.Preview == "passed" && report.Quality == "passed" && report.Semantic == "passed" {
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
		"repair_queue.md",
		previewPath,
	}
	if report.Status == "passed" {
		if _, err := writeDeliveryReceipt(safeRoot, run); err != nil {
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
	for _, rel := range []string{previewPath, "quality_report.json", anyGenSemanticReportPath} {
		if _, err := readRunRegularArtifact(safeRoot, rel); err != nil {
			return DeliveryReceipt{}, err
		}
	}
	slidesDir := strings.TrimSpace(run.Artifacts.SlidesDir)
	if slidesDir == "" {
		slidesDir = "slides"
	}
	receipt := DeliveryReceipt{
		Status:               "ready",
		Deck:                 deckPath,
		SlidesDir:            slidesDir,
		Slides:               slides,
		Preview:              previewPath,
		QualityReport:        "quality_report.json",
		AnyGenSemanticReport: anyGenSemanticReportPath,
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
			return "lint, preview, quality, and semantic report passed after reauthoring"
		}
		return "lint, preview, quality, and semantic report passed"
	}
	if report.LintOK && report.Preview == "passed" && report.Quality != "passed" {
		return "quality gate failed"
	}
	if report.LintOK && report.Preview == "passed" && report.Quality == "passed" && report.Semantic != "passed" {
		return "semantic gate failed"
	}
	if report.Reauthored {
		return "repair reauthored slides but lint or preview still failed"
	}
	return "lint or preview failed"
}
