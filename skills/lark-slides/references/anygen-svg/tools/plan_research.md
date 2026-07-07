---
id: plan_research
role: tool_prompt
orchestrated_by: mode_system_prompt_svg
invocation: required
stage: research
order: 1
cardinality: once
requires:
  - mode_system_prompt_svg
condition: always
trigger:
  - phase_3_research_planning
consumes:
  - request/request.json
  - request/source_manifest.json
  - request/entity_resolution.json
  - request/theme_contract.json
produces:
  - research/research_plan.json
  - research/queries.json
  - receipts/tool_calls/research/plan_research.json
completion_gate:
  - research_plan_valid
  - research_queries_valid
---

# Plan Research

Before writing `research/sources.json` or `research/research_notes.md`, write a research plan and query ledger.

## Universal decomposition

For every topic, extract:

1. entity: who or what the deck is about.
2. identifiers: ticker, official URL, product model, place, event, year, person, company, paper DOI, law code, or other strong identifiers.
3. evidence_needs: identity, facts, data, visuals, context, timeline, comparison, process, geography, or quotes.
4. source_ladders: official and vertical sources before general web.

## Strong identifier rules

- Ticker-like token: 1-5 uppercase letters, market hint, or user language such as stock, ETF, fund, 美股, 基金.
  - Must plan and attempt `finance_quote`.
  - Must plan and attempt `issuer_site`.
  - Must plan and attempt `exchange_or_regulator`.
  - General search alone is never enough to say the ticker does not exist.
- Official URL:
  - Must fetch that URL first as `official_site`.
  - Do not replace the provided URL with general search snippets.
- Product model:
  - Must search official product page, manual/spec sheet, and trusted review/context.
- Sports event/team:
  - Must search official event/league source and a statistics source.
- Cultural/lifestyle/food topic:
  - Must combine taxonomy/process/region sources; prefer museum, academic, official, encyclopedia, and authoritative media.
- Financial report/company:
  - Must use investor relations, SEC/filing, exchange/quote, and peer data sources where relevant.

## Outputs

`research/research_plan.json` states the plan.
`research/queries.json` records each direct URL, structured lookup, search query, status, and source ids retrieved.

If required source classes cannot be reached, record the failed query and let the gate block or request clarification. Do not silently downgrade to generic web search.
