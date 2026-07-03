package svglide

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"

	"github.com/larksuite/cli/internal/vfs"
)

const slideNamespace = "https://slides.bytedance.com/ns"
const svgNamespace = "http://www.w3.org/2000/svg"
const xlinkNamespace = "http://www.w3.org/1999/xlink"

type ValidationReport struct {
	OK     bool              `json:"ok"`
	Issues []ValidationIssue `json:"issues"`
}

type ValidationIssue struct {
	Path     string `json:"path"`
	Code     string `json:"code,omitempty"`
	Message  string `json:"message"`
	Severity string `json:"severity,omitempty"`
}

type validationDeck struct {
	Slides []validationDeckSlide `json:"slides"`
}

type validationDeckSlide struct {
	Path string `json:"path"`
}

type svgViewBox struct {
	Width  float64
	Height float64
	Valid  bool
}

type svgLintElement struct {
	Excluded      bool
	TextCandidate bool
}

func ValidateRun(root string) (ValidationReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return ValidationReport{}, err
	}

	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		return failValidation(safeRoot, ValidationIssue{Code: "svglide.deck", Message: "deck artifact path is empty"}, fmt.Errorf("deck artifact path is empty"))
	}
	deckRaw, err := readRunRegularArtifact(safeRoot, deckPath)
	if err != nil {
		issue := ValidationIssue{Path: deckPath, Code: "svglide.deck", Message: fmt.Sprintf("deck %q: %v", deckPath, err)}
		return failValidation(safeRoot, issue, fmt.Errorf("read deck %q: %w", deckPath, err))
	}
	var deck validationDeck
	if err := json.Unmarshal(deckRaw, &deck); err != nil {
		issue := ValidationIssue{Path: deckPath, Code: "svglide.deck", Message: fmt.Sprintf("deck %q contains invalid JSON: %v", deckPath, err)}
		return failValidation(safeRoot, issue, fmt.Errorf("read deck %q: %w", deckPath, err))
	}
	if len(deck.Slides) == 0 {
		issue := ValidationIssue{Path: deckPath, Code: "svglide.deck", Message: fmt.Sprintf("deck %q contains no slides", deckPath)}
		return failValidation(safeRoot, issue, fmt.Errorf("deck %q contains no slides", deckPath))
	}

	report := ValidationReport{Issues: []ValidationIssue{}}
	for _, slide := range deck.Slides {
		slidePath := strings.TrimSpace(slide.Path)
		if slidePath == "" {
			report.Issues = append(report.Issues, ValidationIssue{Code: "svglide.path", Message: "slide path must not be empty"})
			continue
		}

		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			report.Issues = append(report.Issues, ValidationIssue{Path: slidePath, Code: "svglide.path", Message: err.Error()})
			continue
		}
		report.Issues = append(report.Issues, lintSVG(slidePath, raw)...)
	}
	report = normalizeValidationReport(report)

	if err := writeValidationArtifacts(safeRoot, report); err != nil {
		return report, err
	}
	return report, nil
}

func failValidation(safeRoot string, issue ValidationIssue, err error) (ValidationReport, error) {
	report := ValidationReport{Issues: []ValidationIssue{issue}}
	report = normalizeValidationReport(report)
	if writeErr := writeValidationArtifacts(safeRoot, report); writeErr != nil {
		if err != nil {
			return report, fmt.Errorf("%w; write validation artifacts: %v", err, writeErr)
		}
		return report, writeErr
	}
	return report, nil
}

func readRunRegularArtifact(safeRoot string, rel string) ([]byte, error) {
	info, path, exists, err := lstatRunPath(safeRoot, rel)
	if err != nil {
		return nil, err
	}
	if !exists || !info.Mode().IsRegular() {
		return nil, fmt.Errorf("run path %q is missing or not a regular file inside run root", rel)
	}
	raw, err := vfs.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read run path %q: %w", rel, err)
	}
	return raw, nil
}

func lintSVG(path string, raw []byte) []ValidationIssue {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	var issues []ValidationIssue
	var rootSeen bool
	var rootIsSVG bool
	var hasSlideRole bool
	var hasViewBox bool
	var hasVisibleContent bool
	var viewBox svgViewBox
	var stack []svgLintElement

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return []ValidationIssue{{Path: path, Code: "svglide.xml", Message: fmt.Sprintf("invalid XML: %v", err)}}
		}
		switch typed := token.(type) {
		case xml.StartElement:
			parentExcluded := len(stack) > 0 && stack[len(stack)-1].Excluded
			excluded := parentExcluded || elementIsHidden(typed) || elementIsNonRendering(typed)
			ctx := svgLintElement{
				Excluded:      excluded,
				TextCandidate: elementIsTextCandidate(typed),
			}
			if !rootSeen {
				rootSeen = true
				rootIsSVG = typed.Name.Local == "svg" && typed.Name.Space == svgNamespace
				hasSlideRole = hasRootSlideRole(typed)
				viewBox, hasViewBox = rootViewBox(typed)
				issues = append(issues, lintSVGElementProtocol(path, typed, excluded)...)
				stack = append(stack, ctx)
				continue
			}
			issues = append(issues, lintSVGElementProtocol(path, typed, excluded)...)
			if elementCountsAsVisibleContent(typed, viewBox, excluded) {
				hasVisibleContent = true
			}
			stack = append(stack, ctx)
		case xml.CharData:
			if strings.TrimSpace(string(typed)) != "" && activeVisibleTextCandidate(stack) {
				hasVisibleContent = true
			}
		case xml.EndElement:
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
		default:
			continue
		}
	}

	if !rootSeen {
		return []ValidationIssue{{Path: path, Code: "svglide.xml", Message: "invalid XML: missing root element"}}
	}
	if !rootIsSVG {
		issues = append(issues, ValidationIssue{Path: path, Code: "svglide.root", Message: "root element must be <svg>"})
	}
	if !hasSlideRole {
		issues = append(issues, ValidationIssue{Path: path, Code: "svglide.slide_role", Message: `root element must include slide:role="slide"`})
	}
	if !hasViewBox {
		issues = append(issues, ValidationIssue{Path: path, Code: "svglide.viewbox", Message: "root element must include viewBox"})
	} else if !viewBox.Valid {
		issues = append(issues, ValidationIssue{Path: path, Code: "svglide.viewbox", Message: "root element must include valid viewBox"})
	}
	if rootIsSVG && !hasVisibleContent {
		issues = append(issues, ValidationIssue{Path: path, Code: "svglide.visible_content", Message: "slide contains only background/placeholder content"})
	}
	return issues
}

func hasRootSlideRole(start xml.StartElement) bool {
	for _, attr := range start.Attr {
		if strings.TrimSpace(attr.Value) != "slide" {
			continue
		}
		if attr.Name.Local == "role" && attr.Name.Space == slideNamespace {
			return true
		}
	}
	return false
}

func rootViewBox(start xml.StartElement) (svgViewBox, bool) {
	for _, attr := range start.Attr {
		if attr.Name.Space != "" || attr.Name.Local != "viewBox" || strings.TrimSpace(attr.Value) == "" {
			continue
		}
		return parseViewBox(attr.Value), true
	}
	return svgViewBox{}, false
}

func parseViewBox(value string) svgViewBox {
	fields := strings.Fields(strings.ReplaceAll(value, ",", " "))
	if len(fields) != 4 {
		return svgViewBox{}
	}
	values := make([]float64, 4)
	for i, field := range fields {
		parsed, err := strconv.ParseFloat(field, 64)
		if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
			return svgViewBox{}
		}
		values[i] = parsed
	}
	width := values[2]
	height := values[3]
	if width <= 0 || height <= 0 {
		return svgViewBox{}
	}
	return svgViewBox{Width: width, Height: height, Valid: true}
}

func lintSVGElementProtocol(path string, start xml.StartElement, excluded bool) []ValidationIssue {
	if start.Name.Space != svgNamespace {
		return nil
	}

	var issues []ValidationIssue
	if start.Name.Local == "image" && imageHrefIsUnsafe(start) {
		issues = append(issues, ValidationIssue{
			Path:    path,
			Code:    "svglide.remote_asset",
			Message: "image href must be a local prepared assets/images/<file> asset",
		})
	}
	if excluded {
		return issues
	}
	if elementHasNonPositiveDimension(start) {
		issues = append(issues, ValidationIssue{
			Path:    path,
			Code:    "svglide.geometry",
			Message: fmt.Sprintf("<%s> has non-positive width or height", start.Name.Local),
		})
	}
	if start.Name.Local == "image" {
		if !hasSlideAttr(start, "role", "image") {
			issues = append(issues, ValidationIssue{
				Path:    path,
				Code:    "svglide.image_role",
				Message: `image must include slide:role="image"`,
			})
		}
	}
	return issues
}

func elementHasNonPositiveDimension(start xml.StartElement) bool {
	for _, name := range []string{"width", "height"} {
		value, ok := plainAttr(start, name)
		if !ok {
			continue
		}
		parsed, ok := parseSVGDimension(value)
		if ok && parsed <= 0 {
			return true
		}
	}
	return false
}

func imageHrefIsUnsafe(start xml.StartElement) bool {
	for _, attr := range start.Attr {
		if !isAllowedImageHrefAttr(attr) {
			continue
		}
		if _, err := validatePreparedImageAssetPath(attr.Value); err != nil {
			return true
		}
	}
	return false
}

func isAllowedImageHrefAttr(attr xml.Attr) bool {
	return attr.Name.Local == "href" && (attr.Name.Space == "" || attr.Name.Space == xlinkNamespace)
}

func hasSlideAttr(start xml.StartElement, local string, value string) bool {
	for _, attr := range start.Attr {
		if attr.Name.Space == slideNamespace && attr.Name.Local == local && strings.TrimSpace(attr.Value) == value {
			return true
		}
	}
	return false
}

func plainAttr(start xml.StartElement, local string) (string, bool) {
	for _, attr := range start.Attr {
		if attr.Name.Space == "" && attr.Name.Local == local {
			return attr.Value, true
		}
	}
	return "", false
}

func parseSVGDimension(value string) (float64, bool) {
	s := strings.TrimSpace(value)
	if s == "" {
		return 0, false
	}
	lower := strings.ToLower(s)
	for _, suffix := range []string{"vmax", "vmin", "rem", "px", "%", "em", "pt", "pc", "in", "cm", "mm", "qh", "q", "ex", "ch", "vw", "vh"} {
		if strings.HasSuffix(lower, suffix) {
			s = strings.TrimSpace(s[:len(s)-len(suffix)])
			if s == "" {
				return 0, false
			}
			break
		}
	}
	parsed, err := strconv.ParseFloat(s, 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return 0, false
	}
	return parsed, true
}

func elementCountsAsVisibleContent(start xml.StartElement, viewBox svgViewBox, excluded bool) bool {
	if excluded {
		return false
	}
	if start.Name.Space != svgNamespace {
		return false
	}
	if hasSemanticMarker(start, "background", "placeholder") {
		return false
	}
	switch start.Name.Local {
	case "text", "tspan":
		return false
	case "foreignObject", "chart":
		return true
	case "image", "use":
		return elementHasHref(start)
	case "g":
		return hasSemanticMarker(start, "chart", "shape")
	case "path", "circle", "ellipse", "line", "polyline", "polygon":
		return true
	case "rect":
		return !isBackgroundRect(start, viewBox)
	default:
		return hasSemanticMarker(start, "chart", "shape")
	}
}

func activeVisibleTextCandidate(stack []svgLintElement) bool {
	for i := len(stack) - 1; i >= 0; i-- {
		if stack[i].Excluded {
			return false
		}
		if stack[i].TextCandidate {
			return true
		}
	}
	return false
}

func elementIsTextCandidate(start xml.StartElement) bool {
	return start.Name.Space == svgNamespace && (start.Name.Local == "text" || start.Name.Local == "tspan")
}

func elementIsHidden(start xml.StartElement) bool {
	for _, attr := range start.Attr {
		if attr.Name.Space != "" {
			continue
		}
		switch attr.Name.Local {
		case "display":
			if strings.EqualFold(strings.TrimSpace(attr.Value), "none") {
				return true
			}
		case "visibility":
			if strings.EqualFold(strings.TrimSpace(attr.Value), "hidden") {
				return true
			}
		case "opacity":
			if opacityIsZero(attr.Value) {
				return true
			}
		case "style":
			if styleHidesElement(attr.Value) {
				return true
			}
		}
	}
	return false
}

func styleHidesElement(style string) bool {
	for _, declaration := range strings.Split(style, ";") {
		name, value, ok := strings.Cut(declaration, ":")
		if !ok {
			continue
		}
		switch strings.ToLower(strings.TrimSpace(name)) {
		case "display":
			if strings.EqualFold(strings.TrimSpace(value), "none") {
				return true
			}
		case "visibility":
			if strings.EqualFold(strings.TrimSpace(value), "hidden") {
				return true
			}
		case "opacity":
			if opacityIsZero(value) {
				return true
			}
		}
	}
	return false
}

func opacityIsZero(value string) bool {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return false
	}
	return floatEqual(parsed, 0)
}

func elementIsNonRendering(start xml.StartElement) bool {
	if start.Name.Space != svgNamespace {
		return false
	}
	switch start.Name.Local {
	case "defs", "symbol", "clipPath", "mask", "pattern", "linearGradient", "radialGradient", "marker", "metadata", "title", "desc", "style", "script":
		return true
	default:
		return false
	}
}

func elementHasHref(start xml.StartElement) bool {
	for _, attr := range start.Attr {
		if attr.Name.Local != "href" || strings.TrimSpace(attr.Value) == "" {
			continue
		}
		if attr.Name.Space == "" || attr.Name.Space == xlinkNamespace {
			return true
		}
	}
	return false
}

func hasSemanticMarker(start xml.StartElement, terms ...string) bool {
	for _, attr := range start.Attr {
		if attr.Name.Space != "" {
			continue
		}
		name := strings.ToLower(attr.Name.Local)
		if name != "role" && name != "class" && name != "id" && !strings.HasPrefix(name, "data-") {
			continue
		}
		value := strings.ToLower(attr.Value)
		for _, term := range terms {
			if strings.Contains(value, term) {
				return true
			}
		}
	}
	return false
}

func isBackgroundRect(start xml.StartElement, viewBox svgViewBox) bool {
	if hasSemanticMarker(start, "background", "placeholder") {
		return true
	}
	width := attrValue(start, "width")
	height := attrValue(start, "height")
	if width == "100%" && height == "100%" {
		return true
	}
	if !viewBox.Valid {
		return false
	}
	x := attrFloatDefault(start, "x", 0)
	y := attrFloatDefault(start, "y", 0)
	w, okW := parseAttrFloat(width)
	h, okH := parseAttrFloat(height)
	if !okW || !okH {
		return false
	}
	return floatEqual(x, 0) && floatEqual(y, 0) && floatEqual(w, viewBox.Width) && floatEqual(h, viewBox.Height)
}

func attrValue(start xml.StartElement, name string) string {
	for _, attr := range start.Attr {
		if attr.Name.Space == "" && attr.Name.Local == name {
			return strings.TrimSpace(attr.Value)
		}
	}
	return ""
}

func attrFloatDefault(start xml.StartElement, name string, fallback float64) float64 {
	value := attrValue(start, name)
	if value == "" {
		return fallback
	}
	parsed, ok := parseAttrFloat(value)
	if !ok {
		return fallback
	}
	return parsed
}

func parseAttrFloat(value string) (float64, bool) {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil {
		return 0, false
	}
	return parsed, true
}

func floatEqual(a float64, b float64) bool {
	return math.Abs(a-b) < 0.001
}
