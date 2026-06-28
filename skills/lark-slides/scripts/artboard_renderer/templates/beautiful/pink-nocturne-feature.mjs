import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'pink-nocturne-feature'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'toc', 'stats', 'section', 'chart', 'process', 'matrix', 'quote', 'cta']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'pink-script',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'pink-script',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'toc', 'section', 'quote', 'cta'],
      repeatable: ['stats', 'chart', 'process', 'matrix']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/pink-script-1.png'
}

const DEFAULTS = {
  cover: {
    brand: 'Maison Nocturne',
    meta: 'Vol. XIV · A/W 2026',
    pre: 'A Field Report on Late-Night Couture',
    title_top: 'After',
    title_bottom: 'Hours.',
    lower: [
      { label: 'Edition', value: 'No. 14', accent: true },
      { label: 'Director', value: 'L. Marchetti' },
      { label: 'Locale', value: "Paris · 11e" },
      { label: 'Date', value: 'May 2026', accent: true }
    ],
    footer: 'Maison Nocturne · Confidential',
    pageno: '01 / 09'
  },
  toc: {
    brand: 'After Hours',
    meta: 'The Index',
    title: 'The',
    title_small: 'Index.',
    rows: [
      { num: '01', title: 'By the Numbers', desc: 'Five figures that shape the season.', meta: 'Stats · pp. 14' },
      { num: '02', title: 'Movements', desc: 'A study in cuts, color, and silhouette.', meta: 'Section · pp. 22', current: true },
      { num: '03', title: 'The Curve', desc: 'Twelve weeks of after-hours behavior.', meta: 'Chart · pp. 36' },
      { num: '04', title: 'The Field', desc: 'Where we sit among the houses we admire.', meta: 'Matrix · pp. 48' },
      { num: '05', title: 'Voices & Encore', desc: 'Critics, clients, and what comes next.', meta: 'pp. 60-72' }
    ],
    footer: 'Maison Nocturne',
    pageno: '02 / 09'
  },
  stats: {
    brand: 'Chapter 01',
    meta: 'By the Numbers · A/W26',
    kicker: 'By the Numbers',
    title: 'A season\ntold in\nfive figures.',
    body: 'Read top to bottom. Every figure was reported by atelier directors during the eight-week previewing window and represents the house ledger only.',
    stats: [
      { value: '42', unit: '%', label: 'Couture · Repeat Clients', desc: 'Patrons who returned within ninety days for a second commission.' },
      { value: '3.8', unit: '×', label: 'Atelier Throughput', desc: 'Pieces released per machinist per week, measured against the prior Spring book.' },
      { value: '€1.4', unit: 'M', label: 'Average Ticket · Vault', desc: 'Mean spend per private appointment in the Vault programme this quarter.' },
      { value: '86', unit: '%', label: 'Reservation Rate', desc: 'Show seats filled before the public window opened.' },
      { value: '07', unit: '', label: 'New Cities, A/W', desc: 'Markets opened with a flagship boutique since the prior season.' }
    ],
    footer: 'Source · Atelier Ledger Q1',
    pageno: '03 / 09'
  },
  section: {
    brand: 'Chapter 02',
    meta: 'Movements',
    vertical: 'Maison Nocturne · Vol. XIV',
    number: '02',
    kicker: 'Movements',
    title: 'A study\nin cuts\n& color.',
    body: 'Three silhouettes carry the season — the column, the cape, and the cinch. Each is annotated in the chapters that follow.',
    footer: 'Chapter 02 of 05',
    pageno: '04 / 09'
  },
  chart: {
    brand: 'Chapter 03',
    meta: 'The Curve',
    title: 'Twelve weeks of after-hours\nbehavior.',
    legends: ['House · A/W26', 'Sector benchmark'],
    callout_value: '+38%',
    callout_label: 'Week 09 inflection',
    callout_desc: 'After the editorial dropped, walk-ins to the rue Saint-Honoré flagship doubled within seventy-two hours.',
    xaxis: ['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10', 'W11', 'W12'],
    footer: 'Source · House register · Index FY25=100',
    pageno: '05 / 09'
  },
  process: {
    brand: 'Chapter 04',
    meta: 'The Method',
    title: 'The\nmethod.',
    lead: "From sketchbook to runway in five movements. The atelier's tempo is dictated by the cloth, never the calendar.",
    steps: [
      { num: '01', title: 'Brief', body: "The house director and head couturier convene with three muses to set the season's mood." },
      { num: '02', title: 'Pattern', body: 'Toiles cut in calico. Each silhouette is fitted three times before approval is granted.' },
      { num: '03', title: 'Atelier', body: 'Cloth is cut on the bias. Hand-stitched seams. No piece leaves without two signatures.' },
      { num: '04', title: 'Fitting', body: 'Private appointments held by candlelight in the Vault. Clients touch the cloth before final approval.' },
      { num: '05', title: 'Runway', body: 'Twelve looks shown. The collection is sold by appointment before the public window opens.' }
    ],
    timeline: ['Wk 01-02 Brief', 'Wk 03-06 Pattern', 'Wk 07-10 Atelier', 'Wk 11-12 Fitting', 'Wk 13 Runway'],
    footer: 'Atelier Method · House Standard',
    pageno: '06 / 09'
  },
  matrix: {
    brand: 'Chapter 05',
    meta: 'The Field',
    title: 'The\nfield, in five rows.',
    source: 'Sourced · house registers, public filings, three trade press indices · A/W 2026',
    headers: ['Dimension', 'Maison Nocturne', 'House A', 'House B'],
    rows: [
      ['Atelier model', 'In-house · Paris', 'Hybrid · 2 cities', 'Outsourced'],
      ['Lead time', '13 weeks, hand-stitched', '9 weeks, partial machine', '6 weeks, full machine'],
      ['Vault programme', 'Yes · invitation', 'No', 'By appointment'],
      ['Repeat client share', '42%', '28%', '19%'],
      ['Public window', '90 days post-show', '30 days post-show', 'Same day']
    ],
    footer: 'Comparison · A/W 2026 disclosed',
    pageno: '07 / 09'
  },
  quote: {
    brand: 'Chapter 06',
    meta: 'Voices',
    qmark: '"',
    label: 'Voices · Issue 14',
    quote: "The house dresses you for an evening that hasn't begun. You leave the fitting and somewhere a room is already waiting.",
    who: '— Camille Aubry',
    role: 'Editor-in-chief · Le Soir Parisien',
    footer: 'Voices · Le Soir Parisien',
    pageno: '08 / 09'
  },
  cta: {
    brand: 'Chapter 07',
    meta: 'Encore',
    pre: 'An invitation',
    title: 'Encore.\nThe list opens\nthis Friday.',
    steps: [
      { num: '01', title: 'Reserve', body: 'Hold a Vault appointment for the week of 24 May. Couture only.' },
      { num: '02', title: 'Preview', body: 'Three looks shown by candlelight in the rue Saint-Honoré room.' },
      { num: '03', title: 'Commission', body: 'One piece commissioned to your measure, delivered before September.' }
    ],
    qr_label: 'Vault access',
    url: 'maison.nocturne',
    footer: 'RSVP · Private client office',
    pageno: '09 / 09'
  }
}

function theme() {
  return {
    ink: '#060507',
    ink2: '#0F0D11',
    glow: '#1A1218',
    paper: '#F5EDF1',
    pink: '#ED3D8C',
    pink2: '#FF66A8',
    pinkDeep: '#B81D67',
    line: 'rgba(237,61,140,0.32)',
    mute: 'rgba(245,237,241,0.55)',
    hair: 'rgba(245,237,241,0.14)'
  }
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
  if (raw.includes('agenda') || raw.includes('toc') || raw.includes('index')) return 'toc'
  if (raw.includes('metric') || raw.includes('stat') || raw.includes('data')) return 'stats'
  if (raw.includes('section') || raw.includes('chapter')) return 'section'
  if (raw.includes('chart') || raw.includes('curve')) return 'chart'
  if (raw.includes('process') || raw.includes('timeline') || raw.includes('roadmap')) return 'process'
  if (raw.includes('matrix') || raw.includes('compare') || raw.includes('comparison')) return 'matrix'
  if (raw.includes('quote') || raw.includes('voice')) return 'quote'
  if (raw.includes('closing') || raw.includes('close') || raw.includes('cta') || raw.includes('encore')) return 'cta'
  return 'cover'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function mono(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: theme().mute,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 400, lineHeight: 1.05 }),
    ...style
  })
}

function serif(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: theme().paper,
    fontSize: 44,
    fontWeight: 400,
    lineHeight: 1.04,
    letterSpacing: -0.2,
    whiteSpace: 'pre-line',
    ...role('display', spec, { fontWeight: 400 }),
    ...style
  })
}

function sans(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: theme().paper,
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1.45,
    ...role('body', spec, { fontWeight: 300 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: theme().pink,
    fontSize: 44,
    fontWeight: 400,
    lineHeight: 0.95,
    letterSpacing: -0.2,
    ...role('metric', spec, { fontWeight: 400, fontSize: 44, lineHeight: 0.95, letterSpacing: -0.2 }),
    ...style
  })
}

function frame() {
  const t = theme()
  return box({ position: 'absolute', inset: 18, borderWidth: 1, borderColor: t.hair })
}

function surface(children = []) {
  const t = theme()
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.ink,
      color: t.paper
    },
    [
      box({ position: 'absolute', left: -90, top: -80, width: 720, height: 560, borderRadius: 360, backgroundColor: t.glow, opacity: 0.62 }),
      box({ position: 'absolute', inset: 0, backgroundColor: '#FFFFFF', opacity: 0.012 }),
      frame(),
      ...children
    ]
  )
}

function runner(spec, c) {
  const t = theme()
  return box({ position: 'absolute', left: 30, right: 30, top: 30, height: 18, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, [
    mono(c.brand || 'Maison Nocturne', spec, { color: t.pink, fontSize: 11 }),
    mono(c.meta || '', spec, { color: t.mute, fontSize: 11, textAlign: 'right' })
  ])
}

function footer(spec, c) {
  const t = theme()
  return box({ position: 'absolute', left: 30, right: 30, bottom: 30, height: 18, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, [
    mono(c.footer || 'Maison Nocturne', spec, { color: t.mute, fontSize: 11 }),
    mono(c.pageno || '', spec, { color: t.paper, fontSize: 11, textAlign: 'right' })
  ])
}

function renderCover(spec) {
  const t = theme()
  const c = content(spec, 'cover')
  const lower = Array.isArray(c.lower) ? c.lower.slice(0, 4) : DEFAULTS.cover.lower
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 90, height: 185, alignItems: 'center', flexDirection: 'column' }, [
      mono(c.pre, spec, { color: t.paper, opacity: 0.75, fontSize: 13, letterSpacing: 4.2, marginBottom: 8 }),
      serif(c.title_top, spec, { color: t.pink, fontSize: 92, lineHeight: 0.96, textShadow: '0 0 40px rgba(237,61,140,0.18)' }),
      serif(c.title_bottom, spec, { color: t.paper, fontSize: 82, lineHeight: 0.92, paddingLeft: 88, marginTop: 2 })
    ]),
    box({ position: 'absolute', left: 30, right: 30, bottom: 80, height: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }, lower.map((item) =>
      box({ flexDirection: 'column', width: 150, gap: 3 }, [
        mono(item.label, spec, { fontSize: 9, color: t.mute }),
        serif(item.value, spec, { fontSize: 24, lineHeight: 1.05, color: item.accent ? t.pink : t.paper })
      ])
    )),
    footer(spec, c)
  ])
}

function renderToc(spec) {
  const t = theme()
  const c = content(spec, 'toc')
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 5) : DEFAULTS.toc.rows
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, bottom: 70, flexDirection: 'row', gap: 40 }, [
      box({ width: 240, flexDirection: 'column', justifyContent: 'flex-start' }, [
        serif(c.title, spec, { color: t.pink, fontSize: 105, lineHeight: 1.02 }),
        serif(c.title_small, spec, { color: t.paper, fontSize: 40, lineHeight: 1.05, opacity: 0.85 })
      ]),
      box({ flex: 1, flexDirection: 'column' }, rows.map((row) =>
        box({ height: 61, borderBottomWidth: 1, borderBottomColor: t.hair, flexDirection: 'row', alignItems: 'center', gap: 16 }, [
          metric(row.num, spec, { width: 55, color: row.current ? t.pink : t.pink, fontSize: 32, lineHeight: 1 }),
          box({ flex: 1, flexDirection: 'column' }, [
            serif(row.title, spec, { color: row.current ? t.pink : t.paper, fontSize: 27, lineHeight: 1.05 }),
            sans(row.desc, spec, { color: t.mute, fontSize: 11, lineHeight: 1.32, marginTop: 2 })
          ]),
          mono(row.meta, spec, { width: 112, color: t.mute, fontSize: 10, textAlign: 'right', letterSpacing: 1.1 })
        ])
      ))
    ]),
    footer(spec, c)
  ])
}

function renderStats(spec) {
  const t = theme()
  const c = content(spec, 'stats')
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 5) : DEFAULTS.stats.stats
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, bottom: 70, flexDirection: 'row', gap: 30 }, [
      box({ width: 390, flexDirection: 'column', justifyContent: 'space-between', paddingRight: 10 }, [
        mono(c.kicker, spec, { color: t.pink, fontSize: 11, letterSpacing: 2.0 }),
        serif(c.title, spec, { color: t.paper, fontSize: 62, lineHeight: 1.02 }),
        sans(c.body, spec, { color: 'rgba(245,237,241,0.75)', fontSize: 12, lineHeight: 1.45, width: 310 })
      ]),
      box({ flex: 1, flexDirection: 'column', gap: 9 }, stats.map((item) =>
        box({ height: 66, borderBottomWidth: 1, borderBottomColor: t.hair, flexDirection: 'row', alignItems: 'center', gap: 14 }, [
          box({ width: 120, flexDirection: 'row', alignItems: 'flex-start' }, [
            metric(item.value, spec, { color: t.pink, fontSize: 55, lineHeight: 0.9 }),
            metric(item.unit, spec, { color: t.paper, fontSize: 17, lineHeight: 1, marginTop: 9 })
          ]),
          box({ flex: 1, flexDirection: 'column' }, [
            mono(item.label, spec, { color: t.paper, fontSize: 10 }),
            sans(item.desc, spec, { color: t.mute, fontSize: 11, lineHeight: 1.35, marginTop: 4 })
          ])
        ])
      ))
    ]),
    footer(spec, c)
  ])
}

function renderSection(spec) {
  const t = theme()
  const c = content(spec, 'section')
  return surface([
    runner(spec, c),
    mono(String(c.vertical || '').replaceAll(' · ', '\n'), spec, {
      position: 'absolute',
      left: 20,
      top: 230,
      width: 62,
      color: t.mute,
      fontSize: 8,
      lineHeight: 1.45,
      letterSpacing: 1.4,
      whiteSpace: 'pre-line'
    }),
    box({ position: 'absolute', left: 70, top: 105, width: 310, height: 260, borderRadius: 160, backgroundColor: t.pink, opacity: 0.08 }),
    metric(c.number, spec, { position: 'absolute', left: 100, top: 118, color: t.pink, fontSize: 260, lineHeight: 0.82 }),
    box({ position: 'absolute', right: 50, top: 178, width: 198, flexDirection: 'column', gap: 9 }, [
      mono(c.kicker, spec, { color: t.pink, fontSize: 10 }),
      serif(c.title, spec, { color: t.paper, fontSize: 41, lineHeight: 1.02 }),
      sans(c.body, spec, { color: t.mute, fontSize: 12, lineHeight: 1.45 })
    ]),
    footer(spec, c)
  ])
}

function renderChart(spec) {
  const t = theme()
  const c = content(spec, 'chart')
  const xaxis = Array.isArray(c.xaxis) ? c.xaxis.slice(0, 12) : DEFAULTS.chart.xaxis
  const segments = [
    [0, 104, 60, 96], [60, 96, 120, 88], [120, 88, 180, 78], [180, 78, 240, 64],
    [240, 64, 300, 48], [300, 48, 360, 34], [360, 34, 420, 8], [420, 8, 480, 0]
  ]
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, height: 120, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40 }, [
      serif(c.title, spec, { width: 560, color: t.paper, fontSize: 43, lineHeight: 1.05 }),
      box({ width: 190, flexDirection: 'column', gap: 7, alignItems: 'flex-end' }, (c.legends || DEFAULTS.chart.legends).map((item, idx) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: 7 }, [
          mono(item, spec, { color: t.paper, fontSize: 9, letterSpacing: 1.0 }),
          box({ width: 18, height: 1.5, backgroundColor: idx === 0 ? t.pink : 'rgba(245,237,241,0.45)' })
        ])
      ))
    ]),
    box({ position: 'absolute', left: 80, top: 240, width: 610, height: 130 }, [
      ...[0, 0.25, 0.5, 0.75].map((pos) => box({ position: 'absolute', left: 0, right: 0, top: `${pos * 100}%`, borderTopWidth: 1, borderTopColor: 'rgba(237,61,140,0.18)', borderStyle: 'dashed' })),
      box({ position: 'absolute', left: 0, top: 0, bottom: 15, borderLeftWidth: 1, borderLeftColor: t.line }),
      box({ position: 'absolute', left: 0, right: 0, bottom: 15, borderBottomWidth: 1, borderBottomColor: t.line }),
      ...segments.map(([x1, y1, x2, y2]) => {
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        return box({ position: 'absolute', left: x1, top: y1, width: len, height: 2, backgroundColor: t.pink, transform: `rotate(${angle}deg)`, transformOrigin: 'left center' })
      }),
      box({ position: 'absolute', left: 420, top: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: t.pink }),
      box({ position: 'absolute', left: 414, top: 2, width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: t.pink, opacity: 0.55 }),
      box({ position: 'absolute', left: 0, right: 0, bottom: -14, flexDirection: 'row', justifyContent: 'space-between' }, xaxis.map((item) =>
        mono(item, spec, { color: item === 'W09' ? t.pink : t.mute, fontSize: 8, letterSpacing: 0.8 })
      ))
    ]),
    box({ position: 'absolute', right: 30, top: 240, width: 180, height: 130, alignItems: 'flex-end', flexDirection: 'column', borderLeftWidth: 1, borderLeftColor: t.pink, paddingLeft: 12 }, [
      metric(c.callout_value, spec, { color: t.pink, fontSize: 58, lineHeight: 0.9 }),
      mono(c.callout_label, spec, { color: t.paper, fontSize: 10, textAlign: 'right', marginTop: 4 }),
      sans(c.callout_desc, spec, { color: t.mute, fontSize: 10, lineHeight: 1.35, textAlign: 'right', marginTop: 4 })
    ]),
    footer(spec, c)
  ])
}

function renderProcess(spec) {
  const t = theme()
  const c = content(spec, 'process')
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 5) : DEFAULTS.process.steps
  const timeline = Array.isArray(c.timeline) ? c.timeline.slice(0, 5) : DEFAULTS.process.timeline
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, height: 170, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 30 }, [
      serif(c.title, spec, { width: 330, color: t.paper, fontSize: 73, lineHeight: 1.0 }),
      sans(c.lead, spec, { width: 380, color: t.mute, fontSize: 13, lineHeight: 1.5, marginBottom: 18 })
    ]),
    box({ position: 'absolute', left: 30, right: 30, top: 270, height: 132, flexDirection: 'row', gap: 12 }, steps.map((item, index) =>
      box({ flex: 1, position: 'relative', flexDirection: 'column', gap: 6, borderTopWidth: 1, borderTopColor: t.pink, paddingTop: 13 }, [
        metric(item.num, spec, { color: t.pink, fontSize: 46, lineHeight: 0.8 }),
        serif(item.title, spec, { color: t.paper, fontSize: 19, lineHeight: 1.02 }),
        sans(item.body, spec, { color: t.mute, fontSize: 10, lineHeight: 1.32 }),
        index < steps.length - 1 ? TextBlock('→', { position: 'absolute', right: -9, top: 28, color: t.pink, fontSize: 18, ...role('label', spec) }) : null
      ])
    )),
    box({ position: 'absolute', left: 30, right: 30, bottom: 70, borderTopWidth: 1, borderTopColor: t.hair, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }, timeline.map((item) =>
      mono(item, spec, { color: t.mute, fontSize: 9, letterSpacing: 0.9 })
    )),
    footer(spec, c)
  ])
}

function renderMatrix(spec) {
  const t = theme()
  const c = content(spec, 'matrix')
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 5) : DEFAULTS.matrix.rows
  const headers = Array.isArray(c.headers) ? c.headers.slice(0, 4) : DEFAULTS.matrix.headers
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 88, height: 124, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 30 }, [
      serif(c.title, spec, { width: 470, color: t.paper, fontSize: 54, lineHeight: 1.02 }),
      mono(c.source, spec, { width: 240, color: t.mute, fontSize: 9, lineHeight: 1.45, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 30, right: 30, top: 248, bottom: 70, flexDirection: 'column' }, [
      tableRow(headers, spec, true),
      ...rows.map((row, index) => tableRow(row, spec, false, index === rows.length - 1))
    ]),
    footer(spec, c)
  ])
}

function tableRow(values, spec, header = false, last = false) {
  const t = theme()
  const widths = [250, 205, 180, 180]
  return box({ height: header ? 34 : 38, flexDirection: 'row' }, values.slice(0, 4).map((value, index) =>
    box({
      width: widths[index],
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: header ? t.pink : t.line,
      backgroundColor: !header && index === 1 ? 'rgba(237,61,140,0.08)' : 'transparent',
      padding: '8px 12px',
      alignItems: 'center'
    }, [
      header
        ? mono(value, spec, { color: index === 1 ? t.pink : t.pink, fontSize: 9, letterSpacing: 1.1 })
        : index === 0
          ? serif(value, spec, { color: t.paper, fontSize: 15, lineHeight: 1.1 })
          : sans(value, spec, { color: t.paper, fontSize: 10.5, lineHeight: 1.25 })
    ])
  ))
}

function renderQuote(spec) {
  const t = theme()
  const c = content(spec, 'quote')
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, bottom: 70, flexDirection: 'row', alignItems: 'center', gap: 40 }, [
      box({ width: 160, flexDirection: 'column', gap: 14 }, [
        serif(c.qmark, spec, { color: t.pink, fontSize: 150, lineHeight: 0.65 }),
        mono(c.label, spec, { color: t.mute, fontSize: 9, letterSpacing: 1.1 })
      ]),
      box({ flex: 1, flexDirection: 'column' }, [
        serif(c.quote, spec, { color: t.paper, fontSize: 41, lineHeight: 1.05, letterSpacing: -0.1 }),
        box({ marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.pink, flexDirection: 'row', alignItems: 'baseline', gap: 12 }, [
          serif(c.who, spec, { color: t.paper, fontSize: 23, lineHeight: 1.05 }),
          mono(c.role, spec, { color: t.pink, fontSize: 8.5, letterSpacing: 1.2 })
        ])
      ])
    ]),
    footer(spec, c)
  ])
}

function renderCta(spec) {
  const t = theme()
  const c = content(spec, 'cta')
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 3) : DEFAULTS.cta.steps
  return surface([
    runner(spec, c),
    box({ position: 'absolute', left: 30, right: 30, top: 70, bottom: 70, flexDirection: 'column', justifyContent: 'space-between' }, [
      box({ flexDirection: 'column', gap: 6 }, [
        mono(c.pre, spec, { color: t.pink, fontSize: 12, letterSpacing: 2.4 }),
        serif(c.title, spec, { color: t.paper, fontSize: 66, lineHeight: 1.03 })
      ]),
      box({ height: 152, flexDirection: 'row', gap: 24, alignItems: 'flex-end' }, [
        ...steps.map((item) =>
          box({ flex: 1, flexDirection: 'column', gap: 7, borderTopWidth: 1, borderTopColor: t.pink, paddingTop: 11 }, [
            serif(item.num, spec, { color: t.pink, fontSize: 31, lineHeight: 1 }),
            serif(item.title, spec, { color: t.paper, fontSize: 21, lineHeight: 1.05 }),
            sans(item.body, spec, { color: t.mute, fontSize: 10, lineHeight: 1.35 })
          ])
        ),
        box({ width: 138, flexDirection: 'column', alignItems: 'flex-end', gap: 7 }, [
          qrBox(),
          mono(c.qr_label, spec, { color: t.paper, fontSize: 9, textAlign: 'right' }),
          mono(c.url, spec, { color: t.pink, fontSize: 9, letterSpacing: 0.4, textAlign: 'right' })
        ])
      ])
    ]),
    footer(spec, c)
  ])
}

function qrBox() {
  const t = theme()
  const cells = []
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const filled = x < 3 && y < 3 || x > 5 && y < 3 || x < 3 && y > 5 || (x + y) % 3 === 0 || (x === 5 && y > 3)
      if (filled) {
        cells.push(box({ position: 'absolute', left: x * 9, top: y * 9, width: 9, height: 9, backgroundColor: t.ink }))
      }
    }
  }
  return box({ position: 'relative', width: 90, height: 90, backgroundColor: t.paper, padding: 6 }, cells)
}

export function renderPinkNocturneFeature(spec) {
  const variant = normalizeVariant(spec)
  const renderers = {
    cover: renderCover,
    toc: renderToc,
    stats: renderStats,
    section: renderSection,
    chart: renderChart,
    process: renderProcess,
    matrix: renderMatrix,
    quote: renderQuote,
    cta: renderCta
  }
  return (renderers[variant] || renderCover)(spec)
}
