# SVG Slides Chart Workflow

## When To Use A Chart

Use a chart when the slide's point depends on a real quantitative series:

- trend;
- multi-category comparison;
- part-to-whole split;
- distribution;
- ranking;
- two-dimensional positioning.

For single numbers or trivial two-bucket comparisons, prefer a large text callout unless the comparison needs a chart to be understood.

## When Not To Use A Chart

Do not generate a chart for vague, unsourced, decorative, or invented data. Do not choose a chart type because the raw data happens to look compatible; choose it because the takeaway requires that representation.

When in doubt, a sorted bar chart is safer than a pie or doughnut.

## Chart Sidecar Contract

A chart is generated as an SVG sidecar before slide authoring and embedded by reference.

The generation request must decide the takeaway first. The takeaway must be faithful to the data and short enough to guide chart design.

The request must include:

- chart type;
- JSON data matching that type;
- style matching the destination slide;
- actual on-slide width and height;
- output path under `resources/charts/`.

The declared chart width should match the embed width. Chart internals derive text size from width. Do not declare a wide chart and embed it in a narrow slot.

## Embed Contract

Embed a generated chart with:

```xml
<rect slide:role="chart" href="resources/charts/name.svg" x="120" y="180" width="800" height="500"/>
```

The embed width and height must match the chart sidecar's intended display size. Keep a 16:10-ish chart area when possible to avoid letterboxing.

One chart should carry one distinct insight. Pair charts with short callouts or labels, and vary chart composition across the deck.

## Validation Notes

Static deck validation confirms the chart placeholder shape, not the correctness of the chart sidecar data. Review chart sidecars for:

- source-backed data;
- truthful takeaway;
- readable labels;
- width at or above the practical floor;
- matching palette;
- intact `href`.

## Source Coverage

- Covers manifest sections: generate_svg_chart_tool
- Coverage mode: preserve chart generation, data contract, rendering constraints, and validation expectations.
