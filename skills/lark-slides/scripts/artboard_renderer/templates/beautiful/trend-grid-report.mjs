import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'trend-grid-report'

const PAGE_VARIANTS = ['cover', 'manifesto', 'index', 'chapter', 'data', 'quote', 'table', 'colophon']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'cobalt-grid',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'cobalt-grid',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'colophon'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'colophon'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/cobalt-grid-1.png'
}

const DEFAULTS = {
  cover: {
    title: 'Index\n2026',
    eyebrow: 'Field Office Quarterly · Volume IV',
    subtitle: 'A field report on the state of things.',
    footer_left: 'Edited by\nField Office Editorial · Lin Ito & Anya Mehrotra',
    footer_right: 'Distributed\nTo subscribers & the open web · twice a year'
  },
  manifesto: {
    title: 'A quiet question',
    quote: 'A trend is a quiet question that several rooms started asking at roughly the same time.',
    eyebrow: "From the editor's note",
    footer: 'Index 2026 · opening pages'
  },
  index: {
    title: 'The index, in six entries.',
    eyebrow: 'Spring 2026 · selected trends',
    items: [
      { num: '01.', title: 'Slow software', body: 'Tools that opt out of the urgency contest and instead promise to be quiet, considered, and on by default.' },
      { num: '02.', title: 'Domestic interfaces', body: 'Screens designed to live in living rooms — softer typography, warmer colour, and a willingness to be ignored.' },
      { num: '03.', title: 'Hand-set print again', body: 'A return to letterpress, risograph, and small-edition print, often paired with the most digital-feeling clients.' },
      { num: '04.', title: 'Quietly weird type', body: 'Display type with one slightly off detail that keeps a reader looking twice.' },
      { num: '05.', title: 'Receipts and ledgers', body: 'Information designed to be filed, not consumed.' },
      { num: '06.', title: 'Public weather', body: 'Brand writing that includes the actual weather of the day.' }
    ]
  },
  chapter: {
    eyebrow: 'Chapter one — the case for slow software',
    title: 'Software is a room',
    body: 'In its first chapter the Index follows the studios, products, and quiet middleware projects that are walking back the urgency the last decade trained us into. Less push. More return.'
  },
  data: {
    title: 'Reader response, by quarter.',
    eyebrow: 'Newsletter opens · 2024 Q1 — 2026 Q1',
    stats: [
      { value: '82%', label: 'Open rate · Q1 2026', body: 'A 2.1× lift on the inaugural issue, driven mostly by long-form chapters being read on Sunday mornings.' },
      { value: '11k', label: 'Active subscribers', body: 'Quiet, mostly-not-on-social, paying readers; we do not run a referral programme.' }
    ],
    bars: [34, 42, 46, 52, 60, 66, 74, 82],
    ticks: ['Q1 24', 'Q2 24', 'Q3 24', 'Q4 24', 'Q1 25', 'Q2 25', 'Q4 25', 'Q1 26']
  },
  quote: {
    eyebrow: 'A note from the studio',
    quote: 'We started the bulletin because the loudest readings of design were eating the ones we found ourselves rereading.',
    author: 'Lin Ito',
    source: 'Editor · Field Office Quarterly · letter to subscribers, March 2025'
  },
  table: {
    title: 'Trend ledger, in long.',
    eyebrow: 'All ten · with our reading on each',
    rows: [
      { num: '01.', name: 'Slow software', reading: 'Tools that opt out of urgency by default.', mood: 'Quiet · welcomed', delta: '14 pts' },
      { num: '02.', name: 'Domestic interfaces', reading: 'Screens designed to live in living rooms.', mood: 'Warm · ambient', delta: '9 pts' },
      { num: '03.', name: 'Hand-set print', reading: 'Letterpress and risograph paired with digital briefs.', mood: 'Tactile · careful', delta: '7 pts' },
      { num: '04.', name: 'Quietly weird type', reading: 'Display faces with one slightly off detail.', mood: 'Curious · alert', delta: 'flat' },
      { num: '05.', name: 'Receipts & ledgers', reading: 'Information designed to be filed, not consumed.', mood: 'Plain · honest', delta: '5 pts' },
      { num: '06.', name: 'Public weather', reading: "Brand voice that admits the day's actual mood.", mood: 'Open · tender', delta: '11 pts' }
    ]
  },
  colophon: {
    eyebrow: 'Colophon · Index 2026',
    title: 'See you in the autumn issue.',
    editors: 'Editors\nLin Ito & Anya Mehrotra with the field-office collective',
    design: 'Designed\nIn Newsreader, Hanken Grotesk & DM Mono · cobalt on cream',
    subscribe: 'Subscribed\nfield-office.co · twice a year quiet, paid, and read slowly',
    note: 'Until autumn\nThe next issue ships October 2026. Look for the cobalt envelope on a Monday morning.'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || source.paper || '#F0EBDE',
    paper2: source.surface || source.paper_2 || '#E6E0CE',
    cobalt: source.primary || source.text || source.ink || '#1F2BE0',
    soft: source.muted || source.ink_soft || '#5560E5',
    faint: '#C9C8EA'
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
  if (raw.includes('manifest') || raw.includes('quote')) return raw.includes('quote') ? 'quote' : 'manifesto'
  if (raw.includes('agenda') || raw.includes('index')) return 'index'
  if (raw.includes('data') || raw.includes('chart')) return 'data'
  if (raw.includes('table') || raw.includes('compare') || raw.includes('detail')) return 'table'
  if (raw.includes('closing') || raw.includes('colo')) return 'colophon'
  return 'chapter'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function label(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(String(text || '').toUpperCase(), {
    color: theme.cobalt,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase' }),
    ...style
  })
}

function body(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.cobalt,
    fontSize: 13,
    lineHeight: 1.42,
    ...role('body', spec, { fontSize: 13, lineHeight: 1.42, fontWeight: 400 }),
    ...style
  })
}

function display(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(text, {
    color: theme.cobalt,
    fontSize: 68,
    lineHeight: 0.94,
    letterSpacing: -0.5,
    ...role('display', spec, { fontSize: 68, lineHeight: 0.94, fontWeight: 400, letterSpacing: -0.5 }),
    ...style
  })
}

function mono(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.cobalt,
    fontSize: 8,
    lineHeight: 1.25,
    letterSpacing: 0.9,
    ...role('metric', spec, { fontSize: 8, lineHeight: 1.25, fontWeight: 700, letterSpacing: 0.9 }),
    ...style
  })
}

function graphGrid(theme) {
  const lines = []
  for (let x = 46; x <= 914; x += 28) {
    lines.push(box({ position: 'absolute', left: x, top: 30, width: 1, height: 480, backgroundColor: theme.cobalt, opacity: 0.08 }))
  }
  for (let y = 30; y <= 510; y += 28) {
    lines.push(box({ position: 'absolute', left: 46, top: y, width: 868, height: 1, backgroundColor: theme.cobalt, opacity: 0.08 }))
  }
  return lines
}

function glitch(theme, left = 744, top = 42) {
  const segments = []
  const slices = [
    { x: left, y: top, h: 72, bars: 9 },
    { x: left + 48, y: top + 58, h: 96, bars: 7 },
    { x: left - 36, y: top + 136, h: 128, bars: 11 },
    { x: left + 22, y: top + 252, h: 84, bars: 8 },
    { x: left - 12, y: top + 320, h: 116, bars: 10 }
  ]
  slices.forEach(({ x, y, h, bars }) => {
    for (let i = 0; i < bars; i += 1) {
      segments.push(box({ position: 'absolute', left: x + i * 6, top: y, width: 3, height: h, backgroundColor: theme.cobalt, opacity: 0.92 }))
    }
  })
  return segments
}

function qr(theme, x, y, size = 58) {
  const cells = []
  const on = new Set([0, 1, 3, 7, 8, 10, 14, 16, 21, 24, 27, 29, 32, 33, 36, 40, 45, 48, 52, 55, 57, 60, 63])
  const cell = size / 8
  for (let i = 0; i < 64; i += 1) {
    cells.push(box({ position: 'absolute', left: (i % 8) * cell, top: Math.floor(i / 8) * cell, width: cell - 1.5, height: cell - 1.5, backgroundColor: on.has(i) ? theme.cobalt : theme.paper }))
  }
  return box({ position: 'absolute', left: x, top: y, width: size, height: size, backgroundColor: theme.paper, padding: 0 }, cells)
}

function frame(spec, variant, children = []) {
  const theme = colors(spec)
  const page = `${String(variantPage(spec, variant)).padStart(2, '0')} / 08`
  return box(
    { width: 960, height: 540, position: 'relative', backgroundColor: theme.paper, color: theme.cobalt, overflow: 'hidden' },
    [
      ...graphGrid(theme),
      box({ position: 'absolute', left: 46, top: 24, width: 868, height: 1.5, backgroundColor: theme.cobalt }),
      box({ position: 'absolute', left: 46, bottom: 24, width: 868, height: 1.5, backgroundColor: theme.cobalt }),
      mono('← / → · SPACE', spec, { position: 'absolute', left: 46, bottom: 45, opacity: 0.55 }),
      mono(page, spec, { position: 'absolute', right: 46, bottom: 45, width: 80, textAlign: 'right' }),
      ...children
    ]
  )
}

function renderCover(spec) {
  const theme = colors(spec)
  const parts = value(spec, 'title', DEFAULTS.cover.title).split(/\n+/)
  return frame(spec, 'cover', [
    display(parts[0] || 'Index', spec, { position: 'absolute', left: 56, top: 110, width: 320, fontSize: 92 }),
    display(parts[1] || '2026', spec, { position: 'absolute', left: 56, top: 216, width: 320, fontSize: 92 }),
    label(value(spec, 'eyebrow', DEFAULTS.cover.eyebrow), spec, { position: 'absolute', left: 56, top: 346, width: 360 }),
    display(value(spec, 'subtitle', DEFAULTS.cover.subtitle), spec, { position: 'absolute', left: 56, top: 380, width: 470, fontSize: 21, lineHeight: 1.06 }),
    ...glitch(theme, 714, 38),
    qr(theme, 792, 350, 72),
    mono(value(spec, 'footer_left', DEFAULTS.cover.footer_left), spec, { position: 'absolute', left: 56, bottom: 70, width: 248, whiteSpace: 'pre-wrap' }),
    mono(value(spec, 'footer_right', DEFAULTS.cover.footer_right), spec, { position: 'absolute', left: 350, bottom: 70, width: 280, whiteSpace: 'pre-wrap' })
  ])
}

function renderManifesto(spec) {
  const theme = colors(spec)
  return frame(spec, 'manifesto', [
    display(value(spec, 'quote', DEFAULTS.manifesto.quote), spec, { position: 'absolute', left: 74, top: 118, width: 700, fontSize: 49, lineHeight: 1.04 }),
    box({ position: 'absolute', left: 74, top: 370, width: 280, height: 1, backgroundColor: theme.cobalt }),
    label(value(spec, 'eyebrow', DEFAULTS.manifesto.eyebrow), spec, { position: 'absolute', left: 74, top: 414 }),
    mono(value(spec, 'footer', DEFAULTS.manifesto.footer), spec, { position: 'absolute', left: 74, top: 440, width: 260 }),
    qr(theme, 746, 84, 72)
  ])
}

function renderIndex(spec) {
  const theme = colors(spec)
  const items = objectArray(spec, 'items', DEFAULTS.index.items).slice(0, 6)
  return frame(spec, 'index', [
    display(value(spec, 'title', DEFAULTS.index.title), spec, { position: 'absolute', left: 58, top: 68, width: 480, fontSize: 42 }),
    label(value(spec, 'eyebrow', DEFAULTS.index.eyebrow), spec, { position: 'absolute', right: 64, top: 88, width: 300, textAlign: 'right' }),
    box({ position: 'absolute', left: 58, top: 134, width: 840, height: 1.5, backgroundColor: theme.cobalt }),
    ...items.map((item, index) =>
      box({ position: 'absolute', left: 58, top: 158 + index * 51, width: 830, height: 42, borderBottomWidth: 1, borderColor: theme.faint, flexDirection: 'row' }, [
        mono(item.num || '', spec, { width: 54, fontSize: 10 }),
        display(item.title || '', spec, { width: 245, fontSize: 23, lineHeight: 1.05 }),
        body(item.body || '', spec, { width: 500, fontSize: 11.2, lineHeight: 1.28 })
      ])
    )
  ])
}

function renderChapter(spec) {
  const theme = colors(spec)
  return frame(spec, 'chapter', [
    label(value(spec, 'eyebrow', DEFAULTS.chapter.eyebrow), spec, { position: 'absolute', left: 62, top: 82, width: 500 }),
    display(value(spec, 'title', DEFAULTS.chapter.title), spec, { position: 'absolute', left: 62, top: 132, width: 710, fontSize: 53, lineHeight: 1.02 }),
    body(value(spec, 'body', DEFAULTS.chapter.body), spec, { position: 'absolute', left: 410, top: 342, width: 390, fontSize: 14, lineHeight: 1.45 }),
    qr(theme, 112, 342, 86),
    ...glitch(theme, 806, 84)
  ])
}

function renderData(spec) {
  const theme = colors(spec)
  const stats = objectArray(spec, 'stats', DEFAULTS.data.stats).slice(0, 2)
  const bars = array(spec, 'bars', DEFAULTS.data.bars).slice(0, 8).map((bar) => Number(bar) || 20)
  const ticks = array(spec, 'ticks', DEFAULTS.data.ticks).slice(0, 8)
  return frame(spec, 'data', [
    display(value(spec, 'title', DEFAULTS.data.title), spec, { position: 'absolute', left: 58, top: 70, width: 520, fontSize: 42 }),
    label(value(spec, 'eyebrow', DEFAULTS.data.eyebrow), spec, { position: 'absolute', left: 60, top: 158, width: 440 }),
    ...stats.map((item, index) => box({ position: 'absolute', left: 60 + index * 270, top: 194, width: 238, flexDirection: 'column' }, [
      display(item.value || '', spec, { fontSize: 54, lineHeight: 0.9 }),
      label(item.label || '', spec, { marginTop: 10, marginBottom: 12, width: 220 }),
      body(item.body || '', spec, { fontSize: 11.5, lineHeight: 1.36, width: 220 })
    ])),
    box({ position: 'absolute', left: 60, top: 385, width: 820, height: 1.5, backgroundColor: theme.cobalt }),
    ...bars.map((bar, index) =>
      box({ position: 'absolute', left: 82 + index * 96, top: 372 - bar * 2.5, width: 36, height: Math.max(24, bar * 2.5), flexDirection: 'column-reverse' },
        Array.from({ length: 10 }).map((_, cell) => box({ width: 36, height: 8, backgroundColor: cell < Math.round(bar / 10) ? theme.cobalt : theme.faint, marginTop: 3 }))
      )
    ),
    ...ticks.map((tick, index) => mono(tick, spec, { position: 'absolute', left: 62 + index * 96, top: 406, width: 76, textAlign: 'center', fontSize: 7 }))
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote', [
    label(value(spec, 'eyebrow', DEFAULTS.quote.eyebrow), spec, { position: 'absolute', left: 74, top: 82 }),
    TextBlock('"', { position: 'absolute', left: 70, top: 116, color: theme.faint, fontSize: 100, lineHeight: 1, ...role('display', spec, { fontSize: 100, lineHeight: 1, fontWeight: 400 }) }),
    display(value(spec, 'quote', DEFAULTS.quote.quote), spec, { position: 'absolute', left: 142, top: 154, width: 700, fontSize: 46, lineHeight: 1.04 }),
    box({ position: 'absolute', left: 144, top: 390, width: 320, height: 1, backgroundColor: theme.cobalt }),
    label(value(spec, 'author', DEFAULTS.quote.author), spec, { position: 'absolute', left: 144, top: 414 }),
    mono(value(spec, 'source', DEFAULTS.quote.source), spec, { position: 'absolute', left: 250, top: 414, width: 420 })
  ])
}

function renderTable(spec) {
  const theme = colors(spec)
  const rows = objectArray(spec, 'rows', DEFAULTS.table.rows).slice(0, 6)
  return frame(spec, 'table', [
    display(value(spec, 'title', DEFAULTS.table.title), spec, { position: 'absolute', left: 58, top: 62, width: 430, fontSize: 42 }),
    label(value(spec, 'eyebrow', DEFAULTS.table.eyebrow), spec, { position: 'absolute', right: 64, top: 86, width: 360, textAlign: 'right' }),
    box({ position: 'absolute', left: 58, top: 132, width: 840, height: 1.5, backgroundColor: theme.cobalt }),
    ...['No.', 'Trend', 'Reading', 'Mood', 'YoY'].map((head, index) => label(head, spec, { position: 'absolute', left: [58, 118, 308, 610, 786][index], top: 150, width: [50, 170, 280, 150, 80][index], fontSize: 7.5 })),
    ...rows.map((item, index) =>
      box({ position: 'absolute', left: 58, top: 180 + index * 45, width: 840, height: 38, borderBottomWidth: 1, borderColor: theme.faint, flexDirection: 'row' }, [
        mono(item.num || '', spec, { width: 60 }),
        display(item.name || '', spec, { width: 190, fontSize: 19, lineHeight: 1.05 }),
        body(item.reading || '', spec, { width: 300, fontSize: 10.5, lineHeight: 1.22 }),
        label(item.mood || '', spec, { width: 180, fontSize: 7.2, letterSpacing: 1.1 }),
        mono(item.delta || '', spec, { width: 80, textAlign: 'right' })
      ])
    )
  ])
}

function renderColophon(spec) {
  const theme = colors(spec)
  return frame(spec, 'colophon', [
    label(value(spec, 'eyebrow', DEFAULTS.colophon.eyebrow), spec, { position: 'absolute', left: 64, top: 80 }),
    display(value(spec, 'title', DEFAULTS.colophon.title), spec, { position: 'absolute', left: 64, top: 128, width: 700, fontSize: 56, lineHeight: 1 }),
    box({ position: 'absolute', left: 64, top: 294, width: 792, flexDirection: 'row' }, [
      mono(value(spec, 'editors', DEFAULTS.colophon.editors), spec, { width: 190, whiteSpace: 'pre-wrap', marginRight: 34 }),
      mono(value(spec, 'design', DEFAULTS.colophon.design), spec, { width: 210, whiteSpace: 'pre-wrap', marginRight: 34 }),
      mono(value(spec, 'subscribe', DEFAULTS.colophon.subscribe), spec, { width: 210, whiteSpace: 'pre-wrap' })
    ]),
    box({ position: 'absolute', left: 64, top: 400, width: 420, height: 1, backgroundColor: theme.cobalt }),
    body(value(spec, 'note', DEFAULTS.colophon.note), spec, { position: 'absolute', left: 64, top: 420, width: 500, fontSize: 12.5, lineHeight: 1.38 }),
    qr(theme, 756, 344, 86)
  ])
}

const RENDERERS = {
  cover: renderCover,
  manifesto: renderManifesto,
  index: renderIndex,
  chapter: renderChapter,
  data: renderData,
  quote: renderQuote,
  table: renderTable,
  colophon: renderColophon
}

export function renderTrendGridReport(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
