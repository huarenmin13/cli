import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'creative-mode-grid'

const PAGE_VARIANTS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'creative-mode',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'creative-mode',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['s1', 's8'],
      repeatable: ['s2', 's3', 's4', 's5', 's6', 's7']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/creative-mode-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  s1: {
    eyebrow: 'VOL. 01 / EDITION 2026',
    title: 'Creative Mode',
    subtitle: 'A presentation template - eight pages, eight layouts. Replace freely.',
    footer: 'A PRESENTATION TEMPLATE'
  },
  s2: {
    eyebrow: 'A NOTE BEFORE WE BEGIN',
    title: 'Flip the switch.',
    subtitle:
      'Use this page to set up the chapter, introduce the speaker, and frame the question the deck is going to answer.',
    marker: 'PRESS PLAY',
    points: ['Context for the chapter', 'A quieter definition', 'A forward pointer']
  },
  s3: {
    eyebrow: 'BY THE NUMBERS',
    title: 'Four figures, one story.',
    metrics: [
      { value: '42%', label: 'Lift in engagement', body: 'Placeholder caption describing the metric and why it matters.' },
      { value: '2.7x', label: 'Throughput multiplier', body: 'A short generic explainer line with punchy cadence.' },
      { value: '118', label: 'Active placeholders', body: 'Filler descriptor about the count. Two lines maximum.' },
      { value: '$9.4M', label: 'Total sample value', body: 'Closing stat caption with oversized numbers.' }
    ]
  },
  s4: {
    eyebrow: 'SYSTEM DIAGRAM',
    title: 'A stack of moving parts.',
    subtitle:
      'The four blocks represent layers of a hypothetical system. Drop in your own labels and short notes per layer.',
    layers: ['Interface', 'Orchestration', 'Services', 'Substrate']
  },
  s5: {
    eyebrow: 'QUARTERLY READOUT',
    title: 'Placeholder metric, by quarter.',
    metrics: [34, 48, 61, 55, 72, 84, 91],
    labels: ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25"]
  },
  s6: {
    eyebrow: 'HOW IT WORKS',
    title: 'A four-step process.',
    items: [
      { title: 'Discover', body: 'Generic placeholder description for the first step.' },
      { title: 'Define', body: 'Filler text outlining the second step of the process.' },
      { title: 'Develop', body: 'Third step placeholder with rhythmic color cards.' },
      { title: 'Deliver', body: 'Closing step copy anchored by the primary color.' }
    ]
  },
  s7: {
    eyebrow: 'SIDE BY SIDE',
    title: 'Three options, compared.',
    headers: ['Attribute', 'Option A', 'Option B', 'Option C'],
    rows: [
      ['Speed', 'Fast', 'Faster', 'Fastest'],
      ['Footprint', 'Light', 'Medium', 'Heavy'],
      ['Effort', 'Low', 'Mid', 'High'],
      ['Outcome', 'Sample', 'Sample', 'Sample']
    ]
  },
  s8: {
    eyebrow: 'END OF DECK',
    title: 'Thank you.',
    subtitle: 'Use this space for a sign-off, a contact handle, or a one-sentence summary.',
    stamp: '08/08'
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    cream: source.background || source.cream || '#EFE9D9',
    cream2: source.cream_2 || source.surface || '#E4DCC4',
    ink: source.text || '#0F0F0F',
    ink2: source.muted || '#2A2A2A',
    green: source.primary || '#1F8A4C',
    greenDark: source.green_dark || '#136636',
    pink: source.pink || source.panel || '#F06CA8',
    pinkDark: source.pink_dark || '#D14E8B',
    orange: source.accent || '#E85A1F',
    yellow: source.yellow || '#F5C518'
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

function titleLines(value, fallback = 'CREATIVE MODE') {
  const parts = String(value || fallback).trim().split(/\s+/).filter(Boolean)
  const first = parts.slice(0, Math.max(1, Math.ceil(parts.length / 2))).join(' ')
  const second = parts.slice(Math.max(1, Math.ceil(parts.length / 2))).join(' ')
  return { first: upper(first || 'CREATIVE'), second: upper(second || 'MODE') }
}

function normalizeVariant(spec) {
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  const sourceClass = `${spec.page_family_source?.source_class || ''}`.toLowerCase()
  const value = `${raw} ${sourceClass}`
  for (const variant of PAGE_VARIANTS) {
    if (value.includes(variant)) return variant
  }
  if (value.includes('cover') || value.includes('hero')) return 's1'
  if (value.includes('agenda') || value.includes('intro') || value.includes('chapter')) return 's2'
  if (value.includes('process') || value.includes('flow')) return 's6'
  if (value.includes('compare') || value.includes('comparison') || value.includes('table')) return 's7'
  if (value.includes('closing') || value.includes('close') || value.includes('end')) return 's8'
  if (value.includes('chart') || value.includes('bar')) return 's5'
  if (value.includes('diagram')) return 's4'
  if (value.includes('data') || value.includes('metric') || value.includes('stat')) return 's3'
  return 's1'
}

function chrome(spec, variant, opts = {}) {
  const theme = colors(spec)
  const light = opts.light || false
  const color = light ? theme.cream : theme.ink
  const page = spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
  const eyebrow = text(spec, 'eyebrow', DEFAULTS[variant]?.eyebrow || 'CREATIVE MODE')
  return [
    TextBlock(upper(eyebrow), {
      position: 'absolute',
      left: 32,
      top: 24,
      color,
      fontSize: 12,
      letterSpacing: 4,
      ...role('label', spec, { fontSize: 12, lineHeight: 1, fontWeight: 700 })
    }),
    TextBlock(variant === 's1' ? 'A PRESENTATION TEMPLATE' : `PAGE ${String(page).padStart(2, '0')}`, {
      position: 'absolute',
      left: 32,
      bottom: 20,
      color,
      fontSize: 11,
      letterSpacing: 3,
      ...role('label', spec, { fontSize: 11, lineHeight: 1, fontWeight: 700 })
    }),
    TextBlock(`${String(page).padStart(2, '0')} * 08`, {
      position: 'absolute',
      right: 32,
      bottom: 20,
      color,
      fontSize: 12,
      letterSpacing: 4,
      textAlign: 'right',
      ...role('metric', spec, { fontSize: 12, lineHeight: 1, fontWeight: 800 })
    })
  ]
}

function frame(spec, variant, children = [], opts = {}) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: opts.background || theme.cream,
      color: opts.color || theme.ink,
      overflow: 'hidden'
    },
    [...children, ...chrome(spec, variant, { light: opts.light })]
  )
}

function display(value, spec, style = {}) {
  return Title(upper(value), {
    color: colors(spec).ink,
    ...role('display', spec, { fontWeight: 900 }),
    textTransform: 'uppercase',
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(upper(value), {
    color: colors(spec).ink,
    fontSize: 12,
    letterSpacing: 3,
    ...role('label', spec, { fontSize: 12, lineHeight: 1, fontWeight: 700 }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(value, {
    color: colors(spec).ink2,
    fontSize: 14,
    lineHeight: 1.4,
    ...role('body', spec, { fontSize: 14, lineHeight: 1.4, fontWeight: 400 }),
    ...style
  })
}

function renderSwitchPoster(spec) {
  const theme = colors(spec)
  const title = titleLines(text(spec, 'title', DEFAULTS.s1.title))
  return frame(spec, 's1', [
    box({ position: 'absolute', left: 48, top: 78, width: 30, height: 2, backgroundColor: theme.ink }),
    label(text(spec, 'eyebrow', DEFAULTS.s1.eyebrow), spec, { position: 'absolute', left: 88, top: 74, color: theme.ink, fontSize: 12 }),
    display(title.first, spec, { position: 'absolute', left: 48, top: 194, width: 460, fontSize: 78, lineHeight: 0.9 }),
    display(title.second, spec, { position: 'absolute', left: 48, top: 268, width: 390, color: theme.orange, fontSize: 78, lineHeight: 0.9 }),
    body(text(spec, 'subtitle', DEFAULTS.s1.subtitle), spec, {
      position: 'absolute',
      left: 48,
      top: 430,
      width: 420,
      fontSize: 14,
      lineHeight: 1.35
    }),
    box({ position: 'absolute', right: 48, top: 70, width: 380, height: 400, backgroundColor: theme.green, borderWidth: 2, borderColor: theme.ink }),
    box({ position: 'absolute', right: 82, top: 184, width: 198, height: 198, backgroundColor: theme.orange, borderWidth: 2, borderColor: theme.ink }),
    box({ position: 'absolute', right: 96, top: 174, width: 194, height: 194, backgroundColor: theme.pink, borderWidth: 2, borderColor: theme.ink }),
    box({ position: 'absolute', right: 132, top: 216, width: 124, height: 86, backgroundColor: '#FBD0E3', borderWidth: 2, borderColor: theme.ink, transform: 'skewY(-8deg)' }),
    box({ position: 'absolute', right: 134, top: 294, width: 120, height: 17, backgroundColor: theme.pinkDark }),
    label('ON', spec, { position: 'absolute', right: 126, top: 202, width: 70, color: theme.ink, fontSize: 16, letterSpacing: 0 }),
    label('OFF', spec, { position: 'absolute', right: 152, top: 336, width: 90, color: theme.ink, fontSize: 16, letterSpacing: 0 })
  ])
}

function renderIntro(spec) {
  const theme = colors(spec)
  const points = list(spec, ['points', 'bullets', 'principles'], DEFAULTS.s2.points).slice(0, 3)
  return frame(spec, 's2', [
    label(text(spec, 'eyebrow', DEFAULTS.s2.eyebrow), spec, { position: 'absolute', left: 48, top: 96, backgroundColor: theme.ink, color: theme.cream, padding: '6px 9px', fontSize: 12 }),
    display(text(spec, 'title', DEFAULTS.s2.title), spec, { position: 'absolute', left: 48, top: 150, width: 420, fontSize: 68, lineHeight: 0.92 }),
    box({ position: 'absolute', left: 48, bottom: 80, width: 280, height: 64, backgroundColor: theme.pink, borderWidth: 2, borderColor: theme.ink, alignItems: 'center', justifyContent: 'center' }, [
      label(text(spec, 'marker', DEFAULTS.s2.marker), spec, { fontSize: 20, letterSpacing: 1, color: theme.ink })
    ]),
    box({ position: 'absolute', left: 60, bottom: 66, width: 280, height: 64, backgroundColor: theme.orange, borderWidth: 2, borderColor: theme.ink }),
    body(text(spec, 'subtitle', DEFAULTS.s2.subtitle), spec, { position: 'absolute', left: 510, top: 150, width: 240, fontSize: 15, lineHeight: 1.42 }),
    box({ position: 'absolute', right: 48, top: 150, width: 170, height: 170, backgroundColor: theme.green, borderWidth: 2, borderColor: theme.ink }),
    box({ position: 'absolute', right: 84, top: 186, width: 98, height: 98, borderRadius: 49, backgroundColor: theme.yellow, borderWidth: 2, borderColor: theme.ink }),
    box({ position: 'absolute', left: 510, top: 282, width: 300, flexDirection: 'column', gap: 12 },
      points.map((item, index) => box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 13, height: 13, backgroundColor: [theme.green, theme.pink, theme.orange][index % 3], borderWidth: 2, borderColor: theme.ink, marginRight: 12 }),
        body(String(item), spec, { width: 240, fontSize: 13, lineHeight: 1.25, color: theme.ink })
      ]))
    )
  ])
}

function metricCards(spec) {
  const theme = colors(spec)
  const metrics = objectList(spec, ['metrics', 'items'], DEFAULTS.s3.metrics).slice(0, 4)
  const fills = [theme.green, theme.pink, theme.cream, theme.orange]
  const light = [true, false, false, true]
  return metrics.map((item, index) =>
    box({ width: 414, height: 136, backgroundColor: fills[index], borderWidth: 2, borderColor: theme.ink, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }, [
      label(`/${index + 1}`, spec, { alignSelf: 'flex-end', color: light[index] ? theme.cream : theme.ink, fontSize: 11, letterSpacing: 2 }),
      TextBlock(String(item.value || item), { color: light[index] ? theme.cream : theme.ink, ...role('metric', spec, { fontSize: 46, lineHeight: 0.9, fontWeight: 900 }) }),
      label(String(item.label || 'Metric'), spec, { color: light[index] ? theme.cream : theme.ink, fontSize: 11, letterSpacing: 2 }),
      body(String(item.body || ''), spec, { color: light[index] ? theme.cream : theme.ink2, fontSize: 11, lineHeight: 1.22, opacity: 0.82 })
    ])
  )
}

function renderStats(spec) {
  const theme = colors(spec)
  return frame(spec, 's3', [
    display(text(spec, 'title', DEFAULTS.s3.title), spec, { position: 'absolute', left: 48, top: 72, width: 820, fontSize: 38, lineHeight: 0.95 }),
    box({ position: 'absolute', left: 48, top: 190, width: 864, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, metricCards(spec)),
    box({ position: 'absolute', left: 48, top: 154, width: 864, height: 2, backgroundColor: theme.ink })
  ])
}

function renderDiagram(spec) {
  const theme = colors(spec)
  const layers = list(spec, ['layers', 'items', 'bullets'], DEFAULTS.s4.layers).slice(0, 4)
  const fills = [theme.pink, theme.yellow, theme.orange, theme.cream2]
  return frame(spec, 's4', [
    display(text(spec, 'title', DEFAULTS.s4.title), spec, { position: 'absolute', left: 48, top: 70, width: 410, fontSize: 50, lineHeight: 0.92 }),
    body(text(spec, 'subtitle', DEFAULTS.s4.subtitle), spec, { position: 'absolute', left: 48, top: 248, width: 360, fontSize: 14, lineHeight: 1.42 }),
    box({ position: 'absolute', left: 48, bottom: 82, width: 360, flexDirection: 'column', gap: 9 },
      layers.map((item, index) => box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 16, height: 16, backgroundColor: fills[index], borderWidth: 2, borderColor: theme.ink, marginRight: 10 }),
        label(String(item), spec, { color: theme.ink, fontSize: 11, letterSpacing: 2 })
      ]))
    ),
    box({ position: 'absolute', right: 40, top: 66, width: 460, height: 420, backgroundColor: theme.green, borderWidth: 2, borderColor: theme.ink, alignItems: 'center', justifyContent: 'center' }, [
      box({ position: 'relative', width: 280, height: 280 }, [
        ...fills.map((fill, index) =>
          box({
            position: 'absolute',
            left: [64, 30, 80, 40][index],
            top: [28, 96, 164, 224][index],
            width: [150, 190, 150, 170][index],
            height: 58,
            backgroundColor: fill,
            borderWidth: 2,
            borderColor: theme.ink,
            boxShadow: '9px 9px 0 #0F0F0F'
          }, [
            label(`Layer / 0${index + 1}`, spec, { position: 'absolute', left: 8, top: 8, fontSize: 11, letterSpacing: 1.2 })
          ])
        )
      ])
    ])
  ])
}

function renderBars(spec) {
  const theme = colors(spec)
  const values = list(spec, ['metrics', 'values'], DEFAULTS.s5.metrics).slice(0, 7).map((value) => Number(value.value || value) || 35)
  const labels = list(spec, ['labels'], DEFAULTS.s5.labels).slice(0, values.length)
  const max = Math.max(100, ...values)
  const fills = [theme.green, theme.pink, theme.orange]
  return frame(spec, 's5', [
    display(text(spec, 'title', DEFAULTS.s5.title), spec, { position: 'absolute', left: 48, top: 70, width: 650, fontSize: 42, lineHeight: 0.94 }),
    box({ position: 'absolute', right: 48, top: 72, width: 170, flexDirection: 'column', gap: 8 },
      ['Series A', 'Series B', 'Series C'].map((item, index) => box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 12, height: 12, backgroundColor: fills[index], borderWidth: 2, borderColor: theme.ink, marginRight: 8 }),
        label(item, spec, { fontSize: 10, letterSpacing: 2 })
      ]))
    ),
    box({ position: 'absolute', left: 72, top: 192, width: 36, height: 260, borderRightWidth: 2, borderRightColor: theme.ink, flexDirection: 'column-reverse', justifyContent: 'space-between' },
      [0, 25, 50, 75, 100].map((tick) => label(String(tick), spec, { fontSize: 10, letterSpacing: 0, textAlign: 'right' }))
    ),
    box({ position: 'absolute', left: 108, top: 192, width: 804, height: 260, borderBottomWidth: 2, borderBottomColor: theme.ink, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingLeft: 18, paddingRight: 18 },
      values.map((value, index) =>
        box({ width: 60, height: Math.max(36, (value / max) * 230), backgroundColor: fills[index % fills.length], borderWidth: 2, borderColor: theme.ink, position: 'relative' }, [
          TextBlock(String(value), { position: 'absolute', left: 0, right: 0, top: -28, textAlign: 'center', color: theme.ink, ...role('metric', spec, { fontSize: 15, lineHeight: 1, fontWeight: 900 }) }),
          label(labels[index] || `Q${index + 1}`, spec, { position: 'absolute', left: -12, right: -12, bottom: -34, fontSize: 9, letterSpacing: 1, textAlign: 'center' })
        ])
      )
    ),
    label('FIG. 01 - VALUES ARE PLACEHOLDER', spec, { position: 'absolute', left: 108, bottom: 62, color: theme.ink2, fontSize: 10, letterSpacing: 2 })
  ])
}

function renderProcess(spec) {
  const theme = colors(spec)
  const items = objectList(spec, ['items', 'steps', 'timeline'], DEFAULTS.s6.items).slice(0, 4)
  const fills = [theme.cream, theme.pink, theme.yellow, theme.green]
  return frame(spec, 's6', [
    display(text(spec, 'title', DEFAULTS.s6.title), spec, { position: 'absolute', left: 48, top: 70, width: 820, fontSize: 48, lineHeight: 0.95 }),
    box({ position: 'absolute', left: 48, right: 48, top: 154, height: 2, borderTopWidth: 2, borderTopColor: theme.ink, borderStyle: 'dashed' }),
    box({ position: 'absolute', left: 48, top: 190, width: 864, flexDirection: 'row', gap: 14 },
      items.map((item, index) =>
        box({ width: 205, height: 218, backgroundColor: fills[index], color: index === 3 ? theme.cream : theme.ink, borderWidth: 2, borderColor: theme.ink, padding: 14, flexDirection: 'column', position: 'relative' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { color: index === 3 ? theme.cream : theme.ink, ...role('metric', spec, { fontSize: 66, lineHeight: 0.85, fontWeight: 900 }) }),
          label(String(item.title || item.label || `Step ${index + 1}`), spec, { color: index === 3 ? theme.cream : theme.ink, fontSize: 16, letterSpacing: 0.5, marginTop: 10 }),
          body(String(item.body || item.description || ''), spec, { color: index === 3 ? theme.cream : theme.ink2, fontSize: 11, lineHeight: 1.35, marginTop: 8 }),
          index < items.length - 1
            ? box({ position: 'absolute', right: -13, top: 101, width: 0, height: 0, borderTopWidth: 9, borderTopColor: 'transparent', borderBottomWidth: 9, borderBottomColor: 'transparent', borderLeftWidth: 12, borderLeftColor: theme.ink })
            : null
        ].filter(Boolean))
      )
    )
  ])
}

function renderComparison(spec) {
  const theme = colors(spec)
  const headers = list(spec, ['headers'], DEFAULTS.s7.headers).slice(0, 4)
  const rows = list(spec, ['rows'], DEFAULTS.s7.rows).slice(0, 4)
  const colFills = [theme.cream, theme.pink, theme.green, theme.orange]
  return frame(spec, 's7', [
    display(text(spec, 'title', DEFAULTS.s7.title), spec, { position: 'absolute', left: 48, top: 72, width: 620, fontSize: 42, lineHeight: 0.94 }),
    box({ position: 'absolute', right: 72, top: 120, backgroundColor: theme.yellow, borderWidth: 2, borderColor: theme.ink, padding: '8px 12px', transform: 'rotate(-4deg)' }, [
      label('PICK ONE', spec, { fontSize: 13, letterSpacing: 0.5 })
    ]),
    box({ position: 'absolute', left: 48, right: 48, top: 190, bottom: 80, borderWidth: 2, borderColor: theme.ink, flexDirection: 'column', backgroundColor: theme.cream2 },
      [
        box({ height: 54, flexDirection: 'row', backgroundColor: theme.ink },
          headers.map((item, index) => box({ width: index === 0 ? 302 : 186, borderRightWidth: index === headers.length - 1 ? 0 : 2, borderRightColor: theme.cream, alignItems: 'center', paddingLeft: 13 }, [
            label(String(item), spec, { color: theme.cream, fontSize: 13, letterSpacing: 0.5 })
          ]))
        ),
        ...rows.map((row) => box({ height: 48, flexDirection: 'row', borderTopWidth: 2, borderTopColor: theme.ink },
          headers.map((_, index) => box({ width: index === 0 ? 302 : 186, backgroundColor: colFills[index], borderRightWidth: index === headers.length - 1 ? 0 : 2, borderRightColor: theme.ink, alignItems: 'center', paddingLeft: 13 }, [
            label(String(Array.isArray(row) ? row[index] : row?.[headers[index]] || ''), spec, {
              color: index === 2 || index === 3 ? theme.cream : theme.ink,
              fontSize: index === 0 ? 14 : 13,
              letterSpacing: 0.2
            })
          ]))
        ))
      ]
    )
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const title = titleLines(text(spec, 'title', DEFAULTS.s8.title), 'THANK YOU')
  return frame(spec, 's8', [
    display(title.first, spec, { position: 'absolute', left: 48, top: 110, width: 560, color: theme.cream, fontSize: 104, lineHeight: 0.88 }),
    display(title.second, spec, { position: 'absolute', left: 48, top: 210, width: 560, color: theme.cream, fontSize: 104, lineHeight: 0.88 }),
    body(text(spec, 'subtitle', DEFAULTS.s8.subtitle), spec, { position: 'absolute', left: 48, top: 370, width: 470, color: theme.cream, fontSize: 17, lineHeight: 1.4 }),
    box({ position: 'absolute', right: 82, bottom: 86, width: 170, height: 170, backgroundColor: theme.pink, borderWidth: 2, borderColor: theme.cream, transform: 'rotate(-6deg)', alignItems: 'center', justifyContent: 'center' }, [
      box({ width: 138, height: 138, borderRadius: 69, borderWidth: 2, borderColor: theme.cream, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
        TextBlock(text(spec, 'stamp', DEFAULTS.s8.stamp), { color: theme.cream, textAlign: 'center', ...role('metric', spec, { fontSize: 30, lineHeight: 0.9, fontWeight: 900 }) }),
        label('TEMPLATE SET', spec, { color: theme.cream, fontSize: 9, letterSpacing: 2, marginTop: 8, textAlign: 'center' })
      ])
    ])
  ], { background: theme.green, color: theme.cream, light: true })
}

export function renderCreativeModeGrid(spec) {
  switch (normalizeVariant(spec)) {
    case 's2':
      return renderIntro(spec)
    case 's3':
      return renderStats(spec)
    case 's4':
      return renderDiagram(spec)
    case 's5':
      return renderBars(spec)
    case 's6':
      return renderProcess(spec)
    case 's7':
      return renderComparison(spec)
    case 's8':
      return renderClosing(spec)
    case 's1':
    default:
      return renderSwitchPoster(spec)
  }
}
