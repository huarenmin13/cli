package svglide

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCheckCreativeQualityRejectsMissingVisualReceipts(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "single_claim_poster", creativeQualityGoodSVG())

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed; report=%+v", report.Status, report)
	}
	if !creativeIssueCodesContain(report.Issues, "svglide.creative.missing_visual_receipts") {
		t.Fatalf("Issues = %+v, want missing_visual_receipts", report.Issues)
	}
}

func TestCheckCreativeQualityWarnModeDowngradesHardFailures(t *testing.T) {
	initStatusTestRun(t)
	setRunVisualQualityModeForTest(t, VisualQualityModeWarn)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "single_claim_poster", creativeQualityGoodSVG())

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed in warn mode; report=%+v", report.Status, report)
	}
	if len(report.Issues) == 0 || report.Issues[0].Severity != "warning" {
		t.Fatalf("Issues = %+v, want warning issues", report.Issues)
	}
}

func TestCheckCreativeQualityRejectsProcessLeakAndWeakTextBoxStack(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "card_stack", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540"/><rect rx="12" x="40" y="40" width="220" height="100"/><rect rx="12" x="300" y="40" width="220" height="100"/><rect rx="12" x="560" y="40" width="220" height="100"/><text x="48" y="90">接缝取色说明</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"card_stack","thumbnail_job":"cards","visual_center":"","topic_fit_claim":"","information_density_plan":"same","page_difference_from_previous":"same","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"stacked cards","data_visual_rationale":"","source_evidence":["web1"],"fusion_spec":{"enabled":false},"qa_expectations":["no process text"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed; report=%+v", report.Status, report)
	}
	for _, code := range []string{"svglide.creative.process_leak", "svglide.creative.weak_slide"} {
		if !creativeIssueCodesContain(report.Issues, code) {
			t.Fatalf("Issues = %+v, want %s", report.Issues, code)
		}
	}
}

func TestCheckCreativeQualityRejectsDataVisualWithoutNumericEvidence(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "data_scoreboard", "scoreboard", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540"/><g class="chart"><rect x="48" y="200" width="100" height="200"/></g><text x="48" y="80">Scoreboard</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"proof","layout_family":"data_scoreboard","layout_archetype":"data_scoreboard","layout_signature":"scoreboard","thumbnail_job":"score","visual_center":"score panel","topic_fit_claim":"shows data claim","information_density_plan":"one metric and one explanation","page_difference_from_previous":"first data page","primary_asset":"","asset_role":"data proof","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"data scoreboard","data_visual_rationale":"compare result shape","source_evidence":["match report"],"fusion_spec":{"enabled":false},"qa_expectations":["numeric evidence required"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || !creativeIssueCodesContain(report.Issues, "svglide.creative.chart_without_evidence") {
		t.Fatalf("report = %+v, want chart_without_evidence failure", report)
	}
}

func TestCheckCreativeQualityRejectsPseudoTacticalDiagram(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "evidence_board", "pitch_lane_diagram", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#f6f8fa"/><rect x="90" y="160" width="560" height="300" fill="#0B3D2E"/><path d="M120 230 C260 180,420 280,600 220" fill="none" stroke="#E8C15A" stroke-width="5"/><path d="M120 320 C260 270,420 370,600 310" fill="none" stroke="#E8C15A" stroke-width="5"/><text x="690" y="230">边路推进</text><text x="690" y="320">禁区终点</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"tactical_explanation","layout_family":"evidence_board","layout_archetype":"annotated_image","layout_signature":"pitch_diagram_with_forward_lanes","thumbnail_job":"terminal chain","visual_center":"pitch diagram showing lanes ending at the striker zone","topic_fit_claim":"explains a tactical system","information_density_plan":"one tactical map and lane labels","page_difference_from_previous":"different abstract tactical page","primary_asset":"tactical pitch diagram","asset_role":"system explanation graphic","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"pitch-map annotation using lines and coordinates","data_visual_rationale":"uses scoring facts to justify the diagram","source_evidence":["src_group_i includes match sequence","src_bio gives 62 goals in 54 appearances"],"container_fit_plan":"labels outside lanes","container_decision":"no cards","text_carrier":"axis_annotation","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"pitch_lane_diagram","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"","renderer":"none","unit":"","source":"","why_chart_is_needed":""},"fusion_spec":{"enabled":false},"qa_expectations":["tactical claim must remain tied to source-backed scoring evidence"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || report.Metrics.PseudoAnalysisDiagramCount != 1 || !creativeIssueCodesContain(report.Issues, "svglide.creative.pseudo_analysis_diagram") {
		t.Fatalf("report = %+v, want pseudo_analysis_diagram failure", report)
	}
}

func TestCheckCreativeQualityAllowsSourceBoundTacticalDiagram(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "evidence_board", "pitch_lane_diagram", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#f6f8fa"/><rect x="90" y="160" width="560" height="300" fill="#0B3D2E"/><path d="M120 230 C260 180,420 280,600 220" fill="none" stroke="#E8C15A" stroke-width="5"/><text x="690" y="230">79' right-channel pass</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"tactical_explanation","layout_family":"evidence_board","layout_archetype":"annotated_image","layout_signature":"pitch_diagram_with_forward_lanes","thumbnail_job":"terminal chain","visual_center":"pitch diagram showing source-bound right-channel sequence","topic_fit_claim":"explains a tactical system","information_density_plan":"one tactical map and lane labels","page_difference_from_previous":"different abstract tactical page","primary_asset":"tactical pitch diagram","asset_role":"system explanation graphic","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"pitch-map annotation using lines and coordinates","data_visual_rationale":"79' sequence explains the right-channel lane","source_evidence":["src_match: 79 minute right channel pass sequence into the penalty area"],"container_fit_plan":"labels outside lanes","container_decision":"no cards","text_carrier":"axis_annotation","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"pitch_lane_diagram","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"","renderer":"none","unit":"","source":"","why_chart_is_needed":""},"fusion_spec":{"enabled":false},"qa_expectations":["tactical geometry must bind to match source"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if creativeIssueCodesContain(report.Issues, "svglide.creative.pseudo_analysis_diagram") {
		t.Fatalf("report = %+v, did not want pseudo_analysis_diagram failure", report)
	}
}

func TestCheckCreativeQualityIgnoresNegativeDiagramGuardrail(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "open_warning_ledger_no_diagram", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#07111F"/><text x="72" y="120">Risk statement</text><text x="72" y="180">No fake tactical diagram is used here.</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"risk","layout_family":"quiet_synthesis","layout_archetype":"statement_ledger","layout_signature":"open_warning_ledger_no_diagram","thumbnail_job":"risk statement","visual_center":"open editorial statement without diagram","topic_fit_claim":"does not draw fake tactical geometry","information_density_plan":"one sourced risk claim and no fake map","page_difference_from_previous":"different open statement page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"not a diagram; text-led synthesis","data_visual_rationale":"","source_evidence":["src_group_i: France 4-1 Norway scoreline"],"container_fit_plan":"open text","container_decision":"no cards","text_carrier":"open_grid","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"open_warning_ledger_no_diagram","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"chart_id":"","renderer":"none","unit":"","source":"","why_chart_is_needed":""},"fusion_spec":{"enabled":false},"qa_expectations":["no fake tactical diagram"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if creativeIssueCodesContain(report.Issues, "svglide.creative.pseudo_analysis_diagram") {
		t.Fatalf("report = %+v, did not want pseudo_analysis_diagram failure", report)
	}
}

func TestCreativeQualityDetectsDefaultCardTextContainer(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "editorial_text", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#f7f6f1"/><rect x="64" y="70" width="360" height="320" rx="24" fill="#101319"/><text x="96" y="140" fill="#fff">Athlete story</text><text x="96" y="202" fill="#fff">Every major claim is simply placed inside a rounded card.</text></svg>`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"single_claim_poster","layout_signature":"editorial_text","thumbnail_job":"text card","visual_center":"main text block","topic_fit_claim":"introduces the sports topic","information_density_plan":"one main claim and supporting explanation","page_difference_from_previous":"opening page with a text-led composition","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"plain text card for a simple claim","data_visual_rationale":"","source_evidence":["official athlete bio"],"fusion_spec":{"enabled":false},"qa_expectations":["use open editorial text when no panel is needed"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || report.Metrics.DefaultCardTextContainerCount != 1 || !creativeIssueCodesContain(report.Issues, "svglide.creative.default_card_text_container") {
		t.Fatalf("report = %+v, want default_card_text_container failure", report)
	}
}

func TestCreativeQualityDetectsTopicTypographyMismatch(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "character_product_focus", "sports_profile", creativeQualityGoodSVG())
	if err := os.WriteFile(filepath.Join("demo", "brief", "typography_contract.json"), []byte(`{"prompt_contract":`+promptContractJSON(StageDesignBrief)+`,"profile":"sports_editorial","font_source":"slide_font_theme_presets","selected_moods":["culture_heritage"],"roles":{"display":{"family":"ChillJinshuSongMedium","weight":"700","size":"42","usage":"cover title"},"body":{"family":"Noto Serif SC","weight":"400","size":"18","usage":"body copy"},"number":{"family":"Noto Sans SC","weight":"700","size":"34","usage":"scores"},"label":{"family":"ChillDuanHeiSong_CompactRegular","weight":"600","size":"13","usage":"labels"}},"rules":["sports deck typography should carry athletic score identity"]}`), 0o644); err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"character_product_focus","layout_archetype":"annotated_image","layout_signature":"sports_profile","thumbnail_job":"sports profile","visual_center":"athlete profile and opening claim","topic_fit_claim":"matches the sports profile topic","information_density_plan":"one claim plus athlete context","page_difference_from_previous":"opening page","primary_asset":"assets/images/athlete.png","asset_role":"sports topic anchor","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"sports editorial profile","data_visual_rationale":"","source_evidence":["league profile"],"fusion_spec":{"enabled":false},"qa_expectations":["typography carries sports identity"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || report.Metrics.TopicTypographyMismatchCount != 1 || !creativeIssueCodesContain(report.Issues, "svglide.typography.identity.profile_mismatch") {
		t.Fatalf("report = %+v, want typography profile mismatch failure", report)
	}
}

func TestCheckCreativeQualityAppliesThemeLayoutRhythm(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/request/theme_contract.json", chineseTeaThemeContractJSONForTest())
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "single_claim_poster", creativeQualityGoodSVG())
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"hook","layout_family":"quiet_synthesis","layout_archetype":"single_claim_poster","layout_signature":"single_claim_poster","thumbnail_job":"opening","visual_center":"opening claim","topic_fit_claim":"introduces the tea topic","information_density_plan":"one opening claim","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"opening editorial poster","data_visual_rationale":"","source_evidence":["source"],"text_carrier":"open_grid","shape_language":"open editorial text","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"renderer":"none"},"fusion_spec":{"enabled":false},"qa_expectations":["theme rhythm applies"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("status = %q, want failed for theme rhythm", report.Status)
	}
	for _, want := range []string{"svglide.creative.theme_min_slide_count", "svglide.creative.theme_required_page_role"} {
		if !creativeIssueCodesContain(report.Issues, want) {
			t.Fatalf("issues = %+v, want %s", report.Issues, want)
		}
	}
}

func TestCheckCreativeQualityRejectsRepeatedLayoutArchetype(t *testing.T) {
	initStatusTestRun(t)
	mustWriteRepeatedArchetypeDeck(t)
	mustWriteRepeatedArchetypeReceipts(t)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed; report=%+v", report.Status, report)
	}
	for _, code := range []string{
		"svglide.creative.layout_archetype_overuse",
		"svglide.creative.adjacent_layout_archetype",
		"svglide.creative.left_right_chart_overuse",
	} {
		if !creativeIssueCodesContain(report.Issues, code) {
			t.Fatalf("Issues = %+v, want %s", report.Issues, code)
		}
	}
}

func TestCheckCreativeQualityRejectsRepeatedRenderedVisualSkeleton(t *testing.T) {
	initStatusTestRun(t)
	deck := authorDeck{Title: "Repeated Skeleton Deck"}
	receipts := visualReceiptsFile{}
	for i := 1; i <= 6; i++ {
		id := fmt.Sprintf("s%d", i)
		path := fmt.Sprintf("slides/%02d.svg", i)
		deck.Slides = append(deck.Slides, authorDeckSlide{
			ID:              id,
			Title:           fmt.Sprintf("Page %d", i),
			Summary:         "Summary",
			Role:            "content",
			KeyMessage:      "Key message",
			LayoutFamily:    "quiet_synthesis",
			LayoutArchetype: "poster_stat_lockup",
			LayoutSignature: fmt.Sprintf("unique_layout_%02d", i),
			StoryFunction:   "proof",
			Path:            path,
		})
		mustWriteTestFile(t, filepath.Join("demo", path), repeatedGenericNodeLineSVGForTest())
		receipts.Slides = append(receipts.Slides, repeatedArchetypeReceipt(id, "quiet_synthesis", "poster_stat_lockup", fmt.Sprintf("unique_layout_%02d", i), "unique metadata but same rendered skeleton", "source evidence 2026"))
	}
	rawDeck, err := json.Marshal(deck)
	if err != nil {
		t.Fatal(err)
	}
	rawReceipts, err := json.Marshal(receipts)
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/outline/deck.json", string(rawDeck))
	mustWriteTestFile(t, "demo/visual_receipts.json", string(rawReceipts))

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || report.Metrics.VisualSkeletonMaxRatioBP != 10000 || !creativeIssueCodesContain(report.Issues, "svglide.creative.visual_skeleton_repetition") {
		t.Fatalf("report = %+v, want visual_skeleton_repetition failure", report)
	}
}

func TestCheckCreativeQualityRejectsVisualIntentMismatch(t *testing.T) {
	initStatusTestRun(t)
	mustWriteCreativeQualityBaseDeck(t, "quiet_synthesis", "sensory_wheel_page", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+`<rect width="960" height="540" fill="#f6f8fa"/><g data-svglide-visual-form="spectrum"><rect x="80" y="220" width="80" height="80"/><rect x="180" y="220" width="80" height="80"/><rect x="280" y="220" width="80" height="80"/><rect x="380" y="220" width="80" height="80"/></g><text x="80" y="120">Taste</text></svg>`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Taste wheel","source_refs":["source"],"visuals":[{"id":"taste","type":"diagram","visual_form":"sensory_wheel","instruction":"Render a sensory wheel"}]}]}`)
	mustWriteTestFile(t, "demo/visual_receipts.json", `{"slides":[{"slide_id":"s1","story_job":"proof","layout_family":"quiet_synthesis","layout_archetype":"poster_stat_lockup","layout_signature":"sensory_wheel_page","thumbnail_job":"taste wheel","visual_center":"taste wheel","topic_fit_claim":"explains sensory dimensions","information_density_plan":"one sensory diagram","page_difference_from_previous":"opening page","primary_asset":"","asset_role":"none","font_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"composition_intent":"sensory wheel diagram","data_visual_rationale":"","source_evidence":["source evidence 2026"],"container_fit_plan":"open diagram labels","container_decision":"no cards","text_carrier":"line_annotation","typography_role_usage":{"display":"Noto Serif SC","body":"Noto Sans SC","number":"Roboto Mono","label":"Noto Sans SC"},"shape_language":"diagram_sensory_wheel","card_budget":{"card_count":0,"why_cards_are_needed":"none"},"chart_receipt":{"renderer":"none"},"fusion_spec":{"enabled":false},"qa_expectations":["visual form must match"]}]}`)

	report, err := CheckCreativeQuality("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" || report.Metrics.VisualIntentMismatchCount != 1 || !creativeIssueCodesContain(report.Issues, "svglide.creative.visual_intent_mismatch") {
		t.Fatalf("report = %+v, want visual_intent_mismatch failure", report)
	}
}

func TestCreativeQualityVisualFixtures(t *testing.T) {
	t.Chdir(filepath.Join("..", ".."))
	base := filepath.Join("testdata", "svglide", "visual_quality")
	weak, err := CheckCreativeQuality(filepath.Join(base, "germany_2026_weak_visual_run"))
	if err != nil {
		t.Fatal(err)
	}
	if weak.Status != "failed" || !creativeIssueCodesContain(weak.Issues, "svglide.creative.weak_slide") || !creativeIssueCodesContain(weak.Issues, "svglide.creative.process_leak") {
		t.Fatalf("weak fixture report = %+v, want weak/process failure", weak)
	}
	good, err := CheckCreativeQuality(filepath.Join(base, "fusion_split_good_run"))
	if err != nil {
		t.Fatal(err)
	}
	if good.Status != "passed" {
		t.Fatalf("fusion fixture report = %+v, want passed", good)
	}
}

func mustWriteCreativeQualityBaseDeck(t *testing.T, family, signature, svg string) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Creative Deck","slides":[{"id":"s1","title":"Opening","summary":"Opening summary","role":"cover","key_message":"Opening key","layout_family":"`+family+`","layout_archetype":"`+inferAuthorLayoutArchetype(family, signature)+`","layout_signature":"`+signature+`","story_function":"hook","primary_asset_role":"topic anchor","fusion_candidate":false,"path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", svg)
}

func mustWriteRepeatedArchetypeDeck(t *testing.T) {
	t.Helper()
	deck := authorDeck{Title: "Financial Deck"}
	deck.Slides = append(deck.Slides,
		authorDeckSlide{ID: "s1", Title: "Cover", Summary: "Cover", Role: "cover", KeyMessage: "Cover", LayoutFamily: "full_bleed_hero", LayoutArchetype: "full_bleed_photo_title", LayoutSignature: "chip_cover", StoryFunction: "hook", PrimaryAssetRole: "hero image", Path: "slides/01.svg"},
	)
	for i, title := range []string{"Executive summary", "Income", "Segment", "Margin", "Cash flow"} {
		page := i + 2
		deck.Slides = append(deck.Slides, authorDeckSlide{
			ID:               fmt.Sprintf("s%d", page),
			Title:            title,
			Summary:          title,
			Role:             "content",
			KeyMessage:       title,
			LayoutFamily:     "data_scoreboard",
			LayoutArchetype:  "image_argument_split",
			LayoutSignature:  fmt.Sprintf("left_text_right_chart_%d", page),
			StoryFunction:    "proof",
			PrimaryAssetRole: "chart",
			Path:             fmt.Sprintf("slides/%02d.svg", page),
		})
	}
	deck.Slides = append(deck.Slides,
		authorDeckSlide{ID: "s7", Title: "Close", Summary: "Close", Role: "close", KeyMessage: "Close", LayoutFamily: "quiet_synthesis", LayoutArchetype: "closing_poster", LayoutSignature: "closing_poster", StoryFunction: "synthesis", PrimaryAssetRole: "closing", Path: "slides/07.svg"},
	)
	raw, err := json.Marshal(deck)
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/outline/deck.json", string(raw))
	for i := 1; i <= 7; i++ {
		body := `<rect width="960" height="540"/><text x="48" y="80">NVIDIA financial report</text>`
		if i >= 2 && i <= 6 {
			body += `<g class="chart"><rect x="600" y="160" width="220" height="160"/></g>`
		}
		mustWriteTestFile(t, fmt.Sprintf("demo/slides/%02d.svg", i), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">`+fontTokenStyleForTest()+body+`</svg>`)
	}
}

func mustWriteRepeatedArchetypeReceipts(t *testing.T) {
	t.Helper()
	receipts := visualReceiptsFile{}
	receipts.Slides = append(receipts.Slides, repeatedArchetypeReceipt("s1", "full_bleed_hero", "full_bleed_photo_title", "chip_cover", "cover", "NVIDIA image"))
	for i, label := range []string{"revenue $22.1B", "net income $12.3B", "data center $18.4B", "gross margin 76.0%", "free cash flow $11.2B"} {
		page := i + 2
		receipt := repeatedArchetypeReceipt(
			fmt.Sprintf("s%d", page),
			"data_scoreboard",
			"image_argument_split",
			fmt.Sprintf("left_text_right_chart_%d", page),
			"left text right chart",
			label,
		)
		receipt.DataVisualRationale = label
		receipts.Slides = append(receipts.Slides, receipt)
	}
	receipts.Slides = append(receipts.Slides, repeatedArchetypeReceipt("s7", "quiet_synthesis", "closing_poster", "closing_poster", "closing", "NVIDIA report"))
	raw, err := json.Marshal(receipts)
	if err != nil {
		t.Fatal(err)
	}
	mustWriteTestFile(t, "demo/visual_receipts.json", string(raw))
}

func repeatedArchetypeReceipt(slideID string, family string, archetype string, signature string, intent string, evidence string) visualReceipt {
	return visualReceipt{
		SlideID:                    slideID,
		StoryJob:                   "proof",
		LayoutFamily:               family,
		LayoutArchetype:            archetype,
		LayoutSignature:            signature,
		ThumbnailJob:               "thumbnail",
		VisualCenter:               "visual center",
		TopicFitClaim:              "topic fit",
		InformationDensityPlan:     "one claim plus supporting visual",
		PageDifferenceFromPrevious: "different named page in sequence",
		PrimaryAsset:               "chart.svg",
		AssetRole:                  "chart",
		FontRoleUsage:              map[string]string{"display": "Inter", "body": "Aptos", "number": "Roboto Mono", "label": "Inter"},
		CompositionIntent:          intent,
		SourceEvidence:             []string{evidence},
		FusionSpec:                 visualFusionReceipt{Enabled: false},
		QAExpectations:             []string{"vary layout"},
	}
}

func creativeQualityGoodSVG() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">` + fontTokenStyleForTest() + `<rect width="960" height="540"/><text x="48" y="80">Opening</text><text x="48" y="132">A focused claim</text></svg>`
}

func repeatedGenericNodeLineSVGForTest() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540">` + fontTokenStyleForTest() + `<rect width="960" height="540" fill="#f6f8fa"/><g data-svglide-visual-form="generic"><path d="M120 270 H840" stroke="#999"/><circle cx="180" cy="230" r="20"/><circle cx="340" cy="310" r="20"/><circle cx="500" cy="230" r="20"/><circle cx="660" cy="310" r="20"/><text x="80" y="120">Repeated generic diagram</text></g></svg>`
}

func setRunVisualQualityModeForTest(t *testing.T, mode string) {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		t.Fatal(err)
	}
	run.VisualQualityMode = mode
	if err := writeJSON(filepath.Join("demo", "run.json"), run); err != nil {
		t.Fatal(err)
	}
}

func creativeIssueCodesContain(issues []CreativeQualityIssue, want string) bool {
	for _, issue := range issues {
		if issue.Code == want || strings.Contains(issue.Code, want) {
			return true
		}
	}
	return false
}
