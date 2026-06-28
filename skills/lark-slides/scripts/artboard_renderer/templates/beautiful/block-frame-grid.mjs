import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'block-frame-grid'

const PAGE_VARIANTS = [
  'cover',
  'agenda',
  'data_dashboard',
  'data_dashboard-4',
  'quote_or_emphasis',
  'process_or_timeline',
  'process_or_timeline-7',
  'data_dashboard-8',
  'process_or_timeline-9',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'block-frame',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'block-frame',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'closing'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['cover', 'closing'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/block-frame-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  cover: {
    eyebrow: 'Presentation Template',
    title: 'NEO-\nBRUTALISM\nSTYLE',
    subtitle: 'A bold, high-contrast template designed for maximum visual impact and uncompromising clarity.',
    cta: 'Get Started'
  },
  agenda: {
    eyebrow: 'Overview',
    title: 'What We Deliver',
    body: 'Every project follows a rigorous process that balances creative exploration with systematic execution.',
    metrics: [
      { value: '12+', label: 'Years' },
      { value: '500+', label: 'Projects' },
      { value: '40', label: 'Cities' }
    ]
  },
  data_dashboard: {
    eyebrow: 'Core Features',
    title: 'Built for bold systems',
    items: [
      { letter: 'A', title: 'Modular Layouts', body: 'Mix and match components without starting from scratch.' },
      { letter: 'B', title: 'Responsive Ready', body: 'Adapts to different screens while keeping the bold visual language.' },
      { letter: 'C', title: 'Design Tokens', body: 'Colors, borders, and typography are structured for reuse.' },
      { letter: 'D', title: 'Impact First', body: 'High contrast and large type keep every message unmistakable.' }
    ]
  },
  'data_dashboard-4': {
    eyebrow: 'Performance Data',
    title: 'Quarterly Growth Metrics',
    series: [
      { label: 'Revenue', values: [42, 58, 73, 90, 100] },
      { label: 'Users', values: [28, 46, 67, 78, 94] },
      { label: 'Retention', values: [61, 66, 74, 82, 94] }
    ],
    stats: [
      { value: '+142%', label: 'Revenue Growth' },
      { value: '2.4M', label: 'Active Users' },
      { value: '94%', label: 'Retention Rate' }
    ]
  },
  quote_or_emphasis: {
    quote: 'Design is not just what it looks like. Design is how it works, how it feels, and how it lasts.',
    author: 'Core Principle, Version 4.0'
  },
  process_or_timeline: {
    eyebrow: 'Visual System Methodology',
    title: 'How We Structure Every Project',
    image_label: 'Image Placeholder',
    items: [
      'Discovery phase to map stakeholder needs and technical constraints before any visual work begins.',
      'Iterative wireframing with rapid feedback loops and clear decision logs.',
      'Implementation planning that keeps design intent connected to production reality.'
    ]
  },
  'process_or_timeline-7': {
    eyebrow: 'Roadmap',
    title: 'Project Timeline',
    steps: [
      { num: '01', title: 'Research', body: 'Market analysis, interviews, and competitive audits.' },
      { num: '02', title: 'Concept', body: 'Mood boards, sketches, and directional exploration.' },
      { num: '03', title: 'Build', body: 'Design system, templates, and implementation support.' },
      { num: '04', title: 'Launch', body: 'Final checks, handoff, and post-launch iteration.' }
    ]
  },
  'data_dashboard-8': {
    eyebrow: 'By The Numbers',
    title: 'Impact at a Glance',
    metrics: [
      { value: '98%', label: 'Client Satisfaction' },
      { value: '14', label: 'Industry Awards' },
      { value: '3.2x', label: 'Avg. ROI Increase' },
      { value: '50+', label: 'Team Members' }
    ]
  },
  'process_or_timeline-9': {
    eyebrow: 'The Team',
    title: 'Meet the Crew',
    people: [
      { initials: 'JD', name: 'J. Doe', role: 'Creative Lead', body: 'Oversees visual direction and maintains a coherent narrative.' },
      { initials: 'AS', name: 'A. Smith', role: 'Tech Director', body: 'Translates design systems into scalable technical architectures.' },
      { initials: 'MK', name: 'M. Kim', role: 'Producer', body: 'Keeps delivery, feedback, and operations moving at speed.' }
    ]
  },
  closing: {
    title: "Let's Build\nSomething Bold",
    subtitle: 'Ready to start your next project?',
    cta: 'Get In Touch'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    background: source.background || '#FFDC8B',
    paper: source.surface || '#FFFDF5',
    black: source.text || '#000000',
    pink: source.primary || '#FE90E8',
    green: source.accent || '#99E885',
    yellow: source.yellow || '#F7CB46',
    blue: source.blue || '#C0F7FE',
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

function upper(input) {
  return String(input || '').toUpperCase()
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant)) return variant
  }
  if (raw.includes('cover')) return 'cover'
  if (raw.includes('quote')) return 'quote_or_emphasis'
  if (raw.includes('closing') || raw.includes('cta')) return 'closing'
  if (raw.includes('timeline') || raw.includes('process')) return 'process_or_timeline-7'
  if (raw.includes('data') || raw.includes('metric')) return 'data_dashboard-8'
  if (raw.includes('agenda') || raw.includes('overview')) return 'agenda'
  return 'data_dashboard'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function frame(spec, variant, children = [], options = {}) {
  const theme = colors(spec)
  const background = options.background || theme.background
  const page = variantPage(spec, variant)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: background,
      color: theme.black,
      overflow: 'hidden'
    },
    [
      ...dotGrid(theme),
      ...children,
      nav(theme, spec, page)
    ]
  )
}

function dotGrid(theme) {
  return Array.from({ length: 24 }).map((_, index) =>
    box({
      position: 'absolute',
      left: 34 + (index % 6) * 10,
      top: 35 + Math.floor(index / 6) * 10,
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.black,
      opacity: 0.55
    })
  )
}

function nav(theme, spec, page) {
  return [
    smallButton(theme, spec, `${String(page).padStart(2, '0')} / 10`, { position: 'absolute', left: 14, bottom: 12, width: 54 }),
    box({ position: 'absolute', right: 14, bottom: 12, flexDirection: 'row', gap: 8 }, [
      smallButton(theme, spec, '<', { width: 26 }),
      smallButton(theme, spec, '>', { width: 26 })
    ])
  ]
}

function smallButton(theme, spec, label, style = {}) {
  return box(
    {
      width: 54,
      height: 26,
      backgroundColor: theme.white,
      borderWidth: 3,
      borderColor: theme.black,
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    },
    [
      TextBlock(label, {
        color: theme.black,
        fontSize: 9,
        lineHeight: 1,
        textAlign: 'center',
        ...role('metric', spec, { fontSize: 9, lineHeight: 1, fontWeight: 900 })
      })
    ]
  )
}

function label(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(upper(text), {
    minHeight: 25,
    backgroundColor: style.backgroundColor || theme.white,
    borderWidth: 3,
    borderColor: theme.black,
    color: theme.black,
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 0.8,
    padding: '7px 12px',
    ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 900 }),
    ...style
  })
}

function headline(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(upper(text), {
    color: theme.black,
    fontSize: 52,
    lineHeight: 0.95,
    ...role('display', spec, { fontSize: 52, lineHeight: 0.95, fontWeight: 900 }),
    ...style
  })
}

function body(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.black,
    fontSize: 14,
    lineHeight: 1.45,
    ...role('body', spec, { fontSize: 14, lineHeight: 1.45, fontWeight: 600 }),
    ...style
  })
}

function elevated(theme, style = {}, children = []) {
  const left = Number(style.left || 0)
  const top = Number(style.top || 0)
  const width = Number(style.width || 100)
  const height = Number(style.height || 100)
  const shadow = style.shadow ?? 8
  return [
    box({ position: 'absolute', left: left + shadow, top: top + shadow, width, height, backgroundColor: theme.black }),
    box(
      {
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: style.backgroundColor || theme.paper,
        borderWidth: style.borderWidth || 4,
        borderColor: theme.black,
        padding: style.padding || '28px',
        flexDirection: style.flexDirection || 'column'
      },
      children
    )
  ]
}

function deco(theme, variant = 'pink') {
  const fill = variant === 'green' ? theme.green : variant === 'blue' ? theme.blue : variant === 'yellow' ? theme.yellow : theme.pink
  return box({ width: 44, height: 44, backgroundColor: fill, borderWidth: 3, borderColor: theme.black, transform: 'rotate(8deg)' })
}

function renderCover(spec) {
  const theme = colors(spec)
  return frame(spec, 'cover', [
    ...elevated(theme, { left: 256, top: 136, width: 452, height: 284, padding: '30px 32px' }, [
      label(value(spec, 'eyebrow', DEFAULTS.cover.eyebrow), spec, { width: 142, marginBottom: 16 }),
      headline(value(spec, 'title', DEFAULTS.cover.title), spec, { width: 340, fontSize: 50, lineHeight: 0.92, marginBottom: 16, whiteSpace: 'pre-line' }),
      body(value(spec, 'subtitle', DEFAULTS.cover.subtitle), spec, { width: 320, fontSize: 12, lineHeight: 1.35 })
    ]),
    box({ position: 'absolute', left: 612, top: 112 }, [deco(theme, 'pink')]),
    box({ position: 'absolute', left: 616, top: 348, width: 36, height: 36, borderRadius: 18, backgroundColor: theme.green, borderWidth: 3, borderColor: theme.black }),
    label(value(spec, 'cta', DEFAULTS.cover.cta), spec, { position: 'absolute', left: 294, top: 396, width: 90, backgroundColor: theme.yellow, transform: 'rotate(-2deg)', fontSize: 8 })
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const metrics = objectArray(spec, 'metrics', DEFAULTS.agenda.metrics).slice(0, 3)
  return frame(spec, 'agenda', [
    ...elevated(theme, { left: 72, top: 76, width: 520, height: 330, backgroundColor: theme.paper, padding: '34px 38px' }, [
      label(value(spec, 'eyebrow', DEFAULTS.agenda.eyebrow), spec, { width: 118, backgroundColor: theme.blue, marginBottom: 20 }),
      headline(value(spec, 'title', DEFAULTS.agenda.title), spec, { width: 390, fontSize: 50, marginBottom: 18 }),
      body(value(spec, 'body', DEFAULTS.agenda.body), spec, { width: 390, fontSize: 16, lineHeight: 1.5 })
    ]),
    box({ position: 'absolute', left: 636, top: 104, flexDirection: 'column', gap: 24 }, metrics.map((item, index) =>
      box({ width: 200, height: 82, backgroundColor: [theme.pink, theme.green, theme.yellow][index], borderWidth: 4, borderColor: theme.black, padding: '14px 18px' }, [
        TextBlock(item.value || '', { color: theme.black, fontSize: 32, lineHeight: 1, ...role('metric', spec, { fontSize: 32, lineHeight: 1, fontWeight: 900 }) }),
        label(item.label || '', spec, { marginTop: 8, width: 126, height: 22, padding: '5px 8px', fontSize: 8, backgroundColor: theme.white })
      ])
    ))
  ])
}

function renderFeatures(spec) {
  const theme = colors(spec)
  const items = objectArray(spec, 'items', DEFAULTS.data_dashboard.items).slice(0, 4)
  return frame(spec, 'data_dashboard', [
    label(value(spec, 'eyebrow', DEFAULTS.data_dashboard.eyebrow), spec, { position: 'absolute', left: 70, top: 54, width: 145, backgroundColor: theme.green }),
    headline(value(spec, 'title', DEFAULTS.data_dashboard.title), spec, { position: 'absolute', left: 70, top: 96, width: 560, fontSize: 44 }),
    box({ position: 'absolute', left: 70, top: 174, width: 820, flexDirection: 'row', flexWrap: 'wrap', gap: 22 }, items.map((item, index) =>
      box({ width: 394, height: 126, backgroundColor: [theme.white, theme.blue, theme.green, theme.pink][index], borderWidth: 4, borderColor: theme.black, padding: '22px', flexDirection: 'row', gap: 18 }, [
        box({ width: 58, height: 58, backgroundColor: theme.yellow, borderWidth: 3, borderColor: theme.black, alignItems: 'center', justifyContent: 'center' }, [
          TextBlock(item.letter || String.fromCharCode(65 + index), { color: theme.black, fontSize: 28, lineHeight: 1, textAlign: 'center', ...role('label', spec, { fontSize: 28, lineHeight: 1, fontWeight: 900 }) })
        ]),
        box({ width: 262, flexDirection: 'column' }, [
          headline(item.title || '', spec, { width: 250, fontSize: 20, lineHeight: 1.1, marginBottom: 8 }),
          body(item.body || '', spec, { width: 250, fontSize: 11.5, lineHeight: 1.32 })
        ])
      ])
    ))
  ])
}

function renderChart(spec) {
  const theme = colors(spec)
  const series = objectArray(spec, 'series', DEFAULTS['data_dashboard-4'].series).slice(0, 3)
  const stats = objectArray(spec, 'stats', DEFAULTS['data_dashboard-4'].stats).slice(0, 3)
  return frame(spec, 'data_dashboard-4', [
    label(value(spec, 'eyebrow', DEFAULTS['data_dashboard-4'].eyebrow), spec, { position: 'absolute', left: 60, top: 54, width: 164, backgroundColor: theme.yellow }),
    headline(value(spec, 'title', DEFAULTS['data_dashboard-4'].title), spec, { position: 'absolute', left: 60, top: 96, width: 620, fontSize: 40 }),
    ...elevated(theme, { left: 60, top: 166, width: 536, height: 248, backgroundColor: theme.white, padding: '22px 26px' }, [
      box({ width: 470, height: 190, flexDirection: 'column', gap: 18 }, series.map((row, index) =>
        box({ width: 470, height: 42, flexDirection: 'row', alignItems: 'center', gap: 14 }, [
          label(row.label || '', spec, { width: 84, backgroundColor: theme.paper, fontSize: 8, padding: '6px 7px' }),
          ...((row.values || []).slice(0, 5).map((val) => box({ width: 46, height: Math.max(10, Number(val) * 0.3), backgroundColor: [theme.pink, theme.green, theme.blue][index], borderWidth: 2, borderColor: theme.black, alignSelf: 'flex-end' })))
        ])
      ))
    ]),
    box({ position: 'absolute', left: 650, top: 174, flexDirection: 'column', gap: 20 }, stats.map((item, index) =>
      box({ width: 210, height: 70, backgroundColor: [theme.pink, theme.green, theme.yellow][index], borderWidth: 4, borderColor: theme.black, padding: '12px 16px' }, [
        TextBlock(item.value || '', { color: theme.black, fontSize: 28, lineHeight: 1, ...role('metric', spec, { fontSize: 28, lineHeight: 1, fontWeight: 900 }) }),
        label(item.label || '', spec, { marginTop: 7, width: 150, backgroundColor: theme.white, fontSize: 7.5, padding: '5px 7px' })
      ])
    ))
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote_or_emphasis', [
    box({ position: 'absolute', left: 80, top: 80, width: 800, height: 360, backgroundColor: theme.pink, borderWidth: 5, borderColor: theme.black }),
    TextBlock('"', { position: 'absolute', left: 116, top: 76, color: theme.black, fontSize: 96, lineHeight: 1, ...role('display', spec, { fontSize: 96, lineHeight: 1, fontWeight: 900 }) }),
    headline(value(spec, 'quote', DEFAULTS.quote_or_emphasis.quote), spec, { position: 'absolute', left: 152, top: 156, width: 656, fontSize: 38, lineHeight: 1.14 }),
    label(value(spec, 'author', DEFAULTS.quote_or_emphasis.author), spec, { position: 'absolute', right: 112, bottom: 92, width: 250, backgroundColor: theme.yellow })
  ], { background: theme.blue })
}

function renderMethod(spec) {
  const theme = colors(spec)
  const items = array(spec, 'items', DEFAULTS.process_or_timeline.items).slice(0, 3)
  return frame(spec, 'process_or_timeline', [
    ...elevated(theme, { left: 58, top: 88, width: 332, height: 286, backgroundColor: theme.blue, padding: '28px' }, [
      label(value(spec, 'image_label', DEFAULTS.process_or_timeline.image_label), spec, { width: 160, backgroundColor: theme.white }),
      box({ width: 254, height: 174, marginTop: 26, borderWidth: 4, borderColor: theme.black, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' }, [deco(theme, 'pink')])
    ]),
    label(value(spec, 'eyebrow', DEFAULTS.process_or_timeline.eyebrow), spec, { position: 'absolute', left: 448, top: 76, width: 260, backgroundColor: theme.green }),
    headline(value(spec, 'title', DEFAULTS.process_or_timeline.title), spec, { position: 'absolute', left: 448, top: 126, width: 390, fontSize: 36 }),
    box({ position: 'absolute', left: 448, top: 228, width: 390, flexDirection: 'column', gap: 16 }, items.map((item, index) =>
      box({ width: 390, minHeight: 48, flexDirection: 'row', gap: 16 }, [
        label(String(index + 1).padStart(2, '0'), spec, { width: 46, backgroundColor: theme.yellow }),
        body(item, spec, { width: 300, fontSize: 12.5, lineHeight: 1.35 })
      ])
    ))
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const steps = objectArray(spec, 'steps', DEFAULTS['process_or_timeline-7'].steps).slice(0, 4)
  return frame(spec, 'process_or_timeline-7', [
    label(value(spec, 'eyebrow', DEFAULTS['process_or_timeline-7'].eyebrow), spec, { position: 'absolute', left: 64, top: 54, width: 120, backgroundColor: theme.pink }),
    headline(value(spec, 'title', DEFAULTS['process_or_timeline-7'].title), spec, { position: 'absolute', left: 64, top: 94, width: 520, fontSize: 44 }),
    box({ position: 'absolute', left: 80, top: 196, width: 800, height: 6, backgroundColor: theme.black }),
    box({ position: 'absolute', left: 80, top: 224, flexDirection: 'row', gap: 18 }, steps.map((step, index) =>
      box({ width: 184, height: 170, backgroundColor: [theme.white, theme.blue, theme.green, theme.yellow][index], borderWidth: 4, borderColor: theme.black, padding: '18px', flexDirection: 'column' }, [
        TextBlock(step.num || String(index + 1).padStart(2, '0'), { color: theme.black, fontSize: 34, lineHeight: 1, marginBottom: 12, ...role('metric', spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 }) }),
        headline(step.title || '', spec, { width: 138, fontSize: 20, lineHeight: 1.05, marginBottom: 8 }),
        body(step.body || '', spec, { width: 136, fontSize: 10.5, lineHeight: 1.28 })
      ])
    ))
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const metrics = objectArray(spec, 'metrics', DEFAULTS['data_dashboard-8'].metrics).slice(0, 4)
  return frame(spec, 'data_dashboard-8', [
    label(value(spec, 'eyebrow', DEFAULTS['data_dashboard-8'].eyebrow), spec, { position: 'absolute', left: 70, top: 58, width: 164, backgroundColor: theme.blue }),
    headline(value(spec, 'title', DEFAULTS['data_dashboard-8'].title), spec, { position: 'absolute', left: 70, top: 104, width: 560, fontSize: 46 }),
    box({ position: 'absolute', left: 70, top: 196, width: 820, flexDirection: 'row', flexWrap: 'wrap', gap: 24 }, metrics.map((item, index) =>
      box({ width: 390, height: 112, backgroundColor: [theme.pink, theme.green, theme.yellow, theme.blue][index], borderWidth: 5, borderColor: theme.black, padding: '20px 24px', flexDirection: 'column' }, [
        TextBlock(item.value || '', { color: theme.black, fontSize: 42, lineHeight: 1, marginBottom: 12, ...role('metric', spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 }) }),
        label(item.label || '', spec, { width: 220, backgroundColor: theme.white, fontSize: 9 })
      ])
    ))
  ])
}

function renderTeam(spec) {
  const theme = colors(spec)
  const people = objectArray(spec, 'people', DEFAULTS['process_or_timeline-9'].people).slice(0, 3)
  return frame(spec, 'process_or_timeline-9', [
    label(value(spec, 'eyebrow', DEFAULTS['process_or_timeline-9'].eyebrow), spec, { position: 'absolute', left: 70, top: 54, width: 122, backgroundColor: theme.green }),
    headline(value(spec, 'title', DEFAULTS['process_or_timeline-9'].title), spec, { position: 'absolute', left: 70, top: 100, width: 520, fontSize: 46 }),
    box({ position: 'absolute', left: 70, top: 190, width: 820, flexDirection: 'row', gap: 24 }, people.map((person, index) =>
      box({ width: 257, height: 218, backgroundColor: [theme.white, theme.blue, theme.pink][index], borderWidth: 4, borderColor: theme.black, padding: '22px', flexDirection: 'column' }, [
        box({ width: 64, height: 64, backgroundColor: [theme.pink, theme.yellow, theme.green][index], borderWidth: 3, borderColor: theme.black, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, [
          TextBlock(person.initials || '', { color: theme.black, fontSize: 24, lineHeight: 1, textAlign: 'center', ...role('label', spec, { fontSize: 24, lineHeight: 1, fontWeight: 900 }) })
        ]),
        headline(person.name || '', spec, { width: 190, fontSize: 21, lineHeight: 1.05 }),
        label(person.role || '', spec, { width: 156, marginTop: 8, marginBottom: 10, fontSize: 8, backgroundColor: theme.white }),
        body(person.body || '', spec, { width: 190, fontSize: 11, lineHeight: 1.3 })
      ])
    ))
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  return frame(spec, 'closing', [
    box({ position: 'absolute', left: 98, top: 96, width: 764, height: 300, backgroundColor: theme.green, borderWidth: 5, borderColor: theme.black }),
    headline(value(spec, 'title', DEFAULTS.closing.title), spec, { position: 'absolute', left: 148, top: 138, width: 650, fontSize: 56, lineHeight: 0.94, whiteSpace: 'pre-line' }),
    body(value(spec, 'subtitle', DEFAULTS.closing.subtitle), spec, { position: 'absolute', left: 154, top: 286, width: 440, fontSize: 18, lineHeight: 1.4 }),
    label(value(spec, 'cta', DEFAULTS.closing.cta), spec, { position: 'absolute', left: 154, top: 340, width: 150, backgroundColor: theme.yellow }),
    box({ position: 'absolute', right: 116, top: 120 }, [deco(theme, 'pink')]),
    box({ position: 'absolute', right: 150, bottom: 110, width: 52, height: 52, borderRadius: 26, backgroundColor: theme.blue, borderWidth: 4, borderColor: theme.black })
  ], { background: theme.pink })
}

const RENDERERS = {
  cover: renderCover,
  agenda: renderAgenda,
  data_dashboard: renderFeatures,
  'data_dashboard-4': renderChart,
  quote_or_emphasis: renderQuote,
  process_or_timeline: renderMethod,
  'process_or_timeline-7': renderTimeline,
  'data_dashboard-8': renderStats,
  'process_or_timeline-9': renderTeam,
  closing: renderClosing
}

export function renderBlockFrameGrid(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
