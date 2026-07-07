package svglide

import "testing"

func TestContentPayloadRejectsSparseLabelList(t *testing.T) {
	initContentPayloadTestRun(t, `{
	  "prompt_contract": `+promptContractJSON(StageSlideContent)+`,
	  "slides": [{
	    "id": "02-tea-types",
	    "content": "白茶\n绿茶\n黄茶\n乌龙\n红茶\n黑茶",
	    "central_claim": "",
	    "audience_takeaway": "",
	    "supporting_points": [],
	    "source_bound_facts": [],
	    "source_refs": ["tea-source"],
	    "visuals": [{"id": "tea_taxonomy", "type": "diagram", "instruction": "Six tea classes", "visual_form": "parameter_matrix"}],
	    "so_what": ""
	  }]
	}`)

	report, err := EvaluateContentPayloadRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	for _, want := range []string{
		"svglide.content_payload.sparse_label_list",
		"svglide.content_payload.missing_supporting_points",
		"svglide.content_payload.missing_source_bound_fact",
		"svglide.content_payload.visual_form_missing_data",
	} {
		if !contentPayloadIssueCodesContain(report.Issues, want) {
			t.Fatalf("issues = %+v, want %s", report.Issues, want)
		}
	}
}

func TestContentPayloadPassesStructuredCultureSlide(t *testing.T) {
	initContentPayloadTestRun(t, `{
	  "prompt_contract": `+promptContractJSON(StageSlideContent)+`,
	  "slides": [{
	    "id": "02-tea-types",
	    "content": "白茶\n绿茶\n黄茶\n乌龙\n红茶\n黑茶",
	    "central_claim": "六大茶类的核心差异来自氧化程度和工艺路径。",
	    "audience_takeaway": "理解分类逻辑后，观众能把茶名、工艺和风味联系起来。",
	    "supporting_points": [
	      {"text": "绿茶通过杀青固定鲜爽风味，因此呈现低氧化特征。", "source_refs": ["tea-source"]},
	      {"text": "乌龙茶处在半氧化区间，香气和焙火层次更复杂。", "source_refs": ["tea-source"]}
	    ],
	    "source_bound_facts": [
	      {"fact": "茶类划分和加工方式直接相关。", "source_ref": "tea-source", "usage": "evidence"}
	    ],
	    "examples_or_parameters": [
	      {"label": "氧化程度", "value": "低到高", "explanation": "用同一条尺度解释绿茶、乌龙、红茶的差异。", "source_ref": "tea-source"}
	    ],
	    "visual_data_items": [
	      {"label": "白茶", "role": "comparison", "explanation": "轻加工，适合放在低干预端。", "source_ref": "tea-source"},
	      {"label": "绿茶", "role": "comparison", "explanation": "杀青保持鲜爽，氧化程度低。", "source_ref": "tea-source"},
	      {"label": "黄茶", "role": "comparison", "explanation": "闷黄形成不同汤色和口感。", "source_ref": "tea-source"},
	      {"label": "乌龙", "role": "comparison", "explanation": "半氧化形成花果香和焙火感。", "source_ref": "tea-source"},
	      {"label": "红茶", "role": "comparison", "explanation": "较高氧化带来甜香和红汤。", "source_ref": "tea-source"},
	      {"label": "黑茶", "role": "comparison", "explanation": "后发酵带来陈化和醇厚感。", "source_ref": "tea-source"}
	    ],
	    "source_refs": ["tea-source"],
	    "visuals": [{"id": "tea_taxonomy", "type": "diagram", "instruction": "Six tea classes", "visual_form": "parameter_matrix"}],
	    "so_what": "这页应把分类从名词列表变成可理解的风味地图。"
	  }]
	}`)

	report, err := EvaluateContentPayloadRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed: %+v", report.Status, report.Issues)
	}
	if report.Metrics.SparseLabelListCount != 0 {
		t.Fatalf("sparse count = %d, want 0", report.Metrics.SparseLabelListCount)
	}
}

func TestContentPayloadRejectsUnknownSourceRefs(t *testing.T) {
	initContentPayloadTestRun(t, structuredContentPayloadSlideJSON("missing-source"))

	report, err := EvaluateContentPayloadRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !contentPayloadIssueCodesContain(report.Issues, "svglide.content_payload.unknown_source_ref") {
		t.Fatalf("issues = %+v, want unknown_source_ref", report.Issues)
	}
}

func TestContentPayloadRequiresVisualDataForDiagram(t *testing.T) {
	initContentPayloadTestRun(t, `{
	  "prompt_contract": `+promptContractJSON(StageSlideContent)+`,
	  "slides": [{
	    "id": "03-process",
	    "content": "采摘\n萎凋\n揉捻\n氧化\n干燥",
	    "central_claim": "茶的风味是在连续加工步骤里逐渐形成的。",
	    "audience_takeaway": "观众需要看到每一步如何改变茶叶状态，而不是只看到步骤名称。",
	    "supporting_points": [
	      {"text": "萎凋会改变叶片含水状态，为后续揉捻做准备。", "source_refs": ["tea-source"]},
	      {"text": "氧化程度会影响汤色、香气和滋味表达。", "source_refs": ["tea-source"]}
	    ],
	    "source_bound_facts": [
	      {"fact": "加工步骤会影响茶叶最终品质。", "source_ref": "tea-source", "usage": "evidence"}
	    ],
	    "visual_data_items": [],
	    "source_refs": ["tea-source"],
	    "visuals": [{"id": "craft_flow", "type": "diagram", "instruction": "Tea craft process", "visual_form": "process_flow"}],
	    "so_what": "这页应解释工艺如何塑造风味，而不是画空流程线。"
	  }]
	}`)

	report, err := EvaluateContentPayloadRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !contentPayloadIssueCodesContain(report.Issues, "svglide.content_payload.visual_form_missing_data") {
		t.Fatalf("issues = %+v, want visual_form_missing_data", report.Issues)
	}
}

func initContentPayloadTestRun(t *testing.T, slideContent string) {
	t.Helper()
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"tea-source","path":"https://example.com/tea","title":"Tea source","excerpt":"Tea classification and process facts","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"品中国茶","slides":[{"id":"02-tea-types","title":"六大茶类","role":"content","summary":"分类","key_message":"分类来自工艺","path":"slides/02.svg"},{"id":"03-process","title":"工艺路径","role":"content","summary":"工艺","key_message":"工艺塑造风味","path":"slides/03.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", slideContent)
}

func structuredContentPayloadSlideJSON(sourceRef string) string {
	return `{
	  "prompt_contract": ` + promptContractJSON(StageSlideContent) + `,
	  "slides": [{
	    "id": "02-tea-types",
	    "content": "白茶\n绿茶\n黄茶",
	    "central_claim": "六大茶类的核心差异来自氧化程度和工艺路径。",
	    "audience_takeaway": "理解分类逻辑后，观众能把茶名、工艺和风味联系起来。",
	    "supporting_points": [
	      {"text": "绿茶通过杀青固定鲜爽风味，因此呈现低氧化特征。", "source_refs": ["` + sourceRef + `"]},
	      {"text": "乌龙茶处在半氧化区间，香气和焙火层次更复杂。", "source_refs": ["tea-source"]}
	    ],
	    "source_bound_facts": [
	      {"fact": "茶类划分和加工方式直接相关。", "source_ref": "tea-source", "usage": "evidence"}
	    ],
	    "visual_data_items": [
	      {"label": "白茶", "role": "comparison", "explanation": "轻加工，适合放在低干预端。", "source_ref": "tea-source"},
	      {"label": "绿茶", "role": "comparison", "explanation": "杀青保持鲜爽，氧化程度低。", "source_ref": "tea-source"},
	      {"label": "黄茶", "role": "comparison", "explanation": "闷黄形成不同汤色和口感。", "source_ref": "tea-source"}
	    ],
	    "source_refs": ["tea-source"],
	    "visuals": [{"id": "tea_taxonomy", "type": "diagram", "instruction": "Six tea classes", "visual_form": "parameter_matrix"}],
	    "so_what": "这页应把分类从名词列表变成可理解的风味地图。"
	  }]
	}`
}

func contentPayloadIssueCodesContain(issues []ContentPayloadIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
