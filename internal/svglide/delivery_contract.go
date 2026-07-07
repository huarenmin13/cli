package svglide

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"
)

const (
	DeliveryTargetLocalPreview = "local_preview"
	DeliveryTargetOnlineSlide  = "online_slide"
	DeliveryTargetBoth         = "both"

	deliveryContractPath = "request/delivery_contract.json"
)

type DeliveryContractFile struct {
	PromptContract   StagePromptContract `json:"prompt_contract,omitempty"`
	DeliveryContract DeliveryContract    `json:"delivery_contract"`
}

type DeliveryContract struct {
	DeliveryTarget       string   `json:"delivery_target"`
	RequiresOnlineSlide  bool     `json:"requires_online_slide"`
	RequiresLocalPreview bool     `json:"requires_local_preview"`
	RequiresRealImages   bool     `json:"requires_real_images"`
	Reason               string   `json:"reason"`
	DetectedSignals      []string `json:"detected_signals"`
}

func ResolveDeliveryContract(title string, topic string, explicitTarget string) DeliveryContract {
	raw := normalizeDeliveryContractText(title + " " + topic)
	target := normalizeDeliveryTarget(explicitTarget)
	if target == "" {
		target = DeliveryTargetLocalPreview
	}
	signals := deliverySignals(raw)
	onlineSignal := requestHasOnlineDeliverySignalText(raw)
	if explicitTarget == "" && onlineSignal {
		target = DeliveryTargetOnlineSlide
	}
	requiresOnline := target == DeliveryTargetOnlineSlide || target == DeliveryTargetBoth
	return DeliveryContract{
		DeliveryTarget:       target,
		RequiresOnlineSlide:  requiresOnline,
		RequiresLocalPreview: target == DeliveryTargetLocalPreview || target == DeliveryTargetBoth,
		RequiresRealImages:   requestHasRealImageSignalText(raw),
		Reason:               "resolved from explicit delivery target and request text",
		DetectedSignals:      signals,
	}
}

func NormalizeDeliveryTarget(target string) string {
	return normalizeDeliveryTarget(target)
}

func RequestHasOnlineDeliverySignal(title string, topic string) bool {
	return requestHasOnlineDeliverySignalText(normalizeDeliveryContractText(title + " " + topic))
}

func DeliveryTargetConflictsWithOnlineSignal(title string, topic string, target string) bool {
	return normalizeDeliveryTarget(target) == DeliveryTargetLocalPreview && RequestHasOnlineDeliverySignal(title, topic)
}

func normalizeDeliveryTarget(target string) string {
	switch strings.TrimSpace(target) {
	case "":
		return ""
	case DeliveryTargetLocalPreview:
		return DeliveryTargetLocalPreview
	case DeliveryTargetOnlineSlide:
		return DeliveryTargetOnlineSlide
	case DeliveryTargetBoth:
		return DeliveryTargetBoth
	default:
		return strings.TrimSpace(target)
	}
}

func deliverySignals(raw string) []string {
	out := []string{}
	for _, token := range []string{
		"线上", "飞书", "lark", "feishu", "online", "share", "共享", "创建 slide", "创建slides",
		"真实", "实际", "图片", "照片", "论文", "paper", "report", "pdf",
	} {
		if strings.Contains(raw, strings.ToLower(token)) {
			out = appendUnique(out, token)
		}
	}
	return out
}

func requestHasOnlineDeliverySignalText(raw string) bool {
	if containsAny(raw, []string{"不需要线上", "无需线上", "不要线上", "本地预览即可", "local preview only"}) {
		return false
	}
	return containsAny(raw, []string{
		"线上", "飞书", "lark", "feishu", "online", "share", "共享",
		"创建 slide", "创建slides", "真正创建", "线上 slide", "线上slides",
		"download the report as pdf", "下载为 pdf", "导出 pdf",
	})
}

func requestHasRealImageSignalText(raw string) bool {
	if containsAny(raw, []string{"纯向量", "不要图片", "不使用图片", "no photos", "no images", "vector-only", "chart-only"}) {
		return false
	}
	return containsAny(raw, []string{
		"真实", "实际", "美观", "视觉冲击", "图片", "照片", "官网", "论文", "paper", "report",
		"公司", "品牌", "人物", "地点", "赛事", "产品", "financial report", "deep dive",
	})
}

func normalizeDeliveryContractText(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func readDeliveryContract(safeRoot string, run Run) (DeliveryContract, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, deliveryContractPath)
	if err != nil {
		return ResolveDeliveryContract(run.Title, run.Intent.Topic, run.DeliveryTarget), false, nil
	}
	var file DeliveryContractFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return DeliveryContract{}, true, fmt.Errorf("%s: invalid JSON: %w", deliveryContractPath, err)
	}
	contract := file.DeliveryContract
	if strings.TrimSpace(contract.DeliveryTarget) == "" {
		contract = ResolveDeliveryContract(run.Title, run.Intent.Topic, run.DeliveryTarget)
	}
	return contract, true, nil
}

func ValidateDeliveryContractGate(safeRoot string) error {
	run, err := readRunFile(safeRoot)
	if err != nil {
		return err
	}
	contract, _, err := readDeliveryContract(safeRoot, run)
	if err != nil {
		return err
	}
	switch contract.DeliveryTarget {
	case DeliveryTargetLocalPreview, DeliveryTargetOnlineSlide, DeliveryTargetBoth:
	default:
		return fmt.Errorf("delivery_contract_gate: unsupported delivery_target %q", contract.DeliveryTarget)
	}
	if contract.DeliveryTarget == DeliveryTargetLocalPreview && RequestHasOnlineDeliverySignal(run.Title, run.Intent.Topic) {
		return fmt.Errorf("delivery_contract_gate: request asks for online delivery but delivery_target is local_preview")
	}
	if contract.RequiresOnlineSlide && contract.DeliveryTarget == DeliveryTargetLocalPreview {
		return fmt.Errorf("delivery_contract_gate: requires_online_slide=true conflicts with local_preview target")
	}
	return nil
}

func writeDeliveryContractFile(writeRoot string, opts InitOptions) error {
	contract := ResolveDeliveryContract(opts.Title, opts.Topic, opts.DeliveryTarget)
	promptContract, err := promptContractForInitArtifact(StageRequestResolution)
	if err != nil {
		return err
	}
	return writeJSON(filepath.Join(writeRoot, deliveryContractPath), DeliveryContractFile{
		PromptContract:   promptContract,
		DeliveryContract: contract,
	})
}

func promptContractForInitArtifact(stage string) (StagePromptContract, error) {
	requiredPromptIDs, err := CorePromptIDsForProfile(RouteProfileLocalSVGDeck)
	if err != nil {
		return StagePromptContract{}, err
	}
	return StagePromptContract{
		Protocol:          ProtocolAnyGenSVGSlides,
		Stage:             stage,
		Orchestrator:      "mode_system_prompt_svg",
		ProtocolReference: "svg_reference",
		RequiredPromptIDs: requiredPromptIDs,
	}, nil
}
