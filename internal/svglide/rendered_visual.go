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
	Slides             int `json:"slides"`
	IssueCount         int `json:"issue_count"`
	OutOfCanvasCount   int `json:"out_of_canvas_count"`
	TextOverflowCount  int `json:"text_overflow_count"`
	TextCollisionCount int `json:"text_collision_count"`
	UnsafeEdgeCount    int `json:"unsafe_edge_count"`
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
}

type renderedVisualParseState struct {
	TranslateX float64
	TranslateY float64
	FontSize   float64
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
var renderedTransformTranslatePattern = regexp.MustCompile(`(?i)translate\(\s*([\-0-9.]+)(?:[\s,]+([\-0-9.]+))?`)
var renderedHTMLTagPattern = regexp.MustCompile(`(?is)<[^>]+>`)
var renderedWhitespacePattern = regexp.MustCompile(`\s+`)

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
	report := RenderedVisualReport{
		Status: "passed",
		Issues: []RenderedVisualIssue{},
		Slides: []RenderedVisualSlideItem{{Path: path, Status: "passed"}},
	}
	const edge = 6.0
	for _, box := range boxes {
		if box.Width <= 0 || box.Height <= 0 {
			continue
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
	}
	for i := 0; i < len(boxes); i++ {
		for j := i + 1; j < len(boxes); j++ {
			a, b := boxes[i], boxes[j]
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
					Path:      path,
					ElementID: next.ElementID,
					Kind:      "foreignObject",
					X:         parseFloatAttr(t.Attr, "x") + next.TranslateX,
					Y:         parseFloatAttr(t.Attr, "y") + next.TranslateY,
					Width:     parseFloatAttr(t.Attr, "width"),
					Height:    parseFloatAttr(t.Attr, "height"),
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
						Path:      path,
						ElementID: top.ElementID,
						Kind:      "text",
						Text:      text,
						X:         x,
						Y:         top.TextY - top.FontSize*0.86,
						Width:     width,
						Height:    top.FontSize * 1.15,
					})
				}
			case "foreignObject":
				text := normalizeRenderedText(top.Text)
				if text != "" {
					requiredHeight := estimateForeignObjectTextHeight(text, top.FontSize, top.Foreign.Width)
					top.Foreign.Text = text
					top.Foreign.RequiredHeight = requiredHeight
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
