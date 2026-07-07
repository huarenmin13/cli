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

type PublishOnlineOptions struct {
	AllowSmokePublish bool
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
	return PublishOnlineRunWithOptions(root, publisher, PublishOnlineOptions{})
}

func PublishOnlineRunWithOptions(root string, publisher OnlinePublisher, opts PublishOnlineOptions) (OnlineSlidePublishReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return OnlineSlidePublishReport{}, err
	}
	if run.SmokeTest && !opts.AllowSmokePublish {
		report := OnlineSlidePublishReport{
			Status:            StatusBlocked,
			Publisher:         "smoke_guard",
			BlockedReasonCode: "svglide.publish_online.smoke_publish_not_allowed",
			Message:           "smoke SVGlide runs cannot be published unless --allow-smoke-publish is explicitly set",
		}
		if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
			return report, writeErr
		}
		return report, fmt.Errorf("publish_online blocked: %s", report.BlockedReasonCode)
	}
	if run.FullChainRequired {
		if err := validateFullChainReadyForPublish(safeRoot, run); err != nil {
			report := OnlineSlidePublishReport{
				Status:            StatusBlocked,
				Publisher:         "full_chain_gate",
				BlockedReasonCode: "svglide.publish_online.full_chain_incomplete",
				Message:           err.Error(),
			}
			if writeErr := writeOnlinePublishArtifacts(safeRoot, report); writeErr != nil {
				return report, writeErr
			}
			return report, fmt.Errorf("publish_online blocked by full-chain gate: %w", err)
		}
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

func validateFullChainReadyForPublish(safeRoot string, run Run) error {
	if normalizeExecutionProfile(run.ExecutionProfile) != ExecutionProfileFullChain {
		return nil
	}
	if !run.FullChainRequired {
		return nil
	}
	for _, stage := range run.Stages {
		if stage.Name == StagePublishOnline {
			break
		}
		if stage.Status != StatusDone {
			return fmt.Errorf("stage %q status is %q, want done before publish", stage.Name, stage.Status)
		}
		path, err := existingDeliveryEvidencePath(safeRoot, stage.Receipt)
		if err != nil {
			return err
		}
		if path == "" {
			return fmt.Errorf("stage %q receipt %s is missing", stage.Name, stage.Receipt)
		}
		valid, err := validDeliveryStageReceipt(safeRoot, stage, path)
		if err != nil {
			return err
		}
		if !valid {
			return fmt.Errorf("stage %q receipt %s is not passed/done", stage.Name, stage.Receipt)
		}
	}
	localEvidence := []string{
		"run.json",
		"prompt_manifest.json",
		"request/request.json",
		"request/source_manifest.json",
		"request/entity_resolution.json",
		"request/theme_contract.json",
		deliveryContractPath,
		"research/research_plan.json",
		"research/queries.json",
		"research/research_notes.md",
		"research/sources.json",
		"research/research_coverage.json",
		"brief/design_brief.json",
		"brief/visual_system.json",
		"brief/typography_contract.json",
		"brief/visual_quality_contract.json",
		"outline/deck.json",
		"content/slide_content.md",
		"content/slide_content.json",
		"content/slide_copy_plan.json",
		"assets/image_candidates.json",
		"assets/assets_plan.json",
		"assets/assets_manifest.json",
		"assets/asset_inventory.json",
		"assets/charts/chart_briefs.json",
		"assets/charts/chart_manifest.json",
		chartRenderReceiptPath,
		"receipts/lint.json",
		"receipts/preview.json",
		renderedVisualReceiptPath,
		imageUsageReportPath,
		mediaPressureReportPath,
		chartUsageReceiptPath,
		contentPayloadReportPath,
		"quality_report.json",
		anyGenSemanticReportPath,
		visualReceiptsPath,
		creativeQualityReportPath,
		editorialQualityReportPath,
		screenshotEvidenceReportPath,
		chartQualityReportPath,
		deliveryReceiptPath,
	}
	for _, rel := range localEvidence {
		exists, err := runRegularFileExists(safeRoot, rel)
		if err != nil {
			return err
		}
		if !exists {
			return fmt.Errorf("full-chain evidence %s is missing", rel)
		}
	}
	for _, stage := range run.Stages {
		if stage.Name == StageRequest || stage.Name == StagePublishOnline {
			continue
		}
		rel := promptContextReceiptPath(stage.Name)
		exists, err := runRegularFileExists(safeRoot, rel)
		if err != nil {
			return err
		}
		if !exists {
			return fmt.Errorf("prompt context receipt %s is missing", rel)
		}
	}
	slides, err := publishSlidePaths(safeRoot, run)
	if err != nil {
		return err
	}
	if len(slides) == 0 {
		return fmt.Errorf("full-chain evidence has no slides")
	}
	return nil
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
