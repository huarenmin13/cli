#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import beautiful_template_page_family_smoke as smoke


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def write_smoke_plan(project: Path, roles: list[tuple[str, str]]) -> None:
    slides = []
    for index, (role, variant_id) in enumerate(roles, start=1):
        slides.append(
            {
                "page": index,
                "page_role": role,
                "title": f"{role} page",
                "canvas_spec": {
                    "family_id": "blue-professional",
                    "template_id": "executive-dashboard",
                    "theme_id": "blue-professional",
                    "page_role": role,
                    "page_variant_id": variant_id,
                },
            }
        )
    write_json(
        project / "02-plan/slide_plan.json",
        {
            "selected_family_id": "blue-professional",
            "selected_template_id": "executive-dashboard",
            "selected_theme_id": "blue-professional",
            "slides": slides,
        },
    )
    write_json(project / "receipts/generate_svg.json", {"status": "passed", "generated_files": []})
    write_json(project / "06-check/template-fidelity.json", {"status": "passed"})


def write_bold_poster_fixture_plan(project: Path, roles: list[tuple[str, str]]) -> None:
    slides = []
    for index, (role, variant_id) in enumerate(roles, start=1):
        slides.append(
            {
                "page": index,
                "page_type": "content",
                "title": f"{role} page",
                "canvas_spec": {
                    "page_role": role,
                    "page_variant_id": variant_id,
                },
            }
        )
    write_json(project / "02-plan/slide_plan.json", {"slides": slides})
    write_json(
        project / "02-plan/page-family-smoke-fixture.json",
        {
            "schema_version": "svglide-page-family-smoke-fixture/v1",
            "family_id": "bold-poster",
            "template_id": "poster-stat-punch",
            "theme_id": "bold-poster-explicit-tomato",
        },
    )
    write_json(project / "receipts/generate_svg.json", {"status": "passed", "generated_files": []})


class BeautifulTemplatePageFamilySmokeTest(unittest.TestCase):
    def test_blue_professional_smoke_receipt_covers_required_roles(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            roles = [
                ("cover", "cover"),
                ("agenda", "agenda"),
                ("content", "dashboard"),
                ("data", "metrics"),
                ("data", "bars"),
                ("comparison", "split"),
                ("quote", "quote"),
                ("process", "timeline"),
                ("detail", "detail"),
                ("closing", "closing"),
            ]
            write_smoke_plan(project, roles)

            receipt = smoke.check_project_page_family_smoke(project)

        self.assertEqual(receipt["status"], "passed", receipt["artifact_issues"])
        self.assertEqual(receipt["scope"], "page_family")
        self.assertEqual(receipt["selected_family_id"], "blue-professional")
        self.assertEqual(receipt["selected_template_id"], "executive-dashboard")
        self.assertEqual(receipt["selected_theme_id"], "blue-professional")
        self.assertEqual(receipt["rendered_pages"], 10)
        self.assertEqual(receipt["missing_required_roles"], [])
        self.assertEqual(receipt["missing_implemented_page_variants"], [])
        self.assertEqual(receipt["unimplemented_page_variants"], [])
        self.assertIn("bars", receipt["implemented_page_variants"])
        self.assertIn("bars", receipt["covered_implemented_page_variants"])
        self.assertFalse(receipt["degraded"])
        self.assertEqual(set(receipt["page_variant_coverage"]), set(smoke.PRODUCTION_MINIMUM_ROLES))
        self.assertIn("slide_plan", receipt["input_hashes"])
        self.assertEqual(receipt["generated_by"], "beautiful_template_page_family_smoke.py")
        self.assertIsInstance(receipt["command"], list)
        self.assertIsInstance(receipt["provenance"], dict)

    def test_blue_professional_smoke_requires_every_implemented_variant(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            roles = [
                ("cover", "cover"),
                ("agenda", "agenda"),
                ("content", "dashboard"),
                ("data", "metrics"),
                ("comparison", "split"),
                ("quote", "quote"),
                ("process", "timeline"),
                ("detail", "detail"),
                ("closing", "closing"),
            ]
            write_smoke_plan(project, roles)

            receipt = smoke.check_project_page_family_smoke(project)

        self.assertEqual(receipt["status"], "failed")
        self.assertTrue(receipt["degraded"])
        self.assertIn("bars", receipt["missing_implemented_page_variants"])
        self.assertIn(
            "implemented_variant_missing",
            {item["code"] for item in receipt["artifact_issues"]},
        )

    def test_missing_required_role_degrades_and_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_smoke_plan(project, [("cover", "cover"), ("content", "content"), ("closing", "closing")])

            receipt = smoke.check_project_page_family_smoke(project)

        self.assertEqual(receipt["status"], "failed")
        self.assertTrue(receipt["degraded"])
        self.assertIn("agenda", receipt["missing_required_roles"])
        self.assertGreater(receipt["summary"]["error_count"], 0)

    def test_explicit_canvas_role_wins_over_weak_content_page_type(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            roles = [
                ("cover", "hero"),
                ("quote", "red"),
                ("agenda", "summary"),
                ("content", "financial"),
                ("data", "stat"),
                ("process", "services"),
                ("process", "roadmap"),
                ("comparison", "pillars"),
                ("detail", "global"),
                ("closing", "close"),
            ]
            write_bold_poster_fixture_plan(project, roles)

            receipt = smoke.check_project_page_family_smoke(project)
            production_selection = smoke.selected_beautiful_production_family(project)

        self.assertEqual(receipt["status"], "passed", receipt["artifact_issues"])
        self.assertEqual(receipt["selection_source"], "explicit_fixture")
        self.assertEqual(receipt["selected_family_id"], "bold-poster")
        self.assertEqual(receipt["selected_template_id"], "poster-stat-punch")
        self.assertFalse(receipt["production_selectable"])
        self.assertEqual(receipt["promotion_status"], "needs_review")
        self.assertIsNone(production_selection)
        page_roles = {page["page_variant_id"]: page["page_role"] for page in receipt["pages"]}
        self.assertEqual(page_roles["red"], "quote")
        self.assertEqual(page_roles["stat"], "data")
        self.assertEqual(page_roles["pillars"], "comparison")
        self.assertEqual(page_roles["global"], "detail")
        self.assertEqual(receipt["missing_required_roles"], [])

    def test_fixture_selection_cannot_fake_missing_role_coverage(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            roles = [
                ("cover", "hero"),
                ("quote", "red"),
                ("agenda", "summary"),
                ("content", "financial"),
                ("data", "stat"),
                ("process", "services"),
                ("process", "roadmap"),
                ("comparison", "pillars"),
                ("closing", "close"),
            ]
            write_bold_poster_fixture_plan(project, roles)

            receipt = smoke.check_project_page_family_smoke(project)

        self.assertEqual(receipt["status"], "failed")
        self.assertEqual(receipt["selection_source"], "explicit_fixture")
        self.assertIn("detail", receipt["missing_required_roles"])
        self.assertIn("global", receipt["missing_implemented_page_variants"])
        self.assertIn("required_role_missing", {item["code"] for item in receipt["artifact_issues"]})


if __name__ == "__main__":
    unittest.main()
