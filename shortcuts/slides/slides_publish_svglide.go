// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"context"
	"fmt"

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
	},
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		report, err := svglide.PublishOnlineRun(runtime.Str("run"), svglideRuntimeOnlinePublisher{
			runtime: runtime,
			title:   runtime.Str("title"),
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
	if grant := common.AutoGrantCurrentUserDrivePermission(p.runtime, presentationID, "slides"); grant != nil {
		if message, ok := grant["message"].(string); ok {
			report.Message = message
		}
	}
	return report, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
