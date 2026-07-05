package svglide

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"math"
	"os"
	"strconv"
	"strings"
)

type RGBColor struct {
	R uint8
	G uint8
	B uint8
}

type EdgePalette struct {
	Side      string `json:"side"`
	Hex       string `json:"hex"`
	Luminance int    `json:"luminance"`
	Texture   int    `json:"texture"`
}

func AnalyzeEdgePalette(path string, side string) (EdgePalette, error) {
	file, err := os.Open(path)
	if err != nil {
		return EdgePalette{}, err
	}
	defer file.Close()
	img, _, err := image.Decode(file)
	if err != nil {
		return EdgePalette{}, err
	}
	bounds := img.Bounds()
	if bounds.Dx() == 0 || bounds.Dy() == 0 {
		return EdgePalette{}, fmt.Errorf("image %q has empty bounds", path)
	}
	side = normalizedEdgeSide(side)
	minX, maxX, minY, maxY := edgeSampleRect(bounds, side)
	var count int
	var totalR, totalG, totalB, totalLum int
	var previousLum int
	var texture int
	for y := minY; y < maxY; y++ {
		for x := minX; x < maxX; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			color := RGBColor{R: uint8(r >> 8), G: uint8(g >> 8), B: uint8(b >> 8)}
			lum := colorLuminance(color)
			totalR += int(color.R)
			totalG += int(color.G)
			totalB += int(color.B)
			totalLum += lum
			if count > 0 {
				texture += absInt(lum - previousLum)
			}
			previousLum = lum
			count++
		}
	}
	if count == 0 {
		return EdgePalette{}, fmt.Errorf("image %q side %q has no sample pixels", path, side)
	}
	color := RGBColor{
		R: uint8(totalR / count),
		G: uint8(totalG / count),
		B: uint8(totalB / count),
	}
	return EdgePalette{
		Side:      side,
		Hex:       colorToHex(color),
		Luminance: totalLum / count,
		Texture:   texture / count,
	}, nil
}

func ScoreFusionCandidate(palette EdgePalette) int {
	score := 100
	if palette.Luminance > 110 {
		score -= (palette.Luminance - 110) / 2
	}
	if palette.Texture > 20 {
		score -= (palette.Texture - 20) * 2
	}
	if score < 0 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return score
}

func CheckSeamDelta(sampledHex string, panelHex string) (bool, int) {
	a, errA := parseHexColor(sampledHex)
	b, errB := parseHexColor(panelHex)
	if errA != nil || errB != nil {
		return false, 255
	}
	delta := colorDelta(a, b)
	return delta <= 45, delta
}

func normalizedEdgeSide(side string) string {
	switch strings.ToLower(strings.TrimSpace(side)) {
	case "right", "top", "bottom":
		return strings.ToLower(strings.TrimSpace(side))
	default:
		return "left"
	}
}

func edgeSampleRect(bounds image.Rectangle, side string) (int, int, int, int) {
	width := bounds.Dx()
	height := bounds.Dy()
	band := 80
	if width < band*4 {
		band = maxInt(1, width/5)
	}
	if height < band*4 {
		band = maxInt(1, height/5)
	}
	switch side {
	case "right":
		return bounds.Max.X - band, bounds.Max.X, bounds.Min.Y, bounds.Max.Y
	case "top":
		return bounds.Min.X, bounds.Max.X, bounds.Min.Y, bounds.Min.Y + band
	case "bottom":
		return bounds.Min.X, bounds.Max.X, bounds.Max.Y - band, bounds.Max.Y
	default:
		return bounds.Min.X, bounds.Min.X + band, bounds.Min.Y, bounds.Max.Y
	}
}

func parseHexColor(value string) (RGBColor, error) {
	value = strings.TrimSpace(strings.TrimPrefix(value, "#"))
	if len(value) == 3 {
		value = string([]byte{value[0], value[0], value[1], value[1], value[2], value[2]})
	}
	if len(value) != 6 {
		return RGBColor{}, fmt.Errorf("invalid hex color %q", value)
	}
	r, err := strconv.ParseUint(value[0:2], 16, 8)
	if err != nil {
		return RGBColor{}, err
	}
	g, err := strconv.ParseUint(value[2:4], 16, 8)
	if err != nil {
		return RGBColor{}, err
	}
	b, err := strconv.ParseUint(value[4:6], 16, 8)
	if err != nil {
		return RGBColor{}, err
	}
	return RGBColor{R: uint8(r), G: uint8(g), B: uint8(b)}, nil
}

func colorToHex(color RGBColor) string {
	return fmt.Sprintf("#%02X%02X%02X", color.R, color.G, color.B)
}

func colorLuminance(color RGBColor) int {
	return int(0.2126*float64(color.R) + 0.7152*float64(color.G) + 0.0722*float64(color.B))
}

func colorDelta(a RGBColor, b RGBColor) int {
	dr := int(a.R) - int(b.R)
	dg := int(a.G) - int(b.G)
	db := int(a.B) - int(b.B)
	return int(math.Sqrt(float64(dr*dr + dg*dg + db*db)))
}

func absInt(value int) int {
	if value < 0 {
		return -value
	}
	return value
}
