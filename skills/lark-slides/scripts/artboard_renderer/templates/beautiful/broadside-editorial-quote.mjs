import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'editorial-quote-chart'

const PAGE_VARIANTS = [
  'cover',
  'chapter',
  'statement',
  'split',
  'stats',
  'fadelist',
  'list',
  'quote',
  'compare',
  'chart',
  'diagram',
  'pie',
  'pyramid',
  'vtimeline',
  'cycle',
  'end'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'broadside',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'broadside',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'chapter', 'end'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'chapter', 'end'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/broadside-1.png'
}

const DEFAULTS = {
  cover: {
    title: 'this is the broadside style',
    subtitle: 'Protest poster meets publication cover. Type so large it becomes image.',
    author: 'Studio Notes',
    context: '2026 · field brief'
  },
  chapter: { title: 'what matters now', subtitle: 'A short chapter marker for the next argument.' },
  statement: { eyebrow: 'thesis', title: 'clarity is a design decision, not a decorative finish.' },
  split: {
    eyebrow: 'field note',
    title: 'ideas need both friction and form',
    body: 'The source system pairs publication gravity with poster scale.',
    items: ['choose one sharp claim', 'make the support visible', 'leave a strong editorial trace']
  },
  stats: {
    metrics: [
      { value: '68%', label: 'faster recall', note: 'large type anchors the message' },
      { value: '4.2x', label: 'more contrast', note: 'orange and ink register instantly' },
      { value: '16', label: 'source pages', note: 'each layout has a distinct role' }
    ]
  },
  fadelist: { title: 'before during after', items: ['before', 'during', 'after'] },
  list: {
    title: 'operating principles',
    items: ['Lead with a sentence that can stand alone.', 'Let slash bullets cut the page rhythm.', 'Keep evidence close to the claim.', 'Use orange only when it needs to shout.']
  },
  quote: { quote: 'Good editorial systems do not decorate information. They decide what gets remembered.', author: 'Broadside note' },
  compare: {
    title: 'before after',
    before: ['generic cards', 'soft hierarchy', 'decorative palette'],
    after: ['poster scale', 'visible structure', 'argument-first rhythm'],
    payoff: 'The page becomes an editorial position.'
  },
  chart: {
    title: 'attention by signal strength',
    bars: [
      { label: 'headline', value: 92 },
      { label: 'evidence', value: 74 },
      { label: 'caption', value: 48 },
      { label: 'source', value: 31 }
    ]
  },
  diagram: { title: 'argument flow', steps: ['claim', 'context', 'evidence', 'decision'] },
  pie: {
    title: 'where the page works',
    total: '100%',
    legend: [
      { label: 'type scale', value: '42%' },
      { label: 'contrast', value: '33%' },
      { label: 'spacing', value: '25%' }
    ]
  },
  pyramid: { title: 'hierarchy stack', layers: ['signal', 'claim', 'evidence', 'detail', 'source'] },
  vtimeline: {
    title: 'release cadence',
    timeline: [
      { date: 'week 01', title: 'frame the claim', body: 'Define the editorial position.' },
      { date: 'week 02', title: 'build evidence', body: 'Attach data and examples.' },
      { date: 'week 03', title: 'publish', body: 'Ship the artifact with a strong close.' }
    ]
  },
  cycle: { title: 'build measure learn', steps: ['build', 'measure', 'learn', 'adjust'] },
  end: { title: "let's talk.", subtitle: 'research@example.com · broadside system' }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    orange: source.background || source.accent || '#E85D26',
    dark: source.text || '#111111',
    cream: source.surface || '#F0ECE5',
    muted: source.muted || '#5E3526',
    rust: source.primary || '#A83E1B'
  }
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function value(spec, key, fallback = '') {
  const raw = spec.content?.[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback
}

function array(spec, key, fallback = []) {
  const raw = spec.content?.[key]
  return Array.isArray(raw) && raw.length ? raw : fallback
}

function objectArray(spec, key, fallback = []) {
  return array(spec, key, fallback).filter((item) => item && typeof item === 'object')
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant)) return variant
  }
  if (raw.includes('cover')) return 'cover'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('process') || raw.includes('timeline')) return 'diagram'
  if (raw.includes('compare') || raw.includes('split')) return 'compare'
  if (raw.includes('closing') || raw.includes('end')) return 'end'
  return 'statement'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function isOrange(variant) {
  return ['cover', 'chapter', 'stats', 'fadelist', 'diagram', 'end'].includes(variant)
}

function frame(spec, variant, children = []) {
  const theme = colors(spec)
  const orange = isOrange(variant)
  const bg = orange ? theme.orange : theme.dark
  const fg = orange ? theme.dark : theme.cream
  const accent = orange ? theme.dark : theme.orange
  const page = String(variantPage(spec, variant)).padStart(2, '0')
  return box(
    { width: 960, height: 540, position: 'relative', backgroundColor: bg, color: fg, overflow: 'hidden' },
    [
      TextBlock(page, { position: 'absolute', left: 48, top: 34, color: accent, fontSize: 12, lineHeight: 1, ...role('metric', spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 }) }),
      TextBlock('FIELD NOTES', { position: 'absolute', right: 48, top: 34, width: 140, color: accent, fontSize: 9, lineHeight: 1, letterSpacing: 1.8, textAlign: 'right', ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase' }) }),
      ...children,
      box({ position: 'absolute', left: 48, right: 48, bottom: 46, height: 1, backgroundColor: accent, opacity: 0.72 }),
      TextBlock('PUBLICATION SERIES', { position: 'absolute', left: 48, bottom: 24, color: accent, fontSize: 9, letterSpacing: 1.2, ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }) }),
      TextBlock('ISSUE ARCHIVE', { position: 'absolute', right: 48, bottom: 24, width: 160, color: accent, fontSize: 9, letterSpacing: 1.2, textAlign: 'right', ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }) })
    ]
  )
}

function display(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(String(text || '').toLowerCase(), {
    color: style.color || theme.dark,
    fontSize: 72,
    lineHeight: 0.82,
    letterSpacing: -1.1,
    ...role('display', spec, { fontSize: 72, lineHeight: 0.82, fontWeight: 900, letterSpacing: -1.1, textTransform: 'none' }),
    ...style
  })
}

function body(text, spec, style = {}) {
  return TextBlock(text, {
    fontSize: 15,
    lineHeight: 1.45,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.45, fontWeight: 500 }),
    ...style
  })
}

function label(text, spec, style = {}) {
  return TextBlock(String(text || '').toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 1.4,
    ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }),
    ...style
  })
}

function slashBullet(spec, text, y, color) {
  return box({ position: 'absolute', left: 0, top: y, width: 370, minHeight: 38, flexDirection: 'row', gap: 12 }, [
    TextBlock('/', { color, fontSize: 22, lineHeight: 1, ...role('label', spec, { fontSize: 22, lineHeight: 1, fontWeight: 800 }) }),
    body(text, spec, { color, width: 330, fontSize: 14, lineHeight: 1.35 })
  ])
}

function renderCover(spec) {
  const theme = colors(spec)
  const title = value(spec, 'title', DEFAULTS.cover.title)
  const words = title.toLowerCase().split(/\s+/)
  return frame(spec, 'cover', [
    display(words.slice(0, 4).join(' '), spec, { position: 'absolute', left: 48, top: 170, width: 820, fontSize: 86, color: theme.dark }),
    display(words.slice(4).join(' ') || 'style', spec, { position: 'absolute', left: 48, top: 292, width: 850, fontSize: 86, color: theme.dark }),
    body(value(spec, 'subtitle', DEFAULTS.cover.subtitle), spec, { position: 'absolute', left: 48, bottom: 74, width: 430, color: theme.muted, fontSize: 15, lineHeight: 1.5 }),
    label(value(spec, 'author', DEFAULTS.cover.author), spec, { position: 'absolute', left: 48, bottom: 146, color: theme.muted }),
    label(value(spec, 'context', DEFAULTS.cover.context), spec, { position: 'absolute', right: 48, bottom: 146, width: 190, color: theme.muted, textAlign: 'right' })
  ])
}

function renderChapter(spec) {
  const theme = colors(spec)
  return frame(spec, 'chapter', [
    display(value(spec, 'title', DEFAULTS.chapter.title), spec, { position: 'absolute', left: 130, top: 180, width: 700, fontSize: 76, lineHeight: 0.9, textAlign: 'center', color: theme.dark }),
    body(value(spec, 'subtitle', DEFAULTS.chapter.subtitle), spec, { position: 'absolute', left: 280, top: 344, width: 400, color: theme.muted, fontSize: 16, textAlign: 'center' })
  ])
}

function renderStatement(spec) {
  const theme = colors(spec)
  return frame(spec, 'statement', [
    label(value(spec, 'eyebrow', DEFAULTS.statement.eyebrow), spec, { position: 'absolute', left: 92, top: 118, color: theme.orange }),
    box({ position: 'absolute', left: 92, top: 148, width: 72, height: 3, backgroundColor: theme.orange }),
    display(value(spec, 'title', DEFAULTS.statement.title), spec, { position: 'absolute', left: 90, top: 194, width: 760, color: theme.orange, fontSize: 58, lineHeight: 0.98 })
  ])
}

function renderSplit(spec) {
  const theme = colors(spec)
  const items = array(spec, 'items', DEFAULTS.split.items).slice(0, 3)
  return frame(spec, 'split', [
    label(value(spec, 'eyebrow', DEFAULTS.split.eyebrow), spec, { position: 'absolute', left: 72, top: 104, color: theme.orange }),
    display(value(spec, 'title', DEFAULTS.split.title), spec, { position: 'absolute', left: 72, top: 150, width: 385, color: theme.cream, fontSize: 46, lineHeight: 1 }),
    body(value(spec, 'body', DEFAULTS.split.body), spec, { position: 'absolute', left: 72, top: 280, width: 360, color: theme.cream, opacity: 0.8 }),
    box({ position: 'absolute', left: 72, top: 348, width: 370, height: 130 }, items.map((item, index) => slashBullet(spec, item, index * 42, theme.orange))),
    box({ position: 'absolute', right: 74, top: 116, width: 360, height: 296, backgroundColor: theme.orange, borderWidth: 2, borderColor: theme.cream }),
    box({ position: 'absolute', right: 112, top: 154, width: 284, height: 220, borderWidth: 2, borderColor: theme.cream, borderStyle: 'dashed' }),
    label('visual reference', spec, { position: 'absolute', right: 144, top: 250, width: 220, color: theme.cream, textAlign: 'center' })
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const metrics = objectArray(spec, 'metrics', DEFAULTS.stats.metrics).slice(0, 3)
  return frame(spec, 'stats', [
    box({ position: 'absolute', left: 72, top: 118, width: 816, flexDirection: 'row', gap: 24 }, metrics.map((metric) =>
      box({ width: 256, height: 274, borderWidth: 2, borderColor: theme.dark, padding: '30px 24px', flexDirection: 'column', backgroundColor: theme.orange }, [
        TextBlock(metric.value || '', { color: theme.dark, fontSize: 58, lineHeight: 0.9, marginBottom: 20, ...role('metric', spec, { fontSize: 58, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }) }),
        label(metric.label || '', spec, { color: theme.dark, marginBottom: 20 }),
        body(metric.note || '', spec, { color: theme.muted, fontSize: 13, lineHeight: 1.35 })
      ])
    ))
  ])
}

function renderFadelist(spec) {
  const theme = colors(spec)
  const items = array(spec, 'items', DEFAULTS.fadelist.items)
  return frame(spec, 'fadelist', [
    ...items.slice(0, 3).map((item, index) => display(item, spec, { position: 'absolute', left: 56 + index * 112, top: 102 + index * 64, width: 680, color: theme.dark, opacity: 0.14 + index * 0.14, fontSize: 76 })),
    display(value(spec, 'title', DEFAULTS.fadelist.title), spec, { position: 'absolute', left: 70, top: 322, width: 780, color: theme.dark, fontSize: 76, lineHeight: 0.86 })
  ])
}

function renderList(spec) {
  const theme = colors(spec)
  const items = array(spec, 'items', DEFAULTS.list.items).slice(0, 4)
  return frame(spec, 'list', [
    display(value(spec, 'title', DEFAULTS.list.title), spec, { position: 'absolute', left: 70, top: 136, width: 330, color: theme.cream, fontSize: 52 }),
    box({ position: 'absolute', left: 500, top: 124, width: 360, height: 280 }, items.map((item, index) => slashBullet(spec, item, index * 64, theme.orange)))
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote', [
    label('pull quote', spec, { position: 'absolute', left: 92, top: 110, color: theme.orange }),
    TextBlock('"', { position: 'absolute', left: 88, top: 144, color: theme.orange, fontSize: 90, lineHeight: 1, ...role('display', spec, { fontSize: 90, lineHeight: 1, fontWeight: 900 }) }),
    display(value(spec, 'quote', DEFAULTS.quote.quote), spec, { position: 'absolute', left: 160, top: 186, width: 670, color: theme.cream, fontSize: 44, lineHeight: 1.08 }),
    label(value(spec, 'author', DEFAULTS.quote.author), spec, { position: 'absolute', left: 164, top: 396, color: theme.orange })
  ])
}

function renderCompare(spec) {
  const theme = colors(spec)
  const before = array(spec, 'before', DEFAULTS.compare.before).slice(0, 3)
  const after = array(spec, 'after', DEFAULTS.compare.after).slice(0, 3)
  const listColumn = (title, items, x) => box({ position: 'absolute', left: x, top: 150, width: 240, minHeight: 210, flexDirection: 'column' }, [
    label(title, spec, { color: theme.orange, marginBottom: 24 }),
    ...items.map((item) => body(`/ ${item}`, spec, { color: theme.cream, marginBottom: 18, fontSize: 14 }))
  ])
  return frame(spec, 'compare', [
    listColumn('before', before, 74),
    listColumn('after', after, 350),
    box({ position: 'absolute', right: 72, top: 116, width: 280, height: 292, backgroundColor: theme.orange, padding: '34px 28px', flexDirection: 'column', justifyContent: 'center' }, [
      display(value(spec, 'payoff', DEFAULTS.compare.payoff), spec, { color: theme.dark, fontSize: 38, lineHeight: 1.05 })
    ])
  ])
}

function renderChart(spec) {
  const theme = colors(spec)
  const bars = objectArray(spec, 'bars', DEFAULTS.chart.bars).slice(0, 4)
  return frame(spec, 'chart', [
    display(value(spec, 'title', DEFAULTS.chart.title), spec, { position: 'absolute', left: 72, top: 104, width: 420, color: theme.cream, fontSize: 42 }),
    box({ position: 'absolute', left: 522, top: 130, width: 330, height: 250, flexDirection: 'row', alignItems: 'flex-end', gap: 26 }, bars.map((bar, index) =>
      box({ width: 58, height: Math.max(34, Number(bar.value || 40) * 2.3), backgroundColor: index === 0 ? theme.orange : theme.cream, flexDirection: 'column', justifyContent: 'flex-end', padding: '8px 6px' }, [
        label(String(bar.value || ''), spec, { color: index === 0 ? theme.dark : theme.orange, fontSize: 8, textAlign: 'center' })
      ])
    )),
    box({ position: 'absolute', left: 514, top: 388, width: 360, height: 2, backgroundColor: theme.cream }),
    ...bars.map((bar, index) => label(bar.label || '', spec, { position: 'absolute', left: 516 + index * 84, top: 404, width: 78, color: theme.cream, fontSize: 7, textAlign: 'center' }))
  ])
}

function renderDiagram(spec) {
  const theme = colors(spec)
  const steps = array(spec, 'steps', DEFAULTS.diagram.steps).slice(0, 4)
  return frame(spec, 'diagram', [
    display(value(spec, 'title', DEFAULTS.diagram.title), spec, { position: 'absolute', left: 70, top: 112, width: 430, color: theme.dark, fontSize: 54 }),
    box({ position: 'absolute', left: 102, top: 286, flexDirection: 'row', alignItems: 'center', gap: 12 }, steps.map((step, index) => [
      box({ width: 152, height: 82, borderWidth: 2, borderColor: theme.dark, backgroundColor: index % 2 ? theme.cream : theme.orange, alignItems: 'center', justifyContent: 'center', padding: '14px' }, [
        label(step, spec, { color: theme.dark, textAlign: 'center' })
      ]),
      index < steps.length - 1 ? box({ width: 36, height: 4, backgroundColor: theme.dark }) : null
    ]).flat().filter(Boolean))
  ])
}

function renderPie(spec) {
  const theme = colors(spec)
  const legend = objectArray(spec, 'legend', DEFAULTS.pie.legend).slice(0, 3)
  return frame(spec, 'pie', [
    display(value(spec, 'title', DEFAULTS.pie.title), spec, { position: 'absolute', left: 72, top: 112, width: 340, color: theme.cream, fontSize: 44 }),
    box({ position: 'absolute', left: 500, top: 112, width: 230, height: 230, borderRadius: 115, backgroundColor: theme.orange, alignItems: 'center', justifyContent: 'center' }, [
      box({ width: 118, height: 118, borderRadius: 59, backgroundColor: theme.dark, alignItems: 'center', justifyContent: 'center' }, [
        TextBlock(value(spec, 'total', DEFAULTS.pie.total), { color: theme.cream, fontSize: 30, lineHeight: 1, ...role('metric', spec, { fontSize: 30, lineHeight: 1, fontWeight: 900 }) })
      ])
    ]),
    box({ position: 'absolute', left: 500, top: 372, flexDirection: 'column', gap: 12 }, legend.map((item) => body(`${item.value} / ${item.label}`, spec, { color: theme.cream, fontSize: 14 })))
  ])
}

function renderPyramid(spec) {
  const theme = colors(spec)
  const layers = array(spec, 'layers', DEFAULTS.pyramid.layers).slice(0, 5)
  return frame(spec, 'pyramid', [
    display(value(spec, 'title', DEFAULTS.pyramid.title), spec, { position: 'absolute', left: 70, top: 102, width: 420, color: theme.cream, fontSize: 48 }),
    box({ position: 'absolute', left: 470, top: 106, width: 360, flexDirection: 'column-reverse', alignItems: 'center', gap: 8 }, layers.map((layer, index) =>
      box({ width: 150 + index * 42, height: 50, backgroundColor: index === 4 ? theme.orange : theme.cream, alignItems: 'center', justifyContent: 'center' }, [
        label(layer, spec, { color: index === 4 ? theme.dark : theme.orange, textAlign: 'center' })
      ])
    ))
  ])
}

function renderVTimeline(spec) {
  const theme = colors(spec)
  const timeline = objectArray(spec, 'timeline', DEFAULTS.vtimeline.timeline).slice(0, 3)
  return frame(spec, 'vtimeline', [
    display(value(spec, 'title', DEFAULTS.vtimeline.title), spec, { position: 'absolute', left: 70, top: 96, width: 300, color: theme.cream, fontSize: 40 }),
    box({ position: 'absolute', left: 492, top: 120, width: 3, height: 270, backgroundColor: theme.orange }),
    ...timeline.map((item, index) => box({ position: 'absolute', left: 320, top: 128 + index * 92, width: 500, minHeight: 74, flexDirection: 'row', gap: 34 }, [
      label(item.date || '', spec, { width: 116, color: theme.orange, textAlign: 'right' }),
      box({ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.orange, marginTop: 0 }),
      box({ width: 310, flexDirection: 'column' }, [
        label(item.title || '', spec, { color: theme.cream, marginBottom: 8 }),
        body(item.body || '', spec, { color: theme.cream, opacity: 0.8, fontSize: 13 })
      ])
    ]))
  ])
}

function renderCycle(spec) {
  const theme = colors(spec)
  const steps = array(spec, 'steps', DEFAULTS.cycle.steps).slice(0, 4)
  const positions = [{ left: 470, top: 128 }, { left: 650, top: 128 }, { left: 650, top: 300 }, { left: 470, top: 300 }]
  return frame(spec, 'cycle', [
    display(value(spec, 'title', DEFAULTS.cycle.title), spec, { position: 'absolute', left: 72, top: 142, width: 330, color: theme.cream, fontSize: 54 }),
    box({ position: 'absolute', left: 560, top: 236, width: 178, height: 3, backgroundColor: theme.orange }),
    box({ position: 'absolute', left: 616, top: 174, width: 3, height: 178, backgroundColor: theme.orange }),
    ...steps.map((step, index) => box({ position: 'absolute', ...positions[index], width: 130, height: 78, backgroundColor: index % 2 ? theme.cream : theme.orange, alignItems: 'center', justifyContent: 'center', padding: '12px' }, [
      label(step, spec, { color: index % 2 ? theme.orange : theme.dark, textAlign: 'center' })
    ]))
  ])
}

function renderEnd(spec) {
  const theme = colors(spec)
  return frame(spec, 'end', [
    display(value(spec, 'title', DEFAULTS.end.title), spec, { position: 'absolute', left: 64, top: 178, width: 760, color: theme.dark, fontSize: 96, lineHeight: 0.82 }),
    body(value(spec, 'subtitle', DEFAULTS.end.subtitle), spec, { position: 'absolute', left: 70, top: 374, width: 500, color: theme.muted, fontSize: 17 })
  ])
}

const RENDERERS = {
  cover: renderCover,
  chapter: renderChapter,
  statement: renderStatement,
  split: renderSplit,
  stats: renderStats,
  fadelist: renderFadelist,
  list: renderList,
  quote: renderQuote,
  compare: renderCompare,
  chart: renderChart,
  diagram: renderDiagram,
  pie: renderPie,
  pyramid: renderPyramid,
  vtimeline: renderVTimeline,
  cycle: renderCycle,
  end: renderEnd
}

export function renderBroadsideEditorialQuote(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderStatement)(spec)
}
