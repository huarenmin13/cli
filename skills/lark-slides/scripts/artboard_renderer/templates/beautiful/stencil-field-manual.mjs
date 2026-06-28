import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'stencil-field-manual'

export const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'princ',
  'sec',
  'consult',
  'chart',
  'process',
  'matrix',
  'stats',
  'quote',
  'cta'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'stencil-tablet',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'stencil-tablet',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'agenda', 'sec', 'cta'],
      repeatable: ['princ', 'consult', 'chart', 'process', 'matrix', 'stats', 'quote']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/stencil-tablet-1.png'
}

const C = {
  bone: '#E2DCC9',
  ink: '#0A0A0A',
  paper: '#F4EFE0',
  sienna: '#A06A3C',
  magenta: '#C73B7A',
  orange: '#EE7A2E',
  teal: '#2D7E73',
  blue: '#3F73B7',
  mustard: '#D8A93B',
  olive: '#6F7A2E',
  softInk: 'rgba(10,10,10,0.7)',
  softBone: 'rgba(226,220,201,0.74)'
}

const DEFAULTS = {
  cover: {
    super: 'Agency name x Partner name',
    title: 'Bold by\ndesign.',
    who: 'North & Partners',
    subwho: 'Brand - Strategy - Q2 2026',
    date: '29 - IV - 2026'
  },
  agenda: {
    title: 'Agenda',
    meta: ['Agency x Partner', 'Phase I'],
    items: ['Agenda\nitem', 'Agenda\nitem', 'Agenda\nitem', 'Agenda\nitem']
  },
  princ: {
    title: 'Our Principles',
    meta: ['Agency x Partner', 'Phase II'],
    cards: [
      ['1', 'Make it\nblunt', 'Decisions read at a glance. If a stakeholder needs the legend, the slide is doing too much.'],
      ['2', 'Stay in\nthe system', 'Three stencil numerals, two sans weights, six saturated colours. Anything else is a special case.'],
      ['3', 'Show the\nshape', 'Lead with form. Use weight, scale, and silhouette before reaching for icons or imagery.'],
      ['4', 'Earn the\nblack slide', 'Reserve full-bleed black for moments that deserve a beat. Never as wallpaper.']
    ]
  },
  sec: {
    title: 'Direction',
    meta: ['Section II'],
    number: '02',
    label: 'Direction\n& doctrine',
    headline: 'Where we\nare going,\nand why.'
  },
  consult: {
    title: 'Findings - Detail',
    meta: ['Agency x Partner', 'Phase III'],
    tag: 'Action title - 05',
    action: 'The trust gap is built in the first 72 hours, not the first 7 days - and the cost compounds for the rest of the lifecycle.',
    columns: [
      ['What we found', 'Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.', ['Email open #2 lifts D90 retention by 19 points.', 'A written welcome retained 2.4x the cohort.', 'One human reply within 24 hours is the largest lever.'], 'N = 14,200 - Q1 2026'],
      ['Why it matters', '$4.1M projected retained ARR - current cohort.', ['The first three days are the only window where customers are paying attention.', 'Every interaction here does the work of four later interactions.'], 'Modelled on FY24 cohort behaviour'],
      ['What to do', 'Rewrite emails 1-3 in human voice and route high-value signups to named humans.', ['Ship behind a 50/50 holdout.', 'Measure reply rate, second-open rate, and D90 retention.'], 'Pilot scope: top-decile signups']
    ]
  },
  chart: {
    title: 'Retention, by cohort',
    meta: ['Phase III', 'Evidence'],
    headline: 'Curve\nbends at\nday three.',
    body: 'Cohorts that received a written welcome and a human reply within 24 hours retain at roughly 2x the rate of the templated cohort.',
    legend: ['Templated welcome', 'Written welcome', 'Written + human reply'],
    labels: ['D0', 'D7', 'D14', 'D30', 'D45', 'D60', 'D90']
  },
  process: {
    title: "How we'll work",
    meta: ['Agency x Partner', 'Phase IV'],
    headline: 'From insight\nto default,\nin five moves.',
    subtitle: 'A repeatable path each pilot follows before it graduates to the default experience for every customer.',
    steps: [
      ['1', 'Frame', 'Translate the insight into a single behavioural hypothesis.'],
      ['2', 'Design', 'Sketch the smallest end-to-end change.'],
      ['3', 'Pilot', 'Ship to a 50/50 holdout in one segment.'],
      ['4', 'Read', 'Review against pre-registered metrics.'],
      ['5', 'Default', 'Promote to the default surface.']
    ],
    timeline: ['Week 1 - Frame', 'Week 2-3 - Design', 'Week 3-6 - Pilot', 'Week 7 - Read', 'Week 8 - Default']
  },
  matrix: {
    title: 'Three pilots, side by side',
    meta: ['Agency x Partner', 'Phase IV'],
    headline: 'Where each\npilot earns\nits keep.',
    subtitle: 'Scored against the four levers that matter most this cycle.',
    headers: ['Lever', 'Rewrite welcome', 'Quiet upgrades', 'Inbox-as-search'],
    rows: [
      ['Time-to-impact', '<= 4 weeks', '6-8 weeks', '<= 4 weeks'],
      ['Build cost', 'Low', 'Medium', 'Low'],
      ['Retention lift', '+19 pts D90', '+7 pts D90', '+5 pts D90'],
      ['Risk', 'None', 'Material', 'Soft, reversible']
    ]
  },
  stats: {
    title: 'In numbers',
    meta: ['Phase III', 'Evidence'],
    headline: 'The case,\nby the numbers.',
    subtitle: 'Three figures we will report against every cycle.',
    stats: [
      ['2.4x', 'Retention\nmultiple', 'Cohort with written welcome + human reply vs. templated control.'],
      ['$4.1M', 'Projected\nretained ARR', "Modelled on the current quarter's signup cohort."],
      ['72HR', 'The window\nthat matters', 'Behaviour after the first 72 hours predicts 18-month retention.']
    ]
  },
  quote: {
    title: 'Client voice',
    meta: ['Phase III', 'Evidence'],
    quote: "Three days in, someone wrote me a real sentence. I'd been a customer of theirs for nine months before I noticed I'd never been a customer anywhere else again.",
    who: 'Margaux Leveque',
    role: 'CFO - mid-market retailer - 14 months in'
  },
  cta: {
    title: "What's next",
    meta: ['Agency x Partner', 'Phase V'],
    headline: 'Pick the\nthree\nbets.',
    body: "Three pilots in eight weeks. We'll bring back evidence the quarter after, and the question will be which two to default.",
    steps: [
      ['1', 'Pick the pilots', 'Confirm two of three by Friday. Owners named in the same conversation.'],
      ['2', 'Pre-register the read', 'Lock the metric, holdout, and kill criteria before any code ships.'],
      ['3', 'Stand a Friday review', 'One slide each pilot, every Friday, until the bet defaults or dies.']
    ]
  }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.includes(variant)) return variant
  }
  if (raw.includes('principle')) return 'princ'
  if (raw.includes('section')) return 'sec'
  if (raw.includes('detail')) return 'consult'
  if (raw.includes('data')) return 'chart'
  if (raw.includes('comparison')) return 'matrix'
  if (raw.includes('closing') || raw.includes('next')) return 'cta'
  return 'cover'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function arr(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function str(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    color: C.ink,
    fontSize: 88,
    lineHeight: 0.9,
    whiteSpace: 'pre-wrap',
    ...fontRole('display', spec, { fontWeight: 900, lineHeight: 0.9, letterSpacing: -0.6 }),
    ...style
  })
}

function text(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.ink,
    fontSize: 18,
    lineHeight: 1.35,
    ...fontRole('body', spec, { fontWeight: 400 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: C.ink,
    fontSize: 14,
    lineHeight: 1,
    letterSpacing: 0.8,
    ...fontRole('label', spec, { fontWeight: 800, letterSpacing: 0.8 }),
    ...style
  })
}

function number(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: C.ink,
    fontSize: 100,
    lineHeight: 0.86,
    letterSpacing: -1,
    ...fontRole('metric', spec, { fontWeight: 900, lineHeight: 0.86 }),
    ...style
  })
}

function page(spec, pageNo, children, { dark = false, title = '', meta = [] } = {}) {
  const bg = dark ? C.ink : C.bone
  const fg = dark ? C.bone : C.ink
  const muted = dark ? C.softBone : C.softInk
  return box({ width: 960, height: 540, position: 'relative', overflow: 'hidden', backgroundColor: bg }, [
    label(title, spec, { position: 'absolute', left: 48, top: 34, color: fg, fontSize: 20, letterSpacing: 1.2 }),
    box({ position: 'absolute', right: 48, top: 36, flexDirection: 'row', gap: 36 }, arr(meta).map((item) =>
      label(item, spec, { color: muted, fontSize: 14, letterSpacing: 1.1 })
    )),
    ...children,
    box({ position: 'absolute', left: 48, right: 48, bottom: 26, flexDirection: 'row', justifyContent: 'space-between' }, [
      label('North & Partners', spec, { color: muted, fontSize: 13, letterSpacing: 1.1 }),
      label(`${String(pageNo).padStart(2, '0')} / 11`, spec, { color: muted, fontSize: 13, letterSpacing: 1.1 })
    ])
  ])
}

function tablet(color, children, style = {}) {
  return box({ backgroundColor: color, borderRadius: 20, overflow: 'hidden', ...style }, children)
}

function renderCover(spec) {
  const d = content(spec, 'cover')
  return box({ width: 960, height: 540, position: 'relative', overflow: 'hidden', backgroundColor: C.bone }, [
    label(d.super, spec, { position: 'absolute', left: 48, top: 40, fontSize: 18, letterSpacing: 2, color: C.softInk }),
    box({ position: 'absolute', right: 52, top: 52, width: 205, height: 320, borderRadius: 104, backgroundColor: C.teal, transform: 'rotate(-18deg)' }),
    box({ position: 'absolute', right: 94, top: 119, width: 176, height: 160, borderRadius: 88, backgroundColor: C.bone, opacity: 0.35 }),
    display(d.title, spec, { position: 'absolute', left: 48, bottom: 106, width: 690, fontSize: 146, lineHeight: 0.82, color: C.ink }),
    box({ position: 'absolute', left: 50, bottom: 50, width: 42, height: 42, borderRadius: 10, backgroundColor: C.orange }),
    label(d.who, spec, { position: 'absolute', left: 110, bottom: 68, fontSize: 19, letterSpacing: 1.1 }),
    label(d.subwho, spec, { position: 'absolute', left: 110, bottom: 45, fontSize: 12, color: C.softInk, letterSpacing: 1.1 }),
    number(d.date, spec, { position: 'absolute', right: 48, bottom: 47, width: 220, textAlign: 'right', fontSize: 24, color: C.ink })
  ])
}

function renderAgenda(spec) {
  const d = content(spec, 'agenda')
  const items = arr(d.items, DEFAULTS.agenda.items)
  const colors = [C.orange, C.teal, C.blue, C.sienna]
  return page(spec, 2, [
    box({ position: 'absolute', left: 50, right: 50, top: 156, bottom: 92, flexDirection: 'row', gap: 22 }, items.slice(0, 4).map((item, index) =>
      tablet(colors[index], [
        box({ position: 'absolute', left: 0, right: 0, top: 76, height: 118, borderRadius: 80, backgroundColor: index % 2 === 0 ? 'rgba(226,220,201,0.18)' : 'rgba(10,10,10,0.12)' }),
        label(`0${index + 1}`, spec, { position: 'absolute', top: 34, left: 0, right: 0, textAlign: 'center', fontSize: 22, color: C.ink }),
        display(item, spec, { position: 'absolute', left: 18, right: 18, bottom: 34, textAlign: 'center', fontSize: 26, lineHeight: 1.02, color: C.ink })
      ], { flex: 1, position: 'relative' })
    ))
  ], { dark: true, title: d.title, meta: d.meta })
}

function renderPrinciples(spec) {
  const d = content(spec, 'princ')
  const cards = arr(d.cards, DEFAULTS.princ.cards)
  const colors = [C.sienna, C.magenta, C.orange, C.teal]
  return page(spec, 3, [
    box({ position: 'absolute', left: 50, right: 50, top: 142, bottom: 72, flexDirection: 'row', gap: 18 }, cards.slice(0, 4).map((card, index) => {
      const [n, title, body] = card
      const dark = index === 3
      return tablet(colors[index], [
        number(n, spec, { position: 'absolute', left: 22, top: 22, fontSize: 134, color: C.ink }),
        display(title, spec, { position: 'absolute', left: 22, right: 22, top: 172, fontSize: 24, lineHeight: 1.02, color: dark ? C.bone : C.ink }),
        text(body, spec, { position: 'absolute', left: 22, right: 22, bottom: 22, fontSize: 11.2, lineHeight: 1.28, color: dark ? C.bone : C.ink })
      ], { flex: 1, position: 'relative' })
    }))
  ], { title: d.title, meta: d.meta })
}

function renderSection(spec) {
  const d = content(spec, 'sec')
  return page(spec, 4, [
    number(d.number, spec, { position: 'absolute', left: 42, top: 104, fontSize: 274, color: C.orange }),
    label(d.label, spec, { position: 'absolute', right: 54, top: 176, width: 210, textAlign: 'right', fontSize: 16, lineHeight: 1.12, color: C.softBone }),
    display(d.headline, spec, { position: 'absolute', right: 54, bottom: 104, width: 505, textAlign: 'right', fontSize: 76, lineHeight: 0.92, color: C.bone })
  ], { dark: true, title: d.title, meta: d.meta })
}

function renderConsult(spec) {
  const d = content(spec, 'consult')
  const columns = arr(d.columns, DEFAULTS.consult.columns)
  return page(spec, 5, [
    tablet(C.mustard, [
      label(d.tag, spec, { position: 'absolute', left: 22, top: 24, width: 150, fontSize: 14, letterSpacing: 1.3 }),
      box({ position: 'absolute', left: 185, top: 22, bottom: 22, width: 2, backgroundColor: C.ink }),
      display(d.action, spec, { position: 'absolute', left: 210, right: 24, top: 20, fontSize: 23, lineHeight: 1.08, color: C.ink })
    ], { position: 'absolute', left: 50, right: 50, top: 112, height: 104 }),
    box({ position: 'absolute', left: 50, right: 50, top: 246, bottom: 74, flexDirection: 'row', gap: 18 }, columns.slice(0, 3).map((col, index) => {
      const [title, bodyText, bullets, source] = col
      const fill = index === 1 ? C.orange : C.paper
      return tablet(fill, [
        display(title, spec, { position: 'absolute', left: 18, right: 18, top: 18, fontSize: 22, lineHeight: 1.05, color: C.ink }),
        box({ position: 'absolute', left: 18, right: 18, top: 64, height: 2, backgroundColor: C.ink }),
        text(bodyText, spec, { position: 'absolute', left: 18, right: 18, top: 78, fontSize: 12.4, lineHeight: 1.32 }),
        ...arr(bullets).slice(0, 3).map((bullet, bulletIndex) =>
          text(`- ${bullet}`, spec, { position: 'absolute', left: 18, right: 18, top: 122 + bulletIndex * 22, fontSize: 9.6, lineHeight: 1.14 })
        ),
        label(source, spec, { position: 'absolute', left: 18, right: 18, bottom: 10, fontSize: 8.8, color: C.softInk, letterSpacing: 0.8 })
      ], { flex: 1, position: 'relative' })
    }))
  ], { title: d.title, meta: d.meta })
}

function renderChart(spec) {
  const d = content(spec, 'chart')
  const seriesColors = [C.bone, C.mustard, C.orange]
  return page(spec, 6, [
    display(d.headline, spec, { position: 'absolute', left: 52, top: 160, width: 350, fontSize: 54, lineHeight: 0.9, color: C.bone }),
    text(d.body, spec, { position: 'absolute', left: 54, top: 320, width: 342, fontSize: 13.2, lineHeight: 1.38, color: C.softBone }),
    box({ position: 'absolute', left: 54, bottom: 82, gap: 8 }, arr(d.legend, DEFAULTS.chart.legend).map((item, index) =>
      box({ flexDirection: 'row', gap: 10, alignItems: 'center' }, [
        box({ width: 28, height: 5, backgroundColor: seriesColors[index], opacity: index === 0 ? 0.55 : 1 }),
        label(item, spec, { fontSize: 11, color: C.bone, letterSpacing: 0.8 })
      ])
    )),
    tablet(C.paper, [
      label('% OF COHORT ACTIVE, BY DAY', spec, { position: 'absolute', left: 42, top: 24, fontSize: 11, color: C.softInk }),
      box({ position: 'absolute', left: 76, right: 34, top: 70, bottom: 64, borderLeft: '2px solid #0A0A0A', borderBottom: '2px solid #0A0A0A' }),
      ...[0, 1, 2, 3].map((i) => box({ position: 'absolute', left: 76, right: 34, top: 70 + i * 38, height: 1, backgroundColor: 'rgba(10,10,10,0.14)' })),
      ...[88, 116, 146, 174, 210, 246, 298].map((x, index) => box({ position: 'absolute', left: x, bottom: 70 + [10, 22, 35, 46, 58, 66, 72][index], width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange })),
      ...[88, 116, 146, 174, 210, 246, 298].map((x, index) => box({ position: 'absolute', left: x, bottom: 70 + [10, 16, 25, 34, 42, 48, 54][index], width: 6, height: 6, borderRadius: 3, backgroundColor: C.mustard })),
      ...arr(d.labels, DEFAULTS.chart.labels).slice(0, 7).map((item, index) =>
        label(item, spec, { position: 'absolute', left: 80 + index * 39, bottom: 30, fontSize: 10, color: C.softInk })
      )
    ], { position: 'absolute', right: 52, top: 166, width: 390, height: 288 })
  ], { dark: true, title: d.title, meta: d.meta })
}

function renderProcess(spec) {
  const d = content(spec, 'process')
  const steps = arr(d.steps, DEFAULTS.process.steps)
  return page(spec, 7, [
    display(d.headline, spec, { position: 'absolute', left: 52, top: 108, width: 390, fontSize: 52, lineHeight: 0.9 }),
    label(d.subtitle, spec, { position: 'absolute', right: 56, top: 132, width: 310, fontSize: 14, lineHeight: 1.36, color: C.softInk, letterSpacing: 0.8 }),
    box({ position: 'absolute', left: 50, right: 50, top: 330, height: 104, flexDirection: 'row', gap: 14 }, steps.slice(0, 5).map((step, index) => {
      const [n, title, bodyText] = step
      const fills = [C.sienna, C.magenta, C.orange, C.teal, C.blue]
      const dark = index >= 3
      return tablet(fills[index], [
        number(n, spec, { position: 'absolute', left: 16, top: 12, fontSize: 34, color: dark ? C.bone : C.ink }),
        display(title, spec, { position: 'absolute', left: 16, right: 16, top: 48, fontSize: 16, lineHeight: 1.02, color: dark ? C.bone : C.ink }),
        text(bodyText, spec, { position: 'absolute', left: 16, right: 16, top: 72, fontSize: 8.2, lineHeight: 1.16, color: dark ? C.bone : C.ink })
      ], { flex: 1, position: 'relative' })
    })),
    tablet(C.paper, arr(d.timeline, DEFAULTS.process.timeline).slice(0, 5).map((item) =>
      label(item, spec, { fontSize: 11, color: C.ink, letterSpacing: 0.8 })
    ), { position: 'absolute', left: 50, right: 50, bottom: 70, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' })
  ], { title: d.title, meta: d.meta })
}

function renderMatrix(spec) {
  const d = content(spec, 'matrix')
  const headers = arr(d.headers, DEFAULTS.matrix.headers)
  const rows = arr(d.rows, DEFAULTS.matrix.rows)
  const cells = [headers, ...rows].flatMap((row) => row)
  return page(spec, 8, [
    display(d.headline, spec, { position: 'absolute', left: 52, top: 106, width: 390, fontSize: 52, lineHeight: 0.9 }),
    label(d.subtitle, spec, { position: 'absolute', right: 56, top: 132, width: 310, fontSize: 14, lineHeight: 1.36, color: C.softInk, letterSpacing: 0.8 }),
    tablet(C.paper, cells.slice(0, 20).map((cell, index) => {
      const row = Math.floor(index / 4)
      const col = index % 4
      const head = row === 0
      const first = col === 0
      const rowHeight = 41
      return box({
        position: 'absolute',
        left: col === 0 ? 0 : 204 + (col - 1) * 162,
        top: row * rowHeight,
        width: col === 0 ? 204 : 162,
        height: rowHeight,
        backgroundColor: head ? C.ink : 'transparent',
        borderRight: col === 3 ? '0px solid transparent' : '1px solid rgba(10,10,10,0.28)',
        borderBottom: row === 4 ? '0px solid transparent' : '1px solid rgba(10,10,10,0.28)',
        justifyContent: 'center',
        paddingLeft: 14,
        paddingRight: 10
      }, [
        label(cell, spec, { fontSize: head || first ? 12 : 11, color: head ? C.bone : C.ink, letterSpacing: 0.6, lineHeight: 1.1 })
      ])
    }), { position: 'absolute', left: 50, right: 50, bottom: 62, height: 205, overflow: 'hidden' })
  ], { title: d.title, meta: d.meta })
}

function renderStats(spec) {
  const d = content(spec, 'stats')
  const stats = arr(d.stats, DEFAULTS.stats.stats)
  return page(spec, 9, [
    display(d.headline, spec, { position: 'absolute', left: 52, top: 118, width: 430, fontSize: 66, lineHeight: 0.92, color: C.bone }),
    label(d.subtitle, spec, { position: 'absolute', right: 56, top: 132, width: 300, fontSize: 14, lineHeight: 1.36, color: C.softBone, letterSpacing: 0.8 }),
    box({ position: 'absolute', left: 50, right: 50, bottom: 74, height: 180, flexDirection: 'row', gap: 18 }, stats.slice(0, 3).map((item, index) => {
      const [value, title, bodyText] = item
      const fills = [C.orange, C.mustard, C.bone]
      return tablet(fills[index], [
        number(value, spec, { position: 'absolute', left: 20, top: 18, fontSize: 78, color: C.ink }),
        display(title, spec, { position: 'absolute', left: 20, right: 20, top: 94, fontSize: 18, lineHeight: 1.02, color: C.ink }),
        text(bodyText, spec, { position: 'absolute', left: 20, right: 20, bottom: 16, fontSize: 9.3, lineHeight: 1.18, color: C.ink })
      ], { flex: 1, position: 'relative' })
    }))
  ], { dark: true, title: d.title, meta: d.meta })
}

function renderQuote(spec) {
  const d = content(spec, 'quote')
  return page(spec, 10, [
    tablet(C.magenta, [
      number('"', spec, { position: 'absolute', left: 52, top: 38, fontSize: 190, color: C.ink }),
      TextBlock(String(d.quote || ''), {
        position: 'absolute',
        left: 292,
        right: 58,
        top: 68,
        color: C.ink,
        fontSize: 29,
        lineHeight: 1.06,
        ...fontRole('display', spec, { fontWeight: 700, fontSize: 29, lineHeight: 1.06, letterSpacing: -0.2 })
      }),
      label(d.who, spec, { position: 'absolute', left: 292, right: 58, bottom: 62, fontSize: 15, letterSpacing: 1.3 }),
      label(d.role, spec, { position: 'absolute', left: 292, right: 58, bottom: 38, fontSize: 11, color: C.softInk, letterSpacing: 1.1 })
    ], { position: 'absolute', left: 50, right: 50, top: 120, bottom: 78 })
  ], { title: d.title, meta: d.meta })
}

function renderCta(spec) {
  const d = content(spec, 'cta')
  const steps = arr(d.steps, DEFAULTS.cta.steps)
  return page(spec, 11, [
    box({ position: 'absolute', left: 50, right: 50, top: 112, bottom: 72, flexDirection: 'row', gap: 24 }, [
      tablet(C.teal, [
        label('From here', spec, { position: 'absolute', left: 28, top: 28, fontSize: 14, color: C.softBone, letterSpacing: 1.4 }),
        display(d.headline, spec, { position: 'absolute', left: 28, right: 28, top: 74, fontSize: 62, lineHeight: 0.9, color: C.bone }),
        text(d.body, spec, { position: 'absolute', left: 28, right: 70, bottom: 28, fontSize: 13, lineHeight: 1.34, color: C.bone })
      ], { flex: 1, position: 'relative' }),
      tablet(C.orange, [
        display('How we move\nthis week', spec, { position: 'absolute', left: 28, right: 28, top: 30, fontSize: 30, lineHeight: 1 }),
        ...steps.slice(0, 3).map((step, index) => {
          const [n, title, bodyText] = step
          const top = 112 + index * 74
          return box({ position: 'absolute', left: 28, right: 28, top, height: 64, flexDirection: 'row', gap: 14 }, [
            number(n, spec, { width: 46, fontSize: 36, color: C.ink }),
            box({ flex: 1 }, [
              label(title, spec, { fontSize: 15, letterSpacing: 0.9 }),
              text(bodyText, spec, { marginTop: 4, fontSize: 11, lineHeight: 1.28 })
            ])
          ])
        })
      ], { flex: 1, position: 'relative' })
    ])
  ], { title: d.title, meta: d.meta })
}

export function renderStencilFieldManual(spec) {
  const variant = normalizeVariant(spec)
  switch (variant) {
    case 'agenda':
      return renderAgenda(spec)
    case 'princ':
      return renderPrinciples(spec)
    case 'sec':
      return renderSection(spec)
    case 'consult':
      return renderConsult(spec)
    case 'chart':
      return renderChart(spec)
    case 'process':
      return renderProcess(spec)
    case 'matrix':
      return renderMatrix(spec)
    case 'stats':
      return renderStats(spec)
    case 'quote':
      return renderQuote(spec)
    case 'cta':
      return renderCta(spec)
    case 'cover':
    default:
      return renderCover(spec)
  }
}
