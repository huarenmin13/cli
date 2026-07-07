package svglide

import "testing"

func TestVisualAssetGateThemeRequiresRealImagesOverridesChartOnly(t *testing.T) {
	result := EvaluateVisualAssetGate(VisualAssetGateInput{
		RequestText:             "品中国茶主题 slides",
		Slides:                  9,
		RealImageAssets:         0,
		SlidesWithRealImages:    0,
		CoverRealHeroImage:      false,
		ExplicitChartOnly:       true,
		ThemeRequiresRealImages: true,
	})

	if result.Status != "failed" {
		t.Fatalf("status = %q, want failed", result.Status)
	}
	if !result.Required {
		t.Fatalf("required = false, want true when theme requires real images")
	}
	if !visualAssetIssuesContain(result.Issues, "svglide.visual_asset.real_image_missing") {
		t.Fatalf("issues = %+v, want real image missing", result.Issues)
	}
}

func TestPaperDeepDiveRequiresEvidenceImages(t *testing.T) {
	result := EvaluateVisualAssetGate(VisualAssetGateInput{
		RequestText:          "生成真实美观的 DeepSeek V4 论文深度解析线上 SVG PPT",
		EntityKind:           "technical_paper_topic",
		Slides:               9,
		RealImageAssets:      0,
		OfficialImageAssets:  0,
		SlidesWithRealImages: 0,
		CoverRealHeroImage:   false,
		NoImageReason:        "技术论文只需要图解",
	})

	if !result.Required {
		t.Fatal("Required = false, want true")
	}
	if result.Status != "failed" {
		t.Fatalf("Status = %q, want failed", result.Status)
	}
	if !visualAssetIssuesContain(result.Issues, "svglide.visual_asset.real_image_missing") {
		t.Fatalf("issues = %+v, want missing evidence image issue", result.Issues)
	}
	if !visualAssetIssuesContain(result.Issues, "svglide.visual_asset.no_image_reason_invalid") {
		t.Fatalf("issues = %+v, want invalid no_image_reason issue", result.Issues)
	}
}
