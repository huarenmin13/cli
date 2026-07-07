package svglide

import "testing"

func TestSlideFontThemePresetsReferenceSupportedFonts(t *testing.T) {
	catalog, err := loadSlideSupportedFonts()
	if err != nil {
		t.Fatal(err)
	}
	presets, err := loadSlideFontThemePresets()
	if err != nil {
		t.Fatal(err)
	}
	known := map[string]bool{}
	for _, font := range catalog.Fonts {
		known[font.FontFamily] = true
	}
	for presetName, preset := range presets.VisualMoodPresets {
		for role, families := range preset.Roles {
			if len(families) == 0 {
				t.Fatalf("%s.%s has no font candidates", presetName, role)
			}
			for _, family := range families {
				if !known[family] {
					t.Fatalf("%s.%s references unsupported font %q", presetName, role, family)
				}
			}
		}
	}
}

func TestTypographyProfileMismatchRejectsGenericTeaCultureProfile(t *testing.T) {
	contract := typographyContractFile{
		Profile: "guochao_culture tea editorial",
		Roles: map[string]typographyFontRole{
			"display": {Family: "Inter, Arial, sans-serif", Usage: "cover title"},
			"body":    {Family: "Inter, Arial, sans-serif", Usage: "body"},
			"number":  {Family: "Roboto Mono", Usage: "numbers"},
			"label":   {Family: "Inter", Usage: "labels"},
		},
	}

	if !typographyProfileMismatch(contract, "food_beverage_culture") {
		t.Fatalf("expected generic tea culture profile to mismatch")
	}
}

func TestTypographyProfileMismatchAllowsCulturalSerifIdentity(t *testing.T) {
	contract := typographyContractFile{
		Profile: "guochao_culture tea editorial",
		Roles: map[string]typographyFontRole{
			"display": {Family: "Noto Serif SC", Usage: "cover title"},
			"body":    {Family: "Songti SC", Usage: "reading body"},
			"number":  {Family: "Roboto Mono", Usage: "brewing parameters"},
			"label":   {Family: "Noto Sans SC", Usage: "labels"},
		},
	}

	if typographyProfileMismatch(contract, "food_beverage_culture") {
		t.Fatalf("expected cultural serif profile to match")
	}
}

func TestValidateTypographyAgainstFontCatalogAllowsPresetCanonicalFamilies(t *testing.T) {
	contract := typographyContractFile{
		Profile:       "middle school classical music appreciation",
		FontSource:    typographyFontSourcePreset,
		SelectedMoods: []string{"education_readable", "luxury_editorial"},
		Roles: map[string]typographyFontRole{
			"display": {Family: "Playfair Display", Usage: "dramatic classical title"},
			"body":    {Family: "Noto Sans SC", Usage: "classroom reading body"},
			"number":  {Family: "Montserrat", Usage: "movement numbers and listening timeline"},
			"label":   {Family: "Noto Sans SC", Usage: "captions"},
		},
	}

	result, err := validateTypographyAgainstFontCatalog(contract)
	if err != nil {
		t.Fatal(err)
	}
	if !result.OK() {
		t.Fatalf("catalog validation = %+v, want OK", result)
	}
}

func TestValidateTypographyAgainstFontCatalogRejectsCSSStacksAndUnsupportedFonts(t *testing.T) {
	contract := typographyContractFile{
		Profile:       "tea culture",
		FontSource:    typographyFontSourcePreset,
		SelectedMoods: []string{"culture_heritage"},
		Roles: map[string]typographyFontRole{
			"display": {Family: "Noto Serif CJK SC, Songti SC, serif", Usage: "title"},
			"body":    {Family: "PingFang SC", Usage: "body"},
			"number":  {Family: "Noto Sans SC", Usage: "numbers"},
			"label":   {Family: "Noto Sans SC", Usage: "labels"},
		},
	}

	result, err := validateTypographyAgainstFontCatalog(contract)
	if err != nil {
		t.Fatal(err)
	}
	if result.OK() {
		t.Fatalf("catalog validation unexpectedly passed")
	}
	if got := result.StackRoles["display"]; got == "" {
		t.Fatalf("StackRoles = %+v, want display stack failure", result.StackRoles)
	}
	if got := result.UnsupportedRoles["body"]; got != "PingFang SC" {
		t.Fatalf("UnsupportedRoles = %+v, want body PingFang SC", result.UnsupportedRoles)
	}
}

func TestValidateTypographyAgainstFontCatalogRejectsPresetMismatch(t *testing.T) {
	contract := typographyContractFile{
		Profile:       "sports broadcast",
		FontSource:    typographyFontSourcePreset,
		SelectedMoods: []string{"sports_broadcast"},
		Roles: map[string]typographyFontRole{
			"display": {Family: "Playfair Display", Usage: "cover title"},
			"body":    {Family: "Noto Sans SC", Usage: "body"},
			"number":  {Family: "Roboto Mono", Usage: "scores"},
			"label":   {Family: "Oswald", Usage: "labels"},
		},
	}

	result, err := validateTypographyAgainstFontCatalog(contract)
	if err != nil {
		t.Fatal(err)
	}
	if got := result.PresetMismatchRoles["display"]; got != "Playfair Display" {
		t.Fatalf("PresetMismatchRoles = %+v, want display Playfair Display", result.PresetMismatchRoles)
	}
	if got := result.PresetMismatchRoles["number"]; got != "Roboto Mono" {
		t.Fatalf("PresetMismatchRoles = %+v, want number Roboto Mono", result.PresetMismatchRoles)
	}
}
