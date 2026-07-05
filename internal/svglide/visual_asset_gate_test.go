package svglide

import "testing"

func TestVisualAssetGateFailsEntityFinancialReportWithoutRealImages(t *testing.T) {
	input := VisualAssetGateInput{
		RequestText:          "Generate a comprehensive financial report for Q4 2023 for Nvidia.",
		EntityKind:           "company",
		Slides:               8,
		RealImageAssets:      0,
		OfficialImageAssets:  0,
		SlidesWithRealImages: 0,
		CoverRealHeroImage:   false,
		NoImageReason:        "This data-report deck does not require raster images; visual evidence is carried by charts.",
	}
	result := EvaluateVisualAssetGate(input)
	if result.Status != "failed" {
		t.Fatalf("status = %q, want failed", result.Status)
	}
	if !visualAssetIssuesContain(result.Issues, "svglide.visual_asset.cover_real_hero_missing") {
		t.Fatalf("issues = %+v, want cover real hero missing", result.Issues)
	}
	if !visualAssetIssuesContain(result.Issues, "svglide.visual_asset.real_image_missing") {
		t.Fatalf("issues = %+v, want real image missing", result.Issues)
	}
}

func TestVisualAssetGatePassesAbstractChartOnlyDeck(t *testing.T) {
	input := VisualAssetGateInput{
		RequestText:        "Explain quarterly revenue trend as a chart-only internal analytics deck.",
		EntityKind:         "abstract_data",
		Slides:             6,
		RealImageAssets:    0,
		CoverRealHeroImage: false,
		ExplicitChartOnly:  true,
	}
	result := EvaluateVisualAssetGate(input)
	if result.Status != "passed" {
		t.Fatalf("status = %q issues = %+v, want passed", result.Status, result.Issues)
	}
}

func TestVisualAssetGatePassesEntityDeckWithCoverHero(t *testing.T) {
	input := VisualAssetGateInput{
		RequestText:          "Introduce Leica M cameras.",
		EntityKind:           "product",
		Slides:               8,
		RealImageAssets:      4,
		OfficialImageAssets:  2,
		SlidesWithRealImages: 5,
		CoverRealHeroImage:   true,
	}
	result := EvaluateVisualAssetGate(input)
	if result.Status != "passed" {
		t.Fatalf("status = %q issues = %+v, want passed", result.Status, result.Issues)
	}
}
