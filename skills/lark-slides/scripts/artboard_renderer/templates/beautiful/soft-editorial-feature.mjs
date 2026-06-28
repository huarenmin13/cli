import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'soft-editorial-feature'

export const PAGE_VARIANTS = [
  'cover',
  'foreword',
  'method',
  'insights',
  'closer',
  'numbers',
  'quote',
  'next',
  'consult',
  'chart',
  'process',
  'matrix'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'soft-editorial',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'soft-editorial',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'foreword', 'closer'],
      repeatable: ['method', 'insights', 'numbers', 'quote', 'next', 'consult', 'chart', 'process', 'matrix']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/soft-editorial-4.png'
}

const C = {
  paper: '#F2EEDF',
  paper2: '#ECE6D2',
  ink: '#2A241B',
  inkSoft: '#5C5345',
  pink: '#E1A4C2',
  lemon: '#D6DD63',
  blush: '#E8C9B6',
  sage: '#B7C7A8',
  lilac: '#C9BEDC',
  card: 'rgba(255,255,255,0.55)',
  rule: 'rgba(42,36,27,0.18)',
  ruleMedium: 'rgba(42,36,27,0.35)'
}

const DEFAULTS = {
  cover: {
    eyebrow: 'Field Notes',
    kicker: 'A research debrief, vol. iii',
    title: 'What we learned\nthis quarter.',
    subtitle: 'A short, honest look at what customers told us between January and March - what works, what broke, and what to try next.'
  },
  foreword: {
    eyebrow: 'Foreword',
    opener: 'We spent eight weeks listening, and what we heard surprised us in the kindest way.',
    paragraphs: [
      'The team ran twenty-eight long-form interviews, shadowed nine teams during their busiest week of the year, and sat with the support inbox for ten unbroken days.',
      'The brief asked about onboarding; the answers we got were about trust. So we followed the thread.',
      'This deck is the short version. Each insight is a door - open the ones that matter to your team this quarter.'
    ],
    signoff: '- The research desk'
  },
  method: {
    eyebrow: 'The Method',
    steps: [
      ['i.', 'Listen', 'Twenty-eight long-form conversations with customers across four segments and three regions.'],
      ['ii.', 'Watch', 'Nine on-site shadowing sessions during peak workflows. We took notes, not video.'],
      ['iii.', 'Read', 'Ten days inside the support inbox, tagging every message by intent and emotional tone.'],
      ['iv.', 'Distill', 'Three rounds of thematic clustering with the design and policy teams.']
    ]
  },
  insights: {
    eyebrow: 'Insights',
    cards: ['Trust is the onboarding', 'Power users dread upgrades', 'Support is product'],
    descriptions: [
      "Customers don't churn on day one because the product is hard. They churn because the first emails feel like a stranger.",
      'The people we asked to love new features the most quietly resent them. They want fewer surprises.',
      'Half of feature requests are existing features customers could not find. Discovery is the roadmap problem.'
    ]
  },
  closer: {
    eyebrow: 'A closer look - 1 of 3',
    marker: 'on insight #1',
    title: 'Trust is the onboarding.',
    body: 'The product can be perfect on day one, but if the welcome email reads like a contract, half of new accounts will never log in twice.'
  },
  numbers: {
    eyebrow: 'By the numbers',
    hero: ['68%', 'of new accounts open the third email, up from 41% last quarter.'],
    stats: [
      ['28', 'long-form customer interviews across four segments.'],
      ['9', 'teams shadowed for their busiest week of the year.']
    ]
  },
  quote: {
    eyebrow: 'In their words',
    quote: 'I did not need a better product. I needed it to behave like it remembered me.',
    name: 'Renee, three-year customer',
    role: 'Studio of seven, Lisbon'
  },
  next: {
    eyebrow: "What's Next",
    title: "What we'll do next",
    subtitle: 'Three small moves, before the next debrief.',
    items: [
      ['i.', 'Rewrite the first three emails', 'From templated to written. Owner: lifecycle. By: May 17.'],
      ['ii.', 'Quiet upgrades by default', 'Opt-in for power users; soft rollout for everyone else. By: June 1.'],
      ['iii.', 'Make the inbox a search bar', 'Surface in-product help when requests match an existing feature.']
    ]
  },
  consult: {
    eyebrow: 'Findings - Detail',
    action: 'The trust gap is built in the first 72 hours.',
    columns: [
      ['What we found', 'Three behavioral signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.'],
      ['Why it matters', '$4.1M in projected retained ARR, on the current cohort alone.'],
      ['What to do', 'Rewrite the first three lifecycle emails and measure reply rate, second-open rate, and D90 retention.']
    ],
    source: 'Source: 14,200 cohorted accounts, Jan-Mar 2026.'
  },
  chart: {
    eyebrow: 'Retention Curve',
    title: 'Retention, by cohort',
    subtitle: 'The curve bends around day three.',
    series: ['Templated welcome', 'Written welcome', 'Written + human reply']
  },
  process: {
    eyebrow: 'Process',
    title: "How we'll work",
    subtitle: 'From insight to shipped change.',
    steps: [
      ['i.', 'Frame', 'Translate the insight into a single behavioural hypothesis.'],
      ['ii.', 'Design', 'Sketch the smallest end-to-end change.'],
      ['iii.', 'Pilot', 'Ship to a 50/50 holdout in a single segment.'],
      ['iv.', 'Read', 'Review the cohort against pre-registered metrics.'],
      ['v.', 'Default', 'Graduate the change to the default surface.']
    ],
    timeline: ['Week 1', 'Weeks 2-3', 'Weeks 3-6', 'Week 7', 'Week 8']
  },
  matrix: {
    eyebrow: 'Comparison',
    title: 'The three pilots, side by side',
    subtitle: 'Where each pilot earns its keep.',
    headers: ['Lever', 'Rewrite welcome', 'Quiet upgrades', 'Inbox-as-search'],
    rows: [
      ['Time-to-impact', '<= 4 weeks', '6-8 weeks', '<= 4 weeks'],
      ['Build cost', 'Low', 'Medium', 'Low'],
      ['Retention lift', '+19 pts D90', '+7 pts D90', '+5 pts D90'],
      ['Risk', 'None', 'Material', 'Soft, reversible']
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
  if (raw.includes('cover')) return 'cover'
  if (raw.includes('agenda') || raw.includes('foreword')) return 'foreword'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('process') || raw.includes('timeline')) return 'process'
  if (raw.includes('comparison') || raw.includes('matrix')) return 'matrix'
  if (raw.includes('closing')) return 'closer'
  return 'insights'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.insights), ...(spec.content || {}) }
}

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function array(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function serif(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.ink,
    fontSize: 42,
    lineHeight: 1.02,
    ...fontRole('display', spec, { fontWeight: 500, textTransform: 'none' }),
    ...style
  })
}

function display(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: C.ink,
    fontSize: 88,
    lineHeight: 0.96,
    whiteSpace: 'pre-wrap',
    ...fontRole('display', spec, { fontWeight: 500, lineHeight: 0.96, letterSpacing: -0.8, textTransform: 'none' }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.inkSoft,
    fontSize: 14,
    lineHeight: 1.48,
    ...fontRole('body', spec, { fontWeight: 400 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.ink,
    fontSize: 14,
    lineHeight: 1.1,
    ...fontRole('label', spec, { fontWeight: 400, textTransform: 'none' }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.ink,
    fontSize: 58,
    lineHeight: 0.86,
    fontStyle: 'italic',
    ...fontRole('metric', spec, { fontWeight: 500, fontStyle: 'italic', lineHeight: 0.86, textTransform: 'none' }),
    ...style
  })
}

function page(spec, pageNo, children, { eyebrow = 'Field Notes', bg = C.paper, footerColor = C.inkSoft, swatches = false } = {}) {
  return box({ width: 960, height: 540, position: 'relative', overflow: 'hidden', backgroundColor: bg }, [
    label(eyebrow, spec, { position: 'absolute', left: 40, top: 34, fontSize: 15, color: C.ink }),
    swatches
      ? box({ position: 'absolute', right: 40, top: 40, flexDirection: 'row', gap: 10 }, [C.pink, C.lemon, C.blush].map((color) =>
          box({ width: 28, height: 28, borderRadius: 14, backgroundColor: color }, [])
        ))
      : serif(roman(pageNo), spec, { position: 'absolute', right: 40, top: 31, width: 70, textAlign: 'right', fontSize: 14, fontStyle: 'italic', color: footerColor }),
    ...children,
    serif('April 29, 2026', spec, { position: 'absolute', left: 40, bottom: 28, fontSize: 15, fontStyle: 'italic', color: footerColor }),
    serif('Field Notes - Vol. III', spec, { position: 'absolute', right: 40, bottom: 28, width: 180, textAlign: 'right', fontSize: 15, fontStyle: 'italic', color: footerColor })
  ])
}

function roman(n) {
  return ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][Math.max(0, Math.min(11, n - 1))]
}

function softCard(style = {}, children = []) {
  return box({ backgroundColor: C.card, borderRadius: 18, ...style }, children)
}

function pastelCard(color, style = {}, children = []) {
  return box({ backgroundColor: color, borderRadius: 18, ...style }, children)
}

function renderCover(spec) {
  const c = content(spec, 'cover')
  return page(spec, 1, [
    serif(text(c.kicker, DEFAULTS.cover.kicker), spec, { position: 'absolute', left: 40, top: 108, fontSize: 20, fontStyle: 'italic', color: C.inkSoft }),
    display(text(c.title, DEFAULTS.cover.title), spec, { position: 'absolute', left: 40, top: 150, width: 770, fontSize: 78, lineHeight: 0.95 }),
    body(text(c.subtitle, DEFAULTS.cover.subtitle), spec, { position: 'absolute', left: 42, top: 398, width: 570, fontSize: 16, lineHeight: 1.45, color: C.inkSoft })
  ], { eyebrow: text(c.eyebrow, DEFAULTS.cover.eyebrow), swatches: true })
}

function renderForeword(spec) {
  const c = content(spec, 'foreword')
  const paragraphs = array(c.paragraphs, DEFAULTS.foreword.paragraphs)
  return page(spec, 2, [
    box({ position: 'absolute', left: 56, top: 112, width: 372, flexDirection: 'column' }, [
      serif(text(c.opener, DEFAULTS.foreword.opener), spec, { fontSize: 35, lineHeight: 1.13, fontStyle: 'italic' }),
      serif(text(c.signoff, DEFAULTS.foreword.signoff), spec, { marginTop: 34, fontSize: 20, fontStyle: 'italic', color: C.inkSoft })
    ]),
    softCard({ position: 'absolute', right: 56, top: 104, width: 410, height: 330, padding: '30px 34px', flexDirection: 'column', gap: 18 },
      paragraphs.slice(0, 3).map((item, index) => body(item, spec, { color: index === 0 ? C.ink : C.inkSoft, fontSize: 14.4, lineHeight: 1.55 }))
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.foreword.eyebrow) })
}

function renderMethod(spec) {
  const c = content(spec, 'method')
  const steps = array(c.steps, DEFAULTS.method.steps)
  const colors = [C.pink, C.lemon, C.blush, C.sage]
  return page(spec, 3, [
    box({ position: 'absolute', left: 56, top: 100, width: 848, flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
      steps.slice(0, 4).map((step, index) =>
        pastelCard(colors[index], { width: 415, height: 152, padding: '24px 28px', flexDirection: 'column' }, [
          serif(step[0], spec, { fontSize: 48, fontStyle: 'italic', lineHeight: 0.9 }),
          serif(step[1], spec, { fontSize: 25, marginTop: 8 }),
          body(step[2], spec, { fontSize: 12.8, lineHeight: 1.35, marginTop: 8, color: C.inkSoft })
        ])
      )
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.method.eyebrow) })
}

function renderInsights(spec) {
  const c = content(spec, 'insights')
  const cards = array(c.cards, DEFAULTS.insights.cards)
  const descriptions = array(c.descriptions, DEFAULTS.insights.descriptions)
  const colors = [C.pink, C.lemon, C.blush]
  return page(spec, 4, [
    box({ position: 'absolute', left: 40, top: 100, width: 880, flexDirection: 'row', gap: 18 },
      cards.slice(0, 3).map((item, index) =>
        pastelCard(colors[index], { width: 281, height: 340, padding: '34px 32px', alignItems: 'center', flexDirection: 'column' }, [
          serif(`Insight #${index + 1}`, spec, { fontSize: 35, textAlign: 'center' }),
          body(item, spec, { marginTop: 14, fontSize: 15.5, fontWeight: 700, color: C.ink, textAlign: 'center', lineHeight: 1.2 }),
          body(descriptions[index], spec, { marginTop: 20, fontSize: 12.7, lineHeight: 1.42, textAlign: 'center', color: C.inkSoft })
        ])
      )
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.insights.eyebrow) })
}

function renderCloser(spec) {
  const c = content(spec, 'closer')
  return page(spec, 5, [
    box({ position: 'absolute', left: 148, top: 136, width: 664, alignItems: 'center', flexDirection: 'column' }, [
      serif(text(c.marker, DEFAULTS.closer.marker), spec, { fontSize: 23, fontStyle: 'italic' }),
      display(text(c.title, DEFAULTS.closer.title), spec, { marginTop: 16, width: 620, fontSize: 71, textAlign: 'center', lineHeight: 0.95 }),
      body(text(c.body, DEFAULTS.closer.body), spec, { marginTop: 24, width: 520, textAlign: 'center', fontSize: 16, lineHeight: 1.45, color: C.ink })
    ])
  ], { eyebrow: text(c.eyebrow, DEFAULTS.closer.eyebrow), bg: C.pink, footerColor: 'rgba(42,36,27,.72)' })
}

function renderNumbers(spec) {
  const c = content(spec, 'numbers')
  const hero = array(c.hero, DEFAULTS.numbers.hero)
  const stats = array(c.stats, DEFAULTS.numbers.stats)
  return page(spec, 6, [
    pastelCard(C.lemon, { position: 'absolute', left: 56, top: 112, width: 520, height: 292, padding: '28px 34px', flexDirection: 'column' }, [
      metric(hero[0], spec, { fontSize: 112, lineHeight: 0.82 }),
      body(hero[1], spec, { marginTop: 18, width: 390, fontSize: 16, lineHeight: 1.38, color: C.ink })
    ]),
    ...stats.slice(0, 2).map((item, index) =>
      pastelCard(index === 0 ? C.pink : C.blush, { position: 'absolute', right: 56, top: 112 + index * 154, width: 286, height: 138, padding: '24px 28px', flexDirection: 'column' }, [
        metric(item[0], spec, { fontSize: 58, lineHeight: 0.82 }),
        body(item[1], spec, { marginTop: 12, fontSize: 13.5, color: C.inkSoft })
      ])
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.numbers.eyebrow) })
}

function renderQuote(spec) {
  const c = content(spec, 'quote')
  return page(spec, 7, [
    serif('"', spec, { position: 'absolute', left: 444, top: 104, fontSize: 112, color: C.blush, fontStyle: 'italic', lineHeight: 0.7 }),
    serif(text(c.quote, DEFAULTS.quote.quote), spec, { position: 'absolute', left: 170, top: 178, width: 620, textAlign: 'center', fontSize: 44, lineHeight: 1.12 }),
    body(text(c.name, DEFAULTS.quote.name), spec, { position: 'absolute', left: 320, top: 382, width: 320, textAlign: 'center', color: C.ink, fontSize: 14.5, fontWeight: 600 }),
    body(text(c.role, DEFAULTS.quote.role), spec, { position: 'absolute', left: 320, top: 408, width: 320, textAlign: 'center', fontSize: 13.2 })
  ], { eyebrow: text(c.eyebrow, DEFAULTS.quote.eyebrow) })
}

function renderNext(spec) {
  const c = content(spec, 'next')
  const items = array(c.items, DEFAULTS.next.items)
  return page(spec, 8, [
    softCard({ position: 'absolute', left: 48, top: 104, width: 360, height: 322, padding: '30px 32px', flexDirection: 'column' }, [
      display(text(c.title, DEFAULTS.next.title), spec, { fontSize: 52, lineHeight: 0.98 }),
      body(text(c.subtitle, DEFAULTS.next.subtitle), spec, { marginTop: 22, fontSize: 15.5, color: C.inkSoft })
    ]),
    box({ position: 'absolute', right: 56, top: 104, width: 462, flexDirection: 'column', gap: 14 },
      items.slice(0, 3).map((item, index) =>
        pastelCard([C.pink, C.lemon, C.blush][index], { height: 98, padding: '18px 22px', flexDirection: 'row', alignItems: 'flex-start' }, [
          serif(item[0], spec, { width: 42, fontSize: 34, fontStyle: 'italic' }),
          box({ flex: 1, flexDirection: 'column' }, [
            serif(item[1], spec, { fontSize: 23, lineHeight: 1.05 }),
            body(item[2], spec, { marginTop: 7, fontSize: 12.4, lineHeight: 1.32 })
          ])
        ])
      )
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.next.eyebrow) })
}

function renderConsult(spec) {
  const c = content(spec, 'consult')
  const columns = array(c.columns, DEFAULTS.consult.columns)
  return page(spec, 9, [
    pastelCard(C.lemon, { position: 'absolute', left: 56, top: 88, width: 848, height: 84, padding: '20px 28px', justifyContent: 'center' }, [
      serif(text(c.action, DEFAULTS.consult.action), spec, { fontSize: 32, lineHeight: 1.05 })
    ]),
    box({ position: 'absolute', left: 56, top: 204, width: 848, flexDirection: 'row', gap: 16 },
      columns.slice(0, 3).map((col) =>
        softCard({ width: 272, height: 190, padding: '22px 22px', flexDirection: 'column' }, [
          serif(col[0], spec, { fontSize: 26 }),
          body(col[1], spec, { marginTop: 14, fontSize: 12.8, lineHeight: 1.42 })
        ])
      )
    ),
    serif(text(c.source, DEFAULTS.consult.source), spec, { position: 'absolute', left: 56, top: 420, width: 520, paddingTop: 12, borderTop: `1px dashed ${C.ruleMedium}`, fontSize: 16, color: C.inkSoft, fontStyle: 'italic' })
  ], { eyebrow: text(c.eyebrow, DEFAULTS.consult.eyebrow) })
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const series = array(c.series, DEFAULTS.chart.series)
  return page(spec, 10, [
    box({ position: 'absolute', left: 56, top: 112, width: 360, flexDirection: 'column' }, [
      display(text(c.title, DEFAULTS.chart.title), spec, { fontSize: 48, lineHeight: 1.02 }),
      body(text(c.subtitle, DEFAULTS.chart.subtitle), spec, { marginTop: 24, fontSize: 15.5, lineHeight: 1.45 }),
      box({ marginTop: 30, flexDirection: 'column', gap: 10 }, series.map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'center' }, [
          box({ width: 28, height: 8, borderRadius: 4, backgroundColor: [C.pink, C.lemon, C.sage][index] }, []),
          body(item, spec, { marginLeft: 12, fontSize: 12.5, color: C.inkSoft })
        ])
      ))
    ]),
    softCard({ position: 'absolute', right: 56, top: 106, width: 430, height: 316, padding: '24px 28px' }, [
      box({ position: 'absolute', left: 44, top: 52, width: 1, height: 210, backgroundColor: C.ruleMedium }, []),
      box({ position: 'absolute', left: 44, top: 262, width: 326, height: 1, backgroundColor: C.ruleMedium }, []),
      ...[0, 1, 2, 3].map((i) => box({ position: 'absolute', left: 44, top: 72 + i * 54, width: 326, height: 1, backgroundColor: C.rule }, [])),
      ...[C.pink, C.lemon, C.sage].map((color, i) =>
        box({ position: 'absolute', left: 72 + i * 72, top: 212 - i * 38, width: 142, height: 3, backgroundColor: color, transform: `rotate(${-10 + i * 4}deg)` }, [])
      ),
      label('% of cohort active, by day', spec, { position: 'absolute', left: 44, top: 24, fontSize: 12, color: C.inkSoft })
    ])
  ], { eyebrow: text(c.eyebrow, DEFAULTS.chart.eyebrow) })
}

function renderProcess(spec) {
  const c = content(spec, 'process')
  const steps = array(c.steps, DEFAULTS.process.steps)
  const timeline = array(c.timeline, DEFAULTS.process.timeline)
  return page(spec, 11, [
    box({ position: 'absolute', left: 56, top: 88, width: 848, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, [
      display(text(c.title, DEFAULTS.process.title), spec, { width: 360, fontSize: 52 }),
      body(text(c.subtitle, DEFAULTS.process.subtitle), spec, { width: 300, fontSize: 15.5, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 56, top: 190, width: 848, flexDirection: 'row', gap: 10 },
      steps.slice(0, 5).map((step, index) =>
        pastelCard([C.pink, C.blush, C.lemon, C.sage, C.lilac][index], { width: 161, height: 174, padding: '18px 16px', flexDirection: 'column' }, [
          serif(step[0], spec, { fontSize: 38, fontStyle: 'italic' }),
          serif(step[1], spec, { marginTop: 8, fontSize: 22 }),
          body(step[2], spec, { marginTop: 8, fontSize: 11.5, lineHeight: 1.28 }),
          index < 4 ? serif('→', spec, { position: 'absolute', right: -8, top: 74, fontSize: 18, color: C.inkSoft }) : null
        ].filter(Boolean))
      )
    ),
    box({ position: 'absolute', left: 56, top: 396, width: 848, height: 34, borderRadius: 17, backgroundColor: C.card, flexDirection: 'row' },
      timeline.slice(0, 5).map((item) => body(item, spec, { flex: 1, textAlign: 'center', fontSize: 12, color: C.inkSoft, lineHeight: 2.7 }))
    )
  ], { eyebrow: text(c.eyebrow, DEFAULTS.process.eyebrow) })
}

function renderMatrix(spec) {
  const c = content(spec, 'matrix')
  const headers = array(c.headers, DEFAULTS.matrix.headers)
  const rows = array(c.rows, DEFAULTS.matrix.rows)
  return page(spec, 12, [
    box({ position: 'absolute', left: 56, top: 86, width: 848, flexDirection: 'row', justifyContent: 'space-between' }, [
      display(text(c.title, DEFAULTS.matrix.title), spec, { width: 430, fontSize: 43, lineHeight: 1.02 }),
      body(text(c.subtitle, DEFAULTS.matrix.subtitle), spec, { width: 280, fontSize: 15.5, textAlign: 'right' })
    ]),
    softCard({ position: 'absolute', left: 56, top: 206, width: 848, height: 230, padding: '18px 18px', flexDirection: 'column' }, [
      box({ flexDirection: 'row', borderBottom: `1px solid ${C.ruleMedium}` }, headers.slice(0, 4).map((item, index) =>
        body(item, spec, { width: index === 0 ? 170 : 210, fontSize: 12.5, fontWeight: 700, color: C.ink, paddingBottom: 10 })
      )),
      ...rows.slice(0, 4).map((row) =>
        box({ flexDirection: 'row', borderBottom: `1px dashed ${C.rule}`, minHeight: 42, alignItems: 'center' }, row.slice(0, 4).map((item, index) =>
          body(item, spec, { width: index === 0 ? 170 : 210, fontSize: 12.2, color: index === 0 ? C.ink : C.inkSoft })
        ))
      )
    ])
  ], { eyebrow: text(c.eyebrow, DEFAULTS.matrix.eyebrow) })
}

const RENDERERS = {
  cover: renderCover,
  foreword: renderForeword,
  method: renderMethod,
  insights: renderInsights,
  closer: renderCloser,
  numbers: renderNumbers,
  quote: renderQuote,
  next: renderNext,
  consult: renderConsult,
  chart: renderChart,
  process: renderProcess,
  matrix: renderMatrix
}

export function renderSoftEditorialFeature(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderInsights)(spec)
}
