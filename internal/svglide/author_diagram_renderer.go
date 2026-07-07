package svglide

import (
	"fmt"
	"strings"
)

const (
	authorVisualFormGeneric         = "generic"
	authorVisualFormFourQuadrant    = "four_quadrant"
	authorVisualFormSpectrum        = "spectrum"
	authorVisualFormMapRoute        = "map_route"
	authorVisualFormProcessFlow     = "process_flow"
	authorVisualFormParameterMatrix = "parameter_matrix"
	authorVisualFormSensoryWheel    = "sensory_wheel"
	authorVisualFormObjectCallout   = "object_callout"
)

func renderAuthorInlineDiagram(b *strings.Builder, visual authorSlideVisual, content authorSlideContent, x, y, width, height int, theme authorTheme) {
	form := authorVisualForm(visual, content)
	labels := authorDiagramLabels(content, visual, 8)
	if len(labels) == 0 {
		labels = []string{firstNonEmpty(visual.Instruction, visual.ID, "visual")}
	}
	switch form {
	case authorVisualFormFourQuadrant:
		renderAuthorFourQuadrantDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormSpectrum:
		renderAuthorSpectrumDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormMapRoute:
		renderAuthorMapRouteDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormProcessFlow:
		renderAuthorProcessFlowDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormParameterMatrix:
		renderAuthorParameterMatrixDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormSensoryWheel:
		renderAuthorSensoryWheelDiagram(b, labels, x, y, width, height, theme)
	case authorVisualFormObjectCallout:
		renderAuthorObjectCalloutDiagram(b, labels, x, y, width, height, theme)
	default:
		renderAuthorGenericDiagram(b, labels, x, y, width, height, theme)
	}
}

func authorVisualForm(visual authorSlideVisual, content authorSlideContent) string {
	if form := normalizeAuthorVisualForm(visual.VisualForm); form != "" {
		return form
	}
	haystack := strings.ToLower(strings.Join([]string{
		visual.Type,
		visual.ID,
		visual.Instruction,
		content.Content,
		content.Notes,
	}, " "))
	switch {
	case strings.TrimSpace(visual.Type) == "map":
		return authorVisualFormMapRoute
	case containsAny(haystack, []string{"four_quadrant", "four quadrant", "quadrant", "2x2", "四象限", "象限"}):
		return authorVisualFormFourQuadrant
	case containsAny(haystack, []string{"spectrum", "gradient", "liquor color", "color spectrum", "six tea", "六大茶类", "光谱", "茶汤", "色谱"}):
		return authorVisualFormSpectrum
	case containsAny(haystack, []string{"map", "route", "region", "origin", "geography", "province", "产区", "地图", "地域", "路线"}):
		return authorVisualFormMapRoute
	case containsAny(haystack, []string{"process", "flow", "timeline", "craft", "fermentation", "firing", "工艺", "流程", "制作", "发酵", "杀青"}):
		return authorVisualFormProcessFlow
	case containsAny(haystack, []string{"parameter", "matrix", "temperature", "steep", "water", "ratio", "参数", "矩阵", "水温", "冲泡", "投茶"}):
		return authorVisualFormParameterMatrix
	case containsAny(haystack, []string{"sensory", "wheel", "taste", "flavor", "aroma", "五感", "风味", "香气", "口感", "品鉴"}):
		return authorVisualFormSensoryWheel
	case containsAny(haystack, []string{"callout", "object", "teaware", "vessel", "utensil", "器物", "茶具", "盖碗", "紫砂", "标注"}):
		return authorVisualFormObjectCallout
	default:
		return authorVisualFormGeneric
	}
}

func normalizeAuthorVisualForm(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "-", "_")
	value = strings.ReplaceAll(value, " ", "_")
	switch value {
	case authorVisualFormFourQuadrant, "quadrant", "two_by_two", "2x2":
		return authorVisualFormFourQuadrant
	case authorVisualFormSpectrum, "color_spectrum", "liquor_spectrum":
		return authorVisualFormSpectrum
	case authorVisualFormMapRoute, "region_map", "map", "route_map":
		return authorVisualFormMapRoute
	case authorVisualFormProcessFlow, "flow", "timeline", "craft_process":
		return authorVisualFormProcessFlow
	case authorVisualFormParameterMatrix, "matrix", "parameter_bridge", "parameters":
		return authorVisualFormParameterMatrix
	case authorVisualFormSensoryWheel, "wheel", "flavor_wheel", "taste_wheel":
		return authorVisualFormSensoryWheel
	case authorVisualFormObjectCallout, "callout", "object_annotation", "teaware_callout":
		return authorVisualFormObjectCallout
	case authorVisualFormGeneric:
		return authorVisualFormGeneric
	default:
		return ""
	}
}

func renderAuthorFourQuadrantDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormFourQuadrant)
	cx, cy := x+width/2, y+height/2
	fmt.Fprintf(b, `    <rect x="%d" y="%d" width="%d" height="%d" fill="none" stroke="%s" stroke-width="1.2" opacity="0.56"/>`+"\n", x, y, width, height, escapeAttr(theme.Muted))
	fmt.Fprintf(b, `    <path d="M%d %d V%d M%d %d H%d" stroke="%s" stroke-width="1.1" opacity="0.50"/>`+"\n", cx, y, y+height, x, cy, x+width, escapeAttr(theme.Muted))
	points := [][2]int{{x + width/4, y + height/3}, {x + width*3/4, y + height/3}, {x + width/4, y + height*3/4}, {x + width*3/4, y + height*3/4}}
	for i, pt := range points {
		fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" opacity="0.88"/>`+"\n", pt[0], pt[1]-9, compactDiagramRadius(height, 8), escapeAttr(authorDiagramColor(theme, i)))
		writeAuthorDiagramLabel(b, pt[0], pt[1]+18, 120, compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorSpectrumDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormSpectrum)
	count := clampInt(len(labels), 4, 6)
	gap := 6
	barW := (width - gap*(count-1)) / count
	if barW < 18 {
		barW = 18
	}
	barY := y + height/2 - compactDiagramRadius(height, 11)
	for i := 0; i < count; i++ {
		bh := compactDiagramRadius(height, 20) + i%3*8
		xx := x + i*(barW+gap)
		yy := barY - bh/2 + (i%2)*8
		fmt.Fprintf(b, `    <rect x="%d" y="%d" width="%d" height="%d" fill="%s" opacity="0.86"/>`+"\n", xx, yy, barW, bh, escapeAttr(authorSpectrumColor(theme, i)))
		writeAuthorDiagramLabel(b, xx+barW/2, y+height-8, maxInt(72, barW+20), compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, `    <path d="M%d %d H%d" stroke="%s" stroke-width="1" opacity="0.42"/>`+"\n", x, y+height/2, x+width, escapeAttr(theme.Muted))
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorMapRouteDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormMapRoute)
	fmt.Fprintf(b, `    <path d="M%d %d C%d %d %d %d %d %d C%d %d %d %d %d %d" fill="none" stroke="%s" stroke-width="1.2" opacity="0.38"/>`+"\n",
		x+width/5, y+height/6, x+width/2, y+4, x+width*4/5, y+height/5, x+width*3/4, y+height/2, x+width*2/3, y+height*4/5, x+width/3, y+height-4, x+width/5, y+height*2/3, escapeAttr(theme.Muted))
	fmt.Fprintf(b, `    <path d="M%d %d C%d %d %d %d %d %d" fill="none" stroke="%s" stroke-width="2.6" opacity="0.78"/>`+"\n",
		x+20, y+height-26, x+width/3, y+height/2, x+width*2/3, y+height/3, x+width-22, y+24, escapeAttr(theme.Accent))
	points := [][2]int{{x + 24, y + height - 28}, {x + width/2, y + height/2 - 3}, {x + width - 22, y + 24}}
	for i, pt := range points {
		fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" stroke="%s" stroke-width="2"/>`+"\n", pt[0], pt[1], compactDiagramRadius(height, 8), escapeAttr(authorDiagramColor(theme, i)), escapeAttr(theme.Background))
		writeAuthorDiagramLabel(b, pt[0], pt[1]+24, 120, compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorProcessFlowDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormProcessFlow)
	count := clampInt(len(labels), 3, 5)
	step := width / count
	midY := y + height/2
	for i := 0; i < count; i++ {
		xx := x + i*step
		fmt.Fprintf(b, `    <path d="M%d %d H%d" stroke="%s" stroke-width="2" opacity="0.55"/>`+"\n", xx+compactDiagramRadius(height, 9), midY, xx+step-compactDiagramRadius(height, 9), escapeAttr(theme.Muted))
		fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" opacity="0.90"/>`+"\n", xx+step/2, midY, compactDiagramRadius(height, 12), escapeAttr(authorDiagramColor(theme, i)))
		writeAuthorDiagramNumber(b, xx+step/2, midY+4, 38, compactDiagramFontSize(height), theme.Background, i+1)
		writeAuthorDiagramLabel(b, xx+step/2, midY+30, maxInt(72, step-10), compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorParameterMatrixDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormParameterMatrix)
	rows, cols := 3, 3
	cellW, cellH := width/cols, height/rows
	for r := 0; r <= rows; r++ {
		fmt.Fprintf(b, `    <path d="M%d %d H%d" stroke="%s" stroke-width="1" opacity="0.45"/>`+"\n", x, y+r*cellH, x+width, escapeAttr(theme.Muted))
	}
	for c := 0; c <= cols; c++ {
		fmt.Fprintf(b, `    <path d="M%d %d V%d" stroke="%s" stroke-width="1" opacity="0.45"/>`+"\n", x+c*cellW, y, y+height, escapeAttr(theme.Muted))
	}
	for i := 0; i < rows*cols && i < len(labels); i++ {
		c, r := i%cols, i/cols
		fmt.Fprintf(b, `    <rect x="%d" y="%d" width="%d" height="%d" fill="%s" opacity="0.14"/>`+"\n", x+c*cellW+4, y+r*cellH+4, cellW-8, cellH-8, escapeAttr(authorDiagramColor(theme, i)))
		writeAuthorDiagramLabel(b, x+c*cellW+cellW/2, y+r*cellH+cellH/2+4, maxInt(72, cellW-14), compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorSensoryWheelDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormSensoryWheel)
	cx, cy := x+width/2, y+height/2
	radius := minInt(width, height) / 3
	if radius < 28 {
		radius = minInt(width, height) / 2
	}
	fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="none" stroke="%s" stroke-width="1.2" opacity="0.54"/>`+"\n", cx, cy, radius, escapeAttr(theme.Muted))
	fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" opacity="0.15"/>`+"\n", cx, cy, radius/2, escapeAttr(theme.Accent))
	points := [][2]int{{cx, cy - radius}, {cx + radius, cy}, {cx, cy + radius}, {cx - radius, cy}, {cx + radius*7/10, cy - radius*7/10}, {cx - radius*7/10, cy + radius*7/10}}
	for i, pt := range points {
		fmt.Fprintf(b, `    <path d="M%d %d L%d %d" stroke="%s" stroke-width="1" opacity="0.45"/>`+"\n", cx, cy, pt[0], pt[1], escapeAttr(theme.Muted))
		fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" opacity="0.88"/>`+"\n", pt[0], pt[1], compactDiagramRadius(height, 7), escapeAttr(authorDiagramColor(theme, i)))
		writeAuthorDiagramLabel(b, pt[0], pt[1]+18, 112, compactDiagramFontSize(height), theme.Ink, "middle", authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorObjectCalloutDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormObjectCallout)
	cx, cy := x+width/2, y+height/2
	fmt.Fprintf(b, `    <ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity="0.10" stroke="%s" stroke-width="1.2"/>`+"\n", cx, cy, width/5, height/4, escapeAttr(theme.Accent), escapeAttr(theme.Muted))
	fmt.Fprintf(b, `    <path d="M%d %d C%d %d %d %d %d %d" fill="none" stroke="%s" stroke-width="2.4" opacity="0.72"/>`+"\n", cx-width/4, cy, cx-width/8, cy-height/4, cx+width/8, cy-height/4, cx+width/4, cy, escapeAttr(theme.Accent))
	callouts := [][4]int{
		{cx - width/5, cy - height/7, x + 8, y + 16},
		{cx + width/5, cy, x + width - 8, y + height/2},
		{cx, cy + height/4, x + width/2, y + height - 10},
	}
	for i, c := range callouts {
		fmt.Fprintf(b, `    <path d="M%d %d L%d %d" stroke="%s" stroke-width="1" opacity="0.58"/>`+"\n", c[0], c[1], c[2], c[3], escapeAttr(theme.Muted))
		anchor := "middle"
		if i == 0 {
			anchor = "start"
		} else if i == 1 {
			anchor = "end"
		}
		writeAuthorDiagramLabel(b, c[2], c[3], 118, compactDiagramFontSize(height), theme.Ink, anchor, authorLabelAt(labels, i))
	}
	fmt.Fprintf(b, "  </g>\n")
}

func renderAuthorGenericDiagram(b *strings.Builder, labels []string, x, y, width, height int, theme authorTheme) {
	fmt.Fprintf(b, `  <g slide:role="shape" slide:shape-type="freeform" data-svglide-visual-form="%s">`+"\n", authorVisualFormGeneric)
	fmt.Fprintf(b, `    <path d="M%d %d H%d" stroke="%s" stroke-width="1.2" opacity="0.62"/>`+"\n", x, y+height/2, x+width, escapeAttr(theme.Muted))
	step := width
	if len(labels) > 1 {
		step = width / (len(labels) - 1)
	}
	for i, label := range labels {
		cx := x
		if len(labels) > 1 {
			cx = x + i*step
		}
		cy := y + height/2
		if i%2 == 1 {
			cy -= compactDiagramRadius(height, 22)
		} else {
			cy += compactDiagramRadius(height, 22)
		}
		r := compactDiagramRadius(height, 14+(i%3)*3)
		fmt.Fprintf(b, `    <circle cx="%d" cy="%d" r="%d" fill="%s" opacity="0.88"/>`+"\n", cx, cy, r, escapeAttr(authorDiagramColor(theme, i)))
		fmt.Fprintf(b, `    <path d="M%d %d L%d %d" stroke="%s" stroke-width="1" opacity="0.55"/>`+"\n", cx, cy, cx, y+height/2, escapeAttr(theme.Muted))
		writeAuthorDiagramLabel(b, cx, cy+compactDiagramRadius(height, 24), 128, compactDiagramFontSize(height), theme.Ink, "middle", label)
	}
	fmt.Fprintf(b, "  </g>\n")
}

func writeAuthorDiagramNumber(b *strings.Builder, x, baselineY, maxWidth int, fontSize int, color string, value int) {
	writeAuthorDiagramLabelWithFamily(b, x, baselineY, maxWidth, fontSize, color, "middle", fmt.Sprintf("%02d", value), authorFontNumber, 700)
}

func writeAuthorDiagramLabel(b *strings.Builder, x, baselineY, maxWidth int, fontSize int, color string, anchor string, text string) {
	writeAuthorDiagramLabelWithFamily(b, x, baselineY, maxWidth, fontSize, color, anchor, text, authorFontLabel, 600)
}

func writeAuthorDiagramLabelWithFamily(b *strings.Builder, x, baselineY, maxWidth int, fontSize int, color string, anchor string, text string, family string, weight int) {
	text = strings.TrimSpace(text)
	if text == "" {
		return
	}
	width := clampInt(len([]rune(text))*fontSize/2+24, 44, maxInt(44, maxWidth))
	height := maxInt(fontSize*2, 24)
	left := x - width/2
	textAlign := "center"
	switch anchor {
	case "start":
		left = x
		textAlign = "left"
	case "end":
		left = x - width
		textAlign = "right"
	}
	top := baselineY - fontSize
	fmt.Fprintf(b, `    <foreignObject x="%d" y="%d" width="%d" height="%d" slide:role="shape" slide:shape-type="text">`+"\n", left, top, width, height)
	fmt.Fprintf(b, `      <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font-family:%s;color:%s;font-size:%dpx;line-height:1.12;font-weight:%d;text-align:%s;">%s</p>`+"\n", family, escapeAttr(color), fontSize, weight, textAlign, escapeText(text))
	fmt.Fprintf(b, "    </foreignObject>\n")
}

func authorSpectrumColor(theme authorTheme, index int) string {
	switch index % 6 {
	case 0:
		return "#D9D7A3"
	case 1:
		return "#A7B56A"
	case 2:
		return "#C89A4B"
	case 3:
		return theme.Accent
	case 4:
		return "#A63E2B"
	default:
		return "#6C4A2E"
	}
}

func authorLabelAt(labels []string, index int) string {
	if len(labels) == 0 {
		return "item"
	}
	if index >= 0 && index < len(labels) {
		return labels[index]
	}
	return labels[index%len(labels)]
}

func compactDiagramFontSize(height int) int {
	if height < 120 {
		return 10
	}
	if height < 180 {
		return 11
	}
	return 13
}

func compactDiagramRadius(height int, value int) int {
	if height < 120 {
		return maxInt(5, value*2/3)
	}
	return value
}
