package svglide

import (
	"bytes"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/internal/vfs"
)

type InitOptions struct {
	Title        string
	Input        string
	Audience     string
	DeliveryMode string
	Pages        int
	Now          time.Time
	Overwrite    bool
}

func InitRun(root string, opts InitOptions) error {
	root = strings.TrimSpace(root)
	opts.Title = strings.TrimSpace(opts.Title)
	opts.Input = strings.TrimSpace(opts.Input)
	if root == "" {
		return fmt.Errorf("out path is required")
	}
	if opts.Title == "" {
		return fmt.Errorf("title is required")
	}
	if opts.Input == "" {
		return fmt.Errorf("input is required")
	}
	safeRoot, err := validate.SafeOutputPath(root)
	if err != nil {
		return err
	}
	if err := validateRunRoot(root, safeRoot); err != nil {
		return err
	}
	safeInput, err := validate.SafeInputPath(opts.Input)
	if err != nil {
		return err
	}
	if err := validateInputOutsideRunRoot(safeRoot, safeInput); err != nil {
		return err
	}
	opts.Input = safeInput

	if opts.Overwrite {
		return initOverwrite(safeRoot, opts)
	}

	return initNoReplace(safeRoot, opts)
}

func validateRunRoot(root string, safeRoot string) error {
	if filepath.Clean(root) == "." {
		return fmt.Errorf("out path must be a child directory, got %q", root)
	}
	cwd, err := vfs.Getwd()
	if err != nil {
		return fmt.Errorf("cannot determine working directory: %w", err)
	}
	canonicalCwd, err := vfs.EvalSymlinks(cwd)
	if err != nil {
		return fmt.Errorf("cannot resolve working directory: %w", err)
	}
	if filepath.Clean(safeRoot) == filepath.Clean(canonicalCwd) {
		return fmt.Errorf("out path must be a child directory, got %q", root)
	}
	return nil
}

func validateInputOutsideRunRoot(safeRoot string, safeInput string) error {
	root := filepath.Clean(safeRoot)
	input := filepath.Clean(safeInput)
	rel, err := filepath.Rel(root, input)
	if err != nil {
		return fmt.Errorf("cannot compare input and output paths: %w", err)
	}
	if rel == "." || (rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))) {
		return fmt.Errorf("input path %q must be outside output run directory %q", safeInput, safeRoot)
	}
	return nil
}

func initNoReplace(safeRoot string, opts InitOptions) error {
	if err := vfs.MkdirAll(filepath.Dir(safeRoot), 0o755); err != nil {
		return err
	}
	if err := vfs.Mkdir(safeRoot, 0o755); err != nil {
		return fmt.Errorf("%s already exists or cannot be created; refusing to overwrite: %w", safeRoot, err)
	}
	return writeClaimedRunDirectory(safeRoot, opts)
}

func initOverwrite(safeRoot string, opts InitOptions) error {
	if err := vfs.RemoveAll(safeRoot); err != nil {
		return err
	}
	if err := vfs.MkdirAll(filepath.Dir(safeRoot), 0o755); err != nil {
		return err
	}
	if err := vfs.Mkdir(safeRoot, 0o755); err != nil {
		return err
	}
	return writeClaimedRunDirectory(safeRoot, opts)
}

func writeClaimedRunDirectory(safeRoot string, opts InitOptions) error {
	cleanup := true
	defer func() {
		if cleanup {
			_ = vfs.RemoveAll(safeRoot)
		}
	}()
	if err := writeRunDirectory(safeRoot, safeRoot, opts); err != nil {
		return err
	}
	cleanup = false
	return nil
}

func writeRunDirectory(writeRoot string, runRoot string, opts InitOptions) error {
	for _, dir := range []string{
		"request",
		"research",
		"brief",
		"outline",
		"content",
		"assets/images",
		"assets/charts",
		"slides",
		"prompts",
		"schemas",
		"receipts",
	} {
		if err := vfs.MkdirAll(filepath.Join(writeRoot, dir), 0o755); err != nil {
			return err
		}
	}
	run := NewRun(NewRunConfig{
		Title:        opts.Title,
		Input:        opts.Input,
		Audience:     opts.Audience,
		DeliveryMode: opts.DeliveryMode,
		Pages:        opts.Pages,
		Out:          runRoot,
		Now:          opts.Now,
	})
	run.Policy.Overwrite = opts.Overwrite
	if err := writeJSON(filepath.Join(writeRoot, "run.json"), run); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(writeRoot, "request", "request.json"), map[string]any{
		"title":         opts.Title,
		"input":         opts.Input,
		"audience":      opts.Audience,
		"delivery_mode": opts.DeliveryMode,
		"pages":         opts.Pages,
	}); err != nil {
		return err
	}
	if err := writeJSON(filepath.Join(writeRoot, "request", "source_manifest.json"), map[string]any{
		"sources": []map[string]string{{"path": opts.Input, "type": "local"}},
	}); err != nil {
		return err
	}
	return writeStaticFiles(writeRoot)
}

func writeStaticFiles(root string) error {
	if err := writeText(filepath.Join(root, "README.md"), renderRunREADME()); err != nil {
		return err
	}
	for _, prompt := range DefaultPromptFiles() {
		if err := writeText(filepath.Join(root, "prompts", prompt.Name), prompt.Content); err != nil {
			return err
		}
	}
	for name, schema := range DefaultSchemas() {
		if err := writeText(filepath.Join(root, "schemas", name), schema); err != nil {
			return err
		}
	}
	return nil
}

func renderRunREADME() string {
	var b bytes.Buffer
	b.WriteString("# SVGlide Local Run\n\n")
	b.WriteString("This directory is a local Codex-mediated SVG slides runtime. It does not publish to Feishu Slides.\n")
	return b.String()
}
