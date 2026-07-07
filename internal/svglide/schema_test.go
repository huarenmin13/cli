package svglide

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateStageOutputsRejectsMissingRequiredField(t *testing.T) {
	initStatusTestRun(t)
	if err := os.WriteFile(filepath.Join("demo", "request", "request.json"), []byte(`{}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected schema validation error")
	}
	if !strings.Contains(err.Error(), "request/request.json") || !strings.Contains(err.Error(), "title") {
		t.Fatalf("error = %v, want path and missing field", err)
	}
}

func TestValidateStageOutputsAcceptsCurrentRequestArtifacts(t *testing.T) {
	initStatusTestRun(t)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatal(err)
	}
}

func TestEntityResolutionSchemaAcceptsVisualQualityContract(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	raw := `{
	  "prompt_contract": ` + promptContractJSON(StageRequestResolution) + `,
	  "input_text": "介绍日本金子眼镜 https://www.kaneko-optical.co.jp/zh-CHS/",
	  "resolved_entity": {
	    "name": "金子眼鏡株式会社 / KANEKO OPTICAL",
	    "type": "brand",
	    "confidence_bp": 9600,
	    "confidence_band": "high",
	    "reason": "用户给出官网 URL 和品牌视觉图，目标是真实品牌官网介绍。"
	  },
	  "visual_quality_contract": {
	    "profile": "brand_official_site",
	    "requires_real_images": true,
	    "min_image_coverage_bp": 7000,
	    "min_unique_images": 6,
	    "min_official_images": 4,
	    "allow_repeated_hero_only": false,
	    "reason": "真实品牌官网主题需要官网图片资产支撑。"
	  },
	  "ambiguity": {"status": "resolved", "candidates": ["KANEKO OPTICAL"]},
	  "research_required": true,
	  "clarification_question": ""
	}`
	mustWriteTestFile(t, "demo/request/entity_resolution.json", raw)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("entity_resolution schema rejected visual_quality_contract: %v", err)
	}
}

func TestEntityResolutionSchemaAcceptsBenchmarkVisualQualityContract(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	raw := `{
	  "prompt_contract": ` + promptContractJSON(StageRequestResolution) + `,
	  "input_text": "生成品牌介绍 slides",
	  "resolved_entity": {
	    "name": "Demo Brand",
	    "type": "brand",
	    "confidence_bp": 9200,
	    "confidence_band": "high",
	    "reason": "用户请求是真实品牌介绍。"
	  },
	  "visual_quality_contract": {
	    "mode": "benchmark",
	    "benchmark_available": true,
	    "benchmark_usage": "quality_floor_only",
	    "deck_type": "brand_factory",
	    "must_have": {
	      "strong_cover": true,
	      "semantic_image_coverage_min_bp": 9000,
	      "evidence_page_min_visuals": 8,
	      "max_repeated_layout_ratio_bp": 5000,
	      "visual_roles_required": ["hero_cover", "evidence_grid"],
	      "total_image_refs_min": 12
	    }
	  },
	  "ambiguity": {"status": "resolved", "candidates": ["Demo Brand"]},
	  "research_required": true,
	  "clarification_question": ""
	}`
	mustWriteTestFile(t, "demo/request/entity_resolution.json", raw)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("entity_resolution schema rejected benchmark visual_quality_contract: %v", err)
	}
}

func TestEntityResolutionSchemaAcceptsStrictVisualContract(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	raw := `{
	  "prompt_contract": ` + promptContractJSON(StageRequestResolution) + `,
	  "input_text": "Generate a financial report for Nvidia Q4 2023",
	  "resolved_entity": {
	    "name": "NVIDIA Corporation",
	    "type": "public_company_financial_report",
	    "confidence_bp": 9600,
	    "confidence_band": "high",
	    "reason": "用户请求是真实上市公司财报。"
	  },
	  "visual_quality_contract": {
	    "profile": "data_report",
	    "requires_real_images": true,
	    "min_image_coverage_bp": 3000,
	    "min_unique_images": 2,
	    "min_official_images": 1,
	    "allow_repeated_hero_only": false,
	    "cover_requires_real_hero_image": true,
	    "required_chart_renderer": "vega-lite",
	    "min_chart_svg_assets": 6,
	    "min_vega_lite_specs": 6,
	    "typography_contract_required": true,
	    "forbid_preview_wrapper_images_as_real_images": true,
	    "reason": "真实公司财报需要真实企业/产品/数据中心图片、Vega-Lite 图表和字体契约。"
	  },
	  "ambiguity": {"status": "resolved", "candidates": ["NVIDIA"]},
	  "research_required": true,
	  "clarification_question": ""
	}`
	mustWriteTestFile(t, "demo/request/entity_resolution.json", raw)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("entity_resolution schema rejected strict visual contract: %v", err)
	}
}

func TestEntityResolutionSchemaRejectsCopySourceBenchmarkUsage(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	raw := `{
	  "prompt_contract": ` + promptContractJSON(StageRequestResolution) + `,
	  "input_text": "生成品牌介绍 slides",
	  "resolved_entity": {
	    "name": "Demo Brand",
	    "type": "brand",
	    "confidence_bp": 9200,
	    "confidence_band": "high",
	    "reason": "用户请求是真实品牌介绍。"
	  },
	  "visual_quality_contract": {
	    "mode": "benchmark",
	    "benchmark_available": true,
	    "benchmark_usage": "copy_source",
	    "deck_type": "brand_factory",
	    "must_have": {"strong_cover": true}
	  },
	  "ambiguity": {"status": "resolved", "candidates": ["Demo Brand"]},
	  "research_required": true,
	  "clarification_question": ""
	}`
	mustWriteTestFile(t, "demo/request/entity_resolution.json", raw)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected schema validation error")
	}
	if !strings.Contains(err.Error(), "benchmark_usage") {
		t.Fatalf("error = %v, want benchmark_usage context", err)
	}
}

func TestValidateStageOutputsRejectsDeckSlidePathsThatPreviewRejects(t *testing.T) {
	for _, path := range []string{"slides/a%20.svg", "slides/.hidden.svg", "slides/a..b.svg", "slides/a:b.svg"} {
		t.Run(path, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageOutline)
			mustWriteTestFile(t, "demo/outline/deck.json", validSchemaDeckJSON(path))

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected deck slide path validation error")
			}
			if !strings.Contains(err.Error(), "outline/deck.json") || !strings.Contains(err.Error(), "slides[0].path") {
				t.Fatalf("error = %v, want deck path context", err)
			}
		})
	}
}

func TestCompleteCurrentStageRejectsInvalidDeckSlidePath(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageOutline)
	mustWriteTestFile(t, "demo/outline/deck.json", validSchemaDeckJSON("slides/a%20.svg"))

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected deck slide path validation error")
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageOutline {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageOutline)
	}
	if got := stageStatus(t, run, StageOutline); got == StatusDone {
		t.Fatalf("outline stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "outline.json")); !os.IsNotExist(statErr) {
		t.Fatalf("outline receipt should not be written, stat err = %v", statErr)
	}
}

func TestValidateStageOutputsRejectsInvalidValidatePreviewRepairReceipts(t *testing.T) {
	tests := []struct {
		name  string
		setup func(t *testing.T)
		path  string
	}{
		{
			name: "lint",
			setup: func(t *testing.T) {
				t.Helper()
				if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"failed"}`), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(validQualityReportJSON()), 0o644); err != nil {
					t.Fatal(err)
				}
			},
			path: "receipts/lint.json",
		},
		{
			name: "preview",
			setup: func(t *testing.T) {
				t.Helper()
				if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"passed","issues":[]}`), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join("demo", "receipts", "preview.json"), []byte(`{"status":"passed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":"yes"}]}`), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(validQualityReportJSON()), 0o644); err != nil {
					t.Fatal(err)
				}
			},
			path: "receipts/preview.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
			tt.setup(t)

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected schema validation error")
			}
			if !strings.Contains(err.Error(), tt.path) {
				t.Fatalf("error = %v, want path %s", err, tt.path)
			}
		})
	}
}

func TestValidateStageOutputsRejectsInvalidQualityReportSchema(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageValidatePreviewRepair)
	if err := os.WriteFile(filepath.Join("demo", "receipts", "lint.json"), []byte(`{"status":"passed","issues":[]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "receipts", "preview.json"), []byte(`{"status":"passed","missing_asset_count":0,"slides":[{"path":"slides/01.svg","rendered":true}]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWritePassedRenderedVisualForTest(t)
	mustWritePassedImageUsageForTest(t)
	mustWritePassedMediaPressureForTest(t)
	mustWritePassedChartUsageForTest(t)
	mustWritePassedContentPayloadForTest(t)
	mustWritePassedEditorialQualityForTest(t)
	mustWritePassedScreenshotEvidenceForTest(t)
	if err := os.WriteFile(filepath.Join("demo", "quality_report.json"), []byte(`{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1}}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected quality report schema validation error")
	}
	if !strings.Contains(err.Error(), "quality_report.json") {
		t.Fatalf("error = %v, want path quality_report.json", err)
	}
}

func TestValidateStageOutputsRejectsVisualReceiptsMissingContainerContract(t *testing.T) {
	writePassingFinalStageArtifactsForTest(t)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"single_claim_poster","thumbnail_job":"readable title","visual_center":"title block","topic_fit_claim":"matches demo topic","information_density_plan":"one claim with support","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"quiet synthesis","data_visual_rationale":"","source_evidence":["web1 supports claim"],"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected visual receipts schema validation error")
	}
	if !strings.Contains(err.Error(), "visual_receipts.json") || !strings.Contains(err.Error(), "container_fit_plan") {
		t.Fatalf("error = %v, want visual_receipts.json and container_fit_plan", err)
	}
}

func TestValidateStageOutputsRejectsSourcesMissingRetrieval(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	mustWriteTestFile(t, "demo/research/research_plan.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"给阿嬷的情书","type":"topic","requires_confirmation":false},"identifiers":[{"id":"id_topic","type":"topic_phrase","value":"给阿嬷的情书","confidence_bp":9000,"reason":"schema fixture"}],"evidence_needs":[{"id":"need_context","type":"context","required":true}],"source_ladders":[{"identifier_id":"id_topic","evidence_need_id":"need_context","required_source_classes":["general_web_search"],"fallback_source_classes":[],"forbidden_only_source_classes":[]}],"minimum_coverage":{"min_retrieved_sources":1,"identity_source_required":false,"all_required_source_classes_attempted":true},"failure_policy":{"block_if_required_source_class_missing":true,"block_if_only_general_search":false,"clarify_if_identity_unconfirmed_after_ladder":true}}`)
	mustWriteTestFile(t, "demo/research/queries.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"queries":[{"id":"q_s1","plan_identifier_id":"id_topic","source_class":"general_web_search","method":"search_query","query_or_url":"给阿嬷的情书","purpose":"context","status":"retrieved","retrieved_source_ids":["s1"]}]}`)
	if err := os.WriteFile(filepath.Join("demo", "research", "sources.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"supporting evidence","query_id":"q_s1","source_class":"general_web_search","authority_tier":"general"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected retrieval schema validation error")
	}
	if !strings.Contains(err.Error(), "research/sources.json") || !strings.Contains(err.Error(), "retrieval") {
		t.Fatalf("error = %v, want research/sources.json and retrieval", err)
	}
}

func TestValidateStageOutputsRejectsSlideContentMissingSourceRefsOrVisualIds(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "missing source_refs",
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}],"so_what":"This isolates the missing source_refs field."}]}`,
			want: "source_refs",
		},
		{
			name: "missing visual id",
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["s1"],"visuals":[{"type":"none","instruction":"No visual needed"}],"so_what":"This isolates the missing visual id field."}]}`,
			want: "visuals[0].id",
		},
		{
			name: "empty visuals",
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["s1"],"visuals":[],"so_what":"This isolates the empty visuals field."}]}`,
			want: "visuals",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageSlideContent)
			if err := os.WriteFile(filepath.Join("demo", "content", "slide_content.json"), []byte(tt.raw), 0o644); err != nil {
				t.Fatal(err)
			}

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected slide content schema validation error")
			}
			if !strings.Contains(err.Error(), "content/slide_content.json") || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("error = %v, want content/slide_content.json and %s", err, tt.want)
			}
		})
	}
}

func TestValidateSlideContentSourceRefsGateRejectsDiagramMissingVisualForm(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"s1","path":"https://example.com","title":"Source","excerpt":"Excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[{"id":"v1","type":"diagram","instruction":"Draw a process diagram"}]}]}`)

	err := ValidateSlideContentSourceRefsGate("demo")
	if err == nil {
		t.Fatal("expected missing visual_form to fail")
	}
	if !strings.Contains(err.Error(), "visual_form") {
		t.Fatalf("error = %v, want visual_form", err)
	}
}

func TestSlideContentSchemaRequiresStructuredPayload(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSlideContent)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[{"id":"v1","type":"none","instruction":"Text only"}]}]}`)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected slide content schema to require structured payload")
	}
	if !strings.Contains(err.Error(), "central_claim") {
		t.Fatalf("error = %v, want central_claim required", err)
	}
}

func TestSlideContentSchemaAcceptsStructuredPayload(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSlideContent)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Source","excerpt":"Excerpt","usage":"support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.md", "# slides\n")
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"Claim","body":"Body","labels":[]},"production_instruction":{"layout":"Text-only","asset_ids":[]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["s1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}],"so_what":"This structured payload should pass schema validation."}]}`)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("structured slide content rejected: %v", err)
	}
}

func TestValidateStageOutputsRejectsAssetsMissingStatus(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	if err := os.WriteFile(filepath.Join("demo", "assets", "assets_plan.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","type":"image","path":"https://example.com/a.png","usage":"hero image"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":false,"no_image_reason":"schema failure fixture","candidates":[]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[]}`)
	mustWriteNoChartAssetsForTest(t)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected asset schema validation error")
	}
	if !strings.Contains(err.Error(), "assets/assets_plan.json") || !strings.Contains(err.Error(), "status") {
		t.Fatalf("error = %v, want assets/assets_plan.json and status", err)
	}
}

func TestValidateStageOutputsAcceptsExperimentAssetPaths(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{name: "outside images", path: "../a.png"},
		{name: "dot dot filename", path: "assets/images/hero..png"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			setCurrentStageForStatusTest(t, StageAssets)
			if err := os.WriteFile(filepath.Join("demo", "assets", "assets_plan.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","type":"image","path":"`+tt.path+`","usage":"hero image","status":"ready"}]}`), 0o644); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join("demo", "assets", "assets_manifest.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","kind":"image","local_path":"`+tt.path+`","usage":"hero image","status":"ready"}]}`), 0o644); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join("demo", "assets", "image_candidates.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":false,"candidates":[{"id":"cand-a1","query":"hero image","source_url":"`+tt.path+`","source_class":"user_provided","format":"png","width":960,"height":540,"has_alpha":true,"asset_role":"hero_photo","fit_role":"split_panel","local_path":"`+tt.path+`","score_bp":9000,"selected":true,"selection_reason":"test fixture selected image","format_exception_reason":"","rejection_reason":""}]}`), 0o644); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join("demo", "assets", "asset_inventory.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"a1","path":"`+tt.path+`","source_url":"","width":960,"height":540,"semantic_type":"image","large_ok":true,"full_bleed_ok":true,"recommended_use":"hero image","avoid_reason":"","format":"png","has_alpha":true,"asset_role":"hero_photo","fit_role":"split_panel","candidate_id":"cand-a1","selection_reason":"test fixture selected image","format_exception_reason":""}]}`), 0o644); err != nil {
				t.Fatal(err)
			}
			mustWriteNoChartAssetsForTest(t)

			err := ValidateStageOutputs("demo")
			if err != nil {
				t.Fatalf("expected experiment asset path to pass schema validation, got %v", err)
			}
		})
	}
}

func TestValidateStageOutputsRejectsMissingArtifactPromptContract(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[]}`)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected assets artifact without prompt_contract to be rejected")
	}
	if !strings.Contains(err.Error(), "assets/assets_plan.json") || !strings.Contains(err.Error(), "prompt_contract") {
		t.Fatalf("error = %v, want assets/assets_plan.json prompt_contract rejection", err)
	}
}

func TestValidateStageOutputsRejectsWrongPromptContractOrchestrator(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{
  "prompt_contract": {
    "protocol": "anygen-svg-slides",
    "stage": "assets",
    "context_receipt": "receipts/prompt_context/assets.json",
    "orchestrator": "wrong_orchestrator",
    "protocol_reference": "svg_reference",
    "required_prompt_ids": ["mode_system_prompt_svg", "svg_reference"]
  },
  "mode": "experiment_unrestricted_assets",
  "assets": []
}`)

	err := ValidateArtifactPromptContractForStage("demo", StageAssets, []string{"assets/assets_plan.json"})
	if err == nil {
		t.Fatal("expected wrong prompt_contract.orchestrator to be rejected")
	}
	if !strings.Contains(err.Error(), "assets/assets_plan.json") || !strings.Contains(err.Error(), "orchestrator") {
		t.Fatalf("error = %v, want assets/assets_plan.json orchestrator rejection", err)
	}
}

func TestDefaultSchemasIncludeAnyGenQualityContracts(t *testing.T) {
	schemas := DefaultSchemas()
	for _, name := range []string{
		"entity_resolution.schema.json",
		"research_plan.schema.json",
		"research_queries.schema.json",
		"sources.schema.json",
		"research_coverage.schema.json",
		"slide_content.schema.json",
		"slide_copy_plan.schema.json",
		"assets_plan.schema.json",
		"assets_manifest.schema.json",
		"image_candidates.schema.json",
		"asset_inventory.schema.json",
		"chart_manifest.schema.json",
		"image_usage.schema.json",
		"chart_quality.schema.json",
		"typography_contract.schema.json",
		"quality.schema.json",
		"content_payload.schema.json",
	} {
		if strings.TrimSpace(schemas[name]) == "" {
			t.Fatalf("schema %s is missing", name)
		}
	}
	if !strings.Contains(schemas["sources.schema.json"], `"retrieval"`) {
		t.Fatalf("sources schema missing retrieval contract: %s", schemas["sources.schema.json"])
	}
	if !strings.Contains(schemas["research_plan.schema.json"], `"source_ladders"`) || !strings.Contains(schemas["research_plan.schema.json"], `"required_source_classes"`) {
		t.Fatalf("research plan schema missing source ladder contract: %s", schemas["research_plan.schema.json"])
	}
	if !strings.Contains(schemas["research_queries.schema.json"], `"source_class"`) || !strings.Contains(schemas["research_queries.schema.json"], `"retrieved_source_ids"`) {
		t.Fatalf("research queries schema missing source linkage contract: %s", schemas["research_queries.schema.json"])
	}
	if !strings.Contains(schemas["sources.schema.json"], `"query_id"`) || !strings.Contains(schemas["sources.schema.json"], `"authority_tier"`) {
		t.Fatalf("sources schema missing research query provenance fields: %s", schemas["sources.schema.json"])
	}
	if !strings.Contains(schemas["research_coverage.schema.json"], `"source_count"`) || !strings.Contains(schemas["research_coverage.schema.json"], `"topic_only_rationale"`) {
		t.Fatalf("research coverage schema missing coverage fields: %s", schemas["research_coverage.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"source_refs"`) {
		t.Fatalf("slide content schema missing source_refs: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"minItems"`) {
		t.Fatalf("slide content schema missing non-empty source_refs contract: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"visuals"`) {
		t.Fatalf("slide content schema missing visuals: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["slide_content.schema.json"], `"visual_form"`) || !strings.Contains(schemas["slide_content.schema.json"], `"sensory_wheel"`) {
		t.Fatalf("slide content schema missing visual_form contract: %s", schemas["slide_content.schema.json"])
	}
	if !strings.Contains(schemas["deck.schema.json"], `"visual_role"`) || !strings.Contains(schemas["deck.schema.json"], `"visual_intent"`) {
		t.Fatalf("deck schema missing visual role fields: %s", schemas["deck.schema.json"])
	}
	if !strings.Contains(schemas["deck.schema.json"], `"layout_family"`) || !strings.Contains(schemas["deck.schema.json"], `"fusion_candidate"`) {
		t.Fatalf("deck schema missing visual family fields: %s", schemas["deck.schema.json"])
	}
	if strings.TrimSpace(schemas["visual_receipts.schema.json"]) == "" || strings.TrimSpace(schemas["creative_quality.schema.json"]) == "" {
		t.Fatalf("visual quality schemas are missing: receipts=%q creative=%q", schemas["visual_receipts.schema.json"], schemas["creative_quality.schema.json"])
	}
	if !strings.Contains(schemas["creative_quality.schema.json"], `"visual_skeleton_max_ratio_bp"`) || !strings.Contains(schemas["creative_quality.schema.json"], `"visual_intent_mismatch_count"`) {
		t.Fatalf("creative quality schema missing visual skeleton metrics: %s", schemas["creative_quality.schema.json"])
	}
	if !strings.Contains(schemas["slide_copy_plan.schema.json"], `"audience_copy"`) || !strings.Contains(schemas["slide_copy_plan.schema.json"], `"production_instruction"`) {
		t.Fatalf("slide copy plan schema missing audience_copy/production_instruction: %s", schemas["slide_copy_plan.schema.json"])
	}
	if !strings.Contains(schemas["assets_plan.schema.json"], `"slide_id"`) {
		t.Fatalf("assets schema missing slide_id: %s", schemas["assets_plan.schema.json"])
	}
	if !strings.Contains(schemas["assets_manifest.schema.json"], `"local_path"`) || !strings.Contains(schemas["assets_manifest.schema.json"], `"source_url"`) {
		t.Fatalf("assets manifest schema missing local_path/source_url: %s", schemas["assets_manifest.schema.json"])
	}
	if !strings.Contains(schemas["image_candidates.schema.json"], `"query"`) || !strings.Contains(schemas["image_candidates.schema.json"], `"format_exception_reason"`) {
		t.Fatalf("image candidates schema missing query/format exception fields: %s", schemas["image_candidates.schema.json"])
	}
	if !strings.Contains(schemas["asset_inventory.schema.json"], `"large_ok"`) || !strings.Contains(schemas["asset_inventory.schema.json"], `"candidate_id"`) {
		t.Fatalf("asset inventory schema missing image suitability fields: %s", schemas["asset_inventory.schema.json"])
	}
	if !strings.Contains(schemas["image_usage.schema.json"], `"area_bp"`) || !strings.Contains(schemas["image_usage.schema.json"], `"usage_status"`) {
		t.Fatalf("image usage schema missing usage metrics: %s", schemas["image_usage.schema.json"])
	}
	if !strings.Contains(schemas["chart_manifest.schema.json"], `"vega-lite"`) || !strings.Contains(schemas["chart_manifest.schema.json"], `"spec_path"`) {
		t.Fatalf("chart manifest schema missing Vega-Lite fields: %s", schemas["chart_manifest.schema.json"])
	}
	if !strings.Contains(schemas["chart_quality.schema.json"], `"missing_unit_count"`) || !strings.Contains(schemas["chart_quality.schema.json"], `"decorative_chart_count"`) {
		t.Fatalf("chart quality schema missing core metrics: %s", schemas["chart_quality.schema.json"])
	}
	if !strings.Contains(schemas["typography_contract.schema.json"], `"display"`) || !strings.Contains(schemas["typography_contract.schema.json"], `"number"`) || !strings.Contains(schemas["typography_contract.schema.json"], `"selected_moods"`) || !strings.Contains(schemas["typography_contract.schema.json"], `"font_source"`) {
		t.Fatalf("typography contract schema missing font roles: %s", schemas["typography_contract.schema.json"])
	}
	for _, want := range []string{`"experiment_unrestricted_assets"`, `"chart"`, `"table"`, `"crop"`, `"deferred"`} {
		if !strings.Contains(schemas["assets_plan.schema.json"], want) {
			t.Fatalf("assets schema missing %s: %s", want, schemas["assets_plan.schema.json"])
		}
	}
	if !strings.Contains(schemas["quality.schema.json"], `"metrics"`) {
		t.Fatalf("quality schema missing metrics: %s", schemas["quality.schema.json"])
	}
	for _, want := range []string{`"strong_cover"`, `"evidence_page_max_visuals"`, `"repeated_layout_ratio_bp"`, `"visual_role_coverage_bp"`, `"real_image_assets"`, `"vega_lite_spec_assets"`, `"typography_contract_present"`, `"image_role_format_issue_count"`, `"image_usage_issue_count"`, `"content_payload_issue_count"`, `"sparse_label_list_count"`} {
		if !strings.Contains(schemas["quality.schema.json"], want) {
			t.Fatalf("quality schema missing %s: %s", want, schemas["quality.schema.json"])
		}
	}
	if !strings.Contains(schemas["content_payload.schema.json"], `"sparse_label_list_count"`) || !strings.Contains(schemas["content_payload.schema.json"], `"source_binding_issue_count"`) {
		t.Fatalf("content payload schema missing core metrics: %s", schemas["content_payload.schema.json"])
	}
	for _, want := range []string{`"cover_requires_real_hero_image"`, `"required_chart_renderer"`, `"typography_contract_required"`} {
		if !strings.Contains(schemas["entity_resolution.schema.json"], want) {
			t.Fatalf("entity resolution schema missing %s: %s", want, schemas["entity_resolution.schema.json"])
		}
	}
}

func TestCompleteResearchRejectsCoverageSourceIDsNotInSources(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	mustWriteTestFile(t, "demo/research/research_notes.md", "# research\n")
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "resolved", ""))
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/research/research_coverage.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"给阿嬷的情书","type":"film"},"queries":[{"query":"给阿嬷的情书 电影","purpose":"entity_disambiguation"}],"sources":[{"id":"missing","title":"Missing","url":"https://example.com/missing","retrieved_at":"2026-07-04T00:00:00Z","usage":"identity","status":"retrieved"}],"coverage":{"identity_confirmed":true,"has_reliable_source":true,"minimum_source_count_met":true,"source_count":1,"topic_only_rationale":""}}`)
	writePromptContextReceiptForTest(t, StageResearch, map[string]string{})
	writeToolCallReceiptForTest(t, StageResearch, "plan_research")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected unknown coverage source id to block research completion")
	}
	if !strings.Contains(err.Error(), "research_coverage") || !strings.Contains(err.Error(), "missing") {
		t.Fatalf("error = %v, want research_coverage missing source id", err)
	}
}

func TestCompleteResearchRejectsCoverageEntityTypeDowngrade(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	mustWriteTestFile(t, "demo/research/research_notes.md", "# research\n")
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("film", 8500, "high", "resolved", ""))
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"context","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/research/research_coverage.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"给阿嬷的情书","type":"topic"},"queries":[{"query":"给阿嬷的情书","purpose":"context"}],"sources":[{"id":"s1","title":"Example","url":"https://example.com","retrieved_at":"2026-07-04T00:00:00Z","usage":"context","status":"retrieved"}],"coverage":{"identity_confirmed":false,"has_reliable_source":true,"minimum_source_count_met":true,"source_count":1,"topic_only_rationale":"伪装成开放主题以跳过 identity source。"}}`)
	writePromptContextReceiptForTest(t, StageResearch, map[string]string{})
	writeToolCallReceiptForTest(t, StageResearch, "plan_research")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected research coverage entity type downgrade to be rejected")
	}
	if !strings.Contains(err.Error(), "entity type") || !strings.Contains(err.Error(), "request/entity_resolution.json") {
		t.Fatalf("error = %v, want entity type mismatch against request/entity_resolution.json", err)
	}
}

func TestCompleteSlideContentRejectsUnknownSourceRefs(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSlideContent)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.md", "# slides\n")
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"Claim","body":"Body","labels":[]},"production_instruction":{"layout":"Text-only","asset_ids":[]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["missing"],"visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}],"so_what":"This isolates the unknown slide-level source ref."}]}`)
	writePromptContextReceiptWithoutToolCallsForTest(t, StageSlideContent)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected unknown slide source_refs to block slide_content completion")
	}
	if !strings.Contains(err.Error(), "source_refs") || !strings.Contains(err.Error(), "missing") {
		t.Fatalf("error = %v, want source_refs missing source id", err)
	}
}

func TestSlideCopyPlanRejectsProductionInstructionInAudienceCopy(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSlideContent)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.md", "# slides\n")
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"产品页必须让眼镜完整出现","body":"Claim","labels":[]},"production_instruction":{"layout":"图片要完整，不要裁切","asset_ids":[]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Claim","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["s1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}],"so_what":"This keeps slide content valid while copy plan fails."}]}`)
	writePromptContextReceiptWithoutToolCallsForTest(t, StageSlideContent)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected production instruction leakage in audience_copy to be rejected")
	}
	if !strings.Contains(err.Error(), "slide_copy_plan") || !strings.Contains(err.Error(), "production_instruction") {
		t.Fatalf("error = %v, want slide_copy_plan production_instruction rejection", err)
	}
}

func TestCompleteSlideContentRejectsEmptySourceRefs(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageSlideContent)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.md", "# slides\n")
	mustWriteTestFile(t, "demo/content/slide_copy_plan.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","audience_copy":{"title":"Claim","body":"Body","labels":[]},"production_instruction":{"layout":"Text-only","asset_ids":[]}}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":[],"visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}],"so_what":"This isolates the empty source_refs field."}]}`)
	writePromptContextReceiptWithoutToolCallsForTest(t, StageSlideContent)

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected empty source_refs to block slide_content completion")
	}
	if !strings.Contains(err.Error(), "source_refs") || (!strings.Contains(err.Error(), "empty") && !strings.Contains(err.Error(), "0 items")) {
		t.Fatalf("error = %v, want empty source_refs rejection", err)
	}
}

func TestCompleteAssetsRejectsManifestAssetMissingInventoryEntry(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/request/request.json", `{"title":"Demo","input":"source.md","pages":1}`)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", validEntityResolutionJSON("topic", 5000, "medium", "resolved", ""))
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/brief/visual_system.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"system":{"name":"demo","theme":"editorial","palette":["#000000","#ffffff"],"type_scale":{"title":48},"layout_principles":["clear hierarchy"]}}`)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"visual_quality_contract":{"profile":"brand_official_site","requires_real_images":true,"topic_archetype":"brand_official_site","media_pressure":{"min_real_image_pages":1,"min_dominant_real_image_pages":1,"dominant_image_min_area_bp":3000,"require_cover_dominant_real_image":true,"max_consecutive_infographic_only_pages":2,"min_unique_real_images":1},"editorial_quality_target":{"minimum_score":80,"require_media_pressure_passed":true}}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", validSchemaDeckJSON("slides/01.svg"))
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Claim","central_claim":"This slide has a concrete claim for validation.","audience_takeaway":"The audience understands the validation target.","supporting_points":[{"text":"The first sourced point carries enough explanatory detail.","source_refs":["s1"]},{"text":"The second sourced point carries enough explanatory detail.","source_refs":["s1"]}],"source_bound_facts":[{"fact":"This is a source-bound validation fact.","source_ref":"s1","usage":"evidence"}],"source_refs":["s1"],"visuals":[{"id":"v1","type":"image","instruction":"Use hero"}],"so_what":"This keeps slide content valid while asset inventory fails."}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":true,"candidates":[{"id":"cand-hero","query":"hero photo","source_url":"https://example.com/hero.png","source_class":"user_provided","format":"png","width":1200,"height":800,"has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","local_path":"assets/images/hero.png","score_bp":9000,"selected":true,"selection_reason":"user-provided hero image","format_exception_reason":"","rejection_reason":""}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[]}`)
	writePromptContextReceiptForTest(t, StageAssets, map[string]string{})
	writeToolCallReceiptForTest(t, StageAssets, "resolve_image_assets")

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected manifest asset without inventory entry to be rejected")
	}
	if !strings.Contains(err.Error(), "asset_inventory") || !strings.Contains(err.Error(), "hero") {
		t.Fatalf("error = %v, want asset_inventory missing hero rejection", err)
	}
}

func validSchemaDeckJSON(path string) string {
	return `{"prompt_contract":` + promptContractJSON(StageOutline) + `,"main_title":"Demo Deck","style_instruction":{"aesthetic_direction":"Editorial report","color_palette":{},"typography":{}},"slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","layout_family":"full_bleed_hero","layout_archetype":"full_bleed_photo_title","layout_signature":"full_bleed_poster","story_function":"hook","primary_asset_role":"topic anchor","fusion_candidate":false,"path":"` + path + `"}]}`
}

func validQualityReportJSON() string {
	return `{"status":"passed","issues":[],"metrics":{"slides":1,"sources":1,"web_sources":0,"assets":0,"slides_with_source_refs":1,"slides_with_visuals":1,"slides_with_image_assets":0,"image_coverage_bp":0,"unique_image_assets":0,"official_image_assets":0}}`
}

func TestValidateStageOutputsRejectsNonCanonicalIntegers(t *testing.T) {
	for _, pages := range []string{"8.0", "8e0", "0.99999999999999999"} {
		t.Run(pages, func(t *testing.T) {
			initStatusTestRun(t)
			raw := `{"title":"Demo","input":"source.md","pages":` + pages + `}`
			if err := os.WriteFile(filepath.Join("demo", "request", "request.json"), []byte(raw), 0o644); err != nil {
				t.Fatal(err)
			}

			err := ValidateStageOutputs("demo")
			if err == nil {
				t.Fatal("expected schema validation error")
			}
			if !strings.Contains(err.Error(), "request/request.json") || !strings.Contains(err.Error(), "pages") {
				t.Fatalf("error = %v, want path and pages field", err)
			}
		})
	}
}

func TestCompleteCurrentStageRejectsInvalidCurrentStageOutputSchema(t *testing.T) {
	initStatusTestRun(t)
	if err := os.WriteFile(filepath.Join("demo", "request", "source_manifest.json"), []byte(`{"sources":[{"path":"source.md","type":"remote"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := CompleteCurrentStage("demo")
	if err == nil {
		t.Fatal("expected schema validation error")
	}
	run := readStatusTestRunFile(t)
	if run.CurrentStage != StageRequest {
		t.Fatalf("run.CurrentStage = %q, want %q", run.CurrentStage, StageRequest)
	}
	if got := stageStatus(t, run, StageRequest); got == StatusDone {
		t.Fatalf("request stage status = %q, want not %q", got, StatusDone)
	}
	if _, statErr := os.Stat(filepath.Join("demo", "receipts", "request.json")); !os.IsNotExist(statErr) {
		t.Fatalf("receipt should not be written, stat err = %v", statErr)
	}
}
