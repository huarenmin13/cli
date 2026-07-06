package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCheckQualityAllowsExplicitLocalSourceWithoutFullPageWebSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"local1","path":"source.md","title":"Local Source","excerpt":"Input","usage":"Support","retrieval":"local_file"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["local1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only slide; no image assets required"}`)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteQualityVisualReceiptForTest(t, "s1", "quiet_synthesis", "single_claim_poster")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityRejectsTopicDeckWithoutFullPageWebOrExplicitLocalSource(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"source1","path":"source.md","title":"Weak Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["source1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.research") {
		t.Fatalf("issues = %+v, want svglide.quality.research", report.Issues)
	}
}

func TestCheckQualityRejectsSlideContentWithoutSourceRefs(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":[],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.source_refs") {
		t.Fatalf("issues = %+v, want svglide.quality.source_refs", report.Issues)
	}
}

func TestCheckQualityRejectsMissingVisualAsset(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset") {
		t.Fatalf("issues = %+v, want svglide.quality.asset", report.Issues)
	}
}

func TestCheckQualityFailsEntityDeckWithoutRealVisualAssets(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/request.json", `{"title":"NVIDIA Financial Report","topic":"Generate a comprehensive financial report for Q4 2023 for Nvidia."}`)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"resolved_entity":{"name":"NVIDIA","type":"company","confidence_bp":9500,"confidence_band":"high","reason":"Named public company"},"ambiguity":{"status":"resolved","candidates":[]},"research_required":true,"clarification_question":""}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"NVIDIA Financial Report","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","key_message":"Financial report","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"nvda","path":"https://investor.nvidia.com/","title":"NVIDIA IR","excerpt":"Financial report","usage":"financial data","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Financial report","source_refs":["nvda"],"visuals":[{"id":"chart","type":"none","instruction":"Chart-only cover"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"This data-report deck does not require raster images; charts are enough."}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[],"no_image_reason":"This data-report deck does not require raster images; charts are enough."}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 1280 720">`+fontTokenStyleForTest()+`<rect width="1280" height="720" fill="#fff"/><text x="80" y="120" font-size="48">NVIDIA Q4 Financial Report</text></svg>`)
	mustWriteQualityVisualReceiptForTest(t, "s1", "quiet_synthesis", "single_claim_poster")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if report.Metrics.VisualAssetIssueCount == 0 {
		t.Fatalf("visual asset issue count = 0, want > 0")
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.visual_asset.cover_real_hero_missing") {
		t.Fatalf("issues = %+v, want cover hero missing", report.Issues)
	}
}

func TestCheckQualityPassesAnyGenReadyRun(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if len(report.Issues) != 0 {
		t.Fatalf("issues = %+v, want empty", report.Issues)
	}
	if report.Metrics.Slides != 1 || report.Metrics.Sources != 1 || report.Metrics.WebSources != 1 || report.Metrics.Assets != 1 || report.Metrics.SlidesWithSourceRef != 1 || report.Metrics.SlidesWithVisuals != 1 {
		t.Fatalf("metrics = %+v, want all ones", report.Metrics)
	}
	raw, err := os.ReadFile(filepath.Join("demo", "quality_report.json"))
	if err != nil {
		t.Fatalf("missing quality_report.json: %v", err)
	}
	var written QualityReport
	if err := json.Unmarshal(raw, &written); err != nil {
		t.Fatal(err)
	}
	if written.Status != "passed" {
		t.Fatalf("written status = %q, want passed", written.Status)
	}
}

func TestCheckQualityRejectsBrandOfficialSiteWithLowImageCoverage(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{
	  "resolved_entity":{"name":"KANEKO OPTICAL","type":"brand"},
	  "visual_quality_contract":{
	    "profile":"brand_official_site",
	    "requires_real_images":true,
	    "min_image_coverage_bp":7000,
	    "min_unique_images":6,
	    "min_official_images":4,
	    "allow_repeated_hero_only":false,
	    "reason":"真实品牌官网主题需要官网图片资产支撑。"
	  }
	}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Kaneko","slides":[
	  {"id":"s1","title":"Cover","summary":"Cover","role":"cover","key_message":"Cover","path":"slides/01.svg"},
	  {"id":"s2","title":"Thesis","summary":"Thesis","role":"thesis","key_message":"Thesis","path":"slides/02.svg"},
	  {"id":"s3","title":"History","summary":"History","role":"history","key_message":"History","path":"slides/03.svg"},
	  {"id":"s4","title":"Factory","summary":"Factory","role":"factory","key_message":"Factory","path":"slides/04.svg"},
	  {"id":"s5","title":"Product","summary":"Product","role":"product","key_message":"Product","path":"slides/05.svg"},
	  {"id":"s6","title":"Retail","summary":"Retail","role":"retail","key_message":"Retail","path":"slides/06.svg"},
	  {"id":"s7","title":"Process","summary":"Process","role":"process","key_message":"Process","path":"slides/07.svg"},
	  {"id":"s8","title":"Closing","summary":"Closing","role":"closing","key_message":"Closing","path":"slides/08.svg"}
	]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[
	  {"id":"kaneko-home","path":"https://www.kaneko-optical.co.jp/zh-CHS/","title":"Home","excerpt":"Official site","usage":"identity","retrieval":"full_page"},
	  {"id":"user-hero-image","path":"/Users/bytedance/Downloads/image_gwnb.png","title":"User image","excerpt":"Hero","usage":"visual reference","retrieval":"user_provided"}
	]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[
	  {"id":"s1","content":"Cover","source_refs":["kaneko-home","user-hero-image"],"visuals":[{"id":"asset-cover","type":"image","instruction":"Hero"}]},
	  {"id":"s2","content":"Thesis","source_refs":["kaneko-home"],"visuals":[{"id":"none-s2","type":"none","instruction":"Native diagram"}]},
	  {"id":"s3","content":"History","source_refs":["kaneko-home"],"visuals":[{"id":"none-s3","type":"none","instruction":"Native timeline"}]},
	  {"id":"s4","content":"Factory","source_refs":["kaneko-home"],"visuals":[{"id":"none-s4","type":"none","instruction":"Native matrix"}]},
	  {"id":"s5","content":"Product","source_refs":["kaneko-home"],"visuals":[{"id":"none-s5","type":"none","instruction":"Native cards"}]},
	  {"id":"s6","content":"Retail","source_refs":["kaneko-home"],"visuals":[{"id":"none-s6","type":"none","instruction":"Native metrics"}]},
	  {"id":"s7","content":"Process","source_refs":["kaneko-home"],"visuals":[{"id":"none-s7","type":"none","instruction":"Native rail"}]},
	  {"id":"s8","content":"Closing","source_refs":["kaneko-home","user-hero-image"],"visuals":[{"id":"asset-closing","type":"image","instruction":"Hero again"}]}
	]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[
	  {"id":"asset-cover","slide_id":"s1","visual_id":"asset-cover","kind":"image","local_path":"assets/images/hero.png","source_url":"file:///Users/bytedance/Downloads/image_gwnb.png","status":"ready","usage":"cover"},
	  {"id":"asset-closing","slide_id":"s8","visual_id":"asset-closing","kind":"image","local_path":"assets/images/hero.png","source_url":"file:///Users/bytedance/Downloads/image_gwnb.png","status":"ready","usage":"closing"}
	]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[
	  {"id":"asset-cover","path":"assets/images/hero.png","source_url":"file:///Users/bytedance/Downloads/image_gwnb.png","width":1704,"height":868,"semantic_type":"brand hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":""}
	]}`)
	mustWriteTestFile(t, "demo/assets/images/hero.png", "png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/hero.png"/><text>Cover</text></svg>`)
	mustWriteTestFile(t, "demo/slides/08.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/hero.png"/><text>Closing</text></svg>`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for low image coverage; metrics=%+v", report.Status, report.Metrics)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_coverage") {
		t.Fatalf("issues = %+v, want svglide.quality.image_coverage", report.Issues)
	}
}

func TestCheckQualityRejectsWeakCoverWhenVisualContractRequiresStrongCover(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"mode":"default_floor","deck_type":"brand","must_have":{"strong_cover":true}}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","visual_intent":"Use a strong first impression","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Cover","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","visual_id":"hero","kind":"image","local_path":"assets/images/hero.png","source_url":"https://example.com/hero.png","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/images/hero.png", "png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/hero.png" x="40" y="40" width="320" height="180"/><text x="48" y="260">Cover</text></svg>`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for weak cover; metrics=%+v", report.Status, report.Metrics)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.weak_cover") {
		t.Fatalf("issues = %+v, want svglide.quality.weak_cover", report.Issues)
	}
}

func TestCheckQualityRejectsPosterOnlyCoverWhenRealHeroImageRequired(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"profile":"data_report","cover_requires_real_hero_image":true}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"NVIDIA Report","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"nvidia","path":"https://www.nvidia.com/en-us/about-nvidia/","title":"NVIDIA","excerpt":"Official source","usage":"identity","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Cover","source_refs":["nvidia"],"visuals":[{"id":"hero","type":"image","instruction":"Hero"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","visual_id":"hero","kind":"image","local_path":"assets/images/generated-chip.svg","source_url":"","status":"ready","usage":"Generated chip hero"}]}`)
	mustWriteTestFile(t, "demo/assets/images/generated-chip.svg", `<svg/>`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/generated-chip.svg" x="0" y="0" width="960" height="540"/><text x="48" y="120" font-size="72">NVIDIA</text></svg>`)
	mustWriteQualityVisualReceiptForTest(t, "s1", "full_bleed_hero", "full_bleed_generated_svg")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for generated SVG cover; metrics=%+v", report.Status, report.Metrics)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.cover_real_hero_image") {
		t.Fatalf("issues = %+v, want cover_real_hero_image", report.Issues)
	}
	if report.Metrics.CoverRealHeroImage {
		t.Fatalf("cover_real_hero_image = true, want false for generated SVG")
	}
}

func TestCheckQualityDoesNotCountPreviewSlideSVGImagesAsRealImages(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"resolved_entity":{"name":"Demo","type":"brand"},"visual_quality_contract":{"profile":"brand_official_site","requires_real_images":true,"min_image_coverage_bp":10000,"min_unique_images":1,"forbid_preview_wrapper_images_as_real_images":true}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","visual_id":"hero","kind":"image","local_path":"slides/01.svg","source_url":"","status":"ready","usage":"Preview wrapper"}]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<text x="48" y="80">Cover</text></svg>`)
	mustWriteQualityVisualReceiptForTest(t, "s1", "quiet_synthesis", "single_claim_poster")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Metrics.RealImageAssets != 0 || report.Metrics.SlidesWithRealImageAssets != 0 {
		t.Fatalf("metrics = %+v, preview slide SVG must not count as real image", report.Metrics)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.preview_wrapper_image") {
		t.Fatalf("issues = %+v, want preview_wrapper_image", report.Issues)
	}
}

func TestCheckQualityRejectsMissingVegaLiteManifestWhenRequired(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"profile":"data_report","required_chart_renderer":"vega-lite","min_chart_svg_assets":1,"min_vega_lite_specs":1}}`)
	mustWriteVegaLiteQualityDeck(t)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for missing Vega-Lite manifest", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.missing_chart_manifest") {
		t.Fatalf("issues = %+v, want missing_chart_manifest", report.Issues)
	}
}

func TestCheckQualityRejectsHandwrittenChartWhenVegaLiteRequired(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"profile":"data_report","required_chart_renderer":"vega-lite","min_chart_svg_assets":1,"min_vega_lite_specs":1}}`)
	mustWriteVegaLiteQualityDeck(t)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"svg","charts":[{"id":"revenue","slide_id":"s1","renderer":"svg","svg_path":"assets/charts/revenue.svg"}]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for hand-written SVG chart", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.chart_renderer") {
		t.Fatalf("issues = %+v, want chart_renderer", report.Issues)
	}
}

func TestCheckQualityRejectsMissingTypographyContractWhenRequired(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"profile":"data_report","typography_contract_required":true}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Financial Report","slides":[{"id":"s1","title":"Summary","summary":"Summary","role":"cover","key_message":"Summary","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/report","title":"Report","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"none","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only report summary"}`)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteQualityVisualReceiptForTest(t, "s1", "quiet_synthesis", "single_claim_poster")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for missing typography contract", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.missing_typography_contract") && !qualityIssueCodesContain(report.Issues, "svglide.quality.typography_contract") {
		t.Fatalf("issues = %+v, want typography contract failure", report.Issues)
	}
}

func TestStrictVisualContractMissingRealImagesFixtureFailsClosed(t *testing.T) {
	repoRoot, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	fixture := filepath.Join(repoRoot, "testdata", "svglide", "strict_visual_contract_missing_real_images")
	cwd := t.TempDir()
	t.Chdir(cwd)
	writeDefaultSemanticContractForTest(t)
	runRoot := filepath.Join(cwd, "fixture")
	copyTestDir(t, fixture, runRoot)

	report, err := CheckQuality("fixture")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed; metrics=%+v", report.Status, report.Metrics)
	}
	for _, want := range []string{"svglide.quality.image_coverage", "svglide.quality.cover_real_hero_image"} {
		if !qualityIssueCodesContain(report.Issues, want) {
			t.Fatalf("issues = %+v, want %s", report.Issues, want)
		}
	}
	if report.Metrics.RealImageAssets != 0 || report.Metrics.GeneratedSVGAssets == 0 {
		t.Fatalf("metrics = %+v, want generated SVG but zero real images", report.Metrics)
	}
}

func copyTestDir(t *testing.T, src string, dst string) {
	t.Helper()
	entries, err := os.ReadDir(src)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(dst, 0o755); err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())
		if entry.IsDir() {
			copyTestDir(t, srcPath, dstPath)
			continue
		}
		raw, err := os.ReadFile(srcPath)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(dstPath, raw, 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func TestCheckQualityRejectsLowEvidenceDensityWhenVisualContractRequiresEvidenceGrid(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/brief/visual_quality_contract.json", `{"visual_quality_contract":{"mode":"default_floor","deck_type":"brand_factory","must_have":{"evidence_page_min_visuals":4,"visual_roles_required":["hero_cover","evidence_grid"]}}}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[
	  {"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","visual_intent":"Full bleed cover image","key_message":"Cover","path":"slides/01.svg"},
	  {"id":"s2","title":"Process","summary":"Process","role":"process","visual_role":"evidence_grid","visual_intent":"Use process images as evidence","key_message":"Process","path":"slides/02.svg"}
	]}`)
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
	mustWriteTestFile(t, "demo/assets/images/cover.png", "png")
	mustWriteTestFile(t, "demo/assets/images/p1.png", "png")
	mustWriteTestFile(t, "demo/assets/images/p2.png", "png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/cover.png" x="0" y="0" width="960" height="540"/></svg>`)
	mustWriteTestFile(t, "demo/slides/02.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/p1.png" x="40" y="40" width="320" height="180"/><image slide:role="image" href="../assets/images/p2.png" x="400" y="40" width="320" height="180"/><text x="48" y="300">Process</text></svg>`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for low evidence density; metrics=%+v", report.Status, report.Metrics)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.low_evidence_density") {
		t.Fatalf("issues = %+v, want svglide.quality.low_evidence_density", report.Issues)
	}
}

func TestKanekoCalibrationFixtureIsQualityFloorOnly(t *testing.T) {
	raw, err := os.ReadFile(filepath.Join("..", "..", "testdata", "svglide", "visual_quality", "kaneko_baseline_calibration.json"))
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct {
		BenchmarkUsage string `json:"benchmark_usage"`
		DeckType       string `json:"deck_type"`
		Minimums       struct {
			StrongCover                bool `json:"strong_cover"`
			EvidencePageMinVisuals     int  `json:"evidence_page_min_visuals"`
			SemanticImageCoverageMinBP int  `json:"semantic_image_coverage_min_bp"`
		} `json:"minimums"`
		QualityDimensions []string `json:"quality_dimensions"`
	}
	if err := json.Unmarshal(raw, &fixture); err != nil {
		t.Fatal(err)
	}
	if fixture.BenchmarkUsage != "quality_floor_only" {
		t.Fatalf("benchmark_usage = %q, want quality_floor_only", fixture.BenchmarkUsage)
	}
	if fixture.DeckType != "brand_factory" || !fixture.Minimums.StrongCover || fixture.Minimums.EvidencePageMinVisuals < 12 || fixture.Minimums.SemanticImageCoverageMinBP < 9000 {
		t.Fatalf("fixture = %+v, want脱敏质量下限指标", fixture)
	}
	if strings.Contains(string(raw), "<svg") || strings.Contains(string(raw), "viewBox") || strings.Contains(string(raw), "foreignObject") {
		t.Fatalf("fixture leaks SVG source: %s", string(raw))
	}
	if len(fixture.QualityDimensions) == 0 {
		t.Fatalf("quality_dimensions empty: %+v", fixture)
	}
}

func TestCheckQualityAllowsExperimentAssetsAndDeferredUnsupportedVisuals(t *testing.T) {
	t.Chdir(t.TempDir())
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/report","title":"Report","excerpt":"Full page excerpt","usage":"evidence","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"main_title":"Demo Deck","style_instruction":{"aesthetic_direction":"Editorial report","color_palette":{},"typography":{}},"slides":[{"id":"s1","title":"Chart claim","summary":"Needs chart later","role":"content","key_message":"Chart is deferred","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Chart-backed point","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Use a remote hero image"},{"id":"chart1","type":"chart","instruction":"Use a real chart when chart generation is enabled"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"https://example.com/hero.png","usage":"Hero image","status":"ready"},{"id":"chart1","slide_id":"s1","type":"chart","path":"","usage":"Deferred chart generation","status":"deferred"}]}`)
	mustWriteQualitySlideWithImage(t, "https://example.com/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityAllowsAbsoluteReadyAssetPathInExperiment(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	outside := filepath.Join(t.TempDir(), "hero.png")
	if err := os.WriteFile(outside, []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+outside+`","usage":"Hero image","status":"ready"}]}`)
	mustWriteQualitySlideWithImage(t, outside)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
	}
}

func TestQualityAllowsHeroPhotoJPGWhenFullBleedReady(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"high-resolution official hero photo"}]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if qualityIssueCodesContain(report.Issues, "svglide.quality.image_role_format") {
		t.Fatalf("hero jpg should not be rejected as PNG-only: %#v", report.Issues)
	}
}

func TestQualityRejectsTransparentSubjectWithoutAlphaOrFallback(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 1280 720">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/product.jpg" x="120" y="80" width="520" height="360"/><text x="80" y="620">Cover</text></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"product","slide_id":"s1","kind":"image","local_path":"assets/images/product.jpg","source_url":"https://example.com/product.jpg","status":"ready","usage":"Floating product"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"product","path":"assets/images/product.jpg","source_url":"https://example.com/product.jpg","width":1200,"height":800,"semantic_type":"product","large_ok":true,"full_bleed_ok":false,"recommended_use":"floating product","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"floating_product","fit_role":"floating_subject","selection_reason":""}]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_role_format") {
		t.Fatalf("expected floating product jpg without alpha/format_exception_reason to fail: %#v", report.Issues)
	}
}

func TestQualityAllowsTransparentSubjectWithFormatExceptionReason(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 1280 720">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/product.jpg" x="120" y="80" width="520" height="360"/><text x="80" y="620">Cover</text></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"product","slide_id":"s1","kind":"image","local_path":"assets/images/product.jpg","source_url":"https://example.com/product.jpg","status":"ready","usage":"Floating product"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"product","path":"assets/images/product.jpg","source_url":"https://example.com/product.jpg","width":1200,"height":800,"semantic_type":"product","large_ok":true,"full_bleed_ok":false,"recommended_use":"floating product","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"floating_product","fit_role":"floating_subject","selection_reason":"best official product image despite no transparent cutout","format_exception_reason":"official source only provides JPG; SVG author must mask/crop on clean background"}]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if qualityIssueCodesContain(report.Issues, "svglide.quality.image_role_format") {
		t.Fatalf("structured format_exception_reason should satisfy image format exception: %#v", report.Issues)
	}
}

func TestCheckQualityRejectsEmptyVisuals(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[]}`)

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.visuals") {
		t.Fatalf("issues = %+v, want svglide.quality.visuals", report.Issues)
	}
}

func TestCheckQualityRejectsVisualAssetTypeMismatch(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"diagram","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed", report.Status)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.asset") {
		t.Fatalf("issues = %+v, want svglide.quality.asset", report.Issues)
	}
}

func TestAnyGenSemanticReportRejectsAllDiagramWithoutNoImageReason(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Movie Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Movie hook","path":"slides/01.svg"},{"id":"s2","title":"Context","summary":"Context summary","role":"content","key_message":"Movie context","path":"slides/02.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/movie","title":"Movie Source","excerpt":"Movie excerpt","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening","source_refs":["web1"],"visuals":[{"id":"diagram1","type":"diagram","instruction":"Diagram fallback"}]},{"id":"s2","content":"Context","source_refs":["web1"],"visuals":[{"id":"diagram2","type":"diagram","instruction":"Diagram fallback"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"diagram1","slide_id":"s1","type":"diagram","path":"assets/images/diagram1.svg","usage":"Diagram fallback","status":"ready"},{"id":"diagram2","slide_id":"s2","type":"diagram","path":"assets/images/diagram2.svg","usage":"Diagram fallback","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/images/diagram1.svg", `<svg/>`)
	mustWriteTestFile(t, "demo/assets/images/diagram2.svg", `<svg/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want semantic failure for all-diagram fallback without no_image_reason; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainRule(report.Findings, "no_silent_all_diagram_fallback") {
		t.Fatalf("findings = %+v, want no_silent_all_diagram_fallback", report.Findings)
	}
	if _, err := os.Stat(filepath.Join("demo", "anygen_semantic_report.json")); err != nil {
		t.Fatalf("missing anygen_semantic_report.json: %v", err)
	}
}

func semanticFindingsContainRule(findings []SemanticFinding, ruleID string) bool {
	for _, finding := range findings {
		if finding.RuleID == ruleID {
			return true
		}
	}
	return false
}

func TestAnyGenSemanticReportRejectsUnsafeReadyImageAssetPaths(t *testing.T) {
	tests := []struct {
		name       string
		assetPath  string
		setupAsset func(t *testing.T)
	}{
		{
			name:      "file url",
			assetPath: "file:///tmp/secret.png",
		},
		{
			name:      "absolute path",
			assetPath: "/Users/example/secret.png",
		},
		{
			name:      "missing local asset",
			assetPath: "assets/images/missing.png",
		},
		{
			name:      "symlink local asset",
			assetPath: "assets/images/hero.png",
			setupAsset: func(t *testing.T) {
				t.Helper()
				if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile("outside-hero.png", []byte("png"), 0o644); err != nil {
					t.Fatal(err)
				}
				if err := os.Symlink(filepath.Join("..", "..", "outside-hero.png"), filepath.Join("demo", "assets", "images", "hero.png")); err != nil {
					t.Fatal(err)
				}
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initStatusTestRun(t)
			if tt.setupAsset != nil {
				tt.setupAsset(t)
			}
			writeSemanticImageDeck(t, tt.assetPath)

			report, err := EvaluateAnyGenSemantics("demo")
			if err != nil {
				t.Fatal(err)
			}
			if report.Status != "failed" {
				t.Fatalf("status = %q, want failed for unsafe ready image asset path %q; findings=%+v", report.Status, tt.assetPath, report.Findings)
			}
			if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_path") {
				t.Fatalf("findings = %+v, want svglide.semantic.asset_path", report.Findings)
			}
		})
	}
}

func TestAnyGenSemanticReportRejectsBrowserRelativeMissingImageHref(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Deck","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Cover","source_refs":[],"visuals":[{"id":"hero","type":"image","instruction":"Hero"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","visual_id":"hero","kind":"image","local_path":"assets/images/hero.png","source_url":"https://example.com/hero.png","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/images/hero.png", "png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<image slide:role="image" href="assets/images/hero.png" x="0" y="0" width="960" height="540"/></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed because browser resolves href against slides/ directory; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.browser_asset_path") {
		t.Fatalf("findings = %+v, want svglide.semantic.browser_asset_path", report.Findings)
	}
}

func TestAnyGenSemanticReportAllowsBrowserRelativeImageHrefAndNoteSources(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Deck","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Cover","source_refs":["kaneko-home"],"visuals":[{"id":"hero","type":"image","instruction":"Hero"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","visual_id":"hero","kind":"image","local_path":"assets/images/hero.png","source_url":"https://example.com/hero.png","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/images/hero.png", "png")
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<slide:note>Sources: kaneko-home</slide:note><image slide:role="image" href="../assets/images/hero.png" x="0" y="0" width="960" height="540"/></svg>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed for browser-relative image href and note source marker; findings=%+v", report.Status, report.Findings)
	}
	if report.Metrics.MissingAssetCount != 0 {
		t.Fatalf("MissingAssetCount = %d, want 0", report.Metrics.MissingAssetCount)
	}
	if report.Metrics.VisibleLeakCount != 0 {
		t.Fatalf("VisibleLeakCount = %d, want 0 for slide:note source marker", report.Metrics.VisibleLeakCount)
	}
}

func TestAnyGenSemanticReportAllowsRegisteredChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, "../assets/charts/revenue.svg")
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed for registered chart href; findings=%+v", report.Status, report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsUnregisteredChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[]}`, "../assets/charts/revenue.svg")

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for unregistered chart href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.browser_asset_path") {
		t.Fatalf("findings = %+v, want svglide.semantic.browser_asset_path", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsUnsafeReadyChartHref(t *testing.T) {
	initStatusTestRun(t)
	writeSemanticChartDeck(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"file:///tmp/secret.svg","usage":"Revenue chart","status":"ready"}]}`, "file:///tmp/secret.svg")

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for unsafe chart href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.browser_asset_path") {
		t.Fatalf("findings = %+v, want svglide.semantic.browser_asset_path", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsChartAssetUsedAsImageHref(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)
	writeSemanticDeckWithSlideBody(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, `<image slide:role="image" href="../assets/charts/revenue.svg" x="80" y="80" width="640" height="360"/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for chart asset used as image href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_type") {
		t.Fatalf("findings = %+v, want svglide.semantic.asset_type", report.Findings)
	}
}

func TestAnyGenSemanticReportRejectsExternalUseHref(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg/>`)
	writeSemanticDeckWithSlideBody(t, `{"mode":"experiment_unrestricted_assets","no_image_reason":"Chart-only deck; no photo assets required","assets":[{"id":"chart1","slide_id":"s1","type":"chart","path":"assets/charts/revenue.svg","usage":"Revenue chart","status":"ready"}]}`, `<use href="../assets/charts/revenue.svg" x="80" y="80" width="640" height="360"/>`)

	report, err := EvaluateAnyGenSemantics("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for external use href; findings=%+v", report.Status, report.Findings)
	}
	if !semanticFindingsContainCode(report.Findings, "svglide.semantic.asset_type") {
		t.Fatalf("findings = %+v, want svglide.semantic.asset_type", report.Findings)
	}
}

func semanticFindingsContainCode(findings []SemanticFinding, code string) bool {
	for _, finding := range findings {
		if finding.Code == code {
			return true
		}
	}
	return false
}

func writeSemanticImageDeck(t *testing.T, assetPath string) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Image Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Image hook","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Opening","source_refs":[],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"`+assetPath+`","usage":"Hero image","status":"ready"}]}`)
	mustWriteQualitySlideWithImage(t, assetPath)
}

func writeSemanticChartDeck(t *testing.T, assetsPlan string, chartHref string) {
	t.Helper()
	writeSemanticDeckWithSlideBody(t, assetsPlan, `<rect slide:role="chart" href="`+chartHref+`" x="80" y="80" width="640" height="360"/>`)
}

func writeSemanticDeckWithSlideBody(t *testing.T, assetsPlan string, slideBody string) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Chart Deck","slides":[{"id":"s1","title":"Revenue","summary":"Revenue summary","role":"content","key_message":"Revenue changed","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Revenue changed","source_refs":[],"visuals":[{"id":"chart1","type":"chart","instruction":"Revenue chart"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", assetsPlan)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#fff"/>`+slideBody+`<text x="48" y="500">Revenue</text></svg>`)
}

func TestCheckQualityCountsSlidesWithVisualsPerPage(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"},{"id":"logo","type":"diagram","instruction":"Support diagram"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"},{"id":"logo","slide_id":"s1","type":"diagram","path":"assets/images/logo.svg","usage":"Support diagram","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("demo", "assets", "images", "logo.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if report.Metrics.SlidesWithVisuals != 1 {
		t.Fatalf("metrics.slides_with_visuals = %d, want 1", report.Metrics.SlidesWithVisuals)
	}
}

func TestCheckQualityAllowsSymlinkReadyAssetPathInExperiment(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.png","usage":"Hero image","status":"ready"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "assets", "images"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join("outside-hero.png"), []byte("png"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(filepath.Join("..", "..", "outside-hero.png"), filepath.Join("demo", "assets", "images", "hero.png")); err != nil {
		t.Fatal(err)
	}
	mustWriteQualitySlideWithImage(t, "assets/images/hero.png")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed; issues = %+v", report.Status, report.Issues)
	}
}

func TestCheckQualityUsesOutlineDeckNotRunArtifactDeck(t *testing.T) {
	initStatusTestRun(t)
	run := readStatusTestRunFile(t)
	run.Artifacts.Deck = "custom/deck.json"
	writeStatusTestRunFile(t, run)
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`)
	if err := os.MkdirAll(filepath.Join("demo", "custom"), 0o755); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/custom/deck.json", `{"title":"Custom Deck","slides":[{"id":"c1","title":"Custom 1","summary":"Custom summary 1","role":"cover","key_message":"Custom key 1","path":"slides/01.svg"},{"id":"c2","title":"Custom 2","summary":"Custom summary 2","role":"content","key_message":"Custom key 2","path":"slides/02.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"v1","type":"none","instruction":"Text-only"}]},{"id":"c1","content":"Custom claim 1","source_refs":["web1"],"visuals":[{"id":"v2","type":"none","instruction":"Text-only"}]},{"id":"c2","content":"Custom claim 2","source_refs":["web1"],"visuals":[{"id":"v3","type":"none","instruction":"Text-only"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"assets":[],"no_image_reason":"Text-only slide; no image assets required"}`)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteQualityVisualReceiptForTest(t, "s1", "quiet_synthesis", "single_claim_poster")

	report, err := CheckQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("status = %q, want passed", report.Status)
	}
	if report.Metrics.Slides != 1 {
		t.Fatalf("metrics.slides = %d, want 1 from outline/deck.json", report.Metrics.Slides)
	}
}

func mustWriteVegaLiteQualityDeck(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Financial Deck","slides":[{"id":"s1","title":"Revenue","summary":"Revenue trend","role":"content","key_message":"Revenue expanded","layout_family":"data_scoreboard","layout_archetype":"data_scoreboard","layout_signature":"single_chart","story_function":"proof","primary_asset_role":"financial chart","fusion_candidate":false,"path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"10k","path":"https://example.com/annual-report","title":"Annual report","excerpt":"Revenue was 60.9 billion","usage":"financial data","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Revenue expanded","source_refs":["10k"],"visuals":[{"id":"revenue","type":"chart","instruction":"Revenue chart"}]}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"revenue","slide_id":"s1","visual_id":"revenue","kind":"chart","local_path":"assets/charts/revenue.svg","source_url":"","status":"ready","usage":"Revenue chart"}],"no_image_reason":"Financial chart page; no photo required"}`)
	mustWriteTestFile(t, "demo/assets/charts/revenue.svg", `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#fff"/><rect slide:role="chart" href="../assets/charts/revenue.svg" x="80" y="96" width="720" height="320"/><text x="48" y="480">Revenue: 60.9B</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"proof","layout_family":"data_scoreboard","layout_archetype":"data_scoreboard","layout_signature":"single_chart","thumbnail_job":"chart proof","visual_center":"revenue chart","topic_fit_claim":"matches financial report","information_density_plan":"one main chart and one sourced note","page_difference_from_previous":"first chart page","primary_asset":"assets/charts/revenue.svg","asset_role":"financial proof","font_role_usage":{"display":"Noto Serif CJK SC","body":"Noto Sans CJK SC","number":"Roboto Mono","label":"PingFang SC"},"composition_intent":"financial analysis chart","data_visual_rationale":"shows revenue change with sourced numbers","source_evidence":["FY revenue 60.9 billion from 10k"],"fusion_spec":{"enabled":false},"qa_expectations":["chart has numeric evidence"]}]}`)
}

func mustWriteQualitySlideWithImage(t *testing.T, href string) {
	t.Helper()
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#fff"/><image slide:role="image" href="`+svgHrefForTestAsset(href)+`" x="40" y="40" width="320" height="180"/><text x="48" y="260">Claim</text></svg>`)
	mustWriteQualityVisualReceiptForTest(t, "s1", "character_product_focus", "image_claim")
}

func mustWriteQualityVisualReceiptForTest(t *testing.T, slideID string, family string, signature string) {
	t.Helper()
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"`+slideID+`","story_job":"hook","layout_family":"`+family+`","layout_archetype":"`+inferAuthorLayoutArchetype(family, signature)+`","layout_signature":"`+signature+`","thumbnail_job":"readable claim","visual_center":"topic claim and supporting visual","topic_fit_claim":"matches the requested topic","information_density_plan":"one clear claim with supporting proof","page_difference_from_previous":"distinct opening treatment","primary_asset":"hero","asset_role":"topic anchor","font_role_usage":{"display":"Noto Serif CJK SC","body":"Noto Sans CJK SC","number":"Roboto Mono","label":"PingFang SC"},"composition_intent":"focused editorial slide","data_visual_rationale":"","source_evidence":["web1 supports this claim"],"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)
}

func svgHrefForTestAsset(path string) string {
	if strings.HasPrefix(path, "assets/") {
		return "../" + path
	}
	return path
}

func qualityIssueCodesContain(issues []QualityIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want {
			return true
		}
	}
	return false
}
