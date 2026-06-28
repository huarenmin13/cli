// render.mjs
import fs from "node:fs/promises";
import path from "node:path";
import process2 from "node:process";

// components/primitives.mjs
function node(type, style, children) {
  return { type, props: { style, children } };
}
function box(style, children = []) {
  return node("div", { display: "flex", boxSizing: "border-box", ...style }, children);
}
function TextBlock(value15, style = {}) {
  return node(
    "div",
    {
      display: "flex",
      boxSizing: "border-box",
      whiteSpace: "normal",
      ...style
    },
    value15
  );
}
function Title(value15, style = {}) {
  return TextBlock(value15, {
    fontSize: 58,
    fontWeight: 800,
    lineHeight: 1.05,
    ...style
  });
}
function Subtitle(value15, style = {}) {
  return TextBlock(value15, {
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.25,
    ...style
  });
}
function Badge(value15, style = {}) {
  return TextBlock(value15, {
    fontSize: 18,
    fontWeight: 700,
    ...style
  });
}
function Chip(value15, style = {}) {
  return TextBlock(value15, {
    minWidth: 92,
    height: 40,
    padding: "8px 15px",
    fontSize: 17,
    fontWeight: 600,
    ...style
  });
}
function StatCard({ index, label: label28, color, textColor, panelColor, style = {} }) {
  return box(
    {
      width: 250,
      minHeight: 126,
      flexDirection: "column",
      backgroundColor: panelColor,
      padding: 22,
      ...style
    },
    [
      TextBlock(String(index).padStart(2, "0"), {
        color,
        fontSize: 18,
        fontWeight: 800,
        marginBottom: 12
      }),
      TextBlock(label28, {
        color: textColor,
        fontSize: 21,
        fontWeight: 700,
        lineHeight: 1.18
      })
    ]
  );
}

// templates/beautiful/evaluation-stub.mjs
var evaluationTemplateIds = [];
function evaluationRendererContract(templateId35) {
  return {
    template_id: templateId35,
    renderer_id: `artboard_satori.${templateId35}`,
    status: "evaluation",
    renderer_stage: "evaluation_only",
    default_selectable: false,
    selection_scope: "evaluation_only"
  };
}
function renderEvaluationBeautifulStub() {
  return null;
}

// components/typography.mjs
var REQUIRED_FONT_ROLES = ["display", "body", "label", "metric"];
function roleOverrides(spec = {}) {
  const safeSpec = spec && typeof spec === "object" ? spec : {};
  const roles = safeSpec.theme?.typography?.font_roles;
  return roles && typeof roles === "object" ? roles : {};
}
function fontRoleAliasesFromTheme(spec = {}) {
  const roles = roleOverrides(spec);
  const result = {};
  for (const role31 of REQUIRED_FONT_ROLES) {
    if (typeof roles[role31] === "string" && roles[role31].trim()) {
      result[role31] = roles[role31].trim();
    }
  }
  return result;
}
function fontRolesFromTheme(spec = {}) {
  const aliases = fontRoleAliasesFromTheme(spec);
  const result = {};
  for (const [role31, family] of Object.entries(aliases)) {
    result[role31] = { family };
  }
  return result;
}
function roleTokenFromTheme(role31, spec = {}) {
  const safeSpec = spec && typeof spec === "object" ? spec : {};
  const tokens = safeSpec.theme?.typography?.role_tokens;
  const token = tokens && typeof tokens === "object" ? tokens[role31] : null;
  return token && typeof token === "object" ? token : {};
}
function typographyRolesFromTheme(spec = {}) {
  const result = {};
  for (const role31 of REQUIRED_FONT_ROLES) {
    result[role31] = roleTokenFromTheme(role31, spec);
  }
  return result;
}
function textStyleRolesFromTheme(spec = {}) {
  const safeSpec = spec && typeof spec === "object" ? spec : {};
  const roles = safeSpec.theme?.typography?.text_style_roles;
  return roles && typeof roles === "object" ? roles : {};
}
function textDecorationPolicyFromTheme(spec = {}) {
  const roles = textStyleRolesFromTheme(spec);
  const policy = roles.text_decoration_policy;
  return policy && typeof policy === "object" ? policy : {};
}
function decorationRequestFromFallback(fallback2 = {}) {
  const requestedLine = fallback2.textDecorationLine || fallback2.textDecoration;
  if (typeof requestedLine !== "string") return "none";
  if (requestedLine.includes("line-through")) return "line_through";
  if (requestedLine.includes("underline")) return "underline";
  return "none";
}
function textDecorationStyle(spec = {}, request = "none") {
  const policy = textDecorationPolicyFromTheme(spec);
  const underline = policy.underline && typeof policy.underline === "object" ? policy.underline : {};
  const lineThrough = policy.line_through && typeof policy.line_through === "object" ? policy.line_through : {};
  const selected = request === "line_through" ? lineThrough : underline;
  if (request === "none" || selected.style === "none") {
    return { textDecorationLine: "none" };
  }
  return {
    textDecorationLine: request === "line_through" ? "line-through" : "underline",
    textDecorationStyle: selected.style || "solid",
    textDecorationColor: selected.color || "currentColor",
    textDecorationThickness: selected.thickness || "1px"
  };
}
function tokenStyle(role31, spec = {}) {
  const token = roleTokenFromTheme(role31, spec);
  const style = {};
  if (typeof token.font_size === "number") style.fontSize = token.font_size;
  if (typeof token.font_weight === "number") style.fontWeight = token.font_weight;
  if (typeof token.line_height === "number") style.lineHeight = token.line_height;
  if (typeof token.letter_spacing === "number") style.letterSpacing = token.letter_spacing;
  if (typeof token.text_transform === "string" && token.text_transform.includes("uppercase")) style.textTransform = "uppercase";
  return style;
}
function fontRole(role31, spec = {}, fallback2 = {}) {
  const aliases = fontRoleAliasesFromTheme(spec);
  const family = aliases[role31] || `SVGlide${role31.charAt(0).toUpperCase()}${role31.slice(1)}`;
  return { fontFamily: family, ...tokenStyle(role31, spec), ...textDecorationStyle(spec, decorationRequestFromFallback(fallback2)), ...fallback2 };
}

// templates/beautiful/executive-dashboard.mjs
var templateId = "executive-dashboard";
var PAGE_VARIANTS = ["cover", "agenda", "metrics", "dashboard", "split", "bars", "quote", "timeline", "detail", "closing"];
var rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: "production",
  renderer_stage: "closed_loop_sample",
  default_selectable: true,
  selection_scope: "production",
  source_family: "blue-professional",
  page_family: {
    family_id: "blue-professional",
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ["cover", "agenda", "closing"],
      repeatable: ["metrics", "dashboard", "split", "bars", "quote", "timeline", "detail"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/blue-professional-1.png"
};
function colorWithAlpha(value15, alpha, fallback2) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value15 || "").trim());
  if (!match) return fallback2;
  const hex = match[1];
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
function colors(spec) {
  const source = spec.theme?.colors || {};
  const primary = source.primary || "#1E2BFA";
  const border = source.border || colorWithAlpha(primary, 0.2, "rgba(30, 43, 250, 0.2)");
  return {
    background: source.background || "#FDFAE7",
    panel: source.panel || "#FFFFFF",
    surface: source.surface || "#F5F7FF",
    primary,
    accent: source.accent || primary,
    text: source.text || "#111111",
    muted: source.muted || "#6B6B6B",
    border,
    cardBg: source.cardBg || colorWithAlpha(primary, 0.04, "rgba(30, 43, 250, 0.04)"),
    accentLight: source.accentLight || source.surface || colorWithAlpha(primary, 0.08, "rgba(30, 43, 250, 0.08)"),
    borderSoft: source.borderSoft || border
  };
}
var SOURCE_TEXT_LIGHT = "#9A9A9A";
var SOURCE_POSITIVE = "#059669";
var SOURCE_NEGATIVE = "#DC2626";
var FONT_ROLE_RESOLVERS = {
  display: (spec) => fontRole("display", spec),
  body: (spec) => fontRole("body", spec),
  label: (spec) => fontRole("label", spec),
  metric: (spec) => fontRole("metric", spec)
};
var ROLE_FONT_FLOORS = {
  display: 29,
  body: 12,
  label: 9,
  metric: 14
};
function role(roleName, spec, style = {}) {
  const resolver = FONT_ROLE_RESOLVERS[roleName] || ((input) => fontRole(roleName, input));
  const { minFontSize, allowSmallText, ...styleWithoutControlFields } = style;
  const merged = { ...resolver(spec), ...styleWithoutControlFields };
  const floor = allowSmallText ? 9 : typeof minFontSize === "number" ? minFontSize : ROLE_FONT_FLOORS[roleName];
  if (typeof floor === "number" && typeof merged.fontSize === "number" && merged.fontSize < floor) {
    return { ...merged, fontSize: floor };
  }
  return merged;
}
function text(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function approximateTextWidth(value15, fontSize, letterSpacing = 0) {
  return Array.from(String(value15 || "")).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28;
    if (/[\u4e00-\u9fff]/.test(char)) return width + fontSize;
    if (/[A-Za-z0-9]/.test(char)) return width + fontSize * 0.64 + letterSpacing;
    return width + fontSize * 0.58 + letterSpacing;
  }, 0);
}
function estimateWrappedLineCount(value15, width, fontSize, letterSpacing = 0) {
  const words = String(value15 || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (!words.length) return 1;
  let lines = 1;
  let currentWidth = 0;
  const spaceWidth = fontSize * 0.28;
  for (const word of words) {
    const wordWidth = approximateTextWidth(word, fontSize, letterSpacing);
    const nextWidth = currentWidth ? currentWidth + spaceWidth + wordWidth : wordWidth;
    if (currentWidth && nextWidth > width) {
      lines += Math.max(1, Math.ceil(wordWidth / width));
      currentWidth = wordWidth > width ? wordWidth % width : wordWidth;
    } else {
      currentWidth = nextWidth;
    }
  }
  return lines;
}
function variantId(spec) {
  const raw = spec.page_variant_id || spec.page_role || "dashboard";
  const normalized = String(raw).toLowerCase().replace(/^data_/, "").replace(/^process_or_/, "");
  if (normalized === "toc") return "agenda";
  if (normalized === "timeline") return "timeline";
  if (PAGE_VARIANTS.includes(normalized)) return normalized;
  throw new Error(`unsupported page_variant_id for executive-dashboard: ${raw}`);
}
function sourceShell(spec, children = []) {
  const theme8 = colors(spec);
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      backgroundColor: theme8.background,
      color: theme8.text,
      overflow: "hidden"
    },
    [
      box({ position: "absolute", left: 0, top: 0, width: 960, height: 540, backgroundColor: theme8.background }),
      ...children
    ].filter(Boolean)
  );
}
function sourceHeader(spec, eyebrowFallback, tagFallback) {
  const theme8 = colors(spec);
  return [
    TextBlock(text(spec, "eyebrow", eyebrowFallback).toUpperCase(), {
      position: "absolute",
      left: 58,
      top: 58,
      color: theme8.primary,
      letterSpacing: 0.9,
      ...role("label", spec, { fontSize: 10.5, fontWeight: 700, lineHeight: 1 })
    }),
    TextBlock(text(spec, "tag", tagFallback), {
      position: "absolute",
      right: 58,
      top: 52,
      color: theme8.primary,
      backgroundColor: theme8.accentLight,
      borderRadius: 999,
      padding: "5px 12px",
      ...role("label", spec, { fontSize: 9, fontWeight: 700, lineHeight: 1 })
    })
  ];
}
function sourceTitle(spec, fallback2, style = {}) {
  const theme8 = colors(spec);
  return Title(text(spec, "title", fallback2), {
    position: "absolute",
    left: 58,
    top: 94,
    width: 810,
    color: theme8.text,
    ...role("display", spec, { fontSize: 30, lineHeight: 1.12, fontWeight: 800, textTransform: "none" }),
    ...style
  });
}
var SOURCE_DASHBOARD_STATS = [
  ["22%", "of respondents", "Bullish for the current calendar year", "Steady from prior quarter, anchored by tariff and policy uncertainty."],
  ["51%", "of respondents", "Bullish for the next calendar year", "Up from 38% last quarter as the rate path firms up."],
  ["60%", "of respondents", "More bullish on the economy than three months ago", "A 22-point improvement, the largest sentiment swing in two years."],
  ["53%", "of respondents", "More bullish on equities than three months ago", "Tech and financials led the upgrade; energy and utilities lag."],
  ["3.6%", "median", "Expected inflation rate for the next two years", "Down 0.4 pts; long-run expectations remain anchored at 3.0%."],
  ["2.7%", "median", "Expected real GDP growth for the next two years", "A modest upgrade reflecting easing recession fears."]
];
var SOURCE_BARS = [
  ["Consumer price inflation", 79],
  ["Interest rates & central bank policy", 69],
  ["Geopolitical risks", 39],
  ["Liquidity tightening in capital markets", 37],
  ["Asset price volatility", 25],
  ["Public-sector debt & spending", 22],
  ["Climate & ESG-related risks", 18]
];
var SOURCE_DETAIL_BLOCKS = [
  ["Assuming higher cost of capital", ["Using elevated discount rates to reflect tighter monetary conditions", "Shifting hurdle rates for internal capital allocation decisions", "Emphasizing shorter payback periods for new projects"]],
  ["Cash flow & balance sheet focus", ["Prioritizing free cash flow generation as a key screening metric", "Analyzing working capital needs under inflationary input costs", "Reviewing leverage ratios and refinancing schedules"]],
  ["More conservative valuation approach", ["Greater weight assigned to downside and bear-case scenarios", "Reduced reliance on long-dated terminal value assumptions", "Increased sensitivity analysis around key drivers"]],
  ["Bottom-up stock selection", ["Reducing macro-driven top-down factor exposures", "Intensifying fundamental research at the security level", "Building conviction through differentiated data sources"]],
  ["Value over growth momentum", ["Pivoting toward earnings-supported valuations", "Favoring demonstrable unit economics over scale narratives", "Reassessing premium multiples for unprofitable segments"]],
  ["Shorter-term orientation", ["Narrowing forecasting windows for revenue and margin", "More frequent reassessment of position sizing", "Active hedging around event-driven volatility"]]
];
var SOURCE_AGENDA_ITEMS = [
  ["01", "Executive Summary", "High-level findings and key takeaways from the latest quarterly assessment."],
  ["02", "Macroeconomic Sentiment", "Investor perspectives on growth, inflation, and risk factors in the current environment."],
  ["03", "Capital Allocation Trends", "How portfolios are shifting in response to policy changes and volatility signals."],
  ["04", "Strategic Recommendations", "Actionable priorities for leadership teams navigating an uncertain landscape."],
  ["05", "Risk & Opportunity Matrix", "Evaluating the trade-offs between defensive positioning and offensive growth bets."],
  ["06", "Conclusion & Next Steps", "Summary of implications and recommended follow-up actions for stakeholders."]
];
var SOURCE_METRIC_CARDS = [
  {
    value: "73%",
    label: "Bullish on three-year outlook",
    description: "An all-time series high, reflecting renewed confidence in medium-term fundamentals despite near-term uncertainty.",
    supports: ["Highest reading since the survey began in 2018", "Cross-sector consensus, led by tech and industrials", "Driven by clarity on rate trajectory and AI capex"],
    change: "\u2191 +11 pts vs. prior quarter",
    sentiment: "positive"
  },
  {
    value: "55%",
    label: "Expect recession before year-end",
    description: "Down significantly from the prior reading, indicating easing fears of a severe or prolonged contraction.",
    supports: ["Soft-landing scenario now the modal expectation", "Median timeline pushed from Q2 to Q4", "Severity expectations also moderated meaningfully"],
    change: "\u2193 -36 pts vs. prior quarter",
    sentiment: "positive"
  },
  {
    value: "4.5%",
    label: "Median inflation expectation",
    description: "Investors expect price pressures to remain elevated through the end of the current calendar year.",
    supports: ["Wage and services inflation remain the stickiest", "Energy disinflation slower than originally modeled", "Long-run anchor steady at 3% for the next decade"],
    change: "\u2191 +0.3 pts vs. prior quarter",
    sentiment: "negative"
  }
];
var SOURCE_SPLIT_POINTS = [
  "Growth and protecting the top line remain the leading priority, cited by a clear majority as essential in the current cycle.",
  "Cash flow resilience has risen sharply in importance as liquidity conditions tightened across credit markets through Q3.",
  "Supply chain stability ranks consistently high, reflecting the lasting operational scars of recent global disruptions.",
  "Margin preservation and cost discipline have moved from defensive levers to first-line strategy in investor conversations.",
  "AI capex remains the most-discussed structural theme, but with rising attention to monetization timelines."
];
var SOURCE_SPLIT_MINI_STATS = [
  ["63%", "Prioritize top-line growth"],
  ["55%", "Prioritize cash flow resilience"],
  ["33%", "Prioritize supply chain stability"]
];
var SOURCE_TIMELINE_STEPS = [
  ["1", "Assess Resilience", "Evaluate balance sheet strength and operational buffers under stress scenarios."],
  ["2", "Protect Core Revenue", "Defend market position and pricing power in segments with durable demand."],
  ["3", "Optimize Costs", "Streamline overhead while preserving capacity for high-return investments."],
  ["4", "Selective Growth", "Deploy capital toward opportunities with clear path to profitability."]
];
function dashboardStats(spec) {
  const raw = spec.content?.stats;
  if (Array.isArray(raw) && raw.length) {
    return raw.slice(0, 6).map((item) => ({
      value: String(item.value || ""),
      unit: String(item.unit || ""),
      name: String(item.name || ""),
      context: String(item.context || "")
    }));
  }
  return SOURCE_DASHBOARD_STATS.map(([value15, unit, name, context]) => ({ value: value15, unit, name, context }));
}
function sourceBars(spec) {
  const raw = spec.content?.bars;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 7).map((item) => ({ label: String(item.label || ""), value: Number(item.value || 0) }));
  }
  return SOURCE_BARS.map(([label28, value15]) => ({ label: label28, value: value15 }));
}
function detailBlocks(spec) {
  const raw = spec.content?.details;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 6).map((item) => ({
      title: String(item.title || ""),
      items: Array.isArray(item.items) ? item.items.slice(0, 3).map((entry) => String(entry || "")) : []
    }));
  }
  return SOURCE_DETAIL_BLOCKS.map(([title2, items]) => ({ title: title2, items }));
}
function agendaItems(spec) {
  const raw = spec.content?.agenda;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 6).map((item, index) => ({
      number: String(item.number || String(index + 1).padStart(2, "0")),
      title: String(item.title || ""),
      description: String(item.description || "")
    }));
  }
  return SOURCE_AGENDA_ITEMS.map(([number2, title2, description]) => ({ number: number2, title: title2, description }));
}
function sourceMetricCards(spec) {
  const raw = spec.content?.metrics;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 3).map((item) => ({
      value: String(item.value || ""),
      label: String(item.label || ""),
      description: String(item.description || ""),
      supports: Array.isArray(item.supports) ? item.supports.slice(0, 3).map((entry) => String(entry || "")) : [],
      change: String(item.change || ""),
      sentiment: String(item.sentiment || "positive")
    }));
  }
  return SOURCE_METRIC_CARDS.map((item) => ({ ...item, supports: [...item.supports] }));
}
function splitPoints(spec) {
  const raw = spec.content?.left_points;
  if (Array.isArray(raw) && raw.length) return raw.slice(0, 5).map((entry) => String(entry || ""));
  return [...SOURCE_SPLIT_POINTS];
}
function splitMiniStats(spec) {
  const raw = spec.content?.mini_stats;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 3).map((item) => ({ value: String(item.value || ""), label: String(item.label || "") }));
  }
  return SOURCE_SPLIT_MINI_STATS.map(([value15, label28]) => ({ value: value15, label: label28 }));
}
function timelineSteps(spec) {
  const raw = spec.content?.timeline;
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.slice(0, 4).map((item, index) => ({
      number: String(item.number || index + 1),
      title: String(item.title || ""),
      description: String(item.description || "")
    }));
  }
  return SOURCE_TIMELINE_STEPS.map(([number2, title2, description]) => ({ number: number2, title: title2, description }));
}
function renderCover(spec) {
  const theme8 = colors(spec);
  const coverTitle = text(spec, "title", "Market Outlook & Strategic Priorities");
  const titleLines3 = coverTitle.includes("\n") ? coverTitle.split("\n").slice(0, 2) : [coverTitle];
  return sourceShell(spec, [
    box({
      position: "absolute",
      right: -78,
      top: 0,
      width: 360,
      height: 540,
      backgroundColor: theme8.accentLight,
      transform: "skewX(-10deg)"
    }),
    box({ position: "absolute", left: 77, top: 177, width: 30, height: 3, backgroundColor: theme8.primary, borderRadius: 2 }),
    Title(titleLines3[0], {
      position: "absolute",
      left: 77,
      top: 190,
      width: 470,
      color: theme8.text,
      ...role("display", spec, { fontSize: 45, lineHeight: 1.02, fontWeight: 900, textTransform: "none" })
    }),
    titleLines3[1] ? Title(titleLines3[1], {
      position: "absolute",
      left: 77,
      top: 236,
      width: 470,
      color: theme8.text,
      ...role("display", spec, { fontSize: 45, lineHeight: 1.02, fontWeight: 900, textTransform: "none" })
    }) : null,
    TextBlock(text(spec, "subtitle", "An analytical overview of emerging trends, shifting investor sentiment, and the key decisions shaping the next growth cycle."), {
      position: "absolute",
      left: 78,
      top: 305,
      width: 430,
      color: theme8.muted,
      ...role("body", spec, { fontSize: 14, lineHeight: 1.45 })
    }),
    TextBlock(text(spec, "meta", "Q2 2026 \xB7 Confidential"), {
      position: "absolute",
      left: 78,
      top: 370,
      width: 220,
      color: SOURCE_TEXT_LIGHT,
      letterSpacing: 0.4,
      ...role("label", spec, { fontSize: 9, lineHeight: 1, textTransform: "none" })
    }),
    box(
      { position: "absolute", right: 77, bottom: 70, width: 28, height: 28, flexDirection: "row", flexWrap: "wrap", gap: 5 },
      Array.from({ length: 9 }).map(() => box({ width: 3, height: 3, backgroundColor: theme8.primary, opacity: 0.25 }))
    )
  ]);
}
function renderAgenda(spec) {
  const theme8 = colors(spec);
  const items = agendaItems(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Table of Contents", "Overview"),
    box({ position: "absolute", left: 58, top: 88, width: 60, height: 3, borderRadius: 2, backgroundColor: theme8.primary }),
    box(
      { position: "absolute", left: 58, top: 132, width: 844, height: 318, flexDirection: "row", flexWrap: "wrap", gap: "14px 30px" },
      items.map(
        (item) => box({ width: 407, height: 96, borderBottom: `1px solid ${theme8.borderSoft}`, padding: "14px 0 12px 0", flexDirection: "row", alignItems: "flex-start" }, [
          TextBlock(item.number, { width: 48, color: theme8.primary, ...role("metric", spec, { fontSize: 20, fontWeight: 700, lineHeight: 1 }) }),
          box({ width: 340, flexDirection: "column" }, [
            TextBlock(item.title, { color: theme8.text, marginBottom: 7, ...role("body", spec, { fontSize: 14, fontWeight: 700, lineHeight: 1.2 }) }),
            TextBlock(item.description, { color: theme8.muted, ...role("body", spec, { fontSize: 11.5, lineHeight: 1.35 }) })
          ])
        ])
      )
    )
  ]);
}
function renderMetrics(spec) {
  const theme8 = colors(spec);
  const metrics = sourceMetricCards(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Executive Summary", "Key Findings"),
    sourceTitle(spec, "Sentiment has shifted measurably from the prior quarter", { width: 790 }),
    box(
      { position: "absolute", left: 58, top: 152, width: 844, height: 268, flexDirection: "row", gap: 16 },
      metrics.map(
        (item) => box({ width: 270, height: 266, position: "relative", backgroundColor: theme8.cardBg, border: `1px solid ${theme8.borderSoft}`, borderRadius: 12 }, [
          TextBlock(item.value, { position: "absolute", left: 18, top: 18, width: 220, color: theme8.primary, ...role("metric", spec, { fontSize: 38, fontWeight: 700, lineHeight: 1 }) }),
          TextBlock(item.label, { position: "absolute", left: 18, top: 68, width: 232, color: theme8.text, ...role("body", spec, { fontSize: 14, fontWeight: 700, lineHeight: 1.18 }) }),
          TextBlock(item.description, { position: "absolute", left: 18, top: 103, width: 232, color: theme8.muted, ...role("body", spec, { fontSize: 11.5, minFontSize: 11.5, lineHeight: 1.28 }) }),
          box({ position: "absolute", left: 18, top: 164, width: 234, height: 1, backgroundColor: theme8.borderSoft }),
          box({ position: "absolute", left: 18, top: 180, width: 232, flexDirection: "row", alignItems: "flex-start" }, [
            TextBlock("-", { width: 10, color: SOURCE_TEXT_LIGHT, ...role("body", spec, { fontSize: 10.5, lineHeight: 1.2 }) }),
            TextBlock(item.supports[0] || item.change, { width: 216, color: theme8.muted, ...role("body", spec, { fontSize: 10.5, lineHeight: 1.24 }) })
          ]),
          TextBlock(item.change, { position: "absolute", left: 18, bottom: 14, width: 232, color: item.sentiment === "negative" ? SOURCE_NEGATIVE : SOURCE_POSITIVE, ...role("label", spec, { fontSize: 10, fontWeight: 700, lineHeight: 1, textTransform: "none" }) })
        ])
      )
    )
  ]);
}
function renderDashboard(spec) {
  const theme8 = colors(spec);
  const stats2 = dashboardStats(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Macroeconomic Sentiment", "Data Overview"),
    sourceTitle(spec, "Current perspectives on the economy and markets"),
    box(
      { position: "absolute", left: 58, top: 158, width: 844, height: 244, flexDirection: "row", flexWrap: "wrap", gap: "14px 12px" },
      stats2.map(
        (item) => box({ width: 273, height: 114, backgroundColor: theme8.cardBg, border: `1px solid ${theme8.borderSoft}`, borderRadius: 10, padding: "13px 14px", flexDirection: "column" }, [
          box({ flexDirection: "row", alignItems: "baseline", marginBottom: 5 }, [
            TextBlock(item.value, { color: theme8.primary, marginRight: 6, ...role("metric", spec, { fontSize: 28, fontWeight: 700, lineHeight: 1 }) }),
            TextBlock(item.unit, { color: SOURCE_TEXT_LIGHT, ...role("body", spec, { fontSize: 10, lineHeight: 1 }) })
          ]),
          TextBlock(item.name, { color: theme8.text, marginBottom: 7, ...role("body", spec, { fontSize: 12.5, fontWeight: 600, lineHeight: 1.22 }) }),
          box({ width: 244, height: 1, backgroundColor: theme8.borderSoft, marginBottom: 6 }),
          TextBlock(item.context, { color: SOURCE_TEXT_LIGHT, ...role("body", spec, { fontSize: 10.5, lineHeight: 1.25 }) })
        ])
      )
    )
  ]);
}
function renderSplit(spec) {
  const theme8 = colors(spec);
  const points = splitPoints(spec);
  const miniStats = splitMiniStats(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Investor Priorities", "Analysis"),
    sourceTitle(spec, "What investors want companies to focus on right now", { width: 720 }),
    box(
      { position: "absolute", left: 58, top: 154, width: 420, height: 250, flexDirection: "column", gap: 11 },
      points.map(
        (item, index) => box({ flexDirection: "row", alignItems: "flex-start" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { width: 34, color: theme8.primary, letterSpacing: 0.4, ...role("label", spec, { fontSize: 10, fontWeight: 700, lineHeight: 1.35 }) }),
          TextBlock(item, { width: 370, color: theme8.text, ...role("body", spec, { fontSize: 12, lineHeight: 1.35 }) })
        ])
      )
    ),
    box({ position: "absolute", left: 512, top: 149, width: 2, height: 250, backgroundColor: theme8.borderSoft }),
    box({ position: "absolute", left: 560, top: 145, width: 342, minHeight: 74, backgroundColor: theme8.accentLight, borderLeft: `4px solid ${theme8.primary}`, borderRadius: 10, padding: "14px 16px", flexDirection: "column" }, [
      TextBlock(text(spec, "quote", '"The shift from growth-at-all-costs to profitable, sustainable expansion is the defining theme of this cycle."'), { color: theme8.text, ...role("display", spec, { fontSize: 17, minFontSize: 17, fontWeight: 600, lineHeight: 1.28, textTransform: "none" }) }),
      TextBlock(text(spec, "author", "Senior PM, multi-strategy fund").toUpperCase(), { marginTop: 8, color: theme8.muted, letterSpacing: 0.45, ...role("label", spec, { fontSize: 9, fontWeight: 700, lineHeight: 1 }) })
    ]),
    box(
      { position: "absolute", left: 560, top: 244, width: 342, height: 64, flexDirection: "row", gap: 10 },
      miniStats.map(
        (item) => box({ width: 107, height: 62, backgroundColor: theme8.cardBg, border: `1px solid ${theme8.borderSoft}`, borderRadius: 9, padding: "10px 11px", flexDirection: "column" }, [
          TextBlock(item.value, { color: theme8.primary, marginBottom: 5, ...role("metric", spec, { fontSize: 20, fontWeight: 700, lineHeight: 1 }) }),
          TextBlock(item.label, { color: theme8.muted, ...role("body", spec, { fontSize: 10, lineHeight: 1.25 }) })
        ])
      )
    ),
    TextBlock(text(spec, "note", "Notably absent from the top of the list: ESG-led capital allocation, which has dropped 24 points year-over-year as investors recalibrate toward returns-first mandates."), {
      position: "absolute",
      left: 560,
      top: 333,
      width: 330,
      color: theme8.muted,
      ...role("body", spec, { fontSize: 11.5, lineHeight: 1.35 })
    })
  ]);
}
function renderBars(spec) {
  const theme8 = colors(spec);
  const bars = sourceBars(spec);
  const trackWidth = 540;
  return sourceShell(spec, [
    ...sourceHeader(spec, "Risk Factors", "Ranking"),
    sourceTitle(spec, "Most important macroeconomic concerns among investors", { width: 760 }),
    box(
      { position: "absolute", left: 58, top: 184, width: 846, height: 238, flexDirection: "column", gap: 8 },
      bars.map((item) => {
        const fillWidth = Math.max(0, Math.min(trackWidth, Math.round(Number(item.value) / 100 * trackWidth)));
        return box({ height: 24, flexDirection: "row", alignItems: "center" }, [
          TextBlock(item.label, { width: 248, color: theme8.text, ...role("body", spec, { fontSize: 12, fontWeight: 600, lineHeight: 1.15 }) }),
          box({ width: trackWidth, height: 14, backgroundColor: theme8.accentLight, borderRadius: 5, overflow: "hidden" }, [
            box({ width: fillWidth, height: 14, backgroundColor: theme8.primary, borderRadius: 5 })
          ]),
          TextBlock(`${item.value}%`, { width: 44, marginLeft: 14, color: theme8.primary, textAlign: "right", ...role("metric", spec, { fontSize: 12, minFontSize: 12, fontWeight: 700, lineHeight: 1 }) })
        ]);
      })
    )
  ]);
}
function renderQuote(spec) {
  const theme8 = colors(spec);
  return sourceShell(spec, [
    box({ position: "absolute", left: 64, top: 64, width: 38, height: 38, border: `1px solid ${theme8.borderSoft}`, borderRadius: 19 }),
    box({ position: "absolute", right: 71, bottom: 76, width: 28, height: 28, backgroundColor: theme8.accentLight, borderRadius: 14 }),
    TextBlock("\u201C", { position: "absolute", left: 440, top: 196, color: theme8.primary, opacity: 0.15, ...role("display", spec, { fontSize: 70, lineHeight: 0.6, fontWeight: 700 }) }),
    TextBlock(text(spec, "quote", "In this environment, the companies that will win are those that can balance operational discipline with strategic flexibility."), {
      position: "absolute",
      left: 170,
      top: 255,
      width: 620,
      color: theme8.text,
      textAlign: "center",
      justifyContent: "center",
      ...role("display", spec, { fontSize: 21, minFontSize: 21, lineHeight: 1.25, fontWeight: 800, textTransform: "none" })
    }),
    TextBlock(text(spec, "author", "Senior Partner, Strategy Practice \u2014 Global Investment Forum 2026"), {
      position: "absolute",
      left: 320,
      top: 319,
      width: 320,
      color: theme8.muted,
      textAlign: "center",
      justifyContent: "center",
      ...role("body", spec, { fontSize: 10.5, fontWeight: 600, lineHeight: 1.2, textTransform: "none" })
    })
  ]);
}
function renderTimeline(spec) {
  const theme8 = colors(spec);
  const items = timelineSteps(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Strategic Roadmap", "Process"),
    sourceTitle(spec, "Recommended approach to navigating the current cycle", { width: 760 }),
    box({ position: "absolute", left: 128, top: 288, width: 690, height: 2, backgroundColor: theme8.borderSoft }),
    ...items.map((item, index) => {
      const x = 80 + index * 235;
      return box({ position: "absolute", left: x, top: 252, width: 140, height: 125, flexDirection: "column", alignItems: "center", textAlign: "center" }, [
        box({ width: 30, height: 30, borderRadius: 15, backgroundColor: theme8.primary, opacity: 1 - index * 0.15, marginBottom: 16, alignItems: "center", justifyContent: "center" }, [
          TextBlock(item.number, { color: theme8.background, textAlign: "center", justifyContent: "center", ...role("metric", spec, { fontSize: 12, minFontSize: 12, fontWeight: 700, lineHeight: 1 }) })
        ]),
        TextBlock(item.title, { width: 130, color: theme8.text, textAlign: "center", justifyContent: "center", marginBottom: 7, ...role("body", spec, { fontSize: 12.5, fontWeight: 700, lineHeight: 1.15 }) }),
        TextBlock(item.description, { width: 128, color: theme8.muted, textAlign: "center", justifyContent: "center", ...role("body", spec, { fontSize: 10.5, minFontSize: 10.5, lineHeight: 1.25 }) })
      ]);
    })
  ]);
}
function renderDetail(spec) {
  const theme8 = colors(spec);
  const blocks = detailBlocks(spec);
  return sourceShell(spec, [
    ...sourceHeader(spec, "Deep Dive", "Detailed Analysis"),
    sourceTitle(spec, "Changes in investment practices and valuation frameworks", { width: 820 }),
    box(
      { position: "absolute", left: 58, top: 154, width: 844, height: 330, flexDirection: "row", flexWrap: "wrap", gap: "14px 28px" },
      blocks.map(
        (item) => box({ width: 408, height: 100, backgroundColor: theme8.cardBg, border: `1px solid ${theme8.borderSoft}`, borderRadius: 10, padding: "12px 13px", flexDirection: "column" }, [
          TextBlock(item.title, { color: theme8.text, marginBottom: 7, ...role("body", spec, { fontSize: 12.5, fontWeight: 700, lineHeight: 1.12 }) }),
          ...item.items.slice(0, 3).map(
            (entry) => box({ flexDirection: "row", alignItems: "flex-start", marginBottom: 3 }, [
              box({ width: 3, height: 3, marginTop: 5, marginRight: 8, borderRadius: 2, backgroundColor: theme8.primary }),
              TextBlock(entry, { width: 370, color: theme8.muted, ...role("body", spec, { fontSize: 10.5, minFontSize: 10.5, lineHeight: 1.22 }) })
            ])
          )
        ])
      )
    )
  ]);
}
function renderClosing(spec) {
  const theme8 = colors(spec);
  const subtitleText2 = text(spec, "subtitle", "For questions or a deeper discussion of these findings, please reach out to the research team.");
  const subtitleLineCount = estimateWrappedLineCount(subtitleText2, 360, 14);
  const subtitleFontSize = subtitleLineCount > 4 ? 12.5 : subtitleLineCount > 3 ? 13 : 14;
  const ctaText = text(spec, "cta", "Download Full Report");
  const ctaWidth = Math.min(184, Math.max(140, approximateTextWidth(ctaText, 10, 0.08) + 36));
  return sourceShell(spec, [
    box({ position: "absolute", left: 350, top: 102, width: 260, height: 260, border: `1px solid ${theme8.borderSoft}`, borderRadius: 130, opacity: 0.4 }),
    box({ position: "absolute", left: 386, top: 138, width: 188, height: 188, border: `1px solid ${theme8.borderSoft}`, borderRadius: 94, opacity: 0.3 }),
    box({ position: "absolute", left: 450, top: 199, width: 60, height: 3, borderRadius: 2, backgroundColor: theme8.primary }),
    box({
      position: "absolute",
      left: 315,
      top: 226,
      width: 330,
      minHeight: 188,
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "flex-start"
    }, [
      Title(text(spec, "title", "Thank You"), {
        width: 330,
        color: theme8.text,
        textAlign: "center",
        justifyContent: "center",
        marginBottom: 10,
        ...role("display", spec, { fontSize: 40, fontWeight: 900, lineHeight: 1.1, textTransform: "none" })
      }),
      TextBlock(subtitleText2, {
        width: 360,
        color: theme8.muted,
        textAlign: "center",
        justifyContent: "center",
        marginBottom: 14,
        ...role("body", spec, { fontSize: subtitleFontSize, minFontSize: 12.5, lineHeight: 1.34 })
      }),
      TextBlock(ctaText, {
        width: ctaWidth,
        minHeight: 26,
        padding: "7px 16px",
        color: theme8.background,
        backgroundColor: theme8.primary,
        borderRadius: 999,
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        ...role("label", spec, { fontSize: 10, fontWeight: 700, lineHeight: 1, textTransform: "none" })
      }),
      TextBlock(text(spec, "contact", "research@company.com \xB7 www.company.com"), {
        width: 300,
        color: theme8.muted,
        textAlign: "center",
        justifyContent: "center",
        marginTop: 26,
        ...role("body", spec, { fontSize: 9, allowSmallText: true, lineHeight: 1 })
      })
    ])
  ]);
}
function renderExecutiveDashboard(spec) {
  const variant = variantId(spec);
  switch (variant) {
    case "cover":
      return renderCover(spec);
    case "agenda":
      return renderAgenda(spec);
    case "metrics":
      return renderMetrics(spec);
    case "dashboard":
      return renderDashboard(spec);
    case "split":
      return renderSplit(spec);
    case "bars":
      return renderBars(spec);
    case "quote":
      return renderQuote(spec);
    case "timeline":
      return renderTimeline(spec);
    case "detail":
      return renderDetail(spec);
    case "closing":
      return renderClosing(spec);
    default:
      throw new Error(`unsupported page_variant_id for executive-dashboard: ${spec.page_variant_id}`);
  }
}

// templates/beautiful/intelligence-brief.mjs
var templateId2 = "intelligence-brief";
var PAGE_VARIANTS2 = [
  "cover",
  "chapter",
  "statement",
  "split",
  "stats",
  "quote",
  "list",
  "compare",
  "editorial",
  "dense",
  "statement-2",
  "end",
  "chart",
  "diagram",
  "pie",
  "pyramid",
  "vtimeline",
  "cycle"
];
var rendererContract2 = {
  template_id: templateId2,
  renderer_id: `artboard_satori.${templateId2}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "signal",
  implemented_page_variants: PAGE_VARIANTS2,
  page_family: {
    family_id: "signal",
    supported_page_variants: PAGE_VARIANTS2,
    variant_usage_policy: {
      singletons: ["cover", "chapter", "statement", "statement-2", "end"],
      repeatable: ["split", "stats", "quote", "list", "compare", "editorial", "dense", "chart", "diagram", "pie", "pyramid", "vtimeline", "cycle"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/signal-1.png"
};
var P = {
  navy: "#1C2644",
  navyAlt: "#232F55",
  cream: "#F0ECE3",
  creamAlt: "#E6E0D4",
  warm: "#E2DCD0",
  mutedDark: "#8A96A8",
  hintDark: "#4E5A6E",
  ink: "#1A2030",
  mutedLight: "#5A6270",
  hintLight: "#9AA0A8",
  gold: "#C8A870",
  borderDark: "#2E3D5C",
  borderLight: "#CAC4B4"
};
var DEFAULTS = {
  cover: {
    label: "[Period] \xB7 [Audience] \xB7 [Deck Type]",
    title: "[Presentation]\nTitle",
    subtitle: "A short description of the deck, its purpose, and the decision it supports.",
    meta_left: "[Author Name] \xB7 [Role]",
    meta_right: "[Version] \xB7 [Status] \xB7 [Period]"
  },
  chapter: {
    chapter: "01 \xB7 [Section]",
    title: "Section headline with one emphasized idea",
    subtitle: "A brief setup sentence that explains what this section covers and why it matters."
  },
  statement: {
    label: "[Slide Label]",
    kicker: "[Kicker Label]",
    title: "A concise statement that frames the main argument in one memorable sentence.",
    footer: "03 / 18"
  },
  split: {
    label: "[Category] \xB7 [Topic]",
    kicker: "[Kicker Label]",
    title: "Main headline for a split-layout slide",
    body: "Use this paragraph for the core explanation. Keep it short, specific, and easy to scan.",
    bullets: ["First supporting point with concise context", "Second supporting point with concise context", "Third supporting point with concise context"],
    image_caption: "[Image / Evidence panel]"
  },
  stats: {
    title: "Four signals define the current operating environment",
    stats: [
      ["72%", "Primary signal strength", "Q/Q movement"],
      ["18", "Open questions", "Tracked weekly"],
      ["4.6x", "Evidence density", "Indexed sources"],
      ["03", "Decision gates", "Owner assigned"]
    ]
  },
  quote: {
    quote: "The signal is not the loudest data point. It is the one that keeps explaining the rest.",
    attribution: "Research note \xB7 internal advisory"
  },
  list: {
    title: "Operating implications",
    intro: "Use the list slide when the argument needs ordered evidence rather than another headline.",
    items: ["Clarify which signal has decision value", "Separate observed fact from interpretation", "Attach every recommendation to an accountable owner", "Keep the next review cycle visible"]
  },
  compare: {
    title: "Before / after operating model",
    left_title: "Before",
    right_title: "After",
    left: ["Fragmented reviews", "Unclear owners", "Late risk escalation", "Narrative drift"],
    right: ["Single decision log", "Named accountability", "Early warning indicators", "Evidence-backed language"]
  },
  editorial: {
    kicker: "EDITORIAL BRIEF",
    title: "The institution can move faster without sounding less careful.",
    left: "The strongest teams preserve judgment while reducing ceremony. They make the decision trail visible and keep the evidence close to the claim.",
    right: "This format is built for those moments: enough structure to feel rigorous, enough air to let one idea land.",
    stats: [
      ["2.4x", "review cadence"],
      ["31%", "fewer open loops"],
      ["06", "owner lanes"],
      ["Q3", "next checkpoint"]
    ]
  },
  dense: {
    title: "Dense analysis should still preserve an editorial reading rhythm.",
    columns: [
      {
        label: "OBSERVATION",
        paragraphs: ["The deck should feel like a written brief, not a dashboard compressed into slides.", "A narrow column and strong line height keep the page readable even when evidence is dense."]
      },
      {
        label: "IMPLICATION",
        paragraphs: ["Use the second column for interpretation, tradeoffs, or the decision logic.", "Gold appears only where emphasis carries structural meaning."]
      }
    ]
  },
  "statement-2": {
    label: "[Slide Label]",
    kicker: "SECOND PRINCIPLE",
    title: "A second statement variant for emphasis, escalation, or synthesis.",
    body: "This page intentionally reuses the statement class with different copy density so repeated source classes do not collapse into one fixture."
  },
  end: {
    title: "End note",
    subtitle: "The next step is not more information. It is a clearer decision.",
    contact: "Private intelligence note \xB7 prepared for review"
  },
  chart: {
    label: "SIGNAL TRACKER",
    title: "Evidence concentration by workstream",
    values: [38, 52, 67, 86],
    labels: ["Discovery", "Model", "Review", "Action"],
    source: "Source: synthesized review log"
  },
  diagram: {
    title: "Decision flow",
    steps: [
      ["01", "Observe", "Collect inputs without forcing conclusion."],
      ["02", "Interpret", "Name the signal and its confidence level."],
      ["03", "Act", "Assign owner, timing, and review trigger."]
    ]
  },
  pie: {
    title: "Portfolio of attention",
    items: [
      ["Strategic", "42%"],
      ["Operational", "28%"],
      ["Risk", "18%"],
      ["Narrative", "12%"]
    ],
    total: "TOTAL \xB7 100%"
  },
  pyramid: {
    title: "Evidence hierarchy",
    levels: [
      ["Decision", "One sentence that can survive scrutiny"],
      ["Recommendation", "The advised movement"],
      ["Interpretation", "What the evidence means"],
      ["Observation", "What has been seen"],
      ["Source", "Where the claim came from"]
    ]
  },
  vtimeline: {
    title: "Review cadence",
    events: [
      ["WEEK 01", "Frame", "Define the question and owner."],
      ["WEEK 02", "Observe", "Collect inputs and classify confidence."],
      ["WEEK 03", "Decide", "Commit the recommended path."],
      ["WEEK 04", "Review", "Re-open only if the signal changes."]
    ]
  },
  cycle: {
    title: "Signal loop",
    steps: [
      ["01", "Gather", "Bring evidence into one place."],
      ["02", "Read", "Separate noise from pattern."],
      ["03", "Decide", "Make the operating choice visible."],
      ["04", "Learn", "Feed the next review cycle."]
    ]
  }
};
function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS2.length) return PAGE_VARIANTS2[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS2) {
    if (raw.includes(variant)) return variant;
  }
  const slideMatch = raw.match(/slide-(\d+)/);
  if (slideMatch) {
    const slideIndex = Number(slideMatch[1]);
    if (slideIndex >= 1 && slideIndex <= PAGE_VARIANTS2.length) return PAGE_VARIANTS2[slideIndex - 1];
  }
  if (raw.includes("closing") || raw.includes("end")) return "end";
  if (raw.includes("timeline")) return "vtimeline";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("compare")) return "compare";
  if (raw.includes("quote")) return "quote";
  return "cover";
}
function content(spec, variant) {
  return { ...DEFAULTS[variant] || DEFAULTS.cover, ...spec.content || {} };
}
function textValue(value15, fallback2 = "") {
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function arrayValue(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function palette(surface4) {
  const light = surface4 === "light";
  return {
    bg: light ? P.cream : P.navy,
    alt: light ? P.creamAlt : P.navyAlt,
    text: light ? P.ink : P.warm,
    muted: light ? P.mutedLight : P.mutedDark,
    hint: light ? P.hintLight : P.hintDark,
    border: light ? P.borderLight : P.borderDark,
    gold: P.gold,
    light
  };
}
function role2(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function label(value15, spec, t, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: t.gold,
    fontSize: 9,
    lineHeight: 1.12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...role2("label", spec, { fontWeight: 700, fontSize: 9, lineHeight: 1.12, letterSpacing: 1.8, textTransform: "uppercase" }),
    ...style
  });
}
function serif(value15, spec, t, style = {}) {
  return TextBlock(value15, {
    color: t.text,
    fontSize: 42,
    lineHeight: 1.08,
    letterSpacing: -0.2,
    whiteSpace: "pre-wrap",
    ...role2("display", spec, { fontWeight: 760, fontSize: 42, lineHeight: 1.08, letterSpacing: -0.2 }),
    ...style
  });
}
function body(value15, spec, t, style = {}) {
  return TextBlock(value15, {
    color: t.muted,
    fontSize: 15,
    lineHeight: 1.58,
    ...role2("body", spec, { fontWeight: 430, fontSize: 15, lineHeight: 1.58 }),
    ...style
  });
}
function metric(value15, spec, t, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: t.gold,
    fontSize: 44,
    lineHeight: 0.96,
    letterSpacing: -0.4,
    ...role2("metric", spec, { fontWeight: 760, fontSize: 44, lineHeight: 0.96, letterSpacing: -0.4 }),
    ...style
  });
}
function rule(t, style = {}) {
  return box({ width: 36, height: 1, backgroundColor: t.gold, ...style }, []);
}
function gridTexture(t) {
  if (t.light) return [];
  const lines = [];
  for (let x = 80; x < 960; x += 80) {
    lines.push(box({ position: "absolute", left: x, top: 0, width: 1, height: 540, backgroundColor: "rgba(255,255,255,0.03)" }, []));
  }
  for (let y = 80; y < 540; y += 80) {
    lines.push(box({ position: "absolute", left: 0, top: y, width: 960, height: 1, backgroundColor: "rgba(255,255,255,0.03)" }, []));
  }
  return lines;
}
function chrome(spec, t, pageNo, title2 = "PRIVATE INTELLIGENCE NOTE") {
  return [
    box({ position: "absolute", left: 72, top: 44, right: 72, height: 1, backgroundColor: t.border }, []),
    label(title2, spec, t, { position: "absolute", left: 72, top: 24, color: t.muted }),
    label(String(pageNo).padStart(2, "0"), spec, t, { position: "absolute", right: 72, top: 24, width: 80, textAlign: "right", color: t.muted }),
    box({ position: "absolute", left: 72, bottom: 52, right: 72, height: 1, backgroundColor: t.border }, []),
    label("PRIVATE / RESEARCH", spec, t, { position: "absolute", left: 72, bottom: 28, color: t.hint }),
    label(`${String(pageNo).padStart(2, "0")} / 18`, spec, t, { position: "absolute", right: 72, bottom: 28, width: 100, textAlign: "right", color: t.hint })
  ];
}
function page(spec, surface4, pageNo, children, { chromeLabel = "PRIVATE INTELLIGENCE NOTE", includeChrome = true } = {}) {
  const t = palette(surface4);
  return box({ width: 960, height: 540, position: "relative", overflow: "hidden", backgroundColor: t.bg }, [
    ...gridTexture(t),
    ...includeChrome ? chrome(spec, t, pageNo, chromeLabel) : [],
    ...children
  ]);
}
function bulletList(items, spec, t, style = {}) {
  return box({ flexDirection: "column", gap: 12, ...style }, items.map(
    (item) => box({ flexDirection: "row", alignItems: "flex-start" }, [
      label("\u2014", spec, t, { width: 22, color: t.gold, letterSpacing: 0 }),
      body(item, spec, t, { flex: 1, fontSize: 14.5, lineHeight: 1.45 })
    ])
  ));
}
function renderCover2(spec) {
  const c = content(spec, "cover");
  const t = palette("dark");
  return page(spec, "dark", 1, [
    label(textValue(c.label, DEFAULTS.cover.label), spec, t, { position: "absolute", left: 72, top: 78, color: t.muted }),
    rule(t, { position: "absolute", left: 72, top: 132 }),
    Title(textValue(c.title, DEFAULTS.cover.title), {
      position: "absolute",
      left: 72,
      top: 154,
      width: 720,
      color: t.text,
      fontSize: 66,
      lineHeight: 0.92,
      whiteSpace: "pre-wrap",
      ...role2("display", spec, { fontWeight: 820, fontSize: 66, lineHeight: 0.92, letterSpacing: -1.1 })
    }),
    body(textValue(c.subtitle, DEFAULTS.cover.subtitle), spec, t, { position: "absolute", left: 74, top: 354, width: 500, fontSize: 18, lineHeight: 1.55 }),
    box({ position: "absolute", left: 72, right: 72, bottom: 74, height: 1, backgroundColor: t.border }, []),
    label(textValue(c.meta_left, DEFAULTS.cover.meta_left), spec, t, { position: "absolute", left: 72, bottom: 44, color: t.muted }),
    label(textValue(c.meta_right, DEFAULTS.cover.meta_right), spec, t, { position: "absolute", right: 72, bottom: 44, width: 280, textAlign: "right", color: t.muted })
  ], { includeChrome: false });
}
function renderChapter(spec) {
  const c = content(spec, "chapter");
  const t = palette("dark");
  return page(spec, "dark", 2, [
    label(textValue(c.chapter, DEFAULTS.chapter.chapter), spec, t, { position: "absolute", left: 122, top: 148, color: t.muted }),
    rule(t, { position: "absolute", left: 122, top: 186 }),
    serif(textValue(c.title, DEFAULTS.chapter.title), spec, t, { position: "absolute", left: 122, top: 216, width: 620, fontSize: 43, lineHeight: 1.1 }),
    body(textValue(c.subtitle, DEFAULTS.chapter.subtitle), spec, t, { position: "absolute", left: 122, top: 414, width: 510, fontSize: 17, lineHeight: 1.45 })
  ], { includeChrome: false });
}
function renderStatement(spec, variant = "statement", pageNo = 3) {
  const c = content(spec, variant);
  const t = palette("dark");
  const hasBody = Boolean(c.body);
  return page(spec, "dark", pageNo, [
    box({ position: "absolute", left: 118, top: hasBody ? 142 : 160, width: 680, flexDirection: "column" }, [
      label(textValue(c.kicker, DEFAULTS.statement.kicker), spec, t),
      rule(t, { marginTop: 22, marginBottom: hasBody ? 24 : 28 }),
      serif(textValue(c.title, DEFAULTS[variant].title), spec, t, { fontSize: hasBody ? 43 : 49, lineHeight: hasBody ? 1.1 : 1.12 }),
      c.body ? body(c.body, spec, t, { marginTop: 18, width: 570, fontSize: 15.5, lineHeight: 1.38 }) : null
    ].filter(Boolean))
  ], { chromeLabel: textValue(c.label, DEFAULTS.statement.label) });
}
function renderSplit2(spec) {
  const c = content(spec, "split");
  const t = palette("light");
  return page(spec, "light", 4, [
    box({ position: "absolute", left: 74, top: 96, width: 390, flexDirection: "column" }, [
      label(textValue(c.kicker, DEFAULTS.split.kicker), spec, t),
      serif(textValue(c.title, DEFAULTS.split.title), spec, t, { marginTop: 22, color: t.text, fontSize: 37, lineHeight: 1.16 }),
      body(textValue(c.body, DEFAULTS.split.body), spec, t, { marginTop: 18, fontSize: 16, color: t.muted }),
      bulletList(arrayValue(c.bullets, DEFAULTS.split.bullets), spec, t, { marginTop: 18 })
    ]),
    box({ position: "absolute", right: 76, top: 100, width: 335, height: 310, backgroundColor: t.alt, border: `1px solid ${t.border}`, alignItems: "center", justifyContent: "center" }, [
      box({ width: 220, height: 146, border: `1px solid ${t.border}`, alignItems: "center", justifyContent: "center" }, [
        label(textValue(c.image_caption, DEFAULTS.split.image_caption), spec, t, { color: t.hint, textAlign: "center", letterSpacing: 1.1 })
      ])
    ])
  ], { chromeLabel: textValue(c.label, DEFAULTS.split.label) });
}
function renderStats(spec) {
  const c = content(spec, "stats");
  const t = palette("dark");
  const stats2 = arrayValue(c.stats, DEFAULTS.stats.stats);
  return page(spec, "dark", 5, [
    serif(textValue(c.title, DEFAULTS.stats.title), spec, t, { position: "absolute", left: 74, top: 104, width: 610, fontSize: 42 }),
    box({ position: "absolute", left: 74, top: 240, width: 812, flexDirection: "row", flexWrap: "wrap" }, stats2.slice(0, 4).map(
      (item, index) => box({ width: 390, height: 104, borderTop: `1px solid ${t.border}`, paddingTop: 18, marginRight: index % 2 === 0 ? 32 : 0, marginBottom: 24, flexDirection: "column" }, [
        metric(item[0], spec, t, { fontSize: 48 }),
        body(item[1], spec, t, { marginTop: 8, fontSize: 15, color: t.text }),
        label(item[2], spec, t, { marginTop: 6, color: t.hint })
      ])
    ))
  ]);
}
function renderQuote2(spec) {
  const c = content(spec, "quote");
  const t = palette("dark");
  return page(spec, "dark", 6, [
    metric("\u201C", spec, t, { position: "absolute", left: 116, top: 118, fontSize: 112, lineHeight: 0.7, color: t.gold }),
    serif(textValue(c.quote, DEFAULTS.quote.quote), spec, t, { position: "absolute", left: 190, top: 154, width: 610, fontSize: 43, lineHeight: 1.24, fontWeight: 500 }),
    label(textValue(c.attribution, DEFAULTS.quote.attribution), spec, t, { position: "absolute", left: 194, top: 390, color: t.muted })
  ]);
}
function renderList(spec) {
  const c = content(spec, "list");
  const t = palette("light");
  return page(spec, "light", 7, [
    serif(textValue(c.title, DEFAULTS.list.title), spec, t, { position: "absolute", left: 74, top: 98, width: 420, fontSize: 42 }),
    body(textValue(c.intro, DEFAULTS.list.intro), spec, t, { position: "absolute", left: 74, top: 220, width: 430, fontSize: 17, lineHeight: 1.45 }),
    bulletList(arrayValue(c.items, DEFAULTS.list.items), spec, t, { position: "absolute", right: 86, top: 116, width: 330 })
  ], { chromeLabel: "OPERATING NOTE" });
}
function renderCompare(spec) {
  const c = content(spec, "compare");
  const t = palette("dark");
  return page(spec, "dark", 8, [
    serif(textValue(c.title, DEFAULTS.compare.title), spec, t, { position: "absolute", left: 74, top: 92, width: 610, fontSize: 38 }),
    box({ position: "absolute", left: 82, top: 200, width: 370, height: 230, borderRight: `1px solid ${t.border}`, paddingRight: 40, flexDirection: "column" }, [
      label(textValue(c.left_title, DEFAULTS.compare.left_title), spec, t),
      bulletList(arrayValue(c.left, DEFAULTS.compare.left), spec, t, { marginTop: 18 })
    ]),
    box({ position: "absolute", right: 82, top: 200, width: 370, height: 230, paddingLeft: 24, flexDirection: "column" }, [
      label(textValue(c.right_title, DEFAULTS.compare.right_title), spec, t),
      bulletList(arrayValue(c.right, DEFAULTS.compare.right), spec, t, { marginTop: 18 })
    ])
  ]);
}
function renderEditorial(spec) {
  const c = content(spec, "editorial");
  const t = palette("dark");
  const stats2 = arrayValue(c.stats, DEFAULTS.editorial.stats);
  return page(spec, "dark", 9, [
    label(textValue(c.kicker, DEFAULTS.editorial.kicker), spec, t, { position: "absolute", left: 74, top: 92 }),
    serif(textValue(c.title, DEFAULTS.editorial.title), spec, t, { position: "absolute", left: 74, top: 122, width: 650, fontSize: 37 }),
    body(textValue(c.left, DEFAULTS.editorial.left), spec, t, { position: "absolute", left: 74, top: 252, width: 330, fontSize: 14.5 }),
    body(textValue(c.right, DEFAULTS.editorial.right), spec, t, { position: "absolute", left: 430, top: 252, width: 300, fontSize: 14.5 }),
    box({ position: "absolute", right: 74, top: 250, width: 120, flexDirection: "column" }, stats2.slice(0, 4).map(
      (item) => box({ borderTop: `1px solid ${t.border}`, padding: "10px 0" }, [
        metric(item[0], spec, t, { fontSize: 25 }),
        label(item[1], spec, t, { color: t.hint, letterSpacing: 0.8, marginTop: 4 })
      ])
    ))
  ]);
}
function renderDense(spec) {
  const c = content(spec, "dense");
  const t = palette("dark");
  const cols = arrayValue(c.columns, DEFAULTS.dense.columns);
  return page(spec, "dark", 10, [
    serif(textValue(c.title, DEFAULTS.dense.title), spec, t, { position: "absolute", left: 74, top: 92, width: 700, fontSize: 35, paddingBottom: 24, borderBottom: `1px solid ${t.border}` }),
    ...cols.slice(0, 2).map(
      (col, index) => box({ position: "absolute", left: index === 0 ? 74 : 492, top: 220, width: 340, flexDirection: "column" }, [
        label(col.label, spec, t, { color: t.hint, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }),
        ...arrayValue(col.paragraphs, []).map((paragraph) => body(paragraph, spec, t, { marginTop: 14, fontSize: 14.5, lineHeight: 1.58 }))
      ])
    )
  ]);
}
function renderEnd(spec) {
  const c = content(spec, "end");
  const t = palette("dark");
  return page(spec, "dark", 12, [
    rule(t, { position: "absolute", left: 128, top: 174 }),
    serif(textValue(c.title, DEFAULTS.end.title), spec, t, { position: "absolute", left: 128, top: 206, width: 620, fontSize: 62 }),
    body(textValue(c.subtitle, DEFAULTS.end.subtitle), spec, t, { position: "absolute", left: 130, top: 318, width: 500, fontSize: 18 }),
    label(textValue(c.contact, DEFAULTS.end.contact), spec, t, { position: "absolute", left: 130, top: 392, color: t.hint })
  ], { includeChrome: false });
}
function renderChart(spec) {
  const c = content(spec, "chart");
  const t = palette("dark");
  const values = arrayValue(c.values, DEFAULTS.chart.values);
  const labels = arrayValue(c.labels, DEFAULTS.chart.labels);
  const max = Math.max(...values, 1);
  return page(spec, "dark", 13, [
    label(textValue(c.label, DEFAULTS.chart.label), spec, t, { position: "absolute", left: 74, top: 88 }),
    serif(textValue(c.title, DEFAULTS.chart.title), spec, t, { position: "absolute", left: 74, top: 120, width: 620, fontSize: 36 }),
    box({ position: "absolute", left: 108, top: 238, width: 710, height: 190, borderLeft: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, flexDirection: "row", alignItems: "flex-end", gap: 42, paddingLeft: 20 }, values.slice(0, 4).map(
      (value15, index) => box({ width: 110, height: 160, flexDirection: "column", justifyContent: "flex-end" }, [
        body(String(value15), spec, t, { color: index === values.length - 1 ? t.gold : t.muted, fontSize: 15, marginBottom: 8 }),
        box({ width: 110, height: Math.max(28, value15 / max * 132), backgroundColor: index === values.length - 1 ? t.gold : t.hint }, []),
        label(labels[index], spec, t, { marginTop: 10, color: t.hint, letterSpacing: 0.9 })
      ])
    )),
    label(textValue(c.source, DEFAULTS.chart.source), spec, t, { position: "absolute", left: 108, bottom: 78, color: t.hint })
  ], { chromeLabel: "CHART NOTE" });
}
function renderDiagram(spec) {
  const c = content(spec, "diagram");
  const t = palette("light");
  const steps = arrayValue(c.steps, DEFAULTS.diagram.steps);
  return page(spec, "light", 14, [
    serif(textValue(c.title, DEFAULTS.diagram.title), spec, t, { position: "absolute", left: 74, top: 92, width: 520, fontSize: 39 }),
    box({ position: "absolute", left: 88, top: 224, right: 88, flexDirection: "row", alignItems: "stretch" }, steps.slice(0, 3).map(
      (step, index) => box({ width: 238, marginRight: index < 2 ? 38 : 0, flexDirection: "column" }, [
        metric(step[0], spec, t, { fontSize: 54 }),
        serif(step[1], spec, t, { marginTop: 12, fontSize: 25 }),
        body(step[2], spec, t, { marginTop: 12, fontSize: 14.5 }),
        index < 2 ? label("\u2192", spec, t, { position: "absolute", left: 250 + index * 276, top: 42, color: t.hint, fontSize: 22, letterSpacing: 0 }) : null
      ].filter(Boolean))
    ))
  ], { chromeLabel: "FLOW" });
}
function renderPie(spec) {
  const c = content(spec, "pie");
  const t = palette("dark");
  const items = arrayValue(c.items, DEFAULTS.pie.items);
  return page(spec, "dark", 15, [
    serif(textValue(c.title, DEFAULTS.pie.title), spec, t, { position: "absolute", left: 74, top: 94, width: 580, fontSize: 38 }),
    box({ position: "absolute", left: 160, top: 232, width: 190, height: 190, borderRadius: 95, backgroundColor: t.gold, border: `1px solid ${t.gold}`, alignItems: "center", justifyContent: "center" }, [
      box({ width: 84, height: 84, borderRadius: 42, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }, [
        label("TOTAL", spec, t, { color: t.muted, textAlign: "center", letterSpacing: 0.6 })
      ])
    ]),
    box({ position: "absolute", right: 150, top: 210, width: 330, flexDirection: "column", gap: 20 }, items.slice(0, 4).map(
      (item, index) => box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 13, height: 13, marginRight: 18, backgroundColor: [t.gold, t.muted, t.hint, t.border][index] }, []),
        body(item[0], spec, t, { flex: 1, color: t.text, fontSize: 18 }),
        label(item[1], spec, t, { width: 60, textAlign: "right" })
      ])
    )),
    label(textValue(c.total, DEFAULTS.pie.total), spec, t, { position: "absolute", right: 150, top: 398, width: 330, paddingTop: 14, borderTop: `1px solid ${t.border}`, color: t.hint })
  ]);
}
function renderPyramid(spec) {
  const c = content(spec, "pyramid");
  const t = palette("dark");
  const levels = arrayValue(c.levels, DEFAULTS.pyramid.levels);
  return page(spec, "dark", 16, [
    serif(textValue(c.title, DEFAULTS.pyramid.title), spec, t, { position: "absolute", left: 74, top: 92, width: 560, fontSize: 38 }),
    box({ position: "absolute", left: 122, top: 188, width: 716, flexDirection: "column", alignItems: "center", gap: 4 }, levels.slice(0, 5).map(
      (level, index) => box({ width: 280 + index * 88, height: 48, borderLeft: `3px solid ${t.gold}`, backgroundColor: index === 0 ? t.gold : t.border, opacity: index === 0 ? 0.95 : 0.84 - index * 0.08, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }, [
        body(level[0], spec, t, { color: t.text, fontSize: 17, fontWeight: 700 }),
        body(level[1], spec, t, { color: t.muted, fontSize: 12.5, width: 310, textAlign: "right", lineHeight: 1.2 })
      ])
    ))
  ]);
}
function renderVtimeline(spec) {
  const c = content(spec, "vtimeline");
  const t = palette("dark");
  const events = arrayValue(c.events, DEFAULTS.vtimeline.events);
  return page(spec, "dark", 17, [
    serif(textValue(c.title, DEFAULTS.vtimeline.title), spec, t, { position: "absolute", left: 74, top: 92, width: 600, fontSize: 38, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }),
    box({ position: "absolute", left: 118, top: 190, width: 720, height: 260 }, [
      box({ position: "absolute", left: 150, top: 0, width: 1, height: 250, backgroundColor: t.border }, []),
      ...events.slice(0, 4).flatMap((event, index) => {
        const top = index * 62;
        return [
          label(event[0], spec, t, { position: "absolute", left: 0, top: top + 3, width: 120, textAlign: "right", color: t.hint }),
          box({ position: "absolute", left: 146, top: top + 7, width: 9, height: 9, borderRadius: 5, backgroundColor: t.gold }, []),
          serif(event[1], spec, t, { position: "absolute", left: 182, top, width: 220, fontSize: 22 }),
          body(event[2], spec, t, { position: "absolute", left: 420, top: top + 3, width: 275, fontSize: 13.5 })
        ];
      })
    ])
  ], { chromeLabel: "TIMELINE" });
}
function renderCycle(spec) {
  const c = content(spec, "cycle");
  const t = palette("dark");
  const steps = arrayValue(c.steps, DEFAULTS.cycle.steps);
  return page(spec, "dark", 18, [
    serif(textValue(c.title, DEFAULTS.cycle.title), spec, t, { position: "absolute", left: 74, top: 92, width: 520, fontSize: 38 }),
    box({ position: "absolute", left: 150, top: 190, width: 660, height: 260 }, steps.slice(0, 4).map((step, index) => {
      const positions = [
        { left: 0, top: 0 },
        { right: 0, top: 0 },
        { right: 0, bottom: 0 },
        { left: 0, bottom: 0 }
      ];
      return box({ position: "absolute", width: 280, height: 104, borderTop: `2px solid ${t.gold}`, paddingTop: 14, flexDirection: "column", ...positions[index] }, [
        metric(step[0], spec, t, { fontSize: 32 }),
        serif(step[1], spec, t, { fontSize: 22, marginTop: 6 }),
        body(step[2], spec, t, { fontSize: 12.8, marginTop: 6, lineHeight: 1.35 })
      ]);
    })),
    label("\u21BB", spec, t, { position: "absolute", left: 465, top: 286, color: t.hint, fontSize: 32, letterSpacing: 0 })
  ], { chromeLabel: "CYCLE" });
}
var RENDERERS = {
  cover: renderCover2,
  chapter: renderChapter,
  statement: (spec) => renderStatement(spec, "statement", 3),
  split: renderSplit2,
  stats: renderStats,
  quote: renderQuote2,
  list: renderList,
  compare: renderCompare,
  editorial: renderEditorial,
  dense: renderDense,
  "statement-2": (spec) => renderStatement(spec, "statement-2", 11),
  end: renderEnd,
  chart: renderChart,
  diagram: renderDiagram,
  pie: renderPie,
  pyramid: renderPyramid,
  vtimeline: renderVtimeline,
  cycle: renderCycle
};
function renderIntelligenceBrief(spec) {
  const variant = normalizeVariant(spec);
  return (RENDERERS[variant] || renderCover2)(spec);
}

// templates/beautiful/poster-stat-punch.mjs
var templateId3 = "poster-stat-punch";
var rendererContract3 = {
  template_id: templateId3,
  renderer_id: `artboard_satori.${templateId3}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "bold-poster",
  implemented_page_variants: ["hero", "red", "summary", "financial", "stat", "services", "roadmap", "pillars", "global", "close"],
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/bold-poster-1.png"
};
var CANVAS = { width: 960, height: 540 };
var DEFAULT_CONTENT = {
  hero: {
    meta: "Q3 Strategic Overview - Fiscal Year 2026",
    title: "Apex Group Ltd.",
    tag_label: "Annual Report",
    subtitle: "Building scalable solutions for enterprise partners worldwide since 2019."
  },
  red: {
    quote: `"We don't follow markets. We build the infrastructure they run on."`,
    cite: "- Our operating thesis since day one"
  },
  summary: {
    title: "Executive Summary",
    columns: [
      "Apex Group Ltd. partners with ambitious enterprise teams to turn complex operational challenges into scalable software infrastructure. Founded in 2019, we now serve 48 active clients across fintech, logistics, and SaaS verticals in 12 countries.\n\nOur platform model combines strategic consulting, product design, and engineering execution under one engagement structure, eliminating handoff delays and knowledge loss.",
      "This fiscal year we delivered 14 major product releases, achieved SOC 2 Type II certification, reduced API latency by 40% at the 99th percentile, and launched a self-serve tier for mid-market customers.\n\nLooking ahead, we are expanding into EMEA and APAC through two new regional hubs, targeting $18M ARR by Q4 2026."
    ],
    highlights: [
      { value: "340%", label: "YoY Revenue Growth", body: "From $2.7M to $12M ARR in 24 months with positive unit economics." },
      { value: "94%", label: "Gross Retention", body: "Enterprise clients renew at industry-leading rates with zero churn in top quartile." },
      { value: "120", label: "Team Members", body: "Engineering, design, and strategy distributed across four continents." }
    ]
  },
  financial: {
    title: "Financial Performance",
    cells: [
      { value: "$12.4M", label: "Annual Recurring Revenue", body: "Net revenue retention of 118% driven by expansion revenue from existing accounts.", micro: "Up from $2.7M two years prior." },
      { value: "18%", label: "Net Profit Margin", body: "Profitable for six consecutive quarters while reinvesting 35% of gross profit into R&D.", micro: "EBITDA positive since Q2 FY24." },
      { value: "$420", label: "Avg. Contract Value", body: "Enterprise ACV measured in thousands. Median contract length is 24 months.", micro: "Top decile ACV: $1.8M." },
      { value: "4.2x", label: "LTV / CAC Ratio", body: "Customer lifetime value of $48K against blended acquisition cost of $11.4K across all channels.", micro: "Enterprise segment: 6.8x." },
      { value: "8 mo", label: "Cash Runway", body: "$8.2M cash on hand with monthly burn of $980K, fully funded to profitability.", micro: "Series A closed March 2025." },
      { value: "$18M", label: "FY27 Revenue Target", body: "Projected ARR by March 2027 based on current pipeline velocity and expansion assumptions.", micro: "Weighted pipeline: $31M." }
    ]
  },
  stat: {
    value: "96%",
    items: [
      { value: "48", label: "Active Clients" },
      { value: "12", label: "Countries" },
      { value: "99.97%", label: "Platform Uptime" }
    ],
    context: "Customer satisfaction score across all active engagements, measured quarterly via NPS and CSAT composite."
  },
  services: {
    title: "Service Lines",
    cards: [
      { title: "Strategy", body: "Market analysis, competitive positioning, and multi-year roadmaps that bridge ambition with executable milestones.", bullets: ["Market sizing and TAM analysis", "Competitive landscape mapping", "Pricing strategy and packaging design", "M&A target identification"] },
      { title: "Design", body: "Product design, brand systems, and user research that make complexity feel effortless to end users.", bullets: ["UX research and journey mapping", "Design systems at scale", "Prototyping and usability testing", "Brand identity and visual language"] },
      { title: "Build", body: "Scalable architecture, robust APIs, and infrastructure that grows with demand rather than against it.", bullets: ["Cloud-native architecture design", "API development and developer experience", "Security audit and compliance engineering", "CI/CD pipelines and observability"] },
      { title: "Scale", body: "Go-to-market planning, partner programs, and revenue operations that compound quarter over quarter.", bullets: ["Partner channel development", "Sales process and tooling", "Customer success playbooks", "Revenue operations and forecasting"] }
    ]
  },
  roadmap: {
    phases: [
      { label: "Phase One - Complete (FY22-FY24)", title: "Foundation", body: "Core platform refined. Enterprise-grade compliance and security architecture shipped across three verticals.", bullets: ["14 major product releases this quarter", "SOC 2 Type II and ISO 27001 certifications", "API latency reduced 40% at p99", "Self-serve onboarding launched"] },
      { label: "Phase Two - Current (FY25)", title: "Expansion", body: "Two new regional hubs, localized compliance infrastructure, partner activation, and sales scaling.", bullets: ["EMEA hub operational in London", "APAC hub in Singapore scheduled Q2", "5 strategic partners signed", "Localized pricing and tax handling live"] },
      { label: "Phase Three - FY26-FY27", title: "Platformization", body: "Opening core infrastructure to certified developers and system integrators through a marketplace model.", bullets: ["Developer portal and sandbox", "App marketplace with revenue sharing", "Partner certification program", "White-label licensing for enterprises"] },
      { label: "Phase Four - FY28+", title: "Ecosystem", body: "Becoming the default infrastructure layer for the vertical across global markets.", bullets: ["Strategic M&A for complementary capabilities", "Industry consortium founding", "Open-source components for trust", "Target: 500+ active partners"] }
    ]
  },
  pillars: {
    pillars: [
      { number: "01", title: "Clarity", lead: "Every decision is documented, traceable, and communicated with context.", bullets: ["Clear DRI assigned to every initiative", "Public dashboards with real-time metrics", "Decision logs published within 24 hours", "Weekly all-hands with open Q&A", "Written strategy docs preferred over decks", "OKRs visible to all employees"] },
      { number: "02", title: "Velocity", lead: "Speed comes from focus and tooling, not from working longer hours.", bullets: ["Two-week sprints with retrospectives", "CI/CD with production deploys every day", "Feature flags for gradual rollouts", "Direct customer feedback every cycle", "Bi-weekly demos open to stakeholders", "Automated testing at 94% coverage"] },
      { number: "03", title: "Trust", lead: "Radical transparency with partners, employees, and the market.", bullets: ["Real-time uptime dashboards shared externally", "Quarterly business reviews with all clients", "Security reports published proactively", "90-day exit clauses in every contract", "Named account engineers for enterprise tier", "Open API status page with incident history"] }
    ]
  },
  global: {
    title: "Global Presence",
    cards: [
      { label: "Headquarters", title: "San Francisco", body: "Primary engineering, design, and executive leadership based in the Bay Area. Founded here in 2019.", stats: [{ value: "65", label: "employees" }, { value: "42K", label: "sq ft office" }] },
      { label: "Regional Hub", title: "London", body: "EMEA sales, customer success, and compliance operations for UK, EU, and Middle East clients.", stats: [{ value: "28", label: "employees" }, { value: "18", label: "clients live" }] },
      { label: "Regional Hub", title: "Singapore", body: "APAC expansion hub launching Q2 2026, focused on fintech and logistics verticals.", stats: [{ value: "12", label: "employees" }, { value: "4", label: "clients pilot" }] },
      { label: "Distributed", title: "Remote Network", body: "Engineering and design talent in 8 additional countries with an async-first operating model.", stats: [{ value: "15", label: "remote staff" }, { value: "8", label: "time zones" }] }
    ]
  },
  close: {
    title: "Thank You",
    subtitle: "Ready to explore what we can build together?\nhello@apexgroup.co - San Francisco - Worldwide",
    links: ["LinkedIn", "Contact", "Careers"]
  }
};
function colors2(spec) {
  const source = spec.theme?.colors || {};
  return {
    background: source.background || "#FFFFFF",
    paper: source.surface || "#F5F2EF",
    text: source.text || "#1C1410",
    muted: source.muted || "#7B706A",
    red: source.primary || "#D8000F",
    line: source.accent || "#1C1410"
  };
}
function text2(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function arrayValue2(spec, key, fallback2 = []) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function objectArray(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const value15 = spec.content?.[key];
    if (Array.isArray(value15) && value15.some((item) => item && typeof item === "object")) {
      return value15.filter((item) => item && typeof item === "object");
    }
  }
  return fallback2;
}
function normalizeVariant2(spec) {
  const raw = `${spec.renderer_variant_id || spec.page_variant_id || spec.page_role || ""}`.toLowerCase();
  if (raw.includes("red") || raw.includes("quote") || raw.includes("statement")) return "red";
  if (raw.includes("summary") || raw.includes("agenda")) return "summary";
  if (raw.includes("financial")) return "financial";
  if (raw.includes("stat")) return "stat";
  if (raw.includes("service")) return "services";
  if (raw.includes("roadmap") || raw.includes("timeline") || raw.includes("process")) return "roadmap";
  if (raw.includes("pillar") || raw.includes("comparison")) return "pillars";
  if (raw.includes("global") || raw.includes("detail")) return "global";
  if (raw.includes("close") || raw.includes("closing") || raw.includes("final")) return "close";
  return "hero";
}
function splitPosterTitle(title2) {
  const cleaned = title2 || DEFAULT_CONTENT.hero.title;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 3) return { top: words[0], red: words[1], tail: words.slice(2).join(" ") };
  if (words.length === 2) return { top: words[0], red: words[1], tail: "Ltd." };
  return { top: cleaned, red: "Group", tail: "Ltd." };
}
function frame(spec, children, { background = null, color = null } = {}) {
  const theme8 = colors2(spec);
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: "relative",
      backgroundColor: background || theme8.background,
      color: color || theme8.text,
      overflow: "hidden"
    },
    [
      ...children,
      TextBlock(String(spec.page_family_source?.source_slide_index || ""), {
        position: "absolute",
        right: 20,
        bottom: 16,
        width: 70,
        opacity: 0.45,
        color: color || theme8.text,
        fontSize: 8,
        letterSpacing: 2,
        textAlign: "right",
        ...fontRole("label", spec, { fontWeight: 600 })
      })
    ]
  );
}
function displayText(value15, spec, style = {}) {
  return Title(value15, {
    color: colors2(spec).text,
    ...fontRole("display", spec, { fontWeight: 900 }),
    textTransform: "none",
    ...style
  });
}
function metricText(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: colors2(spec).red,
    ...fontRole("metric", spec, { fontWeight: 900 }),
    ...style
  });
}
function bodyText(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: colors2(spec).text,
    fontSize: 13,
    lineHeight: 1.6,
    ...fontRole("body", spec, { fontWeight: 400 }),
    ...style
  });
}
function labelText(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: colors2(spec).red,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    ...fontRole("label", spec, { fontWeight: 600 }),
    ...style
  });
}
function shadowDisplay(value15, spec, style = {}) {
  const theme8 = colors2(spec);
  return [
    displayText(value15, spec, { ...style, left: style.left + 6, top: style.top + 6, color: theme8.text, opacity: 0.15 }),
    displayText(value15, spec, { ...style, left: style.left + 4, top: style.top + 4, color: theme8.text, opacity: 0.2 }),
    displayText(value15, spec, { ...style, left: style.left + 2, top: style.top + 2, color: theme8.text, opacity: 0.25 }),
    displayText(value15, spec, { ...style, color: theme8.background })
  ];
}
function renderHero(spec) {
  const theme8 = colors2(spec);
  const title2 = splitPosterTitle(text2(spec, "title", DEFAULT_CONTENT.hero.title));
  return frame(
    spec,
    [
      bodyText(text2(spec, "meta", text2(spec, "hero_meta", DEFAULT_CONTENT.hero.meta)), spec, {
        position: "absolute",
        left: 68,
        top: 52,
        width: 360,
        color: theme8.text,
        opacity: 0.62,
        fontSize: 11,
        lineHeight: 1.4,
        letterSpacing: 0.5
      }),
      displayText(title2.top, spec, {
        position: "absolute",
        left: 66,
        top: 76,
        width: 700,
        fontSize: 112,
        lineHeight: 0.88,
        letterSpacing: 1
      }),
      displayText(title2.red, spec, {
        position: "absolute",
        left: 58,
        top: 165,
        width: 720,
        color: theme8.red,
        fontSize: 132,
        lineHeight: 0.85,
        letterSpacing: 1,
        transform: "rotate(-4deg)"
      }),
      displayText(title2.tail, spec, {
        position: "absolute",
        left: 66,
        top: 292,
        width: 620,
        color: theme8.text,
        fontSize: 96,
        lineHeight: 0.9,
        transform: "rotate(2deg)"
      }),
      labelText(text2(spec, "tag_label", DEFAULT_CONTENT.hero.tag_label), spec, {
        position: "absolute",
        right: 66,
        bottom: 116,
        width: 240,
        textAlign: "right"
      }),
      bodyText(text2(spec, "subtitle", DEFAULT_CONTENT.hero.subtitle), spec, {
        position: "absolute",
        right: 66,
        bottom: 58,
        width: 292,
        color: theme8.text,
        fontSize: 13,
        lineHeight: 1.55,
        textAlign: "right"
      })
    ],
    { progress: 0.1 }
  );
}
function renderRed(spec) {
  const theme8 = colors2(spec);
  return frame(
    spec,
    [
      ...shadowDisplay(text2(spec, "quote", DEFAULT_CONTENT.red.quote), spec, {
        position: "absolute",
        left: 88,
        top: 150,
        width: 790,
        fontSize: 55,
        lineHeight: 1.13,
        textAlign: "center"
      }),
      bodyText(text2(spec, "cite", DEFAULT_CONTENT.red.cite), spec, {
        position: "absolute",
        left: 220,
        top: 386,
        width: 520,
        color: theme8.background,
        opacity: 0.84,
        fontSize: 14,
        lineHeight: 1.5,
        textAlign: "center"
      })
    ],
    { background: theme8.red, color: theme8.background, progress: 0.2 }
  );
}
function highlightCard(item, spec, index) {
  const theme8 = colors2(spec);
  return box(
    {
      width: 282,
      minHeight: 118,
      flexDirection: "column",
      borderWidth: 1.5,
      borderColor: theme8.text,
      padding: "17px 19px",
      backgroundColor: theme8.background
    },
    [
      metricText(String(item.value || item.num || `${index + 1}`), spec, { fontSize: 39, lineHeight: 1, marginBottom: 6 }),
      labelText(String(item.label || "Highlight"), spec, { color: theme8.text, fontSize: 9, marginBottom: 6 }),
      bodyText(String(item.body || item.description || ""), spec, { fontSize: 11, lineHeight: 1.45, opacity: 0.76 })
    ]
  );
}
function renderSummary(spec) {
  const theme8 = colors2(spec);
  const columns = arrayValue2(spec, "columns", DEFAULT_CONTENT.summary.columns).slice(0, 2);
  const highlights = objectArray(spec, ["highlights", "metrics"], DEFAULT_CONTENT.summary.highlights).slice(0, 3);
  return frame(
    spec,
    [
      displayText(text2(spec, "title", DEFAULT_CONTENT.summary.title), spec, {
        position: "absolute",
        left: 58,
        top: 58,
        width: 720,
        fontSize: 52,
        lineHeight: 1
      }),
      ...columns.map(
        (column, index) => bodyText(String(column), spec, {
          position: "absolute",
          left: index === 0 ? 60 : 500,
          top: 138,
          width: 398,
          color: theme8.text,
          fontSize: 13,
          lineHeight: 1.68,
          whiteSpace: "pre-wrap"
        })
      ),
      box(
        {
          position: "absolute",
          left: 60,
          bottom: 54,
          width: 846,
          flexDirection: "row",
          borderWidth: 2,
          borderColor: theme8.text
        },
        highlights.map((item, index) => highlightCard(item, spec, index))
      )
    ],
    { progress: 0.3 }
  );
}
function financialCell(item, spec, style = {}) {
  const theme8 = colors2(spec);
  return box(
    {
      width: 282,
      height: 130,
      flexDirection: "column",
      borderWidth: 1.5,
      borderColor: theme8.text,
      padding: "15px 17px",
      ...style
    },
    [
      metricText(String(item.value || item.num || ""), spec, { fontSize: 35, lineHeight: 1, marginBottom: 7 }),
      labelText(String(item.label || "Metric"), spec, { color: theme8.text, fontSize: 8.5, marginBottom: 7 }),
      bodyText(String(item.body || item.description || ""), spec, { fontSize: 10.5, lineHeight: 1.42, opacity: 0.8, marginBottom: 6 }),
      bodyText(String(item.micro || ""), spec, { fontSize: 9, lineHeight: 1.25, opacity: 0.55, marginTop: "auto" })
    ]
  );
}
function renderFinancial(spec) {
  const theme8 = colors2(spec);
  const cells = objectArray(spec, ["cells", "financial_cells", "metrics"], DEFAULT_CONTENT.financial.cells).slice(0, 6);
  const left = 56;
  const top = 132;
  const cellWidth = 282;
  const cellHeight = 130;
  return frame(
    spec,
    [
      displayText(text2(spec, "title", DEFAULT_CONTENT.financial.title), spec, {
        position: "absolute",
        left: 58,
        top: 48,
        width: 820,
        fontSize: 56,
        lineHeight: 1
      }),
      box({
        position: "absolute",
        left,
        top,
        width: cellWidth * 3 + 2,
        height: cellHeight * 2 + 2,
        borderWidth: 3,
        borderColor: theme8.text
      }),
      ...cells.map((item, index) => financialCell(item, spec, {
        position: "absolute",
        left: left + index % 3 * cellWidth,
        top: top + Math.floor(index / 3) * cellHeight
      }))
    ],
    { progress: 0.4 }
  );
}
function renderStat(spec) {
  const theme8 = colors2(spec);
  const items = objectArray(spec, ["items", "stat_items", "metrics"], DEFAULT_CONTENT.stat.items).slice(0, 3);
  return frame(
    spec,
    [
      metricText(text2(spec, "stat", text2(spec, "value", DEFAULT_CONTENT.stat.value)), spec, {
        position: "absolute",
        left: 188,
        top: 90,
        width: 585,
        color: theme8.red,
        fontSize: 170,
        lineHeight: 0.82,
        textAlign: "center",
        transform: "rotate(-6deg)"
      }),
      box(
        {
          position: "absolute",
          left: 235,
          top: 310,
          width: 490,
          flexDirection: "row",
          justifyContent: "space-between"
        },
        items.map(
          (item) => box({ width: 150, flexDirection: "column", alignItems: "center" }, [
            metricText(String(item.value || ""), spec, { color: theme8.text, fontSize: 40, lineHeight: 1, textAlign: "center" }),
            labelText(String(item.label || ""), spec, { color: theme8.text, fontSize: 9, textAlign: "center", marginTop: 5 })
          ])
        )
      ),
      bodyText(text2(spec, "context", DEFAULT_CONTENT.stat.context), spec, {
        position: "absolute",
        left: 250,
        top: 405,
        width: 460,
        fontSize: 13,
        lineHeight: 1.55,
        textAlign: "center",
        opacity: 0.7
      })
    ],
    { progress: 0.5 }
  );
}
function bulletList2(items, spec, { color = null, bullet = "bullet", fontSize = 9.5 } = {}) {
  const theme8 = colors2(spec);
  return box({ width: "100%", flexDirection: "column" }, items.slice(0, 4).map(
    (item) => box({ width: "100%", flexDirection: "row", marginBottom: 4 }, [
      TextBlock(bullet === "dash" ? "-" : "\u2022", { width: 11, color: theme8.red, fontSize, lineHeight: 1.35, ...fontRole("label", spec, { fontWeight: 700 }) }),
      bodyText(String(item), spec, { flex: 1, color: color || theme8.text, fontSize, lineHeight: 1.35, opacity: 0.72 })
    ])
  ));
}
function serviceCard(item, spec) {
  const theme8 = colors2(spec);
  return box(
    {
      width: 424,
      minHeight: 143,
      flexDirection: "column",
      borderLeftWidth: 4,
      borderLeftColor: theme8.red,
      paddingLeft: 18
    },
    [
      displayText(String(item.title || ""), spec, { fontSize: 30, lineHeight: 1.08, marginBottom: 8 }),
      bodyText(String(item.body || ""), spec, { fontSize: 12, lineHeight: 1.48, opacity: 0.8, marginBottom: 9 }),
      bulletList2(Array.isArray(item.bullets) ? item.bullets : [], spec, { fontSize: 9 })
    ]
  );
}
function renderServices(spec) {
  const cards = objectArray(spec, ["cards", "service_cards", "items"], DEFAULT_CONTENT.services.cards).slice(0, 4);
  const positions = [
    { left: 64, top: 128 },
    { left: 506, top: 128 },
    { left: 64, top: 314 },
    { left: 506, top: 314 }
  ];
  return frame(
    spec,
    [
      displayText(text2(spec, "title", DEFAULT_CONTENT.services.title), spec, {
        position: "absolute",
        left: 58,
        top: 50,
        width: 760,
        fontSize: 52,
        lineHeight: 1
      }),
      ...cards.map((item, index) => box(
        {
          position: "absolute",
          left: positions[index].left,
          top: positions[index].top,
          width: 424,
          height: 154
        },
        [serviceCard(item, spec)]
      ))
    ],
    { progress: 0.6 }
  );
}
function roadmapPhase(item, spec) {
  const theme8 = colors2(spec);
  return box(
    {
      width: 408,
      minHeight: 182,
      flexDirection: "column",
      borderLeftWidth: 3,
      borderLeftColor: theme8.red,
      paddingLeft: 16
    },
    [
      labelText(String(item.label || ""), spec, { color: theme8.red, fontSize: 8.5, letterSpacing: 3, marginBottom: 6 }),
      displayText(String(item.title || ""), spec, { color: theme8.background, fontSize: 28, lineHeight: 1.1, marginBottom: 8 }),
      bodyText(String(item.body || ""), spec, { color: theme8.background, fontSize: 11, lineHeight: 1.48, opacity: 0.66, marginBottom: 8 }),
      bulletList2(Array.isArray(item.bullets) ? item.bullets : [], spec, { color: theme8.background, fontSize: 8.6 })
    ]
  );
}
function renderRoadmap(spec) {
  const theme8 = colors2(spec);
  const phases = objectArray(spec, ["phases", "roadmap_phases", "timeline", "items"], DEFAULT_CONTENT.roadmap.phases).slice(0, 4);
  return frame(
    spec,
    [
      box(
        {
          position: "absolute",
          left: 52,
          top: 48,
          width: 860,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 31
        },
        phases.map((item) => roadmapPhase(item, spec))
      )
    ],
    { background: theme8.text, color: theme8.background, progress: 0.7 }
  );
}
function pillar(item, spec, index) {
  const theme8 = colors2(spec);
  return box(
    {
      width: index === 1 ? 304 : 303,
      height: 430,
      flexDirection: "column",
      alignItems: "flex-start",
      backgroundColor: index % 2 === 0 ? theme8.paper : theme8.background,
      borderRightWidth: index === 2 ? 0 : 3,
      borderRightColor: theme8.text,
      padding: "30px 24px"
    },
    [
      metricText(String(item.number || String(index + 1).padStart(2, "0")), spec, { fontSize: 52, lineHeight: 1, marginBottom: 9 }),
      displayText(String(item.title || ""), spec, { fontSize: 25, lineHeight: 1.1, marginBottom: 11 }),
      bodyText(String(item.lead || item.body || ""), spec, { fontSize: 11, lineHeight: 1.42, marginBottom: 10 }),
      box({ width: "100%", flexDirection: "column" }, (Array.isArray(item.bullets) ? item.bullets : []).slice(0, 6).map(
        (bullet) => bodyText(String(bullet), spec, {
          width: "100%",
          fontSize: 8.8,
          lineHeight: 1.28,
          opacity: 0.75,
          padding: "4px 0",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(28,20,16,0.08)"
        })
      ))
    ]
  );
}
function renderPillars(spec) {
  const pillars = objectArray(spec, ["pillars_full", "pillars", "items"], DEFAULT_CONTENT.pillars.pillars).slice(0, 3);
  return frame(
    spec,
    [
      box(
        {
          position: "absolute",
          left: 25,
          top: 58,
          width: 910,
          height: 430,
          flexDirection: "row"
        },
        pillars.map((item, index) => pillar(item, spec, index))
      )
    ],
    { progress: 0.8 }
  );
}
function globalCard(item, spec) {
  const theme8 = colors2(spec);
  const stats2 = Array.isArray(item.stats) ? item.stats : [];
  return box(
    {
      width: 406,
      height: 148,
      flexDirection: "column",
      borderWidth: 2,
      borderColor: theme8.text,
      padding: 18,
      overflow: "hidden"
    },
    [
      labelText(String(item.label || ""), spec, { marginBottom: 7 }),
      displayText(String(item.title || ""), spec, { fontSize: 27, lineHeight: 1.05, marginBottom: 7 }),
      bodyText(String(item.body || ""), spec, { fontSize: 10.5, lineHeight: 1.35, opacity: 0.8 }),
      box({ flexDirection: "row", gap: 18, marginTop: 9 }, stats2.slice(0, 2).map(
        (stat) => box({ width: 90, flexDirection: "column" }, [
          metricText(String(stat.value || ""), spec, { fontSize: 22, lineHeight: 1 }),
          labelText(String(stat.label || ""), spec, { color: theme8.text, fontSize: 7.5, letterSpacing: 1 })
        ])
      ))
    ]
  );
}
function renderGlobal(spec) {
  const cards = objectArray(spec, ["cards", "global_cards", "items"], DEFAULT_CONTENT.global.cards).slice(0, 4);
  return frame(
    spec,
    [
      displayText(text2(spec, "title", DEFAULT_CONTENT.global.title), spec, {
        position: "absolute",
        left: 62,
        top: 42,
        width: 760,
        fontSize: 48,
        lineHeight: 1
      }),
      box(
        {
          position: "absolute",
          left: 64,
          top: 118,
          width: 842,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 26
        },
        cards.map((item) => globalCard(item, spec))
      )
    ],
    { progress: 0.9 }
  );
}
function renderClose(spec) {
  const theme8 = colors2(spec);
  const links = arrayValue2(spec, "links", DEFAULT_CONTENT.close.links).slice(0, 3);
  return frame(
    spec,
    [
      metricText(text2(spec, "title", DEFAULT_CONTENT.close.title), spec, {
        position: "absolute",
        left: 132,
        top: 112,
        width: 700,
        fontSize: 118,
        lineHeight: 0.88,
        textAlign: "center",
        transform: "rotate(-5deg)"
      }),
      bodyText(text2(spec, "subtitle", DEFAULT_CONTENT.close.subtitle), spec, {
        position: "absolute",
        left: 250,
        top: 352,
        width: 460,
        fontSize: 13,
        lineHeight: 1.5,
        textAlign: "center",
        whiteSpace: "pre-wrap"
      }),
      box(
        {
          position: "absolute",
          left: 300,
          top: 432,
          width: 360,
          flexDirection: "row",
          justifyContent: "space-between"
        },
        links.map(
          (link) => box({ flexDirection: "column", alignItems: "center" }, [
            labelText(String(link), spec, { color: theme8.text, fontSize: 9, letterSpacing: 2 }),
            box({ width: 56, height: 2, marginTop: 5, backgroundColor: theme8.red })
          ])
        )
      )
    ],
    { progress: 1 }
  );
}
function renderPosterStatPunch(spec) {
  const variant = normalizeVariant2(spec);
  const renderers = {
    hero: renderHero,
    red: renderRed,
    summary: renderSummary,
    financial: renderFinancial,
    stat: renderStat,
    services: renderServices,
    roadmap: renderRoadmap,
    pillars: renderPillars,
    global: renderGlobal,
    close: renderClose
  };
  return (renderers[variant] || renderHero)(spec);
}

// templates/beautiful/coral-magazine-feature.mjs
var templateId4 = "coral-magazine-feature";
var PAGE_VARIANTS3 = [
  "cover",
  "agenda",
  "detail",
  "data_dashboard",
  "process_or_timeline",
  "data_dashboard-6",
  "quote_or_emphasis",
  "process_or_timeline-8",
  "detail-9",
  "closing"
];
var rendererContract4 = {
  template_id: templateId4,
  renderer_id: `artboard_satori.${templateId4}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "coral",
  implemented_page_variants: PAGE_VARIANTS3,
  page_family: {
    family_id: "coral",
    supported_page_variants: PAGE_VARIANTS3,
    variant_usage_policy: {
      singletons: ["cover", "closing"],
      repeatable: PAGE_VARIANTS3.filter((variant) => !["cover", "closing"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/coral-1.png"
};
var CANVAS2 = { width: 960, height: 540 };
var DEFAULTS2 = {
  cover: {
    eyebrow: "VENTURE",
    title: "QUARTERLY\nSTRATEGY\nSESSION 2026",
    location_label: "Location",
    location: "7TH FLOOR",
    date: "May 15 / 09:00 Start",
    year: "2026"
  },
  agenda: {
    eyebrow: "01 / Overview",
    title: "REDEFINING THE BOUNDARIES OF WHAT IS POSSIBLE",
    body: "We bring together diverse perspectives and bold ideas to create meaningful impact. Our approach combines strategic thinking with creative execution, ensuring every initiative delivers measurable results and lasting value."
  },
  detail: {
    number: "03",
    title: "CORE\nPILLARS",
    items: [
      { label: "Innovation", body: "Pushing boundaries with cutting-edge solutions and forward-thinking methodologies." },
      { label: "Collaboration", body: "Building strong partnerships across teams, disciplines, and industries." },
      { label: "Execution", body: "Delivering results with precision, speed, and uncompromising quality." }
    ]
  },
  data_dashboard: {
    eyebrow: "02 / Performance",
    title: "GROWTH METRICS",
    stat: "+147%",
    stat_label: "Year Over Year",
    bars: [
      { label: "Awareness", value: 72 },
      { label: "Engagement", value: 84 },
      { label: "Retention", value: 58 },
      { label: "Referral", value: 91 },
      { label: "Conversion", value: 64 }
    ],
    metrics: [
      { value: "2.4M", label: "Total Reach" },
      { value: "89%", label: "Retention Rate" },
      { value: "156", label: "New Partners" }
    ]
  },
  process_or_timeline: {
    title: "IMPACT",
    bar_title: "GLOBAL INITIATIVE 2026",
    bar_meta: "Phase One / Launch Q2\n12 Cities / 4 Continents"
  },
  "data_dashboard-6": {
    title: "KEY OBJECTIVES",
    subtitle: "Strategic priorities for the upcoming fiscal period",
    cards: [
      { mark: "A", title: "EXPAND REACH", body: "Enter new markets and establish presence in emerging territories through targeted campaigns.", stat: "24" },
      { mark: "B", title: "DEEPEN ENGAGEMENT", body: "Strengthen relationships with existing partners through enhanced service offerings.", stat: "+45%" },
      { mark: "C", title: "OPTIMIZE FLOW", body: "Streamline internal processes to improve delivery times and resource allocation.", stat: "3.2x" }
    ]
  },
  quote_or_emphasis: {
    title: "FUTURE BY DESIGN",
    quote: "The best way to predict the future is to create it with intention, precision, and the courage to challenge convention.",
    author: "Alexandra Chen",
    role: "Chief Strategy Officer"
  },
  "process_or_timeline-8": {
    eyebrow: "03 / Roadmap",
    title: "PROJECT TIMELINE",
    steps: [
      { phase: "Q1", title: "Discovery", body: "Research and planning phase with stakeholder alignment." },
      { phase: "Q2", title: "Design", body: "Concept development and prototype validation." },
      { phase: "Q3", title: "Build", body: "Full implementation and iterative refinement." },
      { phase: "Q4", title: "Launch", body: "Market release and performance monitoring." },
      { phase: "+", title: "Scale", body: "Expansion and long-term optimization." }
    ]
  },
  "detail-9": {
    title: "LEADERSHIP",
    subtitle: "The people driving our vision forward",
    people: [
      { initials: "JD", name: "Jordan Davis", role: "Chief Executive" },
      { initials: "MK", name: "Morgan Kim", role: "Head of Product" },
      { initials: "SR", name: "Sam Rivera", role: "Creative Director" },
      { initials: "TW", name: "Taylor Wong", role: "Operations Lead" }
    ]
  },
  closing: {
    title: "THANK\nYOU",
    subtitle: "Let's build something extraordinary together. Reach out to start the conversation.",
    contacts: [
      { label: "Email", value: "HELLO@VENTURE.IO" },
      { label: "Phone", value: "+1 (555) 014-2298" },
      { label: "Office", value: "SEATTLE, WA" }
    ],
    socials: ["IN", "X", "DR"]
  }
};
function colors3(spec) {
  const source = spec.theme?.colors || {};
  return {
    coral: source.primary || "#E85D5D",
    coralDark: source.accent || "#D44A4A",
    cream: source.background || "#F5F0E8",
    creamDark: source.panel || "#E8E0D4",
    ink: source.text || "#1A1A1A",
    gray: source.muted || "#6B6B6B",
    lightGray: "#B0B0B0",
    white: "#FFFFFF"
  };
}
function role3(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray2(spec, key, fallback2 = []) {
  return array(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function content2(spec, variant) {
  return DEFAULTS2[variant] || DEFAULTS2.cover;
}
function normalizeVariant3(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS3.length) return PAGE_VARIANTS3[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS3) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("closing") || raw.includes("cta")) return "closing";
  if (raw.includes("quote")) return "quote_or_emphasis";
  if (raw.includes("timeline") || raw.includes("process") || raw.includes("roadmap")) return "process_or_timeline-8";
  if (raw.includes("data") || raw.includes("metric") || raw.includes("chart")) return "data_dashboard";
  if (raw.includes("compare") || raw.includes("team")) return "detail-9";
  if (raw.includes("agenda") || raw.includes("overview")) return "agenda";
  return "detail";
}
function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS3.indexOf(variant) + 1;
}
function displayText2(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    fontSize: 58,
    lineHeight: 0.92,
    letterSpacing: 2,
    ...role3("display", spec, { fontSize: 58, lineHeight: 0.92, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }),
    ...style
  });
}
function labelText2(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 3,
    ...role3("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }),
    ...style
  });
}
function bodyText2(value15, spec, style = {}) {
  return TextBlock(value15, {
    fontSize: 15,
    lineHeight: 1.45,
    ...role3("body", spec, { fontSize: 15, lineHeight: 1.45, fontWeight: 400 }),
    ...style
  });
}
function metricText2(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 44,
    lineHeight: 1,
    ...role3("metric", spec, { fontSize: 44, lineHeight: 1, fontWeight: 900, textTransform: "uppercase" }),
    ...style
  });
}
function coralChevrons(theme8, opacity = 0.18) {
  const shapes = [];
  for (let index = -2; index < 8; index += 1) {
    const left = index * 145 + 16;
    shapes.push(box({ position: "absolute", left, top: -18, width: 18, height: 230, backgroundColor: theme8.ink, opacity, transform: "rotate(27deg)" }));
    shapes.push(box({ position: "absolute", left: left + 62, top: -18, width: 18, height: 230, backgroundColor: theme8.ink, opacity: opacity * 0.72, transform: "rotate(-27deg)" }));
  }
  return shapes;
}
function diagonalHatch(theme8, opts = {}) {
  const shapes = [];
  const color = opts.color || theme8.ink;
  for (let index = 0; index < 14; index += 1) {
    shapes.push(box({
      position: "absolute",
      left: index * 62,
      top: 0,
      width: opts.width || 12,
      height: opts.height || 540,
      backgroundColor: color,
      opacity: opts.opacity || 0.07,
      transform: `rotate(${opts.angle || 45}deg)`
    }));
  }
  return shapes;
}
function slideCounter(spec, variant, color, dark = false) {
  const page18 = String(variantPage(spec, variant)).padStart(2, "0");
  return TextBlock(`${page18} / 10`, {
    position: "absolute",
    right: 26,
    bottom: 18,
    width: 58,
    color,
    opacity: dark ? 0.55 : 0.82,
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1,
    ...role3("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.4 })
  });
}
function frame2(spec, variant, style, children = []) {
  const theme8 = colors3(spec);
  return box(
    {
      width: CANVAS2.width,
      height: CANVAS2.height,
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme8.cream,
      color: theme8.ink,
      ...style
    },
    children
  );
}
function renderCover3(spec) {
  const theme8 = colors3(spec);
  const variant = "cover";
  const defaults = content2(spec, variant);
  const rawTitle = value(spec, "title", defaults.title).toUpperCase();
  const titleLines3 = rawTitle.includes("\n") ? rawTitle.split(/\n+/).filter(Boolean).slice(0, 3) : [rawTitle.split(/\s+/).slice(0, 1).join(" "), rawTitle.split(/\s+/).slice(1, 2).join(" "), rawTitle.split(/\s+/).slice(2).join(" ")].filter(Boolean);
  return frame2(spec, variant, {}, [
    box({ position: "absolute", left: 0, top: 0, width: 960, height: 172, backgroundColor: theme8.coral, overflow: "hidden" }, coralChevrons(theme8, 0.18)),
    labelText2(value(spec, "eyebrow", defaults.eyebrow), spec, { position: "absolute", left: 62, top: 36, color: theme8.ink, opacity: 0.72 }),
    ...titleLines3.map(
      (line2, index) => displayText2(line2, spec, {
        position: "absolute",
        left: 62,
        top: 212 + index * 49,
        width: 720,
        color: theme8.ink,
        fontSize: 56,
        lineHeight: 0.9,
        letterSpacing: 3.2,
        whiteSpace: "nowrap"
      })
    ),
    box({ position: "absolute", left: 62, top: 382, width: 830, height: 3, backgroundColor: theme8.ink, opacity: 0.15 }),
    labelText2(value(spec, "location_label", defaults.location_label), spec, { position: "absolute", left: 62, bottom: 66, color: theme8.gray, letterSpacing: 2.5 }),
    metricText2(value(spec, "location", defaults.location), spec, { position: "absolute", left: 62, bottom: 35, color: theme8.ink, fontSize: 26, letterSpacing: 2 }),
    labelText2(value(spec, "date", defaults.date), spec, { position: "absolute", right: 62, bottom: 69, width: 280, textAlign: "right", color: theme8.gray, letterSpacing: 2 }),
    metricText2(value(spec, "year", defaults.year), spec, { position: "absolute", right: 62, bottom: 34, width: 90, textAlign: "right", color: theme8.ink, fontSize: 26, letterSpacing: 1.8 }),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderAgenda2(spec) {
  const theme8 = colors3(spec);
  const variant = "agenda";
  const defaults = content2(spec, variant);
  return frame2(spec, variant, { backgroundColor: theme8.cream }, [
    labelText2(value(spec, "eyebrow", defaults.eyebrow), spec, { position: "absolute", left: 76, top: 70, color: theme8.coral }),
    displayText2(value(spec, "title", defaults.title), spec, {
      position: "absolute",
      left: 76,
      top: 120,
      width: 770,
      color: theme8.ink,
      fontSize: 62,
      lineHeight: 0.98,
      letterSpacing: 2
    }),
    bodyText2(value(spec, "body", defaults.body), spec, {
      position: "absolute",
      left: 76,
      top: 352,
      width: 610,
      color: theme8.gray,
      fontSize: 17,
      lineHeight: 1.7
    }),
    box({ position: "absolute", left: 76, bottom: 68, width: 80, height: 4, backgroundColor: theme8.coral }),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderDetail2(spec) {
  const theme8 = colors3(spec);
  const variant = "detail";
  const defaults = content2(spec, variant);
  const items = objectArray2(spec, "items", defaults.items).slice(0, 3);
  return frame2(spec, variant, { backgroundColor: theme8.ink }, [
    box({ position: "absolute", left: 0, top: 0, width: 480, height: 540, backgroundColor: theme8.coral, overflow: "hidden" }, [
      ...diagonalHatch(theme8),
      metricText2(value(spec, "number", defaults.number), spec, { position: "absolute", left: 54, top: 54, color: theme8.ink, opacity: 0.14, fontSize: 142, lineHeight: 1 }),
      displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 58, bottom: 72, width: 330, color: theme8.ink, fontSize: 58, lineHeight: 0.96, letterSpacing: 2 })
    ]),
    ...items.map(
      (item, index) => box({ position: "absolute", left: 548, top: 116 + index * 112, width: 318, minHeight: 76, flexDirection: "column" }, [
        labelText2(item.label, spec, { color: theme8.coral, marginBottom: 10, letterSpacing: 2.2 }),
        bodyText2(item.body, spec, { color: theme8.cream, fontSize: 16, lineHeight: 1.45 })
      ])
    ),
    slideCounter(spec, variant, theme8.cream)
  ]);
}
function renderDataDashboard(spec) {
  const theme8 = colors3(spec);
  const variant = "data_dashboard";
  const defaults = content2(spec, variant);
  const bars = objectArray2(spec, "bars", defaults.bars).slice(0, 5);
  const metrics = objectArray2(spec, "metrics", defaults.metrics).slice(0, 3);
  return frame2(spec, variant, { backgroundColor: theme8.cream }, [
    labelText2(value(spec, "eyebrow", defaults.eyebrow), spec, { position: "absolute", left: 70, top: 64, color: theme8.coral }),
    displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 70, top: 98, width: 470, color: theme8.ink, fontSize: 58, lineHeight: 0.98 }),
    metricText2(value(spec, "stat", defaults.stat), spec, { position: "absolute", right: 76, top: 72, width: 180, color: theme8.coral, textAlign: "right", fontSize: 72 }),
    labelText2(value(spec, "stat_label", defaults.stat_label), spec, { position: "absolute", right: 78, top: 150, width: 180, color: theme8.gray, textAlign: "right", letterSpacing: 2 }),
    box(
      { position: "absolute", left: 70, top: 220, width: 570, height: 230, flexDirection: "column", gap: 15 },
      bars.map(
        (bar) => box({ width: 570, height: 30, flexDirection: "row", alignItems: "center", gap: 16 }, [
          labelText2(bar.label, spec, { width: 120, color: theme8.ink, letterSpacing: 1.2, fontSize: 8 }),
          box({ width: 370, height: 18, backgroundColor: theme8.creamDark }, [
            box({ width: Math.max(32, Math.min(100, Number(bar.value) || 0)) * 3.7, height: 18, backgroundColor: theme8.coral })
          ]),
          metricText2(String(bar.value), spec, { width: 40, color: theme8.coral, fontSize: 20, textAlign: "right" })
        ])
      )
    ),
    ...metrics.map(
      (metric19, index) => box({ position: "absolute", right: 74, top: 226 + index * 74, width: 190, height: 54, backgroundColor: theme8.white, borderLeft: `4px solid ${theme8.coral}`, padding: "9px 14px", flexDirection: "column" }, [
        metricText2(metric19.value, spec, { color: theme8.ink, fontSize: 28 }),
        bodyText2(metric19.label, spec, { color: theme8.gray, fontSize: 11, lineHeight: 1.2 })
      ])
    ),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderFeature(spec) {
  const theme8 = colors3(spec);
  const variant = "process_or_timeline";
  const defaults = content2(spec, variant);
  return frame2(spec, variant, { backgroundColor: theme8.ink }, [
    box({ position: "absolute", left: 0, top: 0, width: 960, height: 404, backgroundColor: theme8.coral, overflow: "hidden" }, [
      ...Array.from({ length: 14 }).map(
        (_, index) => box({ position: "absolute", left: index * 72, top: 0, width: 2, height: 404, backgroundColor: theme8.ink, opacity: 0.1 })
      ),
      displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 128, top: 138, width: 720, color: theme8.ink, textAlign: "center", fontSize: 138, letterSpacing: 9, lineHeight: 1 })
    ]),
    box({ position: "absolute", left: 0, bottom: 0, width: 960, height: 136, backgroundColor: theme8.cream }),
    displayText2(value(spec, "bar_title", defaults.bar_title), spec, { position: "absolute", left: 76, bottom: 48, width: 500, color: theme8.ink, fontSize: 35, lineHeight: 1, letterSpacing: 1.6, whiteSpace: "nowrap" }),
    bodyText2(value(spec, "bar_meta", defaults.bar_meta), spec, { position: "absolute", right: 54, bottom: 46, width: 220, color: theme8.gray, textAlign: "right", fontSize: 13, lineHeight: 1.45, letterSpacing: 1.6, textTransform: "uppercase" }),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderCards(spec) {
  const theme8 = colors3(spec);
  const variant = "data_dashboard-6";
  const defaults = content2(spec, variant);
  const cards = objectArray2(spec, "cards", defaults.cards).slice(0, 3);
  return frame2(spec, variant, { backgroundColor: theme8.cream }, [
    displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 70, top: 64, width: 600, color: theme8.ink, fontSize: 58, lineHeight: 1 }),
    bodyText2(value(spec, "subtitle", defaults.subtitle), spec, { position: "absolute", left: 72, top: 132, width: 520, color: theme8.gray, fontSize: 14, letterSpacing: 1.8 }),
    ...cards.map(
      (card2, index) => box({ position: "absolute", left: 70 + index * 286, top: 208, width: 250, height: 244, backgroundColor: theme8.white, borderTop: `5px solid ${theme8.coral}`, padding: 0, flexDirection: "column" }, [
        box({ position: "absolute", left: 24, top: 22, width: 46, height: 46, backgroundColor: theme8.coral, alignItems: "center", justifyContent: "center" }, [
          metricText2(card2.mark, spec, { color: theme8.white, fontSize: 24, textAlign: "center" })
        ]),
        displayText2(card2.title, spec, { position: "absolute", left: 24, top: 84, width: 190, color: theme8.ink, fontSize: 25, lineHeight: 1.02, letterSpacing: 1.1 }),
        bodyText2(card2.body, spec, { position: "absolute", left: 24, top: 142, width: 190, height: 54, color: theme8.gray, fontSize: 10.5, lineHeight: 1.3 }),
        metricText2(card2.stat, spec, { position: "absolute", left: 24, bottom: 16, width: 120, color: theme8.coral, fontSize: 30 })
      ])
    ),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderQuote3(spec) {
  const theme8 = colors3(spec);
  const variant = "quote_or_emphasis";
  const defaults = content2(spec, variant);
  return frame2(spec, variant, { backgroundColor: theme8.ink }, [
    box({ position: "absolute", left: 0, top: 0, width: 384, height: 540, backgroundColor: theme8.coral, overflow: "hidden", alignItems: "center", justifyContent: "center" }, [
      ...diagonalHatch(theme8, { angle: -45, opacity: 0.06, width: 14 }),
      metricText2('"', spec, { color: theme8.ink, opacity: 0.35, fontSize: 235, lineHeight: 1 })
    ]),
    box({ position: "absolute", left: 456, top: 120, width: 400, height: 4, backgroundColor: theme8.coral }),
    bodyText2(value(spec, "quote", defaults.quote), spec, { position: "absolute", left: 456, top: 164, width: 400, color: theme8.cream, fontSize: 28, lineHeight: 1.44, fontWeight: 300 }),
    labelText2(value(spec, "author", defaults.author), spec, { position: "absolute", left: 456, bottom: 122, width: 320, color: theme8.coral, letterSpacing: 2.4 }),
    bodyText2(value(spec, "role", defaults.role), spec, { position: "absolute", left: 456, bottom: 96, width: 320, color: theme8.gray, fontSize: 13, letterSpacing: 1 }),
    slideCounter(spec, variant, theme8.cream)
  ]);
}
function renderTimeline2(spec) {
  const theme8 = colors3(spec);
  const variant = "process_or_timeline-8";
  const defaults = content2(spec, variant);
  const steps = objectArray2(spec, "steps", defaults.steps).slice(0, 5);
  return frame2(spec, variant, { backgroundColor: theme8.cream }, [
    labelText2(value(spec, "eyebrow", defaults.eyebrow), spec, { position: "absolute", left: 70, top: 60, color: theme8.coral }),
    displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 70, top: 96, width: 560, color: theme8.ink, fontSize: 58, lineHeight: 1 }),
    box({ position: "absolute", left: 82, top: 302, width: 796, height: 4, backgroundColor: theme8.ink }),
    ...steps.map((step, index) => {
      const x = 86 + index * 196;
      const even = index % 2 === 1;
      return box({ position: "absolute", left: x - 48, top: even ? 225 : 286, width: 118, minHeight: 150, flexDirection: "column", alignItems: "center" }, [
        even ? box({ width: 112, minHeight: 58, marginBottom: 16, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
          labelText2(step.title, spec, { color: theme8.coral, textAlign: "center", letterSpacing: 1.4 }),
          bodyText2(step.body, spec, { color: theme8.gray, width: 112, textAlign: "center", fontSize: 10.5, lineHeight: 1.25, marginTop: 6 })
        ]) : null,
        box({ width: 70, height: 70, borderRadius: 35, backgroundColor: theme8.coral, border: `4px solid ${theme8.ink}`, alignItems: "center", justifyContent: "center" }, [
          metricText2(step.phase, spec, { color: theme8.white, fontSize: 25, textAlign: "center" })
        ]),
        !even ? box({ width: 112, minHeight: 64, marginTop: 16, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
          labelText2(step.title, spec, { color: theme8.coral, textAlign: "center", letterSpacing: 1.4 }),
          bodyText2(step.body, spec, { color: theme8.gray, width: 112, textAlign: "center", fontSize: 10.5, lineHeight: 1.25, marginTop: 6 })
        ]) : null
      ].filter(Boolean));
    }),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
function renderTeam(spec) {
  const theme8 = colors3(spec);
  const variant = "detail-9";
  const defaults = content2(spec, variant);
  const people = objectArray2(spec, "people", defaults.people).slice(0, 4);
  return frame2(spec, variant, { backgroundColor: theme8.ink }, [
    displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 70, top: 62, width: 620, color: theme8.cream, fontSize: 58 }),
    bodyText2(value(spec, "subtitle", defaults.subtitle), spec, { position: "absolute", left: 72, top: 132, width: 520, color: theme8.gray, fontSize: 14, letterSpacing: 1.8 }),
    ...people.map(
      (person, index) => box({ position: "absolute", left: 70 + index * 215, top: 214, width: 178, height: 210, border: `1px solid rgba(245,240,232,0.16)`, backgroundColor: "rgba(245,240,232,0.05)", padding: 22, alignItems: "center", flexDirection: "column" }, [
        box({ width: 76, height: 76, borderRadius: 38, backgroundColor: theme8.coral, alignItems: "center", justifyContent: "center", marginBottom: 22 }, [
          metricText2(person.initials, spec, { color: theme8.white, fontSize: 32, textAlign: "center" })
        ]),
        bodyText2(person.name, spec, { width: 130, textAlign: "center", color: theme8.cream, fontSize: 15, lineHeight: 1.2, fontWeight: 700 }),
        bodyText2(person.role, spec, { width: 130, textAlign: "center", color: theme8.gray, fontSize: 11, lineHeight: 1.25, letterSpacing: 1, marginTop: 8 })
      ])
    ),
    slideCounter(spec, variant, theme8.cream)
  ]);
}
function renderClosing2(spec) {
  const theme8 = colors3(spec);
  const variant = "closing";
  const defaults = content2(spec, variant);
  const contacts = objectArray2(spec, "contacts", defaults.contacts).slice(0, 3);
  const socials = array(spec, "socials", defaults.socials).slice(0, 3);
  return frame2(spec, variant, {}, [
    box({ position: "absolute", left: 0, top: 0, width: 528, height: 540, backgroundColor: theme8.coral, overflow: "hidden" }, [
      displayText2(value(spec, "title", defaults.title), spec, { position: "absolute", left: 70, top: 142, width: 360, color: theme8.ink, fontSize: 76, lineHeight: 0.95, letterSpacing: 3 }),
      bodyText2(value(spec, "subtitle", defaults.subtitle), spec, { position: "absolute", left: 72, top: 318, width: 330, color: "rgba(0,0,0,0.70)", fontSize: 16, lineHeight: 1.55 }),
      box({ position: "absolute", left: 0, bottom: 0, width: 528, height: 58, opacity: 0.18 }, coralChevrons(theme8, 0.5))
    ]),
    box({ position: "absolute", left: 528, top: 0, width: 432, height: 540, backgroundColor: theme8.cream }),
    ...contacts.map(
      (contact, index) => box({ position: "absolute", left: 594, top: 144 + index * 86, width: 288, minHeight: 58, flexDirection: "column" }, [
        labelText2(contact.label, spec, { color: theme8.gray, marginBottom: 10, letterSpacing: 2.5 }),
        metricText2(contact.value, spec, { color: theme8.ink, fontSize: 33, lineHeight: 1.05, letterSpacing: 1.8 })
      ])
    ),
    ...socials.map(
      (item, index) => box({ position: "absolute", left: 594 + index * 60, bottom: 86, width: 42, height: 42, border: `2px solid ${theme8.ink}`, alignItems: "center", justifyContent: "center" }, [
        labelText2(item, spec, { color: theme8.ink, textAlign: "center", letterSpacing: 0.5, fontSize: 10 })
      ])
    ),
    slideCounter(spec, variant, theme8.gray, true)
  ]);
}
var RENDERERS2 = {
  cover: renderCover3,
  agenda: renderAgenda2,
  detail: renderDetail2,
  data_dashboard: renderDataDashboard,
  process_or_timeline: renderFeature,
  "data_dashboard-6": renderCards,
  quote_or_emphasis: renderQuote3,
  "process_or_timeline-8": renderTimeline2,
  "detail-9": renderTeam,
  closing: renderClosing2
};
function renderCoralMagazineFeature(spec) {
  const variant = normalizeVariant3(spec);
  return (RENDERERS2[variant] || renderDetail2)(spec);
}

// templates/beautiful/soft-editorial-feature.mjs
var templateId5 = "soft-editorial-feature";
var PAGE_VARIANTS4 = [
  "cover",
  "foreword",
  "method",
  "insights",
  "closer",
  "numbers",
  "quote",
  "next",
  "consult",
  "chart",
  "process",
  "matrix"
];
var rendererContract5 = {
  template_id: templateId5,
  renderer_id: `artboard_satori.${templateId5}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "soft-editorial",
  implemented_page_variants: PAGE_VARIANTS4,
  page_family: {
    family_id: "soft-editorial",
    supported_page_variants: PAGE_VARIANTS4,
    variant_usage_policy: {
      singletons: ["cover", "foreword", "closer"],
      repeatable: ["method", "insights", "numbers", "quote", "next", "consult", "chart", "process", "matrix"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/soft-editorial-4.png"
};
var C = {
  paper: "#F2EEDF",
  paper2: "#ECE6D2",
  ink: "#2A241B",
  inkSoft: "#5C5345",
  pink: "#E1A4C2",
  lemon: "#D6DD63",
  blush: "#E8C9B6",
  sage: "#B7C7A8",
  lilac: "#C9BEDC",
  card: "rgba(255,255,255,0.55)",
  rule: "rgba(42,36,27,0.18)",
  ruleMedium: "rgba(42,36,27,0.35)"
};
var DEFAULTS3 = {
  cover: {
    eyebrow: "Field Notes",
    kicker: "A research debrief, vol. iii",
    title: "What we learned\nthis quarter.",
    subtitle: "A short, honest look at what customers told us between January and March - what works, what broke, and what to try next."
  },
  foreword: {
    eyebrow: "Foreword",
    opener: "We spent eight weeks listening, and what we heard surprised us in the kindest way.",
    paragraphs: [
      "The team ran twenty-eight long-form interviews, shadowed nine teams during their busiest week of the year, and sat with the support inbox for ten unbroken days.",
      "The brief asked about onboarding; the answers we got were about trust. So we followed the thread.",
      "This deck is the short version. Each insight is a door - open the ones that matter to your team this quarter."
    ],
    signoff: "- The research desk"
  },
  method: {
    eyebrow: "The Method",
    steps: [
      ["i.", "Listen", "Twenty-eight long-form conversations with customers across four segments and three regions."],
      ["ii.", "Watch", "Nine on-site shadowing sessions during peak workflows. We took notes, not video."],
      ["iii.", "Read", "Ten days inside the support inbox, tagging every message by intent and emotional tone."],
      ["iv.", "Distill", "Three rounds of thematic clustering with the design and policy teams."]
    ]
  },
  insights: {
    eyebrow: "Insights",
    cards: ["Trust is the onboarding", "Power users dread upgrades", "Support is product"],
    descriptions: [
      "Customers don't churn on day one because the product is hard. They churn because the first emails feel like a stranger.",
      "The people we asked to love new features the most quietly resent them. They want fewer surprises.",
      "Half of feature requests are existing features customers could not find. Discovery is the roadmap problem."
    ]
  },
  closer: {
    eyebrow: "A closer look - 1 of 3",
    marker: "on insight #1",
    title: "Trust is the onboarding.",
    body: "The product can be perfect on day one, but if the welcome email reads like a contract, half of new accounts will never log in twice."
  },
  numbers: {
    eyebrow: "By the numbers",
    hero: ["68%", "of new accounts open the third email, up from 41% last quarter."],
    stats: [
      ["28", "long-form customer interviews across four segments."],
      ["9", "teams shadowed for their busiest week of the year."]
    ]
  },
  quote: {
    eyebrow: "In their words",
    quote: "I did not need a better product. I needed it to behave like it remembered me.",
    name: "Renee, three-year customer",
    role: "Studio of seven, Lisbon"
  },
  next: {
    eyebrow: "What's Next",
    title: "What we'll do next",
    subtitle: "Three small moves, before the next debrief.",
    items: [
      ["i.", "Rewrite the first three emails", "From templated to written. Owner: lifecycle. By: May 17."],
      ["ii.", "Quiet upgrades by default", "Opt-in for power users; soft rollout for everyone else. By: June 1."],
      ["iii.", "Make the inbox a search bar", "Surface in-product help when requests match an existing feature."]
    ]
  },
  consult: {
    eyebrow: "Findings - Detail",
    action: "The trust gap is built in the first 72 hours.",
    columns: [
      ["What we found", "Three behavioral signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked."],
      ["Why it matters", "$4.1M in projected retained ARR, on the current cohort alone."],
      ["What to do", "Rewrite the first three lifecycle emails and measure reply rate, second-open rate, and D90 retention."]
    ],
    source: "Source: 14,200 cohorted accounts, Jan-Mar 2026."
  },
  chart: {
    eyebrow: "Retention Curve",
    title: "Retention, by cohort",
    subtitle: "The curve bends around day three.",
    series: ["Templated welcome", "Written welcome", "Written + human reply"]
  },
  process: {
    eyebrow: "Process",
    title: "How we'll work",
    subtitle: "From insight to shipped change.",
    steps: [
      ["i.", "Frame", "Translate the insight into a single behavioural hypothesis."],
      ["ii.", "Design", "Sketch the smallest end-to-end change."],
      ["iii.", "Pilot", "Ship to a 50/50 holdout in a single segment."],
      ["iv.", "Read", "Review the cohort against pre-registered metrics."],
      ["v.", "Default", "Graduate the change to the default surface."]
    ],
    timeline: ["Week 1", "Weeks 2-3", "Weeks 3-6", "Week 7", "Week 8"]
  },
  matrix: {
    eyebrow: "Comparison",
    title: "The three pilots, side by side",
    subtitle: "Where each pilot earns its keep.",
    headers: ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
    rows: [
      ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
      ["Build cost", "Low", "Medium", "Low"],
      ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
      ["Risk", "None", "Material", "Soft, reversible"]
    ]
  }
};
function normalizeVariant4(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS4.length) return PAGE_VARIANTS4[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS4) {
    if (raw.includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("agenda") || raw.includes("foreword")) return "foreword";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("process") || raw.includes("timeline")) return "process";
  if (raw.includes("comparison") || raw.includes("matrix")) return "matrix";
  if (raw.includes("closing")) return "closer";
  return "insights";
}
function content3(spec, variant) {
  return { ...DEFAULTS3[variant] || DEFAULTS3.insights, ...spec.content || {} };
}
function text3(value15, fallback2 = "") {
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function array2(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function serif2(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C.ink,
    fontSize: 42,
    lineHeight: 1.02,
    ...fontRole("display", spec, { fontWeight: 500, textTransform: "none" }),
    ...style
  });
}
function display(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: C.ink,
    fontSize: 88,
    lineHeight: 0.96,
    whiteSpace: "pre-wrap",
    ...fontRole("display", spec, { fontWeight: 500, lineHeight: 0.96, letterSpacing: -0.8, textTransform: "none" }),
    ...style
  });
}
function body2(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C.inkSoft,
    fontSize: 14,
    lineHeight: 1.48,
    ...fontRole("body", spec, { fontWeight: 400 }),
    ...style
  });
}
function label2(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C.ink,
    fontSize: 14,
    lineHeight: 1.1,
    ...fontRole("label", spec, { fontWeight: 400, textTransform: "none" }),
    ...style
  });
}
function metric2(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C.ink,
    fontSize: 58,
    lineHeight: 0.86,
    fontStyle: "italic",
    ...fontRole("metric", spec, { fontWeight: 500, fontStyle: "italic", lineHeight: 0.86, textTransform: "none" }),
    ...style
  });
}
function page2(spec, pageNo, children, { eyebrow = "Field Notes", bg = C.paper, footerColor = C.inkSoft, swatches = false } = {}) {
  return box({ width: 960, height: 540, position: "relative", overflow: "hidden", backgroundColor: bg }, [
    label2(eyebrow, spec, { position: "absolute", left: 40, top: 34, fontSize: 15, color: C.ink }),
    swatches ? box({ position: "absolute", right: 40, top: 40, flexDirection: "row", gap: 10 }, [C.pink, C.lemon, C.blush].map(
      (color) => box({ width: 28, height: 28, borderRadius: 14, backgroundColor: color }, [])
    )) : serif2(roman(pageNo), spec, { position: "absolute", right: 40, top: 31, width: 70, textAlign: "right", fontSize: 14, fontStyle: "italic", color: footerColor }),
    ...children,
    serif2("April 29, 2026", spec, { position: "absolute", left: 40, bottom: 28, fontSize: 15, fontStyle: "italic", color: footerColor }),
    serif2("Field Notes - Vol. III", spec, { position: "absolute", right: 40, bottom: 28, width: 180, textAlign: "right", fontSize: 15, fontStyle: "italic", color: footerColor })
  ]);
}
function roman(n) {
  return ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"][Math.max(0, Math.min(11, n - 1))];
}
function softCard(style = {}, children = []) {
  return box({ backgroundColor: C.card, borderRadius: 18, ...style }, children);
}
function pastelCard(color, style = {}, children = []) {
  return box({ backgroundColor: color, borderRadius: 18, ...style }, children);
}
function renderCover4(spec) {
  const c = content3(spec, "cover");
  return page2(spec, 1, [
    serif2(text3(c.kicker, DEFAULTS3.cover.kicker), spec, { position: "absolute", left: 40, top: 108, fontSize: 20, fontStyle: "italic", color: C.inkSoft }),
    display(text3(c.title, DEFAULTS3.cover.title), spec, { position: "absolute", left: 40, top: 150, width: 770, fontSize: 78, lineHeight: 0.95 }),
    body2(text3(c.subtitle, DEFAULTS3.cover.subtitle), spec, { position: "absolute", left: 42, top: 398, width: 570, fontSize: 16, lineHeight: 1.45, color: C.inkSoft })
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.cover.eyebrow), swatches: true });
}
function renderForeword(spec) {
  const c = content3(spec, "foreword");
  const paragraphs = array2(c.paragraphs, DEFAULTS3.foreword.paragraphs);
  return page2(spec, 2, [
    box({ position: "absolute", left: 56, top: 112, width: 372, flexDirection: "column" }, [
      serif2(text3(c.opener, DEFAULTS3.foreword.opener), spec, { fontSize: 35, lineHeight: 1.13, fontStyle: "italic" }),
      serif2(text3(c.signoff, DEFAULTS3.foreword.signoff), spec, { marginTop: 34, fontSize: 20, fontStyle: "italic", color: C.inkSoft })
    ]),
    softCard(
      { position: "absolute", right: 56, top: 104, width: 410, height: 330, padding: "30px 34px", flexDirection: "column", gap: 18 },
      paragraphs.slice(0, 3).map((item, index) => body2(item, spec, { color: index === 0 ? C.ink : C.inkSoft, fontSize: 14.4, lineHeight: 1.55 }))
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.foreword.eyebrow) });
}
function renderMethod(spec) {
  const c = content3(spec, "method");
  const steps = array2(c.steps, DEFAULTS3.method.steps);
  const colors24 = [C.pink, C.lemon, C.blush, C.sage];
  return page2(spec, 3, [
    box(
      { position: "absolute", left: 56, top: 100, width: 848, flexDirection: "row", flexWrap: "wrap", gap: 18 },
      steps.slice(0, 4).map(
        (step, index) => pastelCard(colors24[index], { width: 415, height: 152, padding: "24px 28px", flexDirection: "column" }, [
          serif2(step[0], spec, { fontSize: 48, fontStyle: "italic", lineHeight: 0.9 }),
          serif2(step[1], spec, { fontSize: 25, marginTop: 8 }),
          body2(step[2], spec, { fontSize: 12.8, lineHeight: 1.35, marginTop: 8, color: C.inkSoft })
        ])
      )
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.method.eyebrow) });
}
function renderInsights(spec) {
  const c = content3(spec, "insights");
  const cards = array2(c.cards, DEFAULTS3.insights.cards);
  const descriptions = array2(c.descriptions, DEFAULTS3.insights.descriptions);
  const colors24 = [C.pink, C.lemon, C.blush];
  return page2(spec, 4, [
    box(
      { position: "absolute", left: 40, top: 100, width: 880, flexDirection: "row", gap: 18 },
      cards.slice(0, 3).map(
        (item, index) => pastelCard(colors24[index], { width: 281, height: 340, padding: "34px 32px", alignItems: "center", flexDirection: "column" }, [
          serif2(`Insight #${index + 1}`, spec, { fontSize: 35, textAlign: "center" }),
          body2(item, spec, { marginTop: 14, fontSize: 15.5, fontWeight: 700, color: C.ink, textAlign: "center", lineHeight: 1.2 }),
          body2(descriptions[index], spec, { marginTop: 20, fontSize: 12.7, lineHeight: 1.42, textAlign: "center", color: C.inkSoft })
        ])
      )
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.insights.eyebrow) });
}
function renderCloser(spec) {
  const c = content3(spec, "closer");
  return page2(spec, 5, [
    box({ position: "absolute", left: 148, top: 136, width: 664, alignItems: "center", flexDirection: "column" }, [
      serif2(text3(c.marker, DEFAULTS3.closer.marker), spec, { fontSize: 23, fontStyle: "italic" }),
      display(text3(c.title, DEFAULTS3.closer.title), spec, { marginTop: 16, width: 620, fontSize: 71, textAlign: "center", lineHeight: 0.95 }),
      body2(text3(c.body, DEFAULTS3.closer.body), spec, { marginTop: 24, width: 520, textAlign: "center", fontSize: 16, lineHeight: 1.45, color: C.ink })
    ])
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.closer.eyebrow), bg: C.pink, footerColor: "rgba(42,36,27,.72)" });
}
function renderNumbers(spec) {
  const c = content3(spec, "numbers");
  const hero = array2(c.hero, DEFAULTS3.numbers.hero);
  const stats2 = array2(c.stats, DEFAULTS3.numbers.stats);
  return page2(spec, 6, [
    pastelCard(C.lemon, { position: "absolute", left: 56, top: 112, width: 520, height: 292, padding: "28px 34px", flexDirection: "column" }, [
      metric2(hero[0], spec, { fontSize: 112, lineHeight: 0.82 }),
      body2(hero[1], spec, { marginTop: 18, width: 390, fontSize: 16, lineHeight: 1.38, color: C.ink })
    ]),
    ...stats2.slice(0, 2).map(
      (item, index) => pastelCard(index === 0 ? C.pink : C.blush, { position: "absolute", right: 56, top: 112 + index * 154, width: 286, height: 138, padding: "24px 28px", flexDirection: "column" }, [
        metric2(item[0], spec, { fontSize: 58, lineHeight: 0.82 }),
        body2(item[1], spec, { marginTop: 12, fontSize: 13.5, color: C.inkSoft })
      ])
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.numbers.eyebrow) });
}
function renderQuote4(spec) {
  const c = content3(spec, "quote");
  return page2(spec, 7, [
    serif2('"', spec, { position: "absolute", left: 444, top: 104, fontSize: 112, color: C.blush, fontStyle: "italic", lineHeight: 0.7 }),
    serif2(text3(c.quote, DEFAULTS3.quote.quote), spec, { position: "absolute", left: 170, top: 178, width: 620, textAlign: "center", fontSize: 44, lineHeight: 1.12 }),
    body2(text3(c.name, DEFAULTS3.quote.name), spec, { position: "absolute", left: 320, top: 382, width: 320, textAlign: "center", color: C.ink, fontSize: 14.5, fontWeight: 600 }),
    body2(text3(c.role, DEFAULTS3.quote.role), spec, { position: "absolute", left: 320, top: 408, width: 320, textAlign: "center", fontSize: 13.2 })
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.quote.eyebrow) });
}
function renderNext(spec) {
  const c = content3(spec, "next");
  const items = array2(c.items, DEFAULTS3.next.items);
  return page2(spec, 8, [
    softCard({ position: "absolute", left: 48, top: 104, width: 360, height: 322, padding: "30px 32px", flexDirection: "column" }, [
      display(text3(c.title, DEFAULTS3.next.title), spec, { fontSize: 52, lineHeight: 0.98 }),
      body2(text3(c.subtitle, DEFAULTS3.next.subtitle), spec, { marginTop: 22, fontSize: 15.5, color: C.inkSoft })
    ]),
    box(
      { position: "absolute", right: 56, top: 104, width: 462, flexDirection: "column", gap: 14 },
      items.slice(0, 3).map(
        (item, index) => pastelCard([C.pink, C.lemon, C.blush][index], { height: 98, padding: "18px 22px", flexDirection: "row", alignItems: "flex-start" }, [
          serif2(item[0], spec, { width: 42, fontSize: 34, fontStyle: "italic" }),
          box({ flex: 1, flexDirection: "column" }, [
            serif2(item[1], spec, { fontSize: 23, lineHeight: 1.05 }),
            body2(item[2], spec, { marginTop: 7, fontSize: 12.4, lineHeight: 1.32 })
          ])
        ])
      )
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.next.eyebrow) });
}
function renderConsult(spec) {
  const c = content3(spec, "consult");
  const columns = array2(c.columns, DEFAULTS3.consult.columns);
  return page2(spec, 9, [
    pastelCard(C.lemon, { position: "absolute", left: 56, top: 88, width: 848, height: 84, padding: "20px 28px", justifyContent: "center" }, [
      serif2(text3(c.action, DEFAULTS3.consult.action), spec, { fontSize: 32, lineHeight: 1.05 })
    ]),
    box(
      { position: "absolute", left: 56, top: 204, width: 848, flexDirection: "row", gap: 16 },
      columns.slice(0, 3).map(
        (col) => softCard({ width: 272, height: 190, padding: "22px 22px", flexDirection: "column" }, [
          serif2(col[0], spec, { fontSize: 26 }),
          body2(col[1], spec, { marginTop: 14, fontSize: 12.8, lineHeight: 1.42 })
        ])
      )
    ),
    serif2(text3(c.source, DEFAULTS3.consult.source), spec, { position: "absolute", left: 56, top: 420, width: 520, paddingTop: 12, borderTop: `1px dashed ${C.ruleMedium}`, fontSize: 16, color: C.inkSoft, fontStyle: "italic" })
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.consult.eyebrow) });
}
function renderChart2(spec) {
  const c = content3(spec, "chart");
  const series = array2(c.series, DEFAULTS3.chart.series);
  return page2(spec, 10, [
    box({ position: "absolute", left: 56, top: 112, width: 360, flexDirection: "column" }, [
      display(text3(c.title, DEFAULTS3.chart.title), spec, { fontSize: 48, lineHeight: 1.02 }),
      body2(text3(c.subtitle, DEFAULTS3.chart.subtitle), spec, { marginTop: 24, fontSize: 15.5, lineHeight: 1.45 }),
      box({ marginTop: 30, flexDirection: "column", gap: 10 }, series.map(
        (item, index) => box({ flexDirection: "row", alignItems: "center" }, [
          box({ width: 28, height: 8, borderRadius: 4, backgroundColor: [C.pink, C.lemon, C.sage][index] }, []),
          body2(item, spec, { marginLeft: 12, fontSize: 12.5, color: C.inkSoft })
        ])
      ))
    ]),
    softCard({ position: "absolute", right: 56, top: 106, width: 430, height: 316, padding: "24px 28px" }, [
      box({ position: "absolute", left: 44, top: 52, width: 1, height: 210, backgroundColor: C.ruleMedium }, []),
      box({ position: "absolute", left: 44, top: 262, width: 326, height: 1, backgroundColor: C.ruleMedium }, []),
      ...[0, 1, 2, 3].map((i) => box({ position: "absolute", left: 44, top: 72 + i * 54, width: 326, height: 1, backgroundColor: C.rule }, [])),
      ...[C.pink, C.lemon, C.sage].map(
        (color, i) => box({ position: "absolute", left: 72 + i * 72, top: 212 - i * 38, width: 142, height: 3, backgroundColor: color, transform: `rotate(${-10 + i * 4}deg)` }, [])
      ),
      label2("% of cohort active, by day", spec, { position: "absolute", left: 44, top: 24, fontSize: 12, color: C.inkSoft })
    ])
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.chart.eyebrow) });
}
function renderProcess(spec) {
  const c = content3(spec, "process");
  const steps = array2(c.steps, DEFAULTS3.process.steps);
  const timeline = array2(c.timeline, DEFAULTS3.process.timeline);
  return page2(spec, 11, [
    box({ position: "absolute", left: 56, top: 88, width: 848, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, [
      display(text3(c.title, DEFAULTS3.process.title), spec, { width: 360, fontSize: 52 }),
      body2(text3(c.subtitle, DEFAULTS3.process.subtitle), spec, { width: 300, fontSize: 15.5, textAlign: "right" })
    ]),
    box(
      { position: "absolute", left: 56, top: 190, width: 848, flexDirection: "row", gap: 10 },
      steps.slice(0, 5).map(
        (step, index) => pastelCard([C.pink, C.blush, C.lemon, C.sage, C.lilac][index], { width: 161, height: 174, padding: "18px 16px", flexDirection: "column" }, [
          serif2(step[0], spec, { fontSize: 38, fontStyle: "italic" }),
          serif2(step[1], spec, { marginTop: 8, fontSize: 22 }),
          body2(step[2], spec, { marginTop: 8, fontSize: 11.5, lineHeight: 1.28 }),
          index < 4 ? serif2("\u2192", spec, { position: "absolute", right: -8, top: 74, fontSize: 18, color: C.inkSoft }) : null
        ].filter(Boolean))
      )
    ),
    box(
      { position: "absolute", left: 56, top: 396, width: 848, height: 34, borderRadius: 17, backgroundColor: C.card, flexDirection: "row" },
      timeline.slice(0, 5).map((item) => body2(item, spec, { flex: 1, textAlign: "center", fontSize: 12, color: C.inkSoft, lineHeight: 2.7 }))
    )
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.process.eyebrow) });
}
function renderMatrix(spec) {
  const c = content3(spec, "matrix");
  const headers = array2(c.headers, DEFAULTS3.matrix.headers);
  const rows = array2(c.rows, DEFAULTS3.matrix.rows);
  return page2(spec, 12, [
    box({ position: "absolute", left: 56, top: 86, width: 848, flexDirection: "row", justifyContent: "space-between" }, [
      display(text3(c.title, DEFAULTS3.matrix.title), spec, { width: 430, fontSize: 43, lineHeight: 1.02 }),
      body2(text3(c.subtitle, DEFAULTS3.matrix.subtitle), spec, { width: 280, fontSize: 15.5, textAlign: "right" })
    ]),
    softCard({ position: "absolute", left: 56, top: 206, width: 848, height: 230, padding: "18px 18px", flexDirection: "column" }, [
      box({ flexDirection: "row", borderBottom: `1px solid ${C.ruleMedium}` }, headers.slice(0, 4).map(
        (item, index) => body2(item, spec, { width: index === 0 ? 170 : 210, fontSize: 12.5, fontWeight: 700, color: C.ink, paddingBottom: 10 })
      )),
      ...rows.slice(0, 4).map(
        (row) => box({ flexDirection: "row", borderBottom: `1px dashed ${C.rule}`, minHeight: 42, alignItems: "center" }, row.slice(0, 4).map(
          (item, index) => body2(item, spec, { width: index === 0 ? 170 : 210, fontSize: 12.2, color: index === 0 ? C.ink : C.inkSoft })
        ))
      )
    ])
  ], { eyebrow: text3(c.eyebrow, DEFAULTS3.matrix.eyebrow) });
}
var RENDERERS3 = {
  cover: renderCover4,
  foreword: renderForeword,
  method: renderMethod,
  insights: renderInsights,
  closer: renderCloser,
  numbers: renderNumbers,
  quote: renderQuote4,
  next: renderNext,
  consult: renderConsult,
  chart: renderChart2,
  process: renderProcess,
  matrix: renderMatrix
};
function renderSoftEditorialFeature(spec) {
  const variant = normalizeVariant4(spec);
  return (RENDERERS3[variant] || renderInsights)(spec);
}

// templates/beautiful/tritone-editorial-spread.mjs
var templateId6 = "tritone-editorial-spread";
var PAGE_VARIANTS5 = ["cover", "manifesto", "grid", "stat", "timeline", "chart", "quote", "closer"];
var rendererContract6 = {
  template_id: templateId6,
  renderer_id: `artboard_satori.${templateId6}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "editorial-tri-tone",
  implemented_page_variants: PAGE_VARIANTS5,
  page_family: {
    family_id: "editorial-tri-tone",
    supported_page_variants: PAGE_VARIANTS5,
    variant_usage_policy: {
      singletons: ["cover", "closer"],
      repeatable: PAGE_VARIANTS5.filter((variant) => !["cover", "closer"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/editorial-tri-tone-1.png"
};
var DEFAULTS4 = {
  cover: {
    left_meta: "Vol. 04 - Editorial Brief",
    center_meta: "Spring / Summer Edition",
    right_meta: "FW - 2026",
    title: "Studio & Salon",
    tags: ["focus", "tech-equipped", "creativity", "coffee", "community", "coworking", "productivity", "inspiration", "flexible", "workshops", "collaboration", "studio"]
  },
  manifesto: {
    eyebrow: "Chapter One - Manifesto",
    number: "01",
    title: "Placeholder lede sets the tone for the whole document.",
    subtitle: "A short, declarative sentence followed by an aside in italic that carries the warmth.",
    kicker: "An opening note",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur est at lobortis.",
      "Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo.",
      "Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis."
    ],
    signature: "with warmth, The Editorial Desk"
  },
  grid: {
    title: "Eight principles, loosely held.",
    section: "03 - Principles",
    cards: [
      { num: "/ 01", title: "Slow looking", body: "A short paragraph describing the principle in plain language. Two sentences is plenty." },
      { num: "/ 02", title: "Open kitchen", body: "Process in public. Show the sketches before they harden." },
      { num: "/ 03", title: "Borrowed light", body: "Cite generously. The best ideas belong to a lineage." },
      { num: "/ 04", title: "Quiet defaults", body: "Restraint as a posture. Loud only when the moment earns it." },
      { num: "/ 05", title: "Fewer, finer", body: "Three considered objects beat thirty hurried ones." },
      { num: "/ 06", title: "Useful warmth", body: "Make the work specific, welcoming, and usable." },
      { num: "/ 07", title: "Good rooms", body: "Design for the conversation you want to host." },
      { num: "/ 08", title: "Return often", body: "Keep the notes alive after the first reading." }
    ]
  },
  stat: {
    eyebrow: "04 - Headline Figure",
    subtitle: "A portrait, in numbers.",
    value: "72",
    unit: "%",
    label: "What this measures",
    body: "Placeholder annotation. A short, candid sentence about what the figure means and what it doesn't.",
    rows: [
      { label: "Segment A", value: "82.4" },
      { label: "Segment B", value: "63.9" },
      { label: "Segment C", value: "48.1" },
      { label: "Segment D", value: "31.0" }
    ]
  },
  timeline: {
    title: "A short trajectory, told in five stops.",
    subtitle: "05 - Trajectory 2019 to present",
    events: [
      { year: "'19", title: "The first prototype", body: "A short caption per milestone, written in plain prose." },
      { year: "'21", title: "Quiet expansion", body: "Placeholder copy describing a turning point." },
      { year: "'23", title: "A new house style", body: "Type, color, voice - recast around a single editorial premise." },
      { year: "'25", title: "The salon, formalized", body: "Monthly gatherings became a fixture, then the work's center." },
      { year: "'26", title: "Where we sit now", body: "Present tense. A brief, honest description of the practice today." }
    ]
  },
  chart: {
    eyebrow: "06 - Composition",
    title: "How the days arrange themselves.",
    body: "A placeholder description for the chart on the right. Speak to the shape of the data - what rises, what plateaus.",
    legend: ["Studio hours, deep work", "Salon & conversation", "Reading, drift, walking", "Correspondence, admin"],
    bars: [
      { label: "W01", values: [32, 18, 12, 8] },
      { label: "W05", values: [35, 22, 14, 7] },
      { label: "W09", values: [29, 26, 17, 9] },
      { label: "W13", values: [38, 28, 16, 10] },
      { label: "W17", values: [34, 30, 19, 11] },
      { label: "W24", values: [40, 32, 20, 12] }
    ]
  },
  quote: {
    eyebrow: "07 - In their words",
    quote: "A placeholder pull-quote, set in italic with one phrase rendered as bold sans for emphasis, the way good editorial designers have always done it.",
    author: "A. Placeholder-Surname",
    role: "Editor-at-large - Sister Publication",
    title: "Three short reads",
    subtitle: "Voices, lightly edited - from the readership.",
    reads: [
      { num: "i.", title: "On the rhythm", body: "A two-line testimonial that reads as if spoken aloud." },
      { num: "ii.", title: "On the company", body: "Another short note, useful and specific without being precious." },
      { num: "iii.", title: "On returning", body: "A closing testimonial after the others have convinced the reader." }
    ]
  },
  closer: {
    eyebrow: "08 - Colophon & Index",
    title: "Until the next volume.",
    issue: "End of issue No. 04 - 016 pp.",
    fin: "Fin.",
    tags: ["issue 04", "spring volume", "colophon"],
    columns: [
      { label: "Editorial", items: ["A. Placeholder", "B. Placeholder", "C. Placeholder"] },
      { label: "Type", items: ["Bricolage Grotesque", "Instrument Serif", "JetBrains Mono"] },
      { label: "Printed by", items: ["Placeholder Press", "City & State", "Recycled stock, 120gsm"] }
    ]
  }
};
function colors4(spec) {
  const source = spec.theme?.colors || {};
  return {
    pink: source.background || "#F2B6C6",
    butter: source.accent || "#F2D86A",
    burgundy: source.primary || "#7A1F35"
  };
}
function role4(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value2(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array3(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function content4(spec, variant) {
  return { ...DEFAULTS4[variant] || DEFAULTS4.cover, ...spec.content || {} };
}
function normalizeVariant5(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS5.length) return PAGE_VARIANTS5[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS5) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("manifest")) return "manifesto";
  if (raw.includes("grid") || raw.includes("principle")) return "grid";
  if (raw.includes("stat") || raw.includes("metric")) return "stat";
  if (raw.includes("timeline") || raw.includes("trajectory")) return "timeline";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("closing") || raw.includes("colophon") || raw.includes("closer")) return "closer";
  return "manifesto";
}
function page3(theme8, backgroundColor, children = []) {
  return box({ width: 960, height: 540, position: "relative", backgroundColor, color: theme8.burgundy, overflow: "hidden" }, children);
}
function label3(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 12,
    lineHeight: 1,
    letterSpacing: 2,
    ...role4("label", spec, { fontSize: 12, lineHeight: 1, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }),
    ...style
  });
}
function body3(value15, spec, style = {}) {
  return TextBlock(value15, {
    fontSize: 13,
    lineHeight: 1.4,
    ...role4("body", spec, { fontSize: 13, lineHeight: 1.4, fontWeight: 400 }),
    ...style
  });
}
function headline(value15, spec, style = {}) {
  return Title(value15, {
    fontSize: 44,
    lineHeight: 0.96,
    letterSpacing: -1,
    ...role4("display", spec, { fontSize: 44, lineHeight: 0.96, fontWeight: 800, letterSpacing: -1 }),
    ...style
  });
}
function statText(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    fontSize: 132,
    lineHeight: 0.82,
    letterSpacing: -4,
    ...role4("metric", spec, { fontSize: 132, lineHeight: 0.82, fontWeight: 800, letterSpacing: -4 }),
    ...style
  });
}
function pill(theme8, spec, text10, index, style = {}) {
  const dark = index % 2 === 0;
  return TextBlock(text10.toLowerCase(), {
    height: 32,
    minWidth: Math.max(76, text10.length * 13),
    padding: "4px 14px",
    borderRadius: 18,
    color: dark ? theme8.butter : theme8.burgundy,
    backgroundColor: dark ? theme8.burgundy : theme8.butter,
    fontSize: 16,
    lineHeight: 1.35,
    ...role4("body", spec, { fontSize: 16, lineHeight: 1.35, fontWeight: 700 }),
    ...style
  });
}
function titleParts(raw) {
  const cleaned = raw || "Studio & Salon";
  if (cleaned.includes("&")) {
    const [left, right] = cleaned.split("&");
    return { left: left.trim() || "Studio", right: right.trim() || "Salon" };
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  const half = Math.max(1, Math.ceil(words.length / 2));
  return { left: words.slice(0, half).join(" ") || "Studio", right: words.slice(half).join(" ") || "Salon" };
}
function renderCover5(spec, theme8) {
  const c = content4(spec, "cover");
  const tags = array3(spec, "tags", c.tags).slice(0, 12);
  const parts = titleParts(value2(spec, "title", c.title));
  return page3(theme8, theme8.pink, [
    label3(value2(spec, "left_meta", c.left_meta), spec, { position: "absolute", left: 32, top: 34, color: theme8.burgundy }),
    label3(value2(spec, "center_meta", c.center_meta), spec, { position: "absolute", left: 344, top: 34, width: 280, color: theme8.burgundy, textAlign: "center" }),
    label3(value2(spec, "right_meta", c.right_meta), spec, { position: "absolute", right: 32, top: 34, width: 130, color: theme8.burgundy, textAlign: "right" }),
    box({ position: "absolute", left: 32, top: 62, width: 760, flexDirection: "row", flexWrap: "wrap", gap: 10 }, tags.map((item, index) => pill(theme8, spec, item, index))),
    headline(parts.left, spec, { position: "absolute", left: 32, bottom: 45, width: 370, color: theme8.burgundy, fontSize: 90, lineHeight: 0.9 }),
    headline("&", spec, { position: "absolute", left: 432, bottom: 47, width: 92, color: theme8.butter, textAlign: "center", fontSize: 98, lineHeight: 0.85 }),
    headline(parts.right, spec, { position: "absolute", right: 28, bottom: 45, width: 360, color: theme8.burgundy, textAlign: "right", fontSize: 90, lineHeight: 0.9 })
  ]);
}
function renderManifesto(spec, theme8) {
  const c = content4(spec, "manifesto");
  const paragraphs = array3(spec, "paragraphs", c.paragraphs);
  return page3(theme8, theme8.butter, [
    label3(value2(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 48, top: 50, color: theme8.burgundy }),
    headline(value2(spec, "number", c.number), spec, { position: "absolute", right: 58, top: 34, color: theme8.burgundy, fontSize: 104, lineHeight: 0.9 }),
    headline(value2(spec, "title", c.title), spec, { position: "absolute", left: 48, top: 126, width: 700, color: theme8.burgundy, fontSize: 38, lineHeight: 1.05 }),
    body3(value2(spec, "subtitle", c.subtitle), spec, { position: "absolute", left: 48, top: 226, width: 640, color: theme8.burgundy, fontSize: 18, lineHeight: 1.25 }),
    box({ position: "absolute", left: 48, top: 305, width: 180, height: 1, backgroundColor: theme8.burgundy }),
    label3(value2(spec, "kicker", c.kicker), spec, { position: "absolute", left: 48, top: 326, color: theme8.burgundy }),
    ...paragraphs.slice(0, 3).map((text10, index) => body3(text10, spec, { position: "absolute", left: 250, top: 310 + index * 45, width: 540, color: theme8.burgundy, fontSize: 13, lineHeight: 1.35 })),
    body3(value2(spec, "signature", c.signature), spec, { position: "absolute", right: 54, bottom: 42, color: theme8.burgundy, fontSize: 24, lineHeight: 1, textAlign: "right" })
  ]);
}
function renderGrid(spec, theme8) {
  const c = content4(spec, "grid");
  const cards = array3(spec, "cards", c.cards);
  return page3(theme8, theme8.pink, [
    headline(value2(spec, "title", c.title), spec, { position: "absolute", left: 48, top: 48, width: 540, color: theme8.burgundy, fontSize: 42 }),
    label3(value2(spec, "section", c.section), spec, { position: "absolute", right: 48, top: 60, color: theme8.burgundy, textAlign: "right" }),
    ...cards.slice(0, 8).map((card2, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const dark = index % 3 === 0;
      return box({ position: "absolute", left: 48 + col * 216, top: 155 + row * 160, width: 192, height: 132, backgroundColor: dark ? theme8.burgundy : theme8.butter, color: dark ? theme8.butter : theme8.burgundy, borderRadius: 14, padding: 16, flexDirection: "column" }, [
        label3(card2.num, spec, { color: dark ? theme8.butter : theme8.burgundy, fontSize: 10, letterSpacing: 1.4 }),
        headline(card2.title, spec, { color: dark ? theme8.butter : theme8.burgundy, fontSize: 22, lineHeight: 1, marginTop: 10 }),
        body3(card2.body, spec, { color: dark ? theme8.butter : theme8.burgundy, fontSize: 11, lineHeight: 1.25, marginTop: 8 })
      ]);
    })
  ]);
}
function renderStat2(spec, theme8) {
  const c = content4(spec, "stat");
  const rows = array3(spec, "rows", c.rows);
  return page3(theme8, theme8.butter, [
    label3(value2(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 48, top: 48, color: theme8.burgundy }),
    body3(value2(spec, "subtitle", c.subtitle), spec, { position: "absolute", left: 48, top: 82, color: theme8.burgundy, fontSize: 22 }),
    statText(value2(spec, "value", c.value), spec, { position: "absolute", left: 42, top: 130, width: 360, color: theme8.burgundy, fontSize: 184 }),
    headline(value2(spec, "unit", c.unit), spec, { position: "absolute", left: 412, top: 210, color: theme8.pink, fontSize: 76 }),
    label3(value2(spec, "label", c.label), spec, { position: "absolute", left: 530, top: 144, color: theme8.burgundy }),
    body3(value2(spec, "body", c.body), spec, { position: "absolute", left: 530, top: 178, width: 330, color: theme8.burgundy, fontSize: 15, lineHeight: 1.35 }),
    label3("Composition", spec, { position: "absolute", left: 530, top: 294, color: theme8.burgundy }),
    ...rows.slice(0, 4).map((row, index) => box({ position: "absolute", left: 530, top: 330 + index * 36, width: 330, height: 1, borderTopWidth: 1, borderTopColor: theme8.burgundy }, [
      body3(row.label, spec, { position: "absolute", left: 0, top: 8, color: theme8.burgundy, fontSize: 14 }),
      headline(row.value, spec, { position: "absolute", right: 0, top: 2, color: theme8.burgundy, fontSize: 28 })
    ]))
  ]);
}
function renderTimeline3(spec, theme8) {
  const c = content4(spec, "timeline");
  const events = array3(spec, "events", c.events);
  return page3(theme8, theme8.pink, [
    headline(value2(spec, "title", c.title), spec, { position: "absolute", left: 48, top: 48, width: 550, color: theme8.burgundy, fontSize: 42 }),
    label3(value2(spec, "subtitle", c.subtitle), spec, { position: "absolute", right: 48, top: 62, color: theme8.burgundy, textAlign: "right" }),
    box({ position: "absolute", left: 70, top: 250, width: 820, height: 2, backgroundColor: theme8.burgundy }),
    ...events.slice(0, 5).map((event, index) => {
      const x = 62 + index * 170;
      return box({ position: "absolute", left: x, top: 185, width: 155, flexDirection: "column" }, [
        headline(event.year, spec, { color: theme8.butter, fontSize: 46, lineHeight: 1 }),
        box({ width: 14, height: 14, borderRadius: 999, backgroundColor: theme8.burgundy, marginTop: 13, marginBottom: 18 }),
        headline(event.title, spec, { color: theme8.burgundy, fontSize: 21, lineHeight: 1 }),
        body3(event.body, spec, { color: theme8.burgundy, fontSize: 12, lineHeight: 1.35, marginTop: 12 })
      ]);
    })
  ]);
}
function renderChart3(spec, theme8) {
  const c = content4(spec, "chart");
  const legend = array3(spec, "legend", c.legend);
  const bars = array3(spec, "bars", c.bars);
  const series = [theme8.burgundy, theme8.butter, theme8.pink, "#7A1F35"];
  return page3(theme8, theme8.butter, [
    label3(value2(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 48, top: 50, color: theme8.burgundy }),
    headline(value2(spec, "title", c.title), spec, { position: "absolute", left: 48, top: 88, width: 330, color: theme8.burgundy, fontSize: 38 }),
    body3(value2(spec, "body", c.body), spec, { position: "absolute", left: 48, top: 214, width: 330, color: theme8.burgundy, fontSize: 14, lineHeight: 1.35 }),
    ...legend.slice(0, 4).map((item, index) => box({ position: "absolute", left: 48, top: 318 + index * 34, width: 330, alignItems: "center" }, [
      box({ width: 16, height: 16, backgroundColor: series[index], borderWidth: index === 2 ? 1 : 0, borderColor: theme8.burgundy, marginRight: 12 }),
      label3(item, spec, { color: theme8.burgundy, fontSize: 10, letterSpacing: 1.1 })
    ])),
    box({ position: "absolute", left: 430, top: 90, width: 440, height: 350, borderRadius: 18, backgroundColor: theme8.pink, padding: 24, flexDirection: "column" }, [
      label3("Hours per week, by mode", spec, { color: theme8.burgundy }),
      box({ marginTop: 28, height: 230, alignItems: "flex-end", justifyContent: "space-between" }, bars.slice(0, 6).map((bar) => {
        const total = Math.max(...bar.values);
        return box({ width: 48, height: 230, alignItems: "flex-end", justifyContent: "center" }, bar.values.slice(0, 4).map((value15, index) => box({ width: 10, height: Math.max(18, value15 / total * 200), backgroundColor: series[index], marginLeft: index ? 2 : 0, borderWidth: index === 2 ? 1 : 0, borderColor: theme8.burgundy })));
      })),
      box({ marginTop: 12, justifyContent: "space-between" }, bars.slice(0, 6).map((bar) => label3(bar.label, spec, { color: theme8.burgundy, fontSize: 9, letterSpacing: 1 })))
    ])
  ]);
}
function renderQuote5(spec, theme8) {
  const c = content4(spec, "quote");
  const reads = array3(spec, "reads", c.reads);
  return page3(theme8, theme8.pink, [
    label3(value2(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 48, top: 48, color: theme8.burgundy }),
    headline('"', spec, { position: "absolute", left: 52, top: 88, width: 80, color: theme8.butter, fontSize: 108, lineHeight: 0.7 }),
    headline(value2(spec, "quote", c.quote), spec, { position: "absolute", left: 130, top: 100, width: 470, color: theme8.burgundy, fontSize: 31, lineHeight: 1.04 }),
    body3(value2(spec, "author", c.author), spec, { position: "absolute", left: 130, top: 370, color: theme8.burgundy, fontSize: 21, fontWeight: 700 }),
    label3(value2(spec, "role", c.role), spec, { position: "absolute", left: 130, top: 405, color: theme8.burgundy }),
    box({ position: "absolute", right: 50, top: 84, width: 230, height: 380, backgroundColor: theme8.butter, borderRadius: 18, padding: 20, flexDirection: "column" }, [
      headline(value2(spec, "title", c.title), spec, { color: theme8.burgundy, fontSize: 26, lineHeight: 1 }),
      body3(value2(spec, "subtitle", c.subtitle), spec, { color: theme8.burgundy, fontSize: 12, lineHeight: 1.3, marginTop: 10 }),
      ...reads.slice(0, 3).map((read) => box({ marginTop: 20, borderTopWidth: 1, borderTopColor: theme8.burgundy, paddingTop: 12, flexDirection: "column" }, [
        label3(read.num, spec, { color: theme8.burgundy, fontSize: 10 }),
        body3(`${read.title} ${read.body}`, spec, { color: theme8.burgundy, fontSize: 12, lineHeight: 1.28, marginTop: 6 })
      ]))
    ])
  ]);
}
function renderCloser2(spec, theme8) {
  const c = content4(spec, "closer");
  const tags = array3(spec, "tags", c.tags);
  const columns = array3(spec, "columns", c.columns);
  return page3(theme8, theme8.burgundy, [
    label3(value2(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 48, top: 48, color: theme8.butter }),
    headline(value2(spec, "title", c.title), spec, { position: "absolute", left: 48, top: 88, width: 620, color: theme8.butter, fontSize: 58 }),
    label3(value2(spec, "issue", c.issue), spec, { position: "absolute", right: 48, top: 58, color: theme8.butter, textAlign: "right" }),
    statText(value2(spec, "fin", c.fin), spec, { position: "absolute", left: 48, top: 210, color: theme8.pink, fontSize: 154 }),
    box({ position: "absolute", left: 48, bottom: 154, width: 520, flexDirection: "row", gap: 10 }, tags.map((item, index) => pill(theme8, spec, item, index, { height: 28, fontSize: 13, minWidth: 80 }))),
    ...columns.slice(0, 3).map((column, index) => box({ position: "absolute", left: 48 + index * 270, bottom: 44, width: 225, flexDirection: "column" }, [
      label3(column.label, spec, { color: theme8.butter, marginBottom: 14 }),
      ...column.items.slice(0, 3).map((item) => body3(item, spec, { color: theme8.butter, fontSize: 13, lineHeight: 1.45 }))
    ]))
  ]);
}
function renderTritoneEditorialSpread(spec) {
  const theme8 = colors4(spec);
  const variant = normalizeVariant5(spec);
  if (variant === "cover") return renderCover5(spec, theme8);
  if (variant === "manifesto") return renderManifesto(spec, theme8);
  if (variant === "grid") return renderGrid(spec, theme8);
  if (variant === "stat") return renderStat2(spec, theme8);
  if (variant === "timeline") return renderTimeline3(spec, theme8);
  if (variant === "chart") return renderChart3(spec, theme8);
  if (variant === "quote") return renderQuote5(spec, theme8);
  return renderCloser2(spec, theme8);
}

// templates/beautiful/pixel-orbit-console.mjs
var templateId7 = "pixel-orbit-console";
var PAGE_VARIANTS6 = [
  "slide-1",
  "slide-2",
  "slide-3",
  "slide-4",
  "slide-5",
  "slide-6",
  "slide-7",
  "slide-8",
  "slide-9",
  "slide-10"
];
var rendererContract7 = {
  template_id: templateId7,
  renderer_id: `artboard_satori.${templateId7}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "8-bit-orbit",
  implemented_page_variants: PAGE_VARIANTS6,
  page_family: {
    family_id: "8-bit-orbit",
    supported_page_variants: PAGE_VARIANTS6,
    variant_usage_policy: {
      singletons: ["slide-1", "slide-10"],
      repeatable: ["slide-2", "slide-3", "slide-4", "slide-5", "slide-6", "slide-7", "slide-8", "slide-9"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/8-bit-orbit-1.png"
};
var CANVAS3 = { width: 960, height: 540 };
var DEFAULTS5 = {
  "slide-1": {
    eyebrow: "Pixel Perfect Presentation System",
    title: "8-BIT ORBIT",
    subtitle: "A retro-futuristic deck engine for bold storytellers. Built for arcades, engineered for boardrooms.",
    chips: ["10 Slides", "CSS Native", "Zero Dependencies"]
  },
  "slide-2": {
    eyebrow: "Mission Brief",
    title: "Rewiring How We Share Ideas",
    body: "Every presentation is an opportunity to transport your audience. This template fuses tactile 16-bit nostalgia with modern typographic discipline.",
    body2: "No canvas limits. No cookie-cutter layouts. Just pure CSS architecture delivering cinematic transitions and atmospheric depth."
  },
  "slide-3": {
    eyebrow: "Core Systems",
    title: "Four Engines Running",
    items: [
      { title: "Modular Blocks", body: "Swap components without breaking the grid. Every element is containerized by default." },
      { title: "Crisp Vectors", body: "All visual effects are native CSS. No image assets are required for borders or shadows." },
      { title: "Live Data", body: "Chart slides accept dynamic values and animated transitions." },
      { title: "Retro Atmosphere", body: "Scanlines, CRT vignettes, starfields, and noise create an immersive environment." }
    ]
  },
  "slide-4": {
    eyebrow: "Analytics Core",
    title: "Quarterly Growth Metrics",
    subtitle: "Fiscal performance across four sectors - normalized index",
    metrics: [
      { label: "Alpha", value: 78 },
      { label: "Beta", value: 92 },
      { label: "Gamma", value: 64 },
      { label: "Delta", value: 85 },
      { label: "Epsilon", value: 56 }
    ]
  },
  "slide-5": {
    eyebrow: "System Load",
    title: "Resource Allocation",
    subtitle: "Percentage distribution across operational units",
    metrics: [
      { label: "Compute", value: 88 },
      { label: "Storage", value: 72 },
      { label: "Network", value: 95 },
      { label: "Memory", value: 61 },
      { label: "Graphics", value: 44 }
    ]
  },
  "slide-6": {
    eyebrow: "Chronology",
    title: "Development Roadmap",
    timeline: [
      { date: "Q1 2026", title: "Concept & Architecture", body: "Wireframes, palette selection, and core grid system established." },
      { date: "Q2 2026", title: "Asset Generation", body: "Pixel components, iconography, and atmospheric effects coded." },
      { date: "Q3 2026", title: "Data Integration", body: "Charting engine, animated counters, and dynamic state binding." },
      { date: "Q4 2026", title: "Global Launch", body: "Public release with documentation and community support." }
    ]
  },
  "slide-7": {
    eyebrow: "Live Telemetry",
    title: "Platform Vitals",
    subtitle: "Real-time aggregate figures from active deployments",
    metrics: [
      { value: "847", label: "Active Worlds" },
      { value: "12.4M", label: "Pixels Rendered" },
      { value: "99.9%", label: "Uptime Score" },
      { value: "2048", label: "Max Resolution" }
    ]
  },
  "slide-8": {
    quote: "The best presentations do not merely inform. They immerse. They transform the conference room into an arcade cabinet where every slide is a new level waiting to be unlocked.",
    author: "Lead Creative Technologist, Studio Orbital"
  },
  "slide-9": {
    eyebrow: "Access Tiers",
    title: "Choose Your Loadout",
    tiers: [
      { name: "Rookie", price: "$0", desc: "For solo explorers testing the waters.", features: ["5 slide maximum", "Standard grid themes", "Community support", "Static export only"] },
      { name: "Arcade", price: "$29", desc: "Serious builders need serious tooling.", features: ["Unlimited slides", "All atmospheric packs", "Live data binding", "Priority rendering"] },
      { name: "Boss", price: "$79", desc: "Enterprise-grade control and compliance.", features: ["Everything in Arcade", "White-label export", "SSO & audit logs", "Dedicated pipeline"] }
    ]
  },
  "slide-10": {
    title: "Ready Player One?",
    subtitle: "Deploy your first 8-BIT ORBIT deck in under sixty seconds. No dependencies. No friction. Just pure presentation power.",
    ctas: ["Initialize Deck", "View Documentation"]
  }
};
function colors5(spec) {
  const source = spec.theme?.colors || {};
  return {
    void: source.background || "#0A0E27",
    navy: source.panel || "#0F1B3D",
    cyan: source.primary || "#5EDCF4",
    pink: source.accent || "#F0A6CA",
    yellow: source.yellow || "#F4D03F",
    lavender: source.muted || "#E2D5F2",
    grid: source.grid || "#1B2B55",
    white: source.text || "#FFFFFF"
  };
}
function role5(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value3(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array4(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectItems(spec, key, fallback2 = []) {
  return array4(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function upper(input) {
  return String(input || "").toUpperCase();
}
function normalizeVariant6(spec) {
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= 10) return `slide-${sourceIndex}`;
  for (const variant of PAGE_VARIANTS6) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("hero")) return "slide-1";
  if (raw.includes("agenda") || raw.includes("intro")) return "slide-2";
  if (raw.includes("timeline") || raw.includes("process")) return "slide-6";
  if (raw.includes("quote")) return "slide-8";
  if (raw.includes("closing") || raw.includes("cta")) return "slide-10";
  if (raw.includes("chart") || raw.includes("data")) return "slide-4";
  return "slide-1";
}
function variantIndex(variant) {
  return Math.max(1, PAGE_VARIANTS6.indexOf(variant) + 1);
}
function backgroundKind(variant) {
  if (["slide-1", "slide-4", "slide-7", "slide-10"].includes(variant)) return "dark";
  if (["slide-2", "slide-6"].includes(variant)) return "pink";
  if (["slide-3", "slide-8"].includes(variant)) return "cyan";
  return "lavender";
}
function grid(theme8, kind = "dark") {
  const color = kind === "dark" ? theme8.cyan : theme8.navy;
  const opacity = kind === "dark" ? 0.18 : 0.12;
  const vertical = Array.from({ length: 25 }).map(
    (_, index) => box({ position: "absolute", left: index * 40, top: 0, width: 1, height: 540, backgroundColor: color, opacity })
  );
  const horizontal = Array.from({ length: 15 }).map(
    (_, index) => box({ position: "absolute", left: 0, top: index * 40, width: 960, height: 1, backgroundColor: color, opacity })
  );
  return [...vertical, ...horizontal];
}
function scanlines(theme8, kind = "dark") {
  const color = kind === "dark" ? theme8.white : theme8.navy;
  return Array.from({ length: 46 }).map(
    (_, index) => box({ position: "absolute", left: 0, top: index * 12 + 4, width: 960, height: 1, backgroundColor: color, opacity: kind === "dark" ? 0.035 : 0.045 })
  );
}
function stars(theme8) {
  const points = [
    [45, 54, 5, theme8.yellow],
    [142, 95, 3, theme8.pink],
    [245, 28, 3, theme8.yellow],
    [402, 16, 3, theme8.pink],
    [474, 58, 4, theme8.yellow],
    [641, 75, 3, theme8.cyan],
    [736, 24, 3, theme8.yellow],
    [884, 86, 5, theme8.yellow],
    [192, 242, 3, theme8.cyan],
    [342, 122, 3, theme8.yellow],
    [502, 318, 4, theme8.pink],
    [676, 260, 3, theme8.cyan],
    [758, 120, 3, theme8.pink],
    [916, 162, 4, theme8.cyan],
    [60, 397, 3, theme8.pink],
    [214, 486, 4, theme8.pink],
    [398, 446, 5, theme8.yellow],
    [552, 356, 4, theme8.yellow],
    [678, 508, 4, theme8.cyan],
    [816, 442, 3, theme8.yellow],
    [928, 372, 3, theme8.cyan]
  ];
  return points.map(
    ([left, top, size, color]) => box({ position: "absolute", left, top, width: size, height: size, backgroundColor: color, opacity: 0.82 })
  );
}
function particleLayer(theme8) {
  const points = [
    [82, 120, theme8.cyan],
    [182, 430, theme8.pink],
    [774, 136, theme8.yellow],
    [838, 340, theme8.cyan],
    [310, 84, theme8.pink],
    [652, 468, theme8.yellow]
  ];
  return points.map(([left, top, color]) => box({ position: "absolute", left, top, width: 8, height: 8, backgroundColor: color, opacity: 0.7 }));
}
function frame3(spec, variant, children = [], opts = {}) {
  const theme8 = colors5(spec);
  const kind = opts.kind || backgroundKind(variant);
  const background = opts.background || (kind === "dark" ? theme8.void : kind === "pink" ? theme8.pink : kind === "cyan" ? theme8.cyan : theme8.lavender);
  return box(
    {
      width: CANVAS3.width,
      height: CANVAS3.height,
      position: "relative",
      backgroundColor: background,
      color: kind === "dark" ? theme8.white : theme8.navy,
      overflow: "hidden"
    },
    [
      ...grid(theme8, kind),
      ...scanlines(theme8, kind),
      ...kind === "dark" ? stars(theme8) : [],
      ...opts.particles ? particleLayer(theme8) : [],
      ...children,
      nav(spec, variant, kind)
    ]
  );
}
function nav(spec, variant, kind) {
  const theme8 = colors5(spec);
  const page18 = spec.page_family_source?.source_slide_index || variantIndex(variant);
  const color = kind === "dark" ? theme8.cyan : theme8.navy;
  return box({ position: "absolute", right: 24, top: 198, flexDirection: "column", gap: 8 }, [
    ...PAGE_VARIANTS6.map(
      (_, index) => box({
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: index + 1 === page18 ? color : "transparent",
        opacity: index + 1 === page18 ? 1 : 0.42
      })
    ),
    TextBlock(`${String(page18).padStart(2, "0")} / 10`, {
      position: "absolute",
      right: -1,
      top: 108,
      width: 78,
      color,
      fontSize: 8,
      textAlign: "right",
      letterSpacing: 1,
      ...role5("metric", spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
    })
  ]);
}
function label4(text10, spec, style = {}) {
  const theme8 = colors5(spec);
  return TextBlock(upper(text10), {
    height: 24,
    padding: "6px 14px",
    backgroundColor: theme8.navy,
    color: theme8.yellow,
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 2,
    ...role5("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 }),
    ...style
  });
}
function body4(text10, spec, style = {}) {
  const theme8 = colors5(spec);
  return TextBlock(text10, {
    color: style.color || "rgba(15,27,61,0.76)",
    fontSize: 15,
    lineHeight: 1.58,
    ...role5("body", spec, { fontSize: 15, lineHeight: 1.58, fontWeight: 400 }),
    ...style
  });
}
function headline2(text10, spec, style = {}) {
  const theme8 = colors5(spec);
  return Title(text10, {
    color: theme8.navy,
    fontSize: 38,
    lineHeight: 1.05,
    ...role5("display", spec, { fontSize: 38, lineHeight: 1.05, fontWeight: 800 }),
    ...style
  });
}
function pixelShadowText(text10, spec, style = {}) {
  const theme8 = colors5(spec);
  const base = { fontSize: 64, lineHeight: 0.9, fontWeight: 900, textAlign: "center", ...style };
  return [
    Title(upper(text10), { ...base, left: base.left + 8, top: base.top + 8, color: theme8.navy, ...role5("display", spec, base) }),
    Title(upper(text10), { ...base, left: base.left + 4, top: base.top + 4, color: theme8.yellow, ...role5("display", spec, base) }),
    Title(upper(text10), { ...base, color: theme8.cyan, ...role5("display", spec, base) })
  ];
}
function bracket(theme8, left, top, width, height, color = theme8.cyan) {
  return [
    box({ position: "absolute", left, top, width: 26, height: 4, backgroundColor: color }),
    box({ position: "absolute", left, top, width: 4, height: 26, backgroundColor: color }),
    box({ position: "absolute", left: left + width - 26, top: top + height - 4, width: 26, height: 4, backgroundColor: color }),
    box({ position: "absolute", left: left + width - 4, top: top + height - 26, width: 4, height: 26, backgroundColor: color })
  ];
}
function pixelButton(text10, spec, style = {}) {
  const theme8 = colors5(spec);
  const pink = style.variant === "pink";
  return box({ position: "relative", width: style.width || 170, height: 42 }, [
    box({ position: "absolute", left: 8, top: 8, width: style.width || 170, height: 42, backgroundColor: pink ? theme8.cyan : theme8.yellow }),
    box({ position: "absolute", left: 4, top: 4, width: style.width || 170, height: 42, backgroundColor: theme8.navy }),
    TextBlock(upper(text10), {
      position: "absolute",
      left: 0,
      top: 0,
      width: style.width || 170,
      height: 42,
      backgroundColor: pink ? theme8.pink : theme8.cyan,
      color: theme8.navy,
      padding: "13px 12px",
      textAlign: "center",
      fontSize: 11,
      letterSpacing: 1,
      ...role5("label", spec, { fontSize: 11, lineHeight: 1, fontWeight: 900 })
    })
  ]);
}
function splitTitle(value15) {
  const words = upper(value15).split(/\s+/).filter(Boolean);
  if (words.length <= 2) return words.join("\n");
  const pivot = Math.ceil(words.length / 2);
  return `${words.slice(0, pivot).join(" ")}
${words.slice(pivot).join(" ")}`;
}
function renderCover6(spec) {
  const theme8 = colors5(spec);
  const chips = array4(spec, "chips", DEFAULTS5["slide-1"].chips).slice(0, 3);
  return frame3(
    spec,
    "slide-1",
    [
      ...particleLayer(theme8),
      TextBlock(upper(value3(spec, "eyebrow", DEFAULTS5["slide-1"].eyebrow)), {
        position: "absolute",
        left: 210,
        top: 120,
        width: 540,
        color: theme8.pink,
        fontSize: 10,
        textAlign: "center",
        letterSpacing: 4,
        ...role5("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 700 })
      }),
      ...pixelShadowText(splitTitle(value3(spec, "title", DEFAULTS5["slide-1"].title)), spec, {
        position: "absolute",
        left: 310,
        top: 164,
        width: 340,
        fontSize: 66,
        lineHeight: 0.92
      }),
      TextBlock(value3(spec, "subtitle", DEFAULTS5["slide-1"].subtitle), {
        position: "absolute",
        left: 300,
        top: 334,
        width: 360,
        color: theme8.lavender,
        fontSize: 15,
        lineHeight: 1.56,
        textAlign: "center",
        ...role5("body", spec, { fontSize: 15, lineHeight: 1.56, fontWeight: 500 })
      }),
      box(
        { position: "absolute", left: 318, top: 410, flexDirection: "row", gap: 10 },
        chips.map(
          (chip) => TextBlock(upper(chip), {
            minWidth: 86,
            height: 22,
            borderWidth: 2,
            borderColor: theme8.yellow,
            padding: "5px 9px",
            color: theme8.yellow,
            fontSize: 8,
            lineHeight: 1,
            textAlign: "center",
            ...role5("label", spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
          })
        )
      )
    ],
    { particles: true }
  );
}
function renderSplitIntro(spec) {
  const theme8 = colors5(spec);
  return frame3(spec, "slide-2", [
    box({ position: "absolute", left: 86, top: 118, width: 302, height: 302, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 3, borderColor: theme8.navy }),
    box({ position: "absolute", left: 122, top: 154, width: 230, height: 230, backgroundColor: theme8.lavender, borderWidth: 4, borderColor: theme8.navy }),
    box({ position: "absolute", left: 170, top: 188, width: 44, height: 44, backgroundColor: theme8.navy }),
    box({ position: "absolute", left: 260, top: 188, width: 44, height: 44, backgroundColor: theme8.navy }),
    box({ position: "absolute", left: 196, top: 286, width: 82, height: 14, backgroundColor: theme8.navy }),
    ...bracket(theme8, 74, 106, 326, 326, theme8.yellow),
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-2"].eyebrow), spec, { position: "absolute", left: 500, top: 132 }),
    headline2(value3(spec, "title", DEFAULTS5["slide-2"].title), spec, { position: "absolute", left: 500, top: 178, width: 340, fontSize: 34 }),
    body4(value3(spec, "body", DEFAULTS5["slide-2"].body), spec, { position: "absolute", left: 500, top: 264, width: 342, fontSize: 14, lineHeight: 1.42 }),
    body4(value3(spec, "body2", DEFAULTS5["slide-2"].body2), spec, { position: "absolute", left: 500, top: 372, width: 342, fontSize: 14, lineHeight: 1.42 })
  ]);
}
function icon(kind, theme8) {
  if (kind === "diamond") return box({ width: 34, height: 34, backgroundColor: theme8.pink, transform: "rotate(45deg)" });
  if (kind === "cross") {
    return box({ position: "relative", width: 42, height: 42 }, [
      box({ position: "absolute", left: 15, top: 0, width: 12, height: 42, backgroundColor: theme8.yellow }),
      box({ position: "absolute", left: 0, top: 15, width: 42, height: 12, backgroundColor: theme8.yellow })
    ]);
  }
  if (kind === "circle") return box({ width: 42, height: 42, borderRadius: 21, backgroundColor: theme8.cyan, borderWidth: 4, borderColor: theme8.navy });
  return box({ width: 40, height: 40, backgroundColor: theme8.cyan, borderWidth: 4, borderColor: theme8.navy });
}
function renderFeatureGrid(spec) {
  const theme8 = colors5(spec);
  const items = objectItems(spec, "items", DEFAULTS5["slide-3"].items).slice(0, 4);
  return frame3(spec, "slide-3", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-3"].eyebrow), spec, { position: "absolute", left: 384, top: 56, color: theme8.cyan }),
    headline2(value3(spec, "title", DEFAULTS5["slide-3"].title), spec, { position: "absolute", left: 250, top: 100, width: 460, textAlign: "center" }),
    box(
      { position: "absolute", left: 92, top: 182, width: 776, flexDirection: "row", flexWrap: "wrap", gap: 24 },
      items.map(
        (item, index) => box(
          {
            position: "relative",
            width: 376,
            height: 126,
            backgroundColor: "rgba(255,255,255,0.18)",
            borderWidth: 2,
            borderColor: "rgba(15,27,61,0.28)",
            padding: "24px 22px",
            flexDirection: "row",
            gap: 18
          },
          [
            box({ width: 58, height: 78, alignItems: "center", justifyContent: "center" }, [icon(["cube", "diamond", "cross", "circle"][index], theme8)]),
            box({ flexDirection: "column", width: 250 }, [
              TextBlock(item.title || `Module ${index + 1}`, {
                color: theme8.navy,
                fontSize: 20,
                lineHeight: 1.1,
                marginBottom: 8,
                ...role5("display", spec, { fontSize: 20, lineHeight: 1.1, fontWeight: 800 })
              }),
              body4(item.body || "", spec, { width: 250, fontSize: 12.5, lineHeight: 1.35 })
            ]),
            ...bracket(theme8, 8, 8, 360, 110, index % 2 ? theme8.pink : theme8.navy)
          ]
        )
      )
    )
  ]);
}
function asMetricList(spec, key, fallback2) {
  return objectItems(spec, key, fallback2).map((item, index) => ({
    label: item.label || item.name || `Item ${index + 1}`,
    value: Number.parseFloat(String(item.value || item.amount || item.score || 0)) || 0,
    raw: String(item.value || item.amount || item.score || "")
  }));
}
function renderVerticalChart(spec) {
  const theme8 = colors5(spec);
  const metrics = asMetricList(spec, "metrics", DEFAULTS5["slide-4"].metrics).slice(0, 5);
  return frame3(spec, "slide-4", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-4"].eyebrow), spec, { position: "absolute", left: 84, top: 84 }),
    Title(value3(spec, "title", DEFAULTS5["slide-4"].title), {
      position: "absolute",
      left: 84,
      top: 126,
      width: 360,
      color: theme8.cyan,
      fontSize: 42,
      lineHeight: 1.05,
      ...role5("display", spec, { fontSize: 42, lineHeight: 1.05, fontWeight: 900 })
    }),
    TextBlock(value3(spec, "subtitle", DEFAULTS5["slide-4"].subtitle), {
      position: "absolute",
      left: 84,
      top: 254,
      width: 330,
      color: "rgba(255,255,255,0.56)",
      fontSize: 13,
      lineHeight: 1.45,
      ...role5("body", spec, { fontSize: 13, lineHeight: 1.45, fontWeight: 400 })
    }),
    box(
      { position: "absolute", left: 470, top: 96, width: 370, height: 330, flexDirection: "row", alignItems: "flex-end", gap: 22 },
      metrics.map((item, index) => {
        const height = Math.max(70, Math.min(245, item.value * 2.5));
        const color = [theme8.cyan, theme8.pink, theme8.yellow][index % 3];
        return box({ width: 54, height: 300, flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }, [
          TextBlock(String(item.raw || item.value), {
            width: 54,
            height: 18,
            color,
            fontSize: 11,
            textAlign: "center",
            ...role5("metric", spec, { fontSize: 11, lineHeight: 1, fontWeight: 800 })
          }),
          box({ width: 44, height, backgroundColor: color, borderWidth: 3, borderColor: theme8.navy, marginTop: 6 }),
          TextBlock(upper(item.label), {
            width: 74,
            color: theme8.lavender,
            fontSize: 8,
            textAlign: "center",
            marginTop: 10,
            letterSpacing: 1,
            ...role5("label", spec, { fontSize: 8, lineHeight: 1.1, fontWeight: 700 })
          })
        ]);
      })
    )
  ]);
}
function renderHorizontalChart(spec) {
  const theme8 = colors5(spec);
  const metrics = asMetricList(spec, "metrics", DEFAULTS5["slide-5"].metrics).slice(0, 5);
  return frame3(spec, "slide-5", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-5"].eyebrow), spec, { position: "absolute", left: 370, top: 58, color: theme8.yellow }),
    headline2(value3(spec, "title", DEFAULTS5["slide-5"].title), spec, { position: "absolute", left: 210, top: 102, width: 540, textAlign: "center" }),
    body4(value3(spec, "subtitle", DEFAULTS5["slide-5"].subtitle), spec, { position: "absolute", left: 258, top: 158, width: 444, textAlign: "center", color: "rgba(15,27,61,0.62)" }),
    box(
      { position: "absolute", left: 140, top: 226, width: 680, flexDirection: "column", gap: 18 },
      metrics.map((item, index) => {
        const width = Math.max(130, Math.min(454, item.value * 4.8));
        const color = [theme8.navy, theme8.pink, theme8.yellow][index % 3];
        return box({ width: 680, height: 34, flexDirection: "row", alignItems: "center", gap: 16 }, [
          TextBlock(upper(item.label), {
            width: 94,
            color: theme8.navy,
            fontSize: 10,
            letterSpacing: 1,
            ...role5("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 })
          }),
          box({ width: 470, height: 26, backgroundColor: "rgba(15,27,61,0.12)" }, [
            box({ width, height: 26, backgroundColor: color })
          ]),
          TextBlock(`${item.raw || item.value}%`, {
            width: 55,
            color: theme8.navy,
            fontSize: 12,
            textAlign: "right",
            ...role5("metric", spec, { fontSize: 12, lineHeight: 1, fontWeight: 900 })
          })
        ]);
      })
    )
  ]);
}
function renderTimeline4(spec) {
  const theme8 = colors5(spec);
  const items = objectItems(spec, "timeline", DEFAULTS5["slide-6"].timeline).slice(0, 4);
  return frame3(spec, "slide-6", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-6"].eyebrow), spec, { position: "absolute", left: 394, top: 52 }),
    headline2(value3(spec, "title", DEFAULTS5["slide-6"].title), spec, { position: "absolute", left: 220, top: 96, width: 520, textAlign: "center" }),
    box({ position: "absolute", left: 478, top: 176, width: 4, height: 294, backgroundColor: theme8.navy, opacity: 0.76 }),
    ...items.flatMap((item, index) => {
      const top = 172 + index * 76;
      const left = index % 2 === 0 ? 112 : 542;
      return [
        box({ position: "absolute", left: 466, top: top + 20, width: 28, height: 28, backgroundColor: index < 2 ? theme8.yellow : theme8.cyan, borderWidth: 4, borderColor: theme8.navy }),
        box({ position: "absolute", left, top, width: 318, height: 64, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 2, borderColor: theme8.navy, padding: "10px 14px", flexDirection: "column" }, [
          TextBlock(upper(item.date || `Q${index + 1}`), {
            color: theme8.navy,
            fontSize: 9,
            letterSpacing: 1,
            marginBottom: 5,
            ...role5("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 800 })
          }),
          TextBlock(item.title || `Step ${index + 1}`, {
            color: theme8.navy,
            fontSize: 14,
            lineHeight: 1.1,
            marginBottom: 4,
            ...role5("display", spec, { fontSize: 14, lineHeight: 1.1, fontWeight: 800 })
          }),
          body4(item.body || "", spec, { width: 286, fontSize: 10, lineHeight: 1.22 })
        ])
      ];
    })
  ]);
}
function renderStats2(spec) {
  const theme8 = colors5(spec);
  const metrics = objectItems(spec, "metrics", DEFAULTS5["slide-7"].metrics).slice(0, 4);
  return frame3(spec, "slide-7", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-7"].eyebrow), spec, { position: "absolute", left: 388, top: 66 }),
    Title(value3(spec, "title", DEFAULTS5["slide-7"].title), {
      position: "absolute",
      left: 220,
      top: 112,
      width: 520,
      color: theme8.cyan,
      textAlign: "center",
      fontSize: 42,
      lineHeight: 1,
      ...role5("display", spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 })
    }),
    TextBlock(value3(spec, "subtitle", DEFAULTS5["slide-7"].subtitle), {
      position: "absolute",
      left: 250,
      top: 166,
      width: 460,
      color: "rgba(255,255,255,0.56)",
      textAlign: "center",
      fontSize: 13,
      ...role5("body", spec, { fontSize: 13, lineHeight: 1.3, fontWeight: 400 })
    }),
    box(
      { position: "absolute", left: 110, top: 242, width: 740, flexDirection: "row", gap: 22 },
      metrics.map(
        (item, index) => box({ position: "relative", width: 168, height: 132, backgroundColor: "rgba(94,220,244,0.09)", borderWidth: 2, borderColor: "rgba(94,220,244,0.32)", padding: "26px 12px", alignItems: "center", flexDirection: "column" }, [
          ...bracket(theme8, 8, 8, 152, 116, [theme8.cyan, theme8.pink, theme8.yellow, theme8.cyan][index]),
          TextBlock(String(item.value || ""), {
            width: 140,
            color: [theme8.cyan, theme8.pink, theme8.yellow, theme8.cyan][index],
            fontSize: 38,
            lineHeight: 1,
            textAlign: "center",
            ...role5("metric", spec, { fontSize: 38, lineHeight: 1, fontWeight: 900 })
          }),
          TextBlock(upper(item.label || ""), {
            width: 136,
            color: theme8.lavender,
            fontSize: 9,
            letterSpacing: 1,
            textAlign: "center",
            marginTop: 12,
            ...role5("label", spec, { fontSize: 9, lineHeight: 1.1, fontWeight: 700 })
          })
        ])
      )
    )
  ]);
}
function renderQuote6(spec) {
  const theme8 = colors5(spec);
  return frame3(spec, "slide-8", [
    box({ position: "absolute", left: 122, top: 98, width: 716, height: 338, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 3, borderColor: theme8.navy }),
    ...bracket(theme8, 106, 82, 748, 370, theme8.navy),
    TextBlock('"', {
      position: "absolute",
      left: 164,
      top: 116,
      width: 80,
      color: theme8.pink,
      fontSize: 88,
      lineHeight: 1,
      ...role5("display", spec, { fontSize: 88, lineHeight: 1, fontWeight: 900 })
    }),
    TextBlock(value3(spec, "quote", DEFAULTS5["slide-8"].quote), {
      position: "absolute",
      left: 222,
      top: 154,
      width: 540,
      color: theme8.navy,
      fontSize: 24,
      lineHeight: 1.48,
      textAlign: "center",
      ...role5("body", spec, { fontSize: 24, lineHeight: 1.48, fontWeight: 500 })
    }),
    box({ position: "absolute", left: 350, top: 346, width: 260, height: 4, backgroundColor: theme8.pink }),
    TextBlock(value3(spec, "author", DEFAULTS5["slide-8"].author), {
      position: "absolute",
      left: 246,
      top: 374,
      width: 468,
      color: theme8.navy,
      fontSize: 11,
      textAlign: "center",
      letterSpacing: 2,
      ...role5("label", spec, { fontSize: 11, lineHeight: 1, fontWeight: 800 })
    })
  ]);
}
function renderTiers(spec) {
  const theme8 = colors5(spec);
  const tiers = objectItems(spec, "tiers", DEFAULTS5["slide-9"].tiers).slice(0, 3);
  return frame3(spec, "slide-9", [
    label4(value3(spec, "eyebrow", DEFAULTS5["slide-9"].eyebrow), spec, { position: "absolute", left: 394, top: 48, color: theme8.pink }),
    headline2(value3(spec, "title", DEFAULTS5["slide-9"].title), spec, { position: "absolute", left: 240, top: 92, width: 480, textAlign: "center" }),
    box(
      { position: "absolute", left: 86, top: 164, width: 788, flexDirection: "row", gap: 22 },
      tiers.map(
        (tier, index) => box({ width: 248, height: index === 1 ? 302 : 278, backgroundColor: index === 1 ? theme8.navy : "rgba(255,255,255,0.18)", borderWidth: 3, borderColor: theme8.navy, padding: "24px 18px", flexDirection: "column" }, [
          TextBlock(upper(tier.name || `Tier ${index + 1}`), {
            color: index === 1 ? theme8.yellow : theme8.navy,
            fontSize: 14,
            letterSpacing: 2,
            marginBottom: 12,
            ...role5("label", spec, { fontSize: 14, lineHeight: 1, fontWeight: 900 })
          }),
          TextBlock(String(tier.price || ""), {
            color: index === 1 ? theme8.pink : theme8.navy,
            fontSize: 40,
            lineHeight: 1,
            marginBottom: 12,
            ...role5("metric", spec, { fontSize: 40, lineHeight: 1, fontWeight: 900 })
          }),
          body4(tier.desc || "", spec, { color: index === 1 ? "rgba(255,255,255,0.72)" : "rgba(15,27,61,0.7)", width: 206, fontSize: 11.5, lineHeight: 1.32, marginBottom: 14 }),
          ...(tier.features || []).slice(0, 4).map(
            (feature) => TextBlock(`> ${feature}`, {
              color: index === 1 ? theme8.lavender : theme8.navy,
              fontSize: 9.5,
              lineHeight: 1.25,
              marginBottom: 7,
              ...role5("label", spec, { fontSize: 9.5, lineHeight: 1.25, fontWeight: 500 })
            })
          ),
          box({ marginTop: 10 }, [pixelButton("Select", spec, { width: 132, variant: index === 1 ? "pink" : "cyan" })])
        ])
      )
    )
  ]);
}
function renderClosing3(spec) {
  const theme8 = colors5(spec);
  const ctas = array4(spec, "ctas", DEFAULTS5["slide-10"].ctas).slice(0, 2);
  return frame3(
    spec,
    "slide-10",
    [
      ...particleLayer(theme8),
      box({ position: "absolute", left: 0, bottom: 0, width: 960, height: 78, backgroundColor: theme8.navy, opacity: 0.72 }),
      box({ position: "absolute", left: 90, bottom: 74, width: 70, height: 44, backgroundColor: theme8.cyan }),
      box({ position: "absolute", left: 160, bottom: 74, width: 96, height: 68, backgroundColor: theme8.pink }),
      box({ position: "absolute", right: 168, bottom: 74, width: 130, height: 92, backgroundColor: theme8.yellow }),
      ...pixelShadowText(splitTitle(value3(spec, "title", DEFAULTS5["slide-10"].title)), spec, {
        position: "absolute",
        left: 190,
        top: 72,
        width: 580,
        fontSize: 52,
        lineHeight: 0.96
      }),
      TextBlock(value3(spec, "subtitle", DEFAULTS5["slide-10"].subtitle), {
        position: "absolute",
        left: 286,
        top: 356,
        width: 388,
        color: theme8.lavender,
        fontSize: 15,
        lineHeight: 1.52,
        textAlign: "center",
        ...role5("body", spec, { fontSize: 15, lineHeight: 1.52, fontWeight: 500 })
      }),
      box({ position: "absolute", left: 286, top: 454, flexDirection: "row", gap: 34 }, ctas.map((cta2, index) => pixelButton(cta2, spec, { width: 178, variant: index === 1 ? "pink" : "cyan" })))
    ],
    { particles: true }
  );
}
var RENDERERS4 = {
  "slide-1": renderCover6,
  "slide-2": renderSplitIntro,
  "slide-3": renderFeatureGrid,
  "slide-4": renderVerticalChart,
  "slide-5": renderHorizontalChart,
  "slide-6": renderTimeline4,
  "slide-7": renderStats2,
  "slide-8": renderQuote6,
  "slide-9": renderTiers,
  "slide-10": renderClosing3
};
function renderPixelOrbitConsole(spec) {
  const variant = normalizeVariant6(spec);
  return (RENDERERS4[variant] || renderCover6)(spec);
}

// templates/beautiful/biennale-programme-poster.mjs
var templateId8 = "biennale-programme-poster";
var PAGE_VARIANTS7 = ["cover", "manifesto", "programme", "chapter", "data", "quote", "cal", "colophon"];
var rendererContract8 = {
  template_id: templateId8,
  renderer_id: `artboard_satori.${templateId8}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "biennale-yellow",
  implemented_page_variants: PAGE_VARIANTS7,
  page_family: {
    family_id: "biennale-yellow",
    supported_page_variants: PAGE_VARIANTS7,
    variant_usage_policy: {
      singletons: ["cover", "colophon"],
      repeatable: ["manifesto", "programme", "chapter", "data", "quote", "cal"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/biennale-yellow-1.png"
};
var CANVAS4 = { width: 960, height: 540 };
var DEFAULTS6 = {
  "cover": {
    date: "02.05-\n11.10.2026",
    eyebrow: "Annual Survey \xB7 Issue No. 04",
    title: "Aurora Programme",
    footer_items: [
      { heading: "Hosted by", body: "Aurora Institute for Public Form" },
      { heading: "Edition", body: "Fourth annual open programme" },
      { heading: "Reading", body: "A field study of light, matter and atmosphere" },
      { heading: "Notes", body: "Six months of exhibitions, residencies and public lectures across three pavilions." }
    ]
  },
  "manifesto": {
    quote: "A room is a slow argument with the sun. We have spent four years listening for what it answers.",
    author: "From the Aurora Charter, 2023"
  },
  "programme": {
    kicker: "Strands \xB7 2026",
    title: "Programme",
    meta: "Six interlocking strands run across the year. Each is independently curated, but every strand answers to the same question: what does light know that we don't?",
    strands: [
      { num: "01", title: "Slow Atmospheres", body: "A reading room of long-form essays, drawings and weather notebooks, organised around the changing yellow of late afternoon." },
      { num: "02", title: "Public Form", body: "Three commissions in three pavilions, each examining how a public square wears its own light over the course of a season." },
      { num: "03", title: "Field Notes", body: "A residency programme drawing artists, architects and meteorologists together for a hundred days of recording, drawing and arguing." },
      { num: "04", title: "Quiet Editions", body: "A typographic publishing strand committed to printing only what asks to be read in daylight, on warm paper, slowly." },
      { num: "05", title: "Open Conversations", body: "Twelve evenings of public talks, paired with a meal and a question: what is the weather like in your work?" }
    ]
  },
  "chapter": {
    rail: "First Chapter - Slow Atmospheres",
    number: "01",
    title: "A reading of the season's quietest hours",
    lede: "In its first chapter the Aurora Programme convenes around the slowest light of the year: the long minutes after the sun has gone but before the room has admitted it."
  },
  "data": {
    title: "Public attendance",
    label: "Open programme \xB7 2022-2026",
    stats: [
      { value: "182 k", label: "Visitors \xB7 Year four", body: "A 2.4x rise on the inaugural year, drawn from a programme that grew slower than the audience." },
      { value: "74%", label: "Returning audience", body: "Three quarters of last year's visitors came back; nearly half came back twice." }
    ],
    rows: [
      { year: "2022", value: "76,400", pct: 42 },
      { year: "2023", value: "112,800", pct: 62 },
      { year: "2024", value: "141,200", pct: 78 },
      { year: "2025", value: "164,900", pct: 91 },
      { year: "2026", value: "182,300", pct: 100 }
    ]
  },
  "quote": {
    kicker: "A note from the curator",
    quote: "The yellow we use is not the yellow we mean. It is the yellow that arrives ten minutes after we leave the building.",
    who: "Idun Reijners",
    role: "Curator-at-large, Aurora Institute \xB7 letter to the editorial board, January 2026"
  },
  "cal": {
    title: "Public calendar",
    label: "Selected dates \xB7 May-October",
    rows: [
      ["02.05", "The Long Yellow, opening lecture", "Pavilion of Quiet Form, Rotterdam", "90 min"],
      ["17.05", "A walk through the season's first room", "Reading Garden, Pavilion North", "2 hr"],
      ["06.06", "Public Form 01 - opening", "Square of the Slow Sun, Antwerp", "All day"],
      ["28.06", "Field Notes residency, week one supper", "House of the Half Window", "3 hr"],
      ["19.07", "A Letter to the Sun, evening reading", "Aurora Library, room 3", "75 min"],
      ["14.08", "Quiet Editions - print fair & book launch", "Type Garden, Pavilion South", "2 days"],
      ["22.09", "Open Conversations \xB7 meteorology & drawing", "Reading Room, ground floor", "2 hr"],
      ["11.10", "The Last Window, closing performance", "Pavilion of Quiet Form, Rotterdam", "60 min"]
    ]
  },
  "colophon": {
    kicker: "Colophon \xB7 Programme 04",
    title: "With thanks to the slow readers.",
    footer_items: [
      { heading: "Curated by", body: "Idun Reijners with the editorial board" },
      { heading: "Designed", body: "In daylight, on warm paper, over fourteen weeks" },
      { heading: "Hosts", body: "Aurora Institute\nPavilion of Quiet Form\nReading Garden" },
      { heading: "Until next year", body: "The fifth programme opens in May 2027. Look for the yellow on the door." }
    ]
  }
};
function colors6(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || "#E9E5DB",
    paperDeep: source.surface || "#DCD6C4",
    sun: source.primary || "#F1EE2E",
    sunSoft: source.sun_soft || "#F8F39B",
    haze: source.accent || "#F0DA7C",
    ink: source.text || "#1B2566",
    ember: source.ember || "#E26B4A"
  };
}
function role6(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value4(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array5(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray3(spec, key, fallback2 = []) {
  return array5(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function upper2(input) {
  return String(input || "").toUpperCase();
}
function variantPage2(variant) {
  return PAGE_VARIANTS7.indexOf(variant) + 1;
}
function normalizeVariant7(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS7.length) return PAGE_VARIANTS7[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.page_family_source?.source_class || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS7) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant.replace("s-", ""))) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("manifesto") || raw.includes("quote") || raw.includes("statement")) return "manifesto";
  if (raw.includes("programme") || raw.includes("agenda")) return "programme";
  if (raw.includes("chapter") || raw.includes("section")) return "chapter";
  if (raw.includes("data") || raw.includes("chart")) return "data";
  if (raw.includes("calendar") || raw.includes("timeline") || raw.includes("schedule")) return "cal";
  if (raw.includes("closing") || raw.includes("colophon")) return "colophon";
  return "cover";
}
function pageNumber(spec, variant) {
  const page18 = spec.page_family_source?.source_slide_index || variantPage2(variant);
  return `${String(page18).padStart(2, "0")} / ${String(PAGE_VARIANTS7.length).padStart(2, "0")}`;
}
function frame4(spec, variant, children = []) {
  const theme8 = colors6(spec);
  return box(
    {
      width: CANVAS4.width,
      height: CANVAS4.height,
      position: "relative",
      backgroundColor: theme8.paper,
      color: theme8.ink,
      overflow: "hidden"
    },
    [
      ...textureDots(theme8),
      ...children,
      TextBlock(pageNumber(spec, variant), {
        position: "absolute",
        right: 26,
        bottom: 16,
        width: 64,
        color: theme8.ink,
        opacity: 0.75,
        fontSize: 9,
        textAlign: "right",
        letterSpacing: 0.8,
        ...role6("metric", spec, { fontSize: 9, lineHeight: 1, fontWeight: 500 })
      })
    ]
  );
}
function glow(theme8, left, top, width, height, opacity = 0.55, color = theme8.sun) {
  return box({
    position: "absolute",
    left,
    top,
    width,
    height,
    borderRadius: Math.max(width, height),
    backgroundColor: color,
    opacity
  });
}
function textureDots(theme8) {
  return Array.from(
    { length: 10 },
    (_, index) => box({
      position: "absolute",
      left: 806 + index % 5 * 16,
      top: 418 + Math.floor(index / 5) * 16,
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme8.ink,
      opacity: 0.28
    })
  );
}
function blockTiles(theme8, mode = "cover") {
  if (mode === "colophon") {
    return [
      box({ position: "absolute", left: 0, top: 0, width: 480, height: 135, backgroundColor: theme8.sun, opacity: 0.55 }),
      box({ position: "absolute", right: 0, top: 270, width: 240, height: 202, backgroundColor: theme8.sun, opacity: 0.4 })
    ];
  }
  return [
    box({ position: "absolute", left: 0, top: 135, width: 240, height: 202, backgroundColor: theme8.sun, opacity: 0.55 }),
    box({ position: "absolute", right: 0, top: 0, width: 240, height: 202, backgroundColor: theme8.sun, opacity: 0.4 }),
    box({ position: "absolute", left: 0, top: 337, width: 480, height: 203, backgroundColor: theme8.sun, opacity: 0.7 }),
    box({ position: "absolute", left: 480, top: 337, width: 480, height: 135, backgroundColor: theme8.sun, opacity: 0.45 })
  ];
}
function caption(text10, spec, style = {}) {
  const theme8 = colors6(spec);
  return TextBlock(upper2(text10), {
    color: theme8.ink,
    fontSize: 10,
    lineHeight: 1.2,
    letterSpacing: 1.8,
    ...role6("label", spec, { fontSize: 10, lineHeight: 1.2, fontWeight: 700 }),
    ...style
  });
}
function bodyText3(text10, spec, style = {}) {
  const theme8 = colors6(spec);
  return TextBlock(text10, {
    color: theme8.ink,
    fontSize: 13,
    lineHeight: 1.5,
    ...role6("body", spec, { fontSize: 13, lineHeight: 1.5, fontWeight: 400 }),
    ...style
  });
}
function serifText(text10, spec, style = {}) {
  const theme8 = colors6(spec);
  return Title(text10, {
    color: theme8.ink,
    fontSize: 42,
    lineHeight: 1,
    ...role6("display", spec, { fontSize: 42, lineHeight: 1, fontWeight: 400, textTransform: "none" }),
    ...style
  });
}
function footerItem(spec, item, left, width, bottom = 50) {
  const theme8 = colors6(spec);
  return box(
    {
      position: "absolute",
      left,
      bottom,
      width,
      height: 76,
      flexDirection: "column",
      borderTopWidth: 1,
      borderTopColor: theme8.ink,
      paddingTop: 10
    },
    [
      caption(item.heading || "Field", spec, { fontSize: 8.5, marginBottom: 7, letterSpacing: 1.4 }),
      bodyText3(item.body || "", spec, { width, fontSize: 10.5, lineHeight: 1.42, whiteSpace: "pre-line" })
    ]
  );
}
function renderCover7(spec) {
  const theme8 = colors6(spec);
  const title2 = value4(spec, "title", DEFAULTS6["cover"].title);
  const footer4 = objectArray3(spec, "footer_items", DEFAULTS6["cover"].footer_items);
  return frame4(spec, "cover", [
    ...blockTiles(theme8),
    glow(theme8, 248, 76, 520, 360, 0.5),
    glow(theme8, 760, -40, 260, 210, 0.18, theme8.ember),
    TextBlock(value4(spec, "date", DEFAULTS6["cover"].date), {
      position: "absolute",
      right: 54,
      top: 30,
      width: 236,
      color: theme8.ink,
      fontSize: 52,
      lineHeight: 0.94,
      textAlign: "right",
      whiteSpace: "pre-line",
      ...role6("display", spec, { fontSize: 52, lineHeight: 0.94, fontWeight: 400 })
    }),
    serifText(title2, spec, { position: "absolute", left: 42, top: 204, width: 804, fontSize: 92, lineHeight: 0.9 }),
    caption(value4(spec, "eyebrow", DEFAULTS6["cover"].eyebrow), spec, { position: "absolute", left: 46, top: 348, width: 420, fontSize: 9 }),
    footerItem(spec, footer4[0] || {}, 42, 152),
    footerItem(spec, footer4[1] || {}, 218, 138),
    footerItem(spec, footer4[2] || {}, 380, 190),
    footerItem(spec, footer4[3] || {}, 594, 318)
  ]);
}
function renderManifesto2(spec) {
  const theme8 = colors6(spec);
  return frame4(spec, "manifesto", [
    glow(theme8, 140, 42, 680, 430, 0.36),
    glow(theme8, -170, 360, 360, 260, 0.14, theme8.ember),
    TextBlock(value4(spec, "quote", DEFAULTS6["manifesto"].quote), {
      position: "absolute",
      left: 108,
      top: 158,
      width: 744,
      color: theme8.ink,
      fontSize: 52,
      lineHeight: 1.1,
      ...role6("display", spec, { fontSize: 52, lineHeight: 1.1, fontWeight: 400, fontStyle: "italic", textTransform: "none" })
    }),
    caption(value4(spec, "author", DEFAULTS6["manifesto"].author), spec, { position: "absolute", left: 52, bottom: 74, width: 360 })
  ]);
}
function renderProgramme(spec) {
  const theme8 = colors6(spec);
  const strands = objectArray3(spec, "strands", DEFAULTS6["programme"].strands).slice(0, 5);
  return frame4(spec, "programme", [
    box({ position: "absolute", left: 0, top: 0, width: 480, height: 540, backgroundColor: theme8.sun }),
    caption(value4(spec, "kicker", DEFAULTS6["programme"].kicker), spec, { position: "absolute", left: 58, top: 58, width: 310 }),
    serifText(value4(spec, "title", DEFAULTS6["programme"].title), spec, { position: "absolute", left: 58, top: 218, width: 360, fontSize: 92, lineHeight: 0.88 }),
    bodyText3(value4(spec, "meta", DEFAULTS6["programme"].meta), spec, { position: "absolute", left: 58, top: 402, width: 336, fontSize: 12.5, lineHeight: 1.45 }),
    caption("Strand \xB7 Title \xB7 Anchor", spec, {
      position: "absolute",
      left: 536,
      top: 58,
      width: 344,
      height: 30,
      borderBottomWidth: 1,
      borderBottomColor: theme8.ink
    }),
    box(
      { position: "absolute", left: 536, top: 108, width: 356, flexDirection: "column", gap: 8 },
      strands.map(
        (item) => box(
          {
            width: 356,
            minHeight: 54,
            flexDirection: "row",
            gap: 14,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(27,37,102,0.18)",
            paddingBottom: 8
          },
          [
            serifText(item.num || "01", spec, { width: 42, fontSize: 24, lineHeight: 1 }),
            box({ width: 294, flexDirection: "column" }, [
              serifText(item.title || "", spec, { width: 294, fontSize: 18, lineHeight: 1.05, marginBottom: 3 }),
              bodyText3(item.body || "", spec, { width: 286, fontSize: 9.8, lineHeight: 1.24 })
            ])
          ]
        )
      )
    )
  ]);
}
function renderChapter2(spec) {
  const theme8 = colors6(spec);
  return frame4(spec, "chapter", [
    glow(theme8, -150, -120, 500, 380, 0.36),
    glow(theme8, 760, 408, 360, 260, 0.13, theme8.ember),
    caption(value4(spec, "rail", DEFAULTS6["chapter"].rail), spec, {
      position: "absolute",
      left: -142,
      top: 270,
      width: 340,
      transform: "rotate(-90deg)",
      letterSpacing: 2.6
    }),
    serifText(value4(spec, "number", DEFAULTS6["chapter"].number), spec, {
      position: "absolute",
      left: 142,
      top: 60,
      width: 420,
      fontSize: 218,
      lineHeight: 0.82
    }),
    serifText(value4(spec, "title", DEFAULTS6["chapter"].title), spec, {
      position: "absolute",
      left: 152,
      top: 282,
      width: 620,
      fontSize: 44,
      lineHeight: 1.05
    }),
    bodyText3(value4(spec, "lede", DEFAULTS6["chapter"].lede), spec, {
      position: "absolute",
      left: 154,
      top: 382,
      width: 512,
      fontSize: 13.5,
      lineHeight: 1.5
    })
  ]);
}
function renderData(spec) {
  const theme8 = colors6(spec);
  const stats2 = objectArray3(spec, "stats", DEFAULTS6["data"].stats).slice(0, 2);
  const rows = objectArray3(spec, "rows", DEFAULTS6["data"].rows).slice(0, 5);
  return frame4(spec, "data", [
    glow(theme8, 700, -90, 420, 260, 0.32),
    box({ position: "absolute", left: 58, top: 58, width: 844, height: 78, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: theme8.ink, paddingBottom: 16 }, [
      serifText(value4(spec, "title", DEFAULTS6["data"].title), spec, { width: 360, fontSize: 38, lineHeight: 1 }),
      caption(value4(spec, "label", DEFAULTS6["data"].label), spec, { width: 300, textAlign: "right" })
    ]),
    box(
      { position: "absolute", left: 62, top: 178, width: 300, flexDirection: "column", gap: 30 },
      stats2.map(
        (item) => box({ width: 300, flexDirection: "column" }, [
          serifText(item.value || "", spec, { width: 220, fontSize: 72, lineHeight: 0.9 }),
          caption(item.label || "", spec, { fontSize: 9, marginTop: 4, marginBottom: 8 }),
          bodyText3(item.body || "", spec, { width: 276, fontSize: 11.5, lineHeight: 1.38 })
        ])
      )
    ),
    box(
      { position: "absolute", left: 432, top: 188, width: 432, flexDirection: "column", gap: 18 },
      rows.map((item) => {
        const pct = Math.max(16, Math.min(100, Number(item.pct || 50)));
        return box({ width: 432, height: 30, flexDirection: "row", alignItems: "center", gap: 16 }, [
          TextBlock(item.year || "", { width: 54, color: theme8.ink, fontSize: 11, ...role6("metric", spec, { fontSize: 11, lineHeight: 1, fontWeight: 500 }) }),
          box({ width: 250, height: 18, backgroundColor: "rgba(27,37,102,0.12)" }, [
            box({ width: Math.round(pct / 100 * 250), height: 18, backgroundColor: pct >= 96 ? theme8.sun : theme8.ink, borderWidth: pct >= 96 ? 1 : 0, borderColor: theme8.ink })
          ]),
          TextBlock(item.value || "", { width: 86, color: theme8.ink, fontSize: 11, textAlign: "right", ...role6("metric", spec, { fontSize: 11, lineHeight: 1, fontWeight: 500 }) })
        ]);
      })
    )
  ]);
}
function renderQuote7(spec) {
  const theme8 = colors6(spec);
  return frame4(spec, "quote", [
    box({ position: "absolute", right: 0, top: 0, width: 308, height: 540, backgroundColor: theme8.sun }),
    glow(theme8, -120, 374, 420, 260, 0.22),
    box({ position: "absolute", left: 54, top: 132, width: 538, flexDirection: "column" }, [
      caption(value4(spec, "kicker", DEFAULTS6["quote"].kicker), spec, { marginBottom: 22 }),
      TextBlock(value4(spec, "quote", DEFAULTS6["quote"].quote), {
        width: 520,
        color: theme8.ink,
        fontSize: 43,
        lineHeight: 1.08,
        ...role6("display", spec, { fontSize: 43, lineHeight: 1.08, fontWeight: 400, fontStyle: "italic", textTransform: "none" })
      }),
      box({ width: 518, marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme8.ink, flexDirection: "row", gap: 20 }, [
        caption(value4(spec, "who", DEFAULTS6["quote"].who), spec, { width: 150, letterSpacing: 1.4 }),
        bodyText3(value4(spec, "role", DEFAULTS6["quote"].role), spec, { width: 332, fontSize: 11, lineHeight: 1.35, opacity: 0.75 })
      ])
    ]),
    serifText(value4(spec, "mark", "\xA8"), spec, { position: "absolute", right: 68, bottom: 82, width: 150, fontSize: 136, lineHeight: 0.8 })
  ]);
}
function renderCalendar(spec) {
  const theme8 = colors6(spec);
  const rows = array5(spec, "rows", DEFAULTS6["cal"].rows).slice(0, 8);
  return frame4(spec, "cal", [
    glow(theme8, 730, -120, 430, 260, 0.28),
    box({ position: "absolute", left: 58, top: 56, width: 844, height: 70, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: theme8.ink, paddingBottom: 14 }, [
      serifText(value4(spec, "title", DEFAULTS6["cal"].title), spec, { width: 360, fontSize: 42, lineHeight: 1 }),
      caption(value4(spec, "label", DEFAULTS6["cal"].label), spec, { width: 300, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 58, top: 146, width: 844, flexDirection: "column" }, [
      ledgerRow(spec, ["Date", "Title", "Venue", "Length"], true),
      ...rows.map((row) => ledgerRow(spec, row, false))
    ])
  ]);
}
function ledgerRow(spec, row, header) {
  const theme8 = colors6(spec);
  const values = Array.isArray(row) ? row : [row.date, row.title, row.venue, row.length];
  return box(
    {
      width: 844,
      minHeight: header ? 30 : 38,
      flexDirection: "row",
      gap: 18,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: header ? theme8.ink : "rgba(27,37,102,0.2)",
      padding: header ? "4px 0 8px 0" : "8px 0"
    },
    [
      TextBlock(String(values[0] || ""), { width: 74, color: theme8.ink, fontSize: header ? 9 : 11, letterSpacing: 0.8, ...role6("metric", spec, { fontSize: header ? 9 : 11, lineHeight: 1, fontWeight: header ? 700 : 500 }) }),
      TextBlock(String(values[1] || ""), { width: 334, color: theme8.ink, fontSize: header ? 9 : 17, lineHeight: 1.15, letterSpacing: header ? 1.2 : 0, ...role6(header ? "label" : "display", spec, { fontSize: header ? 9 : 17, lineHeight: 1.15, fontWeight: header ? 700 : 400 }) }),
      bodyText3(String(values[2] || ""), spec, { width: 244, fontSize: header ? 9 : 11.5, lineHeight: 1.25, letterSpacing: header ? 1.2 : 0, ...role6(header ? "label" : "body", spec, { fontSize: header ? 9 : 11.5, lineHeight: 1.25, fontWeight: header ? 700 : 400 }) }),
      TextBlock(String(values[3] || ""), { width: 80, color: theme8.ink, opacity: header ? 1 : 0.78, fontSize: header ? 9 : 10.5, textAlign: "right", letterSpacing: 0.8, ...role6("metric", spec, { fontSize: header ? 9 : 10.5, lineHeight: 1, fontWeight: header ? 700 : 500 }) })
    ]
  );
}
function renderColophon(spec) {
  const theme8 = colors6(spec);
  const footer4 = objectArray3(spec, "footer_items", DEFAULTS6["colophon"].footer_items);
  return frame4(spec, "colophon", [
    ...blockTiles(theme8, "colophon"),
    glow(theme8, 242, 384, 520, 290, 0.42),
    glow(theme8, -120, 34, 330, 220, 0.16, theme8.ember),
    caption(value4(spec, "kicker", DEFAULTS6["colophon"].kicker), spec, { position: "absolute", left: 48, top: 52, width: 360 }),
    serifText(value4(spec, "title", DEFAULTS6["colophon"].title), spec, { position: "absolute", left: 48, top: 96, width: 762, fontSize: 74, lineHeight: 0.92 }),
    footerItem(spec, footer4[0] || {}, 48, 178, 92),
    footerItem(spec, footer4[1] || {}, 250, 164, 92),
    footerItem(spec, footer4[2] || {}, 436, 164, 92),
    footerItem(spec, footer4[3] || {}, 620, 292, 92)
  ]);
}
var RENDERERS5 = {
  "cover": renderCover7,
  "manifesto": renderManifesto2,
  "programme": renderProgramme,
  "chapter": renderChapter2,
  "data": renderData,
  "quote": renderQuote7,
  "cal": renderCalendar,
  "colophon": renderColophon
};
function renderBiennaleProgrammePoster(spec) {
  const variant = normalizeVariant7(spec);
  return (RENDERERS5[variant] || renderCover7)(spec);
}

// templates/beautiful/block-frame-grid.mjs
var templateId9 = "block-frame-grid";
var PAGE_VARIANTS8 = [
  "cover",
  "agenda",
  "data_dashboard",
  "data_dashboard-4",
  "quote_or_emphasis",
  "process_or_timeline",
  "process_or_timeline-7",
  "data_dashboard-8",
  "process_or_timeline-9",
  "closing"
];
var rendererContract9 = {
  template_id: templateId9,
  renderer_id: `artboard_satori.${templateId9}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "block-frame",
  implemented_page_variants: PAGE_VARIANTS8,
  page_family: {
    family_id: "block-frame",
    supported_page_variants: PAGE_VARIANTS8,
    variant_usage_policy: {
      singletons: ["cover", "closing"],
      repeatable: PAGE_VARIANTS8.filter((variant) => !["cover", "closing"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/block-frame-1.png"
};
var CANVAS5 = { width: 960, height: 540 };
var DEFAULTS7 = {
  cover: {
    eyebrow: "Presentation Template",
    title: "NEO-\nBRUTALISM\nSTYLE",
    subtitle: "A bold, high-contrast template designed for maximum visual impact and uncompromising clarity.",
    cta: "Get Started"
  },
  agenda: {
    eyebrow: "Overview",
    title: "What We Deliver",
    body: "Every project follows a rigorous process that balances creative exploration with systematic execution.",
    metrics: [
      { value: "12+", label: "Years" },
      { value: "500+", label: "Projects" },
      { value: "40", label: "Cities" }
    ]
  },
  data_dashboard: {
    eyebrow: "Core Features",
    title: "Built for bold systems",
    items: [
      { letter: "A", title: "Modular Layouts", body: "Mix and match components without starting from scratch." },
      { letter: "B", title: "Responsive Ready", body: "Adapts to different screens while keeping the bold visual language." },
      { letter: "C", title: "Design Tokens", body: "Colors, borders, and typography are structured for reuse." },
      { letter: "D", title: "Impact First", body: "High contrast and large type keep every message unmistakable." }
    ]
  },
  "data_dashboard-4": {
    eyebrow: "Performance Data",
    title: "Quarterly Growth Metrics",
    series: [
      { label: "Revenue", values: [42, 58, 73, 90, 100] },
      { label: "Users", values: [28, 46, 67, 78, 94] },
      { label: "Retention", values: [61, 66, 74, 82, 94] }
    ],
    stats: [
      { value: "+142%", label: "Revenue Growth" },
      { value: "2.4M", label: "Active Users" },
      { value: "94%", label: "Retention Rate" }
    ]
  },
  quote_or_emphasis: {
    quote: "Design is not just what it looks like. Design is how it works, how it feels, and how it lasts.",
    author: "Core Principle, Version 4.0"
  },
  process_or_timeline: {
    eyebrow: "Visual System Methodology",
    title: "How We Structure Every Project",
    image_label: "Image Placeholder",
    items: [
      "Discovery phase to map stakeholder needs and technical constraints before any visual work begins.",
      "Iterative wireframing with rapid feedback loops and clear decision logs.",
      "Implementation planning that keeps design intent connected to production reality."
    ]
  },
  "process_or_timeline-7": {
    eyebrow: "Roadmap",
    title: "Project Timeline",
    steps: [
      { num: "01", title: "Research", body: "Market analysis, interviews, and competitive audits." },
      { num: "02", title: "Concept", body: "Mood boards, sketches, and directional exploration." },
      { num: "03", title: "Build", body: "Design system, templates, and implementation support." },
      { num: "04", title: "Launch", body: "Final checks, handoff, and post-launch iteration." }
    ]
  },
  "data_dashboard-8": {
    eyebrow: "By The Numbers",
    title: "Impact at a Glance",
    metrics: [
      { value: "98%", label: "Client Satisfaction" },
      { value: "14", label: "Industry Awards" },
      { value: "3.2x", label: "Avg. ROI Increase" },
      { value: "50+", label: "Team Members" }
    ]
  },
  "process_or_timeline-9": {
    eyebrow: "The Team",
    title: "Meet the Crew",
    people: [
      { initials: "JD", name: "J. Doe", role: "Creative Lead", body: "Oversees visual direction and maintains a coherent narrative." },
      { initials: "AS", name: "A. Smith", role: "Tech Director", body: "Translates design systems into scalable technical architectures." },
      { initials: "MK", name: "M. Kim", role: "Producer", body: "Keeps delivery, feedback, and operations moving at speed." }
    ]
  },
  closing: {
    title: "Let's Build\nSomething Bold",
    subtitle: "Ready to start your next project?",
    cta: "Get In Touch"
  }
};
function colors7(spec) {
  const source = spec.theme?.colors || {};
  return {
    background: source.background || "#FFDC8B",
    paper: source.surface || "#FFFDF5",
    black: source.text || "#000000",
    pink: source.primary || "#FE90E8",
    green: source.accent || "#99E885",
    yellow: source.yellow || "#F7CB46",
    blue: source.blue || "#C0F7FE",
    white: "#FFFFFF"
  };
}
function role7(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value5(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array6(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray4(spec, key, fallback2 = []) {
  return array6(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function upper3(input) {
  return String(input || "").toUpperCase();
}
function normalizeVariant8(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS8.length) return PAGE_VARIANTS8[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS8) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("quote")) return "quote_or_emphasis";
  if (raw.includes("closing") || raw.includes("cta")) return "closing";
  if (raw.includes("timeline") || raw.includes("process")) return "process_or_timeline-7";
  if (raw.includes("data") || raw.includes("metric")) return "data_dashboard-8";
  if (raw.includes("agenda") || raw.includes("overview")) return "agenda";
  return "data_dashboard";
}
function variantPage3(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS8.indexOf(variant) + 1;
}
function frame5(spec, variant, children = [], options = {}) {
  const theme8 = colors7(spec);
  const background = options.background || theme8.background;
  const page18 = variantPage3(spec, variant);
  return box(
    {
      width: CANVAS5.width,
      height: CANVAS5.height,
      position: "relative",
      backgroundColor: background,
      color: theme8.black,
      overflow: "hidden"
    },
    [
      ...dotGrid(theme8),
      ...children,
      nav2(theme8, spec, page18)
    ]
  );
}
function dotGrid(theme8) {
  return Array.from({ length: 24 }).map(
    (_, index) => box({
      position: "absolute",
      left: 34 + index % 6 * 10,
      top: 35 + Math.floor(index / 6) * 10,
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme8.black,
      opacity: 0.55
    })
  );
}
function nav2(theme8, spec, page18) {
  return [
    smallButton(theme8, spec, `${String(page18).padStart(2, "0")} / 10`, { position: "absolute", left: 14, bottom: 12, width: 54 }),
    box({ position: "absolute", right: 14, bottom: 12, flexDirection: "row", gap: 8 }, [
      smallButton(theme8, spec, "<", { width: 26 }),
      smallButton(theme8, spec, ">", { width: 26 })
    ])
  ];
}
function smallButton(theme8, spec, label28, style = {}) {
  return box(
    {
      width: 54,
      height: 26,
      backgroundColor: theme8.white,
      borderWidth: 3,
      borderColor: theme8.black,
      alignItems: "center",
      justifyContent: "center",
      ...style
    },
    [
      TextBlock(label28, {
        color: theme8.black,
        fontSize: 9,
        lineHeight: 1,
        textAlign: "center",
        ...role7("metric", spec, { fontSize: 9, lineHeight: 1, fontWeight: 900 })
      })
    ]
  );
}
function label5(text10, spec, style = {}) {
  const theme8 = colors7(spec);
  return TextBlock(upper3(text10), {
    minHeight: 25,
    backgroundColor: style.backgroundColor || theme8.white,
    borderWidth: 3,
    borderColor: theme8.black,
    color: theme8.black,
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 0.8,
    padding: "7px 12px",
    ...role7("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 900 }),
    ...style
  });
}
function headline3(text10, spec, style = {}) {
  const theme8 = colors7(spec);
  return Title(upper3(text10), {
    color: theme8.black,
    fontSize: 52,
    lineHeight: 0.95,
    ...role7("display", spec, { fontSize: 52, lineHeight: 0.95, fontWeight: 900 }),
    ...style
  });
}
function body5(text10, spec, style = {}) {
  const theme8 = colors7(spec);
  return TextBlock(text10, {
    color: theme8.black,
    fontSize: 14,
    lineHeight: 1.45,
    ...role7("body", spec, { fontSize: 14, lineHeight: 1.45, fontWeight: 600 }),
    ...style
  });
}
function elevated(theme8, style = {}, children = []) {
  const left = Number(style.left || 0);
  const top = Number(style.top || 0);
  const width = Number(style.width || 100);
  const height = Number(style.height || 100);
  const shadow = style.shadow ?? 8;
  return [
    box({ position: "absolute", left: left + shadow, top: top + shadow, width, height, backgroundColor: theme8.black }),
    box(
      {
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: style.backgroundColor || theme8.paper,
        borderWidth: style.borderWidth || 4,
        borderColor: theme8.black,
        padding: style.padding || "28px",
        flexDirection: style.flexDirection || "column"
      },
      children
    )
  ];
}
function deco(theme8, variant = "pink") {
  const fill2 = variant === "green" ? theme8.green : variant === "blue" ? theme8.blue : variant === "yellow" ? theme8.yellow : theme8.pink;
  return box({ width: 44, height: 44, backgroundColor: fill2, borderWidth: 3, borderColor: theme8.black, transform: "rotate(8deg)" });
}
function renderCover8(spec) {
  const theme8 = colors7(spec);
  return frame5(spec, "cover", [
    ...elevated(theme8, { left: 256, top: 136, width: 452, height: 284, padding: "30px 32px" }, [
      label5(value5(spec, "eyebrow", DEFAULTS7.cover.eyebrow), spec, { width: 142, marginBottom: 16 }),
      headline3(value5(spec, "title", DEFAULTS7.cover.title), spec, { width: 340, fontSize: 50, lineHeight: 0.92, marginBottom: 16, whiteSpace: "pre-line" }),
      body5(value5(spec, "subtitle", DEFAULTS7.cover.subtitle), spec, { width: 320, fontSize: 12, lineHeight: 1.35 })
    ]),
    box({ position: "absolute", left: 612, top: 112 }, [deco(theme8, "pink")]),
    box({ position: "absolute", left: 616, top: 348, width: 36, height: 36, borderRadius: 18, backgroundColor: theme8.green, borderWidth: 3, borderColor: theme8.black }),
    label5(value5(spec, "cta", DEFAULTS7.cover.cta), spec, { position: "absolute", left: 294, top: 396, width: 90, backgroundColor: theme8.yellow, transform: "rotate(-2deg)", fontSize: 8 })
  ]);
}
function renderAgenda3(spec) {
  const theme8 = colors7(spec);
  const metrics = objectArray4(spec, "metrics", DEFAULTS7.agenda.metrics).slice(0, 3);
  return frame5(spec, "agenda", [
    ...elevated(theme8, { left: 72, top: 76, width: 520, height: 330, backgroundColor: theme8.paper, padding: "34px 38px" }, [
      label5(value5(spec, "eyebrow", DEFAULTS7.agenda.eyebrow), spec, { width: 118, backgroundColor: theme8.blue, marginBottom: 20 }),
      headline3(value5(spec, "title", DEFAULTS7.agenda.title), spec, { width: 390, fontSize: 50, marginBottom: 18 }),
      body5(value5(spec, "body", DEFAULTS7.agenda.body), spec, { width: 390, fontSize: 16, lineHeight: 1.5 })
    ]),
    box({ position: "absolute", left: 636, top: 104, flexDirection: "column", gap: 24 }, metrics.map(
      (item, index) => box({ width: 200, height: 82, backgroundColor: [theme8.pink, theme8.green, theme8.yellow][index], borderWidth: 4, borderColor: theme8.black, padding: "14px 18px" }, [
        TextBlock(item.value || "", { color: theme8.black, fontSize: 32, lineHeight: 1, ...role7("metric", spec, { fontSize: 32, lineHeight: 1, fontWeight: 900 }) }),
        label5(item.label || "", spec, { marginTop: 8, width: 126, height: 22, padding: "5px 8px", fontSize: 8, backgroundColor: theme8.white })
      ])
    ))
  ]);
}
function renderFeatures(spec) {
  const theme8 = colors7(spec);
  const items = objectArray4(spec, "items", DEFAULTS7.data_dashboard.items).slice(0, 4);
  return frame5(spec, "data_dashboard", [
    label5(value5(spec, "eyebrow", DEFAULTS7.data_dashboard.eyebrow), spec, { position: "absolute", left: 70, top: 54, width: 145, backgroundColor: theme8.green }),
    headline3(value5(spec, "title", DEFAULTS7.data_dashboard.title), spec, { position: "absolute", left: 70, top: 96, width: 560, fontSize: 44 }),
    box({ position: "absolute", left: 70, top: 174, width: 820, flexDirection: "row", flexWrap: "wrap", gap: 22 }, items.map(
      (item, index) => box({ width: 394, height: 126, backgroundColor: [theme8.white, theme8.blue, theme8.green, theme8.pink][index], borderWidth: 4, borderColor: theme8.black, padding: "22px", flexDirection: "row", gap: 18 }, [
        box({ width: 58, height: 58, backgroundColor: theme8.yellow, borderWidth: 3, borderColor: theme8.black, alignItems: "center", justifyContent: "center" }, [
          TextBlock(item.letter || String.fromCharCode(65 + index), { color: theme8.black, fontSize: 28, lineHeight: 1, textAlign: "center", ...role7("label", spec, { fontSize: 28, lineHeight: 1, fontWeight: 900 }) })
        ]),
        box({ width: 262, flexDirection: "column" }, [
          headline3(item.title || "", spec, { width: 250, fontSize: 20, lineHeight: 1.1, marginBottom: 8 }),
          body5(item.body || "", spec, { width: 250, fontSize: 11.5, lineHeight: 1.32 })
        ])
      ])
    ))
  ]);
}
function renderChart4(spec) {
  const theme8 = colors7(spec);
  const series = objectArray4(spec, "series", DEFAULTS7["data_dashboard-4"].series).slice(0, 3);
  const stats2 = objectArray4(spec, "stats", DEFAULTS7["data_dashboard-4"].stats).slice(0, 3);
  return frame5(spec, "data_dashboard-4", [
    label5(value5(spec, "eyebrow", DEFAULTS7["data_dashboard-4"].eyebrow), spec, { position: "absolute", left: 60, top: 54, width: 164, backgroundColor: theme8.yellow }),
    headline3(value5(spec, "title", DEFAULTS7["data_dashboard-4"].title), spec, { position: "absolute", left: 60, top: 96, width: 620, fontSize: 40 }),
    ...elevated(theme8, { left: 60, top: 166, width: 536, height: 248, backgroundColor: theme8.white, padding: "22px 26px" }, [
      box({ width: 470, height: 190, flexDirection: "column", gap: 18 }, series.map(
        (row, index) => box({ width: 470, height: 42, flexDirection: "row", alignItems: "center", gap: 14 }, [
          label5(row.label || "", spec, { width: 84, backgroundColor: theme8.paper, fontSize: 8, padding: "6px 7px" }),
          ...(row.values || []).slice(0, 5).map((val) => box({ width: 46, height: Math.max(10, Number(val) * 0.3), backgroundColor: [theme8.pink, theme8.green, theme8.blue][index], borderWidth: 2, borderColor: theme8.black, alignSelf: "flex-end" }))
        ])
      ))
    ]),
    box({ position: "absolute", left: 650, top: 174, flexDirection: "column", gap: 20 }, stats2.map(
      (item, index) => box({ width: 210, height: 70, backgroundColor: [theme8.pink, theme8.green, theme8.yellow][index], borderWidth: 4, borderColor: theme8.black, padding: "12px 16px" }, [
        TextBlock(item.value || "", { color: theme8.black, fontSize: 28, lineHeight: 1, ...role7("metric", spec, { fontSize: 28, lineHeight: 1, fontWeight: 900 }) }),
        label5(item.label || "", spec, { marginTop: 7, width: 150, backgroundColor: theme8.white, fontSize: 7.5, padding: "5px 7px" })
      ])
    ))
  ]);
}
function renderQuote8(spec) {
  const theme8 = colors7(spec);
  return frame5(spec, "quote_or_emphasis", [
    box({ position: "absolute", left: 80, top: 80, width: 800, height: 360, backgroundColor: theme8.pink, borderWidth: 5, borderColor: theme8.black }),
    TextBlock('"', { position: "absolute", left: 116, top: 76, color: theme8.black, fontSize: 96, lineHeight: 1, ...role7("display", spec, { fontSize: 96, lineHeight: 1, fontWeight: 900 }) }),
    headline3(value5(spec, "quote", DEFAULTS7.quote_or_emphasis.quote), spec, { position: "absolute", left: 152, top: 156, width: 656, fontSize: 38, lineHeight: 1.14 }),
    label5(value5(spec, "author", DEFAULTS7.quote_or_emphasis.author), spec, { position: "absolute", right: 112, bottom: 92, width: 250, backgroundColor: theme8.yellow })
  ], { background: theme8.blue });
}
function renderMethod2(spec) {
  const theme8 = colors7(spec);
  const items = array6(spec, "items", DEFAULTS7.process_or_timeline.items).slice(0, 3);
  return frame5(spec, "process_or_timeline", [
    ...elevated(theme8, { left: 58, top: 88, width: 332, height: 286, backgroundColor: theme8.blue, padding: "28px" }, [
      label5(value5(spec, "image_label", DEFAULTS7.process_or_timeline.image_label), spec, { width: 160, backgroundColor: theme8.white }),
      box({ width: 254, height: 174, marginTop: 26, borderWidth: 4, borderColor: theme8.black, backgroundColor: theme8.paper, alignItems: "center", justifyContent: "center" }, [deco(theme8, "pink")])
    ]),
    label5(value5(spec, "eyebrow", DEFAULTS7.process_or_timeline.eyebrow), spec, { position: "absolute", left: 448, top: 76, width: 260, backgroundColor: theme8.green }),
    headline3(value5(spec, "title", DEFAULTS7.process_or_timeline.title), spec, { position: "absolute", left: 448, top: 126, width: 390, fontSize: 36 }),
    box({ position: "absolute", left: 448, top: 228, width: 390, flexDirection: "column", gap: 16 }, items.map(
      (item, index) => box({ width: 390, minHeight: 48, flexDirection: "row", gap: 16 }, [
        label5(String(index + 1).padStart(2, "0"), spec, { width: 46, backgroundColor: theme8.yellow }),
        body5(item, spec, { width: 300, fontSize: 12.5, lineHeight: 1.35 })
      ])
    ))
  ]);
}
function renderTimeline5(spec) {
  const theme8 = colors7(spec);
  const steps = objectArray4(spec, "steps", DEFAULTS7["process_or_timeline-7"].steps).slice(0, 4);
  return frame5(spec, "process_or_timeline-7", [
    label5(value5(spec, "eyebrow", DEFAULTS7["process_or_timeline-7"].eyebrow), spec, { position: "absolute", left: 64, top: 54, width: 120, backgroundColor: theme8.pink }),
    headline3(value5(spec, "title", DEFAULTS7["process_or_timeline-7"].title), spec, { position: "absolute", left: 64, top: 94, width: 520, fontSize: 44 }),
    box({ position: "absolute", left: 80, top: 196, width: 800, height: 6, backgroundColor: theme8.black }),
    box({ position: "absolute", left: 80, top: 224, flexDirection: "row", gap: 18 }, steps.map(
      (step, index) => box({ width: 184, height: 170, backgroundColor: [theme8.white, theme8.blue, theme8.green, theme8.yellow][index], borderWidth: 4, borderColor: theme8.black, padding: "18px", flexDirection: "column" }, [
        TextBlock(step.num || String(index + 1).padStart(2, "0"), { color: theme8.black, fontSize: 34, lineHeight: 1, marginBottom: 12, ...role7("metric", spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 }) }),
        headline3(step.title || "", spec, { width: 138, fontSize: 20, lineHeight: 1.05, marginBottom: 8 }),
        body5(step.body || "", spec, { width: 136, fontSize: 10.5, lineHeight: 1.28 })
      ])
    ))
  ]);
}
function renderStats3(spec) {
  const theme8 = colors7(spec);
  const metrics = objectArray4(spec, "metrics", DEFAULTS7["data_dashboard-8"].metrics).slice(0, 4);
  return frame5(spec, "data_dashboard-8", [
    label5(value5(spec, "eyebrow", DEFAULTS7["data_dashboard-8"].eyebrow), spec, { position: "absolute", left: 70, top: 58, width: 164, backgroundColor: theme8.blue }),
    headline3(value5(spec, "title", DEFAULTS7["data_dashboard-8"].title), spec, { position: "absolute", left: 70, top: 104, width: 560, fontSize: 46 }),
    box({ position: "absolute", left: 70, top: 196, width: 820, flexDirection: "row", flexWrap: "wrap", gap: 24 }, metrics.map(
      (item, index) => box({ width: 390, height: 112, backgroundColor: [theme8.pink, theme8.green, theme8.yellow, theme8.blue][index], borderWidth: 5, borderColor: theme8.black, padding: "20px 24px", flexDirection: "column" }, [
        TextBlock(item.value || "", { color: theme8.black, fontSize: 42, lineHeight: 1, marginBottom: 12, ...role7("metric", spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 }) }),
        label5(item.label || "", spec, { width: 220, backgroundColor: theme8.white, fontSize: 9 })
      ])
    ))
  ]);
}
function renderTeam2(spec) {
  const theme8 = colors7(spec);
  const people = objectArray4(spec, "people", DEFAULTS7["process_or_timeline-9"].people).slice(0, 3);
  return frame5(spec, "process_or_timeline-9", [
    label5(value5(spec, "eyebrow", DEFAULTS7["process_or_timeline-9"].eyebrow), spec, { position: "absolute", left: 70, top: 54, width: 122, backgroundColor: theme8.green }),
    headline3(value5(spec, "title", DEFAULTS7["process_or_timeline-9"].title), spec, { position: "absolute", left: 70, top: 100, width: 520, fontSize: 46 }),
    box({ position: "absolute", left: 70, top: 190, width: 820, flexDirection: "row", gap: 24 }, people.map(
      (person, index) => box({ width: 257, height: 218, backgroundColor: [theme8.white, theme8.blue, theme8.pink][index], borderWidth: 4, borderColor: theme8.black, padding: "22px", flexDirection: "column" }, [
        box({ width: 64, height: 64, backgroundColor: [theme8.pink, theme8.yellow, theme8.green][index], borderWidth: 3, borderColor: theme8.black, alignItems: "center", justifyContent: "center", marginBottom: 16 }, [
          TextBlock(person.initials || "", { color: theme8.black, fontSize: 24, lineHeight: 1, textAlign: "center", ...role7("label", spec, { fontSize: 24, lineHeight: 1, fontWeight: 900 }) })
        ]),
        headline3(person.name || "", spec, { width: 190, fontSize: 21, lineHeight: 1.05 }),
        label5(person.role || "", spec, { width: 156, marginTop: 8, marginBottom: 10, fontSize: 8, backgroundColor: theme8.white }),
        body5(person.body || "", spec, { width: 190, fontSize: 11, lineHeight: 1.3 })
      ])
    ))
  ]);
}
function renderClosing4(spec) {
  const theme8 = colors7(spec);
  return frame5(spec, "closing", [
    box({ position: "absolute", left: 98, top: 96, width: 764, height: 300, backgroundColor: theme8.green, borderWidth: 5, borderColor: theme8.black }),
    headline3(value5(spec, "title", DEFAULTS7.closing.title), spec, { position: "absolute", left: 148, top: 138, width: 650, fontSize: 56, lineHeight: 0.94, whiteSpace: "pre-line" }),
    body5(value5(spec, "subtitle", DEFAULTS7.closing.subtitle), spec, { position: "absolute", left: 154, top: 286, width: 440, fontSize: 18, lineHeight: 1.4 }),
    label5(value5(spec, "cta", DEFAULTS7.closing.cta), spec, { position: "absolute", left: 154, top: 340, width: 150, backgroundColor: theme8.yellow }),
    box({ position: "absolute", right: 116, top: 120 }, [deco(theme8, "pink")]),
    box({ position: "absolute", right: 150, bottom: 110, width: 52, height: 52, borderRadius: 26, backgroundColor: theme8.blue, borderWidth: 4, borderColor: theme8.black })
  ], { background: theme8.pink });
}
var RENDERERS6 = {
  cover: renderCover8,
  agenda: renderAgenda3,
  data_dashboard: renderFeatures,
  "data_dashboard-4": renderChart4,
  quote_or_emphasis: renderQuote8,
  process_or_timeline: renderMethod2,
  "process_or_timeline-7": renderTimeline5,
  "data_dashboard-8": renderStats3,
  "process_or_timeline-9": renderTeam2,
  closing: renderClosing4
};
function renderBlockFrameGrid(spec) {
  const variant = normalizeVariant8(spec);
  return (RENDERERS6[variant] || renderCover8)(spec);
}

// templates/beautiful/broadside-editorial-quote.mjs
var templateId10 = "editorial-quote-chart";
var PAGE_VARIANTS9 = [
  "cover",
  "chapter",
  "statement",
  "split",
  "stats",
  "fadelist",
  "list",
  "quote",
  "compare",
  "chart",
  "diagram",
  "pie",
  "pyramid",
  "vtimeline",
  "cycle",
  "end"
];
var rendererContract10 = {
  template_id: templateId10,
  renderer_id: `artboard_satori.${templateId10}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "broadside",
  implemented_page_variants: PAGE_VARIANTS9,
  page_family: {
    family_id: "broadside",
    supported_page_variants: PAGE_VARIANTS9,
    variant_usage_policy: {
      singletons: ["cover", "chapter", "end"],
      repeatable: PAGE_VARIANTS9.filter((variant) => !["cover", "chapter", "end"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/broadside-1.png"
};
var DEFAULTS8 = {
  cover: {
    title: "this is the broadside style",
    subtitle: "Protest poster meets publication cover. Type so large it becomes image.",
    author: "Studio Notes",
    context: "2026 \xB7 field brief"
  },
  chapter: { title: "what matters now", subtitle: "A short chapter marker for the next argument." },
  statement: { eyebrow: "thesis", title: "clarity is a design decision, not a decorative finish." },
  split: {
    eyebrow: "field note",
    title: "ideas need both friction and form",
    body: "The source system pairs publication gravity with poster scale.",
    items: ["choose one sharp claim", "make the support visible", "leave a strong editorial trace"]
  },
  stats: {
    metrics: [
      { value: "68%", label: "faster recall", note: "large type anchors the message" },
      { value: "4.2x", label: "more contrast", note: "orange and ink register instantly" },
      { value: "16", label: "source pages", note: "each layout has a distinct role" }
    ]
  },
  fadelist: { title: "before during after", items: ["before", "during", "after"] },
  list: {
    title: "operating principles",
    items: ["Lead with a sentence that can stand alone.", "Let slash bullets cut the page rhythm.", "Keep evidence close to the claim.", "Use orange only when it needs to shout."]
  },
  quote: { quote: "Good editorial systems do not decorate information. They decide what gets remembered.", author: "Broadside note" },
  compare: {
    title: "before after",
    before: ["generic cards", "soft hierarchy", "decorative palette"],
    after: ["poster scale", "visible structure", "argument-first rhythm"],
    payoff: "The page becomes an editorial position."
  },
  chart: {
    title: "attention by signal strength",
    bars: [
      { label: "headline", value: 92 },
      { label: "evidence", value: 74 },
      { label: "caption", value: 48 },
      { label: "source", value: 31 }
    ]
  },
  diagram: { title: "argument flow", steps: ["claim", "context", "evidence", "decision"] },
  pie: {
    title: "where the page works",
    total: "100%",
    legend: [
      { label: "type scale", value: "42%" },
      { label: "contrast", value: "33%" },
      { label: "spacing", value: "25%" }
    ]
  },
  pyramid: { title: "hierarchy stack", layers: ["signal", "claim", "evidence", "detail", "source"] },
  vtimeline: {
    title: "release cadence",
    timeline: [
      { date: "week 01", title: "frame the claim", body: "Define the editorial position." },
      { date: "week 02", title: "build evidence", body: "Attach data and examples." },
      { date: "week 03", title: "publish", body: "Ship the artifact with a strong close." }
    ]
  },
  cycle: { title: "build measure learn", steps: ["build", "measure", "learn", "adjust"] },
  end: { title: "let's talk.", subtitle: "research@example.com \xB7 broadside system" }
};
function colors8(spec) {
  const source = spec.theme?.colors || {};
  return {
    orange: source.background || source.accent || "#E85D26",
    dark: source.text || "#111111",
    cream: source.surface || "#F0ECE5",
    muted: source.muted || "#5E3526",
    rust: source.primary || "#A83E1B"
  };
}
function role8(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value6(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array7(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray5(spec, key, fallback2 = []) {
  return array7(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function normalizeVariant9(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS9.length) return PAGE_VARIANTS9[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS9) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("process") || raw.includes("timeline")) return "diagram";
  if (raw.includes("compare") || raw.includes("split")) return "compare";
  if (raw.includes("closing") || raw.includes("end")) return "end";
  return "statement";
}
function variantPage4(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS9.indexOf(variant) + 1;
}
function isOrange(variant) {
  return ["cover", "chapter", "stats", "fadelist", "diagram", "end"].includes(variant);
}
function frame6(spec, variant, children = []) {
  const theme8 = colors8(spec);
  const orange = isOrange(variant);
  const bg = orange ? theme8.orange : theme8.dark;
  const fg = orange ? theme8.dark : theme8.cream;
  const accent = orange ? theme8.dark : theme8.orange;
  const page18 = String(variantPage4(spec, variant)).padStart(2, "0");
  return box(
    { width: 960, height: 540, position: "relative", backgroundColor: bg, color: fg, overflow: "hidden" },
    [
      TextBlock(page18, { position: "absolute", left: 48, top: 34, color: accent, fontSize: 12, lineHeight: 1, ...role8("metric", spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 }) }),
      TextBlock("FIELD NOTES", { position: "absolute", right: 48, top: 34, width: 140, color: accent, fontSize: 9, lineHeight: 1, letterSpacing: 1.8, textAlign: "right", ...role8("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase" }) }),
      ...children,
      box({ position: "absolute", left: 48, right: 48, bottom: 46, height: 1, backgroundColor: accent, opacity: 0.72 }),
      TextBlock("PUBLICATION SERIES", { position: "absolute", left: 48, bottom: 24, color: accent, fontSize: 9, letterSpacing: 1.2, ...role8("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }) }),
      TextBlock("ISSUE ARCHIVE", { position: "absolute", right: 48, bottom: 24, width: 160, color: accent, fontSize: 9, letterSpacing: 1.2, textAlign: "right", ...role8("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }) })
    ]
  );
}
function display2(text10, spec, style = {}) {
  const theme8 = colors8(spec);
  return Title(String(text10 || "").toLowerCase(), {
    color: style.color || theme8.dark,
    fontSize: 72,
    lineHeight: 0.82,
    letterSpacing: -1.1,
    ...role8("display", spec, { fontSize: 72, lineHeight: 0.82, fontWeight: 900, letterSpacing: -1.1, textTransform: "none" }),
    ...style
  });
}
function body6(text10, spec, style = {}) {
  return TextBlock(text10, {
    fontSize: 15,
    lineHeight: 1.45,
    ...role8("body", spec, { fontSize: 15, lineHeight: 1.45, fontWeight: 500 }),
    ...style
  });
}
function label6(text10, spec, style = {}) {
  return TextBlock(String(text10 || "").toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 1.4,
    ...role8("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase" }),
    ...style
  });
}
function slashBullet(spec, text10, y, color) {
  return box({ position: "absolute", left: 0, top: y, width: 370, minHeight: 38, flexDirection: "row", gap: 12 }, [
    TextBlock("/", { color, fontSize: 22, lineHeight: 1, ...role8("label", spec, { fontSize: 22, lineHeight: 1, fontWeight: 800 }) }),
    body6(text10, spec, { color, width: 330, fontSize: 14, lineHeight: 1.35 })
  ]);
}
function renderCover9(spec) {
  const theme8 = colors8(spec);
  const title2 = value6(spec, "title", DEFAULTS8.cover.title);
  const words = title2.toLowerCase().split(/\s+/);
  return frame6(spec, "cover", [
    display2(words.slice(0, 4).join(" "), spec, { position: "absolute", left: 48, top: 170, width: 820, fontSize: 86, color: theme8.dark }),
    display2(words.slice(4).join(" ") || "style", spec, { position: "absolute", left: 48, top: 292, width: 850, fontSize: 86, color: theme8.dark }),
    body6(value6(spec, "subtitle", DEFAULTS8.cover.subtitle), spec, { position: "absolute", left: 48, bottom: 74, width: 430, color: theme8.muted, fontSize: 15, lineHeight: 1.5 }),
    label6(value6(spec, "author", DEFAULTS8.cover.author), spec, { position: "absolute", left: 48, bottom: 146, color: theme8.muted }),
    label6(value6(spec, "context", DEFAULTS8.cover.context), spec, { position: "absolute", right: 48, bottom: 146, width: 190, color: theme8.muted, textAlign: "right" })
  ]);
}
function renderChapter3(spec) {
  const theme8 = colors8(spec);
  return frame6(spec, "chapter", [
    display2(value6(spec, "title", DEFAULTS8.chapter.title), spec, { position: "absolute", left: 130, top: 180, width: 700, fontSize: 76, lineHeight: 0.9, textAlign: "center", color: theme8.dark }),
    body6(value6(spec, "subtitle", DEFAULTS8.chapter.subtitle), spec, { position: "absolute", left: 280, top: 344, width: 400, color: theme8.muted, fontSize: 16, textAlign: "center" })
  ]);
}
function renderStatement2(spec) {
  const theme8 = colors8(spec);
  return frame6(spec, "statement", [
    label6(value6(spec, "eyebrow", DEFAULTS8.statement.eyebrow), spec, { position: "absolute", left: 92, top: 118, color: theme8.orange }),
    box({ position: "absolute", left: 92, top: 148, width: 72, height: 3, backgroundColor: theme8.orange }),
    display2(value6(spec, "title", DEFAULTS8.statement.title), spec, { position: "absolute", left: 90, top: 194, width: 760, color: theme8.orange, fontSize: 58, lineHeight: 0.98 })
  ]);
}
function renderSplit3(spec) {
  const theme8 = colors8(spec);
  const items = array7(spec, "items", DEFAULTS8.split.items).slice(0, 3);
  return frame6(spec, "split", [
    label6(value6(spec, "eyebrow", DEFAULTS8.split.eyebrow), spec, { position: "absolute", left: 72, top: 104, color: theme8.orange }),
    display2(value6(spec, "title", DEFAULTS8.split.title), spec, { position: "absolute", left: 72, top: 150, width: 385, color: theme8.cream, fontSize: 46, lineHeight: 1 }),
    body6(value6(spec, "body", DEFAULTS8.split.body), spec, { position: "absolute", left: 72, top: 280, width: 360, color: theme8.cream, opacity: 0.8 }),
    box({ position: "absolute", left: 72, top: 348, width: 370, height: 130 }, items.map((item, index) => slashBullet(spec, item, index * 42, theme8.orange))),
    box({ position: "absolute", right: 74, top: 116, width: 360, height: 296, backgroundColor: theme8.orange, borderWidth: 2, borderColor: theme8.cream }),
    box({ position: "absolute", right: 112, top: 154, width: 284, height: 220, borderWidth: 2, borderColor: theme8.cream, borderStyle: "dashed" }),
    label6("visual reference", spec, { position: "absolute", right: 144, top: 250, width: 220, color: theme8.cream, textAlign: "center" })
  ]);
}
function renderStats4(spec) {
  const theme8 = colors8(spec);
  const metrics = objectArray5(spec, "metrics", DEFAULTS8.stats.metrics).slice(0, 3);
  return frame6(spec, "stats", [
    box({ position: "absolute", left: 72, top: 118, width: 816, flexDirection: "row", gap: 24 }, metrics.map(
      (metric19) => box({ width: 256, height: 274, borderWidth: 2, borderColor: theme8.dark, padding: "30px 24px", flexDirection: "column", backgroundColor: theme8.orange }, [
        TextBlock(metric19.value || "", { color: theme8.dark, fontSize: 58, lineHeight: 0.9, marginBottom: 20, ...role8("metric", spec, { fontSize: 58, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }) }),
        label6(metric19.label || "", spec, { color: theme8.dark, marginBottom: 20 }),
        body6(metric19.note || "", spec, { color: theme8.muted, fontSize: 13, lineHeight: 1.35 })
      ])
    ))
  ]);
}
function renderFadelist(spec) {
  const theme8 = colors8(spec);
  const items = array7(spec, "items", DEFAULTS8.fadelist.items);
  return frame6(spec, "fadelist", [
    ...items.slice(0, 3).map((item, index) => display2(item, spec, { position: "absolute", left: 56 + index * 112, top: 102 + index * 64, width: 680, color: theme8.dark, opacity: 0.14 + index * 0.14, fontSize: 76 })),
    display2(value6(spec, "title", DEFAULTS8.fadelist.title), spec, { position: "absolute", left: 70, top: 322, width: 780, color: theme8.dark, fontSize: 76, lineHeight: 0.86 })
  ]);
}
function renderList2(spec) {
  const theme8 = colors8(spec);
  const items = array7(spec, "items", DEFAULTS8.list.items).slice(0, 4);
  return frame6(spec, "list", [
    display2(value6(spec, "title", DEFAULTS8.list.title), spec, { position: "absolute", left: 70, top: 136, width: 330, color: theme8.cream, fontSize: 52 }),
    box({ position: "absolute", left: 500, top: 124, width: 360, height: 280 }, items.map((item, index) => slashBullet(spec, item, index * 64, theme8.orange)))
  ]);
}
function renderQuote9(spec) {
  const theme8 = colors8(spec);
  return frame6(spec, "quote", [
    label6("pull quote", spec, { position: "absolute", left: 92, top: 110, color: theme8.orange }),
    TextBlock('"', { position: "absolute", left: 88, top: 144, color: theme8.orange, fontSize: 90, lineHeight: 1, ...role8("display", spec, { fontSize: 90, lineHeight: 1, fontWeight: 900 }) }),
    display2(value6(spec, "quote", DEFAULTS8.quote.quote), spec, { position: "absolute", left: 160, top: 186, width: 670, color: theme8.cream, fontSize: 44, lineHeight: 1.08 }),
    label6(value6(spec, "author", DEFAULTS8.quote.author), spec, { position: "absolute", left: 164, top: 396, color: theme8.orange })
  ]);
}
function renderCompare2(spec) {
  const theme8 = colors8(spec);
  const before = array7(spec, "before", DEFAULTS8.compare.before).slice(0, 3);
  const after = array7(spec, "after", DEFAULTS8.compare.after).slice(0, 3);
  const listColumn = (title2, items, x) => box({ position: "absolute", left: x, top: 150, width: 240, minHeight: 210, flexDirection: "column" }, [
    label6(title2, spec, { color: theme8.orange, marginBottom: 24 }),
    ...items.map((item) => body6(`/ ${item}`, spec, { color: theme8.cream, marginBottom: 18, fontSize: 14 }))
  ]);
  return frame6(spec, "compare", [
    listColumn("before", before, 74),
    listColumn("after", after, 350),
    box({ position: "absolute", right: 72, top: 116, width: 280, height: 292, backgroundColor: theme8.orange, padding: "34px 28px", flexDirection: "column", justifyContent: "center" }, [
      display2(value6(spec, "payoff", DEFAULTS8.compare.payoff), spec, { color: theme8.dark, fontSize: 38, lineHeight: 1.05 })
    ])
  ]);
}
function renderChart5(spec) {
  const theme8 = colors8(spec);
  const bars = objectArray5(spec, "bars", DEFAULTS8.chart.bars).slice(0, 4);
  return frame6(spec, "chart", [
    display2(value6(spec, "title", DEFAULTS8.chart.title), spec, { position: "absolute", left: 72, top: 104, width: 420, color: theme8.cream, fontSize: 42 }),
    box({ position: "absolute", left: 522, top: 130, width: 330, height: 250, flexDirection: "row", alignItems: "flex-end", gap: 26 }, bars.map(
      (bar, index) => box({ width: 58, height: Math.max(34, Number(bar.value || 40) * 2.3), backgroundColor: index === 0 ? theme8.orange : theme8.cream, flexDirection: "column", justifyContent: "flex-end", padding: "8px 6px" }, [
        label6(String(bar.value || ""), spec, { color: index === 0 ? theme8.dark : theme8.orange, fontSize: 8, textAlign: "center" })
      ])
    )),
    box({ position: "absolute", left: 514, top: 388, width: 360, height: 2, backgroundColor: theme8.cream }),
    ...bars.map((bar, index) => label6(bar.label || "", spec, { position: "absolute", left: 516 + index * 84, top: 404, width: 78, color: theme8.cream, fontSize: 7, textAlign: "center" }))
  ]);
}
function renderDiagram2(spec) {
  const theme8 = colors8(spec);
  const steps = array7(spec, "steps", DEFAULTS8.diagram.steps).slice(0, 4);
  return frame6(spec, "diagram", [
    display2(value6(spec, "title", DEFAULTS8.diagram.title), spec, { position: "absolute", left: 70, top: 112, width: 430, color: theme8.dark, fontSize: 54 }),
    box({ position: "absolute", left: 102, top: 286, flexDirection: "row", alignItems: "center", gap: 12 }, steps.map((step, index) => [
      box({ width: 152, height: 82, borderWidth: 2, borderColor: theme8.dark, backgroundColor: index % 2 ? theme8.cream : theme8.orange, alignItems: "center", justifyContent: "center", padding: "14px" }, [
        label6(step, spec, { color: theme8.dark, textAlign: "center" })
      ]),
      index < steps.length - 1 ? box({ width: 36, height: 4, backgroundColor: theme8.dark }) : null
    ]).flat().filter(Boolean))
  ]);
}
function renderPie2(spec) {
  const theme8 = colors8(spec);
  const legend = objectArray5(spec, "legend", DEFAULTS8.pie.legend).slice(0, 3);
  return frame6(spec, "pie", [
    display2(value6(spec, "title", DEFAULTS8.pie.title), spec, { position: "absolute", left: 72, top: 112, width: 340, color: theme8.cream, fontSize: 44 }),
    box({ position: "absolute", left: 500, top: 112, width: 230, height: 230, borderRadius: 115, backgroundColor: theme8.orange, alignItems: "center", justifyContent: "center" }, [
      box({ width: 118, height: 118, borderRadius: 59, backgroundColor: theme8.dark, alignItems: "center", justifyContent: "center" }, [
        TextBlock(value6(spec, "total", DEFAULTS8.pie.total), { color: theme8.cream, fontSize: 30, lineHeight: 1, ...role8("metric", spec, { fontSize: 30, lineHeight: 1, fontWeight: 900 }) })
      ])
    ]),
    box({ position: "absolute", left: 500, top: 372, flexDirection: "column", gap: 12 }, legend.map((item) => body6(`${item.value} / ${item.label}`, spec, { color: theme8.cream, fontSize: 14 })))
  ]);
}
function renderPyramid2(spec) {
  const theme8 = colors8(spec);
  const layers = array7(spec, "layers", DEFAULTS8.pyramid.layers).slice(0, 5);
  return frame6(spec, "pyramid", [
    display2(value6(spec, "title", DEFAULTS8.pyramid.title), spec, { position: "absolute", left: 70, top: 102, width: 420, color: theme8.cream, fontSize: 48 }),
    box({ position: "absolute", left: 470, top: 106, width: 360, flexDirection: "column-reverse", alignItems: "center", gap: 8 }, layers.map(
      (layer, index) => box({ width: 150 + index * 42, height: 50, backgroundColor: index === 4 ? theme8.orange : theme8.cream, alignItems: "center", justifyContent: "center" }, [
        label6(layer, spec, { color: index === 4 ? theme8.dark : theme8.orange, textAlign: "center" })
      ])
    ))
  ]);
}
function renderVTimeline(spec) {
  const theme8 = colors8(spec);
  const timeline = objectArray5(spec, "timeline", DEFAULTS8.vtimeline.timeline).slice(0, 3);
  return frame6(spec, "vtimeline", [
    display2(value6(spec, "title", DEFAULTS8.vtimeline.title), spec, { position: "absolute", left: 70, top: 96, width: 300, color: theme8.cream, fontSize: 40 }),
    box({ position: "absolute", left: 492, top: 120, width: 3, height: 270, backgroundColor: theme8.orange }),
    ...timeline.map((item, index) => box({ position: "absolute", left: 320, top: 128 + index * 92, width: 500, minHeight: 74, flexDirection: "row", gap: 34 }, [
      label6(item.date || "", spec, { width: 116, color: theme8.orange, textAlign: "right" }),
      box({ width: 18, height: 18, borderRadius: 9, backgroundColor: theme8.orange, marginTop: 0 }),
      box({ width: 310, flexDirection: "column" }, [
        label6(item.title || "", spec, { color: theme8.cream, marginBottom: 8 }),
        body6(item.body || "", spec, { color: theme8.cream, opacity: 0.8, fontSize: 13 })
      ])
    ]))
  ]);
}
function renderCycle2(spec) {
  const theme8 = colors8(spec);
  const steps = array7(spec, "steps", DEFAULTS8.cycle.steps).slice(0, 4);
  const positions = [{ left: 470, top: 128 }, { left: 650, top: 128 }, { left: 650, top: 300 }, { left: 470, top: 300 }];
  return frame6(spec, "cycle", [
    display2(value6(spec, "title", DEFAULTS8.cycle.title), spec, { position: "absolute", left: 72, top: 142, width: 330, color: theme8.cream, fontSize: 54 }),
    box({ position: "absolute", left: 560, top: 236, width: 178, height: 3, backgroundColor: theme8.orange }),
    box({ position: "absolute", left: 616, top: 174, width: 3, height: 178, backgroundColor: theme8.orange }),
    ...steps.map((step, index) => box({ position: "absolute", ...positions[index], width: 130, height: 78, backgroundColor: index % 2 ? theme8.cream : theme8.orange, alignItems: "center", justifyContent: "center", padding: "12px" }, [
      label6(step, spec, { color: index % 2 ? theme8.orange : theme8.dark, textAlign: "center" })
    ]))
  ]);
}
function renderEnd2(spec) {
  const theme8 = colors8(spec);
  return frame6(spec, "end", [
    display2(value6(spec, "title", DEFAULTS8.end.title), spec, { position: "absolute", left: 64, top: 178, width: 760, color: theme8.dark, fontSize: 96, lineHeight: 0.82 }),
    body6(value6(spec, "subtitle", DEFAULTS8.end.subtitle), spec, { position: "absolute", left: 70, top: 374, width: 500, color: theme8.muted, fontSize: 17 })
  ]);
}
var RENDERERS7 = {
  cover: renderCover9,
  chapter: renderChapter3,
  statement: renderStatement2,
  split: renderSplit3,
  stats: renderStats4,
  fadelist: renderFadelist,
  list: renderList2,
  quote: renderQuote9,
  compare: renderCompare2,
  chart: renderChart5,
  diagram: renderDiagram2,
  pie: renderPie2,
  pyramid: renderPyramid2,
  vtimeline: renderVTimeline,
  cycle: renderCycle2,
  end: renderEnd2
};
function renderBroadsideEditorialQuote(spec) {
  const variant = normalizeVariant9(spec);
  return (RENDERERS7[variant] || renderStatement2)(spec);
}

// templates/beautiful/cartesian-architectural-spec.mjs
var templateId11 = "architectural-spec";
var PAGE_VARIANTS10 = [
  "title",
  "agenda",
  "statement",
  "barchart",
  "twocol",
  "cards",
  "linechart",
  "timeline",
  "team",
  "closing"
];
var rendererContract11 = {
  template_id: templateId11,
  renderer_id: `artboard_satori.${templateId11}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "cartesian",
  implemented_page_variants: PAGE_VARIANTS10,
  page_family: {
    family_id: "cartesian",
    supported_page_variants: PAGE_VARIANTS10,
    variant_usage_policy: {
      singletons: ["title", "agenda", "closing"],
      repeatable: PAGE_VARIANTS10.filter((variant) => !["title", "agenda", "closing"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/cartesian-1.png"
};
var DEFAULTS9 = {
  title: {
    eyebrow: "Presentation Template",
    title: "Cartesian",
    subtitle: "A minimalist framework for strategic narratives. Clean geometry meets editorial refinement."
  },
  agenda: {
    title: "Session Agenda",
    body: "An outline of key discussion points structured to guide our strategic conversation forward.",
    items: ["Market Position Analysis", "Core Value Proposition", "Growth Trajectory", "Implementation Roadmap"]
  },
  statement: {
    title: "Precision vs Signal",
    quote: "Precision in approach defines the boundary between noise and signal.",
    author: "Research Note"
  },
  barchart: {
    title: "Quarterly Metrics",
    body: "Comparative analysis across key business indicators demonstrating sustained momentum and operational efficiency.",
    bars: [
      { label: "Revenue", value: 72 },
      { label: "Retention", value: 54 },
      { label: "Reach", value: 83 },
      { label: "Quality", value: 62 }
    ]
  },
  twocol: {
    title: "Structural Overview",
    body: "A comprehensive examination of foundational elements that define our operational framework and strategic positioning within the market landscape.",
    note: "Through iterative refinement and measured adaptation, the methodology ensures alignment with evolving objectives and stakeholder expectations.",
    stats: [
      { value: "47%", label: "Efficiency" },
      { value: "12x", label: "Scale" },
      { value: "3.2M", label: "Reach" }
    ]
  },
  cards: {
    title: "Core Competencies",
    cards: [
      { mark: "I", title: "Analytical Depth", body: "Rigorous data-driven methodologies that transform raw information into actionable strategic intelligence." },
      { mark: "II", title: "Operational Scale", body: "Streamlined processes designed to expand seamlessly while maintaining quality and consistency." },
      { mark: "III", title: "Adaptive Design", body: "Flexible frameworks that evolve with changing conditions and emerging opportunities." }
    ]
  },
  linechart: {
    title: "Growth Projection",
    body: "Multi-year trajectory illustrating compound growth patterns and market penetration metrics.",
    points: [22, 32, 45, 58, 74, 86]
  },
  timeline: {
    title: "Implementation Phases",
    steps: [
      { year: "01", title: "Discovery", body: "Initial assessment and comprehensive audit of existing systems and processes." },
      { year: "02", title: "Strategy", body: "Development of tailored frameworks aligned with organizational objectives." },
      { year: "03", title: "Execution", body: "Phased rollout with continuous monitoring and iterative optimization." },
      { year: "04", title: "Scale", body: "Expansion of proven methodologies across all operational units." }
    ]
  },
  team: {
    title: "Key Contributors",
    people: [
      { initial: "A", name: "Alex Morgan", role: "Research Lead" },
      { initial: "J", name: "Jordan Lee", role: "Strategy Partner" },
      { initial: "S", name: "Sam Taylor", role: "Design Systems" },
      { initial: "R", name: "Reese Park", role: "Operations" }
    ]
  },
  closing: {
    title: "Thank You",
    subtitle: "Questions & Discussion",
    contact: "research@example.com"
  }
};
function colors9(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || source.bg_primary || "#EDE8E0",
    stone: source.surface || source.bg_secondary || "#E2DBD1",
    ink: source.text || source.text_primary || "#1A1A1A",
    muted: source.muted || source.text_secondary || "#5A5A5A",
    line: source.line || source.border || "#B8B0A4",
    accent: source.accent || source.primary || "#8A8178",
    veil: "#F4F0E8"
  };
}
function value7(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array8(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray6(spec, key, fallback2 = []) {
  return array8(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function normalizeVariant10(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS10.length) return PAGE_VARIANTS10[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS10) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "title";
  if (raw.includes("agenda")) return "agenda";
  if (raw.includes("quote") || raw.includes("statement")) return "statement";
  if (raw.includes("bar") || raw.includes("chart") || raw.includes("data")) return "barchart";
  if (raw.includes("detail") || raw.includes("two")) return "twocol";
  if (raw.includes("card") || raw.includes("content")) return "cards";
  if (raw.includes("timeline") || raw.includes("process")) return "timeline";
  if (raw.includes("comparison") || raw.includes("team")) return "team";
  if (raw.includes("closing") || raw.includes("end")) return "closing";
  return "title";
}
function variantPage5(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS10.indexOf(variant) + 1;
}
function role9(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function label7(text10, spec, style = {}) {
  const theme8 = colors9(spec);
  return TextBlock(String(text10 || "").toUpperCase(), {
    color: theme8.accent,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    ...role9("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 500, letterSpacing: 2.4, textTransform: "uppercase" }),
    ...style
  });
}
function body7(text10, spec, style = {}) {
  const theme8 = colors9(spec);
  return TextBlock(text10, {
    color: theme8.muted,
    fontSize: 14,
    lineHeight: 1.55,
    ...role9("body", spec, { fontSize: 14, lineHeight: 1.55, fontWeight: 400 }),
    ...style
  });
}
function serif3(text10, spec, style = {}) {
  const theme8 = colors9(spec);
  return Title(text10, {
    color: theme8.ink,
    fontSize: 52,
    lineHeight: 1.06,
    ...role9("display", spec, { fontSize: 52, lineHeight: 1.06, fontWeight: 400 }),
    ...style
  });
}
function metric3(text10, spec, style = {}) {
  const theme8 = colors9(spec);
  return TextBlock(text10, {
    color: theme8.ink,
    fontSize: 36,
    lineHeight: 1,
    ...role9("metric", spec, { fontSize: 36, lineHeight: 1, fontWeight: 400 }),
    ...style
  });
}
function line(style = {}) {
  return box({ position: "absolute", height: 1, backgroundColor: "#B8B0A4", ...style });
}
function ring(style = {}) {
  return box({ position: "absolute", borderWidth: 1, borderColor: "#B8B0A4", borderRadius: 999, ...style });
}
function frame7(spec, variant, children = []) {
  const theme8 = colors9(spec);
  const page18 = String(variantPage5(spec, variant)).padStart(2, "0");
  return box(
    { width: 960, height: 540, position: "relative", backgroundColor: theme8.paper, color: theme8.ink, overflow: "hidden" },
    [
      line({ left: 76, top: 0, width: 1, height: 540, opacity: 0.34 }),
      line({ left: 38, bottom: 54, width: 884, opacity: 0.52 }),
      ring({ right: 54, top: 88, width: 240, height: 240, opacity: 0.22 }),
      ring({ right: 90, top: 124, width: 168, height: 168, opacity: 0.18, borderStyle: "dashed" }),
      label7("Axis System", spec, { position: "absolute", left: 38, bottom: 25, width: 180 }),
      label7(page18, spec, { position: "absolute", right: 38, bottom: 25, width: 90, textAlign: "right" }),
      ...children
    ]
  );
}
function navDots(spec, active) {
  const theme8 = colors9(spec);
  return box(
    { position: "absolute", right: 38, top: 210, width: 8, flexDirection: "column" },
    PAGE_VARIANTS10.map(
      (_, index) => box({
        width: index === active ? 7 : 5,
        height: index === active ? 7 : 5,
        borderRadius: 4,
        backgroundColor: index === active ? theme8.ink : theme8.line,
        marginBottom: 8,
        marginLeft: index === active ? 0 : 1
      })
    )
  );
}
function renderTitle(spec) {
  const theme8 = colors9(spec);
  return frame7(spec, "title", [
    label7(value7(spec, "eyebrow", DEFAULTS9.title.eyebrow), spec, { position: "absolute", left: 92, top: 178 }),
    serif3(value7(spec, "title", DEFAULTS9.title.title), spec, { position: "absolute", left: 92, top: 218, width: 430, fontSize: 72, lineHeight: 0.98 }),
    body7(value7(spec, "subtitle", DEFAULTS9.title.subtitle), spec, { position: "absolute", left: 94, top: 306, width: 408, fontSize: 15, lineHeight: 1.48 }),
    ring({ left: 604, top: 184, width: 276, height: 276, opacity: 0.68 }),
    ring({ left: 633, top: 213, width: 218, height: 218, opacity: 0.52, borderStyle: "dashed" }),
    line({ left: 622, top: 321, width: 240, backgroundColor: theme8.ink, opacity: 0.86 }),
    navDots(spec, 0)
  ]);
}
function renderAgenda4(spec) {
  const theme8 = colors9(spec);
  const items = array8(spec, "items", DEFAULTS9.agenda.items).slice(0, 4);
  return frame7(spec, "agenda", [
    serif3(value7(spec, "title", DEFAULTS9.agenda.title), spec, { position: "absolute", left: 94, top: 122, width: 310, fontSize: 44 }),
    body7(value7(spec, "body", DEFAULTS9.agenda.body), spec, { position: "absolute", left: 96, top: 220, width: 290 }),
    box({ position: "absolute", left: 482, top: 112, width: 370, flexDirection: "column" }, items.map(
      (item, index) => box({ width: 370, height: 68, borderBottomWidth: 1, borderColor: theme8.line, flexDirection: "row", alignItems: "center" }, [
        metric3(String(index + 1).padStart(2, "0"), spec, { width: 66, color: theme8.accent, fontSize: 25 }),
        label7(item, spec, { width: 270, color: theme8.ink, letterSpacing: 1.6 })
      ])
    )),
    navDots(spec, 1)
  ]);
}
function renderStatement3(spec) {
  const theme8 = colors9(spec);
  return frame7(spec, "statement", [
    TextBlock("\u201C", { position: "absolute", left: 92, top: 100, color: theme8.line, fontSize: 118, lineHeight: 1, ...role9("display", spec, { fontSize: 118, lineHeight: 1, fontWeight: 400 }) }),
    serif3(value7(spec, "quote", DEFAULTS9.statement.quote), spec, { position: "absolute", left: 156, top: 166, width: 670, fontSize: 48, lineHeight: 1.13 }),
    label7(value7(spec, "author", DEFAULTS9.statement.author), spec, { position: "absolute", left: 160, top: 384, width: 260 }),
    line({ left: 160, top: 356, width: 220, backgroundColor: theme8.ink }),
    navDots(spec, 2)
  ]);
}
function renderBarchart(spec) {
  const theme8 = colors9(spec);
  const bars = objectArray6(spec, "bars", DEFAULTS9.barchart.bars).slice(0, 4);
  return frame7(spec, "barchart", [
    serif3(value7(spec, "title", DEFAULTS9.barchart.title), spec, { position: "absolute", left: 94, top: 102, width: 340, fontSize: 44 }),
    body7(value7(spec, "body", DEFAULTS9.barchart.body), spec, { position: "absolute", left: 96, top: 204, width: 332 }),
    box({ position: "absolute", left: 504, top: 116, width: 330, height: 254, flexDirection: "row", alignItems: "flex-end" }, bars.map(
      (bar, index) => box({ width: 58, height: Math.max(42, Number(bar.value || 50) * 2.36), backgroundColor: index === 0 ? theme8.ink : theme8.line, marginRight: 24, alignItems: "center", justifyContent: "flex-end", paddingBottom: 10 }, [
        label7(String(bar.value || ""), spec, { color: index === 0 ? theme8.paper : theme8.ink, fontSize: 8, letterSpacing: 1.2, textAlign: "center" })
      ])
    )),
    line({ left: 492, top: 384, width: 372 }),
    ...bars.map((bar, index) => label7(bar.label || "", spec, { position: "absolute", left: 495 + index * 82, top: 402, width: 76, fontSize: 7, letterSpacing: 1.1, textAlign: "center" })),
    navDots(spec, 3)
  ]);
}
function renderTwocol(spec) {
  const theme8 = colors9(spec);
  const stats2 = objectArray6(spec, "stats", DEFAULTS9.twocol.stats).slice(0, 3);
  return frame7(spec, "twocol", [
    box({ position: "absolute", left: 92, top: 116, width: 360, height: 250, backgroundColor: theme8.stone, borderWidth: 1, borderColor: theme8.line }),
    line({ left: 92, top: 116, width: 360, height: 250, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: theme8.line, transform: "rotate(32deg)", transformOrigin: "0 0" }),
    line({ left: 92, top: 366, width: 360, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: theme8.line, transform: "rotate(-32deg)", transformOrigin: "0 0" }),
    label7("image placeholder", spec, { position: "absolute", left: 172, top: 232, width: 200, textAlign: "center" }),
    serif3(value7(spec, "title", DEFAULTS9.twocol.title), spec, { position: "absolute", left: 526, top: 112, width: 310, fontSize: 42 }),
    body7(value7(spec, "body", DEFAULTS9.twocol.body), spec, { position: "absolute", left: 528, top: 214, width: 300, fontSize: 12.5, lineHeight: 1.42 }),
    body7(value7(spec, "note", DEFAULTS9.twocol.note), spec, { position: "absolute", left: 528, top: 286, width: 300, fontSize: 12.5, lineHeight: 1.42 }),
    box({ position: "absolute", left: 526, top: 346, width: 314, flexDirection: "row" }, stats2.map(
      (item) => box({ width: 96, minHeight: 58, marginRight: 12, borderTopWidth: 1, borderColor: theme8.line, paddingTop: 12, flexDirection: "column" }, [
        metric3(item.value || "", spec, { fontSize: 25, marginBottom: 6 }),
        label7(item.label || "", spec, { fontSize: 7, letterSpacing: 1.2 })
      ])
    )),
    navDots(spec, 4)
  ]);
}
function renderCards2(spec) {
  const theme8 = colors9(spec);
  const cards = objectArray6(spec, "cards", DEFAULTS9.cards.cards).slice(0, 3);
  return frame7(spec, "cards", [
    serif3(value7(spec, "title", DEFAULTS9.cards.title), spec, { position: "absolute", left: 96, top: 82, width: 470, fontSize: 42 }),
    box({ position: "absolute", left: 96, top: 180, width: 760, flexDirection: "row" }, cards.map(
      (card2) => box({ width: 232, minHeight: 218, borderWidth: 1, borderColor: theme8.line, backgroundColor: theme8.veil, padding: "30px 22px", marginRight: 32, flexDirection: "column" }, [
        box({ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme8.line, alignItems: "center", justifyContent: "center", marginBottom: 28 }, [
          label7(card2.mark || "", spec, { color: theme8.accent, fontSize: 9, textAlign: "center" })
        ]),
        serif3(card2.title || "", spec, { fontSize: 23, lineHeight: 1.08, marginBottom: 14 }),
        body7(card2.body || "", spec, { fontSize: 12, lineHeight: 1.45 })
      ])
    )),
    navDots(spec, 5)
  ]);
}
function renderLinechart(spec) {
  const theme8 = colors9(spec);
  const points = array8(spec, "points", DEFAULTS9.linechart.points).slice(0, 6).map((point) => Number(point) || 20);
  return frame7(spec, "linechart", [
    serif3(value7(spec, "title", DEFAULTS9.linechart.title), spec, { position: "absolute", left: 94, top: 92, width: 400, fontSize: 42 }),
    body7(value7(spec, "body", DEFAULTS9.linechart.body), spec, { position: "absolute", left: 96, top: 194, width: 360, fontSize: 13.5, lineHeight: 1.45 }),
    box({ position: "absolute", left: 136, top: 278, width: 684, height: 1, backgroundColor: theme8.line }),
    box({ position: "absolute", left: 136, top: 342, width: 684, height: 1, backgroundColor: theme8.line }),
    box({ position: "absolute", left: 136, top: 406, width: 684, height: 1, backgroundColor: theme8.line }),
    ...points.map((point, index) => box({ position: "absolute", left: 152 + index * 118, top: 424 - point * 2, width: 14, height: 14, borderRadius: 7, backgroundColor: theme8.ink })),
    ...points.slice(0, -1).map((point, index) => {
      const next = points[index + 1];
      const y1 = 431 - point * 2;
      const y2 = 431 - next * 2;
      const y = Math.min(y1, y2);
      const height = Math.max(1, Math.abs(y2 - y1));
      return line({ left: 164 + index * 118, top: y, width: 122, height, backgroundColor: theme8.ink, opacity: 0.42 });
    }),
    navDots(spec, 6)
  ]);
}
function renderTimeline6(spec) {
  const theme8 = colors9(spec);
  const steps = objectArray6(spec, "steps", DEFAULTS9.timeline.steps).slice(0, 4);
  return frame7(spec, "timeline", [
    serif3(value7(spec, "title", DEFAULTS9.timeline.title), spec, { position: "absolute", left: 94, top: 82, width: 440, fontSize: 42 }),
    line({ left: 120, top: 306, width: 724 }),
    ...steps.map(
      (step, index) => box({ position: "absolute", left: 120 + index * 180, top: 224, width: 154, minHeight: 158, flexDirection: "column" }, [
        metric3(step.year || String(index + 1).padStart(2, "0"), spec, { color: theme8.accent, fontSize: 24, marginBottom: 38 }),
        box({ width: 12, height: 12, borderRadius: 6, backgroundColor: theme8.ink, marginBottom: 24 }),
        serif3(step.title || "", spec, { fontSize: 22, lineHeight: 1.05, marginBottom: 12 }),
        body7(step.body || "", spec, { fontSize: 11.5, lineHeight: 1.38, width: 150 })
      ])
    ),
    navDots(spec, 7)
  ]);
}
function renderTeam3(spec) {
  const theme8 = colors9(spec);
  const people = objectArray6(spec, "people", DEFAULTS9.team.people).slice(0, 4);
  return frame7(spec, "team", [
    serif3(value7(spec, "title", DEFAULTS9.team.title), spec, { position: "absolute", left: 96, top: 80, width: 420, fontSize: 42 }),
    box({ position: "absolute", left: 112, top: 188, width: 736, flexDirection: "row" }, people.map(
      (person) => box({ width: 154, minHeight: 220, marginRight: 40, alignItems: "center", flexDirection: "column" }, [
        box({ width: 110, height: 110, borderRadius: 55, backgroundColor: theme8.stone, borderWidth: 1, borderColor: theme8.line, alignItems: "center", justifyContent: "center", marginBottom: 24 }, [
          metric3(person.initial || "", spec, { color: theme8.accent, fontSize: 34, textAlign: "center" })
        ]),
        serif3(person.name || "", spec, { fontSize: 20, lineHeight: 1.05, textAlign: "center", marginBottom: 12 }),
        label7(person.role || "", spec, { fontSize: 7.5, letterSpacing: 1.3, textAlign: "center", width: 140 })
      ])
    )),
    navDots(spec, 8)
  ]);
}
function renderClosing5(spec) {
  const theme8 = colors9(spec);
  return frame7(spec, "closing", [
    ring({ left: 343, top: 116, width: 274, height: 274, opacity: 0.4 }),
    ring({ left: 382, top: 155, width: 196, height: 196, opacity: 0.28 }),
    line({ left: 468, top: 166, width: 28, backgroundColor: theme8.ink }),
    serif3(value7(spec, "title", DEFAULTS9.closing.title), spec, { position: "absolute", left: 330, top: 206, width: 300, fontSize: 42, lineHeight: 1, textAlign: "center" }),
    body7(value7(spec, "subtitle", DEFAULTS9.closing.subtitle), spec, { position: "absolute", left: 300, top: 278, width: 360, textAlign: "center" }),
    label7(value7(spec, "contact", DEFAULTS9.closing.contact), spec, { position: "absolute", left: 330, top: 344, width: 300, textAlign: "center", fontSize: 8 }),
    navDots(spec, 9)
  ]);
}
var RENDERERS8 = {
  title: renderTitle,
  agenda: renderAgenda4,
  statement: renderStatement3,
  barchart: renderBarchart,
  twocol: renderTwocol,
  cards: renderCards2,
  linechart: renderLinechart,
  timeline: renderTimeline6,
  team: renderTeam3,
  closing: renderClosing5
};
function renderCartesianArchitecturalSpec(spec) {
  const variant = normalizeVariant10(spec);
  return (RENDERERS8[variant] || renderTitle)(spec);
}

// templates/beautiful/long-table-printed-program.mjs
var templateId12 = "printed-program";
var CANVAS6 = { width: 960, height: 540 };
var PAGE_VARIANTS11 = ["cover", "manifesto", "index", "featured", "menu", "quote", "cal", "closing"];
var rendererContract12 = {
  template_id: templateId12,
  renderer_id: `artboard_satori.${templateId12}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "long-table",
  implemented_page_variants: PAGE_VARIANTS11,
  page_family: {
    family_id: "long-table",
    supported_page_variants: PAGE_VARIANTS11,
    variant_usage_policy: {
      singletons: ["cover", "quote", "closing"],
      repeatable: ["manifesto", "index", "featured", "menu", "cal"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/long-table-1.png"
};
var DEFAULTS10 = {
  cover: {
    edition: "5",
    eyebrow: "december edition",
    title: "Long Table",
    city: "Lisbon",
    cta: "Apply now",
    availability: "22 seats only",
    lede: "More than dinner, it's a long evening.",
    badge: "Not a meal, an evening",
    tagline: "Where ten strangers, one cook, and a long evening meet under low light. Twice a month, by application.",
    issue: "No.\n05",
    right_meta: "December \xB7 Lisbon \xB7 Edition",
    right_note: "Twice a month, ten strangers, one cook, one long table. By application.",
    page: "01 / 08"
  },
  manifesto: {
    edition: "\xB7",
    eyebrow: "a letter from the table",
    title: "A note\nbefore\nwe sit.",
    paragraphs: [
      "We started Long Table in a borrowed kitchen, with six chairs we'd carried up the stairs, and the conviction that an evening is more than the food on the plates.",
      "Three years on we've seated almost two thousand strangers across nine cities, and we've learned that the chairs are sometimes the most important part.",
      "This deck is the small handbook we send our hosts before each edition. It is also, quietly, an invitation."
    ],
    signature: "Iris & Theo",
    signature_meta: "Long Table founders",
    page: "02 / 08"
  },
  index: {
    title: "Three recent editions",
    label: "Long Table \xB7 2025 \xB7 selected",
    cards: [
      {
        num: "No. 03",
        city: "Mexico City",
        name: "A Plate\nof Quiet",
        desc: "Eight courses cooked entirely on a single induction ring. The room agreed not to use phones for the entire evening, and almost kept the agreement.",
        seats: "22 seats",
        date: "14 March 2025"
      },
      {
        num: "No. 04",
        city: "Tokyo",
        name: "A Soup\nof Letters",
        desc: "A reading evening, with a single course served slowly. Four guest writers, one bowl per person, and the longest pause we have ever held between courses.",
        seats: "18 seats",
        date: "06 July 2025"
      },
      {
        num: "No. 05",
        city: "Lisbon",
        name: "December\nEdition",
        desc: "A long winter dinner. Twenty-two seats, one shared roast, and a quiet bookshop next door we'll wander to between courses, when the rain agrees.",
        seats: "22 seats",
        date: "11 December 2025"
      }
    ],
    page: "03 / 08"
  },
  featured: {
    edition: "5",
    eyebrow: "december \xB7 the featured edition",
    title: "An evening\nfor the rain.",
    lede: "A long winter dinner in a converted printing room above a bookshop. One shared roast, an unhurried wine list, and a single intermission that may, if the weather agrees, become a walk to the harbour and back.",
    pills: ["Apply by 28 November", "Twelve seats left"],
    info: [
      { key: "When", value: "11 December 2025", serif: true },
      { key: "Where", value: "A printing room, Bairro Alto \xB7 Lisbon", serif: true },
      { key: "Who", value: "Twenty-two seats, by application", serif: true },
      { key: "How long", value: "From eight, well into the evening", serif: true },
      { key: "Seat", value: "\u20AC84" }
    ],
    page: "04 / 08"
  },
  menu: {
    kicker: "A Menu, in Five Slow Movements",
    title: "December \xB7 Lisbon",
    courses: [
      { num: "i.", name: "Roasted chestnut soup", desc: "with brown butter, sage, and a single thin disc of pear", pair: "unoaked white" },
      { num: "ii.", name: "A small bread, hot", desc: "made the morning of, with cultured butter and a coarse salt", pair: "water, lemon" },
      { num: "iii.", name: "Mackerel, lightly cured", desc: "on toasted rye, with parsley oil and pickled celery", pair: "vinho verde" },
      { num: "iv.", name: "A long roast, the centre course", desc: "slow lamb shoulder, root vegetables under it, served family-style", pair: "douro red" },
      { num: "v.", name: "Cheese, two only", desc: "a soft, a hard, both local; quince paste and walnuts in the half-shell", pair: "port, late bottled" }
    ],
    page: "05 / 08"
  },
  quote: {
    kicker: "A guest writes",
    quote: "An evening I keep describing, badly, to people who weren't there.",
    author: "Hana Brennan",
    meta: "long-table guest \xB7 Edition No. 04 \xB7 Tokyo",
    page: "06 / 08"
  },
  cal: {
    title: "What's coming up",
    label: "2026 calendar \xB7 subject to weather",
    headers: ["No.", "City", "Theme", "Date", "Status"],
    rows: [
      ["06", "Lisbon", "A long winter dinner, with a roast and a walk", "11 December 2025", "Sold out"],
      ["07", "Brooklyn", "A reading evening, with one quiet course", "17 January 2026", "12 seats left"],
      ["08", "Mexico City", "A small breakfast, taken slowly", "22 February 2026", "Apply now"],
      ["09", "Athens", "A spring supper, on a roof, with wind", "14 March 2026", "Apply now"],
      ["10", "Seoul", "A small soup of late letters", "06 May 2026", "Apply soon"],
      ["11", "Paris", "An afternoon, mostly cheese and wind", "18 June 2026", "Wait list"]
    ],
    page: "07 / 08"
  },
  closing: {
    edition: "\xB7",
    eyebrow: "come and sit with us",
    title: "See you\nat the table.",
    desc: "Every Long Table evening is by application. We read each one, and we usually answer within a week. The next room opens for Brooklyn on the seventeenth of January.",
    pills: ["long-table.co", "Apply for Brooklyn"],
    footer: [
      { tag: "Founded", value: "2019 \xB7 Borrowed kitchen" },
      { tag: "Set", value: "Nine cities \xB7 one long room" },
      { tag: "Until then", value: "Keep the chair warm" }
    ],
    page: "08 / 08"
  }
};
function theme(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || "#FAF1E2",
    paperD: source.panel || "#F2E5CF",
    paperVD: "#E8D7B6",
    ink: source.primary || "#B53D2A",
    deep: source.text || "#8E2D1F",
    faint: "rgba(181, 61, 42, 0.32)",
    soft: "rgba(181, 61, 42, 0.14)"
  };
}
function array9(spec, key, fallback2 = []) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function content5(spec, variant) {
  return { ...DEFAULTS10[variant] || DEFAULTS10.cover, ...spec.content || {} };
}
function normalizeVariant11(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS11.length) return PAGE_VARIANTS11[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS11) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("chapter")) return "manifesto";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("closing") || raw.includes("end")) return "closing";
  if (raw.includes("process") || raw.includes("timeline") || raw.includes("calendar")) return "cal";
  if (raw.includes("menu") || raw.includes("content")) return "menu";
  if (raw.includes("data") || raw.includes("chart") || raw.includes("metric")) return "index";
  return "featured";
}
function role10(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function page4(spec, children = []) {
  const t = theme(spec);
  return box(
    {
      width: CANVAS6.width,
      height: CANVAS6.height,
      position: "relative",
      backgroundColor: t.paper,
      color: t.ink,
      overflow: "hidden"
    },
    children.filter(Boolean)
  );
}
function label8(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    ...role10("label", spec, { fontWeight: 700 }),
    color: theme(spec).ink,
    fontSize: 13,
    lineHeight: 1.15,
    ...style
  });
}
function serif4(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    ...role10("body", spec, { fontWeight: 400, lineHeight: 1.42 }),
    color: theme(spec).ink,
    fontSize: 18,
    lineHeight: 1.42,
    ...style
  });
}
function display3(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    ...role10("display", spec, { fontWeight: 800, lineHeight: 0.92, letterSpacing: -0.8, textTransform: "uppercase" }),
    color: theme(spec).ink,
    whiteSpace: "pre-line",
    fontSize: 72,
    lineHeight: 0.92,
    letterSpacing: -0.8,
    ...style
  });
}
function badge(value15, spec, style = {}) {
  const t = theme(spec);
  return TextBlock(String(value15 || ""), {
    ...role10("metric", spec, { fontWeight: 400, fontStyle: "italic" }),
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: t.ink,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: t.ink,
    fontSize: 16,
    lineHeight: 1,
    ...style
  });
}
function pill2(value15, spec, style = {}) {
  const t = theme(spec);
  return TextBlock(String(value15 || ""), {
    ...role10("body", spec, { fontWeight: 400, fontStyle: "italic", lineHeight: 1.05 }),
    minWidth: 84,
    height: 34,
    borderWidth: 1.5,
    borderColor: t.ink,
    borderRadius: 17,
    padding: "7px 18px",
    color: t.ink,
    fontSize: 14,
    lineHeight: 1.05,
    textAlign: "center",
    ...style
  });
}
function rectTag(value15, spec, style = {}) {
  const t = theme(spec);
  return TextBlock(String(value15 || ""), {
    ...role10("body", spec, { fontWeight: 400, fontStyle: "italic", lineHeight: 1 }),
    minWidth: 120,
    height: 28,
    borderWidth: 1.5,
    borderColor: t.ink,
    padding: "6px 12px",
    color: t.ink,
    fontSize: 13,
    lineHeight: 1,
    ...style
  });
}
function pageNum(value15, spec) {
  return label8(value15, spec, {
    position: "absolute",
    right: 34,
    bottom: 18,
    fontSize: 10,
    opacity: 0.86,
    ...role10("metric", spec, { fontSize: 10, lineHeight: 1, fontWeight: 400, fontStyle: "italic" })
  });
}
function rule2(style = {}) {
  const { theme: themeValue, ...rest } = style;
  const t = themeValue || {};
  return box({
    height: 1.5,
    backgroundColor: t.ink || "#B53D2A",
    ...rest
  });
}
function renderCover10(spec) {
  const t = theme(spec);
  const c = content5(spec, "cover");
  return page4(spec, [
    badge(c.edition, spec, { position: "absolute", left: 62, top: 76 }),
    serif4(c.eyebrow, spec, { position: "absolute", left: 112, top: 81, fontSize: 21, lineHeight: 1, fontStyle: "italic" }),
    display3(c.title, spec, { position: "absolute", left: 62, top: 142, width: 320, height: 118, fontSize: 56, lineHeight: 0.92 }),
    box({ position: "absolute", left: 62, top: 282, width: 250, height: 34, flexDirection: "row", gap: 11, alignItems: "center" }, [
      pill2(c.city, spec),
      serif4("|", spec, { fontSize: 18, lineHeight: 1, opacity: 0.7 }),
      pill2(c.cta, spec, { minWidth: 104 })
    ]),
    serif4(c.availability, spec, { position: "absolute", left: 62, top: 332, width: 300, fontSize: 17, lineHeight: 1.2, fontWeight: 600 }),
    serif4(c.lede, spec, { position: "absolute", left: 62, top: 356, width: 330, fontSize: 17, lineHeight: 1.34, fontStyle: "italic" }),
    rectTag(c.badge, spec, { position: "absolute", left: 62, top: 416, minWidth: 164 }),
    serif4(c.tagline, spec, { position: "absolute", left: 62, top: 452, width: 330, fontSize: 17, lineHeight: 1.28, fontStyle: "italic" }),
    box({ position: "absolute", right: 58, top: 66, width: 430, height: 370, alignItems: "flex-end", justifyContent: "center", flexDirection: "column" }, [
      TextBlock(String(c.issue || "").replace(" ", "\n"), {
        width: 410,
        textAlign: "right",
        whiteSpace: "pre-line",
        color: t.ink,
        fontSize: 154,
        lineHeight: 0.86,
        letterSpacing: -3,
        ...role10("metric", spec, { fontWeight: 400, lineHeight: 0.86, letterSpacing: -3, fontStyle: "italic" })
      }),
      label8(String(c.right_meta || "").toUpperCase(), spec, { marginTop: 8, width: 330, textAlign: "right", fontSize: 12, letterSpacing: 2 }),
      serif4(c.right_note, spec, { marginTop: 22, width: 300, textAlign: "right", fontSize: 16, lineHeight: 1.38 })
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderManifesto3(spec) {
  const c = content5(spec, "manifesto");
  const paragraphs = array9(spec, "paragraphs", c.paragraphs);
  return page4(spec, [
    box({ position: "absolute", left: 88, top: 108, width: 320, bottom: 112, flexDirection: "column", justifyContent: "center" }, [
      box({ flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 30 }, [
        badge(c.edition, spec),
        serif4(c.eyebrow, spec, { fontSize: 18, lineHeight: 1.1, fontStyle: "italic" })
      ]),
      display3(c.title, spec, { width: 300, fontSize: 65, lineHeight: 0.9 })
    ]),
    box({ position: "absolute", left: 475, top: 118, width: 390, bottom: 108, flexDirection: "column", justifyContent: "center", gap: 18 }, [
      ...paragraphs.slice(0, 3).map(
        (para, index) => serif4(para, spec, {
          fontSize: 18,
          lineHeight: 1.42,
          fontWeight: index === 1 ? 500 : 400,
          fontStyle: "italic"
        })
      ),
      box({ marginTop: 8, flexDirection: "column", gap: 4 }, [
        label8(c.signature, spec, { fontSize: 15, textTransform: "uppercase" }),
        serif4(c.signature_meta, spec, { fontSize: 14, lineHeight: 1.1, opacity: 0.78, fontStyle: "italic" })
      ])
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderIndex(spec) {
  const t = theme(spec);
  const c = content5(spec, "index");
  const cards = array9(spec, "cards", c.cards);
  return page4(spec, [
    box({ position: "absolute", left: 64, right: 64, top: 92, bottom: 98, flexDirection: "column", gap: 28 }, [
      box({ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1.5, borderColor: t.ink, paddingBottom: 16 }, [
        display3(c.title, spec, { width: 570, fontSize: 48, lineHeight: 0.96 }),
        serif4(c.label, spec, { width: 210, textAlign: "right", fontSize: 14, lineHeight: 1.35, fontStyle: "italic" })
      ]),
      box({ flexDirection: "row", gap: 22, alignItems: "stretch" }, cards.slice(0, 3).map(
        (card2) => box({ width: 262, minHeight: 230, borderWidth: 1.5, borderColor: t.ink, padding: "20px 18px", flexDirection: "column" }, [
          box({ flexDirection: "row", gap: 10, alignItems: "center", borderBottomWidth: 1, borderColor: t.faint, paddingBottom: 12 }, [
            serif4(card2.num, spec, { fontSize: 13, lineHeight: 1, fontStyle: "italic" }),
            serif4(card2.city, spec, { marginLeft: "auto", fontSize: 13, lineHeight: 1, fontStyle: "italic" })
          ]),
          display3(card2.name, spec, { marginTop: 14, fontSize: 28, lineHeight: 0.96, whiteSpace: "pre-line" }),
          serif4(card2.desc, spec, { marginTop: 12, fontSize: 13, lineHeight: 1.42, fontStyle: "italic", flex: 1 }),
          box({ marginTop: 14, borderTopWidth: 1, borderStyle: "dashed", borderColor: t.faint, paddingTop: 10, flexDirection: "row" }, [
            serif4(card2.seats, spec, { fontSize: 12, lineHeight: 1, fontStyle: "italic" }),
            serif4(card2.date, spec, { marginLeft: "auto", fontSize: 12, lineHeight: 1, fontStyle: "italic", textAlign: "right" })
          ])
        ])
      ))
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderFeatured(spec) {
  const t = theme(spec);
  const c = content5(spec, "featured");
  const pills = array9(spec, "pills", c.pills);
  const info = array9(spec, "info", c.info);
  return page4(spec, [
    box({ position: "absolute", left: 88, top: 105, width: 380, bottom: 130, flexDirection: "column", justifyContent: "center" }, [
      box({ flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 26 }, [
        badge(c.edition, spec),
        serif4(c.eyebrow, spec, { fontSize: 17, lineHeight: 1.1, fontStyle: "italic" })
      ]),
      display3(c.title, spec, { width: 380, height: 150, fontSize: 52, lineHeight: 0.9 }),
      serif4(c.lede, spec, { marginTop: 18, width: 360, fontSize: 15, lineHeight: 1.42, fontStyle: "italic" }),
      box({ marginTop: 16, flexDirection: "row", gap: 16, flexWrap: "wrap" }, pills.slice(0, 2).map((item) => pill2(item, spec, { minWidth: 150 })))
    ]),
    box({ position: "absolute", right: 78, top: 112, width: 382, bottom: 126, borderWidth: 1.5, borderColor: t.ink, padding: "28px 28px", flexDirection: "column", justifyContent: "center", gap: 13 }, info.slice(0, 5).map(
      (item) => box({ minHeight: 42, borderBottomWidth: 1, borderStyle: "dashed", borderColor: t.faint, paddingBottom: 10, flexDirection: "row", alignItems: "baseline", gap: 18 }, [
        label8(item.key, spec, { width: 92, fontSize: 11, letterSpacing: 1.6 }),
        item.serif ? serif4(item.value, spec, { flex: 1, textAlign: "right", fontSize: 17, lineHeight: 1.18, fontStyle: "italic" }) : display3(item.value, spec, { flex: 1, textAlign: "right", fontSize: 28, lineHeight: 1 })
      ])
    )),
    pageNum(c.page, spec)
  ]);
}
function renderMenu(spec) {
  const t = theme(spec);
  const c = content5(spec, "menu");
  const courses = array9(spec, "courses", c.courses);
  return page4(spec, [
    box({ position: "absolute", left: 130, right: 130, top: 52, bottom: 98, flexDirection: "column" }, [
      box({ alignItems: "center", flexDirection: "column", gap: 8, marginBottom: 14 }, [
        serif4(c.kicker, spec, { fontSize: 17, lineHeight: 1, fontStyle: "italic", textAlign: "center" }),
        display3(c.title, spec, { fontSize: 47, lineHeight: 0.94, textAlign: "center" })
      ]),
      box({ flexDirection: "column" }, courses.slice(0, 5).map(
        (course) => box({ minHeight: 58, borderBottomWidth: 1, borderColor: t.faint, padding: "11px 0", flexDirection: "row", alignItems: "center", gap: 18 }, [
          serif4(course.num, spec, { width: 50, fontSize: 16, lineHeight: 1, fontStyle: "italic" }),
          box({ flex: 1, flexDirection: "column", gap: 4 }, [
            display3(course.name, spec, { fontSize: 22, lineHeight: 1.05 }),
            serif4(course.desc, spec, { fontSize: 13, lineHeight: 1.32, fontStyle: "italic" })
          ]),
          serif4(course.pair, spec, { width: 138, textAlign: "right", fontSize: 13, lineHeight: 1.15, fontStyle: "italic", opacity: 0.78 })
        ])
      ))
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderQuote10(spec) {
  const t = theme(spec);
  const c = content5(spec, "quote");
  return page4(spec, [
    box({ position: "absolute", left: 156, right: 156, top: 124, bottom: 126, alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }, [
      serif4(c.kicker, spec, { fontSize: 17, lineHeight: 1, fontStyle: "italic", textAlign: "center", marginBottom: 26 }),
      display3(c.quote, spec, { width: 650, fontSize: 44, lineHeight: 0.98, textAlign: "center" }),
      rule2({ theme: t, width: 210, marginTop: 26, marginBottom: 16 }),
      label8(c.author, spec, { textAlign: "center", fontSize: 15 }),
      serif4(c.meta, spec, { marginTop: 5, textAlign: "center", fontSize: 13, lineHeight: 1.2, fontStyle: "italic", opacity: 0.78 })
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderCal(spec) {
  const t = theme(spec);
  const c = content5(spec, "cal");
  const rows = array9(spec, "rows", c.rows);
  return page4(spec, [
    box({ position: "absolute", left: 78, right: 78, top: 82, bottom: 96, flexDirection: "column" }, [
      box({ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1.5, borderColor: t.ink, paddingBottom: 14, marginBottom: 14 }, [
        display3(c.title, spec, { width: 500, fontSize: 48, lineHeight: 0.94 }),
        serif4(c.label, spec, { width: 230, textAlign: "right", fontSize: 14, lineHeight: 1.3, fontStyle: "italic" })
      ]),
      box({ height: 23, borderBottomWidth: 1.5, borderColor: t.ink, flexDirection: "row", alignItems: "center" }, [
        label8("No.", spec, { width: 74, fontSize: 11 }),
        label8("City", spec, { width: 118, fontSize: 11 }),
        label8("Theme", spec, { width: 330, fontSize: 11 }),
        label8("Date", spec, { width: 145, fontSize: 11 }),
        label8("Status", spec, { width: 128, fontSize: 11, textAlign: "right" })
      ]),
      ...rows.slice(0, 6).map(
        (row) => box({ minHeight: 42, borderBottomWidth: 1, borderColor: t.faint, flexDirection: "row", alignItems: "center", padding: "7px 0" }, [
          serif4(row[0], spec, { width: 74, fontSize: 14, lineHeight: 1, fontStyle: "italic" }),
          display3(row[1], spec, { width: 118, fontSize: 18, lineHeight: 1 }),
          serif4(row[2], spec, { width: 330, fontSize: 15, lineHeight: 1.25, fontStyle: "italic" }),
          serif4(row[3], spec, { width: 145, fontSize: 13, lineHeight: 1.15, fontStyle: "italic" }),
          pill2(row[4], spec, {
            minWidth: 98,
            height: 26,
            padding: "5px 12px",
            fontSize: 12,
            backgroundColor: row[4] === "Sold out" ? t.ink : "transparent",
            color: row[4] === "Sold out" ? t.paper : t.ink
          })
        ])
      )
    ]),
    pageNum(c.page, spec)
  ]);
}
function renderClosing6(spec) {
  const t = theme(spec);
  const c = content5(spec, "closing");
  const pills = array9(spec, "pills", c.pills);
  const footer4 = array9(spec, "footer", c.footer);
  return page4(spec, [
    box({ position: "absolute", left: 84, top: 110, width: 620, flexDirection: "column", gap: 22 }, [
      box({ flexDirection: "row", gap: 14, alignItems: "center" }, [
        badge(c.edition, spec),
        serif4(c.eyebrow, spec, { fontSize: 18, lineHeight: 1.1, fontStyle: "italic" })
      ]),
      display3(c.title, spec, { width: 560, fontSize: 58, lineHeight: 0.92 }),
      serif4(c.desc, spec, { width: 430, fontSize: 17, lineHeight: 1.5, fontStyle: "italic" }),
      box({ flexDirection: "row", gap: 14, flexWrap: "wrap" }, pills.slice(0, 2).map((item) => pill2(item, spec, { minWidth: 130 })))
    ]),
    box({ position: "absolute", left: 82, right: 82, bottom: 36, flexDirection: "row", gap: 34 }, footer4.slice(0, 3).map(
      (item) => box({ flex: 1, borderTopWidth: 1, borderColor: t.ink, paddingTop: 10, flexDirection: "column", gap: 3 }, [
        label8(item.tag, spec, { fontSize: 12 }),
        serif4(item.value, spec, { fontSize: 13, lineHeight: 1.25, fontStyle: "italic" })
      ])
    )),
    pageNum(c.page, spec)
  ]);
}
var RENDERERS9 = {
  cover: renderCover10,
  manifesto: renderManifesto3,
  index: renderIndex,
  featured: renderFeatured,
  menu: renderMenu,
  quote: renderQuote10,
  cal: renderCal,
  closing: renderClosing6
};
function renderLongTablePrintedProgram(spec) {
  const variant = normalizeVariant11(spec || {});
  return (RENDERERS9[variant] || renderCover10)(spec || {});
}

// templates/beautiful/monochrome-ledger-briefing.mjs
var templateId13 = "ledger-briefing";
var PAGE_VARIANTS12 = [
  "cover",
  "chapter",
  "statement",
  "split",
  "stats",
  "list",
  "compare",
  "quote",
  "dense",
  "chart",
  "diagram",
  "pie",
  "vtimeline",
  "cycle",
  "pyramid",
  "end"
];
var rendererContract13 = {
  template_id: templateId13,
  renderer_id: `artboard_satori.${templateId13}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "monochrome",
  implemented_page_variants: PAGE_VARIANTS12,
  page_family: {
    family_id: "monochrome",
    supported_page_variants: PAGE_VARIANTS12,
    variant_usage_policy: {
      singletons: ["cover", "chapter", "quote", "end"],
      repeatable: ["statement", "split", "stats", "list", "compare", "dense", "chart", "diagram", "pie", "vtimeline", "cycle", "pyramid"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/monochrome-1.png"
};
var CANVAS7 = { width: 960, height: 540 };
var DEFAULTS11 = {
  cover: {
    eyebrow: "User Research Synthesis / [Month, Year]",
    title: "User Research Synthesis",
    subtitle: "What we learned from 24 interviews and what it means for the product.",
    footer_left: "Research Team - [Month, Year]",
    footer_right: "Round [N] - Internal",
    page: "01 / 16"
  },
  chapter: {
    chapter: "01 - Context",
    title: "Why we went back to users",
    subtitle: "Three months after launch, retention numbers told us something the metrics couldn't."
  },
  statement: {
    eyebrow: "Primary objective - Round [N] synthesis",
    header_left: "Key Finding",
    header_right: "03",
    title: "Users don't leave because they lose interest. They leave because they don't know what to do next."
  },
  split: {
    header_left: "User Behavior",
    header_right: "04",
    eyebrow: "The Pattern",
    title: "The first 48 hours determine everything",
    subtitle: "Users who complete three core actions in their first two days have a 4x higher 90-day retention rate. Most never get there.",
    bullets: [
      "Onboarding drop-off peaks at step 3",
      '"What do I do next?" is the most common exit trigger',
      "Users who invite a teammate retain at 2x the rate"
    ],
    caption: "Session recording review - [Month of study]"
  },
  stats: {
    header_left: "By the Numbers",
    header_right: "05",
    title: "What the data showed",
    stats: [
      { value: "68%", label: "of users churned within 14 days", note: "[Analytics tool] - [Launch month]" },
      { value: "3.2min", label: "Average time before abandonment on the setup flow", note: "Session recordings - n=240" },
      { value: "4x", label: "Higher 90-day retention for users who complete onboarding fully", note: "Cohort analysis" }
    ]
  },
  list: {
    header_left: "Recommendations",
    header_right: "06",
    eyebrow: "What to fix",
    title: "Five changes, ordered by impact",
    subtitle: "We recommend addressing these sequentially - later ones depend on the first landing.",
    bullets: [
      "Redesign the setup flow to three steps maximum",
      'Add a "start here" prompt on day one based on user type',
      "Surface the collaboration invite after first meaningful action",
      "Replace feature tour with outcome demonstration",
      "Build a 7-day email sequence that mirrors in-product progress"
    ]
  },
  compare: {
    header_left: "Current - Proposed",
    header_right: "07",
    left_label: "Current Onboarding",
    left_title: "9-step setup, any order",
    left_body: "Users choose their own path through setup. Most choose wrong.",
    left_bullets: ["Average 3.2 minutes to first value", "Step 6 is where 41% abandon", "No adaptive logic based on user type"],
    right_label: "Proposed Flow",
    right_title: "3-step guided path, adaptive",
    right_body: "User type detected at signup. Path adjusts. First value in under 90 seconds.",
    right_bullets: ["Target: 90 seconds to first value", "Eliminate decision paralysis at step entry", "Inline help triggered at abandonment signals"]
  },
  quote: {
    quote: `"I kept opening the app and then closing it again. I didn't know what I was supposed to do."`,
    author: "Participant 14 - 28 years old, Product Designer",
    context: "Churned after day 11"
  },
  dense: {
    header_left: "Analysis",
    header_right: "09",
    title: "Why onboarding problems compound over time",
    columns: [
      {
        title: "The Activation Trap",
        body: [
          "Activation is the moment a user experiences the core value of a product for the first time. When that moment is delayed, the mental model never fully forms.",
          "Each session that ends without activation reinforces the exit pattern. The gap between download and habit is where most products lose users permanently.",
          "Users who hit activation in session one have a 3x higher probability of returning in week two."
        ]
      },
      {
        title: "The Network Effect Delay",
        body: [
          "Collaboration products face a compounding problem: value increases with each additional teammate, but users must cross the value threshold alone.",
          "The median user does not discover the invitation flow until session four, after most have already churned.",
          "The single-player experience should become an explicit bridge to the collaborative one."
        ]
      }
    ]
  },
  chart: {
    header_left: "Retention Analysis",
    header_right: "11",
    title: "90-day retention by onboarding cohort",
    caption: "% retained - n=480 - [Q1 of study period]",
    bars: [
      { label: "Cohort 1", value: 34 },
      { label: "Cohort 2", value: 41 },
      { label: "Cohort 3", value: 48 },
      { label: "Proposed", value: 67, accent: true }
    ],
    source: "Source: [Analytics tool] - Cohort analysis - Proposed target based on redesigned onboarding flow"
  },
  diagram: {
    header_left: "Methodology",
    header_right: "12",
    title: "How this research was conducted",
    steps: [
      { number: "01", title: "Recruit", body: "24 participants screened from the active user base." },
      { number: "02", title: "Interview", body: "60-minute moderated sessions with cognitive walkthroughs." },
      { number: "03", title: "Analyse", body: "Affinity mapping across 340 observations." },
      { number: "04", title: "Validate", body: "Findings stress-tested against recordings and support data." }
    ]
  },
  pie: {
    header_left: "Participant Breakdown",
    header_right: "13",
    title: "Who we spoke with",
    segments: [
      { label: "Power Users", value: "38%" },
      { label: "Casual Users", value: "25%" },
      { label: "Churned Users", value: "22%" },
      { label: "Prospects", value: "15%" }
    ],
    total: "Total participants: [N] - [Study period]",
    source: "Source: Recruitment screener - [Study period]"
  },
  vtimeline: {
    header_left: "Process",
    header_right: "14",
    title: "From research to recommendation",
    timeline: [
      { date: "[Week 1]", title: "Recruitment", body: "Screened [N]+ applicants and selected participants across segments." },
      { date: "[Week 2-3]", title: "Fieldwork", body: "[N] moderated sessions. Think-aloud protocol. Sessions recorded and transcribed." },
      { date: "[Week 4]", title: "Synthesis", body: "Affinity mapping across observations. Pattern clustering by behaviour type." },
      { date: "[Week 5]", title: "Validation", body: "Findings stress-tested against analytics data and support ticket samples." }
    ]
  },
  cycle: {
    header_left: "Design Process",
    header_right: "15",
    title: "The design thinking cycle",
    steps: [
      { number: "01", title: "Empathise", body: "Understand users in their own context. Suspend assumptions." },
      { number: "02", title: "Define", body: "Reframe the problem as a testable point of view." },
      { number: "03", title: "Prototype", body: "Build to think, not to ship." },
      { number: "04", title: "Test", body: "Put prototypes in front of real users." }
    ]
  },
  pyramid: {
    header_left: "Research Framework",
    header_right: "17",
    eyebrow: "Research Framework",
    title: "Analysis Hierarchy",
    subtitle: "From raw observations to strategic insight",
    levels: ["Strategic Insight", "Behavioral Patterns", "Synthesized Themes", "Coded Observations", "Raw Field Notes"]
  },
  end: {
    eyebrow: "Research Team",
    title: "Questions, feedback, and next steps",
    subtitle: "[research@org.com] - [Slack #research] - Full report at [link]"
  }
};
function colors10(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || "#FAFADF",
    paper2: source.surface || source.bg_alt || "#F2F2D2",
    warm: source.panel || "#F5F0E4",
    ink: source.text || source.primary || "#1A1A16",
    muted: source.muted || "#5E5E54",
    faint: source.faint || "#8A8A80",
    line: source.line || "#1A1A16"
  };
}
var ROLE_FONT_RESOLVERS = {
  display: (spec, style) => fontRole("display", spec, style),
  body: (spec, style) => fontRole("body", spec, style),
  label: (spec, style) => fontRole("label", spec, style),
  metric: (spec, style) => fontRole("metric", spec, style)
};
function role11(roleName, spec, style = {}) {
  const resolver = ROLE_FONT_RESOLVERS[roleName] || ((inputSpec, inputStyle) => fontRole(roleName, inputSpec, inputStyle));
  return resolver(spec, style);
}
function text4(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function list(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const value15 = spec.content?.[key];
    if (Array.isArray(value15) && value15.length) return value15;
  }
  return fallback2;
}
function objectList(spec, keys, fallback2 = []) {
  return list(spec, keys, fallback2).filter((item) => item && typeof item === "object");
}
function upper4(value15) {
  return String(value15 || "").toUpperCase();
}
function normalizeVariant12(spec) {
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  const sourceClass = `${spec.page_family_source?.source_class || ""}`.toLowerCase();
  const value15 = `${raw} ${sourceClass}`;
  for (const variant of PAGE_VARIANTS12) {
    if (value15.includes(variant)) return variant;
  }
  if (value15.includes("agenda") || value15.includes("chapter")) return "chapter";
  if (value15.includes("quote")) return "quote";
  if (value15.includes("process") || value15.includes("timeline")) return "vtimeline";
  if (value15.includes("closing") || value15.includes("close") || value15.includes("end")) return "end";
  if (value15.includes("chart") || value15.includes("bar")) return "chart";
  if (value15.includes("diagram") || value15.includes("flow")) return "diagram";
  if (value15.includes("compare")) return "compare";
  if (value15.includes("split")) return "split";
  if (value15.includes("stat") || value15.includes("metric")) return "stats";
  if (value15.includes("dense") || value15.includes("detail")) return "dense";
  if (value15.includes("data")) return "stats";
  return "cover";
}
function fallback(variant) {
  return DEFAULTS11[variant] || DEFAULTS11.cover;
}
function titleLines(value15, fallbackValue) {
  const words = String(value15 || fallbackValue || "").replace(/\n+/g, " ").split(/\s+/).filter(Boolean);
  const mid = Math.max(1, Math.ceil(words.length / 2));
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].filter(Boolean);
}
function frame8(spec, variant, children, opts = {}) {
  const theme8 = colors10(spec);
  return box(
    {
      width: CANVAS7.width,
      height: CANVAS7.height,
      position: "relative",
      overflow: "hidden",
      backgroundColor: opts.background || theme8.paper,
      color: opts.color || theme8.ink
    },
    opts.chrome === false ? children : [...chrome2(spec, variant), ...children, ...foot(spec, variant)]
  );
}
function label9(value15, spec, style = {}) {
  return TextBlock(upper4(value15), {
    color: colors10(spec).faint,
    fontSize: 7,
    lineHeight: 1.05,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    ...role11("label", spec, { fontWeight: 400 }),
    ...style
  });
}
function body8(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: colors10(spec).muted,
    fontSize: 12,
    lineHeight: 1.55,
    ...role11("body", spec, { fontWeight: 300 }),
    ...style
  });
}
function heading(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: colors10(spec).ink,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: -0.3,
    ...role11("display", spec, { fontWeight: 200 }),
    ...style
  });
}
function metric4(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: colors10(spec).ink,
    fontSize: 52,
    lineHeight: 1,
    letterSpacing: -1.2,
    ...role11("metric", spec, { fontWeight: 200 }),
    ...style
  });
}
function chrome2(spec, variant) {
  const theme8 = colors10(spec);
  const data2 = fallback(variant);
  const left = text4(spec, "header_left", data2.header_left || variant.replace("-", " "));
  const right = text4(spec, "header_right", data2.header_right || String(spec.page_family_source?.source_slide_index || PAGE_VARIANTS12.indexOf(variant) + 1).padStart(2, "0"));
  return [
    box({ position: "absolute", left: 78, right: 78, top: 44, height: 1, backgroundColor: theme8.line }),
    label9(left, spec, { position: "absolute", left: 78, top: 28, color: theme8.faint }),
    label9(right, spec, { position: "absolute", right: 78, top: 28, color: theme8.faint, textAlign: "right" })
  ];
}
function foot(spec, variant) {
  const theme8 = colors10(spec);
  const page18 = spec.page_family_source?.source_slide_index || PAGE_VARIANTS12.indexOf(variant) + 1;
  return [
    box({ position: "absolute", left: 78, right: 78, bottom: 44, height: 1, backgroundColor: theme8.line }),
    label9(text4(spec, "footer_left", "User Research Synthesis"), spec, { position: "absolute", left: 78, bottom: 26, color: theme8.faint }),
    label9(text4(spec, "footer_right", `Research Team - ${String(page18).padStart(2, "0")}`), spec, { position: "absolute", right: 78, bottom: 26, color: theme8.faint, textAlign: "right" })
  ];
}
function bulletList3(items, spec, style = {}) {
  const theme8 = colors10(spec);
  return box({ flexDirection: "column", gap: style.gap || 12, ...style }, items.map(
    (item) => box({ flexDirection: "row", alignItems: "flex-start", width: style.width || "100%" }, [
      label9("-", spec, { color: theme8.faint, fontSize: style.markerSize || 13, width: 20, letterSpacing: 0 }),
      body8(String(item), spec, { width: style.textWidth || 300, fontSize: style.fontSize || 13, lineHeight: style.lineHeight || 1.45, color: style.color || theme8.ink })
    ])
  ));
}
function renderCover11(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("cover");
  const lines = titleLines(text4(spec, "title", data2.title), data2.title);
  return frame8(spec, "cover", [
    label9(text4(spec, "eyebrow", data2.eyebrow), spec, { position: "absolute", top: 46, right: 78, width: 330, textAlign: "right" }),
    box({ position: "absolute", left: 78, right: 78, bottom: 78, height: 1, backgroundColor: theme8.line }),
    box({ position: "absolute", left: 78, bottom: 110, width: 520, flexDirection: "column", gap: 12 }, [
      ...lines.map((item) => heading(item, spec, { fontSize: 64, lineHeight: 0.94, width: 520 })),
      box({ width: 36, height: 1, backgroundColor: theme8.line, marginTop: 12, marginBottom: 4 }),
      body8(text4(spec, "subtitle", data2.subtitle), spec, { width: 490, fontSize: 16, lineHeight: 1.55 })
    ]),
    label9(text4(spec, "footer_left", data2.footer_left), spec, { position: "absolute", left: 78, bottom: 50 }),
    label9(text4(spec, "footer_right", data2.footer_right), spec, { position: "absolute", right: 78, bottom: 50, textAlign: "right" })
  ], { chrome: false });
}
function renderChapter4(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("chapter");
  const lines = titleLines(text4(spec, "title", data2.title), data2.title);
  return frame8(spec, "chapter", [
    label9(text4(spec, "chapter", data2.chapter), spec, { position: "absolute", left: 120, top: 178, color: theme8.paper2 }),
    box({ position: "absolute", left: 120, top: 216, width: 36, height: 1, backgroundColor: theme8.paper2 }),
    box(
      { position: "absolute", left: 120, top: 246, width: 520, flexDirection: "column", gap: 2 },
      lines.map((item) => heading(item, spec, { color: theme8.paper, fontSize: 48, lineHeight: 1.08, width: 520 }))
    ),
    body8(text4(spec, "subtitle", data2.subtitle), spec, { position: "absolute", left: 120, top: 382, width: 430, color: "#B8B8AA", fontSize: 14, lineHeight: 1.55 })
  ], { chrome: false, background: theme8.ink, color: theme8.paper });
}
function renderStatement4(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("statement");
  return frame8(spec, "statement", [
    label9(text4(spec, "eyebrow", data2.eyebrow), spec, { position: "absolute", left: 130, top: 176, width: 500 }),
    heading(text4(spec, "title", data2.title), spec, {
      position: "absolute",
      left: 130,
      top: 210,
      width: 615,
      fontSize: 46,
      lineHeight: 1.08
    }),
    box({ position: "absolute", left: 130, top: 420, width: 36, height: 1, backgroundColor: theme8.line })
  ]);
}
function renderSplit4(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("split");
  const bullets = list(spec, ["bullets"], data2.bullets).slice(0, 3);
  return frame8(spec, "split", [
    box({ position: "absolute", left: 78, top: 96, width: 360, flexDirection: "column", gap: 15 }, [
      label9(text4(spec, "eyebrow", data2.eyebrow), spec),
      heading(text4(spec, "title", data2.title), spec, { fontSize: 34, lineHeight: 1.15, width: 330 }),
      body8(text4(spec, "subtitle", data2.subtitle), spec, { width: 350, fontSize: 14, lineHeight: 1.55 }),
      bulletList3(bullets, spec, { width: 350, textWidth: 316, fontSize: 12, gap: 8, lineHeight: 1.35 })
    ]),
    box({ position: "absolute", right: 78, top: 112, width: 352, height: 292, borderWidth: 1, borderColor: theme8.line, backgroundColor: theme8.paper2, alignItems: "center", justifyContent: "center" }, [
      label9("Image placeholder", spec, { color: theme8.muted, letterSpacing: 1.1 })
    ]),
    label9(text4(spec, "caption", data2.caption), spec, { position: "absolute", right: 78, top: 418, width: 352, opacity: 0.65 })
  ]);
}
function renderStats5(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("stats");
  const stats2 = objectList(spec, ["stats", "metrics", "items"], data2.stats).slice(0, 3);
  return frame8(spec, "stats", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 116, width: 600, fontSize: 36 }),
    box(
      { position: "absolute", left: 78, right: 78, top: 238, flexDirection: "row", gap: 0 },
      stats2.map((item) => box({ width: 268, minHeight: 180, borderTopWidth: 1, borderTopColor: theme8.line, paddingTop: 22, paddingRight: 28, flexDirection: "column", gap: 10 }, [
        metric4(item.value, spec, { fontSize: 56, letterSpacing: -1.4 }),
        body8(item.label, spec, { width: 218, color: theme8.ink, fontSize: 13, lineHeight: 1.42 }),
        label9(item.note || item.source || "", spec, { width: 218, lineHeight: 1.25 })
      ]))
    )
  ]);
}
function renderList3(spec) {
  const data2 = fallback("list");
  const bullets = list(spec, ["bullets", "items"], data2.bullets).slice(0, 5);
  return frame8(spec, "list", [
    box({ position: "absolute", left: 78, top: 144, width: 300, flexDirection: "column", gap: 16 }, [
      label9(text4(spec, "eyebrow", data2.eyebrow), spec),
      heading(text4(spec, "title", data2.title), spec, { fontSize: 34, lineHeight: 1.14 }),
      body8(text4(spec, "subtitle", data2.subtitle), spec, { width: 260, fontSize: 13, lineHeight: 1.55 })
    ]),
    box({ position: "absolute", right: 78, top: 142, width: 410 }, [
      bulletList3(bullets, spec, { width: 410, textWidth: 370, fontSize: 16, lineHeight: 1.45, gap: 18 })
    ])
  ]);
}
function comparePanel(spec, opts) {
  const theme8 = colors10(spec);
  return box({ width: 392, height: 312, paddingTop: 14, paddingRight: opts.right ? 0 : 42, paddingLeft: opts.right ? 42 : 0, flexDirection: "column", gap: 14, borderRightWidth: opts.right ? 0 : 1, borderRightColor: theme8.line }, [
    label9(opts.label, spec, { color: opts.right ? theme8.ink : theme8.faint, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme8.line }),
    heading(opts.title, spec, { fontSize: 24, lineHeight: 1.2, width: 300 }),
    body8(opts.body, spec, { width: 300, fontSize: 14, lineHeight: 1.45 }),
    bulletList3(opts.bullets, spec, { width: 300, textWidth: 270, fontSize: 11, gap: 8, lineHeight: 1.35 })
  ]);
}
function renderCompare3(spec) {
  const data2 = fallback("compare");
  return frame8(spec, "compare", [
    box({ position: "absolute", left: 78, top: 128, flexDirection: "row" }, [
      comparePanel(spec, {
        label: text4(spec, "left_label", data2.left_label),
        title: text4(spec, "left_title", data2.left_title),
        body: text4(spec, "left_body", data2.left_body),
        bullets: list(spec, ["left_bullets"], data2.left_bullets),
        right: false
      }),
      comparePanel(spec, {
        label: text4(spec, "right_label", data2.right_label),
        title: text4(spec, "right_title", data2.right_title),
        body: text4(spec, "right_body", data2.right_body),
        bullets: list(spec, ["right_bullets"], data2.right_bullets),
        right: true
      })
    ])
  ]);
}
function renderQuote11(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("quote");
  return frame8(spec, "quote", [
    TextBlock(text4(spec, "quote", data2.quote), {
      position: "absolute",
      left: 132,
      top: 156,
      width: 650,
      color: theme8.paper,
      fontSize: 32,
      lineHeight: 1.35,
      fontStyle: "italic",
      ...role11("body", spec, { fontWeight: 400 })
    }),
    label9(text4(spec, "author", data2.author), spec, { position: "absolute", left: 132, top: 370, color: "#B8B8AA", width: 430 }),
    label9(text4(spec, "context", data2.context), spec, { position: "absolute", left: 132, top: 392, color: "#B8B8AA", width: 430 })
  ], { chrome: false, background: theme8.ink, color: theme8.paper });
}
function renderDense2(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("dense");
  const columns = objectList(spec, ["columns", "details"], data2.columns).slice(0, 2);
  return frame8(spec, "dense", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 88, width: 690, fontSize: 31, lineHeight: 1.16 }),
    box({ position: "absolute", left: 78, right: 78, top: 168, height: 1, backgroundColor: theme8.line }),
    box(
      { position: "absolute", left: 78, right: 78, top: 195, flexDirection: "row", gap: 50 },
      columns.map((column) => box({ width: 377, flexDirection: "column", gap: 8 }, [
        label9(column.title || column.heading || "Analysis", spec, { color: theme8.faint, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme8.line }),
        ...(Array.isArray(column.body) ? column.body : Array.isArray(column.items) ? column.items : [column.body || column.description || ""]).slice(0, 3).map((item) => body8(item, spec, { width: 360, fontSize: 10.8, lineHeight: 1.55 }))
      ]))
    )
  ]);
}
function renderChart6(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("chart");
  const bars = objectList(spec, ["bars", "metrics"], data2.bars).slice(0, 5);
  const max = Math.max(100, ...bars.map((item) => Number(item.value) || 0));
  return frame8(spec, "chart", [
    box({ position: "absolute", left: 78, right: 78, top: 94, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, [
      heading(text4(spec, "title", data2.title), spec, { width: 560, fontSize: 32, lineHeight: 1.12 }),
      body8(text4(spec, "caption", data2.caption), spec, { width: 210, fontSize: 10, textAlign: "right" })
    ]),
    box(
      { position: "absolute", left: 122, top: 210, width: 730, height: 182, borderLeftWidth: 1, borderLeftColor: theme8.line, borderBottomWidth: 1, borderBottomColor: theme8.line, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingLeft: 22 },
      bars.map((item) => {
        const value15 = Number(item.value) || 0;
        return box({ width: 92, height: 170, flexDirection: "column", justifyContent: "flex-end", alignItems: "stretch", gap: 8 }, [
          TextBlock(`${value15}%`, { color: item.accent ? theme8.ink : theme8.muted, textAlign: "center", ...role11("metric", spec, { fontSize: 14, fontWeight: item.accent ? 500 : 300 }) }),
          box({ height: Math.max(24, value15 / max * 138), backgroundColor: item.accent ? theme8.ink : theme8.faint, opacity: item.accent ? 1 : 0.5 }),
          label9(item.label, spec, { textAlign: "center", fontSize: 7, letterSpacing: 0.8, color: theme8.faint })
        ]);
      })
    ),
    label9(text4(spec, "source", data2.source), spec, { position: "absolute", left: 122, top: 418, width: 620, lineHeight: 1.3 })
  ]);
}
function renderDiagram3(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("diagram");
  const steps = objectList(spec, ["steps", "items"], data2.steps).slice(0, 4);
  return frame8(spec, "diagram", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 104, width: 600, fontSize: 34 }),
    box(
      { position: "absolute", left: 78, right: 78, top: 218, flexDirection: "row" },
      steps.map((step) => box({ width: 201, borderTopWidth: 1, borderTopColor: theme8.line, paddingTop: 20, paddingRight: 30, flexDirection: "column", gap: 10 }, [
        metric4(step.number, spec, { color: theme8.faint, fontSize: 38 }),
        heading(step.title, spec, { fontSize: 20, lineHeight: 1.18, width: 150 }),
        body8(step.body, spec, { width: 150, fontSize: 11, lineHeight: 1.5 })
      ]))
    )
  ]);
}
function renderPie3(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("pie");
  const segments = objectList(spec, ["segments", "items"], data2.segments).slice(0, 4);
  const fills = [theme8.ink, theme8.muted, theme8.faint, theme8.paper2];
  return frame8(spec, "pie", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 104, width: 520, fontSize: 34 }),
    box({ position: "absolute", left: 148, top: 218, width: 164, height: 164, borderRadius: 82, borderWidth: 30, borderColor: theme8.ink, backgroundColor: theme8.paper, alignItems: "center", justifyContent: "center" }, [
      label9("PARTICIPANTS", spec, { color: theme8.muted, textAlign: "center", fontSize: 7, letterSpacing: 0.8 })
    ]),
    box(
      { position: "absolute", left: 360, top: 210, width: 408, flexDirection: "column", gap: 18 },
      segments.map((item, index) => box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 12, height: 12, backgroundColor: fills[index], borderWidth: index === 3 ? 1 : 0, borderColor: theme8.line, marginRight: 14 }),
        body8(item.label, spec, { width: 220, color: theme8.ink, fontSize: 16 }),
        label9(item.value, spec, { color: theme8.ink, fontSize: 12, letterSpacing: 1.2, textAlign: "right", width: 70 })
      ]))
    ),
    box({ position: "absolute", left: 360, top: 386, width: 408, height: 1, backgroundColor: theme8.line }),
    label9(text4(spec, "total", data2.total), spec, { position: "absolute", left: 360, top: 405, width: 408 })
  ]);
}
function renderVerticalTimeline(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("vtimeline");
  const items = objectList(spec, ["timeline", "items"], data2.timeline).slice(0, 4);
  return frame8(spec, "vtimeline", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 88, width: 690, fontSize: 34 }),
    box({ position: "absolute", left: 78, right: 78, top: 168, height: 1, backgroundColor: theme8.line }),
    box({ position: "absolute", left: 154, top: 202, width: 1, height: 238, backgroundColor: theme8.line }),
    ...items.flatMap((item, index) => {
      const y = 205 + index * 58;
      return [
        label9(item.date, spec, { position: "absolute", left: 78, top: y + 2, width: 58, textAlign: "right" }),
        box({ position: "absolute", left: 150, top: y + 4, width: 9, height: 9, borderRadius: 5, backgroundColor: theme8.ink }),
        heading(item.title, spec, { position: "absolute", left: 182, top: y - 2, width: 220, fontSize: 20, lineHeight: 1.2 }),
        body8(item.body, spec, { position: "absolute", left: 182, top: y + 25, width: 520, fontSize: 11, lineHeight: 1.42 })
      ];
    })
  ]);
}
function renderCycle3(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("cycle");
  const steps = objectList(spec, ["steps", "items"], data2.steps).slice(0, 4);
  const positions = [
    { left: 132, top: 176 },
    { left: 512, top: 176 },
    { left: 512, top: 334 },
    { left: 132, top: 334 }
  ];
  return frame8(spec, "cycle", [
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 94, width: 560, fontSize: 34 }),
    ...steps.flatMap((step, index) => {
      const pos = positions[index];
      return [
        box({ position: "absolute", left: pos.left, top: pos.top, width: 286, height: 116, borderTopWidth: 1, borderTopColor: theme8.line, paddingTop: 16, flexDirection: "column", gap: 8 }, [
          metric4(step.number, spec, { color: theme8.faint, fontSize: 30 }),
          heading(step.title, spec, { fontSize: 18, lineHeight: 1.15 }),
          body8(step.body, spec, { width: 238, fontSize: 10.8, lineHeight: 1.35 })
        ])
      ];
    }),
    label9("->", spec, { position: "absolute", left: 444, top: 220, color: theme8.faint, fontSize: 20, letterSpacing: 0 }),
    label9("v", spec, { position: "absolute", left: 642, top: 292, color: theme8.faint, fontSize: 20, letterSpacing: 0 }),
    label9("<-", spec, { position: "absolute", left: 444, top: 378, color: theme8.faint, fontSize: 20, letterSpacing: 0 }),
    label9("v", spec, { position: "absolute", left: 268, top: 292, color: theme8.faint, fontSize: 20, letterSpacing: 0 })
  ]);
}
function renderPyramid3(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("pyramid");
  const levels = list(spec, ["levels", "items"], data2.levels).slice(0, 5);
  const widths = [250, 360, 470, 580, 690];
  const fills = ["#34342E", "#5A5A51", "#88887A", "#C2C2A9", theme8.paper2];
  return frame8(spec, "pyramid", [
    label9(text4(spec, "eyebrow", data2.eyebrow), spec, { position: "absolute", left: 78, top: 92 }),
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 78, top: 124, width: 520, fontSize: 34 }),
    body8(text4(spec, "subtitle", data2.subtitle), spec, { position: "absolute", left: 78, top: 170, width: 420, fontSize: 14 }),
    box(
      { position: "absolute", left: 135, top: 224, width: 690, height: 214, flexDirection: "column", alignItems: "center", gap: 4 },
      levels.map((item, index) => box({ width: widths[index], height: 38, backgroundColor: fills[index], borderLeftWidth: 2, borderLeftColor: theme8.line, alignItems: "center", justifyContent: "center" }, [
        body8(item, spec, { color: index < 2 ? theme8.paper : theme8.ink, fontSize: 13, lineHeight: 1, textAlign: "center" })
      ]))
    )
  ]);
}
function renderEnd3(spec) {
  const theme8 = colors10(spec);
  const data2 = fallback("end");
  return frame8(spec, "end", [
    label9(text4(spec, "eyebrow", data2.eyebrow), spec, { position: "absolute", left: 120, top: 170 }),
    box({ position: "absolute", left: 120, top: 202, width: 36, height: 1, backgroundColor: theme8.line }),
    heading(text4(spec, "title", data2.title), spec, { position: "absolute", left: 120, top: 232, width: 520, fontSize: 46, lineHeight: 1.08 }),
    body8(text4(spec, "subtitle", data2.subtitle), spec, { position: "absolute", left: 120, top: 384, width: 420, fontSize: 14, lineHeight: 1.5 })
  ], { chrome: false });
}
function renderMonochromeLedgerBriefing(spec) {
  switch (normalizeVariant12(spec)) {
    case "chapter":
      return renderChapter4(spec);
    case "statement":
      return renderStatement4(spec);
    case "split":
      return renderSplit4(spec);
    case "stats":
      return renderStats5(spec);
    case "list":
      return renderList3(spec);
    case "compare":
      return renderCompare3(spec);
    case "quote":
      return renderQuote11(spec);
    case "dense":
      return renderDense2(spec);
    case "chart":
      return renderChart6(spec);
    case "diagram":
      return renderDiagram3(spec);
    case "pie":
      return renderPie3(spec);
    case "vtimeline":
      return renderVerticalTimeline(spec);
    case "cycle":
      return renderCycle3(spec);
    case "pyramid":
      return renderPyramid3(spec);
    case "end":
      return renderEnd3(spec);
    case "cover":
    default:
      return renderCover11(spec);
  }
}

// templates/beautiful/capsule-card-system.mjs
var templateId14 = "capsule-card-system";
var PAGE_VARIANTS13 = [
  "cover",
  "agenda",
  "data_dashboard",
  "data_dashboard-4",
  "quote_or_emphasis",
  "process_or_timeline",
  "data_dashboard-7",
  "slide-8",
  "slide-9",
  "closing"
];
var rendererContract14 = {
  template_id: templateId14,
  renderer_id: `artboard_satori.${templateId14}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "capsule",
  implemented_page_variants: PAGE_VARIANTS13,
  page_family: {
    family_id: "capsule",
    supported_page_variants: PAGE_VARIANTS13,
    variant_usage_policy: {
      singletons: ["cover", "closing"],
      repeatable: PAGE_VARIANTS13.filter((variant) => !["cover", "closing"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/capsule-1.png"
};
var CANVAS8 = { width: 960, height: 540 };
var DEFAULTS12 = {
  cover: {
    eyebrow: "Presentation Template",
    title: "CAPSULE",
    subtitle: "A Framework for Bold Ideas",
    pills: ["Concept", "Strategy", "Vision", "Future", "Design", "Next", "2026"]
  },
  agenda: {
    eyebrow: "01",
    title: "Modular ideas in orbit",
    body: "A playful editorial system for strategy, launch planning, and brand storytelling.",
    orbit: ["Research", "Ideation", "Prototype", "Iterate", "Launch", "Scale"]
  },
  data_dashboard: {
    eyebrow: "Core Principles",
    title: "The Capsule System",
    cards: [
      { mark: "I", title: "Pill Geometry", body: "Every content container uses soft rounded capsule forms." },
      { mark: "II", title: "Candy Palette", body: "Accent colors rotate for balance rather than semantic meaning." },
      { mark: "III", title: "Editorial Contrast", body: "Serif headlines pair with clean sans labels and body copy." }
    ]
  },
  "data_dashboard-4": {
    eyebrow: "Performance Indicators",
    title: "Signals that travel fast",
    bars: [
      { label: "Market Reach", value: "82%", width: 82 },
      { label: "Engagement", value: "67%", width: 67 },
      { label: "Conversion", value: "45%", width: 45 },
      { label: "Retention", value: "91%", width: 91 },
      { label: "Satisfaction", value: "74%", width: 74 }
    ]
  },
  quote_or_emphasis: {
    eyebrow: "Bold",
    quote: "The best ideas are the ones that feel inevitable right now and impossible five minutes before.",
    author: "A Philosophy of Action",
    pills: ["Inspire", "Create", "Elevate", "Now", "Today"]
  },
  process_or_timeline: {
    eyebrow: "Phased Implementation",
    title: "From signal to launch",
    steps: [
      { num: "1", title: "Discovery", body: "Map the terrain before you traverse it." },
      { num: "2", title: "Definition", body: "Sharpen the question to find the answer." },
      { num: "3", title: "Development", body: "Build with intent, iterate with care." },
      { num: "4", title: "Delivery", body: "Ship the work, then make it better." },
      { num: "5", title: "Evolution", body: "Growth is a process, not a destination." }
    ]
  },
  "data_dashboard-7": {
    eyebrow: "Key Metrics at a Glance",
    title: "Proof in soft shapes",
    metrics: [
      { value: "340%", label: "Growth in Active Users" },
      { value: "12.4M", label: "Total Reach Across Channels" },
      { value: "98.2%", label: "System Uptime Record" },
      { value: "4.9", label: "Average User Satisfaction Score" }
    ]
  },
  "slide-8": {
    eyebrow: "System Architecture Overview",
    title: "A flow of rounded decisions",
    nodes: ["Input Layer", "Processing Core", "Decision Engine", "Output Stream"],
    chips: ["Data Ingestion", "Transformation", "Distribution"]
  },
  "slide-9": {
    eyebrow: "Visual Placeholder",
    title: "Where Vision Meets Execution",
    body: "Great ideas deserve rigorous craft, thoughtful iteration, and a commitment to the user experience at every stage.",
    chips: ["Strategy", "Design", "Build", "Measure"]
  },
  closing: {
    eyebrow: "Continue",
    title: "The Journey Continues",
    subtitle: "Questions and conversation welcome",
    pills: ["Explore", "Discover", "Go", "Begin", "Launch", "More"]
  }
};
function colors11(spec) {
  const source = spec.theme?.colors || {};
  return {
    cream: source.background || "#F5F5F0",
    ink: source.text || "#1A1A1A",
    white: source.surface || "#FFFFFF",
    coral: source.accent || "#E85D4E",
    lime: source.primary || "#C4D94E",
    lavender: source.lavender || "#C5B5E0",
    sky: source.blue || "#8BB4F7",
    violet: source.violet || "#A06CE8",
    yellow: source.panel || "#F2D160",
    peach: source.peach || "#F5B895",
    mint: source.mint || "#A8E6CF",
    shadow: "#E2DED3"
  };
}
function role12(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value8(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array10(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray7(spec, key, fallback2 = []) {
  return array10(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function normalizeVariant13(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS13.length) return PAGE_VARIANTS13[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS13) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("closing") || raw.includes("cta")) return "closing";
  if (raw.includes("quote")) return "quote_or_emphasis";
  if (raw.includes("timeline") || raw.includes("process")) return "process_or_timeline";
  if (raw.includes("data") || raw.includes("metric") || raw.includes("chart")) return "data_dashboard-7";
  if (raw.includes("agenda") || raw.includes("overview")) return "agenda";
  return "data_dashboard";
}
function variantPage6(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS13.indexOf(variant) + 1;
}
function fill(theme8, index) {
  return [theme8.coral, theme8.lime, theme8.sky, theme8.lavender, theme8.violet, theme8.yellow, theme8.peach, theme8.mint][index % 8];
}
function frame9(spec, variant, children = []) {
  const theme8 = colors11(spec);
  const page18 = variantPage6(spec, variant);
  return box(
    {
      width: CANVAS8.width,
      height: CANVAS8.height,
      position: "relative",
      backgroundColor: theme8.cream,
      color: theme8.ink,
      overflow: "hidden"
    },
    [
      box({ position: "absolute", left: -140, top: -100, width: 360, height: 260, borderRadius: 180, backgroundColor: theme8.yellow, opacity: 0.18 }),
      box({ position: "absolute", right: -130, bottom: -90, width: 320, height: 240, borderRadius: 160, backgroundColor: theme8.lavender, opacity: 0.18 }),
      ...grain(theme8),
      ...children,
      ...nav3(theme8, spec, page18)
    ]
  );
}
function grain(theme8) {
  return Array.from({ length: 42 }).map(
    (_, index) => box({
      position: "absolute",
      left: 28 + index % 7 * 10,
      top: 32 + Math.floor(index / 7) * 10,
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme8.ink,
      opacity: 0.13
    })
  );
}
function nav3(theme8, spec, page18) {
  return [
    TextBlock("USE ARROW KEYS TO NAVIGATE", {
      position: "absolute",
      left: 16,
      bottom: 17,
      color: theme8.ink,
      opacity: 0.28,
      fontSize: 7,
      letterSpacing: 0.8,
      ...role12("label", spec, { fontSize: 7, lineHeight: 1, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" })
    }),
    box({ position: "absolute", right: 16, bottom: 17, flexDirection: "row", alignItems: "center", gap: 12 }, [
      TextBlock(`${String(page18).padStart(2, "0")} / 10`, { color: theme8.ink, fontSize: 8, ...role12("metric", spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 }) }),
      ...Array.from({ length: 2 }).map((_, index) => box({ width: 9, height: 9, borderRadius: 5, borderWidth: 1.8, borderColor: theme8.ink, backgroundColor: index === 0 ? theme8.ink : "transparent" }))
    ])
  ];
}
function headline4(text10, spec, style = {}) {
  const theme8 = colors11(spec);
  return Title(text10, {
    color: theme8.ink,
    fontSize: 48,
    lineHeight: 0.96,
    letterSpacing: -0.6,
    ...role12("display", spec, { fontSize: 48, lineHeight: 0.96, fontWeight: 800, letterSpacing: -0.6 }),
    ...style
  });
}
function body9(text10, spec, style = {}) {
  const theme8 = colors11(spec);
  return TextBlock(text10, {
    color: theme8.ink,
    opacity: 0.72,
    fontSize: 15,
    lineHeight: 1.46,
    ...role12("body", spec, { fontSize: 15, lineHeight: 1.46, fontWeight: 400 }),
    ...style
  });
}
function pill3(spec, text10, style = {}) {
  const theme8 = colors11(spec);
  return box(
    {
      minWidth: 92,
      minHeight: 34,
      padding: "10px 20px",
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: theme8.ink,
      backgroundColor: style.backgroundColor || theme8.yellow,
      alignItems: "center",
      justifyContent: "center",
      ...style
    },
    [
      TextBlock(String(text10 || "").toUpperCase(), {
        color: theme8.ink,
        fontSize: style.fontSize || 10,
        lineHeight: 1,
        letterSpacing: 1.1,
        textAlign: "center",
        ...role12("label", spec, { fontSize: style.fontSize || 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase" })
      })
    ]
  );
}
function shadowCard(spec, style = {}, children = []) {
  const theme8 = colors11(spec);
  const left = Number(style.left || 0);
  const top = Number(style.top || 0);
  const width = Number(style.width || 100);
  const height = Number(style.height || 100);
  const radius = style.borderRadius ?? 32;
  const shadow = style.shadow ?? 8;
  const cardStyle = {
    position: "absolute",
    left,
    top,
    width,
    height,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: theme8.ink,
    backgroundColor: style.backgroundColor || theme8.white,
    padding: style.padding || "28px",
    flexDirection: style.flexDirection || "column"
  };
  if (style.alignItems) cardStyle.alignItems = style.alignItems;
  if (style.justifyContent) cardStyle.justifyContent = style.justifyContent;
  return [
    box({ position: "absolute", left: left + shadow, top: top + shadow, width, height, borderRadius: radius, backgroundColor: theme8.shadow }),
    box(cardStyle, children)
  ];
}
function floatingPills(spec, labels = []) {
  const positions = [
    { left: 72, top: 62, backgroundColor: colors11(spec).coral, transform: "rotate(-12deg)" },
    { right: 92, top: 94, backgroundColor: colors11(spec).lavender, transform: "rotate(8deg)" },
    { left: 150, bottom: 128, backgroundColor: colors11(spec).sky, transform: "rotate(7deg)" },
    { right: 188, bottom: 78, backgroundColor: colors11(spec).lime, transform: "rotate(-9deg)" },
    { left: 428, top: 72, width: 54, height: 54, borderRadius: 27, backgroundColor: colors11(spec).peach, transform: "rotate(8deg)" },
    { left: 54, bottom: 86, width: 52, height: 52, borderRadius: 26, backgroundColor: colors11(spec).violet, transform: "rotate(0deg)" },
    { right: 76, bottom: 152, backgroundColor: colors11(spec).white, transform: "rotate(14deg)" }
  ];
  return labels.slice(0, positions.length).map((label28, index) => pill3(spec, label28, { position: "absolute", ...positions[index] }));
}
function renderCover12(spec) {
  const content20 = DEFAULTS12.cover;
  return frame9(spec, "cover", [
    ...floatingPills(spec, array10(spec, "pills", content20.pills)),
    pill3(spec, value8(spec, "eyebrow", content20.eyebrow), { position: "absolute", left: 402, top: 208, width: 164, backgroundColor: colors11(spec).yellow }),
    headline4(value8(spec, "title", content20.title), spec, { position: "absolute", left: 218, top: 258, width: 524, fontSize: 84, lineHeight: 0.9, textAlign: "center" }),
    TextBlock(value8(spec, "subtitle", content20.subtitle).toUpperCase(), {
      position: "absolute",
      left: 284,
      top: 342,
      width: 392,
      color: colors11(spec).ink,
      opacity: 0.56,
      textAlign: "center",
      fontSize: 15,
      letterSpacing: 2.8,
      ...role12("label", spec, { fontSize: 15, lineHeight: 1.2, fontWeight: 500, letterSpacing: 2.8, textTransform: "uppercase" })
    })
  ]);
}
function renderAgenda5(spec) {
  const theme8 = colors11(spec);
  const orbit = array10(spec, "orbit", DEFAULTS12.agenda.orbit);
  return frame9(spec, "agenda", [
    box({ position: "absolute", left: 86, top: 88, width: 404, height: 368, borderRadius: 202, backgroundColor: theme8.lime, borderWidth: 2, borderColor: theme8.ink, alignItems: "center", justifyContent: "center" }, [
      TextBlock(value8(spec, "eyebrow", DEFAULTS12.agenda.eyebrow), { color: theme8.ink, fontSize: 52, lineHeight: 1, ...role12("metric", spec, { fontSize: 52, lineHeight: 1, fontWeight: 800 }) })
    ]),
    ...orbit.map((label28, index) => pill3(spec, label28, { position: "absolute", left: 92 + index % 3 * 130, top: 64 + Math.floor(index / 3) * 326, backgroundColor: fill(theme8, index), transform: `rotate(${[-12, 8, -4, 6, -9, 12][index]}deg)` })),
    headline4(value8(spec, "title", DEFAULTS12.agenda.title), spec, { position: "absolute", left: 566, top: 124, width: 292, fontSize: 46, lineHeight: 1.02 }),
    body9(value8(spec, "body", DEFAULTS12.agenda.body), spec, { position: "absolute", left: 570, top: 286, width: 274, fontSize: 16, lineHeight: 1.46 })
  ]);
}
function renderCards3(spec) {
  const theme8 = colors11(spec);
  const cards = objectArray7(spec, "cards", DEFAULTS12.data_dashboard.cards).slice(0, 3);
  return frame9(spec, "data_dashboard", [
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12.data_dashboard.eyebrow), { position: "absolute", left: 376, top: 62, width: 210, backgroundColor: theme8.lavender }),
    headline4(value8(spec, "title", DEFAULTS12.data_dashboard.title), spec, { position: "absolute", left: 204, top: 116, width: 552, fontSize: 54, textAlign: "center" }),
    ...cards.flatMap((card2, index) => shadowCard(spec, { left: 108 + index * 258, top: 232, width: 226, height: 194, backgroundColor: theme8.white, padding: "26px 24px" }, [
      box({ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme8.ink, backgroundColor: fill(theme8, index), alignItems: "center", justifyContent: "center", marginBottom: 18 }, [
        TextBlock(card2.mark || String(index + 1), { color: theme8.ink, fontSize: 26, lineHeight: 1, textAlign: "center", ...role12("metric", spec, { fontSize: 26, lineHeight: 1, fontWeight: 800 }) })
      ]),
      headline4(card2.title || "", spec, { width: 174, fontSize: 24, lineHeight: 1.05, marginBottom: 10 }),
      body9(card2.body || "", spec, { width: 176, fontSize: 12.5, lineHeight: 1.35 })
    ]))
  ]);
}
function renderBars2(spec) {
  const theme8 = colors11(spec);
  const bars = objectArray7(spec, "bars", DEFAULTS12["data_dashboard-4"].bars).slice(0, 5);
  return frame9(spec, "data_dashboard-4", [
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12["data_dashboard-4"].eyebrow), { position: "absolute", left: 348, top: 58, width: 264, backgroundColor: theme8.sky }),
    headline4(value8(spec, "title", DEFAULTS12["data_dashboard-4"].title), spec, { position: "absolute", left: 190, top: 112, width: 580, fontSize: 50, textAlign: "center" }),
    ...shadowCard(spec, { left: 130, top: 218, width: 700, height: 242, padding: "24px 28px" }, [
      box({ width: 640, flexDirection: "column", gap: 14 }, bars.map(
        (bar, index) => box({ width: 640, height: 30, flexDirection: "row", alignItems: "center", gap: 18 }, [
          TextBlock(bar.label || "", { width: 124, color: theme8.ink, fontSize: 11, lineHeight: 1, ...role12("label", spec, { fontSize: 11, lineHeight: 1, fontWeight: 700 }) }),
          box({ width: 430, height: 28, borderRadius: 999, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.cream, overflow: "hidden" }, [
            box({ width: Math.max(40, Number(bar.width || 50) * 4.2), height: 28, borderRadius: 999, backgroundColor: fill(theme8, index), alignItems: "flex-end", justifyContent: "center", paddingRight: 12 }, [
              TextBlock(bar.value || "", { color: theme8.ink, fontSize: 10, lineHeight: 1, ...role12("metric", spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 }) })
            ])
          ])
        ])
      ))
    ])
  ]);
}
function renderQuote12(spec) {
  const theme8 = colors11(spec);
  return frame9(spec, "quote_or_emphasis", [
    ...floatingPills(spec, array10(spec, "pills", DEFAULTS12.quote_or_emphasis.pills)),
    TextBlock('"', { position: "absolute", left: 126, top: 104, color: theme8.ink, fontSize: 82, lineHeight: 1, ...role12("display", spec, { fontSize: 82, lineHeight: 1, fontWeight: 800 }) }),
    headline4(value8(spec, "quote", DEFAULTS12.quote_or_emphasis.quote), spec, { position: "absolute", left: 178, top: 160, width: 604, fontSize: 38, lineHeight: 1.22, textAlign: "center" }),
    pill3(spec, value8(spec, "author", DEFAULTS12.quote_or_emphasis.author), { position: "absolute", right: 112, bottom: 86, width: 250, backgroundColor: theme8.yellow })
  ]);
}
function renderTimeline7(spec) {
  const theme8 = colors11(spec);
  const steps = objectArray7(spec, "steps", DEFAULTS12.process_or_timeline.steps).slice(0, 5);
  return frame9(spec, "process_or_timeline", [
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12.process_or_timeline.eyebrow), { position: "absolute", left: 314, top: 58, width: 334, backgroundColor: theme8.lavender }),
    headline4(value8(spec, "title", DEFAULTS12.process_or_timeline.title), spec, { position: "absolute", left: 236, top: 112, width: 488, fontSize: 50, textAlign: "center" }),
    box({ position: "absolute", left: 102, top: 282, width: 756, height: 4, backgroundColor: theme8.ink, borderRadius: 999 }),
    box({ position: "absolute", left: 92, top: 230, flexDirection: "row", gap: 17 }, steps.map(
      (step, index) => box({ width: 140, minHeight: 154, alignItems: "center", flexDirection: "column" }, [
        box({ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme8.ink, backgroundColor: fill(theme8, index), alignItems: "center", justifyContent: "center", marginBottom: 14 }, [
          TextBlock(step.num || String(index + 1), { color: theme8.ink, fontSize: 26, lineHeight: 1, textAlign: "center", ...role12("metric", spec, { fontSize: 26, lineHeight: 1, fontWeight: 800 }) })
        ]),
        TextBlock(step.title || "", { width: 122, color: theme8.ink, fontSize: 12, lineHeight: 1, textAlign: "center", letterSpacing: 1.1, marginBottom: 8, ...role12("label", spec, { fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase" }) }),
        body9(step.body || "", spec, { width: 124, fontSize: 10.5, lineHeight: 1.3, textAlign: "center" })
      ])
    ))
  ]);
}
function renderStats6(spec) {
  const theme8 = colors11(spec);
  const metrics = objectArray7(spec, "metrics", DEFAULTS12["data_dashboard-7"].metrics).slice(0, 4);
  return frame9(spec, "data_dashboard-7", [
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12["data_dashboard-7"].eyebrow), { position: "absolute", left: 318, top: 58, width: 324, backgroundColor: theme8.sky }),
    headline4(value8(spec, "title", DEFAULTS12["data_dashboard-7"].title), spec, { position: "absolute", left: 226, top: 116, width: 508, fontSize: 50, textAlign: "center" }),
    box({ position: "absolute", left: 106, top: 218, width: 748, flexDirection: "row", flexWrap: "wrap", gap: 24 }, metrics.map(
      (metric19, index) => box({ width: 362, height: 104, borderRadius: 32, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.white, padding: "22px 24px", flexDirection: "column" }, [
        TextBlock(metric19.value || "", { color: fill(theme8, index), fontSize: 40, lineHeight: 1, marginBottom: 12, ...role12("metric", spec, { fontSize: 40, lineHeight: 1, fontWeight: 800, letterSpacing: -0.6 }) }),
        TextBlock((metric19.label || "").toUpperCase(), { color: theme8.ink, fontSize: 10, lineHeight: 1, letterSpacing: 1.1, ...role12("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase" }) })
      ])
    ))
  ]);
}
function renderDiagram4(spec) {
  const theme8 = colors11(spec);
  const nodes = array10(spec, "nodes", DEFAULTS12["slide-8"].nodes).slice(0, 4);
  const chips = array10(spec, "chips", DEFAULTS12["slide-8"].chips).slice(0, 3);
  return frame9(spec, "slide-8", [
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12["slide-8"].eyebrow), { position: "absolute", left: 298, top: 58, width: 364, backgroundColor: theme8.lavender }),
    headline4(value8(spec, "title", DEFAULTS12["slide-8"].title), spec, { position: "absolute", left: 210, top: 112, width: 540, fontSize: 48, textAlign: "center" }),
    box({ position: "absolute", left: 96, top: 252, flexDirection: "row", alignItems: "center", gap: 10 }, nodes.map((nodeLabel, index) => [
      box({ width: 162, minHeight: 64, borderRadius: 999, borderWidth: 2, borderColor: theme8.ink, backgroundColor: fill(theme8, index), alignItems: "center", justifyContent: "center", padding: "14px 22px" }, [
        TextBlock(nodeLabel, { color: theme8.ink, fontSize: 15, lineHeight: 1.15, textAlign: "center", ...role12("body", spec, { fontSize: 15, lineHeight: 1.15, fontWeight: 600 }) })
      ]),
      index < nodes.length - 1 ? box({ width: 34, height: 4, borderRadius: 999, backgroundColor: theme8.ink }) : null
    ]).flat().filter(Boolean)),
    box({ position: "absolute", left: 214, top: 380, flexDirection: "row", gap: 18 }, chips.map((chip, index) => pill3(spec, chip, { backgroundColor: fill(theme8, index + 4), minWidth: 150 })))
  ]);
}
function renderVisual(spec) {
  const theme8 = colors11(spec);
  const chips = array10(spec, "chips", DEFAULTS12["slide-9"].chips);
  return frame9(spec, "slide-9", [
    ...shadowCard(spec, { left: 78, top: 112, width: 364, height: 300, borderRadius: 32, padding: "26px", backgroundColor: theme8.white }, [
      box({ width: 308, height: 212, borderRadius: 24, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.lavender, alignItems: "center", justifyContent: "center" }, [
        TextBlock(value8(spec, "eyebrow", DEFAULTS12["slide-9"].eyebrow), { color: theme8.ink, fontSize: 14, letterSpacing: 1.2, ...role12("label", spec, { fontSize: 14, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }) })
      ])
    ]),
    headline4(value8(spec, "title", DEFAULTS12["slide-9"].title), spec, { position: "absolute", left: 502, top: 122, width: 330, fontSize: 42, lineHeight: 1.03 }),
    body9(value8(spec, "body", DEFAULTS12["slide-9"].body), spec, { position: "absolute", left: 506, top: 268, width: 328, fontSize: 15, lineHeight: 1.48 }),
    box({ position: "absolute", left: 506, top: 376, width: 330, flexDirection: "row", flexWrap: "wrap", gap: 12 }, chips.map((chip, index) => pill3(spec, chip, { minWidth: 88, backgroundColor: fill(theme8, index + 1) })))
  ]);
}
function renderClosing7(spec) {
  const theme8 = colors11(spec);
  return frame9(spec, "closing", [
    ...floatingPills(spec, array10(spec, "pills", DEFAULTS12.closing.pills)),
    pill3(spec, value8(spec, "eyebrow", DEFAULTS12.closing.eyebrow), { position: "absolute", left: 386, top: 134, width: 188, backgroundColor: theme8.yellow }),
    headline4(value8(spec, "title", DEFAULTS12.closing.title), spec, { position: "absolute", left: 192, top: 198, width: 576, fontSize: 66, lineHeight: 0.96, textAlign: "center" }),
    body9(value8(spec, "subtitle", DEFAULTS12.closing.subtitle), spec, { position: "absolute", left: 310, top: 330, width: 340, textAlign: "center", fontSize: 17 })
  ]);
}
var RENDERERS10 = {
  cover: renderCover12,
  agenda: renderAgenda5,
  data_dashboard: renderCards3,
  "data_dashboard-4": renderBars2,
  quote_or_emphasis: renderQuote12,
  process_or_timeline: renderTimeline7,
  "data_dashboard-7": renderStats6,
  "slide-8": renderDiagram4,
  "slide-9": renderVisual,
  closing: renderClosing7
};
function renderCapsuleCardSystem(spec) {
  const variant = normalizeVariant13(spec);
  return (RENDERERS10[variant] || renderCover12)(spec);
}

// templates/beautiful/creative-mode-grid.mjs
var templateId15 = "creative-mode-grid";
var PAGE_VARIANTS14 = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
var rendererContract15 = {
  template_id: templateId15,
  renderer_id: `artboard_satori.${templateId15}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "creative-mode",
  implemented_page_variants: PAGE_VARIANTS14,
  page_family: {
    family_id: "creative-mode",
    supported_page_variants: PAGE_VARIANTS14,
    variant_usage_policy: {
      singletons: ["s1", "s8"],
      repeatable: ["s2", "s3", "s4", "s5", "s6", "s7"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/creative-mode-1.png"
};
var CANVAS9 = { width: 960, height: 540 };
var DEFAULTS13 = {
  s1: {
    eyebrow: "VOL. 01 / EDITION 2026",
    title: "Creative Mode",
    subtitle: "A presentation template - eight pages, eight layouts. Replace freely.",
    footer: "A PRESENTATION TEMPLATE"
  },
  s2: {
    eyebrow: "A NOTE BEFORE WE BEGIN",
    title: "Flip the switch.",
    subtitle: "Use this page to set up the chapter, introduce the speaker, and frame the question the deck is going to answer.",
    marker: "PRESS PLAY",
    points: ["Context for the chapter", "A quieter definition", "A forward pointer"]
  },
  s3: {
    eyebrow: "BY THE NUMBERS",
    title: "Four figures, one story.",
    metrics: [
      { value: "42%", label: "Lift in engagement", body: "Placeholder caption describing the metric and why it matters." },
      { value: "2.7x", label: "Throughput multiplier", body: "A short generic explainer line with punchy cadence." },
      { value: "118", label: "Active placeholders", body: "Filler descriptor about the count. Two lines maximum." },
      { value: "$9.4M", label: "Total sample value", body: "Closing stat caption with oversized numbers." }
    ]
  },
  s4: {
    eyebrow: "SYSTEM DIAGRAM",
    title: "A stack of moving parts.",
    subtitle: "The four blocks represent layers of a hypothetical system. Drop in your own labels and short notes per layer.",
    layers: ["Interface", "Orchestration", "Services", "Substrate"]
  },
  s5: {
    eyebrow: "QUARTERLY READOUT",
    title: "Placeholder metric, by quarter.",
    metrics: [34, 48, 61, 55, 72, 84, 91],
    labels: ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25"]
  },
  s6: {
    eyebrow: "HOW IT WORKS",
    title: "A four-step process.",
    items: [
      { title: "Discover", body: "Generic placeholder description for the first step." },
      { title: "Define", body: "Filler text outlining the second step of the process." },
      { title: "Develop", body: "Third step placeholder with rhythmic color cards." },
      { title: "Deliver", body: "Closing step copy anchored by the primary color." }
    ]
  },
  s7: {
    eyebrow: "SIDE BY SIDE",
    title: "Three options, compared.",
    headers: ["Attribute", "Option A", "Option B", "Option C"],
    rows: [
      ["Speed", "Fast", "Faster", "Fastest"],
      ["Footprint", "Light", "Medium", "Heavy"],
      ["Effort", "Low", "Mid", "High"],
      ["Outcome", "Sample", "Sample", "Sample"]
    ]
  },
  s8: {
    eyebrow: "END OF DECK",
    title: "Thank you.",
    subtitle: "Use this space for a sign-off, a contact handle, or a one-sentence summary.",
    stamp: "08/08"
  }
};
function colors12(spec) {
  const source = spec.theme?.colors || {};
  return {
    cream: source.background || source.cream || "#EFE9D9",
    cream2: source.cream_2 || source.surface || "#E4DCC4",
    ink: source.text || "#0F0F0F",
    ink2: source.muted || "#2A2A2A",
    green: source.primary || "#1F8A4C",
    greenDark: source.green_dark || "#136636",
    pink: source.pink || source.panel || "#F06CA8",
    pinkDark: source.pink_dark || "#D14E8B",
    orange: source.accent || "#E85A1F",
    yellow: source.yellow || "#F5C518"
  };
}
var ROLE_FONT_RESOLVERS2 = {
  display: (spec, style) => fontRole("display", spec, style),
  body: (spec, style) => fontRole("body", spec, style),
  label: (spec, style) => fontRole("label", spec, style),
  metric: (spec, style) => fontRole("metric", spec, style)
};
function role13(roleName, spec, style = {}) {
  const resolver = ROLE_FONT_RESOLVERS2[roleName] || ((inputSpec, inputStyle) => fontRole(roleName, inputSpec, inputStyle));
  return resolver(spec, style);
}
function text5(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function list2(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const value15 = spec.content?.[key];
    if (Array.isArray(value15) && value15.length) return value15;
  }
  return fallback2;
}
function objectList2(spec, keys, fallback2 = []) {
  return list2(spec, keys, fallback2).filter((item) => item && typeof item === "object");
}
function upper5(value15) {
  return String(value15 || "").toUpperCase();
}
function titleLines2(value15, fallback2 = "CREATIVE MODE") {
  const parts = String(value15 || fallback2).trim().split(/\s+/).filter(Boolean);
  const first = parts.slice(0, Math.max(1, Math.ceil(parts.length / 2))).join(" ");
  const second = parts.slice(Math.max(1, Math.ceil(parts.length / 2))).join(" ");
  return { first: upper5(first || "CREATIVE"), second: upper5(second || "MODE") };
}
function normalizeVariant14(spec) {
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  const sourceClass = `${spec.page_family_source?.source_class || ""}`.toLowerCase();
  const value15 = `${raw} ${sourceClass}`;
  for (const variant of PAGE_VARIANTS14) {
    if (value15.includes(variant)) return variant;
  }
  if (value15.includes("cover") || value15.includes("hero")) return "s1";
  if (value15.includes("agenda") || value15.includes("intro") || value15.includes("chapter")) return "s2";
  if (value15.includes("process") || value15.includes("flow")) return "s6";
  if (value15.includes("compare") || value15.includes("comparison") || value15.includes("table")) return "s7";
  if (value15.includes("closing") || value15.includes("close") || value15.includes("end")) return "s8";
  if (value15.includes("chart") || value15.includes("bar")) return "s5";
  if (value15.includes("diagram")) return "s4";
  if (value15.includes("data") || value15.includes("metric") || value15.includes("stat")) return "s3";
  return "s1";
}
function chrome3(spec, variant, opts = {}) {
  const theme8 = colors12(spec);
  const light = opts.light || false;
  const color = light ? theme8.cream : theme8.ink;
  const page18 = spec.page_family_source?.source_slide_index || PAGE_VARIANTS14.indexOf(variant) + 1;
  const eyebrow = text5(spec, "eyebrow", DEFAULTS13[variant]?.eyebrow || "CREATIVE MODE");
  return [
    TextBlock(upper5(eyebrow), {
      position: "absolute",
      left: 32,
      top: 24,
      color,
      fontSize: 12,
      letterSpacing: 4,
      ...role13("label", spec, { fontSize: 12, lineHeight: 1, fontWeight: 700 })
    }),
    TextBlock(variant === "s1" ? "A PRESENTATION TEMPLATE" : `PAGE ${String(page18).padStart(2, "0")}`, {
      position: "absolute",
      left: 32,
      bottom: 20,
      color,
      fontSize: 11,
      letterSpacing: 3,
      ...role13("label", spec, { fontSize: 11, lineHeight: 1, fontWeight: 700 })
    }),
    TextBlock(`${String(page18).padStart(2, "0")} * 08`, {
      position: "absolute",
      right: 32,
      bottom: 20,
      color,
      fontSize: 12,
      letterSpacing: 4,
      textAlign: "right",
      ...role13("metric", spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 })
    })
  ];
}
function frame10(spec, variant, children = [], opts = {}) {
  const theme8 = colors12(spec);
  return box(
    {
      width: CANVAS9.width,
      height: CANVAS9.height,
      position: "relative",
      backgroundColor: opts.background || theme8.cream,
      color: opts.color || theme8.ink,
      overflow: "hidden"
    },
    [...children, ...chrome3(spec, variant, { light: opts.light })]
  );
}
function display4(value15, spec, style = {}) {
  return Title(upper5(value15), {
    color: colors12(spec).ink,
    ...role13("display", spec, { fontWeight: 900 }),
    textTransform: "uppercase",
    ...style
  });
}
function label10(value15, spec, style = {}) {
  return TextBlock(upper5(value15), {
    color: colors12(spec).ink,
    fontSize: 12,
    letterSpacing: 3,
    ...role13("label", spec, { fontSize: 12, lineHeight: 1, fontWeight: 700 }),
    ...style
  });
}
function body10(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: colors12(spec).ink2,
    fontSize: 14,
    lineHeight: 1.4,
    ...role13("body", spec, { fontSize: 14, lineHeight: 1.4, fontWeight: 400 }),
    ...style
  });
}
function renderSwitchPoster(spec) {
  const theme8 = colors12(spec);
  const title2 = titleLines2(text5(spec, "title", DEFAULTS13.s1.title));
  return frame10(spec, "s1", [
    box({ position: "absolute", left: 48, top: 78, width: 30, height: 2, backgroundColor: theme8.ink }),
    label10(text5(spec, "eyebrow", DEFAULTS13.s1.eyebrow), spec, { position: "absolute", left: 88, top: 74, color: theme8.ink, fontSize: 12 }),
    display4(title2.first, spec, { position: "absolute", left: 48, top: 194, width: 460, fontSize: 78, lineHeight: 0.9 }),
    display4(title2.second, spec, { position: "absolute", left: 48, top: 268, width: 390, color: theme8.orange, fontSize: 78, lineHeight: 0.9 }),
    body10(text5(spec, "subtitle", DEFAULTS13.s1.subtitle), spec, {
      position: "absolute",
      left: 48,
      top: 430,
      width: 420,
      fontSize: 14,
      lineHeight: 1.35
    }),
    box({ position: "absolute", right: 48, top: 70, width: 380, height: 400, backgroundColor: theme8.green, borderWidth: 2, borderColor: theme8.ink }),
    box({ position: "absolute", right: 82, top: 184, width: 198, height: 198, backgroundColor: theme8.orange, borderWidth: 2, borderColor: theme8.ink }),
    box({ position: "absolute", right: 96, top: 174, width: 194, height: 194, backgroundColor: theme8.pink, borderWidth: 2, borderColor: theme8.ink }),
    box({ position: "absolute", right: 132, top: 216, width: 124, height: 86, backgroundColor: "#FBD0E3", borderWidth: 2, borderColor: theme8.ink, transform: "skewY(-8deg)" }),
    box({ position: "absolute", right: 134, top: 294, width: 120, height: 17, backgroundColor: theme8.pinkDark }),
    label10("ON", spec, { position: "absolute", right: 126, top: 202, width: 70, color: theme8.ink, fontSize: 16, letterSpacing: 0 }),
    label10("OFF", spec, { position: "absolute", right: 152, top: 336, width: 90, color: theme8.ink, fontSize: 16, letterSpacing: 0 })
  ]);
}
function renderIntro(spec) {
  const theme8 = colors12(spec);
  const points = list2(spec, ["points", "bullets", "principles"], DEFAULTS13.s2.points).slice(0, 3);
  return frame10(spec, "s2", [
    label10(text5(spec, "eyebrow", DEFAULTS13.s2.eyebrow), spec, { position: "absolute", left: 48, top: 96, backgroundColor: theme8.ink, color: theme8.cream, padding: "6px 9px", fontSize: 12 }),
    display4(text5(spec, "title", DEFAULTS13.s2.title), spec, { position: "absolute", left: 48, top: 150, width: 420, fontSize: 68, lineHeight: 0.92 }),
    box({ position: "absolute", left: 48, bottom: 80, width: 280, height: 64, backgroundColor: theme8.pink, borderWidth: 2, borderColor: theme8.ink, alignItems: "center", justifyContent: "center" }, [
      label10(text5(spec, "marker", DEFAULTS13.s2.marker), spec, { fontSize: 20, letterSpacing: 1, color: theme8.ink })
    ]),
    box({ position: "absolute", left: 60, bottom: 66, width: 280, height: 64, backgroundColor: theme8.orange, borderWidth: 2, borderColor: theme8.ink }),
    body10(text5(spec, "subtitle", DEFAULTS13.s2.subtitle), spec, { position: "absolute", left: 510, top: 150, width: 240, fontSize: 15, lineHeight: 1.42 }),
    box({ position: "absolute", right: 48, top: 150, width: 170, height: 170, backgroundColor: theme8.green, borderWidth: 2, borderColor: theme8.ink }),
    box({ position: "absolute", right: 84, top: 186, width: 98, height: 98, borderRadius: 49, backgroundColor: theme8.yellow, borderWidth: 2, borderColor: theme8.ink }),
    box(
      { position: "absolute", left: 510, top: 282, width: 300, flexDirection: "column", gap: 12 },
      points.map((item, index) => box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 13, height: 13, backgroundColor: [theme8.green, theme8.pink, theme8.orange][index % 3], borderWidth: 2, borderColor: theme8.ink, marginRight: 12 }),
        body10(String(item), spec, { width: 240, fontSize: 13, lineHeight: 1.25, color: theme8.ink })
      ]))
    )
  ]);
}
function metricCards(spec) {
  const theme8 = colors12(spec);
  const metrics = objectList2(spec, ["metrics", "items"], DEFAULTS13.s3.metrics).slice(0, 4);
  const fills = [theme8.green, theme8.pink, theme8.cream, theme8.orange];
  const light = [true, false, false, true];
  return metrics.map(
    (item, index) => box({ width: 414, height: 136, backgroundColor: fills[index], borderWidth: 2, borderColor: theme8.ink, padding: 16, flexDirection: "column", justifyContent: "space-between" }, [
      label10(`/${index + 1}`, spec, { alignSelf: "flex-end", color: light[index] ? theme8.cream : theme8.ink, fontSize: 11, letterSpacing: 2 }),
      TextBlock(String(item.value || item), { color: light[index] ? theme8.cream : theme8.ink, ...role13("metric", spec, { fontSize: 46, lineHeight: 0.9, fontWeight: 900 }) }),
      label10(String(item.label || "Metric"), spec, { color: light[index] ? theme8.cream : theme8.ink, fontSize: 11, letterSpacing: 2 }),
      body10(String(item.body || ""), spec, { color: light[index] ? theme8.cream : theme8.ink2, fontSize: 11, lineHeight: 1.22, opacity: 0.82 })
    ])
  );
}
function renderStats7(spec) {
  const theme8 = colors12(spec);
  return frame10(spec, "s3", [
    display4(text5(spec, "title", DEFAULTS13.s3.title), spec, { position: "absolute", left: 48, top: 72, width: 820, fontSize: 38, lineHeight: 0.95 }),
    box({ position: "absolute", left: 48, top: 190, width: 864, flexDirection: "row", flexWrap: "wrap", gap: 14 }, metricCards(spec)),
    box({ position: "absolute", left: 48, top: 154, width: 864, height: 2, backgroundColor: theme8.ink })
  ]);
}
function renderDiagram5(spec) {
  const theme8 = colors12(spec);
  const layers = list2(spec, ["layers", "items", "bullets"], DEFAULTS13.s4.layers).slice(0, 4);
  const fills = [theme8.pink, theme8.yellow, theme8.orange, theme8.cream2];
  return frame10(spec, "s4", [
    display4(text5(spec, "title", DEFAULTS13.s4.title), spec, { position: "absolute", left: 48, top: 70, width: 410, fontSize: 50, lineHeight: 0.92 }),
    body10(text5(spec, "subtitle", DEFAULTS13.s4.subtitle), spec, { position: "absolute", left: 48, top: 248, width: 360, fontSize: 14, lineHeight: 1.42 }),
    box(
      { position: "absolute", left: 48, bottom: 82, width: 360, flexDirection: "column", gap: 9 },
      layers.map((item, index) => box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 16, height: 16, backgroundColor: fills[index], borderWidth: 2, borderColor: theme8.ink, marginRight: 10 }),
        label10(String(item), spec, { color: theme8.ink, fontSize: 11, letterSpacing: 2 })
      ]))
    ),
    box({ position: "absolute", right: 40, top: 66, width: 460, height: 420, backgroundColor: theme8.green, borderWidth: 2, borderColor: theme8.ink, alignItems: "center", justifyContent: "center" }, [
      box({ position: "relative", width: 280, height: 280 }, [
        ...fills.map(
          (fill2, index) => box({
            position: "absolute",
            left: [64, 30, 80, 40][index],
            top: [28, 96, 164, 224][index],
            width: [150, 190, 150, 170][index],
            height: 58,
            backgroundColor: fill2,
            borderWidth: 2,
            borderColor: theme8.ink,
            boxShadow: "9px 9px 0 #0F0F0F"
          }, [
            label10(`Layer / 0${index + 1}`, spec, { position: "absolute", left: 8, top: 8, fontSize: 11, letterSpacing: 1.2 })
          ])
        )
      ])
    ])
  ]);
}
function renderBars3(spec) {
  const theme8 = colors12(spec);
  const values = list2(spec, ["metrics", "values"], DEFAULTS13.s5.metrics).slice(0, 7).map((value15) => Number(value15.value || value15) || 35);
  const labels = list2(spec, ["labels"], DEFAULTS13.s5.labels).slice(0, values.length);
  const max = Math.max(100, ...values);
  const fills = [theme8.green, theme8.pink, theme8.orange];
  return frame10(spec, "s5", [
    display4(text5(spec, "title", DEFAULTS13.s5.title), spec, { position: "absolute", left: 48, top: 70, width: 650, fontSize: 42, lineHeight: 0.94 }),
    box(
      { position: "absolute", right: 48, top: 72, width: 170, flexDirection: "column", gap: 8 },
      ["Series A", "Series B", "Series C"].map((item, index) => box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 12, height: 12, backgroundColor: fills[index], borderWidth: 2, borderColor: theme8.ink, marginRight: 8 }),
        label10(item, spec, { fontSize: 10, letterSpacing: 2 })
      ]))
    ),
    box(
      { position: "absolute", left: 72, top: 192, width: 36, height: 260, borderRightWidth: 2, borderRightColor: theme8.ink, flexDirection: "column-reverse", justifyContent: "space-between" },
      [0, 25, 50, 75, 100].map((tick) => label10(String(tick), spec, { fontSize: 10, letterSpacing: 0, textAlign: "right" }))
    ),
    box(
      { position: "absolute", left: 108, top: 192, width: 804, height: 260, borderBottomWidth: 2, borderBottomColor: theme8.ink, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingLeft: 18, paddingRight: 18 },
      values.map(
        (value15, index) => box({ width: 60, height: Math.max(36, value15 / max * 230), backgroundColor: fills[index % fills.length], borderWidth: 2, borderColor: theme8.ink, position: "relative" }, [
          TextBlock(String(value15), { position: "absolute", left: 0, right: 0, top: -28, textAlign: "center", color: theme8.ink, ...role13("metric", spec, { fontSize: 15, lineHeight: 1, fontWeight: 900 }) }),
          label10(labels[index] || `Q${index + 1}`, spec, { position: "absolute", left: -12, right: -12, bottom: -34, fontSize: 9, letterSpacing: 1, textAlign: "center" })
        ])
      )
    ),
    label10("FIG. 01 - VALUES ARE PLACEHOLDER", spec, { position: "absolute", left: 108, bottom: 62, color: theme8.ink2, fontSize: 10, letterSpacing: 2 })
  ]);
}
function renderProcess2(spec) {
  const theme8 = colors12(spec);
  const items = objectList2(spec, ["items", "steps", "timeline"], DEFAULTS13.s6.items).slice(0, 4);
  const fills = [theme8.cream, theme8.pink, theme8.yellow, theme8.green];
  return frame10(spec, "s6", [
    display4(text5(spec, "title", DEFAULTS13.s6.title), spec, { position: "absolute", left: 48, top: 70, width: 820, fontSize: 48, lineHeight: 0.95 }),
    box({ position: "absolute", left: 48, right: 48, top: 154, height: 2, borderTopWidth: 2, borderTopColor: theme8.ink, borderStyle: "dashed" }),
    box(
      { position: "absolute", left: 48, top: 190, width: 864, flexDirection: "row", gap: 14 },
      items.map(
        (item, index) => box({ width: 205, height: 218, backgroundColor: fills[index], color: index === 3 ? theme8.cream : theme8.ink, borderWidth: 2, borderColor: theme8.ink, padding: 14, flexDirection: "column", position: "relative" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { color: index === 3 ? theme8.cream : theme8.ink, ...role13("metric", spec, { fontSize: 66, lineHeight: 0.85, fontWeight: 900 }) }),
          label10(String(item.title || item.label || `Step ${index + 1}`), spec, { color: index === 3 ? theme8.cream : theme8.ink, fontSize: 16, letterSpacing: 0.5, marginTop: 10 }),
          body10(String(item.body || item.description || ""), spec, { color: index === 3 ? theme8.cream : theme8.ink2, fontSize: 11, lineHeight: 1.35, marginTop: 8 }),
          index < items.length - 1 ? box({ position: "absolute", right: -13, top: 101, width: 0, height: 0, borderTopWidth: 9, borderTopColor: "transparent", borderBottomWidth: 9, borderBottomColor: "transparent", borderLeftWidth: 12, borderLeftColor: theme8.ink }) : null
        ].filter(Boolean))
      )
    )
  ]);
}
function renderComparison(spec) {
  const theme8 = colors12(spec);
  const headers = list2(spec, ["headers"], DEFAULTS13.s7.headers).slice(0, 4);
  const rows = list2(spec, ["rows"], DEFAULTS13.s7.rows).slice(0, 4);
  const colFills = [theme8.cream, theme8.pink, theme8.green, theme8.orange];
  return frame10(spec, "s7", [
    display4(text5(spec, "title", DEFAULTS13.s7.title), spec, { position: "absolute", left: 48, top: 72, width: 620, fontSize: 42, lineHeight: 0.94 }),
    box({ position: "absolute", right: 72, top: 120, backgroundColor: theme8.yellow, borderWidth: 2, borderColor: theme8.ink, padding: "8px 12px", transform: "rotate(-4deg)" }, [
      label10("PICK ONE", spec, { fontSize: 13, letterSpacing: 0.5 })
    ]),
    box(
      { position: "absolute", left: 48, right: 48, top: 190, bottom: 80, borderWidth: 2, borderColor: theme8.ink, flexDirection: "column", backgroundColor: theme8.cream2 },
      [
        box(
          { height: 54, flexDirection: "row", backgroundColor: theme8.ink },
          headers.map((item, index) => box({ width: index === 0 ? 302 : 186, borderRightWidth: index === headers.length - 1 ? 0 : 2, borderRightColor: theme8.cream, alignItems: "center", paddingLeft: 13 }, [
            label10(String(item), spec, { color: theme8.cream, fontSize: 13, letterSpacing: 0.5 })
          ]))
        ),
        ...rows.map((row) => box(
          { height: 48, flexDirection: "row", borderTopWidth: 2, borderTopColor: theme8.ink },
          headers.map((_, index) => box({ width: index === 0 ? 302 : 186, backgroundColor: colFills[index], borderRightWidth: index === headers.length - 1 ? 0 : 2, borderRightColor: theme8.ink, alignItems: "center", paddingLeft: 13 }, [
            label10(String(Array.isArray(row) ? row[index] : row?.[headers[index]] || ""), spec, {
              color: index === 2 || index === 3 ? theme8.cream : theme8.ink,
              fontSize: index === 0 ? 14 : 13,
              letterSpacing: 0.2
            })
          ]))
        ))
      ]
    )
  ]);
}
function renderClosing8(spec) {
  const theme8 = colors12(spec);
  const title2 = titleLines2(text5(spec, "title", DEFAULTS13.s8.title), "THANK YOU");
  return frame10(spec, "s8", [
    display4(title2.first, spec, { position: "absolute", left: 48, top: 110, width: 560, color: theme8.cream, fontSize: 104, lineHeight: 0.88 }),
    display4(title2.second, spec, { position: "absolute", left: 48, top: 210, width: 560, color: theme8.cream, fontSize: 104, lineHeight: 0.88 }),
    body10(text5(spec, "subtitle", DEFAULTS13.s8.subtitle), spec, { position: "absolute", left: 48, top: 370, width: 470, color: theme8.cream, fontSize: 17, lineHeight: 1.4 }),
    box({ position: "absolute", right: 82, bottom: 86, width: 170, height: 170, backgroundColor: theme8.pink, borderWidth: 2, borderColor: theme8.cream, transform: "rotate(-6deg)", alignItems: "center", justifyContent: "center" }, [
      box({ width: 138, height: 138, borderRadius: 69, borderWidth: 2, borderColor: theme8.cream, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
        TextBlock(text5(spec, "stamp", DEFAULTS13.s8.stamp), { color: theme8.cream, textAlign: "center", ...role13("metric", spec, { fontSize: 30, lineHeight: 0.9, fontWeight: 900 }) }),
        label10("TEMPLATE SET", spec, { color: theme8.cream, fontSize: 9, letterSpacing: 2, marginTop: 8, textAlign: "center" })
      ])
    ])
  ], { background: theme8.green, color: theme8.cream, light: true });
}
function renderCreativeModeGrid(spec) {
  switch (normalizeVariant14(spec)) {
    case "s2":
      return renderIntro(spec);
    case "s3":
      return renderStats7(spec);
    case "s4":
      return renderDiagram5(spec);
    case "s5":
      return renderBars3(spec);
    case "s6":
      return renderProcess2(spec);
    case "s7":
      return renderComparison(spec);
    case "s8":
      return renderClosing8(spec);
    case "s1":
    default:
      return renderSwitchPoster(spec);
  }
}

// templates/beautiful/daisy-workshop-playbook.mjs
var templateId16 = "daisy-workshop-playbook";
var PAGE_VARIANTS15 = [
  "title",
  "welcome",
  "weekly",
  "timeline",
  "chart-bar",
  "cards",
  "quote",
  "team",
  "process",
  "donut"
];
var rendererContract16 = {
  template_id: templateId16,
  renderer_id: `artboard_satori.${templateId16}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "daisy-days",
  implemented_page_variants: PAGE_VARIANTS15,
  page_family: {
    family_id: "daisy-days",
    supported_page_variants: PAGE_VARIANTS15,
    variant_usage_policy: {
      singletons: ["title", "donut"],
      repeatable: PAGE_VARIANTS15.filter((variant) => !["title", "donut"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/daisy-days-1.png"
};
var CANVAS10 = { width: 960, height: 540 };
var DEFAULTS14 = {
  title: {
    title: "Daisy Days",
    subtitle: "A cheerful presentation template for bright moments",
    eyebrow: "Workshop Playbook"
  },
  welcome: {
    title: "Welcome to Today",
    items: [
      "Review the materials on your desk",
      "Prepare your notes and supplies",
      "Take a moment to settle in comfortably",
      "Reach out if you need any assistance"
    ]
  },
  weekly: {
    title: "A Look at the Week",
    days: [
      { day: "Monday", tone: "pink", items: ["Reading", "Writing", "Numbers", "Science", "Art Studio"] },
      { day: "Tuesday", tone: "green", items: ["Reading", "Numbers", "History", "Crafts", "Games"] },
      { day: "Wednesday", tone: "coral", items: ["Reading", "Numbers", "Science", "Music", "Library"] },
      { day: "Thursday", tone: "yellow", items: ["Reading", "Numbers", "Projects", "Skills", "Art Studio"] },
      { day: "Friday", tone: "lavender", items: ["Reading", "Numbers", "Review", "Nature", "Garden"] }
    ]
  },
  timeline: {
    title: "Today's Schedule",
    steps: [
      { num: "1", title: "Morning Gathering", body: "Welcome circle and daily intentions" },
      { num: "2", title: "Learning Block", body: "Core concepts and guided practice" },
      { num: "3", title: "Creative Time", body: "Hands-on projects and exploration" },
      { num: "4", title: "Break", body: "Refreshments and outdoor play" },
      { num: "5", title: "Reflection", body: "Share learnings and closing circle" }
    ]
  },
  "chart-bar": {
    title: "Progress Snapshot",
    bars: [
      { label: "Reading", value: 78, tone: "coral" },
      { label: "Numbers", value: 64, tone: "mint" },
      { label: "Science", value: 52, tone: "sky" },
      { label: "Arts", value: 88, tone: "lavender" },
      { label: "Movement", value: 72, tone: "pink" }
    ]
  },
  cards: {
    title: "Helpful Reminders",
    cards: [
      { icon: "1", title: "Bring Curiosity", body: "Arrive ready to notice, ask, and try new things." },
      { icon: "2", title: "Share Kindly", body: "Use warm words and give every voice space." },
      { icon: "3", title: "Make Together", body: "Build ideas with hands, sketches, and examples." },
      { icon: "4", title: "Celebrate Progress", body: "Small steps count and deserve cheerful attention." }
    ]
  },
  quote: {
    title: "A Little Reminder",
    quote: "Small moments of wonder can grow into a whole garden of ideas.",
    author: "The Daisy Days Team"
  },
  team: {
    title: "Our Team",
    people: [
      { name: "Alex Rivera", role: "Lead Guide", tone: "pink" },
      { name: "Sam Chen", role: "Co-Teacher", tone: "yellow" },
      { name: "Jordan Park", role: "Specialist", tone: "lavender" },
      { name: "Taylor Kim", role: "Assistant", tone: "mint" }
    ]
  },
  process: {
    title: "How It Works",
    steps: [
      { num: "1", title: "Discover", body: "Explore new topics through guided introductions and engaging materials" },
      { num: "2", title: "Practice", body: "Apply concepts with hands-on activities and collaborative exercises" },
      { num: "3", title: "Reflect", body: "Share insights and celebrate progress with the community" }
    ]
  },
  donut: {
    title: "Topic Distribution",
    center_label: "Total",
    center_value: "100%",
    items: [
      { label: "Literacy", value: "33%", tone: "coral" },
      { label: "Numeracy", value: "27%", tone: "mint" },
      { label: "Science", value: "20%", tone: "sky" },
      { label: "Arts", value: "13%", tone: "yellow" },
      { label: "Movement", value: "7%", tone: "lavender" }
    ]
  }
};
function colors13(spec) {
  const source = spec.theme?.colors || {};
  return {
    cream: source.background || "#F5F0E6",
    ink: source.text || "#2D2D2D",
    muted: source.muted || "#6B6B6B",
    white: source.surface || "#FFFFFF",
    turquoise: source.primary || "#7ECDC0",
    pink: source.accent || "#F7C8D4",
    yellow: source.panel || "#FDE68A",
    mint: "#A8E6CF",
    lavender: "#D4A5E8",
    peach: "#FFCBA4",
    sky: "#A8D8F0",
    coral: "#F8635F"
  };
}
function tone(theme8, name) {
  return {
    pink: theme8.pink,
    green: theme8.mint,
    mint: theme8.mint,
    coral: theme8.coral,
    yellow: theme8.yellow,
    lavender: theme8.lavender,
    peach: theme8.peach,
    sky: theme8.sky,
    turquoise: theme8.turquoise
  }[name] || theme8.yellow;
}
function role14(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value9(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array11(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray8(spec, key, fallback2 = []) {
  return array11(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function content6(spec, variant) {
  return DEFAULTS14[variant] || DEFAULTS14.title;
}
function normalizeVariant15(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS15.length) return PAGE_VARIANTS15[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS15) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "title";
  if (raw.includes("agenda") || raw.includes("welcome")) return "welcome";
  if (raw.includes("chart") || raw.includes("data")) return "chart-bar";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("team") || raw.includes("detail")) return "team";
  if (raw.includes("timeline")) return "timeline";
  if (raw.includes("process")) return "process";
  if (raw.includes("closing") || raw.includes("donut")) return "donut";
  if (raw.includes("comparison") || raw.includes("card")) return "cards";
  return "welcome";
}
function variantPage7(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS15.indexOf(variant) + 1;
}
function page5(theme8, backgroundColor, children = []) {
  return box(
    {
      width: CANVAS10.width,
      height: CANVAS10.height,
      position: "relative",
      backgroundColor,
      color: theme8.ink,
      overflow: "hidden"
    },
    children
  );
}
function headline5(value15, spec, style = {}) {
  return Title(value15, {
    fontSize: 46,
    lineHeight: 1.08,
    letterSpacing: 0.8,
    ...role14("display", spec, { fontSize: 46, lineHeight: 1.08, fontWeight: 900, letterSpacing: 0.8 }),
    ...style
  });
}
function label11(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 11,
    lineHeight: 1.1,
    letterSpacing: 1.2,
    ...role14("label", spec, { fontSize: 11, lineHeight: 1.1, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }),
    ...style
  });
}
function body11(value15, spec, style = {}) {
  return TextBlock(value15, {
    fontSize: 16,
    lineHeight: 1.45,
    ...role14("body", spec, { fontSize: 16, lineHeight: 1.45, fontWeight: 600 }),
    ...style
  });
}
function metric5(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    fontSize: 26,
    lineHeight: 1,
    ...role14("metric", spec, { fontSize: 26, lineHeight: 1, fontWeight: 900 }),
    ...style
  });
}
function shadowPanel(theme8, { left, top, width, height, radius = 22, background = "#FFFFFF", children = [], style = {} }) {
  const isAbsolute = Number.isFinite(left) && Number.isFinite(top);
  return box(
    {
      position: isAbsolute ? "absolute" : "relative",
      ...isAbsolute ? { left, top } : {},
      width: width + 8,
      height: height + 8,
      flexShrink: 0
    },
    [
      box({
        position: "absolute",
        left: 6,
        top: 6,
        width,
        height,
        borderRadius: radius,
        backgroundColor: theme8.ink
      }),
      box(
        {
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          borderRadius: radius,
          borderWidth: 3,
          borderColor: theme8.ink,
          backgroundColor: background,
          overflow: "hidden",
          ...style
        },
        children
      )
    ]
  );
}
function flower(theme8, left, top, scale = 1) {
  const size = 112 * scale;
  const petals = [0, 45, 90, 135, 180, 225, 270, 315].map(
    (rotation, index) => box({
      position: "absolute",
      left: 34 * scale + Math.cos(rotation * Math.PI / 180) * 25 * scale,
      top: 18 * scale + Math.sin(rotation * Math.PI / 180) * 25 * scale,
      width: 42 * scale,
      height: 72 * scale,
      borderRadius: 22 * scale,
      borderWidth: 2,
      borderColor: theme8.ink,
      backgroundColor: theme8.white,
      opacity: index % 2 ? 0.95 : 1,
      transform: `rotate(${rotation}deg)`
    })
  );
  return box({ position: "absolute", left, top, width: size, height: size }, [
    ...petals,
    box({
      position: "absolute",
      left: 42 * scale,
      top: 42 * scale,
      width: 34 * scale,
      height: 34 * scale,
      borderRadius: 17 * scale,
      borderWidth: 2,
      borderColor: theme8.ink,
      backgroundColor: theme8.yellow
    })
  ]);
}
function star(theme8, left, top, color, size = 42) {
  return box({
    position: "absolute",
    left,
    top,
    width: size,
    height: size,
    borderRadius: Math.max(8, size * 0.22),
    borderWidth: 2,
    borderColor: theme8.ink,
    backgroundColor: color,
    transform: "rotate(34deg)"
  });
}
function sun(theme8, left, top, size = 118) {
  const ray = (x, y, rotate) => box({
    position: "absolute",
    left: x,
    top: y,
    width: 8,
    height: 23,
    borderRadius: 4,
    backgroundColor: theme8.ink,
    transform: `rotate(${rotate}deg)`
  });
  return box({ position: "absolute", left, top, width: size, height: size }, [
    ray(size / 2 - 4, 0, 0),
    ray(size / 2 - 4, size - 23, 0),
    ray(4, size / 2 - 12, 90),
    ray(size - 12, size / 2 - 12, 90),
    box({
      position: "absolute",
      left: 30,
      top: 30,
      width: size - 60,
      height: size - 60,
      borderRadius: (size - 60) / 2,
      borderWidth: 3,
      borderColor: theme8.ink,
      backgroundColor: theme8.yellow
    })
  ]);
}
function cloud(theme8, left, top, scale = 1) {
  const w = 130 * scale;
  const h = 82 * scale;
  return box({ position: "absolute", left, top, width: w, height: h }, [
    box({ position: "absolute", left: 12 * scale, top: 36 * scale, width: 108 * scale, height: 38 * scale, borderRadius: 22 * scale, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.white }),
    box({ position: "absolute", left: 24 * scale, top: 20 * scale, width: 44 * scale, height: 44 * scale, borderRadius: 22 * scale, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.white }),
    box({ position: "absolute", left: 56 * scale, top: 8 * scale, width: 56 * scale, height: 56 * scale, borderRadius: 28 * scale, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.white })
  ]);
}
function rainbow(theme8, left, top, scale = 1) {
  const bands = [
    { color: theme8.coral, inset: 0 },
    { color: theme8.yellow, inset: 12 },
    { color: theme8.mint, inset: 24 },
    { color: theme8.sky, inset: 36 }
  ];
  return box({ position: "absolute", left, top, width: 160 * scale, height: 104 * scale, overflow: "hidden" }, bands.map(
    (band) => box({
      position: "absolute",
      left: band.inset * scale,
      top: band.inset * scale,
      width: (160 - band.inset * 2) * scale,
      height: (150 - band.inset * 2) * scale,
      borderTopLeftRadius: (90 - band.inset) * scale,
      borderTopRightRadius: (90 - band.inset) * scale,
      borderWidth: 12 * scale,
      borderColor: theme8.ink,
      backgroundColor: band.color
    })
  ));
}
function dotRail(theme8, activeIndex) {
  return Array.from({ length: 10 }).map(
    (_, index) => box({
      position: "absolute",
      right: 20,
      top: 210 + index * 13,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme8.ink,
      backgroundColor: index === activeIndex ? theme8.yellow : theme8.white
    })
  );
}
function counter(theme8, spec, variant) {
  return shadowPanel(theme8, {
    left: 410,
    top: 498,
    width: 140,
    height: 28,
    radius: 16,
    background: theme8.white,
    style: { alignItems: "center", justifyContent: "center" },
    children: [
      TextBlock(`${variantPage7(spec, variant)} / 10`, {
        color: theme8.ink,
        fontSize: 9,
        lineHeight: 1,
        ...role14("metric", spec, { fontSize: 9, lineHeight: 1, fontWeight: 900 })
      })
    ]
  });
}
function commonDecor(theme8, variant, spec) {
  const index = Math.max(0, PAGE_VARIANTS15.indexOf(variant));
  return [
    ...dotRail(theme8, index),
    counter(theme8, spec, variant)
  ];
}
function renderTitle2(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "title");
  return page5(theme8, theme8.cream, [
    flower(theme8, -30, -28, 1.46),
    flower(theme8, 824, 16, 1.18),
    flower(theme8, 14, 420, 1.26),
    flower(theme8, 840, 404, 1.38),
    star(theme8, 72, 74, theme8.pink, 62),
    star(theme8, 116, 400, theme8.yellow, 48),
    star(theme8, 812, 92, theme8.mint, 58),
    label11(value9(spec, "eyebrow", data2.eyebrow), spec, { position: "absolute", left: 320, top: 188, width: 320, textAlign: "center", color: theme8.ink }),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 175, top: 222, width: 610, textAlign: "center", fontSize: 80, lineHeight: 1.02, color: theme8.ink }),
    body11(value9(spec, "subtitle", data2.subtitle), spec, { position: "absolute", left: 205, top: 324, width: 550, textAlign: "center", color: theme8.muted, fontSize: 19, lineHeight: 1.25 }),
    box({ position: "absolute", left: 420, top: 366, width: 120, height: 3, borderRadius: 2, backgroundColor: theme8.ink }),
    ...commonDecor(theme8, "title", spec)
  ]);
}
function renderWelcome(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "welcome");
  const items = array11(spec, "items", data2.items);
  return page5(theme8, theme8.cream, [
    sun(theme8, 38, 34, 124),
    rainbow(theme8, 742, 394, 1.08),
    star(theme8, 790, 74, theme8.pink, 52),
    star(theme8, 58, 400, theme8.lavender, 42),
    shadowPanel(theme8, {
      left: 112,
      top: 126,
      width: 736,
      height: 284,
      radius: 28,
      background: theme8.white,
      style: { flexDirection: "column" },
      children: [
        box({
          width: 736,
          height: 68,
          backgroundColor: theme8.mint,
          borderBottomWidth: 3,
          borderBottomColor: theme8.ink,
          alignItems: "center",
          justifyContent: "center"
        }, [
          headline5(value9(spec, "title", data2.title), spec, { fontSize: 28, lineHeight: 1.1, color: theme8.ink, textAlign: "center" })
        ]),
        box(
          { width: 736, height: 216, padding: "28px 48px", flexDirection: "column", gap: 17 },
          items.slice(0, 5).map(
            (item) => box({ width: 630, minHeight: 28, flexDirection: "row", alignItems: "flex-start", gap: 16 }, [
              box({ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme8.ink, backgroundColor: theme8.yellow, marginTop: 3, flexShrink: 0 }),
              body11(item, spec, { width: 585, fontSize: 17, lineHeight: 1.35, color: theme8.ink })
            ])
          )
        )
      ]
    }),
    ...commonDecor(theme8, "welcome", spec)
  ]);
}
function renderWeekly(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "weekly");
  const days = objectArray8(spec, "days", data2.days);
  return page5(theme8, theme8.turquoise, [
    flower(theme8, -22, -24, 1.08),
    flower(theme8, 844, 386, 1.15),
    star(theme8, 56, 408, theme8.yellow, 58),
    star(theme8, 120, 464, theme8.white, 38),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 180, top: 46, width: 600, textAlign: "center", color: theme8.white, fontSize: 42, textShadow: `3px 3px 0 ${theme8.ink}` }),
    ...days.slice(0, 5).map((day, index) => {
      const left = 48 + index * 174;
      return shadowPanel(theme8, {
        left,
        top: 138,
        width: 146,
        height: 274,
        radius: 20,
        background: theme8.white,
        style: { flexDirection: "column" },
        children: [
          box({
            width: 146,
            height: 48,
            backgroundColor: tone(theme8, day.tone),
            borderBottomWidth: 3,
            borderBottomColor: theme8.ink,
            alignItems: "center",
            justifyContent: "center"
          }, [
            label11(day.day, spec, { fontSize: 13, textAlign: "center", color: day.tone === "coral" ? theme8.white : theme8.ink })
          ]),
          box(
            { padding: "16px 14px", flexDirection: "column", gap: 9 },
            (day.items || []).slice(0, 6).map(
              (item) => body11(`- ${item}`, spec, { width: 112, fontSize: 12.5, lineHeight: 1.22, color: theme8.ink })
            )
          )
        ]
      });
    }),
    ...commonDecor(theme8, "weekly", spec)
  ]);
}
function renderTimeline8(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "timeline");
  const steps = objectArray8(spec, "steps", data2.steps);
  const stepColors = [theme8.coral, theme8.mint, theme8.sky, theme8.lavender, theme8.yellow];
  return page5(theme8, theme8.pink, [
    cloud(theme8, 766, 34, 1.1),
    cloud(theme8, 42, 394, 0.88),
    star(theme8, 76, 90, theme8.yellow, 48),
    flower(theme8, 806, 414, 0.9),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 210, top: 48, width: 540, textAlign: "center", color: theme8.white, fontSize: 39, textShadow: "3px 3px 0 rgba(0,0,0,0.22)" }),
    box(
      { position: "absolute", left: 184, top: 128, width: 592, height: 336, flexDirection: "column", gap: 16 },
      steps.slice(0, 5).map(
        (step, index) => box({ width: 592, height: 54, flexDirection: "row", alignItems: "center", gap: 18 }, [
          box({ width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: theme8.ink, backgroundColor: stepColors[index] || theme8.yellow, alignItems: "center", justifyContent: "center", flexShrink: 0 }, [
            metric5(step.num || String(index + 1), spec, { color: index === 4 ? theme8.ink : theme8.white, fontSize: 18 })
          ]),
          shadowPanel(theme8, {
            width: 500,
            height: 58,
            radius: 18,
            background: theme8.white,
            style: { position: "relative", padding: "10px 20px", flexDirection: "column" },
            children: [
              label11(step.title, spec, { color: theme8.ink, fontSize: 13, lineHeight: 1.05, marginBottom: 3 }),
              body11(step.body, spec, { color: theme8.muted, fontSize: 11.5, lineHeight: 1.15 })
            ]
          })
        ])
      )
    ),
    ...commonDecor(theme8, "timeline", spec)
  ]);
}
function renderChartBar(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "chart-bar");
  const bars = objectArray8(spec, "bars", data2.bars);
  return page5(theme8, theme8.yellow, [
    star(theme8, 64, 48, theme8.pink, 58),
    star(theme8, 824, 78, theme8.mint, 44),
    flower(theme8, 44, 386, 0.95),
    cloud(theme8, 774, 388, 0.98),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 205, top: 50, width: 550, textAlign: "center", color: theme8.ink, fontSize: 38 }),
    shadowPanel(theme8, {
      left: 126,
      top: 126,
      width: 708,
      height: 308,
      radius: 28,
      background: theme8.white,
      style: { padding: "34px 42px", flexDirection: "column" },
      children: [
        box(
          { width: 620, height: 202, flexDirection: "column", gap: 15 },
          bars.slice(0, 5).map((bar) => {
            const width = Math.max(80, Math.min(430, Number(bar.value || 50) * 4.7));
            return box({ width: 620, height: 26, flexDirection: "row", alignItems: "center", gap: 16 }, [
              label11(bar.label, spec, { width: 100, fontSize: 11, color: theme8.ink }),
              box({ width: 430, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme8.ink, backgroundColor: "#EFEFEF", overflow: "hidden" }, [
                box({ width, height: 18, backgroundColor: tone(theme8, bar.tone) })
              ]),
              metric5(`${bar.value}%`, spec, { width: 52, color: theme8.ink, fontSize: 16 })
            ]);
          })
        ),
        box(
          { width: 620, height: 42, flexDirection: "row", justifyContent: "center", gap: 20 },
          bars.slice(0, 5).map(
            (bar) => box({ flexDirection: "row", alignItems: "center", gap: 7 }, [
              box({ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: theme8.ink, backgroundColor: tone(theme8, bar.tone) }),
              body11(bar.label, spec, { fontSize: 10.5, lineHeight: 1, color: theme8.ink })
            ])
          )
        )
      ]
    }),
    ...commonDecor(theme8, "chart-bar", spec)
  ]);
}
function renderCards4(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "cards");
  const cards = objectArray8(spec, "cards", data2.cards);
  const iconColors = [theme8.pink, theme8.mint, theme8.sky, theme8.lavender];
  return page5(theme8, theme8.cream, [
    rainbow(theme8, 770, 34, 0.96),
    flower(theme8, -18, -18, 0.95),
    star(theme8, 52, 408, theme8.yellow, 52),
    sun(theme8, 802, 402, 104),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 210, top: 46, width: 540, textAlign: "center", fontSize: 38, color: theme8.ink }),
    ...cards.slice(0, 4).map((card2, index) => {
      const positions = [
        { left: 150, top: 126 },
        { left: 492, top: 126 },
        { left: 150, top: 262 },
        { left: 492, top: 262 }
      ];
      const position = positions[index];
      return shadowPanel(theme8, {
        left: position.left,
        top: position.top,
        width: 318,
        height: 116,
        radius: 20,
        background: theme8.white,
        style: { padding: "14px 22px", flexDirection: "column" },
        children: [
          box({ width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: theme8.ink, backgroundColor: iconColors[index] || theme8.yellow, alignItems: "center", justifyContent: "center", marginBottom: 6 }, [
            metric5(card2.icon || String(index + 1), spec, { color: theme8.ink, fontSize: 14 })
          ]),
          label11(card2.title, spec, { color: theme8.ink, fontSize: 11.5, lineHeight: 1.05, marginBottom: 5 }),
          body11(card2.body, spec, { color: theme8.muted, fontSize: 10, lineHeight: 1.22, width: 250 })
        ]
      });
    }),
    ...commonDecor(theme8, "cards", spec)
  ]);
}
function renderQuote13(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "quote");
  return page5(theme8, theme8.lavender, [
    flower(theme8, 48, 36, 0.98),
    flower(theme8, 770, 360, 1.02),
    rainbow(theme8, 780, 34, 0.84),
    star(theme8, 752, 100, theme8.yellow, 50),
    star(theme8, 82, 390, theme8.white, 44),
    shadowPanel(theme8, {
      left: 158,
      top: 126,
      width: 644,
      height: 286,
      radius: 28,
      background: theme8.white,
      style: { padding: "38px 54px", alignItems: "center", justifyContent: "center", flexDirection: "column" },
      children: [
        TextBlock("\u201C", { color: theme8.pink, fontSize: 66, lineHeight: 0.8, ...role14("display", spec, { fontSize: 66, lineHeight: 0.8, fontWeight: 900 }) }),
        headline5(value9(spec, "quote", data2.quote), spec, { width: 520, fontSize: 28, lineHeight: 1.22, textAlign: "center", color: theme8.ink, marginTop: 4, marginBottom: 22 }),
        body11(value9(spec, "author", data2.author), spec, { color: theme8.muted, fontSize: 15, lineHeight: 1, textAlign: "center", fontWeight: 800 })
      ]
    }),
    ...commonDecor(theme8, "quote", spec)
  ]);
}
function renderTeam4(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "team");
  const people = objectArray8(spec, "people", data2.people);
  return page5(theme8, theme8.mint, [
    flower(theme8, -12, -14, 1.02),
    flower(theme8, 828, 0, 0.95),
    star(theme8, 64, 414, theme8.yellow, 50),
    star(theme8, 818, 430, theme8.white, 42),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 210, top: 50, width: 540, textAlign: "center", color: theme8.white, fontSize: 40, textShadow: "3px 3px 0 rgba(0,0,0,0.18)" }),
    box(
      { position: "absolute", left: 90, top: 168, width: 780, height: 220, flexDirection: "row", justifyContent: "space-between" },
      people.slice(0, 4).map(
        (person, index) => box({ width: 174, height: 220, alignItems: "center", flexDirection: "column", gap: 12 }, [
          shadowPanel(theme8, {
            width: 108,
            height: 108,
            radius: 54,
            background: theme8.white,
            style: { position: "relative", alignItems: "center", justifyContent: "center" },
            children: [
              box({ width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: theme8.ink, backgroundColor: tone(theme8, person.tone), marginTop: 2 })
            ]
          }),
          label11(person.name, spec, { width: 168, textAlign: "center", fontSize: 14, color: theme8.ink, lineHeight: 1.15 }),
          body11(person.role, spec, { width: 150, textAlign: "center", fontSize: 12, lineHeight: 1.2, color: theme8.muted })
        ])
      )
    ),
    ...commonDecor(theme8, "team", spec)
  ]);
}
function renderProcess3(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "process");
  const steps = objectArray8(spec, "steps", data2.steps);
  const stepColors = [theme8.coral, theme8.turquoise, theme8.lavender];
  return page5(theme8, theme8.peach, [
    cloud(theme8, 48, 38, 1),
    cloud(theme8, 774, 54, 0.86),
    star(theme8, 78, 420, theme8.yellow, 52),
    flower(theme8, 802, 386, 1.02),
    headline5(value9(spec, "title", data2.title), spec, { position: "absolute", left: 220, top: 54, width: 520, textAlign: "center", color: theme8.ink, fontSize: 40 }),
    box(
      { position: "absolute", left: 96, top: 170, width: 768, height: 220, flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: 16 },
      steps.slice(0, 3).flatMap((step, index) => {
        const stepNode = box({ width: 210, height: 220, alignItems: "center", flexDirection: "column", gap: 14 }, [
          box({ width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: theme8.ink, backgroundColor: stepColors[index] || theme8.yellow, alignItems: "center", justifyContent: "center" }, [
            metric5(step.num || String(index + 1), spec, { color: index === 0 ? theme8.white : theme8.ink, fontSize: 30 })
          ]),
          label11(step.title, spec, { width: 180, textAlign: "center", color: theme8.ink, fontSize: 15, lineHeight: 1.05 }),
          body11(step.body, spec, { width: 190, textAlign: "center", color: theme8.muted, fontSize: 12.5, lineHeight: 1.28 })
        ]);
        if (index >= 2) return [stepNode];
        return [
          stepNode,
          TextBlock("\u2192", { fontSize: 38, color: theme8.ink, marginTop: 28, lineHeight: 1, ...role14("display", spec, { fontSize: 38, lineHeight: 1, fontWeight: 900 }) })
        ];
      })
    ),
    ...commonDecor(theme8, "process", spec)
  ]);
}
function renderDonut(spec) {
  const theme8 = colors13(spec);
  const data2 = content6(spec, "donut");
  const items = objectArray8(spec, "items", data2.items);
  const ringColors = [theme8.coral, theme8.mint, theme8.sky, theme8.yellow, theme8.lavender];
  return page5(theme8, theme8.sky, [
    flower(theme8, -12, -12, 1.06),
    flower(theme8, 820, 380, 1.15),
    star(theme8, 812, 74, theme8.yellow, 52),
    star(theme8, 70, 406, theme8.white, 42),
    box({ position: "absolute", left: 132, top: 136, width: 290, height: 290 }, [
      box({ position: "absolute", left: 0, top: 0, width: 280, height: 280, borderRadius: 140, borderWidth: 3, borderColor: theme8.ink, backgroundColor: "#EFEFEF" }),
      ...ringColors.map(
        (color, index) => box({
          position: "absolute",
          left: 22 + index * 12,
          top: 22 + index * 12,
          width: 236 - index * 24,
          height: 236 - index * 24,
          borderRadius: 118 - index * 12,
          borderWidth: 14,
          borderColor: color,
          backgroundColor: "transparent"
        })
      ),
      box({ position: "absolute", left: 78, top: 78, width: 124, height: 124, borderRadius: 62, borderWidth: 3, borderColor: theme8.ink, backgroundColor: theme8.white, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
        label11(value9(spec, "center_label", data2.center_label), spec, { color: theme8.ink, fontSize: 12, textAlign: "center" }),
        metric5(value9(spec, "center_value", data2.center_value), spec, { color: theme8.ink, fontSize: 27, textAlign: "center", marginTop: 4 })
      ])
    ]),
    box({ position: "absolute", left: 484, top: 138, width: 350, height: 280, flexDirection: "column", gap: 13 }, [
      headline5(value9(spec, "title", data2.title), spec, { width: 340, fontSize: 32, lineHeight: 1.1, color: theme8.ink, marginBottom: 8 }),
      ...items.slice(0, 5).map(
        (item, index) => box({ flexDirection: "row", alignItems: "center", gap: 13, height: 28 }, [
          box({ width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: theme8.ink, backgroundColor: ringColors[index] || theme8.yellow, flexShrink: 0 }),
          body11(`${item.label} - ${item.value}`, spec, { width: 260, fontSize: 15, lineHeight: 1.2, color: theme8.ink })
        ])
      )
    ]),
    ...commonDecor(theme8, "donut", spec)
  ]);
}
var RENDERERS11 = {
  title: renderTitle2,
  welcome: renderWelcome,
  weekly: renderWeekly,
  timeline: renderTimeline8,
  "chart-bar": renderChartBar,
  cards: renderCards4,
  quote: renderQuote13,
  team: renderTeam4,
  process: renderProcess3,
  donut: renderDonut
};
function renderDaisyWorkshopPlaybook(spec) {
  const variant = normalizeVariant15(spec);
  return (RENDERERS11[variant] || renderWelcome)(spec);
}

// templates/beautiful/emerald-editorial-cover.mjs
var templateId17 = "emerald-editorial-cover";
var PAGE_VARIANTS16 = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
var CANVAS11 = { width: 960, height: 540 };
var rendererContract17 = {
  template_id: templateId17,
  renderer_id: `artboard_satori.${templateId17}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "emerald-editorial",
  implemented_page_variants: PAGE_VARIANTS16,
  page_family: {
    family_id: "emerald-editorial",
    supported_page_variants: PAGE_VARIANTS16,
    variant_usage_policy: {
      singletons: ["s1", "s8"],
      repeatable: ["s2", "s3", "s4", "s5", "s6", "s7"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/emerald-editorial-1.png"
};
var DEFAULTS15 = {
  s1: {
    title: "The State of the Work Ahead",
    subtitle: "A presentation for the leadership team",
    left_footer: "Prepared by the planning office",
    right_footer: "November - MMXXV"
  },
  s2: {
    eyebrow: "What we will cover today",
    title: "The Programme",
    items: [
      { num: "01", title: "The Quarter In Review", kind: "Overview - 8 min" },
      { num: "02", title: "Where Attention Moves Next", kind: "Signal - 10 min" },
      { num: "03", title: "What The Numbers Tell Us", kind: "Data - 12 min" },
      { num: "04", title: "The Working Method", kind: "Process - 7 min" },
      { num: "05", title: "Questions And Decisions", kind: "Close - 3 min" }
    ]
  },
  s3: {
    section: "Q3",
    title: "The Quarter,\nIn Review.",
    kicker: "A reading of the period",
    body: "A short briefing on the operating signals that shaped the quarter. The goal is not to cover every detail, but to name the patterns that should guide the next decision cycle.",
    meta: ["Overview", "Four themes"]
  },
  s4: {
    title_top: "Three Threads",
    title_middle: "worth",
    title_bottom: "Following Closely.",
    items: [
      { num: "01", title: "Demand stays resilient", body: "The headline is steady, but the composition keeps moving underneath." },
      { num: "02", title: "Work shifts toward evidence", body: "Teams are asking for clearer proof before committing resources." },
      { num: "03", title: "Decision windows are shorter", body: "The best forums are more frequent, more specific, and easier to close." }
    ]
  },
  s5: {
    title: "How the\nnumbers moved.",
    subtitle: "Two indicators tracked side by side across six quarters. The navy bars show what was committed; the paper bars show what was delivered against it.",
    legend: ["Committed", "Delivered"],
    bars: [
      { label: "Q1", a: 72, b: 54 },
      { label: "Q2", a: 80, b: 63 },
      { label: "Q3", a: 66, b: 60 },
      { label: "Q4", a: 88, b: 72 },
      { label: "Q5", a: 76, b: 69 },
      { label: "Q6", a: 94, b: 79 }
    ]
  },
  s6: {
    eyebrow: "From question to decision",
    title: "A four-step\nworking method.",
    subtitle: "A short loop the team runs every fortnight. Each step has a single owner and produces one artefact that the next step can use.",
    steps: [
      { num: "01", title: "Frame", body: "Name the decision and the evidence needed to make it." },
      { num: "02", title: "Gather", body: "Collect only the signals that change the answer." },
      { num: "03", title: "Decide", body: "Make the tradeoff explicit and record the owner." },
      { num: "04", title: "Review", body: "Return to the outcome before the next cycle starts." }
    ]
  },
  s7: {
    eyebrow: "Four numbers worth keeping in view",
    title: "By the\nnumbers.",
    subtitle: "A short panel of indicators the team reviews each month. Variances are read against the plan agreed in March.",
    metrics: [
      { value: "84", unit: "%", label: "Retention" },
      { value: "3.2", unit: "x", label: "Pipeline" },
      { value: "18", unit: "d", label: "Cycle time" },
      { value: "+12", unit: "pt", label: "Quality lift" }
    ]
  },
  s8: {
    kicker: "The work that follows",
    title_top: "Questions",
    title_middle: "and",
    title_bottom: "Discussion",
    footer: "Thank you - continue the conversation after the session"
  }
};
function colors14(spec) {
  const source = spec.theme?.colors || {};
  return {
    emerald: source.background || "#3CD896",
    emerald2: "#2DC684",
    navy: source.text || "#0F1A5C",
    navy2: "#1B2774",
    paper: source.panel || "#F1E9D6"
  };
}
function role15(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value10(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array12(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function content7(spec, variant) {
  return { ...DEFAULTS15[variant] || DEFAULTS15.s1, ...spec.content || {} };
}
function normalizeVariant16(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS16.length) return `s${sourceIndex}`;
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS16) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "s1";
  if (raw.includes("agenda") || raw.includes("toc")) return "s2";
  if (raw.includes("section") || raw.includes("content")) return "s3";
  if (raw.includes("statement") || raw.includes("comparison") || raw.includes("detail")) return "s4";
  if (raw.includes("data") || raw.includes("chart")) return "s5";
  if (raw.includes("process") || raw.includes("timeline")) return "s6";
  if (raw.includes("metric") || raw.includes("kpi")) return "s7";
  if (raw.includes("closing") || raw.includes("summary")) return "s8";
  return "s2";
}
function page6(backgroundColor, color, children = []) {
  return box(
    {
      width: CANVAS11.width,
      height: CANVAS11.height,
      position: "relative",
      backgroundColor,
      color,
      overflow: "hidden"
    },
    children
  );
}
function label12(text10, spec, style = {}) {
  return TextBlock(String(text10 || "").toUpperCase(), {
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: 1.4,
    ...role15("label", spec, { fontSize: 13, lineHeight: 1, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }),
    ...style
  });
}
function body12(text10, spec, style = {}) {
  return TextBlock(text10, {
    fontSize: 14,
    lineHeight: 1.42,
    ...role15("body", spec, { fontSize: 14, lineHeight: 1.42, fontWeight: 500 }),
    ...style
  });
}
function display5(text10, spec, style = {}) {
  return Title(text10, {
    fontSize: 62,
    lineHeight: 0.95,
    letterSpacing: -0.5,
    ...role15("display", spec, { fontSize: 62, lineHeight: 0.95, fontWeight: 900, letterSpacing: -0.5 }),
    ...style
  });
}
function metric6(text10, spec, style = {}) {
  return TextBlock(String(text10 || ""), {
    fontSize: 72,
    lineHeight: 0.9,
    letterSpacing: -1,
    ...role15("metric", spec, { fontSize: 72, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }),
    ...style
  });
}
function rule3(style = {}) {
  return box({ position: "absolute", height: 2, backgroundColor: "currentColor", ...style });
}
function masthead(spec, theme8, left, right, style = {}) {
  return [
    label12(left, spec, { position: "absolute", left: 56, top: 44, color: theme8.navy, ...style }),
    label12(right, spec, { position: "absolute", right: 56, top: 44, color: theme8.navy, textAlign: "right", ...style })
  ];
}
function footline(spec, theme8, left, right) {
  return [
    label12(left, spec, { position: "absolute", left: 56, bottom: 34, color: theme8.navy }),
    label12(right, spec, { position: "absolute", right: 56, bottom: 34, color: theme8.navy, textAlign: "right" })
  ];
}
function ornamentWord(word, spec, theme8, y, x = 190, width = 580, color = theme8.navy) {
  const lineWidth = (width - 88) / 2;
  return [
    rule3({ left: x, top: y + 13, width: lineWidth, color }),
    rule3({ left: x, top: y + 20, width: lineWidth, color }),
    TextBlock(word, {
      position: "absolute",
      left: x + lineWidth + 18,
      top: y - 4,
      width: 52,
      color,
      fontSize: 30,
      lineHeight: 1,
      textAlign: "center",
      ...role15("display", spec, { fontSize: 30, lineHeight: 1, fontWeight: 800 })
    }),
    rule3({ left: x + lineWidth + 88, top: y + 13, width: lineWidth, color }),
    rule3({ left: x + lineWidth + 88, top: y + 20, width: lineWidth, color })
  ];
}
function renderCover13(spec, theme8) {
  const c = content7(spec, "s1");
  const words = String(value10(spec, "title", c.title)).toUpperCase().split(/\s+/);
  const top = words.length > 3 ? words.slice(0, 2).join(" ") : "STATE";
  const bottom = words.length > 3 ? words.slice(2).join(" ") : "THE WORK AHEAD";
  return page6(theme8.emerald, theme8.navy, [
    label12(c.left_footer, spec, { position: "absolute", left: 56, top: 28, color: theme8.navy }),
    label12("Issue 01", spec, { position: "absolute", right: 56, top: 28, color: theme8.navy, textAlign: "right" }),
    TextBlock("The", {
      position: "absolute",
      left: 420,
      top: 82,
      width: 120,
      color: theme8.navy,
      fontSize: 42,
      lineHeight: 0.9,
      textAlign: "center",
      ...role15("display", spec, { fontSize: 42, lineHeight: 0.9, fontWeight: 900 })
    }),
    display5(top, spec, {
      position: "absolute",
      left: 190,
      top: 124,
      width: 580,
      color: theme8.navy,
      fontSize: 88,
      lineHeight: 0.9,
      textAlign: "center"
    }),
    ...ornamentWord("of", spec, theme8, 226),
    display5(bottom, spec, {
      position: "absolute",
      left: 150,
      top: 266,
      width: 660,
      color: theme8.navy,
      fontSize: 68,
      lineHeight: 0.9,
      textAlign: "center"
    }),
    label12(value10(spec, "subtitle", c.subtitle), spec, {
      position: "absolute",
      left: 245,
      top: 438,
      width: 470,
      color: theme8.navy,
      textAlign: "center"
    }),
    ...footline(spec, theme8, c.left_footer, c.right_footer)
  ]);
}
function renderAgenda6(spec, theme8) {
  const c = content7(spec, "s2");
  const items = array12(spec, "items", c.items);
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Agenda", "Forty minutes"),
    label12(value10(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 72, top: 110, color: theme8.navy }),
    display5(value10(spec, "title", c.title), spec, { position: "absolute", left: 72, top: 142, width: 520, color: theme8.navy, fontSize: 58 }),
    ...items.slice(0, 5).flatMap((item, index) => {
      const y = 232 + index * 48;
      return [
        rule3({ left: 72, top: y, width: 816, color: theme8.navy }),
        TextBlock(item.num || String(index + 1).padStart(2, "0"), {
          position: "absolute",
          left: 72,
          top: y + 11,
          width: 72,
          color: theme8.navy,
          fontSize: 34,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(item.title || "", {
          position: "absolute",
          left: 155,
          top: y + 15,
          width: 450,
          color: theme8.navy,
          fontSize: 23,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 23, lineHeight: 1, fontWeight: 800 })
        }),
        label12(item.kind || "Section", spec, {
          position: "absolute",
          left: 650,
          top: y + 18,
          width: 230,
          color: theme8.navy,
          textAlign: "right"
        })
      ];
    }),
    rule3({ left: 72, top: 472, width: 816, color: theme8.navy })
  ]);
}
function renderSection(spec, theme8) {
  const c = content7(spec, "s3");
  return page6(theme8.emerald, theme8.navy, [
    box({ position: "absolute", left: 54, top: 54, width: 334, height: 432, backgroundColor: theme8.navy, color: theme8.emerald }, [
      label12("Section opener", spec, { position: "absolute", left: 30, top: 28, color: theme8.emerald }),
      metric6(value10(spec, "section", c.section), spec, {
        position: "absolute",
        left: 28,
        top: 130,
        width: 275,
        color: theme8.emerald,
        fontSize: 150,
        lineHeight: 0.86
      }),
      label12((c.meta || ["Overview", "Four themes"])[0], spec, { position: "absolute", left: 30, bottom: 42, color: theme8.emerald }),
      label12((c.meta || ["Overview", "Four themes"])[1], spec, { position: "absolute", right: 30, bottom: 42, color: theme8.emerald, textAlign: "right" })
    ]),
    label12(value10(spec, "kicker", c.kicker), spec, { position: "absolute", left: 450, top: 94, color: theme8.navy }),
    display5(value10(spec, "title", c.title), spec, {
      position: "absolute",
      left: 450,
      top: 135,
      width: 390,
      color: theme8.navy,
      fontSize: 58,
      lineHeight: 0.96
    }),
    body12(value10(spec, "body", c.body), spec, {
      position: "absolute",
      left: 452,
      top: 322,
      width: 390,
      color: theme8.navy,
      fontSize: 15,
      lineHeight: 1.42
    })
  ]);
}
function renderStatement5(spec, theme8) {
  const c = content7(spec, "s4");
  const items = array12(spec, "items", c.items);
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Overview - A reading of the period", "Three threads"),
    display5(value10(spec, "title_top", c.title_top), spec, {
      position: "absolute",
      left: 78,
      top: 102,
      width: 520,
      color: theme8.navy,
      fontSize: 56
    }),
    ...ornamentWord(value10(spec, "title_middle", c.title_middle), spec, theme8, 174, 78, 455),
    display5(value10(spec, "title_bottom", c.title_bottom), spec, {
      position: "absolute",
      left: 78,
      top: 210,
      width: 560,
      color: theme8.navy,
      fontSize: 50
    }),
    ...items.slice(0, 3).flatMap((item, index) => {
      const x = 78 + index * 274;
      const tone2 = index % 2 === 1 ? theme8.paper : theme8.navy;
      const fg = index % 2 === 1 ? theme8.navy : theme8.emerald;
      return [
        box({ position: "absolute", left: x, top: 344, width: 246, height: 134, backgroundColor: tone2 }),
        TextBlock(item.num || `0${index + 1}`, {
          position: "absolute",
          left: x + 18,
          top: 361,
          width: 48,
          color: fg,
          fontSize: 34,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(item.title || "", {
          position: "absolute",
          left: x + 72,
          top: 363,
          width: 142,
          color: fg,
          fontSize: 18,
          lineHeight: 1.05,
          ...role15("display", spec, { fontSize: 18, lineHeight: 1.05, fontWeight: 800 })
        }),
        body12(item.body || "", spec, {
          position: "absolute",
          left: x + 18,
          top: 426,
          width: 205,
          color: fg,
          fontSize: 11,
          lineHeight: 1.22
        })
      ];
    })
  ]);
}
function renderData2(spec, theme8) {
  const c = content7(spec, "s5");
  const bars = array12(spec, "bars", c.bars);
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Data study - quarterly movement", "Six quarters"),
    display5(value10(spec, "title", c.title), spec, {
      position: "absolute",
      left: 64,
      top: 118,
      width: 310,
      color: theme8.navy,
      fontSize: 48,
      lineHeight: 0.94
    }),
    body12(value10(spec, "subtitle", c.subtitle), spec, {
      position: "absolute",
      left: 64,
      top: 250,
      width: 320,
      color: theme8.navy,
      fontSize: 13,
      lineHeight: 1.42
    }),
    box({ position: "absolute", left: 430, top: 118, width: 455, height: 330, backgroundColor: theme8.navy }),
    ...bars.slice(0, 6).flatMap((item, index) => {
      const x = 462 + index * 61;
      const a = Math.max(8, Math.min(145, Number(item.a || 50) * 1.5));
      const b = Math.max(8, Math.min(145, Number(item.b || 35) * 1.5));
      return [
        box({ position: "absolute", left: x, top: 374 - a, width: 18, height: a, backgroundColor: theme8.emerald }),
        box({ position: "absolute", left: x + 25, top: 374 - b, width: 18, height: b, backgroundColor: theme8.paper }),
        label12(item.label || "", spec, { position: "absolute", left: x - 2, top: 394, width: 48, color: theme8.paper, textAlign: "center", fontSize: 9, letterSpacing: 0.5 })
      ];
    }),
    label12((c.legend || ["Committed"])[0], spec, { position: "absolute", left: 462, top: 414, color: theme8.emerald, fontSize: 10 }),
    label12((c.legend || ["", "Delivered"])[1], spec, { position: "absolute", left: 585, top: 414, color: theme8.paper, fontSize: 10 })
  ]);
}
function renderProcess4(spec, theme8) {
  const c = content7(spec, "s6");
  const steps = array12(spec, "steps", c.steps);
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Diagram - the working method", "Four steps"),
    label12(value10(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 66, top: 110, color: theme8.navy }),
    display5(value10(spec, "title", c.title), spec, {
      position: "absolute",
      left: 66,
      top: 142,
      width: 380,
      color: theme8.navy,
      fontSize: 48
    }),
    body12(value10(spec, "subtitle", c.subtitle), spec, {
      position: "absolute",
      left: 520,
      top: 126,
      width: 335,
      color: theme8.navy,
      fontSize: 14
    }),
    ...steps.slice(0, 4).flatMap((step, index) => {
      const x = 66 + index * 215;
      const tone2 = index % 2 === 0 ? theme8.navy : theme8.paper;
      const fg = index % 2 === 0 ? theme8.emerald : theme8.navy;
      return [
        box({ position: "absolute", left: x, top: 300, width: 188, height: 156, backgroundColor: tone2 }),
        TextBlock(step.num || `0${index + 1}`, {
          position: "absolute",
          left: x + 18,
          top: 318,
          width: 58,
          color: fg,
          fontSize: 42,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(step.title || "", {
          position: "absolute",
          left: x + 18,
          top: 366,
          width: 140,
          color: fg,
          fontSize: 24,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 24, lineHeight: 1, fontWeight: 800 })
        }),
        body12(step.body || "", spec, {
          position: "absolute",
          left: x + 18,
          top: 402,
          width: 148,
          color: fg,
          fontSize: 10,
          lineHeight: 1.25
        })
      ];
    })
  ]);
}
function renderKpi(spec, theme8) {
  const c = content7(spec, "s7");
  const metrics = array12(spec, "metrics", c.metrics);
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Headline indicators - Q3", "Four numbers"),
    label12(value10(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 66, top: 108, color: theme8.navy }),
    display5(value10(spec, "title", c.title), spec, {
      position: "absolute",
      left: 66,
      top: 140,
      width: 360,
      color: theme8.navy,
      fontSize: 52
    }),
    body12(value10(spec, "subtitle", c.subtitle), spec, {
      position: "absolute",
      left: 500,
      top: 130,
      width: 350,
      color: theme8.navy,
      fontSize: 14
    }),
    ...metrics.slice(0, 4).flatMap((item, index) => {
      const x = 66 + index % 2 * 410;
      const y = 294 + Math.floor(index / 2) * 110;
      return [
        box({ position: "absolute", left: x, top: y, width: 362, height: 82, backgroundColor: index % 2 === 0 ? theme8.navy : theme8.paper }),
        metric6(item.value || "", spec, {
          position: "absolute",
          left: x + 22,
          top: y + 11,
          width: 125,
          color: index % 2 === 0 ? theme8.emerald : theme8.navy,
          fontSize: 58
        }),
        TextBlock(item.unit || "", {
          position: "absolute",
          left: x + 158,
          top: y + 25,
          width: 48,
          color: index % 2 === 0 ? theme8.emerald : theme8.navy,
          fontSize: 28,
          lineHeight: 1,
          ...role15("display", spec, { fontSize: 28, lineHeight: 1, fontWeight: 800 })
        }),
        label12(item.label || "", spec, {
          position: "absolute",
          left: x + 205,
          top: y + 33,
          width: 130,
          color: index % 2 === 0 ? theme8.emerald : theme8.navy
        })
      ];
    })
  ]);
}
function renderClosing9(spec, theme8) {
  const c = content7(spec, "s8");
  return page6(theme8.emerald, theme8.navy, [
    ...masthead(spec, theme8, "Closing notes", "End of briefing"),
    label12(value10(spec, "kicker", c.kicker), spec, { position: "absolute", left: 260, top: 118, width: 440, color: theme8.navy, textAlign: "center" }),
    display5(value10(spec, "title_top", c.title_top).toUpperCase(), spec, {
      position: "absolute",
      left: 135,
      top: 170,
      width: 690,
      color: theme8.navy,
      fontSize: 82,
      lineHeight: 0.9,
      textAlign: "center"
    }),
    ...ornamentWord(value10(spec, "title_middle", c.title_middle), spec, theme8, 282, 205, 550),
    display5(value10(spec, "title_bottom", c.title_bottom).toUpperCase(), spec, {
      position: "absolute",
      left: 110,
      top: 324,
      width: 740,
      color: theme8.navy,
      fontSize: 76,
      lineHeight: 0.9,
      textAlign: "center"
    }),
    label12(value10(spec, "footer", c.footer), spec, {
      position: "absolute",
      left: 160,
      top: 460,
      width: 640,
      color: theme8.navy,
      textAlign: "center"
    })
  ]);
}
function renderEmeraldEditorialCover(spec) {
  const theme8 = colors14(spec);
  const variant = normalizeVariant16(spec);
  const renderers = {
    s1: renderCover13,
    s2: renderAgenda6,
    s3: renderSection,
    s4: renderStatement5,
    s5: renderData2,
    s6: renderProcess4,
    s7: renderKpi,
    s8: renderClosing9
  };
  return (renderers[variant] || renderers.s2)(spec, theme8);
}

// templates/beautiful/trend-grid-report.mjs
var templateId18 = "trend-grid-report";
var PAGE_VARIANTS17 = ["cover", "manifesto", "index", "chapter", "data", "quote", "table", "colophon"];
var rendererContract18 = {
  template_id: templateId18,
  renderer_id: `artboard_satori.${templateId18}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "cobalt-grid",
  implemented_page_variants: PAGE_VARIANTS17,
  page_family: {
    family_id: "cobalt-grid",
    supported_page_variants: PAGE_VARIANTS17,
    variant_usage_policy: {
      singletons: ["cover", "colophon"],
      repeatable: PAGE_VARIANTS17.filter((variant) => !["cover", "colophon"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/cobalt-grid-1.png"
};
var DEFAULTS16 = {
  cover: {
    title: "Index\n2026",
    eyebrow: "Field Office Quarterly \xB7 Volume IV",
    subtitle: "A field report on the state of things.",
    footer_left: "Edited by\nField Office Editorial \xB7 Lin Ito & Anya Mehrotra",
    footer_right: "Distributed\nTo subscribers & the open web \xB7 twice a year"
  },
  manifesto: {
    title: "A quiet question",
    quote: "A trend is a quiet question that several rooms started asking at roughly the same time.",
    eyebrow: "From the editor's note",
    footer: "Index 2026 \xB7 opening pages"
  },
  index: {
    title: "The index, in six entries.",
    eyebrow: "Spring 2026 \xB7 selected trends",
    items: [
      { num: "01.", title: "Slow software", body: "Tools that opt out of the urgency contest and instead promise to be quiet, considered, and on by default." },
      { num: "02.", title: "Domestic interfaces", body: "Screens designed to live in living rooms \u2014 softer typography, warmer colour, and a willingness to be ignored." },
      { num: "03.", title: "Hand-set print again", body: "A return to letterpress, risograph, and small-edition print, often paired with the most digital-feeling clients." },
      { num: "04.", title: "Quietly weird type", body: "Display type with one slightly off detail that keeps a reader looking twice." },
      { num: "05.", title: "Receipts and ledgers", body: "Information designed to be filed, not consumed." },
      { num: "06.", title: "Public weather", body: "Brand writing that includes the actual weather of the day." }
    ]
  },
  chapter: {
    eyebrow: "Chapter one \u2014 the case for slow software",
    title: "Software is a room",
    body: "In its first chapter the Index follows the studios, products, and quiet middleware projects that are walking back the urgency the last decade trained us into. Less push. More return."
  },
  data: {
    title: "Reader response, by quarter.",
    eyebrow: "Newsletter opens \xB7 2024 Q1 \u2014 2026 Q1",
    stats: [
      { value: "82%", label: "Open rate \xB7 Q1 2026", body: "A 2.1\xD7 lift on the inaugural issue, driven mostly by long-form chapters being read on Sunday mornings." },
      { value: "11k", label: "Active subscribers", body: "Quiet, mostly-not-on-social, paying readers; we do not run a referral programme." }
    ],
    bars: [34, 42, 46, 52, 60, 66, 74, 82],
    ticks: ["Q1 24", "Q2 24", "Q3 24", "Q4 24", "Q1 25", "Q2 25", "Q4 25", "Q1 26"]
  },
  quote: {
    eyebrow: "A note from the studio",
    quote: "We started the bulletin because the loudest readings of design were eating the ones we found ourselves rereading.",
    author: "Lin Ito",
    source: "Editor \xB7 Field Office Quarterly \xB7 letter to subscribers, March 2025"
  },
  table: {
    title: "Trend ledger, in long.",
    eyebrow: "All ten \xB7 with our reading on each",
    rows: [
      { num: "01.", name: "Slow software", reading: "Tools that opt out of urgency by default.", mood: "Quiet \xB7 welcomed", delta: "14 pts" },
      { num: "02.", name: "Domestic interfaces", reading: "Screens designed to live in living rooms.", mood: "Warm \xB7 ambient", delta: "9 pts" },
      { num: "03.", name: "Hand-set print", reading: "Letterpress and risograph paired with digital briefs.", mood: "Tactile \xB7 careful", delta: "7 pts" },
      { num: "04.", name: "Quietly weird type", reading: "Display faces with one slightly off detail.", mood: "Curious \xB7 alert", delta: "flat" },
      { num: "05.", name: "Receipts & ledgers", reading: "Information designed to be filed, not consumed.", mood: "Plain \xB7 honest", delta: "5 pts" },
      { num: "06.", name: "Public weather", reading: "Brand voice that admits the day's actual mood.", mood: "Open \xB7 tender", delta: "11 pts" }
    ]
  },
  colophon: {
    eyebrow: "Colophon \xB7 Index 2026",
    title: "See you in the autumn issue.",
    editors: "Editors\nLin Ito & Anya Mehrotra with the field-office collective",
    design: "Designed\nIn Newsreader, Hanken Grotesk & DM Mono \xB7 cobalt on cream",
    subscribe: "Subscribed\nfield-office.co \xB7 twice a year quiet, paid, and read slowly",
    note: "Until autumn\nThe next issue ships October 2026. Look for the cobalt envelope on a Monday morning."
  }
};
function colors15(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || source.paper || "#F0EBDE",
    paper2: source.surface || source.paper_2 || "#E6E0CE",
    cobalt: source.primary || source.text || source.ink || "#1F2BE0",
    soft: source.muted || source.ink_soft || "#5560E5",
    faint: "#C9C8EA"
  };
}
function role16(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value11(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array13(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function objectArray9(spec, key, fallback2 = []) {
  return array13(spec, key, fallback2).filter((item) => item && typeof item === "object");
}
function normalizeVariant17(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS17.length) return PAGE_VARIANTS17[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  for (const variant of PAGE_VARIANTS17) {
    if (raw.split(/\s+/).includes(variant)) return variant;
  }
  if (raw.includes("cover")) return "cover";
  if (raw.includes("manifest") || raw.includes("quote")) return raw.includes("quote") ? "quote" : "manifesto";
  if (raw.includes("agenda") || raw.includes("index")) return "index";
  if (raw.includes("data") || raw.includes("chart")) return "data";
  if (raw.includes("table") || raw.includes("compare") || raw.includes("detail")) return "table";
  if (raw.includes("closing") || raw.includes("colo")) return "colophon";
  return "chapter";
}
function variantPage8(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS17.indexOf(variant) + 1;
}
function label13(text10, spec, style = {}) {
  const theme8 = colors15(spec);
  return TextBlock(String(text10 || "").toUpperCase(), {
    color: theme8.cobalt,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...role16("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase" }),
    ...style
  });
}
function body13(text10, spec, style = {}) {
  const theme8 = colors15(spec);
  return TextBlock(text10, {
    color: theme8.cobalt,
    fontSize: 13,
    lineHeight: 1.42,
    ...role16("body", spec, { fontSize: 13, lineHeight: 1.42, fontWeight: 400 }),
    ...style
  });
}
function display6(text10, spec, style = {}) {
  const theme8 = colors15(spec);
  return Title(text10, {
    color: theme8.cobalt,
    fontSize: 68,
    lineHeight: 0.94,
    letterSpacing: -0.5,
    ...role16("display", spec, { fontSize: 68, lineHeight: 0.94, fontWeight: 400, letterSpacing: -0.5 }),
    ...style
  });
}
function mono(text10, spec, style = {}) {
  const theme8 = colors15(spec);
  return TextBlock(text10, {
    color: theme8.cobalt,
    fontSize: 8,
    lineHeight: 1.25,
    letterSpacing: 0.9,
    ...role16("metric", spec, { fontSize: 8, lineHeight: 1.25, fontWeight: 700, letterSpacing: 0.9 }),
    ...style
  });
}
function graphGrid(theme8) {
  const lines = [];
  for (let x = 46; x <= 914; x += 28) {
    lines.push(box({ position: "absolute", left: x, top: 30, width: 1, height: 480, backgroundColor: theme8.cobalt, opacity: 0.08 }));
  }
  for (let y = 30; y <= 510; y += 28) {
    lines.push(box({ position: "absolute", left: 46, top: y, width: 868, height: 1, backgroundColor: theme8.cobalt, opacity: 0.08 }));
  }
  return lines;
}
function glitch(theme8, left = 744, top = 42) {
  const segments = [];
  const slices = [
    { x: left, y: top, h: 72, bars: 9 },
    { x: left + 48, y: top + 58, h: 96, bars: 7 },
    { x: left - 36, y: top + 136, h: 128, bars: 11 },
    { x: left + 22, y: top + 252, h: 84, bars: 8 },
    { x: left - 12, y: top + 320, h: 116, bars: 10 }
  ];
  slices.forEach(({ x, y, h, bars }) => {
    for (let i = 0; i < bars; i += 1) {
      segments.push(box({ position: "absolute", left: x + i * 6, top: y, width: 3, height: h, backgroundColor: theme8.cobalt, opacity: 0.92 }));
    }
  });
  return segments;
}
function qr(theme8, x, y, size = 58) {
  const cells = [];
  const on = /* @__PURE__ */ new Set([0, 1, 3, 7, 8, 10, 14, 16, 21, 24, 27, 29, 32, 33, 36, 40, 45, 48, 52, 55, 57, 60, 63]);
  const cell = size / 8;
  for (let i = 0; i < 64; i += 1) {
    cells.push(box({ position: "absolute", left: i % 8 * cell, top: Math.floor(i / 8) * cell, width: cell - 1.5, height: cell - 1.5, backgroundColor: on.has(i) ? theme8.cobalt : theme8.paper }));
  }
  return box({ position: "absolute", left: x, top: y, width: size, height: size, backgroundColor: theme8.paper, padding: 0 }, cells);
}
function frame11(spec, variant, children = []) {
  const theme8 = colors15(spec);
  const page18 = `${String(variantPage8(spec, variant)).padStart(2, "0")} / 08`;
  return box(
    { width: 960, height: 540, position: "relative", backgroundColor: theme8.paper, color: theme8.cobalt, overflow: "hidden" },
    [
      ...graphGrid(theme8),
      box({ position: "absolute", left: 46, top: 24, width: 868, height: 1.5, backgroundColor: theme8.cobalt }),
      box({ position: "absolute", left: 46, bottom: 24, width: 868, height: 1.5, backgroundColor: theme8.cobalt }),
      mono("\u2190 / \u2192 \xB7 SPACE", spec, { position: "absolute", left: 46, bottom: 45, opacity: 0.55 }),
      mono(page18, spec, { position: "absolute", right: 46, bottom: 45, width: 80, textAlign: "right" }),
      ...children
    ]
  );
}
function renderCover14(spec) {
  const theme8 = colors15(spec);
  const parts = value11(spec, "title", DEFAULTS16.cover.title).split(/\n+/);
  return frame11(spec, "cover", [
    display6(parts[0] || "Index", spec, { position: "absolute", left: 56, top: 110, width: 320, fontSize: 92 }),
    display6(parts[1] || "2026", spec, { position: "absolute", left: 56, top: 216, width: 320, fontSize: 92 }),
    label13(value11(spec, "eyebrow", DEFAULTS16.cover.eyebrow), spec, { position: "absolute", left: 56, top: 346, width: 360 }),
    display6(value11(spec, "subtitle", DEFAULTS16.cover.subtitle), spec, { position: "absolute", left: 56, top: 380, width: 470, fontSize: 21, lineHeight: 1.06 }),
    ...glitch(theme8, 714, 38),
    qr(theme8, 792, 350, 72),
    mono(value11(spec, "footer_left", DEFAULTS16.cover.footer_left), spec, { position: "absolute", left: 56, bottom: 70, width: 248, whiteSpace: "pre-wrap" }),
    mono(value11(spec, "footer_right", DEFAULTS16.cover.footer_right), spec, { position: "absolute", left: 350, bottom: 70, width: 280, whiteSpace: "pre-wrap" })
  ]);
}
function renderManifesto4(spec) {
  const theme8 = colors15(spec);
  return frame11(spec, "manifesto", [
    display6(value11(spec, "quote", DEFAULTS16.manifesto.quote), spec, { position: "absolute", left: 74, top: 118, width: 700, fontSize: 49, lineHeight: 1.04 }),
    box({ position: "absolute", left: 74, top: 370, width: 280, height: 1, backgroundColor: theme8.cobalt }),
    label13(value11(spec, "eyebrow", DEFAULTS16.manifesto.eyebrow), spec, { position: "absolute", left: 74, top: 414 }),
    mono(value11(spec, "footer", DEFAULTS16.manifesto.footer), spec, { position: "absolute", left: 74, top: 440, width: 260 }),
    qr(theme8, 746, 84, 72)
  ]);
}
function renderIndex2(spec) {
  const theme8 = colors15(spec);
  const items = objectArray9(spec, "items", DEFAULTS16.index.items).slice(0, 6);
  return frame11(spec, "index", [
    display6(value11(spec, "title", DEFAULTS16.index.title), spec, { position: "absolute", left: 58, top: 68, width: 480, fontSize: 42 }),
    label13(value11(spec, "eyebrow", DEFAULTS16.index.eyebrow), spec, { position: "absolute", right: 64, top: 88, width: 300, textAlign: "right" }),
    box({ position: "absolute", left: 58, top: 134, width: 840, height: 1.5, backgroundColor: theme8.cobalt }),
    ...items.map(
      (item, index) => box({ position: "absolute", left: 58, top: 158 + index * 51, width: 830, height: 42, borderBottomWidth: 1, borderColor: theme8.faint, flexDirection: "row" }, [
        mono(item.num || "", spec, { width: 54, fontSize: 10 }),
        display6(item.title || "", spec, { width: 245, fontSize: 23, lineHeight: 1.05 }),
        body13(item.body || "", spec, { width: 500, fontSize: 11.2, lineHeight: 1.28 })
      ])
    )
  ]);
}
function renderChapter5(spec) {
  const theme8 = colors15(spec);
  return frame11(spec, "chapter", [
    label13(value11(spec, "eyebrow", DEFAULTS16.chapter.eyebrow), spec, { position: "absolute", left: 62, top: 82, width: 500 }),
    display6(value11(spec, "title", DEFAULTS16.chapter.title), spec, { position: "absolute", left: 62, top: 132, width: 710, fontSize: 53, lineHeight: 1.02 }),
    body13(value11(spec, "body", DEFAULTS16.chapter.body), spec, { position: "absolute", left: 410, top: 342, width: 390, fontSize: 14, lineHeight: 1.45 }),
    qr(theme8, 112, 342, 86),
    ...glitch(theme8, 806, 84)
  ]);
}
function renderData3(spec) {
  const theme8 = colors15(spec);
  const stats2 = objectArray9(spec, "stats", DEFAULTS16.data.stats).slice(0, 2);
  const bars = array13(spec, "bars", DEFAULTS16.data.bars).slice(0, 8).map((bar) => Number(bar) || 20);
  const ticks = array13(spec, "ticks", DEFAULTS16.data.ticks).slice(0, 8);
  return frame11(spec, "data", [
    display6(value11(spec, "title", DEFAULTS16.data.title), spec, { position: "absolute", left: 58, top: 70, width: 520, fontSize: 42 }),
    label13(value11(spec, "eyebrow", DEFAULTS16.data.eyebrow), spec, { position: "absolute", left: 60, top: 158, width: 440 }),
    ...stats2.map((item, index) => box({ position: "absolute", left: 60 + index * 270, top: 194, width: 238, flexDirection: "column" }, [
      display6(item.value || "", spec, { fontSize: 54, lineHeight: 0.9 }),
      label13(item.label || "", spec, { marginTop: 10, marginBottom: 12, width: 220 }),
      body13(item.body || "", spec, { fontSize: 11.5, lineHeight: 1.36, width: 220 })
    ])),
    box({ position: "absolute", left: 60, top: 385, width: 820, height: 1.5, backgroundColor: theme8.cobalt }),
    ...bars.map(
      (bar, index) => box(
        { position: "absolute", left: 82 + index * 96, top: 372 - bar * 2.5, width: 36, height: Math.max(24, bar * 2.5), flexDirection: "column-reverse" },
        Array.from({ length: 10 }).map((_, cell) => box({ width: 36, height: 8, backgroundColor: cell < Math.round(bar / 10) ? theme8.cobalt : theme8.faint, marginTop: 3 }))
      )
    ),
    ...ticks.map((tick, index) => mono(tick, spec, { position: "absolute", left: 62 + index * 96, top: 406, width: 76, textAlign: "center", fontSize: 7 }))
  ]);
}
function renderQuote14(spec) {
  const theme8 = colors15(spec);
  return frame11(spec, "quote", [
    label13(value11(spec, "eyebrow", DEFAULTS16.quote.eyebrow), spec, { position: "absolute", left: 74, top: 82 }),
    TextBlock('"', { position: "absolute", left: 70, top: 116, color: theme8.faint, fontSize: 100, lineHeight: 1, ...role16("display", spec, { fontSize: 100, lineHeight: 1, fontWeight: 400 }) }),
    display6(value11(spec, "quote", DEFAULTS16.quote.quote), spec, { position: "absolute", left: 142, top: 154, width: 700, fontSize: 46, lineHeight: 1.04 }),
    box({ position: "absolute", left: 144, top: 390, width: 320, height: 1, backgroundColor: theme8.cobalt }),
    label13(value11(spec, "author", DEFAULTS16.quote.author), spec, { position: "absolute", left: 144, top: 414 }),
    mono(value11(spec, "source", DEFAULTS16.quote.source), spec, { position: "absolute", left: 250, top: 414, width: 420 })
  ]);
}
function renderTable(spec) {
  const theme8 = colors15(spec);
  const rows = objectArray9(spec, "rows", DEFAULTS16.table.rows).slice(0, 6);
  return frame11(spec, "table", [
    display6(value11(spec, "title", DEFAULTS16.table.title), spec, { position: "absolute", left: 58, top: 62, width: 430, fontSize: 42 }),
    label13(value11(spec, "eyebrow", DEFAULTS16.table.eyebrow), spec, { position: "absolute", right: 64, top: 86, width: 360, textAlign: "right" }),
    box({ position: "absolute", left: 58, top: 132, width: 840, height: 1.5, backgroundColor: theme8.cobalt }),
    ...["No.", "Trend", "Reading", "Mood", "YoY"].map((head, index) => label13(head, spec, { position: "absolute", left: [58, 118, 308, 610, 786][index], top: 150, width: [50, 170, 280, 150, 80][index], fontSize: 7.5 })),
    ...rows.map(
      (item, index) => box({ position: "absolute", left: 58, top: 180 + index * 45, width: 840, height: 38, borderBottomWidth: 1, borderColor: theme8.faint, flexDirection: "row" }, [
        mono(item.num || "", spec, { width: 60 }),
        display6(item.name || "", spec, { width: 190, fontSize: 19, lineHeight: 1.05 }),
        body13(item.reading || "", spec, { width: 300, fontSize: 10.5, lineHeight: 1.22 }),
        label13(item.mood || "", spec, { width: 180, fontSize: 7.2, letterSpacing: 1.1 }),
        mono(item.delta || "", spec, { width: 80, textAlign: "right" })
      ])
    )
  ]);
}
function renderColophon2(spec) {
  const theme8 = colors15(spec);
  return frame11(spec, "colophon", [
    label13(value11(spec, "eyebrow", DEFAULTS16.colophon.eyebrow), spec, { position: "absolute", left: 64, top: 80 }),
    display6(value11(spec, "title", DEFAULTS16.colophon.title), spec, { position: "absolute", left: 64, top: 128, width: 700, fontSize: 56, lineHeight: 1 }),
    box({ position: "absolute", left: 64, top: 294, width: 792, flexDirection: "row" }, [
      mono(value11(spec, "editors", DEFAULTS16.colophon.editors), spec, { width: 190, whiteSpace: "pre-wrap", marginRight: 34 }),
      mono(value11(spec, "design", DEFAULTS16.colophon.design), spec, { width: 210, whiteSpace: "pre-wrap", marginRight: 34 }),
      mono(value11(spec, "subscribe", DEFAULTS16.colophon.subscribe), spec, { width: 210, whiteSpace: "pre-wrap" })
    ]),
    box({ position: "absolute", left: 64, top: 400, width: 420, height: 1, backgroundColor: theme8.cobalt }),
    body13(value11(spec, "note", DEFAULTS16.colophon.note), spec, { position: "absolute", left: 64, top: 420, width: 500, fontSize: 12.5, lineHeight: 1.38 }),
    qr(theme8, 756, 344, 86)
  ]);
}
var RENDERERS12 = {
  cover: renderCover14,
  manifesto: renderManifesto4,
  index: renderIndex2,
  chapter: renderChapter5,
  data: renderData3,
  quote: renderQuote14,
  table: renderTable,
  colophon: renderColophon2
};
function renderTrendGridReport(spec) {
  const variant = normalizeVariant17(spec);
  return (RENDERERS12[variant] || renderCover14)(spec);
}

// templates/beautiful/product-ribbon.mjs
var templateId19 = "product-ribbon";
var PAGE_VARIANTS18 = [
  "cover",
  "manifesto",
  "catalogue",
  "stripe",
  "data",
  "quote",
  "cal",
  "colophon"
];
var rendererContract19 = {
  template_id: templateId19,
  renderer_id: `artboard_satori.${templateId19}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "sakura-chroma",
  implemented_page_variants: PAGE_VARIANTS18,
  page_family: {
    family_id: "sakura-chroma",
    supported_page_variants: PAGE_VARIANTS18,
    variant_usage_policy: {
      singletons: ["cover", "colophon"],
      repeatable: ["manifesto", "catalogue", "stripe", "data", "quote", "cal"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/sakura-chroma-1.png"
};
var DEFAULTS17 = {
  cover: {
    brand: "tape\ngarden",
    edition: "CATALOGUE NO. 7",
    title: "T-26",
    subtitle: "SUPERCATALOG",
    footer_left: "\u9650\u5B9A\u7248  made in matsumoto",
    footer_status: "N.R. :  ON  OFF",
    seal: "26",
    stamp_label: "AS SEEN ON",
    stamp: "TG"
  },
  manifesto: {
    eyebrow: "A short letter from the studio, January 2026",
    title: "We make small analog things for the people who keep tape recorders on their desks."
  },
  catalogue: {
    title: "The 2026 Catalogue",
    eyebrow: "Four products - spring & summer release",
    cards: [
      {
        tone: "red",
        name: "SC-01\nBLOOM PEDAL",
        body: "A tape-saturation pedal voiced after late-70s cassette decks. Three knobs, one switch, and one warm output.",
        extra: "Hand-wired in Matsumoto, one batch at a time, with a cream rosette stamped on the bottom plate.",
        specs: ["FORMAT 9V pedal", "CHANNELS Mono TRS", "CASE Steel", "PRICE \xA538,000", "SHIPS 14 Mar"]
      },
      {
        tone: "pink",
        name: "SC-02\nCHROMA DECK",
        body: "A studio cassette deck reissued from our 1981 design with quartz-locked transport and switchable bias.",
        extra: "Each unit ships with a numbered plate, hand-cut sleeve, and a note about wearing it in slowly.",
        specs: ["FORMAT Hardware", "EDITION 320 units", "FINISH Cream steel", "PRICE \xA5184,000", "SHIPS 02 May"]
      },
      {
        tone: "orange",
        name: "SC-03\nSUPER TAPE",
        body: "Seven C-60 cassettes, each labelled with a colour, a season, and a side on cream printed stock.",
        extra: "Refill packs ship four times a year. Subscribers get a studio note with each delivery.",
        specs: ["FORMAT 7 x C-60", "EDITION Open", "PACK Letterpress", "PRICE \xA57,200", "SHIPS 14 Jun"]
      },
      {
        tone: "blue",
        name: "SC-04\nMIX CHAIR",
        body: "A listening chair upholstered in cassette-loop fabric, woven from our own studio off-cuts.",
        extra: "Each chair is signed on the underside and dated to the day it left the workshop.",
        specs: ["FORMAT Furniture", "FRAME Solid ash", "UPHOLSTERY Tape", "PRICE \xA5420,000", "SHIPS 22 Aug"]
      }
    ]
  },
  stripe: {
    eyebrow: "A note pinned above the workbench",
    title: "Build the thing first, then write the spec sheet.",
    author: "- Ren Kobayashi / founder / 2024"
  },
  data: {
    title: "Output, by year",
    eyebrow: "Units shipped - 2019-2026 - Q3 estimate",
    metrics: [
      { value: "26", suffix: "K", label: "Units shipped, 2026", body: "Our biggest year yet, driven mostly by the Bloom Pedal selling through three production runs.", tone: "red" },
      { value: "61", suffix: "%", label: "Repeat customers", body: "Three of every five orders this year went to a household we'd already shipped to before.", tone: "blue" }
    ],
    bars: [2, 3, 3, 4, 4, 5, 5, 6],
    labels: ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]
  },
  quote: {
    eyebrow: "A reader writes",
    quote: '"It feels less like a gadget and more like a small machine that has decided to be friendly with my desk."',
    author: "Mei Tanaka",
    meta: "Reader letter / Bloom Pedal owner / April 2025"
  },
  cal: {
    title: "Release schedule",
    eyebrow: "Spring & summer - 2026",
    rows: [
      ["14.03", "SC-01 Bloom Pedal - first run", "Open edition - 600 units", "PEDAL", "red", true],
      ["02.05", "SC-02 Chroma Deck - numbered run", "Limited - 320 units", "DECK", "pink", true],
      ["14.06", "SC-03 Super Tape boxset", "Open - refilled monthly", "TAPE", "orange", false],
      ["12.07", "SC-03b Summer side - 4 cassettes", "Refill kit", "TAPE", "orange", false],
      ["22.08", "SC-04 Mix Chair - workshop run", "Single piece", "CHAIR", "blue", true],
      ["03.10", "Open studio & listening night", "Matsumoto workshop", "EVENT", "green", false],
      ["14.11", "Catalogue No. 8 - early preview", "Subscribers only", "PREVIEW", "pink", true]
    ]
  },
  colophon: {
    eyebrow: "Colophon - Catalogue No. 7",
    title: "See you in volume eight.",
    seal: "VOL\n26",
    stamp: "COMPLETE",
    footer: [
      { label: "Studio", body: "Tape Garden - Matsumoto\nest. 2018" },
      { label: "Designed", body: "In a small room beside the\ntape archive - over six months" },
      { label: "Until next year", body: "Catalogue No. 8 ships January 2027. Mailing list opens with the snow." }
    ]
  }
};
function colors16(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || "#F1E6CB",
    paperDark: source.surface || source.panel || "#E5D6B0",
    ink: source.text || "#3A2516",
    red: source.red || "#E5392A",
    pink: source.primary || "#E54489",
    orange: source.orange || "#F09131",
    green: source.green || "#3D9F47",
    blue: source.blue || "#3F8BC4",
    yellow: source.panel || "#F0BC2A"
  };
}
function colorByTone(theme8, tone2) {
  return {
    red: theme8.red,
    pink: theme8.pink,
    orange: theme8.orange,
    yellow: theme8.yellow,
    green: theme8.green,
    blue: theme8.blue
  }[tone2] || theme8.red;
}
function positioned(base, positions = {}) {
  const out = { ...base };
  for (const [key, value15] of Object.entries(positions)) {
    if (value15 !== void 0 && value15 !== null) out[key] = value15;
  }
  return out;
}
function value12(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array14(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function variantContent(spec, variant) {
  return { ...DEFAULTS17[variant], ...spec.content || {} };
}
function normalizeVariant18(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS18.length) return PAGE_VARIANTS18[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS18) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("manifesto")) return "manifesto";
  if (raw.includes("chart") || raw.includes("dashboard") || raw.includes("catalogue")) return "catalogue";
  if (raw.includes("quote") || raw.includes("emphasis")) return "quote";
  if (raw.includes("timeline") || raw.includes("schedule") || raw.includes("cal")) return "cal";
  if (raw.includes("closing") || raw.includes("colophon")) return "colophon";
  return "manifesto";
}
function role17(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function label14(text10, spec, style = {}) {
  return TextBlock(String(text10 || "").toUpperCase(), {
    color: style.color || "#3A2516",
    fontSize: 11,
    lineHeight: 1.1,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...role17("label", spec, { fontSize: 11, lineHeight: 1.1, fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase" }),
    ...style
  });
}
function display7(text10, spec, style = {}) {
  return Title(text10, {
    color: style.color || "#3A2516",
    fontSize: 70,
    lineHeight: 0.88,
    letterSpacing: -1.2,
    ...role17("display", spec, { fontWeight: 900, fontSize: 70, lineHeight: 0.88, letterSpacing: -1.2 }),
    ...style
  });
}
function body14(text10, spec, style = {}) {
  return TextBlock(text10, {
    color: style.color || "#3A2516",
    fontSize: 15,
    lineHeight: 1.38,
    ...role17("body", spec, { fontWeight: 500, fontSize: 15, lineHeight: 1.38 }),
    ...style
  });
}
function mono2(text10, spec, style = {}) {
  return TextBlock(String(text10 || ""), {
    color: style.color || "#3A2516",
    fontSize: 11,
    lineHeight: 1.25,
    letterSpacing: 0.4,
    ...role17("metric", spec, { fontWeight: 600, fontSize: 11, lineHeight: 1.25, letterSpacing: 0.4 }),
    ...style
  });
}
function page7(theme8, children) {
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      backgroundColor: theme8.paper,
      color: theme8.ink,
      overflow: "hidden"
    },
    [
      box({
        position: "absolute",
        left: 0,
        top: 0,
        width: 960,
        height: 540,
        opacity: 0.12,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(58,37,22,0.55) 1px, transparent 1.6px)",
        backgroundSize: "4px 4px"
      }),
      ...children
    ]
  );
}
function pageNum2(spec, theme8, variant) {
  return mono2(`${String(PAGE_VARIANTS18.indexOf(variant) + 1).padStart(2, "0")} / 08`, spec, {
    position: "absolute",
    right: 34,
    bottom: 24,
    width: 70,
    textAlign: "right",
    color: theme8.ink,
    fontSize: 11,
    letterSpacing: 0.8
  });
}
function petalCluster(theme8, { left, top, width, palette: palette2 = ["red", "orange", "blue", "green", "yellow"] }) {
  const circles = [
    [0, 0.28, 0.5],
    [0.14, 0.5, 0.38],
    [0.28, 0, 0.44],
    [0.5, 0.22, 0.5],
    [0.36, 0.5, 0.32]
  ];
  return box(
    { position: "absolute", left, top, width, height: Math.round(width * 0.78) },
    circles.map(
      ([x, y, size], index) => box({
        position: "absolute",
        left: Math.round(width * x),
        top: Math.round(width * 0.78 * y),
        width: Math.round(width * size),
        height: Math.round(width * size),
        borderRadius: 999,
        backgroundColor: colorByTone(theme8, palette2[index])
      })
    )
  );
}
function ribbonStack(theme8, { left, right, top, width = 620, angle = -22, reverse = false }) {
  const tones = reverse ? ["blue", "green", "yellow", "orange", "pink"] : ["pink", "orange", "yellow", "green", "blue"];
  return box(
    positioned({ position: "absolute", width, height: 250, overflow: "hidden" }, { left, right, top }),
    tones.map(
      (tone2, index) => box({
        position: "absolute",
        left: reverse ? -120 : -80,
        top: 24 + index * 34,
        width: width + 230,
        height: index === 0 || index === 4 ? 42 : 38,
        backgroundColor: colorByTone(theme8, tone2),
        transform: `rotate(${angle}deg)`,
        transformOrigin: reverse ? "100% 50%" : "0 50%"
      })
    )
  );
}
function checkbox(theme8, spec, labelText4, top, checked) {
  return box(
    { position: "absolute", right: 70, top, width: 130, height: 24, flexDirection: "row", alignItems: "center" },
    [
      box({
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: theme8.ink,
        backgroundColor: checked ? theme8.ink : "transparent",
        marginRight: 10
      }),
      label14(labelText4, spec, { fontSize: 14, letterSpacing: 0.8 })
    ]
  );
}
function cover(spec, theme8) {
  const c = variantContent(spec, "cover");
  return page7(theme8, [
    petalCluster(theme8, { left: 58, top: 42, width: 210 }),
    display7(value12(spec, "brand", c.brand).toLowerCase(), spec, {
      position: "absolute",
      left: 258,
      top: 78,
      width: 150,
      fontSize: 36,
      lineHeight: 0.88,
      whiteSpace: "pre-wrap"
    }),
    body14(value12(spec, "edition", c.edition), spec, {
      position: "absolute",
      left: 258,
      top: 146,
      width: 220,
      fontSize: 13,
      fontWeight: 650,
      letterSpacing: 0.8
    }),
    ribbonStack(theme8, { right: -35, top: 154, width: 560, angle: -22 }),
    display7(value12(spec, "title", c.title), spec, {
      position: "absolute",
      left: 60,
      top: 220,
      width: 270,
      fontSize: 124,
      lineHeight: 0.84,
      letterSpacing: -2
    }),
    display7(value12(spec, "subtitle", c.subtitle), spec, {
      position: "absolute",
      left: 60,
      bottom: 116,
      width: 360,
      backgroundColor: theme8.pink,
      color: theme8.paper,
      fontSize: 40,
      lineHeight: 0.95,
      padding: "8px 18px 10px"
    }),
    checkbox(theme8, spec, "COLOR", 246, true),
    checkbox(theme8, spec, "LO-FI", 296, true),
    checkbox(theme8, spec, "STEREO", 346, false),
    checkbox(theme8, spec, "LP", 396, false),
    box({ position: "absolute", left: 60, right: 60, bottom: 78, height: 1.5, backgroundColor: theme8.ink }),
    body14(value12(spec, "footer_left", c.footer_left), spec, { position: "absolute", left: 60, bottom: 42, width: 300, fontSize: 12, fontWeight: 650 }),
    label14(value12(spec, "footer_status", c.footer_status), spec, { position: "absolute", left: 390, bottom: 44, width: 220, fontSize: 12, letterSpacing: 1 }),
    rosette(theme8, spec, value12(spec, "seal", c.seal), { right: 170, bottom: 24, size: 70 }),
    stamp(theme8, spec, value12(spec, "stamp", c.stamp), { right: 30, bottom: 34, label: value12(spec, "stamp_label", c.stamp_label) }),
    pageNum2(spec, theme8, "cover")
  ]);
}
function rosette(theme8, spec, text10, { left, right, top, bottom, size = 84 }) {
  return box(
    positioned({
      position: "absolute",
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: theme8.ink,
      alignItems: "center",
      justifyContent: "center",
      transform: "rotate(12deg)"
    }, { left, right, top, bottom }),
    [
      display7(text10, spec, {
        color: theme8.paper,
        width: size - 18,
        textAlign: "center",
        fontSize: size > 90 ? 34 : 24,
        lineHeight: 0.9,
        whiteSpace: "pre-wrap"
      })
    ]
  );
}
function stamp(theme8, spec, text10, { left, right, top, bottom, label: labelText4 }) {
  const children = [];
  if (labelText4) children.push(label14(labelText4, spec, { color: theme8.paper, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 }));
  children.push(display7(text10, spec, { color: theme8.paper, fontSize: 20, lineHeight: 0.95 }));
  return box(
    positioned({
      position: "absolute",
      backgroundColor: theme8.red,
      padding: "8px 14px",
      transform: "rotate(-3deg)"
    }, { left, right, top, bottom }),
    children
  );
}
function manifesto(spec, theme8) {
  const c = variantContent(spec, "manifesto");
  return page7(theme8, [
    label14(value12(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", top: 44, left: 250, width: 460, textAlign: "center", letterSpacing: 2.4 }),
    ...[
      [58, 46, 100, "red"],
      [150, 120, 72, "orange"],
      [72, 410, 72, "yellow"],
      [744, 390, 86, "green"],
      [770, 78, 78, "blue"],
      [850, 158, 66, "pink"]
    ].map(([left, top, size, tone2]) => box({ position: "absolute", left, top, width: size, height: size, borderRadius: 999, backgroundColor: colorByTone(theme8, tone2) })),
    display7(value12(spec, "title", c.title), spec, {
      position: "absolute",
      left: 122,
      top: 150,
      width: 716,
      textAlign: "center",
      fontSize: 72,
      lineHeight: 0.88,
      letterSpacing: -1.4
    }),
    pageNum2(spec, theme8, "manifesto")
  ]);
}
function catalogueCard(theme8, spec, card2, index) {
  const x = 62 + index * 212;
  return box(
    { position: "absolute", left: x, top: 154, width: 190, height: 324, borderWidth: 1.5, borderColor: theme8.ink, backgroundColor: theme8.paper, overflow: "hidden", flexDirection: "column" },
    [
      box({ height: 22, backgroundColor: colorByTone(theme8, card2.tone) }),
      display7(card2.name, spec, { margin: "16px 14px 0", width: 156, fontSize: 29, lineHeight: 0.92, whiteSpace: "pre-wrap" }),
      body14(card2.body, spec, { margin: "10px 14px 0", width: 156, fontSize: 11, lineHeight: 1.28 }),
      body14(card2.extra, spec, { margin: "8px 14px 0", paddingTop: 8, borderTopWidth: 1, borderTopColor: theme8.ink, width: 156, fontSize: 9, lineHeight: 1.22 }),
      box({ position: "absolute", left: 14, right: 14, bottom: 12, borderTopWidth: 1, borderTopColor: theme8.ink, paddingTop: 8, flexDirection: "column" }, card2.specs.slice(0, 5).map(
        (row) => mono2(row, spec, { fontSize: 7.4, lineHeight: 1.15, marginBottom: 2 })
      ))
    ]
  );
}
function catalogue(spec, theme8) {
  const c = variantContent(spec, "catalogue");
  const cards = array14(spec, "cards", c.cards);
  return page7(theme8, [
    box({ position: "absolute", left: 60, right: 60, top: 54, height: 84, borderBottomWidth: 1.5, borderBottomColor: theme8.ink }, [
      display7(value12(spec, "title", c.title), spec, { position: "absolute", left: 0, top: 0, width: 500, fontSize: 58, lineHeight: 0.9 }),
      label14(value12(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", right: 0, bottom: 18, width: 260, textAlign: "right", letterSpacing: 1.7 })
    ]),
    ...cards.slice(0, 4).map((card2, index) => catalogueCard(theme8, spec, card2, index)),
    pageNum2(spec, theme8, "catalogue")
  ]);
}
function stripe(spec, theme8) {
  const c = variantContent(spec, "stripe");
  return page7(theme8, [
    ribbonStack(theme8, { left: -120, top: 64, width: 1180, angle: -22 }),
    box(
      {
        position: "absolute",
        left: 78,
        top: 176,
        width: 750,
        backgroundColor: theme8.paper,
        borderWidth: 1.5,
        borderColor: theme8.ink,
        padding: "22px 34px 26px",
        boxShadow: `8px 8px 0 ${theme8.ink}`,
        flexDirection: "column"
      },
      [
        label14(value12(spec, "eyebrow", c.eyebrow), spec, { marginBottom: 18, letterSpacing: 1.8 }),
        display7(value12(spec, "title", c.title), spec, { width: 680, fontSize: 52, lineHeight: 0.94 })
      ]
    ),
    box({ position: "absolute", left: 78, top: 414, backgroundColor: theme8.ink, padding: "9px 16px" }, [
      mono2(value12(spec, "author", c.author), spec, { color: theme8.paper, fontSize: 12, letterSpacing: 0.8 })
    ]),
    pageNum2(spec, theme8, "stripe")
  ]);
}
function dataBars(theme8, spec, bars, labels) {
  const tones = ["blue", "green", "yellow", "orange", "orange", "pink", "pink", "red"];
  return box(
    { position: "absolute", right: 60, top: 162, width: 560, height: 300, borderWidth: 1.5, borderColor: theme8.ink, padding: "24px 24px 18px" },
    [
      box({ flexDirection: "row", height: 210, alignItems: "flex-end" }, bars.map(
        (height, index) => box(
          { width: 52, height: 210, marginRight: index === bars.length - 1 ? 0 : 12, flexDirection: "column-reverse" },
          Array.from(
            { length: 6 },
            (_, segmentIndex) => box({
              height: 28,
              marginTop: 5,
              borderWidth: 1,
              borderColor: segmentIndex < height ? colorByTone(theme8, tones[index]) : "rgba(58,37,22,0.22)",
              backgroundColor: segmentIndex < height ? colorByTone(theme8, tones[index]) : "rgba(58,37,22,0.10)"
            })
          )
        )
      )),
      box({ height: 1, backgroundColor: theme8.ink, marginTop: 12, marginBottom: 8 }),
      box({ flexDirection: "row" }, labels.map(
        (item, index) => mono2(item, spec, { width: 52, marginRight: index === labels.length - 1 ? 0 : 12, textAlign: "center", fontSize: 9 })
      ))
    ]
  );
}
function data(spec, theme8) {
  const c = variantContent(spec, "data");
  const metrics = array14(spec, "metrics", c.metrics);
  const bars = array14(spec, "bars", c.bars);
  const labels = array14(spec, "labels", c.labels);
  return page7(theme8, [
    box({ position: "absolute", left: 60, right: 60, top: 54, height: 84, borderBottomWidth: 1.5, borderBottomColor: theme8.ink }, [
      display7(value12(spec, "title", c.title), spec, { position: "absolute", left: 0, top: 0, width: 420, fontSize: 54, lineHeight: 0.9 }),
      label14(value12(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", right: 0, bottom: 18, width: 320, textAlign: "right" })
    ]),
    ...metrics.slice(0, 2).map(
      (metric19, index) => box({ position: "absolute", left: 60, top: index === 0 ? 176 : 336, width: 245, flexDirection: "column" }, [
        box({ flexDirection: "row", alignItems: "flex-end", height: index === 0 ? 90 : 68 }, [
          display7(metric19.value, spec, { color: colorByTone(theme8, metric19.tone), fontSize: index === 0 ? 112 : 78, lineHeight: 0.82, width: index === 0 ? 128 : 100 }),
          display7(metric19.suffix, spec, { color: theme8.ink, fontSize: index === 0 ? 38 : 32, lineHeight: 0.9, width: 46, marginBottom: index === 0 ? 14 : 8 })
        ]),
        label14(metric19.label, spec, { marginTop: 8, fontSize: 12, letterSpacing: 1.2 }),
        body14(metric19.body, spec, { marginTop: 6, fontSize: 12, lineHeight: 1.35, width: 230 })
      ])
    ),
    dataBars(theme8, spec, bars, labels),
    pageNum2(spec, theme8, "data")
  ]);
}
function quote(spec, theme8) {
  const c = variantContent(spec, "quote");
  return page7(theme8, [
    petalCluster(theme8, { left: 620, top: 52, width: 250, palette: ["pink", "orange", "yellow", "blue", "green"] }),
    box({ position: "absolute", left: 68, right: 70, bottom: 100 }, [
      label14(value12(spec, "eyebrow", c.eyebrow), spec, { color: theme8.red, marginBottom: 20, letterSpacing: 2 }),
      display7(value12(spec, "quote", c.quote), spec, { width: 760, fontSize: 62, lineHeight: 0.9, letterSpacing: -1.1 }),
      box({ width: 760, height: 1.5, backgroundColor: theme8.ink, marginTop: 24, marginBottom: 14 }),
      box({ flexDirection: "row", alignItems: "center" }, [
        label14(value12(spec, "author", c.author), spec, { width: 180, letterSpacing: 1.6 }),
        mono2(value12(spec, "meta", c.meta), spec, { width: 440, opacity: 0.78, fontSize: 12 })
      ])
    ]),
    pageNum2(spec, theme8, "quote")
  ]);
}
function cal(spec, theme8) {
  const c = variantContent(spec, "cal");
  const rows = array14(spec, "rows", c.rows);
  return page7(theme8, [
    box({ position: "absolute", left: 60, right: 60, top: 54, height: 78, borderBottomWidth: 1.5, borderBottomColor: theme8.ink }, [
      display7(value12(spec, "title", c.title), spec, { position: "absolute", left: 0, top: 0, width: 450, fontSize: 54, lineHeight: 0.9 }),
      label14(value12(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", right: 0, bottom: 18, width: 250, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 60, top: 152, width: 840, flexDirection: "column" }, [
      ledgerRow2(theme8, spec, ["Date", "Title", "Edition", "Track", "N.R."], true),
      ...rows.slice(0, 7).map((row) => ledgerRow2(theme8, spec, row, false))
    ]),
    pageNum2(spec, theme8, "cal")
  ]);
}
function ledgerRow2(theme8, spec, row, head = false) {
  const [date, title2, edition, track, tone2, on] = row;
  return box(
    {
      width: 840,
      height: head ? 34 : 45,
      borderBottomWidth: head ? 1.5 : 1,
      borderBottomColor: head ? theme8.ink : "rgba(58,37,22,0.24)",
      flexDirection: "row",
      alignItems: "center"
    },
    [
      (head ? label14 : mono2)(date, spec, { width: 86, fontSize: head ? 10 : 12 }),
      (head ? label14 : display7)(title2, spec, { width: 312, fontSize: head ? 10 : 21, lineHeight: 1.05 }),
      (head ? label14 : body14)(edition, spec, { width: 214, fontSize: head ? 10 : 12, lineHeight: 1.2 }),
      head ? label14(track, spec, { width: 108, fontSize: 10 }) : box({ width: 108 }, [box({ backgroundColor: colorByTone(theme8, tone2), padding: "4px 10px", alignSelf: "flex-start" }, [mono2(track, spec, { color: theme8.paper, fontSize: 10, lineHeight: 1 })])]),
      head ? label14(tone2, spec, { width: 80, textAlign: "right", fontSize: 10 }) : box({ width: 80, flexDirection: "row", justifyContent: "flex-end" }, [
        box({ width: 12, height: 12, borderWidth: 1.5, borderColor: theme8.ink, backgroundColor: on ? theme8.ink : theme8.paper, marginRight: 6 }),
        box({ width: 12, height: 12, borderWidth: 1.5, borderColor: theme8.ink, backgroundColor: on ? theme8.paper : theme8.ink })
      ])
    ]
  );
}
function colophon(spec, theme8) {
  const c = variantContent(spec, "colophon");
  const footer4 = array14(spec, "footer", c.footer);
  return page7(theme8, [
    ribbonStack(theme8, { left: -80, top: 150, width: 560, angle: 22, reverse: true }),
    petalCluster(theme8, { left: 760, top: 356, width: 148, palette: ["red", "orange", "green", "blue", "yellow"] }),
    rosette(theme8, spec, value12(spec, "seal", c.seal), { right: 78, top: 54, size: 98 }),
    stamp(theme8, spec, value12(spec, "stamp", c.stamp), { right: 76, top: 168 }),
    label14(value12(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 62, top: 70, width: 360, letterSpacing: 2 }),
    display7(value12(spec, "title", c.title), spec, { position: "absolute", left: 62, top: 110, width: 650, fontSize: 66, lineHeight: 0.88, letterSpacing: -1.4 }),
    box({ position: "absolute", left: 62, bottom: 94, width: 650, flexDirection: "row" }, footer4.slice(0, 3).map(
      (item, index) => box({ width: index === 2 ? 230 : 180, marginRight: index === 2 ? 0 : 28, borderTopWidth: 1.5, borderTopColor: theme8.ink, paddingTop: 12, flexDirection: "column" }, [
        label14(item.label, spec, { fontSize: 10, letterSpacing: 1.6, marginBottom: 7 }),
        body14(item.body, spec, { fontSize: 12, lineHeight: 1.35, whiteSpace: "pre-wrap" })
      ])
    )),
    pageNum2(spec, theme8, "colophon")
  ]);
}
var RENDERERS13 = {
  cover,
  manifesto,
  catalogue,
  stripe,
  data,
  quote,
  cal,
  colophon
};
function renderProductRibbon(spec) {
  const theme8 = colors16(spec);
  const variant = normalizeVariant18(spec);
  return (RENDERERS13[variant] || manifesto)(spec, theme8);
}

// templates/beautiful/brutalist-matrix.mjs
var templateId20 = "brutalist-matrix";
var CANVAS12 = { width: 960, height: 540 };
var PAGE_VARIANTS19 = ["cover", "split", "bars", "cards", "feature", "process", "donut", "quote", "table", "closing"];
var rendererContract20 = {
  template_id: templateId20,
  renderer_id: `artboard_satori.${templateId20}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "raw-grid",
  implemented_page_variants: PAGE_VARIANTS19,
  page_family: {
    family_id: "raw-grid",
    supported_page_variants: PAGE_VARIANTS19,
    variant_usage_policy: {
      singletons: ["cover", "split", "cards", "feature", "quote", "table", "closing"],
      repeatable: ["bars", "process", "donut"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/raw-grid-1.png"
};
var DEFAULTS18 = {
  cover: {
    mark: "RG",
    brand: "RAW GRID",
    title: "Cities.\nStartups.",
    cta: "Discover All Startups",
    cities: ["San Francisco", "New York", "Cupertino", "Menlo Park", "Santa Clara", "Mountain View", "Sunnyvale"]
  },
  split: {
    eyebrow: "About The Platform",
    title: "Connecting Founders\nWith Opportunity",
    body: "A centralized ecosystem designed to bridge emerging ventures and the resources they need to scale across global markets.",
    stats: [
      { value: "250+", label: "Active Startups", body: "Ventures currently enrolled and scaling through our network." },
      { value: "14", label: "Cities Covered", body: "Metropolitan tech hubs across North America and Europe." }
    ]
  },
  bars: {
    title: "Quarterly Growth Metrics",
    label: "Fiscal Year 2026",
    chart_title: "Revenue by Quarter ($M)",
    bars: [
      { label: "Q1", value: "$4.5M", width: 45, fill: "pink" },
      { label: "Q2", value: "$6.2M", width: 62, fill: "green" },
      { label: "Q3", value: "$7.8M", width: 78, fill: "black" },
      { label: "Q4", value: "$9.1M", width: 91, fill: "pink" }
    ],
    stats: [
      { value: "+47%", label: "Year over Year Growth" },
      { value: "$27.6M", label: "Total Annual Revenue", fill: "green" },
      { value: "12.4K", label: "New User Signups", fill: "pink" }
    ]
  },
  cards: {
    title: "Core Services",
    label: "What We Provide",
    cards: [
      { num: "01", icon: "I", title: "Venture Funding", body: "Direct access to seed and series funding through our curated investor network." },
      { num: "02", icon: "II", title: "Mentorship", body: "One-on-one guidance from industry veterans who have built and exited companies.", fill: "green" },
      { num: "03", icon: "III", title: "Workspace", body: "Flexible office arrangements in prime locations across all partner cities.", fill: "pink" },
      { num: "04", icon: "IV", title: "Community", body: "A tight-knit network of founders sharing resources, referrals, and support.", fill: "gray" }
    ]
  },
  feature: {
    badge: "Featured",
    title: "The Founders Lab",
    body: "An intensive twelve-week program designed to transform early-stage concepts into market-ready products with validated traction.",
    note: "Cohorts launch every quarter with workspace, engineering support, and an investor demo-day pipeline.",
    image_label: "[ Image Placeholder ]"
  },
  process: {
    title: "Application Process",
    steps: [
      { num: "01", title: "Submit", body: "Complete the online application with your pitch deck and team overview." },
      { num: "02", title: "Review", body: "Our committee evaluates fit, market potential, and team capability." },
      { num: "03", title: "Interview", body: "Shortlisted teams present to partners and alumni founders.", fill: "green" },
      { num: "04", title: "Onboard", body: "Accepted ventures join the next cohort with full resource access.", fill: "pink" }
    ]
  },
  donut: {
    value: "63%",
    label: "Market Share",
    legends: ["Enterprise", "Consumer", "Non-Profit"],
    metrics: [
      { value: "89%", title: "Retention Rate", body: "Founders who renew after year one" },
      { value: "3.2x", title: "Average ROI", body: "Return on capital invested", fill: "green" },
      { value: "156", title: "Jobs Created", body: "Net new positions this quarter" },
      { value: "$42M", title: "Capital Deployed", body: "Total funding distributed to date", fill: "pink" }
    ]
  },
  quote: {
    title: "Founder Credo",
    quote: "We don't incubate ideas. We accelerate the people bold enough to build them.",
    stats: [
      { value: "98%", label: "Satisfaction" },
      { value: "4.9", label: "Avg Rating", fill: "pink" },
      { value: "500+", label: "Alumni", fill: "gray" },
      { value: "$1B+", label: "Valuation", fill: "black" }
    ]
  },
  table: {
    title: "Plan Comparison",
    label: "Pricing Tiers",
    headers: ["Feature", "Starter", "Professional", "Enterprise"],
    rows: [
      ["Workspace Access", "Shared Desk", "Dedicated Desk", "Private Office"],
      ["Mentor Hours", "2 / Month", "8 / Month", "Unlimited"],
      ["Investor Intros", "Quarterly", "Monthly", "Weekly"],
      ["Legal Support", "Templates", "Guided", "Full Service"],
      ["Event Access", "Online", "In-Person", "VIP"],
      ["Response", "48 Hours", "24 Hours", "4 Hours"]
    ]
  },
  closing: {
    title: "Let's\nBuild.",
    body: "Ready to take your venture to the next level? Join the Raw Grid community and start scaling today.",
    cta: "Get Started Now",
    contact_title: "Get In Touch",
    contacts: ["Email: hello@rawgrid.studio", "Phone: +1 (555) 000-0000", "Location: 123 Innovation Drive", "Hours: Monday - Friday, 9:00 - 18:00"],
    socials: ["Instagram", "LinkedIn"]
  }
};
function theme2() {
  return {
    black: "#0A0A0A",
    white: "#FFFFFF",
    pink: "#F2D4CF",
    green: "#E5EDD6",
    gray: "#F5F5F5",
    darkgray: "#333333"
  };
}
function content8(spec, variant) {
  return { ...DEFAULTS18[variant] || DEFAULTS18.cover, ...spec.content || {} };
}
function normalizeVariant19(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS19.length) return PAGE_VARIANTS19[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS19) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda") || raw.includes("card")) return "cards";
  if (raw.includes("bar") || raw.includes("chart") || raw.includes("data")) return "bars";
  if (raw.includes("feature") || raw.includes("detail")) return "feature";
  if (raw.includes("process") || raw.includes("timeline")) return "process";
  if (raw.includes("donut") || raw.includes("metric")) return "donut";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("table") || raw.includes("comparison")) return "table";
  if (raw.includes("closing") || raw.includes("close") || raw.includes("cta")) return "closing";
  if (raw.includes("split") || raw.includes("about")) return "split";
  return "cover";
}
function fillColor(fill2) {
  const t = theme2();
  if (fill2 === "pink") return t.pink;
  if (fill2 === "green") return t.green;
  if (fill2 === "gray") return t.gray;
  if (fill2 === "black") return t.black;
  return t.white;
}
function role18(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function display8(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    color: theme2().black,
    fontSize: 54,
    fontWeight: 900,
    lineHeight: 1.04,
    letterSpacing: -0.8,
    whiteSpace: "pre-line",
    ...role18("display", spec, { fontWeight: 900, lineHeight: 1.04, letterSpacing: -0.8, textTransform: "uppercase" }),
    ...style
  });
}
function headline6(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    color: theme2().black,
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: -0.4,
    whiteSpace: "pre-line",
    ...role18("display", spec, { fontWeight: 900, lineHeight: 1.08, letterSpacing: -0.4, textTransform: "uppercase" }),
    ...style
  });
}
function metric7(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: theme2().black,
    fontSize: 58,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -1.2,
    ...role18("metric", spec, { fontWeight: 900, lineHeight: 1, letterSpacing: -1.2 }),
    ...style
  });
}
function body15(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: theme2().black,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.45,
    ...role18("body", spec, { fontWeight: 500, lineHeight: 1.45 }),
    ...style
  });
}
function caption2(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: theme2().black,
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: 1,
    textTransform: "uppercase",
    ...role18("label", spec, { fontWeight: 800, lineHeight: 1.1, letterSpacing: 1, textTransform: "uppercase" }),
    ...style
  });
}
function label15(value15, spec, style = {}) {
  return TextBlock(`-> ${String(value15 || "").toUpperCase()}`, {
    color: theme2().black,
    backgroundColor: theme2().white,
    borderWidth: 3,
    borderColor: theme2().black,
    padding: "6px 12px",
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    ...role18("label", spec, { fontWeight: 800, lineHeight: 1, letterSpacing: 0.9, textTransform: "uppercase" }),
    ...style
  });
}
function surface(children = []) {
  return box(
    { width: CANVAS12.width, height: CANVAS12.height, position: "relative", overflow: "hidden", backgroundColor: theme2().white, color: theme2().black },
    children
  );
}
function borderBox(style = {}, children = []) {
  return box({ borderWidth: 3, borderColor: theme2().black, backgroundColor: theme2().white, ...style }, children);
}
function renderCover15(spec) {
  const t = theme2();
  const c = content8(spec, "cover");
  const cities = Array.isArray(c.cities) ? c.cities.slice(0, 7) : DEFAULTS18.cover.cities;
  return surface([
    box({ position: "absolute", left: 0, top: 0, width: 480, height: 540, backgroundColor: t.pink, borderRightWidth: 3, borderColor: t.black, padding: 48, flexDirection: "column", justifyContent: "space-between" }, [
      box({ flexDirection: "row", alignItems: "center", gap: 12 }, [
        borderBox({ width: 48, height: 48, alignItems: "center", justifyContent: "center" }, [
          caption2(c.mark || "RG", spec, { fontSize: 16, letterSpacing: 0, lineHeight: 1 })
        ]),
        caption2(c.brand || "RAW GRID", spec, { fontSize: 18, letterSpacing: -0.2 })
      ]),
      display8(c.title, spec, { fontSize: 58, width: 365, lineHeight: 1.02 }),
      label15(c.cta, spec, { alignSelf: "flex-start" })
    ]),
    box({ position: "absolute", left: 480, top: 0, width: 480, height: 540, flexDirection: "column" }, cities.map(
      (item, idx) => box({ height: 77.2, borderBottomWidth: idx === cities.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: idx === 2 ? t.green : t.white, flexDirection: "row", alignItems: "center", paddingLeft: 46, gap: 12 }, [
        metric7("->", spec, { fontSize: 20, width: 30, letterSpacing: 0 }),
        caption2(item, spec, { fontSize: 21, letterSpacing: 0.4 })
      ])
    ))
  ]);
}
function renderSplit5(spec) {
  const t = theme2();
  const c = content8(spec, "split");
  const stats2 = Array.isArray(c.stats) ? c.stats.slice(0, 2) : DEFAULTS18.split.stats;
  return surface([
    box({ position: "absolute", left: 0, top: 0, width: 432, height: 540, borderRightWidth: 3, borderColor: t.black, padding: 58, flexDirection: "column", justifyContent: "center" }, [
      box({ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 38 }, [
        box({ width: 60, height: 4, backgroundColor: t.black }),
        caption2(c.eyebrow, spec)
      ]),
      headline6(c.title, spec, { fontSize: 43, width: 320, marginBottom: 24 }),
      body15(c.body, spec, { width: 330, fontSize: 15, lineHeight: 1.55 })
    ]),
    box({ position: "absolute", left: 432, top: 0, width: 528, height: 540, flexDirection: "column" }, stats2.map(
      (item, idx) => box({ flex: 1, borderBottomWidth: idx === 0 ? 3 : 0, borderColor: t.black, backgroundColor: idx === 1 ? t.green : t.white, padding: 58, justifyContent: "center", flexDirection: "column" }, [
        metric7(item.value, spec, { fontSize: 86, marginBottom: 12 }),
        caption2(item.label, spec, { fontSize: 18, letterSpacing: 0.8, marginBottom: 12 }),
        body15(item.body, spec, { width: 360, opacity: 0.72, fontSize: 14 })
      ])
    ))
  ]);
}
function renderBars4(spec) {
  const t = theme2();
  const c = content8(spec, "bars");
  const bars = Array.isArray(c.bars) ? c.bars.slice(0, 4) : DEFAULTS18.bars.bars;
  const stats2 = Array.isArray(c.stats) ? c.stats.slice(0, 3) : DEFAULTS18.bars.stats;
  return surface([
    box({ position: "absolute", left: 0, top: 0, right: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: "24px 54px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, [
      caption2(c.title, spec, { fontSize: 26, letterSpacing: 0.4 }),
      label15(c.label, spec, { padding: "7px 14px" })
    ]),
    box({ position: "absolute", left: 0, top: 86, width: 480, bottom: 0, borderRightWidth: 3, borderColor: t.black, padding: 48, flexDirection: "column", justifyContent: "center" }, [
      caption2(c.chart_title, spec, { fontSize: 18, marginBottom: 26 }),
      ...bars.map(
        (item) => box({ marginBottom: 18, flexDirection: "column" }, [
          caption2(item.label, spec, { fontSize: 10, marginBottom: 7 }),
          borderBox({ width: 360, height: 32, backgroundColor: t.white }, [
            box({ width: Math.max(28, Math.round((item.width || 0) * 3.6)), height: 26, backgroundColor: fillColor(item.fill), alignItems: "center", justifyContent: "center" }, [
              caption2(item.value, spec, { color: item.fill === "black" ? t.white : t.black, fontSize: 10, letterSpacing: 0 })
            ])
          ])
        ])
      )
    ]),
    box({ position: "absolute", left: 480, top: 86, right: 0, bottom: 0, padding: 48, flexDirection: "column", justifyContent: "center", gap: 28 }, stats2.map(
      (item) => borderBox({ height: 108, backgroundColor: fillColor(item.fill), padding: 22, flexDirection: "column", justifyContent: "center" }, [
        metric7(item.value, spec, { fontSize: 48, color: item.fill === "black" ? t.white : t.black, marginBottom: 8 }),
        caption2(item.label, spec, { color: item.fill === "black" ? t.white : t.black, fontSize: 11 })
      ])
    ))
  ]);
}
function renderCards5(spec) {
  const t = theme2();
  const c = content8(spec, "cards");
  const cards = Array.isArray(c.cards) ? c.cards.slice(0, 4) : DEFAULTS18.cards.cards;
  return surface([
    box({ position: "absolute", left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: "24px 54px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, [
      caption2(c.title, spec, { fontSize: 26 }),
      caption2(c.label, spec)
    ]),
    box({ position: "absolute", left: 0, top: 86, right: 0, bottom: 0, flexDirection: "row", flexWrap: "wrap" }, cards.map(
      (card2, idx) => box({ width: 480, height: 227, borderRightWidth: idx % 2 === 0 ? 3 : 0, borderBottomWidth: idx < 2 ? 3 : 0, borderColor: t.black, backgroundColor: fillColor(card2.fill), padding: 46, flexDirection: "column", justifyContent: "space-between" }, [
        box({ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, [
          metric7(card2.num, spec, { opacity: 0.35, fontSize: 62 }),
          borderBox({ width: 48, height: 48, alignItems: "center", justifyContent: "center" }, [
            caption2(card2.icon, spec, { fontSize: 16, letterSpacing: 0 })
          ])
        ]),
        box({ flexDirection: "column" }, [
          caption2(card2.title, spec, { fontSize: 18, marginBottom: 10 }),
          body15(card2.body, spec, { fontSize: 14, lineHeight: 1.45, width: 350 })
        ])
      ])
    ))
  ]);
}
function renderFeature2(spec) {
  const t = theme2();
  const c = content8(spec, "feature");
  return surface([
    box({ position: "absolute", left: 0, top: 0, width: 528, height: 540, backgroundColor: t.black, alignItems: "center", justifyContent: "center" }, [
      borderBox({ width: 384, height: 300, borderColor: t.white, backgroundColor: t.black, alignItems: "center", justifyContent: "center" }, [
        caption2(c.image_label, spec, { color: t.white, fontSize: 13, letterSpacing: 1.2, opacity: 0.7 })
      ])
    ]),
    box({ position: "absolute", left: 528, top: 0, width: 432, height: 540, padding: 58, flexDirection: "column", justifyContent: "center" }, [
      label15(c.badge, spec, { alignSelf: "flex-start", marginBottom: 34 }),
      headline6(c.title, spec, { fontSize: 43, marginBottom: 22 }),
      body15(c.body, spec, { fontSize: 15, lineHeight: 1.5, marginBottom: 20 }),
      body15(c.note, spec, { fontSize: 14, lineHeight: 1.45, opacity: 0.72, marginBottom: 30 }),
      box({ width: 60, height: 4, backgroundColor: t.black })
    ])
  ]);
}
function renderProcess5(spec) {
  const t = theme2();
  const c = content8(spec, "process");
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 4) : DEFAULTS18.process.steps;
  return surface([
    box({ position: "absolute", left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: "24px 54px", justifyContent: "center" }, [
      caption2(c.title, spec, { fontSize: 26 })
    ]),
    box({ position: "absolute", left: 54, right: 54, top: 86, bottom: 0, flexDirection: "row" }, steps.map(
      (step, idx) => box({ flex: 1, borderLeftWidth: idx === 0 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(step.fill), padding: "54px 28px", flexDirection: "column", position: "relative" }, [
        metric7(step.num, spec, { fontSize: 74, opacity: 0.22, marginBottom: 32 }),
        idx < steps.length - 1 ? box({ position: "absolute", right: -18, top: 58, width: 32, height: 32, borderWidth: 3, borderColor: t.black, backgroundColor: t.black, alignItems: "center", justifyContent: "center", zIndex: 5 }, [
          caption2("->", spec, { color: t.white, letterSpacing: 0 })
        ]) : null,
        caption2(step.title, spec, { fontSize: 18, marginBottom: 12 }),
        body15(step.body, spec, { fontSize: 13, lineHeight: 1.42 })
      ].filter(Boolean))
    ))
  ]);
}
function renderDonut2(spec) {
  const t = theme2();
  const c = content8(spec, "donut");
  const metrics = Array.isArray(c.metrics) ? c.metrics.slice(0, 4) : DEFAULTS18.donut.metrics;
  return surface([
    box({ position: "absolute", left: 0, top: 0, width: 480, height: 540, borderRightWidth: 3, borderColor: t.black, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
      box({ width: 246, height: 246, borderRadius: 123, borderWidth: 26, borderColor: t.black, alignItems: "center", justifyContent: "center", marginBottom: 34 }, [
        box({ width: 142, height: 142, borderRadius: 71, backgroundColor: t.white, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
          metric7(c.value, spec, { fontSize: 48, textAlign: "center" }),
          caption2(c.label, spec, { textAlign: "center", fontSize: 10 })
        ])
      ]),
      box({ flexDirection: "row", gap: 20 }, (c.legends || DEFAULTS18.donut.legends).map(
        (item, idx) => box({ flexDirection: "row", alignItems: "center", gap: 8 }, [
          box({ width: 16, height: 16, borderWidth: 3, borderColor: t.black, backgroundColor: [t.black, t.pink, t.green][idx] }),
          caption2(item, spec, { fontSize: 10 })
        ])
      ))
    ]),
    box({ position: "absolute", left: 480, top: 0, right: 0, bottom: 0, flexDirection: "column" }, metrics.map(
      (item, idx) => box({ flex: 1, borderBottomWidth: idx === metrics.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(item.fill), flexDirection: "row", alignItems: "center", padding: "0 54px" }, [
        metric7(item.value, spec, { fontSize: 50, width: 126 }),
        box({ marginLeft: 20, flexDirection: "column" }, [
          caption2(item.title, spec, { fontSize: 17, marginBottom: 5 }),
          caption2(item.body, spec, { fontSize: 10, opacity: 0.8 })
        ])
      ])
    ))
  ]);
}
function renderQuote15(spec) {
  const t = theme2();
  const c = content8(spec, "quote");
  const stats2 = Array.isArray(c.stats) ? c.stats.slice(0, 4) : DEFAULTS18.quote.stats;
  const quoteText = c.quote || c.title;
  return surface([
    box({ position: "absolute", left: 0, top: 0, right: 0, height: 400, backgroundColor: t.green, borderBottomWidth: 3, borderColor: t.black, padding: 58, justifyContent: "center" }, [
      metric7('"', spec, { position: "absolute", left: 58, top: 28, fontSize: 140, opacity: 0.16 }),
      headline6(quoteText, spec, { position: "relative", width: 790, fontSize: 46, lineHeight: 1.1, marginBottom: 26 }),
      box({ width: 60, height: 4, backgroundColor: t.black })
    ]),
    box({ position: "absolute", left: 0, right: 0, bottom: 0, height: 140, flexDirection: "row" }, stats2.map(
      (item, idx) => box({ flex: 1, borderRightWidth: idx === stats2.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(item.fill), alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
        metric7(item.value, spec, { color: item.fill === "black" ? t.white : t.black, fontSize: 34, marginBottom: 5 }),
        caption2(item.label, spec, { color: item.fill === "black" ? t.white : t.black, fontSize: 10 })
      ])
    ))
  ]);
}
function renderTable2(spec) {
  const t = theme2();
  const c = content8(spec, "table");
  const headers = Array.isArray(c.headers) ? c.headers.slice(0, 4) : DEFAULTS18.table.headers;
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 6) : DEFAULTS18.table.rows;
  const colW = [240, 190, 220, 190];
  return surface([
    box({ position: "absolute", left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: "24px 54px", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
      caption2(c.title, spec, { fontSize: 26 }),
      label15(c.label, spec)
    ]),
    box({ position: "absolute", left: 54, top: 130, width: 840, height: 334, flexDirection: "column" }, [
      box({ flexDirection: "row", height: 48 }, headers.map(
        (head, idx) => box({ width: colW[idx], borderWidth: 3, borderRightWidth: idx === headers.length - 1 ? 3 : 0, borderColor: t.black, backgroundColor: t.black, justifyContent: "center", paddingLeft: 12 }, [
          caption2(head, spec, { color: t.white, fontSize: 10 })
        ])
      )),
      ...rows.map(
        (row, ridx) => box({ flexDirection: "row", height: 47 }, row.slice(0, 4).map(
          (cell, cidx) => box({ width: colW[cidx], borderLeftWidth: 3, borderBottomWidth: 3, borderRightWidth: cidx === row.length - 1 ? 3 : 0, borderColor: t.black, backgroundColor: ridx % 2 === 1 ? t.gray : t.white, justifyContent: "center", paddingLeft: 12 }, [
            body15(cell, spec, { fontSize: 12, fontWeight: 700, lineHeight: 1.2 })
          ])
        ))
      )
    ])
  ]);
}
function renderClosing10(spec) {
  const t = theme2();
  const c = content8(spec, "closing");
  const contacts = Array.isArray(c.contacts) ? c.contacts.slice(0, 4) : DEFAULTS18.closing.contacts;
  const socials = Array.isArray(c.socials) ? c.socials.slice(0, 2) : DEFAULTS18.closing.socials;
  return surface([
    box({ position: "absolute", left: 0, top: 0, width: 480, height: 540, backgroundColor: t.pink, borderRightWidth: 3, borderColor: t.black, padding: 58, justifyContent: "center", flexDirection: "column" }, [
      display8(c.title, spec, { fontSize: 70, marginBottom: 24 }),
      body15(c.body, spec, { width: 370, fontSize: 15, lineHeight: 1.5, marginBottom: 32 }),
      label15(c.cta, spec, { alignSelf: "flex-start" })
    ]),
    box({ position: "absolute", left: 480, top: 0, width: 480, height: 440, borderBottomWidth: 3, borderColor: t.black, padding: 58, justifyContent: "center", flexDirection: "column" }, [
      caption2(c.contact_title, spec, { fontSize: 26, marginBottom: 22 }),
      ...contacts.map((item) => body15(item, spec, { fontSize: 14, fontWeight: 600, marginBottom: 8 }))
    ]),
    box({ position: "absolute", left: 480, right: 0, bottom: 0, height: 100, flexDirection: "row" }, socials.map(
      (item, idx) => box({ flex: 1, borderRightWidth: idx === 0 ? 3 : 0, borderColor: t.black, backgroundColor: idx === 0 ? t.green : t.black, alignItems: "center", justifyContent: "center" }, [
        caption2(item, spec, { color: idx === 0 ? t.black : t.white, fontSize: 13 })
      ])
    ))
  ]);
}
var RENDERERS14 = {
  cover: renderCover15,
  split: renderSplit5,
  bars: renderBars4,
  cards: renderCards5,
  feature: renderFeature2,
  process: renderProcess5,
  donut: renderDonut2,
  quote: renderQuote15,
  table: renderTable2,
  closing: renderClosing10
};
function renderBrutalistMatrix(spec) {
  const variant = normalizeVariant19(spec);
  return (RENDERERS14[variant] || renderCover15)(spec);
}

// templates/beautiful/type-mass-poster.mjs
var templateId21 = "type-mass-poster";
var PAGE_VARIANTS20 = [
  "cover",
  "chapter",
  "statement",
  "split",
  "stats",
  "list",
  "quote",
  "compare",
  "chapter-9",
  "statement-10",
  "chart",
  "end"
];
var rendererContract21 = {
  template_id: templateId21,
  renderer_id: `artboard_satori.${templateId21}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "studio",
  implemented_page_variants: PAGE_VARIANTS20,
  page_family: {
    family_id: "studio",
    supported_page_variants: PAGE_VARIANTS20,
    variant_usage_policy: {
      singletons: ["cover", "chapter", "chapter-9", "statement", "statement-10", "end"],
      repeatable: ["split", "stats", "list", "quote", "compare", "chart"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/studio-1.png"
};
var C2 = {
  dark: "#1C1C1C",
  darkAlt: "#242422",
  yellow: "#F5D200",
  yellowAlt: "#F0CC00",
  darkBorder: "#2E2E2C",
  lightBorder: "rgba(28,28,28,0.18)",
  yellowMuted: "rgba(245,210,0,0.58)",
  yellowHint: "rgba(245,210,0,0.32)",
  blackMuted: "rgba(28,28,28,0.62)",
  blackHint: "rgba(28,28,28,0.35)"
};
var DEFAULTS19 = {
  cover: {
    title: "PROPOSAL",
    image_label: "IMAGE PLACEHOLDER",
    footer_left: "[Studio Name] x [Client Name]\n[Date]",
    footer_center: "[Presentation Title]",
    footer_right: "[Studio Name]"
  },
  chapter: {
    label: "01 / WHO WE ARE",
    title: "WHO WE ARE",
    surface: "light"
  },
  statement: {
    title: "GREAT WORK DOESN'T HAPPEN BY ACCIDENT",
    surface: "dark"
  },
  split: {
    eyebrow: "Our Work",
    label: "APPROACH",
    title: "WE BUILD WHAT OTHERS PLAN",
    body: "Our studio pairs strategic thinking with craft-level execution. Every project begins with a question: what needs to be true for this to work?",
    bullets: ["Strategy before aesthetics", "Constraints as creative fuel", "Delivery on schedule, not on someday"],
    caption: "[Caption - project name, year]"
  },
  stats: {
    eyebrow: "By the Numbers",
    title: "THE STUDIO",
    stats: [
      ["12", "Years of practice", "[Studio Name] founded [Year]"],
      ["200+", "Projects delivered", "Across [N] industries"],
      ["3", "Continents active", "[City A], [City B], [City C]"]
    ]
  },
  list: {
    eyebrow: "Services",
    title: "WHAT WE OFFER",
    body: "A focused set of services built for ambitious creative and commercial challenges.",
    items: ["Brand strategy and identity systems", "Campaign and content direction", "Digital experience design and build", "Motion and video production", "Ongoing creative partnership and retainer"]
  },
  quote: {
    quote: "THEY DON'T JUST MAKE THINGS LOOK GOOD. THEY MAKE THINGS WORK.",
    name: "[CLIENT NAME]",
    role: "CMO - [Company] - [Year]"
  },
  compare: {
    eyebrow: "Before / After",
    left_label: "BEFORE",
    left_title: "GENERIC IDENTITY, FORGETTABLE CAMPAIGNS",
    left_body: "A brand built by committee, refined to inoffensiveness. Nothing wrong. Nothing memorable.",
    left_items: ["No clear point of view", "Inconsistent execution across touchpoints", "Campaigns that launched and disappeared"],
    right_label: "AFTER",
    right_title: "A DISTINCTIVE VOICE PEOPLE RECOGNIZE",
    right_body: "A brand with a defined perspective. Work that accumulates and builds memory.",
    right_items: ["Ownable visual and verbal territory", "System that scales without diluting", "Campaigns that created lasting recall"]
  },
  "chapter-9": {
    label: "02 / THE WORK",
    title: "THE WORK",
    surface: "dark"
  },
  "statement-10": {
    title: "BOLD IDEAS DESERVE BOLD EXECUTION",
    surface: "light"
  },
  chart: {
    eyebrow: "Project Output",
    title: "PROJECTS BY YEAR",
    caption: "Count - [Studio Name] Portfolio",
    labels: ["[Y-4]", "[Y-3]", "[Y-2]", "[Y-1]", "[Year]"],
    values: [14, 21, 28, 35, 47],
    source: "Source: [Studio Name] internal tracking - [Year]"
  },
  end: {
    title: "ANY QUESTIONS OR THOUGHTS?",
    contact_a: "Contact [Name A] via email on [name@studio.com]\nor via phone on [+00 000 000 000]",
    contact_b: "Contact [Name B] via email on [name@studio.com]\nor via phone on [+00 000 000 000]"
  }
};
function normalizeVariant20(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS20.length) return PAGE_VARIANTS20[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS20) {
    if (raw.includes(variant)) return variant;
  }
  if (raw.includes("end") || raw.includes("closing")) return "end";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("compare")) return "compare";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("list")) return "list";
  if (raw.includes("stats")) return "stats";
  if (raw.includes("split")) return "split";
  if (raw.includes("statement")) return "statement";
  if (raw.includes("chapter") || raw.includes("agenda")) return "chapter";
  return "cover";
}
function content9(spec, variant) {
  return { ...DEFAULTS19[variant] || DEFAULTS19.cover, ...spec.content || {} };
}
function arr(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function surfaceStyle(surface4) {
  const light = surface4 === "light";
  return {
    bg: light ? C2.yellow : C2.dark,
    fg: light ? C2.dark : C2.yellow,
    muted: light ? C2.blackMuted : C2.yellowMuted,
    hint: light ? C2.blackHint : C2.yellowHint,
    border: light ? C2.lightBorder : C2.darkBorder,
    image: light ? C2.yellowAlt : C2.darkAlt,
    light
  };
}
function display9(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    color: C2.yellow,
    fontSize: 90,
    lineHeight: 0.9,
    letterSpacing: -1,
    whiteSpace: "pre-wrap",
    ...fontRole("display", spec, { fontWeight: 900, lineHeight: 0.9, letterSpacing: -1 }),
    ...style
  });
}
function body16(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C2.yellowMuted,
    fontSize: 16,
    lineHeight: 1.45,
    ...fontRole("body", spec, { fontWeight: 500 }),
    ...style
  });
}
function label16(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: C2.yellowMuted,
    fontSize: 10,
    lineHeight: 1.2,
    letterSpacing: 1.2,
    ...fontRole("label", spec, { fontWeight: 500, letterSpacing: 1.2 }),
    ...style
  });
}
function metric8(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C2.yellow,
    fontSize: 64,
    lineHeight: 0.9,
    ...fontRole("metric", spec, { fontWeight: 900, lineHeight: 0.9 }),
    ...style
  });
}
function chrome4(spec, pageNo, title2, t) {
  return [
    box({ position: "absolute", left: 48, right: 48, top: 36, height: 31, borderBottom: `1px solid ${t.border}`, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, [
      label16(title2, spec, { color: t.muted, fontSize: 10 }),
      label16(`${String(pageNo).padStart(2, "0")} / 12`, spec, { color: t.muted, fontSize: 10, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 48, right: 48, bottom: 32, height: 31, borderTop: `1px solid ${t.border}`, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, [
      label16("[Studio Name] - [Date]", spec, { color: t.hint, fontSize: 10 }),
      label16(`${String(pageNo).padStart(2, "0")} / 12`, spec, { color: t.muted, fontSize: 10, textAlign: "right" })
    ])
  ];
}
function page8(spec, pageNo, surface4, title2, children) {
  const t = surfaceStyle(surface4);
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, color: t.fg, overflow: "hidden" }, [
    ...chrome4(spec, pageNo, title2, t),
    ...children
  ]);
}
function renderCover16(spec) {
  const d = content9(spec, "cover");
  const t = surfaceStyle("dark");
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, overflow: "hidden" }, [
    box({ position: "absolute", inset: 0, backgroundColor: t.image }),
    label16(d.image_label, spec, { position: "absolute", left: 390, top: 260, width: 180, textAlign: "center", color: t.hint, fontSize: 9 }),
    display9(d.title, spec, { position: "absolute", left: 50, top: 40, width: 780, color: t.fg, fontSize: 110, lineHeight: 0.86 }),
    box({ position: "absolute", left: 50, right: 50, bottom: 86, height: 1, backgroundColor: t.hint }),
    label16(d.footer_left, spec, { position: "absolute", left: 50, bottom: 38, width: 270, color: t.muted, fontSize: 10, lineHeight: 1.45, whiteSpace: "pre-wrap" }),
    label16(d.footer_center, spec, { position: "absolute", left: 360, bottom: 52, width: 240, textAlign: "center", color: t.muted, fontSize: 10 }),
    label16(d.footer_right, spec, { position: "absolute", right: 50, bottom: 52, width: 220, textAlign: "right", color: t.muted, fontSize: 10 })
  ]);
}
function renderChapter6(spec, variant) {
  const d = content9(spec, variant);
  const t = surfaceStyle(d.surface || (variant === "chapter" ? "light" : "dark"));
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, overflow: "hidden" }, [
    label16(d.label, spec, { position: "absolute", left: 50, bottom: 208, color: t.muted, fontSize: 11, letterSpacing: 2.2 }),
    display9(d.title, spec, { position: "absolute", left: 48, right: 60, bottom: 76, color: t.fg, fontSize: 96, lineHeight: 0.9 })
  ]);
}
function renderStatement6(spec, variant) {
  const d = content9(spec, variant);
  const t = surfaceStyle(d.surface || "dark");
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, overflow: "hidden" }, [
    display9(d.title, spec, { position: "absolute", left: 48, right: 58, bottom: 80, color: t.fg, fontSize: 82, lineHeight: 0.92 })
  ]);
}
function renderSplit6(spec) {
  const d = content9(spec, "split");
  const t = surfaceStyle("light");
  return page8(spec, 4, "light", d.eyebrow, [
    label16(d.label, spec, { position: "absolute", left: 50, top: 112, color: t.muted, fontSize: 11, letterSpacing: 1.5 }),
    display9(d.title, spec, { position: "absolute", left: 50, top: 143, width: 365, color: t.fg, fontSize: 46, lineHeight: 0.96 }),
    body16(d.body, spec, { position: "absolute", left: 50, top: 266, width: 360, color: t.muted, fontSize: 13.5, lineHeight: 1.44 }),
    ...arr(d.bullets, DEFAULTS19.split.bullets).slice(0, 3).map(
      (item, index) => body16(`- ${item}`, spec, { position: "absolute", left: 50, top: 378 + index * 23, width: 360, color: t.fg, fontSize: 13, lineHeight: 1.25 })
    ),
    box({ position: "absolute", right: 50, top: 112, width: 392, height: 318, backgroundColor: t.image, border: `1px solid ${t.border}`, justifyContent: "center", alignItems: "center" }, [
      label16("IMAGE PLACEHOLDER", spec, { color: t.hint, fontSize: 10 })
    ]),
    label16(d.caption, spec, { position: "absolute", right: 50, bottom: 74, width: 392, color: t.hint, fontSize: 9 })
  ]);
}
function renderStats8(spec) {
  const d = content9(spec, "stats");
  const t = surfaceStyle("light");
  return page8(spec, 5, "light", d.eyebrow, [
    display9(d.title, spec, { position: "absolute", left: 50, top: 124, width: 690, color: t.fg, fontSize: 58, lineHeight: 0.95 }),
    box({ position: "absolute", left: 50, right: 50, top: 260, height: 150, flexDirection: "row", gap: 28 }, arr(d.stats, DEFAULTS19.stats.stats).slice(0, 3).map((stat) => {
      const [value15, title2, note] = stat;
      return box({ flex: 1, borderTop: `2px solid ${t.fg}`, paddingTop: 18 }, [
        metric8(value15, spec, { color: t.fg }),
        body16(title2, spec, { marginTop: 10, color: t.fg, fontSize: 14, lineHeight: 1.2 }),
        label16(note, spec, { marginTop: 10, color: t.hint, fontSize: 8.5, letterSpacing: 0.8 })
      ]);
    }))
  ]);
}
function renderList4(spec) {
  const d = content9(spec, "list");
  const t = surfaceStyle("dark");
  return page8(spec, 6, "dark", d.eyebrow, [
    display9(d.title, spec, { position: "absolute", left: 50, top: 170, width: 350, color: t.fg, fontSize: 54, lineHeight: 0.96 }),
    body16(d.body, spec, { position: "absolute", left: 50, top: 292, width: 340, color: t.muted, fontSize: 14, lineHeight: 1.4 }),
    ...arr(d.items, DEFAULTS19.list.items).slice(0, 5).map(
      (item, index) => body16(`- ${item}`, spec, { position: "absolute", left: 468, top: 152 + index * 45, width: 380, color: t.fg, fontSize: 19, lineHeight: 1.18 })
    )
  ]);
}
function renderQuote16(spec) {
  const d = content9(spec, "quote");
  const t = surfaceStyle("dark");
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, overflow: "hidden" }, [
    display9(d.quote, spec, { position: "absolute", left: 50, top: 136, width: 760, color: t.fg, fontSize: 54, lineHeight: 1.02 }),
    label16(d.name, spec, { position: "absolute", left: 52, bottom: 100, color: t.fg, fontSize: 12, letterSpacing: 1.5 }),
    label16(d.role, spec, { position: "absolute", left: 52, bottom: 73, color: t.muted, fontSize: 10, letterSpacing: 1.2 })
  ]);
}
function renderCompare4(spec) {
  const d = content9(spec, "compare");
  const t = surfaceStyle("light");
  const panel3 = (side, labelText4, title2, bodyText5, items, left) => box({ position: "absolute", left: left ? 50 : 500, top: 115, width: 390, bottom: 76, flexDirection: "column", borderRight: left ? `2px solid ${t.fg}` : "0px solid transparent", paddingRight: left ? 34 : 0, paddingLeft: left ? 0 : 34 }, [
    label16(labelText4, spec, { width: "100%", color: side === "after" ? t.fg : t.muted, fontSize: 10, letterSpacing: 1.8 }),
    box({ marginTop: 12, width: "100%", height: 1, backgroundColor: t.border }),
    display9(title2, spec, { width: "100%", marginTop: 24, color: t.fg, fontSize: 30, lineHeight: 1.02 }),
    body16(bodyText5, spec, { width: "100%", marginTop: 18, color: t.muted, fontSize: 13.4, lineHeight: 1.42 }),
    ...arr(items).slice(0, 3).map(
      (item, index) => body16(`- ${item}`, spec, { width: "100%", marginTop: index === 0 ? 18 : 8, color: t.fg, fontSize: 12.5, lineHeight: 1.22 })
    )
  ]);
  return page8(spec, 8, "light", d.eyebrow, [
    panel3("before", d.left_label, d.left_title, d.left_body, d.left_items, true),
    panel3("after", d.right_label, d.right_title, d.right_body, d.right_items, false)
  ]);
}
function renderChart7(spec) {
  const d = content9(spec, "chart");
  const t = surfaceStyle("dark");
  const values = arr(d.values, DEFAULTS19.chart.values);
  const labels = arr(d.labels, DEFAULTS19.chart.labels);
  const max = Math.max(...values, 1);
  return page8(spec, 11, "dark", d.eyebrow, [
    display9(d.title, spec, { position: "absolute", left: 50, top: 106, width: 480, color: t.fg, fontSize: 46, lineHeight: 0.95 }),
    label16(d.caption, spec, { position: "absolute", right: 50, top: 124, width: 320, textAlign: "right", color: t.muted, fontSize: 10 }),
    box({ position: "absolute", left: 50, right: 50, bottom: 112, height: 235, borderLeft: `2px solid ${t.hint}`, flexDirection: "row", alignItems: "flex-end", gap: 42, paddingLeft: 20 }, values.slice(0, 5).map((value15, index) => {
      const h = Math.max(30, Math.round(value15 / max * 185));
      const accent = index === values.length - 1;
      return box({ flex: 1, height: 218, justifyContent: "flex-end" }, [
        metric8(String(value15), spec, { color: accent ? t.fg : t.muted, fontSize: 16, fontWeight: accent ? 900 : 700, marginBottom: 8 }),
        box({ width: "100%", height: h, backgroundColor: accent ? t.fg : t.hint }),
        label16(labels[index], spec, { color: t.hint, fontSize: 9, marginTop: 10, letterSpacing: 1 })
      ]);
    })),
    box({ position: "absolute", left: 50, right: 50, bottom: 110, height: 2, backgroundColor: t.hint }),
    label16(d.source, spec, { position: "absolute", left: 50, bottom: 74, color: t.hint, fontSize: 9, letterSpacing: 0.8 })
  ]);
}
function renderEnd4(spec) {
  const d = content9(spec, "end");
  const t = surfaceStyle("light");
  return box({ width: 960, height: 540, position: "relative", backgroundColor: t.bg, overflow: "hidden" }, [
    display9(d.title, spec, { position: "absolute", left: 48, top: 58, width: 810, color: t.fg, fontSize: 98, lineHeight: 0.9 }),
    box({ position: "absolute", left: 50, right: 50, bottom: 70, height: 1, backgroundColor: t.border }),
    body16(d.contact_a, spec, { position: "absolute", left: 50, bottom: 104, width: 380, color: t.muted, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap" }),
    body16(d.contact_b, spec, { position: "absolute", right: 50, bottom: 104, width: 380, color: t.muted, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap" })
  ]);
}
function renderTypeMassPoster(spec) {
  const variant = normalizeVariant20(spec);
  switch (variant) {
    case "chapter":
    case "chapter-9":
      return renderChapter6(spec, variant);
    case "statement":
    case "statement-10":
      return renderStatement6(spec, variant);
    case "split":
      return renderSplit6(spec);
    case "stats":
      return renderStats8(spec);
    case "list":
      return renderList4(spec);
    case "quote":
      return renderQuote16(spec);
    case "compare":
      return renderCompare4(spec);
    case "chart":
      return renderChart7(spec);
    case "end":
      return renderEnd4(spec);
    case "cover":
    default:
      return renderCover16(spec);
  }
}

// templates/beautiful/serif-stat-editorial.mjs
var templateId22 = "serif-stat-editorial";
var PAGE_VARIANTS21 = [
  "cover",
  "agenda",
  "statement",
  "two-col",
  "data",
  "framework",
  "stats",
  "summary"
];
var rendererContract22 = {
  template_id: templateId22,
  renderer_id: `artboard_satori.${templateId22}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "editorial-forest",
  implemented_page_variants: PAGE_VARIANTS21,
  page_family: {
    family_id: "editorial-forest",
    supported_page_variants: PAGE_VARIANTS21,
    variant_usage_policy: {
      singletons: ["cover", "summary"],
      repeatable: PAGE_VARIANTS21.filter((variant) => !["cover", "summary"].includes(variant))
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/editorial-forest-1.png"
};
var CANVAS13 = { width: 960, height: 540 };
var DEFAULTS20 = {
  cover: {
    eyebrow: "A Presentation Template",
    title: "Quarterly\nReview\n2026",
    left_footer: "Studio Placeholder",
    right_footer: "Presented by Name Placeholder"
  },
  agenda: {
    title: "Agenda.",
    subtitle: "Five topics - ninety minutes",
    topics: [
      { num: "01", title: "Where we stand today.", foot: "Context", tone: "green" },
      { num: "02", title: "The big shift.", foot: "Insight", tone: "pink" },
      { num: "03", title: "By the numbers.", foot: "Data", tone: "greenLite" },
      { num: "04", title: "How we'll get there.", foot: "Plan", tone: "cream" },
      { num: "05", title: "What it adds up to.", foot: "Outcomes", tone: "greenLite" }
    ]
  },
  statement: {
    eyebrow: "The shift",
    quote: "The next twelve months are about doing fewer things, and doing them with more conviction.",
    name: "Name Placeholder",
    role: "Role Placeholder",
    section: "Section 02"
  },
  "two-col": {
    figure: "[ image - 880 x 760 ]",
    figure_label: "Visual 01",
    figure_caption: "Replace with photo",
    eyebrow: "The big shift",
    title: "Fewer bets, stronger commitments.",
    paragraphs: [
      "Placeholder body copy sits here as a stand-in for the supporting narrative. Open with the point you want the audience to remember when they walk out of the room.",
      "Use the second paragraph to add proof - a customer, a moment in market, a number that earns the claim. Keep one idea per paragraph; trust the audience to follow."
    ],
    meta: [
      { label: "Owner", value: "Team Placeholder" },
      { label: "Timeframe", value: "Q2 - Q4" },
      { label: "Status", value: "On track" }
    ]
  },
  data: {
    eyebrow: "By the numbers",
    title: "Revenue by quarter, year over year.",
    legend: ["This year", "Last year"],
    bars: [
      { label: "Q1", a: 62, b: 48 },
      { label: "Q2", a: 74, b: 55 },
      { label: "Q3", a: 81, b: 67 },
      { label: "Q4", a: 88, b: 72 },
      { label: "YTD", a: 92, b: 78 }
    ],
    left_footer: "Revenue model",
    right_footer: "Draft data"
  },
  framework: {
    title: "How we'll get there",
    subtitle: "Four steps",
    intro: "A simple plan, in four moves.",
    steps: [
      { num: "Step 01", title: "Listen", body: "Open the quarter with structured conversations across teams. Capture what we hear without filtering.", meta: "Weeks 1-2", owner: "Owner", tone: "cream" },
      { num: "Step 02", title: "Align", body: "Cluster signals into themes. Name them plainly so everyone uses the same language in every room.", meta: "Week 3", owner: "Owner", tone: "green" },
      { num: "Step 03", title: "Build", body: "Convert the themes into focused initiatives, with clear measures for every proposed bet.", meta: "Weeks 4-7", owner: "Owner", tone: "pink" },
      { num: "Step 04", title: "Review", body: "Return to the evidence, decide what continues, and cut the work that is not learning fast enough.", meta: "Week 8", owner: "Owner", tone: "cream" }
    ]
  },
  stats: {
    title: "What it adds up to",
    subtitle: "Year to date",
    intro: "Three numbers that tell the story.",
    metrics: [
      { label: "Growth", value: "+42", unit: "%", body: "Year over year increase in active accounts, ahead of the plan we set in January." },
      { label: "Retention", value: "94", unit: "%", body: "Net retention across the top customer cohort, a four-point lift from last year." },
      { label: "Reach", value: "3.1", unit: "M", body: "People served this quarter, across the markets we entered in the spring." }
    ]
  },
  summary: {
    eyebrow: "In summary",
    title: "Thank you",
    subtitle: "Three things to take.",
    items: [
      { label: "One", body: "The strategy holds. We are doing fewer things, and the right things." },
      { label: "Two", body: "The numbers back the bets. Growth, retention, and reach are all ahead of plan." },
      { label: "Three", body: "Next quarter, we keep the pace and add focus where the data points us." }
    ]
  }
};
function colors17(spec) {
  const source = spec.theme?.colors || {};
  return {
    green: source.primary || "#2e4a2a",
    greenDeep: "#243a21",
    greenLite: "#3a5a36",
    pink: source.accent || "#e89cb1",
    pinkDeep: "#d27e96",
    cream: source.background || "#efe7d4",
    cream2: source.panel || "#e6dcc4",
    ink: source.text || "#1a1a17"
  };
}
function role19(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function value13(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function array15(spec, key, fallback2 = []) {
  const raw = spec.content?.[key];
  return Array.isArray(raw) && raw.length ? raw : fallback2;
}
function content10(spec, variant) {
  return { ...DEFAULTS20[variant] || DEFAULTS20.cover, ...spec.content || {} };
}
function normalizeVariant21(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS21.length) return PAGE_VARIANTS21[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS21) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("toc")) return "agenda";
  if (raw.includes("quote") || raw.includes("statement")) return "statement";
  if (raw.includes("two") || raw.includes("detail")) return "two-col";
  if (raw.includes("chart") || raw.includes("data")) return "data";
  if (raw.includes("timeline") || raw.includes("process") || raw.includes("framework")) return "framework";
  if (raw.includes("stat") || raw.includes("metric")) return "stats";
  if (raw.includes("closing") || raw.includes("summary")) return "summary";
  return "agenda";
}
function page9(backgroundColor, color, children = []) {
  return box(
    {
      width: CANVAS13.width,
      height: CANVAS13.height,
      position: "relative",
      backgroundColor,
      color,
      overflow: "hidden"
    },
    [
      ...textureDots2(color),
      ...children
    ]
  );
}
function textureDots2(color) {
  return Array.from(
    { length: 10 },
    (_, index) => box({
      position: "absolute",
      right: 70 + index % 5 * 15,
      bottom: 54 + Math.floor(index / 5) * 15,
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: color,
      opacity: 0.3
    })
  );
}
function label17(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: 2.4,
    ...role19("label", spec, { fontSize: 13, lineHeight: 1, fontWeight: 500, letterSpacing: 2.4, textTransform: "uppercase" }),
    ...style
  });
}
function serif5(value15, spec, style = {}) {
  return TextBlock(value15, {
    fontSize: 15,
    lineHeight: 1.35,
    ...role19("body", spec, { fontSize: 15, lineHeight: 1.35, fontWeight: 400 }),
    ...style
  });
}
function title(value15, spec, style = {}) {
  return Title(value15, {
    fontSize: 48,
    lineHeight: 0.96,
    letterSpacing: -0.8,
    ...role19("display", spec, { fontSize: 48, lineHeight: 0.96, fontWeight: 500, letterSpacing: -0.8 }),
    ...style
  });
}
function metric9(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    fontSize: 72,
    lineHeight: 0.94,
    letterSpacing: -1.2,
    ...role19("metric", spec, { fontSize: 72, lineHeight: 0.94, fontWeight: 500, letterSpacing: -1.2 }),
    ...style
  });
}
function rule4(style = {}) {
  return box({ position: "absolute", height: 1, backgroundColor: "currentColor", opacity: 1, ...style });
}
function topbar(spec, theme8, left, right = "EF", color = theme8.green, y = 48, x = 60) {
  return [
    label17(left, spec, { position: "absolute", left: x, top: y, color }),
    TextBlock(String(right).toUpperCase(), {
      position: "absolute",
      right: x,
      top: y - 10,
      width: 65,
      height: 65,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: color,
      color,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      letterSpacing: 1.2,
      ...role19("label", spec, { fontSize: 14, lineHeight: 1, fontWeight: 500, letterSpacing: 1.2 })
    })
  ];
}
function renderCover17(spec, theme8) {
  const c = content10(spec, "cover");
  return page9(theme8.green, theme8.pink, [
    ...topbar(spec, theme8, value13(spec, "eyebrow", c.eyebrow), "01", theme8.pink, 52, 70),
    title(value13(spec, "title", c.title), spec, {
      position: "absolute",
      left: 70,
      top: 118,
      width: 640,
      color: theme8.pink,
      fontSize: 108,
      lineHeight: 0.92,
      whiteSpace: "pre-line"
    }),
    label17(value13(spec, "left_footer", c.left_footer), spec, { position: "absolute", left: 70, bottom: 66, color: theme8.pink }),
    label17(value13(spec, "right_footer", c.right_footer), spec, { position: "absolute", right: 70, bottom: 66, color: theme8.pink, textAlign: "right" })
  ]);
}
function agendaTile(spec, theme8, item, x, y, w, h) {
  const tone2 = item.tone || "cream";
  const fill2 = tone2 === "green" ? theme8.green : tone2 === "pink" ? theme8.pink : tone2 === "greenLite" ? theme8.greenLite : theme8.cream2;
  const color = tone2 === "green" || tone2 === "greenLite" ? theme8.pink : theme8.greenDeep;
  const bordered = tone2 === "cream";
  return box(
    {
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: fill2,
      borderRadius: 6,
      borderWidth: bordered ? 1 : 0,
      borderColor: theme8.green,
      padding: 20,
      flexDirection: "column",
      justifyContent: "space-between",
      color
    },
    [
      label17(item.num, spec, { color, fontSize: 12, letterSpacing: 1.5 }),
      title(item.title, spec, {
        color,
        width: w - 48,
        fontSize: tone2 === "green" ? 42 : 28,
        lineHeight: 0.98
      }),
      label17(item.foot, spec, { color, fontSize: 11, letterSpacing: 1.4 })
    ]
  );
}
function renderAgenda7(spec, theme8) {
  const c = content10(spec, "agenda");
  const topics = array15(spec, "topics", c.topics);
  return page9(theme8.cream, theme8.green, [
    title(value13(spec, "title", c.title), spec, { position: "absolute", left: 60, top: 66, width: 290, color: theme8.green }),
    label17(value13(spec, "subtitle", c.subtitle), spec, { position: "absolute", right: 60, top: 82, color: theme8.green }),
    agendaTile(spec, theme8, topics[0], 60, 155, 360, 320),
    agendaTile(spec, theme8, topics[1], 432, 155, 218, 148),
    agendaTile(spec, theme8, topics[2], 662, 155, 238, 148),
    agendaTile(spec, theme8, topics[3], 432, 327, 218, 148),
    agendaTile(spec, theme8, topics[4], 662, 327, 238, 148)
  ]);
}
function renderStatement7(spec, theme8) {
  const c = content10(spec, "statement");
  return page9(theme8.pink, theme8.greenDeep, [
    label17(value13(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 80, top: 66, color: theme8.greenDeep }),
    title(value13(spec, "quote", c.quote), spec, {
      position: "absolute",
      left: 80,
      top: 128,
      width: 730,
      color: theme8.greenDeep,
      fontSize: 60,
      lineHeight: 1.02
    }),
    serif5(value13(spec, "name", c.name), spec, { position: "absolute", left: 80, bottom: 65, color: theme8.greenDeep, fontSize: 22, fontWeight: 600 }),
    label17(value13(spec, "role", c.role), spec, { position: "absolute", left: 80, bottom: 38, color: theme8.greenDeep }),
    label17(value13(spec, "section", c.section), spec, { position: "absolute", right: 80, bottom: 38, color: theme8.greenDeep, textAlign: "right" })
  ]);
}
function renderTwoCol(spec, theme8) {
  const c = content10(spec, "two-col");
  const paragraphs = array15(spec, "paragraphs", c.paragraphs);
  const meta = array15(spec, "meta", c.meta);
  return page9(theme8.cream, theme8.ink, [
    box({
      position: "absolute",
      left: 60,
      top: 55,
      width: 440,
      height: 420,
      borderRadius: 6,
      backgroundColor: theme8.green,
      alignItems: "center",
      justifyContent: "center"
    }, [
      serif5(value13(spec, "figure", c.figure), spec, { color: theme8.pink, fontSize: 28, width: 280, textAlign: "center", justifyContent: "center" }),
      label17(value13(spec, "figure_label", c.figure_label), spec, { position: "absolute", left: 18, bottom: 24, color: theme8.pink }),
      label17(value13(spec, "figure_caption", c.figure_caption), spec, { position: "absolute", right: 18, bottom: 24, color: theme8.pink, textAlign: "right" })
    ]),
    label17(value13(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 550, top: 58, color: theme8.green }),
    title(value13(spec, "title", c.title), spec, { position: "absolute", left: 550, top: 100, width: 350, color: theme8.green }),
    serif5(paragraphs[0] || "", spec, { position: "absolute", left: 550, top: 250, width: 345, color: theme8.ink, fontSize: 14, lineHeight: 1.36 }),
    serif5(paragraphs[1] || "", spec, { position: "absolute", left: 550, top: 330, width: 345, color: theme8.ink, fontSize: 14, lineHeight: 1.36 }),
    rule4({ left: 550, bottom: 100, width: 345, backgroundColor: theme8.green }),
    ...meta.slice(0, 3).map((item, index) => box({
      position: "absolute",
      left: 550 + index * 118,
      bottom: 55,
      width: 105,
      flexDirection: "column"
    }, [
      label17(item.label, spec, { color: theme8.green, fontSize: 10, letterSpacing: 1.4 }),
      serif5(item.value, spec, { color: theme8.ink, fontSize: 16, lineHeight: 1.1, marginTop: 8, fontWeight: 500 })
    ]))
  ]);
}
function renderData4(spec, theme8) {
  const c = content10(spec, "data");
  const bars = array15(spec, "bars", c.bars);
  const legend = array15(spec, "legend", c.legend);
  const chartLeft = 140;
  const chartTop = 250;
  const chartHeight = 210;
  const chartWidth = 720;
  return page9(theme8.green, theme8.cream, [
    label17(value13(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 60, top: 56, color: theme8.pink }),
    title(value13(spec, "title", c.title), spec, { position: "absolute", left: 60, top: 92, width: 620, color: theme8.cream, fontSize: 42, lineHeight: 1 }),
    ...legend.slice(0, 2).map((item, index) => box({ position: "absolute", right: 60, top: 65 + index * 24, alignItems: "center" }, [
      box({ width: 13, height: 13, borderRadius: 2, backgroundColor: index === 0 ? theme8.pink : theme8.cream, marginRight: 8 }),
      label17(item, spec, { color: theme8.cream, fontSize: 11, letterSpacing: 1.2 })
    ])),
    ...[100, 75, 50, 25, 0].map((tick, index) => label17(String(tick), spec, { position: "absolute", left: 82, top: chartTop - 4 + index * 52, width: 34, color: theme8.cream, textAlign: "right", fontSize: 11, letterSpacing: 0.8 })),
    box({ position: "absolute", left: chartLeft, top: chartTop, width: 1, height: chartHeight, backgroundColor: theme8.cream }),
    box({ position: "absolute", left: chartLeft, top: chartTop + chartHeight, width: chartWidth, height: 1, backgroundColor: theme8.cream }),
    ...[1, 2, 3].map((i) => box({ position: "absolute", left: chartLeft, top: chartTop + i * 52, width: chartWidth, height: 1, backgroundColor: theme8.cream, opacity: 0.18 })),
    ...bars.slice(0, 5).flatMap((bar, index) => {
      const groupX = chartLeft + 44 + index * 136;
      const aHeight = Math.round(chartHeight * (bar.a || bar.value || 60) / 100);
      const bHeight = Math.round(chartHeight * (bar.b || Math.max(20, (bar.a || 60) - 12)) / 100);
      return [
        box({ position: "absolute", left: groupX, top: chartTop + chartHeight - aHeight, width: 28, height: aHeight, backgroundColor: theme8.pink, borderRadius: "3px 3px 0 0" }),
        box({ position: "absolute", left: groupX + 38, top: chartTop + chartHeight - bHeight, width: 28, height: bHeight, backgroundColor: theme8.cream, borderRadius: "3px 3px 0 0" }),
        label17(String(bar.a || bar.value || ""), spec, { position: "absolute", left: groupX - 5, top: chartTop + chartHeight - aHeight - 20, color: theme8.cream, fontSize: 10, letterSpacing: 0.8 }),
        label17(String(bar.b || ""), spec, { position: "absolute", left: groupX + 35, top: chartTop + chartHeight - bHeight - 20, color: theme8.cream, fontSize: 10, letterSpacing: 0.8 }),
        label17(bar.label || `Q${index + 1}`, spec, { position: "absolute", left: groupX - 22, top: chartTop + chartHeight + 18, width: 100, color: theme8.cream, textAlign: "center", fontSize: 12, letterSpacing: 1 })
      ];
    }),
    label17(value13(spec, "left_footer", c.left_footer), spec, { position: "absolute", left: 60, bottom: 36, color: theme8.pink }),
    label17(value13(spec, "right_footer", c.right_footer), spec, { position: "absolute", right: 60, bottom: 36, color: theme8.pink, textAlign: "right" })
  ]);
}
function renderFramework(spec, theme8) {
  const c = content10(spec, "framework");
  const steps = array15(spec, "steps", c.steps);
  return page9(theme8.cream, theme8.green, [
    label17(value13(spec, "subtitle", c.subtitle), spec, { position: "absolute", right: 60, top: 62, color: theme8.green, textAlign: "right" }),
    title(value13(spec, "title", c.title), spec, { position: "absolute", left: 60, top: 62, width: 570, color: theme8.green, fontSize: 48 }),
    serif5(value13(spec, "intro", c.intro), spec, { position: "absolute", left: 60, top: 134, color: theme8.green, fontSize: 18 }),
    ...steps.slice(0, 4).map((step, index) => {
      const fill2 = step.tone === "green" ? theme8.green : step.tone === "pink" ? theme8.pink : theme8.cream;
      const color = step.tone === "green" ? theme8.pink : step.tone === "pink" ? theme8.greenDeep : theme8.green;
      return box({
        position: "absolute",
        left: 60 + index * 214,
        top: 192,
        width: 196,
        height: 270,
        flexDirection: "column",
        backgroundColor: fill2,
        color,
        borderRadius: 8,
        borderWidth: step.tone === "cream" ? 1.5 : 0,
        borderColor: theme8.green,
        padding: 18
      }, [
        label17(step.num, spec, { color, fontSize: 10, letterSpacing: 1.2 }),
        title(step.title, spec, { color, fontSize: 33, lineHeight: 0.98, marginTop: 18, width: 150 }),
        serif5(step.body, spec, { color, fontSize: 13, lineHeight: 1.34, marginTop: 16, width: 150 }),
        box({ marginTop: "auto", borderTopWidth: 1, borderTopColor: color, paddingTop: 12, flexDirection: "row", justifyContent: "space-between" }, [
          label17(step.meta, spec, { color, fontSize: 9, letterSpacing: 1 }),
          label17(step.owner, spec, { color, fontSize: 9, letterSpacing: 1, textAlign: "right" })
        ])
      ]);
    })
  ]);
}
function renderStats9(spec, theme8) {
  const c = content10(spec, "stats");
  const metrics = array15(spec, "metrics", c.metrics);
  return page9(theme8.green, theme8.cream, [
    label17(value13(spec, "subtitle", c.subtitle), spec, { position: "absolute", right: 60, top: 64, color: theme8.pink, textAlign: "right" }),
    title(value13(spec, "title", c.title), spec, { position: "absolute", left: 60, top: 62, width: 640, color: theme8.cream, fontSize: 41 }),
    serif5(value13(spec, "intro", c.intro), spec, { position: "absolute", left: 60, top: 130, color: theme8.cream, fontSize: 17 }),
    rule4({ left: 60, top: 205, width: 840, backgroundColor: theme8.pink }),
    ...metrics.slice(0, 3).map((item, index) => box({
      position: "absolute",
      left: 60 + index * 295,
      top: 236,
      width: 250,
      flexDirection: "column"
    }, [
      label17(item.label, spec, { color: theme8.pink, fontSize: 11, letterSpacing: 1.3 }),
      box({ marginTop: 14, alignItems: "flex-end" }, [
        metric9(item.value, spec, { color: theme8.pink, fontSize: 82 }),
        metric9(item.unit, spec, { color: theme8.cream, fontSize: 42, marginLeft: 3, marginBottom: 7 })
      ]),
      serif5(item.body, spec, { color: theme8.cream, fontSize: 15, lineHeight: 1.32, marginTop: 20, width: 235 })
    ]))
  ]);
}
function renderSummary2(spec, theme8) {
  const c = content10(spec, "summary");
  const items = array15(spec, "items", c.items);
  return page9(theme8.green, theme8.cream, [
    ...topbar(spec, theme8, value13(spec, "eyebrow", c.eyebrow), "08", theme8.pink, 54, 70),
    title(value13(spec, "title", c.title), spec, {
      position: "absolute",
      left: 70,
      top: 134,
      width: 720,
      color: theme8.pink,
      fontSize: 108,
      lineHeight: 0.94
    }),
    label17(value13(spec, "subtitle", c.subtitle), spec, { position: "absolute", left: 70, top: 310, color: theme8.pink }),
    rule4({ left: 70, top: 360, width: 820, backgroundColor: theme8.pink }),
    ...items.slice(0, 3).map((item, index) => box({
      position: "absolute",
      left: 70 + index * 285,
      top: 382,
      width: 245,
      flexDirection: "column"
    }, [
      label17(item.label, spec, { color: theme8.pink, fontSize: 12, letterSpacing: 1.4 }),
      serif5(item.body, spec, { color: theme8.cream, fontSize: 16, lineHeight: 1.32, marginTop: 16, width: 230 })
    ]))
  ]);
}
function renderSerifStatEditorial(spec) {
  const theme8 = colors17(spec);
  const variant = normalizeVariant21(spec);
  if (variant === "cover") return renderCover17(spec, theme8);
  if (variant === "agenda") return renderAgenda7(spec, theme8);
  if (variant === "statement") return renderStatement7(spec, theme8);
  if (variant === "two-col") return renderTwoCol(spec, theme8);
  if (variant === "data") return renderData4(spec, theme8);
  if (variant === "framework") return renderFramework(spec, theme8);
  if (variant === "stats") return renderStats9(spec, theme8);
  return renderSummary2(spec, theme8);
}

// templates/beautiful/grove-organic-brief.mjs
var templateId23 = "grove-organic-brief";
var CANVAS14 = { width: 960, height: 540 };
var PAGE_VARIANTS22 = [
  "cover",
  "chapter",
  "statement",
  "split",
  "stats",
  "list",
  "quote",
  "compare",
  "chapter-9",
  "statement-10",
  "chart",
  "end"
];
var rendererContract23 = {
  template_id: templateId23,
  renderer_id: `artboard_satori.${templateId23}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "grove",
  implemented_page_variants: PAGE_VARIANTS22,
  page_family: {
    family_id: "grove",
    supported_page_variants: PAGE_VARIANTS22,
    variant_usage_policy: {
      singletons: ["cover", "quote", "end"],
      repeatable: ["chapter", "statement", "split", "stats", "list", "compare", "chapter-9", "statement-10", "chart"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/grove-1.png"
};
var DEFAULTS21 = {
  cover: {
    eyebrow: "Strategy - Presentation",
    title: "[Presentation Title\nGoes Here]",
    subtitle: "A type of work for audience or occasion. Month, Year.",
    footer_left: "[Prepared by]",
    footer_right: "[Confidential]",
    marker: "01"
  },
  chapter: {
    num: "01",
    eyebrow: "01 / Context",
    title: "The landscape has shifted. Now we must decide where to stand.",
    subtitle: "An honest assessment of where the market is, and where the opportunity lies."
  },
  statement: {
    sidebar: "The Thesis",
    chrome_left: "Core Insight",
    chrome_right: "03",
    kicker: "The Argument",
    title: "The brands that will lead the next decade are not the ones with the best product. They are the ones with the deepest understanding.",
    foot_right: "03 / 12"
  },
  split: {
    sidebar: "The Evidence",
    chrome_left: "Research - Insight",
    chrome_right: "04",
    kicker: "What We Found",
    title: "Audiences have outgrown the stories being told about them",
    body: "Three years of primary research across six markets revealed a consistent pattern: the gap between how brands communicate and how people actually live is widening.",
    items: [
      "Authenticity is valued over aspiration in all categories tested",
      "Trust is earned through consistency, not campaigns",
      "Communities form around shared values, not product features"
    ],
    image_label: "[IMAGE PLACEHOLDER]",
    image_caption: "[Caption: research context or visual annotation]",
    foot_right: "04 / 12"
  },
  stats: {
    sidebar: "By The Numbers",
    chrome_left: "Market - Metrics",
    chrome_right: "05",
    title: "Three numbers that define the opportunity",
    metrics: [
      { value: "73%", label: "Of consumers distrust brand-created content" },
      { value: "4.8x", label: "Higher engagement for community-driven campaigns" },
      { value: "#1", label: "Driver of purchase decisions: peer recommendation" }
    ],
    source: "Source: Primary Research - Year - N=sample size across geographies",
    foot_right: "05 / 12"
  },
  list: {
    sidebar: "Our Approach",
    chrome_left: "Framework",
    chrome_right: "06",
    kicker: "What Changes",
    title: "Five principles that reframe how we think about brand",
    body: "These are not tactics. They are the underlying commitments that make everything else possible.",
    items: [
      "Start with the community, not the product - earn presence before claiming it",
      "Replace broadcast with conversation - listen before speaking",
      "Make the values visible in operations, not just in messaging",
      "Treat long-term relationship as the primary metric, not reach",
      "Give audiences ownership of the narrative - participation over performance"
    ],
    foot_right: "06 / 12"
  },
  quote: {
    quote: "The most radical thing a brand can do right now is simply tell the truth about what it is, and what it is not.",
    author: "[Author Name]",
    role: "[Title] - [Year]"
  },
  compare: {
    sidebar: "Before / After",
    chrome_left: "The Shift",
    chrome_right: "08",
    columns: [
      {
        title: "The Old Model",
        subtitle: "Brand as broadcaster - pushing messages outward",
        body: "The organization speaks. The audience receives. Feedback is collected in annual surveys and processed into next year messaging brief.",
        items: ["Campaigns replace conversations", "Reach is the primary metric", "Community is a distribution channel"]
      },
      {
        title: "The New Model",
        subtitle: "Brand as participant - embedded in the community",
        body: "The organization listens first and speaks in response. Feedback is constant, not a project. The community owns the story as much as the brand does.",
        items: ["Relationships replace campaigns", "Trust is the primary metric", "Community is the source of strategy"]
      }
    ],
    foot_right: "08 / 12"
  },
  "chapter-9": {
    num: "02",
    eyebrow: "02 / Recommendation",
    title: "What we propose - and why we believe it will work",
    subtitle: "A practical framework built on the evidence, with clear priorities and measurable outcomes."
  },
  "statement-10": {
    sidebar: "The Recommendation",
    chrome_left: "Strategic Direction",
    chrome_right: "10",
    kicker: "The Path Forward",
    title: "Stop managing perception. Start deserving it.",
    body: "The organizations that win the next decade will earn trust slowly, through consistent action - not through the perfection of their messaging.",
    foot_right: "10 / 12",
    light: true
  },
  chart: {
    sidebar: "The Data",
    chrome_left: "Trust Index - Category Benchmarks",
    chrome_right: "11",
    title: "Consumer trust by category",
    subtitle: "Score out of 100 - Year - N=X",
    bars: [
      { value: 38, label: "Finance" },
      { value: 44, label: "Media" },
      { value: 56, label: "Retail" },
      { value: 62, label: "Healthcare" },
      { value: 79, label: "Community" }
    ],
    source: "Source: Research Institute - Consumer Trust Index - Year",
    foot_right: "11 / 12"
  },
  end: {
    marker: "12",
    title: "[Organization]",
    subtitle: "The work begins when the presentation ends.",
    contact: "[Author Name] - author@organization.com - organization.com",
    footer: "[Deck version] - [Date] - [Confidentiality note]"
  }
};
function theme3() {
  return {
    bg: "#192B1B",
    bgAlt: "#1E3221",
    light: "#E8E4D6",
    lightAlt: "#DEDAD0",
    cream: "#D4CFBF",
    cream2: "#AFA995",
    cream3: "#716F65",
    green: "#192B1B",
    green2: "#5F6759",
    accent: "#C8524A",
    borderDark: "rgba(212,207,191,0.16)",
    borderLight: "rgba(25,43,27,0.18)",
    watermarkDark: "rgba(212,207,191,0.07)",
    watermarkLight: "rgba(25,43,27,0.07)"
  };
}
function array16(spec, key, fallback2 = []) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function content11(spec, variant) {
  return { ...DEFAULTS21[variant] || DEFAULTS21.cover, ...spec.content || {} };
}
function normalizeVariant22(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS22.length) return PAGE_VARIANTS22[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS22) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("chapter")) return "chapter";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("compare") || raw.includes("split")) return "compare";
  if (raw.includes("chart") || raw.includes("data") || raw.includes("metric")) return "stats";
  if (raw.includes("process") || raw.includes("list")) return "list";
  if (raw.includes("closing") || raw.includes("end")) return "end";
  return "statement";
}
function page10(mode, children = []) {
  const t = theme3();
  const dark = mode === "dark";
  return box(
    {
      width: CANVAS14.width,
      height: CANVAS14.height,
      position: "relative",
      backgroundColor: dark ? t.bg : t.light,
      color: dark ? t.cream : t.green,
      overflow: "hidden"
    },
    children
  );
}
function role20(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function label18(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 1.35,
    ...role20("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 300, letterSpacing: 1.35, textTransform: "uppercase" }),
    ...style
  });
}
function body17(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    fontSize: 15,
    lineHeight: 1.55,
    ...role20("body", spec, { fontSize: 15, lineHeight: 1.55, fontWeight: 300 }),
    ...style
  });
}
function heading2(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    fontSize: 54,
    lineHeight: 1.07,
    letterSpacing: -0.3,
    fontWeight: 400,
    ...role20("display", spec, { fontSize: 54, lineHeight: 1.07, fontWeight: 400, letterSpacing: -0.3 }),
    ...style
  });
}
function smallHeading(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    fontSize: 32,
    lineHeight: 1.18,
    fontWeight: 400,
    ...role20("display", spec, { fontSize: 32, lineHeight: 1.18, fontWeight: 400 }),
    ...style
  });
}
function metric10(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    fontSize: 52,
    lineHeight: 0.96,
    letterSpacing: -0.6,
    ...role20("metric", spec, { fontSize: 52, lineHeight: 0.96, fontWeight: 400, letterSpacing: -0.6 }),
    ...style
  });
}
function rule5(x, y, width, color, opacity = 1) {
  return box({ position: "absolute", left: x, top: y, width, height: 1, backgroundColor: color, opacity });
}
function chrome5(spec, mode, left, right, footRight) {
  const t = theme3();
  const dark = mode === "dark";
  const color = dark ? t.cream2 : t.green2;
  const border = dark ? t.borderDark : t.borderLight;
  return [
    box({ position: "absolute", left: 76, right: 76, top: 42, height: 30, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderColor: border }, [
      label18(left || "", spec, { color }),
      label18(right || "", spec, { color, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 76, right: 76, bottom: 36, height: 30, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: border, paddingTop: 11 }, [
      label18("", spec, { color }),
      label18(footRight || "", spec, { color, textAlign: "right" })
    ])
  ];
}
function sidebar(spec, text10, mode) {
  const t = theme3();
  const dark = mode === "dark";
  return label18(text10 || "", spec, {
    position: "absolute",
    left: 22,
    top: 262,
    width: 210,
    color: dark ? t.cream3 : t.green2,
    transform: "rotate(-90deg)",
    transformOrigin: "0 0",
    textAlign: "center"
  });
}
function watermark(value15, spec, mode, style = {}) {
  const t = theme3();
  return TextBlock(String(value15 || ""), {
    position: "absolute",
    right: 82,
    bottom: -42,
    color: mode === "dark" ? t.watermarkDark : t.watermarkLight,
    fontSize: 176,
    lineHeight: 0.9,
    letterSpacing: -3,
    ...role20("display", spec, { fontSize: 176, lineHeight: 0.9, fontWeight: 400, letterSpacing: -3 }),
    ...style
  });
}
function bulletList4(items, spec, mode, style = {}) {
  const t = theme3();
  const dark = mode === "dark";
  return box({ flexDirection: "column", gap: 12, ...style }, items.slice(0, 6).map(
    (item) => box({ flexDirection: "row", gap: 12, alignItems: "flex-start" }, [
      label18("-", spec, { width: 16, color: t.accent, fontSize: 13, lineHeight: 1.2, letterSpacing: 0 }),
      body17(item, spec, { width: 360, color: dark ? t.cream : t.green, fontSize: 14, lineHeight: 1.45 })
    ])
  ));
}
function renderCover18(spec) {
  const t = theme3();
  const c = content11(spec, "cover");
  return page10("dark", [
    label18(c.eyebrow, spec, { position: "absolute", left: 82, top: 60, color: t.cream2 }),
    metric10(c.marker, spec, { position: "absolute", right: 90, top: 48, color: t.accent, fontSize: 11, letterSpacing: 1.6 }),
    heading2(c.title, spec, { position: "absolute", left: 82, top: 188, width: 610, color: t.cream, fontSize: 70, lineHeight: 0.96, letterSpacing: -0.6 }),
    rule5(82, 358, 36, t.accent),
    body17(c.subtitle, spec, { position: "absolute", left: 82, top: 388, width: 430, color: t.cream2, fontSize: 16, lineHeight: 1.55 }),
    label18(c.footer_left, spec, { position: "absolute", left: 82, bottom: 58, color: t.cream3 }),
    label18(c.footer_right, spec, { position: "absolute", right: 82, bottom: 58, color: t.cream3, textAlign: "right" }),
    watermark("01", spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ]);
}
function renderChapter7(spec, variant) {
  const t = theme3();
  const c = content11(spec, variant);
  return page10("dark", [
    watermark(c.num, spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 }),
    metric10(c.num, spec, { position: "absolute", left: 96, top: 112, color: t.accent, fontSize: 15, letterSpacing: 3 }),
    label18(c.eyebrow, spec, { position: "absolute", left: 96, top: 168, color: t.accent }),
    rule5(96, 206, 36, t.accent),
    heading2(c.title, spec, { position: "absolute", left: 96, top: 228, width: 610, color: t.cream, fontSize: variant === "chapter-9" ? 40 : 43, lineHeight: 1.12 }),
    body17(c.subtitle, spec, { position: "absolute", left: 96, top: variant === "chapter-9" ? 386 : 405, width: 450, color: t.cream2, fontSize: 15, lineHeight: 1.5 })
  ]);
}
function renderStatement8(spec, variant = "statement") {
  const c = content11(spec, variant);
  const t = theme3();
  const mode = c.light ? "light" : "dark";
  const dark = mode === "dark";
  return page10(mode, [
    sidebar(spec, c.sidebar, mode),
    ...chrome5(spec, mode, c.chrome_left, c.chrome_right, c.foot_right),
    label18(c.kicker, spec, { position: "absolute", left: 148, top: 158, color: t.accent }),
    rule5(148, 194, 36, t.accent),
    heading2(c.title, spec, {
      position: "absolute",
      left: 148,
      top: 214,
      width: c.light ? 640 : 600,
      color: dark ? t.cream : t.green,
      fontSize: c.light ? 42 : 34,
      lineHeight: c.light ? 1.12 : 1.2
    }),
    c.body ? body17(c.body, spec, { position: "absolute", left: 150, top: c.light ? 328 : 370, width: 550, color: dark ? t.cream2 : t.green2, fontSize: 15, lineHeight: 1.5 }) : null,
    watermark(c.chrome_right || "03", spec, mode, { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ].filter(Boolean));
}
function renderSplit7(spec) {
  const c = content11(spec, "split");
  const t = theme3();
  const items = array16(spec, "items", c.items);
  return page10("light", [
    sidebar(spec, c.sidebar, "light"),
    ...chrome5(spec, "light", c.chrome_left, c.chrome_right, c.foot_right),
    label18(c.kicker, spec, { position: "absolute", left: 116, top: 122, color: t.accent }),
    smallHeading(c.title, spec, { position: "absolute", left: 116, top: 154, width: 350, color: t.green, fontSize: 27, lineHeight: 1.16 }),
    body17(c.body, spec, { position: "absolute", left: 116, top: 282, width: 345, color: t.green2, fontSize: 12, lineHeight: 1.42 }),
    bulletList4(items, spec, "light", { position: "absolute", left: 116, top: 366, width: 390, gap: 7 }),
    box({ position: "absolute", right: 92, top: 128, width: 340, height: 304, backgroundColor: t.lightAlt, borderWidth: 1, borderColor: t.borderLight, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }, [
      label18(c.image_label, spec, { color: t.green2 }),
      body17(c.image_caption, spec, { width: 210, textAlign: "center", color: t.green2, fontSize: 12, lineHeight: 1.35 })
    ])
  ]);
}
function renderStats10(spec) {
  const c = content11(spec, "stats");
  const t = theme3();
  const metrics = array16(spec, "metrics", c.metrics);
  return page10("dark", [
    sidebar(spec, c.sidebar, "dark"),
    ...chrome5(spec, "dark", c.chrome_left, c.chrome_right, c.foot_right),
    heading2(c.title, spec, { position: "absolute", left: 114, top: 134, width: 650, color: t.cream, fontSize: 42, lineHeight: 1.15 }),
    box({ position: "absolute", left: 114, right: 110, top: 250, height: 118, flexDirection: "row", gap: 44 }, metrics.slice(0, 3).map(
      (m) => box({ width: 210, flexDirection: "column", borderBottomWidth: 1, borderColor: t.borderDark, paddingBottom: 22 }, [
        metric10(m.value || m, spec, { color: t.accent, fontSize: 52, lineHeight: 0.96, letterSpacing: -0.8 }),
        label18(m.label || "", spec, { marginTop: 14, color: t.cream2, fontSize: 9, lineHeight: 1.3, letterSpacing: 1 })
      ])
    )),
    body17(c.source, spec, { position: "absolute", left: 114, bottom: 82, width: 540, color: t.cream3, fontSize: 11, lineHeight: 1.4 }),
    watermark("05", spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ]);
}
function renderList5(spec) {
  const c = content11(spec, "list");
  const t = theme3();
  const items = array16(spec, "items", c.items);
  return page10("light", [
    sidebar(spec, c.sidebar, "light"),
    ...chrome5(spec, "light", c.chrome_left, c.chrome_right, c.foot_right),
    label18(c.kicker, spec, { position: "absolute", left: 110, top: 138, color: t.accent }),
    smallHeading(c.title, spec, { position: "absolute", left: 110, top: 170, width: 300, color: t.green, fontSize: 25, lineHeight: 1.18 }),
    body17(c.body, spec, { position: "absolute", left: 110, top: 302, width: 285, color: t.green2, fontSize: 13, lineHeight: 1.45 }),
    bulletList4(items, spec, "light", { position: "absolute", left: 488, top: 142, width: 350, gap: 17 })
  ]);
}
function renderQuote17(spec) {
  const c = content11(spec, "quote");
  const t = theme3();
  return page10("dark", [
    TextBlock('"', { position: "absolute", left: 106, top: 90, color: t.accent, fontSize: 104, lineHeight: 0.7, ...role20("display", spec, { fontSize: 104, lineHeight: 0.7, fontWeight: 400 }) }),
    heading2(c.quote, spec, { position: "absolute", left: 130, top: 176, width: 706, color: t.cream, fontSize: 43, lineHeight: 1.27, fontStyle: "italic" }),
    rule5(130, 392, 36, t.accent),
    label18(c.author, spec, { position: "absolute", left: 130, top: 420, color: t.cream }),
    label18(c.role, spec, { position: "absolute", left: 130, top: 446, color: t.cream3 }),
    watermark("07", spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ]);
}
function renderCompare5(spec) {
  const c = content11(spec, "compare");
  const t = theme3();
  const columns = array16(spec, "columns", c.columns);
  return page10("light", [
    sidebar(spec, c.sidebar, "light"),
    ...chrome5(spec, "light", c.chrome_left, c.chrome_right, c.foot_right),
    box({ position: "absolute", left: 104, top: 120, bottom: 86, width: 752, flexDirection: "row" }, columns.slice(0, 2).map(
      (col, index) => box({ width: 376, paddingLeft: index ? 48 : 0, paddingRight: index ? 0 : 48, borderRightWidth: index ? 0 : 1, borderColor: t.borderLight, flexDirection: "column" }, [
        label18(col.title, spec, { color: t.accent, marginBottom: 18 }),
        smallHeading(col.subtitle, spec, { color: t.green, fontSize: 24, lineHeight: 1.18, marginBottom: 18 }),
        body17(col.body, spec, { color: t.green2, fontSize: 12, lineHeight: 1.4, marginBottom: 20 }),
        bulletList4(col.items || [], spec, "light", { gap: 9 })
      ])
    ))
  ]);
}
function renderChart8(spec) {
  const c = content11(spec, "chart");
  const t = theme3();
  const bars = array16(spec, "bars", c.bars);
  const max = Math.max(...bars.map((b) => Number(b.value || 1)), 100);
  return page10("dark", [
    sidebar(spec, c.sidebar, "dark"),
    ...chrome5(spec, "dark", c.chrome_left, c.chrome_right, c.foot_right),
    heading2(c.title, spec, { position: "absolute", left: 112, top: 126, width: 520, color: t.cream, fontSize: 42, lineHeight: 1.15 }),
    body17(c.subtitle, spec, { position: "absolute", left: 114, top: 216, width: 420, color: t.cream2, fontSize: 13, lineHeight: 1.35 }),
    box({ position: "absolute", left: 115, top: 264, width: 700, height: 150, flexDirection: "column", gap: 11 }, bars.map((bar) => {
      const value15 = Number(bar.value || 0);
      const barWidth = Math.max(80, Math.round(value15 / max * 460));
      return box({ height: 22, flexDirection: "row", alignItems: "center" }, [
        metric10(value15, spec, { width: 52, color: t.accent, fontSize: 23, lineHeight: 1 }),
        label18(bar.label || "", spec, { width: 132, color: t.cream, fontSize: 10, letterSpacing: 1 }),
        box({ width: 480, height: 10, backgroundColor: t.bgAlt, borderWidth: 1, borderColor: t.borderDark }, [
          box({ width: barWidth, height: 8, backgroundColor: t.accent, opacity: 0.82 })
        ])
      ]);
    })),
    body17(c.source, spec, { position: "absolute", left: 114, bottom: 82, width: 520, color: t.cream3, fontSize: 11, lineHeight: 1.35 }),
    watermark("11", spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ]);
}
function renderEnd5(spec) {
  const c = content11(spec, "end");
  const t = theme3();
  return page10("dark", [
    metric10(c.marker, spec, { position: "absolute", left: 96, top: 84, color: t.accent, fontSize: 13, letterSpacing: 2.4 }),
    heading2(c.title, spec, { position: "absolute", left: 96, top: 176, width: 620, color: t.cream, fontSize: 58, lineHeight: 1.05 }),
    rule5(96, 290, 36, t.accent),
    body17(c.subtitle, spec, { position: "absolute", left: 96, top: 318, width: 520, color: t.cream2, fontSize: 17, lineHeight: 1.55 }),
    label18(c.contact, spec, { position: "absolute", left: 96, bottom: 94, color: t.cream2, fontSize: 9, letterSpacing: 1 }),
    label18(c.footer, spec, { position: "absolute", left: 96, bottom: 62, color: t.cream3, fontSize: 9, letterSpacing: 1 }),
    watermark("12", spec, "dark", { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ]);
}
var RENDERERS15 = {
  cover: renderCover18,
  chapter: (spec) => renderChapter7(spec, "chapter"),
  statement: (spec) => renderStatement8(spec, "statement"),
  split: renderSplit7,
  stats: renderStats10,
  list: renderList5,
  quote: renderQuote17,
  compare: renderCompare5,
  "chapter-9": (spec) => renderChapter7(spec, "chapter-9"),
  "statement-10": (spec) => renderStatement8(spec, "statement-10"),
  chart: renderChart8,
  end: renderEnd5
};
function renderGroveOrganicBrief(spec) {
  const variant = normalizeVariant22(spec);
  return (RENDERERS15[variant] || renderStatement8)(spec);
}

// templates/beautiful/mat-midcentury-board.mjs
var templateId24 = "mat-midcentury-board";
var CANVAS15 = { width: 960, height: 540 };
var PAGE_VARIANTS23 = ["cover", "statement", "split", "stats", "quote", "list", "compare", "chart", "end"];
var rendererContract24 = {
  template_id: templateId24,
  renderer_id: `artboard_satori.${templateId24}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "mat",
  implemented_page_variants: PAGE_VARIANTS23,
  page_family: {
    family_id: "mat",
    supported_page_variants: PAGE_VARIANTS23,
    variant_usage_policy: {
      singletons: ["cover", "quote", "end"],
      repeatable: ["statement", "split", "stats", "list", "compare", "chart"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/mat-1.png"
};
var DEFAULTS22 = {
  cover: {
    eyebrow: "Studio Name - 2026",
    title: "Craft\nMatters",
    subtitle: "Designed for the hands that build things. A one-line description of what this product does.",
    caption: "Tagline goes here",
    card_title: "Designed by Studio Name,\nthe precision studio tools lab.",
    card_body: "The world's most carefully considered product category.",
    footer_left: "Product Design - April 2026",
    footer_right: "MAT / 2026"
  },
  statement: {
    chrome_left: "The Thesis",
    chrome_right: "02",
    kicker: "Design Principle",
    title: "Every surface is a decision.",
    body: "The studio environment shapes the work that happens inside it. Materials that perform quietly let the maker stay in flow.",
    items: [
      "Surface texture calibrated for blade resistance without drag",
      "Grip underside prevents slip on any workbench material",
      "Grid lines printed in low-contrast ink - visible without competing"
    ],
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  split: {
    chrome_left: "The Object",
    chrome_right: "03",
    kicker: "Material Detail",
    title: "A one-line description of what this product does.",
    body: "A two-layer construction built for the way real studio work actually happens.",
    image_label: "Product Image",
    items: [
      "4mm recycled rubber base - weighted to stay flat",
      "Natural composite surface - self-healing up to 3000 uses",
      "Three colorways: Forest, Sand, Charcoal"
    ],
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  stats: {
    chrome_left: "By the Numbers",
    chrome_right: "04",
    title: "The numbers that define the product category.",
    metrics: [
      { value: "4.7k", label: "Units sold in the first 90 days of launch, across 12 countries." },
      { value: "3.2x", label: "Longer lifespan than the leading competitor in independent studio tests." },
      { value: "#1", label: "Top-rated product category by Studio Supply Journal for two consecutive years." }
    ],
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  quote: {
    title: "Good design is as little design as possible.",
    quote: "Good design is as little design as possible.",
    author: "Dieter Rams",
    role: "Designer"
  },
  list: {
    chrome_left: "Why It Matters",
    chrome_right: "06",
    kicker: "The Case",
    title: "What a studio tool should do for the maker.",
    body: "Four principles that informed every material and dimension decision in the product category's design.",
    items: [
      "Disappear when in use so the work takes all the attention",
      "Improve output quality through surface calibration, not just feel",
      "Last long enough to become a trusted part of the studio environment",
      "Be honest about what it is - no branding that competes with the work"
    ],
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  compare: {
    chrome_left: "Before / After",
    chrome_right: "07",
    title: "Before and after the material decision.",
    columns: [
      {
        label: "The Old Way",
        title: "Generic product category from a supply catalog.",
        body: "Works until it does not. Warps in heat, discolors with use, and feels like an afterthought.",
        items: [
          "Slips on polished surfaces without a grip layer",
          "Grooves deepen and skew precision over time",
          "Replaced every six months on average"
        ]
      },
      {
        label: "The New Way",
        title: "Product Name, purpose-built.",
        body: "A surface that gets better with use. The material compresses and recovers, keeping edges clean.",
        items: [
          "Self-heals around use lines, keeping the surface flat",
          "Grip base holds any workbench without adhesives",
          "3000-use tested lifespan - typically 2 to 3 years in daily use"
        ],
        accent: true
      }
    ],
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  chart: {
    chrome_left: "Performance",
    chrome_right: "08",
    title: "Lifespan by material category.",
    unit: "Units: months of daily studio use",
    bars: [
      { label: "PVC", value: 6, height: 20 },
      { label: "Rubber", value: 11, height: 37 },
      { label: "Glass", value: 18, height: 60 },
      { label: "Product", value: 30, height: 100, accent: true },
      { label: "Leather", value: 22, height: 73 }
    ],
    source: "Source: Independent Material Durability Study - Studio Lab 2025",
    footer_left: "Studio Name - Product Brief",
    footer_right: "Design Studio"
  },
  end: {
    kicker: "Ready to Build",
    title: "Start with the right surface.",
    body: "Order the Product Name at studio-website.com or find it at select independent supply stores worldwide.",
    card_title: "Get in touch.",
    card_body: "hello@studio-website.com\n@studio on all platforms\nAvailable in 40+ countries",
    footer_left: "Studio Name - 2026",
    footer_right: "studio-website.com"
  }
};
function theme4(spec) {
  const source = spec.theme?.colors || {};
  return {
    bg: "#232E26",
    bgAlt: "#2E3D30",
    cream: "#F0E8D2",
    paper: "#EDE6D0",
    paperAlt: "#E4DAC4",
    ink: "#1E2820",
    muted: "rgba(240, 232, 210, 0.58)",
    faint: "rgba(240, 232, 210, 0.28)",
    darkMuted: "rgba(30, 40, 32, 0.62)",
    darkFaint: "rgba(30, 40, 32, 0.28)",
    accent: source.primary || "#C07030",
    wood: "#7A4E24",
    borderDark: "rgba(240, 232, 210, 0.14)",
    borderLight: "rgba(30, 40, 32, 0.16)"
  };
}
function content12(spec, variant) {
  return { ...DEFAULTS22[variant] || DEFAULTS22.cover, ...spec.content || {} };
}
function array17(spec, key, fallback2 = []) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function normalizeVariant23(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS23.length) return PAGE_VARIANTS23[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS23) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("cover") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("statement")) return "statement";
  if (raw.includes("split") || raw.includes("detail")) return "split";
  if (raw.includes("stat") || raw.includes("data")) return "stats";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("compare") || raw.includes("comparison")) return "compare";
  if (raw.includes("chart")) return "chart";
  if (raw.includes("closing") || raw.includes("end")) return "end";
  return "list";
}
function role21(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function page11(spec, children = [], { light = false } = {}) {
  const t = theme4(spec);
  return box(
    {
      width: CANVAS15.width,
      height: CANVAS15.height,
      position: "relative",
      backgroundColor: light ? t.paper : t.bg,
      color: light ? t.ink : t.cream,
      overflow: "hidden"
    },
    [!light && glow2(t), ...children].filter(Boolean)
  );
}
function glow2(t) {
  return box({ position: "absolute", right: -115, bottom: -135, width: 540, height: 420, borderRadius: 270, backgroundColor: t.wood, opacity: 0.18 });
}
function label19(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    ...role21("label", spec, { fontWeight: 500, lineHeight: 1.05, letterSpacing: 1.7, textTransform: "uppercase" }),
    color: theme4(spec).accent,
    fontSize: 10,
    lineHeight: 1.05,
    letterSpacing: 1.7,
    ...style
  });
}
function body18(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    ...role21("body", spec, { fontWeight: 400, lineHeight: 1.45 }),
    color: theme4(spec).muted,
    fontSize: 15,
    lineHeight: 1.45,
    ...style
  });
}
function heading3(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    ...role21("display", spec, { fontWeight: 800, lineHeight: 0.93, letterSpacing: -1.1, textTransform: "none" }),
    color: theme4(spec).cream,
    fontSize: 54,
    lineHeight: 0.93,
    letterSpacing: -1.1,
    whiteSpace: "pre-line",
    ...style
  });
}
function chrome6(spec, c, light = false) {
  const t = theme4(spec);
  const color = light ? t.darkFaint : t.faint;
  const labelColor = light ? t.darkFaint : t.faint;
  return box({ position: "absolute", left: 54, right: 54, top: 30, height: 32, borderBottomWidth: 1, borderColor: color, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, [
    label19(c.chrome_left, spec, { color: labelColor, fontSize: 9 }),
    label19(c.chrome_right, spec, { color: labelColor, fontSize: 9, textAlign: "right" })
  ]);
}
function foot2(spec, c, light = false) {
  const t = theme4(spec);
  const color = light ? t.darkFaint : t.faint;
  const labelColor = light ? t.darkFaint : t.faint;
  return box({ position: "absolute", left: 54, right: 54, bottom: 32, height: 30, borderTopWidth: 1, borderColor: color, paddingTop: 12, flexDirection: "row", justifyContent: "space-between" }, [
    label19(c.footer_left, spec, { color: labelColor, fontSize: 9 }),
    label19(c.footer_right, spec, { color: labelColor, fontSize: 9, textAlign: "right" })
  ]);
}
function infoCard(spec, title2, text10, style = {}) {
  const t = theme4(spec);
  return box({ backgroundColor: t.paper, color: t.ink, padding: "24px 28px", flexDirection: "column", ...style }, [
    TextBlock(String(title2 || ""), { ...role21("display", spec, { fontWeight: 700, lineHeight: 1.05 }), color: t.ink, fontSize: 22, lineHeight: 1.06, whiteSpace: "pre-line" }),
    TextBlock(String(text10 || ""), { ...role21("body", spec, { fontWeight: 400, lineHeight: 1.42 }), color: t.darkMuted, fontSize: 13, lineHeight: 1.42, marginTop: 14, whiteSpace: "pre-line" })
  ]);
}
function bulletList5(spec, items, { light = false, width = 300, fontSize = 15, gap = 12 } = {}) {
  const t = theme4(spec);
  return box({ width, flexDirection: "column", gap }, items.map(
    (item) => box({ flexDirection: "row", gap: 10, alignItems: "flex-start" }, [
      TextBlock("-", { ...role21("label", spec, { fontWeight: 500 }), color: t.accent, fontSize: 14, lineHeight: 1.2, width: 14 }),
      body18(item, spec, { color: light ? t.darkMuted : t.muted, fontSize, lineHeight: 1.36, flex: 1 })
    ])
  ));
}
function renderCover19(spec) {
  const t = theme4(spec);
  const c = content12(spec, "cover");
  return page11(spec, [
    box({ position: "absolute", left: 56, top: 64, width: 440, flexDirection: "column" }, [
      label19(c.eyebrow, spec),
      heading3(c.title, spec, { marginTop: 24, width: 410, fontSize: 88, lineHeight: 0.88 })
    ]),
    box({ position: "absolute", left: 610, top: 108, width: 260, flexDirection: "column" }, [
      body18(c.subtitle, spec, { width: 246, fontSize: 16, lineHeight: 1.44 }),
      body18(c.caption, spec, { marginTop: 18, width: 210, color: t.faint, fontSize: 12 })
    ]),
    infoCard(spec, c.card_title, c.card_body, { position: "absolute", left: 58, bottom: 72, width: 276, minHeight: 128 }),
    label19(c.footer_left, spec, { position: "absolute", left: 360, bottom: 86, color: t.faint }),
    label19(c.footer_right, spec, { position: "absolute", right: 44, bottom: 32, color: t.faint })
  ]);
}
function renderStatement9(spec) {
  const c = content12(spec, "statement");
  const items = array17(spec, "items", c.items);
  return page11(spec, [
    chrome6(spec, c),
    box({ position: "absolute", left: 56, top: 112, width: 430, flexDirection: "column" }, [
      label19(c.kicker, spec),
      heading3(c.title, spec, { marginTop: 20, width: 390, fontSize: 61, lineHeight: 0.92 })
    ]),
    box({ position: "absolute", right: 68, top: 132, width: 340, flexDirection: "column" }, [
      body18(c.body, spec, { width: 318, fontSize: 17, lineHeight: 1.48 }),
      box({ height: 1, backgroundColor: theme4(spec).borderDark, width: 318, marginTop: 28, marginBottom: 22 }),
      bulletList5(spec, items, { width: 322, fontSize: 15, gap: 15 })
    ]),
    foot2(spec, c)
  ]);
}
function renderSplit8(spec) {
  const c = content12(spec, "split");
  const items = array17(spec, "items", c.items);
  const t = theme4(spec);
  return page11(spec, [
    chrome6(spec, c),
    box({ position: "absolute", left: 56, top: 105, width: 252, flexDirection: "column" }, [
      label19(c.kicker, spec),
      heading3(c.title, spec, { marginTop: 18, fontSize: 42, lineHeight: 0.98, width: 242 }),
      body18(c.body, spec, { marginTop: 18, width: 230, fontSize: 15, lineHeight: 1.45 })
    ]),
    box({ position: "absolute", left: 352, top: 108, width: 252, height: 306, borderWidth: 1, borderColor: t.borderDark, backgroundColor: "rgba(240,232,210,0.06)", alignItems: "center", justifyContent: "center" }, [
      label19(c.image_label, spec, { color: t.faint, textAlign: "center" })
    ]),
    box({ position: "absolute", right: 62, top: 136, width: 260 }, [
      bulletList5(spec, items, { width: 258, fontSize: 15, gap: 18 })
    ]),
    foot2(spec, c)
  ]);
}
function renderStats11(spec) {
  const c = content12(spec, "stats");
  const metrics = array17(spec, "metrics", c.metrics);
  const t = theme4(spec);
  return page11(spec, [
    chrome6(spec, c),
    heading3(c.title, spec, { position: "absolute", left: 56, top: 110, width: 660, fontSize: 46, lineHeight: 0.98 }),
    box({ position: "absolute", left: 56, right: 56, bottom: 112, height: 184, flexDirection: "row" }, metrics.slice(0, 3).map(
      (metric19, index) => box({ width: 282, padding: index === 0 ? "0 30px 0 0" : "0 30px", borderRightWidth: index < 2 ? 1 : 0, borderColor: t.borderDark, flexDirection: "column", justifyContent: "center" }, [
        TextBlock(String(metric19.value || ""), { ...role21("metric", spec, { fontWeight: 800, lineHeight: 0.95, letterSpacing: -1 }), color: index === 1 ? t.accent : t.cream, fontSize: 64, lineHeight: 0.95 }),
        body18(metric19.label, spec, { marginTop: 18, fontSize: 14, lineHeight: 1.36, width: 210 })
      ])
    )),
    foot2(spec, c)
  ]);
}
function renderQuote18(spec) {
  const c = content12(spec, "quote");
  const t = theme4(spec);
  return page11(spec, [
    TextBlock('"', { ...role21("display", spec, { fontWeight: 800, lineHeight: 0.6 }), position: "absolute", left: 118, top: 76, color: t.accent, fontSize: 114, lineHeight: 0.6 }),
    heading3(c.quote, spec, { position: "absolute", left: 176, top: 178, width: 610, fontSize: 48, lineHeight: 1.14, textAlign: "center" }),
    box({ position: "absolute", left: 382, top: 384, width: 196, flexDirection: "column", alignItems: "center" }, [
      label19(c.author, spec, { textAlign: "center" }),
      label19(c.role, spec, { marginTop: 10, color: t.faint, textAlign: "center" })
    ])
  ]);
}
function renderList6(spec) {
  const c = content12(spec, "list");
  const items = array17(spec, "items", c.items);
  const t = theme4(spec);
  return page11(spec, [
    chrome6(spec, c, true),
    box({ position: "absolute", left: 56, top: 112, width: 318, flexDirection: "column" }, [
      label19(c.kicker, spec),
      heading3(c.title, spec, { color: t.ink, marginTop: 20, width: 300, fontSize: 42, lineHeight: 1 }),
      body18(c.body, spec, { color: t.darkMuted, marginTop: 22, width: 286, fontSize: 15, lineHeight: 1.45 })
    ]),
    box({ position: "absolute", right: 66, top: 128, width: 468 }, [
      bulletList5(spec, items, { light: true, width: 468, fontSize: 18, gap: 22 })
    ]),
    foot2(spec, c, true)
  ], { light: true });
}
function renderCompare6(spec) {
  const c = content12(spec, "compare");
  const columns = array17(spec, "columns", c.columns);
  const t = theme4(spec);
  return page11(spec, [
    chrome6(spec, c),
    box({ position: "absolute", left: 56, right: 56, top: 114, bottom: 92, flexDirection: "row" }, [
      comparePanel2(spec, columns[0] || {}, { width: 392 }),
      box({ width: 1, margin: "0 38px", backgroundColor: t.borderDark }),
      comparePanel2(spec, columns[1] || {}, { width: 392 })
    ]),
    foot2(spec, c)
  ]);
}
function comparePanel2(spec, column, style = {}) {
  const t = theme4(spec);
  return box({ flexDirection: "column", ...style }, [
    label19(column.label, spec, { color: column.accent ? t.accent : t.faint }),
    heading3(column.title, spec, { marginTop: 18, fontSize: 32, lineHeight: 1.05, width: style.width || 360 }),
    body18(column.body, spec, { marginTop: 18, fontSize: 15, lineHeight: 1.42, width: style.width || 360 }),
    box({ height: 1, backgroundColor: t.borderDark, width: style.width || 360, marginTop: 22, marginBottom: 18 }),
    bulletList5(spec, column.items || [], { width: style.width || 360, fontSize: 14, gap: 12 })
  ]);
}
function renderChart9(spec) {
  const c = content12(spec, "chart");
  const bars = array17(spec, "bars", c.bars);
  const t = theme4(spec);
  return page11(spec, [
    chrome6(spec, c),
    box({ position: "absolute", left: 56, right: 56, top: 100, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, [
      heading3(c.title, spec, { width: 470, fontSize: 42, lineHeight: 1 }),
      label19(c.unit, spec, { color: t.faint, width: 250, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 110, right: 110, top: 208, height: 210, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, bars.slice(0, 5).map(
      (bar) => box({ width: 96, height: 210, flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }, [
        TextBlock(String(bar.value || ""), { ...role21("metric", spec, { fontWeight: 700, lineHeight: 1 }), color: bar.accent ? t.accent : t.cream, fontSize: 18, lineHeight: 1, marginBottom: 8 }),
        box({ width: 56, height: Math.max(12, Math.round(Number(bar.height || 20) * 1.32)), backgroundColor: bar.accent ? t.accent : "rgba(240,232,210,0.3)" }),
        label19(bar.label, spec, { color: t.faint, fontSize: 9, textAlign: "center", marginTop: 12, width: 90 })
      ])
    )),
    box({ position: "absolute", left: 94, right: 94, top: 427, height: 1, backgroundColor: t.borderDark }),
    label19(c.source, spec, { position: "absolute", left: 56, bottom: 78, color: t.faint, fontSize: 8 }),
    foot2(spec, c)
  ]);
}
function renderEnd6(spec) {
  const c = content12(spec, "end");
  const t = theme4(spec);
  return page11(spec, [
    box({ position: "absolute", left: 76, top: 116, width: 470, flexDirection: "column" }, [
      label19(c.kicker, spec),
      heading3(c.title, spec, { marginTop: 20, width: 420, fontSize: 59, lineHeight: 0.96 }),
      body18(c.body, spec, { marginTop: 24, width: 350, fontSize: 16, lineHeight: 1.44 })
    ]),
    infoCard(spec, c.card_title, c.card_body, { position: "absolute", right: 78, top: 186, width: 282, minHeight: 150 }),
    box({ position: "absolute", left: 76, right: 76, bottom: 52, borderTopWidth: 1, borderColor: t.borderDark, paddingTop: 18, flexDirection: "row", justifyContent: "space-between" }, [
      label19(c.footer_left, spec, { color: t.faint }),
      label19(c.footer_right, spec, { color: t.faint, textAlign: "right" })
    ])
  ]);
}
var RENDERERS16 = {
  cover: renderCover19,
  statement: renderStatement9,
  split: renderSplit8,
  stats: renderStats11,
  quote: renderQuote18,
  list: renderList6,
  compare: renderCompare6,
  chart: renderChart9,
  end: renderEnd6
};
function renderMatMidcenturyBoard(spec) {
  const variant = normalizeVariant23(spec);
  return (RENDERERS16[variant] || renderStatement9)(spec);
}

// templates/beautiful/dense-panel-grid.mjs
var templateId25 = "dense-panel-grid";
var PAGE_VARIANTS24 = [
  "cover",
  "toc",
  "stats",
  "features",
  "chart",
  "section",
  "quote",
  "cta",
  "consult",
  "chart2",
  "process2",
  "matrix2"
];
var rendererContract25 = {
  template_id: templateId25,
  renderer_id: `artboard_satori.${templateId25}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "neo-grid-bold",
  implemented_page_variants: PAGE_VARIANTS24,
  page_family: {
    family_id: "neo-grid-bold",
    supported_page_variants: PAGE_VARIANTS24,
    variant_usage_policy: {
      singletons: ["cover", "toc", "section", "quote", "cta"],
      repeatable: ["stats", "features", "chart", "consult", "chart2", "process2", "matrix2"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/neo-grid-bold-1.png"
};
var CANVAS16 = { width: 960, height: 540 };
var GRID = { inset: 20, gap: 6, columns: 12, rows: 8 };
var CELL_W = (CANVAS16.width - GRID.inset * 2 - GRID.gap * (GRID.columns - 1)) / GRID.columns;
var CELL_H = (CANVAS16.height - GRID.inset * 2 - GRID.gap * (GRID.rows - 1)) / GRID.rows;
var DEFAULTS23 = {
  cover: {
    eyebrow: "01 / 12",
    title: "The future of data-driven finance",
    subtitle: "All rights reserved.",
    footer: "2025 DIGITS"
  },
  toc: {
    title: "Contents",
    items: [
      { label: "01 / Introduction", title: "Digits in numbers", body: "Where we are and what the platform handles today." },
      { label: "02 / Product", title: "Key features", body: "Three primitives that power decision-making at scale." },
      { label: "03 / Market", title: "Penetration and growth", body: "Where we are gaining ground, and where we are next." },
      { label: "04 / Vision", title: "What comes next", body: "The roadmap for the next four quarters." },
      { label: "05 / Voice", title: "From our partners", body: "Why teams are choosing the platform." },
      { label: "06 / Action", title: "Next steps", body: "Three things to take away from today." }
    ]
  },
  stats: {
    eyebrow: "Market penetration",
    title: "Digits in numbers",
    subtitle: "Empowering businesses with data-driven financial insights. The platform is reshaping real-time financial decision-making across markets.",
    metrics: [
      { value: "12.8M", label: "Transactions processed" },
      { value: "41M", label: "Total revenue impacted" },
      { value: "15.4M", label: "Users engaged" },
      { value: "85.6M", label: "Data points analyzed" }
    ]
  },
  features: {
    title: "Key features",
    eyebrow: "Three primitives",
    items: [
      { title: "Seamless transactions", body: "Effortless and secure digital payments with real-time processing." },
      { title: "Data insights", body: "Leverage analytics to uncover patterns and surface new opportunities." },
      { title: "Risk modelling", body: "Predictive models score risk in milliseconds so teams can act sooner." }
    ]
  },
  chart: {
    eyebrow: "Section 03 / Market",
    title: "Market penetration doubled.",
    subtitle: "Year-on-year reach across our six largest regions. The platform now touches one in three small-business accounts.",
    labels: ["NA", "EU", "LATAM", "APAC", "MENA", "SSA"],
    seriesA: [42, 55, 36, 64, 48, 30],
    seriesB: [78, 88, 62, 94, 72, 54]
  },
  section: {
    eyebrow: "Section / Vision",
    number: "02",
    title: "Build the engine of modern money.",
    subtitle: "The next decade of finance belongs to platforms that can model the world in real time and act on it without a human in the loop."
  },
  quote: {
    quote: "The platform replaced four legacy systems and a quarterly committee. We now decide in minutes what used to take a month.",
    author: "Marta Aguilar",
    context: "CFO / Mid-market retailer"
  },
  cta: {
    eyebrow: "Take three things away",
    title: "Next steps",
    items: [
      { label: "01 / Today", title: "Pilot one workflow", body: "Pick a single decision your team makes weekly and benchmark against the current process." },
      { label: "02 / Next month", title: "Scale the wedge", body: "Expand the pilot to two adjacent workflows and share the playbook." },
      { label: "03 / This quarter", title: "Make it default", body: "Retire the legacy stack for that domain and fund the next bet." }
    ]
  },
  consult: {
    eyebrow: "Action title / 09",
    title: "The trust gap is built in the first 72 hours, not the first 7 days.",
    columns: [
      {
        title: "What we found",
        metric: "Three behavioural signals",
        bullets: ["Email open #2 lifts retention", "Personal salutation doubles cohort quality", "Reply received is the largest lever"]
      },
      {
        title: "Why it matters",
        metric: "$4.1M projected retained ARR",
        bullets: ["The first three days carry the highest attention", "Every interaction here replaces four later touches", "Signal replicated across three cohorts"]
      },
      {
        title: "What to do",
        metric: "Pilot scope: top-decile signups",
        bullets: ["Rewrite emails 1-3", "Route every signup to a named human", "Instrument the 72-hour window"]
      }
    ]
  },
  chart2: {
    eyebrow: "Section / Evidence",
    title: "The curve bends at day three.",
    subtitle: "Cohorts with written welcome and human reply retain at roughly 2x the templated cohort.",
    labels: ["D0", "D7", "D14", "D30", "D45", "D60", "D90"]
  },
  process2: {
    title: "From insight to default, in five moves.",
    subtitle: "A repeatable path each pilot follows before it is allowed to graduate to default experience.",
    items: [
      { label: "01 / Frame", title: "Hypothesise", body: "Translate the insight into a testable hypothesis." },
      { label: "02 / Design", title: "Sketch", body: "Smallest end-to-end change for a clean test." },
      { label: "03 / Pilot", title: "Ship 50/50", body: "Holdout in one segment for two cycles." },
      { label: "04 / Read", title: "Decide", body: "Kill, scale, or extend based on registered metrics." },
      { label: "05 / Default", title: "Graduate", body: "Promote to default and retire the legacy path." },
      { label: "Outcome", title: "New default", body: "A result every customer feels." }
    ]
  },
  matrix2: {
    title: "Where each pilot earns its keep.",
    subtitle: "Scored against the four levers that matter most this cycle.",
    headers: ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox search"],
    rows: [
      ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
      ["Build cost", "Low", "Medium", "Low"],
      ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
      ["Risk to power users", "None", "Material", "Soft, reversible"]
    ]
  }
};
function colors18(spec) {
  const source = spec.theme?.colors || {};
  return {
    bg: source.background || "#ECECE8",
    paper: source.panel || source.surface || "#F5F4EF",
    ink: source.text || "#0A0A0A",
    lemon: source.accent || source.primary || "#E6FF3D",
    muted: source.muted || "#8A8A85"
  };
}
var ROLE_FONT_RESOLVERS3 = {
  display: (spec, style) => fontRole("display", spec, style),
  body: (spec, style) => fontRole("body", spec, style),
  label: (spec, style) => fontRole("label", spec, style),
  metric: (spec, style) => fontRole("metric", spec, style)
};
function role22(roleName, spec, style = {}) {
  const resolver = ROLE_FONT_RESOLVERS3[roleName] || ((inputSpec, inputStyle) => fontRole(roleName, inputSpec, inputStyle));
  return resolver(spec, style);
}
function text6(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function list3(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const value15 = spec.content?.[key];
    if (Array.isArray(value15) && value15.length) return value15;
  }
  return fallback2;
}
function objectList3(spec, keys, fallback2 = []) {
  return list3(spec, keys, fallback2).filter((item) => item && typeof item === "object");
}
function upper6(value15) {
  return String(value15 || "").toUpperCase();
}
function normalizeVariant24(spec) {
  const sourceClass = `${spec.page_family_source?.source_class || ""}`.toLowerCase();
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase();
  const value15 = `${sourceClass} ${raw}`;
  for (const variant of PAGE_VARIANTS24) {
    if (value15.includes(variant)) return variant;
  }
  if (value15.includes("s-cover") || value15.includes("cover")) return "cover";
  if (value15.includes("s-toc") || value15.includes("agenda") || value15.includes("toc")) return "toc";
  if (value15.includes("s-stats") || value15.includes("stat") || value15.includes("data")) return "stats";
  if (value15.includes("s-features") || value15.includes("feature")) return "features";
  if (value15.includes("s-chart2") || value15.includes("curve")) return "chart2";
  if (value15.includes("s-chart") || value15.includes("chart")) return "chart";
  if (value15.includes("s-section") || value15.includes("section")) return "section";
  if (value15.includes("s-quote") || value15.includes("quote")) return "quote";
  if (value15.includes("s-cta") || value15.includes("closing") || value15.includes("cta")) return "cta";
  if (value15.includes("s-consult") || value15.includes("detail")) return "consult";
  if (value15.includes("s-process2") || value15.includes("process") || value15.includes("timeline")) return "process2";
  if (value15.includes("s-matrix2") || value15.includes("matrix") || value15.includes("comparison")) return "matrix2";
  return "cover";
}
function pageNumber2(spec, variant) {
  const sourceIndex = spec.page_family_source?.source_slide_index;
  const index = sourceIndex || PAGE_VARIANTS24.indexOf(variant) + 1;
  return `${String(index).padStart(2, "0")} / 12`;
}
function gridRect(col, row, colSpan, rowSpan) {
  return {
    left: Math.round(GRID.inset + (col - 1) * (CELL_W + GRID.gap)),
    top: Math.round(GRID.inset + (row - 1) * (CELL_H + GRID.gap)),
    width: Math.round(CELL_W * colSpan + GRID.gap * (colSpan - 1)),
    height: Math.round(CELL_H * rowSpan + GRID.gap * (rowSpan - 1))
  };
}
function panel(spec, col, row, colSpan, rowSpan, options = {}, children = []) {
  const theme8 = colors18(spec);
  return box(
    {
      position: "absolute",
      ...gridRect(col, row, colSpan, rowSpan),
      overflow: "hidden",
      backgroundColor: options.backgroundColor || theme8.paper,
      color: options.color || theme8.ink,
      padding: options.padding ?? 16,
      flexDirection: options.flexDirection || "column",
      justifyContent: options.justifyContent || "flex-start",
      alignItems: options.alignItems || "stretch",
      borderWidth: options.borderWidth || 0,
      borderColor: options.borderColor || theme8.ink,
      ...options.style
    },
    children
  );
}
function pageTag(spec, variant, mode = "paper") {
  const theme8 = colors18(spec);
  const backgroundColor = mode === "lemon" ? theme8.lemon : mode === "ink" ? theme8.ink : theme8.paper;
  const color = mode === "ink" ? theme8.paper : theme8.ink;
  return TextBlock(pageNumber2(spec, variant), {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor,
    color,
    padding: "7px 11px",
    ...role22("metric", spec, { fontSize: 11, lineHeight: 1, letterSpacing: 1, fontWeight: 700 })
  });
}
function label20(value15, spec, style = {}) {
  return TextBlock(upper6(value15), {
    color: colors18(spec).ink,
    ...role22("label", spec, { fontSize: 8, lineHeight: 1.1, letterSpacing: 1.2, fontWeight: 700 }),
    ...style
  });
}
function body19(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: colors18(spec).ink,
    ...role22("body", spec, { fontSize: 11, lineHeight: 1.35, fontWeight: 400 }),
    ...style
  });
}
function headline7(value15, spec, style = {}) {
  return Title(upper6(value15).replace(/\s+/g, " "), {
    color: colors18(spec).ink,
    ...role22("display", spec, { fontSize: 42, lineHeight: 0.92, fontWeight: 900, letterSpacing: -1 }),
    textTransform: "uppercase",
    ...style
  });
}
function metric11(value15, spec, style = {}) {
  return TextBlock(String(value15), {
    color: colors18(spec).ink,
    ...role22("metric", spec, { fontSize: 42, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }),
    ...style
  });
}
function blockMark(spec, style = {}) {
  const theme8 = colors18(spec);
  return box(
    { width: 28, height: 28, flexDirection: "row", flexWrap: "wrap", gap: 2, ...style },
    [0, 1, 2, 3].map(
      (index) => box({
        width: 13,
        height: 13,
        backgroundColor: index === 0 || index === 3 ? theme8.ink : "transparent"
      })
    )
  );
}
function qrTile(spec, size = 45, invert = false) {
  const theme8 = colors18(spec);
  const cells = Array.from({ length: 25 }, (_, index) => index);
  return box(
    { width: size, height: size, flexDirection: "row", flexWrap: "wrap", gap: 1 },
    cells.map(
      (index) => box({
        width: (size - 4) / 5,
        height: (size - 4) / 5,
        backgroundColor: index % 2 === 0 ? invert ? theme8.lemon : theme8.ink : invert ? theme8.ink : theme8.lemon
      })
    )
  );
}
function photoTexture(spec, children = []) {
  const theme8 = colors18(spec);
  return box(
    {
      position: "absolute",
      inset: 0,
      backgroundColor: theme8.ink,
      overflow: "hidden"
    },
    [
      box({ position: "absolute", left: 18, top: 22, width: 70, height: 210, borderWidth: 1, borderColor: "#333333" }),
      box({ position: "absolute", left: 48, top: 52, width: 1, height: 168, backgroundColor: "#333333" }),
      box({ position: "absolute", right: 24, bottom: 42, width: 82, height: 1, backgroundColor: "#333333" }),
      ...children
    ]
  );
}
function frame12(spec, variant, children, options = {}) {
  const theme8 = colors18(spec);
  return box(
    {
      width: CANVAS16.width,
      height: CANVAS16.height,
      position: "relative",
      backgroundColor: options.backgroundColor || theme8.bg,
      overflow: "hidden",
      color: theme8.ink
    },
    [...children, pageTag(spec, variant, options.pageTagMode)]
  );
}
function splitTitle2(value15, maxWords = 3) {
  const words = upper6(value15).replace(/[.]+$/g, "").split(/\s+/).filter(Boolean);
  const lines = [];
  for (let index = 0; index < words.length; index += maxWords) {
    lines.push(words.slice(index, index + maxWords).join(" "));
  }
  return lines.slice(0, 4).join("\n");
}
function renderCover20(spec) {
  const theme8 = colors18(spec);
  const copy = { ...DEFAULTS23.cover, ...spec.content };
  return frame12(spec, "cover", [
    panel(spec, 1, 1, 3, 8, { padding: 0, backgroundColor: theme8.ink }, [photoTexture(spec)]),
    panel(spec, 4, 1, 5, 5, { backgroundColor: theme8.lemon, padding: 24 }, [
      qrTile(spec, 45),
      box({ flex: 1 }),
      blockMark(spec, { marginTop: 94 })
    ]),
    panel(spec, 4, 6, 5, 3, { backgroundColor: theme8.lemon, padding: 22, justifyContent: "center" }, [
      headline7(splitTitle2(text6(spec, "title", copy.title), 2), spec, {
        width: 330,
        fontSize: 33,
        lineHeight: 0.94
      })
    ]),
    panel(spec, 9, 1, 4, 5, { padding: 0, backgroundColor: theme8.ink }, [photoTexture(spec)]),
    panel(spec, 9, 6, 4, 3, { backgroundColor: theme8.paper, padding: 22, justifyContent: "space-between" }, [
      label20(text6(spec, "footer", copy.footer), spec, { fontSize: 8 }),
      body19(text6(spec, "subtitle", copy.subtitle), spec, { color: theme8.muted, fontSize: 9, lineHeight: 1.35 })
    ])
  ]);
}
function renderToc(spec) {
  const theme8 = colors18(spec);
  const items = objectList3(spec, ["items", "bullets"], DEFAULTS23.toc.items).slice(0, 6);
  return frame12(spec, "toc", [
    panel(spec, 1, 1, 12, 2, { padding: "22px 24px", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
      headline7(text6(spec, "title", DEFAULTS23.toc.title), spec, { fontSize: 45, lineHeight: 0.9 }),
      blockMark(spec)
    ]),
    ...items.map((item, index) => {
      const col = 1 + index % 3 * 4;
      const row = index < 3 ? 3 : 6;
      const isLemon = index === 1 || index === 5;
      const isInk = index === 4;
      return panel(
        spec,
        col,
        row,
        4,
        3,
        {
          backgroundColor: isInk ? theme8.ink : isLemon ? theme8.lemon : theme8.paper,
          color: isInk ? theme8.paper : theme8.ink,
          padding: 22,
          justifyContent: "center"
        },
        [
          label20(item.label || `${String(index + 1).padStart(2, "0")} / Section`, spec, {
            color: isInk ? theme8.paper : theme8.ink,
            opacity: isInk ? 0.75 : 1,
            marginBottom: 16
          }),
          headline7(item.title || `Section ${index + 1}`, spec, {
            color: isInk ? theme8.paper : theme8.ink,
            fontSize: 20,
            lineHeight: 1.05,
            marginBottom: 10
          }),
          body19(item.body || "", spec, { color: isInk ? theme8.paper : theme8.ink, opacity: 0.84, fontSize: 9, lineHeight: 1.45 })
        ]
      );
    })
  ]);
}
function renderStats12(spec) {
  const theme8 = colors18(spec);
  const metrics = objectList3(spec, ["metrics", "stats"], DEFAULTS23.stats.metrics);
  const small = metrics.slice(0, 3);
  const big = metrics[3] || { value: "85.6M", label: "Data points analyzed" };
  return frame12(spec, "stats", [
    panel(spec, 1, 1, 2, 8, { backgroundColor: theme8.lemon, padding: 14, justifyContent: "space-between" }, [
      metric11(text6(spec, "eyebrow", "+98.7%"), spec, { fontSize: 24 }),
      label20(text6(spec, "subtitle_label", DEFAULTS23.stats.eyebrow), spec, { fontSize: 11, lineHeight: 1.1, marginBottom: 36 })
    ]),
    panel(spec, 3, 1, 4, 8, { padding: 18, justifyContent: "space-between" }, [
      box({ flexDirection: "column" }, [
        headline7(splitTitle2(text6(spec, "title", DEFAULTS23.stats.title), 1), spec, { fontSize: 36, lineHeight: 0.95, marginBottom: 16 }),
        body19(text6(spec, "subtitle", DEFAULTS23.stats.subtitle), spec, { fontSize: 11, lineHeight: 1.45 })
      ]),
      label20("Snapshot / Q1 2026", spec, { fontSize: 8 })
    ]),
    ...small.map(
      (item, index) => panel(spec, 7 + index % 2 * 3, 1 + Math.floor(index / 2) * 2, 3, 2, { padding: 14 }, [
        metric11(item.value, spec, { fontSize: 34, marginBottom: 6 }),
        label20(item.label, spec, { fontSize: 8, lineHeight: 1.2 })
      ])
    ),
    panel(spec, 7, 5, 6, 4, { backgroundColor: theme8.lemon, padding: 18, justifyContent: "space-between" }, [
      label20(big.label || "Data points analyzed", spec, { fontSize: 9 }),
      metric11(big.value || "85.6M", spec, { fontSize: 78, lineHeight: 0.85 }),
      TextBlock("->", { color: theme8.ink, fontSize: 26, fontWeight: 900, alignSelf: "flex-end" })
    ])
  ], { pageTagMode: "lemon" });
}
function renderFeatures2(spec) {
  const theme8 = colors18(spec);
  const items = objectList3(spec, ["items", "features", "bullets"], DEFAULTS23.features.items).slice(0, 3);
  return frame12(spec, "features", [
    panel(spec, 1, 1, 12, 2, { padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
      headline7(text6(spec, "title", DEFAULTS23.features.title), spec, { fontSize: 42 }),
      label20(text6(spec, "eyebrow", DEFAULTS23.features.eyebrow), spec, { fontSize: 10 })
    ]),
    ...items.map(
      (item, index) => panel(spec, 1 + index * 4, 3, 4, 6, { padding: 14 }, [
        box({ height: 110, backgroundColor: theme8.ink, position: "relative", marginBottom: 15, overflow: "hidden" }, [
          photoTexture(spec),
          TextBlock(`0${index + 1}`, {
            position: "absolute",
            left: 8,
            top: 8,
            backgroundColor: theme8.lemon,
            padding: "3px 6px",
            color: theme8.ink,
            ...role22("metric", spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 })
          })
        ]),
        headline7(item.title || `Feature ${index + 1}`, spec, { fontSize: 18, lineHeight: 1.05, marginBottom: 10 }),
        body19(item.body || "", spec, { fontSize: 10.5, lineHeight: 1.35 })
      ])
    )
  ]);
}
function renderChart10(spec) {
  const theme8 = colors18(spec);
  const labels = list3(spec, ["labels"], DEFAULTS23.chart.labels).slice(0, 6);
  const seriesA = list3(spec, ["seriesA"], DEFAULTS23.chart.seriesA);
  const seriesB = list3(spec, ["seriesB"], DEFAULTS23.chart.seriesB);
  return frame12(spec, "chart", [
    panel(spec, 1, 1, 5, 8, { backgroundColor: theme8.ink, color: theme8.paper, padding: 20, justifyContent: "space-between" }, [
      box({ flexDirection: "column" }, [
        label20(text6(spec, "eyebrow", DEFAULTS23.chart.eyebrow), spec, { color: theme8.paper, opacity: 0.75, marginBottom: 18 }),
        headline7(splitTitle2(text6(spec, "title", DEFAULTS23.chart.title), 1), spec, { color: theme8.paper, fontSize: 38, lineHeight: 0.94 })
      ]),
      body19(text6(spec, "subtitle", DEFAULTS23.chart.subtitle), spec, { color: theme8.paper, opacity: 0.9, fontSize: 10.5 }),
      label20("FY24 vs FY25 / Indexed", spec, { color: theme8.paper, opacity: 0.72, fontSize: 8 })
    ]),
    panel(spec, 6, 1, 7, 8, { padding: 18, justifyContent: "space-between" }, [
      box({ flexDirection: "row", gap: 20, marginBottom: 14 }, [
        label20("\u25A0 FY24", spec, { fontSize: 8 }),
        label20("\u25A0 FY25", spec, { fontSize: 8, color: theme8.ink })
      ]),
      box({ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 14, borderBottomWidth: 2, borderColor: theme8.ink, paddingBottom: 12 }, labels.map(
        (labelText4, index) => box({ flex: 1, height: 280, flexDirection: "column", justifyContent: "flex-end", gap: 4 }, [
          box({ height: Math.max(18, seriesA[index] * 2.2), backgroundColor: theme8.ink }),
          box({ height: Math.max(18, seriesB[index] * 2.2), backgroundColor: theme8.lemon, borderWidth: 1, borderColor: theme8.ink }),
          label20(labelText4, spec, { textAlign: "center", fontSize: 7, marginTop: 6 })
        ])
      ))
    ])
  ], { pageTagMode: "ink" });
}
function renderSection2(spec) {
  const theme8 = colors18(spec);
  return frame12(spec, "section", [
    panel(spec, 1, 1, 4, 8, { backgroundColor: theme8.lemon, padding: 20, justifyContent: "space-between" }, [
      label20(text6(spec, "eyebrow", DEFAULTS23.section.eyebrow), spec, { fontSize: 9 }),
      metric11(text6(spec, "number", DEFAULTS23.section.number), spec, { fontSize: 154, lineHeight: 0.82, letterSpacing: -5 }),
      blockMark(spec, { alignSelf: "flex-end" })
    ]),
    panel(spec, 5, 1, 8, 8, { backgroundColor: theme8.ink, color: theme8.paper, padding: 22, justifyContent: "space-between" }, [
      label20("What comes next", spec, { color: theme8.paper, opacity: 0.7 }),
      headline7(splitTitle2(text6(spec, "title", DEFAULTS23.section.title), 2), spec, { color: theme8.paper, fontSize: 54, lineHeight: 0.9 }),
      body19(text6(spec, "subtitle", DEFAULTS23.section.subtitle), spec, { color: theme8.paper, opacity: 0.85, fontSize: 11 })
    ])
  ], { backgroundColor: theme8.ink, pageTagMode: "lemon" });
}
function renderQuote19(spec) {
  const theme8 = colors18(spec);
  return frame12(spec, "quote", [
    panel(spec, 1, 1, 5, 8, { padding: 0, backgroundColor: theme8.ink }, [
      photoTexture(spec, [
        label20("Portrait / B&W", spec, { position: "absolute", left: 12, bottom: 12, color: theme8.paper, opacity: 0.55, fontSize: 7 })
      ])
    ]),
    panel(spec, 6, 1, 7, 5, { padding: 26, justifyContent: "center" }, [
      TextBlock('"', { color: theme8.lemon, fontSize: 58, lineHeight: 0.8, fontWeight: 900, marginBottom: 10 }),
      body19(text6(spec, "quote", DEFAULTS23.quote.quote), spec, { fontSize: 19, lineHeight: 1.28, fontWeight: 600 })
    ]),
    panel(spec, 6, 6, 4, 3, { backgroundColor: theme8.lemon, padding: 20, justifyContent: "space-between" }, [
      label20(text6(spec, "context", DEFAULTS23.quote.context), spec, { fontSize: 8 }),
      headline7(text6(spec, "author", DEFAULTS23.quote.author), spec, { fontSize: 18 })
    ]),
    panel(spec, 10, 6, 3, 3, { backgroundColor: theme8.ink, alignItems: "center", justifyContent: "center", padding: 0 }, [
      blockMark(spec, { width: 48, height: 48 })
    ])
  ]);
}
function renderCta(spec) {
  const theme8 = colors18(spec);
  const items = objectList3(spec, ["items", "steps"], DEFAULTS23.cta.items).slice(0, 3);
  return frame12(spec, "cta", [
    panel(spec, 1, 1, 8, 3, { backgroundColor: theme8.lemon, padding: 20, justifyContent: "space-between" }, [
      label20(text6(spec, "eyebrow", DEFAULTS23.cta.eyebrow), spec, { fontSize: 9 }),
      headline7(text6(spec, "title", DEFAULTS23.cta.title), spec, { fontSize: 58, lineHeight: 0.88 })
    ]),
    panel(spec, 9, 1, 4, 3, { backgroundColor: theme8.ink, alignItems: "center", justifyContent: "center" }, [
      qrTile(spec, 86, true)
    ]),
    ...items.map(
      (item, index) => panel(spec, 1 + index * 4, 4, 4, 5, {
        backgroundColor: index === 2 ? theme8.ink : theme8.paper,
        color: index === 2 ? theme8.paper : theme8.ink,
        padding: 20,
        justifyContent: "space-between"
      }, [
        label20(item.label || `0${index + 1}`, spec, { color: index === 2 ? theme8.paper : theme8.ink, opacity: index === 2 ? 0.75 : 1 }),
        headline7(item.title || `Step ${index + 1}`, spec, { color: index === 2 ? theme8.paper : theme8.ink, fontSize: 23, lineHeight: 1 }),
        body19(item.body || "", spec, { color: index === 2 ? theme8.paper : theme8.ink, opacity: index === 2 ? 0.85 : 1, fontSize: 10 }),
        TextBlock(index === 2 ? "->" : "", { color: theme8.lemon, fontSize: 26, fontWeight: 900 })
      ])
    )
  ]);
}
function renderConsult2(spec) {
  const theme8 = colors18(spec);
  const columns = objectList3(spec, ["columns", "items"], DEFAULTS23.consult.columns).slice(0, 3);
  return frame12(spec, "consult", [
    panel(spec, 1, 1, 12, 1, { backgroundColor: theme8.ink, color: theme8.paper, padding: "14px 18px", flexDirection: "row", alignItems: "center", gap: 18 }, [
      label20(text6(spec, "eyebrow", DEFAULTS23.consult.eyebrow), spec, { color: theme8.paper, opacity: 0.72, minWidth: 110 }),
      headline7(text6(spec, "title", DEFAULTS23.consult.title), spec, { color: theme8.paper, fontSize: 17, lineHeight: 1.2, flex: 1 })
    ]),
    ...columns.map(
      (col, index) => panel(spec, 1 + index * 4, 2, 4, 7, {
        backgroundColor: index === 1 ? theme8.lemon : theme8.paper,
        padding: 20,
        justifyContent: "space-between"
      }, [
        box({ flexDirection: "column" }, [
          headline7(col.title || `Column ${index + 1}`, spec, { fontSize: 18, lineHeight: 1.05, paddingBottom: 10, borderBottomWidth: 2, borderColor: theme8.ink, marginBottom: 18 }),
          metric11(col.metric || "", spec, { fontSize: 19, lineHeight: 1.12, marginBottom: 16 }),
          ...(Array.isArray(col.bullets) ? col.bullets.slice(0, 4) : []).map(
            (bullet) => body19(`- ${bullet}`, spec, { fontSize: 9.2, lineHeight: 1.42, marginBottom: 8 })
          )
        ]),
        label20(index === 1 ? "Modelled / FY24" : "Source / Cohort review", spec, { fontSize: 7, opacity: 0.68, borderTopWidth: 1, borderColor: "rgba(10,10,10,0.25)", paddingTop: 8 })
      ])
    )
  ]);
}
function renderChart22(spec) {
  const theme8 = colors18(spec);
  const labels = list3(spec, ["labels"], DEFAULTS23.chart2.labels).slice(0, 7);
  return frame12(spec, "chart2", [
    panel(spec, 1, 1, 5, 8, { backgroundColor: theme8.lemon, padding: 20, justifyContent: "space-between" }, [
      box({ flexDirection: "column" }, [
        label20(text6(spec, "eyebrow", DEFAULTS23.chart2.eyebrow), spec, { marginBottom: 18 }),
        headline7(splitTitle2(text6(spec, "title", DEFAULTS23.chart2.title), 2), spec, { fontSize: 38, lineHeight: 0.95 })
      ]),
      body19(text6(spec, "subtitle", DEFAULTS23.chart2.subtitle), spec, { fontSize: 10.5 }),
      box({ flexDirection: "column", gap: 8 }, ["Templated welcome", "Written welcome", "Written + human reply"].map(
        (item, index) => box({ flexDirection: "row", alignItems: "center", gap: 10 }, [
          box({ width: 24, height: 1 + index * 2, backgroundColor: theme8.ink }),
          label20(item, spec, { fontSize: 7 })
        ])
      ))
    ]),
    panel(spec, 6, 1, 7, 8, { padding: "18px 18px 18px 42px", position: "absolute" }, [
      label20("% of cohort active, by day", spec, { opacity: 0.72, marginBottom: 16 }),
      box({ position: "relative", flex: 1, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: theme8.ink, marginBottom: 12 }, [
        ...[0, 25, 50, 75].map((top) => box({ position: "absolute", left: 0, right: 0, top: `${top}%`, height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "rgba(10,10,10,0.18)" })),
        box({ position: "absolute", left: 0, top: 20, width: 430, height: 145, borderBottomWidth: 2, borderColor: theme8.ink, transform: "rotate(14deg)" }),
        box({ position: "absolute", left: 0, top: 62, width: 430, height: 112, borderBottomWidth: 3, borderColor: theme8.ink, transform: "rotate(8deg)" }),
        box({ position: "absolute", left: 0, top: 96, width: 430, height: 72, borderBottomWidth: 5, borderColor: theme8.ink, transform: "rotate(5deg)" }),
        box({ position: "absolute", right: -3, top: 165, width: 10, height: 10, backgroundColor: theme8.lemon, borderWidth: 1, borderColor: theme8.ink })
      ]),
      box({ flexDirection: "row", justifyContent: "space-between" }, labels.map((item) => label20(item, spec, { fontSize: 7 })))
    ])
  ], { pageTagMode: "lemon" });
}
function renderProcess22(spec) {
  const theme8 = colors18(spec);
  const items = objectList3(spec, ["items", "steps"], DEFAULTS23.process2.items).slice(0, 6);
  return frame12(spec, "process2", [
    panel(spec, 1, 1, 12, 2, { padding: 20, flexDirection: "row", justifyContent: "space-between", gap: 24 }, [
      headline7(splitTitle2(text6(spec, "title", DEFAULTS23.process2.title), 3), spec, { fontSize: 28, lineHeight: 1, width: 360 }),
      body19(text6(spec, "subtitle", DEFAULTS23.process2.subtitle), spec, { fontSize: 9, width: 310, lineHeight: 1.55 })
    ]),
    ...items.map(
      (item, index) => panel(spec, 1 + index * 2, 3, 2, 5, {
        backgroundColor: index === 1 || index === 3 ? theme8.lemon : index === 5 ? theme8.ink : theme8.paper,
        color: index === 5 ? theme8.paper : theme8.ink,
        padding: 14,
        justifyContent: "center"
      }, [
        label20(item.label || `0${index + 1}`, spec, { color: index === 5 ? theme8.paper : theme8.ink, fontSize: 7, marginBottom: 14 }),
        headline7(item.title || `Step ${index + 1}`, spec, { color: index === 5 ? theme8.paper : theme8.ink, fontSize: 17, lineHeight: 1.05, marginBottom: 12 }),
        body19(item.body || "", spec, { color: index === 5 ? theme8.paper : theme8.ink, opacity: index === 5 ? 0.85 : 1, fontSize: 8.5, lineHeight: 1.45 }),
        index < 5 ? TextBlock("->", { position: "absolute", right: -8, top: 126, color: theme8.ink, fontSize: 16, fontWeight: 900, zIndex: 2 }) : null
      ].filter(Boolean))
    ),
    panel(spec, 1, 8, 12, 1, { padding: "8px 14px", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
      ...["Week 1 / Frame", "Week 2-3 / Design", "Week 3-6 / Pilot", "Week 7 / Read", "Week 8 / Default", "Total / 8 weeks"].map(
        (item) => label20(item, spec, { fontSize: 7, paddingRight: 8, borderRightWidth: 1, borderColor: "rgba(10,10,10,0.25)" })
      )
    ])
  ]);
}
function renderMatrix2(spec) {
  const theme8 = colors18(spec);
  const headers = list3(spec, ["headers"], DEFAULTS23.matrix2.headers).slice(0, 4);
  const rows = list3(spec, ["rows"], DEFAULTS23.matrix2.rows).slice(0, 4);
  return frame12(spec, "matrix2", [
    panel(spec, 1, 1, 12, 2, { padding: 18, flexDirection: "row", justifyContent: "space-between", gap: 24 }, [
      headline7(splitTitle2(text6(spec, "title", DEFAULTS23.matrix2.title), 2), spec, { fontSize: 36, lineHeight: 0.95, width: 380 }),
      body19(text6(spec, "subtitle", DEFAULTS23.matrix2.subtitle), spec, { fontSize: 9.5, width: 320, lineHeight: 1.5 })
    ]),
    panel(spec, 1, 3, 12, 5, { padding: 0 }, [
      ...[headers, ...rows].flatMap(
        (row, rowIndex) => row.slice(0, 4).map(
          (cell, colIndex) => box({
            position: "absolute",
            left: `${colIndex * 25}%`,
            top: `${rowIndex * 20}%`,
            width: "25%",
            height: "20%",
            padding: colIndex === 0 ? "12px 13px" : "13px 11px",
            backgroundColor: rowIndex === 0 ? theme8.ink : theme8.paper,
            color: rowIndex === 0 ? theme8.paper : theme8.ink,
            borderRightWidth: colIndex === 3 ? 0 : 1,
            borderBottomWidth: rowIndex === 4 ? 0 : 1,
            borderColor: theme8.ink,
            justifyContent: "center"
          }, [
            rowIndex === 0 ? label20(cell, spec, { color: theme8.paper, fontSize: 7, lineHeight: 1.2 }) : colIndex === 0 ? headline7(cell, spec, { fontSize: 11, lineHeight: 1.08 }) : label20(cell, spec, {
              fontSize: 8,
              lineHeight: 1.2,
              backgroundColor: String(cell).includes("Low") || String(cell).includes("None") || String(cell).includes("+19") || String(cell).includes("<=") ? theme8.lemon : "transparent",
              borderWidth: String(cell).includes("Medium") || String(cell).includes("6-8") || String(cell).includes("+7") || String(cell).includes("+5") ? 1 : 0,
              borderColor: theme8.ink,
              padding: "3px 5px"
            })
          ])
        )
      )
    ])
  ], { pageTagMode: "lemon" });
}
var RENDERERS17 = {
  cover: renderCover20,
  toc: renderToc,
  stats: renderStats12,
  features: renderFeatures2,
  chart: renderChart10,
  section: renderSection2,
  quote: renderQuote19,
  cta: renderCta,
  consult: renderConsult2,
  chart2: renderChart22,
  process2: renderProcess22,
  matrix2: renderMatrix2
};
function renderDensePanelGrid(spec) {
  const variant = normalizeVariant24(spec);
  return (RENDERERS17[variant] || renderCover20)(spec);
}

// templates/beautiful/people-platform-manifesto.mjs
var templateId26 = "people-platform-manifesto";
var CANVAS17 = { width: 960, height: 540 };
var PAGE_VARIANTS25 = ["cover", "toc", "manifesto", "pillars", "stat", "platform", "quote", "timeline", "compare", "close"];
var rendererContract26 = {
  template_id: templateId26,
  renderer_id: `artboard_satori.${templateId26}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "peoples-platform",
  implemented_page_variants: PAGE_VARIANTS25,
  page_family: {
    family_id: "peoples-platform",
    supported_page_variants: PAGE_VARIANTS25,
    variant_usage_policy: {
      singletons: ["cover", "toc", "manifesto", "quote", "close"],
      repeatable: ["pillars", "stat", "platform", "timeline", "compare"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/peoples-platform-1.png"
};
var DEFAULTS24 = {
  cover: {
    eyebrow: "STRATEGIC REVIEW \xB7 INTERNAL",
    title: "QUARTERLY\nREVIEW",
    script: "a",
    subtitle: "PRESENTATION TEMPLATE",
    meta_left: "Q2 \xB7 2026",
    stamp: "VOL. 01",
    footer: ["PREPARED BY THE TEAM", "MAY 2026", "VERSION 01"]
  },
  toc: {
    title: "WHAT'S\nINSIDE.",
    meta: ["CONTENTS", "SECTION GUIDE", "02 / 10"],
    items: [
      { num: "01", title: "The Big Idea", page: "PG 03" },
      { num: "02", title: "Three Pillars", page: "PG 04" },
      { num: "03", title: "By the Numbers", page: "PG 05" },
      { num: "04", title: "The Full Plan", page: "PG 06" },
      { num: "05", title: "Voice of the Customer", page: "PG 07" },
      { num: "06", title: "Roadmap", page: "PG 08" },
      { num: "07", title: "Where We Land", page: "PG 09" },
      { num: "08", title: "Next Steps", page: "PG 10" }
    ]
  },
  manifesto: {
    header: ["\u2014 THE BIG IDEA \u2014", "03 / 10", "ONE SENTENCE"],
    kicker: "\u2605 \u2605 \u2605  OUR THESIS  \u2605 \u2605 \u2605",
    title: "The product gets simpler\nas the team gets braver \u2014\nnot the other way around.",
    accent: "braver",
    footer: ["\u2014 PARAGRAPH 01 \u2014", "SET IN ALFA SLAB"]
  },
  pillars: {
    title: "THREE\nPRIORITIES.",
    lede: "The work falls into three buckets this quarter. Each has a clear owner, deliverable, and way to know we are done.",
    columns: [
      { num: "01", tag: "\u2014 FOCUS \u2014", title: "Ship the\ncore flow.", body: "Cut three legacy paths and double down on the one that drives ninety percent of activations." },
      { num: "02", tag: "\u2014 LEARN \u2014", title: "Talk to\nten teams.", body: "Standing weekly research with target customers. Findings briefed every Friday in a one-page memo.", accent: true },
      { num: "03", tag: "\u2014 SHIP \u2014", title: "One launch,\nnot five.", body: "Combine the four small drops into a single, well-told release with shared positioning." }
    ]
  },
  stat: {
    header: ["\u2014 BY THE NUMBERS \u2014", "05 / 10", "SECTION 02 / DATA"],
    value: "63",
    unit: "%",
    title: "of customers\nrecommend us\nafter onboarding.",
    body: "Net promoter scores climbed eighteen points after we shipped the redesigned first-run experience in March.",
    source: "SOURCE \u2014 INTERNAL NPS, Q1 2026",
    ribbon: ["\u2605 FOCUS", "\u2605 LEARN", "\u2605 SHIP", "\u2605 FOCUS", "\u2605 LEARN", "\u2605 SHIP"]
  },
  platform: {
    title: "THE FULL\nPLAN.",
    lede: "Eight workstreams, costed and owned. Each links to a longer brief in the appendix.",
    items: [
      { title: "Onboarding refresh", body: "Rebuild the first-run experience with progressive disclosure and a single primary action per screen." },
      { title: "Pricing simplification", body: "Collapse the seven plans into three. Move add-ons behind a clearer feature matrix." },
      { title: "Mobile parity", body: "Bring the four most-used desktop flows to mobile by end of quarter, including offline drafts." },
      { title: "Self-serve setup", body: "Reduce time-to-first-value from three days to thirty minutes for teams under fifty seats." },
      { title: "Trust & security", body: "Ship audit logs, role-based access, and SSO for all paid tiers." },
      { title: "Performance budget", body: "Cut median page load by forty percent and wire the ceiling into release." },
      { title: "Integrations push", body: "Native connectors for the top five tools customers ask for, plus a public API." },
      { title: "Brand refresh", body: "New marketing site, sharper positioning, and a unified visual system." }
    ]
  },
  quote: {
    quote: "The new onboarding cut our setup time\nfrom three days to thirty minutes \u2014\nwe shipped the same week.",
    emphasis: "we shipped the same week.",
    name: "Maya Okonkwo",
    role: "\u2014 HEAD OF OPS, NORTH STAR LABS \u2014",
    stamp: "\u2605 Voice of the Customer \u2605"
  },
  timeline: {
    title: "THE\nROADMAP.",
    subtitle: "\u2014 a plan, on a clock \u2014",
    steps: [
      { when: "MAY", title: "Kickoff", body: "Charter the workstreams, lock owners, and publish the shared scorecard." },
      { when: "JUNE", title: "Beta opens", body: "Onboard the first ten design partners on the new core flow.", accent: true },
      { when: "AUGUST", title: "Launch", body: "Public release, marketing site refresh, and sales enablement complete." },
      { when: "OCTOBER", title: "Scale", body: "Roll the changes to the long tail and retire legacy paths for good.", accent: true }
    ],
    metrics: [
      { label: "\u2014 TIME-TO-VALUE \u2014", value: "30m" },
      { label: "\u2014 ACTIVATION RATE \u2014", value: "+24%", accent: true },
      { label: "\u2014 REVENUE LIFT \u2014", value: "$1.4M" }
    ]
  },
  compare: {
    title: "WHERE\nWE LAND.",
    subtitle: "A side-by-side of where the product is today and where this plan takes us by the end of the year.",
    columns: [
      {
        label: "\u2014 TODAY \u2014",
        title: "Capable,\nbut cluttered.",
        items: [
          "Three-day median time-to-value for new teams.",
          "Seven pricing plans with overlapping feature sets.",
          "Mobile parity at sixty percent of desktop flows.",
          "Onboarding NPS sits at forty-five points."
        ]
      },
      {
        label: "\u2014 END OF YEAR \u2014",
        title: "Sharper,\nfaster,\nfewer.",
        accent: true,
        items: [
          "Thirty-minute self-serve setup, no human required.",
          "Three pricing plans with a clear feature matrix.",
          "Full mobile parity, plus offline drafts.",
          "Onboarding NPS targeted at sixty-three points."
        ]
      }
    ]
  },
  close: {
    header: ["\u2014 END OF DECK \u2014", "\u2605 THANK YOU \u2605", "10 / 10"],
    pre: "over to you \u2014",
    title: "QUESTIONS?",
    cta: "LET'S TALK",
    url: "team@company.com",
    signoff: "PREPARED BY THE PRODUCT TEAM\n\u2605 MAY 2026 \u2605 INTERNAL DRAFT",
    stamp: "END"
  }
};
function theme5(spec) {
  return {
    blue: "#2C2CDC",
    blueDeep: "#1B1BB0",
    orange: "#F2A03A",
    red: "#E83A2A",
    cream: "#F4E9D6",
    paper: "#F5F2EA",
    ink: "#0E0E14"
  };
}
function content13(spec, variant) {
  return { ...DEFAULTS24[variant] || DEFAULTS24.cover, ...spec.content || {} };
}
function normalizeVariant25(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS25.length) return PAGE_VARIANTS25[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS25) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda") || raw.includes("contents")) return "toc";
  if (raw.includes("data") || raw.includes("metric")) return "stat";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("timeline") || raw.includes("process")) return "timeline";
  if (raw.includes("compare") || raw.includes("comparison") || raw.includes("split")) return "compare";
  if (raw.includes("closing") || raw.includes("close") || raw.includes("cta")) return "close";
  return "platform";
}
function role23(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function page12(spec, bg, children = []) {
  return box({ width: CANVAS17.width, height: CANVAS17.height, position: "relative", overflow: "hidden", backgroundColor: bg }, [
    grain2(spec),
    ...textureDots3(spec),
    ...children
  ]);
}
function grain2(spec) {
  const t = theme5(spec);
  return box({ position: "absolute", inset: 0, backgroundColor: t.ink, opacity: 0.025 });
}
function textureDots3(spec) {
  const t = theme5(spec);
  return Array.from(
    { length: 10 },
    (_, index) => box({
      position: "absolute",
      left: 54 + index % 5 * 18,
      bottom: 54 + Math.floor(index / 5) * 18,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.ink,
      opacity: 0.18
    })
  );
}
function label21(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    ...role23("label", spec, { fontWeight: 700, lineHeight: 1.05, letterSpacing: 1.4, textTransform: "uppercase" }),
    fontSize: 10,
    ...style
  });
}
function display10(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    ...role23("display", spec, { fontWeight: 900, lineHeight: 0.88, letterSpacing: 0.2, textTransform: "uppercase" }),
    whiteSpace: "pre-line",
    ...style
  });
}
function body20(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    ...role23("body", spec, { fontWeight: 500, lineHeight: 1.35 }),
    fontSize: 16,
    lineHeight: 1.35,
    ...style
  });
}
function metric12(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    ...role23("metric", spec, { fontWeight: 900, lineHeight: 0.9, textTransform: "uppercase" }),
    ...style
  });
}
function dot(t, style = {}) {
  return box({ width: 6, height: 6, borderRadius: 3, backgroundColor: t.orange, ...style });
}
function renderCover21(spec) {
  const t = theme5(spec);
  const c = content13(spec, "cover");
  const footer4 = Array.isArray(c.footer) ? c.footer : DEFAULTS24.cover.footer;
  return page12(spec, t.blue, [
    box({ position: "absolute", inset: 24, borderWidth: 3, borderColor: t.cream }),
    box({ position: "absolute", left: 54, top: 43, right: 54, height: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, [
      label21(c.meta_left, spec, { color: t.cream, borderWidth: 1.5, borderColor: t.cream, borderRadius: 20, padding: "5px 12px", fontSize: 9 }),
      label21(c.eyebrow, spec, { color: t.cream, fontSize: 10 }),
      label21(c.stamp, spec, { color: t.cream, borderWidth: 1.5, borderColor: t.cream, borderRadius: 20, padding: "5px 12px", fontSize: 9 })
    ]),
    display10(c.title, spec, { position: "absolute", left: 134, top: 139, width: 690, color: t.orange, fontSize: 89, lineHeight: 0.82 }),
    display10(c.title, spec, { position: "absolute", left: 129, top: 134, width: 690, color: t.cream, fontSize: 89, lineHeight: 0.82 }),
    TextBlock(c.script, { position: "absolute", left: 262, top: 322, color: t.cream, fontSize: 44, ...role23("body", spec, { fontWeight: 400 }) }),
    display10(c.subtitle, spec, { position: "absolute", left: 326, top: 327, color: t.cream, fontSize: 29, lineHeight: 1 }),
    box({ position: "absolute", left: 300, top: 463, right: 300, height: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 13 }, [
      label21(footer4[0], spec, { color: t.cream, fontSize: 9 }),
      dot(t),
      label21(footer4[1], spec, { color: t.cream, fontSize: 9 }),
      dot(t),
      label21(footer4[2], spec, { color: t.cream, fontSize: 9 })
    ])
  ]);
}
function renderToc2(spec) {
  const t = theme5(spec);
  const c = content13(spec, "toc");
  const items = Array.isArray(c.items) ? c.items.slice(0, 8) : DEFAULTS24.toc.items;
  const meta = Array.isArray(c.meta) ? c.meta : DEFAULTS24.toc.meta;
  return page12(spec, t.paper, [
    box({ position: "absolute", left: 45, top: 35, right: 45, height: 108, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 3, borderColor: t.ink }, [
      display10(c.title, spec, { color: t.ink, fontSize: 58, lineHeight: 0.86 }),
      box({ width: 180, flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 6 }, [
        label21(meta[0], spec, { color: t.blue, fontSize: 16 }),
        label21(meta[1], spec, { color: t.ink, fontSize: 10 }),
        label21(meta[2], spec, { color: t.ink, fontSize: 10 })
      ])
    ]),
    box({ position: "absolute", left: 126, top: 168, right: 126, bottom: 48, flexDirection: "column" }, items.map(
      (item) => box({ height: 39, borderBottomWidth: 1.5, borderColor: t.ink, flexDirection: "row", alignItems: "center" }, [
        metric12(item.num, spec, { width: 58, color: t.orange, fontSize: 27, lineHeight: 1 }),
        display10(item.title, spec, { flex: 1, color: t.ink, fontSize: 18, lineHeight: 1 }),
        label21(item.page, spec, { width: 70, color: t.blue, fontSize: 10, textAlign: "right", justifyContent: "flex-end" })
      ])
    ))
  ]);
}
function renderManifesto5(spec) {
  const t = theme5(spec);
  const c = content13(spec, "manifesto");
  const header = Array.isArray(c.header) ? c.header : DEFAULTS24.manifesto.header;
  return page12(spec, t.cream, [
    box({ position: "absolute", left: 0, top: 0, right: 0, height: 45, backgroundColor: t.blue, borderBottomWidth: 3, borderColor: t.cream, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 45px" }, header.map(
      (item) => label21(item, spec, { color: t.cream, fontSize: 9 })
    )),
    label21(c.kicker, spec, { position: "absolute", left: 90, top: 100, color: t.red, fontSize: 12 }),
    display10(c.title, spec, { position: "absolute", left: 87, top: 142, width: 790, color: t.red, fontSize: 48, lineHeight: 0.9 }),
    display10(c.title, spec, { position: "absolute", left: 82, top: 137, width: 790, color: t.ink, fontSize: 48, lineHeight: 0.9 }),
    box({ position: "absolute", left: 90, top: 400, width: 300, height: 7, backgroundColor: t.ink }),
    box({ position: "absolute", left: 45, right: 45, bottom: 32, height: 20, flexDirection: "row", justifyContent: "space-between" }, [
      label21(header[0], spec, { color: t.ink, fontSize: 9 }),
      label21(c.footer?.[1] || "SET IN ALFA SLAB", spec, { color: t.ink, fontSize: 9 })
    ])
  ]);
}
function renderPillars2(spec) {
  const t = theme5(spec);
  const c = content13(spec, "pillars");
  const cols = Array.isArray(c.columns) ? c.columns.slice(0, 3) : DEFAULTS24.pillars.columns;
  return page12(spec, t.paper, [
    box({ position: "absolute", left: 45, top: 35, right: 45, height: 116, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 3, borderColor: t.ink }, [
      display10(c.title, spec, { width: 420, color: t.ink, fontSize: 58, lineHeight: 0.86 }),
      body20(c.lede, spec, { width: 340, color: t.ink, fontSize: 15, lineHeight: 1.35, paddingTop: 17 })
    ]),
    box({ position: "absolute", left: 45, right: 45, bottom: 45, height: 325, borderWidth: 3, borderColor: t.ink, flexDirection: "row" }, cols.map((col) => {
      const accent = Boolean(col.accent);
      return box({ flex: 1, flexDirection: "column", padding: "28px 25px", borderRightWidth: col === cols[cols.length - 1] ? 0 : 3, borderColor: t.ink, backgroundColor: accent ? t.blue : t.paper }, [
        metric12(col.num, spec, { color: t.orange, fontSize: 34, marginBottom: 17 }),
        label21(col.tag, spec, { color: accent ? t.cream : t.ink, borderTopWidth: 2, borderColor: accent ? t.cream : t.ink, paddingTop: 10, fontSize: 9, marginBottom: 18 }),
        display10(col.title, spec, { color: accent ? t.orange : t.ink, fontSize: 29, lineHeight: 0.96, marginBottom: 18 }),
        body20(col.body, spec, { color: accent ? t.cream : t.ink, fontSize: 14, lineHeight: 1.38 })
      ]);
    }))
  ]);
}
function renderStat3(spec) {
  const t = theme5(spec);
  const c = content13(spec, "stat");
  const header = Array.isArray(c.header) ? c.header : DEFAULTS24.stat.header;
  const ribbon = Array.isArray(c.ribbon) ? c.ribbon : DEFAULTS24.stat.ribbon;
  return page12(spec, t.blue, [
    box({ position: "absolute", left: 0, top: 0, right: 0, height: 45, borderBottomWidth: 3, borderColor: t.cream, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 45px" }, header.map(
      (item) => label21(item, spec, { color: t.cream, fontSize: 9 })
    )),
    metric12(c.value, spec, { position: "absolute", left: 55, top: 150, color: t.orange, fontSize: 153, lineHeight: 0.82 }),
    metric12(c.unit, spec, { position: "absolute", left: 346, top: 169, color: t.orange, fontSize: 64, lineHeight: 1 }),
    display10(c.title, spec, { position: "absolute", left: 490, top: 150, width: 370, color: t.cream, fontSize: 38, lineHeight: 0.94 }),
    body20(c.body, spec, { position: "absolute", left: 493, top: 312, width: 340, color: t.cream, fontSize: 15, lineHeight: 1.35 }),
    label21(c.source, spec, { position: "absolute", left: 493, top: 392, color: t.cream, fontSize: 9 }),
    box({ position: "absolute", left: -20, right: -20, bottom: 48, height: 43, backgroundColor: t.orange, borderTopWidth: 3, borderBottomWidth: 3, borderColor: t.cream, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }, ribbon.map(
      (item) => label21(item, spec, { color: t.ink, fontSize: 13 })
    ))
  ]);
}
function renderPlatform(spec) {
  const t = theme5(spec);
  const c = content13(spec, "platform");
  const items = Array.isArray(c.items) ? c.items.slice(0, 8) : DEFAULTS24.platform.items;
  return page12(spec, t.paper, [
    box({ position: "absolute", left: 45, top: 35, right: 45, height: 95, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 3, borderColor: t.ink }, [
      display10(c.title, spec, { color: t.ink, fontSize: 48, lineHeight: 0.86 }),
      body20(c.lede, spec, { width: 355, color: t.ink, fontSize: 15, lineHeight: 1.32, paddingTop: 13 })
    ]),
    box({ position: "absolute", left: 88, right: 88, top: 153, bottom: 42, flexDirection: "column", flexWrap: "wrap", columnGap: 35 }, items.map(
      (item, index) => box({ width: 362, minHeight: 73, flexDirection: "row", borderTopWidth: 2, borderColor: t.ink, paddingTop: 12, marginBottom: 9 }, [
        metric12(String(index + 1).padStart(2, "0"), spec, { width: 45, color: t.orange, fontSize: 25 }),
        box({ flex: 1, flexDirection: "column" }, [
          display10(item.title, spec, { color: t.ink, fontSize: 17, lineHeight: 1, marginBottom: 6 }),
          body20(item.body, spec, { color: t.ink, fontSize: 12.5, lineHeight: 1.28 })
        ])
      ])
    ))
  ]);
}
function renderQuote20(spec) {
  const t = theme5(spec);
  const c = content13(spec, "quote");
  const quoteBase = String(c.quote || "").replace(String(c.emphasis || ""), "").trim();
  return page12(spec, t.orange, [
    metric12('"', spec, { position: "absolute", left: 58, top: 22, color: t.blue, opacity: 0.18, fontSize: 168, lineHeight: 0.7 }),
    display10(quoteBase, spec, { position: "absolute", left: 88, top: 105, width: 790, color: t.blue, fontSize: 42, lineHeight: 1.04 }),
    display10(c.emphasis, spec, { position: "absolute", left: 88, top: 285, width: 640, color: t.red, fontSize: 42, lineHeight: 1.04 }),
    display10(c.emphasis, spec, { position: "absolute", left: 84, top: 281, width: 640, color: t.cream, fontSize: 42, lineHeight: 1.04 }),
    box({ position: "absolute", left: 88, right: 88, bottom: 58, height: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, [
      box({ flexDirection: "row", alignItems: "center" }, [
        box({ width: 58, height: 58, borderRadius: 29, backgroundColor: t.blue, color: t.cream, alignItems: "center", justifyContent: "center", marginRight: 15 }, [
          display10("M", spec, { color: t.cream, fontSize: 26, lineHeight: 1 })
        ]),
        box({ flexDirection: "column" }, [
          display10(c.name, spec, { color: t.blue, fontSize: 20, lineHeight: 1 }),
          label21(c.role, spec, { color: t.blue, fontSize: 9, marginTop: 7 })
        ])
      ]),
      label21(c.stamp, spec, { color: t.blue, borderWidth: 2, borderColor: t.blue, borderRadius: 20, padding: "9px 18px", fontSize: 10 })
    ])
  ]);
}
function renderTimeline9(spec) {
  const t = theme5(spec);
  const c = content13(spec, "timeline");
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 4) : DEFAULTS24.timeline.steps;
  const metrics = Array.isArray(c.metrics) ? c.metrics.slice(0, 3) : DEFAULTS24.timeline.metrics;
  return page12(spec, t.cream, [
    box({ position: "absolute", left: 45, top: 35, right: 45, height: 98, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 3, borderColor: t.ink }, [
      display10(c.title, spec, { color: t.ink, fontSize: 52, lineHeight: 0.86 }),
      TextBlock(c.subtitle, { color: t.red, fontSize: 30, paddingTop: 30, ...role23("body", spec, { fontWeight: 400 }) })
    ]),
    box({ position: "absolute", left: 78, right: 78, top: 219, height: 3, backgroundColor: t.ink }),
    box({ position: "absolute", left: 74, right: 74, top: 184, height: 112, flexDirection: "row" }, steps.map(
      (step) => box({ flex: 1, flexDirection: "column", padding: "0 15px" }, [
        box({ width: 24, height: 24, borderRadius: 12, backgroundColor: step.accent ? t.blue : t.orange, borderWidth: 2, borderColor: t.ink, marginBottom: 18 }),
        label21(step.when, spec, { color: t.red, fontSize: 10, marginBottom: 7 }),
        display10(step.title, spec, { color: t.ink, fontSize: 19, lineHeight: 1, marginBottom: 6 }),
        body20(step.body, spec, { color: t.ink, fontSize: 12, lineHeight: 1.25 })
      ])
    )),
    box({ position: "absolute", left: 70, right: 70, bottom: 48, height: 105, flexDirection: "row", gap: 16 }, metrics.map(
      (item) => box({ flex: 1, flexDirection: "column", justifyContent: "space-between", padding: 18, backgroundColor: item.accent ? t.blue : t.paper, borderWidth: 3, borderColor: t.ink }, [
        label21(item.label, spec, { color: item.accent ? t.cream : t.ink, fontSize: 9 }),
        metric12(item.value, spec, { color: item.accent ? t.orange : t.blue, fontSize: 43, lineHeight: 0.9 })
      ])
    ))
  ]);
}
function renderCompare7(spec) {
  const t = theme5(spec);
  const c = content13(spec, "compare");
  const columns = Array.isArray(c.columns) ? c.columns.slice(0, 2) : DEFAULTS24.compare.columns;
  return page12(spec, t.paper, [
    box({ position: "absolute", left: 45, top: 35, right: 45, height: 100, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 3, borderColor: t.ink }, [
      display10(c.title, spec, { color: t.ink, fontSize: 50, lineHeight: 0.86 }),
      body20(c.subtitle, spec, { width: 360, color: t.ink, fontSize: 15, lineHeight: 1.32, paddingTop: 18 })
    ]),
    box({ position: "absolute", left: 45, right: 45, bottom: 45, height: 320, borderWidth: 3, borderColor: t.ink, flexDirection: "row" }, columns.map(
      (col) => box({ flex: 1, flexDirection: "column", padding: "34px 35px", backgroundColor: col.accent ? t.blue : t.paper, borderRightWidth: col === columns[0] ? 3 : 0, borderColor: t.ink }, [
        label21(col.label, spec, { color: col.accent ? t.cream : t.ink, borderBottomWidth: 2, borderColor: col.accent ? t.cream : t.ink, paddingBottom: 10, fontSize: 9, marginBottom: 18 }),
        display10(col.title, spec, { color: col.accent ? t.orange : t.ink, fontSize: 32, lineHeight: 0.96, marginBottom: 20 }),
        box({ flexDirection: "column", gap: 10 }, (col.items || []).slice(0, 4).map(
          (item) => box({ flexDirection: "row", alignItems: "flex-start" }, [
            box({ width: 6, height: 6, borderRadius: 3, backgroundColor: col.accent ? t.orange : t.blue, marginTop: 7, marginRight: 9 }),
            body20(item, spec, { flex: 1, color: col.accent ? t.cream : t.ink, fontSize: 13.5, lineHeight: 1.25 })
          ])
        ))
      ])
    ))
  ]);
}
function renderClose2(spec) {
  const t = theme5(spec);
  const c = content13(spec, "close");
  const header = Array.isArray(c.header) ? c.header : DEFAULTS24.close.header;
  return page12(spec, t.blue, [
    box({ position: "absolute", inset: 25, borderWidth: 3, borderColor: t.cream }),
    box({ position: "absolute", left: 55, top: 45, right: 55, height: 22, flexDirection: "row", justifyContent: "space-between" }, header.map(
      (item) => label21(item, spec, { color: t.cream, fontSize: 9 })
    )),
    TextBlock(c.pre, { position: "absolute", left: 352, top: 142, color: t.orange, fontSize: 34, ...role23("body", spec, { fontWeight: 400 }) }),
    display10(c.title, spec, { position: "absolute", left: 115, top: 185, width: 730, color: t.cream, fontSize: 91, lineHeight: 0.86, textAlign: "center", justifyContent: "center" }),
    box({ position: "absolute", left: 237, top: 335, width: 486, height: 51, flexDirection: "row", borderWidth: 3, borderColor: t.cream }, [
      display10(c.cta, spec, { width: 210, backgroundColor: t.orange, color: t.ink, fontSize: 20, alignItems: "center", justifyContent: "center" }),
      display10(c.url, spec, { flex: 1, color: t.cream, fontSize: 20, alignItems: "center", justifyContent: "center" })
    ]),
    label21(c.signoff, spec, { position: "absolute", left: 63, bottom: 42, color: t.cream, fontSize: 9, lineHeight: 1.45, whiteSpace: "pre-line" }),
    box({ position: "absolute", right: 63, bottom: 42, width: 96, height: 96, borderWidth: 3, borderColor: t.cream, borderRadius: 48, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
      metric12(c.stamp, spec, { color: t.orange, fontSize: 27, lineHeight: 1 }),
      label21("\u2014 V. 01 \u2014", spec, { color: t.cream, fontSize: 8, marginTop: 5 })
    ])
  ]);
}
var RENDERERS18 = {
  cover: renderCover21,
  toc: renderToc2,
  manifesto: renderManifesto5,
  pillars: renderPillars2,
  stat: renderStat3,
  platform: renderPlatform,
  quote: renderQuote20,
  timeline: renderTimeline9,
  compare: renderCompare7,
  close: renderClose2
};
function renderPeoplePlatformManifesto(spec) {
  const variant = normalizeVariant25(spec);
  return (RENDERERS18[variant] || renderPlatform)(spec);
}

// templates/beautiful/annotated-field-board.mjs
var templateId27 = "annotated-field-board";
var PAGE_VARIANTS26 = [
  "cover",
  "agenda",
  "notes",
  "sec",
  "notice",
  "chart",
  "process",
  "matrix",
  "stats",
  "quote",
  "cta"
];
var rendererContract27 = {
  template_id: templateId27,
  renderer_id: `artboard_satori.${templateId27}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "pin-and-paper",
  implemented_page_variants: PAGE_VARIANTS26,
  page_family: {
    family_id: "pin-and-paper",
    supported_page_variants: PAGE_VARIANTS26,
    variant_usage_policy: {
      singletons: ["cover", "sec", "quote", "cta"],
      repeatable: ["agenda", "notes", "notice", "chart", "process", "matrix", "stats"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/pin-and-paper-1.png"
};
var DEFAULTS25 = {
  cover: {
    eyebrow: "A field guide - Vol. I",
    title: "Kept\nthings",
    notes: ["For: the room.\nTwo pages. One ask.", "Presented by A. Speaker\nRole - Team - Spring 2026"],
    date: "29 - IV - 2026"
  },
  agenda: {
    title: "What's inside",
    eyebrow: "Pin & Paper",
    meta: ["North Field Office", "Phase I"],
    items: [
      { num: "01", label: "The trust gap", meta: "Findings - 12 min" },
      { num: "02", label: "Three pilots, scored", meta: "Evidence - 9 min" },
      { num: "03", label: "A way of working", meta: "Method - 7 min" },
      { num: "04", label: "What we ship next", meta: "Decisions - 8 min" }
    ]
  },
  notes: {
    title: "Three rules we're keeping",
    subtitle: "Pinned to the wall above every desk. We refer back to them when a decision feels too big to make from the seat we're in.",
    cards: [
      { num: "Rule - 01", title: "Write the\nreal sentence", body: "If a customer wouldn't read the email, the email is not the work. Plain words, signed by a person.", scribble: "- write it by hand first." },
      { num: "Rule - 02", title: "Earn the\nsecond look", body: "Every interaction in the first 72 hours is doing four times the work of one in week three. Spend accordingly.", scribble: "no autoresponder, ever." },
      { num: "Rule - 03", title: "Keep the\nhandwriting", body: "The system is allowed to grow, but the voice on the other end stays small enough to know who you wrote to last week.", scribble: "200 names, max." }
    ]
  },
  sec: {
    eyebrow: "Section II",
    label: "Direction\n& doctrine",
    title: "Where we\nare going,\nand why",
    scribble: "- turn the page -"
  },
  notice: {
    eyebrow: "Notice - 05\nAction title",
    title: "The trust gap is built in the first 72 hours, not the first 7 days - and the cost compounds for the rest of the lifecycle",
    columns: [
      { title: "What we found", body: "Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.", bullets: ["Email open #2 lifts D90 retention by 19 points.", "Personal salutation retained 2.4x the cohort.", "Reply received within 24 hours is the largest lever."], source: "N = 14,200 - Q1 2026" },
      { title: "Why it matters", meta: "$4.1M projected retained ARR", body: "The first three days are the only window where customers are both paying attention and willing to write back.", bullets: ["Every interaction here does the work of four interactions in week three.", "The real cost is quiet churn, not refunds."], source: "Modelled on FY24 cohort behaviour" },
      { title: "What to do", body: "Rewrite the first three touches and instrument the 72-hour window as a first-class weekly metric.", bullets: ["Rewrite emails 1-3 in human voice.", "Route top accounts to a named human.", "Review the window every week."], source: "Pilot scope: top-decile signups" }
    ]
  },
  chart: {
    title: "Curve\nbends at\nday three",
    subtitle: "Cohorts that received a written welcome and a human reply within 24 hours retain at roughly 2x the rate of the templated cohort.",
    legend: ["Templated welcome", "Written welcome", "Written + human reply"]
  },
  process: {
    title: "From insight to default,\nin five moves",
    subtitle: "A repeatable path each pilot follows before it graduates to the default experience for every customer.",
    steps: [
      { n: "1", title: "Frame", body: "Translate the insight into a behavioural hypothesis." },
      { n: "2", title: "Design", body: "Smallest end-to-end change that tests it cleanly." },
      { n: "3", title: "Pilot", body: "Ship to a holdout and hold the line for two cycles." },
      { n: "4", title: "Read", body: "Use pre-registered metrics only." },
      { n: "5", title: "Default", body: "Promote and retire the legacy path." }
    ],
    timeline: ["Week 1 - Frame", "Week 2-3 - Design", "Week 3-6 - Pilot", "Week 7 - Read", "Week 8 - Default"]
  },
  matrix: {
    title: "Where each pilot\nearns its keep",
    subtitle: "Scored against the four levers that matter most this cycle.",
    headers: ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
    rows: [
      ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
      ["Build cost", "low", "medium", "low"],
      ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
      ["Risk to power users", "none", "material", "soft, reversible"]
    ]
  },
  stats: {
    title: "The case,\nby the numbers",
    subtitle: "Three figures we will report against every cycle. If one stops moving, the bet is over.",
    stats: [
      { value: "2.4", suffix: "x", title: "Retention\nmultiple", body: "Written welcome plus human reply, versus templated control." },
      { value: "$4.1", suffix: "M", title: "Projected\nretained ARR", body: "Modelled on the current quarter's signup cohort." },
      { value: "72", suffix: "hr", title: "The window\nthat matters", body: "Behaviour after the first 72 hours predicts long-term retention." }
    ]
  },
  quote: {
    quote: "Three days in, someone wrote me a real sentence. I'd been a customer of theirs for nine months before I noticed I'd never been a customer anywhere else again.",
    author: "Margaux Leveque",
    meta: "CFO - mid-market retailer - 14 months in"
  },
  cta: {
    title: "Pick the\nthree\nbets",
    subtitle: "Three pilots in eight weeks. We'll bring back evidence the quarter after.",
    right_title: "How we move this week",
    steps: [
      { n: "1", title: "Pick the pilots", body: "Confirm two of three by Friday. Owners named in the same conversation." },
      { n: "2", title: "Pre-register the read", body: "Lock the metric, holdout, and kill criteria before code ships." },
      { n: "3", title: "Clear the release path", body: "Ship behind a reversible flag and review weekly." }
    ]
  }
};
function colors19(spec) {
  const source = spec.theme?.colors || {};
  return {
    paper: source.background || "#EFE56A",
    paper2: source.panel || "#F5ECA0",
    cream: source.surface || "#F8F1D6",
    extra: source.extra || "#FBE6A4",
    ink: source.text || source.primary || "#1F3A8A",
    inkSoft: source.accent || "#2D4FB8",
    red: source.red || "#C2342B",
    olive: source.muted || "#6B7A2E",
    orange: source.orange || "#D8702A"
  };
}
function array18(spec, key, fallback2 = []) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function value14(spec, key, fallback2 = "") {
  const raw = spec.content?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback2;
}
function variantContent2(spec, variant) {
  return { ...DEFAULTS25[variant], ...spec.content || {} };
}
function normalizeVariant26(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS26.length) return PAGE_VARIANTS26[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS26) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda")) return "agenda";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("compare") || raw.includes("matrix")) return "matrix";
  if (raw.includes("closing") || raw.includes("cta")) return "cta";
  if (raw.includes("process") || raw.includes("timeline")) return "process";
  return "cover";
}
function role24(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function display11(text10, spec, style = {}) {
  return Title(text10, {
    color: style.color || "#1F3A8A",
    fontSize: 74,
    lineHeight: 0.98,
    letterSpacing: -1.2,
    whiteSpace: "pre-wrap",
    ...role24("display", spec, { fontWeight: 800, fontSize: 74, lineHeight: 0.98, letterSpacing: -1.2 }),
    ...style
  });
}
function body21(text10, spec, style = {}) {
  return TextBlock(text10, {
    color: style.color || "#1F3A8A",
    fontSize: 15,
    lineHeight: 1.32,
    ...role24("body", spec, { fontWeight: 450, fontSize: 15, lineHeight: 1.32 }),
    ...style
  });
}
function label22(text10, spec, style = {}) {
  return TextBlock(String(text10 || "").toUpperCase(), {
    color: style.color || "#1F3A8A",
    fontSize: 10,
    lineHeight: 1.15,
    letterSpacing: 1.35,
    textTransform: "uppercase",
    ...role24("label", spec, { fontWeight: 650, fontSize: 10, lineHeight: 1.15, letterSpacing: 1.35, textTransform: "uppercase" }),
    ...style
  });
}
function metric13(text10, spec, style = {}) {
  return TextBlock(String(text10 || ""), {
    color: style.color || "#1F3A8A",
    fontSize: 14,
    lineHeight: 1.15,
    letterSpacing: 0.7,
    ...role24("metric", spec, { fontWeight: 650, fontSize: 14, lineHeight: 1.15, letterSpacing: 0.7 }),
    ...style
  });
}
function handwritten(text10, spec, style = {}) {
  return TextBlock(text10, {
    color: style.color || "#1F3A8A",
    fontSize: 28,
    lineHeight: 1.05,
    whiteSpace: "pre-wrap",
    ...role24("display", spec, { fontWeight: 700, fontSize: 28, lineHeight: 1.05 }),
    ...style
  });
}
function page13(theme8, children, style = {}) {
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme8.paper,
      color: theme8.ink,
      ...style
    },
    [
      box({
        position: "absolute",
        left: 0,
        top: 0,
        width: 960,
        height: 540,
        opacity: 0.1,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${theme8.ink} 1px, transparent 1.7px)`,
        backgroundSize: "5px 5px"
      }),
      ...children
    ]
  );
}
function footer(spec, theme8, variant) {
  return box({ position: "absolute", left: 64, right: 64, bottom: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
    label22("North Field Office", spec, { fontSize: 8.5, letterSpacing: 1.2, color: theme8.ink }),
    label22(`${String(PAGE_VARIANTS26.indexOf(variant) + 1).padStart(2, "0")} / 11`, spec, { fontSize: 8.5, letterSpacing: 1.2, color: theme8.ink, textAlign: "right" })
  ]);
}
function topBar(spec, theme8, title2, meta = ["North Field Office", "Phase I"], color = theme8.ink) {
  return box({ position: "absolute", left: 64, right: 64, top: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
    box({ flexDirection: "row", alignItems: "center" }, [
      box({ width: 18, height: 10, borderTopWidth: 2, borderBottomWidth: 2, borderColor: color, marginRight: 8 }),
      label22(title2, spec, { color, fontSize: 8.6, letterSpacing: 1.1 })
    ]),
    box({ flexDirection: "row", alignItems: "center" }, meta.slice(0, 2).map(
      (item, index) => label22(item, spec, { color, opacity: 0.75, fontSize: 8.2, letterSpacing: 1, marginLeft: index === 0 ? 0 : 20 })
    ))
  ]);
}
function pin(theme8, { left, right, top, bottom, width = 130, rotate = -8, color = theme8.ink, opacity = 1 }) {
  const height = Math.round(width * 0.3);
  const style = { position: "absolute", width, height, transform: `rotate(${rotate}deg)`, opacity };
  if (left !== void 0) style.left = left;
  if (right !== void 0) style.right = right;
  if (top !== void 0) style.top = top;
  if (bottom !== void 0) style.bottom = bottom;
  return box(style, [
    box({ position: "absolute", left: 5, top: height * 0.28, width: width * 0.18, height: height * 0.38, borderRadius: 999, borderWidth: 2, borderColor: color }),
    box({ position: "absolute", left: width * 0.16, top: height * 0.45, width: width * 0.62, height: 2.5, backgroundColor: color }),
    box({ position: "absolute", right: width * 0.04, top: height * 0.22, width: width * 0.16, height: height * 0.44, borderRadius: 999, borderWidth: 2, borderColor: color }),
    box({ position: "absolute", right: 0, top: height * 0.44, width: width * 0.2, height: 2.5, backgroundColor: color })
  ]);
}
function card(theme8, spec, children, style = {}) {
  return box(
    {
      backgroundColor: theme8.cream,
      borderWidth: 1.5,
      borderColor: theme8.ink,
      borderRadius: 4,
      boxShadow: `4px 5px 0 ${theme8.ink}`,
      position: "relative",
      flexDirection: "column",
      ...style
    },
    children
  );
}
function cover2(spec, theme8) {
  const c = variantContent2(spec, "cover");
  const notes2 = array18(spec, "notes", c.notes);
  return page13(theme8, [
    pin(theme8, { right: 80, top: 70, width: 210, rotate: -8 }),
    pin(theme8, { right: 132, top: 256, width: 180, rotate: 14 }),
    box({ position: "absolute", inset: 0, padding: "62px 64px 58px", flexDirection: "column", justifyContent: "space-between" }, [
      label22(value14(spec, "eyebrow", c.eyebrow), spec, { fontSize: 11, letterSpacing: 2 }),
      display11(value14(spec, "title", c.title), spec, { width: 520, fontSize: 100, lineHeight: 1, letterSpacing: -2.8 }),
      box({ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, [
        metric13(notes2[1] || c.notes[1], spec, { width: 360, fontSize: 10.5, letterSpacing: 1.3, whiteSpace: "pre-wrap" }),
        metric13(value14(spec, "date", c.date), spec, { width: 180, textAlign: "right", fontSize: 10.5, letterSpacing: 1.3 })
      ])
    ]),
    handwritten(notes2[0] || c.notes[0], spec, { position: "absolute", right: 76, top: 160, width: 210, textAlign: "right", transform: "rotate(-3deg)" })
  ]);
}
function agenda(spec, theme8) {
  const c = variantContent2(spec, "agenda");
  const items = array18(spec, "items", c.items);
  return page13(theme8, [
    topBar(spec, theme8, value14(spec, "eyebrow", c.eyebrow), array18(spec, "meta", c.meta)),
    display11(value14(spec, "title", c.title), spec, { position: "absolute", left: 64, top: 104, width: 560, fontSize: 70, lineHeight: 1 }),
    box({ position: "absolute", left: 64, right: 64, top: 238, flexDirection: "column" }, items.slice(0, 4).map(
      (item, index) => box({ height: 58, borderBottomWidth: index === 3 ? 0 : 1.5, borderBottomColor: "rgba(31,58,138,.45)", flexDirection: "row", alignItems: "center" }, [
        metric13(item.num, spec, { width: 80, fontSize: 14, letterSpacing: 1.2 }),
        display11(item.label, spec, { width: 440, fontSize: 30, lineHeight: 1, letterSpacing: -0.5 }),
        pin(theme8, { left: 590, top: 14, width: 108, rotate: index === 2 ? 6 : -4 }),
        label22(item.meta, spec, { width: 172, marginLeft: 170, textAlign: "right", opacity: 0.7, fontSize: 8.5, letterSpacing: 1.1 })
      ])
    )),
    footer(spec, theme8, "agenda")
  ]);
}
function notes(spec, theme8) {
  const c = variantContent2(spec, "notes");
  const cards = array18(spec, "cards", c.cards);
  return page13(theme8, [
    topBar(spec, theme8, "Principles", ["North Field Office", "Phase II"]),
    display11(value14(spec, "title", c.title), spec, { position: "absolute", left: 64, top: 104, width: 650, fontSize: 58, lineHeight: 1 }),
    body21(value14(spec, "subtitle", c.subtitle), spec, { position: "absolute", left: 64, top: 222, width: 660, fontSize: 14, lineHeight: 1.32, opacity: 0.85 }),
    box({ position: "absolute", left: 64, right: 64, top: 304, bottom: 76, flexDirection: "row" }, cards.slice(0, 3).map(
      (item, index) => card(theme8, spec, [
        pin(theme8, { left: 22, top: -16, width: 105, rotate: index === 2 ? 6 : -8 }),
        label22(item.num, spec, { fontSize: 8.4, letterSpacing: 1.4, opacity: 0.7, marginBottom: 8 }),
        display11(item.title, spec, { fontSize: 24, lineHeight: 1, width: 214, marginBottom: 9 }),
        body21(item.body, spec, { fontSize: 11.2, lineHeight: 1.28, width: 214 }),
        handwritten(item.scribble, spec, { marginTop: "auto", paddingTop: 8, fontSize: 18, lineHeight: 1.05, transform: "rotate(-1.5deg)" })
      ], {
        width: 266,
        height: 160,
        padding: "24px 20px 16px",
        marginRight: index === 2 ? 0 : 29,
        backgroundColor: index === 1 ? theme8.paper2 : index === 2 ? theme8.extra : theme8.cream,
        ...index === 2 ? { transform: "rotate(.6deg)" } : {}
      })
    )),
    footer(spec, theme8, "notes")
  ]);
}
function sec(spec, theme8) {
  const c = variantContent2(spec, "sec");
  return page13(theme8, [
    label22(value14(spec, "eyebrow", c.eyebrow), spec, { position: "absolute", left: 64, top: 70, color: theme8.paper, opacity: 0.82, letterSpacing: 2 }),
    label22(value14(spec, "label", c.label), spec, { position: "absolute", right: 64, top: 70, width: 230, color: theme8.paper, opacity: 0.82, textAlign: "right", letterSpacing: 2, whiteSpace: "pre-wrap" }),
    pin(theme8, { right: 58, top: 190, width: 310, rotate: -14, color: theme8.paper, opacity: 0.88 }),
    display11(value14(spec, "title", c.title), spec, { position: "absolute", left: 64, bottom: 116, width: 560, color: theme8.paper, fontSize: 86, lineHeight: 1, letterSpacing: -2 }),
    handwritten(value14(spec, "scribble", c.scribble), spec, { position: "absolute", left: 64, bottom: 66, width: 240, color: theme8.paper, fontSize: 25, transform: "rotate(-2deg)" }),
    footer(spec, { ...theme8, ink: theme8.paper }, "sec")
  ], { backgroundColor: theme8.ink });
}
function notice(spec, theme8) {
  const c = variantContent2(spec, "notice");
  const columns = array18(spec, "columns", c.columns);
  return page13(theme8, [
    topBar(spec, theme8, "Findings - detail", ["North Field Office", "Phase III"]),
    box({ position: "absolute", left: 64, right: 64, top: 100, flexDirection: "row", alignItems: "flex-start" }, [
      label22(value14(spec, "eyebrow", c.eyebrow), spec, { width: 136, borderRightWidth: 2, borderRightColor: theme8.ink, paddingRight: 18, paddingTop: 8, fontSize: 8.4, letterSpacing: 1.45, whiteSpace: "pre-wrap" }),
      display11(value14(spec, "title", c.title), spec, { marginLeft: 24, width: 690, fontSize: 33, lineHeight: 1.04, letterSpacing: -0.5 })
    ]),
    box({ position: "absolute", left: 64, right: 64, top: 274, bottom: 72, flexDirection: "row" }, columns.slice(0, 3).map(
      (item, index) => card(theme8, spec, [
        display11(item.title, spec, { fontSize: 18, lineHeight: 1.02, borderBottomWidth: 1.5, borderBottomColor: theme8.ink, paddingBottom: 8, marginBottom: 8, width: 226 }),
        item.meta ? handwritten(item.meta, spec, { fontSize: 22, lineHeight: 1, marginBottom: 6 }) : null,
        body21(item.body, spec, { fontSize: 9.5, lineHeight: 1.24, width: 226, marginBottom: 6 }),
        ...(item.bullets || []).slice(0, 3).map(
          (bullet) => body21(`- ${bullet}`, spec, { fontSize: 8.8, lineHeight: 1.18, width: 226, marginBottom: 3 })
        ),
        label22(item.source, spec, { marginTop: "auto", paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(31,58,138,.45)", fontSize: 6.8, letterSpacing: 0.8, opacity: 0.76 })
      ].filter(Boolean), {
        width: 262,
        height: 194,
        padding: "16px 16px 12px",
        marginRight: index === 2 ? 0 : 28,
        backgroundColor: index === 1 ? theme8.paper2 : theme8.cream
      })
    )),
    footer(spec, theme8, "notice")
  ]);
}
function chartLine(theme8, color, points, width, height, stroke = 3) {
  return points.slice(1).map((point, index) => {
    const prev = points[index];
    const x1 = prev[0] * width;
    const y1 = prev[1] * height;
    const x2 = point[0] * width;
    const y2 = point[1] * height;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return box({
      position: "absolute",
      left: x1,
      top: y1,
      width: length,
      height: stroke,
      backgroundColor: color,
      transform: `rotate(${angle}deg)`,
      transformOrigin: "0 50%",
      borderRadius: 999
    });
  });
}
function chart(spec, theme8) {
  const c = variantContent2(spec, "chart");
  const legend = array18(spec, "legend", c.legend);
  const plotW = 315;
  const plotH = 204;
  return page13(theme8, [
    topBar(spec, { ...theme8, ink: theme8.paper }, "Retention, by cohort", ["Phase III", "Evidence"], theme8.paper),
    pin(theme8, { right: 56, top: 86, width: 160, rotate: 20, color: theme8.paper, opacity: 0.35 }),
    box({ position: "absolute", left: 64, top: 150, bottom: 74, width: 344, flexDirection: "column" }, [
      display11(value14(spec, "title", c.title), spec, { width: 330, color: theme8.paper, fontSize: 58, lineHeight: 1 }),
      body21(value14(spec, "subtitle", c.subtitle), spec, { width: 320, color: theme8.paper, opacity: 0.88, fontSize: 13.5, lineHeight: 1.36, marginTop: 16 }),
      box({ marginTop: "auto", flexDirection: "column" }, legend.slice(0, 3).map(
        (item, index) => box({ flexDirection: "row", alignItems: "center", marginTop: index === 0 ? 0 : 8 }, [
          box({ width: 32, height: 4, backgroundColor: [theme8.paper2, theme8.cream, theme8.paper][index], marginRight: 10 }),
          label22(item, spec, { color: theme8.paper, fontSize: 7.8, letterSpacing: 0.8 })
        ])
      ))
    ]),
    card(theme8, spec, [
      label22("% of cohort active, by day", spec, { opacity: 0.7, marginBottom: 12 }),
      box({ position: "relative", width: plotW, height: plotH, marginLeft: 40, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme8.ink }, [
        ...[0, 0.25, 0.5, 0.75].map((top) => box({ position: "absolute", left: 0, right: 0, top: top * plotH, height: 1, borderTopWidth: 1, borderTopColor: "rgba(31,58,138,.25)" })),
        ...chartLine(theme8, theme8.ink, [[0, 0.04], [0.16, 0.3], [0.32, 0.5], [0.48, 0.64], [0.64, 0.76], [0.8, 0.84], [1, 0.9]], plotW, plotH, 2),
        ...chartLine(theme8, theme8.inkSoft, [[0, 0.04], [0.16, 0.18], [0.32, 0.28], [0.48, 0.38], [0.64, 0.46], [0.8, 0.52], [1, 0.56]], plotW, plotH, 3),
        ...chartLine(theme8, theme8.ink, [[0, 0.04], [0.16, 0.1], [0.32, 0.16], [0.48, 0.22], [0.64, 0.28], [0.8, 0.32], [1, 0.36]], plotW, plotH, 4)
      ]),
      box({ flexDirection: "row", justifyContent: "space-between", marginLeft: 38, marginTop: 8, width: plotW + 2 }, ["D0", "D7", "D14", "D30", "D45", "D60", "D90"].map(
        (x) => metric13(x, spec, { fontSize: 8.5, letterSpacing: 0.5 })
      ))
    ], { position: "absolute", right: 64, top: 146, width: 438, height: 318, padding: "26px 28px 20px 30px", backgroundColor: theme8.paper, boxShadow: `6px 7px 0 rgba(239,229,106,.25)` }),
    footer(spec, { ...theme8, ink: theme8.paper }, "chart")
  ], { backgroundColor: theme8.ink });
}
function process(spec, theme8) {
  const c = variantContent2(spec, "process");
  const steps = array18(spec, "steps", c.steps);
  const timeline = array18(spec, "timeline", c.timeline);
  return page13(theme8, [
    topBar(spec, theme8, "How we'll work", ["North Field Office", "Phase IV"]),
    box({ position: "absolute", left: 64, right: 64, top: 100, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, [
      display11(value14(spec, "title", c.title), spec, { width: 560, fontSize: 56, lineHeight: 1 }),
      body21(value14(spec, "subtitle", c.subtitle), spec, { width: 260, fontSize: 13.2, lineHeight: 1.34, opacity: 0.85, marginTop: 10 })
    ]),
    box({ position: "absolute", left: 64, right: 64, top: 284, flexDirection: "row" }, steps.slice(0, 5).map(
      (item, index) => card(theme8, spec, [
        pin(theme8, { left: 38, top: -14, width: 88, rotate: -6 }),
        handwritten(item.n, spec, { fontSize: 39, lineHeight: 0.9 }),
        display11(item.title, spec, { fontSize: 18, lineHeight: 1, marginTop: 2, marginBottom: 4 }),
        body21(item.body, spec, { fontSize: 8.8, lineHeight: 1.2, width: 132 }),
        index < 4 ? TextBlock("->", { position: "absolute", right: -15, top: 54, color: theme8.ink, fontSize: 20, fontWeight: 700 }) : null
      ].filter(Boolean), {
        width: 148,
        height: 120,
        padding: "24px 14px 12px",
        marginRight: index === 4 ? 0 : 22,
        backgroundColor: index === 2 ? theme8.extra : index % 2 ? theme8.paper2 : theme8.cream
      })
    )),
    box({ position: "absolute", left: 64, right: 64, bottom: 86, height: 38, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme8.ink, padding: "0 18px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, timeline.slice(0, 5).map(
      (item) => label22(item, spec, { fontSize: 7.4, letterSpacing: 0.7 })
    )),
    footer(spec, theme8, "process")
  ]);
}
function matrix(spec, theme8) {
  const c = variantContent2(spec, "matrix");
  const rows = array18(spec, "rows", c.rows);
  const headers = array18(spec, "headers", c.headers);
  return page13(theme8, [
    topBar(spec, theme8, "Three pilots, side by side", ["North Field Office", "Phase IV"]),
    box({ position: "absolute", left: 64, right: 64, top: 100, flexDirection: "row", justifyContent: "space-between" }, [
      display11(value14(spec, "title", c.title), spec, { width: 510, fontSize: 56, lineHeight: 1 }),
      body21(value14(spec, "subtitle", c.subtitle), spec, { width: 270, fontSize: 13.5, lineHeight: 1.35, opacity: 0.85, marginTop: 12 })
    ]),
    card(theme8, spec, [
      box({ height: 40, flexDirection: "row", backgroundColor: theme8.ink }, headers.slice(0, 4).map(
        (head, index) => label22(head, spec, { width: index === 0 ? 232 : 192, color: theme8.paper, fontSize: 8.5, letterSpacing: 0.8, padding: "14px 12px 0", borderRightWidth: index === 3 ? 0 : 1, borderRightColor: "rgba(239,229,106,.3)" })
      )),
      ...rows.slice(0, 4).map(
        (row, rowIndex) => box({ height: 37, flexDirection: "row", borderBottomWidth: rowIndex === 3 ? 0 : 1.2, borderBottomColor: "rgba(31,58,138,.5)" }, row.slice(0, 4).map(
          (cell, index) => index === 0 ? display11(cell, spec, { width: 232, fontSize: 13, lineHeight: 1.05, padding: "11px 12px 0", borderRightWidth: 1.2, borderRightColor: "rgba(31,58,138,.5)" }) : handwritten(cell, spec, { width: 192, fontSize: cell === "material" ? 11 : 16, lineHeight: 1, padding: "11px 12px 0", borderRightWidth: index === 3 ? 0 : 1.2, borderRightColor: "rgba(31,58,138,.5)", color: cell === "material" ? theme8.red : theme8.ink })
        ))
      )
    ], { position: "absolute", left: 64, right: 64, top: 280, height: 188, overflow: "hidden", padding: 0 }),
    footer(spec, theme8, "matrix")
  ]);
}
function stats(spec, theme8) {
  const c = variantContent2(spec, "stats");
  const statsItems = array18(spec, "stats", c.stats);
  return page13(theme8, [
    topBar(spec, theme8, "In numbers", ["Phase III", "Evidence"]),
    box({ position: "absolute", left: 64, right: 64, top: 100, flexDirection: "row", justifyContent: "space-between" }, [
      display11(value14(spec, "title", c.title), spec, { width: 500, fontSize: 58, lineHeight: 1 }),
      body21(value14(spec, "subtitle", c.subtitle), spec, { width: 270, fontSize: 13.5, lineHeight: 1.35, opacity: 0.85, marginTop: 12 })
    ]),
    box({ position: "absolute", left: 64, right: 64, top: 284, bottom: 74, flexDirection: "row" }, statsItems.slice(0, 3).map(
      (item, index) => card(theme8, spec, [
        pin(theme8, { left: 28, top: -14, width: 104, rotate: -8 }),
        box({ flexDirection: "row", alignItems: "flex-start", marginTop: 12 }, [
          display11(item.value, spec, { fontSize: item.value.length > 3 ? 58 : 82, lineHeight: 0.82, width: 132 }),
          handwritten(item.suffix, spec, { fontSize: 28, marginLeft: 4, marginTop: 6 })
        ]),
        display11(item.title, spec, { fontSize: 18, lineHeight: 1, marginTop: "auto", marginBottom: 6 }),
        body21(item.body, spec, { fontSize: 10.2, lineHeight: 1.24, width: 218 })
      ], {
        width: 262,
        height: 182,
        padding: "24px 20px 16px",
        marginRight: index === 2 ? 0 : 28,
        backgroundColor: index === 1 ? theme8.paper2 : index === 2 ? theme8.extra : theme8.cream
      })
    )),
    footer(spec, theme8, "stats")
  ]);
}
function quote2(spec, theme8) {
  const c = variantContent2(spec, "quote");
  return page13(theme8, [
    topBar(spec, theme8, "Client voice", ["Phase III", "Evidence"]),
    card(theme8, spec, [
      pin(theme8, { left: 86, top: -22, width: 150, rotate: -12 }),
      handwritten('"', spec, { width: 230, fontSize: 180, lineHeight: 0.75, marginTop: -38 }),
      box({ flexDirection: "column", width: 520 }, [
        display11(value14(spec, "quote", c.quote), spec, { fontSize: 34, lineHeight: 1.08, letterSpacing: -0.5, width: 510 }),
        metric13(value14(spec, "author", c.author), spec, { marginTop: 24, fontSize: 11, letterSpacing: 1.1 }),
        label22(value14(spec, "meta", c.meta), spec, { marginTop: 5, fontSize: 8.5, opacity: 0.7, letterSpacing: 0.9 })
      ])
    ], { position: "absolute", left: 80, right: 80, top: 126, bottom: 92, padding: "54px 70px", flexDirection: "row", alignItems: "center", boxShadow: `8px 9px 0 ${theme8.ink}` }),
    footer(spec, theme8, "quote")
  ]);
}
function cta(spec, theme8) {
  const c = variantContent2(spec, "cta");
  const steps = array18(spec, "steps", c.steps);
  return page13(theme8, [
    topBar(spec, theme8, "What's next", ["North Field Office", "Phase V"]),
    box({ position: "absolute", left: 64, right: 64, top: 86, bottom: 70, flexDirection: "row" }, [
      box({ width: 436, backgroundColor: theme8.ink, color: theme8.paper, padding: 30, borderRadius: 4, position: "relative" }, [
        label22("From here", spec, { position: "absolute", left: 30, top: 31, color: theme8.paper, opacity: 0.85, letterSpacing: 1.8 }),
        display11(value14(spec, "title", c.title), spec, { position: "absolute", left: 30, top: 78, width: 360, color: theme8.paper, fontSize: 62, lineHeight: 0.98, letterSpacing: -1.4 }),
        body21(value14(spec, "subtitle", c.subtitle), spec, { position: "absolute", left: 30, bottom: 42, width: 275, color: theme8.paper, opacity: 0.9, fontSize: 12.5, lineHeight: 1.35 }),
        pin(theme8, { right: 28, bottom: 42, width: 146, rotate: -12, color: theme8.paper })
      ]),
      card(theme8, spec, [
        display11(value14(spec, "right_title", c.right_title), spec, { fontSize: 26, lineHeight: 1, marginBottom: 8 }),
        ...steps.slice(0, 3).map(
          (item, index) => box({ flexDirection: "row", padding: "12px 0", borderTopWidth: index === 0 ? 0 : 1.5, borderTopColor: "rgba(31,58,138,.45)" }, [
            handwritten(item.n, spec, { width: 54, fontSize: 42, lineHeight: 0.9 }),
            box({ flexDirection: "column", width: 250 }, [
              display11(item.title, spec, { fontSize: 16.5, lineHeight: 1, marginBottom: 4 }),
              body21(item.body, spec, { fontSize: 10.5, lineHeight: 1.28 })
            ])
          ])
        )
      ], { width: 396, marginLeft: 32, padding: 30, flexDirection: "column" })
    ]),
    footer(spec, theme8, "cta")
  ]);
}
var RENDERERS19 = {
  cover: cover2,
  agenda,
  notes,
  sec,
  notice,
  chart,
  process,
  matrix,
  stats,
  quote: quote2,
  cta
};
function renderAnnotatedFieldBoard(spec) {
  const theme8 = colors19(spec);
  const variant = normalizeVariant26(spec);
  return (RENDERERS19[variant] || cover2)(spec, theme8);
}

// templates/beautiful/pink-nocturne-feature.mjs
var templateId28 = "pink-nocturne-feature";
var CANVAS18 = { width: 960, height: 540 };
var PAGE_VARIANTS27 = ["cover", "toc", "stats", "section", "chart", "process", "matrix", "quote", "cta"];
var rendererContract28 = {
  template_id: templateId28,
  renderer_id: `artboard_satori.${templateId28}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "pink-script",
  implemented_page_variants: PAGE_VARIANTS27,
  page_family: {
    family_id: "pink-script",
    supported_page_variants: PAGE_VARIANTS27,
    variant_usage_policy: {
      singletons: ["cover", "toc", "section", "quote", "cta"],
      repeatable: ["stats", "chart", "process", "matrix"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/pink-script-1.png"
};
var DEFAULTS26 = {
  cover: {
    brand: "Maison Nocturne",
    meta: "Vol. XIV \xB7 A/W 2026",
    pre: "A Field Report on Late-Night Couture",
    title_top: "After",
    title_bottom: "Hours.",
    lower: [
      { label: "Edition", value: "No. 14", accent: true },
      { label: "Director", value: "L. Marchetti" },
      { label: "Locale", value: "Paris \xB7 11e" },
      { label: "Date", value: "May 2026", accent: true }
    ],
    footer: "Maison Nocturne \xB7 Confidential",
    pageno: "01 / 09"
  },
  toc: {
    brand: "After Hours",
    meta: "The Index",
    title: "The",
    title_small: "Index.",
    rows: [
      { num: "01", title: "By the Numbers", desc: "Five figures that shape the season.", meta: "Stats \xB7 pp. 14" },
      { num: "02", title: "Movements", desc: "A study in cuts, color, and silhouette.", meta: "Section \xB7 pp. 22", current: true },
      { num: "03", title: "The Curve", desc: "Twelve weeks of after-hours behavior.", meta: "Chart \xB7 pp. 36" },
      { num: "04", title: "The Field", desc: "Where we sit among the houses we admire.", meta: "Matrix \xB7 pp. 48" },
      { num: "05", title: "Voices & Encore", desc: "Critics, clients, and what comes next.", meta: "pp. 60-72" }
    ],
    footer: "Maison Nocturne",
    pageno: "02 / 09"
  },
  stats: {
    brand: "Chapter 01",
    meta: "By the Numbers \xB7 A/W26",
    kicker: "By the Numbers",
    title: "A season\ntold in\nfive figures.",
    body: "Read top to bottom. Every figure was reported by atelier directors during the eight-week previewing window and represents the house ledger only.",
    stats: [
      { value: "42", unit: "%", label: "Couture \xB7 Repeat Clients", desc: "Patrons who returned within ninety days for a second commission." },
      { value: "3.8", unit: "\xD7", label: "Atelier Throughput", desc: "Pieces released per machinist per week, measured against the prior Spring book." },
      { value: "\u20AC1.4", unit: "M", label: "Average Ticket \xB7 Vault", desc: "Mean spend per private appointment in the Vault programme this quarter." },
      { value: "86", unit: "%", label: "Reservation Rate", desc: "Show seats filled before the public window opened." },
      { value: "07", unit: "", label: "New Cities, A/W", desc: "Markets opened with a flagship boutique since the prior season." }
    ],
    footer: "Source \xB7 Atelier Ledger Q1",
    pageno: "03 / 09"
  },
  section: {
    brand: "Chapter 02",
    meta: "Movements",
    vertical: "Maison Nocturne \xB7 Vol. XIV",
    number: "02",
    kicker: "Movements",
    title: "A study\nin cuts\n& color.",
    body: "Three silhouettes carry the season \u2014 the column, the cape, and the cinch. Each is annotated in the chapters that follow.",
    footer: "Chapter 02 of 05",
    pageno: "04 / 09"
  },
  chart: {
    brand: "Chapter 03",
    meta: "The Curve",
    title: "Twelve weeks of after-hours\nbehavior.",
    legends: ["House \xB7 A/W26", "Sector benchmark"],
    callout_value: "+38%",
    callout_label: "Week 09 inflection",
    callout_desc: "After the editorial dropped, walk-ins to the rue Saint-Honor\xE9 flagship doubled within seventy-two hours.",
    xaxis: ["W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09", "W10", "W11", "W12"],
    footer: "Source \xB7 House register \xB7 Index FY25=100",
    pageno: "05 / 09"
  },
  process: {
    brand: "Chapter 04",
    meta: "The Method",
    title: "The\nmethod.",
    lead: "From sketchbook to runway in five movements. The atelier's tempo is dictated by the cloth, never the calendar.",
    steps: [
      { num: "01", title: "Brief", body: "The house director and head couturier convene with three muses to set the season's mood." },
      { num: "02", title: "Pattern", body: "Toiles cut in calico. Each silhouette is fitted three times before approval is granted." },
      { num: "03", title: "Atelier", body: "Cloth is cut on the bias. Hand-stitched seams. No piece leaves without two signatures." },
      { num: "04", title: "Fitting", body: "Private appointments held by candlelight in the Vault. Clients touch the cloth before final approval." },
      { num: "05", title: "Runway", body: "Twelve looks shown. The collection is sold by appointment before the public window opens." }
    ],
    timeline: ["Wk 01-02 Brief", "Wk 03-06 Pattern", "Wk 07-10 Atelier", "Wk 11-12 Fitting", "Wk 13 Runway"],
    footer: "Atelier Method \xB7 House Standard",
    pageno: "06 / 09"
  },
  matrix: {
    brand: "Chapter 05",
    meta: "The Field",
    title: "The\nfield, in five rows.",
    source: "Sourced \xB7 house registers, public filings, three trade press indices \xB7 A/W 2026",
    headers: ["Dimension", "Maison Nocturne", "House A", "House B"],
    rows: [
      ["Atelier model", "In-house \xB7 Paris", "Hybrid \xB7 2 cities", "Outsourced"],
      ["Lead time", "13 weeks, hand-stitched", "9 weeks, partial machine", "6 weeks, full machine"],
      ["Vault programme", "Yes \xB7 invitation", "No", "By appointment"],
      ["Repeat client share", "42%", "28%", "19%"],
      ["Public window", "90 days post-show", "30 days post-show", "Same day"]
    ],
    footer: "Comparison \xB7 A/W 2026 disclosed",
    pageno: "07 / 09"
  },
  quote: {
    brand: "Chapter 06",
    meta: "Voices",
    qmark: '"',
    label: "Voices \xB7 Issue 14",
    quote: "The house dresses you for an evening that hasn't begun. You leave the fitting and somewhere a room is already waiting.",
    who: "\u2014 Camille Aubry",
    role: "Editor-in-chief \xB7 Le Soir Parisien",
    footer: "Voices \xB7 Le Soir Parisien",
    pageno: "08 / 09"
  },
  cta: {
    brand: "Chapter 07",
    meta: "Encore",
    pre: "An invitation",
    title: "Encore.\nThe list opens\nthis Friday.",
    steps: [
      { num: "01", title: "Reserve", body: "Hold a Vault appointment for the week of 24 May. Couture only." },
      { num: "02", title: "Preview", body: "Three looks shown by candlelight in the rue Saint-Honor\xE9 room." },
      { num: "03", title: "Commission", body: "One piece commissioned to your measure, delivered before September." }
    ],
    qr_label: "Vault access",
    url: "maison.nocturne",
    footer: "RSVP \xB7 Private client office",
    pageno: "09 / 09"
  }
};
function theme6() {
  return {
    ink: "#060507",
    ink2: "#0F0D11",
    glow: "#1A1218",
    paper: "#F5EDF1",
    pink: "#ED3D8C",
    pink2: "#FF66A8",
    pinkDeep: "#B81D67",
    line: "rgba(237,61,140,0.32)",
    mute: "rgba(245,237,241,0.55)",
    hair: "rgba(245,237,241,0.14)"
  };
}
function content14(spec, variant) {
  return { ...DEFAULTS26[variant] || DEFAULTS26.cover, ...spec.content || {} };
}
function normalizeVariant27(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS27.length) return PAGE_VARIANTS27[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS27) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda") || raw.includes("toc") || raw.includes("index")) return "toc";
  if (raw.includes("metric") || raw.includes("stat") || raw.includes("data")) return "stats";
  if (raw.includes("section") || raw.includes("chapter")) return "section";
  if (raw.includes("chart") || raw.includes("curve")) return "chart";
  if (raw.includes("process") || raw.includes("timeline") || raw.includes("roadmap")) return "process";
  if (raw.includes("matrix") || raw.includes("compare") || raw.includes("comparison")) return "matrix";
  if (raw.includes("quote") || raw.includes("voice")) return "quote";
  if (raw.includes("closing") || raw.includes("close") || raw.includes("cta") || raw.includes("encore")) return "cta";
  return "cover";
}
function role25(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function mono3(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: theme6().mute,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    ...role25("label", spec, { fontWeight: 400, lineHeight: 1.05 }),
    ...style
  });
}
function serif6(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: theme6().paper,
    fontSize: 44,
    fontWeight: 400,
    lineHeight: 1.04,
    letterSpacing: -0.2,
    whiteSpace: "pre-line",
    ...role25("display", spec, { fontWeight: 400 }),
    ...style
  });
}
function sans(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: theme6().paper,
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1.45,
    ...role25("body", spec, { fontWeight: 300 }),
    ...style
  });
}
function metric14(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: theme6().pink,
    fontSize: 44,
    fontWeight: 400,
    lineHeight: 0.95,
    letterSpacing: -0.2,
    ...role25("metric", spec, { fontWeight: 400, fontSize: 44, lineHeight: 0.95, letterSpacing: -0.2 }),
    ...style
  });
}
function frame13() {
  const t = theme6();
  return box({ position: "absolute", inset: 18, borderWidth: 1, borderColor: t.hair });
}
function surface2(children = []) {
  const t = theme6();
  return box(
    {
      width: CANVAS18.width,
      height: CANVAS18.height,
      position: "relative",
      overflow: "hidden",
      backgroundColor: t.ink,
      color: t.paper
    },
    [
      box({ position: "absolute", left: -90, top: -80, width: 720, height: 560, borderRadius: 360, backgroundColor: t.glow, opacity: 0.62 }),
      box({ position: "absolute", inset: 0, backgroundColor: "#FFFFFF", opacity: 0.012 }),
      frame13(),
      ...children
    ]
  );
}
function runner(spec, c) {
  const t = theme6();
  return box({ position: "absolute", left: 30, right: 30, top: 30, height: 18, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }, [
    mono3(c.brand || "Maison Nocturne", spec, { color: t.pink, fontSize: 11 }),
    mono3(c.meta || "", spec, { color: t.mute, fontSize: 11, textAlign: "right" })
  ]);
}
function footer2(spec, c) {
  const t = theme6();
  return box({ position: "absolute", left: 30, right: 30, bottom: 30, height: 18, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }, [
    mono3(c.footer || "Maison Nocturne", spec, { color: t.mute, fontSize: 11 }),
    mono3(c.pageno || "", spec, { color: t.paper, fontSize: 11, textAlign: "right" })
  ]);
}
function renderCover22(spec) {
  const t = theme6();
  const c = content14(spec, "cover");
  const lower = Array.isArray(c.lower) ? c.lower.slice(0, 4) : DEFAULTS26.cover.lower;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 90, height: 185, alignItems: "center", flexDirection: "column" }, [
      mono3(c.pre, spec, { color: t.paper, opacity: 0.75, fontSize: 13, letterSpacing: 4.2, marginBottom: 8 }),
      serif6(c.title_top, spec, { color: t.pink, fontSize: 92, lineHeight: 0.96, textShadow: "0 0 40px rgba(237,61,140,0.18)" }),
      serif6(c.title_bottom, spec, { color: t.paper, fontSize: 82, lineHeight: 0.92, paddingLeft: 88, marginTop: 2 })
    ]),
    box({ position: "absolute", left: 30, right: 30, bottom: 80, height: 58, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }, lower.map(
      (item) => box({ flexDirection: "column", width: 150, gap: 3 }, [
        mono3(item.label, spec, { fontSize: 9, color: t.mute }),
        serif6(item.value, spec, { fontSize: 24, lineHeight: 1.05, color: item.accent ? t.pink : t.paper })
      ])
    )),
    footer2(spec, c)
  ]);
}
function renderToc3(spec) {
  const t = theme6();
  const c = content14(spec, "toc");
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 5) : DEFAULTS26.toc.rows;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, bottom: 70, flexDirection: "row", gap: 40 }, [
      box({ width: 240, flexDirection: "column", justifyContent: "flex-start" }, [
        serif6(c.title, spec, { color: t.pink, fontSize: 105, lineHeight: 1.02 }),
        serif6(c.title_small, spec, { color: t.paper, fontSize: 40, lineHeight: 1.05, opacity: 0.85 })
      ]),
      box({ flex: 1, flexDirection: "column" }, rows.map(
        (row) => box({ height: 61, borderBottomWidth: 1, borderBottomColor: t.hair, flexDirection: "row", alignItems: "center", gap: 16 }, [
          metric14(row.num, spec, { width: 55, color: row.current ? t.pink : t.pink, fontSize: 32, lineHeight: 1 }),
          box({ flex: 1, flexDirection: "column" }, [
            serif6(row.title, spec, { color: row.current ? t.pink : t.paper, fontSize: 27, lineHeight: 1.05 }),
            sans(row.desc, spec, { color: t.mute, fontSize: 11, lineHeight: 1.32, marginTop: 2 })
          ]),
          mono3(row.meta, spec, { width: 112, color: t.mute, fontSize: 10, textAlign: "right", letterSpacing: 1.1 })
        ])
      ))
    ]),
    footer2(spec, c)
  ]);
}
function renderStats13(spec) {
  const t = theme6();
  const c = content14(spec, "stats");
  const stats2 = Array.isArray(c.stats) ? c.stats.slice(0, 5) : DEFAULTS26.stats.stats;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, bottom: 70, flexDirection: "row", gap: 30 }, [
      box({ width: 390, flexDirection: "column", justifyContent: "space-between", paddingRight: 10 }, [
        mono3(c.kicker, spec, { color: t.pink, fontSize: 11, letterSpacing: 2 }),
        serif6(c.title, spec, { color: t.paper, fontSize: 62, lineHeight: 1.02 }),
        sans(c.body, spec, { color: "rgba(245,237,241,0.75)", fontSize: 12, lineHeight: 1.45, width: 310 })
      ]),
      box({ flex: 1, flexDirection: "column", gap: 9 }, stats2.map(
        (item) => box({ height: 66, borderBottomWidth: 1, borderBottomColor: t.hair, flexDirection: "row", alignItems: "center", gap: 14 }, [
          box({ width: 120, flexDirection: "row", alignItems: "flex-start" }, [
            metric14(item.value, spec, { color: t.pink, fontSize: 55, lineHeight: 0.9 }),
            metric14(item.unit, spec, { color: t.paper, fontSize: 17, lineHeight: 1, marginTop: 9 })
          ]),
          box({ flex: 1, flexDirection: "column" }, [
            mono3(item.label, spec, { color: t.paper, fontSize: 10 }),
            sans(item.desc, spec, { color: t.mute, fontSize: 11, lineHeight: 1.35, marginTop: 4 })
          ])
        ])
      ))
    ]),
    footer2(spec, c)
  ]);
}
function renderSection3(spec) {
  const t = theme6();
  const c = content14(spec, "section");
  return surface2([
    runner(spec, c),
    mono3(String(c.vertical || "").replaceAll(" \xB7 ", "\n"), spec, {
      position: "absolute",
      left: 20,
      top: 230,
      width: 62,
      color: t.mute,
      fontSize: 8,
      lineHeight: 1.45,
      letterSpacing: 1.4,
      whiteSpace: "pre-line"
    }),
    box({ position: "absolute", left: 70, top: 105, width: 310, height: 260, borderRadius: 160, backgroundColor: t.pink, opacity: 0.08 }),
    metric14(c.number, spec, { position: "absolute", left: 100, top: 118, color: t.pink, fontSize: 260, lineHeight: 0.82 }),
    box({ position: "absolute", right: 50, top: 178, width: 198, flexDirection: "column", gap: 9 }, [
      mono3(c.kicker, spec, { color: t.pink, fontSize: 10 }),
      serif6(c.title, spec, { color: t.paper, fontSize: 41, lineHeight: 1.02 }),
      sans(c.body, spec, { color: t.mute, fontSize: 12, lineHeight: 1.45 })
    ]),
    footer2(spec, c)
  ]);
}
function renderChart11(spec) {
  const t = theme6();
  const c = content14(spec, "chart");
  const xaxis = Array.isArray(c.xaxis) ? c.xaxis.slice(0, 12) : DEFAULTS26.chart.xaxis;
  const segments = [
    [0, 104, 60, 96],
    [60, 96, 120, 88],
    [120, 88, 180, 78],
    [180, 78, 240, 64],
    [240, 64, 300, 48],
    [300, 48, 360, 34],
    [360, 34, 420, 8],
    [420, 8, 480, 0]
  ];
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, height: 120, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 40 }, [
      serif6(c.title, spec, { width: 560, color: t.paper, fontSize: 43, lineHeight: 1.05 }),
      box({ width: 190, flexDirection: "column", gap: 7, alignItems: "flex-end" }, (c.legends || DEFAULTS26.chart.legends).map(
        (item, idx) => box({ flexDirection: "row", alignItems: "center", gap: 7 }, [
          mono3(item, spec, { color: t.paper, fontSize: 9, letterSpacing: 1 }),
          box({ width: 18, height: 1.5, backgroundColor: idx === 0 ? t.pink : "rgba(245,237,241,0.45)" })
        ])
      ))
    ]),
    box({ position: "absolute", left: 80, top: 240, width: 610, height: 130 }, [
      ...[0, 0.25, 0.5, 0.75].map((pos) => box({ position: "absolute", left: 0, right: 0, top: `${pos * 100}%`, borderTopWidth: 1, borderTopColor: "rgba(237,61,140,0.18)", borderStyle: "dashed" })),
      box({ position: "absolute", left: 0, top: 0, bottom: 15, borderLeftWidth: 1, borderLeftColor: t.line }),
      box({ position: "absolute", left: 0, right: 0, bottom: 15, borderBottomWidth: 1, borderBottomColor: t.line }),
      ...segments.map(([x1, y1, x2, y2]) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return box({ position: "absolute", left: x1, top: y1, width: len, height: 2, backgroundColor: t.pink, transform: `rotate(${angle}deg)`, transformOrigin: "left center" });
      }),
      box({ position: "absolute", left: 420, top: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: t.pink }),
      box({ position: "absolute", left: 414, top: 2, width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: t.pink, opacity: 0.55 }),
      box({ position: "absolute", left: 0, right: 0, bottom: -14, flexDirection: "row", justifyContent: "space-between" }, xaxis.map(
        (item) => mono3(item, spec, { color: item === "W09" ? t.pink : t.mute, fontSize: 8, letterSpacing: 0.8 })
      ))
    ]),
    box({ position: "absolute", right: 30, top: 240, width: 180, height: 130, alignItems: "flex-end", flexDirection: "column", borderLeftWidth: 1, borderLeftColor: t.pink, paddingLeft: 12 }, [
      metric14(c.callout_value, spec, { color: t.pink, fontSize: 58, lineHeight: 0.9 }),
      mono3(c.callout_label, spec, { color: t.paper, fontSize: 10, textAlign: "right", marginTop: 4 }),
      sans(c.callout_desc, spec, { color: t.mute, fontSize: 10, lineHeight: 1.35, textAlign: "right", marginTop: 4 })
    ]),
    footer2(spec, c)
  ]);
}
function renderProcess6(spec) {
  const t = theme6();
  const c = content14(spec, "process");
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 5) : DEFAULTS26.process.steps;
  const timeline = Array.isArray(c.timeline) ? c.timeline.slice(0, 5) : DEFAULTS26.process.timeline;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, height: 170, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 30 }, [
      serif6(c.title, spec, { width: 330, color: t.paper, fontSize: 73, lineHeight: 1 }),
      sans(c.lead, spec, { width: 380, color: t.mute, fontSize: 13, lineHeight: 1.5, marginBottom: 18 })
    ]),
    box({ position: "absolute", left: 30, right: 30, top: 270, height: 132, flexDirection: "row", gap: 12 }, steps.map(
      (item, index) => box({ flex: 1, position: "relative", flexDirection: "column", gap: 6, borderTopWidth: 1, borderTopColor: t.pink, paddingTop: 13 }, [
        metric14(item.num, spec, { color: t.pink, fontSize: 46, lineHeight: 0.8 }),
        serif6(item.title, spec, { color: t.paper, fontSize: 19, lineHeight: 1.02 }),
        sans(item.body, spec, { color: t.mute, fontSize: 10, lineHeight: 1.32 }),
        index < steps.length - 1 ? TextBlock("\u2192", { position: "absolute", right: -9, top: 28, color: t.pink, fontSize: 18, ...role25("label", spec) }) : null
      ])
    )),
    box({ position: "absolute", left: 30, right: 30, bottom: 70, borderTopWidth: 1, borderTopColor: t.hair, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }, timeline.map(
      (item) => mono3(item, spec, { color: t.mute, fontSize: 9, letterSpacing: 0.9 })
    )),
    footer2(spec, c)
  ]);
}
function renderMatrix3(spec) {
  const t = theme6();
  const c = content14(spec, "matrix");
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 5) : DEFAULTS26.matrix.rows;
  const headers = Array.isArray(c.headers) ? c.headers.slice(0, 4) : DEFAULTS26.matrix.headers;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 88, height: 124, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 30 }, [
      serif6(c.title, spec, { width: 470, color: t.paper, fontSize: 54, lineHeight: 1.02 }),
      mono3(c.source, spec, { width: 240, color: t.mute, fontSize: 9, lineHeight: 1.45, textAlign: "right" })
    ]),
    box({ position: "absolute", left: 30, right: 30, top: 248, bottom: 70, flexDirection: "column" }, [
      tableRow(headers, spec, true),
      ...rows.map((row, index) => tableRow(row, spec, false, index === rows.length - 1))
    ]),
    footer2(spec, c)
  ]);
}
function tableRow(values, spec, header = false, last = false) {
  const t = theme6();
  const widths = [250, 205, 180, 180];
  return box({ height: header ? 34 : 38, flexDirection: "row" }, values.slice(0, 4).map(
    (value15, index) => box({
      width: widths[index],
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: header ? t.pink : t.line,
      backgroundColor: !header && index === 1 ? "rgba(237,61,140,0.08)" : "transparent",
      padding: "8px 12px",
      alignItems: "center"
    }, [
      header ? mono3(value15, spec, { color: index === 1 ? t.pink : t.pink, fontSize: 9, letterSpacing: 1.1 }) : index === 0 ? serif6(value15, spec, { color: t.paper, fontSize: 15, lineHeight: 1.1 }) : sans(value15, spec, { color: t.paper, fontSize: 10.5, lineHeight: 1.25 })
    ])
  ));
}
function renderQuote21(spec) {
  const t = theme6();
  const c = content14(spec, "quote");
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, bottom: 70, flexDirection: "row", alignItems: "center", gap: 40 }, [
      box({ width: 160, flexDirection: "column", gap: 14 }, [
        serif6(c.qmark, spec, { color: t.pink, fontSize: 150, lineHeight: 0.65 }),
        mono3(c.label, spec, { color: t.mute, fontSize: 9, letterSpacing: 1.1 })
      ]),
      box({ flex: 1, flexDirection: "column" }, [
        serif6(c.quote, spec, { color: t.paper, fontSize: 41, lineHeight: 1.05, letterSpacing: -0.1 }),
        box({ marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.pink, flexDirection: "row", alignItems: "baseline", gap: 12 }, [
          serif6(c.who, spec, { color: t.paper, fontSize: 23, lineHeight: 1.05 }),
          mono3(c.role, spec, { color: t.pink, fontSize: 8.5, letterSpacing: 1.2 })
        ])
      ])
    ]),
    footer2(spec, c)
  ]);
}
function renderCta2(spec) {
  const t = theme6();
  const c = content14(spec, "cta");
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 3) : DEFAULTS26.cta.steps;
  return surface2([
    runner(spec, c),
    box({ position: "absolute", left: 30, right: 30, top: 70, bottom: 70, flexDirection: "column", justifyContent: "space-between" }, [
      box({ flexDirection: "column", gap: 6 }, [
        mono3(c.pre, spec, { color: t.pink, fontSize: 12, letterSpacing: 2.4 }),
        serif6(c.title, spec, { color: t.paper, fontSize: 66, lineHeight: 1.03 })
      ]),
      box({ height: 152, flexDirection: "row", gap: 24, alignItems: "flex-end" }, [
        ...steps.map(
          (item) => box({ flex: 1, flexDirection: "column", gap: 7, borderTopWidth: 1, borderTopColor: t.pink, paddingTop: 11 }, [
            serif6(item.num, spec, { color: t.pink, fontSize: 31, lineHeight: 1 }),
            serif6(item.title, spec, { color: t.paper, fontSize: 21, lineHeight: 1.05 }),
            sans(item.body, spec, { color: t.mute, fontSize: 10, lineHeight: 1.35 })
          ])
        ),
        box({ width: 138, flexDirection: "column", alignItems: "flex-end", gap: 7 }, [
          qrBox(),
          mono3(c.qr_label, spec, { color: t.paper, fontSize: 9, textAlign: "right" }),
          mono3(c.url, spec, { color: t.pink, fontSize: 9, letterSpacing: 0.4, textAlign: "right" })
        ])
      ])
    ]),
    footer2(spec, c)
  ]);
}
function qrBox() {
  const t = theme6();
  const cells = [];
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const filled = x < 3 && y < 3 || x > 5 && y < 3 || x < 3 && y > 5 || (x + y) % 3 === 0 || x === 5 && y > 3;
      if (filled) {
        cells.push(box({ position: "absolute", left: x * 9, top: y * 9, width: 9, height: 9, backgroundColor: t.ink }));
      }
    }
  }
  return box({ position: "relative", width: 90, height: 90, backgroundColor: t.paper, padding: 6 }, cells);
}
function renderPinkNocturneFeature(spec) {
  const variant = normalizeVariant27(spec);
  const renderers = {
    cover: renderCover22,
    toc: renderToc3,
    stats: renderStats13,
    section: renderSection3,
    chart: renderChart11,
    process: renderProcess6,
    matrix: renderMatrix3,
    quote: renderQuote21,
    cta: renderCta2
  };
  return (renderers[variant] || renderCover22)(spec);
}

// templates/beautiful/playful-indie-launch.mjs
var templateId29 = "playful-indie-launch";
var CANVAS19 = { width: 960, height: 540 };
var PAGE_VARIANTS28 = ["cover", "toc", "statement", "chart", "team", "services", "timeline", "stats", "gallery", "closing"];
var rendererContract29 = {
  template_id: templateId29,
  renderer_id: `artboard_satori.${templateId29}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "playful",
  implemented_page_variants: PAGE_VARIANTS28,
  page_family: {
    family_id: "playful",
    supported_page_variants: PAGE_VARIANTS28,
    variant_usage_policy: {
      singletons: ["cover", "toc", "statement", "team", "gallery", "closing"],
      repeatable: ["chart", "services", "timeline", "stats"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/playful-1.png"
};
var DEFAULTS27 = {
  cover: {
    date: "02.05.26",
    title: "Creative Direction\n& Visual Systems",
    subtitle: "A warm deck for bold ideas, raw expression, and unfiltered storytelling.",
    vertical: "SCROLL DOWN ->",
    footer: "Indie studio field deck",
    pageno: "01 / 10"
  },
  toc: {
    label: "Overview",
    title: "What We Will\nCover Today",
    items: [
      { num: "01", label: "Vision & Mission Statement" },
      { num: "02", label: "Market Analysis & Data Insights" },
      { num: "03", label: "Team Structure & Leadership" },
      { num: "04", label: "Core Services & Offerings" },
      { num: "05", label: "Process & Workflow Timeline" },
      { num: "06", label: "Results, Metrics & Impact" }
    ],
    pageno: "02 / 10"
  },
  statement: {
    title: "Raw expression over polished perfection.",
    columns: [
      "Our approach combines strategic thinking with intuitive design. We build visual systems that adapt, evolve, and resonate with audiences across cultures and contexts.",
      "Founded in 2019, we have partnered with independent artists, cultural institutions, and forward-thinking brands to create work that challenges conventions."
    ],
    pageno: "03 / 10"
  },
  chart: {
    title: "Growth Metrics\nOver Four Quarters",
    legends: ["Revenue", "Engagement"],
    values: [
      { label: "Q1", a: 45, b: 30 },
      { label: "Q2", a: 60, b: 50 },
      { label: "Q3", a: 75, b: 65 },
      { label: "Q4", a: 90, b: 85 },
      { label: "Q5", a: 100, b: 95 }
    ],
    pageno: "04 / 10"
  },
  team: {
    title: "The Collective",
    subtitle: "Four perspectives, one shared obsession with craft.",
    people: [
      { name: "Alex Chen", role: "Creative Director" },
      { name: "Mira Okafor", role: "Strategy Lead" },
      { name: "Jonas Weber", role: "Visual Designer" },
      { name: "Suki Tanaka", role: "Motion Artist" }
    ],
    pageno: "05 / 10"
  },
  services: {
    title: "What We\nDo Best",
    blocks: [
      { num: "01", title: "Brand Identity", desc: "Visual systems that capture essence and scale across every touchpoint." },
      { num: "02", title: "Art Direction", desc: "Creative vision for campaigns, editorial, and cultural projects.", filled: true },
      { num: "03", title: "Motion Design", desc: "Animation and kinetic identity that brings static brands to life." },
      { num: "04", title: "Digital Experiences", desc: "Websites and interactive platforms with personality and purpose." },
      { num: "05", title: "Typography", desc: "Custom letterforms and type systems for distinctive voices.", filled: true }
    ],
    pageno: "06 / 10"
  },
  timeline: {
    title: "Our Process\nin Five Steps",
    steps: [
      { num: "1", title: "Discover", desc: "Research, interviews, and competitive landscape analysis" },
      { num: "2", title: "Define", desc: "Strategic positioning and core narrative development" },
      { num: "3", title: "Design", desc: "Visual exploration, prototyping, and iteration cycles" },
      { num: "4", title: "Develop", desc: "Production, asset creation, and implementation support" },
      { num: "5", title: "Deploy", desc: "Launch support and ongoing performance measurement" }
    ],
    pageno: "07 / 10"
  },
  stats: {
    title: "Impact by\nthe Numbers",
    stats: [
      { value: "47", label: "Projects delivered across three continents in the last year" },
      { value: "12", label: "Industry awards and recognitions for creative excellence" },
      { value: "98%", label: "Client retention rate with ongoing partnerships" }
    ],
    pageno: "08 / 10"
  },
  gallery: {
    title: "Selected Works",
    subtitle: "A glimpse into recent collaborations and independent projects.",
    items: [
      { label: "IMG 01", tag: "Editorial" },
      { label: "IMG 02", tag: "Identity" },
      { label: "IMG 03", tag: "Motion" },
      { label: "IMG 04", tag: "Campaign" }
    ],
    pageno: "09 / 10"
  },
  closing: {
    title: "Thank You\nLet Us Talk",
    subtitle: "Questions, projects, or just a conversation about ideas.",
    contacts: ["hello@example.studio", "+1 (555) 000 1234", "www.example.studio"],
    pageno: "10 / 10"
  }
};
function theme7() {
  return {
    bg: "#F0C8A0",
    bgAlt: "#E8B88E",
    light: "#F7DEC6",
    ink: "#1A1A1A",
    inkSoft: "rgba(26,26,26,0.72)",
    inkFaint: "rgba(26,26,26,0.16)"
  };
}
function content15(spec, variant) {
  return { ...DEFAULTS27[variant] || DEFAULTS27.cover, ...spec.content || {} };
}
function normalizeVariant28(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0);
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS28.length) return PAGE_VARIANTS28[sourceIndex - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS28) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda") || raw.includes("toc") || raw.includes("index")) return "toc";
  if (raw.includes("statement") || raw.includes("vision") || raw.includes("quote")) return "statement";
  if (raw.includes("chart") || raw.includes("data")) return "chart";
  if (raw.includes("team") || raw.includes("people")) return "team";
  if (raw.includes("service") || raw.includes("offer")) return "services";
  if (raw.includes("timeline") || raw.includes("process") || raw.includes("roadmap")) return "timeline";
  if (raw.includes("stat") || raw.includes("metric")) return "stats";
  if (raw.includes("gallery") || raw.includes("work")) return "gallery";
  if (raw.includes("closing") || raw.includes("close") || raw.includes("cta")) return "closing";
  return "cover";
}
function role26(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function display12(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: theme7().ink,
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 0.94,
    letterSpacing: -1.1,
    whiteSpace: "pre-line",
    ...role26("display", spec, { fontWeight: 800, lineHeight: 0.94, letterSpacing: -1.1 }),
    ...style
  });
}
function metric15(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: theme7().ink,
    fontSize: 66,
    fontWeight: 800,
    lineHeight: 0.92,
    letterSpacing: -1.5,
    whiteSpace: "pre-line",
    ...role26("metric", spec, { fontWeight: 800, lineHeight: 0.92, letterSpacing: -1.5 }),
    ...style
  });
}
function body22(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: theme7().ink,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.58,
    ...role26("body", spec, { fontWeight: 400, lineHeight: 1.58 }),
    ...style
  });
}
function label23(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: theme7().inkSoft,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...role26("label", spec, { fontWeight: 600, lineHeight: 1.15, letterSpacing: 1.8, textTransform: "uppercase" }),
    ...style
  });
}
function surface3(children = []) {
  const t = theme7();
  return box(
    {
      width: CANVAS19.width,
      height: CANVAS19.height,
      position: "relative",
      overflow: "hidden",
      backgroundColor: t.bg,
      color: t.ink
    },
    [
      box({ position: "absolute", right: -80, bottom: -90, width: 300, height: 260, borderRadius: "44% 56% 63% 37% / 46% 43% 57% 54%", backgroundColor: t.ink, opacity: 0.05 }),
      ...textureDots4(t),
      ...children
    ]
  );
}
function textureDots4(t) {
  return Array.from(
    { length: 10 },
    (_, index) => box({
      position: "absolute",
      left: 70 + index % 5 * 18,
      top: 74 + Math.floor(index / 5) * 18,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.ink,
      opacity: 0.18
    })
  );
}
function footer3(spec, c) {
  return box({ position: "absolute", left: 50, right: 50, bottom: 26, height: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
    label23(c.footer || "Playful source family render", spec, { fontSize: 8, letterSpacing: 1.2, opacity: 0.7 }),
    label23(c.pageno || "", spec, { fontSize: 8, letterSpacing: 1.2, opacity: 0.7, textAlign: "right" })
  ]);
}
function roughBox(children = [], style = {}, offset = { x: 7, y: 7 }) {
  const t = theme7();
  return box(
    {
      position: "relative",
      borderWidth: 3,
      borderColor: t.ink,
      backgroundColor: t.bg,
      overflow: "visible",
      ...style
    },
    [
      box({
        position: "absolute",
        left: offset.x,
        top: offset.y,
        right: -offset.x,
        bottom: -offset.y,
        borderWidth: 2,
        borderColor: t.ink,
        opacity: 0.96
      }),
      box({ position: "relative", width: "100%", height: "100%", flexDirection: "column" }, children)
    ]
  );
}
function inkBlock(children = [], style = {}) {
  const t = theme7();
  return box({ flexDirection: "column", backgroundColor: t.ink, color: t.bg, borderWidth: 3, borderColor: t.ink, ...style }, children);
}
function doodleLine(style = {}) {
  const t = theme7();
  return box({ position: "absolute", width: 100, height: 2, backgroundColor: t.ink, borderRadius: 2, ...style });
}
function doodleCircle(style = {}) {
  const t = theme7();
  return box({ position: "absolute", width: 72, height: 72, borderWidth: 3, borderColor: t.ink, borderRadius: 999, ...style });
}
function blobFrame(style = {}, filled = true) {
  const t = theme7();
  return box(
    {
      position: "absolute",
      borderWidth: 3,
      borderColor: t.ink,
      borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
      alignItems: "center",
      justifyContent: "center",
      ...style
    },
    filled ? [
      box({ width: "64%", height: "66%", backgroundColor: t.ink, borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" })
    ] : []
  );
}
function renderCover23(spec) {
  const c = content15(spec, "cover");
  return surface3([
    metric15(c.date, spec, { position: "absolute", left: 88, top: 166, width: 390, fontSize: 76 }),
    display12(c.title, spec, { position: "absolute", left: 92, top: 250, width: 500, fontSize: 42, lineHeight: 1.02 }),
    body22(c.subtitle, spec, { position: "absolute", left: 96, top: 360, width: 370, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }),
    blobFrame({ right: 92, top: 80, width: 210, height: 245 }),
    blobFrame({ right: 258, bottom: 82, width: 112, height: 132, borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }, false),
    label23(c.vertical, spec, { position: "absolute", right: 22, top: 248, width: 180, transform: "rotate(90deg)", color: theme7().ink, fontSize: 13, letterSpacing: 2 }),
    doodleLine({ left: 54, bottom: 86, width: 98, transform: "rotate(-12deg)" }),
    doodleLine({ left: 72, bottom: 104, width: 70, transform: "rotate(8deg)" }),
    footer3(spec, c)
  ]);
}
function renderToc4(spec) {
  const c = content15(spec, "toc");
  const items = Array.isArray(c.items) ? c.items.slice(0, 6) : DEFAULTS27.toc.items;
  return surface3([
    label23(c.label, spec, { position: "absolute", left: 64, top: 52 }),
    display12(c.title, spec, { position: "absolute", left: 64, top: 86, width: 430, fontSize: 39, lineHeight: 1.04 }),
    box({ position: "absolute", left: 64, top: 210, width: 650, height: 246, flexDirection: "row", flexWrap: "wrap", gap: 18 }, items.map(
      (item, idx) => roughBox([
        metric15(item.num, spec, { fontSize: 32, lineHeight: 0.9, marginBottom: 8 }),
        body22(item.label, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.25, width: 230 })
      ], { width: 304, height: 66, padding: 16, transform: `rotate(${[-0.6, 0.7, 0.4, -0.5, 0.5, -0.4][idx]}deg)` })
    )),
    doodleCircle({ right: 88, top: 84, width: 150, height: 150, borderRadius: "44% 56% 62% 38% / 51% 39% 61% 49%" }),
    doodleLine({ right: 122, top: 155, width: 82, transform: "rotate(23deg)" }),
    doodleLine({ right: 117, top: 180, width: 102, transform: "rotate(-16deg)" }),
    footer3(spec, c)
  ]);
}
function renderStatement10(spec) {
  const c = content15(spec, "statement");
  const columns = Array.isArray(c.columns) ? c.columns.slice(0, 2) : DEFAULTS27.statement.columns;
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 78, top: 104, width: 670, fontSize: 42, lineHeight: 1.08 }),
    box({ position: "absolute", left: 82, top: 350, width: 530, height: 105, flexDirection: "row", gap: 34 }, columns.map(
      (text10) => body22(text10, spec, { width: 248, fontSize: 12, lineHeight: 1.55, opacity: 0.9 })
    )),
    blobFrame({ right: 82, top: 132, width: 150, height: 220, borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }),
    doodleCircle({ left: 38, bottom: 58, width: 72, height: 72 }),
    doodleCircle({ left: 54, bottom: 74, width: 42, height: 42 }),
    footer3(spec, c)
  ]);
}
function renderChart12(spec) {
  const c = content15(spec, "chart");
  const values = Array.isArray(c.values) ? c.values.slice(0, 5) : DEFAULTS27.chart.values;
  const chartLeft = 92;
  const chartTop = 222;
  const chartHeight = 205;
  return surface3([
    box({ position: "absolute", left: 64, right: 64, top: 54, height: 92, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, [
      display12(c.title, spec, { width: 440, fontSize: 38, lineHeight: 1.05 }),
      box({ width: 220, flexDirection: "row", gap: 22, justifyContent: "flex-end", marginTop: 8 }, (c.legends || DEFAULTS27.chart.legends).map(
        (legend, idx) => box({ flexDirection: "row", alignItems: "center", gap: 8 }, [
          box({ width: 12, height: 12, backgroundColor: idx === 0 ? theme7().ink : "transparent", borderWidth: idx === 1 ? 2 : 0, borderColor: theme7().ink }),
          body22(legend, spec, { fontSize: 10, lineHeight: 1, fontWeight: 500 })
        ])
      ))
    ]),
    box({ position: "absolute", left: chartLeft, top: chartTop, width: 660, height: chartHeight, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: theme7().ink, alignItems: "flex-end", flexDirection: "row", gap: 22, paddingLeft: 38, paddingBottom: 24 }, values.map(
      (item) => box({ width: 84, height: chartHeight - 24, alignItems: "center", justifyContent: "flex-end", flexDirection: "column", gap: 7 }, [
        box({ width: 36, height: Math.max(20, (item.a || 0) * 1.45), backgroundColor: theme7().ink }),
        box({ width: 36, height: Math.max(20, (item.b || 0) * 1.25), borderWidth: 3, borderColor: theme7().ink }),
        body22(item.label, spec, { fontSize: 10, fontWeight: 600, lineHeight: 1 })
      ])
    )),
    box({ position: "absolute", left: 60, top: chartTop - 4, height: chartHeight - 24, flexDirection: "column", justifyContent: "space-between" }, ["100", "75", "50", "25", "0"].map(
      (tick) => body22(tick, spec, { fontSize: 9, fontWeight: 500, lineHeight: 1 })
    )),
    doodleLine({ right: 110, top: 178, width: 80, transform: "rotate(28deg)" }),
    doodleLine({ right: 130, top: 178, width: 80, transform: "rotate(-28deg)" }),
    doodleLine({ right: 150, top: 150, width: 60, transform: "rotate(90deg)" }),
    footer3(spec, c)
  ]);
}
function renderTeam5(spec) {
  const c = content15(spec, "team");
  const people = Array.isArray(c.people) ? c.people.slice(0, 4) : DEFAULTS27.team.people;
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 64, top: 54, width: 500, fontSize: 43 }),
    body22(c.subtitle, spec, { position: "absolute", left: 67, top: 111, width: 430, fontSize: 13, opacity: 0.78 }),
    box({ position: "absolute", left: 64, right: 64, top: 188, height: 210, flexDirection: "row", gap: 24, alignItems: "center" }, people.map(
      (person, idx) => roughBox([
        box({ width: 60, height: 60, borderRadius: 30, backgroundColor: theme7().ink, marginBottom: 20 }),
        display12(person.name, spec, { fontSize: 20, lineHeight: 1.06, marginBottom: 8, width: 145 }),
        body22(person.role, spec, { fontSize: 11, lineHeight: 1.2, opacity: 0.74, width: 140 })
      ], { width: 176, height: 180, padding: 22, transform: `rotate(${[0, 1.2, -1, 0.6][idx]}deg)` })
    )),
    doodleLine({ right: 88, bottom: 96, width: 130, transform: "rotate(-11deg)" }),
    doodleLine({ right: 98, bottom: 116, width: 104, transform: "rotate(11deg)" }),
    footer3(spec, c)
  ]);
}
function renderServices2(spec) {
  const c = content15(spec, "services");
  const blocks = Array.isArray(c.blocks) ? c.blocks.slice(0, 5) : DEFAULTS27.services.blocks;
  const positions = [
    { left: 442, top: 150, width: 190, height: 128, rot: -0.6 },
    { left: 652, top: 150, width: 190, height: 128, rot: 0.8 },
    { left: 442, top: 296, width: 190, height: 128, rot: -0.3 },
    { left: 652, top: 296, width: 190, height: 128, rot: 0.5 },
    { left: 234, top: 296, width: 188, height: 128, rot: -0.8 }
  ];
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 74, top: 128, width: 335, fontSize: 48, lineHeight: 0.98 }),
    ...blocks.map((item, idx) => {
      const pos = positions[idx] || positions[0];
      const textColor = item.filled ? theme7().bg : theme7().ink;
      const Block = item.filled ? inkBlock : roughBox;
      return Block([
        metric15(item.num, spec, { color: textColor, fontSize: 26, lineHeight: 1, marginBottom: "auto" }),
        display12(item.title, spec, { color: textColor, fontSize: 19, lineHeight: 1.05, marginBottom: 6, width: pos.width - 38 }),
        body22(item.desc, spec, { color: textColor, fontSize: 10, lineHeight: 1.35, opacity: item.filled ? 0.85 : 0.78, width: pos.width - 38 })
      ], { position: "absolute", ...pos, padding: 18, transform: `rotate(${pos.rot}deg)` });
    }),
    footer3(spec, c)
  ]);
}
function renderTimeline10(spec) {
  const c = content15(spec, "timeline");
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 5) : DEFAULTS27.timeline.steps;
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 64, top: 66, width: 470, fontSize: 40, lineHeight: 1.03 }),
    box({ position: "absolute", left: 98, right: 92, top: 248, height: 3, backgroundColor: theme7().ink }),
    box({ position: "absolute", left: 68, right: 68, top: 200, height: 190, flexDirection: "row", justifyContent: "space-between", gap: 14 }, steps.map(
      (step, idx) => box({ width: 150, flexDirection: "column", alignItems: "center", textAlign: "center" }, [
        box({ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: theme7().ink, backgroundColor: idx % 2 === 0 ? theme7().ink : theme7().bg, alignItems: "center", justifyContent: "center", marginBottom: 20 }, [
          metric15(step.num, spec, { color: idx % 2 === 0 ? theme7().bg : theme7().ink, fontSize: 22, lineHeight: 1 })
        ]),
        display12(step.title, spec, { fontSize: 17, lineHeight: 1.05, marginBottom: 8, width: 132, textAlign: "center" }),
        body22(step.desc, spec, { fontSize: 9, lineHeight: 1.32, opacity: 0.74, width: 132, textAlign: "center" })
      ])
    )),
    doodleLine({ right: 98, bottom: 96, width: 90, transform: "rotate(0deg)" }),
    doodleLine({ right: 98, bottom: 96, width: 28, transform: "rotate(36deg)", transformOrigin: "right center" }),
    doodleLine({ right: 98, bottom: 96, width: 28, transform: "rotate(-36deg)", transformOrigin: "right center" }),
    footer3(spec, c)
  ]);
}
function renderStats14(spec) {
  const c = content15(spec, "stats");
  const stats2 = Array.isArray(c.stats) ? c.stats.slice(0, 3) : DEFAULTS27.stats.stats;
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 64, top: 66, width: 455, fontSize: 40, lineHeight: 1.02 }),
    box({ position: "absolute", left: 72, right: 76, top: 226, height: 184, flexDirection: "row", gap: 50, alignItems: "flex-start" }, stats2.map(
      (item, idx) => box({ width: 225, flexDirection: "column", transform: `rotate(${[-1, 0.5, -0.5][idx]}deg)` }, [
        metric15(item.value, spec, { fontSize: item.value.length > 2 ? 82 : 92, lineHeight: 0.92, marginBottom: 16 }),
        body22(item.label, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.45, opacity: 0.8, width: 190 })
      ])
    )),
    box({ position: "absolute", right: 52, bottom: 74, width: 220, height: 180, backgroundColor: theme7().ink, opacity: 0.08, borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" }),
    doodleCircle({ left: 78, bottom: 100, width: 76, height: 76, borderRadius: 0, transform: "rotate(4deg)" }),
    doodleCircle({ left: 95, bottom: 117, width: 42, height: 42, borderRadius: 0, transform: "rotate(4deg)" }),
    footer3(spec, c)
  ]);
}
function renderGallery(spec) {
  const c = content15(spec, "gallery");
  const items = Array.isArray(c.items) ? c.items.slice(0, 4) : DEFAULTS27.gallery.items;
  const positions = [
    { left: 66, top: 176, width: 370, height: 246, rot: -0.5 },
    { left: 462, top: 176, width: 180, height: 116, rot: 0.5 },
    { left: 664, top: 176, width: 180, height: 116, rot: -0.3 },
    { left: 462, top: 314, width: 382, height: 108, rot: 0.3 }
  ];
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 64, top: 54, width: 460, fontSize: 43 }),
    body22(c.subtitle, spec, { position: "absolute", left: 67, top: 112, width: 460, fontSize: 13, opacity: 0.76 }),
    ...items.map((item, idx) => {
      const pos = positions[idx];
      return box({ position: "absolute", ...pos, borderWidth: 3, borderColor: theme7().ink, backgroundColor: theme7().bgAlt, overflow: "hidden", transform: `rotate(${pos.rot}deg)`, alignItems: "center", justifyContent: "center" }, [
        display12(item.label, spec, { fontSize: 24, opacity: 0.48 }),
        TextBlock(item.tag, { position: "absolute", left: 16, bottom: 14, backgroundColor: theme7().ink, color: theme7().bg, padding: "5px 10px", fontSize: 10, fontWeight: 600, ...role26("label", spec, { fontWeight: 600 }) })
      ]);
    }),
    footer3(spec, c)
  ]);
}
function renderClosing11(spec) {
  const c = content15(spec, "closing");
  const contacts = Array.isArray(c.contacts) ? c.contacts.slice(0, 3) : DEFAULTS27.closing.contacts;
  return surface3([
    display12(c.title, spec, { position: "absolute", left: 240, top: 118, width: 480, textAlign: "center", fontSize: 67, lineHeight: 0.95 }),
    body22(c.subtitle, spec, { position: "absolute", left: 252, top: 272, width: 456, textAlign: "center", fontSize: 14, fontWeight: 500, opacity: 0.82 }),
    roughBox(contacts.map(
      (line2) => body22(line2, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.35, marginBottom: 8, textAlign: "center" })
    ), { position: "absolute", left: 338, top: 334, width: 284, minHeight: 102, padding: "22px 28px", alignItems: "center" }),
    doodleCircle({ left: 106, top: 108, width: 92, height: 92 }),
    doodleCircle({ right: 110, bottom: 132, width: 118, height: 84, borderRadius: 0, transform: "rotate(10deg)" }),
    doodleLine({ left: 142, bottom: 106, width: 92, transform: "rotate(-8deg)" }),
    footer3(spec, c)
  ]);
}
var RENDERERS20 = {
  cover: renderCover23,
  toc: renderToc4,
  statement: renderStatement10,
  chart: renderChart12,
  team: renderTeam5,
  services: renderServices2,
  timeline: renderTimeline10,
  stats: renderStats14,
  gallery: renderGallery,
  closing: renderClosing11
};
function renderPlayfulIndieLaunch(spec) {
  const variant = normalizeVariant28(spec);
  return (RENDERERS20[variant] || renderCover23)(spec);
}

// templates/beautiful/retro-ui-dashboard.mjs
var templateId30 = "retro-ui-dashboard";
var CANVAS20 = { width: 960, height: 540 };
var PAGE_VARIANTS29 = ["slide-1", "slide-2", "slide-3", "slide-4", "slide-5", "slide-6", "slide-7", "slide-8", "slide-9", "slide-10"];
var rendererContract30 = {
  template_id: templateId30,
  renderer_id: `artboard_satori.${templateId30}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "retro-windows",
  implemented_page_variants: PAGE_VARIANTS29,
  page_family: {
    family_id: "retro-windows",
    supported_page_variants: PAGE_VARIANTS29,
    variant_usage_policy: {
      singletons: ["slide-1", "slide-2", "slide-3", "slide-5", "slide-8", "slide-9", "slide-10"],
      repeatable: ["slide-4", "slide-6", "slide-7"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/retro-windows-1.png"
};
var DEFAULTS28 = {
  "slide-1": {
    icon: "P",
    window_title: "PRESENTATION.EXE",
    title: "QUARTERLY OVERVIEW",
    marquee: "Welcome to the presentation template - Use arrow keys or navigation dots to browse slides",
    body: "Please wait while content loads...",
    buttons: ["OK", "Cancel", "Help"],
    footer: "Version 1.0 - Build 2026.05.01 - All systems operational"
  },
  "slide-2": {
    icon: "A",
    window_title: "AGENDA.TXT",
    title: "Today's Discussion Topics",
    subtitle: "Select an item to navigate. Use keyboard shortcuts for faster access.",
    primary_title: "Primary Items",
    secondary_title: "Secondary Items",
    primary: ["Executive summary and framing", "Quarterly revenue comparison", "Product capabilities overview", "Market segment distribution"],
    secondary: ["Metrics dashboard review", "Organizational structure", "Project roadmap 2026", "Closing and next steps"],
    status: "READY",
    footer: ["Slides: 10", "Mode: Presentation", "Owner: Strategy"]
  },
  "slide-3": {
    icon: "R",
    window_title: "README.DOC",
    title: "Executive Summary",
    body: "This deck summarizes current performance, operating priorities, and the near-term roadmap using a nostalgic desktop application metaphor.",
    boxes: [
      { title: "Key Objectives", body: "Align stakeholders around progress, risk, and ownership before the next operating review." },
      { title: "Primary Outcomes", body: "Clear priorities, visible metric movement, and a shared view of what must ship next." }
    ],
    stats: [
      { label: "Prepared by", value: "Department Name" },
      { label: "Date", value: "May 01, 2026" },
      { label: "Classification", value: "Internal Use" },
      { label: "Review Status", value: "Approved", accent: "green" }
    ]
  },
  "slide-4": {
    icon: "D",
    window_title: "DATAVIEW.CSV",
    title: "Quarterly Revenue Comparison",
    buttons: ["Export", "Print"],
    bars: [
      { label: "Q1 2026", value: "$1.2M", growth: "+5%", height: 42 },
      { label: "Q2 2026", value: "$1.5M", growth: "+12%", height: 52 },
      { label: "Q3 2026", value: "$1.9M", growth: "+18%", height: 66 },
      { label: "Q4 2026", value: "$2.1M", growth: "+22%", height: 74 }
    ],
    highlights: ["Q3 exceeded projections by 18%", "Enterprise segment grew 24% YoY", "Recurring revenue now at 62% of total"],
    footer: ["Data source: Internal reporting system", "Updated: May 2026", "Currency: USD (millions)"]
  },
  "slide-5": {
    icon: "F",
    window_title: "FEATURES.INI",
    title: "Product Capabilities Overview",
    subtitle: "A detailed breakdown of current platform features and their implementation status.",
    modules: [
      { title: "User Authentication Service", value: 100 },
      { title: "Data Processing Engine", value: 92 },
      { title: "Reporting Dashboard", value: 88 },
      { title: "Advanced Analytics Suite", value: 65, open: true }
    ],
    details: [
      "Auth Service: Supports SSO, MFA, and role-based access control.",
      "Data Engine: Handles 10M+ records daily with sub-second query response.",
      "Dashboard: Real-time visualization with custom layouts and reports.",
      "Analytics: Predictive modeling and trend forecasting in beta."
    ],
    metrics: [
      { label: "Active", value: "12" },
      { label: "In Dev", value: "3" },
      { label: "Planned", value: "2" }
    ]
  },
  "slide-6": {
    icon: "G",
    window_title: "GRAPHS.BMP",
    title: "Market Segment Distribution",
    segments: [
      { label: "Enterprise", value: "42%", color: "blue" },
      { label: "Mid-Market", value: "28%", color: "green" },
      { label: "Small Business", value: "18%", color: "cyan" },
      { label: "Government", value: "12%", color: "yellow" }
    ],
    insight: "Enterprise clients continue to drive the majority of revenue, while mid-market accounts show the fastest growth rate.",
    footer: "Total Addressable Market: $4.2B - Our Share: 8.3%"
  },
  "slide-7": {
    icon: "M",
    window_title: "METRICS.LOG",
    title: "Performance Metrics Dashboard",
    metrics: [
      { title: "Revenue", value: "$2.1M", delta: "+18.3%" },
      { title: "Customers", value: "1,482", delta: "+124" },
      { title: "Retention", value: "94.2%", delta: "+2.1%" },
      { title: "NPS Score", value: "72", delta: "+5" }
    ],
    kpis: ["Avg. Response Time 124ms", "System Uptime 99.97%", "Support Tickets 342 (-12%)", "Feature Adoption 68%", "API Calls / Day 4.2M"],
    status: "All systems operational"
  },
  "slide-8": {
    icon: "E",
    window_title: "EXPLORER.EXE",
    title: "Organizational Structure",
    tree: [
      "Executive Leadership",
      "  Office of the CEO",
      "  Chief of Staff",
      "Engineering",
      "  Platform Team",
      "  Product Engineering",
      "Commercial",
      "  Sales",
      "  Marketing",
      "Operations",
      "  Finance",
      "  People & Culture"
    ],
    rows: [
      ["Engineering", "84", "12"],
      ["Commercial", "56", "8"],
      ["Operations", "32", "4"],
      ["Leadership", "8", "0"]
    ],
    plan: "Planning to expand engineering by 25% and commercial teams by 18% over the next two quarters.",
    total: "180 employees"
  },
  "slide-9": {
    icon: "T",
    window_title: "TIMELINE.PRJ",
    title: "Project Roadmap 2026",
    quarters: [
      { title: "Q1 2026", status: "Completed", items: ["Research complete", "Baseline shipped"] },
      { title: "Q2 2026", status: "Completed", items: ["Core migration", "Partner rollout"] },
      { title: "Q3 2026", status: "In Progress", items: ["Advanced analytics", "Quality gates"], active: true },
      { title: "Q4 2026", status: "Planned", items: ["Global launch", "Operating review"] }
    ],
    milestone: "Current Milestone: Q3 2026",
    progress: 55,
    cards: [
      { label: "Risk Level", value: "MODERATE", color: "yellow" },
      { label: "Budget Status", value: "ON TRACK", color: "green" },
      { label: "Next Review", value: "JUL 15", color: "blue" }
    ]
  },
  "slide-10": {
    icon: "?",
    window_title: "SHUTDOWN.EXE",
    title: "THANK YOU FOR WATCHING",
    body: "Questions and feedback are always welcome.",
    marquee: "Contact us at hello@company.example - Visit www.company.example - Follow @companyhandle",
    contacts: [
      { label: "Email", value: "hello@example.com" },
      { label: "Phone", value: "+1 (555) 000-0000" },
      { label: "Website", value: "www.example.com" }
    ],
    buttons: ["Restart", "Contact", "End Session"],
    footer: "2026 Company Name - All rights reserved - Confidential & Proprietary"
  }
};
function colors20() {
  return {
    desk: "#808080",
    face: "#D4D0C8",
    gray: "#C0C0C0",
    dark: "#404040",
    black: "#000000",
    white: "#FFFFFF",
    blue: "#000080",
    blue2: "#0000A0",
    lightBlue: "#1084D0",
    green: "#008000",
    red: "#800000",
    yellow: "#808000",
    cyan: "#008080",
    text: "#222222"
  };
}
function content16(spec, variant) {
  return { ...DEFAULTS28[variant] || DEFAULTS28["slide-1"], ...spec.content || {} };
}
function normalizeVariant29(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS29.length) return PAGE_VARIANTS29[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""} ${spec.layout_family || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS29) {
    if (raw.includes(variant)) return variant;
  }
  if (raw.includes("agenda") || raw.includes("toc")) return "slide-2";
  if (raw.includes("summary") || raw.includes("content") || raw.includes("quote")) return "slide-3";
  if (raw.includes("bar") || raw.includes("revenue") || raw.includes("data")) return "slide-4";
  if (raw.includes("feature") || raw.includes("detail")) return "slide-5";
  if (raw.includes("segment") || raw.includes("pie")) return "slide-6";
  if (raw.includes("metric") || raw.includes("dashboard")) return "slide-7";
  if (raw.includes("compare") || raw.includes("org") || raw.includes("explorer")) return "slide-8";
  if (raw.includes("timeline") || raw.includes("process")) return "slide-9";
  if (raw.includes("closing") || raw.includes("shutdown")) return "slide-10";
  return "slide-1";
}
function role27(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function uiText(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: colors20().text,
    fontSize: 14,
    lineHeight: 1.35,
    ...role27("body", spec, { fontWeight: 400, lineHeight: 1.35 }),
    ...style
  });
}
function label24(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: colors20().text,
    fontSize: 12,
    lineHeight: 1.05,
    fontWeight: 700,
    ...role27("label", spec, { fontWeight: 700, lineHeight: 1.05, letterSpacing: 0.5 }),
    ...style
  });
}
function display13(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    color: colors20().blue,
    fontSize: 30,
    lineHeight: 1.4,
    fontWeight: 900,
    letterSpacing: 0,
    textAlign: "center",
    ...role27("display", spec, { fontWeight: 900, lineHeight: 1.4, textTransform: "uppercase" }),
    ...style
  });
}
function metric16(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: colors20().blue,
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 900,
    ...role27("metric", spec, { fontWeight: 900, lineHeight: 1.05 }),
    ...style
  });
}
function root(children) {
  const c = colors20();
  return box({ width: CANVAS20.width, height: CANVAS20.height, position: "relative", overflow: "hidden", backgroundColor: c.desk }, [
    ...children,
    box({ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)" })
  ]);
}
function raisedStyle(extra = {}) {
  const c = colors20();
  return {
    backgroundColor: c.face,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: c.white,
    borderLeftColor: c.white,
    borderRightColor: c.black,
    borderBottomColor: c.black,
    ...extra
  };
}
function sunkenStyle(extra = {}) {
  const c = colors20();
  return {
    backgroundColor: c.white,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: c.dark,
    borderLeftColor: c.dark,
    borderRightColor: c.white,
    borderBottomColor: c.white,
    ...extra
  };
}
function windowFrame(spec, cfg, children) {
  const c = colors20();
  const width = cfg.width || 760;
  const height = cfg.height || 486;
  const left = cfg.left ?? Math.round((CANVAS20.width - width) / 2);
  const top = cfg.top ?? Math.round((CANVAS20.height - height) / 2);
  return box(raisedStyle({ position: "absolute", left, top, width, height, flexDirection: "column" }), [
    titlebar(spec, cfg),
    box({ flex: 1, padding: cfg.padding || 24, flexDirection: "column", minHeight: 0 }, children)
  ]);
}
function titlebar(spec, cfg) {
  const c = colors20();
  return box({ width: "100%", height: 24, backgroundColor: cfg.inactive ? c.dark : c.blue, padding: "3px 5px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, [
    box({ flexDirection: "row", alignItems: "center" }, [
      box({ width: 16, height: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.black, alignItems: "center", justifyContent: "center", marginRight: 6 }, [
        label24(cfg.icon || "P", spec, { color: c.blue, fontSize: 9, lineHeight: 1 })
      ]),
      label24(cfg.title || "WINDOW.EXE", spec, { color: c.white, fontSize: 12, lineHeight: 1 })
    ]),
    box({ flexDirection: "row", gap: 3 }, ["_", "[]", "X"].map(
      (button2) => box(raisedStyle({ width: 17, height: 16, alignItems: "center", justifyContent: "center", padding: 0 }), [
        label24(button2, spec, { fontSize: 8, lineHeight: 1 })
      ])
    ))
  ]);
}
function button(text10, spec, width = 82) {
  return box(raisedStyle({ width, height: 26, alignItems: "center", justifyContent: "center", padding: 0 }), [
    uiText(text10, spec, { fontSize: 12, lineHeight: 1 })
  ]);
}
function panel2(children, raised = true, extra = {}) {
  const style = raised ? raisedStyle(extra) : sunkenStyle(extra);
  return box({ ...style, padding: extra.padding || 12, flexDirection: extra.flexDirection || "column" }, children);
}
function groupBox(title2, spec, children, extra = {}) {
  const c = colors20();
  return box(sunkenStyle({ position: "relative", padding: "20px 14px 12px 14px", flexDirection: "column", ...extra }), [
    box({ position: "absolute", left: 12, top: -8, backgroundColor: c.face, padding: "0 7px" }, [
      label24(title2, spec, { fontSize: 11, lineHeight: 1 })
    ]),
    ...children
  ]);
}
function rule6() {
  const c = colors20();
  return box({ height: 2, width: "100%", borderTopWidth: 1, borderTopColor: c.dark, borderBottomWidth: 1, borderBottomColor: c.white, margin: "8px 0 14px 0" });
}
function progress(value15, height = 22) {
  const c = colors20();
  return box(sunkenStyle({ width: "100%", height, padding: 2 }), [
    box({ width: `${Math.max(0, Math.min(100, Number(value15) || 0))}%`, height: "100%", backgroundColor: c.blue })
  ]);
}
function bulletList6(items, spec, size = 14) {
  return box({ flexDirection: "column", gap: 8 }, (items || []).map(
    (item) => box({ flexDirection: "row", alignItems: "flex-start" }, [
      label24(">", spec, { color: colors20().blue, fontSize: size, marginRight: 7 }),
      uiText(item, spec, { fontSize: size, lineHeight: 1.25, flex: 1 })
    ])
  ));
}
function renderCover24(spec) {
  const c = content16(spec, "slide-1");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 720, height: 504, top: 18, padding: "40px 44px 28px 44px" }, [
      box({ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
        metric16("HOURGLASS", spec, { fontSize: 14, color: colors20().black, marginBottom: 26 }),
        display13(c.title, spec, { fontSize: 28, marginBottom: 28 }),
        panel2([uiText(c.marquee, spec, { fontSize: 14, whiteSpace: "nowrap" })], false, { width: 540, height: 40, padding: 8, marginBottom: 20, overflow: "hidden" }),
        uiText(c.body, spec, { fontSize: 13, color: colors20().dark, marginBottom: 20 }),
        box({ flexDirection: "row", gap: 10, marginBottom: 28 }, (c.buttons || []).map((item) => button(item, spec, 80))),
        rule6(),
        uiText(c.footer, spec, { fontSize: 11, color: colors20().dark })
      ])
    ])
  ]);
}
function renderAgenda8(spec) {
  const c = content16(spec, "slide-2");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 818, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 22, marginBottom: 6 }),
      uiText(c.subtitle, spec, { color: colors20().dark, fontSize: 12 }),
      rule6(),
      box({ flex: 1, flexDirection: "row", gap: 24, minHeight: 0 }, [
        groupBox(c.primary_title, spec, [bulletList6(c.primary, spec)], { flex: 1 }),
        groupBox(c.secondary_title, spec, [bulletList6(c.secondary, spec)], { flex: 1 })
      ]),
      panel2([
        box({ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
          box({ flexDirection: "row", gap: 8 }, [uiText("Status:", spec, { fontSize: 12, color: colors20().dark }), label24(c.status, spec, { color: colors20().green, fontSize: 12 })]),
          box({ flexDirection: "row", gap: 20 }, ["x Notify participants", "[ ] Record session"].map((item) => uiText(item, spec, { fontSize: 12 })))
        ])
      ], true, { marginTop: 16, padding: 10 }),
      panel2([
        box({ flexDirection: "row", justifyContent: "space-between" }, (c.footer || []).map((item) => uiText(item, spec, { fontSize: 11, color: colors20().dark })))
      ], false, { marginTop: 12, padding: 8 })
    ])
  ]);
}
function renderSummary3(spec) {
  const c = content16(spec, "slide-3");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 818, height: 488, top: 26 }, [
      panel2([label24(c.title, spec, { color: colors20().blue, fontSize: 23 })], true, { backgroundColor: colors20().white, marginBottom: 16, padding: 16 }),
      uiText(c.body, spec, { fontSize: 16, lineHeight: 1.55, marginBottom: 18 }),
      box({ flex: 1, flexDirection: "row", gap: 18 }, (c.boxes || []).slice(0, 2).map(
        (item) => groupBox(item.title, spec, [uiText(item.body, spec, { fontSize: 16, lineHeight: 1.55 })], { flex: 1, justifyContent: "center" })
      )),
      box({ flexDirection: "row", gap: 12, marginTop: 16 }, (c.stats || []).slice(0, 4).map(
        (item) => panel2([
          uiText(item.label, spec, { fontSize: 11, color: colors20().dark, textAlign: "center", marginBottom: 4 }),
          label24(item.value, spec, { fontSize: 14, textAlign: "center", color: item.accent === "green" ? colors20().green : colors20().text })
        ], false, { flex: 1, alignItems: "center" })
      ))
    ])
  ]);
}
function renderData5(spec) {
  const c = content16(spec, "slide-4");
  const bars = c.bars || [];
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      box({ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
        label24(c.title, spec, { color: colors20().blue, fontSize: 22 }),
        box({ flexDirection: "row", gap: 8 }, (c.buttons || []).map((item) => button(item, spec, 66)))
      ]),
      rule6(),
      box({ flex: 1, flexDirection: "row", gap: 18, minHeight: 0 }, [
        panel2([
          box({ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 28, padding: "28px 32px 18px 32px" }, bars.map(
            (item) => box({ flex: 1, alignItems: "center", justifyContent: "flex-end", flexDirection: "column" }, [
              box({ width: 42, height: Number(item.height || 50) * 3, backgroundColor: colors20().blue }),
              uiText(item.label, spec, { fontSize: 11, marginTop: 8 })
            ])
          ))
        ], true, { flex: 1.05, minHeight: 0 }),
        box({ flex: 1, gap: 16, flexDirection: "column" }, [
          groupBox("Highlights", spec, [bulletList6(c.highlights, spec, 13)], { minHeight: 126 }),
          panel2([
            table(spec, ["Quarter", "Revenue", "Growth"], bars.map((item) => [item.label, item.value, item.growth]), { greenLast: true })
          ], false, { flex: 1, padding: 10 })
        ])
      ]),
      panel2([
        box({ flexDirection: "row", justifyContent: "space-between" }, (c.footer || []).map((item) => uiText(item, spec, { fontSize: 11, color: colors20().dark })))
      ], true, { marginTop: 14, padding: 9 })
    ])
  ]);
}
function renderFeatures3(spec) {
  const c = content16(spec, "slide-5");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 21 }),
      uiText(c.subtitle, spec, { fontSize: 12, color: colors20().dark }),
      rule6(),
      box({ flex: 1, flexDirection: "row", gap: 18, minHeight: 0 }, [
        box({ flex: 1, gap: 14, flexDirection: "column" }, [
          groupBox("Core Modules", spec, (c.modules || []).map(
            (item) => box({ marginBottom: 10 }, [
              uiText(`${item.open ? "[ ]" : "[x]"} ${item.title}`, spec, { fontSize: 12, marginBottom: 4 }),
              progress(item.value, 16)
            ])
          ), { flex: 1 }),
          panel2([
            uiText("Overall Completion", spec, { fontSize: 12, color: colors20().dark, marginBottom: 5 }),
            progress(86, 22),
            metric16("86%", spec, { fontSize: 20, textAlign: "right", marginTop: 4 })
          ], true)
        ]),
        box({ flex: 1, gap: 14, flexDirection: "column" }, [
          groupBox("Module Details", spec, (c.details || []).map((item) => panel2([uiText(item, spec, { fontSize: 11, lineHeight: 1.35 })], false, { marginBottom: 8, padding: 8 })), { flex: 1 }),
          box({ flexDirection: "row", gap: 10 }, (c.metrics || []).map(
            (item) => panel2([
              uiText(item.label, spec, { fontSize: 10, color: colors20().dark, textAlign: "center" }),
              metric16(item.value, spec, { fontSize: 21, textAlign: "center" })
            ], false, { flex: 1, alignItems: "center", padding: 8 })
          ))
        ])
      ])
    ])
  ]);
}
function renderSegments(spec) {
  const c = content16(spec, "slide-6");
  const colorMap = { blue: colors20().blue, green: colors20().green, cyan: colors20().cyan, yellow: colors20().yellow };
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 21 }),
      rule6(),
      box({ flex: 1, flexDirection: "row", gap: 18 }, [
        panel2([
          box({ width: 230, height: 230, borderRadius: 115, borderWidth: 46, borderColor: colors20().blue, alignItems: "center", justifyContent: "center" }, [
            metric16("42%", spec, { fontSize: 30 }),
            uiText("ENTERPRISE", spec, { fontSize: 10 })
          ])
        ], true, { flex: 1, alignItems: "center", justifyContent: "center" }),
        box({ flex: 1, gap: 14, flexDirection: "column" }, [
          groupBox("Segment Breakdown", spec, (c.segments || []).map(
            (item, idx) => box({ flexDirection: "row", justifyContent: "space-between", backgroundColor: idx % 2 === 0 ? "#ECE9DF" : colors20().face, padding: 8, marginBottom: 4 }, [
              uiText(`${String.fromCharCode(9632)} ${item.label}`, spec, { color: colorMap[item.color] || colors20().blue, fontSize: 14 }),
              label24(item.value, spec, { fontSize: 14 })
            ])
          )),
          panel2([
            label24("Key Insight", spec, { fontSize: 14, marginBottom: 8 }),
            uiText(c.insight, spec, { fontSize: 12, lineHeight: 1.45 })
          ], true, { flex: 1, justifyContent: "center" }),
          panel2([uiText(c.footer, spec, { fontSize: 12, color: colors20().dark })], false, { padding: 10 })
        ])
      ])
    ])
  ]);
}
function renderMetrics2(spec) {
  const c = content16(spec, "slide-7");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 21 }),
      rule6(),
      box({ flexDirection: "row", gap: 12, marginBottom: 16 }, (c.metrics || []).slice(0, 4).map(
        (item) => groupBox(item.title, spec, [
          metric16(item.value, spec, { fontSize: 28, textAlign: "center", marginBottom: 4 }),
          label24(`UP ${item.delta}`, spec, { color: colors20().green, fontSize: 11, textAlign: "center" })
        ], { flex: 1, alignItems: "center" })
      )),
      box({ flex: 1, flexDirection: "row", gap: 18, minHeight: 0 }, [
        panel2([
          label24("Monthly Active Users Trend", spec, { fontSize: 13, marginBottom: 16 }),
          lineChart(spec)
        ], true, { flex: 1 }),
        box({ flex: 1, gap: 14, flexDirection: "column" }, [
          groupBox("Operational KPIs", spec, (c.kpis || []).map(
            (item) => box({ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, [
              uiText(item.replace(/ [^ ]+$/, ""), spec, { fontSize: 12 }),
              label24(item.split(" ").slice(-1)[0], spec, { fontSize: 12 })
            ])
          ), { flex: 1 }),
          panel2([
            box({ flexDirection: "row", justifyContent: "space-between" }, [
              uiText(c.status, spec, { fontSize: 12, color: colors20().dark }),
              label24("LIVE", spec, { color: colors20().green, fontSize: 12 })
            ])
          ], false, { padding: 10 })
        ])
      ])
    ])
  ]);
}
function renderExplorer(spec) {
  const c = content16(spec, "slide-8");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 21 }),
      rule6(),
      box({ flex: 1, flexDirection: "row", gap: 18, minHeight: 0 }, [
        panel2([
          uiText("C:\\ORG\\STRUCTURE", spec, { fontSize: 12, color: colors20().dark, marginBottom: 12 }),
          box({ flexDirection: "column", gap: 5 }, (c.tree || []).slice(0, 12).map((item) => {
            const depth = item.startsWith("  ") ? 20 : 0;
            const clean = item.trim();
            const prefix = depth ? "+ [FILE]" : "- [DIR]";
            return uiText(`${prefix} ${clean}`, spec, { fontSize: 12, marginLeft: depth, fontWeight: depth ? 400 : 700 });
          }))
        ], false, { flex: 1.05, padding: 14 }),
        box({ flex: 1, gap: 16, flexDirection: "column" }, [
          groupBox("Department Headcount", spec, [table(spec, ["Department", "Headcount", "Open Roles"], c.rows || [])], { flex: 1 }),
          panel2([
            label24("Growth Plan", spec, { fontSize: 13, marginBottom: 10 }),
            uiText(c.plan, spec, { fontSize: 12, lineHeight: 1.45, marginBottom: 12 }),
            box({ flexDirection: "row", gap: 8 }, ["Engineering: +21", "Sales: +10", "Support: +6"].map((item) => panel2([uiText(item, spec, { fontSize: 10 })], false, { padding: 6 })))
          ], true, { flex: 1, justifyContent: "center" }),
          panel2([
            box({ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, [
              uiText("Total Organization", spec, { fontSize: 12, color: colors20().dark }),
              metric16(c.total, spec, { fontSize: 24 })
            ])
          ], false, { padding: 8 })
        ])
      ])
    ])
  ]);
}
function renderTimeline11(spec) {
  const c = content16(spec, "slide-9");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label24(c.title, spec, { color: colors20().blue, fontSize: 21 }),
      rule6(),
      box({ flexDirection: "row", gap: 10, marginBottom: 16 }, (c.quarters || []).slice(0, 4).map(
        (item) => box(raisedStyle({ flex: 1, flexDirection: "column" }), [
          box({ width: "100%", height: 22, backgroundColor: item.active ? colors20().blue : colors20().dark, alignItems: "center", justifyContent: "center" }, [
            label24(item.title, spec, { color: colors20().white, fontSize: 10 })
          ]),
          box({ padding: 10, flexDirection: "column" }, [
            uiText(`${item.status === "Completed" ? "[x]" : "[ ]"} ${item.status}`, spec, { fontSize: 11, fontWeight: 700, marginBottom: 8 }),
            bulletList6(item.items, spec, 10)
          ])
        ])
      )),
      panel2([
        label24(c.milestone, spec, { fontSize: 13, marginBottom: 10 }),
        box({ flexDirection: "row", alignItems: "center", gap: 14 }, [
          box({ flex: 1 }, [progress(c.progress, 22)]),
          metric16(`${c.progress}%`, spec, { fontSize: 22 }),
          uiText("6 of 11 milestones", spec, { fontSize: 10, color: colors20().dark })
        ])
      ], true, { marginBottom: 16 }),
      box({ flexDirection: "row", gap: 16 }, (c.cards || []).map(
        (item) => groupBox(item.label, spec, [
          label24(item.value, spec, { color: colors20()[item.color] || colors20().blue, fontSize: 16, textAlign: "center", marginTop: 8 })
        ], { flex: 1, alignItems: "center" })
      ))
    ])
  ]);
}
function renderClosing12(spec) {
  const c = content16(spec, "slide-10");
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 680, height: 504, top: 18, padding: "52px 40px 28px 40px" }, [
      box({ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column" }, [
        metric16("Z Z Z", spec, { fontSize: 22, marginBottom: 26 }),
        display13(c.title, spec, { fontSize: 22, marginBottom: 24 }),
        uiText(c.body, spec, { fontSize: 16, textAlign: "center", marginBottom: 22 }),
        panel2([uiText(c.marquee, spec, { fontSize: 13, whiteSpace: "nowrap" })], false, { width: 520, height: 40, padding: 8, marginBottom: 22, overflow: "hidden" }),
        box({ flexDirection: "row", gap: 16, marginBottom: 22 }, (c.contacts || []).map(
          (item) => box({ alignItems: "center", minWidth: 120 }, [
            uiText(item.label, spec, { fontSize: 11, color: colors20().dark, marginBottom: 4 }),
            label24(item.value, spec, { fontSize: 13 })
          ])
        )),
        box({ flexDirection: "row", gap: 10, marginBottom: 24 }, (c.buttons || []).map((item) => button(item, spec, 92))),
        rule6(),
        uiText(c.footer, spec, { fontSize: 11, color: colors20().dark })
      ])
    ])
  ]);
}
function table(spec, headers, rows, opts = {}) {
  const c = colors20();
  const safeRows = rows || [];
  return box({ flexDirection: "column", width: "100%", borderWidth: 1, borderColor: c.dark }, [
    box({ flexDirection: "row", backgroundColor: c.gray }, headers.map(
      (header) => box({ flex: 1, padding: 7, borderRightWidth: 1, borderRightColor: c.dark }, [label24(header, spec, { fontSize: 11 })])
    )),
    ...safeRows.map(
      (row, rowIndex) => box({ flexDirection: "row", backgroundColor: rowIndex % 2 ? c.white : "#F0F0F0" }, row.map(
        (cell, cellIndex) => box({ flex: 1, padding: 7, borderTopWidth: 1, borderTopColor: c.gray, borderRightWidth: 1, borderRightColor: c.gray }, [
          uiText(cell, spec, { fontSize: 11, color: opts.greenLast && cellIndex === row.length - 1 ? c.green : c.text, fontWeight: opts.greenLast && cellIndex === row.length - 1 ? 700 : 400 })
        ])
      ))
    )
  ]);
}
function lineChart(spec) {
  const c = colors20();
  const points = [42, 58, 50, 68, 74, 86];
  return box(sunkenStyle({ flex: 1, position: "relative", padding: 16, minHeight: 160 }), [
    ...[0, 1, 2, 3].map((row) => box({ position: "absolute", left: 16, right: 16, top: 28 + row * 34, height: 1, backgroundColor: c.gray })),
    box({ position: "absolute", left: 40, bottom: 24, width: 46, height: points[0], backgroundColor: c.blue }),
    box({ position: "absolute", left: 110, bottom: 24, width: 46, height: points[1], backgroundColor: c.lightBlue }),
    box({ position: "absolute", left: 180, bottom: 24, width: 46, height: points[2], backgroundColor: c.cyan }),
    box({ position: "absolute", left: 250, bottom: 24, width: 46, height: points[3], backgroundColor: c.green }),
    box({ position: "absolute", left: 320, bottom: 24, width: 46, height: points[4], backgroundColor: c.yellow }),
    box({ position: "absolute", left: 390, bottom: 24, width: 46, height: points[5], backgroundColor: c.blue })
  ]);
}
var RENDERERS21 = {
  "slide-1": renderCover24,
  "slide-2": renderAgenda8,
  "slide-3": renderSummary3,
  "slide-4": renderData5,
  "slide-5": renderFeatures3,
  "slide-6": renderSegments,
  "slide-7": renderMetrics2,
  "slide-8": renderExplorer,
  "slide-9": renderTimeline11,
  "slide-10": renderClosing12
};
function renderRetroUiDashboard(spec) {
  const variant = normalizeVariant29(spec);
  return (RENDERERS21[variant] || renderCover24)(spec);
}

// templates/beautiful/retro-zine-spread.mjs
var templateId31 = "retro-zine-spread";
var PAGE_VARIANTS30 = [
  "hero",
  "split",
  "statement",
  "grid",
  "visual",
  "editorial",
  "numbers",
  "collage",
  "rsvp",
  "closing"
];
var rendererContract31 = {
  template_id: templateId31,
  renderer_id: `artboard_satori.${templateId31}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "retro-zine",
  implemented_page_variants: PAGE_VARIANTS30,
  page_family: {
    family_id: "retro-zine",
    supported_page_variants: PAGE_VARIANTS30,
    variant_usage_policy: {
      singletons: ["hero", "statement", "rsvp", "closing"],
      repeatable: ["split", "grid", "visual", "editorial", "numbers", "collage"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/retro-zine-1.png"
};
var DEFAULTS29 = {
  hero: {
    eyebrow: "Q3 Strategic Overview",
    title: "NEXUS\nVENTURES",
    subtitle: "Growth - Innovation - Partnership",
    date: "2026"
  },
  split: {
    label: "Our Mission",
    title: "Building\nTomorrow",
    body: "We partner with ambitious teams to turn complex challenges into scalable solutions. Through disciplined strategy and creative execution, we help organizations outpace change and deliver lasting value.",
    stat: "340%",
    stat_label: "year-over-year growth"
  },
  statement: {
    quote: "The companies that thrive\nare not the ones that predict\nthe future. They are the ones\nthat build it.",
    author: "- Our founding principle since day one"
  },
  grid: {
    title: "At a Glance",
    items: [
      { label: "Founded", value: "2019 - San Francisco, CA" },
      { label: "Team", value: "120 people across 4 continents" },
      { label: "Clients", value: "48 active partnerships" },
      { label: "Revenue", value: "$12.4M ARR - profitable" }
    ]
  },
  visual: {
    title: "Q3\nTarget",
    subtitle: "$18M ARR by December",
    caption: "Fiscal year ending March 2027"
  },
  editorial: {
    title: "Product\nRoadmap",
    issue: "FY 2026 / 2027",
    left: "Phase one is about foundation - refining our core platform, improving onboarding velocity, and expanding our API surface to serve enterprise clients with stricter compliance needs. We shipped 14 major releases this quarter alone.",
    right: "Next quarter we shift from build mode to distribution. The product is proven. Now we need partners, channels, and the operational muscle to support 10x user growth without breaking the experience.",
    kicker: "PHASE TWO: SCALE"
  },
  numbers: {
    title: "Our Core Values",
    items: [
      { number: "01", title: "Clarity", body: "Complex problems deserve simple explanations." },
      { number: "02", title: "Velocity", body: "Ship fast, learn faster, iterate always." },
      { number: "03", title: "Trust", body: "Every partnership is built on radical transparency." }
    ]
  },
  collage: {
    title: "Capabilities",
    pieces: [
      { title: "Strategy", body: "Market analysis and roadmaps that bridge ambition with execution." },
      { title: "Design", body: "Brand systems and user experiences that make complexity effortless." },
      { title: "Engineering", body: "Scalable architecture, robust APIs, and infrastructure that grows." },
      { title: "Growth", body: "Go-to-market planning and revenue operations that accelerate traction." }
    ]
  },
  rsvp: {
    title: "Let's Talk",
    subtitle: "Ready to explore what we can build together?",
    fields: ["Name", "Company", "Email", "Project"],
    stamp: "CONTACT US"
  },
  closing: {
    label: "Thank You",
    title: "Let's Build\nTogether",
    contact: "hello@nexusventures.co - San Francisco - Worldwide",
    links: ["LinkedIn", "Contact", "Careers"]
  }
};
function colors21(spec) {
  const source = spec.theme?.colors || {};
  return {
    bg: source.background || "#C8B99A",
    bgDark: source.panel || "#B8A98A",
    green: source.accent || source.primary || "#008F4D",
    greenLight: source.secondary || "#00A85D",
    black: source.text || "#1A1A1A",
    white: source.surface || "#F4EFE6",
    line: source.text || "#1A1A1A"
  };
}
function variantContent3(spec, variant) {
  return { ...DEFAULTS29[variant], ...spec.content || {} };
}
function normalizeVariant30(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS30.length) return PAGE_VARIANTS30[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS30) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant;
  }
  if (raw.includes("closing") || raw.includes("cta")) return "closing";
  if (raw.includes("quote") || raw.includes("statement")) return "statement";
  if (raw.includes("data") || raw.includes("stat") || raw.includes("number")) return "numbers";
  if (raw.includes("compare") || raw.includes("split")) return "split";
  if (raw.includes("process") || raw.includes("timeline") || raw.includes("editor")) return "editorial";
  if (raw.includes("agenda")) return "rsvp";
  return "hero";
}
function role28(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function textValue2(value15, fallback2 = "") {
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function arrayValue3(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function label25(text10, spec, theme8, style = {}) {
  return TextBlock(String(text10 || "").toUpperCase(), {
    color: theme8.green,
    fontSize: 13,
    lineHeight: 1.1,
    letterSpacing: 3.4,
    textTransform: "uppercase",
    ...role28("label", spec, { fontWeight: 700, fontSize: 13, lineHeight: 1.1, letterSpacing: 3.4, textTransform: "uppercase" }),
    ...style
  });
}
function display14(text10, spec, theme8, style = {}) {
  return Title(text10, {
    color: theme8.green,
    fontSize: 92,
    lineHeight: 0.88,
    letterSpacing: 3,
    textTransform: "uppercase",
    whiteSpace: "pre-wrap",
    ...role28("display", spec, { fontWeight: 900, fontSize: 92, lineHeight: 0.88, letterSpacing: 3, textTransform: "uppercase" }),
    ...style
  });
}
function body23(text10, spec, theme8, style = {}) {
  return TextBlock(text10, {
    color: theme8.black,
    fontSize: 16,
    lineHeight: 1.52,
    ...role28("body", spec, { fontWeight: 450, fontSize: 16, lineHeight: 1.52 }),
    ...style
  });
}
function script(text10, spec, theme8, style = {}) {
  return TextBlock(text10, {
    color: theme8.black,
    fontSize: 24,
    lineHeight: 1.18,
    ...role28("body", spec, { fontWeight: 500, fontSize: 24, lineHeight: 1.18 }),
    ...style
  });
}
function metric17(text10, spec, theme8, style = {}) {
  return TextBlock(text10, {
    color: theme8.green,
    fontSize: 54,
    lineHeight: 0.95,
    letterSpacing: 1,
    textTransform: "uppercase",
    ...role28("metric", spec, { fontWeight: 900, fontSize: 54, lineHeight: 0.95, letterSpacing: 1, textTransform: "uppercase" }),
    ...style
  });
}
function page14(theme8, children, style = {}) {
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      backgroundColor: theme8.bg,
      overflow: "hidden",
      ...style
    },
    [
      box({ position: "absolute", left: 24, top: 26, width: 912, height: 488, opacity: 0.13 }, [
        ...Array.from(
          { length: 10 },
          (_, index) => box({
            position: "absolute",
            left: 0,
            top: index * 48,
            width: 912,
            height: 1,
            backgroundColor: index % 2 ? theme8.black : theme8.white,
            opacity: 0.16
          })
        )
      ]),
      ...children
    ]
  );
}
function paperRule(theme8, style = {}) {
  return box({ backgroundColor: theme8.black, height: 3, ...style });
}
function heroIllustration(theme8) {
  return box({ position: "relative", width: 220, height: 122, marginTop: 12, marginBottom: 12 }, [
    box({ position: "absolute", left: 30, top: 38, width: 112, height: 68, borderRadius: 999, backgroundColor: theme8.black }),
    box({ position: "absolute", left: 72, top: 56, width: 34, height: 34, borderRadius: 999, backgroundColor: theme8.bg, border: `3px solid ${theme8.black}` }),
    box({ position: "absolute", left: 86, top: 70, width: 8, height: 8, borderRadius: 999, backgroundColor: theme8.black }),
    box({ position: "absolute", left: 142, top: 24, width: 58, height: 88, border: `4px solid ${theme8.black}`, borderRadius: 16 }),
    box({ position: "absolute", left: 16, top: 12, width: 118, height: 4, backgroundColor: theme8.black, transform: "rotate(-9deg)" }),
    box({ position: "absolute", left: 20, top: 104, width: 190, height: 4, backgroundColor: theme8.black, transform: "rotate(8deg)" }),
    box({ position: "absolute", left: 40, top: 114, width: 170, height: 4, backgroundColor: theme8.black, transform: "rotate(-8deg)" })
  ]);
}
function renderHero2(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "hero");
  return page14(theme8, [
    box({ position: "absolute", left: 260, top: 58, width: 440, height: 424, alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }, [
      label25(content20.eyebrow, spec, theme8, { marginBottom: 8 }),
      display14(textValue2(content20.title, DEFAULTS29.hero.title).toUpperCase(), spec, theme8, { width: 430, textAlign: "center", fontSize: 117, lineHeight: 0.88, letterSpacing: 4.8 }),
      heroIllustration(theme8),
      label25(content20.subtitle, spec, theme8, { color: theme8.black, fontSize: 12, letterSpacing: 3, marginTop: 6 }),
      metric17(content20.date, spec, theme8, { fontSize: 54, lineHeight: 1, letterSpacing: 2, marginTop: 8 })
    ])
  ]);
}
function renderSplit9(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "split");
  return page14(theme8, [
    box({ position: "absolute", left: 0, top: 18, width: 480, height: 504, padding: 58, flexDirection: "column", justifyContent: "center", borderRight: `4px solid ${theme8.black}` }, [
      label25(content20.label, spec, theme8, { marginBottom: 18 }),
      display14(content20.title, spec, theme8, { color: theme8.black, width: 370, fontSize: 66, letterSpacing: 1.2, marginBottom: 22 }),
      body23(content20.body, spec, theme8, { width: 360, fontSize: 17, lineHeight: 1.58 })
    ]),
    box({ position: "absolute", left: 480, top: 18, width: 480, height: 504, padding: 58, backgroundColor: theme8.bgDark, alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }, [
      metric17(content20.stat, spec, theme8, { fontSize: 134, lineHeight: 0.92, letterSpacing: 1 }),
      script(content20.stat_label, spec, theme8, { fontSize: 34, textAlign: "center", marginTop: 8 })
    ])
  ]);
}
function renderStatement11(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "statement");
  return page14(
    theme8,
    [
      paperRule({ ...theme8, black: theme8.white }, { position: "absolute", left: 450, top: 74, width: 60, backgroundColor: theme8.white }),
      display14(`"${textValue2(content20.quote, DEFAULTS29.statement.quote)}"`, spec, theme8, {
        position: "absolute",
        left: 48,
        top: 100,
        width: 864,
        color: theme8.white,
        fontSize: 43,
        lineHeight: 1.04,
        letterSpacing: 1.8,
        textAlign: "center"
      }),
      paperRule({ ...theme8, black: theme8.white }, { position: "absolute", left: 450, top: 392, width: 60, backgroundColor: theme8.white }),
      script(content20.author, spec, theme8, { position: "absolute", left: 250, top: 428, width: 460, color: theme8.white, fontSize: 25, textAlign: "center" })
    ],
    { backgroundColor: theme8.green }
  );
}
function renderGrid2(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "grid");
  const items = arrayValue3(content20.items, DEFAULTS29.grid.items).slice(0, 4);
  const cells = [
    { left: 82, top: 166 },
    { left: 480, top: 166 },
    { left: 82, top: 309 },
    { left: 480, top: 309 }
  ];
  return page14(theme8, [
    display14(content20.title, spec, theme8, { position: "absolute", left: 82, top: 52, color: theme8.green, fontSize: 86, letterSpacing: 2 }),
    box({ position: "absolute", left: 82, top: 166, width: 796, height: 286, border: `4px solid ${theme8.black}` }),
    ...items.map((item, index) => {
      const cell = cells[index];
      return box({
        position: "absolute",
        left: cell.left,
        top: cell.top,
        width: 398,
        height: 143,
        borderRight: index % 2 === 0 ? `2px solid ${theme8.black}` : "none",
        borderBottom: index < 2 ? `2px solid ${theme8.black}` : "none",
        padding: 26,
        flexDirection: "column",
        justifyContent: "center"
      }, [
        label25(item.label, spec, theme8, { fontSize: 12, letterSpacing: 2.6, marginBottom: 8 }),
        script(item.value, spec, theme8, { fontSize: 30, lineHeight: 1.12, width: 314 })
      ]);
    })
  ]);
}
function renderVisual2(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "visual");
  return page14(theme8, [
    box({ position: "absolute", left: 0, top: 0, width: 960, height: 540, backgroundColor: theme8.bgDark }),
    ...[0, 1, 2, 3].map(
      (index) => box({
        position: "absolute",
        left: 480 - (78 + index * 48),
        top: 270 - (78 + index * 48),
        width: (78 + index * 48) * 2,
        height: (78 + index * 48) * 2,
        border: `3px solid ${index === 3 ? theme8.green : theme8.black}`,
        borderRadius: 999,
        opacity: index === 3 ? 0.22 : 0.12
      })
    ),
    box({ position: "absolute", left: 408, top: 42, width: 4, height: 456, backgroundColor: theme8.black, opacity: 0.12, transform: "rotate(45deg)" }),
    box({ position: "absolute", left: 548, top: 42, width: 4, height: 456, backgroundColor: theme8.black, opacity: 0.12, transform: "rotate(-45deg)" }),
    box({ position: "absolute", left: 310, top: 152, width: 340, height: 220, padding: "34px 48px", backgroundColor: theme8.green, border: `4px solid ${theme8.black}`, transform: "rotate(-2deg)", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }, [
      display14(content20.title, spec, theme8, { color: theme8.white, fontSize: 82, lineHeight: 0.88, textAlign: "center" }),
      script(content20.subtitle, spec, theme8, { color: theme8.white, fontSize: 28, marginTop: 10, textAlign: "center" })
    ]),
    label25(content20.caption, spec, theme8, { position: "absolute", left: 286, top: 470, width: 388, color: theme8.black, textAlign: "center", fontSize: 12, letterSpacing: 3 })
  ]);
}
function renderEditorial2(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "editorial");
  return page14(theme8, [
    box({ position: "absolute", left: 78, top: 50, width: 804, height: 96, borderBottom: `4px solid ${theme8.black}`, alignItems: "flex-end", justifyContent: "space-between", flexDirection: "row", paddingBottom: 14 }, [
      display14(content20.title, spec, theme8, { fontSize: 58, lineHeight: 0.94, width: 360 }),
      label25(content20.issue, spec, theme8, { color: theme8.black, fontSize: 13, letterSpacing: 3 })
    ]),
    box({ position: "absolute", left: 78, top: 184, width: 382, height: 278, paddingRight: 34, borderRight: `3px solid ${theme8.black}`, flexDirection: "column" }, [
      box({ flexDirection: "row", alignItems: "flex-start" }, [
        display14("P", spec, theme8, { fontSize: 70, lineHeight: 0.78, width: 54, color: theme8.green, letterSpacing: 0 }),
        body23(textValue2(content20.left, DEFAULTS29.editorial.left).replace(/^P/i, ""), spec, theme8, { width: 292, fontSize: 14.4, lineHeight: 1.55 })
      ])
    ]),
    box({ position: "absolute", left: 518, top: 184, width: 364, height: 278, flexDirection: "column" }, [
      label25(content20.kicker, spec, theme8, { fontSize: 15, letterSpacing: 2.2, marginBottom: 18 }),
      body23(content20.right, spec, theme8, { width: 360, fontSize: 14.6, lineHeight: 1.58 }),
      box({ marginTop: 18, backgroundColor: theme8.black, padding: "3px 8px", width: 180 }, [
        body23("Speed without sacrifice", spec, theme8, { color: theme8.bg, fontSize: 13, lineHeight: 1.2 })
      ])
    ])
  ]);
}
function renderNumbers2(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "numbers");
  const items = arrayValue3(content20.items, DEFAULTS29.numbers.items).slice(0, 3);
  return page14(theme8, [
    label25(content20.title, spec, theme8, { position: "absolute", left: 305, top: 78, width: 350, color: theme8.green, textAlign: "center", letterSpacing: 4 }),
    box({ position: "absolute", left: 90, top: 150, width: 780, height: 250, flexDirection: "row" }, [
      ...items.map(
        (item, index) => box({
          width: 260,
          height: 250,
          padding: "26px 20px",
          border: `3px solid ${theme8.black}`,
          borderRight: index < items.length - 1 ? "none" : `3px solid ${theme8.black}`,
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center"
        }, [
          metric17(item.number, spec, theme8, { fontSize: 78, lineHeight: 0.95, textAlign: "center", letterSpacing: 1 }),
          label25(item.title, spec, theme8, { color: theme8.black, fontSize: 15, letterSpacing: 2, marginTop: 12, textAlign: "center" }),
          script(item.body, spec, theme8, { width: 194, fontSize: 21, lineHeight: 1.22, marginTop: 12, textAlign: "center" })
        ])
      )
    ])
  ]);
}
function renderCollage(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "collage");
  const pieces = arrayValue3(content20.pieces, DEFAULTS29.collage.pieces).slice(0, 4);
  const configs = [
    { left: 78, top: 100, width: 310, height: 148, rotate: "-3deg", bg: theme8.green, title: theme8.white, body: theme8.white },
    { left: 570, top: 82, width: 276, height: 176, rotate: "4deg", bg: theme8.white, title: theme8.black, body: theme8.black },
    { left: 120, top: 306, width: 270, height: 150, rotate: "2deg", bg: theme8.bgDark, title: theme8.black, body: theme8.black },
    { left: 544, top: 318, width: 334, height: 138, rotate: "-5deg", bg: theme8.black, title: theme8.green, body: theme8.bg }
  ];
  const tapes = [
    { left: 272, top: 58, rotate: "-25deg" },
    { left: 656, top: 56, rotate: "35deg" },
    { left: 226, top: 406, rotate: "15deg" },
    { left: 720, top: 400, rotate: "-40deg" }
  ];
  return page14(theme8, [
    label25(content20.title, spec, theme8, { position: "absolute", left: 60, top: 40, letterSpacing: 4 }),
    ...tapes.map(
      (tape2) => box({
        position: "absolute",
        left: tape2.left,
        top: tape2.top,
        width: 80,
        height: 24,
        backgroundColor: "rgba(244,239,230,0.55)",
        border: `1px solid ${theme8.black}`,
        opacity: 0.75,
        transform: `rotate(${tape2.rotate})`,
        zIndex: 8
      })
    ),
    ...pieces.map((piece, index) => {
      const cfg = configs[index];
      return box({
        position: "absolute",
        left: cfg.left,
        top: cfg.top,
        width: cfg.width,
        height: cfg.height,
        padding: 24,
        border: `4px solid ${theme8.black}`,
        backgroundColor: cfg.bg,
        transform: `rotate(${cfg.rotate})`,
        flexDirection: "column",
        justifyContent: "center"
      }, [
        display14(piece.title, spec, theme8, { color: cfg.title, fontSize: 37, lineHeight: 0.96, letterSpacing: 1.2, marginBottom: 8 }),
        script(piece.body, spec, theme8, { color: cfg.body, fontSize: 22, lineHeight: 1.22, width: cfg.width - 56 })
      ]);
    })
  ]);
}
function renderRsvp(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "rsvp");
  const fields = arrayValue3(content20.fields, DEFAULTS29.rsvp.fields).slice(0, 5);
  return page14(theme8, [
    box({ position: "absolute", left: 192, top: 84, width: 600, height: 374, backgroundColor: theme8.green }),
    box({ position: "absolute", left: 180, top: 72, width: 600, minHeight: 374, padding: 42, border: `4px solid ${theme8.black}`, backgroundColor: theme8.white, flexDirection: "column" }, [
      display14(content20.title, spec, theme8, { fontSize: 72, lineHeight: 0.94, marginBottom: 8 }),
      script(content20.subtitle, spec, theme8, { width: 510, fontSize: 28, marginBottom: 26 }),
      box({ flexDirection: "column" }, [
        ...fields.map(
          (field) => box({ width: 510, height: 44, borderBottom: `3px solid ${theme8.black}`, flexDirection: "row", alignItems: "center" }, [
            label25(field, spec, theme8, { width: 112, fontSize: 14, letterSpacing: 2.2 }),
            script("________________________", spec, theme8, { width: 360, fontSize: 21, color: theme8.black })
          ])
        )
      ])
    ]),
    box({ position: "absolute", left: 672, top: 428, padding: "10px 22px", backgroundColor: theme8.black, border: `3px solid ${theme8.green}`, transform: "rotate(-8deg)" }, [
      label25(content20.stamp, spec, theme8, { color: theme8.green, fontSize: 18, letterSpacing: 2 })
    ])
  ]);
}
function renderClosing13(spec) {
  const theme8 = colors21(spec);
  const content20 = variantContent3(spec, "closing");
  const links = arrayValue3(content20.links, DEFAULTS29.closing.links).slice(0, 4);
  return page14(
    theme8,
    [
      box({ position: "absolute", left: 200, top: 78, width: 560, height: 384, alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }, [
        label25(content20.label, spec, theme8, { color: theme8.green, marginBottom: 22 }),
        display14(content20.title, spec, theme8, { width: 560, color: theme8.bg, fontSize: 104, lineHeight: 0.86, letterSpacing: 2, textAlign: "center" }),
        box({ width: 80, height: 5, backgroundColor: theme8.green, marginTop: 28, marginBottom: 20 }),
        script(content20.contact, spec, theme8, { width: 620, color: theme8.green, fontSize: 28, textAlign: "center" }),
        box({ marginTop: 30, flexDirection: "row", justifyContent: "center" }, [
          ...links.map(
            (link) => box({ marginLeft: 14, marginRight: 14, borderBottom: `3px solid ${theme8.green}`, paddingBottom: 5 }, [
              label25(link, spec, theme8, { color: theme8.bg, fontSize: 14, letterSpacing: 3 })
            ])
          )
        ])
      ])
    ],
    { backgroundColor: theme8.black }
  );
}
var RENDERERS22 = {
  hero: renderHero2,
  split: renderSplit9,
  statement: renderStatement11,
  grid: renderGrid2,
  visual: renderVisual2,
  editorial: renderEditorial2,
  numbers: renderNumbers2,
  collage: renderCollage,
  rsvp: renderRsvp,
  closing: renderClosing13
};
function renderRetroZineSpread(spec) {
  const variant = normalizeVariant30(spec);
  return (RENDERERS22[variant] || renderHero2)(spec);
}

// templates/beautiful/sticky-workshop-board.mjs
var templateId32 = "sticky-workshop-board";
var PAGE_VARIANTS31 = [
  "title",
  "statement",
  "two-column",
  "chart",
  "features",
  "timeline",
  "image-text",
  "diagram",
  "comparison",
  "closing"
];
var rendererContract32 = {
  template_id: templateId32,
  renderer_id: `artboard_satori.${templateId32}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "scatterbrain",
  implemented_page_variants: PAGE_VARIANTS31,
  page_family: {
    family_id: "scatterbrain",
    supported_page_variants: PAGE_VARIANTS31,
    variant_usage_policy: {
      singletons: ["title", "statement", "closing"],
      repeatable: ["two-column", "chart", "features", "timeline", "image-text", "diagram", "comparison"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/scatterbrain-1.png"
};
var P2 = {
  yellow: "#FFE066",
  yellowDeep: "#FFD43B",
  blue: "#A5D8FF",
  blueDeep: "#74C0FC",
  pink: "#FFC9C9",
  pinkDeep: "#FF9F9F",
  green: "#B2F2BB",
  greenDeep: "#8CE99A",
  orange: "#FFCC80",
  purple: "#D0BFFF",
  cream: "#FAF8F3",
  paper: "#F7F5F0",
  cork: "#D8BE91",
  corkDark: "#B99567",
  warm: "#FFF3D4",
  ink: "#2D2A26",
  inkLight: "#5C5750",
  white: "#FFFFFF",
  shadow: "rgba(45,42,38,0.18)"
};
var DEFAULTS30 = {
  title: {
    title: "Scatterbrain",
    subtitle: "Collect your thoughts, pin your ideas, and watch the big picture emerge from creative chaos.",
    note: "A Post-it Inspired Template",
    accents: ["Remember this!", "Notes & Ideas", "!"]
  },
  statement: {
    quote: "The best ideas start as scattered thoughts on sticky corners.",
    body: "Every great project begins with a single note, a fleeting thought, a moment of inspiration captured before it drifts away.",
    author: "- The Creative Process",
    side_note: "Jot it down before you forget!"
  },
  "two-column": {
    columns: [
      {
        label: "01 / Discovery",
        title: "Finding the Problem",
        body: "Every solution starts with understanding. Research and observation uncover what truly matters.",
        bullets: ["User research sessions", "Market analysis", "Stakeholder interviews", "Competitive landscape"]
      },
      {
        label: "02 / Solution",
        title: "Crafting the Answer",
        body: "With clarity comes creativity. Findings become strategies, prototypes, and tangible designs.",
        bullets: ["Ideation workshops", "Prototype development", "Iterative testing", "Final delivery"]
      }
    ]
  },
  chart: {
    title: "Quarterly Growth",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [24, 38, 52, 71],
    legend_title: "Key Metrics",
    legend: ["Revenue Streams", "User Acquisition", "Market Expansion", "Product Lines"],
    note: "Steady upward trend across all channels this fiscal year."
  },
  features: {
    items: [
      { icon: "A", title: "Strategy", body: "Map out your vision with clarity, milestones, and team alignment." },
      { icon: "B", title: "Design", body: "Craft experiences that resonate from early wireframes to polished interfaces." },
      { icon: "C", title: "Launch", body: "Ship with confidence, test quickly, and iterate toward lasting adoption." }
    ]
  },
  timeline: {
    items: [
      {
        title: "Phase One",
        phase: "Foundation",
        body: "Establish core principles, gather requirements, and build the architecture everything else stands on."
      },
      {
        title: "Phase Two",
        phase: "Creation",
        body: "Design prototypes, iterate through feedback cycles, and refine every detail until it feels intentional."
      },
      {
        title: "Phase Three",
        phase: "Delivery",
        body: "Launch, measure impact, gather insights, and prepare for the next cycle of innovation."
      }
    ]
  },
  "image-text": {
    label: "Spotlight",
    title: "Capturing the Moment",
    body: "Visual storytelling transforms abstract concepts into tangible understanding. A single image can communicate what paragraphs struggle to explain.",
    body2: "Imagery bridges gaps, evokes emotion, and creates lasting impressions that words alone cannot achieve.",
    mini_note: "Visuals first, text second."
  },
  diagram: {
    title: "Distribution Overview",
    center: "Total",
    labels: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
    stats: [
      ["Total Reach", "128K"],
      ["Engagement", "84%"],
      ["Retention", "62%"],
      ["Satisfaction", "4.8"]
    ],
    note: "Numbers tell the story we need to hear."
  },
  comparison: {
    left_title: "Before",
    right_title: "After",
    left: ["Scattered documentation", "Unclear ownership", "Inconsistent processes", "Reactive problem solving", "Silos between teams"],
    right: ["Centralized knowledge base", "Defined responsibilities", "Streamlined workflows", "Proactive planning", "Cross-functional alignment"]
  },
  closing: {
    title: "Thanks for Sticking Around",
    subtitle: "Every great idea starts with a little note.",
    accents: ["Keep the ideas flowing!", "Pin this somewhere safe.", "OK", ":)"],
    contact: "Questions, thoughts, or just want to say hello?"
  }
};
function normalizeVariant31(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS31.length) return PAGE_VARIANTS31[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS31) {
    if (raw.includes(variant)) return variant;
  }
  const slideMatch = raw.match(/slide-(\d+)/);
  if (slideMatch) {
    const slideIndex = Number(slideMatch[1]);
    if (slideIndex >= 1 && slideIndex <= PAGE_VARIANTS31.length) return PAGE_VARIANTS31[slideIndex - 1];
  }
  if (raw.includes("cover") || raw.includes("title")) return "title";
  if (raw.includes("quote") || raw.includes("statement")) return "statement";
  if (raw.includes("compare")) return "comparison";
  if (raw.includes("timeline") || raw.includes("process")) return "timeline";
  if (raw.includes("data") || raw.includes("chart")) return "chart";
  if (raw.includes("closing") || raw.includes("cta")) return "closing";
  return "title";
}
function content17(spec, variant) {
  return { ...DEFAULTS30[variant] || DEFAULTS30.title, ...spec.content || {} };
}
function textValue3(value15, fallback2 = "") {
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function arrayValue4(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function role29(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style);
}
function displayText3(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: P2.ink,
    fontSize: 54,
    lineHeight: 1.05,
    letterSpacing: 0.8,
    whiteSpace: "pre-wrap",
    ...role29("display", spec, { fontWeight: 900, fontSize: 54, lineHeight: 1.05, letterSpacing: 0.8 }),
    ...style
  });
}
function bodyText4(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: P2.ink,
    fontSize: 16,
    lineHeight: 1.45,
    ...role29("body", spec, { fontWeight: 430, fontSize: 16, lineHeight: 1.45 }),
    ...style
  });
}
function labelText3(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: P2.inkLight,
    fontSize: 10,
    lineHeight: 1.1,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...role29("label", spec, { fontWeight: 800, fontSize: 10, lineHeight: 1.1, letterSpacing: 1.8, textTransform: "uppercase" }),
    ...style
  });
}
function handText(value15, spec, style = {}) {
  return TextBlock(value15, {
    color: P2.inkLight,
    fontSize: 21,
    lineHeight: 1.25,
    ...role29("body", spec, { fontWeight: 560, fontSize: 21, lineHeight: 1.25 }),
    ...style
  });
}
function metricText3(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: P2.ink,
    fontSize: 34,
    lineHeight: 1,
    ...role29("metric", spec, { fontWeight: 900, fontSize: 34, lineHeight: 1 }),
    ...style
  });
}
function bgColor(color) {
  if (color === "yellow") return P2.yellow;
  if (color === "blue") return P2.blue;
  if (color === "pink") return P2.pink;
  if (color === "green") return P2.green;
  if (color === "orange") return P2.orange;
  if (color === "purple") return P2.purple;
  if (color === "white") return P2.white;
  return color || P2.yellow;
}
function pin2(color = "#C92A2A", style = {}) {
  return box(
    {
      position: "absolute",
      left: "50%",
      top: -9,
      width: 16,
      height: 16,
      marginLeft: -8,
      borderRadius: 8,
      backgroundColor: color,
      border: "2px solid rgba(255,255,255,0.45)",
      boxShadow: "0 2px 4px rgba(45,42,38,0.28)",
      ...style
    },
    []
  );
}
function tape(style = {}) {
  return box(
    {
      position: "absolute",
      left: "50%",
      top: -13,
      width: 78,
      height: 24,
      marginLeft: -39,
      backgroundColor: "rgba(255,255,255,0.45)",
      border: "1px solid rgba(255,255,255,0.35)",
      transform: "rotate(-2deg)",
      ...style
    },
    []
  );
}
function sticky({ left, top, right, bottom, width, height, color = "yellow", rotate = 0, pinColor = "#C92A2A", taped = false, bordered = false, z = 2, style = {} }, children = []) {
  const position = {};
  if (left !== void 0) position.left = left;
  if (right !== void 0) position.right = right;
  if (top !== void 0) position.top = top;
  if (bottom !== void 0) position.bottom = bottom;
  return box(
    {
      position: "absolute",
      width,
      height,
      ...position,
      padding: 22,
      flexDirection: "column",
      backgroundColor: bgColor(color),
      border: bordered ? `2px solid ${P2.ink}` : "0 solid transparent",
      boxShadow: `3px 5px 18px ${P2.shadow}`,
      transform: `rotate(${rotate}deg)`,
      zIndex: z,
      overflow: "hidden",
      ...style
    },
    [taped ? tape() : null, pinColor ? pin2(pinColor) : null, ...children].filter(Boolean)
  );
}
function doodle(kind, style = {}) {
  if (kind === "circle") {
    return box({ position: "absolute", border: `3px solid ${P2.ink}`, borderRadius: 50, opacity: 0.13, ...style }, []);
  }
  if (kind === "line") {
    return box({ position: "absolute", height: 3, backgroundColor: P2.ink, borderRadius: 3, opacity: 0.13, ...style }, []);
  }
  return box({ position: "absolute", borderLeft: `3px solid ${P2.ink}`, borderBottom: `3px solid ${P2.ink}`, opacity: 0.13, transform: "rotate(45deg)", ...style }, []);
}
function texture(kind) {
  const dots = [
    { left: 42, top: 38 },
    { left: 162, top: 88 },
    { left: 830, top: 70 },
    { left: 760, top: 412 },
    { left: 96, top: 438 }
  ];
  const base = dots.map(
    (dot2, index) => box(
      {
        position: "absolute",
        left: dot2.left,
        top: dot2.top,
        width: index % 2 ? 18 : 26,
        height: 3,
        backgroundColor: P2.ink,
        opacity: kind === "cork" ? 0.08 : 0.05,
        transform: `rotate(${index % 2 ? -18 : 22}deg)`
      },
      []
    )
  );
  if (kind === "paper") {
    return [
      box({ position: "absolute", inset: 0, backgroundColor: P2.paper }, []),
      ...Array.from({ length: 11 }, (_, i) => box({ position: "absolute", left: i * 88, top: 0, width: 1, height: 540, backgroundColor: P2.ink, opacity: 0.035 }, [])),
      ...Array.from({ length: 7 }, (_, i) => box({ position: "absolute", left: 0, top: i * 78, width: 960, height: 1, backgroundColor: P2.ink, opacity: 0.035 }, [])),
      ...base
    ];
  }
  if (kind === "warm") {
    return [
      box({ position: "absolute", inset: 0, backgroundColor: P2.warm }, []),
      box({ position: "absolute", left: 80, top: 30, width: 280, height: 160, borderRadius: 140, backgroundColor: P2.yellow, opacity: 0.26 }, []),
      box({ position: "absolute", right: 70, top: 80, width: 260, height: 190, borderRadius: 130, backgroundColor: P2.blue, opacity: 0.22 }, []),
      box({ position: "absolute", left: 380, bottom: 20, width: 310, height: 160, borderRadius: 155, backgroundColor: P2.pink, opacity: 0.2 }, []),
      ...base
    ];
  }
  return [
    box({ position: "absolute", inset: 0, backgroundColor: P2.cork }, []),
    box({ position: "absolute", inset: 0, backgroundColor: P2.corkDark, opacity: 0.25 }, []),
    ...Array.from({ length: 18 }, (_, i) => {
      const left = i * 71 % 910;
      const top = i * 43 % 500;
      return box({ position: "absolute", left, top, width: 18, height: 18, opacity: 0.07 }, [
        box({ position: "absolute", left: 8, top: 0, width: 2, height: 18, backgroundColor: P2.ink }, []),
        box({ position: "absolute", left: 0, top: 8, width: 18, height: 2, backgroundColor: P2.ink }, [])
      ]);
    }),
    ...base
  ];
}
function page15(kind, children) {
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      overflow: "hidden",
      backgroundColor: kind === "paper" ? P2.paper : kind === "warm" ? P2.warm : P2.cork
    },
    [...texture(kind), ...children]
  );
}
function bulletList7(items, spec, style = {}) {
  return box({ flexDirection: "column", gap: 6, ...style }, items.map((item) => bodyText4(`\u2022 ${item}`, spec, { fontSize: 13.5, lineHeight: 1.25 })));
}
function renderTitle3(spec) {
  const c = content17(spec, "title");
  const accents = arrayValue4(c.accents, DEFAULTS30.title.accents);
  return page15("cork", [
    doodle("circle", { left: 55, top: 60, width: 78, height: 78 }),
    doodle("line", { right: 74, bottom: 86, width: 128, transform: "rotate(-8deg)" }),
    sticky({ left: 210, top: 117, width: 540, height: 210, color: "yellow", rotate: -2, taped: false }, [
      displayText3(textValue3(c.title, "Scatterbrain"), spec, { fontSize: 74, lineHeight: 0.98, textAlign: "center" }),
      handText(textValue3(c.note, "A Post-it Inspired Template"), spec, { marginTop: 12, textAlign: "center", fontSize: 24 })
    ]),
    sticky({ left: 54, top: 118, width: 148, height: 74, color: "blue", rotate: -10, pinColor: "#1864AB", style: { padding: 16 } }, [
      handText(accents[0], spec, { fontSize: 20, textAlign: "center" })
    ]),
    sticky({ right: 44, top: 104, width: 142, height: 74, color: "pink", rotate: 9, style: { padding: 16 } }, [
      handText(accents[1], spec, { fontSize: 19, textAlign: "center" })
    ]),
    sticky({ right: 170, top: 280, width: 66, height: 62, color: "green", rotate: 13, pinColor: null, style: { padding: 10, alignItems: "center", justifyContent: "center" } }, [
      displayText3(accents[2], spec, { fontSize: 35, textAlign: "center" })
    ]),
    bodyText4(textValue3(c.subtitle, DEFAULTS30.title.subtitle), spec, {
      position: "absolute",
      left: 250,
      top: 374,
      width: 460,
      textAlign: "center",
      color: P2.inkLight,
      fontSize: 19,
      lineHeight: 1.4
    })
  ]);
}
function renderStatement12(spec) {
  const c = content17(spec, "statement");
  return page15("paper", [
    doodle("angle", { left: 74, top: 118, width: 66, height: 66 }),
    sticky({ left: 164, top: 108, width: 610, height: 302, color: "yellow", rotate: -1, taped: true }, [
      displayText3(`"${textValue3(c.quote, DEFAULTS30.statement.quote)}"`, spec, { fontSize: 42, lineHeight: 1.1 }),
      bodyText4(textValue3(c.body, DEFAULTS30.statement.body), spec, { marginTop: 20, fontSize: 16.5, lineHeight: 1.44 }),
      handText(textValue3(c.author, DEFAULTS30.statement.author), spec, { marginTop: 14, textAlign: "right", fontSize: 22 })
    ]),
    sticky({ right: 38, top: 238, width: 154, height: 98, color: "blue", rotate: 8, pinColor: "#1864AB", style: { justifyContent: "center" } }, [
      handText(textValue3(c.side_note, DEFAULTS30.statement.side_note), spec, { fontSize: 23, textAlign: "center" })
    ])
  ]);
}
function renderTwoColumn(spec) {
  const c = content17(spec, "two-column");
  const columns = arrayValue4(c.columns, DEFAULTS30["two-column"].columns);
  return page15("warm", [
    ...columns.slice(0, 2).map(
      (item, index) => sticky(
        {
          left: index === 0 ? 112 : 492,
          top: index === 0 ? 92 : 134,
          width: 338,
          height: 340,
          color: index === 0 ? "blue" : "yellow",
          rotate: index === 0 ? -2 : 1,
          pinColor: index === 0 ? "#1864AB" : "#F59F00"
        },
        [
          labelText3(item.label, spec),
          displayText3(item.title, spec, { marginTop: 13, fontSize: 30, lineHeight: 1.08 }),
          bodyText4(item.body, spec, { marginTop: 12, fontSize: 14.5, lineHeight: 1.35 }),
          bulletList7(arrayValue4(item.bullets, []), spec, { marginTop: 12 })
        ]
      )
    ),
    doodle("line", { right: 58, bottom: 72, width: 150, transform: "rotate(8deg)" })
  ]);
}
function renderChart13(spec) {
  const c = content17(spec, "chart");
  const values = arrayValue4(c.values, DEFAULTS30.chart.values);
  const labels = arrayValue4(c.labels, DEFAULTS30.chart.labels);
  const legend = arrayValue4(c.legend, DEFAULTS30.chart.legend);
  const max = Math.max(...values, 1);
  return page15("cork", [
    sticky({ left: 85, top: 78, width: 520, height: 376, color: "white", rotate: -1, taped: true, bordered: false, pinColor: "#C92A2A", style: { padding: 28 } }, [
      displayText3(textValue3(c.title, DEFAULTS30.chart.title), spec, { fontSize: 31, textAlign: "center", marginBottom: 22 }),
      box(
        { position: "relative", height: 250, width: 450, borderLeft: `2px solid ${P2.ink}`, borderBottom: `2px solid ${P2.ink}`, marginLeft: 20 },
        values.slice(0, 4).map((value15, index) => {
          const height = 58 + value15 / max * 142;
          const colors24 = [P2.yellow, P2.blue, P2.pink, P2.green];
          return box(
            {
              position: "absolute",
              left: 34 + index * 92,
              bottom: 28,
              width: 54,
              height,
              backgroundColor: colors24[index],
              border: `2px solid ${P2.ink}`,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: 10
            },
            [
              metricText3(String(value15), spec, { fontSize: 20, textAlign: "center" }),
              labelText3(labels[index], spec, { position: "absolute", bottom: -24, left: -8, width: 70, textAlign: "center", fontSize: 10, letterSpacing: 0.5 })
            ]
          );
        })
      )
    ]),
    sticky({ right: 95, top: 120, width: 250, height: 300, color: "green", rotate: 2, pinColor: "#2F9E44" }, [
      displayText3(textValue3(c.legend_title, DEFAULTS30.chart.legend_title), spec, { fontSize: 30, marginBottom: 15 }),
      ...legend.slice(0, 4).map(
        (item, index) => box({ flexDirection: "row", alignItems: "center", marginBottom: 12 }, [
          box({ width: 17, height: 17, marginRight: 10, border: `2px solid ${P2.ink}`, backgroundColor: [P2.yellow, P2.blue, P2.pink, P2.green][index] }, []),
          bodyText4(item, spec, { fontSize: 13.5, lineHeight: 1.2, width: 170 })
        ])
      ),
      handText(textValue3(c.note, DEFAULTS30.chart.note), spec, { marginTop: 8, paddingTop: 12, borderTop: `2px solid ${P2.ink}`, fontSize: 19 })
    ])
  ]);
}
function renderFeatures4(spec) {
  const c = content17(spec, "features");
  const items = arrayValue4(c.items, DEFAULTS30.features.items);
  return page15("paper", [
    ...items.slice(0, 3).map(
      (item, index) => sticky(
        {
          left: 96 + index * 288,
          top: index === 1 ? 112 : 132,
          width: 238,
          height: 300,
          color: ["yellow", "blue", "pink"][index],
          rotate: [-2, 1, 3][index],
          pinColor: index === 1 ? "#1864AB" : "#C92A2A"
        },
        [
          box({ width: 54, height: 54, border: `3px solid ${P2.ink}`, borderRadius: 27, alignItems: "center", justifyContent: "center", marginBottom: 18 }, [
            metricText3(item.icon, spec, { fontSize: 29, textAlign: "center" })
          ]),
          displayText3(item.title, spec, { fontSize: 31, lineHeight: 1.08, marginBottom: 15 }),
          bodyText4(item.body, spec, { fontSize: 14.5, lineHeight: 1.38 })
        ]
      )
    ),
    doodle("angle", { right: 92, top: 52, width: 58, height: 58 }),
    doodle("circle", { left: 78, bottom: 64, width: 70, height: 70, borderStyle: "dashed" })
  ]);
}
function renderTimeline12(spec) {
  const c = content17(spec, "timeline");
  const items = arrayValue4(c.items, DEFAULTS30.timeline.items);
  return page15("warm", [
    ...items.slice(0, 3).map((item, index) => {
      const top = 66 + index * 144;
      const reverse = index % 2 === 1;
      return box({ position: "absolute", left: 80, top, width: 800, height: 118 }, [
        sticky(
          {
            left: reverse ? 590 : 0,
            top: 0,
            width: 190,
            height: 108,
            color: ["yellow", "blue", "green"][index],
            rotate: reverse ? 2 : -2,
            pinColor: ["#C92A2A", "#1864AB", "#2F9E44"][index],
            style: { padding: 18, justifyContent: "center" }
          },
          [displayText3(item.title, spec, { fontSize: 26, textAlign: "center" }), handText(item.phase, spec, { fontSize: 18, textAlign: "center", marginTop: 5 })]
        ),
        box({
          position: "absolute",
          left: reverse ? 250 : 218,
          top: 52,
          width: 320,
          height: 0,
          borderTop: `3px dashed rgba(45,42,38,0.34)`,
          transform: `rotate(${reverse ? -3 : 3}deg)`
        }, []),
        sticky(
          {
            left: reverse ? 0 : 584,
            top: 6,
            width: 250,
            height: 100,
            color: "white",
            rotate: reverse ? -1 : 1,
            pinColor: null,
            bordered: true,
            style: { padding: 17, justifyContent: "center" }
          },
          [bodyText4(item.body, spec, { fontSize: 13.4, lineHeight: 1.32 })]
        )
      ]);
    })
  ]);
}
function renderImageText(spec) {
  const c = content17(spec, "image-text");
  return page15("cork", [
    sticky({ left: 92, top: 116, width: 366, height: 282, color: "white", rotate: -2, taped: true, style: { padding: 18 } }, [
      box({ width: 330, height: 226, backgroundColor: "#DEE2E6", position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center" }, [
        box({ position: "absolute", left: 36, top: 36, width: 160, height: 116, borderRadius: 90, backgroundColor: P2.yellow, opacity: 0.32 }, []),
        box({ position: "absolute", right: 24, bottom: 30, width: 170, height: 118, borderRadius: 95, backgroundColor: P2.blue, opacity: 0.32 }, []),
        displayText3("[ Visual Content ]", spec, { color: P2.inkLight, opacity: 0.5, fontSize: 22, textAlign: "center" })
      ])
    ]),
    sticky({ right: 105, top: 105, width: 352, height: 318, color: "pink", rotate: 1, pinColor: "#C92A2A" }, [
      labelText3(textValue3(c.label, DEFAULTS30["image-text"].label), spec),
      displayText3(textValue3(c.title, DEFAULTS30["image-text"].title), spec, { marginTop: 12, fontSize: 33 }),
      bodyText4(textValue3(c.body, DEFAULTS30["image-text"].body), spec, { marginTop: 14, fontSize: 14.5, lineHeight: 1.36 }),
      bodyText4(textValue3(c.body2, DEFAULTS30["image-text"].body2), spec, { marginTop: 10, fontSize: 14.5, lineHeight: 1.36 })
    ]),
    sticky({ right: 86, bottom: 70, width: 176, height: 74, color: "yellow", rotate: 6, pinColor: "#F59F00", style: { padding: 13, justifyContent: "center" } }, [
      handText(textValue3(c.mini_note, DEFAULTS30["image-text"].mini_note), spec, { fontSize: 18, textAlign: "center" })
    ]),
    doodle("angle", { right: 58, top: 74, width: 80, height: 80 })
  ]);
}
function renderDiagram6(spec) {
  const c = content17(spec, "diagram");
  const labels = arrayValue4(c.labels, DEFAULTS30.diagram.labels);
  const stats2 = arrayValue4(c.stats, DEFAULTS30.diagram.stats);
  return page15("paper", [
    sticky({ left: 106, top: 100, width: 398, height: 326, color: "white", rotate: -1, taped: true, pinColor: "#C92A2A", style: { padding: 28 } }, [
      displayText3(textValue3(c.title, DEFAULTS30.diagram.title), spec, { fontSize: 31, textAlign: "center", marginBottom: 18 }),
      box({ position: "relative", width: 318, height: 192, marginLeft: 12 }, [
        box({ position: "absolute", left: 26, top: 24, width: 138, height: 138, borderRadius: 69, backgroundColor: P2.yellow, border: `2px solid ${P2.ink}` }, []),
        box({ position: "absolute", left: 86, top: 24, width: 78, height: 78, borderTopRightRadius: 78, backgroundColor: P2.blue, borderRight: `2px solid ${P2.ink}`, borderTop: `2px solid ${P2.ink}` }, []),
        box({ position: "absolute", left: 86, top: 92, width: 78, height: 70, borderBottomRightRadius: 78, backgroundColor: P2.pink, borderRight: `2px solid ${P2.ink}`, borderBottom: `2px solid ${P2.ink}` }, []),
        box({ position: "absolute", left: 66, top: 64, width: 58, height: 58, borderRadius: 29, backgroundColor: P2.white, border: `2px solid ${P2.ink}`, alignItems: "center", justifyContent: "center" }, [
          labelText3(textValue3(c.center, DEFAULTS30.diagram.center), spec, { textAlign: "center", letterSpacing: 0.2 })
        ]),
        ...labels.slice(0, 5).map(
          (label28, index) => box({ position: "absolute", left: 202, top: 16 + index * 32, flexDirection: "row", alignItems: "center" }, [
            box({ width: 15, height: 15, marginRight: 10, border: `1px solid ${P2.ink}`, backgroundColor: [P2.yellow, P2.blue, P2.pink, P2.green, P2.orange][index] }, []),
            bodyText4(label28, spec, { color: P2.inkLight, fontSize: 12.5, lineHeight: 1 })
          ])
        )
      ])
    ]),
    sticky({ right: 112, top: 105, width: 320, height: 318, color: "yellow", rotate: 2, pinColor: "#C92A2A" }, [
      displayText3("Key Statistics", spec, { fontSize: 31, marginBottom: 10 }),
      ...stats2.slice(0, 4).map(
        (row) => box({ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px dashed rgba(45,42,38,0.22)" }, [
          bodyText4(row[0], spec, { color: P2.inkLight, fontSize: 14.5 }),
          metricText3(row[1], spec, { fontSize: 25 })
        ])
      ),
      handText(textValue3(c.note, DEFAULTS30.diagram.note), spec, { marginTop: 16, fontSize: 20 })
    ]),
    doodle("line", { left: 56, bottom: 62, width: 120 })
  ]);
}
function renderComparison2(spec) {
  const c = content17(spec, "comparison");
  return page15("warm", [
    sticky({ left: 116, top: 110, width: 326, height: 318, color: "blue", rotate: -2, pinColor: "#1864AB" }, [
      displayText3(textValue3(c.left_title, DEFAULTS30.comparison.left_title), spec, { fontSize: 34, textAlign: "center", paddingBottom: 13, borderBottom: `3px solid ${P2.ink}` }),
      bulletList7(arrayValue4(c.left, DEFAULTS30.comparison.left), spec, { marginTop: 16 })
    ]),
    box({ position: "absolute", left: 450, top: 243, width: 60, height: 60, borderRadius: 30, backgroundColor: P2.ink, alignItems: "center", justifyContent: "center", zIndex: 6, boxShadow: `0 3px 8px ${P2.shadow}` }, [
      labelText3("vs", spec, { color: P2.paper, textAlign: "center", fontSize: 16, letterSpacing: 0 })
    ]),
    sticky({ right: 116, top: 110, width: 326, height: 318, color: "yellow", rotate: 2, pinColor: "#F59F00" }, [
      displayText3(textValue3(c.right_title, DEFAULTS30.comparison.right_title), spec, { fontSize: 34, textAlign: "center", paddingBottom: 13, borderBottom: `3px solid ${P2.ink}` }),
      bulletList7(arrayValue4(c.right, DEFAULTS30.comparison.right), spec, { marginTop: 16 })
    ]),
    doodle("line", { left: 427, top: 70, width: 110, transform: "rotate(90deg)" })
  ]);
}
function renderClosing14(spec) {
  const c = content17(spec, "closing");
  const accents = arrayValue4(c.accents, DEFAULTS30.closing.accents);
  return page15("cork", [
    sticky({ left: 230, top: 150, width: 500, height: 176, color: "yellow", rotate: -1, pinColor: "#C92A2A", style: { alignItems: "center", justifyContent: "center" } }, [
      displayText3(textValue3(c.title, DEFAULTS30.closing.title), spec, { fontSize: 45, textAlign: "center", lineHeight: 1.08 }),
      handText(textValue3(c.subtitle, DEFAULTS30.closing.subtitle), spec, { marginTop: 14, fontSize: 23, textAlign: "center" })
    ]),
    sticky({ left: 132, top: 96, width: 176, height: 82, color: "blue", rotate: -12, pinColor: "#1864AB", style: { padding: 14, justifyContent: "center" } }, [
      handText(accents[0], spec, { fontSize: 18, textAlign: "center" })
    ]),
    sticky({ right: 146, bottom: 135, width: 198, height: 80, color: "pink", rotate: 8, pinColor: "#C92A2A", style: { padding: 14, justifyContent: "center" } }, [
      handText(accents[1], spec, { fontSize: 18, textAlign: "center" })
    ]),
    sticky({ right: 124, top: 118, width: 68, height: 58, color: "green", rotate: 15, pinColor: "#2F9E44", style: { padding: 10, alignItems: "center", justifyContent: "center" } }, [
      handText(accents[2], spec, { fontSize: 18, textAlign: "center" })
    ]),
    sticky({ left: 192, bottom: 130, width: 76, height: 62, color: "orange", rotate: -6, pinColor: "#F59F00", style: { padding: 10, alignItems: "center", justifyContent: "center" } }, [
      handText(accents[3], spec, { fontSize: 19, textAlign: "center" })
    ]),
    bodyText4(textValue3(c.contact, DEFAULTS30.closing.contact), spec, {
      position: "absolute",
      left: 260,
      top: 420,
      width: 440,
      color: P2.inkLight,
      fontSize: 16,
      textAlign: "center"
    }),
    doodle("angle", { right: 80, top: 58, width: 72, height: 72 }),
    doodle("line", { left: 98, bottom: 74, width: 110, transform: "rotate(-8deg)" })
  ]);
}
var RENDERERS23 = {
  title: renderTitle3,
  statement: renderStatement12,
  "two-column": renderTwoColumn,
  chart: renderChart13,
  features: renderFeatures4,
  timeline: renderTimeline12,
  "image-text": renderImageText,
  diagram: renderDiagram6,
  comparison: renderComparison2,
  closing: renderClosing14
};
function renderStickyWorkshopBoard(spec) {
  const variant = normalizeVariant31(spec);
  return (RENDERERS23[variant] || renderTitle3)(spec);
}

// templates/beautiful/stencil-field-manual.mjs
var templateId33 = "stencil-field-manual";
var PAGE_VARIANTS32 = [
  "cover",
  "agenda",
  "princ",
  "sec",
  "consult",
  "chart",
  "process",
  "matrix",
  "stats",
  "quote",
  "cta"
];
var rendererContract33 = {
  template_id: templateId33,
  renderer_id: `artboard_satori.${templateId33}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "stencil-tablet",
  implemented_page_variants: PAGE_VARIANTS32,
  page_family: {
    family_id: "stencil-tablet",
    supported_page_variants: PAGE_VARIANTS32,
    variant_usage_policy: {
      singletons: ["cover", "agenda", "sec", "cta"],
      repeatable: ["princ", "consult", "chart", "process", "matrix", "stats", "quote"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/stencil-tablet-1.png"
};
var C3 = {
  bone: "#E2DCC9",
  ink: "#0A0A0A",
  paper: "#F4EFE0",
  sienna: "#A06A3C",
  magenta: "#C73B7A",
  orange: "#EE7A2E",
  teal: "#2D7E73",
  blue: "#3F73B7",
  mustard: "#D8A93B",
  olive: "#6F7A2E",
  softInk: "rgba(10,10,10,0.7)",
  softBone: "rgba(226,220,201,0.74)"
};
var DEFAULTS31 = {
  cover: {
    super: "Agency name x Partner name",
    title: "Bold by\ndesign.",
    who: "North & Partners",
    subwho: "Brand - Strategy - Q2 2026",
    date: "29 - IV - 2026"
  },
  agenda: {
    title: "Agenda",
    meta: ["Agency x Partner", "Phase I"],
    items: ["Agenda\nitem", "Agenda\nitem", "Agenda\nitem", "Agenda\nitem"]
  },
  princ: {
    title: "Our Principles",
    meta: ["Agency x Partner", "Phase II"],
    cards: [
      ["1", "Make it\nblunt", "Decisions read at a glance. If a stakeholder needs the legend, the slide is doing too much."],
      ["2", "Stay in\nthe system", "Three stencil numerals, two sans weights, six saturated colours. Anything else is a special case."],
      ["3", "Show the\nshape", "Lead with form. Use weight, scale, and silhouette before reaching for icons or imagery."],
      ["4", "Earn the\nblack slide", "Reserve full-bleed black for moments that deserve a beat. Never as wallpaper."]
    ]
  },
  sec: {
    title: "Direction",
    meta: ["Section II"],
    number: "02",
    label: "Direction\n& doctrine",
    headline: "Where we\nare going,\nand why."
  },
  consult: {
    title: "Findings - Detail",
    meta: ["Agency x Partner", "Phase III"],
    tag: "Action title - 05",
    action: "The trust gap is built in the first 72 hours, not the first 7 days - and the cost compounds for the rest of the lifecycle.",
    columns: [
      ["What we found", "Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.", ["Email open #2 lifts D90 retention by 19 points.", "A written welcome retained 2.4x the cohort.", "One human reply within 24 hours is the largest lever."], "N = 14,200 - Q1 2026"],
      ["Why it matters", "$4.1M projected retained ARR - current cohort.", ["The first three days are the only window where customers are paying attention.", "Every interaction here does the work of four later interactions."], "Modelled on FY24 cohort behaviour"],
      ["What to do", "Rewrite emails 1-3 in human voice and route high-value signups to named humans.", ["Ship behind a 50/50 holdout.", "Measure reply rate, second-open rate, and D90 retention."], "Pilot scope: top-decile signups"]
    ]
  },
  chart: {
    title: "Retention, by cohort",
    meta: ["Phase III", "Evidence"],
    headline: "Curve\nbends at\nday three.",
    body: "Cohorts that received a written welcome and a human reply within 24 hours retain at roughly 2x the rate of the templated cohort.",
    legend: ["Templated welcome", "Written welcome", "Written + human reply"],
    labels: ["D0", "D7", "D14", "D30", "D45", "D60", "D90"]
  },
  process: {
    title: "How we'll work",
    meta: ["Agency x Partner", "Phase IV"],
    headline: "From insight\nto default,\nin five moves.",
    subtitle: "A repeatable path each pilot follows before it graduates to the default experience for every customer.",
    steps: [
      ["1", "Frame", "Translate the insight into a single behavioural hypothesis."],
      ["2", "Design", "Sketch the smallest end-to-end change."],
      ["3", "Pilot", "Ship to a 50/50 holdout in one segment."],
      ["4", "Read", "Review against pre-registered metrics."],
      ["5", "Default", "Promote to the default surface."]
    ],
    timeline: ["Week 1 - Frame", "Week 2-3 - Design", "Week 3-6 - Pilot", "Week 7 - Read", "Week 8 - Default"]
  },
  matrix: {
    title: "Three pilots, side by side",
    meta: ["Agency x Partner", "Phase IV"],
    headline: "Where each\npilot earns\nits keep.",
    subtitle: "Scored against the four levers that matter most this cycle.",
    headers: ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
    rows: [
      ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
      ["Build cost", "Low", "Medium", "Low"],
      ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
      ["Risk", "None", "Material", "Soft, reversible"]
    ]
  },
  stats: {
    title: "In numbers",
    meta: ["Phase III", "Evidence"],
    headline: "The case,\nby the numbers.",
    subtitle: "Three figures we will report against every cycle.",
    stats: [
      ["2.4x", "Retention\nmultiple", "Cohort with written welcome + human reply vs. templated control."],
      ["$4.1M", "Projected\nretained ARR", "Modelled on the current quarter's signup cohort."],
      ["72HR", "The window\nthat matters", "Behaviour after the first 72 hours predicts 18-month retention."]
    ]
  },
  quote: {
    title: "Client voice",
    meta: ["Phase III", "Evidence"],
    quote: "Three days in, someone wrote me a real sentence. I'd been a customer of theirs for nine months before I noticed I'd never been a customer anywhere else again.",
    who: "Margaux Leveque",
    role: "CFO - mid-market retailer - 14 months in"
  },
  cta: {
    title: "What's next",
    meta: ["Agency x Partner", "Phase V"],
    headline: "Pick the\nthree\nbets.",
    body: "Three pilots in eight weeks. We'll bring back evidence the quarter after, and the question will be which two to default.",
    steps: [
      ["1", "Pick the pilots", "Confirm two of three by Friday. Owners named in the same conversation."],
      ["2", "Pre-register the read", "Lock the metric, holdout, and kill criteria before any code ships."],
      ["3", "Stand a Friday review", "One slide each pilot, every Friday, until the bet defaults or dies."]
    ]
  }
};
function normalizeVariant32(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS32.length) return PAGE_VARIANTS32[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS32) {
    if (raw.includes(variant)) return variant;
  }
  if (raw.includes("principle")) return "princ";
  if (raw.includes("section")) return "sec";
  if (raw.includes("detail")) return "consult";
  if (raw.includes("data")) return "chart";
  if (raw.includes("comparison")) return "matrix";
  if (raw.includes("closing") || raw.includes("next")) return "cta";
  return "cover";
}
function content18(spec, variant) {
  return { ...DEFAULTS31[variant] || DEFAULTS31.cover, ...spec.content || {} };
}
function arr2(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function display15(value15, spec, style = {}) {
  return Title(String(value15 || "").toUpperCase(), {
    color: C3.ink,
    fontSize: 88,
    lineHeight: 0.9,
    whiteSpace: "pre-wrap",
    ...fontRole("display", spec, { fontWeight: 900, lineHeight: 0.9, letterSpacing: -0.6 }),
    ...style
  });
}
function text7(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C3.ink,
    fontSize: 18,
    lineHeight: 1.35,
    ...fontRole("body", spec, { fontWeight: 400 }),
    ...style
  });
}
function label26(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: C3.ink,
    fontSize: 14,
    lineHeight: 1,
    letterSpacing: 0.8,
    ...fontRole("label", spec, { fontWeight: 800, letterSpacing: 0.8 }),
    ...style
  });
}
function number(value15, spec, style = {}) {
  return TextBlock(String(value15 || "").toUpperCase(), {
    color: C3.ink,
    fontSize: 100,
    lineHeight: 0.86,
    letterSpacing: -1,
    ...fontRole("metric", spec, { fontWeight: 900, lineHeight: 0.86 }),
    ...style
  });
}
function page16(spec, pageNo, children, { dark = false, title: title2 = "", meta = [] } = {}) {
  const bg = dark ? C3.ink : C3.bone;
  const fg = dark ? C3.bone : C3.ink;
  const muted = dark ? C3.softBone : C3.softInk;
  return box({ width: 960, height: 540, position: "relative", overflow: "hidden", backgroundColor: bg }, [
    label26(title2, spec, { position: "absolute", left: 48, top: 34, color: fg, fontSize: 20, letterSpacing: 1.2 }),
    box({ position: "absolute", right: 48, top: 36, flexDirection: "row", gap: 36 }, arr2(meta).map(
      (item) => label26(item, spec, { color: muted, fontSize: 14, letterSpacing: 1.1 })
    )),
    ...children,
    box({ position: "absolute", left: 48, right: 48, bottom: 26, flexDirection: "row", justifyContent: "space-between" }, [
      label26("North & Partners", spec, { color: muted, fontSize: 13, letterSpacing: 1.1 }),
      label26(`${String(pageNo).padStart(2, "0")} / 11`, spec, { color: muted, fontSize: 13, letterSpacing: 1.1 })
    ])
  ]);
}
function tablet(color, children, style = {}) {
  return box({ backgroundColor: color, borderRadius: 20, overflow: "hidden", ...style }, children);
}
function renderCover25(spec) {
  const d = content18(spec, "cover");
  return box({ width: 960, height: 540, position: "relative", overflow: "hidden", backgroundColor: C3.bone }, [
    label26(d.super, spec, { position: "absolute", left: 48, top: 40, fontSize: 18, letterSpacing: 2, color: C3.softInk }),
    box({ position: "absolute", right: 52, top: 52, width: 205, height: 320, borderRadius: 104, backgroundColor: C3.teal, transform: "rotate(-18deg)" }),
    box({ position: "absolute", right: 94, top: 119, width: 176, height: 160, borderRadius: 88, backgroundColor: C3.bone, opacity: 0.35 }),
    display15(d.title, spec, { position: "absolute", left: 48, bottom: 106, width: 690, fontSize: 146, lineHeight: 0.82, color: C3.ink }),
    box({ position: "absolute", left: 50, bottom: 50, width: 42, height: 42, borderRadius: 10, backgroundColor: C3.orange }),
    label26(d.who, spec, { position: "absolute", left: 110, bottom: 68, fontSize: 19, letterSpacing: 1.1 }),
    label26(d.subwho, spec, { position: "absolute", left: 110, bottom: 45, fontSize: 12, color: C3.softInk, letterSpacing: 1.1 }),
    number(d.date, spec, { position: "absolute", right: 48, bottom: 47, width: 220, textAlign: "right", fontSize: 24, color: C3.ink })
  ]);
}
function renderAgenda9(spec) {
  const d = content18(spec, "agenda");
  const items = arr2(d.items, DEFAULTS31.agenda.items);
  const colors24 = [C3.orange, C3.teal, C3.blue, C3.sienna];
  return page16(spec, 2, [
    box({ position: "absolute", left: 50, right: 50, top: 156, bottom: 92, flexDirection: "row", gap: 22 }, items.slice(0, 4).map(
      (item, index) => tablet(colors24[index], [
        box({ position: "absolute", left: 0, right: 0, top: 76, height: 118, borderRadius: 80, backgroundColor: index % 2 === 0 ? "rgba(226,220,201,0.18)" : "rgba(10,10,10,0.12)" }),
        label26(`0${index + 1}`, spec, { position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", fontSize: 22, color: C3.ink }),
        display15(item, spec, { position: "absolute", left: 18, right: 18, bottom: 34, textAlign: "center", fontSize: 26, lineHeight: 1.02, color: C3.ink })
      ], { flex: 1, position: "relative" })
    ))
  ], { dark: true, title: d.title, meta: d.meta });
}
function renderPrinciples(spec) {
  const d = content18(spec, "princ");
  const cards = arr2(d.cards, DEFAULTS31.princ.cards);
  const colors24 = [C3.sienna, C3.magenta, C3.orange, C3.teal];
  return page16(spec, 3, [
    box({ position: "absolute", left: 50, right: 50, top: 142, bottom: 72, flexDirection: "row", gap: 18 }, cards.slice(0, 4).map((card2, index) => {
      const [n, title2, body25] = card2;
      const dark = index === 3;
      return tablet(colors24[index], [
        number(n, spec, { position: "absolute", left: 22, top: 22, fontSize: 134, color: C3.ink }),
        display15(title2, spec, { position: "absolute", left: 22, right: 22, top: 172, fontSize: 24, lineHeight: 1.02, color: dark ? C3.bone : C3.ink }),
        text7(body25, spec, { position: "absolute", left: 22, right: 22, bottom: 22, fontSize: 11.2, lineHeight: 1.28, color: dark ? C3.bone : C3.ink })
      ], { flex: 1, position: "relative" });
    }))
  ], { title: d.title, meta: d.meta });
}
function renderSection4(spec) {
  const d = content18(spec, "sec");
  return page16(spec, 4, [
    number(d.number, spec, { position: "absolute", left: 42, top: 104, fontSize: 274, color: C3.orange }),
    label26(d.label, spec, { position: "absolute", right: 54, top: 176, width: 210, textAlign: "right", fontSize: 16, lineHeight: 1.12, color: C3.softBone }),
    display15(d.headline, spec, { position: "absolute", right: 54, bottom: 104, width: 505, textAlign: "right", fontSize: 76, lineHeight: 0.92, color: C3.bone })
  ], { dark: true, title: d.title, meta: d.meta });
}
function renderConsult3(spec) {
  const d = content18(spec, "consult");
  const columns = arr2(d.columns, DEFAULTS31.consult.columns);
  return page16(spec, 5, [
    tablet(C3.mustard, [
      label26(d.tag, spec, { position: "absolute", left: 22, top: 24, width: 150, fontSize: 14, letterSpacing: 1.3 }),
      box({ position: "absolute", left: 185, top: 22, bottom: 22, width: 2, backgroundColor: C3.ink }),
      display15(d.action, spec, { position: "absolute", left: 210, right: 24, top: 20, fontSize: 23, lineHeight: 1.08, color: C3.ink })
    ], { position: "absolute", left: 50, right: 50, top: 112, height: 104 }),
    box({ position: "absolute", left: 50, right: 50, top: 246, bottom: 74, flexDirection: "row", gap: 18 }, columns.slice(0, 3).map((col, index) => {
      const [title2, bodyText5, bullets, source] = col;
      const fill2 = index === 1 ? C3.orange : C3.paper;
      return tablet(fill2, [
        display15(title2, spec, { position: "absolute", left: 18, right: 18, top: 18, fontSize: 22, lineHeight: 1.05, color: C3.ink }),
        box({ position: "absolute", left: 18, right: 18, top: 64, height: 2, backgroundColor: C3.ink }),
        text7(bodyText5, spec, { position: "absolute", left: 18, right: 18, top: 78, fontSize: 12.4, lineHeight: 1.32 }),
        ...arr2(bullets).slice(0, 3).map(
          (bullet, bulletIndex) => text7(`- ${bullet}`, spec, { position: "absolute", left: 18, right: 18, top: 122 + bulletIndex * 22, fontSize: 9.6, lineHeight: 1.14 })
        ),
        label26(source, spec, { position: "absolute", left: 18, right: 18, bottom: 10, fontSize: 8.8, color: C3.softInk, letterSpacing: 0.8 })
      ], { flex: 1, position: "relative" });
    }))
  ], { title: d.title, meta: d.meta });
}
function renderChart14(spec) {
  const d = content18(spec, "chart");
  const seriesColors = [C3.bone, C3.mustard, C3.orange];
  return page16(spec, 6, [
    display15(d.headline, spec, { position: "absolute", left: 52, top: 160, width: 350, fontSize: 54, lineHeight: 0.9, color: C3.bone }),
    text7(d.body, spec, { position: "absolute", left: 54, top: 320, width: 342, fontSize: 13.2, lineHeight: 1.38, color: C3.softBone }),
    box({ position: "absolute", left: 54, bottom: 82, gap: 8 }, arr2(d.legend, DEFAULTS31.chart.legend).map(
      (item, index) => box({ flexDirection: "row", gap: 10, alignItems: "center" }, [
        box({ width: 28, height: 5, backgroundColor: seriesColors[index], opacity: index === 0 ? 0.55 : 1 }),
        label26(item, spec, { fontSize: 11, color: C3.bone, letterSpacing: 0.8 })
      ])
    )),
    tablet(C3.paper, [
      label26("% OF COHORT ACTIVE, BY DAY", spec, { position: "absolute", left: 42, top: 24, fontSize: 11, color: C3.softInk }),
      box({ position: "absolute", left: 76, right: 34, top: 70, bottom: 64, borderLeft: "2px solid #0A0A0A", borderBottom: "2px solid #0A0A0A" }),
      ...[0, 1, 2, 3].map((i) => box({ position: "absolute", left: 76, right: 34, top: 70 + i * 38, height: 1, backgroundColor: "rgba(10,10,10,0.14)" })),
      ...[88, 116, 146, 174, 210, 246, 298].map((x, index) => box({ position: "absolute", left: x, bottom: 70 + [10, 22, 35, 46, 58, 66, 72][index], width: 8, height: 8, borderRadius: 4, backgroundColor: C3.orange })),
      ...[88, 116, 146, 174, 210, 246, 298].map((x, index) => box({ position: "absolute", left: x, bottom: 70 + [10, 16, 25, 34, 42, 48, 54][index], width: 6, height: 6, borderRadius: 3, backgroundColor: C3.mustard })),
      ...arr2(d.labels, DEFAULTS31.chart.labels).slice(0, 7).map(
        (item, index) => label26(item, spec, { position: "absolute", left: 80 + index * 39, bottom: 30, fontSize: 10, color: C3.softInk })
      )
    ], { position: "absolute", right: 52, top: 166, width: 390, height: 288 })
  ], { dark: true, title: d.title, meta: d.meta });
}
function renderProcess7(spec) {
  const d = content18(spec, "process");
  const steps = arr2(d.steps, DEFAULTS31.process.steps);
  return page16(spec, 7, [
    display15(d.headline, spec, { position: "absolute", left: 52, top: 108, width: 390, fontSize: 52, lineHeight: 0.9 }),
    label26(d.subtitle, spec, { position: "absolute", right: 56, top: 132, width: 310, fontSize: 14, lineHeight: 1.36, color: C3.softInk, letterSpacing: 0.8 }),
    box({ position: "absolute", left: 50, right: 50, top: 330, height: 104, flexDirection: "row", gap: 14 }, steps.slice(0, 5).map((step, index) => {
      const [n, title2, bodyText5] = step;
      const fills = [C3.sienna, C3.magenta, C3.orange, C3.teal, C3.blue];
      const dark = index >= 3;
      return tablet(fills[index], [
        number(n, spec, { position: "absolute", left: 16, top: 12, fontSize: 34, color: dark ? C3.bone : C3.ink }),
        display15(title2, spec, { position: "absolute", left: 16, right: 16, top: 48, fontSize: 16, lineHeight: 1.02, color: dark ? C3.bone : C3.ink }),
        text7(bodyText5, spec, { position: "absolute", left: 16, right: 16, top: 72, fontSize: 8.2, lineHeight: 1.16, color: dark ? C3.bone : C3.ink })
      ], { flex: 1, position: "relative" });
    })),
    tablet(C3.paper, arr2(d.timeline, DEFAULTS31.process.timeline).slice(0, 5).map(
      (item) => label26(item, spec, { fontSize: 11, color: C3.ink, letterSpacing: 0.8 })
    ), { position: "absolute", left: 50, right: 50, bottom: 70, height: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-around" })
  ], { title: d.title, meta: d.meta });
}
function renderMatrix4(spec) {
  const d = content18(spec, "matrix");
  const headers = arr2(d.headers, DEFAULTS31.matrix.headers);
  const rows = arr2(d.rows, DEFAULTS31.matrix.rows);
  const cells = [headers, ...rows].flatMap((row) => row);
  return page16(spec, 8, [
    display15(d.headline, spec, { position: "absolute", left: 52, top: 106, width: 390, fontSize: 52, lineHeight: 0.9 }),
    label26(d.subtitle, spec, { position: "absolute", right: 56, top: 132, width: 310, fontSize: 14, lineHeight: 1.36, color: C3.softInk, letterSpacing: 0.8 }),
    tablet(C3.paper, cells.slice(0, 20).map((cell, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const head = row === 0;
      const first = col === 0;
      const rowHeight = 41;
      return box({
        position: "absolute",
        left: col === 0 ? 0 : 204 + (col - 1) * 162,
        top: row * rowHeight,
        width: col === 0 ? 204 : 162,
        height: rowHeight,
        backgroundColor: head ? C3.ink : "transparent",
        borderRight: col === 3 ? "0px solid transparent" : "1px solid rgba(10,10,10,0.28)",
        borderBottom: row === 4 ? "0px solid transparent" : "1px solid rgba(10,10,10,0.28)",
        justifyContent: "center",
        paddingLeft: 14,
        paddingRight: 10
      }, [
        label26(cell, spec, { fontSize: head || first ? 12 : 11, color: head ? C3.bone : C3.ink, letterSpacing: 0.6, lineHeight: 1.1 })
      ]);
    }), { position: "absolute", left: 50, right: 50, bottom: 62, height: 205, overflow: "hidden" })
  ], { title: d.title, meta: d.meta });
}
function renderStats15(spec) {
  const d = content18(spec, "stats");
  const stats2 = arr2(d.stats, DEFAULTS31.stats.stats);
  return page16(spec, 9, [
    display15(d.headline, spec, { position: "absolute", left: 52, top: 118, width: 430, fontSize: 66, lineHeight: 0.92, color: C3.bone }),
    label26(d.subtitle, spec, { position: "absolute", right: 56, top: 132, width: 300, fontSize: 14, lineHeight: 1.36, color: C3.softBone, letterSpacing: 0.8 }),
    box({ position: "absolute", left: 50, right: 50, bottom: 74, height: 180, flexDirection: "row", gap: 18 }, stats2.slice(0, 3).map((item, index) => {
      const [value15, title2, bodyText5] = item;
      const fills = [C3.orange, C3.mustard, C3.bone];
      return tablet(fills[index], [
        number(value15, spec, { position: "absolute", left: 20, top: 18, fontSize: 78, color: C3.ink }),
        display15(title2, spec, { position: "absolute", left: 20, right: 20, top: 94, fontSize: 18, lineHeight: 1.02, color: C3.ink }),
        text7(bodyText5, spec, { position: "absolute", left: 20, right: 20, bottom: 16, fontSize: 9.3, lineHeight: 1.18, color: C3.ink })
      ], { flex: 1, position: "relative" });
    }))
  ], { dark: true, title: d.title, meta: d.meta });
}
function renderQuote22(spec) {
  const d = content18(spec, "quote");
  return page16(spec, 10, [
    tablet(C3.magenta, [
      number('"', spec, { position: "absolute", left: 52, top: 38, fontSize: 190, color: C3.ink }),
      TextBlock(String(d.quote || ""), {
        position: "absolute",
        left: 292,
        right: 58,
        top: 68,
        color: C3.ink,
        fontSize: 29,
        lineHeight: 1.06,
        ...fontRole("display", spec, { fontWeight: 700, fontSize: 29, lineHeight: 1.06, letterSpacing: -0.2 })
      }),
      label26(d.who, spec, { position: "absolute", left: 292, right: 58, bottom: 62, fontSize: 15, letterSpacing: 1.3 }),
      label26(d.role, spec, { position: "absolute", left: 292, right: 58, bottom: 38, fontSize: 11, color: C3.softInk, letterSpacing: 1.1 })
    ], { position: "absolute", left: 50, right: 50, top: 120, bottom: 78 })
  ], { title: d.title, meta: d.meta });
}
function renderCta3(spec) {
  const d = content18(spec, "cta");
  const steps = arr2(d.steps, DEFAULTS31.cta.steps);
  return page16(spec, 11, [
    box({ position: "absolute", left: 50, right: 50, top: 112, bottom: 72, flexDirection: "row", gap: 24 }, [
      tablet(C3.teal, [
        label26("From here", spec, { position: "absolute", left: 28, top: 28, fontSize: 14, color: C3.softBone, letterSpacing: 1.4 }),
        display15(d.headline, spec, { position: "absolute", left: 28, right: 28, top: 74, fontSize: 62, lineHeight: 0.9, color: C3.bone }),
        text7(d.body, spec, { position: "absolute", left: 28, right: 70, bottom: 28, fontSize: 13, lineHeight: 1.34, color: C3.bone })
      ], { flex: 1, position: "relative" }),
      tablet(C3.orange, [
        display15("How we move\nthis week", spec, { position: "absolute", left: 28, right: 28, top: 30, fontSize: 30, lineHeight: 1 }),
        ...steps.slice(0, 3).map((step, index) => {
          const [n, title2, bodyText5] = step;
          const top = 112 + index * 74;
          return box({ position: "absolute", left: 28, right: 28, top, height: 64, flexDirection: "row", gap: 14 }, [
            number(n, spec, { width: 46, fontSize: 36, color: C3.ink }),
            box({ flex: 1 }, [
              label26(title2, spec, { fontSize: 15, letterSpacing: 0.9 }),
              text7(bodyText5, spec, { marginTop: 4, fontSize: 11, lineHeight: 1.28 })
            ])
          ]);
        })
      ], { flex: 1, position: "relative" })
    ])
  ], { title: d.title, meta: d.meta });
}
function renderStencilFieldManual(spec) {
  const variant = normalizeVariant32(spec);
  switch (variant) {
    case "agenda":
      return renderAgenda9(spec);
    case "princ":
      return renderPrinciples(spec);
    case "sec":
      return renderSection4(spec);
    case "consult":
      return renderConsult3(spec);
    case "chart":
      return renderChart14(spec);
    case "process":
      return renderProcess7(spec);
    case "matrix":
      return renderMatrix4(spec);
    case "stats":
      return renderStats15(spec);
    case "quote":
      return renderQuote22(spec);
    case "cta":
      return renderCta3(spec);
    case "cover":
    default:
      return renderCover25(spec);
  }
}

// templates/beautiful/vellum-scholar-brief.mjs
var templateId34 = "vellum-scholar-brief";
var PAGE_VARIANTS33 = ["cover", "statement", "text", "stats", "list", "quote", "compare", "chart", "end"];
var rendererContract34 = {
  template_id: templateId34,
  renderer_id: `artboard_satori.${templateId34}`,
  status: "needs_review",
  renderer_stage: "page_family",
  default_selectable: false,
  selection_scope: "experimental",
  source_family: "vellum",
  implemented_page_variants: PAGE_VARIANTS33,
  page_family: {
    family_id: "vellum",
    supported_page_variants: PAGE_VARIANTS33,
    variant_usage_policy: {
      singletons: ["cover", "statement", "quote", "end"],
      repeatable: ["text", "stats", "list", "compare", "chart"]
    }
  },
  required_font_roles: ["display", "body", "label", "metric"],
  reference_screenshot: "beautiful-html-templates/screenshots/vellum-1.png"
};
var C4 = {
  navy: "#2A3870",
  navyDeep: "#1F2858",
  navyMid: "#34407A",
  yellow: "#E8D85C",
  yellowBright: "#F5E168",
  yellow2: "rgba(232,216,92,0.62)",
  yellow3: "rgba(232,216,92,0.32)",
  teal: "#3A7878",
  border: "rgba(232,216,92,0.20)"
};
var DEFAULTS32 = {
  cover: {
    kicker: "Essay 01 - 2026",
    title: "On Restraint",
    subtitle: "Field notes on the discipline of less, written for designers who already know how to add.",
    pin: ["01 / 09", "The Quiet Studio.", "Edition One."]
  },
  statement: {
    kicker: "[The Argument]",
    title: "Most design problems are removed, not solved.",
    pin: ["02 / 09", "Bold claim.", "Stand by it."]
  },
  text: {
    kicker: "[Field Note 03]",
    number: "03",
    heading: "Observation",
    title: "What you remove is louder than what you keep.",
    paragraphs: [
      "Subtraction creates the figure. Addition only fills the ground.",
      "Working drafts always carry more than they need; the work of editing is mostly the work of cutting."
    ],
    pin: ["03 / 09", "Show, don't tell."]
  },
  stats: {
    kicker: "[By the Numbers]",
    number: "04",
    title: "Three findings from a year of editing.",
    stats: [
      ["73%", "of choices in early drafts are removed before publication"],
      ["1.4x", "time spent removing vs. adding material in mature work"],
      ["#1", "predictor of perceived quality is amount of white space (n=412)"]
    ],
    pin: ["04 / 09", "Three facts.", "One argument."]
  },
  list: {
    kicker: "[Method]",
    number: "05",
    title: "[Why It Matters]",
    lead: "Four rules that hold.",
    items: [
      "One accent color per spread. Never two.",
      "Body text obeys the grid. Display is allowed to break it.",
      "White space is a choice, not a default.",
      "Reduce until removal hurts. Stop one step before that."
    ],
    pin: ["05 / 09", "Four rules.", "No exceptions."]
  },
  quote: {
    quote: "Design is a plan for arranging elements to accomplish a particular purpose.",
    name: "Charles Eames",
    role: "Designer - 1972",
    pin: ["06 / 09", "Eames said it.", "Still true."]
  },
  compare: {
    left_label: "Before",
    left_title: "The unfocused draft",
    left_body: "Three points compete for the title slot. Two accent colors. The body copy is two paragraphs and ends mid-thought.",
    left_items: ["Three claims, none load-bearing", "Twin accents pull the eye apart", "Body unedited; reader does the work"],
    right_label: "After",
    right_title: "The edited piece",
    right_body: "One claim takes the title. One accent does the work. The paragraph ends where the thought ends.",
    right_items: ["One claim, fully argued", "One accent, used once", "Body cut to the bone"],
    pin: ["07 / 09", "Two states.", "Same essay."]
  },
  chart: {
    kicker: "[Pattern]",
    number: "08",
    title: "How drafts shrink during editing.",
    caption: "Word count, indexed (start = 100)",
    labels: ["Draft", "First read", "Second read", "Peer review", "Final"],
    values: [100, 92, 78, 65, 58],
    pin: ["08 / 09", "Internal study, 2026.", "n = 412."]
  },
  end: {
    kicker: "[End notes]",
    title: "Edit until it stops looking edited.",
    subtitle: "Thank you for reading. Comments, corrections, or quiet disagreement welcome at notes@quiet-studio.com.",
    pin: ["09 / 09", "The Quiet Studio.", "Set in Cormorant + DM Sans."]
  }
};
function normalizeVariant33(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0);
  if (index >= 1 && index <= PAGE_VARIANTS33.length) return PAGE_VARIANTS33[index - 1];
  const raw = `${spec.renderer_variant_id || ""} ${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replaceAll("_", "-");
  for (const variant of PAGE_VARIANTS33) {
    if (raw.includes(variant)) return variant;
  }
  if (raw.includes("closing")) return "end";
  if (raw.includes("data") || raw.includes("chart")) return "chart";
  if (raw.includes("compare")) return "compare";
  if (raw.includes("quote")) return "quote";
  if (raw.includes("list") || raw.includes("process")) return "list";
  if (raw.includes("stats")) return "stats";
  if (raw.includes("detail") || raw.includes("content")) return "text";
  if (raw.includes("statement")) return "statement";
  return "cover";
}
function content19(spec, variant) {
  return { ...DEFAULTS32[variant] || DEFAULTS32.cover, ...spec.content || {} };
}
function arr3(value15, fallback2 = []) {
  return Array.isArray(value15) && value15.length ? value15 : fallback2;
}
function serif7(value15, spec, style = {}) {
  return Title(String(value15 || ""), {
    color: C4.yellow,
    fontSize: 68,
    fontWeight: 400,
    fontStyle: "italic",
    lineHeight: 0.96,
    letterSpacing: -0.4,
    textAlign: "center",
    whiteSpace: "pre-wrap",
    ...fontRole("display", spec, { fontWeight: 400, fontStyle: "italic", lineHeight: 0.96 }),
    textTransform: "none",
    ...style
  });
}
function body24(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C4.yellow2,
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.58,
    textAlign: "center",
    ...fontRole("body", spec, { fontWeight: 400 }),
    textTransform: "none",
    ...style
  });
}
function label27(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C4.teal,
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: 0.8,
    ...fontRole("label", spec, { fontWeight: 400, letterSpacing: 0.8 }),
    textTransform: "none",
    ...style
  });
}
function metric18(value15, spec, style = {}) {
  return TextBlock(String(value15 || ""), {
    color: C4.yellow,
    fontSize: 48,
    fontWeight: 400,
    fontStyle: "italic",
    lineHeight: 0.98,
    textAlign: "center",
    ...fontRole("metric", spec, { fontWeight: 400, fontStyle: "italic", lineHeight: 0.98 }),
    textTransform: "none",
    ...style
  });
}
function page17(children) {
  return box({ width: 960, height: 540, position: "relative", backgroundColor: C4.navy, overflow: "hidden" }, children);
}
function pin3(spec, lines, style = {}) {
  return box({ position: "absolute", left: 56, bottom: 48, width: 220, flexDirection: "column", gap: 3, ...style }, arr3(lines, DEFAULTS32.cover.pin).slice(0, 3).map(
    (line2) => label27(line2, spec, { color: C4.teal, fontSize: 10.5, lineHeight: 1.35 })
  ));
}
function renderCover26(spec) {
  const d = content19(spec, "cover");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 300, width: 360, top: 130, textAlign: "center", color: C4.teal, fontSize: 10 }),
    serif7(d.title, spec, { position: "absolute", left: 180, top: 172, width: 600, fontSize: 84, lineHeight: 0.94 }),
    body24(d.subtitle, spec, { position: "absolute", left: 265, top: 298, width: 430, fontSize: 15, lineHeight: 1.58 }),
    pin3(spec, d.pin)
  ]);
}
function renderStatement13(spec) {
  const d = content19(spec, "statement");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 300, width: 360, top: 145, textAlign: "center", color: C4.teal, fontSize: 10 }),
    serif7(d.title, spec, { position: "absolute", left: 126, top: 188, width: 708, fontSize: 58, lineHeight: 1.04 }),
    pin3(spec, d.pin)
  ]);
}
function renderText(spec) {
  const d = content19(spec, "text");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 98, top: 72, color: C4.teal, fontSize: 10 }),
    label27(d.number, spec, { position: "absolute", left: 98, top: 168, color: C4.teal, fontSize: 12 }),
    serif7(d.heading, spec, { position: "absolute", left: 134, top: 154, width: 220, textAlign: "left", fontSize: 38, color: C4.yellow }),
    serif7(d.title, spec, { position: "absolute", left: 375, top: 145, width: 430, textAlign: "left", fontSize: 34, lineHeight: 1.08 }),
    ...arr3(d.paragraphs, DEFAULTS32.text.paragraphs).slice(0, 2).map(
      (para, index) => body24(para, spec, { position: "absolute", left: 382, top: 258 + index * 68, width: 380, textAlign: "left", fontSize: 14, lineHeight: 1.55 })
    ),
    pin3(spec, d.pin)
  ]);
}
function renderStats16(spec) {
  const d = content19(spec, "stats");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 300, width: 360, top: 74, textAlign: "center", fontSize: 10 }),
    label27(d.number, spec, { position: "absolute", left: 440, width: 80, top: 108, textAlign: "center", color: C4.teal, fontSize: 11 }),
    serif7(d.title, spec, { position: "absolute", left: 214, top: 136, width: 532, fontSize: 42, lineHeight: 1.08 }),
    box({ position: "absolute", left: 108, right: 108, top: 286, height: 122, flexDirection: "row" }, arr3(d.stats, DEFAULTS32.stats.stats).slice(0, 3).map((stat, index) => {
      const [value15, text10] = stat;
      return box({ flex: 1, height: "100%", alignItems: "center", padding: "0 28px", borderRight: index < 2 ? `1px solid ${C4.border}` : "0px solid transparent", flexDirection: "column" }, [
        metric18(value15, spec, { width: "100%", fontSize: 54, lineHeight: 0.95 }),
        label27(text10, spec, { width: "100%", marginTop: 13, textAlign: "center", color: C4.yellow2, fontSize: 10.5, lineHeight: 1.35, letterSpacing: 0.3 })
      ]);
    })),
    pin3(spec, d.pin)
  ]);
}
function renderList7(spec) {
  const d = content19(spec, "list");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 116, top: 70, color: C4.teal, fontSize: 10 }),
    label27(d.number, spec, { position: "absolute", right: 116, top: 70, color: C4.teal, fontSize: 10, textAlign: "right" }),
    serif7(d.title, spec, { position: "absolute", left: 180, top: 112, width: 600, fontSize: 46, lineHeight: 1.05 }),
    body24(d.lead, spec, { position: "absolute", left: 260, top: 180, width: 440, fontSize: 15 }),
    box({ position: "absolute", left: 230, top: 242, width: 500, flexDirection: "column", gap: 20 }, arr3(d.items, DEFAULTS32.list.items).slice(0, 4).map(
      (item, index) => box({ width: "100%", flexDirection: "row", gap: 18 }, [
        label27(String(index + 1).padStart(2, "0"), spec, { width: 28, color: C4.teal, fontSize: 10 }),
        body24(item, spec, { flex: 1, textAlign: "left", color: C4.yellow, fontSize: 15, lineHeight: 1.35 })
      ])
    )),
    pin3(spec, d.pin)
  ]);
}
function renderQuote23(spec) {
  const d = content19(spec, "quote");
  return page17([
    serif7('"', spec, { position: "absolute", left: 430, width: 100, top: 96, fontSize: 96, color: C4.teal, lineHeight: 0.7 }),
    serif7(d.quote, spec, { position: "absolute", left: 160, top: 180, width: 640, fontSize: 39, lineHeight: 1.2 }),
    label27(d.name, spec, { position: "absolute", left: 300, width: 360, top: 377, textAlign: "center", color: C4.yellow, fontSize: 11 }),
    label27(d.role, spec, { position: "absolute", left: 300, width: 360, top: 405, textAlign: "center", color: C4.yellow2, fontSize: 10 }),
    pin3(spec, d.pin)
  ]);
}
function comparePanel3(spec, side, labelText4, title2, textValue4, items, left) {
  return box({ position: "absolute", left: left ? 94 : 480, top: 116, width: 386, height: 288, backgroundColor: left ? C4.navyDeep : C4.navyMid, borderLeft: left ? "0px solid transparent" : `1px solid ${C4.border}`, padding: 34, flexDirection: "column" }, [
    label27(labelText4, spec, { color: C4.teal, fontSize: 10, letterSpacing: 0.8 }),
    serif7(title2, spec, { width: "100%", marginTop: 16, textAlign: "left", fontSize: 31, lineHeight: 1.05 }),
    body24(textValue4, spec, { width: "100%", marginTop: 16, textAlign: "left", fontSize: 12.8, lineHeight: 1.45, color: C4.yellow2 }),
    box({ width: "100%", marginTop: 15, flexDirection: "column", gap: 6 }, arr3(items).slice(0, 3).map(
      (item) => body24(`- ${item}`, spec, { width: "100%", textAlign: "left", fontSize: 11.5, lineHeight: 1.25, color: C4.yellow })
    ))
  ]);
}
function renderCompare8(spec) {
  const d = content19(spec, "compare");
  return page17([
    comparePanel3(spec, "before", d.left_label, d.left_title, d.left_body, d.left_items, true),
    comparePanel3(spec, "after", d.right_label, d.right_title, d.right_body, d.right_items, false),
    pin3(spec, d.pin)
  ]);
}
function renderChart15(spec) {
  const d = content19(spec, "chart");
  const values = arr3(d.values, DEFAULTS32.chart.values);
  const labels = arr3(d.labels, DEFAULTS32.chart.labels);
  const max = Math.max(...values, 1);
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 104, top: 70, color: C4.teal, fontSize: 10 }),
    label27(d.number, spec, { position: "absolute", right: 104, top: 70, color: C4.teal, fontSize: 10, textAlign: "right" }),
    serif7(d.title, spec, { position: "absolute", left: 210, top: 118, width: 540, fontSize: 42, lineHeight: 1.05 }),
    label27(d.caption, spec, { position: "absolute", left: 300, width: 360, top: 205, textAlign: "center", color: C4.yellow2, fontSize: 10 }),
    box({ position: "absolute", left: 162, right: 162, bottom: 128, height: 178, flexDirection: "row", alignItems: "flex-end", gap: 28 }, values.slice(0, 5).map((value15, index) => {
      const height = Math.max(30, Math.round(value15 / max * 135));
      const accent = index === 0 || index === values.length - 1;
      return box({ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", flexDirection: "column" }, [
        metric18(String(value15), spec, { color: accent ? C4.yellow : C4.yellow2, fontSize: 11, fontStyle: "normal", marginBottom: 8 }),
        box({ width: "100%", height, backgroundColor: accent ? C4.yellow : C4.yellow3 }),
        label27(labels[index], spec, { width: "100%", marginTop: 12, textAlign: "center", color: C4.yellow2, fontSize: 9, lineHeight: 1.2, letterSpacing: 0.2 })
      ]);
    })),
    box({ position: "absolute", left: 162, right: 162, bottom: 128, height: 1, backgroundColor: C4.border }),
    pin3(spec, d.pin)
  ]);
}
function renderEnd7(spec) {
  const d = content19(spec, "end");
  return page17([
    label27(d.kicker, spec, { position: "absolute", left: 300, width: 360, top: 144, textAlign: "center", color: C4.teal, fontSize: 10 }),
    serif7(d.title, spec, { position: "absolute", left: 160, top: 190, width: 640, fontSize: 56, lineHeight: 1.04 }),
    body24(d.subtitle, spec, { position: "absolute", left: 280, top: 326, width: 400, fontSize: 14.5, lineHeight: 1.58 }),
    pin3(spec, d.pin)
  ]);
}
function renderVellumScholarBrief(spec) {
  const variant = normalizeVariant33(spec);
  switch (variant) {
    case "statement":
      return renderStatement13(spec);
    case "text":
      return renderText(spec);
    case "stats":
      return renderStats16(spec);
    case "list":
      return renderList7(spec);
    case "quote":
      return renderQuote23(spec);
    case "compare":
      return renderCompare8(spec);
    case "chart":
      return renderChart15(spec);
    case "end":
      return renderEnd7(spec);
    case "cover":
    default:
      return renderCover26(spec);
  }
}

// templates/beautiful/review-page-family-renderer.mjs
function colors22(spec) {
  const source = spec.theme?.colors || {};
  const background = source.background || "#F7F4EA";
  const text10 = source.text || source.primary || "#1F2933";
  const primary = source.primary || source.accent || "#2F5D50";
  const accent = source.accent || primary;
  const surface4 = source.surface || source.panel || "#FFFFFF";
  const panel3 = source.panel || source.surface || "#FFFFFF";
  const muted = source.muted || "#667085";
  const border = source.border || `${primary}33`;
  return { background, text: text10, primary, accent, surface: surface4, panel: panel3, muted, border };
}
function role30(roleName, spec, fallback2 = {}) {
  return fontRole(roleName, spec, fallback2);
}
function text8(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function list4(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const value15 = spec.content?.[key];
    if (Array.isArray(value15)) {
      const cleaned = value15.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
      if (cleaned.length) return cleaned;
    }
  }
  return fallback2;
}
function normalizedVariant(spec) {
  const raw = `${spec.page_variant_id || ""} ${spec.page_role || ""}`.toLowerCase().replace(/[-/]/g, "_");
  if (raw.includes("cover") || raw.includes("hero") || raw.includes("title")) return "cover";
  if (raw.includes("agenda") || raw.includes("chapter") || raw.includes("toc") || raw.includes("outline")) return "agenda";
  if (raw.includes("split") || raw.includes("compare") || raw.includes("comparison") || raw.includes("matrix")) return "split";
  if (raw.includes("quote") || raw.includes("emphasis") || raw.includes("manifesto") || raw.includes("statement")) return "quote";
  if (raw.includes("timeline") || raw.includes("process") || raw.includes("flow") || raw.includes("roadmap")) return "timeline";
  if (raw.includes("closing") || raw.includes("close") || raw.includes("end") || raw.includes("summary")) return "closing";
  if (raw.includes("chart") || raw.includes("data") || raw.includes("metric") || raw.includes("dashboard") || raw.includes("stat") || raw.includes("list")) return "data";
  if (raw.includes("detail") || raw.includes("content") || raw.includes("case")) return "detail";
  return "detail";
}
function shell(spec, variant, children = []) {
  const theme8 = colors22(spec);
  const family = String(spec.family_id || spec.page_family_source?.family_id || spec.template_id || "beautiful");
  return box(
    {
      width: 960,
      height: 540,
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme8.background,
      color: theme8.text
    },
    [
      box({ position: "absolute", left: 0, top: 0, width: 960, height: 540, backgroundColor: theme8.background }),
      box({ position: "absolute", left: 34, top: 28, width: 72, height: 3, backgroundColor: theme8.accent }),
      TextBlock(family.toUpperCase(), {
        position: "absolute",
        left: 34,
        bottom: 24,
        color: theme8.muted,
        fontSize: 8,
        letterSpacing: 1.2,
        ...role30("label", spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
      }),
      TextBlock(String(variant || "").toUpperCase(), {
        position: "absolute",
        right: 38,
        top: 28,
        color: theme8.accent,
        fontSize: 9,
        letterSpacing: 1.3,
        ...role30("label", spec, { fontSize: 9, lineHeight: 1, fontWeight: 700 })
      }),
      ...children
    ]
  );
}
function titleText(spec) {
  return text8(spec, "title", `${spec.family_id || "Beautiful"}
${spec.page_variant_id || "Page"}`);
}
function subtitleText(spec) {
  return text8(spec, "subtitle", "Review-only page-family renderer for visual inspection.");
}
function renderCover27(spec) {
  const theme8 = colors22(spec);
  return shell(spec, "cover", [
    box({ position: "absolute", right: -92, top: -80, width: 360, height: 700, backgroundColor: theme8.accent, opacity: 0.16, transform: "skewX(-12deg)" }),
    box({ position: "absolute", left: 92, top: 155, width: 48, height: 2, backgroundColor: theme8.accent }),
    TextBlock("OPENING", { position: "absolute", left: 92, top: 124, color: theme8.accent, letterSpacing: 1.4, ...role30("label", spec, { fontSize: 10, lineHeight: 1, fontWeight: 700 }) }),
    Title(titleText(spec), { position: "absolute", left: 90, top: 172, width: 530, color: theme8.text, ...role30("display", spec, { fontSize: 42, lineHeight: 1.04, fontWeight: 800 }) }),
    TextBlock(subtitleText(spec), { position: "absolute", left: 92, top: 304, width: 420, color: theme8.muted, ...role30("body", spec, { fontSize: 13, lineHeight: 1.35 }) }),
    TextBlock(String(spec.review_only_current_deck_render?.page || "").padStart(2, "0"), { position: "absolute", right: 86, bottom: 48, color: theme8.accent, opacity: 0.28, ...role30("metric", spec, { fontSize: 92, lineHeight: 0.9, fontWeight: 900 }) })
  ]);
}
function renderAgenda10(spec) {
  const theme8 = colors22(spec);
  const items = list4(spec, ["agenda", "points", "bullets", "principles"], ["Context", "Signals", "Decisions", "Next actions"]).slice(0, 5);
  return shell(spec, "agenda", [
    Title(titleText(spec), { position: "absolute", left: 58, top: 78, width: 420, color: theme8.text, ...role30("display", spec, { fontSize: 34, lineHeight: 1.05, fontWeight: 800 }) }),
    box(
      { position: "absolute", right: 60, top: 70, width: 390, minHeight: 372, backgroundColor: theme8.surface, border: `1px solid ${theme8.border}`, padding: 28, flexDirection: "column" },
      items.map(
        (item, index) => box({ height: 62, borderBottom: index === items.length - 1 ? "0px solid transparent" : `1px solid ${theme8.border}`, flexDirection: "row", alignItems: "center" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { width: 52, color: theme8.accent, ...role30("label", spec, { fontSize: 13, fontWeight: 900, lineHeight: 1 }) }),
          TextBlock(item, { width: 270, color: theme8.text, ...role30("body", spec, { fontSize: 17, lineHeight: 1.16, fontWeight: 700 }) })
        ])
      )
    )
  ]);
}
function renderData6(spec) {
  const theme8 = colors22(spec);
  const metrics = list4(spec, ["metrics", "bars", "bullets", "principles"], ["01 Momentum", "02 Quality", "03 Conversion", "04 Retention"]).slice(0, 4);
  return shell(spec, "data", [
    TextBlock("DATA BOARD", { position: "absolute", left: 58, top: 58, color: theme8.accent, letterSpacing: 1.2, ...role30("label", spec, { fontSize: 10, fontWeight: 700 }) }),
    Title(titleText(spec), { position: "absolute", left: 58, top: 86, width: 610, color: theme8.text, ...role30("display", spec, { fontSize: 32, lineHeight: 1.06, fontWeight: 800 }) }),
    box(
      { position: "absolute", left: 58, top: 214, width: 842, height: 216, flexDirection: "row", gap: 16 },
      metrics.map(
        (item, index) => box({ width: 198, height: 198, backgroundColor: index === 0 ? theme8.primary : theme8.surface, border: `1px solid ${index === 0 ? theme8.primary : theme8.border}`, padding: 18, flexDirection: "column", justifyContent: "space-between" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { color: index === 0 ? theme8.background : theme8.accent, ...role30("label", spec, { fontSize: 12, fontWeight: 900 }) }),
          TextBlock(String(item).split(" ")[0], { color: index === 0 ? theme8.background : theme8.text, ...role30("metric", spec, { fontSize: 34, lineHeight: 0.92, fontWeight: 900 }) }),
          box({ width: 132 + index * 12, height: 7, backgroundColor: index === 0 ? theme8.background : theme8.accent, opacity: 0.78 }),
          TextBlock(String(item).split(" ").slice(1).join(" ") || "metric", { color: index === 0 ? theme8.background : theme8.muted, ...role30("label", spec, { fontSize: 10, lineHeight: 1.2 }) })
        ])
      )
    )
  ]);
}
function renderSplit10(spec) {
  const theme8 = colors22(spec);
  const points = list4(spec, ["bullets", "points", "principles"], ["Current observation", "Design implication", "Renderer action"]).slice(0, 3);
  const panel3 = (title2, x, inverted = false) => box({ position: "absolute", left: x, top: 160, width: 390, height: 260, backgroundColor: inverted ? theme8.primary : theme8.surface, border: `1px solid ${theme8.border}`, padding: 26, flexDirection: "column" }, [
    TextBlock(title2, { color: inverted ? theme8.background : theme8.accent, letterSpacing: 1.2, ...role30("label", spec, { fontSize: 10, fontWeight: 800 }) }),
    ...points.map(
      (item, index) => box({ marginTop: 22, flexDirection: "row" }, [
        box({ width: 7, height: 7, marginTop: 6, marginRight: 12, backgroundColor: inverted ? theme8.background : theme8.accent }),
        TextBlock(index === 0 ? item : `${item} ${index + 1}`, { width: 286, color: inverted ? theme8.background : theme8.text, ...role30("body", spec, { fontSize: 15, lineHeight: 1.25 }) })
      ])
    )
  ]);
  return shell(spec, "split", [
    Title(titleText(spec), { position: "absolute", left: 58, top: 64, width: 650, color: theme8.text, ...role30("display", spec, { fontSize: 34, lineHeight: 1.04, fontWeight: 800 }) }),
    panel3("LEFT TRACK", 58, false),
    panel3("RIGHT TRACK", 512, true)
  ]);
}
function renderQuote24(spec) {
  const theme8 = colors22(spec);
  return shell(spec, "quote", [
    TextBlock("\u201C", { position: "absolute", left: 70, top: 58, color: theme8.accent, opacity: 0.18, ...role30("display", spec, { fontSize: 168, lineHeight: 0.8, fontWeight: 900 }) }),
    Title(text8(spec, "quote", titleText(spec)), { position: "absolute", left: 132, top: 136, width: 650, color: theme8.text, ...role30("display", spec, { fontSize: 34, lineHeight: 1.08, fontWeight: 800 }) }),
    TextBlock(text8(spec, "author", "Review-only evidence page"), { position: "absolute", left: 136, top: 354, color: theme8.accent, letterSpacing: 1.4, ...role30("label", spec, { fontSize: 11, fontWeight: 700 }) }),
    box({ position: "absolute", right: 72, top: 86, width: 86, height: 346, border: `2px solid ${theme8.accent}` })
  ]);
}
function renderTimeline13(spec) {
  const theme8 = colors22(spec);
  const steps = list4(spec, ["timeline", "bullets", "principles"], ["Discover", "Shape", "Build", "Review", "Scale"]).slice(0, 5);
  return shell(spec, "timeline", [
    Title(titleText(spec), { position: "absolute", left: 58, top: 68, width: 620, color: theme8.text, ...role30("display", spec, { fontSize: 34, lineHeight: 1.05, fontWeight: 800 }) }),
    box({ position: "absolute", left: 94, top: 286, width: 760, height: 3, backgroundColor: theme8.border }),
    ...steps.map(
      (item, index) => box({ position: "absolute", left: 76 + index * 172, top: 220, width: 132, height: 132, flexDirection: "column", alignItems: "flex-start" }, [
        box({ width: 34, height: 34, borderRadius: 17, backgroundColor: theme8.accent, marginBottom: 18 }),
        TextBlock(String(index + 1).padStart(2, "0"), { color: theme8.accent, marginBottom: 10, ...role30("label", spec, { fontSize: 12, fontWeight: 900, lineHeight: 1 }) }),
        TextBlock(item, { width: 126, color: theme8.text, ...role30("body", spec, { fontSize: 13, lineHeight: 1.18, fontWeight: 700 }) })
      ])
    )
  ]);
}
function renderDetail3(spec) {
  const theme8 = colors22(spec);
  const points = list4(spec, ["details", "bullets", "principles"], ["Source layout contract", "Current renderer behavior", "Review decision note"]).slice(0, 3);
  return shell(spec, "detail", [
    box({ position: "absolute", left: 56, top: 66, width: 848, height: 382, backgroundColor: theme8.surface, border: `1px solid ${theme8.border}` }),
    TextBlock("DETAIL", { position: "absolute", left: 94, top: 104, color: theme8.accent, letterSpacing: 1.2, ...role30("label", spec, { fontSize: 10, fontWeight: 800 }) }),
    Title(titleText(spec), { position: "absolute", left: 94, top: 134, width: 330, color: theme8.text, ...role30("display", spec, { fontSize: 31, lineHeight: 1.06, fontWeight: 800 }) }),
    box(
      { position: "absolute", left: 490, top: 104, width: 346, height: 298, flexDirection: "column", gap: 18 },
      points.map(
        (item, index) => box({ minHeight: 76, borderBottom: `1px solid ${theme8.border}`, flexDirection: "row" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { width: 44, color: theme8.accent, ...role30("label", spec, { fontSize: 13, fontWeight: 900 }) }),
          TextBlock(item, { width: 282, color: theme8.text, ...role30("body", spec, { fontSize: 15, lineHeight: 1.3 }) })
        ])
      )
    )
  ]);
}
function renderClosing15(spec) {
  const theme8 = colors22(spec);
  const items = list4(spec, ["takeaways", "bullets", "principles"], ["Keep", "Fix", "Promote only after fidelity"]).slice(0, 3);
  return shell(spec, "closing", [
    box({ position: "absolute", left: 70, top: 84, width: 820, height: 286, backgroundColor: theme8.primary, padding: 42, flexDirection: "column", justifyContent: "center" }, [
      TextBlock("CLOSING", { color: theme8.background, opacity: 0.78, marginBottom: 20, letterSpacing: 1.3, ...role30("label", spec, { fontSize: 10, fontWeight: 800 }) }),
      Title(titleText(spec), { width: 620, color: theme8.background, ...role30("display", spec, { fontSize: 40, lineHeight: 1, fontWeight: 800 }) })
    ]),
    box(
      { position: "absolute", left: 104, top: 400, width: 752, height: 66, flexDirection: "row", gap: 22 },
      items.map(
        (item, index) => box({ width: 230, flexDirection: "row" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { width: 34, color: theme8.accent, ...role30("label", spec, { fontSize: 12, fontWeight: 900 }) }),
          TextBlock(item, { width: 176, color: theme8.text, ...role30("body", spec, { fontSize: 13, lineHeight: 1.22, fontWeight: 700 }) })
        ])
      )
    )
  ]);
}
function renderReviewOnlyPageFamilyVariant(spec) {
  switch (normalizedVariant(spec)) {
    case "cover":
      return renderCover27(spec);
    case "agenda":
      return renderAgenda10(spec);
    case "data":
      return renderData6(spec);
    case "split":
      return renderSplit10(spec);
    case "quote":
      return renderQuote24(spec);
    case "timeline":
      return renderTimeline13(spec);
    case "closing":
      return renderClosing15(spec);
    default:
      return renderDetail3(spec);
  }
}

// templates/beautiful/index.mjs
var DEDICATED_RENDERERS = /* @__PURE__ */ new Map([
  [
    rendererContract.template_id,
    {
      contract: rendererContract,
      render: renderExecutiveDashboard
    }
  ],
  [
    rendererContract2.template_id,
    {
      contract: rendererContract2,
      render: renderIntelligenceBrief
    }
  ],
  [
    rendererContract3.template_id,
    {
      contract: rendererContract3,
      render: renderPosterStatPunch
    }
  ],
  [
    rendererContract4.template_id,
    {
      contract: rendererContract4,
      render: renderCoralMagazineFeature
    }
  ],
  [
    rendererContract5.template_id,
    {
      contract: rendererContract5,
      render: renderSoftEditorialFeature
    }
  ],
  [
    rendererContract6.template_id,
    {
      contract: rendererContract6,
      render: renderTritoneEditorialSpread
    }
  ],
  [
    rendererContract7.template_id,
    {
      contract: rendererContract7,
      render: renderPixelOrbitConsole
    }
  ],
  [
    rendererContract8.template_id,
    {
      contract: rendererContract8,
      render: renderBiennaleProgrammePoster
    }
  ],
  [
    rendererContract9.template_id,
    {
      contract: rendererContract9,
      render: renderBlockFrameGrid
    }
  ],
  [
    rendererContract10.template_id,
    {
      contract: rendererContract10,
      render: renderBroadsideEditorialQuote
    }
  ],
  [
    rendererContract11.template_id,
    {
      contract: rendererContract11,
      render: renderCartesianArchitecturalSpec
    }
  ],
  [
    rendererContract12.template_id,
    {
      contract: rendererContract12,
      render: renderLongTablePrintedProgram
    }
  ],
  [
    rendererContract13.template_id,
    {
      contract: rendererContract13,
      render: renderMonochromeLedgerBriefing
    }
  ],
  [
    rendererContract14.template_id,
    {
      contract: rendererContract14,
      render: renderCapsuleCardSystem
    }
  ],
  [
    rendererContract15.template_id,
    {
      contract: rendererContract15,
      render: renderCreativeModeGrid
    }
  ],
  [
    rendererContract16.template_id,
    {
      contract: rendererContract16,
      render: renderDaisyWorkshopPlaybook
    }
  ],
  [
    rendererContract17.template_id,
    {
      contract: rendererContract17,
      render: renderEmeraldEditorialCover
    }
  ],
  [
    rendererContract18.template_id,
    {
      contract: rendererContract18,
      render: renderTrendGridReport
    }
  ],
  [
    rendererContract19.template_id,
    {
      contract: rendererContract19,
      render: renderProductRibbon
    }
  ],
  [
    rendererContract20.template_id,
    {
      contract: rendererContract20,
      render: renderBrutalistMatrix
    }
  ],
  [
    rendererContract21.template_id,
    {
      contract: rendererContract21,
      render: renderTypeMassPoster
    }
  ],
  [
    rendererContract22.template_id,
    {
      contract: rendererContract22,
      render: renderSerifStatEditorial
    }
  ],
  [
    rendererContract23.template_id,
    {
      contract: rendererContract23,
      render: renderGroveOrganicBrief
    }
  ],
  [
    rendererContract24.template_id,
    {
      contract: rendererContract24,
      render: renderMatMidcenturyBoard
    }
  ],
  [
    rendererContract25.template_id,
    {
      contract: rendererContract25,
      render: renderDensePanelGrid
    }
  ],
  [
    rendererContract26.template_id,
    {
      contract: rendererContract26,
      render: renderPeoplePlatformManifesto
    }
  ],
  [
    rendererContract27.template_id,
    {
      contract: rendererContract27,
      render: renderAnnotatedFieldBoard
    }
  ],
  [
    rendererContract28.template_id,
    {
      contract: rendererContract28,
      render: renderPinkNocturneFeature
    }
  ],
  [
    rendererContract29.template_id,
    {
      contract: rendererContract29,
      render: renderPlayfulIndieLaunch
    }
  ],
  [
    rendererContract30.template_id,
    {
      contract: rendererContract30,
      render: renderRetroUiDashboard
    }
  ],
  [
    rendererContract31.template_id,
    {
      contract: rendererContract31,
      render: renderRetroZineSpread
    }
  ],
  [
    rendererContract32.template_id,
    {
      contract: rendererContract32,
      render: renderStickyWorkshopBoard
    }
  ],
  [
    rendererContract33.template_id,
    {
      contract: rendererContract33,
      render: renderStencilFieldManual
    }
  ],
  [
    rendererContract34.template_id,
    {
      contract: rendererContract34,
      render: renderVellumScholarBrief
    }
  ]
]);
var EVALUATION_RENDERERS = new Map(
  evaluationTemplateIds.map((templateId35) => [
    templateId35,
    {
      contract: evaluationRendererContract(templateId35),
      render: renderEvaluationBeautifulStub
    }
  ])
);
function productionLike(spec = {}) {
  return spec.template_status === "production" || spec.selection_scope === "production" || spec.asset_status === "production";
}
function renderBeautifulTemplate(spec = {}) {
  const templateId35 = spec.template_id;
  const dedicated = DEDICATED_RENDERERS.get(templateId35);
  if (dedicated) {
    if (spec.review_only_current_deck_render?.degraded && dedicated.contract?.renderer_stage === "dedicated_sample") {
      return renderReviewOnlyPageFamilyVariant(spec);
    }
    return dedicated.render(spec);
  }
  const evaluation = EVALUATION_RENDERERS.get(templateId35);
  if (evaluation) {
    return evaluation.render(spec, evaluation.contract);
  }
  if (productionLike(spec)) {
    throw new Error(`missing dedicated beautiful renderer for production template_id: ${templateId35}`);
  }
  return null;
}

// templates/p0-templates.mjs
var CANVAS21 = { width: 960, height: 540 };
var DEFAULT_FONT_FAMILY = "SVGlideDefault";
function colors23(spec) {
  const source = spec.theme?.colors || {};
  return {
    background: source.background || "#0F172A",
    panel: source.panel || "#111827",
    primary: source.primary || "#38BDF8",
    accent: source.accent || "#A78BFA",
    text: source.text || "#F8FAFC",
    muted: source.muted || "#CBD5E1",
    surface: source.surface || source.panel || "#111827"
  };
}
function text9(spec, key, fallback2 = "") {
  const value15 = spec.content?.[key];
  return typeof value15 === "string" && value15.trim() ? value15.trim() : fallback2;
}
function list5(spec, key) {
  const value15 = spec.content?.[key];
  return Array.isArray(value15) ? value15.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()) : [];
}
function firstList(spec, keys, fallback2 = []) {
  for (const key of keys) {
    const values = list5(spec, key);
    if (values.length) return values;
  }
  return fallback2;
}
function themeSize(spec, key, fallback2) {
  const value15 = spec.theme?.typography?.[key];
  return typeof value15 === "number" ? value15 : fallback2;
}
function pageShell(spec, children) {
  const theme8 = colors23(spec);
  return box(
    {
      width: CANVAS21.width,
      height: CANVAS21.height,
      position: "relative",
      flexDirection: "column",
      backgroundColor: theme8.background,
      color: theme8.text,
      fontFamily: DEFAULT_FONT_FAMILY,
      padding: 56
    },
    children
  );
}
function pageHeader(spec, { titleWidth = 720, titleSize = null, subtitleKey = "subtitle" } = {}) {
  const theme8 = colors23(spec);
  return box({ flexDirection: "column", marginBottom: 28 }, [
    Badge(text9(spec, "eyebrow", "").toUpperCase(), {
      color: theme8.primary,
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 12
    }),
    Title(text9(spec, "title", "Untitled"), {
      width: titleWidth,
      color: theme8.text,
      fontSize: titleSize || themeSize(spec, "title", 42),
      fontWeight: 850,
      lineHeight: 1.08,
      marginBottom: 14
    }),
    Subtitle(text9(spec, subtitleKey, ""), {
      width: Math.min(titleWidth, 700),
      color: theme8.muted,
      fontSize: themeSize(spec, "subtitle", 21),
      lineHeight: 1.22
    })
  ]);
}
function numberedRows(items, theme8, { start = 1, max = 6 } = {}) {
  return items.slice(0, max).map(
    (item, index) => box(
      {
        width: "100%",
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: theme8.panel,
        padding: "11px 14px"
      },
      [
        TextBlock(String(index + start).padStart(2, "0"), {
          width: 48,
          color: theme8.primary,
          fontSize: 18,
          fontWeight: 850
        }),
        TextBlock(item, {
          flex: 1,
          color: theme8.text,
          fontSize: 20,
          fontWeight: 650,
          lineHeight: 1.15
        })
      ]
    )
  );
}
function smallCard(label28, value15, theme8, style = {}) {
  return box(
    {
      width: 184,
      minHeight: 112,
      flexDirection: "column",
      backgroundColor: theme8.panel,
      padding: 18,
      ...style
    },
    [
      TextBlock(label28, { color: theme8.muted, fontSize: 15, fontWeight: 700, marginBottom: 14 }),
      TextBlock(value15, { color: theme8.text, fontSize: 25, fontWeight: 850, lineHeight: 1.05 })
    ]
  );
}
function coverHero(spec) {
  const theme8 = colors23(spec);
  const chips = list5(spec, "chips").slice(0, 4);
  return box(
    {
      width: CANVAS21.width,
      height: CANVAS21.height,
      position: "relative",
      flexDirection: "column",
      backgroundColor: theme8.background,
      color: theme8.text,
      fontFamily: DEFAULT_FONT_FAMILY,
      padding: 72
    },
    [
      box({
        position: "absolute",
        left: 724,
        top: 36,
        width: 192,
        height: 192,
        borderRadius: 96,
        backgroundColor: theme8.accent,
        opacity: 0.28
      }),
      box({
        width: 704,
        minHeight: 356,
        flexDirection: "column",
        backgroundColor: theme8.panel,
        opacity: 0.96,
        padding: 28
      }, [
        Badge(text9(spec, "eyebrow", "SVGLIDE ARTBOARD"), {
          color: theme8.primary,
          marginBottom: 18
        }),
        Title(text9(spec, "title", "Untitled"), {
          color: theme8.text,
          fontSize: 58,
          fontWeight: 800,
          lineHeight: 1.05,
          marginBottom: 20
        }),
        Subtitle(text9(spec, "subtitle", ""), {
          color: theme8.muted,
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1.25
        })
      ]),
      box(
        {
          position: "absolute",
          left: 84,
          top: 444,
          flexDirection: "row",
          gap: 14
        },
        chips.map(
          (chip) => Chip(chip, {
            backgroundColor: theme8.primary,
            color: theme8.text,
            opacity: 0.86
          })
        )
      )
    ]
  );
}
function comparisonCards(spec) {
  const theme8 = colors23(spec);
  const leftPoints = list5(spec, "left_points").slice(0, 3);
  const rightPoints = list5(spec, "right_points").slice(0, 3);
  const point = (value15, color) => box({ flexDirection: "row", alignItems: "center", marginBottom: 18 }, [
    box({ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 14 }),
    TextBlock(value15, { color: theme8.muted, fontSize: 20, fontWeight: 500, lineHeight: 1.2 })
  ]);
  return box(
    {
      width: CANVAS21.width,
      height: CANVAS21.height,
      position: "relative",
      flexDirection: "column",
      backgroundColor: theme8.background,
      color: theme8.text,
      fontFamily: DEFAULT_FONT_FAMILY,
      padding: "52px 64px"
    },
    [
      Title(text9(spec, "title", "Comparison"), { color: theme8.text, fontSize: 40, lineHeight: 1.1, marginBottom: 44 }),
      box({ flexDirection: "row", gap: 52 }, [
        box({ width: 390, height: 250, flexDirection: "column", backgroundColor: theme8.panel, padding: 28 }, [
          Title(text9(spec, "left_title", "Before"), { color: theme8.primary, fontSize: 24, lineHeight: 1.1, marginBottom: 28 }),
          ...leftPoints.map((item) => point(item, theme8.primary))
        ]),
        box({ width: 390, height: 250, flexDirection: "column", backgroundColor: theme8.panel, padding: 28 }, [
          Title(text9(spec, "right_title", "After"), { color: theme8.accent, fontSize: 24, lineHeight: 1.1, marginBottom: 28 }),
          ...rightPoints.map((item) => point(item, theme8.accent))
        ])
      ]),
      TextBlock(text9(spec, "conclusion", ""), {
        position: "absolute",
        left: 64,
        top: 414,
        width: 832,
        height: 66,
        padding: "20px 22px",
        backgroundColor: theme8.primary,
        color: theme8.text,
        opacity: 0.88,
        fontSize: 22,
        fontWeight: 700
      })
    ]
  );
}
function summaryFinal(spec) {
  const theme8 = colors23(spec);
  const takeaways = list5(spec, "takeaways").slice(0, 3);
  return box(
    {
      width: CANVAS21.width,
      height: CANVAS21.height,
      position: "relative",
      flexDirection: "column",
      backgroundColor: theme8.background,
      color: theme8.text,
      fontFamily: DEFAULT_FONT_FAMILY,
      padding: "64px 72px"
    },
    [
      box({ position: "absolute", left: 704, top: 54, width: 164, height: 164, borderRadius: 82, backgroundColor: theme8.accent, opacity: 0.22 }),
      box({ position: "absolute", left: 712, top: 286, flexDirection: "row", alignItems: "flex-end", gap: 12 }, [
        box({ width: 18, height: 30, backgroundColor: theme8.primary, opacity: 0.72 }),
        box({ width: 18, height: 48, backgroundColor: theme8.primary, opacity: 0.86 }),
        box({ width: 18, height: 66, backgroundColor: theme8.accent, opacity: 0.92 })
      ]),
      Badge(text9(spec, "eyebrow", "SUMMARY"), { color: theme8.primary, fontSize: 18, fontWeight: 800, marginBottom: 24 }),
      Title(text9(spec, "title", "Summary"), { width: 700, color: theme8.text, fontSize: 50, fontWeight: 850, lineHeight: 1.08, marginBottom: 24 }),
      Subtitle(text9(spec, "subtitle", ""), { width: 640, color: theme8.muted, fontSize: 23, marginBottom: 34 }),
      box(
        { flexDirection: "row", gap: 18 },
        takeaways.map(
          (item, index) => StatCard({
            index: index + 1,
            label: item,
            color: theme8.primary,
            textColor: theme8.text,
            panelColor: theme8.panel
          })
        )
      )
    ]
  );
}
function sectionTitle(spec) {
  const theme8 = colors23(spec);
  return pageShell(spec, [
    box({ position: "absolute", left: 72, top: 116, width: 8, height: 258, backgroundColor: theme8.primary }),
    box({ position: "absolute", left: 734, top: 74, width: 148, height: 148, backgroundColor: theme8.accent, opacity: 0.2 }),
    box({ position: "absolute", left: 734, top: 242, width: 148, height: 12, backgroundColor: theme8.primary }),
    box({ marginLeft: 52, marginTop: 64 }, [pageHeader(spec, { titleWidth: 690, titleSize: 56 })])
  ]);
}
function agendaList(spec) {
  const theme8 = colors23(spec);
  const items = firstList(spec, ["items", "takeaways"], ["Context", "Evidence", "Decision"]).slice(0, 6);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 760, titleSize: 42 }),
    box({ width: 724, flexDirection: "column" }, numberedRows(items, theme8, { max: 6 })),
    box({ position: "absolute", right: 56, top: 126, width: 112, height: 310, backgroundColor: theme8.primary, opacity: 0.12 })
  ]);
}
function timelineSteps2(spec) {
  const theme8 = colors23(spec);
  const events = firstList(spec, ["events", "steps", "items"], ["Discover", "Design", "Deliver", "Measure"]).slice(0, 5);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 760, titleSize: 40 }),
    box({ position: "absolute", left: 110, top: 330, width: 740, height: 4, backgroundColor: theme8.primary, opacity: 0.55 }),
    box(
      { position: "absolute", left: 96, top: 254, flexDirection: "row", gap: 22 },
      events.map(
        (event, index) => box({ width: 130, flexDirection: "column", alignItems: "center" }, [
          TextBlock(String(index + 1).padStart(2, "0"), {
            width: 52,
            height: 52,
            color: theme8.text,
            backgroundColor: index % 2 ? theme8.accent : theme8.primary,
            fontSize: 20,
            fontWeight: 850,
            padding: "14px 0",
            textAlign: "center",
            marginBottom: 18
          }),
          TextBlock(event, { color: theme8.text, fontSize: 18, fontWeight: 700, textAlign: "center", lineHeight: 1.18 })
        ])
      )
    )
  ]);
}
function processFlow(spec) {
  const theme8 = colors23(spec);
  const steps = firstList(spec, ["steps", "items"], ["Input", "Normalize", "Render", "Verify"]).slice(0, 5);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 730, titleSize: 40 }),
    box(
      { flexDirection: "row", gap: 18, marginTop: 26 },
      steps.map(
        (step, index) => box({ width: 154, height: 172, flexDirection: "column", backgroundColor: theme8.panel, padding: 18 }, [
          TextBlock(String(index + 1), { color: theme8.primary, fontSize: 28, fontWeight: 900, marginBottom: 20 }),
          TextBlock(step, { color: theme8.text, fontSize: 21, fontWeight: 750, lineHeight: 1.15 }),
          box({ width: 48, height: 5, backgroundColor: index % 2 ? theme8.accent : theme8.primary, marginTop: "auto" })
        ])
      )
    ),
    TextBlock(text9(spec, "conclusion", ""), {
      position: "absolute",
      left: 74,
      bottom: 50,
      width: 812,
      minHeight: 48,
      color: theme8.text,
      backgroundColor: theme8.primary,
      opacity: 0.18,
      fontSize: 20,
      fontWeight: 750,
      padding: 14
    })
  ]);
}
function metricDashboard(spec) {
  const theme8 = colors23(spec);
  const metrics = firstList(spec, ["metrics", "items"], ["Velocity +32%", "Cost -18%", "Quality 96%", "Reach 4.2x"]).slice(0, 6);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 710, titleSize: 38 }),
    box(
      { flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 6 },
      metrics.map((metric19, index) => smallCard(`METRIC ${index + 1}`, metric19, theme8))
    )
  ]);
}
function quoteFocus(spec) {
  const theme8 = colors23(spec);
  return pageShell(spec, [
    TextBlock("\u201C", { position: "absolute", left: 60, top: 36, color: theme8.primary, fontSize: 132, fontWeight: 900, opacity: 0.7 }),
    TextBlock(text9(spec, "quote", text9(spec, "title", "A strong point belongs on a quiet page.")), {
      width: 720,
      marginTop: 116,
      marginLeft: 72,
      color: theme8.text,
      fontSize: 42,
      fontWeight: 850,
      lineHeight: 1.13
    }),
    TextBlock(text9(spec, "attribution", ""), {
      marginLeft: 76,
      marginTop: 34,
      color: theme8.muted,
      fontSize: 22,
      fontWeight: 700
    }),
    box({ position: "absolute", right: 80, bottom: 72, width: 150, height: 10, backgroundColor: theme8.accent })
  ]);
}
function imageFeature(spec) {
  const theme8 = colors23(spec);
  const points = firstList(spec, ["points", "items"], ["Primary visual anchor", "Caption explains evidence", "Text stays out of the image"]).slice(0, 3);
  return pageShell(spec, [
    box({ position: "absolute", left: 56, top: 56, width: 452, height: 428, backgroundColor: theme8.panel }),
    box({ position: "absolute", left: 86, top: 86, width: 392, height: 268, backgroundColor: theme8.primary, opacity: 0.18 }),
    TextBlock(text9(spec, "image_label", "IMAGE"), { position: "absolute", left: 226, top: 204, color: theme8.primary, fontSize: 28, fontWeight: 900 }),
    TextBlock(text9(spec, "caption", ""), { position: "absolute", left: 86, top: 386, width: 388, color: theme8.muted, fontSize: 19, fontWeight: 650 }),
    box({ position: "absolute", left: 548, top: 72, width: 330 }, [pageHeader(spec, { titleWidth: 330, titleSize: 38 })]),
    box({ position: "absolute", left: 552, top: 280, width: 324, flexDirection: "column" }, numberedRows(points, theme8, { max: 3 }))
  ]);
}
function researchPoster(spec) {
  const theme8 = colors23(spec);
  const sections = firstList(spec, ["sections", "items"], ["Context", "Method", "Result", "Implication"]).slice(0, 6);
  return pageShell(spec, [
    box({ position: "absolute", left: 56, top: 42, width: 588 }, [pageHeader(spec, { titleWidth: 588, titleSize: 34, subtitleKey: "authors" })]),
    box({ position: "absolute", right: 70, top: 54, width: 140, height: 96, backgroundColor: theme8.primary, opacity: 0.18 }),
    box(
      { position: "absolute", left: 58, top: 194, flexDirection: "row", gap: 20 },
      [0, 1, 2].map(
        (column) => box(
          { width: 268, flexDirection: "column", gap: 14 },
          sections.slice(column * 2, column * 2 + 2).map(
            (section, index) => box({ height: 120, flexDirection: "column", backgroundColor: theme8.panel, padding: 16 }, [
              TextBlock(section, { color: theme8.primary, fontSize: 20, fontWeight: 850, marginBottom: 12 }),
              TextBlock(column === 1 && index === 0 ? text9(spec, "key_visual", "key visual") : "Evidence block", {
                color: theme8.muted,
                fontSize: 17,
                fontWeight: 600
              })
            ])
          )
        )
      )
    )
  ]);
}
function dataStory(spec) {
  const theme8 = colors23(spec);
  const metrics = firstList(spec, ["metrics", "items"], ["North 42", "South 35", "West 28", "East 19"]).slice(0, 4);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 600, titleSize: 38 }),
    box({ position: "absolute", left: 86, top: 260, flexDirection: "row", alignItems: "flex-end", gap: 34 }, metrics.map(
      (metric19, index) => box({ width: 112, flexDirection: "column", alignItems: "center" }, [
        box({ width: 64, height: 82 + index * 28, backgroundColor: index % 2 ? theme8.accent : theme8.primary, marginBottom: 18 }),
        TextBlock(metric19, { color: theme8.text, fontSize: 18, fontWeight: 750, textAlign: "center" })
      ])
    )),
    TextBlock(text9(spec, "callout", ""), { position: "absolute", right: 72, top: 184, width: 260, color: theme8.text, backgroundColor: theme8.panel, fontSize: 24, fontWeight: 850, lineHeight: 1.14, padding: 22 })
  ]);
}
function riskAlert(spec) {
  const theme8 = colors23(spec);
  const risks = firstList(spec, ["risks", "items"], ["Scope drift", "Dependency delay", "Insufficient evidence"]).slice(0, 4);
  return pageShell(spec, [
    TextBlock(text9(spec, "severity", "L2"), { position: "absolute", right: 70, top: 54, color: theme8.text, backgroundColor: theme8.primary, fontSize: 28, fontWeight: 900, padding: "14px 22px" }),
    pageHeader(spec, { titleWidth: 690, titleSize: 40 }),
    box({ width: 800, flexDirection: "column", marginTop: 16 }, risks.map(
      (risk, index) => box({ height: 58, flexDirection: "row", alignItems: "center", backgroundColor: theme8.panel, marginBottom: 14, padding: 16 }, [
        box({ width: 12, height: 34, backgroundColor: index === 0 ? theme8.accent : theme8.primary, marginRight: 16 }),
        TextBlock(risk, { color: theme8.text, fontSize: 22, fontWeight: 760 })
      ])
    )),
    TextBlock(text9(spec, "summary", ""), { color: theme8.muted, fontSize: 18, fontWeight: 650, marginTop: 6 })
  ]);
}
function roadmapLanes(spec) {
  const theme8 = colors23(spec);
  const lanes = firstList(spec, ["lanes", "items"], ["Now", "Next", "Later"]).slice(0, 4);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 700, titleSize: 38 }),
    box({ flexDirection: "column", gap: 16, marginTop: 16 }, lanes.map(
      (lane, index) => box({ width: 820, height: 62, flexDirection: "row", alignItems: "center", backgroundColor: theme8.panel, padding: "0 18px" }, [
        TextBlock(lane, { width: 132, color: theme8.primary, fontSize: 21, fontWeight: 850 }),
        box({ flex: 1, height: 12, backgroundColor: index % 2 ? theme8.accent : theme8.primary, opacity: 0.38 }),
        TextBlock(`Q${index + 1}`, { width: 54, color: theme8.text, fontSize: 18, fontWeight: 800, textAlign: "right" })
      ])
    ))
  ]);
}
function architectureBlueprint(spec) {
  const theme8 = colors23(spec);
  const nodes = firstList(spec, ["nodes", "items"], ["Planner", "CanvasSpec", "Renderer", "SVGlide"]).slice(0, 6);
  return pageShell(spec, [
    pageHeader(spec, { titleWidth: 630, titleSize: 36 }),
    box(
      { position: "absolute", left: 86, top: 240, flexDirection: "row", flexWrap: "wrap", gap: 24, width: 780 },
      nodes.map(
        (item, index) => box({ width: 236, height: 72, backgroundColor: theme8.panel, borderWidth: 2, borderColor: index % 2 ? theme8.accent : theme8.primary, padding: 16 }, [
          TextBlock(item, { color: theme8.text, fontSize: 20, fontWeight: 800 })
        ])
      )
    )
  ]);
}
function densePanelGrid(spec) {
  const theme8 = colors23(spec);
  const metrics = firstList(spec, ["metrics", "items"], ["Coverage 92", "Latency -18%", "Risk L2", "Quality 4.6"]).slice(0, 6);
  const notes2 = firstList(spec, ["notes", "sections"], ["Signal held across cohorts", "Bottleneck moved to onboarding", "Next wave needs owner clarity"]).slice(0, 3);
  return pageShell(spec, [
    box({ position: "absolute", left: 56, top: 48, width: 848, height: 444, borderWidth: 3, borderColor: theme8.text }),
    box({ position: "absolute", left: 70, top: 62, width: 132, height: 88, backgroundColor: theme8.panel, borderWidth: 2, borderColor: theme8.primary }),
    TextBlock(text9(spec, "eyebrow", "GRID REPORT").toUpperCase(), {
      position: "absolute",
      left: 84,
      top: 88,
      width: 104,
      color: theme8.text,
      fontSize: 17,
      fontWeight: 900,
      lineHeight: 1.1
    }),
    Title(text9(spec, "title", "Dense Signal Grid"), {
      position: "absolute",
      left: 226,
      top: 66,
      width: 620,
      color: theme8.text,
      fontSize: 42,
      fontWeight: 900,
      lineHeight: 1.02
    }),
    TextBlock(text9(spec, "subtitle", ""), {
      position: "absolute",
      left: 226,
      top: 158,
      width: 560,
      color: theme8.muted,
      fontSize: 19,
      fontWeight: 700,
      lineHeight: 1.22
    }),
    box(
      { position: "absolute", left: 70, top: 228, width: 548, flexDirection: "row", flexWrap: "wrap", gap: 12 },
      metrics.map(
        (metric19, index) => box({ width: 170, height: 82, flexDirection: "column", backgroundColor: theme8.panel, borderWidth: index % 3 === 0 ? 2 : 0, borderColor: theme8.primary, padding: 14 }, [
          TextBlock(String(index + 1).padStart(2, "0"), { color: theme8.primary, fontSize: 14, fontWeight: 850, marginBottom: 8 }),
          TextBlock(metric19, { color: theme8.text, fontSize: 19, fontWeight: 900, lineHeight: 1.08 })
        ])
      )
    ),
    box(
      { position: "absolute", right: 70, top: 230, width: 252, flexDirection: "column", gap: 12 },
      notes2.map(
        (note) => box({ minHeight: 76, backgroundColor: theme8.panel, borderWidth: 2, borderColor: theme8.primary, padding: 14 }, [
          TextBlock(note, { color: theme8.text, fontSize: 18, fontWeight: 900, lineHeight: 1.12 })
        ])
      )
    )
  ]);
}
function editorialQuoteChart(spec) {
  const theme8 = colors23(spec);
  const points = firstList(spec, ["points", "items"], ["Signal was visible before the metric moved", "The constraint is organizational, not technical", "Next action must be explicit"]).slice(0, 3);
  return pageShell(spec, [
    box({ position: "absolute", left: 54, top: 48, width: 852, height: 72, borderBottomWidth: 2, borderBottomColor: theme8.primary }),
    TextBlock(text9(spec, "eyebrow", "EDITORIAL").toUpperCase(), { position: "absolute", left: 60, top: 72, color: theme8.primary, fontSize: 16, fontWeight: 850 }),
    TextBlock(text9(spec, "section", "FIELD NOTE"), { position: "absolute", right: 62, top: 72, color: theme8.muted, fontSize: 16, fontWeight: 750 }),
    TextBlock("\u201C", { position: "absolute", left: 58, top: 142, color: theme8.primary, fontSize: 108, fontWeight: 900, lineHeight: 0.8 }),
    Title(text9(spec, "quote", text9(spec, "title", "The operating model changed before the dashboard caught up.")), {
      position: "absolute",
      left: 132,
      top: 148,
      width: 518,
      color: theme8.text,
      fontSize: 43,
      fontWeight: 900,
      lineHeight: 1.04
    }),
    TextBlock(text9(spec, "attribution", ""), { position: "absolute", left: 138, top: 352, width: 420, color: theme8.muted, fontSize: 18, fontWeight: 750 }),
    box(
      { position: "absolute", right: 70, top: 154, width: 212, flexDirection: "column", gap: 14 },
      points.map(
        (point, index) => box({ minHeight: 78, flexDirection: "row", backgroundColor: theme8.panel, borderWidth: index === 0 ? 2 : 0, borderColor: theme8.primary, padding: 14 }, [
          TextBlock(String(index + 1), { width: 32, color: theme8.primary, fontSize: 26, fontWeight: 900 }),
          TextBlock(point, { flex: 1, color: theme8.text, fontSize: 17, fontWeight: 760, lineHeight: 1.12 })
        ])
      )
    )
  ]);
}
function ledgerBriefing(spec) {
  const theme8 = colors23(spec);
  const items = firstList(spec, ["items", "takeaways"], ["Scope closed", "Evidence reviewed", "Decision pending", "Owner named"]).slice(0, 5);
  const metrics = firstList(spec, ["metrics", "stats"], ["Q2", "18%", "04"]).slice(0, 3);
  return pageShell(spec, [
    box({ position: "absolute", left: 56, top: 46, width: 848, height: 1, backgroundColor: theme8.text }),
    box({ position: "absolute", left: 56, bottom: 46, width: 848, height: 1, backgroundColor: theme8.text }),
    TextBlock(text9(spec, "eyebrow", "LEDGER").toUpperCase(), { position: "absolute", left: 58, top: 70, color: theme8.muted, fontSize: 15, fontWeight: 800 }),
    Title(text9(spec, "title", "Operating Ledger"), {
      position: "absolute",
      left: 56,
      top: 104,
      width: 520,
      color: theme8.text,
      fontSize: 54,
      fontWeight: 300,
      lineHeight: 1.02
    }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 58, top: 230, width: 492, color: theme8.muted, fontSize: 20, lineHeight: 1.35 }),
    box({ position: "absolute", right: 62, top: 84, width: 250, flexDirection: "row", gap: 18 }, metrics.map(
      (metric19) => box({ width: 70, flexDirection: "column", borderTopWidth: 1, borderTopColor: theme8.text, paddingTop: 12 }, [
        TextBlock(metric19, { color: theme8.text, fontSize: 34, fontWeight: 300, lineHeight: 1 }),
        TextBlock("FIELD", { color: theme8.muted, fontSize: 11, fontWeight: 800, marginTop: 8 })
      ])
    )),
    box({ position: "absolute", right: 64, top: 222, width: 326, flexDirection: "column" }, items.map(
      (item, index) => box({ height: 48, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme8.muted }, [
        TextBlock(String(index + 1).padStart(2, "0"), { width: 48, color: theme8.muted, fontSize: 15, fontWeight: 800 }),
        TextBlock(item, { flex: 1, color: theme8.text, fontSize: 18, fontWeight: 450, lineHeight: 1.18 })
      ])
    ))
  ]);
}
function intelligenceBrief(spec) {
  const theme8 = colors23(spec);
  const points = firstList(spec, ["points", "signals", "items"], ["Early signal", "Structural constraint", "Recommended action"]).slice(0, 4);
  return pageShell(spec, [
    box({ position: "absolute", left: 56, top: 56, width: 848, height: 52, borderBottomWidth: 1, borderBottomColor: theme8.accent }),
    TextBlock(text9(spec, "eyebrow", "PRIVATE BRIEF").toUpperCase(), { position: "absolute", left: 62, top: 72, color: theme8.accent, fontSize: 15, fontWeight: 850 }),
    TextBlock(text9(spec, "date", "CONFIDENTIAL"), { position: "absolute", right: 62, top: 72, color: theme8.muted, fontSize: 15, fontWeight: 750 }),
    Title(text9(spec, "title", "Signal Briefing"), { position: "absolute", left: 70, top: 148, width: 602, color: theme8.text, fontSize: 52, fontWeight: 700, lineHeight: 1.02 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 72, top: 282, width: 536, color: theme8.muted, fontSize: 20, lineHeight: 1.32 }),
    box({ position: "absolute", right: 72, top: 150, width: 238, flexDirection: "column", gap: 14 }, points.map(
      (point, index) => box({ minHeight: 66, flexDirection: "column", borderLeftWidth: 3, borderLeftColor: index === 0 ? theme8.accent : theme8.panel, paddingLeft: 14 }, [
        TextBlock(`S${index + 1}`, { color: theme8.accent, fontSize: 14, fontWeight: 850, marginBottom: 8 }),
        TextBlock(point, { color: theme8.text, fontSize: 18, fontWeight: 650, lineHeight: 1.14 })
      ])
    )),
    box({ position: "absolute", left: 72, bottom: 70, width: 720, height: 1, backgroundColor: theme8.accent, opacity: 0.7 })
  ]);
}
function printedProgram(spec) {
  const theme8 = colors23(spec);
  const items = firstList(spec, ["items", "courses", "agenda"], ["Opening note", "Main course", "Decision round", "Closing"]).slice(0, 5);
  return pageShell(spec, [
    box({ position: "absolute", left: 58, top: 50, width: 844, height: 438, borderWidth: 2, borderColor: theme8.primary }),
    TextBlock(text9(spec, "edition", "EDITION 01"), { position: "absolute", left: 84, top: 80, color: theme8.primary, fontSize: 17, fontWeight: 900 }),
    Title(text9(spec, "title", "Long Table Review").toUpperCase(), { position: "absolute", left: 82, top: 120, width: 514, color: theme8.primary, fontSize: 54, fontWeight: 900, lineHeight: 0.92 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 86, top: 288, width: 430, color: theme8.text, fontSize: 20, lineHeight: 1.35 }),
    box({ position: "absolute", right: 82, top: 88, width: 292, flexDirection: "column" }, items.map(
      (item, index) => box({ minHeight: 66, borderBottomWidth: 1, borderBottomColor: theme8.primary, padding: "10px 0", flexDirection: "row" }, [
        TextBlock(String(index + 1).padStart(2, "0"), { width: 42, color: theme8.primary, fontSize: 24, fontWeight: 800 }),
        TextBlock(item.toUpperCase(), { flex: 1, color: theme8.primary, fontSize: 20, fontWeight: 850, lineHeight: 1.05 })
      ])
    )),
    TextBlock(text9(spec, "footer", "SVGlide program note"), { position: "absolute", left: 86, bottom: 76, color: theme8.muted, fontSize: 16, fontWeight: 700 })
  ]);
}
function retroUiDashboard(spec) {
  const theme8 = colors23(spec);
  const panels = firstList(spec, ["panels", "items"], ["Build status: OK", "Open issues: 12", "Owner: Platform"]).slice(0, 4);
  return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", flexDirection: "column", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 48 }, [
    box({ position: "absolute", left: 70, top: 62, width: 820, height: 416, backgroundColor: theme8.panel, borderWidth: 3, borderColor: theme8.text }),
    box({ position: "absolute", left: 76, top: 68, width: 808, height: 38, backgroundColor: theme8.primary, flexDirection: "row", alignItems: "center", padding: "0 12px" }, [
      TextBlock(text9(spec, "window_title", "SVGLIDE.EXE"), { color: theme8.accent, fontSize: 18, fontWeight: 850 })
    ]),
    Title(text9(spec, "title", "Release Control Panel"), { position: "absolute", left: 96, top: 132, width: 500, color: theme8.text, fontSize: 38, fontWeight: 800, lineHeight: 1.08 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 98, top: 228, width: 428, color: theme8.muted, fontSize: 19, lineHeight: 1.28 }),
    box({ position: "absolute", right: 98, top: 132, width: 292, flexDirection: "column", gap: 12 }, panels.map(
      (panel3) => box({ height: 62, backgroundColor: theme8.background, borderWidth: 2, borderColor: theme8.text, padding: 14 }, [
        TextBlock(panel3, { color: theme8.text, fontSize: 18, fontWeight: 750 })
      ])
    )),
    box({ position: "absolute", left: 96, bottom: 88, width: 768, height: 28, backgroundColor: theme8.background, borderWidth: 2, borderColor: theme8.text }, [
      TextBlock(text9(spec, "status", "READY"), { color: theme8.primary, fontSize: 15, fontWeight: 900, padding: "5px 10px" })
    ])
  ]);
}
function productRibbon(spec) {
  const theme8 = colors23(spec);
  const cards = firstList(spec, ["cards", "items"], ["Feature A", "Feature B", "Feature C"]).slice(0, 4);
  const stripeColors = [theme8.primary, theme8.accent, theme8.panel, theme8.muted];
  const labelColors = [theme8.primary, theme8.accent, theme8.text, theme8.primary];
  return pageShell(spec, [
    box({ position: "absolute", left: 0, top: 0, width: CANVAS21.width, height: 28, flexDirection: "row" }, stripeColors.map(
      (color) => box({ width: 240, height: 28, backgroundColor: color })
    )),
    TextBlock(text9(spec, "eyebrow", "CATALOG").toUpperCase(), { position: "absolute", left: 64, top: 70, color: theme8.primary, fontSize: 16, fontWeight: 900 }),
    Title(text9(spec, "title", "Product Catalog"), { position: "absolute", left: 62, top: 102, width: 610, color: theme8.text, fontSize: 58, fontWeight: 900, lineHeight: 0.92 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 66, top: 238, width: 470, color: theme8.muted, fontSize: 20, lineHeight: 1.28 }),
    box({ position: "absolute", left: 64, bottom: 62, flexDirection: "row", gap: 16 }, cards.map(
      (card2, index) => box({ width: 194, height: 118, backgroundColor: index % 2 ? theme8.panel : theme8.background, borderWidth: 2, borderColor: theme8.text, padding: 14 }, [
        TextBlock(String(index + 1).padStart(2, "0"), { color: labelColors[index % labelColors.length], fontSize: 24, fontWeight: 900, marginBottom: 12 }),
        TextBlock(card2, { color: theme8.text, fontSize: 18, fontWeight: 850, lineHeight: 1.08 })
      ])
    )),
    box({ position: "absolute", right: 78, top: 94, width: 112, height: 112, borderRadius: 56, backgroundColor: theme8.panel, borderWidth: 2, borderColor: theme8.accent, alignItems: "center", justifyContent: "center" }, [
      TextBlock(text9(spec, "seal", "NEW"), { color: theme8.text, fontSize: 25, fontWeight: 900 })
    ])
  ]);
}
function typeMassPoster(spec) {
  const theme8 = colors23(spec);
  const notes2 = firstList(spec, ["notes", "items"], ["One message", "No decoration", "High contrast"]).slice(0, 3);
  return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", flexDirection: "column", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 52 }, [
    box({ position: "absolute", left: 52, top: 48, width: 856, height: 1, backgroundColor: theme8.primary, opacity: 0.62 }),
    TextBlock(text9(spec, "eyebrow", "STUDIO").toUpperCase(), { position: "absolute", left: 58, top: 66, color: theme8.primary, fontSize: 15, fontWeight: 850 }),
    TextBlock(text9(spec, "counter", "01/06"), { position: "absolute", right: 58, top: 66, color: theme8.primary, fontSize: 15, fontWeight: 850 }),
    Title(text9(spec, "title", "MAKE IT LOUD").toUpperCase(), { position: "absolute", left: 58, top: 118, width: 800, color: theme8.primary, fontSize: 82, fontWeight: 900, lineHeight: 0.88 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 62, bottom: 120, width: 520, color: theme8.muted, fontSize: 21, lineHeight: 1.25 }),
    box({ position: "absolute", right: 70, bottom: 78, width: 248, flexDirection: "column" }, notes2.map(
      (note) => box({ borderTopWidth: 2, borderTopColor: theme8.primary, padding: "12px 0" }, [
        TextBlock(note.toUpperCase(), { color: theme8.primary, fontSize: 18, fontWeight: 900, lineHeight: 1.05 })
      ])
    ))
  ]);
}
function brutalistMatrix(spec) {
  const theme8 = colors23(spec);
  const cells = firstList(spec, ["cells", "items"], ["Price clarity", "Time to value", "Risk level", "Owner fit", "Migration cost", "Evidence depth"]).slice(0, 6);
  return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", flexDirection: "column", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 50 }, [
    box({ position: "absolute", left: 50, top: 50, width: 860, height: 440, borderWidth: 3, borderColor: theme8.text }),
    TextBlock(text9(spec, "eyebrow", "MATRIX").toUpperCase(), { position: "absolute", left: 70, top: 74, color: theme8.text, fontSize: 15, fontWeight: 900 }),
    Title(text9(spec, "title", "Decision Matrix").toUpperCase(), { position: "absolute", left: 70, top: 104, width: 492, color: theme8.text, fontSize: 50, fontWeight: 900, lineHeight: 0.96 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 70, top: 222, width: 426, color: theme8.muted, fontSize: 19, lineHeight: 1.22 }),
    box({ position: "absolute", right: 72, top: 76, width: 314, height: 92, backgroundColor: theme8.panel, borderWidth: 3, borderColor: theme8.primary, padding: 14 }, [
      TextBlock(text9(spec, "callout", "BEST OPTION").toUpperCase(), { color: theme8.text, fontSize: 24, fontWeight: 900, lineHeight: 1 })
    ]),
    box({ position: "absolute", left: 70, bottom: 76, width: 820, flexDirection: "row", flexWrap: "wrap" }, cells.map(
      (cell, index) => box({ width: 273, height: 74, borderWidth: 2, borderColor: theme8.text, backgroundColor: index % 2 ? theme8.panel : theme8.background, padding: 12, flexDirection: "row" }, [
        TextBlock(String(index + 1), { width: 34, color: theme8.primary, fontSize: 28, fontWeight: 900 }),
        TextBlock(cell, { flex: 1, color: theme8.text, fontSize: 18, fontWeight: 850, lineHeight: 1.08 })
      ])
    ))
  ]);
}
function annotatedFieldBoard(spec) {
  const theme8 = colors23(spec);
  const notes2 = firstList(spec, ["notes", "items"], ["Interview signal", "Evidence needs follow-up", "Decision owner named"]).slice(0, 4);
  return pageShell(spec, [
    box({ position: "absolute", left: 62, top: 56, width: 836, height: 428, borderWidth: 2, borderColor: theme8.muted, backgroundColor: theme8.panel }),
    TextBlock(text9(spec, "eyebrow", "FIELD BOARD").toUpperCase(), { position: "absolute", left: 86, top: 84, color: theme8.primary, fontSize: 16, fontWeight: 900 }),
    Title(text9(spec, "title", "Annotated Evidence"), { position: "absolute", left: 86, top: 116, width: 520, color: theme8.text, fontSize: 48, fontWeight: 850, lineHeight: 1.02 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 88, top: 228, width: 430, color: theme8.muted, fontSize: 20, lineHeight: 1.28 }),
    TextBlock(text9(spec, "stamp", "REVIEWED").toUpperCase(), { position: "absolute", right: 90, top: 86, color: theme8.primary, borderWidth: 3, borderColor: theme8.primary, fontSize: 22, fontWeight: 900, padding: "10px 14px" }),
    box({ position: "absolute", right: 86, top: 160, width: 302, flexDirection: "column", gap: 14 }, notes2.map(
      (note, index) => box({ minHeight: 66, backgroundColor: theme8.background, borderWidth: 2, borderColor: theme8.text, padding: 14 }, [
        TextBlock(`NOTE ${index + 1}`, { color: theme8.primary, fontSize: 13, fontWeight: 900, marginBottom: 8 }),
        TextBlock(note, { color: theme8.text, fontSize: 18, fontWeight: 750, lineHeight: 1.12 })
      ])
    )),
    box({ position: "absolute", left: 86, bottom: 82, width: 430, flexDirection: "row", gap: 12 }, firstList(spec, ["tags"], ["USER", "EVIDENCE", "NEXT"]).slice(0, 3).map(
      (tag) => TextBlock(tag.toUpperCase(), { color: theme8.text, backgroundColor: theme8.panel, fontSize: 14, fontWeight: 900, padding: "8px 12px" })
    ))
  ]);
}
function architecturalSpec(spec) {
  const theme8 = colors23(spec);
  const rows = firstList(spec, ["rows", "items"], ["Foundation", "Structure", "Interface", "Handoff"]).slice(0, 4);
  return pageShell(spec, [
    box({ position: "absolute", left: 70, top: 62, width: 820, height: 414, borderWidth: 1, borderColor: theme8.muted }),
    box({ position: "absolute", left: 92, top: 86, width: 258, height: 258, borderWidth: 2, borderColor: theme8.primary }),
    box({ position: "absolute", left: 142, top: 136, width: 158, height: 158, borderRadius: 79, borderWidth: 2, borderColor: theme8.accent }),
    TextBlock(text9(spec, "eyebrow", "SPEC").toUpperCase(), { position: "absolute", left: 392, top: 90, color: theme8.muted, fontSize: 15, fontWeight: 850 }),
    Title(text9(spec, "title", "Architecture Spec"), { position: "absolute", left: 390, top: 124, width: 430, color: theme8.text, fontSize: 46, fontWeight: 650, lineHeight: 1.03 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 392, top: 238, width: 396, color: theme8.muted, fontSize: 20, lineHeight: 1.32 }),
    box({ position: "absolute", left: 92, bottom: 84, width: 746, flexDirection: "row", gap: 14 }, rows.map(
      (row, index) => box({ width: 176, height: 70, borderTopWidth: 1, borderTopColor: theme8.primary, paddingTop: 12 }, [
        TextBlock(String(index + 1).padStart(2, "0"), { color: theme8.primary, fontSize: 16, fontWeight: 850, marginBottom: 8 }),
        TextBlock(row, { color: theme8.text, fontSize: 18, fontWeight: 700, lineHeight: 1.1 })
      ])
    ))
  ]);
}
function trendGridReport(spec) {
  const theme8 = colors23(spec);
  const trends = firstList(spec, ["trends", "items"], ["Model cost pressure", "Agent workflows", "Design ops maturity", "Governance gaps"]).slice(0, 4);
  return pageShell(spec, [
    box({ position: "absolute", left: 52, top: 52, width: 856, height: 436, borderWidth: 2, borderColor: theme8.primary, opacity: 0.9 }),
    TextBlock(text9(spec, "eyebrow", "TREND INDEX").toUpperCase(), { position: "absolute", left: 72, top: 74, color: theme8.primary, fontSize: 15, fontWeight: 900 }),
    Title(text9(spec, "title", "Cobalt Trend Report"), { position: "absolute", left: 70, top: 112, width: 570, color: theme8.primary, fontSize: 58, fontWeight: 500, lineHeight: 0.94 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 72, top: 250, width: 500, color: theme8.muted, fontSize: 19, lineHeight: 1.3 }),
    box({ position: "absolute", right: 74, top: 92, width: 170, height: 170, flexDirection: "row", flexWrap: "wrap" }, Array.from({ length: 16 }).map(
      (_, index) => box({ width: 34, height: 34, backgroundColor: index % 3 === 0 ? theme8.primary : theme8.panel, marginRight: 4, marginBottom: 4, opacity: index % 3 === 0 ? 1 : 0.42 })
    )),
    box({ position: "absolute", left: 72, bottom: 74, width: 810, flexDirection: "column" }, trends.map(
      (trend, index) => box({ height: 42, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme8.primary }, [
        TextBlock(`0${index + 1}`, { width: 54, color: theme8.primary, fontSize: 16, fontWeight: 850 }),
        TextBlock(trend, { flex: 1, color: theme8.text, fontSize: 19, fontWeight: 650 }),
        TextBlock(index % 2 ? "RISING" : "WATCH", { width: 94, color: theme8.primary, fontSize: 13, fontWeight: 900, textAlign: "right" })
      ])
    ))
  ]);
}
function serifStatEditorial(spec) {
  const theme8 = colors23(spec);
  const cards = firstList(spec, ["cards", "items"], ["Quality held", "Narrative simplified", "Next evidence needed"]).slice(0, 3);
  return pageShell(spec, [
    TextBlock(text9(spec, "eyebrow", "EDITORIAL").toUpperCase(), { position: "absolute", left: 70, top: 72, color: theme8.primary, fontSize: 16, fontWeight: 900 }),
    Title(text9(spec, "stat", "73%"), { position: "absolute", left: 68, top: 104, width: 360, color: theme8.primary, fontSize: 118, fontWeight: 500, lineHeight: 0.9 }),
    Title(text9(spec, "title", "Evidence moved the decision"), { position: "absolute", left: 442, top: 104, width: 380, color: theme8.text, fontSize: 44, fontWeight: 600, lineHeight: 1.02 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 444, top: 238, width: 360, color: theme8.muted, fontSize: 20, lineHeight: 1.32 }),
    box({ position: "absolute", left: 70, bottom: 70, flexDirection: "row", gap: 18 }, cards.map(
      (card2, index) => box({ width: 252, minHeight: 112, borderTopWidth: 3, borderTopColor: index === 0 ? theme8.accent : theme8.primary, backgroundColor: theme8.panel, padding: 16 }, [
        TextBlock(card2, { color: theme8.text, fontSize: 22, fontWeight: 650, lineHeight: 1.12 })
      ])
    ))
  ]);
}
function posterStatPunch(spec) {
  const theme8 = colors23(spec);
  const pillars = firstList(spec, ["pillars", "items"], ["Bold claim", "Evidence block", "Next move"]).slice(0, 3);
  return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", flexDirection: "column", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 52 }, [
    box({ position: "absolute", left: 48, top: 48, width: 864, height: 444, borderWidth: 3, borderColor: theme8.text }),
    TextBlock(text9(spec, "eyebrow", "POSTER").toUpperCase(), { position: "absolute", left: 72, top: 72, color: theme8.text, fontSize: 16, fontWeight: 900 }),
    Title(text9(spec, "title", "Make the call").toUpperCase(), { position: "absolute", left: 70, top: 104, width: 610, color: theme8.text, fontSize: 66, fontWeight: 900, lineHeight: 0.9 }),
    Title(text9(spec, "stat", "3X"), { position: "absolute", right: 82, top: 96, width: 184, color: theme8.primary, fontSize: 118, fontWeight: 900, lineHeight: 0.86 }),
    TextBlock(text9(spec, "subtitle", ""), { position: "absolute", left: 74, top: 272, width: 470, color: theme8.muted, fontSize: 20, lineHeight: 1.28 }),
    box({ position: "absolute", left: 74, bottom: 76, flexDirection: "row", gap: 16 }, pillars.map(
      (pillar2, index) => box({ width: 250, minHeight: 86, borderTopWidth: 3, borderTopColor: theme8.primary, paddingTop: 12 }, [
        TextBlock(`0${index + 1}`, { color: theme8.primary, fontSize: 28, fontWeight: 900, marginBottom: 6 }),
        TextBlock(pillar2, { color: theme8.text, fontSize: 20, fontWeight: 850, lineHeight: 1.08 })
      ])
    ))
  ]);
}
var BEAUTIFUL_TEMPLATE_CONFIGS = {};
function firstConfiguredItems(spec, cfg, fallback2 = ["Signal", "Evidence", "Next move"]) {
  return firstList(spec, cfg.listKeys || ["items"], fallback2);
}
function templateBadge(spec, cfg, style = {}) {
  const theme8 = colors23(spec);
  return TextBlock(text9(spec, "eyebrow", cfg.label).toUpperCase(), {
    color: theme8.primary,
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: 0,
    ...style
  });
}
function beautifulTemplate(spec, cfg) {
  const theme8 = colors23(spec);
  const items = firstConfiguredItems(spec, cfg).slice(0, 6);
  const title2 = text9(spec, "title", "Untitled");
  const subtitle = text9(spec, "subtitle", "");
  const quote3 = text9(spec, "quote", text9(spec, "lede", ""));
  const stat = text9(spec, "stat", items[0] || "");
  if (cfg.mode === "console") {
    return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 48 }, [
      box({ position: "absolute", left: 38, top: 34, width: 884, height: 472, borderWidth: 3, borderColor: theme8.primary, backgroundColor: theme8.panel }),
      box({ position: "absolute", left: 70, top: 70, width: 820, height: 34, flexDirection: "row", gap: 10 }, Array.from({ length: 18 }).map(
        (_, index) => box({ width: index % 4 === 0 ? 56 : 28, height: 10, backgroundColor: index % 3 === 0 ? theme8.accent : theme8.primary, opacity: index % 2 ? 0.42 : 0.78 })
      )),
      templateBadge(spec, cfg, { position: "absolute", left: 76, top: 122 }),
      Title(title2, { position: "absolute", left: 74, top: 154, width: 548, color: theme8.text, fontSize: 52, fontWeight: 900, lineHeight: 0.96 }),
      TextBlock(subtitle, { position: "absolute", left: 76, top: 278, width: 480, color: theme8.muted, fontSize: 20, lineHeight: 1.24 }),
      box({ position: "absolute", right: 76, top: 130, width: 236, flexDirection: "column", gap: 12 }, items.slice(0, 4).map(
        (item, index) => box({ minHeight: 54, borderWidth: 2, borderColor: index % 2 ? theme8.accent : theme8.primary, backgroundColor: theme8.background, padding: 12 }, [
          TextBlock(item, { color: theme8.text, fontSize: 18, fontWeight: 800, lineHeight: 1.1 })
        ])
      )),
      TextBlock("PX", { position: "absolute", left: 76, bottom: 64, color: theme8.accent, fontSize: 56, fontWeight: 900 })
    ]);
  }
  if (cfg.mode === "programme" || cfg.mode === "manual") {
    return pageShell(spec, [
      box({ position: "absolute", left: 58, top: 52, width: 844, height: 438, borderWidth: cfg.mode === "manual" ? 3 : 2, borderColor: theme8.primary }),
      templateBadge(spec, cfg, { position: "absolute", left: 82, top: 78 }),
      Title(title2, { position: "absolute", left: 80, top: 112, width: cfg.mode === "manual" ? 382 : 500, color: theme8.text, fontSize: cfg.mode === "manual" ? 46 : 58, fontWeight: 850, lineHeight: 0.96 }),
      TextBlock(subtitle, { position: "absolute", left: 82, top: cfg.mode === "manual" ? 232 : 254, width: 390, color: theme8.muted, fontSize: 19, lineHeight: 1.28 }),
      box({ position: "absolute", right: 80, top: 84, width: 330, flexDirection: "column" }, items.slice(0, 5).map(
        (item, index) => box({ minHeight: 58, flexDirection: "row", alignItems: "center", borderTopWidth: 2, borderTopColor: theme8.primary, padding: "10px 0" }, [
          TextBlock(String(index + 1).padStart(2, "0"), { width: 48, color: theme8.accent, fontSize: 18, fontWeight: 900 }),
          TextBlock(item, { flex: 1, color: theme8.text, fontSize: 19, fontWeight: 750, lineHeight: 1.12 })
        ])
      )),
      TextBlock(text9(spec, "footer", text9(spec, "venue", "")), { position: "absolute", left: 82, bottom: 78, width: 430, color: theme8.primary, fontSize: 17, fontWeight: 850 })
    ]);
  }
  if (cfg.mode === "block-grid" || cfg.mode === "creative-grid" || cfg.mode === "capsule" || cfg.mode === "sticky") {
    const rounded = cfg.mode === "capsule" ? 999 : cfg.mode === "sticky" ? 2 : 0;
    const roundedStyle = rounded ? { borderRadius: rounded } : {};
    return pageShell(spec, [
      templateBadge(spec, cfg, { position: "absolute", left: 70, top: 66 }),
      Title(title2, { position: "absolute", left: 68, top: 96, width: 520, color: theme8.text, fontSize: 48, fontWeight: 900, lineHeight: 0.98 }),
      TextBlock(subtitle, { position: "absolute", left: 70, top: 210, width: 480, color: theme8.muted, fontSize: 19, lineHeight: 1.28 }),
      box({ position: "absolute", right: 70, top: 70, width: 248, height: 138, backgroundColor: theme8.accent, opacity: cfg.mode === "sticky" ? 0.36 : 0.92, ...roundedStyle }),
      box({ position: "absolute", left: 70, bottom: 66, width: 820, flexDirection: "row", flexWrap: "wrap", gap: 14 }, items.slice(0, 6).map(
        (item, index) => box({ width: cfg.mode === "sticky" ? 246 : 258, minHeight: cfg.mode === "capsule" ? 58 : 76, backgroundColor: index % 2 ? theme8.surface : theme8.panel, borderWidth: 2, borderColor: theme8.primary, padding: 14, ...roundedStyle }, [
          TextBlock(item, { color: theme8.text, fontSize: 18, fontWeight: 800, lineHeight: 1.1 })
        ])
      ))
    ]);
  }
  if (cfg.mode === "cover-editorial" || cfg.mode === "manifesto" || cfg.mode === "nocturne") {
    return box({ width: CANVAS21.width, height: CANVAS21.height, position: "relative", backgroundColor: theme8.background, color: theme8.text, fontFamily: DEFAULT_FONT_FAMILY, padding: 54 }, [
      templateBadge(spec, cfg, { position: "absolute", left: 76, top: 70, color: cfg.mode === "manifesto" ? theme8.text : theme8.primary }),
      Title(title2.toUpperCase(), { position: "absolute", left: 74, top: 108, width: cfg.mode === "manifesto" ? 720 : 620, color: theme8.text, fontSize: cfg.mode === "manifesto" ? 64 : 58, fontWeight: 900, lineHeight: 0.9 }),
      TextBlock(subtitle, { position: "absolute", left: 78, top: 276, width: 510, color: theme8.muted, fontSize: 20, lineHeight: 1.25 }),
      box({ position: "absolute", right: 78, top: 86, width: 210, height: 210, borderWidth: 3, borderColor: theme8.primary, backgroundColor: cfg.mode === "manifesto" ? theme8.accent : theme8.panel }),
      TextBlock(stat || cfg.label, { position: "absolute", right: 94, top: 142, width: 178, color: cfg.mode === "manifesto" ? theme8.background : theme8.primary, fontSize: 34, fontWeight: 900, lineHeight: 1, textAlign: "center" }),
      box({ position: "absolute", left: 78, bottom: 70, flexDirection: "row", gap: 14 }, items.slice(0, 3).map(
        (item, index) => box({ width: 250, minHeight: 82, borderTopWidth: 3, borderTopColor: index === 0 ? theme8.accent : theme8.primary, paddingTop: 12 }, [
          TextBlock(item, { color: theme8.text, fontSize: 20, fontWeight: 820, lineHeight: 1.08 })
        ])
      ))
    ]);
  }
  if (cfg.mode === "organic" || cfg.mode === "midcentury" || cfg.mode === "playful") {
    return pageShell(spec, [
      box({ position: "absolute", left: 62, top: 58, width: 318, height: 424, backgroundColor: theme8.panel }),
      box({ position: "absolute", left: 96, top: 92, width: 248, height: 154, backgroundColor: theme8.surface, borderWidth: 2, borderColor: theme8.primary }),
      templateBadge(spec, cfg, { position: "absolute", left: 418, top: 76 }),
      Title(title2, { position: "absolute", left: 416, top: 112, width: 430, color: theme8.text, fontSize: 46, fontWeight: 760, lineHeight: 1 }),
      TextBlock(subtitle, { position: "absolute", left: 418, top: 234, width: 386, color: theme8.muted, fontSize: 19, lineHeight: 1.3 }),
      box({ position: "absolute", left: 416, bottom: 70, width: 410, flexDirection: "column", gap: 12 }, items.slice(0, 3).map(
        (item, index) => box({ minHeight: 52, flexDirection: "row", alignItems: "center" }, [
          box({ width: 18, height: 18, borderRadius: cfg.mode === "midcentury" ? 0 : 9, backgroundColor: index % 2 ? theme8.accent : theme8.primary, marginRight: 14 }),
          TextBlock(item, { flex: 1, color: theme8.text, fontSize: 20, fontWeight: 750, lineHeight: 1.12 })
        ])
      ))
    ]);
  }
  if (cfg.mode === "zine" || cfg.mode === "soft-workshop") {
    return pageShell(spec, [
      box({ position: "absolute", left: 70, top: 62, width: 364, height: 416, backgroundColor: theme8.panel, borderWidth: 2, borderColor: theme8.primary }),
      box({ position: "absolute", left: 104, top: 94, width: 296, height: 120, backgroundColor: theme8.surface }),
      templateBadge(spec, cfg, { position: "absolute", left: 470, top: 76 }),
      Title(title2, { position: "absolute", left: 468, top: 112, width: 360, color: theme8.text, fontSize: 44, fontWeight: 820, lineHeight: 1 }),
      TextBlock(quote3 || subtitle, { position: "absolute", left: 470, top: 244, width: 342, color: theme8.muted, fontSize: 21, fontWeight: 650, lineHeight: 1.22 }),
      box({ position: "absolute", left: 470, bottom: 72, flexDirection: "row", gap: 12 }, items.slice(0, 3).map(
        (item) => box({ width: 112, minHeight: 92, backgroundColor: theme8.surface, borderWidth: 2, borderColor: theme8.primary, padding: 10 }, [
          TextBlock(item, { color: theme8.text, fontSize: 16, fontWeight: 800, lineHeight: 1.1 })
        ])
      ))
    ]);
  }
  return pageShell(spec, [
    templateBadge(spec, cfg, { position: "absolute", left: 72, top: 70 }),
    Title(title2, { position: "absolute", left: 70, top: 108, width: 600, color: theme8.text, fontSize: cfg.mode === "scholar" ? 50 : 46, fontWeight: 780, lineHeight: 1.02 }),
    TextBlock(quote3 || subtitle, { position: "absolute", left: 72, top: 242, width: 560, color: theme8.muted, fontSize: 21, lineHeight: 1.3 }),
    box({ position: "absolute", right: 76, top: 78, width: 170, height: 330, borderWidth: 2, borderColor: theme8.primary, backgroundColor: theme8.panel }),
    box({ position: "absolute", left: 72, bottom: 72, flexDirection: "row", gap: 16 }, items.slice(0, 3).map(
      (item, index) => box({ width: 244, minHeight: 86, borderTopWidth: 3, borderTopColor: index === 0 ? theme8.accent : theme8.primary, paddingTop: 12 }, [
        TextBlock(item, { color: theme8.text, fontSize: 20, fontWeight: 740, lineHeight: 1.1 })
      ])
    ))
  ]);
}
function renderTree(spec) {
  if (spec.template_id === "cover-hero") return coverHero(spec);
  if (spec.template_id === "comparison-cards") return comparisonCards(spec);
  if (spec.template_id === "summary-final") return summaryFinal(spec);
  if (spec.template_id === "section-title") return sectionTitle(spec);
  if (spec.template_id === "agenda-list") return agendaList(spec);
  if (spec.template_id === "timeline-steps") return timelineSteps2(spec);
  if (spec.template_id === "process-flow") return processFlow(spec);
  if (spec.template_id === "metric-dashboard") return metricDashboard(spec);
  if (spec.template_id === "quote-focus") return quoteFocus(spec);
  if (spec.template_id === "image-feature") return imageFeature(spec);
  if (spec.template_id === "research-poster") return researchPoster(spec);
  if (spec.template_id === "data-story") return dataStory(spec);
  if (spec.template_id === "risk-alert") return riskAlert(spec);
  if (spec.template_id === "roadmap-lanes") return roadmapLanes(spec);
  if (spec.template_id === "architecture-blueprint") return architectureBlueprint(spec);
  const beautifulTree = renderBeautifulTemplate(spec);
  if (beautifulTree) return beautifulTree;
  if (spec.template_id === "dense-panel-grid") return densePanelGrid(spec);
  if (spec.template_id === "editorial-quote-chart") return editorialQuoteChart(spec);
  if (spec.template_id === "ledger-briefing") return ledgerBriefing(spec);
  if (spec.template_id === "intelligence-brief") return intelligenceBrief(spec);
  if (spec.template_id === "printed-program") return printedProgram(spec);
  if (spec.template_id === "retro-ui-dashboard") return retroUiDashboard(spec);
  if (spec.template_id === "product-ribbon") return productRibbon(spec);
  if (spec.template_id === "type-mass-poster") return typeMassPoster(spec);
  if (spec.template_id === "brutalist-matrix") return brutalistMatrix(spec);
  if (spec.template_id === "annotated-field-board") return annotatedFieldBoard(spec);
  if (spec.template_id === "architectural-spec") return architecturalSpec(spec);
  if (spec.template_id === "trend-grid-report") return trendGridReport(spec);
  if (spec.template_id === "serif-stat-editorial") return serifStatEditorial(spec);
  if (spec.template_id === "poster-stat-punch") return posterStatPunch(spec);
  const debugFallbackConfig = BEAUTIFUL_TEMPLATE_CONFIGS[spec.template_id];
  if (debugFallbackConfig && (spec.selection_scope === "debug" || spec.selection_scope === "fixture" || spec.debug === true)) {
    return beautifulTemplate(spec, debugFallbackConfig);
  }
  throw new Error(`unsupported template_id for Satori adapter: ${spec.template_id}`);
}

// render.mjs
var SATORI_VERSION = "0.26.0";
var RESVG_VERSION = "2.6.2";
var DEFAULT_FONT_FAMILY2 = "SVGlideDefault";
var EMBED_FONT_FOR_PNG_ENV = "SVGLIDE_SATORI_EMBED_FONT_FOR_PNG";
var DEFAULT_FONT_CANDIDATES = [
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/System/Library/Fonts/Supplemental/Verdana.ttf",
  "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "C:\\Windows\\Fonts\\arial.ttf"
];
async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}
async function resolveFontPath(candidates = DEFAULT_FONT_CANDIDATES) {
  if (process2.env.SVGLIDE_SATORI_FONT_PATH) {
    return process2.env.SVGLIDE_SATORI_FONT_PATH;
  }
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  for (const candidate of DEFAULT_FONT_CANDIDATES) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    "no usable Satori font found; set SVGLIDE_SATORI_FONT_PATH to a .ttf/.otf font available on this machine"
  );
}
async function readFontManifest() {
  const manifestUrl = new URL("./font-manifest.json", import.meta.url);
  return JSON.parse(await fs.readFile(manifestUrl, "utf8"));
}
function roleFontLoadOverrides(spec = {}) {
  const typography = spec?.theme?.typography;
  const candidates = typography?.font_role_candidates && typeof typography.font_role_candidates === "object" ? typography.font_role_candidates : {};
  const weights = typography?.font_role_weights && typeof typography.font_role_weights === "object" ? typography.font_role_weights : {};
  const styles = typography?.font_role_styles && typeof typography.font_role_styles === "object" ? typography.font_role_styles : {};
  const result = {};
  for (const role31 of REQUIRED_FONT_ROLES) {
    result[role31] = {
      candidates: Array.isArray(candidates[role31]) ? candidates[role31].filter((item) => typeof item === "string" && item) : null,
      weight: typeof weights[role31] === "number" ? weights[role31] : null,
      style: typeof styles[role31] === "string" && styles[role31] ? styles[role31] : null
    };
  }
  return result;
}
async function loadFonts(spec = {}) {
  const manifest = await readFontManifest();
  const manifestRoles = manifest.roles || {};
  const themeRoles = fontRolesFromTheme(spec);
  const requestedRoles = fontRoleAliasesFromTheme(spec);
  const roleOverrides2 = roleFontLoadOverrides(spec);
  const fonts = [];
  const seen = /* @__PURE__ */ new Set();
  const resolvedRoles = {};
  async function addFont({ family, weight = 400, style = "normal", candidates = DEFAULT_FONT_CANDIDATES, role: role31 = null, source = "manifest" }) {
    const fontPath = await resolveFontPath(candidates);
    const key = `${family}:${weight}:${style}:${fontPath}`;
    if (!seen.has(key)) {
      const data2 = await fs.readFile(fontPath);
      fonts.push({ name: family, data: data2, weight, style, path: fontPath });
      seen.add(key);
    }
    if (role31) {
      resolvedRoles[role31] = { family, weight, style, path: fontPath, source };
    }
  }
  await addFont({ family: manifest.default_family || DEFAULT_FONT_FAMILY2, weight: 400, source: "default" });
  for (const role31 of REQUIRED_FONT_ROLES) {
    const manifestRole = manifestRoles[role31] || {};
    const themeRole = themeRoles[role31] || {};
    const loadOverride = roleOverrides2[role31] || {};
    await addFont({
      family: themeRole.family || manifestRole.family || DEFAULT_FONT_FAMILY2,
      weight: typeof loadOverride.weight === "number" ? loadOverride.weight : typeof manifestRole.weight === "number" ? manifestRole.weight : 400,
      style: loadOverride.style || manifestRole.style || "normal",
      candidates: Array.isArray(loadOverride.candidates) && loadOverride.candidates.length ? loadOverride.candidates : Array.isArray(manifestRole.candidates) ? manifestRole.candidates : DEFAULT_FONT_CANDIDATES,
      role: role31,
      source: requestedRoles[role31] ? "theme.typography.font_roles" : "manifest"
    });
  }
  return {
    fonts,
    primaryFont: fonts[0],
    receipt: {
      version: "svglide-artboard-font-receipt/v1",
      default_family: manifest.default_family || DEFAULT_FONT_FAMILY2,
      requested_roles: requestedRoles,
      resolved_roles: resolvedRoles,
      font_count: fonts.length,
      font_paths: Array.from(new Set(fonts.map((font) => font.path)))
    }
  };
}
async function loadSatori() {
  try {
    return (await import("satori")).default;
  } catch (error) {
    console.error("satori dependency is not available in this adapter runtime");
    console.error("development fix: run pnpm install --frozen-lockfile in skills/lark-slides/scripts/artboard_renderer");
    console.error("release fix: install satori as an external runtime dependency before running dist/render.mjs --check-runtime");
    console.error(String(error?.message || error));
    process2.exit(3);
  }
}
async function loadResvg() {
  try {
    return (await import("@resvg/resvg-js")).Resvg;
  } catch (error) {
    console.error("@resvg/resvg-js native dependency is not available in this adapter runtime");
    console.error("fix: run pnpm --dir skills/lark-slides/scripts/artboard_renderer install --frozen-lockfile");
    console.error("release fix: install the platform-native @resvg/resvg-js package before running dist/render.mjs --check-runtime");
    console.error(String(error?.message || error));
    process2.exit(4);
  }
}
async function checkRuntime() {
  await loadSatori();
  const Resvg = await loadResvg();
  const fontBundle = await loadFonts({});
  const probe = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#000"/></svg>';
  new Resvg(probe).render().asPng();
  console.log(JSON.stringify({ ok: true, renderer: "satori-resvg", satori_version: SATORI_VERSION, resvg_version: RESVG_VERSION, font_path: fontBundle.primaryFont.path, font_receipt: fontBundle.receipt }));
}
function boolEnv(name) {
  return ["1", "true", "yes", "on"].includes(String(process2.env[name] || "").toLowerCase());
}
async function renderSatoriSvg(satori, spec, fonts, { embedFont = false, onNodeDetected = null } = {}) {
  return await satori(renderTree(spec), {
    width: 960,
    height: 540,
    embedFont,
    fonts,
    ...onNodeDetected ? { onNodeDetected } : {}
  });
}
function serializeObservation(node2) {
  const props = node2?.props || {};
  const safeProps = {};
  for (const [key, value15] of Object.entries(props)) {
    if (key.startsWith("data-") && ["string", "number", "boolean"].includes(typeof value15)) {
      safeProps[key] = value15;
    }
  }
  return {
    left: node2?.left,
    top: node2?.top,
    width: node2?.width,
    height: node2?.height,
    type: node2?.type,
    key: node2?.key,
    textContent: node2?.textContent,
    props: safeProps
  };
}
async function main() {
  const [, , inputPath, outputPath, pngPath, metadataPath, observationsPath] = process2.argv;
  if (inputPath === "--check-runtime") {
    await checkRuntime();
    return;
  }
  if (!inputPath || !outputPath) {
    console.error("usage: node render.mjs <canvas-spec.json> <output.svg> [output.png] [metadata.json]");
    process2.exit(2);
  }
  const satori = await loadSatori();
  const Resvg = await loadResvg();
  const spec = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const fontBundle = await loadFonts(spec);
  const typographyRoles = typographyRolesFromTheme(spec);
  const textStyleRoles = spec.theme?.typography?.text_style_roles || {};
  const observations = [];
  const svg = await renderSatoriSvg(satori, spec, fontBundle.fonts, {
    embedFont: false,
    onNodeDetected: (node2) => {
      observations.push(serializeObservation(node2));
    }
  });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, svg);
  let pngBytes = null;
  let pngFontEmbeddingMode = "same_as_output_svg";
  if (pngPath) {
    const pngSvg = boolEnv(EMBED_FONT_FOR_PNG_ENV) ? await renderSatoriSvg(satori, spec, fontBundle.fonts, { embedFont: true }) : svg;
    pngFontEmbeddingMode = pngSvg === svg ? "same_as_output_svg" : "embedded_font_preview_only";
    pngBytes = new Resvg(pngSvg, {
      fitTo: { mode: "width", value: 960 },
      font: { loadSystemFonts: true }
    }).render().asPng();
    await fs.mkdir(path.dirname(pngPath), { recursive: true });
    await fs.writeFile(pngPath, pngBytes);
  }
  if (metadataPath) {
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(
      metadataPath,
      JSON.stringify(
        {
          node_version: process2.version,
          satori_version: SATORI_VERSION,
          resvg_version: RESVG_VERSION,
          font_path: fontBundle.primaryFont.path,
          font_paths: fontBundle.receipt.font_paths,
          font_receipt: fontBundle.receipt,
          family_id: spec.family_id || spec.source_family || null,
          page_role: spec.page_role || null,
          page_variant_id: spec.page_variant_id || null,
          renderer_variant_id: spec.renderer_variant_id || spec.page_variant_id || spec.page_role || null,
          font_roles: fontBundle.receipt.resolved_roles,
          typography_roles: typographyRoles,
          text_style_roles: textStyleRoles,
          typography_strategy_source: spec.theme?.typography?.strategy_source || null,
          png_font_embedding_mode: pngFontEmbeddingMode,
          png_bytes: pngBytes ? pngBytes.length : null
        },
        null,
        2
      ) + "\n"
    );
  }
  if (observationsPath) {
    await fs.mkdir(path.dirname(observationsPath), { recursive: true });
    await fs.writeFile(
      observationsPath,
      JSON.stringify(
        {
          version: "svglide-node-observations/v1",
          observation_source: "satori_on_node_detected",
          nodes: observations
        },
        null,
        2
      ) + "\n"
    );
  }
}
main();
