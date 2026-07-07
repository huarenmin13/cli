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
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_delivery_contract")
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_theme_contract")

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
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_delivery_contract")
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_theme_contract")

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
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_delivery_contract")
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_theme_contract")

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
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	writePromptContextReceiptWithoutToolCallsForTest(t, StageRequestResolution)
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_delivery_contract")
	writeToolCallReceiptForTest(t, StageRequestResolution, "resolve_theme_contract")

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
	mustWritePassedImageUsageForTest(t)
	mustWritePassedContentPayloadForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":1,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWritePassedChartQualityForTest(t)
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
	mustWritePassedImageUsageForTest(t)
	mustWritePassedMediaPressureForTest(t)
	mustWritePassedChartRenderForTest(t)
	mustWritePassedChartUsageForTest(t)
	mustWritePassedContentPayloadForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"failed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWritePassedEditorialQualityForTest(t)
	mustWritePassedScreenshotEvidenceForTest(t)
	mustWritePassedChartQualityForTest(t)
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
	mustWritePassedImageUsageForTest(t)
	mustWritePassedMediaPressureForTest(t)
	mustWritePassedChartRenderForTest(t)
	mustWritePassedChartUsageForTest(t)
	mustWritePassedContentPayloadForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":1,"slides_with_source_refs":1,"slides_with_visuals":1,"slides_with_image_assets":1,"image_coverage_bp":10000,"unique_image_assets":1,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWritePassedEditorialQualityForTest(t)
	mustWritePassedScreenshotEvidenceForTest(t)
	mustWritePassedChartQualityForTest(t)
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
	mustWriteTestFile(t, "demo/receipts/delivery.json", `{"status":"ready","route_profile":"stale","orchestrator":"stale","runtime_binding":"stale","deck":"outline/deck.json","slides_dir":"slides","slides":["slides/01.svg"],"preview":{"path":"stale.html","status":"passed","missing_asset_count":0},"quality_report":"quality_report.json","anygen_semantic_report":"anygen_semantic_report.json","visual_receipts":"visual_receipts.json","creative_quality_report":"creative_quality_report.json","semantic_metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0,"parser_unsafe_count":0},"stage_status":{},"legacy_runtime_executed":false,"legacy_tool_ids":[],"legacy_artifact_matches":[],"core_prompt_ids":[],"observed_prompt_ids":[],"blocked_prompt_ids":[]}`)

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

func TestDeliveryRejectsMissingFullChainEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)

	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("final completion should write needs_repair delivery for incomplete chain: %v", err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.Status != StatusNeedsRepair {
		t.Fatalf("delivery status = %q, want %q for missing full-chain receipts: %+v", delivery.Status, StatusNeedsRepair, delivery.FullChainEvidence)
	}
	if delivery.FullChainEvidence.RunJSON != "run.json" || delivery.FullChainEvidence.QualityReport != "quality_report.json" || delivery.FullChainEvidence.RenderedVisual != renderedVisualReceiptPath {
		t.Fatalf("delivery full_chain_evidence missing core artifact paths: %+v", delivery.FullChainEvidence)
	}
	if delivery.FullChainEvidence.StageReceipts[StageResearch] != "" {
		t.Fatalf("research receipt evidence = %q, want empty missing receipt marker", delivery.FullChainEvidence.StageReceipts[StageResearch])
	}
}

func TestDeliveryRejectsOnlineTargetWithoutSVGPublishRequestEvidence(t *testing.T) {
	writePassingOnlineFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteValidatePreviewRepairStageReceiptForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	mustWritePassedOnlineSlideReportForTest(t)

	run := readStatusTestRunFile(t)
	receipt, err := writeDeliveryReceiptWithStatus("demo", run, StatusReady)
	if err != nil {
		t.Fatal(err)
	}
	if receipt.Status != StatusNeedsRepair {
		t.Fatalf("delivery status = %q, want %q when SVG publish request evidence is missing: %+v", receipt.Status, StatusNeedsRepair, receipt.FullChainEvidence)
	}
	if receipt.FullChainEvidence.SVGPublishRequest != "" {
		t.Fatalf("svg publish request evidence = %q, want empty missing marker", receipt.FullChainEvidence.SVGPublishRequest)
	}
}

func TestDeliveryAcceptsOnlineTargetWithSVGPublishRequestEvidence(t *testing.T) {
	writePassingOnlineFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteValidatePreviewRepairStageReceiptForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	mustWritePassedOnlineSlideReportForTest(t)
	if evidence, err := BuildAndWriteSVGPublishRequestEvidence("demo"); err != nil {
		t.Fatalf("BuildAndWriteSVGPublishRequestEvidence failed: %v", err)
	} else if evidence.Status != "passed" || evidence.ContentType != "svg" || evidence.SlideCount != 1 {
		t.Fatalf("publish request evidence = %+v, want one passed SVG slide", evidence)
	}

	run := readStatusTestRunFile(t)
	receipt, err := writeDeliveryReceiptWithStatus("demo", run, StatusReady)
	if err != nil {
		t.Fatal(err)
	}
	if receipt.Status != StatusReady {
		t.Fatalf("delivery status = %q, want %q with complete online SVG evidence: %+v", receipt.Status, StatusReady, receipt.FullChainEvidence)
	}
	if receipt.FullChainEvidence.SVGPublishRequest != svgPublishRequestEvidencePath {
		t.Fatalf("svg publish request evidence = %q, want %q", receipt.FullChainEvidence.SVGPublishRequest, svgPublishRequestEvidencePath)
	}
}

func TestDeliveryMarksManualPatchEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	mustWriteTestFile(t, "demo/receipts/manual_patch.json", `{"applied":true,"files":["slides/01.svg","assets/assets_manifest.json"],"reason":"manual final polish"}`)

	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("final completion should accept explicitly marked manual patch evidence: %v", err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.Status != StatusReady {
		t.Fatalf("delivery status = %q, want %q with complete chain and marked manual patch", delivery.Status, StatusReady)
	}
	manual := delivery.FullChainEvidence.ManualPatch
	if !manual.Applied || len(manual.Files) != 2 || manual.Files[0] != "assets/assets_manifest.json" || manual.Files[1] != "slides/01.svg" || manual.Reason != "manual final polish" {
		t.Fatalf("manual_patch evidence = %+v, want applied files and reason", manual)
	}
}

func TestDeliveryRejectsMissingScreenshotEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	if err := os.Remove(filepath.Join("demo", screenshotEvidenceReportPath)); err != nil {
		t.Fatal(err)
	}

	if _, err := CompleteCurrentStage("demo"); err == nil {
		t.Fatal("expected final completion to reject missing screenshot evidence")
	} else if !strings.Contains(err.Error(), screenshotEvidenceReportPath) {
		t.Fatalf("error = %v, want %s", err, screenshotEvidenceReportPath)
	}
}

func TestDeliveryRejectsMissingPromptManifestEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	if err := os.Remove(filepath.Join("demo", "prompt_manifest.json")); err != nil {
		t.Fatal(err)
	}

	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("final completion should write needs_repair delivery for missing prompt manifest evidence: %v", err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.Status != StatusNeedsRepair {
		t.Fatalf("delivery status = %q, want %q for missing prompt_manifest: %+v", delivery.Status, StatusNeedsRepair, delivery.FullChainEvidence)
	}
	if delivery.FullChainEvidence.PromptManifest != "" {
		t.Fatalf("prompt_manifest evidence = %q, want empty missing marker", delivery.FullChainEvidence.PromptManifest)
	}
}

func TestDeliveryRejectsMissingPromptContextEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	if err := os.Remove(filepath.Join("demo", promptContextReceiptPath(StageResearch))); err != nil {
		t.Fatal(err)
	}

	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("final completion should write needs_repair delivery for missing prompt context evidence: %v", err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.Status != StatusNeedsRepair {
		t.Fatalf("delivery status = %q, want %q for missing prompt context: %+v", delivery.Status, StatusNeedsRepair, delivery.FullChainEvidence)
	}
	if delivery.FullChainEvidence.PromptContextReceipts[StageResearch] != "" {
		t.Fatalf("research prompt context evidence = %q, want empty missing marker", delivery.FullChainEvidence.PromptContextReceipts[StageResearch])
	}
}

func TestDeliveryRejectsInvalidStageReceiptEvidence(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)
	mustWriteTestFile(t, "demo/receipts/research.json", `{"stage":"wrong_stage","status":"done"}`)

	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("final completion should write needs_repair delivery for invalid stage receipt evidence: %v", err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.Status != StatusNeedsRepair {
		t.Fatalf("delivery status = %q, want %q for invalid stage receipt evidence: %+v", delivery.Status, StatusNeedsRepair, delivery.FullChainEvidence)
	}
	if delivery.FullChainEvidence.StageReceipts[StageResearch] != "receipts/research.json" {
		t.Fatalf("research receipt path = %q, want recorded but invalid evidence path", delivery.FullChainEvidence.StageReceipts[StageResearch])
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
	mustWriteTestFile(t, "demo/brief/design_brief.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"narrative_spine":{},"depth":{},"tone":"clear","visual_system":{"color_system":{},"typography":{},"layout_language":{}},"deck_visual_system":{"visual_keywords":["editorial"],"palette":{},"fonts":{"font_display":"Noto Serif SC","font_body":"Noto Sans SC","font_number":"Roboto Mono","font_label":"Noto Sans SC"},"page_family_budget":{},"asset_strategy":{}}}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"color_system":{},"typography":{},"layout_language":{}}`)
	mustWriteTestFile(t, "demo/brief/typography_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"profile":"editorial_report","roles":{"display":{"family":"Noto Serif SC","weight":"700","size":"42","usage":"cover and section titles"},"body":{"family":"Noto Sans SC","weight":"400","size":"18","usage":"body copy"},"number":{"family":"Roboto Mono","weight":"700","size":"34","usage":"financial figures"},"label":{"family":"Noto Sans SC","weight":"600","size":"13","usage":"labels and captions"}},"rules":["Use concrete font roles; do not fall back to generic browser stacks."]}`)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"visual_quality_contract":{"profile":"text_only","requires_real_images":false,"topic_archetype":"","media_pressure":{},"editorial_quality_target":{},"reason":"test fixture with no media pressure"}}`)
}

func validEntityResolutionJSON(entityType string, confidenceBP int, confidenceBand string, ambiguityStatus string, clarificationQuestion string) string {
	return `{"prompt_contract":` + promptContractJSON(StageRequestResolution) + `,"input_text":"给阿嬷的情书","resolved_entity":{"name":"给阿嬷的情书","type":"` + entityType + `","confidence_bp":` + strconv.Itoa(confidenceBP) + `,"confidence_band":"` + confidenceBand + `","reason":"从用户请求识别出的生成对象"},"ambiguity":{"status":"` + ambiguityStatus + `","candidates":[]},"research_required":true,"clarification_question":"` + clarificationQuestion + `"}`
}

func validThemeContractJSON() string {
	return `{"prompt_contract":` + promptContractJSON(StageRequestResolution) + `,"theme_contract":{"content_type":{"primary":"generic_explainer","secondary":[]},"subject_type":{"primary":"topic","named_entity":false,"entity_name":""},"delivery_format":{"primary":"self_read","density":"medium"},"evidence_type":{"primary":"researched_explanation","requires_sources":true},"asset_needs":{"requires_real_images":false,"required_roles":[],"min_real_image_pages":0,"min_dominant_real_image_pages":0,"min_unique_real_images":0,"cover_requires_dominant_real_image":false},"layout_rhythm":{"min_slide_count":8,"min_distinct_layout_archetypes":5,"max_adjacent_same_archetype":0,"required_page_roles":["cover","thesis","evidence","closing"]},"typography_identity":{"profile":"generic_editorial","display_category":"sans","body_category":"sans","number_category":"mono"},"quality_floor":{"profile":"default_floor","reason":"generic fixture"},"rationale":"generic fixture"}}`
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
	mustWriteTestFile(t, "demo/anygen_semantic_report.json", `{"status":"passed","contract":{"id":"anygen_semantic_contract","role":"semantic_contract","path":"skills/lark-slides/references/anygen-svg/semantic_contract.md","sha256":"test","rules":1},"metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0,"parser_unsafe_count":0},"findings":[]}`)
}

func mustWritePassedRenderedVisualForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/rendered_visual.json", `{"status":"passed","metrics":{"slides":1,"issue_count":0,"out_of_canvas_count":0,"text_overflow_count":0,"text_collision_count":0,"unsafe_edge_count":0,"container_text_overflow_count":0,"container_padding_risk_count":0,"foreign_object_overlap_count":0,"tight_line_height_count":0,"bold_overuse_count":0,"small_text_padding_risk_count":0},"issues":[],"slides":[{"path":"slides/01.svg","status":"passed","issue_count":0}]}`)
}

func mustWritePassedImageUsageForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, filepath.Join("demo", imageUsageReportPath), `{"status":"passed","slides":[{"slide_id":"s1","canvas_width":960,"canvas_height":540,"assets":[]}],"issues":[]}`)
}

func mustWritePassedMediaPressureForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, filepath.Join("demo", mediaPressureReportPath), `{"status":"passed","metrics":{"slides":1,"real_image_pages":0,"dominant_real_image_pages":0,"cover_dominant_real_image_pages":0,"max_consecutive_infographic_pages":1,"unique_real_images":0,"issue_count":0},"issues":[],"slides":[{"slide_id":"s1","path":"slides/01.svg","visual_role":"hero_cover","largest_image_area_bp":0,"real_image_count":0,"dominant_real_image":false,"infographic_only":true}],"policy":{"topic_archetype":"","min_real_image_pages":0,"min_dominant_real_image_pages":0,"dominant_image_min_area_bp":3000,"require_cover_dominant_real_image":false,"max_consecutive_infographic_only_pages":0,"min_unique_real_images":0}}`)
}

func mustWritePassedEditorialQualityForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, filepath.Join("demo", editorialQualityReportPath), `{"status":"passed","score":100,"metrics":{"slides":1,"media_pressure_issue_count":0,"dominant_real_image_pages":0,"max_consecutive_infographic_pages":1,"card_dominant_ratio_bp":0,"shape_language_max_ratio_bp":0,"creative_error_count":0,"issue_count":0},"issues":[],"target":{}}`)
}

func mustWritePassedScreenshotEvidenceForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/screenshots/01.png", "png")
	mustWriteTestFile(t, filepath.Join("demo", screenshotEvidenceReportPath), `{"status":"passed","metrics":{"slides":1,"screenshots":1,"missing_screenshots":0,"canvas_mismatch_count":0,"issue_count":0},"issues":[],"slides":[{"slide_id":"s1","slide_path":"slides/01.svg","screenshot_path":"screenshots/01.png","canvas_width":960,"canvas_height":540,"viewport_width":960,"viewport_height":540,"pixel_width":960,"pixel_height":540,"scale":1,"status":"passed"}]}`)
}

func mustWritePassedChartQualityForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/chart_quality.json", `{"status":"passed","metrics":{"charts":0,"vega_lite_charts":0,"missing_axis_count":0,"missing_unit_count":0,"missing_source_count":0,"missing_direct_label_count":0,"decorative_chart_count":0},"issues":[],"charts":[]}`)
}

func mustWritePassedChartRenderForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/chart_render.json", `{"status":"passed","renderer":"node-vega-lite","charts":[],"issues":[]}`)
}

func mustWritePassedChartUsageForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/chart_usage.json", `{"status":"passed","charts":[],"issues":[]}`)
}

func mustWritePassedContentPayloadForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/content_payload.json", `{"status":"passed","metrics":{"slides":1,"substantive_slides":0,"sparse_label_list_count":0,"missing_central_claim_count":0,"missing_supporting_points_count":0,"missing_source_bound_fact_count":0,"missing_visual_data_items_count":0,"source_binding_issue_count":0,"issue_count":0}}`)
}

func mustWriteNoChartAssetsForTest(t *testing.T) {
	t.Helper()
	if _, err := os.Stat(filepath.Join("demo", "content", "slide_content.json")); os.IsNotExist(err) {
		mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"No chart fixture","source_refs":[],"visuals":[{"id":"none-s1","type":"none","instruction":"No chart"}]}]}`)
	} else if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/assets/charts/chart_briefs.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"charts":[]}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"none","charts":[]}`)
	mustWritePassedChartRenderForTest(t)
}

func mustWriteBasicVisualReceiptsForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"single_claim_poster","thumbnail_job":"readable title","visual_center":"title block","topic_fit_claim":"matches demo topic","information_density_plan":"one claim with support","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"quiet synthesis","data_visual_rationale":"","source_evidence":["web1 supports claim"],"container_fit_plan":"open grid text with no forced card","container_decision":"no card needed for simple claim","text_carrier":"open_grid","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"minimal","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"","renderer":"none","unit":"","source":"","why_chart_is_needed":""},"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)
}

func mustWritePassedCreativeReportForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/creative_quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"visual_receipts":1,"missing_visual_receipts":0,"process_leak_count":0,"generic_font_slide_count":0,"distinct_layout_family_count":1,"distinct_layout_archetype_count":1,"layout_archetype_max_ratio_bp":10000,"adjacent_layout_archetype_count":0,"left_right_chart_archetype_count":0,"layout_signature_max_ratio_bp":10000,"adjacent_layout_repetition_count":0,"fusion_slide_count":0,"fusion_adjacent_count":0,"weak_slide_count":0,"chart_without_evidence_count":0,"pseudo_analysis_diagram_count":0,"warning_count":0}}`)
}

func mustWriteDeliveryReceiptForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/receipts/delivery.json", `{"status":"ready","route_profile":"local_svg_deck","orchestrator":"mode_system_prompt_svg","runtime_binding":"svglide_local_runtime_binding","deck":"outline/deck.json","slides_dir":"slides","slides":["slides/01.svg"],"preview":{"path":"preview.html","status":"passed","missing_asset_count":0},"online_slide":{"status":"blocked","publisher":"missing"},"real_asset_evidence":{"required":false,"satisfied":true,"selected_real_images":0},"quality_report":"quality_report.json","anygen_semantic_report":"anygen_semantic_report.json","visual_receipts":"visual_receipts.json","creative_quality_report":"creative_quality_report.json","editorial_quality_report":"receipts/editorial_quality.json","semantic_metrics":{"slide_count":1,"slides_with_slide_role":1,"image_count":0,"text_count":1,"note_count":0,"source_ref_count":0,"missing_asset_count":0,"slides_without_source_refs":0,"visible_leak_count":0,"font_token_count":4,"missing_font_token_count":0,"parser_unsafe_count":0},"stage_status":{"validate_preview_repair":"pending"},"full_chain_evidence":{"run_json":"run.json","prompt_manifest":"prompt_manifest.json","prompt_context_receipts":{"research":"receipts/prompt_context/research.json","validate_preview_repair":"receipts/prompt_context/validate_preview_repair.json"},"request":"request/request.json","source_manifest":"request/source_manifest.json","entity_resolution":"request/entity_resolution.json","theme_contract":"request/theme_contract.json","research_plan":"research/research_plan.json","queries":"research/queries.json","research_notes":"research/research_notes.md","sources":"research/sources.json","research_coverage":"research/research_coverage.json","design_brief":"brief/design_brief.json","visual_system":"brief/visual_system.json","typography_contract":"brief/typography_contract.json","outline":"outline/deck.json","slide_content":"content/slide_content.json","asset_manifest":"assets/assets_manifest.json","rendered_visual":"receipts/rendered_visual.json","media_pressure_report":"receipts/media_pressure.json","quality_report":"quality_report.json","creative_quality_report":"creative_quality_report.json","editorial_quality_report":"receipts/editorial_quality.json","chart_render_report":"receipts/chart_render.json","chart_usage_report":"receipts/chart_usage.json","chart_quality_report":"receipts/chart_quality.json","delivery":"receipts/delivery.json","stage_receipts":{},"screenshot_evidence":["screenshots/01.png"],"manual_patch":{"applied":false,"files":[]}},"legacy_runtime_executed":false,"legacy_tool_ids":[],"legacy_artifact_matches":[],"core_prompt_ids":["mode_system_prompt_svg","svg_reference","svglide_local_runtime_binding","svglide_visual_quality_overlay","slide_font_catalog"],"observed_prompt_ids":[],"blocked_prompt_ids":["slides_convert","slides_parse_template"]}`)
}

func mustWriteFullChainStageReceiptsForTest(t *testing.T) {
	t.Helper()
	run := readStatusTestRunFile(t)
	for _, stage := range run.Stages {
		if stage.Name == StageValidatePreviewRepair {
			continue
		}
		mustWriteTestFile(t, filepath.Join("demo", stage.Receipt), `{"stage":"`+stage.Name+`","status":"done"}`)
		if stage.Name != StageRequest {
			writePromptContextReceiptWithoutToolCallsForTest(t, stage.Name)
		}
	}
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
}

func writePassingOnlineFinalStageArtifactsForTest(t *testing.T) {
	t.Helper()
	writePassingFinalStageArtifactsForTest(t)
	run := readStatusTestRunFile(t)
	run.DeliveryTarget = DeliveryTargetOnlineSlide
	run.Stages = DefaultStagesForDelivery(DeliveryTargetOnlineSlide)
	run.CurrentStage = StageValidatePreviewRepair
	for i := range run.Stages {
		if run.Stages[i].Name == StageValidatePreviewRepair {
			run.Stages[i].Status = StatusDone
		}
	}
	writeStatusTestRunFile(t, run)
	mustWriteTestFile(t, deliveryContractPathForTest(), `{"delivery_contract":{"delivery_target":"online_slide","requires_online_slide":true,"requires_local_preview":false,"requires_real_images":false,"reason":"online target fixture","detected_signals":["线上"]}}`)
}

func deliveryContractPathForTest() string {
	return filepath.Join("demo", deliveryContractPath)
}

func mustWritePassedOnlineSlideReportForTest(t *testing.T) {
	t.Helper()
	if err := writeOnlinePublishArtifacts("demo", OnlineSlidePublishReport{
		Status:         "passed",
		Publisher:      "recording-test",
		PresentationID: "pres_svg",
		URL:            "https://example.larkoffice.com/slides/pres_svg",
		SlideCount:     1,
	}); err != nil {
		t.Fatal(err)
	}
}

func mustWriteValidatePreviewRepairStageReceiptForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, filepath.Join("demo", "receipts", StageValidatePreviewRepair+".json"), `{"stage":"`+StageValidatePreviewRepair+`","status":"done"}`)
}

func mustWriteFullChainEvidenceArtifactsForTest(t *testing.T) {
	t.Helper()
	mustWriteFullChainPromptContextReceiptsForTest(t)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("topic", 5000, "medium", "resolved", ""))
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	mustWriteTestFile(t, "demo/research/research_notes.md", "# research\n")
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/research/research_coverage.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"给阿嬷的情书","type":"topic"},"queries":[{"query":"给阿嬷的情书","purpose":"context"}],"sources":[{"id":"web1","title":"Web Source","url":"https://example.com/page","retrieved_at":"2026-07-04T00:00:00Z","usage":"context","status":"retrieved"}],"coverage":{"identity_confirmed":false,"has_reliable_source":true,"minimum_source_count_met":true,"source_count":1,"topic_only_rationale":"开放主题测试链路需要研究材料确定内容边界。"}}`)
	if _, err := os.Stat(filepath.Join("demo", "brief", "design_brief.json")); os.IsNotExist(err) {
		mustWriteTestFile(t, "demo/brief/design_brief.json", `{"narrative_spine":"A to B","depth":"medium","tone":"clear"}`)
	}
	if _, err := os.Stat(filepath.Join("demo", "brief", "visual_system.json")); os.IsNotExist(err) {
		mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"editorial report"}`)
	}
	mustWriteTestFile(t, "demo/brief/typography_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"profile":"editorial_report","roles":{"display":{"family":"Noto Serif SC","weight":"700","size":"42","usage":"cover and section titles"},"body":{"family":"Noto Sans SC","weight":"400","size":"18","usage":"body copy"},"number":{"family":"Roboto Mono","weight":"700","size":"34","usage":"figures"},"label":{"family":"Noto Sans SC","weight":"600","size":"13","usage":"labels and captions"}},"rules":["Use concrete font roles; do not fall back to generic browser stacks."]}`)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"visual_quality_contract":{"profile":"text_only","requires_real_images":false,"topic_archetype":"","media_pressure":{},"editorial_quality_target":{},"reason":"test fixture"}}`)
	mustWritePassedChartRenderForTest(t)
	mustWritePassedChartUsageForTest(t)
	mustWritePassedChartQualityForTest(t)
	mustWritePassedScreenshotEvidenceForTest(t)
}

func mustWriteFullChainPromptContextReceiptsForTest(t *testing.T) {
	t.Helper()
	run := readStatusTestRunFile(t)
	for _, stage := range run.Stages {
		if stage.Name == StageRequest {
			continue
		}
		writePromptContextReceiptWithoutToolCallsForTest(t, stage.Name)
	}
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
	mustWritePassedImageUsageForTest(t)
	mustWritePassedMediaPressureForTest(t)
	mustWritePassedChartUsageForTest(t)
	mustWritePassedContentPayloadForTest(t)
	mustWriteTestFile(t, "demo/quality_report.json", `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":1,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":0,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`)
	mustWritePassedSemanticReportForTest(t)
	mustWriteBasicVisualReceiptsForTest(t)
	mustWritePassedCreativeReportForTest(t)
	mustWritePassedEditorialQualityForTest(t)
	mustWritePassedScreenshotEvidenceForTest(t)
	mustWritePassedChartRenderForTest(t)
	mustWritePassedChartQualityForTest(t)
	mustWriteTestFile(t, "demo/repair_queue.md", "# repair\n")
	mustWriteTestFile(t, "demo/preview.html", "<!doctype html><title>preview</title>")
	writePromptContextReceiptWithoutToolCallsForTest(t, StageValidatePreviewRepair)
	writeToolCallReceiptForTest(t, StageValidatePreviewRepair, "finish_slides_edit")
}
