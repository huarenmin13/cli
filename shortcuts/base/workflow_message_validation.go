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

type workflowDefinition struct {
	Title json.RawMessage `json:"title"`
	Steps json.RawMessage `json:"steps"`
}

type workflowStep struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type workflowMessageActionData struct {
	Receiver       json.RawMessage `json:"receiver"`
	Content        json.RawMessage `json:"content"`
	SendToEveryone json.RawMessage `json:"send_to_everyone"`
	ButtonList     json.RawMessage `json:"btn_list"`
}

func validateWorkflowDefinition(body map[string]interface{}, operation workflowOperation) error {
	raw, err := json.Marshal(body)
	if err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}

	var definition workflowDefinition
	if err := json.Unmarshal(raw, &definition); err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}

	if operation == workflowUpdateOperation && !workflowNonBlankJSONString(definition.Title) {
		return workflowFieldError("--json.title for workflow update must be a non-empty string")
	}
	if len(definition.Steps) == 0 || string(definition.Steps) == "null" {
		if operation == workflowUpdateOperation {
			return workflowFieldError("--json.steps for workflow update must be an array; use an empty array to clear all steps")
		}
		return nil
	}

	steps, stepsAreArray := workflowSteps(definition.Steps)
	if !stepsAreArray {
		return workflowFieldError("--json.steps must be an array")
	}

	for index, step := range steps {
		if reason, unsupported := unsupportedWorkflowStepTypes[step.Type]; unsupported {
			return workflowUnsupportedStepError(index, step.Type, reason)
		}
		if step.Type != "LarkMessageAction" {
			continue
		}
		if !isWorkflowJSONObject(step.Data) {
			return workflowFieldError("--json.steps[%d].data for LarkMessageAction must be a JSON object", index)
		}

		var data workflowMessageActionData
		if err := json.Unmarshal(step.Data, &data); err != nil {
			return workflowFieldError("--json.steps[%d].data for LarkMessageAction must be a JSON object", index)
		}
		if receiverLength, receiverIsArray := workflowJSONArrayLength(data.Receiver); !receiverIsArray || receiverLength == 0 {
			return workflowFieldError("--json.steps[%d].data.receiver for LarkMessageAction must be a non-empty array", index)
		}
		if contentLength, contentIsArray := workflowJSONArrayLength(data.Content); !contentIsArray || contentLength == 0 {
			return workflowFieldError("--json.steps[%d].data.content for LarkMessageAction must be a non-empty array", index)
		}
		if len(data.SendToEveryone) > 0 && !workflowJSONBoolean(data.SendToEveryone) {
			return workflowFieldError("--json.steps[%d].data.send_to_everyone for LarkMessageAction must be a boolean when provided", index)
		}
		if len(data.ButtonList) > 0 {
			if _, buttonListIsArray := workflowJSONArrayLength(data.ButtonList); !buttonListIsArray {
				return workflowFieldError("--json.steps[%d].data.btn_list for LarkMessageAction must be an array when provided", index)
			}
		}
	}
	return nil
}

func isWorkflowJSONObject(raw json.RawMessage) bool {
	if len(raw) == 0 {
		return false
	}
	var object map[string]json.RawMessage
	return json.Unmarshal(raw, &object) == nil && object != nil
}

func workflowSteps(raw json.RawMessage) ([]workflowStep, bool) {
	var rawSteps []json.RawMessage
	if err := json.Unmarshal(raw, &rawSteps); err != nil || rawSteps == nil {
		return nil, false
	}

	steps := make([]workflowStep, len(rawSteps))
	for index, rawStep := range rawSteps {
		if !isWorkflowJSONObject(rawStep) {
			continue
		}
		if err := json.Unmarshal(rawStep, &steps[index]); err != nil {
			steps[index] = workflowStep{}
		}
	}
	return steps, true
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
