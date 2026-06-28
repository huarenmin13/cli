import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'annotated-field-board'

export const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'notes',
  'sec',
  'notice',
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
  source_family: 'pin-and-paper',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'pin-and-paper',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'sec', 'quote', 'cta'],
      repeatable: ['agenda', 'notes', 'notice', 'chart', 'process', 'matrix', 'stats']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/pin-and-paper-1.png'
}

const DEFAULTS = {
  cover: {
    eyebrow: 'A field guide - Vol. I',
    title: 'Kept\nthings',
    notes: ['For: the room.\nTwo pages. One ask.', 'Presented by A. Speaker\nRole - Team - Spring 2026'],
    date: '29 - IV - 2026'
  },
  agenda: {
    title: "What's inside",
    eyebrow: 'Pin & Paper',
    meta: ['North Field Office', 'Phase I'],
    items: [
      { num: '01', label: 'The trust gap', meta: 'Findings - 12 min' },
      { num: '02', label: 'Three pilots, scored', meta: 'Evidence - 9 min' },
      { num: '03', label: 'A way of working', meta: 'Method - 7 min' },
      { num: '04', label: 'What we ship next', meta: 'Decisions - 8 min' }
    ]
  },
  notes: {
    title: "Three rules we're keeping",
    subtitle: "Pinned to the wall above every desk. We refer back to them when a decision feels too big to make from the seat we're in.",
    cards: [
      { num: 'Rule - 01', title: 'Write the\nreal sentence', body: "If a customer wouldn't read the email, the email is not the work. Plain words, signed by a person.", scribble: '- write it by hand first.' },
      { num: 'Rule - 02', title: 'Earn the\nsecond look', body: 'Every interaction in the first 72 hours is doing four times the work of one in week three. Spend accordingly.', scribble: 'no autoresponder, ever.' },
      { num: 'Rule - 03', title: 'Keep the\nhandwriting', body: 'The system is allowed to grow, but the voice on the other end stays small enough to know who you wrote to last week.', scribble: '200 names, max.' }
    ]
  },
  sec: {
    eyebrow: 'Section II',
    label: 'Direction\n& doctrine',
    title: 'Where we\nare going,\nand why',
    scribble: '- turn the page -'
  },
  notice: {
    eyebrow: 'Notice - 05\nAction title',
    title: 'The trust gap is built in the first 72 hours, not the first 7 days - and the cost compounds for the rest of the lifecycle',
    columns: [
      { title: 'What we found', body: 'Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.', bullets: ['Email open #2 lifts D90 retention by 19 points.', 'Personal salutation retained 2.4x the cohort.', 'Reply received within 24 hours is the largest lever.'], source: 'N = 14,200 - Q1 2026' },
      { title: 'Why it matters', meta: '$4.1M projected retained ARR', body: 'The first three days are the only window where customers are both paying attention and willing to write back.', bullets: ['Every interaction here does the work of four interactions in week three.', 'The real cost is quiet churn, not refunds.'], source: 'Modelled on FY24 cohort behaviour' },
      { title: 'What to do', body: 'Rewrite the first three touches and instrument the 72-hour window as a first-class weekly metric.', bullets: ['Rewrite emails 1-3 in human voice.', 'Route top accounts to a named human.', 'Review the window every week.'], source: 'Pilot scope: top-decile signups' }
    ]
  },
  chart: {
    title: 'Curve\nbends at\nday three',
    subtitle: 'Cohorts that received a written welcome and a human reply within 24 hours retain at roughly 2x the rate of the templated cohort.',
    legend: ['Templated welcome', 'Written welcome', 'Written + human reply']
  },
  process: {
    title: 'From insight to default,\nin five moves',
    subtitle: 'A repeatable path each pilot follows before it graduates to the default experience for every customer.',
    steps: [
      { n: '1', title: 'Frame', body: 'Translate the insight into a behavioural hypothesis.' },
      { n: '2', title: 'Design', body: 'Smallest end-to-end change that tests it cleanly.' },
      { n: '3', title: 'Pilot', body: 'Ship to a holdout and hold the line for two cycles.' },
      { n: '4', title: 'Read', body: 'Use pre-registered metrics only.' },
      { n: '5', title: 'Default', body: 'Promote and retire the legacy path.' }
    ],
    timeline: ['Week 1 - Frame', 'Week 2-3 - Design', 'Week 3-6 - Pilot', 'Week 7 - Read', 'Week 8 - Default']
  },
  matrix: {
    title: 'Where each pilot\nearns its keep',
    subtitle: 'Scored against the four levers that matter most this cycle.',
    headers: ['Lever', 'Rewrite welcome', 'Quiet upgrades', 'Inbox-as-search'],
    rows: [
      ['Time-to-impact', '<= 4 weeks', '6-8 weeks', '<= 4 weeks'],
      ['Build cost', 'low', 'medium', 'low'],
      ['Retention lift', '+19 pts D90', '+7 pts D90', '+5 pts D90'],
      ['Risk to power users', 'none', 'material', 'soft, reversible']
    ]
  },
  stats: {
    title: 'The case,\nby the numbers',
    subtitle: 'Three figures we will report against every cycle. If one stops moving, the bet is over.',
    stats: [
      { value: '2.4', suffix: 'x', title: 'Retention\nmultiple', body: 'Written welcome plus human reply, versus templated control.' },
      { value: '$4.1', suffix: 'M', title: 'Projected\nretained ARR', body: "Modelled on the current quarter's signup cohort." },
      { value: '72', suffix: 'hr', title: 'The window\nthat matters', body: 'Behaviour after the first 72 hours predicts long-term retention.' }
    ]
  },
  quote: {
    quote: "Three days in, someone wrote me a real sentence. I'd been a customer of theirs for nine months before I noticed I'd never been a customer anywhere else again.",
    author: 'Margaux Leveque',
    meta: 'CFO - mid-market retailer - 14 months in'
  },
  cta: {
    title: 'Pick the\nthree\nbets',
    subtitle: "Three pilots in eight weeks. We'll bring back evidence the quarter after.",
    right_title: 'How we move this week',
    steps: [
      { n: '1', title: 'Pick the pilots', body: 'Confirm two of three by Friday. Owners named in the same conversation.' },
      { n: '2', title: 'Pre-register the read', body: 'Lock the metric, holdout, and kill criteria before code ships.' },
      { n: '3', title: 'Clear the release path', body: 'Ship behind a reversible flag and review weekly.' }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || '#EFE56A',
    paper2: source.panel || '#F5ECA0',
    cream: source.surface || '#F8F1D6',
    extra: source.extra || '#FBE6A4',
    ink: source.text || source.primary || '#1F3A8A',
    inkSoft: source.accent || '#2D4FB8',
    red: source.red || '#C2342B',
    olive: source.muted || '#6B7A2E',
    orange: source.orange || '#D8702A'
  }
}

function array(spec, key, fallback = []) {
  const value = spec.content?.[key]
  return Array.isArray(value) && value.length ? value : fallback
}

function value(spec, key, fallback = '') {
  const raw = spec.content?.[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback
}

function variantContent(spec, variant) {
  return { ...DEFAULTS[variant], ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('agenda')) return 'agenda'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('compare') || raw.includes('matrix')) return 'matrix'
  if (raw.includes('closing') || raw.includes('cta')) return 'cta'
  if (raw.includes('process') || raw.includes('timeline')) return 'process'
  return 'cover'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function display(text, spec, style = {}) {
  return Title(text, {
    color: style.color || '#1F3A8A',
    fontSize: 74,
    lineHeight: 0.98,
    letterSpacing: -1.2,
    whiteSpace: 'pre-wrap',
    ...role('display', spec, { fontWeight: 800, fontSize: 74, lineHeight: 0.98, letterSpacing: -1.2 }),
    ...style
  })
}

function body(text, spec, style = {}) {
  return TextBlock(text, {
    color: style.color || '#1F3A8A',
    fontSize: 15,
    lineHeight: 1.32,
    ...role('body', spec, { fontWeight: 450, fontSize: 15, lineHeight: 1.32 }),
    ...style
  })
}

function label(text, spec, style = {}) {
  return TextBlock(String(text || '').toUpperCase(), {
    color: style.color || '#1F3A8A',
    fontSize: 10,
    lineHeight: 1.15,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 650, fontSize: 10, lineHeight: 1.15, letterSpacing: 1.35, textTransform: 'uppercase' }),
    ...style
  })
}

function metric(text, spec, style = {}) {
  return TextBlock(String(text || ''), {
    color: style.color || '#1F3A8A',
    fontSize: 14,
    lineHeight: 1.15,
    letterSpacing: 0.7,
    ...role('metric', spec, { fontWeight: 650, fontSize: 14, lineHeight: 1.15, letterSpacing: 0.7 }),
    ...style
  })
}

function handwritten(text, spec, style = {}) {
  return TextBlock(text, {
    color: style.color || '#1F3A8A',
    fontSize: 28,
    lineHeight: 1.05,
    whiteSpace: 'pre-wrap',
    ...role('display', spec, { fontWeight: 700, fontSize: 28, lineHeight: 1.05 }),
    ...style
  })
}

function page(theme, children, style = {}) {
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.paper,
      color: theme.ink,
      ...style
    },
    [
      box({
        position: 'absolute',
        left: 0,
        top: 0,
        width: 960,
        height: 540,
        opacity: 0.1,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.ink} 1px, transparent 1.7px)`,
        backgroundSize: '5px 5px'
      }),
      ...children
    ]
  )
}

function footer(spec, theme, variant) {
  return box({ position: 'absolute', left: 64, right: 64, bottom: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
    label('North Field Office', spec, { fontSize: 8.5, letterSpacing: 1.2, color: theme.ink }),
    label(`${String(PAGE_VARIANTS.indexOf(variant) + 1).padStart(2, '0')} / 11`, spec, { fontSize: 8.5, letterSpacing: 1.2, color: theme.ink, textAlign: 'right' })
  ])
}

function topBar(spec, theme, title, meta = ['North Field Office', 'Phase I'], color = theme.ink) {
  return box({ position: 'absolute', left: 64, right: 64, top: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
    box({ flexDirection: 'row', alignItems: 'center' }, [
      box({ width: 18, height: 10, borderTopWidth: 2, borderBottomWidth: 2, borderColor: color, marginRight: 8 }),
      label(title, spec, { color, fontSize: 8.6, letterSpacing: 1.1 })
    ]),
    box({ flexDirection: 'row', alignItems: 'center' }, meta.slice(0, 2).map((item, index) =>
      label(item, spec, { color, opacity: 0.75, fontSize: 8.2, letterSpacing: 1, marginLeft: index === 0 ? 0 : 20 })
    ))
  ])
}

function pin(theme, { left, right, top, bottom, width = 130, rotate = -8, color = theme.ink, opacity = 1 }) {
  const height = Math.round(width * 0.3)
  const style = { position: 'absolute', width, height, transform: `rotate(${rotate}deg)`, opacity }
  if (left !== undefined) style.left = left
  if (right !== undefined) style.right = right
  if (top !== undefined) style.top = top
  if (bottom !== undefined) style.bottom = bottom
  return box(style, [
    box({ position: 'absolute', left: 5, top: height * 0.28, width: width * 0.18, height: height * 0.38, borderRadius: 999, borderWidth: 2, borderColor: color }),
    box({ position: 'absolute', left: width * 0.16, top: height * 0.45, width: width * 0.62, height: 2.5, backgroundColor: color }),
    box({ position: 'absolute', right: width * 0.04, top: height * 0.22, width: width * 0.16, height: height * 0.44, borderRadius: 999, borderWidth: 2, borderColor: color }),
    box({ position: 'absolute', right: 0, top: height * 0.44, width: width * 0.2, height: 2.5, backgroundColor: color })
  ])
}

function card(theme, spec, children, style = {}) {
  return box(
    {
      backgroundColor: theme.cream,
      borderWidth: 1.5,
      borderColor: theme.ink,
      borderRadius: 4,
      boxShadow: `4px 5px 0 ${theme.ink}`,
      position: 'relative',
      flexDirection: 'column',
      ...style
    },
    children
  )
}

function cover(spec, theme) {
  const c = variantContent(spec, 'cover')
  const notes = array(spec, 'notes', c.notes)
  return page(theme, [
    pin(theme, { right: 80, top: 70, width: 210, rotate: -8 }),
    pin(theme, { right: 132, top: 256, width: 180, rotate: 14 }),
    box({ position: 'absolute', inset: 0, padding: '62px 64px 58px', flexDirection: 'column', justifyContent: 'space-between' }, [
      label(value(spec, 'eyebrow', c.eyebrow), spec, { fontSize: 11, letterSpacing: 2.0 }),
      display(value(spec, 'title', c.title), spec, { width: 520, fontSize: 100, lineHeight: 1.0, letterSpacing: -2.8 }),
      box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, [
        metric(notes[1] || c.notes[1], spec, { width: 360, fontSize: 10.5, letterSpacing: 1.3, whiteSpace: 'pre-wrap' }),
        metric(value(spec, 'date', c.date), spec, { width: 180, textAlign: 'right', fontSize: 10.5, letterSpacing: 1.3 })
      ])
    ]),
    handwritten(notes[0] || c.notes[0], spec, { position: 'absolute', right: 76, top: 160, width: 210, textAlign: 'right', transform: 'rotate(-3deg)' })
  ])
}

function agenda(spec, theme) {
  const c = variantContent(spec, 'agenda')
  const items = array(spec, 'items', c.items)
  return page(theme, [
    topBar(spec, theme, value(spec, 'eyebrow', c.eyebrow), array(spec, 'meta', c.meta)),
    display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 64, top: 104, width: 560, fontSize: 70, lineHeight: 1.0 }),
    box({ position: 'absolute', left: 64, right: 64, top: 238, flexDirection: 'column' }, items.slice(0, 4).map((item, index) =>
      box({ height: 58, borderBottomWidth: index === 3 ? 0 : 1.5, borderBottomColor: 'rgba(31,58,138,.45)', flexDirection: 'row', alignItems: 'center' }, [
        metric(item.num, spec, { width: 80, fontSize: 14, letterSpacing: 1.2 }),
        display(item.label, spec, { width: 440, fontSize: 30, lineHeight: 1.0, letterSpacing: -0.5 }),
        pin(theme, { left: 590, top: 14, width: 108, rotate: index === 2 ? 6 : -4 }),
        label(item.meta, spec, { width: 172, marginLeft: 170, textAlign: 'right', opacity: 0.7, fontSize: 8.5, letterSpacing: 1.1 })
      ])
    )),
    footer(spec, theme, 'agenda')
  ])
}

function notes(spec, theme) {
  const c = variantContent(spec, 'notes')
  const cards = array(spec, 'cards', c.cards)
  return page(theme, [
    topBar(spec, theme, 'Principles', ['North Field Office', 'Phase II']),
    display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 64, top: 104, width: 650, fontSize: 58, lineHeight: 1.0 }),
    body(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', left: 64, top: 222, width: 660, fontSize: 14, lineHeight: 1.32, opacity: 0.85 }),
    box({ position: 'absolute', left: 64, right: 64, top: 304, bottom: 76, flexDirection: 'row' }, cards.slice(0, 3).map((item, index) =>
      card(theme, spec, [
        pin(theme, { left: 22, top: -16, width: 105, rotate: index === 2 ? 6 : -8 }),
        label(item.num, spec, { fontSize: 8.4, letterSpacing: 1.4, opacity: 0.7, marginBottom: 8 }),
        display(item.title, spec, { fontSize: 24, lineHeight: 1.0, width: 214, marginBottom: 9 }),
        body(item.body, spec, { fontSize: 11.2, lineHeight: 1.28, width: 214 }),
        handwritten(item.scribble, spec, { marginTop: 'auto', paddingTop: 8, fontSize: 18, lineHeight: 1.05, transform: 'rotate(-1.5deg)' })
      ], {
        width: 266,
        height: 160,
        padding: '24px 20px 16px',
        marginRight: index === 2 ? 0 : 29,
        backgroundColor: index === 1 ? theme.paper2 : index === 2 ? theme.extra : theme.cream,
        ...(index === 2 ? { transform: 'rotate(.6deg)' } : {})
      })
    )),
    footer(spec, theme, 'notes')
  ])
}

function sec(spec, theme) {
  const c = variantContent(spec, 'sec')
  return page(theme, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 64, top: 70, color: theme.paper, opacity: 0.82, letterSpacing: 2.0 }),
    label(value(spec, 'label', c.label), spec, { position: 'absolute', right: 64, top: 70, width: 230, color: theme.paper, opacity: 0.82, textAlign: 'right', letterSpacing: 2.0, whiteSpace: 'pre-wrap' }),
    pin(theme, { right: 58, top: 190, width: 310, rotate: -14, color: theme.paper, opacity: 0.88 }),
    display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 64, bottom: 116, width: 560, color: theme.paper, fontSize: 86, lineHeight: 1.0, letterSpacing: -2.0 }),
    handwritten(value(spec, 'scribble', c.scribble), spec, { position: 'absolute', left: 64, bottom: 66, width: 240, color: theme.paper, fontSize: 25, transform: 'rotate(-2deg)' }),
    footer(spec, { ...theme, ink: theme.paper }, 'sec')
  ], { backgroundColor: theme.ink })
}

function notice(spec, theme) {
  const c = variantContent(spec, 'notice')
  const columns = array(spec, 'columns', c.columns)
  return page(theme, [
    topBar(spec, theme, 'Findings - detail', ['North Field Office', 'Phase III']),
    box({ position: 'absolute', left: 64, right: 64, top: 100, flexDirection: 'row', alignItems: 'flex-start' }, [
      label(value(spec, 'eyebrow', c.eyebrow), spec, { width: 136, borderRightWidth: 2, borderRightColor: theme.ink, paddingRight: 18, paddingTop: 8, fontSize: 8.4, letterSpacing: 1.45, whiteSpace: 'pre-wrap' }),
      display(value(spec, 'title', c.title), spec, { marginLeft: 24, width: 690, fontSize: 33, lineHeight: 1.04, letterSpacing: -0.5 })
    ]),
    box({ position: 'absolute', left: 64, right: 64, top: 274, bottom: 72, flexDirection: 'row' }, columns.slice(0, 3).map((item, index) =>
      card(theme, spec, [
        display(item.title, spec, { fontSize: 18, lineHeight: 1.02, borderBottomWidth: 1.5, borderBottomColor: theme.ink, paddingBottom: 8, marginBottom: 8, width: 226 }),
        item.meta ? handwritten(item.meta, spec, { fontSize: 22, lineHeight: 1.0, marginBottom: 6 }) : null,
        body(item.body, spec, { fontSize: 9.5, lineHeight: 1.24, width: 226, marginBottom: 6 }),
        ...((item.bullets || []).slice(0, 3).map((bullet) =>
          body(`- ${bullet}`, spec, { fontSize: 8.8, lineHeight: 1.18, width: 226, marginBottom: 3 })
        )),
        label(item.source, spec, { marginTop: 'auto', paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(31,58,138,.45)', fontSize: 6.8, letterSpacing: 0.8, opacity: 0.76 })
      ].filter(Boolean), {
        width: 262,
        height: 194,
        padding: '16px 16px 12px',
        marginRight: index === 2 ? 0 : 28,
        backgroundColor: index === 1 ? theme.paper2 : theme.cream
      })
    )),
    footer(spec, theme, 'notice')
  ])
}

function chartLine(theme, color, points, width, height, stroke = 3) {
  return points.slice(1).map((point, index) => {
    const prev = points[index]
    const x1 = prev[0] * width
    const y1 = prev[1] * height
    const x2 = point[0] * width
    const y2 = point[1] * height
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    return box({
      position: 'absolute',
      left: x1,
      top: y1,
      width: length,
      height: stroke,
      backgroundColor: color,
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 50%',
      borderRadius: 999
    })
  })
}

function chart(spec, theme) {
  const c = variantContent(spec, 'chart')
  const legend = array(spec, 'legend', c.legend)
  const plotW = 315
  const plotH = 204
  return page(theme, [
    topBar(spec, { ...theme, ink: theme.paper }, 'Retention, by cohort', ['Phase III', 'Evidence'], theme.paper),
    pin(theme, { right: 56, top: 86, width: 160, rotate: 20, color: theme.paper, opacity: 0.35 }),
    box({ position: 'absolute', left: 64, top: 150, bottom: 74, width: 344, flexDirection: 'column' }, [
      display(value(spec, 'title', c.title), spec, { width: 330, color: theme.paper, fontSize: 58, lineHeight: 1.0 }),
      body(value(spec, 'subtitle', c.subtitle), spec, { width: 320, color: theme.paper, opacity: 0.88, fontSize: 13.5, lineHeight: 1.36, marginTop: 16 }),
      box({ marginTop: 'auto', flexDirection: 'column' }, legend.slice(0, 3).map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'center', marginTop: index === 0 ? 0 : 8 }, [
          box({ width: 32, height: 4, backgroundColor: [theme.paper2, theme.cream, theme.paper][index], marginRight: 10 }),
          label(item, spec, { color: theme.paper, fontSize: 7.8, letterSpacing: 0.8 })
        ])
      ))
    ]),
    card(theme, spec, [
      label('% of cohort active, by day', spec, { opacity: 0.7, marginBottom: 12 }),
      box({ position: 'relative', width: plotW, height: plotH, marginLeft: 40, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.ink }, [
        ...[0, 0.25, 0.5, 0.75].map((top) => box({ position: 'absolute', left: 0, right: 0, top: top * plotH, height: 1, borderTopWidth: 1, borderTopColor: 'rgba(31,58,138,.25)' })),
        ...chartLine(theme, theme.ink, [[0, .04], [.16, .3], [.32, .5], [.48, .64], [.64, .76], [.8, .84], [1, .9]], plotW, plotH, 2),
        ...chartLine(theme, theme.inkSoft, [[0, .04], [.16, .18], [.32, .28], [.48, .38], [.64, .46], [.8, .52], [1, .56]], plotW, plotH, 3),
        ...chartLine(theme, theme.ink, [[0, .04], [.16, .1], [.32, .16], [.48, .22], [.64, .28], [.8, .32], [1, .36]], plotW, plotH, 4)
      ]),
      box({ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 38, marginTop: 8, width: plotW + 2 }, ['D0', 'D7', 'D14', 'D30', 'D45', 'D60', 'D90'].map((x) =>
        metric(x, spec, { fontSize: 8.5, letterSpacing: 0.5 })
      ))
    ], { position: 'absolute', right: 64, top: 146, width: 438, height: 318, padding: '26px 28px 20px 30px', backgroundColor: theme.paper, boxShadow: `6px 7px 0 rgba(239,229,106,.25)` }),
    footer(spec, { ...theme, ink: theme.paper }, 'chart')
  ], { backgroundColor: theme.ink })
}

function process(spec, theme) {
  const c = variantContent(spec, 'process')
  const steps = array(spec, 'steps', c.steps)
  const timeline = array(spec, 'timeline', c.timeline)
  return page(theme, [
    topBar(spec, theme, "How we'll work", ['North Field Office', 'Phase IV']),
    box({ position: 'absolute', left: 64, right: 64, top: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, [
      display(value(spec, 'title', c.title), spec, { width: 560, fontSize: 56, lineHeight: 1.0 }),
      body(value(spec, 'subtitle', c.subtitle), spec, { width: 260, fontSize: 13.2, lineHeight: 1.34, opacity: 0.85, marginTop: 10 })
    ]),
    box({ position: 'absolute', left: 64, right: 64, top: 284, flexDirection: 'row' }, steps.slice(0, 5).map((item, index) =>
      card(theme, spec, [
        pin(theme, { left: 38, top: -14, width: 88, rotate: -6 }),
        handwritten(item.n, spec, { fontSize: 39, lineHeight: 0.9 }),
        display(item.title, spec, { fontSize: 18, lineHeight: 1.0, marginTop: 2, marginBottom: 4 }),
        body(item.body, spec, { fontSize: 8.8, lineHeight: 1.2, width: 132 }),
        index < 4 ? TextBlock('->', { position: 'absolute', right: -15, top: 54, color: theme.ink, fontSize: 20, fontWeight: 700 }) : null
      ].filter(Boolean), {
        width: 148,
        height: 120,
        padding: '24px 14px 12px',
        marginRight: index === 4 ? 0 : 22,
        backgroundColor: index === 2 ? theme.extra : index % 2 ? theme.paper2 : theme.cream
      })
    )),
    box({ position: 'absolute', left: 64, right: 64, bottom: 86, height: 38, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.ink, padding: '0 18px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, timeline.slice(0, 5).map((item) =>
      label(item, spec, { fontSize: 7.4, letterSpacing: 0.7 })
    )),
    footer(spec, theme, 'process')
  ])
}

function matrix(spec, theme) {
  const c = variantContent(spec, 'matrix')
  const rows = array(spec, 'rows', c.rows)
  const headers = array(spec, 'headers', c.headers)
  return page(theme, [
    topBar(spec, theme, 'Three pilots, side by side', ['North Field Office', 'Phase IV']),
    box({ position: 'absolute', left: 64, right: 64, top: 100, flexDirection: 'row', justifyContent: 'space-between' }, [
      display(value(spec, 'title', c.title), spec, { width: 510, fontSize: 56, lineHeight: 1.0 }),
      body(value(spec, 'subtitle', c.subtitle), spec, { width: 270, fontSize: 13.5, lineHeight: 1.35, opacity: 0.85, marginTop: 12 })
    ]),
    card(theme, spec, [
      box({ height: 40, flexDirection: 'row', backgroundColor: theme.ink }, headers.slice(0, 4).map((head, index) =>
        label(head, spec, { width: index === 0 ? 232 : 192, color: theme.paper, fontSize: 8.5, letterSpacing: 0.8, padding: '14px 12px 0', borderRightWidth: index === 3 ? 0 : 1, borderRightColor: 'rgba(239,229,106,.3)' })
      )),
      ...rows.slice(0, 4).map((row, rowIndex) =>
        box({ height: 37, flexDirection: 'row', borderBottomWidth: rowIndex === 3 ? 0 : 1.2, borderBottomColor: 'rgba(31,58,138,.5)' }, row.slice(0, 4).map((cell, index) =>
          index === 0
            ? display(cell, spec, { width: 232, fontSize: 13, lineHeight: 1.05, padding: '11px 12px 0', borderRightWidth: 1.2, borderRightColor: 'rgba(31,58,138,.5)' })
            : handwritten(cell, spec, { width: 192, fontSize: cell === 'material' ? 11 : 16, lineHeight: 1.0, padding: '11px 12px 0', borderRightWidth: index === 3 ? 0 : 1.2, borderRightColor: 'rgba(31,58,138,.5)', color: cell === 'material' ? theme.red : theme.ink })
        ))
      )
    ], { position: 'absolute', left: 64, right: 64, top: 280, height: 188, overflow: 'hidden', padding: 0 }),
    footer(spec, theme, 'matrix')
  ])
}

function stats(spec, theme) {
  const c = variantContent(spec, 'stats')
  const statsItems = array(spec, 'stats', c.stats)
  return page(theme, [
    topBar(spec, theme, 'In numbers', ['Phase III', 'Evidence']),
    box({ position: 'absolute', left: 64, right: 64, top: 100, flexDirection: 'row', justifyContent: 'space-between' }, [
      display(value(spec, 'title', c.title), spec, { width: 500, fontSize: 58, lineHeight: 1.0 }),
      body(value(spec, 'subtitle', c.subtitle), spec, { width: 270, fontSize: 13.5, lineHeight: 1.35, opacity: 0.85, marginTop: 12 })
    ]),
    box({ position: 'absolute', left: 64, right: 64, top: 284, bottom: 74, flexDirection: 'row' }, statsItems.slice(0, 3).map((item, index) =>
      card(theme, spec, [
        pin(theme, { left: 28, top: -14, width: 104, rotate: -8 }),
        box({ flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 }, [
          display(item.value, spec, { fontSize: item.value.length > 3 ? 58 : 82, lineHeight: 0.82, width: 132 }),
          handwritten(item.suffix, spec, { fontSize: 28, marginLeft: 4, marginTop: 6 })
        ]),
        display(item.title, spec, { fontSize: 18, lineHeight: 1.0, marginTop: 'auto', marginBottom: 6 }),
        body(item.body, spec, { fontSize: 10.2, lineHeight: 1.24, width: 218 })
      ], {
        width: 262,
        height: 182,
        padding: '24px 20px 16px',
        marginRight: index === 2 ? 0 : 28,
        backgroundColor: index === 1 ? theme.paper2 : index === 2 ? theme.extra : theme.cream
      })
    )),
    footer(spec, theme, 'stats')
  ])
}

function quote(spec, theme) {
  const c = variantContent(spec, 'quote')
  return page(theme, [
    topBar(spec, theme, 'Client voice', ['Phase III', 'Evidence']),
    card(theme, spec, [
      pin(theme, { left: 86, top: -22, width: 150, rotate: -12 }),
      handwritten('"', spec, { width: 230, fontSize: 180, lineHeight: 0.75, marginTop: -38 }),
      box({ flexDirection: 'column', width: 520 }, [
        display(value(spec, 'quote', c.quote), spec, { fontSize: 34, lineHeight: 1.08, letterSpacing: -0.5, width: 510 }),
        metric(value(spec, 'author', c.author), spec, { marginTop: 24, fontSize: 11, letterSpacing: 1.1 }),
        label(value(spec, 'meta', c.meta), spec, { marginTop: 5, fontSize: 8.5, opacity: 0.7, letterSpacing: 0.9 })
      ])
    ], { position: 'absolute', left: 80, right: 80, top: 126, bottom: 92, padding: '54px 70px', flexDirection: 'row', alignItems: 'center', boxShadow: `8px 9px 0 ${theme.ink}` }),
    footer(spec, theme, 'quote')
  ])
}

function cta(spec, theme) {
  const c = variantContent(spec, 'cta')
  const steps = array(spec, 'steps', c.steps)
  return page(theme, [
    topBar(spec, theme, "What's next", ['North Field Office', 'Phase V']),
    box({ position: 'absolute', left: 64, right: 64, top: 86, bottom: 70, flexDirection: 'row' }, [
      box({ width: 436, backgroundColor: theme.ink, color: theme.paper, padding: 30, borderRadius: 4, position: 'relative' }, [
        label('From here', spec, { position: 'absolute', left: 30, top: 31, color: theme.paper, opacity: 0.85, letterSpacing: 1.8 }),
        display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 30, top: 78, width: 360, color: theme.paper, fontSize: 62, lineHeight: 0.98, letterSpacing: -1.4 }),
        body(value(spec, 'subtitle', c.subtitle), spec, { position: 'absolute', left: 30, bottom: 42, width: 275, color: theme.paper, opacity: 0.9, fontSize: 12.5, lineHeight: 1.35 }),
        pin(theme, { right: 28, bottom: 42, width: 146, rotate: -12, color: theme.paper })
      ]),
      card(theme, spec, [
        display(value(spec, 'right_title', c.right_title), spec, { fontSize: 26, lineHeight: 1.0, marginBottom: 8 }),
        ...steps.slice(0, 3).map((item, index) =>
          box({ flexDirection: 'row', padding: '12px 0', borderTopWidth: index === 0 ? 0 : 1.5, borderTopColor: 'rgba(31,58,138,.45)' }, [
            handwritten(item.n, spec, { width: 54, fontSize: 42, lineHeight: 0.9 }),
            box({ flexDirection: 'column', width: 250 }, [
              display(item.title, spec, { fontSize: 16.5, lineHeight: 1.0, marginBottom: 4 }),
              body(item.body, spec, { fontSize: 10.5, lineHeight: 1.28 })
            ])
          ])
        )
      ], { width: 396, marginLeft: 32, padding: 30, flexDirection: 'column' })
    ]),
    footer(spec, theme, 'cta')
  ])
}

const RENDERERS = {
  cover,
  agenda,
  notes,
  sec,
  notice,
  chart,
  process,
  matrix,
  stats,
  quote,
  cta
}

export function renderAnnotatedFieldBoard(spec) {
  const theme = colors(spec)
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || cover)(spec, theme)
}
