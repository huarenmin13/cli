package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestCompleteCurrentStageAdvancesToNextStage(t *testing.T) {
	initStatusTestRun(t)

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatal(err)
	}
	if status.CurrentStage != StageRequestResolution {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageRequestResolution)
	}

	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequestResolution {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequestResolution)
	}
	if got := stageStatus(t, run, StageRequest); got != StatusDone {
		t.Fatalf("request stage status = %q, want %q", got, StatusDone)
	}
	if got := stageStatus(t, run, StageRequestResolution); got != StatusPending {
		t.Fatalf("request_resolution stage status = %q, want %q", got, StatusPending)
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

func TestCompleteRequestResolutionAdvancesToResearch(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "resolved", ""))
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatal(err)
	}
	if status.CurrentStage != StageResearch {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageResearch)
	}
	run := readStatusTestRunFile(t)
	if got := stageStatus(t, run, StageRequestResolution); got != StatusDone {
		t.Fatalf("request_resolution stage status = %q, want %q", got, StatusDone)
	}
}

func TestCompleteRequestResolutionRejectsLowConfidenceRealEntity(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 6900, "medium", "resolved", ""))
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected low confidence real entity to block before research")
	}
	if !strings.Contains(err.Error(), "confidence_bp") {
		t.Fatalf("error = %v, want confidence_bp", err)
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequestResolution {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequestResolution)
	}
}

func TestCompleteRequestResolutionRejectsAmbiguityEvenWithQuestion(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "needs_clarification", "你指的是哪一部电影？"))
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected ambiguity to block before research")
	}
	if !strings.Contains(err.Error(), "needs_clarification") {
		t.Fatalf("error = %v, want needs_clarification", err)
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequestResolution {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequestResolution)
	}
}

func TestCompleteRequestResolutionAcceptsTopicOnlyWithResearchRequired(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("topic", 5000, "medium", "resolved", ""))
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatal(err)
	}
	if status.CurrentStage != StageResearch {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageResearch)
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
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"failed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":false}]}`)
	mustWritePassedRenderedVisualForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":1,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWriteDeliveryReceiptForTest(t)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
	writeToolCallReceiptForTest(t, StageValidatePreviewRepair, "finish_slides_edit")

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
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"passed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":true}]}`)
	mustWritePassedRenderedVisualForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"failed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWriteDeliveryReceiptForTest(t)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
	writeToolCallReceiptForTest(t, StageValidatePreviewRepair, "finish_slides_edit")

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

func TestCompleteFinalStageRecomputesSemanticReport(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Image Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Image hook","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening","source_refs":[],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"file:///tmp/secret.png","usage":"Hero image","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><image slide:role="image" href="file:///tmp/secret.png" x="40" y="40" width="320" height="180"/><text x="48" y="260">Claim</text></svg>`)
	mustWriteTestFile(t, "demo/receipts/lint.json", `{"status":"passed","issues":[]}`)
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"passed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":true}]}`)
	mustWritePassedRenderedVisualForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":1,"slides_with_source_refs":1,"slides_with_visuals":1,"slides_with_image_assets":1,"image_coverage_bp":10000,"unique_image_assets":1,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWriteDeliveryReceiptForTest(t)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
	writeToolCallReceiptForTest(t, StageValidatePreviewRepair, "finish_slides_edit")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected final complete to recompute semantic report and reject forged passed report")
	}
	if !strings.Contains(err.Error(), "semantic_gate_failed") {
		t.Fatalf("error = %v, want semantic_gate_failed", err)
	}
}

func TestCompleteFinalStageRegeneratesDeliveryReceipt(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteTestFile(t, "demo/receipts/delivery.json", `{"status":"ready","route_profile":"stale","orchestrator":"stale","runtime_binding":"stale","deck":"outline/deck.json","slides_dir":"slides","slides":["slides/01.svg"],"preview":{"path":"stale.html","status":"passed","missing_asset_count":0},"quality_report":"quality_report.json","anygen_semantic_report":"anygen_semantic_report.json","visual_receipts":"visual_receipts.json","creative_quality_report":"creative_quality_report.json","semantic_metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0},"stage_status":{},"legacy_runtime_executed":false,"legacy_tool_ids":[],"legacy_artifact_matches":[],"core_prompt_ids":[],"observed_prompt_ids":[],"blocked_prompt_ids":[]}`)

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatalf("final completion should regenerate delivery receipt: %v", err)
	}
	if status.CurrentStage != StageValidatePreviewRepair {
		t.Fatalf("CurrentStage = %q, want final stage", status.CurrentStage)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.RouteProfile != RouteProfileLocalSVGDeck || delivery.RuntimeBinding != "svglide_local_runtime_binding" || delivery.Preview.Path != "preview.html" {
		t.Fatalf("delivery was not regenerated from current run: %+v", delivery)
	}
	if delivery.StageStatus[StageValidatePreviewRepair] != StatusDone {
		t.Fatalf("delivery stage_status = %+v, want final stage done", delivery.StageStatus)
	}
}

func TestCompleteFinalStageRejectsLegacyRunArtifactEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteTestFile(t, "demo/legacy/project.slides", "legacy project marker")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected legacy run artifact evidence to block final completion")
	}
	if !strings.Contains(err.Error(), "legacy runtime") || !strings.Contains(err.Error(), "project.slides") {
		t.Fatalf("error = %v, want legacy runtime evidence for project.slides", err)
	}
}

func TestCompleteRejectsMissingPromptContext(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageDesignBrief)
	writeValidDesignBriefOutputs(t)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected missing_prompt_context to reject completing design_brief before next")
	}
	if !strings.Contains(err.Error(), "missing_prompt_context") && !strings.Contains(err.Error(), "prompt context") {
		t.Fatalf("error = %v, want missing_prompt_context", err)
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageDesignBrief {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageDesignBrief)
	}
}

func TestCompleteRejectsStalePromptHash(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageDesignBrief)
	writeValidDesignBriefOutputs(t)
	writePromptContextReceiptForTest(t, StageDesignBrief, map[string]string{
		"mode_system_prompt_svg": "sha256:stale",
		"svg_reference":          "sha256:stale",
		"resolve_design_brief":   "sha256:stale",
	})
	writeToolCallReceiptForTest(t, StageDesignBrief, "resolve_design_brief")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected stale_prompt_context to reject changed prompt hashes")
	}
	if !strings.Contains(err.Error(), "stale_prompt_context") && !strings.Contains(err.Error(), "prompt hash") {
		t.Fatalf("error = %v, want stale_prompt_context", err)
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageDesignBrief {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageDesignBrief)
	}
}

func TestCompleteRejectsMissingRequiredToolCallReceipt(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageDesignBrief)
	writeValidDesignBriefOutputs(t)
	writePromptContextReceiptForTest(t, StageDesignBrief, map[string]string{
		"mode_system_prompt_svg": "",
		"svg_reference":          "",
		"resolve_design_brief":   "",
	})

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected missing_tool_call to reject design_brief without resolve_design_brief receipt")
	}
	if !strings.Contains(err.Error(), "missing_tool_call") && !strings.Contains(err.Error(), "resolve_design_brief") {
		t.Fatalf("error = %v, want missing_tool_call for resolve_design_brief", err)
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageDesignBrief {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageDesignBrief)
	}
}

func TestCompleteRejectsWrongToolCallContract(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageDesignBrief)
	writeValidDesignBriefOutputs(t)
	writePromptContextReceiptForTest(t, StageDesignBrief, map[string]string{})
	writeToolCallReceiptForTest(t, StageDesignBrief, "resolve_design_brief")
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "tool_calls", StageDesignBrief, "resolve_design_brief.json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	receipt["condition"] = "wrong_condition"
	receipt["cardinality"] = "zero_or_more"
	receipt["consumed"] = []string{"request/request.json"}
	updated, err := json.MarshalIndent(receipt, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "tool_calls", StageDesignBrief, "resolve_design_brief.json"), string(append(updated, '\n')))

	_, err = CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected wrong tool call receipt contract to be rejected")
	}
	if !strings.Contains(err.Error(), "receipt contract mismatch") && !strings.Contains(err.Error(), "consumed artifacts") {
		t.Fatalf("error = %v, want tool receipt contract rejection", err)
	}
}

func TestCompleteRejectsForgedEmptyPromptContext(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageDesignBrief)
	writeValidDesignBriefOutputs(t)
	raw, err := json.MarshalIndent(map[string]any{
		"stage":                    StageDesignBrief,
		"protocol":                 "anygen-svg-slides",
		"agent_task":               map[string]any{"stage": StageDesignBrief},
		"prompt_contract":          map[string]any{"stage": StageDesignBrief},
		"tool_invocation_contract": map[string]any{"required_calls": []any{}},
		"asset_hashes":             map[string]string{},
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "prompt_context", StageDesignBrief+".json"), string(append(raw, '\n')))

	_, err = CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected forged empty prompt context to be rejected")
	}
	if !strings.Contains(err.Error(), "missing_prompt_context_asset") {
		t.Fatalf("error = %v, want missing_prompt_context_asset", err)
	}
}

func TestCompleteRecomputesConditionalCustomShapeBBox(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"Custom path","summary":"Custom summary","role":"cover","key_message":"Custom key","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><path slide:role="shape" slide:shape-type="custom" d="M 10 10 L 120 10 L 120 80 Z"/><text x="48" y="160">Custom</text></svg>`)
	writePromptContextReceiptForTest(t, StageSVGAuthor, map[string]string{})
	writeToolCallReceiptForTest(t, StageSVGAuthor, "activate_slides_edit")
	writeToolCallReceiptForTest(t, StageSVGAuthor, "slides_edit")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected custom path SVG to require compute_custom_shape_bbox receipt")
	}
	if !strings.Contains(err.Error(), "missing_tool_call") || !strings.Contains(err.Error(), "compute_custom_shape_bbox") {
		t.Fatalf("error = %v, want missing compute_custom_shape_bbox tool call", err)
	}
}

func TestCompleteDoesNotRequireCustomShapeBBoxForPlainSVG(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"Plain","summary":"Plain summary","role":"cover","key_message":"Plain key","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	writePromptContextReceiptForTest(t, StageSVGAuthor, map[string]string{})
	writeToolCallReceiptForTest(t, StageSVGAuthor, "activate_slides_edit")
	writeToolCallReceiptForTest(t, StageSVGAuthor, "slides_edit")

	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatalf("plain SVG should not require compute_custom_shape_bbox: %v", err)
	}
	if status.CurrentStage != StageValidatePreviewRepair {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageValidatePreviewRepair)
	}
}

func TestLocalSVGDeckDoesNotTriggerLegacyPPTXTools(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.Input = "source.pptx"
	run.Intent.Input = "source.pptx"
	run.RouteProfile = RouteProfileLocalSVGDeck

	calls, err := TriggeredConditionalToolCalls(StageResearch, run, "demo")
	if err != nil {
		t.Fatal(err)
	}
	for _, call := range calls {
		if call.ID == "slides_convert" || call.ID == "slides_parse_template" {
			t.Fatalf("local SVG deck triggered legacy call %+v", call)
		}
	}

	assets, err := PromptAssetsForProfileStage(RouteProfileLocalSVGDeck, StageResearch)
	if err != nil {
		t.Fatal(err)
	}
	for _, asset := range assets {
		if asset.ID == "slides_convert" || asset.ID == "slides_parse_template" {
			t.Fatalf("local SVG deck exposed legacy prompt %+v", asset)
		}
	}
}

func TestValidatePromptContextRejectsProfileDisallowedPrompt(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.RouteProfile = RouteProfileLocalSVGDeck
	writeStatusTestRunFile(t, run)
	writePromptContextReceiptForTest(t, StageResearch, map[string]string{})

	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "prompt_context", StageResearch+".json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt PromptContextReceipt
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	legacyID := "slides_convert"
	receipt.AgentTask.PromptContext.Assets = append(receipt.AgentTask.PromptContext.Assets, PromptContextAsset{
		ID:       legacyID,
		Role:     "tool_prompt",
		Path:     promptPathByID(legacyID),
		SHA256:   promptAssetSHA(promptPathByID(legacyID)),
		Required: false,
	})
	updated, err := json.MarshalIndent(receipt, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "prompt_context", StageResearch+".json"), string(append(updated, '\n')))

	safeRoot, run, err := readRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	_, err = ValidatePromptContextForStage(safeRoot, StageResearch, run)
	if err == nil {
		t.Fatal("expected local prompt context to reject profile-disallowed legacy prompt")
	}
	if !strings.Contains(err.Error(), legacyID) || !strings.Contains(err.Error(), "not allowed") {
		t.Fatalf("error = %v, want disallowed legacy prompt %q", err, legacyID)
	}
}

func TestImportedPPTXProfileTriggersSlidesConvert(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.Input = "source.pptx"
	run.Intent.Input = "source.pptx"
	run.RouteProfile = routeProfileImportedPPTX

	calls, err := TriggeredConditionalToolCalls(StageResearch, run, "demo")
	if err != nil {
		t.Fatal(err)
	}
	if !toolCallsContain(calls, "slides_convert") {
		t.Fatalf("imported_pptx calls = %+v, want slides_convert", calls)
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

func writeValidDesignBriefOutputs(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"narrative_spine":{},"depth":{},"tone":"clear","visual_system":{"color_system":{},"typography":{},"layout_language":{}},"deck_visual_system":{"visual_keywords":["editorial"],"palette":{},"fonts":{"font_display":"Noto Serif CJK SC","font_body":"Noto Sans CJK SC","font_number":"Roboto Mono","font_label":"PingFang SC"},"page_family_budget":{},"asset_strategy":{}}}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"color_system":{},"typography":{},"layout_language":{}}`)
	mustWriteTestFile(t, "demo/brief/typography_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"profile":"editorial_report","roles":{"display":{"family":"Noto Serif CJK SC","weight":"700","size":"42","usage":"cover and section titles"},"body":{"family":"Noto Sans CJK SC","weight":"400","size":"18","usage":"body copy"},"number":{"family":"Roboto Mono","weight":"700","size":"34","usage":"financial figures"},"label":{"family":"PingFang SC","weight":"600","size":"13","usage":"labels and captions"}},"rules":["Use concrete font roles; do not fall back to generic browser stacks."]}`)
}

func validEntityResolutionJSON(entityType string, confidenceBP int, confidenceBand string, ambiguityStatus string, clarificationQuestion string) string {
	return `{"prompt_contract":` + promptContractJSON(StageRequestResolution) + `,"input_text":"给阿嬷的情书","resolved_entity":{"name":"给阿嬷的情书","type":"` + entityType + `","confidence_bp":` + strconv.Itoa(confidenceBP) + `,"confidence_band":"` + confidenceBand + `","reason":"从用户请求识别出的生成对象"},"ambiguity":{"status":"` + ambiguityStatus + `","candidates":[]},"research_required":true,"clarification_question":"` + clarificationQuestion + `"}`
}

func promptContractJSON(stage string) string {
	return `{"protocol":"anygen-svg-slides","stage":"` + stage + `","context_receipt":"receipts/prompt_context/` + stage + `.json","orchestrator":"mode_system_prompt_svg","protocol_reference":"svg_reference","required_prompt_ids":["mode_system_prompt_svg","svg_reference"]}`
}

func writePromptContextReceiptForTest(t *testing.T, stage string, hashes map[string]string) {
	t.Helper()
	run := readStatusTestRunFile(t)
	contract, err := RequiredPromptContractForStage(stage, run)
	if err != nil {
		t.Fatal(err)
	}
	context, err := promptContextForPromptContract(contract)
	if err != nil {
		t.Fatal(err)
	}
	assetHashes := map[string]string{}
	for _, asset := range context.Assets {
		if asset.Required {
			assetHashes[asset.ID] = asset.SHA256
		}
	}
	for id, hash := range hashes {
		if hash == "" {
			if asset, ok := promptContextAssetForTest(context, id); ok {
				hash = asset.SHA256
			} else {
				hash = promptAssetSHA(promptPathByID(id))
			}
		}
		assetHashes[id] = hash
	}
	requiredCalls, err := RequiredToolCallsForStage(stage, run)
	if err != nil {
		t.Fatal(err)
	}
	raw, err := json.MarshalIndent(map[string]any{
		"stage":           stage,
		"protocol":        "anygen-svg-slides",
		"agent_task":      map[string]any{"stage": stage, "prompt_context": context},
		"prompt_contract": contract,
		"asset_hashes":    assetHashes,
		"tool_invocation_contract": map[string]any{
			"protocol":       "anygen-svg-slides",
			"required_calls": requiredCalls,
		},
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "prompt_context", stage+".json"), string(append(raw, '\n')))
}

func writeToolCallReceiptForTest(t *testing.T, stage string, callID string) {
	t.Helper()
	run := readStatusTestRunFile(t)
	calls, err := RequiredToolCallsForStage(stage, run)
	if err != nil {
		t.Fatal(err)
	}
	var call ToolCallRequirement
	found := false
	for _, candidate := range calls {
		if candidate.ID == callID {
			call = candidate
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("missing required call %q for stage %q", callID, stage)
	}
	raw, err := json.MarshalIndent(map[string]any{
		"protocol":          "anygen-svg-slides",
		"stage":             stage,
		"call_id":           callID,
		"prompt_id":         call.PromptID,
		"invocation":        call.Invocation,
		"condition":         call.Condition,
		"condition_matched": true,
		"order":             call.Order,
		"cardinality":       call.Cardinality,
		"consumed":          call.Consumes,
		"produced":          call.Produces,
		"status":            "done",
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "tool_calls", stage, callID+".json"), string(append(raw, '\n')))
}

func writePromptContextReceiptWithoutToolCallsForTest(t *testing.T, stage string) {
	t.Helper()
	run := readStatusTestRunFile(t)
	contract, err := RequiredPromptContractForStage(stage, run)
	if err != nil {
		t.Fatal(err)
	}
	context, err := promptContextForPromptContract(contract)
	if err != nil {
		t.Fatal(err)
	}
	assetHashes := map[string]string{}
	for _, asset := range context.Assets {
		if asset.Required {
			assetHashes[asset.ID] = asset.SHA256
		}
	}
	raw, err := json.MarshalIndent(map[string]any{
		"stage":                    stage,
		"protocol":                 "anygen-svg-slides",
		"agent_task":               map[string]any{"stage": stage, "prompt_context": context},
		"prompt_contract":          contract,
		"tool_invocation_contract": map[string]any{"required_calls": []any{}, "conditional_calls": []any{}},
		"asset_hashes":             assetHashes,
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "prompt_context", stage+".json"), string(append(raw, '\n')))
}

func promptContextAssetForTest(context PromptContext, id string) (PromptContextAsset, bool) {
	for _, asset := range context.Assets {
		if asset.ID == id {
			return asset, true
		}
	}
	return PromptContextAsset{}, false
}

func toolCallsContain(calls []ToolCallRequirement, id string) bool {
	for _, call := range calls {
		if call.ID == id {
			return true
		}
	}
	return false
}

func mustWritePassedSemanticReportForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/anygen_semantic_report.json", `{"status":"passed","contract":{"id":"anygen_semantic_contract","role":"semantic_contract","path":"skills/lark-slides/references/anygen-svg/semantic_contract.md","sha256":"test","rules":1},"metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0},"findings":[]}`)
}

func mustWritePassedRenderedVisualForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/rendered_visual.json", `{"status":"passed","metrics":{"slides":1,"issue_count":0,"out_of_canvas_count":0,"text_overflow_count":0,"text_collision_count":0,"unsafe_edge_count":0},"issues":[],"slides":[{"path":"slides/01.svg","status":"passed","issue_count":0}]}`)
}

func mustWriteBasicVisualReceiptsForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"single_claim_poster","thumbnail_job":"readable title","visual_center":"title block","topic_fit_claim":"matches demo topic","information_density_plan":"one claim with support","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif CJK SC","body":"Noto Sans CJK SC","number":"Roboto Mono","label":"PingFang SC"},"composition_intent":"quiet synthesis","data_visual_rationale":"","source_evidence":["web1 supports claim"],"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)
}

func mustWritePassedCreativeReportForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/creative_quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"visual_receipts":1,"missing_visual_receipts":0,"process_leak_count":0,"generic_font_slide_count":0,"distinct_layout_family_count":1,"distinct_layout_archetype_count":1,"layout_archetype_max_ratio_bp":10000,"adjacent_layout_archetype_count":0,"left_right_chart_archetype_count":0,"layout_signature_max_ratio_bp":10000,"adjacent_layout_repetition_count":0,"fusion_slide_count":0,"fusion_adjacent_count":0,"weak_slide_count":0,"chart_without_evidence_count":0,"warning_count":0}}`)
}

func mustWriteDeliveryReceiptForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/delivery.json", `{"status":"ready","route_profile":"local_svg_deck","orchestrator":"mode_system_prompt_svg","runtime_binding":"svglide_local_runtime_binding","deck":"outline/deck.json","slides_dir":"slides","slides":["slides/01.svg"],"preview":{"path":"preview.html","status":"passed","missing_asset_count":0},"quality_report":"quality_report.json","anygen_semantic_report":"anygen_semantic_report.json","visual_receipts":"visual_receipts.json","creative_quality_report":"creative_quality_report.json","semantic_metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0},"stage_status":{"validate_preview_repair":"pending"},"legacy_runtime_executed":false,"legacy_tool_ids":[],"legacy_artifact_matches":[],"core_prompt_ids":["mode_system_prompt_svg","svg_reference","svglide_local_runtime_binding"],"observed_prompt_ids":[],"blocked_prompt_ids":["slides_convert","slides_parse_template"]}`)
}

func writePassingFinalStageArtifactsForTest(t *testing.T) {
	t.Helper()
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Final Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Opening key","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"single_claim_poster","story_function":"hook","primary_asset_role":"none","fusion_candidate":false,"path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening point","source_refs":["web1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only deck; no image assets required"}`)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteTestFile(t, "demo/receipts/lint.json", `{"status":"passed","issues":[]}`)
	mustWriteTestFile(t, "demo/receipts/preview.json", `{"status":"passed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":true}]}`)
	mustWritePassedRenderedVisualForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":1,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
	writeToolCallReceiptForTest(t, StageValidatePreviewRepair, "finish_slides_edit")
}
