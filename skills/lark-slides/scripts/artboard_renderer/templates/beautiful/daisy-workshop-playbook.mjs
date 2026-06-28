import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'daisy-workshop-playbook'

const PAGE_VARIANTS = [
  'title',
  'welcome',
  'weekly',
  'timeline',
  'chart-bar',
  'cards',
  'quote',
  'team',
  'process',
  'donut'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'daisy-days',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'daisy-days',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['title', 'donut'],
      repeatable: PAGE_VARIANTS.filter((variant) => !['title', 'donut'].includes(variant))
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/daisy-days-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  title: {
    title: 'Daisy Days',
    subtitle: 'A cheerful presentation template for bright moments',
    eyebrow: 'Workshop Playbook'
  },
  welcome: {
    title: 'Welcome to Today',
    items: [
      'Review the materials on your desk',
      'Prepare your notes and supplies',
      'Take a moment to settle in comfortably',
      'Reach out if you need any assistance'
    ]
  },
  weekly: {
    title: 'A Look at the Week',
    days: [
      { day: 'Monday', tone: 'pink', items: ['Reading', 'Writing', 'Numbers', 'Science', 'Art Studio'] },
      { day: 'Tuesday', tone: 'green', items: ['Reading', 'Numbers', 'History', 'Crafts', 'Games'] },
      { day: 'Wednesday', tone: 'coral', items: ['Reading', 'Numbers', 'Science', 'Music', 'Library'] },
      { day: 'Thursday', tone: 'yellow', items: ['Reading', 'Numbers', 'Projects', 'Skills', 'Art Studio'] },
      { day: 'Friday', tone: 'lavender', items: ['Reading', 'Numbers', 'Review', 'Nature', 'Garden'] }
    ]
  },
  timeline: {
    title: "Today's Schedule",
    steps: [
      { num: '1', title: 'Morning Gathering', body: 'Welcome circle and daily intentions' },
      { num: '2', title: 'Learning Block', body: 'Core concepts and guided practice' },
      { num: '3', title: 'Creative Time', body: 'Hands-on projects and exploration' },
      { num: '4', title: 'Break', body: 'Refreshments and outdoor play' },
      { num: '5', title: 'Reflection', body: 'Share learnings and closing circle' }
    ]
  },
  'chart-bar': {
    title: 'Progress Snapshot',
    bars: [
      { label: 'Reading', value: 78, tone: 'coral' },
      { label: 'Numbers', value: 64, tone: 'mint' },
      { label: 'Science', value: 52, tone: 'sky' },
      { label: 'Arts', value: 88, tone: 'lavender' },
      { label: 'Movement', value: 72, tone: 'pink' }
    ]
  },
  cards: {
    title: 'Helpful Reminders',
    cards: [
      { icon: '1', title: 'Bring Curiosity', body: 'Arrive ready to notice, ask, and try new things.' },
      { icon: '2', title: 'Share Kindly', body: 'Use warm words and give every voice space.' },
      { icon: '3', title: 'Make Together', body: 'Build ideas with hands, sketches, and examples.' },
      { icon: '4', title: 'Celebrate Progress', body: 'Small steps count and deserve cheerful attention.' }
    ]
  },
  quote: {
    title: 'A Little Reminder',
    quote: 'Small moments of wonder can grow into a whole garden of ideas.',
    author: 'The Daisy Days Team'
  },
  team: {
    title: 'Our Team',
    people: [
      { name: 'Alex Rivera', role: 'Lead Guide', tone: 'pink' },
      { name: 'Sam Chen', role: 'Co-Teacher', tone: 'yellow' },
      { name: 'Jordan Park', role: 'Specialist', tone: 'lavender' },
      { name: 'Taylor Kim', role: 'Assistant', tone: 'mint' }
    ]
  },
  process: {
    title: 'How It Works',
    steps: [
      { num: '1', title: 'Discover', body: 'Explore new topics through guided introductions and engaging materials' },
      { num: '2', title: 'Practice', body: 'Apply concepts with hands-on activities and collaborative exercises' },
      { num: '3', title: 'Reflect', body: 'Share insights and celebrate progress with the community' }
    ]
  },
  donut: {
    title: 'Topic Distribution',
    center_label: 'Total',
    center_value: '100%',
    items: [
      { label: 'Literacy', value: '33%', tone: 'coral' },
      { label: 'Numeracy', value: '27%', tone: 'mint' },
      { label: 'Science', value: '20%', tone: 'sky' },
      { label: 'Arts', value: '13%', tone: 'yellow' },
      { label: 'Movement', value: '7%', tone: 'lavender' }
    ]
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    cream: source.background || '#F5F0E6',
    ink: source.text || '#2D2D2D',
    muted: source.muted || '#6B6B6B',
    white: source.surface || '#FFFFFF',
    turquoise: source.primary || '#7ECDC0',
    pink: source.accent || '#F7C8D4',
    yellow: source.panel || '#FDE68A',
    mint: '#A8E6CF',
    lavender: '#D4A5E8',
    peach: '#FFCBA4',
    sky: '#A8D8F0',
    coral: '#F8635F'
  }
}

function tone(theme, name) {
  return {
    pink: theme.pink,
    green: theme.mint,
    mint: theme.mint,
    coral: theme.coral,
    yellow: theme.yellow,
    lavender: theme.lavender,
    peach: theme.peach,
    sky: theme.sky,
    turquoise: theme.turquoise
  }[name] || theme.yellow
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

function content(spec, variant) {
  return DEFAULTS[variant] || DEFAULTS.title
}

function normalizeVariant(spec) {
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= PAGE_VARIANTS.length) return PAGE_VARIANTS[sourceIndex - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant) || raw.includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('title')) return 'title'
  if (raw.includes('agenda') || raw.includes('welcome')) return 'welcome'
  if (raw.includes('chart') || raw.includes('data')) return 'chart-bar'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('team') || raw.includes('detail')) return 'team'
  if (raw.includes('timeline')) return 'timeline'
  if (raw.includes('process')) return 'process'
  if (raw.includes('closing') || raw.includes('donut')) return 'donut'
  if (raw.includes('comparison') || raw.includes('card')) return 'cards'
  return 'welcome'
}

function variantPage(spec, variant) {
  return spec.page_family_source?.source_slide_index || PAGE_VARIANTS.indexOf(variant) + 1
}

function page(theme, backgroundColor, children = []) {
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor,
      color: theme.ink,
      overflow: 'hidden'
    },
    children
  )
}

function headline(value, spec, style = {}) {
  return Title(value, {
    fontSize: 46,
    lineHeight: 1.08,
    letterSpacing: 0.8,
    ...role('display', spec, { fontSize: 46, lineHeight: 1.08, fontWeight: 900, letterSpacing: 0.8 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    fontSize: 11,
    lineHeight: 1.1,
    letterSpacing: 1.2,
    ...role('label', spec, { fontSize: 11, lineHeight: 1.1, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }),
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(value, {
    fontSize: 16,
    lineHeight: 1.45,
    ...role('body', spec, { fontSize: 16, lineHeight: 1.45, fontWeight: 600 }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    fontSize: 26,
    lineHeight: 1,
    ...role('metric', spec, { fontSize: 26, lineHeight: 1, fontWeight: 900 }),
    ...style
  })
}

function shadowPanel(theme, { left, top, width, height, radius = 22, background = '#FFFFFF', children = [], style = {} }) {
  const isAbsolute = Number.isFinite(left) && Number.isFinite(top)
  return box(
    {
      position: isAbsolute ? 'absolute' : 'relative',
      ...(isAbsolute ? { left, top } : {}),
      width: width + 8,
      height: height + 8,
      flexShrink: 0
    },
    [
      box({
        position: 'absolute',
        left: 6,
        top: 6,
        width,
        height,
        borderRadius: radius,
        backgroundColor: theme.ink
      }),
      box(
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          borderRadius: radius,
          borderWidth: 3,
          borderColor: theme.ink,
          backgroundColor: background,
          overflow: 'hidden',
          ...style
        },
        children
      )
    ]
  )
}

function flower(theme, left, top, scale = 1) {
  const size = 112 * scale
  const petals = [0, 45, 90, 135, 180, 225, 270, 315].map((rotation, index) =>
    box({
      position: 'absolute',
      left: 34 * scale + Math.cos((rotation * Math.PI) / 180) * 25 * scale,
      top: 18 * scale + Math.sin((rotation * Math.PI) / 180) * 25 * scale,
      width: 42 * scale,
      height: 72 * scale,
      borderRadius: 22 * scale,
      borderWidth: 2,
      borderColor: theme.ink,
      backgroundColor: theme.white,
      opacity: index % 2 ? 0.95 : 1,
      transform: `rotate(${rotation}deg)`
    })
  )
  return box({ position: 'absolute', left, top, width: size, height: size }, [
    ...petals,
    box({
      position: 'absolute',
      left: 42 * scale,
      top: 42 * scale,
      width: 34 * scale,
      height: 34 * scale,
      borderRadius: 17 * scale,
      borderWidth: 2,
      borderColor: theme.ink,
      backgroundColor: theme.yellow
    })
  ])
}

function star(theme, left, top, color, size = 42) {
  return box({
    position: 'absolute',
    left,
    top,
    width: size,
    height: size,
    borderRadius: Math.max(8, size * 0.22),
    borderWidth: 2,
    borderColor: theme.ink,
    backgroundColor: color,
    transform: 'rotate(34deg)'
  })
}

function sun(theme, left, top, size = 118) {
  const ray = (x, y, rotate) =>
    box({
      position: 'absolute',
      left: x,
      top: y,
      width: 8,
      height: 23,
      borderRadius: 4,
      backgroundColor: theme.ink,
      transform: `rotate(${rotate}deg)`
    })
  return box({ position: 'absolute', left, top, width: size, height: size }, [
    ray(size / 2 - 4, 0, 0),
    ray(size / 2 - 4, size - 23, 0),
    ray(4, size / 2 - 12, 90),
    ray(size - 12, size / 2 - 12, 90),
    box({
      position: 'absolute',
      left: 30,
      top: 30,
      width: size - 60,
      height: size - 60,
      borderRadius: (size - 60) / 2,
      borderWidth: 3,
      borderColor: theme.ink,
      backgroundColor: theme.yellow
    })
  ])
}

function cloud(theme, left, top, scale = 1) {
  const w = 130 * scale
  const h = 82 * scale
  return box({ position: 'absolute', left, top, width: w, height: h }, [
    box({ position: 'absolute', left: 12 * scale, top: 36 * scale, width: 108 * scale, height: 38 * scale, borderRadius: 22 * scale, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.white }),
    box({ position: 'absolute', left: 24 * scale, top: 20 * scale, width: 44 * scale, height: 44 * scale, borderRadius: 22 * scale, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.white }),
    box({ position: 'absolute', left: 56 * scale, top: 8 * scale, width: 56 * scale, height: 56 * scale, borderRadius: 28 * scale, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.white })
  ])
}

function rainbow(theme, left, top, scale = 1) {
  const bands = [
    { color: theme.coral, inset: 0 },
    { color: theme.yellow, inset: 12 },
    { color: theme.mint, inset: 24 },
    { color: theme.sky, inset: 36 }
  ]
  return box({ position: 'absolute', left, top, width: 160 * scale, height: 104 * scale, overflow: 'hidden' }, bands.map((band) =>
    box({
      position: 'absolute',
      left: band.inset * scale,
      top: band.inset * scale,
      width: (160 - band.inset * 2) * scale,
      height: (150 - band.inset * 2) * scale,
      borderTopLeftRadius: (90 - band.inset) * scale,
      borderTopRightRadius: (90 - band.inset) * scale,
      borderWidth: 12 * scale,
      borderColor: theme.ink,
      backgroundColor: band.color
    })
  ))
}

function dotRail(theme, activeIndex) {
  return Array.from({ length: 10 }).map((_, index) =>
    box({
      position: 'absolute',
      right: 20,
      top: 210 + index * 13,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.ink,
      backgroundColor: index === activeIndex ? theme.yellow : theme.white
    })
  )
}

function counter(theme, spec, variant) {
  return shadowPanel(theme, {
    left: 410,
    top: 498,
    width: 140,
    height: 28,
    radius: 16,
    background: theme.white,
    style: { alignItems: 'center', justifyContent: 'center' },
    children: [
      TextBlock(`${variantPage(spec, variant)} / 10`, {
        color: theme.ink,
        fontSize: 9,
        lineHeight: 1,
        ...role('metric', spec, { fontSize: 9, lineHeight: 1, fontWeight: 900 })
      })
    ]
  })
}

function commonDecor(theme, variant, spec) {
  const index = Math.max(0, PAGE_VARIANTS.indexOf(variant))
  return [
    ...dotRail(theme, index),
    counter(theme, spec, variant)
  ]
}

function renderTitle(spec) {
  const theme = colors(spec)
  const data = content(spec, 'title')
  return page(theme, theme.cream, [
    flower(theme, -30, -28, 1.46),
    flower(theme, 824, 16, 1.18),
    flower(theme, 14, 420, 1.26),
    flower(theme, 840, 404, 1.38),
    star(theme, 72, 74, theme.pink, 62),
    star(theme, 116, 400, theme.yellow, 48),
    star(theme, 812, 92, theme.mint, 58),
    label(value(spec, 'eyebrow', data.eyebrow), spec, { position: 'absolute', left: 320, top: 188, width: 320, textAlign: 'center', color: theme.ink }),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 175, top: 222, width: 610, textAlign: 'center', fontSize: 80, lineHeight: 1.02, color: theme.ink }),
    body(value(spec, 'subtitle', data.subtitle), spec, { position: 'absolute', left: 205, top: 324, width: 550, textAlign: 'center', color: theme.muted, fontSize: 19, lineHeight: 1.25 }),
    box({ position: 'absolute', left: 420, top: 366, width: 120, height: 3, borderRadius: 2, backgroundColor: theme.ink }),
    ...commonDecor(theme, 'title', spec)
  ])
}

function renderWelcome(spec) {
  const theme = colors(spec)
  const data = content(spec, 'welcome')
  const items = array(spec, 'items', data.items)
  return page(theme, theme.cream, [
    sun(theme, 38, 34, 124),
    rainbow(theme, 742, 394, 1.08),
    star(theme, 790, 74, theme.pink, 52),
    star(theme, 58, 400, theme.lavender, 42),
    shadowPanel(theme, {
      left: 112,
      top: 126,
      width: 736,
      height: 284,
      radius: 28,
      background: theme.white,
      style: { flexDirection: 'column' },
      children: [
        box({
          width: 736,
          height: 68,
          backgroundColor: theme.mint,
          borderBottomWidth: 3,
          borderBottomColor: theme.ink,
          alignItems: 'center',
          justifyContent: 'center'
        }, [
          headline(value(spec, 'title', data.title), spec, { fontSize: 28, lineHeight: 1.1, color: theme.ink, textAlign: 'center' })
        ]),
        box({ width: 736, height: 216, padding: '28px 48px', flexDirection: 'column', gap: 17 },
          items.slice(0, 5).map((item) =>
            box({ width: 630, minHeight: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 16 }, [
              box({ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.ink, backgroundColor: theme.yellow, marginTop: 3, flexShrink: 0 }),
              body(item, spec, { width: 585, fontSize: 17, lineHeight: 1.35, color: theme.ink })
            ])
          )
        )
      ]
    }),
    ...commonDecor(theme, 'welcome', spec)
  ])
}

function renderWeekly(spec) {
  const theme = colors(spec)
  const data = content(spec, 'weekly')
  const days = objectArray(spec, 'days', data.days)
  return page(theme, theme.turquoise, [
    flower(theme, -22, -24, 1.08),
    flower(theme, 844, 386, 1.15),
    star(theme, 56, 408, theme.yellow, 58),
    star(theme, 120, 464, theme.white, 38),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 180, top: 46, width: 600, textAlign: 'center', color: theme.white, fontSize: 42, textShadow: `3px 3px 0 ${theme.ink}` }),
    ...days.slice(0, 5).map((day, index) => {
      const left = 48 + index * 174
      return shadowPanel(theme, {
        left,
        top: 138,
        width: 146,
        height: 274,
        radius: 20,
        background: theme.white,
        style: { flexDirection: 'column' },
        children: [
          box({
            width: 146,
            height: 48,
            backgroundColor: tone(theme, day.tone),
            borderBottomWidth: 3,
            borderBottomColor: theme.ink,
            alignItems: 'center',
            justifyContent: 'center'
          }, [
            label(day.day, spec, { fontSize: 13, textAlign: 'center', color: day.tone === 'coral' ? theme.white : theme.ink })
          ]),
          box({ padding: '16px 14px', flexDirection: 'column', gap: 9 },
            (day.items || []).slice(0, 6).map((item) =>
              body(`- ${item}`, spec, { width: 112, fontSize: 12.5, lineHeight: 1.22, color: theme.ink })
            )
          )
        ]
      })
    }),
    ...commonDecor(theme, 'weekly', spec)
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const data = content(spec, 'timeline')
  const steps = objectArray(spec, 'steps', data.steps)
  const stepColors = [theme.coral, theme.mint, theme.sky, theme.lavender, theme.yellow]
  return page(theme, theme.pink, [
    cloud(theme, 766, 34, 1.1),
    cloud(theme, 42, 394, 0.88),
    star(theme, 76, 90, theme.yellow, 48),
    flower(theme, 806, 414, 0.9),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 210, top: 48, width: 540, textAlign: 'center', color: theme.white, fontSize: 39, textShadow: '3px 3px 0 rgba(0,0,0,0.22)' }),
    box({ position: 'absolute', left: 184, top: 128, width: 592, height: 336, flexDirection: 'column', gap: 16 },
      steps.slice(0, 5).map((step, index) =>
        box({ width: 592, height: 54, flexDirection: 'row', alignItems: 'center', gap: 18 }, [
          box({ width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: theme.ink, backgroundColor: stepColors[index] || theme.yellow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, [
            metric(step.num || String(index + 1), spec, { color: index === 4 ? theme.ink : theme.white, fontSize: 18 })
          ]),
          shadowPanel(theme, {
            width: 500,
            height: 58,
            radius: 18,
            background: theme.white,
            style: { position: 'relative', padding: '10px 20px', flexDirection: 'column' },
            children: [
              label(step.title, spec, { color: theme.ink, fontSize: 13, lineHeight: 1.05, marginBottom: 3 }),
              body(step.body, spec, { color: theme.muted, fontSize: 11.5, lineHeight: 1.15 })
            ]
          })
        ])
      )
    ),
    ...commonDecor(theme, 'timeline', spec)
  ])
}

function renderChartBar(spec) {
  const theme = colors(spec)
  const data = content(spec, 'chart-bar')
  const bars = objectArray(spec, 'bars', data.bars)
  return page(theme, theme.yellow, [
    star(theme, 64, 48, theme.pink, 58),
    star(theme, 824, 78, theme.mint, 44),
    flower(theme, 44, 386, 0.95),
    cloud(theme, 774, 388, 0.98),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 205, top: 50, width: 550, textAlign: 'center', color: theme.ink, fontSize: 38 }),
    shadowPanel(theme, {
      left: 126,
      top: 126,
      width: 708,
      height: 308,
      radius: 28,
      background: theme.white,
      style: { padding: '34px 42px', flexDirection: 'column' },
      children: [
        box({ width: 620, height: 202, flexDirection: 'column', gap: 15 },
          bars.slice(0, 5).map((bar) => {
            const width = Math.max(80, Math.min(430, Number(bar.value || 50) * 4.7))
            return box({ width: 620, height: 26, flexDirection: 'row', alignItems: 'center', gap: 16 }, [
              label(bar.label, spec, { width: 100, fontSize: 11, color: theme.ink }),
              box({ width: 430, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.ink, backgroundColor: '#EFEFEF', overflow: 'hidden' }, [
                box({ width, height: 18, backgroundColor: tone(theme, bar.tone) })
              ]),
              metric(`${bar.value}%`, spec, { width: 52, color: theme.ink, fontSize: 16 })
            ])
          })
        ),
        box({ width: 620, height: 42, flexDirection: 'row', justifyContent: 'center', gap: 20 },
          bars.slice(0, 5).map((bar) =>
            box({ flexDirection: 'row', alignItems: 'center', gap: 7 }, [
              box({ width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: theme.ink, backgroundColor: tone(theme, bar.tone) }),
              body(bar.label, spec, { fontSize: 10.5, lineHeight: 1, color: theme.ink })
            ])
          )
        )
      ]
    }),
    ...commonDecor(theme, 'chart-bar', spec)
  ])
}

function renderCards(spec) {
  const theme = colors(spec)
  const data = content(spec, 'cards')
  const cards = objectArray(spec, 'cards', data.cards)
  const iconColors = [theme.pink, theme.mint, theme.sky, theme.lavender]
  return page(theme, theme.cream, [
    rainbow(theme, 770, 34, 0.96),
    flower(theme, -18, -18, 0.95),
    star(theme, 52, 408, theme.yellow, 52),
    sun(theme, 802, 402, 104),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 210, top: 46, width: 540, textAlign: 'center', fontSize: 38, color: theme.ink }),
    ...cards.slice(0, 4).map((card, index) => {
      const positions = [
        { left: 150, top: 126 },
        { left: 492, top: 126 },
        { left: 150, top: 262 },
        { left: 492, top: 262 }
      ]
      const position = positions[index]
      return shadowPanel(theme, {
        left: position.left,
        top: position.top,
        width: 318,
        height: 116,
        radius: 20,
        background: theme.white,
        style: { padding: '14px 22px', flexDirection: 'column' },
        children: [
          box({ width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: theme.ink, backgroundColor: iconColors[index] || theme.yellow, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }, [
            metric(card.icon || String(index + 1), spec, { color: theme.ink, fontSize: 14 })
          ]),
          label(card.title, spec, { color: theme.ink, fontSize: 11.5, lineHeight: 1.05, marginBottom: 5 }),
          body(card.body, spec, { color: theme.muted, fontSize: 10, lineHeight: 1.22, width: 250 })
        ]
      })
    }),
    ...commonDecor(theme, 'cards', spec)
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  const data = content(spec, 'quote')
  return page(theme, theme.lavender, [
    flower(theme, 48, 36, 0.98),
    flower(theme, 770, 360, 1.02),
    rainbow(theme, 780, 34, 0.84),
    star(theme, 752, 100, theme.yellow, 50),
    star(theme, 82, 390, theme.white, 44),
    shadowPanel(theme, {
      left: 158,
      top: 126,
      width: 644,
      height: 286,
      radius: 28,
      background: theme.white,
      style: { padding: '38px 54px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
      children: [
        TextBlock('“', { color: theme.pink, fontSize: 66, lineHeight: 0.8, ...role('display', spec, { fontSize: 66, lineHeight: 0.8, fontWeight: 900 }) }),
        headline(value(spec, 'quote', data.quote), spec, { width: 520, fontSize: 28, lineHeight: 1.22, textAlign: 'center', color: theme.ink, marginTop: 4, marginBottom: 22 }),
        body(value(spec, 'author', data.author), spec, { color: theme.muted, fontSize: 15, lineHeight: 1, textAlign: 'center', fontWeight: 800 })
      ]
    }),
    ...commonDecor(theme, 'quote', spec)
  ])
}

function renderTeam(spec) {
  const theme = colors(spec)
  const data = content(spec, 'team')
  const people = objectArray(spec, 'people', data.people)
  return page(theme, theme.mint, [
    flower(theme, -12, -14, 1.02),
    flower(theme, 828, 0, 0.95),
    star(theme, 64, 414, theme.yellow, 50),
    star(theme, 818, 430, theme.white, 42),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 210, top: 50, width: 540, textAlign: 'center', color: theme.white, fontSize: 40, textShadow: '3px 3px 0 rgba(0,0,0,0.18)' }),
    box({ position: 'absolute', left: 90, top: 168, width: 780, height: 220, flexDirection: 'row', justifyContent: 'space-between' },
      people.slice(0, 4).map((person, index) =>
        box({ width: 174, height: 220, alignItems: 'center', flexDirection: 'column', gap: 12 }, [
          shadowPanel(theme, {
            width: 108,
            height: 108,
            radius: 54,
            background: theme.white,
            style: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
            children: [
              box({ width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: theme.ink, backgroundColor: tone(theme, person.tone), marginTop: 2 })
            ]
          }),
          label(person.name, spec, { width: 168, textAlign: 'center', fontSize: 14, color: theme.ink, lineHeight: 1.15 }),
          body(person.role, spec, { width: 150, textAlign: 'center', fontSize: 12, lineHeight: 1.2, color: theme.muted })
        ])
      )
    ),
    ...commonDecor(theme, 'team', spec)
  ])
}

function renderProcess(spec) {
  const theme = colors(spec)
  const data = content(spec, 'process')
  const steps = objectArray(spec, 'steps', data.steps)
  const stepColors = [theme.coral, theme.turquoise, theme.lavender]
  return page(theme, theme.peach, [
    cloud(theme, 48, 38, 1),
    cloud(theme, 774, 54, 0.86),
    star(theme, 78, 420, theme.yellow, 52),
    flower(theme, 802, 386, 1.02),
    headline(value(spec, 'title', data.title), spec, { position: 'absolute', left: 220, top: 54, width: 520, textAlign: 'center', color: theme.ink, fontSize: 40 }),
    box({ position: 'absolute', left: 96, top: 170, width: 768, height: 220, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 16 },
      steps.slice(0, 3).flatMap((step, index) => {
        const stepNode = box({ width: 210, height: 220, alignItems: 'center', flexDirection: 'column', gap: 14 }, [
          box({ width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: theme.ink, backgroundColor: stepColors[index] || theme.yellow, alignItems: 'center', justifyContent: 'center' }, [
            metric(step.num || String(index + 1), spec, { color: index === 0 ? theme.white : theme.ink, fontSize: 30 })
          ]),
          label(step.title, spec, { width: 180, textAlign: 'center', color: theme.ink, fontSize: 15, lineHeight: 1.05 }),
          body(step.body, spec, { width: 190, textAlign: 'center', color: theme.muted, fontSize: 12.5, lineHeight: 1.28 })
        ])
        if (index >= 2) return [stepNode]
        return [
          stepNode,
          TextBlock('→', { fontSize: 38, color: theme.ink, marginTop: 28, lineHeight: 1, ...role('display', spec, { fontSize: 38, lineHeight: 1, fontWeight: 900 }) })
        ]
      })
    ),
    ...commonDecor(theme, 'process', spec)
  ])
}

function renderDonut(spec) {
  const theme = colors(spec)
  const data = content(spec, 'donut')
  const items = objectArray(spec, 'items', data.items)
  const ringColors = [theme.coral, theme.mint, theme.sky, theme.yellow, theme.lavender]
  return page(theme, theme.sky, [
    flower(theme, -12, -12, 1.06),
    flower(theme, 820, 380, 1.15),
    star(theme, 812, 74, theme.yellow, 52),
    star(theme, 70, 406, theme.white, 42),
    box({ position: 'absolute', left: 132, top: 136, width: 290, height: 290 }, [
      box({ position: 'absolute', left: 0, top: 0, width: 280, height: 280, borderRadius: 140, borderWidth: 3, borderColor: theme.ink, backgroundColor: '#EFEFEF' }),
      ...ringColors.map((color, index) =>
        box({
          position: 'absolute',
          left: 22 + index * 12,
          top: 22 + index * 12,
          width: 236 - index * 24,
          height: 236 - index * 24,
          borderRadius: 118 - index * 12,
          borderWidth: 14,
          borderColor: color,
          backgroundColor: 'transparent'
        })
      ),
      box({ position: 'absolute', left: 78, top: 78, width: 124, height: 124, borderRadius: 62, borderWidth: 3, borderColor: theme.ink, backgroundColor: theme.white, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
        label(value(spec, 'center_label', data.center_label), spec, { color: theme.ink, fontSize: 12, textAlign: 'center' }),
        metric(value(spec, 'center_value', data.center_value), spec, { color: theme.ink, fontSize: 27, textAlign: 'center', marginTop: 4 })
      ])
    ]),
    box({ position: 'absolute', left: 484, top: 138, width: 350, height: 280, flexDirection: 'column', gap: 13 }, [
      headline(value(spec, 'title', data.title), spec, { width: 340, fontSize: 32, lineHeight: 1.1, color: theme.ink, marginBottom: 8 }),
      ...items.slice(0, 5).map((item, index) =>
        box({ flexDirection: 'row', alignItems: 'center', gap: 13, height: 28 }, [
          box({ width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: theme.ink, backgroundColor: ringColors[index] || theme.yellow, flexShrink: 0 }),
          body(`${item.label} - ${item.value}`, spec, { width: 260, fontSize: 15, lineHeight: 1.2, color: theme.ink })
        ])
      )
    ]),
    ...commonDecor(theme, 'donut', spec)
  ])
}

const RENDERERS = {
  title: renderTitle,
  welcome: renderWelcome,
  weekly: renderWeekly,
  timeline: renderTimeline,
  'chart-bar': renderChartBar,
  cards: renderCards,
  quote: renderQuote,
  team: renderTeam,
  process: renderProcess,
  donut: renderDonut
}

export function renderDaisyWorkshopPlaybook(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderWelcome)(spec)
}
