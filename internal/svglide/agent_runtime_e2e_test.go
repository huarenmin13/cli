package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestFakeAgentHappyPathProducesSVGDeck(t *testing.T) {
	t.Chdir(t.TempDir())
	writeDefaultSemanticContractForTest(t)
	opts := InitOptions{Title: "电影介绍", Pages: 1}
	setStringInitOptionField(t, &opts, "Topic", "介绍一部电影")
	setStringInitOptionField(t, &opts, "Language", "zh")
	setStringInitOptionField(t, &opts, "AgentRuntime", "fake-agent")
	setStringInitOptionField(t, &opts, "AgentID", "fake-agent-e2e")

	if err := InitRun("demo", opts); err != nil {
		t.Fatalf("topic-only fake-agent init should succeed: %v", err)
	}
	if err := os.MkdirAll(filepath.Join("demo", "receipts", "prompt_context"), 0o755); err != nil {
		t.Fatal(err)
	}

	for _, stage := range []string{
		StageRequest,
		StageRequestResolution,
		StageResearch,
		StageDesignBrief,
		StageOutline,
		StageSlideContent,
		StageAssets,
		StageSVGAuthor,
	} {
		run := readStatusTestRunFile(t)
		if run.CurrentStage != stage {
			t.Fatalf("current stage = %q, want %q", run.CurrentStage, stage)
		}
		next, err := NextTask("demo")
		if err != nil {
			t.Fatalf("NextTask(%s): %v", stage, err)
		}
		assertNextTaskHasRuntimeProtocolFields(t, next, stage)
		writeFakeAgentReceiptsFromNext(t, next)
		writeFakeAgentStageArtifacts(t, stage)
		if _, err := CompleteCurrentStage("demo"); err != nil {
			t.Fatalf("complete %s: %v", stage, err)
		}
	}

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask(%s): %v", StageValidatePreviewRepair, err)
	}
	assertNextTaskHasRuntimeProtocolFields(t, next, StageValidatePreviewRepair)
	writeFakeAgentReceiptsFromNext(t, next)

	repair, err := RepairRun("demo")
	if err != nil {
		t.Fatalf("repair: %v", err)
	}
	if repair.Status != "passed" {
		t.Fatalf("repair status = %q, want passed: %+v", repair.Status, repair)
	}
	mustWritePassedScreenshotEvidenceForTest(t)
	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("complete %s: %v", StageValidatePreviewRepair, err)
	}
	for _, rel := range []string{
		"slides/01.svg",
		"preview.html",
		"receipts/image_usage.json",
		"receipts/media_pressure.json",
		"receipts/content_payload.json",
		"receipts/editorial_quality.json",
		"receipts/screenshot_evidence.json",
		"receipts/chart_quality.json",
		"quality_report.json",
		"anygen_semantic_report.json",
		"receipts/delivery.json",
	} {
		if _, err := os.Stat(filepath.Join("demo", rel)); err != nil {
			t.Fatalf("missing final artifact %s: %v", rel, err)
		}
	}
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "delivery.json"))
	if err != nil {
		t.Fatal(err)
	}
	var delivery DeliveryReceipt
	if err := json.Unmarshal(raw, &delivery); err != nil {
		t.Fatal(err)
	}
	if delivery.SemanticMetrics.VisibleLeakCount != 0 || delivery.SemanticMetrics.MissingFontTokenCount != 0 {
		t.Fatalf("delivery semantic metrics = %+v, want no visible leaks and all font tokens", delivery.SemanticMetrics)
	}
	if delivery.Status != StatusReady {
		t.Fatalf("delivery status = %q, want ready with full-chain screenshot evidence: %+v", delivery.Status, delivery.FullChainEvidence)
	}
	if len(delivery.FullChainEvidence.ScreenshotEvidence) == 0 {
		t.Fatalf("delivery screenshot evidence is empty: %+v", delivery.FullChainEvidence)
	}
}

func TestFakeAgentChartChainRendersAndValidatesVegaLite(t *testing.T) {
	t.Chdir(t.TempDir())
	writeDefaultSemanticContractForTest(t)
	opts := InitOptions{Title: "Chart Deck", Pages: 1}
	setStringInitOptionField(t, &opts, "Topic", "chart-only revenue comparison")
	setStringInitOptionField(t, &opts, "AgentRuntime", "fake-agent")
	setStringInitOptionField(t, &opts, "AgentID", "fake-agent-chart-e2e")

	if err := InitRun("demo", opts); err != nil {
		t.Fatalf("chart fake-agent init should succeed: %v", err)
	}
	if err := os.MkdirAll(filepath.Join("demo", "receipts", "prompt_context"), 0o755); err != nil {
		t.Fatal(err)
	}
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"prompt_contract":`+promptContractJSON(StageRequestResolution)+`,"input_text":"chart-only revenue comparison","resolved_entity":{"name":"chart-only revenue comparison","type":"topic","confidence_bp":9000,"confidence_band":"high","reason":"chart-only E2E fixture"},"ambiguity":{"status":"resolved","candidates":[]},"research_required":true,"visual_quality_contract":{"profile":"data_report","requires_real_images":false,"required_chart_renderer":"vega-lite","min_chart_svg_assets":1,"min_vega_lite_specs":1,"reason":"chart-only E2E"},"clarification_question":""}`)
	mustWriteTestFile(t, "demo/request/theme_contract.json", `{"prompt_contract":`+promptContractJSON(StageRequestResolution)+`,"theme_contract":{"content_type":{"primary":"data_report","secondary":["chart_only"]},"subject_type":{"primary":"topic","named_entity":false,"entity_name":"chart-only revenue comparison"},"delivery_format":{"primary":"self_read","density":"medium"},"evidence_type":{"primary":"quantitative_comparison","requires_sources":true},"asset_needs":{"requires_real_images":false,"required_roles":[],"min_real_image_pages":0,"min_dominant_real_image_pages":0,"min_unique_real_images":0,"cover_requires_dominant_real_image":false},"layout_rhythm":{"min_slide_count":1,"min_distinct_layout_archetypes":1,"max_adjacent_same_archetype":0,"required_page_roles":["cover","chart","closing"]},"typography_identity":{"profile":"data_report","display_category":"sans","body_category":"sans","number_category":"mono"},"quality_floor":{"profile":"chart_only","reason":"chart-only E2E fixture; no raster images required."},"rationale":"This fixture verifies Vega-Lite chart rendering without real image requirements."}}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"web1","path":"https://example.com/filing","title":"Company filing","excerpt":"Segment revenue data","usage":"chart data","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#76B900"},"typography":{"title":32,"body":16},"layout_language":"financial chart page"}`)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"profile":"data_report","requires_real_images":false,"required_chart_renderer":"vega-lite","min_chart_svg_assets":1,"min_vega_lite_specs":1,"topic_archetype":"","media_pressure":{},"editorial_quality_target":{},"reason":"chart-only E2E fixture"}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"prompt_contract":`+promptContractJSON(StageOutline)+`,"title":"Chart Deck","slides":[{"id":"s1","title":"Data center leads","summary":"Revenue mix comparison","role":"content","key_message":"Data center revenue leads the mix","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"Data center leads","body":"Data center revenue leads the mix","labels":["Revenue $B","Source: web1"]},"production_instruction":{"layout":"Embed the rendered chart asset with rect role","asset_ids":["revenue_mix"]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Data center revenue leads the mix","central_claim":"Data center revenue is the dominant segment in this comparison.","audience_takeaway":"The audience should read the chart as a segment mix proof point, not decoration.","supporting_points":[{"text":"The chart compares reported segment revenue values from the filing source.","source_refs":["web1"]},{"text":"The data center bar is intentionally the visual anchor because it leads the mix.","source_refs":["web1"]}],"source_bound_facts":[{"fact":"Segment revenue data comes from the company filing source.","source_ref":"web1","usage":"visual_data"}],"visual_data_items":[{"label":"Data Center","value":"22.1","role":"metric","explanation":"Largest segment in the comparison.","source_ref":"web1"},{"label":"Gaming","value":"2.9","role":"metric","explanation":"Secondary segment for contrast.","source_ref":"web1"},{"label":"Professional Visualization","value":"0.5","role":"metric","explanation":"Smaller segment for scale context.","source_ref":"web1"}],"source_refs":["web1"],"visuals":[{"id":"revenue_mix","type":"chart","instruction":"Compare segment revenue"}],"so_what":"This proves the slide's message with a real quantitative relationship."}]}`)
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":false,"no_image_reason":"chart-only E2E fixture; no raster image required.","candidates":[]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[],"no_image_reason":"chart-only E2E fixture; no raster image required."}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[],"no_image_reason":"chart-only E2E fixture; no raster image required."}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[]}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_briefs.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"charts":[{"id":"revenue_mix","slide_id":"s1","purpose":"comparison","takeaway":"Data center revenue leads the mix","renderer":"vega-lite","data_source_ids":["web1"],"unit":"$B","min_width":600,"min_height":320}]}`)
	mustWriteTestFile(t, "demo/assets/charts/specs/revenue_mix.vl.json", `{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","width":640,"height":360,"title":{"text":"Segment revenue comparison ($B)","subtitle":"Source: web1 company filing"},"data":{"values":[{"segment":"Data Center","revenue":22.1},{"segment":"Gaming","revenue":2.9},{"segment":"Professional Visualization","revenue":0.5}]},"mark":{"type":"bar","tooltip":true},"encoding":{"x":{"field":"segment","type":"nominal","sort":"-y","axis":{"title":"Segment"}},"y":{"field":"revenue","type":"quantitative","axis":{"title":"Revenue $B"}},"color":{"field":"segment","type":"nominal","legend":null}}}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"vega-lite","charts":[{"id":"revenue_mix","slide_id":"s1","renderer":"vega-lite","brief_id":"revenue_mix","spec_path":"assets/charts/specs/revenue_mix.vl.json","svg_path":"assets/charts/revenue_mix.svg","source_id":"web1","unit":"$B","takeaway":"Data center revenue leads the mix","render_receipt":"receipts/chart_render.json"}]}`)

	next, err := NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask(%s): %v", StageAssets, err)
	}
	assertNextTaskHasRuntimeProtocolFields(t, next, StageAssets)
	writeFakeAgentReceiptsFromNext(t, next)
	status, err := CompleteCurrentStage("demo")
	if err != nil {
		t.Fatalf("complete %s: %v", StageAssets, err)
	}
	if status.CurrentStage != StageSVGAuthor {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageSVGAuthor)
	}
	if _, err := os.Stat(filepath.Join("demo", "assets", "charts", "revenue_mix.svg")); err != nil {
		t.Fatalf("missing rendered chart SVG: %v", err)
	}
	var renderReport ChartRenderReport
	raw, err := readRunRegularArtifact("demo", chartRenderReceiptPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(raw, &renderReport); err != nil {
		t.Fatal(err)
	}
	if renderReport.Status != "passed" || len(renderReport.Charts) != 1 {
		t.Fatalf("chart render report = %+v, want one passed chart", renderReport)
	}

	next, err = NextTask("demo")
	if err != nil {
		t.Fatalf("NextTask(%s): %v", StageSVGAuthor, err)
	}
	assertNextTaskHasRuntimeProtocolFields(t, next, StageSVGAuthor)
	writeFakeAgentReceiptsFromNext(t, next)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" width="960" height="540" slide:role="slide" viewBox="0 0 960 540"><slide:note>Source: web1</slide:note><rect width="960" height="540" fill="#fff"/>`+parserSafeTextBody()+`<rect slide:role="chart" href="../assets/charts/revenue_mix.svg" x="80" y="120" width="720" height="360"/></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"evidence","layout_family":"data_report","layout_archetype":"chart_forward","layout_signature":"hero_chart_with_title","thumbnail_job":"chart","visual_center":"Vega-Lite rendered revenue chart","topic_fit_claim":"uses chart evidence for revenue comparison","information_density_plan":"one chart plus one title","page_difference_from_previous":"single-slide chart fixture","primary_asset":"assets/charts/revenue_mix.svg","asset_role":"chart evidence","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"chart-forward financial evidence","data_visual_rationale":"Revenue comparison needs a standard chart","source_evidence":["web1 supports revenue data"],"container_fit_plan":"chart has open canvas and title outside chart bounds","container_decision":"no text card needed","text_carrier":"axis_annotation","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"chart_forward","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"revenue_mix","renderer":"vega-lite","unit":"$B","source":"web1","why_chart_is_needed":"compare segment revenue"},"fusion_spec":{"enabled":false},"qa_expectations":["chart is rendered asset, not hand drawn"]}]}`)

	status, err = CompleteCurrentStage("demo")
	if err != nil {
		t.Fatalf("complete %s: %v", StageSVGAuthor, err)
	}
	if status.CurrentStage != StageValidatePreviewRepair {
		t.Fatalf("CurrentStage = %q, want %q", status.CurrentStage, StageValidatePreviewRepair)
	}
	quality, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if quality.Status != "passed" {
		t.Fatalf("quality = %+v, want passed", quality)
	}
	var usage ChartUsageReport
	raw, err = readRunRegularArtifact("demo", chartUsageReceiptPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(raw, &usage); err != nil {
		t.Fatal(err)
	}
	if usage.Status != "passed" || len(usage.Charts) != 1 {
		t.Fatalf("chart usage = %+v, want one passed chart", usage)
	}
}

func TestE2EChineseTeaThemeContractQualityGate(t *testing.T) {
	root := copySVGlideE2EFixtureToTempRun(t, "testdata/svglide/e2e/chinese_tea_minimal")
	if err := ValidateStageOutputs(root); err != nil {
		t.Fatalf("ValidateStageOutputs returned %v", err)
	}
	report, err := CheckQuality(root)
	if err != nil {
		t.Fatalf("CheckQuality returned %v", err)
	}
	if report.Status != "passed" {
		t.Fatalf("quality status = %q, issues = %#v", report.Status, report.Issues)
	}
	if !report.Metrics.ThemeContractPresent || !report.Metrics.ThemeAssetNeedsApplied || report.Metrics.DominantRealImagePages < 3 {
		t.Fatalf("metrics = %+v, want theme contract applied with at least 3 dominant real-image pages", report.Metrics)
	}
	creative, err := CheckCreativeQuality(root)
	if err != nil {
		t.Fatalf("CheckCreativeQuality returned %v", err)
	}
	if creative.Status != "passed" {
		t.Fatalf("creative status = %q, issues = %#v", creative.Status, creative.Issues)
	}
}

func TestE2EChineseTeaRejectsGenericVectorOnlyDeck(t *testing.T) {
	root := copySVGlideE2EFixtureToTempRun(t, "testdata/svglide/e2e/chinese_tea_minimal")
	mustWriteTestFile(t, filepath.Join(root, "assets", "assets_manifest.json"), `{"assets":[]}`)
	mustWriteTestFile(t, filepath.Join(root, "assets", "asset_inventory.json"), `{"items":[]}`)
	mustWriteTestFile(t, filepath.Join(root, "assets", "image_candidates.json"), `{"requires_real_images":true,"candidates":[]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatalf("CheckQuality returned %v", err)
	}
	if report.Status != "failed" || !qualityIssueCodesContain(report.Issues, "svglide.media_pressure.real_image_pages") {
		t.Fatalf("report = %#v, want real-image media pressure failure", report)
	}
}

func copySVGlideE2EFixtureToTempRun(t *testing.T, fixtureRel string) string {
	t.Helper()
	repoRoot, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	cwd := t.TempDir()
	t.Chdir(cwd)
	writeDefaultSemanticContractForTest(t)
	runRoot := filepath.Join(cwd, "fixture")
	copyTestDir(t, filepath.Join(repoRoot, fixtureRel), runRoot)
	for name, schema := range DefaultSchemas() {
		mustWriteTestFile(t, filepath.Join("fixture", "schemas", name), schema)
	}
	return "fixture"
}

func assertNextTaskHasRuntimeProtocolFields(t *testing.T, next NextTaskReport, stage string) {
	t.Helper()
	raw, err := json.Marshal(next)
	if err != nil {
		t.Fatal(err)
	}
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatal(err)
	}
	if payload["protocol"] != "anygen-svg-slides" {
		t.Fatalf("%s next.protocol = %v, want anygen-svg-slides", stage, payload["protocol"])
	}
	agentTask, ok := payload["agent_task"].(map[string]any)
	if !ok {
		t.Fatalf("%s next.agent_task missing: %+v", stage, payload)
	}
	if agentTask["stage"] != stage {
		t.Fatalf("%s agent_task.stage = %v, want %s", stage, agentTask["stage"], stage)
	}
	if payload["prompt_context"] == nil || payload["tool_invocation_contract"] == nil {
		t.Fatalf("%s next missing prompt_context/tool_invocation_contract: %+v", stage, payload)
	}
}

func writeFakeAgentReceiptsFromNext(t *testing.T, next NextTaskReport) {
	t.Helper()
	raw, err := json.Marshal(next)
	if err != nil {
		t.Fatal(err)
	}
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatal(err)
	}
	toolContract, _ := payload["tool_invocation_contract"].(map[string]any)
	for _, call := range callsFromContract(toolContract, "required_calls", "conditional_calls") {
		id, _ := call["id"].(string)
		if id == "" {
			continue
		}
		writeToolCallReceiptFromContractForE2E(t, next, call)
	}
}

func callsFromContract(contract map[string]any, keys ...string) []map[string]any {
	out := []map[string]any{}
	for _, key := range keys {
		values, _ := contract[key].([]any)
		for _, value := range values {
			if object, ok := value.(map[string]any); ok {
				out = append(out, object)
			}
		}
	}
	return out
}

func writeToolCallReceiptFromContractForE2E(t *testing.T, next NextTaskReport, call map[string]any) {
	t.Helper()
	id, _ := call["id"].(string)
	promptID, _ := call["prompt_id"].(string)
	if promptID == "" {
		promptID = id
	}
	consumed := stringsFromJSONValue(call["consumes"])
	if len(consumed) == 0 {
		consumed = next.Inputs
	}
	produced := stringsFromJSONValue(call["produces"])
	if len(produced) == 0 {
		produced = next.Outputs
	}
	raw, err := json.MarshalIndent(map[string]any{
		"protocol":          "anygen-svg-slides",
		"stage":             next.Stage,
		"call_id":           id,
		"prompt_id":         promptID,
		"invocation":        stringFromJSONValue(call["invocation"], "required"),
		"condition":         stringFromJSONValue(call["condition"], "always"),
		"condition_matched": true,
		"order":             intFromJSONValue(call["order"]),
		"cardinality":       stringFromJSONValue(call["cardinality"], "once"),
		"consumed":          consumed,
		"produced":          produced,
		"status":            "done",
	}, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, filepath.Join("demo", "receipts", "tool_calls", next.Stage, id+".json"), string(append(raw, '\n')))
}

func stringFromJSONValue(value any, fallback string) string {
	if text, ok := value.(string); ok && text != "" {
		return text
	}
	return fallback
}

func intFromJSONValue(value any) int {
	switch typed := value.(type) {
	case float64:
		return int(typed)
	case int:
		return typed
	default:
		return 0
	}
}

func stringsFromJSONValue(value any) []string {
	values, _ := value.([]any)
	out := make([]string, 0, len(values))
	for _, item := range values {
		if text, ok := item.(string); ok {
			out = append(out, text)
		}
	}
	return out
}

func writeFakeAgentStageArtifacts(t *testing.T, stage string) {
	t.Helper()
	switch stage {
	case StageRequest:
		return
	case StageRequestResolution:
		mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"prompt_contract":`+promptContractJSON(StageRequestResolution)+`,"input_text":"介绍一部电影","resolved_entity":{"name":"介绍一部电影","type":"topic","confidence_bp":5000,"confidence_band":"medium","reason":"用户请求是开放主题，需要先研究确定内容方向"},"ambiguity":{"status":"resolved","candidates":[]},"research_required":true,"clarification_question":""}`)
		mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	case StageResearch:
		mustWriteTestFile(t, "demo/research/research_notes.md", "# 电影资料\n\n用户提供主题。")
		mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"user1","path":"topic://介绍一部电影","title":"用户主题","excerpt":"介绍一部电影","usage":"primary brief","retrieval":"user_provided"}]}`)
		mustWriteTestFile(t, "demo/research/research_coverage.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"介绍一部电影","type":"topic"},"queries":[{"query":"介绍一部电影","purpose":"context"}],"sources":[{"id":"user1","title":"用户主题","url":"topic://介绍一部电影","retrieved_at":"2026-07-04T00:00:00Z","usage":"context","status":"retrieved"}],"coverage":{"identity_confirmed":false,"has_reliable_source":true,"minimum_source_count_met":true,"source_count":1,"topic_only_rationale":"开放主题需要用研究材料确定内容边界。"}}`)
	case StageDesignBrief:
		writeValidDesignBriefOutputs(t)
	case StageOutline:
		mustWriteTestFile(t, "demo/outline/deck.json", `{"prompt_contract":`+promptContractJSON(StageOutline)+`,"main_title":"电影介绍","style_instruction":{"aesthetic_direction":"Editorial cinematic deck","color_palette":{},"typography":{}},"slides":[{"id":"s1","title":"一部电影","summary":"用一个清晰观点介绍电影","role":"cover","key_message":"电影的核心吸引力","layout_family":"character_product_focus","layout_archetype":"annotated_image","layout_signature":"image_claim","story_function":"hook","primary_asset_role":"cinematic topic anchor","fusion_candidate":false,"path":"slides/01.svg"}]}`)
	case StageSlideContent:
		mustWriteTestFile(t, "demo/content/slide_content.md", "# 一部电影\n\n电影的核心吸引力。")
		mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"一部电影","body":"电影的核心吸引力","labels":["电影"]},"production_instruction":{"layout":"Use local hero image, no visible source note","asset_ids":["hero"]}}]}`)
		mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"电影的核心吸引力","central_claim":"这页用一个清晰观点说明电影为什么值得被介绍。","audience_takeaway":"观众应先获得电影主题的核心吸引力，再进入后续分析。","supporting_points":[{"text":"用户请求是介绍一部电影，因此封面需要先建立主题识别。","source_refs":["user1"]},{"text":"视觉和标题共同承担开场钩子，而不是只放一个片名。","source_refs":["user1"]}],"source_bound_facts":[{"fact":"用户主题要求生成电影介绍。","source_ref":"user1","usage":"context"}],"source_refs":["user1"],"visuals":[{"id":"hero","type":"image","instruction":"Use a cinematic hero image"}],"so_what":"这页应作为有观点的开场，而不是空泛标题页。"}]}`)
	case StageAssets:
		mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":true,"candidates":[{"id":"cand-hero","query":"movie hero image","source_url":"https://example.com/movie-hero.png","source_class":"user_provided","format":"png","width":1200,"height":800,"has_alpha":false,"asset_role":"hero_photo","fit_role":"split_panel","local_path":"assets/images/movie-hero.png","score_bp":9000,"selected":true,"selection_reason":"user-provided cinematic hero image","format_exception_reason":"","rejection_reason":""}]}`)
		mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/movie-hero.png","usage":"Cinematic hero image","status":"ready"}]}`)
		mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","kind":"image","source_url":"https://example.com/movie-hero.png","local_path":"assets/images/movie-hero.png","usage":"Cinematic hero image","status":"ready"}]}`)
		mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"hero","path":"assets/images/movie-hero.png","source_url":"https://example.com/movie-hero.png","width":1200,"height":800,"semantic_type":"hero","large_ok":true,"full_bleed_ok":false,"recommended_use":"cover split image","avoid_reason":"","format":"png","has_alpha":false,"asset_role":"hero_photo","fit_role":"split_panel","candidate_id":"cand-hero","selection_reason":"user-provided cinematic hero image","format_exception_reason":""}]}`)
		mustWriteTestPNGFile(t, "demo/assets/images/movie-hero.png")
	case StageSVGAuthor:
		mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" width="960" height="540" slide:role="slide" viewBox="0 0 960 540"><slide:note>Source: user1</slide:note><rect width="960" height="540" fill="#fff"/><image slide:role="image" href="../assets/images/movie-hero.png" x="520" y="80" width="320" height="240"/><foreignObject x="48" y="72" width="360" height="120" slide:role="shape" slide:shape-type="text"><p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:1.25;color:#111;">电影介绍</p><p xmlns="http://www.w3.org/1999/xhtml" style="margin:12px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:20px;line-height:1.35;color:#333;">电影的核心吸引力</p></foreignObject></svg>`)
		mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"character_product_focus","layout_archetype":"annotated_image","layout_signature":"image_claim","thumbnail_job":"电影介绍","visual_center":"movie hero image and title","topic_fit_claim":"introduces the requested movie topic","information_density_plan":"one claim plus one visual anchor","page_difference_from_previous":"opening page","primary_asset":"assets/images/movie-hero.png","asset_role":"cinematic topic anchor","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"image-led cinematic introduction","data_visual_rationale":"","source_evidence":["user1 supports the topic"],"container_fit_plan":"text sits in image-safe open area with no default card","container_decision":"image-led open composition","text_carrier":"image_dark_zone","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"image_annotation","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"","renderer":"none","unit":"","source":"","why_chart_is_needed":""},"fusion_spec":{"enabled":false},"qa_expectations":["no visible process text"]}]}`)
	default:
		t.Fatalf("unexpected fake-agent stage %q", stage)
	}
}
