# SVG Slides Editing Existing Decks

## Continue Existing Deck

When the user asks to continue, edit, extend, or repair an existing uploaded deck, operate on the existing converted project instead of recreating from scratch.

Preserve every existing page unless the user asks to change it. A page with minimal content should remain minimal if that is what the source deck contained.

## Preserve Existing Pages

For text or layout changes, edit only the target slide files. Preserve styling by default. Restyle only when the user explicitly asks.

Preserve media, chart, video, and audio blocks verbatim when the request does not touch them.

## Add Or Delete Pages

Add pages through the organize workflow, then author the new standalone SVG pages.

Delete only pages the user asked to remove. Do not rerun the new-deck outline workflow over an existing deck; it can overwrite existing slide files and lose original pages.

## Template Reference Boundary

An uploaded reference can mean two different things:

- Continue or edit this deck: preserve and modify that deck.
- Create a new deck inspired by this reference: author fresh SVG using the normal create workflow.

Clarify when the user's wording does not identify which behavior they want.

## PPTX Conversion Boundary

Converted decks may contain imported chart placeholders or media. Preserve legacy chart references unless the user asks to update chart data, type, theme, or emphasis.

If a chart is resized materially, regenerate the chart sidecar with the new dimensions rather than only squeezing the existing placeholder.

## Source Coverage

- Covers manifest sections: slide_organize_tool, slides_convert_tool, slides_parse_template_tool
- Coverage mode: preserve existing-deck continuation, conversion, and template parsing boundaries without turning them into publish behavior.
