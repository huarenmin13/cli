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
			want: "lark-cli slides +create-svglide --action next --run 'demo dir'",
		},
		{
			root: "demo' dir",
			want: "lark-cli slides +create-svglide --action next --run 'demo'\\'' dir'",
		},
		{
			root: "demo trail ",
			want: "lark-cli slides +create-svglide --action next --run 'demo trail '",
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

func TestNextReturnsCurrentTaskPrompt(t *testing.T) {
	initStatusTestRun(t)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatal(err)
	}

	if next.Stage != StageRequest {
		t.Fatalf("Stage = %q, want %q", next.Stage, StageRequest)
	}
	if next.PromptPath != "prompts/01_request.task.md" {
		t.Fatalf("PromptPath = %q, want prompts/01_request.task.md", next.PromptPath)
	}
	if filepath.IsAbs(next.PromptPath) {
		t.Fatalf("PromptPath = %q, want relative path", next.PromptPath)
	}
	if _, err := os.Stat(filepath.Join("demo", next.PromptPath)); err != nil {
		t.Fatalf("missing prompt %s: %v", next.PromptPath, err)
	}
	if len(next.Inputs) != 0 {
		t.Fatalf("Inputs = %v, want empty", next.Inputs)
	}
	if !slices.Equal(next.Outputs, []string{"request/request.json", "request/source_manifest.json"}) {
		t.Fatalf("Outputs = %v, want request outputs", next.Outputs)
	}
}

func TestInspectStatusRejectsUnsafeRunPath(t *testing.T) {
	t.Chdir(t.TempDir())

	if _, err := InspectStatus("../escape"); err == nil {
		t.Fatal("expected unsafe run path refusal")
	}
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
