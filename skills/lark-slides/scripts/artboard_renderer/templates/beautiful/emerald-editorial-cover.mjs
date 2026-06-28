import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'emerald-editorial-cover'

const PAGE_VARIANTS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
const CANVAS = { width: 960, height: 540 }

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'emerald-editorial',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'emerald-editorial',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['s1', 's8'],
      repeatable: ['s2', 's3', 's4', 's5', 's6', 's7']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/emerald-editorial-1.png'
}

const DEFAULTS = {
  s1: {
    title: 'The State of the Work Ahead',
    subtitle: 'A presentation for the leadership team',
    left_footer: 'Prepared by the planning office',
    right_footer: 'November - MMXXV'
  },
  s2: {
    eyebrow: 'What we will cover today',
    title: 'The Programme',
    items: [
      { num: '01', title: 'The Quarter In Review', kind: 'Overview - 8 min' },
      { num: '02', title: 'Where Attention Moves Next', kind: 'Signal - 10 min' },
      { num: '03', title: 'What The Numbers Tell Us', kind: 'Data - 12 min' },
      { num: '04', title: 'The Working Method', kind: 'Process - 7 min' },
      { num: '05', title: 'Questions And Decisions', kind: 'Close - 3 min' }
    ]
  },
  s3: {
    section: 'Q3',
    title: 'The Quarter,\nIn Review.',
    kicker: 'A reading of the period',
    body: 'A short briefing on the operating signals that shaped the quarter. The goal is not to cover every detail, but to name the patterns that should guide the next decision cycle.',
    meta: ['Overview', 'Four themes']
  },
  s4: {
    title_top: 'Three Threads',
    title_middle: 'worth',
    title_bottom: 'Following Closely.',
    items: [
      { num: '01', title: 'Demand stays resilient', body: 'The headline is steady, but the composition keeps moving underneath.' },
      { num: '02', title: 'Work shifts toward evidence', body: 'Teams are asking for clearer proof before committing resources.' },
      { num: '03', title: 'Decision windows are shorter', body: 'The best forums are more frequent, more specific, and easier to close.' }
    ]
  },
  s5: {
    title: 'How the\nnumbers moved.',
    subtitle: 'Two indicators tracked side by side across six quarters. The navy bars show what was committed; the paper bars show what was delivered against it.',
    legend: ['Committed', 'Delivered'],
    bars: [
      { label: 'Q1', a: 72, b: 54 },
      { label: 'Q2', a: 80, b: 63 },
      { label: 'Q3', a: 66, b: 60 },
      { label: 'Q4', a: 88, b: 72 },
      { label: 'Q5', a: 76, b: 69 },
      { label: 'Q6', a: 94, b: 79 }
    ]
  },
  s6: {
    eyebrow: 'From question to decision',
    title: 'A four-step\nworking method.',
    subtitle: 'A short loop the team runs every fortnight. Each step has a single owner and produces one artefact that the next step can use.',
    steps: [
      { num: '01', title: 'Frame', body: 'Name the decision and the evidence needed to make it.' },
      { num: '02', title: 'Gather', body: 'Collect only the signals that change the answer.' },
      { num: '03', title: 'Decide', body: 'Make the tradeoff explicit and record the owner.' },
      { num: '04', title: 'Review', body: 'Return to the outcome before the next cycle starts.' }
    ]
  },
  s7: {
    eyebrow: 'Four numbers worth keeping in view',
    title: 'By the\nnumbers.',
    subtitle: 'A short panel of indicators the team reviews each month. Variances are read against the plan agreed in March.',
    metrics: [
      { value: '84', unit: '%', label: 'Retention' },
      { value: '3.2', unit: 'x', label: 'Pipeline' },
      { value: '18', unit: 'd', label: 'Cycle time' },
      { value: '+12', unit: 'pt', label: 'Quality lift' }
    ]
  },
  s8: {
    kicker: 'The work that follows',
    title_top: 'Questions',
    title_middle: 'and',
    title_bottom: 'Discussion',
    footer: 'Thank you - continue the conversation after the session'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    emerald: source.background || '#3CD896',
    emerald2: '#2DC684',
    navy: source.text || '#0F1A5C',
    navy2: '#1B2774',
    paper: source.panel || '#F1E9D6'
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

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.s1), ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return `s${sourceIndex}`
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''} ${spec.layout_family || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 's1'
  if (raw.includes('agenda') || raw.includes('toc')) return 's2'
  if (raw.includes('section') || raw.includes('content')) return 's3'
  if (raw.includes('statement') || raw.includes('comparison') || raw.includes('detail')) return 's4'
  if (raw.includes('data') || raw.includes('chart')) return 's5'
  if (raw.includes('process') || raw.includes('timeline')) return 's6'
  if (raw.includes('metric') || raw.includes('kpi')) return 's7'
  if (raw.includes('closing') || raw.includes('summary')) return 's8'
  return 's2'
}

function page(backgroundColor, color, children = []) {
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor,
      color,
      overflow: 'hidden'
    },
    children
  )
}

function label(text, spec, style = {}) {
  return TextBlock(String(text || '').toUpperCase(), {
    fontSize: 13,
    lineHeight: 1,
    letterSpacing: 1.4,
    ...role('label', spec, { fontSize: 13, lineHeight: 1, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }),
    ...style
  })
}

function body(text, spec, style = {}) {
  return TextBlock(text, {
    fontSize: 14,
    lineHeight: 1.42,
    ...role('body', spec, { fontSize: 14, lineHeight: 1.42, fontWeight: 500 }),
    ...style
  })
}

function display(text, spec, style = {}) {
  return Title(text, {
    fontSize: 62,
    lineHeight: 0.95,
    letterSpacing: -0.5,
    ...role('display', spec, { fontSize: 62, lineHeight: 0.95, fontWeight: 900, letterSpacing: -0.5 }),
    ...style
  })
}

function metric(text, spec, style = {}) {
  return TextBlock(String(text || ''), {
    fontSize: 72,
    lineHeight: 0.9,
    letterSpacing: -1,
    ...role('metric', spec, { fontSize: 72, lineHeight: 0.9, fontWeight: 900, letterSpacing: -1 }),
    ...style
  })
}

function rule(style = {}) {
  return box({ position: 'absolute', height: 2, backgroundColor: 'currentColor', ...style })
}

function masthead(spec, theme, left, right, style = {}) {
  return [
    label(left, spec, { position: 'absolute', left: 56, top: 44, color: theme.navy, ...style }),
    label(right, spec, { position: 'absolute', right: 56, top: 44, color: theme.navy, textAlign: 'right', ...style })
  ]
}

function footline(spec, theme, left, right) {
  return [
    label(left, spec, { position: 'absolute', left: 56, bottom: 34, color: theme.navy }),
    label(right, spec, { position: 'absolute', right: 56, bottom: 34, color: theme.navy, textAlign: 'right' })
  ]
}

function ornamentWord(word, spec, theme, y, x = 190, width = 580, color = theme.navy) {
  const lineWidth = (width - 88) / 2
  return [
    rule({ left: x, top: y + 13, width: lineWidth, color }),
    rule({ left: x, top: y + 20, width: lineWidth, color }),
    TextBlock(word, {
      position: 'absolute',
      left: x + lineWidth + 18,
      top: y - 4,
      width: 52,
      color,
      fontSize: 30,
      lineHeight: 1,
      textAlign: 'center',
      ...role('display', spec, { fontSize: 30, lineHeight: 1, fontWeight: 800 })
    }),
    rule({ left: x + lineWidth + 88, top: y + 13, width: lineWidth, color }),
    rule({ left: x + lineWidth + 88, top: y + 20, width: lineWidth, color })
  ]
}

function renderCover(spec, theme) {
  const c = content(spec, 's1')
  const words = String(value(spec, 'title', c.title)).toUpperCase().split(/\s+/)
  const top = words.length > 3 ? words.slice(0, 2).join(' ') : 'STATE'
  const bottom = words.length > 3 ? words.slice(2).join(' ') : 'THE WORK AHEAD'
  return page(theme.emerald, theme.navy, [
    label(c.left_footer, spec, { position: 'absolute', left: 56, top: 28, color: theme.navy }),
    label('Issue 01', spec, { position: 'absolute', right: 56, top: 28, color: theme.navy, textAlign: 'right' }),
    TextBlock('The', {
      position: 'absolute',
      left: 420,
      top: 82,
      width: 120,
      color: theme.navy,
      fontSize: 42,
      lineHeight: 0.9,
      textAlign: 'center',
      ...role('display', spec, { fontSize: 42, lineHeight: 0.9, fontWeight: 900 })
    }),
    display(top, spec, {
      position: 'absolute',
      left: 190,
      top: 124,
      width: 580,
      color: theme.navy,
      fontSize: 88,
      lineHeight: 0.9,
      textAlign: 'center'
    }),
    ...ornamentWord('of', spec, theme, 226),
    display(bottom, spec, {
      position: 'absolute',
      left: 150,
      top: 266,
      width: 660,
      color: theme.navy,
      fontSize: 68,
      lineHeight: 0.9,
      textAlign: 'center'
    }),
    label(value(spec, 'subtitle', c.subtitle), spec, {
      position: 'absolute',
      left: 245,
      top: 438,
      width: 470,
      color: theme.navy,
      textAlign: 'center'
    }),
    ...footline(spec, theme, c.left_footer, c.right_footer)
  ])
}

function renderAgenda(spec, theme) {
  const c = content(spec, 's2')
  const items = array(spec, 'items', c.items)
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Agenda', 'Forty minutes'),
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 72, top: 110, color: theme.navy }),
    display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 72, top: 142, width: 520, color: theme.navy, fontSize: 58 }),
    ...items.slice(0, 5).flatMap((item, index) => {
      const y = 232 + index * 48
      return [
        rule({ left: 72, top: y, width: 816, color: theme.navy }),
        TextBlock(item.num || String(index + 1).padStart(2, '0'), {
          position: 'absolute',
          left: 72,
          top: y + 11,
          width: 72,
          color: theme.navy,
          fontSize: 34,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(item.title || '', {
          position: 'absolute',
          left: 155,
          top: y + 15,
          width: 450,
          color: theme.navy,
          fontSize: 23,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 23, lineHeight: 1, fontWeight: 800 })
        }),
        label(item.kind || 'Section', spec, {
          position: 'absolute',
          left: 650,
          top: y + 18,
          width: 230,
          color: theme.navy,
          textAlign: 'right'
        })
      ]
    }),
    rule({ left: 72, top: 472, width: 816, color: theme.navy })
  ])
}

function renderSection(spec, theme) {
  const c = content(spec, 's3')
  return page(theme.emerald, theme.navy, [
    box({ position: 'absolute', left: 54, top: 54, width: 334, height: 432, backgroundColor: theme.navy, color: theme.emerald }, [
      label('Section opener', spec, { position: 'absolute', left: 30, top: 28, color: theme.emerald }),
      metric(value(spec, 'section', c.section), spec, {
        position: 'absolute',
        left: 28,
        top: 130,
        width: 275,
        color: theme.emerald,
        fontSize: 150,
        lineHeight: 0.86
      }),
      label((c.meta || ['Overview', 'Four themes'])[0], spec, { position: 'absolute', left: 30, bottom: 42, color: theme.emerald }),
      label((c.meta || ['Overview', 'Four themes'])[1], spec, { position: 'absolute', right: 30, bottom: 42, color: theme.emerald, textAlign: 'right' })
    ]),
    label(value(spec, 'kicker', c.kicker), spec, { position: 'absolute', left: 450, top: 94, color: theme.navy }),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 450,
      top: 135,
      width: 390,
      color: theme.navy,
      fontSize: 58,
      lineHeight: 0.96
    }),
    body(value(spec, 'body', c.body), spec, {
      position: 'absolute',
      left: 452,
      top: 322,
      width: 390,
      color: theme.navy,
      fontSize: 15,
      lineHeight: 1.42
    })
  ])
}

function renderStatement(spec, theme) {
  const c = content(spec, 's4')
  const items = array(spec, 'items', c.items)
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Overview - A reading of the period', 'Three threads'),
    display(value(spec, 'title_top', c.title_top), spec, {
      position: 'absolute',
      left: 78,
      top: 102,
      width: 520,
      color: theme.navy,
      fontSize: 56
    }),
    ...ornamentWord(value(spec, 'title_middle', c.title_middle), spec, theme, 174, 78, 455),
    display(value(spec, 'title_bottom', c.title_bottom), spec, {
      position: 'absolute',
      left: 78,
      top: 210,
      width: 560,
      color: theme.navy,
      fontSize: 50
    }),
    ...items.slice(0, 3).flatMap((item, index) => {
      const x = 78 + index * 274
      const tone = index % 2 === 1 ? theme.paper : theme.navy
      const fg = index % 2 === 1 ? theme.navy : theme.emerald
      return [
        box({ position: 'absolute', left: x, top: 344, width: 246, height: 134, backgroundColor: tone }),
        TextBlock(item.num || `0${index + 1}`, {
          position: 'absolute',
          left: x + 18,
          top: 361,
          width: 48,
          color: fg,
          fontSize: 34,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 34, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(item.title || '', {
          position: 'absolute',
          left: x + 72,
          top: 363,
          width: 142,
          color: fg,
          fontSize: 18,
          lineHeight: 1.05,
          ...role('display', spec, { fontSize: 18, lineHeight: 1.05, fontWeight: 800 })
        }),
        body(item.body || '', spec, {
          position: 'absolute',
          left: x + 18,
          top: 426,
          width: 205,
          color: fg,
          fontSize: 11,
          lineHeight: 1.22
        })
      ]
    })
  ])
}

function renderData(spec, theme) {
  const c = content(spec, 's5')
  const bars = array(spec, 'bars', c.bars)
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Data study - quarterly movement', 'Six quarters'),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 64,
      top: 118,
      width: 310,
      color: theme.navy,
      fontSize: 48,
      lineHeight: 0.94
    }),
    body(value(spec, 'subtitle', c.subtitle), spec, {
      position: 'absolute',
      left: 64,
      top: 250,
      width: 320,
      color: theme.navy,
      fontSize: 13,
      lineHeight: 1.42
    }),
    box({ position: 'absolute', left: 430, top: 118, width: 455, height: 330, backgroundColor: theme.navy }),
    ...bars.slice(0, 6).flatMap((item, index) => {
      const x = 462 + index * 61
      const a = Math.max(8, Math.min(145, Number(item.a || 50) * 1.5))
      const b = Math.max(8, Math.min(145, Number(item.b || 35) * 1.5))
      return [
        box({ position: 'absolute', left: x, top: 374 - a, width: 18, height: a, backgroundColor: theme.emerald }),
        box({ position: 'absolute', left: x + 25, top: 374 - b, width: 18, height: b, backgroundColor: theme.paper }),
        label(item.label || '', spec, { position: 'absolute', left: x - 2, top: 394, width: 48, color: theme.paper, textAlign: 'center', fontSize: 9, letterSpacing: 0.5 })
      ]
    }),
    label((c.legend || ['Committed'])[0], spec, { position: 'absolute', left: 462, top: 414, color: theme.emerald, fontSize: 10 }),
    label((c.legend || ['', 'Delivered'])[1], spec, { position: 'absolute', left: 585, top: 414, color: theme.paper, fontSize: 10 })
  ])
}

function renderProcess(spec, theme) {
  const c = content(spec, 's6')
  const steps = array(spec, 'steps', c.steps)
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Diagram - the working method', 'Four steps'),
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 66, top: 110, color: theme.navy }),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 66,
      top: 142,
      width: 380,
      color: theme.navy,
      fontSize: 48
    }),
    body(value(spec, 'subtitle', c.subtitle), spec, {
      position: 'absolute',
      left: 520,
      top: 126,
      width: 335,
      color: theme.navy,
      fontSize: 14
    }),
    ...steps.slice(0, 4).flatMap((step, index) => {
      const x = 66 + index * 215
      const tone = index % 2 === 0 ? theme.navy : theme.paper
      const fg = index % 2 === 0 ? theme.emerald : theme.navy
      return [
        box({ position: 'absolute', left: x, top: 300, width: 188, height: 156, backgroundColor: tone }),
        TextBlock(step.num || `0${index + 1}`, {
          position: 'absolute',
          left: x + 18,
          top: 318,
          width: 58,
          color: fg,
          fontSize: 42,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 })
        }),
        TextBlock(step.title || '', {
          position: 'absolute',
          left: x + 18,
          top: 366,
          width: 140,
          color: fg,
          fontSize: 24,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 24, lineHeight: 1, fontWeight: 800 })
        }),
        body(step.body || '', spec, {
          position: 'absolute',
          left: x + 18,
          top: 402,
          width: 148,
          color: fg,
          fontSize: 10,
          lineHeight: 1.25
        })
      ]
    })
  ])
}

function renderKpi(spec, theme) {
  const c = content(spec, 's7')
  const metrics = array(spec, 'metrics', c.metrics)
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Headline indicators - Q3', 'Four numbers'),
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 66, top: 108, color: theme.navy }),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 66,
      top: 140,
      width: 360,
      color: theme.navy,
      fontSize: 52
    }),
    body(value(spec, 'subtitle', c.subtitle), spec, {
      position: 'absolute',
      left: 500,
      top: 130,
      width: 350,
      color: theme.navy,
      fontSize: 14
    }),
    ...metrics.slice(0, 4).flatMap((item, index) => {
      const x = 66 + (index % 2) * 410
      const y = 294 + Math.floor(index / 2) * 110
      return [
        box({ position: 'absolute', left: x, top: y, width: 362, height: 82, backgroundColor: index % 2 === 0 ? theme.navy : theme.paper }),
        metric(item.value || '', spec, {
          position: 'absolute',
          left: x + 22,
          top: y + 11,
          width: 125,
          color: index % 2 === 0 ? theme.emerald : theme.navy,
          fontSize: 58
        }),
        TextBlock(item.unit || '', {
          position: 'absolute',
          left: x + 158,
          top: y + 25,
          width: 48,
          color: index % 2 === 0 ? theme.emerald : theme.navy,
          fontSize: 28,
          lineHeight: 1,
          ...role('display', spec, { fontSize: 28, lineHeight: 1, fontWeight: 800 })
        }),
        label(item.label || '', spec, {
          position: 'absolute',
          left: x + 205,
          top: y + 33,
          width: 130,
          color: index % 2 === 0 ? theme.emerald : theme.navy
        })
      ]
    })
  ])
}

function renderClosing(spec, theme) {
  const c = content(spec, 's8')
  return page(theme.emerald, theme.navy, [
    ...masthead(spec, theme, 'Closing notes', 'End of briefing'),
    label(value(spec, 'kicker', c.kicker), spec, { position: 'absolute', left: 260, top: 118, width: 440, color: theme.navy, textAlign: 'center' }),
    display(value(spec, 'title_top', c.title_top).toUpperCase(), spec, {
      position: 'absolute',
      left: 135,
      top: 170,
      width: 690,
      color: theme.navy,
      fontSize: 82,
      lineHeight: 0.9,
      textAlign: 'center'
    }),
    ...ornamentWord(value(spec, 'title_middle', c.title_middle), spec, theme, 282, 205, 550),
    display(value(spec, 'title_bottom', c.title_bottom).toUpperCase(), spec, {
      position: 'absolute',
      left: 110,
      top: 324,
      width: 740,
      color: theme.navy,
      fontSize: 76,
      lineHeight: 0.9,
      textAlign: 'center'
    }),
    label(value(spec, 'footer', c.footer), spec, {
      position: 'absolute',
      left: 160,
      top: 460,
      width: 640,
      color: theme.navy,
      textAlign: 'center'
    })
  ])
}

export function renderEmeraldEditorialCover(spec) {
  const theme = colors(spec)
  const variant = normalizeVariant(spec)
  const renderers = {
    s1: renderCover,
    s2: renderAgenda,
    s3: renderSection,
    s4: renderStatement,
    s5: renderData,
    s6: renderProcess,
    s7: renderKpi,
    s8: renderClosing
  }
  return (renderers[variant] || renderers.s2)(spec, theme)
}
