# SVGlide Node Debug Time Audit

> Purpose: maintain a local, evidence-first record for SVGlide runs where time is lost in node debugging, stale receipts, gate loops, prompts, validation false positives, or asset contracts. This document is for diagnosis and follow-up implementation. It is not a successful run receipt; the receipts under the project directory are the source of truth for pass/fail.

## Final Case

- Project: `.lark-slides/plan/australia-minerals-ppe-pure-svg`
- Topic: `澳大利亚矿产：资源版图、产业链与全球角色`
- Branch/worktree: `/Users/bytedance/bd-projects/workspaces/SVGlide/.worktrees/cli-svglide-svg-private`
- PPE lane: `ppe_pure_svg`
- Online Slides URL: `https://www.feishu.cn/slides/Gm3nsIkoJl39iOdPREzcUKVBnhf`
- XML presentation id: `Gm3nsIkoJl39iOdPREzcUKVBnhf`
- Slides added: `12`
- Local preview: `.lark-slides/plan/australia-minerals-ppe-pure-svg/05-preview/preview.html`
- Final runner stage: `snapshot_visual_fidelity`
- Final result: `live_create`, `readback`, `editability_gate`, and `snapshot_visual_fidelity` all passed.
- Template fidelity result: runner stage passed, but the receipt status is `passed_with_warnings`; this run relied on bounded current-deck warning semantics, not full template promotion fidelity.

## Evidence Files

- Runner state: `.lark-slides/plan/australia-minerals-ppe-pure-svg/01-project/state.json`
- Live create receipt: `.lark-slides/plan/australia-minerals-ppe-pure-svg/07-create/live-create.json`
- Readback check: `.lark-slides/plan/australia-minerals-ppe-pure-svg/08-readback/readback-check.json`
- Editability report: `.lark-slides/plan/australia-minerals-ppe-pure-svg/08-readback/editability-report.json`
- Quality gate: `.lark-slides/plan/australia-minerals-ppe-pure-svg/06-check/quality-gate.json`
- Template fidelity: `.lark-slides/plan/australia-minerals-ppe-pure-svg/06-check/template-fidelity.json`

## Timing Methodology

There are two different clocks:

1. Runner stage time: recorded by `timing_events` in `state.json`.
2. End-to-end wall time: inferred from gaps between runner events.

The runner stage total was about `4m58s`. The full wall-clock span from the first recorded runner event to final pass was about `4h15m53s`, from `2026-06-26T19:58:42+08:00` to `2026-06-27T00:14:35+08:00`.

The gap attribution below is approximate. It includes agent code inspection, reasoning, patching, unit tests, state cleanup, network approval wait, and idle gaps between recorded runner events. It should be used to identify where time was lost, not as precise stopwatch telemetry.

The gap table intentionally lists only material gaps above about `10s`. Smaller orchestration gaps are omitted, so the rows should not be expected to add up exactly to the full wall-clock span. Attribution is heuristic: a large gap is assigned to the surrounding failing stage, but may include idle time, context switching, approval delay, or manual investigation outside the runner.

## End-to-End Time Ranking

| Rank | Area | Estimated Time | Evidence / Interpretation |
|---:|---|---:|---|
| 1 | `template_fidelity` repair/debug gap | `3h30m04s` | Heuristic attribution. Includes the largest `3h07m31s` gap before revisiting `template_fidelity`; not pure execution time. |
| 2 | `plan_gate` / stale-loop debug gap | `29m53s` | Composite gate and hidden legacy substage freshness repeatedly forced upstream reruns. |
| 3 | Runner recorded execution total | `4m58s` | Sum of all recorded `timing_events`; includes successful and failed stage executions. |
| 4 | `preflight` / render false-positive repair gap | `4m49s` | Mainly bbox and text-backing false positive repair loops. |
| 5 | `readback` repair / online verification gap | `3m54s` | `business_claims` failed once, then was fixed and re-run. |
| 6 | Network approval / publish wait gap | `38s` | Gap from `ppe_proof` to `create_svg_capability_probe`. |
| 7 | Post-quality orchestration gap | `31s` | Short gap from `quality_gate` pass to `dry_run`; not the main text-style repair. |

The `text_decoration_policy` repair is represented in the `template_fidelity` / `quality_gate` repair path, because the actual code change happened around the failed quality gate, the `template_fidelity` rerun, and the final quality gate pass. Treating the later `31s` gap as the repair time would understate the work.

## Runner Internal Cumulative Ranking

| Rank | Stage | Total Runner Time | Count | Passed | Failed | Diagnosis |
|---:|---|---:|---:|---:|---:|---|
| 1 | `generate_svg` | `2m59s` | 9 | 9 | 0 | Repeated due to upstream invalidation; one render is not the main cost. |
| 2 | `live_create` | `25.0s` | 1 | 1 | 0 | Real online create through `ppe_pure_svg`. |
| 3 | `template_fidelity` | `12.1s` | 6 | 2 | 4 | Strict screenshot threshold and missing role/text-style evidence caused failures. |
| 4 | `plan_gate` | `12.0s` | 19 | 11 | 8 | Composite gate/stale ownership issue caused repeated retries. |
| 5 | `snapshot_visual_fidelity` | `12.0s` | 1 | 1 | 0 | Final snapshot fidelity validation. |
| 6 | `package_check` | `8.3s` | 5 | 5 | 0 | Repeated after upstream plan/gate pruning. |
| 7 | `readback` | `7.0s` | 2 | 1 | 1 | First failure was `business_claims`; second pass succeeded. |
| 8 | `dry_run` | `7.0s` | 1 | 1 | 0 | Create dry-run before live create. |
| 9 | `publish_gate` | `6.0s` | 1 | 1 | 0 | Aggregates PPE proof, create probe, pre-submit review. |
| 10 | `create_svg_capability_probe` | `5.7s` | 1 | 1 | 0 | Real route verification against PPE create-svg path. |

## Final Successful Path Ranking

| Rank | Stage | Latest Successful Time |
|---:|---|---:|
| 1 | `live_create` | `25.0s` |
| 2 | `snapshot_visual_fidelity` | `12.0s` |
| 3 | `generate_svg` | `7.0s` |
| 4 | `dry_run` | `7.0s` |
| 5 | `publish_gate` | `6.0s` |
| 6 | `create_svg_capability_probe` | `5.7s` |
| 7 | `readback` | `3.5s` |
| 8 | `template_fidelity` | `2.1s` |
| 9 | `plan_gate` | `2.0s` |
| 10 | `package_check` | `1.7s` |

## Blocker Timeline

1. `plan_gate` and stale child receipts caused repeated gate failures and downstream pruning.
2. `generate_svg` was rerun many times because upstream gates changed or were pruned.
3. `preflight` failed on SVG bbox / light text backing false positives.
4. `template_fidelity` failed because a current generated deck was held to single-page template promotion screenshot fidelity.
5. `quality_gate` failed because `role_consumption.text_style_roles.text_decoration_policy` was missing.
6. `live_create` succeeded through `ppe_pure_svg`.
7. `readback` failed because `business_claims` required a plan metadata sentence that was not submitted as visible SVG text.
8. `readback`, `editability_gate`, and `snapshot_visual_fidelity` passed after the readback policy fix.

## Fix Ledger

Status conventions:

- `Fixed in code`: a code change and at least one targeted test now cover the issue.
- `Mitigated for this run`: the final deck is unblocked, but the general mechanism still needs stronger tests or design cleanup.
- `Partially fixed`: the known failure was reduced, but adjacent false positives or uncovered cases remain.
- `Evidence passed`: the run produced evidence that the path works, but this does not mean the underlying area is optimized.
- `Open`: no durable implementation has been added yet.

| Problem | Status | Fix Applied / Required | Files / Tests |
|---|---|---|---|
| Composite `plan_gate` output path mismatch | Fixed in code; test gap | Align composite `plan_gate` output list with the real `02-plan/strategy-review.json` output instead of nonexistent `06-check/strategy-review.json`. | `svglide_project_runner.py`; needs composite output existence test. |
| Composite gate stale ownership | Fixed in code for stale child rerun; broader ownership open | Composite gates now rerun stale child substages instead of failing the parent gate. Broader long-term work remains for richer stale diagnostics and all child-output ownership edge cases. | `svglide_project_runner.py`; `svglide_project_runner_test.py` covers stale legacy child rerun. |
| `generate_svg` repeated reruns | Partially fixed in code | `generate_svg` now records the real generation input boundary in `input_hashes` and explicitly excludes downstream quality receipts. Full render-cache reuse by renderer/template source hash is still open. | `svglide_project_runner.py`; `svglide_project_runner_test.py` covers downstream quality-gate isolation and changed-plan invalidation. |
| Page-family role collapse to `content` | Mitigated for this run; generic guard open | Prefer explicit `canvas_spec.page_role` over weak top-level `page_type`. Ensure selected page-family decks preserve `page_role` / `page_variant_id`. | `svglide_project_runner.py`; current deck roles passed page-family smoke. |
| `template_fidelity` used as strict publishing blocker | Fixed in code for current-deck publish; promotion split still needs UI/docs cleanup | If page-family smoke passes and only soft screenshot issues remain above `warn_min`, mark template fidelity as `passed_with_warnings` and write separate `current-deck-visual-integrity` evidence. Quality gate now requires that current-deck evidence for warning-based publish, while template promotion still requires true fidelity pass. | `svglide_project_runner.py`, `svglide_quality_gate.py`; tests in `svglide_project_runner_test.py`, `svglide_quality_gate_test.py`. |
| `text_decoration_policy` missing in role consumption | Fixed in code | If `text_style_roles` exist but no explicit decoration policy exists, record renderer default absent policy instead of leaving receipt incomplete. | `beautiful_template_fidelity_check.py`; test in `beautiful_template_fidelity_check_test.py`. |
| `preflight` bbox / text backing false positives | Partially fixed | Bbox extraction and light-text backing checks were adjusted. Needs broader fixture coverage for path, clip, mask, and backing cases. | `svg_preflight.py`; current deck preflight passed. |
| `readback business_claims` checked unsubmitted metadata | Fixed in code | When prepared SVG exists, business claims are filtered to claims visible in submitted SVG text. `core_visible_text` remains the main visible-text guard. | `svglide_readback.py`; test in `svglide_readback_test.py`. |
| PPE route and live create | Evidence passed; optimization open | `live_create` used `--ppe-profile ppe_pure_svg` and injected proxy env. Long-term optimization: cache successful capability probe by proof and probe-file hash. | `live-create.json`, `ppe-proof.input.json`; `create_svg_capability_probe` passed. |
| Agent/debug time invisibility | Open | Add agent-side timing buckets for code inspection, patching, unit tests, state cleanup, approval wait, and rerun time. Runner timing alone underreports real time. | New instrumentation needed outside `state.json`. |

## Resolved vs Remaining

### Resolved Enough For This Run

- `quality_gate` passes with bounded `template_fidelity` warning semantics.
- `template_fidelity` is not a full promotion pass in this run; it is a `passed_with_warnings` current-deck publish pass.
- `text_decoration_policy` is present in role-consumption receipt.
- `readback` no longer fails on unsubmitted plan metadata claims.
- `live_create`, `readback`, `editability_gate`, and `snapshot_visual_fidelity` passed on the final online deck.

### Still Open For Long-Term Speed

- Composite gate child stale ownership is less risky after stale-child rerun support, but richer diagnostics and child-output ownership tests are still needed.
- `generate_svg` has a clearer input boundary now; full cache reuse and renderer/template dependency hashing remain open.
- Preflight needs a broader false-positive fixture suite.
- Agent/debug time is not directly instrumented.
- Template promotion fidelity and current deck publish fidelity now have separate receipts for the warning path; remaining work is naming/docs cleanup and any UI/report surfacing.

## Recommended TDD Follow-Up

### M1: Composite Gate Stale Ownership

Red:

- A stale `strategy_review` child receipt under a passed `plan_gate` must be rerun by `plan_gate`, not block with a hidden stale error.
- A composite gate receipt must not declare an output path that does not exist.
- A direct legacy target such as `palette_review` must still run only its child check.

Green:

- Add explicit `COMPOSITE_STAGE_OUTPUTS` and `COMPOSITE_STAGE_INPUTS`.
- Have composite gates compute child receipt hashes as owned inputs.
- Print stale owner diagnostics: stage, receipt path, key, recorded hash, current hash.
- Completed first slice: stale child substages are pruned and rerun by the composite gate instead of failing the parent gate.

Validation:

- `python3 skills/lark-slides/scripts/svglide_project_runner_test.py`

### M2: Render Cache Boundary

Red:

- Changing `06-check/quality-gate.json` alone must not invalidate `generate_svg`.
- Changing `02-plan/slide_plan.json`, asset manifest, renderer source, or selected template must invalidate `generate_svg`.

Green:

- Store generation input hash set separately from upstream gate receipts.
- Let `generate_svg` reuse existing raw/contract/prepared outputs when generation inputs are unchanged.
- Completed first slice: `generate_svg` receipt `input_hashes` now records plan, lock, source evidence, source receipt, assets, and asset manifest, while excluding downstream quality receipts.

Validation:

- Add targeted runner cache tests and run a real deck twice.

### M3: Current Deck Fidelity vs Template Promotion Fidelity

Red:

- A current deck with passed page-family smoke, editability, and visual integrity must not fail publish solely because one source screenshot score is below template promotion threshold.
- A template promotion review must still fail if screenshot fidelity is below threshold.

Green:

- Split receipts into `current_deck_visual_integrity`, `page_family_smoke`, and `template_promotion_fidelity`.
- Keep `template_fidelity` as compatibility wrapper only if needed.
- Completed first slice: `current-deck-visual-integrity.json` is written for current-deck warning passes, and quality gate requires it before accepting `template-fidelity` warnings.

Validation:

- `svglide_project_runner_test.py`
- `svglide_quality_gate_test.py`
- production-review fixture run.

### M4: Agent Debug Time Instrumentation

Red:

- A run with manual repair steps must report separate non-runner buckets instead of only runner stage time.

Green:

- Add optional debug timer events:
  - `inspect_code`
  - `patch`
  - `unit_test`
  - `state_cleanup`
  - `approval_wait`
  - `rerun_wait`
- Write them to a separate `debug-time-audit.json` so runtime receipts remain clean.

Validation:

- Generate a report that reconciles wall-clock time, runner time, and debug time.

## Current Conclusion

The run did not take more than four hours because SVG rendering itself was slow. The recorded runner execution time was about five minutes. The wall-clock loss came from validation and orchestration design:

- hidden stale child receipts under compact composite gates;
- over-pruning causing `generate_svg` to rerun;
- strict template-promotion screenshot fidelity used as a current-deck publish blocker;
- preflight/readback false positives;
- missing agent-side timing for inspection, patching, tests, and reruns.

The immediate deliverable was completed and published. The next optimization should focus on gate ownership and debug-time observability before further visual tuning.

The timing attribution in this document is intentionally approximate. M4 should be implemented before using this report as a strict performance baseline, because active agent repair time and idle/context-switch time are not yet separated.
