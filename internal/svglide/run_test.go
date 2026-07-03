package svglide

import (
	"reflect"
	"testing"
	"time"
)

func TestDefaultStagesAreOrdered(t *testing.T) {
	stages := DefaultStages()
	want := []string{
		StageRequest,
		StageResearch,
		StageDesignBrief,
		StageOutline,
		StageSlideContent,
		StageAssets,
		StageSVGAuthor,
		StageValidatePreviewRepair,
	}
	if len(stages) != len(want) {
		t.Fatalf("stage count = %d, want %d", len(stages), len(want))
	}
	for i, stage := range stages {
		if stage.Name != want[i] {
			t.Fatalf("stage[%d] = %q, want %q", i, stage.Name, want[i])
		}
		if stage.Status != StatusPending {
			t.Fatalf("stage[%d].Status = %q, want %q", i, stage.Status, StatusPending)
		}
		if stage.Inputs == nil {
			t.Fatalf("stage[%d].Inputs = nil, want stable empty array", i)
		}
		if stage.Outputs == nil {
			t.Fatalf("stage[%d].Outputs = nil, want stable empty array", i)
		}
		if stage.Receipt == "" {
			t.Fatalf("stage[%d] missing receipt path", i)
		}
	}
}

func TestDefaultStagesRequireGeneratedSlideSVGs(t *testing.T) {
	stages := DefaultStages()
	svgAuthor := mustStage(t, stages, StageSVGAuthor)
	if !reflect.DeepEqual(svgAuthor.Outputs, []string{"slides/*.svg"}) {
		t.Fatalf("svg_author Outputs = %v, want slides/*.svg", svgAuthor.Outputs)
	}
	repair := mustStage(t, stages, StageValidatePreviewRepair)
	if !reflect.DeepEqual(repair.Inputs, []string{"slides/*.svg"}) {
		t.Fatalf("validate_preview_repair Inputs = %v, want slides/*.svg", repair.Inputs)
	}
}

func TestDefaultStagesFinalStageRequiresQualityReport(t *testing.T) {
	stages := DefaultStages()
	final := stages[len(stages)-1]
	if final.Name != StageValidatePreviewRepair {
		t.Fatalf("final stage = %q, want %q", final.Name, StageValidatePreviewRepair)
	}
	if !stringSliceContains(final.Outputs, "quality_report.json") {
		t.Fatalf("final outputs = %+v, want quality_report.json", final.Outputs)
	}
}

func TestDefaultStagesResearchInputsMatchPromptContract(t *testing.T) {
	stages := DefaultStages()
	research := mustStage(t, stages, StageResearch)
	want := []string{"request/request.json", "request/source_manifest.json"}
	if !reflect.DeepEqual(research.Inputs, want) {
		t.Fatalf("research Inputs = %v, want %v", research.Inputs, want)
	}
}

func TestDefaultStagesOutlineInputsMatchPromptContract(t *testing.T) {
	stages := DefaultStages()
	outline := mustStage(t, stages, StageOutline)
	want := []string{"brief/design_brief.json", "brief/visual_system.json"}
	if !reflect.DeepEqual(outline.Inputs, want) {
		t.Fatalf("outline Inputs = %v, want %v", outline.Inputs, want)
	}
}

func TestNewRunDefaultsToCodexRuntime(t *testing.T) {
	now := time.Date(2026, 7, 2, 15, 4, 5, 0, time.UTC)
	run := NewRun(NewRunConfig{
		Title:        "Demo",
		Input:        "source.md",
		Audience:     "产品和工程负责人",
		DeliveryMode: "self_read",
		Pages:        8,
		Out:          ".lark-slides/svglide-runs/demo",
		Now:          now,
	})
	if run.Version != 1 {
		t.Fatalf("Version = %d, want 1", run.Version)
	}
	if run.Runtime != "codex" {
		t.Fatalf("Runtime = %q, want codex", run.Runtime)
	}
	if run.Command != "slides +create-svglide" {
		t.Fatalf("Command = %q, want slides +create-svglide", run.Command)
	}
	if run.Title != "Demo" {
		t.Fatalf("Title = %q, want Demo", run.Title)
	}
	if run.Input != "source.md" {
		t.Fatalf("Input = %q, want source.md", run.Input)
	}
	if run.Audience != "产品和工程负责人" {
		t.Fatalf("Audience = %q, want 产品和工程负责人", run.Audience)
	}
	if run.DeliveryMode != "self_read" {
		t.Fatalf("DeliveryMode = %q, want self_read", run.DeliveryMode)
	}
	if run.Pages != 8 {
		t.Fatalf("Pages = %d, want 8", run.Pages)
	}
	if run.Out != ".lark-slides/svglide-runs/demo" {
		t.Fatalf("Out = %q, want .lark-slides/svglide-runs/demo", run.Out)
	}
	wantTS := now.Format(time.RFC3339)
	if run.CreatedAt != wantTS {
		t.Fatalf("CreatedAt = %q, want %q", run.CreatedAt, wantTS)
	}
	if run.UpdatedAt != wantTS {
		t.Fatalf("UpdatedAt = %q, want %q", run.UpdatedAt, wantTS)
	}
	if run.CurrentStage != StageRequest {
		t.Fatalf("CurrentStage = %q, want %q", run.CurrentStage, StageRequest)
	}
	wantArtifacts := ArtifactPaths{
		Deck:        "outline/deck.json",
		SlidesDir:   "slides",
		Preview:     "preview.html",
		RepairQueue: "repair_queue.md",
	}
	if run.Artifacts != wantArtifacts {
		t.Fatalf("Artifacts = %+v, want %+v", run.Artifacts, wantArtifacts)
	}
	wantStages := DefaultStages()
	if !reflect.DeepEqual(run.Stages, wantStages) {
		t.Fatalf("Stages = %+v, want %+v", run.Stages, wantStages)
	}
	wantPolicy := Policy{
		PublishEnabled:         false,
		NetworkByCodex:         true,
		ImageGenerationByCodex: true,
		Overwrite:              false,
	}
	if run.Policy != wantPolicy {
		t.Fatalf("Policy = %+v, want %+v", run.Policy, wantPolicy)
	}
}

func mustStage(t *testing.T, stages []Stage, name string) Stage {
	t.Helper()
	for _, stage := range stages {
		if stage.Name == name {
			return stage
		}
	}
	t.Fatalf("missing stage %q", name)
	return Stage{}
}

func stringSliceContains(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}
