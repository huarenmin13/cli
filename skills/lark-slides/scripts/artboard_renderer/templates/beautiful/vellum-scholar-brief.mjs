import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'vellum-scholar-brief'

export const PAGE_VARIANTS = ['cover', 'statement', 'text', 'stats', 'list', 'quote', 'compare', 'chart', 'end']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'vellum',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'vellum',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'statement', 'quote', 'end'],
      repeatable: ['text', 'stats', 'list', 'compare', 'chart']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/vellum-1.png'
}

const C = {
  navy: '#2A3870',
  navyDeep: '#1F2858',
  navyMid: '#34407A',
  yellow: '#E8D85C',
  yellowBright: '#F5E168',
  yellow2: 'rgba(232,216,92,0.62)',
  yellow3: 'rgba(232,216,92,0.32)',
  teal: '#3A7878',
  border: 'rgba(232,216,92,0.20)'
}

const DEFAULTS = {
  cover: {
    kicker: 'Essay 01 - 2026',
    title: 'On Restraint',
    subtitle: 'Field notes on the discipline of less, written for designers who already know how to add.',
    pin: ['01 / 09', 'The Quiet Studio.', 'Edition One.']
  },
  statement: {
    kicker: '[The Argument]',
    title: 'Most design problems are removed, not solved.',
    pin: ['02 / 09', 'Bold claim.', 'Stand by it.']
  },
  text: {
    kicker: '[Field Note 03]',
    number: '03',
    heading: 'Observation',
    title: 'What you remove is louder than what you keep.',
    paragraphs: [
      'Subtraction creates the figure. Addition only fills the ground.',
      'Working drafts always carry more than they need; the work of editing is mostly the work of cutting.'
    ],
    pin: ['03 / 09', "Show, don't tell."]
  },
  stats: {
    kicker: '[By the Numbers]',
    number: '04',
    title: 'Three findings from a year of editing.',
    stats: [
      ['73%', 'of choices in early drafts are removed before publication'],
      ['1.4x', 'time spent removing vs. adding material in mature work'],
      ['#1', 'predictor of perceived quality is amount of white space (n=412)']
    ],
    pin: ['04 / 09', 'Three facts.', 'One argument.']
  },
  list: {
    kicker: '[Method]',
    number: '05',
    title: '[Why It Matters]',
    lead: 'Four rules that hold.',
    items: [
      'One accent color per spread. Never two.',
      'Body text obeys the grid. Display is allowed to break it.',
      'White space is a choice, not a default.',
      'Reduce until removal hurts. Stop one step before that.'
    ],
    pin: ['05 / 09', 'Four rules.', 'No exceptions.']
  },
  quote: {
    quote: 'Design is a plan for arranging elements to accomplish a particular purpose.',
    name: 'Charles Eames',
    role: 'Designer - 1972',
    pin: ['06 / 09', 'Eames said it.', 'Still true.']
  },
  compare: {
    left_label: 'Before',
    left_title: 'The unfocused draft',
    left_body: 'Three points compete for the title slot. Two accent colors. The body copy is two paragraphs and ends mid-thought.',
    left_items: ['Three claims, none load-bearing', 'Twin accents pull the eye apart', 'Body unedited; reader does the work'],
    right_label: 'After',
    right_title: 'The edited piece',
    right_body: 'One claim takes the title. One accent does the work. The paragraph ends where the thought ends.',
    right_items: ['One claim, fully argued', 'One accent, used once', 'Body cut to the bone'],
    pin: ['07 / 09', 'Two states.', 'Same essay.']
  },
  chart: {
    kicker: '[Pattern]',
    number: '08',
    title: 'How drafts shrink during editing.',
    caption: 'Word count, indexed (start = 100)',
    labels: ['Draft', 'First read', 'Second read', 'Peer review', 'Final'],
    values: [100, 92, 78, 65, 58],
    pin: ['08 / 09', 'Internal study, 2026.', 'n = 412.']
  },
  end: {
    kicker: '[End notes]',
    title: 'Edit until it stops looking edited.',
    subtitle: 'Thank you for reading. Comments, corrections, or quiet disagreement welcome at notes@quiet-studio.com.',
    pin: ['09 / 09', 'The Quiet Studio.', 'Set in Cormorant + DM Sans.']
  }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.includes(variant)) return variant
  }
  if (raw.includes('closing')) return 'end'
  if (raw.includes('data') || raw.includes('chart')) return 'chart'
  if (raw.includes('compare')) return 'compare'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('list') || raw.includes('process')) return 'list'
  if (raw.includes('stats')) return 'stats'
  if (raw.includes('detail') || raw.includes('content')) return 'text'
  if (raw.includes('statement')) return 'statement'
  return 'cover'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function arr(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function serif(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: C.yellow,
    fontSize: 68,
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: 0.96,
    letterSpacing: -0.4,
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    ...fontRole('display', spec, { fontWeight: 400, fontStyle: 'italic', lineHeight: 0.96 }),
    textTransform: 'none',
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.yellow2,
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.58,
    textAlign: 'center',
    ...fontRole('body', spec, { fontWeight: 400 }),
    textTransform: 'none',
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.teal,
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: 0.8,
    ...fontRole('label', spec, { fontWeight: 400, letterSpacing: 0.8 }),
    textTransform: 'none',
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: C.yellow,
    fontSize: 48,
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: 0.98,
    textAlign: 'center',
    ...fontRole('metric', spec, { fontWeight: 400, fontStyle: 'italic', lineHeight: 0.98 }),
    textTransform: 'none',
    ...style
  })
}

function page(children) {
  return box({ width: 960, height: 540, position: 'relative', backgroundColor: C.navy, overflow: 'hidden' }, children)
}

function pin(spec, lines, style = {}) {
  return box({ position: 'absolute', left: 56, bottom: 48, width: 220, flexDirection: 'column', gap: 3, ...style }, arr(lines, DEFAULTS.cover.pin).slice(0, 3).map((line) =>
    label(line, spec, { color: C.teal, fontSize: 10.5, lineHeight: 1.35 })
  ))
}

function rule(x, y) {
  return box({ position: 'absolute', left: x, top: y, width: 28, height: 1, backgroundColor: C.teal })
}

function renderCover(spec) {
  const d = content(spec, 'cover')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 300, width: 360, top: 130, textAlign: 'center', color: C.teal, fontSize: 10 }),
    serif(d.title, spec, { position: 'absolute', left: 180, top: 172, width: 600, fontSize: 84, lineHeight: 0.94 }),
    body(d.subtitle, spec, { position: 'absolute', left: 265, top: 298, width: 430, fontSize: 15, lineHeight: 1.58 }),
    pin(spec, d.pin)
  ])
}

function renderStatement(spec) {
  const d = content(spec, 'statement')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 300, width: 360, top: 145, textAlign: 'center', color: C.teal, fontSize: 10 }),
    serif(d.title, spec, { position: 'absolute', left: 126, top: 188, width: 708, fontSize: 58, lineHeight: 1.04 }),
    pin(spec, d.pin)
  ])
}

function renderText(spec) {
  const d = content(spec, 'text')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 98, top: 72, color: C.teal, fontSize: 10 }),
    label(d.number, spec, { position: 'absolute', left: 98, top: 168, color: C.teal, fontSize: 12 }),
    serif(d.heading, spec, { position: 'absolute', left: 134, top: 154, width: 220, textAlign: 'left', fontSize: 38, color: C.yellow }),
    serif(d.title, spec, { position: 'absolute', left: 375, top: 145, width: 430, textAlign: 'left', fontSize: 34, lineHeight: 1.08 }),
    ...arr(d.paragraphs, DEFAULTS.text.paragraphs).slice(0, 2).map((para, index) =>
      body(para, spec, { position: 'absolute', left: 382, top: 258 + index * 68, width: 380, textAlign: 'left', fontSize: 14, lineHeight: 1.55 })
    ),
    pin(spec, d.pin)
  ])
}

function renderStats(spec) {
  const d = content(spec, 'stats')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 300, width: 360, top: 74, textAlign: 'center', fontSize: 10 }),
    label(d.number, spec, { position: 'absolute', left: 440, width: 80, top: 108, textAlign: 'center', color: C.teal, fontSize: 11 }),
    serif(d.title, spec, { position: 'absolute', left: 214, top: 136, width: 532, fontSize: 42, lineHeight: 1.08 }),
    box({ position: 'absolute', left: 108, right: 108, top: 286, height: 122, flexDirection: 'row' }, arr(d.stats, DEFAULTS.stats.stats).slice(0, 3).map((stat, index) => {
      const [value, text] = stat
      return box({ flex: 1, height: '100%', alignItems: 'center', padding: '0 28px', borderRight: index < 2 ? `1px solid ${C.border}` : '0px solid transparent', flexDirection: 'column' }, [
        metric(value, spec, { width: '100%', fontSize: 54, lineHeight: 0.95 }),
        label(text, spec, { width: '100%', marginTop: 13, textAlign: 'center', color: C.yellow2, fontSize: 10.5, lineHeight: 1.35, letterSpacing: 0.3 })
      ])
    })),
    pin(spec, d.pin)
  ])
}

function renderList(spec) {
  const d = content(spec, 'list')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 116, top: 70, color: C.teal, fontSize: 10 }),
    label(d.number, spec, { position: 'absolute', right: 116, top: 70, color: C.teal, fontSize: 10, textAlign: 'right' }),
    serif(d.title, spec, { position: 'absolute', left: 180, top: 112, width: 600, fontSize: 46, lineHeight: 1.05 }),
    body(d.lead, spec, { position: 'absolute', left: 260, top: 180, width: 440, fontSize: 15 }),
    box({ position: 'absolute', left: 230, top: 242, width: 500, flexDirection: 'column', gap: 20 }, arr(d.items, DEFAULTS.list.items).slice(0, 4).map((item, index) =>
      box({ width: '100%', flexDirection: 'row', gap: 18 }, [
        label(String(index + 1).padStart(2, '0'), spec, { width: 28, color: C.teal, fontSize: 10 }),
        body(item, spec, { flex: 1, textAlign: 'left', color: C.yellow, fontSize: 15, lineHeight: 1.35 })
      ])
    )),
    pin(spec, d.pin)
  ])
}

function renderQuote(spec) {
  const d = content(spec, 'quote')
  return page([
    serif('"', spec, { position: 'absolute', left: 430, width: 100, top: 96, fontSize: 96, color: C.teal, lineHeight: 0.7 }),
    serif(d.quote, spec, { position: 'absolute', left: 160, top: 180, width: 640, fontSize: 39, lineHeight: 1.2 }),
    label(d.name, spec, { position: 'absolute', left: 300, width: 360, top: 377, textAlign: 'center', color: C.yellow, fontSize: 11 }),
    label(d.role, spec, { position: 'absolute', left: 300, width: 360, top: 405, textAlign: 'center', color: C.yellow2, fontSize: 10 }),
    pin(spec, d.pin)
  ])
}

function comparePanel(spec, side, labelText, title, textValue, items, left) {
  return box({ position: 'absolute', left: left ? 94 : 480, top: 116, width: 386, height: 288, backgroundColor: left ? C.navyDeep : C.navyMid, borderLeft: left ? '0px solid transparent' : `1px solid ${C.border}`, padding: 34, flexDirection: 'column' }, [
    label(labelText, spec, { color: C.teal, fontSize: 10, letterSpacing: 0.8 }),
    serif(title, spec, { width: '100%', marginTop: 16, textAlign: 'left', fontSize: 31, lineHeight: 1.05 }),
    body(textValue, spec, { width: '100%', marginTop: 16, textAlign: 'left', fontSize: 12.8, lineHeight: 1.45, color: C.yellow2 }),
    box({ width: '100%', marginTop: 15, flexDirection: 'column', gap: 6 }, arr(items).slice(0, 3).map((item) =>
      body(`- ${item}`, spec, { width: '100%', textAlign: 'left', fontSize: 11.5, lineHeight: 1.25, color: C.yellow })
    ))
  ])
}

function renderCompare(spec) {
  const d = content(spec, 'compare')
  return page([
    comparePanel(spec, 'before', d.left_label, d.left_title, d.left_body, d.left_items, true),
    comparePanel(spec, 'after', d.right_label, d.right_title, d.right_body, d.right_items, false),
    pin(spec, d.pin)
  ])
}

function renderChart(spec) {
  const d = content(spec, 'chart')
  const values = arr(d.values, DEFAULTS.chart.values)
  const labels = arr(d.labels, DEFAULTS.chart.labels)
  const max = Math.max(...values, 1)
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 104, top: 70, color: C.teal, fontSize: 10 }),
    label(d.number, spec, { position: 'absolute', right: 104, top: 70, color: C.teal, fontSize: 10, textAlign: 'right' }),
    serif(d.title, spec, { position: 'absolute', left: 210, top: 118, width: 540, fontSize: 42, lineHeight: 1.05 }),
    label(d.caption, spec, { position: 'absolute', left: 300, width: 360, top: 205, textAlign: 'center', color: C.yellow2, fontSize: 10 }),
    box({ position: 'absolute', left: 162, right: 162, bottom: 128, height: 178, flexDirection: 'row', alignItems: 'flex-end', gap: 28 }, values.slice(0, 5).map((value, index) => {
      const height = Math.max(30, Math.round((value / max) * 135))
      const accent = index === 0 || index === values.length - 1
      return box({ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column' }, [
        metric(String(value), spec, { color: accent ? C.yellow : C.yellow2, fontSize: 11, fontStyle: 'normal', marginBottom: 8 }),
        box({ width: '100%', height, backgroundColor: accent ? C.yellow : C.yellow3 }),
        label(labels[index], spec, { width: '100%', marginTop: 12, textAlign: 'center', color: C.yellow2, fontSize: 9, lineHeight: 1.2, letterSpacing: 0.2 })
      ])
    })),
    box({ position: 'absolute', left: 162, right: 162, bottom: 128, height: 1, backgroundColor: C.border }),
    pin(spec, d.pin)
  ])
}

function renderEnd(spec) {
  const d = content(spec, 'end')
  return page([
    label(d.kicker, spec, { position: 'absolute', left: 300, width: 360, top: 144, textAlign: 'center', color: C.teal, fontSize: 10 }),
    serif(d.title, spec, { position: 'absolute', left: 160, top: 190, width: 640, fontSize: 56, lineHeight: 1.04 }),
    body(d.subtitle, spec, { position: 'absolute', left: 280, top: 326, width: 400, fontSize: 14.5, lineHeight: 1.58 }),
    pin(spec, d.pin)
  ])
}

export function renderVellumScholarBrief(spec) {
  const variant = normalizeVariant(spec)
  switch (variant) {
    case 'statement':
      return renderStatement(spec)
    case 'text':
      return renderText(spec)
    case 'stats':
      return renderStats(spec)
    case 'list':
      return renderList(spec)
    case 'quote':
      return renderQuote(spec)
    case 'compare':
      return renderCompare(spec)
    case 'chart':
      return renderChart(spec)
    case 'end':
      return renderEnd(spec)
    case 'cover':
    default:
      return renderCover(spec)
  }
}
