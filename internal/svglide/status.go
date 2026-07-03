package svglide

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"

	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/internal/vfs"
)

type StatusReport struct {
	CurrentStage   string   `json:"current_stage"`
	MissingInputs  []string `json:"missing_inputs"`
	MissingOutputs []string `json:"missing_outputs"`
	NextCommand    string   `json:"next_command"`
}

type NextTaskReport struct {
	Stage          string   `json:"stage"`
	PromptPath     string   `json:"prompt_path,omitempty"`
	PromptPaths    []string `json:"prompt_paths"`
	AdapterPaths   []string `json:"adapter_paths"`
	PromptManifest string   `json:"prompt_manifest"`
	Inputs         []string `json:"inputs"`
	Outputs        []string `json:"outputs"`
}

const createSVGlideAdapterPath = "skills/lark-slides/references/lark-slides-create-svglide.md"

func ReadRun(root string) (Run, error) {
	safeRoot, err := validate.SafeInputPath(root)
	if err != nil {
		return Run{}, err
	}
	return readRunFile(safeRoot)
}

func InspectStatus(root string) (StatusReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return StatusReport{}, err
	}
	stage, err := currentStage(run)
	if err != nil {
		return StatusReport{}, err
	}
	missingInputs, err := missingRunPaths(safeRoot, stage.Inputs)
	if err != nil {
		return StatusReport{}, err
	}
	missingOutputs, err := missingRunPaths(safeRoot, stage.Outputs)
	if err != nil {
		return StatusReport{}, err
	}
	return StatusReport{
		CurrentStage:   stage.Name,
		MissingInputs:  missingInputs,
		MissingOutputs: missingOutputs,
		NextCommand:    fmt.Sprintf("lark-cli slides +create-svglide --action next --run %s", shellQuote(root)),
	}, nil
}

func NextTask(root string) (NextTaskReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return NextTaskReport{}, err
	}
	stage, err := currentStage(run)
	if err != nil {
		return NextTaskReport{}, err
	}
	missingInputs, err := missingRunPaths(safeRoot, stage.Inputs)
	if err != nil {
		return NextTaskReport{}, err
	}
	if len(missingInputs) > 0 {
		return NextTaskReport{}, fmt.Errorf("current stage %q missing inputs: %s", stage.Name, strings.Join(missingInputs, ", "))
	}
	inputs, err := validateRunPaths(safeRoot, stage.Inputs)
	if err != nil {
		return NextTaskReport{}, err
	}
	outputs, err := validateRunPaths(safeRoot, stage.Outputs)
	if err != nil {
		return NextTaskReport{}, err
	}
	return NextTaskReport{
		Stage:          stage.Name,
		PromptPaths:    PromptPathsForStage(stage.Name),
		AdapterPaths:   []string{createSVGlideAdapterPath},
		PromptManifest: "prompt_manifest.json",
		Inputs:         inputs,
		Outputs:        outputs,
	}, nil
}

func readRun(root string) (string, Run, error) {
	safeRoot, err := validate.SafeInputPath(root)
	if err != nil {
		return "", Run{}, err
	}
	run, err := readRunFile(safeRoot)
	if err != nil {
		return "", Run{}, err
	}
	return safeRoot, run, nil
}

func readRunFile(safeRoot string) (Run, error) {
	raw, err := vfs.ReadFile(filepath.Join(safeRoot, "run.json"))
	if err != nil {
		return Run{}, err
	}
	var run Run
	if err := json.Unmarshal(raw, &run); err != nil {
		return Run{}, fmt.Errorf("read run.json: %w", err)
	}
	return run, nil
}

func currentStage(run Run) (Stage, error) {
	for _, stage := range run.Stages {
		if stage.Name == run.CurrentStage {
			return stage, nil
		}
	}
	return Stage{}, fmt.Errorf("current stage %q not found in run", run.CurrentStage)
}

func missingRunPaths(safeRoot string, rels []string) ([]string, error) {
	var missing []string
	for _, rel := range rels {
		if hasGlobMeta(rel) {
			exists, err := runGlobExists(safeRoot, rel)
			if err != nil {
				return nil, err
			}
			if !exists {
				missing = append(missing, rel)
			}
			continue
		}
		exists, err := runRegularFileExists(safeRoot, rel)
		if err != nil {
			return nil, fmt.Errorf("lstat run path %q: %w", rel, err)
		}
		if !exists {
			missing = append(missing, rel)
		}
	}
	return missing, nil
}

func validateRunPaths(safeRoot string, rels []string) ([]string, error) {
	paths := make([]string, 0, len(rels))
	for _, rel := range rels {
		if hasGlobMeta(rel) {
			if _, _, _, err := validateRunGlobPattern(safeRoot, rel); err != nil {
				return nil, err
			}
		} else {
			if _, err := safeRunPath(safeRoot, rel); err != nil {
				return nil, err
			}
		}
		paths = append(paths, rel)
	}
	return paths, nil
}

func runGlobExists(safeRoot, rel string) (bool, error) {
	dirRel, pattern, dirPath, err := validateRunGlobPattern(safeRoot, rel)
	if err != nil {
		return false, err
	}
	dirPath, exists, err := runDirectoryExists(safeRoot, dirRel)
	if err != nil {
		return false, fmt.Errorf("lstat glob directory for %q: %w", rel, err)
	}
	if !exists {
		return false, nil
	}
	entries, err := vfs.ReadDir(dirPath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return false, nil
		}
		return false, fmt.Errorf("read glob directory for %q: %w", rel, err)
	}
	for _, entry := range entries {
		matched, err := filepath.Match(pattern, entry.Name())
		if err != nil {
			return false, fmt.Errorf("invalid glob pattern %q: %w", rel, err)
		}
		if !matched {
			continue
		}
		matchRel := filepath.Join(dirRel, entry.Name())
		exists, err := runRegularFileExists(safeRoot, matchRel)
		if err != nil {
			return false, fmt.Errorf("lstat glob match %q: %w", matchRel, err)
		}
		if exists {
			return true, nil
		}
	}
	return false, nil
}

func validateRunGlobPattern(safeRoot, rel string) (string, string, string, error) {
	if strings.TrimSpace(rel) == "" {
		return "", "", "", fmt.Errorf("run path must not be empty")
	}
	if isAbsoluteRunPath(rel) {
		return "", "", "", fmt.Errorf("run path %q must be relative to run root", rel)
	}
	cleanRel := filepath.Clean(rel)
	dirRel, pattern := filepath.Split(cleanRel)
	dirRel = strings.TrimSuffix(dirRel, string(filepath.Separator))
	if pattern == "" {
		return "", "", "", fmt.Errorf("glob path %q is missing a file pattern", rel)
	}
	if _, err := filepath.Match(pattern, ""); err != nil {
		return "", "", "", fmt.Errorf("invalid glob pattern %q: %w", rel, err)
	}
	if dirRel == "" {
		dirRel = "."
	}
	if hasGlobMeta(dirRel) {
		return "", "", "", fmt.Errorf("glob path %q is only supported in the file name", rel)
	}
	dirPath, err := safeRunPath(safeRoot, dirRel)
	if err != nil {
		return "", "", "", err
	}
	return dirRel, pattern, dirPath, nil
}

func runDirectoryExists(safeRoot, rel string) (string, bool, error) {
	info, path, exists, err := lstatRunPath(safeRoot, rel)
	if err != nil {
		return path, false, err
	}
	if !exists {
		return path, false, nil
	}
	if !info.IsDir() {
		return path, false, fmt.Errorf("run path %q is not a directory", rel)
	}
	return path, true, nil
}

func runRegularFileExists(safeRoot, rel string) (bool, error) {
	info, _, exists, err := lstatRunPath(safeRoot, rel)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, nil
	}
	return info.Mode().IsRegular(), nil
}

func lstatRunPath(safeRoot, rel string) (fs.FileInfo, string, bool, error) {
	path, err := safeRunPath(safeRoot, rel)
	if err != nil {
		return nil, "", false, err
	}
	cleanRel := filepath.Clean(rel)
	if cleanRel == "." {
		info, err := vfs.Lstat(path)
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return nil, path, false, nil
			}
			return nil, path, false, err
		}
		if info.Mode()&fs.ModeSymlink != 0 {
			return nil, path, false, nil
		}
		return info, path, true, nil
	}
	parts := strings.Split(cleanRel, string(filepath.Separator))
	cur := safeRoot
	var info fs.FileInfo
	for i, part := range parts {
		if part == "" || part == "." {
			continue
		}
		cur = filepath.Join(cur, part)
		info, err = vfs.Lstat(cur)
		if err != nil {
			if errors.Is(err, fs.ErrNotExist) {
				return nil, path, false, nil
			}
			return nil, path, false, err
		}
		if info.Mode()&fs.ModeSymlink != 0 {
			return nil, path, false, nil
		}
		if i < len(parts)-1 && !info.IsDir() {
			return nil, path, false, fmt.Errorf("run path component %q is not a directory", filepath.Join(parts[:i+1]...))
		}
	}
	if info == nil {
		return nil, path, false, nil
	}
	return info, path, true, nil
}

func hasGlobMeta(path string) bool {
	return strings.ContainsAny(path, "*?[")
}

func safeRunPath(safeRoot, rel string) (string, error) {
	if strings.TrimSpace(rel) == "" {
		return "", fmt.Errorf("run path must not be empty")
	}
	if isAbsoluteRunPath(rel) {
		return "", fmt.Errorf("run path %q must be relative to run root", rel)
	}
	cleanRel := filepath.Clean(rel)
	path := filepath.Clean(filepath.Join(safeRoot, cleanRel))
	rootRel, err := filepath.Rel(safeRoot, path)
	if err != nil {
		return "", fmt.Errorf("cannot compare run path %q with run root: %w", rel, err)
	}
	if rootRel == ".." || strings.HasPrefix(rootRel, ".."+string(filepath.Separator)) || filepath.IsAbs(rootRel) {
		return "", fmt.Errorf("run path %q escapes run root", rel)
	}
	return path, nil
}

func isAbsoluteRunPath(path string) bool {
	path = strings.TrimSpace(path)
	if filepath.IsAbs(path) || strings.HasPrefix(path, "/") || strings.HasPrefix(path, `\`) {
		return true
	}
	if len(path) >= 3 && path[1] == ':' && (path[2] == '/' || path[2] == '\\') {
		drive := path[0]
		return ('A' <= drive && drive <= 'Z') || ('a' <= drive && drive <= 'z')
	}
	return false
}

func shellQuote(value string) string {
	if value == "" {
		return "''"
	}
	if isShellBareword(value) {
		return value
	}
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}

func isShellBareword(value string) bool {
	for _, r := range value {
		if ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') || ('0' <= r && r <= '9') {
			continue
		}
		if strings.ContainsRune("_@%+=:,./-", r) {
			continue
		}
		return false
	}
	return true
}
