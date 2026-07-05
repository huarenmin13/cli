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

func TestValidateStageOutputsRejectsSourcesMissingRetrieval(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	if err := os.WriteFile(filepath.Join("demo", "research", "sources.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"s1","path":"https://example.com","title":"Example","excerpt":"Ex","usage":"supporting evidence"}]}`), 0o644); err != nil {
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
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}]}]}`,
			want: "source_refs",
		},
		{
			name: "missing visual id",
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[{"type":"none","instruction":"No visual needed"}]}]}`,
			want: "visuals[0].id",
		},
		{
			name: "empty visuals",
			raw:  `{"prompt_contract":` + promptContractJSON(StageSlideContent) + `,"slides":[{"id":"s1","content":"Plan","source_refs":["s1"],"visuals":[]}]}`,
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

func TestValidateStageOutputsRejectsAssetsMissingStatus(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	if err := os.WriteFile(filepath.Join("demo", "assets", "assets_plan.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"a1","slide_id":"s1","type":"image","path":"https://example.com/a.png","usage":"hero image"}]}`), 0o644); err != nil {
		t.Fatal(err)
	}

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
			if err := os.WriteFile(filepath.Join("demo", "assets", "asset_inventory.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"a1","path":"`+tt.path+`","source_url":"","width":960,"height":540,"semantic_type":"image","large_ok":true,"full_bleed_ok":true,"recommended_use":"hero image","avoid_reason":""}]}`), 0o644); err != nil {
				t.Fatal(err)
			}
			mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"none","charts":[]}`)

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
		"sources.schema.json",
		"research_coverage.schema.json",
		"slide_content.schema.json",
		"slide_copy_plan.schema.json",
		"assets_plan.schema.json",
		"assets_manifest.schema.json",
		"asset_inventory.schema.json",
		"chart_manifest.schema.json",
		"typography_contract.schema.json",
		"quality.schema.json",
	} {
		if strings.TrimSpace(schemas[name]) == "" {
			t.Fatalf("schema %s is missing", name)
		}
	}
	if !strings.Contains(schemas["sources.schema.json"], `"retrieval"`) {
		t.Fatalf("sources schema missing retrieval contract: %s", schemas["sources.schema.json"])
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
	if !strings.Contains(schemas["deck.schema.json"], `"visual_role"`) || !strings.Contains(schemas["deck.schema.json"], `"visual_intent"`) {
		t.Fatalf("deck schema missing visual role fields: %s", schemas["deck.schema.json"])
	}
	if !strings.Contains(schemas["deck.schema.json"], `"layout_family"`) || !strings.Contains(schemas["deck.schema.json"], `"fusion_candidate"`) {
		t.Fatalf("deck schema missing visual family fields: %s", schemas["deck.schema.json"])
	}
	if strings.TrimSpace(schemas["visual_receipts.schema.json"]) == "" || strings.TrimSpace(schemas["creative_quality.schema.json"]) == "" {
		t.Fatalf("visual quality schemas are missing: receipts=%q creative=%q", schemas["visual_receipts.schema.json"], schemas["creative_quality.schema.json"])
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
	if !strings.Contains(schemas["asset_inventory.schema.json"], `"large_ok"`) || !strings.Contains(schemas["asset_inventory.schema.json"], `"full_bleed_ok"`) {
		t.Fatalf("asset inventory schema missing image suitability fields: %s", schemas["asset_inventory.schema.json"])
	}
	if !strings.Contains(schemas["chart_manifest.schema.json"], `"vega-lite"`) || !strings.Contains(schemas["chart_manifest.schema.json"], `"spec_path"`) {
		t.Fatalf("chart manifest schema missing Vega-Lite fields: %s", schemas["chart_manifest.schema.json"])
	}
	if !strings.Contains(schemas["typography_contract.schema.json"], `"display"`) || !strings.Contains(schemas["typography_contract.schema.json"], `"number"`) {
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
	for _, want := range []string{`"strong_cover"`, `"evidence_page_max_visuals"`, `"repeated_layout_ratio_bp"`, `"visual_role_coverage_bp"`, `"real_image_assets"`, `"vega_lite_spec_assets"`, `"typography_contract_present"`} {
		if !strings.Contains(schemas["quality.schema.json"], want) {
			t.Fatalf("quality schema missing %s: %s", want, schemas["quality.schema.json"])
		}
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
	writePromptContextReceiptWithoutToolCallsForTest(t, StageResearch)

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
	writePromptContextReceiptWithoutToolCallsForTest(t, StageResearch)

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
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","source_refs":["missing"],"visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}]}]}`)
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
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Claim","source_refs":["s1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
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
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Plan","source_refs":[],"visuals":[{"id":"v1","type":"none","instruction":"No visual needed"}]}]}`)
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
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[]}`)
	writePromptContextReceiptWithoutToolCallsForTest(t, StageAssets)

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
