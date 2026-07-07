package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestPublishOnlineMissingPublisherBlocks(t *testing.T) {
	root := setupPublishOnlineSmokeTestRun(t)
	writePublishOnlineSVGPayloadForTest(t)
	report, err := PublishOnlineRunWithOptions(root, nil, PublishOnlineOptions{AllowSmokePublish: true})
	if err == nil {
		t.Fatal("PublishOnlineRun err = nil, want blocked error")
	}
	if report.Status != StatusBlocked {
		t.Fatalf("Status = %q, want %q", report.Status, StatusBlocked)
	}
	if report.BlockedReasonCode != "svglide.publish_online.missing_publisher" {
		t.Fatalf("BlockedReasonCode = %q", report.BlockedReasonCode)
	}
	raw, readErr := os.ReadFile(filepath.Join(root, onlineSlideReportPath))
	if readErr != nil {
		t.Fatal(readErr)
	}
	var written OnlineSlidePublishReport
	if err := json.Unmarshal(raw, &written); err != nil {
		t.Fatal(err)
	}
	if written.Status != StatusBlocked {
		t.Fatalf("written status = %q, want blocked", written.Status)
	}
	assertSVGPublishRequestEvidencePassed(t, root)
}

func TestPublishOnlinePassesSVGRequestEvidenceToPublisher(t *testing.T) {
	root := setupPublishOnlineSmokeTestRun(t)
	writePublishOnlineSVGPayloadForTest(t)
	publisher := &recordingOnlinePublisher{}

	report, err := PublishOnlineRunWithOptions(root, publisher, PublishOnlineOptions{AllowSmokePublish: true})
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "passed" {
		t.Fatalf("Status = %q, want passed", report.Status)
	}
	if !publisher.Called {
		t.Fatal("publisher was not called")
	}
	if publisher.Evidence.ContentType != "svg" || publisher.Evidence.SlideCount != 1 {
		t.Fatalf("publisher evidence = %+v, want one SVG slide", publisher.Evidence)
	}
	if got := publisher.Evidence.Slides[0].ContentRoot; got != "svg" {
		t.Fatalf("content root = %q, want svg", got)
	}
	assertSVGPublishRequestEvidencePassed(t, root)
}

func TestPublishOnlineFullChainBlocksIncompleteRunBeforePublisher(t *testing.T) {
	root := setupPublishOnlineTestRun(t)
	writePublishOnlineSVGPayloadForTest(t)
	publisher := &recordingOnlinePublisher{}

	report, err := PublishOnlineRun(root, publisher)
	if err == nil {
		t.Fatal("PublishOnlineRun err = nil, want full-chain incomplete error")
	}
	if publisher.Called {
		t.Fatal("publisher should not be called before full-chain evidence is complete")
	}
	if report.Status != StatusBlocked || report.BlockedReasonCode != "svglide.publish_online.full_chain_incomplete" {
		t.Fatalf("report = %+v, want full_chain_incomplete blocked", report)
	}
}

func TestPublishOnlineBlocksBeforePublisherWhenPayloadIsNotSVG(t *testing.T) {
	root := setupPublishOnlineSmokeTestRun(t)
	mustWriteTestFile(t, filepath.Join(root, "outline", "deck.json"), `{"slides":[{"id":"s1","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, filepath.Join(root, "slides", "01.svg"), `<slide xmlns="http://www.larkoffice.com/sml/2.0"><data/></slide>`)
	publisher := &recordingOnlinePublisher{}

	report, err := PublishOnlineRunWithOptions(root, publisher, PublishOnlineOptions{AllowSmokePublish: true})
	if err == nil {
		t.Fatal("PublishOnlineRun err = nil, want SVG payload gate error")
	}
	if publisher.Called {
		t.Fatal("publisher should not be called when SVG payload gate fails")
	}
	if report.Status != StatusBlocked || report.BlockedReasonCode != "svglide.publish_online.svg_payload_gate_failed" {
		t.Fatalf("report = %+v, want SVG payload gate blocked", report)
	}

	raw, readErr := os.ReadFile(filepath.Join(root, svgPublishRequestEvidencePath))
	if readErr != nil {
		t.Fatal(readErr)
	}
	var evidence SVGPublishRequestEvidence
	if err := json.Unmarshal(raw, &evidence); err != nil {
		t.Fatal(err)
	}
	if evidence.Status != "failed" || !evidence.ForbiddenFormatDetected {
		t.Fatalf("evidence = %+v, want failed forbidden format", evidence)
	}
}

func setupPublishOnlineSmokeTestRun(t *testing.T) string {
	t.Helper()
	cwd := t.TempDir()
	t.Chdir(cwd)
	root := "demo"
	if err := InitRun(root, InitOptions{
		Title:            "Online Smoke Demo",
		Topic:            "生成线上 SVG PPT smoke",
		DeliveryTarget:   DeliveryTargetOnlineSlide,
		ExecutionProfile: ExecutionProfileSmoke,
		Now:              time.Date(2026, 7, 7, 20, 0, 0, 0, time.UTC),
	}); err != nil {
		t.Fatal(err)
	}
	return root
}

func setupPublishOnlineTestRun(t *testing.T) string {
	t.Helper()
	cwd := t.TempDir()
	t.Chdir(cwd)
	root := "demo"
	if err := InitRun(root, InitOptions{
		Title:          "Online Demo",
		Topic:          "生成真实美观的线上 SVG PPT",
		DeliveryTarget: DeliveryTargetOnlineSlide,
		Now:            time.Date(2026, 7, 7, 20, 0, 0, 0, time.UTC),
	}); err != nil {
		t.Fatal(err)
	}
	return root
}

func writePublishOnlineSVGPayloadForTest(t *testing.T) {
	t.Helper()
	mustWriteTestFile(t, "demo/outline/deck.json", `{"slides":[{"id":"s1","path":"slides/01.svg"}]}`)
	mustWriteTestFile(t, "demo/slides/01.svg", visibleTextSVG())
}

func assertSVGPublishRequestEvidencePassed(t *testing.T, root string) {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(root, svgPublishRequestEvidencePath))
	if err != nil {
		t.Fatal(err)
	}
	var evidence SVGPublishRequestEvidence
	if err := json.Unmarshal(raw, &evidence); err != nil {
		t.Fatal(err)
	}
	if evidence.Status != "passed" || evidence.ContentType != "svg" || evidence.SlideCount != 1 {
		t.Fatalf("evidence = %+v, want passed SVG evidence for one slide", evidence)
	}
	if evidence.Slides[0].ContentRoot != "svg" || evidence.Slides[0].SHA256 == "" {
		t.Fatalf("slide evidence = %+v, want svg root and sha", evidence.Slides[0])
	}
}

type recordingOnlinePublisher struct {
	Called   bool
	Evidence SVGPublishRequestEvidence
}

func (p *recordingOnlinePublisher) Publish(root string, evidence SVGPublishRequestEvidence) (OnlineSlidePublishReport, error) {
	p.Called = true
	p.Evidence = evidence
	return OnlineSlidePublishReport{
		Status:         "passed",
		Publisher:      "recording-test",
		PresentationID: "pres_svg",
		URL:            "https://example.larkoffice.com/slides/pres_svg",
		SlideCount:     evidence.SlideCount,
	}, nil
}
