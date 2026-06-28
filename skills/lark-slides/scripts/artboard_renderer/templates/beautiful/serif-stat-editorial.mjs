import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'serif-stat-editorial'

const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'statement',
  'two-col',
  'data',
  'framework',
  'stats',
  'summary'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'editorial-forest',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'editorial-forest',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'summary'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'summary'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/editorial-forest-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  cover: {
    eyebrow: 'A Presentation Template',
    title: 'Quarterly\nReview\n2026',
    left_footer: 'Studio Placeholder',
    right_footer: 'Presented by Name Placeholder'
  },
  agenda: {
    title: 'Agenda.',
    subtitle: 'Five topics - ninety minutes',
    topics: [
      { num: '01', title: 'Where we stand today.', foot: 'Context', tone: 'green' },
      { num: '02', title: 'The big shift.', foot: 'Insight', tone: 'pink' },
      { num: '03', title: 'By the numbers.', foot: 'Data', tone: 'greenLite' },
      { num: '04', title: "How we'll get there.", foot: 'Plan', tone: 'cream' },
      { num: '05', title: 'What it adds up to.', foot: 'Outcomes', tone: 'greenLite' }
    ]
  },
  statement: {
    eyebrow: 'The shift',
    quote: 'The next twelve months are about doing fewer things, and doing them with more conviction.',
    name: 'Name Placeholder',
    role: 'Role Placeholder',
    section: 'Section 02'
  },
  'two-col': {
    figure: '[ image - 880 x 760 ]',
    figure_label: 'Visual 01',
    figure_caption: 'Replace with photo',
    eyebrow: 'The big shift',
    title: 'Fewer bets, stronger commitments.',
    paragraphs: [
      'Placeholder body copy sits here as a stand-in for the supporting narrative. Open with the point you want the audience to remember when they walk out of the room.',
      'Use the second paragraph to add proof - a customer, a moment in market, a number that earns the claim. Keep one idea per paragraph; trust the audience to follow.'
    ],
    meta: [
      { label: 'Owner', value: 'Team Placeholder' },
      { label: 'Timeframe', value: 'Q2 - Q4' },
      { label: 'Status', value: 'On track' }
    ]
  },
  data: {
    eyebrow: 'By the numbers',
    title: 'Revenue by quarter, year over year.',
    legend: ['This year', 'Last year'],
    bars: [
      { label: 'Q1', a: 62, b: 48 },
      { label: 'Q2', a: 74, b: 55 },
      { label: 'Q3', a: 81, b: 67 },
      { label: 'Q4', a: 88, b: 72 },
      { label: 'YTD', a: 92, b: 78 }
    ],
    left_footer: 'Revenue model',
    right_footer: 'Draft data'
  },
  framework: {
    title: "How we'll get there",
    subtitle: 'Four steps',
    intro: 'A simple plan, in four moves.',
    steps: [
      { num: 'Step 01', title: 'Listen', body: 'Open the quarter with structured conversations across teams. Capture what we hear without filtering.', meta: 'Weeks 1-2', owner: 'Owner', tone: 'cream' },
      { num: 'Step 02', title: 'Align', body: 'Cluster signals into themes. Name them plainly so everyone uses the same language in every room.', meta: 'Week 3', owner: 'Owner', tone: 'green' },
      { num: 'Step 03', title: 'Build', body: 'Convert the themes into focused initiatives, with clear measures for every proposed bet.', meta: 'Weeks 4-7', owner: 'Owner', tone: 'pink' },
      { num: 'Step 04', title: 'Review', body: 'Return to the evidence, decide what continues, and cut the work that is not learning fast enough.', meta: 'Week 8', owner: 'Owner', tone: 'cream' }
    ]
  },
  stats: {
    title: 'What it adds up to',
    subtitle: 'Year to date',
    intro: 'Three numbers that tell the story.',
    metrics: [
      { label: 'Growth', value: '+42', unit: '%', body: 'Year over year increase in active accounts, ahead of the plan we set in January.' },
      { label: 'Retention', value: '94', unit: '%', body: 'Net retention across the top customer cohort, a four-point lift from last year.' },
      { label: 'Reach', value: '3.1', unit: 'M', body: 'People served this quarter, across the markets we entered in the spring.' }
    ]
  },
  summary: {
    eyebrow: 'In summary',
    title: 'Thank you',
    subtitle: 'Three things to take.',
    items: [
      { label: 'One', body: 'The strategy holds. We are doing fewer things, and the right things.' },
      { label: 'Two', body: 'The numbers back the bets. Growth, retention, and reach are all ahead of plan.' },
      { label: 'Three', body: 'Next quarter, we keep the pace and add focus where the data points us.' }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    green: source.primary || '#2e4a2a',
    greenDeep: '#243a21',
    greenLite: '#3a5a36',
    pink: source.accent || '#e89cb1',
    pinkDeep: '#d27e96',
    cream: source.background || '#efe7d4',
    cream2: source.panel || '#e6dcc4',
    ink: source.text || '#1a1a17'
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

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''} ${spec.layout_family || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('toc')) return 'agenda'
  if (raw.includes('quote') || raw.includes('statement')) return 'statement'
  if (raw.includes('two') || raw.includes('detail')) return 'two-col'
  if (raw.includes('chart') || raw.includes('data')) return 'data'
  if (raw.includes('timeline') || raw.includes('process') || raw.includes('framework')) return 'framework'
  if (raw.includes('stat') || raw.includes('metric')) return 'stats'
  if (raw.includes('closing') || raw.includes('summary')) return 'summary'
  return 'agenda'
}

function page(backgroundColor, color, children = []) {
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor,
      color,
      overflow: 'hidden'
    },
    [
      ...textureDots(color),
      ...children
    ]
  )
}

function textureDots(color) {
  return Array.from({ length: 10 }, (_, index) =>
    box({
      position: 'absolute',
      right: 70 + (index % 5) * 15,
      bottom: 54 + Math.floor(index / 5) * 15,
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: color,
      opacity: 0.3
    })
  )
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: 2.4,
    ...role('label', spec, { fontSize: 13, lineHeight: 1, fontWeight: 500, letterSpacing: 2.4, textTransform: 'uppercase' }),
    ...style
  })
}

function serif(value, spec, style = {}) {
  return TextBlock(value, {
    fontSize: 15,
    lineHeight: 1.35,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.35, fontWeight: 400 }),
    ...style
  })
}

function title(value, spec, style = {}) {
  return Title(value, {
    fontSize: 48,
    lineHeight: 0.96,
    letterSpacing: -0.8,
    ...role('display', spec, { fontSize: 48, lineHeight: 0.96, fontWeight: 500, letterSpacing: -0.8 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    fontSize: 72,
    lineHeight: 0.94,
    letterSpacing: -1.2,
    ...role('metric', spec, { fontSize: 72, lineHeight: 0.94, fontWeight: 500, letterSpacing: -1.2 }),
    ...style
  })
}

function rule(style = {}) {
  return box({ position: 'absolute', height: 1, backgroundColor: 'currentColor', opacity: 1, ...style })
}

function topbar(spec, theme, left, right = 'EF', color = theme.green, y = 48, x = 60) {
  return [
    label(left, spec, { position: 'absolute', left: x, top: y, color }),
    TextBlock(String(right).toUpperCase(), {
      position: 'absolute',
      right: x,
      top: y - 10,
      width: 65,
      height: 65,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: color,
      color,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      letterSpacing: 1.2,
      ...role('label', spec, { fontSize: 14, lineHeight: 1, fontWeight: 500, letterSpacing: 1.2 })
    })
  ]
}

function renderCover(spec, theme) {
  const c = content(spec, 'cover')
  return page(theme.green, theme.pink, [
    ...topbar(spec, theme, value(spec, 'eyebrow', c.eyebrow), '01', theme.pink, 52, 70),
    title(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 70,
      top: 118,
      width: 640,
      color: theme.pink,
      fontSize: 108,
      lineHeight: 0.92,
      whiteSpace: 'pre-line'
    }),
    label(value(spec, 'left_footer', c.left_footer), spec, { position: 'absolute', left: 70, bottom: 66, color: theme.pink }),
    label(value(spec, 'right_footer', c.right_footer), spec, { position: 'absolute', right: 70, bottom: 66, color: theme.pink, textAlign: 'right' })
  ])
}

function agendaTile(spec, theme, item, x, y, w, h) {
  const tone = item.tone || 'cream'
  const fill = tone === 'green' ? theme.green : tone === 'pink' ? theme.pink : tone === 'greenLite' ? theme.greenLite : theme.cream2
  const color = tone === 'green' || tone === 'greenLite' ? theme.pink : theme.greenDeep
  const bordered = tone === 'cream'
  return box(
    {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: fill,
      borderRadius: 6,
      borderWidth: bordered ? 1 : 0,
      borderColor: theme.green,
      padding: 20,
      flexDirection: 'column',
      justifyContent: 'space-between',
      color
    },
    [
      label(item.num, spec, { color, fontSize: 12, letterSpacing: 1.5 }),
      title(item.title, spec, {
        color,
        width: w - 48,
        fontSize: tone === 'green' ? 42 : 28,
        lineHeight: 0.98
      }),
      label(item.foot, spec, { color, fontSize: 11, letterSpacing: 1.4 })
    ]
  )
}

function renderAgenda(spec, theme) {
  const c = content(spec, 'agenda')
  const topics = array(spec, 'topics', c.topics)
  return page(theme.cream, theme.green, [
    title(value(spec, 'title', c.title), spec, { position: 'absolute', left: 60, top: 66, width: 290, color: theme.green }),
    label(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', right: 60, top: 82, color: theme.green }),
    agendaTile(spec, theme, topics[0], 60, 155, 360, 320),
    agendaTile(spec, theme, topics[1], 432, 155, 218, 148),
    agendaTile(spec, theme, topics[2], 662, 155, 238, 148),
    agendaTile(spec, theme, topics[3], 432, 327, 218, 148),
    agendaTile(spec, theme, topics[4], 662, 327, 238, 148)
  ])
}

function renderStatement(spec, theme) {
  const c = content(spec, 'statement')
  return page(theme.pink, theme.greenDeep, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 80, top: 66, color: theme.greenDeep }),
    title(value(spec, 'quote', c.quote), spec, {
      position: 'absolute',
      left: 80,
      top: 128,
      width: 730,
      color: theme.greenDeep,
      fontSize: 60,
      lineHeight: 1.02
    }),
    serif(value(spec, 'name', c.name), spec, { position: 'absolute', left: 80, bottom: 65, color: theme.greenDeep, fontSize: 22, fontWeight: 600 }),
    label(value(spec, 'role', c.role), spec, { position: 'absolute', left: 80, bottom: 38, color: theme.greenDeep }),
    label(value(spec, 'section', c.section), spec, { position: 'absolute', right: 80, bottom: 38, color: theme.greenDeep, textAlign: 'right' })
  ])
}

function renderTwoCol(spec, theme) {
  const c = content(spec, 'two-col')
  const paragraphs = array(spec, 'paragraphs', c.paragraphs)
  const meta = array(spec, 'meta', c.meta)
  return page(theme.cream, theme.ink, [
    box({
      position: 'absolute',
      left: 60,
      top: 55,
      width: 440,
      height: 420,
      borderRadius: 6,
      backgroundColor: theme.green,
      alignItems: 'center',
      justifyContent: 'center'
    }, [
      serif(value(spec, 'figure', c.figure), spec, { color: theme.pink, fontSize: 28, width: 280, textAlign: 'center', justifyContent: 'center' }),
      label(value(spec, 'figure_label', c.figure_label), spec, { position: 'absolute', left: 18, bottom: 24, color: theme.pink }),
      label(value(spec, 'figure_caption', c.figure_caption), spec, { position: 'absolute', right: 18, bottom: 24, color: theme.pink, textAlign: 'right' })
    ]),
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 550, top: 58, color: theme.green }),
    title(value(spec, 'title', c.title), spec, { position: 'absolute', left: 550, top: 100, width: 350, color: theme.green }),
    serif(paragraphs[0] || '', spec, { position: 'absolute', left: 550, top: 250, width: 345, color: theme.ink, fontSize: 14, lineHeight: 1.36 }),
    serif(paragraphs[1] || '', spec, { position: 'absolute', left: 550, top: 330, width: 345, color: theme.ink, fontSize: 14, lineHeight: 1.36 }),
    rule({ left: 550, bottom: 100, width: 345, backgroundColor: theme.green }),
    ...meta.slice(0, 3).map((item, index) => box({
      position: 'absolute',
      left: 550 + index * 118,
      bottom: 55,
      width: 105,
      flexDirection: 'column'
    }, [
      label(item.label, spec, { color: theme.green, fontSize: 10, letterSpacing: 1.4 }),
      serif(item.value, spec, { color: theme.ink, fontSize: 16, lineHeight: 1.1, marginTop: 8, fontWeight: 500 })
    ]))
  ])
}

function renderData(spec, theme) {
  const c = content(spec, 'data')
  const bars = array(spec, 'bars', c.bars)
  const legend = array(spec, 'legend', c.legend)
  const chartLeft = 140
  const chartTop = 250
  const chartHeight = 210
  const chartWidth = 720
  return page(theme.green, theme.cream, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 60, top: 56, color: theme.pink }),
    title(value(spec, 'title', c.title), spec, { position: 'absolute', left: 60, top: 92, width: 620, color: theme.cream, fontSize: 42, lineHeight: 1 }),
    ...legend.slice(0, 2).map((item, index) => box({ position: 'absolute', right: 60, top: 65 + index * 24, alignItems: 'center' }, [
      box({ width: 13, height: 13, borderRadius: 2, backgroundColor: index === 0 ? theme.pink : theme.cream, marginRight: 8 }),
      label(item, spec, { color: theme.cream, fontSize: 11, letterSpacing: 1.2 })
    ])),
    ...[100, 75, 50, 25, 0].map((tick, index) => label(String(tick), spec, { position: 'absolute', left: 82, top: chartTop - 4 + index * 52, width: 34, color: theme.cream, textAlign: 'right', fontSize: 11, letterSpacing: 0.8 })),
    box({ position: 'absolute', left: chartLeft, top: chartTop, width: 1, height: chartHeight, backgroundColor: theme.cream }),
    box({ position: 'absolute', left: chartLeft, top: chartTop + chartHeight, width: chartWidth, height: 1, backgroundColor: theme.cream }),
    ...[1, 2, 3].map((i) => box({ position: 'absolute', left: chartLeft, top: chartTop + i * 52, width: chartWidth, height: 1, backgroundColor: theme.cream, opacity: 0.18 })),
    ...bars.slice(0, 5).flatMap((bar, index) => {
      const groupX = chartLeft + 44 + index * 136
      const aHeight = Math.round(chartHeight * (bar.a || bar.value || 60) / 100)
      const bHeight = Math.round(chartHeight * (bar.b || Math.max(20, (bar.a || 60) - 12)) / 100)
      return [
        box({ position: 'absolute', left: groupX, top: chartTop + chartHeight - aHeight, width: 28, height: aHeight, backgroundColor: theme.pink, borderRadius: '3px 3px 0 0' }),
        box({ position: 'absolute', left: groupX + 38, top: chartTop + chartHeight - bHeight, width: 28, height: bHeight, backgroundColor: theme.cream, borderRadius: '3px 3px 0 0' }),
        label(String(bar.a || bar.value || ''), spec, { position: 'absolute', left: groupX - 5, top: chartTop + chartHeight - aHeight - 20, color: theme.cream, fontSize: 10, letterSpacing: 0.8 }),
        label(String(bar.b || ''), spec, { position: 'absolute', left: groupX + 35, top: chartTop + chartHeight - bHeight - 20, color: theme.cream, fontSize: 10, letterSpacing: 0.8 }),
        label(bar.label || `Q${index + 1}`, spec, { position: 'absolute', left: groupX - 22, top: chartTop + chartHeight + 18, width: 100, color: theme.cream, textAlign: 'center', fontSize: 12, letterSpacing: 1 })
      ]
    }),
    label(value(spec, 'left_footer', c.left_footer), spec, { position: 'absolute', left: 60, bottom: 36, color: theme.pink }),
    label(value(spec, 'right_footer', c.right_footer), spec, { position: 'absolute', right: 60, bottom: 36, color: theme.pink, textAlign: 'right' })
  ])
}

function renderFramework(spec, theme) {
  const c = content(spec, 'framework')
  const steps = array(spec, 'steps', c.steps)
  return page(theme.cream, theme.green, [
    label(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', right: 60, top: 62, color: theme.green, textAlign: 'right' }),
    title(value(spec, 'title', c.title), spec, { position: 'absolute', left: 60, top: 62, width: 570, color: theme.green, fontSize: 48 }),
    serif(value(spec, 'intro', c.intro), spec, { position: 'absolute', left: 60, top: 134, color: theme.green, fontSize: 18 }),
    ...steps.slice(0, 4).map((step, index) => {
      const fill = step.tone === 'green' ? theme.green : step.tone === 'pink' ? theme.pink : theme.cream
      const color = step.tone === 'green' ? theme.pink : step.tone === 'pink' ? theme.greenDeep : theme.green
      return box({
        position: 'absolute',
        left: 60 + index * 214,
        top: 192,
        width: 196,
        height: 270,
        flexDirection: 'column',
        backgroundColor: fill,
        color,
        borderRadius: 8,
        borderWidth: step.tone === 'cream' ? 1.5 : 0,
        borderColor: theme.green,
        padding: 18
      }, [
        label(step.num, spec, { color, fontSize: 10, letterSpacing: 1.2 }),
        title(step.title, spec, { color, fontSize: 33, lineHeight: 0.98, marginTop: 18, width: 150 }),
        serif(step.body, spec, { color, fontSize: 13, lineHeight: 1.34, marginTop: 16, width: 150 }),
        box({ marginTop: 'auto', borderTopWidth: 1, borderTopColor: color, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }, [
          label(step.meta, spec, { color, fontSize: 9, letterSpacing: 1 }),
          label(step.owner, spec, { color, fontSize: 9, letterSpacing: 1, textAlign: 'right' })
        ])
      ])
    })
  ])
}

function renderStats(spec, theme) {
  const c = content(spec, 'stats')
  const metrics = array(spec, 'metrics', c.metrics)
  return page(theme.green, theme.cream, [
    label(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', right: 60, top: 64, color: theme.pink, textAlign: 'right' }),
    title(value(spec, 'title', c.title), spec, { position: 'absolute', left: 60, top: 62, width: 640, color: theme.cream, fontSize: 41 }),
    serif(value(spec, 'intro', c.intro), spec, { position: 'absolute', left: 60, top: 130, color: theme.cream, fontSize: 17 }),
    rule({ left: 60, top: 205, width: 840, backgroundColor: theme.pink }),
    ...metrics.slice(0, 3).map((item, index) => box({
      position: 'absolute',
      left: 60 + index * 295,
      top: 236,
      width: 250,
      flexDirection: 'column'
    }, [
      label(item.label, spec, { color: theme.pink, fontSize: 11, letterSpacing: 1.3 }),
      box({ marginTop: 14, alignItems: 'flex-end' }, [
        metric(item.value, spec, { color: theme.pink, fontSize: 82 }),
        metric(item.unit, spec, { color: theme.cream, fontSize: 42, marginLeft: 3, marginBottom: 7 })
      ]),
      serif(item.body, spec, { color: theme.cream, fontSize: 15, lineHeight: 1.32, marginTop: 20, width: 235 })
    ]))
  ])
}

function renderSummary(spec, theme) {
  const c = content(spec, 'summary')
  const items = array(spec, 'items', c.items)
  return page(theme.green, theme.cream, [
    ...topbar(spec, theme, value(spec, 'eyebrow', c.eyebrow), '08', theme.pink, 54, 70),
    title(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 70,
      top: 134,
      width: 720,
      color: theme.pink,
      fontSize: 108,
      lineHeight: 0.94
    }),
    label(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', left: 70, top: 310, color: theme.pink }),
    rule({ left: 70, top: 360, width: 820, backgroundColor: theme.pink }),
    ...items.slice(0, 3).map((item, index) => box({
      position: 'absolute',
      left: 70 + index * 285,
      top: 382,
      width: 245,
      flexDirection: 'column'
    }, [
      label(item.label, spec, { color: theme.pink, fontSize: 12, letterSpacing: 1.4 }),
      serif(item.body, spec, { color: theme.cream, fontSize: 16, lineHeight: 1.32, marginTop: 16, width: 230 })
    ]))
  ])
}

export function renderSerifStatEditorial(spec) {
  const theme = colors(spec)
  const variant = normalizeVariant(spec)
  if (variant === 'cover') return renderCover(spec, theme)
  if (variant === 'agenda') return renderAgenda(spec, theme)
  if (variant === 'statement') return renderStatement(spec, theme)
  if (variant === 'two-col') return renderTwoCol(spec, theme)
  if (variant === 'data') return renderData(spec, theme)
  if (variant === 'framework') return renderFramework(spec, theme)
  if (variant === 'stats') return renderStats(spec, theme)
  return renderSummary(spec, theme)
}
