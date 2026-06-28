import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'retro-zine-spread'

export const PAGE_VARIANTS = [
  'hero',
  'split',
  'statement',
  'grid',
  'visual',
  'editorial',
  'numbers',
  'collage',
  'rsvp',
  'closing'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'retro-zine',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'retro-zine',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['hero', 'statement', 'rsvp', 'closing'],
      repeatable: ['split', 'grid', 'visual', 'editorial', 'numbers', 'collage']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/retro-zine-1.png'
}

const DEFAULTS = {
  hero: {
    eyebrow: 'Q3 Strategic Overview',
    title: 'NEXUS\nVENTURES',
    subtitle: 'Growth - Innovation - Partnership',
    date: '2026'
  },
  split: {
    label: 'Our Mission',
    title: 'Building\nTomorrow',
    body:
      'We partner with ambitious teams to turn complex challenges into scalable solutions. Through disciplined strategy and creative execution, we help organizations outpace change and deliver lasting value.',
    stat: '340%',
    stat_label: 'year-over-year growth'
  },
  statement: {
    quote: 'The companies that thrive\nare not the ones that predict\nthe future. They are the ones\nthat build it.',
    author: '- Our founding principle since day one'
  },
  grid: {
    title: 'At a Glance',
    items: [
      { label: 'Founded', value: '2019 - San Francisco, CA' },
      { label: 'Team', value: '120 people across 4 continents' },
      { label: 'Clients', value: '48 active partnerships' },
      { label: 'Revenue', value: '$12.4M ARR - profitable' }
    ]
  },
  visual: {
    title: 'Q3\nTarget',
    subtitle: '$18M ARR by December',
    caption: 'Fiscal year ending March 2027'
  },
  editorial: {
    title: 'Product\nRoadmap',
    issue: 'FY 2026 / 2027',
    left:
      'Phase one is about foundation - refining our core platform, improving onboarding velocity, and expanding our API surface to serve enterprise clients with stricter compliance needs. We shipped 14 major releases this quarter alone.',
    right:
      'Next quarter we shift from build mode to distribution. The product is proven. Now we need partners, channels, and the operational muscle to support 10x user growth without breaking the experience.',
    kicker: 'PHASE TWO: SCALE'
  },
  numbers: {
    title: 'Our Core Values',
    items: [
      { number: '01', title: 'Clarity', body: 'Complex problems deserve simple explanations.' },
      { number: '02', title: 'Velocity', body: 'Ship fast, learn faster, iterate always.' },
      { number: '03', title: 'Trust', body: 'Every partnership is built on radical transparency.' }
    ]
  },
  collage: {
    title: 'Capabilities',
    pieces: [
      { title: 'Strategy', body: 'Market analysis and roadmaps that bridge ambition with execution.' },
      { title: 'Design', body: 'Brand systems and user experiences that make complexity effortless.' },
      { title: 'Engineering', body: 'Scalable architecture, robust APIs, and infrastructure that grows.' },
      { title: 'Growth', body: 'Go-to-market planning and revenue operations that accelerate traction.' }
    ]
  },
  rsvp: {
    title: "Let's Talk",
    subtitle: 'Ready to explore what we can build together?',
    fields: ['Name', 'Company', 'Email', 'Project'],
    stamp: 'CONTACT US'
  },
  closing: {
    label: 'Thank You',
    title: "Let's Build\nTogether",
    contact: 'hello@nexusventures.co - San Francisco - Worldwide',
    links: ['LinkedIn', 'Contact', 'Careers']
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    bg: source.background || '#C8B99A',
    bgDark: source.panel || '#B8A98A',
    green: source.accent || source.primary || '#008F4D',
    greenLight: source.secondary || '#00A85D',
    black: source.text || '#1A1A1A',
    white: source.surface || '#F4EFE6',
    line: source.text || '#1A1A1A'
  }
}

function variantContent(spec, variant) {
  return { ...DEFAULTS[variant], ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('closing') || raw.includes('cta')) return 'closing'
  if (raw.includes('quote') || raw.includes('statement')) return 'statement'
  if (raw.includes('data') || raw.includes('stat') || raw.includes('number')) return 'numbers'
  if (raw.includes('compare') || raw.includes('split')) return 'split'
  if (raw.includes('process') || raw.includes('timeline') || raw.includes('editor')) return 'editorial'
  if (raw.includes('agenda')) return 'rsvp'
  return 'hero'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function textValue(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function arrayValue(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback
}

function label(text, spec, theme, style = {}) {
  return TextBlock(String(text || '').toUpperCase(), {
    color: theme.green,
    fontSize: 13,
    lineHeight: 1.1,
    letterSpacing: 3.4,
    textTransform: 'uppercase',
    ...role('label', spec, { fontWeight: 700, fontSize: 13, lineHeight: 1.1, letterSpacing: 3.4, textTransform: 'uppercase' }),
    ...style
  })
}

function display(text, spec, theme, style = {}) {
  return Title(text, {
    color: theme.green,
    fontSize: 92,
    lineHeight: 0.88,
    letterSpacing: 3,
    textTransform: 'uppercase',
    whiteSpace: 'pre-wrap',
    ...role('display', spec, { fontWeight: 900, fontSize: 92, lineHeight: 0.88, letterSpacing: 3, textTransform: 'uppercase' }),
    ...style
  })
}

function body(text, spec, theme, style = {}) {
  return TextBlock(text, {
    color: theme.black,
    fontSize: 16,
    lineHeight: 1.52,
    ...role('body', spec, { fontWeight: 450, fontSize: 16, lineHeight: 1.52 }),
    ...style
  })
}

function script(text, spec, theme, style = {}) {
  return TextBlock(text, {
    color: theme.black,
    fontSize: 24,
    lineHeight: 1.18,
    ...role('body', spec, { fontWeight: 500, fontSize: 24, lineHeight: 1.18 }),
    ...style
  })
}

function metric(text, spec, theme, style = {}) {
  return TextBlock(text, {
    color: theme.green,
    fontSize: 54,
    lineHeight: 0.95,
    letterSpacing: 1,
    textTransform: 'uppercase',
    ...role('metric', spec, { fontWeight: 900, fontSize: 54, lineHeight: 0.95, letterSpacing: 1, textTransform: 'uppercase' }),
    ...style
  })
}

function page(theme, children, style = {}) {
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      backgroundColor: theme.bg,
      overflow: 'hidden',
      ...style
    },
    [
      box({ position: 'absolute', left: 24, top: 26, width: 912, height: 488, opacity: 0.13 }, [
        ...Array.from({ length: 10 }, (_, index) =>
          box({
            position: 'absolute',
            left: 0,
            top: index * 48,
            width: 912,
            height: 1,
            backgroundColor: index % 2 ? theme.black : theme.white,
            opacity: 0.16
          })
        )
      ]),
      ...children
    ]
  )
}

function paperRule(theme, style = {}) {
  return box({ backgroundColor: theme.black, height: 3, ...style })
}

function heroIllustration(theme) {
  return box({ position: 'relative', width: 220, height: 122, marginTop: 12, marginBottom: 12 }, [
    box({ position: 'absolute', left: 30, top: 38, width: 112, height: 68, borderRadius: 999, backgroundColor: theme.black }),
    box({ position: 'absolute', left: 72, top: 56, width: 34, height: 34, borderRadius: 999, backgroundColor: theme.bg, border: `3px solid ${theme.black}` }),
    box({ position: 'absolute', left: 86, top: 70, width: 8, height: 8, borderRadius: 999, backgroundColor: theme.black }),
    box({ position: 'absolute', left: 142, top: 24, width: 58, height: 88, border: `4px solid ${theme.black}`, borderRadius: 16 }),
    box({ position: 'absolute', left: 16, top: 12, width: 118, height: 4, backgroundColor: theme.black, transform: 'rotate(-9deg)' }),
    box({ position: 'absolute', left: 20, top: 104, width: 190, height: 4, backgroundColor: theme.black, transform: 'rotate(8deg)' }),
    box({ position: 'absolute', left: 40, top: 114, width: 170, height: 4, backgroundColor: theme.black, transform: 'rotate(-8deg)' })
  ])
}

function renderHero(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'hero')
  return page(theme, [
    box({ position: 'absolute', left: 260, top: 58, width: 440, height: 424, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }, [
      label(content.eyebrow, spec, theme, { marginBottom: 8 }),
      display(textValue(content.title, DEFAULTS.hero.title).toUpperCase(), spec, theme, { width: 430, textAlign: 'center', fontSize: 117, lineHeight: 0.88, letterSpacing: 4.8 }),
      heroIllustration(theme),
      label(content.subtitle, spec, theme, { color: theme.black, fontSize: 12, letterSpacing: 3, marginTop: 6 }),
      metric(content.date, spec, theme, { fontSize: 54, lineHeight: 1, letterSpacing: 2, marginTop: 8 })
    ])
  ])
}

function renderSplit(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'split')
  return page(theme, [
    box({ position: 'absolute', left: 0, top: 18, width: 480, height: 504, padding: 58, flexDirection: 'column', justifyContent: 'center', borderRight: `4px solid ${theme.black}` }, [
      label(content.label, spec, theme, { marginBottom: 18 }),
      display(content.title, spec, theme, { color: theme.black, width: 370, fontSize: 66, letterSpacing: 1.2, marginBottom: 22 }),
      body(content.body, spec, theme, { width: 360, fontSize: 17, lineHeight: 1.58 })
    ]),
    box({ position: 'absolute', left: 480, top: 18, width: 480, height: 504, padding: 58, backgroundColor: theme.bgDark, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }, [
      metric(content.stat, spec, theme, { fontSize: 134, lineHeight: 0.92, letterSpacing: 1 }),
      script(content.stat_label, spec, theme, { fontSize: 34, textAlign: 'center', marginTop: 8 })
    ])
  ])
}

function renderStatement(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'statement')
  return page(
    theme,
    [
      paperRule({ ...theme, black: theme.white }, { position: 'absolute', left: 450, top: 74, width: 60, backgroundColor: theme.white }),
      display(`"${textValue(content.quote, DEFAULTS.statement.quote)}"`, spec, theme, {
        position: 'absolute',
        left: 48,
        top: 100,
        width: 864,
        color: theme.white,
        fontSize: 43,
        lineHeight: 1.04,
        letterSpacing: 1.8,
        textAlign: 'center'
      }),
      paperRule({ ...theme, black: theme.white }, { position: 'absolute', left: 450, top: 392, width: 60, backgroundColor: theme.white }),
      script(content.author, spec, theme, { position: 'absolute', left: 250, top: 428, width: 460, color: theme.white, fontSize: 25, textAlign: 'center' })
    ],
    { backgroundColor: theme.green }
  )
}

function renderGrid(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'grid')
  const items = arrayValue(content.items, DEFAULTS.grid.items).slice(0, 4)
  const cells = [
    { left: 82, top: 166 },
    { left: 480, top: 166 },
    { left: 82, top: 309 },
    { left: 480, top: 309 }
  ]
  return page(theme, [
    display(content.title, spec, theme, { position: 'absolute', left: 82, top: 52, color: theme.green, fontSize: 86, letterSpacing: 2 }),
    box({ position: 'absolute', left: 82, top: 166, width: 796, height: 286, border: `4px solid ${theme.black}` }),
    ...items.map((item, index) => {
      const cell = cells[index]
      return box({
        position: 'absolute',
        left: cell.left,
        top: cell.top,
        width: 398,
        height: 143,
        borderRight: index % 2 === 0 ? `2px solid ${theme.black}` : 'none',
        borderBottom: index < 2 ? `2px solid ${theme.black}` : 'none',
        padding: 26,
        flexDirection: 'column',
        justifyContent: 'center'
      }, [
          label(item.label, spec, theme, { fontSize: 12, letterSpacing: 2.6, marginBottom: 8 }),
          script(item.value, spec, theme, { fontSize: 30, lineHeight: 1.12, width: 314 })
        ])
    })
  ])
}

function renderVisual(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'visual')
  return page(theme, [
    box({ position: 'absolute', left: 0, top: 0, width: 960, height: 540, backgroundColor: theme.bgDark }),
    ...[0, 1, 2, 3].map((index) =>
      box({
        position: 'absolute',
        left: 480 - (78 + index * 48),
        top: 270 - (78 + index * 48),
        width: (78 + index * 48) * 2,
        height: (78 + index * 48) * 2,
        border: `3px solid ${index === 3 ? theme.green : theme.black}`,
        borderRadius: 999,
        opacity: index === 3 ? 0.22 : 0.12
      })
    ),
    box({ position: 'absolute', left: 408, top: 42, width: 4, height: 456, backgroundColor: theme.black, opacity: 0.12, transform: 'rotate(45deg)' }),
    box({ position: 'absolute', left: 548, top: 42, width: 4, height: 456, backgroundColor: theme.black, opacity: 0.12, transform: 'rotate(-45deg)' }),
    box({ position: 'absolute', left: 310, top: 152, width: 340, height: 220, padding: '34px 48px', backgroundColor: theme.green, border: `4px solid ${theme.black}`, transform: 'rotate(-2deg)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }, [
      display(content.title, spec, theme, { color: theme.white, fontSize: 82, lineHeight: 0.88, textAlign: 'center' }),
      script(content.subtitle, spec, theme, { color: theme.white, fontSize: 28, marginTop: 10, textAlign: 'center' })
    ]),
    label(content.caption, spec, theme, { position: 'absolute', left: 286, top: 470, width: 388, color: theme.black, textAlign: 'center', fontSize: 12, letterSpacing: 3 })
  ])
}

function renderEditorial(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'editorial')
  return page(theme, [
    box({ position: 'absolute', left: 78, top: 50, width: 804, height: 96, borderBottom: `4px solid ${theme.black}`, alignItems: 'flex-end', justifyContent: 'space-between', flexDirection: 'row', paddingBottom: 14 }, [
      display(content.title, spec, theme, { fontSize: 58, lineHeight: 0.94, width: 360 }),
      label(content.issue, spec, theme, { color: theme.black, fontSize: 13, letterSpacing: 3 })
    ]),
    box({ position: 'absolute', left: 78, top: 184, width: 382, height: 278, paddingRight: 34, borderRight: `3px solid ${theme.black}`, flexDirection: 'column' }, [
      box({ flexDirection: 'row', alignItems: 'flex-start' }, [
        display('P', spec, theme, { fontSize: 70, lineHeight: 0.78, width: 54, color: theme.green, letterSpacing: 0 }),
        body(textValue(content.left, DEFAULTS.editorial.left).replace(/^P/i, ''), spec, theme, { width: 292, fontSize: 14.4, lineHeight: 1.55 })
      ])
    ]),
    box({ position: 'absolute', left: 518, top: 184, width: 364, height: 278, flexDirection: 'column' }, [
      label(content.kicker, spec, theme, { fontSize: 15, letterSpacing: 2.2, marginBottom: 18 }),
      body(content.right, spec, theme, { width: 360, fontSize: 14.6, lineHeight: 1.58 }),
      box({ marginTop: 18, backgroundColor: theme.black, padding: '3px 8px', width: 180 }, [
        body('Speed without sacrifice', spec, theme, { color: theme.bg, fontSize: 13, lineHeight: 1.2 })
      ])
    ])
  ])
}

function renderNumbers(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'numbers')
  const items = arrayValue(content.items, DEFAULTS.numbers.items).slice(0, 3)
  return page(theme, [
    label(content.title, spec, theme, { position: 'absolute', left: 305, top: 78, width: 350, color: theme.green, textAlign: 'center', letterSpacing: 4 }),
    box({ position: 'absolute', left: 90, top: 150, width: 780, height: 250, flexDirection: 'row' }, [
      ...items.map((item, index) =>
        box({
          width: 260,
          height: 250,
          padding: '26px 20px',
          border: `3px solid ${theme.black}`,
          borderRight: index < items.length - 1 ? 'none' : `3px solid ${theme.black}`,
          alignItems: 'center',
          flexDirection: 'column',
          textAlign: 'center'
        }, [
          metric(item.number, spec, theme, { fontSize: 78, lineHeight: 0.95, textAlign: 'center', letterSpacing: 1 }),
          label(item.title, spec, theme, { color: theme.black, fontSize: 15, letterSpacing: 2, marginTop: 12, textAlign: 'center' }),
          script(item.body, spec, theme, { width: 194, fontSize: 21, lineHeight: 1.22, marginTop: 12, textAlign: 'center' })
        ])
      )
    ])
  ])
}

function renderCollage(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'collage')
  const pieces = arrayValue(content.pieces, DEFAULTS.collage.pieces).slice(0, 4)
  const configs = [
    { left: 78, top: 100, width: 310, height: 148, rotate: '-3deg', bg: theme.green, title: theme.white, body: theme.white },
    { left: 570, top: 82, width: 276, height: 176, rotate: '4deg', bg: theme.white, title: theme.black, body: theme.black },
    { left: 120, top: 306, width: 270, height: 150, rotate: '2deg', bg: theme.bgDark, title: theme.black, body: theme.black },
    { left: 544, top: 318, width: 334, height: 138, rotate: '-5deg', bg: theme.black, title: theme.green, body: theme.bg }
  ]
  const tapes = [
    { left: 272, top: 58, rotate: '-25deg' },
    { left: 656, top: 56, rotate: '35deg' },
    { left: 226, top: 406, rotate: '15deg' },
    { left: 720, top: 400, rotate: '-40deg' }
  ]
  return page(theme, [
    label(content.title, spec, theme, { position: 'absolute', left: 60, top: 40, letterSpacing: 4 }),
    ...tapes.map((tape) =>
      box({
        position: 'absolute',
        left: tape.left,
        top: tape.top,
        width: 80,
        height: 24,
        backgroundColor: 'rgba(244,239,230,0.55)',
        border: `1px solid ${theme.black}`,
        opacity: 0.75,
        transform: `rotate(${tape.rotate})`,
        zIndex: 8
      })
    ),
    ...pieces.map((piece, index) => {
      const cfg = configs[index]
      return box({
        position: 'absolute',
        left: cfg.left,
        top: cfg.top,
        width: cfg.width,
        height: cfg.height,
        padding: 24,
        border: `4px solid ${theme.black}`,
        backgroundColor: cfg.bg,
        transform: `rotate(${cfg.rotate})`,
        flexDirection: 'column',
        justifyContent: 'center'
      }, [
        display(piece.title, spec, theme, { color: cfg.title, fontSize: 37, lineHeight: 0.96, letterSpacing: 1.2, marginBottom: 8 }),
        script(piece.body, spec, theme, { color: cfg.body, fontSize: 22, lineHeight: 1.22, width: cfg.width - 56 })
      ])
    })
  ])
}

function renderRsvp(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'rsvp')
  const fields = arrayValue(content.fields, DEFAULTS.rsvp.fields).slice(0, 5)
  return page(theme, [
    box({ position: 'absolute', left: 192, top: 84, width: 600, height: 374, backgroundColor: theme.green }),
    box({ position: 'absolute', left: 180, top: 72, width: 600, minHeight: 374, padding: 42, border: `4px solid ${theme.black}`, backgroundColor: theme.white, flexDirection: 'column' }, [
      display(content.title, spec, theme, { fontSize: 72, lineHeight: 0.94, marginBottom: 8 }),
      script(content.subtitle, spec, theme, { width: 510, fontSize: 28, marginBottom: 26 }),
      box({ flexDirection: 'column' }, [
        ...fields.map((field) =>
          box({ width: 510, height: 44, borderBottom: `3px solid ${theme.black}`, flexDirection: 'row', alignItems: 'center' }, [
            label(field, spec, theme, { width: 112, fontSize: 14, letterSpacing: 2.2 }),
            script('________________________', spec, theme, { width: 360, fontSize: 21, color: theme.black })
          ])
        )
      ])
    ]),
    box({ position: 'absolute', left: 672, top: 428, padding: '10px 22px', backgroundColor: theme.black, border: `3px solid ${theme.green}`, transform: 'rotate(-8deg)' }, [
      label(content.stamp, spec, theme, { color: theme.green, fontSize: 18, letterSpacing: 2 })
    ])
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const content = variantContent(spec, 'closing')
  const links = arrayValue(content.links, DEFAULTS.closing.links).slice(0, 4)
  return page(
    theme,
    [
      box({ position: 'absolute', left: 200, top: 78, width: 560, height: 384, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }, [
        label(content.label, spec, theme, { color: theme.green, marginBottom: 22 }),
        display(content.title, spec, theme, { width: 560, color: theme.bg, fontSize: 104, lineHeight: 0.86, letterSpacing: 2, textAlign: 'center' }),
        box({ width: 80, height: 5, backgroundColor: theme.green, marginTop: 28, marginBottom: 20 }),
        script(content.contact, spec, theme, { width: 620, color: theme.green, fontSize: 28, textAlign: 'center' }),
        box({ marginTop: 30, flexDirection: 'row', justifyContent: 'center' }, [
          ...links.map((link) =>
            box({ marginLeft: 14, marginRight: 14, borderBottom: `3px solid ${theme.green}`, paddingBottom: 5 }, [
              label(link, spec, theme, { color: theme.bg, fontSize: 14, letterSpacing: 3 })
            ])
          )
        ])
      ])
    ],
    { backgroundColor: theme.black }
  )
}

const RENDERERS = {
  hero: renderHero,
  split: renderSplit,
  statement: renderStatement,
  grid: renderGrid,
  visual: renderVisual,
  editorial: renderEditorial,
  numbers: renderNumbers,
  collage: renderCollage,
  rsvp: renderRsvp,
  closing: renderClosing
}

export function renderRetroZineSpread(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderHero)(spec)
}
