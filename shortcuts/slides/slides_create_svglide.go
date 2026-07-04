// Copyright (c) 2026 Lark Technologies Pte. Ltd.
// SPDX-License-Identifier: MIT

package slides

import (
	"context"
	"strings"

	"github.com/larksuite/cli/errs"
	"github.com/larksuite/cli/internal/svglide"
	"github.com/larksuite/cli/shortcuts/common"
)

// SlidesCreateSVGlide manages a local agent-neutral SVGlide SVG run directory.
var SlidesCreateSVGlide = common.Shortcut{
	Service:     "slides",
	Command:     "+create-svglide",
	Description: "Create and manage a local SVGlide SVG run directory",
	Risk:        "write",
	AuthTypes:   []string{"user", "bot"},
	Scopes:      []string{},
	LocalOnly:   true,
	Flags: []common.Flag{
		{Name: "action", Desc: "runtime action: init, status, next, complete, author, validate, preview, quality, repair", Required: true, Enum: []string{"init", "status", "next", "complete", "author", "validate", "preview", "quality", "repair"}},
		{Name: "run", Desc: "existing run directory for status/next/complete/author/validate/preview/quality/repair"},
		{Name: "title", Desc: "deck title for init"},
		{Name: "input", Desc: "local source markdown/text path for init"},
		{Name: "topic", Desc: "topic-only deck intent for init; mutually exclusive with --input"},
		{Name: "language", Desc: "deck language for topic-only or local source init"},
		{Name: "agent-runtime", Desc: "agent runtime name for init, e.g. codex, claude, cursor, fake-agent"},
		{Name: "agent-id", Desc: "stable agent/session id for init"},
		{Name: "audience", Desc: "final audience for the deck"},
		{Name: "delivery-mode", Desc: "delivery mode: presented, self_read, dual_mode", Enum: []string{"presented", "self_read", "dual_mode"}},
		{Name: "pages", Type: "int", Desc: "target page count"},
		{Name: "out", Desc: "output run directory for init"},
		{Name: "overwrite", Type: "bool", Desc: "allow init to overwrite an existing run directory"},
	},
	Validate: func(ctx context.Context, runtime *common.RuntimeContext) error {
		action := runtime.Str("action")
		if action == "init" {
			if strings.TrimSpace(runtime.Str("title")) == "" {
				return errs.NewValidationError(errs.SubtypeInvalidArgument, "--title is required for init").WithParam("--title")
			}
			hasInput := strings.TrimSpace(runtime.Str("input")) != ""
			hasTopic := strings.TrimSpace(runtime.Str("topic")) != ""
			if hasInput == hasTopic {
				return errs.NewValidationError(errs.SubtypeInvalidArgument, "exactly one of --input or --topic is required for init").WithParam("--input")
			}
			if strings.TrimSpace(runtime.Str("out")) == "" {
				return errs.NewValidationError(errs.SubtypeInvalidArgument, "--out is required for init").WithParam("--out")
			}
			if hasInput {
				if stat, err := runtime.FileIO().Stat(runtime.Str("input")); err != nil {
					return common.WrapInputStatErrorTyped(err, "cannot read --input")
				} else if !stat.Mode().IsRegular() {
					return errs.NewValidationError(errs.SubtypeInvalidArgument, "--input must be a regular file").WithParam("--input")
				}
			}
			return nil
		}
		if strings.TrimSpace(runtime.Str("run")) == "" {
			return errs.NewValidationError(errs.SubtypeInvalidArgument, "--run is required for %s", action).WithParam("--run")
		}
		return nil
	},
	Execute: func(ctx context.Context, runtime *common.RuntimeContext) error {
		action := runtime.Str("action")
		switch action {
		case "init":
			out := runtime.Str("out")
			if err := svglide.InitRun(out, svglide.InitOptions{
				Title:        runtime.Str("title"),
				Input:        runtime.Str("input"),
				Topic:        runtime.Str("topic"),
				Language:     runtime.Str("language"),
				Audience:     runtime.Str("audience"),
				DeliveryMode: runtime.Str("delivery-mode"),
				Pages:        runtime.Int("pages"),
				Overwrite:    runtime.Bool("overwrite"),
				AgentRuntime: runtime.Str("agent-runtime"),
				AgentID:      runtime.Str("agent-id"),
			}); err != nil {
				return err
			}
			status, err := svglide.InspectStatus(out)
			if err != nil {
				return err
			}
			runtime.Out(map[string]any{
				"action":        action,
				"protocol":      "anygen-svg-slides",
				"run":           out,
				"agent_runtime": runtime.Str("agent-runtime"),
				"next_command":  status.NextCommand,
				"stage_loop":    []string{"next", "write_artifacts", "complete"},
				"final_loop":    []string{"next", "repair", "complete"},
			}, nil)
			return nil
		case "status":
			report, err := svglide.InspectStatus(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "next":
			report, err := svglide.NextTask(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "complete":
			report, err := svglide.CompleteCurrentStage(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "author":
			report, err := svglide.AuthorSlides(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "validate":
			report, err := svglide.ValidateRun(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "preview":
			report, err := svglide.WritePreview(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "quality":
			report, err := svglide.CheckQuality(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		case "repair":
			report, err := svglide.RepairRun(runtime.Str("run"))
			if err != nil {
				return err
			}
			runtime.Out(report, nil)
			return nil
		default:
			return errs.NewValidationError(errs.SubtypeInvalidArgument, "unsupported --action %q", action).WithParam("--action")
		}
	},
}
