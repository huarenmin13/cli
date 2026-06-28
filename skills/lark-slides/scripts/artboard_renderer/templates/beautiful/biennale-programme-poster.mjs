import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'biennale-programme-poster'

const PAGE_VARIANTS = ['cover', 'manifesto', 'programme', 'chapter', 'data', 'quote', 'cal', 'colophon']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'biennale-yellow',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'biennale-yellow',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'colophon'],
      repeatable: ['manifesto', 'programme', 'chapter', 'data', 'quote', 'cal']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/biennale-yellow-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  'cover': {
    date: '02.05-\n11.10.2026',
    eyebrow: 'Annual Survey · Issue No. 04',
    title: 'Aurora Programme',
    footer_items: [
      { heading: 'Hosted by', body: 'Aurora Institute for Public Form' },
      { heading: 'Edition', body: 'Fourth annual open programme' },
      { heading: 'Reading', body: 'A field study of light, matter and atmosphere' },
      { heading: 'Notes', body: 'Six months of exhibitions, residencies and public lectures across three pavilions.' }
    ]
  },
  'manifesto': {
    quote: 'A room is a slow argument with the sun. We have spent four years listening for what it answers.',
    author: 'From the Aurora Charter, 2023'
  },
  'programme': {
    kicker: 'Strands · 2026',
    title: 'Programme',
    meta:
      "Six interlocking strands run across the year. Each is independently curated, but every strand answers to the same question: what does light know that we don't?",
    strands: [
      { num: '01', title: 'Slow Atmospheres', body: 'A reading room of long-form essays, drawings and weather notebooks, organised around the changing yellow of late afternoon.' },
      { num: '02', title: 'Public Form', body: 'Three commissions in three pavilions, each examining how a public square wears its own light over the course of a season.' },
      { num: '03', title: 'Field Notes', body: 'A residency programme drawing artists, architects and meteorologists together for a hundred days of recording, drawing and arguing.' },
      { num: '04', title: 'Quiet Editions', body: 'A typographic publishing strand committed to printing only what asks to be read in daylight, on warm paper, slowly.' },
      { num: '05', title: 'Open Conversations', body: 'Twelve evenings of public talks, paired with a meal and a question: what is the weather like in your work?' }
    ]
  },
  'chapter': {
    rail: 'First Chapter - Slow Atmospheres',
    number: '01',
    title: "A reading of the season's quietest hours",
    lede:
      'In its first chapter the Aurora Programme convenes around the slowest light of the year: the long minutes after the sun has gone but before the room has admitted it.'
  },
  'data': {
    title: 'Public attendance',
    label: 'Open programme · 2022-2026',
    stats: [
      { value: '182 k', label: 'Visitors · Year four', body: 'A 2.4x rise on the inaugural year, drawn from a programme that grew slower than the audience.' },
      { value: '74%', label: 'Returning audience', body: "Three quarters of last year's visitors came back; nearly half came back twice." }
    ],
    rows: [
      { year: '2022', value: '76,400', pct: 42 },
      { year: '2023', value: '112,800', pct: 62 },
      { year: '2024', value: '141,200', pct: 78 },
      { year: '2025', value: '164,900', pct: 91 },
      { year: '2026', value: '182,300', pct: 100 }
    ]
  },
  'quote': {
    kicker: 'A note from the curator',
    quote: 'The yellow we use is not the yellow we mean. It is the yellow that arrives ten minutes after we leave the building.',
    who: 'Idun Reijners',
    role: 'Curator-at-large, Aurora Institute · letter to the editorial board, January 2026'
  },
  'cal': {
    title: 'Public calendar',
    label: 'Selected dates · May-October',
    rows: [
      ['02.05', 'The Long Yellow, opening lecture', 'Pavilion of Quiet Form, Rotterdam', '90 min'],
      ['17.05', "A walk through the season's first room", 'Reading Garden, Pavilion North', '2 hr'],
      ['06.06', 'Public Form 01 - opening', 'Square of the Slow Sun, Antwerp', 'All day'],
      ['28.06', 'Field Notes residency, week one supper', 'House of the Half Window', '3 hr'],
      ['19.07', 'A Letter to the Sun, evening reading', 'Aurora Library, room 3', '75 min'],
      ['14.08', 'Quiet Editions - print fair & book launch', 'Type Garden, Pavilion South', '2 days'],
      ['22.09', 'Open Conversations · meteorology & drawing', 'Reading Room, ground floor', '2 hr'],
      ['11.10', 'The Last Window, closing performance', 'Pavilion of Quiet Form, Rotterdam', '60 min']
    ]
  },
  'colophon': {
    kicker: 'Colophon · Programme 04',
    title: 'With thanks to the slow readers.',
    footer_items: [
      { heading: 'Curated by', body: 'Idun Reijners with the editorial board' },
      { heading: 'Designed', body: 'In daylight, on warm paper, over fourteen weeks' },
      { heading: 'Hosts', body: 'Aurora Institute\nPavilion of Quiet Form\nReading Garden' },
      { heading: 'Until next year', body: 'The fifth programme opens in May 2027. Look for the yellow on the door.' }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || '#E9E5DB',
    paperDeep: source.surface || '#DCD6C4',
    sun: source.primary || '#F1EE2E',
    sunSoft: source.sun_soft || '#F8F39B',
    haze: source.accent || '#F0DA7C',
    ink: source.text || '#1B2566',
    ember: source.ember || '#E26B4A'
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

function variantPage(variant) {
  return PAGE_VARIANTS.indexOf(variant) + 1
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''} ${spec.page_family_source?.source_class || ''}`.toLowerCase()
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant.replace('s-', ''))) return variant
  }
  if (raw.includes('cover')) return 'cover'
  if (raw.includes('manifesto') || raw.includes('quote') || raw.includes('statement')) return 'manifesto'
  if (raw.includes('programme') || raw.includes('agenda')) return 'programme'
  if (raw.includes('chapter') || raw.includes('section')) return 'chapter'
  if (raw.includes('data') || raw.includes('chart')) return 'data'
  if (raw.includes('calendar') || raw.includes('timeline') || raw.includes('schedule')) return 'cal'
  if (raw.includes('closing') || raw.includes('colophon')) return 'colophon'
  return 'cover'
}

function pageNumber(spec, variant) {
  const page = spec.page_family_source?.source_slide_index || variantPage(variant)
  return `${String(page).padStart(2, '0')} / ${String(PAGE_VARIANTS.length).padStart(2, '0')}`
}

function frame(spec, variant, children = []) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: theme.paper,
      color: theme.ink,
      overflow: 'hidden'
    },
    [
      ...textureDots(theme),
      ...children,
      TextBlock(pageNumber(spec, variant), {
        position: 'absolute',
        right: 26,
        bottom: 16,
        width: 64,
        color: theme.ink,
        opacity: 0.75,
        fontSize: 9,
        textAlign: 'right',
        letterSpacing: 0.8,
        ...role('metric', spec, { fontSize: 9, lineHeight: 1, fontWeight: 500 })
      })
    ]
  )
}

function glow(theme, left, top, width, height, opacity = 0.55, color = theme.sun) {
  return box({
    position: 'absolute',
    left,
    top,
    width,
    height,
    borderRadius: Math.max(width, height),
    backgroundColor: color,
    opacity
  })
}

function textureDots(theme) {
  return Array.from({ length: 10 }, (_, index) =>
    box({
      position: 'absolute',
      left: 806 + (index % 5) * 16,
      top: 418 + Math.floor(index / 5) * 16,
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.ink,
      opacity: 0.28
    })
  )
}

function blockTiles(theme, mode = 'cover') {
  if (mode === 'colophon') {
    return [
      box({ position: 'absolute', left: 0, top: 0, width: 480, height: 135, backgroundColor: theme.sun, opacity: 0.55 }),
      box({ position: 'absolute', right: 0, top: 270, width: 240, height: 202, backgroundColor: theme.sun, opacity: 0.4 })
    ]
  }
  return [
    box({ position: 'absolute', left: 0, top: 135, width: 240, height: 202, backgroundColor: theme.sun, opacity: 0.55 }),
    box({ position: 'absolute', right: 0, top: 0, width: 240, height: 202, backgroundColor: theme.sun, opacity: 0.4 }),
    box({ position: 'absolute', left: 0, top: 337, width: 480, height: 203, backgroundColor: theme.sun, opacity: 0.7 }),
    box({ position: 'absolute', left: 480, top: 337, width: 480, height: 135, backgroundColor: theme.sun, opacity: 0.45 })
  ]
}

function caption(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(upper(text), {
    color: theme.ink,
    fontSize: 10,
    lineHeight: 1.2,
    letterSpacing: 1.8,
    ...role('label', spec, { fontSize: 10, lineHeight: 1.2, fontWeight: 700 }),
    ...style
  })
}

function bodyText(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: theme.ink,
    fontSize: 13,
    lineHeight: 1.5,
    ...role('body', spec, { fontSize: 13, lineHeight: 1.5, fontWeight: 400 }),
    ...style
  })
}

function serifText(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(text, {
    color: theme.ink,
    fontSize: 42,
    lineHeight: 1,
    ...role('display', spec, { fontSize: 42, lineHeight: 1, fontWeight: 400, textTransform: 'none' }),
    ...style
  })
}

function footerItem(spec, item, left, width, bottom = 50) {
  const theme = colors(spec)
  return box(
    {
      position: 'absolute',
      left,
      bottom,
      width,
      height: 76,
      flexDirection: 'column',
      borderTopWidth: 1,
      borderTopColor: theme.ink,
      paddingTop: 10
    },
    [
      caption(item.heading || 'Field', spec, { fontSize: 8.5, marginBottom: 7, letterSpacing: 1.4 }),
      bodyText(item.body || '', spec, { width, fontSize: 10.5, lineHeight: 1.42, whiteSpace: 'pre-line' })
    ]
  )
}

function renderCover(spec) {
  const theme = colors(spec)
  const title = value(spec, 'title', DEFAULTS['cover'].title)
  const footer = objectArray(spec, 'footer_items', DEFAULTS['cover'].footer_items)
  return frame(spec, 'cover', [
    ...blockTiles(theme),
    glow(theme, 248, 76, 520, 360, 0.5),
    glow(theme, 760, -40, 260, 210, 0.18, theme.ember),
    TextBlock(value(spec, 'date', DEFAULTS['cover'].date), {
      position: 'absolute',
      right: 54,
      top: 30,
      width: 236,
      color: theme.ink,
      fontSize: 52,
      lineHeight: 0.94,
      textAlign: 'right',
      whiteSpace: 'pre-line',
      ...role('display', spec, { fontSize: 52, lineHeight: 0.94, fontWeight: 400 })
    }),
    serifText(title, spec, { position: 'absolute', left: 42, top: 204, width: 804, fontSize: 92, lineHeight: 0.9 }),
    caption(value(spec, 'eyebrow', DEFAULTS['cover'].eyebrow), spec, { position: 'absolute', left: 46, top: 348, width: 420, fontSize: 9 }),
    footerItem(spec, footer[0] || {}, 42, 152),
    footerItem(spec, footer[1] || {}, 218, 138),
    footerItem(spec, footer[2] || {}, 380, 190),
    footerItem(spec, footer[3] || {}, 594, 318)
  ])
}

function renderManifesto(spec) {
  const theme = colors(spec)
  return frame(spec, 'manifesto', [
    glow(theme, 140, 42, 680, 430, 0.36),
    glow(theme, -170, 360, 360, 260, 0.14, theme.ember),
    TextBlock(value(spec, 'quote', DEFAULTS['manifesto'].quote), {
      position: 'absolute',
      left: 108,
      top: 158,
      width: 744,
      color: theme.ink,
      fontSize: 52,
      lineHeight: 1.1,
      ...role('display', spec, { fontSize: 52, lineHeight: 1.1, fontWeight: 400, fontStyle: 'italic', textTransform: 'none' })
    }),
    caption(value(spec, 'author', DEFAULTS['manifesto'].author), spec, { position: 'absolute', left: 52, bottom: 74, width: 360 })
  ])
}

function renderProgramme(spec) {
  const theme = colors(spec)
  const strands = objectArray(spec, 'strands', DEFAULTS['programme'].strands).slice(0, 5)
  return frame(spec, 'programme', [
    box({ position: 'absolute', left: 0, top: 0, width: 480, height: 540, backgroundColor: theme.sun }),
    caption(value(spec, 'kicker', DEFAULTS['programme'].kicker), spec, { position: 'absolute', left: 58, top: 58, width: 310 }),
    serifText(value(spec, 'title', DEFAULTS['programme'].title), spec, { position: 'absolute', left: 58, top: 218, width: 360, fontSize: 92, lineHeight: 0.88 }),
    bodyText(value(spec, 'meta', DEFAULTS['programme'].meta), spec, { position: 'absolute', left: 58, top: 402, width: 336, fontSize: 12.5, lineHeight: 1.45 }),
    caption('Strand · Title · Anchor', spec, {
      position: 'absolute',
      left: 536,
      top: 58,
      width: 344,
      height: 30,
      borderBottomWidth: 1,
      borderBottomColor: theme.ink
    }),
    box(
      { position: 'absolute', left: 536, top: 108, width: 356, flexDirection: 'column', gap: 8 },
      strands.map((item) =>
        box(
          {
            width: 356,
            minHeight: 54,
            flexDirection: 'row',
            gap: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(27,37,102,0.18)',
            paddingBottom: 8
          },
          [
            serifText(item.num || '01', spec, { width: 42, fontSize: 24, lineHeight: 1 }),
            box({ width: 294, flexDirection: 'column' }, [
              serifText(item.title || '', spec, { width: 294, fontSize: 18, lineHeight: 1.05, marginBottom: 3 }),
              bodyText(item.body || '', spec, { width: 286, fontSize: 9.8, lineHeight: 1.24 })
            ])
          ]
        )
      )
    )
  ])
}

function renderChapter(spec) {
  const theme = colors(spec)
  return frame(spec, 'chapter', [
    glow(theme, -150, -120, 500, 380, 0.36),
    glow(theme, 760, 408, 360, 260, 0.13, theme.ember),
    caption(value(spec, 'rail', DEFAULTS['chapter'].rail), spec, {
      position: 'absolute',
      left: -142,
      top: 270,
      width: 340,
      transform: 'rotate(-90deg)',
      letterSpacing: 2.6
    }),
    serifText(value(spec, 'number', DEFAULTS['chapter'].number), spec, {
      position: 'absolute',
      left: 142,
      top: 60,
      width: 420,
      fontSize: 218,
      lineHeight: 0.82
    }),
    serifText(value(spec, 'title', DEFAULTS['chapter'].title), spec, {
      position: 'absolute',
      left: 152,
      top: 282,
      width: 620,
      fontSize: 44,
      lineHeight: 1.05
    }),
    bodyText(value(spec, 'lede', DEFAULTS['chapter'].lede), spec, {
      position: 'absolute',
      left: 154,
      top: 382,
      width: 512,
      fontSize: 13.5,
      lineHeight: 1.5
    })
  ])
}

function renderData(spec) {
  const theme = colors(spec)
  const stats = objectArray(spec, 'stats', DEFAULTS['data'].stats).slice(0, 2)
  const rows = objectArray(spec, 'rows', DEFAULTS['data'].rows).slice(0, 5)
  return frame(spec, 'data', [
    glow(theme, 700, -90, 420, 260, 0.32),
    box({ position: 'absolute', left: 58, top: 58, width: 844, height: 78, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: theme.ink, paddingBottom: 16 }, [
      serifText(value(spec, 'title', DEFAULTS['data'].title), spec, { width: 360, fontSize: 38, lineHeight: 1 }),
      caption(value(spec, 'label', DEFAULTS['data'].label), spec, { width: 300, textAlign: 'right' })
    ]),
    box(
      { position: 'absolute', left: 62, top: 178, width: 300, flexDirection: 'column', gap: 30 },
      stats.map((item) =>
        box({ width: 300, flexDirection: 'column' }, [
          serifText(item.value || '', spec, { width: 220, fontSize: 72, lineHeight: 0.9 }),
          caption(item.label || '', spec, { fontSize: 9, marginTop: 4, marginBottom: 8 }),
          bodyText(item.body || '', spec, { width: 276, fontSize: 11.5, lineHeight: 1.38 })
        ])
      )
    ),
    box(
      { position: 'absolute', left: 432, top: 188, width: 432, flexDirection: 'column', gap: 18 },
      rows.map((item) => {
        const pct = Math.max(16, Math.min(100, Number(item.pct || 50)))
        return box({ width: 432, height: 30, flexDirection: 'row', alignItems: 'center', gap: 16 }, [
          TextBlock(item.year || '', { width: 54, color: theme.ink, fontSize: 11, ...role('metric', spec, { fontSize: 11, lineHeight: 1, fontWeight: 500 }) }),
          box({ width: 250, height: 18, backgroundColor: 'rgba(27,37,102,0.12)' }, [
            box({ width: Math.round((pct / 100) * 250), height: 18, backgroundColor: pct >= 96 ? theme.sun : theme.ink, borderWidth: pct >= 96 ? 1 : 0, borderColor: theme.ink })
          ]),
          TextBlock(item.value || '', { width: 86, color: theme.ink, fontSize: 11, textAlign: 'right', ...role('metric', spec, { fontSize: 11, lineHeight: 1, fontWeight: 500 }) })
        ])
      })
    )
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'quote', [
    box({ position: 'absolute', right: 0, top: 0, width: 308, height: 540, backgroundColor: theme.sun }),
    glow(theme, -120, 374, 420, 260, 0.22),
    box({ position: 'absolute', left: 54, top: 132, width: 538, flexDirection: 'column' }, [
      caption(value(spec, 'kicker', DEFAULTS['quote'].kicker), spec, { marginBottom: 22 }),
      TextBlock(value(spec, 'quote', DEFAULTS['quote'].quote), {
        width: 520,
        color: theme.ink,
        fontSize: 43,
        lineHeight: 1.08,
        ...role('display', spec, { fontSize: 43, lineHeight: 1.08, fontWeight: 400, fontStyle: 'italic', textTransform: 'none' })
      }),
      box({ width: 518, marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.ink, flexDirection: 'row', gap: 20 }, [
        caption(value(spec, 'who', DEFAULTS['quote'].who), spec, { width: 150, letterSpacing: 1.4 }),
        bodyText(value(spec, 'role', DEFAULTS['quote'].role), spec, { width: 332, fontSize: 11, lineHeight: 1.35, opacity: 0.75 })
      ])
    ]),
    serifText(value(spec, 'mark', '¨'), spec, { position: 'absolute', right: 68, bottom: 82, width: 150, fontSize: 136, lineHeight: 0.8 })
  ])
}

function renderCalendar(spec) {
  const theme = colors(spec)
  const rows = array(spec, 'rows', DEFAULTS['cal'].rows).slice(0, 8)
  return frame(spec, 'cal', [
    glow(theme, 730, -120, 430, 260, 0.28),
    box({ position: 'absolute', left: 58, top: 56, width: 844, height: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: theme.ink, paddingBottom: 14 }, [
      serifText(value(spec, 'title', DEFAULTS['cal'].title), spec, { width: 360, fontSize: 42, lineHeight: 1 }),
      caption(value(spec, 'label', DEFAULTS['cal'].label), spec, { width: 300, textAlign: 'right' })
    ]),
    box({ position: 'absolute', left: 58, top: 146, width: 844, flexDirection: 'column' }, [
      ledgerRow(spec, ['Date', 'Title', 'Venue', 'Length'], true),
      ...rows.map((row) => ledgerRow(spec, row, false))
    ])
  ])
}

function ledgerRow(spec, row, header) {
  const theme = colors(spec)
  const values = Array.isArray(row) ? row : [row.date, row.title, row.venue, row.length]
  return box(
    {
      width: 844,
      minHeight: header ? 30 : 38,
      flexDirection: 'row',
      gap: 18,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: header ? theme.ink : 'rgba(27,37,102,0.2)',
      padding: header ? '4px 0 8px 0' : '8px 0'
    },
    [
      TextBlock(String(values[0] || ''), { width: 74, color: theme.ink, fontSize: header ? 9 : 11, letterSpacing: 0.8, ...role('metric', spec, { fontSize: header ? 9 : 11, lineHeight: 1, fontWeight: header ? 700 : 500 }) }),
      TextBlock(String(values[1] || ''), { width: 334, color: theme.ink, fontSize: header ? 9 : 17, lineHeight: 1.15, letterSpacing: header ? 1.2 : 0, ...role(header ? 'label' : 'display', spec, { fontSize: header ? 9 : 17, lineHeight: 1.15, fontWeight: header ? 700 : 400 }) }),
      bodyText(String(values[2] || ''), spec, { width: 244, fontSize: header ? 9 : 11.5, lineHeight: 1.25, letterSpacing: header ? 1.2 : 0, ...role(header ? 'label' : 'body', spec, { fontSize: header ? 9 : 11.5, lineHeight: 1.25, fontWeight: header ? 700 : 400 }) }),
      TextBlock(String(values[3] || ''), { width: 80, color: theme.ink, opacity: header ? 1 : 0.78, fontSize: header ? 9 : 10.5, textAlign: 'right', letterSpacing: 0.8, ...role('metric', spec, { fontSize: header ? 9 : 10.5, lineHeight: 1, fontWeight: header ? 700 : 500 }) })
    ]
  )
}

function renderColophon(spec) {
  const theme = colors(spec)
  const footer = objectArray(spec, 'footer_items', DEFAULTS['colophon'].footer_items)
  return frame(spec, 'colophon', [
    ...blockTiles(theme, 'colophon'),
    glow(theme, 242, 384, 520, 290, 0.42),
    glow(theme, -120, 34, 330, 220, 0.16, theme.ember),
    caption(value(spec, 'kicker', DEFAULTS['colophon'].kicker), spec, { position: 'absolute', left: 48, top: 52, width: 360 }),
    serifText(value(spec, 'title', DEFAULTS['colophon'].title), spec, { position: 'absolute', left: 48, top: 96, width: 762, fontSize: 74, lineHeight: 0.92 }),
    footerItem(spec, footer[0] || {}, 48, 178, 92),
    footerItem(spec, footer[1] || {}, 250, 164, 92),
    footerItem(spec, footer[2] || {}, 436, 164, 92),
    footerItem(spec, footer[3] || {}, 620, 292, 92)
  ])
}

const RENDERERS = {
  'cover': renderCover,
  'manifesto': renderManifesto,
  'programme': renderProgramme,
  'chapter': renderChapter,
  'data': renderData,
  'quote': renderQuote,
  'cal': renderCalendar,
  'colophon': renderColophon
}

export function renderBiennaleProgrammePoster(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
