# create-svglide boundary study

## Goal

Use `slides +create` as the design constraint sample for `slides +create-svglide`.

The central rule is:

```text
slides +create is a thin publisher for already-authored slide XML.
slides +create-svglide should be a thin publisher for already-authored SVGlide artifacts.
```

This document is evidence-first. It separates what the existing shortcut actually does from the broader generation and validation work described by the `lark-slides` skill.

## Source Surface

| Area | Files | Why it matters |
| --- | --- | --- |
| Go shortcut implementation | `shortcuts/slides/slides_create.go`, `shortcuts/slides/helpers.go`, `shortcuts/slides/slides_media_upload.go`, `shortcuts/slides/shortcuts.go` | Shows the real runtime boundary of `slides +create`. |
| Unit tests | `shortcuts/slides/slides_create_test.go` | Shows behavior that must not drift silently. |
| E2E proof | `tests/cli_e2e/slides/slides_create_workflow_test.go`, `tests/cli_e2e/slides/coverage.md` | Shows what is proven outside the shortcut body. |
| Skill and references | `skills/lark-slides/SKILL.md`, `skills/lark-slides/references/lark-slides-create.md`, `xml-schema-quick-ref.md`, `validation-checklist.md`, `troubleshooting.md` | Shows which work belongs to agent guidance or scripts instead of Go shortcut code. |

## `slides +create` Responsibility Matrix

| Responsibility | Evidence | Boundary meaning |
| --- | --- | --- |
| Register a write shortcut named `slides +create` for user and bot auth | `shortcuts/slides/slides_create.go:24-43`, `shortcuts/slides/shortcuts.go:8-17` | The command is a shortcut wrapper, not a general slide-generation subsystem. |
| Build a minimal presentation XML shell | `shortcuts/slides/slides_create.go:224-241` | The shortcut creates only the deck container: title plus 960x540 presentation metadata. |
| Create the online XML presentation | `shortcuts/slides/slides_create.go:125-148` | The first real API call is presentation creation. |
| Accept optional `--slides` as a JSON array of `<slide>` XML strings | `shortcuts/slides/slides_create.go:40-52` | Page content is supplied by the caller as final XML strings. |
| Enforce a maximum of 10 inline slide XML strings | `shortcuts/slides/slides_create.go:50-52` | Larger decks must use the lower-level page-create API after container creation. |
| Detect local image placeholders in submitted XML | `shortcuts/slides/helpers.go:113-153` | The shortcut only interprets one small XML convention: `<img src=\"@path\">`. |
| Validate placeholder files before creating the presentation | `shortcuts/slides/slides_create.go:53-67` | Avoids creating an orphan deck for missing/oversized local images. |
| Upload placeholder images and replace them with file tokens | `shortcuts/slides/slides_create.go:163-177`, `shortcuts/slides/slides_media_upload.go:119-138`, `shortcuts/slides/helpers.go:283-309` | Image upload is helper orchestration, not content generation. |
| Submit each supplied slide XML string to the page-create API | `shortcuts/slides/slides_create.go:179-200` | The shortcut forwards caller-authored XML to the backend. |
| Report partial progress when page creation fails | `shortcuts/slides/slides_create.go:194-196`, `shortcuts/slides/slides_create_test.go:354-420` | It does not roll back; it tells the caller where to resume. |
| Output machine-readable creation results | `shortcuts/slides/slides_create.go:150-219` | The output is an API orchestration receipt. |
| Optionally attempt bot-created deck permission grant | `shortcuts/slides/slides_create.go:215-217`, `shortcuts/slides/slides_create_test.go:66-198` | Bot grant is post-create convenience, not part of content semantics. |

## Behavior Locks From Tests

| Behavior | Evidence | Boundary meaning |
| --- | --- | --- |
| User-mode create returns `xml_presentation_id`, `title`, and `url`, without `permission_grant` | `shortcuts/slides/slides_create_test.go:23-63` | User-mode output is a creation receipt, not a validation report. |
| Missing `--title` becomes `Untitled` in dry-run and execution | `shortcuts/slides/slides_create_test.go:200-253` | Title normalization is a small deterministic convenience that belongs in the shortcut. |
| `--slides` creates the deck first, then adds pages, then returns `slide_ids` and `slides_added` | `shortcuts/slides/slides_create_test.go:285-352` | Page creation is orchestration after container creation. |
| `--slides []` behaves like no slides | `shortcuts/slides/slides_create_test.go:532-570` | Empty artifact lists should be explicit no-op additions, not special generators. |
| Invalid JSON and more than 10 inline slides fail validation with `Param == "--slides"` | `shortcuts/slides/slides_create_test.go:422-505` | Input-contract errors should be structured and routeable. |
| Missing `xml_presentation_id` from the backend fails | `shortcuts/slides/slides_create_test.go:255-283` | Creation success requires a usable resource id. |
| URL fallback is local and does not call Drive metas or batch query | `shortcuts/slides/slides_create_test.go:649-688` | Avoid adding extra API dependencies when a local receipt can be built. |
| Image placeholders are uploaded once per unique path and rewritten before page creation | `shortcuts/slides/slides_create_test.go:751-854` | Asset handling is publish-boundary plumbing, not design work. |
| Missing local placeholder files fail before any API call | `shortcuts/slides/slides_create_test.go:856-877` | Local artifact existence is a publish-blocking precondition. |
| Dry-run exposes the API plan shape and placeholder ids | `shortcuts/slides/slides_create_test.go:572-602`, `shortcuts/slides/slides_create_test.go:879-900` | Dry-run should describe orchestration, not execute validation-heavy side effects. |
| Readback is proven by E2E as a separate follow-up call | `tests/cli_e2e/slides/slides_create_workflow_test.go:32-85`, `tests/cli_e2e/slides/coverage.md:9-16` | Readback is evidence for tests and delivery, not default `Execute` behavior. |
| Bot permission grant is non-fatal and tri-state: granted, skipped, or failed | `shortcuts/slides/slides_create_test.go:66-198` | Convenience post-actions must not turn creation success into failure. |

## `slides +create` Does Not Do

| Non-responsibility | Evidence | Design implication for `+create-svglide` |
| --- | --- | --- |
| Does not generate slide XML from a prompt | `shortcuts/slides/slides_create.go:40-43`, `shortcuts/slides/slides_create.go:158-205` | `+create-svglide` must not become `--topic -> deck`. |
| Does not deeply validate slide XML semantics | `shortcuts/slides/slides_create.go:44-69` | Only minimal publish-blocking validation belongs in the shortcut. |
| Does not preview or repair layout | `shortcuts/slides/slides_create.go:125-221` | Preview and repair belong in skill/scripts or a runner before publish. |
| Does not run readback inside `Execute` | `shortcuts/slides/slides_create.go:125-221`, `tests/cli_e2e/slides/slides_create_workflow_test.go:68-85` | Readback is a test/proof step, not default shortcut behavior. |
| Does not guarantee atomic creation | `shortcuts/slides/slides_create.go:194-196`, `shortcuts/slides/slides_create_test.go:354-420` | New publish shortcuts should provide recovery context, not hide partial success. |
| Does not handle more than 10 inline pages | `shortcuts/slides/slides_create.go:18-21`, `shortcuts/slides/slides_create_test.go:441-465` | Bound the first version instead of building a complex batch manager. |
| Does not own visual quality | `skills/lark-slides/SKILL.md:91-127`, `skills/lark-slides/SKILL.md:153-160` | Visual quality gates belong before the shortcut consumes artifacts. |

## Counterexamples

| Tempting requirement | Why it looks tempting | What `slides +create` teaches |
| --- | --- | --- |
| Add readback by default | E2E uses readback to prove persistence. | E2E calls the get API after creation; `Execute` itself stops after outputting the create result. Keep readback optional or outside MVP. |
| Validate every page semantically before calling the backend | Better local errors sound useful. | `+create` only validates JSON shape, count, and local placeholder files; backend owns XML parsing. For SVGlide, only validate fields required to route and publish. |
| Run preview lint and auto-repair | SVGlide has preview tooling. | `+create` does not make layout judgments. Preview lint and repair must remain pre-publish tooling. |
| Accept a prompt and generate the deck | Higher-level UX is attractive. | `+create` consumes final submission artifacts. A prompt-to-deck runner would be a different command or script layer. |
| Hide partial failures by retrying/rebuilding automatically | It feels friendlier. | `+create` surfaces partial progress instead. Recovery should be explicit and resumable. |

## `slides +create-svglide` Allowed Extra Responsibilities

`+create-svglide` can be slightly heavier than `+create` only where SVGlide's input contract requires it. The extra work must still be publish-boundary work, not generation work.

| Extra responsibility | Allowed because | Limit |
| --- | --- | --- |
| Read a SVGlide manifest or run directory | Unlike `--slides`, SVGlide artifacts are file-based. | Normalize to one manifest model immediately; do not infer design intent. |
| Validate manifest schema and page order | Needed to know what to publish. | Validate shape and required fields only. |
| Validate page file existence and path safety | Equivalent to `+create` validating `@path` placeholders. | Do not inspect aesthetics or text quality. |
| Validate publish-required SVGlide fields | The target publish API or parser may require namespace, contract/version, dimensions, or roles before it can accept a page. | Check only required markers; do not rewrite ordinary SVG into protocol SVG in the shortcut. |
| Upload declared local assets | Equivalent to `+create` uploading `@path` images. | Upload and token replacement only; no asset search or generation. |
| Submit SVGlide pages to the target publish API | Equivalent to `+create` submitting each slide XML string. | Keep output and partial-progress behavior explicit; do not assume the CLI must convert to XML if the backend can consume SVGlide directly. |

## `slides +create-svglide` Must Not Own

| Responsibility | Owner |
| --- | --- |
| Research, outline, design brief, slide content planning | `skills/lark-slides` guidance and external runner/scripts |
| SVG authoring | Agent or runner before publish |
| Preview rendering, preview lint, and repair loop | Skill scripts or runner before publish |
| Visual quality scoring | Skill/scripts/quality gate, not shortcut `Execute` |
| Readback as default success criterion | E2E or optional verification flag |
| PPE/Whistle routing as core naming | Environment/profile layer only |

## MVP Scope

Recommended first implementation:

```bash
lark-cli slides +create-svglide --manifest ./svglide-run/manifest.json --as user
```

MVP behavior:

1. Parse manifest.
2. Validate required fields, page order, file existence, path safety, dimensions, and minimal SVGlide contract markers.
3. Create presentation shell.
4. Upload local assets declared in the manifest.
5. Submit pages to the backend.
6. Output `xml_presentation_id`, `url`, `page_ids` or `slide_ids`, uploaded asset count, and partial-progress context on failure.

MVP exclusions:

1. No prompt input.
2. No generation stages.
3. No preview repair.
4. No default readback.
5. No PPE-specific command name, directory name, or type name.

## Test Boundary For `+create-svglide`

The first test suite should mirror the shape of `slides +create` tests instead of proving the whole SVGlide generation pipeline.

| Test area | Required proof |
| --- | --- |
| Input contract | Invalid manifest, missing page file, unsafe path, and unsupported page count fail with structured params. |
| Dry-run | Shows create, asset upload, and page publish steps with placeholder presentation id and deterministic step labels. |
| Asset handling | Duplicate local assets upload once; page payloads reference uploaded tokens before publish. |
| Partial failure | If the deck exists and page N fails, error includes presentation id, failed page index, and successfully published page count. |
| Bot grant | Inherit user/bot output behavior from `slides +create`; grant failure is reported but not promoted to create failure. |
| E2E | Create/publish result is asserted first; optional readback is a separate proof step unless the command explicitly adds a `--readback` contract. |

## Team Finding

The effective research team for this boundary is:

| Role | Scope |
| --- | --- |
| Code Reader | Extract runtime responsibilities from Go implementation. |
| Test Reader | Extract behavior locks and prove what is outside `Execute`. |
| Skill Boundary Reader | Separate agent/script responsibilities from shortcut responsibilities. |
| Architect/Skeptic | Reject over-broad scope and map only proven `+create` patterns into `+create-svglide`. |

The team's proof standard is not "we read the files"; it is:

```text
Every proposed +create-svglide responsibility must map to either:
1. an existing +create responsibility, or
2. a minimal extra responsibility forced by SVGlide's artifact input shape.
```
