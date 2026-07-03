package svglide

import (
	"fmt"
	"strings"
)

func validatePreparedImageAssetPath(raw string) (string, error) {
	path := strings.TrimSpace(raw)
	if path == "" {
		return "", fmt.Errorf("image asset path must not be empty")
	}
	if strings.Contains(path, `\`) {
		return "", fmt.Errorf("image asset path %q must use forward slashes", raw)
	}
	if strings.Contains(path, "%") {
		return "", fmt.Errorf("image asset path %q must not contain percent encoding", raw)
	}
	if strings.Contains(path, ":") || strings.Contains(path, "//") || isAbsoluteRunPath(path) {
		return "", fmt.Errorf("image asset path %q must be a local assets/images/<file> path", raw)
	}
	parts := strings.Split(path, "/")
	if len(parts) != 3 || parts[0] != "assets" || parts[1] != "images" {
		return "", fmt.Errorf("image asset path %q must match assets/images/<file>", raw)
	}
	fileName := parts[2]
	if fileName == "" || fileName == "." || fileName == ".." {
		return "", fmt.Errorf("image asset path %q must include a file name", raw)
	}
	if strings.HasPrefix(fileName, ".") || strings.Contains(fileName, "..") {
		return "", fmt.Errorf("image asset file name %q must not contain dot segments", fileName)
	}
	return path, nil
}
