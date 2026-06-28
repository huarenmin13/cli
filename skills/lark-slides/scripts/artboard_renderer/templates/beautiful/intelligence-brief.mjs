import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'intelligence-brief'

export const PAGE_VARIANTS = [
  'cover',
  'chapter',
  'statement',
  'split',
  'stats',
  'quote',
  'list',
  'compare',
  'editorial',
  'dense',
  'statement-2',
  'end',
  'chart',
  'diagram',
  'pie',
  'pyramid',
  'vtimeline',
  'cycle'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'signal',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'signal',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'chapter', 'statement', 'statement-2', 'end'],
      repeatable: ['split', 'stats', 'quote', 'list', 'compare', 'editorial', 'dense', 'chart', 'diagram', 'pie', 'pyramid', 'vtimeline', 'cycle']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/signal-1.png'
}

const P = {
  navy: '#1C2644',
  navyAlt: '#232F55',
  cream: '#F0ECE3',
  creamAlt: '#E6E0D4',
  warm: '#E2DCD0',
  mutedDark: '#8A96A8',
  hintDark: '#4E5A6E',
  ink: '#1A2030',
  mutedLight: '#5A6270',
  hintLight: '#9AA0A8',
  gold: '#C8A870',
  borderDark: '#2E3D5C',
  borderLight: '#CAC4B4'
}

const DEFAULTS = {
  cover: {
    label: '[Period] · [Audience] · [Deck Type]',
    title: '[Presentation]\nTitle',
    subtitle: 'A short description of the deck, its purpose, and the decision it supports.',
    meta_left: '[Author Name] · [Role]',
    meta_right: '[Version] · [Status] · [Period]'
  },
  chapter: {
    chapter: '01 · [Section]',
    title: 'Section headline with one emphasized idea',
    subtitle: 'A brief setup sentence that explains what this section covers and why it matters.'
  },
  statement: {
    label: '[Slide Label]',
    kicker: '[Kicker Label]',
    title: 'A concise statement that frames the main argument in one memorable sentence.',
    footer: '03 / 18'
  },
  split: {
    label: '[Category] · [Topic]',
    kicker: '[Kicker Label]',
    title: 'Main headline for a split-layout slide',
    body: 'Use this paragraph for the core explanation. Keep it short, specific, and easy to scan.',
    bullets: ['First supporting point with concise context', 'Second supporting point with concise context', 'Third supporting point with concise context'],
    image_caption: '[Image / Evidence panel]'
  },
  stats: {
    title: 'Four signals define the current operating environment',
    stats: [
      ['72%', 'Primary signal strength', 'Q/Q movement'],
      ['18', 'Open questions', 'Tracked weekly'],
      ['4.6x', 'Evidence density', 'Indexed sources'],
      ['03', 'Decision gates', 'Owner assigned']
    ]
  },
  quote: {
    quote: 'The signal is not the loudest data point. It is the one that keeps explaining the rest.',
    attribution: 'Research note · internal advisory'
  },
  list: {
    title: 'Operating implications',
    intro: 'Use the list slide when the argument needs ordered evidence rather than another headline.',
    items: ['Clarify which signal has decision value', 'Separate observed fact from interpretation', 'Attach every recommendation to an accountable owner', 'Keep the next review cycle visible']
  },
  compare: {
    title: 'Before / after operating model',
    left_title: 'Before',
    right_title: 'After',
    left: ['Fragmented reviews', 'Unclear owners', 'Late risk escalation', 'Narrative drift'],
    right: ['Single decision log', 'Named accountability', 'Early warning indicators', 'Evidence-backed language']
  },
  editorial: {
    kicker: 'EDITORIAL BRIEF',
    title: 'The institution can move faster without sounding less careful.',
    left: 'The strongest teams preserve judgment while reducing ceremony. They make the decision trail visible and keep the evidence close to the claim.',
    right: 'This format is built for those moments: enough structure to feel rigorous, enough air to let one idea land.',
    stats: [
      ['2.4x', 'review cadence'],
      ['31%', 'fewer open loops'],
      ['06', 'owner lanes'],
      ['Q3', 'next checkpoint']
    ]
  },
  dense: {
    title: 'Dense analysis should still preserve an editorial reading rhythm.',
    columns: [
      {
        label: 'OBSERVATION',
        paragraphs: ['The deck should feel like a written brief, not a dashboard compressed into slides.', 'A narrow column and strong line height keep the page readable even when evidence is dense.']
      },
      {
        label: 'IMPLICATION',
        paragraphs: ['Use the second column for interpretation, tradeoffs, or the decision logic.', 'Gold appears only where emphasis carries structural meaning.']
      }
    ]
  },
  'statement-2': {
    label: '[Slide Label]',
    kicker: 'SECOND PRINCIPLE',
    title: 'A second statement variant for emphasis, escalation, or synthesis.',
    body: 'This page intentionally reuses the statement class with different copy density so repeated source classes do not collapse into one fixture.'
  },
  end: {
    title: 'End note',
    subtitle: 'The next step is not more information. It is a clearer decision.',
    contact: 'Private intelligence note · prepared for review'
  },
  chart: {
    label: 'SIGNAL TRACKER',
    title: 'Evidence concentration by workstream',
    values: [38, 52, 67, 86],
    labels: ['Discovery', 'Model', 'Review', 'Action'],
    source: 'Source: synthesized review log'
  },
  diagram: {
    title: 'Decision flow',
    steps: [
      ['01', 'Observe', 'Collect inputs without forcing conclusion.'],
      ['02', 'Interpret', 'Name the signal and its confidence level.'],
      ['03', 'Act', 'Assign owner, timing, and review trigger.']
    ]
  },
  pie: {
    title: 'Portfolio of attention',
    items: [
      ['Strategic', '42%'],
      ['Operational', '28%'],
      ['Risk', '18%'],
      ['Narrative', '12%']
    ],
    total: 'TOTAL · 100%'
  },
  pyramid: {
    title: 'Evidence hierarchy',
    levels: [
      ['Decision', 'One sentence that can survive scrutiny'],
      ['Recommendation', 'The advised movement'],
      ['Interpretation', 'What the evidence means'],
      ['Observation', 'What has been seen'],
      ['Source', 'Where the claim came from']
    ]
  },
  vtimeline: {
    title: 'Review cadence',
    events: [
      ['WEEK 01', 'Frame', 'Define the question and owner.'],
      ['WEEK 02', 'Observe', 'Collect inputs and classify confidence.'],
      ['WEEK 03', 'Decide', 'Commit the recommended path.'],
      ['WEEK 04', 'Review', 'Re-open only if the signal changes.']
    ]
  },
  cycle: {
    title: 'Signal loop',
    steps: [
      ['01', 'Gather', 'Bring evidence into one place.'],
      ['02', 'Read', 'Separate noise from pattern.'],
      ['03', 'Decide', 'Make the operating choice visible.'],
      ['04', 'Learn', 'Feed the next review cycle.']
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
  const slideMatch = raw.match(/slide-(\d+)/)
  if (slideMatch) {
    const slideIndex = Number(slideMatch[1])
    if (slideIndex >= 1 && slideIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[slideIndex - 1]
  }
  if (raw.includes('closing') || raw.includes('end')) return 'end'
  if (raw.includes('timeline')) return 'vtimeline'
  if (raw.includes('chart') || raw.includes('data')) return 'chart'
  if (raw.includes('compare')) return 'compare'
  if (raw.includes('quote')) return 'quote'
  return 'cover'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.cover), ...(spec.content || {}) }
}

function textValue(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function arrayValue(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function palette(surface) {
  const light = surface === 'light'
  return {
    bg: light ? P.cream : P.navy,
    alt: light ? P.creamAlt : P.navyAlt,
    text: light ? P.ink : P.warm,
    muted: light ? P.mutedLight : P.mutedDark,
    hint: light ? P.hintLight : P.hintDark,
    border: light ? P.borderLight : P.borderDark,
    gold: P.gold,
    light
  }
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function label(value, spec, t, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: t.gold,
    fontSize: 9,
    lineHeight: 1.12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 700, fontSize: 9, lineHeight: 1.12, letterSpacing: 1.8, textTransform: 'uppercase' }),
    ...style
  })
}

function serif(value, spec, t, style = {}) {
  return TextBlock(value, {
    color: t.text,
    fontSize: 42,
    lineHeight: 1.08,
    letterSpacing: -0.2,
    whiteSpace: 'pre-wrap',
    ...role('display', spec, { fontWeight: 760, fontSize: 42, lineHeight: 1.08, letterSpacing: -0.2 }),
    ...style
  })
}

function body(value, spec, t, style = {}) {
  return TextBlock(value, {
    color: t.muted,
    fontSize: 15,
    lineHeight: 1.58,
    ...role('body', spec, { fontWeight: 430, fontSize: 15, lineHeight: 1.58 }),
    ...style
  })
}

function metric(value, spec, t, style = {}) {
  return TextBlock(String(value || ''), {
    color: t.gold,
    fontSize: 44,
    lineHeight: 0.96,
    letterSpacing: -0.4,
    ...role('metric', spec, { fontWeight: 760, fontSize: 44, lineHeight: 0.96, letterSpacing: -0.4 }),
    ...style
  })
}

function rule(t, style = {}) {
  return box({ width: 36, height: 1, backgroundColor: t.gold, ...style }, [])
}

function gridTexture(t) {
  if (t.light) return []
  const lines = []
  for (let x = 80; x < 960; x += 80) {
    lines.push(box({ position: 'absolute', left: x, top: 0, width: 1, height: 540, backgroundColor: 'rgba(255,255,255,0.03)' }, []))
  }
  for (let y = 80; y < 540; y += 80) {
    lines.push(box({ position: 'absolute', left: 0, top: y, width: 960, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }, []))
  }
  return lines
}

function chrome(spec, t, pageNo, title = 'PRIVATE INTELLIGENCE NOTE') {
  return [
    box({ position: 'absolute', left: 72, top: 44, right: 72, height: 1, backgroundColor: t.border }, []),
    label(title, spec, t, { position: 'absolute', left: 72, top: 24, color: t.muted }),
    label(String(pageNo).padStart(2, '0'), spec, t, { position: 'absolute', right: 72, top: 24, width: 80, textAlign: 'right', color: t.muted }),
    box({ position: 'absolute', left: 72, bottom: 52, right: 72, height: 1, backgroundColor: t.border }, []),
    label('PRIVATE / RESEARCH', spec, t, { position: 'absolute', left: 72, bottom: 28, color: t.hint }),
    label(`${String(pageNo).padStart(2, '0')} / 18`, spec, t, { position: 'absolute', right: 72, bottom: 28, width: 100, textAlign: 'right', color: t.hint })
  ]
}

function page(spec, surface, pageNo, children, { chromeLabel = 'PRIVATE INTELLIGENCE NOTE', includeChrome = true } = {}) {
  const t = palette(surface)
  return box({ width: 960, height: 540, position: 'relative', overflow: 'hidden', backgroundColor: t.bg }, [
    ...gridTexture(t),
    ...(includeChrome ? chrome(spec, t, pageNo, chromeLabel) : []),
    ...children
  ])
}

function bulletList(items, spec, t, style = {}) {
  return box({ flexDirection: 'column', gap: 12, ...style }, items.map((item) =>
    box({ flexDirection: 'row', alignItems: 'flex-start' }, [
      label('—', spec, t, { width: 22, color: t.gold, letterSpacing: 0 }),
      body(item, spec, t, { flex: 1, fontSize: 14.5, lineHeight: 1.45 })
    ])
  ))
}

function renderCover(spec) {
  const c = content(spec, 'cover')
  const t = palette('dark')
  return page(spec, 'dark', 1, [
    label(textValue(c.label, DEFAULTS.cover.label), spec, t, { position: 'absolute', left: 72, top: 78, color: t.muted }),
    rule(t, { position: 'absolute', left: 72, top: 132 }),
    Title(textValue(c.title, DEFAULTS.cover.title), {
      position: 'absolute',
      left: 72,
      top: 154,
      width: 720,
      color: t.text,
      fontSize: 66,
      lineHeight: 0.92,
      whiteSpace: 'pre-wrap',
      ...role('display', spec, { fontWeight: 820, fontSize: 66, lineHeight: 0.92, letterSpacing: -1.1 })
    }),
    body(textValue(c.subtitle, DEFAULTS.cover.subtitle), spec, t, { position: 'absolute', left: 74, top: 354, width: 500, fontSize: 18, lineHeight: 1.55 }),
    box({ position: 'absolute', left: 72, right: 72, bottom: 74, height: 1, backgroundColor: t.border }, []),
    label(textValue(c.meta_left, DEFAULTS.cover.meta_left), spec, t, { position: 'absolute', left: 72, bottom: 44, color: t.muted }),
    label(textValue(c.meta_right, DEFAULTS.cover.meta_right), spec, t, { position: 'absolute', right: 72, bottom: 44, width: 280, textAlign: 'right', color: t.muted })
  ], { includeChrome: false })
}

function renderChapter(spec) {
  const c = content(spec, 'chapter')
  const t = palette('dark')
  return page(spec, 'dark', 2, [
    label(textValue(c.chapter, DEFAULTS.chapter.chapter), spec, t, { position: 'absolute', left: 122, top: 148, color: t.muted }),
    rule(t, { position: 'absolute', left: 122, top: 186 }),
    serif(textValue(c.title, DEFAULTS.chapter.title), spec, t, { position: 'absolute', left: 122, top: 216, width: 620, fontSize: 43, lineHeight: 1.1 }),
    body(textValue(c.subtitle, DEFAULTS.chapter.subtitle), spec, t, { position: 'absolute', left: 122, top: 414, width: 510, fontSize: 17, lineHeight: 1.45 })
  ], { includeChrome: false })
}

function renderStatement(spec, variant = 'statement', pageNo = 3) {
  const c = content(spec, variant)
  const t = palette('dark')
  const hasBody = Boolean(c.body)
  return page(spec, 'dark', pageNo, [
    box({ position: 'absolute', left: 118, top: hasBody ? 142 : 160, width: 680, flexDirection: 'column' }, [
      label(textValue(c.kicker, DEFAULTS.statement.kicker), spec, t),
      rule(t, { marginTop: 22, marginBottom: hasBody ? 24 : 28 }),
      serif(textValue(c.title, DEFAULTS[variant].title), spec, t, { fontSize: hasBody ? 43 : 49, lineHeight: hasBody ? 1.1 : 1.12 }),
      c.body ? body(c.body, spec, t, { marginTop: 18, width: 570, fontSize: 15.5, lineHeight: 1.38 }) : null
    ].filter(Boolean))
  ], { chromeLabel: textValue(c.label, DEFAULTS.statement.label) })
}

function renderSplit(spec) {
  const c = content(spec, 'split')
  const t = palette('light')
  return page(spec, 'light', 4, [
    box({ position: 'absolute', left: 74, top: 96, width: 390, flexDirection: 'column' }, [
      label(textValue(c.kicker, DEFAULTS.split.kicker), spec, t),
      serif(textValue(c.title, DEFAULTS.split.title), spec, t, { marginTop: 22, color: t.text, fontSize: 37, lineHeight: 1.16 }),
      body(textValue(c.body, DEFAULTS.split.body), spec, t, { marginTop: 18, fontSize: 16, color: t.muted }),
      bulletList(arrayValue(c.bullets, DEFAULTS.split.bullets), spec, t, { marginTop: 18 })
    ]),
    box({ position: 'absolute', right: 76, top: 100, width: 335, height: 310, backgroundColor: t.alt, border: `1px solid ${t.border}`, alignItems: 'center', justifyContent: 'center' }, [
      box({ width: 220, height: 146, border: `1px solid ${t.border}`, alignItems: 'center', justifyContent: 'center' }, [
        label(textValue(c.image_caption, DEFAULTS.split.image_caption), spec, t, { color: t.hint, textAlign: 'center', letterSpacing: 1.1 })
      ])
    ])
  ], { chromeLabel: textValue(c.label, DEFAULTS.split.label) })
}

function renderStats(spec) {
  const c = content(spec, 'stats')
  const t = palette('dark')
  const stats = arrayValue(c.stats, DEFAULTS.stats.stats)
  return page(spec, 'dark', 5, [
    serif(textValue(c.title, DEFAULTS.stats.title), spec, t, { position: 'absolute', left: 74, top: 104, width: 610, fontSize: 42 }),
    box({ position: 'absolute', left: 74, top: 240, width: 812, flexDirection: 'row', flexWrap: 'wrap' }, stats.slice(0, 4).map((item, index) =>
      box({ width: 390, height: 104, borderTop: `1px solid ${t.border}`, paddingTop: 18, marginRight: index % 2 === 0 ? 32 : 0, marginBottom: 24, flexDirection: 'column' }, [
        metric(item[0], spec, t, { fontSize: 48 }),
        body(item[1], spec, t, { marginTop: 8, fontSize: 15, color: t.text }),
        label(item[2], spec, t, { marginTop: 6, color: t.hint })
      ])
    ))
  ])
}

function renderQuote(spec) {
  const c = content(spec, 'quote')
  const t = palette('dark')
  return page(spec, 'dark', 6, [
    metric('“', spec, t, { position: 'absolute', left: 116, top: 118, fontSize: 112, lineHeight: 0.7, color: t.gold }),
    serif(textValue(c.quote, DEFAULTS.quote.quote), spec, t, { position: 'absolute', left: 190, top: 154, width: 610, fontSize: 43, lineHeight: 1.24, fontWeight: 500 }),
    label(textValue(c.attribution, DEFAULTS.quote.attribution), spec, t, { position: 'absolute', left: 194, top: 390, color: t.muted })
  ])
}

function renderList(spec) {
  const c = content(spec, 'list')
  const t = palette('light')
  return page(spec, 'light', 7, [
    serif(textValue(c.title, DEFAULTS.list.title), spec, t, { position: 'absolute', left: 74, top: 98, width: 420, fontSize: 42 }),
    body(textValue(c.intro, DEFAULTS.list.intro), spec, t, { position: 'absolute', left: 74, top: 220, width: 430, fontSize: 17, lineHeight: 1.45 }),
    bulletList(arrayValue(c.items, DEFAULTS.list.items), spec, t, { position: 'absolute', right: 86, top: 116, width: 330 })
  ], { chromeLabel: 'OPERATING NOTE' })
}

function renderCompare(spec) {
  const c = content(spec, 'compare')
  const t = palette('dark')
  return page(spec, 'dark', 8, [
    serif(textValue(c.title, DEFAULTS.compare.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 610, fontSize: 38 }),
    box({ position: 'absolute', left: 82, top: 200, width: 370, height: 230, borderRight: `1px solid ${t.border}`, paddingRight: 40, flexDirection: 'column' }, [
      label(textValue(c.left_title, DEFAULTS.compare.left_title), spec, t),
      bulletList(arrayValue(c.left, DEFAULTS.compare.left), spec, t, { marginTop: 18 })
    ]),
    box({ position: 'absolute', right: 82, top: 200, width: 370, height: 230, paddingLeft: 24, flexDirection: 'column' }, [
      label(textValue(c.right_title, DEFAULTS.compare.right_title), spec, t),
      bulletList(arrayValue(c.right, DEFAULTS.compare.right), spec, t, { marginTop: 18 })
    ])
  ])
}

function renderEditorial(spec) {
  const c = content(spec, 'editorial')
  const t = palette('dark')
  const stats = arrayValue(c.stats, DEFAULTS.editorial.stats)
  return page(spec, 'dark', 9, [
    label(textValue(c.kicker, DEFAULTS.editorial.kicker), spec, t, { position: 'absolute', left: 74, top: 92 }),
    serif(textValue(c.title, DEFAULTS.editorial.title), spec, t, { position: 'absolute', left: 74, top: 122, width: 650, fontSize: 37 }),
    body(textValue(c.left, DEFAULTS.editorial.left), spec, t, { position: 'absolute', left: 74, top: 252, width: 330, fontSize: 14.5 }),
    body(textValue(c.right, DEFAULTS.editorial.right), spec, t, { position: 'absolute', left: 430, top: 252, width: 300, fontSize: 14.5 }),
    box({ position: 'absolute', right: 74, top: 250, width: 120, flexDirection: 'column' }, stats.slice(0, 4).map((item) =>
      box({ borderTop: `1px solid ${t.border}`, padding: '10px 0' }, [
        metric(item[0], spec, t, { fontSize: 25 }),
        label(item[1], spec, t, { color: t.hint, letterSpacing: 0.8, marginTop: 4 })
      ])
    ))
  ])
}

function renderDense(spec) {
  const c = content(spec, 'dense')
  const t = palette('dark')
  const cols = arrayValue(c.columns, DEFAULTS.dense.columns)
  return page(spec, 'dark', 10, [
    serif(textValue(c.title, DEFAULTS.dense.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 700, fontSize: 35, paddingBottom: 24, borderBottom: `1px solid ${t.border}` }),
    ...cols.slice(0, 2).map((col, index) =>
      box({ position: 'absolute', left: index === 0 ? 74 : 492, top: 220, width: 340, flexDirection: 'column' }, [
        label(col.label, spec, t, { color: t.hint, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }),
        ...arrayValue(col.paragraphs, []).map((paragraph) => body(paragraph, spec, t, { marginTop: 14, fontSize: 14.5, lineHeight: 1.58 }))
      ])
    )
  ])
}

function renderEnd(spec) {
  const c = content(spec, 'end')
  const t = palette('dark')
  return page(spec, 'dark', 12, [
    rule(t, { position: 'absolute', left: 128, top: 174 }),
    serif(textValue(c.title, DEFAULTS.end.title), spec, t, { position: 'absolute', left: 128, top: 206, width: 620, fontSize: 62 }),
    body(textValue(c.subtitle, DEFAULTS.end.subtitle), spec, t, { position: 'absolute', left: 130, top: 318, width: 500, fontSize: 18 }),
    label(textValue(c.contact, DEFAULTS.end.contact), spec, t, { position: 'absolute', left: 130, top: 392, color: t.hint })
  ], { includeChrome: false })
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const t = palette('dark')
  const values = arrayValue(c.values, DEFAULTS.chart.values)
  const labels = arrayValue(c.labels, DEFAULTS.chart.labels)
  const max = Math.max(...values, 1)
  return page(spec, 'dark', 13, [
    label(textValue(c.label, DEFAULTS.chart.label), spec, t, { position: 'absolute', left: 74, top: 88 }),
    serif(textValue(c.title, DEFAULTS.chart.title), spec, t, { position: 'absolute', left: 74, top: 120, width: 620, fontSize: 36 }),
    box({ position: 'absolute', left: 108, top: 238, width: 710, height: 190, borderLeft: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, flexDirection: 'row', alignItems: 'flex-end', gap: 42, paddingLeft: 20 }, values.slice(0, 4).map((value, index) =>
      box({ width: 110, height: 160, flexDirection: 'column', justifyContent: 'flex-end' }, [
        body(String(value), spec, t, { color: index === values.length - 1 ? t.gold : t.muted, fontSize: 15, marginBottom: 8 }),
        box({ width: 110, height: Math.max(28, (value / max) * 132), backgroundColor: index === values.length - 1 ? t.gold : t.hint }, []),
        label(labels[index], spec, t, { marginTop: 10, color: t.hint, letterSpacing: 0.9 })
      ])
    )),
    label(textValue(c.source, DEFAULTS.chart.source), spec, t, { position: 'absolute', left: 108, bottom: 78, color: t.hint })
  ], { chromeLabel: 'CHART NOTE' })
}

function renderDiagram(spec) {
  const c = content(spec, 'diagram')
  const t = palette('light')
  const steps = arrayValue(c.steps, DEFAULTS.diagram.steps)
  return page(spec, 'light', 14, [
    serif(textValue(c.title, DEFAULTS.diagram.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 520, fontSize: 39 }),
    box({ position: 'absolute', left: 88, top: 224, right: 88, flexDirection: 'row', alignItems: 'stretch' }, steps.slice(0, 3).map((step, index) =>
      box({ width: 238, marginRight: index < 2 ? 38 : 0, flexDirection: 'column' }, [
        metric(step[0], spec, t, { fontSize: 54 }),
        serif(step[1], spec, t, { marginTop: 12, fontSize: 25 }),
        body(step[2], spec, t, { marginTop: 12, fontSize: 14.5 }),
        index < 2 ? label('→', spec, t, { position: 'absolute', left: 250 + index * 276, top: 42, color: t.hint, fontSize: 22, letterSpacing: 0 }) : null
      ].filter(Boolean))
    ))
  ], { chromeLabel: 'FLOW' })
}

function renderPie(spec) {
  const c = content(spec, 'pie')
  const t = palette('dark')
  const items = arrayValue(c.items, DEFAULTS.pie.items)
  return page(spec, 'dark', 15, [
    serif(textValue(c.title, DEFAULTS.pie.title), spec, t, { position: 'absolute', left: 74, top: 94, width: 580, fontSize: 38 }),
    box({ position: 'absolute', left: 160, top: 232, width: 190, height: 190, borderRadius: 95, backgroundColor: t.gold, border: `1px solid ${t.gold}`, alignItems: 'center', justifyContent: 'center' }, [
      box({ width: 84, height: 84, borderRadius: 42, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }, [
        label('TOTAL', spec, t, { color: t.muted, textAlign: 'center', letterSpacing: 0.6 })
      ])
    ]),
    box({ position: 'absolute', right: 150, top: 210, width: 330, flexDirection: 'column', gap: 20 }, items.slice(0, 4).map((item, index) =>
      box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 13, height: 13, marginRight: 18, backgroundColor: [t.gold, t.muted, t.hint, t.border][index] }, []),
        body(item[0], spec, t, { flex: 1, color: t.text, fontSize: 18 }),
        label(item[1], spec, t, { width: 60, textAlign: 'right' })
      ])
    )),
    label(textValue(c.total, DEFAULTS.pie.total), spec, t, { position: 'absolute', right: 150, top: 398, width: 330, paddingTop: 14, borderTop: `1px solid ${t.border}`, color: t.hint })
  ])
}

function renderPyramid(spec) {
  const c = content(spec, 'pyramid')
  const t = palette('dark')
  const levels = arrayValue(c.levels, DEFAULTS.pyramid.levels)
  return page(spec, 'dark', 16, [
    serif(textValue(c.title, DEFAULTS.pyramid.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 560, fontSize: 38 }),
    box({ position: 'absolute', left: 122, top: 188, width: 716, flexDirection: 'column', alignItems: 'center', gap: 4 }, levels.slice(0, 5).map((level, index) =>
      box({ width: 280 + index * 88, height: 48, borderLeft: `3px solid ${t.gold}`, backgroundColor: index === 0 ? t.gold : t.border, opacity: index === 0 ? 0.95 : 0.84 - index * 0.08, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }, [
        body(level[0], spec, t, { color: t.text, fontSize: 17, fontWeight: 700 }),
        body(level[1], spec, t, { color: t.muted, fontSize: 12.5, width: 310, textAlign: 'right', lineHeight: 1.2 })
      ])
    ))
  ])
}

function renderVtimeline(spec) {
  const c = content(spec, 'vtimeline')
  const t = palette('dark')
  const events = arrayValue(c.events, DEFAULTS.vtimeline.events)
  return page(spec, 'dark', 17, [
    serif(textValue(c.title, DEFAULTS.vtimeline.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 600, fontSize: 38, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }),
    box({ position: 'absolute', left: 118, top: 190, width: 720, height: 260 }, [
      box({ position: 'absolute', left: 150, top: 0, width: 1, height: 250, backgroundColor: t.border }, []),
      ...events.slice(0, 4).flatMap((event, index) => {
        const top = index * 62
        return [
          label(event[0], spec, t, { position: 'absolute', left: 0, top: top + 3, width: 120, textAlign: 'right', color: t.hint }),
          box({ position: 'absolute', left: 146, top: top + 7, width: 9, height: 9, borderRadius: 5, backgroundColor: t.gold }, []),
          serif(event[1], spec, t, { position: 'absolute', left: 182, top, width: 220, fontSize: 22 }),
          body(event[2], spec, t, { position: 'absolute', left: 420, top: top + 3, width: 275, fontSize: 13.5 })
        ]
      })
    ])
  ], { chromeLabel: 'TIMELINE' })
}

function renderCycle(spec) {
  const c = content(spec, 'cycle')
  const t = palette('dark')
  const steps = arrayValue(c.steps, DEFAULTS.cycle.steps)
  return page(spec, 'dark', 18, [
    serif(textValue(c.title, DEFAULTS.cycle.title), spec, t, { position: 'absolute', left: 74, top: 92, width: 520, fontSize: 38 }),
    box({ position: 'absolute', left: 150, top: 190, width: 660, height: 260 }, steps.slice(0, 4).map((step, index) => {
      const positions = [
        { left: 0, top: 0 },
        { right: 0, top: 0 },
        { right: 0, bottom: 0 },
        { left: 0, bottom: 0 }
      ]
      return box({ position: 'absolute', width: 280, height: 104, borderTop: `2px solid ${t.gold}`, paddingTop: 14, flexDirection: 'column', ...positions[index] }, [
        metric(step[0], spec, t, { fontSize: 32 }),
        serif(step[1], spec, t, { fontSize: 22, marginTop: 6 }),
        body(step[2], spec, t, { fontSize: 12.8, marginTop: 6, lineHeight: 1.35 })
      ])
    })),
    label('↻', spec, t, { position: 'absolute', left: 465, top: 286, color: t.hint, fontSize: 32, letterSpacing: 0 })
  ], { chromeLabel: 'CYCLE' })
}

const RENDERERS = {
  cover: renderCover,
  chapter: renderChapter,
  statement: (spec) => renderStatement(spec, 'statement', 3),
  split: renderSplit,
  stats: renderStats,
  quote: renderQuote,
  list: renderList,
  compare: renderCompare,
  editorial: renderEditorial,
  dense: renderDense,
  'statement-2': (spec) => renderStatement(spec, 'statement-2', 11),
  end: renderEnd,
  chart: renderChart,
  diagram: renderDiagram,
  pie: renderPie,
  pyramid: renderPyramid,
  vtimeline: renderVtimeline,
  cycle: renderCycle
}

export function renderIntelligenceBrief(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
