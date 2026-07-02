package svglide

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"path/filepath"
	"regexp"
	"strings"
)

type liteJSONSchema struct {
	Type                 string                    `json:"type"`
	Required             []string                  `json:"required"`
	AdditionalProperties *bool                     `json:"additionalProperties"`
	Properties           map[string]liteJSONSchema `json:"properties"`
	Items                *liteJSONSchema           `json:"items"`
	MinItems             *int                      `json:"minItems"`
	Enum                 []string                  `json:"enum"`
	Pattern              string                    `json:"pattern"`
}

var stageOutputSchemaPaths = map[string]string{
	"request/request.json":         "schemas/request.schema.json",
	"request/source_manifest.json": "schemas/source_manifest.schema.json",
	"research/sources.json":        "schemas/sources.schema.json",
	"brief/design_brief.json":      "schemas/design_brief.schema.json",
	"brief/visual_system.json":     "schemas/visual_system.schema.json",
	"outline/deck.json":            "schemas/deck.schema.json",
	"content/slide_content.json":   "schemas/slide_content.schema.json",
	"assets/assets_plan.json":      "schemas/assets_plan.schema.json",
	"receipts/lint.json":           "schemas/lint.schema.json",
	"receipts/preview.json":        "schemas/preview.schema.json",
}

func ValidateStageOutputs(root string) error {
	safeRoot, run, err := readRun(root)
	if err != nil {
		return err
	}
	stage, err := currentStage(run)
	if err != nil {
		return err
	}
	for _, output := range stage.Outputs {
		if hasGlobMeta(output) || strings.ToLower(filepath.Ext(output)) != ".json" {
			continue
		}
		schemaPath, ok := stageOutputSchemaPaths[output]
		if !ok {
			continue
		}
		if err := validateStageOutputSchema(safeRoot, output, schemaPath); err != nil {
			return err
		}
		if output == "outline/deck.json" {
			if err := validateDeckSlideOutputPaths(safeRoot, output); err != nil {
				return err
			}
		}
	}
	return nil
}

func validateDeckSlideOutputPaths(safeRoot string, artifactPath string) error {
	raw, err := readRunRegularArtifact(safeRoot, artifactPath)
	if err != nil {
		return fmt.Errorf("%s: read artifact: %w", artifactPath, err)
	}
	var deck struct {
		Slides []struct {
			Path string `json:"path"`
		} `json:"slides"`
	}
	if err := json.Unmarshal(raw, &deck); err != nil {
		return fmt.Errorf("%s: invalid JSON: %w", artifactPath, err)
	}
	for i, slide := range deck.Slides {
		if _, err := previewSlideObjectPath(slide.Path); err != nil {
			return fmt.Errorf("%s: field slides[%d].path: %w", artifactPath, i, err)
		}
	}
	return nil
}

func validateStageOutputSchema(safeRoot, artifactPath, schemaPath string) error {
	artifactRaw, err := readRunRegularArtifact(safeRoot, artifactPath)
	if err != nil {
		return fmt.Errorf("%s: read artifact: %w", artifactPath, err)
	}
	schemaRaw, err := readRunRegularArtifact(safeRoot, schemaPath)
	if err != nil {
		return fmt.Errorf("%s: read schema %s: %w", artifactPath, schemaPath, err)
	}
	schema, err := decodeLiteJSONSchema(schemaRaw)
	if err != nil {
		return fmt.Errorf("%s: schema %s: %w", artifactPath, schemaPath, err)
	}
	value, err := decodeJSONValue(artifactRaw)
	if err != nil {
		return fmt.Errorf("%s: invalid JSON: %w", artifactPath, err)
	}
	if err := validateJSONValue(schema, value, ""); err != nil {
		return fmt.Errorf("%s: %w", artifactPath, err)
	}
	return nil
}

func decodeLiteJSONSchema(raw []byte) (liteJSONSchema, error) {
	var schema liteJSONSchema
	decoder := json.NewDecoder(bytes.NewReader(raw))
	if err := decoder.Decode(&schema); err != nil {
		return liteJSONSchema{}, fmt.Errorf("invalid JSON: %w", err)
	}
	if err := rejectTrailingJSON(decoder); err != nil {
		return liteJSONSchema{}, err
	}
	return schema, nil
}

func decodeJSONValue(raw []byte) (any, error) {
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}
	if err := rejectTrailingJSON(decoder); err != nil {
		return nil, err
	}
	return value, nil
}

func rejectTrailingJSON(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return fmt.Errorf("contains trailing JSON value")
		}
		return err
	}
	return nil
}

func validateJSONValue(schema liteJSONSchema, value any, fieldPath string) error {
	switch schema.Type {
	case "":
		return nil
	case "object":
		return validateJSONObject(schema, value, fieldPath)
	case "array":
		return validateJSONArray(schema, value, fieldPath)
	case "string":
		return validateJSONString(schema, value, fieldPath)
	case "integer":
		if !isJSONInteger(value) {
			return fmt.Errorf("field %s expected integer, got %s", displayFieldPath(fieldPath), jsonValueType(value))
		}
		return nil
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("field %s expected boolean, got %s", displayFieldPath(fieldPath), jsonValueType(value))
		}
		return nil
	default:
		return fmt.Errorf("field %s uses unsupported schema type %q", displayFieldPath(fieldPath), schema.Type)
	}
}

func validateJSONObject(schema liteJSONSchema, value any, fieldPath string) error {
	object, ok := value.(map[string]any)
	if !ok {
		return fmt.Errorf("field %s expected object, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	for _, required := range schema.Required {
		if _, ok := object[required]; !ok {
			return fmt.Errorf("field %s is required", joinFieldPath(fieldPath, required))
		}
	}
	if schema.AdditionalProperties != nil && !*schema.AdditionalProperties {
		for name := range object {
			if _, ok := schema.Properties[name]; !ok {
				return fmt.Errorf("field %s is not allowed by additionalProperties:false", joinFieldPath(fieldPath, name))
			}
		}
	}
	for name, propertySchema := range schema.Properties {
		child, ok := object[name]
		if !ok {
			continue
		}
		if err := validateJSONValue(propertySchema, child, joinFieldPath(fieldPath, name)); err != nil {
			return err
		}
	}
	return nil
}

func validateJSONArray(schema liteJSONSchema, value any, fieldPath string) error {
	array, ok := value.([]any)
	if !ok {
		return fmt.Errorf("field %s expected array, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	if schema.MinItems != nil && len(array) < *schema.MinItems {
		return fmt.Errorf("field %s has %d items, want minItems %d", displayFieldPath(fieldPath), len(array), *schema.MinItems)
	}
	if schema.Items == nil {
		return nil
	}
	for i, item := range array {
		if err := validateJSONValue(*schema.Items, item, joinArrayFieldPath(fieldPath, i)); err != nil {
			return err
		}
	}
	return nil
}

func validateJSONString(schema liteJSONSchema, value any, fieldPath string) error {
	text, ok := value.(string)
	if !ok {
		return fmt.Errorf("field %s expected string, got %s", displayFieldPath(fieldPath), jsonValueType(value))
	}
	if len(schema.Enum) > 0 {
		for _, allowed := range schema.Enum {
			if text == allowed {
				return nil
			}
		}
		return fmt.Errorf("field %s value %q is not in enum %v", displayFieldPath(fieldPath), text, schema.Enum)
	}
	if schema.Pattern != "" {
		matched, err := regexp.MatchString(schema.Pattern, text)
		if err != nil {
			return fmt.Errorf("field %s has invalid pattern %q: %w", displayFieldPath(fieldPath), schema.Pattern, err)
		}
		if !matched {
			return fmt.Errorf("field %s value %q does not match pattern %q", displayFieldPath(fieldPath), text, schema.Pattern)
		}
	}
	return nil
}

func isJSONInteger(value any) bool {
	switch typed := value.(type) {
	case json.Number:
		return isCanonicalJSONInteger(typed.String())
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return true
	default:
		return false
	}
}

func isCanonicalJSONInteger(value string) bool {
	if value == "" || strings.ContainsAny(value, ".eE") {
		return false
	}
	var parsed big.Int
	_, ok := parsed.SetString(value, 10)
	return ok
}

func jsonValueType(value any) string {
	switch value.(type) {
	case nil:
		return "null"
	case map[string]any:
		return "object"
	case []any:
		return "array"
	case string:
		return "string"
	case json.Number, float64:
		return "number"
	case bool:
		return "boolean"
	default:
		return fmt.Sprintf("%T", value)
	}
}

func joinFieldPath(parent, name string) string {
	if parent == "" {
		return name
	}
	return parent + "." + name
}

func joinArrayFieldPath(parent string, index int) string {
	if parent == "" {
		return fmt.Sprintf("[%d]", index)
	}
	return fmt.Sprintf("%s[%d]", parent, index)
}

func displayFieldPath(path string) string {
	if path == "" {
		return "$"
	}
	return path
}
