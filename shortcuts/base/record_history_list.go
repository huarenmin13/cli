// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/validate"
	"github.com/larksuite/cli/shortcuts/common"
)

var BaseRecordHistoryList = common.Shortcut{
	Service:     "base",
	Command:     "+record-history-list",
	Description: "List record change history",
	Risk:        "read",
	Scopes:      []string{"base:history:read"},
	AuthTypes:   authTypes(),
	Flags: []common.Flag{
		baseTokenFlag(true),
		tableRefFlag(true),
		recordHistoryRecordIDFlag(),
		{Name: "max-version", Type: "int", Desc: "max version for next page"},
		{Name: "page-size", Type: "int", Default: "30", Desc: "pagination size, range 1-50"},
	},
	Tips: []string{
		`Example: lark-cli base +record-history-list --base-token <base_token> --table-id <table_id> --record-id <record_id>`,
		"Provide the record ID for one user-confirmed row; this command never infers a row from list order.",
		"If the user explicitly names row N in a view, resolve it first with +record-list --view-id <view_id> --offset N-1 --limit 1, take the top-level _record_id metadata, then pass that record ID.",
		"If no row selector or explicit view position is provided, use +record-list with a minimal projection to show candidates and ask the user to confirm before retrying; never expand a single-record request into a multi-record scan.",
		"Use --format pretty for human-readable local timestamps (including the UTC offset), operators, and field changes; the default JSON output remains unchanged for machine processing.",
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		if _, err := common.ValidatePageSizeTyped(runtime, "page-size", 30, 1, 50); err != nil {
			return err
		}
		if runtime.Changed("max-version") && runtime.Int("max-version") <= 0 {
			return errs.NewValidationError(
				errs.SubtypeInvalidArgument,
				"--max-version must be greater than 0",
			).WithParam("--max-version")
		}
		return nil
	},
	DryRun: dryRunRecordHistoryList,
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		params := map[string]interface{}{
			"table_id":  baseTableID(runtime),
			"record_id": runtime.Str("record-id"),
			"page_size": runtime.Int("page-size"),
		}
		if value := runtime.Int("max-version"); value > 0 {
			params["max_version"] = value
		}
		data, err := baseV3Call(runtime, "GET", baseV3Path("bases", runtime.Str("base-token"), "record_history"), params, nil)
		if err != nil {
			return err
		}
		var pretty string
		if runtime.Format == "pretty" && runtime.JqExpr == "" {
			pretty, err = formatRecordHistoryPretty(data, time.Local)
			if err != nil {
				return err
			}
		}
		runtime.OutFormat(data, nil, func(w io.Writer) {
			_, _ = io.WriteString(w, pretty)
		})
		return nil
	},
}

func recordHistoryRecordIDFlag() common.Flag {
	return common.Flag{
		Name:     "record-id",
		Desc:     "record ID for one user-confirmed row; never infer it from list order",
		Required: true,
	}
}

type recordHistoryPrettyPage struct {
	HasMore        bool                      `json:"has_more"`
	Items          []recordHistoryPrettyItem `json:"items"`
	NextMaxVersion interface{}               `json:"next_max_version"`
}

type recordHistoryPrettyItem struct {
	ActivityType string                           `json:"activity_type"`
	CreateTime   *int64                           `json:"create_time"`
	FieldChanges []recordHistoryPrettyFieldChange `json:"field_changes"`
	Operator     string                           `json:"operator"`
}

type recordHistoryPrettyFieldChange struct {
	After     interface{} `json:"after"`
	Before    interface{} `json:"before"`
	FieldID   string      `json:"field_id"`
	FieldName string      `json:"field_name"`
}

func formatRecordHistoryPretty(data map[string]interface{}, location *time.Location) (string, error) {
	payload, err := json.Marshal(data)
	if err != nil {
		return "", errs.NewInternalError(errs.SubtypeInvalidResponse, "encode record history response: %v", err).WithCause(err)
	}
	var page recordHistoryPrettyPage
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.UseNumber()
	if err := decoder.Decode(&page); err != nil {
		return "", errs.NewInternalError(errs.SubtypeInvalidResponse, "decode record history response: %v", err).WithCause(err)
	}
	if page.Items == nil {
		return "", errs.NewInternalError(errs.SubtypeInvalidResponse, "record history response is missing items")
	}
	if len(page.Items) == 0 {
		return "No history entries found.\n", nil
	}
	if location == nil {
		location = time.Local
	}

	var output strings.Builder
	for index, item := range page.Items {
		timestamp := "-"
		if item.CreateTime != nil && *item.CreateTime < 0 {
			return "", errs.NewInternalError(errs.SubtypeInvalidResponse, "record history create_time must be non-negative")
		}
		if item.CreateTime != nil {
			timestamp = time.Unix(*item.CreateTime, 0).In(location).Format("2006-01-02 15:04:05 -07:00")
		}
		operator := sanitizeRecordHistoryPrettyText(item.Operator)
		if operator == "" {
			operator = "-"
		}
		changes := make([]string, 0, len(item.FieldChanges))
		for _, change := range item.FieldChanges {
			field := sanitizeRecordHistoryPrettyText(change.FieldName)
			if field == "" {
				field = sanitizeRecordHistoryPrettyText(change.FieldID)
			}
			if field == "" {
				field = "-"
			}
			before, err := formatRecordHistoryPrettyValue(change.Before)
			if err != nil {
				return "", err
			}
			after, err := formatRecordHistoryPrettyValue(change.After)
			if err != nil {
				return "", err
			}
			changes = append(changes, fmt.Sprintf("%s: %s -> %s", field, before, after))
		}
		if len(changes) == 0 {
			activity := sanitizeRecordHistoryPrettyText(item.ActivityType)
			if activity == "" {
				activity = "-"
			}
			changes = append(changes, activity)
		}
		fmt.Fprintf(&output, "%d. %s — %s — %s\n", index+1, timestamp, operator, strings.Join(changes, "; "))
	}
	if page.HasMore {
		cursor, err := formatRecordHistoryPrettyValue(page.NextMaxVersion)
		if err != nil {
			return "", err
		}
		if cursor == "-" {
			output.WriteString("More history is available; continue with the returned next_max_version.\n")
		} else {
			fmt.Fprintf(&output, "More history is available; continue with --max-version %s.\n", cursor)
		}
	}
	return output.String(), nil
}

func formatRecordHistoryPrettyValue(value interface{}) (string, error) {
	if value == nil {
		return "-", nil
	}
	if text, ok := value.(string); ok {
		text = sanitizeRecordHistoryPrettyText(text)
		if text == "" {
			return "-", nil
		}
		return text, nil
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return "", errs.NewInternalError(errs.SubtypeInvalidResponse, "encode record history field value: %v", err).WithCause(err)
	}
	text := sanitizeRecordHistoryPrettyText(string(encoded))
	if text == "" || text == "null" {
		return "-", nil
	}
	return text, nil
}

func sanitizeRecordHistoryPrettyText(value string) string {
	value = validate.SanitizeForTerminal(value)
	return strings.TrimSpace(strings.NewReplacer("\n", " ", "\r", " ", "\t", " ").Replace(value))
}
