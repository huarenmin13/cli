# SVG Slides Validation

## Static Protocol Validator

Run:

```bash
node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir-or-slides-dir> --json
```

The validator checks hard protocol rules:

- standalone SVG root;
- `slide:role="slide"`;
- required namespaces;
- `viewBox="0 0 960 540"`;
- background order;
- forbidden style blocks and CSS classes;
- forbidden text wrappers;
- color syntax;
- text `font-size` units;
- line role and arrow semantics;
- XML parseability.

The validator is a hard gate for publish-ready local bundles.

## Browser Text Boundary Check

Static XML cannot prove final rendered wrapping, CJK font fallback, or actual text height. Run browser text-boundary QA when Playwright is available:

```bash
node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs <deck-dir-or-slides-dir> --out /tmp/svg-slides-text-bounds.json
```

If Playwright is unavailable, the script exits 2 and explains the missing optional dependency.

## Bundle Manifest

Run:

```bash
node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title "<title>"
```

The bundle manifest records:

- protocol version;
- title;
- slide list;
- validation receipt paths;
- `publish_ready=true`;
- `published=false`.

## Receipt Requirements

A local publish-ready bundle needs:

- `manifest.json`;
- `receipts/validate_svg_deck.json`;
- optional browser text-boundary receipt when browser QA ran;
- slide files listed in deterministic order.

## What Passing Validation Does Not Prove

Passing validation does not prove visual excellence, source quality, chart truth, or backend acceptance. It proves that the generated local SVG files obey the hard protocol rules represented by the validator.

Always separate:

- protocol pass;
- browser text-boundary pass;
- visual design review;
- live publish proof.

## Local Publish-Ready Bundle

Run:

```bash
node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title "<deck title>"
```

The command writes:

- `manifest.json`
- `receipts/validate_svg_deck.json`

The manifest uses:

```json
{
  "version": "svglide.manifest.v1",
  "protocol": "svg-slides.v1",
  "size": {"width": 960, "height": 540},
  "publish_ready": true,
  "published": false
}
```

`publish_ready=true` means local static validation passed. It does not mean the deck was published to Lark Slides.

## Browser Text Boundary QA

When Playwright is available in the development environment, run:

```bash
node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs <deck-dir> --out receipts/preview_text_bounds.json
```

Exit codes:

- `0`: no text-boundary problems.
- `1`: rendered text overflow was detected.
- `2`: the script could not run, for example Playwright is unavailable.

This browser check is a generation-quality gate. It is not a publish API proof.

## Source Coverage

- Covers manifest sections: finish_slides_edit_tool
- Coverage mode: preserve finish/validation gates and explicitly separate protocol pass from visual quality pass.
