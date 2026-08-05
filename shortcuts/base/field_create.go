// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"

	"github.com/larksuite/cli/shortcuts/common"
)

var BaseFieldCreate = common.Shortcut{
	Service:     "base",
	Command:     "+field-create",
	Description: "Create one or more fields",
	Risk:        "write",
	Scopes:      []string{"base:field:create"},
	AuthTypes:   authTypes(),
	Flags: []common.Flag{
		baseTokenFlag(true),
		tableRefFlag(true),
		{Name: "json", Desc: "field property JSON object or non-empty array of field objects; supports @file", Required: true},
		{Name: "i-have-read-guide", Type: "bool", Desc: "set only after you have read the formula/lookup guide for those field types", Hidden: true},
	},
	Tips: []string{
		`Example text: lark-cli base +field-create --base-token <base_token> --table-id <table_id> --json '{"name":"Status","type":"text"}'`,
		`Example select: lark-cli base +field-create --base-token <base_token> --table-id <table_id> --json '{"name":"Status","type":"select","multiple":false,"options":[{"name":"Todo"},{"name":"Done"}]}'`,
		`+field-create defines storage schema only: choose a documented field type from the value being stored, never from the field name or business purpose, and use style only to format that type.`,
		`For explicitly requested derived, automatic, synchronized, or backfilled behavior, use documented formula, lookup, link, workflow, or automation only. If unsupported, do not probe code/web/OpenAPI, create a storage placeholder, or claim completion; report the boundary and alternatives.`,
		"Agent hint: arrays remain sequential per-field requests; use one array per table when its estimated runtime fits the caller timeout, and split only for timeout bounds, not a fixed chunk size.",
		"For generated arrays, prefer --json @file or an argv-safe subprocess call; do not double-escape JSON inside shell command substitution.",
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		return validateFieldCreate(runtime)
	},
	DryRun: dryRunFieldCreate,
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		return executeFieldCreate(runtime)
	},
}
