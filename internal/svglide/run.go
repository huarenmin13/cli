package svglide

import "time"

const (
	StageRequest               = "request"
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

type Run struct {
	Version      int           `json:"version"`
	Runtime      string        `json:"runtime"`
	Command      string        `json:"command"`
	Title        string        `json:"title"`
	Input        string        `json:"input,omitempty"`
	Audience     string        `json:"audience,omitempty"`
	DeliveryMode string        `json:"delivery_mode,omitempty"`
	Pages        int           `json:"pages,omitempty"`
	Out          string        `json:"out"`
	CreatedAt    string        `json:"created_at"`
	UpdatedAt    string        `json:"updated_at"`
	CurrentStage string        `json:"current_stage"`
	Stages       []Stage       `json:"stages"`
	Artifacts    ArtifactPaths `json:"artifacts"`
	Policy       Policy        `json:"policy"`
	Agent        AgentSession  `json:"agent"`
	Intent       Intent        `json:"intent"`
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
	sourceMode := "local_file"
	if cfg.Topic != "" {
		sourceMode = "topic"
	}
	return Run{
		Version:      1,
		Runtime:      "agent",
		Command:      "slides +create-svglide",
		Title:        cfg.Title,
		Input:        cfg.Input,
		Audience:     cfg.Audience,
		DeliveryMode: cfg.DeliveryMode,
		Pages:        cfg.Pages,
		Out:          cfg.Out,
		CreatedAt:    ts,
		UpdatedAt:    ts,
		CurrentStage: StageRequest,
		Stages:       DefaultStages(),
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
		{Name: StageResearch, Status: StatusPending, Inputs: []string{"request/request.json", "request/source_manifest.json"}, Outputs: []string{"research/research_notes.md", "research/sources.json"}, Receipt: "receipts/research.json"},
		{Name: StageDesignBrief, Status: StatusPending, Inputs: []string{"request/request.json", "research/research_notes.md"}, Outputs: []string{"brief/design_brief.json", "brief/visual_system.json"}, Receipt: "receipts/design_brief.json"},
		{Name: StageOutline, Status: StatusPending, Inputs: []string{"brief/design_brief.json", "brief/visual_system.json"}, Outputs: []string{"outline/deck.json"}, Receipt: "receipts/outline.json"},
		{Name: StageSlideContent, Status: StatusPending, Inputs: []string{"outline/deck.json", "research/research_notes.md"}, Outputs: []string{"content/slide_content.md", "content/slide_content.json"}, Receipt: "receipts/slide_content.json"},
		{Name: StageAssets, Status: StatusPending, Inputs: []string{"content/slide_content.json", "brief/visual_system.json"}, Outputs: []string{"assets/assets_plan.json"}, Receipt: "receipts/assets.json"},
		{Name: StageSVGAuthor, Status: StatusPending, Inputs: []string{"outline/deck.json", "content/slide_content.json", "brief/visual_system.json", "assets/assets_plan.json"}, Outputs: []string{"slides/*.svg"}, Receipt: "receipts/svg_author.json"},
		{Name: StageValidatePreviewRepair, Status: StatusPending, Inputs: []string{"slides/*.svg"}, Outputs: []string{"receipts/lint.json", "receipts/preview.json", "quality_report.json", "anygen_semantic_report.json", "repair_queue.md", "preview.html", "receipts/delivery.json"}, Receipt: "receipts/validate_preview_repair.json"},
	}
}
