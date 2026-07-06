package svglide

import (
	"strings"
	"testing"
)

func TestValidateImageCandidatesGateRejectsReadyImageWithoutSelectedCandidate(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.jpg","usage":"Hero photo","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","usage":"Hero photo","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":true,"candidates":[]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":""}]}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"none","charts":[]}`)

	err := ValidateStageOutputs("demo")
	if err == nil {
		t.Fatal("expected ready image without selected candidate to be rejected")
	}
	if !strings.Contains(err.Error(), "image_candidates_gate") {
		t.Fatalf("error = %v, want image_candidates_gate", err)
	}
}

func TestValidateImageCandidatesGateRejectsCandidateIDPathMismatch(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[{"id":"hero","slide_id":"s1","type":"image","path":"assets/images/hero.jpg","usage":"Hero photo","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","usage":"Hero photo","status":"ready"}]}`)
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":true,"candidates":[{"id":"c1","query":"brand hero photo","source_url":"https://example.com/other.jpg","source_class":"user_provided","format":"jpg","width":1600,"height":900,"has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","local_path":"assets/images/other.jpg","score_bp":9200,"selected":true,"selection_reason":"user-provided high-resolution hero photo","format_exception_reason":"","rejection_reason":""}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","candidate_id":"c1","selection_reason":"user-provided high-resolution hero photo"}]}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"renderer":"none","charts":[]}`)

	err := ValidateStageOutputs("demo")
	if err == nil || !strings.Contains(err.Error(), "candidate_id") {
		t.Fatalf("expected candidate_id/path mismatch failure, got %v", err)
	}
}

func TestValidateImageCandidatesGateAllowsExplicitNoImageDeck(t *testing.T) {
	initStatusTestRun(t)
	setCurrentStageForStatusTest(t, StageAssets)
	mustWriteTestFile(t, "demo/assets/assets_plan.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"mode":"experiment_unrestricted_assets","assets":[]}`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"assets":[]}`)
	mustWriteTestFile(t, "demo/assets/image_candidates.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"requires_real_images":false,"no_image_reason":"chart-only deck; no real raster image required","candidates":[]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"items":[]}`)
	mustWriteNoChartAssetsForTest(t)

	if err := ValidateStageOutputs("demo"); err != nil {
		t.Fatalf("explicit no-image deck rejected: %v", err)
	}
}
