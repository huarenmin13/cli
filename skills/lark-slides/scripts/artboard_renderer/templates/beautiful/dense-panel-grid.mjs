import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'dense-panel-grid'

const PAGE_VARIANTS = [
  'cover',
  'toc',
  'stats',
  'features',
  'chart',
  'section',
  'quote',
  'cta',
  'consult',
  'chart2',
  'process2',
  'matrix2'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'neo-grid-bold',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'neo-grid-bold',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'toc', 'section', 'quote', 'cta'],
      repeatable: ['stats', 'features', 'chart', 'consult', 'chart2', 'process2', 'matrix2']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/neo-grid-bold-1.png'
}

const CANVAS = { width: 960, height: 540 }
const GRID = { inset: 20, gap: 6, columns: 12, rows: 8 }
const CELL_W = (CANVAS.width - GRID.inset * 2 - GRID.gap * (GRID.columns - 1)) / GRID.columns
const CELL_H = (CANVAS.height - GRID.inset * 2 - GRID.gap * (GRID.rows - 1)) / GRID.rows

const DEFAULTS = {
  cover: {
    eyebrow: '01 / 12',
    title: 'The future of data-driven finance',
    subtitle: 'All rights reserved.',
    footer: '2025 DIGITS'
  },
  toc: {
    title: 'Contents',
    items: [
      { label: '01 / Introduction', title: 'Digits in numbers', body: 'Where we are and what the platform handles today.' },
      { label: '02 / Product', title: 'Key features', body: 'Three primitives that power decision-making at scale.' },
      { label: '03 / Market', title: 'Penetration and growth', body: 'Where we are gaining ground, and where we are next.' },
      { label: '04 / Vision', title: 'What comes next', body: 'The roadmap for the next four quarters.' },
      { label: '05 / Voice', title: 'From our partners', body: 'Why teams are choosing the platform.' },
      { label: '06 / Action', title: 'Next steps', body: 'Three things to take away from today.' }
    ]
  },
  stats: {
    eyebrow: 'Market penetration',
    title: 'Digits in numbers',
    subtitle:
      'Empowering businesses with data-driven financial insights. The platform is reshaping real-time financial decision-making across markets.',
    metrics: [
      { value: '12.8M', label: 'Transactions processed' },
      { value: '41M', label: 'Total revenue impacted' },
      { value: '15.4M', label: 'Users engaged' },
      { value: '85.6M', label: 'Data points analyzed' }
    ]
  },
  features: {
    title: 'Key features',
    eyebrow: 'Three primitives',
    items: [
      { title: 'Seamless transactions', body: 'Effortless and secure digital payments with real-time processing.' },
      { title: 'Data insights', body: 'Leverage analytics to uncover patterns and surface new opportunities.' },
      { title: 'Risk modelling', body: 'Predictive models score risk in milliseconds so teams can act sooner.' }
    ]
  },
  chart: {
    eyebrow: 'Section 03 / Market',
    title: 'Market penetration doubled.',
    subtitle:
      'Year-on-year reach across our six largest regions. The platform now touches one in three small-business accounts.',
    labels: ['NA', 'EU', 'LATAM', 'APAC', 'MENA', 'SSA'],
    seriesA: [42, 55, 36, 64, 48, 30],
    seriesB: [78, 88, 62, 94, 72, 54]
  },
  section: {
    eyebrow: 'Section / Vision',
    number: '02',
    title: 'Build the engine of modern money.',
    subtitle:
      'The next decade of finance belongs to platforms that can model the world in real time and act on it without a human in the loop.'
  },
  quote: {
    quote: 'The platform replaced four legacy systems and a quarterly committee. We now decide in minutes what used to take a month.',
    author: 'Marta Aguilar',
    context: 'CFO / Mid-market retailer'
  },
  cta: {
    eyebrow: 'Take three things away',
    title: 'Next steps',
    items: [
      { label: '01 / Today', title: 'Pilot one workflow', body: 'Pick a single decision your team makes weekly and benchmark against the current process.' },
      { label: '02 / Next month', title: 'Scale the wedge', body: 'Expand the pilot to two adjacent workflows and share the playbook.' },
      { label: '03 / This quarter', title: 'Make it default', body: 'Retire the legacy stack for that domain and fund the next bet.' }
    ]
  },
  consult: {
    eyebrow: 'Action title / 09',
    title:
      'The trust gap is built in the first 72 hours, not the first 7 days.',
    columns: [
      {
        title: 'What we found',
        metric: 'Three behavioural signals',
        bullets: ['Email open #2 lifts retention', 'Personal salutation doubles cohort quality', 'Reply received is the largest lever']
      },
      {
        title: 'Why it matters',
        metric: '$4.1M projected retained ARR',
        bullets: ['The first three days carry the highest attention', 'Every interaction here replaces four later touches', 'Signal replicated across three cohorts']
      },
      {
        title: 'What to do',
        metric: 'Pilot scope: top-decile signups',
        bullets: ['Rewrite emails 1-3', 'Route every signup to a named human', 'Instrument the 72-hour window']
      }
    ]
  },
  chart2: {
    eyebrow: 'Section / Evidence',
    title: 'The curve bends at day three.',
    subtitle: 'Cohorts with written welcome and human reply retain at roughly 2x the templated cohort.',
    labels: ['D0', 'D7', 'D14', 'D30', 'D45', 'D60', 'D90']
  },
  process2: {
    title: 'From insight to default, in five moves.',
    subtitle:
      'A repeatable path each pilot follows before it is allowed to graduate to default experience.',
    items: [
      { label: '01 / Frame', title: 'Hypothesise', body: 'Translate the insight into a testable hypothesis.' },
      { label: '02 / Design', title: 'Sketch', body: 'Smallest end-to-end change for a clean test.' },
      { label: '03 / Pilot', title: 'Ship 50/50', body: 'Holdout in one segment for two cycles.' },
      { label: '04 / Read', title: 'Decide', body: 'Kill, scale, or extend based on registered metrics.' },
      { label: '05 / Default', title: 'Graduate', body: 'Promote to default and retire the legacy path.' },
      { label: 'Outcome', title: 'New default', body: 'A result every customer feels.' }
    ]
  },
  matrix2: {
    title: 'Where each pilot earns its keep.',
    subtitle: 'Scored against the four levers that matter most this cycle.',
    headers: ['Lever', 'Rewrite welcome', 'Quiet upgrades', 'Inbox search'],
    rows: [
      ['Time-to-impact', '<= 4 weeks', '6-8 weeks', '<= 4 weeks'],
      ['Build cost', 'Low', 'Medium', 'Low'],
      ['Retention lift', '+19 pts D90', '+7 pts D90', '+5 pts D90'],
      ['Risk to power users', 'None', 'Material', 'Soft, reversible']
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    bg: source.background || '#ECECE8',
    paper: source.panel || source.surface || '#F5F4EF',
    ink: source.text || '#0A0A0A',
    lemon: source.accent || source.primary || '#E6FF3D',
    muted: source.muted || '#8A8A85'
  }
}

const ROLE_FONT_RESOLVERS = {
  display: (spec, style) => fontRole('display', spec, style),
  body: (spec, style) => fontRole('body', spec, style),
  label: (spec, style) => fontRole('label', spec, style),
  metric: (spec, style) => fontRole('metric', spec, style)
}

function role(roleName, spec, style = {}) {
  const resolver = ROLE_FONT_RESOLVERS[roleName] || ((inputSpec, inputStyle) => fontRole(roleName, inputSpec, inputStyle))
  return resolver(spec, style)
}

function text(spec, key, fallback = '') {
  const value = spec.content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function list(spec, keys, fallback = []) {
  for (const key of keys) {
    const value = spec.content?.[key]
    if (Array.isArray(value) && value.length) return value
  }
  return fallback
}

function objectList(spec, keys, fallback = []) {
  return list(spec, keys, fallback).filter((item) => item && typeof item === 'object')
}

function upper(value) {
  return String(value || '').toUpperCase()
}

function normalizeVariant(spec) {
  const sourceClass = `${spec.page_family_source?.source_class || ''}`.toLowerCase()
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  const value = `${sourceClass} ${raw}`
  for (const variant of PAGE_VARIANTS) {
    if (value.includes(variant)) return variant
  }
  if (value.includes('s-cover') || value.includes('cover')) return 'cover'
  if (value.includes('s-toc') || value.includes('agenda') || value.includes('toc')) return 'toc'
  if (value.includes('s-stats') || value.includes('stat') || value.includes('data')) return 'stats'
  if (value.includes('s-features') || value.includes('feature')) return 'features'
  if (value.includes('s-chart2') || value.includes('curve')) return 'chart2'
  if (value.includes('s-chart') || value.includes('chart')) return 'chart'
  if (value.includes('s-section') || value.includes('section')) return 'section'
  if (value.includes('s-quote') || value.includes('quote')) return 'quote'
  if (value.includes('s-cta') || value.includes('closing') || value.includes('cta')) return 'cta'
  if (value.includes('s-consult') || value.includes('detail')) return 'consult'
  if (value.includes('s-process2') || value.includes('process') || value.includes('timeline')) return 'process2'
  if (value.includes('s-matrix2') || value.includes('matrix') || value.includes('comparison')) return 'matrix2'
  return 'cover'
}

function pageNumber(spec, variant) {
  const sourceIndex = spec.page_family_source?.source_slide_index
  const index = sourceIndex || PAGE_VARIANTS.indexOf(variant) + 1
  return `${String(index).padStart(2, '0')} / 12`
}

function gridRect(col, row, colSpan, rowSpan) {
  return {
    left: Math.round(GRID.inset + (col - 1) * (CELL_W + GRID.gap)),
    top: Math.round(GRID.inset + (row - 1) * (CELL_H + GRID.gap)),
    width: Math.round(CELL_W * colSpan + GRID.gap * (colSpan - 1)),
    height: Math.round(CELL_H * rowSpan + GRID.gap * (rowSpan - 1))
  }
}

function panel(spec, col, row, colSpan, rowSpan, options = {}, children = []) {
  const theme = colors(spec)
  return box(
    {
      position: 'absolute',
      ...gridRect(col, row, colSpan, rowSpan),
      overflow: 'hidden',
      backgroundColor: options.backgroundColor || theme.paper,
      color: options.color || theme.ink,
      padding: options.padding ?? 16,
      flexDirection: options.flexDirection || 'column',
      justifyContent: options.justifyContent || 'flex-start',
      alignItems: options.alignItems || 'stretch',
      borderWidth: options.borderWidth || 0,
      borderColor: options.borderColor || theme.ink,
      ...options.style
    },
    children
  )
}

function pageTag(spec, variant, mode = 'paper') {
  const theme = colors(spec)
  const backgroundColor = mode === 'lemon' ? theme.lemon : mode === 'ink' ? theme.ink : theme.paper
  const color = mode === 'ink' ? theme.paper : theme.ink
  return TextBlock(pageNumber(spec, variant), {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor,
    color,
    padding: '7px 11px',
    ...role('metric', spec, { fontSize: 11, lineHeight: 1, letterSpacing: 1, fontWeight: 700 })
  })
}

function label(value, spec, style = {}) {
  return TextBlock(upper(value), {
    color: colors(spec).ink,
    ...role('label', spec, { fontSize: 8, lineHeight: 1.1, letterSpacing: 1.2, fontWeight: 700 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(value, {
    color: colors(spec).ink,
    ...role('body', spec, { fontSize: 11, lineHeight: 1.35, fontWeight: 400 }),
    ...style
  })
}

function headline(value, spec, style = {}) {
  return Title(upper(value).replace(/\s+/g, ' '), {
    color: colors(spec).ink,
    ...role('display', spec, { fontSize: 42, lineHeight: 0.92, fontWeight: 900, letterSpacing: -1 }),
    textTransform: 'uppercase',
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value), {
    color: colors(spec).ink,
    ...role('metric', spec, { fontSize: 42, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }),
    ...style
  })
}

function blockMark(spec, style = {}) {
  const theme = colors(spec)
  return box(
    { width: 28, height: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 2, ...style },
    [0, 1, 2, 3].map((index) =>
      box({
        width: 13,
        height: 13,
        backgroundColor: index === 0 || index === 3 ? theme.ink : 'transparent'
      })
    )
  )
}

function qrTile(spec, size = 45, invert = false) {
  const theme = colors(spec)
  const cells = Array.from({ length: 25 }, (_, index) => index)
  return box(
    { width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
    cells.map((index) =>
      box({
        width: (size - 4) / 5,
        height: (size - 4) / 5,
        backgroundColor: index % 2 === 0 ? (invert ? theme.lemon : theme.ink) : (invert ? theme.ink : theme.lemon)
      })
    )
  )
}

function photoTexture(spec, children = []) {
  const theme = colors(spec)
  return box(
    {
      position: 'absolute',
      inset: 0,
      backgroundColor: theme.ink,
      overflow: 'hidden'
    },
    [
      box({ position: 'absolute', left: 18, top: 22, width: 70, height: 210, borderWidth: 1, borderColor: '#333333' }),
      box({ position: 'absolute', left: 48, top: 52, width: 1, height: 168, backgroundColor: '#333333' }),
      box({ position: 'absolute', right: 24, bottom: 42, width: 82, height: 1, backgroundColor: '#333333' }),
      ...children
    ]
  )
}

function frame(spec, variant, children, options = {}) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: options.backgroundColor || theme.bg,
      overflow: 'hidden',
      color: theme.ink
    },
    [...children, pageTag(spec, variant, options.pageTagMode)]
  )
}

function splitTitle(value, maxWords = 3) {
  const words = upper(value).replace(/[.]+$/g, '').split(/\s+/).filter(Boolean)
  const lines = []
  for (let index = 0; index < words.length; index += maxWords) {
    lines.push(words.slice(index, index + maxWords).join(' '))
  }
  return lines.slice(0, 4).join('\n')
}

function renderCover(spec) {
  const theme = colors(spec)
  const copy = { ...DEFAULTS.cover, ...spec.content }
  return frame(spec, 'cover', [
    panel(spec, 1, 1, 3, 8, { padding: 0, backgroundColor: theme.ink }, [photoTexture(spec)]),
    panel(spec, 4, 1, 5, 5, { backgroundColor: theme.lemon, padding: 24 }, [
      qrTile(spec, 45),
      box({ flex: 1 }),
      blockMark(spec, { marginTop: 94 })
    ]),
    panel(spec, 4, 6, 5, 3, { backgroundColor: theme.lemon, padding: 22, justifyContent: 'center' }, [
      headline(splitTitle(text(spec, 'title', copy.title), 2), spec, {
        width: 330,
        fontSize: 33,
        lineHeight: 0.94
      })
    ]),
    panel(spec, 9, 1, 4, 5, { padding: 0, backgroundColor: theme.ink }, [photoTexture(spec)]),
    panel(spec, 9, 6, 4, 3, { backgroundColor: theme.paper, padding: 22, justifyContent: 'space-between' }, [
      label(text(spec, 'footer', copy.footer), spec, { fontSize: 8 }),
      body(text(spec, 'subtitle', copy.subtitle), spec, { color: theme.muted, fontSize: 9, lineHeight: 1.35 })
    ])
  ])
}

function renderToc(spec) {
  const theme = colors(spec)
  const items = objectList(spec, ['items', 'bullets'], DEFAULTS.toc.items).slice(0, 6)
  return frame(spec, 'toc', [
    panel(spec, 1, 1, 12, 2, { padding: '22px 24px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
      headline(text(spec, 'title', DEFAULTS.toc.title), spec, { fontSize: 45, lineHeight: 0.9 }),
      blockMark(spec)
    ]),
    ...items.map((item, index) => {
      const col = 1 + (index % 3) * 4
      const row = index < 3 ? 3 : 6
      const isLemon = index === 1 || index === 5
      const isInk = index === 4
      return panel(
        spec,
        col,
        row,
        4,
        3,
        {
          backgroundColor: isInk ? theme.ink : isLemon ? theme.lemon : theme.paper,
          color: isInk ? theme.paper : theme.ink,
          padding: 22,
          justifyContent: 'center'
        },
        [
          label(item.label || `${String(index + 1).padStart(2, '0')} / Section`, spec, {
            color: isInk ? theme.paper : theme.ink,
            opacity: isInk ? 0.75 : 1,
            marginBottom: 16
          }),
          headline(item.title || `Section ${index + 1}`, spec, {
            color: isInk ? theme.paper : theme.ink,
            fontSize: 20,
            lineHeight: 1.05,
            marginBottom: 10
          }),
          body(item.body || '', spec, { color: isInk ? theme.paper : theme.ink, opacity: 0.84, fontSize: 9, lineHeight: 1.45 })
        ]
      )
    })
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const metrics = objectList(spec, ['metrics', 'stats'], DEFAULTS.stats.metrics)
  const small = metrics.slice(0, 3)
  const big = metrics[3] || { value: '85.6M', label: 'Data points analyzed' }
  return frame(spec, 'stats', [
    panel(spec, 1, 1, 2, 8, { backgroundColor: theme.lemon, padding: 14, justifyContent: 'space-between' }, [
      metric(text(spec, 'eyebrow', '+98.7%'), spec, { fontSize: 24 }),
      label(text(spec, 'subtitle_label', DEFAULTS.stats.eyebrow), spec, { fontSize: 11, lineHeight: 1.1, marginBottom: 36 })
    ]),
    panel(spec, 3, 1, 4, 8, { padding: 18, justifyContent: 'space-between' }, [
      box({ flexDirection: 'column' }, [
        headline(splitTitle(text(spec, 'title', DEFAULTS.stats.title), 1), spec, { fontSize: 36, lineHeight: 0.95, marginBottom: 16 }),
        body(text(spec, 'subtitle', DEFAULTS.stats.subtitle), spec, { fontSize: 11, lineHeight: 1.45 })
      ]),
      label('Snapshot / Q1 2026', spec, { fontSize: 8 })
    ]),
    ...small.map((item, index) =>
      panel(spec, 7 + (index % 2) * 3, 1 + Math.floor(index / 2) * 2, 3, 2, { padding: 14 }, [
        metric(item.value, spec, { fontSize: 34, marginBottom: 6 }),
        label(item.label, spec, { fontSize: 8, lineHeight: 1.2 })
      ])
    ),
    panel(spec, 7, 5, 6, 4, { backgroundColor: theme.lemon, padding: 18, justifyContent: 'space-between' }, [
      label(big.label || 'Data points analyzed', spec, { fontSize: 9 }),
      metric(big.value || '85.6M', spec, { fontSize: 78, lineHeight: 0.85 }),
      TextBlock('->', { color: theme.ink, fontSize: 26, fontWeight: 900, alignSelf: 'flex-end' })
    ])
  ], { pageTagMode: 'lemon' })
}

function renderFeatures(spec) {
  const theme = colors(spec)
  const items = objectList(spec, ['items', 'features', 'bullets'], DEFAULTS.features.items).slice(0, 3)
  return frame(spec, 'features', [
    panel(spec, 1, 1, 12, 2, { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
      headline(text(spec, 'title', DEFAULTS.features.title), spec, { fontSize: 42 }),
      label(text(spec, 'eyebrow', DEFAULTS.features.eyebrow), spec, { fontSize: 10 })
    ]),
    ...items.map((item, index) =>
      panel(spec, 1 + index * 4, 3, 4, 6, { padding: 14 }, [
        box({ height: 110, backgroundColor: theme.ink, position: 'relative', marginBottom: 15, overflow: 'hidden' }, [
          photoTexture(spec),
          TextBlock(`0${index + 1}`, {
            position: 'absolute',
            left: 8,
            top: 8,
            backgroundColor: theme.lemon,
            padding: '3px 6px',
            color: theme.ink,
            ...role('metric', spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 })
          })
        ]),
        headline(item.title || `Feature ${index + 1}`, spec, { fontSize: 18, lineHeight: 1.05, marginBottom: 10 }),
        body(item.body || '', spec, { fontSize: 10.5, lineHeight: 1.35 })
      ])
    )
  ])
}

function renderChart(spec) {
  const theme = colors(spec)
  const labels = list(spec, ['labels'], DEFAULTS.chart.labels).slice(0, 6)
  const seriesA = list(spec, ['seriesA'], DEFAULTS.chart.seriesA)
  const seriesB = list(spec, ['seriesB'], DEFAULTS.chart.seriesB)
  return frame(spec, 'chart', [
    panel(spec, 1, 1, 5, 8, { backgroundColor: theme.ink, color: theme.paper, padding: 20, justifyContent: 'space-between' }, [
      box({ flexDirection: 'column' }, [
        label(text(spec, 'eyebrow', DEFAULTS.chart.eyebrow), spec, { color: theme.paper, opacity: 0.75, marginBottom: 18 }),
        headline(splitTitle(text(spec, 'title', DEFAULTS.chart.title), 1), spec, { color: theme.paper, fontSize: 38, lineHeight: 0.94 })
      ]),
      body(text(spec, 'subtitle', DEFAULTS.chart.subtitle), spec, { color: theme.paper, opacity: 0.9, fontSize: 10.5 }),
      label('FY24 vs FY25 / Indexed', spec, { color: theme.paper, opacity: 0.72, fontSize: 8 })
    ]),
    panel(spec, 6, 1, 7, 8, { padding: 18, justifyContent: 'space-between' }, [
      box({ flexDirection: 'row', gap: 20, marginBottom: 14 }, [
        label('■ FY24', spec, { fontSize: 8 }),
        label('■ FY25', spec, { fontSize: 8, color: theme.ink })
      ]),
      box({ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 14, borderBottomWidth: 2, borderColor: theme.ink, paddingBottom: 12 }, labels.map((labelText, index) =>
        box({ flex: 1, height: 280, flexDirection: 'column', justifyContent: 'flex-end', gap: 4 }, [
          box({ height: Math.max(18, seriesA[index] * 2.2), backgroundColor: theme.ink }),
          box({ height: Math.max(18, seriesB[index] * 2.2), backgroundColor: theme.lemon, borderWidth: 1, borderColor: theme.ink }),
          label(labelText, spec, { textAlign: 'center', fontSize: 7, marginTop: 6 })
        ])
      ))
    ])
  ], { pageTagMode: 'ink' })
}

function renderSection(spec) {
  const theme = colors(spec)
  return frame(spec, 'section', [
    panel(spec, 1, 1, 4, 8, { backgroundColor: theme.lemon, padding: 20, justifyContent: 'space-between' }, [
      label(text(spec, 'eyebrow', DEFAULTS.section.eyebrow), spec, { fontSize: 9 }),
      metric(text(spec, 'number', DEFAULTS.section.number), spec, { fontSize: 154, lineHeight: 0.82, letterSpacing: -5 }),
      blockMark(spec, { alignSelf: 'flex-end' })
    ]),
    panel(spec, 5, 1, 8, 8, { backgroundColor: theme.ink, color: theme.paper, padding: 22, justifyContent: 'space-between' }, [
      label('What comes next', spec, { color: theme.paper, opacity: 0.7 }),
      headline(splitTitle(text(spec, 'title', DEFAULTS.section.title), 2), spec, { color: theme.paper, fontSize: 54, lineHeight: 0.9 }),
      body(text(spec, 'subtitle', DEFAULTS.section.subtitle), spec, { color: theme.paper, opacity: 0.85, fontSize: 11 })
    ])
  ], { backgroundColor: theme.ink, pageTagMode: 'lemon' })
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote', [
    panel(spec, 1, 1, 5, 8, { padding: 0, backgroundColor: theme.ink }, [
      photoTexture(spec, [
        label('Portrait / B&W', spec, { position: 'absolute', left: 12, bottom: 12, color: theme.paper, opacity: 0.55, fontSize: 7 })
      ])
    ]),
    panel(spec, 6, 1, 7, 5, { padding: 26, justifyContent: 'center' }, [
      TextBlock('"', { color: theme.lemon, fontSize: 58, lineHeight: 0.8, fontWeight: 900, marginBottom: 10 }),
      body(text(spec, 'quote', DEFAULTS.quote.quote), spec, { fontSize: 19, lineHeight: 1.28, fontWeight: 600 })
    ]),
    panel(spec, 6, 6, 4, 3, { backgroundColor: theme.lemon, padding: 20, justifyContent: 'space-between' }, [
      label(text(spec, 'context', DEFAULTS.quote.context), spec, { fontSize: 8 }),
      headline(text(spec, 'author', DEFAULTS.quote.author), spec, { fontSize: 18 })
    ]),
    panel(spec, 10, 6, 3, 3, { backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center', padding: 0 }, [
      blockMark(spec, { width: 48, height: 48 })
    ])
  ])
}

function renderCta(spec) {
  const theme = colors(spec)
  const items = objectList(spec, ['items', 'steps'], DEFAULTS.cta.items).slice(0, 3)
  return frame(spec, 'cta', [
    panel(spec, 1, 1, 8, 3, { backgroundColor: theme.lemon, padding: 20, justifyContent: 'space-between' }, [
      label(text(spec, 'eyebrow', DEFAULTS.cta.eyebrow), spec, { fontSize: 9 }),
      headline(text(spec, 'title', DEFAULTS.cta.title), spec, { fontSize: 58, lineHeight: 0.88 })
    ]),
    panel(spec, 9, 1, 4, 3, { backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' }, [
      qrTile(spec, 86, true)
    ]),
    ...items.map((item, index) =>
      panel(spec, 1 + index * 4, 4, 4, 5, {
        backgroundColor: index === 2 ? theme.ink : theme.paper,
        color: index === 2 ? theme.paper : theme.ink,
        padding: 20,
        justifyContent: 'space-between'
      }, [
        label(item.label || `0${index + 1}`, spec, { color: index === 2 ? theme.paper : theme.ink, opacity: index === 2 ? 0.75 : 1 }),
        headline(item.title || `Step ${index + 1}`, spec, { color: index === 2 ? theme.paper : theme.ink, fontSize: 23, lineHeight: 1 }),
        body(item.body || '', spec, { color: index === 2 ? theme.paper : theme.ink, opacity: index === 2 ? 0.85 : 1, fontSize: 10 }),
        TextBlock(index === 2 ? '->' : '', { color: theme.lemon, fontSize: 26, fontWeight: 900 })
      ])
    )
  ])
}

function renderConsult(spec) {
  const theme = colors(spec)
  const columns = objectList(spec, ['columns', 'items'], DEFAULTS.consult.columns).slice(0, 3)
  return frame(spec, 'consult', [
    panel(spec, 1, 1, 12, 1, { backgroundColor: theme.ink, color: theme.paper, padding: '14px 18px', flexDirection: 'row', alignItems: 'center', gap: 18 }, [
      label(text(spec, 'eyebrow', DEFAULTS.consult.eyebrow), spec, { color: theme.paper, opacity: 0.72, minWidth: 110 }),
      headline(text(spec, 'title', DEFAULTS.consult.title), spec, { color: theme.paper, fontSize: 17, lineHeight: 1.2, flex: 1 })
    ]),
    ...columns.map((col, index) =>
      panel(spec, 1 + index * 4, 2, 4, 7, {
        backgroundColor: index === 1 ? theme.lemon : theme.paper,
        padding: 20,
        justifyContent: 'space-between'
      }, [
        box({ flexDirection: 'column' }, [
          headline(col.title || `Column ${index + 1}`, spec, { fontSize: 18, lineHeight: 1.05, paddingBottom: 10, borderBottomWidth: 2, borderColor: theme.ink, marginBottom: 18 }),
          metric(col.metric || '', spec, { fontSize: 19, lineHeight: 1.12, marginBottom: 16 }),
          ...(Array.isArray(col.bullets) ? col.bullets.slice(0, 4) : []).map((bullet) =>
            body(`- ${bullet}`, spec, { fontSize: 9.2, lineHeight: 1.42, marginBottom: 8 })
          )
        ]),
        label(index === 1 ? 'Modelled / FY24' : 'Source / Cohort review', spec, { fontSize: 7, opacity: 0.68, borderTopWidth: 1, borderColor: 'rgba(10,10,10,0.25)', paddingTop: 8 })
      ])
    )
  ])
}

function renderChart2(spec) {
  const theme = colors(spec)
  const labels = list(spec, ['labels'], DEFAULTS.chart2.labels).slice(0, 7)
  return frame(spec, 'chart2', [
    panel(spec, 1, 1, 5, 8, { backgroundColor: theme.lemon, padding: 20, justifyContent: 'space-between' }, [
      box({ flexDirection: 'column' }, [
        label(text(spec, 'eyebrow', DEFAULTS.chart2.eyebrow), spec, { marginBottom: 18 }),
        headline(splitTitle(text(spec, 'title', DEFAULTS.chart2.title), 2), spec, { fontSize: 38, lineHeight: 0.95 })
      ]),
      body(text(spec, 'subtitle', DEFAULTS.chart2.subtitle), spec, { fontSize: 10.5 }),
      box({ flexDirection: 'column', gap: 8 }, ['Templated welcome', 'Written welcome', 'Written + human reply'].map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: 10 }, [
          box({ width: 24, height: 1 + index * 2, backgroundColor: theme.ink }),
          label(item, spec, { fontSize: 7 })
        ])
      ))
    ]),
    panel(spec, 6, 1, 7, 8, { padding: '18px 18px 18px 42px', position: 'absolute' }, [
      label('% of cohort active, by day', spec, { opacity: 0.72, marginBottom: 16 }),
      box({ position: 'relative', flex: 1, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: theme.ink, marginBottom: 12 }, [
        ...[0, 25, 50, 75].map((top) => box({ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(10,10,10,0.18)' })),
        box({ position: 'absolute', left: 0, top: 20, width: 430, height: 145, borderBottomWidth: 2, borderColor: theme.ink, transform: 'rotate(14deg)' }),
        box({ position: 'absolute', left: 0, top: 62, width: 430, height: 112, borderBottomWidth: 3, borderColor: theme.ink, transform: 'rotate(8deg)' }),
        box({ position: 'absolute', left: 0, top: 96, width: 430, height: 72, borderBottomWidth: 5, borderColor: theme.ink, transform: 'rotate(5deg)' }),
        box({ position: 'absolute', right: -3, top: 165, width: 10, height: 10, backgroundColor: theme.lemon, borderWidth: 1, borderColor: theme.ink })
      ]),
      box({ flexDirection: 'row', justifyContent: 'space-between' }, labels.map((item) => label(item, spec, { fontSize: 7 })))
    ])
  ], { pageTagMode: 'lemon' })
}

function renderProcess2(spec) {
  const theme = colors(spec)
  const items = objectList(spec, ['items', 'steps'], DEFAULTS.process2.items).slice(0, 6)
  return frame(spec, 'process2', [
    panel(spec, 1, 1, 12, 2, { padding: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 24 }, [
      headline(splitTitle(text(spec, 'title', DEFAULTS.process2.title), 3), spec, { fontSize: 28, lineHeight: 1, width: 360 }),
      body(text(spec, 'subtitle', DEFAULTS.process2.subtitle), spec, { fontSize: 9, width: 310, lineHeight: 1.55 })
    ]),
    ...items.map((item, index) =>
      panel(spec, 1 + index * 2, 3, 2, 5, {
        backgroundColor: index === 1 || index === 3 ? theme.lemon : index === 5 ? theme.ink : theme.paper,
        color: index === 5 ? theme.paper : theme.ink,
        padding: 14,
        justifyContent: 'center'
      }, [
        label(item.label || `0${index + 1}`, spec, { color: index === 5 ? theme.paper : theme.ink, fontSize: 7, marginBottom: 14 }),
        headline(item.title || `Step ${index + 1}`, spec, { color: index === 5 ? theme.paper : theme.ink, fontSize: 17, lineHeight: 1.05, marginBottom: 12 }),
        body(item.body || '', spec, { color: index === 5 ? theme.paper : theme.ink, opacity: index === 5 ? 0.85 : 1, fontSize: 8.5, lineHeight: 1.45 }),
        index < 5 ? TextBlock('->', { position: 'absolute', right: -8, top: 126, color: theme.ink, fontSize: 16, fontWeight: 900, zIndex: 2 }) : null
      ].filter(Boolean))
    ),
    panel(spec, 1, 8, 12, 1, { padding: '8px 14px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
      ...['Week 1 / Frame', 'Week 2-3 / Design', 'Week 3-6 / Pilot', 'Week 7 / Read', 'Week 8 / Default', 'Total / 8 weeks'].map((item) =>
        label(item, spec, { fontSize: 7, paddingRight: 8, borderRightWidth: 1, borderColor: 'rgba(10,10,10,0.25)' })
      )
    ])
  ])
}

function renderMatrix2(spec) {
  const theme = colors(spec)
  const headers = list(spec, ['headers'], DEFAULTS.matrix2.headers).slice(0, 4)
  const rows = list(spec, ['rows'], DEFAULTS.matrix2.rows).slice(0, 4)
  return frame(spec, 'matrix2', [
    panel(spec, 1, 1, 12, 2, { padding: 18, flexDirection: 'row', justifyContent: 'space-between', gap: 24 }, [
      headline(splitTitle(text(spec, 'title', DEFAULTS.matrix2.title), 2), spec, { fontSize: 36, lineHeight: 0.95, width: 380 }),
      body(text(spec, 'subtitle', DEFAULTS.matrix2.subtitle), spec, { fontSize: 9.5, width: 320, lineHeight: 1.5 })
    ]),
    panel(spec, 1, 3, 12, 5, { padding: 0 }, [
      ...[headers, ...rows].flatMap((row, rowIndex) =>
        row.slice(0, 4).map((cell, colIndex) =>
          box({
            position: 'absolute',
            left: `${colIndex * 25}%`,
            top: `${rowIndex * 20}%`,
            width: '25%',
            height: '20%',
            padding: colIndex === 0 ? '12px 13px' : '13px 11px',
            backgroundColor: rowIndex === 0 ? theme.ink : theme.paper,
            color: rowIndex === 0 ? theme.paper : theme.ink,
            borderRightWidth: colIndex === 3 ? 0 : 1,
            borderBottomWidth: rowIndex === 4 ? 0 : 1,
            borderColor: theme.ink,
            justifyContent: 'center'
          }, [
            rowIndex === 0
              ? label(cell, spec, { color: theme.paper, fontSize: 7, lineHeight: 1.2 })
              : colIndex === 0
                ? headline(cell, spec, { fontSize: 11, lineHeight: 1.08 })
                : label(cell, spec, {
                    fontSize: 8,
                    lineHeight: 1.2,
                    backgroundColor: String(cell).includes('Low') || String(cell).includes('None') || String(cell).includes('+19') || String(cell).includes('<=') ? theme.lemon : 'transparent',
                    borderWidth: String(cell).includes('Medium') || String(cell).includes('6-8') || String(cell).includes('+7') || String(cell).includes('+5') ? 1 : 0,
                    borderColor: theme.ink,
                    padding: '3px 5px'
                  })
          ])
        )
      )
    ])
  ], { pageTagMode: 'lemon' })
}

const RENDERERS = {
  cover: renderCover,
  toc: renderToc,
  stats: renderStats,
  features: renderFeatures,
  chart: renderChart,
  section: renderSection,
  quote: renderQuote,
  cta: renderCta,
  consult: renderConsult,
  chart2: renderChart2,
  process2: renderProcess2,
  matrix2: renderMatrix2
}

export function renderDensePanelGrid(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
