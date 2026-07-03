package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCompleteCurrentStageAdvancesToNextStage(t *testing.T) {
	initStatusTestRun(t)

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatal(err)
	}
	if status.CurrentStage != StageResearch {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageResearch)
	}

	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageResearch {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageResearch)
	}
	if got := stageStatus(t, run, StageRequest); got != StatusDone {
		t.Fatalf("request stage status = %q, want %q", got, StatusDone)
	}
	if got := stageStatus(t, run, StageResearch); got != StatusPending {
		t.Fatalf("research stage status = %q, want %q", got, StatusPending)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "request.json"))
	if err != nil {
		t.Fatalf("missing request receipt: %v", err)
	}
	var receipt StageReceipt
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatalf("invalid request receipt: %v", err)
	}
	if receipt.Stage != StageRequest || receipt.Status != StatusDone {
		t.Fatalf("receipt = %+v, want request done", receipt)
	}
}

func TestCompleteCurrentStageRejectsMissingOutput(t *testing.T) {
	initStatusTestRun(t)
	if err := os.Remove(filepath.Join("demo", "request", "source_manifest.json")); err != nil {
		t.Fatal(err)
	}

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected missing output error")
	}

	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequest {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequest)
	}
}

func TestCompleteCurrentStageDoesNotAdvanceRunWhenReceiptWriteFails(t *testing.T) {
	initStatusTestRun(t)
	if err := os.Mkdir(filepath.Join("demo", "receipts", "request.json"), 0o755); err != nil {
		t.Fatal(err)
	}

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected receipt write error")
	}

	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequest {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequest)
	}
	if got := stageStatus(t, run, StageRequest); got == StatusDone {
		t.Fatalf("request stage status = %q, want not %q", got, StatusDone)
	}
}

func TestCompleteCurrentStageRejectsFailedValidatePreviewRepairReceipts(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteTestFile(t, "demo/receipts/lint.json", `{"status":"failed","issues":[]}`)
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"failed","slides":[{"path":"slides/01.svg","rendered":false}]}`)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":1,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0}}`)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected failed lint/preview receipts to block completion")
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageValidatePreviewRepair {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageValidatePreviewRepair)
	}
	if got := stageStatus(t, run, StageValidatePreviewRepair); got == StatusDone {
		t.Fatalf("validate stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "validate_preview_repair.json")); !os.IsNotExist(statErr) {
		t.Fatalf("final receipt should not be written, stat err = %v", statErr)
	}
}

func TestCompleteCurrentStageRejectsFailedQualityReport(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteTestFile(t, "demo/receipts/lint.json", `{"status":"passed","issues":[]}`)
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"passed","slides":[{"path":"slides/01.svg","rendered":true}]}`)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"failed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0}}`)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected failed quality report to block completion")
	}
	if !strings.Contains(err.Error(), "quality_report.json") && !strings.Contains(err.Error(), "status is \"failed\"") {
		t.Fatalf("error = %v, want quality report failure", err)
	}

	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageValidatePreviewRepair {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageValidatePreviewRepair)
	}
	if got := stageStatus(t, run, StageValidatePreviewRepair); got == StatusDone {
		t.Fatalf("validate stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "validate_preview_repair.json")); !os.IsNotExist(statErr) {
		t.Fatalf("final receipt should not be written, stat err = %v", statErr)
	}
}

func stageStatus(t *testing.T, run Run, name string) string {
	t.Helper()
	for _, stage := range run.Stages {
		if stage.Name == name {
			return stage.Status
		}
	}
	t.Fatalf("missing stage %q", name)
	return ""
}
