import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'grove-organic-brief'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = [
  'cover',
  'chapter',
  'statement',
  'split',
  'stats',
  'list',
  'quote',
  'compare',
  'chapter-9',
  'statement-10',
  'chart',
  'end'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'grove',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'grove',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'quote', 'end'],
      repeatable: ['chapter', 'statement', 'split', 'stats', 'list', 'compare', 'chapter-9', 'statement-10', 'chart']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/grove-1.png'
}

const DEFAULTS = {
  cover: {
    eyebrow: 'Strategy - Presentation',
    title: '[Presentation Title\nGoes Here]',
    subtitle: 'A type of work for audience or occasion. Month, Year.',
    footer_left: '[Prepared by]',
    footer_right: '[Confidential]',
    marker: '01'
  },
  chapter: {
    num: '01',
    eyebrow: '01 / Context',
    title: 'The landscape has shifted. Now we must decide where to stand.',
    subtitle: 'An honest assessment of where the market is, and where the opportunity lies.'
  },
  statement: {
    sidebar: 'The Thesis',
    chrome_left: 'Core Insight',
    chrome_right: '03',
    kicker: 'The Argument',
    title: 'The brands that will lead the next decade are not the ones with the best product. They are the ones with the deepest understanding.',
    foot_right: '03 / 12'
  },
  split: {
    sidebar: 'The Evidence',
    chrome_left: 'Research - Insight',
    chrome_right: '04',
    kicker: 'What We Found',
    title: 'Audiences have outgrown the stories being told about them',
    body: 'Three years of primary research across six markets revealed a consistent pattern: the gap between how brands communicate and how people actually live is widening.',
    items: [
      'Authenticity is valued over aspiration in all categories tested',
      'Trust is earned through consistency, not campaigns',
      'Communities form around shared values, not product features'
    ],
    image_label: '[IMAGE PLACEHOLDER]',
    image_caption: '[Caption: research context or visual annotation]',
    foot_right: '04 / 12'
  },
  stats: {
    sidebar: 'By The Numbers',
    chrome_left: 'Market - Metrics',
    chrome_right: '05',
    title: 'Three numbers that define the opportunity',
    metrics: [
      { value: '73%', label: 'Of consumers distrust brand-created content' },
      { value: '4.8x', label: 'Higher engagement for community-driven campaigns' },
      { value: '#1', label: 'Driver of purchase decisions: peer recommendation' }
    ],
    source: 'Source: Primary Research - Year - N=sample size across geographies',
    foot_right: '05 / 12'
  },
  list: {
    sidebar: 'Our Approach',
    chrome_left: 'Framework',
    chrome_right: '06',
    kicker: 'What Changes',
    title: 'Five principles that reframe how we think about brand',
    body: 'These are not tactics. They are the underlying commitments that make everything else possible.',
    items: [
      'Start with the community, not the product - earn presence before claiming it',
      'Replace broadcast with conversation - listen before speaking',
      'Make the values visible in operations, not just in messaging',
      'Treat long-term relationship as the primary metric, not reach',
      'Give audiences ownership of the narrative - participation over performance'
    ],
    foot_right: '06 / 12'
  },
  quote: {
    quote: 'The most radical thing a brand can do right now is simply tell the truth about what it is, and what it is not.',
    author: '[Author Name]',
    role: '[Title] - [Year]'
  },
  compare: {
    sidebar: 'Before / After',
    chrome_left: 'The Shift',
    chrome_right: '08',
    columns: [
      {
        title: 'The Old Model',
        subtitle: 'Brand as broadcaster - pushing messages outward',
        body: 'The organization speaks. The audience receives. Feedback is collected in annual surveys and processed into next year messaging brief.',
        items: ['Campaigns replace conversations', 'Reach is the primary metric', 'Community is a distribution channel']
      },
      {
        title: 'The New Model',
        subtitle: 'Brand as participant - embedded in the community',
        body: 'The organization listens first and speaks in response. Feedback is constant, not a project. The community owns the story as much as the brand does.',
        items: ['Relationships replace campaigns', 'Trust is the primary metric', 'Community is the source of strategy']
      }
    ],
    foot_right: '08 / 12'
  },
  'chapter-9': {
    num: '02',
    eyebrow: '02 / Recommendation',
    title: 'What we propose - and why we believe it will work',
    subtitle: 'A practical framework built on the evidence, with clear priorities and measurable outcomes.'
  },
  'statement-10': {
    sidebar: 'The Recommendation',
    chrome_left: 'Strategic Direction',
    chrome_right: '10',
    kicker: 'The Path Forward',
    title: 'Stop managing perception. Start deserving it.',
    body: 'The organizations that win the next decade will earn trust slowly, through consistent action - not through the perfection of their messaging.',
    foot_right: '10 / 12',
    light: true
  },
  chart: {
    sidebar: 'The Data',
    chrome_left: 'Trust Index - Category Benchmarks',
    chrome_right: '11',
    title: 'Consumer trust by category',
    subtitle: 'Score out of 100 - Year - N=X',
    bars: [
      { value: 38, label: 'Finance' },
      { value: 44, label: 'Media' },
      { value: 56, label: 'Retail' },
      { value: 62, label: 'Healthcare' },
      { value: 79, label: 'Community' }
    ],
    source: 'Source: Research Institute - Consumer Trust Index - Year',
    foot_right: '11 / 12'
  },
  end: {
    marker: '12',
    title: '[Organization]',
    subtitle: 'The work begins when the presentation ends.',
    contact: '[Author Name] - author@organization.com - organization.com',
    footer: '[Deck version] - [Date] - [Confidentiality note]'
  }
}

function theme() {
  return {
    bg: '#192B1B',
    bgAlt: '#1E3221',
    light: '#E8E4D6',
    lightAlt: '#DEDAD0',
    cream: '#D4CFBF',
    cream2: '#AFA995',
    cream3: '#716F65',
    green: '#192B1B',
    green2: '#5F6759',
    accent: '#C8524A',
    borderDark: 'rgba(212,207,191,0.16)',
    borderLight: 'rgba(25,43,27,0.18)',
    watermarkDark: 'rgba(212,207,191,0.07)',
    watermarkLight: 'rgba(25,43,27,0.07)'
  }
}

function array(spec, key, fallback = []) {
  const value = spec.content?.[key]
  return Array.isArray(value) && value.length ? value : fallback
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''} ${spec.layout_family || ''}`
    .toLowerCase()
    .replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('chapter')) return 'chapter'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('compare') || raw.includes('split')) return 'compare'
  if (raw.includes('chart') || raw.includes('data') || raw.includes('metric')) return 'stats'
  if (raw.includes('process') || raw.includes('list')) return 'list'
  if (raw.includes('closing') || raw.includes('end')) return 'end'
  return 'statement'
}

function page(mode, children = []) {
  const t = theme()
  const dark = mode === 'dark'
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: dark ? t.bg : t.light,
      color: dark ? t.cream : t.green,
      overflow: 'hidden'
    },
    children
  )
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 1.35,
    ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 300, letterSpacing: 1.35, textTransform: 'uppercase' }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    fontSize: 15,
    lineHeight: 1.55,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.55, fontWeight: 300 }),
    ...style
  })
}

function heading(value, spec, style = {}) {
  return Title(String(value || ''), {
    fontSize: 54,
    lineHeight: 1.07,
    letterSpacing: -0.3,
    fontWeight: 400,
    ...role('display', spec, { fontSize: 54, lineHeight: 1.07, fontWeight: 400, letterSpacing: -0.3 }),
    ...style
  })
}

function smallHeading(value, spec, style = {}) {
  return Title(String(value || ''), {
    fontSize: 32,
    lineHeight: 1.18,
    fontWeight: 400,
    ...role('display', spec, { fontSize: 32, lineHeight: 1.18, fontWeight: 400 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    fontSize: 52,
    lineHeight: 0.96,
    letterSpacing: -0.6,
    ...role('metric', spec, { fontSize: 52, lineHeight: 0.96, fontWeight: 400, letterSpacing: -0.6 }),
    ...style
  })
}

function rule(x, y, width, color, opacity = 1) {
  return box({ position: 'absolute', left: x, top: y, width, height: 1, backgroundColor: color, opacity })
}

function chrome(spec, mode, left, right, footRight) {
  const t = theme()
  const dark = mode === 'dark'
  const color = dark ? t.cream2 : t.green2
  const border = dark ? t.borderDark : t.borderLight
  return [
    box({ position: 'absolute', left: 76, right: 76, top: 42, height: 30, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: border }, [
      label(left || '', spec, { color }),
      label(right || '', spec, { color, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 76, right: 76, bottom: 36, height: 30, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: border, paddingTop: 11 }, [
      label('', spec, { color }),
      label(footRight || '', spec, { color, textAlign: 'right' })
    ])
  ]
}

function sidebar(spec, text, mode) {
  const t = theme()
  const dark = mode === 'dark'
  return label(text || '', spec, {
    position: 'absolute',
    left: 22,
    top: 262,
    width: 210,
    color: dark ? t.cream3 : t.green2,
    transform: 'rotate(-90deg)',
    transformOrigin: '0 0',
    textAlign: 'center'
  })
}

function watermark(value, spec, mode, style = {}) {
  const t = theme()
  return TextBlock(String(value || ''), {
    position: 'absolute',
    right: 82,
    bottom: -42,
    color: mode === 'dark' ? t.watermarkDark : t.watermarkLight,
    fontSize: 176,
    lineHeight: 0.9,
    letterSpacing: -3,
    ...role('display', spec, { fontSize: 176, lineHeight: 0.9, fontWeight: 400, letterSpacing: -3 }),
    ...style
  })
}

function bulletList(items, spec, mode, style = {}) {
  const t = theme()
  const dark = mode === 'dark'
  return box({ flexDirection: 'column', gap: 12, ...style }, items.slice(0, 6).map((item) =>
    box({ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, [
      label('-', spec, { width: 16, color: t.accent, fontSize: 13, lineHeight: 1.2, letterSpacing: 0 }),
      body(item, spec, { width: 360, color: dark ? t.cream : t.green, fontSize: 14, lineHeight: 1.45 })
    ])
  ))
}

function renderCover(spec) {
  const t = theme()
  const c = content(spec, 'cover')
  return page('dark', [
    label(c.eyebrow, spec, { position: 'absolute', left: 82, top: 60, color: t.cream2 }),
    metric(c.marker, spec, { position: 'absolute', right: 90, top: 48, color: t.accent, fontSize: 11, letterSpacing: 1.6 }),
    heading(c.title, spec, { position: 'absolute', left: 82, top: 188, width: 610, color: t.cream, fontSize: 70, lineHeight: 0.96, letterSpacing: -0.6 }),
    rule(82, 358, 36, t.accent),
    body(c.subtitle, spec, { position: 'absolute', left: 82, top: 388, width: 430, color: t.cream2, fontSize: 16, lineHeight: 1.55 }),
    label(c.footer_left, spec, { position: 'absolute', left: 82, bottom: 58, color: t.cream3 }),
    label(c.footer_right, spec, { position: 'absolute', right: 82, bottom: 58, color: t.cream3, textAlign: 'right' }),
    watermark('01', spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ])
}

function renderChapter(spec, variant) {
  const t = theme()
  const c = content(spec, variant)
  return page('dark', [
    watermark(c.num, spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 }),
    metric(c.num, spec, { position: 'absolute', left: 96, top: 112, color: t.accent, fontSize: 15, letterSpacing: 3 }),
    label(c.eyebrow, spec, { position: 'absolute', left: 96, top: 168, color: t.accent }),
    rule(96, 206, 36, t.accent),
    heading(c.title, spec, { position: 'absolute', left: 96, top: 228, width: 610, color: t.cream, fontSize: variant === 'chapter-9' ? 40 : 43, lineHeight: 1.12 }),
    body(c.subtitle, spec, { position: 'absolute', left: 96, top: variant === 'chapter-9' ? 386 : 405, width: 450, color: t.cream2, fontSize: 15, lineHeight: 1.5 })
  ])
}

function renderStatement(spec, variant = 'statement') {
  const c = content(spec, variant)
  const t = theme()
  const mode = c.light ? 'light' : 'dark'
  const dark = mode === 'dark'
  return page(mode, [
    sidebar(spec, c.sidebar, mode),
    ...chrome(spec, mode, c.chrome_left, c.chrome_right, c.foot_right),
    label(c.kicker, spec, { position: 'absolute', left: 148, top: 158, color: t.accent }),
    rule(148, 194, 36, t.accent),
    heading(c.title, spec, {
      position: 'absolute',
      left: 148,
      top: 214,
      width: c.light ? 640 : 600,
      color: dark ? t.cream : t.green,
      fontSize: c.light ? 42 : 34,
      lineHeight: c.light ? 1.12 : 1.2
    }),
    c.body ? body(c.body, spec, { position: 'absolute', left: 150, top: c.light ? 328 : 370, width: 550, color: dark ? t.cream2 : t.green2, fontSize: 15, lineHeight: 1.5 }) : null,
    watermark(c.chrome_right || '03', spec, mode, { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ].filter(Boolean))
}

function renderSplit(spec) {
  const c = content(spec, 'split')
  const t = theme()
  const items = array(spec, 'items', c.items)
  return page('light', [
    sidebar(spec, c.sidebar, 'light'),
    ...chrome(spec, 'light', c.chrome_left, c.chrome_right, c.foot_right),
    label(c.kicker, spec, { position: 'absolute', left: 116, top: 122, color: t.accent }),
    smallHeading(c.title, spec, { position: 'absolute', left: 116, top: 154, width: 350, color: t.green, fontSize: 27, lineHeight: 1.16 }),
    body(c.body, spec, { position: 'absolute', left: 116, top: 282, width: 345, color: t.green2, fontSize: 12, lineHeight: 1.42 }),
    bulletList(items, spec, 'light', { position: 'absolute', left: 116, top: 366, width: 390, gap: 7 }),
    box({ position: 'absolute', right: 92, top: 128, width: 340, height: 304, backgroundColor: t.lightAlt, borderWidth: 1, borderColor: t.borderLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }, [
      label(c.image_label, spec, { color: t.green2 }),
      body(c.image_caption, spec, { width: 210, textAlign: 'center', color: t.green2, fontSize: 12, lineHeight: 1.35 })
    ])
  ])
}

function renderStats(spec) {
  const c = content(spec, 'stats')
  const t = theme()
  const metrics = array(spec, 'metrics', c.metrics)
  return page('dark', [
    sidebar(spec, c.sidebar, 'dark'),
    ...chrome(spec, 'dark', c.chrome_left, c.chrome_right, c.foot_right),
    heading(c.title, spec, { position: 'absolute', left: 114, top: 134, width: 650, color: t.cream, fontSize: 42, lineHeight: 1.15 }),
    box({ position: 'absolute', left: 114, right: 110, top: 250, height: 118, flexDirection: 'row', gap: 44 }, metrics.slice(0, 3).map((m) =>
      box({ width: 210, flexDirection: 'column', borderBottomWidth: 1, borderColor: t.borderDark, paddingBottom: 22 }, [
        metric(m.value || m, spec, { color: t.accent, fontSize: 52, lineHeight: 0.96, letterSpacing: -0.8 }),
        label(m.label || '', spec, { marginTop: 14, color: t.cream2, fontSize: 9, lineHeight: 1.3, letterSpacing: 1 })
      ])
    )),
    body(c.source, spec, { position: 'absolute', left: 114, bottom: 82, width: 540, color: t.cream3, fontSize: 11, lineHeight: 1.4 }),
    watermark('05', spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ])
}

function renderList(spec) {
  const c = content(spec, 'list')
  const t = theme()
  const items = array(spec, 'items', c.items)
  return page('light', [
    sidebar(spec, c.sidebar, 'light'),
    ...chrome(spec, 'light', c.chrome_left, c.chrome_right, c.foot_right),
    label(c.kicker, spec, { position: 'absolute', left: 110, top: 138, color: t.accent }),
    smallHeading(c.title, spec, { position: 'absolute', left: 110, top: 170, width: 300, color: t.green, fontSize: 25, lineHeight: 1.18 }),
    body(c.body, spec, { position: 'absolute', left: 110, top: 302, width: 285, color: t.green2, fontSize: 13, lineHeight: 1.45 }),
    bulletList(items, spec, 'light', { position: 'absolute', left: 488, top: 142, width: 350, gap: 17 })
  ])
}

function renderQuote(spec) {
  const c = content(spec, 'quote')
  const t = theme()
  return page('dark', [
    TextBlock('"', { position: 'absolute', left: 106, top: 90, color: t.accent, fontSize: 104, lineHeight: 0.7, ...role('display', spec, { fontSize: 104, lineHeight: 0.7, fontWeight: 400 }) }),
    heading(c.quote, spec, { position: 'absolute', left: 130, top: 176, width: 706, color: t.cream, fontSize: 43, lineHeight: 1.27, fontStyle: 'italic' }),
    rule(130, 392, 36, t.accent),
    label(c.author, spec, { position: 'absolute', left: 130, top: 420, color: t.cream }),
    label(c.role, spec, { position: 'absolute', left: 130, top: 446, color: t.cream3 }),
    watermark('07', spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ])
}

function renderCompare(spec) {
  const c = content(spec, 'compare')
  const t = theme()
  const columns = array(spec, 'columns', c.columns)
  return page('light', [
    sidebar(spec, c.sidebar, 'light'),
    ...chrome(spec, 'light', c.chrome_left, c.chrome_right, c.foot_right),
    box({ position: 'absolute', left: 104, top: 120, bottom: 86, width: 752, flexDirection: 'row' }, columns.slice(0, 2).map((col, index) =>
      box({ width: 376, paddingLeft: index ? 48 : 0, paddingRight: index ? 0 : 48, borderRightWidth: index ? 0 : 1, borderColor: t.borderLight, flexDirection: 'column' }, [
        label(col.title, spec, { color: t.accent, marginBottom: 18 }),
        smallHeading(col.subtitle, spec, { color: t.green, fontSize: 24, lineHeight: 1.18, marginBottom: 18 }),
        body(col.body, spec, { color: t.green2, fontSize: 12, lineHeight: 1.4, marginBottom: 20 }),
        bulletList(col.items || [], spec, 'light', { gap: 9 })
      ])
    ))
  ])
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const t = theme()
  const bars = array(spec, 'bars', c.bars)
  const max = Math.max(...bars.map((b) => Number(b.value || 1)), 100)
  return page('dark', [
    sidebar(spec, c.sidebar, 'dark'),
    ...chrome(spec, 'dark', c.chrome_left, c.chrome_right, c.foot_right),
    heading(c.title, spec, { position: 'absolute', left: 112, top: 126, width: 520, color: t.cream, fontSize: 42, lineHeight: 1.15 }),
    body(c.subtitle, spec, { position: 'absolute', left: 114, top: 216, width: 420, color: t.cream2, fontSize: 13, lineHeight: 1.35 }),
    box({ position: 'absolute', left: 115, top: 264, width: 700, height: 150, flexDirection: 'column', gap: 11 }, bars.map((bar) => {
      const value = Number(bar.value || 0)
      const barWidth = Math.max(80, Math.round((value / max) * 460))
      return box({ height: 22, flexDirection: 'row', alignItems: 'center' }, [
        metric(value, spec, { width: 52, color: t.accent, fontSize: 23, lineHeight: 1 }),
        label(bar.label || '', spec, { width: 132, color: t.cream, fontSize: 10, letterSpacing: 1 }),
        box({ width: 480, height: 10, backgroundColor: t.bgAlt, borderWidth: 1, borderColor: t.borderDark }, [
          box({ width: barWidth, height: 8, backgroundColor: t.accent, opacity: 0.82 })
        ])
      ])
    })),
    body(c.source, spec, { position: 'absolute', left: 114, bottom: 82, width: 520, color: t.cream3, fontSize: 11, lineHeight: 1.35 }),
    watermark('11', spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ])
}

function renderEnd(spec) {
  const c = content(spec, 'end')
  const t = theme()
  return page('dark', [
    metric(c.marker, spec, { position: 'absolute', left: 96, top: 84, color: t.accent, fontSize: 13, letterSpacing: 2.4 }),
    heading(c.title, spec, { position: 'absolute', left: 96, top: 176, width: 620, color: t.cream, fontSize: 58, lineHeight: 1.05 }),
    rule(96, 290, 36, t.accent),
    body(c.subtitle, spec, { position: 'absolute', left: 96, top: 318, width: 520, color: t.cream2, fontSize: 17, lineHeight: 1.55 }),
    label(c.contact, spec, { position: 'absolute', left: 96, bottom: 94, color: t.cream2, fontSize: 9, letterSpacing: 1 }),
    label(c.footer, spec, { position: 'absolute', left: 96, bottom: 62, color: t.cream3, fontSize: 9, letterSpacing: 1 }),
    watermark('12', spec, 'dark', { right: 104, bottom: 92, fontSize: 44, opacity: 0.3 })
  ])
}

const RENDERERS = {
  cover: renderCover,
  chapter: (spec) => renderChapter(spec, 'chapter'),
  statement: (spec) => renderStatement(spec, 'statement'),
  split: renderSplit,
  stats: renderStats,
  list: renderList,
  quote: renderQuote,
  compare: renderCompare,
  'chapter-9': (spec) => renderChapter(spec, 'chapter-9'),
  'statement-10': (spec) => renderStatement(spec, 'statement-10'),
  chart: renderChart,
  end: renderEnd
}

export function renderGroveOrganicBrief(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderStatement)(spec)
}
