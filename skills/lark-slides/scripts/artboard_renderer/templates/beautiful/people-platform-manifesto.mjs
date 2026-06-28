import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'people-platform-manifesto'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['cover', 'toc', 'manifesto', 'pillars', 'stat', 'platform', 'quote', 'timeline', 'compare', 'close']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'peoples-platform',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'peoples-platform',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['cover', 'toc', 'manifesto', 'quote', 'close'],
      repeatable: ['pillars', 'stat', 'platform', 'timeline', 'compare']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/peoples-platform-1.png'
}

const DEFAULTS = {
  cover: {
    eyebrow: 'STRATEGIC REVIEW · INTERNAL',
    title: 'QUARTERLY\nREVIEW',
    script: 'a',
    subtitle: 'PRESENTATION TEMPLATE',
    meta_left: 'Q2 · 2026',
    stamp: 'VOL. 01',
    footer: ['PREPARED BY THE TEAM', 'MAY 2026', 'VERSION 01']
  },
  toc: {
    title: "WHAT'S\nINSIDE.",
    meta: ['CONTENTS', 'SECTION GUIDE', '02 / 10'],
    items: [
      { num: '01', title: 'The Big Idea', page: 'PG 03' },
      { num: '02', title: 'Three Pillars', page: 'PG 04' },
      { num: '03', title: 'By the Numbers', page: 'PG 05' },
      { num: '04', title: 'The Full Plan', page: 'PG 06' },
      { num: '05', title: 'Voice of the Customer', page: 'PG 07' },
      { num: '06', title: 'Roadmap', page: 'PG 08' },
      { num: '07', title: 'Where We Land', page: 'PG 09' },
      { num: '08', title: 'Next Steps', page: 'PG 10' }
    ]
  },
  manifesto: {
    header: ['— THE BIG IDEA —', '03 / 10', 'ONE SENTENCE'],
    kicker: '★ ★ ★  OUR THESIS  ★ ★ ★',
    title: 'The product gets simpler\nas the team gets braver —\nnot the other way around.',
    accent: 'braver',
    footer: ['— PARAGRAPH 01 —', 'SET IN ALFA SLAB']
  },
  pillars: {
    title: 'THREE\nPRIORITIES.',
    lede: 'The work falls into three buckets this quarter. Each has a clear owner, deliverable, and way to know we are done.',
    columns: [
      { num: '01', tag: '— FOCUS —', title: 'Ship the\ncore flow.', body: 'Cut three legacy paths and double down on the one that drives ninety percent of activations.' },
      { num: '02', tag: '— LEARN —', title: 'Talk to\nten teams.', body: 'Standing weekly research with target customers. Findings briefed every Friday in a one-page memo.', accent: true },
      { num: '03', tag: '— SHIP —', title: 'One launch,\nnot five.', body: 'Combine the four small drops into a single, well-told release with shared positioning.' }
    ]
  },
  stat: {
    header: ['— BY THE NUMBERS —', '05 / 10', 'SECTION 02 / DATA'],
    value: '63',
    unit: '%',
    title: 'of customers\nrecommend us\nafter onboarding.',
    body: 'Net promoter scores climbed eighteen points after we shipped the redesigned first-run experience in March.',
    source: 'SOURCE — INTERNAL NPS, Q1 2026',
    ribbon: ['★ FOCUS', '★ LEARN', '★ SHIP', '★ FOCUS', '★ LEARN', '★ SHIP']
  },
  platform: {
    title: 'THE FULL\nPLAN.',
    lede: 'Eight workstreams, costed and owned. Each links to a longer brief in the appendix.',
    items: [
      { title: 'Onboarding refresh', body: 'Rebuild the first-run experience with progressive disclosure and a single primary action per screen.' },
      { title: 'Pricing simplification', body: 'Collapse the seven plans into three. Move add-ons behind a clearer feature matrix.' },
      { title: 'Mobile parity', body: 'Bring the four most-used desktop flows to mobile by end of quarter, including offline drafts.' },
      { title: 'Self-serve setup', body: 'Reduce time-to-first-value from three days to thirty minutes for teams under fifty seats.' },
      { title: 'Trust & security', body: 'Ship audit logs, role-based access, and SSO for all paid tiers.' },
      { title: 'Performance budget', body: 'Cut median page load by forty percent and wire the ceiling into release.' },
      { title: 'Integrations push', body: 'Native connectors for the top five tools customers ask for, plus a public API.' },
      { title: 'Brand refresh', body: 'New marketing site, sharper positioning, and a unified visual system.' }
    ]
  },
  quote: {
    quote: 'The new onboarding cut our setup time\nfrom three days to thirty minutes —\nwe shipped the same week.',
    emphasis: 'we shipped the same week.',
    name: 'Maya Okonkwo',
    role: '— HEAD OF OPS, NORTH STAR LABS —',
    stamp: '★ Voice of the Customer ★'
  },
  timeline: {
    title: 'THE\nROADMAP.',
    subtitle: '— a plan, on a clock —',
    steps: [
      { when: 'MAY', title: 'Kickoff', body: 'Charter the workstreams, lock owners, and publish the shared scorecard.' },
      { when: 'JUNE', title: 'Beta opens', body: 'Onboard the first ten design partners on the new core flow.', accent: true },
      { when: 'AUGUST', title: 'Launch', body: 'Public release, marketing site refresh, and sales enablement complete.' },
      { when: 'OCTOBER', title: 'Scale', body: 'Roll the changes to the long tail and retire legacy paths for good.', accent: true }
    ],
    metrics: [
      { label: '— TIME-TO-VALUE —', value: '30m' },
      { label: '— ACTIVATION RATE —', value: '+24%', accent: true },
      { label: '— REVENUE LIFT —', value: '$1.4M' }
    ]
  },
  compare: {
    title: 'WHERE\nWE LAND.',
    subtitle: 'A side-by-side of where the product is today and where this plan takes us by the end of the year.',
    columns: [
      {
        label: '— TODAY —',
        title: 'Capable,\nbut cluttered.',
        items: [
          'Three-day median time-to-value for new teams.',
          'Seven pricing plans with overlapping feature sets.',
          'Mobile parity at sixty percent of desktop flows.',
          'Onboarding NPS sits at forty-five points.'
        ]
      },
      {
        label: '— END OF YEAR —',
        title: 'Sharper,\nfaster,\nfewer.',
        accent: true,
        items: [
          'Thirty-minute self-serve setup, no human required.',
          'Three pricing plans with a clear feature matrix.',
          'Full mobile parity, plus offline drafts.',
          'Onboarding NPS targeted at sixty-three points.'
        ]
      }
    ]
  },
  close: {
    header: ['— END OF DECK —', '★ THANK YOU ★', '10 / 10'],
    pre: 'over to you —',
    title: 'QUESTIONS?',
    cta: "LET'S TALK",
    url: 'team@company.com',
    signoff: 'PREPARED BY THE PRODUCT TEAM\n★ MAY 2026 ★ INTERNAL DRAFT',
    stamp: 'END'
  }
}

function theme(spec) {
  return {
    blue: '#2C2CDC',
    blueDeep: '#1B1BB0',
    orange: '#F2A03A',
    red: '#E83A2A',
    cream: '#F4E9D6',
    paper: '#F5F2EA',
    ink: '#0E0E14'
  }
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
  if (raw.includes('agenda') || raw.includes('contents')) return 'toc'
  if (raw.includes('data') || raw.includes('metric')) return 'stat'
  if (raw.includes('quote')) return 'quote'
  if (raw.includes('timeline') || raw.includes('process')) return 'timeline'
  if (raw.includes('compare') || raw.includes('comparison') || raw.includes('split')) return 'compare'
  if (raw.includes('closing') || raw.includes('close') || raw.includes('cta')) return 'close'
  return 'platform'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function page(spec, bg, children = []) {
  return box({ width: CANVAS.width, height: CANVAS.height, position: 'relative', overflow: 'hidden', backgroundColor: bg }, [
    grain(spec),
    ...textureDots(spec),
    ...children
  ])
}

function grain(spec) {
  const t = theme(spec)
  return box({ position: 'absolute', inset: 0, backgroundColor: t.ink, opacity: 0.025 })
}

function textureDots(spec) {
  const t = theme(spec)
  return Array.from({ length: 10 }, (_, index) =>
    box({
      position: 'absolute',
      left: 54 + (index % 5) * 18,
      bottom: 54 + Math.floor(index / 5) * 18,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.ink,
      opacity: 0.18
    })
  )
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    ...role('label', spec, { fontWeight: 700, lineHeight: 1.05, letterSpacing: 1.4, textTransform: 'uppercase' }),
    fontSize: 10,
    ...style
  })
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    ...role('display', spec, { fontWeight: 900, lineHeight: 0.88, letterSpacing: 0.2, textTransform: 'uppercase' }),
    whiteSpace: 'pre-line',
    ...style
  })
}

function body(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    ...role('body', spec, { fontWeight: 500, lineHeight: 1.35 }),
    fontSize: 16,
    lineHeight: 1.35,
    ...style
  })
}

function metric(value, spec, style = {}) {
  return TextBlock(String(value || '').toUpperCase(), {
    ...role('metric', spec, { fontWeight: 900, lineHeight: 0.9, textTransform: 'uppercase' }),
    ...style
  })
}

function dot(t, style = {}) {
  return box({ width: 6, height: 6, borderRadius: 3, backgroundColor: t.orange, ...style })
}

function renderCover(spec) {
  const t = theme(spec)
  const c = content(spec, 'cover')
  const footer = Array.isArray(c.footer) ? c.footer : DEFAULTS.cover.footer
  return page(spec, t.blue, [
    box({ position: 'absolute', inset: 24, borderWidth: 3, borderColor: t.cream }),
    box({ position: 'absolute', left: 54, top: 43, right: 54, height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
      label(c.meta_left, spec, { color: t.cream, borderWidth: 1.5, borderColor: t.cream, borderRadius: 20, padding: '5px 12px', fontSize: 9 }),
      label(c.eyebrow, spec, { color: t.cream, fontSize: 10 }),
      label(c.stamp, spec, { color: t.cream, borderWidth: 1.5, borderColor: t.cream, borderRadius: 20, padding: '5px 12px', fontSize: 9 })
    ]),
    display(c.title, spec, { position: 'absolute', left: 134, top: 139, width: 690, color: t.orange, fontSize: 89, lineHeight: 0.82 }),
    display(c.title, spec, { position: 'absolute', left: 129, top: 134, width: 690, color: t.cream, fontSize: 89, lineHeight: 0.82 }),
    TextBlock(c.script, { position: 'absolute', left: 262, top: 322, color: t.cream, fontSize: 44, ...role('body', spec, { fontWeight: 400 }) }),
    display(c.subtitle, spec, { position: 'absolute', left: 326, top: 327, color: t.cream, fontSize: 29, lineHeight: 1 }),
    box({ position: 'absolute', left: 300, top: 463, right: 300, height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13 }, [
      label(footer[0], spec, { color: t.cream, fontSize: 9 }),
      dot(t),
      label(footer[1], spec, { color: t.cream, fontSize: 9 }),
      dot(t),
      label(footer[2], spec, { color: t.cream, fontSize: 9 })
    ])
  ])
}

function renderToc(spec) {
  const t = theme(spec)
  const c = content(spec, 'toc')
  const items = Array.isArray(c.items) ? c.items.slice(0, 8) : DEFAULTS.toc.items
  const meta = Array.isArray(c.meta) ? c.meta : DEFAULTS.toc.meta
  return page(spec, t.paper, [
    box({ position: 'absolute', left: 45, top: 35, right: 45, height: 108, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: t.ink }, [
      display(c.title, spec, { color: t.ink, fontSize: 58, lineHeight: 0.86 }),
      box({ width: 180, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }, [
        label(meta[0], spec, { color: t.blue, fontSize: 16 }),
        label(meta[1], spec, { color: t.ink, fontSize: 10 }),
        label(meta[2], spec, { color: t.ink, fontSize: 10 })
      ])
    ]),
    box({ position: 'absolute', left: 126, top: 168, right: 126, bottom: 48, flexDirection: 'column' }, items.map((item) =>
      box({ height: 39, borderBottomWidth: 1.5, borderColor: t.ink, flexDirection: 'row', alignItems: 'center' }, [
        metric(item.num, spec, { width: 58, color: t.orange, fontSize: 27, lineHeight: 1 }),
        display(item.title, spec, { flex: 1, color: t.ink, fontSize: 18, lineHeight: 1 }),
        label(item.page, spec, { width: 70, color: t.blue, fontSize: 10, textAlign: 'right', justifyContent: 'flex-end' })
      ])
    ))
  ])
}

function renderManifesto(spec) {
  const t = theme(spec)
  const c = content(spec, 'manifesto')
  const header = Array.isArray(c.header) ? c.header : DEFAULTS.manifesto.header
  return page(spec, t.cream, [
    box({ position: 'absolute', left: 0, top: 0, right: 0, height: 45, backgroundColor: t.blue, borderBottomWidth: 3, borderColor: t.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 45px' }, header.map((item) =>
      label(item, spec, { color: t.cream, fontSize: 9 })
    )),
    label(c.kicker, spec, { position: 'absolute', left: 90, top: 100, color: t.red, fontSize: 12 }),
    display(c.title, spec, { position: 'absolute', left: 87, top: 142, width: 790, color: t.red, fontSize: 48, lineHeight: 0.9 }),
    display(c.title, spec, { position: 'absolute', left: 82, top: 137, width: 790, color: t.ink, fontSize: 48, lineHeight: 0.9 }),
    box({ position: 'absolute', left: 90, top: 400, width: 300, height: 7, backgroundColor: t.ink }),
    box({ position: 'absolute', left: 45, right: 45, bottom: 32, height: 20, flexDirection: 'row', justifyContent: 'space-between' }, [
      label(header[0], spec, { color: t.ink, fontSize: 9 }),
      label(c.footer?.[1] || 'SET IN ALFA SLAB', spec, { color: t.ink, fontSize: 9 })
    ])
  ])
}

function renderPillars(spec) {
  const t = theme(spec)
  const c = content(spec, 'pillars')
  const cols = Array.isArray(c.columns) ? c.columns.slice(0, 3) : DEFAULTS.pillars.columns
  return page(spec, t.paper, [
    box({ position: 'absolute', left: 45, top: 35, right: 45, height: 116, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: t.ink }, [
      display(c.title, spec, { width: 420, color: t.ink, fontSize: 58, lineHeight: 0.86 }),
      body(c.lede, spec, { width: 340, color: t.ink, fontSize: 15, lineHeight: 1.35, paddingTop: 17 })
    ]),
    box({ position: 'absolute', left: 45, right: 45, bottom: 45, height: 325, borderWidth: 3, borderColor: t.ink, flexDirection: 'row' }, cols.map((col) => {
      const accent = Boolean(col.accent)
      return box({ flex: 1, flexDirection: 'column', padding: '28px 25px', borderRightWidth: col === cols[cols.length - 1] ? 0 : 3, borderColor: t.ink, backgroundColor: accent ? t.blue : t.paper }, [
        metric(col.num, spec, { color: t.orange, fontSize: 34, marginBottom: 17 }),
        label(col.tag, spec, { color: accent ? t.cream : t.ink, borderTopWidth: 2, borderColor: accent ? t.cream : t.ink, paddingTop: 10, fontSize: 9, marginBottom: 18 }),
        display(col.title, spec, { color: accent ? t.orange : t.ink, fontSize: 29, lineHeight: 0.96, marginBottom: 18 }),
        body(col.body, spec, { color: accent ? t.cream : t.ink, fontSize: 14, lineHeight: 1.38 })
      ])
    }))
  ])
}

function renderStat(spec) {
  const t = theme(spec)
  const c = content(spec, 'stat')
  const header = Array.isArray(c.header) ? c.header : DEFAULTS.stat.header
  const ribbon = Array.isArray(c.ribbon) ? c.ribbon : DEFAULTS.stat.ribbon
  return page(spec, t.blue, [
    box({ position: 'absolute', left: 0, top: 0, right: 0, height: 45, borderBottomWidth: 3, borderColor: t.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 45px' }, header.map((item) =>
      label(item, spec, { color: t.cream, fontSize: 9 })
    )),
    metric(c.value, spec, { position: 'absolute', left: 55, top: 150, color: t.orange, fontSize: 153, lineHeight: 0.82 }),
    metric(c.unit, spec, { position: 'absolute', left: 346, top: 169, color: t.orange, fontSize: 64, lineHeight: 1 }),
    display(c.title, spec, { position: 'absolute', left: 490, top: 150, width: 370, color: t.cream, fontSize: 38, lineHeight: 0.94 }),
    body(c.body, spec, { position: 'absolute', left: 493, top: 312, width: 340, color: t.cream, fontSize: 15, lineHeight: 1.35 }),
    label(c.source, spec, { position: 'absolute', left: 493, top: 392, color: t.cream, fontSize: 9 }),
    box({ position: 'absolute', left: -20, right: -20, bottom: 48, height: 43, backgroundColor: t.orange, borderTopWidth: 3, borderBottomWidth: 3, borderColor: t.cream, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, ribbon.map((item) =>
      label(item, spec, { color: t.ink, fontSize: 13 })
    ))
  ])
}

function renderPlatform(spec) {
  const t = theme(spec)
  const c = content(spec, 'platform')
  const items = Array.isArray(c.items) ? c.items.slice(0, 8) : DEFAULTS.platform.items
  return page(spec, t.paper, [
    box({ position: 'absolute', left: 45, top: 35, right: 45, height: 95, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: t.ink }, [
      display(c.title, spec, { color: t.ink, fontSize: 48, lineHeight: 0.86 }),
      body(c.lede, spec, { width: 355, color: t.ink, fontSize: 15, lineHeight: 1.32, paddingTop: 13 })
    ]),
    box({ position: 'absolute', left: 88, right: 88, top: 153, bottom: 42, flexDirection: 'column', flexWrap: 'wrap', columnGap: 35 }, items.map((item, index) =>
      box({ width: 362, minHeight: 73, flexDirection: 'row', borderTopWidth: 2, borderColor: t.ink, paddingTop: 12, marginBottom: 9 }, [
        metric(String(index + 1).padStart(2, '0'), spec, { width: 45, color: t.orange, fontSize: 25 }),
        box({ flex: 1, flexDirection: 'column' }, [
          display(item.title, spec, { color: t.ink, fontSize: 17, lineHeight: 1, marginBottom: 6 }),
          body(item.body, spec, { color: t.ink, fontSize: 12.5, lineHeight: 1.28 })
        ])
      ])
    ))
  ])
}

function renderQuote(spec) {
  const t = theme(spec)
  const c = content(spec, 'quote')
  const quoteBase = String(c.quote || '').replace(String(c.emphasis || ''), '').trim()
  return page(spec, t.orange, [
    metric('"', spec, { position: 'absolute', left: 58, top: 22, color: t.blue, opacity: 0.18, fontSize: 168, lineHeight: 0.7 }),
    display(quoteBase, spec, { position: 'absolute', left: 88, top: 105, width: 790, color: t.blue, fontSize: 42, lineHeight: 1.04 }),
    display(c.emphasis, spec, { position: 'absolute', left: 88, top: 285, width: 640, color: t.red, fontSize: 42, lineHeight: 1.04 }),
    display(c.emphasis, spec, { position: 'absolute', left: 84, top: 281, width: 640, color: t.cream, fontSize: 42, lineHeight: 1.04 }),
    box({ position: 'absolute', left: 88, right: 88, bottom: 58, height: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
      box({ flexDirection: 'row', alignItems: 'center' }, [
        box({ width: 58, height: 58, borderRadius: 29, backgroundColor: t.blue, color: t.cream, alignItems: 'center', justifyContent: 'center', marginRight: 15 }, [
          display('M', spec, { color: t.cream, fontSize: 26, lineHeight: 1 })
        ]),
        box({ flexDirection: 'column' }, [
          display(c.name, spec, { color: t.blue, fontSize: 20, lineHeight: 1 }),
          label(c.role, spec, { color: t.blue, fontSize: 9, marginTop: 7 })
        ])
      ]),
      label(c.stamp, spec, { color: t.blue, borderWidth: 2, borderColor: t.blue, borderRadius: 20, padding: '9px 18px', fontSize: 10 })
    ])
  ])
}

function renderTimeline(spec) {
  const t = theme(spec)
  const c = content(spec, 'timeline')
  const steps = Array.isArray(c.steps) ? c.steps.slice(0, 4) : DEFAULTS.timeline.steps
  const metrics = Array.isArray(c.metrics) ? c.metrics.slice(0, 3) : DEFAULTS.timeline.metrics
  return page(spec, t.cream, [
    box({ position: 'absolute', left: 45, top: 35, right: 45, height: 98, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: t.ink }, [
      display(c.title, spec, { color: t.ink, fontSize: 52, lineHeight: 0.86 }),
      TextBlock(c.subtitle, { color: t.red, fontSize: 30, paddingTop: 30, ...role('body', spec, { fontWeight: 400 }) })
    ]),
    box({ position: 'absolute', left: 78, right: 78, top: 219, height: 3, backgroundColor: t.ink }),
    box({ position: 'absolute', left: 74, right: 74, top: 184, height: 112, flexDirection: 'row' }, steps.map((step) =>
      box({ flex: 1, flexDirection: 'column', padding: '0 15px' }, [
        box({ width: 24, height: 24, borderRadius: 12, backgroundColor: step.accent ? t.blue : t.orange, borderWidth: 2, borderColor: t.ink, marginBottom: 18 }),
        label(step.when, spec, { color: t.red, fontSize: 10, marginBottom: 7 }),
        display(step.title, spec, { color: t.ink, fontSize: 19, lineHeight: 1, marginBottom: 6 }),
        body(step.body, spec, { color: t.ink, fontSize: 12, lineHeight: 1.25 })
      ])
    )),
    box({ position: 'absolute', left: 70, right: 70, bottom: 48, height: 105, flexDirection: 'row', gap: 16 }, metrics.map((item) =>
      box({ flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: 18, backgroundColor: item.accent ? t.blue : t.paper, borderWidth: 3, borderColor: t.ink }, [
        label(item.label, spec, { color: item.accent ? t.cream : t.ink, fontSize: 9 }),
        metric(item.value, spec, { color: item.accent ? t.orange : t.blue, fontSize: 43, lineHeight: 0.9 })
      ])
    ))
  ])
}

function renderCompare(spec) {
  const t = theme(spec)
  const c = content(spec, 'compare')
  const columns = Array.isArray(c.columns) ? c.columns.slice(0, 2) : DEFAULTS.compare.columns
  return page(spec, t.paper, [
    box({ position: 'absolute', left: 45, top: 35, right: 45, height: 100, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: t.ink }, [
      display(c.title, spec, { color: t.ink, fontSize: 50, lineHeight: 0.86 }),
      body(c.subtitle, spec, { width: 360, color: t.ink, fontSize: 15, lineHeight: 1.32, paddingTop: 18 })
    ]),
    box({ position: 'absolute', left: 45, right: 45, bottom: 45, height: 320, borderWidth: 3, borderColor: t.ink, flexDirection: 'row' }, columns.map((col) =>
      box({ flex: 1, flexDirection: 'column', padding: '34px 35px', backgroundColor: col.accent ? t.blue : t.paper, borderRightWidth: col === columns[0] ? 3 : 0, borderColor: t.ink }, [
        label(col.label, spec, { color: col.accent ? t.cream : t.ink, borderBottomWidth: 2, borderColor: col.accent ? t.cream : t.ink, paddingBottom: 10, fontSize: 9, marginBottom: 18 }),
        display(col.title, spec, { color: col.accent ? t.orange : t.ink, fontSize: 32, lineHeight: 0.96, marginBottom: 20 }),
        box({ flexDirection: 'column', gap: 10 }, (col.items || []).slice(0, 4).map((item) =>
          box({ flexDirection: 'row', alignItems: 'flex-start' }, [
            box({ width: 6, height: 6, borderRadius: 3, backgroundColor: col.accent ? t.orange : t.blue, marginTop: 7, marginRight: 9 }),
            body(item, spec, { flex: 1, color: col.accent ? t.cream : t.ink, fontSize: 13.5, lineHeight: 1.25 })
          ])
        ))
      ])
    ))
  ])
}

function renderClose(spec) {
  const t = theme(spec)
  const c = content(spec, 'close')
  const header = Array.isArray(c.header) ? c.header : DEFAULTS.close.header
  return page(spec, t.blue, [
    box({ position: 'absolute', inset: 25, borderWidth: 3, borderColor: t.cream }),
    box({ position: 'absolute', left: 55, top: 45, right: 55, height: 22, flexDirection: 'row', justifyContent: 'space-between' }, header.map((item) =>
      label(item, spec, { color: t.cream, fontSize: 9 })
    )),
    TextBlock(c.pre, { position: 'absolute', left: 352, top: 142, color: t.orange, fontSize: 34, ...role('body', spec, { fontWeight: 400 }) }),
    display(c.title, spec, { position: 'absolute', left: 115, top: 185, width: 730, color: t.cream, fontSize: 91, lineHeight: 0.86, textAlign: 'center', justifyContent: 'center' }),
    box({ position: 'absolute', left: 237, top: 335, width: 486, height: 51, flexDirection: 'row', borderWidth: 3, borderColor: t.cream }, [
      display(c.cta, spec, { width: 210, backgroundColor: t.orange, color: t.ink, fontSize: 20, alignItems: 'center', justifyContent: 'center' }),
      display(c.url, spec, { flex: 1, color: t.cream, fontSize: 20, alignItems: 'center', justifyContent: 'center' })
    ]),
    label(c.signoff, spec, { position: 'absolute', left: 63, bottom: 42, color: t.cream, fontSize: 9, lineHeight: 1.45, whiteSpace: 'pre-line' }),
    box({ position: 'absolute', right: 63, bottom: 42, width: 96, height: 96, borderWidth: 3, borderColor: t.cream, borderRadius: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
      metric(c.stamp, spec, { color: t.orange, fontSize: 27, lineHeight: 1 }),
      label('— V. 01 —', spec, { color: t.cream, fontSize: 8, marginTop: 5 })
    ])
  ])
}

const RENDERERS = {
  cover: renderCover,
  toc: renderToc,
  manifesto: renderManifesto,
  pillars: renderPillars,
  stat: renderStat,
  platform: renderPlatform,
  quote: renderQuote,
  timeline: renderTimeline,
  compare: renderCompare,
  close: renderClose
}

export function renderPeoplePlatformManifesto(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderPlatform)(spec)
}
