#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import concurrent.futures
import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
REFERENCES_DIR = SCRIPT_DIR.parent / "references"
MATRIX_PATH = REFERENCES_DIR / "beautiful-template-executable-matrix.json"
DEFAULT_OUTPUT_DIR = REFERENCES_DIR / "production-review" / "beautiful" / "current-svglide-decks"
DEFAULT_RECEIPT_PATH = (
    REFERENCES_DIR / "receipts" / "production-review" / "beautiful-34-current-svglide-decks.json"
)
RENDERER_PATH = SCRIPT_DIR / "artboard_renderer" / "render.mjs"
GENERATOR_VERSION = "svglide-beautiful-current-deck-render/v1"
CLAIM_BOUNDARY = (
    "review-only current SVGlide renderer deck; not a production promotion receipt, "
    "not page-family fidelity pass, and not default_selectable evidence"
)

BLUE_PROFESSIONAL_FONT_ROLES = {
    "display": "Arial",
    "body": "Arial",
    "label": "Verdana",
    "metric": "Trebuchet MS",
}

BOLD_POSTER_FONT_ROLES = {
    "display": "SVGlideBoldPosterDisplay",
    "body": "SVGlideBoldPosterBody",
    "label": "SVGlideBoldPosterLabel",
    "metric": "SVGlideBoldPosterDisplay",
}

BOLD_POSTER_FONT_ROLE_CANDIDATES = {
    "display": [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
    "body": [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
    "label": [
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
        "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "metric": [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
}

BOLD_POSTER_FONT_ROLE_WEIGHTS = {
    "display": 900,
    "body": 400,
    "label": 700,
    "metric": 900,
}

BLUE_PROFESSIONAL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "title": "Market Outlook &\nStrategic Priorities",
        "subtitle": (
            "An analytical overview of emerging trends, shifting investor sentiment, "
            "and the key decisions shaping the next growth cycle."
        ),
        "meta": "Q2 2026 · Confidential",
        "footer": "1 / 10",
    },
    "agenda": {
        "eyebrow": "Table of Contents",
        "tag": "Overview",
        "footer": "2 / 10",
        "agenda": [
            {
                "number": "01",
                "title": "Executive Summary",
                "description": "High-level findings and key takeaways from the latest quarterly assessment.",
            },
            {
                "number": "02",
                "title": "Macroeconomic Sentiment",
                "description": (
                    "Investor perspectives on growth, inflation, and risk factors in the current environment."
                ),
            },
            {
                "number": "03",
                "title": "Capital Allocation Trends",
                "description": "How portfolios are shifting in response to policy changes and volatility signals.",
            },
            {
                "number": "04",
                "title": "Strategic Recommendations",
                "description": "Actionable priorities for leadership teams navigating an uncertain landscape.",
            },
            {
                "number": "05",
                "title": "Risk & Opportunity Matrix",
                "description": (
                    "Evaluating the trade-offs between defensive positioning and offensive growth bets."
                ),
            },
            {
                "number": "06",
                "title": "Conclusion & Next Steps",
                "description": "Summary of implications and recommended follow-up actions for stakeholders.",
            },
        ],
    },
    "metrics": {
        "eyebrow": "Executive Summary",
        "tag": "Key Findings",
        "title": "Sentiment has shifted measurably from the prior quarter",
        "footer": "3 / 10",
        "metrics": [
            {
                "value": "73%",
                "label": "Bullish on three-year outlook",
                "description": (
                    "An all-time series high, reflecting renewed confidence in medium-term "
                    "fundamentals despite near-term uncertainty."
                ),
                "supports": [
                    "Highest reading since the survey began in 2018",
                    "Cross-sector consensus, led by tech and industrials",
                    "Driven by clarity on rate trajectory and AI capex",
                ],
                "change": "↑ +11 pts vs. prior quarter",
                "sentiment": "positive",
            },
            {
                "value": "55%",
                "label": "Expect recession before year-end",
                "description": (
                    "Down significantly from the prior reading, indicating easing fears of "
                    "a severe or prolonged contraction."
                ),
                "supports": [
                    "Soft-landing scenario now the modal expectation",
                    "Median timeline pushed from Q2 to Q4",
                    "Severity expectations also moderated meaningfully",
                ],
                "change": "↓ -36 pts vs. prior quarter",
                "sentiment": "positive",
            },
            {
                "value": "4.5%",
                "label": "Median inflation expectation",
                "description": (
                    "Investors expect price pressures to remain elevated through the end "
                    "of the current calendar year."
                ),
                "supports": [
                    "Wage and services inflation remain the stickiest",
                    "Energy disinflation slower than originally modeled",
                    "Long-run anchor steady at 3% for the next decade",
                ],
                "change": "↑ +0.3 pts vs. prior quarter",
                "sentiment": "negative",
            },
        ],
    },
    "dashboard": {
        "eyebrow": "Macroeconomic Sentiment",
        "tag": "Data Overview",
        "title": "Current perspectives on the economy and markets",
        "footer": "4 / 10",
        "stats": [
            {
                "value": "22%",
                "unit": "of respondents",
                "name": "Bullish for the current calendar year",
                "context": "Steady from prior quarter, anchored by tariff and policy uncertainty.",
            },
            {
                "value": "51%",
                "unit": "of respondents",
                "name": "Bullish for the next calendar year",
                "context": "Up from 38% last quarter as the rate path firms up.",
            },
            {
                "value": "60%",
                "unit": "of respondents",
                "name": "More bullish on the economy than three months ago",
                "context": "A 22-point improvement, the largest sentiment swing in two years.",
            },
            {
                "value": "53%",
                "unit": "of respondents",
                "name": "More bullish on equities than three months ago",
                "context": "Tech and financials led the upgrade; energy and utilities lag.",
            },
            {
                "value": "3.6%",
                "unit": "median",
                "name": "Expected inflation rate for the next two years",
                "context": "Down 0.4 pts; long-run expectations remain anchored at 3.0%.",
            },
            {
                "value": "2.7%",
                "unit": "median",
                "name": "Expected real GDP growth for the next two years",
                "context": "A modest upgrade reflecting easing recession fears.",
            },
        ],
    },
    "split": {
        "eyebrow": "Investor Priorities",
        "tag": "Analysis",
        "title": "What investors want companies to focus on right now",
        "footer": "5 / 10",
        "left_points": [
            (
                "Growth and protecting the top line remain the leading priority, cited by a clear majority "
                "as essential in the current cycle."
            ),
            (
                "Cash flow resilience has risen sharply in importance as liquidity conditions tightened "
                "across credit markets through Q3."
            ),
            (
                "Supply chain stability ranks consistently high, reflecting the lasting operational scars "
                "of recent global disruptions."
            ),
            (
                "Margin preservation and cost discipline have moved from defensive levers to first-line "
                "strategy in investor conversations."
            ),
            (
                "AI capex remains the most-discussed structural theme, but with rising attention to "
                "monetization timelines."
            ),
        ],
        "quote": (
            '"The shift from growth-at-all-costs to profitable, sustainable expansion is '
            'the defining theme of this cycle."'
        ),
        "author": "Senior PM, multi-strategy fund",
        "mini_stats": [
            {"value": "63%", "label": "Prioritize top-line growth"},
            {"value": "55%", "label": "Prioritize cash flow resilience"},
            {"value": "33%", "label": "Prioritize supply chain stability"},
        ],
        "note": (
            "Notably absent from the top of the list: ESG-led capital allocation, which has "
            "dropped 24 points year-over-year as investors recalibrate toward returns-first mandates."
        ),
    },
    "bars": {
        "eyebrow": "Risk Factors",
        "tag": "Ranking",
        "title": "Most important macroeconomic concerns among investors",
        "footer": "6 / 10",
        "bars": [
            {"label": "Consumer price inflation", "value": 79},
            {"label": "Interest rates & central bank policy", "value": 69},
            {"label": "Geopolitical risks", "value": 39},
            {"label": "Liquidity tightening in capital markets", "value": 37},
            {"label": "Asset price volatility", "value": 25},
            {"label": "Public-sector debt & spending", "value": 22},
            {"label": "Climate & ESG-related risks", "value": 18},
        ],
    },
    "quote": {
        "quote": (
            "In this environment, the companies that will win are those that can balance "
            "operational discipline with strategic flexibility."
        ),
        "author": "Senior Partner, Strategy Practice — Global Investment Forum 2026",
        "footer": "7 / 10",
    },
    "timeline": {
        "eyebrow": "Strategic Roadmap",
        "tag": "Process",
        "title": "Recommended approach to navigating the current cycle",
        "footer": "8 / 10",
        "timeline": [
            {
                "number": "1",
                "title": "Assess Resilience",
                "description": (
                    "Evaluate balance sheet strength and operational buffers under stress scenarios."
                ),
            },
            {
                "number": "2",
                "title": "Protect Core Revenue",
                "description": (
                    "Defend market position and pricing power in segments with durable demand."
                ),
            },
            {
                "number": "3",
                "title": "Optimize Costs",
                "description": (
                    "Streamline overhead while preserving capacity for high-return investments."
                ),
            },
            {
                "number": "4",
                "title": "Selective Growth",
                "description": (
                    "Deploy capital toward opportunities with clear path to profitability."
                ),
            },
        ],
    },
    "detail": {
        "eyebrow": "Deep Dive",
        "tag": "Detailed Analysis",
        "title": "Changes in investment practices and valuation frameworks",
        "footer": "9 / 10",
        "details": [
            {
                "title": "Assuming higher cost of capital",
                "items": [
                    "Using elevated discount rates to reflect tighter monetary conditions",
                    "Shifting hurdle rates for internal capital allocation decisions",
                    "Emphasizing shorter payback periods for new projects",
                ],
            },
            {
                "title": "Cash flow & balance sheet focus",
                "items": [
                    "Prioritizing free cash flow generation as a key screening metric",
                    "Analyzing working capital needs under inflationary input costs",
                    "Reviewing leverage ratios and refinancing schedules",
                ],
            },
            {
                "title": "More conservative valuation approach",
                "items": [
                    "Greater weight assigned to downside and bear-case scenarios",
                    "Reduced reliance on long-dated terminal value assumptions",
                    "Increased sensitivity analysis around key drivers",
                ],
            },
            {
                "title": "Bottom-up stock selection",
                "items": [
                    "Reducing macro-driven top-down factor exposures",
                    "Intensifying fundamental research at the security level",
                    "Building conviction through differentiated data sources",
                ],
            },
            {
                "title": "Value over growth momentum",
                "items": [
                    "Pivoting toward earnings-supported valuations",
                    "Favoring demonstrable unit economics over scale narratives",
                    "Reassessing premium multiples for unprofitable segments",
                ],
            },
            {
                "title": "Shorter-term orientation",
                "items": [
                    "Narrowing forecasting windows for revenue and margin",
                    "More frequent reassessment of position sizing",
                    "Active hedging around event-driven volatility",
                ],
            },
        ],
    },
    "closing": {
        "title": "Thank You",
        "subtitle": "For questions or a deeper discussion of these findings, please reach out to the research team.",
        "cta": "Download Full Report",
        "contact": "research@company.com · www.company.com",
        "footer": "10 / 10",
    },
}


BOLD_POSTER_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "hero": {
        "meta": "Q3 Strategic Overview - Fiscal Year 2026",
        "title": "Apex Group Ltd.",
        "tag_label": "Annual Report",
        "subtitle": "Building scalable solutions for enterprise partners worldwide since 2019.",
    },
    "red": {
        "quote": '"We don\'t follow markets. We build the infrastructure they run on."',
        "cite": "- Our operating thesis since day one",
    },
    "summary": {
        "title": "Executive Summary",
        "columns": [
            (
                "Apex Group Ltd. partners with ambitious enterprise teams to turn complex operational "
                "challenges into scalable software infrastructure. Founded in 2019, we now serve 48 "
                "active clients across fintech, logistics, and SaaS verticals in 12 countries.\n\n"
                "Our platform model combines strategic consulting, product design, and engineering "
                "execution under one engagement structure, eliminating handoff delays and knowledge loss."
            ),
            (
                "This fiscal year we delivered 14 major product releases, achieved SOC 2 Type II "
                "certification, reduced API latency by 40% at the 99th percentile, and launched a "
                "self-serve tier for mid-market customers.\n\n"
                "Looking ahead, we are expanding into EMEA and APAC through two new regional hubs, "
                "targeting $18M ARR by Q4 2026."
            ),
        ],
        "highlights": [
            {"value": "340%", "label": "YoY Revenue Growth", "body": "From $2.7M to $12M ARR in 24 months with positive unit economics."},
            {"value": "94%", "label": "Gross Retention", "body": "Enterprise clients renew at industry-leading rates with zero churn in top quartile."},
            {"value": "120", "label": "Team Members", "body": "Engineering, design, and strategy distributed across four continents."},
        ],
    },
    "financial": {
        "title": "Financial Performance",
        "cells": [
            {"value": "$12.4M", "label": "Annual Recurring Revenue", "body": "Net revenue retention of 118% driven by expansion revenue from existing accounts.", "micro": "Up from $2.7M two years prior."},
            {"value": "18%", "label": "Net Profit Margin", "body": "Profitable for six consecutive quarters while reinvesting 35% of gross profit into R&D.", "micro": "EBITDA positive since Q2 FY24."},
            {"value": "$420", "label": "Avg. Contract Value", "body": "Enterprise ACV measured in thousands. Median contract length is 24 months.", "micro": "Top decile ACV: $1.8M."},
            {"value": "4.2x", "label": "LTV / CAC Ratio", "body": "Customer lifetime value of $48K against blended acquisition cost of $11.4K across all channels.", "micro": "Enterprise segment: 6.8x."},
            {"value": "8 mo", "label": "Cash Runway", "body": "$8.2M cash on hand with monthly burn of $980K, fully funded to profitability.", "micro": "Series A closed March 2025."},
            {"value": "$18M", "label": "FY27 Revenue Target", "body": "Projected ARR by March 2027 based on current pipeline velocity and expansion assumptions.", "micro": "Weighted pipeline: $31M."},
        ],
    },
    "stat": {
        "value": "96%",
        "stat": "96%",
        "items": [
            {"value": "48", "label": "Active Clients"},
            {"value": "12", "label": "Countries"},
            {"value": "99.97%", "label": "Platform Uptime"},
        ],
        "context": "Customer satisfaction score across all active engagements, measured quarterly via NPS and CSAT composite.",
    },
    "services": {
        "title": "Service Lines",
        "cards": [
            {"title": "Strategy", "body": "Market analysis, competitive positioning, and multi-year roadmaps that bridge ambition with executable milestones.", "bullets": ["Market sizing and TAM analysis", "Competitive landscape mapping", "Pricing strategy and packaging design", "M&A target identification"]},
            {"title": "Design", "body": "Product design, brand systems, and user research that make complexity feel effortless to end users.", "bullets": ["UX research and journey mapping", "Design systems at scale", "Prototyping and usability testing", "Brand identity and visual language"]},
            {"title": "Build", "body": "Scalable architecture, robust APIs, and infrastructure that grows with demand rather than against it.", "bullets": ["Cloud-native architecture design", "API development and developer experience", "Security audit and compliance engineering", "CI/CD pipelines and observability"]},
            {"title": "Scale", "body": "Go-to-market planning, partner programs, and revenue operations that compound quarter over quarter.", "bullets": ["Partner channel development", "Sales process and tooling", "Customer success playbooks", "Revenue operations and forecasting"]},
        ],
    },
    "roadmap": {
        "phases": [
            {"label": "Phase One - Complete (FY22-FY24)", "title": "Foundation", "body": "Core platform refined. Enterprise-grade compliance and security architecture shipped across three verticals.", "bullets": ["14 major product releases this quarter", "SOC 2 Type II and ISO 27001 certifications", "API latency reduced 40% at p99", "Self-serve onboarding launched"]},
            {"label": "Phase Two - Current (FY25)", "title": "Expansion", "body": "Two new regional hubs, localized compliance infrastructure, partner activation, and sales scaling.", "bullets": ["EMEA hub operational in London", "APAC hub in Singapore scheduled Q2", "5 strategic partners signed", "Localized pricing and tax handling live"]},
            {"label": "Phase Three - FY26-FY27", "title": "Platformization", "body": "Opening core infrastructure to certified developers and system integrators through a marketplace model.", "bullets": ["Developer portal and sandbox", "App marketplace with revenue sharing", "Partner certification program", "White-label licensing for enterprises"]},
            {"label": "Phase Four - FY28+", "title": "Ecosystem", "body": "Becoming the default infrastructure layer for the vertical across global markets.", "bullets": ["Strategic M&A for complementary capabilities", "Industry consortium founding", "Open-source components for trust", "Target: 500+ active partners"]},
        ],
    },
    "pillars": {
        "pillars_full": [
            {"number": "01", "title": "Clarity", "lead": "Every decision is documented, traceable, and communicated with context.", "bullets": ["Clear DRI assigned to every initiative", "Public dashboards with real-time metrics", "Decision logs published within 24 hours", "Weekly all-hands with open Q&A", "Written strategy docs preferred over decks", "OKRs visible to all employees"]},
            {"number": "02", "title": "Velocity", "lead": "Speed comes from focus and tooling, not from working longer hours.", "bullets": ["Two-week sprints with retrospectives", "CI/CD with production deploys every day", "Feature flags for gradual rollouts", "Direct customer feedback every cycle", "Bi-weekly demos open to stakeholders", "Automated testing at 94% coverage"]},
            {"number": "03", "title": "Trust", "lead": "Radical transparency with partners, employees, and the market.", "bullets": ["Real-time uptime dashboards shared externally", "Quarterly business reviews with all clients", "Security reports published proactively", "90-day exit clauses in every contract", "Named account engineers for enterprise tier", "Open API status page with incident history"]},
        ],
    },
    "global": {
        "title": "Global Presence",
        "cards": [
            {"label": "Headquarters", "title": "San Francisco", "body": "Primary engineering, design, and executive leadership based in the Bay Area. Founded here in 2019.", "stats": [{"value": "65", "label": "employees"}, {"value": "42K", "label": "sq ft office"}]},
            {"label": "Regional Hub", "title": "London", "body": "EMEA sales, customer success, and compliance operations for UK, EU, and Middle East clients.", "stats": [{"value": "28", "label": "employees"}, {"value": "18", "label": "clients live"}]},
            {"label": "Regional Hub", "title": "Singapore", "body": "APAC expansion hub launching Q2 2026, focused on fintech and logistics verticals.", "stats": [{"value": "12", "label": "employees"}, {"value": "4", "label": "clients pilot"}]},
            {"label": "Distributed", "title": "Remote Network", "body": "Engineering and design talent in 8 additional countries with an async-first operating model.", "stats": [{"value": "15", "label": "remote staff"}, {"value": "8", "label": "time zones"}]},
        ],
    },
    "close": {
        "title": "Thank You",
        "subtitle": "Ready to explore what we can build together?\nhello@apexgroup.co - San Francisco - Worldwide",
        "links": ["LinkedIn", "Contact", "Careers"],
    },
}


def read_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"expected JSON object: {path}")
    return payload


def write_json(path: Path, payload: dict[str, Any], *, pretty: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if pretty:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    else:
        path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def optional_sha256(path: Path | None) -> str | None:
    return file_sha256(path) if path is not None and path.is_file() else None


def resolve_path(value: object) -> Path | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    path = Path(raw)
    if path.is_absolute():
        return path
    return REPO_ROOT / raw


def relpath(path: Path | None, base: Path = REPO_ROOT) -> str | None:
    if path is None:
        return None
    try:
        return path.resolve().relative_to(base.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def slug(value: object) -> str:
    text = "".join(char.lower() if char.isalnum() else "-" for char in str(value or ""))
    text = "-".join(part for part in text.split("-") if part)
    return text or "page"


def _as_list(value: object) -> list[Any]:
    return value if isinstance(value, list) else []


def _as_dict(value: object) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def matrix_rows() -> list[dict[str, Any]]:
    payload = read_json(MATRIX_PATH)
    rows = payload.get("candidates")
    if not isinstance(rows, list):
        raise ValueError("beautiful-template-executable-matrix.json must contain candidates[]")
    return [row for row in rows if isinstance(row, dict)]


def visual_contract(row: dict[str, Any]) -> dict[str, Any]:
    path = resolve_path(row.get("visual_contract_path") or _as_dict(row.get("visual_contract")).get("path"))
    return read_json(path) if path and path.is_file() else {}


def variant_records(row: dict[str, Any]) -> list[dict[str, Any]]:
    contract = visual_contract(row)
    variants = contract.get("page_variants")
    records: list[dict[str, Any]] = []
    if isinstance(variants, dict):
        for variant_id, value in variants.items():
            if not isinstance(value, dict):
                continue
            records.append(
                {
                    "page_variant_id": str(variant_id),
                    "page_role": value.get("page_role") or variant_id,
                    "source_class": value.get("source_class"),
                    "source_slide_index": value.get("source_slide_index"),
                }
            )
    records.sort(key=lambda item: (item.get("source_slide_index") or 10_000, item.get("page_variant_id") or ""))
    return records


def fallback_content(family_id: str, variant: dict[str, Any], page_number: int) -> dict[str, Any]:
    variant_id = str(variant.get("page_variant_id") or f"page-{page_number}")
    if family_id == "blue-professional" and variant_id in BLUE_PROFESSIONAL_SOURCE_CONTENT:
        return dict(BLUE_PROFESSIONAL_SOURCE_CONTENT[variant_id])
    if family_id == "bold-poster" and variant_id in BOLD_POSTER_SOURCE_CONTENT:
        return dict(BOLD_POSTER_SOURCE_CONTENT[variant_id])
    role = str(variant.get("page_role") or variant_id)
    family_title = family_id.replace("-", " ").title()
    variant_title = variant_id.replace("-", " ").replace("_", " ").title()
    role_title = role.replace("-", " ").replace("_", " ").title()
    return {
        "eyebrow": f"{family_id} / {role}".upper(),
        "title": f"{family_title}\n{variant_title}",
        "subtitle": f"Review-only SVGlide current renderer deck page {page_number}. Source role: {role_title}.",
        "footer": "SVGlide review-only deck render",
        "metrics": [
            f"{page_number:02d}",
            role_title,
            variant_title,
            "review only",
        ],
        "principles": [
            f"Source class: {variant.get('source_class') or 'unknown'}",
            f"Variant: {variant_id}",
            "Current renderer output, not fidelity approval",
        ],
        "bullets": [
            role_title,
            variant_title,
            "Generated for visual review",
        ],
    }


def canvas_spec_for_page(row: dict[str, Any], variant: dict[str, Any], page_number: int) -> dict[str, Any]:
    family_id = str(row.get("family_id") or "")
    template_id = str(row.get("runtime_template_id") or row.get("template_id") or "")
    base_path = resolve_path(row.get("golden_spec"))
    if not base_path or not base_path.is_file():
        raise FileNotFoundError(f"missing golden spec for {family_id}: {row.get('golden_spec')}")
    spec = copy.deepcopy(read_json(base_path))
    variant_id = str(variant.get("page_variant_id") or f"page-{page_number}")
    role = str(variant.get("page_role") or variant_id)
    spec["version"] = spec.get("version") or "svglide-canvas-spec/v1"
    spec["template_id"] = template_id
    spec["theme_id"] = spec.get("theme_id") or family_id
    spec["family_id"] = family_id
    spec["page_role"] = role
    spec["page_variant_id"] = variant_id
    spec["renderer_variant_id"] = variant_id
    content = _as_dict(spec.get("content")).copy()
    content.update(fallback_content(family_id, variant, page_number))
    spec["content"] = content
    if family_id == "blue-professional":
        typography = _as_dict(_as_dict(spec.get("theme")).get("typography")).copy()
        typography["font_roles"] = BLUE_PROFESSIONAL_FONT_ROLES
        theme = _as_dict(spec.get("theme")).copy()
        theme["typography"] = typography
        spec["theme"] = theme
    if family_id == "bold-poster":
        typography = _as_dict(_as_dict(spec.get("theme")).get("typography")).copy()
        typography["font_roles"] = BOLD_POSTER_FONT_ROLES
        typography["font_role_candidates"] = BOLD_POSTER_FONT_ROLE_CANDIDATES
        typography["font_role_weights"] = BOLD_POSTER_FONT_ROLE_WEIGHTS
        theme = _as_dict(spec.get("theme")).copy()
        theme["typography"] = typography
        spec["theme"] = theme
    spec["page_family_source"] = {
        "family_id": family_id,
        "source_template_html": row.get("source_template_html"),
        "source_class": variant.get("source_class"),
        "source_slide_index": variant.get("source_slide_index"),
        "review_render_scope": "current_renderer_deck",
        "claim_boundary": CLAIM_BOUNDARY,
    }
    spec["review_only_current_deck_render"] = {
        "schema_version": GENERATOR_VERSION,
        "page": page_number,
        "degraded": not bool(row.get("page_variant_golden_specs")),
        "degraded_reason": (
            "single dedicated sample renderer reused for source page variants"
            if not row.get("page_variant_golden_specs")
            else None
        ),
        "claim_boundary": CLAIM_BOUNDARY,
    }
    return spec


def page_artifact_paths(output_dir: Path, family_id: str, page_number: int, variant_id: str) -> dict[str, Path]:
    basename = f"page-{page_number:03d}-{slug(variant_id)}"
    family_dir = output_dir / family_id
    return {
        "canvas_spec": family_dir / f"{basename}.canvas-spec.json",
        "svg": family_dir / f"{basename}.svg",
        "png": family_dir / f"{basename}.png",
    }


def render_page_preview(spec_path: Path, svg_path: Path, png_path: Path) -> None:
    completed = subprocess.run(
        ["node", RENDERER_PATH.as_posix(), spec_path.as_posix(), svg_path.as_posix(), png_path.as_posix()],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            f"render failed for {spec_path}: exit={completed.returncode}\nstdout={completed.stdout}\nstderr={completed.stderr}"
        )


def build_page_artifact(
    row: dict[str, Any],
    variant: dict[str, Any],
    page_number: int,
    output_dir: Path,
    *,
    render: bool,
    pretty: bool,
) -> dict[str, Any]:
    family_id = str(row.get("family_id") or "")
    variant_id = str(variant.get("page_variant_id") or f"page-{page_number}")
    paths = page_artifact_paths(output_dir, family_id, page_number, variant_id)
    spec = canvas_spec_for_page(row, variant, page_number)
    write_json(paths["canvas_spec"], spec, pretty=pretty)
    render_error = None
    if render:
        try:
            render_page_preview(paths["canvas_spec"], paths["svg"], paths["png"])
        except Exception as error:  # pragma: no cover - exercised by integration runs.
            render_error = str(error)
    render_passed = paths["svg"].is_file() and (paths["png"].is_file() if render else True) and not render_error
    return {
        "page": page_number,
        "page_variant_id": variant_id,
        "page_role": variant.get("page_role"),
        "source_slide_index": variant.get("source_slide_index"),
        "source_class": variant.get("source_class"),
        "canvas_spec": relpath(paths["canvas_spec"]),
        "canvas_spec_sha256": optional_sha256(paths["canvas_spec"]),
        "svg": relpath(paths["svg"]) if paths["svg"].exists() else None,
        "svg_sha256": optional_sha256(paths["svg"]),
        "png": relpath(paths["png"]) if paths["png"].exists() else None,
        "png_sha256": optional_sha256(paths["png"]),
        "browser_preview": relpath(paths["png"]) if paths["png"].exists() else None,
        "browser_preview_sha256": optional_sha256(paths["png"]),
        "browser_preview_kind": "resvg_png" if paths["png"].exists() else None,
        "render_status": "passed" if render_passed else "failed" if render_error else "not_rendered",
        "render_error": render_error,
        "degraded": not bool(row.get("page_variant_golden_specs")),
        "degraded_reason": (
            "single dedicated sample renderer reused for source page variants"
            if not row.get("page_variant_golden_specs")
            else None
        ),
    }


def build_family_deck(
    row: dict[str, Any],
    output_dir: Path,
    *,
    render: bool,
    pretty: bool,
    workers: int,
) -> dict[str, Any]:
    family_id = str(row.get("family_id") or "")
    variants = variant_records(row)
    if not variants:
        raise ValueError(f"missing page variants for {family_id}")
    if workers <= 1 or not render:
        pages = [
            build_page_artifact(row, variant, index, output_dir, render=render, pretty=pretty)
            for index, variant in enumerate(variants, start=1)
        ]
    else:
        pages_by_index: dict[int, dict[str, Any]] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {
                executor.submit(
                    build_page_artifact,
                    row,
                    variant,
                    index,
                    output_dir,
                    render=render,
                    pretty=pretty,
                ): index
                for index, variant in enumerate(variants, start=1)
            }
            for future in concurrent.futures.as_completed(futures):
                pages_by_index[futures[future]] = future.result()
        pages = [pages_by_index[index] for index in sorted(pages_by_index)]
    status = "passed" if all(page["render_status"] == "passed" for page in pages) else "failed"
    payload = {
        "schema_version": GENERATOR_VERSION,
        "artifact_kind": "beautiful_current_svglide_deck_render",
        "family_id": family_id,
        "runtime_template_id": row.get("runtime_template_id") or row.get("template_id"),
        "review_only": True,
        "claim_boundary": CLAIM_BOUNDARY,
        "status": status,
        "page_count": len(pages),
        "rendered_pages": sum(1 for page in pages if page["render_status"] == "passed"),
        "degraded": not bool(row.get("page_variant_golden_specs")),
        "degraded_reason": (
            "single dedicated sample renderer reused for source page variants"
            if not row.get("page_variant_golden_specs")
            else None
        ),
        "pages": pages,
    }
    write_json(output_dir / family_id / "manifest.json", payload, pretty=pretty)
    return payload


def build_all_decks(
    output_dir: Path,
    *,
    render: bool,
    pretty: bool,
    workers: int,
    family_ids: set[str] | None = None,
) -> dict[str, Any]:
    rows = [row for row in matrix_rows() if not family_ids or row.get("family_id") in family_ids]
    families = [
        build_family_deck(row, output_dir, render=render, pretty=pretty, workers=workers)
        for row in rows
    ]
    return {
        "schema_version": GENERATOR_VERSION,
        "artifact_kind": "beautiful_current_svglide_deck_render_receipt",
        "review_only": True,
        "claim_boundary": CLAIM_BOUNDARY,
        "candidate_count": len(families),
        "family_count": len(families),
        "page_count": sum(family["page_count"] for family in families),
        "rendered_pages": sum(family["rendered_pages"] for family in families),
        "status": "passed" if all(family["status"] == "passed" for family in families) else "failed",
        "output_dir": relpath(output_dir),
        "families": [
            {
                "family_id": family["family_id"],
                "runtime_template_id": family["runtime_template_id"],
                "status": family["status"],
                "page_count": family["page_count"],
                "rendered_pages": family["rendered_pages"],
                "degraded": family["degraded"],
                "manifest": relpath(output_dir / str(family["family_id"]) / "manifest.json"),
            }
            for family in families
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Render review-only current SVGlide decks for beautiful families.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--receipt", type=Path, default=DEFAULT_RECEIPT_PATH)
    parser.add_argument("--family", action="append", default=[])
    parser.add_argument("--skip-render", action="store_true", help="write canvas specs/manifests without invoking node renderer")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args(argv)
    family_ids = set(args.family) if args.family else None
    receipt = build_all_decks(
        args.output_dir,
        render=not args.skip_render,
        pretty=args.pretty,
        workers=max(1, args.workers),
        family_ids=family_ids,
    )
    write_json(args.receipt, receipt, pretty=args.pretty)
    print(json.dumps({"status": receipt["status"], "families": receipt["family_count"], "pages": receipt["page_count"], "rendered_pages": receipt["rendered_pages"], "output_dir": args.output_dir.as_posix(), "receipt": args.receipt.as_posix()}, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0 if receipt["status"] == "passed" or args.skip_render else 1


if __name__ == "__main__":
    sys.exit(main())
