import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'product-ribbon'

export const PAGE_VARIANTS = [
  'cover',
  'manifesto',
  'catalogue',
  'stripe',
  'data',
  'quote',
  'cal',
  'colophon'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'sakura-chroma',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'sakura-chroma',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'colophon'],
      repeatable: ['manifesto', 'catalogue', 'stripe', 'data', 'quote', 'cal']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/sakura-chroma-1.png'
}

const DEFAULTS = {
  cover: {
    brand: 'tape\ngarden',
    edition: 'CATALOGUE NO. 7',
    title: 'T-26',
    subtitle: 'SUPERCATALOG',
    footer_left: '限定版  made in matsumoto',
    footer_status: 'N.R. :  ON  OFF',
    seal: '26',
    stamp_label: 'AS SEEN ON',
    stamp: 'TG'
  },
  manifesto: {
    eyebrow: 'A short letter from the studio, January 2026',
    title: 'We make small analog things for the people who keep tape recorders on their desks.'
  },
  catalogue: {
    title: 'The 2026 Catalogue',
    eyebrow: 'Four products - spring & summer release',
    cards: [
      {
        tone: 'red',
        name: 'SC-01\nBLOOM PEDAL',
        body: 'A tape-saturation pedal voiced after late-70s cassette decks. Three knobs, one switch, and one warm output.',
        extra: 'Hand-wired in Matsumoto, one batch at a time, with a cream rosette stamped on the bottom plate.',
        specs: ['FORMAT 9V pedal', 'CHANNELS Mono TRS', 'CASE Steel', 'PRICE ¥38,000', 'SHIPS 14 Mar']
      },
      {
        tone: 'pink',
        name: 'SC-02\nCHROMA DECK',
        body: 'A studio cassette deck reissued from our 1981 design with quartz-locked transport and switchable bias.',
        extra: 'Each unit ships with a numbered plate, hand-cut sleeve, and a note about wearing it in slowly.',
        specs: ['FORMAT Hardware', 'EDITION 320 units', 'FINISH Cream steel', 'PRICE ¥184,000', 'SHIPS 02 May']
      },
      {
        tone: 'orange',
        name: 'SC-03\nSUPER TAPE',
        body: 'Seven C-60 cassettes, each labelled with a colour, a season, and a side on cream printed stock.',
        extra: 'Refill packs ship four times a year. Subscribers get a studio note with each delivery.',
        specs: ['FORMAT 7 x C-60', 'EDITION Open', 'PACK Letterpress', 'PRICE ¥7,200', 'SHIPS 14 Jun']
      },
      {
        tone: 'blue',
        name: 'SC-04\nMIX CHAIR',
        body: 'A listening chair upholstered in cassette-loop fabric, woven from our own studio off-cuts.',
        extra: 'Each chair is signed on the underside and dated to the day it left the workshop.',
        specs: ['FORMAT Furniture', 'FRAME Solid ash', 'UPHOLSTERY Tape', 'PRICE ¥420,000', 'SHIPS 22 Aug']
      }
    ]
  },
  stripe: {
    eyebrow: 'A note pinned above the workbench',
    title: 'Build the thing first, then write the spec sheet.',
    author: '- Ren Kobayashi / founder / 2024'
  },
  data: {
    title: 'Output, by year',
    eyebrow: 'Units shipped - 2019-2026 - Q3 estimate',
    metrics: [
      { value: '26', suffix: 'K', label: 'Units shipped, 2026', body: 'Our biggest year yet, driven mostly by the Bloom Pedal selling through three production runs.', tone: 'red' },
      { value: '61', suffix: '%', label: 'Repeat customers', body: "Three of every five orders this year went to a household we'd already shipped to before.", tone: 'blue' }
    ],
    bars: [2, 3, 3, 4, 4, 5, 5, 6],
    labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
  },
  quote: {
    eyebrow: 'A reader writes',
    quote: '"It feels less like a gadget and more like a small machine that has decided to be friendly with my desk."',
    author: 'Mei Tanaka',
    meta: 'Reader letter / Bloom Pedal owner / April 2025'
  },
  cal: {
    title: 'Release schedule',
    eyebrow: 'Spring & summer - 2026',
    rows: [
      ['14.03', 'SC-01 Bloom Pedal - first run', 'Open edition - 600 units', 'PEDAL', 'red', true],
      ['02.05', 'SC-02 Chroma Deck - numbered run', 'Limited - 320 units', 'DECK', 'pink', true],
      ['14.06', 'SC-03 Super Tape boxset', 'Open - refilled monthly', 'TAPE', 'orange', false],
      ['12.07', 'SC-03b Summer side - 4 cassettes', 'Refill kit', 'TAPE', 'orange', false],
      ['22.08', 'SC-04 Mix Chair - workshop run', 'Single piece', 'CHAIR', 'blue', true],
      ['03.10', 'Open studio & listening night', 'Matsumoto workshop', 'EVENT', 'green', false],
      ['14.11', 'Catalogue No. 8 - early preview', 'Subscribers only', 'PREVIEW', 'pink', true]
    ]
  },
  colophon: {
    eyebrow: 'Colophon - Catalogue No. 7',
    title: 'See you in volume eight.',
    seal: 'VOL\n26',
    stamp: 'COMPLETE',
    footer: [
      { label: 'Studio', body: 'Tape Garden - Matsumoto\nest. 2018' },
      { label: 'Designed', body: 'In a small room beside the\ntape archive - over six months' },
      { label: 'Until next year', body: 'Catalogue No. 8 ships January 2027. Mailing list opens with the snow.' }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || '#F1E6CB',
    paperDark: source.surface || source.panel || '#E5D6B0',
    ink: source.text || '#3A2516',
    red: source.red || '#E5392A',
    pink: source.primary || '#E54489',
    orange: source.orange || '#F09131',
    green: source.green || '#3D9F47',
    blue: source.blue || '#3F8BC4',
    yellow: source.panel || '#F0BC2A'
  }
}

function colorByTone(theme, tone) {
  return {
    red: theme.red,
    pink: theme.pink,
    orange: theme.orange,
    yellow: theme.yellow,
    green: theme.green,
    blue: theme.blue
  }[tone] || theme.red
}

function positioned(base, positions = {}) {
  const out = { ...base }
  for (const [key, value] of Object.entries(positions)) {
    if (value !== undefined && value !== null) out[key] = value
  }
  return out
}

function value(spec, key, fallback = '') {
  const raw = spec.content?.[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback
}

function array(spec, key, fallback = []) {
  const raw = spec.content?.[key]
  return Array.isArray(raw) && raw.length ? raw : fallback
}

function variantContent(spec, variant) {
  return { ...DEFAULTS[variant], ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('manifesto')) return 'manifesto'
  if (raw.includes('chart') || raw.includes('dashboard') || raw.includes('catalogue')) return 'catalogue'
  if (raw.includes('quote') || raw.includes('emphasis')) return 'quote'
  if (raw.includes('timeline') || raw.includes('schedule') || raw.includes('cal')) return 'cal'
  if (raw.includes('closing') || raw.includes('colophon')) return 'colophon'
  return 'manifesto'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function label(text, spec, style = {}) {
  return TextBlock(String(text || '').toUpperCase(), {
    color: style.color || '#3A2516',
    fontSize: 11,
    lineHeight: 1.1,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    ...role('label', spec, { fontSize: 11, lineHeight: 1.1, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' }),
    ...style
  })
}

function display(text, spec, style = {}) {
  return Title(text, {
    color: style.color || '#3A2516',
    fontSize: 70,
    lineHeight: 0.88,
    letterSpacing: -1.2,
    ...role('display', spec, { fontWeight: 900, fontSize: 70, lineHeight: 0.88, letterSpacing: -1.2 }),
    ...style
  })
}

function body(text, spec, style = {}) {
  return TextBlock(text, {
    color: style.color || '#3A2516',
    fontSize: 15,
    lineHeight: 1.38,
    ...role('body', spec, { fontWeight: 500, fontSize: 15, lineHeight: 1.38 }),
    ...style
  })
}

function mono(text, spec, style = {}) {
  return TextBlock(String(text || ''), {
    color: style.color || '#3A2516',
    fontSize: 11,
    lineHeight: 1.25,
    letterSpacing: 0.4,
    ...role('metric', spec, { fontWeight: 600, fontSize: 11, lineHeight: 1.25, letterSpacing: 0.4 }),
    ...style
  })
}

function page(theme, children) {
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      backgroundColor: theme.paper,
      color: theme.ink,
      overflow: 'hidden'
    },
    [
      box({
        position: 'absolute',
        left: 0,
        top: 0,
        width: 960,
        height: 540,
        opacity: 0.12,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(58,37,22,0.55) 1px, transparent 1.6px)',
        backgroundSize: '4px 4px'
      }),
      ...children
    ]
  )
}

function pageNum(spec, theme, variant) {
  return mono(`${String(PAGE_VARIANTS.indexOf(variant) + 1).padStart(2, '0')} / 08`, spec, {
    position: 'absolute',
    right: 34,
    bottom: 24,
    width: 70,
    textAlign: 'right',
    color: theme.ink,
    fontSize: 11,
    letterSpacing: 0.8
  })
}

function petalCluster(theme, { left, top, width, palette = ['red', 'orange', 'blue', 'green', 'yellow'] }) {
  const circles = [
    [0, 0.28, 0.5],
    [0.14, 0.5, 0.38],
    [0.28, 0, 0.44],
    [0.5, 0.22, 0.5],
    [0.36, 0.5, 0.32]
  ]
  return box(
    { position: 'absolute', left, top, width, height: Math.round(width * 0.78) },
    circles.map(([x, y, size], index) =>
      box({
        position: 'absolute',
        left: Math.round(width * x),
        top: Math.round(width * 0.78 * y),
        width: Math.round(width * size),
        height: Math.round(width * size),
        borderRadius: 999,
        backgroundColor: colorByTone(theme, palette[index])
      })
    )
  )
}

function ribbonStack(theme, { left, right, top, width = 620, angle = -22, reverse = false }) {
  const tones = reverse ? ['blue', 'green', 'yellow', 'orange', 'pink'] : ['pink', 'orange', 'yellow', 'green', 'blue']
  return box(
    positioned({ position: 'absolute', width, height: 250, overflow: 'hidden' }, { left, right, top }),
    tones.map((tone, index) =>
      box({
        position: 'absolute',
        left: reverse ? -120 : -80,
        top: 24 + index * 34,
        width: width + 230,
        height: index === 0 || index === 4 ? 42 : 38,
        backgroundColor: colorByTone(theme, tone),
        transform: `rotate(${angle}deg)`,
        transformOrigin: reverse ? '100% 50%' : '0 50%'
      })
    )
  )
}

function checkbox(theme, spec, labelText, top, checked) {
  return box(
    { position: 'absolute', right: 70, top, width: 130, height: 24, flexDirection: 'row', alignItems: 'center' },
    [
      box({
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: theme.ink,
        backgroundColor: checked ? theme.ink : 'transparent',
        marginRight: 10
      }),
      label(labelText, spec, { fontSize: 14, letterSpacing: 0.8 })
    ]
  )
}

function cover(spec, theme) {
  const c = variantContent(spec, 'cover')
  return page(theme, [
    petalCluster(theme, { left: 58, top: 42, width: 210 }),
    display(value(spec, 'brand', c.brand).toLowerCase(), spec, {
      position: 'absolute',
      left: 258,
      top: 78,
      width: 150,
      fontSize: 36,
      lineHeight: 0.88,
      whiteSpace: 'pre-wrap'
    }),
    body(value(spec, 'edition', c.edition), spec, {
      position: 'absolute',
      left: 258,
      top: 146,
      width: 220,
      fontSize: 13,
      fontWeight: 650,
      letterSpacing: 0.8
    }),
    ribbonStack(theme, { right: -35, top: 154, width: 560, angle: -22 }),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 60,
      top: 220,
      width: 270,
      fontSize: 124,
      lineHeight: 0.84,
      letterSpacing: -2
    }),
    display(value(spec, 'subtitle', c.subtitle), spec, {
      position: 'absolute',
      left: 60,
      bottom: 116,
      width: 360,
      backgroundColor: theme.pink,
      color: theme.paper,
      fontSize: 40,
      lineHeight: 0.95,
      padding: '8px 18px 10px'
    }),
    checkbox(theme, spec, 'COLOR', 246, true),
    checkbox(theme, spec, 'LO-FI', 296, true),
    checkbox(theme, spec, 'STEREO', 346, false),
    checkbox(theme, spec, 'LP', 396, false),
    box({ position: 'absolute', left: 60, right: 60, bottom: 78, height: 1.5, backgroundColor: theme.ink }),
    body(value(spec, 'footer_left', c.footer_left), spec, { position: 'absolute', left: 60, bottom: 42, width: 300, fontSize: 12, fontWeight: 650 }),
    label(value(spec, 'footer_status', c.footer_status), spec, { position: 'absolute', left: 390, bottom: 44, width: 220, fontSize: 12, letterSpacing: 1 }),
    rosette(theme, spec, value(spec, 'seal', c.seal), { right: 170, bottom: 24, size: 70 }),
    stamp(theme, spec, value(spec, 'stamp', c.stamp), { right: 30, bottom: 34, label: value(spec, 'stamp_label', c.stamp_label) }),
    pageNum(spec, theme, 'cover')
  ])
}

function rosette(theme, spec, text, { left, right, top, bottom, size = 84 }) {
  return box(
    positioned({
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: theme.ink,
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'rotate(12deg)'
    }, { left, right, top, bottom }),
    [
      display(text, spec, {
        color: theme.paper,
        width: size - 18,
        textAlign: 'center',
        fontSize: size > 90 ? 34 : 24,
        lineHeight: 0.9,
        whiteSpace: 'pre-wrap'
      })
    ]
  )
}

function stamp(theme, spec, text, { left, right, top, bottom, label: labelText }) {
  const children = []
  if (labelText) children.push(label(labelText, spec, { color: theme.paper, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 }))
  children.push(display(text, spec, { color: theme.paper, fontSize: 20, lineHeight: 0.95 }))
  return box(
    positioned({
      position: 'absolute',
      backgroundColor: theme.red,
      padding: '8px 14px',
      transform: 'rotate(-3deg)'
    }, { left, right, top, bottom }),
    children
  )
}

function manifesto(spec, theme) {
  const c = variantContent(spec, 'manifesto')
  return page(theme, [
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', top: 44, left: 250, width: 460, textAlign: 'center', letterSpacing: 2.4 }),
    ...[
      [58, 46, 100, 'red'],
      [150, 120, 72, 'orange'],
      [72, 410, 72, 'yellow'],
      [744, 390, 86, 'green'],
      [770, 78, 78, 'blue'],
      [850, 158, 66, 'pink']
    ].map(([left, top, size, tone]) => box({ position: 'absolute', left, top, width: size, height: size, borderRadius: 999, backgroundColor: colorByTone(theme, tone) })),
    display(value(spec, 'title', c.title), spec, {
      position: 'absolute',
      left: 122,
      top: 150,
      width: 716,
      textAlign: 'center',
      fontSize: 72,
      lineHeight: 0.88,
      letterSpacing: -1.4
    }),
    pageNum(spec, theme, 'manifesto')
  ])
}

function catalogueCard(theme, spec, card, index) {
  const x = 62 + index * 212
  return box(
    { position: 'absolute', left: x, top: 154, width: 190, height: 324, borderWidth: 1.5, borderColor: theme.ink, backgroundColor: theme.paper, overflow: 'hidden', flexDirection: 'column' },
    [
      box({ height: 22, backgroundColor: colorByTone(theme, card.tone) }),
      display(card.name, spec, { margin: '16px 14px 0', width: 156, fontSize: 29, lineHeight: 0.92, whiteSpace: 'pre-wrap' }),
      body(card.body, spec, { margin: '10px 14px 0', width: 156, fontSize: 11, lineHeight: 1.28 }),
      body(card.extra, spec, { margin: '8px 14px 0', paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.ink, width: 156, fontSize: 9, lineHeight: 1.22 }),
      box({ position: 'absolute', left: 14, right: 14, bottom: 12, borderTopWidth: 1, borderTopColor: theme.ink, paddingTop: 8, flexDirection: 'column' }, card.specs.slice(0, 5).map((row) =>
        mono(row, spec, { fontSize: 7.4, lineHeight: 1.15, marginBottom: 2 })
      ))
    ]
  )
}

function catalogue(spec, theme) {
  const c = variantContent(spec, 'catalogue')
  const cards = array(spec, 'cards', c.cards)
  return page(theme, [
    box({ position: 'absolute', left: 60, right: 60, top: 54, height: 84, borderBottomWidth: 1.5, borderBottomColor: theme.ink }, [
      display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 0, top: 0, width: 500, fontSize: 58, lineHeight: 0.9 }),
      label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', right: 0, bottom: 18, width: 260, textAlign: 'right', letterSpacing: 1.7 })
    ]),
    ...cards.slice(0, 4).map((card, index) => catalogueCard(theme, spec, card, index)),
    pageNum(spec, theme, 'catalogue')
  ])
}

function stripe(spec, theme) {
  const c = variantContent(spec, 'stripe')
  return page(theme, [
    ribbonStack(theme, { left: -120, top: 64, width: 1180, angle: -22 }),
    box(
      {
        position: 'absolute',
        left: 78,
        top: 176,
        width: 750,
        backgroundColor: theme.paper,
        borderWidth: 1.5,
        borderColor: theme.ink,
        padding: '22px 34px 26px',
        boxShadow: `8px 8px 0 ${theme.ink}`,
        flexDirection: 'column'
      },
      [
        label(value(spec, 'eyebrow', c.eyebrow), spec, { marginBottom: 18, letterSpacing: 1.8 }),
        display(value(spec, 'title', c.title), spec, { width: 680, fontSize: 52, lineHeight: 0.94 })
      ]
    ),
    box({ position: 'absolute', left: 78, top: 414, backgroundColor: theme.ink, padding: '9px 16px' }, [
      mono(value(spec, 'author', c.author), spec, { color: theme.paper, fontSize: 12, letterSpacing: 0.8 })
    ]),
    pageNum(spec, theme, 'stripe')
  ])
}

function dataBars(theme, spec, bars, labels) {
  const tones = ['blue', 'green', 'yellow', 'orange', 'orange', 'pink', 'pink', 'red']
  return box(
    { position: 'absolute', right: 60, top: 162, width: 560, height: 300, borderWidth: 1.5, borderColor: theme.ink, padding: '24px 24px 18px' },
    [
      box({ flexDirection: 'row', height: 210, alignItems: 'flex-end' }, bars.map((height, index) =>
        box(
          { width: 52, height: 210, marginRight: index === bars.length - 1 ? 0 : 12, flexDirection: 'column-reverse' },
          Array.from({ length: 6 }, (_, segmentIndex) =>
            box({
              height: 28,
              marginTop: 5,
              borderWidth: 1,
              borderColor: segmentIndex < height ? colorByTone(theme, tones[index]) : 'rgba(58,37,22,0.22)',
              backgroundColor: segmentIndex < height ? colorByTone(theme, tones[index]) : 'rgba(58,37,22,0.10)'
            })
          )
        )
      )),
      box({ height: 1, backgroundColor: theme.ink, marginTop: 12, marginBottom: 8 }),
      box({ flexDirection: 'row' }, labels.map((item, index) =>
        mono(item, spec, { width: 52, marginRight: index === labels.length - 1 ? 0 : 12, textAlign: 'center', fontSize: 9 })
      ))
    ]
  )
}

function data(spec, theme) {
  const c = variantContent(spec, 'data')
  const metrics = array(spec, 'metrics', c.metrics)
  const bars = array(spec, 'bars', c.bars)
  const labels = array(spec, 'labels', c.labels)
  return page(theme, [
    box({ position: 'absolute', left: 60, right: 60, top: 54, height: 84, borderBottomWidth: 1.5, borderBottomColor: theme.ink }, [
      display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 0, top: 0, width: 420, fontSize: 54, lineHeight: 0.9 }),
      label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', right: 0, bottom: 18, width: 320, textAlign: 'right' })
    ]),
    ...metrics.slice(0, 2).map((metric, index) =>
      box({ position: 'absolute', left: 60, top: index === 0 ? 176 : 336, width: 245, flexDirection: 'column' }, [
        box({ flexDirection: 'row', alignItems: 'flex-end', height: index === 0 ? 90 : 68 }, [
          display(metric.value, spec, { color: colorByTone(theme, metric.tone), fontSize: index === 0 ? 112 : 78, lineHeight: 0.82, width: index === 0 ? 128 : 100 }),
          display(metric.suffix, spec, { color: theme.ink, fontSize: index === 0 ? 38 : 32, lineHeight: 0.9, width: 46, marginBottom: index === 0 ? 14 : 8 })
        ]),
        label(metric.label, spec, { marginTop: 8, fontSize: 12, letterSpacing: 1.2 }),
        body(metric.body, spec, { marginTop: 6, fontSize: 12, lineHeight: 1.35, width: 230 })
      ])
    ),
    dataBars(theme, spec, bars, labels),
    pageNum(spec, theme, 'data')
  ])
}

function quote(spec, theme) {
  const c = variantContent(spec, 'quote')
  return page(theme, [
    petalCluster(theme, { left: 620, top: 52, width: 250, palette: ['pink', 'orange', 'yellow', 'blue', 'green'] }),
    box({ position: 'absolute', left: 68, right: 70, bottom: 100 }, [
      label(value(spec, 'eyebrow', c.eyebrow), spec, { color: theme.red, marginBottom: 20, letterSpacing: 2 }),
      display(value(spec, 'quote', c.quote), spec, { width: 760, fontSize: 62, lineHeight: 0.9, letterSpacing: -1.1 }),
      box({ width: 760, height: 1.5, backgroundColor: theme.ink, marginTop: 24, marginBottom: 14 }),
      box({ flexDirection: 'row', alignItems: 'center' }, [
        label(value(spec, 'author', c.author), spec, { width: 180, letterSpacing: 1.6 }),
        mono(value(spec, 'meta', c.meta), spec, { width: 440, opacity: 0.78, fontSize: 12 })
      ])
    ]),
    pageNum(spec, theme, 'quote')
  ])
}

function cal(spec, theme) {
  const c = variantContent(spec, 'cal')
  const rows = array(spec, 'rows', c.rows)
  return page(theme, [
    box({ position: 'absolute', left: 60, right: 60, top: 54, height: 78, borderBottomWidth: 1.5, borderBottomColor: theme.ink }, [
      display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 0, top: 0, width: 450, fontSize: 54, lineHeight: 0.9 }),
      label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', right: 0, bottom: 18, width: 250, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 60, top: 152, width: 840, flexDirection: 'column' }, [
      ledgerRow(theme, spec, ['Date', 'Title', 'Edition', 'Track', 'N.R.'], true),
      ...rows.slice(0, 7).map((row) => ledgerRow(theme, spec, row, false))
    ]),
    pageNum(spec, theme, 'cal')
  ])
}

function ledgerRow(theme, spec, row, head = false) {
  const [date, title, edition, track, tone, on] = row
  return box(
    {
      width: 840,
      height: head ? 34 : 45,
      borderBottomWidth: head ? 1.5 : 1,
      borderBottomColor: head ? theme.ink : 'rgba(58,37,22,0.24)',
      flexDirection: 'row',
      alignItems: 'center'
    },
    [
      (head ? label : mono)(date, spec, { width: 86, fontSize: head ? 10 : 12 }),
      (head ? label : display)(title, spec, { width: 312, fontSize: head ? 10 : 21, lineHeight: 1.05 }),
      (head ? label : body)(edition, spec, { width: 214, fontSize: head ? 10 : 12, lineHeight: 1.2 }),
      head
        ? label(track, spec, { width: 108, fontSize: 10 })
        : box({ width: 108 }, [box({ backgroundColor: colorByTone(theme, tone), padding: '4px 10px', alignSelf: 'flex-start' }, [mono(track, spec, { color: theme.paper, fontSize: 10, lineHeight: 1 })])]),
      head
        ? label(tone, spec, { width: 80, textAlign: 'right', fontSize: 10 })
        : box({ width: 80, flexDirection: 'row', justifyContent: 'flex-end' }, [
            box({ width: 12, height: 12, borderWidth: 1.5, borderColor: theme.ink, backgroundColor: on ? theme.ink : theme.paper, marginRight: 6 }),
            box({ width: 12, height: 12, borderWidth: 1.5, borderColor: theme.ink, backgroundColor: on ? theme.paper : theme.ink })
          ])
    ]
  )
}

function colophon(spec, theme) {
  const c = variantContent(spec, 'colophon')
  const footer = array(spec, 'footer', c.footer)
  return page(theme, [
    ribbonStack(theme, { left: -80, top: 150, width: 560, angle: 22, reverse: true }),
    petalCluster(theme, { left: 760, top: 356, width: 148, palette: ['red', 'orange', 'green', 'blue', 'yellow'] }),
    rosette(theme, spec, value(spec, 'seal', c.seal), { right: 78, top: 54, size: 98 }),
    stamp(theme, spec, value(spec, 'stamp', c.stamp), { right: 76, top: 168 }),
    label(value(spec, 'eyebrow', c.eyebrow), spec, { position: 'absolute', left: 62, top: 70, width: 360, letterSpacing: 2 }),
    display(value(spec, 'title', c.title), spec, { position: 'absolute', left: 62, top: 110, width: 650, fontSize: 66, lineHeight: 0.88, letterSpacing: -1.4 }),
    box({ position: 'absolute', left: 62, bottom: 94, width: 650, flexDirection: 'row' }, footer.slice(0, 3).map((item, index) =>
      box({ width: index === 2 ? 230 : 180, marginRight: index === 2 ? 0 : 28, borderTopWidth: 1.5, borderTopColor: theme.ink, paddingTop: 12, flexDirection: 'column' }, [
        label(item.label, spec, { fontSize: 10, letterSpacing: 1.6, marginBottom: 7 }),
        body(item.body, spec, { fontSize: 12, lineHeight: 1.35, whiteSpace: 'pre-wrap' })
      ])
    )),
    pageNum(spec, theme, 'colophon')
  ])
}

const RENDERERS = {
  cover,
  manifesto,
  catalogue,
  stripe,
  data,
  quote,
  cal,
  colophon
}

export function renderProductRibbon(spec) {
  const theme = colors(spec)
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || manifesto)(spec, theme)
}
