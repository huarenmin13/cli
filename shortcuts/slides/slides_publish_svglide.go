// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"context"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/svglide"
	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/shortcuts/common"
)

// SlidesPublishSVGlide publishes a validated SVGlide run to a real Lark Slides document.
var SlidesPublishSVGlide = common.Shortcut{
	Service:     "slides",
	Command:     "+publish-svglide",
	Description: "Publish a validated SVGlide SVG run to Lark Slides",
	Risk:        "write",
	AuthTypes:   []string{"user", "bot"},
	Scopes:      []string{"slides:presentation:create", "slides:presentation:write_only"},
	Flags: []common.Flag{
		{Name: "run", Desc: "existing SVGlide run directory", Required: true},
		{Name: "title", Desc: "optional presentation title override"},
		{Name: "allow-smoke-publish", Type: "bool", Desc: "allow explicitly marked smoke runs to publish; disabled by default"},
	},
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		report, err := svglide.PublishOnlineRunWithOptions(runtime.Str("run"), svglideRuntimeOnlinePublisher{
			runtime: runtime,
			title:   runtime.Str("title"),
		}, svglide.PublishOnlineOptions{
			AllowSmokePublish: runtime.Bool("allow-smoke-publish"),
		})
		if err != nil {
			runtime.Out(report, nil)
			return err
		}
		runtime.Out(report, nil)
		return nil
	},
}

type svglideRuntimeOnlinePublisher struct {
	runtime *common.RuntimeContext
	title   string
}

func (p svglideRuntimeOnlinePublisher) Publish(root string, evidence svglide.SVGPublishRequestEvidence) (svglide.OnlineSlidePublishReport, error) {
	slideContents, err := svglide.ReadSVGPublishSlides(root, evidence)
	if err != nil {
		return svglide.OnlineSlidePublishReport{
			Status:            svglide.StatusBlocked,
			Publisher:         "lark_slides_xml_presentations",
			BlockedReasonCode: "svglide.publish_online.svg_payload_evidence_stale",
			Message:           err.Error(),
		}, err
	}
	title := effectiveTitle(firstNonEmpty(p.title, evidence.Title))
	createData, err := p.runtime.CallAPITyped(
		"POST",
		"/open-apis/slides_ai/v1/xml_presentations",
		nil,
		map[string]interface{}{
			"xml_presentation": map[string]interface{}{
				"content": buildPresentationXML(title),
			},
		},
	)
	if err != nil {
		return svglide.OnlineSlidePublishReport{
			Status:     svglide.StatusFailed,
			Publisher:  "lark_slides_xml_presentations",
			SlideCount: 0,
			Message:    err.Error(),
		}, err
	}
	presentationID := common.GetString(createData, "xml_presentation_id")
	if presentationID == "" {
		err := errs.NewInternalError(errs.SubtypeInvalidResponse, "SVGlide publish returned no xml_presentation_id")
		return svglide.OnlineSlidePublishReport{
			Status:     svglide.StatusFailed,
			Publisher:  "lark_slides_xml_presentations",
			SlideCount: 0,
			Message:    err.Error(),
		}, err
	}
	url := common.GetString(createData, "url")
	if url == "" {
		url = common.BuildResourceURL(p.runtime.Config.Brand, "slides", presentationID)
	}
	report := svglide.OnlineSlidePublishReport{
		Status:         "passed",
		PresentationID: presentationID,
		URL:            url,
		SlideCount:     0,
		Publisher:      "lark_slides_xml_presentations",
	}
	rewrittenSlides, uploadedImages, err := p.rewriteLocalSVGImages(root, presentationID, evidence, slideContents)
	if err != nil {
		report.Status = svglide.StatusFailed
		report.Message = fmt.Sprintf("uploading SVG image assets failed: %v", err)
		return report, err
	}
	slideContents = rewrittenSlides
	slideURL := fmt.Sprintf(
		"/open-apis/slides_ai/v1/xml_presentations/%s/slide",
		validate.EncodePathSegment(presentationID),
	)
	for i, slideContent := range slideContents {
		if _, err := p.runtime.CallAPITyped(
			"POST",
			slideURL,
			map[string]interface{}{"revision_id": -1},
			map[string]interface{}{
				"slide": map[string]interface{}{"content": slideContent},
			},
		); err != nil {
			report.Status = svglide.StatusFailed
			report.SlideCount = i
			report.Message = fmt.Sprintf("adding SVG slide %d/%d failed: %v", i+1, len(slideContents), err)
			return report, err
		}
		report.SlideCount = i + 1
	}
	if uploadedImages > 0 {
		report.Message = fmt.Sprintf("uploaded %d SVG image asset(s)", uploadedImages)
	}
	if grant := common.AutoGrantCurrentUserDrivePermission(p.runtime, presentationID, "slides"); grant != nil {
		if message, ok := grant["message"].(string); ok {
			report.Message = message
		}
	}
	return report, nil
}

var svgImageHrefAttrRegex = regexp.MustCompile(`(?is)<image\b[^>]*?\b(?:xlink:href|href)\s*=\s*(["'])([^"']+)(["'])`)

func (p svglideRuntimeOnlinePublisher) rewriteLocalSVGImages(root, presentationID string, evidence svglide.SVGPublishRequestEvidence, slideContents []string) ([]string, int, error) {
	if len(slideContents) == 0 {
		return slideContents, 0, nil
	}
	tokensByPath := map[string]string{}
	tokensBySlideHref := map[string]string{}
	uploaded := 0
	for i, slideContent := range slideContents {
		slidePath := ""
		if i < len(evidence.Slides) {
			slidePath = evidence.Slides[i].Path
		}
		for _, match := range svgImageHrefAttrRegex.FindAllStringSubmatch(slideContent, -1) {
			if len(match) < 4 || match[1] != match[3] {
				continue
			}
			href := strings.TrimSpace(match[2])
			filePath, fileSize, ok, err := p.resolveLocalSVGImage(root, slidePath, href)
			if err != nil {
				return slideContents, uploaded, err
			}
			if !ok {
				continue
			}
			token, exists := tokensByPath[filePath]
			if !exists {
				token, err = uploadSlidesMedia(p.runtime, filePath, filepath.Base(filePath), fileSize, presentationID)
				if err != nil {
					return slideContents, uploaded, fmt.Errorf("%s: %w", href, err)
				}
				tokensByPath[filePath] = token
				uploaded++
			}
			tokensBySlideHref[svgImageHrefKey(i, href)] = token
		}
	}
	if len(tokensBySlideHref) == 0 {
		return slideContents, uploaded, nil
	}
	rewritten := make([]string, len(slideContents))
	for i, slideContent := range slideContents {
		rewritten[i] = svgImageHrefAttrRegex.ReplaceAllStringFunc(slideContent, func(match string) string {
			sub := svgImageHrefAttrRegex.FindStringSubmatch(match)
			if len(sub) < 4 || sub[1] != sub[3] {
				return match
			}
			href := strings.TrimSpace(sub[2])
			token, ok := tokensBySlideHref[svgImageHrefKey(i, href)]
			if !ok {
				return match
			}
			oldQuoted := fmt.Sprintf("%s%s%s", sub[1], sub[2], sub[3])
			newQuoted := fmt.Sprintf("%s%s%s", sub[1], token, sub[3])
			return strings.Replace(match, oldQuoted, newQuoted, 1)
		})
	}
	return rewritten, uploaded, nil
}

func (p svglideRuntimeOnlinePublisher) resolveLocalSVGImage(root, slidePath, href string) (string, int64, bool, error) {
	raw := strings.TrimSpace(href)
	if raw == "" || !svgImageHrefCanBeLocal(raw) {
		return "", 0, false, nil
	}
	filePath := strings.TrimPrefix(raw, "file://")
	if !filepath.IsAbs(filePath) {
		filePath = filepath.Join(root, filepath.Dir(slidePath), filePath)
	}
	filePath = filepath.Clean(filePath)
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return "", 0, false, err
	}
	absFile, err := filepath.Abs(filePath)
	if err != nil {
		return "", 0, false, err
	}
	rel, err := filepath.Rel(absRoot, absFile)
	if err != nil {
		return "", 0, false, err
	}
	relSlash := filepath.ToSlash(rel)
	if relSlash == ".." || strings.HasPrefix(relSlash, "../") {
		return "", 0, false, fmt.Errorf("SVG image href %q in %s resolves outside run root", href, slidePath)
	}
	stat, err := p.runtime.FileIO().Stat(filePath)
	if err != nil {
		if svgImageHrefLooksLikePath(raw) {
			return "", 0, false, fmt.Errorf("SVG image href %q in %s does not resolve to a local file under run root", href, slidePath)
		}
		return "", 0, false, nil
	}
	if !stat.Mode().IsRegular() {
		return "", 0, false, fmt.Errorf("SVG image href %q in %s is not a regular file", href, slidePath)
	}
	return filePath, stat.Size(), true, nil
}

func svgImageHrefCanBeLocal(href string) bool {
	lower := strings.ToLower(strings.TrimSpace(href))
	return !strings.HasPrefix(lower, "http://") &&
		!strings.HasPrefix(lower, "https://") &&
		!strings.HasPrefix(lower, "data:") &&
		!strings.HasPrefix(lower, "#")
}

func svgImageHrefLooksLikePath(href string) bool {
	if strings.HasPrefix(href, ".") || strings.HasPrefix(href, "/") || strings.HasPrefix(strings.ToLower(href), "file://") || strings.ContainsAny(href, `/\`) {
		return true
	}
	switch strings.ToLower(filepath.Ext(href)) {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg":
		return true
	default:
		return false
	}
}

func svgImageHrefKey(slideIndex int, href string) string {
	return fmt.Sprintf("%d\x00%s", slideIndex, strings.TrimSpace(href))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
