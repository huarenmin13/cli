import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'pixel-orbit-console'

const PAGE_VARIANTS = [
  'slide-1',
  'slide-2',
  'slide-3',
  'slide-4',
  'slide-5',
  'slide-6',
  'slide-7',
  'slide-8',
  'slide-9',
  'slide-10'
]

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: '8-bit-orbit',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: '8-bit-orbit',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['slide-1', 'slide-10'],
      repeatable: ['slide-2', 'slide-3', 'slide-4', 'slide-5', 'slide-6', 'slide-7', 'slide-8', 'slide-9']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/8-bit-orbit-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULTS = {
  'slide-1': {
    eyebrow: 'Pixel Perfect Presentation System',
    title: '8-BIT ORBIT',
    subtitle: 'A retro-futuristic deck engine for bold storytellers. Built for arcades, engineered for boardrooms.',
    chips: ['10 Slides', 'CSS Native', 'Zero Dependencies']
  },
  'slide-2': {
    eyebrow: 'Mission Brief',
    title: 'Rewiring How We Share Ideas',
    body:
      'Every presentation is an opportunity to transport your audience. This template fuses tactile 16-bit nostalgia with modern typographic discipline.',
    body2:
      'No canvas limits. No cookie-cutter layouts. Just pure CSS architecture delivering cinematic transitions and atmospheric depth.'
  },
  'slide-3': {
    eyebrow: 'Core Systems',
    title: 'Four Engines Running',
    items: [
      { title: 'Modular Blocks', body: 'Swap components without breaking the grid. Every element is containerized by default.' },
      { title: 'Crisp Vectors', body: 'All visual effects are native CSS. No image assets are required for borders or shadows.' },
      { title: 'Live Data', body: 'Chart slides accept dynamic values and animated transitions.' },
      { title: 'Retro Atmosphere', body: 'Scanlines, CRT vignettes, starfields, and noise create an immersive environment.' }
    ]
  },
  'slide-4': {
    eyebrow: 'Analytics Core',
    title: 'Quarterly Growth Metrics',
    subtitle: 'Fiscal performance across four sectors - normalized index',
    metrics: [
      { label: 'Alpha', value: 78 },
      { label: 'Beta', value: 92 },
      { label: 'Gamma', value: 64 },
      { label: 'Delta', value: 85 },
      { label: 'Epsilon', value: 56 }
    ]
  },
  'slide-5': {
    eyebrow: 'System Load',
    title: 'Resource Allocation',
    subtitle: 'Percentage distribution across operational units',
    metrics: [
      { label: 'Compute', value: 88 },
      { label: 'Storage', value: 72 },
      { label: 'Network', value: 95 },
      { label: 'Memory', value: 61 },
      { label: 'Graphics', value: 44 }
    ]
  },
  'slide-6': {
    eyebrow: 'Chronology',
    title: 'Development Roadmap',
    timeline: [
      { date: 'Q1 2026', title: 'Concept & Architecture', body: 'Wireframes, palette selection, and core grid system established.' },
      { date: 'Q2 2026', title: 'Asset Generation', body: 'Pixel components, iconography, and atmospheric effects coded.' },
      { date: 'Q3 2026', title: 'Data Integration', body: 'Charting engine, animated counters, and dynamic state binding.' },
      { date: 'Q4 2026', title: 'Global Launch', body: 'Public release with documentation and community support.' }
    ]
  },
  'slide-7': {
    eyebrow: 'Live Telemetry',
    title: 'Platform Vitals',
    subtitle: 'Real-time aggregate figures from active deployments',
    metrics: [
      { value: '847', label: 'Active Worlds' },
      { value: '12.4M', label: 'Pixels Rendered' },
      { value: '99.9%', label: 'Uptime Score' },
      { value: '2048', label: 'Max Resolution' }
    ]
  },
  'slide-8': {
    quote:
      'The best presentations do not merely inform. They immerse. They transform the conference room into an arcade cabinet where every slide is a new level waiting to be unlocked.',
    author: 'Lead Creative Technologist, Studio Orbital'
  },
  'slide-9': {
    eyebrow: 'Access Tiers',
    title: 'Choose Your Loadout',
    tiers: [
      { name: 'Rookie', price: '$0', desc: 'For solo explorers testing the waters.', features: ['5 slide maximum', 'Standard grid themes', 'Community support', 'Static export only'] },
      { name: 'Arcade', price: '$29', desc: 'Serious builders need serious tooling.', features: ['Unlimited slides', 'All atmospheric packs', 'Live data binding', 'Priority rendering'] },
      { name: 'Boss', price: '$79', desc: 'Enterprise-grade control and compliance.', features: ['Everything in Arcade', 'White-label export', 'SSO & audit logs', 'Dedicated pipeline'] }
    ]
  },
  'slide-10': {
    title: 'Ready Player One?',
    subtitle: 'Deploy your first 8-BIT ORBIT deck in under sixty seconds. No dependencies. No friction. Just pure presentation power.',
    ctas: ['Initialize Deck', 'View Documentation']
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    void: source.background || '#0A0E27',
    navy: source.panel || '#0F1B3D',
    cyan: source.primary || '#5EDCF4',
    pink: source.accent || '#F0A6CA',
    yellow: source.yellow || '#F4D03F',
    lavender: source.muted || '#E2D5F2',
    grid: source.grid || '#1B2B55',
    white: source.text || '#FFFFFF'
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

function objectItems(spec, key, fallback = []) {
  return array(spec, key, fallback).filter((item) => item && typeof item === 'object')
}

function upper(input) {
  return String(input || '').toUpperCase()
}

function normalizeVariant(spec) {
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase()
  const sourceIndex = Number(spec.page_family_source?.source_slide_index || 0)
  if (sourceIndex >= 1 && sourceIndex <= 10) return `slide-${sourceIndex}`
  for (const variant of PAGE_VARIANTS) {
    if (raw.split(/\s+/).includes(variant)) return variant
  }
  if (raw.includes('cover') || raw.includes('hero')) return 'slide-1'
  if (raw.includes('agenda') || raw.includes('intro')) return 'slide-2'
  if (raw.includes('timeline') || raw.includes('process')) return 'slide-6'
  if (raw.includes('quote')) return 'slide-8'
  if (raw.includes('closing') || raw.includes('cta')) return 'slide-10'
  if (raw.includes('chart') || raw.includes('data')) return 'slide-4'
  return 'slide-1'
}

function variantIndex(variant) {
  return Math.max(1, PAGE_VARIANTS.indexOf(variant) + 1)
}

function backgroundKind(variant) {
  if (['slide-1', 'slide-4', 'slide-7', 'slide-10'].includes(variant)) return 'dark'
  if (['slide-2', 'slide-6'].includes(variant)) return 'pink'
  if (['slide-3', 'slide-8'].includes(variant)) return 'cyan'
  return 'lavender'
}

function grid(theme, kind = 'dark') {
  const color = kind === 'dark' ? theme.cyan : theme.navy
  const opacity = kind === 'dark' ? 0.18 : 0.12
  const vertical = Array.from({ length: 25 }).map((_, index) =>
    box({ position: 'absolute', left: index * 40, top: 0, width: 1, height: 540, backgroundColor: color, opacity })
  )
  const horizontal = Array.from({ length: 15 }).map((_, index) =>
    box({ position: 'absolute', left: 0, top: index * 40, width: 960, height: 1, backgroundColor: color, opacity })
  )
  return [...vertical, ...horizontal]
}

function scanlines(theme, kind = 'dark') {
  const color = kind === 'dark' ? theme.white : theme.navy
  return Array.from({ length: 46 }).map((_, index) =>
    box({ position: 'absolute', left: 0, top: index * 12 + 4, width: 960, height: 1, backgroundColor: color, opacity: kind === 'dark' ? 0.035 : 0.045 })
  )
}

function stars(theme) {
  const points = [
    [45, 54, 5, theme.yellow],
    [142, 95, 3, theme.pink],
    [245, 28, 3, theme.yellow],
    [402, 16, 3, theme.pink],
    [474, 58, 4, theme.yellow],
    [641, 75, 3, theme.cyan],
    [736, 24, 3, theme.yellow],
    [884, 86, 5, theme.yellow],
    [192, 242, 3, theme.cyan],
    [342, 122, 3, theme.yellow],
    [502, 318, 4, theme.pink],
    [676, 260, 3, theme.cyan],
    [758, 120, 3, theme.pink],
    [916, 162, 4, theme.cyan],
    [60, 397, 3, theme.pink],
    [214, 486, 4, theme.pink],
    [398, 446, 5, theme.yellow],
    [552, 356, 4, theme.yellow],
    [678, 508, 4, theme.cyan],
    [816, 442, 3, theme.yellow],
    [928, 372, 3, theme.cyan]
  ]
  return points.map(([left, top, size, color]) =>
    box({ position: 'absolute', left, top, width: size, height: size, backgroundColor: color, opacity: 0.82 })
  )
}

function particleLayer(theme) {
  const points = [
    [82, 120, theme.cyan],
    [182, 430, theme.pink],
    [774, 136, theme.yellow],
    [838, 340, theme.cyan],
    [310, 84, theme.pink],
    [652, 468, theme.yellow]
  ]
  return points.map(([left, top, color]) => box({ position: 'absolute', left, top, width: 8, height: 8, backgroundColor: color, opacity: 0.7 }))
}

function frame(spec, variant, children = [], opts = {}) {
  const theme = colors(spec)
  const kind = opts.kind || backgroundKind(variant)
  const background =
    opts.background ||
    (kind === 'dark' ? theme.void : kind === 'pink' ? theme.pink : kind === 'cyan' ? theme.cyan : theme.lavender)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: background,
      color: kind === 'dark' ? theme.white : theme.navy,
      overflow: 'hidden'
    },
    [
      ...grid(theme, kind),
      ...scanlines(theme, kind),
      ...(kind === 'dark' ? stars(theme) : []),
      ...(opts.particles ? particleLayer(theme) : []),
      ...children,
      nav(spec, variant, kind)
    ]
  )
}

function nav(spec, variant, kind) {
  const theme = colors(spec)
  const page = spec.page_family_source?.source_slide_index || variantIndex(variant)
  const color = kind === 'dark' ? theme.cyan : theme.navy
  return box({ position: 'absolute', right: 24, top: 198, flexDirection: 'column', gap: 8 }, [
    ...PAGE_VARIANTS.map((_, index) =>
      box({
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: index + 1 === page ? color : 'transparent',
        opacity: index + 1 === page ? 1 : 0.42
      })
    ),
    TextBlock(`${String(page).padStart(2, '0')} / 10`, {
      position: 'absolute',
      right: -1,
      top: 108,
      width: 78,
      color,
      fontSize: 8,
      textAlign: 'right',
      letterSpacing: 1,
      ...role('metric', spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
    })
  ])
}

function label(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(upper(text), {
    height: 24,
    padding: '6px 14px',
    backgroundColor: theme.navy,
    color: theme.yellow,
    fontSize: 10,
    lineHeight: 1,
    letterSpacing: 2,
    ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 }),
    ...style
  })
}

function body(text, spec, style = {}) {
  const theme = colors(spec)
  return TextBlock(text, {
    color: style.color || 'rgba(15,27,61,0.76)',
    fontSize: 15,
    lineHeight: 1.58,
    ...role('body', spec, { fontSize: 15, lineHeight: 1.58, fontWeight: 400 }),
    ...style
  })
}

function headline(text, spec, style = {}) {
  const theme = colors(spec)
  return Title(text, {
    color: theme.navy,
    fontSize: 38,
    lineHeight: 1.05,
    ...role('display', spec, { fontSize: 38, lineHeight: 1.05, fontWeight: 800 }),
    ...style
  })
}

function pixelShadowText(text, spec, style = {}) {
  const theme = colors(spec)
  const base = { fontSize: 64, lineHeight: 0.9, fontWeight: 900, textAlign: 'center', ...style }
  return [
    Title(upper(text), { ...base, left: base.left + 8, top: base.top + 8, color: theme.navy, ...role('display', spec, base) }),
    Title(upper(text), { ...base, left: base.left + 4, top: base.top + 4, color: theme.yellow, ...role('display', spec, base) }),
    Title(upper(text), { ...base, color: theme.cyan, ...role('display', spec, base) })
  ]
}

function bracket(theme, left, top, width, height, color = theme.cyan) {
  return [
    box({ position: 'absolute', left, top, width: 26, height: 4, backgroundColor: color }),
    box({ position: 'absolute', left, top, width: 4, height: 26, backgroundColor: color }),
    box({ position: 'absolute', left: left + width - 26, top: top + height - 4, width: 26, height: 4, backgroundColor: color }),
    box({ position: 'absolute', left: left + width - 4, top: top + height - 26, width: 4, height: 26, backgroundColor: color })
  ]
}

function pixelButton(text, spec, style = {}) {
  const theme = colors(spec)
  const pink = style.variant === 'pink'
  return box({ position: 'relative', width: style.width || 170, height: 42 }, [
    box({ position: 'absolute', left: 8, top: 8, width: style.width || 170, height: 42, backgroundColor: pink ? theme.cyan : theme.yellow }),
    box({ position: 'absolute', left: 4, top: 4, width: style.width || 170, height: 42, backgroundColor: theme.navy }),
    TextBlock(upper(text), {
      position: 'absolute',
      left: 0,
      top: 0,
      width: style.width || 170,
      height: 42,
      backgroundColor: pink ? theme.pink : theme.cyan,
      color: theme.navy,
      padding: '13px 12px',
      textAlign: 'center',
      fontSize: 11,
      letterSpacing: 1,
      ...role('label', spec, { fontSize: 11, lineHeight: 1, fontWeight: 900 })
    })
  ])
}

function splitTitle(value) {
  const words = upper(value).split(/\s+/).filter(Boolean)
  if (words.length <= 2) return words.join('\n')
  const pivot = Math.ceil(words.length / 2)
  return `${words.slice(0, pivot).join(' ')}\n${words.slice(pivot).join(' ')}`
}

function renderCover(spec) {
  const theme = colors(spec)
  const chips = array(spec, 'chips', DEFAULTS['slide-1'].chips).slice(0, 3)
  return frame(
    spec,
    'slide-1',
    [
      ...particleLayer(theme),
      TextBlock(upper(value(spec, 'eyebrow', DEFAULTS['slide-1'].eyebrow)), {
        position: 'absolute',
        left: 210,
        top: 120,
        width: 540,
        color: theme.pink,
        fontSize: 10,
        textAlign: 'center',
        letterSpacing: 4,
        ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 700 })
      }),
      ...pixelShadowText(splitTitle(value(spec, 'title', DEFAULTS['slide-1'].title)), spec, {
        position: 'absolute',
        left: 310,
        top: 164,
        width: 340,
        fontSize: 66,
        lineHeight: 0.92
      }),
      TextBlock(value(spec, 'subtitle', DEFAULTS['slide-1'].subtitle), {
        position: 'absolute',
        left: 300,
        top: 334,
        width: 360,
        color: theme.lavender,
        fontSize: 15,
        lineHeight: 1.56,
        textAlign: 'center',
        ...role('body', spec, { fontSize: 15, lineHeight: 1.56, fontWeight: 500 })
      }),
      box(
        { position: 'absolute', left: 318, top: 410, flexDirection: 'row', gap: 10 },
        chips.map((chip) =>
          TextBlock(upper(chip), {
            minWidth: 86,
            height: 22,
            borderWidth: 2,
            borderColor: theme.yellow,
            padding: '5px 9px',
            color: theme.yellow,
            fontSize: 8,
            lineHeight: 1,
            textAlign: 'center',
            ...role('label', spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
          })
        )
      )
    ],
    { particles: true }
  )
}

function renderSplitIntro(spec) {
  const theme = colors(spec)
  return frame(spec, 'slide-2', [
    box({ position: 'absolute', left: 86, top: 118, width: 302, height: 302, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 3, borderColor: theme.navy }),
    box({ position: 'absolute', left: 122, top: 154, width: 230, height: 230, backgroundColor: theme.lavender, borderWidth: 4, borderColor: theme.navy }),
    box({ position: 'absolute', left: 170, top: 188, width: 44, height: 44, backgroundColor: theme.navy }),
    box({ position: 'absolute', left: 260, top: 188, width: 44, height: 44, backgroundColor: theme.navy }),
    box({ position: 'absolute', left: 196, top: 286, width: 82, height: 14, backgroundColor: theme.navy }),
    ...bracket(theme, 74, 106, 326, 326, theme.yellow),
    label(value(spec, 'eyebrow', DEFAULTS['slide-2'].eyebrow), spec, { position: 'absolute', left: 500, top: 132 }),
    headline(value(spec, 'title', DEFAULTS['slide-2'].title), spec, { position: 'absolute', left: 500, top: 178, width: 340, fontSize: 34 }),
    body(value(spec, 'body', DEFAULTS['slide-2'].body), spec, { position: 'absolute', left: 500, top: 264, width: 342, fontSize: 14, lineHeight: 1.42 }),
    body(value(spec, 'body2', DEFAULTS['slide-2'].body2), spec, { position: 'absolute', left: 500, top: 372, width: 342, fontSize: 14, lineHeight: 1.42 })
  ])
}

function icon(kind, theme) {
  if (kind === 'diamond') return box({ width: 34, height: 34, backgroundColor: theme.pink, transform: 'rotate(45deg)' })
  if (kind === 'cross') {
    return box({ position: 'relative', width: 42, height: 42 }, [
      box({ position: 'absolute', left: 15, top: 0, width: 12, height: 42, backgroundColor: theme.yellow }),
      box({ position: 'absolute', left: 0, top: 15, width: 42, height: 12, backgroundColor: theme.yellow })
    ])
  }
  if (kind === 'circle') return box({ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.cyan, borderWidth: 4, borderColor: theme.navy })
  return box({ width: 40, height: 40, backgroundColor: theme.cyan, borderWidth: 4, borderColor: theme.navy })
}

function renderFeatureGrid(spec) {
  const theme = colors(spec)
  const items = objectItems(spec, 'items', DEFAULTS['slide-3'].items).slice(0, 4)
  return frame(spec, 'slide-3', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-3'].eyebrow), spec, { position: 'absolute', left: 384, top: 56, color: theme.cyan }),
    headline(value(spec, 'title', DEFAULTS['slide-3'].title), spec, { position: 'absolute', left: 250, top: 100, width: 460, textAlign: 'center' }),
    box(
      { position: 'absolute', left: 92, top: 182, width: 776, flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
      items.map((item, index) =>
        box(
          {
            position: 'relative',
            width: 376,
            height: 126,
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderWidth: 2,
            borderColor: 'rgba(15,27,61,0.28)',
            padding: '24px 22px',
            flexDirection: 'row',
            gap: 18
          },
          [
            box({ width: 58, height: 78, alignItems: 'center', justifyContent: 'center' }, [icon(['cube', 'diamond', 'cross', 'circle'][index], theme)]),
            box({ flexDirection: 'column', width: 250 }, [
              TextBlock(item.title || `Module ${index + 1}`, {
                color: theme.navy,
                fontSize: 20,
                lineHeight: 1.1,
                marginBottom: 8,
                ...role('display', spec, { fontSize: 20, lineHeight: 1.1, fontWeight: 800 })
              }),
              body(item.body || '', spec, { width: 250, fontSize: 12.5, lineHeight: 1.35 })
            ]),
            ...bracket(theme, 8, 8, 360, 110, index % 2 ? theme.pink : theme.navy)
          ]
        )
      )
    )
  ])
}

function asMetricList(spec, key, fallback) {
  return objectItems(spec, key, fallback).map((item, index) => ({
    label: item.label || item.name || `Item ${index + 1}`,
    value: Number.parseFloat(String(item.value || item.amount || item.score || 0)) || 0,
    raw: String(item.value || item.amount || item.score || '')
  }))
}

function renderVerticalChart(spec) {
  const theme = colors(spec)
  const metrics = asMetricList(spec, 'metrics', DEFAULTS['slide-4'].metrics).slice(0, 5)
  return frame(spec, 'slide-4', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-4'].eyebrow), spec, { position: 'absolute', left: 84, top: 84 }),
    Title(value(spec, 'title', DEFAULTS['slide-4'].title), {
      position: 'absolute',
      left: 84,
      top: 126,
      width: 360,
      color: theme.cyan,
      fontSize: 42,
      lineHeight: 1.05,
      ...role('display', spec, { fontSize: 42, lineHeight: 1.05, fontWeight: 900 })
    }),
    TextBlock(value(spec, 'subtitle', DEFAULTS['slide-4'].subtitle), {
      position: 'absolute',
      left: 84,
      top: 254,
      width: 330,
      color: 'rgba(255,255,255,0.56)',
      fontSize: 13,
      lineHeight: 1.45,
      ...role('body', spec, { fontSize: 13, lineHeight: 1.45, fontWeight: 400 })
    }),
    box(
      { position: 'absolute', left: 470, top: 96, width: 370, height: 330, flexDirection: 'row', alignItems: 'flex-end', gap: 22 },
      metrics.map((item, index) => {
        const height = Math.max(70, Math.min(245, item.value * 2.5))
        const color = [theme.cyan, theme.pink, theme.yellow][index % 3]
        return box({ width: 54, height: 300, flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }, [
          TextBlock(String(item.raw || item.value), {
            width: 54,
            height: 18,
            color,
            fontSize: 11,
            textAlign: 'center',
            ...role('metric', spec, { fontSize: 11, lineHeight: 1, fontWeight: 800 })
          }),
          box({ width: 44, height, backgroundColor: color, borderWidth: 3, borderColor: theme.navy, marginTop: 6 }),
          TextBlock(upper(item.label), {
            width: 74,
            color: theme.lavender,
            fontSize: 8,
            textAlign: 'center',
            marginTop: 10,
            letterSpacing: 1,
            ...role('label', spec, { fontSize: 8, lineHeight: 1.1, fontWeight: 700 })
          })
        ])
      })
    )
  ])
}

function renderHorizontalChart(spec) {
  const theme = colors(spec)
  const metrics = asMetricList(spec, 'metrics', DEFAULTS['slide-5'].metrics).slice(0, 5)
  return frame(spec, 'slide-5', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-5'].eyebrow), spec, { position: 'absolute', left: 370, top: 58, color: theme.yellow }),
    headline(value(spec, 'title', DEFAULTS['slide-5'].title), spec, { position: 'absolute', left: 210, top: 102, width: 540, textAlign: 'center' }),
    body(value(spec, 'subtitle', DEFAULTS['slide-5'].subtitle), spec, { position: 'absolute', left: 258, top: 158, width: 444, textAlign: 'center', color: 'rgba(15,27,61,0.62)' }),
    box(
      { position: 'absolute', left: 140, top: 226, width: 680, flexDirection: 'column', gap: 18 },
      metrics.map((item, index) => {
        const width = Math.max(130, Math.min(454, item.value * 4.8))
        const color = [theme.navy, theme.pink, theme.yellow][index % 3]
        return box({ width: 680, height: 34, flexDirection: 'row', alignItems: 'center', gap: 16 }, [
          TextBlock(upper(item.label), {
            width: 94,
            color: theme.navy,
            fontSize: 10,
            letterSpacing: 1,
            ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 800 })
          }),
          box({ width: 470, height: 26, backgroundColor: 'rgba(15,27,61,0.12)' }, [
            box({ width, height: 26, backgroundColor: color })
          ]),
          TextBlock(`${item.raw || item.value}%`, {
            width: 55,
            color: theme.navy,
            fontSize: 12,
            textAlign: 'right',
            ...role('metric', spec, { fontSize: 12, lineHeight: 1, fontWeight: 900 })
          })
        ])
      })
    )
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const items = objectItems(spec, 'timeline', DEFAULTS['slide-6'].timeline).slice(0, 4)
  return frame(spec, 'slide-6', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-6'].eyebrow), spec, { position: 'absolute', left: 394, top: 52 }),
    headline(value(spec, 'title', DEFAULTS['slide-6'].title), spec, { position: 'absolute', left: 220, top: 96, width: 520, textAlign: 'center' }),
    box({ position: 'absolute', left: 478, top: 176, width: 4, height: 294, backgroundColor: theme.navy, opacity: 0.76 }),
    ...items.flatMap((item, index) => {
      const top = 172 + index * 76
      const left = index % 2 === 0 ? 112 : 542
      return [
        box({ position: 'absolute', left: 466, top: top + 20, width: 28, height: 28, backgroundColor: index < 2 ? theme.yellow : theme.cyan, borderWidth: 4, borderColor: theme.navy }),
        box({ position: 'absolute', left, top, width: 318, height: 64, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: theme.navy, padding: '10px 14px', flexDirection: 'column' }, [
          TextBlock(upper(item.date || `Q${index + 1}`), {
            color: theme.navy,
            fontSize: 9,
            letterSpacing: 1,
            marginBottom: 5,
            ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 800 })
          }),
          TextBlock(item.title || `Step ${index + 1}`, {
            color: theme.navy,
            fontSize: 14,
            lineHeight: 1.1,
            marginBottom: 4,
            ...role('display', spec, { fontSize: 14, lineHeight: 1.1, fontWeight: 800 })
          }),
          body(item.body || '', spec, { width: 286, fontSize: 10, lineHeight: 1.22 })
        ])
      ]
    })
  ])
}

function renderStats(spec) {
  const theme = colors(spec)
  const metrics = objectItems(spec, 'metrics', DEFAULTS['slide-7'].metrics).slice(0, 4)
  return frame(spec, 'slide-7', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-7'].eyebrow), spec, { position: 'absolute', left: 388, top: 66 }),
    Title(value(spec, 'title', DEFAULTS['slide-7'].title), {
      position: 'absolute',
      left: 220,
      top: 112,
      width: 520,
      color: theme.cyan,
      textAlign: 'center',
      fontSize: 42,
      lineHeight: 1,
      ...role('display', spec, { fontSize: 42, lineHeight: 1, fontWeight: 900 })
    }),
    TextBlock(value(spec, 'subtitle', DEFAULTS['slide-7'].subtitle), {
      position: 'absolute',
      left: 250,
      top: 166,
      width: 460,
      color: 'rgba(255,255,255,0.56)',
      textAlign: 'center',
      fontSize: 13,
      ...role('body', spec, { fontSize: 13, lineHeight: 1.3, fontWeight: 400 })
    }),
    box(
      { position: 'absolute', left: 110, top: 242, width: 740, flexDirection: 'row', gap: 22 },
      metrics.map((item, index) =>
        box({ position: 'relative', width: 168, height: 132, backgroundColor: 'rgba(94,220,244,0.09)', borderWidth: 2, borderColor: 'rgba(94,220,244,0.32)', padding: '26px 12px', alignItems: 'center', flexDirection: 'column' }, [
          ...bracket(theme, 8, 8, 152, 116, [theme.cyan, theme.pink, theme.yellow, theme.cyan][index]),
          TextBlock(String(item.value || ''), {
            width: 140,
            color: [theme.cyan, theme.pink, theme.yellow, theme.cyan][index],
            fontSize: 38,
            lineHeight: 1,
            textAlign: 'center',
            ...role('metric', spec, { fontSize: 38, lineHeight: 1, fontWeight: 900 })
          }),
          TextBlock(upper(item.label || ''), {
            width: 136,
            color: theme.lavender,
            fontSize: 9,
            letterSpacing: 1,
            textAlign: 'center',
            marginTop: 12,
            ...role('label', spec, { fontSize: 9, lineHeight: 1.1, fontWeight: 700 })
          })
        ])
      )
    )
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return frame(spec, 'slide-8', [
    box({ position: 'absolute', left: 122, top: 98, width: 716, height: 338, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 3, borderColor: theme.navy }),
    ...bracket(theme, 106, 82, 748, 370, theme.navy),
    TextBlock('"', {
      position: 'absolute',
      left: 164,
      top: 116,
      width: 80,
      color: theme.pink,
      fontSize: 88,
      lineHeight: 1,
      ...role('display', spec, { fontSize: 88, lineHeight: 1, fontWeight: 900 })
    }),
    TextBlock(value(spec, 'quote', DEFAULTS['slide-8'].quote), {
      position: 'absolute',
      left: 222,
      top: 154,
      width: 540,
      color: theme.navy,
      fontSize: 24,
      lineHeight: 1.48,
      textAlign: 'center',
      ...role('body', spec, { fontSize: 24, lineHeight: 1.48, fontWeight: 500 })
    }),
    box({ position: 'absolute', left: 350, top: 346, width: 260, height: 4, backgroundColor: theme.pink }),
    TextBlock(value(spec, 'author', DEFAULTS['slide-8'].author), {
      position: 'absolute',
      left: 246,
      top: 374,
      width: 468,
      color: theme.navy,
      fontSize: 11,
      textAlign: 'center',
      letterSpacing: 2,
      ...role('label', spec, { fontSize: 11, lineHeight: 1, fontWeight: 800 })
    })
  ])
}

function renderTiers(spec) {
  const theme = colors(spec)
  const tiers = objectItems(spec, 'tiers', DEFAULTS['slide-9'].tiers).slice(0, 3)
  return frame(spec, 'slide-9', [
    label(value(spec, 'eyebrow', DEFAULTS['slide-9'].eyebrow), spec, { position: 'absolute', left: 394, top: 48, color: theme.pink }),
    headline(value(spec, 'title', DEFAULTS['slide-9'].title), spec, { position: 'absolute', left: 240, top: 92, width: 480, textAlign: 'center' }),
    box(
      { position: 'absolute', left: 86, top: 164, width: 788, flexDirection: 'row', gap: 22 },
      tiers.map((tier, index) =>
        box({ width: 248, height: index === 1 ? 302 : 278, backgroundColor: index === 1 ? theme.navy : 'rgba(255,255,255,0.18)', borderWidth: 3, borderColor: theme.navy, padding: '24px 18px', flexDirection: 'column' }, [
          TextBlock(upper(tier.name || `Tier ${index + 1}`), {
            color: index === 1 ? theme.yellow : theme.navy,
            fontSize: 14,
            letterSpacing: 2,
            marginBottom: 12,
            ...role('label', spec, { fontSize: 14, lineHeight: 1, fontWeight: 900 })
          }),
          TextBlock(String(tier.price || ''), {
            color: index === 1 ? theme.pink : theme.navy,
            fontSize: 40,
            lineHeight: 1,
            marginBottom: 12,
            ...role('metric', spec, { fontSize: 40, lineHeight: 1, fontWeight: 900 })
          }),
          body(tier.desc || '', spec, { color: index === 1 ? 'rgba(255,255,255,0.72)' : 'rgba(15,27,61,0.7)', width: 206, fontSize: 11.5, lineHeight: 1.32, marginBottom: 14 }),
          ...((tier.features || []).slice(0, 4).map((feature) =>
            TextBlock(`> ${feature}`, {
              color: index === 1 ? theme.lavender : theme.navy,
              fontSize: 9.5,
              lineHeight: 1.25,
              marginBottom: 7,
              ...role('label', spec, { fontSize: 9.5, lineHeight: 1.25, fontWeight: 500 })
            })
          )),
          box({ marginTop: 10 }, [pixelButton('Select', spec, { width: 132, variant: index === 1 ? 'pink' : 'cyan' })])
        ])
      )
    )
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const ctas = array(spec, 'ctas', DEFAULTS['slide-10'].ctas).slice(0, 2)
  return frame(
    spec,
    'slide-10',
    [
      ...particleLayer(theme),
      box({ position: 'absolute', left: 0, bottom: 0, width: 960, height: 78, backgroundColor: theme.navy, opacity: 0.72 }),
      box({ position: 'absolute', left: 90, bottom: 74, width: 70, height: 44, backgroundColor: theme.cyan }),
      box({ position: 'absolute', left: 160, bottom: 74, width: 96, height: 68, backgroundColor: theme.pink }),
      box({ position: 'absolute', right: 168, bottom: 74, width: 130, height: 92, backgroundColor: theme.yellow }),
      ...pixelShadowText(splitTitle(value(spec, 'title', DEFAULTS['slide-10'].title)), spec, {
        position: 'absolute',
        left: 190,
        top: 72,
        width: 580,
        fontSize: 52,
        lineHeight: 0.96
      }),
      TextBlock(value(spec, 'subtitle', DEFAULTS['slide-10'].subtitle), {
        position: 'absolute',
        left: 286,
        top: 356,
        width: 388,
        color: theme.lavender,
        fontSize: 15,
        lineHeight: 1.52,
        textAlign: 'center',
        ...role('body', spec, { fontSize: 15, lineHeight: 1.52, fontWeight: 500 })
      }),
      box({ position: 'absolute', left: 286, top: 454, flexDirection: 'row', gap: 34 }, ctas.map((cta, index) => pixelButton(cta, spec, { width: 178, variant: index === 1 ? 'pink' : 'cyan' })))
    ],
    { particles: true }
  )
}

const RENDERERS = {
  'slide-1': renderCover,
  'slide-2': renderSplitIntro,
  'slide-3': renderFeatureGrid,
  'slide-4': renderVerticalChart,
  'slide-5': renderHorizontalChart,
  'slide-6': renderTimeline,
  'slide-7': renderStats,
  'slide-8': renderQuote,
  'slide-9': renderTiers,
  'slide-10': renderClosing
}

export function renderPixelOrbitConsole(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
