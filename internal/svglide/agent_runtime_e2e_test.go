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
	if _, err := CompleteCurrentStage("demo"); err != nil {
		t.Fatalf("complete %s: %v", StageValidatePreviewRepair, err)
	}
	for _, rel := range []string{
		"slides/01.svg",
		"preview.html",
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
	for _, call := range requiredCallsFromContract(toolContract) {
		id, _ := call["id"].(string)
		if id == "" {
			continue
		}
		writeToolCallReceiptFromContractForE2E(t, next, call)
	}
}

func requiredCallsFromContract(contract map[string]any) []map[string]any {
	values, _ := contract["required_calls"].([]any)
	out := make([]map[string]any, 0, len(values))
	for _, value := range values {
		if object, ok := value.(map[string]any); ok {
			out = append(out, object)
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
		mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"电影的核心吸引力","source_refs":["user1"],"visuals":[{"id":"hero","type":"image","instruction":"Use a cinematic hero image"}]}]}`)
	case StageAssets:
		mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/movie-hero.png","usage":"Cinematic hero image","status":"ready"}]}`)
		mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","kind":"image","source_url":"https://example.com/movie-hero.png","local_path":"assets/images/movie-hero.png","usage":"Cinematic hero image","status":"ready"}]}`)
		mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"hero","path":"assets/images/movie-hero.png","source_url":"https://example.com/movie-hero.png","width":1200,"height":800,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover image","avoid_reason":""}]}`)
		mustWriteTestFile(t, "demo/assets/images/movie-hero.png", "png")
	case StageSVGAuthor:
		mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<slide:note>Source: user1</slide:note><rect width="960" height="540" fill="#fff"/><image slide:role="image" href="../assets/images/movie-hero.png" x="520" y="80" width="320" height="240"/><text x="48" y="88">电影介绍</text><text x="48" y="150">电影的核心吸引力</text></svg>`)
		mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"character_product_focus","layout_archetype":"annotated_image","layout_signature":"image_claim","thumbnail_job":"电影介绍","visual_center":"movie hero image and title","topic_fit_claim":"introduces the requested movie topic","information_density_plan":"one claim plus one visual anchor","page_difference_from_previous":"opening page","primary_asset":"assets/images/movie-hero.png","asset_role":"cinematic topic anchor","font_role_usage":{"display":"Noto Serif CJK SC","body":"Noto Sans CJK SC","number":"Roboto Mono","label":"PingFang SC"},"composition_intent":"image-led cinematic introduction","data_visual_rationale":"","source_evidence":["user1 supports the topic"],"fusion_spec":{"enabled":false},"qa_expectations":["no visible process text"]}]}`)
	default:
		t.Fatalf("unexpected fake-agent stage %q", stage)
	}
}
