package svglide

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestInitRunWritesDirectoryContract(t *testing.T) {
	cwd := t.TempDir()
	t.Chdir(cwd)
	canonicalCwd, err := filepath.EvalSymlinks(cwd)
	if err != nil {
		t.Fatal(err)
	}
	root := "demo"
	wantInput := filepath.Join(canonicalCwd, "source.md")
	err = InitRun(root, InitOptions{
		Title:        "Demo",
		Input:        "source.md",
		Audience:     "产品负责人",
		DeliveryMode: "self_read",
		Pages:        8,
		Now:          time.Date(2026, 7, 2, 20, 0, 0, 0, time.FixedZone("CST", 8*3600)),
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{
		"run.json",
		"README.md",
		"prompt_manifest.json",
		"request/request.json",
		"request/source_manifest.json",
		"research",
		"brief",
		"outline",
		"content",
		"schemas/request.schema.json",
		"schemas/deck.schema.json",
		"receipts",
		"slides",
		"assets/images",
	} {
		if _, err := os.Stat(filepath.Join(root, name)); err != nil {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
	raw, err := os.ReadFile(filepath.Join(root, "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		t.Fatal(err)
	}
	if run.Title != "Demo" || run.CurrentStage != StageRequest {
		t.Fatalf("unexpected run: %+v", run)
	}
	if run.Input != wantInput {
		t.Fatalf("run.Input = %q, want %q", run.Input, wantInput)
	}

	requestRaw, err := os.ReadFile(filepath.Join(root, "request", "request.json"))
	if err != nil {
		t.Fatal(err)
	}
	var request map[string]any
	if err := json.Unmarshal(requestRaw, &request); err != nil {
		t.Fatal(err)
	}
	if request["title"] != "Demo" || request["input"] != wantInput || request["audience"] != "产品负责人" || request["delivery_mode"] != "self_read" || request["pages"] != float64(8) {
		t.Fatalf("unexpected request.json: %+v", request)
	}

	manifestRaw, err := os.ReadFile(filepath.Join(root, "request", "source_manifest.json"))
	if err != nil {
		t.Fatal(err)
	}
	var manifest struct {
		Sources []struct {
			Path string `json:"path"`
			Type string `json:"type"`
		} `json:"sources"`
	}
	if err := json.Unmarshal(manifestRaw, &manifest); err != nil {
		t.Fatal(err)
	}
	if len(manifest.Sources) != 1 || manifest.Sources[0].Path != wantInput || manifest.Sources[0].Type != "local" {
		t.Fatalf("unexpected source_manifest.json: %+v", manifest)
	}

	if _, err := os.Stat(filepath.Join(root, "prompts")); !os.IsNotExist(err) {
		t.Fatalf("prompts directory should not be generated per run, stat err = %v", err)
	}

	promptRaw, err := os.ReadFile(filepath.Join(root, "prompt_manifest.json"))
	if err != nil {
		t.Fatal(err)
	}
	prompt := string(promptRaw)
	for _, want := range []string{"mode_system_prompt_svg", "svg_reference", "tools/slides_edit.md", "tools/generate_svg_chart.md"} {
		if !strings.Contains(prompt, want) {
			t.Fatalf("prompt manifest missing %q:\n%s", want, prompt)
		}
	}

	schemaRaw, err := os.ReadFile(filepath.Join(root, "schemas", "deck.schema.json"))
	if err != nil {
		t.Fatal(err)
	}
	var deckSchema map[string]any
	if err := json.Unmarshal(schemaRaw, &deckSchema); err != nil {
		t.Fatal(err)
	}
	if _, ok := deckSchema["properties"]; !ok || !strings.Contains(string(schemaRaw), "key_message") {
		t.Fatalf("deck schema missing properties/key_message: %s", string(schemaRaw))
	}
	if !strings.Contains(string(schemaRaw), `"minItems": 1`) || !strings.Contains(string(schemaRaw), `^slides/[^/]+\\.svg$`) {
		t.Fatalf("deck schema missing minItems/path pattern: %s", string(schemaRaw))
	}
	for _, name := range []string{
		"source_manifest.schema.json",
		"sources.schema.json",
		"slide_content.schema.json",
		"assets_plan.schema.json",
		"quality.schema.json",
		"receipt.schema.json",
		"lint.schema.json",
		"preview.schema.json",
	} {
		raw, err := os.ReadFile(filepath.Join(root, "schemas", name))
		if err != nil {
			t.Fatalf("missing schema %s: %v", name, err)
		}
		var schema map[string]any
		if err := json.Unmarshal(raw, &schema); err != nil {
			t.Fatalf("schema %s is not valid JSON: %v", name, err)
		}
		if schema["type"] == nil {
			t.Fatalf("schema %s missing type: %s", name, string(raw))
		}
	}
	for _, tc := range []struct {
		name string
		want []string
	}{
		{name: "request.schema.json", want: []string{`"purpose"`, `"language"`, `"visual_style_query"`}},
		{name: "design_brief.schema.json", want: []string{`"visual_system"`, `"narrative_spine"`, `"depth"`, `"tone"`}},
		{name: "deck.schema.json", want: []string{`"main_title"`, `"style_instruction"`, `"aesthetic_direction"`}},
		{name: "sources.schema.json", want: []string{`"retrieval"`}},
		{name: "slide_content.schema.json", want: []string{`"source_refs"`, `"visuals"`, `"chart"`, `"table"`, `"crop"`}},
		{name: "assets_plan.schema.json", want: []string{`"experiment_unrestricted_assets"`, `"slide_id"`, `"status"`, `"deferred"`, `"chart"`, `"table"`, `"crop"`}},
		{name: "quality.schema.json", want: []string{`"metrics"`}},
	} {
		raw, err := os.ReadFile(filepath.Join(root, "schemas", tc.name))
		if err != nil {
			t.Fatalf("missing schema %s: %v", tc.name, err)
		}
		text := string(raw)
		for _, want := range tc.want {
			if !strings.Contains(text, want) {
				t.Fatalf("schema %s missing %s: %s", tc.name, want, text)
			}
		}
	}
}

func TestInitRunRefusesExistingRunJSON(t *testing.T) {
	t.Chdir(t.TempDir())
	root := "demo"
	if err := os.MkdirAll(root, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "run.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	err := InitRun(root, InitOptions{Title: "Demo", Input: "source.md"})
	if err == nil {
		t.Fatal("expected overwrite refusal")
	}
}

func TestInitRunRefusesExistingRootWithoutRunJSON(t *testing.T) {
	t.Chdir(t.TempDir())
	root := "demo"
	if err := os.MkdirAll(root, 0o755); err != nil {
		t.Fatal(err)
	}
	wantREADME := "keep this readme\n"
	if err := os.WriteFile(filepath.Join(root, "README.md"), []byte(wantREADME), 0o644); err != nil {
		t.Fatal(err)
	}
	err := InitRun(root, InitOptions{Title: "Demo", Input: "source.md"})
	gotREADME, readErr := os.ReadFile(filepath.Join(root, "README.md"))
	if readErr != nil {
		t.Fatal(readErr)
	}
	if string(gotREADME) != wantREADME {
		t.Fatalf("README overwritten: got %q, want %q", string(gotREADME), wantREADME)
	}
	if err == nil {
		t.Fatal("expected existing root refusal")
	}
}

func TestInitRunOverwriteReplacesOldRunDirectory(t *testing.T) {
	t.Chdir(t.TempDir())
	root := "demo"
	if err := os.MkdirAll(filepath.Join(root, "slides"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "slides", "old.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	err := InitRun(root, InitOptions{Title: "Demo", Input: "source.md", Overwrite: true})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(root, "slides", "old.svg")); !os.IsNotExist(err) {
		t.Fatalf("old slide should be removed, stat err = %v", err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		t.Fatal(err)
	}
	if !run.Policy.Overwrite {
		t.Fatalf("Policy.Overwrite = false, want true: %+v", run.Policy)
	}
}

func TestInitRunRejectsOverlappingInputAndOutput(t *testing.T) {
	tests := []struct {
		name      string
		root      string
		input     string
		overwrite bool
	}{
		{name: "same path overwrite", root: "source.md", input: "source.md", overwrite: true},
		{name: "input under output overwrite", root: "demo", input: "demo/source.md", overwrite: true},
		{name: "input under output no overwrite", root: "demo", input: "demo/source.md", overwrite: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Chdir(t.TempDir())
			if err := os.MkdirAll(filepath.Dir(tt.input), 0o755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(tt.input, []byte("source"), 0o644); err != nil {
				t.Fatal(err)
			}

			err := InitRun(tt.root, InitOptions{Title: "Demo", Input: tt.input, Overwrite: tt.overwrite})
			if err == nil {
				t.Fatal("expected overlapping input/output refusal")
			}
			got, readErr := os.ReadFile(tt.input)
			if readErr != nil {
				t.Fatalf("source should remain readable: %v", readErr)
			}
			if string(got) != "source" {
				t.Fatalf("source content changed: got %q", string(got))
			}
		})
	}
}

func TestInitRunRejectsUnsafePaths(t *testing.T) {
	cwd := t.TempDir()
	t.Chdir(cwd)
	tests := []struct {
		name string
		root string
		opts InitOptions
	}{
		{name: "absolute root", root: filepath.Join(cwd, "demo"), opts: InitOptions{Title: "Demo", Input: "source.md"}},
		{name: "escaping root", root: "../escape", opts: InitOptions{Title: "Demo", Input: "source.md"}},
		{name: "escaping input", root: "demo", opts: InitOptions{Title: "Demo", Input: "../source.md"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := InitRun(tt.root, tt.opts); err == nil {
				t.Fatal("expected unsafe path refusal")
			}
		})
	}
}

func TestInitRunRejectsRootResolvingToCWDWhenOverwrite(t *testing.T) {
	for _, root := range []string{".", "./", "subdir/.."} {
		t.Run(root, func(t *testing.T) {
			cwd := t.TempDir()
			t.Chdir(cwd)
			markerPath := filepath.Join(cwd, "keep.txt")
			if err := os.WriteFile(markerPath, []byte("keep"), 0o644); err != nil {
				t.Fatal(err)
			}

			err := InitRun(root, InitOptions{Title: "Demo", Input: "source.md", Overwrite: true})
			if err == nil {
				t.Fatal("expected root resolving to CWD to be rejected")
			}
			got, readErr := os.ReadFile(markerPath)
			if readErr != nil {
				t.Fatalf("marker should remain readable: %v", readErr)
			}
			if string(got) != "keep" {
				t.Fatalf("marker content changed: got %q", string(got))
			}
		})
	}
}

func TestDefaultPromptManifestContracts(t *testing.T) {
	manifest := DefaultPromptManifest()
	if manifest.Source != anyGenPromptRoot {
		t.Fatalf("Source = %q, want %q", manifest.Source, anyGenPromptRoot)
	}
	if manifest.Runtime != "codex" {
		t.Fatalf("Runtime = %q, want codex", manifest.Runtime)
	}
	entries := map[string]PromptManifestEntry{}
	for _, entry := range manifest.Entries {
		entries[entry.Name] = entry
	}
	for _, want := range []string{"mode_system_prompt_svg", "svg_reference", "resolve_design_brief", "slide_outline", "slides_edit", "finish_slides_edit", "generate_svg_chart", "slides_convert", "slides_parse_template"} {
		if entries[want].Path == "" {
			t.Fatalf("manifest missing %q: %+v", want, manifest.Entries)
		}
	}
	if !entries["mode_system_prompt_svg"].Always || !entries["svg_reference"].Always {
		t.Fatalf("core prompt entries must be always available: %+v", manifest.Entries)
	}
	if entries["slides_edit"].Stage != StageSVGAuthor {
		t.Fatalf("slides_edit stage = %q, want %q", entries["slides_edit"].Stage, StageSVGAuthor)
	}
	if entries["generate_svg_chart"].Stage != StageAssets {
		t.Fatalf("generate_svg_chart stage = %q, want %q", entries["generate_svg_chart"].Stage, StageAssets)
	}
	paths := strings.Join(PromptPathsForStage(StageSVGAuthor), "\n")
	for _, want := range []string{"mode_system_prompt_svg.md", "svg_reference.md", "tools/slides_edit.md", "tools/compute_custom_shape_bbox.md"} {
		if !strings.Contains(paths, want) {
			t.Fatalf("SVG author prompt paths missing %q:\n%s", want, paths)
		}
	}
}

func TestInitRunRejectsBlankRequiredFields(t *testing.T) {
	blankRoot := "   "
	t.Chdir(t.TempDir())
	tests := []struct {
		name string
		root string
		opts InitOptions
	}{
		{name: "root", root: blankRoot, opts: InitOptions{Title: "Demo", Input: "source.md"}},
		{name: "title", root: "title", opts: InitOptions{Title: "  \t", Input: "source.md"}},
		{name: "input", root: "input", opts: InitOptions{Title: "Demo", Input: "  \t"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := InitRun(tt.root, tt.opts); err == nil {
				t.Fatal("expected blank field refusal")
			}
		})
	}
}
