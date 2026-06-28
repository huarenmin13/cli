import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'retro-ui-dashboard'

const CANVAS = { width: 960, height: 540 }
const PAGE_VARIANTS = ['slide-1', 'slide-2', 'slide-3', 'slide-4', 'slide-5', 'slide-6', 'slide-7', 'slide-8', 'slide-9', 'slide-10']

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'retro-windows',
  implemented_page_variants: PAGE_VARIANTS,
  page_family: {
    family_id: 'retro-windows',
    supported_page_variants: PAGE_VARIANTS,
    variant_usage_policy: {
      singletons: ['slide-1', 'slide-2', 'slide-3', 'slide-5', 'slide-8', 'slide-9', 'slide-10'],
      repeatable: ['slide-4', 'slide-6', 'slide-7']
    }
  },
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/retro-windows-1.png'
}

const DEFAULTS = {
  'slide-1': {
    icon: 'P',
    window_title: 'PRESENTATION.EXE',
    title: 'QUARTERLY OVERVIEW',
    marquee: 'Welcome to the presentation template - Use arrow keys or navigation dots to browse slides',
    body: 'Please wait while content loads...',
    buttons: ['OK', 'Cancel', 'Help'],
    footer: 'Version 1.0 - Build 2026.05.01 - All systems operational'
  },
  'slide-2': {
    icon: 'A',
    window_title: 'AGENDA.TXT',
    title: "Today's Discussion Topics",
    subtitle: 'Select an item to navigate. Use keyboard shortcuts for faster access.',
    primary_title: 'Primary Items',
    secondary_title: 'Secondary Items',
    primary: ['Executive summary and framing', 'Quarterly revenue comparison', 'Product capabilities overview', 'Market segment distribution'],
    secondary: ['Metrics dashboard review', 'Organizational structure', 'Project roadmap 2026', 'Closing and next steps'],
    status: 'READY',
    footer: ['Slides: 10', 'Mode: Presentation', 'Owner: Strategy']
  },
  'slide-3': {
    icon: 'R',
    window_title: 'README.DOC',
    title: 'Executive Summary',
    body: 'This deck summarizes current performance, operating priorities, and the near-term roadmap using a nostalgic desktop application metaphor.',
    boxes: [
      { title: 'Key Objectives', body: 'Align stakeholders around progress, risk, and ownership before the next operating review.' },
      { title: 'Primary Outcomes', body: 'Clear priorities, visible metric movement, and a shared view of what must ship next.' }
    ],
    stats: [
      { label: 'Prepared by', value: 'Department Name' },
      { label: 'Date', value: 'May 01, 2026' },
      { label: 'Classification', value: 'Internal Use' },
      { label: 'Review Status', value: 'Approved', accent: 'green' }
    ]
  },
  'slide-4': {
    icon: 'D',
    window_title: 'DATAVIEW.CSV',
    title: 'Quarterly Revenue Comparison',
    buttons: ['Export', 'Print'],
    bars: [
      { label: 'Q1 2026', value: '$1.2M', growth: '+5%', height: 42 },
      { label: 'Q2 2026', value: '$1.5M', growth: '+12%', height: 52 },
      { label: 'Q3 2026', value: '$1.9M', growth: '+18%', height: 66 },
      { label: 'Q4 2026', value: '$2.1M', growth: '+22%', height: 74 }
    ],
    highlights: ['Q3 exceeded projections by 18%', 'Enterprise segment grew 24% YoY', 'Recurring revenue now at 62% of total'],
    footer: ['Data source: Internal reporting system', 'Updated: May 2026', 'Currency: USD (millions)']
  },
  'slide-5': {
    icon: 'F',
    window_title: 'FEATURES.INI',
    title: 'Product Capabilities Overview',
    subtitle: 'A detailed breakdown of current platform features and their implementation status.',
    modules: [
      { title: 'User Authentication Service', value: 100 },
      { title: 'Data Processing Engine', value: 92 },
      { title: 'Reporting Dashboard', value: 88 },
      { title: 'Advanced Analytics Suite', value: 65, open: true }
    ],
    details: [
      'Auth Service: Supports SSO, MFA, and role-based access control.',
      'Data Engine: Handles 10M+ records daily with sub-second query response.',
      'Dashboard: Real-time visualization with custom layouts and reports.',
      'Analytics: Predictive modeling and trend forecasting in beta.'
    ],
    metrics: [
      { label: 'Active', value: '12' },
      { label: 'In Dev', value: '3' },
      { label: 'Planned', value: '2' }
    ]
  },
  'slide-6': {
    icon: 'G',
    window_title: 'GRAPHS.BMP',
    title: 'Market Segment Distribution',
    segments: [
      { label: 'Enterprise', value: '42%', color: 'blue' },
      { label: 'Mid-Market', value: '28%', color: 'green' },
      { label: 'Small Business', value: '18%', color: 'cyan' },
      { label: 'Government', value: '12%', color: 'yellow' }
    ],
    insight: 'Enterprise clients continue to drive the majority of revenue, while mid-market accounts show the fastest growth rate.',
    footer: 'Total Addressable Market: $4.2B - Our Share: 8.3%'
  },
  'slide-7': {
    icon: 'M',
    window_title: 'METRICS.LOG',
    title: 'Performance Metrics Dashboard',
    metrics: [
      { title: 'Revenue', value: '$2.1M', delta: '+18.3%' },
      { title: 'Customers', value: '1,482', delta: '+124' },
      { title: 'Retention', value: '94.2%', delta: '+2.1%' },
      { title: 'NPS Score', value: '72', delta: '+5' }
    ],
    kpis: ['Avg. Response Time 124ms', 'System Uptime 99.97%', 'Support Tickets 342 (-12%)', 'Feature Adoption 68%', 'API Calls / Day 4.2M'],
    status: 'All systems operational'
  },
  'slide-8': {
    icon: 'E',
    window_title: 'EXPLORER.EXE',
    title: 'Organizational Structure',
    tree: [
      'Executive Leadership',
      '  Office of the CEO',
      '  Chief of Staff',
      'Engineering',
      '  Platform Team',
      '  Product Engineering',
      'Commercial',
      '  Sales',
      '  Marketing',
      'Operations',
      '  Finance',
      '  People & Culture'
    ],
    rows: [
      ['Engineering', '84', '12'],
      ['Commercial', '56', '8'],
      ['Operations', '32', '4'],
      ['Leadership', '8', '0']
    ],
    plan: 'Planning to expand engineering by 25% and commercial teams by 18% over the next two quarters.',
    total: '180 employees'
  },
  'slide-9': {
    icon: 'T',
    window_title: 'TIMELINE.PRJ',
    title: 'Project Roadmap 2026',
    quarters: [
      { title: 'Q1 2026', status: 'Completed', items: ['Research complete', 'Baseline shipped'] },
      { title: 'Q2 2026', status: 'Completed', items: ['Core migration', 'Partner rollout'] },
      { title: 'Q3 2026', status: 'In Progress', items: ['Advanced analytics', 'Quality gates'], active: true },
      { title: 'Q4 2026', status: 'Planned', items: ['Global launch', 'Operating review'] }
    ],
    milestone: 'Current Milestone: Q3 2026',
    progress: 55,
    cards: [
      { label: 'Risk Level', value: 'MODERATE', color: 'yellow' },
      { label: 'Budget Status', value: 'ON TRACK', color: 'green' },
      { label: 'Next Review', value: 'JUL 15', color: 'blue' }
    ]
  },
  'slide-10': {
    icon: '?',
    window_title: 'SHUTDOWN.EXE',
    title: 'THANK YOU FOR WATCHING',
    body: 'Questions and feedback are always welcome.',
    marquee: 'Contact us at hello@company.example - Visit www.company.example - Follow @companyhandle',
    contacts: [
      { label: 'Email', value: 'hello@example.com' },
      { label: 'Phone', value: '+1 (555) 000-0000' },
      { label: 'Website', value: 'www.example.com' }
    ],
    buttons: ['Restart', 'Contact', 'End Session'],
    footer: '2026 Company Name - All rights reserved - Confidential & Proprietary'
  }
}

function colors() {
  return {
    desk: '#808080',
    face: '#D4D0C8',
    gray: '#C0C0C0',
    dark: '#404040',
    black: '#000000',
    white: '#FFFFFF',
    blue: '#000080',
    blue2: '#0000A0',
    lightBlue: '#1084D0',
    green: '#008000',
    red: '#800000',
    yellow: '#808000',
    cyan: '#008080',
    text: '#222222'
  }
}

function content(spec, variant) {
  return { ...(DEFAULTS[variant] || DEFAULTS['slide-1']), ...(spec.content || {}) }
}

function normalizeVariant(spec) {
  const index = Number(spec.page_family_source?.source_slide_index || 0)
  if (index >= 1 && index <= PAGE_VARIANTS.length) return PAGE_VARIANTS[index - 1]
  const raw = `${spec.renderer_variant_id || ''} ${spec.page_variant_id || ''} ${spec.page_role || ''} ${spec.layout_family || ''}`.toLowerCase().replaceAll('_', '-')
  for (const variant of PAGE_VARIANTS) {
    if (raw.includes(variant)) return variant
  }
  if (raw.includes('agenda') || raw.includes('toc')) return 'slide-2'
  if (raw.includes('summary') || raw.includes('content') || raw.includes('quote')) return 'slide-3'
  if (raw.includes('bar') || raw.includes('revenue') || raw.includes('data')) return 'slide-4'
  if (raw.includes('feature') || raw.includes('detail')) return 'slide-5'
  if (raw.includes('segment') || raw.includes('pie')) return 'slide-6'
  if (raw.includes('metric') || raw.includes('dashboard')) return 'slide-7'
  if (raw.includes('compare') || raw.includes('org') || raw.includes('explorer')) return 'slide-8'
  if (raw.includes('timeline') || raw.includes('process')) return 'slide-9'
  if (raw.includes('closing') || raw.includes('shutdown')) return 'slide-10'
  return 'slide-1'
}

function role(roleName, spec, style = {}) {
  return fontRole(roleName, spec, style)
}

function uiText(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: colors().text,
    fontSize: 14,
    lineHeight: 1.35,
    ...role('body', spec, { fontWeight: 400, lineHeight: 1.35 }),
    ...style
  })
}

function label(value, spec, style = {}) {
  return TextBlock(String(value || ''), {
    color: colors().text,
    fontSize: 12,
    lineHeight: 1.05,
    fontWeight: 700,
    ...role('label', spec, { fontWeight: 700, lineHeight: 1.05, letterSpacing: 0.5 }),
    ...style
  })
}

function display(value, spec, style = {}) {
  return Title(String(value || '').toUpperCase(), {
    color: colors().blue,
    fontSize: 30,
    lineHeight: 1.4,
    fontWeight: 900,
    letterSpacing: 0,
    textAlign: 'center',
    ...role('display', spec, { fontWeight: 900, lineHeight: 1.4, textTransform: 'uppercase' }),
    ...style
  })
}

function metric(value, spec, style = {}) {
  return Title(String(value || ''), {
    color: colors().blue,
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 900,
    ...role('metric', spec, { fontWeight: 900, lineHeight: 1.05 }),
    ...style
  })
}

function root(children) {
  const c = colors()
  return box({ width: CANVAS.width, height: CANVAS.height, position: 'relative', overflow: 'hidden', backgroundColor: c.desk }, [
    ...children,
    box({ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)' })
  ])
}

function raisedStyle(extra = {}) {
  const c = colors()
  return {
    backgroundColor: c.face,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: c.white,
    borderLeftColor: c.white,
    borderRightColor: c.black,
    borderBottomColor: c.black,
    ...extra
  }
}

function sunkenStyle(extra = {}) {
  const c = colors()
  return {
    backgroundColor: c.white,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: c.dark,
    borderLeftColor: c.dark,
    borderRightColor: c.white,
    borderBottomColor: c.white,
    ...extra
  }
}

function windowFrame(spec, cfg, children) {
  const c = colors()
  const width = cfg.width || 760
  const height = cfg.height || 486
  const left = cfg.left ?? Math.round((CANVAS.width - width) / 2)
  const top = cfg.top ?? Math.round((CANVAS.height - height) / 2)
  return box(raisedStyle({ position: 'absolute', left, top, width, height, flexDirection: 'column' }), [
    titlebar(spec, cfg),
    box({ flex: 1, padding: cfg.padding || 24, flexDirection: 'column', minHeight: 0 }, children)
  ])
}

function titlebar(spec, cfg) {
  const c = colors()
  return box({ width: '100%', height: 24, backgroundColor: cfg.inactive ? c.dark : c.blue, padding: '3px 5px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
    box({ flexDirection: 'row', alignItems: 'center' }, [
      box({ width: 16, height: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.black, alignItems: 'center', justifyContent: 'center', marginRight: 6 }, [
        label(cfg.icon || 'P', spec, { color: c.blue, fontSize: 9, lineHeight: 1 })
      ]),
      label(cfg.title || 'WINDOW.EXE', spec, { color: c.white, fontSize: 12, lineHeight: 1 })
    ]),
    box({ flexDirection: 'row', gap: 3 }, ['_', '[]', 'X'].map((button) =>
      box(raisedStyle({ width: 17, height: 16, alignItems: 'center', justifyContent: 'center', padding: 0 }), [
        label(button, spec, { fontSize: 8, lineHeight: 1 })
      ])
    ))
  ])
}

function button(text, spec, width = 82) {
  return box(raisedStyle({ width, height: 26, alignItems: 'center', justifyContent: 'center', padding: 0 }), [
    uiText(text, spec, { fontSize: 12, lineHeight: 1 })
  ])
}

function panel(children, raised = true, extra = {}) {
  const style = raised ? raisedStyle(extra) : sunkenStyle(extra)
  return box({ ...style, padding: extra.padding || 12, flexDirection: extra.flexDirection || 'column' }, children)
}

function groupBox(title, spec, children, extra = {}) {
  const c = colors()
  return box(sunkenStyle({ position: 'relative', padding: '20px 14px 12px 14px', flexDirection: 'column', ...extra }), [
    box({ position: 'absolute', left: 12, top: -8, backgroundColor: c.face, padding: '0 7px' }, [
      label(title, spec, { fontSize: 11, lineHeight: 1 })
    ]),
    ...children
  ])
}

function rule() {
  const c = colors()
  return box({ height: 2, width: '100%', borderTopWidth: 1, borderTopColor: c.dark, borderBottomWidth: 1, borderBottomColor: c.white, margin: '8px 0 14px 0' })
}

function progress(value, height = 22) {
  const c = colors()
  return box(sunkenStyle({ width: '100%', height, padding: 2 }), [
    box({ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`, height: '100%', backgroundColor: c.blue })
  ])
}

function bulletList(items, spec, size = 14) {
  return box({ flexDirection: 'column', gap: 8 }, (items || []).map((item) =>
    box({ flexDirection: 'row', alignItems: 'flex-start' }, [
      label('>', spec, { color: colors().blue, fontSize: size, marginRight: 7 }),
      uiText(item, spec, { fontSize: size, lineHeight: 1.25, flex: 1 })
    ])
  ))
}

function renderCover(spec) {
  const c = content(spec, 'slide-1')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 720, height: 504, top: 18, padding: '40px 44px 28px 44px' }, [
      box({ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
        metric('HOURGLASS', spec, { fontSize: 14, color: colors().black, marginBottom: 26 }),
        display(c.title, spec, { fontSize: 28, marginBottom: 28 }),
        panel([uiText(c.marquee, spec, { fontSize: 14, whiteSpace: 'nowrap' })], false, { width: 540, height: 40, padding: 8, marginBottom: 20, overflow: 'hidden' }),
        uiText(c.body, spec, { fontSize: 13, color: colors().dark, marginBottom: 20 }),
        box({ flexDirection: 'row', gap: 10, marginBottom: 28 }, (c.buttons || []).map((item) => button(item, spec, 80))),
        rule(),
        uiText(c.footer, spec, { fontSize: 11, color: colors().dark })
      ])
    ])
  ])
}

function renderAgenda(spec) {
  const c = content(spec, 'slide-2')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 818, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 22, marginBottom: 6 }),
      uiText(c.subtitle, spec, { color: colors().dark, fontSize: 12 }),
      rule(),
      box({ flex: 1, flexDirection: 'row', gap: 24, minHeight: 0 }, [
        groupBox(c.primary_title, spec, [bulletList(c.primary, spec)], { flex: 1 }),
        groupBox(c.secondary_title, spec, [bulletList(c.secondary, spec)], { flex: 1 })
      ]),
      panel([
        box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
          box({ flexDirection: 'row', gap: 8 }, [uiText('Status:', spec, { fontSize: 12, color: colors().dark }), label(c.status, spec, { color: colors().green, fontSize: 12 })]),
          box({ flexDirection: 'row', gap: 20 }, ['x Notify participants', '[ ] Record session'].map((item) => uiText(item, spec, { fontSize: 12 })))
        ])
      ], true, { marginTop: 16, padding: 10 }),
      panel([
        box({ flexDirection: 'row', justifyContent: 'space-between' }, (c.footer || []).map((item) => uiText(item, spec, { fontSize: 11, color: colors().dark })))
      ], false, { marginTop: 12, padding: 8 })
    ])
  ])
}

function renderSummary(spec) {
  const c = content(spec, 'slide-3')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 818, height: 488, top: 26 }, [
      panel([label(c.title, spec, { color: colors().blue, fontSize: 23 })], true, { backgroundColor: colors().white, marginBottom: 16, padding: 16 }),
      uiText(c.body, spec, { fontSize: 16, lineHeight: 1.55, marginBottom: 18 }),
      box({ flex: 1, flexDirection: 'row', gap: 18 }, (c.boxes || []).slice(0, 2).map((item) =>
        groupBox(item.title, spec, [uiText(item.body, spec, { fontSize: 16, lineHeight: 1.55 })], { flex: 1, justifyContent: 'center' })
      )),
      box({ flexDirection: 'row', gap: 12, marginTop: 16 }, (c.stats || []).slice(0, 4).map((item) =>
        panel([
          uiText(item.label, spec, { fontSize: 11, color: colors().dark, textAlign: 'center', marginBottom: 4 }),
          label(item.value, spec, { fontSize: 14, textAlign: 'center', color: item.accent === 'green' ? colors().green : colors().text })
        ], false, { flex: 1, alignItems: 'center' })
      ))
    ])
  ])
}

function renderData(spec) {
  const c = content(spec, 'slide-4')
  const bars = c.bars || []
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
        label(c.title, spec, { color: colors().blue, fontSize: 22 }),
        box({ flexDirection: 'row', gap: 8 }, (c.buttons || []).map((item) => button(item, spec, 66)))
      ]),
      rule(),
      box({ flex: 1, flexDirection: 'row', gap: 18, minHeight: 0 }, [
        panel([
          box({ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 28, padding: '28px 32px 18px 32px' }, bars.map((item) =>
            box({ flex: 1, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column' }, [
              box({ width: 42, height: Number(item.height || 50) * 3, backgroundColor: colors().blue }),
              uiText(item.label, spec, { fontSize: 11, marginTop: 8 })
            ])
          ))
        ], true, { flex: 1.05, minHeight: 0 }),
        box({ flex: 1, gap: 16, flexDirection: 'column' }, [
          groupBox('Highlights', spec, [bulletList(c.highlights, spec, 13)], { minHeight: 126 }),
          panel([
            table(spec, ['Quarter', 'Revenue', 'Growth'], bars.map((item) => [item.label, item.value, item.growth]), { greenLast: true })
          ], false, { flex: 1, padding: 10 })
        ])
      ]),
      panel([
        box({ flexDirection: 'row', justifyContent: 'space-between' }, (c.footer || []).map((item) => uiText(item, spec, { fontSize: 11, color: colors().dark })))
      ], true, { marginTop: 14, padding: 9 })
    ])
  ])
}

function renderFeatures(spec) {
  const c = content(spec, 'slide-5')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 21 }),
      uiText(c.subtitle, spec, { fontSize: 12, color: colors().dark }),
      rule(),
      box({ flex: 1, flexDirection: 'row', gap: 18, minHeight: 0 }, [
        box({ flex: 1, gap: 14, flexDirection: 'column' }, [
          groupBox('Core Modules', spec, (c.modules || []).map((item) =>
            box({ marginBottom: 10 }, [
              uiText(`${item.open ? '[ ]' : '[x]'} ${item.title}`, spec, { fontSize: 12, marginBottom: 4 }),
              progress(item.value, 16)
            ])
          ), { flex: 1 }),
          panel([
            uiText('Overall Completion', spec, { fontSize: 12, color: colors().dark, marginBottom: 5 }),
            progress(86, 22),
            metric('86%', spec, { fontSize: 20, textAlign: 'right', marginTop: 4 })
          ], true)
        ]),
        box({ flex: 1, gap: 14, flexDirection: 'column' }, [
          groupBox('Module Details', spec, (c.details || []).map((item) => panel([uiText(item, spec, { fontSize: 11, lineHeight: 1.35 })], false, { marginBottom: 8, padding: 8 })), { flex: 1 }),
          box({ flexDirection: 'row', gap: 10 }, (c.metrics || []).map((item) =>
            panel([
              uiText(item.label, spec, { fontSize: 10, color: colors().dark, textAlign: 'center' }),
              metric(item.value, spec, { fontSize: 21, textAlign: 'center' })
            ], false, { flex: 1, alignItems: 'center', padding: 8 })
          ))
        ])
      ])
    ])
  ])
}

function renderSegments(spec) {
  const c = content(spec, 'slide-6')
  const colorMap = { blue: colors().blue, green: colors().green, cyan: colors().cyan, yellow: colors().yellow }
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 21 }),
      rule(),
      box({ flex: 1, flexDirection: 'row', gap: 18 }, [
        panel([
          box({ width: 230, height: 230, borderRadius: 115, borderWidth: 46, borderColor: colors().blue, alignItems: 'center', justifyContent: 'center' }, [
            metric('42%', spec, { fontSize: 30 }),
            uiText('ENTERPRISE', spec, { fontSize: 10 })
          ])
        ], true, { flex: 1, alignItems: 'center', justifyContent: 'center' }),
        box({ flex: 1, gap: 14, flexDirection: 'column' }, [
          groupBox('Segment Breakdown', spec, (c.segments || []).map((item, idx) =>
            box({ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: idx % 2 === 0 ? '#ECE9DF' : colors().face, padding: 8, marginBottom: 4 }, [
              uiText(`${String.fromCharCode(9632)} ${item.label}`, spec, { color: colorMap[item.color] || colors().blue, fontSize: 14 }),
              label(item.value, spec, { fontSize: 14 })
            ])
          )),
          panel([
            label('Key Insight', spec, { fontSize: 14, marginBottom: 8 }),
            uiText(c.insight, spec, { fontSize: 12, lineHeight: 1.45 })
          ], true, { flex: 1, justifyContent: 'center' }),
          panel([uiText(c.footer, spec, { fontSize: 12, color: colors().dark })], false, { padding: 10 })
        ])
      ])
    ])
  ])
}

function renderMetrics(spec) {
  const c = content(spec, 'slide-7')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 21 }),
      rule(),
      box({ flexDirection: 'row', gap: 12, marginBottom: 16 }, (c.metrics || []).slice(0, 4).map((item) =>
        groupBox(item.title, spec, [
          metric(item.value, spec, { fontSize: 28, textAlign: 'center', marginBottom: 4 }),
          label(`UP ${item.delta}`, spec, { color: colors().green, fontSize: 11, textAlign: 'center' })
        ], { flex: 1, alignItems: 'center' })
      )),
      box({ flex: 1, flexDirection: 'row', gap: 18, minHeight: 0 }, [
        panel([
          label('Monthly Active Users Trend', spec, { fontSize: 13, marginBottom: 16 }),
          lineChart(spec)
        ], true, { flex: 1 }),
        box({ flex: 1, gap: 14, flexDirection: 'column' }, [
          groupBox('Operational KPIs', spec, (c.kpis || []).map((item) =>
            box({ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, [
              uiText(item.replace(/ [^ ]+$/, ''), spec, { fontSize: 12 }),
              label(item.split(' ').slice(-1)[0], spec, { fontSize: 12 })
            ])
          ), { flex: 1 }),
          panel([
            box({ flexDirection: 'row', justifyContent: 'space-between' }, [
              uiText(c.status, spec, { fontSize: 12, color: colors().dark }),
              label('LIVE', spec, { color: colors().green, fontSize: 12 })
            ])
          ], false, { padding: 10 })
        ])
      ])
    ])
  ])
}

function renderExplorer(spec) {
  const c = content(spec, 'slide-8')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 21 }),
      rule(),
      box({ flex: 1, flexDirection: 'row', gap: 18, minHeight: 0 }, [
        panel([
          uiText('C:\\ORG\\STRUCTURE', spec, { fontSize: 12, color: colors().dark, marginBottom: 12 }),
          box({ flexDirection: 'column', gap: 5 }, (c.tree || []).slice(0, 12).map((item) => {
            const depth = item.startsWith('  ') ? 20 : 0
            const clean = item.trim()
            const prefix = depth ? '+ [FILE]' : '- [DIR]'
            return uiText(`${prefix} ${clean}`, spec, { fontSize: 12, marginLeft: depth, fontWeight: depth ? 400 : 700 })
          }))
        ], false, { flex: 1.05, padding: 14 }),
        box({ flex: 1, gap: 16, flexDirection: 'column' }, [
          groupBox('Department Headcount', spec, [table(spec, ['Department', 'Headcount', 'Open Roles'], c.rows || [])], { flex: 1 }),
          panel([
            label('Growth Plan', spec, { fontSize: 13, marginBottom: 10 }),
            uiText(c.plan, spec, { fontSize: 12, lineHeight: 1.45, marginBottom: 12 }),
            box({ flexDirection: 'row', gap: 8 }, ['Engineering: +21', 'Sales: +10', 'Support: +6'].map((item) => panel([uiText(item, spec, { fontSize: 10 })], false, { padding: 6 })))
          ], true, { flex: 1, justifyContent: 'center' }),
          panel([
            box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, [
              uiText('Total Organization', spec, { fontSize: 12, color: colors().dark }),
              metric(c.total, spec, { fontSize: 24 })
            ])
          ], false, { padding: 8 })
        ])
      ])
    ])
  ])
}

function renderTimeline(spec) {
  const c = content(spec, 'slide-9')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 820, height: 488, top: 26 }, [
      label(c.title, spec, { color: colors().blue, fontSize: 21 }),
      rule(),
      box({ flexDirection: 'row', gap: 10, marginBottom: 16 }, (c.quarters || []).slice(0, 4).map((item) =>
        box(raisedStyle({ flex: 1, flexDirection: 'column' }), [
          box({ width: '100%', height: 22, backgroundColor: item.active ? colors().blue : colors().dark, alignItems: 'center', justifyContent: 'center' }, [
            label(item.title, spec, { color: colors().white, fontSize: 10 })
          ]),
          box({ padding: 10, flexDirection: 'column' }, [
            uiText(`${item.status === 'Completed' ? '[x]' : '[ ]'} ${item.status}`, spec, { fontSize: 11, fontWeight: 700, marginBottom: 8 }),
            bulletList(item.items, spec, 10)
          ])
        ])
      )),
      panel([
        label(c.milestone, spec, { fontSize: 13, marginBottom: 10 }),
        box({ flexDirection: 'row', alignItems: 'center', gap: 14 }, [
          box({ flex: 1 }, [progress(c.progress, 22)]),
          metric(`${c.progress}%`, spec, { fontSize: 22 }),
          uiText('6 of 11 milestones', spec, { fontSize: 10, color: colors().dark })
        ])
      ], true, { marginBottom: 16 }),
      box({ flexDirection: 'row', gap: 16 }, (c.cards || []).map((item) =>
        groupBox(item.label, spec, [
          label(item.value, spec, { color: colors()[item.color] || colors().blue, fontSize: 16, textAlign: 'center', marginTop: 8 })
        ], { flex: 1, alignItems: 'center' })
      ))
    ])
  ])
}

function renderClosing(spec) {
  const c = content(spec, 'slide-10')
  return root([
    windowFrame(spec, { title: c.window_title, icon: c.icon, width: 680, height: 504, top: 18, padding: '52px 40px 28px 40px' }, [
      box({ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }, [
        metric('Z Z Z', spec, { fontSize: 22, marginBottom: 26 }),
        display(c.title, spec, { fontSize: 22, marginBottom: 24 }),
        uiText(c.body, spec, { fontSize: 16, textAlign: 'center', marginBottom: 22 }),
        panel([uiText(c.marquee, spec, { fontSize: 13, whiteSpace: 'nowrap' })], false, { width: 520, height: 40, padding: 8, marginBottom: 22, overflow: 'hidden' }),
        box({ flexDirection: 'row', gap: 16, marginBottom: 22 }, (c.contacts || []).map((item) =>
          box({ alignItems: 'center', minWidth: 120 }, [
            uiText(item.label, spec, { fontSize: 11, color: colors().dark, marginBottom: 4 }),
            label(item.value, spec, { fontSize: 13 })
          ])
        )),
        box({ flexDirection: 'row', gap: 10, marginBottom: 24 }, (c.buttons || []).map((item) => button(item, spec, 92))),
        rule(),
        uiText(c.footer, spec, { fontSize: 11, color: colors().dark })
      ])
    ])
  ])
}

function table(spec, headers, rows, opts = {}) {
  const c = colors()
  const safeRows = rows || []
  return box({ flexDirection: 'column', width: '100%', borderWidth: 1, borderColor: c.dark }, [
    box({ flexDirection: 'row', backgroundColor: c.gray }, headers.map((header) =>
      box({ flex: 1, padding: 7, borderRightWidth: 1, borderRightColor: c.dark }, [label(header, spec, { fontSize: 11 })])
    )),
    ...safeRows.map((row, rowIndex) =>
      box({ flexDirection: 'row', backgroundColor: rowIndex % 2 ? c.white : '#F0F0F0' }, row.map((cell, cellIndex) =>
        box({ flex: 1, padding: 7, borderTopWidth: 1, borderTopColor: c.gray, borderRightWidth: 1, borderRightColor: c.gray }, [
          uiText(cell, spec, { fontSize: 11, color: opts.greenLast && cellIndex === row.length - 1 ? c.green : c.text, fontWeight: opts.greenLast && cellIndex === row.length - 1 ? 700 : 400 })
        ])
      ))
    )
  ])
}

function lineChart(spec) {
  const c = colors()
  const points = [42, 58, 50, 68, 74, 86]
  return box(sunkenStyle({ flex: 1, position: 'relative', padding: 16, minHeight: 160 }), [
    ...[0, 1, 2, 3].map((row) => box({ position: 'absolute', left: 16, right: 16, top: 28 + row * 34, height: 1, backgroundColor: c.gray })),
    box({ position: 'absolute', left: 40, bottom: 24, width: 46, height: points[0], backgroundColor: c.blue }),
    box({ position: 'absolute', left: 110, bottom: 24, width: 46, height: points[1], backgroundColor: c.lightBlue }),
    box({ position: 'absolute', left: 180, bottom: 24, width: 46, height: points[2], backgroundColor: c.cyan }),
    box({ position: 'absolute', left: 250, bottom: 24, width: 46, height: points[3], backgroundColor: c.green }),
    box({ position: 'absolute', left: 320, bottom: 24, width: 46, height: points[4], backgroundColor: c.yellow }),
    box({ position: 'absolute', left: 390, bottom: 24, width: 46, height: points[5], backgroundColor: c.blue })
  ])
}

const RENDERERS = {
  'slide-1': renderCover,
  'slide-2': renderAgenda,
  'slide-3': renderSummary,
  'slide-4': renderData,
  'slide-5': renderFeatures,
  'slide-6': renderSegments,
  'slide-7': renderMetrics,
  'slide-8': renderExplorer,
  'slide-9': renderTimeline,
  'slide-10': renderClosing
}

export function renderRetroUiDashboard(spec) {
  const variant = normalizeVariant(spec)
  return (RENDERERS[variant] || renderCover)(spec)
}
