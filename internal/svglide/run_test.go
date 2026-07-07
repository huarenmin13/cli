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
		StageRequestResolution,
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
	if !stringSliceContains(final.Outputs, "receipts/chart_quality.json") {
		t.Fatalf("final outputs = %+v, want receipts/chart_quality.json", final.Outputs)
	}
	if !stringSliceContains(final.Outputs, imageUsageReportPath) {
		t.Fatalf("final outputs = %+v, want %s", final.Outputs, imageUsageReportPath)
	}
}

func TestDefaultStagesResearchInputsMatchPromptContract(t *testing.T) {
	stages := DefaultStages()
	research := mustStage(t, stages, StageResearch)
	want := []string{"request/request.json", "request/source_manifest.json", "request/entity_resolution.json", "request/theme_contract.json", deliveryContractPath}
	if !reflect.DeepEqual(research.Inputs, want) {
		t.Fatalf("research Inputs = %v, want %v", research.Inputs, want)
	}
}

func TestDefaultStagesResearchOutputsRequirePlanAndQueries(t *testing.T) {
	stages := DefaultStages()
	research := mustStage(t, stages, StageResearch)
	want := []string{"research/research_plan.json", "research/queries.json", "research/research_notes.md", "research/sources.json", "research/research_coverage.json"}
	if !reflect.DeepEqual(research.Outputs, want) {
		t.Fatalf("research Outputs = %v, want %v", research.Outputs, want)
	}
}

func TestDefaultStagesRequestResolutionIsGateBetweenRequestAndResearch(t *testing.T) {
	stages := DefaultStages()
	requestResolution := mustStage(t, stages, StageRequestResolution)
	if !reflect.DeepEqual(requestResolution.Inputs, []string{"request/request.json", "request/source_manifest.json"}) {
		t.Fatalf("request_resolution Inputs = %v", requestResolution.Inputs)
	}
	if !reflect.DeepEqual(requestResolution.Outputs, []string{"request/entity_resolution.json", "request/theme_contract.json", deliveryContractPath}) {
		t.Fatalf("request_resolution Outputs = %v", requestResolution.Outputs)
	}
	if requestResolution.Receipt != "receipts/request_resolution.json" {
		t.Fatalf("request_resolution Receipt = %q", requestResolution.Receipt)
	}
}

func TestDefaultStagesIncludeThemeContractAfterRequestResolution(t *testing.T) {
	stages := DefaultStages()
	requestResolution := mustStage(t, stages, StageRequestResolution)
	if !stringSliceContains(requestResolution.Outputs, "request/theme_contract.json") {
		t.Fatalf("request_resolution Outputs = %v, want request/theme_contract.json", requestResolution.Outputs)
	}
	for _, stageName := range []string{StageResearch, StageDesignBrief, StageOutline, StageSlideContent, StageAssets, StageSVGAuthor} {
		stage := mustStage(t, stages, stageName)
		if !stringSliceContains(stage.Inputs, "request/theme_contract.json") {
			t.Fatalf("%s Inputs = %v, want request/theme_contract.json", stageName, stage.Inputs)
		}
	}
}

func TestDefaultStagesOutlineInputsMatchPromptContract(t *testing.T) {
	stages := DefaultStages()
	outline := mustStage(t, stages, StageOutline)
	want := []string{"request/theme_contract.json", "brief/design_brief.json", "brief/visual_system.json", "brief/typography_contract.json", "brief/visual_quality_contract.json"}
	if !reflect.DeepEqual(outline.Inputs, want) {
		t.Fatalf("outline Inputs = %v, want %v", outline.Inputs, want)
	}
}

func TestNewRunSeparatesProtocolRuntimeFromAgentRuntime(t *testing.T) {
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
	if run.Runtime != "agent" {
		t.Fatalf("Runtime = %q, want agent", run.Runtime)
	}
	if run.RouteProfile != RouteProfileLocalSVGDeck {
		t.Fatalf("RouteProfile = %q, want %q", run.RouteProfile, RouteProfileLocalSVGDeck)
	}
	if run.Agent.Runtime != "codex" {
		t.Fatalf("Agent.Runtime = %q, want default codex", run.Agent.Runtime)
	}
	if run.Intent.SourceMode != "local_file" || run.Intent.Input != "source.md" {
		t.Fatalf("Intent = %+v, want local_file source.md", run.Intent)
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
	if run.DeliveryTarget != DeliveryTargetLocalPreview {
		t.Fatalf("DeliveryTarget = %q, want %q", run.DeliveryTarget, DeliveryTargetLocalPreview)
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
		OnlineSlide: onlineSlideReportPath,
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
		NetworkByAgent:         true,
		ImageGenerationByAgent: true,
		Overwrite:              false,
	}
	if run.Policy != wantPolicy {
		t.Fatalf("Policy = %+v, want %+v", run.Policy, wantPolicy)
	}
	if run.ExecutionProfile != ExecutionProfileFullChain {
		t.Fatalf("ExecutionProfile = %q, want %q", run.ExecutionProfile, ExecutionProfileFullChain)
	}
	if !run.FullChainRequired {
		t.Fatal("FullChainRequired = false, want true for default runs")
	}
	if run.SmokeTest {
		t.Fatal("SmokeTest = true, want false for default runs")
	}
	if run.ManualPatchAllowed {
		t.Fatal("ManualPatchAllowed = true, want false for full-chain runs")
	}
	if run.ArtifactReusePolicy != ArtifactReusePolicyFreshRunOnly {
		t.Fatalf("ArtifactReusePolicy = %q, want %q", run.ArtifactReusePolicy, ArtifactReusePolicyFreshRunOnly)
	}
}

func TestNewRunOnlineDeliveryAddsPublishStage(t *testing.T) {
	run := NewRun(NewRunConfig{
		Title:          "Online Demo",
		Topic:          "生成真实美观的线上 SVG PPT",
		DeliveryTarget: DeliveryTargetOnlineSlide,
	})
	if run.DeliveryTarget != DeliveryTargetOnlineSlide {
		t.Fatalf("DeliveryTarget = %q, want online_slide", run.DeliveryTarget)
	}
	if !run.Policy.PublishEnabled {
		t.Fatal("PublishEnabled = false, want true")
	}
	final := run.Stages[len(run.Stages)-1]
	if final.Name != StagePublishOnline {
		t.Fatalf("final stage = %q, want %q", final.Name, StagePublishOnline)
	}
	if !stringSliceContains(final.Outputs, onlineSlideReportPath) {
		t.Fatalf("publish outputs = %v, want %s", final.Outputs, onlineSlideReportPath)
	}
}

func TestNewRunSmokeProfileIsExplicitlyMarked(t *testing.T) {
	run := NewRun(NewRunConfig{
		Title:            "Smoke Demo",
		Topic:            "smoke",
		ExecutionProfile: ExecutionProfileSmoke,
	})
	if run.ExecutionProfile != ExecutionProfileSmoke {
		t.Fatalf("ExecutionProfile = %q, want %q", run.ExecutionProfile, ExecutionProfileSmoke)
	}
	if run.FullChainRequired {
		t.Fatal("FullChainRequired = true, want false for smoke runs")
	}
	if !run.SmokeTest {
		t.Fatal("SmokeTest = false, want true for smoke runs")
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
