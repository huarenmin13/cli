# Slides +create-svglide Implementation Plan

> Status: publish-layer implementation plan. The endpoint/body shape is confirmed by `docs/current/slide-engine-svg-content-handoff.md`: create an XML presentation, then add each page with raw SVG in `slide.content`. Live support still requires PPE/live smoke proof, response-field proof, and readback evidence before claiming end-to-end SVGlide publishing.

> Canvas decision: local SVG Slides artifacts use `viewBox="0 0 960 540"`, aligned with the existing Lark Slides canvas size while keeping SVG Slides as a separate `slide:*` SVG protocol. Preserve `source/full.debranded.md` as the original snapshot; generated bundles and publish fixtures follow the CLI 960x540 adaptation.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `slides +create-svglide`，发布已经由 SVG Slides 本地生成/校验层产出的 SVGlide manifest/page payload 到飞书/Lark Slides，边界与 `slides +create` 同构：只负责创建演示文稿、逐页提交 raw SVG、输出收据。

**Architecture:** `+create-svglide` 读取一个本地 manifest，按 manifest 顺序读取每页 SVGlide payload，复用现有 `+create` 的 presentation create、slide create、bot auto-grant 模式。它不生成内容、不做视觉预览/修复、不默认 readback、不把 PPE 路由写进命令语义；若后端不接受 SVGlide payload，功能必须失败并暴露后端错误，不允许自动降级为图片或普通 slide XML 生成器。

**Tech Stack:** Go shortcut framework (`shortcuts/common`), `errs` structured errors, `internal/validate.SafeInputPath`, `internal/vfs`, existing slides APIs `/open-apis/slides_ai/v1/xml_presentations` and `/open-apis/slides_ai/v1/xml_presentations/{id}/slide`, Go unit tests, CLI dry-run E2E, gated live E2E.

## Global Constraints

- 所有对用户可见的 shortcut error 必须返回 `errs.NewValidationError` / `errs.NewInternalError` / 现有 API error，不使用裸 `fmt.Errorf`。
- stdout 只输出 JSON envelope；上传进度写入 `runtime.IO().ErrOut`。
- 所有用户输入路径先过 `validate.SafeInputPath`；生产代码读文件使用 `internal/vfs.ReadFile`，不直接使用 `os.ReadFile`。
- `--manifest` 路径必须相对当前工作目录；manifest 内的 page 路径都相对 manifest 所在目录；manifest 子路径不得是绝对路径，不得包含 `..` 段。后续 Phase B 如果支持本地图片资源，也必须沿用同一相对路径规则。
- MVP 只支持 960x540，最多 10 页，和 `slides +create --slides` 的创建期批量追加边界保持一致。
- MVP-A 只证明不含外部图片资源的纯 SVG raw payload（shape/text/group/chart placeholder 等不依赖 FileMetaMap 的页面）发布。任何 `<image href="...">` / `<image xlink:href="...">` SVG 图片资源都属于 Phase B，必须等纯 SVG live proof 和 FileMetaMap 链路 proof 后再做。
- live smoke content 必须来自 SVG Slides 本地生成/校验层产出的 publish-ready bundle。不要在 live E2E 中手写临时 SVG，也不要用绕过 `validate_svg_deck.mjs` 的 fixture。
- `+create-svglide` 不负责 research、outline、content planning、SVG/SVGlide authoring、preview、visual lint、repair loop、readback 默认验收、PPE/Whistle 配置。
- 命令名固定为 `slides +create-svglide`；不新增 `+create-svg`。
- 不新增第三方依赖。

## Decisions Filled From `origin/feat-svglide-07`

These decisions are imported from the 07 branch's raw SVG publish guardrail. They do not add a new publish responsibility to `+create-svglide`; they only define what can be checked locally before the existing create/add-slide calls.

- Bundle integrity is mandatory: the manifest consumed by `+create-svglide` must declare `protocol == "svg-slides.v1"`, `publish_ready == true`, and `receipts.validate_svg_deck`; that receipt must exist and report `totalErrors == 0`.
- `pages[].sha256` is mandatory. `+create-svglide` must read each SVG file, compute sha256 immediately before building the request body, and require it to match the manifest entry. This prevents publishing files that changed after validation.
- `published` is not a precondition. The command must not block because `published` is `true` or `false`, and MVP-A must not write publish state back into the source manifest.
- SVG root validation must use `encoding/xml` to inspect the real root element. A substring check such as `strings.Contains("<svg")` is not acceptable.
- Each page payload must be raw SVG: root local name `svg`, SVG namespace `http://www.w3.org/2000/svg`, no `<slide>`, `<presentation>`, `<sxsd>`, `<document>`, HTML root/doctype, raster bytes, or `data:image` fallback.
- `slide.content` must be the raw SVG string. Do not wrap it in `<slide>`, do not CDATA-wrap it, and do not XML-escape the whole SVG payload.
- Dry-run must not print full SVG payloads. It must keep `slide.content` as a string placeholder and include `content_sha256`, `content_bytes`, and `content_omitted=true`.
- Page order is manifest order. If `pages[].index` is present, it must be `1..N` and match the manifest array order.
- Page id must be non-empty and unique. MVP-A does not require it to match the SVG root `id` or filename, but the output receipt must preserve a page-id to slide-id mapping.
- `--title` overrides manifest `title`; otherwise use manifest `title`; if both are empty use the same `Untitled` fallback as `+create`.
- Unknown manifest fields are ignored for forward compatibility. Required fields are `version`, `protocol`, `title`, `size`, `publish_ready`, `pages`, `receipts.validate_svg_deck`, and `pages[].sha256`.
- MVP-A rejects SVG image resource hrefs, not just local `@path` placeholders. `<image href>` / `<image xlink:href>` requires a Phase B FileMetaMap contract proof before the CLI may publish it. MVP-A must fail closed instead of passing unknown image resources through and implying they will render.
- Partial failure does not roll back a created presentation. The error hint must include presentation id, failed page ordinal, page id, and count of pages already added.

## Server Parser Findings For Phase B Images

These findings come from the SVGlide workspace docs and read-only source review of `slide` target branch `feat/svg-parser-module-to-master@20ca3cdf4d2dba71b821b349e60ba3498d3c474d`, plus the current `slide_engine` branch state. They update only the Phase B design boundary; MVP-A remains pure-SVG publishing.

- `slide` has SVG parser/server partial support, but it is not proven as `slide_engine -> slide` end-to-end SVG support. Current tests mostly prove parser units and wrapper forwarding; they do not prove full render/editability/readback.
- The image block parser consumes flat SVG such as `<image slide:role="image" href="...">`. The `href` value is a key into `svgParserContext.fileMetaMap`; missing image meta is a parser error for normal image blocks, while image page background degrades to non-rendering.
- `SVGService.GetClientVarsBySVG` accepts optional `FileMetaMap`. The server maps each FileMetaMap key to token/name/size/width/height/mimeType before invoking `BlockSVGParserService`.
- SXSD-named RPCs also carry optional `FileMetaMap`, because the legacy OpenAPI image path expects upstream service metadata for inserted media.
- Current `slide_engine` file-meta discovery scans SXSD/XML `//img/@src` and `//fillImg/@src`; it does not scan SVG `<image href>` or `<image xlink:href>`. Therefore Phase B is not solved by simply uploading an image and replacing SVG `href` with a token.
- The required Phase B proof is a real image/FileMetaMap bridge through the exact publish surface used by `+create-svglide`, followed by readback/render/editability evidence for an `image-crop-filemeta` fixture.

---

## File Structure

- Create `shortcuts/slides/slides_create_svglide_manifest.go`: manifest schema、路径解析、page payload 读取、publish spec 构建。
- Create `shortcuts/slides/slides_create_svglide.go`: shortcut 注册体、Validate、DryRun、Execute。
- Create `shortcuts/slides/slides_create_svglide_test.go`: unit tests covering parser、validation、dry-run、execute、partial failure hints。
- Modify `shortcuts/slides/shortcuts.go`: 注册 `SlidesCreateSVGlide`。
- Create `tests/cli_e2e/slides_create_svglide_dryrun_test.go`: CLI dry-run E2E。
- Create `tests/cli_e2e/slides_create_svglide_live_test.go`: gated live E2E，未配置真实凭证时跳过。
- Modify `skills/lark-slides/SKILL.md`: command 存在后加入入口说明。
- Create `skills/lark-slides/references/lark-slides-create-svglide.md`: 用户文档和 manifest 示例。
- Phase B only, after pure SVG live proof and FileMetaMap bridge proof: create `shortcuts/slides/slides_create_svglide_assets.go` for ordinary local SVG image href resolution, upload, FileMetaMap evidence, and backend contract integration. Do not implement `@path` placeholder replacement as the Phase B contract.

---

### Task 1: Manifest Schema And Path Reader

**Files:**
- Create: `shortcuts/slides/slides_create_svglide_manifest.go`
- Test: `shortcuts/slides/slides_create_svglide_test.go`

**Interfaces:**
- Consumes: `validate.SafeInputPath(path string) (string, error)`, `vfs.ReadFile(path string) ([]byte, error)`, `defaultPresentationWidth`, `defaultPresentationHeight`, `maxSlidesPerCreate`
- Produces:
  - `const svglideManifestVersion = "svglide.manifest.v1"`
  - `const svglideBundleProtocol = "svg-slides.v1"`
  - `type svglideManifest struct`
  - `type svglideManifestReceipts struct`
  - `type svglidePublishSpec struct`
  - `type svglidePublishPage struct`
  - `func prepareSVGlidePublishSpec(manifestPath string, overrideTitle string) (*svglidePublishSpec, error)`
  - `func validateSVGlideBundleReceipt(baseDir string, receipts svglideManifestReceipts) error`
  - `func validateSVGlidePagePayload(page svglideManifestPage, content []byte) error`
  - `func xmlRootName(raw []byte) (local string, namespace string, err error)`
  - `func sha256Hex(raw []byte) string`
  - `func rejectUnsupportedSVGlideImageResources(page svglideManifestPage, content string) error`

- [ ] **Step 1: Write failing manifest tests**

Add these tests to `shortcuts/slides/slides_create_svglide_test.go`:

Use a test helper for valid bundles so every fixture writes the same required fields: `version`, `protocol`, `title`, `size`, `publish_ready`, `published`, `pages[].id`, `pages[].index`, `pages[].file`, `pages[].sha256`, and `receipts.validate_svg_deck`. The helper must also write `receipts/validate_svg_deck.json` with `{"totalErrors":0}`. Validation-error cases should mutate one field at a time from that valid base so the expected failure is not hidden by an earlier missing-field error.

```go
func TestPrepareSVGlidePublishSpecReadsManifestAndPages(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	page := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="page-001" viewBox="0 0 960 540"><rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/></svg>`
	mustWriteFile(t, "pages/page-001.svg", page)
	mustWriteFile(t, "receipts/validate_svg_deck.json", `{"totalErrors":0}`)
	mustWriteFile(t, "manifest.json", fmt.Sprintf(`{
	  "version": "svglide.manifest.v1",
	  "protocol": "svg-slides.v1",
	  "title": "Manifest Title",
	  "size": {"width": 960, "height": 540},
	  "publish_ready": true,
	  "published": false,
	  "pages": [{"id": "page-001", "index": 1, "file": "pages/page-001.svg", "sha256": %q}],
	  "receipts": {"validate_svg_deck": "receipts/validate_svg_deck.json"}
	}`, sha256Hex([]byte(page))))

	spec, err := prepareSVGlidePublishSpec("manifest.json", "")
	if err != nil {
		t.Fatalf("prepareSVGlidePublishSpec() error = %v", err)
	}
	if spec.Title != "Manifest Title" {
		t.Fatalf("Title = %q, want Manifest Title", spec.Title)
	}
	if len(spec.Pages) != 1 {
		t.Fatalf("Pages len = %d, want 1", len(spec.Pages))
	}
	if spec.Pages[0].ID != "page-001" || spec.Pages[0].File != "pages/page-001.svg" {
		t.Fatalf("Page = %#v", spec.Pages[0])
	}
	if !strings.Contains(spec.Pages[0].Content, "<svg") {
		t.Fatalf("page content was not read: %q", spec.Pages[0].Content)
	}
}

func TestPrepareSVGlidePublishSpecTitleOverride(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	page := `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`
	mustWriteFile(t, "page.svg", page)
	mustWriteFile(t, "receipts/validate_svg_deck.json", `{"totalErrors":0}`)
	mustWriteFile(t, "manifest.json", fmt.Sprintf(`{
	  "version": "svglide.manifest.v1",
	  "protocol": "svg-slides.v1",
	  "title": "Manifest Title",
	  "size": {"width": 960, "height": 540},
	  "publish_ready": true,
	  "published": false,
	  "pages": [{"id": "p1", "index": 1, "file": "page.svg", "sha256": %q}],
	  "receipts": {"validate_svg_deck": "receipts/validate_svg_deck.json"}
	}`, sha256Hex([]byte(page))))

	spec, err := prepareSVGlidePublishSpec("manifest.json", "CLI Title")
	if err != nil {
		t.Fatalf("prepareSVGlidePublishSpec() error = %v", err)
	}
	if spec.Title != "CLI Title" {
		t.Fatalf("Title = %q, want CLI Title", spec.Title)
	}
}

func TestPrepareSVGlidePublishSpecValidationErrors(t *testing.T) {
	tests := []struct {
		name        string
		manifest    string
		pageFiles   map[string]string
		wantMessage string
	}{
		{
			name:        "wrong version",
			manifest:    `{"version":"wrong","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest version must be svglide.manifest.v1",
		},
		{
			name:        "wrong size",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":1920,"height":1080},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest size must be 960x540",
		},
		{
			name:        "no pages",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[]}`,
			pageFiles:   map[string]string{"receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest pages must contain 1 to 10 entries",
		},
		{
			name:        "unsafe child path",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"../page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest page file must be relative to the manifest directory and cannot contain '..': ../page.svg",
		},
		{
			name:        "duplicate page id",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"a.svg","sha256":"<valid-sha-a>"},{"id":"p1","index":2,"file":"b.svg","sha256":"<valid-sha-b>"}]}`,
			pageFiles:   map[string]string{"a.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "b.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest duplicate page id: p1",
		},
		{
			name:        "wrong protocol",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"wrong","title":"x","size":{"width":960,"height":540},"publish_ready":true,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest protocol must be svg-slides.v1",
		},
		{
			name:        "not publish ready",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest publish_ready must be true",
		},
		{
			name:        "validate receipt has errors",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":1}`},
			wantMessage: "--manifest validate_svg_deck receipt must have totalErrors=0",
		},
		{
			name:        "sha mismatch",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"bad"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest page file sha256 mismatch: page.svg",
		},
		{
			name:        "non svg root",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<slide xmlns="http://www.larkoffice.com/sml/2.0"></slide>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest page file must be raw SVG",
		},
		{
			name:        "svg image resource deferred",
			manifest:    `{"version":"svglide.manifest.v1","protocol":"svg-slides.v1","title":"x","size":{"width":960,"height":540},"publish_ready":true,"published":false,"receipts":{"validate_svg_deck":"receipts/validate_svg_deck.json"},"pages":[{"id":"p1","index":1,"file":"page.svg","sha256":"<valid-sha>"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><image href="assets/a.png"/></svg>`, "receipts/validate_svg_deck.json": `{"totalErrors":0}`},
			wantMessage: "--manifest page file uses SVG image resources, which require Phase B FileMetaMap proof: page.svg",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			withSlidesTestWorkingDir(t, dir)
			for path, body := range tt.pageFiles {
				mustWriteFile(t, path, body)
			}
			if body, ok := tt.pageFiles["page.svg"]; ok {
				tt.manifest = strings.ReplaceAll(tt.manifest, "<valid-sha>", sha256Hex([]byte(body)))
			}
			if body, ok := tt.pageFiles["a.svg"]; ok {
				tt.manifest = strings.ReplaceAll(tt.manifest, "<valid-sha-a>", sha256Hex([]byte(body)))
			}
			if body, ok := tt.pageFiles["b.svg"]; ok {
				tt.manifest = strings.ReplaceAll(tt.manifest, "<valid-sha-b>", sha256Hex([]byte(body)))
			}
			mustWriteFile(t, "manifest.json", tt.manifest)

			_, err := prepareSVGlidePublishSpec("manifest.json", "")
			if err == nil {
				t.Fatal("expected validation error")
			}
			if !strings.Contains(err.Error(), tt.wantMessage) {
				t.Fatalf("err = %v, want message containing %q", err, tt.wantMessage)
			}
		})
	}
}

func mustWriteFile(t *testing.T, path string, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
go test ./shortcuts/slides -run 'TestPrepareSVGlidePublishSpec' -count=1
```

Expected result:

```text
FAIL
undefined: prepareSVGlidePublishSpec
```

- [ ] **Step 3: Implement manifest reader**

Create `shortcuts/slides/slides_create_svglide_manifest.go` with:

```go
package slides

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"io"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/internal/vfs"
)

const (
	svglideManifestVersion = "svglide.manifest.v1"
	svglideBundleProtocol  = "svg-slides.v1"
	svglideSVGNamespace    = "http://www.w3.org/2000/svg"
)

var svglideUnsupportedImageHrefRegex = regexp.MustCompile(`(?is)<image\b[^>]*?\b(?:href|xlink:href)\s*=`)

type svglideManifest struct {
	Version      string                   `json:"version"`
	Protocol     string                   `json:"protocol"`
	Title        string                   `json:"title"`
	Size         svglideManifestSize      `json:"size"`
	PublishReady bool                     `json:"publish_ready"`
	Published    bool                     `json:"published"`
	Pages        []svglideManifestPage    `json:"pages"`
	Receipts     svglideManifestReceipts  `json:"receipts"`
}

type svglideManifestSize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type svglideManifestReceipts struct {
	ValidateSVGDeck string `json:"validate_svg_deck"`
}

type svglideManifestPage struct {
	ID     string `json:"id"`
	Index  int    `json:"index"`
	File   string `json:"file"`
	SHA256 string `json:"sha256"`
}

type svglidePublishSpec struct {
	ManifestPath string
	BaseDir      string
	Title        string
	Pages        []svglidePublishPage
}

type svglidePublishPage struct {
	ID           string
	Index        int
	File         string
	SHA256       string
	ContentBytes int
	Content      string
}

func prepareSVGlidePublishSpec(manifestPath string, overrideTitle string) (*svglidePublishSpec, error) {
	if strings.TrimSpace(manifestPath) == "" {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest is required").WithParam("--manifest")
	}
	safeManifestPath, err := validate.SafeInputPath(manifestPath)
	if err != nil {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest invalid path: %v", err).WithParam("--manifest")
	}
	raw, err := vfs.ReadFile(safeManifestPath)
	if err != nil {
		return nil, errs.NewValidationError(errs.SubtypeFileIO, "--manifest file not found: %s", manifestPath).WithParam("--manifest")
	}

	var manifest svglideManifest
	if err := json.Unmarshal(raw, &manifest); err != nil {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest invalid JSON: %v", err).WithParam("--manifest")
	}
	if manifest.Version != svglideManifestVersion {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest version must be %s", svglideManifestVersion).WithParam("--manifest")
	}
	if manifest.Protocol != svglideBundleProtocol {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest protocol must be %s", svglideBundleProtocol).WithParam("--manifest")
	}
	if !manifest.PublishReady {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest publish_ready must be true").WithParam("--manifest")
	}
	if manifest.Size.Width != defaultPresentationWidth || manifest.Size.Height != defaultPresentationHeight {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest size must be %dx%d", defaultPresentationWidth, defaultPresentationHeight).WithParam("--manifest")
	}
	if len(manifest.Pages) == 0 || len(manifest.Pages) > maxSlidesPerCreate {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest pages must contain 1 to %d entries", maxSlidesPerCreate).WithParam("--manifest")
	}

	baseDir := filepath.Dir(filepath.Clean(manifestPath))
	if baseDir == "." {
		baseDir = ""
	}
	if err := validateSVGlideBundleReceipt(baseDir, manifest.Receipts); err != nil {
		return nil, err
	}

	title := strings.TrimSpace(overrideTitle)
	if title == "" {
		title = effectiveTitle(strings.TrimSpace(manifest.Title))
	}

	seenIDs := map[string]bool{}
	pages := make([]svglidePublishPage, 0, len(manifest.Pages))
	for i, page := range manifest.Pages {
		id := strings.TrimSpace(page.ID)
		if id == "" {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page id is required").WithParam("--manifest")
		}
		if seenIDs[id] {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest duplicate page id: %s", id).WithParam("--manifest")
		}
		if page.Index != i+1 {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page index must be %d for page %s", i+1, id).WithParam("--manifest")
		}
		seenIDs[id] = true

		joined, err := svglideManifestChildPath("page file", baseDir, page.File)
		if err != nil {
			return nil, err
		}
		safePagePath, err := validate.SafeInputPath(joined)
		if err != nil {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file invalid path: %s", page.File).WithParam("--manifest")
		}
		content, err := vfs.ReadFile(safePagePath)
		if err != nil {
			return nil, errs.NewValidationError(errs.SubtypeFileIO, "--manifest page file not found: %s", page.File).WithParam("--manifest")
		}
		if err := validateSVGlidePagePayload(page, content); err != nil {
			return nil, err
		}
		pages = append(pages, svglidePublishPage{
			ID:           id,
			Index:        page.Index,
			File:         joined,
			SHA256:       page.SHA256,
			ContentBytes: len(content),
			Content:      string(content),
		})
	}

	return &svglidePublishSpec{
		ManifestPath: manifestPath,
		BaseDir:      baseDir,
		Title:        title,
		Pages:        pages,
	}, nil
}

type svglideValidateSVGDeckReceipt struct {
	TotalErrors *int `json:"totalErrors"`
}

func validateSVGlideBundleReceipt(baseDir string, receipts svglideManifestReceipts) error {
	receiptPath, err := svglideManifestChildPath("receipts.validate_svg_deck", baseDir, receipts.ValidateSVGDeck)
	if err != nil {
		return err
	}
	raw, err := vfs.ReadFile(receiptPath)
	if err != nil {
		return errs.NewValidationError(errs.SubtypeFileIO, "--manifest validate_svg_deck receipt not found: %s", receipts.ValidateSVGDeck).WithParam("--manifest")
	}
	var receipt svglideValidateSVGDeckReceipt
	if err := json.Unmarshal(raw, &receipt); err != nil {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest validate_svg_deck receipt invalid JSON: %v", err).WithParam("--manifest")
	}
	if receipt.TotalErrors == nil || *receipt.TotalErrors != 0 {
		return errs.NewValidationError(errs.SubtypeFailedPrecondition, "--manifest validate_svg_deck receipt must have totalErrors=0").WithParam("--manifest")
	}
	return nil
}

func validateSVGlidePagePayload(page svglideManifestPage, content []byte) error {
	wantSHA := strings.TrimSpace(page.SHA256)
	if wantSHA == "" {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page sha256 is required: %s", page.File).WithParam("--manifest")
	}
	if gotSHA := sha256Hex(content); gotSHA != wantSHA {
		return errs.NewValidationError(errs.SubtypeFailedPrecondition, "--manifest page file sha256 mismatch: %s", page.File).WithParam("--manifest")
	}
	rootName, rootNamespace, err := xmlRootName(content)
	if err != nil {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file invalid XML: %s: %v", page.File, err).WithParam("--manifest")
	}
	if detectForbiddenSVGlidePublishFormat(content, rootName) {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file must be raw SVG, not Slides XML/SXSD/HTML/raster/data URL fallback: %s", page.File).WithParam("--manifest")
	}
	if rootName != "svg" || rootNamespace != svglideSVGNamespace {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file root must be <svg> in the SVG namespace: %s", page.File).WithParam("--manifest")
	}
	if err := rejectUnsupportedSVGlideImageResources(page, string(content)); err != nil {
		return err
	}
	return nil
}

func rejectUnsupportedSVGlideImageResources(page svglideManifestPage, content string) error {
	if svglideUnsupportedImageHrefRegex.MatchString(content) {
		return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file uses SVG image resources, which require Phase B FileMetaMap proof: %s", page.File).WithParam("--manifest")
	}
	return nil
}

func xmlRootName(raw []byte) (string, string, error) {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			return "", "", errs.NewValidationError(errs.SubtypeInvalidArgument, "missing XML root element")
		}
		if err != nil {
			return "", "", err
		}
		if start, ok := token.(xml.StartElement); ok {
			return start.Name.Local, start.Name.Space, nil
		}
	}
}

func detectForbiddenSVGlidePublishFormat(raw []byte, rootName string) bool {
	trimmed := strings.TrimSpace(string(raw))
	lower := strings.ToLower(trimmed)
	if strings.HasPrefix(lower, "<!doctype html") || strings.HasPrefix(lower, "<html") || strings.HasPrefix(lower, "data:image/") {
		return true
	}
	if len(raw) >= 8 && bytes.Equal(raw[:8], []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}) {
		return true
	}
	if len(raw) >= 3 && raw[0] == 0xff && raw[1] == 0xd8 && raw[2] == 0xff {
		return true
	}
	switch rootName {
	case "slide", "presentation", "sxsd", "document", "html":
		return true
	default:
		return false
	}
}

func sha256Hex(raw []byte) string {
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}

func svglideManifestChildPath(label, baseDir, child string) (string, error) {
	child = strings.TrimSpace(child)
	if child == "" {
		return "", errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest %s is required", label).WithParam("--manifest")
	}
	if filepath.IsAbs(child) {
		return "", errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest %s must be relative to the manifest directory and cannot be absolute: %s", label, child).WithParam("--manifest")
	}
	clean := filepath.Clean(child)
	if clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) {
		return "", errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest %s must be relative to the manifest directory and cannot contain '..': %s", label, child).WithParam("--manifest")
	}
	if baseDir == "" {
		return clean, nil
	}
	return filepath.Join(baseDir, clean), nil
}
```

- [ ] **Step 4: Run manifest tests**

Run:

```bash
gofmt -w shortcuts/slides/slides_create_svglide_manifest.go shortcuts/slides/slides_create_svglide_test.go
go test ./shortcuts/slides -run 'TestPrepareSVGlidePublishSpec' -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/shortcuts/slides
```

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add shortcuts/slides/slides_create_svglide_manifest.go shortcuts/slides/slides_create_svglide_test.go
git commit -m "feat: add svglide manifest reader"
```

---

### Task 2: Phase B SVGlide Image Placeholder Upload Helpers

**Files:**
- Create: `shortcuts/slides/slides_create_svglide_assets.go`
- Modify: `shortcuts/slides/slides_create_svglide_test.go`

**Status:** Deferred. Do not execute this task as part of MVP-A. First prove pure SVG raw payload publish with Task 5. Only then add SVG image resource handling and a separate live proof that `<image href="...">` survives the full `cli -> slide_engine -> slide` path.

MVP-A behavior for local image placeholders:

- If a page contains `<image href="@...">` or `<image xlink:href="@...">`, return a structured validation error.
- Do not request `docs:document.media:upload` scope in MVP-A.
- Do not claim SVG image support in docs until Phase B has a live proof.

**Interfaces:**
- Consumes: `uploadSlidesMedia(runtime, filePath, fileName string, fileSize int64, presentationID string) (string, error)`
- Produces:
  - `type svglideImagePlaceholder struct`
  - `func extractSVGlideImagePlaceholders(spec *svglidePublishSpec) ([]svglideImagePlaceholder, error)`
  - `func replaceSVGlideImagePlaceholders(content string, tokens map[string]string) string`
  - `func uploadSVGlidePlaceholders(runtime *common.RuntimeContext, presentationID string, placeholders []svglideImagePlaceholder) (map[string]string, int, error)`

- [ ] **Step 1: Write failing placeholder tests**

Add:

```go
func TestExtractAndReplaceSVGlideImagePlaceholders(t *testing.T) {
	spec := &svglidePublishSpec{
		BaseDir: "run",
		Pages: []svglidePublishPage{
			{Content: `<svg><image href="@assets/a.png"/><image xlink:href='@assets/b.png'/></svg>`},
			{Content: `<svg><image href="@assets/a.png"/></svg>`},
		},
	}

	placeholders, err := extractSVGlideImagePlaceholders(spec)
	if err != nil {
		t.Fatalf("extractSVGlideImagePlaceholders() error = %v", err)
	}
	want := []svglideImagePlaceholder{
		{Placeholder: "assets/a.png", File: "run/assets/a.png"},
		{Placeholder: "assets/b.png", File: "run/assets/b.png"},
	}
	if !reflect.DeepEqual(placeholders, want) {
		t.Fatalf("placeholders = %#v, want %#v", placeholders, want)
	}

	got := replaceSVGlideImagePlaceholders(spec.Pages[0].Content, map[string]string{
		"assets/a.png": "tok_a",
		"assets/b.png": "tok_b",
	})
	if strings.Contains(got, "@assets/a.png") || strings.Contains(got, "@assets/b.png") {
		t.Fatalf("placeholders not replaced: %s", got)
	}
	if !strings.Contains(got, `href="tok_a"`) || !strings.Contains(got, `xlink:href='tok_b'`) {
		t.Fatalf("tokens not preserved in href attrs: %s", got)
	}
}
```

Update imports in `slides_create_svglide_test.go` to include `reflect`.

- [ ] **Step 2: Run failing tests**

Run:

```bash
go test ./shortcuts/slides -run 'TestExtractAndReplaceSVGlideImagePlaceholders' -count=1
```

Expected result:

```text
FAIL
undefined: extractSVGlideImagePlaceholders
```

- [ ] **Step 3: Implement asset helpers**

Create `shortcuts/slides/slides_create_svglide_assets.go` with:

```go
package slides

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/shortcuts/common"
)

var svglideImageHrefPlaceholderRegex = regexp.MustCompile(`(?s)<image\b[^>]*?\b(?:href|xlink:href)\s*=\s*(["'])@([^"']+)(["'])`)

type svglideImagePlaceholder struct {
	Placeholder string
	File        string
}

func extractSVGlideImagePlaceholders(spec *svglidePublishSpec) ([]svglideImagePlaceholder, error) {
	var placeholders []svglideImagePlaceholder
	seen := map[string]bool{}
	for _, page := range spec.Pages {
		matches := svglideImageHrefPlaceholderRegex.FindAllStringSubmatch(page.Content, -1)
		for _, match := range matches {
			if match[1] != match[3] {
				continue
			}
			placeholder := strings.TrimSpace(match[2])
			if placeholder == "" || seen[placeholder] {
				continue
			}
			filePath, err := svglideManifestChildPath("asset file", spec.BaseDir, placeholder)
			if err != nil {
				return nil, err
			}
			seen[placeholder] = true
			placeholders = append(placeholders, svglideImagePlaceholder{Placeholder: placeholder, File: filePath})
		}
	}
	return placeholders, nil
}

func replaceSVGlideImagePlaceholders(content string, tokens map[string]string) string {
	return svglideImageHrefPlaceholderRegex.ReplaceAllStringFunc(content, func(match string) string {
		sub := svglideImageHrefPlaceholderRegex.FindStringSubmatch(match)
		if len(sub) < 4 || sub[1] != sub[3] {
			return match
		}
		path := strings.TrimSpace(sub[2])
		token, ok := tokens[path]
		if !ok {
			return match
		}
		oldQuoted := fmt.Sprintf("%s@%s%s", sub[1], sub[2], sub[3])
		newQuoted := fmt.Sprintf("%s%s%s", sub[1], token, sub[3])
		return strings.Replace(match, oldQuoted, newQuoted, 1)
	})
}

func uploadSVGlidePlaceholders(runtime *common.RuntimeContext, presentationID string, placeholders []svglideImagePlaceholder) (map[string]string, int, error) {
	tokens := make(map[string]string, len(placeholders))
	for i, placeholder := range placeholders {
		stat, err := runtime.FileIO().Stat(placeholder.File)
		if err != nil {
			return tokens, i, slidesInputStatError(err, "--manifest", fmt.Sprintf("@%s: file not found", placeholder.Placeholder))
		}
		if !stat.Mode().IsRegular() {
			return tokens, i, errs.NewValidationError(errs.SubtypeInvalidArgument, "@%s: must be a regular file", placeholder.Placeholder).WithParam("--manifest")
		}
		if stat.Size() > common.MaxDriveMediaUploadSinglePartSize {
			return tokens, i, errs.NewValidationError(errs.SubtypeInvalidArgument, "@%s: file size %s exceeds 20 MB limit for slides image upload",
				placeholder.Placeholder, common.FormatSize(stat.Size())).WithParam("--manifest")
		}
		fileName := filepath.Base(placeholder.File)
		fmt.Fprintf(runtime.IO().ErrOut, "Uploading SVGlide image %d/%d: %s (%s)\n",
			i+1, len(placeholders), fileName, common.FormatSize(stat.Size()))
		token, err := uploadSlidesMedia(runtime, placeholder.File, fileName, stat.Size(), presentationID)
		if err != nil {
			return tokens, i, err
		}
		tokens[placeholder.Placeholder] = token
	}
	return tokens, len(placeholders), nil
}
```

- [ ] **Step 4: Run placeholder tests**

Run:

```bash
gofmt -w shortcuts/slides/slides_create_svglide_assets.go shortcuts/slides/slides_create_svglide_test.go
go test ./shortcuts/slides -run 'TestExtractAndReplaceSVGlideImagePlaceholders' -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/shortcuts/slides
```

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add shortcuts/slides/slides_create_svglide_assets.go shortcuts/slides/slides_create_svglide_test.go
git commit -m "feat: add svglide asset placeholders"
```

---

### Task 3: Shortcut Execute And Dry-Run

**Files:**
- Create: `shortcuts/slides/slides_create_svglide.go`
- Modify: `shortcuts/slides/slides_create_svglide_test.go`
- Modify: `shortcuts/slides/shortcuts.go`

**Interfaces:**
- Consumes: `prepareSVGlidePublishSpec`, `buildPresentationXML`, `effectiveTitle`, `appendSlidesProgressHint`, `common.AutoGrantCurrentUserDrivePermission`
- Produces: `var SlidesCreateSVGlide common.Shortcut`

- [ ] **Step 1: Write failing execute and dry-run tests**

Add:

```go
func TestSlidesCreateSVGlideExecute(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	page := `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="page-001" viewBox="0 0 960 540"><rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/></svg>`
	mustWriteFile(t, "pages/page-001.svg", page)
	mustWriteFile(t, "receipts/validate_svg_deck.json", `{"totalErrors":0}`)
	mustWriteFile(t, "manifest.json", fmt.Sprintf(`{
	  "version": "svglide.manifest.v1",
	  "protocol": "svg-slides.v1",
	  "title": "SVGlide Deck",
	  "size": {"width": 960, "height": 540},
	  "publish_ready": true,
	  "published": false,
	  "pages": [{"id": "page-001", "index": 1, "file": "pages/page-001.svg", "sha256": %q}],
	  "receipts": {"validate_svg_deck": "receipts/validate_svg_deck.json"}
	}`, sha256Hex([]byte(page))))

	f, stdout, _, reg := cmdutil.TestFactory(t, slidesTestConfig(t, ""))
	reg.Register(&httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations",
		Body: map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{
				"xml_presentation_id": "pres_sg",
				"revision_id":         1,
				"url":                 "https://tenant.example.com/slides/pres_sg",
			},
		},
	})
	slideStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/slides_ai/v1/xml_presentations/pres_sg/slide",
		Body:   map[string]interface{}{"code": 0, "data": map[string]interface{}{"slide_id": "slide_1", "revision_id": 2}},
	}
	reg.Register(slideStub)

	err := runSlidesCreateSVGlideShortcut(t, f, stdout, []string{
		"+create-svglide",
		"--manifest", "manifest.json",
		"--as", "user",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	data := decodeSlidesCreateEnvelope(t, stdout)
	if data["xml_presentation_id"] != "pres_sg" {
		t.Fatalf("xml_presentation_id = %v", data["xml_presentation_id"])
	}
	if data["slides_added"] != float64(1) {
		t.Fatalf("slides_added = %v, want 1", data["slides_added"])
	}
	if data["svglide_manifest_version"] != svglideManifestVersion {
		t.Fatalf("svglide_manifest_version = %v", data["svglide_manifest_version"])
	}

	var body map[string]interface{}
	if err := json.Unmarshal(slideStub.CapturedBody, &body); err != nil {
		t.Fatalf("decode slide body: %v", err)
	}
	slide := body["slide"].(map[string]interface{})
	if !strings.Contains(slide["content"].(string), "<svg") {
		t.Fatalf("slide content did not contain SVGlide payload: %#v", slide["content"])
	}
}

func TestSlidesCreateSVGlideDryRun(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	page := `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect/></svg>`
	mustWriteFile(t, "pages/page-001.svg", page)
	mustWriteFile(t, "receipts/validate_svg_deck.json", `{"totalErrors":0}`)
	mustWriteFile(t, "manifest.json", fmt.Sprintf(`{
	  "version": "svglide.manifest.v1",
	  "protocol": "svg-slides.v1",
	  "title": "SVGlide Deck",
	  "size": {"width": 960, "height": 540},
	  "publish_ready": true,
	  "published": false,
	  "pages": [{"id": "page-001", "index": 1, "file": "pages/page-001.svg", "sha256": %q}],
	  "receipts": {"validate_svg_deck": "receipts/validate_svg_deck.json"}
	}`, sha256Hex([]byte(page))))

	f, stdout, _, _ := cmdutil.TestFactory(t, slidesTestConfig(t, ""))
	err := runSlidesCreateSVGlideShortcut(t, f, stdout, []string{
		"+create-svglide",
		"--manifest", "manifest.json",
		"--dry-run",
		"--as", "user",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	out := stdout.String()
	for _, want := range []string{"Create SVGlide presentation", "Add SVGlide page 1", "content_sha256", "/open-apis/slides_ai/v1/xml_presentations/<xml_presentation_id>/slide"} {
		if !strings.Contains(out, want) {
			t.Fatalf("dry-run missing %q: %s", want, out)
		}
	}
	if strings.Contains(out, "<svg") {
		t.Fatalf("dry-run must summarize SVG content instead of printing full payload: %s", out)
	}
}

func runSlidesCreateSVGlideShortcut(t *testing.T, f *cmdutil.Factory, stdout *bytes.Buffer, args []string) error {
	t.Helper()
	parent := &cobra.Command{Use: "slides"}
	SlidesCreateSVGlide.Mount(parent, f)
	parent.SetArgs(args)
	parent.SilenceErrors = true
	parent.SilenceUsage = true
	if stdout != nil {
		stdout.Reset()
	}
	return parent.Execute()
}
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
go test ./shortcuts/slides -run 'TestSlidesCreateSVGlide' -count=1
```

Expected result:

```text
FAIL
undefined: SlidesCreateSVGlide
```

- [ ] **Step 3: Implement shortcut**

Create `shortcuts/slides/slides_create_svglide.go` with:

```go
package slides

import (
	"context"
	"fmt"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/shortcuts/common"
)

var SlidesCreateSVGlide = common.Shortcut{
	Service:     "slides",
	Command:     "+create-svglide",
	Description: "Create a Lark Slides presentation from an existing SVGlide manifest",
	Risk:        "write",
	AuthTypes:   []string{"user", "bot"},
	Scopes:      []string{"slides:presentation:create", "slides:presentation:write_only"},
	Flags: []common.Flag{
		{Name: "manifest", Desc: "SVGlide manifest JSON file; version=svglide.manifest.v1, max 10 pages", Required: true},
		{Name: "title", Desc: "presentation title override; defaults to manifest.title, then Untitled"},
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		_, err := prepareSVGlidePublishSpec(runtime.Str("manifest"), runtime.Str("title"))
		return err
	},
	DryRun: func(ctx context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
		spec, err := prepareSVGlidePublishSpec(runtime.Str("manifest"), runtime.Str("title"))
		if err != nil {
			return common.NewDryRunAPI().Set("error", err.Error())
		}
		total := 1 + len(spec.Pages)
		dry := common.NewDryRunAPI()
		dry.Desc(fmt.Sprintf("Create SVGlide presentation + add %d page(s)", len(spec.Pages))).
			POST("/open-apis/slides_ai/v1/xml_presentations").
			Desc(fmt.Sprintf("[1/%d] Create presentation", total)).
			Body(map[string]interface{}{
				"xml_presentation": map[string]interface{}{"content": buildPresentationXML(spec.Title)},
			})
		pageStepStart := 2
		for i, page := range spec.Pages {
			dry.POST("/open-apis/slides_ai/v1/xml_presentations/<xml_presentation_id>/slide").
				Desc(fmt.Sprintf("[%d/%d] Add SVGlide page %d (%s)", pageStepStart+i, total, i+1, page.ID)).
				Params(map[string]interface{}{"revision_id": -1}).
				Body(map[string]interface{}{
					"slide": map[string]interface{}{
						"content":         fmt.Sprintf("<raw SVG omitted: sha256=%s bytes=%d>", page.SHA256, page.ContentBytes),
						"content_type":    "svg",
						"content_bytes":   page.ContentBytes,
						"content_sha256":  page.SHA256,
						"content_omitted": true,
					},
				})
		}
		if runtime.IsBot() {
			dry.Desc("After creation succeeds in bot mode, the CLI will also try to grant the current CLI user full_access (可管理权限) on the new presentation.")
		}
		return dry.Set("manifest", runtime.Str("manifest")).Set("svglide_manifest_version", svglideManifestVersion)
	},
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		spec, err := prepareSVGlidePublishSpec(runtime.Str("manifest"), runtime.Str("title"))
		if err != nil {
			return err
		}
		data, err := runtime.CallAPITyped(
			"POST",
			"/open-apis/slides_ai/v1/xml_presentations",
			nil,
			map[string]interface{}{
				"xml_presentation": map[string]interface{}{"content": buildPresentationXML(spec.Title)},
			},
		)
		if err != nil {
			return err
		}
		presentationID := common.GetString(data, "xml_presentation_id")
		if presentationID == "" {
			return errs.NewInternalError(errs.SubtypeInvalidResponse, "slides create-svglide returned no xml_presentation_id")
		}

		result := map[string]interface{}{
			"xml_presentation_id":       presentationID,
			"title":                     spec.Title,
			"manifest":                  spec.ManifestPath,
			"svglide_manifest_version":  svglideManifestVersion,
		}
		if revisionID := common.GetFloat(data, "revision_id"); revisionID > 0 {
			result["revision_id"] = int(revisionID)
		}

		slideURL := fmt.Sprintf("/open-apis/slides_ai/v1/xml_presentations/%s/slide", validate.EncodePathSegment(presentationID))
		slideIDs := make([]string, 0, len(spec.Pages))
		pageResults := make([]map[string]interface{}, 0, len(spec.Pages))
		for i, page := range spec.Pages {
			slideData, err := runtime.CallAPITyped(
				"POST",
				slideURL,
				map[string]interface{}{"revision_id": -1},
				map[string]interface{}{
					"slide": map[string]interface{}{"content": page.Content},
				},
			)
			if err != nil {
				return appendSlidesProgressHint(err, fmt.Sprintf("adding SVGlide page %d/%d (%s) failed; presentation %s was created, %d page(s) added before failure", i+1, len(spec.Pages), page.ID, presentationID, i))
			}
			slideID := common.GetString(slideData, "slide_id")
			if slideID != "" {
				slideIDs = append(slideIDs, slideID)
			}
			pageResults = append(pageResults, map[string]interface{}{
				"id":            page.ID,
				"index":         page.Index,
				"file":          page.File,
				"sha256":        page.SHA256,
				"content_bytes": page.ContentBytes,
				"slide_id":      slideID,
			})
		}

		result["slide_ids"] = slideIDs
		result["slides_added"] = len(slideIDs)
		result["pages"] = pageResults
		if url := common.GetString(data, "url"); url != "" {
			result["url"] = url
		} else if url := common.BuildResourceURL(runtime.Config.Brand, "slides", presentationID); url != "" {
			result["url"] = url
		}
		if grant := common.AutoGrantCurrentUserDrivePermission(runtime, presentationID, "slides"); grant != nil {
			result["permission_grant"] = grant
		}
		runtime.Out(result, nil)
		return nil
	},
}
```

Modify `shortcuts/slides/shortcuts.go`:

```go
func Shortcuts() []common.Shortcut {
	return []common.Shortcut{
		SlidesCreate,
		SlidesCreateSVGlide,
		SlidesMediaUpload,
		SlidesReplaceSlide,
		SlidesReplacePages,
		SlidesScreenshot,
		SlidesXMLGet,
	}
}
```

- [ ] **Step 4: Run shortcut tests**

Run:

```bash
gofmt -w shortcuts/slides/slides_create_svglide.go shortcuts/slides/slides_create_svglide_test.go shortcuts/slides/shortcuts.go
go test ./shortcuts/slides -run 'TestSlidesCreateSVGlide|TestPrepareSVGlidePublishSpec' -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/shortcuts/slides
```

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add shortcuts/slides/slides_create_svglide.go shortcuts/slides/slides_create_svglide_test.go shortcuts/slides/shortcuts.go
git commit -m "feat: add slides create-svglide shortcut"
```

---

### Task 4: CLI Dry-Run E2E

**Files:**
- Create: `tests/cli_e2e/slides_create_svglide_dryrun_test.go`

**Interfaces:**
- Consumes: `RunCmd(context.Context, Request) (*Result, error)` from `tests/cli_e2e/core.go`
- Produces: dry-run coverage for command mount、flag parsing、manifest file reading、API plan rendering

- [ ] **Step 1: Add dry-run E2E test**

Create `tests/cli_e2e/slides_create_svglide_dryrun_test.go`:

```go
package clie2e

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSlidesCreateSVGlideDryRunE2E(t *testing.T) {
	setDryRunConfigEnv(t)
	dir := prepareSVGlideSmokeBundle(t, "Dry SVGlide")

	result, err := RunCmd(context.Background(), Request{
		Args: []string{
			"slides", "+create-svglide",
			"--manifest", "manifest.json",
			"--as", "user",
			"--dry-run",
		},
		WorkDir: dir,
	})
	require.NoError(t, err)
	require.NoError(t, result.RunErr, "stderr:\n%s", result.Stderr)
	result.AssertExitCode(t, 0)

	assert.True(t, strings.HasPrefix(result.Stdout, "=== Dry Run ===\n"), result.Stdout)
	assert.Contains(t, result.Stdout, "/open-apis/slides_ai/v1/xml_presentations")
	assert.Contains(t, result.Stdout, "/open-apis/slides_ai/v1/xml_presentations/<xml_presentation_id>/slide")
	assert.Contains(t, result.Stdout, "Create SVGlide presentation")
	assert.Contains(t, result.Stdout, "page-001")
}

func prepareSVGlideSmokeBundle(t *testing.T, title string) string {
	t.Helper()
	root, err := findProjectRootDir()
	require.NoError(t, err)

	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "pages"), 0o755))

	fixture := filepath.Join(root, "skills/lark-slides/references/svg-slides/examples/minimal-slide.svg")
	raw, err := os.ReadFile(fixture)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(filepath.Join(dir, "pages", "page-001.svg"), raw, 0o644))

	runNodeTool(t, root, "skills/lark-slides/scripts/validate_svg_deck.mjs", dir, "--json")
	runNodeTool(t, root, "skills/lark-slides/scripts/svg_slides_bundle.mjs", dir, "--title", title)
	return dir
}

func runNodeTool(t *testing.T, root string, args ...string) {
	t.Helper()
	cmd := exec.Command("node", args...)
	cmd.Dir = root
	out, err := cmd.CombinedOutput()
	require.NoErrorf(t, err, "node %v failed:\n%s", args, string(out))
}
```

- [ ] **Step 2: Run dry-run E2E**

Run:

```bash
go test ./tests/cli_e2e -run TestSlidesCreateSVGlideDryRunE2E -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

- [ ] **Step 3: Commit Task 4**

Run:

```bash
git add tests/cli_e2e/slides_create_svglide_dryrun_test.go
git commit -m "test: add create-svglide dry-run e2e"
```

---

### Task 5: Gated Live E2E

**Files:**
- Create: `tests/cli_e2e/slides_create_svglide_live_test.go`

**Interfaces:**
- Consumes: built CLI E2E harness and real Lark credentials from environment
- Produces: live proof that backend accepts a validator-passing, pure SVG SVGlide page payload through the same publish surface

Smoke content source:

- Copy `skills/lark-slides/references/svg-slides/examples/minimal-slide.svg`.
- Run `node skills/lark-slides/scripts/validate_svg_deck.mjs <dir> --json`.
- Run `node skills/lark-slides/scripts/svg_slides_bundle.mjs <dir> --title "<title>"`.
- Publish the resulting `manifest.json`; do not handwrite a test-only SVG in this live E2E.

- [ ] **Step 1: Add live E2E test**

Create `tests/cli_e2e/slides_create_svglide_live_test.go`:

```go
package clie2e

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSlidesCreateSVGlideLiveE2E(t *testing.T) {
	if os.Getenv("LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE") != "1" {
		t.Skip("set LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE=1 with real user credentials to run SVGlide live create")
	}
	require.NotEmpty(t, os.Getenv("LARKSUITE_CLI_APP_ID"))
	require.NotEmpty(t, os.Getenv("LARKSUITE_CLI_APP_SECRET"))

	dir := prepareSVGlideSmokeBundle(t, "SVGlide Live Smoke")

	result, err := RunCmd(context.Background(), Request{
		Args: []string{
			"slides", "+create-svglide",
			"--manifest", "manifest.json",
			"--title", "SVGlide Live Smoke",
			"--as", "user",
		},
		WorkDir: dir,
	})
	require.NoError(t, err)
	require.NoError(t, result.RunErr, "stderr:\n%s", result.Stderr)
	result.AssertExitCode(t, 0)

	var envelope map[string]any
	require.NoError(t, json.Unmarshal([]byte(result.Stdout), &envelope), result.Stdout)
	data, ok := envelope["data"].(map[string]any)
	require.True(t, ok, result.Stdout)
	require.NotEmpty(t, data["xml_presentation_id"])
	require.Equal(t, float64(1), data["slides_added"])
	require.NotEmpty(t, data["url"])
}
```

- [ ] **Step 2: Run live E2E only with explicit enablement**

Run:

```bash
go test ./tests/cli_e2e -run TestSlidesCreateSVGlideLiveE2E -count=1
```

Expected result without enablement:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

Run with real credentials:

```bash
LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE=1 go test ./tests/cli_e2e -run TestSlidesCreateSVGlideLiveE2E -count=1
```

Expected result with credentials:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

Backend rejection of raw SVGlide payload is a stop condition for this feature. The fix is to align the target publish API or payload contract; do not add raster fallback, HTML screenshot fallback, prompt generation, or slide XML generation inside `+create-svglide`.

Passing this live E2E proves that the create surface accepted validator-passing raw SVG. It does not by itself prove rendered/readback correctness. Before claiming end-to-end SVGlide publishing, capture a separate readback or screenshot proof for the created presentation.

- [ ] **Step 3: Commit Task 5**

Run:

```bash
git add tests/cli_e2e/slides_create_svglide_live_test.go
git commit -m "test: add create-svglide live e2e"
```

---

### Task 6: Skill Documentation

**Files:**
- Modify: `skills/lark-slides/SKILL.md`
- Create: `skills/lark-slides/references/lark-slides-create-svglide.md`

**Interfaces:**
- Consumes: implemented `slides +create-svglide`
- Produces: agent-facing command docs that preserve boundary clarity

- [ ] **Step 1: Add reference document**

Create `skills/lark-slides/references/lark-slides-create-svglide.md`:

```markdown
# slides +create-svglide

`slides +create-svglide` creates a Lark Slides presentation from an existing SVGlide manifest.

It is a publisher, not a generator.

## What It Owns

- Read `svglide.manifest.v1`.
- Validate `protocol == "svg-slides.v1"`, `publish_ready == true`, `receipts.validate_svg_deck.totalErrors == 0`, page order, page count, 960x540 size, local file paths, and `pages[].sha256`.
- Verify each page is still raw SVG by re-reading the file, checking sha256, checking the XML root with an XML decoder, and rejecting Slides XML/SXSD/HTML/raster/data URL fallback.
- Reject local SVG image placeholders in MVP-A; image resource support requires Phase B live proof.
- Create the presentation shell.
- Submit each page payload in manifest order.
- Return `xml_presentation_id`, URL, slide IDs, and page mapping.

## What It Does Not Own

- Content planning.
- SVGlide authoring.
- Preview rendering.
- Visual repair.
- Readback as the default success criterion.
- PPE routing or Whistle setup.
- SVG image resource upload in MVP-A.

## Manifest

```json
{
  "version": "svglide.manifest.v1",
  "protocol": "svg-slides.v1",
  "title": "SVGlide Deck",
  "size": {"width": 960, "height": 540},
  "publish_ready": true,
  "published": false,
  "pages": [
    {
      "id": "page-001",
      "index": 1,
      "file": "pages/page-001.svg",
      "sha256": "..."
    }
  ],
  "receipts": {
    "validate_svg_deck": "receipts/validate_svg_deck.json"
  }
}
```

All page files and receipt paths are relative to the manifest directory. Absolute paths and `..` paths are rejected. Unknown manifest fields are ignored for forward compatibility. `published` is bundle state and is not used as a blocker by `+create-svglide`.

In MVP-A, pages that contain `<image href="@...">` or `<image xlink:href="@...">` are rejected until Phase B proves SVG image resources end to end.

## Usage

```bash
lark-cli slides +create-svglide --manifest run/manifest.json --as user
```

Override title:

```bash
lark-cli slides +create-svglide --manifest run/manifest.json --title "Quarterly Review" --as user
```

Dry-run:

```bash
lark-cli slides +create-svglide --manifest run/manifest.json --as user --dry-run
```
```

- [ ] **Step 2: Update SKILL command table**

In `skills/lark-slides/SKILL.md`, add the `+create-svglide` row next to `+create`:

```markdown
- `slides +create-svglide --manifest <path> [--title <title>] --as user|bot`: create a presentation from an existing SVGlide manifest. This is a publish shortcut only; generation, preview repair, and readback remain outside the CLI shortcut.
```

- [ ] **Step 3: Run doc smoke checks**

Run:

```bash
rg "\\+create-svglide|svglide.manifest.v1" skills/lark-slides/SKILL.md skills/lark-slides/references/lark-slides-create-svglide.md
```

Expected result:

```text
skills/lark-slides/SKILL.md:...
skills/lark-slides/references/lark-slides-create-svglide.md:...
```

- [ ] **Step 4: Commit Task 6**

Run:

```bash
git add skills/lark-slides/SKILL.md skills/lark-slides/references/lark-slides-create-svglide.md
git commit -m "docs: document create-svglide shortcut"
```

---

### Task 7: Final Quality Gates

**Files:**
- Verify all files touched by Tasks 1-6

**Interfaces:**
- Consumes: complete implementation and tests
- Produces: merge-ready branch evidence

- [ ] **Step 1: Format**

Run:

```bash
gofmt -w shortcuts/slides/slides_create_svglide*.go shortcuts/slides/shortcuts.go tests/cli_e2e/slides_create_svglide_*.go
gofmt -l .
```

Expected result:

```text
```

- [ ] **Step 2: Focused unit tests**

Run:

```bash
go test ./shortcuts/slides -run 'TestSlidesCreateSVGlide|TestPrepareSVGlidePublishSpec' -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/shortcuts/slides
```

- [ ] **Step 3: E2E dry-run test**

Run:

```bash
go test ./tests/cli_e2e -run TestSlidesCreateSVGlideDryRunE2E -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

- [ ] **Step 4: Required repository checks**

Run:

```bash
make unit-test
go vet ./...
go mod tidy
git diff --exit-code -- go.mod go.sum
go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.1.6 run --new-from-rev=origin/main
```

Expected result:

```text
make unit-test exits 0
go vet exits 0
go mod tidy leaves go.mod/go.sum unchanged
golangci-lint exits 0
```

- [ ] **Step 5: Live create proof, readback proof, or explicit stop**

Run:

```bash
LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE=1 go test ./tests/cli_e2e -run TestSlidesCreateSVGlideLiveE2E -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

If this fails because the backend rejects SVG/SVGlide page payload in `slide.content`, stop the implementation. The branch can keep unit and dry-run work, but the PR must not claim live SVGlide publish support until the target API contract is corrected.

If live create passes but no readback/screenshot proof has been captured yet, the PR may claim only "raw SVG create accepted by live/PPE backend"; it must not claim full rendered SVGlide publish support.

- [ ] **Step 6: Final diff review**

Run:

```bash
git diff --stat origin/main...HEAD
git diff -- shortcuts/slides tests/cli_e2e skills/lark-slides
```

Expected result:

```text
Diff only contains create-svglide shortcut, tests, and docs.
No changes introduce +create-svg.
No code path generates content, rasterizes pages, runs preview repair, or performs readback by default.
```

- [ ] **Step 7: Commit final fixes**

Run:

```bash
git status --short
git add shortcuts/slides tests/cli_e2e skills/lark-slides
git commit -m "feat: publish svglide slides manifests"
```

Expected result:

```text
One final commit exists only if Task 7 found fixes not already committed by earlier tasks.
```

---

## Boundary Review

`slides +create` remains the baseline: it publishes caller-provided slide XML, uploads local `<img src="@path">` placeholders, appends pages, and returns a receipt.

`slides +create-svglide` mirrors that shape:

- caller provides SVGlide manifest/page payload;
- CLI validates only publish-blocking structure, paths, receipt, sha, raw-SVG root, and forbidden fallback formats;
- CLI creates the presentation shell;
- CLI appends pages;
- CLI returns a receipt.

MVP-A deliberately does not mirror `+create`'s image upload helper yet: SVG `<image href="@...">` resources are rejected until Phase B proves the image resource path with a live fixture.

The responsibilities intentionally excluded from `+create-svglide` are the same responsibilities excluded from `+create`: generation strategy, rendering quality, repair loops, and readback validation. Those belong in a skill/runner/E2E layer above the shortcut or in the backend contract below it.

## Remaining Missing Knowledge

For the no-request MVP-A submission layer, no additional knowledge is required after this update. The plan now has local decisions for bundle integrity, sha guard, `published` handling, XML-root validation, raw payload shape, manifest path/order/id/title rules, image placeholder policy, unknown manifest fields, dry-run summary, partial-failure semantics, unit coverage, and docs boundary.

Request-dependent evidence remains intentionally outside this local list: live/PPE create proof, backend response-field proof, and readback/rendering proof.

## Self-Review

- Spec coverage: command naming, publish-ready manifest input, sha guard, XML-root guard, raw SVG payload, dry-run summary, live proof, skill docs, and quality gates are each mapped to MVP-A tasks; image asset upload is isolated in deferred Phase B.
- Completion marker scan: no local MVP-A knowledge gaps remain in the plan. Request-dependent/live evidence remains outside this document's local executable scope.
- Type consistency: `svglidePublishSpec`, `svglidePublishPage`, `prepareSVGlidePublishSpec`, and `rejectUnsupportedSVGlideImagePlaceholders` are defined before use and reused consistently. Phase B image helper types are scoped to the deferred image task.
