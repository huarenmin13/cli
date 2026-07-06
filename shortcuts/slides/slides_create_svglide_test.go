// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/cmdutil"
	"github.com/larksuite/cli/internal/core"
	"github.com/larksuite/cli/shortcuts/common"
	lark "github.com/larksuite/oapi-sdk-go/v3"
)

func TestSlidesCreateSVGlideInitShortcut(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "Demo",
		"--input", "source.md",
		"--audience", "产品负责人",
		"--delivery-mode", "self_read",
		"--pages", "8",
		"--out", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "run.json")); err != nil {
		t.Fatalf("missing run.json: %v", err)
	}
	data := decodeShortcutData(t, stdout)
	if data["action"] != "init" {
		t.Fatalf("action = %v, want init", data["action"])
	}
	if data["run"] != "run-demo" {
		t.Fatalf("run = %v, want run-demo", data["run"])
	}
	if !strings.Contains(stringValue(data["next_command"]), "--action complete --run run-demo") {
		t.Fatalf("next_command = %v, want request bootstrap complete action", data["next_command"])
	}
}

func TestSlidesCreateSVGlideInitShortcutAcceptsTopicOnlyAgentRuntime(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "电影介绍",
		"--topic", "介绍一部电影",
		"--language", "zh",
		"--agent-runtime", "fake-agent",
		"--agent-id", "test-agent-1",
		"--out", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatalf("topic-only init should succeed without --input: %v", err)
	}
	data := decodeShortcutData(t, stdout)
	if data["agent_runtime"] != "fake-agent" {
		t.Fatalf("agent_runtime = %v, want fake-agent; data=%+v", data["agent_runtime"], data)
	}
	if _, ok := data["stage_loop"].([]any); !ok {
		t.Fatalf("stage_loop missing from init response: %+v", data)
	}
	if _, ok := data["final_loop"].([]any); !ok {
		t.Fatalf("final_loop missing from init response: %+v", data)
	}

	runRaw, err := os.ReadFile(filepath.Join(dir, "run-demo", "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run map[string]any
	if err := json.Unmarshal(runRaw, &run); err != nil {
		t.Fatal(err)
	}
	if run["runtime"] == "fake-agent" || run["runtime"] == "codex" {
		t.Fatalf("run.runtime = %v, want agent-neutral protocol runtime", run["runtime"])
	}
	agent, ok := run["agent"].(map[string]any)
	if !ok || agent["runtime"] != "fake-agent" {
		t.Fatalf("run.agent = %+v, want fake-agent", run["agent"])
	}
	intent, ok := run["intent"].(map[string]any)
	if !ok || intent["source_mode"] != "topic" || intent["topic"] != "介绍一部电影" {
		t.Fatalf("run.intent = %+v, want topic intent", run["intent"])
	}
}

func TestSlidesCreateSVGlideAgentRuntimeFlagsRegistered(t *testing.T) {
	for _, name := range []string{"topic", "language", "agent-runtime", "agent-id"} {
		flag := findSVGlideShortcutFlag(t, name)
		if strings.TrimSpace(flag.Desc) == "" {
			t.Fatalf("flag %s missing description", name)
		}
	}
}

func TestSlidesCreateSVGlideRejectsPositionalAction(t *testing.T) {
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"init",
		"--as", "user",
	})
	if err == nil {
		t.Fatal("expected positional argument rejection")
	}
	if !strings.Contains(err.Error(), "positional arguments are not supported") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSlidesCreateSVGlideStatusAndNextActions(t *testing.T) {
	dir := initSVGlideShortcutRun(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "status",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	statusData := decodeShortcutData(t, stdout)
	if statusData["current_stage"] != "request" {
		t.Fatalf("current_stage = %v, want request", statusData["current_stage"])
	}
	if !strings.Contains(stringValue(statusData["next_command"]), "--action complete --run run-demo") {
		t.Fatalf("next_command = %v, want request bootstrap complete action", statusData["next_command"])
	}

	err = runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "next",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	nextData := decodeShortcutData(t, stdout)
	if nextData["stage"] != "request" || nextData["prompt_manifest"] != "prompt_manifest.json" {
		t.Fatalf("next data = %+v, want request prompt manifest", nextData)
	}
	if nextData["mode"] != "execution" {
		t.Fatalf("mode = %v, want execution", nextData["mode"])
	}
	if nextData["approval_required"] != false {
		t.Fatalf("approval_required = %v, want false", nextData["approval_required"])
	}
	if nextData["blocking_owner"] != "svglide-runtime" {
		t.Fatalf("blocking_owner = %v, want svglide-runtime", nextData["blocking_owner"])
	}
	if _, ok := nextData["blocking_reason"]; ok {
		t.Fatalf("blocking_reason should be omitted when empty: %+v", nextData)
	}
	if nextData["prompt_path"] != nil && stringValue(nextData["prompt_path"]) != "" {
		t.Fatalf("prompt_path = %v, want empty deprecated field", nextData["prompt_path"])
	}
	if paths := valuesAsStrings(nextData["prompt_paths"]); len(paths) != 0 {
		t.Fatalf("prompt_paths = %+v, want omitted legacy top-level field", paths)
	}
	agentTask, ok := nextData["agent_task"].(map[string]any)
	if !ok {
		t.Fatalf("agent_task missing from next response: %+v", nextData)
	}
	promptContext, ok := agentTask["prompt_context"].(map[string]any)
	if !ok {
		t.Fatalf("agent_task.prompt_context missing from next response: %+v", nextData)
	}
	paths := promptContextAssetPathsFromShortcutData(promptContext["assets"])
	joined := strings.Join(paths, "\n")
	for _, want := range []string{
		"skills/lark-slides/references/anygen-svg/mode_system_prompt_svg.md",
		"skills/lark-slides/references/anygen-svg/svg_reference.md",
	} {
		if !strings.Contains(joined, want) {
			t.Fatalf("prompt_context assets missing %q: %+v", want, paths)
		}
	}
	if strings.Contains(joined, "docs/vendor/anygen-svg/source.full.md") {
		t.Fatalf("prompt_context assets should not include source snapshot: %+v", paths)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "prompt_manifest.json")); err != nil {
		t.Fatalf("missing prompt manifest: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "prompts")); !os.IsNotExist(err) {
		t.Fatalf("prompts dir err = %v, want not exist", err)
	}
}

func TestSlidesCreateSVGlideLocalOnlySkipsConfigAndSDK(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, _ := cmdutil.TestFactory(t, nil)
	f.Config = func() (*core.CliConfig, error) {
		t.Fatal("local-only +create-svglide must not load config")
		return nil, nil
	}
	f.LarkClient = func() (*lark.Client, error) {
		t.Fatal("local-only +create-svglide must not create Lark SDK client")
		return nil, nil
	}

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "Demo",
		"--input", "source.md",
		"--out", "run-demo",
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "run.json")); err != nil {
		t.Fatalf("missing run.json: %v", err)
	}
}

func TestSlidesCreateSVGlideValidateActionOutputsReport(t *testing.T) {
	initSVGlideShortcutRunWithDeck(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "validate",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["ok"] != true {
		t.Fatalf("ok = %v, want true; data=%+v", data["ok"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "receipts", "lint.json")); err != nil {
		t.Fatalf("missing lint receipt: %v", err)
	}
}

func TestSlidesCreateSVGlidePreviewActionOutputsReport(t *testing.T) {
	initSVGlideShortcutRunWithDeck(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "preview",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "passed" {
		t.Fatalf("status = %v, want passed; data=%+v", data["status"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "preview.html")); err != nil {
		t.Fatalf("missing preview.html: %v", err)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "receipts", "preview.json")); err != nil {
		t.Fatalf("missing preview receipt: %v", err)
	}
}

func TestSlidesCreateSVGlideActionEnumIncludesCompleteAuthorAndRepair(t *testing.T) {
	actionFlag := findSVGlideShortcutFlag(t, "action")
	want := map[string]bool{
		"complete": false,
		"author":   false,
		"quality":  false,
		"repair":   false,
	}
	for _, value := range actionFlag.Enum {
		if _, ok := want[value]; ok {
			want[value] = true
		}
	}
	for value, found := range want {
		if !found {
			t.Fatalf("action enum missing %q: %+v", value, actionFlag.Enum)
		}
		if !strings.Contains(actionFlag.Desc, value) {
			t.Fatalf("action desc %q missing %q", actionFlag.Desc, value)
		}
	}
}

func TestSlidesCreateSVGlideRepairActionAuthorsAndPreviews(t *testing.T) {
	initSVGlideShortcutRunWithAuthorInputs(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "repair",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "passed" {
		t.Fatalf("status = %v, want passed; data=%+v", data["status"], data)
	}
	if data["reauthored"] != true {
		t.Fatalf("reauthored = %v, want true; data=%+v", data["reauthored"], data)
	}
	if data["quality"] != "passed" {
		t.Fatalf("quality = %v, want passed; data=%+v", data["quality"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "preview.html")); err != nil {
		t.Fatalf("missing preview.html: %v", err)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "quality_report.json")); err != nil {
		t.Fatalf("missing quality_report.json: %v", err)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "receipts", "validate_preview_repair.json")); err != nil {
		t.Fatalf("missing final repair receipt: %v", err)
	}
}

func TestSlidesCreateSVGlideQualityActionOutputsReport(t *testing.T) {
	initSVGlideShortcutRunWithAuthorInputs(t)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svglideShortcutVisibleTextSVG())
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "visual_receipts.json"), `{"slides":[{"slide_id":"cover","story_job":"hook","layout_family":"quiet_synthesis","layout_signature":"single_claim_poster","thumbnail_job":"Slide","visual_center":"title claim","topic_fit_claim":"matches demo request","information_density_plan":"one clear point","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif CJK SC","body":"Noto Sans CJK SC","number":"Roboto Mono","label":"PingFang SC"},"composition_intent":"simple quality action fixture","data_visual_rationale":"","source_evidence":["web1 supports claim"],"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "quality",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "passed" {
		t.Fatalf("status = %v, want passed; data=%+v", data["status"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "quality_report.json")); err != nil {
		t.Fatalf("missing quality_report.json: %v", err)
	}
}

func TestSlidesCreateSVGlideCompleteActionAdvancesRequestStage(t *testing.T) {
	dir := initSVGlideShortcutRun(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "complete",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["current_stage"] != "request_resolution" {
		t.Fatalf("current_stage = %v, want request_resolution; data=%+v", data["current_stage"], data)
	}
	receiptPath := filepath.Join(dir, "run-demo", "receipts", "request.json")
	raw, err := os.ReadFile(receiptPath)
	if err != nil {
		t.Fatalf("missing request receipt: %v", err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatalf("invalid request receipt: %v", err)
	}
	if receipt["stage"] != "request" || receipt["status"] != "done" {
		t.Fatalf("receipt = %+v, want request done", receipt)
	}
}

func TestSlidesCreateSVGlideAuthorActionWritesSVG(t *testing.T) {
	initSVGlideShortcutRunWithAuthorInputs(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "author",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "done" {
		t.Fatalf("status = %v, want done; data=%+v", data["status"], data)
	}
	raw, err := os.ReadFile(filepath.Join("run-demo", "slides", "01.svg"))
	if err != nil {
		t.Fatalf("missing authored SVG: %v", err)
	}
	if !strings.Contains(string(raw), `slide:role="slide"`) {
		t.Fatalf("authored SVG missing slide role:\n%s", string(raw))
	}
}

func TestSlidesCreateSVGlideValidateActionDoesNotErrorOnValidationFailure(t *testing.T) {
	initSVGlideShortcutRun(t)
	writeSVGlideShortcutDeck(t, "slides/missing.svg")
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "validate",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["ok"] != false {
		t.Fatalf("ok = %v, want false; data=%+v", data["ok"], data)
	}
}

func TestSlidesCreateSVGlideRegistered(t *testing.T) {
	for _, shortcut := range Shortcuts() {
		if shortcut.Command == "+create-svglide" {
			return
		}
	}
	t.Fatal("slides +create-svglide shortcut is not registered")
}

func initSVGlideShortcutRunWithDeck(t *testing.T) {
	initSVGlideShortcutRun(t)
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svglideShortcutVisibleTextSVG())
}

func initSVGlideShortcutRunWithAuthorInputs(t *testing.T) {
	initSVGlideShortcutRun(t)
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "brief", "visual_system.json"), `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "research", "sources.json"), `{"sources":[{"id":"web1","path":"https://example.com/demo","title":"Demo source","excerpt":"Demo excerpt","usage":"support","retrieval":"full_page"}]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "content", "slide_content.json"), `{"slides":[{"id":"cover","content":"Point A\nPoint B","notes":"Speaker note","source_refs":["web1"],"visuals":[{"id":"none-cover","type":"none","instruction":"Text-only"}]}]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "assets_plan.json"), `{"assets":[],"no_image_reason":"Text-only deck; no image assets required"}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "assets_manifest.json"), `{"assets":[],"no_image_reason":"Text-only deck; no image assets required"}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "image_candidates.json"), `{"requires_real_images":false,"no_image_reason":"Text-only deck; no image assets required","candidates":[]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "asset_inventory.json"), `{"items":[]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "charts", "chart_briefs.json"), `{"charts":[]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "assets", "charts", "chart_manifest.json"), `{"renderer":"none","charts":[]}`)
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "receipts", "chart_render.json"), `{"status":"passed","renderer":"node-vega-lite","charts":[],"issues":[]}`)
}

func initSVGlideShortcutRun(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	writeSVGlideShortcutSemanticContract(t)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))
	if err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "Demo",
		"--input", "source.md",
		"--out", "run-demo",
		"--as", "user",
	}); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join("run-demo", "receipts", "prompt_context"), 0o755); err != nil {
		t.Fatal(err)
	}
	return dir
}

func writeSVGlideShortcutSemanticContract(t *testing.T) {
	t.Helper()
	writeSVGlideShortcutFile(t, filepath.Join("skills", "lark-slides", "references", "anygen-svg", "semantic_contract.md"), `---
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
  - id: ready_image_asset_must_render
    kind: svg_contains_asset_href
    asset_type: image
    asset_status: ready
    svg_selector: '<image slide:role="image"'
    severity: error
---

# Test Semantic Contract
`)
}

func findSVGlideShortcutFlag(t *testing.T, name string) common.Flag {
	t.Helper()
	for _, flag := range SlidesCreateSVGlide.Flags {
		if flag.Name == name {
			return flag
		}
	}
	t.Fatalf("missing flag %q", name)
	return common.Flag{}
}

func writeSVGlideShortcutDeck(t *testing.T, slidePath string) {
	t.Helper()
	deck := map[string]any{
		"title": "Demo",
		"slides": []map[string]any{{
			"id":                 "cover",
			"title":              "Slide",
			"summary":            "Summary",
			"role":               "cover",
			"key_message":        "Message",
			"layout_family":      "quiet_synthesis",
			"layout_signature":   "single_claim_poster",
			"story_function":     "hook",
			"primary_asset_role": "none",
			"fusion_candidate":   false,
			"path":               slidePath,
		}},
	}
	raw, err := json.MarshalIndent(deck, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "outline", "deck.json"), string(raw))
}

func writeSVGlideShortcutFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func svglideShortcutVisibleTextSVG() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><style>:root{--font-display:"Noto Serif CJK SC",serif;--font-body:"Noto Sans CJK SC",sans-serif;--font-number:"Roboto Mono",monospace;--font-label:"PingFang SC",sans-serif;}</style><rect width="960" height="540" fill="#fff"/><text x="48" y="80">Hello</text></svg>`
}

func stringValue(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	var b bytes.Buffer
	_ = json.NewEncoder(&b).Encode(value)
	return strings.TrimSpace(b.String())
}

func valuesAsStrings(value any) []string {
	values, ok := value.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		if text, ok := value.(string); ok {
			out = append(out, text)
		}
	}
	return out
}

func promptContextAssetPathsFromShortcutData(value any) []string {
	values, ok := value.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		object, ok := value.(map[string]any)
		if !ok {
			continue
		}
		if path, ok := object["path"].(string); ok {
			out = append(out, path)
		}
	}
	return out
}
