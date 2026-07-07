package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestStatusReportsMissingOutputs(t *testing.T) {
	initStatusTestRun(t)
	if err := os.Remove(filepath.Join("demo", "request", "source_manifest.json")); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}

	if status.CurrentStage != StageRequest {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageRequest)
	}
	if !slices.Contains(status.MissingOutputs, "request/source_manifest.json") {
		t.Fatalf("MissingOutputs = %v, want request/source_manifest.json", status.MissingOutputs)
	}
	if len(status.MissingInputs) != 0 {
		t.Fatalf("MissingInputs = %v, want empty", status.MissingInputs)
	}
	if status.NextCommand != "lark-cli slides +create-svglide --action next --run demo" {
		t.Fatalf("NextCommand = %q, want --action next shortcut with caller root", status.NextCommand)
	}
}

func TestStatusQuotesNextCommandRunPath(t *testing.T) {
	tests := []struct {
		root string
		want string
	}{
		{
			root: "demo dir",
			want: "lark-cli slides +create-svglide --action complete --run 'demo dir'",
		},
		{
			root: "demo' dir",
			want: "lark-cli slides +create-svglide --action complete --run 'demo'\\'' dir'",
		},
		{
			root: "demo trail ",
			want: "lark-cli slides +create-svglide --action complete --run 'demo trail '",
		},
	}
	for _, tt := range tests {
		t.Run(tt.root, func(t *testing.T) {
			cwd := initStatusTestRunAt(t, tt.root)

			status, err := InspectStatus(tt.root)
			if err != nil {
				t.Fatal(err)
			}

			if status.NextCommand != tt.want {
				t.Fatalf("NextCommand = %q, want %q", status.NextCommand, tt.want)
			}
			if strings.Contains(status.NextCommand, cwd) {
				t.Fatalf("NextCommand = %q, should not contain absolute safe root %q", status.NextCommand, cwd)
			}
		})
	}
}

func TestStatusPromptsPublishSVGlideWhenOnlineLocalGateReady(t *testing.T) {
	initStatusTestRun(t)
	writePassingOnlineFinalStageArtifactsForTest(t)
	mustWriteOnlineDeliveryReceiptForStatusTest(t)

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}

	want := "lark-cli slides +publish-svglide --as user --run demo"
	if status.NextCommand != want {
		t.Fatalf("NextCommand = %q, want %q", status.NextCommand, want)
	}
}

func TestStatusPromptsCompleteAfterOnlinePublishPassed(t *testing.T) {
	initStatusTestRun(t)
	writePassingOnlineFinalStageArtifactsForTest(t)
	mustWriteOnlineDeliveryReceiptForStatusTest(t)
	mustWritePassedOnlineSlideReportForTest(t)

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}

	want := "lark-cli slides +create-svglide --action complete --run demo"
	if status.NextCommand != want {
		t.Fatalf("NextCommand = %q, want %q", status.NextCommand, want)
	}
}

func TestStatusPromptsPublishSVGlideAtPublishStageUntilPassed(t *testing.T) {
	initStatusTestRun(t)
	writePassingOnlineFinalStageArtifactsForTest(t)
	mustWriteOnlineDeliveryReceiptForStatusTest(t)
	run := readStatusTestRunFile(t)
	run.CurrentStage = StagePublishOnline
	writeStatusTestRunFile(t, run)

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}

	want := "lark-cli slides +publish-svglide --as user --run demo"
	if status.NextCommand != want {
		t.Fatalf("NextCommand = %q, want %q", status.NextCommand, want)
	}
}

func mustWriteOnlineDeliveryReceiptForStatusTest(t *testing.T) {
	t.Helper()
	run := readStatusTestRunFile(t)
	if _, err := writeDeliveryReceiptWithStatus("demo", run, StatusReady); err != nil {
		t.Fatal(err)
	}
}

func TestNextTaskReturnsAnyGenPromptContextAssets(t *testing.T) {
	initStatusTestRun(t)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatal(err)
	}

	if next.Stage != StageRequest {
		t.Fatalf("Stage = %q, want %q", next.Stage, StageRequest)
	}
	if next.PromptManifest != "prompt_manifest.json" {
		t.Fatalf("PromptManifest = %q, want prompt_manifest.json", next.PromptManifest)
	}
	if next.PromptPath != "" {
		t.Fatalf("PromptPath = %q, want empty deprecated field", next.PromptPath)
	}
	if len(next.PromptPaths) != 0 {
		t.Fatalf("PromptPaths = %v, want omitted legacy top-level field", next.PromptPaths)
	}
	got := promptContextAssetPaths(next.AgentTask.PromptContext.Assets)
	for _, want := range []string{
		"skills/lark-slides/references/anygen-svg/mode_system_prompt_svg.md",
		"skills/lark-slides/references/anygen-svg/svg_reference.md",
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("prompt_context assets missing %q:\n%s", want, got)
		}
	}
	if strings.Contains(got, "docs/vendor/anygen-svg/source.full.md") {
		t.Fatalf("prompt_context assets should not include source snapshot:\n%s", got)
	}
	if len(next.Inputs) != 0 {
		t.Fatalf("Inputs = %v, want empty", next.Inputs)
	}
	if !slices.Equal(next.Outputs, []string{"request/request.json", "request/source_manifest.json"}) {
		t.Fatalf("Outputs = %v, want request outputs", next.Outputs)
	}
}

func TestNextTaskSeparatesAnyGenPromptsFromRuntimeAdapter(t *testing.T) {
	initStatusTestRun(t)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}

	if len(next.PromptPaths) != 0 {
		t.Fatalf("PromptPaths = %v, want omitted legacy top-level field", next.PromptPaths)
	}
	gotPrompts := promptContextAssetPaths(next.AgentTask.PromptContext.Assets)
	if strings.Contains(gotPrompts, "lark-slides-create-svglide.md") {
		t.Fatalf("prompt_context assets should contain AnyGen assets only, got:\n%s", gotPrompts)
	}
	if !strings.Contains(gotPrompts, "skills/lark-slides/references/anygen-svg/README.md") {
		t.Fatalf("prompt_context assets missing AnyGen README:\n%s", gotPrompts)
	}
	if len(next.AdapterPaths) != 1 || next.AdapterPaths[0] != "skills/lark-slides/references/lark-slides-create-svglide.md" {
		t.Fatalf("AdapterPaths = %#v, want create-svglide adapter", next.AdapterPaths)
	}
}

func TestPromptContextIncludesLocalRuntimeVisualFloor(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[]}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"visual_system":{}}`)
	setCurrentStageForStatusTest(t, StageAssets)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}

	got := promptContextAssetPaths(next.AgentTask.PromptContext.Assets)
	if !strings.Contains(got, "skills/lark-slides/references/anygen-svg/svglide_local_runtime_binding.md") {
		t.Fatalf("assets stage prompt context missing runtime binding:\n%s", got)
	}
	if !strings.Contains(got, "skills/lark-slides/references/anygen-svg/svglide_visual_quality_overlay.md") {
		t.Fatalf("assets stage prompt context missing visual quality overlay:\n%s", got)
	}
}

func promptContextAssetPaths(assets []PromptContextAsset) string {
	paths := make([]string, 0, len(assets))
	for _, asset := range assets {
		paths = append(paths, asset.Path)
	}
	return strings.Join(paths, "\n")
}

func TestNextTaskDeclaresExecutionModeWithoutApprovalGate(t *testing.T) {
	initStatusTestRun(t)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}

	if next.Mode != "execution" {
		t.Fatalf("Mode = %q, want execution", next.Mode)
	}
	if next.ApprovalRequired {
		t.Fatalf("ApprovalRequired = true, want false")
	}
	if next.BlockingOwner != "svglide-runtime" {
		t.Fatalf("BlockingOwner = %q, want svglide-runtime", next.BlockingOwner)
	}
	if next.BlockingReason != "" {
		t.Fatalf("BlockingReason = %q, want empty", next.BlockingReason)
	}
}

func TestNextTaskReturnsAgentRuntimeProtocolContract(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/research_notes.md", "# research\n")
	setCurrentStageForStatusTest(t, StageDesignBrief)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}

	var payload map[string]any
	raw, err := json.Marshal(next)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatal(err)
	}
	if payload["protocol"] != "anygen-svg-slides" {
		t.Fatalf("protocol = %v, want anygen-svg-slides in next payload: %+v", payload["protocol"], payload)
	}
	agentTask, ok := payload["agent_task"].(map[string]any)
	if !ok {
		t.Fatalf("next.agent_task missing or invalid: %+v", payload)
	}
	if agentTask["stage"] != StageDesignBrief {
		t.Fatalf("agent_task.stage = %v, want %q", agentTask["stage"], StageDesignBrief)
	}
	if agentTask["prompt_context"] == nil {
		t.Fatalf("agent_task.prompt_context missing: %+v", agentTask)
	}
	if payload["prompt_context"] == nil {
		t.Fatalf("next.prompt_context receipt path missing: %+v", payload)
	}
	if _, ok := payload["prompt_contract"].(map[string]any); !ok {
		t.Fatalf("next.prompt_contract missing or invalid: %+v", payload)
	}
	toolContract, ok := payload["tool_invocation_contract"].(map[string]any)
	if !ok {
		t.Fatalf("next.tool_invocation_contract missing or invalid: %+v", payload)
	}
	if !jsonArrayContainsObjectField(toolContract["required_calls"], "id", "resolve_design_brief") {
		t.Fatalf("required_calls missing resolve_design_brief: %+v", toolContract["required_calls"])
	}
}

func TestNextTaskWritesPromptContextReceipt(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/research_notes.md", "# research\n")
	setCurrentStageForStatusTest(t, StageDesignBrief)

	if _, err := NextTask("demo"); err != nil {
		t.Fatalf("NextTask: %v", err)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "prompt_context", StageDesignBrief+".json"))
	if err != nil {
		t.Fatalf("missing prompt context receipt for %s: %v", StageDesignBrief, err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatalf("invalid prompt context receipt: %v", err)
	}
	if receipt["stage"] != StageDesignBrief || receipt["protocol"] != "anygen-svg-slides" {
		t.Fatalf("prompt context receipt = %+v, want design_brief anygen protocol", receipt)
	}
	if _, ok := receipt["asset_hashes"].(map[string]any); !ok {
		t.Fatalf("prompt context receipt missing asset_hashes: %+v", receipt)
	}
	if receipt["agent_task"] == nil || receipt["tool_invocation_contract"] == nil {
		t.Fatalf("prompt context receipt missing agent_task/tool_invocation_contract: %+v", receipt)
	}
}

func TestNextTaskResearchIncludesPPTXConditionalCall(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "resolved", ""))
	run := readStatusTestRunFile(t)
	run.Input = "source.pptx"
	run.Intent.Input = "source.pptx"
	run.RouteProfile = routeProfileImportedPPTX
	run.CurrentStage = StageResearch
	writeStatusTestRunFile(t, run)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}
	if !toolCallsContainID(next.ToolInvocationContract.ConditionalCalls, "slides_convert") {
		t.Fatalf("conditional_calls = %+v, want slides_convert for pptx input", next.ToolInvocationContract.ConditionalCalls)
	}
}

func TestNextTaskResearchIncludesTemplateConditionalCall(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "resolved", ""))
	run := readStatusTestRunFile(t)
	run.RouteProfile = routeProfileTemplateReference
	run.CurrentStage = StageResearch
	writeStatusTestRunFile(t, run)
	mustWriteTestFile(t, filepath.Join("demo", "request", "request.json"), `{"title":"Demo","input":"source.md","template":true}`)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask: %v", err)
	}
	if !toolCallsContainID(next.ToolInvocationContract.ConditionalCalls, "slides_parse_template") {
		t.Fatalf("conditional_calls = %+v, want slides_parse_template for template request", next.ToolInvocationContract.ConditionalCalls)
	}
}

func toolCallsContainID(calls []ToolCallRequirement, id string) bool {
	for _, call := range calls {
		if call.ID == id {
			return true
		}
	}
	return false
}

func TestNextTaskCreatesPromptContextReceiptDirectory(t *testing.T) {
	initStatusTestRun(t)
	if err := os.RemoveAll(filepath.Join("demo", "receipts", "prompt_context")); err != nil {
		t.Fatal(err)
	}

	if _, err := NextTask("demo"); err != nil {
		t.Fatalf("NextTask should create receipts/prompt_context as needed: %v", err)
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "prompt_context", StageRequest+".json")); err != nil {
		t.Fatalf("missing request prompt context receipt: %v", err)
	}
}

func TestInspectStatusRejectsUnsafeRunPath(t *testing.T) {
	t.Chdir(t.TempDir())

	if _, err := InspectStatus("../escape"); err == nil {
		t.Fatal("expected unsafe run path refusal")
	}
}

func jsonArrayContainsObjectField(value any, field string, want string) bool {
	items, ok := value.([]any)
	if !ok {
		return false
	}
	for _, item := range items {
		object, ok := item.(map[string]any)
		if ok && object[field] == want {
			return true
		}
	}
	return false
}

func TestReadRunReadsRunJSONAndRejectsAbsoluteRunPath(t *testing.T) {
	cwd := initStatusTestRun(t)

	run, err := ReadRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if run.Title != "Demo" || run.CurrentStage != StageRequest {
		t.Fatalf("unexpected run: %+v", run)
	}

	if _, err := ReadRun(filepath.Join(cwd, "demo")); err == nil {
		t.Fatal("expected absolute run path refusal")
	}
}

func TestInspectStatusRejectsEscapingStagePath(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageRequest, []string{"../outside.json"})
	writeStatusTestRunFile(t, run)

	if _, err := InspectStatus("demo"); err == nil {
		t.Fatal("expected escaping stage output path refusal")
	}
}

func TestInspectStatusReturnsStatErrorsThatAreNotMissing(t *testing.T) {
	initStatusTestRun(t)
	if err := os.RemoveAll(filepath.Join("demo", "request")); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "request"), []byte("not a directory"), 0o644); err != nil {
		t.Fatal(err)
	}

	if _, err := InspectStatus("demo"); err == nil {
		t.Fatal("expected stat error when output parent is a file")
	}
}

func TestInspectStatusReportsDirectoryArtifactAsMissing(t *testing.T) {
	initStatusTestRun(t)
	path := filepath.Join("demo", "request", "source_manifest.json")
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(path, 0o755); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "request/source_manifest.json") {
		t.Fatalf("MissingOutputs = %v, want directory artifact to be missing", status.MissingOutputs)
	}
}

func TestNextTaskRejectsEscapingStagePath(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageRequest, []string{"../outside.json"})
	writeStatusTestRunFile(t, run)

	if _, err := NextTask("demo"); err == nil {
		t.Fatal("expected escaping stage output path refusal")
	}
}

func TestNextTaskRejectsMissingCurrentStageInputs(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.CurrentStage = StageDesignBrief
	writeStatusTestRunFile(t, run)

	if _, err := NextTask("demo"); err == nil {
		t.Fatal("expected missing current stage inputs to reject next task")
	}
}

func TestNextTaskRejectsResearchMissingSourceManifest(t *testing.T) {
	initStatusTestRun(t)
	if err := os.Remove(filepath.Join("demo", "request", "source_manifest.json")); err != nil {
		t.Fatal(err)
	}
	run := readStatusTestRunFile(t)
	run.CurrentStage = StageResearch
	writeStatusTestRunFile(t, run)

	if _, err := NextTask("demo"); err == nil {
		t.Fatal("expected missing research source manifest to reject next task")
	}
}

func TestNextTaskRejectsOutlineMissingVisualSystem(t *testing.T) {
	initStatusTestRun(t)
	if err := os.WriteFile(filepath.Join("demo", "brief", "design_brief.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	run := readStatusTestRunFile(t)
	run.CurrentStage = StageOutline
	writeStatusTestRunFile(t, run)

	if _, err := NextTask("demo"); err == nil {
		t.Fatal("expected missing outline visual system to reject next task")
	}
}

func TestInspectStatusReportsMissingGlobUntilMatched(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.CurrentStage = StageSVGAuthor
	setStatusTestStageOutputs(t, &run, StageSVGAuthor, []string{"slides/*.svg"})
	writeStatusTestRunFile(t, run)

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "slides/*.svg") {
		t.Fatalf("MissingOutputs = %v, want slides/*.svg", status.MissingOutputs)
	}

	if err := os.WriteFile(filepath.Join("demo", "slides", "01.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	status, err = InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if slices.Contains(status.MissingOutputs, "slides/*.svg") {
		t.Fatalf("MissingOutputs = %v, want glob satisfied by slides/01.svg", status.MissingOutputs)
	}
}

func TestInspectStatusDoesNotSatisfyGlobThroughIntermediateSymlink(t *testing.T) {
	cwd := initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSVGAuthor)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageSVGAuthor, []string{"link/bar/*.svg"})
	writeStatusTestRunFile(t, run)
	outside := filepath.Join(filepath.Dir(cwd), "outside")
	if err := os.MkdirAll(filepath.Join(outside, "bar"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(outside, "bar", "01.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "link")); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "link/bar/*.svg") {
		t.Fatalf("MissingOutputs = %v, want intermediate symlink glob to leave link/bar/*.svg missing", status.MissingOutputs)
	}
}

func TestInspectStatusDoesNotSatisfyArtifactThroughIntermediateSymlink(t *testing.T) {
	cwd := initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageRequest, []string{"link/request.json"})
	writeStatusTestRunFile(t, run)
	outside := filepath.Join(filepath.Dir(cwd), "outside")
	if err := os.MkdirAll(outside, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(outside, "request.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "link")); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "link/request.json") {
		t.Fatalf("MissingOutputs = %v, want intermediate symlink artifact to leave link/request.json missing", status.MissingOutputs)
	}
}

func TestInspectStatusDoesNotSatisfyGlobWithEscapingSymlinkDirectory(t *testing.T) {
	cwd := initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSVGAuthor)
	if err := os.RemoveAll(filepath.Join("demo", "slides")); err != nil {
		t.Fatal(err)
	}
	outsideSlides := filepath.Join(filepath.Dir(cwd), "outside-slides")
	if err := os.MkdirAll(outsideSlides, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(outsideSlides, "01.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outsideSlides, filepath.Join("demo", "slides")); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "slides/*.svg") {
		t.Fatalf("MissingOutputs = %v, want symlink directory glob to leave slides/*.svg missing", status.MissingOutputs)
	}
}

func TestInspectStatusDoesNotSatisfyGlobWithDirectory(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSVGAuthor)
	if err := os.Mkdir(filepath.Join("demo", "slides", "01.svg"), 0o755); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "slides/*.svg") {
		t.Fatalf("MissingOutputs = %v, want directory match to leave slides/*.svg missing", status.MissingOutputs)
	}
}

func TestInspectStatusDoesNotSatisfyGlobWithEscapingSymlink(t *testing.T) {
	cwd := initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSVGAuthor)
	outside := filepath.Join(filepath.Dir(cwd), "outside.svg")
	if err := os.WriteFile(outside, []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join("demo", "slides", "01.svg")); err != nil {
		t.Fatal(err)
	}

	status, err := InspectStatus("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(status.MissingOutputs, "slides/*.svg") {
		t.Fatalf("MissingOutputs = %v, want symlink match to leave slides/*.svg missing", status.MissingOutputs)
	}
}

func TestInspectStatusRejectsInvalidGlobPattern(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageRequest, []string{"slides/[.svg"})
	writeStatusTestRunFile(t, run)

	if _, err := InspectStatus("demo"); err == nil {
		t.Fatal("expected invalid glob pattern error")
	}
}

func TestNextTaskRejectsInvalidGlobPattern(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	setStatusTestStageOutputs(t, &run, StageRequest, []string{"slides/[.svg"})
	writeStatusTestRunFile(t, run)

	if _, err := NextTask("demo"); err == nil {
		t.Fatal("expected invalid glob pattern error")
	}
}

func initStatusTestRun(t *testing.T) string {
	return initStatusTestRunAt(t, "demo")
}

func initStatusTestRunAt(t *testing.T, root string) string {
	t.Helper()
	cwd := t.TempDir()
	t.Chdir(cwd)
	writeDefaultSemanticContractForTest(t)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	initRoot := root
	if trimmed := strings.TrimSpace(root); trimmed != root {
		initRoot = trimmed
	}
	if err := InitRun(initRoot, InitOptions{Title: "Demo", Input: "source.md"}); err != nil {
		t.Fatal(err)
	}
	if initRoot != root {
		if err := os.Rename(initRoot, root); err != nil {
			t.Fatal(err)
		}
	}
	mustWriteTestFile(t, filepath.Join(root, "request", "theme_contract.json"), validThemeContractJSON())
	if err := os.MkdirAll(filepath.Join(root, "receipts", "prompt_context"), 0o755); err != nil {
		t.Fatal(err)
	}
	return cwd
}

func readStatusTestRunFile(t *testing.T) Run {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		t.Fatal(err)
	}
	return run
}

func writeStatusTestRunFile(t *testing.T, run Run) {
	t.Helper()
	raw, err := json.MarshalIndent(run, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	if err := os.WriteFile(filepath.Join("demo", "run.json"), raw, 0o644); err != nil {
		t.Fatal(err)
	}
}

func setStatusTestStageOutputs(t *testing.T, run *Run, stageName string, outputs []string) {
	t.Helper()
	for i := range run.Stages {
		if run.Stages[i].Name == stageName {
			run.Stages[i].Outputs = outputs
			return
		}
	}
	t.Fatalf("missing stage %q", stageName)
}

func setCurrentStageForStatusTest(t *testing.T, stageName string) {
	t.Helper()
	run := readStatusTestRunFile(t)
	run.CurrentStage = stageName
	writeStatusTestRunFile(t, run)
}

func writeDefaultSemanticContractForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, defaultSemanticContractPath, `---
id: anygen_semantic_contract
role: semantic_contract
invocation: reference
rules:
  - id: no_silent_all_diagram_fallback
    kind: explicit_reason_required
    when: deck_has_zero_image_assets
    artifact: assets/assets_manifest.json
    field: no_image_reason
    severity: error
  - id: image_visual_requires_image_asset
    kind: visual_asset_type_match
    visual_type: image
    asset_type: image
    severity: error
  - id: ready_image_and_active_asset_refs_must_render
    kind: svg_contains_asset_href
    asset_type: image
    asset_status: ready
    svg_selector: '<image slide:role="image"'
    severity: error
---

# Test Semantic Contract
`)
}

func testPromptContractField(stage string) string {
	return `"prompt_contract":{"protocol":"anygen-svg-slides","stage":"` + stage + `","orchestrator":"mode_system_prompt_svg","protocol_reference":"svg_reference","required_prompt_ids":["mode_system_prompt_svg","svg_reference"]}`
}
