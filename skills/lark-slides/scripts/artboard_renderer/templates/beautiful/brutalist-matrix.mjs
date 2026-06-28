import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'brutalist-matrix'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'split', 'bars', 'cards', 'feature', 'process', 'donut', 'quote', 'table', 'closing']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'raw-grid',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'raw-grid',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'split', 'cards', 'feature', 'quote', 'table', 'closing'],
      repeatable: ['bars', 'process', 'donut']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/raw-grid-1.png'
}

const DEFAULTS = {
  cover: {
    mark: 'RG',
    brand: 'RAW GRID',
    title: 'Cities.\nStartups.',
    cta: 'Discover All Startups',
    cities: ['San Francisco', 'New York', 'Cupertino', 'Menlo Park', 'Santa Clara', 'Mountain View', 'Sunnyvale']
  },
  split: {
    eyebrow: 'About The Platform',
    title: 'Connecting Founders\nWith Opportunity',
    body: 'A centralized ecosystem designed to bridge emerging ventures and the resources they need to scale across global markets.',
    stats: [
      { value: '250+', label: 'Active Startups', body: 'Ventures currently enrolled and scaling through our network.' },
      { value: '14', label: 'Cities Covered', body: 'Metropolitan tech hubs across North America and Europe.' }
    ]
  },
  bars: {
    title: 'Quarterly Growth Metrics',
    label: 'Fiscal Year 2026',
    chart_title: 'Revenue by Quarter ($M)',
    bars: [
      { label: 'Q1', value: '$4.5M', width: 45, fill: 'pink' },
      { label: 'Q2', value: '$6.2M', width: 62, fill: 'green' },
      { label: 'Q3', value: '$7.8M', width: 78, fill: 'black' },
      { label: 'Q4', value: '$9.1M', width: 91, fill: 'pink' }
    ],
    stats: [
      { value: '+47%', label: 'Year over Year Growth' },
      { value: '$27.6M', label: 'Total Annual Revenue', fill: 'green' },
      { value: '12.4K', label: 'New User Signups', fill: 'pink' }
    ]
  },
  cards: {
    title: 'Core Services',
    label: 'What We Provide',
    cards: [
      { num: '01', icon: 'I', title: 'Venture Funding', body: 'Direct access to seed and series funding through our curated investor network.' },
      { num: '02', icon: 'II', title: 'Mentorship', body: 'One-on-one guidance from industry veterans who have built and exited companies.', fill: 'green' },
      { num: '03', icon: 'III', title: 'Workspace', body: 'Flexible office arrangements in prime locations across all partner cities.', fill: 'pink' },
      { num: '04', icon: 'IV', title: 'Community', body: 'A tight-knit network of founders sharing resources, referrals, and support.', fill: 'gray' }
    ]
  },
  feature: {
    badge: 'Featured',
    title: 'The Founders Lab',
    body: 'An intensive twelve-week program designed to transform early-stage concepts into market-ready products with validated traction.',
    note: 'Cohorts launch every quarter with workspace, engineering support, and an investor demo-day pipeline.',
    image_label: '[ Image Placeholder ]'
  },
  process: {
    title: 'Application Process',
    steps: [
      { num: '01', title: 'Submit', body: 'Complete the online application with your pitch deck and team overview.' },
      { num: '02', title: 'Review', body: 'Our committee evaluates fit, market potential, and team capability.' },
      { num: '03', title: 'Interview', body: 'Shortlisted teams present to partners and alumni founders.', fill: 'green' },
      { num: '04', title: 'Onboard', body: 'Accepted ventures join the next cohort with full resource access.', fill: 'pink' }
    ]
  },
  donut: {
    value: '63%',
    label: 'Market Share',
    legends: ['Enterprise', 'Consumer', 'Non-Profit'],
    metrics: [
      { value: '89%', title: 'Retention Rate', body: 'Founders who renew after year one' },
      { value: '3.2x', title: 'Average ROI', body: 'Return on capital invested', fill: 'green' },
      { value: '156', title: 'Jobs Created', body: 'Net new positions this quarter' },
      { value: '$42M', title: 'Capital Deployed', body: 'Total funding distributed to date', fill: 'pink' }
    ]
  },
  quote: {
    title: 'Founder Credo',
    quote: "We don't incubate ideas. We accelerate the people bold enough to build them.",
    stats: [
      { value: '98%', label: 'Satisfaction' },
      { value: '4.9', label: 'Avg Rating', fill: 'pink' },
      { value: '500+', label: 'Alumni', fill: 'gray' },
      { value: '$1B+', label: 'Valuation', fill: 'black' }
    ]
  },
  table: {
    title: 'Plan Comparison',
    label: 'Pricing Tiers',
    headers: ['Feature', 'Starter', 'Professional', 'Enterprise'],
    rows: [
      ['Workspace Access', 'Shared Desk', 'Dedicated Desk', 'Private Office'],
      ['Mentor Hours', '2 / Month', '8 / Month', 'Unlimited'],
      ['Investor Intros', 'Quarterly', 'Monthly', 'Weekly'],
      ['Legal Support', 'Templates', 'Guided', 'Full Service'],
      ['Event Access', 'Online', 'In-Person', 'VIP'],
      ['Response', '48 Hours', '24 Hours', '4 Hours']
    ]
  },
  closing: {
    title: "Let's\nBuild.",
    body: 'Ready to take your venture to the next level? Join the Raw Grid community and start scaling today.',
    cta: 'Get Started Now',
    contact_title: 'Get In Touch',
    contacts: ['Email: hello@rawgrid.studio', 'Phone: +1 (555) 000-0000', 'Location: 123 Innovation Drive', 'Hours: Monday - Friday, 9:00 - 18:00'],
    socials: ['Instagram', 'LinkedIn']
  }
}

function theme() {
  return {
    black: '#0A0A0A',
    white: '#FFFFFF',
    pink: '#F2D4CF',
    green: '#E5EDD6',
    gray: '#F5F5F5',
    darkgray: '#333333'
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
  if (raw.includes('agenda') || raw.includes('card')) return 'cards'
  if (raw.includes('bar') || raw.includes('chart') || raw.includes('data')) return 'bars'
  if (raw.includes('feature') || raw.includes('detail')) return 'feature'
  if (raw.includes('process') || raw.includes('timeline')) return 'process'
  if (raw.includes('donut') || raw.includes('metric')) return 'donut'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('table') || raw.includes('comparison')) return 'table'
  if (raw.includes('closing') || raw.includes('close') || raw.includes('cta')) return 'closing'
  if (raw.includes('split') || raw.includes('about')) return 'split'
  return 'cover'
}

function fillColor(fill) {
  const t = theme()
  if (fill === 'pink') return t.pink
  if (fill === 'green') return t.green
  if (fill === 'gray') return t.gray
  if (fill === 'black') return t.black
  return t.white
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    color: theme().black,
    fontSize: 54,
    fontWeight: 900,
    lineHeight: 1.04,
    letterSpacing: -0.8,
    whiteSpace: 'pre-line',
    ...role('display', spec, { fontWeight: 900, lineHeight: 1.04, letterSpacing: -0.8, textTransform: 'uppercase' }),
    ...style
  })
}

function headline(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    color: theme().black,
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: -0.4,
    whiteSpace: 'pre-line',
    ...role('display', spec, { fontWeight: 900, lineHeight: 1.08, letterSpacing: -0.4, textTransform: 'uppercase' }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: theme().black,
    fontSize: 58,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -1.2,
    ...role('metric', spec, { fontWeight: 900, lineHeight: 1, letterSpacing: -1.2 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: theme().black,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.45,
    ...role('body', spec, { fontWeight: 500, lineHeight: 1.45 }),
    ...style
  })
}

function caption(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: theme().black,
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 800, lineHeight: 1.1, letterSpacing: 1.0, textTransform: 'uppercase' }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(`-> ${String(value || '').toUpperCase()}`, {
    color: theme().black,
    backgroundColor: theme().white,
    borderWidth: 3,
    borderColor: theme().black,
    padding: '6px 12px',
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 800, lineHeight: 1, letterSpacing: 0.9, textTransform: 'uppercase' }),
    ...style
  })
}

function surface(children = []) {
  return box(
    { width: CANVAS.width, height: CANVAS.height, position: 'relative', overflow: 'hidden', backgroundColor: theme().white, color: theme().black },
    children
  )
}

function borderBox(style = {}, children = []) {
  return box({ borderWidth: 3, borderColor: theme().black, backgroundColor: theme().white, ...style }, children)
}

function shadowBox(style = {}, children = []) {
  const t = theme()
  return box({ position: 'relative', ...style }, [
    box({ position: 'absolute', left: 6, top: 6, right: -6, bottom: -6, backgroundColor: t.black }),
    borderBox({ position: 'relative', width: '100%', height: '100%', ...style, left: undefined, top: undefined, right: undefined, bottom: undefined }, children)
  ])
}

function renderCover(spec) {
  const t = theme()
  const c = content(spec, 'cover')
  const cities = Array.isArray(c.cities) ? c.cities.slice(0, 7) : DEFAULTS.cover.cities
  return surface([
    box({ position: 'absolute', left: 0, top: 0, width: 480, height: 540, backgroundColor: t.pink, borderRightWidth: 3, borderColor: t.black, padding: 48, flexDirection: 'column', justifyContent: 'space-between' }, [
      box({ flexDirection: 'row', alignItems: 'center', gap: 12 }, [
        borderBox({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, [
          caption(c.mark || 'RG', spec, { fontSize: 16, letterSpacing: 0, lineHeight: 1 })
        ]),
        caption(c.brand || 'RAW GRID', spec, { fontSize: 18, letterSpacing: -0.2 })
      ]),
      display(c.title, spec, { fontSize: 58, width: 365, lineHeight: 1.02 }),
      label(c.cta, spec, { alignSelf: 'flex-start' })
    ]),
    box({ position: 'absolute', left: 480, top: 0, width: 480, height: 540, flexDirection: 'column' }, cities.map((item, idx) =>
      box({ height: 77.2, borderBottomWidth: idx === cities.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: idx === 2 ? t.green : t.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 46, gap: 12 }, [
        metric('->', spec, { fontSize: 20, width: 30, letterSpacing: 0 }),
        caption(item, spec, { fontSize: 21, letterSpacing: 0.4 })
      ])
    ))
  ])
}

function renderSplit(spec) {
  const t = theme()
  const c = content(spec, 'split')
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 2) : DEFAULTS.split.stats
  return surface([
    box({ position: 'absolute', left: 0, top: 0, width: 432, height: 540, borderRightWidth: 3, borderColor: t.black, padding: 58, flexDirection: 'column', justifyContent: 'center' }, [
      box({ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 38 }, [
        box({ width: 60, height: 4, backgroundColor: t.black }),
        caption(c.eyebrow, spec)
      ]),
      headline(c.title, spec, { fontSize: 43, width: 320, marginBottom: 24 }),
      body(c.body, spec, { width: 330, fontSize: 15, lineHeight: 1.55 })
    ]),
    box({ position: 'absolute', left: 432, top: 0, width: 528, height: 540, flexDirection: 'column' }, stats.map((item, idx) =>
      box({ flex: 1, borderBottomWidth: idx === 0 ? 3 : 0, borderColor: t.black, backgroundColor: idx === 1 ? t.green : t.white, padding: 58, justifyContent: 'center', flexDirection: 'column' }, [
        metric(item.value, spec, { fontSize: 86, marginBottom: 12 }),
        caption(item.label, spec, { fontSize: 18, letterSpacing: 0.8, marginBottom: 12 }),
        body(item.body, spec, { width: 360, opacity: 0.72, fontSize: 14 })
      ])
    ))
  ])
}

function renderBars(spec) {
  const t = theme()
  const c = content(spec, 'bars')
  const bars = Array.isArray(c.bars) ? c.bars.slice(0, 4) : DEFAULTS.bars.bars
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 3) : DEFAULTS.bars.stats
  return surface([
    box({ position: 'absolute', left: 0, top: 0, right: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: '24px 54px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
      caption(c.title, spec, { fontSize: 26, letterSpacing: 0.4 }),
      label(c.label, spec, { padding: '7px 14px' })
    ]),
    box({ position: 'absolute', left: 0, top: 86, width: 480, bottom: 0, borderRightWidth: 3, borderColor: t.black, padding: 48, flexDirection: 'column', justifyContent: 'center' }, [
      caption(c.chart_title, spec, { fontSize: 18, marginBottom: 26 }),
      ...bars.map((item) =>
        box({ marginBottom: 18, flexDirection: 'column' }, [
          caption(item.label, spec, { fontSize: 10, marginBottom: 7 }),
          borderBox({ width: 360, height: 32, backgroundColor: t.white }, [
            box({ width: Math.max(28, Math.round((item.width || 0) * 3.6)), height: 26, backgroundColor: fillColor(item.fill), alignItems: 'center', justifyContent: 'center' }, [
              caption(item.value, spec, { color: item.fill === 'black' ? t.white : t.black, fontSize: 10, letterSpacing: 0 })
            ])
          ])
        ])
      )
    ]),
    box({ position: 'absolute', left: 480, top: 86, right: 0, bottom: 0, padding: 48, flexDirection: 'column', justifyContent: 'center', gap: 28 }, stats.map((item) =>
      borderBox({ height: 108, backgroundColor: fillColor(item.fill), padding: 22, flexDirection: 'column', justifyContent: 'center' }, [
        metric(item.value, spec, { fontSize: 48, color: item.fill === 'black' ? t.white : t.black, marginBottom: 8 }),
        caption(item.label, spec, { color: item.fill === 'black' ? t.white : t.black, fontSize: 11 })
      ])
    ))
  ])
}

function renderCards(spec) {
  const t = theme()
  const c = content(spec, 'cards')
  const cards = Array.isArray(c.cards) ? c.cards.slice(0, 4) : DEFAULTS.cards.cards
  return surface([
    box({ position: 'absolute', left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: '24px 54px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
      caption(c.title, spec, { fontSize: 26 }),
      caption(c.label, spec)
    ]),
    box({ position: 'absolute', left: 0, top: 86, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' }, cards.map((card, idx) =>
      box({ width: 480, height: 227, borderRightWidth: idx % 2 === 0 ? 3 : 0, borderBottomWidth: idx < 2 ? 3 : 0, borderColor: t.black, backgroundColor: fillColor(card.fill), padding: 46, flexDirection: 'column', justifyContent: 'space-between' }, [
        box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, [
          metric(card.num, spec, { opacity: 0.35, fontSize: 62 }),
          borderBox({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, [
            caption(card.icon, spec, { fontSize: 16, letterSpacing: 0 })
          ])
        ]),
        box({ flexDirection: 'column' }, [
          caption(card.title, spec, { fontSize: 18, marginBottom: 10 }),
          body(card.body, spec, { fontSize: 14, lineHeight: 1.45, width: 350 })
        ])
      ])
    ))
  ])
}

function renderFeature(spec) {
  const t = theme()
  const c = content(spec, 'feature')
  return surface([
    box({ position: 'absolute', left: 0, top: 0, width: 528, height: 540, backgroundColor: t.black, alignItems: 'center', justifyContent: 'center' }, [
      borderBox({ width: 384, height: 300, borderColor: t.white, backgroundColor: t.black, alignItems: 'center', justifyContent: 'center' }, [
        caption(c.image_label, spec, { color: t.white, fontSize: 13, letterSpacing: 1.2, opacity: 0.7 })
      ])
    ]),
    box({ position: 'absolute', left: 528, top: 0, width: 432, height: 540, padding: 58, flexDirection: 'column', justifyContent: 'center' }, [
      label(c.badge, spec, { alignSelf: 'flex-start', marginBottom: 34 }),
      headline(c.title, spec, { fontSize: 43, marginBottom: 22 }),
      body(c.body, spec, { fontSize: 15, lineHeight: 1.5, marginBottom: 20 }),
      body(c.note, spec, { fontSize: 14, lineHeight: 1.45, opacity: 0.72, marginBottom: 30 }),
      box({ width: 60, height: 4, backgroundColor: t.black })
    ])
  ])
}

function renderProcess(spec) {
  const t = theme()
  const c = content(spec, 'process')
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 4) : DEFAULTS.process.steps
  return surface([
    box({ position: 'absolute', left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: '24px 54px', justifyContent: 'center' }, [
      caption(c.title, spec, { fontSize: 26 })
    ]),
    box({ position: 'absolute', left: 54, right: 54, top: 86, bottom: 0, flexDirection: 'row' }, steps.map((step, idx) =>
      box({ flex: 1, borderLeftWidth: idx === 0 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(step.fill), padding: '54px 28px', flexDirection: 'column', position: 'relative' }, [
        metric(step.num, spec, { fontSize: 74, opacity: 0.22, marginBottom: 32 }),
        idx < steps.length - 1 ? box({ position: 'absolute', right: -18, top: 58, width: 32, height: 32, borderWidth: 3, borderColor: t.black, backgroundColor: t.black, alignItems: 'center', justifyContent: 'center', zIndex: 5 }, [
          caption('->', spec, { color: t.white, letterSpacing: 0 })
        ]) : null,
        caption(step.title, spec, { fontSize: 18, marginBottom: 12 }),
        body(step.body, spec, { fontSize: 13, lineHeight: 1.42 })
      ].filter(Boolean))
    ))
  ])
}

function renderDonut(spec) {
  const t = theme()
  const c = content(spec, 'donut')
  const metrics = Array.isArray(c.metrics) ? c.metrics.slice(0, 4) : DEFAULTS.donut.metrics
  return surface([
    box({ position: 'absolute', left: 0, top: 0, width: 480, height: 540, borderRightWidth: 3, borderColor: t.black, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
      box({ width: 246, height: 246, borderRadius: 123, borderWidth: 26, borderColor: t.black, alignItems: 'center', justifyContent: 'center', marginBottom: 34 }, [
        box({ width: 142, height: 142, borderRadius: 71, backgroundColor: t.white, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
          metric(c.value, spec, { fontSize: 48, textAlign: 'center' }),
          caption(c.label, spec, { textAlign: 'center', fontSize: 10 })
        ])
      ]),
      box({ flexDirection: 'row', gap: 20 }, (c.legends || DEFAULTS.donut.legends).map((item, idx) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: 8 }, [
          box({ width: 16, height: 16, borderWidth: 3, borderColor: t.black, backgroundColor: [t.black, t.pink, t.green][idx] }),
          caption(item, spec, { fontSize: 10 })
        ])
      ))
    ]),
    box({ position: 'absolute', left: 480, top: 0, right: 0, bottom: 0, flexDirection: 'column' }, metrics.map((item, idx) =>
      box({ flex: 1, borderBottomWidth: idx === metrics.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(item.fill), flexDirection: 'row', alignItems: 'center', padding: '0 54px' }, [
        metric(item.value, spec, { fontSize: 50, width: 126 }),
        box({ marginLeft: 20, flexDirection: 'column' }, [
          caption(item.title, spec, { fontSize: 17, marginBottom: 5 }),
          caption(item.body, spec, { fontSize: 10, opacity: 0.8 })
        ])
      ])
    ))
  ])
}

function renderQuote(spec) {
  const t = theme()
  const c = content(spec, 'quote')
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 4) : DEFAULTS.quote.stats
  const quoteText = c.quote || c.title
  return surface([
    box({ position: 'absolute', left: 0, top: 0, right: 0, height: 400, backgroundColor: t.green, borderBottomWidth: 3, borderColor: t.black, padding: 58, justifyContent: 'center' }, [
      metric('"', spec, { position: 'absolute', left: 58, top: 28, fontSize: 140, opacity: 0.16 }),
      headline(quoteText, spec, { position: 'relative', width: 790, fontSize: 46, lineHeight: 1.1, marginBottom: 26 }),
      box({ width: 60, height: 4, backgroundColor: t.black })
    ]),
    box({ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, flexDirection: 'row' }, stats.map((item, idx) =>
      box({ flex: 1, borderRightWidth: idx === stats.length - 1 ? 0 : 3, borderColor: t.black, backgroundColor: fillColor(item.fill), alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
        metric(item.value, spec, { color: item.fill === 'black' ? t.white : t.black, fontSize: 34, marginBottom: 5 }),
        caption(item.label, spec, { color: item.fill === 'black' ? t.white : t.black, fontSize: 10 })
      ])
    ))
  ])
}

function renderTable(spec) {
  const t = theme()
  const c = content(spec, 'table')
  const headers = Array.isArray(c.headers) ? c.headers.slice(0, 4) : DEFAULTS.table.headers
  const rows = Array.isArray(c.rows) ? c.rows.slice(0, 6) : DEFAULTS.table.rows
  const colW = [240, 190, 220, 190]
  return surface([
    box({ position: 'absolute', left: 0, right: 0, top: 0, height: 86, borderBottomWidth: 3, borderColor: t.black, padding: '24px 54px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
      caption(c.title, spec, { fontSize: 26 }),
      label(c.label, spec)
    ]),
    box({ position: 'absolute', left: 54, top: 130, width: 840, height: 334, flexDirection: 'column' }, [
      box({ flexDirection: 'row', height: 48 }, headers.map((head, idx) =>
        box({ width: colW[idx], borderWidth: 3, borderRightWidth: idx === headers.length - 1 ? 3 : 0, borderColor: t.black, backgroundColor: t.black, justifyContent: 'center', paddingLeft: 12 }, [
          caption(head, spec, { color: t.white, fontSize: 10 })
        ])
      )),
      ...rows.map((row, ridx) =>
        box({ flexDirection: 'row', height: 47 }, row.slice(0, 4).map((cell, cidx) =>
          box({ width: colW[cidx], borderLeftWidth: 3, borderBottomWidth: 3, borderRightWidth: cidx === row.length - 1 ? 3 : 0, borderColor: t.black, backgroundColor: ridx % 2 === 1 ? t.gray : t.white, justifyContent: 'center', paddingLeft: 12 }, [
            body(cell, spec, { fontSize: 12, fontWeight: 700, lineHeight: 1.2 })
          ])
        ))
      )
    ])
  ])
}

function renderClosing(spec) {
  const t = theme()
  const c = content(spec, 'closing')
  const contacts = Array.isArray(c.contacts) ? c.contacts.slice(0, 4) : DEFAULTS.closing.contacts
  const socials = Array.isArray(c.socials) ? c.socials.slice(0, 2) : DEFAULTS.closing.socials
  return surface([
    box({ position: 'absolute', left: 0, top: 0, width: 480, height: 540, backgroundColor: t.pink, borderRightWidth: 3, borderColor: t.black, padding: 58, justifyContent: 'center', flexDirection: 'column' }, [
      display(c.title, spec, { fontSize: 70, marginBottom: 24 }),
      body(c.body, spec, { width: 370, fontSize: 15, lineHeight: 1.5, marginBottom: 32 }),
      label(c.cta, spec, { alignSelf: 'flex-start' })
    ]),
    box({ position: 'absolute', left: 480, top: 0, width: 480, height: 440, borderBottomWidth: 3, borderColor: t.black, padding: 58, justifyContent: 'center', flexDirection: 'column' }, [
      caption(c.contact_title, spec, { fontSize: 26, marginBottom: 22 }),
      ...contacts.map((item) => body(item, spec, { fontSize: 14, fontWeight: 600, marginBottom: 8 }))
    ]),
    box({ position: 'absolute', left: 480, right: 0, bottom: 0, height: 100, flexDirection: 'row' }, socials.map((item, idx) =>
      box({ flex: 1, borderRightWidth: idx === 0 ? 3 : 0, borderColor: t.black, backgroundColor: idx === 0 ? t.green : t.black, alignItems: 'center', justifyContent: 'center' }, [
        caption(item, spec, { color: idx === 0 ? t.black : t.white, fontSize: 13 })
      ])
    ))
  ])
}

const RENDERERS = {
  cover: renderCover,
  split: renderSplit,
  bars: renderBars,
  cards: renderCards,
  feature: renderFeature,
  process: renderProcess,
  donut: renderDonut,
  quote: renderQuote,
  table: renderTable,
  closing: renderClosing
}

export function renderBrutalistMatrix(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
