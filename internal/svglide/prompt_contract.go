package svglide

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"

	"gopkg.in/yaml.v3"
)

const (
	ProtocolAnyGenSVGSlides = "anygen-svg-slides"
)

type PromptAssetContract struct {
	ID             string   `json:"id" yaml:"id"`
	Role           string   `json:"role" yaml:"role"`
	OrchestratedBy string   `json:"orchestrated_by,omitempty" yaml:"orchestrated_by,omitempty"`
	Invocation     string   `json:"invocation,omitempty" yaml:"invocation,omitempty"`
	Stage          string   `json:"stage,omitempty" yaml:"stage,omitempty"`
	Order          int      `json:"order,omitempty" yaml:"order,omitempty"`
	Cardinality    string   `json:"cardinality,omitempty" yaml:"cardinality,omitempty"`
	Requires       []string `json:"requires,omitempty" yaml:"requires,omitempty"`
	Condition      string   `json:"condition,omitempty" yaml:"condition,omitempty"`
	Trigger        []string `json:"trigger,omitempty" yaml:"trigger,omitempty"`
	Consumes       []string `json:"consumes,omitempty" yaml:"consumes,omitempty"`
	Produces       []string `json:"produces,omitempty" yaml:"produces,omitempty"`
	CompletionGate []string `json:"completion_gate,omitempty" yaml:"completion_gate,omitempty"`
	PhaseAnchors   []string `json:"phase_anchors,omitempty" yaml:"phase_anchors,omitempty"`
	Profiles       []string `json:"profiles,omitempty" yaml:"profiles,omitempty"`
	Exposure       string   `json:"exposure,omitempty" yaml:"exposure,omitempty"`
	Rules          []any    `json:"-" yaml:"rules,omitempty"`
	Path           string   `json:"path" yaml:"-"`
	SHA256         string   `json:"sha256" yaml:"-"`
}

type AnyGenOrchestrationGraph struct {
	Protocol          string                `json:"protocol"`
	Orchestrator      PromptAssetContract   `json:"orchestrator"`
	ProtocolReference PromptAssetContract   `json:"protocol_reference"`
	Assets            []PromptAssetContract `json:"assets"`
}

type ToolInvocationContract struct {
	Protocol         string                `json:"protocol"`
	RequiredCalls    []ToolCallRequirement `json:"required_calls"`
	ConditionalCalls []ToolCallRequirement `json:"conditional_calls"`
}

type ToolCallRequirement struct {
	ID          string   `json:"id"`
	Stage       string   `json:"stage,omitempty"`
	PromptID    string   `json:"prompt_id"`
	Invocation  string   `json:"invocation,omitempty"`
	Order       int      `json:"order,omitempty"`
	Cardinality string   `json:"cardinality"`
	Condition   string   `json:"condition"`
	Consumes    []string `json:"consumes"`
	Produces    []string `json:"produces"`
}

type StagePromptContract struct {
	Protocol             string   `json:"protocol"`
	Stage                string   `json:"stage"`
	ContextReceipt       string   `json:"context_receipt,omitempty"`
	Orchestrator         string   `json:"orchestrator"`
	ProtocolReference    string   `json:"protocol_reference"`
	RequiredPromptIDs    []string `json:"required_prompt_ids"`
	ConditionalPromptIDs []string `json:"conditional_prompt_ids,omitempty"`
	PhaseAnchors         []string `json:"phase_anchors,omitempty"`
}

type PromptContextAsset struct {
	ID       string `json:"id"`
	Role     string `json:"role"`
	Path     string `json:"path"`
	SHA256   string `json:"sha256"`
	Required bool   `json:"required"`
}

type PromptContext struct {
	ReadPolicy string               `json:"read_policy"`
	Authority  string               `json:"authority"`
	Assets     []PromptContextAsset `json:"assets"`
}

type AgentTask struct {
	Protocol           string                `json:"protocol"`
	Stage              string                `json:"stage"`
	Objective          string                `json:"objective"`
	Orchestrator       string                `json:"orchestrator"`
	ProtocolReference  string                `json:"protocol_reference"`
	RequiredPrompts    []string              `json:"required_prompts"`
	RequiredCalls      []ToolCallRequirement `json:"required_calls"`
	ConditionalCalls   []ToolCallRequirement `json:"conditional_calls,omitempty"`
	PhaseAnchors       []string              `json:"phase_anchors,omitempty"`
	Inputs             []string              `json:"inputs"`
	Outputs            []string              `json:"outputs"`
	CompletionGate     []string              `json:"completion_gate"`
	ToolCallReceiptDir string                `json:"tool_call_receipt_dir"`
	PromptContext      PromptContext         `json:"prompt_context"`
}

type PromptContextReceipt struct {
	Stage                  string                 `json:"stage"`
	Protocol               string                 `json:"protocol"`
	AgentTask              AgentTask              `json:"agent_task"`
	PromptContract         StagePromptContract    `json:"prompt_contract"`
	ToolInvocationContract ToolInvocationContract `json:"tool_invocation_contract"`
	AssetHashes            map[string]string      `json:"asset_hashes"`
}

func LoadAnyGenPromptAssets() ([]PromptAssetContract, error) {
	manifest := DefaultPromptManifest()
	assets := make([]PromptAssetContract, 0, len(manifest.Entries))
	ids := map[string]bool{}
	for _, entry := range manifest.Entries {
		asset, err := loadPromptAssetContract(entry.Path)
		if err != nil {
			return nil, err
		}
		expectedID := entry.ID
		if expectedID == "" {
			expectedID = entry.Name
		}
		if asset.ID != expectedID {
			return nil, fmt.Errorf("%s: prompt asset id = %q, want %q", entry.Path, asset.ID, expectedID)
		}
		if len(asset.Profiles) == 0 {
			asset.Profiles = slices.Clone(entry.Profiles)
		}
		if asset.Exposure == "" {
			asset.Exposure = entry.Exposure
		}
		if ids[asset.ID] {
			return nil, fmt.Errorf("duplicate prompt asset id %q", asset.ID)
		}
		ids[asset.ID] = true
		assets = append(assets, asset)
	}
	return assets, nil
}

func loadPromptAssetContract(path string) (PromptAssetContract, error) {
	raw, err := readPromptAssetFile(path)
	if err != nil {
		return PromptAssetContract{}, err
	}
	frontmatter, err := semanticMarkdownFrontmatter(path, raw)
	if err != nil {
		return PromptAssetContract{}, err
	}
	var asset PromptAssetContract
	decoder := yaml.NewDecoder(bytes.NewReader(frontmatter))
	decoder.KnownFields(true)
	if err := decoder.Decode(&asset); err != nil {
		return PromptAssetContract{}, fmt.Errorf("%s frontmatter: %w", path, err)
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return PromptAssetContract{}, fmt.Errorf("%s frontmatter must contain a single YAML document", path)
		}
		return PromptAssetContract{}, fmt.Errorf("%s frontmatter: %w", path, err)
	}
	asset.Path = filepath.ToSlash(filepath.Clean(path))
	asset.SHA256, err = promptAssetSHAStrict(path)
	if err != nil {
		return PromptAssetContract{}, err
	}
	if err := validatePromptAssetContract(asset); err != nil {
		return PromptAssetContract{}, fmt.Errorf("%s: %w", path, err)
	}
	return asset, nil
}

func validatePromptAssetContract(asset PromptAssetContract) error {
	if strings.TrimSpace(asset.ID) == "" {
		return fmt.Errorf("missing id")
	}
	if strings.TrimSpace(asset.Role) == "" {
		return fmt.Errorf("missing role")
	}
	if strings.TrimSpace(asset.Invocation) == "" {
		return fmt.Errorf("missing invocation")
	}
	switch asset.Role {
	case "source_snapshot", "reference_index", "semantic_contract", "runtime_binding":
		if asset.Invocation != "reference" {
			return fmt.Errorf("role %s must use invocation reference", asset.Role)
		}
	case "orchestrator":
		if asset.Invocation != "required" || asset.ID != "mode_system_prompt_svg" {
			return fmt.Errorf("orchestrator must be mode_system_prompt_svg with required invocation")
		}
	case "protocol_reference":
		if asset.Invocation != "required" || asset.ID != "svg_reference" {
			return fmt.Errorf("protocol_reference must be svg_reference with required invocation")
		}
	case "tool_prompt":
		if asset.OrchestratedBy != "mode_system_prompt_svg" {
			return fmt.Errorf("tool prompt %s must be orchestrated_by mode_system_prompt_svg", asset.ID)
		}
		if asset.Invocation != "required" && asset.Invocation != "conditional" {
			return fmt.Errorf("tool prompt %s uses unsupported invocation %q", asset.ID, asset.Invocation)
		}
		if strings.TrimSpace(asset.Stage) == "" {
			return fmt.Errorf("tool prompt %s missing stage", asset.ID)
		}
		if strings.TrimSpace(asset.Cardinality) == "" {
			return fmt.Errorf("tool prompt %s missing cardinality", asset.ID)
		}
		if strings.TrimSpace(asset.Condition) == "" {
			return fmt.Errorf("tool prompt %s missing condition", asset.ID)
		}
		if len(asset.Consumes) == 0 {
			return fmt.Errorf("tool prompt %s missing consumes", asset.ID)
		}
		if len(asset.Produces) == 0 {
			return fmt.Errorf("tool prompt %s missing produces", asset.ID)
		}
		if asset.Invocation == "conditional" && len(asset.Trigger) == 0 {
			return fmt.Errorf("conditional tool prompt %s missing trigger", asset.ID)
		}
	default:
		return fmt.Errorf("unsupported role %q", asset.Role)
	}
	return nil
}

func BuildAnyGenOrchestrationGraph() (AnyGenOrchestrationGraph, error) {
	assets, err := LoadAnyGenPromptAssets()
	if err != nil {
		return AnyGenOrchestrationGraph{}, err
	}
	var orchestrators []PromptAssetContract
	var references []PromptAssetContract
	for _, asset := range assets {
		switch asset.Role {
		case "orchestrator":
			orchestrators = append(orchestrators, asset)
		case "protocol_reference":
			references = append(references, asset)
		}
	}
	if len(orchestrators) != 1 {
		return AnyGenOrchestrationGraph{}, fmt.Errorf("expected exactly one orchestrator, got %d", len(orchestrators))
	}
	if len(references) != 1 {
		return AnyGenOrchestrationGraph{}, fmt.Errorf("expected exactly one protocol reference, got %d", len(references))
	}
	return AnyGenOrchestrationGraph{
		Protocol:          ProtocolAnyGenSVGSlides,
		Orchestrator:      orchestrators[0],
		ProtocolReference: references[0],
		Assets:            assets,
	}, nil
}

func PromptAssetsForProfileStage(profile string, stage string) ([]PromptAssetContract, error) {
	assets, err := LoadAnyGenPromptAssets()
	if err != nil {
		return nil, err
	}
	out := make([]PromptAssetContract, 0, len(assets))
	for _, asset := range assets {
		if !promptAssetAllowedForProfile(asset.Profiles, profile) {
			continue
		}
		if asset.Role == "orchestrator" || asset.Role == "protocol_reference" || asset.AlwaysForPromptContext(stage) || asset.Stage == stage {
			out = append(out, asset)
		}
	}
	return out, nil
}

func BuildToolInvocationContract(run Run, stage string) (ToolInvocationContract, error) {
	assets, err := PromptAssetsForProfileStage(run.RouteProfile, stage)
	if err != nil {
		return ToolInvocationContract{}, err
	}
	contract := ToolInvocationContract{Protocol: ProtocolAnyGenSVGSlides}
	for _, asset := range assets {
		if asset.Role != "tool_prompt" {
			continue
		}
		req := toolRequirementFromAsset(asset)
		switch asset.Invocation {
		case "required":
			contract.RequiredCalls = append(contract.RequiredCalls, req)
		case "conditional":
			contract.ConditionalCalls = append(contract.ConditionalCalls, req)
		}
	}
	return contract, nil
}

func RequiredPromptContractForStage(stage string, run Run) (StagePromptContract, error) {
	assets, err := PromptAssetsForProfileStage(run.RouteProfile, stage)
	if err != nil {
		return StagePromptContract{}, err
	}
	contract := StagePromptContract{
		Protocol:          ProtocolAnyGenSVGSlides,
		Stage:             stage,
		ContextReceipt:    promptContextReceiptPath(stage),
		Orchestrator:      "mode_system_prompt_svg",
		ProtocolReference: "svg_reference",
	}
	for _, asset := range assets {
		if asset.Role == "orchestrator" || asset.Role == "protocol_reference" || asset.Role == "runtime_binding" || asset.AlwaysForPromptContext(stage) {
			if asset.Invocation == "conditional" {
				contract.ConditionalPromptIDs = appendUnique(contract.ConditionalPromptIDs, asset.ID)
			} else {
				contract.RequiredPromptIDs = appendUnique(contract.RequiredPromptIDs, asset.ID)
			}
		}
		if asset.Stage == stage && len(asset.PhaseAnchors) > 0 {
			contract.PhaseAnchors = append(contract.PhaseAnchors, asset.PhaseAnchors...)
		}
	}
	if stage == StageResearch {
		contract.PhaseAnchors = []string{"Phase 3 - Build source material"}
	}
	if stage == StageSlideContent {
		contract.PhaseAnchors = []string{"Phase 6 - Write slide_content.md"}
	}
	if stage == StageAssets {
		contract.PhaseAnchors = appendUnique(contract.PhaseAnchors, "Phase 7 - Lock the visual direction & plan visuals")
		contract.PhaseAnchors = appendUnique(contract.PhaseAnchors, "<visuals>")
	}
	return contract, nil
}

func (asset PromptAssetContract) AlwaysForPromptContext(stage string) bool {
	return asset.Role == "reference_index" || asset.Role == "semantic_contract" || asset.Role == "runtime_binding" || asset.Stage == stage
}

func RequiredToolCallsForStage(stage string, run Run) ([]ToolCallRequirement, error) {
	contract, err := BuildToolInvocationContract(run, stage)
	if err != nil {
		return nil, err
	}
	var calls []ToolCallRequirement
	for _, call := range contract.RequiredCalls {
		if call.Stage == stage {
			calls = append(calls, call)
		}
	}
	return calls, nil
}

func TriggeredConditionalToolCalls(stage string, run Run, safeRoot string) ([]ToolCallRequirement, error) {
	contract, err := BuildToolInvocationContract(run, stage)
	if err != nil {
		return nil, err
	}
	var calls []ToolCallRequirement
	for _, call := range contract.ConditionalCalls {
		if call.Stage != stage {
			continue
		}
		matched, err := conditionMatched(call.Condition, run, safeRoot)
		if err != nil {
			return nil, err
		}
		if matched {
			calls = append(calls, call)
		}
	}
	return calls, nil
}

func BuildAgentTask(stage Stage, run Run, safeRoot string, inputs, outputs []string) (AgentTask, StagePromptContract, ToolInvocationContract, error) {
	promptContract, err := RequiredPromptContractForStage(stage.Name, run)
	if err != nil {
		return AgentTask{}, StagePromptContract{}, ToolInvocationContract{}, err
	}
	promptContext, err := promptContextForPromptContract(promptContract)
	if err != nil {
		return AgentTask{}, StagePromptContract{}, ToolInvocationContract{}, err
	}
	requiredCalls, err := RequiredToolCallsForStage(stage.Name, run)
	if err != nil {
		return AgentTask{}, StagePromptContract{}, ToolInvocationContract{}, err
	}
	conditionalCalls, err := TriggeredConditionalToolCalls(stage.Name, run, safeRoot)
	if err != nil {
		return AgentTask{}, StagePromptContract{}, ToolInvocationContract{}, err
	}
	stageContract := ToolInvocationContract{
		Protocol:         ProtocolAnyGenSVGSlides,
		RequiredCalls:    requiredCalls,
		ConditionalCalls: conditionalCalls,
	}
	task := AgentTask{
		Protocol:           ProtocolAnyGenSVGSlides,
		Stage:              stage.Name,
		Objective:          stageObjective(stage.Name),
		Orchestrator:       promptContract.Orchestrator,
		ProtocolReference:  promptContract.ProtocolReference,
		RequiredPrompts:    promptContract.RequiredPromptIDs,
		RequiredCalls:      requiredCalls,
		ConditionalCalls:   conditionalCalls,
		PhaseAnchors:       promptContract.PhaseAnchors,
		Inputs:             inputs,
		Outputs:            outputs,
		CompletionGate:     completionGateForStage(stage.Name, requiredCalls, conditionalCalls),
		ToolCallReceiptDir: filepath.ToSlash(filepath.Join("receipts", "tool_calls", stage.Name)),
		PromptContext:      promptContext,
	}
	return task, promptContract, stageContract, nil
}

func WritePromptContextReceipt(safeRoot string, stageName string, task AgentTask, promptContract StagePromptContract, toolContract ToolInvocationContract) error {
	assetHashes := map[string]string{}
	for _, asset := range task.PromptContext.Assets {
		assetHashes[asset.ID] = asset.SHA256
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, promptContextReceiptPath(stageName))
	if err != nil {
		return err
	}
	return writeJSON(target, PromptContextReceipt{
		Stage:                  stageName,
		Protocol:               ProtocolAnyGenSVGSlides,
		AgentTask:              task,
		PromptContract:         promptContract,
		ToolInvocationContract: toolContract,
		AssetHashes:            assetHashes,
	})
}

func ValidatePromptContextForStage(safeRoot string, stageName string, run Run) (PromptContextReceipt, error) {
	if stageName == StageRequest {
		return PromptContextReceipt{}, nil
	}
	raw, err := readRunRegularArtifact(safeRoot, promptContextReceiptPath(stageName))
	if err != nil {
		return PromptContextReceipt{}, fmt.Errorf("missing_prompt_context: %w", err)
	}
	var receipt PromptContextReceipt
	if err := json.Unmarshal(raw, &receipt); err != nil {
		return PromptContextReceipt{}, fmt.Errorf("invalid prompt context receipt: %w", err)
	}
	if receipt.Stage != stageName {
		return PromptContextReceipt{}, fmt.Errorf("wrong_stage_prompt_context: got %q want %q", receipt.Stage, stageName)
	}
	expectedContract, err := RequiredPromptContractForStage(stageName, run)
	if err != nil {
		return PromptContextReceipt{}, err
	}
	expectedContext, err := promptContextForPromptContract(expectedContract)
	if err != nil {
		return PromptContextReceipt{}, err
	}
	allowedIDs := make(map[string]string, len(expectedContext.Assets))
	requiredIDs := make(map[string]string, len(expectedContext.Assets))
	for _, asset := range expectedContext.Assets {
		allowedIDs[asset.ID] = asset.SHA256
		if !asset.Required {
			continue
		}
		requiredIDs[asset.ID] = asset.SHA256
	}
	for id, want := range requiredIDs {
		got, ok := receipt.AssetHashes[id]
		if !ok {
			return PromptContextReceipt{}, fmt.Errorf("missing_prompt_context_asset: %s", id)
		}
		if got != want {
			return PromptContextReceipt{}, fmt.Errorf("stale_prompt_context: prompt %s hash %s want %s", id, got, want)
		}
	}
	for _, asset := range receipt.AgentTask.PromptContext.Assets {
		want, ok := allowedIDs[asset.ID]
		if !ok {
			return PromptContextReceipt{}, fmt.Errorf("prompt context asset %q is not allowed for route profile %q stage %q", asset.ID, run.RouteProfile, stageName)
		}
		if strings.TrimSpace(asset.SHA256) != "" && asset.SHA256 != want {
			return PromptContextReceipt{}, fmt.Errorf("stale_prompt_context: prompt %s hash %s want %s", asset.ID, asset.SHA256, want)
		}
	}
	for id, want := range receipt.AssetHashes {
		expectedHash, ok := allowedIDs[id]
		if !ok {
			return PromptContextReceipt{}, fmt.Errorf("prompt context asset %q is not allowed for route profile %q stage %q", id, run.RouteProfile, stageName)
		}
		if expectedHash != want {
			return PromptContextReceipt{}, fmt.Errorf("stale_prompt_context: prompt %s hash %s want %s", id, want, expectedHash)
		}
	}
	return receipt, nil
}

func ValidateToolCallReceiptsForStage(safeRoot string, stageName string, run Run, receipt PromptContextReceipt) error {
	if stageName == StageRequest {
		return nil
	}
	requiredCalls, err := RequiredToolCallsForStage(stageName, run)
	if err != nil {
		return err
	}
	conditionalCalls, err := TriggeredConditionalToolCalls(stageName, run, safeRoot)
	if err != nil {
		return err
	}
	calls := append([]ToolCallRequirement{}, requiredCalls...)
	calls = append(calls, conditionalCalls...)
	promptIDs := promptIDsFromReceipt(receipt)
	for _, call := range calls {
		path := filepath.Join("receipts", "tool_calls", stageName, call.ID+".json")
		raw, err := readRunRegularArtifact(safeRoot, path)
		if err != nil {
			return fmt.Errorf("missing_tool_call: %s: %w", call.ID, err)
		}
		var toolReceipt struct {
			Stage            string   `json:"stage"`
			CallID           string   `json:"call_id"`
			PromptID         string   `json:"prompt_id"`
			Invocation       string   `json:"invocation"`
			Condition        string   `json:"condition"`
			ConditionMatched bool     `json:"condition_matched"`
			Order            int      `json:"order"`
			Cardinality      string   `json:"cardinality"`
			Status           string   `json:"status"`
			Consumed         []string `json:"consumed"`
			Produced         []string `json:"produced"`
		}
		if err := json.Unmarshal(raw, &toolReceipt); err != nil {
			return fmt.Errorf("%s: invalid tool call receipt: %w", path, err)
		}
		if toolReceipt.Stage != stageName || toolReceipt.CallID != call.ID || toolReceipt.PromptID != call.PromptID || toolReceipt.Status != StatusDone {
			return fmt.Errorf("%s: receipt does not satisfy tool call %s", path, call.ID)
		}
		if toolReceipt.Invocation != call.Invocation || toolReceipt.Condition != call.Condition || toolReceipt.Cardinality != call.Cardinality || toolReceipt.Order != call.Order {
			return fmt.Errorf("%s: receipt contract mismatch for tool call %s", path, call.ID)
		}
		if !toolReceipt.ConditionMatched {
			return fmt.Errorf("%s: condition_matched must be true for required tool call %s", path, call.ID)
		}
		if !stringSlicesEqual(toolReceipt.Consumed, call.Consumes) {
			return fmt.Errorf("%s: consumed artifacts = %v, want %v", path, toolReceipt.Consumed, call.Consumes)
		}
		if !stringSlicesEqual(toolReceipt.Produced, call.Produces) {
			return fmt.Errorf("%s: produced artifacts = %v, want %v", path, toolReceipt.Produced, call.Produces)
		}
		if !promptIDs[toolReceipt.PromptID] {
			return fmt.Errorf("%s: prompt_id %q is not in current prompt context", path, toolReceipt.PromptID)
		}
		if err := validateToolReceiptArtifactsExist(safeRoot, path, "consumed", toolReceipt.Consumed); err != nil {
			return err
		}
		if err := validateToolReceiptArtifactsExist(safeRoot, path, "produced", toolReceipt.Produced); err != nil {
			return err
		}
	}
	return nil
}

func ValidateArtifactPromptContractForStage(safeRoot string, stageName string, outputs []string) error {
	if stageName == StageRequest || stageName == StageValidatePreviewRepair {
		return nil
	}
	for _, output := range outputs {
		if hasGlobMeta(output) || !strings.HasSuffix(output, ".json") || strings.HasPrefix(output, "receipts/") || output == "quality_report.json" {
			continue
		}
		raw, err := readRunRegularArtifact(safeRoot, output)
		if err != nil {
			return err
		}
		var artifact struct {
			PromptContract StagePromptContract `json:"prompt_contract"`
		}
		if err := json.Unmarshal(raw, &artifact); err != nil {
			return fmt.Errorf("%s: invalid JSON: %w", output, err)
		}
		if artifact.PromptContract.Protocol == "" {
			return fmt.Errorf("%s: missing prompt_contract", output)
		}
		if artifact.PromptContract.Stage != stageName {
			return fmt.Errorf("%s: prompt_contract.stage = %q, want %q", output, artifact.PromptContract.Stage, stageName)
		}
		if artifact.PromptContract.Orchestrator != "mode_system_prompt_svg" {
			return fmt.Errorf("%s: prompt_contract.orchestrator = %q, want mode_system_prompt_svg", output, artifact.PromptContract.Orchestrator)
		}
		if artifact.PromptContract.ProtocolReference != "svg_reference" {
			return fmt.Errorf("%s: prompt_contract.protocol_reference = %q, want svg_reference", output, artifact.PromptContract.ProtocolReference)
		}
	}
	return nil
}

func promptContextReceiptPath(stage string) string {
	return filepath.ToSlash(filepath.Join("receipts", "prompt_context", stage+".json"))
}

func promptContextForPromptContract(contract StagePromptContract) (PromptContext, error) {
	ids := append([]string{}, contract.RequiredPromptIDs...)
	ids = append(ids, contract.ConditionalPromptIDs...)
	assets := make([]PromptContextAsset, 0, len(ids))
	assetByID, err := promptAssetsByID()
	if err != nil {
		return PromptContext{}, err
	}
	for _, id := range ids {
		asset, ok := assetByID[id]
		if !ok {
			return PromptContext{}, fmt.Errorf("prompt context references unknown prompt id %q", id)
		}
		assets = append(assets, PromptContextAsset{
			ID:       id,
			Role:     asset.Role,
			Path:     asset.Path,
			SHA256:   asset.SHA256,
			Required: slices.Contains(contract.RequiredPromptIDs, id),
		})
	}
	return PromptContext{
		ReadPolicy: "read_required_assets_before_authoring",
		Authority:  "cli_runtime_protocol",
		Assets:     assets,
	}, nil
}

func toolRequirementFromAsset(asset PromptAssetContract) ToolCallRequirement {
	return ToolCallRequirement{
		ID:          asset.ID,
		Stage:       asset.Stage,
		PromptID:    asset.ID,
		Invocation:  asset.Invocation,
		Order:       asset.Order,
		Cardinality: asset.Cardinality,
		Condition:   asset.Condition,
		Consumes:    slices.Clone(asset.Consumes),
		Produces:    slices.Clone(asset.Produces),
	}
}

func promptPathByID(id string) string {
	for _, entry := range DefaultPromptManifest().Entries {
		entryID := entry.ID
		if entryID == "" {
			entryID = entry.Name
		}
		if entryID == id {
			return entry.Path
		}
	}
	return ""
}

func promptRoleByID(id string) string {
	for _, entry := range DefaultPromptManifest().Entries {
		entryID := entry.ID
		if entryID == "" {
			entryID = entry.Name
		}
		if entryID == id {
			return entry.Role
		}
	}
	return ""
}

func promptAssetSHA(path string) string {
	hash, err := promptAssetSHAStrict(path)
	if err == nil {
		return hash
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		raw = []byte("missing:" + path)
	}
	sum := sha256.Sum256(raw)
	return "sha256:" + hex.EncodeToString(sum[:])
}

func promptAssetSHAStrict(path string) (string, error) {
	raw, err := readPromptAssetFile(path)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(raw)
	return "sha256:" + hex.EncodeToString(sum[:]), nil
}

func readPromptAssetFile(path string) ([]byte, error) {
	readPath := resolvePromptAssetReadPath(path)
	raw, err := os.ReadFile(readPath)
	if err != nil {
		return nil, fmt.Errorf("read prompt asset %q: %w", path, err)
	}
	return raw, nil
}

func resolvePromptAssetReadPath(path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	if _, err := os.Stat(path); err == nil {
		return path
	}
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return path
	}
	repoRoot := filepath.Clean(filepath.Join(filepath.Dir(file), "..", ".."))
	return filepath.Join(repoRoot, path)
}

func promptAssetsByID() (map[string]PromptAssetContract, error) {
	assets, err := LoadAnyGenPromptAssets()
	if err != nil {
		return nil, err
	}
	out := make(map[string]PromptAssetContract, len(assets))
	for _, asset := range assets {
		out[asset.ID] = asset
	}
	return out, nil
}

func promptIDsFromReceipt(receipt PromptContextReceipt) map[string]bool {
	ids := make(map[string]bool, len(receipt.AgentTask.PromptContext.Assets)+len(receipt.AssetHashes))
	for _, asset := range receipt.AgentTask.PromptContext.Assets {
		ids[asset.ID] = true
	}
	for id := range receipt.AssetHashes {
		ids[id] = true
	}
	return ids
}

func validateToolReceiptArtifactsExist(safeRoot string, receiptPath string, field string, paths []string) error {
	if len(paths) == 0 {
		return fmt.Errorf("%s: %s must not be empty", receiptPath, field)
	}
	for _, rel := range paths {
		rel = strings.TrimSpace(rel)
		if rel == "" {
			return fmt.Errorf("%s: %s contains empty path", receiptPath, field)
		}
		if hasGlobMeta(rel) {
			matches, err := filepath.Glob(filepath.Join(safeRoot, filepath.Clean(rel)))
			if err != nil {
				return fmt.Errorf("%s: %s glob %q invalid: %w", receiptPath, field, rel, err)
			}
			if len(matches) == 0 {
				return fmt.Errorf("%s: %s glob %q matched no artifacts", receiptPath, field, rel)
			}
			continue
		}
		if _, err := readRunRegularArtifact(safeRoot, rel); err != nil {
			return fmt.Errorf("%s: %s artifact %q invalid: %w", receiptPath, field, rel, err)
		}
	}
	return nil
}

func stageObjective(stage string) string {
	switch stage {
	case StageRequestResolution:
		return "识别用户请求的真实实体、主题类型、置信度和歧义；低置信度时阻断后续研究。"
	case StageResearch:
		return "基于用户主题和本地/网页资料建立 source material。"
	case StageDesignBrief:
		return "调用/遵守 resolve_design_brief，生成 narrative spine、depth、tone、visual system。"
	case StageOutline:
		return "调用/遵守 slide_outline，生成 deck outline、页角色、key message 和 style instruction。"
	case StageSlideContent:
		return "按 mode_system_prompt_svg Phase 6 生成逐页内容稿、source refs 和 visual intents。"
	case StageAssets:
		return "按 <visuals> 规划/准备图片、图表、diagram、fallback；不得无理由全 diagram。"
	case StageSVGAuthor:
		return "调用/遵守 activate_slides_edit 和 slides_edit，按 svg_reference 写完整 SVG slides。"
	case StageValidatePreviewRepair:
		return "调用/遵守 finish_slides_edit，执行 validate、preview、quality、semantic repair。"
	default:
		return "初始化或推进当前 SVGlide run stage。"
	}
}

func completionGateForStage(stage string, required, conditional []ToolCallRequirement) []string {
	var gates []string
	for _, call := range append(append([]ToolCallRequirement{}, required...), conditional...) {
		gates = append(gates, call.Produces...)
	}
	if len(gates) == 0 {
		switch stage {
		case StageResearch:
			gates = []string{"sources_material_ready"}
		case StageSlideContent:
			gates = []string{"slide_content_ready"}
		case StageAssets:
			gates = []string{"assets_plan_ready"}
		default:
			gates = []string{"stage_outputs_ready"}
		}
	}
	return gates
}

func appendUnique(values []string, value string) []string {
	if value == "" || slices.Contains(values, value) {
		return values
	}
	return append(values, value)
}

func stringSlicesEqual(got, want []string) bool {
	if len(got) != len(want) {
		return false
	}
	for i := range want {
		if strings.TrimSpace(got[i]) != strings.TrimSpace(want[i]) {
			return false
		}
	}
	return true
}

func conditionMatched(condition string, run Run, safeRoot string) (bool, error) {
	switch condition {
	case "", "always":
		return true, nil
	case "svg_has_custom_path":
		matches, _ := filepath.Glob(filepath.Join(safeRoot, "slides", "*.svg"))
		for _, path := range matches {
			raw, err := os.ReadFile(path)
			if err != nil {
				return false, err
			}
			if strings.Contains(string(raw), `slide:shape-type="custom"`) {
				return true, nil
			}
		}
		return false, nil
	case "visual_type_chart":
		raw, err := readRunRegularArtifact(safeRoot, "content/slide_content.json")
		if err != nil {
			return false, nil
		}
		return strings.Contains(string(raw), `"type":"chart"`) || strings.Contains(string(raw), `"type": "chart"`), nil
	case "input_is_pptx":
		if run.RouteProfile != routeProfileImportedPPTX {
			return false, nil
		}
		return strings.EqualFold(filepath.Ext(run.Intent.Input), ".pptx") || strings.EqualFold(filepath.Ext(run.Input), ".pptx"), nil
	case "template_requested":
		if run.RouteProfile != routeProfileTemplateReference {
			return false, nil
		}
		raw, err := readRunRegularArtifact(safeRoot, "request/request.json")
		if err != nil {
			return false, nil
		}
		return strings.Contains(string(raw), `"template":true`) ||
			strings.Contains(string(raw), `"template": true`) ||
			strings.Contains(string(raw), `"template_requested":true`) ||
			strings.Contains(string(raw), `"template_requested": true`), nil
	case "outline_changed_after_initial_generation":
		return false, nil
	default:
		return false, nil
	}
}
