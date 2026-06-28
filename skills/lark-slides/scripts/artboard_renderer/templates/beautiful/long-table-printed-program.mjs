import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'printed-program'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'manifesto', 'index', 'featured', 'menu', 'quote', 'cal', 'closing']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'long-table',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'long-table',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'quote', 'closing'],
      repeatable: ['manifesto', 'index', 'featured', 'menu', 'cal']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/long-table-1.png'
}

const DEFAULTS = {
  cover: {
    edition: '5',
    eyebrow: 'december edition',
    title: 'Long Table',
    city: 'Lisbon',
    cta: 'Apply now',
    availability: '22 seats only',
    lede: "More than dinner, it's a long evening.",
    badge: 'Not a meal, an evening',
    tagline: 'Where ten strangers, one cook, and a long evening meet under low light. Twice a month, by application.',
    issue: 'No.\n05',
    right_meta: 'December · Lisbon · Edition',
    right_note: 'Twice a month, ten strangers, one cook, one long table. By application.',
    page: '01 / 08'
  },
  manifesto: {
    edition: '·',
    eyebrow: 'a letter from the table',
    title: 'A note\nbefore\nwe sit.',
    paragraphs: [
      "We started Long Table in a borrowed kitchen, with six chairs we'd carried up the stairs, and the conviction that an evening is more than the food on the plates.",
      "Three years on we've seated almost two thousand strangers across nine cities, and we've learned that the chairs are sometimes the most important part.",
      'This deck is the small handbook we send our hosts before each edition. It is also, quietly, an invitation.'
    ],
    signature: 'Iris & Theo',
    signature_meta: 'Long Table founders',
    page: '02 / 08'
  },
  index: {
    title: 'Three recent editions',
    label: 'Long Table · 2025 · selected',
    cards: [
      {
        num: 'No. 03',
        city: 'Mexico City',
        name: 'A Plate\nof Quiet',
        desc: 'Eight courses cooked entirely on a single induction ring. The room agreed not to use phones for the entire evening, and almost kept the agreement.',
        seats: '22 seats',
        date: '14 March 2025'
      },
      {
        num: 'No. 04',
        city: 'Tokyo',
        name: 'A Soup\nof Letters',
        desc: 'A reading evening, with a single course served slowly. Four guest writers, one bowl per person, and the longest pause we have ever held between courses.',
        seats: '18 seats',
        date: '06 July 2025'
      },
      {
        num: 'No. 05',
        city: 'Lisbon',
        name: 'December\nEdition',
        desc: "A long winter dinner. Twenty-two seats, one shared roast, and a quiet bookshop next door we'll wander to between courses, when the rain agrees.",
        seats: '22 seats',
        date: '11 December 2025'
      }
    ],
    page: '03 / 08'
  },
  featured: {
    edition: '5',
    eyebrow: 'december · the featured edition',
    title: 'An evening\nfor the rain.',
    lede: 'A long winter dinner in a converted printing room above a bookshop. One shared roast, an unhurried wine list, and a single intermission that may, if the weather agrees, become a walk to the harbour and back.',
    pills: ['Apply by 28 November', 'Twelve seats left'],
    info: [
      { key: 'When', value: '11 December 2025', serif: true },
      { key: 'Where', value: 'A printing room, Bairro Alto · Lisbon', serif: true },
      { key: 'Who', value: 'Twenty-two seats, by application', serif: true },
      { key: 'How long', value: 'From eight, well into the evening', serif: true },
      { key: 'Seat', value: '€84' }
    ],
    page: '04 / 08'
  },
  menu: {
    kicker: 'A Menu, in Five Slow Movements',
    title: 'December · Lisbon',
    courses: [
      { num: 'i.', name: 'Roasted chestnut soup', desc: 'with brown butter, sage, and a single thin disc of pear', pair: 'unoaked white' },
      { num: 'ii.', name: 'A small bread, hot', desc: 'made the morning of, with cultured butter and a coarse salt', pair: 'water, lemon' },
      { num: 'iii.', name: 'Mackerel, lightly cured', desc: 'on toasted rye, with parsley oil and pickled celery', pair: 'vinho verde' },
      { num: 'iv.', name: 'A long roast, the centre course', desc: 'slow lamb shoulder, root vegetables under it, served family-style', pair: 'douro red' },
      { num: 'v.', name: 'Cheese, two only', desc: 'a soft, a hard, both local; quince paste and walnuts in the half-shell', pair: 'port, late bottled' }
    ],
    page: '05 / 08'
  },
  quote: {
    kicker: 'A guest writes',
    quote: "An evening I keep describing, badly, to people who weren't there.",
    author: 'Hana Brennan',
    meta: 'long-table guest · Edition No. 04 · Tokyo',
    page: '06 / 08'
  },
  cal: {
    title: "What's coming up",
    label: '2026 calendar · subject to weather',
    headers: ['No.', 'City', 'Theme', 'Date', 'Status'],
    rows: [
      ['06', 'Lisbon', 'A long winter dinner, with a roast and a walk', '11 December 2025', 'Sold out'],
      ['07', 'Brooklyn', 'A reading evening, with one quiet course', '17 January 2026', '12 seats left'],
      ['08', 'Mexico City', 'A small breakfast, taken slowly', '22 February 2026', 'Apply now'],
      ['09', 'Athens', 'A spring supper, on a roof, with wind', '14 March 2026', 'Apply now'],
      ['10', 'Seoul', 'A small soup of late letters', '06 May 2026', 'Apply soon'],
      ['11', 'Paris', 'An afternoon, mostly cheese and wind', '18 June 2026', 'Wait list']
    ],
    page: '07 / 08'
  },
  closing: {
    edition: '·',
    eyebrow: 'come and sit with us',
    title: 'See you\nat the table.',
    desc: 'Every Long Table evening is by application. We read each one, and we usually answer within a week. The next room opens for Brooklyn on the seventeenth of January.',
    pills: ['long-table.co', 'Apply for Brooklyn'],
    footer: [
      { tag: 'Founded', value: '2019 · Borrowed kitchen' },
      { tag: 'Set', value: 'Nine cities · one long room' },
      { tag: 'Until then', value: 'Keep the chair warm' }
    ],
    page: '08 / 08'
  }
}

function theme(spec) {
  const source = spec.theme?.colors || {}
  return {
    paper: source.background || '#FAF1E2',
    paperD: source.panel || '#F2E5CF',
    paperVD: '#E8D7B6',
    ink: source.primary || '#B53D2A',
    deep: source.text || '#8E2D1F',
    faint: 'rgba(181, 61, 42, 0.32)',
    soft: 'rgba(181, 61, 42, 0.14)'
  }
}

function array(spec, key, fallback = []) {
  const value = spec.content?.[key]
  return Array.isArray(value) && value.length ? value : fallback
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
  if (raw.includes('cover') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('chapter')) return 'manifesto'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('closing') || raw.includes('end')) return 'closing'
  if (raw.includes('process') || raw.includes('timeline') || raw.includes('calendar')) return 'cal'
  if (raw.includes('menu') || raw.includes('content')) return 'menu'
  if (raw.includes('data') || raw.includes('chart') || raw.includes('metric')) return 'index'
  return 'featured'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function page(spec, children = []) {
  const t = theme(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: t.paper,
      color: t.ink,
      overflow: 'hidden'
    },
    children.filter(Boolean)
  )
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    ...role('label', spec, { fontWeight: 700 }),
    color: theme(spec).ink,
    fontSize: 13,
    lineHeight: 1.15,
    ...style
  })
}

function serif(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    ...role('body', spec, { fontWeight: 400, lineHeight: 1.42 }),
    color: theme(spec).ink,
    fontSize: 18,
    lineHeight: 1.42,
    ...style
  })
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    ...role('display', spec, { fontWeight: 800, lineHeight: 0.92, letterSpacing: -0.8, textTransform: 'uppercase' }),
    color: theme(spec).ink,
    whiteSpace: 'pre-line',
    fontSize: 72,
    lineHeight: 0.92,
    letterSpacing: -0.8,
    ...style
  })
}

function badge(value, spec, style = {}) {
  const t = theme(spec)
  return TextBlock(String(value || ''), {
    ...role('metric', spec, { fontWeight: 400, fontStyle: 'italic' }),
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: t.ink,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: t.ink,
    fontSize: 16,
    lineHeight: 1,
    ...style
  })
}

function pill(value, spec, style = {}) {
  const t = theme(spec)
  return TextBlock(String(value || ''), {
    ...role('body', spec, { fontWeight: 400, fontStyle: 'italic', lineHeight: 1.05 }),
    minWidth: 84,
    height: 34,
    borderWidth: 1.5,
    borderColor: t.ink,
    borderRadius: 17,
    padding: '7px 18px',
    color: t.ink,
    fontSize: 14,
    lineHeight: 1.05,
    textAlign: 'center',
    ...style
  })
}

function rectTag(value, spec, style = {}) {
  const t = theme(spec)
  return TextBlock(String(value || ''), {
    ...role('body', spec, { fontWeight: 400, fontStyle: 'italic', lineHeight: 1 }),
    minWidth: 120,
    height: 28,
    borderWidth: 1.5,
    borderColor: t.ink,
    padding: '6px 12px',
    color: t.ink,
    fontSize: 13,
    lineHeight: 1,
    ...style
  })
}

function pageNum(value, spec) {
  return label(value, spec, {
    position: 'absolute',
    right: 34,
    bottom: 18,
    fontSize: 10,
    opacity: 0.86,
    ...role('metric', spec, { fontSize: 10, lineHeight: 1, fontWeight: 400, fontStyle: 'italic' })
  })
}

function rule(style = {}) {
  const { theme: themeValue, ...rest } = style
  const t = themeValue || {}
  return box({
    height: 1.5,
    backgroundColor: t.ink || '#B53D2A',
    ...rest
  })
}

function renderCover(spec) {
  const t = theme(spec)
  const c = content(spec, 'cover')
  return page(spec, [
    badge(c.edition, spec, { position: 'absolute', left: 62, top: 76 }),
    serif(c.eyebrow, spec, { position: 'absolute', left: 112, top: 81, fontSize: 21, lineHeight: 1, fontStyle: 'italic' }),
    display(c.title, spec, { position: 'absolute', left: 62, top: 142, width: 320, height: 118, fontSize: 56, lineHeight: 0.92 }),
    box({ position: 'absolute', left: 62, top: 282, width: 250, height: 34, flexDirection: 'row', gap: 11, alignItems: 'center' }, [
      pill(c.city, spec),
      serif('|', spec, { fontSize: 18, lineHeight: 1, opacity: 0.7 }),
      pill(c.cta, spec, { minWidth: 104 })
    ]),
    serif(c.availability, spec, { position: 'absolute', left: 62, top: 332, width: 300, fontSize: 17, lineHeight: 1.2, fontWeight: 600 }),
    serif(c.lede, spec, { position: 'absolute', left: 62, top: 356, width: 330, fontSize: 17, lineHeight: 1.34, fontStyle: 'italic' }),
    rectTag(c.badge, spec, { position: 'absolute', left: 62, top: 416, minWidth: 164 }),
    serif(c.tagline, spec, { position: 'absolute', left: 62, top: 452, width: 330, fontSize: 17, lineHeight: 1.28, fontStyle: 'italic' }),
    box({ position: 'absolute', right: 58, top: 66, width: 430, height: 370, alignItems: 'flex-end', justifyContent: 'center', flexDirection: 'column' }, [
      TextBlock(String(c.issue || '').replace(' ', '\n'), {
        width: 410,
        textAlign: 'right',
        whiteSpace: 'pre-line',
        color: t.ink,
        fontSize: 154,
        lineHeight: 0.86,
        letterSpacing: -3,
        ...role('metric', spec, { fontWeight: 400, lineHeight: 0.86, letterSpacing: -3, fontStyle: 'italic' })
      }),
      label(String(c.right_meta || '').toUpperCase(), spec, { marginTop: 8, width: 330, textAlign: 'right', fontSize: 12, letterSpacing: 2 }),
      serif(c.right_note, spec, { marginTop: 22, width: 300, textAlign: 'right', fontSize: 16, lineHeight: 1.38 })
    ]),
    pageNum(c.page, spec)
  ])
}

function renderManifesto(spec) {
  const c = content(spec, 'manifesto')
  const paragraphs = array(spec, 'paragraphs', c.paragraphs)
  return page(spec, [
    box({ position: 'absolute', left: 88, top: 108, width: 320, bottom: 112, flexDirection: 'column', justifyContent: 'center' }, [
      box({ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 30 }, [
        badge(c.edition, spec),
        serif(c.eyebrow, spec, { fontSize: 18, lineHeight: 1.1, fontStyle: 'italic' })
      ]),
      display(c.title, spec, { width: 300, fontSize: 65, lineHeight: 0.9 })
    ]),
    box({ position: 'absolute', left: 475, top: 118, width: 390, bottom: 108, flexDirection: 'column', justifyContent: 'center', gap: 18 }, [
      ...paragraphs.slice(0, 3).map((para, index) =>
        serif(para, spec, {
          fontSize: 18,
          lineHeight: 1.42,
          fontWeight: index === 1 ? 500 : 400,
          fontStyle: 'italic'
        })
      ),
      box({ marginTop: 8, flexDirection: 'column', gap: 4 }, [
        label(c.signature, spec, { fontSize: 15, textTransform: 'uppercase' }),
        serif(c.signature_meta, spec, { fontSize: 14, lineHeight: 1.1, opacity: 0.78, fontStyle: 'italic' })
      ])
    ]),
    pageNum(c.page, spec)
  ])
}

function renderIndex(spec) {
  const t = theme(spec)
  const c = content(spec, 'index')
  const cards = array(spec, 'cards', c.cards)
  return page(spec, [
    box({ position: 'absolute', left: 64, right: 64, top: 92, bottom: 98, flexDirection: 'column', gap: 28 }, [
      box({ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1.5, borderColor: t.ink, paddingBottom: 16 }, [
        display(c.title, spec, { width: 570, fontSize: 48, lineHeight: 0.96 }),
        serif(c.label, spec, { width: 210, textAlign: 'right', fontSize: 14, lineHeight: 1.35, fontStyle: 'italic' })
      ]),
      box({ flexDirection: 'row', gap: 22, alignItems: 'stretch' }, cards.slice(0, 3).map((card) =>
        box({ width: 262, minHeight: 230, borderWidth: 1.5, borderColor: t.ink, padding: '20px 18px', flexDirection: 'column' }, [
          box({ flexDirection: 'row', gap: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: t.faint, paddingBottom: 12 }, [
            serif(card.num, spec, { fontSize: 13, lineHeight: 1, fontStyle: 'italic' }),
            serif(card.city, spec, { marginLeft: 'auto', fontSize: 13, lineHeight: 1, fontStyle: 'italic' })
          ]),
          display(card.name, spec, { marginTop: 14, fontSize: 28, lineHeight: 0.96, whiteSpace: 'pre-line' }),
          serif(card.desc, spec, { marginTop: 12, fontSize: 13, lineHeight: 1.42, fontStyle: 'italic', flex: 1 }),
          box({ marginTop: 14, borderTopWidth: 1, borderStyle: 'dashed', borderColor: t.faint, paddingTop: 10, flexDirection: 'row' }, [
            serif(card.seats, spec, { fontSize: 12, lineHeight: 1, fontStyle: 'italic' }),
            serif(card.date, spec, { marginLeft: 'auto', fontSize: 12, lineHeight: 1, fontStyle: 'italic', textAlign: 'right' })
          ])
        ])
      ))
    ]),
    pageNum(c.page, spec)
  ])
}

function renderFeatured(spec) {
  const t = theme(spec)
  const c = content(spec, 'featured')
  const pills = array(spec, 'pills', c.pills)
  const info = array(spec, 'info', c.info)
  return page(spec, [
    box({ position: 'absolute', left: 88, top: 105, width: 380, bottom: 130, flexDirection: 'column', justifyContent: 'center' }, [
      box({ flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 26 }, [
        badge(c.edition, spec),
        serif(c.eyebrow, spec, { fontSize: 17, lineHeight: 1.1, fontStyle: 'italic' })
      ]),
      display(c.title, spec, { width: 380, height: 150, fontSize: 52, lineHeight: 0.9 }),
      serif(c.lede, spec, { marginTop: 18, width: 360, fontSize: 15, lineHeight: 1.42, fontStyle: 'italic' }),
      box({ marginTop: 16, flexDirection: 'row', gap: 16, flexWrap: 'wrap' }, pills.slice(0, 2).map((item) => pill(item, spec, { minWidth: 150 })))
    ]),
    box({ position: 'absolute', right: 78, top: 112, width: 382, bottom: 126, borderWidth: 1.5, borderColor: t.ink, padding: '28px 28px', flexDirection: 'column', justifyContent: 'center', gap: 13 }, info.slice(0, 5).map((item) =>
      box({ minHeight: 42, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: t.faint, paddingBottom: 10, flexDirection: 'row', alignItems: 'baseline', gap: 18 }, [
        label(item.key, spec, { width: 92, fontSize: 11, letterSpacing: 1.6 }),
        item.serif
          ? serif(item.value, spec, { flex: 1, textAlign: 'right', fontSize: 17, lineHeight: 1.18, fontStyle: 'italic' })
          : display(item.value, spec, { flex: 1, textAlign: 'right', fontSize: 28, lineHeight: 1 })
      ])
    )),
    pageNum(c.page, spec)
  ])
}

function renderMenu(spec) {
  const t = theme(spec)
  const c = content(spec, 'menu')
  const courses = array(spec, 'courses', c.courses)
  return page(spec, [
    box({ position: 'absolute', left: 130, right: 130, top: 52, bottom: 98, flexDirection: 'column' }, [
      box({ alignItems: 'center', flexDirection: 'column', gap: 8, marginBottom: 14 }, [
        serif(c.kicker, spec, { fontSize: 17, lineHeight: 1, fontStyle: 'italic', textAlign: 'center' }),
        display(c.title, spec, { fontSize: 47, lineHeight: 0.94, textAlign: 'center' })
      ]),
      box({ flexDirection: 'column' }, courses.slice(0, 5).map((course) =>
        box({ minHeight: 58, borderBottomWidth: 1, borderColor: t.faint, padding: '11px 0', flexDirection: 'row', alignItems: 'center', gap: 18 }, [
          serif(course.num, spec, { width: 50, fontSize: 16, lineHeight: 1, fontStyle: 'italic' }),
          box({ flex: 1, flexDirection: 'column', gap: 4 }, [
            display(course.name, spec, { fontSize: 22, lineHeight: 1.05 }),
            serif(course.desc, spec, { fontSize: 13, lineHeight: 1.32, fontStyle: 'italic' })
          ]),
          serif(course.pair, spec, { width: 138, textAlign: 'right', fontSize: 13, lineHeight: 1.15, fontStyle: 'italic', opacity: 0.78 })
        ])
      ))
    ]),
    pageNum(c.page, spec)
  ])
}

function renderQuote(spec) {
  const t = theme(spec)
  const c = content(spec, 'quote')
  return page(spec, [
    box({ position: 'absolute', left: 156, right: 156, top: 124, bottom: 126, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }, [
      serif(c.kicker, spec, { fontSize: 17, lineHeight: 1, fontStyle: 'italic', textAlign: 'center', marginBottom: 26 }),
      display(c.quote, spec, { width: 650, fontSize: 44, lineHeight: 0.98, textAlign: 'center' }),
      rule({ theme: t, width: 210, marginTop: 26, marginBottom: 16 }),
      label(c.author, spec, { textAlign: 'center', fontSize: 15 }),
      serif(c.meta, spec, { marginTop: 5, textAlign: 'center', fontSize: 13, lineHeight: 1.2, fontStyle: 'italic', opacity: 0.78 })
    ]),
    pageNum(c.page, spec)
  ])
}

function renderCal(spec) {
  const t = theme(spec)
  const c = content(spec, 'cal')
  const rows = array(spec, 'rows', c.rows)
  return page(spec, [
    box({ position: 'absolute', left: 78, right: 78, top: 82, bottom: 96, flexDirection: 'column' }, [
      box({ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1.5, borderColor: t.ink, paddingBottom: 14, marginBottom: 14 }, [
        display(c.title, spec, { width: 500, fontSize: 48, lineHeight: 0.94 }),
        serif(c.label, spec, { width: 230, textAlign: 'right', fontSize: 14, lineHeight: 1.3, fontStyle: 'italic' })
      ]),
      box({ height: 23, borderBottomWidth: 1.5, borderColor: t.ink, flexDirection: 'row', alignItems: 'center' }, [
        label('No.', spec, { width: 74, fontSize: 11 }),
        label('City', spec, { width: 118, fontSize: 11 }),
        label('Theme', spec, { width: 330, fontSize: 11 }),
        label('Date', spec, { width: 145, fontSize: 11 }),
        label('Status', spec, { width: 128, fontSize: 11, textAlign: 'right' })
      ]),
      ...rows.slice(0, 6).map((row) =>
        box({ minHeight: 42, borderBottomWidth: 1, borderColor: t.faint, flexDirection: 'row', alignItems: 'center', padding: '7px 0' }, [
          serif(row[0], spec, { width: 74, fontSize: 14, lineHeight: 1, fontStyle: 'italic' }),
          display(row[1], spec, { width: 118, fontSize: 18, lineHeight: 1 }),
          serif(row[2], spec, { width: 330, fontSize: 15, lineHeight: 1.25, fontStyle: 'italic' }),
          serif(row[3], spec, { width: 145, fontSize: 13, lineHeight: 1.15, fontStyle: 'italic' }),
          pill(row[4], spec, {
            minWidth: 98,
            height: 26,
            padding: '5px 12px',
            fontSize: 12,
            backgroundColor: row[4] === 'Sold out' ? t.ink : 'transparent',
            color: row[4] === 'Sold out' ? t.paper : t.ink
          })
        ])
      )
    ]),
    pageNum(c.page, spec)
  ])
}

function renderClosing(spec) {
  const t = theme(spec)
  const c = content(spec, 'closing')
  const pills = array(spec, 'pills', c.pills)
  const footer = array(spec, 'footer', c.footer)
  return page(spec, [
    box({ position: 'absolute', left: 84, top: 110, width: 620, flexDirection: 'column', gap: 22 }, [
      box({ flexDirection: 'row', gap: 14, alignItems: 'center' }, [
        badge(c.edition, spec),
        serif(c.eyebrow, spec, { fontSize: 18, lineHeight: 1.1, fontStyle: 'italic' })
      ]),
      display(c.title, spec, { width: 560, fontSize: 58, lineHeight: 0.92 }),
      serif(c.desc, spec, { width: 430, fontSize: 17, lineHeight: 1.5, fontStyle: 'italic' }),
      box({ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }, pills.slice(0, 2).map((item) => pill(item, spec, { minWidth: 130 })))
    ]),
    box({ position: 'absolute', left: 82, right: 82, bottom: 36, flexDirection: 'row', gap: 34 }, footer.slice(0, 3).map((item) =>
      box({ flex: 1, borderTopWidth: 1, borderColor: t.ink, paddingTop: 10, flexDirection: 'column', gap: 3 }, [
        label(item.tag, spec, { fontSize: 12 }),
        serif(item.value, spec, { fontSize: 13, lineHeight: 1.25, fontStyle: 'italic' })
      ])
    )),
    pageNum(c.page, spec)
  ])
}

const RENDERERS = {
  cover: renderCover,
  manifesto: renderManifesto,
  index: renderIndex,
  featured: renderFeatured,
  menu: renderMenu,
  quote: renderQuote,
  cal: renderCal,
  closing: renderClosing
}

export function renderLongTablePrintedProgram(spec) {
  const variant = normalizeVariant(spec || {})
  return (RENDERERS[variant] || renderCover)(spec || {})
}
