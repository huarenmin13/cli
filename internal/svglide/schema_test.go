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

func TestValidateStageOutputsRejectsDeckSlidePathsThatPreviewRejects(t *testing.T) {
	for _, path := range []string{"slides/a%20.svg", "slides/.hidden.svg", "slides/a..b.svg", "slides/a:b.svg"} {
		t.Run(path, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageOutline)
			mustWriteTestFile(t, "demo/outline/deck.json", validSchemaDeckJSON(path))

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected deck slide path validation error")
			}
			if !strings.Contains(err.Error(), "outline/deck.json") || !strings.Contains(err.Error(), "slides[0].path") {
				t.Fatalf("error = %v, want deck path context", err)
			}
		})
	}
}

func TestCompleteCurrentStageRejectsInvalidDeckSlidePath(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageOutline)
	mustWriteTestFile(t, "demo/outline/deck.json", validSchemaDeckJSON("slides/a%20.svg"))

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected deck slide path validation error")
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageOutline {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageOutline)
	}
	if got := stageStatus(t, run, StageOutline); got == StatusDone {
		t.Fatalf("outline stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "outline.json")); !os.IsNotExist(statErr) {
		t.Fatalf("outline receipt should not be written, stat err = %v", statErr)
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
				if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(validQualityReportJSON()), 0o644); err != nil {
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
				if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(validQualityReportJSON()), 0o644); err != nil {
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

func TestValidateStageOutputsRejectsInvalidQualityReportSchema(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"passed","issues":[]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "receipts", "preview.json"), []byte(`{"status":"passed","slides":[{"path":"slides/01.svg","rendered":true}]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(`{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1}}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected quality report schema validation error")
	}
	if !strings.Contains(err.Error(), "quality_report.json") {
		t.Fatalf("error = %v, want path quality_report.json", err)
	}
}

func TestValidateStageOutputsRejectsSourcesMissingRetrieval(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	if err := os.WriteFile(filepath.Join("demo", "research", "sources.json"), []byte(`{"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"supporting evidence"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected retrieval schema validation error")
	}
	if !strings.Contains(err.Error(), "research/sources.json") || !strings.Contains(err.Error(), "retrieval") {
		t.Fatalf("error = %v, want research/sources.json and retrieval", err)
	}
}

func TestValidateStageOutputsRejectsSlideContentMissingSourceRefsOrVisualIds(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "missing source_refs",
			raw:  `{"slides":[{"id":"s1","content":"Plan","visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}]}]}`,
			want: "source_refs",
		},
		{
			name: "missing visual id",
			raw:  `{"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[{"type":"none","instruction":"No visual needed"}]}]}`,
			want: "visuals[0].id",
		},
		{
			name: "empty visuals",
			raw:  `{"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[]}]}`,
			want: "visuals",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageSlideContent)
			if err := os.WriteFile(filepath.Join("demo", "content", "slide_content.json"), []byte(tt.raw), 0o644); err != nil {
				t.Fatal(err)
			}

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected slide content schema validation error")
			}
			if !strings.Contains(err.Error(), "content/slide_content.json") || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("error = %v, want content/slide_content.json and %s", err, tt.want)
			}
		})
	}
}

func TestValidateStageOutputsRejectsAssetsMissingStatus(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	if err := os.WriteFile(filepath.Join("demo", "assets", "assets_plan.json"), []byte(`{"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","type":"image","path":"https://example.com/a.png","usage":"hero image"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected asset schema validation error")
	}
	if !strings.Contains(err.Error(), "assets/assets_plan.json") || !strings.Contains(err.Error(), "status") {
		t.Fatalf("error = %v, want assets/assets_plan.json and status", err)
	}
}

func TestValidateStageOutputsAcceptsExperimentAssetPaths(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{name: "outside images", path: "../a.png"},
		{name: "dot dot filename", path: "assets/images/hero..png"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageAssets)
			if err := os.WriteFile(filepath.Join("demo", "assets", "assets_plan.json"), []byte(`{"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","type":"image","path":"`+tt.path+`","usage":"hero image","status":"ready"}]}`), 0o644); err != nil {
				t.Fatal(err)
			}

			err := ValidateStageOutputs("demo")
			if err != nil {
				t.Fatalf("expected experiment asset path to pass schema validation, got %v", err)
			}
		})
	}
}

func TestDefaultSchemasIncludeAnyGenQualityContracts(t *testing.T) {
	schemas := DefaultSchemas()
	for _, name := range []string{
		"sources.schema.json",
		"slide_content.schema.json",
		"assets_plan.schema.json",
		"quality.schema.json",
	} {
		if strings.TrimSpace(schemas[name]) == "" {
			t.Fatalf("schema %s is missing", name)
		}
	}
	if !strings.Contains(schemas["sources.schema.json"], `"retrieval"`) {
		t.Fatalf("sources schema missing retrieval contract: %s", schemas["sources.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"source_refs"`) {
		t.Fatalf("slide content schema missing source_refs: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"visuals"`) {
		t.Fatalf("slide content schema missing visuals: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["assets_plan.schema.json"], `"slide_id"`) {
		t.Fatalf("assets schema missing slide_id: %s", schemas["assets_plan.schema.json"])
	}
	for _, want := range []string{`"experiment_unrestricted_assets"`, `"chart"`, `"table"`, `"crop"`, `"deferred"`} {
		if !strings.Contains(schemas["assets_plan.schema.json"], want) {
			t.Fatalf("assets schema missing %s: %s", want, schemas["assets_plan.schema.json"])
		}
	}
	if !strings.Contains(schemas["quality.schema.json"], `"metrics"`) {
		t.Fatalf("quality schema missing metrics: %s", schemas["quality.schema.json"])
	}
}

func validSchemaDeckJSON(path string) string {
	return `{"main_title":"Demo Deck","style_instruction":{"aesthetic_direction":"Editorial report","color_palette":{},"typography":{}},"slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"` + path + `"}]}`
}

func validQualityReportJSON() string {
	return `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":1}}`
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
