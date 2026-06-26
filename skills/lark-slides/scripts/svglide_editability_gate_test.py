# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_editability_gate


EDITABLE_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide" slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <text slide:role="text" x="80" y="120" font-family="Source Sans Pro" font-size="48" font-weight="800">Title</text>
  <rect slide:role="shape" x="64" y="180" width="200" height="80" fill="#fff" />
</svg>
"""

FULL_PAGE_IMAGE_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide" slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <image slide:role="image" href="@./04-artboard/raw/page-001.visual.png" x="0" y="0" width="960" height="540" />
</svg>
"""

LOCAL_RASTER_ISLAND_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide" slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <text slide:role="text" x="80" y="120" font-family="Source Sans Pro" font-size="48" font-weight="800">Title</text>
  <rect slide:role="shape" x="64" y="180" width="200" height="80" fill="#fff" />
  <image slide:role="image" data-svglide-raster-island="true" href="@./04-svg/rasterized/page-001/island-001.png" x="120" y="260" width="120" height="80" />
</svg>
"""


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


class SVGlideEditabilityGateTest(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp())
        project = root / ".lark-slides" / "plan" / "demo"
        (project / "04-svg/prepared").mkdir(parents=True)
        (project / "08-readback").mkdir(parents=True)
        return project

    def write_readback(self, project: Path, content: str, *, status: str = "passed") -> None:
        write_json(project / "08-readback/readback-check.json", {"version": "svglide-readback/v1", "status": status})
        write_json(
            project / "08-readback/xml-presentations-get.json",
            {"json": {"data": {"xml_presentation": {"content": content}}}},
        )

    def test_gate_passes_when_prepared_text_reads_back_as_editable_shape(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(EDITABLE_SVG, encoding="utf-8")
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="text" width="300" height="80" topLeftX="80" topLeftY="96"><content>Title</content></shape>'
            '<shape type="rect" width="200" height="80" topLeftX="64" topLeftY="180"><content /></shape>'
            '<line width="100" height="1" topLeftX="50" topLeftY="50" />'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["prepared"]["totals"]["source_text_count"], 1)
        self.assertEqual(result["readback"]["editable_text_count"], 1)
        self.assertEqual(result["readback"]["editable_shape_count"], 1)
        self.assertEqual(result["readback"]["editable_line_count"], 1)
        self.assertEqual(result["summary"]["editable_text_count"], 1)
        self.assertEqual(result["summary"]["editable_shape_count"], 1)
        self.assertEqual(result["summary"]["editable_line_count"], 1)
        self.assertEqual(result["summary"]["image_only_page_count"], 0)
        self.assertEqual(result["summary"]["full_page_raster_count"], 0)
        self.assertEqual(result["summary"]["raster_area_ratio"], 0.0)
        self.assertTrue((project / "08-readback/editability-report.json").exists())

    def test_gate_rejects_prepared_full_page_raster(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(FULL_PAGE_IMAGE_SVG, encoding="utf-8")
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<image width="960" height="540" topLeftX="0" topLeftY="0" />'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertIn("prepared_not_full_page_raster", result["failed_checks"])
        self.assertIn("prepared_not_image_only", result["failed_checks"])
        self.assertIn("readback_not_full_page_raster", result["failed_checks"])
        self.assertIn("readback_not_image_only", result["failed_checks"])

    def test_gate_allows_small_local_raster_island_with_editable_text(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(LOCAL_RASTER_ISLAND_SVG, encoding="utf-8")
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="text" width="300" height="80" topLeftX="80" topLeftY="96"><content>Title</content></shape>'
            '<shape type="rect" width="200" height="80" topLeftX="64" topLeftY="180"><content /></shape>'
            '<image width="120" height="80" topLeftX="120" topLeftY="260" />'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["summary"]["local_raster_island_count"], 1)
        self.assertGreater(result["summary"]["local_raster_area_ratio_sum"], 0)
        self.assertNotIn("local_raster_page_area", result["failed_checks"])
        self.assertNotIn("local_raster_deck_area", result["failed_checks"])

    def test_gate_rejects_oversized_local_raster_island(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(
            LOCAL_RASTER_ISLAND_SVG.replace('width="120" height="80"', 'width="760" height="300"'),
            encoding="utf-8",
        )
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="text" width="300" height="80" topLeftX="80" topLeftY="96"><content>Title</content></shape>'
            '<image width="760" height="300" topLeftX="120" topLeftY="260" />'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertIn("local_raster_page_area", result["failed_checks"])
        self.assertIn("local_raster_deck_area", result["failed_checks"])

    def test_gate_rejects_zero_editable_text_when_source_has_text(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(EDITABLE_SVG, encoding="utf-8")
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="rect" width="200" height="80" topLeftX="64" topLeftY="180"><content /></shape>'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertIn("editable_text", result["failed_checks"])
        self.assertEqual(result["checks"]["editable_text"]["source_text_count"], 1)
        self.assertEqual(result["checks"]["editable_text"]["editable_text_count"], 0)

    def test_gate_fails_when_readback_failed(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(EDITABLE_SVG, encoding="utf-8")
        self.write_readback(project, "<presentation />", status="failed")

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertIn("readback_status", result["failed_checks"])

    def test_gate_uses_source_svg_when_prepared_svg_is_missing(self) -> None:
        project = self.make_project()
        (project / "04-svg/page-001.svg").write_text(EDITABLE_SVG, encoding="utf-8")
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="rect" width="200" height="80" topLeftX="64" topLeftY="180"><content /></shape>'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["prepared"]["pages"][0]["path"], "04-svg/page-001.svg")
        self.assertEqual(result["summary"]["source_text_count"], 1)
        self.assertIn("editable_text", result["failed_checks"])

    def test_gate_rejects_zero_editable_text_even_without_source_text(self) -> None:
        project = self.make_project()
        (project / "04-svg/prepared/page-001.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect x="0" y="0" width="100" height="100" /></svg>',
            encoding="utf-8",
        )
        self.write_readback(
            project,
            '<presentation width="960" height="540"><slide id="s1"><data>'
            '<shape type="rect" width="200" height="80" topLeftX="64" topLeftY="180"><content /></shape>'
            "</data></slide></presentation>",
        )

        result = svglide_editability_gate.run_editability_gate(project)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["summary"]["source_text_count"], 0)
        self.assertIn("editable_text", result["failed_checks"])


if __name__ == "__main__":
    unittest.main()
