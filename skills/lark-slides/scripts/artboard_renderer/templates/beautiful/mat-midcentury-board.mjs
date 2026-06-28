import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'mat-midcentury-board'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'statement', 'split', 'stats', 'quote', 'list', 'compare', 'chart', 'end']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'mat',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'mat',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'quote', 'end'],
      repeatable: ['statement', 'split', 'stats', 'list', 'compare', 'chart']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/mat-1.png'
}

const DEFAULTS = {
  cover: {
    eyebrow: 'Studio Name - 2026',
    title: 'Craft\nMatters',
    subtitle: 'Designed for the hands that build things. A one-line description of what this product does.',
    caption: 'Tagline goes here',
    card_title: 'Designed by Studio Name,\nthe precision studio tools lab.',
    card_body: "The world's most carefully considered product category.",
    footer_left: 'Product Design - April 2026',
    footer_right: 'MAT / 2026'
  },
  statement: {
    chrome_left: 'The Thesis',
    chrome_right: '02',
    kicker: 'Design Principle',
    title: 'Every surface is a decision.',
    body: 'The studio environment shapes the work that happens inside it. Materials that perform quietly let the maker stay in flow.',
    items: [
      'Surface texture calibrated for blade resistance without drag',
      'Grip underside prevents slip on any workbench material',
      'Grid lines printed in low-contrast ink - visible without competing'
    ],
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  split: {
    chrome_left: 'The Object',
    chrome_right: '03',
    kicker: 'Material Detail',
    title: 'A one-line description of what this product does.',
    body: 'A two-layer construction built for the way real studio work actually happens.',
    image_label: 'Product Image',
    items: [
      '4mm recycled rubber base - weighted to stay flat',
      'Natural composite surface - self-healing up to 3000 uses',
      'Three colorways: Forest, Sand, Charcoal'
    ],
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  stats: {
    chrome_left: 'By the Numbers',
    chrome_right: '04',
    title: 'The numbers that define the product category.',
    metrics: [
      { value: '4.7k', label: 'Units sold in the first 90 days of launch, across 12 countries.' },
      { value: '3.2x', label: 'Longer lifespan than the leading competitor in independent studio tests.' },
      { value: '#1', label: 'Top-rated product category by Studio Supply Journal for two consecutive years.' }
    ],
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  quote: {
    title: 'Good design is as little design as possible.',
    quote: 'Good design is as little design as possible.',
    author: 'Dieter Rams',
    role: 'Designer'
  },
  list: {
    chrome_left: 'Why It Matters',
    chrome_right: '06',
    kicker: 'The Case',
    title: 'What a studio tool should do for the maker.',
    body: "Four principles that informed every material and dimension decision in the product category's design.",
    items: [
      'Disappear when in use so the work takes all the attention',
      'Improve output quality through surface calibration, not just feel',
      'Last long enough to become a trusted part of the studio environment',
      'Be honest about what it is - no branding that competes with the work'
    ],
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  compare: {
    chrome_left: 'Before / After',
    chrome_right: '07',
    title: 'Before and after the material decision.',
    columns: [
      {
        label: 'The Old Way',
        title: 'Generic product category from a supply catalog.',
        body: 'Works until it does not. Warps in heat, discolors with use, and feels like an afterthought.',
        items: [
          'Slips on polished surfaces without a grip layer',
          'Grooves deepen and skew precision over time',
          'Replaced every six months on average'
        ]
      },
      {
        label: 'The New Way',
        title: 'Product Name, purpose-built.',
        body: 'A surface that gets better with use. The material compresses and recovers, keeping edges clean.',
        items: [
          'Self-heals around use lines, keeping the surface flat',
          'Grip base holds any workbench without adhesives',
          '3000-use tested lifespan - typically 2 to 3 years in daily use'
        ],
        accent: true
      }
    ],
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  chart: {
    chrome_left: 'Performance',
    chrome_right: '08',
    title: 'Lifespan by material category.',
    unit: 'Units: months of daily studio use',
    bars: [
      { label: 'PVC', value: 6, height: 20 },
      { label: 'Rubber', value: 11, height: 37 },
      { label: 'Glass', value: 18, height: 60 },
      { label: 'Product', value: 30, height: 100, accent: true },
      { label: 'Leather', value: 22, height: 73 }
    ],
    source: 'Source: Independent Material Durability Study - Studio Lab 2025',
    footer_left: 'Studio Name - Product Brief',
    footer_right: 'Design Studio'
  },
  end: {
    kicker: 'Ready to Build',
    title: 'Start with the right surface.',
    body: 'Order the Product Name at studio-website.com or find it at select independent supply stores worldwide.',
    card_title: 'Get in touch.',
    card_body: 'hello@studio-website.com\n@studio on all platforms\nAvailable in 40+ countries',
    footer_left: 'Studio Name - 2026',
    footer_right: 'studio-website.com'
  }
}

function theme(spec) {
  const source = spec.theme?.colors || {}
  return {
    bg: '#232E26',
    bgAlt: '#2E3D30',
    cream: '#F0E8D2',
    paper: '#EDE6D0',
    paperAlt: '#E4DAC4',
    ink: '#1E2820',
    muted: 'rgba(240, 232, 210, 0.58)',
    faint: 'rgba(240, 232, 210, 0.28)',
    darkMuted: 'rgba(30, 40, 32, 0.62)',
    darkFaint: 'rgba(30, 40, 32, 0.28)',
    accent: source.primary || '#C07030',
    wood: '#7A4E24',
    borderDark: 'rgba(240, 232, 210, 0.14)',
    borderLight: 'rgba(30, 40, 32, 0.16)'
  }
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function array(spec, key, fallback = []) {
  const value = spec.content?.[key]
  return Array.isArray(value) && value.length ? value : fallback
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
  if (raw.includes('agenda') || raw.includes('statement')) return 'statement'
  if (raw.includes('split') || raw.includes('detail')) return 'split'
  if (raw.includes('stat') || raw.includes('data')) return 'stats'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('compare') || raw.includes('comparison')) return 'compare'
  if (raw.includes('chart')) return 'chart'
  if (raw.includes('closing') || raw.includes('end')) return 'end'
  return 'list'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function page(spec, children = [], { light = false } = {}) {
  const t = theme(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: light ? t.paper : t.bg,
      color: light ? t.ink : t.cream,
      overflow: 'hidden'
    },
    [!light && glow(t), ...children].filter(Boolean)
  )
}

function glow(t) {
  return box({ position: 'absolute', right: -115, bottom: -135, width: 540, height: 420, borderRadius: 270, backgroundColor: t.wood, opacity: 0.18 })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    ...role('label', spec, { fontWeight: 500, lineHeight: 1.05, letterSpacing: 1.7, textTransform: 'uppercase' }),
    color: theme(spec).accent,
    fontSize: 10,
    lineHeight: 1.05,
    letterSpacing: 1.7,
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    ...role('body', spec, { fontWeight: 400, lineHeight: 1.45 }),
    color: theme(spec).muted,
    fontSize: 15,
    lineHeight: 1.45,
    ...style
  })
}

function heading(value, spec, style = {}) {
  return Title(String(value || ''), {
    ...role('display', spec, { fontWeight: 800, lineHeight: 0.93, letterSpacing: -1.1, textTransform: 'none' }),
    color: theme(spec).cream,
    fontSize: 54,
    lineHeight: 0.93,
    letterSpacing: -1.1,
    whiteSpace: 'pre-line',
    ...style
  })
}

function chrome(spec, c, light = false) {
  const t = theme(spec)
  const color = light ? t.darkFaint : t.faint
  const labelColor = light ? t.darkFaint : t.faint
  return box({ position: 'absolute', left: 54, right: 54, top: 30, height: 32, borderBottomWidth: 1, borderColor: color, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, [
    label(c.chrome_left, spec, { color: labelColor, fontSize: 9 }),
    label(c.chrome_right, spec, { color: labelColor, fontSize: 9, textAlign: 'right' })
  ])
}

function foot(spec, c, light = false) {
  const t = theme(spec)
  const color = light ? t.darkFaint : t.faint
  const labelColor = light ? t.darkFaint : t.faint
  return box({ position: 'absolute', left: 54, right: 54, bottom: 32, height: 30, borderTopWidth: 1, borderColor: color, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }, [
    label(c.footer_left, spec, { color: labelColor, fontSize: 9 }),
    label(c.footer_right, spec, { color: labelColor, fontSize: 9, textAlign: 'right' })
  ])
}

function infoCard(spec, title, text, style = {}) {
  const t = theme(spec)
  return box({ backgroundColor: t.paper, color: t.ink, padding: '24px 28px', flexDirection: 'column', ...style }, [
    TextBlock(String(title || ''), { ...role('display', spec, { fontWeight: 700, lineHeight: 1.05 }), color: t.ink, fontSize: 22, lineHeight: 1.06, whiteSpace: 'pre-line' }),
    TextBlock(String(text || ''), { ...role('body', spec, { fontWeight: 400, lineHeight: 1.42 }), color: t.darkMuted, fontSize: 13, lineHeight: 1.42, marginTop: 14, whiteSpace: 'pre-line' })
  ])
}

function bulletList(spec, items, { light = false, width = 300, fontSize = 15, gap = 12 } = {}) {
  const t = theme(spec)
  return box({ width, flexDirection: 'column', gap }, items.map((item) =>
    box({ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, [
      TextBlock('-', { ...role('label', spec, { fontWeight: 500 }), color: t.accent, fontSize: 14, lineHeight: 1.2, width: 14 }),
      body(item, spec, { color: light ? t.darkMuted : t.muted, fontSize, lineHeight: 1.36, flex: 1 })
    ])
  ))
}

function renderCover(spec) {
  const t = theme(spec)
  const c = content(spec, 'cover')
  return page(spec, [
    box({ position: 'absolute', left: 56, top: 64, width: 440, flexDirection: 'column' }, [
      label(c.eyebrow, spec),
      heading(c.title, spec, { marginTop: 24, width: 410, fontSize: 88, lineHeight: 0.88 })
    ]),
    box({ position: 'absolute', left: 610, top: 108, width: 260, flexDirection: 'column' }, [
      body(c.subtitle, spec, { width: 246, fontSize: 16, lineHeight: 1.44 }),
      body(c.caption, spec, { marginTop: 18, width: 210, color: t.faint, fontSize: 12 })
    ]),
    infoCard(spec, c.card_title, c.card_body, { position: 'absolute', left: 58, bottom: 72, width: 276, minHeight: 128 }),
    label(c.footer_left, spec, { position: 'absolute', left: 360, bottom: 86, color: t.faint }),
    label(c.footer_right, spec, { position: 'absolute', right: 44, bottom: 32, color: t.faint })
  ])
}

function renderStatement(spec) {
  const c = content(spec, 'statement')
  const items = array(spec, 'items', c.items)
  return page(spec, [
    chrome(spec, c),
    box({ position: 'absolute', left: 56, top: 112, width: 430, flexDirection: 'column' }, [
      label(c.kicker, spec),
      heading(c.title, spec, { marginTop: 20, width: 390, fontSize: 61, lineHeight: 0.92 })
    ]),
    box({ position: 'absolute', right: 68, top: 132, width: 340, flexDirection: 'column' }, [
      body(c.body, spec, { width: 318, fontSize: 17, lineHeight: 1.48 }),
      box({ height: 1, backgroundColor: theme(spec).borderDark, width: 318, marginTop: 28, marginBottom: 22 }),
      bulletList(spec, items, { width: 322, fontSize: 15, gap: 15 })
    ]),
    foot(spec, c)
  ])
}

function renderSplit(spec) {
  const c = content(spec, 'split')
  const items = array(spec, 'items', c.items)
  const t = theme(spec)
  return page(spec, [
    chrome(spec, c),
    box({ position: 'absolute', left: 56, top: 105, width: 252, flexDirection: 'column' }, [
      label(c.kicker, spec),
      heading(c.title, spec, { marginTop: 18, fontSize: 42, lineHeight: 0.98, width: 242 }),
      body(c.body, spec, { marginTop: 18, width: 230, fontSize: 15, lineHeight: 1.45 })
    ]),
    box({ position: 'absolute', left: 352, top: 108, width: 252, height: 306, borderWidth: 1, borderColor: t.borderDark, backgroundColor: 'rgba(240,232,210,0.06)', alignItems: 'center', justifyContent: 'center' }, [
      label(c.image_label, spec, { color: t.faint, textAlign: 'center' })
    ]),
    box({ position: 'absolute', right: 62, top: 136, width: 260 }, [
      bulletList(spec, items, { width: 258, fontSize: 15, gap: 18 })
    ]),
    foot(spec, c)
  ])
}

function renderStats(spec) {
  const c = content(spec, 'stats')
  const metrics = array(spec, 'metrics', c.metrics)
  const t = theme(spec)
  return page(spec, [
    chrome(spec, c),
    heading(c.title, spec, { position: 'absolute', left: 56, top: 110, width: 660, fontSize: 46, lineHeight: 0.98 }),
    box({ position: 'absolute', left: 56, right: 56, bottom: 112, height: 184, flexDirection: 'row' }, metrics.slice(0, 3).map((metric, index) =>
      box({ width: 282, padding: index === 0 ? '0 30px 0 0' : '0 30px', borderRightWidth: index < 2 ? 1 : 0, borderColor: t.borderDark, flexDirection: 'column', justifyContent: 'center' }, [
        TextBlock(String(metric.value || ''), { ...role('metric', spec, { fontWeight: 800, lineHeight: 0.95, letterSpacing: -1 }), color: index === 1 ? t.accent : t.cream, fontSize: 64, lineHeight: 0.95 }),
        body(metric.label, spec, { marginTop: 18, fontSize: 14, lineHeight: 1.36, width: 210 })
      ])
    )),
    foot(spec, c)
  ])
}

function renderQuote(spec) {
  const c = content(spec, 'quote')
  const t = theme(spec)
  return page(spec, [
    TextBlock('"', { ...role('display', spec, { fontWeight: 800, lineHeight: 0.6 }), position: 'absolute', left: 118, top: 76, color: t.accent, fontSize: 114, lineHeight: 0.6 }),
    heading(c.quote, spec, { position: 'absolute', left: 176, top: 178, width: 610, fontSize: 48, lineHeight: 1.14, textAlign: 'center' }),
    box({ position: 'absolute', left: 382, top: 384, width: 196, flexDirection: 'column', alignItems: 'center' }, [
      label(c.author, spec, { textAlign: 'center' }),
      label(c.role, spec, { marginTop: 10, color: t.faint, textAlign: 'center' })
    ])
  ])
}

function renderList(spec) {
  const c = content(spec, 'list')
  const items = array(spec, 'items', c.items)
  const t = theme(spec)
  return page(spec, [
    chrome(spec, c, true),
    box({ position: 'absolute', left: 56, top: 112, width: 318, flexDirection: 'column' }, [
      label(c.kicker, spec),
      heading(c.title, spec, { color: t.ink, marginTop: 20, width: 300, fontSize: 42, lineHeight: 1.0 }),
      body(c.body, spec, { color: t.darkMuted, marginTop: 22, width: 286, fontSize: 15, lineHeight: 1.45 })
    ]),
    box({ position: 'absolute', right: 66, top: 128, width: 468 }, [
      bulletList(spec, items, { light: true, width: 468, fontSize: 18, gap: 22 })
    ]),
    foot(spec, c, true)
  ], { light: true })
}

function renderCompare(spec) {
  const c = content(spec, 'compare')
  const columns = array(spec, 'columns', c.columns)
  const t = theme(spec)
  return page(spec, [
    chrome(spec, c),
    box({ position: 'absolute', left: 56, right: 56, top: 114, bottom: 92, flexDirection: 'row' }, [
      comparePanel(spec, columns[0] || {}, { width: 392 }),
      box({ width: 1, margin: '0 38px', backgroundColor: t.borderDark }),
      comparePanel(spec, columns[1] || {}, { width: 392 })
    ]),
    foot(spec, c)
  ])
}

function comparePanel(spec, column, style = {}) {
  const t = theme(spec)
  return box({ flexDirection: 'column', ...style }, [
    label(column.label, spec, { color: column.accent ? t.accent : t.faint }),
    heading(column.title, spec, { marginTop: 18, fontSize: 32, lineHeight: 1.05, width: style.width || 360 }),
    body(column.body, spec, { marginTop: 18, fontSize: 15, lineHeight: 1.42, width: style.width || 360 }),
    box({ height: 1, backgroundColor: t.borderDark, width: style.width || 360, marginTop: 22, marginBottom: 18 }),
    bulletList(spec, column.items || [], { width: style.width || 360, fontSize: 14, gap: 12 })
  ])
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const bars = array(spec, 'bars', c.bars)
  const t = theme(spec)
  return page(spec, [
    chrome(spec, c),
    box({ position: 'absolute', left: 56, right: 56, top: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, [
      heading(c.title, spec, { width: 470, fontSize: 42, lineHeight: 1 }),
      label(c.unit, spec, { color: t.faint, width: 250, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 110, right: 110, top: 208, height: 210, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, bars.slice(0, 5).map((bar) =>
      box({ width: 96, height: 210, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }, [
        TextBlock(String(bar.value || ''), { ...role('metric', spec, { fontWeight: 700, lineHeight: 1 }), color: bar.accent ? t.accent : t.cream, fontSize: 18, lineHeight: 1, marginBottom: 8 }),
        box({ width: 56, height: Math.max(12, Math.round(Number(bar.height || 20) * 1.32)), backgroundColor: bar.accent ? t.accent : 'rgba(240,232,210,0.3)' }),
        label(bar.label, spec, { color: t.faint, fontSize: 9, textAlign: 'center', marginTop: 12, width: 90 })
      ])
    )),
    box({ position: 'absolute', left: 94, right: 94, top: 427, height: 1, backgroundColor: t.borderDark }),
    label(c.source, spec, { position: 'absolute', left: 56, bottom: 78, color: t.faint, fontSize: 8 }),
    foot(spec, c)
  ])
}

function renderEnd(spec) {
  const c = content(spec, 'end')
  const t = theme(spec)
  return page(spec, [
    box({ position: 'absolute', left: 76, top: 116, width: 470, flexDirection: 'column' }, [
      label(c.kicker, spec),
      heading(c.title, spec, { marginTop: 20, width: 420, fontSize: 59, lineHeight: 0.96 }),
      body(c.body, spec, { marginTop: 24, width: 350, fontSize: 16, lineHeight: 1.44 })
    ]),
    infoCard(spec, c.card_title, c.card_body, { position: 'absolute', right: 78, top: 186, width: 282, minHeight: 150 }),
    box({ position: 'absolute', left: 76, right: 76, bottom: 52, borderTopWidth: 1, borderColor: t.borderDark, paddingTop: 18, flexDirection: 'row', justifyContent: 'space-between' }, [
      label(c.footer_left, spec, { color: t.faint }),
      label(c.footer_right, spec, { color: t.faint, textAlign: 'right' })
    ])
  ])
}

const RENDERERS = {
  cover: renderCover,
  statement: renderStatement,
  split: renderSplit,
  stats: renderStats,
  quote: renderQuote,
  list: renderList,
  compare: renderCompare,
  chart: renderChart,
  end: renderEnd
}

export function renderMatMidcenturyBoard(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderStatement)(spec)
}
