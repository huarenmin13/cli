package svglide

import (
	"embed"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

const (
	slideSupportedFontsPath    = "font_catalog/slide_supported_fonts.json"
	slideFontThemePresetsPath  = "font_catalog/slide_font_theme_presets.json"
	typographyFontSourcePreset = "slide_font_theme_presets"
)

//go:embed font_catalog/slide_supported_fonts.json font_catalog/slide_font_theme_presets.json font_catalog/slide_font_tags.json
var slideFontCatalogFS embed.FS

type slideSupportedFontsFile struct {
	Version string `json:"version,omitempty"`
	Counts  struct {
		Total int `json:"total"`
	} `json:"counts"`
	Fonts []slideSupportedFont `json:"fonts"`
}

type slideSupportedFont struct {
	FontFamily string            `json:"font_family"`
	Source     string            `json:"source"`
	Lang       string            `json:"lang"`
	Display    map[string]string `json:"display_name"`
}

type slideFontThemePresetsFile struct {
	Version           string                         `json:"version"`
	Status            string                         `json:"status"`
	VisualMoodPresets map[string]slideFontMoodPreset `json:"visual_mood_presets"`
}

type slideFontMoodPreset struct {
	Themes []string                   `json:"themes"`
	Intent string                     `json:"intent"`
	Roles  map[string][]string        `json:"roles"`
	Notes  []string                   `json:"notes,omitempty"`
	Extra  map[string]json.RawMessage `json:"-"`
}

type typographyCatalogValidation struct {
	MissingSource       bool
	MissingSelectedMood bool
	UnknownMoods        []string
	UnsupportedRoles    map[string]string
	StackRoles          map[string]string
	PresetMismatchRoles map[string]string
}

func loadSlideSupportedFonts() (slideSupportedFontsFile, error) {
	raw, err := slideFontCatalogFS.ReadFile(slideSupportedFontsPath)
	if err != nil {
		return slideSupportedFontsFile{}, err
	}
	var catalog slideSupportedFontsFile
	if err := json.Unmarshal(raw, &catalog); err != nil {
		return slideSupportedFontsFile{}, fmt.Errorf("%s: invalid JSON: %w", slideSupportedFontsPath, err)
	}
	return catalog, nil
}

func loadSlideFontThemePresets() (slideFontThemePresetsFile, error) {
	raw, err := slideFontCatalogFS.ReadFile(slideFontThemePresetsPath)
	if err != nil {
		return slideFontThemePresetsFile{}, err
	}
	var presets slideFontThemePresetsFile
	if err := json.Unmarshal(raw, &presets); err != nil {
		return slideFontThemePresetsFile{}, fmt.Errorf("%s: invalid JSON: %w", slideFontThemePresetsPath, err)
	}
	return presets, nil
}

func validateTypographyAgainstFontCatalog(contract typographyContractFile) (typographyCatalogValidation, error) {
	catalog, err := loadSlideSupportedFonts()
	if err != nil {
		return typographyCatalogValidation{}, err
	}
	presets, err := loadSlideFontThemePresets()
	if err != nil {
		return typographyCatalogValidation{}, err
	}
	knownFonts := make(map[string]bool, len(catalog.Fonts))
	for _, font := range catalog.Fonts {
		if strings.TrimSpace(font.FontFamily) != "" {
			knownFonts[font.FontFamily] = true
		}
	}

	result := typographyCatalogValidation{
		UnsupportedRoles:    map[string]string{},
		StackRoles:          map[string]string{},
		PresetMismatchRoles: map[string]string{},
	}
	if strings.TrimSpace(contract.FontSource) != typographyFontSourcePreset {
		result.MissingSource = true
	}
	selectedMoods := nonEmptyStrings(contract.SelectedMoods)
	if len(selectedMoods) == 0 {
		result.MissingSelectedMood = true
	}
	allowedByRole := map[string]map[string]bool{}
	for _, mood := range selectedMoods {
		preset, ok := presets.VisualMoodPresets[mood]
		if !ok {
			result.UnknownMoods = append(result.UnknownMoods, mood)
			continue
		}
		for role, candidates := range preset.Roles {
			if allowedByRole[role] == nil {
				allowedByRole[role] = map[string]bool{}
			}
			for _, candidate := range candidates {
				allowedByRole[role][candidate] = true
			}
		}
	}
	sort.Strings(result.UnknownMoods)

	for _, role := range []string{"display", "body", "number", "label"} {
		font := contract.Roles[role]
		family := strings.TrimSpace(font.Family)
		if strings.Contains(family, ",") {
			result.StackRoles[role] = family
			continue
		}
		if !knownFonts[family] {
			result.UnsupportedRoles[role] = family
			continue
		}
		if len(selectedMoods) > 0 && len(result.UnknownMoods) == 0 {
			allowed := allowedByRole[role]
			if len(allowed) > 0 && !allowed[family] {
				result.PresetMismatchRoles[role] = family
			}
		}
	}
	return result, nil
}

func (v typographyCatalogValidation) OK() bool {
	return !v.MissingSource &&
		!v.MissingSelectedMood &&
		len(v.UnknownMoods) == 0 &&
		len(v.UnsupportedRoles) == 0 &&
		len(v.StackRoles) == 0 &&
		len(v.PresetMismatchRoles) == 0
}

func sortedRoleFontPairs(values map[string]string) string {
	if len(values) == 0 {
		return ""
	}
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%q", key, values[key]))
	}
	return strings.Join(parts, ", ")
}
