import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'executive-dashboard'

const PAGE_VARIANTS = ['cover', 'agenda', 'metrics', 'dashboard', 'split', 'bars', 'quote', 'timeline', 'detail', 'closing']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'production',
  renderer_stage: 'closed_loop_sample',
  default_selectable: true,
  selection_scope: 'production',
  source_family: 'blue-professional',
  page_family: {
    family_id: 'blue-professional',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'agenda', 'closing'],
      repeatable: ['metrics', 'dashboard', 'split', 'bars', 'quote', 'timeline', 'detail']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/blue-professional-1.png'
}

function colorWithAlpha(value, alpha, fallback) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value || '').trim())
  if (!match) return fallback
  const hex = match[1]
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  const primary = source.primary || '#1E2BFA'
  const border = source.border || colorWithAlpha(primary, 0.2, 'rgba(30, 43, 250, 0.2)')
  return {
    background: source.background || '#FDFAE7',
    panel: source.panel || '#FFFFFF',
    surface: source.surface || '#F5F7FF',
    primary,
    accent: source.accent || primary,
    text: source.text || '#111111',
    muted: source.muted || '#6B6B6B',
    border,
    cardBg: source.cardBg || colorWithAlpha(primary, 0.04, 'rgba(30, 43, 250, 0.04)'),
    accentLight: source.accentLight || source.surface || colorWithAlpha(primary, 0.08, 'rgba(30, 43, 250, 0.08)'),
    borderSoft: source.borderSoft || border
  }
}

const SOURCE_TEXT_LIGHT = '#9A9A9A'
const SOURCE_POSITIVE = '#059669'
const SOURCE_NEGATIVE = '#DC2626'

const FONT_ROLE_RESOLVERS = {
  display: (spec) => fontRole('display', spec),
  body: (spec) => fontRole('body', spec),
  label: (spec) => fontRole('label', spec),
  metric: (spec) => fontRole('metric', spec)
}

const ROLE_FONT_FLOORS = {
  display: 29,
  body: 12,
  label: 9,
  metric: 14
}

function role(roleName, spec, style = {}) {
  const resolver = FONT_ROLE_RESOLVERS[roleName] || ((input) => fontRole(roleName, input))
  const { minFontSize, allowSmallText, ...styleWithoutControlFields } = style
  const merged = { ...resolver(spec), ...styleWithoutControlFields }
  const floor = allowSmallText
    ? 9
    : typeof minFontSize === 'number'
      ? minFontSize
      : ROLE_FONT_FLOORS[roleName]
  if (typeof floor === 'number' && typeof merged.fontSize === 'number' && merged.fontSize < floor) {
    return { ...merged, fontSize: floor }
  }
  return merged
}

function text(spec, key, fallback = '') {
  const value = spec.content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function approximateTextWidth(value, fontSize, letterSpacing = 0) {
  return Array.from(String(value || '')).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28
    if (/[\u4e00-\u9fff]/.test(char)) return width + fontSize
    if (/[A-Za-z0-9]/.test(char)) return width + fontSize * 0.64 + letterSpacing
    return width + fontSize * 0.58 + letterSpacing
  }, 0)
}

function estimateWrappedLineCount(value, width, fontSize, letterSpacing = 0) {
  const words = String(value || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (!words.length) return 1
  let lines = 1
  let currentWidth = 0
  const spaceWidth = fontSize * 0.28
  for (const word of words) {
    const wordWidth = approximateTextWidth(word, fontSize, letterSpacing)
    const nextWidth = currentWidth ? currentWidth + spaceWidth + wordWidth : wordWidth
    if (currentWidth && nextWidth > width) {
      lines += Math.max(1, Math.ceil(wordWidth / width))
      currentWidth = wordWidth > width ? wordWidth % width : wordWidth
    } else {
      currentWidth = nextWidth
    }
  }
  return lines
}

function titleLayout(spec, top, width, options = {}) {
  const title = text(spec, 'title', 'Market Outlook')
  const minFontSize = options.minFontSize || 34
  const maxLines = options.maxLines || 3
  let fontSize = options.fontSize || 42
  let displayStyle = role('display', spec, {
    fontSize,
    lineHeight: options.lineHeight || 1,
    fontWeight: 900
  })
  let lineCount = estimateWrappedLineCount(title, width, fontSize, Number(displayStyle.letterSpacing || 0))
  while (lineCount > maxLines && fontSize > minFontSize) {
    fontSize -= 2
    displayStyle = role('display', spec, {
      fontSize,
      lineHeight: options.lineHeight || 1,
      fontWeight: 900
    })
    lineCount = estimateWrappedLineCount(title, width, fontSize, Number(displayStyle.letterSpacing || 0))
  }
  const titleTop = top + 26
  const titleHeight = Math.ceil(lineCount * fontSize * Number(displayStyle.lineHeight || 1))
  return {
    title,
    titleTop,
    titleHeight,
    titleStyle: displayStyle,
    subtitleTop: titleTop + titleHeight + (options.subtitleGap || 14)
  }
}

function list(spec, keys, fallback = []) {
  for (const key of keys) {
    const value = spec.content?.[key]
    if (Array.isArray(value)) {
      const cleaned = value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
      if (cleaned.length) return cleaned
    }
  }
  return fallback
}

function metricList(spec) {
  const raw = spec.content?.metrics
  if (Array.isArray(raw) && raw.length) return raw
  return ['+18% Revenue', '4 Regions', '92 NPS', '3 Priorities']
}

function variantId(spec) {
  const raw = spec.page_variant_id || spec.page_role || 'dashboard'
  const normalized = String(raw).toLowerCase().replace(/^data_/, '').replace(/^process_or_/, '')
  if (normalized === 'toc') return 'agenda'
  if (normalized === 'timeline') return 'timeline'
  if (PAGE_VARIANTS.includes(normalized)) return normalized
  throw new Error(`unsupported page_variant_id for executive-dashboard: ${raw}`)
}

function shell(spec, variant, children = []) {
  const theme = colors(spec)
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      backgroundColor: theme.background,
      color: theme.text,
      overflow: 'hidden'
    },
    [
      box({ position: 'absolute', left: 0, top: 0, width: 960, height: 540, backgroundColor: theme.background }),
      box({ position: 'absolute', left: 0, bottom: 0, width: 96, height: 2, backgroundColor: theme.primary }),
      TextBlock(String(variant || '').toUpperCase(), {
        position: 'absolute',
        right: 48,
        top: 30,
        color: theme.primary,
        fontSize: 10,
        letterSpacing: 1,
        ...role('label', spec, { fontSize: 10, lineHeight: 1 })
      }),
      TextBlock(text(spec, 'footer', 'Q2 2026 · Confidential'), {
        position: 'absolute',
        left: 48,
        bottom: 22,
        width: 260,
        color: theme.muted,
        ...role('label', spec, { fontSize: 8, lineHeight: 1 })
      }),
      ...children
    ]
  )
}

function titleBlock(spec, top = 74, width = 560, options = {}) {
  const theme = colors(spec)
  const layout = titleLayout(spec, top, width, options)
  return [
    TextBlock(text(spec, 'eyebrow', 'EXECUTIVE REVIEW').toUpperCase(), {
      position: 'absolute',
      left: 56,
      top,
      color: theme.primary,
      letterSpacing: 1.4,
      ...role('label', spec, { fontSize: 11, lineHeight: 1 })
    }),
    Title(layout.title, {
      position: 'absolute',
      left: 56,
      top: layout.titleTop,
      width,
      color: theme.text,
      ...layout.titleStyle
    }),
    TextBlock(text(spec, 'subtitle', 'An analytical overview of priorities, evidence, and operating decisions.'), {
      position: 'absolute',
      left: 58,
      top: layout.subtitleTop,
      width: Math.min(width + 80, 610),
      color: theme.muted,
      ...role('body', spec, { fontSize: 13, lineHeight: 1.35 })
    })
  ]
}

function numberLabel(spec, value, style = {}) {
  const theme = colors(spec)
  return TextBlock(String(value).padStart(2, '0'), {
    color: theme.primary,
    ...role('label', spec, { fontSize: 13, fontWeight: 900, lineHeight: 1 }),
    ...style
  })
}

function sourceShell(spec, children = []) {
  const theme = colors(spec)
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      backgroundColor: theme.background,
      color: theme.text,
      overflow: 'hidden'
    },
    [
      box({ position: 'absolute', left: 0, top: 0, width: 960, height: 540, backgroundColor: theme.background }),
      ...children
    ].filter(Boolean)
  )
}

function sourceHeader(spec, eyebrowFallback, tagFallback) {
  const theme = colors(spec)
  return [
    TextBlock(text(spec, 'eyebrow', eyebrowFallback).toUpperCase(), {
      position: 'absolute',
      left: 58,
      top: 58,
      color: theme.primary,
      letterSpacing: 0.9,
      ...role('label', spec, { fontSize: 10.5, fontWeight: 700, lineHeight: 1 })
    }),
    TextBlock(text(spec, 'tag', tagFallback), {
      position: 'absolute',
      right: 58,
      top: 52,
      color: theme.primary,
      backgroundColor: theme.accentLight,
      borderRadius: 999,
      padding: '5px 12px',
      ...role('label', spec, { fontSize: 9, fontWeight: 700, lineHeight: 1 })
    })
  ]
}

function sourceTitle(spec, fallback, style = {}) {
  const theme = colors(spec)
  return Title(text(spec, 'title', fallback), {
    position: 'absolute',
    left: 58,
    top: 94,
    width: 810,
    color: theme.text,
    ...role('display', spec, { fontSize: 30, lineHeight: 1.12, fontWeight: 800, textTransform: 'none' }),
    ...style
  })
}

const SOURCE_DASHBOARD_STATS = [
  ['22%', 'of respondents', 'Bullish for the current calendar year', 'Steady from prior quarter, anchored by tariff and policy uncertainty.'],
  ['51%', 'of respondents', 'Bullish for the next calendar year', 'Up from 38% last quarter as the rate path firms up.'],
  ['60%', 'of respondents', 'More bullish on the economy than three months ago', 'A 22-point improvement, the largest sentiment swing in two years.'],
  ['53%', 'of respondents', 'More bullish on equities than three months ago', 'Tech and financials led the upgrade; energy and utilities lag.'],
  ['3.6%', 'median', 'Expected inflation rate for the next two years', 'Down 0.4 pts; long-run expectations remain anchored at 3.0%.'],
  ['2.7%', 'median', 'Expected real GDP growth for the next two years', 'A modest upgrade reflecting easing recession fears.']
]

const SOURCE_BARS = [
  ['Consumer price inflation', 79],
  ['Interest rates & central bank policy', 69],
  ['Geopolitical risks', 39],
  ['Liquidity tightening in capital markets', 37],
  ['Asset price volatility', 25],
  ['Public-sector debt & spending', 22],
  ['Climate & ESG-related risks', 18]
]

const SOURCE_DETAIL_BLOCKS = [
  ['Assuming higher cost of capital', ['Using elevated discount rates to reflect tighter monetary conditions', 'Shifting hurdle rates for internal capital allocation decisions', 'Emphasizing shorter payback periods for new projects']],
  ['Cash flow & balance sheet focus', ['Prioritizing free cash flow generation as a key screening metric', 'Analyzing working capital needs under inflationary input costs', 'Reviewing leverage ratios and refinancing schedules']],
  ['More conservative valuation approach', ['Greater weight assigned to downside and bear-case scenarios', 'Reduced reliance on long-dated terminal value assumptions', 'Increased sensitivity analysis around key drivers']],
  ['Bottom-up stock selection', ['Reducing macro-driven top-down factor exposures', 'Intensifying fundamental research at the security level', 'Building conviction through differentiated data sources']],
  ['Value over growth momentum', ['Pivoting toward earnings-supported valuations', 'Favoring demonstrable unit economics over scale narratives', 'Reassessing premium multiples for unprofitable segments']],
  ['Shorter-term orientation', ['Narrowing forecasting windows for revenue and margin', 'More frequent reassessment of position sizing', 'Active hedging around event-driven volatility']]
]

const SOURCE_AGENDA_ITEMS = [
  ['01', 'Executive Summary', 'High-level findings and key takeaways from the latest quarterly assessment.'],
  ['02', 'Macroeconomic Sentiment', 'Investor perspectives on growth, inflation, and risk factors in the current environment.'],
  ['03', 'Capital Allocation Trends', 'How portfolios are shifting in response to policy changes and volatility signals.'],
  ['04', 'Strategic Recommendations', 'Actionable priorities for leadership teams navigating an uncertain landscape.'],
  ['05', 'Risk & Opportunity Matrix', 'Evaluating the trade-offs between defensive positioning and offensive growth bets.'],
  ['06', 'Conclusion & Next Steps', 'Summary of implications and recommended follow-up actions for stakeholders.']
]

const SOURCE_METRIC_CARDS = [
  {
    value: '73%',
    label: 'Bullish on three-year outlook',
    description: 'An all-time series high, reflecting renewed confidence in medium-term fundamentals despite near-term uncertainty.',
    supports: ['Highest reading since the survey began in 2018', 'Cross-sector consensus, led by tech and industrials', 'Driven by clarity on rate trajectory and AI capex'],
    change: '↑ +11 pts vs. prior quarter',
    sentiment: 'positive'
  },
  {
    value: '55%',
    label: 'Expect recession before year-end',
    description: 'Down significantly from the prior reading, indicating easing fears of a severe or prolonged contraction.',
    supports: ['Soft-landing scenario now the modal expectation', 'Median timeline pushed from Q2 to Q4', 'Severity expectations also moderated meaningfully'],
    change: '↓ -36 pts vs. prior quarter',
    sentiment: 'positive'
  },
  {
    value: '4.5%',
    label: 'Median inflation expectation',
    description: 'Investors expect price pressures to remain elevated through the end of the current calendar year.',
    supports: ['Wage and services inflation remain the stickiest', 'Energy disinflation slower than originally modeled', 'Long-run anchor steady at 3% for the next decade'],
    change: '↑ +0.3 pts vs. prior quarter',
    sentiment: 'negative'
  }
]

const SOURCE_SPLIT_POINTS = [
  'Growth and protecting the top line remain the leading priority, cited by a clear majority as essential in the current cycle.',
  'Cash flow resilience has risen sharply in importance as liquidity conditions tightened across credit markets through Q3.',
  'Supply chain stability ranks consistently high, reflecting the lasting operational scars of recent global disruptions.',
  'Margin preservation and cost discipline have moved from defensive levers to first-line strategy in investor conversations.',
  'AI capex remains the most-discussed structural theme, but with rising attention to monetization timelines.'
]

const SOURCE_SPLIT_MINI_STATS = [
  ['63%', 'Prioritize top-line growth'],
  ['55%', 'Prioritize cash flow resilience'],
  ['33%', 'Prioritize supply chain stability']
]

const SOURCE_TIMELINE_STEPS = [
  ['1', 'Assess Resilience', 'Evaluate balance sheet strength and operational buffers under stress scenarios.'],
  ['2', 'Protect Core Revenue', 'Defend market position and pricing power in segments with durable demand.'],
  ['3', 'Optimize Costs', 'Streamline overhead while preserving capacity for high-return investments.'],
  ['4', 'Selective Growth', 'Deploy capital toward opportunities with clear path to profitability.']
]

function dashboardStats(spec) {
  const raw = spec.content?.stats
  if (Array.isArray(raw) && raw.length) {
    return raw.slice(0, 6).map((item) => ({
      value: String(item.value || ''),
      unit: String(item.unit || ''),
      name: String(item.name || ''),
      context: String(item.context || '')
    }))
  }
  return SOURCE_DASHBOARD_STATS.map(([value, unit, name, context]) => ({ value, unit, name, context }))
}

function sourceBars(spec) {
  const raw = spec.content?.bars
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 7).map((item) => ({ label: String(item.label || ''), value: Number(item.value || 0) }))
  }
  return SOURCE_BARS.map(([label, value]) => ({ label, value }))
}

function detailBlocks(spec) {
  const raw = spec.content?.details
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 6).map((item) => ({
      title: String(item.title || ''),
      items: Array.isArray(item.items) ? item.items.slice(0, 3).map((entry) => String(entry || '')) : []
    }))
  }
  return SOURCE_DETAIL_BLOCKS.map(([title, items]) => ({ title, items }))
}

function agendaItems(spec) {
  const raw = spec.content?.agenda
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 6).map((item, index) => ({
      number: String(item.number || String(index + 1).padStart(2, '0')),
      title: String(item.title || ''),
      description: String(item.description || '')
    }))
  }
  return SOURCE_AGENDA_ITEMS.map(([number, title, description]) => ({ number, title, description }))
}

function sourceMetricCards(spec) {
  const raw = spec.content?.metrics
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 3).map((item) => ({
      value: String(item.value || ''),
      label: String(item.label || ''),
      description: String(item.description || ''),
      supports: Array.isArray(item.supports) ? item.supports.slice(0, 3).map((entry) => String(entry || '')) : [],
      change: String(item.change || ''),
      sentiment: String(item.sentiment || 'positive')
    }))
  }
  return SOURCE_METRIC_CARDS.map((item) => ({ ...item, supports: [...item.supports] }))
}

function splitPoints(spec) {
  const raw = spec.content?.left_points
  if (Array.isArray(raw) && raw.length) return raw.slice(0, 5).map((entry) => String(entry || ''))
  return [...SOURCE_SPLIT_POINTS]
}

function splitMiniStats(spec) {
  const raw = spec.content?.mini_stats
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 3).map((item) => ({ value: String(item.value || ''), label: String(item.label || '') }))
  }
  return SOURCE_SPLIT_MINI_STATS.map(([value, label]) => ({ value, label }))
}

function timelineSteps(spec) {
  const raw = spec.content?.timeline
  if (Array.isArray(raw) && raw.length && typeof raw[0] === 'object') {
    return raw.slice(0, 4).map((item, index) => ({
      number: String(item.number || index + 1),
      title: String(item.title || ''),
      description: String(item.description || '')
    }))
  }
  return SOURCE_TIMELINE_STEPS.map(([number, title, description]) => ({ number, title, description }))
}

function renderCover(spec) {
  const theme = colors(spec)
  const coverTitle = text(spec, 'title', 'Market Outlook & Strategic Priorities')
  const titleLines = coverTitle.includes('\n')
    ? coverTitle.split('\n').slice(0, 2)
    : [coverTitle]
  return sourceShell(spec, [
    box({
      position: 'absolute',
      right: -78,
      top: 0,
      width: 360,
      height: 540,
      backgroundColor: theme.accentLight,
      transform: 'skewX(-10deg)'
    }),
    box({ position: 'absolute', left: 77, top: 177, width: 30, height: 3, backgroundColor: theme.primary, borderRadius: 2 }),
    Title(titleLines[0], {
      position: 'absolute',
      left: 77,
      top: 190,
      width: 470,
      color: theme.text,
      ...role('display', spec, { fontSize: 45, lineHeight: 1.02, fontWeight: 900, textTransform: 'none' })
    }),
    titleLines[1] ? Title(titleLines[1], {
      position: 'absolute',
      left: 77,
      top: 236,
      width: 470,
      color: theme.text,
      ...role('display', spec, { fontSize: 45, lineHeight: 1.02, fontWeight: 900, textTransform: 'none' })
    }) : null,
    TextBlock(text(spec, 'subtitle', 'An analytical overview of emerging trends, shifting investor sentiment, and the key decisions shaping the next growth cycle.'), {
      position: 'absolute',
      left: 78,
      top: 305,
      width: 430,
      color: theme.muted,
      ...role('body', spec, { fontSize: 14, lineHeight: 1.45 })
    }),
    TextBlock(text(spec, 'meta', 'Q2 2026 · Confidential'), {
      position: 'absolute',
      left: 78,
      top: 370,
      width: 220,
      color: SOURCE_TEXT_LIGHT,
      letterSpacing: 0.4,
      ...role('label', spec, { fontSize: 9, lineHeight: 1, textTransform: 'none' })
    }),
    box({ position: 'absolute', right: 77, bottom: 70, width: 28, height: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
      Array.from({ length: 9 }).map(() => box({ width: 3, height: 3, backgroundColor: theme.primary, opacity: 0.25 }))
    )
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const items = agendaItems(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Table of Contents', 'Overview'),
    box({ position: 'absolute', left: 58, top: 88, width: 60, height: 3, borderRadius: 2, backgroundColor: theme.primary }),
    box({ position: 'absolute', left: 58, top: 132, width: 844, height: 318, flexDirection: 'row', flexWrap: 'wrap', gap: '14px 30px' },
      items.map((item) =>
        box({ width: 407, height: 96, borderBottom: `1px solid ${theme.borderSoft}`, padding: '14px 0 12px 0', flexDirection: 'row', alignItems: 'flex-start' }, [
          TextBlock(item.number, { width: 48, color: theme.primary, ...role('metric', spec, { fontSize: 20, fontWeight: 700, lineHeight: 1 }) }),
          box({ width: 340, flexDirection: 'column' }, [
            TextBlock(item.title, { color: theme.text, marginBottom: 7, ...role('body', spec, { fontSize: 14, fontWeight: 700, lineHeight: 1.2 }) }),
            TextBlock(item.description, { color: theme.muted, ...role('body', spec, { fontSize: 11.5, lineHeight: 1.35 }) })
          ])
        ])
      )
    )
  ])
}

function renderMetrics(spec) {
  const theme = colors(spec)
  const metrics = sourceMetricCards(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Executive Summary', 'Key Findings'),
    sourceTitle(spec, 'Sentiment has shifted measurably from the prior quarter', { width: 790 }),
    box({ position: 'absolute', left: 58, top: 152, width: 844, height: 268, flexDirection: 'row', gap: 16 },
      metrics.map((item) =>
        box({ width: 270, height: 266, position: 'relative', backgroundColor: theme.cardBg, border: `1px solid ${theme.borderSoft}`, borderRadius: 12 }, [
          TextBlock(item.value, { position: 'absolute', left: 18, top: 18, width: 220, color: theme.primary, ...role('metric', spec, { fontSize: 38, fontWeight: 700, lineHeight: 1 }) }),
          TextBlock(item.label, { position: 'absolute', left: 18, top: 68, width: 232, color: theme.text, ...role('body', spec, { fontSize: 14, fontWeight: 700, lineHeight: 1.18 }) }),
          TextBlock(item.description, { position: 'absolute', left: 18, top: 103, width: 232, color: theme.muted, ...role('body', spec, { fontSize: 11.5, minFontSize: 11.5, lineHeight: 1.28 }) }),
          box({ position: 'absolute', left: 18, top: 164, width: 234, height: 1, backgroundColor: theme.borderSoft }),
          box({ position: 'absolute', left: 18, top: 180, width: 232, flexDirection: 'row', alignItems: 'flex-start' }, [
            TextBlock('-', { width: 10, color: SOURCE_TEXT_LIGHT, ...role('body', spec, { fontSize: 10.5, lineHeight: 1.2 }) }),
            TextBlock(item.supports[0] || item.change, { width: 216, color: theme.muted, ...role('body', spec, { fontSize: 10.5, lineHeight: 1.24 }) })
          ]),
          TextBlock(item.change, { position: 'absolute', left: 18, bottom: 14, width: 232, color: item.sentiment === 'negative' ? SOURCE_NEGATIVE : SOURCE_POSITIVE, ...role('label', spec, { fontSize: 10, fontWeight: 700, lineHeight: 1, textTransform: 'none' }) })
        ])
      )
    )
  ])
}

function renderDashboard(spec) {
  const theme = colors(spec)
  const stats = dashboardStats(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Macroeconomic Sentiment', 'Data Overview'),
    sourceTitle(spec, 'Current perspectives on the economy and markets'),
    box({ position: 'absolute', left: 58, top: 158, width: 844, height: 244, flexDirection: 'row', flexWrap: 'wrap', gap: '14px 12px' },
      stats.map((item) =>
        box({ width: 273, height: 114, backgroundColor: theme.cardBg, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, padding: '13px 14px', flexDirection: 'column' }, [
          box({ flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 }, [
            TextBlock(item.value, { color: theme.primary, marginRight: 6, ...role('metric', spec, { fontSize: 28, fontWeight: 700, lineHeight: 1 }) }),
            TextBlock(item.unit, { color: SOURCE_TEXT_LIGHT, ...role('body', spec, { fontSize: 10, lineHeight: 1 }) })
          ]),
          TextBlock(item.name, { color: theme.text, marginBottom: 7, ...role('body', spec, { fontSize: 12.5, fontWeight: 600, lineHeight: 1.22 }) }),
          box({ width: 244, height: 1, backgroundColor: theme.borderSoft, marginBottom: 6 }),
          TextBlock(item.context, { color: SOURCE_TEXT_LIGHT, ...role('body', spec, { fontSize: 10.5, lineHeight: 1.25 }) })
        ])
      )
    )
  ])
}

function renderSplit(spec) {
  const theme = colors(spec)
  const points = splitPoints(spec)
  const miniStats = splitMiniStats(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Investor Priorities', 'Analysis'),
    sourceTitle(spec, 'What investors want companies to focus on right now', { width: 720 }),
    box({ position: 'absolute', left: 58, top: 154, width: 420, height: 250, flexDirection: 'column', gap: 11 },
      points.map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'flex-start' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { width: 34, color: theme.primary, letterSpacing: 0.4, ...role('label', spec, { fontSize: 10, fontWeight: 700, lineHeight: 1.35 }) }),
          TextBlock(item, { width: 370, color: theme.text, ...role('body', spec, { fontSize: 12, lineHeight: 1.35 }) })
        ])
      )
    ),
    box({ position: 'absolute', left: 512, top: 149, width: 2, height: 250, backgroundColor: theme.borderSoft }),
    box({ position: 'absolute', left: 560, top: 145, width: 342, minHeight: 74, backgroundColor: theme.accentLight, borderLeft: `4px solid ${theme.primary}`, borderRadius: 10, padding: '14px 16px', flexDirection: 'column' }, [
      TextBlock(text(spec, 'quote', '"The shift from growth-at-all-costs to profitable, sustainable expansion is the defining theme of this cycle."'), { color: theme.text, ...role('display', spec, { fontSize: 17, minFontSize: 17, fontWeight: 600, lineHeight: 1.28, textTransform: 'none' }) }),
      TextBlock(text(spec, 'author', 'Senior PM, multi-strategy fund').toUpperCase(), { marginTop: 8, color: theme.muted, letterSpacing: 0.45, ...role('label', spec, { fontSize: 9, fontWeight: 700, lineHeight: 1 }) })
    ]),
    box({ position: 'absolute', left: 560, top: 244, width: 342, height: 64, flexDirection: 'row', gap: 10 },
      miniStats.map((item) =>
        box({ width: 107, height: 62, backgroundColor: theme.cardBg, border: `1px solid ${theme.borderSoft}`, borderRadius: 9, padding: '10px 11px', flexDirection: 'column' }, [
          TextBlock(item.value, { color: theme.primary, marginBottom: 5, ...role('metric', spec, { fontSize: 20, fontWeight: 700, lineHeight: 1 }) }),
          TextBlock(item.label, { color: theme.muted, ...role('body', spec, { fontSize: 10, lineHeight: 1.25 }) })
        ])
      )
    ),
    TextBlock(text(spec, 'note', 'Notably absent from the top of the list: ESG-led capital allocation, which has dropped 24 points year-over-year as investors recalibrate toward returns-first mandates.'), {
      position: 'absolute',
      left: 560,
      top: 333,
      width: 330,
      color: theme.muted,
      ...role('body', spec, { fontSize: 11.5, lineHeight: 1.35 })
    })
  ])
}

function renderBars(spec) {
  const theme = colors(spec)
  const bars = sourceBars(spec)
  const trackWidth = 540
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Risk Factors', 'Ranking'),
    sourceTitle(spec, 'Most important macroeconomic concerns among investors', { width: 760 }),
    box({ position: 'absolute', left: 58, top: 184, width: 846, height: 238, flexDirection: 'column', gap: 8 },
      bars.map((item) => {
        const fillWidth = Math.max(0, Math.min(trackWidth, Math.round((Number(item.value) / 100) * trackWidth)))
        return box({ height: 24, flexDirection: 'row', alignItems: 'center' }, [
          TextBlock(item.label, { width: 248, color: theme.text, ...role('body', spec, { fontSize: 12, fontWeight: 600, lineHeight: 1.15 }) }),
          box({ width: trackWidth, height: 14, backgroundColor: theme.accentLight, borderRadius: 5, overflow: 'hidden' }, [
            box({ width: fillWidth, height: 14, backgroundColor: theme.primary, borderRadius: 5 })
          ]),
          TextBlock(`${item.value}%`, { width: 44, marginLeft: 14, color: theme.primary, textAlign: 'right', ...role('metric', spec, { fontSize: 12, minFontSize: 12, fontWeight: 700, lineHeight: 1 }) })
        ])
      })
    )
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return sourceShell(spec, [
    box({ position: 'absolute', left: 64, top: 64, width: 38, height: 38, border: `1px solid ${theme.borderSoft}`, borderRadius: 19 }),
    box({ position: 'absolute', right: 71, bottom: 76, width: 28, height: 28, backgroundColor: theme.accentLight, borderRadius: 14 }),
    TextBlock('“', { position: 'absolute', left: 440, top: 196, color: theme.primary, opacity: 0.15, ...role('display', spec, { fontSize: 70, lineHeight: 0.6, fontWeight: 700 }) }),
    TextBlock(text(spec, 'quote', 'In this environment, the companies that will win are those that can balance operational discipline with strategic flexibility.'), {
      position: 'absolute',
      left: 170,
      top: 255,
      width: 620,
      color: theme.text,
      textAlign: 'center',
      justifyContent: 'center',
      ...role('display', spec, { fontSize: 21, minFontSize: 21, lineHeight: 1.25, fontWeight: 800, textTransform: 'none' })
    }),
    TextBlock(text(spec, 'author', 'Senior Partner, Strategy Practice — Global Investment Forum 2026'), {
      position: 'absolute',
      left: 320,
      top: 319,
      width: 320,
      color: theme.muted,
      textAlign: 'center',
      justifyContent: 'center',
      ...role('body', spec, { fontSize: 10.5, fontWeight: 600, lineHeight: 1.2, textTransform: 'none' })
    })
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const items = timelineSteps(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Strategic Roadmap', 'Process'),
    sourceTitle(spec, 'Recommended approach to navigating the current cycle', { width: 760 }),
    box({ position: 'absolute', left: 128, top: 288, width: 690, height: 2, backgroundColor: theme.borderSoft }),
    ...items.map((item, index) => {
      const x = 80 + index * 235
      return box({ position: 'absolute', left: x, top: 252, width: 140, height: 125, flexDirection: 'column', alignItems: 'center', textAlign: 'center' }, [
        box({ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primary, opacity: 1 - index * 0.15, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }, [
        TextBlock(item.number, { color: theme.background, textAlign: 'center', justifyContent: 'center', ...role('metric', spec, { fontSize: 12, minFontSize: 12, fontWeight: 700, lineHeight: 1 }) })
        ]),
        TextBlock(item.title, { width: 130, color: theme.text, textAlign: 'center', justifyContent: 'center', marginBottom: 7, ...role('body', spec, { fontSize: 12.5, fontWeight: 700, lineHeight: 1.15 }) }),
        TextBlock(item.description, { width: 128, color: theme.muted, textAlign: 'center', justifyContent: 'center', ...role('body', spec, { fontSize: 10.5, minFontSize: 10.5, lineHeight: 1.25 }) })
      ])
    })
  ])
}

function renderDetail(spec) {
  const theme = colors(spec)
  const blocks = detailBlocks(spec)
  return sourceShell(spec, [
    ...sourceHeader(spec, 'Deep Dive', 'Detailed Analysis'),
    sourceTitle(spec, 'Changes in investment practices and valuation frameworks', { width: 820 }),
    box({ position: 'absolute', left: 58, top: 154, width: 844, height: 330, flexDirection: 'row', flexWrap: 'wrap', gap: '14px 28px' },
      blocks.map((item) =>
        box({ width: 408, height: 100, backgroundColor: theme.cardBg, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, padding: '12px 13px', flexDirection: 'column' }, [
          TextBlock(item.title, { color: theme.text, marginBottom: 7, ...role('body', spec, { fontSize: 12.5, fontWeight: 700, lineHeight: 1.12 }) }),
          ...item.items.slice(0, 3).map((entry) =>
            box({ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 }, [
              box({ width: 3, height: 3, marginTop: 5, marginRight: 8, borderRadius: 2, backgroundColor: theme.primary }),
              TextBlock(entry, { width: 370, color: theme.muted, ...role('body', spec, { fontSize: 10.5, minFontSize: 10.5, lineHeight: 1.22 }) })
            ])
          )
        ])
      )
    )
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const subtitleText = text(spec, 'subtitle', 'For questions or a deeper discussion of these findings, please reach out to the research team.')
  const subtitleLineCount = estimateWrappedLineCount(subtitleText, 360, 14)
  const subtitleFontSize = subtitleLineCount > 4 ? 12.5 : subtitleLineCount > 3 ? 13 : 14
  const ctaText = text(spec, 'cta', 'Download Full Report')
  const ctaWidth = Math.min(184, Math.max(140, approximateTextWidth(ctaText, 10, 0.08) + 36))
  return sourceShell(spec, [
    box({ position: 'absolute', left: 350, top: 102, width: 260, height: 260, border: `1px solid ${theme.borderSoft}`, borderRadius: 130, opacity: 0.4 }),
    box({ position: 'absolute', left: 386, top: 138, width: 188, height: 188, border: `1px solid ${theme.borderSoft}`, borderRadius: 94, opacity: 0.3 }),
    box({ position: 'absolute', left: 450, top: 199, width: 60, height: 3, borderRadius: 2, backgroundColor: theme.primary }),
    box({
      position: 'absolute',
      left: 315,
      top: 226,
      width: 330,
      minHeight: 188,
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'flex-start'
    }, [
      Title(text(spec, 'title', 'Thank You'), {
        width: 330,
        color: theme.text,
        textAlign: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        ...role('display', spec, { fontSize: 40, fontWeight: 900, lineHeight: 1.1, textTransform: 'none' })
      }),
      TextBlock(subtitleText, {
        width: 360,
        color: theme.muted,
        textAlign: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        ...role('body', spec, { fontSize: subtitleFontSize, minFontSize: 12.5, lineHeight: 1.34 })
      }),
      TextBlock(ctaText, {
        width: ctaWidth,
        minHeight: 26,
        padding: '7px 16px',
        color: theme.background,
        backgroundColor: theme.primary,
        borderRadius: 999,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        ...role('label', spec, { fontSize: 10, fontWeight: 700, lineHeight: 1, textTransform: 'none' })
      }),
      TextBlock(text(spec, 'contact', 'research@company.com · www.company.com'), {
        width: 300,
        color: theme.muted,
        textAlign: 'center',
        justifyContent: 'center',
        marginTop: 26,
        ...role('body', spec, { fontSize: 9, allowSmallText: true, lineHeight: 1 })
      })
    ])
  ])
}

export function renderExecutiveDashboard(spec) {
  const variant = variantId(spec)
  switch (variant) {
    case 'cover':
      return renderCover(spec)
    case 'agenda':
      return renderAgenda(spec)
    case 'metrics':
      return renderMetrics(spec)
    case 'dashboard':
      return renderDashboard(spec)
    case 'split':
      return renderSplit(spec)
    case 'bars':
      return renderBars(spec)
    case 'quote':
      return renderQuote(spec)
    case 'timeline':
      return renderTimeline(spec)
    case 'detail':
      return renderDetail(spec)
    case 'closing':
      return renderClosing(spec)
    default:
      throw new Error(`unsupported page_variant_id for executive-dashboard: ${spec.page_variant_id}`)
  }
}
