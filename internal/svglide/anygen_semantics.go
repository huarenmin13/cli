package svglide

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"html"
	"io"
	"io/fs"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/larksuite/cli/internal/vfs"
	"gopkg.in/yaml.v3"
)

const (
	defaultSemanticContractPath = anyGenPromptRoot + "/semantic_contract.md"
	anyGenSemanticReportPath    = "anygen_semantic_report.json"
)

var errSemanticContractMissing = errors.New("semantic contract missing")

type SemanticContract struct {
	ID          string         `json:"id" yaml:"id"`
	Role        string         `json:"role" yaml:"role"`
	Invocation  string         `json:"invocation,omitempty" yaml:"invocation,omitempty"`
	Stage       string         `json:"stage,omitempty" yaml:"stage,omitempty"`
	Order       int            `json:"order,omitempty" yaml:"order,omitempty"`
	Cardinality string         `json:"cardinality,omitempty" yaml:"cardinality,omitempty"`
	Condition   string         `json:"condition,omitempty" yaml:"condition,omitempty"`
	Trigger     []string       `json:"trigger,omitempty" yaml:"trigger,omitempty"`
	Rules       []SemanticRule `json:"rules" yaml:"rules"`
	Path        string         `json:"path" yaml:"-"`
	SHA256      string         `json:"sha256" yaml:"-"`
}

type SemanticRule struct {
	ID          string `json:"id" yaml:"id"`
	Kind        string `json:"kind" yaml:"kind"`
	When        string `json:"when,omitempty" yaml:"when,omitempty"`
	Artifact    string `json:"artifact,omitempty" yaml:"artifact,omitempty"`
	Field       string `json:"field,omitempty" yaml:"field,omitempty"`
	VisualType  string `json:"visual_type,omitempty" yaml:"visual_type,omitempty"`
	AssetType   string `json:"asset_type,omitempty" yaml:"asset_type,omitempty"`
	AssetStatus string `json:"asset_status,omitempty" yaml:"asset_status,omitempty"`
	SVGSelector string `json:"svg_selector,omitempty" yaml:"svg_selector,omitempty"`
	Severity    string `json:"severity" yaml:"severity"`
}

type AnyGenSemanticReport struct {
	Status   string                    `json:"status"`
	Contract SemanticContractReference `json:"contract"`
	Metrics  SemanticMetrics           `json:"metrics"`
	Findings []SemanticFinding         `json:"findings"`
}

type SemanticContractReference struct {
	ID     string `json:"id"`
	Role   string `json:"role"`
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
	Rules  int    `json:"rules"`
}

type SemanticFinding struct {
	RuleID   string `json:"rule_id"`
	Kind     string `json:"kind"`
	Severity string `json:"severity"`
	Code     string `json:"code"`
	Artifact string `json:"artifact,omitempty"`
	Field    string `json:"field,omitempty"`
	Path     string `json:"path,omitempty"`
	Value    string `json:"value,omitempty"`
	Message  string `json:"message"`
}

func LoadSemanticContract() (SemanticContract, error) {
	var tried []string
	for _, path := range defaultSemanticContractCandidates() {
		contract, err := LoadSemanticContractFile(path)
		if err == nil {
			return contract, nil
		}
		if !errors.Is(err, errSemanticContractMissing) {
			return SemanticContract{}, err
		}
		tried = append(tried, path)
	}
	return SemanticContract{}, fmt.Errorf("%w; tried %s; create semantic_contract.md or pass a temporary contract path", errSemanticContractMissing, strings.Join(tried, ", "))
}

func LoadSemanticContractFile(path string) (SemanticContract, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return SemanticContract{}, fmt.Errorf("semantic contract path is required")
	}
	info, err := vfs.Lstat(path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return SemanticContract{}, fmt.Errorf("%w: %q", errSemanticContractMissing, path)
		}
		return SemanticContract{}, fmt.Errorf("semantic contract %q: %w", path, err)
	}
	if !info.Mode().IsRegular() {
		return SemanticContract{}, fmt.Errorf("semantic contract %q must be a regular file", path)
	}
	raw, err := vfs.ReadFile(path)
	if err != nil {
		return SemanticContract{}, fmt.Errorf("read semantic contract %q: %w", path, err)
	}
	frontmatter, err := semanticMarkdownFrontmatter(path, raw)
	if err != nil {
		return SemanticContract{}, err
	}

	var contract SemanticContract
	decoder := yaml.NewDecoder(bytes.NewReader(frontmatter))
	decoder.KnownFields(true)
	if err := decoder.Decode(&contract); err != nil {
		return SemanticContract{}, fmt.Errorf("semantic contract %q frontmatter: %w", path, err)
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return SemanticContract{}, fmt.Errorf("semantic contract %q frontmatter must contain a single YAML document", path)
		}
		return SemanticContract{}, fmt.Errorf("semantic contract %q frontmatter: %w", path, err)
	}
	if err := validateSemanticContract(contract, path); err != nil {
		return SemanticContract{}, err
	}

	sum := sha256.Sum256(raw)
	contract.Path = filepath.ToSlash(filepath.Clean(path))
	contract.SHA256 = hex.EncodeToString(sum[:])
	return contract, nil
}

func defaultSemanticContractCandidates() []string {
	candidates := []string{defaultSemanticContractPath}
	if _, file, _, ok := runtime.Caller(0); ok {
		repoRoot := filepath.Clean(filepath.Join(filepath.Dir(file), "..", ".."))
		candidates = append(candidates, filepath.Join(repoRoot, defaultSemanticContractPath))
	}
	deduped := make([]string, 0, len(candidates))
	seen := make(map[string]bool, len(candidates))
	for _, path := range candidates {
		clean := filepath.Clean(path)
		if seen[clean] {
			continue
		}
		seen[clean] = true
		deduped = append(deduped, path)
	}
	return deduped
}

func semanticMarkdownFrontmatter(path string, raw []byte) ([]byte, error) {
	text := strings.ReplaceAll(string(raw), "\r\n", "\n")
	lines := strings.Split(text, "\n")
	if len(lines) == 0 || strings.TrimSpace(lines[0]) != "---" {
		return nil, fmt.Errorf("semantic contract %q is missing Markdown frontmatter", path)
	}
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "---" {
			return []byte(strings.Join(lines[1:i], "\n")), nil
		}
	}
	return nil, fmt.Errorf("semantic contract %q has unclosed Markdown frontmatter", path)
}

func validateSemanticContract(contract SemanticContract, path string) error {
	if strings.TrimSpace(contract.ID) == "" {
		return fmt.Errorf("semantic contract %q missing id", path)
	}
	if strings.TrimSpace(contract.Role) == "" {
		return fmt.Errorf("semantic contract %q missing role", path)
	}
	if len(contract.Rules) == 0 {
		return fmt.Errorf("semantic contract %q must define at least one rule", path)
	}
	seen := make(map[string]bool, len(contract.Rules))
	for i, rule := range contract.Rules {
		id := strings.TrimSpace(rule.ID)
		if id == "" {
			return fmt.Errorf("semantic contract %q rules[%d] missing id", path, i)
		}
		if seen[id] {
			return fmt.Errorf("semantic contract %q duplicate rule id %q", path, id)
		}
		seen[id] = true
		if strings.TrimSpace(rule.Kind) == "" {
			return fmt.Errorf("semantic contract %q rule %q missing kind", path, id)
		}
		if !semanticRuleKindSupported(rule.Kind) {
			return fmt.Errorf("semantic contract %q rule %q uses unsupported kind %q", path, id, rule.Kind)
		}
		if strings.TrimSpace(rule.Severity) == "" {
			return fmt.Errorf("semantic contract %q rule %q missing severity", path, id)
		}
		if !semanticSeveritySupported(rule.Severity) {
			return fmt.Errorf("semantic contract %q rule %q uses unsupported severity %q", path, id, rule.Severity)
		}
	}
	return nil
}

func semanticSeveritySupported(severity string) bool {
	switch strings.TrimSpace(severity) {
	case "error", "warning", "info":
		return true
	default:
		return false
	}
}

func semanticRuleKindSupported(kind string) bool {
	switch strings.TrimSpace(kind) {
	case "required_non_empty",
		"one_content_per_slide",
		"visual_asset_type_match",
		"explicit_reason_required",
		"svg_contains_asset_href",
		"artifact_exists":
		return true
	default:
		return false
	}
}

func EvaluateAnyGenSemantics(root string) (AnyGenSemanticReport, error) {
	contract, err := LoadSemanticContract()
	if err != nil {
		return AnyGenSemanticReport{}, err
	}
	return EvaluateAnyGenSemanticsWithContract(root, contract)
}

func EvaluateAnyGenQualitySemantics(root string) (AnyGenSemanticReport, error) {
	contract, err := LoadSemanticContract()
	if err != nil {
		return AnyGenSemanticReport{}, err
	}
	filtered := contract
	filtered.Rules = make([]SemanticRule, 0, len(contract.Rules))
	for _, rule := range contract.Rules {
		if strings.TrimSpace(rule.Kind) == "svg_contains_asset_href" {
			continue
		}
		filtered.Rules = append(filtered.Rules, rule)
	}
	return EvaluateAnyGenSemanticsWithContract(root, filtered)
}

func EvaluateAnyGenSemanticsWithContract(root string, contract SemanticContract) (AnyGenSemanticReport, error) {
	if err := validateSemanticContract(contract, semanticContractDisplayPath(contract)); err != nil {
		return AnyGenSemanticReport{}, err
	}
	safeRoot, run, err := readRun(root)
	if err != nil {
		return AnyGenSemanticReport{}, err
	}
	ctx := semanticEvaluationContext{
		safeRoot:  safeRoot,
		run:       run,
		jsonCache: make(map[string]semanticJSONArtifact),
	}
	report := AnyGenSemanticReport{
		Status:   "passed",
		Contract: semanticContractReference(contract),
		Metrics:  SemanticMetrics{},
		Findings: []SemanticFinding{},
	}
	if metrics, err := ComputeSemanticMetrics(safeRoot, run); err == nil {
		report.Metrics = metrics
		if report.Metrics.VisibleLeakCount > 0 {
			report.Findings = append(report.Findings, SemanticFinding{
				RuleID:   "visible_copy_must_not_leak_internal_notes",
				Kind:     "builtin",
				Severity: "error",
				Code:     "svglide.semantic.visible_leak",
				Message:  "visible leak markers found in SVG output",
			})
		}
		if report.Metrics.MissingFontTokenCount > 0 {
			report.Findings = append(report.Findings, SemanticFinding{
				RuleID:   "font_tokens_required",
				Kind:     "builtin",
				Severity: "error",
				Code:     "svglide.semantic.font_tokens",
				Message:  "font token system must include --font-display, --font-body, --font-number, and --font-label",
			})
		}
	}
	for _, rule := range contract.Rules {
		report.Findings = append(report.Findings, ctx.evaluateRule(rule)...)
	}
	for _, finding := range report.Findings {
		if semanticFindingFails(finding) {
			report.Status = "failed"
			break
		}
	}
	target, err := ensureRunFileTargetForWrite(safeRoot, anyGenSemanticReportPath)
	if err != nil {
		return report, err
	}
	if err := writeJSON(target, report); err != nil {
		return report, err
	}
	return report, nil
}

func semanticContractDisplayPath(contract SemanticContract) string {
	if strings.TrimSpace(contract.Path) != "" {
		return contract.Path
	}
	return "(semantic contract)"
}

func semanticContractReference(contract SemanticContract) SemanticContractReference {
	return SemanticContractReference{
		ID:     strings.TrimSpace(contract.ID),
		Role:   strings.TrimSpace(contract.Role),
		Path:   strings.TrimSpace(contract.Path),
		SHA256: strings.TrimSpace(contract.SHA256),
		Rules:  len(contract.Rules),
	}
}

func semanticFindingFails(finding SemanticFinding) bool {
	severity := strings.TrimSpace(finding.Severity)
	return severity == "" || severity == "error"
}

type semanticEvaluationContext struct {
	safeRoot   string
	run        Run
	deck       *authorDeck
	deckErr    error
	content    *qualityContentFile
	contentErr error
	assets     *qualityAssetsFile
	assetsErr  error
	jsonCache  map[string]semanticJSONArtifact
}

type semanticJSONArtifact struct {
	value any
	err   error
}

func (ctx *semanticEvaluationContext) evaluateRule(rule SemanticRule) []SemanticFinding {
	switch strings.TrimSpace(rule.Kind) {
	case "required_non_empty":
		return ctx.evaluateRequiredNonEmpty(rule)
	case "one_content_per_slide":
		return ctx.evaluateOneContentPerSlide(rule)
	case "visual_asset_type_match":
		return ctx.evaluateVisualAssetTypeMatch(rule)
	case "explicit_reason_required":
		return ctx.evaluateExplicitReasonRequired(rule)
	case "svg_contains_asset_href":
		return ctx.evaluateSVGContainsAssetHref(rule)
	case "artifact_exists":
		return ctx.evaluateArtifactExists(rule)
	default:
		return []SemanticFinding{semanticRuleFinding(rule, "", "", "svglide.semantic.unsupported_kind", fmt.Sprintf("unsupported semantic rule kind %q", rule.Kind))}
	}
}

func (ctx *semanticEvaluationContext) evaluateArtifactExists(rule SemanticRule) []SemanticFinding {
	artifact := strings.TrimSpace(rule.Artifact)
	if artifact == "" {
		return []SemanticFinding{semanticRuleFinding(rule, "", "", "svglide.semantic.contract", "artifact_exists rule requires artifact")}
	}
	if _, err := readRunRegularArtifact(ctx.safeRoot, artifact); err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, "", "svglide.semantic.artifact_exists", err.Error())}
	}
	return nil
}

func (ctx *semanticEvaluationContext) evaluateRequiredNonEmpty(rule SemanticRule) []SemanticFinding {
	artifact := strings.TrimSpace(rule.Artifact)
	field := strings.TrimSpace(rule.Field)
	if artifact == "" || field == "" {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.contract", "required_non_empty rule requires artifact and field")}
	}
	value, exists, err := ctx.artifactField(artifact, field)
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.required_non_empty", err.Error())}
	}
	if !exists || !semanticValueNonEmpty(value) {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.required_non_empty", fmt.Sprintf("field %s must be non-empty", field))}
	}
	return nil
}

func (ctx *semanticEvaluationContext) evaluateOneContentPerSlide(rule SemanticRule) []SemanticFinding {
	deck, err := ctx.readDeck()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, semanticDeckPath(ctx.run), "", "svglide.semantic.deck", err.Error())}
	}
	content, err := ctx.readContent()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, "content/slide_content.json", "", "svglide.semantic.content", err.Error())}
	}

	var findings []SemanticFinding
	deckIDs := make(map[string]int, len(deck.Slides))
	for i, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			findings = append(findings, semanticRulePathFinding(rule, semanticDeckPath(ctx.run), fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", "deck slide id must not be empty"))
			continue
		}
		deckIDs[id]++
		if deckIDs[id] > 1 {
			findings = append(findings, semanticRulePathFinding(rule, semanticDeckPath(ctx.run), fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", fmt.Sprintf("deck slide id %q is duplicated", id)))
		}
	}
	contentIDs := make(map[string]int, len(content.Slides))
	for i, slide := range content.Slides {
		id := strings.TrimSpace(slide.ID)
		if id == "" {
			findings = append(findings, semanticRulePathFinding(rule, "content/slide_content.json", fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", "content slide id must not be empty"))
			continue
		}
		contentIDs[id]++
		if contentIDs[id] > 1 {
			findings = append(findings, semanticRulePathFinding(rule, "content/slide_content.json", fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", fmt.Sprintf("content slide id %q is duplicated", id)))
		}
		if deckIDs[id] == 0 {
			findings = append(findings, semanticRulePathFinding(rule, "content/slide_content.json", fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", fmt.Sprintf("content slide %q has no deck slide", id)))
		}
	}
	for i, slide := range deck.Slides {
		id := strings.TrimSpace(slide.ID)
		if id != "" && contentIDs[id] == 0 {
			findings = append(findings, semanticRulePathFinding(rule, semanticDeckPath(ctx.run), fmt.Sprintf("slides[%d].id", i), "svglide.semantic.content_mapping", fmt.Sprintf("deck slide %q has no content", id)))
		}
	}
	return findings
}

func (ctx *semanticEvaluationContext) evaluateVisualAssetTypeMatch(rule SemanticRule) []SemanticFinding {
	content, err := ctx.readContent()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, "content/slide_content.json", "", "svglide.semantic.content", err.Error())}
	}
	assets, err := ctx.readAssets()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, assetsManifestPath, "", "svglide.semantic.assets", err.Error())}
	}

	assetBySlideAndID := make(map[string]qualityAsset, len(assets.Assets))
	for _, asset := range assets.Assets {
		if strings.TrimSpace(rule.AssetStatus) != "" && strings.TrimSpace(asset.Status) != strings.TrimSpace(rule.AssetStatus) {
			continue
		}
		key := semanticSlideAssetKey(asset.SlideID, asset.ID)
		if key != "/" {
			assetBySlideAndID[key] = asset
		}
	}

	visualType := strings.TrimSpace(rule.VisualType)
	wantAssetType := strings.TrimSpace(rule.AssetType)
	var findings []SemanticFinding
	for _, slide := range content.Slides {
		slideID := strings.TrimSpace(slide.ID)
		for _, visual := range slide.Visuals {
			gotVisualType := strings.TrimSpace(visual.Type)
			if visualType != "" && gotVisualType != visualType {
				continue
			}
			if gotVisualType == "none" && visualType == "" {
				continue
			}
			expectedAssetType := wantAssetType
			if expectedAssetType == "" {
				expectedAssetType = gotVisualType
			}
			key := semanticSlideAssetKey(slideID, visual.ID)
			asset, ok := assetBySlideAndID[key]
			if !ok {
				findings = append(findings, semanticRulePathFinding(rule, assetsManifestPath, slideID+"/"+strings.TrimSpace(visual.ID), "svglide.semantic.asset_type", fmt.Sprintf("slide %q visual %q type %q has no matching asset", slideID, visual.ID, gotVisualType)))
				continue
			}
			if assetType(asset) != expectedAssetType {
				findings = append(findings, semanticRulePathFinding(rule, assetsManifestPath, slideID+"/"+strings.TrimSpace(visual.ID), "svglide.semantic.asset_type", fmt.Sprintf("slide %q visual %q type %q needs asset type %q, got %q", slideID, visual.ID, gotVisualType, expectedAssetType, assetType(asset))))
			}
		}
	}
	return findings
}

func (ctx *semanticEvaluationContext) evaluateExplicitReasonRequired(rule SemanticRule) []SemanticFinding {
	matched, findings := ctx.semanticConditionMatched(rule)
	if len(findings) > 0 || !matched {
		return findings
	}
	artifact := strings.TrimSpace(rule.Artifact)
	field := strings.TrimSpace(rule.Field)
	if artifact == "" || field == "" {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.contract", "explicit_reason_required rule requires artifact and field")}
	}
	value, exists, err := ctx.artifactField(artifact, field)
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.reason", err.Error())}
	}
	if !exists || !semanticValueNonEmpty(value) {
		return []SemanticFinding{semanticRuleFinding(rule, artifact, field, "svglide.semantic.reason", fmt.Sprintf("condition %q matched; field %s must explain the fallback", rule.When, field))}
	}
	reason := semanticFindingValue(value)
	finding := semanticRuleFinding(rule, artifact, field, "svglide.semantic.reason", fmt.Sprintf("condition %q matched; explicit reason provided", rule.When))
	finding.Severity = "info"
	finding.Value = reason
	return []SemanticFinding{finding}
}

func (ctx *semanticEvaluationContext) evaluateSVGContainsAssetHref(rule SemanticRule) []SemanticFinding {
	deck, err := ctx.readDeck()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, semanticDeckPath(ctx.run), "", "svglide.semantic.deck", err.Error())}
	}
	assets, err := ctx.readAssets()
	if err != nil {
		return []SemanticFinding{semanticRuleFinding(rule, assetsManifestPath, "", "svglide.semantic.assets", err.Error())}
	}
	slidePathByID := make(map[string]string, len(deck.Slides))
	for _, slide := range deck.Slides {
		slidePathByID[strings.TrimSpace(slide.ID)] = strings.TrimSpace(slide.Path)
	}

	ruleAssetType := strings.TrimSpace(rule.AssetType)
	ruleAssetStatus := strings.TrimSpace(rule.AssetStatus)
	if ruleAssetStatus == "" {
		ruleAssetStatus = "ready"
	}
	selector := strings.TrimSpace(rule.SVGSelector)
	var findings []SemanticFinding
	readyAssets := make(map[string]qualityAsset)
	for _, asset := range assets.Assets {
		if assetStatus(asset) == "ready" {
			if path := assetPath(asset); path != "" {
				readyAssets[path] = asset
			}
		}
	}
	for _, asset := range assets.Assets {
		if ruleAssetType != "" && assetType(asset) != ruleAssetType {
			continue
		}
		if assetStatus(asset) != ruleAssetStatus {
			continue
		}
		slideID := assetSlideID(asset)
		slidePath := strings.TrimSpace(slidePathByID[slideID])
		if slidePath == "" {
			findings = append(findings, semanticRulePathFinding(rule, assetsManifestPath, slideID+"/"+assetID(asset), "svglide.semantic.svg_href", fmt.Sprintf("asset %q references unknown slide %q", assetID(asset), slideID)))
			continue
		}
		slidePath, pathErr := previewSlideObjectPath(slidePath)
		if pathErr != nil {
			findings = append(findings, semanticRulePathFinding(rule, semanticDeckPath(ctx.run), slideID, "svglide.semantic.svg_href", pathErr.Error()))
			continue
		}
		raw, err := readRunRegularArtifact(ctx.safeRoot, slidePath)
		if err != nil {
			findings = append(findings, semanticRulePathFinding(rule, slidePath, slideID+"/"+assetID(asset), "svglide.semantic.svg_href", err.Error()))
			continue
		}
		svg := string(raw)
		if selector != "" && !strings.Contains(svg, selector) {
			findings = append(findings, semanticRulePathFinding(rule, slidePath, slideID+"/"+assetID(asset), "svglide.semantic.svg_href", fmt.Sprintf("SVG does not contain selector %q for asset %q", selector, assetID(asset))))
			continue
		}
		path := assetPath(asset)
		if path == "" {
			findings = append(findings, semanticRulePathFinding(rule, assetsManifestPath, slideID+"/"+assetID(asset), "svglide.semantic.svg_href", fmt.Sprintf("asset %q path must not be empty", assetID(asset))))
			continue
		}
		if err := validateReadyAssetPath(ctx.safeRoot, ctx.run, asset); err != nil {
			findings = append(findings, semanticRulePathFinding(rule, assetsManifestPath, slideID+"/"+assetID(asset), "svglide.semantic.asset_path", err.Error()))
			continue
		}
		if !svgHasImageHref(svg, path) && !strings.Contains(svg, path) && !strings.Contains(svg, html.EscapeString(path)) {
			findings = append(findings, semanticRulePathFinding(rule, slidePath, slideID+"/"+assetID(asset), "svglide.semantic.svg_href", fmt.Sprintf("SVG does not reference ready asset %q href %q", assetID(asset), path)))
		}
	}
	for slideID, slidePath := range slidePathByID {
		cleanSlidePath, pathErr := previewSlideObjectPath(slidePath)
		if pathErr != nil {
			continue
		}
		raw, err := readRunRegularArtifact(ctx.safeRoot, cleanSlidePath)
		if err != nil {
			continue
		}
		for _, ref := range activeSVGAssetRefs(string(raw)) {
			resolvedHref, hrefErr := svgHrefRunPath(cleanSlidePath, ref.Href)
			if hrefErr != nil {
				findings = append(findings, semanticRulePathFinding(rule, cleanSlidePath, slideID, "svglide.semantic.browser_asset_path", hrefErr.Error()))
				continue
			}
			asset, ok := readyAssets[resolvedHref]
			if !ok {
				findings = append(findings, semanticRulePathFinding(rule, cleanSlidePath, slideID, "svglide.semantic.browser_asset_path", fmt.Sprintf("active SVG %s href %q resolves to %q, which is not registered as a ready asset", ref.Kind, ref.Href, resolvedHref)))
				continue
			}
			if err := validateActiveAssetRefType(ref, asset); err != nil {
				findings = append(findings, semanticRulePathFinding(rule, cleanSlidePath, slideID, "svglide.semantic.asset_type", err.Error()))
				continue
			}
			if err := validateReadyAssetPath(ctx.safeRoot, ctx.run, asset); err != nil {
				findings = append(findings, semanticRulePathFinding(rule, cleanSlidePath, slideID, "svglide.semantic.asset_path", err.Error()))
			}
		}
	}
	return findings
}

func (ctx *semanticEvaluationContext) semanticConditionMatched(rule SemanticRule) (bool, []SemanticFinding) {
	switch strings.TrimSpace(rule.When) {
	case "", "always":
		return true, nil
	case "deck_has_zero_image_assets":
		assets, err := ctx.readAssets()
		if err != nil {
			return false, []SemanticFinding{semanticRuleFinding(rule, assetsManifestPath, "", "svglide.semantic.condition", err.Error())}
		}
		for _, asset := range assets.Assets {
			if assetType(asset) == "image" {
				return false, nil
			}
		}
		content, err := ctx.readContent()
		if err != nil {
			return false, []SemanticFinding{semanticRuleFinding(rule, "content/slide_content.json", "", "svglide.semantic.condition", err.Error())}
		}
		for _, slide := range content.Slides {
			for _, visual := range slide.Visuals {
				visualType := strings.TrimSpace(visual.Type)
				if visualType != "" && visualType != "none" && visualType != "image" {
					return true, nil
				}
			}
		}
		return false, nil
	default:
		return false, []SemanticFinding{semanticRuleFinding(rule, "", "", "svglide.semantic.condition", fmt.Sprintf("unsupported semantic condition %q", rule.When))}
	}
}

func validateReadyAssetPath(safeRoot string, run Run, asset qualityAsset) error {
	switch assetType(asset) {
	case "chart":
		return validateReadyChartAssetPath(safeRoot, assetPath(asset))
	default:
		return validateReadyImageAssetPath(safeRoot, run, assetPath(asset))
	}
}

func validateReadyImageAssetPath(safeRoot string, run Run, raw string) error {
	path := strings.TrimSpace(raw)
	if path == "" {
		return fmt.Errorf("image asset path must not be empty")
	}
	if strings.HasPrefix(path, "https://") {
		if normalizedRouteProfile(run.RouteProfile) == RouteProfileLocalSVGDeck {
			return fmt.Errorf("local_svg_deck ready image asset path %q must be a local assets/images/<file>", raw)
		}
		return nil
	}
	if strings.Contains(path, "://") || strings.HasPrefix(path, "data:") {
		return fmt.Errorf("image asset path %q must be https remote or local assets/images/<file>", raw)
	}
	clean, err := validatePreparedImageAssetPath(path)
	if err != nil {
		return err
	}
	info, _, exists, err := lstatRunPath(safeRoot, clean)
	if err != nil {
		return err
	}
	if !exists || !info.Mode().IsRegular() {
		return fmt.Errorf("image asset path %q is missing or not a regular file inside run root", clean)
	}
	return nil
}

func validateReadyChartAssetPath(safeRoot string, raw string) error {
	path := strings.TrimSpace(raw)
	if path == "" {
		return fmt.Errorf("chart asset path must not be empty")
	}
	clean, err := validatePreparedChartAssetPath(path)
	if err != nil {
		return err
	}
	info, _, exists, err := lstatRunPath(safeRoot, clean)
	if err != nil {
		return err
	}
	if !exists || !info.Mode().IsRegular() {
		return fmt.Errorf("chart asset path %q is missing or not a regular file inside run root", clean)
	}
	return nil
}

func validatePreparedChartAssetPath(raw string) (string, error) {
	path := strings.TrimSpace(raw)
	if path == "" {
		return "", fmt.Errorf("chart asset path must not be empty")
	}
	if strings.Contains(path, `\`) {
		return "", fmt.Errorf("chart asset path %q must use forward slashes", raw)
	}
	if strings.Contains(path, "%") {
		return "", fmt.Errorf("chart asset path %q must not contain percent encoding", raw)
	}
	if strings.Contains(path, ":") || strings.Contains(path, "//") || isAbsoluteRunPath(path) {
		return "", fmt.Errorf("chart asset path %q must be a local assets/charts/<file>.svg or .chart path", raw)
	}
	parts := strings.Split(path, "/")
	if len(parts) != 3 || parts[0] != "assets" || parts[1] != "charts" {
		return "", fmt.Errorf("chart asset path %q must match assets/charts/<file>.svg or .chart", raw)
	}
	fileName := parts[2]
	if fileName == "" || fileName == "." || fileName == ".." {
		return "", fmt.Errorf("chart asset path %q must include a file name", raw)
	}
	if strings.HasPrefix(fileName, ".") || strings.Contains(fileName, "..") {
		return "", fmt.Errorf("chart asset file name %q must not contain dot segments", fileName)
	}
	if !strings.HasSuffix(fileName, ".svg") && !strings.HasSuffix(fileName, ".chart") {
		return "", fmt.Errorf("chart asset path %q must end with .svg or .chart", raw)
	}
	return path, nil
}

func validateActiveAssetRefType(ref semanticActiveAssetRef, asset qualityAsset) error {
	kind := assetType(asset)
	switch ref.Kind {
	case "chart":
		if kind != "chart" {
			return fmt.Errorf("active SVG chart href %q must reference a chart asset, got %q", ref.Href, kind)
		}
	case "image":
		if kind != "image" {
			return fmt.Errorf("active SVG image href %q must reference an image asset, got %q", ref.Href, kind)
		}
	case "use":
		return fmt.Errorf("active SVG external use href %q is not supported; use an internal #fragment reference", ref.Href)
	}
	return nil
}

func svgHasImageHref(svg string, href string) bool {
	decoder := xml.NewDecoder(strings.NewReader(svg))
	for {
		tok, err := decoder.Token()
		if err == io.EOF {
			return false
		}
		if err != nil {
			return false
		}
		start, ok := tok.(xml.StartElement)
		if !ok || start.Name.Local != "image" {
			continue
		}
		if !xmlStartHasAttr(start, "role", "image") {
			continue
		}
		for _, attr := range start.Attr {
			if attr.Name.Local == "href" && strings.TrimSpace(attr.Value) == href {
				return true
			}
		}
	}
}

func svgHrefRunPath(slidePath string, href string) (string, error) {
	href = strings.TrimSpace(href)
	if href == "" {
		return "", fmt.Errorf("empty href")
	}
	if strings.HasPrefix(href, "data:") || strings.HasPrefix(href, "http://") || strings.HasPrefix(href, "https://") {
		return href, nil
	}
	if filepath.IsAbs(href) || strings.Contains(href, `\`) || strings.Contains(href, ":") {
		return "", fmt.Errorf("unsafe SVG href %q", href)
	}
	baseDir := filepath.ToSlash(filepath.Dir(slidePath))
	clean := filepath.ToSlash(filepath.Clean(filepath.Join(baseDir, href)))
	if clean == "." || strings.HasPrefix(clean, "../") || strings.HasPrefix(clean, "/") {
		return "", fmt.Errorf("SVG href %q escapes run root from slide %q", href, slidePath)
	}
	return clean, nil
}

type semanticActiveAssetRef struct {
	Kind string
	Href string
}

func activeSVGAssetRefs(svg string) []semanticActiveAssetRef {
	decoder := xml.NewDecoder(strings.NewReader(svg))
	var refs []semanticActiveAssetRef
	for {
		tok, err := decoder.Token()
		if err == io.EOF {
			return refs
		}
		if err != nil {
			return refs
		}
		start, ok := tok.(xml.StartElement)
		if !ok {
			continue
		}
		kind := activeSVGAssetRefKind(start)
		if kind == "" {
			continue
		}
		for _, attr := range start.Attr {
			if attr.Name.Local == "href" {
				if href := strings.TrimSpace(attr.Value); href != "" {
					if strings.HasPrefix(href, "#") {
						continue
					}
					refs = append(refs, semanticActiveAssetRef{Kind: kind, Href: href})
				}
			}
		}
	}
}

func activeSVGAssetRefKind(start xml.StartElement) string {
	switch start.Name.Local {
	case "image", "use":
		return start.Name.Local
	case "rect":
		if xmlStartHasAttr(start, "role", "chart") {
			return "chart"
		}
	}
	return ""
}

func xmlStartHasAttr(start xml.StartElement, local string, value string) bool {
	for _, attr := range start.Attr {
		if attr.Name.Local == local && strings.TrimSpace(attr.Value) == value {
			return true
		}
	}
	return false
}

func (ctx *semanticEvaluationContext) artifactField(artifact string, field string) (any, bool, error) {
	value, err := ctx.readJSONArtifact(artifact)
	if err != nil {
		return nil, false, err
	}
	current := value
	for _, part := range strings.Split(field, ".") {
		part = strings.TrimSpace(part)
		if part == "" {
			return nil, false, fmt.Errorf("field path %q contains an empty component", field)
		}
		object, ok := current.(map[string]any)
		if !ok {
			return nil, false, nil
		}
		child, ok := object[part]
		if !ok {
			return nil, false, nil
		}
		current = child
	}
	return current, true, nil
}

func (ctx *semanticEvaluationContext) readJSONArtifact(artifact string) (any, error) {
	artifact = strings.TrimSpace(artifact)
	if cached, ok := ctx.jsonCache[artifact]; ok {
		return cached.value, cached.err
	}
	raw, err := readRunRegularArtifact(ctx.safeRoot, artifact)
	if err != nil {
		ctx.jsonCache[artifact] = semanticJSONArtifact{err: err}
		return nil, err
	}
	value, err := decodeJSONValue(raw)
	if err != nil {
		err = fmt.Errorf("artifact %q contains invalid JSON: %w", artifact, err)
		ctx.jsonCache[artifact] = semanticJSONArtifact{err: err}
		return nil, err
	}
	ctx.jsonCache[artifact] = semanticJSONArtifact{value: value}
	return value, nil
}

func (ctx *semanticEvaluationContext) readDeck() (authorDeck, error) {
	if ctx.deck != nil || ctx.deckErr != nil {
		if ctx.deck == nil {
			return authorDeck{}, ctx.deckErr
		}
		return *ctx.deck, nil
	}
	deck, err := readAuthorDeck(ctx.safeRoot, semanticDeckPath(ctx.run))
	if err != nil {
		ctx.deckErr = err
		return authorDeck{}, err
	}
	ctx.deck = &deck
	return deck, nil
}

func (ctx *semanticEvaluationContext) readContent() (qualityContentFile, error) {
	if ctx.content != nil || ctx.contentErr != nil {
		if ctx.content == nil {
			return qualityContentFile{}, ctx.contentErr
		}
		return *ctx.content, nil
	}
	content, err := readQualityContent(ctx.safeRoot)
	if err != nil {
		ctx.contentErr = err
		return qualityContentFile{}, err
	}
	ctx.content = &content
	return content, nil
}

func (ctx *semanticEvaluationContext) readAssets() (qualityAssetsFile, error) {
	if ctx.assets != nil || ctx.assetsErr != nil {
		if ctx.assets == nil {
			return qualityAssetsFile{}, ctx.assetsErr
		}
		return *ctx.assets, nil
	}
	assets, err := readQualityAssets(ctx.safeRoot)
	if err != nil {
		ctx.assetsErr = err
		return qualityAssetsFile{}, err
	}
	ctx.assets = &assets
	return assets, nil
}

func semanticDeckPath(run Run) string {
	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		return "outline/deck.json"
	}
	return deckPath
}

func semanticSlideAssetKey(slideID string, assetID string) string {
	return strings.TrimSpace(slideID) + "/" + strings.TrimSpace(assetID)
}

func semanticValueNonEmpty(value any) bool {
	switch typed := value.(type) {
	case nil:
		return false
	case string:
		return strings.TrimSpace(typed) != ""
	case []any:
		return len(typed) > 0
	case map[string]any:
		return len(typed) > 0
	default:
		return true
	}
}

func semanticFindingValue(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	default:
		raw, err := json.Marshal(typed)
		if err != nil {
			return fmt.Sprint(typed)
		}
		return string(raw)
	}
}

func semanticRuleFinding(rule SemanticRule, artifact string, field string, code string, message string) SemanticFinding {
	return SemanticFinding{
		RuleID:   strings.TrimSpace(rule.ID),
		Kind:     strings.TrimSpace(rule.Kind),
		Severity: strings.TrimSpace(rule.Severity),
		Code:     code,
		Artifact: strings.TrimSpace(artifact),
		Field:    strings.TrimSpace(field),
		Message:  message,
	}
}

func semanticRulePathFinding(rule SemanticRule, artifact string, path string, code string, message string) SemanticFinding {
	finding := semanticRuleFinding(rule, artifact, "", code, message)
	finding.Path = strings.TrimSpace(path)
	return finding
}
