package svglide

import (
	"strings"
	"time"
)

const (
	StageRequest               = "request"
	StageRequestResolution     = "request_resolution"
	StageResearch              = "research"
	StageDesignBrief           = "design_brief"
	StageOutline               = "outline"
	StageSlideContent          = "slide_content"
	StageAssets                = "assets"
	StageSVGAuthor             = "svg_author"
	StageValidatePreviewRepair = "validate_preview_repair"

	StatusPending     = "pending"
	StatusReady       = "ready"
	StatusInProgress  = "in_progress"
	StatusDone        = "done"
	StatusFailed      = "failed"
	StatusBlocked     = "blocked"
	StatusNeedsRepair = "needs_repair"
)

const (
	RouteProfileLocalSVGDeck      = "local_svg_deck"
	routeProfileImportedPPTX      = "imported_pptx"
	routeProfileTemplateReference = "template_reference"
	routeProfileLegacyEditor      = "legacy_editor"
)

const (
	VisualQualityModeStrict = "strict"
	VisualQualityModeWarn   = "warn"
)

type Run struct {
	Version           int           `json:"version"`
	Runtime           string        `json:"runtime"`
	Command           string        `json:"command"`
	RouteProfile      string        `json:"route_profile"`
	Title             string        `json:"title"`
	Input             string        `json:"input,omitempty"`
	Audience          string        `json:"audience,omitempty"`
	DeliveryMode      string        `json:"delivery_mode,omitempty"`
	VisualQualityMode string        `json:"visual_quality_mode,omitempty"`
	Pages             int           `json:"pages,omitempty"`
	Out               string        `json:"out"`
	CreatedAt         string        `json:"created_at"`
	UpdatedAt         string        `json:"updated_at"`
	CurrentStage      string        `json:"current_stage"`
	Stages            []Stage       `json:"stages"`
	Artifacts         ArtifactPaths `json:"artifacts"`
	Policy            Policy        `json:"policy"`
	Agent             AgentSession  `json:"agent"`
	Intent            Intent        `json:"intent"`
}

type AgentSession struct {
	Runtime string `json:"runtime"`
	ID      string `json:"id,omitempty"`
}

type Intent struct {
	SourceMode string `json:"source_mode"`
	Topic      string `json:"topic,omitempty"`
	Input      string `json:"input,omitempty"`
	Language   string `json:"language,omitempty"`
}

type Stage struct {
	Name    string   `json:"name"`
	Status  string   `json:"status"`
	Inputs  []string `json:"inputs"`
	Outputs []string `json:"outputs"`
	Receipt string   `json:"receipt"`
}

type ArtifactPaths struct {
	Deck        string `json:"deck"`
	SlidesDir   string `json:"slides_dir"`
	Preview     string `json:"preview"`
	RepairQueue string `json:"repair_queue"`
}

type Policy struct {
	PublishEnabled         bool `json:"publish_enabled"`
	NetworkByAgent         bool `json:"network_by_agent"`
	ImageGenerationByAgent bool `json:"image_generation_by_agent"`
	Overwrite              bool `json:"overwrite"`
}

type NewRunConfig struct {
	Title        string
	Input        string
	Topic        string
	Language     string
	Audience     string
	DeliveryMode string
	Pages        int
	Out          string
	Now          time.Time
	AgentRuntime string
	AgentID      string
	RouteProfile string
}

func NewRun(cfg NewRunConfig) Run {
	now := cfg.Now
	if now.IsZero() {
		now = time.Now()
	}
	ts := now.Format(time.RFC3339)
	agentRuntime := cfg.AgentRuntime
	if agentRuntime == "" {
		agentRuntime = "codex"
	}
	routeProfile := strings.TrimSpace(cfg.RouteProfile)
	if routeProfile == "" {
		routeProfile = RouteProfileLocalSVGDeck
	}
	sourceMode := "local_file"
	if cfg.Topic != "" {
		sourceMode = "topic"
	}
	return Run{
		Version:           1,
		Runtime:           "agent",
		Command:           "slides +create-svglide",
		RouteProfile:      routeProfile,
		Title:             cfg.Title,
		Input:             cfg.Input,
		Audience:          cfg.Audience,
		DeliveryMode:      cfg.DeliveryMode,
		VisualQualityMode: VisualQualityModeStrict,
		Pages:             cfg.Pages,
		Out:               cfg.Out,
		CreatedAt:         ts,
		UpdatedAt:         ts,
		CurrentStage:      StageRequest,
		Stages:            DefaultStages(),
		Artifacts: ArtifactPaths{
			Deck:        "outline/deck.json",
			SlidesDir:   "slides",
			Preview:     "preview.html",
			RepairQueue: "repair_queue.md",
		},
		Policy: Policy{
			PublishEnabled:         false,
			NetworkByAgent:         true,
			ImageGenerationByAgent: true,
			Overwrite:              false,
		},
		Agent: AgentSession{
			Runtime: agentRuntime,
			ID:      cfg.AgentID,
		},
		Intent: Intent{
			SourceMode: sourceMode,
			Topic:      cfg.Topic,
			Input:      cfg.Input,
			Language:   cfg.Language,
		},
	}
}

func DefaultStages() []Stage {
	return []Stage{
		{Name: StageRequest, Status: StatusPending, Inputs: []string{}, Outputs: []string{"request/request.json", "request/source_manifest.json"}, Receipt: "receipts/request.json"},
		{Name: StageRequestResolution, Status: StatusPending, Inputs: []string{"request/request.json", "request/source_manifest.json"}, Outputs: []string{"request/entity_resolution.json"}, Receipt: "receipts/request_resolution.json"},
		{Name: StageResearch, Status: StatusPending, Inputs: []string{"request/request.json", "request/source_manifest.json", "request/entity_resolution.json"}, Outputs: []string{"research/research_notes.md", "research/sources.json", "research/research_coverage.json"}, Receipt: "receipts/research.json"},
		{Name: StageDesignBrief, Status: StatusPending, Inputs: []string{"request/request.json", "research/research_notes.md"}, Outputs: []string{"brief/design_brief.json", "brief/visual_system.json", "brief/typography_contract.json"}, Receipt: "receipts/design_brief.json"},
		{Name: StageOutline, Status: StatusPending, Inputs: []string{"brief/design_brief.json", "brief/visual_system.json", "brief/typography_contract.json"}, Outputs: []string{"outline/deck.json"}, Receipt: "receipts/outline.json"},
		{Name: StageSlideContent, Status: StatusPending, Inputs: []string{"outline/deck.json", "research/research_notes.md", "research/sources.json"}, Outputs: []string{"content/slide_content.md", "content/slide_content.json", "content/slide_copy_plan.json"}, Receipt: "receipts/slide_content.json"},
		{Name: StageAssets, Status: StatusPending, Inputs: []string{"content/slide_content.json", "brief/visual_system.json"}, Outputs: []string{"assets/image_candidates.json", "assets/assets_plan.json", "assets/assets_manifest.json", "assets/asset_inventory.json", "assets/charts/chart_briefs.json", "assets/charts/chart_manifest.json", "receipts/chart_render.json"}, Receipt: "receipts/assets.json"},
		{Name: StageSVGAuthor, Status: StatusPending, Inputs: []string{"outline/deck.json", "content/slide_content.json", "brief/visual_system.json", "assets/assets_manifest.json", "assets/charts/chart_briefs.json", "assets/charts/chart_manifest.json"}, Outputs: []string{"slides/*.svg"}, Receipt: "receipts/svg_author.json"},
		{Name: StageValidatePreviewRepair, Status: StatusPending, Inputs: []string{"slides/*.svg"}, Outputs: []string{"receipts/lint.json", "receipts/preview.json", "receipts/rendered_visual.json", "receipts/image_usage.json", "receipts/chart_usage.json", "quality_report.json", "anygen_semantic_report.json", "visual_receipts.json", "creative_quality_report.json", "receipts/chart_quality.json", "repair_queue.md", "preview.html", "receipts/delivery.json"}, Receipt: "receipts/validate_preview_repair.json"},
	}
}
