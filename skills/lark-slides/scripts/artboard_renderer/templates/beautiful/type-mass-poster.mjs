import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'type-mass-poster'

export const PAGE_VARIANTS = [
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
  source_family: 'studio',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'studio',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'chapter', 'chapter-9', 'statement', 'statement-10', 'end'],
      repeatable: ['split', 'stats', 'list', 'quote', 'compare', 'chart']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/studio-1.png'
}

const C = {
  dark: '#1C1C1C',
  darkAlt: '#242422',
  yellow: '#F5D200',
  yellowAlt: '#F0CC00',
  darkBorder: '#2E2E2C',
  lightBorder: 'rgba(28,28,28,0.18)',
  yellowMuted: 'rgba(245,210,0,0.58)',
  yellowHint: 'rgba(245,210,0,0.32)',
  blackMuted: 'rgba(28,28,28,0.62)',
  blackHint: 'rgba(28,28,28,0.35)'
}

const DEFAULTS = {
  cover: {
    title: 'PROPOSAL',
    image_label: 'IMAGE PLACEHOLDER',
    footer_left: '[Studio Name] x [Client Name]\n[Date]',
    footer_center: '[Presentation Title]',
    footer_right: '[Studio Name]'
  },
  chapter: {
    label: '01 / WHO WE ARE',
    title: 'WHO WE ARE',
    surface: 'light'
  },
  statement: {
    title: "GREAT WORK DOESN'T HAPPEN BY ACCIDENT",
    surface: 'dark'
  },
  split: {
    eyebrow: 'Our Work',
    label: 'APPROACH',
    title: 'WE BUILD WHAT OTHERS PLAN',
    body: 'Our studio pairs strategic thinking with craft-level execution. Every project begins with a question: what needs to be true for this to work?',
    bullets: ['Strategy before aesthetics', 'Constraints as creative fuel', 'Delivery on schedule, not on someday'],
    caption: '[Caption - project name, year]'
  },
  stats: {
    eyebrow: 'By the Numbers',
    title: 'THE STUDIO',
    stats: [
      ['12', 'Years of practice', '[Studio Name] founded [Year]'],
      ['200+', 'Projects delivered', 'Across [N] industries'],
      ['3', 'Continents active', '[City A], [City B], [City C]']
    ]
  },
  list: {
    eyebrow: 'Services',
    title: 'WHAT WE OFFER',
    body: 'A focused set of services built for ambitious creative and commercial challenges.',
    items: ['Brand strategy and identity systems', 'Campaign and content direction', 'Digital experience design and build', 'Motion and video production', 'Ongoing creative partnership and retainer']
  },
  quote: {
    quote: "THEY DON'T JUST MAKE THINGS LOOK GOOD. THEY MAKE THINGS WORK.",
    name: '[CLIENT NAME]',
    role: 'CMO - [Company] - [Year]'
  },
  compare: {
    eyebrow: 'Before / After',
    left_label: 'BEFORE',
    left_title: 'GENERIC IDENTITY, FORGETTABLE CAMPAIGNS',
    left_body: 'A brand built by committee, refined to inoffensiveness. Nothing wrong. Nothing memorable.',
    left_items: ['No clear point of view', 'Inconsistent execution across touchpoints', 'Campaigns that launched and disappeared'],
    right_label: 'AFTER',
    right_title: 'A DISTINCTIVE VOICE PEOPLE RECOGNIZE',
    right_body: 'A brand with a defined perspective. Work that accumulates and builds memory.',
    right_items: ['Ownable visual and verbal territory', 'System that scales without diluting', 'Campaigns that created lasting recall']
  },
  'chapter-9': {
    label: '02 / THE WORK',
    title: 'THE WORK',
    surface: 'dark'
  },
  'statement-10': {
    title: 'BOLD IDEAS DESERVE BOLD EXECUTION',
    surface: 'light'
  },
  chart: {
    eyebrow: 'Project Output',
    title: 'PROJECTS BY YEAR',
    caption: 'Count - [Studio Name] Portfolio',
    labels: ['[Y-4]', '[Y-3]', '[Y-2]', '[Y-1]', '[Year]'],
    values: [14, 21, 28, 35, 47],
    source: 'Source: [Studio Name] internal tracking - [Year]'
  },
  end: {
    title: 'ANY QUESTIONS OR THOUGHTS?',
    contact_a: 'Contact [Name A] via email on [name@studio.com]\nor via phone on [+00 000 000 000]',
    contact_b: 'Contact [Name B] via email on [name@studio.com]\nor via phone on [+00 000 000 000]'
  }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.includes(variant)) return variant
  }
  if (raw.includes('end') || raw.includes('closing')) return 'end'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('compare')) return 'compare'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('list')) return 'list'
  if (raw.includes('stats')) return 'stats'
  if (raw.includes('split')) return 'split'
  if (raw.includes('statement')) return 'statement'
  if (raw.includes('chapter') || raw.includes('agenda')) return 'chapter'
  return 'cover'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function arr(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function surfaceStyle(surface) {
  const light = surface === 'light'
  return {
    bg: light ? C.yellow : C.dark,
    fg: light ? C.dark : C.yellow,
    muted: light ? C.blackMuted : C.yellowMuted,
    hint: light ? C.blackHint : C.yellowHint,
    border: light ? C.lightBorder : C.darkBorder,
    image: light ? C.yellowAlt : C.darkAlt,
    light
  }
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    color: C.yellow,
    fontSize: 90,
    lineHeight: 0.9,
    letterSpacing: -1,
    whiteSpace: 'pre-wrap',
    ...fontRole('display', spec, { fontWeight: 900, lineHeight: 0.9, letterSpacing: -1 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.yellowMuted,
    fontSize: 16,
    lineHeight: 1.45,
    ...fontRole('body', spec, { fontWeight: 500 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: C.yellowMuted,
    fontSize: 10,
    lineHeight: 1.2,
    letterSpacing: 1.2,
    ...fontRole('label', spec, { fontWeight: 500, letterSpacing: 1.2 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.yellow,
    fontSize: 64,
    lineHeight: 0.9,
    ...fontRole('metric', spec, { fontWeight: 900, lineHeight: 0.9 }),
    ...style
  })
}

function chrome(spec, pageNo, title, t) {
  return [
    box({ position: 'absolute', left: 48, right: 48, top: 36, height: 31, borderBottom: `1px solid ${t.border}`, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, [
      label(title, spec, { color: t.muted, fontSize: 10 }),
      label(`${String(pageNo).padStart(2, '0')} / 12`, spec, { color: t.muted, fontSize: 10, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 48, right: 48, bottom: 32, height: 31, borderTop: `1px solid ${t.border}`, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, [
      label('[Studio Name] - [Date]', spec, { color: t.hint, fontSize: 10 }),
      label(`${String(pageNo).padStart(2, '0')} / 12`, spec, { color: t.muted, fontSize: 10, textAlign: 'right' })
    ])
  ]
}

function page(spec, pageNo, surface, title, children) {
  const t = surfaceStyle(surface)
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, color: t.fg, overflow: 'hidden' }, [
    ...chrome(spec, pageNo, title, t),
    ...children
  ])
}

function renderCover(spec) {
  const d = content(spec, 'cover')
  const t = surfaceStyle('dark')
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, overflow: 'hidden' }, [
    box({ position: 'absolute', inset: 0, backgroundColor: t.image }),
    label(d.image_label, spec, { position: 'absolute', left: 390, top: 260, width: 180, textAlign: 'center', color: t.hint, fontSize: 9 }),
    display(d.title, spec, { position: 'absolute', left: 50, top: 40, width: 780, color: t.fg, fontSize: 110, lineHeight: 0.86 }),
    box({ position: 'absolute', left: 50, right: 50, bottom: 86, height: 1, backgroundColor: t.hint }),
    label(d.footer_left, spec, { position: 'absolute', left: 50, bottom: 38, width: 270, color: t.muted, fontSize: 10, lineHeight: 1.45, whiteSpace: 'pre-wrap' }),
    label(d.footer_center, spec, { position: 'absolute', left: 360, bottom: 52, width: 240, textAlign: 'center', color: t.muted, fontSize: 10 }),
    label(d.footer_right, spec, { position: 'absolute', right: 50, bottom: 52, width: 220, textAlign: 'right', color: t.muted, fontSize: 10 })
  ])
}

function renderChapter(spec, variant) {
  const d = content(spec, variant)
  const t = surfaceStyle(d.surface || (variant === 'chapter' ? 'light' : 'dark'))
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, overflow: 'hidden' }, [
    label(d.label, spec, { position: 'absolute', left: 50, bottom: 208, color: t.muted, fontSize: 11, letterSpacing: 2.2 }),
    display(d.title, spec, { position: 'absolute', left: 48, right: 60, bottom: 76, color: t.fg, fontSize: 96, lineHeight: 0.9 })
  ])
}

function renderStatement(spec, variant) {
  const d = content(spec, variant)
  const t = surfaceStyle(d.surface || 'dark')
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, overflow: 'hidden' }, [
    display(d.title, spec, { position: 'absolute', left: 48, right: 58, bottom: 80, color: t.fg, fontSize: 82, lineHeight: 0.92 })
  ])
}

function renderSplit(spec) {
  const d = content(spec, 'split')
  const t = surfaceStyle('light')
  return page(spec, 4, 'light', d.eyebrow, [
    label(d.label, spec, { position: 'absolute', left: 50, top: 112, color: t.muted, fontSize: 11, letterSpacing: 1.5 }),
    display(d.title, spec, { position: 'absolute', left: 50, top: 143, width: 365, color: t.fg, fontSize: 46, lineHeight: 0.96 }),
    body(d.body, spec, { position: 'absolute', left: 50, top: 266, width: 360, color: t.muted, fontSize: 13.5, lineHeight: 1.44 }),
    ...arr(d.bullets, DEFAULTS.split.bullets).slice(0, 3).map((item, index) =>
      body(`- ${item}`, spec, { position: 'absolute', left: 50, top: 378 + index * 23, width: 360, color: t.fg, fontSize: 13, lineHeight: 1.25 })
    ),
    box({ position: 'absolute', right: 50, top: 112, width: 392, height: 318, backgroundColor: t.image, border: `1px solid ${t.border}`, justifyContent: 'center', alignItems: 'center' }, [
      label('IMAGE PLACEHOLDER', spec, { color: t.hint, fontSize: 10 })
    ]),
    label(d.caption, spec, { position: 'absolute', right: 50, bottom: 74, width: 392, color: t.hint, fontSize: 9 })
  ])
}

function renderStats(spec) {
  const d = content(spec, 'stats')
  const t = surfaceStyle('light')
  return page(spec, 5, 'light', d.eyebrow, [
    display(d.title, spec, { position: 'absolute', left: 50, top: 124, width: 690, color: t.fg, fontSize: 58, lineHeight: 0.95 }),
    box({ position: 'absolute', left: 50, right: 50, top: 260, height: 150, flexDirection: 'row', gap: 28 }, arr(d.stats, DEFAULTS.stats.stats).slice(0, 3).map((stat) => {
      const [value, title, note] = stat
      return box({ flex: 1, borderTop: `2px solid ${t.fg}`, paddingTop: 18 }, [
        metric(value, spec, { color: t.fg }),
        body(title, spec, { marginTop: 10, color: t.fg, fontSize: 14, lineHeight: 1.2 }),
        label(note, spec, { marginTop: 10, color: t.hint, fontSize: 8.5, letterSpacing: 0.8 })
      ])
    }))
  ])
}

function renderList(spec) {
  const d = content(spec, 'list')
  const t = surfaceStyle('dark')
  return page(spec, 6, 'dark', d.eyebrow, [
    display(d.title, spec, { position: 'absolute', left: 50, top: 170, width: 350, color: t.fg, fontSize: 54, lineHeight: 0.96 }),
    body(d.body, spec, { position: 'absolute', left: 50, top: 292, width: 340, color: t.muted, fontSize: 14, lineHeight: 1.4 }),
    ...arr(d.items, DEFAULTS.list.items).slice(0, 5).map((item, index) =>
      body(`- ${item}`, spec, { position: 'absolute', left: 468, top: 152 + index * 45, width: 380, color: t.fg, fontSize: 19, lineHeight: 1.18 })
    )
  ])
}

function renderQuote(spec) {
  const d = content(spec, 'quote')
  const t = surfaceStyle('dark')
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, overflow: 'hidden' }, [
    display(d.quote, spec, { position: 'absolute', left: 50, top: 136, width: 760, color: t.fg, fontSize: 54, lineHeight: 1.02 }),
    label(d.name, spec, { position: 'absolute', left: 52, bottom: 100, color: t.fg, fontSize: 12, letterSpacing: 1.5 }),
    label(d.role, spec, { position: 'absolute', left: 52, bottom: 73, color: t.muted, fontSize: 10, letterSpacing: 1.2 })
  ])
}

function renderCompare(spec) {
  const d = content(spec, 'compare')
  const t = surfaceStyle('light')
  const panel = (side, labelText, title, bodyText, items, left) =>
    box({ position: 'absolute', left: left ? 50 : 500, top: 115, width: 390, bottom: 76, flexDirection: 'column', borderRight: left ? `2px solid ${t.fg}` : '0px solid transparent', paddingRight: left ? 34 : 0, paddingLeft: left ? 0 : 34 }, [
      label(labelText, spec, { width: '100%', color: side === 'after' ? t.fg : t.muted, fontSize: 10, letterSpacing: 1.8 }),
      box({ marginTop: 12, width: '100%', height: 1, backgroundColor: t.border }),
      display(title, spec, { width: '100%', marginTop: 24, color: t.fg, fontSize: 30, lineHeight: 1.02 }),
      body(bodyText, spec, { width: '100%', marginTop: 18, color: t.muted, fontSize: 13.4, lineHeight: 1.42 }),
      ...arr(items).slice(0, 3).map((item, index) =>
        body(`- ${item}`, spec, { width: '100%', marginTop: index === 0 ? 18 : 8, color: t.fg, fontSize: 12.5, lineHeight: 1.22 })
      )
    ])
  return page(spec, 8, 'light', d.eyebrow, [
    panel('before', d.left_label, d.left_title, d.left_body, d.left_items, true),
    panel('after', d.right_label, d.right_title, d.right_body, d.right_items, false)
  ])
}

function renderChart(spec) {
  const d = content(spec, 'chart')
  const t = surfaceStyle('dark')
  const values = arr(d.values, DEFAULTS.chart.values)
  const labels = arr(d.labels, DEFAULTS.chart.labels)
  const max = Math.max(...values, 1)
  return page(spec, 11, 'dark', d.eyebrow, [
    display(d.title, spec, { position: 'absolute', left: 50, top: 106, width: 480, color: t.fg, fontSize: 46, lineHeight: 0.95 }),
    label(d.caption, spec, { position: 'absolute', right: 50, top: 124, width: 320, textAlign: 'right', color: t.muted, fontSize: 10 }),
    box({ position: 'absolute', left: 50, right: 50, bottom: 112, height: 235, borderLeft: `2px solid ${t.hint}`, flexDirection: 'row', alignItems: 'flex-end', gap: 42, paddingLeft: 20 }, values.slice(0, 5).map((value, index) => {
      const h = Math.max(30, Math.round((value / max) * 185))
      const accent = index === values.length - 1
      return box({ flex: 1, height: 218, justifyContent: 'flex-end' }, [
        metric(String(value), spec, { color: accent ? t.fg : t.muted, fontSize: 16, fontWeight: accent ? 900 : 700, marginBottom: 8 }),
        box({ width: '100%', height: h, backgroundColor: accent ? t.fg : t.hint }),
        label(labels[index], spec, { color: t.hint, fontSize: 9, marginTop: 10, letterSpacing: 1 })
      ])
    })),
    box({ position: 'absolute', left: 50, right: 50, bottom: 110, height: 2, backgroundColor: t.hint }),
    label(d.source, spec, { position: 'absolute', left: 50, bottom: 74, color: t.hint, fontSize: 9, letterSpacing: 0.8 })
  ])
}

function renderEnd(spec) {
  const d = content(spec, 'end')
  const t = surfaceStyle('light')
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: t.bg, overflow: 'hidden' }, [
    display(d.title, spec, { position: 'absolute', left: 48, top: 58, width: 810, color: t.fg, fontSize: 98, lineHeight: 0.9 }),
    box({ position: 'absolute', left: 50, right: 50, bottom: 70, height: 1, backgroundColor: t.border }),
    body(d.contact_a, spec, { position: 'absolute', left: 50, bottom: 104, width: 380, color: t.muted, fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-wrap' }),
    body(d.contact_b, spec, { position: 'absolute', right: 50, bottom: 104, width: 380, color: t.muted, fontSize: 16, lineHeight: 1.5, whiteSpace: 'pre-wrap' })
  ])
}

export function renderTypeMassPoster(spec) {
  const variant = normalizeVariant(spec)
  switch (variant) {
    case 'chapter':
    case 'chapter-9':
      return renderChapter(spec, variant)
    case 'statement':
    case 'statement-10':
      return renderStatement(spec, variant)
    case 'split':
      return renderSplit(spec)
    case 'stats':
      return renderStats(spec)
    case 'list':
      return renderList(spec)
    case 'quote':
      return renderQuote(spec)
    case 'compare':
      return renderCompare(spec)
    case 'chart':
      return renderChart(spec)
    case 'end':
      return renderEnd(spec)
    case 'cover':
    default:
      return renderCover(spec)
  }
}
