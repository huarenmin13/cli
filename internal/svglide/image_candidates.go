package svglide

import (
	"encoding/json"
	"fmt"
	"strings"
)

const imageCandidatesPath = "assets/image_candidates.json"

type imageCandidatesFile struct {
	RequiresRealImages bool             `json:"requires_real_images"`
	NoImageReason      string           `json:"no_image_reason"`
	AttemptedSources   []string         `json:"attempted_sources"`
	FailureReasonCode  string           `json:"failure_reason_code"`
	Candidates         []imageCandidate `json:"candidates"`
}

type imageCandidate struct {
	ID                    string `json:"id"`
	Query                 string `json:"query"`
	SourceURL             string `json:"source_url"`
	SourceClass           string `json:"source_class"`
	Format                string `json:"format"`
	Width                 int    `json:"width"`
	Height                int    `json:"height"`
	HasAlpha              bool   `json:"has_alpha"`
	AssetRole             string `json:"asset_role"`
	FitRole               string `json:"fit_role"`
	LocalPath             string `json:"local_path"`
	ScoreBP               int    `json:"score_bp"`
	Selected              bool   `json:"selected"`
	SelectionReason       string `json:"selection_reason"`
	FormatExceptionReason string `json:"format_exception_reason"`
	RejectionReason       string `json:"rejection_reason"`
	EvidenceRole          string `json:"evidence_role"`
}

func readImageCandidates(safeRoot string) (imageCandidatesFile, error) {
	raw, err := readRunRegularArtifact(safeRoot, imageCandidatesPath)
	if err != nil {
		return imageCandidatesFile{}, fmt.Errorf("read image candidates %q: %w", imageCandidatesPath, err)
	}
	var file imageCandidatesFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return imageCandidatesFile{}, fmt.Errorf("%s: invalid JSON: %w", imageCandidatesPath, err)
	}
	return file, nil
}

func ValidateImageCandidatesGate(safeRoot string) error {
	manifest, err := readAssetsManifest(safeRoot)
	if err != nil {
		return err
	}
	inventory, err := readAssetInventory(safeRoot)
	if err != nil {
		return err
	}
	candidates, err := readImageCandidates(safeRoot)
	if err != nil {
		return err
	}
	run, _ := readRunFile(safeRoot)
	deliveryContract, _, _ := readDeliveryContract(safeRoot, run)
	requiresRealImages := candidates.RequiresRealImages || deliveryContract.RequiresRealImages
	hasRasterAsset := false
	for _, asset := range manifest.Assets {
		if isRasterImageAsset(asset) {
			hasRasterAsset = true
			break
		}
	}
	if !requiresRealImages && len(candidates.Candidates) == 0 {
		if strings.TrimSpace(candidates.NoImageReason) == "" {
			return fmt.Errorf("image_candidates_gate: no real image candidates; set no_image_reason when requires_real_images=false")
		}
		if hasRasterAsset {
			return fmt.Errorf("image_candidates_gate: ready raster image assets require selected candidates even when requires_real_images=false")
		}
		return nil
	}
	if requiresRealImages {
		if err := validateImageCandidateSearchBreadth(candidates); err != nil {
			return err
		}
	}

	selectedByID := selectedImageCandidatesByID(candidates)
	selectedByPath := selectedImageCandidatesByLocalPath(candidates)
	inventoryByPath := inventoryItemByPath(inventory)
	for _, asset := range manifest.Assets {
		if !isRasterImageAsset(asset) {
			continue
		}
		path := assetPath(asset)
		item, ok := inventoryByPath[path]
		if !ok {
			return fmt.Errorf("image_candidates_gate: ready image asset %q path %q has no asset_inventory entry", assetID(asset), path)
		}
		candidate, ok := selectedCandidateForInventoryItem(item, selectedByID, selectedByPath)
		if !ok {
			return fmt.Errorf("image_candidates_gate: ready image asset %q path %q has no selected candidate", assetID(asset), path)
		}
		if strings.TrimSpace(item.CandidateID) != "" && strings.TrimSpace(candidate.LocalPath) != "" && strings.TrimSpace(candidate.LocalPath) != path {
			return fmt.Errorf("image_candidates_gate: asset %q candidate_id %q points to local_path %q, want %q", assetID(asset), item.CandidateID, candidate.LocalPath, path)
		}
		if strings.TrimSpace(candidate.SourceURL) == "" {
			return fmt.Errorf("image_candidates_gate: selected candidate for asset %q has empty source_url", assetID(asset))
		}
		if strings.TrimSpace(candidate.SelectionReason) == "" {
			return fmt.Errorf("image_candidates_gate: selected candidate for asset %q has empty selection_reason", assetID(asset))
		}
	}
	return nil
}

func selectedImageCandidatesByID(file imageCandidatesFile) map[string]imageCandidate {
	out := make(map[string]imageCandidate)
	for _, candidate := range file.Candidates {
		if !candidate.Selected {
			continue
		}
		id := strings.TrimSpace(candidate.ID)
		if id != "" {
			out[id] = candidate
		}
	}
	return out
}

func selectedImageCandidatesByLocalPath(file imageCandidatesFile) map[string]imageCandidate {
	out := make(map[string]imageCandidate)
	for _, candidate := range file.Candidates {
		if !candidate.Selected {
			continue
		}
		localPath := strings.TrimSpace(candidate.LocalPath)
		if localPath != "" {
			out[localPath] = candidate
		}
	}
	return out
}

func selectedCandidateForInventoryItem(item assetInventoryItem, byID, byPath map[string]imageCandidate) (imageCandidate, bool) {
	candidateID := strings.TrimSpace(item.CandidateID)
	if candidateID != "" {
		candidate, ok := byID[candidateID]
		return candidate, ok
	}
	candidate, ok := byPath[strings.TrimSpace(item.Path)]
	return candidate, ok
}

func validateImageCandidateSearchBreadth(file imageCandidatesFile) error {
	selectedCount := 0
	coverHeroCandidates := 0
	selectedCoverHeroFromUser := false
	roleCandidateCount := map[string]int{}
	selectedImportantRoles := map[string]bool{}
	userProvidedImportantRoles := map[string]bool{}
	for _, candidate := range file.Candidates {
		role := strings.TrimSpace(candidate.AssetRole)
		if role != "" {
			roleCandidateCount[role]++
		}
		if role == "hero_photo" && strings.TrimSpace(candidate.FitRole) == "full_bleed" {
			coverHeroCandidates++
			if candidate.Selected && strings.TrimSpace(candidate.SourceClass) == "user_provided" {
				selectedCoverHeroFromUser = true
			}
		}
		if candidate.Selected {
			selectedCount++
			if isImportantImageRole(role) {
				selectedImportantRoles[role] = true
				if strings.TrimSpace(candidate.SourceClass) == "user_provided" {
					userProvidedImportantRoles[role] = true
				}
			}
		} else if strings.TrimSpace(candidate.RejectionReason) == "" {
			return fmt.Errorf("image_candidates_gate: rejected candidate %q has empty rejection_reason", candidate.ID)
		}
	}
	if selectedCount == 0 {
		return fmt.Errorf("image_candidates_gate: requires_real_images=true but no selected image candidate exists")
	}
	if coverHeroCandidates > 0 && coverHeroCandidates < 3 && !selectedCoverHeroFromUser {
		return fmt.Errorf("image_candidates_gate: cover hero search needs at least 3 candidates, got %d", coverHeroCandidates)
	}
	for role := range selectedImportantRoles {
		if userProvidedImportantRoles[role] {
			continue
		}
		if roleCandidateCount[role] < 2 {
			return fmt.Errorf("image_candidates_gate: role %q needs at least 2 candidates, got %d", role, roleCandidateCount[role])
		}
	}
	return nil
}

func isImportantImageRole(role string) bool {
	switch role {
	case "hero_photo", "scene_photo", "factory_photo", "store_photo", "people_photo", "transparent_subject", "floating_product", "logo", "chip_device", "ui_screenshot", "product_screen", "paper_screenshot", "paper_figure", "repo_screenshot", "official_logo", "source_page_screenshot":
		return true
	default:
		return false
	}
}

func inventoryItemByPath(inventory assetInventoryFile) map[string]assetInventoryItem {
	out := make(map[string]assetInventoryItem)
	for _, item := range inventory.Items {
		if path := strings.TrimSpace(item.Path); path != "" {
			out[path] = item
		}
	}
	return out
}
