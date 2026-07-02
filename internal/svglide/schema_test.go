package svglide

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateStageOutputsRejectsMissingRequiredField(t *testing.T) {
	initStatusTestRun(t)
	if err := os.WriteFile(filepath.Join("demo", "request", "request.json"), []byte(`{"title":"Demo"}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected schema validation error")
	}
	if !strings.Contains(err.Error(), "request/request.json") || !strings.Contains(err.Error(), "input") {
		t.Fatalf("error = %v, want path and missing field", err)
	}
}

func TestValidateStageOutputsAcceptsCurrentRequestArtifacts(t *testing.T) {
	initStatusTestRun(t)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatal(err)
	}
}

func TestValidateStageOutputsRejectsInvalidValidatePreviewRepairReceipts(t *testing.T) {
	tests := []struct {
		name  string
		setup func(t *testing.T)
		path  string
	}{
		{
			name: "lint",
			setup: func(t *testing.T) {
				t.Helper()
				if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"failed"}`), 0o644); err != nil {
					t.Fatal(err)
				}
			},
			path: "receipts/lint.json",
		},
		{
			name: "preview",
			setup: func(t *testing.T) {
				t.Helper()
				if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"passed","issues":[]}`), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join("demo", "receipts", "preview.json"), []byte(`{"status":"passed","slides":[{"path":"slides/01.svg","rendered":"yes"}]}`), 0o644); err != nil {
					t.Fatal(err)
				}
			},
			path: "receipts/preview.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
			tt.setup(t)

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected schema validation error")
			}
			if !strings.Contains(err.Error(), tt.path) {
				t.Fatalf("error = %v, want path %s", err, tt.path)
			}
		})
	}
}

func TestValidateStageOutputsRejectsNonCanonicalIntegers(t *testing.T) {
	for _, pages := range []string{"8.0", "8e0", "0.99999999999999999"} {
		t.Run(pages, func(t *testing.T) {
			initStatusTestRun(t)
			raw := `{"title":"Demo","input":"source.md","pages":` + pages + `}`
			if err := os.WriteFile(filepath.Join("demo", "request", "request.json"), []byte(raw), 0o644); err != nil {
				t.Fatal(err)
			}

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected schema validation error")
			}
			if !strings.Contains(err.Error(), "request/request.json") || !strings.Contains(err.Error(), "pages") {
				t.Fatalf("error = %v, want path and pages field", err)
			}
		})
	}
}

func TestCompleteCurrentStageRejectsInvalidCurrentStageOutputSchema(t *testing.T) {
	initStatusTestRun(t)
	if err := os.WriteFile(filepath.Join("demo", "request", "source_manifest.json"), []byte(`{"sources":[{"path":"source.md","type":"remote"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected schema validation error")
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequest {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequest)
	}
	if got := stageStatus(t, run, StageRequest); got == StatusDone {
		t.Fatalf("request stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "request.json")); !os.IsNotExist(statErr) {
		t.Fatalf("receipt should not be written, stat err = %v", statErr)
	}
}
