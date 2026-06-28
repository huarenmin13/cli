import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'playful-indie-launch'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'toc', 'statement', 'chart', 'team', 'services', 'timeline', 'stats', 'gallery', 'closing']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'playful',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'playful',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'toc', 'statement', 'team', 'gallery', 'closing'],
      repeatable: ['chart', 'services', 'timeline', 'stats']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/playful-1.png'
}

const DEFAULTS = {
  cover: {
    date: '02.05.26',
    title: 'Creative Direction\n& Visual Systems',
    subtitle: 'A warm deck for bold ideas, raw expression, and unfiltered storytelling.',
    vertical: 'SCROLL DOWN ->',
    footer: 'Indie studio field deck',
    pageno: '01 / 10'
  },
  toc: {
    label: 'Overview',
    title: 'What We Will\nCover Today',
    items: [
      { num: '01', label: 'Vision & Mission Statement' },
      { num: '02', label: 'Market Analysis & Data Insights' },
      { num: '03', label: 'Team Structure & Leadership' },
      { num: '04', label: 'Core Services & Offerings' },
      { num: '05', label: 'Process & Workflow Timeline' },
      { num: '06', label: 'Results, Metrics & Impact' }
    ],
    pageno: '02 / 10'
  },
  statement: {
    title: 'Raw expression over polished perfection.',
    columns: [
      'Our approach combines strategic thinking with intuitive design. We build visual systems that adapt, evolve, and resonate with audiences across cultures and contexts.',
      'Founded in 2019, we have partnered with independent artists, cultural institutions, and forward-thinking brands to create work that challenges conventions.'
    ],
    pageno: '03 / 10'
  },
  chart: {
    title: 'Growth Metrics\nOver Four Quarters',
    legends: ['Revenue', 'Engagement'],
    values: [
      { label: 'Q1', a: 45, b: 30 },
      { label: 'Q2', a: 60, b: 50 },
      { label: 'Q3', a: 75, b: 65 },
      { label: 'Q4', a: 90, b: 85 },
      { label: 'Q5', a: 100, b: 95 }
    ],
    pageno: '04 / 10'
  },
  team: {
    title: 'The Collective',
    subtitle: 'Four perspectives, one shared obsession with craft.',
    people: [
      { name: 'Alex Chen', role: 'Creative Director' },
      { name: 'Mira Okafor', role: 'Strategy Lead' },
      { name: 'Jonas Weber', role: 'Visual Designer' },
      { name: 'Suki Tanaka', role: 'Motion Artist' }
    ],
    pageno: '05 / 10'
  },
  services: {
    title: 'What We\nDo Best',
    blocks: [
      { num: '01', title: 'Brand Identity', desc: 'Visual systems that capture essence and scale across every touchpoint.' },
      { num: '02', title: 'Art Direction', desc: 'Creative vision for campaigns, editorial, and cultural projects.', filled: true },
      { num: '03', title: 'Motion Design', desc: 'Animation and kinetic identity that brings static brands to life.' },
      { num: '04', title: 'Digital Experiences', desc: 'Websites and interactive platforms with personality and purpose.' },
      { num: '05', title: 'Typography', desc: 'Custom letterforms and type systems for distinctive voices.', filled: true }
    ],
    pageno: '06 / 10'
  },
  timeline: {
    title: 'Our Process\nin Five Steps',
    steps: [
      { num: '1', title: 'Discover', desc: 'Research, interviews, and competitive landscape analysis' },
      { num: '2', title: 'Define', desc: 'Strategic positioning and core narrative development' },
      { num: '3', title: 'Design', desc: 'Visual exploration, prototyping, and iteration cycles' },
      { num: '4', title: 'Develop', desc: 'Production, asset creation, and implementation support' },
      { num: '5', title: 'Deploy', desc: 'Launch support and ongoing performance measurement' }
    ],
    pageno: '07 / 10'
  },
  stats: {
    title: 'Impact by\nthe Numbers',
    stats: [
      { value: '47', label: 'Projects delivered across three continents in the last year' },
      { value: '12', label: 'Industry awards and recognitions for creative excellence' },
      { value: '98%', label: 'Client retention rate with ongoing partnerships' }
    ],
    pageno: '08 / 10'
  },
  gallery: {
    title: 'Selected Works',
    subtitle: 'A glimpse into recent collaborations and independent projects.',
    items: [
      { label: 'IMG 01', tag: 'Editorial' },
      { label: 'IMG 02', tag: 'Identity' },
      { label: 'IMG 03', tag: 'Motion' },
      { label: 'IMG 04', tag: 'Campaign' }
    ],
    pageno: '09 / 10'
  },
  closing: {
    title: 'Thank You\nLet Us Talk',
    subtitle: 'Questions, projects, or just a conversation about ideas.',
    contacts: ['hello@example.studio', '+1 (555) 000 1234', 'www.example.studio'],
    pageno: '10 / 10'
  }
}

function theme() {
  return {
    bg: '#F0C8A0',
    bgAlt: '#E8B88E',
    light: '#F7DEC6',
    ink: '#1A1A1A',
    inkSoft: 'rgba(26,26,26,0.72)',
    inkFaint: 'rgba(26,26,26,0.16)'
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
  if (raw.includes('statement') || raw.includes('vision') || raw.includes('quote')) return 'statement'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('team') || raw.includes('people')) return 'team'
  if (raw.includes('service') || raw.includes('offer')) return 'services'
  if (raw.includes('timeline') || raw.includes('process') || raw.includes('roadmap')) return 'timeline'
  if (raw.includes('stat') || raw.includes('metric')) return 'stats'
  if (raw.includes('gallery') || raw.includes('work')) return 'gallery'
  if (raw.includes('closing') || raw.includes('close') || raw.includes('cta')) return 'closing'
  return 'cover'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function display(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: theme().ink,
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 0.94,
    letterSpacing: -1.1,
    whiteSpace: 'pre-line',
    ...role('display', spec, { fontWeight: 800, lineHeight: 0.94, letterSpacing: -1.1 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: theme().ink,
    fontSize: 66,
    fontWeight: 800,
    lineHeight: 0.92,
    letterSpacing: -1.5,
    whiteSpace: 'pre-line',
    ...role('metric', spec, { fontWeight: 800, lineHeight: 0.92, letterSpacing: -1.5 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: theme().ink,
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.58,
    ...role('body', spec, { fontWeight: 400, lineHeight: 1.58 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: theme().inkSoft,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 600, lineHeight: 1.15, letterSpacing: 1.8, textTransform: 'uppercase' }),
    ...style
  })
}

function surface(children = []) {
  const t = theme()
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: t.bg,
      color: t.ink
    },
    [
      box({ position: 'absolute', right: -80, bottom: -90, width: 300, height: 260, borderRadius: '44% 56% 63% 37% / 46% 43% 57% 54%', backgroundColor: t.ink, opacity: 0.05 }),
      ...textureDots(t),
      ...children
    ]
  )
}

function textureDots(t) {
  return Array.from({ length: 10 }, (_, index) =>
    box({
      position: 'absolute',
      left: 70 + (index % 5) * 18,
      top: 74 + Math.floor(index / 5) * 18,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.ink,
      opacity: 0.18
    })
  )
}

function footer(spec, c) {
  return box({ position: 'absolute', left: 50, right: 50, bottom: 26, height: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
    label(c.footer || 'Playful source family render', spec, { fontSize: 8, letterSpacing: 1.2, opacity: 0.7 }),
    label(c.pageno || '', spec, { fontSize: 8, letterSpacing: 1.2, opacity: 0.7, textAlign: 'right' })
  ])
}

function roughBox(children = [], style = {}, offset = { x: 7, y: 7 }) {
  const t = theme()
  return box(
    {
      position: 'relative',
      borderWidth: 3,
      borderColor: t.ink,
      backgroundColor: t.bg,
      overflow: 'visible',
      ...style
    },
    [
      box({
        position: 'absolute',
        left: offset.x,
        top: offset.y,
        right: -offset.x,
        bottom: -offset.y,
        borderWidth: 2,
        borderColor: t.ink,
        opacity: 0.96
      }),
      box({ position: 'relative', width: '100%', height: '100%', flexDirection: 'column' }, children)
    ]
  )
}

function inkBlock(children = [], style = {}) {
  const t = theme()
  return box({ flexDirection: 'column', backgroundColor: t.ink, color: t.bg, borderWidth: 3, borderColor: t.ink, ...style }, children)
}

function doodleLine(style = {}) {
  const t = theme()
  return box({ position: 'absolute', width: 100, height: 2, backgroundColor: t.ink, borderRadius: 2, ...style })
}

function doodleCircle(style = {}) {
  const t = theme()
  return box({ position: 'absolute', width: 72, height: 72, borderWidth: 3, borderColor: t.ink, borderRadius: 999, ...style })
}

function blobFrame(style = {}, filled = true) {
  const t = theme()
  return box(
    {
      position: 'absolute',
      borderWidth: 3,
      borderColor: t.ink,
      borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    },
    filled ? [
      box({ width: '64%', height: '66%', backgroundColor: t.ink, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' })
    ] : []
  )
}

function renderCover(spec) {
  const c = content(spec, 'cover')
  return surface([
    metric(c.date, spec, { position: 'absolute', left: 88, top: 166, width: 390, fontSize: 76 }),
    display(c.title, spec, { position: 'absolute', left: 92, top: 250, width: 500, fontSize: 42, lineHeight: 1.02 }),
    body(c.subtitle, spec, { position: 'absolute', left: 96, top: 360, width: 370, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }),
    blobFrame({ right: 92, top: 80, width: 210, height: 245 }),
    blobFrame({ right: 258, bottom: 82, width: 112, height: 132, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }, false),
    label(c.vertical, spec, { position: 'absolute', right: 22, top: 248, width: 180, transform: 'rotate(90deg)', color: theme().ink, fontSize: 13, letterSpacing: 2.0 }),
    doodleLine({ left: 54, bottom: 86, width: 98, transform: 'rotate(-12deg)' }),
    doodleLine({ left: 72, bottom: 104, width: 70, transform: 'rotate(8deg)' }),
    footer(spec, c)
  ])
}

function renderToc(spec) {
  const c = content(spec, 'toc')
  const items = Array.isArray(c.items) ? c.items.slice(0, 6) : DEFAULTS.toc.items
  return surface([
    label(c.label, spec, { position: 'absolute', left: 64, top: 52 }),
    display(c.title, spec, { position: 'absolute', left: 64, top: 86, width: 430, fontSize: 39, lineHeight: 1.04 }),
    box({ position: 'absolute', left: 64, top: 210, width: 650, height: 246, flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, items.map((item, idx) =>
      roughBox([
        metric(item.num, spec, { fontSize: 32, lineHeight: 0.9, marginBottom: 8 }),
        body(item.label, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.25, width: 230 })
      ], { width: 304, height: 66, padding: 16, transform: `rotate(${[-0.6, 0.7, 0.4, -0.5, 0.5, -0.4][idx]}deg)` })
    )),
    doodleCircle({ right: 88, top: 84, width: 150, height: 150, borderRadius: '44% 56% 62% 38% / 51% 39% 61% 49%' }),
    doodleLine({ right: 122, top: 155, width: 82, transform: 'rotate(23deg)' }),
    doodleLine({ right: 117, top: 180, width: 102, transform: 'rotate(-16deg)' }),
    footer(spec, c)
  ])
}

function renderStatement(spec) {
  const c = content(spec, 'statement')
  const columns = Array.isArray(c.columns) ? c.columns.slice(0, 2) : DEFAULTS.statement.columns
  return surface([
    display(c.title, spec, { position: 'absolute', left: 78, top: 104, width: 670, fontSize: 42, lineHeight: 1.08 }),
    box({ position: 'absolute', left: 82, top: 350, width: 530, height: 105, flexDirection: 'row', gap: 34 }, columns.map((text) =>
      body(text, spec, { width: 248, fontSize: 12, lineHeight: 1.55, opacity: 0.9 })
    )),
    blobFrame({ right: 82, top: 132, width: 150, height: 220, borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }),
    doodleCircle({ left: 38, bottom: 58, width: 72, height: 72 }),
    doodleCircle({ left: 54, bottom: 74, width: 42, height: 42 }),
    footer(spec, c)
  ])
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const values = Array.isArray(c.values) ? c.values.slice(0, 5) : DEFAULTS.chart.values
  const chartLeft = 92
  const chartTop = 222
  const chartHeight = 205
  return surface([
    box({ position: 'absolute', left: 64, right: 64, top: 54, height: 92, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, [
      display(c.title, spec, { width: 440, fontSize: 38, lineHeight: 1.05 }),
      box({ width: 220, flexDirection: 'row', gap: 22, justifyContent: 'flex-end', marginTop: 8 }, (c.legends || DEFAULTS.chart.legends).map((legend, idx) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: 8 }, [
          box({ width: 12, height: 12, backgroundColor: idx === 0 ? theme().ink : 'transparent', borderWidth: idx === 1 ? 2 : 0, borderColor: theme().ink }),
          body(legend, spec, { fontSize: 10, lineHeight: 1.0, fontWeight: 500 })
        ])
      ))
    ]),
    box({ position: 'absolute', left: chartLeft, top: chartTop, width: 660, height: chartHeight, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: theme().ink, alignItems: 'flex-end', flexDirection: 'row', gap: 22, paddingLeft: 38, paddingBottom: 24 }, values.map((item) =>
      box({ width: 84, height: chartHeight - 24, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column', gap: 7 }, [
        box({ width: 36, height: Math.max(20, (item.a || 0) * 1.45), backgroundColor: theme().ink }),
        box({ width: 36, height: Math.max(20, (item.b || 0) * 1.25), borderWidth: 3, borderColor: theme().ink }),
        body(item.label, spec, { fontSize: 10, fontWeight: 600, lineHeight: 1.0 })
      ])
    )),
    box({ position: 'absolute', left: 60, top: chartTop - 4, height: chartHeight - 24, flexDirection: 'column', justifyContent: 'space-between' }, ['100', '75', '50', '25', '0'].map((tick) =>
      body(tick, spec, { fontSize: 9, fontWeight: 500, lineHeight: 1 })
    )),
    doodleLine({ right: 110, top: 178, width: 80, transform: 'rotate(28deg)' }),
    doodleLine({ right: 130, top: 178, width: 80, transform: 'rotate(-28deg)' }),
    doodleLine({ right: 150, top: 150, width: 60, transform: 'rotate(90deg)' }),
    footer(spec, c)
  ])
}

function renderTeam(spec) {
  const c = content(spec, 'team')
  const people = Array.isArray(c.people) ? c.people.slice(0, 4) : DEFAULTS.team.people
  return surface([
    display(c.title, spec, { position: 'absolute', left: 64, top: 54, width: 500, fontSize: 43 }),
    body(c.subtitle, spec, { position: 'absolute', left: 67, top: 111, width: 430, fontSize: 13, opacity: 0.78 }),
    box({ position: 'absolute', left: 64, right: 64, top: 188, height: 210, flexDirection: 'row', gap: 24, alignItems: 'center' }, people.map((person, idx) =>
      roughBox([
        box({ width: 60, height: 60, borderRadius: 30, backgroundColor: theme().ink, marginBottom: 20 }),
        display(person.name, spec, { fontSize: 20, lineHeight: 1.06, marginBottom: 8, width: 145 }),
        body(person.role, spec, { fontSize: 11, lineHeight: 1.2, opacity: 0.74, width: 140 })
      ], { width: 176, height: 180, padding: 22, transform: `rotate(${[0, 1.2, -1, 0.6][idx]}deg)` })
    )),
    doodleLine({ right: 88, bottom: 96, width: 130, transform: 'rotate(-11deg)' }),
    doodleLine({ right: 98, bottom: 116, width: 104, transform: 'rotate(11deg)' }),
    footer(spec, c)
  ])
}

function renderServices(spec) {
  const c = content(spec, 'services')
  const blocks = Array.isArray(c.blocks) ? c.blocks.slice(0, 5) : DEFAULTS.services.blocks
  const positions = [
    { left: 442, top: 150, width: 190, height: 128, rot: -0.6 },
    { left: 652, top: 150, width: 190, height: 128, rot: 0.8 },
    { left: 442, top: 296, width: 190, height: 128, rot: -0.3 },
    { left: 652, top: 296, width: 190, height: 128, rot: 0.5 },
    { left: 234, top: 296, width: 188, height: 128, rot: -0.8 }
  ]
  return surface([
    display(c.title, spec, { position: 'absolute', left: 74, top: 128, width: 335, fontSize: 48, lineHeight: 0.98 }),
    ...blocks.map((item, idx) => {
      const pos = positions[idx] || positions[0]
      const textColor = item.filled ? theme().bg : theme().ink
      const Block = item.filled ? inkBlock : roughBox
      return Block([
        metric(item.num, spec, { color: textColor, fontSize: 26, lineHeight: 1, marginBottom: 'auto' }),
        display(item.title, spec, { color: textColor, fontSize: 19, lineHeight: 1.05, marginBottom: 6, width: pos.width - 38 }),
        body(item.desc, spec, { color: textColor, fontSize: 10, lineHeight: 1.35, opacity: item.filled ? 0.85 : 0.78, width: pos.width - 38 })
      ], { position: 'absolute', ...pos, padding: 18, transform: `rotate(${pos.rot}deg)` })
    }),
    footer(spec, c)
  ])
}

function renderTimeline(spec) {
  const c = content(spec, 'timeline')
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 5) : DEFAULTS.timeline.steps
  return surface([
    display(c.title, spec, { position: 'absolute', left: 64, top: 66, width: 470, fontSize: 40, lineHeight: 1.03 }),
    box({ position: 'absolute', left: 98, right: 92, top: 248, height: 3, backgroundColor: theme().ink }),
    box({ position: 'absolute', left: 68, right: 68, top: 200, height: 190, flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, steps.map((step, idx) =>
      box({ width: 150, flexDirection: 'column', alignItems: 'center', textAlign: 'center' }, [
        box({ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: theme().ink, backgroundColor: idx % 2 === 0 ? theme().ink : theme().bg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, [
          metric(step.num, spec, { color: idx % 2 === 0 ? theme().bg : theme().ink, fontSize: 22, lineHeight: 1 })
        ]),
        display(step.title, spec, { fontSize: 17, lineHeight: 1.05, marginBottom: 8, width: 132, textAlign: 'center' }),
        body(step.desc, spec, { fontSize: 9, lineHeight: 1.32, opacity: 0.74, width: 132, textAlign: 'center' })
      ])
    )),
    doodleLine({ right: 98, bottom: 96, width: 90, transform: 'rotate(0deg)' }),
    doodleLine({ right: 98, bottom: 96, width: 28, transform: 'rotate(36deg)', transformOrigin: 'right center' }),
    doodleLine({ right: 98, bottom: 96, width: 28, transform: 'rotate(-36deg)', transformOrigin: 'right center' }),
    footer(spec, c)
  ])
}

function renderStats(spec) {
  const c = content(spec, 'stats')
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 3) : DEFAULTS.stats.stats
  return surface([
    display(c.title, spec, { position: 'absolute', left: 64, top: 66, width: 455, fontSize: 40, lineHeight: 1.02 }),
    box({ position: 'absolute', left: 72, right: 76, top: 226, height: 184, flexDirection: 'row', gap: 50, alignItems: 'flex-start' }, stats.map((item, idx) =>
      box({ width: 225, flexDirection: 'column', transform: `rotate(${[-1, 0.5, -0.5][idx]}deg)` }, [
        metric(item.value, spec, { fontSize: item.value.length > 2 ? 82 : 92, lineHeight: 0.92, marginBottom: 16 }),
        body(item.label, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.45, opacity: 0.8, width: 190 })
      ])
    )),
    box({ position: 'absolute', right: 52, bottom: 74, width: 220, height: 180, backgroundColor: theme().ink, opacity: 0.08, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }),
    doodleCircle({ left: 78, bottom: 100, width: 76, height: 76, borderRadius: 0, transform: 'rotate(4deg)' }),
    doodleCircle({ left: 95, bottom: 117, width: 42, height: 42, borderRadius: 0, transform: 'rotate(4deg)' }),
    footer(spec, c)
  ])
}

function renderGallery(spec) {
  const c = content(spec, 'gallery')
  const items = Array.isArray(c.items) ? c.items.slice(0, 4) : DEFAULTS.gallery.items
  const positions = [
    { left: 66, top: 176, width: 370, height: 246, rot: -0.5 },
    { left: 462, top: 176, width: 180, height: 116, rot: 0.5 },
    { left: 664, top: 176, width: 180, height: 116, rot: -0.3 },
    { left: 462, top: 314, width: 382, height: 108, rot: 0.3 }
  ]
  return surface([
    display(c.title, spec, { position: 'absolute', left: 64, top: 54, width: 460, fontSize: 43 }),
    body(c.subtitle, spec, { position: 'absolute', left: 67, top: 112, width: 460, fontSize: 13, opacity: 0.76 }),
    ...items.map((item, idx) => {
      const pos = positions[idx]
      return box({ position: 'absolute', ...pos, borderWidth: 3, borderColor: theme().ink, backgroundColor: theme().bgAlt, overflow: 'hidden', transform: `rotate(${pos.rot}deg)`, alignItems: 'center', justifyContent: 'center' }, [
        display(item.label, spec, { fontSize: 24, opacity: 0.48 }),
        TextBlock(item.tag, { position: 'absolute', left: 16, bottom: 14, backgroundColor: theme().ink, color: theme().bg, padding: '5px 10px', fontSize: 10, fontWeight: 600, ...role('label', spec, { fontWeight: 600 }) })
      ])
    }),
    footer(spec, c)
  ])
}

function renderClosing(spec) {
  const c = content(spec, 'closing')
  const contacts = Array.isArray(c.contacts) ? c.contacts.slice(0, 3) : DEFAULTS.closing.contacts
  return surface([
    display(c.title, spec, { position: 'absolute', left: 240, top: 118, width: 480, textAlign: 'center', fontSize: 67, lineHeight: 0.95 }),
    body(c.subtitle, spec, { position: 'absolute', left: 252, top: 272, width: 456, textAlign: 'center', fontSize: 14, fontWeight: 500, opacity: 0.82 }),
    roughBox(contacts.map((line) =>
      body(line, spec, { fontSize: 13, fontWeight: 500, lineHeight: 1.35, marginBottom: 8, textAlign: 'center' })
    ), { position: 'absolute', left: 338, top: 334, width: 284, minHeight: 102, padding: '22px 28px', alignItems: 'center' }),
    doodleCircle({ left: 106, top: 108, width: 92, height: 92 }),
    doodleCircle({ right: 110, bottom: 132, width: 118, height: 84, borderRadius: 0, transform: 'rotate(10deg)' }),
    doodleLine({ left: 142, bottom: 106, width: 92, transform: 'rotate(-8deg)' }),
    footer(spec, c)
  ])
}

const RENDERERS = {
  cover: renderCover,
  toc: renderToc,
  statement: renderStatement,
  chart: renderChart,
  team: renderTeam,
  services: renderServices,
  timeline: renderTimeline,
  stats: renderStats,
  gallery: renderGallery,
  closing: renderClosing
}

export function renderPlayfulIndieLaunch(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
