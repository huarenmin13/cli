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
			return "lint and preview passed after reauthoring"
		}
		return "lint and preview passed"
	}
	if report.Reauthored {
		return "repair reauthored slides but lint or preview still failed"
	}
	return "lint or preview failed"
}
