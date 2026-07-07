package svglide

import (
	"encoding/json"
	"fmt"
	"strings"
)

const themeContractPath = "request/theme_contract.json"

type ThemeContractFile struct {
	PromptContract json.RawMessage `json:"prompt_contract,omitempty"`
	ThemeContract  ThemeContract   `json:"theme_contract"`
}

type ThemeContract struct {
	ContentType        ThemePrimaryList    `json:"content_type"`
	SubjectType        ThemeSubjectType    `json:"subject_type"`
	DeliveryFormat     ThemeDeliveryFormat `json:"delivery_format"`
	EvidenceType       ThemeEvidenceType   `json:"evidence_type"`
	AssetNeeds         ThemeAssetNeeds     `json:"asset_needs"`
	LayoutRhythm       ThemeLayoutRhythm   `json:"layout_rhythm"`
	TypographyIdentity ThemeTypography     `json:"typography_identity"`
	QualityFloor       ThemeQualityFloor   `json:"quality_floor"`
	Rationale          string              `json:"rationale"`
}

type ThemePrimaryList struct {
	Primary   string   `json:"primary"`
	Secondary []string `json:"secondary"`
}

type ThemeSubjectType struct {
	Primary     string `json:"primary"`
	NamedEntity bool   `json:"named_entity"`
	EntityName  string `json:"entity_name"`
}

type ThemeDeliveryFormat struct {
	Primary string `json:"primary"`
	Density string `json:"density"`
}

type ThemeEvidenceType struct {
	Primary         string `json:"primary"`
	RequiresSources bool   `json:"requires_sources"`
}

type ThemeAssetNeeds struct {
	RequiresRealImages             bool     `json:"requires_real_images"`
	RequiredRoles                  []string `json:"required_roles"`
	MinRealImagePages              int      `json:"min_real_image_pages"`
	MinDominantRealImagePages      int      `json:"min_dominant_real_image_pages"`
	MinUniqueRealImages            int      `json:"min_unique_real_images"`
	CoverRequiresDominantRealImage bool     `json:"cover_requires_dominant_real_image"`
}

type ThemeLayoutRhythm struct {
	MinSlideCount               int      `json:"min_slide_count"`
	MinDistinctLayoutArchetypes int      `json:"min_distinct_layout_archetypes"`
	MaxAdjacentSameArchetype    int      `json:"max_adjacent_same_archetype"`
	RequiredPageRoles           []string `json:"required_page_roles"`
}

type ThemeTypography struct {
	Profile         string `json:"profile"`
	DisplayCategory string `json:"display_category"`
	BodyCategory    string `json:"body_category"`
	NumberCategory  string `json:"number_category"`
}

type ThemeQualityFloor struct {
	Profile string `json:"profile"`
	Reason  string `json:"reason"`
}

func readThemeContract(safeRoot string) (ThemeContractFile, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, themeContractPath)
	if err != nil {
		return ThemeContractFile{}, false, err
	}
	var file ThemeContractFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return ThemeContractFile{}, true, fmt.Errorf("%s: invalid JSON: %w", themeContractPath, err)
	}
	return file, true, nil
}

func applyThemeContractToVisualContract(contract qualityVisualContract, theme ThemeContractFile) qualityVisualContract {
	themeContract := theme.ThemeContract
	if primary := strings.TrimSpace(themeContract.ContentType.Primary); primary != "" && strings.TrimSpace(contract.TopicArchetype) == "" {
		contract.TopicArchetype = primary
	}
	if profile := strings.TrimSpace(themeContract.QualityFloor.Profile); profile != "" && strings.TrimSpace(contract.Profile) == "" {
		contract.Profile = profile
	}
	if deckType := strings.TrimSpace(themeContract.ContentType.Primary); deckType != "" && strings.TrimSpace(contract.DeckType) == "" {
		contract.DeckType = deckType
	}
	if strings.TrimSpace(themeContract.TypographyIdentity.Profile) != "" {
		contract.TypographyContractRequired = true
	}
	assetNeeds := themeContract.AssetNeeds
	if assetNeeds.RequiresRealImages {
		contract.RequiresRealImages = true
		contract.ForbidPreviewWrapperImagesAsRealImages = true
	}
	if assetNeeds.CoverRequiresDominantRealImage {
		contract.CoverRequiresRealHeroImage = true
		contract.MustHave.StrongCover = true
		contract.MediaPressure.RequireCoverDominantRealImage = true
	}
	if assetNeeds.MinRealImagePages > contract.MediaPressure.MinRealImagePages {
		contract.MediaPressure.MinRealImagePages = assetNeeds.MinRealImagePages
	}
	if assetNeeds.MinDominantRealImagePages > contract.MediaPressure.MinDominantRealImagePages {
		contract.MediaPressure.MinDominantRealImagePages = assetNeeds.MinDominantRealImagePages
	}
	if assetNeeds.MinUniqueRealImages > contract.MediaPressure.MinUniqueRealImages {
		contract.MediaPressure.MinUniqueRealImages = assetNeeds.MinUniqueRealImages
	}
	return contract
}

func themeContractEnforcesQuality(theme ThemeContractFile) bool {
	contract := theme.ThemeContract
	contentType := strings.TrimSpace(contract.ContentType.Primary)
	qualityProfile := strings.TrimSpace(contract.QualityFloor.Profile)
	if contract.AssetNeeds.RequiresRealImages {
		return true
	}
	if qualityProfile == "chart_only" {
		return false
	}
	if contentType == "generic_explainer" && qualityProfile == "default_floor" {
		return false
	}
	return contentType != "" || qualityProfile != ""
}

func ValidateThemeContractGate(safeRoot string) error {
	file, _, err := readThemeContract(safeRoot)
	if err != nil {
		return fmt.Errorf("%s: read artifact: %w", themeContractPath, err)
	}
	contract := file.ThemeContract
	required := map[string]string{
		"content_type.primary":                 contract.ContentType.Primary,
		"subject_type.primary":                 contract.SubjectType.Primary,
		"delivery_format.primary":              contract.DeliveryFormat.Primary,
		"delivery_format.density":              contract.DeliveryFormat.Density,
		"evidence_type.primary":                contract.EvidenceType.Primary,
		"typography_identity.profile":          contract.TypographyIdentity.Profile,
		"typography_identity.display_category": contract.TypographyIdentity.DisplayCategory,
		"typography_identity.body_category":    contract.TypographyIdentity.BodyCategory,
		"quality_floor.profile":                contract.QualityFloor.Profile,
		"quality_floor.reason":                 contract.QualityFloor.Reason,
		"rationale":                            contract.Rationale,
	}
	for field, value := range required {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("theme_contract_gate: %s is required", field)
		}
	}
	if contract.AssetNeeds.RequiresRealImages {
		if len(nonEmptyStrings(contract.AssetNeeds.RequiredRoles)) == 0 {
			return fmt.Errorf("theme_contract_gate: asset_needs.required_roles is required when real images are required")
		}
		if contract.AssetNeeds.MinRealImagePages <= 0 {
			return fmt.Errorf("theme_contract_gate: asset_needs.min_real_image_pages must be > 0 when real images are required")
		}
		if contract.AssetNeeds.MinUniqueRealImages <= 0 {
			return fmt.Errorf("theme_contract_gate: asset_needs.min_unique_real_images must be > 0 when real images are required")
		}
	}
	if contract.LayoutRhythm.MinSlideCount < 1 {
		return fmt.Errorf("theme_contract_gate: layout_rhythm.min_slide_count must be > 0")
	}
	if contract.LayoutRhythm.MinDistinctLayoutArchetypes < 1 {
		return fmt.Errorf("theme_contract_gate: layout_rhythm.min_distinct_layout_archetypes must be > 0")
	}
	if len(nonEmptyStrings(contract.LayoutRhythm.RequiredPageRoles)) < 3 {
		return fmt.Errorf("theme_contract_gate: layout_rhythm.required_page_roles must include at least cover, body, and closing roles")
	}
	return nil
}

func nonEmptyStrings(values []string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			out = append(out, value)
		}
	}
	return out
}
