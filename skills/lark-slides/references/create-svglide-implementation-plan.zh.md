# Slides +create-svglide Implementation Plan

> Status: publish-layer plan. Endpoint/body/response contract for live SVGlide publishing is not confirmed yet. Execute `svg-slides-local-generation-action-plan.zh.md` first to build the 960x540 SVG Slides generation and validation bundle that this publish layer will consume. Do not execute this plan as-is until the live contract resolves payload format, canvas size, response fields, and readback evidence.

> Canvas decision: current local SVG Slides artifacts use `viewBox="0 0 960 540"`, aligned with the existing Lark Slides canvas size while keeping SVG Slides as a separate `slide:*` SVG protocol. The eventual publish layer must still wait for the confirmed backend endpoint, body, response fields, and readback evidence.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `slides +create-svglide`，发布已经生成好的 SVGlide manifest/page payload 到飞书/Lark Slides，边界与 `slides +create` 同构：只负责创建演示文稿、上传本地图片占位符、逐页提交、输出收据。

**Architecture:** `+create-svglide` 读取一个本地 manifest，按 manifest 顺序读取每页 SVGlide payload，复用现有 `+create` 的 presentation create、media upload、slide create、bot auto-grant 模式。它不生成内容、不做视觉预览/修复、不默认 readback、不把 PPE 路由写进命令语义；若后端不接受 SVGlide payload，功能必须失败并暴露后端错误，不允许自动降级为图片或普通 slide XML 生成器。

**Tech Stack:** Go shortcut framework (`shortcuts/common`), `errs` structured errors, `internal/validate.SafeInputPath`, `internal/vfs`, existing slides APIs `/open-apis/slides_ai/v1/xml_presentations` and `/open-apis/slides_ai/v1/xml_presentations/{id}/slide`, existing `uploadSlidesMedia` helper, Go unit tests, CLI dry-run E2E, gated live E2E.

## Global Constraints

- 所有对用户可见的 shortcut error 必须返回 `errs.NewValidationError` / `errs.NewInternalError` / 现有 API error，不使用裸 `fmt.Errorf`。
- stdout 只输出 JSON envelope；上传进度写入 `runtime.IO().ErrOut`。
- 所有用户输入路径先过 `validate.SafeInputPath`；生产代码读文件使用 `internal/vfs.ReadFile`，不直接使用 `os.ReadFile`。
- `--manifest` 路径必须相对当前工作目录；manifest 内的 page 路径和 SVGlide page 内的 `@asset` 路径都相对 manifest 所在目录；manifest 子路径不得是绝对路径，不得包含 `..` 段。
- MVP 只支持 960x540，最多 10 页，和 `slides +create --slides` 的创建期批量追加边界保持一致。
- `+create-svglide` 不负责 research、outline、content planning、SVG/SVGlide authoring、preview、visual lint、repair loop、readback 默认验收、PPE/Whistle 配置。
- 命令名固定为 `slides +create-svglide`；不新增 `+create-svg`。
- 不新增第三方依赖。

---

## File Structure

- Create `shortcuts/slides/slides_create_svglide_manifest.go`: manifest schema、路径解析、page payload 读取、publish spec 构建。
- Create `shortcuts/slides/slides_create_svglide_assets.go`: `<image href="@path">` / `<image xlink:href="@path">` 占位符提取与替换。
- Create `shortcuts/slides/slides_create_svglide.go`: shortcut 注册体、Validate、DryRun、Execute。
- Create `shortcuts/slides/slides_create_svglide_test.go`: unit tests covering parser、validation、dry-run、execute、partial failure hints。
- Modify `shortcuts/slides/shortcuts.go`: 注册 `SlidesCreateSVGlide`。
- Create `tests/cli_e2e/slides_create_svglide_dryrun_test.go`: CLI dry-run E2E。
- Create `tests/cli_e2e/slides_create_svglide_live_test.go`: gated live E2E，未配置真实凭证时跳过。
- Modify `skills/lark-slides/SKILL.md`: command 存在后加入入口说明。
- Create `skills/lark-slides/references/lark-slides-create-svglide.md`: 用户文档和 manifest 示例。

---

### Task 1: Manifest Schema And Path Reader

**Files:**
- Create: `shortcuts/slides/slides_create_svglide_manifest.go`
- Test: `shortcuts/slides/slides_create_svglide_test.go`

**Interfaces:**
- Consumes: `validate.SafeInputPath(path string) (string, error)`, `vfs.ReadFile(path string) ([]byte, error)`, `defaultPresentationWidth`, `defaultPresentationHeight`, `maxSlidesPerCreate`
- Produces:
  - `const svglideManifestVersion = "svglide.manifest.v1"`
  - `type svglideManifest struct`
  - `type svglidePublishSpec struct`
  - `type svglidePublishPage struct`
  - `func prepareSVGlidePublishSpec(manifestPath string, overrideTitle string) (*svglidePublishSpec, error)`

- [ ] **Step 1: Write failing manifest tests**

Add these tests to `shortcuts/slides/slides_create_svglide_test.go`:

```go
func TestPrepareSVGlidePublishSpecReadsManifestAndPages(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	mustWriteFile(t, "pages/page-001.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><text>one</text></svg>`)
	mustWriteFile(t, "manifest.json", `{
	  "version": "svglide.manifest.v1",
	  "title": "Manifest Title",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "page-001", "file": "pages/page-001.svg"}]
	}`)

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
	mustWriteFile(t, "page.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`)
	mustWriteFile(t, "manifest.json", `{
	  "version": "svglide.manifest.v1",
	  "title": "Manifest Title",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "p1", "file": "page.svg"}]
	}`)

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
			manifest:    `{"version":"wrong","title":"x","size":{"width":960,"height":540},"pages":[{"id":"p1","file":"page.svg"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`},
			wantMessage: "--manifest version must be svglide.manifest.v1",
		},
		{
			name:        "wrong size",
			manifest:    `{"version":"svglide.manifest.v1","title":"x","size":{"width":1920,"height":1080},"pages":[{"id":"p1","file":"page.svg"}]}`,
			pageFiles:   map[string]string{"page.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`},
			wantMessage: "--manifest size must be 960x540",
		},
		{
			name:        "no pages",
			manifest:    `{"version":"svglide.manifest.v1","title":"x","size":{"width":960,"height":540},"pages":[]}`,
			pageFiles:   map[string]string{},
			wantMessage: "--manifest pages must contain 1 to 10 entries",
		},
		{
			name:        "unsafe child path",
			manifest:    `{"version":"svglide.manifest.v1","title":"x","size":{"width":960,"height":540},"pages":[{"id":"p1","file":"../page.svg"}]}`,
			pageFiles:   map[string]string{},
			wantMessage: "--manifest page file must be relative to the manifest directory and cannot contain '..': ../page.svg",
		},
		{
			name:        "duplicate page id",
			manifest:    `{"version":"svglide.manifest.v1","title":"x","size":{"width":960,"height":540},"pages":[{"id":"p1","file":"a.svg"},{"id":"p1","file":"b.svg"}]}`,
			pageFiles:   map[string]string{"a.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`, "b.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"></svg>`},
			wantMessage: "--manifest duplicate page id: p1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			withSlidesTestWorkingDir(t, dir)
			for path, body := range tt.pageFiles {
				mustWriteFile(t, path, body)
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
	"encoding/json"
	"path/filepath"
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/internal/vfs"
)

const svglideManifestVersion = "svglide.manifest.v1"

type svglideManifest struct {
	Version string                 `json:"version"`
	Title   string                 `json:"title"`
	Size    svglideManifestSize    `json:"size"`
	Pages   []svglideManifestPage  `json:"pages"`
}

type svglideManifestSize struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type svglideManifestPage struct {
	ID   string `json:"id"`
	File string `json:"file"`
}

type svglidePublishSpec struct {
	ManifestPath string
	BaseDir      string
	Title        string
	Pages        []svglidePublishPage
}

type svglidePublishPage struct {
	ID      string
	File    string
	Content string
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
	if manifest.Size.Width != defaultPresentationWidth || manifest.Size.Height != defaultPresentationHeight {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest size must be %dx%d", defaultPresentationWidth, defaultPresentationHeight).WithParam("--manifest")
	}
	if len(manifest.Pages) == 0 || len(manifest.Pages) > maxSlidesPerCreate {
		return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest pages must contain 1 to %d entries", maxSlidesPerCreate).WithParam("--manifest")
	}

	title := strings.TrimSpace(overrideTitle)
	if title == "" {
		title = effectiveTitle(strings.TrimSpace(manifest.Title))
	}

	baseDir := filepath.Dir(filepath.Clean(manifestPath))
	if baseDir == "." {
		baseDir = ""
	}

	seenIDs := map[string]bool{}
	pages := make([]svglidePublishPage, 0, len(manifest.Pages))
	for _, page := range manifest.Pages {
		id := strings.TrimSpace(page.ID)
		if id == "" {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page id is required").WithParam("--manifest")
		}
		if seenIDs[id] {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest duplicate page id: %s", id).WithParam("--manifest")
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
		if !strings.Contains(string(content), "<svg") {
			return nil, errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest page file must contain an <svg> root payload: %s", page.File).WithParam("--manifest")
		}
		pages = append(pages, svglidePublishPage{ID: id, File: joined, Content: string(content)})
	}

	return &svglidePublishSpec{
		ManifestPath: manifestPath,
		BaseDir:      baseDir,
		Title:        title,
		Pages:        pages,
	}, nil
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

### Task 2: SVGlide Image Placeholder Upload Helpers

**Files:**
- Create: `shortcuts/slides/slides_create_svglide_assets.go`
- Modify: `shortcuts/slides/slides_create_svglide_test.go`

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
- Consumes: `prepareSVGlidePublishSpec`, `extractSVGlideImagePlaceholders`, `uploadSVGlidePlaceholders`, `replaceSVGlideImagePlaceholders`, `buildPresentationXML`, `effectiveTitle`, `appendSlidesUploadDryRun`, `appendSlidesProgressHint`, `common.AutoGrantCurrentUserDrivePermission`
- Produces: `var SlidesCreateSVGlide common.Shortcut`

- [ ] **Step 1: Write failing execute and dry-run tests**

Add:

```go
func TestSlidesCreateSVGlideExecute(t *testing.T) {
	dir := t.TempDir()
	withSlidesTestWorkingDir(t, dir)
	mustWriteFile(t, "pages/page-001.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><text>one</text></svg>`)
	mustWriteFile(t, "manifest.json", `{
	  "version": "svglide.manifest.v1",
	  "title": "SVGlide Deck",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "page-001", "file": "pages/page-001.svg"}]
	}`)

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
	mustWriteFile(t, "pages/page-001.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><image href="@assets/a.png"/></svg>`)
	mustWriteFile(t, "assets/a.png", "img")
	mustWriteFile(t, "manifest.json", `{
	  "version": "svglide.manifest.v1",
	  "title": "SVGlide Deck",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "page-001", "file": "pages/page-001.svg"}]
	}`)

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
	for _, want := range []string{"Create SVGlide presentation", "upload_all", "Add SVGlide page 1", "/open-apis/slides_ai/v1/xml_presentations/<xml_presentation_id>/slide"} {
		if !strings.Contains(out, want) {
			t.Fatalf("dry-run missing %q: %s", want, out)
		}
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
	Scopes:      []string{"slides:presentation:create", "slides:presentation:write_only", "docs:document.media:upload"},
	Flags: []common.Flag{
		{Name: "manifest", Desc: "SVGlide manifest JSON file; version=svglide.manifest.v1, max 10 pages", Required: true},
		{Name: "title", Desc: "presentation title override; defaults to manifest.title, then Untitled"},
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		spec, err := prepareSVGlidePublishSpec(runtime.Str("manifest"), runtime.Str("title"))
		if err != nil {
			return err
		}
		placeholders, err := extractSVGlideImagePlaceholders(spec)
		if err != nil {
			return err
		}
		for _, placeholder := range placeholders {
			stat, err := runtime.FileIO().Stat(placeholder.File)
			if err != nil {
				return slidesInputStatError(err, "--manifest", fmt.Sprintf("--manifest @%s: file not found", placeholder.Placeholder))
			}
			if !stat.Mode().IsRegular() {
				return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest @%s: must be a regular file", placeholder.Placeholder).WithParam("--manifest")
			}
			if stat.Size() > common.MaxDriveMediaUploadSinglePartSize {
				return errs.NewValidationError(errs.SubtypeInvalidArgument, "--manifest @%s: file size %s exceeds 20 MB limit for slides image upload",
					placeholder.Placeholder, common.FormatSize(stat.Size())).WithParam("--manifest")
			}
		}
		return nil
	},
	DryRun: func(ctx context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
		spec, err := prepareSVGlidePublishSpec(runtime.Str("manifest"), runtime.Str("title"))
		if err != nil {
			return common.NewDryRunAPI().Set("error", err.Error())
		}
		placeholders, err := extractSVGlideImagePlaceholders(spec)
		if err != nil {
			return common.NewDryRunAPI().Set("error", err.Error())
		}
		total := 1 + len(placeholders) + len(spec.Pages)
		dry := common.NewDryRunAPI()
		dry.Desc(fmt.Sprintf("Create SVGlide presentation + add %d page(s)", len(spec.Pages))).
			POST("/open-apis/slides_ai/v1/xml_presentations").
			Desc(fmt.Sprintf("[1/%d] Create presentation", total)).
			Body(map[string]interface{}{
				"xml_presentation": map[string]interface{}{"content": buildPresentationXML(spec.Title)},
			})
		for i, placeholder := range placeholders {
			appendSlidesUploadDryRun(dry, placeholder.File, "<xml_presentation_id>", i+2)
		}
		pageStepStart := 2 + len(placeholders)
		for i, page := range spec.Pages {
			dry.POST("/open-apis/slides_ai/v1/xml_presentations/<xml_presentation_id>/slide").
				Desc(fmt.Sprintf("[%d/%d] Add SVGlide page %d (%s)", pageStepStart+i, total, i+1, page.ID)).
				Params(map[string]interface{}{"revision_id": -1}).
				Body(map[string]interface{}{
					"slide": map[string]interface{}{"content": page.Content},
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

		placeholders, err := extractSVGlideImagePlaceholders(spec)
		if err != nil {
			return err
		}
		if len(placeholders) > 0 {
			tokens, uploaded, err := uploadSVGlidePlaceholders(runtime, presentationID, placeholders)
			if err != nil {
				return appendSlidesProgressHint(err, fmt.Sprintf("presentation %s was created; %d SVGlide image(s) uploaded before failure", presentationID, uploaded))
			}
			for i := range spec.Pages {
				spec.Pages[i].Content = replaceSVGlideImagePlaceholders(spec.Pages[i].Content, tokens)
			}
			result["images_uploaded"] = uploaded
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
				"id":       page.ID,
				"file":     page.File,
				"slide_id": slideID,
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
go test ./shortcuts/slides -run 'TestSlidesCreateSVGlide|TestPrepareSVGlidePublishSpec|TestExtractAndReplaceSVGlideImagePlaceholders' -count=1
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
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSlidesCreateSVGlideDryRunE2E(t *testing.T) {
	setDryRunConfigEnv(t)
	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "pages"), 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "pages", "page-001.svg"), []byte(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><text>dry</text></svg>`), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "manifest.json"), []byte(`{
	  "version": "svglide.manifest.v1",
	  "title": "Dry SVGlide",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "page-001", "file": "pages/page-001.svg"}]
	}`), 0o644))

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
- Produces: live proof that backend accepts SVGlide page payload through the same publish surface

- [ ] **Step 1: Add live E2E test**

Create `tests/cli_e2e/slides_create_svglide_live_test.go`:

```go
package clie2e

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSlidesCreateSVGlideLiveE2E(t *testing.T) {
	if os.Getenv("LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE") != "1" {
		t.Skip("set LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE=1 with real user credentials to run SVGlide live create")
	}
	require.NotEmpty(t, os.Getenv("LARKSUITE_CLI_APP_ID"))
	require.NotEmpty(t, os.Getenv("LARKSUITE_CLI_APP_SECRET"))

	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "pages"), 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "pages", "page-001.svg"), []byte(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect x="0" y="0" width="960" height="540" fill="#ffffff"/><text x="80" y="120" font-size="44" fill="#111111">SVGlide live smoke</text></svg>`), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "manifest.json"), []byte(`{
	  "version": "svglide.manifest.v1",
	  "title": "SVGlide Live Smoke",
	  "size": {"width": 960, "height": 540},
	  "pages": [{"id": "page-001", "file": "pages/page-001.svg"}]
	}`), 0o644))

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
- Validate page order, page count, 960x540 size, and local file paths.
- Create the presentation shell.
- Upload local `<image href="@path">` and `<image xlink:href="@path">` placeholders.
- Submit each page payload in manifest order.
- Return `xml_presentation_id`, URL, slide IDs, page mapping, and upload count.

## What It Does Not Own

- Content planning.
- SVGlide authoring.
- Preview rendering.
- Visual repair.
- Readback as the default success criterion.
- PPE routing or Whistle setup.

## Manifest

```json
{
  "version": "svglide.manifest.v1",
  "title": "SVGlide Deck",
  "size": {"width": 960, "height": 540},
  "pages": [
    {"id": "page-001", "file": "pages/page-001.svg"}
  ]
}
```

All page files and `@asset` image placeholders are relative to the manifest directory. Absolute paths and `..` paths are rejected.

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
go test ./shortcuts/slides -run 'TestSlidesCreateSVGlide|TestPrepareSVGlidePublishSpec|TestExtractAndReplaceSVGlideImagePlaceholders' -count=1
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

- [ ] **Step 5: Live proof or explicit stop**

Run:

```bash
LARKSUITE_CLI_ENABLE_SVGLIDE_LIVE=1 go test ./tests/cli_e2e -run TestSlidesCreateSVGlideLiveE2E -count=1
```

Expected result:

```text
ok  	github.com/larksuite/cli/tests/cli_e2e
```

If this fails because the backend rejects SVG/SVGlide page payload in `slide.content`, stop the implementation. The branch can keep unit and dry-run work, but the PR must not claim live SVGlide publish support until the target API contract is corrected.

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
- CLI validates only publish-blocking structure and paths;
- CLI creates the presentation shell;
- CLI uploads local image placeholders;
- CLI appends pages;
- CLI returns a receipt.

The responsibilities intentionally excluded from `+create-svglide` are the same responsibilities excluded from `+create`: generation strategy, rendering quality, repair loops, and readback validation. Those belong in a skill/runner/E2E layer above the shortcut or in the backend contract below it.

## Self-Review

- Spec coverage: command naming, manifest input, thin-publisher boundary, asset upload, dry-run, live proof, skill docs, and quality gates are each mapped to Tasks 1-7.
- Completion marker scan: the plan contains no unfinished implementation markers.
- Type consistency: `svglidePublishSpec`, `svglidePublishPage`, `prepareSVGlidePublishSpec`, `extractSVGlideImagePlaceholders`, `replaceSVGlideImagePlaceholders`, and `uploadSVGlidePlaceholders` are defined before use and reused consistently.
