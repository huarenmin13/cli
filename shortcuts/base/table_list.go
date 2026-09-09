// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"context"
	"strconv"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/output"
	"github.com/larksuite/cli/shortcuts/common"
)

var BaseTableList = common.Shortcut{
	Service:     "base",
	Command:     "+table-list",
	Description: "List tables in a base",
	Risk:        "read",
	Scopes:      []string{"base:table:read"},
	AuthTypes:   authTypes(),
	Tips: []string{
		"Returns one page. When meta.pagination.complete is false, pass meta.pagination.next_token to --offset to fetch the next page.",
	},
	Flags: []common.Flag{
		baseTokenFlag(true),
		{Name: "offset", Type: "int", Default: "0", Desc: "pagination offset"},
		{Name: "limit", Aliases: []string{"page-size"}, Type: "int", Default: "50", Desc: "pagination size, range 1-100"},
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		_, err := common.ValidatePageSizeTyped(runtime, "limit", 50, 1, 100)
		return err
	},
	DryRun: dryRunTableList,
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		return executeTableList(runtime)
	},
}

func tableListPagination(data map[string]interface{}, offset, limit, count int) (*output.PaginationMeta, error) {
	hasMore := count >= limit
	if rawTotal, exists := data["total"]; exists {
		total, valid := toIntStrict(rawTotal)
		if !valid || total < 0 {
			return nil, errs.NewInternalError(errs.SubtypeInvalidResponse, "table list total must be a non-negative integer")
		}
		// Use total only when it covers this page; otherwise keep the page-size fallback.
		if offset <= total && count <= total-offset {
			hasMore = count < total-offset
		}
	}
	if rawMore, exists := data["has_more"]; exists {
		more, valid := rawMore.(bool)
		if !valid {
			return nil, errs.NewInternalError(errs.SubtypeInvalidResponse, "table list has_more must be a boolean")
		}
		hasMore = more
	}
	meta := &output.PaginationMeta{Complete: !hasMore, Pages: 1}
	if hasMore {
		nextOffset := offset + count
		if nextOffset <= offset {
			return nil, errs.NewInternalError(errs.SubtypeInvalidResponse, "table list reports more pages but the returned page cannot advance --offset")
		}
		meta.NextToken = strconv.Itoa(nextOffset)
	}
	return meta, nil
}
