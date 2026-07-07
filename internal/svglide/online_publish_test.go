package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestPublishOnlineMissingPublisherBlocks(t *testing.T) {
	root := setupPublishOnlineTestRun(t)
	report, err := PublishOnlineRun(root, nil)
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
