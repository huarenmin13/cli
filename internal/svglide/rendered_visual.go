package svglide

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

const renderedVisualReceiptPath = "receipts/rendered_visual.json"

type RenderedVisualReport struct {
	Status  string                    `json:"status"`
	Metrics RenderedVisualMetrics     `json:"metrics"`
	Issues  []RenderedVisualIssue     `json:"issues"`
	Slides  []RenderedVisualSlideItem `json:"slides"`
}

type RenderedVisualMetrics struct {
	Slides                     int `json:"slides"`
	IssueCount                 int `json:"issue_count"`
	OutOfCanvasCount           int `json:"out_of_canvas_count"`
	TextOverflowCount          int `json:"text_overflow_count"`
	TextCollisionCount         int `json:"text_collision_count"`
	UnsafeEdgeCount            int `json:"unsafe_edge_count"`
	ContainerTextOverflowCount int `json:"container_text_overflow_count"`
	ContainerPaddingRiskCount  int `json:"container_padding_risk_count"`
	ForeignObjectOverlapCount  int `json:"foreign_object_overlap_count"`
	TightLineHeightCount       int `json:"tight_line_height_count"`
	BoldOveruseCount           int `json:"bold_overuse_count"`
	SmallTextPaddingRiskCount  int `json:"small_text_padding_risk_count"`
}

type RenderedVisualIssue struct {
	Path      string  `json:"path"`
	SlideID   string  `json:"slide_id,omitempty"`
	ElementID string  `json:"element_id,omitempty"`
	Code      string  `json:"code"`
	Message   string  `json:"message"`
	Severity  string  `json:"severity"`
	X         float64 `json:"x,omitempty"`
	Y         float64 `json:"y,omitempty"`
	Width     float64 `json:"width,omitempty"`
	Height    float64 `json:"height,omitempty"`
}

type RenderedVisualSlideItem struct {
	Path       string `json:"path"`
	Status     string `json:"status"`
	IssueCount int    `json:"issue_count"`
}

type renderedVisualBox struct {
	Path           string
	ElementID      string
	Kind           string
	Text           string
	X              float64
	Y              float64
	Width          float64
	Height         float64
	RequiredHeight float64
	FontSize       float64
	LineHeight     float64
	FontWeight     float64
}

type renderedVisualContainer struct {
	Path      string
	ElementID string
	Kind      string
	X         float64
	Y         float64
	Width     float64
	Height    float64
	RX        float64
	Fill      string
	Stroke    string
	Opacity   float64
}

type renderedVisualParseState struct {
	TranslateX float64
	TranslateY float64
	FontSize   float64
	LineHeight float64
	FontWeight float64
	TextAnchor string
	InText     bool
	InForeign  bool
	ElementID  string
	TextX      float64
	TextY      float64
	Text       string
	Foreign    renderedVisualBox
}

var renderedStyleNumberPattern = regexp.MustCompile(`(?i)(font-size|line-height)\s*:\s*([0-9.]+)`)
var renderedFontWeightNumberPattern = regexp.MustCompile(`(?i)font-weight\s*:\s*([0-9.]+|bold|bolder)`)
var renderedTransformTranslatePattern = regexp.MustCompile(`(?i)translate\(\s*([\-0-9.]+)(?:[\s,]+([\-0-9.]+))?`)
var renderedHTMLTagPattern = regexp.MustCompile(`(?is)<[^>]+>`)
var renderedWhitespacePattern = regexp.MustCompile(`\s+`)
var renderedStyleValuePattern = regexp.MustCompile(`(?i)(fill|stroke|opacity|background|background-color)\s*:\s*([^;]+)`)
var renderedPathTokenPattern = regexp.MustCompile(`[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?`)

func EvaluateRenderedVisualRun(safeRoot string, deck previewDeck) RenderedVisualReport {
	report := RenderedVisualReport{
		Status: "passed",
		Issues: []RenderedVisualIssue{},
		Slides: make([]RenderedVisualSlideItem, 0, len(deck.Slides)),
	}
	for _, slide := range deck.Slides {
		slidePath, err := previewSlideObjectPath(slide.Path)
		item := RenderedVisualSlideItem{Path: strings.TrimSpace(slide.Path), Status: "passed"}
		if err != nil {
			item.Status = "failed"
			report.Issues = append(report.Issues, renderedVisualIssue(item.Path, "svglide.rendered_visual.slide_path", err.Error(), renderedVisualBox{}))
			report.Slides = append(report.Slides, item)
			continue
		}
		item.Path = slidePath
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			item.Status = "failed"
			report.Issues = append(report.Issues, renderedVisualIssue(slidePath, "svglide.rendered_visual.read_slide", err.Error(), renderedVisualBox{}))
			report.Slides = append(report.Slides, item)
			continue
		}
		slideReport := evaluateRenderedVisualSVG(slidePath, raw)
		item.Status = slideReport.Status
		item.IssueCount = slideReport.Metrics.IssueCount
		report.Issues = append(report.Issues, slideReport.Issues...)
		report.Slides = append(report.Slides, item)
	}
	report.Metrics.Slides = len(report.Slides)
	renderedVisualFinalize(&report)
	return report
}

func previewDeckFromAuthorDeck(deck authorDeck) previewDeck {
	out := previewDeck{
		Title:  deck.Title,
		Slides: make([]previewDeckSlide, 0, len(deck.Slides)),
	}
	for _, slide := range deck.Slides {
		out.Slides = append(out.Slides, previewDeckSlide{
			ID:         slide.ID,
			Title:      slide.Title,
			Summary:    slide.Summary,
			Role:       slide.Role,
			KeyMessage: slide.KeyMessage,
			Path:       slide.Path,
		})
	}
	return out
}

func evaluateRenderedVisualSVG(path string, raw []byte) RenderedVisualReport {
	width, height := svgViewBoxSize(string(raw))
	if width <= 0 {
		width = defaultSlideWidth
	}
	if height <= 0 {
		height = defaultSlideHeight
	}
	boxes := renderedVisualTextBoxes(raw, path)
	containers := renderedVisualContainers(raw, path, width, height)
	report := RenderedVisualReport{
		Status: "passed",
		Issues: []RenderedVisualIssue{},
		Slides: []RenderedVisualSlideItem{{Path: path, Status: "passed"}},
	}
	const edge = 6.0
	var boldChars, totalChars int
	var firstBold renderedVisualBox
	for _, box := range boxes {
		if box.Width <= 0 || box.Height <= 0 {
			continue
		}
		totalChars += len([]rune(box.Text))
		if box.FontWeight >= 700 {
			boldChars += len([]rune(box.Text))
			if firstBold.Text == "" {
				firstBold = box
			}
		}
		if box.Kind == "foreignObject" && box.RequiredHeight > box.Height*1.15 {
			issueBox := box
			issueBox.Height = box.RequiredHeight
			report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.text_box_overflow", "estimated foreignObject text height exceeds container height", issueBox))
			continue
		}
		if box.X < -edge || box.Y < -edge || box.X+box.Width > width+edge || box.Y+box.Height > height+edge {
			code := "svglide.rendered_visual.text_overflow"
			if box.Kind == "foreignObject" {
				code = "svglide.rendered_visual.text_box_overflow"
			}
			report.Issues = append(report.Issues, renderedVisualIssue(path, code, "estimated text box extends outside slide canvas", box))
			continue
		}
		if box.X < edge || box.Y < edge || box.X+box.Width > width-edge || box.Y+box.Height > height-edge {
			report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.unsafe_edge", "estimated text box is too close to slide edge", box))
		}
		if box.Kind == "foreignObject" && box.FontSize > 0 && box.LineHeight > 0 && box.LineHeight < box.FontSize*1.12 {
			report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.tight_line_height", "foreignObject line-height is too tight for readable wrapped text", box))
		}
		if container, ok := nearestRenderedContainer(box, containers); ok {
			content := renderedBoxVisibleContentBounds(box)
			padding := renderedContainerPadding(container)
			if content.Y+content.Height > container.Y+container.Height-padding {
				report.Issues = append(report.Issues, renderedVisualContainerIssue(path, "svglide.rendered_visual.container_text_overflow", "estimated text content exceeds visible card/container bottom padding", box, container))
			} else if box.FontSize > 0 && box.FontSize <= 16 {
				minMargin := minRenderedBoxMargin(content, container)
				riskPadding := math.Max(10, box.FontSize*0.75)
				if minMargin < riskPadding {
					report.Issues = append(report.Issues, renderedVisualContainerIssue(path, "svglide.rendered_visual.small_text_padding_risk", "small text is too close to visible card/container edge", box, container))
				}
			}
			if content.X < container.X+padding || content.X+content.Width > container.X+container.Width-padding {
				report.Issues = append(report.Issues, renderedVisualContainerIssue(path, "svglide.rendered_visual.container_padding_risk", "estimated text content violates visible card/container horizontal padding", box, container))
			}
		}
	}
	if totalChars >= 40 && boldChars*100 > totalChars*65 && firstBold.Text != "" {
		report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.bold_overuse", "more than 65% of visible text is bold, flattening typographic hierarchy", firstBold))
	}
	for i := 0; i < len(boxes); i++ {
		for j := i + 1; j < len(boxes); j++ {
			a, b := boxes[i], boxes[j]
			if a.Kind == "foreignObject" && b.Kind == "foreignObject" {
				if renderedBoxesOverlap(a, b, 3) {
					report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.foreign_object_collision", fmt.Sprintf("estimated foreignObject boxes collide: %q and %q", a.Text, b.Text), a))
				}
				continue
			}
			if a.Kind == "foreignObject" || b.Kind == "foreignObject" {
				continue
			}
			if renderedBoxesOverlap(a, b, 3) {
				report.Issues = append(report.Issues, renderedVisualIssue(path, "svglide.rendered_visual.text_collision", fmt.Sprintf("estimated text boxes collide: %q and %q", a.Text, b.Text), a))
			}
		}
	}
	report.Metrics.Slides = 1
	report.Slides[0].IssueCount = len(report.Issues)
	if len(report.Issues) > 0 {
		report.Slides[0].Status = "failed"
	}
	renderedVisualFinalize(&report)
	return report
}

func renderedVisualTextBoxes(raw []byte, path string) []renderedVisualBox {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	stack := []renderedVisualParseState{{FontSize: 16}}
	var boxes []renderedVisualBox
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		current := stack[len(stack)-1]
		switch t := token.(type) {
		case xml.StartElement:
			next := current
			next.InText = false
			next.InForeign = current.InForeign
			next.Text = ""
			next.ElementID = renderedAttrValue(t.Attr, "id")
			next.TextAnchor = firstRenderedNonEmpty(renderedAttrValue(t.Attr, "text-anchor"), current.TextAnchor)
			next.FontSize = firstPositive(parseFloatAttr(t.Attr, "font-size"), parseStyleNumber(renderedAttrValue(t.Attr, "style"), "font-size"), current.FontSize)
			next.LineHeight = firstPositive(normalizeRenderedLineHeight(parseStyleNumber(renderedAttrValue(t.Attr, "style"), "line-height"), next.FontSize), current.LineHeight)
			next.FontWeight = firstPositive(parseFontWeightValue(renderedAttrValue(t.Attr, "font-weight")), parseFontWeightStyle(renderedAttrValue(t.Attr, "style")), current.FontWeight)
			dx, dy := parseTranslate(renderedAttrValue(t.Attr, "transform"))
			next.TranslateX += dx
			next.TranslateY += dy
			switch t.Name.Local {
			case "text":
				next.InText = true
				next.TextX = parseFloatAttr(t.Attr, "x") + next.TranslateX
				next.TextY = parseFloatAttr(t.Attr, "y") + next.TranslateY
			case "foreignObject":
				next.InForeign = true
				next.Foreign = renderedVisualBox{
					Path:       path,
					ElementID:  next.ElementID,
					Kind:       "foreignObject",
					X:          parseFloatAttr(t.Attr, "x") + next.TranslateX,
					Y:          parseFloatAttr(t.Attr, "y") + next.TranslateY,
					Width:      parseFloatAttr(t.Attr, "width"),
					Height:     parseFloatAttr(t.Attr, "height"),
					FontSize:   next.FontSize,
					LineHeight: next.LineHeight,
					FontWeight: next.FontWeight,
				}
			}
			stack = append(stack, next)
		case xml.CharData:
			for i := range stack {
				if stack[i].InText || stack[i].InForeign {
					stack[i].Text += string(t)
				}
			}
		case xml.EndElement:
			if len(stack) <= 1 {
				continue
			}
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			switch t.Name.Local {
			case "text":
				text := normalizeRenderedText(top.Text)
				if text != "" {
					width := estimateRenderedTextWidth(text, top.FontSize)
					x := top.TextX
					switch strings.TrimSpace(top.TextAnchor) {
					case "middle":
						x -= width / 2
					case "end":
						x -= width
					}
					boxes = append(boxes, renderedVisualBox{
						Path:       path,
						ElementID:  top.ElementID,
						Kind:       "text",
						Text:       text,
						X:          x,
						Y:          top.TextY - top.FontSize*0.86,
						Width:      width,
						Height:     top.FontSize * 1.15,
						FontSize:   top.FontSize,
						LineHeight: top.LineHeight,
						FontWeight: top.FontWeight,
					})
				}
			case "foreignObject":
				text := normalizeRenderedText(top.Text)
				if text != "" {
					requiredHeight := estimateForeignObjectTextHeight(text, top.FontSize, top.Foreign.Width)
					top.Foreign.Text = text
					top.Foreign.RequiredHeight = requiredHeight
					top.Foreign.FontSize = top.FontSize
					top.Foreign.LineHeight = top.LineHeight
					top.Foreign.FontWeight = top.FontWeight
					boxes = append(boxes, top.Foreign)
				}
			}
		}
	}
	return boxes
}

func renderedVisualFinalize(report *RenderedVisualReport) {
	report.Status = "passed"
	for _, issue := range report.Issues {
		report.Metrics.IssueCount++
		switch issue.Code {
		case "svglide.rendered_visual.text_overflow", "svglide.rendered_visual.text_box_overflow":
			report.Metrics.TextOverflowCount++
		case "svglide.rendered_visual.text_collision":
			report.Metrics.TextCollisionCount++
		case "svglide.rendered_visual.unsafe_edge":
			report.Metrics.UnsafeEdgeCount++
		case "svglide.rendered_visual.container_text_overflow":
			report.Metrics.ContainerTextOverflowCount++
		case "svglide.rendered_visual.container_padding_risk":
			report.Metrics.ContainerPaddingRiskCount++
		case "svglide.rendered_visual.foreign_object_collision":
			report.Metrics.ForeignObjectOverlapCount++
		case "svglide.rendered_visual.tight_line_height":
			report.Metrics.TightLineHeightCount++
		case "svglide.rendered_visual.bold_overuse":
			report.Metrics.BoldOveruseCount++
		case "svglide.rendered_visual.small_text_padding_risk":
			report.Metrics.SmallTextPaddingRiskCount++
		default:
			report.Metrics.OutOfCanvasCount++
		}
	}
	if report.Metrics.IssueCount > 0 {
		report.Status = "failed"
	}
	for i := range report.Slides {
		if report.Slides[i].IssueCount > 0 {
			report.Slides[i].Status = "failed"
		} else if report.Slides[i].Status == "" {
			report.Slides[i].Status = "passed"
		}
	}
}

func renderedVisualContainerIssue(path, code, message string, box renderedVisualBox, container renderedVisualContainer) RenderedVisualIssue {
	issue := renderedVisualIssue(path, code, message, box)
	issue.Message = fmt.Sprintf("%s; nearest container x=%.2f y=%.2f width=%.2f height=%.2f", message, container.X, container.Y, container.Width, container.Height)
	return issue
}

func renderedVisualIssue(path, code, message string, box renderedVisualBox) RenderedVisualIssue {
	return RenderedVisualIssue{
		Path:      path,
		ElementID: box.ElementID,
		Code:      code,
		Message:   message,
		Severity:  "error",
		X:         roundRenderedNumber(box.X),
		Y:         roundRenderedNumber(box.Y),
		Width:     roundRenderedNumber(box.Width),
		Height:    roundRenderedNumber(box.Height),
	}
}

func writeRenderedVisualReport(safeRoot string, report RenderedVisualReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, renderedVisualReceiptPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func readRenderedVisualReport(safeRoot string) (RenderedVisualReport, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, renderedVisualReceiptPath)
	if err != nil {
		if strings.Contains(err.Error(), "missing or not a regular file") {
			return RenderedVisualReport{}, false, nil
		}
		return RenderedVisualReport{}, false, err
	}
	var report RenderedVisualReport
	if err := json.Unmarshal(raw, &report); err != nil {
		return RenderedVisualReport{}, true, err
	}
	return report, true, nil
}

func renderedVisualSlideFailed(report RenderedVisualReport, path string) bool {
	for _, slide := range report.Slides {
		if slide.Path == path && slide.Status == "failed" {
			return true
		}
	}
	return false
}

func renderedBoxesOverlap(a, b renderedVisualBox, pad float64) bool {
	return a.X < b.X+b.Width+pad &&
		a.X+a.Width+pad > b.X &&
		a.Y < b.Y+b.Height+pad &&
		a.Y+a.Height+pad > b.Y
}

func renderedVisualContainers(raw []byte, path string, slideWidth, slideHeight float64) []renderedVisualContainer {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	type state struct {
		translateX float64
		translateY float64
	}
	stack := []state{{}}
	var containers []renderedVisualContainer
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		switch t := token.(type) {
		case xml.StartElement:
			current := stack[len(stack)-1]
			next := current
			dx, dy := parseTranslate(renderedAttrValue(t.Attr, "transform"))
			next.translateX += dx
			next.translateY += dy
			switch t.Name.Local {
			case "rect":
				if renderedVisualRectLooksLikeChartMark(t.Attr) {
					stack = append(stack, next)
					continue
				}
				container := renderedVisualContainer{
					Path:      path,
					ElementID: renderedAttrValue(t.Attr, "id"),
					Kind:      "rect",
					X:         parseFloatAttr(t.Attr, "x") + next.translateX,
					Y:         parseFloatAttr(t.Attr, "y") + next.translateY,
					Width:     parseFloatAttr(t.Attr, "width"),
					Height:    parseFloatAttr(t.Attr, "height"),
					RX:        parseFloatAttr(t.Attr, "rx"),
					Fill:      firstRenderedNonEmpty(renderedAttrValue(t.Attr, "fill"), parseStyleValue(renderedAttrValue(t.Attr, "style"), "fill")),
					Stroke:    firstRenderedNonEmpty(renderedAttrValue(t.Attr, "stroke"), parseStyleValue(renderedAttrValue(t.Attr, "style"), "stroke")),
					Opacity:   firstPositive(parseFloatAttr(t.Attr, "opacity"), parseFloatLoose(parseStyleValue(renderedAttrValue(t.Attr, "style"), "opacity")), 1),
				}
				if isRenderedVisualContainer(container, slideWidth, slideHeight) {
					containers = append(containers, container)
				}
			case "path":
				if renderedVisualRectLooksLikeChartMark(t.Attr) {
					stack = append(stack, next)
					continue
				}
				x, y, width, height, ok := renderedPathBounds(renderedAttrValue(t.Attr, "d"))
				if ok {
					container := renderedVisualContainer{
						Path:      path,
						ElementID: renderedAttrValue(t.Attr, "id"),
						Kind:      "path",
						X:         x + next.translateX,
						Y:         y + next.translateY,
						Width:     width,
						Height:    height,
						Fill:      renderedContainerFill(t.Attr),
						Stroke:    renderedContainerStroke(t.Attr),
						Opacity:   firstPositive(parseFloatAttr(t.Attr, "opacity"), parseFloatLoose(parseStyleValue(renderedAttrValue(t.Attr, "style"), "opacity")), 1),
					}
					if isRenderedVisualContainer(container, slideWidth, slideHeight) {
						containers = append(containers, container)
					}
				}
			case "foreignObject":
				container := renderedVisualContainer{
					Path:      path,
					ElementID: renderedAttrValue(t.Attr, "id"),
					Kind:      "foreignObject",
					X:         parseFloatAttr(t.Attr, "x") + next.translateX,
					Y:         parseFloatAttr(t.Attr, "y") + next.translateY,
					Width:     parseFloatAttr(t.Attr, "width"),
					Height:    parseFloatAttr(t.Attr, "height"),
					Fill:      renderedContainerFill(t.Attr),
					Stroke:    renderedContainerStroke(t.Attr),
					Opacity:   firstPositive(parseFloatAttr(t.Attr, "opacity"), parseFloatLoose(parseStyleValue(renderedAttrValue(t.Attr, "style"), "opacity")), 1),
				}
				if isRenderedVisualContainer(container, slideWidth, slideHeight) {
					containers = append(containers, container)
				}
			}
			stack = append(stack, next)
		case xml.EndElement:
			if len(stack) > 1 {
				stack = stack[:len(stack)-1]
			}
		}
	}
	return containers
}

func isRenderedVisualContainer(container renderedVisualContainer, slideWidth, slideHeight float64) bool {
	if container.Width <= 0 || container.Height <= 0 || slideWidth <= 0 || slideHeight <= 0 {
		return false
	}
	if container.Width/slideWidth < 0.04 || container.Height/slideHeight < 0.04 {
		return false
	}
	fill := strings.ToLower(strings.TrimSpace(container.Fill))
	stroke := strings.ToLower(strings.TrimSpace(container.Stroke))
	hasVisualStyle := container.RX > 0 || (fill != "" && fill != "none" && fill != "transparent") || (stroke != "" && stroke != "none" && stroke != "transparent")
	if !hasVisualStyle {
		return false
	}
	areaRatio := (container.Width * container.Height) / (slideWidth * slideHeight)
	if areaRatio > 0.55 {
		return false
	}
	touchesEdges := container.X <= 2 && container.Y <= 2 && container.X+container.Width >= slideWidth-2 && container.Y+container.Height >= slideHeight-2
	return !(areaRatio > 0.70 && touchesEdges)
}

func renderedVisualRectLooksLikeChartMark(attrs []xml.Attr) bool {
	haystack := strings.ToLower(strings.Join([]string{
		renderedAttrValue(attrs, "id"),
		renderedAttrValue(attrs, "class"),
		renderedAttrValue(attrs, "role"),
		renderedAttrValue(attrs, "aria-label"),
		renderedAttrValue(attrs, "data-mark"),
		renderedAttrValue(attrs, "data-role"),
	}, " "))
	for _, token := range []string{"mark-bar", "mark bar", "bar-mark", "axis", "tick", "plot", "vega", "data-point", "datapoint"} {
		if strings.Contains(haystack, token) {
			return true
		}
	}
	return false
}

func nearestRenderedContainer(box renderedVisualBox, containers []renderedVisualContainer) (renderedVisualContainer, bool) {
	content := renderedBoxVisibleContentBounds(box)
	centerX := content.X + content.Width/2
	var best renderedVisualContainer
	var bestArea float64
	for _, container := range containers {
		if centerX < container.X || centerX > container.X+container.Width {
			continue
		}
		overlapsVertically := content.Y < container.Y+container.Height && content.Y+content.Height > container.Y
		startsInside := box.Y >= container.Y && box.Y <= container.Y+container.Height
		if !overlapsVertically && !startsInside {
			continue
		}
		area := container.Width * container.Height
		if bestArea == 0 || area < bestArea {
			best = container
			bestArea = area
		}
	}
	return best, bestArea > 0
}

func renderedBoxVisibleContentBounds(box renderedVisualBox) renderedVisualBox {
	out := box
	if box.Kind == "foreignObject" && box.RequiredHeight > 0 {
		out.Height = box.RequiredHeight
	}
	return out
}

func renderedContainerPadding(container renderedVisualContainer) float64 {
	shortSide := math.Min(container.Width, container.Height)
	return math.Max(12, math.Min(24, shortSide*0.10))
}

func minRenderedBoxMargin(box renderedVisualBox, container renderedVisualContainer) float64 {
	return math.Min(
		math.Min(box.X-container.X, container.X+container.Width-(box.X+box.Width)),
		math.Min(box.Y-container.Y, container.Y+container.Height-(box.Y+box.Height)),
	)
}

func estimateForeignObjectTextHeight(text string, fontSize float64, width float64) float64 {
	if fontSize <= 0 {
		fontSize = 16
	}
	if width <= 0 {
		return fontSize * 1.3
	}
	plain := normalizeRenderedText(renderedHTMLTagPattern.ReplaceAllString(text, " "))
	textWidth := estimateRenderedTextWidth(plain, fontSize)
	lines := math.Max(1, math.Ceil(textWidth/(width*0.92)))
	return lines * fontSize * 1.22
}

func estimateRenderedTextWidth(text string, fontSize float64) float64 {
	if fontSize <= 0 {
		fontSize = 16
	}
	var units float64
	for _, r := range text {
		switch {
		case r == ' ' || r == '\t' || r == '\n':
			units += 0.33
		case r < 128:
			if strings.ContainsRune(".,:;!|/\\'\"()-+%", r) {
				units += 0.36
			} else {
				units += 0.58
			}
		default:
			units += 1.0
		}
	}
	return units * fontSize
}

func renderedContainerFill(attrs []xml.Attr) string {
	style := renderedAttrValue(attrs, "style")
	return firstRenderedNonEmpty(
		renderedAttrValue(attrs, "fill"),
		parseStyleValue(style, "fill"),
		parseStyleValue(style, "background-color"),
		parseStyleValue(style, "background"),
	)
}

func renderedContainerStroke(attrs []xml.Attr) string {
	style := renderedAttrValue(attrs, "style")
	return firstRenderedNonEmpty(
		renderedAttrValue(attrs, "stroke"),
		parseStyleValue(style, "stroke"),
	)
}

func renderedPathBounds(d string) (float64, float64, float64, float64, bool) {
	tokens := renderedPathTokenPattern.FindAllString(strings.TrimSpace(d), -1)
	if len(tokens) == 0 {
		return 0, 0, 0, 0, false
	}
	i := 0
	cmd := byte(0)
	var curX, curY float64
	minX, minY := math.Inf(1), math.Inf(1)
	maxX, maxY := math.Inf(-1), math.Inf(-1)
	hasPoint := false
	addPoint := func(x, y float64) {
		minX = math.Min(minX, x)
		minY = math.Min(minY, y)
		maxX = math.Max(maxX, x)
		maxY = math.Max(maxY, y)
		hasPoint = true
	}
	for i < len(tokens) {
		if renderedPathTokenIsCommand(tokens[i]) {
			cmd = tokens[i][0]
			i++
			continue
		}
		if cmd == 0 {
			return 0, 0, 0, 0, false
		}
		relative := cmd >= 'a' && cmd <= 'z'
		switch renderedPathCommandUpper(cmd) {
		case 'M', 'L', 'T':
			if i+1 >= len(tokens) {
				i = len(tokens)
				continue
			}
			x, y := parseFloatLoose(tokens[i]), parseFloatLoose(tokens[i+1])
			if relative {
				x += curX
				y += curY
			}
			curX, curY = x, y
			addPoint(curX, curY)
			i += 2
		case 'H':
			x := parseFloatLoose(tokens[i])
			if relative {
				x += curX
			}
			curX = x
			addPoint(curX, curY)
			i++
		case 'V':
			y := parseFloatLoose(tokens[i])
			if relative {
				y += curY
			}
			curY = y
			addPoint(curX, curY)
			i++
		case 'C':
			if i+5 >= len(tokens) {
				i = len(tokens)
				continue
			}
			for offset := 0; offset <= 4; offset += 2 {
				x, y := parseFloatLoose(tokens[i+offset]), parseFloatLoose(tokens[i+offset+1])
				if relative {
					x += curX
					y += curY
				}
				addPoint(x, y)
				if offset == 4 {
					curX, curY = x, y
				}
			}
			i += 6
		case 'S', 'Q':
			if i+3 >= len(tokens) {
				i = len(tokens)
				continue
			}
			for offset := 0; offset <= 2; offset += 2 {
				x, y := parseFloatLoose(tokens[i+offset]), parseFloatLoose(tokens[i+offset+1])
				if relative {
					x += curX
					y += curY
				}
				addPoint(x, y)
				if offset == 2 {
					curX, curY = x, y
				}
			}
			i += 4
		case 'A':
			if i+6 >= len(tokens) {
				i = len(tokens)
				continue
			}
			x, y := parseFloatLoose(tokens[i+5]), parseFloatLoose(tokens[i+6])
			if relative {
				x += curX
				y += curY
			}
			curX, curY = x, y
			addPoint(curX, curY)
			i += 7
		default:
			i++
		}
	}
	if !hasPoint || maxX <= minX || maxY <= minY {
		return 0, 0, 0, 0, false
	}
	return minX, minY, maxX - minX, maxY - minY, true
}

func renderedPathTokenIsCommand(token string) bool {
	if len(token) != 1 {
		return false
	}
	ch := token[0]
	return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')
}

func renderedPathCommandUpper(cmd byte) byte {
	if cmd >= 'a' && cmd <= 'z' {
		return cmd - ('a' - 'A')
	}
	return cmd
}

func renderedAttrValue(attrs []xml.Attr, name string) string {
	for _, attr := range attrs {
		if attr.Name.Local == name {
			return strings.TrimSpace(attr.Value)
		}
	}
	return ""
}

func parseFloatAttr(attrs []xml.Attr, name string) float64 {
	return parseFloatLoose(renderedAttrValue(attrs, name))
}

func parseFloatLoose(value string) float64 {
	value = strings.TrimSpace(strings.TrimSuffix(value, "px"))
	if value == "" {
		return 0
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}
	return parsed
}

func parseStyleNumber(style, name string) float64 {
	for _, match := range renderedStyleNumberPattern.FindAllStringSubmatch(style, -1) {
		if len(match) == 3 && strings.EqualFold(match[1], name) {
			return parseFloatLoose(match[2])
		}
	}
	return 0
}

func parseStyleValue(style, name string) string {
	for _, match := range renderedStyleValuePattern.FindAllStringSubmatch(style, -1) {
		if len(match) == 3 && strings.EqualFold(match[1], name) {
			return strings.TrimSpace(match[2])
		}
	}
	return ""
}

func parseFontWeightStyle(style string) float64 {
	match := renderedFontWeightNumberPattern.FindStringSubmatch(style)
	if len(match) != 2 {
		return 0
	}
	return parseFontWeightValue(match[1])
}

func parseFontWeightValue(value string) float64 {
	value = strings.TrimSpace(strings.ToLower(value))
	switch value {
	case "bold", "bolder":
		return 700
	default:
		return parseFloatLoose(value)
	}
}

func normalizeRenderedLineHeight(value, fontSize float64) float64 {
	if value <= 0 {
		return 0
	}
	if value < 4 && fontSize > 0 {
		return value * fontSize
	}
	return value
}

func parseTranslate(transform string) (float64, float64) {
	match := renderedTransformTranslatePattern.FindStringSubmatch(transform)
	if len(match) == 0 {
		return 0, 0
	}
	x := parseFloatLoose(match[1])
	y := 0.0
	if len(match) > 2 {
		y = parseFloatLoose(match[2])
	}
	return x, y
}

func firstRenderedNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func firstPositive(values ...float64) float64 {
	for _, value := range values {
		if value > 0 {
			return value
		}
	}
	return 0
}

func normalizeRenderedText(text string) string {
	text = renderedWhitespacePattern.ReplaceAllString(text, " ")
	return strings.TrimSpace(text)
}

func roundRenderedNumber(value float64) float64 {
	return math.Round(value*100) / 100
}
