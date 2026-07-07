package svglide

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"time"
)

const (
	onlineSlideReportPath   = "publish/online_slide.json"
	onlinePublishReceiptRel = "receipts/publish_online.json"
)

type OnlineSlidePublishReport struct {
	Status            string `json:"status"`
	PresentationID    string `json:"presentation_id,omitempty"`
	URL               string `json:"url,omitempty"`
	SlideCount        int    `json:"slide_count"`
	Publisher         string `json:"publisher"`
	BlockedReasonCode string `json:"blocked_reason_code,omitempty"`
	Message           string `json:"message,omitempty"`
}

type OnlinePublishReceipt struct {
	Stage     string                   `json:"stage"`
	Status    string                   `json:"status"`
	Report    OnlineSlidePublishReport `json:"report"`
	CreatedAt string                   `json:"created_at"`
}

type OnlinePublisher interface {
	Publish(root string, evidence SVGPublishRequestEvidence) (OnlineSlidePublishReport, error)
}

type MissingOnlinePublisher struct{}

func (MissingOnlinePublisher) Publish(root string, evidence SVGPublishRequestEvidence) (OnlineSlidePublishReport, error) {
	return OnlineSlidePublishReport{
		Status:            StatusBlocked,
		Publisher:         "missing",
		BlockedReasonCode: "svglide.publish_online.missing_publisher",
		Message:           "online slide delivery was requested, but no Lark Slides publisher is configured",
	}, nil
}

func PublishOnlineRun(root string, publisher OnlinePublisher) (OnlineSlidePublishReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return OnlineSlidePublishReport{}, err
	}
	contract, _, err := readDeliveryContract(safeRoot, run)
	if err != nil {
		return OnlineSlidePublishReport{}, err
	}
	if !contract.RequiresOnlineSlide {
		report := OnlineSlidePublishReport{
			Status:            StatusBlocked,
			Publisher:         "none",
			BlockedReasonCode: "svglide.publish_online.not_requested",
			Message:           "online slide delivery was not requested by delivery_contract",
		}
		if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
			return report, writeErr
		}
		return report, fmt.Errorf("publish_online status is %q", report.Status)
	}
	evidence, err := buildSVGPublishRequestEvidence(safeRoot, run)
	if writeErr := writeSVGPublishRequestEvidence(safeRoot, evidence); writeErr != nil {
		if err != nil {
			return OnlineSlidePublishReport{}, fmt.Errorf("%w; write SVG publish request evidence: %v", err, writeErr)
		}
		return OnlineSlidePublishReport{}, writeErr
	}
	if err != nil {
		report := OnlineSlidePublishReport{
			Status:            StatusBlocked,
			Publisher:         "svg_payload_gate",
			BlockedReasonCode: "svglide.publish_online.svg_payload_gate_failed",
			Message:           err.Error(),
		}
		if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
			return report, fmt.Errorf("%w; write publish artifacts: %v", err, writeErr)
		}
		return report, fmt.Errorf("publish_online blocked by SVG payload gate: %w", err)
	}
	if publisher == nil {
		publisher = MissingOnlinePublisher{}
	}
	report, err := publisher.Publish(root, evidence)
	if err != nil {
		if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
			return report, fmt.Errorf("%w; write publish artifacts: %v", err, writeErr)
		}
		return report, err
	}
	if report.Status == "" {
		report.Status = StatusBlocked
	}
	if report.Publisher == "" {
		report.Publisher = "unknown"
	}
	if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
		return report, writeErr
	}
	if writeErr := writeRequiredToolCallReceipts(safeRoot, StagePublishOnline, run); writeErr != nil {
		return report, writeErr
	}
	if report.Status != "passed" {
		return report, fmt.Errorf("publish_online status is %q", report.Status)
	}
	return report, nil
}

func writeOnlinePublishArtifacts(safeRoot string, report OnlineSlidePublishReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, onlineSlideReportPath)
	if err != nil {
		return err
	}
	if err := writeJSON(target, report); err != nil {
		return err
	}
	receiptTarget, err := ensureRunFileTargetForWrite(safeRoot, onlinePublishReceiptRel)
	if err != nil {
		return err
	}
	return writeJSON(receiptTarget, OnlinePublishReceipt{
		Stage:     StagePublishOnline,
		Status:    report.Status,
		Report:    report,
		CreatedAt: time.Now().Format(time.RFC3339),
	})
}

func readOnlineSlidePublishReport(safeRoot string) (OnlineSlidePublishReport, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, onlineSlideReportPath)
	if err != nil {
		return OnlineSlidePublishReport{}, false, nil
	}
	var report OnlineSlidePublishReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return OnlineSlidePublishReport{}, true, fmt.Errorf("%s: invalid JSON: %w", onlineSlideReportPath, err)
	}
	return report, true, nil
}

func onlineSlideReportEvidencePath(safeRoot string) (string, error) {
	exists, err := runRegularFileExists(safeRoot, onlineSlideReportPath)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", nil
	}
	return filepath.ToSlash(onlineSlideReportPath), nil
}
