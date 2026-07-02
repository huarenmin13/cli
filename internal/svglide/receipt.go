package svglide

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"

	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/internal/vfs"
)

type validationLintReceipt struct {
	Status string            `json:"status"`
	Issues []ValidationIssue `json:"issues"`
}

func writeValidationArtifacts(safeRoot string, report ValidationReport) error {
	report = normalizeValidationReport(report)
	lintPath, err := ensureRunFileTargetForWrite(safeRoot, "receipts/lint.json")
	if err != nil {
		return err
	}
	raw, err := json.MarshalIndent(validationLintReceipt{
		Status: validationReceiptStatus(report),
		Issues: report.Issues,
	}, "", "  ")
	if err != nil {
		return err
	}
	raw = append(raw, '\n')
	if err := validate.AtomicWrite(lintPath, raw, 0o644); err != nil {
		return err
	}
	queuePath, err := ensureRunFileTargetForWrite(safeRoot, "repair_queue.md")
	if err != nil {
		return err
	}
	return validate.AtomicWrite(queuePath, []byte(renderRepairQueue(report)), 0o644)
}

func normalizeValidationReport(report ValidationReport) ValidationReport {
	if report.Issues == nil {
		report.Issues = []ValidationIssue{}
	}
	report.OK = len(report.Issues) == 0
	for i := range report.Issues {
		report.Issues[i].Path = strings.TrimSpace(report.Issues[i].Path)
		if report.Issues[i].Path == "" {
			report.Issues[i].Path = "(deck)"
		}
		report.Issues[i].Code = strings.TrimSpace(report.Issues[i].Code)
		if report.Issues[i].Code == "" {
			report.Issues[i].Code = "svglide.validation"
		}
		report.Issues[i].Severity = strings.TrimSpace(report.Issues[i].Severity)
		if report.Issues[i].Severity == "" {
			report.Issues[i].Severity = "error"
		}
	}
	return report
}

func validationReceiptStatus(report ValidationReport) string {
	if report.OK {
		return "passed"
	}
	return "failed"
}

func renderRepairQueue(report ValidationReport) string {
	if report.OK {
		return "No repair needed.\n"
	}
	var b bytes.Buffer
	b.WriteString("# SVGlide Repair Queue\n\n")
	for _, issue := range report.Issues {
		fmt.Fprintf(&b, "- `%s` [%s]: %s\n", issue.Path, issue.Code, issue.Message)
	}
	return b.String()
}

func ensureRunFileTargetForWrite(safeRoot string, rel string) (string, error) {
	cleanRel := filepath.Clean(rel)
	if cleanRel == "." {
		return "", fmt.Errorf("run file path must not be root")
	}
	dirRel := filepath.Dir(cleanRel)
	if _, err := ensureRunDirectoryForWrite(safeRoot, dirRel); err != nil {
		return "", err
	}
	path, err := safeRunPath(safeRoot, cleanRel)
	if err != nil {
		return "", err
	}
	info, err := vfs.Lstat(path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return path, nil
		}
		return "", err
	}
	if info.Mode()&fs.ModeSymlink != 0 {
		return "", fmt.Errorf("run file path %q must not be a symlink", rel)
	}
	if !info.Mode().IsRegular() {
		return "", fmt.Errorf("run file path %q must be a regular file", rel)
	}
	return path, nil
}

func ensureRunDirectoryForWrite(safeRoot string, rel string) (string, error) {
	path, err := safeRunPath(safeRoot, rel)
	if err != nil {
		return "", err
	}
	cleanRel := filepath.Clean(rel)
	if cleanRel == "." {
		return path, nil
	}
	parts := strings.Split(cleanRel, string(filepath.Separator))
	cur := safeRoot
	for i, part := range parts {
		if part == "" || part == "." {
			continue
		}
		cur = filepath.Join(cur, part)
		info, err := vfs.Lstat(cur)
		if err != nil {
			if !errors.Is(err, fs.ErrNotExist) {
				return "", err
			}
			if err := vfs.Mkdir(cur, 0o755); err != nil {
				info, err = vfs.Lstat(cur)
				if err != nil {
					return "", err
				}
			} else {
				continue
			}
		}
		if info.Mode()&fs.ModeSymlink != 0 {
			return "", fmt.Errorf("run directory path %q must not contain symlink component %q", rel, filepath.Join(parts[:i+1]...))
		}
		if !info.IsDir() {
			return "", fmt.Errorf("run directory path %q component %q is not a directory", rel, filepath.Join(parts[:i+1]...))
		}
	}
	return path, nil
}
