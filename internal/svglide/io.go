package svglide

import (
	"encoding/json"

	"github.com/larksuite/cli/internal/validate"
)

func writeJSON(path string, value any) error {
	raw, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	raw = append(raw, '\n')
	return validate.AtomicWrite(path, raw, 0o644)
}

func writeText(path string, content string) error {
	return validate.AtomicWrite(path, []byte(content), 0o644)
}
