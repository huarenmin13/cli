// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/httpmock"
	"github.com/larksuite/cli/shortcuts/common"
)

func TestBaseWorkflowExecuteGet(t *testing.T) {
	factory, stdout, reg := newExecuteFactory(t)
	reg.Register(&httpmock.Stub{
		Method: "GET",
		URL:    "/open-apis/base/v3/bases/app_x/workflows/wkf_1",
		Body: map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{"workflow_id": "wkf_1", "title": "My Workflow"},
		},
	})
	if err := runShortcut(t, BaseWorkflowGet, []string{"+workflow-get", "--base-token", "app_x", "--workflow-id", "wkf_1"}, factory, stdout); err != nil {
		t.Fatalf("err=%v", err)
	}
	if got := stdout.String(); !strings.Contains(got, `"wkf_1"`) || !strings.Contains(got, `"My Workflow"`) {
		t.Fatalf("stdout=%s", got)
	}
}

func TestBaseWorkflowExecuteGetWithUserIDType(t *testing.T) {
	factory, stdout, reg := newExecuteFactory(t)
	reg.Register(&httpmock.Stub{
		Method: "GET",
		URL:    "user_id_type=open_id",
		Body: map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{"workflow_id": "wkf_1", "creator": map[string]interface{}{"open_id": "ou_abc"}},
		},
	})
	if err := runShortcut(t, BaseWorkflowGet, []string{"+workflow-get", "--base-token", "app_x", "--workflow-id", "wkf_1", "--user-id-type", "open_id"}, factory, stdout); err != nil {
		t.Fatalf("err=%v", err)
	}
	if got := stdout.String(); !strings.Contains(got, `"ou_abc"`) {
		t.Fatalf("stdout=%s", got)
	}
}

func TestBaseWorkflowExecuteGetValidate(t *testing.T) {
	t.Run("missing base-token", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowGet, []string{"+workflow-get", "--workflow-id", "wkf_1"}, factory, stdout)
		if err == nil || !strings.Contains(err.Error(), "base-token") {
			t.Fatalf("err=%v", err)
		}
	})
	t.Run("missing workflow-id", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowGet, []string{"+workflow-get", "--base-token", "app_x"}, factory, stdout)
		if err == nil || !strings.Contains(err.Error(), "workflow-id") {
			t.Fatalf("err=%v", err)
		}
	})
}

func TestBaseWorkflowExecuteCreate(t *testing.T) {
	factory, stdout, reg := newExecuteFactory(t)
	createStub := &httpmock.Stub{
		Method: "POST",
		URL:    "/open-apis/base/v3/bases/app_x/workflows",
		Body: map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{"workflow_id": "wkf_new", "title": "My Workflow"},
		},
	}
	reg.Register(createStub)

	body := `{"title":"My Workflow","client_token":"create_1","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Reminder"}]}}]}`
	if err := runShortcut(t, BaseWorkflowCreate, []string{
		"+workflow-create", "--base-token", "app_x", "--json", body,
	}, factory, stdout); err != nil {
		t.Fatalf("err=%v", err)
	}
	reg.Verify(t)
	assertCapturedJSONBody(t, createStub, body)
	if got := stdout.String(); !strings.Contains(got, `"wkf_new"`) {
		t.Fatalf("stdout=%s", got)
	}
}

func TestBaseWorkflowExecuteCreateValidate(t *testing.T) {
	t.Run("missing base-token", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowCreate, []string{"+workflow-create", "--json", `{"title":"x"}`}, factory, stdout)
		if err == nil || !strings.Contains(err.Error(), "base-token") {
			t.Fatalf("err=%v", err)
		}
	})
	t.Run("invalid json", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowCreate, []string{"+workflow-create", "--base-token", "app_x", "--json", `not-json`}, factory, stdout)
		if err == nil {
			t.Fatalf("expected error for invalid json")
		}
	})
}

func TestBaseWorkflowExecuteMessageActionValidation(t *testing.T) {
	for _, tt := range []struct {
		name    string
		body    string
		message string
	}{
		{
			name:    "missing receiver",
			body:    `{"steps":[{"type":"LarkMessageAction","data":{"content":[{"value_type":"text","value":"Reminder"}]}}]}`,
			message: "receiver",
		},
		{
			name:    "empty receiver",
			body:    `{"steps":[{"type":"LarkMessageAction","data":{"receiver":[],"content":[{"value_type":"text","value":"Reminder"}]}}]}`,
			message: "receiver",
		},
		{
			name:    "missing content",
			body:    `{"steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}]}}]}`,
			message: "content",
		},
		{
			name:    "empty content",
			body:    `{"steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[]}}]}`,
			message: "content",
		},
	} {
		for _, command := range []struct {
			name     string
			shortcut common.Shortcut
			args     []string
		}{
			{
				name:     "create",
				shortcut: BaseWorkflowCreate,
				args:     []string{"+workflow-create", "--base-token", "app_x", "--json", tt.body},
			},
			{
				name:     "update",
				shortcut: BaseWorkflowUpdate,
				args:     []string{"+workflow-update", "--base-token", "app_x", "--workflow-id", "wkf_1", "--json", tt.body},
			},
		} {
			t.Run(tt.name+"/"+command.name, func(t *testing.T) {
				factory, stdout, _ := newExecuteFactory(t)
				err := runShortcut(t, command.shortcut, command.args, factory, stdout)
				p, ok := errs.ProblemOf(err)
				if !ok || p.Category != errs.CategoryValidation || p.Subtype != errs.SubtypeInvalidArgument {
					t.Fatalf("expected validation/invalid_argument problem, got %T %v", err, err)
				}
				var validationErr *errs.ValidationError
				if !errors.As(err, &validationErr) || validationErr.Param != "--json" {
					t.Fatalf("expected validation error for --json, got %T %v", err, err)
				}
				if !strings.Contains(validationErr.Message, tt.message) {
					t.Fatalf("message=%q, want %q", validationErr.Message, tt.message)
				}
				if !strings.Contains(validationErr.Hint, "send_to_everyone") || !strings.Contains(validationErr.Hint, "btn_list") {
					t.Fatalf("hint=%q, want optional field guidance", validationErr.Hint)
				}
			})
		}
	}
}

func assertCapturedJSONBody(t *testing.T, stub *httpmock.Stub, wantJSON string) {
	t.Helper()

	var want map[string]interface{}
	if err := json.Unmarshal([]byte(wantJSON), &want); err != nil {
		t.Fatalf("failed to decode expected request body: %v\nraw=%s", err, wantJSON)
	}
	if got := decodeCapturedJSONBody(t, stub); !reflect.DeepEqual(got, want) {
		t.Fatalf("request body=%#v, want %#v", got, want)
	}
}

func TestBaseWorkflowExecuteUpdatePreservesValidRequests(t *testing.T) {
	t.Run("valid message action", func(t *testing.T) {
		factory, stdout, reg := newExecuteFactory(t)
		updateStub := &httpmock.Stub{
			Method: "PUT",
			URL:    "/open-apis/base/v3/bases/app_x/workflows/wkf_1",
			Body: map[string]interface{}{
				"code": 0,
				"data": map[string]interface{}{"workflow_id": "wkf_1"},
			},
		}
		reg.Register(updateStub)

		body := `{"title":"My Workflow","steps":[{"type":"LarkMessageAction","data":{"receiver":[{"value_type":"user","value":{"id":"ou_x"}}],"content":[{"value_type":"text","value":"Reminder"}]}}]}`
		if err := runShortcut(t, BaseWorkflowUpdate, []string{
			"+workflow-update", "--base-token", "app_x", "--workflow-id", "wkf_1", "--json", body,
		}, factory, stdout); err != nil {
			t.Fatalf("err=%v", err)
		}
		reg.Verify(t)
		assertCapturedJSONBody(t, updateStub, body)
	})

	t.Run("empty steps", func(t *testing.T) {
		factory, stdout, reg := newExecuteFactory(t)
		updateStub := &httpmock.Stub{
			Method: "PUT",
			URL:    "/open-apis/base/v3/bases/app_x/workflows/wkf_1",
			Body: map[string]interface{}{
				"code": 0,
				"data": map[string]interface{}{"workflow_id": "wkf_1"},
			},
		}
		reg.Register(updateStub)

		body := `{"title":"My Workflow","steps":[]}`
		if err := runShortcut(t, BaseWorkflowUpdate, []string{
			"+workflow-update", "--base-token", "app_x", "--workflow-id", "wkf_1", "--json", body,
		}, factory, stdout); err != nil {
			t.Fatalf("err=%v", err)
		}
		reg.Verify(t)
		assertCapturedJSONBody(t, updateStub, body)
	})
}

func TestBaseWorkflowExecuteDisable(t *testing.T) {
	factory, stdout, reg := newExecuteFactory(t)
	reg.Register(&httpmock.Stub{
		Method: "PATCH",
		URL:    "/open-apis/base/v3/bases/app_x/workflows/wkf_1/disable",
		Body: map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{"workflow_id": "wkf_1", "status": "disabled"},
		},
	})
	if err := runShortcut(t, BaseWorkflowDisable, []string{"+workflow-disable", "--base-token", "app_x", "--workflow-id", "wkf_1"}, factory, stdout); err != nil {
		t.Fatalf("err=%v", err)
	}
	if got := stdout.String(); !strings.Contains(got, `"disabled"`) {
		t.Fatalf("stdout=%s", got)
	}
}

func TestBaseWorkflowExecuteDisableValidate(t *testing.T) {
	t.Run("missing base-token", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowDisable, []string{"+workflow-disable", "--workflow-id", "wkf_1"}, factory, stdout)
		if err == nil || !strings.Contains(err.Error(), "base-token") {
			t.Fatalf("err=%v", err)
		}
	})
	t.Run("missing workflow-id", func(t *testing.T) {
		factory, stdout, _ := newExecuteFactory(t)
		err := runShortcut(t, BaseWorkflowDisable, []string{"+workflow-disable", "--base-token", "app_x"}, factory, stdout)
		if err == nil || !strings.Contains(err.Error(), "workflow-id") {
			t.Fatalf("err=%v", err)
		}
	})
}
