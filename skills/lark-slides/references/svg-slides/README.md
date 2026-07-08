# SVG Slides Local Generation

This reference family is for local SVG Slides generation and validation.

It is not the Lark Slides XML/SXSD workflow and it is not the publish shortcut. Use it to produce a local publish-ready bundle that a future `slides +create-svglide` publisher can consume.

## Read Routes

| Task | Read first | Then read |
|---|---|---|
| Generate a new SVG deck | `workflow.md` | `design-brief.md`, `protocol.md`, `authoring-rules.md`, `visual-design.md`, `validation.md` |
| Repair protocol failures | `validation.md` | `protocol.md`, `authoring-rules.md` |
| Improve visual quality | `visual-design.md` | `design-brief.md`, `workflow.md` |
| Use charts | `chart-workflow.md` | `protocol.md`, `validation.md` |
| Continue an existing deck | `editing-existing-decks.md` | `workflow.md`, `protocol.md` |
| Audit provenance | `source/split-manifest.json` | `source/full.debranded.md` |

## Boundary

Generation and validation produce a local publish-ready bundle.

A future SVG Slides publisher consumes this bundle. That publishing path is intentionally outside this reference family.

A local bundle may set `publish_ready=true`; it must not claim it is published.

## Canvas Decision

This CLI adaptation uses a 960x540 SVG canvas: `viewBox="0 0 960 540"`.

The source snapshot is preserved for provenance and coverage audit. Where the source describes a different default canvas, the CLI adaptation layer intentionally normalizes generated SVG Slides to 960x540.

## Required Local Gates

1. `node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir> --json`
2. `node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title "<title>"`
3. Browser text-boundary check when Playwright is available.

## Source Coverage

- Covers manifest sections: title
- Coverage mode: routing entry; source text is preserved in `source/full.debranded.md`, while this file points workers to the coverage-preserving split docs.
