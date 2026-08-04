// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/shortcuts/common"
)

var fieldCreateBatchDelay = time.Second

type fieldReadbackMode uint8

const (
	fieldReadbackOptional fieldReadbackMode = iota
	fieldReadbackRequired
)

// canonicalFieldTypeCatalog is the executable source of truth for field type
// names accepted by the base/v3 field JSON contract. The value is also used by
// write-result guidance so validation and readback behavior cannot drift.
var canonicalFieldTypeCatalog = map[string]fieldReadbackMode{
	"attachment":  fieldReadbackOptional,
	"auto_number": fieldReadbackRequired,
	"checkbox":    fieldReadbackOptional,
	"created_at":  fieldReadbackRequired,
	"created_by":  fieldReadbackRequired,
	"datetime":    fieldReadbackOptional,
	"formula":     fieldReadbackRequired,
	"group_chat":  fieldReadbackOptional,
	"link":        fieldReadbackRequired,
	"location":    fieldReadbackOptional,
	"lookup":      fieldReadbackRequired,
	"number":      fieldReadbackOptional,
	"select":      fieldReadbackOptional,
	"text":        fieldReadbackOptional,
	"updated_at":  fieldReadbackRequired,
	"updated_by":  fieldReadbackRequired,
	"user":        fieldReadbackOptional,
}

func canonicalFieldTypeNames() []string {
	names := make([]string, 0, len(canonicalFieldTypeCatalog))
	for name := range canonicalFieldTypeCatalog {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func dryRunFieldList(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	offset := runtime.Int("offset")
	if offset < 0 {
		offset = 0
	}
	limit := getPaginationLimit(runtime)
	return common.NewDryRunAPI().
		GET("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields").
		Params(map[string]interface{}{"offset": offset, "limit": limit}).
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime))
}

func dryRunFieldGet(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	return common.NewDryRunAPI().
		GET("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields/:field_id").
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime)).
		Set("field_id", runtime.Str("field-id"))
}

func dryRunFieldCreate(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	pc := newParseCtx(runtime)
	bodies, err := parseFieldCreateBodies(pc, runtime.Str("json"))
	if err != nil {
		return common.NewDryRunAPI().Desc(fmt.Sprintf("dry-run validation failed: %v", err))
	}
	dr := common.NewDryRunAPI().
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime))
	for _, body := range bodies {
		dr.POST("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields").Body(body)
	}
	return dr
}

func dryRunFieldUpdate(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	pc := newParseCtx(runtime)
	body, err := parseJSONObject(pc, runtime.Str("json"), "json")
	if err != nil {
		return common.NewDryRunAPI().Desc(fmt.Sprintf("dry-run validation failed: %v", err))
	}
	return common.NewDryRunAPI().
		PUT("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields/:field_id").
		Body(body).
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime)).
		Set("field_id", runtime.Str("field-id"))
}

func dryRunFieldDelete(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	return common.NewDryRunAPI().
		DELETE("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields/:field_id").
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime)).
		Set("field_id", runtime.Str("field-id"))
}

func dryRunFieldSearchOptions(_ context.Context, runtime *common.RuntimeContext) *common.DryRunAPI {
	limit := getPaginationLimit(runtime)
	params := map[string]interface{}{
		"offset": runtime.Int("offset"),
		"limit":  limit,
	}
	if keyword := strings.TrimSpace(runtime.Str("keyword")); keyword != "" {
		params["query"] = keyword
	}
	return common.NewDryRunAPI().
		GET("/open-apis/base/v3/bases/:base_token/tables/:table_id/fields/:field_id/options").
		Params(params).
		Set("base_token", runtime.Str("base-token")).
		Set("table_id", baseTableID(runtime)).
		Set("field_id", runtime.Str("field-id"))
}

func validateFieldJSON(runtime *common.RuntimeContext) (map[string]interface{}, error) {
	pc := newParseCtx(runtime)
	return parseJSONObject(pc, runtime.Str("json"), "json")
}

func validateFormulaLookupGuideAck(runtime *common.RuntimeContext, command string, body map[string]interface{}) error {
	fieldType := strings.ToLower(strings.TrimSpace(common.GetString(body, "type")))
	if (fieldType == "formula" || fieldType == "lookup") && !runtime.Bool("i-have-read-guide") {
		guidePath := "skills/lark-base/references/formula-field-guide.md"
		if fieldType == "lookup" {
			guidePath = "skills/lark-base/references/lookup-field-guide.md"
		}
		return baseFlagErrorf("--i-have-read-guide is required for %s when --json.type is %q; read %s first, then retry with --i-have-read-guide", command, fieldType, guidePath)
	}
	return nil
}

func validateCanonicalFieldType(command, flagName string, body map[string]interface{}) error {
	raw, exists := body["type"]
	if !exists {
		return canonicalFieldTypeValidationError(flagName, "%s %s.type is required", command, flagName).
			WithHint("Use one of the documented field types: %s.", strings.Join(canonicalFieldTypeNames(), ", "))
	}

	fieldType, ok := raw.(string)
	if !ok || fieldType == "" || strings.TrimSpace(fieldType) != fieldType {
		return canonicalFieldTypeValidationError(flagName, "%s %s.type must be a canonical field type string", command, flagName).
			WithHint("Use one of the documented field types: %s.", strings.Join(canonicalFieldTypeNames(), ", "))
	}
	if _, ok := canonicalFieldTypeCatalog[fieldType]; ok {
		return nil
	}

	return canonicalFieldTypeValidationError(flagName, "%s %s.type %q is not supported", command, flagName, fieldType).
		WithHint("Allowed field types: %s. If the requested capability has no matching type, report it as unsupported; do not substitute another field type or perform a different action without explicit user approval.", strings.Join(canonicalFieldTypeNames(), ", "))
}

func canonicalFieldTypeValidationError(flagName, format string, args ...interface{}) *errs.ValidationError {
	message := fmt.Sprintf(format, args...)
	return errs.NewValidationError(errs.SubtypeInvalidArgument, "%s", message).
		WithParam(flagName).
		WithParams(errs.InvalidParam{Name: flagName, Reason: message})
}

func validateFieldDefinitions(command, flagName string, runtime *common.RuntimeContext) error {
	raw := strings.TrimSpace(runtime.Str(strings.TrimPrefix(flagName, "--")))
	if raw == "" {
		return nil
	}
	items, err := parseJSONArray(newParseCtx(runtime), raw, strings.TrimPrefix(flagName, "--"))
	if err != nil {
		return err
	}
	for index, item := range items {
		body, ok := item.(map[string]interface{})
		if !ok {
			return baseFlagErrorf("%s item %d must be an object", flagName, index+1)
		}
		if err := validateCanonicalFieldType(command, flagName, body); err != nil {
			return err
		}
	}
	return nil
}

func validateFieldCreate(runtime *common.RuntimeContext) error {
	bodies, err := parseFieldCreateBodies(newParseCtx(runtime), runtime.Str("json"))
	if err != nil {
		return err
	}
	for _, body := range bodies {
		if err := validateCanonicalFieldType("+field-create", "--json", body); err != nil {
			return err
		}
		if err := validateFormulaLookupGuideAck(runtime, "+field-create", body); err != nil {
			return err
		}
	}
	return nil
}

func validateFieldUpdate(runtime *common.RuntimeContext) error {
	body, err := validateFieldJSON(runtime)
	if err != nil {
		return err
	}
	if err := validateCanonicalFieldType("+field-update", "--json", body); err != nil {
		return err
	}
	return validateFormulaLookupGuideAck(runtime, "+field-update", body)
}

func executeFieldList(runtime *common.RuntimeContext) error {
	offset := runtime.Int("offset")
	if offset < 0 {
		offset = 0
	}
	limit := getPaginationLimit(runtime)
	fields, total, err := listAllFields(runtime, runtime.Str("base-token"), baseTableID(runtime), offset, limit)
	if err != nil {
		return err
	}
	if total == 0 {
		total = len(fields)
	}
	runtime.Out(map[string]interface{}{"fields": fields, "total": total}, nil)
	return nil
}

func executeFieldGet(runtime *common.RuntimeContext) error {
	baseToken := runtime.Str("base-token")
	tableIDValue := baseTableID(runtime)
	fieldRef := runtime.Str("field-id")
	data, err := baseV3Call(runtime, "GET", baseV3Path("bases", baseToken, "tables", tableIDValue, "fields", fieldRef), nil, nil)
	if err != nil {
		return err
	}
	runtime.Out(map[string]interface{}{"field": data}, nil)
	return nil
}

func executeFieldCreate(runtime *common.RuntimeContext) error {
	bodies, err := parseFieldCreateBodies(newParseCtx(runtime), runtime.Str("json"))
	if err != nil {
		return err
	}
	fields := make([]interface{}, 0, len(bodies))
	for idx, body := range bodies {
		if idx > 0 && fieldCreateBatchDelay > 0 {
			time.Sleep(fieldCreateBatchDelay)
		}
		data, err := baseV3Call(runtime, "POST", baseV3Path("bases", runtime.Str("base-token"), "tables", baseTableID(runtime), "fields"), nil, body)
		if err != nil {
			return err
		}
		fields = append(fields, data)
	}
	if len(fields) == 1 {
		runtime.Out(fieldCreateResult(map[string]interface{}{"field": fields[0], "created": true}, bodies[0]), nil)
		return nil
	}
	runtime.Out(fieldCreateBatchResult(map[string]interface{}{"fields": fields, "created": true, "total": len(fields)}, bodies), nil)
	return nil
}

func parseFieldCreateBodies(pc *parseCtx, raw string) ([]map[string]interface{}, error) {
	bodies, err := parseObjectList(pc, raw, "json")
	if err != nil {
		return nil, err
	}
	if len(bodies) == 0 {
		return nil, baseFlagErrorf("--json must contain at least one field JSON object")
	}
	return bodies, nil
}

func executeFieldUpdate(runtime *common.RuntimeContext) error {
	pc := newParseCtx(runtime)
	baseToken := runtime.Str("base-token")
	tableIDValue := baseTableID(runtime)
	body, err := parseJSONObject(pc, runtime.Str("json"), "json")
	if err != nil {
		return err
	}
	fieldRef := runtime.Str("field-id")
	data, err := baseV3Call(runtime, "PUT", baseV3Path("bases", baseToken, "tables", tableIDValue, "fields", fieldRef), nil, body)
	if err != nil {
		return err
	}
	runtime.Out(fieldUpdateResult(map[string]interface{}{"field": data, "updated": true}, body), nil)
	return nil
}

func fieldCreateResult(result map[string]interface{}, submitted map[string]interface{}) map[string]interface{} {
	readbackRecommended, reason := fieldWriteReadbackRecommendation(submitted, "create")
	return attachFieldReadbackRecommendation(result, readbackRecommended, reason)
}

// fieldCreateBatchResult attaches the same top-level readback contract to a
// multi-field create. It recommends +field-get when any submitted field is a
// computed/linked/generated (or unknown) type, so agents know when to verify
// server state without breaking the existing fields/total structure.
func fieldCreateBatchResult(result map[string]interface{}, submitted []map[string]interface{}) map[string]interface{} {
	recommend := false
	reason := "simple fields created successfully; use +field-get only when extra properties or explicit verification are needed"
	for _, body := range submitted {
		if rec, r := fieldWriteReadbackRecommendation(body, "create"); rec {
			recommend = true
			reason = r
			break
		}
	}
	return attachFieldReadbackRecommendation(result, recommend, reason)
}

func fieldUpdateResult(result map[string]interface{}, submitted map[string]interface{}) map[string]interface{} {
	returnedType := normalizeFieldType(fieldResultType(result["field"]))
	submittedType := normalizeFieldType(common.GetString(submitted, "type"))
	readbackRecommended, reason := fieldUpdateReadbackRecommendation(returnedType, submittedType)
	return attachFieldReadbackRecommendation(result, readbackRecommended, reason)
}

func fieldUpdateReadbackRecommendation(returnedType, submittedType string) (bool, string) {
	if returnedType != "" && submittedType != "" && returnedType != submittedType {
		return true, fmt.Sprintf("field update submitted type %q but the server returned type %q; run +field-get and verify record values before declaring completion", submittedType, returnedType)
	}

	fieldType := returnedType
	if fieldType == "" {
		fieldType = submittedType
	}
	if recommended, reason := fieldTypeReadbackRecommendation(fieldType, "update"); recommended {
		return true, reason + "; sample record values when generated, computed, or converted values are in scope"
	}
	return true, fmt.Sprintf("field update request succeeded for type %q, but +field-update cannot determine the previous type; run +field-get and sample record values if the type changed before declaring completion", fieldType)
}

func attachFieldReadbackRecommendation(result map[string]interface{}, readbackRecommended bool, reason string) map[string]interface{} {
	result["field_get_recommended"] = readbackRecommended
	result["verification_hint"] = reason
	if readbackRecommended {
		result["next_step"] = "field_get"
	} else {
		result["next_step"] = "done"
	}
	return result
}

func fieldWriteReadbackRecommendation(submitted map[string]interface{}, operation string) (bool, string) {
	fieldType := normalizeFieldType(common.GetString(submitted, "type"))
	return fieldTypeReadbackRecommendation(fieldType, operation)
}

func fieldTypeReadbackRecommendation(fieldType, operation string) (bool, string) {
	fieldType = normalizeFieldType(fieldType)
	mode, ok := canonicalFieldTypeCatalog[fieldType]
	if !ok {
		return true, "unknown or uncommon field type; run +field-get to avoid assuming the submitted JSON fully describes server state"
	}
	if mode == fieldReadbackOptional {
		return false, fmt.Sprintf("simple field %s returned successfully; use +field-get only when extra properties or explicit verification are needed", operation)
	}
	return true, fmt.Sprintf("computed, linked, generated, or system field %s should be verified with +field-get before declaring completion", operation)
}

func normalizeFieldType(fieldType string) string {
	return strings.ToLower(strings.TrimSpace(fieldType))
}

func fieldResultType(value interface{}) string {
	field, ok := value.(map[string]interface{})
	if !ok {
		return ""
	}
	if fieldType := strings.ToLower(strings.TrimSpace(common.GetString(field, "type"))); fieldType != "" {
		return fieldType
	}
	nested, ok := field["field"].(map[string]interface{})
	if !ok {
		return ""
	}
	return strings.ToLower(strings.TrimSpace(common.GetString(nested, "type")))
}

func executeFieldDelete(runtime *common.RuntimeContext) error {
	baseToken := runtime.Str("base-token")
	tableIDValue := baseTableID(runtime)
	fieldRef := runtime.Str("field-id")
	_, err := baseV3Call(runtime, "DELETE", baseV3Path("bases", baseToken, "tables", tableIDValue, "fields", fieldRef), nil, nil)
	if err != nil {
		return err
	}
	runtime.Out(map[string]interface{}{"deleted": true, "field_id": fieldRef, "field_name": fieldRef}, nil)
	return nil
}

func executeFieldSearchOptions(runtime *common.RuntimeContext) error {
	baseToken := runtime.Str("base-token")
	tableIDValue := baseTableID(runtime)
	fieldRef := runtime.Str("field-id")
	limit := getPaginationLimit(runtime)
	params := map[string]interface{}{
		"offset": runtime.Int("offset"),
		"limit":  limit,
	}
	if keyword := strings.TrimSpace(runtime.Str("keyword")); keyword != "" {
		params["query"] = keyword
	}
	data, err := baseV3Call(runtime, "GET", baseV3Path("bases", baseToken, "tables", tableIDValue, "fields", fieldRef, "options"), params, nil)
	if err != nil {
		return err
	}
	options, _ := data["options"].([]interface{})
	total := toInt(data["total"])
	if total == 0 {
		total = len(options)
	}
	runtime.Out(map[string]interface{}{
		"field_id":   fieldRef,
		"field_name": fieldRef,
		"keyword":    strings.TrimSpace(runtime.Str("keyword")),
		"options":    options,
		"total":      total,
	}, nil)
	return nil
}
