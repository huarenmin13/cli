package svglide

import (
	"encoding/json"
	"fmt"
	"html"
	"path/filepath"
	"strconv"
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
	authorFontDisplay      = "Noto Serif SC"
	authorFontBody         = "Noto Sans SC"
	authorFontNumber       = "Roboto Mono"
	authorFontLabel        = "Noto Sans SC"
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
	ID                   string                     `json:"id"`
	Content              string                     `json:"content"`
	CentralClaim         string                     `json:"central_claim"`
	AudienceTakeaway     string                     `json:"audience_takeaway"`
	SupportingPoints     []authorSupportingPoint    `json:"supporting_points"`
	SourceBoundFacts     []authorSourceBoundFact    `json:"source_bound_facts"`
	ExamplesOrParameters []authorExampleOrParameter `json:"examples_or_parameters"`
	VisualDataItems      []authorVisualDataItem     `json:"visual_data_items"`
	SoWhat               string                     `json:"so_what"`
	Notes                string                     `json:"notes"`
	SourceRefs           []string                   `json:"source_refs"`
	Visuals              []authorSlideVisual        `json:"visuals"`
}

type authorSlideVisual struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Instruction string `json:"instruction"`
	VisualForm  string `json:"visual_form"`
}

type authorSupportingPoint = contentPayloadSupportingPoint
type authorSourceBoundFact = contentPayloadSourceBoundFact
type authorExampleOrParameter = contentPayloadExampleOrParameter
type authorVisualDataItem = contentPayloadVisualDataItem

type authorAsset = deckAsset

type authorVisualSystem struct {
	ColorSystem struct {
		Background  string   `json:"background"`
		Backgrounds []string `json:"backgrounds"`
		Ink         string   `json:"ink"`
		Muted       string   `json:"muted"`
		Accent      string   `json:"accent"`
		Body        string   `json:"body"`
		Rule        string   `json:"rule"`
		TeaAmber    string   `json:"tea_amber"`
		LeafGreen   string   `json:"leaf_green"`
		Cinnabar    string   `json:"cinnabar"`
	} `json:"color_system"`
	Typography struct {
		Title json.RawMessage `json:"title"`
		Body  json.RawMessage `json:"body"`
	} `json:"typography"`
	LayoutLanguage json.RawMessage `json:"layout_language"`
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
	if err := writeRequiredToolCallReceipts(safeRoot, StageSVGAuthor, run); err != nil {
		return AuthorReport{}, err
	}
	return report, nil
}

func writeRequiredToolCallReceipts(safeRoot string, stage string, run Run) error {
	calls, err := RequiredToolCallsForStage(stage, run)
	if err != nil {
		return err
	}
	for _, call := range calls {
		path := filepath.ToSlash(filepath.Join("receipts", "tool_calls", stage, call.ID+".json"))
		target, err := ensureRunFileTargetForWrite(safeRoot, path)
		if err != nil {
			return err
		}
		receipt := map[string]any{
			"protocol":          ProtocolAnyGenSVGSlides,
			"stage":             stage,
			"call_id":           call.ID,
			"prompt_id":         call.PromptID,
			"invocation":        call.Invocation,
			"condition":         call.Condition,
			"condition_matched": true,
			"order":             call.Order,
			"cardinality":       call.Cardinality,
			"consumed":          append([]string{}, call.Consumes...),
			"produced":          append([]string{}, call.Produces...),
			"status":            StatusDone,
		}
		if err := writeJSON(target, receipt); err != nil {
			return err
		}
	}
	return nil
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
	chartReceipt := visualChartReceipt{Renderer: "none"}
	hasDiagram := false
	diagramVisualForm := ""
	for _, visual := range content.Visuals {
		switch strings.TrimSpace(visual.Type) {
		case "chart":
			dataRationale = firstNonEmpty(visual.Instruction, "chart visual requested by slide content")
			chartReceipt = visualChartReceipt{
				ChartID:          strings.TrimSpace(visual.ID),
				Renderer:         "none",
				WhyChartIsNeeded: dataRationale,
			}
		case "diagram", "map", "icon", "illustration":
			hasDiagram = true
			if diagramVisualForm == "" {
				diagramVisualForm = authorVisualForm(visual, content)
			}
		}
	}
	fusionSpec := visualFusionReceipt{Enabled: false}
	if strings.TrimSpace(slide.LayoutFamily) == "image_text_fusion_split" {
		fusionSpec = visualFusionReceipt{
			Enabled:       true,
			SeamSide:      "image/text boundary",
			SampledColor:  "#F4EFE4",
			PanelColor:    "#F4EFE4",
			FadeWidth:     120,
			SubjectSafety: "text stays in the quiet side of the composition; image remains a primary evidence anchor",
		}
	}
	textCarrier := "open_grid"
	if isCoverSlide(slide) && primaryAsset != "" {
		textCarrier = string(textCarrierImageDarkZone)
	} else if hasDiagram {
		textCarrier = string(textCarrierLineAnnotation)
	}
	shapeLanguage := "minimal"
	if hasDiagram && diagramVisualForm != "" && diagramVisualForm != authorVisualFormGeneric {
		shapeLanguage = "diagram_" + diagramVisualForm
	} else if primaryAsset != "" {
		shapeLanguage = "image_forward"
	} else if hasDiagram {
		shapeLanguage = "rule_annotation"
	}
	fontRoles := map[string]string{
		"display": authorFontDisplay,
		"body":    authorFontBody,
		"number":  "Roboto Mono",
		"label":   authorFontLabel,
	}
	return visualReceipt{
		SlideID:                    strings.TrimSpace(slide.ID),
		StoryJob:                   firstNonEmpty(slide.StoryFunction, slide.Role, "proof"),
		LayoutFamily:               layoutFamily,
		LayoutArchetype:            layoutArchetype,
		LayoutSignature:            layoutSignature,
		ThumbnailJob:               firstNonEmpty(slide.Title, slide.KeyMessage),
		VisualCenter:               firstNonEmpty(primaryAsset, slide.Title, slide.KeyMessage),
		TopicFitClaim:              firstNonEmpty(content.CentralClaim, slide.KeyMessage, slide.Summary, content.Content),
		InformationDensityPlan:     deriveAuthorInformationDensityPlan(content),
		PageDifferenceFromPrevious: pageDifference,
		PrimaryAsset:               primaryAsset,
		AssetRole:                  assetRole,
		FontRoleUsage:              fontRoles,
		TypographyRoleUsage:        fontRoles,
		CompositionIntent:          firstNonEmpty(slide.VisualIntent, "local author fallback layout with topic-specific text and available assets"),
		DataVisualRationale:        dataRationale,
		SourceEvidence:             append([]string{}, content.SourceRefs...),
		ContainerFitPlan:           "use open grid by default; use cards only for explicit grouping or complex image backgrounds",
		ContainerDecision:          "content decides carrier; no default card wrapper",
		TextCarrier:                textCarrier,
		ShapeLanguage:              shapeLanguage,
		CardBudget: visualCardBudget{
			CardCount:         0,
			WhyCardsAreNeeded: "none: default text carrier is open layout",
		},
		ChartReceipt:   chartReceipt,
		FusionSpec:     fusionSpec,
		QAExpectations: []string{"no process text", "font roles present", "layout is readable"},
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
	var file deckAssetsFile
	var err error
	if filepath.ToSlash(strings.TrimSpace(path)) == assetsManifestPath {
		file, err = readAssetsManifest(safeRoot)
	} else {
		file, err = readDeckAssetsArtifact(safeRoot, path)
	}
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
		Background: normalizeAuthorColor(firstNonEmpty(visual.ColorSystem.Background, firstString(visual.ColorSystem.Backgrounds)), defaultAuthorBgColor),
		Ink:        normalizeAuthorColor(visual.ColorSystem.Ink, defaultAuthorInkColor),
		Muted:      normalizeAuthorColor(firstNonEmpty(visual.ColorSystem.Muted, visual.ColorSystem.Body, visual.ColorSystem.Rule), defaultAuthorMuteColor),
		Accent:     normalizeAuthorColor(firstNonEmpty(visual.ColorSystem.Accent, visual.ColorSystem.TeaAmber, visual.ColorSystem.Cinnabar, visual.ColorSystem.LeafGreen), defaultAuthorAccent),
		TitleSize:  authorThemeSize(visual.Typography.Title, 32),
		BodySize:   authorThemeSize(visual.Typography.Body, 16),
	}
	return theme, nil
}

func authorThemeSize(raw json.RawMessage, fallback int) int {
	text := strings.TrimSpace(string(raw))
	if text == "" || text == "null" {
		return fallback
	}
	var n int
	if err := json.Unmarshal(raw, &n); err == nil && n > 0 {
		return n
	}
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		if parsed := firstPositiveIntInString(s); parsed > 0 {
			return parsed
		}
	}
	return fallback
}

func firstPositiveIntInString(value string) int {
	start := -1
	for i, r := range value {
		if r >= '0' && r <= '9' {
			if start < 0 {
				start = i
			}
			continue
		}
		if start >= 0 {
			n, _ := strconv.Atoi(value[start:i])
			return n
		}
	}
	if start >= 0 {
		n, _ := strconv.Atoi(value[start:])
		return n
	}
	return 0
}

func firstString(values []string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
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
	keyMessage := firstNonEmpty(slide.KeyMessage, slide.Summary, content.CentralClaim)
	bodyLines := buildAuthorAudienceLines(content)
	if len(bodyLines) == 0 {
		bodyLines = authorBodyLines(content.Content)
	}
	footer := strings.TrimSpace(deckTitle)
	if footer == "" {
		footer = "SVGlide"
	}
	footnote := ""
	heroAsset := firstReadyAuthorImageAsset(assets)

	var b strings.Builder
	writeAuthorSVGStart(&b, content, theme)
	if heroAsset != nil && authorWantsFullBleedHero(slide) {
		writeAuthorFullBleedHero(&b, slide, *heroAsset, theme, title, keyMessage, bodyLines, footnote)
	} else if heroAsset != nil {
		writeAuthorImageEditorialPage(&b, slide, content, *heroAsset, theme, title, keyMessage, bodyLines, footnote, page)
	} else {
		writeAuthorOpenDiagramPage(&b, slide, content, theme, title, keyMessage, bodyLines, footnote)
	}
	writeAuthorFooter(&b, footer, theme, page, total)
	fmt.Fprintf(&b, "</svg>\n")
	return b.String()
}

func writeAuthorSVGStart(b *strings.Builder, content authorSlideContent, theme authorTheme) {
	fmt.Fprintf(b, `<svg xmlns="%s" xmlns:slide="%s" width="%d" height="%d" viewBox="0 0 960 540" slide:role="slide">`+"\n", svgNamespace, slideNamespace, defaultSlideWidth, defaultSlideHeight)
	if notes := authorSlideNote(content); notes != "" {
		fmt.Fprintf(b, "  <slide:note>%s</slide:note>\n", escapeText(notes))
	}
	fmt.Fprintf(b, `  <rect x="0" y="0" width="960" height="540" fill="%s" slide:role="background"/>`+"\n", escapeAttr(theme.Background))
}

func authorSlideNote(content authorSlideContent) string {
	parts := []string{}
	if notes := strings.TrimSpace(content.Notes); notes != "" {
		parts = append(parts, notes)
	}
	if source := authorSourceFootnote(content.SourceRefs); source != "" {
		parts = append(parts, source)
	}
	return strings.Join(parts, "\n")
}

func writeAuthorFullBleedHero(b *strings.Builder, slide authorDeckSlide, asset authorAsset, theme authorTheme, title string, keyMessage string, bodyLines []string, footnote string) {
	fmt.Fprintf(b, `  <image slide:role="image" slide:shape-type="image" href="%s" x="0" y="0" width="960" height="540" preserveAspectRatio="xMidYMid slice"/>`+"\n", escapeAttr(svgHrefForRunAsset(slide.Path, assetPath(asset))))
	fmt.Fprintf(b, `  <rect slide:role="shape" slide:shape-type="rect" x="0" y="0" width="960" height="540" fill="#0F1510" opacity="0.50"/>`+"\n")
	fmt.Fprintf(b, `  <rect slide:role="shape" slide:shape-type="rect" x="0" y="0" width="8" height="540" fill="%s"/>`+"\n", escapeAttr(theme.Accent))
	fmt.Fprintf(b, `  <foreignObject x="64" y="74" width="650" height="350" slide:role="shape" slide:shape-type="text">`+"\n")
	fmt.Fprintf(b, `    <h1 xmlns="http://www.w3.org/1999/xhtml" style="margin:0 0 18px 0;font-family:%s;color:#F8F4EA;font-size:%dpx;font-weight:700;line-height:1.08;">%s</h1>`+"\n", authorFontDisplay, clampInt(maxInt(theme.TitleSize+14, 54), 48, 68), escapeText(title))
	if keyMessage != "" {
		fmt.Fprintf(b, `    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0 0 24px 0;font-family:%s;color:#F4EFE4;font-size:%dpx;line-height:1.42;">%s</p>`+"\n", authorFontBody, clampInt(theme.BodySize+6, 20, 26), escapeText(keyMessage))
	}
	for _, line := range firstNStrings(bodyLines, 2) {
		fmt.Fprintf(b, `    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0 0 8px 0;font-family:%s;color:#D9C7A2;font-size:%dpx;line-height:1.5;">%s</p>`+"\n", authorFontBody, clampInt(theme.BodySize, 15, 20), escapeText(line))
	}
	fmt.Fprintf(b, "  </foreignObject>\n")
	fmt.Fprintf(b, `  <circle slide:role="shape" slide:shape-type="ellipse" cx="835" cy="86" r="25" fill="%s" opacity="0.92"/>`+"\n", escapeAttr(theme.Accent))
	fmt.Fprintf(b, `  <path slide:role="shape" slide:shape-type="custom" slide:width="30" slide:height="30" d="M820 86 L850 86 M835 71 L835 101" stroke="#F8F4EA" stroke-width="1.4" opacity="0.85"/>`+"\n")
	if footnote != "" {
		writeAuthorTextBox(b, 64, 432, 650, 42, "#E6DDCA", 12, footnote, authorFontLabel, "1.3", 400)
	}
}

func writeAuthorImageEditorialPage(b *strings.Builder, slide authorDeckSlide, content authorSlideContent, asset authorAsset, theme authorTheme, title string, keyMessage string, bodyLines []string, footnote string, page int) {
	imgX, imgY, imgW, imgH, textX, textW := authorImageEditorialGeometry(slide, page)
	fmt.Fprintf(b, `  <image slide:role="image" slide:shape-type="image" href="%s" x="%d" y="%d" width="%d" height="%d" preserveAspectRatio="xMidYMid slice"/>`+"\n", escapeAttr(svgHrefForRunAsset(slide.Path, assetPath(asset))), imgX, imgY, imgW, imgH)
	if textX < imgX {
		fmt.Fprintf(b, `  <path slide:role="shape" slide:shape-type="custom" slide:width="72" slide:height="540" d="M%d 0 H%d V540 H%d Z" fill="%s" opacity="0.18"/>`+"\n", imgX, imgX+72, imgX, escapeAttr(theme.Accent))
	} else {
		fmt.Fprintf(b, `  <path slide:role="shape" slide:shape-type="custom" slide:width="72" slide:height="540" d="M%d 0 H%d V540 H%d Z" fill="%s" opacity="0.18"/>`+"\n", textX-72, textX, textX-72, escapeAttr(theme.Accent))
	}
	fmt.Fprintf(b, `  <path slide:role="shape" slide:shape-type="custom" slide:width="%d" slide:height="540" d="M%d 0 H%d V540 H%d Z" fill="%s" opacity="0.96"/>`+"\n", textW+56, textX-28, textX+textW+28, textX-28, escapeAttr(theme.Background))
	fmt.Fprintf(b, `  <line slide:role="shape" x1="%d" y1="68" x2="%d" y2="68" stroke="%s" stroke-width="3"/>`+"\n", textX, textX+120, escapeAttr(theme.Accent))
	writeAuthorTextBox(b, textX, 84, textW, 74, theme.Ink, clampInt(theme.TitleSize, 34, 46), title, authorFontDisplay, "1.12", 700)
	if keyMessage != "" {
		writeAuthorTextBox(b, textX, 166, textW, 64, theme.Accent, clampInt(theme.BodySize+4, 18, 23), keyMessage, authorFontBody, "1.38", 600)
	}
	writeAuthorOpenTextLines(b, textX, 248, textW, theme, firstNStrings(bodyLines, 3))
	if diagram := firstAuthorInlineVisual(content); diagram != nil {
		renderAuthorInlineDiagram(b, *diagram, content, textX, 360, textW, 82, theme)
	}
	if footnote != "" {
		writeAuthorTextBox(b, textX, 452, textW, 42, theme.Muted, 11, footnote, authorFontLabel, "1.25", 400)
	}
}

func writeAuthorOpenDiagramPage(b *strings.Builder, slide authorDeckSlide, content authorSlideContent, theme authorTheme, title string, keyMessage string, bodyLines []string, footnote string) {
	fmt.Fprintf(b, `  <rect slide:role="shape" slide:shape-type="rect" x="56" y="64" width="168" height="3" fill="%s"/>`+"\n", escapeAttr(theme.Accent))
	writeAuthorTextBox(b, 56, 84, 420, 78, theme.Ink, clampInt(theme.TitleSize, 34, 46), title, authorFontDisplay, "1.12", 700)
	if keyMessage != "" {
		writeAuthorTextBox(b, 56, 170, 460, 68, theme.Accent, clampInt(theme.BodySize+4, 18, 23), keyMessage, authorFontBody, "1.4", 600)
	}
	if diagram := firstAuthorInlineVisual(content); diagram != nil {
		renderAuthorInlineDiagram(b, *diagram, content, 520, 84, 360, 300, theme)
	}
	writeAuthorOpenTextLines(b, 56, 270, 420, theme, firstNStrings(bodyLines, 2))
	if footnote != "" {
		writeAuthorTextBox(b, 56, 452, 560, 42, theme.Muted, 11, footnote, authorFontLabel, "1.25", 400)
	}
}

func authorImageEditorialGeometry(slide authorDeckSlide, page int) (imgX, imgY, imgW, imgH, textX, textW int) {
	family := strings.TrimSpace(slide.LayoutFamily)
	if family == "timeline_route" || page%2 == 0 {
		return 0, 0, 520, 540, 592, 300
	}
	return 520, 0, 440, 540, 64, 360
}

func authorWantsFullBleedHero(slide authorDeckSlide) bool {
	value := strings.ToLower(strings.Join([]string{slide.Role, slide.VisualRole, slide.LayoutFamily, slide.LayoutArchetype, slide.LayoutSignature}, " "))
	return isCoverSlide(slide) || strings.Contains(value, "full_bleed") || strings.Contains(value, "full-bleed")
}

func writeAuthorTextBox(b *strings.Builder, x, y, width, height int, color string, fontSize int, text string, family string, lineHeight string, weight int) {
	if strings.TrimSpace(text) == "" {
		return
	}
	fmt.Fprintf(b, `  <foreignObject x="%d" y="%d" width="%d" height="%d" slide:role="shape" slide:shape-type="text">`+"\n", x, y, width, height)
	fmt.Fprintf(b, `    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font-family:%s;color:%s;font-size:%dpx;line-height:%s;font-weight:%d;">%s</p>`+"\n", family, escapeAttr(color), fontSize, lineHeight, weight, escapeText(text))
	fmt.Fprintf(b, "  </foreignObject>\n")
}

func writeAuthorOpenTextLines(b *strings.Builder, x, y, width int, theme authorTheme, lines []string) {
	if len(lines) == 0 {
		return
	}
	rowY := y
	for _, line := range lines {
		fmt.Fprintf(b, `  <line slide:role="shape" x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1" opacity="0.45"/>`+"\n", x, rowY-9, x+width, rowY-9, escapeAttr(theme.Muted))
		writeAuthorTextBox(b, x, rowY, width, 64, theme.Ink, clampInt(theme.BodySize, 15, 18), line, authorFontBody, "1.42", 500)
		rowY += 68
	}
}

func firstAuthorInlineVisual(content authorSlideContent) *authorSlideVisual {
	for i := range content.Visuals {
		switch strings.TrimSpace(content.Visuals[i].Type) {
		case "diagram", "map", "icon", "illustration":
			return &content.Visuals[i]
		}
	}
	return nil
}

func authorDiagramLabels(content authorSlideContent, visual authorSlideVisual, limit int) []string {
	candidates := []string{}
	for _, item := range content.VisualDataItems {
		if label := strings.TrimSpace(item.Label); label != "" {
			candidates = append(candidates, label)
		}
	}
	for _, line := range authorBodyLines(content.Content) {
		candidates = append(candidates, splitAuthorLabelLine(line)...)
	}
	candidates = append(candidates, splitAuthorLabelLine(visual.Instruction)...)
	candidates = append(candidates, splitAuthorLabelLine(strings.ReplaceAll(visual.ID, "_", " "))...)
	out := []string{}
	seen := map[string]bool{}
	for _, candidate := range candidates {
		label := trimAuthorLabel(candidate)
		if label == "" || seen[label] {
			continue
		}
		seen[label] = true
		out = append(out, label)
		if len(out) >= limit {
			break
		}
	}
	return out
}

func splitAuthorLabelLine(line string) []string {
	replacer := strings.NewReplacer("/", "|", "／", "|", ",", "|", "，", "|", "、", "|", ";", "|", "；", "|", ":", "|", "：", "|", "\n", "|")
	return strings.Split(replacer.Replace(line), "|")
}

func trimAuthorLabel(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, " .-")
	if value == "" {
		return ""
	}
	runes := []rune(value)
	if len(runes) > 12 {
		return ""
	}
	return value
}

func authorDiagramColor(theme authorTheme, index int) string {
	switch index % 4 {
	case 0:
		return theme.Accent
	case 1:
		return "#496C3A"
	case 2:
		return "#A63E2B"
	default:
		return "#B97832"
	}
}

func writeAuthorFooter(b *strings.Builder, footer string, theme authorTheme, page int, total int) {
	fmt.Fprintf(b, `  <foreignObject x="56" y="498" width="848" height="24" slide:role="shape" slide:shape-type="text">`+"\n")
	fmt.Fprintf(b, `    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0;font-family:%s;color:%s;font-size:12px;line-height:1.2;">%s · %d / %d</p>`+"\n", authorFontLabel, escapeAttr(theme.Muted), escapeText(footer), page, total)
	fmt.Fprintf(b, "  </foreignObject>\n")
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

func buildAuthorAudienceLines(content authorSlideContent) []string {
	lines := []string{}
	if claim := strings.TrimSpace(content.CentralClaim); claim != "" {
		lines = append(lines, claim)
	}
	for _, point := range content.SupportingPoints {
		text := strings.TrimSpace(point.Text)
		if text == "" {
			continue
		}
		lines = append(lines, text)
		if len(lines) >= 4 {
			break
		}
	}
	for _, item := range content.ExamplesOrParameters {
		label := strings.TrimSpace(item.Label)
		explanation := strings.TrimSpace(item.Explanation)
		if explanation == "" {
			continue
		}
		if label != "" {
			lines = append(lines, label+": "+explanation)
		} else {
			lines = append(lines, explanation)
		}
		if len(lines) >= 5 {
			break
		}
	}
	if soWhat := strings.TrimSpace(content.SoWhat); soWhat != "" {
		lines = append(lines, soWhat)
	} else if takeaway := strings.TrimSpace(content.AudienceTakeaway); takeaway != "" {
		lines = append(lines, takeaway)
	}
	return dedupeAuthorLines(lines)
}

func dedupeAuthorLines(lines []string) []string {
	out := make([]string, 0, len(lines))
	seen := map[string]bool{}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || seen[line] {
			continue
		}
		seen[line] = true
		out = append(out, line)
	}
	return out
}

func deriveAuthorInformationDensityPlan(content authorSlideContent) string {
	claim := "no central claim"
	if strings.TrimSpace(content.CentralClaim) != "" {
		claim = "central claim present"
	}
	return fmt.Sprintf("%s; supporting_points=%d; source_bound_facts=%d; visual_data_items=%d", claim, len(content.SupportingPoints), len(content.SourceBoundFacts), len(content.VisualDataItems))
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

func minInt(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func clampInt(value int, minValue int, maxValue int) int {
	return maxInt(minValue, minInt(value, maxValue))
}

func firstNStrings(values []string, limit int) []string {
	if limit <= 0 || len(values) == 0 {
		return nil
	}
	if len(values) <= limit {
		return values
	}
	return values[:limit]
}
