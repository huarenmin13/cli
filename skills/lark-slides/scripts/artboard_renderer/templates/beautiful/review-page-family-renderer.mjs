import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

function colors(spec) {
  const source = spec.theme?.colors || {}
  const background = source.background || '#F7F4EA'
  const text = source.text || source.primary || '#1F2933'
  const primary = source.primary || source.accent || '#2F5D50'
  const accent = source.accent || primary
  const surface = source.surface || source.panel || '#FFFFFF'
  const panel = source.panel || source.surface || '#FFFFFF'
  const muted = source.muted || '#667085'
  const border = source.border || `${primary}33`
  return { background, text, primary, accent, surface, panel, muted, border }
}

function role(roleName, spec, fallback = {}) {
  return fontRole(roleName, spec, fallback)
}

function text(spec, key, fallback = '') {
  const value = spec.content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function list(spec, keys, fallback = []) {
  for (const key of keys) {
    const value = spec.content?.[key]
    if (Array.isArray(value)) {
      const cleaned = value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
      if (cleaned.length) return cleaned
    }
  }
  return fallback
}

function normalizedVariant(spec) {
  const raw = `${spec.page_variant_id || ''} ${spec.page_role || ''}`.toLowerCase().replace(/[-/]/g, '_')
  if (raw.includes('cover') || raw.includes('hero') || raw.includes('title')) return 'cover'
  if (raw.includes('agenda') || raw.includes('chapter') || raw.includes('toc') || raw.includes('outline')) return 'agenda'
  if (raw.includes('split') || raw.includes('compare') || raw.includes('comparison') || raw.includes('matrix')) return 'split'
  if (raw.includes('quote') || raw.includes('emphasis') || raw.includes('manifesto') || raw.includes('statement')) return 'quote'
  if (raw.includes('timeline') || raw.includes('process') || raw.includes('flow') || raw.includes('roadmap')) return 'timeline'
  if (raw.includes('closing') || raw.includes('close') || raw.includes('end') || raw.includes('summary')) return 'closing'
  if (raw.includes('chart') || raw.includes('data') || raw.includes('metric') || raw.includes('dashboard') || raw.includes('stat') || raw.includes('list')) return 'data'
  if (raw.includes('detail') || raw.includes('content') || raw.includes('case')) return 'detail'
  return 'detail'
}

function shell(spec, variant, children = []) {
  const theme = colors(spec)
  const family = String(spec.family_id || spec.page_family_source?.family_id || spec.template_id || 'beautiful')
  return box(
    {
      width: 960,
      height: 540,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.background,
      color: theme.text
    },
    [
      box({ position: 'absolute', left: 0, top: 0, width: 960, height: 540, backgroundColor: theme.background }),
      box({ position: 'absolute', left: 34, top: 28, width: 72, height: 3, backgroundColor: theme.accent }),
      TextBlock(family.toUpperCase(), {
        position: 'absolute',
        left: 34,
        bottom: 24,
        color: theme.muted,
        fontSize: 8,
        letterSpacing: 1.2,
        ...role('label', spec, { fontSize: 8, lineHeight: 1, fontWeight: 700 })
      }),
      TextBlock(String(variant || '').toUpperCase(), {
        position: 'absolute',
        right: 38,
        top: 28,
        color: theme.accent,
        fontSize: 9,
        letterSpacing: 1.3,
        ...role('label', spec, { fontSize: 9, lineHeight: 1, fontWeight: 700 })
      }),
      ...children
    ]
  )
}

function titleText(spec) {
  return text(spec, 'title', `${spec.family_id || 'Beautiful'}\n${spec.page_variant_id || 'Page'}`)
}

function subtitleText(spec) {
  return text(spec, 'subtitle', 'Review-only page-family renderer for visual inspection.')
}

function renderCover(spec) {
  const theme = colors(spec)
  return shell(spec, 'cover', [
    box({ position: 'absolute', right: -92, top: -80, width: 360, height: 700, backgroundColor: theme.accent, opacity: 0.16, transform: 'skewX(-12deg)' }),
    box({ position: 'absolute', left: 92, top: 155, width: 48, height: 2, backgroundColor: theme.accent }),
    TextBlock('OPENING', { position: 'absolute', left: 92, top: 124, color: theme.accent, letterSpacing: 1.4, ...role('label', spec, { fontSize: 10, lineHeight: 1, fontWeight: 700 }) }),
    Title(titleText(spec), { position: 'absolute', left: 90, top: 172, width: 530, color: theme.text, ...role('display', spec, { fontSize: 42, lineHeight: 1.04, fontWeight: 800 }) }),
    TextBlock(subtitleText(spec), { position: 'absolute', left: 92, top: 304, width: 420, color: theme.muted, ...role('body', spec, { fontSize: 13, lineHeight: 1.35 }) }),
    TextBlock(String(spec.review_only_current_deck_render?.page || '').padStart(2, '0'), { position: 'absolute', right: 86, bottom: 48, color: theme.accent, opacity: 0.28, ...role('metric', spec, { fontSize: 92, lineHeight: 0.9, fontWeight: 900 }) })
  ])
}

function renderAgenda(spec) {
  const theme = colors(spec)
  const items = list(spec, ['agenda', 'points', 'bullets', 'principles'], ['Context', 'Signals', 'Decisions', 'Next actions']).slice(0, 5)
  return shell(spec, 'agenda', [
    Title(titleText(spec), { position: 'absolute', left: 58, top: 78, width: 420, color: theme.text, ...role('display', spec, { fontSize: 34, lineHeight: 1.05, fontWeight: 800 }) }),
    box({ position: 'absolute', right: 60, top: 70, width: 390, minHeight: 372, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: 28, flexDirection: 'column' },
      items.map((item, index) =>
        box({ height: 62, borderBottom: index === items.length - 1 ? '0px solid transparent' : `1px solid ${theme.border}`, flexDirection: 'row', alignItems: 'center' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { width: 52, color: theme.accent, ...role('label', spec, { fontSize: 13, fontWeight: 900, lineHeight: 1 }) }),
          TextBlock(item, { width: 270, color: theme.text, ...role('body', spec, { fontSize: 17, lineHeight: 1.16, fontWeight: 700 }) })
        ])
      )
    )
  ])
}

function renderData(spec) {
  const theme = colors(spec)
  const metrics = list(spec, ['metrics', 'bars', 'bullets', 'principles'], ['01 Momentum', '02 Quality', '03 Conversion', '04 Retention']).slice(0, 4)
  return shell(spec, 'data', [
    TextBlock('DATA BOARD', { position: 'absolute', left: 58, top: 58, color: theme.accent, letterSpacing: 1.2, ...role('label', spec, { fontSize: 10, fontWeight: 700 }) }),
    Title(titleText(spec), { position: 'absolute', left: 58, top: 86, width: 610, color: theme.text, ...role('display', spec, { fontSize: 32, lineHeight: 1.06, fontWeight: 800 }) }),
    box({ position: 'absolute', left: 58, top: 214, width: 842, height: 216, flexDirection: 'row', gap: 16 },
      metrics.map((item, index) =>
        box({ width: 198, height: 198, backgroundColor: index === 0 ? theme.primary : theme.surface, border: `1px solid ${index === 0 ? theme.primary : theme.border}`, padding: 18, flexDirection: 'column', justifyContent: 'space-between' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { color: index === 0 ? theme.background : theme.accent, ...role('label', spec, { fontSize: 12, fontWeight: 900 }) }),
          TextBlock(String(item).split(' ')[0], { color: index === 0 ? theme.background : theme.text, ...role('metric', spec, { fontSize: 34, lineHeight: 0.92, fontWeight: 900 }) }),
          box({ width: 132 + index * 12, height: 7, backgroundColor: index === 0 ? theme.background : theme.accent, opacity: 0.78 }),
          TextBlock(String(item).split(' ').slice(1).join(' ') || 'metric', { color: index === 0 ? theme.background : theme.muted, ...role('label', spec, { fontSize: 10, lineHeight: 1.2 }) })
        ])
      )
    )
  ])
}

function renderSplit(spec) {
  const theme = colors(spec)
  const points = list(spec, ['bullets', 'points', 'principles'], ['Current observation', 'Design implication', 'Renderer action']).slice(0, 3)
  const panel = (title, x, inverted = false) =>
    box({ position: 'absolute', left: x, top: 160, width: 390, height: 260, backgroundColor: inverted ? theme.primary : theme.surface, border: `1px solid ${theme.border}`, padding: 26, flexDirection: 'column' }, [
      TextBlock(title, { color: inverted ? theme.background : theme.accent, letterSpacing: 1.2, ...role('label', spec, { fontSize: 10, fontWeight: 800 }) }),
      ...points.map((item, index) =>
        box({ marginTop: 22, flexDirection: 'row' }, [
          box({ width: 7, height: 7, marginTop: 6, marginRight: 12, backgroundColor: inverted ? theme.background : theme.accent }),
          TextBlock(index === 0 ? item : `${item} ${index + 1}`, { width: 286, color: inverted ? theme.background : theme.text, ...role('body', spec, { fontSize: 15, lineHeight: 1.25 }) })
        ])
      )
    ])
  return shell(spec, 'split', [
    Title(titleText(spec), { position: 'absolute', left: 58, top: 64, width: 650, color: theme.text, ...role('display', spec, { fontSize: 34, lineHeight: 1.04, fontWeight: 800 }) }),
    panel('LEFT TRACK', 58, false),
    panel('RIGHT TRACK', 512, true)
  ])
}

function renderQuote(spec) {
  const theme = colors(spec)
  return shell(spec, 'quote', [
    TextBlock('“', { position: 'absolute', left: 70, top: 58, color: theme.accent, opacity: 0.18, ...role('display', spec, { fontSize: 168, lineHeight: 0.8, fontWeight: 900 }) }),
    Title(text(spec, 'quote', titleText(spec)), { position: 'absolute', left: 132, top: 136, width: 650, color: theme.text, ...role('display', spec, { fontSize: 34, lineHeight: 1.08, fontWeight: 800 }) }),
    TextBlock(text(spec, 'author', 'Review-only evidence page'), { position: 'absolute', left: 136, top: 354, color: theme.accent, letterSpacing: 1.4, ...role('label', spec, { fontSize: 11, fontWeight: 700 }) }),
    box({ position: 'absolute', right: 72, top: 86, width: 86, height: 346, border: `2px solid ${theme.accent}` })
  ])
}

function renderTimeline(spec) {
  const theme = colors(spec)
  const steps = list(spec, ['timeline', 'bullets', 'principles'], ['Discover', 'Shape', 'Build', 'Review', 'Scale']).slice(0, 5)
  return shell(spec, 'timeline', [
    Title(titleText(spec), { position: 'absolute', left: 58, top: 68, width: 620, color: theme.text, ...role('display', spec, { fontSize: 34, lineHeight: 1.05, fontWeight: 800 }) }),
    box({ position: 'absolute', left: 94, top: 286, width: 760, height: 3, backgroundColor: theme.border }),
    ...steps.map((item, index) =>
      box({ position: 'absolute', left: 76 + index * 172, top: 220, width: 132, height: 132, flexDirection: 'column', alignItems: 'flex-start' }, [
        box({ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.accent, marginBottom: 18 }),
        TextBlock(String(index + 1).padStart(2, '0'), { color: theme.accent, marginBottom: 10, ...role('label', spec, { fontSize: 12, fontWeight: 900, lineHeight: 1 }) }),
        TextBlock(item, { width: 126, color: theme.text, ...role('body', spec, { fontSize: 13, lineHeight: 1.18, fontWeight: 700 }) })
      ])
    )
  ])
}

function renderDetail(spec) {
  const theme = colors(spec)
  const points = list(spec, ['details', 'bullets', 'principles'], ['Source layout contract', 'Current renderer behavior', 'Review decision note']).slice(0, 3)
  return shell(spec, 'detail', [
    box({ position: 'absolute', left: 56, top: 66, width: 848, height: 382, backgroundColor: theme.surface, border: `1px solid ${theme.border}` }),
    TextBlock('DETAIL', { position: 'absolute', left: 94, top: 104, color: theme.accent, letterSpacing: 1.2, ...role('label', spec, { fontSize: 10, fontWeight: 800 }) }),
    Title(titleText(spec), { position: 'absolute', left: 94, top: 134, width: 330, color: theme.text, ...role('display', spec, { fontSize: 31, lineHeight: 1.06, fontWeight: 800 }) }),
    box({ position: 'absolute', left: 490, top: 104, width: 346, height: 298, flexDirection: 'column', gap: 18 },
      points.map((item, index) =>
        box({ minHeight: 76, borderBottom: `1px solid ${theme.border}`, flexDirection: 'row' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { width: 44, color: theme.accent, ...role('label', spec, { fontSize: 13, fontWeight: 900 }) }),
          TextBlock(item, { width: 282, color: theme.text, ...role('body', spec, { fontSize: 15, lineHeight: 1.3 }) })
        ])
      )
    )
  ])
}

function renderClosing(spec) {
  const theme = colors(spec)
  const items = list(spec, ['takeaways', 'bullets', 'principles'], ['Keep', 'Fix', 'Promote only after fidelity']).slice(0, 3)
  return shell(spec, 'closing', [
    box({ position: 'absolute', left: 70, top: 84, width: 820, height: 286, backgroundColor: theme.primary, padding: 42, flexDirection: 'column', justifyContent: 'center' }, [
      TextBlock('CLOSING', { color: theme.background, opacity: 0.78, marginBottom: 20, letterSpacing: 1.3, ...role('label', spec, { fontSize: 10, fontWeight: 800 }) }),
      Title(titleText(spec), { width: 620, color: theme.background, ...role('display', spec, { fontSize: 40, lineHeight: 1, fontWeight: 800 }) })
    ]),
    box({ position: 'absolute', left: 104, top: 400, width: 752, height: 66, flexDirection: 'row', gap: 22 },
      items.map((item, index) =>
        box({ width: 230, flexDirection: 'row' }, [
          TextBlock(String(index + 1).padStart(2, '0'), { width: 34, color: theme.accent, ...role('label', spec, { fontSize: 12, fontWeight: 900 }) }),
          TextBlock(item, { width: 176, color: theme.text, ...role('body', spec, { fontSize: 13, lineHeight: 1.22, fontWeight: 700 }) })
        ])
      )
    )
  ])
}

export function renderReviewOnlyPageFamilyVariant(spec) {
  switch (normalizedVariant(spec)) {
    case 'cover':
      return renderCover(spec)
    case 'agenda':
      return renderAgenda(spec)
    case 'data':
      return renderData(spec)
    case 'split':
      return renderSplit(spec)
    case 'quote':
      return renderQuote(spec)
    case 'timeline':
      return renderTimeline(spec)
    case 'closing':
      return renderClosing(spec)
    default:
      return renderDetail(spec)
  }
}
