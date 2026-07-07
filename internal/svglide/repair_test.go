package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestRepairRunAuthorsMissingSlidesAndWritesFinalReceipt(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}
	if !report.LintOK {
		t.Fatalf("LintOK = false, want true: %+v", report)
	}
	if report.Preview != "passed" {
		t.Fatalf("Preview = %q, want passed: %+v", report.Preview, report)
	}
	if report.Quality != "passed" {
		t.Fatalf("Quality = %q, want passed: %+v", report.Quality, report)
	}
	if report.Creative != "passed" {
		t.Fatalf("Creative = %q, want passed: %+v", report.Creative, report)
	}
	if !report.Reauthored {
		t.Fatalf("Reauthored = false, want true: %+v", report)
	}

	for _, rel := range []string{
		"slides/01.svg",
		"preview.html",
		"receipts/lint.json",
		"receipts/preview.json",
		"receipts/chart_quality.json",
		"quality_report.json",
		"creative_quality_report.json",
		"visual_receipts.json",
		"receipts/validate_preview_repair.json",
	} {
		if _, err := os.Stat(filepath.Join("demo", rel)); err != nil {
			t.Fatalf("missing %s: %v", rel, err)
		}
	}

	receipt := readRepairReceiptForTest(t)
	if receipt["stage"] != StageValidatePreviewRepair {
		t.Fatalf("receipt stage = %v, want %q", receipt["stage"], StageValidatePreviewRepair)
	}
	if receipt["status"] != "passed" {
		t.Fatalf("receipt status = %v, want passed", receipt["status"])
	}
	if receipt["message"] != "lint, preview, quality, creative, and semantic report passed after reauthoring" {
		t.Fatalf("receipt message = %v, want semantic-aware pass message", receipt["message"])
	}
	if _, ok := receipt["artifacts"].([]any); !ok {
		t.Fatalf("receipt artifacts = %T, want array", receipt["artifacts"])
	}
	if _, ok := receipt["updated_at"]; ok {
		t.Fatalf("receipt contains updated_at, want StageReceipt-compatible schema: %+v", receipt)
	}
	if _, ok := receipt["generated_at"]; ok {
		t.Fatalf("receipt contains generated_at, want StageReceipt-compatible schema: %+v", receipt)
	}
}

func TestRepairWritesDeliveryReceipt(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteFullChainStageReceiptsForTest(t)
	mustWriteFullChainEvidenceArtifactsForTest(t)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatalf("missing delivery receipt after passed repair: %v", err)
	}
	var delivery map[string]any
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatalf("invalid delivery receipt: %v", err)
	}
	if delivery["status"] != "ready" || delivery["deck"] != "outline/deck.json" {
		t.Fatalf("delivery receipt = %+v, want ready deck path", delivery)
	}
	if delivery["route_profile"] != RouteProfileLocalSVGDeck {
		t.Fatalf("delivery route_profile = %v, want %s", delivery["route_profile"], RouteProfileLocalSVGDeck)
	}
	if delivery["orchestrator"] != "mode_system_prompt_svg" || delivery["runtime_binding"] != "svglide_local_runtime_binding" {
		t.Fatalf("delivery prompt core = %+v, want orchestrator and runtime binding", delivery)
	}
	preview, ok := delivery["preview"].(map[string]any)
	if !ok || preview["path"] != "preview.html" || preview["status"] != "passed" {
		t.Fatalf("delivery preview = %+v, want preview object with passed status", delivery["preview"])
	}
	if _, ok := delivery["semantic_metrics"].(map[string]any); !ok {
		t.Fatalf("delivery missing semantic_metrics: %+v", delivery)
	}
	if delivery["legacy_runtime_executed"] != false {
		t.Fatalf("delivery legacy_runtime_executed = %v, want false", delivery["legacy_runtime_executed"])
	}
	for _, key := range []string{"core_prompt_ids", "observed_prompt_ids", "blocked_prompt_ids", "stage_status"} {
		if delivery[key] == nil {
			t.Fatalf("delivery missing %s: %+v", key, delivery)
		}
	}
	corePromptIDs, ok := delivery["core_prompt_ids"].([]any)
	if !ok {
		t.Fatalf("delivery core_prompt_ids = %T, want array", delivery["core_prompt_ids"])
	}
	corePromptIDStrings := make([]string, 0, len(corePromptIDs))
	for _, id := range corePromptIDs {
		corePromptIDStrings = append(corePromptIDStrings, id.(string))
	}
	wantCorePromptIDs, err := CorePromptIDsForProfile(RouteProfileLocalSVGDeck)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(corePromptIDStrings, wantCorePromptIDs) {
		t.Fatalf("core_prompt_ids = %v, want manifest-derived %v", corePromptIDStrings, wantCorePromptIDs)
	}
	for _, key := range []string{"quality_report", "anygen_semantic_report", "visual_receipts", "creative_quality_report"} {
		if delivery[key] == "" || delivery[key] == nil {
			t.Fatalf("delivery receipt missing %s: %+v", key, delivery)
		}
	}
	fullChain, ok := delivery["full_chain_evidence"].(map[string]any)
	if !ok || fullChain["chart_render_report"] != chartRenderReceiptPath || fullChain["chart_usage_report"] != chartUsageReceiptPath || fullChain["chart_quality_report"] != chartQualityReportPath {
		t.Fatalf("delivery full_chain_evidence missing chart reports: %+v", delivery["full_chain_evidence"])
	}
	if fullChain["prompt_manifest"] != "prompt_manifest.json" {
		t.Fatalf("delivery full_chain_evidence prompt_manifest = %v, want prompt_manifest.json", fullChain["prompt_manifest"])
	}
	promptContexts, ok := fullChain["prompt_context_receipts"].(map[string]any)
	if !ok || promptContexts[StageResearch] != promptContextReceiptPath(StageResearch) || promptContexts[StageValidatePreviewRepair] != promptContextReceiptPath(StageValidatePreviewRepair) {
		t.Fatalf("delivery full_chain_evidence prompt_context_receipts = %+v", fullChain["prompt_context_receipts"])
	}
	screenshots, ok := fullChain["screenshot_evidence"].([]any)
	if !ok || len(screenshots) == 0 {
		t.Fatalf("delivery full_chain_evidence missing screenshots: %+v", fullChain)
	}
	slides, ok := delivery["slides"].([]any)
	if !ok || len(slides) != 1 || slides[0] != "slides/01.svg" {
		t.Fatalf("delivery slides = %+v, want slides/01.svg", delivery["slides"])
	}
	for _, rel := range []string{"outline/deck.json", "slides/01.svg", "preview.html", "quality_report.json"} {
		if _, err := os.Stat(filepath.Join("demo", rel)); err != nil {
			t.Fatalf("delivery path %s missing: %v", rel, err)
		}
	}
}

func TestRepairPromptsPublishSVGlideWhenOnlineTargetPassesLocalGate(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	run := readStatusTestRunFile(t)
	run.DeliveryTarget = DeliveryTargetOnlineSlide
	run.Policy.PublishEnabled = true
	run.Stages = DefaultStagesForDelivery(DeliveryTargetOnlineSlide)
	run.CurrentStage = StageValidatePreviewRepair
	writeStatusTestRunFile(t, run)
	mustWriteTestFile(t, deliveryContractPathForTest(), `{"delivery_contract":{"delivery_target":"online_slide","requires_online_slide":true,"requires_local_preview":false,"requires_real_images":false,"reason":"online target fixture","detected_signals":["线上"]}}`)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}
	want := "lark-cli slides +publish-svglide --as user --run demo"
	if report.NextCommand != want {
		t.Fatalf("NextCommand = %q, want %q", report.NextCommand, want)
	}
}

func TestRepairRejectsLegacyRuntimeEvidenceForLocalProfile(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/receipts/tool_calls/research/slides_convert.json", `{"call_id":"slides_convert","status":"done"}`)

	report, err := RepairRun("demo")
	if err == nil {
		t.Fatalf("expected legacy runtime evidence to reject delivery, got report %+v", report)
	}
	if !strings.Contains(err.Error(), "legacy runtime") || !strings.Contains(err.Error(), "slides_convert") {
		t.Fatalf("error = %v, want legacy runtime evidence for slides_convert", err)
	}
}

func TestRepairRunFailsWhenQualityFails(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"local1","path":"research/local.md","title":"Local source","excerpt":"Local excerpt","usage":"support","retrieval":"local_file"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line","source_refs":[],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]}]}`)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if report.LintOK != true {
		t.Fatalf("LintOK = %v, want true: %+v", report.LintOK, report)
	}
	if report.Preview != "passed" {
		t.Fatalf("Preview = %q, want passed: %+v", report.Preview, report)
	}
	if report.Quality != "failed" {
		t.Fatalf("Quality = %q, want failed: %+v", report.Quality, report)
	}

	qualityRaw, err := os.ReadFile(filepath.Join("demo", "quality_report.json"))
	if err != nil {
		t.Fatal(err)
	}
	var quality map[string]any
	if err := json.Unmarshal(qualityRaw, &quality); err != nil {
		t.Fatal(err)
	}
	if quality["status"] != "failed" {
		t.Fatalf("quality status = %v, want failed: %+v", quality["status"], quality)
	}

	receipt := readRepairReceiptForTest(t)
	if receipt["status"] != "failed" {
		t.Fatalf("receipt status = %v, want failed", receipt["status"])
	}
	if receipt["message"] != "quality gate failed" {
		t.Fatalf("receipt message = %v, want quality gate failed", receipt["message"])
	}
	deliveryRaw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatalf("missing delivery receipt for failed quality repair: %v", err)
	}
	var delivery map[string]any
	if err := json.Unmarshal(deliveryRaw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery["status"] != StatusNeedsRepair {
		t.Fatalf("delivery status = %v, want %s", delivery["status"], StatusNeedsRepair)
	}
}

func TestRepairRunWritesVisualQualityRepairQueue(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[
		  {"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","key_message":"Cover","path":"slides/01.svg"},
		  {"id":"s2","title":"Process","summary":"Process","role":"process","visual_role":"evidence_grid","key_message":"Process","path":"slides/02.svg"}
		]}`,
	)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"mode":"default_floor","deck_type":"brand_factory","must_have":{"evidence_page_min_visuals":4}}}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[
	  {"id":"s1","content":"Cover","source_refs":["web1"],"visuals":[{"id":"cover","type":"image","instruction":"Cover image"}]},
	  {"id":"s2","content":"Process","source_refs":["web1"],"visuals":[{"id":"p1","type":"image","instruction":"Process 1"},{"id":"p2","type":"image","instruction":"Process 2"}]}
	]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[
	  {"id":"cover","slide_id":"s1","visual_id":"cover","kind":"image","local_path":"assets/images/cover.png","source_url":"https://example.com/cover.png","status":"ready","usage":"Cover"},
	  {"id":"p1","slide_id":"s2","visual_id":"p1","kind":"image","local_path":"assets/images/p1.png","source_url":"https://example.com/p1.png","status":"ready","usage":"Process 1"},
	  {"id":"p2","slide_id":"s2","visual_id":"p2","kind":"image","local_path":"assets/images/p2.png","source_url":"https://example.com/p2.png","status":"ready","usage":"Process 2"}
	]}`)
	mustWriteTestPNGFile(t, "demo/assets/images/cover.png")
	mustWriteTestPNGFile(t, "demo/assets/images/p1.png")
	mustWriteTestPNGFile(t, "demo/assets/images/p2.png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/cover.png" x="0" y="0" width="960" height="540"/></svg>`)
	mustWriteTestFile(t, "demo/slides/02.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/p1.png" x="40" y="40" width="320" height="180"/><image slide:role="image" href="../assets/images/p2.png" x="400" y="40" width="320" height="180"/><text x="48" y="300">Process</text></svg>`)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Quality != "failed" {
		t.Fatalf("Quality = %q, want failed: %+v", report.Quality, report)
	}
	queue, err := os.ReadFile(filepath.Join("demo", "repair_queue.md"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(queue), "Add a dense evidence grid or process image matrix") {
		t.Fatalf("repair queue = %q, want visual quality repair suggestion", string(queue))
	}
}

func TestRepairReceiptMessagePrioritizesLintPreviewFailuresOverQuality(t *testing.T) {
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: false, Preview: "failed", Quality: "failed"}); got != "lint or preview failed" {
		t.Fatalf("message = %q, want lint or preview failed", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: false, Preview: "failed", Quality: "failed", Reauthored: true}); got != "repair reauthored slides but lint or preview still failed" {
		t.Fatalf("reauthored message = %q, want reauthored lint/preview failure", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: true, Preview: "passed", Quality: "failed", Semantic: "passed"}); got != "quality gate failed" {
		t.Fatalf("quality-only message = %q, want quality gate failed", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: true, Preview: "passed", Quality: "passed", Creative: "failed", Semantic: "passed"}); got != "creative quality gate failed" {
		t.Fatalf("creative-only message = %q, want creative quality gate failed", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: true, Preview: "passed", Quality: "passed", Creative: "passed", Semantic: "failed"}); got != "semantic gate failed" {
		t.Fatalf("semantic-only message = %q, want semantic gate failed", got)
	}
}

func TestRepairRunOnlyReauthorsFailedSlidePaths(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"},{"id":"s2","title":"Second claim","summary":"Second summary","role":"content","key_message":"Second key message","path":"slides/02.svg"}]}`,
	)
	custom := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" width="960" height="540" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><foreignObject x="48" y="56" width="360" height="64" slide:role="shape" slide:shape-type="text"><p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:1.2;color:#111;">KEEP-CUSTOM-01</p></foreignObject></svg>`
	mustWriteTestFile(t, "demo/slides/01.svg", custom)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" || !report.Reauthored || !report.LintOK || report.Preview != "passed" {
		t.Fatalf("report = %+v, want passed reauthored repair", report)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != custom {
		t.Fatalf("slides/01.svg was overwritten:\n%s", string(raw))
	}
	if _, err := os.Stat(filepath.Join("demo", "slides", "02.svg")); err != nil {
		t.Fatalf("missing reauthored slides/02.svg: %v", err)
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false after repair: %+v", validation.Issues)
	}
}

func TestRepairRunReauthorsBackgroundOnlySVG(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", backgroundOnlySVG())

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" || !report.Reauthored || !report.LintOK || report.Preview != "passed" {
		t.Fatalf("report = %+v, want passed reauthored repair", report)
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false after repair: %+v", validation.Issues)
	}
}

func TestRepairRunDoesNotAuthorInvalidSlidePath(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/../01.svg"}]}`,
	)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if report.Reauthored {
		t.Fatalf("Reauthored = true, want false for invalid path: %+v", report)
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "svg_author.json")); !os.IsNotExist(err) {
		t.Fatalf("svg_author receipt exists or stat failed, want no authoring: %v", err)
	}
}

func TestRepairRunTreatsValidationArtifactWriteErrorAsFatal(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	if err := os.Remove(filepath.Join("demo", "repair_queue.md")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join("demo", "repair_queue.md"), 0o755); err != nil {
		t.Fatal(err)
	}

	if _, err := RepairRun("demo"); err == nil {
		t.Fatal("expected repair to return validation artifact write error")
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "validate_preview_repair.json")); !os.IsNotExist(err) {
		t.Fatalf("final repair receipt exists or stat failed, want no misleading final receipt: %v", err)
	}
}

func readRepairReceiptForTest(t *testing.T) map[string]any {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "validate_preview_repair.json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	return receipt
}
