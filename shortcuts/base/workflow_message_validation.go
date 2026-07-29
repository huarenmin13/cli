// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"encoding/json"
	"strings"

	"github.com/larksuite/cli/errs"
)

type workflowOperation uint8

const (
	workflowCreateOperation workflowOperation = iota
	workflowUpdateOperation
)

var unsupportedWorkflowStepTypes = map[string]string{
	"DeleteRecordTrigger": "record deletion events are not available as Base workflow triggers",
}

type workflowStep struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

func validateWorkflowDefinition(body map[string]interface{}, operation workflowOperation) error {
	raw, err := json.Marshal(body)
	if err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}

	var definition map[string]json.RawMessage
	if err := json.Unmarshal(raw, &definition); err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}
	if field := workflowMisCasedJSONField(definition, "title", "steps"); field != "" {
		return workflowFieldError("--json.%s must use the exact JSON field name %q", field, field)
	}

	title := definition["title"]
	if operation == workflowUpdateOperation && !workflowNonBlankJSONString(title) {
		return workflowFieldError("--json.title for workflow update must be a non-empty string")
	}
	rawSteps := definition["steps"]
	if len(rawSteps) == 0 || string(rawSteps) == "null" {
		if operation == workflowUpdateOperation {
			return workflowFieldError("--json.steps for workflow update must be an array; use an empty array to clear all steps")
		}
		return nil
	}

	steps, err := workflowSteps(rawSteps)
	if err != nil {
		return err
	}

	for index, step := range steps {
		if reason, unsupported := unsupportedWorkflowStepTypes[step.Type]; unsupported {
			return workflowUnsupportedStepError(index, step.Type, reason)
		}
		if step.Type != "LarkMessageAction" {
			continue
		}

		var data map[string]json.RawMessage
		if err := json.Unmarshal(step.Data, &data); err != nil || data == nil {
			return workflowFieldError("--json.steps[%d].data for LarkMessageAction must be a JSON object", index)
		}
		if field := workflowMisCasedJSONField(data, "receiver", "content", "send_to_everyone", "btn_list"); field != "" {
			return workflowFieldError("--json.steps[%d].data.%s must use the exact JSON field name %q", index, field, field)
		}

		receiver := data["receiver"]
		if receiverLength, receiverIsArray := workflowJSONArrayLength(receiver); !receiverIsArray || receiverLength == 0 {
			return workflowFieldError("--json.steps[%d].data.receiver for LarkMessageAction must be a non-empty array", index)
		}
		content := data["content"]
		if contentLength, contentIsArray := workflowJSONArrayLength(content); !contentIsArray || contentLength == 0 {
			return workflowFieldError("--json.steps[%d].data.content for LarkMessageAction must be a non-empty array", index)
		}
		sendToEveryone := data["send_to_everyone"]
		if len(sendToEveryone) > 0 && !workflowJSONBoolean(sendToEveryone) {
			return workflowFieldError("--json.steps[%d].data.send_to_everyone for LarkMessageAction must be a boolean when provided", index)
		}
		buttonList := data["btn_list"]
		if len(buttonList) > 0 {
			if _, buttonListIsArray := workflowJSONArrayLength(buttonList); !buttonListIsArray {
				return workflowFieldError("--json.steps[%d].data.btn_list for LarkMessageAction must be an array when provided", index)
			}
		}
	}
	return nil
}

func workflowMisCasedJSONField(fields map[string]json.RawMessage, expectedFields ...string) string {
	for _, expected := range expectedFields {
		for actual := range fields {
			if actual != expected && strings.EqualFold(actual, expected) {
				return expected
			}
		}
	}
	return ""
}

func workflowSteps(raw json.RawMessage) ([]workflowStep, error) {
	var rawSteps []json.RawMessage
	if err := json.Unmarshal(raw, &rawSteps); err != nil || rawSteps == nil {
		return nil, workflowFieldError("--json.steps must be an array")
	}

	steps := make([]workflowStep, len(rawSteps))
	for index, rawStep := range rawSteps {
		var fields map[string]json.RawMessage
		if err := json.Unmarshal(rawStep, &fields); err != nil || fields == nil {
			return nil, workflowFieldError("--json.steps[%d] must be a JSON object", index)
		}
		steps[index].Data = fields["data"]
		rawType, ok := fields["type"]
		if !ok {
			return nil, workflowFieldError("--json.steps[%d].type must be a non-empty string", index)
		}
		if err := json.Unmarshal(rawType, &steps[index].Type); err != nil || strings.TrimSpace(steps[index].Type) == "" {
			return nil, workflowFieldError("--json.steps[%d].type must be a non-empty string", index)
		}
	}
	return steps, nil
}

func workflowNonBlankJSONString(raw json.RawMessage) bool {
	if len(raw) == 0 || string(raw) == "null" {
		return false
	}
	var value string
	return json.Unmarshal(raw, &value) == nil && strings.TrimSpace(value) != ""
}

func workflowJSONBoolean(raw json.RawMessage) bool {
	if len(raw) == 0 || string(raw) == "null" {
		return false
	}
	var value bool
	return json.Unmarshal(raw, &value) == nil
}

func workflowJSONArrayLength(raw json.RawMessage) (int, bool) {
	if len(raw) == 0 {
		return 0, false
	}
	var values []json.RawMessage
	if err := json.Unmarshal(raw, &values); err != nil || values == nil {
		return 0, false
	}
	return len(values), true
}

func workflowFieldError(format string, args ...any) error {
	return errs.NewValidationError(errs.SubtypeInvalidArgument, format, args...).
		WithParam("--json").
		WithHint("Fix the reported field without inferring values or rewriting unrelated workflow data.")
}

func workflowUnsupportedStepError(index int, stepType, reason string) error {
	return errs.NewValidationError(
		errs.SubtypeFailedPrecondition,
		"--json.steps[%d].type %q is not supported: %s",
		index,
		stepType,
		reason,
	).
		WithParam("--json").
		WithHint("No workflow request was sent. Keep the requested semantics unchanged; propose alternatives and write only after the user explicitly selects one.")
}
