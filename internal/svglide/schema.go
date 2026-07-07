package svglide

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type liteJSONSchema struct {
	Type                 string                    `json:"type"`
	Required             []string                  `json:"required"`
	AdditionalProperties *bool                     `json:"additionalProperties"`
	Properties           map[string]liteJSONSchema `json:"properties"`
	Items                *liteJSONSchema           `json:"items"`
	MinItems             *int                      `json:"minItems"`
	Enum                 []string                  `json:"enum"`
	Pattern              string                    `json:"pattern"`
}

var stageOutputSchemaPaths = map[string]string{
	"request/request.json":               "schemas/request.schema.json",
	"request/source_manifest.json":       "schemas/source_manifest.schema.json",
	"request/delivery_contract.json":     "schemas/delivery_contract.schema.json",
	"request/entity_resolution.json":     "schemas/entity_resolution.schema.json",
	"request/theme_contract.json":        "schemas/theme_contract.schema.json",
	"research/research_plan.json":        "schemas/research_plan.schema.json",
	"research/queries.json":              "schemas/research_queries.schema.json",
	"research/sources.json":              "schemas/sources.schema.json",
	"research/research_coverage.json":    "schemas/research_coverage.schema.json",
	"brief/design_brief.json":            "schemas/design_brief.schema.json",
	"brief/visual_system.json":           "schemas/visual_system.schema.json",
	"brief/typography_contract.json":     "schemas/typography_contract.schema.json",
	"brief/visual_quality_contract.json": "schemas/visual_quality_contract.schema.json",
	"outline/deck.json":                  "schemas/deck.schema.json",
	"content/slide_content.json":         "schemas/slide_content.schema.json",
	"content/slide_copy_plan.json":       "schemas/slide_copy_plan.schema.json",
	"assets/assets_plan.json":            "schemas/assets_plan.schema.json",
	"assets/image_candidates.json":       "schemas/image_candidates.schema.json",
	"assets/assets_manifest.json":        "schemas/assets_manifest.schema.json",
	"assets/asset_inventory.json":        "schemas/asset_inventory.schema.json",
	"assets/charts/chart_briefs.json":    "schemas/chart_briefs.schema.json",
	"assets/charts/chart_manifest.json":  "schemas/chart_manifest.schema.json",
	"receipts/chart_render.json":         "schemas/chart_render.schema.json",
	"quality_report.json":                "schemas/quality.schema.json",
	"anygen_semantic_report.json":        "schemas/anygen_semantic_report.schema.json",
	"visual_receipts.json":               "schemas/visual_receipts.schema.json",
	"creative_quality_report.json":       "schemas/creative_quality.schema.json",
	"receipts/lint.json":                 "schemas/lint.schema.json",
	"receipts/preview.json":              "schemas/preview.schema.json",
	"receipts/rendered_visual.json":      "schemas/rendered_visual.schema.json",
	"receipts/image_usage.json":          "schemas/image_usage.schema.json",
	"receipts/media_pressure.json":       "schemas/media_pressure.schema.json",
	"receipts/chart_usage.json":          "schemas/chart_usage.schema.json",
	"receipts/content_payload.json":      "schemas/content_payload.schema.json",
	"receipts/editorial_quality.json":    "schemas/editorial_quality.schema.json",
	"receipts/screenshot_evidence.json":  "schemas/screenshot_evidence.schema.json",
	"receipts/chart_quality.json":        "schemas/chart_quality.schema.json",
	"receipts/delivery.json":             "schemas/delivery.schema.json",
	"publish/request_evidence.json":      "schemas/svg_publish_request_evidence.schema.json",
	"publish/online_slide.json":          "schemas/online_slide.schema.json",
	"receipts/publish_online.json":       "schemas/publish_online.schema.json",
}

const AnyGenSemanticReportSchema = `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "contract", "metrics", "findings"],
  "properties": {
    "status": {"type": "string", "enum": ["passed", "failed"]},
    "contract": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "role", "path", "sha256", "rules"],
      "properties": {
        "id": {"type": "string"},
        "role": {"type": "string"},
        "path": {"type": "string"},
        "sha256": {"type": "string"},
        "rules": {"type": "integer"}
      }
    },
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "required": ["slide_count", "slides_with_slide_role", "image_count", "text_count", "note_count", "source_ref_count", "missing_asset_count", "slides_without_source_refs", "visible_leak_count", "font_token_count", "missing_font_token_count", "parser_unsafe_count"],
      "properties": {
        "slide_count": {"type": "integer"},
        "slides_with_slide_role": {"type": "integer"},
        "image_count": {"type": "integer"},
        "text_count": {"type": "integer"},
        "note_count": {"type": "integer"},
        "source_ref_count": {"type": "integer"},
        "missing_asset_count": {"type": "integer"},
        "slides_without_source_refs": {"type": "integer"},
        "visible_leak_count": {"type": "integer"},
        "font_token_count": {"type": "integer"},
        "missing_font_token_count": {"type": "integer"},
        "parser_unsafe_count": {"type": "integer"}
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["rule_id", "kind", "severity", "code", "message"],
        "properties": {
          "rule_id": {"type": "string"},
          "kind": {"type": "string"},
          "severity": {"type": "string"},
          "code": {"type": "string"},
          "artifact": {"type": "string"},
          "field": {"type": "string"},
          "path": {"type": "string"},
          "value": {"type": "string"},
          "message": {"type": "string"}
        }
      }
    }
  }
}
`

const DeliveryReceiptSchema = `{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "delivery_target", "route_profile", "orchestrator", "runtime_binding", "deck", "slides_dir", "slides", "preview", "online_slide", "real_asset_evidence", "quality_report", "anygen_semantic_report", "visual_receipts", "creative_quality_report", "editorial_quality_report", "semantic_metrics", "stage_status", "full_chain_evidence", "legacy_runtime_executed", "legacy_tool_ids", "legacy_artifact_matches", "core_prompt_ids", "observed_prompt_ids", "blocked_prompt_ids"],
  "properties": {
    "status": {"type": "string", "enum": ["ready", "needs_repair", "blocked"]},
    "delivery_target": {"type": "string", "enum": ["local_preview", "online_slide", "both"]},
    "route_profile": {"type": "string"},
    "orchestrator": {"type": "string"},
    "runtime_binding": {"type": "string"},
    "deck": {"type": "string"},
    "slides_dir": {"type": "string"},
    "slides": {
      "type": "array",
      "minItems": 1,
      "items": {"type": "string"}
    },
    "preview": {
      "type": "object",
      "additionalProperties": false,
      "required": ["path", "status", "missing_asset_count"],
      "properties": {
        "path": {"type": "string"},
        "status": {"type": "string"},
        "missing_asset_count": {"type": "integer"}
      }
    },
    "online_slide": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "publisher"],
      "properties": {
        "status": {"type": "string"},
        "presentation_id": {"type": "string"},
        "url": {"type": "string"},
        "slide_count": {"type": "integer"},
        "publisher": {"type": "string"},
        "blocked_reason_code": {"type": "string"},
        "message": {"type": "string"}
      }
    },
    "real_asset_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["required", "satisfied", "selected_real_images"],
      "properties": {
        "required": {"type": "boolean"},
        "satisfied": {"type": "boolean"},
        "selected_real_images": {"type": "integer"}
      }
    },
    "quality_report": {"type": "string"},
    "anygen_semantic_report": {"type": "string"},
    "visual_receipts": {"type": "string"},
    "creative_quality_report": {"type": "string"},
    "editorial_quality_report": {"type": "string"},
    "semantic_metrics": {"type": "object"},
    "stage_status": {"type": "object"},
    "full_chain_evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["run_json", "prompt_manifest", "prompt_context_receipts", "request", "source_manifest", "entity_resolution", "theme_contract", "research_plan", "queries", "research_notes", "sources", "research_coverage", "design_brief", "visual_system", "typography_contract", "outline", "slide_content", "asset_manifest", "rendered_visual", "media_pressure_report", "quality_report", "creative_quality_report", "editorial_quality_report", "chart_render_report", "chart_usage_report", "chart_quality_report", "delivery", "stage_receipts", "screenshot_evidence", "manual_patch"],
      "properties": {
        "run_json": {"type": "string"},
        "prompt_manifest": {"type": "string"},
        "prompt_context_receipts": {"type": "object"},
        "request": {"type": "string"},
        "source_manifest": {"type": "string"},
        "delivery_contract": {"type": "string"},
        "entity_resolution": {"type": "string"},
        "theme_contract": {"type": "string"},
        "research_plan": {"type": "string"},
        "queries": {"type": "string"},
        "research_notes": {"type": "string"},
        "sources": {"type": "string"},
        "research_coverage": {"type": "string"},
        "design_brief": {"type": "string"},
        "visual_system": {"type": "string"},
        "typography_contract": {"type": "string"},
        "outline": {"type": "string"},
        "slide_content": {"type": "string"},
        "asset_manifest": {"type": "string"},
        "rendered_visual": {"type": "string"},
        "media_pressure_report": {"type": "string"},
        "quality_report": {"type": "string"},
        "creative_quality_report": {"type": "string"},
        "editorial_quality_report": {"type": "string"},
        "chart_render_report": {"type": "string"},
        "chart_usage_report": {"type": "string"},
        "chart_quality_report": {"type": "string"},
        "svg_publish_request_evidence": {"type": "string"},
        "online_slide": {"type": "string"},
        "delivery": {"type": "string"},
        "stage_receipts": {"type": "object"},
        "screenshot_evidence": {"type": "array", "items": {"type": "string"}},
        "manual_patch": {
          "type": "object",
          "additionalProperties": false,
          "required": ["applied", "files"],
          "properties": {
            "applied": {"type": "boolean"},
            "files": {"type": "array", "items": {"type": "string"}},
            "reason": {"type": "string"}
          }
        }
      }
    },
    "legacy_runtime_executed": {"type": "boolean"},
    "legacy_tool_ids": {"type": "array", "items": {"type": "string"}},
    "legacy_artifact_matches": {"type": "array", "items": {"type": "string"}},
    "core_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "observed_prompt_ids": {"type": "array", "items": {"type": "string"}},
    "blocked_prompt_ids": {"type": "array", "items": {"type": "string"}}
  }
}
`

func ValidateStageOutputs(root string) error {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return err
	}
	stage, err := currentStage(run)
	if err != nil {
		return err
	}
	for _, output := range stage.Outputs {
		if hasGlobMeta(output) || strings.ToLower(filepath.Ext(output)) != ".json" {
			continue
		}
		if stage.Name == StageValidatePreviewRepair && output == deliveryReceiptPath {
			continue
		}
		schemaPath, ok := stageOutputSchemaPaths[output]
		if !ok {
			continue
		}
		if err := validateStageOutputSchema(safeRoot, output, schemaPath); err != nil {
			return err
		}
		if output == "outline/deck.json" {
			if err := validateDeckSlideOutputPaths(safeRoot, output); err != nil {
				return err
			}
		}
	}
	switch stage.Name {
	case StageRequestResolution:
		if err := ValidateDeliveryContractGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateRequestResolutionGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateThemeContractGate(safeRoot); err != nil {
			return err
		}
	case StageResearch:
		if err := ValidateResearchPlanGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateResearchCoverageGate(safeRoot); err != nil {
			return err
		}
	case StageSlideContent:
		if err := ValidateSlideContentSourceRefsGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateSlideCopyPlanGate(safeRoot); err != nil {
			return err
		}
	case StageAssets:
		if err := ValidateAssetInventoryGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateImageCandidatesGate(safeRoot); err != nil {
			return err
		}
		if err := ValidateChartBriefsGate(safeRoot); err != nil {
			return err
		}
	}
	return nil
}

type entityResolutionArtifact struct {
	ResolvedEntity struct {
		Name           string `json:"name"`
		Type           string `json:"type"`
		ConfidenceBP   int    `json:"confidence_bp"`
		ConfidenceBand string `json:"confidence_band"`
		Reason         string `json:"reason"`
	} `json:"resolved_entity"`
	Ambiguity struct {
		Status string `json:"status"`
	} `json:"ambiguity"`
	ResearchRequired             bool `json:"research_required"`
	RequiresResearchConfirmation bool `json:"requires_research_confirmation"`
	Identifiers                  []struct {
		Type  string `json:"type"`
		Value string `json:"value"`
	} `json:"identifiers"`
	ClarificationQuestion string `json:"clarification_question"`
}

func ValidateRequestResolutionGate(safeRoot string) error {
	raw, err := readRunRegularArtifact(safeRoot, "request/entity_resolution.json")
	if err != nil {
		return fmt.Errorf("request/entity_resolution.json: read artifact: %w", err)
	}
	var resolution entityResolutionArtifact
	if err := json.Unmarshal(raw, &resolution); err != nil {
		return fmt.Errorf("request/entity_resolution.json: invalid JSON: %w", err)
	}
	name := strings.TrimSpace(resolution.ResolvedEntity.Name)
	entityType := strings.TrimSpace(resolution.ResolvedEntity.Type)
	reason := strings.TrimSpace(resolution.ResolvedEntity.Reason)
	if name == "" {
		return fmt.Errorf("request_resolution_gate: resolved_entity.name is required")
	}
	if entityType == "" {
		return fmt.Errorf("request_resolution_gate: resolved_entity.type is required")
	}
	if reason == "" {
		return fmt.Errorf("request_resolution_gate: resolved_entity.reason is required")
	}
	if resolution.ResolvedEntity.ConfidenceBP < 0 || resolution.ResolvedEntity.ConfidenceBP > 10000 {
		return fmt.Errorf("request_resolution_gate: confidence_bp %d outside 0..10000", resolution.ResolvedEntity.ConfidenceBP)
	}
	ambiguityStatus := strings.TrimSpace(resolution.Ambiguity.Status)
	if ambiguityStatus != "resolved" {
		if ambiguityStatus == "needs_clarification" && strings.TrimSpace(resolution.ClarificationQuestion) == "" {
			return fmt.Errorf("request_resolution_gate: needs_clarification requires clarification_question")
		}
		return fmt.Errorf("request_resolution_gate: ambiguity status %q blocks research", ambiguityStatus)
	}
	if entityType == "topic" {
		if !resolution.ResearchRequired {
			return fmt.Errorf("request_resolution_gate: topic requests must set research_required=true")
		}
		return nil
	}
	if resolution.ResolvedEntity.ConfidenceBP < 7000 {
		if resolution.ResearchRequired && resolution.RequiresResearchConfirmation && hasStrongResearchIdentifier(resolution.Identifiers) {
			return nil
		}
		return fmt.Errorf("request_resolution_gate: confidence_bp %d below 7000 for real-world entity type %q", resolution.ResolvedEntity.ConfidenceBP, entityType)
	}
	return nil
}

func hasStrongResearchIdentifier(identifiers []struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}) bool {
	for _, identifier := range identifiers {
		switch strings.TrimSpace(identifier.Type) {
		case "ticker", "official_url", "product_model", "paper_doi", "law_code":
			return true
		}
	}
	return false
}

type sourcesArtifactForGate struct {
	Sources []struct {
		ID            string `json:"id"`
		Usage         string `json:"usage"`
		Retrieval     string `json:"retrieval"`
		QueryID       string `json:"query_id"`
		SourceClass   string `json:"source_class"`
		AuthorityTier string `json:"authority_tier"`
	} `json:"sources"`
}

type researchCoverageArtifact struct {
	Entity struct {
		Name string `json:"name"`
		Type string `json:"type"`
	} `json:"entity"`
	Sources []struct {
		ID     string `json:"id"`
		Usage  string `json:"usage"`
		Status string `json:"status"`
	} `json:"sources"`
	Coverage struct {
		SourceCount        int    `json:"source_count"`
		TopicOnlyRationale string `json:"topic_only_rationale"`
	} `json:"coverage"`
}

func ValidateResearchCoverageGate(safeRoot string) error {
	requestType, requestName, err := readResolvedRequestEntity(safeRoot)
	if err != nil {
		return err
	}
	sourceIDs, err := readKnownSourceIDs(safeRoot)
	if err != nil {
		return err
	}
	raw, err := readRunRegularArtifact(safeRoot, "research/research_coverage.json")
	if err != nil {
		return fmt.Errorf("research/research_coverage.json: read artifact: %w", err)
	}
	var coverage researchCoverageArtifact
	if err := json.Unmarshal(raw, &coverage); err != nil {
		return fmt.Errorf("research/research_coverage.json: invalid JSON: %w", err)
	}
	retrievedCount := 0
	identityRetrieved := false
	for _, source := range coverage.Sources {
		id := strings.TrimSpace(source.ID)
		if !sourceIDs[id] {
			return fmt.Errorf("research_coverage_gate: research_coverage source id %q not found in research/sources.json", id)
		}
		if strings.TrimSpace(source.Status) == "retrieved" {
			retrievedCount++
			if strings.TrimSpace(source.Usage) == "identity" {
				identityRetrieved = true
			}
		}
	}
	if coverage.Coverage.SourceCount != retrievedCount {
		return fmt.Errorf("research_coverage_gate: source_count = %d, want %d retrieved coverage sources", coverage.Coverage.SourceCount, retrievedCount)
	}
	coverageType := strings.TrimSpace(coverage.Entity.Type)
	if coverageType != requestType {
		return fmt.Errorf("research_coverage_gate: entity type %q does not match request/entity_resolution.json type %q", coverageType, requestType)
	}
	if requestName != "" && strings.TrimSpace(coverage.Entity.Name) != requestName {
		return fmt.Errorf("research_coverage_gate: entity name %q does not match request/entity_resolution.json name %q", strings.TrimSpace(coverage.Entity.Name), requestName)
	}
	if requestType == "topic" {
		if strings.TrimSpace(coverage.Coverage.TopicOnlyRationale) == "" {
			return fmt.Errorf("research_coverage_gate: topic_only_rationale is required for topic research")
		}
		return nil
	}
	if !identityRetrieved {
		return fmt.Errorf("research_coverage_gate: real-world entity requires a retrieved identity source")
	}
	return nil
}

func readResolvedRequestEntity(safeRoot string) (string, string, error) {
	raw, err := readRunRegularArtifact(safeRoot, "request/entity_resolution.json")
	if err != nil {
		return "", "", fmt.Errorf("request/entity_resolution.json: read artifact: %w", err)
	}
	var resolution entityResolutionArtifact
	if err := json.Unmarshal(raw, &resolution); err != nil {
		return "", "", fmt.Errorf("request/entity_resolution.json: invalid JSON: %w", err)
	}
	entityType := strings.TrimSpace(resolution.ResolvedEntity.Type)
	if entityType == "" {
		return "", "", fmt.Errorf("request/entity_resolution.json: resolved_entity.type is required")
	}
	return entityType, strings.TrimSpace(resolution.ResolvedEntity.Name), nil
}

func ValidateSlideContentSourceRefsGate(safeRoot string) error {
	sourceIDs, err := readKnownSourceIDs(safeRoot)
	if err != nil {
		return err
	}
	raw, err := readRunRegularArtifact(safeRoot, "content/slide_content.json")
	if err != nil {
		return fmt.Errorf("content/slide_content.json: read artifact: %w", err)
	}
	var content contentPayloadFile
	if err := json.Unmarshal(raw, &content); err != nil {
		return fmt.Errorf("content/slide_content.json: invalid JSON: %w", err)
	}
	for _, slide := range content.Slides {
		if len(slide.SourceRefs) == 0 {
			return fmt.Errorf("slide_content_source_refs_gate: slide %q source_refs is empty", strings.TrimSpace(slide.ID))
		}
		for _, ref := range slide.SourceRefs {
			ref = strings.TrimSpace(ref)
			if !sourceIDs[ref] {
				return fmt.Errorf("slide_content_source_refs_gate: slide %q source_refs contains unknown source id %q", slide.ID, ref)
			}
		}
		for _, visual := range slide.Visuals {
			if requiresConcreteVisualForm(visual.Type) && normalizeAuthorVisualForm(visual.VisualForm) == "" {
				return fmt.Errorf("slide_content_visual_form_gate: slide %q visual %q type %q must declare visual_form", slide.ID, strings.TrimSpace(visual.ID), strings.TrimSpace(visual.Type))
			}
		}
	}
	report, err := evaluateContentPayloadAtRoot(safeRoot)
	if err != nil {
		return err
	}
	if report.Metrics.IssueCount > 0 {
		return fmt.Errorf("slide_content_payload_gate: %s", summarizeContentPayloadIssues(report.Issues))
	}
	return nil
}

func requiresConcreteVisualForm(visualType string) bool {
	switch strings.TrimSpace(visualType) {
	case "diagram", "map", "icon", "illustration":
		return true
	default:
		return false
	}
}

type slideCopyPlanArtifact struct {
	Slides []struct {
		ID           string `json:"id"`
		AudienceCopy struct {
			Title  string   `json:"title"`
			Body   string   `json:"body"`
			Labels []string `json:"labels"`
		} `json:"audience_copy"`
		ProductionInstruction struct {
			Layout   string   `json:"layout"`
			AssetIDs []string `json:"asset_ids"`
		} `json:"production_instruction"`
	} `json:"slides"`
}

func ValidateSlideCopyPlanGate(safeRoot string) error {
	raw, err := readRunRegularArtifact(safeRoot, "content/slide_copy_plan.json")
	if err != nil {
		return fmt.Errorf("content/slide_copy_plan.json: read artifact: %w", err)
	}
	var plan slideCopyPlanArtifact
	if err := json.Unmarshal(raw, &plan); err != nil {
		return fmt.Errorf("content/slide_copy_plan.json: invalid JSON: %w", err)
	}
	for i, slide := range plan.Slides {
		visible := strings.Join([]string{slide.AudienceCopy.Title, slide.AudienceCopy.Body, strings.Join(slide.AudienceCopy.Labels, " ")}, " ")
		if productionInstructionLeakVisible(visible) {
			return fmt.Errorf("slide_copy_plan_gate: slides[%d] audience_copy contains production_instruction language", i)
		}
		if strings.TrimSpace(slide.ProductionInstruction.Layout) == "" {
			return fmt.Errorf("slide_copy_plan_gate: slides[%d] production_instruction.layout is required", i)
		}
	}
	return nil
}

func productionInstructionLeakVisible(text string) bool {
	lower := strings.ToLower(text)
	for _, marker := range []string{
		"production_instruction",
		"图片要完整",
		"必须让眼镜完整出现",
		"不要裁切",
		"来源来自",
		"用这张图",
		"封面要全屏",
		"用于判断",
		"sources:",
		"source note",
	} {
		if strings.Contains(lower, strings.ToLower(marker)) {
			return true
		}
	}
	return false
}

func ValidateAssetInventoryGate(safeRoot string) error {
	manifest, err := readAssetsManifest(safeRoot)
	if err != nil {
		return err
	}
	inventory, err := readAssetInventory(safeRoot)
	if err != nil {
		return err
	}
	inventoryByID := make(map[string]assetInventoryItem, len(inventory.Items))
	inventoryByPath := make(map[string]assetInventoryItem, len(inventory.Items))
	for _, item := range inventory.Items {
		if id := strings.TrimSpace(item.ID); id != "" {
			inventoryByID[id] = item
		}
		if path := strings.TrimSpace(item.Path); path != "" {
			inventoryByPath[path] = item
		}
	}
	for _, asset := range manifest.Assets {
		if assetStatus(asset) != "ready" {
			continue
		}
		id := assetID(asset)
		path := assetPath(asset)
		if _, ok := inventoryByID[id]; ok {
			continue
		}
		if _, ok := inventoryByPath[path]; ok {
			continue
		}
		return fmt.Errorf("asset_inventory_gate: ready asset %q path %q is missing from asset_inventory", id, path)
	}
	return nil
}

func readKnownSourceIDs(safeRoot string) (map[string]bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, "research/sources.json")
	if err != nil {
		return nil, fmt.Errorf("research/sources.json: read artifact: %w", err)
	}
	var sources sourcesArtifactForGate
	if err := json.Unmarshal(raw, &sources); err != nil {
		return nil, fmt.Errorf("research/sources.json: invalid JSON: %w", err)
	}
	ids := make(map[string]bool, len(sources.Sources))
	for _, source := range sources.Sources {
		id := strings.TrimSpace(source.ID)
		if id != "" {
			ids[id] = true
		}
	}
	return ids, nil
}

func validateDeckSlideOutputPaths(safeRoot string, artifactPath string) error {
	raw, err := readRunRegularArtifact(safeRoot, artifactPath)
	if err != nil {
		return fmt.Errorf("%s: read artifact: %w", artifactPath, err)
	}
	var deck struct {
		Slides []struct {
			Path string `json:"path"`
		} `json:"slides"`
	}
	if err := json.Unmarshal(raw, &deck); err != nil {
		return fmt.Errorf("%s: invalid JSON: %w", artifactPath, err)
	}
	for i, slide := range deck.Slides {
		if _, err := previewSlideObjectPath(slide.Path); err != nil {
			return fmt.Errorf("%s: field slides[%d].path: %w", artifactPath, i, err)
		}
	}
	return nil
}

func validateStageOutputSchema(safeRoot, artifactPath, schemaPath string) error {
	artifactRaw, err := readRunRegularArtifact(safeRoot, artifactPath)
	if err != nil {
		return fmt.Errorf("%s: read artifact: %w", artifactPath, err)
	}
	schemaRaw, err := readRunRegularArtifact(safeRoot, schemaPath)
	if artifactPath == deliveryReceiptPath && schemaPath == stageOutputSchemaPaths[deliveryReceiptPath] {
		schemaRaw = []byte(DeliveryReceiptSchema)
	} else if err != nil {
		return fmt.Errorf("%s: read schema %s: %w", artifactPath, schemaPath, err)
	}
	schema, err := decodeLiteJSONSchema(schemaRaw)
	if err != nil {
		return fmt.Errorf("%s: schema %s: %w", artifactPath, schemaPath, err)
	}
	value, err := decodeJSONValue(artifactRaw)
	if err != nil {
		return fmt.Errorf("%s: invalid JSON: %w", artifactPath, err)
	}
	if err := validateJSONValue(schema, value, ""); err != nil {
		return fmt.Errorf("%s: %w", artifactPath, err)
	}
	return nil
}

func decodeLiteJSONSchema(raw []byte) (liteJSONSchema, error) {
	var schema liteJSONSchema
	decoder := json.NewDecoder(bytes.NewReader(raw))
	if err := decoder.Decode(&schema); err != nil {
		return liteJSONSchema{}, fmt.Errorf("invalid JSON: %w", err)
	}
	if err := rejectTrailingJSON(decoder); err != nil {
		return liteJSONSchema{}, err
	}
	return schema, nil
}

func decodeJSONValue(raw []byte) (any, error) {
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}
	if err := rejectTrailingJSON(decoder); err != nil {
		return nil, err
	}
	return value, nil
}

func rejectTrailingJSON(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return fmt.Errorf("contains trailing JSON value")
		}
		return err
	}
	return nil
}

func validateJSONValue(schema liteJSONSchema, value any, fieldPath string) error {
	switch schema.Type {
	case "":
		return nil
	case "object":
		return validateJSONObject(schema, value, fieldPath)
	case "array":
		return validateJSONArray(schema, value, fieldPath)
	case "string":
		return validateJSONString(schema, value, fieldPath)
	case "integer":
		if !isJSONInteger(value) {
			return fmt.Errorf("field %s expected integer, got %s", displayFieldPath(fieldPath), jsonValueType(value))
		}
		return nil
	case "number":
		if !isJSONNumber(value) {
			return fmt.Errorf("field %s expected number, got %s", displayFieldPath(fieldPath), jsonValueType(value))
		}
		return nil
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("field %s expected boolean, got %s", displayFieldPath(fieldPath), jsonValueType(value))
		}
		return nil
	default:
		return fmt.Errorf("field %s uses unsupported schema type %q", displayFieldPath(fieldPath), schema.Type)
	}
}

func validateJSONObject(schema liteJSONSchema, value any, fieldPath string) error {
	object, ok := value.(map[string]any)
	if !ok {
		return fmt.Errorf("field %s expected object, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	for _, required := range schema.Required {
		if _, ok := object[required]; !ok {
			return fmt.Errorf("field %s is required", joinFieldPath(fieldPath, required))
		}
	}
	if schema.AdditionalProperties != nil && !*schema.AdditionalProperties {
		for name := range object {
			if _, ok := schema.Properties[name]; !ok {
				return fmt.Errorf("field %s is not allowed by additionalProperties:false", joinFieldPath(fieldPath, name))
			}
		}
	}
	for name, propertySchema := range schema.Properties {
		child, ok := object[name]
		if !ok {
			continue
		}
		if err := validateJSONValue(propertySchema, child, joinFieldPath(fieldPath, name)); err != nil {
			return err
		}
	}
	return nil
}

func validateJSONArray(schema liteJSONSchema, value any, fieldPath string) error {
	array, ok := value.([]any)
	if !ok {
		return fmt.Errorf("field %s expected array, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	if schema.MinItems != nil && len(array) < *schema.MinItems {
		return fmt.Errorf("field %s has %d items, want minItems %d", displayFieldPath(fieldPath), len(array), *schema.MinItems)
	}
	if schema.Items == nil {
		return nil
	}
	for i, item := range array {
		if err := validateJSONValue(*schema.Items, item, joinArrayFieldPath(fieldPath, i)); err != nil {
			return err
		}
	}
	return nil
}

func validateJSONString(schema liteJSONSchema, value any, fieldPath string) error {
	text, ok := value.(string)
	if !ok {
		return fmt.Errorf("field %s expected string, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	if len(schema.Enum) > 0 {
		for _, allowed := range schema.Enum {
			if text == allowed {
				return nil
			}
		}
		return fmt.Errorf("field %s value %q is not in enum %v", displayFieldPath(fieldPath), text, schema.Enum)
	}
	if schema.Pattern != "" {
		matched, err := regexp.MatchString(schema.Pattern, text)
		if err != nil {
			return fmt.Errorf("field %s has invalid pattern %q: %w", displayFieldPath(fieldPath), schema.Pattern, err)
		}
		if !matched {
			return fmt.Errorf("field %s value %q does not match pattern %q", displayFieldPath(fieldPath), text, schema.Pattern)
		}
	}
	return nil
}

func isJSONInteger(value any) bool {
	switch typed := value.(type) {
	case json.Number:
		return isCanonicalJSONInteger(typed.String())
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return true
	default:
		return false
	}
}

func isJSONNumber(value any) bool {
	switch typed := value.(type) {
	case json.Number:
		_, err := strconv.ParseFloat(typed.String(), 64)
		return err == nil
	case float64:
		return true
	default:
		return false
	}
}

func isCanonicalJSONInteger(value string) bool {
	if value == "" || strings.ContainsAny(value, ".eE") {
		return false
	}
	var parsed big.Int
	_, ok := parsed.SetString(value, 10)
	return ok
}

func jsonValueType(value any) string {
	switch value.(type) {
	case nil:
		return "null"
	case map[string]any:
		return "object"
	case []any:
		return "array"
	case string:
		return "string"
	case json.Number, float64:
		return "number"
	case bool:
		return "boolean"
	default:
		return fmt.Sprintf("%T", value)
	}
}

func joinFieldPath(parent, name string) string {
	if parent == "" {
		return name
	}
	return parent + "." + name
}

func joinArrayFieldPath(parent string, index int) string {
	if parent == "" {
		return fmt.Sprintf("[%d]", index)
	}
	return fmt.Sprintf("%s[%d]", parent, index)
}

func displayFieldPath(path string) string {
	if path == "" {
		return "$"
	}
	return path
}
