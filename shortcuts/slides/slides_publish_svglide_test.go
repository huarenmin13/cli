// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/larksuite/cli/internal/cmdutil"
	"github.com/larksuite/cli/internal/httpmock"
	"github.com/larksuite/cli/internal/svglide"
)

func TestSlidesPublishSVGlideCreatesPresentationWithRawSVGContent(t *testing.T) {
	initSVGlidePublishShortcutSmokeRun(t, svglideShortcutVisibleTextSVG())
	f, stdout, _, reg := cmdutil.TestFactory(t, slidesTestConfig(t, ""))
	createStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations",
		Body: map[string]interface{}{
			"code": 0,
			"msg":  "ok",
			"data": map[string]interface{}{
				"xml_presentation_id": "pres_svg",
				"revision_id":         1,
				"url":                 "https://tenant.example.com/slides/pres_svg",
			},
		},
	}
	slideStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations/pres_svg/slide",
		Body: map[string]interface{}{
			"code": 0,
			"msg":  "ok",
			"data": map[string]interface{}{"slide_id": "slide_1", "revision_id": 2},
		},
	}
	reg.Register(createStub)
	reg.Register(slideStub)

	err := runSlidesShortcut(t, f, stdout, SlidesPublishSVGlide, []string{
		"+publish-svglide",
		"--run", "run-demo",
		"--allow-smoke-publish",
		"--as", "user",
	})
	if err != nil {
		t.Fatal(err)
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != "passed" || data["presentation_id"] != "pres_svg" || data["slide_count"] != float64(1) {
		t.Fatalf("publish data = %+v, want passed pres_svg one slide", data)
	}
	var body map[string]interface{}
	if err := json.Unmarshal(slideStub.CapturedBody, &body); err != nil {
		t.Fatal(err)
	}
	slide, _ := body["slide"].(map[string]interface{})
	content, _ := slide["content"].(string)
	if !strings.HasPrefix(strings.TrimSpace(content), "<svg ") {
		t.Fatalf("slide.content = %.80q, want raw SVG", content)
	}
	if strings.HasPrefix(strings.TrimSpace(content), "<slide ") || strings.Contains(content, "<presentation ") {
		t.Fatalf("slide.content must not be Slides XML/SXSD: %.120q", content)
	}
	raw, err := os.ReadFile(filepath.Join("run-demo", "publish", "request_evidence.json"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(raw), `"content_type": "svg"`) || !strings.Contains(string(raw), `"content_root": "svg"`) {
		t.Fatalf("request evidence does not prove SVG content: %s", string(raw))
	}
}

func TestSlidesCreateThenPublishSVGlideSmoke(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Online Smoke"), 0o644); err != nil {
		t.Fatal(err)
	}
	f, stdout, _, reg := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	if err := runSlidesShortcut(t, f, stdout, SlidesCreateSVGlide, []string{
		"+create-svglide",
		"--action", "init",
		"--title", "SVGlide Online Smoke",
		"--input", "source.md",
		"--delivery-target", "online_slide",
		"--smoke",
		"--out", "run-demo",
		"--as", "user",
	}); err != nil {
		t.Fatal(err)
	}
	initData := decodeShortcutData(t, stdout)
	if initData["delivery_target"] != svglide.DeliveryTargetOnlineSlide {
		t.Fatalf("delivery_target = %v, want online_slide", initData["delivery_target"])
	}
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svglideShortcutVisibleTextSVG())

	createStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations",
		Body: map[string]interface{}{
			"code": 0,
			"msg":  "ok",
			"data": map[string]interface{}{
				"xml_presentation_id": "pres_smoke",
				"revision_id":         1,
				"url":                 "https://tenant.example.com/slides/pres_smoke",
			},
		},
	}
	slideStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations/pres_smoke/slide",
		Body: map[string]interface{}{
			"code": 0,
			"msg":  "ok",
			"data": map[string]interface{}{"slide_id": "slide_1", "revision_id": 2},
		},
	}
	reg.Register(createStub)
	reg.Register(slideStub)

	if err := runSlidesShortcut(t, f, stdout, SlidesPublishSVGlide, []string{
		"+publish-svglide",
		"--run", "run-demo",
		"--allow-smoke-publish",
		"--as", "user",
	}); err != nil {
		t.Fatal(err)
	}
	publishData := decodeShortcutData(t, stdout)
	if publishData["status"] != "passed" || publishData["presentation_id"] != "pres_smoke" || publishData["slide_count"] != float64(1) {
		t.Fatalf("publish data = %+v, want passed pres_smoke one slide", publishData)
	}
	var body map[string]interface{}
	if err := json.Unmarshal(slideStub.CapturedBody, &body); err != nil {
		t.Fatal(err)
	}
	slide, _ := body["slide"].(map[string]interface{})
	content, _ := slide["content"].(string)
	if !strings.HasPrefix(strings.TrimSpace(content), "<svg ") {
		t.Fatalf("slide.content = %.80q, want raw SVG", content)
	}
	for _, path := range []string{
		filepath.Join("run-demo", "publish", "request_evidence.json"),
		filepath.Join("run-demo", "publish", "online_slide.json"),
		filepath.Join("run-demo", "receipts", "publish_online.json"),
	} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("missing publish artifact %s: %v", path, err)
		}
	}
}

func TestSlidesPublishSVGlideBlocksNonSVGBeforeCallingAPI(t *testing.T) {
	initSVGlidePublishShortcutSmokeRun(t, `<slide xmlns="http://www.larkoffice.com/sml/2.0"><data/></slide>`)
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesPublishSVGlide, []string{
		"+publish-svglide",
		"--run", "run-demo",
		"--allow-smoke-publish",
		"--as", "user",
	})
	if err == nil {
		t.Fatal("expected non-SVG payload to block before OpenAPI publish")
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != svglide.StatusBlocked || data["publisher"] != "svg_payload_gate" {
		t.Fatalf("publish data = %+v, want svg_payload_gate blocked", data)
	}
	raw, readErr := os.ReadFile(filepath.Join("run-demo", "publish", "request_evidence.json"))
	if readErr != nil {
		t.Fatal(readErr)
	}
	if !strings.Contains(string(raw), `"forbidden_format_detected": true`) {
		t.Fatalf("request evidence should mark forbidden format: %s", string(raw))
	}
}

func TestSlidesPublishSVGlideBlocksSmokeWithoutAllowFlag(t *testing.T) {
	initSVGlidePublishShortcutSmokeRun(t, svglideShortcutVisibleTextSVG())
	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))

	err := runSlidesShortcut(t, f, stdout, SlidesPublishSVGlide, []string{
		"+publish-svglide",
		"--run", "run-demo",
		"--as", "user",
	})
	if err == nil {
		t.Fatal("expected smoke publish to block without --allow-smoke-publish")
	}
	data := decodeShortcutData(t, stdout)
	if data["status"] != svglide.StatusBlocked || data["blocked_reason_code"] != "svglide.publish_online.smoke_publish_not_allowed" {
		t.Fatalf("publish data = %+v, want smoke_publish_not_allowed blocked", data)
	}
}

func TestSlidesPublishSVGlideRegistered(t *testing.T) {
	for _, shortcut := range Shortcuts() {
		if shortcut.Command == "+publish-svglide" {
			return
		}
	}
	t.Fatal("slides +publish-svglide shortcut is not registered")
}

func initSVGlidePublishShortcutSmokeRun(t *testing.T, svgContent string) {
	t.Helper()
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := svglide.InitRun("run-demo", svglide.InitOptions{
		Title:            "SVGlide Online Smoke",
		Input:            "source.md",
		DeliveryTarget:   svglide.DeliveryTargetOnlineSlide,
		ExecutionProfile: svglide.ExecutionProfileSmoke,
		Now:              time.Date(2026, 7, 7, 20, 0, 0, 0, time.UTC),
	}); err != nil {
		t.Fatal(err)
	}
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svgContent)
}

func initSVGlidePublishShortcutRun(t *testing.T, svgContent string) {
	t.Helper()
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	if err := os.WriteFile("source.md", []byte("# Demo"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := svglide.InitRun("run-demo", svglide.InitOptions{
		Title:          "SVGlide Online Demo",
		Input:          "source.md",
		DeliveryTarget: svglide.DeliveryTargetOnlineSlide,
		Now:            time.Date(2026, 7, 7, 20, 0, 0, 0, time.UTC),
	}); err != nil {
		t.Fatal(err)
	}
	writeSVGlideShortcutDeck(t, "slides/01.svg")
	writeSVGlideShortcutFile(t, filepath.Join("run-demo", "slides", "01.svg"), svgContent)
}
