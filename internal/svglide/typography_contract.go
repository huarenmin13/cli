package svglide

import (
	"encoding/json"
	"fmt"
	"strings"
)

const typographyContractPath = "brief/typography_contract.json"

type typographyContractFile struct {
	PromptContract json.RawMessage               `json:"prompt_contract,omitempty"`
	Profile        string                        `json:"profile"`
	Roles          map[string]typographyFontRole `json:"roles"`
	Rules          []string                      `json:"rules"`
}

type typographyFontRole struct {
	Family string `json:"family"`
	Weight string `json:"weight"`
	Size   string `json:"size"`
	Usage  string `json:"usage"`
}

type typographyIdentityResult struct {
	ConcreteFamilyCount  int
	RolePairingCount     int
	GenericFallbackOnly  bool
	RepeatedDefaultStack bool
	ProfileMismatch      bool
}

func readTypographyContract(safeRoot string) (typographyContractFile, bool, error) {
	raw, err := readRunRegularArtifact(safeRoot, typographyContractPath)
	if err != nil {
		return typographyContractFile{}, false, err
	}
	var file typographyContractFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return typographyContractFile{}, true, fmt.Errorf("%s: invalid JSON: %w", typographyContractPath, err)
	}
	return file, true, nil
}

func typographyContractHasRequiredRoles(file typographyContractFile) bool {
	for _, role := range []string{"display", "body", "number", "label"} {
		font, ok := file.Roles[role]
		if !ok || strings.TrimSpace(font.Family) == "" {
			return false
		}
	}
	return true
}

func evaluateTypographyIdentity(contract typographyContractFile, deckType string) typographyIdentityResult {
	result := typographyIdentityResult{}
	roleFamilies := make(map[string]string)
	concreteFamilies := make(map[string]bool)
	for role, font := range contract.Roles {
		normalizedRole := strings.ToLower(strings.TrimSpace(role))
		family := normalizedFontFamilyStack(font.Family)
		if family == "" {
			continue
		}
		roleFamilies[normalizedRole] = family
		if !isGenericOrBrowserFontStack(font.Family) {
			concreteFamilies[family] = true
		}
	}
	result.ConcreteFamilyCount = len(concreteFamilies)
	result.RolePairingCount = len(concreteFamilies)
	result.GenericFallbackOnly = len(roleFamilies) > 0 && result.ConcreteFamilyCount == 0
	display := roleFamilies["display"]
	body := roleFamilies["body"]
	_, hasNumber := roleFamilies["number"]
	_, hasLabel := roleFamilies["label"]
	if !hasNumber {
		_, hasNumber = roleFamilies["numeric"]
	}
	if !hasNumber {
		_, hasNumber = roleFamilies["numeric_or_label"]
	}
	result.RepeatedDefaultStack = display == "" || body == "" || (!hasNumber && !hasLabel) || result.ConcreteFamilyCount < 2 || (display != "" && display == body)
	result.ProfileMismatch = typographyProfileMismatch(contract, deckType)
	return result
}

func typographyProfileMismatch(contract typographyContractFile, deckType string) bool {
	profile := strings.ToLower(strings.Join([]string{contract.Profile, deckType}, " "))
	switch {
	case containsAny(profile, []string{"finance", "financial", "earnings", "investor", "revenue", "金融", "财报", "财务"}):
		return !hasFinancialNumericRole(contract)
	case containsAny(profile, []string{"sports", "sport", "athlete", "league", "score", "match", "体育", "运动", "赛事", "球员"}):
		return !hasSportsTypographyIdentity(contract)
	case containsAny(profile, []string{"luxury", "premium", "brand", "fashion", "高端", "奢侈", "品牌"}):
		return !hasPremiumDisplayIdentity(contract)
	default:
		return false
	}
}

func hasFinancialNumericRole(contract typographyContractFile) bool {
	for role, font := range contract.Roles {
		if !containsAny(strings.ToLower(role+" "+font.Usage), []string{"number", "numeric", "data", "table", "financial", "数字", "表格", "数据"}) {
			continue
		}
		family := strings.ToLower(font.Family)
		if containsAny(family, []string{"mono", "din", "tabular", "roboto mono", "ibm plex mono", "source code"}) {
			return true
		}
	}
	return false
}

func hasSportsTypographyIdentity(contract typographyContractFile) bool {
	for role, font := range contract.Roles {
		haystack := strings.ToLower(strings.Join([]string{role, font.Family}, " "))
		if containsAny(haystack, []string{"condensed", "jersey", "scoreboard", "varsity", "athletic", "bebas", "anton", "oswald", "teko", "din", "impact"}) {
			return true
		}
	}
	return false
}

func hasPremiumDisplayIdentity(contract typographyContractFile) bool {
	display, ok := contract.Roles["display"]
	if !ok {
		return false
	}
	family := strings.ToLower(display.Family)
	if family == "" || containsAny(family, []string{"arial", "helvetica", "aptos", "inter", "system-ui"}) {
		return false
	}
	return containsAny(family, []string{"serif", "didot", "bodoni", "garamond", "caslon", "editorial", "songti", "宋", "明朝"})
}

func normalizedFontFamilyStack(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.Trim(value, `"'`)
	value = strings.ReplaceAll(value, `"`, "")
	value = strings.ReplaceAll(value, `'`, "")
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func containsAny(value string, needles []string) bool {
	for _, needle := range needles {
		if strings.Contains(value, strings.ToLower(needle)) {
			return true
		}
	}
	return false
}
