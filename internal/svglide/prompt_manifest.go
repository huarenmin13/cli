package svglide

import "path/filepath"

const anyGenPromptRoot = "skills/lark-slides/references/anygen-svg"

type PromptManifest struct {
	Source  string                `json:"source"`
	Runtime string                `json:"runtime"`
	Entries []PromptManifestEntry `json:"entries"`
}

type PromptManifestEntry struct {
	Name   string `json:"name"`
	Path   string `json:"path"`
	Stage  string `json:"stage,omitempty"`
	Always bool   `json:"always,omitempty"`
}

func DefaultPromptManifest() PromptManifest {
	return PromptManifest{
		Source:  anyGenPromptRoot,
		Runtime: "codex",
		Entries: []PromptManifestEntry{
			{Name: "mode_system_prompt_svg", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "mode_system_prompt_svg.md")), Always: true},
			{Name: "svg_reference", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "svg_reference.md")), Always: true},
			{Name: "resolve_design_brief", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "resolve_design_brief.md")), Stage: StageDesignBrief},
			{Name: "slide_outline", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "slide_outline.md")), Stage: StageOutline},
			{Name: "slides_edit", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "slides_edit.md")), Stage: StageSVGAuthor},
			{Name: "finish_slides_edit", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "finish_slides_edit.md")), Stage: StageValidatePreviewRepair},
			{Name: "slide_organize", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "slide_organize.md")), Stage: StageOutline},
			{Name: "compute_custom_shape_bbox", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "compute_custom_shape_bbox.md")), Stage: StageSVGAuthor},
			{Name: "generate_svg_chart", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "generate_svg_chart.md")), Stage: StageAssets},
			{Name: "slides_convert", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "slides_convert.md"))},
			{Name: "slides_parse_template", Path: filepath.ToSlash(filepath.Join(anyGenPromptRoot, "tools", "slides_parse_template.md"))},
		},
	}
}

func PromptPathsForStage(stage string) []string {
	manifest := DefaultPromptManifest()
	paths := make([]string, 0, len(manifest.Entries))
	for _, entry := range manifest.Entries {
		if entry.Always || entry.Stage == stage {
			paths = append(paths, entry.Path)
		}
	}
	return paths
}

func writePromptManifest(root string) error {
	return writeJSON(filepath.Join(root, "prompt_manifest.json"), DefaultPromptManifest())
}
