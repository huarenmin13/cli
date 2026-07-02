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
