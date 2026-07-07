package svglide

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"
)

const svgPublishRequestEvidencePath = "publish/request_evidence.json"

type SVGPublishRequestEvidence struct {
	Status                  string                    `json:"status"`
	ContentType             string                    `json:"content_type"`
	Title                   string                    `json:"title,omitempty"`
	SlideCount              int                       `json:"slide_count"`
	Slides                  []SVGPublishSlideEvidence `json:"slides"`
	ForbiddenFormatDetected bool                      `json:"forbidden_format_detected"`
	Issues                  []ValidationIssue         `json:"issues"`
	CreatedAt               string                    `json:"created_at"`
}

type SVGPublishSlideEvidence struct {
	Path          string `json:"path"`
	ContentRoot   string `json:"content_root"`
	SHA256        string `json:"sha256"`
	ContentBytes  int    `json:"content_bytes"`
	ContentPrefix string `json:"content_prefix"`
}

func BuildAndWriteSVGPublishRequestEvidence(root string) (SVGPublishRequestEvidence, error) {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return SVGPublishRequestEvidence{}, err
	}
	evidence, err := buildSVGPublishRequestEvidence(safeRoot, run)
	if writeErr := writeSVGPublishRequestEvidence(safeRoot, evidence); writeErr != nil {
		if err != nil {
			return evidence, fmt.Errorf("%w; write SVG publish request evidence: %v", err, writeErr)
		}
		return evidence, writeErr
	}
	return evidence, err
}

func buildSVGPublishRequestEvidence(safeRoot string, run Run) (SVGPublishRequestEvidence, error) {
	evidence := SVGPublishRequestEvidence{
		Status:      "passed",
		ContentType: "svg",
		Title:       strings.TrimSpace(run.Title),
		Slides:      []SVGPublishSlideEvidence{},
		Issues:      []ValidationIssue{},
		CreatedAt:   time.Now().Format(time.RFC3339),
	}
	slidePaths, err := publishSlidePaths(safeRoot, run)
	if err != nil {
		evidence.Status = "failed"
		evidence.Issues = append(evidence.Issues, ValidationIssue{
			Path:    strings.TrimSpace(run.Artifacts.Deck),
			Code:    "svglide.publish_svg.deck",
			Message: err.Error(),
		})
		return evidence, fmt.Errorf("build SVG publish evidence: %w", err)
	}
	if len(slidePaths) == 0 {
		evidence.Status = "failed"
		evidence.Issues = append(evidence.Issues, ValidationIssue{
			Path:    strings.TrimSpace(run.Artifacts.Deck),
			Code:    "svglide.publish_svg.no_slides",
			Message: "publish payload must include at least one SVG slide",
		})
		return evidence, fmt.Errorf("build SVG publish evidence: no SVG slides")
	}
	for _, slidePath := range slidePaths {
		raw, err := readRunRegularArtifact(safeRoot, slidePath)
		if err != nil {
			evidence.Status = "failed"
			evidence.Issues = append(evidence.Issues, ValidationIssue{Path: slidePath, Code: "svglide.publish_svg.read", Message: err.Error()})
			continue
		}
		rootName, rootSpace, rootErr := xmlRootName(raw)
		slideEvidence := SVGPublishSlideEvidence{
			Path:          slidePath,
			ContentRoot:   rootName,
			SHA256:        sha256Hex(raw),
			ContentBytes:  len(raw),
			ContentPrefix: contentPrefix(raw),
		}
		evidence.Slides = append(evidence.Slides, slideEvidence)
		if rootErr != nil {
			evidence.Status = "failed"
			evidence.Issues = append(evidence.Issues, ValidationIssue{Path: slidePath, Code: "svglide.publish_svg.xml", Message: rootErr.Error()})
			continue
		}
		if detectForbiddenPublishFormat(raw, rootName) {
			evidence.ForbiddenFormatDetected = true
			evidence.Status = "failed"
			evidence.Issues = append(evidence.Issues, ValidationIssue{
				Path:    slidePath,
				Code:    "svglide.publish_svg.forbidden_format",
				Message: "publish payload must be raw SVG content, not Slides XML, SXSD, HTML, raster image, or data URL fallback",
			})
		}
		if rootName != "svg" || rootSpace != svgNamespace {
			evidence.Status = "failed"
			evidence.Issues = append(evidence.Issues, ValidationIssue{
				Path:    slidePath,
				Code:    "svglide.publish_svg.root",
				Message: "publish payload content root must be <svg>",
			})
		}
		for _, issue := range lintSVG(slidePath, raw) {
			evidence.Status = "failed"
			evidence.Issues = append(evidence.Issues, issue)
		}
	}
	evidence.SlideCount = len(evidence.Slides)
	if evidence.Status != "passed" {
		return evidence, fmt.Errorf("SVG publish request evidence failed with %d issue(s)", len(evidence.Issues))
	}
	return evidence, nil
}

func publishSlidePaths(safeRoot string, run Run) ([]string, error) {
	deckPath := strings.TrimSpace(run.Artifacts.Deck)
	if deckPath == "" {
		return nil, fmt.Errorf("deck artifact path is empty")
	}
	deckRaw, err := readRunRegularArtifact(safeRoot, deckPath)
	if err != nil {
		return nil, err
	}
	var deck validationDeck
	if err := json.Unmarshal(deckRaw, &deck); err != nil {
		return nil, fmt.Errorf("deck %q contains invalid JSON: %w", deckPath, err)
	}
	paths := make([]string, 0, len(deck.Slides))
	for _, slide := range deck.Slides {
		path := strings.TrimSpace(slide.Path)
		if path == "" {
			return nil, fmt.Errorf("deck %q contains a slide with empty path", deckPath)
		}
		clean := filepath.ToSlash(filepath.Clean(path))
		if clean != path || !strings.HasPrefix(clean, "slides/") || strings.Count(clean, "/") != 1 || strings.ToLower(filepath.Ext(clean)) != ".svg" {
			return nil, fmt.Errorf("slide path %q must be a single-level slides/*.svg path", path)
		}
		paths = append(paths, clean)
	}
	return paths, nil
}

func ReadSVGPublishSlides(root string, evidence SVGPublishRequestEvidence) ([]string, error) {
	if evidence.Status != "passed" || evidence.ContentType != "svg" || evidence.ForbiddenFormatDetected {
		return nil, fmt.Errorf("SVG publish evidence status=%q content_type=%q forbidden=%v", evidence.Status, evidence.ContentType, evidence.ForbiddenFormatDetected)
	}
	if len(evidence.Slides) == 0 || evidence.SlideCount != len(evidence.Slides) {
		return nil, fmt.Errorf("SVG publish evidence slide_count=%d but has %d slide entries", evidence.SlideCount, len(evidence.Slides))
	}
	safeRoot, _, err := readRun(root)
	if err != nil {
		return nil, err
	}
	slides := make([]string, 0, len(evidence.Slides))
	for _, slide := range evidence.Slides {
		path := strings.TrimSpace(slide.Path)
		clean := filepath.ToSlash(filepath.Clean(path))
		if clean != path || !strings.HasPrefix(clean, "slides/") || strings.Count(clean, "/") != 1 || strings.ToLower(filepath.Ext(clean)) != ".svg" {
			return nil, fmt.Errorf("SVG publish evidence slide path %q is not a single-level slides/*.svg path", path)
		}
		if slide.ContentRoot != "svg" || strings.TrimSpace(slide.SHA256) == "" {
			return nil, fmt.Errorf("SVG publish evidence for %s is not a verified SVG slide", path)
		}
		raw, err := readRunRegularArtifact(safeRoot, path)
		if err != nil {
			return nil, err
		}
		if got := sha256Hex(raw); got != slide.SHA256 {
			return nil, fmt.Errorf("SVG publish evidence for %s is stale: sha256 %s want %s", path, got, slide.SHA256)
		}
		rootName, rootSpace, err := xmlRootName(raw)
		if err != nil {
			return nil, err
		}
		if rootName != "svg" || rootSpace != svgNamespace || detectForbiddenPublishFormat(raw, rootName) {
			return nil, fmt.Errorf("SVG publish payload %s is no longer raw SVG content", path)
		}
		slides = append(slides, string(raw))
	}
	return slides, nil
}

func xmlRootName(raw []byte) (string, string, error) {
	decoder := xml.NewDecoder(bytes.NewReader(raw))
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			return "", "", fmt.Errorf("missing XML root element")
		}
		if err != nil {
			return "", "", fmt.Errorf("invalid XML: %w", err)
		}
		if start, ok := token.(xml.StartElement); ok {
			return start.Name.Local, start.Name.Space, nil
		}
	}
}

func detectForbiddenPublishFormat(raw []byte, rootName string) bool {
	trimmed := strings.TrimSpace(string(raw))
	lower := strings.ToLower(trimmed)
	if strings.HasPrefix(lower, "<!doctype html") || strings.HasPrefix(lower, "<html") || strings.HasPrefix(lower, "data:image/") {
		return true
	}
	if len(raw) >= 8 && bytes.Equal(raw[:8], []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}) {
		return true
	}
	if len(raw) >= 3 && raw[0] == 0xff && raw[1] == 0xd8 && raw[2] == 0xff {
		return true
	}
	switch rootName {
	case "slide", "presentation", "sxsd", "document", "html":
		return true
	default:
		return false
	}
}

func contentPrefix(raw []byte) string {
	trimmed := strings.TrimSpace(string(raw))
	if len(trimmed) > 160 {
		trimmed = trimmed[:160]
	}
	return trimmed
}

func writeSVGPublishRequestEvidence(safeRoot string, evidence SVGPublishRequestEvidence) error {
	target, err := ensureRunFileTargetForWrite(safeRoot, svgPublishRequestEvidencePath)
	if err != nil {
		return err
	}
	return writeJSON(target, evidence)
}
