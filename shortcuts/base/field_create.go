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
		{Name: "json", Desc: "field property JSON object or non-empty array of field objects", Required: true},
		{Name: "i-have-read-guide", Type: "bool", Desc: "set only after you have read the formula/lookup guide for those field types", Hidden: true},
	},
	Tips: []string{
		`Example text: lark-cli base +field-create --base-token <base_token> --table-id <table_id> --json '{"name":"Status","type":"text"}'`,
		`Example select: lark-cli base +field-create --base-token <base_token> --table-id <table_id> --json '{"name":"Status","type":"select","multiple":false,"options":[{"name":"Todo"},{"name":"Done"}]}'`,
		`+field-create defines storage schema only: choose a documented field type from the value being stored, never from the field name or business purpose, and use style only to format that type.`,
		`Do not probe source code, web search, or raw OpenAPI for a purpose-named field type. Explore formula, lookup, link, workflow, or automation only when the user explicitly requests derived, related, automatically populated, synchronized, or backfilled values.`,
		"Agent hint: use the lark-base skill's field-create guide for usage and limits.",
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		return validateFieldCreate(runtime)
	},
	DryRun: dryRunFieldCreate,
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		return executeFieldCreate(runtime)
	},
}
