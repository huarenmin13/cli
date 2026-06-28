import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'capsule-card-system'

const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'data_dashboard',
  'data_dashboard-4',
  'quote_or_emphasis',
  'process_or_timeline',
  'data_dashboard-7',
  'slide-8',
  'slide-9',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'capsule',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'capsule',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'closing'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'closing'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/capsule-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  cover: {
    eyebrow: 'Presentation Template',
    title: 'CAPSULE',
    subtitle: 'A Framework for Bold Ideas',
    pills: ['Concept', 'Strategy', 'Vision', 'Future', 'Design', 'Next', '2026']
  },
  agenda: {
    eyebrow: '01',
    title: 'Modular ideas in orbit',
    body: 'A playful editorial system for strategy, launch planning, and brand storytelling.',
    orbit: ['Research', 'Ideation', 'Prototype', 'Iterate', 'Launch', 'Scale']
  },
  data_dashboard: {
    eyebrow: 'Core Principles',
    title: 'The Capsule System',
    cards: [
      { mark: 'I', title: 'Pill Geometry', body: 'Every content container uses soft rounded capsule forms.' },
      { mark: 'II', title: 'Candy Palette', body: 'Accent colors rotate for balance rather than semantic meaning.' },
      { mark: 'III', title: 'Editorial Contrast', body: 'Serif headlines pair with clean sans labels and body copy.' }
    ]
  },
  'data_dashboard-4': {
    eyebrow: 'Performance Indicators',
    title: 'Signals that travel fast',
    bars: [
      { label: 'Market Reach', value: '82%', width: 82 },
      { label: 'Engagement', value: '67%', width: 67 },
      { label: 'Conversion', value: '45%', width: 45 },
      { label: 'Retention', value: '91%', width: 91 },
      { label: 'Satisfaction', value: '74%', width: 74 }
    ]
  },
  quote_or_emphasis: {
    eyebrow: 'Bold',
    quote: 'The best ideas are the ones that feel inevitable right now and impossible five minutes before.',
    author: 'A Philosophy of Action',
    pills: ['Inspire', 'Create', 'Elevate', 'Now', 'Today']
  },
  process_or_timeline: {
    eyebrow: 'Phased Implementation',
    title: 'From signal to launch',
    steps: [
      { num: '1', title: 'Discovery', body: 'Map the terrain before you traverse it.' },
      { num: '2', title: 'Definition', body: 'Sharpen the question to find the answer.' },
      { num: '3', title: 'Development', body: 'Build with intent, iterate with care.' },
      { num: '4', title: 'Delivery', body: 'Ship the work, then make it better.' },
      { num: '5', title: 'Evolution', body: 'Growth is a process, not a destination.' }
    ]
  },
  'data_dashboard-7': {
    eyebrow: 'Key Metrics at a Glance',
    title: 'Proof in soft shapes',
    metrics: [
      { value: '340%', label: 'Growth in Active Users' },
      { value: '12.4M', label: 'Total Reach Across Channels' },
      { value: '98.2%', label: 'System Uptime Record' },
      { value: '4.9', label: 'Average User Satisfaction Score' }
    ]
  },
  'slide-8': {
    eyebrow: 'System Architecture Overview',
    title: 'A flow of rounded decisions',
    nodes: ['Input Layer', 'Processing Core', 'Decision Engine', 'Output Stream'],
    chips: ['Data Ingestion', 'Transformation', 'Distribution']
  },
  'slide-9': {
    eyebrow: 'Visual Placeholder',
    title: 'Where Vision Meets Execution',
    body: 'Great ideas deserve rigorous craft, thoughtful iteration, and a commitment to the user experience at every stage.',
    chips: ['Strategy', 'Design', 'Build', 'Measure']
  },
  closing: {
    eyebrow: 'Continue',
    title: 'The Journey Continues',
    subtitle: 'Questions and conversation welcome',
    pills: ['Explore', 'Discover', 'Go', 'Begin', 'Launch', 'More']
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    cream: source.background || '#F5F5F0',
    ink: source.text || '#1A1A1A',
    white: source.surface || '#FFFFFF',
    coral: source.accent || '#E85D4E',
    lime: source.primary || '#C4D94E',
    lavender: source.lavender || '#C5B5E0',
    sky: source.blue || '#8BB4F7',
    violet: source.violet || '#A06CE8',
    yellow: source.panel || '#F2D160',
    peach: source.peach || '#F5B895',
    mint: source.mint || '#A8E6CF',
    shadow: '#E2DED3'
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
  if (raw.includes('closing') || raw.includes('cta')) return 'closing'
  if (raw.includes('quote')) return 'quote_or_emphasis'
  if (raw.includes('timeline') || raw.includes('process')) return 'process_or_timeline'
  if (raw.includes('data') || raw.includes('metric') || raw.includes('chart')) return 'data_dashboard-7'
  if (raw.includes('agenda') || raw.includes('overview')) return 'agenda'
  return 'data_dashboard'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function fill(theme, index) {
  return [theme.coral, theme.lime, theme.sky, theme.lavender, theme.violet, theme.yellow, theme.peach, theme.mint][index % 8]
}

function frame(spec, variant, children = []) {
  const theme = colors(spec)
  const page = variantPage(spec, variant)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: theme.cream,
      color: theme.ink,
      overflow: 'hidden'
    },
    [
      box({ position: 'absolute', left: -140, top: -100, width: 360, height: 260, borderRadius: 180, backgroundColor: theme.yellow, opacity: 0.18 }),
      box({ position: 'absolute', right: -130, bottom: -90, width: 320, height: 240, borderRadius: 160, backgroundColor: theme.lavender, opacity: 0.18 }),
      ...grain(theme),
      ...children,
      ...nav(theme, spec, page)
    ]
  )
}

function grain(theme) {
  return Array.from({ length: 42 }).map((_, index) =>
    box({
      position: 'absolute',
      left: 28 + (index % 7) * 10,
      top: 32 + Math.floor(index / 7) * 10,
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.ink,
      opacity: 0.13
    })
  )
}

function nav(theme, spec, page) {
  return [
    TextBlock('USE ARROW KEYS TO NAVIGATE', {
      position: 'absolute',
      left: 16,
      bottom: 17,
      color: theme.ink,
      opacity: 0.28,
      fontSize: 7,
      letterSpacing: 0.8,
      ...role('label', spec, { fontSize: 7, lineHeight: 1, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' })
    }),
    box({ position: 'absolute', right: 16, bottom: 17, flexDirection: 'row', alignItems: 'center', gap: 12 }, [
      TextBlock(`${String(page).padStart(2, '0')} / 10`, { color: theme.ink, fontSize: 8, ...role('metric', spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 }) }),
      ...Array.from({ length: 2 }).map((_, index) => box({ width: 9, height: 9, borderRadius: 5, borderWidth: 1.8, borderColor: theme.ink, backgroundColor: index === 0 ? theme.ink : 'transparent' }))
    ])
  ]
}

function headline(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(text, {
    color: theme.ink,
    fontSize: 48,
    lineHeight: 0.96,
    letterSpacing: -0.6,
    ...role('display', spec, { fontSize: 48, lineHeight: 0.96, fontWeight: 800, letterSpacing: -0.6 }),
    ...style
  })
}

function body(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.ink,
    opacity: 0.72,
    fontSize: 15,
    lineHeight: 1.46,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.46, fontWeight: 400 }),
    ...style
  })
}

function pill(spec, text, style = {}) {
  const theme = colors(spec)
  return box(
    {
      minWidth: 92,
      minHeight: 34,
      padding: '10px 20px',
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: theme.ink,
      backgroundColor: style.backgroundColor || theme.yellow,
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    },
    [
      TextBlock(String(text || '').toUpperCase(), {
        color: theme.ink,
        fontSize: style.fontSize || 10,
        lineHeight: 1,
        letterSpacing: 1.1,
        textAlign: 'center',
        ...role('label', spec, { fontSize: style.fontSize || 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase' })
      })
    ]
  )
}

function shadowCard(spec, style = {}, children = []) {
  const theme = colors(spec)
  const left = Number(style.left || 0)
  const top = Number(style.top || 0)
  const width = Number(style.width || 100)
  const height = Number(style.height || 100)
  const radius = style.borderRadius ?? 32
  const shadow = style.shadow ?? 8
  const cardStyle = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: theme.ink,
    backgroundColor: style.backgroundColor || theme.white,
    padding: style.padding || '28px',
    flexDirection: style.flexDirection || 'column'
  }
  if (style.alignItems) cardStyle.alignItems = style.alignItems
  if (style.justifyContent) cardStyle.justifyContent = style.justifyContent
  return [
    box({ position: 'absolute', left: left + shadow, top: top + shadow, width, height, borderRadius: radius, backgroundColor: theme.shadow }),
    box(cardStyle, children)
  ]
}

function floatingPills(spec, labels = []) {
  const positions = [
    { left: 72, top: 62, backgroundColor: colors(spec).coral, transform: 'rotate(-12deg)' },
    { right: 92, top: 94, backgroundColor: colors(spec).lavender, transform: 'rotate(8deg)' },
    { left: 150, bottom: 128, backgroundColor: colors(spec).sky, transform: 'rotate(7deg)' },
    { right: 188, bottom: 78, backgroundColor: colors(spec).lime, transform: 'rotate(-9deg)' },
    { left: 428, top: 72, width: 54, height: 54, borderRadius: 27, backgroundColor: colors(spec).peach, transform: 'rotate(8deg)' },
    { left: 54, bottom: 86, width: 52, height: 52, borderRadius: 26, backgroundColor: colors(spec).violet, transform: 'rotate(0deg)' },
    { right: 76, bottom: 152, backgroundColor: colors(spec).white, transform: 'rotate(14deg)' }
  ]
  return labels.slice(0, positions.length).map((label, index) => pill(spec, label, { position: 'absolute', ...positions[index] }))
}

function renderCover(spec) {
  const content = DEFAULTS.cover
  return frame(spec, 'cover', [
    ...floatingPills(spec, array(spec, 'pills', content.pills)),
    pill(spec, value(spec, 'eyebrow', content.eyebrow), { position: 'absolute', left: 402, top: 208, width: 164, backgroundColor: colors(spec).yellow }),
    headline(value(spec, 'title', content.title), spec, { position: 'absolute', left: 218, top: 258, width: 524, fontSize: 84, lineHeight: 0.9, textAlign: 'center' }),
    TextBlock(value(spec, 'subtitle', content.subtitle).toUpperCase(), {
      position: 'absolute',
      left: 284,
      top: 342,
      width: 392,
      color: colors(spec).ink,
      opacity: 0.56,
      textAlign: 'center',
      fontSize: 15,
      letterSpacing: 2.8,
      ...role('label', spec, { fontSize: 15, lineHeight: 1.2, fontWeight: 500, letterSpacing: 2.8, textTransform: 'uppercase' })
    })
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const orbit = array(spec, 'orbit', DEFAULTS.agenda.orbit)
  return frame(spec, 'agenda', [
    box({ position: 'absolute', left: 86, top: 88, width: 404, height: 368, borderRadius: 202, backgroundColor: theme.lime, borderWidth: 2, borderColor: theme.ink, alignItems: 'center', justifyContent: 'center' }, [
      TextBlock(value(spec, 'eyebrow', DEFAULTS.agenda.eyebrow), { color: theme.ink, fontSize: 52, lineHeight: 1, ...role('metric', spec, { fontSize: 52, lineHeight: 1, fontWeight: 800 }) })
    ]),
    ...orbit.map((label, index) => pill(spec, label, { position: 'absolute', left: 92 + (index % 3) * 130, top: 64 + Math.floor(index / 3) * 326, backgroundColor: fill(theme, index), transform: `rotate(${[-12, 8, -4, 6, -9, 12][index]}deg)` })),
    headline(value(spec, 'title', DEFAULTS.agenda.title), spec, { position: 'absolute', left: 566, top: 124, width: 292, fontSize: 46, lineHeight: 1.02 }),
    body(value(spec, 'body', DEFAULTS.agenda.body), spec, { position: 'absolute', left: 570, top: 286, width: 274, fontSize: 16, lineHeight: 1.46 })
  ])
}

function renderCards(spec) {
  const theme = colors(spec)
  const cards = objectArray(spec, 'cards', DEFAULTS.data_dashboard.cards).slice(0, 3)
  return frame(spec, 'data_dashboard', [
    pill(spec, value(spec, 'eyebrow', DEFAULTS.data_dashboard.eyebrow), { position: 'absolute', left: 376, top: 62, width: 210, backgroundColor: theme.lavender }),
    headline(value(spec, 'title', DEFAULTS.data_dashboard.title), spec, { position: 'absolute', left: 204, top: 116, width: 552, fontSize: 54, textAlign: 'center' }),
    ...cards.flatMap((card, index) => shadowCard(spec, { left: 108 + index * 258, top: 232, width: 226, height: 194, backgroundColor: theme.white, padding: '26px 24px' }, [
      box({ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme.ink, backgroundColor: fill(theme, index), alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, [
        TextBlock(card.mark || String(index + 1), { color: theme.ink, fontSize: 26, lineHeight: 1, textAlign: 'center', ...role('metric', spec, { fontSize: 26, lineHeight: 1, fontWeight: 800 }) })
      ]),
      headline(card.title || '', spec, { width: 174, fontSize: 24, lineHeight: 1.05, marginBottom: 10 }),
      body(card.body || '', spec, { width: 176, fontSize: 12.5, lineHeight: 1.35 })
    ]))
  ])
}

function renderBars(spec) {
  const theme = colors(spec)
  const bars = objectArray(spec, 'bars', DEFAULTS['data_dashboard-4'].bars).slice(0, 5)
  return frame(spec, 'data_dashboard-4', [
    pill(spec, value(spec, 'eyebrow', DEFAULTS['data_dashboard-4'].eyebrow), { position: 'absolute', left: 348, top: 58, width: 264, backgroundColor: theme.sky }),
    headline(value(spec, 'title', DEFAULTS['data_dashboard-4'].title), spec, { position: 'absolute', left: 190, top: 112, width: 580, fontSize: 50, textAlign: 'center' }),
    ...shadowCard(spec, { left: 130, top: 218, width: 700, height: 242, padding: '24px 28px' }, [
      box({ width: 640, flexDirection: 'column', gap: 14 }, bars.map((bar, index) =>
        box({ width: 640, height: 30, flexDirection: 'row', alignItems: 'center', gap: 18 }, [
          TextBlock(bar.label || '', { width: 124, color: theme.ink, fontSize: 11, lineHeight: 1, ...role('label', spec, { fontSize: 11, lineHeight: 1, fontWeight: 700 }) }),
          box({ width: 430, height: 28, borderRadius: 999, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.cream, overflow: 'hidden' }, [
            box({ width: Math.max(40, Number(bar.width || 50) * 4.2), height: 28, borderRadius: 999, backgroundColor: fill(theme, index), alignItems: 'flex-end', justifyContent: 'center', paddingRight: 12 }, [
              TextBlock(bar.value || '', { color: theme.ink, fontSize: 10, lineHeight: 1, ...role('metric', spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 }) })
            ])
          ])
        ])
      ))
    ])
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote_or_emphasis', [
    ...floatingPills(spec, array(spec, 'pills', DEFAULTS.quote_or_emphasis.pills)),
    TextBlock('"', { position: 'absolute', left: 126, top: 104, color: theme.ink, fontSize: 82, lineHeight: 1, ...role('display', spec, { fontSize: 82, lineHeight: 1, fontWeight: 800 }) }),
    headline(value(spec, 'quote', DEFAULTS.quote_or_emphasis.quote), spec, { position: 'absolute', left: 178, top: 160, width: 604, fontSize: 38, lineHeight: 1.22, textAlign: 'center' }),
    pill(spec, value(spec, 'author', DEFAULTS.quote_or_emphasis.author), { position: 'absolute', right: 112, bottom: 86, width: 250, backgroundColor: theme.yellow })
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const steps = objectArray(spec, 'steps', DEFAULTS.process_or_timeline.steps).slice(0, 5)
  return frame(spec, 'process_or_timeline', [
    pill(spec, value(spec, 'eyebrow', DEFAULTS.process_or_timeline.eyebrow), { position: 'absolute', left: 314, top: 58, width: 334, backgroundColor: theme.lavender }),
    headline(value(spec, 'title', DEFAULTS.process_or_timeline.title), spec, { position: 'absolute', left: 236, top: 112, width: 488, fontSize: 50, textAlign: 'center' }),
    box({ position: 'absolute', left: 102, top: 282, width: 756, height: 4, backgroundColor: theme.ink, borderRadius: 999 }),
    box({ position: 'absolute', left: 92, top: 230, flexDirection: 'row', gap: 17 }, steps.map((step, index) =>
      box({ width: 140, minHeight: 154, alignItems: 'center', flexDirection: 'column' }, [
        box({ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme.ink, backgroundColor: fill(theme, index), alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, [
          TextBlock(step.num || String(index + 1), { color: theme.ink, fontSize: 26, lineHeight: 1, textAlign: 'center', ...role('metric', spec, { fontSize: 26, lineHeight: 1, fontWeight: 800 }) })
        ]),
        TextBlock(step.title || '', { width: 122, color: theme.ink, fontSize: 12, lineHeight: 1, textAlign: 'center', letterSpacing: 1.1, marginBottom: 8, ...role('label', spec, { fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase' }) }),
        body(step.body || '', spec, { width: 124, fontSize: 10.5, lineHeight: 1.3, textAlign: 'center' })
      ])
    ))
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const metrics = objectArray(spec, 'metrics', DEFAULTS['data_dashboard-7'].metrics).slice(0, 4)
  return frame(spec, 'data_dashboard-7', [
    pill(spec, value(spec, 'eyebrow', DEFAULTS['data_dashboard-7'].eyebrow), { position: 'absolute', left: 318, top: 58, width: 324, backgroundColor: theme.sky }),
    headline(value(spec, 'title', DEFAULTS['data_dashboard-7'].title), spec, { position: 'absolute', left: 226, top: 116, width: 508, fontSize: 50, textAlign: 'center' }),
    box({ position: 'absolute', left: 106, top: 218, width: 748, flexDirection: 'row', flexWrap: 'wrap', gap: 24 }, metrics.map((metric, index) =>
      box({ width: 362, height: 104, borderRadius: 32, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.white, padding: '22px 24px', flexDirection: 'column' }, [
        TextBlock(metric.value || '', { color: fill(theme, index), fontSize: 40, lineHeight: 1, marginBottom: 12, ...role('metric', spec, { fontSize: 40, lineHeight: 1, fontWeight: 800, letterSpacing: -0.6 }) }),
        TextBlock((metric.label || '').toUpperCase(), { color: theme.ink, fontSize: 10, lineHeight: 1, letterSpacing: 1.1, ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase' }) })
      ])
    ))
  ])
}

function renderDiagram(spec) {
  const theme = colors(spec)
  const nodes = array(spec, 'nodes', DEFAULTS['slide-8'].nodes).slice(0, 4)
  const chips = array(spec, 'chips', DEFAULTS['slide-8'].chips).slice(0, 3)
  return frame(spec, 'slide-8', [
    pill(spec, value(spec, 'eyebrow', DEFAULTS['slide-8'].eyebrow), { position: 'absolute', left: 298, top: 58, width: 364, backgroundColor: theme.lavender }),
    headline(value(spec, 'title', DEFAULTS['slide-8'].title), spec, { position: 'absolute', left: 210, top: 112, width: 540, fontSize: 48, textAlign: 'center' }),
    box({ position: 'absolute', left: 96, top: 252, flexDirection: 'row', alignItems: 'center', gap: 10 }, nodes.map((nodeLabel, index) => [
      box({ width: 162, minHeight: 64, borderRadius: 999, borderWidth: 2, borderColor: theme.ink, backgroundColor: fill(theme, index), alignItems: 'center', justifyContent: 'center', padding: '14px 22px' }, [
        TextBlock(nodeLabel, { color: theme.ink, fontSize: 15, lineHeight: 1.15, textAlign: 'center', ...role('body', spec, { fontSize: 15, lineHeight: 1.15, fontWeight: 600 }) })
      ]),
      index < nodes.length - 1 ? box({ width: 34, height: 4, borderRadius: 999, backgroundColor: theme.ink }) : null
    ]).flat().filter(Boolean)),
    box({ position: 'absolute', left: 214, top: 380, flexDirection: 'row', gap: 18 }, chips.map((chip, index) => pill(spec, chip, { backgroundColor: fill(theme, index + 4), minWidth: 150 })))
  ])
}

function renderVisual(spec) {
  const theme = colors(spec)
  const chips = array(spec, 'chips', DEFAULTS['slide-9'].chips)
  return frame(spec, 'slide-9', [
    ...shadowCard(spec, { left: 78, top: 112, width: 364, height: 300, borderRadius: 32, padding: '26px', backgroundColor: theme.white }, [
      box({ width: 308, height: 212, borderRadius: 24, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.lavender, alignItems: 'center', justifyContent: 'center' }, [
        TextBlock(value(spec, 'eyebrow', DEFAULTS['slide-9'].eyebrow), { color: theme.ink, fontSize: 14, letterSpacing: 1.2, ...role('label', spec, { fontSize: 14, lineHeight: 1, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }) })
      ])
    ]),
    headline(value(spec, 'title', DEFAULTS['slide-9'].title), spec, { position: 'absolute', left: 502, top: 122, width: 330, fontSize: 42, lineHeight: 1.03 }),
    body(value(spec, 'body', DEFAULTS['slide-9'].body), spec, { position: 'absolute', left: 506, top: 268, width: 328, fontSize: 15, lineHeight: 1.48 }),
    box({ position: 'absolute', left: 506, top: 376, width: 330, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, chips.map((chip, index) => pill(spec, chip, { minWidth: 88, backgroundColor: fill(theme, index + 1) })))
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  return frame(spec, 'closing', [
    ...floatingPills(spec, array(spec, 'pills', DEFAULTS.closing.pills)),
    pill(spec, value(spec, 'eyebrow', DEFAULTS.closing.eyebrow), { position: 'absolute', left: 386, top: 134, width: 188, backgroundColor: theme.yellow }),
    headline(value(spec, 'title', DEFAULTS.closing.title), spec, { position: 'absolute', left: 192, top: 198, width: 576, fontSize: 66, lineHeight: 0.96, textAlign: 'center' }),
    body(value(spec, 'subtitle', DEFAULTS.closing.subtitle), spec, { position: 'absolute', left: 310, top: 330, width: 340, textAlign: 'center', fontSize: 17 })
  ])
}

const RENDERERS = {
  cover: renderCover,
  agenda: renderAgenda,
  data_dashboard: renderCards,
  'data_dashboard-4': renderBars,
  quote_or_emphasis: renderQuote,
  process_or_timeline: renderTimeline,
  'data_dashboard-7': renderStats,
  'slide-8': renderDiagram,
  'slide-9': renderVisual,
  closing: renderClosing
}

export function renderCapsuleCardSystem(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
