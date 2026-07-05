package svglide

import (
	"path/filepath"
	"strings"
)

const anyGenPromptRoot = "skills/lark-slides/references/anygen-svg"
const anyGenSourceFull = "docs/vendor/anygen-svg/source.full.md"

type PromptManifest struct {
	Source  string                `json:"source"`
	Runtime string                `json:"runtime"`
	Entries []PromptManifestEntry `json:"entries"`
}

type PromptManifestEntry struct {
	Name           string   `json:"name"`
	ID             string   `json:"id,omitempty"`
	Path           string   `json:"path"`
	SHA256         string   `json:"sha256,omitempty"`
	Stage          string   `json:"stage,omitempty"`
	Always         bool     `json:"always,omitempty"`
	Role           string   `json:"role,omitempty"`
	OrchestratedBy string   `json:"orchestrated_by,omitempty"`
	Invocation     string   `json:"invocation,omitempty"`
	Order          int      `json:"order,omitempty"`
	Cardinality    string   `json:"cardinality,omitempty"`
	Requires       []string `json:"requires,omitempty"`
	Condition      string   `json:"condition,omitempty"`
	Trigger        []string `json:"trigger,omitempty"`
	Consumes       []string `json:"consumes,omitempty"`
	Produces       []string `json:"produces,omitempty"`
	CompletionGate []string `json:"completion_gate,omitempty"`
	PhaseAnchors   []string `json:"phase_anchors,omitempty"`
	Profiles       []string `json:"profiles,omitempty"`
	Exposure       string   `json:"exposure,omitempty"`
}

func DefaultPromptManifest() PromptManifest {
	return PromptManifest{
		Source:  anyGenPromptRoot,
		Runtime: "agent",
		Entries: []PromptManifestEntry{
			sourceSnapshotEntry("anygen_source_full", anyGenSourceFull),
			referenceEntry("anygen_svg_readme", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "README.md")), "reference_index"),
			referenceEntry("mode_system_prompt_svg", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "mode_system_prompt_svg.md")), "orchestrator"),
			referenceEntry("svg_reference", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "svg_reference.md")), "protocol_reference"),
			referenceEntry("anygen_semantic_contract", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "semantic_contract.md")), "semantic_contract"),
			referenceEntry("svglide_local_runtime_binding", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "svglide_local_runtime_binding.md")), "runtime_binding"),
			referenceEntry("svglide_visual_quality_overlay", filepath.ToSlash(filepath.Join(anyGenPromptRoot, "svglide_visual_quality_overlay.md")), "runtime_binding"),
			toolEntry("resolve_design_brief", "resolve_design_brief", StageDesignBrief, 1, "once", "always", []string{"request/request.json", "research/research_notes.md"}, []string{"brief/design_brief.json", "brief/visual_system.json", "brief/typography_contract.json"}, []string{"design_brief_resolved", "typography_contract_resolved"}),
			toolEntry("slide_outline", "slide_outline", StageOutline, 2, "once", "always", []string{"brief/design_brief.json", "brief/visual_system.json", "brief/typography_contract.json"}, []string{"outline/deck.json"}, []string{"deck_outline_valid"}),
			toolEntry("activate_slides_edit", "activate_slides_edit", StageSVGAuthor, 3, "once", "always", []string{"outline/deck.json"}, []string{"receipts/tool_calls/svg_author/activate_slides_edit.json"}, []string{"slide_edit_activated"}),
			toolEntry("slides_edit", "slides_edit", StageSVGAuthor, 4, "once_or_more", "always", []string{"outline/deck.json", "content/slide_content.json", "brief/visual_system.json", "brief/typography_contract.json", "assets/assets_manifest.json", "assets/charts/chart_manifest.json"}, []string{"slides/*.svg"}, []string{"svg_protocol_valid", "slide_matches_outline_content_assets"}),
			toolEntry("finish_slides_edit", "finish_slides_edit", StageValidatePreviewRepair, 5, "once", "always", []string{"slides/*.svg"}, []string{"receipts/lint.json", "receipts/preview.json", "receipts/rendered_visual.json", "quality_report.json", "anygen_semantic_report.json", "visual_receipts.json", "creative_quality_report.json"}, []string{"validate_preview_rendered_visual_quality_semantic_creative_passed"}),
			conditionalToolEntry("slide_organize", "slide_organize", StageOutline, 6, "zero_or_more", "outline_changed_after_initial_generation", []string{"outline/deck.json"}, []string{"outline/deck.json"}, []string{"outline_structure_updated"}),
			conditionalToolEntry("compute_custom_shape_bbox", "compute_custom_shape_bbox", StageSVGAuthor, 7, "zero_or_more", "svg_has_custom_path", []string{"slides/*.svg"}, []string{"receipts/tool_calls/svg_author/compute_custom_shape_bbox.json"}, []string{"custom_shape_bbox_resolved"}),
			conditionalToolEntry("generate_vega_lite_chart", "generate_vega_lite_chart", StageAssets, 8, "zero_or_more", "required_chart_renderer_vega_lite", []string{"content/slide_content.json", "research/sources.json", "assets/assets_manifest.json"}, []string{"assets/charts/chart_manifest.json", "assets/charts/*.svg", "assets/charts/specs/*.vl.json"}, []string{"vega_lite_chart_assets_planned"}),
			conditionalToolEntry("generate_svg_chart", "generate_svg_chart", StageAssets, 9, "zero_or_more", "visual_type_chart_without_vega_lite_requirement", []string{"content/slide_content.json", "assets/assets_manifest.json"}, []string{"assets/assets_manifest.json", "assets/charts/chart_manifest.json"}, []string{"chart_assets_planned"}),
			legacyConditionalToolEntry("slides_convert", "slides_convert", StageResearch, 10, "zero_or_more", "input_is_pptx", []string{"request/source_manifest.json"}, []string{"research/sources.json"}, []string{"slides_converted"}, []string{routeProfileImportedPPTX}),
			legacyConditionalToolEntry("slides_parse_template", "slides_parse_template", StageAssets, 11, "zero_or_more", "template_requested", []string{"request/request.json"}, []string{"assets/assets_manifest.json"}, []string{"template_parsed"}, []string{routeProfileTemplateReference}),
		},
	}
}

func referenceEntry(id, path, role string) PromptManifestEntry {
	return PromptManifestEntry{Name: id, ID: id, Path: path, Always: true, Role: role, Invocation: "reference", Profiles: runtimeProfiles(), Exposure: "runtime"}
}

func sourceSnapshotEntry(id, path string) PromptManifestEntry {
	entry := referenceEntry(id, path, "source_snapshot")
	entry.Always = false
	entry.Exposure = "audit"
	return entry
}

func toolEntry(name, file string, stage string, order int, cardinality, condition string, consumes, produces, gate []string) PromptManifestEntry {
	return PromptManifestEntry{
		Name:           name,
		ID:             name,
		Path:           filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", file+".md")),
		Stage:          stage,
		Role:           "tool_prompt",
		OrchestratedBy: "mode_system_prompt_svg",
		Invocation:     "required",
		Order:          order,
		Cardinality:    cardinality,
		Requires:       []string{"mode_system_prompt_svg", "svg_reference"},
		Condition:      condition,
		Trigger:        []string{"initial_deck_generation"},
		Consumes:       consumes,
		Produces:       produces,
		CompletionGate: gate,
		Profiles:       runtimeProfiles(),
		Exposure:       "runtime",
	}
}

func conditionalToolEntry(name, file string, stage string, order int, cardinality, condition string, consumes, produces, gate []string) PromptManifestEntry {
	entry := toolEntry(name, file, stage, order, cardinality, condition, consumes, produces, gate)
	entry.Invocation = "conditional"
	entry.Trigger = []string{condition}
	return entry
}

func legacyConditionalToolEntry(name, file string, stage string, order int, cardinality, condition string, consumes, produces, gate []string, profiles []string) PromptManifestEntry {
	entry := conditionalToolEntry(name, file, stage, order, cardinality, condition, consumes, produces, gate)
	entry.Profiles = profiles
	entry.Exposure = "legacy"
	return entry
}

func runtimeProfiles() []string {
	return []string{RouteProfileLocalSVGDeck, routeProfileImportedPPTX, routeProfileTemplateReference}
}

func ResolvedPromptManifest() (PromptManifest, error) {
	assets, err := LoadAnyGenPromptAssets()
	if err != nil {
		return PromptManifest{}, err
	}
	entries := make([]PromptManifestEntry, 0, len(assets))
	for _, asset := range assets {
		entries = append(entries, PromptManifestEntry{
			Name:           asset.ID,
			ID:             asset.ID,
			Path:           asset.Path,
			SHA256:         asset.SHA256,
			Stage:          asset.Stage,
			Always:         asset.Role == "reference_index" || asset.Role == "semantic_contract" || asset.Role == "orchestrator" || asset.Role == "protocol_reference" || asset.Role == "runtime_binding",
			Role:           asset.Role,
			OrchestratedBy: asset.OrchestratedBy,
			Invocation:     asset.Invocation,
			Order:          asset.Order,
			Cardinality:    asset.Cardinality,
			Requires:       asset.Requires,
			Condition:      asset.Condition,
			Trigger:        asset.Trigger,
			Consumes:       asset.Consumes,
			Produces:       asset.Produces,
			CompletionGate: asset.CompletionGate,
			PhaseAnchors:   asset.PhaseAnchors,
			Profiles:       asset.Profiles,
			Exposure:       asset.Exposure,
		})
	}
	return PromptManifest{Source: anyGenPromptRoot, Runtime: "agent", Entries: entries}, nil
}

func PromptPathsForStage(stage string) ([]string, error) {
	return PromptPathsForStageForProfile(RouteProfileLocalSVGDeck, stage)
}

func PromptPathsForStageForProfile(profile string, stage string) ([]string, error) {
	manifest, err := ResolvedPromptManifest()
	if err != nil {
		return nil, err
	}
	paths := make([]string, 0, len(manifest.Entries))
	for _, entry := range manifest.Entries {
		if !promptAssetAllowedForProfile(entry.Profiles, profile) {
			continue
		}
		if entry.Always || entry.Stage == stage {
			paths = append(paths, entry.Path)
		}
	}
	return paths, nil
}

func promptAssetAllowedForProfile(profiles []string, profile string) bool {
	if strings.TrimSpace(profile) == "" {
		profile = RouteProfileLocalSVGDeck
	}
	if len(profiles) == 0 {
		return true
	}
	for _, candidate := range profiles {
		if candidate == profile {
			return true
		}
	}
	return false
}

func writePromptManifest(root string) error {
	manifest, err := ResolvedPromptManifest()
	if err != nil {
		return err
	}
	return writeJSON(filepath.Join(root, "prompt_manifest.json"), manifest)
}
