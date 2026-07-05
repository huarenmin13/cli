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
