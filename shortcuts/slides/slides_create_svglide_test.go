// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/larksuite/cli/internal/cmdutil"
)

func TestSlidesCreateSVGlideInitShortcut(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "Demo",
		"--input", "source.md",
		"--audience", "产品负责人",
		"--delivery-mode", "self_read",
		"--pages", "8",
		"--out", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "run.json")); err != nil {
		t.Fatalf("missing run.json: %v", err)
	}
	data := decodeShortcutData(t, stdout)
	if data["action"] != "init" {
		t.Fatalf("action = %v, want init", data["action"])
	}
	if data["run"] != "run-demo" {
		t.Fatalf("run = %v, want run-demo", data["run"])
	}
	if !strings.Contains(stringValue(data["next_command"]), "--action next --run run-demo") {
		t.Fatalf("next_command = %v, want next action", data["next_command"])
	}
}

func TestSlidesCreateSVGlideRejectsPositionalAction(t *testing.T) {
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"init",
		"--as", "user",
	})
	if err == nil {
		t.Fatal("expected positional argument rejection")
	}
	if !strings.Contains(err.Error(), "positional arguments are not supported") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSlidesCreateSVGlideStatusAndNextActions(t *testing.T) {
	dir := initSVGlideShortcutRun(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "status",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	statusData := decodeShortcutData(t, stdout)
	if statusData["current_stage"] != "request" {
		t.Fatalf("current_stage = %v, want request", statusData["current_stage"])
	}
	if !strings.Contains(stringValue(statusData["next_command"]), "--action next --run run-demo") {
		t.Fatalf("next_command = %v, want next action", statusData["next_command"])
	}

	err = runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "next",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	nextData := decodeShortcutData(t, stdout)
	if nextData["stage"] != "request" || nextData["prompt_path"] != "prompts/01_request.task.md" {
		t.Fatalf("next data = %+v, want request prompt", nextData)
	}
	if _, err := os.Stat(filepath.Join(dir, "run-demo", "prompts", "01_request.task.md")); err != nil {
		t.Fatalf("missing prompt: %v", err)
	}
}

func TestSlidesCreateSVGlideValidateActionOutputsReport(t *testing.T) {
	initSVGlideShortcutRunWithDeck(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "validate",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["ok"] != true {
		t.Fatalf("ok = %v, want true; data=%+v", data["ok"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "receipts", "lint.json")); err != nil {
		t.Fatalf("missing lint receipt: %v", err)
	}
}

func TestSlidesCreateSVGlidePreviewActionOutputsReport(t *testing.T) {
	initSVGlideShortcutRunWithDeck(t)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "preview",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "passed" {
		t.Fatalf("status = %v, want passed; data=%+v", data["status"], data)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "preview.html")); err != nil {
		t.Fatalf("missing preview.html: %v", err)
	}
	if _, err := os.Stat(filepath.Join("run-demo", "receipts", "preview.json")); err != nil {
		t.Fatalf("missing preview receipt: %v", err)
	}
}

func TestSlidesCreateSVGlideValidateActionDoesNotErrorOnValidationFailure(t *testing.T) {
	initSVGlideShortcutRun(t)
	writeSVGlideShortcutDeck(t, "slides/missing.svg")
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "validate",
		"--run", "run-demo",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["ok"] != false {
		t.Fatalf("ok = %v, want false; data=%+v", data["ok"], data)
	}
}

func TestSlidesCreateSVGlideRegistered(t *testing.T) {
	for _, shortcut := range Shortcuts() {
		if shortcut.Command == "+create-svglide" {
			return
		}
	}
	t.Fatal("slides +create-svglide shortcut is not registered")
}

func initSVGlideShortcutRunWithDeck(t *testing.T) {
	initSVGlideShortcutRun(t)
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svglideShortcutVisibleTextSVG())
}

func initSVGlideShortcutRun(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))
	if err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "Demo",
		"--input", "source.md",
		"--out", "run-demo",
		"--as", "user",
	}); err != nil {
		t.Fatal(err)
	}
	return dir
}

func writeSVGlideShortcutDeck(t *testing.T, slidePath string) {
	t.Helper()
	deck := map[string]any{
		"title": "Demo",
		"slides": []map[string]string{{
			"id":          "cover",
			"title":       "Slide",
			"summary":     "Summary",
			"role":        "cover",
			"key_message": "Message",
			"path":        slidePath,
		}},
	}
	raw, err := json.MarshalIndent(deck, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	raw = append(raw, '\n')
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "outline", "deck.json"), string(raw))
}

func writeSVGlideShortcutFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func svglideShortcutVisibleTextSVG() string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/><text x="48" y="80">Hello</text></svg>`
}

func stringValue(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	var b bytes.Buffer
	_ = json.NewEncoder(&b).Encode(value)
	return strings.TrimSpace(b.String())
}
