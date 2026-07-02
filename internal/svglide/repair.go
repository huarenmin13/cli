package svglide

import (
	"strings"
)

type RepairReport struct {
	Status     string `json:"status"`
	LintOK     bool   `json:"lint_ok"`
	Preview    string `json:"preview"`
	Reauthored bool   `json:"reauthored"`
}

func RepairRun(root string) (RepairReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return RepairReport{}, err
	}

	lint, validateErr := ValidateRun(root)
	if validateErr != nil {
		return RepairReport{}, validateErr
	}

	reauthored := false
	if validateErr == nil && !lint.OK && canRepairByAuthoring(lint) {
		if _, err := AuthorSlides(root); err != nil {
			return RepairReport{}, err
		}
		reauthored = true
		lint, validateErr = ValidateRun(root)
		if validateErr != nil {
			return RepairReport{}, validateErr
		}
	}

	preview, err := WritePreview(root)
	if err != nil {
		return RepairReport{}, err
	}

	report := RepairReport{
		Status:     "failed",
		LintOK:     lint.OK,
		Preview:    preview.Status,
		Reauthored: reauthored,
	}
	if report.LintOK && report.Preview == "passed" {
		report.Status = "passed"
	}

	previewPath := strings.TrimSpace(run.Artifacts.Preview)
	if previewPath == "" {
		previewPath = defaultPreviewPath
	}
	if err := writeStageReceipt(safeRoot, StageReceipt{
		Stage:   StageValidatePreviewRepair,
		Status:  report.Status,
		Message: repairReceiptMessage(report),
		Artifacts: []string{
			"receipts/lint.json",
			"receipts/preview.json",
			"repair_queue.md",
			previewPath,
		},
	}); err != nil {
		return report, err
	}

	return report, nil
}

func canRepairByAuthoring(report ValidationReport) bool {
	if report.OK || len(report.Issues) == 0 {
		return false
	}
	for _, issue := range report.Issues {
		if !canRepairIssueByAuthoring(issue) {
			return false
		}
	}
	return true
}

func canRepairIssueByAuthoring(issue ValidationIssue) bool {
	path := strings.TrimSpace(issue.Path)
	if _, err := previewSlideObjectPath(path); err != nil {
		return false
	}

	switch strings.TrimSpace(issue.Code) {
	case "svglide.path":
		return strings.Contains(issue.Message, "missing or not a regular file")
	case "svglide.xml", "svglide.root", "svglide.slide_role", "svglide.viewbox", "svglide.visible_content":
		return true
	default:
		return false
	}
}

func repairReceiptMessage(report RepairReport) string {
	if report.Status == "passed" {
		if report.Reauthored {
			return "lint and preview passed after reauthoring"
		}
		return "lint and preview passed"
	}
	if report.Reauthored {
		return "repair reauthored slides but lint or preview still failed"
	}
	return "lint or preview failed"
}
