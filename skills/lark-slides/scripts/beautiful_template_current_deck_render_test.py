#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path
from xml.etree import ElementTree

sys.path.insert(0, str(Path(__file__).resolve().parent))

import beautiful_template_current_deck_render as current_deck


SVG_NS = "{http://www.w3.org/2000/svg}"


def svg_text_layout_issues(svg_path: Path) -> list[dict[str, object]]:
    root = ElementTree.fromstring(svg_path.read_text(encoding="utf-8"))
    boxes: list[dict[str, object]] = []
    for index, element in enumerate(root.iter(f"{SVG_NS}text")):
        text = "".join(element.itertext())
        if not text.strip():
            continue
        font_size = float(element.attrib.get("font-size") or 16)
        if font_size < 12:
            continue
        x = float(element.attrib.get("x") or 0)
        y = float(element.attrib.get("y") or 0)
        width = float(element.attrib.get("width") or 0)
        height = float(element.attrib.get("height") or font_size)
        boxes.append(
            {
                "id": index,
                "text": text,
                "font_size": font_size,
                "left": x,
                "top": y - height,
                "right": x + width,
                "bottom": y,
                "area": max(width, 0.0) * max(height, 0.0),
            }
        )

    issues: list[dict[str, object]] = []
    for box in boxes:
        if box["left"] < -1 or box["top"] < -1 or box["right"] > 961 or box["bottom"] > 541:
            issues.append({"code": "text_out_of_canvas", "path": svg_path.name, "box": box})

    for left_index, left in enumerate(boxes):
        for right in boxes[left_index + 1 :]:
            x_overlap = min(float(left["right"]), float(right["right"])) - max(float(left["left"]), float(right["left"]))
            y_overlap = min(float(left["bottom"]), float(right["bottom"])) - max(float(left["top"]), float(right["top"]))
            if x_overlap <= 0.5 or y_overlap <= 0.5:
                continue
            overlap_area = x_overlap * y_overlap
            smaller_area = min(float(left["area"]), float(right["area"]))
            if smaller_area > 0 and overlap_area / smaller_area >= 0.30:
                issues.append(
                    {
                        "code": "text_overlap",
                        "path": svg_path.name,
                        "left": left,
                        "right": right,
                    }
                )
    return issues


def svg_readability_font_issues(svg_path: Path) -> list[dict[str, object]]:
    root = ElementTree.fromstring(svg_path.read_text(encoding="utf-8"))
    issues: list[dict[str, object]] = []
    for index, element in enumerate(root.iter(f"{SVG_NS}text")):
        text = "".join(element.itertext()).strip()
        if not text:
            continue
        font_size = float(element.attrib.get("font-size") or 16)
        if font_size < 9:
            issues.append(
                {
                    "code": "font_size_below_readability_floor",
                    "path": svg_path.name,
                    "id": index,
                    "text": text,
                    "font_size": font_size,
                }
            )
    return issues


class BeautifulTemplateCurrentDeckRenderTest(unittest.TestCase):
    def test_build_family_deck_writes_review_only_specs_without_promotion_claim(self) -> None:
        row = next(item for item in current_deck.matrix_rows() if item["family_id"] == "pin-and-paper")
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "current-svglide-decks"
            family = current_deck.build_family_deck(row, output_dir, render=False, pretty=True, workers=1)

            manifest = json.loads((output_dir / "pin-and-paper" / "manifest.json").read_text(encoding="utf-8"))
            first_spec_path = output_dir / "pin-and-paper" / "page-001-cover.canvas-spec.json"
            first_spec = json.loads(first_spec_path.read_text(encoding="utf-8"))

        self.assertEqual("beautiful_current_svglide_deck_render", family["artifact_kind"])
        self.assertTrue(family["review_only"])
        self.assertIn("not a production promotion receipt", family["claim_boundary"])
        self.assertEqual(11, family["page_count"])
        self.assertEqual("not_rendered", family["pages"][0]["render_status"])
        self.assertFalse(family["degraded"])
        self.assertEqual("pin-and-paper", manifest["family_id"])
        self.assertEqual("annotated-field-board", first_spec["template_id"])
        self.assertEqual("pin-and-paper", first_spec["family_id"])
        self.assertEqual("cover", first_spec["page_variant_id"])
        self.assertFalse(first_spec["review_only_current_deck_render"]["degraded"])
        self.assertIn("review-only", first_spec["page_family_source"]["claim_boundary"])

    def test_build_all_decks_can_filter_to_one_family(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            receipt = current_deck.build_all_decks(
                Path(tmpdir) / "current-svglide-decks",
                render=False,
                pretty=False,
                workers=1,
                family_ids={"8-bit-orbit"},
        )

        self.assertEqual(1, receipt["family_count"])
        self.assertEqual("failed", receipt["status"])
        self.assertEqual("8-bit-orbit", receipt["families"][0]["family_id"])
        self.assertEqual(10, receipt["page_count"])

    def test_review_png_render_uses_embedded_font_preview_without_changing_svg_path(self) -> None:
        completed = subprocess.CompletedProcess(args=["node"], returncode=0, stdout="", stderr="")
        with mock.patch.object(current_deck.subprocess, "run", return_value=completed) as run:
            current_deck.render_page_preview(Path("input.json"), Path("output.svg"), Path("output.png"))

        kwargs = run.call_args.kwargs
        self.assertEqual(current_deck.REPO_ROOT, kwargs["cwd"])
        self.assertEqual("1", kwargs["env"]["SVGLIDE_SATORI_EMBED_FONT_FOR_PNG"])
        self.assertEqual(
            ["node", current_deck.RENDERER_PATH.as_posix(), "input.json", "output.svg", "output.png"],
            run.call_args.args[0],
        )

    def test_review_only_deck_render_uses_variant_aware_layouts(self) -> None:
        row = next(item for item in current_deck.matrix_rows() if item["family_id"] == "grove")
        variants = current_deck.variant_records(row)
        cover = next(item for item in variants if item["page_variant_id"] == "cover")
        split = next(item for item in variants if item["page_variant_id"] == "split")
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            cover_spec = root / "cover.canvas-spec.json"
            split_spec = root / "split.canvas-spec.json"
            cover_svg = root / "cover.svg"
            split_svg = root / "split.svg"
            current_deck.write_json(cover_spec, current_deck.canvas_spec_for_page(row, cover, 1), pretty=True)
            current_deck.write_json(split_spec, current_deck.canvas_spec_for_page(row, split, 4), pretty=True)
            for spec_path, svg_path in ((cover_spec, cover_svg), (split_spec, split_svg)):
                completed = subprocess.run(
                    [
                        "node",
                        (current_deck.SCRIPT_DIR / "artboard_renderer/render.mjs").as_posix(),
                        spec_path.as_posix(),
                        svg_path.as_posix(),
                    ],
                    cwd=current_deck.REPO_ROOT,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=False,
                )
                self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
            cover_text = cover_svg.read_text(encoding="utf-8")
            split_text = split_svg.read_text(encoding="utf-8")

        self.assertIn("PRESENTATION", cover_text)
        self.assertNotIn("IMAGE PLACEHOLDER", cover_text)
        self.assertIn("AUDIENCES", split_text)
        self.assertIn("IMAGE", split_text)
        self.assertIn("PLACEHOLDER", split_text)
        self.assertIn("RESEARCH", split_text)
        self.assertNotEqual(cover_text, split_text)

    def test_blue_professional_current_deck_has_no_text_overlap_or_canvas_escape(self) -> None:
        row = next(item for item in current_deck.matrix_rows() if item["family_id"] == "blue-professional")
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "current-svglide-decks"
            family = current_deck.build_family_deck(row, output_dir, render=True, pretty=True, workers=1)
            issues: list[dict[str, object]] = []
            font_issues: list[dict[str, object]] = []
            for page in family["pages"]:
                svg_path = current_deck.resolve_path(page["svg"])
                self.assertIsNotNone(svg_path)
                png_path = current_deck.resolve_path(page["png"])
                self.assertIsNotNone(png_path)
                self.assertTrue(png_path.is_file())
                self.assertEqual(page["png"], page["browser_preview"])
                self.assertEqual("resvg_png", page["browser_preview_kind"])
                issues.extend(svg_text_layout_issues(svg_path))
                font_issues.extend(svg_readability_font_issues(svg_path))

        self.assertEqual([], issues)
        self.assertEqual([], font_issues)

    def test_blue_professional_review_deck_uses_source_like_content_and_browser_safe_fonts(self) -> None:
        row = next(item for item in current_deck.matrix_rows() if item["family_id"] == "blue-professional")
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "current-svglide-decks"
            current_deck.build_family_deck(row, output_dir, render=True, pretty=True, workers=1)
            cover = (output_dir / "blue-professional/page-001-cover.svg").read_text(encoding="utf-8")
            agenda = (output_dir / "blue-professional/page-002-agenda.svg").read_text(encoding="utf-8")
            metrics = (output_dir / "blue-professional/page-003-metrics.svg").read_text(encoding="utf-8")
            dashboard = (output_dir / "blue-professional/page-004-dashboard.svg").read_text(encoding="utf-8")
            split = (output_dir / "blue-professional/page-005-split.svg").read_text(encoding="utf-8")
            bars = (output_dir / "blue-professional/page-006-bars.svg").read_text(encoding="utf-8")
            quote = (output_dir / "blue-professional/page-007-quote.svg").read_text(encoding="utf-8")
            timeline = (output_dir / "blue-professional/page-008-timeline.svg").read_text(encoding="utf-8")
            detail = (output_dir / "blue-professional/page-009-detail.svg").read_text(encoding="utf-8")
            closing = (output_dir / "blue-professional/page-010-closing.svg").read_text(encoding="utf-8")

        self.assertIn("Market", cover)
        self.assertIn("Strategic", cover)
        self.assertIn("Executive", agenda)
        self.assertIn("Summary", agenda)
        self.assertIn("73", metrics)
        self.assertIn("Bullish", metrics)
        self.assertIn("Current", dashboard)
        self.assertIn("perspectives", dashboard)
        self.assertIn("22", dashboard)
        self.assertIn("%", dashboard)
        self.assertIn("Growth", split)
        self.assertIn("sustainable", split)
        self.assertIn("Consumer", bars)
        self.assertIn("price", bars)
        self.assertIn("79", bars)
        self.assertIn("operational", quote)
        self.assertIn("discipline", quote)
        self.assertIn("Assess", timeline)
        self.assertIn("Resilience", timeline)
        self.assertIn("Changes", detail)
        self.assertIn("investment", detail)
        self.assertIn("Assuming", detail)
        self.assertIn("Thank", closing)
        self.assertIn("Download", closing)
        combined = cover + agenda + metrics + dashboard + split + bars + quote + timeline + detail + closing
        self.assertNotIn("BLUE PROFESSIONAL", combined)
        self.assertNotIn('font-family="svglide', combined)

    def test_bold_poster_review_deck_uses_source_like_content(self) -> None:
        row = next(item for item in current_deck.matrix_rows() if item["family_id"] == "bold-poster")
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "current-svglide-decks"
            current_deck.build_family_deck(row, output_dir, render=True, pretty=True, workers=1)
            hero = (output_dir / "bold-poster/page-001-hero.svg").read_text(encoding="utf-8")
            red = (output_dir / "bold-poster/page-002-red.svg").read_text(encoding="utf-8")
            summary = (output_dir / "bold-poster/page-003-summary.svg").read_text(encoding="utf-8")
            financial = (output_dir / "bold-poster/page-004-financial.svg").read_text(encoding="utf-8")
            stat = (output_dir / "bold-poster/page-005-stat.svg").read_text(encoding="utf-8")
            services = (output_dir / "bold-poster/page-006-services.svg").read_text(encoding="utf-8")
            roadmap = (output_dir / "bold-poster/page-007-roadmap.svg").read_text(encoding="utf-8")
            pillars = (output_dir / "bold-poster/page-008-pillars.svg").read_text(encoding="utf-8")
            global_page = (output_dir / "bold-poster/page-009-global.svg").read_text(encoding="utf-8")
            close = (output_dir / "bold-poster/page-010-close.svg").read_text(encoding="utf-8")

        self.assertIn("Apex", hero)
        self.assertIn("Group", hero)
        self.assertIn("infrastructure", red)
        self.assertIn("Executive", summary)
        self.assertIn("340", summary)
        self.assertIn("Financial", financial)
        self.assertIn("12.4M", financial)
        self.assertIn("96", stat)
        self.assertIn("Service", services)
        self.assertIn("Strategy", services)
        self.assertIn("Foundation", roadmap)
        self.assertIn("Clarity", pillars)
        self.assertIn("Global", global_page)
        self.assertIn("San", global_page)
        self.assertIn("Francisco", global_page)
        self.assertIn("Thank", close)
        combined = hero + red + summary + financial + stat + services + roadmap + pillars + global_page + close
        self.assertNotIn("BOLD POSTER", combined)
        self.assertNotIn("Generated for visual review", combined)
        self.assertNotIn('font-family="svglideboldposter', combined)
        self.assertIn('font-family="georgia"', combined)
        self.assertIn('font-family="trebuchet ms"', combined)


if __name__ == "__main__":
    unittest.main()
