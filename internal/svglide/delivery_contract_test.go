package svglide

import (
	"slices"
	"testing"
)

func TestResolveDeliveryContractDetectsOnlineSlide(t *testing.T) {
	got := ResolveDeliveryContract("DeepSeek V4", "生成真实美观的线上 svg ppt", "")
	if got.DeliveryTarget != DeliveryTargetOnlineSlide {
		t.Fatalf("DeliveryTarget = %q, want %q", got.DeliveryTarget, DeliveryTargetOnlineSlide)
	}
	if !got.RequiresOnlineSlide {
		t.Fatal("RequiresOnlineSlide = false, want true")
	}
	if !got.RequiresRealImages {
		t.Fatal("RequiresRealImages = false, want true")
	}
}

func TestResolveDeliveryContractAllowsExplicitLocalPreview(t *testing.T) {
	got := ResolveDeliveryContract("Demo", "生成本地 SVG preview，不需要线上创建", DeliveryTargetLocalPreview)
	if got.DeliveryTarget != DeliveryTargetLocalPreview {
		t.Fatalf("DeliveryTarget = %q, want %q", got.DeliveryTarget, DeliveryTargetLocalPreview)
	}
	if got.RequiresOnlineSlide {
		t.Fatal("RequiresOnlineSlide = true, want false")
	}
}

func TestDeliveryTargetConflictsWithOnlineSignal(t *testing.T) {
	if !DeliveryTargetConflictsWithOnlineSignal("Demo", "请创建线上飞书 slide", DeliveryTargetLocalPreview) {
		t.Fatal("conflict = false, want true")
	}
	if DeliveryTargetConflictsWithOnlineSignal("Demo", "本地预览即可，不需要线上创建", DeliveryTargetLocalPreview) {
		t.Fatal("conflict = true, want false")
	}
}

func TestInitDeliveryContractUsesManifestPromptIDs(t *testing.T) {
	contract, err := promptContractForInitArtifact(StageRequestResolution)
	if err != nil {
		t.Fatal(err)
	}
	want, err := CorePromptIDsForProfile(RouteProfileLocalSVGDeck)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(contract.RequiredPromptIDs, want) {
		t.Fatalf("RequiredPromptIDs = %v, want manifest-derived %v", contract.RequiredPromptIDs, want)
	}
	for _, id := range []string{"mode_system_prompt_svg", "svg_reference", "svglide_local_runtime_binding", "svglide_visual_quality_overlay", "slide_font_catalog"} {
		if !slices.Contains(contract.RequiredPromptIDs, id) {
			t.Fatalf("RequiredPromptIDs missing %q: %v", id, contract.RequiredPromptIDs)
		}
	}
}
