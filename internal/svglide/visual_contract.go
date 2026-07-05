package svglide

import "strings"

const (
	requiredChartRendererNone     = "none"
	requiredChartRendererSVG      = "svg"
	requiredChartRendererVegaLite = "vega-lite"
)

func normalizedRequiredChartRenderer(value string) string {
	switch strings.TrimSpace(value) {
	case requiredChartRendererSVG:
		return requiredChartRendererSVG
	case requiredChartRendererVegaLite:
		return requiredChartRendererVegaLite
	default:
		return requiredChartRendererNone
	}
}

func visualContractRequiresChartManifest(contract qualityVisualContract) bool {
	return normalizedRequiredChartRenderer(contract.RequiredChartRenderer) == requiredChartRendererVegaLite ||
		contract.MinChartSVGAssets > 0 ||
		contract.MinVegaLiteSpecs > 0
}

func visualContractRequiresTypography(contract qualityVisualContract) bool {
	return contract.TypographyContractRequired
}
