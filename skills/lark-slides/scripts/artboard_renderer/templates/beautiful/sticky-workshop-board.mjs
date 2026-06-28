import { TextBlock, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'sticky-workshop-board'

export const PAGE_VARIANTS = [
  'title',
  'statement',
  'two-column',
  'chart',
  'features',
  'timeline',
  'image-text',
  'diagram',
  'comparison',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'scatterbrain',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'scatterbrain',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['title', 'statement', 'closing'],
      repeatable: ['two-column', 'chart', 'features', 'timeline', 'image-text', 'diagram', 'comparison']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/scatterbrain-1.png'
}

const P = {
  yellow: '#FFE066',
  yellowDeep: '#FFD43B',
  blue: '#A5D8FF',
  blueDeep: '#74C0FC',
  pink: '#FFC9C9',
  pinkDeep: '#FF9F9F',
  green: '#B2F2BB',
  greenDeep: '#8CE99A',
  orange: '#FFCC80',
  purple: '#D0BFFF',
  cream: '#FAF8F3',
  paper: '#F7F5F0',
  cork: '#D8BE91',
  corkDark: '#B99567',
  warm: '#FFF3D4',
  ink: '#2D2A26',
  inkLight: '#5C5750',
  white: '#FFFFFF',
  shadow: 'rgba(45,42,38,0.18)'
}

const DEFAULTS = {
  title: {
    title: 'Scatterbrain',
    subtitle: 'Collect your thoughts, pin your ideas, and watch the big picture emerge from creative chaos.',
    note: 'A Post-it Inspired Template',
    accents: ['Remember this!', 'Notes & Ideas', '!']
  },
  statement: {
    quote: 'The best ideas start as scattered thoughts on sticky corners.',
    body:
      'Every great project begins with a single note, a fleeting thought, a moment of inspiration captured before it drifts away.',
    author: '- The Creative Process',
    side_note: 'Jot it down before you forget!'
  },
  'two-column': {
    columns: [
      {
        label: '01 / Discovery',
        title: 'Finding the Problem',
        body: 'Every solution starts with understanding. Research and observation uncover what truly matters.',
        bullets: ['User research sessions', 'Market analysis', 'Stakeholder interviews', 'Competitive landscape']
      },
      {
        label: '02 / Solution',
        title: 'Crafting the Answer',
        body: 'With clarity comes creativity. Findings become strategies, prototypes, and tangible designs.',
        bullets: ['Ideation workshops', 'Prototype development', 'Iterative testing', 'Final delivery']
      }
    ]
  },
  chart: {
    title: 'Quarterly Growth',
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    values: [24, 38, 52, 71],
    legend_title: 'Key Metrics',
    legend: ['Revenue Streams', 'User Acquisition', 'Market Expansion', 'Product Lines'],
    note: 'Steady upward trend across all channels this fiscal year.'
  },
  features: {
    items: [
      { icon: 'A', title: 'Strategy', body: 'Map out your vision with clarity, milestones, and team alignment.' },
      { icon: 'B', title: 'Design', body: 'Craft experiences that resonate from early wireframes to polished interfaces.' },
      { icon: 'C', title: 'Launch', body: 'Ship with confidence, test quickly, and iterate toward lasting adoption.' }
    ]
  },
  timeline: {
    items: [
      {
        title: 'Phase One',
        phase: 'Foundation',
        body: 'Establish core principles, gather requirements, and build the architecture everything else stands on.'
      },
      {
        title: 'Phase Two',
        phase: 'Creation',
        body: 'Design prototypes, iterate through feedback cycles, and refine every detail until it feels intentional.'
      },
      {
        title: 'Phase Three',
        phase: 'Delivery',
        body: 'Launch, measure impact, gather insights, and prepare for the next cycle of innovation.'
      }
    ]
  },
  'image-text': {
    label: 'Spotlight',
    title: 'Capturing the Moment',
    body:
      'Visual storytelling transforms abstract concepts into tangible understanding. A single image can communicate what paragraphs struggle to explain.',
    body2:
      'Imagery bridges gaps, evokes emotion, and creates lasting impressions that words alone cannot achieve.',
    mini_note: 'Visuals first, text second.'
  },
  diagram: {
    title: 'Distribution Overview',
    center: 'Total',
    labels: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
    stats: [
      ['Total Reach', '128K'],
      ['Engagement', '84%'],
      ['Retention', '62%'],
      ['Satisfaction', '4.8']
    ],
    note: 'Numbers tell the story we need to hear.'
  },
  comparison: {
    left_title: 'Before',
    right_title: 'After',
    left: ['Scattered documentation', 'Unclear ownership', 'Inconsistent processes', 'Reactive problem solving', 'Silos between teams'],
    right: ['Centralized knowledge base', 'Defined responsibilities', 'Streamlined workflows', 'Proactive planning', 'Cross-functional alignment']
  },
  closing: {
    title: 'Thanks for Sticking Around',
    subtitle: 'Every great idea starts with a little note.',
    accents: ['Keep the ideas flowing!', 'Pin this somewhere safe.', 'OK', ':)'],
    contact: 'Questions, thoughts, or just want to say hello?'
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
  if (raw.includes('cover') || raw.includes('title')) return 'title'
  if (raw.includes('quote') || raw.includes('statement')) return 'statement'
  if (raw.includes('compare')) return 'comparison'
  if (raw.includes('timeline') || raw.includes('process')) return 'timeline'
  if (raw.includes('data') || raw.includes('chart')) return 'chart'
  if (raw.includes('closing') || raw.includes('cta')) return 'closing'
  return 'title'
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS.title), ...(spec.content || {}) }
}

function textValue(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function arrayValue(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function displayText(value, spec, style = {}) {
  return TextBlock(value, {
    color: P.ink,
    fontSize: 54,
    lineHeight: 1.05,
    letterSpacing: 0.8,
    whiteSpace: 'pre-wrap',
    ...role('display', spec, { fontWeight: 900, fontSize: 54, lineHeight: 1.05, letterSpacing: 0.8 }),
    ...style
  })
}

function bodyText(value, spec, style = {}) {
  return TextBlock(value, {
    color: P.ink,
    fontSize: 16,
    lineHeight: 1.45,
    ...role('body', spec, { fontWeight: 430, fontSize: 16, lineHeight: 1.45 }),
    ...style
  })
}

function labelText(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    color: P.inkLight,
    fontSize: 10,
    lineHeight: 1.1,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 800, fontSize: 10, lineHeight: 1.1, letterSpacing: 1.8, textTransform: 'uppercase' }),
    ...style
  })
}

function handText(value, spec, style = {}) {
  return TextBlock(value, {
    color: P.inkLight,
    fontSize: 21,
    lineHeight: 1.25,
    ...role('body', spec, { fontWeight: 560, fontSize: 21, lineHeight: 1.25 }),
    ...style
  })
}

function metricText(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: P.ink,
    fontSize: 34,
    lineHeight: 1,
    ...role('metric', spec, { fontWeight: 900, fontSize: 34, lineHeight: 1 }),
    ...style
  })
}

function bgColor(color) {
  if (color === 'yellow') return P.yellow
  if (color === 'blue') return P.blue
  if (color === 'pink') return P.pink
  if (color === 'green') return P.green
  if (color === 'orange') return P.orange
  if (color === 'purple') return P.purple
  if (color === 'white') return P.white
  return color || P.yellow
}

function pin(color = '#C92A2A', style = {}) {
  return box(
    {
      position: 'absolute',
      left: '50%',
      top: -9,
      width: 16,
      height: 16,
      marginLeft: -8,
      borderRadius: 8,
      backgroundColor: color,
      border: '2px solid rgba(255,255,255,0.45)',
      boxShadow: '0 2px 4px rgba(45,42,38,0.28)',
      ...style
    },
    []
  )
}

function tape(style = {}) {
  return box(
    {
      position: 'absolute',
      left: '50%',
      top: -13,
      width: 78,
      height: 24,
      marginLeft: -39,
      backgroundColor: 'rgba(255,255,255,0.45)',
      border: '1px solid rgba(255,255,255,0.35)',
      transform: 'rotate(-2deg)',
      ...style
    },
    []
  )
}

function sticky({ left, top, right, bottom, width, height, color = 'yellow', rotate = 0, pinColor = '#C92A2A', taped = false, bordered = false, z = 2, style = {} }, children = []) {
  const position = {}
  if (left !== undefined) position.left = left
  if (right !== undefined) position.right = right
  if (top !== undefined) position.top = top
  if (bottom !== undefined) position.bottom = bottom
  return box(
    {
      position: 'absolute',
      width,
      height,
      ...position,
      padding: 22,
      flexDirection: 'column',
      backgroundColor: bgColor(color),
      border: bordered ? `2px solid ${P.ink}` : '0 solid transparent',
      boxShadow: `3px 5px 18px ${P.shadow}`,
      transform: `rotate(${rotate}deg)`,
      zIndex: z,
      overflow: 'hidden',
      ...style
    },
    [taped ? tape() : null, pinColor ? pin(pinColor) : null, ...children].filter(Boolean)
  )
}

function doodle(kind, style = {}) {
  if (kind === 'circle') {
    return box({ position: 'absolute', border: `3px solid ${P.ink}`, borderRadius: 50, opacity: 0.13, ...style }, [])
  }
  if (kind === 'line') {
    return box({ position: 'absolute', height: 3, backgroundColor: P.ink, borderRadius: 3, opacity: 0.13, ...style }, [])
  }
  return box({ position: 'absolute', borderLeft: `3px solid ${P.ink}`, borderBottom: `3px solid ${P.ink}`, opacity: 0.13, transform: 'rotate(45deg)', ...style }, [])
}

function texture(kind) {
  const dots = [
    { left: 42, top: 38 },
    { left: 162, top: 88 },
    { left: 830, top: 70 },
    { left: 760, top: 412 },
    { left: 96, top: 438 }
  ]
  const base = dots.map((dot, index) =>
    box(
      {
        position: 'absolute',
        left: dot.left,
        top: dot.top,
        width: index % 2 ? 18 : 26,
        height: 3,
        backgroundColor: P.ink,
        opacity: kind === 'cork' ? 0.08 : 0.05,
        transform: `rotate(${index % 2 ? -18 : 22}deg)`
      },
      []
    )
  )
  if (kind === 'paper') {
    return [
      box({ position: 'absolute', inset: 0, backgroundColor: P.paper }, []),
      ...Array.from({ length: 11 }, (_, i) => box({ position: 'absolute', left: i * 88, top: 0, width: 1, height: 540, backgroundColor: P.ink, opacity: 0.035 }, [])),
      ...Array.from({ length: 7 }, (_, i) => box({ position: 'absolute', left: 0, top: i * 78, width: 960, height: 1, backgroundColor: P.ink, opacity: 0.035 }, [])),
      ...base
    ]
  }
  if (kind === 'warm') {
    return [
      box({ position: 'absolute', inset: 0, backgroundColor: P.warm }, []),
      box({ position: 'absolute', left: 80, top: 30, width: 280, height: 160, borderRadius: 140, backgroundColor: P.yellow, opacity: 0.26 }, []),
      box({ position: 'absolute', right: 70, top: 80, width: 260, height: 190, borderRadius: 130, backgroundColor: P.blue, opacity: 0.22 }, []),
      box({ position: 'absolute', left: 380, bottom: 20, width: 310, height: 160, borderRadius: 155, backgroundColor: P.pink, opacity: 0.2 }, []),
      ...base
    ]
  }
  return [
    box({ position: 'absolute', inset: 0, backgroundColor: P.cork }, []),
    box({ position: 'absolute', inset: 0, backgroundColor: P.corkDark, opacity: 0.25 }, []),
    ...Array.from({ length: 18 }, (_, i) => {
      const left = (i * 71) % 910
      const top = (i * 43) % 500
      return box({ position: 'absolute', left, top, width: 18, height: 18, opacity: 0.07 }, [
        box({ position: 'absolute', left: 8, top: 0, width: 2, height: 18, backgroundColor: P.ink }, []),
        box({ position: 'absolute', left: 0, top: 8, width: 18, height: 2, backgroundColor: P.ink }, [])
      ])
    }),
    ...base
  ]
}

function page(kind, children) {
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: kind === 'paper' ? P.paper : kind === 'warm' ? P.warm : P.cork
    },
    [...texture(kind), ...children]
  )
}

function bulletList(items, spec, style = {}) {
  return box({ flexDirection: 'column', gap: 6, ...style }, items.map((item) => bodyText(`• ${item}`, spec, { fontSize: 13.5, lineHeight: 1.25 })))
}

function renderTitle(spec) {
  const c = content(spec, 'title')
  const accents = arrayValue(c.accents, DEFAULTS.title.accents)
  return page('cork', [
    doodle('circle', { left: 55, top: 60, width: 78, height: 78 }),
    doodle('line', { right: 74, bottom: 86, width: 128, transform: 'rotate(-8deg)' }),
    sticky({ left: 210, top: 117, width: 540, height: 210, color: 'yellow', rotate: -2, taped: false }, [
      displayText(textValue(c.title, 'Scatterbrain'), spec, { fontSize: 74, lineHeight: 0.98, textAlign: 'center' }),
      handText(textValue(c.note, 'A Post-it Inspired Template'), spec, { marginTop: 12, textAlign: 'center', fontSize: 24 })
    ]),
    sticky({ left: 54, top: 118, width: 148, height: 74, color: 'blue', rotate: -10, pinColor: '#1864AB', style: { padding: 16 } }, [
      handText(accents[0], spec, { fontSize: 20, textAlign: 'center' })
    ]),
    sticky({ right: 44, top: 104, width: 142, height: 74, color: 'pink', rotate: 9, style: { padding: 16 } }, [
      handText(accents[1], spec, { fontSize: 19, textAlign: 'center' })
    ]),
    sticky({ right: 170, top: 280, width: 66, height: 62, color: 'green', rotate: 13, pinColor: null, style: { padding: 10, alignItems: 'center', justifyContent: 'center' } }, [
      displayText(accents[2], spec, { fontSize: 35, textAlign: 'center' })
    ]),
    bodyText(textValue(c.subtitle, DEFAULTS.title.subtitle), spec, {
      position: 'absolute',
      left: 250,
      top: 374,
      width: 460,
      textAlign: 'center',
      color: P.inkLight,
      fontSize: 19,
      lineHeight: 1.4
    })
  ])
}

function renderStatement(spec) {
  const c = content(spec, 'statement')
  return page('paper', [
    doodle('angle', { left: 74, top: 118, width: 66, height: 66 }),
    sticky({ left: 164, top: 108, width: 610, height: 302, color: 'yellow', rotate: -1, taped: true }, [
      displayText(`"${textValue(c.quote, DEFAULTS.statement.quote)}"`, spec, { fontSize: 42, lineHeight: 1.1 }),
      bodyText(textValue(c.body, DEFAULTS.statement.body), spec, { marginTop: 20, fontSize: 16.5, lineHeight: 1.44 }),
      handText(textValue(c.author, DEFAULTS.statement.author), spec, { marginTop: 14, textAlign: 'right', fontSize: 22 })
    ]),
    sticky({ right: 38, top: 238, width: 154, height: 98, color: 'blue', rotate: 8, pinColor: '#1864AB', style: { justifyContent: 'center' } }, [
      handText(textValue(c.side_note, DEFAULTS.statement.side_note), spec, { fontSize: 23, textAlign: 'center' })
    ])
  ])
}

function renderTwoColumn(spec) {
  const c = content(spec, 'two-column')
  const columns = arrayValue(c.columns, DEFAULTS['two-column'].columns)
  return page('warm', [
    ...columns.slice(0, 2).map((item, index) =>
      sticky(
        {
          left: index === 0 ? 112 : 492,
          top: index === 0 ? 92 : 134,
          width: 338,
          height: 340,
          color: index === 0 ? 'blue' : 'yellow',
          rotate: index === 0 ? -2 : 1,
          pinColor: index === 0 ? '#1864AB' : '#F59F00'
        },
        [
          labelText(item.label, spec),
          displayText(item.title, spec, { marginTop: 13, fontSize: 30, lineHeight: 1.08 }),
          bodyText(item.body, spec, { marginTop: 12, fontSize: 14.5, lineHeight: 1.35 }),
          bulletList(arrayValue(item.bullets, []), spec, { marginTop: 12 })
        ]
      )
    ),
    doodle('line', { right: 58, bottom: 72, width: 150, transform: 'rotate(8deg)' })
  ])
}

function renderChart(spec) {
  const c = content(spec, 'chart')
  const values = arrayValue(c.values, DEFAULTS.chart.values)
  const labels = arrayValue(c.labels, DEFAULTS.chart.labels)
  const legend = arrayValue(c.legend, DEFAULTS.chart.legend)
  const max = Math.max(...values, 1)
  return page('cork', [
    sticky({ left: 85, top: 78, width: 520, height: 376, color: 'white', rotate: -1, taped: true, bordered: false, pinColor: '#C92A2A', style: { padding: 28 } }, [
      displayText(textValue(c.title, DEFAULTS.chart.title), spec, { fontSize: 31, textAlign: 'center', marginBottom: 22 }),
      box(
        { position: 'relative', height: 250, width: 450, borderLeft: `2px solid ${P.ink}`, borderBottom: `2px solid ${P.ink}`, marginLeft: 20 },
        values.slice(0, 4).map((value, index) => {
          const height = 58 + (value / max) * 142
          const colors = [P.yellow, P.blue, P.pink, P.green]
          return box(
            {
              position: 'absolute',
              left: 34 + index * 92,
              bottom: 28,
              width: 54,
              height,
              backgroundColor: colors[index],
              border: `2px solid ${P.ink}`,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: 10
            },
            [
              metricText(String(value), spec, { fontSize: 20, textAlign: 'center' }),
              labelText(labels[index], spec, { position: 'absolute', bottom: -24, left: -8, width: 70, textAlign: 'center', fontSize: 10, letterSpacing: 0.5 })
            ]
          )
        })
      )
    ]),
    sticky({ right: 95, top: 120, width: 250, height: 300, color: 'green', rotate: 2, pinColor: '#2F9E44' }, [
      displayText(textValue(c.legend_title, DEFAULTS.chart.legend_title), spec, { fontSize: 30, marginBottom: 15 }),
      ...legend.slice(0, 4).map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, [
          box({ width: 17, height: 17, marginRight: 10, border: `2px solid ${P.ink}`, backgroundColor: [P.yellow, P.blue, P.pink, P.green][index] }, []),
          bodyText(item, spec, { fontSize: 13.5, lineHeight: 1.2, width: 170 })
        ])
      ),
      handText(textValue(c.note, DEFAULTS.chart.note), spec, { marginTop: 8, paddingTop: 12, borderTop: `2px solid ${P.ink}`, fontSize: 19 })
    ])
  ])
}

function renderFeatures(spec) {
  const c = content(spec, 'features')
  const items = arrayValue(c.items, DEFAULTS.features.items)
  return page('paper', [
    ...items.slice(0, 3).map((item, index) =>
      sticky(
        {
          left: 96 + index * 288,
          top: index === 1 ? 112 : 132,
          width: 238,
          height: 300,
          color: ['yellow', 'blue', 'pink'][index],
          rotate: [-2, 1, 3][index],
          pinColor: index === 1 ? '#1864AB' : '#C92A2A'
        },
        [
          box({ width: 54, height: 54, border: `3px solid ${P.ink}`, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, [
            metricText(item.icon, spec, { fontSize: 29, textAlign: 'center' })
          ]),
          displayText(item.title, spec, { fontSize: 31, lineHeight: 1.08, marginBottom: 15 }),
          bodyText(item.body, spec, { fontSize: 14.5, lineHeight: 1.38 })
        ]
      )
    ),
    doodle('angle', { right: 92, top: 52, width: 58, height: 58 }),
    doodle('circle', { left: 78, bottom: 64, width: 70, height: 70, borderStyle: 'dashed' })
  ])
}

function renderTimeline(spec) {
  const c = content(spec, 'timeline')
  const items = arrayValue(c.items, DEFAULTS.timeline.items)
  return page('warm', [
    ...items.slice(0, 3).map((item, index) => {
      const top = 66 + index * 144
      const reverse = index % 2 === 1
      return box({ position: 'absolute', left: 80, top, width: 800, height: 118 }, [
        sticky(
          {
            left: reverse ? 590 : 0,
            top: 0,
            width: 190,
            height: 108,
            color: ['yellow', 'blue', 'green'][index],
            rotate: reverse ? 2 : -2,
            pinColor: ['#C92A2A', '#1864AB', '#2F9E44'][index],
            style: { padding: 18, justifyContent: 'center' }
          },
          [displayText(item.title, spec, { fontSize: 26, textAlign: 'center' }), handText(item.phase, spec, { fontSize: 18, textAlign: 'center', marginTop: 5 })]
        ),
        box({
          position: 'absolute',
          left: reverse ? 250 : 218,
          top: 52,
          width: 320,
          height: 0,
          borderTop: `3px dashed rgba(45,42,38,0.34)`,
          transform: `rotate(${reverse ? -3 : 3}deg)`
        }, []),
        sticky(
          {
            left: reverse ? 0 : 584,
            top: 6,
            width: 250,
            height: 100,
            color: 'white',
            rotate: reverse ? -1 : 1,
            pinColor: null,
            bordered: true,
            style: { padding: 17, justifyContent: 'center' }
          },
          [bodyText(item.body, spec, { fontSize: 13.4, lineHeight: 1.32 })]
        )
      ])
    })
  ])
}

function renderImageText(spec) {
  const c = content(spec, 'image-text')
  return page('cork', [
    sticky({ left: 92, top: 116, width: 366, height: 282, color: 'white', rotate: -2, taped: true, style: { padding: 18 } }, [
      box({ width: 330, height: 226, backgroundColor: '#DEE2E6', position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, [
        box({ position: 'absolute', left: 36, top: 36, width: 160, height: 116, borderRadius: 90, backgroundColor: P.yellow, opacity: 0.32 }, []),
        box({ position: 'absolute', right: 24, bottom: 30, width: 170, height: 118, borderRadius: 95, backgroundColor: P.blue, opacity: 0.32 }, []),
        displayText('[ Visual Content ]', spec, { color: P.inkLight, opacity: 0.5, fontSize: 22, textAlign: 'center' })
      ])
    ]),
    sticky({ right: 105, top: 105, width: 352, height: 318, color: 'pink', rotate: 1, pinColor: '#C92A2A' }, [
      labelText(textValue(c.label, DEFAULTS['image-text'].label), spec),
      displayText(textValue(c.title, DEFAULTS['image-text'].title), spec, { marginTop: 12, fontSize: 33 }),
      bodyText(textValue(c.body, DEFAULTS['image-text'].body), spec, { marginTop: 14, fontSize: 14.5, lineHeight: 1.36 }),
      bodyText(textValue(c.body2, DEFAULTS['image-text'].body2), spec, { marginTop: 10, fontSize: 14.5, lineHeight: 1.36 })
    ]),
    sticky({ right: 86, bottom: 70, width: 176, height: 74, color: 'yellow', rotate: 6, pinColor: '#F59F00', style: { padding: 13, justifyContent: 'center' } }, [
      handText(textValue(c.mini_note, DEFAULTS['image-text'].mini_note), spec, { fontSize: 18, textAlign: 'center' })
    ]),
    doodle('angle', { right: 58, top: 74, width: 80, height: 80 })
  ])
}

function renderDiagram(spec) {
  const c = content(spec, 'diagram')
  const labels = arrayValue(c.labels, DEFAULTS.diagram.labels)
  const stats = arrayValue(c.stats, DEFAULTS.diagram.stats)
  return page('paper', [
    sticky({ left: 106, top: 100, width: 398, height: 326, color: 'white', rotate: -1, taped: true, pinColor: '#C92A2A', style: { padding: 28 } }, [
      displayText(textValue(c.title, DEFAULTS.diagram.title), spec, { fontSize: 31, textAlign: 'center', marginBottom: 18 }),
      box({ position: 'relative', width: 318, height: 192, marginLeft: 12 }, [
        box({ position: 'absolute', left: 26, top: 24, width: 138, height: 138, borderRadius: 69, backgroundColor: P.yellow, border: `2px solid ${P.ink}` }, []),
        box({ position: 'absolute', left: 86, top: 24, width: 78, height: 78, borderTopRightRadius: 78, backgroundColor: P.blue, borderRight: `2px solid ${P.ink}`, borderTop: `2px solid ${P.ink}` }, []),
        box({ position: 'absolute', left: 86, top: 92, width: 78, height: 70, borderBottomRightRadius: 78, backgroundColor: P.pink, borderRight: `2px solid ${P.ink}`, borderBottom: `2px solid ${P.ink}` }, []),
        box({ position: 'absolute', left: 66, top: 64, width: 58, height: 58, borderRadius: 29, backgroundColor: P.white, border: `2px solid ${P.ink}`, alignItems: 'center', justifyContent: 'center' }, [
          labelText(textValue(c.center, DEFAULTS.diagram.center), spec, { textAlign: 'center', letterSpacing: 0.2 })
        ]),
        ...labels.slice(0, 5).map((label, index) =>
          box({ position: 'absolute', left: 202, top: 16 + index * 32, flexDirection: 'row', alignItems: 'center' }, [
            box({ width: 15, height: 15, marginRight: 10, border: `1px solid ${P.ink}`, backgroundColor: [P.yellow, P.blue, P.pink, P.green, P.orange][index] }, []),
            bodyText(label, spec, { color: P.inkLight, fontSize: 12.5, lineHeight: 1 })
          ])
        )
      ])
    ]),
    sticky({ right: 112, top: 105, width: 320, height: 318, color: 'yellow', rotate: 2, pinColor: '#C92A2A' }, [
      displayText('Key Statistics', spec, { fontSize: 31, marginBottom: 10 }),
      ...stats.slice(0, 4).map((row) =>
        box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed rgba(45,42,38,0.22)' }, [
          bodyText(row[0], spec, { color: P.inkLight, fontSize: 14.5 }),
          metricText(row[1], spec, { fontSize: 25 })
        ])
      ),
      handText(textValue(c.note, DEFAULTS.diagram.note), spec, { marginTop: 16, fontSize: 20 })
    ]),
    doodle('line', { left: 56, bottom: 62, width: 120 })
  ])
}

function renderComparison(spec) {
  const c = content(spec, 'comparison')
  return page('warm', [
    sticky({ left: 116, top: 110, width: 326, height: 318, color: 'blue', rotate: -2, pinColor: '#1864AB' }, [
      displayText(textValue(c.left_title, DEFAULTS.comparison.left_title), spec, { fontSize: 34, textAlign: 'center', paddingBottom: 13, borderBottom: `3px solid ${P.ink}` }),
      bulletList(arrayValue(c.left, DEFAULTS.comparison.left), spec, { marginTop: 16 })
    ]),
    box({ position: 'absolute', left: 450, top: 243, width: 60, height: 60, borderRadius: 30, backgroundColor: P.ink, alignItems: 'center', justifyContent: 'center', zIndex: 6, boxShadow: `0 3px 8px ${P.shadow}` }, [
      labelText('vs', spec, { color: P.paper, textAlign: 'center', fontSize: 16, letterSpacing: 0 })
    ]),
    sticky({ right: 116, top: 110, width: 326, height: 318, color: 'yellow', rotate: 2, pinColor: '#F59F00' }, [
      displayText(textValue(c.right_title, DEFAULTS.comparison.right_title), spec, { fontSize: 34, textAlign: 'center', paddingBottom: 13, borderBottom: `3px solid ${P.ink}` }),
      bulletList(arrayValue(c.right, DEFAULTS.comparison.right), spec, { marginTop: 16 })
    ]),
    doodle('line', { left: 427, top: 70, width: 110, transform: 'rotate(90deg)' })
  ])
}

function renderClosing(spec) {
  const c = content(spec, 'closing')
  const accents = arrayValue(c.accents, DEFAULTS.closing.accents)
  return page('cork', [
    sticky({ left: 230, top: 150, width: 500, height: 176, color: 'yellow', rotate: -1, pinColor: '#C92A2A', style: { alignItems: 'center', justifyContent: 'center' } }, [
      displayText(textValue(c.title, DEFAULTS.closing.title), spec, { fontSize: 45, textAlign: 'center', lineHeight: 1.08 }),
      handText(textValue(c.subtitle, DEFAULTS.closing.subtitle), spec, { marginTop: 14, fontSize: 23, textAlign: 'center' })
    ]),
    sticky({ left: 132, top: 96, width: 176, height: 82, color: 'blue', rotate: -12, pinColor: '#1864AB', style: { padding: 14, justifyContent: 'center' } }, [
      handText(accents[0], spec, { fontSize: 18, textAlign: 'center' })
    ]),
    sticky({ right: 146, bottom: 135, width: 198, height: 80, color: 'pink', rotate: 8, pinColor: '#C92A2A', style: { padding: 14, justifyContent: 'center' } }, [
      handText(accents[1], spec, { fontSize: 18, textAlign: 'center' })
    ]),
    sticky({ right: 124, top: 118, width: 68, height: 58, color: 'green', rotate: 15, pinColor: '#2F9E44', style: { padding: 10, alignItems: 'center', justifyContent: 'center' } }, [
      handText(accents[2], spec, { fontSize: 18, textAlign: 'center' })
    ]),
    sticky({ left: 192, bottom: 130, width: 76, height: 62, color: 'orange', rotate: -6, pinColor: '#F59F00', style: { padding: 10, alignItems: 'center', justifyContent: 'center' } }, [
      handText(accents[3], spec, { fontSize: 19, textAlign: 'center' })
    ]),
    bodyText(textValue(c.contact, DEFAULTS.closing.contact), spec, {
      position: 'absolute',
      left: 260,
      top: 420,
      width: 440,
      color: P.inkLight,
      fontSize: 16,
      textAlign: 'center'
    }),
    doodle('angle', { right: 80, top: 58, width: 72, height: 72 }),
    doodle('line', { left: 98, bottom: 74, width: 110, transform: 'rotate(-8deg)' })
  ])
}

const RENDERERS = {
  title: renderTitle,
  statement: renderStatement,
  'two-column': renderTwoColumn,
  chart: renderChart,
  features: renderFeatures,
  timeline: renderTimeline,
  'image-text': renderImageText,
  diagram: renderDiagram,
  comparison: renderComparison,
  closing: renderClosing
}

export function renderStickyWorkshopBoard(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderTitle)(spec)
}
