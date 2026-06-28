import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'ledger-briefing'

const PAGE_VARIANTS = [
  'cover',
  'chapter',
  'statement',
  'split',
  'stats',
  'list',
  'compare',
  'quote',
  'dense',
  'chart',
  'diagram',
  'pie',
  'vtimeline',
  'cycle',
  'pyramid',
  'end'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'monochrome',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'monochrome',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'chapter', 'quote', 'end'],
      repeatable: ['statement', 'split', 'stats', 'list', 'compare', 'dense', 'chart', 'diagram', 'pie', 'vtimeline', 'cycle', 'pyramid']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/monochrome-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  cover: {
    eyebrow: 'User Research Synthesis / [Month, Year]',
    title: 'User Research Synthesis',
    subtitle: 'What we learned from 24 interviews and what it means for the product.',
    footer_left: 'Research Team - [Month, Year]',
    footer_right: 'Round [N] - Internal',
    page: '01 / 16'
  },
  chapter: {
    chapter: '01 - Context',
    title: 'Why we went back to users',
    subtitle: "Three months after launch, retention numbers told us something the metrics couldn't."
  },
  statement: {
    eyebrow: 'Primary objective - Round [N] synthesis',
    header_left: 'Key Finding',
    header_right: '03',
    title: "Users don't leave because they lose interest. They leave because they don't know what to do next."
  },
  split: {
    header_left: 'User Behavior',
    header_right: '04',
    eyebrow: 'The Pattern',
    title: 'The first 48 hours determine everything',
    subtitle: 'Users who complete three core actions in their first two days have a 4x higher 90-day retention rate. Most never get there.',
    bullets: [
      'Onboarding drop-off peaks at step 3',
      '"What do I do next?" is the most common exit trigger',
      'Users who invite a teammate retain at 2x the rate'
    ],
    caption: 'Session recording review - [Month of study]'
  },
  stats: {
    header_left: 'By the Numbers',
    header_right: '05',
    title: 'What the data showed',
    stats: [
      { value: '68%', label: 'of users churned within 14 days', note: '[Analytics tool] - [Launch month]' },
      { value: '3.2min', label: 'Average time before abandonment on the setup flow', note: 'Session recordings - n=240' },
      { value: '4x', label: 'Higher 90-day retention for users who complete onboarding fully', note: 'Cohort analysis' }
    ]
  },
  list: {
    header_left: 'Recommendations',
    header_right: '06',
    eyebrow: 'What to fix',
    title: 'Five changes, ordered by impact',
    subtitle: 'We recommend addressing these sequentially - later ones depend on the first landing.',
    bullets: [
      'Redesign the setup flow to three steps maximum',
      'Add a "start here" prompt on day one based on user type',
      'Surface the collaboration invite after first meaningful action',
      'Replace feature tour with outcome demonstration',
      'Build a 7-day email sequence that mirrors in-product progress'
    ]
  },
  compare: {
    header_left: 'Current - Proposed',
    header_right: '07',
    left_label: 'Current Onboarding',
    left_title: '9-step setup, any order',
    left_body: 'Users choose their own path through setup. Most choose wrong.',
    left_bullets: ['Average 3.2 minutes to first value', 'Step 6 is where 41% abandon', 'No adaptive logic based on user type'],
    right_label: 'Proposed Flow',
    right_title: '3-step guided path, adaptive',
    right_body: 'User type detected at signup. Path adjusts. First value in under 90 seconds.',
    right_bullets: ['Target: 90 seconds to first value', 'Eliminate decision paralysis at step entry', 'Inline help triggered at abandonment signals']
  },
  quote: {
    quote: '"I kept opening the app and then closing it again. I didn\'t know what I was supposed to do."',
    author: 'Participant 14 - 28 years old, Product Designer',
    context: 'Churned after day 11'
  },
  dense: {
    header_left: 'Analysis',
    header_right: '09',
    title: 'Why onboarding problems compound over time',
    columns: [
      {
        title: 'The Activation Trap',
        body: [
          'Activation is the moment a user experiences the core value of a product for the first time. When that moment is delayed, the mental model never fully forms.',
          'Each session that ends without activation reinforces the exit pattern. The gap between download and habit is where most products lose users permanently.',
          'Users who hit activation in session one have a 3x higher probability of returning in week two.'
        ]
      },
      {
        title: 'The Network Effect Delay',
        body: [
          'Collaboration products face a compounding problem: value increases with each additional teammate, but users must cross the value threshold alone.',
          'The median user does not discover the invitation flow until session four, after most have already churned.',
          'The single-player experience should become an explicit bridge to the collaborative one.'
        ]
      }
    ]
  },
  chart: {
    header_left: 'Retention Analysis',
    header_right: '11',
    title: '90-day retention by onboarding cohort',
    caption: '% retained - n=480 - [Q1 of study period]',
    bars: [
      { label: 'Cohort 1', value: 34 },
      { label: 'Cohort 2', value: 41 },
      { label: 'Cohort 3', value: 48 },
      { label: 'Proposed', value: 67, accent: true }
    ],
    source: 'Source: [Analytics tool] - Cohort analysis - Proposed target based on redesigned onboarding flow'
  },
  diagram: {
    header_left: 'Methodology',
    header_right: '12',
    title: 'How this research was conducted',
    steps: [
      { number: '01', title: 'Recruit', body: '24 participants screened from the active user base.' },
      { number: '02', title: 'Interview', body: '60-minute moderated sessions with cognitive walkthroughs.' },
      { number: '03', title: 'Analyse', body: 'Affinity mapping across 340 observations.' },
      { number: '04', title: 'Validate', body: 'Findings stress-tested against recordings and support data.' }
    ]
  },
  pie: {
    header_left: 'Participant Breakdown',
    header_right: '13',
    title: 'Who we spoke with',
    segments: [
      { label: 'Power Users', value: '38%' },
      { label: 'Casual Users', value: '25%' },
      { label: 'Churned Users', value: '22%' },
      { label: 'Prospects', value: '15%' }
    ],
    total: 'Total participants: [N] - [Study period]',
    source: 'Source: Recruitment screener - [Study period]'
  },
  vtimeline: {
    header_left: 'Process',
    header_right: '14',
    title: 'From research to recommendation',
    timeline: [
      { date: '[Week 1]', title: 'Recruitment', body: 'Screened [N]+ applicants and selected participants across segments.' },
      { date: '[Week 2-3]', title: 'Fieldwork', body: '[N] moderated sessions. Think-aloud protocol. Sessions recorded and transcribed.' },
      { date: '[Week 4]', title: 'Synthesis', body: 'Affinity mapping across observations. Pattern clustering by behaviour type.' },
      { date: '[Week 5]', title: 'Validation', body: 'Findings stress-tested against analytics data and support ticket samples.' }
    ]
  },
  cycle: {
    header_left: 'Design Process',
    header_right: '15',
    title: 'The design thinking cycle',
    steps: [
      { number: '01', title: 'Empathise', body: 'Understand users in their own context. Suspend assumptions.' },
      { number: '02', title: 'Define', body: 'Reframe the problem as a testable point of view.' },
      { number: '03', title: 'Prototype', body: 'Build to think, not to ship.' },
      { number: '04', title: 'Test', body: 'Put prototypes in front of real users.' }
    ]
  },
  pyramid: {
    header_left: 'Research Framework',
    header_right: '17',
    eyebrow: 'Research Framework',
    title: 'Analysis Hierarchy',
    subtitle: 'From raw observations to strategic insight',
    levels: ['Strategic Insight', 'Behavioral Patterns', 'Synthesized Themes', 'Coded Observations', 'Raw Field Notes']
  },
  end: {
    eyebrow: 'Research Team',
    title: 'Questions, feedback, and next steps',
    subtitle: '[research@org.com] - [Slack #research] - Full report at [link]'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || '#FAFADF',
    paper2: source.surface || source.bg_alt || '#F2F2D2',
    warm: source.panel || '#F5F0E4',
    ink: source.text || source.primary || '#1A1A16',
    muted: source.muted || '#5E5E54',
    faint: source.faint || '#8A8A80',
    line: source.line || '#1A1A16'
  }
}

const ROLE_FONT_RESOLVERS = {
  display: (spec, style) => fontRole('display', spec, style),
  body: (spec, style) => fontRole('body', spec, style),
  label: (spec, style) => fontRole('label', spec, style),
  metric: (spec, style) => fontRole('metric', spec, style)
}

function role(roleName, spec, style = {}) {
  const resolver = ROLE_FONT_RESOLVERS[roleName] || ((inputSpec, inputStyle) => fontRole(roleName, inputSpec, inputStyle))
  return resolver(spec, style)
}

function text(spec, key, fallback = '') {
  const value = spec.content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function list(spec, keys, fallback = []) {
  for (const key of keys) {
    const value = spec.content?.[key]
    if (Array.isArray(value) && value.length) return value
  }
  return fallback
}

function objectList(spec, keys, fallback = []) {
  return list(spec, keys, fallback).filter((item) => item && typeof item === 'object')
}

function upper(value) {
  return String(value || '').toUpperCase()
}

function normalizeVariant(spec) {
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  const sourceClass = `${spec.page_family_source?.source_class || ''}`.toLowerCase()
  const value = `${raw} ${sourceClass}`
  for (const variant of PAGE_VARIANTS) {
    if (value.includes(variant)) return variant
  }
  if (value.includes('agenda') || value.includes('chapter')) return 'chapter'
  if (value.includes('quote')) return 'quote'
  if (value.includes('process') || value.includes('timeline')) return 'vtimeline'
  if (value.includes('closing') || value.includes('close') || value.includes('end')) return 'end'
  if (value.includes('chart') || value.includes('bar')) return 'chart'
  if (value.includes('diagram') || value.includes('flow')) return 'diagram'
  if (value.includes('compare')) return 'compare'
  if (value.includes('split')) return 'split'
  if (value.includes('stat') || value.includes('metric')) return 'stats'
  if (value.includes('dense') || value.includes('detail')) return 'dense'
  if (value.includes('data')) return 'stats'
  return 'cover'
}

function fallback(variant) {
  return DEFAULTS[variant] || DEFAULTS.cover
}

function titleLines(value, fallbackValue) {
  const words = String(value || fallbackValue || '').replace(/\n+/g, ' ').split(/\s+/).filter(Boolean)
  const mid = Math.max(1, Math.ceil(words.length / 2))
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean)
}

function frame(spec, variant, children, opts = {}) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: opts.background || theme.paper,
      color: opts.color || theme.ink
    },
    opts.chrome === false ? children : [...chrome(spec, variant), ...children, ...foot(spec, variant)]
  )
}

function line(style = {}) {
  return box({ height: 1, backgroundColor: colors(style.spec || {}).line || '#1A1A16', ...style })
}

function label(value, spec, style = {}) {
  return TextBlock(upper(value), {
    color: colors(spec).faint,
    fontSize: 7,
    lineHeight: 1.05,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 400 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: colors(spec).muted,
    fontSize: 12,
    lineHeight: 1.55,
    ...role('body', spec, { fontWeight: 300 }),
    ...style
  })
}

function heading(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: colors(spec).ink,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: -0.3,
    ...role('display', spec, { fontWeight: 200 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: colors(spec).ink,
    fontSize: 52,
    lineHeight: 1,
    letterSpacing: -1.2,
    ...role('metric', spec, { fontWeight: 200 }),
    ...style
  })
}

function chrome(spec, variant) {
  const theme = colors(spec)
  const data = fallback(variant)
  const left = text(spec, 'header_left', data.header_left || variant.replace('-', ' '))
  const right = text(spec, 'header_right', data.header_right || String(spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1).padStart(2, '0'))
  return [
    box({ position: 'absolute', left: 78, right: 78, top: 44, height: 1, backgroundColor: theme.line }),
    label(left, spec, { position: 'absolute', left: 78, top: 28, color: theme.faint }),
    label(right, spec, { position: 'absolute', right: 78, top: 28, color: theme.faint, textAlign: 'right' })
  ]
}

function foot(spec, variant) {
  const theme = colors(spec)
  const page = spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
  return [
    box({ position: 'absolute', left: 78, right: 78, bottom: 44, height: 1, backgroundColor: theme.line }),
    label(text(spec, 'footer_left', 'User Research Synthesis'), spec, { position: 'absolute', left: 78, bottom: 26, color: theme.faint }),
    label(text(spec, 'footer_right', `Research Team - ${String(page).padStart(2, '0')}`), spec, { position: 'absolute', right: 78, bottom: 26, color: theme.faint, textAlign: 'right' })
  ]
}

function bulletList(items, spec, style = {}) {
  const theme = colors(spec)
  return box({ flexDirection: 'column', gap: style.gap || 12, ...style }, items.map((item) =>
    box({ flexDirection: 'row', alignItems: 'flex-start', width: style.width || '100%' }, [
      label('-', spec, { color: theme.faint, fontSize: style.markerSize || 13, width: 20, letterSpacing: 0 }),
      body(String(item), spec, { width: style.textWidth || 300, fontSize: style.fontSize || 13, lineHeight: style.lineHeight || 1.45, color: style.color || theme.ink })
    ])
  ))
}

function renderCover(spec) {
  const theme = colors(spec)
  const data = fallback('cover')
  const lines = titleLines(text(spec, 'title', data.title), data.title)
  return frame(spec, 'cover', [
    label(text(spec, 'eyebrow', data.eyebrow), spec, { position: 'absolute', top: 46, right: 78, width: 330, textAlign: 'right' }),
    box({ position: 'absolute', left: 78, right: 78, bottom: 78, height: 1, backgroundColor: theme.line }),
    box({ position: 'absolute', left: 78, bottom: 110, width: 520, flexDirection: 'column', gap: 12 }, [
      ...lines.map((item) => heading(item, spec, { fontSize: 64, lineHeight: 0.94, width: 520 })),
      box({ width: 36, height: 1, backgroundColor: theme.line, marginTop: 12, marginBottom: 4 }),
      body(text(spec, 'subtitle', data.subtitle), spec, { width: 490, fontSize: 16, lineHeight: 1.55 })
    ]),
    label(text(spec, 'footer_left', data.footer_left), spec, { position: 'absolute', left: 78, bottom: 50 }),
    label(text(spec, 'footer_right', data.footer_right), spec, { position: 'absolute', right: 78, bottom: 50, textAlign: 'right' })
  ], { chrome: false })
}

function renderChapter(spec) {
  const theme = colors(spec)
  const data = fallback('chapter')
  const lines = titleLines(text(spec, 'title', data.title), data.title)
  return frame(spec, 'chapter', [
    label(text(spec, 'chapter', data.chapter), spec, { position: 'absolute', left: 120, top: 178, color: theme.paper2 }),
    box({ position: 'absolute', left: 120, top: 216, width: 36, height: 1, backgroundColor: theme.paper2 }),
    box({ position: 'absolute', left: 120, top: 246, width: 520, flexDirection: 'column', gap: 2 },
      lines.map((item) => heading(item, spec, { color: theme.paper, fontSize: 48, lineHeight: 1.08, width: 520 }))
    ),
    body(text(spec, 'subtitle', data.subtitle), spec, { position: 'absolute', left: 120, top: 382, width: 430, color: '#B8B8AA', fontSize: 14, lineHeight: 1.55 })
  ], { chrome: false, background: theme.ink, color: theme.paper })
}

function renderStatement(spec) {
  const theme = colors(spec)
  const data = fallback('statement')
  return frame(spec, 'statement', [
    label(text(spec, 'eyebrow', data.eyebrow), spec, { position: 'absolute', left: 130, top: 176, width: 500 }),
    heading(text(spec, 'title', data.title), spec, {
      position: 'absolute',
      left: 130,
      top: 210,
      width: 615,
      fontSize: 46,
      lineHeight: 1.08
    }),
    box({ position: 'absolute', left: 130, top: 420, width: 36, height: 1, backgroundColor: theme.line })
  ])
}

function renderSplit(spec) {
  const theme = colors(spec)
  const data = fallback('split')
  const bullets = list(spec, ['bullets'], data.bullets).slice(0, 3)
  return frame(spec, 'split', [
    box({ position: 'absolute', left: 78, top: 96, width: 360, flexDirection: 'column', gap: 15 }, [
      label(text(spec, 'eyebrow', data.eyebrow), spec),
      heading(text(spec, 'title', data.title), spec, { fontSize: 34, lineHeight: 1.15, width: 330 }),
      body(text(spec, 'subtitle', data.subtitle), spec, { width: 350, fontSize: 14, lineHeight: 1.55 }),
      bulletList(bullets, spec, { width: 350, textWidth: 316, fontSize: 12, gap: 8, lineHeight: 1.35 })
    ]),
    box({ position: 'absolute', right: 78, top: 112, width: 352, height: 292, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper2, alignItems: 'center', justifyContent: 'center' }, [
      label('Image placeholder', spec, { color: theme.muted, letterSpacing: 1.1 })
    ]),
    label(text(spec, 'caption', data.caption), spec, { position: 'absolute', right: 78, top: 418, width: 352, opacity: 0.65 })
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const data = fallback('stats')
  const stats = objectList(spec, ['stats', 'metrics', 'items'], data.stats).slice(0, 3)
  return frame(spec, 'stats', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 116, width: 600, fontSize: 36 }),
    box({ position: 'absolute', left: 78, right: 78, top: 238, flexDirection: 'row', gap: 0 },
      stats.map((item) => box({ width: 268, minHeight: 180, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 22, paddingRight: 28, flexDirection: 'column', gap: 10 }, [
        metric(item.value, spec, { fontSize: 56, letterSpacing: -1.4 }),
        body(item.label, spec, { width: 218, color: theme.ink, fontSize: 13, lineHeight: 1.42 }),
        label(item.note || item.source || '', spec, { width: 218, lineHeight: 1.25 })
      ]))
    )
  ])
}

function renderList(spec) {
  const data = fallback('list')
  const bullets = list(spec, ['bullets', 'items'], data.bullets).slice(0, 5)
  return frame(spec, 'list', [
    box({ position: 'absolute', left: 78, top: 144, width: 300, flexDirection: 'column', gap: 16 }, [
      label(text(spec, 'eyebrow', data.eyebrow), spec),
      heading(text(spec, 'title', data.title), spec, { fontSize: 34, lineHeight: 1.14 }),
      body(text(spec, 'subtitle', data.subtitle), spec, { width: 260, fontSize: 13, lineHeight: 1.55 })
    ]),
    box({ position: 'absolute', right: 78, top: 142, width: 410 }, [
      bulletList(bullets, spec, { width: 410, textWidth: 370, fontSize: 16, lineHeight: 1.45, gap: 18 })
    ])
  ])
}

function comparePanel(spec, opts) {
  const theme = colors(spec)
  return box({ width: 392, height: 312, paddingTop: 14, paddingRight: opts.right ? 0 : 42, paddingLeft: opts.right ? 42 : 0, flexDirection: 'column', gap: 14, borderRightWidth: opts.right ? 0 : 1, borderRightColor: theme.line }, [
    label(opts.label, spec, { color: opts.right ? theme.ink : theme.faint, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.line }),
    heading(opts.title, spec, { fontSize: 24, lineHeight: 1.2, width: 300 }),
    body(opts.body, spec, { width: 300, fontSize: 14, lineHeight: 1.45 }),
    bulletList(opts.bullets, spec, { width: 300, textWidth: 270, fontSize: 11, gap: 8, lineHeight: 1.35 })
  ])
}

function renderCompare(spec) {
  const data = fallback('compare')
  return frame(spec, 'compare', [
    box({ position: 'absolute', left: 78, top: 128, flexDirection: 'row' }, [
      comparePanel(spec, {
        label: text(spec, 'left_label', data.left_label),
        title: text(spec, 'left_title', data.left_title),
        body: text(spec, 'left_body', data.left_body),
        bullets: list(spec, ['left_bullets'], data.left_bullets),
        right: false
      }),
      comparePanel(spec, {
        label: text(spec, 'right_label', data.right_label),
        title: text(spec, 'right_title', data.right_title),
        body: text(spec, 'right_body', data.right_body),
        bullets: list(spec, ['right_bullets'], data.right_bullets),
        right: true
      })
    ])
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  const data = fallback('quote')
  return frame(spec, 'quote', [
    TextBlock(text(spec, 'quote', data.quote), {
      position: 'absolute',
      left: 132,
      top: 156,
      width: 650,
      color: theme.paper,
      fontSize: 32,
      lineHeight: 1.35,
      fontStyle: 'italic',
      ...role('body', spec, { fontWeight: 400 })
    }),
    label(text(spec, 'author', data.author), spec, { position: 'absolute', left: 132, top: 370, color: '#B8B8AA', width: 430 }),
    label(text(spec, 'context', data.context), spec, { position: 'absolute', left: 132, top: 392, color: '#B8B8AA', width: 430 })
  ], { chrome: false, background: theme.ink, color: theme.paper })
}

function renderDense(spec) {
  const theme = colors(spec)
  const data = fallback('dense')
  const columns = objectList(spec, ['columns', 'details'], data.columns).slice(0, 2)
  return frame(spec, 'dense', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 88, width: 690, fontSize: 31, lineHeight: 1.16 }),
    box({ position: 'absolute', left: 78, right: 78, top: 168, height: 1, backgroundColor: theme.line }),
    box({ position: 'absolute', left: 78, right: 78, top: 195, flexDirection: 'row', gap: 50 },
      columns.map((column) => box({ width: 377, flexDirection: 'column', gap: 8 }, [
        label(column.title || column.heading || 'Analysis', spec, { color: theme.faint, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.line }),
        ...(Array.isArray(column.body) ? column.body : Array.isArray(column.items) ? column.items : [column.body || column.description || ''])
          .slice(0, 3)
          .map((item) => body(item, spec, { width: 360, fontSize: 10.8, lineHeight: 1.55 }))
      ]))
    )
  ])
}

function renderChart(spec) {
  const theme = colors(spec)
  const data = fallback('chart')
  const bars = objectList(spec, ['bars', 'metrics'], data.bars).slice(0, 5)
  const max = Math.max(100, ...bars.map((item) => Number(item.value) || 0))
  return frame(spec, 'chart', [
    box({ position: 'absolute', left: 78, right: 78, top: 94, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, [
      heading(text(spec, 'title', data.title), spec, { width: 560, fontSize: 32, lineHeight: 1.12 }),
      body(text(spec, 'caption', data.caption), spec, { width: 210, fontSize: 10, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 122, top: 210, width: 730, height: 182, borderLeftWidth: 1, borderLeftColor: theme.line, borderBottomWidth: 1, borderBottomColor: theme.line, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingLeft: 22 },
      bars.map((item) => {
        const value = Number(item.value) || 0
        return box({ width: 92, height: 170, flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', gap: 8 }, [
          TextBlock(`${value}%`, { color: item.accent ? theme.ink : theme.muted, textAlign: 'center', ...role('metric', spec, { fontSize: 14, fontWeight: item.accent ? 500 : 300 }) }),
          box({ height: Math.max(24, (value / max) * 138), backgroundColor: item.accent ? theme.ink : theme.faint, opacity: item.accent ? 1 : 0.5 }),
          label(item.label, spec, { textAlign: 'center', fontSize: 7, letterSpacing: 0.8, color: theme.faint })
        ])
      })
    ),
    label(text(spec, 'source', data.source), spec, { position: 'absolute', left: 122, top: 418, width: 620, lineHeight: 1.3 })
  ])
}

function renderDiagram(spec) {
  const theme = colors(spec)
  const data = fallback('diagram')
  const steps = objectList(spec, ['steps', 'items'], data.steps).slice(0, 4)
  return frame(spec, 'diagram', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 104, width: 600, fontSize: 34 }),
    box({ position: 'absolute', left: 78, right: 78, top: 218, flexDirection: 'row' },
      steps.map((step) => box({ width: 201, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 20, paddingRight: 30, flexDirection: 'column', gap: 10 }, [
        metric(step.number, spec, { color: theme.faint, fontSize: 38 }),
        heading(step.title, spec, { fontSize: 20, lineHeight: 1.18, width: 150 }),
        body(step.body, spec, { width: 150, fontSize: 11, lineHeight: 1.5 })
      ]))
    )
  ])
}

function renderPie(spec) {
  const theme = colors(spec)
  const data = fallback('pie')
  const segments = objectList(spec, ['segments', 'items'], data.segments).slice(0, 4)
  const fills = [theme.ink, theme.muted, theme.faint, theme.paper2]
  return frame(spec, 'pie', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 104, width: 520, fontSize: 34 }),
    box({ position: 'absolute', left: 148, top: 218, width: 164, height: 164, borderRadius: 82, borderWidth: 30, borderColor: theme.ink, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' }, [
      label('PARTICIPANTS', spec, { color: theme.muted, textAlign: 'center', fontSize: 7, letterSpacing: 0.8 })
    ]),
    box({ position: 'absolute', left: 360, top: 210, width: 408, flexDirection: 'column', gap: 18 },
      segments.map((item, index) => box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 12, height: 12, backgroundColor: fills[index], borderWidth: index === 3 ? 1 : 0, borderColor: theme.line, marginRight: 14 }),
        body(item.label, spec, { width: 220, color: theme.ink, fontSize: 16 }),
        label(item.value, spec, { color: theme.ink, fontSize: 12, letterSpacing: 1.2, textAlign: 'right', width: 70 })
      ]))
    ),
    box({ position: 'absolute', left: 360, top: 386, width: 408, height: 1, backgroundColor: theme.line }),
    label(text(spec, 'total', data.total), spec, { position: 'absolute', left: 360, top: 405, width: 408 })
  ])
}

function renderVerticalTimeline(spec) {
  const theme = colors(spec)
  const data = fallback('vtimeline')
  const items = objectList(spec, ['timeline', 'items'], data.timeline).slice(0, 4)
  return frame(spec, 'vtimeline', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 88, width: 690, fontSize: 34 }),
    box({ position: 'absolute', left: 78, right: 78, top: 168, height: 1, backgroundColor: theme.line }),
    box({ position: 'absolute', left: 154, top: 202, width: 1, height: 238, backgroundColor: theme.line }),
    ...items.flatMap((item, index) => {
      const y = 205 + index * 58
      return [
        label(item.date, spec, { position: 'absolute', left: 78, top: y + 2, width: 58, textAlign: 'right' }),
        box({ position: 'absolute', left: 150, top: y + 4, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.ink }),
        heading(item.title, spec, { position: 'absolute', left: 182, top: y - 2, width: 220, fontSize: 20, lineHeight: 1.2 }),
        body(item.body, spec, { position: 'absolute', left: 182, top: y + 25, width: 520, fontSize: 11, lineHeight: 1.42 })
      ]
    })
  ])
}

function renderCycle(spec) {
  const theme = colors(spec)
  const data = fallback('cycle')
  const steps = objectList(spec, ['steps', 'items'], data.steps).slice(0, 4)
  const positions = [
    { left: 132, top: 176 },
    { left: 512, top: 176 },
    { left: 512, top: 334 },
    { left: 132, top: 334 }
  ]
  return frame(spec, 'cycle', [
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 94, width: 560, fontSize: 34 }),
    ...steps.flatMap((step, index) => {
      const pos = positions[index]
      return [
        box({ position: 'absolute', left: pos.left, top: pos.top, width: 286, height: 116, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 16, flexDirection: 'column', gap: 8 }, [
          metric(step.number, spec, { color: theme.faint, fontSize: 30 }),
          heading(step.title, spec, { fontSize: 18, lineHeight: 1.15 }),
          body(step.body, spec, { width: 238, fontSize: 10.8, lineHeight: 1.35 })
        ])
      ]
    }),
    label('->', spec, { position: 'absolute', left: 444, top: 220, color: theme.faint, fontSize: 20, letterSpacing: 0 }),
    label('v', spec, { position: 'absolute', left: 642, top: 292, color: theme.faint, fontSize: 20, letterSpacing: 0 }),
    label('<-', spec, { position: 'absolute', left: 444, top: 378, color: theme.faint, fontSize: 20, letterSpacing: 0 }),
    label('v', spec, { position: 'absolute', left: 268, top: 292, color: theme.faint, fontSize: 20, letterSpacing: 0 })
  ])
}

function renderPyramid(spec) {
  const theme = colors(spec)
  const data = fallback('pyramid')
  const levels = list(spec, ['levels', 'items'], data.levels).slice(0, 5)
  const widths = [250, 360, 470, 580, 690]
  const fills = ['#34342E', '#5A5A51', '#88887A', '#C2C2A9', theme.paper2]
  return frame(spec, 'pyramid', [
    label(text(spec, 'eyebrow', data.eyebrow), spec, { position: 'absolute', left: 78, top: 92 }),
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 78, top: 124, width: 520, fontSize: 34 }),
    body(text(spec, 'subtitle', data.subtitle), spec, { position: 'absolute', left: 78, top: 170, width: 420, fontSize: 14 }),
    box({ position: 'absolute', left: 135, top: 224, width: 690, height: 214, flexDirection: 'column', alignItems: 'center', gap: 4 },
      levels.map((item, index) => box({ width: widths[index], height: 38, backgroundColor: fills[index], borderLeftWidth: 2, borderLeftColor: theme.line, alignItems: 'center', justifyContent: 'center' }, [
        body(item, spec, { color: index < 2 ? theme.paper : theme.ink, fontSize: 13, lineHeight: 1, textAlign: 'center' })
      ]))
    )
  ])
}

function renderEnd(spec) {
  const theme = colors(spec)
  const data = fallback('end')
  return frame(spec, 'end', [
    label(text(spec, 'eyebrow', data.eyebrow), spec, { position: 'absolute', left: 120, top: 170 }),
    box({ position: 'absolute', left: 120, top: 202, width: 36, height: 1, backgroundColor: theme.line }),
    heading(text(spec, 'title', data.title), spec, { position: 'absolute', left: 120, top: 232, width: 520, fontSize: 46, lineHeight: 1.08 }),
    body(text(spec, 'subtitle', data.subtitle), spec, { position: 'absolute', left: 120, top: 384, width: 420, fontSize: 14, lineHeight: 1.5 })
  ], { chrome: false })
}

export function renderMonochromeLedgerBriefing(spec) {
  switch (normalizeVariant(spec)) {
    case 'chapter':
      return renderChapter(spec)
    case 'statement':
      return renderStatement(spec)
    case 'split':
      return renderSplit(spec)
    case 'stats':
      return renderStats(spec)
    case 'list':
      return renderList(spec)
    case 'compare':
      return renderCompare(spec)
    case 'quote':
      return renderQuote(spec)
    case 'dense':
      return renderDense(spec)
    case 'chart':
      return renderChart(spec)
    case 'diagram':
      return renderDiagram(spec)
    case 'pie':
      return renderPie(spec)
    case 'vtimeline':
      return renderVerticalTimeline(spec)
    case 'cycle':
      return renderCycle(spec)
    case 'pyramid':
      return renderPyramid(spec)
    case 'end':
      return renderEnd(spec)
    case 'cover':
    default:
      return renderCover(spec)
  }
}
