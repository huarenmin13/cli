package svglide

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

const contentPayloadReportPath = "receipts/content_payload.json"

type ContentPayloadReport struct {
	Status  string                `json:"status"`
	Metrics ContentPayloadMetrics `json:"metrics"`
	Issues  []ContentPayloadIssue `json:"issues,omitempty"`
}

type ContentPayloadMetrics struct {
	Slides                       int `json:"slides"`
	SubstantiveSlides            int `json:"substantive_slides"`
	SparseLabelListCount         int `json:"sparse_label_list_count"`
	MissingCentralClaimCount     int `json:"missing_central_claim_count"`
	MissingSupportingPointsCount int `json:"missing_supporting_points_count"`
	MissingSourceBoundFactCount  int `json:"missing_source_bound_fact_count"`
	MissingVisualDataItemsCount  int `json:"missing_visual_data_items_count"`
	SourceBindingIssueCount      int `json:"source_binding_issue_count"`
	IssueCount                   int `json:"issue_count"`
}

type ContentPayloadIssue struct {
	Code    string `json:"code"`
	SlideID string `json:"slide_id,omitempty"`
	Message string `json:"message"`
}

type contentPayloadFile struct {
	PromptContract json.RawMessage       `json:"prompt_contract"`
	Slides         []contentPayloadSlide `json:"slides"`
}

type contentPayloadSlide struct {
	ID                   string                             `json:"id"`
	Role                 string                             `json:"role"`
	Title                string                             `json:"title"`
	Content              string                             `json:"content"`
	CentralClaim         string                             `json:"central_claim"`
	AudienceTakeaway     string                             `json:"audience_takeaway"`
	SupportingPoints     []contentPayloadSupportingPoint    `json:"supporting_points"`
	SourceBoundFacts     []contentPayloadSourceBoundFact    `json:"source_bound_facts"`
	ExamplesOrParameters []contentPayloadExampleOrParameter `json:"examples_or_parameters"`
	VisualDataItems      []contentPayloadVisualDataItem     `json:"visual_data_items"`
	SoWhat               string                             `json:"so_what"`
	SourceRefs           []string                           `json:"source_refs"`
	Visuals              []contentPayloadVisual             `json:"visuals"`
}

type contentPayloadSupportingPoint struct {
	Text       string   `json:"text"`
	SourceRefs []string `json:"source_refs"`
}

type contentPayloadSourceBoundFact struct {
	Fact      string `json:"fact"`
	SourceRef string `json:"source_ref"`
	Usage     string `json:"usage"`
}

type contentPayloadExampleOrParameter struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Explanation string `json:"explanation"`
	SourceRef   string `json:"source_ref"`
}

type contentPayloadVisualDataItem struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Role        string `json:"role"`
	Explanation string `json:"explanation"`
	SourceRef   string `json:"source_ref"`
}

type contentPayloadVisual struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Instruction string `json:"instruction"`
	VisualForm  string `json:"visual_form"`
}

type contentPayloadDeckSlideMeta struct {
	ID    string
	Title string
	Role  string
}

func EvaluateContentPayloadRun(root string) (ContentPayloadReport, error) {
	safeRoot, _, err := readRun(root)
	if err != nil {
		return ContentPayloadReport{}, err
	}
	return evaluateContentPayloadAtRoot(safeRoot)
}

func evaluateContentPayloadAtRoot(safeRoot string) (ContentPayloadReport, error) {
	raw, err := readRunRegularArtifact(safeRoot, "content/slide_content.json")
	if err != nil {
		return ContentPayloadReport{}, fmt.Errorf("content/slide_content.json: read artifact: %w", err)
	}
	var file contentPayloadFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return ContentPayloadReport{}, fmt.Errorf("content/slide_content.json: invalid JSON: %w", err)
	}
	report := ContentPayloadReport{
		Status:  "passed",
		Metrics: ContentPayloadMetrics{Slides: len(file.Slides)},
		Issues:  []ContentPayloadIssue{},
	}
	if !contentPayloadStrict(file) {
		return report, nil
	}
	sourceIDs, err := readKnownSourceIDs(safeRoot)
	if err != nil {
		return ContentPayloadReport{}, err
	}
	metaByID := readContentPayloadDeckMeta(safeRoot)
	for i, slide := range file.Slides {
		if meta, ok := metaByID[strings.TrimSpace(slide.ID)]; ok {
			if strings.TrimSpace(slide.Role) == "" {
				slide.Role = meta.Role
			}
			if strings.TrimSpace(slide.Title) == "" {
				slide.Title = meta.Title
			}
		}
		evaluateContentPayloadSlide(&report, slide, sourceIDs, i, len(file.Slides))
	}
	report.Metrics.IssueCount = len(report.Issues)
	if report.Metrics.IssueCount > 0 {
		report.Status = "failed"
	}
	return report, nil
}

func writeContentPayloadReport(safeRoot string, report ContentPayloadReport) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, contentPayloadReportPath)
	if err != nil {
		return err
	}
	return writeJSON(target, report)
}

func contentPayloadStrict(file contentPayloadFile) bool {
	if raw := strings.TrimSpace(string(file.PromptContract)); raw != "" && raw != "null" && raw != "{}" {
		return true
	}
	for _, slide := range file.Slides {
		if strings.TrimSpace(slide.CentralClaim) != "" ||
			strings.TrimSpace(slide.AudienceTakeaway) != "" ||
			len(slide.SupportingPoints) > 0 ||
			len(slide.SourceBoundFacts) > 0 ||
			len(slide.VisualDataItems) > 0 ||
			strings.TrimSpace(slide.SoWhat) != "" {
			return true
		}
	}
	return false
}

func readContentPayloadDeckMeta(safeRoot string) map[string]contentPayloadDeckSlideMeta {
	raw, err := readRunRegularArtifact(safeRoot, "outline/deck.json")
	if err != nil {
		return map[string]contentPayloadDeckSlideMeta{}
	}
	var deck struct {
		Slides []struct {
			ID    string `json:"id"`
			Title string `json:"title"`
			Role  string `json:"role"`
		} `json:"slides"`
	}
	if err := json.Unmarshal(raw, &deck); err != nil {
		return map[string]contentPayloadDeckSlideMeta{}
	}
	byID := make(map[string]contentPayloadDeckSlideMeta, len(deck.Slides))
	for _, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			continue
		}
		byID[id] = contentPayloadDeckSlideMeta{ID: id, Title: strings.TrimSpace(slide.Title), Role: strings.TrimSpace(slide.Role)}
	}
	return byID
}

func evaluateContentPayloadSlide(report *ContentPayloadReport, slide contentPayloadSlide, sourceIDs map[string]bool, index int, total int) {
	substantive := isSubstantiveContentPayloadSlide(slide, index, total)
	if substantive {
		report.Metrics.SubstantiveSlides++
	}
	id := strings.TrimSpace(slide.ID)
	hasFloor := contentPayloadHasFloor(slide)
	if substantive && isSparseLabelList(slide.Content) && !hasFloor {
		addContentPayloadIssue(report, "svglide.content_payload.sparse_label_list", id, "slide content is a label list without enough structured audience payload")
	}
	if substantive && len([]rune(strings.TrimSpace(slide.CentralClaim))) < 12 {
		addContentPayloadIssue(report, "svglide.content_payload.missing_central_claim", id, "substantive slide needs a central_claim of at least 12 characters")
	}
	if substantive && validSupportingPointCount(slide.SupportingPoints) < 2 {
		addContentPayloadIssue(report, "svglide.content_payload.missing_supporting_points", id, "substantive slide needs at least two source-backed supporting_points")
	}
	if substantive && validSourceBoundFactCount(slide.SourceBoundFacts) < 1 {
		addContentPayloadIssue(report, "svglide.content_payload.missing_source_bound_fact", id, "substantive slide needs at least one source_bound_fact")
	}
	checkContentPayloadSourceBindings(report, slide, sourceIDs)
	checkContentPayloadVisualData(report, slide)
}

func contentPayloadHasFloor(slide contentPayloadSlide) bool {
	return len([]rune(strings.TrimSpace(slide.CentralClaim))) >= 12 &&
		validSupportingPointCount(slide.SupportingPoints) >= 2 &&
		validSourceBoundFactCount(slide.SourceBoundFacts) >= 1 &&
		contentPayloadVisualDataRequirementMet(slide)
}

func validSupportingPointCount(points []contentPayloadSupportingPoint) int {
	count := 0
	for _, point := range points {
		if len([]rune(strings.TrimSpace(point.Text))) < 12 || len(point.SourceRefs) == 0 {
			continue
		}
		count++
	}
	return count
}

func validSourceBoundFactCount(facts []contentPayloadSourceBoundFact) int {
	count := 0
	for _, fact := range facts {
		if len([]rune(strings.TrimSpace(fact.Fact))) < 8 || strings.TrimSpace(fact.SourceRef) == "" {
			continue
		}
		count++
	}
	return count
}

func isSubstantiveContentPayloadSlide(slide contentPayloadSlide, index int, total int) bool {
	role := strings.ToLower(strings.TrimSpace(slide.Role))
	switch role {
	case "cover", "opening", "agenda", "section", "section_divider", "divider":
		return false
	case "closing", "end", "appendix":
		return false
	}
	idTitle := strings.ToLower(strings.Join([]string{slide.ID, slide.Title, slide.Content}, " "))
	if index == 0 && (strings.Contains(idTitle, "cover") || strings.Contains(idTitle, "opening") || strings.Contains(idTitle, "封面") || strings.Contains(idTitle, "开场")) {
		return false
	}
	if total > 1 && index == total-1 && (strings.Contains(idTitle, "closing") || strings.Contains(idTitle, "结语") || strings.Contains(idTitle, "总结") || strings.Contains(idTitle, "end")) {
		return false
	}
	return true
}

func checkContentPayloadSourceBindings(report *ContentPayloadReport, slide contentPayloadSlide, sourceIDs map[string]bool) {
	id := strings.TrimSpace(slide.ID)
	for _, point := range slide.SupportingPoints {
		for _, ref := range point.SourceRefs {
			checkContentPayloadSourceRef(report, id, ref, sourceIDs)
		}
	}
	for _, fact := range slide.SourceBoundFacts {
		checkContentPayloadSourceRef(report, id, fact.SourceRef, sourceIDs)
	}
	for _, item := range slide.ExamplesOrParameters {
		if strings.TrimSpace(item.SourceRef) != "" {
			checkContentPayloadSourceRef(report, id, item.SourceRef, sourceIDs)
		}
	}
	for _, item := range slide.VisualDataItems {
		if strings.TrimSpace(item.SourceRef) != "" {
			checkContentPayloadSourceRef(report, id, item.SourceRef, sourceIDs)
		}
		if strings.TrimSpace(item.Explanation) == "" {
			addContentPayloadIssue(report, "svglide.content_payload.visual_data_without_explanation", id, fmt.Sprintf("visual_data_item %q needs an explanation", strings.TrimSpace(item.Label)))
		}
	}
}

func checkContentPayloadSourceRef(report *ContentPayloadReport, slideID string, ref string, sourceIDs map[string]bool) {
	ref = strings.TrimSpace(ref)
	if ref == "" || sourceIDs[ref] {
		return
	}
	addContentPayloadIssue(report, "svglide.content_payload.unknown_source_ref", slideID, fmt.Sprintf("structured payload references unknown source id %q", ref))
}

func checkContentPayloadVisualData(report *ContentPayloadReport, slide contentPayloadSlide) {
	if contentPayloadVisualDataRequirementMet(slide) {
		return
	}
	addContentPayloadIssue(report, "svglide.content_payload.visual_form_missing_data", strings.TrimSpace(slide.ID), "declared visual_form needs matching visual_data_items")
}

func contentPayloadVisualDataRequirementMet(slide contentPayloadSlide) bool {
	requiredRole, minItems := contentPayloadVisualDataRequirement(slide.Visuals)
	if minItems == 0 {
		return true
	}
	if requiredRole == "" {
		return len(slide.VisualDataItems) >= minItems
	}
	count := 0
	for _, item := range slide.VisualDataItems {
		if strings.TrimSpace(item.Explanation) == "" {
			continue
		}
		if strings.TrimSpace(item.Role) == requiredRole {
			count++
		}
	}
	return count >= minItems
}

func contentPayloadVisualDataRequirement(visuals []contentPayloadVisual) (string, int) {
	requiredRole := ""
	minItems := 0
	for _, visual := range visuals {
		typ := strings.TrimSpace(visual.Type)
		form := normalizeAuthorVisualForm(visual.VisualForm)
		if typ == "chart" {
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "metric", 2)
			continue
		}
		if typ == "table" {
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "", 3)
			continue
		}
		switch form {
		case authorVisualFormProcessFlow:
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "step", 3)
		case authorVisualFormMapRoute:
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "map_anchor", 3)
		case authorVisualFormParameterMatrix, authorVisualFormFourQuadrant, authorVisualFormSpectrum, authorVisualFormSensoryWheel:
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "", 3)
		case authorVisualFormObjectCallout:
			requiredRole, minItems = strongerVisualDataRequirement(requiredRole, minItems, "callout", 3)
		}
	}
	return requiredRole, minItems
}

func strongerVisualDataRequirement(currentRole string, currentMin int, nextRole string, nextMin int) (string, int) {
	if nextMin > currentMin {
		return nextRole, nextMin
	}
	return currentRole, currentMin
}

func addContentPayloadIssue(report *ContentPayloadReport, code string, slideID string, message string) {
	report.Issues = append(report.Issues, ContentPayloadIssue{Code: code, SlideID: slideID, Message: message})
	switch code {
	case "svglide.content_payload.sparse_label_list":
		report.Metrics.SparseLabelListCount++
	case "svglide.content_payload.missing_central_claim":
		report.Metrics.MissingCentralClaimCount++
	case "svglide.content_payload.missing_supporting_points":
		report.Metrics.MissingSupportingPointsCount++
	case "svglide.content_payload.missing_source_bound_fact":
		report.Metrics.MissingSourceBoundFactCount++
	case "svglide.content_payload.visual_form_missing_data", "svglide.content_payload.visual_data_without_explanation":
		report.Metrics.MissingVisualDataItemsCount++
	case "svglide.content_payload.unknown_source_ref":
		report.Metrics.SourceBindingIssueCount++
	}
}

func summarizeContentPayloadIssues(issues []ContentPayloadIssue) string {
	if len(issues) == 0 {
		return ""
	}
	parts := make([]string, 0, minPositive(len(issues), 3))
	for i, issue := range issues {
		if i >= 3 {
			break
		}
		if strings.TrimSpace(issue.SlideID) != "" {
			parts = append(parts, fmt.Sprintf("%s:%s", issue.SlideID, issue.Code))
			continue
		}
		parts = append(parts, issue.Code)
	}
	if len(issues) > len(parts) {
		parts = append(parts, fmt.Sprintf("+%d more", len(issues)-len(parts)))
	}
	return strings.Join(parts, ", ")
}

var sparseLabelSplitRE = regexp.MustCompile(`[,\n\r;/|，、；：:]+`)

func isSparseLabelList(content string) bool {
	content = strings.TrimSpace(content)
	if content == "" {
		return false
	}
	rawTokens := sparseLabelSplitRE.Split(content, -1)
	tokens := make([]string, 0, len(rawTokens))
	totalRunes := 0
	richTokens := 0
	for _, raw := range rawTokens {
		token := strings.TrimSpace(strings.Trim(raw, "-•· \t"))
		if token == "" {
			continue
		}
		tokens = append(tokens, token)
		totalRunes += len([]rune(token))
		if contentPayloadTokenHasExplanation(token) {
			richTokens++
		}
	}
	if len(tokens) < 3 {
		return false
	}
	avg := totalRunes / len(tokens)
	return avg <= 8 && richTokens < 2
}

func contentPayloadTokenHasExplanation(token string) bool {
	for _, r := range token {
		if unicode.IsDigit(r) {
			return true
		}
	}
	for _, marker := range []string{
		"是", "为", "有", "由", "因", "使", "让", "会", "能", "把", "从", "到",
		"决定", "来自", "意味着", "用于", "形成", "影响", "体现", "because", "drives", "means",
		"%", "℃", "°", "ml", "g", "kg", "年", "月", "倍", "x",
	} {
		if strings.Contains(strings.ToLower(token), strings.ToLower(marker)) {
			return true
		}
	}
	return false
}
