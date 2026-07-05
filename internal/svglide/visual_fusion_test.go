package svglide

import (
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

func TestAnalyzeEdgePaletteSamplesRequestedEdge(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "edge.png")
	img := image.NewRGBA(image.Rect(0, 0, 100, 60))
	for y := 0; y < 60; y++ {
		for x := 0; x < 100; x++ {
			if x < 20 {
				img.Set(x, y, color.RGBA{R: 8, G: 12, B: 18, A: 255})
			} else {
				img.Set(x, y, color.RGBA{R: 230, G: 230, B: 230, A: 255})
			}
		}
	}
	writePNGForFusionTest(t, path, img)

	palette, err := AnalyzeEdgePalette(path, "left")
	if err != nil {
		t.Fatal(err)
	}
	if palette.Side != "left" || palette.Luminance > 40 {
		t.Fatalf("palette = %+v, want dark left edge", palette)
	}
	if ScoreFusionCandidate(palette) < 80 {
		t.Fatalf("ScoreFusionCandidate(%+v) too low", palette)
	}
}

func TestCheckSeamDelta(t *testing.T) {
	if ok, delta := CheckSeamDelta("#101820", "#111922"); !ok || delta > 45 {
		t.Fatalf("similar colors ok=%v delta=%d, want ok", ok, delta)
	}
	if ok, delta := CheckSeamDelta("#101820", "#F4F4F4"); ok || delta <= 45 {
		t.Fatalf("distant colors ok=%v delta=%d, want rejection", ok, delta)
	}
}

func writePNGForFusionTest(t *testing.T, path string, img image.Image) {
	t.Helper()
	file, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	if err := png.Encode(file, img); err != nil {
		t.Fatal(err)
	}
}
