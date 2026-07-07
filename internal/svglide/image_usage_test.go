package svglide

import "testing"

func TestImageUsageRejectsSelectedImageNotReferencedBySVG(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><text x="80" y="120">No image</text></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"official high-resolution hero photo"}]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_usage_missing") {
		t.Fatalf("expected selected image missing from SVG to fail: %#v", report.Issues)
	}
}

func TestImageUsageRejectsFullBleedHeroUsedAsThumbnail(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><image slide:role="image" slide:shape-type="image" href="../assets/images/hero.jpg" x="900" y="500" width="180" height="100"/></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"official high-resolution hero photo"}]}`)
	mustWriteTestPNGFile(t, "demo/assets/images/hero.jpg")

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_usage_area") {
		t.Fatalf("expected full-bleed hero thumbnail usage to fail: %#v", report.Issues)
	}
}

func TestImageUsageAreaUsesActualSVGCanvas(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 960 540" slide:role="slide"><image slide:role="image" slide:shape-type="image" href="../assets/images/hero.jpg" x="0" y="0" width="960" height="540"/></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"official high-resolution hero photo"}]}`)
	mustWriteTestPNGFile(t, "demo/assets/images/hero.jpg")

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if report.Metrics.CoverHeroAreaBP != 10000 {
		t.Fatalf("cover hero area = %d, want 10000 for full 960x540 canvas", report.Metrics.CoverHeroAreaBP)
	}
}

func TestImageUsageParsesSingleQuotedAndXLinkHrefImage(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1280 720" slide:role="slide"><image slide:role="image" slide:shape-type="image" xlink:href='../assets/images/hero.jpg' x='0' y='0' width='1280' height='720'/><text x="80" y="120">Cover</text></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"official high-resolution hero photo"}]}`)
	mustWriteTestPNGFile(t, "demo/assets/images/hero.jpg")

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if qualityIssueCodesContain(report.Issues, "svglide.quality.image_usage_missing") {
		t.Fatalf("xlink:href image should be detected as used: %#v", report.Issues)
	}
}

func TestImageUsageRejectsUnregisteredSVGImageHref(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><image slide:role="image" slide:shape-type="image" href="../assets/images/temporary.jpg" x="0" y="0" width="1280" height="720"/></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_usage_unregistered") {
		t.Fatalf("expected unregistered SVG image href to fail: %#v", report.Issues)
	}
}

func TestImageUsageRejectsReferencedReadyImageMissingInventory(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" viewBox="0 0 1280 720" slide:role="slide"><image slide:role="image" slide:shape-type="image" href="../assets/images/hero.jpg" x="0" y="0" width="1280" height="720"/></svg>`)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[]}`)

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_usage_missing_inventory") {
		t.Fatalf("expected referenced ready image missing inventory to fail: %#v", report.Issues)
	}
}

func TestImageUsageRejectsReadyImageAssetNotDecodable(t *testing.T) {
	initStatusTestRun(t)
	root := "demo"
	writeMinimalImageQualityDeckForTest(t)
	mustWriteTestFile(t, "demo/assets/assets_manifest.json", `{"assets":[{"id":"hero","slide_id":"s1","kind":"image","local_path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","status":"ready","usage":"Hero"}]}`)
	mustWriteTestFile(t, "demo/assets/asset_inventory.json", `{"items":[{"id":"hero","path":"assets/images/hero.jpg","source_url":"https://example.com/hero.jpg","width":1600,"height":900,"semantic_type":"hero","large_ok":true,"full_bleed_ok":true,"recommended_use":"cover","avoid_reason":"","format":"jpg","has_alpha":false,"asset_role":"hero_photo","fit_role":"full_bleed","selection_reason":"official high-resolution hero photo"}]}`)
	mustWriteTestFile(t, "demo/assets/images/hero.jpg", "fixture image bytes")

	report, err := CheckQuality(root)
	if err != nil {
		t.Fatal(err)
	}
	if !qualityIssueCodesContain(report.Issues, "svglide.quality.image_asset_not_decodable") {
		t.Fatalf("expected undecodable ready image asset to fail: %#v", report.Issues)
	}
}

func writeMinimalImageQualityDeckForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"title":"Demo Deck","slides":[{"id":"s1","title":"Cover","summary":"Cover","role":"cover","visual_role":"hero_cover","key_message":"Cover","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"web1","path":"https://example.com/page","title":"Web Source","excerpt":"Input","usage":"Support","retrieval":"full_page"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"Cover","source_refs":["web1"],"visuals":[{"id":"hero","type":"image","instruction":"Hero image"}]}]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 1280 720">`+fontTokenStyleForTest()+`<image slide:role="image" href="../assets/images/hero.jpg" x="0" y="0" width="1280" height="720"/><text x="80" y="120">Cover</text></svg>`)
	mustWriteTestPNGFile(t, "demo/assets/images/hero.jpg")
	mustWriteQualityVisualReceiptForTest(t, "s1", "full_bleed_hero", "full_bleed_photo_title")
}
