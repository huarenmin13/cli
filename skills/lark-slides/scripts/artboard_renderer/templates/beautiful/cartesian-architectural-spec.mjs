import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'architectural-spec'

const PAGE_VARIANTS = [
  'title',
  'agenda',
  'statement',
  'barchart',
  'twocol',
  'cards',
  'linechart',
  'timeline',
  'team',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'cartesian',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'cartesian',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['title', 'agenda', 'closing'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['title', 'agenda', 'closing'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/cartesian-1.png'
}

const DEFAULTS = {
  title: {
    eyebrow: 'Presentation Template',
    title: 'Cartesian',
    subtitle: 'A minimalist framework for strategic narratives. Clean geometry meets editorial refinement.'
  },
  agenda: {
    title: 'Session Agenda',
    body: 'An outline of key discussion points structured to guide our strategic conversation forward.',
    items: ['Market Position Analysis', 'Core Value Proposition', 'Growth Trajectory', 'Implementation Roadmap']
  },
  statement: {
    title: 'Precision vs Signal',
    quote: 'Precision in approach defines the boundary between noise and signal.',
    author: 'Research Note'
  },
  barchart: {
    title: 'Quarterly Metrics',
    body: 'Comparative analysis across key business indicators demonstrating sustained momentum and operational efficiency.',
    bars: [
      { label: 'Revenue', value: 72 },
      { label: 'Retention', value: 54 },
      { label: 'Reach', value: 83 },
      { label: 'Quality', value: 62 }
    ]
  },
  twocol: {
    title: 'Structural Overview',
    body: 'A comprehensive examination of foundational elements that define our operational framework and strategic positioning within the market landscape.',
    note: 'Through iterative refinement and measured adaptation, the methodology ensures alignment with evolving objectives and stakeholder expectations.',
    stats: [
      { value: '47%', label: 'Efficiency' },
      { value: '12x', label: 'Scale' },
      { value: '3.2M', label: 'Reach' }
    ]
  },
  cards: {
    title: 'Core Competencies',
    cards: [
      { mark: 'I', title: 'Analytical Depth', body: 'Rigorous data-driven methodologies that transform raw information into actionable strategic intelligence.' },
      { mark: 'II', title: 'Operational Scale', body: 'Streamlined processes designed to expand seamlessly while maintaining quality and consistency.' },
      { mark: 'III', title: 'Adaptive Design', body: 'Flexible frameworks that evolve with changing conditions and emerging opportunities.' }
    ]
  },
  linechart: {
    title: 'Growth Projection',
    body: 'Multi-year trajectory illustrating compound growth patterns and market penetration metrics.',
    points: [22, 32, 45, 58, 74, 86]
  },
  timeline: {
    title: 'Implementation Phases',
    steps: [
      { year: '01', title: 'Discovery', body: 'Initial assessment and comprehensive audit of existing systems and processes.' },
      { year: '02', title: 'Strategy', body: 'Development of tailored frameworks aligned with organizational objectives.' },
      { year: '03', title: 'Execution', body: 'Phased rollout with continuous monitoring and iterative optimization.' },
      { year: '04', title: 'Scale', body: 'Expansion of proven methodologies across all operational units.' }
    ]
  },
  team: {
    title: 'Key Contributors',
    people: [
      { initial: 'A', name: 'Alex Morgan', role: 'Research Lead' },
      { initial: 'J', name: 'Jordan Lee', role: 'Strategy Partner' },
      { initial: 'S', name: 'Sam Taylor', role: 'Design Systems' },
      { initial: 'R', name: 'Reese Park', role: 'Operations' }
    ]
  },
  closing: {
    title: 'Thank You',
    subtitle: 'Questions & Discussion',
    contact: 'research@example.com'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || source.bg_primary || '#EDE8E0',
    stone: source.surface || source.bg_secondary || '#E2DBD1',
    ink: source.text || source.text_primary || '#1A1A1A',
    muted: source.muted || source.text_secondary || '#5A5A5A',
    line: source.line || source.border || '#B8B0A4',
    accent: source.accent || source.primary || '#8A8178',
    veil: '#F4F0E8'
  }
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
  if (raw.includes('cover') || raw.includes('title')) return 'title'
  if (raw.includes('agenda')) return 'agenda'
  if (raw.includes('quote') || raw.includes('statement')) return 'statement'
  if (raw.includes('bar') || raw.includes('chart') || raw.includes('data')) return 'barchart'
  if (raw.includes('detail') || raw.includes('two')) return 'twocol'
  if (raw.includes('card') || raw.includes('content')) return 'cards'
  if (raw.includes('timeline') || raw.includes('process')) return 'timeline'
  if (raw.includes('comparison') || raw.includes('team')) return 'team'
  if (raw.includes('closing') || raw.includes('end')) return 'closing'
  return 'title'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function label(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(String(text || '').toUpperCase(), {
    color: theme.accent,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 500, letterSpacing: 2.4, textTransform: 'uppercase' }),
    ...style
  })
}

function body(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 1.55,
    ...role('body', spec, { fontSize: 14, lineHeight: 1.55, fontWeight: 400 }),
    ...style
  })
}

function serif(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(text, {
    color: theme.ink,
    fontSize: 52,
    lineHeight: 1.06,
    ...role('display', spec, { fontSize: 52, lineHeight: 1.06, fontWeight: 400 }),
    ...style
  })
}

function metric(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.ink,
    fontSize: 36,
    lineHeight: 1,
    ...role('metric', spec, { fontSize: 36, lineHeight: 1, fontWeight: 400 }),
    ...style
  })
}

function line(style = {}) {
  return box({ position: 'absolute', height: 1, backgroundColor: '#B8B0A4', ...style })
}

function ring(style = {}) {
  return box({ position: 'absolute', borderWidth: 1, borderColor: '#B8B0A4', borderRadius: 999, ...style })
}

function frame(spec, variant, children = []) {
  const theme = colors(spec)
  const page = String(variantPage(spec, variant)).padStart(2, '0')
  return box(
    { width: 960, height: 540, position: 'relative', backgroundColor: theme.paper, color: theme.ink, overflow: 'hidden' },
    [
      line({ left: 76, top: 0, width: 1, height: 540, opacity: 0.34 }),
      line({ left: 38, bottom: 54, width: 884, opacity: 0.52 }),
      ring({ right: 54, top: 88, width: 240, height: 240, opacity: 0.22 }),
      ring({ right: 90, top: 124, width: 168, height: 168, opacity: 0.18, borderStyle: 'dashed' }),
      label('Axis System', spec, { position: 'absolute', left: 38, bottom: 25, width: 180 }),
      label(page, spec, { position: 'absolute', right: 38, bottom: 25, width: 90, textAlign: 'right' }),
      ...children
    ]
  )
}

function navDots(spec, active) {
  const theme = colors(spec)
  return box(
    { position: 'absolute', right: 38, top: 210, width: 8, flexDirection: 'column' },
    PAGE_VARIANTS.map((_, index) =>
      box({
        width: index === active ? 7 : 5,
        height: index === active ? 7 : 5,
        borderRadius: 4,
        backgroundColor: index === active ? theme.ink : theme.line,
        marginBottom: 8,
        marginLeft: index === active ? 0 : 1
      })
    )
  )
}

function renderTitle(spec) {
  const theme = colors(spec)
  return frame(spec, 'title', [
    label(value(spec, 'eyebrow', DEFAULTS.title.eyebrow), spec, { position: 'absolute', left: 92, top: 178 }),
    serif(value(spec, 'title', DEFAULTS.title.title), spec, { position: 'absolute', left: 92, top: 218, width: 430, fontSize: 72, lineHeight: 0.98 }),
    body(value(spec, 'subtitle', DEFAULTS.title.subtitle), spec, { position: 'absolute', left: 94, top: 306, width: 408, fontSize: 15, lineHeight: 1.48 }),
    ring({ left: 604, top: 184, width: 276, height: 276, opacity: 0.68 }),
    ring({ left: 633, top: 213, width: 218, height: 218, opacity: 0.52, borderStyle: 'dashed' }),
    line({ left: 622, top: 321, width: 240, backgroundColor: theme.ink, opacity: 0.86 }),
    navDots(spec, 0)
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const items = array(spec, 'items', DEFAULTS.agenda.items).slice(0, 4)
  return frame(spec, 'agenda', [
    serif(value(spec, 'title', DEFAULTS.agenda.title), spec, { position: 'absolute', left: 94, top: 122, width: 310, fontSize: 44 }),
    body(value(spec, 'body', DEFAULTS.agenda.body), spec, { position: 'absolute', left: 96, top: 220, width: 290 }),
    box({ position: 'absolute', left: 482, top: 112, width: 370, flexDirection: 'column' }, items.map((item, index) =>
      box({ width: 370, height: 68, borderBottomWidth: 1, borderColor: theme.line, flexDirection: 'row', alignItems: 'center' }, [
        metric(String(index + 1).padStart(2, '0'), spec, { width: 66, color: theme.accent, fontSize: 25 }),
        label(item, spec, { width: 270, color: theme.ink, letterSpacing: 1.6 })
      ])
    )),
    navDots(spec, 1)
  ])
}

function renderStatement(spec) {
  const theme = colors(spec)
  return frame(spec, 'statement', [
    TextBlock('“', { position: 'absolute', left: 92, top: 100, color: theme.line, fontSize: 118, lineHeight: 1, ...role('display', spec, { fontSize: 118, lineHeight: 1, fontWeight: 400 }) }),
    serif(value(spec, 'quote', DEFAULTS.statement.quote), spec, { position: 'absolute', left: 156, top: 166, width: 670, fontSize: 48, lineHeight: 1.13 }),
    label(value(spec, 'author', DEFAULTS.statement.author), spec, { position: 'absolute', left: 160, top: 384, width: 260 }),
    line({ left: 160, top: 356, width: 220, backgroundColor: theme.ink }),
    navDots(spec, 2)
  ])
}

function renderBarchart(spec) {
  const theme = colors(spec)
  const bars = objectArray(spec, 'bars', DEFAULTS.barchart.bars).slice(0, 4)
  return frame(spec, 'barchart', [
    serif(value(spec, 'title', DEFAULTS.barchart.title), spec, { position: 'absolute', left: 94, top: 102, width: 340, fontSize: 44 }),
    body(value(spec, 'body', DEFAULTS.barchart.body), spec, { position: 'absolute', left: 96, top: 204, width: 332 }),
    box({ position: 'absolute', left: 504, top: 116, width: 330, height: 254, flexDirection: 'row', alignItems: 'flex-end' }, bars.map((bar, index) =>
      box({ width: 58, height: Math.max(42, Number(bar.value || 50) * 2.36), backgroundColor: index === 0 ? theme.ink : theme.line, marginRight: 24, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }, [
        label(String(bar.value || ''), spec, { color: index === 0 ? theme.paper : theme.ink, fontSize: 8, letterSpacing: 1.2, textAlign: 'center' })
      ])
    )),
    line({ left: 492, top: 384, width: 372 }),
    ...bars.map((bar, index) => label(bar.label || '', spec, { position: 'absolute', left: 495 + index * 82, top: 402, width: 76, fontSize: 7, letterSpacing: 1.1, textAlign: 'center' })),
    navDots(spec, 3)
  ])
}

function renderTwocol(spec) {
  const theme = colors(spec)
  const stats = objectArray(spec, 'stats', DEFAULTS.twocol.stats).slice(0, 3)
  return frame(spec, 'twocol', [
    box({ position: 'absolute', left: 92, top: 116, width: 360, height: 250, backgroundColor: theme.stone, borderWidth: 1, borderColor: theme.line }),
    line({ left: 92, top: 116, width: 360, height: 250, backgroundColor: 'transparent', borderBottomWidth: 1, borderColor: theme.line, transform: 'rotate(32deg)', transformOrigin: '0 0' }),
    line({ left: 92, top: 366, width: 360, backgroundColor: 'transparent', borderBottomWidth: 1, borderColor: theme.line, transform: 'rotate(-32deg)', transformOrigin: '0 0' }),
    label('image placeholder', spec, { position: 'absolute', left: 172, top: 232, width: 200, textAlign: 'center' }),
    serif(value(spec, 'title', DEFAULTS.twocol.title), spec, { position: 'absolute', left: 526, top: 112, width: 310, fontSize: 42 }),
    body(value(spec, 'body', DEFAULTS.twocol.body), spec, { position: 'absolute', left: 528, top: 214, width: 300, fontSize: 12.5, lineHeight: 1.42 }),
    body(value(spec, 'note', DEFAULTS.twocol.note), spec, { position: 'absolute', left: 528, top: 286, width: 300, fontSize: 12.5, lineHeight: 1.42 }),
    box({ position: 'absolute', left: 526, top: 346, width: 314, flexDirection: 'row' }, stats.map((item) =>
      box({ width: 96, minHeight: 58, marginRight: 12, borderTopWidth: 1, borderColor: theme.line, paddingTop: 12, flexDirection: 'column' }, [
        metric(item.value || '', spec, { fontSize: 25, marginBottom: 6 }),
        label(item.label || '', spec, { fontSize: 7, letterSpacing: 1.2 })
      ])
    )),
    navDots(spec, 4)
  ])
}

function renderCards(spec) {
  const theme = colors(spec)
  const cards = objectArray(spec, 'cards', DEFAULTS.cards.cards).slice(0, 3)
  return frame(spec, 'cards', [
    serif(value(spec, 'title', DEFAULTS.cards.title), spec, { position: 'absolute', left: 96, top: 82, width: 470, fontSize: 42 }),
    box({ position: 'absolute', left: 96, top: 180, width: 760, flexDirection: 'row' }, cards.map((card) =>
      box({ width: 232, minHeight: 218, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.veil, padding: '30px 22px', marginRight: 32, flexDirection: 'column' }, [
        box({ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.line, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }, [
          label(card.mark || '', spec, { color: theme.accent, fontSize: 9, textAlign: 'center' })
        ]),
        serif(card.title || '', spec, { fontSize: 23, lineHeight: 1.08, marginBottom: 14 }),
        body(card.body || '', spec, { fontSize: 12, lineHeight: 1.45 })
      ])
    )),
    navDots(spec, 5)
  ])
}

function renderLinechart(spec) {
  const theme = colors(spec)
  const points = array(spec, 'points', DEFAULTS.linechart.points).slice(0, 6).map((point) => Number(point) || 20)
  return frame(spec, 'linechart', [
    serif(value(spec, 'title', DEFAULTS.linechart.title), spec, { position: 'absolute', left: 94, top: 92, width: 400, fontSize: 42 }),
    body(value(spec, 'body', DEFAULTS.linechart.body), spec, { position: 'absolute', left: 96, top: 194, width: 360, fontSize: 13.5, lineHeight: 1.45 }),
    box({ position: 'absolute', left: 136, top: 278, width: 684, height: 1, backgroundColor: theme.line }),
    box({ position: 'absolute', left: 136, top: 342, width: 684, height: 1, backgroundColor: theme.line }),
    box({ position: 'absolute', left: 136, top: 406, width: 684, height: 1, backgroundColor: theme.line }),
    ...points.map((point, index) => box({ position: 'absolute', left: 152 + index * 118, top: 424 - point * 2, width: 14, height: 14, borderRadius: 7, backgroundColor: theme.ink })),
    ...points.slice(0, -1).map((point, index) => {
      const next = points[index + 1]
      const y1 = 431 - point * 2
      const y2 = 431 - next * 2
      const y = Math.min(y1, y2)
      const height = Math.max(1, Math.abs(y2 - y1))
      return line({ left: 164 + index * 118, top: y, width: 122, height, backgroundColor: theme.ink, opacity: 0.42 })
    }),
    navDots(spec, 6)
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const steps = objectArray(spec, 'steps', DEFAULTS.timeline.steps).slice(0, 4)
  return frame(spec, 'timeline', [
    serif(value(spec, 'title', DEFAULTS.timeline.title), spec, { position: 'absolute', left: 94, top: 82, width: 440, fontSize: 42 }),
    line({ left: 120, top: 306, width: 724 }),
    ...steps.map((step, index) =>
      box({ position: 'absolute', left: 120 + index * 180, top: 224, width: 154, minHeight: 158, flexDirection: 'column' }, [
        metric(step.year || String(index + 1).padStart(2, '0'), spec, { color: theme.accent, fontSize: 24, marginBottom: 38 }),
        box({ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.ink, marginBottom: 24 }),
        serif(step.title || '', spec, { fontSize: 22, lineHeight: 1.05, marginBottom: 12 }),
        body(step.body || '', spec, { fontSize: 11.5, lineHeight: 1.38, width: 150 })
      ])
    ),
    navDots(spec, 7)
  ])
}

function renderTeam(spec) {
  const theme = colors(spec)
  const people = objectArray(spec, 'people', DEFAULTS.team.people).slice(0, 4)
  return frame(spec, 'team', [
    serif(value(spec, 'title', DEFAULTS.team.title), spec, { position: 'absolute', left: 96, top: 80, width: 420, fontSize: 42 }),
    box({ position: 'absolute', left: 112, top: 188, width: 736, flexDirection: 'row' }, people.map((person) =>
      box({ width: 154, minHeight: 220, marginRight: 40, alignItems: 'center', flexDirection: 'column' }, [
        box({ width: 110, height: 110, borderRadius: 55, backgroundColor: theme.stone, borderWidth: 1, borderColor: theme.line, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }, [
          metric(person.initial || '', spec, { color: theme.accent, fontSize: 34, textAlign: 'center' })
        ]),
        serif(person.name || '', spec, { fontSize: 20, lineHeight: 1.05, textAlign: 'center', marginBottom: 12 }),
        label(person.role || '', spec, { fontSize: 7.5, letterSpacing: 1.3, textAlign: 'center', width: 140 })
      ])
    )),
    navDots(spec, 8)
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  return frame(spec, 'closing', [
    ring({ left: 343, top: 116, width: 274, height: 274, opacity: 0.4 }),
    ring({ left: 382, top: 155, width: 196, height: 196, opacity: 0.28 }),
    line({ left: 468, top: 166, width: 28, backgroundColor: theme.ink }),
    serif(value(spec, 'title', DEFAULTS.closing.title), spec, { position: 'absolute', left: 330, top: 206, width: 300, fontSize: 42, lineHeight: 1, textAlign: 'center' }),
    body(value(spec, 'subtitle', DEFAULTS.closing.subtitle), spec, { position: 'absolute', left: 300, top: 278, width: 360, textAlign: 'center' }),
    label(value(spec, 'contact', DEFAULTS.closing.contact), spec, { position: 'absolute', left: 330, top: 344, width: 300, textAlign: 'center', fontSize: 8 }),
    navDots(spec, 9)
  ])
}

const RENDERERS = {
  title: renderTitle,
  agenda: renderAgenda,
  statement: renderStatement,
  barchart: renderBarchart,
  twocol: renderTwocol,
  cards: renderCards,
  linechart: renderLinechart,
  timeline: renderTimeline,
  team: renderTeam,
  closing: renderClosing
}

export function renderCartesianArchitecturalSpec(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderTitle)(spec)
}
