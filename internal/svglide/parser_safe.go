package svglide

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"strings"
)

const (
	parserSafeSlideWidth  = 960
	parserSafeSlideHeight = 540
)

type parserSafeFrame struct {
	Name            xml.Name
	Excluded        bool
	InFreeformShape bool
}

type parserSafeTextForeignObject struct {
	ContentDepth int
	HasAllowed   bool
	Invalid      bool
}

func lintParserSafeSVG(path string, raw []byte) []ValidationIssue {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	var issues []ValidationIssue
	var stack []parserSafeFrame
	var textFOStack []parserSafeTextForeignObject
	var rootSeen bool

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil
		}
		switch typed := token.(type) {
		case xml.StartElement:
			if !rootSeen {
				rootSeen = true
				if issue, ok := lintParserSafeCanvas(path, typed); ok {
					issues = append(issues, issue)
				}
			}

			parentExcluded := len(stack) > 0 && stack[len(stack)-1].Excluded
			parentFreeformShape := len(stack) > 0 && stack[len(stack)-1].InFreeformShape
			excluded := parentExcluded || elementIsHidden(typed) || elementIsNonRendering(typed)
			if typed.Name.Space == svgNamespace && typed.Name.Local == "style" {
				issues = append(issues, ValidationIssue{
					Path:    path,
					Code:    "svglide.parser_safe.style",
					Message: "SVG slides for the online parser must not use <style>; inline parser-safe attributes instead",
				})
			}
			if !excluded {
				issues = append(issues, lintParserSafeElement(path, typed, parentFreeformShape)...)
			}

			if len(textFOStack) > 0 {
				currentDepth := len(stack)
				last := &textFOStack[len(textFOStack)-1]
				if currentDepth == last.ContentDepth {
					if parserSafeDirectTextTag(typed) {
						last.HasAllowed = true
					} else {
						last.Invalid = true
					}
				}
			}

			if parserSafeTextForeignObjectElement(typed, excluded) {
				textFOStack = append(textFOStack, parserSafeTextForeignObject{ContentDepth: len(stack) + 1})
			}
			stack = append(stack, parserSafeFrame{Name: typed.Name, Excluded: excluded, InFreeformShape: parentFreeformShape || parserSafeFreeformShapeGroup(typed)})
		case xml.CharData:
			if len(textFOStack) == 0 || strings.TrimSpace(string(typed)) == "" {
				continue
			}
			last := &textFOStack[len(textFOStack)-1]
			if len(stack) == last.ContentDepth {
				last.Invalid = true
			}
		case xml.EndElement:
			if len(stack) == 0 {
				continue
			}
			if len(textFOStack) > 0 && stack[len(stack)-1].Name.Space == svgNamespace && stack[len(stack)-1].Name.Local == "foreignObject" {
				last := textFOStack[len(textFOStack)-1]
				if last.Invalid || !last.HasAllowed {
					issues = append(issues, ValidationIssue{
						Path:    path,
						Code:    "svglide.parser_safe.foreign_object",
						Message: "text foreignObject must contain direct XHTML p/h1/h2/h3/small/ul/ol children, not div wrappers or bare text",
					})
				}
				textFOStack = textFOStack[:len(textFOStack)-1]
			}
			stack = stack[:len(stack)-1]
		}
	}
	return issues
}

func lintParserSafeCanvas(path string, root xml.StartElement) (ValidationIssue, bool) {
	viewBox, ok := rootViewBox(root)
	if !ok || !viewBox.Valid || !floatEqual(viewBox.Width, parserSafeSlideWidth) || !floatEqual(viewBox.Height, parserSafeSlideHeight) {
		return ValidationIssue{
			Path:    path,
			Code:    "svglide.parser_safe.canvas",
			Message: fmt.Sprintf("online parser-safe SVG must use viewBox=\"0 0 %d %d\"", parserSafeSlideWidth, parserSafeSlideHeight),
		}, true
	}
	if width := attrValue(root, "width"); width != "" {
		parsed, ok := parseSVGDimension(width)
		if !ok || !floatEqual(parsed, parserSafeSlideWidth) {
			return ValidationIssue{
				Path:    path,
				Code:    "svglide.parser_safe.canvas",
				Message: fmt.Sprintf("online parser-safe SVG width must be %d when present", parserSafeSlideWidth),
			}, true
		}
	}
	if height := attrValue(root, "height"); height != "" {
		parsed, ok := parseSVGDimension(height)
		if !ok || !floatEqual(parsed, parserSafeSlideHeight) {
			return ValidationIssue{
				Path:    path,
				Code:    "svglide.parser_safe.canvas",
				Message: fmt.Sprintf("online parser-safe SVG height must be %d when present", parserSafeSlideHeight),
			}, true
		}
	}
	return ValidationIssue{}, false
}

func lintParserSafeElement(path string, start xml.StartElement, inFreeformShape bool) []ValidationIssue {
	var issues []ValidationIssue
	if start.Name.Space == svgNamespace && (start.Name.Local == "text" || start.Name.Local == "tspan") {
		issues = append(issues, ValidationIssue{
			Path:    path,
			Code:    "svglide.parser_safe.text",
			Message: "online parser-safe SVG must use foreignObject text shapes instead of native SVG <text>/<tspan>",
		})
	}
	for _, attr := range start.Attr {
		if attr.Name.Local == "class" && strings.TrimSpace(attr.Value) != "" {
			issues = append(issues, ValidationIssue{
				Path:    path,
				Code:    "svglide.parser_safe.class",
				Message: "online parser-safe SVG must not rely on class selectors",
			})
		}
		if strings.Contains(attr.Value, "var(--") {
			issues = append(issues, ValidationIssue{
				Path:    path,
				Code:    "svglide.parser_safe.css_var",
				Message: "online parser-safe SVG must not rely on CSS variables",
			})
		}
	}
	if !inFreeformShape {
		if issue, ok := lintParserSafeShapeType(path, start); ok {
			issues = append(issues, issue)
		}
	}
	return issues
}

func lintParserSafeShapeType(path string, start xml.StartElement) (ValidationIssue, bool) {
	if start.Name.Space != svgNamespace {
		return ValidationIssue{}, false
	}
	if hasSlideAttr(start, "role", "chart") {
		return ValidationIssue{}, false
	}
	if start.Name.Local == "rect" && parserSafeBackgroundRect(start) {
		return ValidationIssue{}, false
	}
	var expected []string
	switch start.Name.Local {
	case "rect":
		expected = []string{"rect", "round-rect"}
	case "circle", "ellipse":
		expected = []string{"ellipse"}
	case "path", "polygon", "polyline":
		expected = []string{"custom"}
	default:
		return ValidationIssue{}, false
	}
	if !hasSlideAttr(start, "role", "shape") || !slideAttrIn(start, "shape-type", expected...) {
		return ValidationIssue{
			Path:    path,
			Code:    "svglide.parser_safe.shape_type",
			Message: fmt.Sprintf("online parser-safe foreground <%s> must use slide:role=\"shape\" and parser-supported slide:shape-type", start.Name.Local),
		}, true
	}
	if (start.Name.Local == "path" || start.Name.Local == "polygon" || start.Name.Local == "polyline") &&
		(slideAttrValue(start, "width") == "" || slideAttrValue(start, "height") == "") {
		return ValidationIssue{
			Path:    path,
			Code:    "svglide.parser_safe.shape_type",
			Message: fmt.Sprintf("online parser-safe custom <%s> must declare slide:width and slide:height", start.Name.Local),
		}, true
	}
	return ValidationIssue{}, false
}

func parserSafeBackgroundRect(start xml.StartElement) bool {
	if hasSlideAttr(start, "role", "background") {
		return true
	}
	if start.Name.Local != "rect" {
		return false
	}
	x := attrValue(start, "x")
	y := attrValue(start, "y")
	width := attrValue(start, "width")
	height := attrValue(start, "height")
	return (x == "" || x == "0") && (y == "" || y == "0") && width == "960" && height == "540"
}

func parserSafeFreeformShapeGroup(start xml.StartElement) bool {
	return start.Name.Space == svgNamespace &&
		start.Name.Local == "g" &&
		hasSlideAttr(start, "role", "shape") &&
		hasSlideAttr(start, "shape-type", "freeform")
}

func slideAttrIn(start xml.StartElement, local string, values ...string) bool {
	got := slideAttrValue(start, local)
	for _, value := range values {
		if got == value {
			return true
		}
	}
	return false
}

func slideAttrValue(start xml.StartElement, local string) string {
	for _, attr := range start.Attr {
		if attr.Name.Space == slideNamespace && attr.Name.Local == local {
			return strings.TrimSpace(attr.Value)
		}
	}
	return ""
}

func parserSafeTextForeignObjectElement(start xml.StartElement, excluded bool) bool {
	if excluded || start.Name.Space != svgNamespace || start.Name.Local != "foreignObject" {
		return false
	}
	return hasSlideAttr(start, "shape-type", "text")
}

func parserSafeDirectTextTag(start xml.StartElement) bool {
	if start.Name.Space != "" && start.Name.Space != "http://www.w3.org/1999/xhtml" {
		return false
	}
	switch start.Name.Local {
	case "p", "h1", "h2", "h3", "small", "ul", "ol":
		return true
	default:
		return false
	}
}
