package svglide

import (
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestCompleteRequestResolutionAllowsStrongIdentifierForResearch(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageRequestResolution)
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"prompt_contract":`+promptContractJSON(StageRequestResolution)+`,"input_text":"美股 FOTO 基金","resolved_entity":{"name":"FOTO","type":"financial_ticker_candidate","confidence_bp":6500,"confidence_band":"medium","reason":"Ticker-like token; must be confirmed by vertical sources."},"ambiguity":{"status":"resolved","candidates":["FOTO"]},"research_required":true,"requires_research_confirmation":true,"identifiers":[{"type":"ticker","value":"FOTO","market_hint":"US","confidence_bp":6500,"reason":"3-5 uppercase ticker-like token."}],"clarification_question":""}`)
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

func TestResearchPlanGateRejectsTickerWithOnlyGeneralSearch(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	mustWriteFOTOEntityResolutionForTest(t)
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	mustWriteTestFile(t, "demo/research/research_plan.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"FOTO","type":"financial_ticker_candidate","requires_confirmation":true},"identifiers":[{"id":"id_foto","type":"ticker","value":"FOTO","market_hint":"US","confidence_bp":6500,"reason":"ticker-like"}],"evidence_needs":[{"id":"need_identity","type":"identity","required":true}],"source_ladders":[{"identifier_id":"id_foto","evidence_need_id":"need_identity","required_source_classes":["general_web_search"],"fallback_source_classes":[],"forbidden_only_source_classes":["general_web_search"]}],"minimum_coverage":{"min_retrieved_sources":1,"identity_source_required":true,"all_required_source_classes_attempted":true},"failure_policy":{"block_if_required_source_class_missing":true,"block_if_only_general_search":true,"clarify_if_identity_unconfirmed_after_ladder":true}}`)
	mustWriteTestFile(t, "demo/research/queries.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"queries":[{"id":"q1","plan_identifier_id":"id_foto","source_class":"general_web_search","method":"search_query","query_or_url":"FOTO ETF","purpose":"identity","status":"retrieved","retrieved_source_ids":["src1"]}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"src1","path":"https://example.com","title":"Generic","excerpt":"Generic","usage":"identity","retrieval":"full_page","query_id":"q1","source_class":"general_web_search","authority_tier":"general"}]}`)
	mustWriteFOTOResearchCoverageForTest(t, []string{"src1"})

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected generic-only ticker research to be rejected")
	}
	if !strings.Contains(err.Error(), "ticker identifier") || !strings.Contains(err.Error(), "finance_quote") {
		t.Fatalf("error = %v, want ticker finance_quote rejection", err)
	}
}

func TestResearchPlanGateAcceptsFOTOTickerVerticalSources(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageResearch)
	mustWriteFOTOEntityResolutionForTest(t)
	mustWriteTestFile(t, "demo/request/theme_contract.json", validThemeContractJSON())
	mustWriteTestFile(t, "demo/research/research_plan.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"FOTO","type":"financial_ticker_candidate","requires_confirmation":true},"identifiers":[{"id":"id_foto","type":"ticker","value":"FOTO","market_hint":"US","confidence_bp":6500,"reason":"ticker-like"}],"evidence_needs":[{"id":"need_identity","type":"identity","required":true},{"id":"need_data","type":"data","required":true}],"source_ladders":[{"identifier_id":"id_foto","evidence_need_id":"need_identity","required_source_classes":["finance_quote","issuer_site","exchange_or_regulator"],"fallback_source_classes":["trusted_financial_media"],"forbidden_only_source_classes":["general_web_search"]}],"minimum_coverage":{"min_retrieved_sources":3,"identity_source_required":true,"all_required_source_classes_attempted":true},"failure_policy":{"block_if_required_source_class_missing":true,"block_if_only_general_search":true,"clarify_if_identity_unconfirmed_after_ladder":true}}`)
	mustWriteTestFile(t, "demo/research/queries.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"queries":[{"id":"q_quote","plan_identifier_id":"id_foto","source_class":"finance_quote","method":"direct_url","query_or_url":"https://finance.yahoo.com/quote/FOTO/","purpose":"identity","status":"retrieved","retrieved_source_ids":["src_quote"]},{"id":"q_issuer","plan_identifier_id":"id_foto","source_class":"issuer_site","method":"search_query","query_or_url":"FOTO ETF issuer official","purpose":"facts","status":"retrieved","retrieved_source_ids":["src_issuer"]},{"id":"q_reg","plan_identifier_id":"id_foto","source_class":"exchange_or_regulator","method":"regulator_search","query_or_url":"FOTO ETF prospectus SEC","purpose":"data","status":"retrieved","retrieved_source_ids":["src_reg"]}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"sources":[{"id":"src_quote","path":"https://finance.yahoo.com/quote/FOTO/","title":"FOTO Quote","excerpt":"Quote page","usage":"identity","retrieval":"full_page","query_id":"q_quote","source_class":"finance_quote","authority_tier":"market_data"},{"id":"src_issuer","path":"https://issuer.example/foto","title":"Issuer FOTO","excerpt":"Issuer page","usage":"facts","retrieval":"full_page","query_id":"q_issuer","source_class":"issuer_site","authority_tier":"official"},{"id":"src_reg","path":"https://sec.example/foto","title":"FOTO Prospectus","excerpt":"Prospectus","usage":"data","retrieval":"full_page","query_id":"q_reg","source_class":"exchange_or_regulator","authority_tier":"regulator"}]}`)
	mustWriteFOTOResearchCoverageForTest(t, []string{"src_quote", "src_issuer", "src_reg"})

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("FOTO vertical research rejected: %v", err)
	}
}

func TestResearchPlanGateFOTOTickerFixture(t *testing.T) {
	root := filepath.Join("..", "..", "testdata", "svglide", "research_contract", "foto_ticker")
	if err := ValidateResearchPlanGate(root); err != nil {
		t.Fatal(err)
	}
}

func mustWriteFOTOEntityResolutionForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/request/entity_resolution.json", `{"prompt_contract":`+promptContractJSON(StageRequestResolution)+`,"input_text":"美股 FOTO 基金","resolved_entity":{"name":"FOTO","type":"financial_ticker_candidate","confidence_bp":6500,"confidence_band":"medium","reason":"ticker candidate"},"ambiguity":{"status":"resolved","candidates":["FOTO"]},"research_required":true,"requires_research_confirmation":true,"identifiers":[{"type":"ticker","value":"FOTO","market_hint":"US","confidence_bp":6500,"reason":"ticker-like"}],"clarification_question":""}`)
}

func mustWriteFOTOResearchCoverageForTest(t *testing.T, ids []string) {
	t.Helper()
	sources := make([]string, 0, len(ids))
	for _, id := range ids {
		usage := "data"
		if strings.Contains(id, "quote") || id == "src1" {
			usage = "identity"
		}
		sources = append(sources, `{"id":"`+id+`","title":"`+id+`","url":"https://example.com/`+id+`","retrieved_at":"2026-07-04T00:00:00Z","usage":"`+usage+`","status":"retrieved"}`)
	}
	mustWriteTestFile(t, "demo/research/research_coverage.json", `{"prompt_contract":`+promptContractJSON(StageResearch)+`,"entity":{"name":"FOTO","type":"financial_ticker_candidate"},"queries":[{"query":"FOTO","purpose":"entity_disambiguation"}],"sources":[`+strings.Join(sources, ",")+`],"coverage":{"identity_confirmed":true,"has_reliable_source":true,"minimum_source_count_met":true,"source_count":`+strconv.Itoa(len(ids))+`,"topic_only_rationale":""}}`)
}
