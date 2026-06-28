import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'tritone-editorial-spread'

const PAGE_VARIANTS = ['cover', 'manifesto', 'grid', 'stat', 'timeline', 'chart', 'quote', 'closer']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'editorial-tri-tone',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'editorial-tri-tone',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'closer'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'closer'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/editorial-tri-tone-1.png'
}

const DEFAULTS = {
  cover: {
    left_meta: 'Vol. 04 - Editorial Brief',
    center_meta: 'Spring / Summer Edition',
    right_meta: 'FW - 2026',
    title: 'Studio & Salon',
    tags: ['focus', 'tech-equipped', 'creativity', 'coffee', 'community', 'coworking', 'productivity', 'inspiration', 'flexible', 'workshops', 'collaboration', 'studio']
  },
  manifesto: {
    eyebrow: 'Chapter One - Manifesto',
    number: '01',
    title: 'Placeholder lede sets the tone for the whole document.',
    subtitle: 'A short, declarative sentence followed by an aside in italic that carries the warmth.',
    kicker: 'An opening note',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur est at lobortis.',
      'Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo.',
      'Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis.'
    ],
    signature: 'with warmth, The Editorial Desk'
  },
  grid: {
    title: 'Eight principles, loosely held.',
    section: '03 - Principles',
    cards: [
      { num: '/ 01', title: 'Slow looking', body: 'A short paragraph describing the principle in plain language. Two sentences is plenty.' },
      { num: '/ 02', title: 'Open kitchen', body: 'Process in public. Show the sketches before they harden.' },
      { num: '/ 03', title: 'Borrowed light', body: 'Cite generously. The best ideas belong to a lineage.' },
      { num: '/ 04', title: 'Quiet defaults', body: 'Restraint as a posture. Loud only when the moment earns it.' },
      { num: '/ 05', title: 'Fewer, finer', body: 'Three considered objects beat thirty hurried ones.' },
      { num: '/ 06', title: 'Useful warmth', body: 'Make the work specific, welcoming, and usable.' },
      { num: '/ 07', title: 'Good rooms', body: 'Design for the conversation you want to host.' },
      { num: '/ 08', title: 'Return often', body: 'Keep the notes alive after the first reading.' }
    ]
  },
  stat: {
    eyebrow: '04 - Headline Figure',
    subtitle: 'A portrait, in numbers.',
    value: '72',
    unit: '%',
    label: 'What this measures',
    body: "Placeholder annotation. A short, candid sentence about what the figure means and what it doesn't.",
    rows: [
      { label: 'Segment A', value: '82.4' },
      { label: 'Segment B', value: '63.9' },
      { label: 'Segment C', value: '48.1' },
      { label: 'Segment D', value: '31.0' }
    ]
  },
  timeline: {
    title: 'A short trajectory, told in five stops.',
    subtitle: '05 - Trajectory 2019 to present',
    events: [
      { year: "'19", title: 'The first prototype', body: 'A short caption per milestone, written in plain prose.' },
      { year: "'21", title: 'Quiet expansion', body: 'Placeholder copy describing a turning point.' },
      { year: "'23", title: 'A new house style', body: 'Type, color, voice - recast around a single editorial premise.' },
      { year: "'25", title: 'The salon, formalized', body: "Monthly gatherings became a fixture, then the work's center." },
      { year: "'26", title: 'Where we sit now', body: 'Present tense. A brief, honest description of the practice today.' }
    ]
  },
  chart: {
    eyebrow: '06 - Composition',
    title: 'How the days arrange themselves.',
    body: 'A placeholder description for the chart on the right. Speak to the shape of the data - what rises, what plateaus.',
    legend: ['Studio hours, deep work', 'Salon & conversation', 'Reading, drift, walking', 'Correspondence, admin'],
    bars: [
      { label: 'W01', values: [32, 18, 12, 8] },
      { label: 'W05', values: [35, 22, 14, 7] },
      { label: 'W09', values: [29, 26, 17, 9] },
      { label: 'W13', values: [38, 28, 16, 10] },
      { label: 'W17', values: [34, 30, 19, 11] },
      { label: 'W24', values: [40, 32, 20, 12] }
    ]
  },
  quote: {
    eyebrow: '07 - In their words',
    quote: 'A placeholder pull-quote, set in italic with one phrase rendered as bold sans for emphasis, the way good editorial designers have always done it.',
    author: 'A. Placeholder-Surname',
    role: 'Editor-at-large - Sister Publication',
    title: 'Three short reads',
    subtitle: 'Voices, lightly edited - from the readership.',
    reads: [
      { num: 'i.', title: 'On the rhythm', body: 'A two-line testimonial that reads as if spoken aloud.' },
      { num: 'ii.', title: 'On the company', body: 'Another short note, useful and specific without being precious.' },
      { num: 'iii.', title: 'On returning', body: 'A closing testimonial after the others have convinced the reader.' }
    ]
  },
  closer: {
    eyebrow: '08 - Colophon & Index',
    title: 'Until the next volume.',
    issue: 'End of issue No. 04 - 016 pp.',
    fin: 'Fin.',
    tags: ['issue 04', 'spring volume', 'colophon'],
    columns: [
      { label: 'Editorial', items: ['A. Placeholder', 'B. Placeholder', 'C. Placeholder'] },
      { label: 'Type', items: ['Bricolage Grotesque', 'Instrument Serif', 'JetBrains Mono'] },
      { label: 'Printed by', items: ['Placeholder Press', 'City & State', 'Recycled stock, 120gsm'] }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    pink: source.background || '#F2B6C6',
    butter: source.accent || '#F2D86A',
    burgundy: source.primary || '#7A1F35'
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
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('manifest')) return 'manifesto'
  if (raw.includes('grid') || raw.includes('principle')) return 'grid'
  if (raw.includes('stat') || raw.includes('metric')) return 'stat'
  if (raw.includes('timeline') || raw.includes('trajectory')) return 'timeline'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('closing') || raw.includes('colophon') || raw.includes('closer')) return 'closer'
  return 'manifesto'
}

function page(theme, backgroundColor, children = []) {
  return box({ width: 960, height: 540, position: 'relative', backgroundColor, color: theme.burgundy, overflow: 'hidden' }, children)
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 12,
    lineHeight: 1,
    letterSpacing: 2,
    ...role('label', spec, { fontSize: 12, lineHeight: 1, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(value, {
    fontSize: 13,
    lineHeight: 1.4,
    ...role('body', spec, { fontSize: 13, lineHeight: 1.4, fontWeight: 400 }),
    ...style
  })
}

function headline(value, spec, style = {}) {
  return Title(value, {
    fontSize: 44,
    lineHeight: 0.96,
    letterSpacing: -1,
    ...role('display', spec, { fontSize: 44, lineHeight: 0.96, fontWeight: 800, letterSpacing: -1 }),
    ...style
  })
}

function statText(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    fontSize: 132,
    lineHeight: 0.82,
    letterSpacing: -4,
    ...role('metric', spec, { fontSize: 132, lineHeight: 0.82, fontWeight: 800, letterSpacing: -4 }),
    ...style
  })
}

function pill(theme, spec, text, index, style = {}) {
  const dark = index % 2 === 0
  return TextBlock(text.toLowerCase(), {
    height: 32,
    minWidth: Math.max(76, text.length * 13),
    padding: '4px 14px',
    borderRadius: 18,
    color: dark ? theme.butter : theme.burgundy,
    backgroundColor: dark ? theme.burgundy : theme.butter,
    fontSize: 16,
    lineHeight: 1.35,
    ...role('body', spec, { fontSize: 16, lineHeight: 1.35, fontWeight: 700 }),
    ...style
  })
}

function titleParts(raw) {
  const cleaned = raw || 'Studio & Salon'
  if (cleaned.includes('&')) {
    const [left, right] = cleaned.split('&')
    return { left: left.trim() || 'Studio', right: right.trim() || 'Salon' }
  }
  const words = cleaned.split(/\s+/).filter(Boolean)
  const half = Math.max(1, Math.ceil(words.length / 2))
  return { left: words.slice(0, half).join(' ') || 'Studio', right: words.slice(half).join(' ') || 'Salon' }
}

function renderCover(spec, theme) {
  const c = content(spec, 'cover')
  const tags = array(spec, 'tags', c.tags).slice(0, 12)
  const parts = titleParts(value(spec, 'title', c.title))
  return page(theme, theme.pink, [
    label(value(spec, 'left_meta', c.left_meta), spec, { position: 'absolute', left: 32, top: 34, color: theme.burgundy }),
    label(value(spec, 'center_meta', c.center_meta), spec, { position: 'absolute', left: 344, top: 34, width: 280, color: theme.burgundy, textAlign: 'center' }),
    label(value(spec, 'right_meta', c.right_meta), spec, { position: 'absolute', right: 32, top: 34, width: 130, color: theme.burgundy, textAlign: 'right' }),
    box({ position: 'absolute', left: 32, top: 62, width: 760, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tags.map((item, index) => pill(theme, spec, item, index))),
    headline(parts.left, spec, { position: 'absolute', left: 32, bottom: 45, width: 370, color: theme.burgundy, fontSize: 90, lineHeight: 0.9 }),
    headline('&', spec, { position: 'absolute', left: 432, bottom: 47, width: 92, color: theme.butter, textAlign: 'center', fontSize: 98, lineHeight: 0.85 }),
    headline(parts.right, spec, { position: 'absolute', right: 28, bottom: 45, width: 360, color: theme.burgundy, textAlign: 'right', fontSize: 90, lineHeight: 0.9 })
  ])
}

function renderManifesto(spec, theme) {
  const c = content(spec, 'manifesto')
  const paragraphs = array(spec, 'paragraphs', c.paragraphs)
  return page(theme, theme.butter, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 48, top: 50, color: theme.burgundy }),
    headline(value(spec, 'number', c.number), spec, { position: 'absolute', right: 58, top: 34, color: theme.burgundy, fontSize: 104, lineHeight: 0.9 }),
    headline(value(spec, 'title', c.title), spec, { position: 'absolute', left: 48, top: 126, width: 700, color: theme.burgundy, fontSize: 38, lineHeight: 1.05 }),
    body(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', left: 48, top: 226, width: 640, color: theme.burgundy, fontSize: 18, lineHeight: 1.25 }),
    box({ position: 'absolute', left: 48, top: 305, width: 180, height: 1, backgroundColor: theme.burgundy }),
    label(value(spec, 'kicker', c.kicker), spec, { position: 'absolute', left: 48, top: 326, color: theme.burgundy }),
    ...paragraphs.slice(0, 3).map((text, index) => body(text, spec, { position: 'absolute', left: 250, top: 310 + index * 45, width: 540, color: theme.burgundy, fontSize: 13, lineHeight: 1.35 })),
    body(value(spec, 'signature', c.signature), spec, { position: 'absolute', right: 54, bottom: 42, color: theme.burgundy, fontSize: 24, lineHeight: 1, textAlign: 'right' })
  ])
}

function renderGrid(spec, theme) {
  const c = content(spec, 'grid')
  const cards = array(spec, 'cards', c.cards)
  return page(theme, theme.pink, [
    headline(value(spec, 'title', c.title), spec, { position: 'absolute', left: 48, top: 48, width: 540, color: theme.burgundy, fontSize: 42 }),
    label(value(spec, 'section', c.section), spec, { position: 'absolute', right: 48, top: 60, color: theme.burgundy, textAlign: 'right' }),
    ...cards.slice(0, 8).map((card, index) => {
      const col = index % 4
      const row = Math.floor(index / 4)
      const dark = index % 3 === 0
      return box({ position: 'absolute', left: 48 + col * 216, top: 155 + row * 160, width: 192, height: 132, backgroundColor: dark ? theme.burgundy : theme.butter, color: dark ? theme.butter : theme.burgundy, borderRadius: 14, padding: 16, flexDirection: 'column' }, [
        label(card.num, spec, { color: dark ? theme.butter : theme.burgundy, fontSize: 10, letterSpacing: 1.4 }),
        headline(card.title, spec, { color: dark ? theme.butter : theme.burgundy, fontSize: 22, lineHeight: 1, marginTop: 10 }),
        body(card.body, spec, { color: dark ? theme.butter : theme.burgundy, fontSize: 11, lineHeight: 1.25, marginTop: 8 })
      ])
    })
  ])
}

function renderStat(spec, theme) {
  const c = content(spec, 'stat')
  const rows = array(spec, 'rows', c.rows)
  return page(theme, theme.butter, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 48, top: 48, color: theme.burgundy }),
    body(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', left: 48, top: 82, color: theme.burgundy, fontSize: 22 }),
    statText(value(spec, 'value', c.value), spec, { position: 'absolute', left: 42, top: 130, width: 360, color: theme.burgundy, fontSize: 184 }),
    headline(value(spec, 'unit', c.unit), spec, { position: 'absolute', left: 412, top: 210, color: theme.pink, fontSize: 76 }),
    label(value(spec, 'label', c.label), spec, { position: 'absolute', left: 530, top: 144, color: theme.burgundy }),
    body(value(spec, 'body', c.body), spec, { position: 'absolute', left: 530, top: 178, width: 330, color: theme.burgundy, fontSize: 15, lineHeight: 1.35 }),
    label('Composition', spec, { position: 'absolute', left: 530, top: 294, color: theme.burgundy }),
    ...rows.slice(0, 4).map((row, index) => box({ position: 'absolute', left: 530, top: 330 + index * 36, width: 330, height: 1, borderTopWidth: 1, borderTopColor: theme.burgundy }, [
      body(row.label, spec, { position: 'absolute', left: 0, top: 8, color: theme.burgundy, fontSize: 14 }),
      headline(row.value, spec, { position: 'absolute', right: 0, top: 2, color: theme.burgundy, fontSize: 28 })
    ]))
  ])
}

function renderTimeline(spec, theme) {
  const c = content(spec, 'timeline')
  const events = array(spec, 'events', c.events)
  return page(theme, theme.pink, [
    headline(value(spec, 'title', c.title), spec, { position: 'absolute', left: 48, top: 48, width: 550, color: theme.burgundy, fontSize: 42 }),
    label(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', right: 48, top: 62, color: theme.burgundy, textAlign: 'right' }),
    box({ position: 'absolute', left: 70, top: 250, width: 820, height: 2, backgroundColor: theme.burgundy }),
    ...events.slice(0, 5).map((event, index) => {
      const x = 62 + index * 170
      return box({ position: 'absolute', left: x, top: 185, width: 155, flexDirection: 'column' }, [
        headline(event.year, spec, { color: theme.butter, fontSize: 46, lineHeight: 1 }),
        box({ width: 14, height: 14, borderRadius: 999, backgroundColor: theme.burgundy, marginTop: 13, marginBottom: 18 }),
        headline(event.title, spec, { color: theme.burgundy, fontSize: 21, lineHeight: 1 }),
        body(event.body, spec, { color: theme.burgundy, fontSize: 12, lineHeight: 1.35, marginTop: 12 })
      ])
    })
  ])
}

function renderChart(spec, theme) {
  const c = content(spec, 'chart')
  const legend = array(spec, 'legend', c.legend)
  const bars = array(spec, 'bars', c.bars)
  const series = [theme.burgundy, theme.butter, theme.pink, '#7A1F35']
  return page(theme, theme.butter, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 48, top: 50, color: theme.burgundy }),
    headline(value(spec, 'title', c.title), spec, { position: 'absolute', left: 48, top: 88, width: 330, color: theme.burgundy, fontSize: 38 }),
    body(value(spec, 'body', c.body), spec, { position: 'absolute', left: 48, top: 214, width: 330, color: theme.burgundy, fontSize: 14, lineHeight: 1.35 }),
    ...legend.slice(0, 4).map((item, index) => box({ position: 'absolute', left: 48, top: 318 + index * 34, width: 330, alignItems: 'center' }, [
      box({ width: 16, height: 16, backgroundColor: series[index], borderWidth: index === 2 ? 1 : 0, borderColor: theme.burgundy, marginRight: 12 }),
      label(item, spec, { color: theme.burgundy, fontSize: 10, letterSpacing: 1.1 })
    ])),
    box({ position: 'absolute', left: 430, top: 90, width: 440, height: 350, borderRadius: 18, backgroundColor: theme.pink, padding: 24, flexDirection: 'column' }, [
      label('Hours per week, by mode', spec, { color: theme.burgundy }),
      box({ marginTop: 28, height: 230, alignItems: 'flex-end', justifyContent: 'space-between' }, bars.slice(0, 6).map((bar) => {
        const total = Math.max(...bar.values)
        return box({ width: 48, height: 230, alignItems: 'flex-end', justifyContent: 'center' }, bar.values.slice(0, 4).map((value, index) => box({ width: 10, height: Math.max(18, value / total * 200), backgroundColor: series[index], marginLeft: index ? 2 : 0, borderWidth: index === 2 ? 1 : 0, borderColor: theme.burgundy })))
      })),
      box({ marginTop: 12, justifyContent: 'space-between' }, bars.slice(0, 6).map((bar) => label(bar.label, spec, { color: theme.burgundy, fontSize: 9, letterSpacing: 1 })))
    ])
  ])
}

function renderQuote(spec, theme) {
  const c = content(spec, 'quote')
  const reads = array(spec, 'reads', c.reads)
  return page(theme, theme.pink, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 48, top: 48, color: theme.burgundy }),
    headline('"', spec, { position: 'absolute', left: 52, top: 88, width: 80, color: theme.butter, fontSize: 108, lineHeight: 0.7 }),
    headline(value(spec, 'quote', c.quote), spec, { position: 'absolute', left: 130, top: 100, width: 470, color: theme.burgundy, fontSize: 31, lineHeight: 1.04 }),
    body(value(spec, 'author', c.author), spec, { position: 'absolute', left: 130, top: 370, color: theme.burgundy, fontSize: 21, fontWeight: 700 }),
    label(value(spec, 'role', c.role), spec, { position: 'absolute', left: 130, top: 405, color: theme.burgundy }),
    box({ position: 'absolute', right: 50, top: 84, width: 230, height: 380, backgroundColor: theme.butter, borderRadius: 18, padding: 20, flexDirection: 'column' }, [
      headline(value(spec, 'title', c.title), spec, { color: theme.burgundy, fontSize: 26, lineHeight: 1 }),
      body(value(spec, 'subtitle', c.subtitle), spec, { color: theme.burgundy, fontSize: 12, lineHeight: 1.3, marginTop: 10 }),
      ...reads.slice(0, 3).map((read) => box({ marginTop: 20, borderTopWidth: 1, borderTopColor: theme.burgundy, paddingTop: 12, flexDirection: 'column' }, [
        label(read.num, spec, { color: theme.burgundy, fontSize: 10 }),
        body(`${read.title} ${read.body}`, spec, { color: theme.burgundy, fontSize: 12, lineHeight: 1.28, marginTop: 6 })
      ]))
    ])
  ])
}

function renderCloser(spec, theme) {
  const c = content(spec, 'closer')
  const tags = array(spec, 'tags', c.tags)
  const columns = array(spec, 'columns', c.columns)
  return page(theme, theme.burgundy, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 48, top: 48, color: theme.butter }),
    headline(value(spec, 'title', c.title), spec, { position: 'absolute', left: 48, top: 88, width: 620, color: theme.butter, fontSize: 58 }),
    label(value(spec, 'issue', c.issue), spec, { position: 'absolute', right: 48, top: 58, color: theme.butter, textAlign: 'right' }),
    statText(value(spec, 'fin', c.fin), spec, { position: 'absolute', left: 48, top: 210, color: theme.pink, fontSize: 154 }),
    box({ position: 'absolute', left: 48, bottom: 154, width: 520, flexDirection: 'row', gap: 10 }, tags.map((item, index) => pill(theme, spec, item, index, { height: 28, fontSize: 13, minWidth: 80 }))),
    ...columns.slice(0, 3).map((column, index) => box({ position: 'absolute', left: 48 + index * 270, bottom: 44, width: 225, flexDirection: 'column' }, [
      label(column.label, spec, { color: theme.butter, marginBottom: 14 }),
      ...column.items.slice(0, 3).map((item) => body(item, spec, { color: theme.butter, fontSize: 13, lineHeight: 1.45 }))
    ]))
  ])
}

export function renderTritoneEditorialSpread(spec) {
  const theme = colors(spec)
  const variant = normalizeVariant(spec)
  if (variant === 'cover') return renderCover(spec, theme)
  if (variant === 'manifesto') return renderManifesto(spec, theme)
  if (variant === 'grid') return renderGrid(spec, theme)
  if (variant === 'stat') return renderStat(spec, theme)
  if (variant === 'timeline') return renderTimeline(spec, theme)
  if (variant === 'chart') return renderChart(spec, theme)
  if (variant === 'quote') return renderQuote(spec, theme)
  return renderCloser(spec, theme)
}
