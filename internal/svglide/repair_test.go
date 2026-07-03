package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestRepairRunAuthorsMissingSlidesAndWritesFinalReceipt(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed: %+v", report.Status, report)
	}
	if !report.LintOK {
		t.Fatalf("LintOK = false, want true: %+v", report)
	}
	if report.Preview != "passed" {
		t.Fatalf("Preview = %q, want passed: %+v", report.Preview, report)
	}
	if report.Quality != "passed" {
		t.Fatalf("Quality = %q, want passed: %+v", report.Quality, report)
	}
	if !report.Reauthored {
		t.Fatalf("Reauthored = false, want true: %+v", report)
	}

	for _, rel := range []string{
		"slides/01.svg",
		"preview.html",
		"receipts/lint.json",
		"receipts/preview.json",
		"quality_report.json",
		"receipts/validate_preview_repair.json",
	} {
		if _, err := os.Stat(filepath.Join("demo", rel)); err != nil {
			t.Fatalf("missing %s: %v", rel, err)
		}
	}

	receipt := readRepairReceiptForTest(t)
	if receipt["stage"] != StageValidatePreviewRepair {
		t.Fatalf("receipt stage = %v, want %q", receipt["stage"], StageValidatePreviewRepair)
	}
	if receipt["status"] != "passed" {
		t.Fatalf("receipt status = %v, want passed", receipt["status"])
	}
	if receipt["message"] != "lint, preview, and quality passed after reauthoring" {
		t.Fatalf("receipt message = %v, want quality-aware pass message", receipt["message"])
	}
	if _, ok := receipt["artifacts"].([]any); !ok {
		t.Fatalf("receipt artifacts = %T, want array", receipt["artifacts"])
	}
	if _, ok := receipt["updated_at"]; ok {
		t.Fatalf("receipt contains updated_at, want StageReceipt-compatible schema: %+v", receipt)
	}
	if _, ok := receipt["generated_at"]; ok {
		t.Fatalf("receipt contains generated_at, want StageReceipt-compatible schema: %+v", receipt)
	}
}

func TestRepairRunFailsWhenQualityFails(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
	mustWriteTestFile(t, "demo/research/sources.json", `{"sources":[{"id":"local1","path":"research/local.md","title":"Local source","excerpt":"Local excerpt","usage":"support","retrieval":"local_file"}]}`)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"slides":[{"id":"s1","content":"First body line\nSecond body line","source_refs":["local1"],"visuals":[{"id":"none-s1","type":"none","instruction":"Text-only"}]}]}`)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if report.LintOK != true {
		t.Fatalf("LintOK = %v, want true: %+v", report.LintOK, report)
	}
	if report.Preview != "passed" {
		t.Fatalf("Preview = %q, want passed: %+v", report.Preview, report)
	}
	if report.Quality != "failed" {
		t.Fatalf("Quality = %q, want failed: %+v", report.Quality, report)
	}

	qualityRaw, err := os.ReadFile(filepath.Join("demo", "quality_report.json"))
	if err != nil {
		t.Fatal(err)
	}
	var quality map[string]any
	if err := json.Unmarshal(qualityRaw, &quality); err != nil {
		t.Fatal(err)
	}
	if quality["status"] != "failed" {
		t.Fatalf("quality status = %v, want failed: %+v", quality["status"], quality)
	}

	receipt := readRepairReceiptForTest(t)
	if receipt["status"] != "failed" {
		t.Fatalf("receipt status = %v, want failed", receipt["status"])
	}
	if receipt["message"] != "quality gate failed" {
		t.Fatalf("receipt message = %v, want quality gate failed", receipt["message"])
	}
}

func TestRepairReceiptMessagePrioritizesLintPreviewFailuresOverQuality(t *testing.T) {
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: false, Preview: "failed", Quality: "failed"}); got != "lint or preview failed" {
		t.Fatalf("message = %q, want lint or preview failed", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: false, Preview: "failed", Quality: "failed", Reauthored: true}); got != "repair reauthored slides but lint or preview still failed" {
		t.Fatalf("reauthored message = %q, want reauthored lint/preview failure", got)
	}
	if got := repairReceiptMessage(RepairReport{Status: "failed", LintOK: true, Preview: "passed", Quality: "failed"}); got != "quality gate failed" {
		t.Fatalf("quality-only message = %q, want quality gate failed", got)
	}
}

func TestRepairRunOnlyReauthorsFailedSlidePaths(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"},{"id":"s2","title":"Second claim","summary":"Second summary","role":"content","key_message":"Second key message","path":"slides/02.svg"}]}`,
	)
	custom := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><text x="48" y="80">KEEP-CUSTOM-01</text></svg>`
	mustWriteTestFile(t, "demo/slides/01.svg", custom)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" || !report.Reauthored || !report.LintOK || report.Preview != "passed" {
		t.Fatalf("report = %+v, want passed reauthored repair", report)
	}

	raw, err := os.ReadFile(filepath.Join("demo", "slides", "01.svg"))
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != custom {
		t.Fatalf("slides/01.svg was overwritten:\n%s", string(raw))
	}
	if _, err := os.Stat(filepath.Join("demo", "slides", "02.svg")); err != nil {
		t.Fatalf("missing reauthored slides/02.svg: %v", err)
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false after repair: %+v", validation.Issues)
	}
}

func TestRepairRunReauthorsBackgroundOnlySVG(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	mustWriteTestFile(t, "demo/slides/01.svg", backgroundOnlySVG())

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" || !report.Reauthored || !report.LintOK || report.Preview != "passed" {
		t.Fatalf("report = %+v, want passed reauthored repair", report)
	}

	validation, err := ValidateRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if !validation.OK {
		t.Fatalf("ValidateRun OK = false after repair: %+v", validation.Issues)
	}
}

func TestRepairRunDoesNotAuthorInvalidSlidePath(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/../01.svg"}]}`,
	)

	report, err := RepairRun("demo")
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "failed" {
		t.Fatalf("Status = %q, want failed: %+v", report.Status, report)
	}
	if report.Reauthored {
		t.Fatalf("Reauthored = true, want false for invalid path: %+v", report)
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "svg_author.json")); !os.IsNotExist(err) {
		t.Fatalf("svg_author receipt exists or stat failed, want no authoring: %v", err)
	}
}

func TestRepairRunTreatsValidationArtifactWriteErrorAsFatal(t *testing.T) {
	initAuthorDemoRun(t,
		`{"color_system":{"background":"#FFFFFF","ink":"#111827","muted":"#6B7280","accent":"#2563EB"},"typography":{"title":32,"body":16},"layout_language":"analyst deck"}`,
		`{"title":"Demo Deck","slides":[{"id":"s1","title":"First claim","summary":"First summary","role":"cover","key_message":"First key message","path":"slides/01.svg"}]}`,
	)
	if err := os.Remove(filepath.Join("demo", "repair_queue.md")); err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join("demo", "repair_queue.md"), 0o755); err != nil {
		t.Fatal(err)
	}

	if _, err := RepairRun("demo"); err == nil {
		t.Fatal("expected repair to return validation artifact write error")
	}
	if _, err := os.Stat(filepath.Join("demo", "receipts", "validate_preview_repair.json")); !os.IsNotExist(err) {
		t.Fatalf("final repair receipt exists or stat failed, want no misleading final receipt: %v", err)
	}
}

func readRepairReceiptForTest(t *testing.T) map[string]any {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("demo", "receipts", "validate_preview_repair.json"))
	if err != nil {
		t.Fatal(err)
	}
	var receipt map[string]any
	if err := json.Unmarshal(raw, &receipt); err != nil {
		t.Fatal(err)
	}
	return receipt
}
