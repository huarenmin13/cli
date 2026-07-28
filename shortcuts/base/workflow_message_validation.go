// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"encoding/json"

	"github.com/larksuite/cli/errs"
)

type workflowDefinition struct {
	Steps json.RawMessage `json:"steps"`
}

type workflowStep struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type workflowMessageActionData struct {
	Receiver json.RawMessage `json:"receiver"`
	Content  json.RawMessage `json:"content"`
}

func validateWorkflowMessageActions(body map[string]interface{}) error {
	raw, err := json.Marshal(body)
	if err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}

	var definition workflowDefinition
	if err := json.Unmarshal(raw, &definition); err != nil {
		return errs.NewInternalError(errs.SubtypeUnknown, "failed to inspect --json workflow body").WithCause(err)
	}
	if len(definition.Steps) == 0 || string(definition.Steps) == "null" {
		return nil
	}

	steps, stepsAreArray := workflowSteps(definition.Steps)
	if !stepsAreArray {
		// The API retains responsibility for all non-array and non-step shapes.
		// This preflight only recognizes an otherwise valid message action.
		return nil
	}

	for index, step := range steps {
		if step.Type != "LarkMessageAction" {
			continue
		}
		if !isWorkflowJSONObject(step.Data) {
			return workflowMessageActionError("--json.steps[%d].data for LarkMessageAction must be a JSON object", index)
		}

		var data workflowMessageActionData
		if err := json.Unmarshal(step.Data, &data); err != nil {
			return workflowMessageActionError("--json.steps[%d].data for LarkMessageAction must be a JSON object", index)
		}
		if receiverLength, receiverIsArray := workflowJSONArrayLength(data.Receiver); !receiverIsArray || receiverLength == 0 {
			return workflowMessageActionError("--json.steps[%d].data.receiver for LarkMessageAction must be a non-empty array", index)
		}
		if contentLength, contentIsArray := workflowJSONArrayLength(data.Content); !contentIsArray || contentLength == 0 {
			return workflowMessageActionError("--json.steps[%d].data.content for LarkMessageAction must be a non-empty array", index)
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
	var steps []workflowStep
	if err := json.Unmarshal(raw, &steps); err != nil || steps == nil {
		return nil, false
	}
	return steps, true
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

func workflowMessageActionError(format string, args ...any) error {
	return errs.NewValidationError(errs.SubtypeInvalidArgument, format, args...).
		WithParam("--json").
		WithHint("LarkMessageAction requires non-empty data.receiver and data.content arrays; data.send_to_everyone and data.btn_list may be omitted when unused.")
}
