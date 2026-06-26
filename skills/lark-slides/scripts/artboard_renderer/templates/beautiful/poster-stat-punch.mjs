import { TextBlock, Title, box } from '../../components/primitives.mjs'
import { fontRole } from '../../components/typography.mjs'

export const templateId = 'poster-stat-punch'

export const rendererContract = {
  template_id: templateId,
  renderer_id: `artboard_satori.${templateId}`,
  status: 'needs_review',
  renderer_stage: 'page_family',
  default_selectable: false,
  selection_scope: 'experimental',
  source_family: 'bold-poster',
  implemented_page_variants: ['hero', 'red', 'summary', 'financial', 'stat', 'services', 'roadmap', 'pillars', 'global', 'close'],
  required_font_roles: ['display', 'body', 'label', 'metric'],
  reference_screenshot: 'beautiful-html-templates/screenshots/bold-poster-1.png'
}

const CANVAS = { width: 960, height: 540 }

const DEFAULT_CONTENT = {
  hero: {
    meta: 'Q3 Strategic Overview - Fiscal Year 2026',
    title: 'Apex Group Ltd.',
    tag_label: 'Annual Report',
    subtitle: 'Building scalable solutions for enterprise partners worldwide since 2019.'
  },
  red: {
    quote: '"We don\'t follow markets. We build the infrastructure they run on."',
    cite: '- Our operating thesis since day one'
  },
  summary: {
    title: 'Executive Summary',
    columns: [
      'Apex Group Ltd. partners with ambitious enterprise teams to turn complex operational challenges into scalable software infrastructure. Founded in 2019, we now serve 48 active clients across fintech, logistics, and SaaS verticals in 12 countries.\n\nOur platform model combines strategic consulting, product design, and engineering execution under one engagement structure, eliminating handoff delays and knowledge loss.',
      'This fiscal year we delivered 14 major product releases, achieved SOC 2 Type II certification, reduced API latency by 40% at the 99th percentile, and launched a self-serve tier for mid-market customers.\n\nLooking ahead, we are expanding into EMEA and APAC through two new regional hubs, targeting $18M ARR by Q4 2026.'
    ],
    highlights: [
      { value: '340%', label: 'YoY Revenue Growth', body: 'From $2.7M to $12M ARR in 24 months with positive unit economics.' },
      { value: '94%', label: 'Gross Retention', body: 'Enterprise clients renew at industry-leading rates with zero churn in top quartile.' },
      { value: '120', label: 'Team Members', body: 'Engineering, design, and strategy distributed across four continents.' }
    ]
  },
  financial: {
    title: 'Financial Performance',
    cells: [
      { value: '$12.4M', label: 'Annual Recurring Revenue', body: 'Net revenue retention of 118% driven by expansion revenue from existing accounts.', micro: 'Up from $2.7M two years prior.' },
      { value: '18%', label: 'Net Profit Margin', body: 'Profitable for six consecutive quarters while reinvesting 35% of gross profit into R&D.', micro: 'EBITDA positive since Q2 FY24.' },
      { value: '$420', label: 'Avg. Contract Value', body: 'Enterprise ACV measured in thousands. Median contract length is 24 months.', micro: 'Top decile ACV: $1.8M.' },
      { value: '4.2x', label: 'LTV / CAC Ratio', body: 'Customer lifetime value of $48K against blended acquisition cost of $11.4K across all channels.', micro: 'Enterprise segment: 6.8x.' },
      { value: '8 mo', label: 'Cash Runway', body: '$8.2M cash on hand with monthly burn of $980K, fully funded to profitability.', micro: 'Series A closed March 2025.' },
      { value: '$18M', label: 'FY27 Revenue Target', body: 'Projected ARR by March 2027 based on current pipeline velocity and expansion assumptions.', micro: 'Weighted pipeline: $31M.' }
    ]
  },
  stat: {
    value: '96%',
    items: [
      { value: '48', label: 'Active Clients' },
      { value: '12', label: 'Countries' },
      { value: '99.97%', label: 'Platform Uptime' }
    ],
    context: 'Customer satisfaction score across all active engagements, measured quarterly via NPS and CSAT composite.'
  },
  services: {
    title: 'Service Lines',
    cards: [
      { title: 'Strategy', body: 'Market analysis, competitive positioning, and multi-year roadmaps that bridge ambition with executable milestones.', bullets: ['Market sizing and TAM analysis', 'Competitive landscape mapping', 'Pricing strategy and packaging design', 'M&A target identification'] },
      { title: 'Design', body: 'Product design, brand systems, and user research that make complexity feel effortless to end users.', bullets: ['UX research and journey mapping', 'Design systems at scale', 'Prototyping and usability testing', 'Brand identity and visual language'] },
      { title: 'Build', body: 'Scalable architecture, robust APIs, and infrastructure that grows with demand rather than against it.', bullets: ['Cloud-native architecture design', 'API development and developer experience', 'Security audit and compliance engineering', 'CI/CD pipelines and observability'] },
      { title: 'Scale', body: 'Go-to-market planning, partner programs, and revenue operations that compound quarter over quarter.', bullets: ['Partner channel development', 'Sales process and tooling', 'Customer success playbooks', 'Revenue operations and forecasting'] }
    ]
  },
  roadmap: {
    phases: [
      { label: 'Phase One - Complete (FY22-FY24)', title: 'Foundation', body: 'Core platform refined. Enterprise-grade compliance and security architecture shipped across three verticals.', bullets: ['14 major product releases this quarter', 'SOC 2 Type II and ISO 27001 certifications', 'API latency reduced 40% at p99', 'Self-serve onboarding launched'] },
      { label: 'Phase Two - Current (FY25)', title: 'Expansion', body: 'Two new regional hubs, localized compliance infrastructure, partner activation, and sales scaling.', bullets: ['EMEA hub operational in London', 'APAC hub in Singapore scheduled Q2', '5 strategic partners signed', 'Localized pricing and tax handling live'] },
      { label: 'Phase Three - FY26-FY27', title: 'Platformization', body: 'Opening core infrastructure to certified developers and system integrators through a marketplace model.', bullets: ['Developer portal and sandbox', 'App marketplace with revenue sharing', 'Partner certification program', 'White-label licensing for enterprises'] },
      { label: 'Phase Four - FY28+', title: 'Ecosystem', body: 'Becoming the default infrastructure layer for the vertical across global markets.', bullets: ['Strategic M&A for complementary capabilities', 'Industry consortium founding', 'Open-source components for trust', 'Target: 500+ active partners'] }
    ]
  },
  pillars: {
    pillars: [
      { number: '01', title: 'Clarity', lead: 'Every decision is documented, traceable, and communicated with context.', bullets: ['Clear DRI assigned to every initiative', 'Public dashboards with real-time metrics', 'Decision logs published within 24 hours', 'Weekly all-hands with open Q&A', 'Written strategy docs preferred over decks', 'OKRs visible to all employees'] },
      { number: '02', title: 'Velocity', lead: 'Speed comes from focus and tooling, not from working longer hours.', bullets: ['Two-week sprints with retrospectives', 'CI/CD with production deploys every day', 'Feature flags for gradual rollouts', 'Direct customer feedback every cycle', 'Bi-weekly demos open to stakeholders', 'Automated testing at 94% coverage'] },
      { number: '03', title: 'Trust', lead: 'Radical transparency with partners, employees, and the market.', bullets: ['Real-time uptime dashboards shared externally', 'Quarterly business reviews with all clients', 'Security reports published proactively', '90-day exit clauses in every contract', 'Named account engineers for enterprise tier', 'Open API status page with incident history'] }
    ]
  },
  global: {
    title: 'Global Presence',
    cards: [
      { label: 'Headquarters', title: 'San Francisco', body: 'Primary engineering, design, and executive leadership based in the Bay Area. Founded here in 2019.', stats: [{ value: '65', label: 'employees' }, { value: '42K', label: 'sq ft office' }] },
      { label: 'Regional Hub', title: 'London', body: 'EMEA sales, customer success, and compliance operations for UK, EU, and Middle East clients.', stats: [{ value: '28', label: 'employees' }, { value: '18', label: 'clients live' }] },
      { label: 'Regional Hub', title: 'Singapore', body: 'APAC expansion hub launching Q2 2026, focused on fintech and logistics verticals.', stats: [{ value: '12', label: 'employees' }, { value: '4', label: 'clients pilot' }] },
      { label: 'Distributed', title: 'Remote Network', body: 'Engineering and design talent in 8 additional countries with an async-first operating model.', stats: [{ value: '15', label: 'remote staff' }, { value: '8', label: 'time zones' }] }
    ]
  },
  close: {
    title: 'Thank You',
    subtitle: 'Ready to explore what we can build together?\nhello@apexgroup.co - San Francisco - Worldwide',
    links: ['LinkedIn', 'Contact', 'Careers']
  }
}

function colors(spec) {
  const source = spec.theme?.colors || {}
  return {
    background: source.background || '#FFFFFF',
    paper: source.surface || '#F5F2EF',
    text: source.text || '#1C1410',
    muted: source.muted || '#7B706A',
    red: source.primary || '#D8000F',
    line: source.accent || '#1C1410'
  }
}

function text(spec, key, fallback = '') {
  const value = spec.content?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function arrayValue(spec, key, fallback = []) {
  const value = spec.content?.[key]
  return Array.isArray(value) && value.length ? value : fallback
}

function objectArray(spec, keys, fallback = []) {
  for (const key of keys) {
    const value = spec.content?.[key]
    if (Array.isArray(value) && value.some((item) => item && typeof item === 'object')) {
      return value.filter((item) => item && typeof item === 'object')
    }
  }
  return fallback
}

function normalizeVariant(spec) {
  const raw = `${spec.renderer_variant_id || spec.page_variant_id || spec.page_role || ''}`.toLowerCase()
  if (raw.includes('red') || raw.includes('quote') || raw.includes('statement')) return 'red'
  if (raw.includes('summary') || raw.includes('agenda')) return 'summary'
  if (raw.includes('financial')) return 'financial'
  if (raw.includes('stat')) return 'stat'
  if (raw.includes('service')) return 'services'
  if (raw.includes('roadmap') || raw.includes('timeline') || raw.includes('process')) return 'roadmap'
  if (raw.includes('pillar') || raw.includes('comparison')) return 'pillars'
  if (raw.includes('global') || raw.includes('detail')) return 'global'
  if (raw.includes('close') || raw.includes('closing') || raw.includes('final')) return 'close'
  return 'hero'
}

function splitPosterTitle(title) {
  const cleaned = title || DEFAULT_CONTENT.hero.title
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 3) return { top: words[0], red: words[1], tail: words.slice(2).join(' ') }
  if (words.length === 2) return { top: words[0], red: words[1], tail: 'Ltd.' }
  return { top: cleaned, red: 'Group', tail: 'Ltd.' }
}

function frame(spec, children, { background = null, color = null } = {}) {
  const theme = colors(spec)
  return box(
    {
      width: CANVAS.width,
      height: CANVAS.height,
      position: 'relative',
      backgroundColor: background || theme.background,
      color: color || theme.text,
      overflow: 'hidden'
    },
    [
      ...children,
      TextBlock(String(spec.page_family_source?.source_slide_index || ''), {
        position: 'absolute',
        right: 20,
        bottom: 16,
        width: 70,
        opacity: 0.45,
        color: color || theme.text,
        fontSize: 8,
        letterSpacing: 2,
        textAlign: 'right',
        ...fontRole('label', spec, { fontWeight: 600 })
      })
    ]
  )
}

function displayText(value, spec, style = {}) {
  return Title(value, {
    color: colors(spec).text,
    ...fontRole('display', spec, { fontWeight: 900 }),
    textTransform: 'none',
    ...style
  })
}

function metricText(value, spec, style = {}) {
  return TextBlock(value, {
    color: colors(spec).red,
    ...fontRole('metric', spec, { fontWeight: 900 }),
    ...style
  })
}

function bodyText(value, spec, style = {}) {
  return TextBlock(value, {
    color: colors(spec).text,
    fontSize: 13,
    lineHeight: 1.6,
    ...fontRole('body', spec, { fontWeight: 400 }),
    ...style
  })
}

function labelText(value, spec, style = {}) {
  return TextBlock(value, {
    color: colors(spec).red,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    ...fontRole('label', spec, { fontWeight: 600 }),
    ...style
  })
}

function shadowDisplay(value, spec, style = {}) {
  const theme = colors(spec)
  return [
    displayText(value, spec, { ...style, left: style.left + 6, top: style.top + 6, color: theme.text, opacity: 0.15 }),
    displayText(value, spec, { ...style, left: style.left + 4, top: style.top + 4, color: theme.text, opacity: 0.2 }),
    displayText(value, spec, { ...style, left: style.left + 2, top: style.top + 2, color: theme.text, opacity: 0.25 }),
    displayText(value, spec, { ...style, color: theme.background })
  ]
}

function renderHero(spec) {
  const theme = colors(spec)
  const title = splitPosterTitle(text(spec, 'title', DEFAULT_CONTENT.hero.title))
  return frame(
    spec,
    [
      bodyText(text(spec, 'meta', text(spec, 'hero_meta', DEFAULT_CONTENT.hero.meta)), spec, {
        position: 'absolute',
        left: 68,
        top: 52,
        width: 360,
        color: theme.text,
        opacity: 0.62,
        fontSize: 11,
        lineHeight: 1.4,
        letterSpacing: 0.5
      }),
      displayText(title.top, spec, {
        position: 'absolute',
        left: 66,
        top: 76,
        width: 700,
        fontSize: 112,
        lineHeight: 0.88,
        letterSpacing: 1
      }),
      displayText(title.red, spec, {
        position: 'absolute',
        left: 58,
        top: 165,
        width: 720,
        color: theme.red,
        fontSize: 132,
        lineHeight: 0.85,
        letterSpacing: 1,
        transform: 'rotate(-4deg)'
      }),
      displayText(title.tail, spec, {
        position: 'absolute',
        left: 66,
        top: 292,
        width: 620,
        color: theme.text,
        fontSize: 96,
        lineHeight: 0.9,
        transform: 'rotate(2deg)'
      }),
      labelText(text(spec, 'tag_label', DEFAULT_CONTENT.hero.tag_label), spec, {
        position: 'absolute',
        right: 66,
        bottom: 116,
        width: 240,
        textAlign: 'right'
      }),
      bodyText(text(spec, 'subtitle', DEFAULT_CONTENT.hero.subtitle), spec, {
        position: 'absolute',
        right: 66,
        bottom: 58,
        width: 292,
        color: theme.text,
        fontSize: 13,
        lineHeight: 1.55,
        textAlign: 'right'
      })
    ],
    { progress: 0.1 }
  )
}

function renderRed(spec) {
  const theme = colors(spec)
  return frame(
    spec,
    [
      ...shadowDisplay(text(spec, 'quote', DEFAULT_CONTENT.red.quote), spec, {
        position: 'absolute',
        left: 88,
        top: 150,
        width: 790,
        fontSize: 55,
        lineHeight: 1.13,
        textAlign: 'center'
      }),
      bodyText(text(spec, 'cite', DEFAULT_CONTENT.red.cite), spec, {
        position: 'absolute',
        left: 220,
        top: 386,
        width: 520,
        color: theme.background,
        opacity: 0.84,
        fontSize: 14,
        lineHeight: 1.5,
        textAlign: 'center'
      })
    ],
    { background: theme.red, color: theme.background, progress: 0.2 }
  )
}

function highlightCard(item, spec, index) {
  const theme = colors(spec)
  return box(
    {
      width: 282,
      minHeight: 118,
      flexDirection: 'column',
      borderWidth: 1.5,
      borderColor: theme.text,
      padding: '17px 19px',
      backgroundColor: theme.background
    },
    [
      metricText(String(item.value || item.num || `${index + 1}`), spec, { fontSize: 39, lineHeight: 1, marginBottom: 6 }),
      labelText(String(item.label || 'Highlight'), spec, { color: theme.text, fontSize: 9, marginBottom: 6 }),
      bodyText(String(item.body || item.description || ''), spec, { fontSize: 11, lineHeight: 1.45, opacity: 0.76 })
    ]
  )
}

function renderSummary(spec) {
  const theme = colors(spec)
  const columns = arrayValue(spec, 'columns', DEFAULT_CONTENT.summary.columns).slice(0, 2)
  const highlights = objectArray(spec, ['highlights', 'metrics'], DEFAULT_CONTENT.summary.highlights).slice(0, 3)
  return frame(
    spec,
    [
      displayText(text(spec, 'title', DEFAULT_CONTENT.summary.title), spec, {
        position: 'absolute',
        left: 58,
        top: 58,
        width: 720,
        fontSize: 52,
        lineHeight: 1
      }),
      ...columns.map((column, index) =>
        bodyText(String(column), spec, {
          position: 'absolute',
          left: index === 0 ? 60 : 500,
          top: 138,
          width: 398,
          color: theme.text,
          fontSize: 13,
          lineHeight: 1.68,
          whiteSpace: 'pre-wrap'
        })
      ),
      box(
        {
          position: 'absolute',
          left: 60,
          bottom: 54,
          width: 846,
          flexDirection: 'row',
          borderWidth: 2,
          borderColor: theme.text
        },
        highlights.map((item, index) => highlightCard(item, spec, index))
      )
    ],
    { progress: 0.3 }
  )
}

function financialCell(item, spec, style = {}) {
  const theme = colors(spec)
  return box(
    {
      width: 282,
      height: 130,
      flexDirection: 'column',
      borderWidth: 1.5,
      borderColor: theme.text,
      padding: '15px 17px',
      ...style
    },
    [
      metricText(String(item.value || item.num || ''), spec, { fontSize: 35, lineHeight: 1, marginBottom: 7 }),
      labelText(String(item.label || 'Metric'), spec, { color: theme.text, fontSize: 8.5, marginBottom: 7 }),
      bodyText(String(item.body || item.description || ''), spec, { fontSize: 10.5, lineHeight: 1.42, opacity: 0.8, marginBottom: 6 }),
      bodyText(String(item.micro || ''), spec, { fontSize: 9, lineHeight: 1.25, opacity: 0.55, marginTop: 'auto' })
    ]
  )
}

function renderFinancial(spec) {
  const theme = colors(spec)
  const cells = objectArray(spec, ['cells', 'financial_cells', 'metrics'], DEFAULT_CONTENT.financial.cells).slice(0, 6)
  const left = 56
  const top = 132
  const cellWidth = 282
  const cellHeight = 130
  return frame(
    spec,
    [
      displayText(text(spec, 'title', DEFAULT_CONTENT.financial.title), spec, {
        position: 'absolute',
        left: 58,
        top: 48,
        width: 820,
        fontSize: 56,
        lineHeight: 1
      }),
      box({
        position: 'absolute',
        left,
        top,
        width: cellWidth * 3 + 2,
        height: cellHeight * 2 + 2,
        borderWidth: 3,
        borderColor: theme.text
      }),
      ...cells.map((item, index) => financialCell(item, spec, {
        position: 'absolute',
        left: left + (index % 3) * cellWidth,
        top: top + Math.floor(index / 3) * cellHeight
      }))
    ],
    { progress: 0.4 }
  )
}

function renderStat(spec) {
  const theme = colors(spec)
  const items = objectArray(spec, ['items', 'stat_items', 'metrics'], DEFAULT_CONTENT.stat.items).slice(0, 3)
  return frame(
    spec,
    [
      metricText(text(spec, 'stat', text(spec, 'value', DEFAULT_CONTENT.stat.value)), spec, {
        position: 'absolute',
        left: 188,
        top: 90,
        width: 585,
        color: theme.red,
        fontSize: 170,
        lineHeight: 0.82,
        textAlign: 'center',
        transform: 'rotate(-6deg)'
      }),
      box(
        {
          position: 'absolute',
          left: 235,
          top: 310,
          width: 490,
          flexDirection: 'row',
          justifyContent: 'space-between'
        },
        items.map((item) =>
          box({ width: 150, flexDirection: 'column', alignItems: 'center' }, [
            metricText(String(item.value || ''), spec, { color: theme.text, fontSize: 40, lineHeight: 1, textAlign: 'center' }),
            labelText(String(item.label || ''), spec, { color: theme.text, fontSize: 9, textAlign: 'center', marginTop: 5 })
          ])
        )
      ),
      bodyText(text(spec, 'context', DEFAULT_CONTENT.stat.context), spec, {
        position: 'absolute',
        left: 250,
        top: 405,
        width: 460,
        fontSize: 13,
        lineHeight: 1.55,
        textAlign: 'center',
        opacity: 0.7
      })
    ],
    { progress: 0.5 }
  )
}

function bulletList(items, spec, { color = null, bullet = 'bullet', fontSize = 9.5 } = {}) {
  const theme = colors(spec)
  return box({ width: '100%', flexDirection: 'column' }, items.slice(0, 4).map((item) =>
    box({ width: '100%', flexDirection: 'row', marginBottom: 4 }, [
      TextBlock(bullet === 'dash' ? '-' : '•', { width: 11, color: theme.red, fontSize, lineHeight: 1.35, ...fontRole('label', spec, { fontWeight: 700 }) }),
      bodyText(String(item), spec, { flex: 1, color: color || theme.text, fontSize, lineHeight: 1.35, opacity: 0.72 })
    ])
  ))
}

function serviceCard(item, spec) {
  const theme = colors(spec)
  return box(
    {
      width: 424,
      minHeight: 143,
      flexDirection: 'column',
      borderLeftWidth: 4,
      borderLeftColor: theme.red,
      paddingLeft: 18
    },
    [
      displayText(String(item.title || ''), spec, { fontSize: 30, lineHeight: 1.08, marginBottom: 8 }),
      bodyText(String(item.body || ''), spec, { fontSize: 12, lineHeight: 1.48, opacity: 0.8, marginBottom: 9 }),
      bulletList(Array.isArray(item.bullets) ? item.bullets : [], spec, { fontSize: 9 })
    ]
  )
}

function renderServices(spec) {
  const cards = objectArray(spec, ['cards', 'service_cards', 'items'], DEFAULT_CONTENT.services.cards).slice(0, 4)
  const positions = [
    { left: 64, top: 128 },
    { left: 506, top: 128 },
    { left: 64, top: 314 },
    { left: 506, top: 314 }
  ]
  return frame(
    spec,
    [
      displayText(text(spec, 'title', DEFAULT_CONTENT.services.title), spec, {
        position: 'absolute',
        left: 58,
        top: 50,
        width: 760,
        fontSize: 52,
        lineHeight: 1
      }),
      ...cards.map((item, index) => box(
        {
          position: 'absolute',
          left: positions[index].left,
          top: positions[index].top,
          width: 424,
          height: 154
        },
        [serviceCard(item, spec)]
      ))
    ],
    { progress: 0.6 }
  )
}

function roadmapPhase(item, spec) {
  const theme = colors(spec)
  return box(
    {
      width: 408,
      minHeight: 182,
      flexDirection: 'column',
      borderLeftWidth: 3,
      borderLeftColor: theme.red,
      paddingLeft: 16
    },
    [
      labelText(String(item.label || ''), spec, { color: theme.red, fontSize: 8.5, letterSpacing: 3, marginBottom: 6 }),
      displayText(String(item.title || ''), spec, { color: theme.background, fontSize: 28, lineHeight: 1.1, marginBottom: 8 }),
      bodyText(String(item.body || ''), spec, { color: theme.background, fontSize: 11, lineHeight: 1.48, opacity: 0.66, marginBottom: 8 }),
      bulletList(Array.isArray(item.bullets) ? item.bullets : [], spec, { color: theme.background, fontSize: 8.6 })
    ]
  )
}

function renderRoadmap(spec) {
  const theme = colors(spec)
  const phases = objectArray(spec, ['phases', 'roadmap_phases', 'timeline', 'items'], DEFAULT_CONTENT.roadmap.phases).slice(0, 4)
  return frame(
    spec,
    [
      box(
        {
          position: 'absolute',
          left: 52,
          top: 48,
          width: 860,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 31
        },
        phases.map((item) => roadmapPhase(item, spec))
      )
    ],
    { background: theme.text, color: theme.background, progress: 0.7 }
  )
}

function pillar(item, spec, index) {
  const theme = colors(spec)
  return box(
    {
      width: index === 1 ? 304 : 303,
      height: 430,
      flexDirection: 'column',
      alignItems: 'flex-start',
      backgroundColor: index % 2 === 0 ? theme.paper : theme.background,
      borderRightWidth: index === 2 ? 0 : 3,
      borderRightColor: theme.text,
      padding: '30px 24px'
    },
    [
      metricText(String(item.number || String(index + 1).padStart(2, '0')), spec, { fontSize: 52, lineHeight: 1, marginBottom: 9 }),
      displayText(String(item.title || ''), spec, { fontSize: 25, lineHeight: 1.1, marginBottom: 11 }),
      bodyText(String(item.lead || item.body || ''), spec, { fontSize: 11, lineHeight: 1.42, marginBottom: 10 }),
      box({ width: '100%', flexDirection: 'column' }, (Array.isArray(item.bullets) ? item.bullets : []).slice(0, 6).map((bullet) =>
        bodyText(String(bullet), spec, {
          width: '100%',
          fontSize: 8.8,
          lineHeight: 1.28,
          opacity: 0.75,
          padding: '4px 0',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(28,20,16,0.08)'
        })
      ))
    ]
  )
}

function renderPillars(spec) {
  const pillars = objectArray(spec, ['pillars_full', 'pillars', 'items'], DEFAULT_CONTENT.pillars.pillars).slice(0, 3)
  return frame(
    spec,
    [
      box(
        {
          position: 'absolute',
          left: 25,
          top: 58,
          width: 910,
          height: 430,
          flexDirection: 'row'
        },
        pillars.map((item, index) => pillar(item, spec, index))
      )
    ],
    { progress: 0.8 }
  )
}

function globalCard(item, spec) {
  const theme = colors(spec)
  const stats = Array.isArray(item.stats) ? item.stats : []
  return box(
    {
      width: 406,
      height: 148,
      flexDirection: 'column',
      borderWidth: 2,
      borderColor: theme.text,
      padding: 18,
      overflow: 'hidden'
    },
    [
      labelText(String(item.label || ''), spec, { marginBottom: 7 }),
      displayText(String(item.title || ''), spec, { fontSize: 27, lineHeight: 1.05, marginBottom: 7 }),
      bodyText(String(item.body || ''), spec, { fontSize: 10.5, lineHeight: 1.35, opacity: 0.8 }),
      box({ flexDirection: 'row', gap: 18, marginTop: 9 }, stats.slice(0, 2).map((stat) =>
        box({ width: 90, flexDirection: 'column' }, [
          metricText(String(stat.value || ''), spec, { fontSize: 22, lineHeight: 1 }),
          labelText(String(stat.label || ''), spec, { color: theme.text, fontSize: 7.5, letterSpacing: 1 })
        ])
      ))
    ]
  )
}

function renderGlobal(spec) {
  const cards = objectArray(spec, ['cards', 'global_cards', 'items'], DEFAULT_CONTENT.global.cards).slice(0, 4)
  return frame(
    spec,
    [
      displayText(text(spec, 'title', DEFAULT_CONTENT.global.title), spec, {
        position: 'absolute',
        left: 62,
        top: 42,
        width: 760,
        fontSize: 48,
        lineHeight: 1
      }),
      box(
        {
          position: 'absolute',
          left: 64,
          top: 118,
          width: 842,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 26
        },
        cards.map((item) => globalCard(item, spec))
      )
    ],
    { progress: 0.9 }
  )
}

function renderClose(spec) {
  const theme = colors(spec)
  const links = arrayValue(spec, 'links', DEFAULT_CONTENT.close.links).slice(0, 3)
  return frame(
    spec,
    [
      metricText(text(spec, 'title', DEFAULT_CONTENT.close.title), spec, {
        position: 'absolute',
        left: 132,
        top: 112,
        width: 700,
        fontSize: 118,
        lineHeight: 0.88,
        textAlign: 'center',
        transform: 'rotate(-5deg)'
      }),
      bodyText(text(spec, 'subtitle', DEFAULT_CONTENT.close.subtitle), spec, {
        position: 'absolute',
        left: 250,
        top: 352,
        width: 460,
        fontSize: 13,
        lineHeight: 1.5,
        textAlign: 'center',
        whiteSpace: 'pre-wrap'
      }),
      box(
        {
          position: 'absolute',
          left: 300,
          top: 432,
          width: 360,
          flexDirection: 'row',
          justifyContent: 'space-between'
        },
        links.map((link) =>
          box({ flexDirection: 'column', alignItems: 'center' }, [
            labelText(String(link), spec, { color: theme.text, fontSize: 9, letterSpacing: 2 }),
            box({ width: 56, height: 2, marginTop: 5, backgroundColor: theme.red })
          ])
        )
      )
    ],
    { progress: 1 }
  )
}

export function renderPosterStatPunch(spec) {
  const variant = normalizeVariant(spec)
  const renderers = {
    hero: renderHero,
    red: renderRed,
    summary: renderSummary,
    financial: renderFinancial,
    stat: renderStat,
    services: renderServices,
    roadmap: renderRoadmap,
    pillars: renderPillars,
    global: renderGlobal,
    close: renderClose
  }
  return (renderers[variant] || renderHero)(spec)
}
