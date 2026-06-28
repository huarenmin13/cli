#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import concurrent.futures
import copy
import hashlib
import json
import os
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
    "display": "Georgia",
    "body": "Georgia",
    "label": "Trebuchet MS",
    "metric": "Georgia",
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

PINK_SCRIPT_FONT_ROLES = {
    "display": "SVGlideDisplay",
    "body": "SVGlideBody",
    "label": "SVGlideLabel",
    "metric": "SVGlideMetric",
}

PINK_SCRIPT_FONT_ROLE_CANDIDATES = {
    "display": [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    ],
    "body": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
    "label": [
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "metric": [
        "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ],
}

PINK_SCRIPT_FONT_ROLE_WEIGHTS = {
    "display": 400,
    "body": 300,
    "label": 400,
    "metric": 500,
}

PLAYFUL_FONT_ROLES = {
    "display": "Trebuchet MS",
    "body": "Arial",
    "label": "Trebuchet MS",
    "metric": "Trebuchet MS",
}

PLAYFUL_FONT_ROLE_CANDIDATES = {
    "display": [
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
        "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ],
    "body": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
    "label": [
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
        "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "metric": [
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
}

PLAYFUL_FONT_ROLE_WEIGHTS = {
    "display": 800,
    "body": 400,
    "label": 600,
    "metric": 800,
}

RAW_GRID_FONT_ROLES = {
    "display": "Arial",
    "body": "Arial",
    "label": "Arial",
    "metric": "Arial",
}

RAW_GRID_FONT_ROLE_CANDIDATES = {
    "display": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "body": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ],
    "label": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
    "metric": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ],
}

RAW_GRID_FONT_ROLE_WEIGHTS = {
    "display": 900,
    "body": 500,
    "label": 800,
    "metric": 900,
}

PEOPLES_PLATFORM_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "STRATEGIC REVIEW · INTERNAL",
        "title": "QUARTERLY\nREVIEW",
        "script": "a",
        "subtitle": "PRESENTATION TEMPLATE",
        "meta_left": "Q2 · 2026",
        "stamp": "VOL. 01",
        "footer": ["PREPARED BY THE TEAM", "MAY 2026", "VERSION 01"],
    },
    "toc": {
        "title": "WHAT'S\nINSIDE.",
        "meta": ["CONTENTS", "SECTION GUIDE", "02 / 10"],
        "items": [
            {"num": "01", "title": "The Big Idea", "page": "PG 03"},
            {"num": "02", "title": "Three Pillars", "page": "PG 04"},
            {"num": "03", "title": "By the Numbers", "page": "PG 05"},
            {"num": "04", "title": "The Full Plan", "page": "PG 06"},
            {"num": "05", "title": "Voice of the Customer", "page": "PG 07"},
            {"num": "06", "title": "Roadmap", "page": "PG 08"},
            {"num": "07", "title": "Where We Land", "page": "PG 09"},
            {"num": "08", "title": "Next Steps", "page": "PG 10"},
        ],
    },
    "manifesto": {
        "header": ["— THE BIG IDEA —", "03 / 10", "ONE SENTENCE"],
        "kicker": "★ ★ ★  OUR THESIS  ★ ★ ★",
        "title": (
            "The product gets simpler\n"
            "as the team gets braver —\n"
            "not the other way around."
        ),
        "accent": "braver",
        "footer": ["— PARAGRAPH 01 —", "SET IN ALFA SLAB"],
    },
    "pillars": {
        "title": "THREE\nPRIORITIES.",
        "lede": (
            "The work falls into three buckets this quarter. Each has a clear owner, "
            "a clear deliverable, and a clear way to know we are done."
        ),
        "columns": [
            {
                "num": "01",
                "tag": "— FOCUS —",
                "title": "Ship the\ncore flow.",
                "body": "Cut three legacy paths and double down on the one that drives ninety percent of activations.",
            },
            {
                "num": "02",
                "tag": "— LEARN —",
                "title": "Talk to\nten teams.",
                "body": "Standing weekly research with target customers. Findings briefed every Friday in a one-page memo.",
                "accent": True,
            },
            {
                "num": "03",
                "tag": "— SHIP —",
                "title": "One launch,\nnot five.",
                "body": "Combine the four small drops on the calendar into a single, well-told release.",
            },
        ],
    },
    "stat": {
        "header": ["— BY THE NUMBERS —", "05 / 10", "SECTION 02 / DATA"],
        "value": "63",
        "unit": "%",
        "title": "of customers\nrecommend us\nafter onboarding.",
        "body": (
            "Net promoter scores climbed eighteen points after we shipped the redesigned "
            "first-run experience in March."
        ),
        "source": "SOURCE — INTERNAL NPS, Q1 2026",
        "ribbon": ["★ FOCUS", "★ LEARN", "★ SHIP", "★ FOCUS", "★ LEARN", "★ SHIP"],
    },
    "platform": {
        "title": "THE FULL\nPLAN.",
        "lede": "Eight workstreams, costed and owned. Each links to a longer brief in the appendix.",
        "items": [
            {"title": "Onboarding refresh", "body": "Rebuild the first-run experience with progressive disclosure."},
            {"title": "Pricing simplification", "body": "Collapse the seven plans into three clearer plans."},
            {"title": "Mobile parity", "body": "Bring the four most-used desktop flows to mobile by end of quarter."},
            {"title": "Self-serve setup", "body": "Reduce time-to-first-value from three days to thirty minutes."},
            {"title": "Trust & security", "body": "Ship audit logs, role-based access, and SSO for paid tiers."},
            {"title": "Performance budget", "body": "Cut median page load by forty percent and enforce the ceiling."},
            {"title": "Integrations push", "body": "Native connectors for the top five tools customers ask for."},
            {"title": "Brand refresh", "body": "New marketing site, sharper positioning, and a unified visual system."},
        ],
    },
    "quote": {
        "quote": (
            "The new onboarding cut our setup time\n"
            "from three days to thirty minutes —\n"
            "we shipped the same week."
        ),
        "emphasis": "we shipped the same week.",
        "name": "Maya Okonkwo",
        "role": "— HEAD OF OPS, NORTH STAR LABS —",
        "stamp": "★ Voice of the Customer ★",
    },
    "timeline": {
        "title": "THE\nROADMAP.",
        "subtitle": "— a plan, on a clock —",
        "steps": [
            {"when": "MAY", "title": "Kickoff", "body": "Charter the workstreams, lock owners, and publish the scorecard."},
            {"when": "JUNE", "title": "Beta opens", "body": "Onboard the first ten design partners on the new core flow.", "accent": True},
            {"when": "AUGUST", "title": "Launch", "body": "Public release, marketing refresh, and sales enablement complete."},
            {"when": "OCTOBER", "title": "Scale", "body": "Roll changes to the long tail and retire legacy paths.", "accent": True},
        ],
        "metrics": [
            {"label": "— TIME-TO-VALUE —", "value": "30m"},
            {"label": "— ACTIVATION RATE —", "value": "+24%", "accent": True},
            {"label": "— REVENUE LIFT —", "value": "$1.4M"},
        ],
    },
    "compare": {
        "title": "WHERE\nWE LAND.",
        "subtitle": "A side-by-side of where the product is today and where this plan takes us by year end.",
        "columns": [
            {
                "label": "— TODAY —",
                "title": "Capable,\nbut cluttered.",
                "items": [
                    "Three-day median time-to-value for new teams.",
                    "Seven pricing plans with overlapping feature sets.",
                    "Mobile parity at sixty percent of desktop flows.",
                    "Onboarding NPS sits at forty-five points.",
                ],
            },
            {
                "label": "— END OF YEAR —",
                "title": "Sharper,\nfaster,\nfewer.",
                "accent": True,
                "items": [
                    "Thirty-minute self-serve setup, no human required.",
                    "Three pricing plans with a clear feature matrix.",
                    "Full mobile parity, plus offline drafts.",
                    "Onboarding NPS targeted at sixty-three points.",
                ],
            },
        ],
    },
    "close": {
        "header": ["— END OF DECK —", "★ THANK YOU ★", "10 / 10"],
        "pre": "over to you —",
        "title": "QUESTIONS?",
        "cta": "LET'S TALK",
        "url": "team@company.com",
        "signoff": "PREPARED BY THE PRODUCT TEAM\n★ MAY 2026 ★ INTERNAL DRAFT",
        "stamp": "END",
    },
}

PINK_SCRIPT_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "brand": "Maison Nocturne",
        "meta": "Vol. XIV · A/W 2026",
        "pre": "A Field Report on Late-Night Couture",
        "title_top": "After",
        "title_bottom": "Hours.",
        "lower": [
            {"label": "Edition", "value": "No. 14", "accent": True},
            {"label": "Director", "value": "L. Marchetti"},
            {"label": "Locale", "value": "Paris · 11e"},
            {"label": "Date", "value": "May 2026", "accent": True},
        ],
        "footer": "Maison Nocturne · Confidential",
        "pageno": "01 / 09",
    },
    "toc": {
        "brand": "After Hours",
        "meta": "The Index",
        "title": "The",
        "title_small": "Index.",
        "rows": [
            {"num": "01", "title": "By the Numbers", "desc": "Five figures that shape the season.", "meta": "Stats · pp. 14"},
            {"num": "02", "title": "Movements", "desc": "A study in cuts, color, and silhouette.", "meta": "Section · pp. 22", "current": True},
            {"num": "03", "title": "The Curve", "desc": "Twelve weeks of after-hours behavior.", "meta": "Chart · pp. 36"},
            {"num": "04", "title": "The Field", "desc": "Where we sit among the houses we admire.", "meta": "Matrix · pp. 48"},
            {"num": "05", "title": "Voices & Encore", "desc": "Critics, clients, and what comes next.", "meta": "pp. 60-72"},
        ],
        "footer": "Maison Nocturne",
        "pageno": "02 / 09",
    },
    "stats": {
        "brand": "Chapter 01",
        "meta": "By the Numbers · A/W26",
        "kicker": "By the Numbers",
        "title": "A season\ntold in\nfive figures.",
        "body": "Read top to bottom. Every figure was reported by atelier directors during the eight-week previewing window and represents the house ledger only.",
        "stats": [
            {"value": "42", "unit": "%", "label": "Couture · Repeat Clients", "desc": "Patrons who returned within ninety days for a second commission."},
            {"value": "3.8", "unit": "×", "label": "Atelier Throughput", "desc": "Pieces released per machinist per week, measured against the prior Spring book."},
            {"value": "€1.4", "unit": "M", "label": "Average Ticket · Vault", "desc": "Mean spend per private appointment in the Vault programme this quarter."},
            {"value": "86", "unit": "%", "label": "Reservation Rate", "desc": "Show seats filled before the public window opened."},
            {"value": "07", "unit": "", "label": "New Cities, A/W", "desc": "Markets opened with a flagship boutique since the prior season."},
        ],
        "footer": "Source · Atelier Ledger Q1",
        "pageno": "03 / 09",
    },
    "section": {
        "brand": "Chapter 02",
        "meta": "Movements",
        "vertical": "Maison Nocturne · Vol. XIV",
        "number": "02",
        "kicker": "Movements",
        "title": "A study\nin cuts\n& color.",
        "body": "Three silhouettes carry the season — the column, the cape, and the cinch. Each is annotated in the chapters that follow.",
        "footer": "Chapter 02 of 05",
        "pageno": "04 / 09",
    },
    "chart": {
        "brand": "Chapter 03",
        "meta": "The Curve",
        "title": "Twelve weeks of after-hours\nbehavior.",
        "legends": ["House · A/W26", "Sector benchmark"],
        "callout_value": "+38%",
        "callout_label": "Week 09 inflection",
        "callout_desc": "After the editorial dropped, walk-ins to the rue Saint-Honoré flagship doubled within seventy-two hours.",
        "xaxis": ["W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09", "W10", "W11", "W12"],
        "footer": "Source · House register · Index FY25=100",
        "pageno": "05 / 09",
    },
    "process": {
        "brand": "Chapter 04",
        "meta": "The Method",
        "title": "The\nmethod.",
        "lead": "From sketchbook to runway in five movements. The atelier's tempo is dictated by the cloth, never the calendar.",
        "steps": [
            {"num": "01", "title": "Brief", "body": "The house director and head couturier convene with three muses to set the season's mood."},
            {"num": "02", "title": "Pattern", "body": "Toiles cut in calico. Each silhouette is fitted three times before approval is granted."},
            {"num": "03", "title": "Atelier", "body": "Cloth is cut on the bias. Hand-stitched seams. No piece leaves without two signatures."},
            {"num": "04", "title": "Fitting", "body": "Private appointments held by candlelight in the Vault. Clients touch the cloth before final approval."},
            {"num": "05", "title": "Runway", "body": "Twelve looks shown. The collection is sold by appointment before the public window opens."},
        ],
        "timeline": ["Wk 01-02 Brief", "Wk 03-06 Pattern", "Wk 07-10 Atelier", "Wk 11-12 Fitting", "Wk 13 Runway"],
        "footer": "Atelier Method · House Standard",
        "pageno": "06 / 09",
    },
    "matrix": {
        "brand": "Chapter 05",
        "meta": "The Field",
        "title": "The\nfield, in five rows.",
        "source": "Sourced · house registers, public filings, three trade press indices · A/W 2026",
        "headers": ["Dimension", "Maison Nocturne", "House A", "House B"],
        "rows": [
            ["Atelier model", "In-house · Paris", "Hybrid · 2 cities", "Outsourced"],
            ["Lead time", "13 weeks, hand-stitched", "9 weeks, partial machine", "6 weeks, full machine"],
            ["Vault programme", "Yes · invitation", "No", "By appointment"],
            ["Repeat client share", "42%", "28%", "19%"],
            ["Public window", "90 days post-show", "30 days post-show", "Same day"],
        ],
        "footer": "Comparison · A/W 2026 disclosed",
        "pageno": "07 / 09",
    },
    "quote": {
        "brand": "Chapter 06",
        "meta": "Voices",
        "qmark": "\"",
        "label": "Voices · Issue 14",
        "quote": "The house dresses you for an evening that hasn't begun. You leave the fitting and somewhere a room is already waiting.",
        "who": "— Camille Aubry",
        "role": "Editor-in-chief · Le Soir Parisien",
        "footer": "Voices · Le Soir Parisien",
        "pageno": "08 / 09",
    },
    "cta": {
        "brand": "Chapter 07",
        "meta": "Encore",
        "pre": "An invitation",
        "title": "Encore.\nThe list opens\nthis Friday.",
        "steps": [
            {"num": "01", "title": "Reserve", "body": "Hold a Vault appointment for the week of 24 May. Couture only."},
            {"num": "02", "title": "Preview", "body": "Three looks shown by candlelight in the rue Saint-Honoré room."},
            {"num": "03", "title": "Commission", "body": "One piece commissioned to your measure, delivered before September."},
        ],
        "qr_label": "Vault access",
        "url": "maison.nocturne",
        "footer": "RSVP · Private client office",
        "pageno": "09 / 09",
    },
}

PLAYFUL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "date": "02.05.26",
        "title": "Creative Direction\n& Visual Systems",
        "subtitle": "A warm deck for bold ideas, raw expression, and unfiltered storytelling.",
        "vertical": "SCROLL DOWN ->",
        "footer": "Indie studio field deck",
        "pageno": "01 / 10",
    },
    "toc": {
        "label": "Overview",
        "title": "What We Will\nCover Today",
        "items": [
            {"num": "01", "label": "Vision & Mission Statement"},
            {"num": "02", "label": "Market Analysis & Data Insights"},
            {"num": "03", "label": "Team Structure & Leadership"},
            {"num": "04", "label": "Core Services & Offerings"},
            {"num": "05", "label": "Process & Workflow Timeline"},
            {"num": "06", "label": "Results, Metrics & Impact"},
        ],
        "pageno": "02 / 10",
    },
    "statement": {
        "title": "Raw expression over polished perfection.",
        "columns": [
            "Our approach combines strategic thinking with intuitive design. We build visual systems that adapt, evolve, and resonate with audiences across cultures and contexts.",
            "Founded in 2019, we have partnered with independent artists, cultural institutions, and forward-thinking brands to create work that challenges conventions.",
        ],
        "pageno": "03 / 10",
    },
    "chart": {
        "title": "Growth Metrics\nOver Four Quarters",
        "legends": ["Revenue", "Engagement"],
        "values": [
            {"label": "Q1", "a": 45, "b": 30},
            {"label": "Q2", "a": 60, "b": 50},
            {"label": "Q3", "a": 75, "b": 65},
            {"label": "Q4", "a": 90, "b": 85},
            {"label": "Q5", "a": 100, "b": 95},
        ],
        "pageno": "04 / 10",
    },
    "team": {
        "title": "The Collective",
        "subtitle": "Four perspectives, one shared obsession with craft.",
        "people": [
            {"name": "Alex Chen", "role": "Creative Director"},
            {"name": "Mira Okafor", "role": "Strategy Lead"},
            {"name": "Jonas Weber", "role": "Visual Designer"},
            {"name": "Suki Tanaka", "role": "Motion Artist"},
        ],
        "pageno": "05 / 10",
    },
    "services": {
        "title": "What We\nDo Best",
        "blocks": [
            {"num": "01", "title": "Brand Identity", "desc": "Visual systems that capture essence and scale across every touchpoint."},
            {"num": "02", "title": "Art Direction", "desc": "Creative vision for campaigns, editorial, and cultural projects.", "filled": True},
            {"num": "03", "title": "Motion Design", "desc": "Animation and kinetic identity that brings static brands to life."},
            {"num": "04", "title": "Digital Experiences", "desc": "Websites and interactive platforms with personality and purpose."},
            {"num": "05", "title": "Typography", "desc": "Custom letterforms and type systems for distinctive voices.", "filled": True},
        ],
        "pageno": "06 / 10",
    },
    "timeline": {
        "title": "Our Process\nin Five Steps",
        "steps": [
            {"num": "1", "title": "Discover", "desc": "Research, interviews, and competitive landscape analysis"},
            {"num": "2", "title": "Define", "desc": "Strategic positioning and core narrative development"},
            {"num": "3", "title": "Design", "desc": "Visual exploration, prototyping, and iteration cycles"},
            {"num": "4", "title": "Develop", "desc": "Production, asset creation, and implementation support"},
            {"num": "5", "title": "Deploy", "desc": "Launch support and ongoing performance measurement"},
        ],
        "pageno": "07 / 10",
    },
    "stats": {
        "title": "Impact by\nthe Numbers",
        "stats": [
            {"value": "47", "label": "Projects delivered across three continents in the last year"},
            {"value": "12", "label": "Industry awards and recognitions for creative excellence"},
            {"value": "98%", "label": "Client retention rate with ongoing partnerships"},
        ],
        "pageno": "08 / 10",
    },
    "gallery": {
        "title": "Selected Works",
        "subtitle": "A glimpse into recent collaborations and independent projects.",
        "items": [
            {"label": "IMG 01", "tag": "Editorial"},
            {"label": "IMG 02", "tag": "Identity"},
            {"label": "IMG 03", "tag": "Motion"},
            {"label": "IMG 04", "tag": "Campaign"},
        ],
        "pageno": "09 / 10",
    },
    "closing": {
        "title": "Thank You\nLet Us Talk",
        "subtitle": "Questions, projects, or just a conversation about ideas.",
        "contacts": ["hello@example.studio", "+1 (555) 000 1234", "www.example.studio"],
        "pageno": "10 / 10",
    },
}

RAW_GRID_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "mark": "RG",
        "brand": "RAW GRID",
        "title": "Cities.\nStartups.",
        "cta": "Discover All Startups",
        "cities": ["San Francisco", "New York", "Cupertino", "Menlo Park", "Santa Clara", "Mountain View", "Sunnyvale"],
    },
    "split": {
        "eyebrow": "About The Platform",
        "title": "Connecting Founders\nWith Opportunity",
        "body": "A centralized ecosystem for emerging ventures and the resources they need to scale.",
        "stats": [
            {"value": "250+", "label": "Active Startups", "body": "Ventures currently enrolled and scaling through our network."},
            {"value": "14", "label": "Cities Covered", "body": "Metropolitan tech hubs across North America and Europe."},
        ],
    },
    "bars": {
        "title": "Quarterly Growth Metrics",
        "label": "Fiscal Year 2026",
        "chart_title": "Revenue by Quarter ($M)",
        "bars": [
            {"label": "Q1", "value": "$4.5M", "width": 45, "fill": "pink"},
            {"label": "Q2", "value": "$6.2M", "width": 62, "fill": "green"},
            {"label": "Q3", "value": "$7.8M", "width": 78, "fill": "black"},
            {"label": "Q4", "value": "$9.1M", "width": 91, "fill": "pink"},
        ],
        "stats": [
            {"value": "+47%", "label": "Year over Year Growth"},
            {"value": "$27.6M", "label": "Total Annual Revenue", "fill": "green"},
            {"value": "12.4K", "label": "New User Signups", "fill": "pink"},
        ],
    },
    "cards": {
        "title": "Core Services",
        "label": "What We Provide",
        "cards": [
            {"num": "01", "icon": "I", "title": "Venture Funding", "body": "Direct seed and series funding through our investor network."},
            {"num": "02", "icon": "II", "title": "Mentorship", "body": "One-on-one guidance from operators and exited founders.", "fill": "green"},
            {"num": "03", "icon": "III", "title": "Workspace", "body": "Flexible office access in partner cities.", "fill": "pink"},
            {"num": "04", "icon": "IV", "title": "Community", "body": "A founder network sharing referrals and support.", "fill": "gray"},
        ],
    },
    "feature": {
        "badge": "Featured",
        "title": "The Founders Lab",
        "body": "A twelve-week program that turns early concepts into market-ready products.",
        "note": "Quarterly cohorts include workspace, engineering support, and investor demo days.",
        "image_label": "[ Image Placeholder ]",
    },
    "process": {
        "title": "Application Process",
        "steps": [
            {"num": "01", "title": "Submit", "body": "Send the pitch deck and team overview."},
            {"num": "02", "title": "Review", "body": "Committee evaluates fit and market potential."},
            {"num": "03", "title": "Interview", "body": "Shortlisted teams present to partners.", "fill": "green"},
            {"num": "04", "title": "Onboard", "body": "Accepted ventures join the next cohort.", "fill": "pink"},
        ],
    },
    "donut": {
        "value": "63%",
        "label": "Market Share",
        "legends": ["Enterprise", "Consumer", "Non-Profit"],
        "metrics": [
            {"value": "89%", "title": "Retention Rate", "body": "Founders who renew after year one"},
            {"value": "3.2x", "title": "Average ROI", "body": "Return on capital invested", "fill": "green"},
            {"value": "156", "title": "Jobs Created", "body": "New positions this quarter"},
            {"value": "$42M", "title": "Capital Deployed", "body": "Total funding distributed", "fill": "pink"},
        ],
    },
    "quote": {
        "title": "Founder Credo",
        "quote": "We do not incubate ideas. We accelerate the people bold enough to build them.",
        "stats": [
            {"value": "98%", "label": "Satisfaction"},
            {"value": "4.9", "label": "Avg Rating", "fill": "pink"},
            {"value": "500+", "label": "Alumni", "fill": "gray"},
            {"value": "$1B+", "label": "Valuation", "fill": "black"},
        ],
    },
    "table": {
        "title": "Plan Comparison",
        "label": "Pricing Tiers",
        "headers": ["Feature", "Starter", "Professional", "Enterprise"],
        "rows": [
            ["Workspace", "Shared", "Dedicated", "Private"],
            ["Mentor Hours", "2 / Mo", "8 / Mo", "Unlimited"],
            ["Investor Intros", "Quarterly", "Monthly", "Weekly"],
            ["Legal Support", "Templates", "Guided", "Full"],
            ["Event Access", "Online", "In-Person", "VIP"],
            ["Response", "48 Hours", "24 Hours", "4 Hours"],
        ],
    },
    "closing": {
        "title": "Let's\nBuild.",
        "body": "Ready to take your venture to the next level? Join Raw Grid and start scaling today.",
        "cta": "Get Started Now",
        "contact_title": "Get In Touch",
        "contacts": ["Email: hello@rawgrid.studio", "Phone: +1 (555) 000-0000", "Location: 123 Innovation Drive", "Hours: Mon - Fri, 9:00 - 18:00"],
        "socials": ["Instagram", "LinkedIn"],
    },
}

PIN_AND_PAPER_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "A field guide - Vol. I",
        "title": "Kept\nthings",
        "notes": ["For: the room.\nTwo pages. One ask.", "Presented by A. Speaker\nRole - Team - Spring 2026"],
        "date": "29 - IV - 2026",
    },
    "agenda": {
        "title": "What's inside",
        "eyebrow": "Pin & Paper",
        "meta": ["North Field Office", "Phase I"],
        "items": [
            {"num": "01", "label": "The trust gap", "meta": "Findings - 12 min"},
            {"num": "02", "label": "Three pilots, scored", "meta": "Evidence - 9 min"},
            {"num": "03", "label": "A way of working", "meta": "Method - 7 min"},
            {"num": "04", "label": "What we ship next", "meta": "Decisions - 8 min"},
        ],
    },
    "notes": {
        "title": "Three rules we're keeping",
        "subtitle": "Pinned to the wall above every desk. We refer back to them when a decision feels too big to make from the seat we're in.",
        "cards": [
            {
                "num": "Rule - 01",
                "title": "Write the\nreal sentence",
                "body": "If a customer wouldn't read the email, the email is not the work. Plain words, signed by a person.",
                "scribble": "- write it by hand first.",
            },
            {
                "num": "Rule - 02",
                "title": "Earn the\nsecond look",
                "body": "Every interaction in the first 72 hours is doing four times the work of one in week three.",
                "scribble": "no autoresponder, ever.",
            },
            {
                "num": "Rule - 03",
                "title": "Keep the\nhandwriting",
                "body": "The system is allowed to grow, but the voice on the other end stays small enough to know who you wrote to last week.",
                "scribble": "200 names, max.",
            },
        ],
    },
    "sec": {
        "eyebrow": "Section II",
        "label": "Direction\n& doctrine",
        "title": "Where we\nare going,\nand why",
        "scribble": "- turn the page -",
    },
    "notice": {
        "eyebrow": "Notice - 05\nAction title",
        "title": "The trust gap is built in the first 72 hours, not the first 7 days - and the cost compounds for the rest of the lifecycle",
        "columns": [
            {
                "title": "What we found",
                "body": "Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.",
                "bullets": ["Email open #2 lifts D90 retention by 19 points.", "Personal salutation retained 2.4x the cohort.", "Reply received within 24 hours is the largest lever."],
                "source": "N = 14,200 - Q1 2026",
            },
            {
                "title": "Why it matters",
                "meta": "$4.1M projected retained ARR",
                "body": "The first three days are the only window where customers are both paying attention and willing to write back.",
                "bullets": ["Every interaction here does the work of four interactions in week three.", "The real cost is quiet churn, not refunds."],
                "source": "Modelled on FY24 cohort behaviour",
            },
            {
                "title": "What to do",
                "body": "Rewrite the first three touches and instrument the 72-hour window as a first-class weekly metric.",
                "bullets": ["Rewrite emails 1-3 in human voice.", "Route top accounts to a named human.", "Review the window every week."],
                "source": "Pilot scope: top-decile signups",
            },
        ],
    },
    "chart": {
        "title": "Curve\nbends at\nday three",
        "subtitle": "Cohorts that received a written welcome and a human reply within 24 hours retain at roughly 2x the rate of the templated cohort.",
        "legend": ["Templated welcome", "Written welcome", "Written + human reply"],
    },
    "process": {
        "title": "From insight to default,\nin five moves",
        "subtitle": "A repeatable path each pilot follows before it graduates to the default experience for every customer.",
        "steps": [
            {"n": "1", "title": "Frame", "body": "Translate the insight into a behavioural hypothesis."},
            {"n": "2", "title": "Design", "body": "Smallest end-to-end change that tests it cleanly."},
            {"n": "3", "title": "Pilot", "body": "Ship to a holdout and hold the line for two cycles."},
            {"n": "4", "title": "Read", "body": "Use pre-registered metrics only."},
            {"n": "5", "title": "Default", "body": "Promote and retire the legacy path."},
        ],
        "timeline": ["Week 1 - Frame", "Week 2-3 - Design", "Week 3-6 - Pilot", "Week 7 - Read", "Week 8 - Default"],
    },
    "matrix": {
        "title": "Where each pilot\nearns its keep",
        "subtitle": "Scored against the four levers that matter most this cycle.",
        "headers": ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
        "rows": [
            ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
            ["Build cost", "low", "medium", "low"],
            ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
            ["Risk to power users", "none", "material", "soft, reversible"],
        ],
    },
    "stats": {
        "title": "The case,\nby the numbers",
        "subtitle": "Three figures we will report against every cycle. If one stops moving, the bet is over.",
        "stats": [
            {"value": "2.4", "suffix": "x", "title": "Retention\nmultiple", "body": "Written welcome plus human reply, versus templated control."},
            {"value": "$4.1", "suffix": "M", "title": "Projected\nretained ARR", "body": "Modelled on the current quarter's signup cohort."},
            {"value": "72", "suffix": "hr", "title": "The window\nthat matters", "body": "Behaviour after the first 72 hours predicts long-term retention."},
        ],
    },
    "quote": {
        "quote": "Three days in, someone wrote me a real sentence. I'd been a customer of theirs for nine months before I noticed I'd never been a customer anywhere else again.",
        "author": "Margaux Leveque",
        "meta": "CFO - mid-market retailer - 14 months in",
    },
    "cta": {
        "title": "Pick the\nthree\nbets",
        "subtitle": "Three pilots in eight weeks. We'll bring back evidence the quarter after.",
        "right_title": "How we move this week",
        "steps": [
            {"n": "1", "title": "Pick the pilots", "body": "Confirm two of three by Friday. Owners named in the same conversation."},
            {"n": "2", "title": "Pre-register the read", "body": "Lock the metric, holdout, and kill criteria before code ships."},
            {"n": "3", "title": "Clear the release path", "body": "Ship behind a reversible flag and review weekly."},
        ],
    },
}

SAKURA_CHROMA_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "brand": "tape\ngarden",
        "edition": "CATALOGUE NO. 7",
        "title": "T-26",
        "subtitle": "SUPERCATALOG",
        "footer_left": "限定版  made in matsumoto",
        "footer_status": "N.R. :  ON  OFF",
        "seal": "26",
        "stamp_label": "AS SEEN ON",
        "stamp": "TG",
    },
    "manifesto": {
        "eyebrow": "A short letter from the studio, January 2026",
        "title": "We make small analog things for the people who keep tape recorders on their desks.",
    },
    "catalogue": {
        "title": "The 2026 Catalogue",
        "eyebrow": "Four products - spring & summer release",
        "cards": [
            {
                "tone": "red",
                "name": "SC-01\nBLOOM PEDAL",
                "body": "A tape-saturation pedal voiced after late-70s cassette decks. Three knobs, one switch, and one warm output.",
                "extra": "Hand-wired in Matsumoto, one batch at a time, with a cream rosette stamped on the bottom plate.",
                "specs": ["FORMAT 9V pedal", "CHANNELS Mono TRS", "CASE Steel", "PRICE ¥38,000", "SHIPS 14 Mar"],
            },
            {
                "tone": "pink",
                "name": "SC-02\nCHROMA DECK",
                "body": "A studio cassette deck reissued from our 1981 design with quartz-locked transport and switchable bias.",
                "extra": "Each unit ships with a numbered plate, hand-cut sleeve, and a note about wearing it in slowly.",
                "specs": ["FORMAT Hardware", "EDITION 320 units", "FINISH Cream steel", "PRICE ¥184,000", "SHIPS 02 May"],
            },
            {
                "tone": "orange",
                "name": "SC-03\nSUPER TAPE",
                "body": "Seven C-60 cassettes, each labelled with a colour, a season, and a side on cream printed stock.",
                "extra": "Refill packs ship four times a year. Subscribers get a studio note with each delivery.",
                "specs": ["FORMAT 7 x C-60", "EDITION Open", "PACK Letterpress", "PRICE ¥7,200", "SHIPS 14 Jun"],
            },
            {
                "tone": "blue",
                "name": "SC-04\nMIX CHAIR",
                "body": "A listening chair upholstered in cassette-loop fabric, woven from our own studio off-cuts.",
                "extra": "Each chair is signed on the underside and dated to the day it left the workshop.",
                "specs": ["FORMAT Furniture", "FRAME Solid ash", "UPHOLSTERY Tape", "PRICE ¥420,000", "SHIPS 22 Aug"],
            },
        ],
    },
    "stripe": {
        "eyebrow": "A note pinned above the workbench",
        "title": "Build the thing first, then write the spec sheet.",
        "author": "- Ren Kobayashi / founder / 2024",
    },
    "data": {
        "title": "Output, by year",
        "eyebrow": "Units shipped - 2019-2026 - Q3 estimate",
        "metrics": [
            {
                "value": "26",
                "suffix": "K",
                "label": "Units shipped, 2026",
                "body": "Our biggest year yet, driven mostly by the Bloom Pedal selling through three production runs.",
                "tone": "red",
            },
            {
                "value": "61",
                "suffix": "%",
                "label": "Repeat customers",
                "body": "Three of every five orders this year went to a household we'd already shipped to before.",
                "tone": "blue",
            },
        ],
        "bars": [2, 3, 3, 4, 4, 5, 5, 6],
        "labels": ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"],
    },
    "quote": {
        "eyebrow": "A reader writes",
        "quote": "\"It feels less like a gadget and more like a small machine that has decided to be friendly with my desk.\"",
        "author": "Mei Tanaka",
        "meta": "Reader letter / Bloom Pedal owner / April 2025",
    },
    "cal": {
        "title": "Release schedule",
        "eyebrow": "Spring & summer - 2026",
        "rows": [
            ["14.03", "SC-01 Bloom Pedal - first run", "Open edition - 600 units", "PEDAL", "red", True],
            ["02.05", "SC-02 Chroma Deck - numbered run", "Limited - 320 units", "DECK", "pink", True],
            ["14.06", "SC-03 Super Tape boxset", "Open - refilled monthly", "TAPE", "orange", False],
            ["12.07", "SC-03b Summer side - 4 cassettes", "Refill kit", "TAPE", "orange", False],
            ["22.08", "SC-04 Mix Chair - workshop run", "Single piece", "CHAIR", "blue", True],
            ["03.10", "Open studio & listening night", "Matsumoto workshop", "EVENT", "green", False],
            ["14.11", "Catalogue No. 8 - early preview", "Subscribers only", "PREVIEW", "pink", True],
        ],
    },
    "colophon": {
        "eyebrow": "Colophon - Catalogue No. 7",
        "title": "See you in volume eight.",
        "seal": "VOL\n26",
        "stamp": "COMPLETE",
        "footer": [
            {"label": "Studio", "body": "Tape Garden - Matsumoto\nest. 2018"},
            {"label": "Designed", "body": "In a small room beside the\ntape archive - over six months"},
            {"label": "Until next year", "body": "Catalogue No. 8 ships January 2027. Mailing list opens with the snow."},
        ],
    },
}

RETRO_WINDOWS_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "slide-1": {
        "icon": "P",
        "window_title": "PRESENTATION.EXE",
        "title": "Quarterly Overview",
        "marquee": "Welcome to the presentation template - Use arrow keys or navigation dots to browse slides",
        "body": "Please wait while content loads...",
        "buttons": ["OK", "Cancel", "Help"],
        "footer": "Version 1.0 - Build 2026.05.01 - All systems operational",
    },
    "slide-2": {
        "icon": "A",
        "window_title": "AGENDA.TXT",
        "title": "Today's Discussion Topics",
        "subtitle": "Select an item to navigate. Use keyboard shortcuts for faster access.",
        "primary_title": "Primary Items",
        "secondary_title": "Secondary Items",
        "primary": ["Executive summary and framing", "Quarterly revenue comparison", "Product capabilities overview", "Market segment distribution"],
        "secondary": ["Metrics dashboard review", "Organizational structure", "Project roadmap 2026", "Closing and next steps"],
        "status": "READY",
        "footer": ["Slides: 10", "Mode: Presentation", "Owner: Strategy"],
    },
    "slide-3": {
        "icon": "R",
        "window_title": "README.DOC",
        "title": "Executive Summary",
        "body": "This deck summarizes current performance, operating priorities, and the near-term roadmap using a nostalgic desktop application metaphor.",
        "boxes": [
            {"title": "Key Objectives", "body": "Align stakeholders around progress, risk, and ownership before the next operating review."},
            {"title": "Primary Outcomes", "body": "Clear priorities, visible metric movement, and a shared view of what must ship next."},
        ],
        "stats": [
            {"label": "Prepared by", "value": "Department Name"},
            {"label": "Date", "value": "May 01, 2026"},
            {"label": "Classification", "value": "Internal Use"},
            {"label": "Review Status", "value": "Approved", "accent": "green"},
        ],
    },
    "slide-4": {
        "icon": "D",
        "window_title": "DATAVIEW.CSV",
        "title": "Quarterly Revenue Comparison",
        "buttons": ["Export", "Print"],
        "bars": [
            {"label": "Q1 2026", "value": "$1.2M", "growth": "+5%", "height": 42},
            {"label": "Q2 2026", "value": "$1.5M", "growth": "+12%", "height": 52},
            {"label": "Q3 2026", "value": "$1.9M", "growth": "+18%", "height": 66},
            {"label": "Q4 2026", "value": "$2.1M", "growth": "+22%", "height": 74},
        ],
        "highlights": ["Q3 exceeded projections by 18%", "Enterprise segment grew 24% YoY", "Recurring revenue now at 62% of total"],
        "footer": ["Data source: Internal reporting system", "Updated: May 2026", "Currency: USD (millions)"],
    },
    "slide-5": {
        "icon": "F",
        "window_title": "FEATURES.INI",
        "title": "Product Capabilities Overview",
        "subtitle": "A detailed breakdown of current platform features and their implementation status.",
        "modules": [
            {"title": "User Authentication Service", "value": 100},
            {"title": "Data Processing Engine", "value": 92},
            {"title": "Reporting Dashboard", "value": 88},
            {"title": "Advanced Analytics Suite", "value": 65, "open": True},
        ],
        "details": [
            "Auth Service: Supports SSO, MFA, and role-based access control.",
            "Data Engine: Handles 10M+ records daily with sub-second query response.",
            "Dashboard: Real-time visualization with custom layouts and reports.",
            "Analytics: Predictive modeling and trend forecasting in beta.",
        ],
        "metrics": [
            {"label": "Active", "value": "12"},
            {"label": "In Dev", "value": "3"},
            {"label": "Planned", "value": "2"},
        ],
    },
    "slide-6": {
        "icon": "G",
        "window_title": "GRAPHS.BMP",
        "title": "Market Segment Distribution",
        "segments": [
            {"label": "Enterprise", "value": "42%", "color": "blue"},
            {"label": "Mid-Market", "value": "28%", "color": "green"},
            {"label": "Small Business", "value": "18%", "color": "cyan"},
            {"label": "Government", "value": "12%", "color": "yellow"},
        ],
        "insight": "Enterprise clients continue to drive the majority of revenue, while mid-market accounts show the fastest growth rate.",
        "footer": "Total Addressable Market: $4.2B - Our Share: 8.3%",
    },
    "slide-7": {
        "icon": "M",
        "window_title": "METRICS.LOG",
        "title": "Performance Metrics Dashboard",
        "metrics": [
            {"title": "Revenue", "value": "$2.1M", "delta": "+18.3%"},
            {"title": "Customers", "value": "1,482", "delta": "+124"},
            {"title": "Retention", "value": "94.2%", "delta": "+2.1%"},
            {"title": "NPS Score", "value": "72", "delta": "+5"},
        ],
        "kpis": ["Avg. Response Time 124ms", "System Uptime 99.97%", "Support Tickets 342 (-12%)", "Feature Adoption 68%", "API Calls / Day 4.2M"],
        "status": "All systems operational",
    },
    "slide-8": {
        "icon": "E",
        "window_title": "EXPLORER.EXE",
        "title": "Organizational Structure",
        "tree": [
            "Executive Leadership",
            "  Office of the CEO",
            "  Chief of Staff",
            "Engineering",
            "  Platform Team",
            "  Product Engineering",
            "Commercial",
            "  Sales",
            "  Marketing",
            "Operations",
            "  Finance",
            "  People & Culture",
        ],
        "rows": [
            ["Engineering", "84", "12"],
            ["Commercial", "56", "8"],
            ["Operations", "32", "4"],
            ["Leadership", "8", "0"],
        ],
        "plan": "Planning to expand engineering by 25% and commercial teams by 18% over the next two quarters.",
        "total": "180 employees",
    },
    "slide-9": {
        "icon": "T",
        "window_title": "TIMELINE.PRJ",
        "title": "Project Roadmap 2026",
        "quarters": [
            {"title": "Q1 2026", "status": "Completed", "items": ["Research complete", "Baseline shipped"]},
            {"title": "Q2 2026", "status": "Completed", "items": ["Core migration", "Partner rollout"]},
            {"title": "Q3 2026", "status": "In Progress", "items": ["Advanced analytics", "Quality gates"], "active": True},
            {"title": "Q4 2026", "status": "Planned", "items": ["Global launch", "Operating review"]},
        ],
        "milestone": "Current Milestone: Q3 2026",
        "progress": 55,
        "cards": [
            {"label": "Risk Level", "value": "MODERATE", "color": "yellow"},
            {"label": "Budget Status", "value": "ON TRACK", "color": "green"},
            {"label": "Next Review", "value": "JUL 15", "color": "blue"},
        ],
    },
    "slide-10": {
        "icon": "?",
        "window_title": "SHUTDOWN.EXE",
        "title": "Thank You For Watching",
        "body": "Questions and feedback are always welcome.",
        "marquee": "Contact us at hello@company.example - Visit www.company.example - Follow @companyhandle",
        "contacts": [
            {"label": "Email", "value": "hello@example.com"},
            {"label": "Phone", "value": "+1 (555) 000-0000"},
            {"label": "Website", "value": "www.example.com"},
        ],
        "buttons": ["Restart", "Contact", "End Session"],
        "footer": "2026 Company Name - All rights reserved - Confidential & Proprietary",
    },
}

BLOCK_FRAME_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "Presentation Template",
        "title": "NEO-\nBRUTALISM\nSTYLE",
        "subtitle": "A bold, high-contrast template designed for maximum visual impact and uncompromising clarity.",
        "cta": "Get Started",
    },
    "agenda": {
        "eyebrow": "Overview",
        "title": "What We Deliver",
        "body": "Every project follows a rigorous process that balances creative exploration with systematic execution. The result is work that stands out while remaining fully functional.",
        "metrics": [
            {"value": "12+", "label": "Years"},
            {"value": "500+", "label": "Projects"},
            {"value": "40", "label": "Cities"},
        ],
    },
    "data_dashboard": {
        "eyebrow": "Core Features",
        "title": "Built for bold systems",
        "items": [
            {"letter": "A", "title": "Modular Layouts", "body": "Mix and match components to build unique presentations without starting from scratch each time."},
            {"letter": "B", "title": "Responsive Ready", "body": "Adapts seamlessly to different screen sizes while maintaining the bold visual language."},
            {"letter": "C", "title": "Design Tokens", "body": "Colors, borders, shadows, and typography are structured for repeatable production."},
            {"letter": "D", "title": "Impact First", "body": "High contrast and large type make each message clear from the back row."},
        ],
    },
    "data_dashboard-4": {
        "eyebrow": "Performance Data",
        "title": "Quarterly Growth Metrics",
        "series": [
            {"label": "Revenue", "values": [42, 58, 73, 90, 100]},
            {"label": "Users", "values": [28, 46, 67, 78, 94]},
            {"label": "Retention", "values": [61, 66, 74, 82, 94]},
        ],
        "stats": [
            {"value": "+142%", "label": "Revenue Growth"},
            {"value": "2.4M", "label": "Active Users"},
            {"value": "94%", "label": "Retention Rate"},
        ],
    },
    "quote_or_emphasis": {
        "quote": "Design is not just what it looks like. Design is how it works, how it feels, and how it lasts.",
        "author": "Core Principle, Version 4.0",
    },
    "process_or_timeline": {
        "eyebrow": "Visual System Methodology",
        "title": "How We Structure Every Project",
        "image_label": "Image Placeholder",
        "items": [
            "Discovery phase to map stakeholder needs and technical constraints before any visual work begins.",
            "Iterative wireframing with rapid feedback loops and clear decision logs.",
            "Implementation planning that keeps design intent connected to production reality.",
        ],
    },
    "process_or_timeline-7": {
        "eyebrow": "Roadmap",
        "title": "Project Timeline",
        "steps": [
            {"num": "01", "title": "Research", "body": "Market analysis, user interviews, and competitive audits to establish a foundation."},
            {"num": "02", "title": "Concept", "body": "Mood boards, sketches, and directional explorations define the visual language."},
            {"num": "03", "title": "Build", "body": "Design systems, templates, and implementation support are assembled."},
            {"num": "04", "title": "Launch", "body": "Final checks, handoff, and post-launch iteration keep momentum."},
        ],
    },
    "data_dashboard-8": {
        "eyebrow": "By The Numbers",
        "title": "Impact at a Glance",
        "metrics": [
            {"value": "98%", "label": "Client Satisfaction"},
            {"value": "14", "label": "Industry Awards"},
            {"value": "3.2x", "label": "Avg. ROI Increase"},
            {"value": "50+", "label": "Team Members"},
        ],
    },
    "process_or_timeline-9": {
        "eyebrow": "The Team",
        "title": "Meet the Crew",
        "people": [
            {"initials": "JD", "name": "J. Doe", "role": "Creative Lead", "body": "Oversees visual direction and ensures every project maintains a coherent narrative."},
            {"initials": "AS", "name": "A. Smith", "role": "Tech Director", "body": "Translates design systems into scalable technical architectures."},
            {"initials": "MK", "name": "M. Kim", "role": "Producer", "body": "Keeps delivery, feedback, and operations moving at speed."},
        ],
    },
    "closing": {
        "title": "Let's Build\nSomething Bold",
        "subtitle": "Ready to start your next project?",
        "cta": "Get In Touch",
    },
}

CAPSULE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "Presentation Template",
        "title": "CAPSULE",
        "subtitle": "A Framework for Bold Ideas",
        "pills": ["Concept", "Strategy", "Vision", "Future", "Design", "Next", "2026"],
    },
    "agenda": {
        "eyebrow": "01",
        "title": "Modular ideas in orbit",
        "body": "A playful editorial system for strategy, launch planning, and brand storytelling.",
        "orbit": ["Research", "Ideation", "Prototype", "Iterate", "Launch", "Scale"],
    },
    "data_dashboard": {
        "eyebrow": "Core Principles",
        "title": "The Capsule System",
        "cards": [
            {"mark": "I", "title": "Pill Geometry", "body": "Every content container uses soft rounded capsule forms."},
            {"mark": "II", "title": "Candy Palette", "body": "Accent colors rotate for balance rather than semantic meaning."},
            {"mark": "III", "title": "Editorial Contrast", "body": "Serif headlines pair with clean sans labels and body copy."},
        ],
    },
    "data_dashboard-4": {
        "eyebrow": "Performance Indicators",
        "title": "Signals that travel fast",
        "bars": [
            {"label": "Market Reach", "value": "82%", "width": 82},
            {"label": "Engagement", "value": "67%", "width": 67},
            {"label": "Conversion", "value": "45%", "width": 45},
            {"label": "Retention", "value": "91%", "width": 91},
            {"label": "Satisfaction", "value": "74%", "width": 74},
        ],
    },
    "quote_or_emphasis": {
        "eyebrow": "Bold",
        "quote": "The best ideas are the ones that feel inevitable right now and impossible five minutes before.",
        "author": "A Philosophy of Action",
        "pills": ["Inspire", "Create", "Elevate", "Now", "Today"],
    },
    "process_or_timeline": {
        "eyebrow": "Phased Implementation",
        "title": "From signal to launch",
        "steps": [
            {"num": "1", "title": "Discovery", "body": "Map the terrain before you traverse it."},
            {"num": "2", "title": "Definition", "body": "Sharpen the question to find the answer."},
            {"num": "3", "title": "Development", "body": "Build with intent, iterate with care."},
            {"num": "4", "title": "Delivery", "body": "Ship the work, then make it better."},
            {"num": "5", "title": "Evolution", "body": "Growth is a process, not a destination."},
        ],
    },
    "data_dashboard-7": {
        "eyebrow": "Key Metrics at a Glance",
        "title": "Proof in soft shapes",
        "metrics": [
            {"value": "340%", "label": "Growth in Active Users"},
            {"value": "12.4M", "label": "Total Reach Across Channels"},
            {"value": "98.2%", "label": "System Uptime Record"},
            {"value": "4.9", "label": "Average User Satisfaction Score"},
        ],
    },
    "slide-8": {
        "eyebrow": "System Architecture Overview",
        "title": "A flow of rounded decisions",
        "nodes": ["Input Layer", "Processing Core", "Decision Engine", "Output Stream"],
        "chips": ["Data Ingestion", "Transformation", "Distribution"],
    },
    "slide-9": {
        "eyebrow": "Visual Placeholder",
        "title": "Where Vision Meets Execution",
        "body": "Great ideas deserve rigorous craft, thoughtful iteration, and a commitment to the user experience at every stage.",
        "chips": ["Strategy", "Design", "Build", "Measure"],
    },
    "closing": {
        "eyebrow": "Continue",
        "title": "The Journey Continues",
        "subtitle": "Questions and conversation welcome",
        "pills": ["Explore", "Discover", "Go", "Begin", "Launch", "More"],
    },
}

BROADSIDE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "title": "this is the broadside style",
        "subtitle": "Protest poster meets publication cover. Type so large it becomes image.",
        "author": "Studio Notes",
        "context": "2026 · field brief",
    },
    "chapter": {
        "title": "what matters now",
        "subtitle": "A short chapter marker for the next argument.",
    },
    "statement": {
        "eyebrow": "thesis",
        "title": "clarity is a design decision, not a decorative finish.",
    },
    "split": {
        "eyebrow": "field note",
        "title": "ideas need both friction and form",
        "body": "The source system pairs publication gravity with poster scale.",
        "items": [
            "choose one sharp claim",
            "make the support visible",
            "leave a strong editorial trace",
        ],
    },
    "stats": {
        "metrics": [
            {"value": "68%", "label": "faster recall", "note": "large type anchors the message"},
            {"value": "4.2x", "label": "more contrast", "note": "orange and ink register instantly"},
            {"value": "16", "label": "source pages", "note": "each layout has a distinct role"},
        ],
    },
    "fadelist": {
        "title": "before during after",
        "items": ["before", "during", "after"],
    },
    "list": {
        "title": "operating principles",
        "items": [
            "Lead with a sentence that can stand alone.",
            "Let slash bullets cut the page rhythm.",
            "Keep evidence close to the claim.",
            "Use orange only when it needs to shout.",
        ],
    },
    "quote": {
        "quote": "Good editorial systems do not decorate information. They decide what gets remembered.",
        "author": "Broadside note",
    },
    "compare": {
        "title": "before after",
        "before": ["generic cards", "soft hierarchy", "decorative palette"],
        "after": ["poster scale", "visible structure", "argument-first rhythm"],
        "payoff": "The page becomes an editorial position.",
    },
    "chart": {
        "title": "attention by signal strength",
        "bars": [
            {"label": "headline", "value": 92},
            {"label": "evidence", "value": 74},
            {"label": "caption", "value": 48},
            {"label": "source", "value": 31},
        ],
    },
    "diagram": {
        "title": "argument flow",
        "steps": ["claim", "context", "evidence", "decision"],
    },
    "pie": {
        "title": "where the page works",
        "total": "100%",
        "legend": [
            {"label": "type scale", "value": "42%"},
            {"label": "contrast", "value": "33%"},
            {"label": "spacing", "value": "25%"},
        ],
    },
    "pyramid": {
        "title": "hierarchy stack",
        "layers": ["signal", "claim", "evidence", "detail", "source"],
    },
    "vtimeline": {
        "title": "release cadence",
        "timeline": [
            {"date": "week 01", "title": "frame the claim", "body": "Define the editorial position."},
            {"date": "week 02", "title": "build evidence", "body": "Attach data and examples."},
            {"date": "week 03", "title": "publish", "body": "Ship the artifact with a strong close."},
        ],
    },
    "cycle": {
        "title": "build measure learn",
        "steps": ["build", "measure", "learn", "adjust"],
    },
    "end": {
        "title": "let's talk.",
        "subtitle": "research@example.com · broadside system",
    },
}

CARTESIAN_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "title": {
        "eyebrow": "Presentation Template",
        "title": "Cartesian",
        "subtitle": "A minimalist framework for strategic narratives. Clean geometry meets editorial refinement.",
    },
    "agenda": {
        "title": "Session Agenda",
        "body": "An outline of key discussion points structured to guide our strategic conversation forward.",
        "items": [
            "Market Position Analysis",
            "Core Value Proposition",
            "Growth Trajectory",
            "Implementation Roadmap",
        ],
    },
    "statement": {
        "title": "Precision vs Signal",
        "quote": "Precision in approach defines the boundary between noise and signal.",
        "author": "Cartesian editorial thesis",
    },
    "barchart": {
        "title": "Quarterly Metrics",
        "body": "Comparative analysis across key business indicators demonstrating sustained momentum and operational efficiency.",
        "bars": [
            {"label": "Revenue", "value": 72},
            {"label": "Retention", "value": 54},
            {"label": "Reach", "value": 83},
            {"label": "Quality", "value": 62},
        ],
    },
    "twocol": {
        "title": "Structural Overview",
        "body": "A comprehensive examination of foundational elements that define our operational framework and strategic positioning within the market landscape.",
        "note": "Through iterative refinement and measured adaptation, the methodology ensures alignment with evolving objectives and stakeholder expectations.",
        "stats": [
            {"value": "47%", "label": "Efficiency"},
            {"value": "12x", "label": "Scale"},
            {"value": "3.2M", "label": "Reach"},
        ],
    },
    "cards": {
        "title": "Core Competencies",
        "cards": [
            {"mark": "I", "title": "Analytical Depth", "body": "Rigorous data-driven methodologies that transform raw information into actionable strategic intelligence."},
            {"mark": "II", "title": "Operational Scale", "body": "Streamlined processes designed to expand seamlessly while maintaining quality and consistency."},
            {"mark": "III", "title": "Adaptive Design", "body": "Flexible frameworks that evolve with changing conditions and emerging opportunities."},
        ],
    },
    "linechart": {
        "title": "Growth Projection",
        "body": "Multi-year trajectory illustrating compound growth patterns and market penetration metrics.",
        "points": [22, 32, 45, 58, 74, 86],
    },
    "timeline": {
        "title": "Implementation Phases",
        "steps": [
            {"year": "01", "title": "Discovery", "body": "Initial assessment and comprehensive audit of existing systems and processes."},
            {"year": "02", "title": "Strategy", "body": "Development of tailored frameworks aligned with organizational objectives."},
            {"year": "03", "title": "Execution", "body": "Phased rollout with continuous monitoring and iterative optimization."},
            {"year": "04", "title": "Scale", "body": "Expansion of proven methodologies across all operational units."},
        ],
    },
    "team": {
        "title": "Key Contributors",
        "people": [
            {"initial": "A", "name": "Alex Morgan", "role": "Research Lead"},
            {"initial": "J", "name": "Jordan Lee", "role": "Strategy Partner"},
            {"initial": "S", "name": "Sam Taylor", "role": "Design Systems"},
            {"initial": "R", "name": "Reese Park", "role": "Operations"},
        ],
    },
    "closing": {
        "title": "Thank You",
        "subtitle": "Questions & Discussion",
        "contact": "research@example.com",
    },
}

COBALT_GRID_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "title": "Index\n2026",
        "eyebrow": "Field Office Quarterly · Volume IV",
        "subtitle": "A field report on the state of things.",
        "footer_left": "Edited by\nField Office Editorial · Lin Ito & Anya Mehrotra",
        "footer_right": "Distributed\nTo subscribers & the open web · twice a year",
    },
    "manifesto": {
        "title": "A quiet question",
        "quote": "A trend is a quiet question that several rooms started asking at roughly the same time.",
        "eyebrow": "From the editor's note",
        "footer": "Index 2026 · opening pages",
    },
    "index": {
        "title": "The index, in six entries.",
        "eyebrow": "Spring 2026 · selected trends",
        "items": [
            {"num": "01.", "title": "Slow software", "body": "Tools that opt out of the urgency contest and instead promise to be quiet, considered, and on by default."},
            {"num": "02.", "title": "Domestic interfaces", "body": "Screens designed to live in living rooms — softer typography, warmer colour, and a willingness to be ignored."},
            {"num": "03.", "title": "Hand-set print again", "body": "A return to letterpress, risograph, and small-edition print, often paired with the most digital-feeling clients."},
            {"num": "04.", "title": "Quietly weird type", "body": "Display type with one slightly off detail that keeps a reader looking twice."},
            {"num": "05.", "title": "Receipts and ledgers", "body": "Information designed to be filed, not consumed."},
            {"num": "06.", "title": "Public weather", "body": "Brand writing that includes the actual weather of the day."},
        ],
    },
    "chapter": {
        "eyebrow": "Chapter one — the case for slow software",
        "title": "Software is a room",
        "body": "In its first chapter the Index follows the studios, products, and quiet middleware projects that are walking back the urgency the last decade trained us into. Less push. More return.",
    },
    "data": {
        "title": "Reader response, by quarter.",
        "eyebrow": "Newsletter opens · 2024 Q1 — 2026 Q1",
        "stats": [
            {"value": "82%", "label": "Open rate · Q1 2026", "body": "A 2.1× lift on the inaugural issue, driven mostly by long-form chapters being read on Sunday mornings."},
            {"value": "11k", "label": "Active subscribers", "body": "Quiet, mostly-not-on-social, paying readers; we do not run a referral programme."},
        ],
        "bars": [34, 42, 46, 52, 60, 66, 74, 82],
        "ticks": ["Q1 24", "Q2 24", "Q3 24", "Q4 24", "Q1 25", "Q2 25", "Q4 25", "Q1 26"],
    },
    "quote": {
        "eyebrow": "A note from the studio",
        "title": "A note from the studio",
        "quote": "We started the bulletin because the loudest readings of design were eating the ones we found ourselves rereading.",
        "author": "Lin Ito",
        "source": "Editor · Field Office Quarterly · letter to subscribers, March 2025",
    },
    "table": {
        "title": "Trend ledger, in long.",
        "eyebrow": "All ten · with our reading on each",
        "rows": [
            {"num": "01.", "name": "Slow software", "reading": "Tools that opt out of urgency by default.", "mood": "Quiet · welcomed", "delta": "14 pts"},
            {"num": "02.", "name": "Domestic interfaces", "reading": "Screens designed to live in living rooms.", "mood": "Warm · ambient", "delta": "9 pts"},
            {"num": "03.", "name": "Hand-set print", "reading": "Letterpress and risograph paired with digital briefs.", "mood": "Tactile · careful", "delta": "7 pts"},
            {"num": "04.", "name": "Quietly weird type", "reading": "Display faces with one slightly off detail.", "mood": "Curious · alert", "delta": "flat"},
            {"num": "05.", "name": "Receipts & ledgers", "reading": "Information designed to be filed, not consumed.", "mood": "Plain · honest", "delta": "5 pts"},
            {"num": "06.", "name": "Public weather", "reading": "Brand voice that admits the day's actual mood.", "mood": "Open · tender", "delta": "11 pts"},
        ],
    },
    "colophon": {
        "eyebrow": "Colophon · Index 2026",
        "title": "See you in the autumn issue.",
        "editors": "Editors\nLin Ito & Anya Mehrotra with the field-office collective",
        "design": "Designed\nIn Newsreader, Hanken Grotesk & DM Mono · cobalt on cream",
        "subscribe": "Subscribed\nfield-office.co · twice a year quiet, paid, and read slowly",
        "note": "Until autumn\nThe next issue ships October 2026. Look for the cobalt envelope on a Monday morning.",
    },
}

CORAL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "VENTURE",
        "title": "QUARTERLY\nSTRATEGY\nSESSION 2026",
        "location_label": "Location",
        "location": "7TH FLOOR",
        "date": "May 15 / 09:00 Start",
        "year": "2026",
    },
    "agenda": {
        "eyebrow": "01 / Overview",
        "title": "REDEFINING THE BOUNDARIES OF WHAT IS POSSIBLE",
        "body": (
            "We bring together diverse perspectives and bold ideas to create meaningful impact. "
            "Our approach combines strategic thinking with creative execution, ensuring every initiative "
            "delivers measurable results and lasting value."
        ),
    },
    "detail": {
        "number": "03",
        "title": "CORE\nPILLARS",
        "items": [
            {"label": "Innovation", "body": "Pushing boundaries with cutting-edge solutions and forward-thinking methodologies."},
            {"label": "Collaboration", "body": "Building strong partnerships across teams, disciplines, and industries."},
            {"label": "Execution", "body": "Delivering results with precision, speed, and uncompromising quality."},
        ],
    },
    "data_dashboard": {
        "eyebrow": "02 / Performance",
        "title": "GROWTH METRICS",
        "stat": "+147%",
        "stat_label": "Year Over Year",
        "bars": [
            {"label": "Awareness", "value": 72},
            {"label": "Engagement", "value": 84},
            {"label": "Retention", "value": 58},
            {"label": "Referral", "value": 91},
            {"label": "Conversion", "value": 64},
        ],
        "metrics": [
            {"value": "2.4M", "label": "Total Reach"},
            {"value": "89%", "label": "Retention Rate"},
            {"value": "156", "label": "New Partners"},
        ],
    },
    "process_or_timeline": {
        "title": "IMPACT",
        "bar_title": "GLOBAL INITIATIVE 2026",
        "bar_meta": "Phase One / Launch Q2\n12 Cities / 4 Continents",
    },
    "data_dashboard-6": {
        "title": "KEY OBJECTIVES",
        "subtitle": "Strategic priorities for the upcoming fiscal period",
        "cards": [
            {"mark": "A", "title": "EXPAND REACH", "body": "Enter new markets and establish presence in emerging territories through targeted campaigns.", "stat": "24"},
            {"mark": "B", "title": "DEEPEN ENGAGEMENT", "body": "Strengthen relationships with existing partners through enhanced service offerings.", "stat": "+45%"},
            {"mark": "C", "title": "OPTIMIZE FLOW", "body": "Streamline internal processes to improve delivery times and resource allocation.", "stat": "3.2x"},
        ],
    },
    "quote_or_emphasis": {
        "quote": "The best way to predict the future is to create it with intention, precision, and the courage to challenge convention.",
        "author": "Alexandra Chen",
        "role": "Chief Strategy Officer",
    },
    "process_or_timeline-8": {
        "eyebrow": "03 / Roadmap",
        "title": "PROJECT TIMELINE",
        "steps": [
            {"phase": "Q1", "title": "Discovery", "body": "Research and planning phase with stakeholder alignment."},
            {"phase": "Q2", "title": "Design", "body": "Concept development and prototype validation."},
            {"phase": "Q3", "title": "Build", "body": "Full implementation and iterative refinement."},
            {"phase": "Q4", "title": "Launch", "body": "Market release and performance monitoring."},
            {"phase": "+", "title": "Scale", "body": "Expansion and long-term optimization."},
        ],
    },
    "detail-9": {
        "title": "LEADERSHIP",
        "subtitle": "The people driving our vision forward",
        "people": [
            {"initials": "JD", "name": "Jordan Davis", "role": "Chief Executive"},
            {"initials": "MK", "name": "Morgan Kim", "role": "Head of Product"},
            {"initials": "SR", "name": "Sam Rivera", "role": "Creative Director"},
            {"initials": "TW", "name": "Taylor Wong", "role": "Operations Lead"},
        ],
    },
    "closing": {
        "title": "THANK\nYOU",
        "subtitle": "Let's build something extraordinary together. Reach out to start the conversation.",
        "contacts": [
            {"label": "Email", "value": "HELLO@VENTURE.IO"},
            {"label": "Phone", "value": "+1 (555) 014-2298"},
            {"label": "Office", "value": "SEATTLE, WA"},
        ],
        "socials": ["IN", "X", "DR"],
    },
}

DAISY_DAYS_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "title": {
        "eyebrow": "Workshop Playbook",
        "title": "Daisy Days",
        "subtitle": "A cheerful presentation template for bright moments",
    },
    "welcome": {
        "title": "Welcome to Today",
        "items": [
            "Review the materials on your desk",
            "Prepare your notes and supplies",
            "Take a moment to settle in comfortably",
            "Reach out if you need any assistance",
        ],
    },
    "weekly": {
        "title": "A Look at the Week",
        "days": [
            {"day": "Monday", "tone": "pink", "items": ["Reading", "Writing", "Numbers", "Science", "Art Studio"]},
            {"day": "Tuesday", "tone": "green", "items": ["Reading", "Numbers", "History", "Crafts", "Games"]},
            {"day": "Wednesday", "tone": "coral", "items": ["Reading", "Numbers", "Science", "Music", "Library"]},
            {"day": "Thursday", "tone": "yellow", "items": ["Reading", "Numbers", "Projects", "Skills", "Art Studio"]},
            {"day": "Friday", "tone": "lavender", "items": ["Reading", "Numbers", "Review", "Nature", "Garden"]},
        ],
    },
    "timeline": {
        "title": "Today's Schedule",
        "steps": [
            {"num": "1", "title": "Morning Gathering", "body": "Welcome circle and daily intentions"},
            {"num": "2", "title": "Learning Block", "body": "Core concepts and guided practice"},
            {"num": "3", "title": "Creative Time", "body": "Hands-on projects and exploration"},
            {"num": "4", "title": "Break", "body": "Refreshments and outdoor play"},
            {"num": "5", "title": "Reflection", "body": "Share learnings and closing circle"},
        ],
    },
    "chart-bar": {
        "title": "Progress Snapshot",
        "bars": [
            {"label": "Reading", "value": 78, "tone": "coral"},
            {"label": "Numbers", "value": 64, "tone": "mint"},
            {"label": "Science", "value": 52, "tone": "sky"},
            {"label": "Arts", "value": 88, "tone": "lavender"},
            {"label": "Movement", "value": 72, "tone": "pink"},
        ],
    },
    "cards": {
        "title": "Helpful Reminders",
        "cards": [
            {"icon": "1", "title": "Bring Curiosity", "body": "Arrive ready to notice, ask, and try new things."},
            {"icon": "2", "title": "Share Kindly", "body": "Use warm words and give every voice space."},
            {"icon": "3", "title": "Make Together", "body": "Build ideas with hands, sketches, and examples."},
            {"icon": "4", "title": "Celebrate Progress", "body": "Small steps count and deserve cheerful attention."},
        ],
    },
    "quote": {
        "title": "A Little Reminder",
        "quote": "Small moments of wonder can grow into a whole garden of ideas.",
        "author": "The Daisy Days Team",
    },
    "team": {
        "title": "Our Team",
        "people": [
            {"name": "Alex Rivera", "role": "Lead Guide", "tone": "pink"},
            {"name": "Sam Chen", "role": "Co-Teacher", "tone": "yellow"},
            {"name": "Jordan Park", "role": "Specialist", "tone": "lavender"},
            {"name": "Taylor Kim", "role": "Assistant", "tone": "mint"},
        ],
    },
    "process": {
        "title": "How It Works",
        "steps": [
            {
                "num": "1",
                "title": "Discover",
                "body": "Explore new topics through guided introductions and engaging materials",
            },
            {
                "num": "2",
                "title": "Practice",
                "body": "Apply concepts with hands-on activities and collaborative exercises",
            },
            {
                "num": "3",
                "title": "Reflect",
                "body": "Share insights and celebrate progress with the community",
            },
        ],
    },
    "donut": {
        "title": "Topic Distribution",
        "center_label": "Total",
        "center_value": "100%",
        "items": [
            {"label": "Literacy", "value": "33%", "tone": "coral"},
            {"label": "Numeracy", "value": "27%", "tone": "mint"},
            {"label": "Science", "value": "20%", "tone": "sky"},
            {"label": "Arts", "value": "13%", "tone": "yellow"},
            {"label": "Movement", "value": "7%", "tone": "lavender"},
        ],
    },
}

EDITORIAL_FOREST_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "A Presentation Template",
        "title": "Quarterly\nReview\n2026",
        "left_footer": "Studio Placeholder",
        "right_footer": "Presented by Name Placeholder",
    },
    "agenda": {
        "title": "Agenda.",
        "subtitle": "Five topics - ninety minutes",
        "topics": [
            {"num": "01", "title": "Where we stand today.", "foot": "Context", "tone": "green"},
            {"num": "02", "title": "The big shift.", "foot": "Insight", "tone": "pink"},
            {"num": "03", "title": "By the numbers.", "foot": "Data", "tone": "greenLite"},
            {"num": "04", "title": "How we'll get there.", "foot": "Plan", "tone": "cream"},
            {"num": "05", "title": "What it adds up to.", "foot": "Outcomes", "tone": "greenLite"},
        ],
    },
    "statement": {
        "eyebrow": "The shift",
        "quote": "The next twelve months are about doing fewer things, and doing them with more conviction.",
        "name": "Name Placeholder",
        "role": "Role Placeholder",
        "section": "Section 02",
    },
    "two-col": {
        "figure": "[ image - 880 x 760 ]",
        "figure_label": "Visual 01",
        "figure_caption": "Replace with photo",
        "eyebrow": "The big shift",
        "title": "Fewer bets, stronger commitments.",
        "paragraphs": [
            "Placeholder body copy sits here as a stand-in for the supporting narrative. Open with the point you want the audience to remember when they walk out of the room.",
            "Use the second paragraph to add proof - a customer, a moment in market, a number that earns the claim. Keep one idea per paragraph; trust the audience to follow.",
        ],
        "meta": [
            {"label": "Owner", "value": "Team Placeholder"},
            {"label": "Timeframe", "value": "Q2 - Q4"},
            {"label": "Status", "value": "On track"},
        ],
    },
    "data": {
        "eyebrow": "By the numbers",
        "title": "Revenue by quarter, year over year.",
        "legend": ["This year", "Last year"],
        "bars": [
            {"label": "Q1", "a": 62, "b": 48},
            {"label": "Q2", "a": 74, "b": 55},
            {"label": "Q3", "a": 81, "b": 67},
            {"label": "Q4", "a": 88, "b": 72},
            {"label": "YTD", "a": 92, "b": 78},
        ],
        "left_footer": "Revenue model",
        "right_footer": "Draft data",
    },
    "framework": {
        "title": "How we'll get there",
        "subtitle": "Four steps",
        "intro": "A simple plan, in four moves.",
        "steps": [
            {
                "num": "Step 01",
                "title": "Listen",
                "body": "Open the quarter with structured conversations across teams. Capture what we hear without filtering.",
                "meta": "Weeks 1-2",
                "owner": "Owner",
                "tone": "cream",
            },
            {
                "num": "Step 02",
                "title": "Align",
                "body": "Cluster signals into themes. Name them plainly so everyone uses the same language in every room.",
                "meta": "Week 3",
                "owner": "Owner",
                "tone": "green",
            },
            {
                "num": "Step 03",
                "title": "Build",
                "body": "Convert the themes into focused initiatives, with clear measures for every proposed bet.",
                "meta": "Weeks 4-7",
                "owner": "Owner",
                "tone": "pink",
            },
            {
                "num": "Step 04",
                "title": "Review",
                "body": "Return to the evidence, decide what continues, and cut the work that is not learning fast enough.",
                "meta": "Week 8",
                "owner": "Owner",
                "tone": "cream",
            },
        ],
    },
    "stats": {
        "title": "What it adds up to",
        "subtitle": "Year to date",
        "intro": "Three numbers that tell the story.",
        "metrics": [
            {
                "label": "Growth",
                "value": "+42",
                "unit": "%",
                "body": "Year over year increase in active accounts, ahead of the plan we set in January.",
            },
            {
                "label": "Retention",
                "value": "94",
                "unit": "%",
                "body": "Net retention across the top customer cohort, a four-point lift from last year.",
            },
            {
                "label": "Reach",
                "value": "3.1",
                "unit": "M",
                "body": "People served this quarter, across the markets we entered in the spring.",
            },
        ],
    },
    "summary": {
        "eyebrow": "In summary",
        "title": "Thank you",
        "subtitle": "Three things to take.",
        "items": [
            {"label": "One", "body": "The strategy holds. We are doing fewer things, and the right things."},
            {"label": "Two", "body": "The numbers back the bets. Growth, retention, and reach are all ahead of plan."},
            {"label": "Three", "body": "Next quarter, we keep the pace and add focus where the data points us."},
        ],
    },
}

EDITORIAL_TRI_TONE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "left_meta": "Vol. 04 - Editorial Brief",
        "center_meta": "Spring / Summer Edition",
        "right_meta": "FW - 2026",
        "title": "Studio & Salon",
        "tags": [
            "focus",
            "tech-equipped",
            "creativity",
            "coffee",
            "community",
            "coworking",
            "productivity",
            "inspiration",
            "flexible",
            "workshops",
            "collaboration",
            "studio",
        ],
    },
    "manifesto": {
        "eyebrow": "Chapter One - Manifesto",
        "number": "01",
        "title": "Placeholder lede sets the tone for the whole document.",
        "subtitle": "A short, declarative sentence followed by an aside in italic that carries the warmth.",
        "kicker": "An opening note",
        "paragraphs": [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur est at lobortis.",
            "Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo.",
            "Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis.",
        ],
        "signature": "with warmth, The Editorial Desk",
    },
    "grid": {
        "title": "Eight principles, loosely held.",
        "section": "03 - Principles",
        "cards": [
            {"num": "/ 01", "title": "Slow looking", "body": "A short paragraph describing the principle in plain language. Two sentences is plenty."},
            {"num": "/ 02", "title": "Open kitchen", "body": "Process in public. Show the sketches before they harden."},
            {"num": "/ 03", "title": "Borrowed light", "body": "Cite generously. The best ideas belong to a lineage."},
            {"num": "/ 04", "title": "Quiet defaults", "body": "Restraint as a posture. Loud only when the moment earns it."},
            {"num": "/ 05", "title": "Fewer, finer", "body": "Three considered objects beat thirty hurried ones."},
            {"num": "/ 06", "title": "Useful warmth", "body": "Make the work specific, welcoming, and usable."},
            {"num": "/ 07", "title": "Good rooms", "body": "Design for the conversation you want to host."},
            {"num": "/ 08", "title": "Return often", "body": "Keep the notes alive after the first reading."},
        ],
    },
    "stat": {
        "eyebrow": "04 - Headline Figure",
        "subtitle": "A portrait, in numbers.",
        "value": "72",
        "unit": "%",
        "label": "What this measures",
        "body": "Placeholder annotation. A short, candid sentence about what the figure means and what it doesn't.",
        "rows": [
            {"label": "Segment A", "value": "82.4"},
            {"label": "Segment B", "value": "63.9"},
            {"label": "Segment C", "value": "48.1"},
            {"label": "Segment D", "value": "31.0"},
        ],
    },
    "timeline": {
        "title": "A short trajectory, told in five stops.",
        "subtitle": "05 - Trajectory 2019 to present",
        "events": [
            {"year": "'19", "title": "The first prototype", "body": "A short caption per milestone, written in plain prose."},
            {"year": "'21", "title": "Quiet expansion", "body": "Placeholder copy describing a turning point."},
            {"year": "'23", "title": "A new house style", "body": "Type, color, voice - recast around a single editorial premise."},
            {"year": "'25", "title": "The salon, formalized", "body": "Monthly gatherings became a fixture, then the work's center."},
            {"year": "'26", "title": "Where we sit now", "body": "Present tense. A brief, honest description of the practice today."},
        ],
    },
    "chart": {
        "eyebrow": "06 - Composition",
        "title": "How the days arrange themselves.",
        "body": "A placeholder description for the chart on the right. Speak to the shape of the data - what rises, what plateaus.",
        "legend": [
            "Studio hours, deep work",
            "Salon & conversation",
            "Reading, drift, walking",
            "Correspondence, admin",
        ],
        "bars": [
            {"label": "W01", "values": [32, 18, 12, 8]},
            {"label": "W05", "values": [35, 22, 14, 7]},
            {"label": "W09", "values": [29, 26, 17, 9]},
            {"label": "W13", "values": [38, 28, 16, 10]},
            {"label": "W17", "values": [34, 30, 19, 11]},
            {"label": "W24", "values": [40, 32, 20, 12]},
        ],
    },
    "quote": {
        "eyebrow": "07 - In their words",
        "quote": "A placeholder pull-quote, set in italic with one phrase rendered as bold sans for emphasis, the way good editorial designers have always done it.",
        "author": "A. Placeholder-Surname",
        "role": "Editor-at-large - Sister Publication",
        "title": "Three short reads",
        "subtitle": "Voices, lightly edited - from the readership.",
        "reads": [
            {"num": "i.", "title": "On the rhythm", "body": "A two-line testimonial that reads as if spoken aloud."},
            {"num": "ii.", "title": "On the company", "body": "Another short note, useful and specific without being precious."},
            {"num": "iii.", "title": "On returning", "body": "A closing testimonial after the others have convinced the reader."},
        ],
    },
    "closer": {
        "eyebrow": "08 - Colophon & Index",
        "title": "Until the next volume.",
        "issue": "End of issue No. 04 - 016 pp.",
        "fin": "Fin.",
        "tags": ["issue 04", "spring volume", "colophon"],
        "columns": [
            {"label": "Editorial", "items": ["A. Placeholder", "B. Placeholder", "C. Placeholder"]},
            {"label": "Type", "items": ["Bricolage Grotesque", "Instrument Serif", "JetBrains Mono"]},
            {"label": "Printed by", "items": ["Placeholder Press", "City & State", "Recycled stock, 120gsm"]},
        ],
    },
}

EMERALD_EDITORIAL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "s1": {
        "title": "The State of the Work Ahead",
        "subtitle": "A presentation for the leadership team",
        "left_footer": "Prepared by the planning office",
        "right_footer": "November - MMXXV",
    },
    "s2": {
        "eyebrow": "What we will cover today",
        "title": "The Programme",
        "items": [
            {"num": "01", "title": "The Quarter In Review", "kind": "Overview - 8 min"},
            {"num": "02", "title": "Where Attention Moves Next", "kind": "Signal - 10 min"},
            {"num": "03", "title": "What The Numbers Tell Us", "kind": "Data - 12 min"},
            {"num": "04", "title": "The Working Method", "kind": "Process - 7 min"},
            {"num": "05", "title": "Questions And Decisions", "kind": "Close - 3 min"},
        ],
    },
    "s3": {
        "section": "Q3",
        "title": "The Quarter,\nIn Review.",
        "kicker": "A reading of the period",
        "body": (
            "A short briefing on the operating signals that shaped the quarter. The goal is not to cover every "
            "detail, but to name the patterns that should guide the next decision cycle."
        ),
        "meta": ["Overview", "Four themes"],
    },
    "s4": {
        "title_top": "Three Threads",
        "title_middle": "worth",
        "title_bottom": "Following Closely.",
        "items": [
            {"num": "01", "title": "Demand stays resilient", "body": "The headline is steady, but the composition keeps moving underneath."},
            {"num": "02", "title": "Work shifts toward evidence", "body": "Teams are asking for clearer proof before committing resources."},
            {"num": "03", "title": "Decision windows are shorter", "body": "The best forums are more frequent, more specific, and easier to close."},
        ],
    },
    "s5": {
        "title": "How the\nnumbers moved.",
        "subtitle": (
            "Two indicators tracked side by side across six quarters. The navy bars show what was committed; "
            "the paper bars show what was delivered against it."
        ),
        "legend": ["Committed", "Delivered"],
        "bars": [
            {"label": "Q1", "a": 72, "b": 54},
            {"label": "Q2", "a": 80, "b": 63},
            {"label": "Q3", "a": 66, "b": 60},
            {"label": "Q4", "a": 88, "b": 72},
            {"label": "Q5", "a": 76, "b": 69},
            {"label": "Q6", "a": 94, "b": 79},
        ],
    },
    "s6": {
        "eyebrow": "From question to decision",
        "title": "A four-step\nworking method.",
        "subtitle": (
            "A short loop the team runs every fortnight. Each step has a single owner and produces one artefact "
            "that the next step can use."
        ),
        "steps": [
            {"num": "01", "title": "Frame", "body": "Name the decision and the evidence needed to make it."},
            {"num": "02", "title": "Gather", "body": "Collect only the signals that change the answer."},
            {"num": "03", "title": "Decide", "body": "Make the tradeoff explicit and record the owner."},
            {"num": "04", "title": "Review", "body": "Return to the outcome before the next cycle starts."},
        ],
    },
    "s7": {
        "eyebrow": "Four numbers worth keeping in view",
        "title": "By the\nnumbers.",
        "subtitle": (
            "A short panel of indicators the team reviews each month. Variances are read against the plan agreed "
            "in March."
        ),
        "metrics": [
            {"value": "84", "unit": "%", "label": "Retention"},
            {"value": "3.2", "unit": "x", "label": "Pipeline"},
            {"value": "18", "unit": "d", "label": "Cycle time"},
            {"value": "+12", "unit": "pt", "label": "Quality lift"},
        ],
    },
    "s8": {
        "kicker": "The work that follows",
        "title_top": "Questions",
        "title_middle": "and",
        "title_bottom": "Discussion",
        "footer": "Thank you - continue the conversation after the session",
    },
}

GROVE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "Strategy - Presentation",
        "title": "[Presentation Title\nGoes Here]",
        "subtitle": "A type of work for audience or occasion. Month, Year.",
        "footer_left": "[Prepared by]",
        "footer_right": "[Confidential]",
        "marker": "01",
    },
    "chapter": {
        "num": "01",
        "eyebrow": "01 / Context",
        "title": "The landscape has shifted. Now we must decide where to stand.",
        "subtitle": "An honest assessment of where the market is, and where the opportunity lies.",
    },
    "statement": {
        "sidebar": "The Thesis",
        "chrome_left": "Core Insight",
        "chrome_right": "03",
        "kicker": "The Argument",
        "title": (
            "The brands that will lead the next decade are not the ones with the best product. "
            "They are the ones with the deepest understanding."
        ),
        "foot_right": "03 / 12",
    },
    "split": {
        "sidebar": "The Evidence",
        "chrome_left": "Research - Insight",
        "chrome_right": "04",
        "kicker": "What We Found",
        "title": "Audiences have outgrown the stories being told about them",
        "body": (
            "Three years of primary research across six markets revealed a consistent pattern: the gap between "
            "how brands communicate and how people actually live is widening."
        ),
        "items": [
            "Authenticity is valued over aspiration in all categories tested",
            "Trust is earned through consistency, not campaigns",
            "Communities form around shared values, not product features",
        ],
        "image_label": "[IMAGE PLACEHOLDER]",
        "image_caption": "[Caption: research context or visual annotation]",
        "foot_right": "04 / 12",
    },
    "stats": {
        "sidebar": "By The Numbers",
        "chrome_left": "Market - Metrics",
        "chrome_right": "05",
        "title": "Three numbers that define the opportunity",
        "metrics": [
            {"value": "73%", "label": "Of consumers distrust brand-created content"},
            {"value": "4.8x", "label": "Higher engagement for community-driven campaigns"},
            {"value": "#1", "label": "Driver of purchase decisions: peer recommendation"},
        ],
        "source": "Source: Primary Research - Year - N=sample size across geographies",
        "foot_right": "05 / 12",
    },
    "list": {
        "sidebar": "Our Approach",
        "chrome_left": "Framework",
        "chrome_right": "06",
        "kicker": "What Changes",
        "title": "Five principles that reframe how we think about brand",
        "body": "These are not tactics. They are the underlying commitments that make everything else possible.",
        "items": [
            "Start with the community, not the product - earn presence before claiming it",
            "Replace broadcast with conversation - listen before speaking",
            "Make the values visible in operations, not just in messaging",
            "Treat long-term relationship as the primary metric, not reach",
            "Give audiences ownership of the narrative - participation over performance",
        ],
        "foot_right": "06 / 12",
    },
    "quote": {
        "quote": (
            "The most radical thing a brand can do right now is simply tell the truth about what it is, "
            "and what it is not."
        ),
        "author": "[Author Name]",
        "role": "[Title] - [Year]",
    },
    "compare": {
        "sidebar": "Before / After",
        "chrome_left": "The Shift",
        "chrome_right": "08",
        "columns": [
            {
                "title": "The Old Model",
                "subtitle": "Brand as broadcaster - pushing messages outward",
                "body": (
                    "The organization speaks. The audience receives. Feedback is collected in annual surveys "
                    "and processed into next year messaging brief."
                ),
                "items": [
                    "Campaigns replace conversations",
                    "Reach is the primary metric",
                    "Community is a distribution channel",
                ],
            },
            {
                "title": "The New Model",
                "subtitle": "Brand as participant - embedded in the community",
                "body": (
                    "The organization listens first and speaks in response. Feedback is constant, not a project. "
                    "The community owns the story as much as the brand does."
                ),
                "items": [
                    "Relationships replace campaigns",
                    "Trust is the primary metric",
                    "Community is the source of strategy",
                ],
            },
        ],
        "foot_right": "08 / 12",
    },
    "chapter-9": {
        "num": "02",
        "eyebrow": "02 / Recommendation",
        "title": "What we propose - and why we believe it will work",
        "subtitle": "A practical framework built on the evidence, with clear priorities and measurable outcomes.",
    },
    "statement-10": {
        "sidebar": "The Recommendation",
        "chrome_left": "Strategic Direction",
        "chrome_right": "10",
        "kicker": "The Path Forward",
        "title": "Stop managing perception. Start deserving it.",
        "body": (
            "The organizations that win the next decade will earn trust slowly, through consistent action - "
            "not through the perfection of their messaging."
        ),
        "foot_right": "10 / 12",
        "light": True,
    },
    "chart": {
        "sidebar": "The Data",
        "chrome_left": "Trust Index - Category Benchmarks",
        "chrome_right": "11",
        "title": "Consumer trust by category",
        "subtitle": "Score out of 100 - Year - N=X",
        "bars": [
            {"value": 38, "label": "Finance"},
            {"value": 44, "label": "Media"},
            {"value": 56, "label": "Retail"},
            {"value": 62, "label": "Healthcare"},
            {"value": 79, "label": "Community"},
        ],
        "source": "Source: Research Institute - Consumer Trust Index - Year",
        "foot_right": "11 / 12",
    },
    "end": {
        "marker": "12",
        "title": "[Organization]",
        "subtitle": "The work begins when the presentation ends.",
        "contact": "[Author Name] - author@organization.com - organization.com",
        "footer": "[Deck version] - [Date] - [Confidentiality note]",
    },
}

LONG_TABLE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "edition": "5",
        "eyebrow": "december edition",
        "title": "Long Table",
        "city": "Lisbon",
        "cta": "Apply now",
        "availability": "22 seats only",
        "lede": "More than dinner, it's a long evening.",
        "badge": "Not a meal, an evening",
        "tagline": (
            "Where ten strangers, one cook, and a long evening meet under low light. Twice a month, by application."
        ),
        "issue": "No.\n05",
        "right_meta": "December · Lisbon · Edition",
        "right_note": "Twice a month, ten strangers, one cook, one long table. By application.",
        "page": "01 / 08",
    },
    "manifesto": {
        "edition": "·",
        "eyebrow": "a letter from the table",
        "title": "A note\nbefore\nwe sit.",
        "paragraphs": [
            (
                "We started Long Table in a borrowed kitchen, with six chairs we'd carried up the stairs, "
                "and the conviction that an evening is more than the food on the plates."
            ),
            (
                "Three years on we've seated almost two thousand strangers across nine cities, and we've learned "
                "that the chairs are sometimes the most important part."
            ),
            "This deck is the small handbook we send our hosts before each edition. It is also, quietly, an invitation.",
        ],
        "signature": "Iris & Theo",
        "signature_meta": "Long Table founders",
        "page": "02 / 08",
    },
    "index": {
        "title": "Three recent editions",
        "label": "Long Table · 2025 · selected",
        "cards": [
            {
                "num": "No. 03",
                "city": "Mexico City",
                "name": "A Plate\nof Quiet",
                "desc": (
                    "Eight courses cooked entirely on a single induction ring. The room agreed not to use phones "
                    "for the entire evening, and almost kept the agreement."
                ),
                "seats": "22 seats",
                "date": "14 March 2025",
            },
            {
                "num": "No. 04",
                "city": "Tokyo",
                "name": "A Soup\nof Letters",
                "desc": (
                    "A reading evening, with a single course served slowly. Four guest writers, one bowl per person, "
                    "and the longest pause we have ever held between courses."
                ),
                "seats": "18 seats",
                "date": "06 July 2025",
            },
            {
                "num": "No. 05",
                "city": "Lisbon",
                "name": "December\nEdition",
                "desc": (
                    "A long winter dinner. Twenty-two seats, one shared roast, and a quiet bookshop next door we'll "
                    "wander to between courses, when the rain agrees."
                ),
                "seats": "22 seats",
                "date": "11 December 2025",
            },
        ],
        "page": "03 / 08",
    },
    "featured": {
        "edition": "5",
        "eyebrow": "december · the featured edition",
        "title": "An evening\nfor the rain.",
        "lede": (
            "A long winter dinner in a converted printing room above a bookshop. One shared roast, an unhurried "
            "wine list, and a single intermission that may, if the weather agrees, become a walk to the harbour and back."
        ),
        "pills": ["Apply by 28 November", "Twelve seats left"],
        "info": [
            {"key": "When", "value": "11 December 2025", "serif": True},
            {"key": "Where", "value": "A printing room, Bairro Alto · Lisbon", "serif": True},
            {"key": "Who", "value": "Twenty-two seats, by application", "serif": True},
            {"key": "How long", "value": "From eight, well into the evening", "serif": True},
            {"key": "Seat", "value": "€84"},
        ],
        "page": "04 / 08",
    },
    "menu": {
        "kicker": "A Menu, in Five Slow Movements",
        "title": "December · Lisbon",
        "courses": [
            {
                "num": "i.",
                "name": "Roasted chestnut soup",
                "desc": "with brown butter, sage, and a single thin disc of pear",
                "pair": "unoaked white",
            },
            {
                "num": "ii.",
                "name": "A small bread, hot",
                "desc": "made the morning of, with cultured butter and a coarse salt",
                "pair": "water, lemon",
            },
            {
                "num": "iii.",
                "name": "Mackerel, lightly cured",
                "desc": "on toasted rye, with parsley oil and pickled celery",
                "pair": "vinho verde",
            },
            {
                "num": "iv.",
                "name": "A long roast, the centre course",
                "desc": "slow lamb shoulder, root vegetables under it, served family-style",
                "pair": "douro red",
            },
            {
                "num": "v.",
                "name": "Cheese, two only",
                "desc": "a soft, a hard, both local; quince paste and walnuts in the half-shell",
                "pair": "port, late bottled",
            },
        ],
        "page": "05 / 08",
    },
    "quote": {
        "kicker": "A guest writes",
        "quote": "An evening I keep describing, badly, to people who weren't there.",
        "author": "Hana Brennan",
        "meta": "long-table guest · Edition No. 04 · Tokyo",
        "page": "06 / 08",
    },
    "cal": {
        "title": "What's coming up",
        "label": "2026 calendar · subject to weather",
        "rows": [
            ["06", "Lisbon", "A long winter dinner, with a roast and a walk", "11 December 2025", "Sold out"],
            ["07", "Brooklyn", "A reading evening, with one quiet course", "17 January 2026", "12 seats left"],
            ["08", "Mexico City", "A small breakfast, taken slowly", "22 February 2026", "Apply now"],
            ["09", "Athens", "A spring supper, on a roof, with wind", "14 March 2026", "Apply now"],
            ["10", "Seoul", "A small soup of late letters", "06 May 2026", "Apply soon"],
            ["11", "Paris", "An afternoon, mostly cheese and wind", "18 June 2026", "Wait list"],
        ],
        "page": "07 / 08",
    },
    "closing": {
        "edition": "·",
        "eyebrow": "come and sit with us",
        "title": "See you\nat the table.",
        "desc": (
            "Every Long Table evening is by application. We read each one, and we usually answer within a week. "
            "The next room opens for Brooklyn on the seventeenth of January."
        ),
        "pills": ["long-table.co", "Apply for Brooklyn"],
        "footer": [
            {"tag": "Founded", "value": "2019 · Borrowed kitchen"},
            {"tag": "Set", "value": "Nine cities · one long room"},
            {"tag": "Until then", "value": "Keep the chair warm"},
        ],
        "page": "08 / 08",
    },
}

MAT_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "Studio Name - 2026",
        "title": "Craft\nMatters",
        "subtitle": "Designed for the hands that build things. A one-line description of what this product does.",
        "caption": "Tagline goes here",
        "card_title": "Designed by Studio Name,\nthe precision studio tools lab.",
        "card_body": "The world's most carefully considered product category.",
        "footer_left": "Product Design - April 2026",
        "footer_right": "MAT / 2026",
    },
    "statement": {
        "chrome_left": "The Thesis",
        "chrome_right": "02",
        "kicker": "Design Principle",
        "title": "Every surface is a decision.",
        "body": (
            "The studio environment shapes the work that happens inside it. "
            "Materials that perform quietly let the maker stay in flow."
        ),
        "items": [
            "Surface texture calibrated for blade resistance without drag",
            "Grip underside prevents slip on any workbench material",
            "Grid lines printed in low-contrast ink - visible without competing",
        ],
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "split": {
        "chrome_left": "The Object",
        "chrome_right": "03",
        "kicker": "Material Detail",
        "title": "A one-line description of what this product does.",
        "body": "A two-layer construction built for the way real studio work actually happens.",
        "image_label": "Product Image",
        "items": [
            "4mm recycled rubber base - weighted to stay flat",
            "Natural composite surface - self-healing up to 3000 uses",
            "Three colorways: Forest, Sand, Charcoal",
        ],
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "stats": {
        "chrome_left": "By the Numbers",
        "chrome_right": "04",
        "title": "The numbers that define the product category.",
        "metrics": [
            {"value": "4.7k", "label": "Units sold in the first 90 days of launch, across 12 countries."},
            {
                "value": "3.2x",
                "label": "Longer lifespan than the leading competitor in independent studio tests.",
            },
            {
                "value": "#1",
                "label": "Top-rated product category by Studio Supply Journal for two consecutive years.",
            },
        ],
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "quote": {
        "title": "Good design is as little design as possible.",
        "quote": "Good design is as little design as possible.",
        "author": "Dieter Rams",
        "role": "Designer",
    },
    "list": {
        "chrome_left": "Why It Matters",
        "chrome_right": "06",
        "kicker": "The Case",
        "title": "What a studio tool should do for the maker.",
        "body": "Four principles that informed every material and dimension decision in the product category's design.",
        "items": [
            "Disappear when in use so the work takes all the attention",
            "Improve output quality through surface calibration, not just feel",
            "Last long enough to become a trusted part of the studio environment",
            "Be honest about what it is - no branding that competes with the work",
        ],
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "compare": {
        "chrome_left": "Before / After",
        "chrome_right": "07",
        "title": "Before and after the material decision.",
        "columns": [
            {
                "label": "The Old Way",
                "title": "Generic product category from a supply catalog.",
                "body": "Works until it does not. Warps in heat, discolors with use, and feels like an afterthought.",
                "items": [
                    "Slips on polished surfaces without a grip layer",
                    "Grooves deepen and skew precision over time",
                    "Replaced every six months on average",
                ],
            },
            {
                "label": "The New Way",
                "title": "Product Name, purpose-built.",
                "body": (
                    "A surface that gets better with use. "
                    "The material compresses and recovers, keeping edges clean."
                ),
                "items": [
                    "Self-heals around use lines, keeping the surface flat",
                    "Grip base holds any workbench without adhesives",
                    "3000-use tested lifespan - typically 2 to 3 years in daily use",
                ],
                "accent": True,
            },
        ],
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "chart": {
        "chrome_left": "Performance",
        "chrome_right": "08",
        "title": "Lifespan by material category.",
        "unit": "Units: months of daily studio use",
        "bars": [
            {"label": "PVC", "value": 6, "height": 20},
            {"label": "Rubber", "value": 11, "height": 37},
            {"label": "Glass", "value": 18, "height": 60},
            {"label": "Product", "value": 30, "height": 100, "accent": True},
            {"label": "Leather", "value": 22, "height": 73},
        ],
        "source": "Source: Independent Material Durability Study - Studio Lab 2025",
        "footer_left": "Studio Name - Product Brief",
        "footer_right": "Design Studio",
    },
    "end": {
        "kicker": "Ready to Build",
        "title": "Start with the right surface.",
        "body": (
            "Order the Product Name at studio-website.com or find it at select "
            "independent supply stores worldwide."
        ),
        "card_title": "Get in touch.",
        "card_body": "hello@studio-website.com\n@studio on all platforms\nAvailable in 40+ countries",
        "footer_left": "Studio Name - 2026",
        "footer_right": "studio-website.com",
    },
}

EIGHT_BIT_ORBIT_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "slide-1": {
        "eyebrow": "Pixel Perfect Presentation System",
        "title": "8-BIT ORBIT",
        "subtitle": "A retro-futuristic deck engine for bold storytellers. Built for arcades, engineered for boardrooms.",
        "chips": ["10 Slides", "CSS Native", "Zero Dependencies"],
    },
    "slide-2": {
        "eyebrow": "Mission Brief",
        "title": "Rewiring How We Share Ideas",
        "body": (
            "Every presentation is an opportunity to transport your audience. This template fuses the tactile "
            "nostalgia of 16-bit aesthetics with modern typographic discipline."
        ),
        "body2": (
            "No canvas limits. No cookie-cutter layouts. Just pure CSS architecture delivering cinematic slide "
            "transitions and atmospheric depth through scanlines, grain, and glowing grids."
        ),
    },
    "slide-3": {
        "eyebrow": "Core Systems",
        "title": "Four Engines Running",
        "items": [
            {
                "title": "Modular Blocks",
                "body": "Swap components without breaking the grid. Every element is containerized and responsive by default.",
            },
            {
                "title": "Crisp Vectors",
                "body": "All visual effects are native CSS. No image assets required for borders, shadows, or patterns.",
            },
            {
                "title": "Live Data",
                "body": "Chart slides accept dynamic values. Bars grow with CSS transitions triggered on navigation.",
            },
            {
                "title": "Retro Atmosphere",
                "body": "Scanlines, CRT vignettes, starfields, and noise layers create an immersive viewing environment.",
            },
        ],
    },
    "slide-4": {
        "eyebrow": "Analytics Core",
        "title": "Quarterly Growth Metrics",
        "subtitle": "Fiscal performance across four sectors - normalized index",
        "metrics": [
            {"label": "Alpha", "value": 78},
            {"label": "Beta", "value": 92},
            {"label": "Gamma", "value": 64},
            {"label": "Delta", "value": 85},
            {"label": "Epsilon", "value": 56},
        ],
    },
    "slide-5": {
        "eyebrow": "System Load",
        "title": "Resource Allocation",
        "subtitle": "Percentage distribution across operational units",
        "metrics": [
            {"label": "Compute", "value": 88},
            {"label": "Storage", "value": 72},
            {"label": "Network", "value": 95},
            {"label": "Memory", "value": 61},
            {"label": "Graphics", "value": 44},
        ],
    },
    "slide-6": {
        "eyebrow": "Chronology",
        "title": "Development Roadmap",
        "timeline": [
            {"date": "Q1 2026", "title": "Concept & Architecture", "body": "Wireframes, palette selection, and core grid system established."},
            {"date": "Q2 2026", "title": "Asset Generation", "body": "Pixel components, iconography, and atmospheric effects coded."},
            {"date": "Q3 2026", "title": "Data Integration", "body": "Charting engine, animated counters, and dynamic state binding."},
            {"date": "Q4 2026", "title": "Global Launch", "body": "Public release with full documentation and community support."},
        ],
    },
    "slide-7": {
        "eyebrow": "Live Telemetry",
        "title": "Platform Vitals",
        "subtitle": "Real-time aggregate figures from active deployments",
        "metrics": [
            {"value": "847", "label": "Active Worlds"},
            {"value": "12.4M", "label": "Pixels Rendered"},
            {"value": "99.9%", "label": "Uptime Score"},
            {"value": "2048", "label": "Max Resolution"},
        ],
    },
    "slide-8": {
        "quote": (
            "The best presentations do not merely inform. They immerse. They transform the conference room into an "
            "arcade cabinet where every slide is a new level waiting to be unlocked."
        ),
        "author": "Lead Creative Technologist, Studio Orbital",
    },
    "slide-9": {
        "eyebrow": "Access Tiers",
        "title": "Choose Your Loadout",
        "tiers": [
            {
                "name": "Rookie",
                "price": "$0",
                "desc": "For solo explorers testing the waters.",
                "features": ["5 slide maximum", "Standard grid themes", "Community support", "Static export only"],
            },
            {
                "name": "Arcade",
                "price": "$29",
                "desc": "Serious builders need serious tooling.",
                "features": ["Unlimited slides", "All atmospheric packs", "Live data binding", "Priority rendering"],
            },
            {
                "name": "Boss",
                "price": "$79",
                "desc": "Enterprise-grade control and compliance.",
                "features": ["Everything in Arcade", "White-label export", "SSO & audit logs", "Dedicated pipeline"],
            },
        ],
    },
    "slide-10": {
        "title": "Ready Player One?",
        "subtitle": "Deploy your first 8-BIT ORBIT deck in under sixty seconds. No dependencies. No friction. Just pure presentation power.",
        "ctas": ["Initialize Deck", "View Documentation"],
    },
}

BIENNALE_YELLOW_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "date": "02.05-\n11.10.2026",
        "eyebrow": "Annual Survey · Issue No. 04",
        "title": "Aurora Programme",
        "footer_items": [
            {"heading": "Hosted by", "body": "Aurora Institute for Public Form"},
            {"heading": "Edition", "body": "Fourth annual open programme"},
            {"heading": "Reading", "body": "A field study of light, matter and atmosphere"},
            {
                "heading": "Notes",
                "body": "Six months of exhibitions, residencies and public lectures across three pavilions, mapped against a slow-changing palette of yellow.",
            },
        ],
    },
    "manifesto": {
        "quote": "A room is a slow argument with the sun. We have spent four years listening for what it answers.",
        "author": "From the Aurora Charter, 2023",
    },
    "programme": {
        "kicker": "Strands · 2026",
        "title": "Programme",
        "meta": (
            "Six interlocking strands run across the year. Each is independently curated, "
            "but every strand answers to the same question: what does light know that we don't?"
        ),
        "strands": [
            {
                "num": "01",
                "title": "Slow Atmospheres",
                "body": "A reading room of long-form essays, drawings and weather notebooks, organised around the changing yellow of late afternoon.",
            },
            {
                "num": "02",
                "title": "Public Form",
                "body": "Three commissions in three pavilions, each examining how a public square wears its own light over the course of a season.",
            },
            {
                "num": "03",
                "title": "Field Notes",
                "body": "A residency programme drawing artists, architects and meteorologists together for a hundred days of recording, drawing and arguing.",
            },
            {
                "num": "04",
                "title": "Quiet Editions",
                "body": "A typographic publishing strand committed to printing only what asks to be read in daylight, on warm paper, slowly.",
            },
            {
                "num": "05",
                "title": "Open Conversations",
                "body": "Twelve evenings of public talks, paired with a meal and a question: what is the weather like in your work?",
            },
        ],
    },
    "chapter": {
        "rail": "First Chapter - Slow Atmospheres",
        "number": "01",
        "title": "A reading of the season's quietest hours",
        "lede": (
            "In its first chapter the Aurora Programme convenes around the slowest light of the year: "
            "the long minutes after the sun has gone but before the room has admitted it. We open the season with a library of weather, field notes, and listening tables."
        ),
    },
    "data": {
        "title": "Public attendance",
        "label": "Open programme · 2022-2026",
        "stats": [
            {
                "value": "182 k",
                "label": "Visitors · Year four",
                "body": "A 2.4x rise on the inaugural year, drawn from a programme that grew slower than the audience.",
            },
            {
                "value": "74%",
                "label": "Returning audience",
                "body": "Three quarters of last year's visitors came back; nearly half came back twice.",
            },
        ],
        "rows": [
            {"year": "2022", "value": "76,400", "pct": 42},
            {"year": "2023", "value": "112,800", "pct": 62},
            {"year": "2024", "value": "141,200", "pct": 78},
            {"year": "2025", "value": "164,900", "pct": 91},
            {"year": "2026", "value": "182,300", "pct": 100},
        ],
    },
    "quote": {
        "kicker": "A note from the curator",
        "quote": "The yellow we use is not the yellow we mean. It is the yellow that arrives ten minutes after we leave the building.",
        "who": "Idun Reijners",
        "role": "Curator-at-large, Aurora Institute · letter to the editorial board, January 2026",
    },
    "cal": {
        "title": "Public calendar",
        "label": "Selected dates · May-October",
        "rows": [
            ["02.05", "The Long Yellow, opening lecture", "Pavilion of Quiet Form, Rotterdam", "90 min"],
            ["17.05", "A walk through the season's first room", "Reading Garden, Pavilion North", "2 hr"],
            ["06.06", "Public Form 01 - opening", "Square of the Slow Sun, Antwerp", "All day"],
            ["28.06", "Field Notes residency, week one supper", "House of the Half Window", "3 hr"],
            ["19.07", "A Letter to the Sun, evening reading", "Aurora Library, room 3", "75 min"],
            ["14.08", "Quiet Editions - print fair & book launch", "Type Garden, Pavilion South", "2 days"],
            ["22.09", "Open Conversations · meteorology & drawing", "Reading Room, ground floor", "2 hr"],
            ["11.10", "The Last Window, closing performance", "Pavilion of Quiet Form, Rotterdam", "60 min"],
        ],
    },
    "colophon": {
        "kicker": "Colophon · Programme 04",
        "title": "With thanks to the slow readers.",
        "footer_items": [
            {"heading": "Curated by", "body": "Idun Reijners with the editorial board"},
            {"heading": "Designed", "body": "In daylight, on warm paper, over fourteen weeks"},
            {"heading": "Hosts", "body": "Aurora Institute\nPavilion of Quiet Form\nReading Garden"},
            {"heading": "Until next year", "body": "The fifth programme opens in May 2027. Look for the yellow on the door."},
        ],
    },
}

CREATIVE_MODE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "s1": {
        "eyebrow": "VOL. 01 / EDITION 2026",
        "title": "Creative Mode",
        "subtitle": "A presentation template - eight pages, eight layouts. Generic placeholder copy throughout.",
        "footer": "A PRESENTATION TEMPLATE",
    },
    "s2": {
        "eyebrow": "A Note Before We Begin",
        "title": "Flip the switch.",
        "subtitle": (
            "Placeholder paragraph for an opening statement. Use this page to set up the chapter, "
            "introduce the speaker, and frame the question the deck is going to answer."
        ),
        "marker": "PRESS PLAY",
        "points": [
            "Set up the chapter",
            "Balance the page with context",
            "Point forward to the rest of the deck",
        ],
    },
    "s3": {
        "eyebrow": "By the Numbers",
        "title": "Four figures, one story.",
        "metrics": [
            {"value": "42%", "label": "Lift In Engagement", "body": "Placeholder caption describing why it matters."},
            {"value": "2.7x", "label": "Throughput Multiplier", "body": "A short generic explainer line."},
            {"value": "118", "label": "Active Placeholders", "body": "Filler descriptor about the count."},
            {"value": "$9.4M", "label": "Total Sample Value", "body": "Closing stat caption."},
        ],
    },
    "s4": {
        "eyebrow": "System Diagram",
        "title": "A stack of moving parts.",
        "subtitle": (
            "Generic placeholder description for the schematic. The four blocks represent layers of a "
            "hypothetical system."
        ),
        "layers": ["Layer alpha - interface", "Layer beta - orchestration", "Layer gamma - services", "Layer delta - substrate"],
    },
    "s5": {
        "eyebrow": "Quarterly Readout",
        "title": "Placeholder metric, by quarter.",
        "metrics": [34, 48, 61, 55, 72, 84, 91],
        "labels": ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25"],
    },
    "s6": {
        "eyebrow": "How It Works",
        "title": "A four-step process.",
        "items": [
            {"title": "Discover", "body": "Generic placeholder description for the first step."},
            {"title": "Define", "body": "Filler text outlining the second step of the process."},
            {"title": "Develop", "body": "Third step placeholder with rhythmic color cards."},
            {"title": "Deliver", "body": "Closing step copy anchored by the primary color."},
        ],
    },
    "s7": {
        "eyebrow": "Side By Side",
        "title": "Three options, compared.",
        "headers": ["Attribute", "Option A", "Option B", "Option C"],
        "rows": [
            ["Speed", "Fast", "Faster", "Fastest"],
            ["Footprint", "Light", "Medium", "Heavy"],
            ["Effort", "Low", "Mid", "High"],
            ["Outcome", "Sample", "Sample", "Sample"],
        ],
    },
    "s8": {
        "eyebrow": "End Of Deck",
        "title": "Thank You",
        "subtitle": "Generic placeholder closing line for the final slide.",
        "stamp": "08/08",
        "items": ["Template Set", "Final Slide", "Contact"],
    },
}

MONOCHROME_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "User Research Synthesis / [Month, Year]",
        "title": "User Research Synthesis",
        "subtitle": "What we learned from 24 interviews and what it means for the product.",
        "footer_left": "Research Team - [Month, Year]",
        "footer_right": "Round [N] - Internal",
        "page": "01 / 16",
    },
    "chapter": {
        "chapter": "01 - Context",
        "title": "Why we went back to users",
        "subtitle": "Three months after launch, retention numbers told us something the metrics couldn't.",
        "header_left": "Context",
        "header_right": "02",
    },
    "statement": {
        "eyebrow": "Primary objective - Round [N] synthesis",
        "header_left": "Key Finding",
        "header_right": "03",
        "title": "Users don't leave because they lose interest. They leave because they don't know what to do next.",
    },
    "split": {
        "header_left": "User Behavior",
        "header_right": "04",
        "eyebrow": "The Pattern",
        "title": "The first 48 hours determine everything",
        "subtitle": "Users who complete three core actions in their first two days have a 4x higher 90-day retention rate. Most never get there.",
        "bullets": [
            "Onboarding drop-off peaks at step 3",
            '"What do I do next?" is the most common exit trigger',
            "Users who invite a teammate retain at 2x the rate",
        ],
        "caption": "Session recording review - [Month of study]",
    },
    "stats": {
        "header_left": "By the Numbers",
        "header_right": "05",
        "title": "What the data showed",
        "stats": [
            {"value": "68%", "label": "of users churned within 14 days - up from 54% in cohort 2", "note": "[Analytics tool] - [Launch month]"},
            {"value": "3.2min", "label": "Average time before abandonment on the setup flow", "note": "Session recordings - n=240"},
            {"value": "4x", "label": "Higher 90-day retention for users who complete onboarding fully", "note": "Cohort analysis"},
        ],
    },
    "list": {
        "header_left": "Recommendations",
        "header_right": "06",
        "eyebrow": "What to fix",
        "title": "Five changes, ordered by impact",
        "subtitle": "We recommend addressing these sequentially - later ones depend on the first landing.",
        "bullets": [
            "Redesign the setup flow to three steps maximum",
            'Add a "start here" prompt on day one based on user type',
            "Surface the collaboration invite after first meaningful action",
            "Replace feature tour with outcome demonstration",
            "Build a 7-day email sequence that mirrors in-product progress",
        ],
    },
    "compare": {
        "header_left": "Current - Proposed",
        "header_right": "07",
        "left_label": "Current Onboarding",
        "left_title": "9-step setup, any order",
        "left_body": "Users choose their own path through setup. Most choose wrong.",
        "left_bullets": [
            "Average 3.2 minutes to first value",
            "Step 6 is where 41% abandon",
            "No adaptive logic based on user type",
        ],
        "right_label": "Proposed Flow",
        "right_title": "3-step guided path, adaptive",
        "right_body": "User type detected at signup. Path adjusts. First value in under 90 seconds.",
        "right_bullets": [
            "Target: 90 seconds to first value",
            "Eliminate decision paralysis at step entry",
            "Inline help triggered at abandonment signals",
        ],
    },
    "quote": {
        "quote": '"I kept opening the app and then closing it again. I didn\'t know what I was supposed to do."',
        "author": "Participant 14 - 28 years old, Product Designer",
        "context": "Churned after day 11",
    },
    "dense": {
        "header_left": "Analysis",
        "header_right": "09",
        "title": "Why onboarding problems compound over time",
        "columns": [
            {
                "title": "The Activation Trap",
                "body": [
                    "Activation is the moment a user experiences the core value of a product for the first time. When that moment is delayed, the mental model never fully forms.",
                    "Each session that ends without activation reinforces the exit pattern. The gap between download and habit is where most products lose users permanently.",
                    "Users who hit activation in session one have a 3x higher probability of returning in week two.",
                ],
            },
            {
                "title": "The Network Effect Delay",
                "body": [
                    "Collaboration products face a compounding problem: value increases with each teammate, but users must cross the value threshold alone.",
                    "The median user does not discover the invitation flow until session four, after most have already churned.",
                    "The single-player experience should become an explicit bridge to the collaborative one.",
                ],
            },
        ],
    },
    "chart": {
        "header_left": "Retention Analysis",
        "header_right": "11",
        "title": "90-day retention by onboarding cohort",
        "caption": "% retained - n=480 - [Q1 of study period]",
        "bars": [
            {"label": "Cohort 1", "value": 34},
            {"label": "Cohort 2", "value": 41},
            {"label": "Cohort 3", "value": 48},
            {"label": "Proposed", "value": 67, "accent": True},
        ],
        "source": "Source: [Analytics tool] - Cohort analysis - Proposed target based on redesigned onboarding flow",
    },
    "diagram": {
        "header_left": "Methodology",
        "header_right": "12",
        "title": "How this research was conducted",
        "steps": [
            {"number": "01", "title": "Recruit", "body": "24 participants screened from the active user base."},
            {"number": "02", "title": "Interview", "body": "60-minute moderated sessions with cognitive walkthroughs."},
            {"number": "03", "title": "Analyse", "body": "Affinity mapping across 340 observations."},
            {"number": "04", "title": "Validate", "body": "Findings stress-tested against recordings and support data."},
        ],
    },
    "pie": {
        "header_left": "Participant Breakdown",
        "header_right": "13",
        "title": "Who we spoke with",
        "segments": [
            {"label": "Power Users", "value": "38%"},
            {"label": "Casual Users", "value": "25%"},
            {"label": "Churned Users", "value": "22%"},
            {"label": "Prospects", "value": "15%"},
        ],
        "total": "Total participants: [N] - [Study period]",
        "source": "Source: Recruitment screener - [Study period]",
    },
    "vtimeline": {
        "header_left": "Process",
        "header_right": "14",
        "title": "From research to recommendation",
        "timeline": [
            {"date": "[Week 1]", "title": "Recruitment", "body": "Screened [N]+ applicants and selected participants across segments."},
            {"date": "[Week 2-3]", "title": "Fieldwork", "body": "[N] moderated sessions. Think-aloud protocol. Sessions recorded and transcribed."},
            {"date": "[Week 4]", "title": "Synthesis", "body": "Affinity mapping across observations. Pattern clustering by behaviour type."},
            {"date": "[Week 5]", "title": "Validation", "body": "Findings stress-tested against analytics data and support ticket samples."},
        ],
    },
    "cycle": {
        "header_left": "Design Process",
        "header_right": "15",
        "title": "The design thinking cycle",
        "steps": [
            {"number": "01", "title": "Empathise", "body": "Understand users in their own context. Suspend assumptions."},
            {"number": "02", "title": "Define", "body": "Reframe the problem as a testable point of view."},
            {"number": "03", "title": "Prototype", "body": "Build to think, not to ship."},
            {"number": "04", "title": "Test", "body": "Put prototypes in front of real users."},
        ],
    },
    "pyramid": {
        "header_left": "Research Framework",
        "header_right": "17",
        "eyebrow": "Research Framework",
        "title": "Analysis Hierarchy",
        "subtitle": "From raw observations to strategic insight",
        "levels": [
            "Strategic Insight",
            "Behavioral Patterns",
            "Synthesized Themes",
            "Coded Observations",
            "Raw Field Notes",
        ],
    },
    "end": {
        "eyebrow": "Research Team",
        "title": "Questions, feedback, and next steps",
        "subtitle": "[research@org.com] - [Slack #research] - Full report at [link]",
        "header_left": "Research Team",
        "header_right": "16",
    },
}

NEO_GRID_BOLD_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "01 / 12",
        "title": "The future of data-driven finance",
        "subtitle": "All rights reserved.",
        "footer": "2025 DIGITS",
    },
    "toc": {
        "title": "Contents",
        "items": [
            {"label": "01 / Introduction", "title": "Digits in numbers", "body": "Where we are and what the platform handles today."},
            {"label": "02 / Product", "title": "Key features", "body": "Three primitives that power decision-making at scale."},
            {"label": "03 / Market", "title": "Penetration and growth", "body": "Where we are gaining ground, and where we are next."},
            {"label": "04 / Vision", "title": "What comes next", "body": "The roadmap for the next four quarters."},
            {"label": "05 / Voice", "title": "From our partners", "body": "Why teams are choosing the platform."},
            {"label": "06 / Action", "title": "Next steps", "body": "Three things to take away from today."},
        ],
    },
    "stats": {
        "eyebrow": "Market penetration",
        "title": "Digits in numbers",
        "subtitle": (
            "Empowering businesses with data-driven financial insights. With over 10 million users and "
            "75 million data points analyzed, the platform is reshaping real-time decision-making."
        ),
        "metrics": [
            {"value": "12.8M", "label": "Transactions processed"},
            {"value": "41M", "label": "Total revenue impacted"},
            {"value": "15.4M", "label": "Users engaged"},
            {"value": "85.6M", "label": "Data points analyzed"},
        ],
    },
    "features": {
        "title": "Key features",
        "eyebrow": "Three primitives",
        "items": [
            {"title": "Seamless transactions", "body": "Effortless and secure digital payments with real-time processing across every channel."},
            {"title": "Data insights", "body": "Leverage advanced analytics to uncover patterns, surface anomalies, and unlock new opportunities."},
            {"title": "Risk modelling", "body": "Predictive models tuned on billions of events score risk in milliseconds."},
        ],
    },
    "chart": {
        "eyebrow": "Section 03 / Market",
        "title": "Market penetration doubled.",
        "subtitle": "Year-on-year reach across our six largest regions. The platform now touches one in three small-business accounts.",
        "labels": ["NA", "EU", "LATAM", "APAC", "MENA", "SSA"],
        "seriesA": [42, 55, 36, 64, 48, 30],
        "seriesB": [78, 88, 62, 94, 72, 54],
    },
    "section": {
        "eyebrow": "Section / Vision",
        "number": "02",
        "title": "Build the engine of modern money.",
        "subtitle": (
            "The next decade of finance belongs to platforms that can model the world in real time, "
            "then act on it without a human in the loop."
        ),
    },
    "quote": {
        "quote": "The platform replaced four legacy systems and a quarterly committee. We now decide in minutes what used to take a month.",
        "author": "Marta Aguilar",
        "context": "CFO / Mid-market retailer",
    },
    "cta": {
        "eyebrow": "Take three things away",
        "title": "Next steps",
        "items": [
            {"label": "01 / Today", "title": "Pilot one workflow", "body": "Pick a single decision your team makes weekly and benchmark against the current process."},
            {"label": "02 / Next month", "title": "Scale the wedge", "body": "Expand the pilot to two adjacent workflows. Use the playbook the integrations team will share."},
            {"label": "03 / This quarter", "title": "Make it the default", "body": "Retire the legacy stack for that domain and move the freed-up budget into the next bet."},
        ],
    },
    "consult": {
        "eyebrow": "Action title / 09",
        "title": "The trust gap is built in the first 72 hours, not the first 7 days.",
        "columns": [
            {
                "title": "What we found",
                "metric": "Three behavioural signals",
                "bullets": [
                    "Email open #2 lifts D90 retention by 19 points.",
                    "Personal salutation retained 2.4x the cohort.",
                    "A single human reply within 24 hours is the largest lever.",
                    "Same-day mobile sign-in doubled second-week return visits.",
                ],
            },
            {
                "title": "Why it matters",
                "metric": "$4.1M projected retained ARR",
                "bullets": [
                    "The first three days carry both attention and willingness to write back.",
                    "Each interaction here replaces roughly four later touches.",
                    "The signal replicates across three independent cohorts.",
                ],
            },
            {
                "title": "What to do",
                "metric": "Pilot scope: top-decile signups",
                "bullets": [
                    "Rewrite emails 1-3 in human voice behind a 50/50 holdout.",
                    "Route every signup to a named human for one personal reply.",
                    "Instrument the 72-hour window as a weekly review metric.",
                    "Run quarterly teardowns of the bottom decile.",
                ],
            },
        ],
    },
    "chart2": {
        "eyebrow": "Section / Evidence",
        "title": "The curve bends at day three.",
        "subtitle": "Cohorts with written welcome and human reply retain at roughly 2x the templated cohort.",
        "labels": ["D0", "D7", "D14", "D30", "D45", "D60", "D90"],
    },
    "process2": {
        "title": "From insight to default, in five moves.",
        "subtitle": "A repeatable path each pilot follows before it is allowed to graduate to the default experience.",
        "items": [
            {"label": "01 / Frame", "title": "Hypothesise", "body": "Translate the insight into a single behavioural hypothesis."},
            {"label": "02 / Design", "title": "Sketch", "body": "Smallest end-to-end change that lets the hypothesis be tested cleanly."},
            {"label": "03 / Pilot", "title": "Ship 50/50", "body": "Holdout in one segment and hold the line for two cycles."},
            {"label": "04 / Read", "title": "Decide", "body": "Pre-registered metrics only: kill, scale, or extend."},
            {"label": "05 / Default", "title": "Graduate", "body": "Promote to default and retire the legacy path in the same release."},
            {"label": "Outcome", "title": "New default", "body": "A change every customer feels, backed by a result we can show."},
        ],
    },
    "matrix2": {
        "title": "Where each pilot earns its keep.",
        "subtitle": "Scored against the four levers that matter most this cycle.",
        "headers": ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox search"],
        "rows": [
            ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
            ["Build cost", "Low", "Medium", "Low"],
            ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
            ["Risk to power users", "None", "Material", "Soft, reversible"],
        ],
    },
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


STENCIL_TABLET_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "super": "Agency name x Partner name",
        "title": "Bold by\ndesign.",
        "who": "North & Partners",
        "subwho": "Brand - Strategy - Q2 2026",
        "date": "29 - IV - 2026",
    },
    "agenda": {
        "title": "Agenda",
        "meta": ["Agency x Partner", "Phase I"],
        "items": ["Agenda\nitem", "Agenda\nitem", "Agenda\nitem", "Agenda\nitem"],
    },
    "princ": {
        "title": "Our Principles",
        "meta": ["Agency x Partner", "Phase II"],
        "cards": [
            ["1", "Make it\nblunt", "Decisions read at a glance. If a stakeholder needs the legend, the slide is doing too much."],
            ["2", "Stay in\nthe system", "Three stencil numerals, two sans weights, six saturated colours. Anything else is a special case."],
            ["3", "Show the\nshape", "Lead with form. Use weight, scale, and silhouette before reaching for icons or imagery."],
            ["4", "Earn the\nblack slide", "Reserve full-bleed black for moments that deserve a beat. Never as wallpaper."],
        ],
    },
    "sec": {
        "title": "Direction",
        "meta": ["Section II"],
        "number": "02",
        "label": "Direction\n& doctrine",
        "headline": "Where we\nare going,\nand why.",
    },
    "consult": {
        "title": "Findings - Detail",
        "meta": ["Agency x Partner", "Phase III"],
        "tag": "Action title - 05",
        "action": (
            "The trust gap is built in the first 72 hours, not the first 7 days - "
            "and the cost compounds for the rest of the lifecycle."
        ),
        "columns": [
            [
                "What we found",
                "Three behavioural signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked.",
                [
                    "Email open #2 lifts D90 retention by 19 points.",
                    "A written welcome retained 2.4x the cohort.",
                    "One human reply within 24 hours is the largest lever.",
                ],
                "N = 14,200 - Q1 2026",
            ],
            [
                "Why it matters",
                "$4.1M projected retained ARR - current cohort.",
                [
                    "The first three days are the only window where customers are paying attention.",
                    "Every interaction here does the work of four later interactions.",
                ],
                "Modelled on FY24 cohort behaviour",
            ],
            [
                "What to do",
                "Rewrite emails 1-3 in human voice and route high-value signups to named humans.",
                [
                    "Ship behind a 50/50 holdout.",
                    "Measure reply rate, second-open rate, and D90 retention.",
                ],
                "Pilot scope: top-decile signups",
            ],
        ],
    },
    "chart": {
        "title": "Retention, by cohort",
        "meta": ["Phase III", "Evidence"],
        "headline": "Curve\nbends at\nday three.",
        "body": (
            "Cohorts that received a written welcome and a human reply within 24 hours "
            "retain at roughly 2x the rate of the templated cohort."
        ),
        "legend": ["Templated welcome", "Written welcome", "Written + human reply"],
        "labels": ["D0", "D7", "D14", "D30", "D45", "D60", "D90"],
    },
    "process": {
        "title": "How we'll work",
        "meta": ["Agency x Partner", "Phase IV"],
        "headline": "From insight\nto default,\nin five moves.",
        "subtitle": "A repeatable path each pilot follows before it graduates to the default experience for every customer.",
        "steps": [
            ["1", "Frame", "Translate the insight into a single behavioural hypothesis."],
            ["2", "Design", "Sketch the smallest end-to-end change."],
            ["3", "Pilot", "Ship to a 50/50 holdout in one segment."],
            ["4", "Read", "Review against pre-registered metrics."],
            ["5", "Default", "Promote to the default surface."],
        ],
        "timeline": ["Week 1 - Frame", "Week 2-3 - Design", "Week 3-6 - Pilot", "Week 7 - Read", "Week 8 - Default"],
    },
    "matrix": {
        "title": "Three pilots, side by side",
        "meta": ["Agency x Partner", "Phase IV"],
        "headline": "Where each\npilot earns\nits keep.",
        "subtitle": "Scored against the four levers that matter most this cycle.",
        "headers": ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
        "rows": [
            ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
            ["Build cost", "Low", "Medium", "Low"],
            ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
            ["Risk", "None", "Material", "Soft, reversible"],
        ],
    },
    "stats": {
        "title": "In numbers",
        "meta": ["Phase III", "Evidence"],
        "headline": "The case,\nby the numbers.",
        "subtitle": "Three figures we will report against every cycle.",
        "stats": [
            ["2.4x", "Retention\nmultiple", "Cohort with written welcome + human reply vs. templated control."],
            ["$4.1M", "Projected\nretained ARR", "Modelled on the current quarter's signup cohort."],
            ["72HR", "The window\nthat matters", "Behaviour after the first 72 hours predicts 18-month retention."],
        ],
    },
    "quote": {
        "title": "Client voice",
        "meta": ["Phase III", "Evidence"],
        "quote": (
            "Three days in, someone wrote me a real sentence. I'd been a customer of theirs "
            "for nine months before I noticed I'd never been a customer anywhere else again."
        ),
        "who": "Margaux Leveque",
        "role": "CFO - mid-market retailer - 14 months in",
    },
    "cta": {
        "title": "What's next",
        "meta": ["Agency x Partner", "Phase V"],
        "headline": "Pick the\nthree\nbets.",
        "body": (
            "Three pilots in eight weeks. We'll bring back evidence the quarter after, "
            "and the question will be which two to default."
        ),
        "steps": [
            ["1", "Pick the pilots", "Confirm two of three by Friday. Owners named in the same conversation."],
            ["2", "Pre-register the read", "Lock the metric, holdout, and kill criteria before any code ships."],
            ["3", "Stand a Friday review", "One slide each pilot, every Friday, until the bet defaults or dies."],
        ],
    },
}


STUDIO_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "title": "PROPOSAL",
        "image_label": "IMAGE PLACEHOLDER",
        "footer_left": "[Studio Name] x [Client Name]\n[Date]",
        "footer_center": "[Presentation Title]",
        "footer_right": "[Studio Name]",
    },
    "chapter": {
        "label": "01 / WHO WE ARE",
        "title": "WHO WE ARE",
        "surface": "light",
    },
    "statement": {
        "title": "GREAT WORK DOESN'T HAPPEN BY ACCIDENT",
        "surface": "dark",
    },
    "split": {
        "eyebrow": "Our Work",
        "label": "APPROACH",
        "title": "WE BUILD WHAT OTHERS PLAN",
        "body": (
            "Our studio pairs strategic thinking with craft-level execution. Every project begins "
            "with a question: what needs to be true for this to work?"
        ),
        "bullets": [
            "Strategy before aesthetics",
            "Constraints as creative fuel",
            "Delivery on schedule, not on someday",
        ],
        "caption": "[Caption - project name, year]",
    },
    "stats": {
        "eyebrow": "By the Numbers",
        "title": "THE STUDIO",
        "stats": [
            ["12", "Years of practice", "[Studio Name] founded [Year]"],
            ["200+", "Projects delivered", "Across [N] industries"],
            ["3", "Continents active", "[City A], [City B], [City C]"],
        ],
    },
    "list": {
        "eyebrow": "Services",
        "title": "WHAT WE OFFER",
        "body": "A focused set of services built for ambitious creative and commercial challenges.",
        "items": [
            "Brand strategy and identity systems",
            "Campaign and content direction",
            "Digital experience design and build",
            "Motion and video production",
            "Ongoing creative partnership and retainer",
        ],
    },
    "quote": {
        "quote": "THEY DON'T JUST MAKE THINGS LOOK GOOD. THEY MAKE THINGS WORK.",
        "name": "[CLIENT NAME]",
        "role": "CMO - [Company] - [Year]",
    },
    "compare": {
        "eyebrow": "Before / After",
        "left_label": "BEFORE",
        "left_title": "GENERIC IDENTITY, FORGETTABLE CAMPAIGNS",
        "left_body": "A brand built by committee, refined to inoffensiveness. Nothing wrong. Nothing memorable.",
        "left_items": [
            "No clear point of view",
            "Inconsistent execution across touchpoints",
            "Campaigns that launched and disappeared",
        ],
        "right_label": "AFTER",
        "right_title": "A DISTINCTIVE VOICE PEOPLE RECOGNIZE",
        "right_body": "A brand with a defined perspective. Work that accumulates and builds memory.",
        "right_items": [
            "Ownable visual and verbal territory",
            "System that scales without diluting",
            "Campaigns that created lasting recall",
        ],
    },
    "chapter-9": {
        "label": "02 / THE WORK",
        "title": "THE WORK",
        "surface": "dark",
    },
    "statement-10": {
        "title": "BOLD IDEAS DESERVE BOLD EXECUTION",
        "surface": "light",
    },
    "chart": {
        "eyebrow": "Project Output",
        "title": "PROJECTS BY YEAR",
        "caption": "Count - [Studio Name] Portfolio",
        "labels": ["[Y-4]", "[Y-3]", "[Y-2]", "[Y-1]", "[Year]"],
        "values": [14, 21, 28, 35, 47],
        "source": "Source: [Studio Name] internal tracking - [Year]",
    },
    "end": {
        "title": "ANY QUESTIONS OR THOUGHTS?",
        "contact_a": "Contact [Name A] via email on [name@studio.com]\nor via phone on [+00 000 000 000]",
        "contact_b": "Contact [Name B] via email on [name@studio.com]\nor via phone on [+00 000 000 000]",
    },
}


VELLUM_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "kicker": "Essay 01 - 2026",
        "title": "On Restraint",
        "subtitle": "Field notes on the discipline of less, written for designers who already know how to add.",
        "pin": ["01 / 09", "The Quiet Studio.", "Edition One."],
    },
    "statement": {
        "kicker": "[The Argument]",
        "title": "Most design problems are removed, not solved.",
        "pin": ["02 / 09", "Bold claim.", "Stand by it."],
    },
    "text": {
        "kicker": "[Field Note 03]",
        "number": "03",
        "heading": "Observation",
        "title": "What you remove is louder than what you keep.",
        "paragraphs": [
            "Subtraction creates the figure. Addition only fills the ground.",
            "Working drafts always carry more than they need; the work of editing is mostly the work of cutting.",
        ],
        "pin": ["03 / 09", "Show, don't tell."],
    },
    "stats": {
        "kicker": "[By the Numbers]",
        "number": "04",
        "title": "Three findings from a year of editing.",
        "stats": [
            ["73%", "of choices in early drafts are removed before publication"],
            ["1.4x", "time spent removing vs. adding material in mature work"],
            ["#1", "predictor of perceived quality is amount of white space (n=412)"],
        ],
        "pin": ["04 / 09", "Three facts.", "One argument."],
    },
    "list": {
        "kicker": "[Method]",
        "number": "05",
        "title": "[Why It Matters]",
        "lead": "Four rules that hold.",
        "items": [
            "One accent color per spread. Never two.",
            "Body text obeys the grid. Display is allowed to break it.",
            "White space is a choice, not a default.",
            "Reduce until removal hurts. Stop one step before that.",
        ],
        "pin": ["05 / 09", "Four rules.", "No exceptions."],
    },
    "quote": {
        "quote": "Design is a plan for arranging elements to accomplish a particular purpose.",
        "name": "Charles Eames",
        "role": "Designer - 1972",
        "pin": ["06 / 09", "Eames said it.", "Still true."],
    },
    "compare": {
        "left_label": "Before",
        "left_title": "The unfocused draft",
        "left_body": (
            "Three points compete for the title slot. Two accent colors. "
            "The body copy is two paragraphs and ends mid-thought."
        ),
        "left_items": [
            "Three claims, none load-bearing",
            "Twin accents pull the eye apart",
            "Body unedited; reader does the work",
        ],
        "right_label": "After",
        "right_title": "The edited piece",
        "right_body": "One claim takes the title. One accent does the work. The paragraph ends where the thought ends.",
        "right_items": [
            "One claim, fully argued",
            "One accent, used once",
            "Body cut to the bone",
        ],
        "pin": ["07 / 09", "Two states.", "Same essay."],
    },
    "chart": {
        "kicker": "[Pattern]",
        "number": "08",
        "title": "How drafts shrink during editing.",
        "caption": "Word count, indexed (start = 100)",
        "labels": ["Draft", "First read", "Second read", "Peer review", "Final"],
        "values": [100, 92, 78, 65, 58],
        "pin": ["08 / 09", "Internal study, 2026.", "n = 412."],
    },
    "end": {
        "kicker": "[End notes]",
        "title": "Edit until it stops looking edited.",
        "subtitle": "Thank you for reading. Comments, corrections, or quiet disagreement welcome at notes@quiet-studio.com.",
        "pin": ["09 / 09", "The Quiet Studio.", "Set in Cormorant + DM Sans."],
    },
}


SOFT_EDITORIAL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "eyebrow": "Field Notes",
        "kicker": "A research debrief, vol. iii",
        "title": "What we learned\nthis quarter.",
        "subtitle": (
            "A short, honest look at what customers told us between January and March - "
            "what works, what broke, and what to try next."
        ),
    },
    "foreword": {
        "eyebrow": "Foreword",
        "opener": "We spent eight weeks listening, and what we heard surprised us in the kindest way.",
        "paragraphs": [
            "The team ran twenty-eight long-form interviews, shadowed nine teams during their busiest week of the year, and sat with the support inbox for ten unbroken days.",
            "The brief asked about onboarding; the answers we got were about trust. So we followed the thread.",
            "This deck is the short version. Each insight is a door - open the ones that matter to your team this quarter.",
        ],
        "signoff": "- The research desk",
    },
    "method": {
        "eyebrow": "The Method",
        "steps": [
            ["i.", "Listen", "Twenty-eight long-form conversations with customers across four segments and three regions."],
            ["ii.", "Watch", "Nine on-site shadowing sessions during peak workflows. We took notes, not video."],
            ["iii.", "Read", "Ten days inside the support inbox, tagging every message by intent and emotional tone."],
            ["iv.", "Distill", "Three rounds of thematic clustering with the design and policy teams."],
        ],
    },
    "insights": {
        "eyebrow": "Insights",
        "cards": ["Trust is the onboarding", "Power users dread upgrades", "Support is product"],
        "descriptions": [
            "Customers don't churn on day one because the product is hard. They churn because the first emails feel like a stranger.",
            "The people we asked to love new features the most quietly resent them. They want fewer surprises.",
            "Half of feature requests are existing features customers could not find. Discovery is the roadmap problem.",
        ],
    },
    "closer": {
        "eyebrow": "A closer look - 1 of 3",
        "marker": "on insight #1",
        "title": "Trust is the onboarding.",
        "body": "The product can be perfect on day one, but if the welcome email reads like a contract, half of new accounts will never log in twice.",
    },
    "numbers": {
        "eyebrow": "By the numbers",
        "hero": ["68%", "of new accounts open the third email, up from 41% last quarter."],
        "stats": [
            ["28", "long-form customer interviews across four segments."],
            ["9", "teams shadowed for their busiest week of the year."],
        ],
    },
    "quote": {
        "eyebrow": "In their words",
        "quote": "I did not need a better product. I needed it to behave like it remembered me.",
        "name": "Renee, three-year customer",
        "role": "Studio of seven, Lisbon",
    },
    "next": {
        "eyebrow": "What's Next",
        "title": "What we'll do next",
        "subtitle": "Three small moves, before the next debrief.",
        "items": [
            ["i.", "Rewrite the first three emails", "From templated to written. Owner: lifecycle. By: May 17."],
            ["ii.", "Quiet upgrades by default", "Opt-in for power users; soft rollout for everyone else. By: June 1."],
            ["iii.", "Make the inbox a search bar", "Surface in-product help when requests match an existing feature."],
        ],
    },
    "consult": {
        "eyebrow": "Findings - Detail",
        "action": "The trust gap is built in the first 72 hours.",
        "columns": [
            ["What we found", "Three behavioral signals in the first 72 hours predict 18-month retention better than any feature-usage metric we tracked."],
            ["Why it matters", "$4.1M in projected retained ARR, on the current cohort alone."],
            ["What to do", "Rewrite the first three lifecycle emails and measure reply rate, second-open rate, and D90 retention."],
        ],
        "source": "Source: 14,200 cohorted accounts, Jan-Mar 2026.",
    },
    "chart": {
        "eyebrow": "Retention Curve",
        "title": "Retention, by cohort",
        "subtitle": "The curve bends around day three.",
        "series": ["Templated welcome", "Written welcome", "Written + human reply"],
    },
    "process": {
        "eyebrow": "Process",
        "title": "How we'll work",
        "subtitle": "From insight to shipped change.",
        "steps": [
            ["i.", "Frame", "Translate the insight into a single behavioural hypothesis."],
            ["ii.", "Design", "Sketch the smallest end-to-end change."],
            ["iii.", "Pilot", "Ship to a 50/50 holdout in a single segment."],
            ["iv.", "Read", "Review the cohort against pre-registered metrics."],
            ["v.", "Default", "Graduate the change to the default surface."],
        ],
        "timeline": ["Week 1", "Weeks 2-3", "Weeks 3-6", "Week 7", "Week 8"],
    },
    "matrix": {
        "eyebrow": "Comparison",
        "title": "The three pilots, side by side",
        "subtitle": "Where each pilot earns its keep.",
        "headers": ["Lever", "Rewrite welcome", "Quiet upgrades", "Inbox-as-search"],
        "rows": [
            ["Time-to-impact", "<= 4 weeks", "6-8 weeks", "<= 4 weeks"],
            ["Build cost", "Low", "Medium", "Low"],
            ["Retention lift", "+19 pts D90", "+7 pts D90", "+5 pts D90"],
            ["Risk", "None", "Material", "Soft, reversible"],
        ],
    },
}


SIGNAL_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "cover": {
        "label": "Q4 · Executive Committee · Intelligence Brief",
        "title": "Signal\nIntelligence Brief",
        "subtitle": "A focused reading of the operating signals that matter most before the next decision cycle.",
        "meta_left": "Strategy Office · Confidential",
        "meta_right": "Version 1.4 · Review Draft · 2026",
    },
    "chapter": {
        "chapter": "01 · Operating Signal",
        "title": "What changed, what held, and what now deserves attention",
        "subtitle": "This section separates observed evidence from interpretation so the next discussion starts at the right level.",
    },
    "statement": {
        "label": "Slide Label",
        "kicker": "CENTRAL CLAIM",
        "title": "One signal keeps explaining the rest.",
        "footer": "03 / 18",
    },
    "split": {
        "label": "Category · Topic",
        "kicker": "FIELD NOTE",
        "title": "Context, evidence, and a proof panel",
        "body": "Use this paragraph for the core explanation. Keep it concise, specific, and connected to the decision it supports.",
        "bullets": [
            "Evidence is screened before interpretation",
            "Every claim keeps a source trail",
            "Recommendations stay tied to owners",
        ],
        "image_caption": "Evidence panel",
    },
    "stats": {
        "title": "Four signals define the current operating environment",
        "stats": [
            ["72%", "Primary signal strength", "Q/Q movement"],
            ["18", "Open questions", "Tracked weekly"],
            ["4.6x", "Evidence density", "Indexed sources"],
            ["03", "Decision gates", "Owner assigned"],
        ],
    },
    "quote": {
        "quote": "The signal is not the loudest data point. It is the one that keeps explaining the rest.",
        "attribution": "Research note · internal advisory",
    },
    "list": {
        "title": "Operating implications",
        "intro": "Use the list slide when the argument needs ordered evidence rather than another headline.",
        "items": [
            "Clarify which signal has decision value",
            "Separate observed fact from interpretation",
            "Attach each recommendation to an accountable owner",
            "Keep the next review cycle visible",
        ],
    },
    "compare": {
        "title": "Before / after operating model",
        "left_title": "Before",
        "right_title": "After",
        "left": [
            "Fragmented reviews",
            "Unclear owners",
            "Late risk escalation",
            "Narrative drift",
        ],
        "right": [
            "Single decision log",
            "Named accountability",
            "Early warning indicators",
            "Evidence-backed language",
        ],
    },
    "editorial": {
        "kicker": "EDITORIAL BRIEF",
        "title": "Faster, without sounding less careful",
        "left": (
            "The strongest teams preserve judgment while reducing ceremony. They make the decision trail visible "
            "and keep the evidence close to the claim."
        ),
        "right": (
            "This format is built for those moments: enough structure to feel rigorous, enough air to let one idea land."
        ),
        "stats": [
            ["2.4x", "review cadence"],
            ["31%", "fewer open loops"],
            ["06", "owner lanes"],
            ["Q3", "next checkpoint"],
        ],
    },
    "dense": {
        "title": "Dense analysis can keep editorial rhythm",
        "columns": [
            {
                "label": "OBSERVATION",
                "paragraphs": [
                    "The deck should feel like a written brief, not a dashboard compressed into slides.",
                    "A narrow column and strong line height keep the page readable even when evidence is dense.",
                ],
            },
            {
                "label": "IMPLICATION",
                "paragraphs": [
                    "Use the second column for interpretation, tradeoffs, or the decision logic.",
                    "Gold appears only where emphasis carries structural meaning.",
                ],
            },
        ],
    },
    "statement-2": {
        "label": "Slide Label",
        "kicker": "SECOND PRINCIPLE",
        "title": "A second principle for synthesis",
        "body": "This repeated source class proves the renderer handles the page role, not just the first instance.",
    },
    "end": {
        "title": "End note",
        "subtitle": "The next step is not more information. It is a clearer decision.",
        "contact": "Private intelligence note · prepared for review",
    },
    "chart": {
        "label": "SIGNAL TRACKER",
        "title": "Evidence concentration by workstream",
        "values": [38, 52, 67, 86],
        "labels": ["Discovery", "Model", "Review", "Action"],
        "source": "Source: synthesized review log",
    },
    "diagram": {
        "title": "Decision flow",
        "steps": [
            ["01", "Observe", "Collect inputs without forcing conclusion."],
            ["02", "Interpret", "Name the signal and its confidence level."],
            ["03", "Act", "Assign owner, timing, and review trigger."],
        ],
    },
    "pie": {
        "title": "Portfolio of attention",
        "items": [
            ["Strategic", "42%"],
            ["Operational", "28%"],
            ["Risk", "18%"],
            ["Narrative", "12%"],
        ],
        "total": "TOTAL · 100%",
    },
    "pyramid": {
        "title": "Evidence hierarchy",
        "levels": [
            ["Decision", "One sentence that can survive scrutiny"],
            ["Recommendation", "The advised movement"],
            ["Interpretation", "What the evidence means"],
            ["Observation", "What has been seen"],
            ["Source", "Where the claim came from"],
        ],
    },
    "vtimeline": {
        "title": "Review cadence",
        "events": [
            ["WEEK 01", "Frame", "Define the question and owner."],
            ["WEEK 02", "Observe", "Collect inputs and classify confidence."],
            ["WEEK 03", "Decide", "Commit the recommended path."],
            ["WEEK 04", "Review", "Re-open only if the signal changes."],
        ],
    },
    "cycle": {
        "title": "Signal loop",
        "steps": [
            ["01", "Gather", "Bring evidence into one place."],
            ["02", "Read", "Separate noise from pattern."],
            ["03", "Decide", "Make the operating choice visible."],
            ["04", "Learn", "Feed the next review cycle."],
        ],
    },
}


SCATTERBRAIN_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "title": {
        "title": "Scatterbrain",
        "subtitle": "Collect your thoughts, pin your ideas, and watch the big picture emerge from the chaos of creativity.",
        "note": "A Post-it Inspired Template",
        "accents": ["Remember this!", "Notes & Ideas", "!"],
    },
    "statement": {
        "quote": "The best ideas start as scattered thoughts on sticky corners.",
        "body": (
            "Every great project begins with a single note, a fleeting thought, a moment of inspiration "
            "captured before it drifts away."
        ),
        "author": "- The Creative Process",
        "side_note": "Jot it down before you forget!",
    },
    "two-column": {
        "columns": [
            {
                "label": "01 / Discovery",
                "title": "Finding the Problem",
                "body": "Every solution starts with understanding. We dive deep to uncover what truly matters.",
                "bullets": [
                    "User research sessions",
                    "Market analysis",
                    "Stakeholder interviews",
                    "Competitive landscape",
                ],
            },
            {
                "label": "02 / Solution",
                "title": "Crafting the Answer",
                "body": "With clarity comes creativity. Findings become strategies and tangible designs.",
                "bullets": [
                    "Ideation workshops",
                    "Prototype development",
                    "Iterative testing",
                    "Final delivery",
                ],
            },
        ]
    },
    "chart": {
        "title": "Quarterly Growth",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "values": [24, 38, 52, 71],
        "legend_title": "Key Metrics",
        "legend": ["Revenue Streams", "User Acquisition", "Market Expansion", "Product Lines"],
        "note": "Steady upward trend across all channels this fiscal year.",
    },
    "features": {
        "items": [
            {"icon": "A", "title": "Strategy", "body": "Map out your vision with clarity and purpose."},
            {"icon": "B", "title": "Design", "body": "Craft experiences that resonate from wireframes to polish."},
            {"icon": "C", "title": "Launch", "body": "Ship with confidence, test quickly, and iterate toward adoption."},
        ]
    },
    "timeline": {
        "items": [
            {
                "title": "Phase One",
                "phase": "Foundation",
                "body": "Establish core principles and build the architecture everything else stands upon.",
            },
            {
                "title": "Phase Two",
                "phase": "Creation",
                "body": "Design prototypes, iterate through feedback, and refine every detail.",
            },
            {
                "title": "Phase Three",
                "phase": "Delivery",
                "body": "Launch, measure impact, gather insights, and prepare the next cycle.",
            },
        ]
    },
    "image-text": {
        "label": "Spotlight",
        "title": "Capturing the Moment",
        "body": (
            "Visual storytelling transforms abstract concepts into tangible understanding. "
            "A single image can communicate what paragraphs struggle to explain."
        ),
        "body2": "Imagery bridges gaps, evokes emotion, and creates lasting impressions.",
        "mini_note": "Visuals first, text second.",
    },
    "diagram": {
        "title": "Distribution Overview",
        "center": "Total",
        "labels": ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
        "stats": [
            ["Total Reach", "128K"],
            ["Engagement", "84%"],
            ["Retention", "62%"],
            ["Satisfaction", "4.8"],
        ],
        "note": "Numbers tell the story we need to hear.",
    },
    "comparison": {
        "left_title": "Before",
        "right_title": "After",
        "left": [
            "Scattered documentation",
            "Unclear ownership",
            "Inconsistent processes",
            "Reactive problem solving",
            "Silos between teams",
        ],
        "right": [
            "Centralized knowledge base",
            "Defined responsibilities",
            "Streamlined workflows",
            "Proactive planning",
            "Cross-functional alignment",
        ],
    },
    "closing": {
        "title": "Thanks for Sticking Around",
        "subtitle": "Every great idea starts with a little note.",
        "accents": ["Keep the ideas flowing!", "Pin this somewhere safe.", "OK", ":)"],
        "contact": "Questions, thoughts, or just want to say hello?",
    },
}


RETRO_ZINE_SOURCE_CONTENT: dict[str, dict[str, Any]] = {
    "hero": {
        "eyebrow": "Q3 Strategic Overview",
        "title": "NEXUS\nVENTURES",
        "subtitle": "Growth - Innovation - Partnership",
        "date": "2026",
    },
    "split": {
        "label": "Our Mission",
        "title": "Building\nTomorrow",
        "body": (
            "We partner with ambitious teams to turn complex challenges into scalable solutions. "
            "Through disciplined strategy and creative execution, we help organizations outpace "
            "change and deliver lasting value to their customers."
        ),
        "stat": "340%",
        "stat_label": "year-over-year growth",
    },
    "statement": {
        "quote": "The companies that thrive\nare not the ones that predict\nthe future. They are the ones\nthat build it.",
        "author": "- Our founding principle since day one",
    },
    "grid": {
        "title": "At a Glance",
        "items": [
            {"label": "Founded", "value": "2019 - San Francisco, CA"},
            {"label": "Team", "value": "120 people across 4 continents"},
            {"label": "Clients", "value": "48 active partnerships"},
            {"label": "Revenue", "value": "$12.4M ARR - profitable"},
        ],
    },
    "visual": {
        "title": "Q3\nTarget",
        "subtitle": "$18M ARR by December",
        "caption": "Fiscal year ending March 2027",
    },
    "editorial": {
        "title": "Product\nRoadmap",
        "issue": "FY 2026 / 2027",
        "left": (
            "Phase one is about foundation - refining our core platform, improving onboarding "
            "velocity, and expanding our API surface to serve enterprise clients with stricter "
            "compliance needs. We shipped 14 major releases this quarter alone."
        ),
        "right": (
            "Next quarter we shift from build mode to distribution. The product is proven. "
            "Now we need partners, channels, and the operational muscle to support 10x user "
            "growth without breaking the experience."
        ),
        "kicker": "PHASE TWO: SCALE",
    },
    "numbers": {
        "title": "Our Core Values",
        "items": [
            {"number": "01", "title": "Clarity", "body": "Complex problems deserve simple explanations."},
            {"number": "02", "title": "Velocity", "body": "Ship fast, learn faster, iterate always."},
            {"number": "03", "title": "Trust", "body": "Every partnership is built on radical transparency."},
        ],
    },
    "collage": {
        "title": "Capabilities",
        "pieces": [
            {"title": "Strategy", "body": "Market analysis and roadmaps that bridge ambition with execution."},
            {"title": "Design", "body": "Brand systems and user experiences that make complexity effortless."},
            {"title": "Engineering", "body": "Scalable architecture, robust APIs, and infrastructure that grows."},
            {"title": "Growth", "body": "Go-to-market planning and revenue operations that accelerate traction."},
        ],
    },
    "rsvp": {
        "title": "Let's Talk",
        "subtitle": "Ready to explore what we can build together?",
        "fields": ["Name", "Company", "Email", "Project"],
        "stamp": "CONTACT US",
    },
    "closing": {
        "label": "Thank You",
        "title": "Let's Build\nTogether",
        "contact": "hello@nexusventures.co - San Francisco - Worldwide",
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
    if family_id == "block-frame" and variant_id in BLOCK_FRAME_SOURCE_CONTENT:
        return dict(BLOCK_FRAME_SOURCE_CONTENT[variant_id])
    if family_id == "capsule" and variant_id in CAPSULE_SOURCE_CONTENT:
        return dict(CAPSULE_SOURCE_CONTENT[variant_id])
    if family_id == "broadside" and variant_id in BROADSIDE_SOURCE_CONTENT:
        return dict(BROADSIDE_SOURCE_CONTENT[variant_id])
    if family_id == "cartesian" and variant_id in CARTESIAN_SOURCE_CONTENT:
        return dict(CARTESIAN_SOURCE_CONTENT[variant_id])
    if family_id == "cobalt-grid" and variant_id in COBALT_GRID_SOURCE_CONTENT:
        return dict(COBALT_GRID_SOURCE_CONTENT[variant_id])
    if family_id == "coral" and variant_id in CORAL_SOURCE_CONTENT:
        return dict(CORAL_SOURCE_CONTENT[variant_id])
    if family_id == "daisy-days" and variant_id in DAISY_DAYS_SOURCE_CONTENT:
        return dict(DAISY_DAYS_SOURCE_CONTENT[variant_id])
    if family_id == "editorial-forest" and variant_id in EDITORIAL_FOREST_SOURCE_CONTENT:
        return dict(EDITORIAL_FOREST_SOURCE_CONTENT[variant_id])
    if family_id == "editorial-tri-tone" and variant_id in EDITORIAL_TRI_TONE_SOURCE_CONTENT:
        return dict(EDITORIAL_TRI_TONE_SOURCE_CONTENT[variant_id])
    if family_id == "emerald-editorial" and variant_id in EMERALD_EDITORIAL_SOURCE_CONTENT:
        return dict(EMERALD_EDITORIAL_SOURCE_CONTENT[variant_id])
    if family_id == "grove" and variant_id in GROVE_SOURCE_CONTENT:
        return dict(GROVE_SOURCE_CONTENT[variant_id])
    if family_id == "long-table" and variant_id in LONG_TABLE_SOURCE_CONTENT:
        return dict(LONG_TABLE_SOURCE_CONTENT[variant_id])
    if family_id == "mat" and variant_id in MAT_SOURCE_CONTENT:
        return dict(MAT_SOURCE_CONTENT[variant_id])
    if family_id == "peoples-platform" and variant_id in PEOPLES_PLATFORM_SOURCE_CONTENT:
        return dict(PEOPLES_PLATFORM_SOURCE_CONTENT[variant_id])
    if family_id == "pink-script" and variant_id in PINK_SCRIPT_SOURCE_CONTENT:
        return dict(PINK_SCRIPT_SOURCE_CONTENT[variant_id])
    if family_id == "playful" and variant_id in PLAYFUL_SOURCE_CONTENT:
        return dict(PLAYFUL_SOURCE_CONTENT[variant_id])
    if family_id == "8-bit-orbit" and variant_id in EIGHT_BIT_ORBIT_SOURCE_CONTENT:
        return dict(EIGHT_BIT_ORBIT_SOURCE_CONTENT[variant_id])
    if family_id == "raw-grid" and variant_id in RAW_GRID_SOURCE_CONTENT:
        return dict(RAW_GRID_SOURCE_CONTENT[variant_id])
    if family_id == "pin-and-paper" and variant_id in PIN_AND_PAPER_SOURCE_CONTENT:
        return dict(PIN_AND_PAPER_SOURCE_CONTENT[variant_id])
    if family_id == "sakura-chroma" and variant_id in SAKURA_CHROMA_SOURCE_CONTENT:
        return dict(SAKURA_CHROMA_SOURCE_CONTENT[variant_id])
    if family_id == "retro-windows" and variant_id in RETRO_WINDOWS_SOURCE_CONTENT:
        return dict(RETRO_WINDOWS_SOURCE_CONTENT[variant_id])
    if family_id == "retro-zine" and variant_id in RETRO_ZINE_SOURCE_CONTENT:
        return dict(RETRO_ZINE_SOURCE_CONTENT[variant_id])
    if family_id == "stencil-tablet" and variant_id in STENCIL_TABLET_SOURCE_CONTENT:
        return dict(STENCIL_TABLET_SOURCE_CONTENT[variant_id])
    if family_id == "studio" and variant_id in STUDIO_SOURCE_CONTENT:
        return dict(STUDIO_SOURCE_CONTENT[variant_id])
    if family_id == "vellum" and variant_id in VELLUM_SOURCE_CONTENT:
        return dict(VELLUM_SOURCE_CONTENT[variant_id])
    if family_id == "soft-editorial" and variant_id in SOFT_EDITORIAL_SOURCE_CONTENT:
        return dict(SOFT_EDITORIAL_SOURCE_CONTENT[variant_id])
    if family_id == "signal" and variant_id in SIGNAL_SOURCE_CONTENT:
        return dict(SIGNAL_SOURCE_CONTENT[variant_id])
    if family_id == "scatterbrain" and variant_id in SCATTERBRAIN_SOURCE_CONTENT:
        return dict(SCATTERBRAIN_SOURCE_CONTENT[variant_id])
    if family_id == "biennale-yellow" and variant_id in BIENNALE_YELLOW_SOURCE_CONTENT:
        return dict(BIENNALE_YELLOW_SOURCE_CONTENT[variant_id])
    if family_id == "blue-professional" and variant_id in BLUE_PROFESSIONAL_SOURCE_CONTENT:
        return dict(BLUE_PROFESSIONAL_SOURCE_CONTENT[variant_id])
    if family_id == "bold-poster" and variant_id in BOLD_POSTER_SOURCE_CONTENT:
        return dict(BOLD_POSTER_SOURCE_CONTENT[variant_id])
    if family_id == "creative-mode" and variant_id in CREATIVE_MODE_SOURCE_CONTENT:
        return dict(CREATIVE_MODE_SOURCE_CONTENT[variant_id])
    if family_id == "monochrome" and variant_id in MONOCHROME_SOURCE_CONTENT:
        return dict(MONOCHROME_SOURCE_CONTENT[variant_id])
    if family_id == "neo-grid-bold" and variant_id in NEO_GRID_BOLD_SOURCE_CONTENT:
        return dict(NEO_GRID_BOLD_SOURCE_CONTENT[variant_id])
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
    if family_id == "pink-script":
        typography = _as_dict(_as_dict(spec.get("theme")).get("typography")).copy()
        typography["font_roles"] = PINK_SCRIPT_FONT_ROLES
        typography["font_role_candidates"] = PINK_SCRIPT_FONT_ROLE_CANDIDATES
        typography["font_role_weights"] = PINK_SCRIPT_FONT_ROLE_WEIGHTS
        theme = _as_dict(spec.get("theme")).copy()
        theme["typography"] = typography
        spec["theme"] = theme
    if family_id == "playful":
        typography = _as_dict(_as_dict(spec.get("theme")).get("typography")).copy()
        typography["font_roles"] = PLAYFUL_FONT_ROLES
        typography["font_role_candidates"] = PLAYFUL_FONT_ROLE_CANDIDATES
        typography["font_role_weights"] = PLAYFUL_FONT_ROLE_WEIGHTS
        theme = _as_dict(spec.get("theme")).copy()
        theme["typography"] = typography
        spec["theme"] = theme
    if family_id == "raw-grid":
        typography = _as_dict(_as_dict(spec.get("theme")).get("typography")).copy()
        typography["font_roles"] = RAW_GRID_FONT_ROLES
        typography["font_role_candidates"] = RAW_GRID_FONT_ROLE_CANDIDATES
        typography["font_role_weights"] = RAW_GRID_FONT_ROLE_WEIGHTS
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
    env = os.environ.copy()
    env["SVGLIDE_SATORI_EMBED_FONT_FOR_PNG"] = "1"
    completed = subprocess.run(
        ["node", RENDERER_PATH.as_posix(), spec_path.as_posix(), svg_path.as_posix(), png_path.as_posix()],
        cwd=REPO_ROOT,
        env=env,
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
