package svglide

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	svgVisualFormAttrPattern = regexp.MustCompile(`(?i)\bdata-svglide-visual-form\s*=\s*"([^"]+)"`)
	svgPathTagPattern        = regexp.MustCompile(`(?is)<path\b`)
	svgLineTagPattern        = regexp.MustCompile(`(?is)<line\b`)
	svgCircleTagPattern      = regexp.MustCompile(`(?is)<circle\b`)
	svgEllipseTagPattern     = regexp.MustCompile(`(?is)<ellipse\b`)
)

type visualSkeletonSummary struct {
	FormHint     string
	RectCount    int
	PathCount    int
	LineCount    int
	CircleCount  int
	EllipseCount int
	ImageCount   int
	TextCount    int
}

func analyzeVisualSkeleton(svg string) visualSkeletonSummary {
	summary := visualSkeletonSummary{
		RectCount:    len(svgRectTagForCreativePattern.FindAllStringIndex(svg, -1)),
		PathCount:    len(svgPathTagPattern.FindAllStringIndex(svg, -1)),
		LineCount:    len(svgLineTagPattern.FindAllStringIndex(svg, -1)),
		CircleCount:  len(svgCircleTagPattern.FindAllStringIndex(svg, -1)),
		EllipseCount: len(svgEllipseTagPattern.FindAllStringIndex(svg, -1)),
		ImageCount:   countSVGImageElements(svg),
		TextCount:    len(svgTextBlockForCreativePattern.FindAllStringIndex(svg, -1)),
	}
	if match := svgVisualFormAttrPattern.FindStringSubmatch(svg); len(match) == 2 {
		summary.FormHint = normalizeAuthorVisualForm(match[1])
	}
	return summary
}

func visualSkeletonSignature(summary visualSkeletonSummary) string {
	if summary.FormHint != "" {
		return "diagram:" + summary.FormHint + "|" + visualSkeletonGeometryToken(summary)
	}
	switch {
	case summary.ImageCount > 0 && summary.PathCount+summary.LineCount+summary.CircleCount+summary.EllipseCount >= 5:
		return "image_annotation|" + visualSkeletonGeometryToken(summary)
	case summary.ImageCount > 0:
		return "image_forward|" + visualSkeletonGeometryToken(summary)
	case summary.CircleCount >= 4 && summary.PathCount+summary.LineCount >= 4:
		return "node_line|" + visualSkeletonGeometryToken(summary)
	case summary.RectCount >= 8 && summary.PathCount+summary.LineCount >= 4:
		return "matrix_grid|" + visualSkeletonGeometryToken(summary)
	case summary.RectCount >= 4:
		return "rect_series|" + visualSkeletonGeometryToken(summary)
	case summary.PathCount+summary.LineCount >= 3:
		return "rule_path|" + visualSkeletonGeometryToken(summary)
	case summary.TextCount > 0:
		return "open_text|" + visualSkeletonGeometryToken(summary)
	default:
		return "minimal|" + visualSkeletonGeometryToken(summary)
	}
}

func visualSkeletonGeometryToken(summary visualSkeletonSummary) string {
	return fmt.Sprintf("r%d-p%d-l%d-c%d-e%d-i%d-t%d",
		bucketVisualSkeletonCount(summary.RectCount),
		bucketVisualSkeletonCount(summary.PathCount),
		bucketVisualSkeletonCount(summary.LineCount),
		bucketVisualSkeletonCount(summary.CircleCount),
		bucketVisualSkeletonCount(summary.EllipseCount),
		bucketVisualSkeletonCount(summary.ImageCount),
		bucketVisualSkeletonCount(summary.TextCount),
	)
}

func bucketVisualSkeletonCount(value int) int {
	switch {
	case value <= 0:
		return 0
	case value == 1:
		return 1
	case value <= 3:
		return 3
	case value <= 6:
		return 6
	default:
		return 9
	}
}

func expectedSlideVisualForm(content authorSlideContent) string {
	for _, visual := range content.Visuals {
		if !requiresConcreteVisualForm(visual.Type) {
			continue
		}
		if form := normalizeAuthorVisualForm(visual.VisualForm); form != "" {
			return form
		}
		return authorVisualForm(visual, content)
	}
	return ""
}

func visualSkeletonMatchesForm(summary visualSkeletonSummary, expected string) bool {
	expected = normalizeAuthorVisualForm(expected)
	if expected == "" {
		return true
	}
	if summary.FormHint == expected {
		return true
	}
	switch expected {
	case authorVisualFormFourQuadrant:
		return summary.RectCount >= 1 && summary.PathCount+summary.LineCount >= 2 && summary.CircleCount >= 4
	case authorVisualFormSpectrum:
		return summary.RectCount >= 4 && summary.CircleCount <= 2
	case authorVisualFormMapRoute:
		return summary.PathCount >= 2 && summary.CircleCount >= 2
	case authorVisualFormProcessFlow:
		return summary.CircleCount >= 3 && summary.PathCount+summary.LineCount >= 3
	case authorVisualFormParameterMatrix:
		return summary.PathCount+summary.LineCount >= 4 && summary.RectCount >= 1
	case authorVisualFormSensoryWheel:
		return summary.CircleCount >= 4 && summary.PathCount+summary.LineCount >= 4
	case authorVisualFormObjectCallout:
		return summary.EllipseCount >= 1 && summary.PathCount+summary.LineCount >= 3
	case authorVisualFormGeneric:
		return true
	default:
		return false
	}
}

func isRepeatedVisualSkeletonRisk(signature string) bool {
	return !containsAny(strings.ToLower(signature), []string{
		"open_text|",
		"minimal|",
		"image_forward|",
	})
}

func repeatedVisualSkeletonRisk(counts map[string]int) bool {
	for signature, count := range counts {
		if count >= 3 && isRepeatedVisualSkeletonRisk(signature) {
			return true
		}
	}
	return false
}
