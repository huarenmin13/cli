// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package base

import (
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/shortcuts/common"
	"github.com/spf13/cobra"
)

type localFlagAlias struct {
	canonical string
	alias     string
}

func withLocalFlagAliases(shortcut common.Shortcut, aliases ...localFlagAlias) common.Shortcut {
	postMount := shortcut.PostMount
	shortcut.PostMount = func(cmd *cobra.Command) {
		if postMount != nil {
			postMount(cmd)
		}
		for _, alias := range aliases {
			cmd.Flags().String(alias.alias, "", "hidden alias for --"+alias.canonical)
			_ = cmd.Flags().MarkHidden(alias.alias)
		}

		preRun := cmd.PreRunE
		cmd.PreRunE = func(cmd *cobra.Command, args []string) error {
			if preRun != nil {
				if err := preRun(cmd, args); err != nil {
					return err
				}
			}
			return applyLocalFlagAliases(cmd, aliases)
		}
	}
	return shortcut
}

func applyLocalFlagAliases(cmd *cobra.Command, aliases []localFlagAlias) error {
	for _, alias := range aliases {
		canonicalFlag := cmd.Flags().Lookup(alias.canonical)
		aliasFlag := cmd.Flags().Lookup(alias.alias)
		canonicalSet := canonicalFlag != nil && canonicalFlag.Changed
		aliasSet := aliasFlag != nil && aliasFlag.Changed
		if canonicalSet && aliasSet {
			return errs.NewValidationError(
				errs.SubtypeInvalidArgument,
				"--%s and --%s are mutually exclusive; use only one",
				alias.canonical,
				alias.alias,
			).WithParam("--"+alias.canonical).WithParams(
				errs.InvalidParam{Name: "--" + alias.canonical, Reason: "mutually exclusive"},
				errs.InvalidParam{Name: "--" + alias.alias, Reason: "mutually exclusive"},
			)
		}
		if !aliasSet {
			continue
		}
		value, _ := cmd.Flags().GetString(alias.alias)
		if strings.TrimSpace(value) == "" {
			return errs.NewValidationError(
				errs.SubtypeInvalidArgument,
				"--%s cannot be empty",
				alias.alias,
			).WithParam("--" + alias.alias).WithParams(
				errs.InvalidParam{Name: "--" + alias.alias, Reason: "cannot be empty"},
			)
		}
		if canonicalFlag == nil {
			return errs.NewInternalError(errs.SubtypeUnknown, "alias --%s has no canonical --%s flag", alias.alias, alias.canonical)
		}
		if err := cmd.Flags().Set(alias.canonical, value); err != nil {
			return errs.NewInternalError(errs.SubtypeUnknown, "cannot apply --%s as --%s: %s", alias.alias, alias.canonical, err).WithCause(err)
		}
	}
	return nil
}
