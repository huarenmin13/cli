package svglide

import (
	"encoding/json"
	"fmt"
	"html"
	"path/filepath"
	"strings"
)

const (
	defaultSlideWidth      = 960
	defaultSlideHeight     = 540
	defaultAuthorBgColor   = "#FFFFFF"
	defaultAuthorInkColor  = "#111827"
	defaultAuthorMuteColor = "#6B7280"
	defaultAuthorAccent    = "#2563EB"
	svgAuthorReceipt       = "receipts/svg_author.json"
)

type AuthorReport struct {
	Status string   `json:"status"`
	Slides []string `json:"slides"`
}

type authorDeck struct {
	Title  string            `json:"title"`
	Slides []authorDeckSlide `json:"slides"`
}

type authorDeckSlide struct {
	ID               string `json:"id"`
	Title            string `json:"title"`
	Summary          string `json:"summary"`
	Role             string `json:"role"`
	VisualRole       string `json:"visual_role"`
	VisualIntent     string `json:"visual_intent"`
	KeyMessage       string `json:"key_message"`
	Path             string `json:"path"`
	LayoutFamily     string `json:"layout_family"`
	LayoutArchetype  string `json:"layout_archetype"`
	LayoutSignature  string `json:"layout_signature"`
	StoryFunction    string `json:"story_function"`
	PrimaryAssetRole string `json:"primary_asset_role"`
	FusionCandidate  bool   `json:"fusion_candidate"`
}

type authorSlideContentFile struct {
	Slides []authorSlideContent `json:"slides"`
}

type authorSlideContent struct {
	ID         string              `json:"id"`
	Content    string              `json:"content"`
	Notes      string              `json:"notes"`
	SourceRefs []string            `json:"source_refs"`
	Visuals    []authorSlideVisual `json:"visuals"`
}

type authorSlideVisual struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Instruction string `json:"instruction"`
}

type authorAsset = deckAsset

type authorVisualSystem struct {
	ColorSystem struct {
		Background string `json:"background"`
		Ink        string `json:"ink"`
		Muted      string `json:"muted"`
		Accent     string `json:"accent"`
	} `json:"color_system"`
	Typography struct {
		Title int `json:"title"`
		Body  int `json:"body"`
	} `json:"typography"`
	LayoutLanguage string `json:"layout_language"`
}

type authorTheme struct {
	Background string
	Ink        string
	Muted      string
	Accent     string
	TitleSize  int
	BodySize   int
}

type authorSlideTarget struct {
	Slide   authorDeckSlide
	Content authorSlideContent
	Assets  []authorAsset
	Path    string
	Target  string
	Page    int
}

func AuthorSlides(root string) (AuthorReport, error) {
	return authorSlides(root, nil)
}

func authorSlides(root string, selectedPaths map[string]bool) (AuthorReport, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return AuthorReport{}, err
	}

	deck, err := readAuthorDeck(safeRoot, strings.TrimSpace(run.Artifacts.Deck))
	if err != nil {
		return AuthorReport{}, err
	}
	contentByID, err := readAuthorContent(safeRoot, "content/slide_content.json")
	if err != nil {
		return AuthorReport{}, err
	}
	theme, err := readAuthorTheme(safeRoot, "brief/visual_system.json")
	if err != nil {
		return AuthorReport{}, err
	}
	assetsBySlideID, err := readAuthorAssets(safeRoot, assetsManifestPath)
	if err != nil {
		return AuthorReport{}, err
	}
	if err := validateAuthorDeckContent(deck, contentByID); err != nil {
		return AuthorReport{}, err
	}

	targets := make([]authorSlideTarget, 0, len(deck.Slides))
	report := AuthorReport{
		Status: StatusDone,
		Slides: make([]string, 0, len(deck.Slides)),
	}
	for i, slide := range deck.Slides {
		slidePath, err := previewSlideObjectPath(slide.Path)
		if err != nil {
			return AuthorReport{}, err
		}
		if selectedPaths != nil && !selectedPaths[slidePath] {
			continue
		}
		target, err := ensureRunFileTargetForWrite(safeRoot, slidePath)
		if err != nil {
			return AuthorReport{}, err
		}
		targets = append(targets, authorSlideTarget{
			Slide:   slide,
			Content: contentByID[strings.TrimSpace(slide.ID)],
			Assets:  selectAuthorRenderableImageAssets(safeRoot, contentByID[strings.TrimSpace(slide.ID)], assetsBySlideID[strings.TrimSpace(slide.ID)]),
			Path:    slidePath,
			Target:  target,
			Page:    i + 1,
		})
		report.Slides = append(report.Slides, slidePath)
	}
	receiptTarget, err := ensureRunFileTargetForWrite(safeRoot, svgAuthorReceipt)
	if err != nil {
		return AuthorReport{}, err
	}

	for _, target := range targets {
		svg := renderAuthorSVG(deck.Title, target.Slide, target.Content, target.Assets, theme, target.Page, len(deck.Slides))
		if err := writeText(target.Target, svg); err != nil {
			return AuthorReport{}, err
		}
	}
	if err := writeAuthorVisualReceipts(safeRoot, deck, contentByID, assetsBySlideID, selectedPaths); err != nil {
		return AuthorReport{}, err
	}
	if err := writeJSON(receiptTarget, StageReceipt{
		Stage:     StageSVGAuthor,
		Status:    StatusDone,
		Artifacts: report.Slides,
	}); err != nil {
		return AuthorReport{}, err
	}
	return report, nil
}

func writeAuthorVisualReceipts(safeRoot string, deck authorDeck, contentByID map[string]authorSlideContent, assetsBySlideID map[string][]authorAsset, selectedPaths map[string]bool) error {
	existingByID := map[string]visualReceipt{}
	if existing, err := readVisualReceipts(safeRoot); err == nil {
		for _, receipt := range existing.Slides {
			id := strings.TrimSpace(receipt.SlideID)
			if id != "" {
				existingByID[id] = receipt
			}
		}
	}
	out := visualReceiptsFile{Slides: make([]visualReceipt, 0, len(deck.Slides))}
	for i, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		receipt, ok := existingByID[id]
		slidePath, pathErr := previewSlideObjectPath(slide.Path)
		shouldRefresh := !ok || selectedPaths == nil || (pathErr == nil && selectedPaths[slidePath])
		if shouldRefresh {
			receipt = authorVisualReceiptForSlide(slide, contentByID[id], assetsBySlideID[id], i)
		}
		out.Slides = append(out.Slides, receipt)
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, visualReceiptsPath)
	if err != nil {
		return err
	}
	return writeJSON(target, out)
}

func authorVisualReceiptForSlide(slide authorDeckSlide, content authorSlideContent, assets []authorAsset, index int) visualReceipt {
	layoutFamily := firstNonEmpty(slide.LayoutFamily, inferAuthorLayoutFamily(slide, content, assets))
	layoutSignature := firstNonEmpty(slide.LayoutSignature, inferAuthorLayoutSignature(layoutFamily, assets, index))
	layoutArchetype := firstNonEmpty(slide.LayoutArchetype, inferAuthorLayoutArchetype(layoutFamily, layoutSignature))
	primaryAsset, assetRole := authorPrimaryAssetEvidence(slide, assets)
	pageDifference := "opening page"
	if index > 0 {
		pageDifference = "different content block and slide order from previous page"
	}
	dataRationale := ""
	for _, visual := range content.Visuals {
		if strings.TrimSpace(visual.Type) == "chart" {
			dataRationale = firstNonEmpty(visual.Instruction, "chart visual requested by slide content")
			break
		}
	}
	return visualReceipt{
		SlideID:                    strings.TrimSpace(slide.ID),
		StoryJob:                   firstNonEmpty(slide.StoryFunction, slide.Role, "proof"),
		LayoutFamily:               layoutFamily,
		LayoutArchetype:            layoutArchetype,
		LayoutSignature:            layoutSignature,
		ThumbnailJob:               firstNonEmpty(slide.Title, slide.KeyMessage),
		VisualCenter:               firstNonEmpty(primaryAsset, slide.Title, slide.KeyMessage),
		TopicFitClaim:              firstNonEmpty(slide.KeyMessage, slide.Summary, content.Content),
		InformationDensityPlan:     "one clear claim with supporting visual or concise text",
		PageDifferenceFromPrevious: pageDifference,
		PrimaryAsset:               primaryAsset,
		AssetRole:                  assetRole,
		FontRoleUsage: map[string]string{
			"display": "Noto Serif CJK SC",
			"body":    "Noto Sans CJK SC",
			"number":  "Roboto Mono",
			"label":   "PingFang SC",
		},
		CompositionIntent:   "local author fallback layout with topic-specific text and available assets",
		DataVisualRationale: dataRationale,
		SourceEvidence:      append([]string{}, content.SourceRefs...),
		FusionSpec:          visualFusionReceipt{Enabled: false},
		QAExpectations:      []string{"no process text", "font roles present", "layout is readable"},
	}
}

func inferAuthorLayoutFamily(slide authorDeckSlide, content authorSlideContent, assets []authorAsset) string {
	if len(assets) > 0 && isCoverSlide(slide) {
		return "character_product_focus"
	}
	for _, visual := range content.Visuals {
		switch strings.TrimSpace(visual.Type) {
		case "chart", "table":
			return "data_scoreboard"
		}
	}
	if len(assets) > 1 {
		return "evidence_board"
	}
	return "quiet_synthesis"
}

func inferAuthorLayoutSignature(layoutFamily string, assets []authorAsset, index int) string {
	switch layoutFamily {
	case "character_product_focus":
		return "image_claim"
	case "data_scoreboard":
		return "data_panel"
	case "evidence_board":
		return "evidence_collage"
	default:
		if index%2 == 1 {
			return "text_evidence_panel"
		}
		return "single_claim_poster"
	}
}

func inferAuthorLayoutArchetype(layoutFamily string, layoutSignature string) string {
	signature := strings.ToLower(strings.TrimSpace(layoutSignature))
	switch {
	case strings.Contains(signature, "waterfall") || strings.Contains(signature, "bridge"):
		return "waterfall_bridge"
	case strings.Contains(signature, "bubble") || strings.Contains(signature, "peer"):
		return "peer_bubble_field"
	case strings.Contains(signature, "ledger") || strings.Contains(signature, "statement"):
		return "statement_ledger"
	case strings.Contains(signature, "timeline") || strings.Contains(signature, "route"):
		return "timeline_path"
	case strings.Contains(signature, "risk") || strings.Contains(signature, "radar"):
		return "risk_radar"
	case strings.Contains(signature, "split") || strings.Contains(signature, "left_text_right_chart"):
		return "image_argument_split"
	case strings.Contains(signature, "evidence") || strings.Contains(signature, "collage"):
		return "evidence_collage"
	case strings.Contains(signature, "poster"):
		return "poster_stat_lockup"
	}
	switch strings.TrimSpace(layoutFamily) {
	case "full_bleed_hero":
		return "full_bleed_photo_title"
	case "data_scoreboard":
		return "data_scoreboard"
	case "evidence_board":
		return "evidence_collage"
	case "timeline_route":
		return "timeline_path"
	case "character_product_focus":
		return "annotated_image"
	case "image_text_fusion_split":
		return "image_argument_split"
	default:
		return "poster_stat_lockup"
	}
}

func authorPrimaryAssetEvidence(slide authorDeckSlide, assets []authorAsset) (string, string) {
	for _, asset := range assets {
		if path := assetPath(asset); path != "" {
			return path, firstNonEmpty(slide.PrimaryAssetRole, asset.Usage, "topic anchor")
		}
	}
	return "", firstNonEmpty(slide.PrimaryAssetRole, "none")
}

func readAuthorDeck(safeRoot string, deckPath string) (authorDeck, error) {
	if deckPath == "" {
		return authorDeck{}, fmt.Errorf("deck artifact path is empty")
	}
	raw, err := readRunRegularArtifact(safeRoot, deckPath)
	if err != nil {
		return authorDeck{}, fmt.Errorf("read deck %q: %w", deckPath, err)
	}
	var deck authorDeck
	if err := json.Unmarshal(raw, &deck); err != nil {
		return authorDeck{}, fmt.Errorf("read deck %q: %w", deckPath, err)
	}
	if len(deck.Slides) == 0 {
		return authorDeck{}, fmt.Errorf("deck %q contains no slides", deckPath)
	}
	return deck, nil
}

func readAuthorContent(safeRoot string, path string) (map[string]authorSlideContent, error) {
	raw, err := readRunRegularArtifact(safeRoot, path)
	if err != nil {
		return nil, fmt.Errorf("read slide content %q: %w", path, err)
	}
	var file authorSlideContentFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return nil, fmt.Errorf("read slide content %q: %w", path, err)
	}
	byID := make(map[string]authorSlideContent, len(file.Slides))
	for _, slide := range file.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			return nil, fmt.Errorf("slide content id must not be empty")
		}
		if _, exists := byID[id]; exists {
			return nil, fmt.Errorf("slide content id %q is duplicated", id)
		}
		byID[id] = slide
	}
	return byID, nil
}

func readAuthorAssets(safeRoot string, path string) (map[string][]authorAsset, error) {
	file, err := readDeckAssetsArtifact(safeRoot, path)
	if err != nil {
		return nil, fmt.Errorf("read assets manifest %q: %w", path, err)
	}
	bySlideID := make(map[string][]authorAsset, len(file.Assets))
	for _, asset := range file.Assets {
		if assetStatus(asset) != "ready" {
			continue
		}
		slideID := assetSlideID(asset)
		bySlideID[slideID] = append(bySlideID[slideID], asset)
	}
	return bySlideID, nil
}

func selectAuthorRenderableImageAssets(safeRoot string, content authorSlideContent, assets []authorAsset) []authorAsset {
	if len(content.Visuals) == 0 || len(assets) == 0 {
		return nil
	}
	assetByID := make(map[string]authorAsset, len(assets))
	for _, asset := range assets {
		if assetType(asset) != "image" {
			continue
		}
		id := assetID(asset)
		if id == "" {
			continue
		}
		assetByID[id] = asset
	}
	for _, visual := range content.Visuals {
		if strings.TrimSpace(visual.Type) != "image" {
			continue
		}
		id := strings.TrimSpace(visual.ID)
		if id == "" {
			continue
		}
		asset, ok := assetByID[id]
		if !ok {
			continue
		}
		if !authorImageAssetUsable(safeRoot, asset) {
			continue
		}
		return []authorAsset{asset}
	}
	return nil
}

func authorImageAssetUsable(_ string, asset authorAsset) bool {
	if assetType(asset) != "image" {
		return false
	}
	path := assetPath(asset)
	return path != ""
}

func validateAuthorDeckContent(deck authorDeck, contentByID map[string]authorSlideContent) error {
	deckIDs := make(map[string]bool, len(deck.Slides))
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			return fmt.Errorf("deck slide id must not be empty")
		}
		if deckIDs[id] {
			return fmt.Errorf("deck slide id %q is duplicated", id)
		}
		deckIDs[id] = true
		if _, ok := contentByID[id]; !ok {
			return fmt.Errorf("deck slide id %q is missing from slide content", id)
		}
	}
	return nil
}

func readAuthorTheme(safeRoot string, path string) (authorTheme, error) {
	raw, err := readRunRegularArtifact(safeRoot, path)
	if err != nil {
		return authorTheme{}, fmt.Errorf("read visual system %q: %w", path, err)
	}
	var visual authorVisualSystem
	if err := json.Unmarshal(raw, &visual); err != nil {
		return authorTheme{}, fmt.Errorf("read visual system %q: %w", path, err)
	}
	theme := authorTheme{
		Background: normalizeAuthorColor(visual.ColorSystem.Background, defaultAuthorBgColor),
		Ink:        normalizeAuthorColor(visual.ColorSystem.Ink, defaultAuthorInkColor),
		Muted:      normalizeAuthorColor(visual.ColorSystem.Muted, defaultAuthorMuteColor),
		Accent:     normalizeAuthorColor(visual.ColorSystem.Accent, defaultAuthorAccent),
		TitleSize:  visual.Typography.Title,
		BodySize:   visual.Typography.Body,
	}
	if theme.TitleSize <= 0 {
		theme.TitleSize = 32
	}
	if theme.BodySize <= 0 {
		theme.BodySize = 16
	}
	return theme, nil
}

func normalizeAuthorColor(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if isAllowedAuthorHexColor(value) {
		return value
	}
	return fallback
}

func isAllowedAuthorHexColor(value string) bool {
	if len(value) != 4 && len(value) != 7 && len(value) != 9 {
		return false
	}
	if value[0] != '#' {
		return false
	}
	for _, r := range value[1:] {
		if (r >= '0' && r <= '9') || (r >= 'a' && r <= 'f') || (r >= 'A' && r <= 'F') {
			continue
		}
		return false
	}
	return true
}

func renderAuthorSVG(deckTitle string, slide authorDeckSlide, content authorSlideContent, assets []authorAsset, theme authorTheme, page int, total int) string {
	title := firstNonEmpty(slide.Title, "Untitled slide")
	keyMessage := firstNonEmpty(slide.KeyMessage, slide.Summary)
	bodyLines := authorBodyLines(content.Content)
	footer := strings.TrimSpace(deckTitle)
	if footer == "" {
		footer = "SVGlide"
	}
	footnote := authorSourceFootnote(content.SourceRefs)
	heroAsset := firstReadyAuthorImageAsset(assets)
	contentWidth := 848
	contentHeight := 404
	if heroAsset != nil {
		contentWidth = 500
	}

	var b strings.Builder
	fmt.Fprintf(&b, `<svg xmlns="%s" xmlns:slide="%s" width="%d" height="%d" viewBox="0 0 960 540" slide:role="slide">`+"\n", svgNamespace, slideNamespace, defaultSlideWidth, defaultSlideHeight)
	fmt.Fprintf(&b, "  <style>:root{--font-display:\"Noto Serif CJK SC\",\"Songti SC\",serif;--font-body:\"Noto Sans CJK SC\",\"PingFang SC\",sans-serif;--font-number:\"Roboto Mono\",\"SFMono-Regular\",monospace;--font-label:\"PingFang SC\",\"Noto Sans CJK SC\",sans-serif;}</style>\n")
	if notes := strings.TrimSpace(content.Notes); notes != "" {
		fmt.Fprintf(&b, "  <slide:note>%s</slide:note>\n", escapeText(notes))
	}
	fmt.Fprintf(&b, `  <rect x="0" y="0" width="960" height="540" fill="%s" data-role="background"/>`+"\n", escapeAttr(theme.Background))
	fmt.Fprintf(&b, `  <rect x="0" y="0" width="960" height="8" fill="%s"/>`+"\n", escapeAttr(theme.Accent))
	fmt.Fprintf(&b, `  <foreignObject x="56" y="48" width="%d" height="%d" slide:role="shape" slide:shape-type="text">`+"\n", contentWidth, contentHeight)
	fmt.Fprintf(&b, `    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:var(--font-body);color:%s;">`+"\n", escapeAttr(theme.Ink))
	fmt.Fprintf(&b, `      <div style="font-family:var(--font-display);font-size:%dpx;font-weight:700;line-height:1.16;margin-bottom:16px;">%s</div>`+"\n", theme.TitleSize, escapeText(title))
	if keyMessage != "" {
		fmt.Fprintf(&b, `      <div style="font-size:%dpx;line-height:1.35;color:%s;margin-bottom:22px;">%s</div>`+"\n", maxInt(theme.BodySize+4, 18), escapeAttr(theme.Accent), escapeText(keyMessage))
	}
	fmt.Fprintf(&b, `      <div style="border:1px solid #E5E7EB;border-radius:6px;padding:20px 24px;min-height:190px;background:#F9FAFB;">`+"\n")
	for _, line := range bodyLines {
		fmt.Fprintf(&b, `        <div style="font-size:%dpx;line-height:1.55;margin-bottom:8px;">- %s</div>`+"\n", theme.BodySize, escapeText(line))
	}
	fmt.Fprintf(&b, "      </div>\n")
	fmt.Fprintf(&b, "    </div>\n")
	fmt.Fprintf(&b, "  </foreignObject>\n")
	if footnote != "" {
		fmt.Fprintf(&b, `  <foreignObject x="56" y="456" width="520" height="18" slide:role="shape" slide:shape-type="text">`+"\n")
		fmt.Fprintf(&b, `    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:var(--font-label);color:%s;font-size:12px;line-height:1.2;">%s</div>`+"\n", escapeAttr(theme.Muted), escapeText(footnote))
		fmt.Fprintf(&b, "  </foreignObject>\n")
	}
	if heroAsset != nil {
		fmt.Fprintf(&b, `  <image slide:role="image" slide:shape-type="image" href="%s" x="600" y="160" width="304" height="190"/>`+"\n", escapeAttr(svgHrefForRunAsset(slide.Path, assetPath(*heroAsset))))
	}
	fmt.Fprintf(&b, `  <foreignObject x="56" y="482" width="848" height="32" slide:role="shape" slide:shape-type="text">`+"\n")
	fmt.Fprintf(&b, `    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:var(--font-label);color:%s;font-size:12px;display:flex;justify-content:space-between;">`+"\n", escapeAttr(theme.Muted))
	fmt.Fprintf(&b, `      <span>%s</span><span style="font-family:var(--font-number)">%d / %d</span>`+"\n", escapeText(footer), page, total)
	fmt.Fprintf(&b, "    </div>\n")
	fmt.Fprintf(&b, "  </foreignObject>\n")
	fmt.Fprintf(&b, "</svg>\n")
	return b.String()
}

func svgHrefForRunAsset(slidePath string, runAssetPath string) string {
	runAssetPath = strings.TrimSpace(runAssetPath)
	if runAssetPath == "" ||
		strings.HasPrefix(runAssetPath, "data:") ||
		strings.HasPrefix(runAssetPath, "http://") ||
		strings.HasPrefix(runAssetPath, "https://") {
		return runAssetPath
	}
	cleanSlidePath, err := previewSlideObjectPath(slidePath)
	if err != nil {
		return runAssetPath
	}
	rel, err := filepath.Rel(filepath.ToSlash(filepath.Dir(cleanSlidePath)), filepath.ToSlash(runAssetPath))
	if err != nil {
		return runAssetPath
	}
	return filepath.ToSlash(rel)
}

func authorBodyLines(content string) []string {
	var lines []string
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			lines = append(lines, line)
		}
	}
	if len(lines) == 0 {
		return []string{"No content provided."}
	}
	return lines
}

func authorSourceFootnote(sourceRefs []string) string {
	if len(sourceRefs) == 0 {
		return ""
	}
	refs := make([]string, 0, len(sourceRefs))
	for _, ref := range sourceRefs {
		if trimmed := strings.TrimSpace(ref); trimmed != "" {
			refs = append(refs, trimmed)
		}
	}
	if len(refs) == 0 {
		return ""
	}
	return "来源：" + strings.Join(refs, " / ")
}

func firstReadyAuthorImageAsset(assets []authorAsset) *authorAsset {
	for i := range assets {
		asset := &assets[i]
		if assetType(*asset) != "image" {
			continue
		}
		if assetPath(*asset) == "" {
			continue
		}
		return asset
	}
	return nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func escapeText(value string) string {
	return html.EscapeString(value)
}

func escapeAttr(value string) string {
	return html.EscapeString(value)
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
}
