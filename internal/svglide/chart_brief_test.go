package svglide

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEnsureEmptyChartBriefsForNoChartDeck(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Claim","source_refs":["web1"],"visuals":[{"id":"none","type":"none","instruction":"Text only"}]}]}`)

	if err := ensureEmptyChartBriefsForNoChartDeck("demo"); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join("demo", chartBriefsPath))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(raw), `"charts": []`) {
		t.Fatalf("chart_briefs = %s, want empty charts array", raw)
	}
}

func TestEnsureEmptyChartBriefsDoesNotHideMissingChartBriefForChartDeck(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Revenue","source_refs":["web1"],"visuals":[{"id":"revenue","type":"chart","instruction":"Revenue chart"}]}]}`)

	if err := ensureEmptyChartBriefsForNoChartDeck("demo"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join("demo", chartBriefsPath)); !os.IsNotExist(err) {
		t.Fatalf("chart_briefs should not be auto-created for chart deck, stat err = %v", err)
	}
}

func TestChartBriefRejectsNativeSVGRenderer(t *testing.T) {
	initStatusTestRun(t)
	mustWriteTestFile(t, "demo/content/slide_content.json", `{"prompt_contract":`+promptContractJSON(StageSlideContent)+`,"slides":[{"id":"s1","content":"Revenue","source_refs":["web1"],"visuals":[{"id":"revenue","type":"chart","instruction":"Revenue chart"}]}]}`)
	mustWriteTestFile(t, "demo/assets/charts/chart_briefs.json", `{"prompt_contract":`+promptContractJSON(StageAssets)+`,"charts":[{"id":"revenue","slide_id":"s1","purpose":"comparison","takeaway":"Revenue increased","renderer":"native-svg","data_source_ids":["web1"],"unit":"$"}]}`)

	err := ValidateChartBriefsGate("demo")
	if err == nil {
		t.Fatal("expected native-svg chart brief renderer to be rejected")
	}
	if !strings.Contains(err.Error(), "renderer") || !strings.Contains(err.Error(), "vega-lite") {
		t.Fatalf("error = %v, want renderer vega-lite rejection", err)
	}
}
