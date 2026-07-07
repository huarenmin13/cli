package svglide

import "testing"

func TestValidateThemeContractRejectsMissingCoreDimensions(t *testing.T) {
	t.Chdir(t.TempDir())
	mustWriteTestFile(t, "demo/request/theme_contract.json", `{"prompt_contract":{},"theme_contract":{"content_type":{"primary":"cultural_lifestyle_editorial"}}}`)

	err := ValidateThemeContractGate("demo")
	if err == nil {
		t.Fatalf("ValidateThemeContractGate returned nil, want missing dimensions error")
	}
}

func TestValidateThemeContractAcceptsChineseTeaContract(t *testing.T) {
	t.Chdir(t.TempDir())
	mustWriteTestFile(t, "demo/request/theme_contract.json", chineseTeaThemeContractJSONForTest())

	if err := ValidateThemeContractGate("demo"); err != nil {
		t.Fatalf("ValidateThemeContractGate returned %v, want nil", err)
	}
}

func TestValidateThemeContractRejectsRealImagesWithoutRoles(t *testing.T) {
	t.Chdir(t.TempDir())
	mustWriteTestFile(t, "demo/request/theme_contract.json", `{
	  "prompt_contract": {},
	  "theme_contract": {
	    "content_type": {"primary": "cultural_lifestyle_editorial", "secondary": []},
	    "subject_type": {"primary": "culture_practice", "named_entity": false, "entity_name": "中国茶"},
	    "delivery_format": {"primary": "self_read", "density": "medium_high"},
	    "evidence_type": {"primary": "taxonomy_process_region", "requires_sources": true},
	    "asset_needs": {"requires_real_images": true, "required_roles": [], "min_real_image_pages": 4, "min_dominant_real_image_pages": 3, "min_unique_real_images": 4, "cover_requires_dominant_real_image": true},
	    "layout_rhythm": {"min_slide_count": 9, "min_distinct_layout_archetypes": 6, "max_adjacent_same_archetype": 0, "required_page_roles": ["cover", "taxonomy", "closing"]},
	    "typography_identity": {"profile": "guochao_culture", "display_category": "serif_or_songti", "body_category": "songti_or_reading", "number_category": "sans_or_mono"},
	    "quality_floor": {"profile": "culture_editorial", "reason": "tea culture decks need real material evidence"},
	    "rationale": "open cultural topic"
	  }
	}`)

	err := ValidateThemeContractGate("demo")
	if err == nil {
		t.Fatalf("ValidateThemeContractGate returned nil, want asset role error")
	}
}

func TestApplyThemeContractToVisualContractCopiesAssetNeeds(t *testing.T) {
	base := qualityVisualContract{
		Profile:        "text_only",
		TopicArchetype: "",
	}
	theme := ThemeContractFile{
		ThemeContract: ThemeContract{
			ContentType: ThemePrimaryList{Primary: "food_beverage_culture"},
			AssetNeeds: ThemeAssetNeeds{
				RequiresRealImages:             true,
				MinRealImagePages:              4,
				MinDominantRealImagePages:      3,
				MinUniqueRealImages:            4,
				CoverRequiresDominantRealImage: true,
			},
			TypographyIdentity: ThemeTypography{Profile: "guochao_culture"},
			QualityFloor:       ThemeQualityFloor{Profile: "culture_editorial", Reason: "needs real material evidence"},
		},
	}

	got := applyThemeContractToVisualContract(base, theme)
	if !got.RequiresRealImages || !got.CoverRequiresRealHeroImage {
		t.Fatalf("contract = %+v, want theme image requirements applied", got)
	}
	if got.TopicArchetype != "food_beverage_culture" {
		t.Fatalf("topic_archetype = %q, want food_beverage_culture", got.TopicArchetype)
	}
	if got.MediaPressure.MinRealImagePages != 4 || got.MediaPressure.MinDominantRealImagePages != 3 || got.MediaPressure.MinUniqueRealImages != 4 || !got.MediaPressure.RequireCoverDominantRealImage {
		t.Fatalf("media_pressure = %+v, want copied theme asset needs", got.MediaPressure)
	}
	if got.Profile != "text_only" {
		t.Fatalf("profile = %q, want existing profile preserved", got.Profile)
	}
}

func chineseTeaThemeContractJSONForTest() string {
	return `{
	  "prompt_contract": {},
	  "theme_contract": {
	    "content_type": {"primary": "cultural_lifestyle_editorial", "secondary": ["food_beverage_culture", "education_explainer"]},
	    "subject_type": {"primary": "culture_practice", "named_entity": false, "entity_name": "中国茶"},
	    "delivery_format": {"primary": "self_read", "density": "medium_high"},
	    "evidence_type": {"primary": "taxonomy_process_region", "requires_sources": true},
	    "asset_needs": {
	      "requires_real_images": true,
	      "required_roles": ["tea_mountain", "tea_leaf_macro", "brewing_process", "tea_ware", "tea_soup", "tea_table_scene"],
	      "min_real_image_pages": 4,
	      "min_dominant_real_image_pages": 3,
	      "min_unique_real_images": 4,
	      "cover_requires_dominant_real_image": true
	    },
	    "layout_rhythm": {
	      "min_slide_count": 9,
	      "min_distinct_layout_archetypes": 6,
	      "max_adjacent_same_archetype": 0,
	      "required_page_roles": ["cover", "taxonomy", "region_map", "craft_process", "tasting_method", "brewing_parameters", "teaware", "modern_consumption", "closing"]
	    },
	    "typography_identity": {
	      "profile": "guochao_culture",
	      "display_category": "serif_or_songti",
	      "body_category": "songti_or_reading",
	      "number_category": "sans_or_mono"
	    },
	    "quality_floor": {"profile": "culture_editorial", "reason": "tea culture decks need real material, process, region, and tasting evidence"},
	    "rationale": "The request asks for an open cultural/lifestyle topic, not a finance or brand deck."
	  }
	}`
}
