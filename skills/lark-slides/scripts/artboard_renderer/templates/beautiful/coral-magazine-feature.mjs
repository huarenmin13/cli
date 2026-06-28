import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'coral-magazine-feature'

const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'detail',
  'data_dashboard',
  'process_or_timeline',
  'data_dashboard-6',
  'quote_or_emphasis',
  'process_or_timeline-8',
  'detail-9',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'coral',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'coral',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'closing'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'closing'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/coral-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  cover: {
    eyebrow: 'VENTURE',
    title: 'QUARTERLY\nSTRATEGY\nSESSION 2026',
    location_label: 'Location',
    location: '7TH FLOOR',
    date: 'May 15 / 09:00 Start',
    year: '2026'
  },
  agenda: {
    eyebrow: '01 / Overview',
    title: 'REDEFINING THE BOUNDARIES OF WHAT IS POSSIBLE',
    body: 'We bring together diverse perspectives and bold ideas to create meaningful impact. Our approach combines strategic thinking with creative execution, ensuring every initiative delivers measurable results and lasting value.'
  },
  detail: {
    number: '03',
    title: 'CORE\nPILLARS',
    items: [
      { label: 'Innovation', body: 'Pushing boundaries with cutting-edge solutions and forward-thinking methodologies.' },
      { label: 'Collaboration', body: 'Building strong partnerships across teams, disciplines, and industries.' },
      { label: 'Execution', body: 'Delivering results with precision, speed, and uncompromising quality.' }
    ]
  },
  data_dashboard: {
    eyebrow: '02 / Performance',
    title: 'GROWTH METRICS',
    stat: '+147%',
    stat_label: 'Year Over Year',
    bars: [
      { label: 'Awareness', value: 72 },
      { label: 'Engagement', value: 84 },
      { label: 'Retention', value: 58 },
      { label: 'Referral', value: 91 },
      { label: 'Conversion', value: 64 }
    ],
    metrics: [
      { value: '2.4M', label: 'Total Reach' },
      { value: '89%', label: 'Retention Rate' },
      { value: '156', label: 'New Partners' }
    ]
  },
  process_or_timeline: {
    title: 'IMPACT',
    bar_title: 'GLOBAL INITIATIVE 2026',
    bar_meta: 'Phase One / Launch Q2\n12 Cities / 4 Continents'
  },
  'data_dashboard-6': {
    title: 'KEY OBJECTIVES',
    subtitle: 'Strategic priorities for the upcoming fiscal period',
    cards: [
      { mark: 'A', title: 'EXPAND REACH', body: 'Enter new markets and establish presence in emerging territories through targeted campaigns.', stat: '24' },
      { mark: 'B', title: 'DEEPEN ENGAGEMENT', body: 'Strengthen relationships with existing partners through enhanced service offerings.', stat: '+45%' },
      { mark: 'C', title: 'OPTIMIZE FLOW', body: 'Streamline internal processes to improve delivery times and resource allocation.', stat: '3.2x' }
    ]
  },
  quote_or_emphasis: {
    title: 'FUTURE BY DESIGN',
    quote: 'The best way to predict the future is to create it with intention, precision, and the courage to challenge convention.',
    author: 'Alexandra Chen',
    role: 'Chief Strategy Officer'
  },
  'process_or_timeline-8': {
    eyebrow: '03 / Roadmap',
    title: 'PROJECT TIMELINE',
    steps: [
      { phase: 'Q1', title: 'Discovery', body: 'Research and planning phase with stakeholder alignment.' },
      { phase: 'Q2', title: 'Design', body: 'Concept development and prototype validation.' },
      { phase: 'Q3', title: 'Build', body: 'Full implementation and iterative refinement.' },
      { phase: 'Q4', title: 'Launch', body: 'Market release and performance monitoring.' },
      { phase: '+', title: 'Scale', body: 'Expansion and long-term optimization.' }
    ]
  },
  'detail-9': {
    title: 'LEADERSHIP',
    subtitle: 'The people driving our vision forward',
    people: [
      { initials: 'JD', name: 'Jordan Davis', role: 'Chief Executive' },
      { initials: 'MK', name: 'Morgan Kim', role: 'Head of Product' },
      { initials: 'SR', name: 'Sam Rivera', role: 'Creative Director' },
      { initials: 'TW', name: 'Taylor Wong', role: 'Operations Lead' }
    ]
  },
  closing: {
    title: 'THANK\nYOU',
    subtitle: "Let's build something extraordinary together. Reach out to start the conversation.",
    contacts: [
      { label: 'Email', value: 'HELLO@VENTURE.IO' },
      { label: 'Phone', value: '+1 (555) 014-2298' },
      { label: 'Office', value: 'SEATTLE, WA' }
    ],
    socials: ['IN', 'X', 'DR']
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    coral: source.primary || '#E85D5D',
    coralDark: source.accent || '#D44A4A',
    cream: source.background || '#F5F0E8',
    creamDark: source.panel || '#E8E0D4',
    ink: source.text || '#1A1A1A',
    gray: source.muted || '#6B6B6B',
    lightGray: '#B0B0B0',
    white: '#FFFFFF'
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

function content(spec, variant) {
  return DEFAULTS[variant] || DEFAULTS.cover
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover')) return 'cover'
  if (raw.includes('closing') || raw.includes('cta')) return 'closing'
  if (raw.includes('quote')) return 'quote_or_emphasis'
  if (raw.includes('timeline') || raw.includes('process') || raw.includes('roadmap')) return 'process_or_timeline-8'
  if (raw.includes('data') || raw.includes('metric') || raw.includes('chart')) return 'data_dashboard'
  if (raw.includes('compare') || raw.includes('team')) return 'detail-9'
  if (raw.includes('agenda') || raw.includes('overview')) return 'agenda'
  return 'detail'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function displayText(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    fontSize: 58,
    lineHeight: 0.92,
    letterSpacing: 2,
    ...role('display', spec, { fontSize: 58, lineHeight: 0.92, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }),
    ...style
  })
}

function labelText(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 3,
    ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }),
    ...style
  })
}

function bodyText(value, spec, style = {}) {
  return TextBlock(value, {
    fontSize: 15,
    lineHeight: 1.45,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.45, fontWeight: 400 }),
    ...style
  })
}

function metricText(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 44,
    lineHeight: 1,
    ...role('metric', spec, { fontSize: 44, lineHeight: 1, fontWeight: 900, textTransform: 'uppercase' }),
    ...style
  })
}

function coralChevrons(theme, opacity = 0.18) {
  const shapes = []
  for (let index = -2; index < 8; index += 1) {
    const left = index * 145 + 16
    shapes.push(box({ position: 'absolute', left, top: -18, width: 18, height: 230, backgroundColor: theme.ink, opacity, transform: 'rotate(27deg)' }))
    shapes.push(box({ position: 'absolute', left: left + 62, top: -18, width: 18, height: 230, backgroundColor: theme.ink, opacity: opacity * 0.72, transform: 'rotate(-27deg)' }))
  }
  return shapes
}

function diagonalHatch(theme, opts = {}) {
  const shapes = []
  const color = opts.color || theme.ink
  for (let index = 0; index < 14; index += 1) {
    shapes.push(box({
      position: 'absolute',
      left: index * 62,
      top: 0,
      width: opts.width || 12,
      height: opts.height || 540,
      backgroundColor: color,
      opacity: opts.opacity || 0.07,
      transform: `rotate(${opts.angle || 45}deg)`
    }))
  }
  return shapes
}

function slideCounter(spec, variant, color, dark = false) {
  const page = String(variantPage(spec, variant)).padStart(2, '0')
  return TextBlock(`${page} / 10`, {
    position: 'absolute',
    right: 26,
    bottom: 18,
    width: 58,
    color,
    opacity: dark ? 0.55 : 0.82,
    textAlign: 'right',
    fontSize: 9,
    lineHeight: 1,
    ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700, letterSpacing: 1.4 })
  })
}

function frame(spec, variant, style, children = []) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.cream,
      color: theme.ink,
      ...style
    },
    children
  )
}

function renderCover(spec) {
  const theme = colors(spec)
  const variant = 'cover'
  const defaults = content(spec, variant)
  const rawTitle = value(spec, 'title', defaults.title).toUpperCase()
  const titleLines = rawTitle.includes('\n')
    ? rawTitle.split(/\n+/).filter(Boolean).slice(0, 3)
    : [rawTitle.split(/\s+/).slice(0, 1).join(' '), rawTitle.split(/\s+/).slice(1, 2).join(' '), rawTitle.split(/\s+/).slice(2).join(' ')].filter(Boolean)
  return frame(spec, variant, {}, [
    box({ position: 'absolute', left: 0, top: 0, width: 960, height: 172, backgroundColor: theme.coral, overflow: 'hidden' }, coralChevrons(theme, 0.18)),
    labelText(value(spec, 'eyebrow', defaults.eyebrow), spec, { position: 'absolute', left: 62, top: 36, color: theme.ink, opacity: 0.72 }),
    ...titleLines.map((line, index) =>
      displayText(line, spec, {
        position: 'absolute',
        left: 62,
        top: 212 + index * 49,
        width: 720,
        color: theme.ink,
        fontSize: 56,
        lineHeight: 0.9,
        letterSpacing: 3.2,
        whiteSpace: 'nowrap'
      })
    ),
    box({ position: 'absolute', left: 62, top: 382, width: 830, height: 3, backgroundColor: theme.ink, opacity: 0.15 }),
    labelText(value(spec, 'location_label', defaults.location_label), spec, { position: 'absolute', left: 62, bottom: 66, color: theme.gray, letterSpacing: 2.5 }),
    metricText(value(spec, 'location', defaults.location), spec, { position: 'absolute', left: 62, bottom: 35, color: theme.ink, fontSize: 26, letterSpacing: 2 }),
    labelText(value(spec, 'date', defaults.date), spec, { position: 'absolute', right: 62, bottom: 69, width: 280, textAlign: 'right', color: theme.gray, letterSpacing: 2 }),
    metricText(value(spec, 'year', defaults.year), spec, { position: 'absolute', right: 62, bottom: 34, width: 90, textAlign: 'right', color: theme.ink, fontSize: 26, letterSpacing: 1.8 }),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const variant = 'agenda'
  const defaults = content(spec, variant)
  return frame(spec, variant, { backgroundColor: theme.cream }, [
    labelText(value(spec, 'eyebrow', defaults.eyebrow), spec, { position: 'absolute', left: 76, top: 70, color: theme.coral }),
    displayText(value(spec, 'title', defaults.title), spec, {
      position: 'absolute',
      left: 76,
      top: 120,
      width: 770,
      color: theme.ink,
      fontSize: 62,
      lineHeight: 0.98,
      letterSpacing: 2
    }),
    bodyText(value(spec, 'body', defaults.body), spec, {
      position: 'absolute',
      left: 76,
      top: 352,
      width: 610,
      color: theme.gray,
      fontSize: 17,
      lineHeight: 1.7
    }),
    box({ position: 'absolute', left: 76, bottom: 68, width: 80, height: 4, backgroundColor: theme.coral }),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderDetail(spec) {
  const theme = colors(spec)
  const variant = 'detail'
  const defaults = content(spec, variant)
  const items = objectArray(spec, 'items', defaults.items).slice(0, 3)
  return frame(spec, variant, { backgroundColor: theme.ink }, [
    box({ position: 'absolute', left: 0, top: 0, width: 480, height: 540, backgroundColor: theme.coral, overflow: 'hidden' }, [
      ...diagonalHatch(theme),
      metricText(value(spec, 'number', defaults.number), spec, { position: 'absolute', left: 54, top: 54, color: theme.ink, opacity: 0.14, fontSize: 142, lineHeight: 1 }),
      displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 58, bottom: 72, width: 330, color: theme.ink, fontSize: 58, lineHeight: 0.96, letterSpacing: 2 })
    ]),
    ...items.map((item, index) =>
      box({ position: 'absolute', left: 548, top: 116 + index * 112, width: 318, minHeight: 76, flexDirection: 'column' }, [
        labelText(item.label, spec, { color: theme.coral, marginBottom: 10, letterSpacing: 2.2 }),
        bodyText(item.body, spec, { color: theme.cream, fontSize: 16, lineHeight: 1.45 })
      ])
    ),
    slideCounter(spec, variant, theme.cream)
  ])
}

function renderDataDashboard(spec) {
  const theme = colors(spec)
  const variant = 'data_dashboard'
  const defaults = content(spec, variant)
  const bars = objectArray(spec, 'bars', defaults.bars).slice(0, 5)
  const metrics = objectArray(spec, 'metrics', defaults.metrics).slice(0, 3)
  return frame(spec, variant, { backgroundColor: theme.cream }, [
    labelText(value(spec, 'eyebrow', defaults.eyebrow), spec, { position: 'absolute', left: 70, top: 64, color: theme.coral }),
    displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 70, top: 98, width: 470, color: theme.ink, fontSize: 58, lineHeight: 0.98 }),
    metricText(value(spec, 'stat', defaults.stat), spec, { position: 'absolute', right: 76, top: 72, width: 180, color: theme.coral, textAlign: 'right', fontSize: 72 }),
    labelText(value(spec, 'stat_label', defaults.stat_label), spec, { position: 'absolute', right: 78, top: 150, width: 180, color: theme.gray, textAlign: 'right', letterSpacing: 2 }),
    box({ position: 'absolute', left: 70, top: 220, width: 570, height: 230, flexDirection: 'column', gap: 15 },
      bars.map((bar) =>
        box({ width: 570, height: 30, flexDirection: 'row', alignItems: 'center', gap: 16 }, [
          labelText(bar.label, spec, { width: 120, color: theme.ink, letterSpacing: 1.2, fontSize: 8 }),
          box({ width: 370, height: 18, backgroundColor: theme.creamDark }, [
            box({ width: Math.max(32, Math.min(100, Number(bar.value) || 0)) * 3.7, height: 18, backgroundColor: theme.coral })
          ]),
          metricText(String(bar.value), spec, { width: 40, color: theme.coral, fontSize: 20, textAlign: 'right' })
        ])
      )
    ),
    ...metrics.map((metric, index) =>
      box({ position: 'absolute', right: 74, top: 226 + index * 74, width: 190, height: 54, backgroundColor: theme.white, borderLeft: `4px solid ${theme.coral}`, padding: '9px 14px', flexDirection: 'column' }, [
        metricText(metric.value, spec, { color: theme.ink, fontSize: 28 }),
        bodyText(metric.label, spec, { color: theme.gray, fontSize: 11, lineHeight: 1.2 })
      ])
    ),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderFeature(spec) {
  const theme = colors(spec)
  const variant = 'process_or_timeline'
  const defaults = content(spec, variant)
  return frame(spec, variant, { backgroundColor: theme.ink }, [
    box({ position: 'absolute', left: 0, top: 0, width: 960, height: 404, backgroundColor: theme.coral, overflow: 'hidden' }, [
      ...Array.from({ length: 14 }).map((_, index) =>
        box({ position: 'absolute', left: index * 72, top: 0, width: 2, height: 404, backgroundColor: theme.ink, opacity: 0.1 })
      ),
      displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 128, top: 138, width: 720, color: theme.ink, textAlign: 'center', fontSize: 138, letterSpacing: 9, lineHeight: 1 })
    ]),
    box({ position: 'absolute', left: 0, bottom: 0, width: 960, height: 136, backgroundColor: theme.cream }),
    displayText(value(spec, 'bar_title', defaults.bar_title), spec, { position: 'absolute', left: 76, bottom: 48, width: 500, color: theme.ink, fontSize: 35, lineHeight: 1, letterSpacing: 1.6, whiteSpace: 'nowrap' }),
    bodyText(value(spec, 'bar_meta', defaults.bar_meta), spec, { position: 'absolute', right: 54, bottom: 46, width: 220, color: theme.gray, textAlign: 'right', fontSize: 13, lineHeight: 1.45, letterSpacing: 1.6, textTransform: 'uppercase' }),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderCards(spec) {
  const theme = colors(spec)
  const variant = 'data_dashboard-6'
  const defaults = content(spec, variant)
  const cards = objectArray(spec, 'cards', defaults.cards).slice(0, 3)
  return frame(spec, variant, { backgroundColor: theme.cream }, [
    displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 70, top: 64, width: 600, color: theme.ink, fontSize: 58, lineHeight: 1 }),
    bodyText(value(spec, 'subtitle', defaults.subtitle), spec, { position: 'absolute', left: 72, top: 132, width: 520, color: theme.gray, fontSize: 14, letterSpacing: 1.8 }),
    ...cards.map((card, index) =>
      box({ position: 'absolute', left: 70 + index * 286, top: 208, width: 250, height: 244, backgroundColor: theme.white, borderTop: `5px solid ${theme.coral}`, padding: 0, flexDirection: 'column' }, [
        box({ position: 'absolute', left: 24, top: 22, width: 46, height: 46, backgroundColor: theme.coral, alignItems: 'center', justifyContent: 'center' }, [
          metricText(card.mark, spec, { color: theme.white, fontSize: 24, textAlign: 'center' })
        ]),
        displayText(card.title, spec, { position: 'absolute', left: 24, top: 84, width: 190, color: theme.ink, fontSize: 25, lineHeight: 1.02, letterSpacing: 1.1 }),
        bodyText(card.body, spec, { position: 'absolute', left: 24, top: 142, width: 190, height: 54, color: theme.gray, fontSize: 10.5, lineHeight: 1.3 }),
        metricText(card.stat, spec, { position: 'absolute', left: 24, bottom: 16, width: 120, color: theme.coral, fontSize: 30 })
      ])
    ),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  const variant = 'quote_or_emphasis'
  const defaults = content(spec, variant)
  return frame(spec, variant, { backgroundColor: theme.ink }, [
    box({ position: 'absolute', left: 0, top: 0, width: 384, height: 540, backgroundColor: theme.coral, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, [
      ...diagonalHatch(theme, { angle: -45, opacity: 0.06, width: 14 }),
      metricText('"', spec, { color: theme.ink, opacity: 0.35, fontSize: 235, lineHeight: 1 })
    ]),
    box({ position: 'absolute', left: 456, top: 120, width: 400, height: 4, backgroundColor: theme.coral }),
    bodyText(value(spec, 'quote', defaults.quote), spec, { position: 'absolute', left: 456, top: 164, width: 400, color: theme.cream, fontSize: 28, lineHeight: 1.44, fontWeight: 300 }),
    labelText(value(spec, 'author', defaults.author), spec, { position: 'absolute', left: 456, bottom: 122, width: 320, color: theme.coral, letterSpacing: 2.4 }),
    bodyText(value(spec, 'role', defaults.role), spec, { position: 'absolute', left: 456, bottom: 96, width: 320, color: theme.gray, fontSize: 13, letterSpacing: 1 }),
    slideCounter(spec, variant, theme.cream)
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const variant = 'process_or_timeline-8'
  const defaults = content(spec, variant)
  const steps = objectArray(spec, 'steps', defaults.steps).slice(0, 5)
  return frame(spec, variant, { backgroundColor: theme.cream }, [
    labelText(value(spec, 'eyebrow', defaults.eyebrow), spec, { position: 'absolute', left: 70, top: 60, color: theme.coral }),
    displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 70, top: 96, width: 560, color: theme.ink, fontSize: 58, lineHeight: 1 }),
    box({ position: 'absolute', left: 82, top: 302, width: 796, height: 4, backgroundColor: theme.ink }),
    ...steps.map((step, index) => {
      const x = 86 + index * 196
      const even = index % 2 === 1
      return box({ position: 'absolute', left: x - 48, top: even ? 225 : 286, width: 118, minHeight: 150, flexDirection: 'column', alignItems: 'center' }, [
        even ? box({ width: 112, minHeight: 58, marginBottom: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
          labelText(step.title, spec, { color: theme.coral, textAlign: 'center', letterSpacing: 1.4 }),
          bodyText(step.body, spec, { color: theme.gray, width: 112, textAlign: 'center', fontSize: 10.5, lineHeight: 1.25, marginTop: 6 })
        ]) : null,
        box({ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.coral, border: `4px solid ${theme.ink}`, alignItems: 'center', justifyContent: 'center' }, [
          metricText(step.phase, spec, { color: theme.white, fontSize: 25, textAlign: 'center' })
        ]),
        !even ? box({ width: 112, minHeight: 64, marginTop: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
          labelText(step.title, spec, { color: theme.coral, textAlign: 'center', letterSpacing: 1.4 }),
          bodyText(step.body, spec, { color: theme.gray, width: 112, textAlign: 'center', fontSize: 10.5, lineHeight: 1.25, marginTop: 6 })
        ]) : null
      ].filter(Boolean))
    }),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

function renderTeam(spec) {
  const theme = colors(spec)
  const variant = 'detail-9'
  const defaults = content(spec, variant)
  const people = objectArray(spec, 'people', defaults.people).slice(0, 4)
  return frame(spec, variant, { backgroundColor: theme.ink }, [
    displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 70, top: 62, width: 620, color: theme.cream, fontSize: 58 }),
    bodyText(value(spec, 'subtitle', defaults.subtitle), spec, { position: 'absolute', left: 72, top: 132, width: 520, color: theme.gray, fontSize: 14, letterSpacing: 1.8 }),
    ...people.map((person, index) =>
      box({ position: 'absolute', left: 70 + index * 215, top: 214, width: 178, height: 210, border: `1px solid rgba(245,240,232,0.16)`, backgroundColor: 'rgba(245,240,232,0.05)', padding: 22, alignItems: 'center', flexDirection: 'column' }, [
        box({ width: 76, height: 76, borderRadius: 38, backgroundColor: theme.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, [
          metricText(person.initials, spec, { color: theme.white, fontSize: 32, textAlign: 'center' })
        ]),
        bodyText(person.name, spec, { width: 130, textAlign: 'center', color: theme.cream, fontSize: 15, lineHeight: 1.2, fontWeight: 700 }),
        bodyText(person.role, spec, { width: 130, textAlign: 'center', color: theme.gray, fontSize: 11, lineHeight: 1.25, letterSpacing: 1, marginTop: 8 })
      ])
    ),
    slideCounter(spec, variant, theme.cream)
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const variant = 'closing'
  const defaults = content(spec, variant)
  const contacts = objectArray(spec, 'contacts', defaults.contacts).slice(0, 3)
  const socials = array(spec, 'socials', defaults.socials).slice(0, 3)
  return frame(spec, variant, {}, [
    box({ position: 'absolute', left: 0, top: 0, width: 528, height: 540, backgroundColor: theme.coral, overflow: 'hidden' }, [
      displayText(value(spec, 'title', defaults.title), spec, { position: 'absolute', left: 70, top: 142, width: 360, color: theme.ink, fontSize: 76, lineHeight: 0.95, letterSpacing: 3 }),
      bodyText(value(spec, 'subtitle', defaults.subtitle), spec, { position: 'absolute', left: 72, top: 318, width: 330, color: 'rgba(0,0,0,0.70)', fontSize: 16, lineHeight: 1.55 }),
      box({ position: 'absolute', left: 0, bottom: 0, width: 528, height: 58, opacity: 0.18 }, coralChevrons(theme, 0.5))
    ]),
    box({ position: 'absolute', left: 528, top: 0, width: 432, height: 540, backgroundColor: theme.cream }),
    ...contacts.map((contact, index) =>
      box({ position: 'absolute', left: 594, top: 144 + index * 86, width: 288, minHeight: 58, flexDirection: 'column' }, [
        labelText(contact.label, spec, { color: theme.gray, marginBottom: 10, letterSpacing: 2.5 }),
        metricText(contact.value, spec, { color: theme.ink, fontSize: 33, lineHeight: 1.05, letterSpacing: 1.8 })
      ])
    ),
    ...socials.map((item, index) =>
      box({ position: 'absolute', left: 594 + index * 60, bottom: 86, width: 42, height: 42, border: `2px solid ${theme.ink}`, alignItems: 'center', justifyContent: 'center' }, [
        labelText(item, spec, { color: theme.ink, textAlign: 'center', letterSpacing: 0.5, fontSize: 10 })
      ])
    ),
    slideCounter(spec, variant, theme.gray, true)
  ])
}

const RENDERERS = {
  cover: renderCover,
  agenda: renderAgenda,
  detail: renderDetail,
  data_dashboard: renderDataDashboard,
  process_or_timeline: renderFeature,
  'data_dashboard-6': renderCards,
  quote_or_emphasis: renderQuote,
  'process_or_timeline-8': renderTimeline,
  'detail-9': renderTeam,
  closing: renderClosing
}

export function renderCoralMagazineFeature(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderDetail)(spec)
}
